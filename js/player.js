// Jugador: movimiento, colisiones, balanceo de cámara y linterna.
import * as THREE from 'three';
import { CELL, LEVEL_H } from './map.js';
import * as TX from './textures.js';

const EYE = 1.62;
const RADIUS = 0.28;

export class Player {
  constructor(scene, camera, mansion, audio) {
    this.scene = scene;
    this.camera = camera;
    this.m = mansion;
    this.audio = audio;
    const s = mansion.start;
    this.pos = new THREE.Vector3((s.i + 0.5) * CELL, 0, (s.j + 0.5) * CELL);
    this.feetY = s.L * LEVEL_H;
    this.L = s.L;
    this.yaw = 0;
    this.pitch = 0;
    this.vel = new THREE.Vector2();
    this.bob = 0;
    this.bobAmt = 0;
    this.lastStepSign = 1;
    this.shake = 0;
    this.fearTilt = 0;
    this.keys = new Set();
    this.mouse = { dx: 0, dy: 0 };
    this.running = false;
    this.moving = false;

    // Linterna: foco con sombras y textura de lente, montado en un soporte que
    // sigue a la cámara con algo de retraso para que pese en la mano.
    this.rig = new THREE.Object3D();
    scene.add(this.rig);
    this.spot = new THREE.SpotLight(0xfff2de, 240, 30, 0.5, 0.5, 2);
    this.spot.position.set(0.16, -0.14, 0.05);
    this.spot.castShadow = true;
    this.spot.shadow.mapSize.set(1024, 1024);
    this.spot.shadow.camera.near = 0.15;
    this.spot.shadow.camera.far = 30;
    this.spot.shadow.bias = -0.0006;
    this.spot.shadow.normalBias = 0.02;
    this.spot.map = TX.textura('lente-linterna');
    this.rig.add(this.spot);
    this.rig.add(this.spot.target);
    this.spot.target.position.set(0, 0, -6);
    this.spill = new THREE.PointLight(0xffe4c4, 1.2, 4.5, 2);
    this.spill.position.set(0, 0.1, -0.4);
    this.rig.add(this.spill);
    this.baseSpot = 240;
    this.baseSpill = 1.2;
    this.lightFactor = 1;
    this.flicker = 0;       // segundos restantes de parpadeo
    this.flickerState = 1;
    this.flickerNext = 0;

    this.lightPos = new THREE.Vector3();
    this.lightDir = new THREE.Vector3();
    this.camDir = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler(0, 0, 0, 'YXZ');
    this._step = new THREE.Vector3();

    this.updateCamera(0);
    this.rig.position.copy(camera.position);
    this.rig.quaternion.copy(camera.quaternion);
  }

  onMouse(dx, dy) {
    dx = Math.max(-150, Math.min(150, dx));
    dy = Math.max(-150, Math.min(150, dy));
    this.mouse.dx += dx;
    this.mouse.dy += dy;
  }

  startFlicker(duration) {
    this.flicker = Math.max(this.flicker, duration);
  }

  surface() {
    return this.L === 0 ? 'stone' : this.L === 3 ? 'attic' : 'wood';
  }

  update(dt) {
    const sens = 0.0022;
    this.yaw -= this.mouse.dx * sens;
    this.pitch -= this.mouse.dy * sens;
    this.mouse.dx = this.mouse.dy = 0;
    this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));

    const k = this.keys;
    const f = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
    const s = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    this.running = (k.has('ShiftLeft') || k.has('ShiftRight')) && f > 0;
    const speed = this.running ? 4.6 : 2.6;
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    let wx = -sin * f + cos * s;
    let wz = -cos * f - sin * s;
    const wl = Math.hypot(wx, wz);
    if (wl > 0) { wx /= wl; wz /= wl; }
    const accel = 1 - Math.exp(-dt * (wl > 0 ? 9 : 12));
    this.vel.x += (wx * speed - this.vel.x) * accel;
    this.vel.y += (wz * speed - this.vel.y) * accel;

    // movimiento con subpasos para no atravesar puertas
    const move = Math.hypot(this.vel.x, this.vel.y) * dt;
    const sub = Math.max(1, Math.ceil(move / 0.08));
    for (let n = 0; n < sub; n++) {
      this.pos.x += (this.vel.x * dt) / sub;
      this.pos.z += (this.vel.y * dt) / sub;
      this.m.resolveCircle(this.L, this.pos, RADIUS);
    }

    const target = this.m.heightAt(this.pos.x, this.pos.z, this.L);
    this.feetY += (target - this.feetY) * Math.min(1, dt * 18);
    if (Math.abs(target - this.feetY) < 0.002) this.feetY = target;
    this.L = this.m.levelFromY(this.feetY);

    // balanceo al andar y pasos
    const sp = Math.hypot(this.vel.x, this.vel.y);
    this.moving = sp > 0.4;
    this.bobAmt += ((this.moving ? Math.min(1, sp / 2.6) : 0) - this.bobAmt) * Math.min(1, dt * 8);
    this.bob += dt * sp * (this.running ? 2.5 : 2.9);
    const sign = Math.sign(Math.sin(this.bob));
    if (this.moving && sign !== this.lastStepSign && sign !== 0) {
      this.audio.footstep(this.surface(), this.running);
    }
    this.lastStepSign = sign;

    this.shake = Math.max(0, this.shake - dt * 1.6);
    this.updateCamera(dt);
    this.updateFlashlight(dt);
  }

  updateCamera(dt) {
    const cam = this.camera;
    const bobY = Math.abs(Math.sin(this.bob)) * 0.055 * this.bobAmt;
    const bobX = Math.cos(this.bob) * 0.03 * this.bobAmt;
    const sh = this.shake * this.shake;
    const t = performance.now() * 0.001;
    cam.position.set(
      this.pos.x + bobX * Math.cos(this.yaw),
      this.feetY + EYE - 0.03 + bobY,
      this.pos.z - bobX * Math.sin(this.yaw)
    );
    this._e.set(
      this.pitch + Math.sin(t * 37) * 0.03 * sh,
      this.yaw + Math.sin(t * 29) * 0.04 * sh,
      Math.cos(this.bob) * 0.006 * this.bobAmt + this.fearTilt,
      'YXZ'
    );
    cam.quaternion.setFromEuler(this._e);
    cam.getWorldDirection(this.camDir);
  }

  updateFlashlight(dt) {
    this.rig.position.copy(this.camera.position);
    this.rig.quaternion.slerp(this.camera.quaternion, 1 - Math.exp(-dt * 13));

    // parpadeos
    let factor = 0.97 + Math.sin(performance.now() * 0.013) * 0.015 + Math.random() * 0.015;
    if (this.flicker > 0) {
      this.flicker -= dt;
      this.flickerNext -= dt;
      if (this.flickerNext <= 0) {
        this.flickerNext = 0.03 + Math.random() * 0.09;
        const r = Math.random();
        this.flickerState = r < 0.45 ? 0 : r < 0.6 ? 0.25 : 1;
      }
      factor *= this.flickerState;
    }
    this.lightFactor = factor;
    this.spot.intensity = this.baseSpot * factor;
    this.spill.intensity = this.baseSpill * factor;

    this.spot.getWorldPosition(this.lightPos);
    this.lightDir.set(0, 0, -1).applyQuaternion(this.rig.quaternion);
  }

  get lightOn() { return this.lightFactor > 0.5; }
}
