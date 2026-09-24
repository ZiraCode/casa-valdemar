// Iluminación del juego en un solo sitio. El juego lee estos valores en cada fotograma,
// así que el panel de ajuste (?luz + tecla L) los cambia en vivo.

export const LUZ = {
  linterna: {
    intensidad: 45,    // candelas
    alcance: 24,       // metros hasta que se apaga del todo
    angulo: 36,        // apertura del cono en grados (medio ángulo)
    penumbra: 0.85,    // 0 = borde duro, 1 = borde totalmente difuminado
    caida: 1.3,        // 2 = física real (quema de cerca); menos = más uniforme con la distancia
  },
  lente: {             // patrón proyectado (textura 'lente-linterna'): valores que sustituyen a los de su fichero
    dureza: 0.3,       // 0 = luz muy repartida, 1 = punto central concentrado
    anillo: 0.2,       // anillo brillante típico de las linternas
    suciedad: 20,      // manchas de la lente
  },
  relleno: {           // luz débil pegada al jugador: deja entrever lo más cercano
    intensidad: 0.3,
    alcance: 3,
  },
  fuentes: {           // puntos de luz del mapa
    vela: { intensidad: 2.2, alcance: 5.5 },
    candil: { intensidad: 3, alcance: 6.5 },
    chimenea: { intensidad: 9, alcance: 9 },
    luna: { intensidad: 0.7, alcance: 4.5 },
  },
  ventanas: 0.22,      // brillo propio del cristal de las ventanas
  ambiente: 0.02,      // luz general (casi nada)
  niebla: 0.085,       // densidad de la niebla negra
  exposicion: 1.25,    // exposición final (postproceso)
};

// Copia de los valores de fábrica, para "Restablecer"
export const LUZ_FABRICA = JSON.parse(JSON.stringify(LUZ));

const CLAVE = 'casa-valdemar-luz';

function mezclar(dest, orig) {
  for (const [k, v] of Object.entries(orig || {})) {
    if (v && typeof v === 'object' && dest[k] && typeof dest[k] === 'object') mezclar(dest[k], v);
    else if (k in dest && typeof v === typeof dest[k]) dest[k] = v;
  }
}

export function cargarLuzGuardada() {
  try { mezclar(LUZ, JSON.parse(localStorage.getItem(CLAVE))); } catch { /* sin datos */ }
}

export function guardarLuz() {
  try { localStorage.setItem(CLAVE, JSON.stringify(LUZ)); } catch { /* sin almacenamiento */ }
}

export function restablecerLuz() {
  mezclar(LUZ, JSON.parse(JSON.stringify(LUZ_FABRICA)));
  try { localStorage.removeItem(CLAVE); } catch { /* sin almacenamiento */ }
}

// Texto listo para pegar en este fichero (o para pasárselo a la IA)
export function textoLuz() {
  return 'export const LUZ = ' + JSON.stringify(LUZ, null, 2).replace(/"(\w+)":/g, '$1:') + ';\n';
}

// Nombre de cada tipo de fuente en World → clave de LUZ.fuentes
export const TIPO_FUENTE = { candle: 'vela', lamp: 'candil', fire: 'chimenea', moon: 'luna' };
