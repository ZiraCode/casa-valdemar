// Cargador de texturas. Cada familia vive en assets/texturas/<nombre>.js y exporta:
//   familia  → metadatos (tamaño, formato, parámetros editables y texturas con sus valores)
//   dibujar(ctx, p) → pinta en un canvas del tamaño de la familia con los parámetros p
// Una textura también puede apuntar a un PNG con `imagen: 'fichero.png'` (misma carpeta):
// en ese caso se usa la imagen en lugar de dibujar.
import * as THREE from 'three';

export { rng } from './texlib.js';

const BASE = new URL('../assets/texturas/', import.meta.url);

let registro = new Map();   // id → { id, fichero, familia, dibujar, def, img }
let familias = [];          // [{ fichero, familia, dibujar, error }]

function cargarImagen(url) {
  return new Promise((ok, mal) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => mal(new Error(`No se pudo cargar ${url}`));
    img.src = url;
  });
}

// Carga (o recarga, saltándose la caché del navegador) todas las familias.
export async function cargarTexturas({ recargar = false } = {}) {
  const v = recargar ? `?v=${Date.now()}` : '';
  const { FAMILIAS } = await import(new URL(`index.js${v}`, BASE).href);
  const res = await Promise.all(FAMILIAS.map(async (fichero) => {
    try {
      const mod = await import(new URL(`${fichero}.js${v}`, BASE).href);
      if (!mod.familia || typeof mod.dibujar !== 'function') throw new Error('debe exportar `familia` y `dibujar`');
      return { fichero, familia: mod.familia, dibujar: mod.dibujar, error: null };
    } catch (e) {
      console.error(`Textura ${fichero}.js:`, e);
      return { fichero, familia: null, dibujar: null, error: e };
    }
  }));

  const nuevo = new Map();
  for (const f of res) {
    if (f.error) continue;
    for (const [id, def] of Object.entries(f.familia.texturas || {})) {
      if (nuevo.has(id)) console.warn(`Textura duplicada: ${id} (${f.fichero}.js)`);
      const entry = { id, fichero: f.fichero, familia: f.familia, dibujar: f.dibujar, def, img: null };
      if (def.imagen) {
        try { entry.img = await cargarImagen(new URL(def.imagen + v, BASE).href); }
        catch (e) { console.error(e); }
      }
      nuevo.set(id, entry);
    }
  }
  registro = nuevo;
  familias = res;
  return { familias, texturas: [...registro.values()] };
}

export function info(id) {
  const t = registro.get(id);
  if (!t) throw new Error(`Textura desconocida: ${id}`);
  return t;
}

export function listaTexturas() { return [...registro.values()]; }
export function listaFamilias() { return familias; }

// Parámetros efectivos: los de la textura, sobrescritos por `extra`
export function parametros(id, extra = {}) {
  const { def } = info(id);
  const p = { ...def, ...extra };
  delete p.uso;
  delete p.imagen;
  return p;
}

// Canvas con la textura dibujada
export function lienzo(id, extra = {}) {
  const t = info(id);
  const c = document.createElement('canvas');
  // Sin willReadFrequently a propósito: cambiaría el suavizado de todas las texturas.
  // Chrome avisa en consola de las lecturas de píxeles del grano; es inofensivo.
  const ctx = c.getContext('2d');
  if (t.img) {
    c.width = t.img.naturalWidth;
    c.height = t.img.naturalHeight;
    ctx.drawImage(t.img, 0, 0);
    return c;
  }
  c.width = t.familia.ancho;
  c.height = t.familia.alto;
  t.dibujar(ctx, parametros(id, extra));
  return c;
}

export function toTexture(c, { nearest = true, repeat = false, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = nearest ? THREE.NearestFilter : THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.anisotropy = 4;
  t.wrapS = t.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  return t;
}

// Textura de three.js lista para usar; el filtro sale de la familia ('suave' o nítido)
export function textura(id, extra = {}, opts = {}) {
  const t = info(id);
  return toTexture(lienzo(id, extra), { nearest: t.familia.filtro !== 'suave', ...opts });
}
