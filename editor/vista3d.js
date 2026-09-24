// Vista 3D del taller: una habitación de 3×3 casillas con la luz del juego,
// donde se coloca la textura seleccionada según su formato.
import * as THREE from 'three';
import * as TX from '../js/textures.js';
import { Post } from '../js/post.js';
import { crearUniforms, materialAparicion, ponerFotograma } from '../js/ghostmat.js';
import { TIPOS } from '../assets/apariciones.js';
import { CUADROS } from '../assets/cuadros.js';

const C = 2, H = 3, N = 3;          // casilla, altura, casillas por lado
const HALF = (C * N) / 2;           // la habitación va de -3 a 3 en x y z
const POR_DEFECTO = { pared: 'pared-principal', suelo: 'suelo-principal', techo: 'techo-principal', luz: 'lente-linterna', llama: 'llama' };

function quad(b, a, bb, c, d, n, u0, v0, u1, v1) {
  const base = b.p.length / 3;
  b.p.push(...a, ...bb, ...c, ...d);
  for (let k = 0; k < 4; k++) b.n.push(...n);
  b.uv.push(u0, v0, u1, v0, u1, v1, u0, v1);
  b.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

function geometria(b) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
  g.setIndex(b.i);
  return g;
}

export class Vista3D {
  constructor(cont) {
    this.cont = cont;
    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setPixelRatio(1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    cont.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.fog = new THREE.FogExp2(0x000000, 0.075);
    this.scene.fog = this.fog;
    this.camera = new THREE.PerspectiveCamera(72, 1, 0.05, 60);
    this.yaw = 0;
    this.pitch = -0.05;
    this.pos = new THREE.Vector3(0, 1.6, 2.3);

    this.texDef = {};
    for (const [k, id] of Object.entries(POR_DEFECTO)) this.texDef[k] = TX.textura(id);
    this.propias = [];   // texturas creadas para la selección actual (se liberan al cambiar)

    const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.92, metalness: 0 }, o));
    this.mat = {
      pared: std({ map: this.texDef.pared, bumpMap: this.texDef.pared, bumpScale: 1.5 }),
      suelo: std({ map: this.texDef.suelo, bumpMap: this.texDef.suelo, bumpScale: 2 }),
      techo: std({ map: this.texDef.techo }),
      objeto: std({}),
      plano: std({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
    };
    // las apariciones usan el mismo material y shader que en el juego
    this.uniAp = crearUniforms();
    this.mat.sprite = materialAparicion(this.texDef.pared, this.uniAp);
    this.fotos = [];     // texturas por fotograma de la selección
    this.fps = 0;
    this.construirHabitacion();
    this.construirExtras();
    this.construirLuces();

    this.post = new Post(this.renderer);
    this.modoJuego = true;
    this.setLuz('linterna');
    this.controles();

    new ResizeObserver(() => this.redimensionar()).observe(cont);
    this.redimensionar();
    this.reloj = new THREE.Clock();
    const bucle = () => { requestAnimationFrame(bucle); this.frame(); };
    bucle();
  }

  construirHabitacion() {
    const pared = { p: [], n: [], uv: [], i: [] }, suelo = { p: [], n: [], uv: [], i: [] }, techo = { p: [], n: [], uv: [], i: [] };
    for (let k = 0; k < N; k++) {
      const a = -HALF + k * C, b = a + C;
      // cuatro paredes mirando hacia dentro: [normal, centro]
      const lados = [
        [[0, 0, 1], [a + C / 2, -HALF]], [[0, 0, -1], [a + C / 2, HALF]],
        [[1, 0, 0], [-HALF, a + C / 2]], [[-1, 0, 0], [HALF, a + C / 2]],
      ];
      lados.forEach(([n, [cx, cz]], s) => {
        const rx = n[2], rz = -n[0], h = C / 2;
        const v = ((k + s) & 1) * 0.5;
        quad(pared, [cx - rx * h, 0, cz - rz * h], [cx + rx * h, 0, cz + rz * h], [cx + rx * h, H, cz + rz * h], [cx - rx * h, H, cz - rz * h], n, v, 0, v + 0.5, 1);
      });
      for (let m = 0; m < N; m++) {
        const z0 = -HALF + m * C, z1 = z0 + C;
        quad(suelo, [a, 0, z1], [b, 0, z1], [b, 0, z0], [a, 0, z0], [0, 1, 0], 0, 0, 1, 1);
        quad(techo, [a, H, z0], [b, H, z0], [b, H, z1], [a, H, z1], [0, -1, 0], 0, 0, 1, 1);
      }
    }
    const mk = (b, mat, cast) => {
      const m = new THREE.Mesh(geometria(b), mat);
      m.receiveShadow = true;
      m.castShadow = cast;
      this.scene.add(m);
    };
    mk(pared, this.mat.pared, true);
    mk(suelo, this.mat.suelo, false);
    mk(techo, this.mat.techo, false);
  }

  construirExtras() {
    // objetos de muestra para texturas de "objeto"
    this.objetos = new THREE.Group();
    const add = (geo, x, y, z) => {
      const m = new THREE.Mesh(geo, this.mat.objeto);
      m.position.set(x, y, z);
      m.castShadow = m.receiveShadow = true;
      this.objetos.add(m);
    };
    add(new THREE.BoxGeometry(1, 1, 1), -1, 0.5, -1);
    add(new THREE.CylinderGeometry(0.4, 0.36, 1.1, 16), 0.9, 0.55, -1.1);
    add(new THREE.SphereGeometry(0.3, 16, 12), -1, 1.3, -1);
    add(new THREE.BoxGeometry(1.2, 2.4, 0.08), 0, 1.2, -HALF + 0.3);
    this.scene.add(this.objetos);

    // plano en la pared del fondo (cuadros y pintadas)
    this.plano = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.mat.plano);
    this.plano.receiveShadow = true;
    this.scene.add(this.plano);

    // sprite de aparición (plano que mira a la cámara) y sprite aditivo (llamas, halos)
    this.figura = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.mat.sprite);
    this.scene.add(this.figura);
    this.aditivo = new THREE.Sprite(new THREE.SpriteMaterial({
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false, color: 0xffd9a0,
    }));
    this.scene.add(this.aditivo);
  }

  construirLuces() {
    this.hemi = new THREE.HemisphereLight(0x3a4866, 0x0c0907, 0.035);
    this.scene.add(this.hemi);
    this.plena = new THREE.AmbientLight(0xffffff, 0);
    this.scene.add(this.plena);

    // linterna igual que la del jugador
    this.rig = new THREE.Object3D();
    this.scene.add(this.rig);
    this.spot = new THREE.SpotLight(0xfff2de, 240, 30, 0.5, 0.5, 2);
    this.spot.position.set(0.16, -0.14, 0.05);
    this.spot.castShadow = true;
    this.spot.shadow.mapSize.set(1024, 1024);
    this.spot.shadow.camera.near = 0.15;
    this.spot.shadow.bias = -0.0006;
    this.spot.shadow.normalBias = 0.02;
    this.spot.map = this.texDef.luz;
    this.rig.add(this.spot, this.spot.target);
    this.spot.target.position.set(0, 0, -6);
    this.spill = new THREE.PointLight(0xffe4c4, 1.2, 4.5, 2);
    this.spill.position.set(0, 0.1, -0.4);
    this.rig.add(this.spill);

    // vela en una esquina
    this.vela = new THREE.PointLight(0xff9a40, 4.5, 7, 2);
    this.vela.position.set(HALF - 0.6, 1.3, -HALF + 0.6);
    this.scene.add(this.vela);
    this.llamaVela = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this.texDef.llama, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false, color: 0xffd9a0,
    }));
    this.llamaVela.position.copy(this.vela.position).add(new THREE.Vector3(0, -0.1, 0));
    this.llamaVela.scale.set(0.06, 0.12, 1);
    this.scene.add(this.llamaVela);
  }

  setLuz(modo) {
    this.luz = modo;
    const lint = modo === 'linterna', vela = modo === 'vela', plena = modo === 'plena';
    this.spot.intensity = lint ? 240 : 0;
    this.spill.intensity = lint ? 1.2 : 0;
    this.vela.intensity = vela ? 4.5 : 0;
    this.llamaVela.visible = vela;
    this.plena.intensity = plena ? 2.2 : 0;
    this.scene.fog = plena ? null : this.fog;
  }

  setJuego(on) { this.modoJuego = on; }

  get esAparicion() { return this.figura.visible; }

  // Estado del shader de las apariciones: 'calma', 'quemandose' (valor = quemadura)
  // o 'desintegrando' (valor = cuánto se ha deshecho)
  setEstadoAparicion(estado, valor) {
    this.uniAp.uBurn.value = estado === 'calma' ? 0 : estado === 'quemandose' ? valor : 1;
    this.uniAp.uDissolve.value = estado === 'desintegrando' ? 0.02 + valor * 0.98 : 0;
  }

  // Coloca la textura `id` (un canvas por fotograma) según el formato de su familia
  mostrar(id, canvases) {
    const t = TX.info(id);
    const f = t.familia;
    for (const tex of this.propias) tex.dispose();
    this.propias = canvases.map((c) => TX.toTexture(c, { nearest: f.filtro !== 'suave' }));
    this.fotos = this.propias;
    this.fps = TX.fps(id) || 5;
    const tex = this.propias[0];
    const canvas = canvases[0];

    // restaurar valores por defecto
    const set = (mat, map, bump) => {
      mat.map = map;
      if (bump !== undefined) mat.bumpMap = bump;
      mat.needsUpdate = true;
    };
    set(this.mat.pared, this.texDef.pared, this.texDef.pared);
    set(this.mat.suelo, this.texDef.suelo, this.texDef.suelo);
    set(this.mat.techo, this.texDef.techo);
    this.spot.map = this.texDef.luz;
    this.objetos.visible = false;
    this.plano.visible = false;
    this.figura.visible = false;
    this.aditivo.visible = false;

    const aspecto = canvas.width / canvas.height;
    switch (f.formato) {
      case 'pared': set(this.mat.pared, tex, tex); break;
      case 'suelo': set(this.mat.suelo, tex, tex); break;
      case 'techo': set(this.mat.techo, tex); break;
      case 'objeto':
        set(this.mat.objeto, tex);
        this.objetos.visible = true;
        break;
      case 'cuadro':
      case 'pintada': {
        set(this.mat.plano, tex);
        const cuadro = CUADROS.find((q) => q.normal === id || q.tetrica === id);
        const alto = f.formato === 'cuadro' ? (cuadro ? cuadro.alto : 0.8) : 0.6;
        this.plano.scale.set(alto * aspecto, alto, 1);
        this.plano.position.set(0, f.formato === 'cuadro' ? 1.7 : 1.45, -HALF + 0.015);
        this.plano.visible = true;
        break;
      }
      case 'sprite':
        if (f.mezcla === 'aditiva') {
          this.aditivo.material.map = tex;
          this.aditivo.material.needsUpdate = true;
          const ancho = t.fichero === 'llama' ? 0.3 : 1.2;
          this.aditivo.scale.set(ancho, ancho / aspecto, 1);
          this.aditivo.position.set(0, 1.3, -1);
          this.aditivo.visible = true;
        } else {
          ponerFotograma(this.mat.sprite, tex);
          // tamaño del tipo de aparición que usa esta textura (si lo hay)
          const tipo = Object.values(TIPOS).find((x) => x.calma === id || x.grito === id);
          const alto = tipo ? tipo.alto : 2.1;
          const ancho = tipo ? tipo.ancho : alto * aspecto;
          this.figura.scale.set(ancho, alto, 1);
          this.figura.position.set(0, alto / 2 + 0.05, -1.2);
          this.figura.visible = true;
        }
        break;
      case 'luz': this.spot.map = tex; break;
    }
  }

  controles() {
    const el = this.renderer.domElement;
    let drag = null;
    el.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY }; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', (e) => {
      if (!drag) return;
      this.yaw -= (e.clientX - drag.x) * 0.005;
      this.pitch = Math.max(-1.3, Math.min(1.3, this.pitch - (e.clientY - drag.y) * 0.005));
      drag = { x: e.clientX, y: e.clientY };
    });
    el.addEventListener('pointerup', () => { drag = null; });
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const s = e.deltaY > 0 ? -0.35 : 0.35;
      this.pos.x = Math.max(-2.4, Math.min(2.4, this.pos.x - Math.sin(this.yaw) * s));
      this.pos.z = Math.max(-2.4, Math.min(2.4, this.pos.z - Math.cos(this.yaw) * s));
    }, { passive: false });
    el.addEventListener('dblclick', () => { this.yaw = 0; this.pitch = -0.05; this.pos.set(0, 1.6, 2.3); });
  }

  redimensionar() {
    const w = Math.max(2, this.cont.clientWidth), h = Math.max(2, this.cont.clientHeight);
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.post.setSize(w, h);
  }

  frame() {
    const dt = Math.min(0.05, this.reloj.getDelta());
    const t = this.reloj.elapsedTime;
    this.camera.position.copy(this.pos);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    this.rig.position.copy(this.camera.position);
    this.rig.quaternion.slerp(this.camera.quaternion, 1 - Math.exp(-dt * 13));
    if (this.luz === 'vela') this.vela.intensity = 4.5 * (0.86 + 0.07 * Math.sin(t * 11) + 0.06 * Math.sin(t * 27.3));
    if (this.figura.visible) this.figura.rotation.y = Math.atan2(this.pos.x - this.figura.position.x, this.pos.z - this.figura.position.z);
    this.uniAp.uTime.value = t;
    if (this.fotos.length > 1) {
      const k = Math.floor(t * this.fps) % this.fotos.length;
      if (this.figura.visible) ponerFotograma(this.mat.sprite, this.fotos[k]);
      if (this.aditivo.visible && this.aditivo.material.map !== this.fotos[k]) {
        this.aditivo.material.map = this.fotos[k];
      }
    }

    if (this.modoJuego) {
      this.renderer.toneMapping = THREE.NoToneMapping;
      const u = this.post.uniforms;
      u.uTime.value = t;
      this.post.render(this.scene, this.camera);
    } else {
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.25;
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.scene, this.camera);
    }
  }
}
