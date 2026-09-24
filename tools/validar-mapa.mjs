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

const ok = !warnings.length && !unreachable.length && M.spawns.every((s) => dist[M.key(s.L, s.i, s.j)] >= 0);
console.log(ok ? 'MAPA OK' : 'HAY PROBLEMAS EN EL MAPA');
process.exit(ok ? 0 : 1);
