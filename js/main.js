// Casa Valdemar — FPS de terror psicológico con three.js
import * as THREE from 'three';
import { Mansion, LEVEL_NAMES, LEVEL_LINES, LEVEL_H, CELL } from './map.js';
import { World } from './world.js';
import { Player } from './player.js';
import { GhostManager } from './ghosts.js';
import { AudioEngine } from './audio.js';
import { Post } from './post.js';
import { cargarTexturas } from './textures.js';
import { REGLAS as REGLAS_CUADROS } from '../assets/cuadros.js';

const $ = (id) => document.getElementById(id);
const ui = {
  overlay: $('overlay'), title: $('title-screen'), pause: $('pause-screen'), end: $('end-screen'),
  startText: $('start-text'), hud: $('hud'), floor: $('floor-name'), count: $('ghost-count'),
  hint: $('hint'), msg: $('message'), sanity: $('sanity-fill'), fade: $('fade'),
  endTitle: $('end-title'), endText: $('end-text'), endStats: $('end-stats'), restart: $('restart'),
};

// Las pintadas usan la fuente del juego: esperamos a que cargue (con límite).
await Promise.race([
  document.fonts.load('52px "Special Elite"').catch(() => {}),
  new Promise((r) => setTimeout(r, 2500)),
]);
await cargarTexturas();

// ------------------------------------------------------------ motor
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NoToneMapping;
$('game').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x000000, 0.075);
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.05, 80);

// Sin luz general: solo un resto casi imperceptible que sube con los relámpagos.
const ambient = new THREE.HemisphereLight(0x3a4866, 0x0c0907, 0.035);
scene.add(ambient);

const audio = new AudioEngine();
const mansion = new Mansion();
const world = new World(scene, mansion);
const player = new Player(scene, camera, mansion, audio);
const post = new Post(renderer);
post.setSize(innerWidth, innerHeight);

const G = {
  state: 'title', time: 0, playTime: 0, sanity: 100, lastHit: -99,
  hit: 0, flash: 0, fade: 0, fearS: 0, visited: new Set(), curL: -1,
  eventT: 16, lightningT: 22, winT: -1, deadT: -1, msgT: 0, started: false,
  lastCount: -1, lastSanity: -1, locked: false, dragLook: false,
};

const ghosts = new GhostManager(scene, mansion, audio, {
  onAttack() {
    G.sanity -= 34;
    G.hit = 1;
    G.lastHit = G.time;
    player.shake = 1;
    player.startFlicker(1.4);
    audio.scare();
    if (G.sanity <= 0) die();
  },
  onDying() {
    G.flash = 1;
    player.shake = Math.max(player.shake, 0.4);
  },
  onKilled() {
    if (ghosts.remaining === 0) {
      G.winT = 4.5;
      showMessage('Silencio.<small>Por primera vez en cien años, la casa no respira.</small>', 4.2);
    } else {
      const r = ghosts.remaining;
      // evento: a partir de cierto número de apariciones desterradas, los cuadros dejan de fingir
      if (REGLAS_CUADROS.tetricosTrasDesterrar && ghosts.killed === REGLAS_CUADROS.tetricosTrasDesterrar) {
        world.cuadrosTetricos = true;
        audio.whisperEar(Math.random() < 0.5 ? -0.9 : 0.9);
        showMessage(`${r === 1 ? 'Queda una' : `Quedan ${r}`}.<small>Los retratos de la casa han dejado de fingir.</small>`, 4.5);
      } else {
        showMessage(`${r === 1 ? 'Queda una' : `Quedan ${r}`}.`, 2.5);
      }
    }
  },
  onFirstSight() {
    audio.stinger();
    player.shake = Math.max(player.shake, 0.35);
  },
});

// Precompila shaders y sube a la GPU los fotogramas de las apariciones para evitar tirones
renderer.compile(scene, camera);
for (const t of [...ghosts.todasLasTexturas(), ...world.texturasCuadros()]) renderer.initTexture(t);

ui.startText.textContent = 'Haz clic para entrar';

// ------------------------------------------------------------ mensajes
let msgTimer = null;
function showMessage(html, dur = 4) {
  ui.msg.innerHTML = html;
  ui.msg.classList.add('show');
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => ui.msg.classList.remove('show'), dur * 1000);
}

function fmtTime(s) {
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
}

// ------------------------------------------------------------ entrada
// Si el navegador no permite capturar el ratón, se juega arrastrando con el botón.
// Al reanudar, Chrome exige esperar ~1 s tras salir con Esc: en ese caso se avisa.
function onLockFail() {
  if (G.state === 'title' || !('pointerLockElement' in document)) startPlaying(false);
  else ui.pause.querySelector('.blink').textContent = 'Espera un segundo y vuelve a hacer clic';
}

function lockPointer() {
  const el = renderer.domElement;
  try {
    const p = el.requestPointerLock();
    if (p && p.catch) p.catch(onLockFail);
  } catch {
    onLockFail();
  }
}

function startPlaying(locked) {
  if (G.state === 'dead' || G.state === 'won') return;
  G.locked = locked;
  ui.overlay.classList.add('hidden');
  ui.title.classList.add('hidden');
  ui.pause.classList.add('hidden');
  ui.hud.classList.remove('hidden');
  G.state = 'playing';
  audio.resume();
  if (!G.started) {
    G.started = true;
    audio.setLevel(player.L);
    setTimeout(() => audio.doorSlam(new THREE.Vector3(10.5 * CELL + 1, LEVEL_H + 1.2, 16 * CELL)), 900);
    setTimeout(() => showMessage(`${LEVEL_NAMES[1]}<small>${LEVEL_LINES[1]}</small>`, 4.5), 1600);
    setTimeout(() => showMessage('Destierra a las ocho apariciones.<small>No las pierdas de vista. Nunca.</small>', 5), 7200);
  }
}

function pauseGame() {
  if (G.state !== 'playing') return;
  G.state = 'paused';
  player.keys.clear();
  audio.suspend();
  ui.pause.querySelector('.blink').textContent = 'Haz clic para volver';
  ui.overlay.classList.remove('hidden');
  ui.pause.classList.remove('hidden');
}

ui.overlay.addEventListener('click', () => {
  if (G.state === 'title' || G.state === 'paused') {
    audio.init();
    lockPointer();
  }
});

document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === renderer.domElement) startPlaying(true);
  else if (G.locked) { G.locked = false; pauseGame(); }
});
document.addEventListener('pointerlockerror', onLockFail);

// Silencio total si la pestaña queda oculta; al volver, sigue en pausa.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    pauseGame();
    audio.suspend();
  } else if (G.state === 'playing') {
    audio.resume();
  }
});

document.addEventListener('mousemove', (e) => {
  if (G.state !== 'playing') return;
  if (G.locked || G.dragLook) player.onMouse(e.movementX, e.movementY);
});
renderer.domElement.addEventListener('mousedown', () => {
  if (G.state === 'playing' && !G.locked) G.dragLook = true;
});
document.addEventListener('mouseup', () => { G.dragLook = false; });

document.addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (G.state !== 'playing') return;
  if (e.code === 'Escape' && !G.locked) { pauseGame(); return; }
  player.keys.add(e.code);
  if (e.repeat) return;
  if (e.code === 'Space') interact();
  if (e.code === 'KeyP') {
    const s = post.cycleScale();
    showMessage(`<small>Resolución interna ${Math.round(s * 100)}%</small>`, 1.5);
  }
});
document.addEventListener('keyup', (e) => player.keys.delete(e.code));
window.addEventListener('blur', () => player.keys.clear());

ui.restart.addEventListener('click', (e) => { e.stopPropagation(); location.reload(); });

window.addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  post.setSize(innerWidth, innerHeight);
});

const _v = new THREE.Vector3();
function interact() {
  const it = world.findInteract(player);
  if (!it) return;
  if (it.type === 'door') {
    const d = it.door;
    if (d.open && d.blocksClosing(player.pos.x, player.pos.z)) return;
    d.toggle(player.pos.x, player.pos.z);
    _v.set(d.cx, d.L * LEVEL_H + 1.2, d.cz);
    if (d.open) audio.doorOpen(_v); else audio.doorClose(_v);
  } else if (it.type === 'front') {
    audio.locked();
    showMessage('La puerta principal no cede.<small>Algo en la casa no quiere que te vayas.</small>', 3.5);
  }
}

// ------------------------------------------------------------ eventos
function inView(x, z, cosLimit = 0.3) {
  const dx = x - player.pos.x, dz = z - player.pos.z;
  const d = Math.hypot(dx, dz) || 1;
  return (dx * -Math.sin(player.yaw) + dz * -Math.cos(player.yaw)) / d > cosLimit;
}

function slamNearbyDoor() {
  const cands = world.doors.filter((d) => {
    if (!d.open || d.L !== player.L) return false;
    const dist = Math.hypot(d.cx - player.pos.x, d.cz - player.pos.z);
    return dist > 3 && dist < 14 && !inView(d.cx, d.cz) && !d.blocksClosing(player.pos.x, player.pos.z);
  });
  if (!cands.length) return false;
  const d = cands[Math.floor(Math.random() * cands.length)];
  d.slam();
  _v.set(d.cx, d.L * LEVEL_H + 1.2, d.cz);
  audio.doorSlam(_v);
  player.shake = Math.max(player.shake, 0.3);
  return true;
}

function randomEvent() {
  const opts = [
    () => audio.knock((Math.random() - 0.5) * 1.6),
    () => audio.whisperEar(Math.random() < 0.5 ? -0.9 : 0.9),
    () => player.startFlicker(0.6 + Math.random() * 0.9),
    () => audio.scrape(),
    () => audio.creak(0.3, (Math.random() - 0.5) * 1.5, 1.2),
    () => slamNearbyDoor() || audio.knock((Math.random() - 0.5) * 1.6),
  ];
  if (player.L < 3) opts.push(() => audio.stepsAbove());
  if (player.L === 1 && world.pianos.length) opts.push(() => audio.piano(world.pianos[0].pos));
  opts[Math.floor(Math.random() * opts.length)]();
}

function lightning() {
  world.lightning = 1;
  G.flash = Math.max(G.flash, 0.6);
  setTimeout(() => { world.lightning = 0.7; }, 140);
  setTimeout(() => { world.lightning = 1; }, 260);
  audio.thunder(0.5 + Math.random() * 1.8, player.L === 3 ? 1.2 : 0.85);
}

// ------------------------------------------------------------ fin de partida
function die() {
  if (G.state !== 'playing') return;
  G.state = 'dead';
  G.deadT = 0;
  G.hit = 1;
  audio.scare();
  showMessage('Tu mente se quiebra.', 3);
}

function endScreen(won) {
  if (document.pointerLockElement) document.exitPointerLock();
  G.locked = false;
  ui.hud.classList.add('hidden');
  ui.overlay.classList.remove('hidden');
  ui.title.classList.add('hidden');
  ui.pause.classList.add('hidden');
  ui.end.classList.remove('hidden');
  if (won) {
    ui.endTitle.textContent = 'Amanece';
    ui.endText.textContent = 'Las ocho apariciones se han deshecho en la luz. La puerta principal se abre sola, despacio, como invitándote a salir.';
  } else {
    ui.endTitle.textContent = 'Tu mente se ha quebrado';
    ui.endText.textContent = 'La casa Valdemar tiene un inquilino más. Ahora eres tú quien espera a que alguien aparte la mirada.';
  }
  ui.endStats.textContent = `Apariciones desterradas: ${ghosts.killed}/${ghosts.total} · Tiempo: ${fmtTime(G.playTime)}`;
}

// ------------------------------------------------------------ bucle
function nearestVol(list, range) {
  let best = 0;
  for (const it of list) {
    if (it.L !== player.L) continue;
    const d = it.pos.distanceTo(camera.position);
    best = Math.max(best, 1 - d / range);
  }
  return best;
}

function updatePlaying(dt) {
  G.playTime += dt;
  player.update(dt);

  if (player.L !== G.curL) {
    G.curL = player.L;
    world.setVisibleLevel(player.L);
    audio.setLevel(player.L);
    ui.floor.textContent = LEVEL_NAMES[player.L];
    if (!G.visited.has(player.L)) {
      G.visited.add(player.L);
      if (G.playTime > 3) showMessage(`${LEVEL_NAMES[player.L]}<small>${LEVEL_LINES[player.L]}</small>`, 5);
    }
  }

  ghosts.update(dt, G.time, player);

  // la linterna avisa: parpadea si algo se acerca por donde no miras
  if (ghosts.danger > 0 && Math.random() < dt * (0.2 + ghosts.danger * 1.3)) {
    player.startFlicker(0.2 + Math.random() * 0.5);
  }

  // cordura
  if (G.time - G.lastHit > 6 && ghosts.fear < 0.25) G.sanity = Math.min(100, G.sanity + dt * 1.5);
  if (ghosts.fear > 0.75) G.sanity -= dt * 1.5;
  if (G.sanity <= 0) die();

  // eventos y relámpagos
  G.eventT -= dt;
  if (G.eventT <= 0) { G.eventT = 12 + Math.random() * 22; randomEvent(); }
  if (player.L >= 1) {
    G.lightningT -= dt;
    if (G.lightningT <= 0) { G.lightningT = 20 + Math.random() * 35; lightning(); }
  }

  if (G.winT > 0) {
    G.winT -= dt;
    if (G.winT <= 0) { G.state = 'won'; G.deadT = 0; }
  }

  // pista de interacción
  const it = world.findInteract(player);
  if (it) {
    ui.hint.textContent = it.type === 'front' ? '[ESPACIO] Puerta principal' : it.door.open ? '[ESPACIO] Cerrar' : '[ESPACIO] Abrir';
    ui.hint.classList.add('show');
  } else ui.hint.classList.remove('show');
}

function updateHud() {
  if (ghosts.remaining !== G.lastCount) {
    G.lastCount = ghosts.remaining;
    ui.count.textContent = `Apariciones: ${ghosts.remaining}`;
  }
  const s = Math.max(0, Math.round(G.sanity));
  if (s !== G.lastSanity) {
    G.lastSanity = s;
    ui.sanity.style.width = s + '%';
  }
}

const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  tick(Math.min(0.05, clock.getDelta()));
}

function tick(dt) {
  G.time += dt;

  if (G.state === 'playing') {
    updatePlaying(dt);
  } else if (G.state === 'dead' || G.state === 'won') {
    G.deadT += dt;
    player.update(dt * 0.3);
    G.fade = Math.min(1, G.deadT / (G.state === 'won' ? 3 : 2.2));
    if (G.deadT > (G.state === 'won' ? 3.2 : 2.6) && ui.end.classList.contains('hidden')) endScreen(G.state === 'won');
  }

  world.update(dt, G.time, player, ghosts);

  G.hit = Math.max(0, G.hit - dt * 0.8);
  G.flash = Math.max(0, G.flash - dt * 2.5);
  G.fearS += (ghosts.fear - G.fearS) * Math.min(1, dt * 3);
  player.fearTilt = Math.sin(G.time * 0.6) * 0.025 * Math.pow(1 - G.sanity / 100, 2);
  ambient.intensity = 0.035 + (player.L >= 1 ? world.lightning * 0.45 : 0);

  if (audio.ready) {
    audio.setListener(camera.position, player.camDir);
    audio.update(dt, {
      fear: G.state === 'playing' ? G.fearS : 0,
      sanity: G.sanity / 100,
      burn: G.state === 'playing' ? ghosts.burn : 0,
      fireVol: nearestVol(world.fireplaces, 9),
      clockVol: nearestVol(world.clocks, 11) * 0.5,
    });
    for (const r of world.rockers) if (r.creak && Math.random() < 0.5) audio.creak(0.12, 0, 0.5);
  }

  updateHud();
  const u = post.uniforms;
  u.uTime.value = G.time;
  u.uFear.value = G.fearS;
  u.uSanity.value = Math.max(0, G.sanity / 100);
  u.uHit.value = G.hit;
  u.uFlash.value = G.flash;
  u.uFade.value = G.fade;
  post.render(scene, camera);
}

world.setVisibleLevel(player.L);

// Modo depuración (?debug en la URL): expone el estado y permite avanzar
// fotogramas a mano con __casa.tick(1/60), útil cuando rAF no corre.
if (new URLSearchParams(location.search).has('debug')) {
  window.__casa = { THREE, scene, camera, renderer, player, world, ghosts, mansion, post, audio, G, tick };
}

frame();
