// Cuadros colgados en la mansión: cada uno con versión normal y tétrica.
//
//   normal / tetrica  identificadores de textura (familia `cuadros` de assets/texturas/)
//   alto              alto del cuadro en metros; el ancho sale de la proporción de la imagen
//   sitios            dónde se cuelga: casilla transitable (planta, col, fila) y en qué pared
//                     de esa casilla ('norte', 'sur', 'este', 'oeste'); la pared debe ser un muro #

export const CUADROS = [
  {
    id: 'familia',
    nombre: 'Los Valdemar',
    normal: 'cuadro-familia',
    tetrica: 'cuadro-familia-tetrica',
    alto: 1.0,
    sitios: [{ planta: 1, col: 13, fila: 12, pared: 'este' }],   // vestíbulo, a la derecha al empezar
  },
  {
    id: 'casa',
    nombre: 'La casa del páramo',
    normal: 'cuadro-casa',
    tetrica: 'cuadro-casa-tetrica',
    alto: 0.9,
    sitios: [{ planta: 1, col: 1, fila: 8, pared: 'oeste' }],     // salón, junto a la chimenea
  },
];

// Cuándo se ve la versión tétrica
export const REGLAS = {
  fueraDeLaLinterna: true,     // tétrico salvo cuando el haz de la linterna lo ilumina
  anguloHaz: 20,               // grados desde el centro del haz para verlo normal (con 6° de margen al salir)
  relampagos: true,            // tétrico durante el destello de un relámpago
  tetricosTrasDesterrar: 4,    // tras desterrar esta cantidad de apariciones, tétricos para siempre (0 = nunca)
};

export const DIRECCIONES = { norte: [0, -1], sur: [0, 1], este: [1, 0], oeste: [-1, 0] };
