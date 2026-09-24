// Muro de tablones
import { rng, shade, grain, stains, drips } from '../../js/texlib.js';

export const familia = {
  nombre: 'Muro de tablones',
  descripcion: 'Tablones verticales con nudos, clavos y una viga horizontal a media altura. Dos variantes lado a lado.',
  ancho: 256,
  alto: 192,
  formato: 'pared',
  parametros: {
    semilla: { tipo: 'entero', etiqueta: 'Semilla aleatoria', min: 1, max: 99999 },
    color: { tipo: 'color', etiqueta: 'Color de la madera' },
  },
  texturas: {
    'pared-buhardilla': { uso: 'Muros de la buhardilla', semilla: 41, color: '#4a3526' },
  },
};

export function dibujar(ctx, p) {
  const { color: base } = p;
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const r = rng(p.semilla);
  for (let x = 0; x < W; x += 16) {
    const k = 0.7 + r() * 0.45;
    ctx.fillStyle = shade(base, k); ctx.fillRect(x, 0, 16, H);
    for (let n = 0; n < 8; n++) {
      ctx.fillStyle = shade(base, k * 0.75, 0.6);
      ctx.fillRect(x + 1 + r() * 13, 0, 1, H);
    }
    ctx.fillStyle = '#0c0806'; ctx.fillRect(x, 0, 1, H);
    ctx.fillStyle = shade(base, k * 1.3, 0.4); ctx.fillRect(x + 1, 0, 1, H);
    if (r() < 0.5) {
      const ky = r() * H;
      ctx.fillStyle = shade(base, 0.45);
      ctx.beginPath(); ctx.ellipse(x + 8, ky, 2.5, 4, 0, 0, Math.PI * 2); ctx.fill();
    }
    // clavos
    ctx.fillStyle = '#15110e';
    ctx.fillRect(x + 7, 8, 2, 2); ctx.fillRect(x + 7, 182, 2, 2); ctx.fillRect(x + 7, 96, 2, 2);
  }
  // viga horizontal
  ctx.fillStyle = shade(base, 0.55); ctx.fillRect(0, 88, W, 14);
  ctx.fillStyle = shade(base, 0.8, 0.6); ctx.fillRect(0, 88, W, 2);
  stains(ctx, 0, 0, W, H, r, 20, [10, 6, 3], 0.5, 26);
  drips(ctx, 0, W, 0, 70, r, 12, [8, 5, 2], 0.3);
  grain(ctx, W, H, r, 20);
}
