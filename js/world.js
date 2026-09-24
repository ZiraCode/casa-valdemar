// Construcción de la mansión: muros, suelos, escaleras, puertas, decoración y luces.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CELL, LEVEL_H, COLS, ROWS, LEVELS, WALL_CHARS } from './map.js';
import * as TX from './textures.js';
import { CUADROS, REGLAS, DIRECCIONES } from '../assets/cuadros.js';
import { LUZ, TIPO_FUENTE } from './iluminacion.js';

const C = CELL, H = LEVEL_H;
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const POOL_SIZE = 6;

const DECALS = [
  'SIGUE MIRANDO', 'NO LA MIRES DE REOJO', '¿POR QUÉ NO NOS MIRAS?',
  'ESTÁ DETRÁS DE TI', 'NO APAGUES LA LUZ', 'SE MUEVEN A OSCURAS',
];

const RUGS = [
  [1, 2, 8, 5, 12], [1, 8, 10, 13, 14], [1, 16, 7, 19, 9], [1, 1, 2, 5, 4],
  [2, 1, 8, 6, 13], [2, 11, 1, 15, 3], [2, 8, 10, 13, 14],
];

// Acumula quads en una geometría
class Batch {
  constructor() { this.p = []; this.n = []; this.uv = []; this.i = []; }
  get count() { return this.i.length; }
  quad(a, b, c, d, n, u0, v0, u1, v1) {
    const base = this.p.length / 3;
    this.p.push(...a, ...b, ...c, ...d);
    for (let k = 0; k < 4; k++) this.n.push(n[0], n[1], n[2]);
    this.uv.push(u0, v0, u1, v0, u1, v1, u0, v1);
    this.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.i);
    return g;
  }
}

class Door {
  constructor(world, L, i, j, axis) {
    this.L = L; this.i = i; this.j = j; this.axis = axis;
    this.angle = 0; this.target = 0; this.open = false; this.speed = 3;
    this.cx = (i + 0.5) * C; this.cz = (j + 0.5) * C;
    const M = world.mats;
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 0.08), M.door);
    leaf.position.set(0.6, 1.2, 0);
    leaf.castShadow = true; leaf.receiveShadow = true;
    const knobGeo = new THREE.SphereGeometry(0.035, 8, 6);
    const k1 = new THREE.Mesh(knobGeo, M.brass); k1.position.set(1.08, 1.05, 0.07);
    const k2 = new THREE.Mesh(knobGeo, M.brass); k2.position.set(1.08, 1.05, -0.07);
    this.pivot = new THREE.Group();
    this.pivot.add(leaf, k1, k2);
    const y = L * H;
    if (axis === 'x') {
      this.pivot.position.set(this.cx - 0.6, y, this.cz);
      this.base = 0;
      this.jambs = [
        { x0: i * C, x1: i * C + 0.4, z0: this.cz - 0.12, z1: this.cz + 0.12 },
        { x0: (i + 1) * C - 0.4, x1: (i + 1) * C, z0: this.cz - 0.12, z1: this.cz + 0.12 },
      ];
      this.leafBox = { x0: i * C + 0.4, x1: (i + 1) * C - 0.4, z0: this.cz - 0.06, z1: this.cz + 0.06 };
    } else {
      this.pivot.position.set(this.cx, y, this.cz - 0.6);
      this.base = -Math.PI / 2;
      this.jambs = [
        { x0: this.cx - 0.12, x1: this.cx + 0.12, z0: j * C, z1: j * C + 0.4 },
        { x0: this.cx - 0.12, x1: this.cx + 0.12, z0: (j + 1) * C - 0.4, z1: (j + 1) * C },
      ];
      this.leafBox = { x0: this.cx - 0.06, x1: this.cx + 0.06, z0: j * C + 0.4, z1: (j + 1) * C - 0.4 };
    }
    this.pivot.rotation.y = this.base;
    world.groups[L].add(this.pivot);
  }
  isClosed() { return Math.abs(this.angle) < 1.0; }
  boxes(out) {
    out.push(this.jambs[0], this.jambs[1]);
    if (this.isClosed()) out.push(this.leafBox);
  }
  // true si el jugador está en el vano y no se puede cerrar
  blocksClosing(px, pz) {
    const off = this.axis === 'x' ? Math.abs(pz - this.cz) : Math.abs(px - this.cx);
    const along = this.axis === 'x' ? Math.abs(px - this.cx) : Math.abs(pz - this.cz);
    return off < 0.5 && along < 0.9;
  }
  toggle(px, pz) {
    if (this.open) {
      this.open = false; this.target = 0; this.speed = 3.2;
    } else {
      this.open = true; this.speed = 2.4;
      const side = this.axis === 'x' ? (pz < this.cz ? -1 : 1) : (px < this.cx ? 1 : -1);
      this.target = side * Math.PI * 0.5;
    }
  }
  slam() { this.open = false; this.target = 0; this.speed = 16; }
  update(dt) {
    const k = 1 - Math.exp(-dt * this.speed);
    this.angle += (this.target - this.angle) * k;
    this.pivot.rotation.y = this.base + this.angle;
  }
}

export class World {
  constructor(scene, mansion) {
    this.scene = scene;
    this.m = mansion;
    this.rand = TX.rng(1337);
    this.groups = [];
    this.entries = [];
    for (let L = 0; L < LEVELS; L++) {
      const g = new THREE.Group();
      g.name = 'planta' + L;
      scene.add(g);
      this.groups.push(g);
      this.entries.push(new Map());
    }
    this.lightSources = [];
    this.flames = [];
    this.lamps = [];
    this.rockers = [];
    this.dolls = [];
    this.pendulums = [];
    this.doors = [];
    this.fireplaces = [];
    this.clocks = [];
    this.pianos = [];
    this.decalIndex = 0;
    this.lightning = 0;
    this._v = new THREE.Vector3();

    this.cuadros = [];
    this.cuadrosTetricos = false;
    this.cordura = 1;                 // 0-1, la pone main.js; influye en los cuadros
    this._frustum = new THREE.Frustum();
    this._pm = new THREE.Matrix4();
    this.reservadas = this.carasReservadas();

    this.makeMaterials();
    for (let L = 0; L < LEVELS; L++) this.buildShell(L);
    this.buildStairs();
    for (let L = 0; L < LEVELS; L++) this.buildDecor(L);
    this.buildRugs();
    this.buildCuadros();
    this.flush();
    this.makeLightPool();
  }

  // ------------------------------------------------------------ materiales
  makeMaterials() {
    const T = (id) => TX.textura(id);
    const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.92, metalness: 0 }, o));
    const bump = (tex, s, extra = {}) => std(Object.assign({ map: tex, bumpMap: tex, bumpScale: s }, extra));
    const M = (this.mats = {});
    M.wall = [
      bump(T('pared-sotano'), 3),
      bump(T('pared-principal'), 1.5),
      bump(T('pared-segunda'), 1.5),
      bump(T('pared-buhardilla'), 2.5),
    ];
    M.floor = [
      bump(T('suelo-sotano'), 3),
      bump(T('suelo-principal'), 2),
      bump(T('suelo-segunda'), 2),
      bump(T('suelo-buhardilla'), 2.5),
    ];
    M.ceil = [
      std({ map: T('techo-sotano') }),
      std({ map: T('techo-principal') }),
      std({ map: T('techo-segunda') }),
      std({ map: T('techo-buhardilla') }),
    ];
    for (const m of [...M.floor, ...M.ceil]) m.userData.noCast = true;
    M.shelf = bump(T('estanteria'), 2);
    M.wine = bump(T('botellero'), 2);
    M.fireplace = bump(T('chimenea'), 2);
    M.frontdoor = bump(T('puerta-principal'), 2);
    M.window = std({
      map: T('ventana'),
      emissiveMap: T('ventana-brillo'),
      emissive: 0xffffff, emissiveIntensity: 0.4, roughness: 0.4,
    });
    M.trim = std({ map: T('madera-oscura') });
    M.wood = std({ map: T('madera') });
    M.woodLight = std({ map: T('madera-clara') });
    M.sheet = std({ map: T('sabana'), roughness: 1 });
    M.velvet = std({ map: T('terciopelo') });
    M.carpet = std({ map: T('moqueta-escalera') });
    M.brass = std({ color: 0x8a6a30, metalness: 0.75, roughness: 0.45 });
    M.iron = std({ color: 0x1c1b1a, metalness: 0.6, roughness: 0.6 });
    M.wax = std({ color: 0xe8dcc0, emissive: 0x3a1a04, emissiveIntensity: 1 });
    M.lampGlass = std({ color: 0xffd8a0, emissive: 0xffa040, emissiveIntensity: 2.2, roughness: 0.3 });
    M.enamel = std({ color: 0xcfc8b8, roughness: 0.35 });
    M.crate = std({ map: T('caja') });
    M.stone = std({ map: T('piedra') });
    M.porcelain = std({ color: 0xe6ddd0, roughness: 0.4 });
    M.black = std({ color: 0x050505, roughness: 0.3 });
    M.keys = std({ color: 0xd8d0c0, roughness: 0.4 });
    M.clockFace = std({ map: T('esfera-reloj'), emissive: 0x100c06 });
    M.water = std({ color: 0x1a0504, roughness: 0.05, metalness: 0.4 });
    M.rug = std({ map: T('alfombra'), roughness: 1 });
    M.rug.userData.noCast = true;
    M.door = std({ map: T('hoja-puerta') });
    M.portrait = std({ map: T('retratos'), roughness: 0.6 });

    const flameTex = T('llama');
    const glowTex = T('halo');
    M.flame = new THREE.SpriteMaterial({
      map: flameTex, color: 0xffd9a0, blending: THREE.AdditiveBlending,
      depthWrite: false, transparent: true, fog: false,
    });
    M.glow = new THREE.SpriteMaterial({
      map: glowTex, color: 0xffa860, blending: THREE.AdditiveBlending,
      depthWrite: false, transparent: true, fog: false, opacity: 0.55,
    });
  }

  // ------------------------------------------------------------ acumuladores
  entry(L, mat) {
    let e = this.entries[L].get(mat);
    if (!e) { e = { geos: [], batch: new Batch() }; this.entries[L].set(mat, e); }
    return e;
  }
  addGeo(L, mat, geo) { this.entry(L, mat).geos.push(geo); }
  part(L, mat, geo, lx, ly, lz, F) {
    geo.translate(lx, ly, lz);
    if (F.ry) geo.rotateY(F.ry);
    geo.translate(F.x, F.y, F.z);
    this.addGeo(L, mat, geo);
    return geo;
  }

  flush() {
    for (let L = 0; L < LEVELS; L++) {
      for (const [mat, e] of this.entries[L]) {
        const list = e.geos.slice();
        if (e.batch.count) list.push(e.batch.geometry());
        if (!list.length) continue;
        const merged = mergeGeometries(list, false);
        list.forEach((g) => g.dispose());
        const mesh = new THREE.Mesh(merged, mat);
        mesh.castShadow = !mat.userData.noCast;
        mesh.receiveShadow = true;
        mesh.matrixAutoUpdate = false;
        mesh.updateMatrix();
        this.groups[L].add(mesh);
      }
    }
    this.entries = null;
  }

  // ------------------------------------------------------------ utilidades
  wallDirs(L, i, j) {
    return DIRS.filter(([dx, dz]) => WALL_CHARS.has(this.m.get(L, i + dx, j + dz)));
  }
  pickWall(L, i, j) {
    const w = this.wallDirs(L, i, j);
    if (!w.length) return null;
    return w[Math.floor(this.rand() * w.length)];
  }
  block(L, i, j, x, z, hw, hd) {
    this.m.addBlocker(L, i, j, { x0: x - hw, x1: x + hw, z0: z - hd, z1: z + hd });
  }
  // escala: multiplicador sobre la intensidad de su tipo en LUZ.fuentes (1 = normal)
  addLight(L, pos, color, escala, kind, obj = null) {
    this.lightSources.push({
      L, pos: pos.clone(), color: new THREE.Color(color), escala, kind,
      seed: this.rand() * 100, obj, dim: 1,
    });
  }
  addFlame(L, x, y, z, sx, sy, kind = 'candle', parent = null) {
    const s = new THREE.Sprite(this.mats.flame);
    s.position.set(x, y, z);
    s.scale.set(sx, sy, 1);
    (parent || this.groups[L]).add(s);
    this.flames.push({ s, sx, sy, seed: this.rand() * 100, kind, L, x, y, z });
    return s;
  }
  addGlow(L, x, y, z, size, parent = null, opacity = 0.55) {
    const s = new THREE.Sprite(this.mats.glow.clone());
    s.material.opacity = opacity;
    s.position.set(x, y, z);
    s.scale.set(size, size, 1);
    (parent || this.groups[L]).add(s);
    return s;
  }

  // ------------------------------------------------------------ estructura
  buildShell(L) {
    const M = this.mats;
    const y0 = L * H, y1 = y0 + H;
    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < COLS; i++) {
        const ch = this.m.get(L, i, j);
        if (WALL_CHARS.has(ch)) {
          for (const [dx, dz] of DIRS) {
            const ni = i + dx, nj = j + dz;
            if (ni < 0 || nj < 0 || ni >= COLS || nj >= ROWS) continue;
            if (this.m.isWall(L, ni, nj)) continue;
            const cx = (i + 0.5) * C + dx * C * 0.5;
            const cz = (j + 0.5) * C + dz * C * 0.5;
            const rx = dz, rz = -dx, h = C * 0.5;
            const a = [cx - rx * h, y0, cz - rz * h];
            const b = [cx + rx * h, y0, cz + rz * h];
            const c = [cx + rx * h, y1, cz + rz * h];
            const d = [cx - rx * h, y1, cz - rz * h];
            let mat = M.wall[L];
            if (ch === 'k') mat = L === 0 ? M.wine : M.shelf;
            else if (ch === 'F') mat = M.fireplace;
            else if (ch === 'E') mat = M.frontdoor;
            else if (ch === 'w') mat = M.window;
            const variant = ((i * 7 + j * 13 + (dx + 2) * 3 + (dz + 2) * 5) & 1) * 0.5;
            this.entry(L, mat).batch.quad(a, b, c, d, [dx, 0, dz], variant, 0, variant + 0.5, 1);

            const nch = this.m.get(L, ni, nj);
            if (ch === 'F') this.buildFireplace(L, cx, cz, dx, dz, rx, rz);
            if (ch === 'w') {
              this.addLight(L, new THREE.Vector3(cx + dx * 0.8, y0 + 1.7, cz + dz * 0.8), 0x5a78c0, 1, 'moon');
            }
            if (ch === '#' && (L === 1 || L === 2) && nch === '.' && this.rand() < 0.1
                && !this.reservadas.has(`${L}:${i},${j}:${dx},${dz}`)) {
              this.addPortrait(L, cx + dx * 0.02, y0 + 1.75, cz + dz * 0.02, dx, dz);
            }
          }
          continue;
        }
        const x0 = i * C, x1 = x0 + C, z0 = j * C, z1 = z0 + C;
        if (ch !== '_' && !this.m.isStair(ch)) {
          this.entry(L, M.floor[L]).batch.quad([x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0], [0, 1, 0], 0, 0, 1, 1);
        }
        if (this.m.get(L + 1, i, j) !== '_') {
          this.entry(L, M.ceil[L]).batch.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, -1, 0], 0, 0, 1, 1);
          // vigas en sótano y buhardilla
          if ((L === 0 || L === 3) && j % 2 === 0 && ch !== '_') {
            this.part(L, M.trim, new THREE.BoxGeometry(C, 0.24, 0.26), 0, 0, 0, { x: (i + 0.5) * C, y: y1 - 0.16, z: (j + 0.5) * C });
          }
        }
        if (ch === 'D') this.buildDoor(L, i, j);
      }
    }
  }

  buildDoor(L, i, j) {
    const axis = this.m.isWall(L, i - 1, j) && this.m.isWall(L, i + 1, j) ? 'x' : 'z';
    const door = new Door(this, L, i, j, axis);
    this.m.doors.set(this.m.key(L, i, j), door);
    this.doors.push(door);
    const y0 = L * H, cx = door.cx, cz = door.cz, M = this.mats;
    const lintelH = H - 2.4;
    if (axis === 'x') {
      this.part(L, M.trim, new THREE.BoxGeometry(0.4, H, 0.26), 0, 0, 0, { x: i * C + 0.2, y: y0 + H / 2, z: cz });
      this.part(L, M.trim, new THREE.BoxGeometry(0.4, H, 0.26), 0, 0, 0, { x: (i + 1) * C - 0.2, y: y0 + H / 2, z: cz });
      this.part(L, M.trim, new THREE.BoxGeometry(1.2, lintelH, 0.26), 0, 0, 0, { x: cx, y: y0 + 2.4 + lintelH / 2, z: cz });
    } else {
      this.part(L, M.trim, new THREE.BoxGeometry(0.26, H, 0.4), 0, 0, 0, { x: cx, y: y0 + H / 2, z: j * C + 0.2 });
      this.part(L, M.trim, new THREE.BoxGeometry(0.26, H, 0.4), 0, 0, 0, { x: cx, y: y0 + H / 2, z: (j + 1) * C - 0.2 });
      this.part(L, M.trim, new THREE.BoxGeometry(0.26, lintelH, 1.2), 0, 0, 0, { x: cx, y: y0 + 2.4 + lintelH / 2, z: cz });
    }
  }

  buildFireplace(L, cx, cz, dx, dz, rx, rz) {
    const M = this.mats, y0 = L * H;
    const F = { x: cx, y: y0, z: cz, ry: Math.atan2(dx, dz) };
    // local: +z hacia la habitación, +x a lo largo del muro
    this.part(L, M.stone, new THREE.BoxGeometry(1.9, 0.08, 0.7), 0, 0.04, 0.35, F);
    for (const o of [-0.15, 0.12]) {
      const log = new THREE.CylinderGeometry(0.07, 0.08, 0.65, 7);
      log.rotateZ(Math.PI / 2);
      this.part(L, M.trim, log, o * 0.5, 0.14 + (o > 0 ? 0.08 : 0), 0.18 + o * 0.2, F);
    }
    this.part(L, M.iron, new THREE.BoxGeometry(0.05, 0.25, 0.3), -0.38, 0.12, 0.2, F);
    this.part(L, M.iron, new THREE.BoxGeometry(0.05, 0.25, 0.3), 0.38, 0.12, 0.2, F);
    const px = cx + dx * 0.22, pz = cz + dz * 0.22;
    this.addFlame(L, px, y0 + 0.42, pz, 0.42, 0.75, 'fire');
    this.addFlame(L, px + rx * 0.2, y0 + 0.36, pz + rz * 0.2, 0.3, 0.55, 'fire');
    this.addFlame(L, px - rx * 0.22, y0 + 0.34, pz - rz * 0.22, 0.28, 0.5, 'fire');
    this.addGlow(L, cx + dx * 0.3, y0 + 0.5, cz + dz * 0.3, 2.2, null, 0.5);
    const pos = new THREE.Vector3(cx + dx * 0.7, y0 + 0.7, cz + dz * 0.7);
    this.addLight(L, pos, 0xff7028, 1, 'fire');
    this.fireplaces.push({ L, pos });
  }

  addPortrait(L, x, y, z, dx, dz) {
    const v = Math.floor(this.rand() * 4);
    const g = new THREE.PlaneGeometry(0.64, 0.8);
    const uv = g.attributes.uv;
    for (let k = 0; k < uv.count; k++) uv.setX(k, (v + uv.getX(k)) / 4);
    g.rotateZ((this.rand() - 0.5) * 0.06);
    g.rotateY(Math.atan2(dx, dz));
    g.translate(x, y, z);
    this.addGeo(L, this.mats.portrait, g);
  }

  // Caras de muro ocupadas por cuadros de assets/cuadros.js (para no poner encima un retrato al azar)
  carasReservadas() {
    const set = new Set();
    for (const q of CUADROS) {
      for (const s of q.sitios) {
        const [dx, dz] = DIRECCIONES[s.pared];
        set.add(`${s.planta}:${s.col + dx},${s.fila + dz}:${-dx},${-dz}`);
      }
    }
    return set;
  }

  // Cuadros hechos fuera: una malla por sitio, con su textura normal y la tétrica
  buildCuadros() {
    for (const q of CUADROS) {
      const normal = TX.textura(q.normal);
      const tetrica = TX.textura(q.tetrica);
      const ancho = q.alto * (normal.image.width / normal.image.height);
      for (const s of q.sitios) {
        const [dx, dz] = DIRECCIONES[s.pared];
        const mat = new THREE.MeshStandardMaterial({ map: normal, color: 0xc4c4c4, roughness: 0.8 });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(ancho, q.alto), mat);
        const x = (s.col + 0.5) * C + dx * (C / 2 - 0.02);
        const z = (s.fila + 0.5) * C + dz * (C / 2 - 0.02);
        mesh.position.set(x, s.planta * H + 1.7, z);
        mesh.rotation.y = Math.atan2(-dx, -dz);
        mesh.receiveShadow = true;
        this.groups[s.planta].add(mesh);
        const pos = mesh.position.clone();
        this.cuadros.push({
          id: q.id, L: s.planta, mesh, normal, tetrica,
          esfera: new THREE.Sphere(pos, Math.hypot(ancho, q.alto) / 2),
          delante: pos.clone().add(new THREE.Vector3(-dx * 0.15, 0, -dz * 0.15)),   // punto para la línea de visión
          visto: false, tetricoBase: false, tetricoAhora: false,
        });
      }
    }
  }

  texturasCuadros() {
    return this.cuadros.flatMap((q) => [q.normal, q.tetrica]);
  }

  // Un cuadro solo cambia de versión mientras NO lo ves (fuera de pantalla o tapado).
  // Al dejar de verlo se decide cómo estará la próxima vez: tétrico con cierta probabilidad
  // (más cuanto menos cordura), o siempre tras el evento. Los relámpagos lo muestran tétrico
  // durante el destello. Reglas en assets/cuadros.js.
  actualizarCuadros(player) {
    const cam = player.camera;
    this._frustum.setFromProjectionMatrix(this._pm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    for (const q of this.cuadros) {
      const visible = q.L === player.L && this._frustum.intersectsSphere(q.esfera)
        && this.m.los(cam.position, q.delante);
      if (!visible && q.visto) {
        const p = REGLAS.probabilidad + REGLAS.probabilidadPorLocura * (1 - this.cordura);
        q.tetricoBase = this.cuadrosTetricos || Math.random() < p;
      }
      if (!visible && this.cuadrosTetricos) q.tetricoBase = true;
      q.visto = visible;
      const tetrico = q.tetricoBase || (REGLAS.relampagos && this.lightning > 0.3);
      if (tetrico !== q.tetricoAhora) {
        q.tetricoAhora = tetrico;
        q.mesh.material.map = tetrico ? q.tetrica : q.normal;
      }
    }
  }

  buildStairs() {
    const M = this.mats;
    for (const st of this.m.stairs) {
      const L = st.L;
      const mat = L === 1 ? M.carpet : M.wood;
      const steps = st.n * 4;
      const d = st.len / steps, rise = H / steps;
      const [ci, cj] = st.cells[0];
      const cross = st.dx !== 0 ? (cj + 0.5) * C : (ci + 0.5) * C;
      for (let k = 0; k < steps; k++) {
        const hgt = (k + 1) * rise;
        const a = st.a0 + (k + 0.5) * d;
        const F = { x: 0, y: L * H + hgt / 2, z: 0 };
        let geo;
        if (st.dx !== 0) { F.x = a * st.dx; F.z = cross; geo = new THREE.BoxGeometry(d, hgt, C); }
        else { F.z = a * st.dz; F.x = cross; geo = new THREE.BoxGeometry(C, hgt, d); }
        this.part(L, mat, geo, 0, 0, 0, F);
        // mamperlán
        const F2 = { x: F.x, y: L * H + hgt - 0.02, z: F.z };
        const nose = st.dx !== 0 ? new THREE.BoxGeometry(0.05, 0.05, C) : new THREE.BoxGeometry(C, 0.05, 0.05);
        const off = (d / 2) * -1;
        if (st.dx !== 0) F2.x += off * st.dx; else F2.z += off * st.dz;
        this.part(L, M.trim, nose, 0, 0, 0, F2);
      }
    }
  }

  buildRugs() {
    for (const [L, i0, j0, i1, j1] of RUGS) {
      const w = (i1 - i0 + 1) * C - 0.6, d = (j1 - j0 + 1) * C - 0.6;
      const g = new THREE.PlaneGeometry(w, d);
      g.rotateX(-Math.PI / 2);
      g.translate(((i0 + i1 + 1) / 2) * C, L * H + 0.01, ((j0 + j1 + 1) / 2) * C);
      this.addGeo(L, this.mats.rug, g);
    }
  }

  // ------------------------------------------------------------ decoración
  buildDecor(L) {
    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < COLS; i++) {
        const ch = this.m.get(L, i, j);
        const F = { x: (i + 0.5) * C, y: L * H, z: (j + 0.5) * C, ry: 0 };
        switch (ch) {
          case 't': this.table(L, i, j, F); break;
          case 'C': this.chair(L, i, j, F); break;
          case 'a': this.armchair(L, i, j, F); break;
          case 'c': this.candelabra(L, i, j, F); break;
          case 'l': this.lamp(L, i, j, F); break;
          case 'b': this.bed(L, i, j, F); break;
          case 'p': this.piano(L, i, j, F); break;
          case 'n': this.clock(L, i, j, F); break;
          case 'x': this.crates(L, i, j, F); break;
          case 'r': this.barrels(L, i, j, F); break;
          case 'o': this.coffin(L, i, j, F); break;
          case 'm': this.figure(L, i, j, F); break;
          case 'h': this.rocker(L, i, j, F); break;
          case 'd': this.doll(L, i, j, F); break;
          case 'T': this.bathtub(L, i, j, F); break;
          case '!': this.decal(L, i, j); break;
        }
      }
    }
  }

  table(L, i, j, F) {
    const M = this.mats, g = (a, b) => this.m.get(L, a, b) === 't';
    const wl = g(i - 1, j), wr = g(i + 1, j), wu = g(i, j - 1), wd = g(i, j + 1);
    const long = wl || wr || wu || wd;
    let sx = 1.7, sz = 1.1;
    if (wl || wr) sx = C; if (wu || wd) sz = C;
    if (long && !(wl || wr)) sx = 1.2;
    if (long && !(wu || wd)) sz = 1.2;
    let ox = 0, oz = 0;
    if (long) {
      if ((wl || wr) && !(wl && wr)) { sx = C - 0.15; ox = wl ? -0.075 : 0.075; }
      if ((wu || wd) && !(wu && wd)) { sz = C - 0.15; oz = wu ? -0.075 : 0.075; }
    }
    this.part(L, M.wood, new THREE.BoxGeometry(sx, 0.07, sz), ox, 0.78, oz, F);
    for (const lx of [-1, 1]) for (const lz of [-1, 1]) {
      if ((lx < 0 && wl) || (lx > 0 && wr) || (lz < 0 && wu) || (lz > 0 && wd)) continue;
      this.part(L, M.wood, new THREE.BoxGeometry(0.07, 0.75, 0.07), ox + lx * (sx / 2 - 0.1), 0.375, oz + lz * (sz / 2 - 0.1), F);
    }
    if (long) {
      // mantel y vajilla
      this.part(L, M.sheet, new THREE.BoxGeometry(sx + 0.02, 0.02, sz + 0.16), ox, 0.825, oz, F);
      if (wl || wr) {
        this.part(L, M.sheet, new THREE.BoxGeometry(sx, 0.38, 0.02), ox, 0.64, sz / 2 + 0.08, F);
        this.part(L, M.sheet, new THREE.BoxGeometry(sx, 0.38, 0.02), ox, 0.64, -sz / 2 - 0.08, F);
      }
      for (const px of [-0.45, 0.45]) for (const pz of [-0.32, 0.32]) {
        this.part(L, M.porcelain, new THREE.CylinderGeometry(0.12, 0.1, 0.02, 10), px, 0.845, pz, F);
      }
      if (this.rand() < 0.6) {
        this.part(L, M.brass, new THREE.CylinderGeometry(0.03, 0.06, 0.28, 8), 0, 0.97, 0, F);
        this.part(L, M.wax, new THREE.CylinderGeometry(0.02, 0.02, 0.12, 6), 0, 1.17, 0, F);
      }
    } else {
      // escritorio / mesa de cocina con objetos
      for (let k = 0; k < 3; k++) {
        const bw = 0.2 + this.rand() * 0.1;
        const geo = new THREE.BoxGeometry(bw, 0.05, 0.28);
        geo.rotateY(this.rand() * 0.6);
        this.part(L, k % 2 ? M.velvet : M.wood, geo, -0.5, 0.84 + k * 0.05, -0.1, F);
      }
      this.part(L, M.sheet, new THREE.BoxGeometry(0.3, 0.005, 0.4), 0.2, 0.818, 0.1, F);
      this.part(L, M.brass, new THREE.CylinderGeometry(0.05, 0.06, 0.03, 8), 0.5, 0.83, -0.2, F);
      this.part(L, M.wax, new THREE.CylinderGeometry(0.02, 0.022, 0.08, 6), 0.5, 0.88, -0.2, F);
    }
    this.block(L, i, j, F.x + ox, F.z + oz, sx / 2 + 0.05, sz / 2 + 0.05);
  }

  chair(L, i, j, F) {
    const M = this.mats;
    let dir = DIRS.find(([dx, dz]) => this.m.get(L, i + dx, j + dz) === 't');
    if (dir) {
      F.ry = Math.atan2(dir[0], dir[1]);
      F.x += dir[0] * 0.25; F.z += dir[1] * 0.25;
    } else {
      F.ry = this.rand() * Math.PI * 2;
    }
    this.part(L, M.wood, new THREE.BoxGeometry(0.46, 0.05, 0.46), 0, 0.46, 0, F);
    this.part(L, M.velvet, new THREE.BoxGeometry(0.42, 0.04, 0.42), 0, 0.5, 0, F);
    for (const lx of [-0.2, 0.2]) for (const lz of [-0.2, 0.2]) {
      this.part(L, M.wood, new THREE.BoxGeometry(0.04, 0.46, 0.04), lx, 0.23, lz, F);
    }
    for (const lx of [-0.2, 0.2]) this.part(L, M.wood, new THREE.BoxGeometry(0.04, 0.62, 0.04), lx, 0.8, -0.21, F);
    this.part(L, M.wood, new THREE.BoxGeometry(0.44, 0.3, 0.03), 0, 0.9, -0.21, F);
    this.block(L, i, j, F.x, F.z, 0.27, 0.27);
  }

  armchair(L, i, j, F) {
    const M = this.mats;
    let dir = null;
    for (const [dx, dz] of DIRS) {
      for (let s = 1; s <= 4; s++) {
        const ch = this.m.get(L, i + dx * s, j + dz * s);
        if (ch === 'F') { dir = [dx, dz]; break; }
        if (WALL_CHARS.has(ch)) break;
      }
      if (dir) break;
    }
    if (dir) F.ry = Math.atan2(dir[0], dir[1]);
    else {
      const w = this.pickWall(L, i, j);
      F.ry = w ? Math.atan2(-w[0], -w[1]) : this.rand() * 6.28;
    }
    F.ry += (this.rand() - 0.5) * 0.3;
    this.part(L, M.sheet, new THREE.BoxGeometry(0.95, 0.45, 0.9), 0, 0.225, 0, F);
    const back = new THREE.BoxGeometry(0.95, 0.8, 0.25);
    back.rotateX(-0.12);
    this.part(L, M.sheet, back, 0, 0.8, -0.36, F);
    this.part(L, M.sheet, new THREE.BoxGeometry(0.2, 0.3, 0.85), -0.42, 0.6, 0.02, F);
    this.part(L, M.sheet, new THREE.BoxGeometry(0.2, 0.3, 0.85), 0.42, 0.6, 0.02, F);
    this.part(L, M.sheet, new THREE.BoxGeometry(1.08, 0.04, 1.02), 0, 0.02, 0, F);
    const lump = new THREE.SphereGeometry(0.2, 8, 6);
    lump.scale(1.2, 0.6, 1);
    this.part(L, M.sheet, lump, 0.1, 0.5, 0.05, F);
    this.block(L, i, j, F.x, F.z, 0.5, 0.5);
  }

  candelabra(L, i, j, F) {
    const M = this.mats, y0 = L * H;
    if (L === 1 || L === 2) {
      this.part(L, M.wood, new THREE.CylinderGeometry(0.36, 0.36, 0.04, 14), 0, 0.74, 0, F);
      this.part(L, M.wood, new THREE.CylinderGeometry(0.05, 0.07, 0.72, 8), 0, 0.36, 0, F);
      this.part(L, M.wood, new THREE.CylinderGeometry(0.22, 0.26, 0.05, 10), 0, 0.025, 0, F);
      this.part(L, M.brass, new THREE.CylinderGeometry(0.07, 0.1, 0.03, 10), 0, 0.775, 0, F);
      this.part(L, M.brass, new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6), 0, 0.93, 0, F);
      const ry = this.rand() * Math.PI;
      const arm = new THREE.BoxGeometry(0.36, 0.02, 0.02);
      arm.rotateY(ry);
      this.part(L, M.brass, arm, 0, 1.06, 0, F);
      const ax = Math.cos(ry) * 0.17, az = -Math.sin(ry) * 0.17;
      for (const [px, pz, h] of [[ax, az, 0], [-ax, -az, 0], [0, 0, 0.05]]) {
        this.part(L, M.brass, new THREE.CylinderGeometry(0.03, 0.02, 0.03, 8), px, 1.08 + h, pz, F);
        this.part(L, M.wax, new THREE.CylinderGeometry(0.018, 0.018, 0.14, 6), px, 1.16 + h, pz, F);
        this.addFlame(L, F.x + px, y0 + 1.27 + h, F.z + pz, 0.05, 0.1);
      }
      this.addGlow(L, F.x, y0 + 1.28, F.z, 0.7, null, 0.4);
      this.addLight(L, new THREE.Vector3(F.x, y0 + 1.4, F.z), 0xff9a40, 1, 'candle');
    } else {
      this.part(L, M.crate, new THREE.BoxGeometry(0.6, 0.6, 0.6), 0, 0.3, 0, F);
      this.part(L, M.wax, new THREE.CylinderGeometry(0.03, 0.035, 0.2, 7), 0.08, 0.7, 0.05, F);
      this.part(L, M.wax, new THREE.CylinderGeometry(0.08, 0.09, 0.01, 9), 0.08, 0.605, 0.05, F);
      this.part(L, M.wax, new THREE.CylinderGeometry(0.022, 0.025, 0.1, 6), -0.12, 0.65, -0.1, F);
      this.addFlame(L, F.x + 0.08, y0 + 0.84, F.z + 0.05, 0.06, 0.12);
      this.addGlow(L, F.x + 0.08, y0 + 0.85, F.z + 0.05, 0.6, null, 0.4);
      this.addLight(L, new THREE.Vector3(F.x + 0.08, y0 + 1.0, F.z + 0.05), 0xff9040, 0.8, 'candle');
    }
    this.block(L, i, j, F.x, F.z, 0.38, 0.38);
  }

  lamp(L, i, j, F) {
    const M = this.mats;
    const g = new THREE.Group();
    g.position.set(F.x, L * H + H, F.z);
    const add = (geo, mat, y) => {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = y;
      mesh.castShadow = mat !== M.lampGlass;
      g.add(mesh);
      return mesh;
    };
    add(new THREE.CylinderGeometry(0.008, 0.008, 0.62, 4), M.iron, -0.31);
    add(new THREE.CylinderGeometry(0.05, 0.12, 0.07, 10), M.brass, -0.65);
    add(new THREE.CylinderGeometry(0.085, 0.07, 0.2, 10), M.lampGlass, -0.78);
    add(new THREE.CylinderGeometry(0.12, 0.05, 0.06, 10), M.brass, -0.91);
    for (const s of [-1, 1]) {
      const bar = add(new THREE.BoxGeometry(0.01, 0.24, 0.01), M.iron, -0.78);
      bar.position.x = s * 0.1;
    }
    this.addFlame(L, 0, -0.78, 0, 0.05, 0.1, 'lamp', g);
    this.addGlow(L, 0, -0.78, 0, 0.7, g, 0.35);
    const anchor = new THREE.Object3D();
    anchor.position.y = -0.85;
    g.add(anchor);
    this.groups[L].add(g);
    this.lamps.push({ g, seed: this.rand() * 10, amp: 0.02 + this.rand() * 0.03 });
    this.addLight(L, new THREE.Vector3(), 0xff9a3c, 1, 'lamp', anchor);
  }

  bed(L, i, j, F) {
    const M = this.mats;
    const w = this.pickWall(L, i, j) || [0, -1];
    F.ry = Math.atan2(-w[0], -w[1]);
    const small = L === 3;
    const bw = small ? 1.0 : 1.4, bl = small ? 1.6 : 1.95;
    F.x += w[0] * (C / 2 - bl / 2 - 0.02); F.z += w[1] * (C / 2 - bl / 2 - 0.02);
    this.part(L, M.wood, new THREE.BoxGeometry(bw, 0.3, bl), 0, 0.28, 0, F);
    this.part(L, M.sheet, new THREE.BoxGeometry(bw - 0.08, 0.2, bl - 0.12), 0, 0.53, 0.04, F);
    this.part(L, M.sheet, new THREE.BoxGeometry(bw * 0.7, 0.1, 0.32), 0, 0.68, -bl / 2 + 0.28, F);
    this.part(L, M.wood, new THREE.BoxGeometry(bw + 0.1, 1.1, 0.07), 0, 0.55, -bl / 2 + 0.035, F);
    this.part(L, M.wood, new THREE.BoxGeometry(bw + 0.1, 0.6, 0.06), 0, 0.3, bl / 2 - 0.03, F);
    for (const px of [-1, 1]) for (const pz of [-1, 1]) {
      this.part(L, M.wood, new THREE.CylinderGeometry(0.04, 0.045, small ? 1.1 : 1.7, 6), px * (bw / 2 + 0.02), small ? 0.55 : 0.85, pz * (bl / 2 - 0.04), F);
    }
    // ... y algo tumbado bajo la sábana
    if (this.rand() < 0.6) {
      const body = new THREE.SphereGeometry(0.3, 10, 6);
      body.scale(0.7, 0.35, 2.0);
      this.part(L, M.sheet, body, 0, 0.66, 0.15, F);
      this.part(L, M.sheet, new THREE.SphereGeometry(0.13, 8, 6), 0, 0.72, -bl / 2 + 0.42, F);
    }
    const hw = Math.abs(w[0]) ? bl / 2 : bw / 2 + 0.05;
    const hd = Math.abs(w[0]) ? bw / 2 + 0.05 : bl / 2;
    this.block(L, i, j, F.x, F.z, hw, hd);
  }

  piano(L, i, j, F) {
    const M = this.mats;
    const w = this.pickWall(L, i, j) || [0, -1];
    F.ry = Math.atan2(-w[0], -w[1]);
    F.x += w[0] * (C / 2 - 0.36); F.z += w[1] * (C / 2 - 0.36);
    this.part(L, M.trim, new THREE.BoxGeometry(1.5, 1.25, 0.55), 0, 0.625, 0, F);
    this.part(L, M.trim, new THREE.BoxGeometry(1.52, 0.04, 0.6), 0, 1.27, 0, F);
    this.part(L, M.trim, new THREE.BoxGeometry(1.46, 0.08, 0.3), 0, 0.74, 0.4, F);
    this.part(L, M.keys, new THREE.BoxGeometry(1.36, 0.02, 0.16), 0, 0.79, 0.46, F);
    for (let k = 0; k < 20; k++) {
      if (k % 7 === 2 || k % 7 === 6) continue;
      this.part(L, M.black, new THREE.BoxGeometry(0.025, 0.02, 0.09), -0.64 + k * 0.066, 0.805, 0.42, F);
    }
    this.part(L, M.trim, new THREE.BoxGeometry(0.08, 0.7, 0.08), -0.68, 0.35, 0.48, F);
    this.part(L, M.trim, new THREE.BoxGeometry(0.08, 0.7, 0.08), 0.68, 0.35, 0.48, F);
    this.part(L, M.sheet, new THREE.BoxGeometry(0.9, 0.02, 0.64), 0.3, 1.3, 0, F);
    this.part(L, M.sheet, new THREE.BoxGeometry(0.9, 0.5, 0.02), 0.3, 1.06, 0.31, F);
    const hw = Math.abs(w[0]) ? 0.45 : 0.8, hd = Math.abs(w[0]) ? 0.8 : 0.45;
    this.block(L, i, j, F.x, F.z, hw, hd);
    this.pianos.push({ L, pos: new THREE.Vector3(F.x, L * H + 1, F.z) });
  }

  clock(L, i, j, F) {
    const M = this.mats;
    const w = this.pickWall(L, i, j) || [0, -1];
    F.ry = Math.atan2(-w[0], -w[1]);
    F.x += w[0] * (C / 2 - 0.24); F.z += w[1] * (C / 2 - 0.24);
    this.part(L, M.trim, new THREE.BoxGeometry(0.6, 0.3, 0.45), 0, 0.15, 0, F);
    this.part(L, M.trim, new THREE.BoxGeometry(0.5, 1.5, 0.38), 0, 1.05, 0, F);
    this.part(L, M.trim, new THREE.BoxGeometry(0.6, 0.46, 0.45), 0, 2.03, 0, F);
    this.part(L, M.trim, new THREE.BoxGeometry(0.66, 0.08, 0.5), 0, 2.3, 0, F);
    this.part(L, M.clockFace, new THREE.BoxGeometry(0.36, 0.36, 0.02), 0, 2.03, 0.23, F);
    this.part(L, M.black, new THREE.BoxGeometry(0.3, 0.95, 0.02), 0, 1.15, 0.2, F);
    // péndulo
    const pend = new THREE.Group();
    const rod = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.62, 0.01), M.brass);
    rod.position.y = -0.31;
    const bobGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.015, 14);
    bobGeo.rotateX(Math.PI / 2);
    const bob = new THREE.Mesh(bobGeo, M.brass);
    bob.position.y = -0.64;
    pend.add(rod, bob);
    const holder = new THREE.Group();
    holder.position.set(F.x, F.y, F.z);
    holder.rotation.y = F.ry;
    pend.position.set(0, 1.58, 0.225);
    holder.add(pend);
    this.groups[L].add(holder);
    this.pendulums.push(pend);
    this.block(L, i, j, F.x, F.z, 0.34, 0.34);
    this.clocks.push({ L, pos: new THREE.Vector3(F.x, L * H + 1.5, F.z) });
  }

  crates(L, i, j, F) {
    const M = this.mats;
    const n = 1 + Math.floor(this.rand() * 3);
    let y = 0, maxHalf = 0.3;
    const bx = (this.rand() - 0.5) * 0.4, bz = (this.rand() - 0.5) * 0.4;
    for (let k = 0; k < n; k++) {
      const s = k === 0 ? 0.7 + this.rand() * 0.3 : 0.45 + this.rand() * 0.25;
      const geo = new THREE.BoxGeometry(s, s, s);
      geo.rotateY((this.rand() - 0.5) * 0.8);
      this.part(L, M.crate, geo, bx + (this.rand() - 0.5) * 0.15, y + s / 2, bz + (this.rand() - 0.5) * 0.15, F);
      y += s;
      if (k === 0) maxHalf = s * 0.62;
    }
    if (L === 3 && this.rand() < 0.4) {
      this.part(L, M.sheet, new THREE.BoxGeometry(1.0, 0.03, 1.0), bx, y + 0.015, bz, F);
    }
    this.block(L, i, j, F.x + bx, F.z + bz, maxHalf, maxHalf);
  }

  barrels(L, i, j, F) {
    const M = this.mats;
    const n = this.rand() < 0.5 ? 1 : 2;
    for (let k = 0; k < n; k++) {
      const ox = n === 1 ? 0 : (k ? 0.38 : -0.38), oz = (this.rand() - 0.5) * 0.3;
      this.part(L, M.woodLight, new THREE.CylinderGeometry(0.32, 0.29, 0.9, 12), ox, 0.45, oz, F);
      this.part(L, M.iron, new THREE.CylinderGeometry(0.325, 0.325, 0.04, 12), ox, 0.18, oz, F);
      this.part(L, M.iron, new THREE.CylinderGeometry(0.325, 0.325, 0.04, 12), ox, 0.72, oz, F);
      this.block(L, i, j, F.x + ox, F.z + oz, 0.33, 0.33);
    }
  }

  coffin(L, i, j, F) {
    const M = this.mats;
    const alongX = this.rand() < 0.5;
    F.ry = alongX ? Math.PI / 2 : 0;
    this.part(L, M.stone, new THREE.BoxGeometry(0.95, 0.35, 2.05), 0, 0.175, 0, F);
    this.part(L, M.trim, new THREE.BoxGeometry(0.72, 0.42, 1.9), 0, 0.56, 0, F);
    const lid = new THREE.BoxGeometry(0.78, 0.06, 1.95);
    lid.rotateY(0.14);
    lid.rotateZ(0.04);
    this.part(L, M.trim, lid, 0.14, 0.8, 0.05, F);
    this.block(L, i, j, F.x, F.z, alongX ? 1.02 : 0.5, alongX ? 0.5 : 1.02);
  }

  figure(L, i, j, F) {
    const M = this.mats;
    F.x += (this.rand() - 0.5) * 0.5; F.z += (this.rand() - 0.5) * 0.5;
    F.ry = this.rand() * 6.28;
    this.part(L, M.sheet, new THREE.CylinderGeometry(0.2, 0.36, 1.3, 10), 0, 0.65, 0, F);
    const sh = new THREE.SphereGeometry(0.26, 10, 8);
    sh.scale(1.15, 0.45, 0.7);
    this.part(L, M.sheet, sh, 0, 1.32, 0, F);
    this.part(L, M.sheet, new THREE.SphereGeometry(0.14, 10, 8), 0, 1.58, 0.02, F);
    this.part(L, M.sheet, new THREE.CylinderGeometry(0.38, 0.44, 0.04, 12), 0, 0.02, 0, F);
    this.block(L, i, j, F.x, F.z, 0.34, 0.34);
  }

  rocker(L, i, j, F) {
    const M = this.mats;
    const g = new THREE.Group();
    const w = this.pickWall(L, i, j);
    g.position.set(F.x, F.y, F.z);
    g.rotation.y = w ? Math.atan2(-w[0], -w[1]) : this.rand() * 6.28;
    const rock = new THREE.Group();
    g.add(rock);
    const add = (geo, mat, x, y, z, rx = 0) => {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.rotation.x = rx;
      mesh.castShadow = true;
      rock.add(mesh);
    };
    for (const s of [-0.22, 0.22]) {
      add(new THREE.BoxGeometry(0.04, 0.05, 0.95), M.wood, s, 0.03, 0);
      add(new THREE.BoxGeometry(0.04, 0.42, 0.04), M.wood, s, 0.25, 0.2);
      add(new THREE.BoxGeometry(0.04, 0.42, 0.04), M.wood, s, 0.25, -0.2);
      add(new THREE.BoxGeometry(0.04, 0.04, 0.5), M.wood, s, 0.66, 0.02);
    }
    add(new THREE.BoxGeometry(0.5, 0.05, 0.5), M.wood, 0, 0.46, 0);
    add(new THREE.BoxGeometry(0.48, 0.8, 0.04), M.wood, 0, 0.88, -0.28, -0.16);
    add(new THREE.BoxGeometry(0.44, 0.1, 0.4), M.sheet, 0, 0.52, 0.02);
    this.groups[L].add(g);
    this.rockers.push({ rock, L, pos: new THREE.Vector3(F.x, F.y, F.z), amp: 0.05, phase: this.rand() * 6 });
    this.block(L, i, j, F.x, F.z, 0.36, 0.36);
  }

  doll(L, i, j, F) {
    const M = this.mats;
    const g = new THREE.Group();
    const w = this.pickWall(L, i, j);
    let x = F.x, z = F.z;
    if (w) { x += w[0] * 0.7; z += w[1] * 0.7; }
    g.position.set(x, F.y, z);
    const add = (geo, mat, px, py, pz) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); g.add(m); return m; };
    add(new THREE.BoxGeometry(0.2, 0.24, 0.14), M.velvet, 0, 0.2, 0);
    add(new THREE.BoxGeometry(0.07, 0.07, 0.22), M.porcelain, -0.06, 0.04, 0.08);
    add(new THREE.BoxGeometry(0.07, 0.07, 0.22), M.porcelain, 0.06, 0.04, 0.08);
    add(new THREE.SphereGeometry(0.11, 10, 8), M.porcelain, 0, 0.42, 0);
    const hair = add(new THREE.SphereGeometry(0.118, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), M.black, 0, 0.43, -0.01);
    hair.rotation.x = -0.4;
    add(new THREE.BoxGeometry(0.03, 0.03, 0.01), M.black, -0.04, 0.43, 0.105);
    add(new THREE.BoxGeometry(0.03, 0.03, 0.01), M.black, 0.04, 0.43, 0.105);
    add(new THREE.BoxGeometry(0.04, 0.012, 0.01), M.black, 0, 0.37, 0.105);
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    g.rotation.y = this.rand() * 6.28;
    this.groups[L].add(g);
    this.dolls.push({ g, L });
  }

  bathtub(L, i, j, F) {
    const M = this.mats;
    const w = this.pickWall(L, i, j) || [0, -1];
    F.ry = Math.atan2(-w[0], -w[1]) + Math.PI / 2;
    F.x += w[0] * (C / 2 - 0.45); F.z += w[1] * (C / 2 - 0.45);
    this.part(L, M.enamel, new THREE.BoxGeometry(1.7, 0.55, 0.8), 0, 0.37, 0, F);
    this.part(L, M.water, new THREE.BoxGeometry(1.55, 0.02, 0.66), 0, 0.6, 0, F);
    for (const px of [-0.72, 0.72]) for (const pz of [-0.3, 0.3]) {
      this.part(L, M.brass, new THREE.SphereGeometry(0.06, 6, 5), px, 0.06, pz, F);
    }
    const hw = Math.abs(w[0]) ? 0.42 : 0.87, hd = Math.abs(w[0]) ? 0.87 : 0.42;
    this.block(L, i, j, F.x, F.z, hw, hd);
  }

  decal(L, i, j) {
    const w = this.wallDirs(L, i, j).find(([dx, dz]) => this.m.get(L, i + dx, j + dz) === '#');
    if (!w) return;
    const text = DECALS[this.decalIndex++ % DECALS.length];
    const tex = TX.textura('pintada', { texto: text, semilla: 500 + this.decalIndex });
    const mat = new THREE.MeshStandardMaterial({
      map: tex, transparent: true, depthWrite: false, roughness: 0.6,
      polygonOffset: true, polygonOffsetFactor: -2,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.6), mat);
    const nx = -w[0], nz = -w[1];
    mesh.position.set((i + 0.5) * C + w[0] * (C / 2 - 0.015), L * H + 1.45, (j + 0.5) * C + w[1] * (C / 2 - 0.015));
    mesh.rotation.y = Math.atan2(nx, nz);
    mesh.receiveShadow = true;
    this.groups[L].add(mesh);
  }

  // ------------------------------------------------------------ luces
  makeLightPool() {
    this.pool = [];
    for (let k = 0; k < POOL_SIZE; k++) {
      const pl = new THREE.PointLight(0xffa050, 0, 6, 2);
      this.scene.add(pl);
      this.pool.push(pl);
    }
    this._cands = [];
  }

  flick(s, t) {
    const a = s.seed;
    switch (s.kind) {
      case 'fire': return 0.72 + 0.16 * Math.sin(t * 9.1 + a) + 0.12 * Math.sin(t * 23.7 + a * 3) + 0.06 * Math.sin(t * 41 + a);
      case 'candle': return 0.86 + 0.07 * Math.sin(t * 11 + a) + 0.06 * Math.sin(t * 27.3 + a * 2) + (Math.sin(t * 1.3 + a) > 0.97 ? -0.3 : 0);
      case 'lamp': return 0.9 + 0.06 * Math.sin(t * 7 + a) + 0.04 * Math.sin(t * 19 + a);
      default: return 1;
    }
  }

  setVisibleLevel(L) {
    for (let k = 0; k < LEVELS; k++) this.groups[k].visible = Math.abs(k - L) <= 1;
  }

  update(dt, t, player, ghosts) {
    const L = player.L;
    const px = player.pos.x, py = player.feetY, pz = player.pos.z;

    for (const d of this.doors) d.update(dt);

    for (const f of this.flames) {
      if (Math.abs(f.L - L) > 1) continue;
      const a = f.seed;
      if (f.kind === 'fire') {
        const k = 0.8 + 0.2 * Math.sin(t * 13 + a) + 0.12 * Math.sin(t * 31 + a * 2);
        f.s.scale.set(f.sx * (0.9 + 0.12 * Math.sin(t * 7 + a)), f.sy * k, 1);
        f.s.position.y = f.y + (k - 1) * f.sy * 0.4;
      } else {
        const k = 1 + 0.12 * Math.sin(t * 17 + a) + 0.08 * Math.sin(t * 29 + a);
        f.s.scale.set(f.sx * (1 + 0.05 * Math.sin(t * 23 + a)), f.sy * k, 1);
      }
    }

    for (const l of this.lamps) {
      l.g.rotation.z = Math.sin(t * 0.9 + l.seed) * l.amp;
      l.g.rotation.x = Math.sin(t * 0.63 + l.seed * 2) * l.amp * 0.8;
    }

    for (const p of this.pendulums) p.rotation.z = Math.sin(t * Math.PI) * 0.18;

    for (const r of this.rockers) {
      const near = r.L === L ? Math.max(0, 1 - r.pos.distanceTo(player.pos) / 12) : 0;
      r.amp += ((0.03 + near * 0.13) - r.amp) * dt * 0.5;
      r.rock.rotation.x = Math.sin(t * 1.7 + r.phase) * r.amp;
      r.creak = near > 0.3 && Math.abs(Math.sin(t * 1.7 + r.phase)) > 0.995;
    }

    // las muñecas te miran cuando no las ves
    const cam = player.camera;
    for (const d of this.dolls) {
      if (d.L !== L) continue;
      const dx = d.g.position.x - cam.position.x, dz = d.g.position.z - cam.position.z;
      const dist = Math.hypot(dx, dz);
      const fwdX = -Math.sin(player.yaw), fwdZ = -Math.cos(player.yaw);
      const dot = (dx * fwdX + dz * fwdZ) / (dist || 1);
      if (dot < 0.2) d.g.rotation.y = Math.atan2(-dx, -dz);
    }

    // relámpagos
    this.lightning = Math.max(0, this.lightning - dt * 3.5);
    this.mats.window.emissiveIntensity = LUZ.ventanas + this.lightning * 8;
    this.actualizarCuadros(player);

    // reparto de luces puntuales entre las fuentes más cercanas
    const cands = this._cands;
    cands.length = 0;
    for (const s of this.lightSources) {
      if (s.L !== L) continue;
      if (s.obj) s.obj.getWorldPosition(s.pos);
      const dx = s.pos.x - px, dy = s.pos.y - py, dz = s.pos.z - pz;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < 22 * 22) { s._d = d2; cands.push(s); }
    }
    cands.sort((a, b) => a._d - b._d);
    for (let k = 0; k < this.pool.length; k++) {
      const pl = this.pool[k];
      const s = cands[k];
      if (!s) { pl.intensity = 0; continue; }
      pl.position.copy(s.pos);
      pl.color.copy(s.color);
      const F = LUZ.fuentes[TIPO_FUENTE[s.kind]];
      pl.distance = F.alcance * Math.sqrt(s.escala);
      let f = this.flick(s, t);
      // las llamas se encogen cerca de una aparición
      let near = 99;
      if (ghosts) {
        for (const g of ghosts.list) {
          if (g.state === 'dead' || g.L !== L) continue;
          const d = Math.hypot(g.x - s.pos.x, g.z - s.pos.z);
          if (d < near) near = d;
        }
      }
      const target = near < 4.5 ? 0.15 + 0.3 * Math.abs(Math.sin(t * 17 + s.seed)) : 1;
      s.dim += (target - s.dim) * Math.min(1, dt * 4);
      f *= s.dim;
      if (s.kind === 'moon') f *= 1 + this.lightning * 7;
      const dist = Math.sqrt(s._d);
      const fade = dist < 15 ? 1 : Math.max(0, 1 - (dist - 15) / 7);
      pl.intensity = F.intensidad * s.escala * f * fade;
    }
  }

  // puerta o puerta principal delante del jugador
  findInteract(player) {
    const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw);
    for (let d = 0.35; d <= 2.3; d += 0.25) {
      const x = player.pos.x + fx * d, z = player.pos.z + fz * d;
      const i = Math.floor(x / C), j = Math.floor(z / C);
      const ch = this.m.get(player.L, i, j);
      if (ch === 'D') return { type: 'door', door: this.m.doors.get(this.m.key(player.L, i, j)) };
      if (ch === 'E') return { type: 'front' };
      if (WALL_CHARS.has(ch)) return null;
    }
    return null;
  }
}
