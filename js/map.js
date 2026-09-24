// Mapa de la mansión: cuatro plantas en rejilla (estilo Wolfenstein/Doom).
//
// Leyenda
//  #  muro            k  estantería / botellero (muro)   F  chimenea (muro)
//  E  puerta principal (muro, cerrada)                   w  ventana (se añaden por código)
//  .  suelo           D  puerta funcional                 _  hueco sobre una escalera
//  ^ v < >  escalera que SUBE en esa dirección (se define en la planta inferior)
//  P  jugador         G  aparición                        !  pintada en una pared cercana
//  t mesa   C silla   a sillón tapado   c candelabro (luz)   l candil colgante (luz)
//  b cama   p piano   n reloj de pie    x cajas   r barril    o ataúd
//  m figura tapada    h mecedora        d muñeca  T bañera

export const CELL = 2;       // metros por casilla
export const LEVEL_H = 3;    // altura de cada planta
export const COLS = 22;
export const ROWS = 16;
export const LEVELS = 4;

export const LEVEL_NAMES = ['Sótano', 'Planta principal', 'Segunda planta', 'Buhardilla'];
export const LEVEL_LINES = [
  'Huele a tierra mojada... y a algo más dulce.',
  'La puerta se ha cerrado a tu espalda.',
  'Las habitaciones de los niños. Nadie ha dormido aquí en cien años.',
  'Algo respira debajo de las sábanas.'
];

const RAW = [
  [ // 0 · Sótano
    '######################',
    '#rr..#kkkkkkk#x..xx###',
    '#r...#.......#.....#^#',
    '#....D...c...D.....#^#',
    '#r..r#.......#x...x#^#',
    '###D#####D######D###.#',
    '#..l.......l......l..#',
    '####D#######D#####D###',
    '#x....x.#.o...o.#....#',
    '#.......#......!#.r..#',
    '#..c....#.o.c.o.#..G.#',
    '#.......#.......D....#',
    '#xx.....#.o...o.#.r..#',
    '#r...G..#.......#....#',
    '#rrx..x.#.......#x..r#',
    '######################',
  ],
  [ // 1 · Planta principal
    '######################',
    '#kkkkk#.n..k.#r..x.D.#',
    '#.G...#...t..#..t..#_#',
    '#.a.c.D...l..D.....#_#',
    '#C....#......#.c...#_#',
    '###D####D#######D#####',
    '#......#.#^^#.#...l..#',
    '#p.....#.#^^#.#.CCCC.#',
    '#......#.#^^#.#.tttt.#',
    '#.a....#......#.CCCC.#',
    'F..c...D......D......#',
    '#.a....#c....c#......#',
    '#......#...l..#....c.#',
    '#......#..P...#......#',
    '#kk..l.#.....!#..n.G.#',
    '##########EE##########',
  ],
  [ // 2 · Segunda planta
    '######################',
    '#b..c.#T..#..c.b#h..d#',
    '#.....#...#.....#..G.#',
    '#.a...#..c#.....#....#',
    '###D####D####D####D###',
    '#...l......l.....l...#',
    '####D#####__####D###v#',
    '#.b..c.###__###....#v#',
    '#......###__###.b..#v#',
    '#......########....###',
    '#......#..l..!#......#',
    '#.....a#......#..h...#',
    '#......D..t...D......#',
    '#......#.a....#.m..G.#',
    '#b...k.#....c.#k.....#',
    '######################',
  ],
  [ // 3 · Buhardilla
    '######################',
    '#xx..m..x#r...x..m.xx#',
    '#x......m#.....G....c#',
    '#...c....D...........#',
    '#.m......#.x....x..m.#',
    '#x.......#####D#######',
    '#.l....#.....m.....#_#',
    '#.....x........r...#_#',
    '#...m..............#_#',
    '#......#!....c.......#',
    '####D####.....x......#',
    '#.....h.#...m.....x..#',
    '#.d..c..#............#',
    '#..G...!#..x.....m...#',
    '#b.d....#xx.....r.xx.#',
    '######################',
  ],
];

// Ventanas en muros exteriores [planta, columna, fila]
const WINDOWS = [
  [1, 16, 0], [1, 9, 0], [1, 0, 13], [1, 0, 2], [1, 21, 7], [1, 21, 12], [1, 4, 15], [1, 16, 15],
  [2, 3, 0], [2, 12, 0], [2, 18, 0], [2, 0, 2], [2, 0, 8], [2, 0, 12], [2, 21, 11], [2, 21, 2],
  [2, 3, 15], [2, 10, 15], [2, 17, 15],
  [3, 4, 0], [3, 15, 0], [3, 0, 8], [3, 21, 12], [3, 0, 12],
];

export const WALL_CHARS = new Set(['#', 'k', 'F', 'E', 'w']);
export const STAIR_DIRS = { '^': [0, -1], 'v': [0, 1], '<': [-1, 0], '>': [1, 0] };
const isStairChar = (ch) => ch === '^' || ch === 'v' || ch === '<' || ch === '>';

export class Mansion {
  constructor() {
    this.grid = RAW.map((level) => level.map((row) => row.split('')));
    this.validateSizes();

    for (const [L, i, j] of WINDOWS) {
      if (this.grid[L][j][i] === '#') this.grid[L][j][i] = 'w';
      else console.warn('Ventana en casilla no válida', L, i, j);
    }

    this.stairs = [];
    this.stairMap = new Map();
    this.parseStairs();

    this.start = null;
    this.spawns = [];
    for (let L = 0; L < LEVELS; L++) {
      for (let j = 0; j < ROWS; j++) {
        for (let i = 0; i < COLS; i++) {
          const ch = this.grid[L][j][i];
          if (ch === 'P') { this.start = { L, i, j }; this.grid[L][j][i] = '.'; }
          if (ch === 'G') { this.spawns.push({ L, i, j }); this.grid[L][j][i] = '.'; }
        }
      }
    }

    this.doors = new Map();     // key -> Door (lo rellena World)
    this.blockers = new Map();  // key -> [{x0,x1,z0,z1}]
    this._boxes = [];
    this.buildGraph();
  }

  validateSizes() {
    this.grid.forEach((lv, L) => {
      if (lv.length !== ROWS) console.warn(`Planta ${L}: ${lv.length} filas`);
      lv.forEach((row, j) => {
        if (row.length !== COLS) console.warn(`Planta ${L} fila ${j}: ${row.length} columnas`);
      });
    });
  }

  key(L, i, j) { return (L * ROWS + j) * COLS + i; }

  get(L, i, j) {
    if (L < 0 || L >= LEVELS || i < 0 || j < 0 || i >= COLS || j >= ROWS) return '#';
    return this.grid[L][j][i];
  }

  isWall(L, i, j) { return WALL_CHARS.has(this.get(L, i, j)); }
  isStair(ch) { return isStairChar(ch); }

  parseStairs() {
    for (let L = 0; L < LEVELS; L++) {
      for (let j = 0; j < ROWS; j++) {
        for (let i = 0; i < COLS; i++) {
          const ch = this.get(L, i, j);
          if (!isStairChar(ch) || this.stairMap.has(this.key(L, i, j))) continue;
          const [dx, dz] = STAIR_DIRS[ch];
          let bi = i, bj = j;
          while (this.get(L, bi - dx, bj - dz) === ch) { bi -= dx; bj -= dz; }
          const cells = [];
          let ci = bi, cj = bj;
          while (this.get(L, ci, cj) === ch) { cells.push([ci, cj]); ci += dx; cj += dz; }
          const cx = (bi + 0.5) * CELL, cz = (bj + 0.5) * CELL;
          const st = {
            L, dx, dz, cells, n: cells.length,
            a0: cx * dx + cz * dz - CELL / 2,
            len: cells.length * CELL,
            bottom: [bi - dx, bj - dz],
            top: [ci, cj],
          };
          this.stairs.push(st);
          for (const [a, b] of cells) this.stairMap.set(this.key(L, a, b), st);

          // Comprobaciones de coherencia entre plantas
          for (const [a, b] of cells) {
            if (this.get(L + 1, a, b) !== '_') console.warn('Falta hueco sobre escalera', L, a, b);
          }
          if (!this.isWall(L, st.top[0], st.top[1])) console.warn('La salida superior debería ser muro abajo', L, st.top);
          if (this.isWall(L + 1, st.top[0], st.top[1])) console.warn('Salida superior bloqueada', L + 1, st.top);
          if (this.isWall(L, st.bottom[0], st.bottom[1])) console.warn('Entrada inferior bloqueada', L, st.bottom);
        }
      }
    }
  }

  stairT(st, x, z) {
    const t = (x * st.dx + z * st.dz - st.a0) / st.len;
    return t < 0 ? 0 : t > 1 ? 1 : t;
  }

  // Altura del suelo en (x,z) usando la rejilla de la planta L
  heightAt(x, z, L) {
    const i = Math.floor(x / CELL), j = Math.floor(z / CELL);
    const ch = this.get(L, i, j);
    if (isStairChar(ch)) {
      const st = this.stairMap.get(this.key(L, i, j));
      if (st) return (L + this.stairT(st, x, z)) * LEVEL_H;
    } else if (ch === '_') {
      const st = this.stairMap.get(this.key(L - 1, i, j));
      if (st) return (L - 1 + this.stairT(st, x, z)) * LEVEL_H;
    }
    return L * LEVEL_H;
  }

  levelFromY(feetY) {
    const L = Math.floor((feetY + LEVEL_H * 0.5) / LEVEL_H);
    return L < 0 ? 0 : L >= LEVELS ? LEVELS - 1 : L;
  }

  // ---------- Colisiones ----------
  addBlocker(L, i, j, box) {
    const k = this.key(L, i, j);
    if (!this.blockers.has(k)) this.blockers.set(k, []);
    this.blockers.get(k).push(box);
  }

  collectBoxes(L, x, z) {
    const out = this._boxes;
    out.length = 0;
    const i0 = Math.floor(x / CELL), j0 = Math.floor(z / CELL);
    for (let dj = -1; dj <= 1; dj++) {
      for (let di = -1; di <= 1; di++) {
        const i = i0 + di, j = j0 + dj;
        const ch = this.get(L, i, j);
        if (WALL_CHARS.has(ch)) {
          out.push({ x0: i * CELL, x1: (i + 1) * CELL, z0: j * CELL, z1: (j + 1) * CELL });
          continue;
        }
        const k = this.key(L, i, j);
        if (ch === 'D') {
          const d = this.doors.get(k);
          if (d) d.boxes(out);
        }
        const bl = this.blockers.get(k);
        if (bl) for (const b of bl) out.push(b);
      }
    }
    return out;
  }

  resolveCircle(L, p, r) {
    const boxes = this.collectBoxes(L, p.x, p.z);
    for (let iter = 0; iter < 3; iter++) {
      let moved = false;
      for (const b of boxes) {
        const cx = Math.max(b.x0, Math.min(p.x, b.x1));
        const cz = Math.max(b.z0, Math.min(p.z, b.z1));
        const dx = p.x - cx, dz = p.z - cz;
        const d2 = dx * dx + dz * dz;
        if (d2 >= r * r) continue;
        moved = true;
        if (d2 > 1e-9) {
          const d = Math.sqrt(d2);
          p.x += (dx / d) * (r - d);
          p.z += (dz / d) * (r - d);
        } else {
          const l = p.x - b.x0, rr = b.x1 - p.x, t = p.z - b.z0, bo = b.z1 - p.z;
          const m = Math.min(l, rr, t, bo);
          if (m === l) p.x = b.x0 - r;
          else if (m === rr) p.x = b.x1 + r;
          else if (m === t) p.z = b.z0 - r;
          else p.z = b.z1 + r;
        }
      }
      if (!moved) break;
    }
  }

  // ---------- Grafo para las apariciones ----------
  buildGraph() {
    const N = LEVELS * ROWS * COLS;
    this.nodeCount = N;
    this.adj = Array.from({ length: N }, () => []);
    this.walk = new Uint8Array(N);
    const normal = (L, i, j) => {
      const ch = this.get(L, i, j);
      return !WALL_CHARS.has(ch) && ch !== '_' && !isStairChar(ch);
    };
    const link = (a, b) => { this.adj[a].push(b); this.adj[b].push(a); };

    for (let L = 0; L < LEVELS; L++) {
      for (let j = 0; j < ROWS; j++) {
        for (let i = 0; i < COLS; i++) {
          if (!normal(L, i, j)) continue;
          const k = this.key(L, i, j);
          this.walk[k] = 1;
          if (normal(L, i + 1, j)) link(k, this.key(L, i + 1, j));
          if (normal(L, i, j + 1)) link(k, this.key(L, i, j + 1));
        }
      }
    }
    for (const st of this.stairs) {
      const ks = st.cells.map(([i, j]) => this.key(st.L, i, j));
      ks.forEach((k) => { this.walk[k] = 1; });
      for (let n = 1; n < ks.length; n++) link(ks[n - 1], ks[n]);
      if (normal(st.L, st.bottom[0], st.bottom[1])) link(this.key(st.L, st.bottom[0], st.bottom[1]), ks[0]);
      if (normal(st.L + 1, st.top[0], st.top[1])) link(ks[ks.length - 1], this.key(st.L + 1, st.top[0], st.top[1]));
    }
    this._queue = new Int32Array(N);
  }

  nodeAt(x, z, L) {
    const i = Math.floor(x / CELL), j = Math.floor(z / CELL);
    const ch = this.get(L, i, j);
    if (ch === '_') return this.key(L - 1, i, j);
    const k = this.key(L, i, j);
    if (i < 0 || j < 0 || i >= COLS || j >= ROWS) return -1;
    return this.walk[k] ? k : -1;
  }

  nodeCenter(n, out) {
    const i = n % COLS;
    const j = Math.floor(n / COLS) % ROWS;
    const L = Math.floor(n / (COLS * ROWS));
    out.x = (i + 0.5) * CELL;
    out.z = (j + 0.5) * CELL;
    out.y = L * LEVEL_H;
    return L;
  }

  nodeLevel(n) { return Math.floor(n / (COLS * ROWS)); }

  bfs(src, dist) {
    dist.fill(-1);
    if (src < 0) return;
    const q = this._queue;
    let head = 0, tail = 0;
    q[tail++] = src;
    dist[src] = 0;
    while (head < tail) {
      const n = q[head++];
      const nd = dist[n] + 1;
      for (const m of this.adj[n]) {
        if (dist[m] === -1) { dist[m] = nd; q[tail++] = m; }
      }
    }
  }

  // ---------- Línea de visión 3D ----------
  los(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const steps = Math.max(2, Math.ceil(len / 0.2));
    let prevL = Math.floor(a.y / LEVEL_H);
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      const x = a.x + dx * t, y = a.y + dy * t, z = a.z + dz * t;
      const Ls = Math.floor(y / LEVEL_H);
      if (Ls < 0 || Ls >= LEVELS) return false;
      const i = Math.floor(x / CELL), j = Math.floor(z / CELL);
      if (Ls !== prevL) {
        const up = Math.max(Ls, prevL);
        if (this.get(up, i, j) !== '_') return false;
        prevL = Ls;
      }
      const ch = this.get(Ls, i, j);
      if (WALL_CHARS.has(ch)) return false;
      if (ch === 'D') {
        const d = this.doors.get(this.key(Ls, i, j));
        if (d && d.isClosed()) {
          const off = d.axis === 'x' ? Math.abs(z - (j + 0.5) * CELL) : Math.abs(x - (i + 0.5) * CELL);
          if (off < 0.15) return false;
        }
      }
      if (isStairChar(ch) && y < this.heightAt(x, z, Ls) - 0.05) return false;
    }
    return true;
  }
}
