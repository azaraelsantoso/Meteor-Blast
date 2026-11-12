'use strict';

// ═══════════════════════════════════════════════════════════
//  CONSTANTS & CONFIG
// ═══════════════════════════════════════════════════════════
const WIDTH  = 1000;
const HEIGHT = 650;

// Upgrades (Temporary in-game pickable orbs)
const UP_TRIPLE = 'triple_shot';
const UP_DAMAGE = 'damage_boost';
const UP_SPEED  = 'speed_boost';
const UP_RAPID  = 'rapid_fire';
const UP_SHIELD = 'shield';

const UPGRADE_DEFS = [
  { kind: UP_TRIPLE, label: '3× SHOT',     icon: '3×',  color: '#00dcff', desc: 'Tembak 3 proyektil sekaligus' },
  { kind: UP_DAMAGE, label: 'DAMAGE +50%', icon: 'DMG', color: '#ff8c00', desc: 'Peluru lebih mematikan'        },
  { kind: UP_SPEED,  label: 'SPEED +30%',  icon: 'SPD', color: '#32c850', desc: 'Pesawat lebih lincah'          },
  { kind: UP_RAPID,  label: 'RAPID FIRE',  icon: '⚡',  color: '#ffdc32', desc: 'Jeda tembakan lebih cepat'     },
  { kind: UP_SHIELD, label: 'SHIELD',      icon: '🛡️',  color: '#a03cdc', desc: 'Menahan 1x tabrakan'           },
];

const METEOR_PALETTES = ['#966432', '#6e5546', '#87735a', '#a58250'];

// ═══════════════════════════════════════════════════════════
//  PERMANENT HANGAR UPGRADE DEFINITIONS (Energy Currency)
// ═══════════════════════════════════════════════════════════
const HANGAR_UPGRADES = {
  drones: {
    name: 'Wingman Drone',
    icon: '🛸',
    desc: 'Pesawat mini pendamping yang nempel dan ikut menembak',
    levels: [
      { level: 0, cost: 0,   val: 0, desc: 'Belum dipasang' },
      { level: 1, cost: 150, val: 1, desc: '1 Drone pendamping (tembakan samping)' },
      { level: 2, cost: 350, val: 2, desc: '2 Drone pendamping (atas & bawah)' },
      { level: 3, cost: 750, val: 2, desc: '2 Drone dengan peluru plasma kembar' },
    ]
  },
  baseHP: {
    name: 'Base Energy Shield',
    icon: '🏰',
    desc: 'Meningkatkan ketahanan dan total Darah Base utama',
    levels: [
      { level: 0, cost: 0,   val: 10000, desc: '10.000 Max HP' },
      { level: 1, cost: 100, val: 13000, desc: '13.000 Max HP (+30% Darah)' },
      { level: 2, cost: 250, val: 17000, desc: '17.000 Max HP (+70% Darah)' },
      { level: 3, cost: 600, val: 22000, desc: '22.000 Max HP (+120% Darah & Regenerasi)' },
    ]
  },
  damage: {
    name: 'Plasma Blaster DMG',
    icon: '💥',
    desc: 'Meningkatkan daya hancur peluru tembakan dasar pesawat',
    levels: [
      { level: 0, cost: 0,   val: 1.0, desc: '1.0× Damage standar' },
      { level: 1, cost: 120, val: 1.3, desc: '1.3× Damage (+30%)' },
      { level: 2, cost: 300, val: 1.7, desc: '1.7× Damage (+70%)' },
      { level: 3, cost: 700, val: 2.2, desc: '2.2× Damage (+120%)' },
    ]
  },
  fireRate: {
    name: 'Gatling Overclock',
    icon: '⚡',
    desc: 'Mempercepat frekuensi tembakan (cooldown lebih singkat)',
    levels: [
      { level: 0, cost: 0,   val: 1.0, desc: 'Cooldown standar' },
      { level: 1, cost: 120, val: 0.8, desc: 'Tembakan +25% lebih cepat' },
      { level: 2, cost: 300, val: 0.6, desc: 'Tembakan +65% lebih cepat' },
      { level: 3, cost: 700, val: 0.45, desc: 'Hyper-Gatling +120% lebih cepat' },
    ]
  },
  speed: {
    name: 'Engine Thrusters',
    icon: '🚀',
    desc: 'Kecepatan manuver maju-mundur dan atas-bawah pesawat',
    levels: [
      { level: 0, cost: 0,   val: 5.0, desc: 'Kecepatan standar 5.0' },
      { level: 1, cost: 80,  val: 6.5, desc: 'Kecepatan 6.5 (+30%)' },
      { level: 2, cost: 200, val: 8.0, desc: 'Kecepatan 8.0 (+60%)' },
    ]
  }
};

// ═══════════════════════════════════════════════════════════
//  ACHIEVEMENTS SYSTEM
// ═══════════════════════════════════════════════════════════
const ACHIEVEMENTS_DEF = [
  { id: 'first_blood',  name: 'First Flight',       desc: 'Mainkan 1 kali pertempuran', target: 1,     reward: 50  },
  { id: 'meteor_50',    name: 'Meteor Smasher',     desc: 'Hancurkan 50 meteor',       target: 50,    reward: 150 },
  { id: 'splitter_15',  name: 'Splitter Breaker',   desc: 'Hancurkan 15 meteor belah', target: 15,    reward: 150 },
  { id: 'kroco_15',     name: 'Alien Scout Hunter', desc: 'Tembak jatuh 15 kroco alien', target: 15,  reward: 200 },
  { id: 'boss_1',       name: 'Dreadnought Slayer', desc: 'Kalahkan Boss pertama kali', target: 1,     reward: 400 },
  { id: 'level_4',      name: 'Fortress Defender',  desc: 'Capai Level 4 pertempuran', target: 4,     reward: 250 },
  { id: 'drone_owner',  name: 'Squad Leader',       desc: 'Pasang upgrade Wingman Drone', target: 1,   reward: 150 },
  { id: 'score_10k',    name: 'High Scorer',        desc: 'Raih skor 10.000 poin',      target: 10000, reward: 300 },
];

// Persistent User Data Management
const Storage = {
  getEnergy() {
    return parseInt(localStorage.getItem('player_energy') || '0', 10);
  },
  setEnergy(val) {
    localStorage.setItem('player_energy', Math.max(0, val));
    this.updateEnergyUI();
  },
  addEnergy(val) {
    this.setEnergy(this.getEnergy() + val);
  },
  getUpgrades() {
    try {
      return JSON.parse(localStorage.getItem('player_upgrades') || '{}');
    } catch {
      return {};
    }
  },
  getUpgradeLevel(key) {
    const upgs = this.getUpgrades();
    return upgs[key] || 0;
  },
  setUpgradeLevel(key, lvl) {
    const upgs = this.getUpgrades();
    upgs[key] = lvl;
    localStorage.setItem('player_upgrades', JSON.stringify(upgs));
  },
  getStats() {
    try {
      return JSON.parse(localStorage.getItem('player_stats') || '{}');
    } catch {
      return {};
    }
  },
  incStat(key, amt = 1) {
    const stats = this.getStats();
    stats[key] = (stats[key] || 0) + amt;
    localStorage.setItem('player_stats', JSON.stringify(stats));
  },
  getStat(key) {
    return (this.getStats())[key] || 0;
  },
  isClaimed(id) {
    return localStorage.getItem('achieve_claimed_' + id) === 'true';
  },
  setClaimed(id) {
    localStorage.setItem('achieve_claimed_' + id, 'true');
  },
  updateEnergyUI() {
    const e = this.getEnergy();
    const el1 = document.getElementById('energy-counter');
    const el2 = document.getElementById('hangar-energy-display');
    if (el1) el1.textContent = `⚡ ${e.toLocaleString()} ENERGI`;
    if (el2) el2.textContent = `⚡ ${e.toLocaleString()}`;
  }
};

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
    const g   = this._gain(0.18, t, 0.11);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.linearRampToValueAtTime(1100, t + 0.09);
    osc.connect(g);
    osc.start(t); osc.stop(t + 0.12);
  }

  enemyShoot() {
    if (!this.ctx) return;
    this.unlock();
    const t   = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g   = this._gain(0.14, t, 0.13);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.linearRampToValueAtTime(180, t + 0.12);
    osc.connect(g);
    osc.start(t); osc.stop(t + 0.14);
  }

  move() {
    if (!this.ctx || this._moveCd > 0) return;
    this._moveCd = 8;
    this.unlock();
    const t   = this.ctx.currentTime;
    const dur = 0.06;
    const sr  = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, Math.ceil(sr * dur), sr);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.4;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const flt = this.ctx.createBiquadFilter();
    flt.type = 'lowpass'; flt.frequency.value = 350;
    const g = this._gain(0.06, t, dur);
    src.connect(flt); flt.connect(g);
    src.start(t);
  }

  explode(heavy = false) {
    if (!this.ctx) return;
    this.unlock();
    const t   = this.ctx.currentTime;
    const dur = heavy ? 0.7 : 0.4;
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
    flt.frequency.value = heavy ? 300 : 500;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(heavy ? 0.8 : 0.55, t);
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
    const g   = this._gain(0.5, t, 0.2);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(50, t + 0.18);
    osc.connect(g);
    osc.start(t); osc.stop(t + 0.22);
  }

  baseHit() {
    if (!this.ctx) return;
    this.unlock();
    const t   = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g   = this._gain(0.7, t, 0.35);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.linearRampToValueAtTime(40, t + 0.3);
    osc.connect(g);
    osc.start(t); osc.stop(t + 0.35);
  }

  bossWarning() {
    if (!this.ctx) return;
    this.unlock();
    const now = this.ctx.currentTime;
    [350, 440, 350, 440].forEach((freq, i) => {
      const t   = now + i * 0.18;
      const osc = this.ctx.createOscillator();
      const g   = this._gain(0.35, t, 0.15);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.connect(g);
      osc.start(t); osc.stop(t + 0.16);
    });
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

  split() {
    if (!this.ctx) return;
    this.unlock();
    const t   = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g   = this._gain(0.4, t, 0.15);
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.linearRampToValueAtTime(120, t + 0.14);
    osc.connect(g);
    osc.start(t); osc.stop(t + 0.16);
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

    const grad = ctx.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, glowR + 8);
    grad.addColorStop(0, `rgba(${r},${g},${b},0.85)`);
    grad.addColorStop(0.6, `rgba(${r},${g},${b},0.35)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, glowR + 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 18;
    ctx.shadowColor = this.def.color;
    ctx.strokeStyle = this.def.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius - 4, this.pulse, this.pulse + Math.PI * 1.3);
    ctx.stroke();

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
//  SHIP (4-WAY MOVEMENT: W/S/A/D + WINGMAN DRONES)
// ═══════════════════════════════════════════════════════════
class Ship {
  static BODY_W   = 60;
  static BODY_H   = 30;
  static HITBOX_R = 18;

  constructor(isPeer = false) {
    this.isPeer = isPeer;
    this.x = 110;
    this.y = HEIGHT / 2;

    // Permanent upgrades applied from Hangar
    const upgSpeed = HANGAR_UPGRADES.speed.levels[Storage.getUpgradeLevel('speed')].val;
    const upgDmg   = HANGAR_UPGRADES.damage.levels[Storage.getUpgradeLevel('damage')].val;
    const upgRate  = HANGAR_UPGRADES.fireRate.levels[Storage.getUpgradeLevel('fireRate')].val;
    this.droneCount = HANGAR_UPGRADES.drones.levels[Storage.getUpgradeLevel('drones')].val;

    this.baseSpeed = upgSpeed;
    this.speedMult = 1.0;

    this.triple    = false;
    this.damage    = upgDmg;
    this.rapidMult = upgRate;
    this.baseCd    = 18;
    this.shootCd   = 0;

    this.lives      = 3;
    this.shield     = false;
    this.invincible = 0;

    this.shieldPulse = 0;
    this._flameTick  = 0;
  }

  get speed()    { return this.baseSpeed * this.speedMult; }
  get cooldown() { return Math.max(4, Math.floor(this.baseCd * this.rapidMult)); }

  handleInput(keys, snd) {
    let moved = false;
    // 4-Way Movement: Atas-Bawah & Maju-Mundur!
    if (keys['ArrowUp']   || keys['KeyW']) { this.y -= this.speed; moved = true; }
    if (keys['ArrowDown'] || keys['KeyS']) { this.y += this.speed; moved = true; }
    if (keys['ArrowLeft'] || keys['KeyA']) { this.x -= this.speed; moved = true; }
    if (keys['ArrowRight']|| keys['KeyD']) { this.x += this.speed; moved = true; }

    this.y = clamp(this.y, Ship.BODY_H / 2 + 5, HEIGHT - Ship.BODY_H / 2 - 5);
    // Batas maju mundur: minimal x=75 (dekat base), maksimal x=480 (garis depan pertempuran)
    this.x = clamp(this.x, 75, 480);

    if (moved) snd.move();
  }

  tryShoot(snd) {
    if (this.shootCd > 0) return [];
    this.shootCd = this.cooldown;
    snd.shoot();

    const bullets = [];
    const tx = this.x + Ship.BODY_W - 4;

    if (this.triple) {
      bullets.push(
        new Bullet(tx, this.y, -12, this.damage),
        new Bullet(tx, this.y, 0,   this.damage),
        new Bullet(tx, this.y, 12,  this.damage)
      );
    } else {
      bullets.push(new Bullet(tx, this.y, 0, this.damage));
    }

    // Wingman Drones tembak peluru mini tambahan
    if (this.droneCount >= 1) {
      bullets.push(new Bullet(this.x - 4, this.y - 25, 0, this.damage * 0.6, true));
    }
    if (this.droneCount >= 2) {
      bullets.push(new Bullet(this.x - 4, this.y + 25, 0, this.damage * 0.6, true));
    }

    return bullets;
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

    // Engine flame
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

    // Hull Color: Player 1 = Cyan/Blue, Player 2 (Co-op Peer) = Purple/Magenta
    const hullColor = this.isPeer ? '#c850ff' : '#64b4ff';
    const glowColor = this.isPeer ? '#a03cdc' : '#00dcff';

    ctx.save();
    ctx.shadowBlur  = 16;
    ctx.shadowColor = glowColor;

    const bx = this.x - 8;
    const by = this.y;
    ctx.fillStyle = hullColor;
    ctx.beginPath();
    ctx.moveTo(bx,                    by - Ship.BODY_H / 2);
    ctx.lineTo(bx + Ship.BODY_W,      by);
    ctx.lineTo(bx,                    by + Ship.BODY_H / 2);
    ctx.closePath();
    ctx.fill();

    ctx.shadowColor = glowColor;
    ctx.fillStyle   = glowColor;
    ctx.beginPath();
    ctx.ellipse(bx + 24, by - 2, 13, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle  = '#3c3c5a';
    ctx.fillRect(bx - 2, by - 7, 10, 14);

    ctx.restore();

    // Render Wingman Drones nempel pada kapal player
    if (this.droneCount >= 1) {
      this._drawDrone(ctx, this.x - 10, this.y - 25);
    }
    if (this.droneCount >= 2) {
      this._drawDrone(ctx, this.x - 10, this.y + 25);
    }

    // Shield bubble
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

  _drawDrone(ctx, dx, dy) {
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00dcff';
    ctx.fillStyle = '#00dcff';
    ctx.beginPath();
    ctx.arc(dx, dy, 7, 0, Math.PI * 2);
    ctx.fill();
    // Drone mini wing
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(dx - 5, dy - 2);
    ctx.lineTo(dx + 8, dy);
    ctx.lineTo(dx - 5, dy + 2);
    ctx.fill();
    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════
//  BULLET (PLAYER BULLET & MINI DRONE BULLET)
// ═══════════════════════════════════════════════════════════
class Bullet {
  static SPEED  = 14;
  static RADIUS = 5;

  constructor(x, y, angleDeg = 0, damage = 1, isDrone = false) {
    this.x = x; this.y = y;
    const r  = (angleDeg * Math.PI) / 180;
    this.vx  = Math.cos(r) * Bullet.SPEED;
    this.vy  = Math.sin(r) * Bullet.SPEED;
    this.damage = damage;
    this.isDrone = isDrone;
    this.trail  = [];

    if (isDrone) {
      this.color = '#32c850';
      this.glow  = '#32c850';
    } else if (damage >= 2.0) {
      this.color = '#c850ff';
      this.glow  = '#c850ff';
    } else if (damage >= 1.3) {
      this.color = '#00dcff';
      this.glow  = '#00dcff';
    } else {
      this.color = '#ffdc32';
      this.glow  = '#ffdc32';
    }
  }

  update() {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 6) this.trail.shift();
    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx) {
    const rgb = hexToRgb(this.color);
    for (let i = 0; i < this.trail.length; i++) {
      const a = (i + 1) / this.trail.length;
      const r = Math.max(1, (this.isDrone ? 3 : Bullet.RADIUS) * a * 0.6);
      ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${a.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(this.trail[i].x, this.trail[i].y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.save();
    ctx.shadowBlur  = 12;
    ctx.shadowColor = this.glow;
    ctx.fillStyle   = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.isDrone ? 3.5 : Bullet.RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  get offScreen() {
    return this.x < -20 || this.x > WIDTH + 20 || this.y < -20 || this.y > HEIGHT + 20;
  }
}

// ═══════════════════════════════════════════════════════════
//  ENEMY BULLET (DARI KROCO ATAU BOSS)
// ═══════════════════════════════════════════════════════════
class EnemyBullet {
  constructor(x, y, vx = -7, vy = 0, damage = 1) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.radius = 4.5;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx) {
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff2050';
    ctx.fillStyle = '#ff2050';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  get offScreen() {
    return this.x < 15 || this.x > WIDTH + 20 || this.y < -20 || this.y > HEIGHT + 20;
  }
}

// ═══════════════════════════════════════════════════════════
//  METEOR  (DARI KANAN, LURUS, BISA TERBELAH DUA)
// ═══════════════════════════════════════════════════════════
class Meteor {
  constructor(difficulty = 1, options = {}) {
    this.isSplitter = false;
    this.isChild = options.isChild || false;

    if (this.isChild) {
      this.type = 'small';
      this.radius = options.radius || 18;
      this.speed = options.speed || 3.0;
      this.hp = 1;
      this.maxHp = 1;
      this.colorStr = options.colorStr || '#87735a';
      this.x = options.x;
      this.y = options.y;
      this.vy = options.vy || 0;
    } else {
      const roll = Math.random();
      // Splitter / Tank Meteor besar (bisa membelah 2)
      if (difficulty >= 1.6 && roll < 0.32) {
        this.type = 'tank';
        this.isSplitter = true; // BISA TERBELAH DUA SAAT HANCUR
        this.radius = randInt(36, 48);
        this.speed = Math.min(1.2 + difficulty * 0.3, 4.2);
        this.hp = Math.max(4, Math.floor(this.radius * 0.16 * difficulty));
        this.colorStr = '#42283c'; // Obsidian gelap
      } else if (roll > 0.72) {
        this.type = 'fast';
        this.radius = randInt(14, 22);
        this.speed = Math.min(2.8 + difficulty * 0.55, 9.0);
        this.hp = 1;
        this.colorStr = '#ff4d4d'; // Merah cepat
      } else {
        this.type = 'normal';
        this.radius = randInt(18, 32);
        this.speed = Math.min(1.4 + difficulty * 0.5, 7.5);
        this.hp = Math.max(1, Math.floor(this.radius * 0.1 * difficulty));
        this.colorStr = choice(METEOR_PALETTES);
      }
      this.maxHp = this.hp;
      this.x = WIDTH + this.radius + 10;
      this.y = randFloat(this.radius + 15, HEIGHT - this.radius - 15);
      this.vy = 0;
    }

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
    return Array.from({ length: randInt(2, 4) }, () => {
      const r    = randInt(2, Math.max(3, Math.floor(this.radius / 4)));
      const ang  = randFloat(0, Math.PI * 2);
      const dist = randFloat(0, this.radius * 0.6);
      return { x: dist * Math.cos(ang), y: dist * Math.sin(ang), r };
    });
  }

  update() {
    this.x -= this.speed;
    this.y += this.vy;
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

    // Indikator retak jika tipe Splitter
    if (this.isSplitter) {
      ctx.strokeStyle = '#00dcff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-this.radius * 0.6, -this.radius * 0.3);
      ctx.lineTo(0, 0);
      ctx.lineTo(this.radius * 0.5, this.radius * 0.4);
      ctx.stroke();
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

  // Base Damage jika lolos ke kiri menabrak Base
  getBaseDamage() {
    if (this.type === 'tank') return 1500;
    if (this.type === 'fast') return 350;
    if (this.radius > 28)     return 600;
    return 250;
  }

  get offScreen() {
    return this.x < -this.radius * 3;
  }
}

// ═══════════════════════════════════════════════════════════
//  MUSUH KROCO (ALIEN SCOUT SHIP)
// ═══════════════════════════════════════════════════════════
class Kroco {
  constructor(difficulty = 1) {
    this.x = WIDTH + 40;
    this.y = randFloat(80, HEIGHT - 80);
    this.speed = randFloat(2.0, 3.2);
    this.hp = Math.max(2, Math.floor(2 + difficulty * 0.6));
    this.maxHp = this.hp;
    this.w = 34;
    this.h = 24;
    this.wobble = randFloat(0, Math.PI * 2);
    this.shootTimer = randInt(40, 100);
  }

  update() {
    this.x -= this.speed;
    this.wobble += 0.05;
    this.y += Math.sin(this.wobble) * 1.8;
  }

  tryShoot(snd) {
    if (--this.shootTimer <= 0) {
      this.shootTimer = randInt(80, 150);
      snd.enemyShoot();
      return new EnemyBullet(this.x - 16, this.y, -7.5, 0, 1);
    }
    return null;
  }

  draw(ctx) {
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ff2050';

    // Alien scout drone body (ke arah kiri)
    ctx.fillStyle = '#9b1c31';
    ctx.beginPath();
    ctx.moveTo(this.x - 18, this.y);
    ctx.lineTo(this.x + 14, this.y - 12);
    ctx.lineTo(this.x + 8,  this.y);
    ctx.lineTo(this.x + 14, this.y + 12);
    ctx.closePath();
    ctx.fill();

    // Eye / Cockpit
    ctx.fillStyle = '#ff3366';
    ctx.beginPath();
    ctx.arc(this.x - 4, this.y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // HP Bar
    if (this.maxHp > 1) {
      ctx.fillStyle = '#600';
      ctx.fillRect(this.x - 15, this.y - 18, 30, 4);
      ctx.fillStyle = '#f33';
      ctx.fillRect(this.x - 15, this.y - 18, (30 * this.hp) / this.maxHp, 4);
    }
  }

  hit(dmg) { this.hp -= dmg; return this.hp <= 0; }
  getBaseDamage() { return 400; }
  get offScreen() { return this.x < -40; }
}

// ═══════════════════════════════════════════════════════════
//  BOSS (CYBER DREADNOUGHT MOTHERSHIP)
// ═══════════════════════════════════════════════════════════
class Boss {
  constructor(level = 3) {
    this.x = WIDTH + 120;
    this.targetX = WIDTH - 130;
    this.y = HEIGHT / 2;
    this.w = 90;
    this.h = 140;
    this.hp = 60 + level * 25;
    this.maxHp = this.hp;
    this.vy = 2.0;
    this.shootTimer = 50;
    this.minionTimer = 220;
    this.pulse = 0;
  }

  update() {
    // Masuk ke posisi target di sisi kanan
    if (this.x > this.targetX) {
      this.x -= 1.8;
    } else {
      // Bergerak naik turun perlahan
      this.y += this.vy;
      if (this.y < 120 || this.y > HEIGHT - 120) {
        this.vy = -this.vy;
      }
    }
    this.pulse += 0.05;
  }

  tryShoot(snd) {
    const bullets = [];
    if (--this.shootTimer <= 0) {
      this.shootTimer = 75;
      snd.enemyShoot();
      // Triple spread laser
      bullets.push(
        new EnemyBullet(this.x - 35, this.y - 30, -7, -1.5, 1),
        new EnemyBullet(this.x - 40, this.y,      -8,  0,   1),
        new EnemyBullet(this.x - 35, this.y + 30, -7,  1.5, 1)
      );
    }
    return bullets;
  }

  trySpawnMinion() {
    if (--this.minionTimer <= 0) {
      this.minionTimer = 260;
      const k = new Kroco(2);
      k.x = this.x - 20;
      k.y = this.y;
      return k;
    }
    return null;
  }

  draw(ctx) {
    ctx.save();
    ctx.shadowBlur = 24;
    ctx.shadowColor = '#ff0055';

    // Mothership hull
    ctx.fillStyle = '#260a1e';
    ctx.beginPath();
    ctx.moveTo(this.x - 45, this.y);
    ctx.lineTo(this.x + 35, this.y - this.h / 2);
    ctx.lineTo(this.x + 45, this.y);
    ctx.lineTo(this.x + 35, this.y + this.h / 2);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Glowing core
    const p = Math.sin(this.pulse);
    ctx.fillStyle = `rgba(255, 30, 90, ${0.7 + p * 0.3})`;
    ctx.beginPath();
    ctx.arc(this.x - 10, this.y, 20 + p * 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Boss Top Screen Giant Health Bar
    const barW = 440;
    const barH = 16;
    const bx = WIDTH / 2 - barW / 2;
    const by = 48;

    ctx.save();
    ctx.fillStyle = 'rgba(10, 10, 20, 0.85)';
    ctx.fillRect(bx - 4, by - 4, barW + 8, barH + 8);
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx - 4, by - 4, barW + 8, barH + 8);

    const fillRatio = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = '#ff0055';
    ctx.fillRect(bx, by, barW * fillRatio, barH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`⚠️ CYBER DREADNOUGHT MOTHERSHIP — HP: ${this.hp} / ${this.maxHp} ⚠️`, WIDTH / 2, by + 12);
    ctx.restore();
  }

  hit(dmg) { this.hp -= dmg; return this.hp <= 0; }
  getBaseDamage() { return 3000; }
  get offScreen() { return false; }
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

    // Multiplayer socket & peer
    this.ws = null;
    this.isMultiplayer = false;
    this.isHost = true;
    this.roomCode = null;
    this.peerShip = null;

    this.floatingTexts = [];
    this.stars = new StarField();
    this.hasPromptedScore = false;

    this._reset();
  }

  _reset() {
    this.ship = new Ship(false);
    if (this.isMultiplayer) {
      this.peerShip = new Ship(true);
      this.peerShip.y = HEIGHT / 2 + 60;
    } else {
      this.peerShip = null;
    }

    // Base HP diinisialisasi dari upgrade Hangar!
    const upgBaseHP = HANGAR_UPGRADES.baseHP.levels[Storage.getUpgradeLevel('baseHP')].val;
    this.baseMaxHp  = upgBaseHP;
    this.baseHp     = upgBaseHP;

    this.bullets       = [];
    this.enemyBullets  = [];
    this.meteors       = [];
    this.krocos        = [];
    this.boss          = null;
    this.bossAlert     = 0;
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

    Storage.updateEnergyUI();
    Storage.incStat('games_played', 1);
    this._checkAchievements();
  }

  _checkAchievements() {
    const stats = Storage.getStats();
    if (stats.games_played >= 1)   this._grantAchieve('first_blood');
    if (stats.meteors_hit >= 50)   this._grantAchieve('meteor_50');
    if (stats.splitters_hit >= 15) this._grantAchieve('splitter_15');
    if (stats.kroco_hit >= 15)     this._grantAchieve('kroco_15');
    if (stats.boss_hit >= 1)       this._grantAchieve('boss_1');
    if (this.level >= 4)           this._grantAchieve('level_4');
    if (Storage.getUpgradeLevel('drones') >= 1) this._grantAchieve('drone_owner');
    if (this.score >= 10000)       this._grantAchieve('score_10k');
  }

  _grantAchieve(id) {
    if (!localStorage.getItem('achieve_unlocked_' + id)) {
      localStorage.setItem('achieve_unlocked_' + id, 'true');
      const ach = ACHIEVEMENTS_DEF.find(a => a.id === id);
      if (ach) {
        this.floatingTexts.push(new FloatingText(WIDTH / 2, 80, `🎖️ MISI SELESAI: ${ach.name}!`, '#ffdc32', 20));
      }
    }
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
      s.damage = Math.min(+(s.damage + 0.5).toFixed(1), 5.0);
      label = `+ DAMAGE UP (${s.damage.toFixed(1)}×)!`;
      col = '#ff8c00';
    } else if (kind === UP_SPEED) {
      s.speedMult = Math.min(+(s.speedMult + 0.3).toFixed(1), 2.5);
      label = `+ SPEED UP (${s.speedMult.toFixed(1)}×)!`;
      col = '#32c850';
    } else if (kind === UP_RAPID) {
      s.rapidMult = Math.max(+(s.rapidMult - 0.2).toFixed(1), 0.25);
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

  _damageBase(amount, sourceName = 'METEOR') {
    this.baseHp = Math.max(0, this.baseHp - amount);
    this.snd.baseHit();
    this.shake = Math.min(18, this.shake + 10);
    this.floatingTexts.push(new FloatingText(50, randFloat(HEIGHT / 2 - 80, HEIGHT / 2 + 80), `-${amount} BASE HP!`, '#ff2244', 22));

    if (this.baseHp <= 0) {
      this._gameOver('BASE PERTAHANAN HANCUR!');
    }
  }

  _gameOver(reason = 'GAME OVER') {
    this.state = 'gameover';
    this.gameOverReason = reason;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      try { localStorage.setItem('meteor_high_score', String(this.highScore)); } catch {}
    }

    // Hitung Energi yang didapat: tergantung score dan level
    const earnedEnergy = Math.max(10, Math.floor(this.score / 50) + this.level * 15);
    Storage.addEnergy(earnedEnergy);
    this.lastEarnedEnergy = earnedEnergy;

    this._checkAchievements();

    if (!this.hasPromptedScore && this.score > 0) {
      this.hasPromptedScore = true;
      setTimeout(() => {
        LeaderboardUI.promptSubmit(this.score, this.level, earnedEnergy);
      }, 600);
    }
  }

  _handleCollisions() {
    const deadB  = new Set();
    const deadEB = new Set();
    const deadM  = new Set();
    const deadK  = new Set();
    const deadO  = new Set();

    // 1. Peluru Player vs Meteor
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
            Storage.incStat('meteors_hit', 1);

            // METEOR BESAR TERBELAH DUA (SPLITTER MECHANIC)
            if (m.isSplitter && !m.isChild) {
              Storage.incStat('splitters_hit', 1);
              this.snd.split();
              this.floatingTexts.push(new FloatingText(m.x, m.y - 20, '💥 SPLIT!', '#00dcff', 18));
              // Spawn 2 pecahan kecil
              this.meteors.push(
                new Meteor(this.difficulty, { isChild: true, x: m.x, y: m.y - 14, vy: -1.2, radius: 18, speed: m.speed * 1.2, colorStr: m.colorStr }),
                new Meteor(this.difficulty, { isChild: true, x: m.x, y: m.y + 14, vy: 1.2,  radius: 18, speed: m.speed * 1.2, colorStr: m.colorStr })
              );
            }

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

    // 2. Peluru Player vs Kroco Alien
    for (let bi = 0; bi < this.bullets.length; bi++) {
      if (deadB.has(bi)) continue;
      const b = this.bullets[bi];
      for (let ki = 0; ki < this.krocos.length; ki++) {
        if (deadK.has(ki)) continue;
        const k = this.krocos[ki];
        if (Math.hypot(b.x - k.x, b.y - k.y) < 22) {
          deadB.add(bi);
          if (k.hit(b.damage)) {
            deadK.add(ki);
            this.score += 250;
            Storage.incStat('kroco_hit', 1);
            this.floatingTexts.push(new FloatingText(k.x, k.y, '+250', '#ff5577', 16));
            this._explode(k.x, k.y, '#ff0055', 28);
            this.snd.explode(false);
          }
          break;
        }
      }
    }

    // 3. Peluru Player vs Boss
    if (this.boss) {
      for (let bi = 0; bi < this.bullets.length; bi++) {
        if (deadB.has(bi)) continue;
        const b = this.bullets[bi];
        if (b.x >= this.boss.x - 45 && b.x <= this.boss.x + 45 &&
            b.y >= this.boss.y - this.boss.h / 2 && b.y <= this.boss.y + this.boss.h / 2) {
          deadB.add(bi);
          this._explode(b.x, b.y, '#ff0055', 6);
          if (this.boss.hit(b.damage)) {
            // Boss Defeated!
            this.score += 5000;
            Storage.incStat('boss_hit', 1);
            Storage.addEnergy(200);
            this._explode(this.boss.x, this.boss.y, '#ff0055', 60);
            this._explode(this.boss.x, this.boss.y, '#ffdc32', 40);
            this.snd.explode(true);
            this.floatingTexts.push(new FloatingText(WIDTH / 2, HEIGHT / 2, '👑 BOSS DEFEATED! +5,000 PTS & +200 ⚡', '#ffdc32', 24));
            this.boss = null;
            break;
          }
        }
      }
    }

    // 4. Peluru Musuh vs Pesawat Player
    for (let ebi = 0; ebi < this.enemyBullets.length; ebi++) {
      if (deadEB.has(ebi)) continue;
      const eb = this.enemyBullets[ebi];
      if (Math.hypot(this.ship.x - eb.x, this.ship.y - eb.y) < Ship.HITBOX_R + eb.radius) {
        deadEB.add(ebi);
        this._explode(eb.x, eb.y, '#ff2050', 12);
        this.ship.takeHit(this.snd);
        if (this.ship.lives <= 0) {
          this._gameOver('PESAWAT HANCUR OLEH TEMBAKAN MUSUH!');
        }
      }
    }

    // 5. Pesawat vs Orb Upgrade
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

    // 6. Pesawat vs Meteor
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
          this._gameOver('PESAWAT HANCUR TERTABRAK METEOR!');
        }
        break;
      }
    }

    // 7. Meteor / Kroco Menabrak BASE DI SISI KIRI (x <= 30)
    for (let mi = 0; mi < this.meteors.length; mi++) {
      if (deadM.has(mi)) continue;
      const m = this.meteors[mi];
      if (m.x - m.radius <= 30) {
        deadM.add(mi);
        this._explode(30, m.y, '#00dcff', 24);
        this._damageBase(m.getBaseDamage(), 'METEOR');
      }
    }

    for (let ki = 0; ki < this.krocos.length; ki++) {
      if (deadK.has(ki)) continue;
      const k = this.krocos[ki];
      if (k.x - 18 <= 30) {
        deadK.add(ki);
        this._explode(30, k.y, '#ff0055', 24);
        this._damageBase(k.getBaseDamage(), 'KROCO ALIEN');
      }
    }

    this.bullets      = this.bullets.filter((_, i) => !deadB.has(i));
    this.enemyBullets = this.enemyBullets.filter((_, i) => !deadEB.has(i));
    this.meteors      = this.meteors.filter((_, i) => !deadM.has(i));
    this.krocos       = this.krocos.filter((_, i) => !deadK.has(i));
    this.upgradeOrbs  = this.upgradeOrbs.filter((_, i) => !deadO.has(i));
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

    if (this.isPaused || ModalUI.isOpen()) return;

    // ── Playing State ──
    this.ship.handleInput(this.keys, this.snd);
    this.ship.update();

    // Multi-player position broadcast
    if (this.isMultiplayer && this.ws && this.ws.readyState === WebSocket.OPEN && this.tick % 2 === 0) {
      this.ws.send(JSON.stringify({
        type: 'PLAYER_MOVE',
        payload: { x: this.ship.x, y: this.ship.y, lives: this.ship.lives }
      }));
    }

    if (this.keys['Space']) {
      const newB = this.ship.tryShoot(this.snd);
      this.bullets.push(...newB);
      if (this.isMultiplayer && this.ws && this.ws.readyState === WebSocket.OPEN && newB.length > 0) {
        this.ws.send(JSON.stringify({
          type: 'PLAYER_SHOOT',
          payload: { x: this.ship.x, y: this.ship.y }
        }));
      }
    }

    for (const b of this.bullets) b.update();
    this.bullets = this.bullets.filter(b => !b.offScreen);

    for (const eb of this.enemyBullets) eb.update();
    this.enemyBullets = this.enemyBullets.filter(eb => !eb.offScreen);

    // Spawn Meteor dari Kanan
    if (++this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.meteors.push(new Meteor(this.difficulty));
      if (this.difficulty > 2.2 && Math.random() < 0.35)
        this.meteors.push(new Meteor(this.difficulty));
    }

    // Spawn Kroco Alien Drones (Mulai level 2+)
    if (this.level >= 2 && Math.random() < 0.009 + this.difficulty * 0.003 && this.krocos.length < 4) {
      this.krocos.push(new Kroco(this.difficulty));
    }

    // Spawn Boss (Dreadnought) jarang muncul: setiap kelipatan level 3 dan belum ada boss aktif
    if (this.level >= 3 && !this.boss && (this.level % 3 === 0) && this.diffTimer === 1) {
      this.boss = new Boss(this.level);
      this.bossAlert = 180;
      this.snd.bossWarning();
      this.shake = 16;
    }

    // Update Krocos
    for (const k of this.krocos) {
      k.update();
      const eb = k.tryShoot(this.snd);
      if (eb) this.enemyBullets.push(eb);
    }
    this.krocos = this.krocos.filter(k => !k.offScreen);

    // Update Boss
    if (this.boss) {
      this.boss.update();
      const bShots = this.boss.tryShoot(this.snd);
      if (bShots.length) this.enemyBullets.push(...bShots);
      const minion = this.boss.trySpawnMinion();
      if (minion) this.krocos.push(minion);
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

    // Difficulty ramp setiap 10 detik
    if (++this.diffTimer >= 600) {
      this.diffTimer     = 0;
      this.difficulty    = Math.min(this.difficulty + 0.22, 6);
      this.spawnInterval = Math.max(24, this.spawnInterval - 6);
      this.level++;
      this.floatingTexts.push(new FloatingText(WIDTH / 2, HEIGHT / 3, `LEVEL ${this.level}!`, '#00dcff', 24));
      this._checkAchievements();
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
    if (document.activeElement && document.activeElement.tagName === 'INPUT') return;

    this.snd.unlock();
    this.keys[code] = true;

    if (code === 'KeyL') {
      ModalUI.toggleLeaderboard();
      return;
    }

    if (code === 'Escape') {
      if (ModalUI.isOpen()) {
        ModalUI.closeAll();
        return;
      }
    }

    if (code === 'KeyP') {
      if (this.state === 'playing') {
        this.isPaused = !this.isPaused;
      }
      return;
    }

    if (code === 'Space') {
      if (ModalUI.isOpen()) return;
      if (this.state === 'title')    { this._reset(); this.state = 'playing'; }
      if (this.state === 'gameover') { this._reset(); this.state = 'playing'; }
    }
  }

  onKeyUp(code) { delete this.keys[code]; }

  onMouseClick() {
    if (ModalUI.isOpen()) return;
    this.snd.unlock();
    if (this.state === 'title')    { this._reset(); this.state = 'playing'; }
    if (this.state === 'gameover') { this._reset(); this.state = 'playing'; }
  }

  _drawBaseShield(ctx) {
    // Energy Barrier Shield di sisi kiri (x: 0..30)
    ctx.save();
    const hpRatio = Math.max(0, this.baseHp / this.baseMaxHp);
    const shieldColor = hpRatio > 0.5 ? '#00dcff' : hpRatio > 0.25 ? '#ffdc32' : '#ff2244';

    ctx.shadowBlur = 18;
    ctx.shadowColor = shieldColor;
    ctx.strokeStyle = shieldColor;
    ctx.lineWidth = 4;

    // Glowing vertical barrier line
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.lineTo(30, HEIGHT);
    ctx.stroke();

    // Barrier grid pattern
    ctx.fillStyle = `rgba(${hpRatio > 0.5 ? '0,220,255' : '255,50,50'}, 0.08)`;
    ctx.fillRect(0, 0, 30, HEIGHT);

    // Pulsing energy hex nodes along the barrier
    for (let y = 30; y < HEIGHT; y += 60) {
      const pulse = Math.sin(this.tick * 0.1 + y) * 2;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(30, y, 4 + pulse, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  _drawBaseHPBar(ctx) {
    // Base HP Bar di bagian atas tengah layar
    const barW = 240;
    const barH = 12;
    const bx = 160;
    const by = 16;
    const hpRatio = Math.max(0, this.baseHp / this.baseMaxHp);

    ctx.save();
    ctx.fillStyle = 'rgba(12, 18, 30, 0.85)';
    ctx.fillRect(bx, by, barW, barH);
    ctx.strokeStyle = 'rgba(0, 220, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, barW, barH);

    const barColor = hpRatio > 0.5 ? '#00dcff' : hpRatio > 0.25 ? '#ffdc32' : '#ff2244';
    ctx.fillStyle = barColor;
    ctx.fillRect(bx + 1, by + 1, (barW - 2) * hpRatio, barH - 2);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`🏰 BASE HP: ${this.baseHp.toLocaleString()} / ${this.baseMaxHp.toLocaleString()}`, bx, by - 4);
    ctx.restore();
  }

  _drawHUD() {
    const ctx = this.ctx;

    // Base Shield on the left
    this._drawBaseShield(ctx);

    // Base HP Bar
    this._drawBaseHPBar(ctx);

    // Ship Lives (Hearts)
    for (let i = 0; i < this.ship.lives; i++) {
      const x = 18 + i * 28, y = 14;
      const r = 9;
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

    // Shield status badge
    if (this.ship.shield) {
      ctx.save();
      ctx.fillStyle = '#a03cdc';
      ctx.beginPath(); ctx.arc(110, 22, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '11px Consolas,monospace'; ctx.fillText('SHD', 124, 26);
      ctx.restore();
    }

    // Score & Level
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE ${String(this.score).padStart(7, '0')}`, WIDTH / 2 + 30, 24);

    ctx.fillStyle = '#686878';
    ctx.font = '14px Consolas, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`LVL ${this.level}  |  BEST ${this.highScore.toLocaleString()}`, WIDTH - 340, 24);

    // Active in-game skill tags
    const tags = [];
    if (this.ship.triple)        tags.push({ t: '3×SHOT',                      c: '#00dcff' });
    if (this.ship.damage  > 1)   tags.push({ t: `DMG×${this.ship.damage.toFixed(1)}`,    c: '#ff8c00' });
    if (this.ship.speedMult > 1) tags.push({ t: `SPD×${this.ship.speedMult.toFixed(1)}`, c: '#32c850' });
    if (this.ship.rapidMult < 1) tags.push({ t: 'RAPID',                       c: '#ffdc32' });

    ctx.textAlign = 'left';
    ctx.font = '13px Consolas, monospace';
    let ix = 45;
    for (const { t, c } of tags) {
      ctx.fillStyle = c;
      ctx.fillText(t, ix, HEIGHT - 14);
      ix += ctx.measureText(t).width + 12;
    }

    ctx.fillStyle = '#555566';
    ctx.font = '12px Consolas, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('[W/A/S/D] Maju-Mundur • [P] Pause • [L] Ranking', WIDTH - 14, HEIGHT - 14);
    ctx.textAlign = 'left';

    // Boss Warning Banner
    if (this.bossAlert > 0) {
      this.bossAlert--;
      const alpha = Math.abs(Math.sin(this.tick * 0.1));
      ctx.save();
      ctx.fillStyle = `rgba(255, 0, 80, ${0.25 * alpha})`;
      ctx.fillRect(0, HEIGHT / 2 - 40, WIDTH, 80);
      ctx.fillStyle = `rgba(255, 30, 90, ${alpha})`;
      ctx.font = 'bold 32px Impact, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ WARNING: CYBER DREADNOUGHT APPROACHING ⚠️', WIDTH / 2, HEIGHT / 2 + 10);
      ctx.restore();
    }
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
    ctx.font      = '21px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Pertahankan Base Utama 🏰 (HP 10.000) dari Hujan Meteor & Alien!', WIDTH / 2, HEIGHT / 3 + 60);

    ctx.fillStyle = '#7a7a8e';
    ctx.font      = '16px Consolas, monospace';
    const lines = [
      'W / A / S / D  : Gerak Pesawat (Bisa Maju-Mundur & Naik-Turun!)',
      'SPACE          : Tembak Laser (Tahan untuk Auto-Fire)',
      'METEOR BESAR   : Terbelah 2 saat ditembak hancur',
      'SKILL ORB      : Tabrak bola bulat di tengah untuk upgrade instan',
      'HANGAR UPGRADE : Pasang Wingman Drone, Tambah Darah Base & Damage!',
    ];
    for (let i = 0; i < lines.length; i++)
      ctx.fillText(lines[i], WIDTH / 2, HEIGHT / 2 + 10 + i * 26);

    const blink = Math.floor(this.tick / 30) % 2 === 0 ? '#ffffff' : '#686878';
    ctx.fillStyle = blink;
    ctx.font      = 'bold 24px Consolas, monospace';
    ctx.fillText('TEKAN SPACE UNTUK MEMULAI MISI', WIDTH / 2, HEIGHT * 3 / 4 + 36);
    ctx.textAlign = 'left';
  }

  _drawGameOver() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.save();
    ctx.shadowBlur = 32; ctx.shadowColor = '#dc2828';
    ctx.fillStyle  = '#dc2828';
    ctx.font       = 'bold 68px Impact, Arial, sans-serif';
    ctx.textAlign  = 'center';
    ctx.fillText(this.gameOverReason || 'GAME OVER', WIDTH / 2, HEIGHT / 3);
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.font      = 'bold 24px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Skor Akhir : ${this.score.toLocaleString()}`,       WIDTH / 2, HEIGHT / 3 + 68);
    ctx.fillStyle = '#ffdc32';
    ctx.fillText(`Rekor Terbaik: ${this.highScore.toLocaleString()}`, WIDTH / 2, HEIGHT / 3 + 100);

    if (this.lastEarnedEnergy) {
      ctx.fillStyle = '#32c850';
      ctx.font = 'bold 20px Consolas, monospace';
      ctx.fillText(`+${this.lastEarnedEnergy} ⚡ Energi Berhasil Dikumpulkan!`, WIDTH / 2, HEIGHT / 3 + 138);
    }

    const blink = Math.floor(this.tick / 30) % 2 === 0 ? '#ffffff' : '#686878';
    ctx.fillStyle = blink;
    ctx.font      = 'bold 24px Consolas, monospace';
    ctx.fillText('TEKAN SPACE UNTUK MAIN LAGI', WIDTH / 2, HEIGHT * 3 / 4 + 10);
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
    ctx.fillText('Tekan [P] untuk lanjut pertempuran', WIDTH / 2, HEIGHT / 2 + 35);
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
    bg.addColorStop(0, '#0a0a16');
    bg.addColorStop(1, '#180922');
    ctx.fillStyle = bg;
    ctx.fillRect(-20, -20, WIDTH + 40, HEIGHT + 40);

    this.stars.draw(ctx);

    if (this.state === 'title') {
      this._drawTitle();
      ctx.restore();
      return;
    }

    // Meteors
    for (const m of this.meteors) m.draw(ctx);

    // Kroco Alien Drones
    for (const k of this.krocos) k.draw(ctx);

    // Boss
    if (this.boss) this.boss.draw(ctx);

    // Upgrade Orbs
    for (const orb of this.upgradeOrbs) orb.draw(ctx);

    // Bullets
    for (const b of this.bullets) b.draw(ctx);
    for (const eb of this.enemyBullets) eb.draw(ctx);

    // Particles
    for (const p of this.particles) p.draw(ctx);

    // Player Ship
    this.ship.draw(ctx);

    // Co-op Peer Ship
    if (this.isMultiplayer && this.peerShip) {
      this.peerShip.draw(ctx);
    }

    // Floating text popups
    for (const ft of this.floatingTexts) ft.draw(ctx);

    // HUD
    this._drawHUD();

    if (this.state === 'gameover') this._drawGameOver();
    if (this.isPaused)             this._drawPauseScreen();

    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════
//  MODAL & UI MANAGER
// ═══════════════════════════════════════════════════════════
const ModalUI = {
  mHangar:      document.getElementById('modal-hangar'),
  mAchieve:     document.getElementById('modal-achieve'),
  mMP:          document.getElementById('modal-mp'),
  mLeaderboard: document.getElementById('modal-leaderboard'),
  mSubmit:      document.getElementById('modal-submit-score'),

  init(game) {
    this.game = game;

    // Hangar
    document.getElementById('btn-open-hangar').addEventListener('click', () => this.openHangar());
    document.getElementById('btn-close-hangar').addEventListener('click', () => this.closeHangar());
    document.getElementById('btn-close-hangar-2').addEventListener('click', () => this.closeHangar());

    // Achievements
    document.getElementById('btn-open-achieve').addEventListener('click', () => this.openAchieve());
    document.getElementById('btn-close-achieve').addEventListener('click', () => this.closeAchieve());
    document.getElementById('btn-close-achieve-2').addEventListener('click', () => this.closeAchieve());

    // Multiplayer
    document.getElementById('btn-open-mp').addEventListener('click', () => this.openMP());
    document.getElementById('btn-close-mp').addEventListener('click', () => this.closeMP());
    document.getElementById('btn-close-mp-2').addEventListener('click', () => this.closeMP());

    document.getElementById('btn-create-room').addEventListener('click', () => this.createMPRoom());
    document.getElementById('btn-join-room').addEventListener('click', () => this.joinMPRoom());

    // Leaderboard
    document.getElementById('btn-open-leaderboard').addEventListener('click', () => this.openLeaderboard());
    document.getElementById('btn-close-leaderboard').addEventListener('click', () => this.closeLeaderboard());
    document.getElementById('btn-close-leaderboard-2').addEventListener('click', () => this.closeLeaderboard());
    document.getElementById('btn-refresh-leaderboard').addEventListener('click', () => LeaderboardUI.fetchLeaderboard());

    // Submit
    document.getElementById('btn-close-submit').addEventListener('click', () => this.closeSubmit());
    document.getElementById('btn-skip-submit').addEventListener('click', () => this.closeSubmit());

    document.getElementById('score-form').addEventListener('submit', (e) => {
      e.preventDefault();
      LeaderboardUI.submitScore();
    });

    Storage.updateEnergyUI();
    this.renderHangar();
    this.renderAchieve();
    LeaderboardUI.init();
  },

  isOpen() {
    return (
      this.mHangar.classList.contains('active') ||
      this.mAchieve.classList.contains('active') ||
      this.mMP.classList.contains('active') ||
      this.mLeaderboard.classList.contains('active') ||
      this.mSubmit.classList.contains('active')
    );
  },

  closeAll() {
    this.mHangar.classList.remove('active');
    this.mAchieve.classList.remove('active');
    this.mMP.classList.remove('active');
    this.mLeaderboard.classList.remove('active');
    this.mSubmit.classList.remove('active');
  },

  // ── Hangar ──────────────────────────────────────────────
  openHangar() {
    this.closeAll();
    this.renderHangar();
    this.mHangar.classList.add('active');
  },
  closeHangar() {
    this.mHangar.classList.remove('active');
  },
  renderHangar() {
    const list = document.getElementById('upgrade-list');
    if (!list) return;

    const currentEnergy = Storage.getEnergy();
    list.innerHTML = Object.entries(HANGAR_UPGRADES).map(([key, def]) => {
      const curLvl = Storage.getUpgradeLevel(key);
      const isMax  = curLvl >= def.levels.length - 1;
      const next   = def.levels[curLvl + 1];
      const curDesc = def.levels[curLvl].desc;

      const canBuy = !isMax && currentEnergy >= next.cost;

      return `
        <div class="upgrade-item">
          <div class="upg-info">
            <div class="upg-icon">${def.icon}</div>
            <div>
              <div class="upg-name">${def.name}</div>
              <div class="upg-desc">${def.desc}</div>
              <div class="upg-level">Status: Level ${curLvl} (${curDesc})</div>
            </div>
          </div>
          <div>
            ${isMax ? `
              <button class="btn-buy" disabled>MAX LEVEL</button>
            ` : `
              <button class="btn-buy" ${canBuy ? '' : 'disabled'} onclick="ModalUI.buyUpgrade('${key}', ${next.cost}, ${curLvl + 1})">
                <span>UPGRADE</span>
                <span style="font-size: 11px;">⚡ ${next.cost}</span>
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');
    Storage.updateEnergyUI();
  },
  buyUpgrade(key, cost, nextLvl) {
    if (Storage.getEnergy() >= cost) {
      Storage.setEnergy(Storage.getEnergy() - cost);
      Storage.setUpgradeLevel(key, nextLvl);
      this.renderHangar();
      this.game.ship = new Ship(false); // Reload ship stats immediately
      this.game.snd.upgrade();
      this.game._checkAchievements();
    }
  },

  // ── Achievements ────────────────────────────────────────
  openAchieve() {
    this.closeAll();
    this.renderAchieve();
    this.mAchieve.classList.add('active');
  },
  closeAchieve() {
    this.mAchieve.classList.remove('active');
  },
  renderAchieve() {
    const list = document.getElementById('achieve-list');
    if (!list) return;

    this.game._checkAchievements();

    list.innerHTML = ACHIEVEMENTS_DEF.map(ach => {
      const isUnlocked = localStorage.getItem('achieve_unlocked_' + ach.id) === 'true';
      const isClaimed  = Storage.isClaimed(ach.id);

      return `
        <div class="achieve-item ${isUnlocked ? 'unlocked' : ''}">
          <div>
            <div style="font-weight: bold; color: ${isUnlocked ? '#ffdc32' : '#ffffff'};">${ach.name}</div>
            <div style="font-size: 11px; color: #a0aec0; margin-top: 2px;">${ach.desc}</div>
            <div style="font-size: 11px; color: #32c850; margin-top: 3px;">Hadiah: +${ach.reward} ⚡ Energi</div>
          </div>
          <div>
            ${isClaimed ? `
              <button class="btn-claim" disabled>SUDAH DIKLAIM</button>
            ` : isUnlocked ? `
              <button class="btn-claim" onclick="ModalUI.claimAchieve('${ach.id}', ${ach.reward})">KLAIM ⚡</button>
            ` : `
              <button class="btn-claim" disabled>TERKUNCI</button>
            `}
          </div>
        </div>
      `;
    }).join('');
  },
  claimAchieve(id, reward) {
    if (!Storage.isClaimed(id)) {
      Storage.setClaimed(id);
      Storage.addEnergy(reward);
      this.game.snd.upgrade();
      this.renderAchieve();
    }
  },

  // ── Multiplayer Co-Op ───────────────────────────────────
  openMP() {
    this.closeAll();
    this.mMP.classList.add('active');
  },
  closeMP() {
    this.mMP.classList.remove('active');
  },
  ensureWS() {
    if (!this.game.ws || this.game.ws.readyState !== WebSocket.OPEN) {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${proto}//${location.host}`;
      this.game.ws = new WebSocket(wsUrl);

      this.game.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleMPMessage(msg);
        } catch {}
      };

      this.game.ws.onclose = () => {
        console.log('[WS Closed]');
      };
    }
  },
  createMPRoom() {
    this.ensureWS();
    const sendCreate = () => {
      this.game.ws.send(JSON.stringify({ type: 'CREATE_ROOM' }));
    };
    if (this.game.ws.readyState === WebSocket.OPEN) {
      sendCreate();
    } else {
      this.game.ws.onopen = sendCreate;
    }
  },
  joinMPRoom() {
    const input = document.getElementById('join-code-input');
    const code = (input.value || '').trim().toUpperCase();
    if (!code) return;

    this.ensureWS();
    const sendJoin = () => {
      this.game.ws.send(JSON.stringify({ type: 'JOIN_ROOM', code }));
    };
    if (this.game.ws.readyState === WebSocket.OPEN) {
      sendJoin();
    } else {
      this.game.ws.onopen = sendJoin;
    }
  },
  handleMPMessage(msg) {
    if (msg.type === 'ROOM_CREATED') {
      document.getElementById('create-room-info').style.display = 'block';
      document.getElementById('display-room-code').textContent = msg.code;
      document.getElementById('host-status-msg').textContent = '⏳ Menunggu Player 2 bergabung dengan kode di atas...';
      this.game.isMultiplayer = true;
      this.game.isHost = true;
      this.game.roomCode = msg.code;
    }
    if (msg.type === 'JOIN_ERROR') {
      document.getElementById('join-status-msg').textContent = msg.message;
    }
    if (msg.type === 'ROOM_READY') {
      this.game.isMultiplayer = true;
      this.game.isHost = (msg.role === 'host');
      this.closeAll();
      this.game._reset();
      this.game.state = 'playing';
      this.game.floatingTexts.push(new FloatingText(WIDTH / 2, HEIGHT / 2, '🌐 MULTIPLAYER CO-OP CONNECTED! GO!', '#32c850', 26));
    }
    if (msg.type === 'PLAYER_MOVE') {
      if (this.game.peerShip) {
        this.game.peerShip.x = msg.payload.x;
        this.game.peerShip.y = msg.payload.y;
        this.game.peerShip.lives = msg.payload.lives;
      }
    }
    if (msg.type === 'PLAYER_SHOOT') {
      if (this.game.peerShip) {
        this.game.bullets.push(new Bullet(msg.payload.x + 50, msg.payload.y, 0, 1.2));
        this.game.snd.shoot();
      }
    }
    if (msg.type === 'PEER_DISCONNECTED') {
      this.game.floatingTexts.push(new FloatingText(WIDTH / 2, HEIGHT / 2, '⚠️ Partner Terputus!', '#ff2244', 22));
    }
  },

  // ── Leaderboard ─────────────────────────────────────────
  toggleLeaderboard() {
    if (this.mLeaderboard.classList.contains('active')) {
      this.closeLeaderboard();
    } else {
      this.openLeaderboard();
    }
  },
  openLeaderboard() {
    this.closeAll();
    this.mLeaderboard.classList.add('active');
    LeaderboardUI.fetchLeaderboard();
  },
  closeLeaderboard() {
    this.mLeaderboard.classList.remove('active');
  },
  closeSubmit() {
    this.mSubmit.classList.remove('active');
  }
};

// ═══════════════════════════════════════════════════════════
//  LEADERBOARD UI (SUPABASE INTEGRATION)
// ═══════════════════════════════════════════════════════════
const LeaderboardUI = {
  tbody:        document.getElementById('leaderboard-body'),
  statusText:   document.getElementById('status-text'),
  statusDot:    document.querySelector('.status-dot'),
  nameInput:    document.getElementById('pilot-name-input'),
  scoreDisplay: document.getElementById('submit-score-display'),
  levelDisplay: document.getElementById('submit-level-display'),
  energyReward: document.getElementById('submit-energy-reward'),

  currentPendingScore: 0,
  currentPendingLevel: 1,

  init() {
    const savedName = localStorage.getItem('pilot_name') || 'PILOT-1';
    if (this.nameInput) this.nameInput.value = savedName;
    this.checkStatus();
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
            <td style="font-weight: bold;">${escapeHtml(item.player_name || 'PILOT')}</td>
            <td style="text-align: right;" class="score-cell">${(item.score || 0).toLocaleString()}</td>
            <td style="text-align: right; color: #a0aec0;">Lv ${item.level || 1}</td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      this.tbody.innerHTML = `<tr><td colspan="4" class="empty-state" style="color: #ff4d4d;">Gagal memuat ranking: ${err.message}</td></tr>`;
    }
  },

  promptSubmit(score, level, energy) {
    this.currentPendingScore = score;
    this.currentPendingLevel = level;
    this.scoreDisplay.textContent = score.toLocaleString();
    this.levelDisplay.textContent = `LEVEL ${level}`;
    if (this.energyReward) this.energyReward.textContent = `+${energy} ⚡ ENERGI DIPEROLEH`;

    ModalUI.closeAll();
    ModalUI.mSubmit.classList.add('active');

    setTimeout(() => {
      if (this.nameInput) {
        this.nameInput.focus();
        this.nameInput.select();
      }
    }, 100);
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
      await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_name: pilotName,
          score: this.currentPendingScore,
          level: this.currentPendingLevel
        })
      });
      ModalUI.closeSubmit();
      ModalUI.openLeaderboard();
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

  const game = new Game(canvas);
  ModalUI.init(game);

  window.addEventListener('keydown', e => {
    if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code) && !(document.activeElement && document.activeElement.tagName === 'INPUT')) {
      e.preventDefault();
    }
    game.onKeyDown(e.code);
  });
  window.addEventListener('keyup', e => game.onKeyUp(e.code));

  canvas.addEventListener('click', () => {
    game.onMouseClick();
  });

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
