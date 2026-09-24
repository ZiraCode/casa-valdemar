// Material de las apariciones: MeshStandardMaterial con un añadido de shader
// para la quemadura (brillo tembloroso) y la desintegración (ruido que borra
// píxeles dejando un borde de brasas). Lo usan el juego y el taller.
import * as THREE from 'three';

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

// uDissolve: 0 = entera, 1 = desaparecida · uBurn: 0-1 exposición a la linterna
// uAlpha: opacidad global · uTime: segundos (anima el ruido y el temblor)
export function crearUniforms() {
  return { uDissolve: { value: 0 }, uBurn: { value: 0 }, uTime: { value: 0 }, uAlpha: { value: 1 } };
}

export function materialAparicion(tex, uniforms) {
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
  // todas las apariciones comparten programa; cambia la clave si cambias el shader
  m.customProgramCacheKey = () => 'aparicion-v1';
  return m;
}

// Cambia el fotograma sin recompilar (el material ya tenía mapa)
export function ponerFotograma(m, tex) {
  if (m.map === tex) return;
  m.map = tex;
  m.emissiveMap = tex;
}
