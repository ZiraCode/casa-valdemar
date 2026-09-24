// Muro de piedra
import { rng, shade, grain, stains, drips } from '../../js/texlib.js';

export const familia = {
  nombre: 'Muro de piedra',
  descripcion: 'Sillares de piedra irregulares con mortero, humedad verdosa en la base y chorretones. Dos variantes lado a lado.',
  ancho: 256,
  alto: 192,
  formato: 'pared',
  parametros: {
    semilla: { tipo: 'entero', etiqueta: 'Semilla aleatoria', min: 1, max: 99999 },
    color: { tipo: 'color', etiqueta: 'Color de la piedra' },
  },
  texturas: {
    'pared-sotano': { uso: 'Muros del sótano', semilla: 11, color: '#514a42' },
  },
};

export function dibujar(ctx, p) {
  const { color: base } = p;
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const r = rng(p.semilla);
  ctx.fillStyle = '#1a1714';
  ctx.fillRect(0, 0, W, H);
  for (let y = 0, row = 0; y < H; y += 24, row++) {
    let x = row % 2 ? -18 : 0;
    while (x < W) {
      const w = 26 + Math.floor(r() * 26);
      const k = 0.7 + r() * 0.5;
      ctx.fillStyle = shade(base, k);
      ctx.fillRect(x + 2, y + 2, w - 3, 21);
      ctx.fillStyle = shade(base, k * 1.25, 0.6); ctx.fillRect(x + 2, y + 2, w - 3, 2);
      ctx.fillStyle = shade(base, k * 0.6, 0.7); ctx.fillRect(x + 2, y + 20, w - 3, 3);
      for (let n = 0; n < 5; n++) {
        ctx.fillStyle = shade(base, k * (0.6 + r() * 0.3), 0.6);
        ctx.fillRect(x + 3 + r() * (w - 6), y + 4 + r() * 16, 2 + r() * 4, 1 + r() * 3);
      }
      x += w;
    }
  }
  // humedad en la base
  const g = ctx.createLinearGradient(0, 120, 0, H);
  g.addColorStop(0, 'rgba(10,18,8,0)');
  g.addColorStop(1, 'rgba(10,20,8,0.65)');
  ctx.fillStyle = g; ctx.fillRect(0, 120, W, 72);
  stains(ctx, 0, 0, W, H, r, 26, [8, 12, 4], 0.5, 22);
  drips(ctx, 0, W, 0, 110, r, 20, [5, 8, 3], 0.45);
  grain(ctx, W, H, r, 26);
}
