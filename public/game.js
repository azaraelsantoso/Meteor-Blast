'use strict';

// ═══════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════
const WIDTH  = 1000;
const HEIGHT = 650;

// Upgrade identifiers
const UP_TRIPLE = 'triple_shot';
const UP_DAMAGE = 'damage_boost';
const UP_SPEED  = 'speed_boost';
const UP_RAPID  = 'rapid_fire';
const UP_SHIELD = 'shield';

const UPGRADE_DEFS = [
  { kind: UP_TRIPLE, label: '3× SHOT',     icon: '3×',  color: '#00dcff', desc: 'Fires 3 projectiles'     },
  { kind: UP_DAMAGE, label: 'DAMAGE +50%', icon: 'DMG', color: '#ff8c00', desc: 'Higher projectile damage' },
  { kind: UP_SPEED,  label: 'SPEED +30%',  icon: 'SPD', color: '#32c850', desc: 'Ship moves faster'        },
  { kind: UP_RAPID,  label: 'RAPID FIRE',  icon: '⚡',  color: '#ffdc32', desc: 'Faster firing rate'       },
  { kind: UP_SHIELD, label: 'SHIELD',      icon: '🛡️',  color: '#a03cdc', desc: 'Absorbs 1 collision'      },
];

const METEOR_PALETTES = ['#966432', '#6e5546', '#87735a', '#a58250'];

// ═══════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════
const randInt   = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const randFloat = (lo, hi) => Math.random() * (hi - lo) + lo;
const choice    = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp     = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function darkenHex(hex, amt = 50) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.max(0,r-amt)},${Math.max(0,g-amt)},${Math.max(0,b-amt)})`;
}

// ═══════════════════════════════════════════════════════════
//  SOUND ENGINE  (Web Audio API — zero external files)
// ═══════════════════════════════════════════════════════════
class SoundEngine {
  constructor() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      this.ctx = null;
    }
    this._moveCd = 0;
  }

  unlock() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  _gain(vol, t, dur) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.linearRampToValueAtTime(0, t + dur);
    g.connect(this.ctx.destination);
    return g;
  }

  shoot() {
    if (!this.ctx) return;
    this.unlock();
    const t   = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g   = this._gain(0.2, t, 0.12);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.linearRampToValueAtTime(1050, t + 0.10);
    osc.connect(g);
    osc.start(t); osc.stop(t + 0.13);
  }

  move() {
    if (!this.ctx || this._moveCd > 0) return;
    this._moveCd = 8;
    this.unlock();
    const t   = this.ctx.currentTime;
    const dur = 0.07;
    const sr  = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, Math.ceil(sr * dur), sr);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.45;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const flt = this.ctx.createBiquadFilter();
    flt.type = 'lowpass'; flt.frequency.value = 400;
    const g = this._gain(0.07, t, dur);
    src.connect(flt); flt.connect(g);
    src.start(t);
  }

  explode(heavy = false) {
    if (!this.ctx) return;
    this.unlock();
    const t   = this.ctx.currentTime;
    const dur = heavy ? 0.65 : 0.42;
    const sr  = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, Math.ceil(sr * dur), sr);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const env = 1 - i / d.length;
      d[i] = (Math.random() * 2 - 1) * env * (heavy ? 1.0 : 0.85);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const flt = this.ctx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.value = heavy ? 340 : 520;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(heavy ? 0.75 : 0.55, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    g.connect(this.ctx.destination);
    src.connect(flt); flt.connect(g);
    src.start(t);
  }

  hit() {
    if (!this.ctx) return;
    this.unlock();
    const t   = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g   = this._gain(0.55, t, 0.22);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(230, t);
    osc.frequency.linearRampToValueAtTime(50, t + 0.2);
    osc.connect(g);
    osc.start(t); osc.stop(t + 0.24);
  }

  upgrade() {
    if (!this.ctx) return;
    this.unlock();
    const now = this.ctx.currentTime;
    [523, 659, 784, 1047, 1318].forEach((freq, i) => {
      const t   = now + i * 0.08;
      const osc = this.ctx.createOscillator();
      const g   = this._gain(0.28, t, 0.18);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.connect(g);
      osc.start(t); osc.stop(t + 0.2);
    });
  }

  tick() { if (this._moveCd > 0) this._moveCd--; }
}

// ═══════════════════════════════════════════════════════════
//  STAR FIELD
// ═══════════════════════════════════════════════════════════
class StarField {
  constructor(count = 140) {
    this.stars = Array.from({ length: count }, () => ({
      x:     randFloat(0, WIDTH),
      y:     randFloat(0, HEIGHT),
      size:  randFloat(0.4, 2.4),
      speed: randFloat(0.4, 2.0),
    }));
  }

  update() {
    for (const s of this.stars) {
      s.x -= s.speed;
      if (s.x < 0) { s.x = WIDTH; s.y = randFloat(0, HEIGHT); }
    }
  }

  draw(ctx) {
    for (const { x, y, size, speed } of this.stars) {
      const b = Math.floor(70 + 185 * (speed / 2.0));
      ctx.fillStyle = `rgb(${b},${b},${b})`;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.5, size * 0.55), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ═══════════════════════════════════════════════════════════
//  FLOATING TEXT
// ═══════════════════════════════════════════════════════════
class FloatingText {
  constructor(x, y, text, color = '#ffffff', fontSize = 16) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.fontSize = fontSize;
    this.life = 50;
    this.maxLife = 50;
  }

  update() {
    this.y -= 1.1;
    this.life--;
  }

  draw(ctx) {
    const a = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.font = `bold ${this.fontSize}px Consolas, monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(0,0,0,${(a * 0.8).toFixed(2)})`;
    ctx.fillText(this.text, this.x + 1, this.y + 1);
    const { r, g, b } = hexToRgb(this.color);
    ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(2)})`;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }

  get dead() { return this.life <= 0; }
}

// ═══════════════════════════════════════════════════════════
//  PARTICLE
// ═══════════════════════════════════════════════════════════
class Particle {
  constructor(x, y, hexColor, { speed, size, life } = {}) {
    const ang     = randFloat(0, Math.PI * 2);
    const spd     = speed ?? randFloat(1.5, 6.0);
    this.x        = x; this.y = y;
    this.vx       = Math.cos(ang) * spd;
    this.vy       = Math.sin(ang) * spd;
    this.rgb      = hexToRgb(hexColor);
    this.life     = life ?? randInt(18, 48);
    this.maxLife  = this.life;
    this.size     = size ?? randFloat(2, 5.5);
  }

  update() {
    this.x += this.vx; this.y += this.vy;
    this.vx *= 0.93;   this.vy *= 0.93;
    this.life--;
  }

  draw(ctx) {
    const a = this.life / this.maxLife;
    const { r, g, b } = this.rgb;
    ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(1, this.size * a), 0, Math.PI * 2);
    ctx.fill();
  }

  get dead() { return this.life <= 0; }
}

// ═══════════════════════════════════════════════════════════
//  CIRCULAR SKILL UPGRADE ORB (BULAT MUNCUL DI TENGAH)
// ═══════════════════════════════════════════════════════════
class UpgradeOrb {
  constructor(upgradeDef) {
    this.def = upgradeDef;
    this.radius = 22;

    this.x = WIDTH + this.radius + 10;
    this.y = randFloat(120, HEIGHT - 120);

    this.speedX = 1.6;
    this.pulse = 0;
    this.wobble = randFloat(0, Math.PI * 2);
  }

  update() {
    this.x -= this.speedX;
    this.pulse += 0.08;
    this.wobble += 0.04;
    this.y += Math.sin(this.wobble) * 0.45;
  }

  draw(ctx) {
    const p = Math.sin(this.pulse);
    const glowR = this.radius + 8 + p * 3;
    const { r, g, b } = hexToRgb(this.def.color);

    ctx.save();

    // Outer glow
    const grad = ctx.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, glowR + 8);
    grad.addColorStop(0, `rgba(${r},${g},${b},0.85)`);
    grad.addColorStop(0.6, `rgba(${r},${g},${b},0.35)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, glowR + 8, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.shadowBlur = 18;
    ctx.shadowColor = this.def.color;
    ctx.strokeStyle = this.def.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Highlight ring
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius - 4, this.pulse, this.pulse + Math.PI * 1.3);
    ctx.stroke();

    // Icon
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.def.icon, this.x, this.y);

    ctx.restore();
  }

  get offScreen() {
    return this.x < -this.radius - 20;
  }
}

// ═══════════════════════════════════════════════════════════
//  SHIP
// ═══════════════════════════════════════════════════════════
class Ship {
  static BODY_W   = 60;
  static BODY_H   = 30;
  static HITBOX_R = 18;

  constructor() {
    this.x = 90;
    this.y = HEIGHT / 2;

    this.baseSpeed = 5;
    this.speedMult = 1;

    this.triple    = false;
    this.damage    = 1;
    this.rapidMult = 1;
    this.baseCd    = 18;
    this.shootCd   = 0;

    this.lives      = 3;
    this.shield     = false;
    this.invincible = 0;

    this.shieldPulse = 0;
    this._flameTick  = 0;
  }

  get speed()    { return this.baseSpeed * this.speedMult; }
  get cooldown() { return Math.max(5, Math.floor(this.baseCd * this.rapidMult)); }

  handleInput(keys, snd) {
    let moved = false;
    if (keys['ArrowUp']   || keys['KeyW']) { this.y -= this.speed; moved = true; }
    if (keys['ArrowDown'] || keys['KeyS']) { this.y += this.speed; moved = true; }
    this.y = clamp(this.y, Ship.BODY_H / 2 + 5, HEIGHT - Ship.BODY_H / 2 - 5);
    if (moved) snd.move();
  }

  tryShoot(snd) {
    if (this.shootCd > 0) return [];
    this.shootCd = this.cooldown;
    snd.shoot();
    const tx = this.x + Ship.BODY_W - 4;
    return this.triple
      ? [-12, 0, 12].map(a => new Bullet(tx, this.y, a, this.damage))
      : [new Bullet(tx, this.y, 0, this.damage)];
  }

  update() {
    if (this.shootCd    > 0) this.shootCd--;
    if (this.invincible > 0) this.invincible--;
    this.shieldPulse = (this.shieldPulse + 0.1) % (Math.PI * 2);
    this._flameTick  = (this._flameTick  + 0.3) % (Math.PI * 2);
  }

  takeHit(snd) {
    if (this.invincible > 0) return false;
    snd.hit();
    if (this.shield) {
      this.shield = false;
      this.invincible = 90;
      return false;
    }
    this.lives--;
    this.invincible = 90;
    return true;
  }

  draw(ctx) {
    if (this.invincible > 0 && Math.floor(this.invincible / 5) % 2 === 0) return;

    const fl = 10 + 8 * Math.abs(Math.sin(this._flameTick)) + randFloat(0, 4);
    const ex = this.x - 8;

    ctx.fillStyle = '#ff8c00';
    ctx.beginPath();
    ctx.moveTo(ex + 4, this.y - 6);
    ctx.lineTo(ex - fl, this.y);
    ctx.lineTo(ex + 4, this.y + 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffdc32';
    ctx.beginPath();
    ctx.moveTo(ex + 4, this.y - 2.5);
    ctx.lineTo(ex - fl * 0.55, this.y);
    ctx.lineTo(ex + 4, this.y + 2.5);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.shadowBlur  = 16;
    ctx.shadowColor = '#64b4ff';

    const bx = this.x - 8;
    const by = this.y;
    ctx.fillStyle = '#64b4ff';
    ctx.beginPath();
    ctx.moveTo(bx,                    by - Ship.BODY_H / 2);
    ctx.lineTo(bx + Ship.BODY_W,      by);
    ctx.lineTo(bx,                    by + Ship.BODY_H / 2);
    ctx.closePath();
    ctx.fill();

    ctx.shadowColor = '#00dcff';
    ctx.fillStyle   = '#00dcff';
    ctx.beginPath();
    ctx.ellipse(bx + 24, by - 2, 13, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle  = '#3c3c5a';
    ctx.fillRect(bx - 2, by - 7, 10, 14);

    ctx.restore();

    if (this.shield) {
      const pulse = 2 + 2 * Math.sin(this.shieldPulse);
      ctx.save();
      ctx.shadowBlur  = 24;
      ctx.shadowColor = '#a03cdc';
      ctx.strokeStyle = '#a03cdc';
      ctx.lineWidth   = 3;
      ctx.beginPath();
      ctx.arc(this.x + 22, this.y, 40 + pulse, 0, Math.PI * 2);
      ctx.stroke();

      const grd = ctx.createRadialGradient(
        this.x + 22, this.y, 20,
        this.x + 22, this.y, 44 + pulse,
      );
      grd.addColorStop(0, 'rgba(160,60,220,0)');
      grd.addColorStop(1, 'rgba(160,60,220,0.18)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(this.x + 22, this.y, 44 + pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }
}

// ═══════════════════════════════════════════════════════════
//  BULLET
// ═══════════════════════════════════════════════════════════
class Bullet {
  static SPEED  = 14;
  static RADIUS = 5;

  constructor(x, y, angleDeg = 0, damage = 1) {
    this.x = x; this.y = y;
    const r  = (angleDeg * Math.PI) / 180;
    this.vx  = Math.cos(r) * Bullet.SPEED;
    this.vy  = Math.sin(r) * Bullet.SPEED;
    this.damage = damage;
    this.trail  = [];

    if (damage >= 2.5) {
      this.color = '#c850ff';
      this.glow  = '#c850ff';
    } else if (damage >= 1.5) {
      this.color = '#00dcff';
      this.glow  = '#00dcff';
    } else {
      this.color = '#ffdc32';
      this.glow  = '#ffdc32';
    }
  }

  update() {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 7) this.trail.shift();
    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx) {
    const rgb = hexToRgb(this.color);
    for (let i = 0; i < this.trail.length; i++) {
      const a = (i + 1) / this.trail.length;
      const r = Math.max(1, Bullet.RADIUS * a * 0.6);
      ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${a.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(this.trail[i].x, this.trail[i].y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.save();
    ctx.shadowBlur  = 14;
    ctx.shadowColor = this.glow;
    ctx.fillStyle   = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Bullet.RADIUS + (this.damage > 1.5 ? 1 : 0), 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle  = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, Bullet.RADIUS - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  get offScreen() {
    return this.x < -20 || this.x > WIDTH + 20 || this.y < -20 || this.y > HEIGHT + 20;
  }
}

// ═══════════════════════════════════════════════════════════
//  METEOR  (Selalu dari kanan, gerak lurus ke kiri)
// ═══════════════════════════════════════════════════════════
class Meteor {
  constructor(difficulty = 1) {
    const roll = Math.random();
    if (difficulty >= 1.5 && roll < 0.28) {
      this.type = 'fast';
      this.radius = randInt(14, 22);
      this.speed = Math.min(2.8 + difficulty * 0.55, 9.0);
      this.hp = Math.max(1, Math.floor(this.radius * 0.08 * difficulty));
      this.colorStr = '#ff4d4d';
    } else if (difficulty >= 2.0 && roll > 0.80) {
      this.type = 'tank';
      this.radius = randInt(35, 48);
      this.speed = Math.min(1.2 + difficulty * 0.35, 4.5);
      this.hp = Math.max(4, Math.floor(this.radius * 0.16 * difficulty));
      this.colorStr = '#3c283c';
    } else {
      this.type = 'normal';
      this.radius = randInt(18, 38);
      this.speed = Math.min(1.4 + difficulty * 0.5, 7.5);
      this.hp = Math.max(1, Math.floor(this.radius * 0.1 * difficulty));
      this.colorStr = choice(METEOR_PALETTES);
    }

    this.maxHp = this.hp;

    // SELALU DARI KANAN
    this.x = WIDTH + this.radius + 10;
    this.y = randFloat(this.radius + 15, HEIGHT - this.radius - 15);
    this.vy = 0;

    this.angle    = randFloat(0, Math.PI * 2);
    this.rotSpeed = randFloat(-0.03, 0.03);

    this.darkerStr = darkenHex(this.colorStr, 50);

    this._verts   = this._genVerts();
    this._craters = this._genCraters();
  }

  _genVerts() {
    const pts = [];
    const n   = randInt(7, 12);
    for (let i = 0; i < n; i++) {
      const a = (2 * Math.PI * i / n) + randFloat(-0.2, 0.2);
      const r = this.radius * randFloat(0.74, 1.0);
      pts.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
    }
    return pts;
  }

  _genCraters() {
    return Array.from({ length: randInt(2, 5) }, () => {
      const r    = randInt(2, Math.max(3, Math.floor(this.radius / 4)));
      const ang  = randFloat(0, Math.PI * 2);
      const dist = randFloat(0, this.radius * 0.6);
      return { x: dist * Math.cos(ang), y: dist * Math.sin(ang), r };
    });
  }

  update() {
    this.x -= this.speed;
    this.angle = (this.angle + this.rotSpeed) % (Math.PI * 2);
  }

  draw(ctx) {
    if (this.type === 'fast') {
      const tLen = this.radius * 1.5;
      ctx.save();
      ctx.fillStyle = 'rgba(255, 100, 20, 0.35)';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.radius * 0.6);
      ctx.lineTo(this.x + tLen, this.y);
      ctx.lineTo(this.x, this.y + this.radius * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    ctx.fillStyle = this.colorStr;
    ctx.beginPath();
    ctx.moveTo(this._verts[0].x, this._verts[0].y);
    for (let i = 1; i < this._verts.length; i++)
      ctx.lineTo(this._verts[i].x, this._verts[i].y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = this.darkerStr;
    for (const c of this._craters) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    if (this.maxHp > 1) {
      const bw = this.radius * 2;
      const bx = this.x - this.radius;
      const by = this.y - this.radius - 10;
      ctx.fillStyle = '#7a0a0a';
      ctx.fillRect(bx, by, bw, 5);
      ctx.fillStyle = '#dc2828';
      ctx.fillRect(bx, by, bw * this.hp / this.maxHp, 5);
    }
  }

  hit(dmg) { this.hp -= dmg; return this.hp <= 0; }

  get offScreen() {
    return this.x < -this.radius * 3;
  }
}

// ═══════════════════════════════════════════════════════════
//  LEADERBOARD CLIENT MANAGER (SUPABASE INTEGRATION)
// ═══════════════════════════════════════════════════════════
const LeaderboardUI = {
  modalLeaderboard: document.getElementById('modal-leaderboard'),
  modalSubmit:      document.getElementById('modal-submit-score'),
  tbody:            document.getElementById('leaderboard-body'),
  statusText:       document.getElementById('status-text'),
  statusDot:        document.querySelector('.status-dot'),
  nameInput:        document.getElementById('pilot-name-input'),
  scoreDisplay:     document.getElementById('submit-score-display'),
  levelDisplay:     document.getElementById('submit-level-display'),
  scoreForm:        document.getElementById('score-form'),

  currentPendingScore: 0,
  currentPendingLevel: 1,

  init() {
    // Buttons
    document.getElementById('btn-open-leaderboard').addEventListener('click', () => this.openLeaderboard());
    document.getElementById('btn-close-leaderboard').addEventListener('click', () => this.closeLeaderboard());
    document.getElementById('btn-close-leaderboard-2').addEventListener('click', () => this.closeLeaderboard());
    document.getElementById('btn-refresh-leaderboard').addEventListener('click', () => this.fetchLeaderboard());

    document.getElementById('btn-close-submit').addEventListener('click', () => this.closeSubmit());
    document.getElementById('btn-skip-submit').addEventListener('click', () => this.closeSubmit());

    this.scoreForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitScore();
    });

    // Pre-fill name from localStorage
    const savedName = localStorage.getItem('pilot_name') || 'PILOT-1';
    if (this.nameInput) this.nameInput.value = savedName;

    // Check status once on load
    this.checkStatus();
  },

  isOpen() {
    return (
      this.modalLeaderboard.classList.contains('active') ||
      this.modalSubmit.classList.contains('active')
    );
  },

  async checkStatus() {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (data.configured) {
        this.statusDot.className = 'status-dot';
        this.statusText.textContent = '🟢 Terhubung ke Supabase Cloud';
      } else {
        this.statusDot.className = 'status-dot yellow';
        this.statusText.textContent = '🟡 Mode Lokal (.env Supabase belum diisi)';
      }
    } catch {
      this.statusDot.className = 'status-dot yellow';
      this.statusText.textContent = '🟡 Offline / Server Lokal';
    }
  },

  async fetchLeaderboard() {
    this.tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Memuat data ranking...</td></tr>';

    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();

      if (data.configured) {
        this.statusDot.className = 'status-dot';
        this.statusText.textContent = '🟢 Terhubung ke Supabase Cloud';
      } else {
        this.statusDot.className = 'status-dot yellow';
        this.statusText.textContent = '🟡 Mode Lokal (Isi .env untuk Supabase Cloud)';
      }

      const scores = data.scores || [];
      if (scores.length === 0) {
        this.tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Belum ada skor yang tercatat. Jadilah yang pertama!</td></tr>';
        return;
      }

      this.tbody.innerHTML = scores.map((item, idx) => {
        let rankBadge = `${idx + 1}`;
        let rankClass = '';
        if (idx === 0) { rankBadge = '🥇 1'; rankClass = 'rank-1'; }
        else if (idx === 1) { rankBadge = '🥈 2'; rankClass = 'rank-2'; }
        else if (idx === 2) { rankBadge = '🥉 3'; rankClass = 'rank-3'; }

        return `
          <tr>
            <td class="${rankClass}">${rankBadge}</td>
            <td style="font-weight: bold; letter-spacing: 0.5px;">${escapeHtml(item.player_name || 'PILOT')}</td>
            <td style="text-align: right;" class="score-cell">${(item.score || 0).toLocaleString()}</td>
            <td style="text-align: right; color: #a0aec0;">Lv ${item.level || 1}</td>
          </tr>
        `;
      }).join('');

    } catch (err) {
      this.tbody.innerHTML = `<tr><td colspan="4" class="empty-state" style="color: #ff4d4d;">Gagal memuat ranking: ${err.message}</td></tr>`;
    }
  },

  openLeaderboard() {
    this.modalSubmit.classList.remove('active');
    this.modalLeaderboard.classList.add('active');
    this.fetchLeaderboard();
  },

  closeLeaderboard() {
    this.modalLeaderboard.classList.remove('active');
  },

  promptSubmit(score, level) {
    this.currentPendingScore = score;
    this.currentPendingLevel = level;
    this.scoreDisplay.textContent = score.toLocaleString();
    this.levelDisplay.textContent = `LEVEL ${level}`;

    this.modalLeaderboard.classList.remove('active');
    this.modalSubmit.classList.add('active');

    setTimeout(() => {
      if (this.nameInput) {
        this.nameInput.focus();
        this.nameInput.select();
      }
    }, 100);
  },

  closeSubmit() {
    this.modalSubmit.classList.remove('active');
  },

  async submitScore() {
    const rawName = (this.nameInput.value || '').trim() || 'PILOT-1';
    const pilotName = rawName.slice(0, 16);
    localStorage.setItem('pilot_name', pilotName);

    const submitBtn = document.getElementById('btn-confirm-submit');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Menyimpan...';
    submitBtn.disabled = true;

    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_name: pilotName,
          score: this.currentPendingScore,
          level: this.currentPendingLevel
        })
      });

      const data = await res.json();
      this.closeSubmit();
      this.openLeaderboard();
    } catch (err) {
      alert(`Gagal mengirim skor: ${err.message}`);
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }
};

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ═══════════════════════════════════════════════════════════
//  GAME ENGINE
// ═══════════════════════════════════════════════════════════
class Game {
  static UPGRADE_SPAWN_INTERVAL = 1400; // ~23 detik sekali
  static MAX_PARTICLES          = 400;

  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.snd    = new SoundEngine();

    this.state     = 'title';
    this.isPaused  = false;
    this.highScore = parseInt(localStorage.getItem('meteor_high_score') || '0', 10);
    this.tick      = 0;
    this.keys      = {};
    this.shake     = 0;

    this.floatingTexts = [];
    this.stars = new StarField();
    this.hasPromptedScore = false;
    this._reset();
  }

  _reset() {
    this.ship          = new Ship();
    this.bullets       = [];
    this.meteors       = [];
    this.particles     = [];
    this.upgradeOrbs   = [];
    this.floatingTexts = [];
    this.score         = 0;
    this.level         = 1;
    this.difficulty    = 1;
    this.spawnTimer    = 0;
    this.spawnInterval = 120;
    this.diffTimer     = 0;
    this.orbSpawnTimer = 400;
    this.stars         = new StarField();
    this.shake         = 0;
    this.tick          = 0;
    this.isPaused      = false;
    this.hasPromptedScore = false;
  }

  _applyUpgrade(kind) {
    const s = this.ship;
    let label = '';
    let col = '#00dcff';

    if (kind === UP_TRIPLE) {
      s.triple = true;
      label = '+ TRIPLE SHOT!';
      col = '#00dcff';
    } else if (kind === UP_DAMAGE) {
      s.damage = Math.min(+(s.damage + 0.5).toFixed(1), 4.0);
      label = `+ DAMAGE UP (${s.damage.toFixed(1)}×)!`;
      col = '#ff8c00';
    } else if (kind === UP_SPEED) {
      s.speedMult = Math.min(+(s.speedMult + 0.3).toFixed(1), 2.5);
      label = `+ SPEED UP (${s.speedMult.toFixed(1)}×)!`;
      col = '#32c850';
    } else if (kind === UP_RAPID) {
      s.rapidMult = Math.max(+(s.rapidMult - 0.2).toFixed(1), 0.3);
      label = '+ RAPID FIRE!';
      col = '#ffdc32';
    } else if (kind === UP_SHIELD) {
      s.shield = true;
      label = '+ SHIELD ACTIVE!';
      col = '#a03cdc';
    }

    this.snd.upgrade();
    this.floatingTexts.push(new FloatingText(this.ship.x + 40, this.ship.y - 25, label, col, 20));
  }

  _explode(x, y, hexColor, count = 20) {
    const actual = Math.min(count, Game.MAX_PARTICLES - this.particles.length);
    for (let i = 0; i < actual; i++)
      this.particles.push(new Particle(x, y, hexColor));
  }

  _handleCollisions() {
    const deadB = new Set();
    const deadM = new Set();
    const deadO = new Set();

    // 1. Peluru vs Meteor
    for (let bi = 0; bi < this.bullets.length; bi++) {
      if (deadB.has(bi)) continue;
      const b = this.bullets[bi];
      for (let mi = 0; mi < this.meteors.length; mi++) {
        if (deadM.has(mi)) continue;
        const m = this.meteors[mi];
        if (Math.hypot(b.x - m.x, b.y - m.y) < m.radius + Bullet.RADIUS) {
          deadB.add(bi);
          if (m.hit(b.damage)) {
            deadM.add(mi);
            const pts = Math.max(10, Math.floor(m.radius * m.maxHp * 5));
            this.score += pts;
            this.floatingTexts.push(new FloatingText(m.x, m.y, `+${pts}`, '#ffdc32', 15));
            this._explode(m.x, m.y, m.colorStr, m.type === 'tank' ? 36 : 24);
            this.snd.explode(m.type === 'tank');
            if (m.type === 'tank') this.shake = Math.max(this.shake, 6);
          } else {
            this._explode(b.x, b.y, b.color, 5);
          }
          break;
        }
      }
    }

    // 2. Pesawat vs Orb Upgrade
    const sx = this.ship.x + 20, sy = this.ship.y;
    for (let oi = 0; oi < this.upgradeOrbs.length; oi++) {
      if (deadO.has(oi)) continue;
      const orb = this.upgradeOrbs[oi];
      if (Math.hypot(sx - orb.x, sy - orb.y) < orb.radius + Ship.HITBOX_R + 10) {
        deadO.add(oi);
        this._applyUpgrade(orb.def.kind);
        this._explode(orb.x, orb.y, orb.def.color, 30);
      }
    }

    // 3. Pesawat vs Meteor
    for (let mi = 0; mi < this.meteors.length; mi++) {
      if (deadM.has(mi)) continue;
      const m = this.meteors[mi];
      if (Math.hypot(sx - m.x, sy - m.y) < m.radius + Ship.HITBOX_R) {
        deadM.add(mi);
        this._explode(m.x, m.y, '#dc2828', 35);
        this.snd.explode(true);
        this.shake = 12;

        const hadShield = this.ship.shield;
        const lostLife = this.ship.takeHit(this.snd);

        if (hadShield && !this.ship.shield) {
          this.floatingTexts.push(new FloatingText(this.ship.x + 20, this.ship.y - 30, 'SHIELD BROKEN!', '#a03cdc', 18));
        } else if (lostLife) {
          this.floatingTexts.push(new FloatingText(this.ship.x + 20, this.ship.y - 30, '-1 LIFE', '#dc2828', 19));
        }

        if (this.ship.lives <= 0) {
          this.state = 'gameover';
          if (this.score > this.highScore) {
            this.highScore = this.score;
            try { localStorage.setItem('meteor_high_score', String(this.highScore)); } catch {}
          }
          // Tampilkan form submit score ke Supabase
          if (!this.hasPromptedScore && this.score > 0) {
            this.hasPromptedScore = true;
            setTimeout(() => {
              LeaderboardUI.promptSubmit(this.score, this.level);
            }, 500);
          }
        }
        break;
      }
    }

    this.bullets     = this.bullets.filter((_, i) => !deadB.has(i));
    this.meteors     = this.meteors.filter((_, i) => !deadM.has(i));
    this.upgradeOrbs = this.upgradeOrbs.filter((_, i) => !deadO.has(i));
  }

  update() {
    this.tick++;
    this.snd.tick();
    this.stars.update();

    if (this.shake > 0) this.shake *= 0.9;
    if (this.shake < 0.1) this.shake = 0;

    if (this.state === 'title') return;

    if (this.state === 'gameover') {
      for (const p of this.particles) p.update();
      this.particles = this.particles.filter(p => !p.dead);
      return;
    }

    if (this.isPaused || LeaderboardUI.isOpen()) return;

    // ── Playing State ──
    this.ship.handleInput(this.keys, this.snd);
    this.ship.update();

    if (this.keys['Space']) {
      this.bullets.push(...this.ship.tryShoot(this.snd));
    }

    for (const b of this.bullets) b.update();
    this.bullets = this.bullets.filter(b => !b.offScreen);

    // Spawn Meteor dari Kanan
    if (++this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.meteors.push(new Meteor(this.difficulty));
      if (this.difficulty > 2.5 && Math.random() < 0.3)
        this.meteors.push(new Meteor(this.difficulty));
    }

    // Spawn Orb Upgrade Bulat
    if (this.upgradeOrbs.length === 0 && ++this.orbSpawnTimer >= Game.UPGRADE_SPAWN_INTERVAL) {
      this.orbSpawnTimer = 0;
      const pick = choice(UPGRADE_DEFS);
      this.upgradeOrbs.push(new UpgradeOrb(pick));
      this.floatingTexts.push(new FloatingText(WIDTH - 160, 50, '✦ SKILL ORB INCOMING! ✦', '#00dcff', 16));
    }

    for (const orb of this.upgradeOrbs) orb.update();
    this.upgradeOrbs = this.upgradeOrbs.filter(o => !o.offScreen);

    // Difficulty ramp
    if (++this.diffTimer >= 600) {
      this.diffTimer     = 0;
      this.difficulty    = Math.min(this.difficulty + 0.22, 6);
      this.spawnInterval = Math.max(26, this.spawnInterval - 7);
      this.level++;
      this.floatingTexts.push(new FloatingText(WIDTH / 2, HEIGHT / 3, `LEVEL ${this.level}!`, '#00dcff', 24));
    }

    for (const m of this.meteors) m.update();
    this.meteors = this.meteors.filter(m => !m.offScreen);

    for (const p of this.particles) p.update();
    this.particles = this.particles.filter(p => !p.dead);

    for (const ft of this.floatingTexts) ft.update();
    this.floatingTexts = this.floatingTexts.filter(ft => !ft.dead);

    this._handleCollisions();
  }

  onKeyDown(code) {
    // Jangan tangkap tombol jika pemain sedang mengetik nama di modal
    if (document.activeElement && document.activeElement.tagName === 'INPUT') {
      return;
    }

    this.snd.unlock();
    this.keys[code] = true;

    // Leaderboard shortcut [L]
    if (code === 'KeyL') {
      if (LeaderboardUI.modalLeaderboard.classList.contains('active')) {
        LeaderboardUI.closeLeaderboard();
      } else {
        LeaderboardUI.openLeaderboard();
      }
      return;
    }

    // Escape closes modals
    if (code === 'Escape') {
      if (LeaderboardUI.isOpen()) {
        LeaderboardUI.closeLeaderboard();
        LeaderboardUI.closeSubmit();
        return;
      }
    }

    // Pause toggle
    if (code === 'KeyP') {
      if (this.state === 'playing') {
        this.isPaused = !this.isPaused;
      }
      return;
    }

    if (code === 'Space') {
      if (LeaderboardUI.isOpen()) return;
      if (this.state === 'title')    { this._reset(); this.state = 'playing'; }
      if (this.state === 'gameover') { this._reset(); this.state = 'playing'; }
    }
  }

  onKeyUp(code) { delete this.keys[code]; }

  onMouseClick() {
    if (LeaderboardUI.isOpen()) return;
    this.snd.unlock();
    if (this.state === 'title')    { this._reset(); this.state = 'playing'; }
    if (this.state === 'gameover') { this._reset(); this.state = 'playing'; }
  }

  _heart(x, y) {
    const ctx = this.ctx, r = 10;
    ctx.save();
    ctx.shadowBlur = 8; ctx.shadowColor = '#dc2828';
    ctx.fillStyle  = '#dc2828';
    ctx.beginPath(); ctx.arc(x + r / 2,     y + r / 2, r / 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r + r / 2, y + r / 2, r / 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y + r / 2);
    ctx.lineTo(x + r, y + r * 2);
    ctx.lineTo(x + r * 2, y + r / 2);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  _drawHUD() {
    const ctx = this.ctx;

    for (let i = 0; i < this.ship.lives; i++) this._heart(14 + i * 32, 10);

    if (this.ship.shield) {
      ctx.save();
      ctx.shadowBlur = 10; ctx.shadowColor = '#a03cdc';
      ctx.fillStyle  = '#a03cdc';
      ctx.beginPath(); ctx.arc(118, 20, 11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(118, 20, 7,  0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#c87ef0'; ctx.font = '13px Consolas,monospace'; ctx.fillText('SHD', 132, 25);
    }

    ctx.fillStyle  = '#ffffff';
    ctx.font       = 'bold 22px Consolas, "Courier New", monospace';
    ctx.textAlign  = 'center';
    ctx.fillText(`SCORE  ${String(this.score).padStart(7, '0')}`, WIDTH / 2, 24);

    ctx.fillStyle = '#686878';
    ctx.font      = '15px Consolas, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`LVL ${this.level}  |  BEST ${this.highScore.toLocaleString()}`, WIDTH - 180, 24);

    const tags = [];
    if (this.ship.triple)        tags.push({ t: '3×SHOT',                      c: '#00dcff' });
    if (this.ship.damage  > 1)   tags.push({ t: `DMG×${this.ship.damage.toFixed(1)}`,    c: '#ff8c00' });
    if (this.ship.speedMult > 1) tags.push({ t: `SPD×${this.ship.speedMult.toFixed(1)}`, c: '#32c850' });
    if (this.ship.rapidMult < 1) tags.push({ t: 'RAPID',                       c: '#ffdc32' });

    ctx.textAlign = 'left';
    ctx.font      = '14px Consolas, monospace';
    let ix = 14;
    for (const { t, c } of tags) {
      ctx.fillStyle = c;
      ctx.fillText(t, ix, HEIGHT - 12);
      ix += ctx.measureText(t).width + 12;
    }

    ctx.fillStyle = '#555566';
    ctx.font = '12px Consolas, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('[P] Pause  •  [L] Leaderboard', WIDTH - 14, HEIGHT - 12);
    ctx.textAlign = 'left';
  }

  _drawTitle() {
    const ctx = this.ctx;
    const pulse = Math.abs(Math.sin(this.tick * 0.025)) * 25;
    const tr = Math.floor(80 + pulse * 7);
    const tg = Math.floor(170 + pulse * 2);

    ctx.save();
    ctx.shadowBlur  = 32; ctx.shadowColor = `rgb(${tr},${tg},255)`;
    ctx.fillStyle   = `rgb(${tr},${tg},255)`;
    ctx.font        = 'bold 72px Impact, Arial, sans-serif';
    ctx.textAlign   = 'center';
    ctx.fillText('METEOR BLASTER', WIDTH / 2, HEIGHT / 3);
    ctx.restore();

    ctx.fillStyle = '#a8b2bc';
    ctx.font      = '23px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Hancurkan meteor & raih ranking tertinggi!', WIDTH / 2, HEIGHT / 3 + 65);

    ctx.fillStyle = '#7a7a8e';
    ctx.font      = '17px Consolas, monospace';
    const lines = [
      'W / ↑  Gerak Atas  •  S / ↓  Gerak Bawah',
      'SPACE  Tembak (tahan untuk auto-fire)',
      'Tabrak bola bulat di tengah untuk upgrade skill!',
      'Tekan [L] kapan saja untuk melihat Leaderboard Supabase',
    ];
    for (let i = 0; i < lines.length; i++)
      ctx.fillText(lines[i], WIDTH / 2, HEIGHT / 2 + 16 + i * 28);

    const blink = Math.floor(this.tick / 30) % 2 === 0 ? '#ffffff' : '#686878';
    ctx.fillStyle = blink;
    ctx.font      = 'bold 24px Consolas, monospace';
    ctx.fillText('TEKAN SPACE UNTUK MULAI', WIDTH / 2, HEIGHT * 3 / 4 + 32);
    ctx.textAlign = 'left';
  }

  _drawGameOver() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.76)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.save();
    ctx.shadowBlur = 32; ctx.shadowColor = '#dc2828';
    ctx.fillStyle  = '#dc2828';
    ctx.font       = 'bold 72px Impact, Arial, sans-serif';
    ctx.textAlign  = 'center';
    ctx.fillText('GAME OVER', WIDTH / 2, HEIGHT / 3);
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.font      = 'bold 24px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Score : ${this.score.toLocaleString()}`,       WIDTH / 2, HEIGHT / 3 + 72);
    ctx.fillStyle = '#ffdc32';
    ctx.fillText(`Best  : ${this.highScore.toLocaleString()}`,   WIDTH / 2, HEIGHT / 3 + 110);

    const blink = Math.floor(this.tick / 30) % 2 === 0 ? '#ffffff' : '#686878';
    ctx.fillStyle = blink;
    ctx.font      = 'bold 24px Consolas, monospace';
    ctx.fillText('TEKAN SPACE UNTUK MAIN LAGI', WIDTH / 2, HEIGHT * 2 / 3);

    ctx.fillStyle = '#00dcff';
    ctx.font      = '16px Consolas, monospace';
    ctx.fillText('Tekan [L] untuk buka Leaderboard', WIDTH / 2, HEIGHT * 2 / 3 + 42);
    ctx.textAlign = 'left';
  }

  _drawPauseScreen() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px Impact, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME PAUSED', WIDTH / 2, HEIGHT / 2 - 10);
    ctx.fillStyle = '#a8b2bc';
    ctx.font = '20px Consolas, monospace';
    ctx.fillText('Tekan [P] untuk lanjut', WIDTH / 2, HEIGHT / 2 + 35);
    ctx.restore();
  }

  draw() {
    const ctx = this.ctx;

    ctx.save();

    if (this.shake > 0) {
      const ox = (Math.random() * 2 - 1) * this.shake;
      const oy = (Math.random() * 2 - 1) * this.shake;
      ctx.translate(ox, oy);
    }

    const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bg.addColorStop(0, '#0c0c18');
    bg.addColorStop(1, '#180a22');
    ctx.fillStyle = bg;
    ctx.fillRect(-20, -20, WIDTH + 40, HEIGHT + 40);

    this.stars.draw(ctx);

    if (this.state === 'title') {
      this._drawTitle();
      ctx.restore();
      return;
    }

    for (const m of this.meteors) m.draw(ctx);
    for (const orb of this.upgradeOrbs) orb.draw(ctx);
    for (const b of this.bullets) b.draw(ctx);
    for (const p of this.particles) p.draw(ctx);
    this.ship.draw(ctx);

    for (const ft of this.floatingTexts) ft.draw(ctx);

    this._drawHUD();

    if (this.state === 'gameover') this._drawGameOver();
    if (this.isPaused)             this._drawPauseScreen();

    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════
//  BOOTSTRAP
// ═══════════════════════════════════════════════════════════
(function init() {
  const canvas  = document.getElementById('gameCanvas');
  canvas.width  = WIDTH;
  canvas.height = HEIGHT;

  function resize() {
    const sx = window.innerWidth  / WIDTH;
    const sy = window.innerHeight / HEIGHT;
    const sc = Math.min(sx, sy);
    canvas.style.width  = `${WIDTH  * sc}px`;
    canvas.style.height = `${HEIGHT * sc}px`;
  }
  window.addEventListener('resize', resize);
  resize();

  LeaderboardUI.init();
  const game = new Game(canvas);

  window.addEventListener('keydown', e => {
    if (['Space','ArrowUp','ArrowDown'].includes(e.code) && !(document.activeElement && document.activeElement.tagName === 'INPUT')) {
      e.preventDefault();
    }
    game.onKeyDown(e.code);
  });
  window.addEventListener('keyup', e => game.onKeyUp(e.code));

  canvas.addEventListener('click', () => {
    game.onMouseClick();
  });

  canvas.addEventListener('touchstart', e => {
    if (LeaderboardUI.isOpen()) return;
    e.preventDefault();
    game.onMouseClick();
    game.onKeyDown('Space');
  }, { passive: false });

  canvas.addEventListener('touchend', e => {
    if (LeaderboardUI.isOpen()) return;
    e.preventDefault();
    game.onKeyUp('Space');
  }, { passive: false });

  const FRAME_MS = 1000 / 60;
  let last = 0;

  function loop(ts) {
    requestAnimationFrame(loop);
    if (ts - last < FRAME_MS * 0.9) return;
    last = ts;
    game.update();
    game.draw();
  }
  requestAnimationFrame(loop);
})();
