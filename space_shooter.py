        """
Meteor Blaster - 2D Spaceship vs Meteors
=========================================
Controls:
  W / Arrow-Up   : Move ship up
  S / Arrow-Down : Move ship down
  SPACE (hold)   : Fire

Meteors approach from the right and move straight.
Collect glowing circular skill orbs that drift in to upgrade your ship!
You have 3 lives. Colliding with a meteor costs one life.
"""

import pygame
import random
import math
import sys
import struct

# ═══════════════════════════ CONSTANTS ═══════════════════════════
WIDTH, HEIGHT = 1000, 650
FPS = 60

# Palette
BLACK      = (  0,   0,   0)
WHITE      = (255, 255, 255)
YELLOW     = (255, 220,  50)
ORANGE     = (255, 140,   0)
RED        = (220,  40,  40)
DARK_RED   = (120,  10,  10)
CYAN       = (  0, 220, 255)
LIGHT_BLUE = (100, 180, 255)
GREEN      = ( 50, 200,  80)
GRAY       = (120, 120, 120)
DARK_GRAY  = ( 30,  30,  50)
PURPLE     = (160,  60, 220)
SILVER     = (180, 190, 200)

# Upgrade identifiers
UP_TRIPLE = "triple_shot"
UP_DAMAGE = "damage_boost"
UP_SPEED  = "speed_boost"
UP_RAPID  = "rapid_fire"
UP_SHIELD = "shield"

# (id, display label, icon, color, description)
UPGRADE_DEFS = [
    (UP_TRIPLE, "3x SHOT",     "3X",  CYAN,   "Fires 3 projectiles"),
    (UP_DAMAGE, "DAMAGE +50%", "DMG", ORANGE, "Higher damage"),
    (UP_SPEED,  "SPEED +30%",  "SPD", GREEN,  "Ship moves faster"),
    (UP_RAPID,  "RAPID FIRE",  "RPD", YELLOW, "Faster fire rate"),
    (UP_SHIELD, "SHIELD",      "SHD", PURPLE, "Absorb 1 collision"),
]


# ═══════════════════════════ SOUND (pure Python) ═════════════════
_SR = 44100


def _make_pcm(func, duration_ms, vol=0.35, decay=True):
    n = int(_SR * duration_ms / 1000)
    buf = bytearray(n * 2)
    for i in range(n):
        t = i / _SR
        v = func(t)
        env = 1.0 - i / n if decay else 1.0
        amp = max(-32768, min(32767, int(v * env * vol * 32767)))
        struct.pack_into('<h', buf, i * 2, amp)
    return buf


def _mono_to_stereo_sound(mono_buf):
    n_samples = len(mono_buf) // 2
    stereo = bytearray(n_samples * 4)
    for i in range(n_samples):
        s = mono_buf[i*2 : i*2+2]
        stereo[i*4 : i*4+2] = s
        stereo[i*4+2 : i*4+4] = s
    return pygame.mixer.Sound(buffer=stereo)


def build_sounds():
    try:
        sounds = {}

        def shoot_wave(t):
            freq = 300 + 1200 * t
            return math.sin(2 * math.pi * freq * t)
        sounds["shoot"] = _mono_to_stereo_sound(_make_pcm(shoot_wave, 110, 0.25, decay=True))

        def move_wave(t):
            return math.sin(2 * math.pi * 160 * t) * 0.6 + (random.random() * 2 - 1) * 0.4
        sounds["move"] = _mono_to_stereo_sound(_make_pcm(move_wave, 70, 0.12, decay=True))

        def explode_wave(t):
            thump = math.sin(2 * math.pi * 90 * t) * 0.4
            noise = (random.random() * 2 - 1) * 0.6
            return thump + noise
        sounds["explode"] = _mono_to_stereo_sound(_make_pcm(explode_wave, 380, 0.5, decay=True))

        def hit_wave(t):
            freq = 220 - 160 * t
            return math.sin(2 * math.pi * freq * t)
        sounds["hit"] = _mono_to_stereo_sound(_make_pcm(hit_wave, 200, 0.5, decay=True))

        notes = [523, 659, 784, 1047, 1318]
        seg_ms = 80
        total_ms = seg_ms * len(notes)
        def upgrade_wave(t):
            idx = min(int(t / (seg_ms / 1000)), len(notes) - 1)
            return math.sin(2 * math.pi * notes[idx] * t)
        sounds["upgrade"] = _mono_to_stereo_sound(_make_pcm(upgrade_wave, total_ms, 0.38, decay=False))

        return sounds
    except Exception:
        class _Silent:
            def play(self): pass
            def set_volume(self, v): pass
        d = _Silent()
        return {k: d for k in ("shoot", "move", "explode", "hit", "upgrade")}


# ═══════════════════════════ STAR FIELD ══════════════════════════
class StarField:
    def __init__(self, count=130):
        self.stars = [
            [random.uniform(0, WIDTH), random.uniform(0, HEIGHT),
             random.uniform(0.4, 2.2), random.uniform(0.4, 1.8)]
            for _ in range(count)
        ]

    def update(self):
        for s in self.stars:
            s[0] -= s[3]
            if s[0] < 0:
                s[0] = WIDTH
                s[1] = random.uniform(0, HEIGHT)

    def draw(self, surf):
        for x, y, size, speed in self.stars:
            b = int(80 + 175 * (speed / 1.8))
            pygame.draw.circle(surf, (b, b, b), (int(x), int(y)), max(1, int(size * 0.55)))


# ═══════════════════════════ PARTICLES ═══════════════════════════
class Particle:
    __slots__ = ('x', 'y', 'vx', 'vy', 'color', 'life', 'max_life', 'size')

    def __init__(self, x, y, color, speed=None, size=None, life=None):
        ang = random.uniform(0, 2 * math.pi)
        spd = speed or random.uniform(1.5, 5.5)
        self.x, self.y = float(x), float(y)
        self.vx = math.cos(ang) * spd
        self.vy = math.sin(ang) * spd
        self.color = color
        self.life = life or random.randint(18, 48)
        self.max_life = self.life
        self.size = size or random.uniform(2, 5)

    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.vx *= 0.93
        self.vy *= 0.93
        self.life -= 1

    def draw(self, surf):
        a = self.life / self.max_life
        r, g, b = self.color
        c = (int(r * a), int(g * a), int(b * a))
        s = max(1, int(self.size * a))
        pygame.draw.circle(surf, c, (int(self.x), int(self.y)), s)

    @property
    def dead(self):
        return self.life <= 0


# ═══════════════════════════ FLOATING TEXT ═══════════════════════
class FloatingText:
    def __init__(self, x, y, text, color=WHITE, size=20):
        self.x = float(x)
        self.y = float(y)
        self.text = text
        self.color = color
        self.life = 50
        self.max_life = 50
        self.font = pygame.font.SysFont("consolas", size, bold=True)

    def update(self):
        self.y -= 1.1
        self.life -= 1

    def draw(self, surf):
        if self.dead:
            return
        rendered = self.font.render(self.text, True, self.color)
        surf.blit(rendered, (int(self.x - rendered.get_width() // 2), int(self.y)))

    @property
    def dead(self):
        return self.life <= 0


# ═══════════════════════════ UPGRADE ORB (BENTUK BULAT) ══════════
class UpgradeOrb:
    RADIUS = 22

    def __init__(self, upgrade_def):
        self.kind, self.label, self.icon, self.color, self.desc = upgrade_def
        self.x = float(WIDTH + self.RADIUS + 10)
        self.y = float(random.uniform(120, HEIGHT - 120))
        self.speed = 1.6
        self.pulse = 0.0
        self.wobble = random.uniform(0, math.pi * 2)

    def update(self):
        self.x -= self.speed
        self.pulse += 0.08
        self.wobble += 0.04
        self.y += math.sin(self.wobble) * 0.45

    def draw(self, surf, font):
        cx, cy = int(self.x), int(self.y)
        pulse_r = int(self.RADIUS + 4 + math.sin(self.pulse) * 3)

        # Outer glowing ring
        pygame.draw.circle(surf, self.color, (cx, cy), pulse_r, 2)
        # Inner dark core
        pygame.draw.circle(surf, (15, 23, 42), (cx, cy), self.RADIUS)
        # Core border
        pygame.draw.circle(surf, self.color, (cx, cy), self.RADIUS, 2)
        # Inner highlight
        pygame.draw.circle(surf, WHITE, (cx - 5, cy - 5), 4)

        # Icon text
        txt = font.render(self.icon, True, WHITE)
        surf.blit(txt, txt.get_rect(center=(cx, cy)))

    @property
    def off_screen(self):
        return self.x < -self.RADIUS - 20


# ═══════════════════════════ SHIP ════════════════════════════════
class Ship:
    BODY_W = 60
    BODY_H = 30
    HITBOX_R = 18

    def __init__(self):
        self.x = 90
        self.y = HEIGHT // 2
        self.base_speed = 5.0
        self.speed_mult = 1.0

        self.triple      = False
        self.damage      = 1.0
        self.rapid_mult  = 1.0
        self.base_cd     = 18
        self.shoot_cd    = 0

        self.lives      = 3
        self.shield     = False
        self.invincible = 0

        self._surf         = self._build_surf()
        self._shield_pulse = 0.0
        self._move_snd_cd  = 0

    def _build_surf(self):
        w, h = self.BODY_W + 12, self.BODY_H + 12
        s = pygame.Surface((w, h), pygame.SRCALPHA)
        hull_pts = [(10, 6), (w - 2, h // 2), (10, h - 6)]
        pygame.draw.polygon(s, LIGHT_BLUE, hull_pts)
        pygame.draw.ellipse(s, CYAN, (28, h // 2 - 7, 22, 14))
        pygame.draw.rect(s, (60, 60, 80), (4, h // 2 - 6, 12, 12))
        return s

    @property
    def speed(self):
        return self.base_speed * self.speed_mult

    @property
    def cooldown(self):
        return max(5, int(self.base_cd * self.rapid_mult))

    def handle_input(self, keys, sounds):
        moved = False
        if keys[pygame.K_UP] or keys[pygame.K_w]:
            self.y -= self.speed
            moved = True
        if keys[pygame.K_DOWN] or keys[pygame.K_s]:
            self.y += self.speed
            moved = True
        self.y = max(self.BODY_H // 2 + 5, min(HEIGHT - self.BODY_H // 2 - 5, self.y))

        if moved and self._move_snd_cd <= 0:
            sounds["move"].play()
            self._move_snd_cd = 8
        if self._move_snd_cd > 0:
            self._move_snd_cd -= 1

    def try_shoot(self, sounds):
        if self.shoot_cd <= 0:
            self.shoot_cd = self.cooldown
            sounds["shoot"].play()
            tip_x = self.x + self.BODY_W - 4
            if self.triple:
                return [Bullet(tip_x, self.y, ang, self.damage) for ang in (-12, 0, 12)]
            return [Bullet(tip_x, self.y, 0, self.damage)]
        return []

    def update(self):
        if self.shoot_cd > 0:
            self.shoot_cd -= 1
        if self.invincible > 0:
            self.invincible -= 1
        self._shield_pulse = (self._shield_pulse + 0.1) % (2 * math.pi)

    def take_hit(self, sounds):
        if self.invincible > 0:
            return False
        if self.shield:
            self.shield = False
            self.invincible = 90
            sounds["hit"].play()
            return False
        sounds["hit"].play()
        self.lives -= 1
        self.invincible = 90
        return True

    def draw(self, surf):
        if self.invincible > 0 and (self.invincible // 5) % 2 == 0:
            return

        fl = random.randint(10, 22)
        ex = self.x - 8
        flame = [(ex + 4, self.y - 5), (ex - fl, self.y), (ex + 4, self.y + 5)]
        pygame.draw.polygon(surf, ORANGE, flame)
        inner = [(ex + 4, self.y - 2), (ex - fl // 2, self.y), (ex + 4, self.y + 2)]
        pygame.draw.polygon(surf, YELLOW, inner)

        bx = self.x - 8
        by = self.y - self.BODY_H // 2 - 6
        surf.blit(self._surf, (bx, by))

        if self.shield:
            pulse = int(2 + 2 * math.sin(self._shield_pulse))
            cx = int(self.x + 22)
            cy = int(self.y)
            pygame.draw.circle(surf, PURPLE, (cx, cy), 38 + pulse, 3)


# ═══════════════════════════ BULLET ══════════════════════════════
class Bullet:
    SPEED  = 14
    RADIUS = 5

    def __init__(self, x, y, angle_deg=0, damage=1.0):
        self.x = float(x)
        self.y = float(y)
        rad = math.radians(angle_deg)
        self.vx = math.cos(rad) * self.SPEED
        self.vy = math.sin(rad) * self.SPEED
        self.damage = damage
        self.trail: list[tuple[int, int]] = []

    def update(self):
        self.trail.append((int(self.x), int(self.y)))
        if len(self.trail) > 7:
            self.trail.pop(0)
        self.x += self.vx
        self.y += self.vy

    def draw(self, surf):
        color = CYAN if self.damage >= 1.5 else YELLOW
        for i, (tx, ty) in enumerate(self.trail):
            a = (i + 1) / len(self.trail)
            r = max(1, int(self.RADIUS * a * 0.6))
            pygame.draw.circle(surf, (int(color[0]*a), int(color[1]*a), int(color[2]*a)), (tx, ty), r)
        pygame.draw.circle(surf, color, (int(self.x), int(self.y)), self.RADIUS)
        pygame.draw.circle(surf, WHITE, (int(self.x), int(self.y)), self.RADIUS - 2)

    @property
    def off_screen(self):
        return not (-20 < self.x < WIDTH + 20 and -20 < self.y < HEIGHT + 20)


# ═══════════════════════════ METEOR (DARI KANAN, GERAK LURUS) ════
_METEOR_PALETTES = [
    (150, 100,  60),
    (110,  85,  70),
    (135, 115,  90),
    (165, 130,  80),
]


class Meteor:
    def __init__(self, difficulty=1.0):
        self.radius = random.randint(16, 44)

        base_hp = max(1, int(self.radius * 0.1 * difficulty))
        self.hp = base_hp
        self.max_hp = base_hp

        # Kecepatan perlahan meningkat seiring difficulty
        self.speed = min(random.uniform(1.4, 2.3 + difficulty * 0.55), 8.5)

        # SELALU DATANG DARI KANAN
        self.x = float(WIDTH + self.radius + 10)

        # Posisi Y bebas (atas, tengah, bawah)
        self.y = float(random.randint(self.radius + 15, HEIGHT - self.radius - 15))

        # GERAK LURUS KE KIRI (vy = 0)
        self.vy = 0.0

        self.angle = random.uniform(0, 360)
        self.rot_speed = random.uniform(-1.8, 1.8)

        self.color = (90, 60, 50) if self.max_hp >= 4 else random.choice(_METEOR_PALETTES)
        self._surf = self._build_surf()

    def _build_surf(self):
        d = self.radius * 2 + 4
        s = pygame.Surface((d, d), pygame.SRCALPHA)
        pts, num_pts = [], random.randint(7, 12)
        cx = cy = d // 2
        for i in range(num_pts):
            a = 2 * math.pi * i / num_pts + random.uniform(-0.2, 0.2)
            r = self.radius * random.uniform(0.72, 1.0)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
        pygame.draw.polygon(s, self.color, pts)
        for _ in range(random.randint(2, 5)):
            cr = random.randint(2, max(3, self.radius // 4))
            crx = random.randint(cr + 2, d - cr - 2)
            cry = random.randint(cr + 2, d - cr - 2)
            darker = tuple(max(0, c - 45) for c in self.color)
            pygame.draw.circle(s, darker, (crx, cry), cr)
        return s

    def update(self):
        # Gerak lurus ke kiri
        self.x -= self.speed
        self.angle = (self.angle + self.rot_speed) % 360

    def draw(self, surf):
        rotated = pygame.transform.rotate(self._surf, self.angle)
        rect = rotated.get_rect(center=(int(self.x), int(self.y)))
        surf.blit(rotated, rect)
        if self.max_hp > 1:
            bw = self.radius * 2
            bx = int(self.x) - self.radius
            by = int(self.y) - self.radius - 10
            pygame.draw.rect(surf, DARK_RED, (bx, by, bw, 5))
            pygame.draw.rect(surf, RED,      (bx, by, int(bw * self.hp / self.max_hp), 5))

    def hit(self, damage):
        self.hp -= damage
        return self.hp <= 0

    @property
    def off_screen(self):
        return self.x < -self.radius * 3


# ═══════════════════════════ HUD ═════════════════════════════════
def draw_heart(surf, x, y):
    r = 10
    pygame.draw.circle(surf, RED, (x + r // 2, y + r // 2), r // 2)
    pygame.draw.circle(surf, RED, (x + r + r // 2, y + r // 2), r // 2)
    pygame.draw.polygon(surf, RED,
                        [(x, y + r // 2), (x + r, y + r * 2), (x + r * 2, y + r // 2)])


def draw_hud(surf, ship, score, level, font_hud, font_sm):
    for i in range(ship.lives):
        draw_heart(surf, 15 + i * 32, 14)

    if ship.shield:
        pygame.draw.circle(surf, PURPLE, (115, 20), 10)
        pygame.draw.circle(surf, WHITE,  (115, 20),  7, 2)
        badge = font_sm.render("SHD", True, PURPLE)
        surf.blit(badge, (128, 13))

    sc_txt = font_hud.render(f"SCORE  {score:07d}", True, WHITE)
    surf.blit(sc_txt, sc_txt.get_rect(center=(WIDTH // 2, 16)))

    lv_txt = font_sm.render(f"LVL {level}", True, GRAY)
    surf.blit(lv_txt, (WIDTH - lv_txt.get_width() - 14, 14))

    indicators = []
    if ship.triple:           indicators.append(("3xSHOT", CYAN))
    if ship.damage > 1.0:     indicators.append((f"DMGx{ship.damage:.1f}", ORANGE))
    if ship.speed_mult > 1.0: indicators.append((f"SPDx{ship.speed_mult:.1f}", GREEN))
    if ship.rapid_mult < 1.0: indicators.append(("RAPID", YELLOW))

    ix = 14
    for txt, col in indicators:
        t = font_sm.render(txt, True, col)
        surf.blit(t, (ix, HEIGHT - 26))
        ix += t.get_width() + 10


def draw_title(surf, stars, font_title, font_hud, font_sm, tick):
    surf.fill(DARK_GRAY)
    stars.draw(surf)

    pulse = abs(math.sin(tick * 0.025)) * 25
    col = (int(80 + pulse * 7), int(170 + pulse * 2), 255)
    title = font_title.render("METEOR BLASTER", True, col)
    surf.blit(title, title.get_rect(center=(WIDTH // 2, HEIGHT // 3)))

    sub = font_hud.render("Survive the meteor storm!", True, SILVER)
    surf.blit(sub, sub.get_rect(center=(WIDTH // 2, HEIGHT // 3 + 68)))

    lines = [
        "W / Up-Arrow    : Gerak Atas",
        "S / Down-Arrow  : Gerak Bawah",
        "SPACE           : Tembak (Tahan untuk auto-fire)",
        "Tabrak bola skill bulat di tengah untuk upgrade!",
    ]
    for i, line in enumerate(lines):
        t = font_sm.render(line, True, GRAY)
        surf.blit(t, t.get_rect(center=(WIDTH // 2, HEIGHT // 2 + 20 + i * 28)))

    blink_col = WHITE if (tick // 30) % 2 == 0 else GRAY
    blink = font_hud.render("TEKAN SPACE UNTUK MULAI", True, blink_col)
    surf.blit(blink, blink.get_rect(center=(WIDTH // 2, HEIGHT * 3 // 4 + 28)))


def draw_gameover(surf, font_title, font_hud, font_sm, score, high_score, tick):
    overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
    overlay.fill((0, 0, 0, 185))
    surf.blit(overlay, (0, 0))

    go = font_title.render("GAME OVER", True, RED)
    surf.blit(go, go.get_rect(center=(WIDTH // 2, HEIGHT // 3 - 10)))

    sc = font_hud.render(f"Score : {score:,}", True, WHITE)
    surf.blit(sc, sc.get_rect(center=(WIDTH // 2, HEIGHT // 3 + 70)))

    hs = font_hud.render(f"Best  : {high_score:,}", True, YELLOW)
    surf.blit(hs, hs.get_rect(center=(WIDTH // 2, HEIGHT // 3 + 108)))

    blink_col = WHITE if (tick // 30) % 2 == 0 else GRAY
    blink = font_hud.render("TEKAN SPACE UNTUK RESTART", True, blink_col)
    surf.blit(blink, blink.get_rect(center=(WIDTH // 2, HEIGHT * 2 // 3)))


# ═══════════════════════════ MAIN GAME ═══════════════════════════
class Game:
    UPGRADE_INTERVAL = 1400  # ~23 detik sekali, tidak kebanyakan

    def __init__(self, screen, fonts, sounds):
        self.screen = screen
        self.sounds = sounds
        self.font_title, self.font_hud, self.font_sm = fonts
        self.state      = "title"
        self.high_score = 0
        self.tick       = 0
        self.stars      = StarField()
        self._reset()

    def _reset(self):
        self.ship          = Ship()
        self.bullets: list = []
        self.meteors: list = []
        self.particles: list = []
        self.upgrade_orbs: list = []
        self.floating_texts: list = []
        self.score         = 0
        self.level         = 1
        self.difficulty    = 1.0
        self.spawn_timer   = 0
        self.spawn_interval = 120
        self.diff_timer    = 0
        self.orb_timer     = 400
        self.stars         = StarField()
        self.tick          = 0

    def _apply_upgrade(self, kind):
        s = self.ship
        label = ""
        col = CYAN
        if kind == UP_TRIPLE:
            s.triple = True
            label = "+ TRIPLE SHOT!"
            col = CYAN
        elif kind == UP_DAMAGE:
            s.damage = round(min(s.damage + 0.5, 4.0), 1)
            label = f"+ DAMAGE UP ({s.damage}x)!"
            col = ORANGE
        elif kind == UP_SPEED:
            s.speed_mult = round(min(s.speed_mult + 0.3, 2.5), 1)
            label = f"+ SPEED UP ({s.speed_mult}x)!"
            col = GREEN
        elif kind == UP_RAPID:
            s.rapid_mult = round(max(s.rapid_mult - 0.2, 0.3), 1)
            label = "+ RAPID FIRE!"
            col = YELLOW
        elif kind == UP_SHIELD:
            s.shield = True
            label = "+ SHIELD ACTIVE!"
            col = PURPLE

        self.sounds["upgrade"].play()
        self.floating_texts.append(FloatingText(self.ship.x + 35, self.ship.y - 25, label, col))

    def _explode(self, x, y, color, count=20):
        for _ in range(count):
            self.particles.append(Particle(x, y, color))

    def _handle_collisions(self):
        dead_bullets = set()
        dead_meteors = set()
        dead_orbs    = set()

        # Bullets vs Meteors
        for bi, bullet in enumerate(self.bullets):
            if bi in dead_bullets:
                continue
            for mi, meteor in enumerate(self.meteors):
                if mi in dead_meteors:
                    continue
                dist = math.hypot(bullet.x - meteor.x, bullet.y - meteor.y)
                if dist < meteor.radius + bullet.RADIUS:
                    dead_bullets.add(bi)
                    if meteor.hit(bullet.damage):
                        dead_meteors.add(mi)
                        pts = max(10, int(meteor.radius * meteor.max_hp * 5))
                        self.score += pts
                        self._explode(meteor.x, meteor.y, meteor.color, 26)
                        self.sounds["explode"].play()
                    else:
                        self._explode(bullet.x, bullet.y, YELLOW, 5)
                    break

        # Ship vs Upgrade Orbs
        sx, sy = self.ship.x + 20, self.ship.y
        for oi, orb in enumerate(self.upgrade_orbs):
            if oi in dead_orbs:
                continue
            if math.hypot(sx - orb.x, sy - orb.y) < orb.RADIUS + Ship.HITBOX_R + 8:
                dead_orbs.add(oi)
                self._apply_upgrade(orb.kind)
                self._explode(orb.x, orb.y, orb.color, 28)

        # Ship vs Meteors
        for mi, meteor in enumerate(self.meteors):
            if mi in dead_meteors:
                continue
            if math.hypot(sx - meteor.x, sy - meteor.y) < meteor.radius + Ship.HITBOX_R:
                dead_meteors.add(mi)
                self._explode(meteor.x, meteor.y, RED, 32)
                self.sounds["explode"].play()
                self.ship.take_hit(self.sounds)
                if self.ship.lives <= 0:
                    self.state = "gameover"
                    if self.score > self.high_score:
                        self.high_score = self.score
                break

        self.bullets      = [b for i, b in enumerate(self.bullets)      if i not in dead_bullets]
        self.meteors      = [m for i, m in enumerate(self.meteors)      if i not in dead_meteors]
        self.upgrade_orbs = [o for i, o in enumerate(self.upgrade_orbs) if i not in dead_orbs]

    def update(self):
        self.tick += 1
        self.stars.update()

        if self.state == "title":
            return

        if self.state == "gameover":
            for p in self.particles:
                p.update()
            self.particles = [p for p in self.particles if not p.dead]
            return

        keys = pygame.key.get_pressed()
        self.ship.handle_input(keys, self.sounds)
        self.ship.update()

        if keys[pygame.K_SPACE]:
            self.bullets.extend(self.ship.try_shoot(self.sounds))

        for b in self.bullets:
            b.update()
        self.bullets = [b for b in self.bullets if not b.off_screen]

        # Meteor spawn (selalu dari kanan)
        self.spawn_timer += 1
        if self.spawn_timer >= self.spawn_interval:
            self.spawn_timer = 0
            self.meteors.append(Meteor(difficulty=self.difficulty))
            if self.difficulty > 2.5 and random.random() < 0.3:
                self.meteors.append(Meteor(difficulty=self.difficulty))

        # Skill Orb spawn (muncul di tengah, berkala, tidak kebanyakan)
        if len(self.upgrade_orbs) == 0:
            self.orb_timer += 1
            if self.orb_timer >= self.UPGRADE_INTERVAL:
                self.orb_timer = 0
                pick = random.choice(UPGRADE_DEFS)
                self.upgrade_orbs.append(UpgradeOrb(pick))

        for orb in self.upgrade_orbs:
            orb.update()
        self.upgrade_orbs = [o for o in self.upgrade_orbs if not o.off_screen]

        # Difficulty ramp
        self.diff_timer += 1
        if self.diff_timer >= FPS * 10:
            self.diff_timer = 0
            self.difficulty = min(self.difficulty + 0.22, 6.0)
            self.spawn_interval = max(26, self.spawn_interval - 7)
            self.level += 1

        for m in self.meteors:
            m.update()
        self.meteors = [m for m in self.meteors if not m.off_screen]

        for p in self.particles:
            p.update()
        self.particles = [p for p in self.particles if not p.dead]

        for ft in self.floating_texts:
            ft.update()
        self.floating_texts = [ft for ft in self.floating_texts if not ft.dead]

        self._handle_collisions()

    def handle_event(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE:
                if self.state in ("title", "gameover"):
                    self._reset()
                    self.state = "playing"

    def draw(self):
        self.screen.fill(DARK_GRAY)
        self.stars.draw(self.screen)

        if self.state == "title":
            draw_title(self.screen, self.stars, self.font_title,
                       self.font_hud, self.font_sm, self.tick)
            return

        for m in self.meteors:
            m.draw(self.screen)

        # Draw circular upgrade orbs
        for orb in self.upgrade_orbs:
            orb.draw(self.screen, self.font_sm)

        for b in self.bullets:
            b.draw(self.screen)
        for p in self.particles:
            p.draw(self.screen)
        self.ship.draw(self.screen)

        for ft in self.floating_texts:
            ft.draw(self.screen)

        draw_hud(self.screen, self.ship, self.score, self.level,
                 self.font_hud, self.font_sm)

        if self.state == "gameover":
            draw_gameover(self.screen, self.font_title, self.font_hud,
                          self.font_sm, self.score, self.high_score, self.tick)


# ═══════════════════════════ ENTRY POINT ═════════════════════════
def main():
    pygame.init()
    pygame.mixer.init(frequency=_SR, size=-16, channels=2, buffer=512)

    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption("Meteor Blaster")
    clock  = pygame.time.Clock()

    font_title = pygame.font.SysFont("impact",   64)
    font_hud   = pygame.font.SysFont("consolas", 26)
    font_sm    = pygame.font.SysFont("consolas", 18)
    fonts = (font_title, font_hud, font_sm)

    sounds = build_sounds()
    game   = Game(screen, fonts, sounds)

    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            game.handle_event(event)

        game.update()
        game.draw()
        pygame.display.flip()
        clock.tick(FPS)


if __name__ == "__main__":
    main()
