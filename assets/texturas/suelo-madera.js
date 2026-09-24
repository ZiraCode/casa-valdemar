// Suelo de tarima
import { rng, shade, grain, stains } from '../../js/texlib.js';

export const familia = {
  nombre: 'Suelo de tarima',
  descripcion: 'Tarima de tablas horizontales desfasadas, con vetas, juntas negras, clavos y manchas. Cubre una casilla de 2x2 m.',
  ancho: 128,
  alto: 128,
  formato: 'suelo',
  parametros: {
    semilla: { tipo: 'entero', etiqueta: 'Semilla aleatoria', min: 1, max: 99999 },
    color: { tipo: 'color', etiqueta: 'Color de la madera' },
  },
  texturas: {
    'suelo-principal': { uso: 'Suelo de la planta principal', semilla: 52, color: '#4a2f1c' },
    'suelo-segunda': { uso: 'Suelo de la segunda planta', semilla: 62, color: '#3e2a1c' },
    'suelo-buhardilla': { uso: 'Suelo de la buhardilla', semilla: 72, color: '#3b2c20' },
  },
};

export function dibujar(ctx, p) {
  const { color: base } = p;
  const S = ctx.canvas.width;
  const r = rng(p.semilla);
  for (let y = 0; y < S; y += 16) {
    let x = -Math.floor(r() * 64);
    while (x < S) {
      const w = 40 + Math.floor(r() * 50);
      const k = 0.65 + r() * 0.45;
      ctx.fillStyle = shade(base, k); ctx.fillRect(x, y, w, 16);
      for (let n = 0; n < 5; n++) {
        ctx.fillStyle = shade(base, k * 0.72, 0.55);
        ctx.fillRect(x, y + 2 + r() * 12, w, 1);
      }
      ctx.fillStyle = '#0b0705'; ctx.fillRect(x, y, 1, 16);
      ctx.fillStyle = '#1c120b'; ctx.fillRect(x + 3, y + 7, 1, 1); ctx.fillRect(x + w - 4, y + 7, 1, 1);
      x += w;
    }
    ctx.fillStyle = '#090604'; ctx.fillRect(0, y + 15, S, 1);
  }
  stains(ctx, 0, 0, S, S, r, 8, [10, 6, 2], 0.5, 22);
  grain(ctx, S, S, r, 18);
}
