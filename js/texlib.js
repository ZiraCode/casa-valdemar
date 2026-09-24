// Utilidades de dibujo compartidas por las texturas de assets/texturas/.
// No dependen de three.js: solo canvas 2D.

// Generador pseudoaleatorio determinista (mulberry32): misma semilla, mismo dibujo.
export function rng(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rgb = (r, g, b, a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a})`;

// Acepta 0xrrggbb o '#rrggbb'
export function hx(h) {
  if (typeof h === 'string') h = parseInt(h.replace('#', ''), 16);
  return [(h >> 16) & 255, (h >> 8) & 255, h & 255];
}

// Color multiplicado por k (k<1 oscurece, k>1 aclara), con alfa opcional
export function shade(hex, k, a = 1) {
  const [r, g, b] = hx(hex);
  return rgb(Math.min(255, r * k), Math.min(255, g * k), Math.min(255, b * k), a);
}

// Ruido monocromo de amplitud amt sobre todo el lienzo
export function grain(ctx, w, h, r, amt) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * amt;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

// Manchas radiales difusas (humedad, suciedad, hollín)
export function stains(ctx, x0, y0, w, h, r, count, col = [25, 15, 6], maxA = 0.35, maxR = 26) {
  for (let k = 0; k < count; k++) {
    const x = x0 + r() * w, y = y0 + r() * h, rad = 4 + r() * maxR;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, rgb(col[0], col[1], col[2], maxA * r()));
    g.addColorStop(0.7, rgb(col[0], col[1], col[2], maxA * 0.3 * r()));
    g.addColorStop(1, rgb(col[0], col[1], col[2], 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
}

// Chorretones verticales que se desvanecen hacia abajo
export function drips(ctx, x0, w, yStart, h, r, count, col = [20, 12, 5], alpha = 0.35) {
  for (let k = 0; k < count; k++) {
    const x = x0 + r() * w;
    const len = 10 + r() * h;
    const wd = 1 + r() * 2;
    const g = ctx.createLinearGradient(0, yStart, 0, yStart + len);
    g.addColorStop(0, rgb(col[0], col[1], col[2], alpha * (0.5 + r() * 0.5)));
    g.addColorStop(1, rgb(col[0], col[1], col[2], 0));
    ctx.fillStyle = g;
    ctx.fillRect(x, yStart, wd, len);
  }
}
