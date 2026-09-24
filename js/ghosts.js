// Apariciones: solo avanzan cuando no las miras. La linterna, de cerca y
// sostenida entre 5 y 8 segundos, las desintegra.
import * as THREE from 'three';
import { CELL, LEVEL_H } from './map.js';
import * as TX from './textures.js';

const WATCH_COS = Math.cos(THREE.MathUtils.degToRad(34));
const WATCH_NEAR_COS = Math.cos(THREE.MathUtils.degToRad(55));
const BURN_COS = Math.cos(THREE.MathUtils.degToRad(19));
const SEEN_COS = Math.cos(THREE.MathUtils.degToRad(24));
const BURN_RANGE = 8.5;
const DIE_TIME = 2.4;
const NO_VOICE = { set() {}, update() {}, stop() {} };

const HEADER = /* glsl */`
uniform float uDissolve;
uniform float uBurn;
uniform float uTime;
uniform float uAlpha;
float gh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float gn(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(gh(i), gh(i + vec2(1.0, 0.0)), f.x), mix(gh(i + vec2(0.0, 1.0)), gh(i + vec2(1.0, 1.0)), f.x), f.y);
}
`;

const DISSOLVE = /* glsl */`
#include <emissivemap_fragment>
{
  vec2 duv = vMapUv;
  float n = gn(duv * vec2(9.0, 18.0) + vec2(0.0, uTime * 0.35)) * 0.65 + gn(duv * vec2(40.0, 80.0)) * 0.35;
  if (uDissolve > 0.0) {
    float d = uDissolve * 1.15 - (1.0 - duv.y) * 0.15;
    if (n < d) discard;
    float e = 1.0 - smoothstep(d, d + 0.09, n);
    totalEmissiveRadiance += vec3(1.0, 0.28, 0.06) * e * 3.2 * diffuseColor.a;
    diffuseColor.rgb *= 1.0 - e * 0.6;
  }
  float fl = 0.5 + 0.5 * sin(uTime * 38.0 + duv.y * 45.0);
  totalEmissiveRadiance += vec3(0.75, 0.88, 1.0) * uBurn * uBurn * (0.4 + fl) * 1.4 * diffuseColor.a;
  diffuseColor.a *= uAlpha;
}
`;

function makeMaterial(tex, uniforms) {
  const m = new THREE.MeshStandardMaterial({
    map: tex, color: 0xb4bcc8, emissiveMap: tex, emissive: 0xb0c4dc, emissiveIntensity: 0.16,
    transparent: true, alphaTest: 0.03, depthWrite: false, side: THREE.DoubleSide,
    roughness: 1, metalness: 0,
  });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uDissolve = uniforms.uDissolve;
    sh.uniforms.uBurn = uniforms.uBurn;
    sh.uniforms.uTime = uniforms.uTime;
    sh.uniforms.uAlpha = uniforms.uAlpha;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + HEADER)
      .replace('#include <emissivemap_fragment>', DISSOLVE);
  };
  m.customProgramCacheKey = () => 'aparicion-v1';
  return m;
}

class Ghost {
  constructor(mgr, spawn, idx) {
    this.mgr = mgr;
    this.m = mgr.m;
    this.idx = idx;
    this.x = (spawn.i + 0.5) * CELL;
    this.z = (spawn.j + 0.5) * CELL;
    this.gy = spawn.L * LEVEL_H;
    this.L = spawn.L;
    this.state = 'dormant';
    this.exposure = 0;
    this.required = 5 + Math.random() * 3;
    this.seen = false;
    this.cooldown = 0;
    this.dieT = 0;
    this.alpha = 1;
    this.wp = -1;
    this.lastNode = this.m.nodeAt(this.x, this.z, this.L);
    this.phase = Math.random() * 10;
    this.watched = false;
    this.lit = false;
    this.moving = false;
    this.dist = 99;
    this.glitch = 0;

    this.uni = { uDissolve: { value: 0 }, uBurn: { value: 0 }, uTime: { value: 0 }, uAlpha: { value: 1 } };
    this.matCalm = makeMaterial(mgr.texCalm, this.uni);
    this.matScream = makeMaterial(mgr.texScream, this.uni);
    this.mesh = new THREE.Mesh(mgr.geo, this.matCalm);
    this.mesh.renderOrder = 5;
    this.mesh.frustumCulled = false;
    mgr.scene.add(this.mesh);
    this.voice = null;
  }

  update(dt, t, P) {
    if (this.state === 'dead') return;
    const m = this.m;
    const u = this.uni;
    if (!this.voice && this.mgr.audio.ready) this.voice = this.mgr.audio.createVoice();
    const voice = this.voice || NO_VOICE;
    u.uTime.value = t + this.phase;
    this.L = m.levelFromY(this.gy);

    const hover = 0.08 + Math.sin(t * 1.3 + this.phase) * 0.05;
    const head = this.mgr._head.set(this.x, this.gy + 1.25 + hover, this.z);
    const cam = P.camera.position;
    const vx = head.x - cam.x, vy = head.y - cam.y, vz = head.z - cam.z;
    const dist = Math.sqrt(vx * vx + vy * vy + vz * vz) || 0.001;
    this.dist = dist;
    const dot = (vx * P.camDir.x + vy * P.camDir.y + vz * P.camDir.z) / dist;

    this.watched = false;
    this.lit = false;
    let seenLit = false;
    if (Math.abs(this.L - P.L) <= 1 && dist < 32 && this.state !== 'dying') {
      const inView = dot > WATCH_COS || (dist < 2.2 && dot > WATCH_NEAR_COS);
      if (inView && m.los(cam, head)) {
        this.watched = true;
        if (P.lightOn) {
          const lx = head.x - P.lightPos.x, ly = head.y - P.lightPos.y, lz = head.z - P.lightPos.z;
          const ld = Math.sqrt(lx * lx + ly * ly + lz * lz) || 0.001;
          const lc = (lx * P.lightDir.x + ly * P.lightDir.y + lz * P.lightDir.z) / ld;
          if (lc > BURN_COS && ld < BURN_RANGE) this.lit = true;
          if (lc > SEEN_COS && ld < 15) seenLit = true;
        }
      }
    }

    if (this.state === 'dying') {
      this.dieT += dt;
      u.uDissolve.value = 0.04 + this.dieT / DIE_TIME;
      u.uBurn.value = 1;
      this.gy += dt * 0.15;
      this.place(t, hover, P, (Math.random() - 0.5) * 0.05);
      voice.set(false, false, 0);
      if (this.dieT >= DIE_TIME) {
        this.state = 'dead';
        this.mesh.visible = false;
        voice.stop();
        this.mgr.onKilled(this);
      }
      return;
    }

    const flowDist = this.lastNode >= 0 ? this.mgr.dist[this.lastNode] : -1;

    if (this.state === 'dormant') {
      if ((flowDist >= 0 && flowDist <= 8) || (this.watched && dist < 12)) {
        this.state = 'hunt';
        this.mgr.audio.ghostWake(head);
      }
    }

    if (seenLit && !this.seen && dist < 14) {
      this.seen = true;
      this.mgr.onFirstSight(this);
    }

    // exposición a la linterna
    if (this.lit) this.exposure += dt;
    else this.exposure = Math.max(0, this.exposure - dt * 0.35);
    u.uBurn.value = Math.min(1, this.exposure / this.required);
    if (this.exposure >= this.required) {
      this.state = 'dying';
      this.dieT = 0;
      this.mgr.onDying(this);
      return;
    }

    // movimiento: solo si no la estás mirando
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.moving = false;
    if (this.state === 'hunt' && !this.watched && this.cooldown <= 0) this.move(dt, t, P);

    // ataque
    const pdx = P.pos.x - this.x, pdz = P.pos.z - this.z;
    if (this.state === 'hunt' && this.cooldown <= 0 && Math.hypot(pdx, pdz) < 0.8 && Math.abs(P.feetY - this.gy) < 1.2) {
      this.mgr.attack(this);
    }

    // aspecto
    this.alpha = Math.min(1, this.alpha + dt * 0.4);
    const pulse = 0.85 + Math.sin(t * 2.1 + this.phase) * 0.1;
    this.glitch = Math.max(0, this.glitch - dt);
    if (Math.random() < dt * 0.15) this.glitch = 0.12;
    u.uAlpha.value = this.alpha * pulse * (this.glitch > 0 ? 0.4 + Math.random() * 0.6 : 1);
    const scream = this.state === 'hunt' && dist < 3.8;
    this.mesh.material = scream || u.uBurn.value > 0.55 ? this.matScream : this.matCalm;

    const burnShake = u.uBurn.value * 0.06 + (this.glitch > 0 ? 0.08 : 0);
    this.place(t, hover, P, (Math.random() - 0.5) * burnShake);

    const active = Math.abs(this.L - P.L) <= 1;
    voice.set(active, this.moving, u.uBurn.value, this.state === 'dormant');
    voice.update(dt, head);
  }

  place(t, hover, P, jitter) {
    const cam = P.camera.position;
    this.mesh.position.set(this.x + jitter, this.gy + 1.1 + hover, this.z + jitter * 0.5);
    this.mesh.rotation.set(0, Math.atan2(cam.x - this.x, cam.z - this.z), Math.sin(t * 0.7 + this.phase) * 0.03);
    this.mesh.visible = Math.abs(this.L - P.L) <= 1;
  }

  move(dt, t, P) {
    const m = this.m, mgr = this.mgr;
    const L = m.levelFromY(this.gy);
    const node = m.nodeAt(this.x, this.z, L);
    if (node >= 0) this.lastNode = node;
    const pdx = P.pos.x - this.x, pdz = P.pos.z - this.z;
    const pd = Math.hypot(pdx, pdz);
    let speed = pd > 14 ? 2.7 : pd > 6 ? 1.9 : 1.55;
    speed *= 0.75 + 0.35 * (0.5 + 0.5 * Math.sin(t * 3.1 + this.phase));

    let tx, tz;
    const sameFloor = Math.abs(P.feetY - this.gy) < 0.9;
    if (sameFloor && (node === mgr.playerNode || pd < 2.2)) {
      tx = P.pos.x; tz = P.pos.z;
      this.wp = -1;
    } else {
      if (this.wp < 0) this.wp = this.lastNode;
      if (this.wp < 0) return;
      const c = mgr._c;
      m.nodeCenter(this.wp, c);
      if (Math.hypot(c.x - this.x, c.z - this.z) < 0.15) {
        const cur = this.wp;
        let best = -1, bd = mgr.dist[cur] >= 0 ? mgr.dist[cur] : 1e9;
        for (const n of m.adj[cur]) {
          const d = mgr.dist[n];
          if (d >= 0 && d < bd) { bd = d; best = n; }
        }
        if (best < 0) return;
        this.wp = best;
        m.nodeCenter(this.wp, c);
      }
      tx = c.x; tz = c.z;
    }
    const dx = tx - this.x, dz = tz - this.z;
    const d = Math.hypot(dx, dz);
    if (d < 1e-4) return;
    const step = Math.min(d, speed * dt);
    this.x += (dx / d) * step;
    this.z += (dz / d) * step;
    this.gy = m.heightAt(this.x, this.z, m.levelFromY(this.gy));
    this.moving = true;
  }

  teleportAway() {
    const m = this.m, mgr = this.mgr;
    const cands = [];
    const L = this.L;
    for (let n = 0; n < m.nodeCount; n++) {
      const d = mgr.dist[n];
      if (d >= 10 && d <= 18 && m.nodeLevel(n) === L && !m.stairMap.has(n)) cands.push(n);
    }
    if (!cands.length) {
      for (let n = 0; n < m.nodeCount; n++) if (mgr.dist[n] >= 10 && !m.stairMap.has(n)) cands.push(n);
    }
    if (!cands.length) return;
    const n = cands[Math.floor(Math.random() * cands.length)];
    const c = mgr._c;
    const Ln = m.nodeCenter(n, c);
    this.x = c.x; this.z = c.z; this.gy = Ln * LEVEL_H;
    this.lastNode = n; this.wp = -1;
    this.alpha = 0;
    this.cooldown = 3;
    this.exposure = 0;
  }
}

export class GhostManager {
  constructor(scene, mansion, audio, hooks) {
    this.scene = scene;
    this.m = mansion;
    this.audio = audio;
    this.hooks = hooks;
    this.texCalm = TX.textura('aparicion');
    this.texScream = TX.textura('aparicion-grito');
    this.geo = new THREE.PlaneGeometry(1.05, 2.1);
    this.dist = new Int16Array(mansion.nodeCount).fill(-1);
    this.flowT = 0;
    this.playerNode = -1;
    this._head = new THREE.Vector3();
    this._c = new THREE.Vector3();
    this.list = mansion.spawns.map((s, k) => new Ghost(this, s, k));
    this.total = this.list.length;
    this.killed = 0;
    this.fear = 0;
    this.danger = 0;
    this.burn = 0;
  }

  get remaining() { return this.total - this.killed; }

  update(dt, t, P) {
    this.flowT -= dt;
    if (this.flowT <= 0) {
      this.flowT = 0.2;
      const pn = this.m.nodeAt(P.pos.x, P.pos.z, P.L);
      if (pn >= 0) {
        this.playerNode = pn;
        this.m.bfs(pn, this.dist);
      }
    }
    let fear = 0, danger = 0, burn = 0;
    for (const g of this.list) {
      g.update(dt, t, P);
      if (g.state === 'dead') continue;
      if (g.lit) burn = Math.max(burn, this.uniBurn(g));
      if (g.state !== 'hunt' || Math.abs(g.gy - P.feetY) > 2) continue;
      let f = Math.max(0, 1 - g.dist / 13);
      if (!g.watched) f *= 1.15;
      fear = Math.max(fear, Math.min(1, f));
      if (!g.watched && g.dist < 7) danger = Math.max(danger, 1 - g.dist / 7);
    }
    this.fear = fear;
    this.danger = danger;
    this.burn = burn;
  }

  uniBurn(g) { return g.uni.uBurn.value; }

  attack(g) {
    g.teleportAway();
    this.hooks.onAttack(g);
  }

  onDying(g) {
    this.audio.ghostDie(this._head.set(g.x, g.gy + 1.2, g.z));
    this.hooks.onDying(g);
  }

  onKilled(g) {
    this.killed++;
    this.hooks.onKilled(g);
  }

  onFirstSight(g) {
    this.hooks.onFirstSight(g);
  }
}
