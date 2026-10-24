/**
 * Crossy Road 3D - High-Res Voxel Edition
 * Enhanced with rich voxel models, authentic chicken animations, diverse vehicles,
 * railroad tracks with warning signals, particle effects, synthesized audio, and polished HUD.
 */

// ==========================================
// 1. AUDIO SYSTEM (Web Audio API Synthesizer)
// ==========================================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem("crossy_muted") === "true";
    this.updateMuteButton();
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem("crossy_muted", this.muted);
    this.updateMuteButton();
    if (!this.muted) {
      this.init();
      this.playHop();
    }
  }

  updateMuteButton() {
    const btn = document.getElementById("sound-btn");
    if (btn) btn.textContent = this.muted ? "🔇" : "🔊";
  }

  playHop() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = "sine";
    osc.frequency.setValueAtTime(260 + Math.random() * 40, now);
    osc.frequency.exponentialRampToValueAtTime(520 + Math.random() * 50, now + 0.1);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  playCoin() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    [987, 1318].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0.2, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.2);
    });
  }

  playCrash() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Noise buffer for retro crash explosion
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 0.35);
  }

  playTimeOut() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [320, 260, 210, 160].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.2, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.18);
    });
  }

  playBell() {
    // Disabled tic-tic sound per user request
  }

  playHonk() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [392, 494].forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    });
  }
}

const sounds = new SoundEngine();

// ==========================================
// 2. PARTICLE ENGINE (Zero-allocation pooled materials)
// ==========================================
class ParticleEngine {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.boxGeo = new THREE.BoxGeometry(1, 1, 1);
    this.puffMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
    });
    this.sparkleMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
    });
    this.featherMats = [
      new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }),
      new THREE.MeshLambertMaterial({ color: 0xfff0f0, flatShading: true }),
      new THREE.MeshLambertMaterial({ color: 0xef4444, flatShading: true }),
      new THREE.MeshLambertMaterial({ color: 0xf59e0b, flatShading: true }),
    ];
  }

  spawnPuff(x, y, z, count = 4, size = 2.8) {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.boxGeo, this.puffMat);
      const s = (size + Math.random() * 1.5) * zoom;
      mesh.scale.set(s, s, s);
      mesh.position.set(
        x + (Math.random() - 0.5) * 8 * zoom,
        y + (Math.random() - 0.5) * 8 * zoom,
        z + Math.random() * 3 * zoom
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        vz: 0.8 + Math.random() * 1.0,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        life: 1.0,
        decay: 0.05 + Math.random() * 0.03,
      });
    }
  }

  spawnFeatherBurst(x, y, z) {
    for (let i = 0; i < 24; i++) {
      const mat = this.featherMats[Math.floor(Math.random() * this.featherMats.length)];
      const mesh = new THREE.Mesh(this.boxGeo, mat);
      const s = (2.2 + Math.random() * 2.5) * zoom;
      mesh.scale.set(s, s * 1.3, s * 0.5);
      mesh.position.set(x, y, z + 6 * zoom);

      this.scene.add(mesh);
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4.5;
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 3 + Math.random() * 5,
        rotSpeed: (Math.random() - 0.5) * 0.35,
        gravity: 0.22,
        life: 1.0,
        decay: 0.025 + Math.random() * 0.02,
      });
    }
  }

  spawnCoinSparkle(x, y, z) {
    for (let i = 0; i < 12; i++) {
      const mesh = new THREE.Mesh(this.boxGeo, this.sparkleMat);
      const s = (1.8 + Math.random() * 1.8) * zoom;
      mesh.scale.set(s, s, s);
      mesh.position.set(x, y, z + 6 * zoom);

      this.scene.add(mesh);
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3;
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 2 + Math.random() * 3.5,
        rotSpeed: 0.2,
        gravity: 0.15,
        life: 1.0,
        decay: 0.045,
      });
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.mesh.position.x += p.vx;
      p.mesh.position.y += p.vy;
      p.mesh.position.z += p.vz;
      if (p.gravity) p.vz -= p.gravity;
      p.mesh.rotation.x += p.rotSpeed;
      p.mesh.rotation.y += p.rotSpeed;

      p.life -= p.decay;
      const s = p.mesh.scale.x * 0.94;
      p.mesh.scale.set(s, s, s);

      if (p.life <= 0 || p.mesh.position.z < 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }
}

// ==========================================
// 3. CORE THREE.JS SETUP & SETTINGS
// ==========================================
const counterDOM = document.getElementById("counter");
const endDOM = document.getElementById("end");
const finalScoreDOM = document.getElementById("final-score");
const finalCoinsDOM = document.getElementById("final-coins");
const coinsCounterDOM = document.getElementById("coins-counter");
const tutorialHintDOM = document.getElementById("tutorial-hint");
const timerCounterDOM = document.getElementById("timer-counter");
const timerPillDOM = document.getElementById("timer-pill");
const gameOverTitleDOM = document.getElementById("game-over-title");

const GAME_DURATION = 60; // 60 seconds arcade timer
let timeLeft = GAME_DURATION;
let timerActive = false;
let timerStartTime = null;

// Reset coins on refresh so each game session starts fresh
try {
  localStorage.removeItem("crossy_coins");
} catch (e) {}
let totalCoins = 0;
if (coinsCounterDOM) coinsCounterDOM.textContent = "0";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0d8ef);
scene.fog = new THREE.Fog(0xa0d8ef, 450, 1500);

const distance = 500;
const viewScale = 1.25;
const camera = new THREE.OrthographicCamera(
  window.innerWidth / (-2 * viewScale),
  window.innerWidth / (2 * viewScale),
  window.innerHeight / (2 * viewScale),
  window.innerHeight / (-2 * viewScale),
  0.1,
  10000
);

camera.rotation.x = (50 * Math.PI) / 180;
camera.rotation.y = (20 * Math.PI) / 180;
camera.rotation.z = (10 * Math.PI) / 180;

const initialCameraPositionY = -Math.tan(camera.rotation.x) * distance;
const initialCameraPositionX =
  Math.tan(camera.rotation.y) *
  Math.sqrt(distance ** 2 + initialCameraPositionY ** 2);
camera.position.y = initialCameraPositionY;
camera.position.x = initialCameraPositionX;
camera.position.z = distance;

const zoom = 2;
const chickenSize = 15;
const positionWidth = 42;
const columns = 17;
const boardWidth = positionWidth * columns;
const fullBoardWidth = boardWidth * 3.4;
const stepTime = 175; // milliseconds per step (crisp and responsive)

let lanes = [];
let backdropLanes = [];
let currentLane = 0;
let maxLaneReached = 0;
const COIN_SCORE_VALUE = 5; // 1 coin = 5 score in the game
let currentColumn = Math.floor(columns / 2);
let lastFrameTimestamp = 0;
let frameAccumulator = 0;
let startMoving = false;
let moves = [];
let stepStartTimestamp = null;
let isDead = false;
let sessionCoins = 0;
let hasMovedOnce = false;

function calculateScore() {
  return Math.max(0, maxLaneReached) + sessionCoins * COIN_SCORE_VALUE;
}

function updateScore(pop = false) {
  const score = calculateScore();
  counterDOM.textContent = `${score}`;
  if (pop) {
    counterDOM.classList.add("pop");
    setTimeout(() => counterDOM.classList.remove("pop"), 120);
  }
}

function showFloatingScore(text, x, y, z) {
  try {
    const vector = new THREE.Vector3(x, y, z + 12 * zoom);
    vector.project(camera);
    const screenX = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const screenY = (-(vector.y * 0.5) + 0.5) * window.innerHeight;

    const popup = document.createElement("div");
    popup.className = "floating-score";
    popup.textContent = text;
    popup.style.left = `${screenX}px`;
    popup.style.top = `${screenY}px`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 850);
  } catch (err) {
    // Graceful fallback
  }
}

// Lighting setup
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x88aa66, 0.65);
scene.add(hemiLight);

const initialDirLightPositionX = -120;
const initialDirLightPositionY = -120;
const dirLight = new THREE.DirectionalLight(0xfffaed, 0.85);
dirLight.position.set(initialDirLightPositionX, initialDirLightPositionY, 280);
dirLight.castShadow = true;
scene.add(dirLight);

dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
const d = 550;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 1000;
dirLight.shadow.bias = -0.0005;

const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.35);
rimLight.position.set(200, 200, 80);
scene.add(rimLight);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance",
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
document.body.appendChild(renderer.domElement);

const particles = new ParticleEngine(scene);

// Handle window resize
window.addEventListener("resize", () => {
  camera.left = window.innerWidth / (-2 * viewScale);
  camera.right = window.innerWidth / (2 * viewScale);
  camera.top = window.innerHeight / (2 * viewScale);
  camera.bottom = window.innerHeight / (-2 * viewScale);
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Sound button listener
document.getElementById("sound-btn").addEventListener("click", () => {
  sounds.toggleMute();
});

// ==========================================
// 4. SHARED MATERIALS & PALETTES
// ==========================================
const materials = {
  // Terrain (Playable Center & Faded Outside Wings)
  grassLight: new THREE.MeshPhongMaterial({ color: 0x76bf3d, flatShading: true }),
  grassDark: new THREE.MeshPhongMaterial({ color: 0x6db334, flatShading: true }),
  grassLightOutside: new THREE.MeshPhongMaterial({ color: 0x467223, flatShading: true }),
  grassDarkOutside: new THREE.MeshPhongMaterial({ color: 0x3d641d, flatShading: true }),
  grassCurb: new THREE.MeshLambertMaterial({ color: 0x2b4614, flatShading: true }),
  boundaryGrassLine: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.38 }),
  dirt: new THREE.MeshLambertMaterial({ color: 0x422d1f, flatShading: true }),
  road: new THREE.MeshPhongMaterial({ color: 0x3e4451, flatShading: true }),
  roadOutside: new THREE.MeshPhongMaterial({ color: 0x23272e, flatShading: true }),
  boundaryRoadLine: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  curb: new THREE.MeshLambertMaterial({ color: 0xcfd4dc, flatShading: true }),
  roadStripe: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  // Railroad
  ballast: new THREE.MeshLambertMaterial({ color: 0x64748b, flatShading: true }),
  ballastOutside: new THREE.MeshLambertMaterial({ color: 0x374151, flatShading: true }),
  boundaryRailLine: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 }),
  railTie: new THREE.MeshLambertMaterial({ color: 0x452b14, flatShading: true }),
  railSteel: new THREE.MeshPhongMaterial({ color: 0xd1d5db, specular: 0xffffff, shininess: 50, flatShading: true }),
  trainRedSignalOff: new THREE.MeshLambertMaterial({ color: 0x450a0a }),
  trainRedSignalOn: new THREE.MeshBasicMaterial({ color: 0xef4444 }),
  // Vehicles
  tire: new THREE.MeshLambertMaterial({ color: 0x1e293b, flatShading: true }),
  hubcap: new THREE.MeshLambertMaterial({ color: 0x94a3b8, flatShading: true }),
  windshield: new THREE.MeshPhongMaterial({
    color: 0x93c5fd,
    specular: 0xffffff,
    shininess: 90,
    flatShading: true,
  }),
  headlight: new THREE.MeshBasicMaterial({ color: 0xfef08a }),
  taillight: new THREE.MeshBasicMaterial({ color: 0xef4444 }),
  bumper: new THREE.MeshLambertMaterial({ color: 0x64748b, flatShading: true }),
  policeBlue: new THREE.MeshBasicMaterial({ color: 0x3b82f6 }),
  taxiRoof: new THREE.MeshBasicMaterial({ color: 0xfffbeb }),
  // Nature
  trunk: new THREE.MeshLambertMaterial({ color: 0x4a2e18, flatShading: true }),
  pineTier1: new THREE.MeshLambertMaterial({ color: 0x245432, flatShading: true }),
  pineTier2: new THREE.MeshLambertMaterial({ color: 0x2e6b3f, flatShading: true }),
  pineTier3: new THREE.MeshLambertMaterial({ color: 0x3b8850, flatShading: true }),
  oakLeaves1: new THREE.MeshLambertMaterial({ color: 0x4d7c0f, flatShading: true }),
  oakLeaves2: new THREE.MeshLambertMaterial({ color: 0x65a30d, flatShading: true }),
  autumnLeaves1: new THREE.MeshLambertMaterial({ color: 0xea580c, flatShading: true }),
  autumnLeaves2: new THREE.MeshLambertMaterial({ color: 0xf59e0b, flatShading: true }),
  flowerStem: new THREE.MeshLambertMaterial({ color: 0x3f6212, flatShading: true }),
  flowerWhite: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  flowerYellow: new THREE.MeshBasicMaterial({ color: 0xfacc15 }),
  flowerRed: new THREE.MeshBasicMaterial({ color: 0xef4444 }),
  rock: new THREE.MeshLambertMaterial({ color: 0x64748b, flatShading: true }),
  rockMoss: new THREE.MeshLambertMaterial({ color: 0x4d7c0f, flatShading: true }),
  // Chicken
  chickenWhite: new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true }),
  chickenRed: new THREE.MeshLambertMaterial({ color: 0xe11d48, flatShading: true }),
  chickenYellow: new THREE.MeshLambertMaterial({ color: 0xf59e0b, flatShading: true }),
  chickenEye: new THREE.MeshBasicMaterial({ color: 0x0f172a }),
  chickenEyeGlint: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  shadowMat: new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.28,
  }),
  // Gold Coin
  coinGold: new THREE.MeshPhongMaterial({
    color: 0xfbbf24,
    specular: 0xffffff,
    shininess: 80,
    flatShading: true,
  }),
};

const vehicleColors = [
  0xef4444, // Red
  0x3b82f6, // Blue
  0x10b981, // Emerald Green
  0xf59e0b, // Amber
  0x8b5cf6, // Violet
  0xf97316, // Orange
  0xec4899, // Pink
  0x0284c7, // Sky
  0xf8fafc, // Pearl White
];

// Pre-allocated materials for zero runtime garbage collection & 60 FPS performance
const carColorMaterials = vehicleColors.map(
  (color) => new THREE.MeshPhongMaterial({ color, flatShading: true })
);
const sportsStripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const taxiYellowMat = new THREE.MeshPhongMaterial({ color: 0xfacc15, flatShading: true });
const policeBlackMat = new THREE.MeshPhongMaterial({ color: 0x1e293b, flatShading: true });
const policeWhiteMat = new THREE.MeshPhongMaterial({ color: 0xf8fafc, flatShading: true });
const cargoMat = new THREE.MeshPhongMaterial({ color: 0xe2e8f0, flatShading: true });
const trainBodyMat = new THREE.MeshPhongMaterial({ color: 0xf1f5f9, flatShading: true });
const trainDarkRoofMat = new THREE.MeshLambertMaterial({ color: 0x334155, flatShading: true });
const redStripeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

// Box & Cylinder Geometry Caches (Reuses geometry instances to eliminate memory allocations)
const boxGeoCache = new Map();
function getBoxGeometry(w, d, h) {
  const key = `${w}_${d}_${h}`;
  let geo = boxGeoCache.get(key);
  if (!geo) {
    geo = new THREE.BoxGeometry(w * zoom, d * zoom, h * zoom);
    boxGeoCache.set(key, geo);
  }
  return geo;
}

const cylinderGeoCache = new Map();
function getCylinderGeometry(radiusTop, radiusBottom, height, segments) {
  const key = `${radiusTop}_${radiusBottom}_${height}_${segments}`;
  let geo = cylinderGeoCache.get(key);
  if (!geo) {
    geo = new THREE.CylinderGeometry(
      radiusTop * zoom,
      radiusBottom * zoom,
      height * zoom,
      segments
    );
    cylinderGeoCache.set(key, geo);
  }
  return geo;
}

// Helper to quickly make an efficient cached Box mesh
function createBox(w, d, h, mat, cast = true, receive = true) {
  const mesh = new THREE.Mesh(getBoxGeometry(w, d, h), mat);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
}

// ==========================================
// 5. HIGH-RES VOXEL CHICKEN MODEL
// ==========================================
function createChicken() {
  const chicken = new THREE.Group();
  const bodyRoot = new THREE.Group();
  chicken.add(bodyRoot);
  chicken.bodyRoot = bodyRoot;

  // Main Plump Torso
  const body = createBox(13, 13, 13, materials.chickenWhite);
  body.position.z = 10 * zoom;
  bodyRoot.add(body);

  // Chest / Head forward extension
  const head = createBox(11, 10, 11, materials.chickenWhite);
  head.position.set(0, 3.5 * zoom, 13 * zoom);
  bodyRoot.add(head);

  // Red Comb / Crest (3 stepped voxels on head)
  const combFront = createBox(2.8, 3.5, 3.8, materials.chickenRed, true, false);
  combFront.position.set(0, 5.5 * zoom, 20 * zoom);
  bodyRoot.add(combFront);

  const combMid = createBox(2.8, 4.2, 6.2, materials.chickenRed, true, false);
  combMid.position.set(0, 2 * zoom, 21.2 * zoom);
  bodyRoot.add(combMid);

  const combBack = createBox(2.8, 3.5, 3.8, materials.chickenRed, true, false);
  combBack.position.set(0, -1.8 * zoom, 19.5 * zoom);
  bodyRoot.add(combBack);

  // Golden Beak
  const beak = createBox(4.5, 5.5, 3.2, materials.chickenYellow);
  beak.position.set(0, 9.5 * zoom, 12.8 * zoom);
  bodyRoot.add(beak);

  // Red Wattle (under beak)
  const wattle = createBox(2.8, 3, 4.2, materials.chickenRed);
  wattle.position.set(0, 7.8 * zoom, 9.4 * zoom);
  bodyRoot.add(wattle);

  // Eyes (Left & Right with white sparkle)
  [-1, 1].forEach((side) => {
    const eye = createBox(0.8, 1.8, 2, materials.chickenEye, false, false);
    eye.position.set(side * 5.7 * zoom, 5.2 * zoom, 15 * zoom);
    bodyRoot.add(eye);

    const glint = createBox(0.9, 0.8, 0.8, materials.chickenEyeGlint, false, false);
    glint.position.set(side * 5.75 * zoom, 5.7 * zoom, 15.6 * zoom);
    bodyRoot.add(glint);
  });

  // Wings (Left & Right - can flap on jump)
  const leftWing = createBox(1.8, 8, 6.5, materials.chickenWhite);
  leftWing.position.set(-7.2 * zoom, 0.5 * zoom, 10 * zoom);
  bodyRoot.add(leftWing);
  chicken.leftWing = leftWing;

  const rightWing = createBox(1.8, 8, 6.5, materials.chickenWhite);
  rightWing.position.set(7.2 * zoom, 0.5 * zoom, 10 * zoom);
  bodyRoot.add(rightWing);
  chicken.rightWing = rightWing;

  // Tail feathers
  const tail = createBox(6, 3.5, 6, materials.chickenWhite);
  tail.position.set(0, -7.5 * zoom, 11.5 * zoom);
  tail.rotation.x = -0.3;
  bodyRoot.add(tail);

  // Legs & Feet
  [-1, 1].forEach((side) => {
    const leg = createBox(1.8, 1.8, 4.5, materials.chickenYellow);
    leg.position.set(side * 3.5 * zoom, 0.5 * zoom, 2.5 * zoom);
    bodyRoot.add(leg);

    const foot = createBox(4, 5.5, 1.4, materials.chickenYellow);
    foot.position.set(side * 3.5 * zoom, 2 * zoom, 0.7 * zoom);
    bodyRoot.add(foot);
  });

  // Dynamic Drop Shadow (stays flat on ground beneath chicken)
  const shadowGeo = new THREE.PlaneGeometry(15 * zoom, 15 * zoom);
  const shadowMesh = new THREE.Mesh(shadowGeo, materials.shadowMat);
  shadowMesh.position.z = 0.2 * zoom;
  chicken.add(shadowMesh);
  chicken.dropShadow = shadowMesh;

  return chicken;
}

const chicken = createChicken();
scene.add(chicken);
dirLight.target = chicken;

// ==========================================
// 6. WHEELS & VEHICLE ASSETS
// ==========================================
function createWheel(width = 4, radius = 6) {
  const group = new THREE.Group();
  const tire = new THREE.Mesh(
    getCylinderGeometry(radius, radius, width, 10),
    materials.tire
  );
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  group.add(tire);

  const hub = new THREE.Mesh(
    getCylinderGeometry(radius * 0.55, radius * 0.55, width + 0.4, 8),
    materials.hubcap
  );
  hub.rotation.z = Math.PI / 2;
  group.add(hub);

  group.tire = tire;
  return group;
}

// 1. Sedan Car
function createCar() {
  const car = new THREE.Group();
  car.wheels = [];
  const bodyMat = carColorMaterials[Math.floor(Math.random() * carColorMaterials.length)];

  // Chassis / Lower body
  const body = createBox(56, 26, 12, bodyMat);
  body.position.z = 10 * zoom;
  car.add(body);

  // Bumpers & Plates
  const frontBumper = createBox(3, 24, 5, materials.bumper);
  frontBumper.position.set(-28.5 * zoom, 0, 7.5 * zoom);
  car.add(frontBumper);

  const backBumper = createBox(3, 24, 5, materials.bumper);
  backBumper.position.set(28.5 * zoom, 0, 7.5 * zoom);
  car.add(backBumper);

  // Cabin
  const cabin = createBox(32, 22, 11, materials.windshield);
  cabin.position.set(2 * zoom, 0, 20.5 * zoom);
  car.add(cabin);

  // Roof cap
  const roof = createBox(30, 22.4, 2.5, bodyMat);
  roof.position.set(2 * zoom, 0, 26.5 * zoom);
  car.add(roof);

  // Headlights (Warm Yellow)
  [-1, 1].forEach((side) => {
    const light = createBox(1, 4.5, 3.5, materials.headlight, false, false);
    light.position.set(-28.2 * zoom, side * 8 * zoom, 11 * zoom);
    car.add(light);
  });

  // Taillights (Red)
  [-1, 1].forEach((side) => {
    const tail = createBox(1, 4.5, 3, materials.taillight, false, false);
    tail.position.set(28.2 * zoom, side * 8 * zoom, 11 * zoom);
    car.add(tail);
  });

  // Wheels
  [-17, 17].forEach((x) => {
    [-1, 1].forEach((side) => {
      const w = createWheel(4, 5.5);
      w.position.set(x * zoom, side * 13 * zoom, 5.5 * zoom);
      car.add(w);
      car.wheels.push(w);
    });
  });

  car.vehicleLength = 60;
  return car;
}

// 2. Sports Car
function createSportsCar() {
  const car = new THREE.Group();
  car.wheels = [];
  const bodyMat = carColorMaterials[Math.floor(Math.random() * carColorMaterials.length)];

  // Sleek lower chassis
  const body = createBox(62, 26, 9, bodyMat);
  body.position.z = 8.5 * zoom;
  car.add(body);

  // Low racing cabin
  const cabin = createBox(30, 21, 9, materials.windshield);
  cabin.position.set(4 * zoom, 0, 16.5 * zoom);
  car.add(cabin);

  // Racing stripe down the center
  const stripe = createBox(50, 4, 0.4, sportsStripeMat, false, false);
  stripe.position.set(-4 * zoom, 0, 13.2 * zoom);
  car.add(stripe);

  // Rear Spoiler / Wing
  const spoilerStrut1 = createBox(2, 2, 6, bodyMat, false, false);
  spoilerStrut1.position.set(26 * zoom, -7 * zoom, 15 * zoom);
  car.add(spoilerStrut1);

  const spoilerStrut2 = createBox(2, 2, 6, bodyMat, false, false);
  spoilerStrut2.position.set(26 * zoom, 7 * zoom, 15 * zoom);
  car.add(spoilerStrut2);

  const spoilerWing = createBox(7, 24, 2, bodyMat);
  spoilerWing.position.set(26 * zoom, 0, 18 * zoom);
  car.add(spoilerWing);

  // Headlights
  [-1, 1].forEach((side) => {
    const light = createBox(1, 5, 2.5, materials.headlight, false, false);
    light.position.set(-31.2 * zoom, side * 8 * zoom, 9 * zoom);
    car.add(light);

    const tail = createBox(1, 5, 2.5, materials.taillight, false, false);
    tail.position.set(31.2 * zoom, side * 8 * zoom, 9 * zoom);
    car.add(tail);
  });

  // 4 Wheels
  [-19, 19].forEach((x) => {
    [-1, 1].forEach((side) => {
      const w = createWheel(4.5, 5.5);
      w.position.set(x * zoom, side * 13 * zoom, 5.5 * zoom);
      car.add(w);
      car.wheels.push(w);
    });
  });

  car.vehicleLength = 65;
  return car;
}

// 3. City Taxi
function createTaxi() {
  const taxi = createCar();
  taxi.children[0].material = taxiYellowMat;
  taxi.children[3].material = taxiYellowMat; // Roof

  // Roof TAXI sign box
  const sign = createBox(8, 12, 4, materials.taxiRoof);
  sign.position.set(2 * zoom, 0, 29 * zoom);
  taxi.add(sign);

  return taxi;
}

// 4. Police Cruiser
function createPoliceCar() {
  const car = new THREE.Group();
  car.wheels = [];

  // Black body with white doors
  const body = createBox(58, 26, 12, policeBlackMat);
  body.position.z = 10 * zoom;
  car.add(body);

  const whiteDoors = createBox(22, 26.4, 11.5, policeWhiteMat);
  whiteDoors.position.set(2 * zoom, 0, 10 * zoom);
  car.add(whiteDoors);

  // Cabin
  const cabin = createBox(32, 22, 11, materials.windshield);
  cabin.position.set(2 * zoom, 0, 20.5 * zoom);
  car.add(cabin);

  // Roof
  const roof = createBox(30, 22.4, 2.5, policeWhiteMat);
  roof.position.set(2 * zoom, 0, 26.5 * zoom);
  car.add(roof);

  // Emergency Light Bar (Flashing Red and Blue)
  const lightBarRed = createBox(4, 7, 3, materials.taillight, false, false);
  lightBarRed.position.set(2 * zoom, -4.5 * zoom, 29 * zoom);
  car.add(lightBarRed);
  car.lightBarRed = lightBarRed;

  const lightBarBlue = createBox(4, 7, 3, materials.policeBlue, false, false);
  lightBarBlue.position.set(2 * zoom, 4.5 * zoom, 29 * zoom);
  car.add(lightBarBlue);
  car.lightBarBlue = lightBarBlue;

  // Headlights & Taillights
  [-1, 1].forEach((side) => {
    const light = createBox(1, 4.5, 3.5, materials.headlight, false, false);
    light.position.set(-29.2 * zoom, side * 8 * zoom, 11 * zoom);
    car.add(light);

    const tail = createBox(1, 4.5, 3, materials.taillight, false, false);
    tail.position.set(29.2 * zoom, side * 8 * zoom, 11 * zoom);
    car.add(tail);
  });

  // Wheels
  [-17, 17].forEach((x) => {
    [-1, 1].forEach((side) => {
      const w = createWheel(4, 5.5);
      w.position.set(x * zoom, side * 13 * zoom, 5.5 * zoom);
      car.add(w);
      car.wheels.push(w);
    });
  });

  car.isPolice = true;
  car.vehicleLength = 60;
  return car;
}

// 5. Delivery Box Truck
function createTruck() {
  const truck = new THREE.Group();
  truck.wheels = [];
  const cabMat = carColorMaterials[Math.floor(Math.random() * carColorMaterials.length)];

  // Chassis bed
  const bed = createBox(96, 26, 6, materials.bumper);
  bed.position.set(0, 0, 8 * zoom);
  truck.add(bed);

  // Cargo Box Container
  const cargo = createBox(64, 30, 36, cargoMat);
  cargo.position.set(16 * zoom, 0, 27 * zoom);
  truck.add(cargo);

  // Cargo stripe accent
  const cargoStripe = createBox(64.4, 30.4, 4, cabMat);
  cargoStripe.position.set(16 * zoom, 0, 26 * zoom);
  truck.add(cargoStripe);

  // Driver Cabin
  const cabin = createBox(28, 28, 26, cabMat);
  cabin.position.set(-32 * zoom, 0, 22 * zoom);
  truck.add(cabin);

  // Windshield
  const windshield = createBox(1, 24, 12, materials.windshield);
  windshield.position.set(-46.2 * zoom, 0, 26 * zoom);
  truck.add(windshield);

  // Grill
  const grill = createBox(1.5, 18, 8, materials.bumper);
  grill.position.set(-46.4 * zoom, 0, 14 * zoom);
  truck.add(grill);

  // Headlights
  [-1, 1].forEach((side) => {
    const light = createBox(1, 4.5, 4, materials.headlight, false, false);
    light.position.set(-46.2 * zoom, side * 10 * zoom, 14 * zoom);
    truck.add(light);
  });

  // 6 Wheels (single front, dual rear axle)
  [-32, 10, 32].forEach((x) => {
    [-1, 1].forEach((side) => {
      const w = createWheel(4.5, 6);
      w.position.set(x * zoom, side * 14 * zoom, 6 * zoom);
      truck.add(w);
      truck.wheels.push(w);
    });
  });

  truck.vehicleLength = 100;
  return truck;
}

// Random Vehicle Generator (mixes all vehicle types)
function createRandomVehicle(typePreference = "any") {
  const roll = Math.random();
  if (typePreference === "heavy") {
    if (roll < 0.55) return createTruck();
    if (roll < 0.72) return createCar();
    if (roll < 0.88) return createSportsCar();
    return createPoliceCar();
  } else if (typePreference === "fast") {
    if (roll < 0.5) return createSportsCar();
    if (roll < 0.75) return createPoliceCar();
    if (roll < 0.9) return createCar();
    return createTaxi();
  } else {
    // Mixed lively traffic
    if (roll < 0.32) return createCar();
    if (roll < 0.52) return createSportsCar();
    if (roll < 0.70) return createTaxi();
    if (roll < 0.86) return createTruck();
    return createPoliceCar();
  }
}

// Generate organic randomized positions with safety gaps
function generateRandomVehiclePositions(count, totalSpan, minGap = 85 * zoom) {
  const positions = [];
  const slotSize = totalSpan / count;
  for (let i = 0; i < count; i++) {
    const maxJitter = Math.max(0, (slotSize - minGap) * 0.45);
    const jitter = (Math.random() - 0.5) * 2 * maxJitter;
    positions.push(-totalSpan / 2 + (i + 0.5) * slotSize + jitter);
  }
  return positions;
}

// 6. High-Speed Commuter Train
function createTrain() {
  const train = new THREE.Group();
  train.wheels = [];

  const trainLength = 260;
  // Train Body
  const body = createBox(trainLength, 26, 28, trainBodyMat);
  body.position.z = 17 * zoom;
  train.add(body);

  // Roof
  const roof = createBox(trainLength - 4, 24, 3, trainDarkRoofMat);
  roof.position.z = 32 * zoom;
  train.add(roof);

  // Red accent stripe
  const stripe = createBox(trainLength + 0.4, 26.4, 3, redStripeMat, false, false);
  stripe.position.z = 14 * zoom;
  train.add(stripe);

  // Long row of passenger windows on both sides
  for (let x = -100; x <= 100; x += 22) {
    [-1, 1].forEach((side) => {
      const win = createBox(14, 0.6, 7, materials.windshield, false, false);
      win.position.set(x * zoom, side * 13.2 * zoom, 21 * zoom);
      train.add(win);
    });
  }

  // Front glowing spotlight
  const headSpot = createBox(2, 8, 8, materials.headlight, false, false);
  headSpot.position.set(-trainLength / 2 * zoom - 0.5 * zoom, 0, 18 * zoom);
  train.add(headSpot);

  train.vehicleLength = trainLength;
  train.isTrain = true;
  return train;
}

// ==========================================
// 7. ENVIRONMENT & NATURE ASSETS
// ==========================================
// 1. Tiered Voxel Pine Tree
function createPineTree() {
  const tree = new THREE.Group();

  // Bark trunk
  const trunk = createBox(10, 10, 16, materials.trunk);
  trunk.position.z = 8 * zoom;
  tree.add(trunk);

  // 3-tier stepped foliage
  const tier1 = createBox(30, 30, 14, materials.pineTier1);
  tier1.position.z = 21 * zoom;
  tree.add(tier1);

  const tier2 = createBox(22, 22, 12, materials.pineTier2);
  tier2.position.z = 32 * zoom;
  tree.add(tier2);

  const tier3 = createBox(14, 14, 11, materials.pineTier3);
  tier3.position.z = 41 * zoom;
  tree.add(tier3);

  const tip = createBox(6, 6, 6, materials.pineTier3);
  tip.position.z = 48 * zoom;
  tree.add(tip);

  return tree;
}

// 2. Round Voxel Oak Tree
function createOakTree() {
  const tree = new THREE.Group();

  const trunk = createBox(11, 11, 18, materials.trunk);
  trunk.position.z = 9 * zoom;
  tree.add(trunk);

  // Overlapping cluster of leafy blocks
  const clusterCenters = [
    { x: 0, y: 0, z: 24, w: 28, d: 28, h: 18, m: materials.oakLeaves1 },
    { x: -5, y: -4, z: 28, w: 20, d: 20, h: 15, m: materials.oakLeaves2 },
    { x: 5, y: 4, z: 30, w: 22, d: 18, h: 16, m: materials.oakLeaves1 },
    { x: -3, y: 5, z: 34, w: 16, d: 16, h: 14, m: materials.oakLeaves2 },
    { x: 2, y: -3, z: 36, w: 14, d: 15, h: 12, m: materials.oakLeaves2 },
  ];

  clusterCenters.forEach((c) => {
    const leaf = createBox(c.w, c.d, c.h, c.m);
    leaf.position.set(c.x * zoom, c.y * zoom, c.z * zoom);
    tree.add(leaf);
  });

  return tree;
}

// 3. Autumn Birch Tree
function createAutumnTree() {
  const tree = createOakTree();
  // Swap leaves with autumn palette
  tree.children.forEach((child, i) => {
    if (i > 0) {
      child.material = i % 2 === 0 ? materials.autumnLeaves1 : materials.autumnLeaves2;
    }
  });
  return tree;
}

// 4. Wildflower Patch
function createWildflower() {
  const flower = new THREE.Group();
  const stem = createBox(1.5, 1.5, 3.5, materials.flowerStem, false, false);
  stem.position.z = 1.7 * zoom;
  flower.add(stem);

  const isRed = Math.random() > 0.5;
  const petalMat = isRed ? materials.flowerRed : materials.flowerWhite;
  const petals = createBox(4.5, 4.5, 1.5, petalMat, false, false);
  petals.position.z = 4.2 * zoom;
  flower.add(petals);

  const center = createBox(2, 2, 1.8, materials.flowerYellow, false, false);
  center.position.z = 4.5 * zoom;
  flower.add(center);

  return flower;
}

// 5. Grass Tufts
function createGrassTuft() {
  const tuft = new THREE.Group();
  [-1.5, 1.5].forEach((offset, i) => {
    const blade = createBox(1.5, 1.5, 3.5 + i * 1.5, materials.oakLeaves2, false, false);
    blade.position.set(offset * zoom, 0, (2 + i) * zoom);
    blade.rotation.z = (Math.random() - 0.5) * 0.4;
    tuft.add(blade);
  });
  return tuft;
}

// 6. Mossy Boulder
function createBoulder() {
  const rock = new THREE.Group();
  const base = createBox(16, 16, 10, materials.rock);
  base.position.z = 5 * zoom;
  rock.add(base);

  const topMoss = createBox(12, 12, 3, materials.rockMoss);
  topMoss.position.z = 11 * zoom;
  rock.add(topMoss);

  return rock;
}

// 7. Collectible Gold Coin
function createCoin() {
  const coin = new THREE.Group();
  const mesh = new THREE.Mesh(
    getCylinderGeometry(5, 5, 2, 10),
    materials.coinGold
  );
  mesh.rotation.x = Math.PI / 2;
  mesh.castShadow = true;
  coin.add(mesh);
  coin.position.z = 6 * zoom;
  coin.isCoin = true;
  return coin;
}

// ==========================================
// 8. TERRAIN & LANES
// ==========================================
// Grass Lane (Fields & Forests)
function createGrassLane(isLight = true) {
  const grass = new THREE.Group();
  const mat = isLight ? materials.grassLight : materials.grassDark;
  const matOutside = isLight ? materials.grassLightOutside : materials.grassDarkOutside;
  const outsideWidth = 1100;

  // 1. Playable middle lawn (vibrant green)
  const middle = createBox(boardWidth, positionWidth, 4, mat, false, true);
  middle.position.set(0, 0, 2 * zoom);
  grass.add(middle);

  // 2. Left faded outside lawn (shaded / darker)
  const left = createBox(outsideWidth, positionWidth, 4, matOutside, false, true);
  left.position.set(-(boardWidth / 2 + outsideWidth / 2) * zoom, 0, 2 * zoom);
  grass.add(left);

  // 3. Right faded outside lawn (shaded / darker)
  const right = createBox(outsideWidth, positionWidth, 4, matOutside, false, true);
  right.position.set((boardWidth / 2 + outsideWidth / 2) * zoom, 0, 2 * zoom);
  grass.add(right);

  // 4. Boundary demarcation lines separating the playable board from the outside area
  [-boardWidth / 2, boardWidth / 2].forEach((bx) => {
    // Semi-translucent crisp boundary line
    const bLine = createBox(3.5, positionWidth, 0.35, materials.boundaryGrassLine, false, false);
    bLine.position.set(bx * zoom, 0, 4.18 * zoom);
    grass.add(bLine);

    // Deep boundary seam curb
    const curb = createBox(3, positionWidth, 4.2, materials.grassCurb, false, false);
    curb.position.set(bx * zoom, 0, 2 * zoom);
    grass.add(curb);
  });

  // 5. Soil / earth foundation underneath
  const dirt = createBox(fullBoardWidth, positionWidth, 12, materials.dirt, false, false);
  dirt.position.set(0, 0, -6 * zoom);
  grass.add(dirt);

  return grass;
}

// Asphalt Road Lane
function createRoadLane() {
  const road = new THREE.Group();
  const outsideWidth = 1100;

  // 1. Playable middle asphalt surface
  const middle = createBox(boardWidth, positionWidth, 1, materials.road, false, true);
  middle.position.set(0, 0, 0.5 * zoom);
  road.add(middle);

  // 2. Left faded outside asphalt shoulder
  const left = createBox(outsideWidth, positionWidth, 1, materials.roadOutside, false, true);
  left.position.set(-(boardWidth / 2 + outsideWidth / 2) * zoom, 0, 0.5 * zoom);
  road.add(left);

  // 3. Right faded outside asphalt shoulder
  const right = createBox(outsideWidth, positionWidth, 1, materials.roadOutside, false, true);
  right.position.set((boardWidth / 2 + outsideWidth / 2) * zoom, 0, 0.5 * zoom);
  road.add(right);

  // 4. Prominent solid white highway shoulder boundary lines at x = ±(boardWidth * zoom)/2
  [-boardWidth / 2, boardWidth / 2].forEach((bx) => {
    const boundaryLine = createBox(4, positionWidth, 0.45, materials.boundaryRoadLine, false, false);
    boundaryLine.position.set(bx * zoom, 0, 1.15 * zoom);
    road.add(boundaryLine);
  });

  // 5. Dashed white centerlines strictly inside the playable area
  const stripeCount = 11;
  const stripeSpan = boardWidth * zoom * 0.82;
  const stripeSpacing = stripeSpan / (stripeCount - 1);
  const startX = -stripeSpan / 2;
  for (let i = 0; i < stripeCount; i++) {
    const stripe = createBox(13, 2, 0.4, materials.roadStripe, false, false);
    stripe.position.set(startX + i * stripeSpacing, 0, 1.15 * zoom);
    road.add(stripe);
  }

  // 6. Concrete sidewalk curbs on lane edges
  [-positionWidth / 2, positionWidth / 2].forEach((y) => {
    const curb = createBox(fullBoardWidth, 3, 2, materials.curb, false, false);
    curb.position.set(0, y * zoom, 1.5 * zoom);
    road.add(curb);
  });

  return road;
}

// Railroad Track Lane
function createRailroadLane() {
  const track = new THREE.Group();
  const outsideWidth = 1100;

  // 1. Playable middle ballast gravel bed
  const middle = createBox(boardWidth, positionWidth, 1.5, materials.ballast, false, true);
  middle.position.set(0, 0, 0.75 * zoom);
  track.add(middle);

  // 2. Left faded outside ballast
  const left = createBox(outsideWidth, positionWidth, 1.5, materials.ballastOutside, false, true);
  left.position.set(-(boardWidth / 2 + outsideWidth / 2) * zoom, 0, 0.75 * zoom);
  track.add(left);

  // 3. Right faded outside ballast
  const right = createBox(outsideWidth, positionWidth, 1.5, materials.ballastOutside, false, true);
  right.position.set((boardWidth / 2 + outsideWidth / 2) * zoom, 0, 0.75 * zoom);
  track.add(right);

  // 4. Boundary lines marking the edge of the playable railroad
  [-boardWidth / 2, boardWidth / 2].forEach((bx) => {
    const bMarker = createBox(3.5, positionWidth, 0.4, materials.boundaryRailLine, false, false);
    bMarker.position.set(bx * zoom, 0, 1.6 * zoom);
    track.add(bMarker);
  });

  // 5. Wooden railroad cross-ties (sleepers)
  const tieCount = 52;
  const tieSpacing = (fullBoardWidth * zoom) / tieCount;
  for (let i = -Math.floor(tieCount / 2); i <= Math.floor(tieCount / 2); i++) {
    const tie = createBox(6, 26, 2, materials.railTie, false, false);
    tie.position.set(i * tieSpacing, 0, 2 * zoom);
    track.add(tie);
  }

  // 6. Dual gleaming steel rails
  [-7, 7].forEach((y) => {
    const rail = createBox(fullBoardWidth, 2, 3, materials.railSteel, true, false);
    rail.position.set(0, y * zoom, 3.5 * zoom);
    track.add(rail);
  });

  // 7. Crossing Warning Signal Posts
  track.signalLights = [];
  [-boardWidth * 0.52, boardWidth * 0.52].forEach((x) => {
    const post = createBox(3, 3, 34, materials.bumper, false, false);
    post.position.set(x * zoom, 16 * zoom, 17 * zoom);
    track.add(post);

    // Crossbuck sign
    const cross1 = createBox(14, 1.5, 2.5, materials.roadStripe, false, false);
    cross1.position.set(x * zoom, 16 * zoom, 31 * zoom);
    cross1.rotation.y = 0.7;
    track.add(cross1);

    const cross2 = createBox(14, 1.5, 2.5, materials.roadStripe, false, false);
    cross2.position.set(x * zoom, 16 * zoom, 31 * zoom);
    cross2.rotation.y = -0.7;
    track.add(cross2);

    // Red Signal Lights
    const lightL = createBox(3.5, 2, 3.5, materials.trainRedSignalOff, false, false);
    lightL.position.set((x - 4) * zoom, 17.5 * zoom, 27 * zoom);
    track.add(lightL);
    track.signalLights.push(lightL);

    const lightR = createBox(3.5, 2, 3.5, materials.trainRedSignalOff, false, false);
    lightR.position.set((x + 4) * zoom, 17.5 * zoom, 27 * zoom);
    track.add(lightR);
    track.signalLights.push(lightR);
  });

  return track;
}

// ==========================================
// 9. PROCEDURAL LANE FACTORY (Balanced with Generous Land Areas)
// ==========================================
const laneTypes = ["car", "truck", "forest", "field", "train"];
const laneSpeeds = [2.4, 3.0, 3.8, 4.6];
let recentRoadCount = 0;

function Lane(index) {
  this.index = index;
  this.coins = [];
  this.vechicles = [];

  // Starting zone is a quick 2-lane grass strip (lanes 0 and 1)
  if (index <= 1) {
    this.type = "field";
    recentRoadCount = 0;
  } else {
    // Multi-lane highway action: allow up to 5 consecutive roads/tracks before land respite
    if (recentRoadCount >= 5) {
      this.type = Math.random() < 0.5 ? "field" : "forest";
      recentRoadCount = 0;
    } else {
      // Challenging arcade distribution: 65% roads, 10% trains, 25% land
      const rand = Math.random();
      if (rand < 0.38) {
        this.type = "car";
        recentRoadCount++;
      } else if (rand < 0.65) {
        this.type = "truck";
        recentRoadCount++;
      } else if (rand < 0.75) {
        this.type = "train";
        recentRoadCount++;
      } else if (rand < 0.88) {
        this.type = "field"; // Open grass meadow
        recentRoadCount = 0;
      } else {
        this.type = "forest"; // Tree grove
        recentRoadCount = 0;
      }
    }
  }

  const isLightGrass = index % 2 === 0;

  switch (this.type) {
    case "field": {
      this.mesh = createGrassLane(isLightGrass);
      // Spawn wildflowers, grass tufts, and occasional mossy boulders
      for (let i = 0; i < 5; i++) {
        const decoRoll = Math.random();
        const deco =
          decoRoll < 0.45
            ? createWildflower()
            : decoRoll < 0.82
              ? createGrassTuft()
              : createBoulder();
        const randCol = Math.floor(Math.random() * columns);
        deco.position.x =
          (randCol * positionWidth + positionWidth / 2) * zoom - (boardWidth * zoom) / 2;
        deco.position.y = (Math.random() - 0.5) * 12 * zoom;
        this.mesh.add(deco);
      }

      // 30% chance of spawning a collectible coin in fields
      if (Math.random() < 0.30 && index > 0) {
        const coin = createCoin();
        const coinCol = Math.floor(Math.random() * columns);
        coin.col = coinCol;
        coin.position.x =
          (coinCol * positionWidth + positionWidth / 2) * zoom - (boardWidth * zoom) / 2;
        this.mesh.add(coin);
        this.coins.push(coin);
      }
      break;
    }

    case "forest": {
      this.mesh = createGrassLane(isLightGrass);
      this.occupiedPositions = new Set();

      // Spawn 3 to 5 trees on the lane
      const treeCount = Math.floor(Math.random() * 2) + 3;
      const centerCol = Math.floor(columns / 2);
      for (let i = 0; i < treeCount; i++) {
        let position;
        let attempts = 0;
        do {
          position = Math.floor(Math.random() * columns);
          attempts++;
        } while (
          (this.occupiedPositions.has(position) || (index <= 5 && position === centerCol)) &&
          attempts < 25
        );

        this.occupiedPositions.add(position);

        // Pick tree variety
        const treeRoll = Math.random();
        let tree;
        if (treeRoll < 0.45) tree = createPineTree();
        else if (treeRoll < 0.8) tree = createOakTree();
        else tree = createAutumnTree();

        tree.position.x =
          (position * positionWidth + positionWidth / 2) * zoom - (boardWidth * zoom) / 2;
        this.mesh.add(tree);
      }

      // Add small ground decor in unblocked spots
      for (let i = 0; i < 3; i++) {
        const randCol = Math.floor(Math.random() * columns);
        if (!this.occupiedPositions.has(randCol)) {
          const deco = Math.random() > 0.6 ? createBoulder() : createWildflower();
          deco.position.x =
            (randCol * positionWidth + positionWidth / 2) * zoom - (boardWidth * zoom) / 2;
          this.mesh.add(deco);
        }
      }

      // 25% chance of spawning a collectible coin in open forest tiles
      if (Math.random() < 0.25 && index > 0) {
        let coinCol;
        let attempts = 0;
        do {
          coinCol = Math.floor(Math.random() * columns);
          attempts++;
        } while (this.occupiedPositions.has(coinCol) && attempts < 20);

        if (!this.occupiedPositions.has(coinCol)) {
          const coin = createCoin();
          coin.col = coinCol;
          coin.position.x =
            (coinCol * positionWidth + positionWidth / 2) * zoom - (boardWidth * zoom) / 2;
          this.mesh.add(coin);
          this.coins.push(coin);
        }
      }

      // Decorative boundary trees lining the faded outside forest wings
      [-1, 1].forEach((side) => {
        if (Math.random() < 0.8) {
          const outTree = Math.random() < 0.6 ? createPineTree() : createOakTree();
          outTree.position.x = side * (boardWidth / 2 + 30 + Math.random() * 45) * zoom;
          this.mesh.add(outTree);
        }
      });
      break;
    }

    case "car": {
      this.mesh = createRoadLane();
      this.direction = Math.random() >= 0.5;
      // Random vehicle count between 6 and 9
      const carCount = Math.floor(Math.random() * 4) + 6;
      const totalSpan = fullBoardWidth * zoom;
      const positions = generateRandomVehiclePositions(carCount, totalSpan, 75 * zoom);

      // Truly randomized continuous speed between 2.6 and 6.0
      this.speed = Math.round((2.6 + Math.random() * 3.4) * 10) / 10;
      const isFastLane = this.speed > 4.2;

      for (let i = 0; i < carCount; i++) {
        const vehicle = createRandomVehicle(isFastLane ? "fast" : "any");
        vehicle.position.x = positions[i];
        if (!this.direction) vehicle.rotation.z = Math.PI;

        this.mesh.add(vehicle);
        this.vechicles.push(vehicle);
      }

      // Occasional coin on road
      if (Math.random() < 0.25) {
        const coin = createCoin();
        const coinCol = Math.floor(Math.random() * columns);
        coin.col = coinCol;
        coin.position.x =
          (coinCol * positionWidth + positionWidth / 2) * zoom - (boardWidth * zoom) / 2;
        this.mesh.add(coin);
        this.coins.push(coin);
      }
      break;
    }

    case "truck": {
      this.mesh = createRoadLane();
      this.direction = Math.random() >= 0.5;
      // Random vehicle count between 4 and 7
      const truckCount = Math.floor(Math.random() * 4) + 4;
      const totalSpan = fullBoardWidth * zoom;
      const positions = generateRandomVehiclePositions(truckCount, totalSpan, 105 * zoom);

      // Truly randomized continuous speed between 2.2 and 4.4
      this.speed = Math.round((2.2 + Math.random() * 2.2) * 10) / 10;

      for (let i = 0; i < truckCount; i++) {
        const vehicle = createRandomVehicle("heavy");
        vehicle.position.x = positions[i];
        if (!this.direction) vehicle.rotation.z = Math.PI;

        this.mesh.add(vehicle);
        this.vechicles.push(vehicle);
      }
      break;
    }

    case "train": {
      this.mesh = createRailroadLane();
      this.direction = Math.random() >= 0.5;
      this.speed = 15; // Fast high-speed zoom!

      const train = createTrain();
      // Start train far offscreen
      train.position.x = this.direction
        ? (fullBoardWidth * zoom) / 2 + 350 * zoom
        : (-fullBoardWidth * zoom) / 2 - 350 * zoom;
      if (!this.direction) train.rotation.z = Math.PI;

      this.mesh.add(train);
      this.vechicles.push(train);

      // Train arrival timer state
      this.trainState = "idle";
      this.trainTimer = 1100 + Math.random() * 2600;
      break;
    }
  }
}

// ==========================================
// 10. GAME STATE INITIALIZATION
// ==========================================
function generateLanes() {
  backdropLanes = [];
  const allLanes = [-9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
    .map((index) => {
      const lane = new Lane(index);
      lane.mesh.position.y = index * positionWidth * zoom;
      scene.add(lane.mesh);
      if (index < 0) {
        backdropLanes.push(lane);
      }
      return lane;
    });
  return allLanes.filter((lane) => lane.index >= 0);
}

let lastPrunedLane = 0;

function pruneDistantLanes() {
  const pruneTarget = currentLane - 12;
  while (lastPrunedLane < pruneTarget && lastPrunedLane < lanes.length) {
    const l = lanes[lastPrunedLane];
    if (l && l.mesh && l.mesh.parent) {
      scene.remove(l.mesh);
      l.mesh.visible = false;
    }
    lastPrunedLane++;
  }
}

function addLane() {
  const index = lanes.length;
  const lane = new Lane(index);
  lane.mesh.position.y = index * positionWidth * zoom;
  scene.add(lane.mesh);
  lanes.push(lane);

  pruneDistantLanes();
}

function initialiseGame() {
  // Clean up any existing lanes and backdrop wings from scene before regenerating
  if (lanes && lanes.length > 0) {
    lanes.forEach((lane) => {
      if (lane && lane.mesh && lane.mesh.parent) {
        scene.remove(lane.mesh);
      }
    });
  }
  if (backdropLanes && backdropLanes.length > 0) {
    backdropLanes.forEach((lane) => {
      if (lane && lane.mesh && lane.mesh.parent) {
        scene.remove(lane.mesh);
      }
    });
  }

  lanes = generateLanes();
  lastPrunedLane = 0;
  currentLane = 0;
  maxLaneReached = 0;
  currentColumn = Math.floor(columns / 2);
  lastFrameTimestamp = 0;
  frameAccumulator = 0;
  recentRoadCount = 0;
  startMoving = false;
  moves = [];
  stepStartTimestamp = null;
  isDead = false;
  sessionCoins = 0;
  totalCoins = 0;
  if (coinsCounterDOM) coinsCounterDOM.textContent = "0";
  hasMovedOnce = false;

  chicken.position.set(0, 0, 0);
  chicken.rotation.z = 0;
  chicken.bodyRoot.scale.set(1, 1, 1);
  chicken.visible = true;

  camera.position.y = initialCameraPositionY;
  camera.position.x = initialCameraPositionX;
  dirLight.position.x = initialDirLightPositionX;
  dirLight.position.y = initialDirLightPositionY;

  updateScore(false);
  counterDOM.classList.remove("pop");
  endDOM.classList.remove("visible");

  timeLeft = GAME_DURATION;
  timerActive = false;
  timerStartTime = null;
  if (timerCounterDOM) timerCounterDOM.textContent = `${GAME_DURATION}`;
  if (timerPillDOM) timerPillDOM.classList.remove("danger");
  if (gameOverTitleDOM) gameOverTitleDOM.textContent = "GAME OVER!";
}

initialiseGame();

// ==========================================
// 11. INPUT HANDLING & PLAYER MOVEMENT
// ==========================================
function hideTutorial() {
  if (!hasMovedOnce) {
    if (tutorialHintDOM) tutorialHintDOM.classList.add("hidden");
    hasMovedOnce = true;
    if (!timerActive) {
      timerActive = true;
      timerStartTime = performance.now();
    }
  }
}

function move(direction) {
  if (isDead) return;
  if (moves.length >= 2) return; // Prevent input lag & queue overflow
  sounds.init();
  hideTutorial();
  if (!timerActive) {
    timerActive = true;
    timerStartTime = performance.now();
  }

  const finalPositions = moves.reduce(
    (pos, m) => {
      if (m === "forward") return { lane: pos.lane + 1, column: pos.column };
      if (m === "backward") return { lane: pos.lane - 1, column: pos.column };
      if (m === "left") return { lane: pos.lane, column: pos.column - 1 };
      if (m === "right") return { lane: pos.lane, column: pos.column + 1 };
      return pos;
    },
    { lane: currentLane, column: currentColumn }
  );

  if (direction === "forward") {
    if (
      lanes[finalPositions.lane + 1] &&
      lanes[finalPositions.lane + 1].type === "forest" &&
      lanes[finalPositions.lane + 1].occupiedPositions.has(finalPositions.column)
    ) {
      return;
    }
    if (!stepStartTimestamp) startMoving = true;
    addLane();
  } else if (direction === "backward") {
    if (finalPositions.lane === 0) return;
    if (
      lanes[finalPositions.lane - 1] &&
      lanes[finalPositions.lane - 1].type === "forest" &&
      lanes[finalPositions.lane - 1].occupiedPositions.has(finalPositions.column)
    ) {
      return;
    }
    if (!stepStartTimestamp) startMoving = true;
  } else if (direction === "left") {
    if (finalPositions.column === 0) return;
    if (
      lanes[finalPositions.lane] &&
      lanes[finalPositions.lane].type === "forest" &&
      lanes[finalPositions.lane].occupiedPositions.has(finalPositions.column - 1)
    ) {
      return;
    }
    if (!stepStartTimestamp) startMoving = true;
  } else if (direction === "right") {
    if (finalPositions.column === columns - 1) return;
    if (
      lanes[finalPositions.lane] &&
      lanes[finalPositions.lane].type === "forest" &&
      lanes[finalPositions.lane].occupiedPositions.has(finalPositions.column + 1)
    ) {
      return;
    }
    if (!stepStartTimestamp) startMoving = true;
  }

  moves.push(direction);
  sounds.playHop();
}

// ==========================================
// Touch & Slide (Swipe) Controller for Mobile & Phone
// ==========================================
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let touchActive = false;
let hasSwiped = false;
const SLIDE_THRESHOLD = 28; // Distance in pixels to trigger a single slide step

function handleSlideStart(clientX, clientY, target) {
  // Ignore touches on UI controls like modal, sound button, or d-pad buttons
  if (
    target &&
    (target.closest("#end") ||
      target.closest("#sound-btn") ||
      target.closest("#controlls button"))
  ) {
    return false;
  }
  touchStartX = clientX;
  touchStartY = clientY;
  touchStartTime = Date.now();
  touchActive = true;
  hasSwiped = false;
  return true;
}

function handleSlideMove(clientX, clientY, target) {
  if (!touchActive || hasSwiped) return; // Strictly 1 step per swipe!
  if (
    target &&
    (target.closest("#end") ||
      target.closest("#sound-btn") ||
      target.closest("#controlls button"))
  ) {
    return;
  }

  const dx = clientX - touchStartX;
  const dy = clientY - touchStartY;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const dist = Math.hypot(dx, dy);

  if (dist >= SLIDE_THRESHOLD) {
    hasSwiped = true; // Lock gesture until finger is lifted and swiped again
    if (absX > absY) {
      if (dx > 0) {
        move("right");
      } else {
        move("left");
      }
    } else {
      if (dy < 0) {
        move("forward");
      } else {
        move("backward");
      }
    }
  }
}

function handleSlideEnd() {
  touchActive = false;
  hasSwiped = false;
  // Tap to move completely removed: tapping does not move the chicken
}

function handleSlideCancel() {
  touchActive = false;
  hasSwiped = false;
}

// Pointer Events (supports Touch, Pen, and Mouse)
window.addEventListener(
  "pointerdown",
  (e) => {
    if (handleSlideStart(e.clientX, e.clientY, e.target)) {
      try {
        if (e.target && e.target.setPointerCapture && e.pointerId !== undefined) {
          e.target.setPointerCapture(e.pointerId);
        }
      } catch (_) {}
    }
  },
  { passive: true }
);

window.addEventListener(
  "pointermove",
  (e) => {
    handleSlideMove(e.clientX, e.clientY, e.target);
  },
  { passive: true }
);

window.addEventListener(
  "pointerup",
  (e) => {
    handleSlideEnd(e.clientX, e.clientY, e.target);
    try {
      if (e.target && e.target.releasePointerCapture && e.pointerId !== undefined) {
        e.target.releasePointerCapture(e.pointerId);
      }
    } catch (_) {}
  },
  { passive: true }
);

window.addEventListener(
  "pointercancel",
  () => {
    handleSlideCancel();
  },
  { passive: true }
);

// Prevent mobile browser gesture conflicts (pull-to-refresh, pan scroll) during gameplay
window.addEventListener(
  "touchmove",
  (e) => {
    if (e.target.closest("#end")) return;
    if (e.cancelable) e.preventDefault();
  },
  { passive: false }
);

// Touch / Button listeners
document.getElementById("forward").addEventListener("click", (e) => {
  e.stopPropagation();
  move("forward");
});
document.getElementById("backward").addEventListener("click", (e) => {
  e.stopPropagation();
  move("backward");
});
document.getElementById("left").addEventListener("click", (e) => {
  e.stopPropagation();
  move("left");
});
document.getElementById("right").addEventListener("click", (e) => {
  e.stopPropagation();
  move("right");
});

// Keyboard listener
window.addEventListener("keydown", (e) => {
  if (isDead) {
    if (e.code === "Space" || e.code === "Enter") {
      e.preventDefault();
      retryGame();
    }
    return;
  }

  switch (e.code) {
    case "ArrowUp":
    case "KeyW":
    case "Space":
      e.preventDefault();
      move("forward");
      break;
    case "ArrowDown":
    case "KeyS":
      e.preventDefault();
      move("backward");
      break;
    case "ArrowLeft":
    case "KeyA":
      e.preventDefault();
      move("left");
      break;
    case "ArrowRight":
    case "KeyD":
      e.preventDefault();
      move("right");
      break;
  }
});

// Retry Button
function retryGame() {
  lanes.forEach((lane) => scene.remove(lane.mesh));
  initialiseGame();
}
document.getElementById("retry").addEventListener("click", retryGame);

// Trigger game over
function triggerGameOver(reason = "collision") {
  if (isDead) return;
  isDead = true;
  timerActive = false;

  if (reason === "timeout") {
    if (gameOverTitleDOM) gameOverTitleDOM.textContent = "TIME'S UP!";
    sounds.playTimeOut();
  } else {
    if (gameOverTitleDOM) gameOverTitleDOM.textContent = "GAME OVER!";
    sounds.playCrash();
  }

  // Screen shake
  document.body.classList.add("shake");
  setTimeout(() => document.body.classList.remove("shake"), 400);

  // Spawn feather explosion at chicken's location
  particles.spawnFeatherBurst(
    chicken.position.x,
    chicken.position.y,
    chicken.position.z
  );

  // Flatten chicken animation
  chicken.bodyRoot.scale.set(1.4, 1.4, 0.2);

  const currentScore = calculateScore();

  totalCoins = sessionCoins;
  try {
    localStorage.removeItem("crossy_coins");
  } catch (e) {}
  coinsCounterDOM.textContent = `${sessionCoins}`;

  finalScoreDOM.textContent = currentScore;
  finalCoinsDOM.textContent = sessionCoins;

  // Show Game Over UI after slight delay for visual impact
  setTimeout(() => {
    endDOM.classList.add("visible");
  }, 350);
}

// ==========================================
// 12. MAIN ANIMATION & GAME LOOP (Strictly Locked at 60 FPS - Zero Stutter Engine)
// ==========================================
const TARGET_FPS = 60;
const FRAME_INTERVAL = 1000 / TARGET_FPS; // 16.666666666666668 ms per frame

function animate(timestamp) {
  requestAnimationFrame(animate);

  if (!lastFrameTimestamp) {
    lastFrameTimestamp = timestamp;
    return;
  }

  const elapsed = timestamp - lastFrameTimestamp;
  lastFrameTimestamp = timestamp;

  // Add elapsed time to accumulator (clamped to prevent runaway on tab switch)
  frameAccumulator += Math.min(elapsed, 100);

  // Precision 60 FPS Frame Limiter:
  // Threshold of FRAME_INTERVAL - 3.2ms (13.47ms) guarantees:
  // 1. On 60Hz displays: standard ~16.6ms frames NEVER get dropped or skipped to 30 FPS.
  // 2. On 120Hz/144Hz/240Hz displays: cleanly caps at exactly 60 FPS with zero cadence jitter.
  if (frameAccumulator < FRAME_INTERVAL - 3.2) {
    return;
  }

  // Deduct one 60 FPS frame cycle
  frameAccumulator = Math.max(0, frameAccumulator - FRAME_INTERVAL);
  if (frameAccumulator > FRAME_INTERVAL) {
    frameAccumulator = 0; // Prevent runaway catch-up loops
  }

  // Exact fixed 60 FPS delta
  const delta = FRAME_INTERVAL;

  // Countdown 60s Game Timer (100% strictly synced to real-world clock via performance.now)
  if (timerActive && !isDead && timerStartTime !== null) {
    const elapsedRealSeconds = (performance.now() - timerStartTime) / 1000;
    timeLeft = Math.max(0, GAME_DURATION - elapsedRealSeconds);
    const displaySeconds = Math.ceil(timeLeft);
    if (timerCounterDOM) {
      timerCounterDOM.textContent = `${displaySeconds}`;
    }

    if (displaySeconds <= 10) {
      if (timerPillDOM) timerPillDOM.classList.add("danger");
    } else {
      if (timerPillDOM) timerPillDOM.classList.remove("danger");
    }

    if (timeLeft <= 0) {
      triggerGameOver("timeout");
    }
  }

  // 1. Update Particles
  particles.update();

  // 2. Animate Lanes (Vehicles, Trains, Coins)
  // Direct indexed loop over active frustum window only (constant CPU cost)
  const minActiveLane = Math.max(0, currentLane - 8);
  const maxActiveLane = Math.min(lanes.length - 1, currentLane + 18);

  for (let li = minActiveLane; li <= maxActiveLane; li++) {
    const lane = lanes[li];
    if (!lane) continue;

    // Normal Road Vehicles
    if (lane.type === "car" || lane.type === "truck") {
      const aBitBeforeTheBeginning = (-fullBoardWidth * zoom) / 2 - 80 * zoom;
      const aBitAfterTheEnd = (fullBoardWidth * zoom) / 2 + 80 * zoom;
      const moveStep = lane.speed; // Exactly 60 FPS locked step!

      lane.vechicles.forEach((vehicle) => {
        if (lane.direction) {
          if (vehicle.position.x < aBitBeforeTheBeginning) {
            vehicle.position.x = aBitAfterTheEnd + (Math.random() - 0.5) * 60 * zoom;
          } else {
            vehicle.position.x -= moveStep;
          }
        } else {
          if (vehicle.position.x > aBitAfterTheEnd) {
            vehicle.position.x = aBitBeforeTheBeginning + (Math.random() - 0.5) * 60 * zoom;
          } else {
            vehicle.position.x += moveStep;
          }
        }

        // Spin wheels smoothly
        if (vehicle.wheels) {
          const wheelSpin = lane.speed * 0.15;
          vehicle.wheels.forEach((w) => {
            w.tire.rotation.x += lane.direction ? -wheelSpin : wheelSpin;
          });
        }

        // Police flashing emergency lights
        if (vehicle.isPolice) {
          const flash = Math.floor(timestamp / 120) % 2 === 0;
          vehicle.lightBarRed.material = flash ? materials.taillight : materials.trainRedSignalOff;
          vehicle.lightBarBlue.material = flash ? materials.policeBlue : materials.bumper;
        }
      });
    }

    // High-Speed Train Lane
    if (lane.type === "train") {
      const train = lane.vechicles[0];
      lane.trainTimer -= delta;

      if (lane.trainState === "idle" && lane.trainTimer <= 0) {
        lane.trainState = "warning";
        lane.warningDuration = 1250; // 1.25s warning for fast arcade reflex challenge
      } else if (lane.trainState === "warning") {
        lane.warningDuration -= delta;
        const flash = Math.floor(timestamp / 160) % 2 === 0;
        if (lane.mesh.signalLights) {
          lane.mesh.signalLights[0].material = flash ? materials.trainRedSignalOn : materials.trainRedSignalOff;
          lane.mesh.signalLights[1].material = flash ? materials.trainRedSignalOff : materials.trainRedSignalOn;
          lane.mesh.signalLights[2].material = flash ? materials.trainRedSignalOn : materials.trainRedSignalOff;
          lane.mesh.signalLights[3].material = flash ? materials.trainRedSignalOff : materials.trainRedSignalOn;
        }

        if (lane.warningDuration <= 0) {
          lane.trainState = "passing";
          const startX = lane.direction
            ? (fullBoardWidth * zoom) / 2 + 250 * zoom
            : (-fullBoardWidth * zoom) / 2 - 250 * zoom;
          train.position.x = startX;
        }
      } else if (lane.trainState === "passing") {
        const trainSpeed = lane.speed * 2.5;
        if (lane.direction) {
          train.position.x -= trainSpeed;
          if (train.position.x < (-fullBoardWidth * zoom) / 2 - 350 * zoom) {
            lane.trainState = "idle";
            lane.trainTimer = 4000 + Math.random() * 5000;
            lane.mesh.signalLights.forEach((l) => (l.material = materials.trainRedSignalOff));
          }
        } else {
          train.position.x += trainSpeed;
          if (train.position.x > (fullBoardWidth * zoom) / 2 + 350 * zoom) {
            lane.trainState = "idle";
            lane.trainTimer = 4000 + Math.random() * 5000;
            lane.mesh.signalLights.forEach((l) => (l.material = materials.trainRedSignalOff));
          }
        }
      }
    }

    // Rotate and bob collectible coins
    if (lane.coins && lane.coins.length > 0) {
      lane.coins.forEach((coin) => {
        coin.rotation.z += 0.04;
        coin.position.z = 6 * zoom + Math.sin(timestamp * 0.005) * 1.5 * zoom;
      });
    }
  }

  // 3. Animate Chicken Step / Hop with Sinusoidal Ease-in-out
  if (startMoving) {
    stepStartTimestamp = timestamp;
    startMoving = false;
  }

  if (stepStartTimestamp && !isDead) {
    const moveDeltaTime = timestamp - stepStartTimestamp;
    const progress = Math.min(moveDeltaTime / stepTime, 1);

    // Silky smooth sinusoidal ease-in-out curve
    const eased = 0.5 - 0.5 * Math.cos(progress * Math.PI);
    const moveDeltaDistance = eased * positionWidth * zoom;
    const jumpDeltaDistance = Math.sin(progress * Math.PI) * 10 * zoom;

    // Wing flapping during hop
    const flapAngle = Math.sin(progress * Math.PI) * 0.45;
    chicken.leftWing.rotation.z = flapAngle;
    chicken.rightWing.rotation.z = -flapAngle;

    // Squash & Stretch body scaling
    const squash = 1 + Math.sin(progress * Math.PI) * 0.18;
    const stretch = 1 - Math.sin(progress * Math.PI) * 0.12;
    chicken.bodyRoot.scale.set(stretch, stretch, squash);

    // Drop shadow shrinks as chicken rises
    const shadowScale = 1 - (jumpDeltaDistance / (10 * zoom)) * 0.35;
    chicken.dropShadow.scale.set(shadowScale, shadowScale, shadowScale);
    chicken.dropShadow.material.opacity = 0.28 * shadowScale;

    switch (moves[0]) {
      case "forward":
        chicken.rotation.z = 0;
        chicken.position.y = currentLane * positionWidth * zoom + moveDeltaDistance;
        chicken.position.z = jumpDeltaDistance;
        break;
      case "backward":
        chicken.rotation.z = Math.PI;
        chicken.position.y = currentLane * positionWidth * zoom - moveDeltaDistance;
        chicken.position.z = jumpDeltaDistance;
        break;
      case "left":
        chicken.rotation.z = Math.PI / 2;
        chicken.position.x =
          (currentColumn * positionWidth + positionWidth / 2) * zoom -
          (boardWidth * zoom) / 2 -
          moveDeltaDistance;
        chicken.position.z = jumpDeltaDistance;
        break;
      case "right":
        chicken.rotation.z = -Math.PI / 2;
        chicken.position.x =
          (currentColumn * positionWidth + positionWidth / 2) * zoom -
          (boardWidth * zoom) / 2 +
          moveDeltaDistance;
        chicken.position.z = jumpDeltaDistance;
        break;
    }

    // Step Completed
    if (moveDeltaTime >= stepTime) {
      chicken.leftWing.rotation.z = 0;
      chicken.rightWing.rotation.z = 0;
      chicken.bodyRoot.scale.set(1, 1, 1);

      // Dust puff on landing
      particles.spawnPuff(chicken.position.x, chicken.position.y, 0, 4, 2.5);

      switch (moves[0]) {
        case "forward":
          currentLane++;
          if (currentLane > maxLaneReached) {
            maxLaneReached = currentLane;
          }
          updateScore(true);
          break;
        case "backward":
          currentLane--;
          updateScore(false);
          break;
        case "left":
          currentColumn--;
          break;
        case "right":
          currentColumn++;
          break;
      }

      // Check coin pickup on landed lane (1 coin = 5 score in the game)
      if (lanes[currentLane] && lanes[currentLane].coins && lanes[currentLane].coins.length > 0) {
        lanes[currentLane].coins = lanes[currentLane].coins.filter((coin) => {
          if (coin.col === currentColumn) {
            sounds.playCoin();
            particles.spawnCoinSparkle(chicken.position.x, chicken.position.y, chicken.position.z);
            sessionCoins++;
            coinsCounterDOM.textContent = `${sessionCoins}`;
            showFloatingScore("+5", chicken.position.x, chicken.position.y, chicken.position.z);
            updateScore(true);
            lanes[currentLane].mesh.remove(coin);
            return false;
          }
          return true;
        });
      }

      moves.shift();
      stepStartTimestamp = moves.length === 0 ? null : timestamp;
    }
  }

  // 4. Hit Testing (Collision Detection)
  if (
    !isDead &&
    lanes[currentLane] &&
    (lanes[currentLane].type === "car" ||
      lanes[currentLane].type === "truck" ||
      lanes[currentLane].type === "train")
  ) {
    const chickenMinX = chicken.position.x - chickenSize * zoom * 0.45;
    const chickenMaxX = chicken.position.x + chickenSize * zoom * 0.45;

    lanes[currentLane].vechicles.forEach((vehicle) => {
      const vLen = vehicle.vehicleLength || 60;
      const carMinX = vehicle.position.x - (vLen * zoom) / 2;
      const carMaxX = vehicle.position.x + (vLen * zoom) / 2;

      if (chickenMaxX > carMinX && chickenMinX < carMaxX) {
        triggerGameOver();
      }
    });
  }

  // 5. Smooth 60 FPS locked camera & lighting tracking
  const targetCamY = initialCameraPositionY + chicken.position.y;
  const targetCamX = initialCameraPositionX + chicken.position.x;
  const camLerp = 0.22; // Steady, fluid camera tracking at 60 FPS
  camera.position.y += (targetCamY - camera.position.y) * camLerp;
  camera.position.x += (targetCamX - camera.position.x) * camLerp;

  // Directional shadow light locked with camera displacement
  dirLight.position.y = initialDirLightPositionY + (camera.position.y - initialCameraPositionY);
  dirLight.position.x = initialDirLightPositionX + (camera.position.x - initialCameraPositionX);

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
