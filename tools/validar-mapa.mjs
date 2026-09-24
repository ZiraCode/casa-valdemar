// Valida el mapa sin navegador: node tools/validar-mapa.mjs
// Comprueba tamaños, coherencia de escaleras (avisos de map.js), que todas las
// casillas transitables sean alcanzables desde el inicio y la distancia a cada aparición.
import { Mansion, LEVEL_NAMES, COLS, ROWS } from '../js/map.js';

const warnings = [];
const warn = console.warn;
console.warn = (...a) => { warnings.push(a.join(' ')); warn(...a); };

const M = new Mansion();
console.warn = warn;

console.log(`Escaleras: ${M.stairs.length} · Apariciones: ${M.spawns.length} · Inicio: planta ${M.start.L} (${M.start.i},${M.start.j})`);

const dist = new Int16Array(M.nodeCount);
M.bfs(M.key(M.start.L, M.start.i, M.start.j), dist);

const unreachable = [];
for (let n = 0; n < M.nodeCount; n++) {
  if (M.walk[n] && dist[n] < 0) {
    const i = n % COLS, j = Math.floor(n / COLS) % ROWS, L = Math.floor(n / (COLS * ROWS));
    unreachable.push(`${LEVEL_NAMES[L]} (${i},${j})`);
  }
}

for (const s of M.spawns) {
  console.log(`  aparición en ${LEVEL_NAMES[s.L]} (${s.i},${s.j}) a ${dist[M.key(s.L, s.i, s.j)]} casillas`);
}

if (unreachable.length) console.log(`Casillas inalcanzables (${unreachable.length}): ${unreachable.slice(0, 20).join(', ')}`);

// Tipos de aparición: asignaciones a G existentes y texturas que existen
const { TIPOS, POR_DEFECTO, ASIGNACION, tipoDe } = await import('../assets/apariciones.js');
const { FAMILIAS } = await import('../assets/texturas/index.js');
const ids = new Set();
for (const f of FAMILIAS) {
  const mod = await import(`../assets/texturas/${f}.js`);
  Object.keys(mod.familia.texturas).forEach((id) => ids.add(id));
}
const problemasTipos = [];
if (!TIPOS[POR_DEFECTO]) problemasTipos.push(`POR_DEFECTO '${POR_DEFECTO}' no es un tipo`);
for (const [nombre, t] of Object.entries(TIPOS)) {
  for (const k of ['calma', 'grito']) if (!ids.has(t[k])) problemasTipos.push(`tipo '${nombre}': textura '${t[k]}' no existe`);
}
const claves = new Set(M.spawns.map((s) => `${s.L}:${s.i},${s.j}`));
for (const [clave, tipo] of Object.entries(ASIGNACION)) {
  if (!claves.has(clave)) problemasTipos.push(`ASIGNACION '${clave}' no corresponde a ninguna G del mapa`);
  if (!TIPOS[tipo]) problemasTipos.push(`ASIGNACION '${clave}': tipo '${tipo}' desconocido`);
}
const cuenta = {};
for (const s of M.spawns) cuenta[tipoDe(s)] = (cuenta[tipoDe(s)] || 0) + 1;
console.log(`Tipos de aparición: ${Object.entries(cuenta).map(([k, n]) => `${k} ×${n}`).join(', ')}`);
problemasTipos.forEach((p) => console.log('  ' + p));

// Cuadros: texturas existentes y sitios en una pared # junto a una casilla transitable
const { CUADROS, DIRECCIONES } = await import('../assets/cuadros.js');
const problemasCuadros = [];
const caras = new Map();
for (const q of CUADROS) {
  for (const k of ['normal', 'tetrica']) if (!ids.has(q[k])) problemasCuadros.push(`cuadro '${q.id}': textura '${q[k]}' no existe`);
  for (const s of q.sitios) {
    const d = DIRECCIONES[s.pared];
    const donde = `cuadro '${q.id}' en planta ${s.planta} (${s.col},${s.fila}) pared ${s.pared}`;
    if (!d) { problemasCuadros.push(`${donde}: pared desconocida`); continue; }
    if (M.isWall(s.planta, s.col, s.fila)) problemasCuadros.push(`${donde}: la casilla es un muro, debe ser transitable`);
    const muro = M.get(s.planta, s.col + d[0], s.fila + d[1]);
    if (muro !== '#') problemasCuadros.push(`${donde}: esa pared es '${muro}', debe ser un muro #`);
    const cara = `${s.planta}:${s.col + d[0]},${s.fila + d[1]}:${-d[0]},${-d[1]}`;
    if (caras.has(cara)) problemasCuadros.push(`${donde}: pared ya ocupada por '${caras.get(cara)}'`);
    caras.set(cara, q.id);
  }
}
console.log(`Cuadros: ${CUADROS.map((q) => `${q.id} ×${q.sitios.length}`).join(', ')}`);
problemasCuadros.forEach((p) => console.log('  ' + p));

const ok = !warnings.length && !unreachable.length && !problemasTipos.length && !problemasCuadros.length
  && M.spawns.every((s) => dist[M.key(s.L, s.i, s.j)] >= 0);
console.log(ok ? 'MAPA OK' : 'HAY PROBLEMAS EN EL MAPA');
process.exit(ok ? 0 : 1);
