// Hoja de puerta
import { rng, shade, grain, stains } from '../../js/texlib.js';

export const familia = {
  nombre: 'Hoja de puerta',
  descripcion: 'Puerta interior de tablones con cuatro cuarterones. Se aplica a una caja de 1,2 x 2,4 m.',
  ancho: 64,
  alto: 128,
  formato: 'objeto',
  parametros: {
    semilla: { tipo: 'entero', etiqueta: 'Semilla aleatoria', min: 1, max: 99999 },
  },
  texturas: {
    'hoja-puerta': { uso: 'Puertas que se abren (D)', semilla: 120 },
  },
};

export function dibujar(ctx, p) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const r = rng(p.semilla);
  ctx.fillStyle = '#2e1c10'; ctx.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 8) {
    ctx.fillStyle = shade(0x3e2616, 0.75 + r() * 0.35); ctx.fillRect(x, 0, 8, H);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x, 0, 1, H);
  }
  for (const [px, py, pw, ph] of [[8, 8, 20, 48], [36, 8, 20, 48], [8, 68, 20, 52], [36, 68, 20, 52]]) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = shade(0x4a2e1a, 0.9); ctx.fillRect(px + 2, py + 2, pw - 4, ph - 4);
    ctx.fillStyle = 'rgba(255,220,180,0.08)'; ctx.fillRect(px + 2, py + 2, pw - 4, 1);
  }
  stains(ctx, 0, 0, W, H, r, 6, [0, 0, 0], 0.45, 16);
  grain(ctx, W, H, r, 16);
}
