// Tipos de aparición y qué tipo usa cada aparición del mapa.
//
// Cada tipo indica:
//   calma / grito  identificadores de textura (assets/texturas/); pueden estar animadas
//   alto / ancho   tamaño del sprite en metros (conviene respetar la proporción de la textura)
//   velocidad      multiplicador de la velocidad de avance (1 = la de la dama)
//   voz            multiplicador del tono de los susurros y gemidos (1 = grave, >1 = más agudo)

export const TIPOS = {
  dama: {
    nombre: 'La dama',
    descripcion: 'Mujer alta de pelo negro y vestido blanco; brazos demasiado largos.',
    calma: 'aparicion',
    grito: 'aparicion-grito',
    alto: 2.1,
    ancho: 1.05,
    velocidad: 1,
    voz: 1,
  },
  nina: {
    nombre: 'La niña',
    descripcion: 'Niña en camisón con una muñeca de trapo; algo más rápida y con voz aguda.',
    calma: 'aparicion-nina',
    grito: 'aparicion-nina-grito',
    alto: 1.36,
    ancho: 0.68,
    velocidad: 1.1,
    voz: 1.7,
  },
};

export const POR_DEFECTO = 'dama';

// Clave "planta:columna,fila" de una G del mapa (js/map.js) → tipo. El resto usa POR_DEFECTO.
export const ASIGNACION = {
  '2:19,2': 'nina',   // cuarto infantil de la segunda planta
  '3:3,13': 'nina',   // cuarto de niños de la buhardilla
};

export function tipoDe(spawn) {
  return ASIGNACION[`${spawn.L}:${spawn.i},${spawn.j}`] || POR_DEFECTO;
}
