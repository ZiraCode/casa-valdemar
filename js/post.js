// Postproceso: resolución reducida (look retro), tone mapping, grano,
// viñeta, aberración cromática y distorsión ligadas al miedo y la cordura.
import * as THREE from 'three';

const VERT = /* glsl */`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const FRAG = /* glsl */`
uniform sampler2D tDiffuse;
uniform vec2 uRes;
uniform float uTime;
uniform float uFear;
uniform float uSanity;
uniform float uHit;
uniform float uFlash;
uniform float uFade;
uniform float uExposure;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

vec3 aces(vec3 x) {
  const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
  vec2 uv = vUv;
  float insanity = 1.0 - uSanity;

  // ondulación con poca cordura
  float wob = insanity * insanity * 0.007 + uFear * 0.0015 + uHit * 0.01;
  uv += vec2(sin(uv.y * 17.0 + uTime * 1.7), cos(uv.x * 13.0 + uTime * 1.3)) * wob;

  // saltos de línea tipo cinta vieja cuando el miedo es alto
  float band = step(0.985 - uFear * 0.03, hash(vec2(floor(uv.y * 60.0), floor(uTime * 12.0))));
  uv.x += band * (hash(vec2(uTime, uv.y)) - 0.5) * 0.03 * (uFear + uHit);

  vec2 dir = uv - 0.5;
  float ca = 0.0012 + uFear * 0.004 + uHit * 0.02 + insanity * 0.003;
  vec3 col;
  col.r = texture2D(tDiffuse, uv + dir * ca).r;
  col.g = texture2D(tDiffuse, uv).g;
  col.b = texture2D(tDiffuse, uv - dir * ca).b;

  col *= uExposure;
  col += vec3(0.55, 0.62, 0.8) * uFlash * 0.08;
  col = aces(col);

  // paleta fría y desaturada
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 tint = vec3(l) * vec3(1.02, 0.97, 0.9);
  col = mix(col, tint, 0.3 + insanity * 0.45);
  // viñeta
  vec2 vd = dir * vec2(uRes.x / uRes.y, 1.0);
  float vr = length(vd);

  // golpe: sangre en los bordes
  float hitMask = uHit * (0.25 + 0.75 * smoothstep(0.15, 0.75, vr));
  col = mix(col, vec3(l * 1.4, l * 0.08, l * 0.06) + vec3(0.12, 0.0, 0.0), hitMask * 0.7);
  float inner = 0.72 - uFear * 0.28 - insanity * 0.2;
  float vig = smoothstep(inner + 0.55, inner - 0.25, vr);
  col *= mix(0.08, 1.0, vig);

  col = pow(max(col, 0.0), vec3(1.0 / 2.2));

  // grano
  float g = hash(vUv * uRes + fract(uTime * 43.0) * 97.0) - 0.5;
  col += g * (0.055 + uFear * 0.05 + insanity * 0.04);

  col *= 1.0 - uFade;
  gl_FragColor = vec4(col, 1.0);
}
`;

export class Post {
  constructor(renderer) {
    this.renderer = renderer;
    this.scales = [0.5, 0.75, 1.0];
    this.scaleIndex = 0;
    this.rt = new THREE.WebGLRenderTarget(2, 2, {
      type: THREE.HalfFloatType,
      depthBuffer: true,
    });
    this.uniforms = {
      tDiffuse: { value: this.rt.texture },
      uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uFear: { value: 0 },
      uSanity: { value: 1 },
      uHit: { value: 0 },
      uFlash: { value: 0 },
      uFade: { value: 0 },
      uExposure: { value: 1.25 },
    };
    this.mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms, vertexShader: VERT, fragmentShader: FRAG,
      depthTest: false, depthWrite: false,
    });
    this.scene = new THREE.Scene();
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat);
    quad.frustumCulled = false;
    this.scene.add(quad);
    this.w = 1; this.h = 1;
  }

  get scale() { return this.scales[this.scaleIndex]; }

  cycleScale() {
    this.scaleIndex = (this.scaleIndex + 1) % this.scales.length;
    this.setSize(this.w, this.h);
    return this.scale;
  }

  setSize(w, h) {
    this.w = w; this.h = h;
    const s = this.scale;
    const rw = Math.max(2, Math.floor(w * s)), rh = Math.max(2, Math.floor(h * s));
    this.rt.setSize(rw, rh);
    const filter = s < 1 ? THREE.NearestFilter : THREE.LinearFilter;
    this.rt.texture.magFilter = filter;
    this.rt.texture.minFilter = filter;
    this.uniforms.uRes.value.set(rw, rh);
  }

  render(scene, camera) {
    const r = this.renderer;
    r.setRenderTarget(this.rt);
    r.render(scene, camera);
    r.setRenderTarget(null);
    r.render(this.scene, this.cam);
  }
}
