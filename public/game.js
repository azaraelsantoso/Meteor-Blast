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
//  DIFFICULTY MODES (EASY, MEDIUM, HARD, EXTREME)
// ═══════════════════════════════════════════════════════════
const DIFFICULTY_MODES = {
  easy: {
    id: 'easy',
    name: 'EASY',
    icon: '🟢',
    label: 'Santai / Pemula',
    baseHpBonus: 1.5, // 22,500 - 30,000+ HP
    lives: 5,
    shieldStart: true,
    speedMult: 0.65, // Jauh lebih pelan
    hpMult: 0.8,
    damageBaseMult: 0.5,
    spawnInterval: 110,
    spawnBurstMax: 1, // 1 meteor per spawn
    orbInterval: 480, // ~8 detik
    krocoLevel: 4,
    bossInterval: 5,
    scoreMult: 1.0,
    color: '#32c850',
    desc: 'HP Base 25k+ • 5 Nyawa • Meteor pelan • Banyak Skill Orb'
  },
  medium: {
    id: 'medium',
    name: 'MEDIUM',
    icon: '🟡',
    label: 'Normal / Seimbang',
    baseHpBonus: 1.0, // 15.000 HP
    lives: 4,
    shieldStart: true,
    speedMult: 1.0,
    hpMult: 1.0,
    damageBaseMult: 1.0,
    spawnInterval: 75,
    spawnBurstMax: 2,
    orbInterval: 650,
    krocoLevel: 2,
    bossInterval: 4,
    scoreMult: 1.25,
    color: '#ffdc32',
    desc: 'HP Base 15k • 4 Nyawa • Kecepatan standar • Skor +25%'
  },
  hard: {
    id: 'hard',
    name: 'HARD',
    icon: '🔴',
    label: 'Tantangan Pro',
    baseHpBonus: 0.7, // 10.500 HP
    lives: 3,
    shieldStart: false,
    speedMult: 1.45, // Cepat & agresif!
    hpMult: 1.4,     // Lebih tebal
    damageBaseMult: 1.5,
    spawnInterval: 45, // Kurang dari 1 detik!
    spawnBurstMax: 3, // Hingga 3 meteor bersamaan
    orbInterval: 850,
    krocoLevel: 1, // Kroco aktif sejak Level 1!
    bossInterval: 3,
    scoreMult: 1.8,
    color: '#ff4d4d',
    desc: 'HP Base 10k • 3 Nyawa • Meteor cepat & bergelombang • Kroco Lv 1 • Skor +80%'
  },
  extreme: {
    id: 'extreme',
    name: 'EXTREME',
    icon: '💀',
    label: 'Bullet Hell / Hardcore',
    baseHpBonus: 0.45, // 6.750 HP
    lives: 2,
    shieldStart: false,
    speedMult: 2.1,  // SUPER CEPAT & AGRESIF!
    hpMult: 2.0,     // 2x lebih tebal!
    damageBaseMult: 2.5,
    spawnInterval: 28, // Hujan meteor nonstop!
    spawnBurstMax: 4, // 2-4 meteor sekaligus!
    orbInterval: 1100,
    krocoLevel: 1, // Kroco langsung banyak
    bossInterval: 2, // Boss muncul di Level 2!
    scoreMult: 3.0,
    color: '#c850ff',
    desc: 'HP Base 6.7k • 2 Nyawa • Hujan meteor kilat • Boss Lv 2 • Skor & Energi ×3.0!'
  }
};

// ═══════════════════════════════════════════════════════════
//  PERMANENT HANGAR UPGRADE DEFINITIONS (Energy Currency)
// ═══════════════════════════════════════════════════════════
const HANGAR_UPGRADES = {
  drones: {
    name: 'Wingman Drone',
    icon: '🛸',
    desc: 'Pesawat mini pendamping yang nempel dan ikut menembak',
    levels: [
      { level: 0, cost: 0,    val: 0, desc: 'Belum dipasang' },
      { level: 1, cost: 50,   val: 1, desc: '1 Drone pendamping (tembakan samping)' },
      { level: 2, cost: 140,  val: 2, desc: '2 Drone pendamping (atas & bawah)' },
      { level: 3, cost: 320,  val: 2, desc: '2 Drone peluru plasma kembar' },
      { level: 4, cost: 650,  val: 3, desc: '3 Drone formasi segitiga tempur' },
      { level: 5, cost: 1200, val: 4, desc: '4 Drone skuadron pelindung penuh' },
      { level: 6, cost: 2400, val: 4, desc: '4 Hyper-Drone (Tembakan plasma laser super cepat)' },
      { level: 7, cost: 4500, val: 4, desc: 'Ultimate Drone Armada (Damage drone +100%)' },
    ]
  },
  baseHP: {
    name: 'Base Energy Shield',
    icon: '🏰',
    desc: 'Meningkatkan ketahanan dan total Darah Base utama',
    levels: [
      { level: 0, cost: 0,    val: 15000,  desc: '15.000 Max HP' },
      { level: 1, cost: 40,   val: 22000,  desc: '22.000 Max HP (+45% Darah)' },
      { level: 2, cost: 120,  val: 32000,  desc: '32.000 Max HP (+110% Darah)' },
      { level: 3, cost: 280,  val: 48000,  desc: '48.000 Max HP (+220% Darah)' },
      { level: 4, cost: 550,  val: 70000,  desc: '70.000 Max HP (+360% Darah)' },
      { level: 5, cost: 1100, val: 100000, desc: '100.000 Max HP (Kubah Mega-Fortress)' },
      { level: 6, cost: 2200, val: 150000, desc: '150.000 Max HP (Aegis Titanium Core)' },
      { level: 7, cost: 4000, val: 220000, desc: '220.000 Max HP (Benteng Kosmik Abadi)' },
    ]
  },
  damage: {
    name: 'Plasma Blaster DMG',
    icon: '💥',
    desc: 'Meningkatkan daya hancur peluru tembakan dasar pesawat',
    levels: [
      { level: 0, cost: 0,    val: 1.0,  desc: '1.0× Damage standar' },
      { level: 1, cost: 50,   val: 1.4,  desc: '1.4× Damage (+40%)' },
      { level: 2, cost: 130,  val: 1.9,  desc: '1.9× Damage (+90%)' },
      { level: 3, cost: 300,  val: 2.6,  desc: '2.6× Damage (+160%)' },
      { level: 4, cost: 600,  val: 3.5,  desc: '3.5× Damage (+250%)' },
      { level: 5, cost: 1200, val: 4.8,  desc: '4.8× Damage (+380%)' },
      { level: 6, cost: 2200, val: 6.5,  desc: '6.5× Damage (Hyper-Plasma)' },
      { level: 7, cost: 3800, val: 8.5,  desc: '8.5× Damage (Antimatter Cannon)' },
      { level: 8, cost: 6000, val: 12.0, desc: '12.0× Damage (Supernova Obliterator)' },
    ]
  },
  fireRate: {
    name: 'Gatling Overclock',
    icon: '⚡',
    desc: 'Mempercepat frekuensi tembakan (cooldown lebih singkat)',
    levels: [
      { level: 0, cost: 0,    val: 1.0,  desc: 'Cooldown standar' },
      { level: 1, cost: 50,   val: 0.78, desc: 'Tembakan +28% lebih cepat' },
      { level: 2, cost: 140,  val: 0.60, desc: 'Tembakan +66% lebih cepat' },
      { level: 3, cost: 320,  val: 0.45, desc: 'Hyper-Gatling +120% lebih cepat' },
      { level: 4, cost: 700,  val: 0.34, desc: 'Sonic Gatling +190% lebih cepat' },
      { level: 5, cost: 1400, val: 0.25, desc: 'Tachyon Stream +300% lebih cepat' },
      { level: 6, cost: 2800, val: 0.18, desc: 'Infinity Firestorm (Laser nonstop!)' },
    ]
  },
  speed: {
    name: 'Engine Thrusters',
    icon: '🚀',
    desc: 'Kecepatan manuver maju-mundur dan atas-bawah pesawat',
    levels: [
      { level: 0, cost: 0,    val: 5.5,  desc: 'Kecepatan standar 5.5' },
      { level: 1, cost: 30,   val: 7.0,  desc: 'Kecepatan 7.0 (+27%)' },
      { level: 2, cost: 90,   val: 8.5,  desc: 'Kecepatan 8.5 (+55%)' },
      { level: 3, cost: 240,  val: 10.2, desc: 'Kecepatan 10.2 (+85%)' },
      { level: 4, cost: 550,  val: 12.0, desc: 'Kecepatan 12.0 (+118%)' },
      { level: 5, cost: 1200, val: 14.0, desc: 'Warp Boosters 14.0 (Manuver Kilat)' },
    ]
  },
  shieldMatrix: {
    name: 'Shield Matrix Core',
    icon: '🛡️',
    desc: 'Meningkatkan nyawa cadangan pilot & perlindungan perisai ekstra',
    levels: [
      { level: 0, cost: 0,    livesBonus: 0, shieldBonus: false, desc: 'Tanpa bonus perisai awal' },
      { level: 1, cost: 75,   livesBonus: 1, shieldBonus: false, desc: '+1 Nyawa Ekstra untuk Pilot' },
      { level: 2, cost: 220,  livesBonus: 1, shieldBonus: true,  desc: '+1 Nyawa + Selalu mulai dengan Perisai' },
      { level: 3, cost: 550,  livesBonus: 2, shieldBonus: true,  desc: '+2 Nyawa + Perisai Awal' },
      { level: 4, cost: 1300, livesBonus: 3, shieldBonus: true,  desc: '+3 Nyawa + Perisai Awal' },
      { level: 5, cost: 2800, livesBonus: 4, shieldBonus: true,  desc: '+4 Nyawa + Titanium Invulnerability' },
    ]
  },
  energyMagnet: {
    name: 'Energy Harvester',
    icon: '🔋',
    desc: 'Meningkatkan perolehan ⚡ Energi dari setiap pertempuran & meteor',
    levels: [
      { level: 0, cost: 0,    mult: 1.0, desc: 'Perolehan energi normal (1.0×)' },
      { level: 1, cost: 60,   mult: 1.3, desc: '+30% Bonus Energi di akhir pertempuran' },
      { level: 2, cost: 180,  mult: 1.7, desc: '+70% Bonus Energi' },
      { level: 3, cost: 450,  mult: 2.3, desc: '+130% Bonus Energi' },
      { level: 4, cost: 1100, mult: 3.2, desc: '+220% Bonus Energi' },
      { level: 5, cost: 2500, mult: 4.5, desc: 'Hyper-Harvester (+350% Bonus Energi Raksasa!)' },
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
//  TITLE LOGOS & BRANDING
// ═══════════════════════════════════════════════════════════
const LOGO1_SRC = 'logo1.png';
const LOGO1_REMOTE = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzVWMpmKi_5TTDgk1QvfAH4zGKXENVu0u9SpiUAWlV0A&s=10';
const LOGO2_SRC = 'logo2.png';
const LOGO2_REMOTE = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGGlyaxQlN66lLjse4k1d8rMKQPTRhLCFg6tOxVgwA5A&s=10';

const titleLogo1 = new Image();
titleLogo1.src = LOGO1_SRC;
titleLogo1.onerror = () => { if (titleLogo1.src !== LOGO1_REMOTE) titleLogo1.src = LOGO1_REMOTE; };

const titleLogo2 = new Image();
titleLogo2.src = LOGO2_SRC;
titleLogo2.onerror = () => { if (titleLogo2.src !== LOGO2_REMOTE) titleLogo2.src = LOGO2_REMOTE; };

function drawRoundedImage(ctx, img, x, y, size, radius = 10, glowColor = '#00dcff') {
  if (!img.complete || !img.naturalWidth) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + size - radius, y);
  ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
  ctx.lineTo(x + size, y + size - radius);
  ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
  ctx.lineTo(x + radius, y + size);
  ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  ctx.save();
  ctx.clip();
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();

  ctx.strokeStyle = 'rgba(0, 220, 255, 0.6)';
  ctx.lineWidth = 2.5;
  ctx.shadowBlur = 12;
  ctx.shadowColor = glowColor;
  ctx.stroke();
  ctx.restore();
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

    // Permanent upgrades applied from Hangar (safe bounded lookup)
    const getUpgVal = (cat, defVal) => {
      const list = HANGAR_UPGRADES[cat]?.levels;
      if (!list) return defVal;
      const lvl = Storage.getUpgradeLevel(cat);
      return (list[lvl] || list[list.length - 1]).val ?? defVal;
    };

    const upgSpeed = getUpgVal('speed', 5.5);
    const upgDmg   = getUpgVal('damage', 1.0);
    const upgRate  = getUpgVal('fireRate', 1.0);
    const droneLvl = Storage.getUpgradeLevel('drones');
    const droneDef = HANGAR_UPGRADES.drones.levels[droneLvl] || HANGAR_UPGRADES.drones.levels[0];
    this.droneCount = droneDef.val || 0;
    this.droneLevel = droneLvl;

    this.baseSpeed = upgSpeed;
    this.speedMult = 1.0;

    this.triple    = false;
    this.damage    = upgDmg;
    this.rapidMult = upgRate;
    this.baseCd    = 13;
    this.shootCd   = 0;

    this.lives      = 4; // Bounded by mode in _reset()
    this.shield     = true;
    this.invincible = 0;

    this.shieldPulse = 0;
    this._flameTick  = 0;
  }

  get speed()    { return this.baseSpeed * this.speedMult; }
  get cooldown() { return Math.max(3, Math.floor(this.baseCd * this.rapidMult)); }

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

    // Wingman Drones tembak peluru mini tambahan (bertingkat hingga 4 drone)
    const droneDmg = this.damage * 0.65 * (this.droneLevel >= 7 ? 2.0 : this.droneLevel >= 6 ? 1.4 : 1.0);
    if (this.droneCount >= 1) {
      bullets.push(new Bullet(this.x - 4, this.y - 25, 0, droneDmg, true));
    }
    if (this.droneCount >= 2) {
      bullets.push(new Bullet(this.x - 4, this.y + 25, 0, droneDmg, true));
    }
    if (this.droneCount >= 3) {
      bullets.push(new Bullet(this.x - 24, this.y, 0, droneDmg * 1.1, true));
    }
    if (this.droneCount >= 4) {
      bullets.push(
        new Bullet(this.x + 8, this.y - 35, -7, droneDmg, true),
        new Bullet(this.x + 8, this.y + 35, 7, droneDmg, true)
      );
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
      this.invincible = 120;
      return false;
    }
    this.lives--;
    this.invincible = 120;
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

    // Render Wingman Drones nempel pada kapal player (hingga 4 drone)
    if (this.droneCount >= 1) this._drawDrone(ctx, this.x - 10, this.y - 25);
    if (this.droneCount >= 2) this._drawDrone(ctx, this.x - 10, this.y + 25);
    if (this.droneCount >= 3) this._drawDrone(ctx, this.x - 24, this.y);
    if (this.droneCount >= 4) {
      this._drawDrone(ctx, this.x + 10, this.y - 36);
      this._drawDrone(ctx, this.x + 10, this.y + 36);
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
    this.id = options.id || ('m_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7));
    this.isSplitter = options.isSplitter !== undefined ? options.isSplitter : false;
    this.isChild = options.isChild || false;

    if (options.preset) {
      // Direct synchronization from host in multiplayer!
      this.type = options.type;
      this.radius = options.radius;
      this.speed = options.speed;
      this.hp = options.hp;
      this.maxHp = options.maxHp;
      this.colorStr = options.colorStr;
      this.isSplitter = options.isSplitter;
      this.isChild = options.isChild;
      this.x = options.x;
      this.y = options.y;
      this.vy = options.vy || 0;
      this.damageBaseMult = options.damageBaseMult || 1.0;
    } else if (this.isChild) {
      this.type = 'small';
      this.radius = options.radius || 18;
      this.speed = options.speed || 3.0;
      this.hp = Math.max(1, options.hp || 1);
      this.maxHp = this.hp;
      this.colorStr = options.colorStr || '#87735a';
      this.x = options.x;
      this.y = options.y;
      this.vy = options.vy || 0;
      this.damageBaseMult = options.damageBaseMult || 1.0;
    } else {
      const roll = Math.random();
      const hpMult = options.hpMult || 1.0;
      // Splitter / Tank Meteor besar (bisa membelah 2)
      if (difficulty >= 1.8 && roll < 0.28) {
        this.type = 'tank';
        this.isSplitter = true; // BISA TERBELAH DUA SAAT HANCUR
        this.radius = randInt(32, 44);
        this.speed = Math.min(1.0 + difficulty * 0.22, 3.0);
        this.hp = Math.max(2, Math.round(this.radius * 0.08 * difficulty * hpMult));
        this.colorStr = '#42283c'; // Obsidian gelap
      } else if (roll > 0.72) {
        this.type = 'fast';
        this.radius = randInt(14, 20);
        this.speed = Math.min(2.4 + difficulty * 0.38, 5.8);
        this.hp = Math.max(1, Math.round(1 * hpMult));
        this.colorStr = '#ff4d4d'; // Merah cepat
      } else {
        this.type = 'normal';
        this.radius = randInt(18, 30);
        this.speed = Math.min(1.2 + difficulty * 0.28, 4.2);
        this.hp = Math.max(1, Math.round(this.radius * 0.06 * difficulty * hpMult));
        this.colorStr = choice(METEOR_PALETTES);
      }
      this.maxHp = this.hp;
      this.x = WIDTH + this.radius + 10;
      this.y = randFloat(this.radius + 15, HEIGHT - this.radius - 15);
      this.vy = 0;
      this.speed = this.speed * (options.speedMult || 1.0);
      this.damageBaseMult = options.damageBaseMult || 1.0;
    }

    this.angle    = randFloat(0, Math.PI * 2);
    this.rotSpeed = randFloat(-0.03, 0.03);
    this.darkerStr = darkenHex(this.colorStr, 50);

    this._verts   = this._genVerts();
    this._craters = this._genCraters();
  }

  toPreset() {
    return {
      preset: true,
      id: this.id,
      type: this.type,
      radius: this.radius,
      speed: this.speed,
      hp: this.hp,
      maxHp: this.maxHp,
      colorStr: this.colorStr,
      isSplitter: this.isSplitter,
      isChild: this.isChild,
      x: Math.round(this.x),
      y: Math.round(this.y),
      vy: this.vy,
      damageBaseMult: this.damageBaseMult
    };
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

  // Base Damage jika lolos ke kiri menabrak Base (disesuaikan dengan mode kesulitan)
  getBaseDamage() {
    let base = 80;
    if (this.type === 'tank') base = 500;
    else if (this.type === 'fast') base = 150;
    else if (this.radius > 28)     base = 250;
    return Math.round(base * (this.damageBaseMult || 1.0));
  }

  get offScreen() {
    return this.x < -this.radius * 3;
  }
}

// ═══════════════════════════════════════════════════════════
//  MUSUH KROCO (ALIEN SCOUT SHIP)
// ═══════════════════════════════════════════════════════════
class Kroco {
  constructor(difficulty = 1, options = {}) {
    this.id = options.id || ('k_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
    this.x = options.x !== undefined ? options.x : WIDTH + 40;
    this.y = options.y !== undefined ? options.y : randFloat(80, HEIGHT - 80);
    this.speed = options.speed || randFloat(1.6, 2.4);
    this.hp = options.hp || Math.max(1, Math.floor(1 + difficulty * 0.3));
    this.maxHp = options.maxHp || this.hp;
    this.w = 34;
    this.h = 24;
    this.wobble = randFloat(0, Math.PI * 2);
    this.shootTimer = randInt(80, 160);
  }

  update() {
    this.x -= this.speed;
    this.wobble += 0.04;
    this.y += Math.sin(this.wobble) * 1.4;
  }

  tryShoot(snd) {
    if (--this.shootTimer <= 0) {
      this.shootTimer = randInt(140, 240);
      snd.enemyShoot();
      return new EnemyBullet(this.x - 16, this.y, -4.5, 0, 1);
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
  getBaseDamage() { return 120; }
  get offScreen() { return this.x < -40; }
}

// ═══════════════════════════════════════════════════════════
//  BOSS (CYBER DREADNOUGHT MOTHERSHIP)
// ═══════════════════════════════════════════════════════════
class Boss {
  constructor(level = 4) {
    this.x = WIDTH + 120;
    this.targetX = WIDTH - 130;
    this.y = HEIGHT / 2;
    this.w = 90;
    this.h = 140;
    this.hp = 30 + level * 8; // HP Boss lebih rasional dan tidak tebal berlebihan
    this.maxHp = this.hp;
    this.vy = 1.6;
    this.shootTimer = 70;
    this.minionTimer = 320;
    this.pulse = 0;
  }

  update() {
    // Masuk ke posisi target di sisi kanan
    if (this.x > this.targetX) {
      this.x -= 1.6;
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
      this.shootTimer = 110;
      snd.enemyShoot();
      // Triple spread laser (kecepatan bersahabat)
      bullets.push(
        new EnemyBullet(this.x - 35, this.y - 30, -4.2, -1.0, 1),
        new EnemyBullet(this.x - 40, this.y,      -4.8,  0,   1),
        new EnemyBullet(this.x - 35, this.y + 30, -4.2,  1.0, 1)
      );
    }
    return bullets;
  }

  trySpawnMinion() {
    if (--this.minionTimer <= 0) {
      this.minionTimer = 340;
      const k = new Kroco(1.5);
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
  static UPGRADE_SPAWN_INTERVAL = 700; // ~11-12 detik sekali (lebih sering memberi skill orb!)
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
    const modeKey = localStorage.getItem('preferred_difficulty') || 'medium';
    this.mode = DIFFICULTY_MODES[modeKey] || DIFFICULTY_MODES.medium;

    this.ship = new Ship(false);

    // Apply shieldMatrix permanent upgrades
    const shieldLvl = Storage.getUpgradeLevel('shieldMatrix');
    const matrixDef = (HANGAR_UPGRADES.shieldMatrix?.levels[shieldLvl]) || HANGAR_UPGRADES.shieldMatrix.levels[0];
    this.ship.lives = this.mode.lives + (matrixDef.livesBonus || 0);
    this.ship.shield = this.mode.shieldStart || matrixDef.shieldBonus;

    if (this.isMultiplayer) {
      this.peerShip = new Ship(true);
      this.peerShip.lives = this.ship.lives;
      this.peerShip.shield = this.ship.shield;
      this.peerShip.y = HEIGHT / 2 + 60;
    } else {
      this.peerShip = null;
    }

    // Base HP diinisialisasi dari upgrade Hangar & disesuaikan Mode Kesulitan
    const baseHPList = HANGAR_UPGRADES.baseHP.levels;
    const baseHPLvl = Storage.getUpgradeLevel('baseHP');
    const upgBaseHP = (baseHPList[baseHPLvl] || baseHPList[baseHPList.length - 1]).val;
    this.baseMaxHp  = Math.round(upgBaseHP * this.mode.baseHpBonus);
    this.baseHp     = this.baseMaxHp;

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
    this.spawnInterval = this.mode ? this.mode.spawnInterval : 75;
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

  _broadcastMP(msg) {
    if (this.isMultiplayer && this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(msg));
      } catch {}
    }
  }

  _addScore(amount) {
    const prevMilestone = Math.floor(this.score / 100000);
    this.score += amount;
    const newMilestone = Math.floor(this.score / 100000);

    if (newMilestone > prevMilestone) {
      const earnedMilestones = newMilestone - prevMilestone;
      const energyBonus = earnedMilestones * 10;
      Storage.addEnergy(energyBonus);
      this.snd.upgrade();
      this.floatingTexts.push(new FloatingText(
        WIDTH / 2,
        HEIGHT / 2 - 40,
        `🎉 TERCAPAI ${(newMilestone * 100).toLocaleString()}K SKOR! +${energyBonus} ⚡ ENERGI`,
        '#32c850',
        22
      ));
    }
  }

  _hideTopBar() {
    const tb = document.querySelector('.top-bar');
    if (tb) tb.classList.add('hidden');
  }

  _showTopBar() {
    const tb = document.querySelector('.top-bar');
    if (tb) tb.classList.remove('hidden');
  }

  setDifficultyMode(modeId) {
    if (DIFFICULTY_MODES[modeId]) {
      this.mode = DIFFICULTY_MODES[modeId];
      localStorage.setItem('preferred_difficulty', modeId);
      if (this.state === 'title' || this.state === 'gameover') {
        this._reset();
      }
    }
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

    if (this.isMultiplayer && this.isHost) {
      this._broadcastMP({
        type: 'SYNC_GAME_STATE',
        baseHp: this.baseHp,
        baseMaxHp: this.baseMaxHp,
        score: this.score,
        level: this.level
      });
    }

    if (this.baseHp <= 0) {
      this._gameOver('BASE PERTAHANAN HANCUR!');
    }
  }

  _gameOver(reason = 'GAME OVER') {
    this.state = 'gameover';
    this.gameOverReason = reason;
    this._showTopBar();

    if (this.score > this.highScore) {
      this.highScore = this.score;
      try { localStorage.setItem('meteor_high_score', String(this.highScore)); } catch {}
    }

    // Hitung Energi yang didapat: tergantung score, level, pengali mode kesulitan & upgrade energyMagnet
    const harvestDef = HANGAR_UPGRADES.energyMagnet?.levels;
    const harvestLvl = Storage.getUpgradeLevel('energyMagnet');
    const harvestMult = (harvestDef && harvestDef[harvestLvl] ? harvestDef[harvestLvl].mult : 1.0);

    const scoreMult = this.mode ? this.mode.scoreMult : 1.25;
    const earnedEnergy = Math.max(25, Math.floor((this.score / 25 + this.level * 30 + 40) * scoreMult * harvestMult));
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
            this._addScore(pts);
            Storage.incStat('meteors_hit', 1);

            if (this.isMultiplayer) {
              this._broadcastMP({ type: 'METEOR_DESTROY', id: m.id });
            }

            // METEOR BESAR TERBELAH DUA (SPLITTER MECHANIC)
            if (m.isSplitter && !m.isChild) {
              Storage.incStat('splitters_hit', 1);
              this.snd.split();
              this.floatingTexts.push(new FloatingText(m.x, m.y - 20, '💥 SPLIT!', '#00dcff', 18));
              // Spawn 2 pecahan kecil
              const c1 = new Meteor(this.difficulty, { isChild: true, x: m.x, y: m.y - 14, vy: -1.2, radius: 18, speed: m.speed * 1.2, colorStr: m.colorStr });
              const c2 = new Meteor(this.difficulty, { isChild: true, x: m.x, y: m.y + 14, vy: 1.2,  radius: 18, speed: m.speed * 1.2, colorStr: m.colorStr });
              this.meteors.push(c1, c2);

              if (this.isMultiplayer) {
                this._broadcastMP({
                  type: 'SPAWN_METEORS_BATCH',
                  meteors: [c1.toPreset(), c2.toPreset()],
                  difficulty: this.difficulty
                });
              }
            }

            this.floatingTexts.push(new FloatingText(m.x, m.y, `+${pts}`, '#ffdc32', 15));
            this._explode(m.x, m.y, m.colorStr, m.type === 'tank' ? 36 : 24);
            this.snd.explode(m.type === 'tank');
            if (m.type === 'tank') this.shake = Math.max(this.shake, 6);
          } else {
            this._explode(b.x, b.y, b.color, 5);
            if (this.isMultiplayer) {
              this._broadcastMP({ type: 'METEOR_DAMAGE', id: m.id, damage: b.damage });
            }
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
            this._addScore(250);
            Storage.incStat('kroco_hit', 1);
            this.floatingTexts.push(new FloatingText(k.x, k.y, '+250', '#ff5577', 16));
            this._explode(k.x, k.y, '#ff0055', 28);
            this.snd.explode(false);
            if (this.isMultiplayer) {
              this._broadcastMP({ type: 'KROCO_HIT', id: k.id, damage: b.damage });
            }
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
            this._addScore(5000);
            Storage.incStat('boss_hit', 1);
            Storage.addEnergy(200);
            this._explode(this.boss.x, this.boss.y, '#ff0055', 60);
            this._explode(this.boss.x, this.boss.y, '#ffdc32', 40);
            this.snd.explode(true);
            this.floatingTexts.push(new FloatingText(WIDTH / 2, HEIGHT / 2, '👑 BOSS DEFEATED! +5,000 PTS & +200 ⚡', '#ffdc32', 24));
            if (this.isMultiplayer) {
              this._broadcastMP({ type: 'BOSS_DEFEATED' });
            }
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
          payload: {
            x: this.ship.x,
            y: this.ship.y,
            damage: this.ship.damage,
            triple: this.ship.triple,
            droneCount: this.ship.droneCount
          }
        }));
      }
    }

    for (const b of this.bullets) b.update();
    this.bullets = this.bullets.filter(b => !b.offScreen);

    for (const eb of this.enemyBullets) eb.update();
    this.enemyBullets = this.enemyBullets.filter(eb => !eb.offScreen);

    // Spawn Meteor dari Kanan (Hanya Host yang spawn jika multiplayer)
    const mOpts = {
      speedMult: this.mode ? this.mode.speedMult : 1.0,
      hpMult: this.mode ? this.mode.hpMult : 1.0,
      damageBaseMult: this.mode ? this.mode.damageBaseMult : 1.0
    };

    if (!this.isMultiplayer || this.isHost) {
      if (++this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer = 0;
        const burst = (this.mode && this.mode.spawnBurstMax > 1)
          ? randInt(1, this.mode.spawnBurstMax)
          : 1;

        const newMeteors = [];
        for (let i = 0; i < burst; i++) {
          const m = new Meteor(this.difficulty, mOpts);
          this.meteors.push(m);
          newMeteors.push(m.toPreset());
        }

        if (this.isMultiplayer && newMeteors.length > 0) {
          this._broadcastMP({
            type: 'SPAWN_METEORS_BATCH',
            meteors: newMeteors,
            difficulty: this.difficulty
          });
        }
      }
    }

    // Spawn Kroco Alien Drones (Hanya Host yang spawn jika multiplayer)
    if (!this.isMultiplayer || this.isHost) {
      const krocoMinLvl = this.mode ? this.mode.krocoLevel : 3;
      const krocoRate = (this.mode && this.mode.id === 'extreme') ? 0.025 : (this.mode && this.mode.id === 'hard') ? 0.012 : 0.005;
      const krocoMax = (this.mode && this.mode.id === 'extreme') ? 4 : (this.mode && this.mode.id === 'hard') ? 3 : 2;

      if (this.level >= krocoMinLvl && Math.random() < krocoRate + this.difficulty * 0.002 && this.krocos.length < krocoMax) {
        const k = new Kroco(this.difficulty);
        this.krocos.push(k);
        if (this.isMultiplayer) {
          this._broadcastMP({
            type: 'SPAWN_KROCO',
            id: k.id,
            x: k.x,
            y: k.y,
            hp: k.hp,
            maxHp: k.maxHp,
            speed: k.speed
          });
        }
      }
    }

    // Spawn Boss (Hanya Host yang spawn jika multiplayer)
    if (!this.isMultiplayer || this.isHost) {
      const bossInterval = this.mode ? this.mode.bossInterval : 4;
      if (this.level >= bossInterval && !this.boss && (this.level % bossInterval === 0) && this.diffTimer === 1) {
        this.boss = new Boss(this.level);
        this.bossAlert = 180;
        this.snd.bossWarning();
        this.shake = 16;
        if (this.isMultiplayer) {
          this._broadcastMP({ type: 'SPAWN_BOSS', level: this.level });
        }
      }
    }

    // Host periodically syncs positions & health to guest every 20 ticks (~3x/sec)
    if (this.isMultiplayer && this.isHost && this.tick % 20 === 0) {
      this._broadcastMP({
        type: 'SYNC_GAME_STATE',
        baseHp: this.baseHp,
        baseMaxHp: this.baseMaxHp,
        score: this.score,
        level: this.level,
        meteors: this.meteors.slice(0, 35).map(m => ({ id: m.id, x: Math.round(m.x), y: Math.round(m.y), hp: m.hp }))
      });
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
      if (minion) {
        this.krocos.push(minion);
        if (this.isMultiplayer && this.isHost) {
          this._broadcastMP({
            type: 'SPAWN_KROCO',
            id: minion.id,
            x: minion.x,
            y: minion.y,
            hp: minion.hp,
            maxHp: minion.maxHp,
            speed: minion.speed
          });
        }
      }
    }

    // Spawn Orb Upgrade Bulat
    const orbSpawnInt = this.mode ? this.mode.orbInterval : 700;
    if (this.upgradeOrbs.length === 0 && ++this.orbSpawnTimer >= orbSpawnInt && (!this.isMultiplayer || this.isHost)) {
      this.orbSpawnTimer = 0;
      const pick = choice(UPGRADE_DEFS);
      const orb = new UpgradeOrb(pick);
      this.upgradeOrbs.push(orb);
      this.floatingTexts.push(new FloatingText(WIDTH - 160, 50, '✦ SKILL ORB INCOMING! ✦', '#00dcff', 16));
      if (this.isMultiplayer) {
        this._broadcastMP({ type: 'SPAWN_ORB', kind: pick.kind, x: orb.x, y: orb.y });
      }
    }

    for (const orb of this.upgradeOrbs) orb.update();
    this.upgradeOrbs = this.upgradeOrbs.filter(o => !o.offScreen);

    // Difficulty ramp setiap 15 detik (900 ticks) - kenaikan difficulty lebih santai
    if (++this.diffTimer >= 900) {
      this.diffTimer     = 0;
      this.difficulty    = Math.min(this.difficulty + 0.12, 4.5);
      this.spawnInterval = Math.max(42, this.spawnInterval - 4);
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

    if (code === 'KeyK') {
      ModalUI.toggleGuide();
      return;
    }

    if (code === 'KeyH') {
      ModalUI.openHangar();
      return;
    }

    if (code === 'KeyT') {
      ModalUI.openAchieve();
      return;
    }

    if (code === 'KeyM') {
      ModalUI.openMP();
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
      if (this.state === 'title')    { this._reset(); this.state = 'playing'; this._hideTopBar(); }
      if (this.state === 'gameover') { this._reset(); this.state = 'playing'; this._hideTopBar(); }
    }
  }

  onKeyUp(code) { delete this.keys[code]; }

  onMouseClick() {
    if (ModalUI.isOpen()) return;
    this.snd.unlock();
    if (this.state === 'title')    { this._reset(); this.state = 'playing'; this._hideTopBar(); }
    if (this.state === 'gameover') { this._reset(); this.state = 'playing'; this._hideTopBar(); }
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

    if (this.mode) {
      ctx.fillStyle = this.mode.color;
      ctx.font = 'bold 12px Consolas, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${this.mode.icon} ${this.mode.name} [${this.mode.scoreMult}×]`, WIDTH - 340, 42);
    }

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

    ctx.fillStyle = '#64748b';
    ctx.font = '12px Consolas, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('[W/A/S/D / Sentuh HP] Gerak • [K] Panduan • [P] Pause', WIDTH - 14, HEIGHT - 14);
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

    // 1. Logo di Halaman Utama (Dua logo di tengah atas)
    const logoSize = 64;
    const gap = 16;
    const totalW = logoSize * 2 + gap;
    const startX = (WIDTH - totalW) / 2;
    const logoY = 46;

    drawRoundedImage(ctx, titleLogo1, startX, logoY, logoSize, 12, '#00dcff');
    drawRoundedImage(ctx, titleLogo2, startX + logoSize + gap, logoY, logoSize, 12, '#ffdc32');

    ctx.save();
    ctx.shadowBlur  = 32; ctx.shadowColor = `rgb(${tr},${tg},255)`;
    ctx.fillStyle   = `rgb(${tr},${tg},255)`;
    ctx.font        = 'bold 72px Impact, Arial, sans-serif';
    ctx.textAlign   = 'center';
    ctx.fillText('METEOR BLASTER', WIDTH / 2, HEIGHT / 3 - 6);
    ctx.restore();

    const activeMode = this.mode || DIFFICULTY_MODES.medium;
    ctx.fillStyle = activeMode.color;
    ctx.font      = 'bold 17px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`MODE AKTIF: ${activeMode.icon} ${activeMode.name} — ${activeMode.label} (Bonus Skor & ⚡ ×${activeMode.scoreMult})`, WIDTH / 2, HEIGHT / 3 + 36);

    ctx.fillStyle = '#a8b2bc';
    ctx.font      = '15px Consolas, monospace';
    ctx.fillText(`Pertahankan Base 🏰 (HP ${this.baseMaxHp.toLocaleString()}) dari Gempuran Meteor & Alien!`, WIDTH / 2, HEIGHT / 3 + 62);

    ctx.fillStyle = '#94a3b8';
    ctx.font      = '14px Consolas, monospace';
    const lines = [
      'W / A / S / D  : Gerak 4 Arah (Bisa Maju-Mundur & Naik-Turun)',
      'SPACE (Tahan)  : Tembak Laser Otomatis (Auto-Fire Cepat)',
      'LAYAR SENTUH   : Sentuh / Geser layar HP untuk menggerakkan pesawat!',
      'PILIH MODE     : Klik tombol Mode di atas (EASY, MEDIUM, HARD, EXTREME)',
      'PANDUAN & TIPS : Tekan [K] atau klik tombol "📖 CARA MAIN" di atas',
    ];
    for (let i = 0; i < lines.length; i++)
      ctx.fillText(lines[i], WIDTH / 2, HEIGHT / 2 + 10 + i * 24);

    const blink = Math.floor(this.tick / 30) % 2 === 0 ? '#ffffff' : '#686878';
    ctx.fillStyle = blink;
    ctx.font      = 'bold 22px Consolas, monospace';
    ctx.fillText('TEKAN SPACE / SENTUH LAYAR UNTUK MULAI', WIDTH / 2, HEIGHT * 3 / 4 + 38);

    // Credit di bawah pojok kiri
    ctx.save();
    ctx.textAlign = 'left';
    ctx.font = 'bold 14px Consolas, monospace';
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0, 220, 255, 0.4)';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Credit: Azarael', 24, HEIGHT - 38);
    ctx.fillStyle = '#00dcff';
    ctx.fillText('        Rian', 24, HEIGHT - 20);
    ctx.restore();

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
    ctx.fillText(this.gameOverReason || 'GAME OVER', WIDTH / 2, HEIGHT / 3 - 10);
    ctx.restore();

    const activeMode = this.mode || DIFFICULTY_MODES.medium;
    ctx.fillStyle = activeMode.color;
    ctx.font      = 'bold 18px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Mode: ${activeMode.icon} ${activeMode.name} (${activeMode.label})`, WIDTH / 2, HEIGHT / 3 + 42);

    ctx.fillStyle = '#ffffff';
    ctx.font      = 'bold 24px Consolas, monospace';
    ctx.fillText(`Skor Akhir : ${this.score.toLocaleString()}`,       WIDTH / 2, HEIGHT / 3 + 76);
    ctx.fillStyle = '#ffdc32';
    ctx.fillText(`Rekor Terbaik: ${this.highScore.toLocaleString()}`, WIDTH / 2, HEIGHT / 3 + 106);

    if (this.lastEarnedEnergy) {
      ctx.fillStyle = '#32c850';
      ctx.font = 'bold 20px Consolas, monospace';
      ctx.fillText(`+${this.lastEarnedEnergy} ⚡ Energi Berhasil Dikumpulkan!`, WIDTH / 2, HEIGHT / 3 + 144);
    }

    const blink = Math.floor(this.tick / 30) % 2 === 0 ? '#ffffff' : '#686878';
    ctx.fillStyle = blink;
    ctx.font      = 'bold 22px Consolas, monospace';
    ctx.fillText('TEKAN SPACE / SENTUH LAYAR UNTUK MAIN LAGI', WIDTH / 2, HEIGHT * 3 / 4 + 14);

    // Credit di bawah pojok kiri
    ctx.save();
    ctx.textAlign = 'left';
    ctx.font = 'bold 14px Consolas, monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Credit: Azarael', 24, HEIGHT - 38);
    ctx.fillStyle = '#00dcff';
    ctx.fillText('        Rian', 24, HEIGHT - 20);
    ctx.restore();

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
    if (this.mode && this.mode.id === 'extreme') {
      bg.addColorStop(0, '#160416');
      bg.addColorStop(0.5, '#2b061d');
      bg.addColorStop(1, '#0e020d');
    } else if (this.mode && this.mode.id === 'hard') {
      bg.addColorStop(0, '#170407');
      bg.addColorStop(0.5, '#280710');
      bg.addColorStop(1, '#0c0205');
    } else if (this.mode && this.mode.id === 'easy') {
      bg.addColorStop(0, '#040d16');
      bg.addColorStop(0.5, '#061722');
      bg.addColorStop(1, '#020910');
    } else {
      bg.addColorStop(0, '#0a0a16');
      bg.addColorStop(1, '#180922');
    }
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
  mGuide:       document.getElementById('modal-guide'),
  mHangar:      document.getElementById('modal-hangar'),
  mAchieve:     document.getElementById('modal-achieve'),
  mMP:          document.getElementById('modal-mp'),
  mLeaderboard: document.getElementById('modal-leaderboard'),
  mSubmit:      document.getElementById('modal-submit-score'),

  init(game) {
    this.game = game;

    // Panduan / Beginner Guide
    document.getElementById('btn-open-guide').addEventListener('click', () => this.openGuide());
    document.getElementById('btn-close-guide').addEventListener('click', () => this.closeGuide());
    document.getElementById('btn-close-guide-2').addEventListener('click', () => this.closeGuide());

    // Difficulty Mode Selector Tabs
    const curMode = localStorage.getItem('preferred_difficulty') || 'medium';
    document.querySelectorAll('.mode-tab').forEach(tab => {
      if (tab.dataset.mode === curMode) tab.classList.add('active');
      else tab.classList.remove('active');

      tab.addEventListener('click', () => {
        document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.game.setDifficultyMode(tab.dataset.mode);
      });
    });

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
      (this.mGuide && this.mGuide.classList.contains('active')) ||
      this.mHangar.classList.contains('active') ||
      this.mAchieve.classList.contains('active') ||
      this.mMP.classList.contains('active') ||
      this.mLeaderboard.classList.contains('active') ||
      this.mSubmit.classList.contains('active')
    );
  },

  closeAll() {
    if (this.mGuide) this.mGuide.classList.remove('active');
    this.mHangar.classList.remove('active');
    this.mAchieve.classList.remove('active');
    this.mMP.classList.remove('active');
    this.mLeaderboard.classList.remove('active');
    this.mSubmit.classList.remove('active');
  },

  // ── Panduan / Beginner Guide ─────────────────────────────
  openGuide() {
    this.closeAll();
    if (this.mGuide) this.mGuide.classList.add('active');
  },
  closeGuide() {
    if (this.mGuide) this.mGuide.classList.remove('active');
  },
  toggleGuide() {
    if (this.mGuide && this.mGuide.classList.contains('active')) {
      this.closeGuide();
    } else {
      this.openGuide();
    }
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
      this.game._hideTopBar();
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
        const p = msg.payload || {};
        const px = p.x !== undefined ? p.x : this.game.peerShip.x;
        const py = p.y !== undefined ? p.y : this.game.peerShip.y;
        const dmg = p.damage || 1.0;
        this.game.snd.shoot();
        if (p.triple) {
          this.game.bullets.push(
            new Bullet(px + 50, py, -12, dmg),
            new Bullet(px + 50, py, 0, dmg),
            new Bullet(px + 50, py, 12, dmg)
          );
        } else {
          this.game.bullets.push(new Bullet(px + 50, py, 0, dmg));
        }
        if (p.droneCount >= 1) {
          this.game.bullets.push(new Bullet(px - 4, py - 25, 0, dmg * 0.65, true));
        }
        if (p.droneCount >= 2) {
          this.game.bullets.push(new Bullet(px - 4, py + 25, 0, dmg * 0.65, true));
        }
      }
    }
    if (msg.type === 'SPAWN_METEORS_BATCH') {
      if (!this.game.isHost && Array.isArray(msg.meteors)) {
        for (const mData of msg.meteors) {
          this.game.meteors.push(new Meteor(msg.difficulty || 1, mData));
        }
      }
    }
    if (msg.type === 'METEOR_DESTROY') {
      const target = this.game.meteors.find(m => m.id === msg.id);
      if (target) {
        this.game.meteors = this.game.meteors.filter(m => m.id !== msg.id);
        this.game._explode(target.x, target.y, target.colorStr, target.type === 'tank' ? 36 : 24);
        this.game.snd.explode(target.type === 'tank');
      }
    }
    if (msg.type === 'METEOR_DAMAGE') {
      const target = this.game.meteors.find(m => m.id === msg.id);
      if (target) {
        target.hit(msg.damage);
      }
    }
    if (msg.type === 'SPAWN_KROCO') {
      if (!this.game.isHost) {
        const k = new Kroco(this.game.difficulty, msg);
        this.game.krocos.push(k);
      }
    }
    if (msg.type === 'KROCO_HIT') {
      const k = this.game.krocos.find(item => item.id === msg.id);
      if (k && k.hit(msg.damage)) {
        this.game.krocos = this.game.krocos.filter(item => item.id !== msg.id);
        this.game._explode(k.x, k.y, '#ff0055', 28);
        this.game.snd.explode(false);
      }
    }
    if (msg.type === 'SPAWN_BOSS') {
      if (!this.game.isHost) {
        this.game.boss = new Boss(msg.level || this.game.level);
        this.game.bossAlert = 180;
        this.game.snd.bossWarning();
        this.game.shake = 16;
      }
    }
    if (msg.type === 'BOSS_DEFEATED') {
      if (this.game.boss) {
        this.game._explode(this.game.boss.x, this.game.boss.y, '#ff0055', 60);
        this.game._explode(this.game.boss.x, this.game.boss.y, '#ffdc32', 40);
        this.game.snd.explode(true);
        this.game.floatingTexts.push(new FloatingText(WIDTH / 2, HEIGHT / 2, '👑 BOSS DEFEATED! +5,000 PTS & +200 ⚡', '#ffdc32', 24));
        this.game.boss = null;
      }
    }
    if (msg.type === 'SPAWN_ORB') {
      if (!this.game.isHost) {
        const def = UPGRADE_DEFS.find(u => u.kind === msg.kind) || UPGRADE_DEFS[0];
        const orb = new UpgradeOrb(def);
        orb.x = msg.x;
        orb.y = msg.y;
        this.game.upgradeOrbs.push(orb);
      }
    }
    if (msg.type === 'SYNC_GAME_STATE') {
      if (!this.game.isHost) {
        if (msg.baseHp !== undefined) this.game.baseHp = msg.baseHp;
        if (msg.baseMaxHp !== undefined) this.game.baseMaxHp = msg.baseMaxHp;
        if (msg.score !== undefined) this.game.score = msg.score;
        if (msg.level !== undefined) this.game.level = msg.level;
        if (Array.isArray(msg.meteors)) {
          const hostIds = new Set();
          for (const hm of msg.meteors) {
            hostIds.add(hm.id);
            const local = this.game.meteors.find(m => m.id === hm.id);
            if (local) {
              local.x = (local.x * 0.7) + (hm.x * 0.3);
              local.y = (local.y * 0.7) + (hm.y * 0.3);
              local.hp = hm.hp;
            }
          }
          this.game.meteors = this.game.meteors.filter(m => hostIds.has(m.id) || m.x > WIDTH - 100);
        }
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
//  LEADERBOARD UI (SUPABASE + FAILSAFE INTEGRATION)
// ═══════════════════════════════════════════════════════════
const SUPABASE_REST_URL = 'https://famcdzykmsvallzogddb.supabase.co/rest/v1';
const SUPABASE_ANON_KEY = 'sb_publishable_6iTtEjm1Ne2_9ttkl1p--w_HDDj_I0c';

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
    // Coba endpoint lokal / vercel
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        this.statusDot.className = 'status-dot';
        this.statusText.textContent = '🟢 Terhubung ke Supabase Cloud';
        return;
      }
    } catch {}

    // Failsafe: Cek langsung ke REST API Supabase
    try {
      const res = await fetch(`${SUPABASE_REST_URL}/leaderboard?select=id&limit=1`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
      });
      if (res.ok) {
        this.statusDot.className = 'status-dot';
        this.statusText.textContent = '🟢 Terhubung ke Supabase Cloud';
        return;
      }
    } catch {}

    this.statusDot.className = 'status-dot yellow';
    this.statusText.textContent = '🟡 Mode Offline / Tersimpan Lokal';
  },

  async fetchLeaderboard() {
    this.tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Memuat data ranking...</td></tr>';
    let scores = [];

    // 1. Coba lewat backend API (/api/leaderboard)
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        scores = Array.isArray(data) ? data : (data.scores || []);
      }
    } catch (e) {
      console.warn('Backend /api/leaderboard offline, mencoba Supabase REST langsung...', e);
    }

    // 2. Failsafe: Jika backend kosong atau error, ambil langsung dari Cloud Supabase via REST API
    if (scores.length === 0) {
      try {
        const res = await fetch(`${SUPABASE_REST_URL}/leaderboard?select=id,player_name,score,level,created_at&order=score.desc&limit=10`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Accept': 'application/json'
          }
        });
        if (res.ok) {
          const cloudData = await res.json();
          if (Array.isArray(cloudData) && cloudData.length > 0) {
            scores = cloudData;
          }
        }
      } catch (e) {
        console.warn('Direct Supabase fetch fallback error:', e);
      }
    }

    // 3. Failsafe: Jika internet mati total, ambil dari cache lokal
    if (scores.length === 0) {
      try {
        scores = JSON.parse(localStorage.getItem('cached_scores') || '[]');
      } catch {}
    }

    if (scores.length === 0) {
      this.tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Belum ada skor yang tercatat. Jadilah yang pertama!</td></tr>';
      return;
    }

    // Simpan ke cache lokal agar tidak pernah hilang
    try { localStorage.setItem('cached_scores', JSON.stringify(scores)); } catch {}

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

    let success = false;

    // 1. Coba lewat backend /api/leaderboard
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
      if (res.ok) success = true;
    } catch (e) {
      console.warn('Backend submit failed, trying direct Supabase:', e);
    }

    // 2. Failsafe: Kirim langsung ke Supabase Cloud REST API
    if (!success) {
      try {
        const res = await fetch(`${SUPABASE_REST_URL}/leaderboard`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            player_name: pilotName,
            score: this.currentPendingScore,
            level: this.currentPendingLevel
          })
        });
        if (res.ok) success = true;
      } catch (e) {
        console.warn('Direct Supabase submit failed:', e);
      }
    }

    // 3. Simpan juga selalu di cache lokal agar offline tetap tercatat
    try {
      const local = JSON.parse(localStorage.getItem('cached_scores') || '[]');
      local.push({
        id: Date.now(),
        player_name: pilotName,
        score: this.currentPendingScore,
        level: this.currentPendingLevel,
        created_at: new Date().toISOString()
      });
      local.sort((a, b) => b.score - a.score);
      localStorage.setItem('cached_scores', JSON.stringify(local.slice(0, 10)));
    } catch {}

    submitBtn.textContent = originalText;
    submitBtn.disabled = false;

    ModalUI.closeSubmit();
    ModalUI.openLeaderboard();
  }
};

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ═══════════════════════════════════════════════════════════
//  MOBILE TOUCH & VIRTUAL CONTROLS
// ═══════════════════════════════════════════════════════════
const TouchControls = {
  layer: document.getElementById('mobile-controls'),
  btnToggle: document.getElementById('btn-toggle-touch'),
  game: null,
  isMobile: false,

  init(game) {
    this.game = game;
    // Auto-detect: mobile = touch device OR small screen
    this.isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth <= 900;

    // Tag body for CSS rules
    if (this.isMobile) {
      document.body.classList.add('is-mobile');
    } else {
      document.body.classList.remove('is-mobile');
    }

    // Mobile: always show touch controls. Desktop: always hide.
    this.setVisible(this.isMobile);

    // D-Pad buttons: ArrowUp, ArrowDown, ArrowLeft, ArrowRight
    document.querySelectorAll('.dpad-btn').forEach(btn => {
      const key = btn.dataset.key;
      const press = (e) => {
        e.preventDefault();
        btn.classList.add('pressed');
        this.game.keys[key] = true;
      };
      const release = (e) => {
        e.preventDefault();
        btn.classList.remove('pressed');
        delete this.game.keys[key];
      };

      btn.addEventListener('touchstart', press, { passive: false });
      btn.addEventListener('touchend', release, { passive: false });
      btn.addEventListener('touchcancel', release, { passive: false });
      btn.addEventListener('mousedown', press);
      btn.addEventListener('mouseup', release);
      btn.addEventListener('mouseleave', release);
    });

    // Fire button (hold to auto-fire continuously)
    const fireBtn = document.getElementById('mobile-btn-fire');
    if (fireBtn) {
      const pressFire = (e) => {
        e.preventDefault();
        fireBtn.classList.add('pressed');
        this.game.keys['Space'] = true;
        if (this.game.state === 'title' || this.game.state === 'gameover') {
          this.game._reset();
          this.game.state = 'playing';
          this.game._hideTopBar();
        }
      };
      const releaseFire = (e) => {
        e.preventDefault();
        fireBtn.classList.remove('pressed');
        delete this.game.keys['Space'];
      };
      fireBtn.addEventListener('touchstart', pressFire, { passive: false });
      fireBtn.addEventListener('touchend', releaseFire, { passive: false });
      fireBtn.addEventListener('touchcancel', releaseFire, { passive: false });
      fireBtn.addEventListener('mousedown', pressFire);
      fireBtn.addEventListener('mouseup', releaseFire);
      fireBtn.addEventListener('mouseleave', releaseFire);
    }

    // Pause button
    const pauseBtn = document.getElementById('mobile-btn-pause');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.game.state === 'playing') {
          this.game.isPaused = !this.game.isPaused;
        } else if (this.game.state === 'title' || this.game.state === 'gameover') {
          this.game._reset();
          this.game.state = 'playing';
          this.game._hideTopBar();
        }
      });
    }

    // Direct touch / Drag-to-Move on canvas for smartphones!
    let activeTouchId = null;
    this.game.canvas.addEventListener('touchstart', (e) => {
      if (ModalUI.isOpen()) return;
      if (this.game.state === 'title' || this.game.state === 'gameover') {
        this.game._reset();
        this.game.state = 'playing';
        this.game._hideTopBar();
        return;
      }
      const t = e.changedTouches[0];
      activeTouchId = t.identifier;
      this._handleTouchMove(t);
    }, { passive: false });

    this.game.canvas.addEventListener('touchmove', (e) => {
      if (ModalUI.isOpen() || this.game.state !== 'playing') return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouchId) {
          e.preventDefault();
          this._handleTouchMove(e.changedTouches[i]);
          break;
        }
      }
    }, { passive: false });

    this.game.canvas.addEventListener('touchend', () => {
      activeTouchId = null;
    }, { passive: false });
  },

  _handleTouchMove(touch) {
    const rect = this.game.canvas.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const scaleY = HEIGHT / rect.height;
    const cx = (touch.clientX - rect.left) * scaleX;
    const cy = (touch.clientY - rect.top) * scaleY;

    if (this.game.ship) {
      this.game.ship.y = clamp(cy, Ship.BODY_H / 2 + 5, HEIGHT - Ship.BODY_H / 2 - 5);
      this.game.ship.x = clamp(cx - 30, 75, 480);
    }
  },

  setVisible(visible) {
    if (!this.layer) return;
    if (visible) {
      this.layer.classList.remove('hidden');
    } else {
      this.layer.classList.add('hidden');
    }
  }
};

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
  TouchControls.init(game);

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
