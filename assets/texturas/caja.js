// Caja de madera
import { rng, shade, grain, stains } from '../../js/texlib.js';

export const familia = {
  nombre: 'Caja de madera',
  descripcion: 'Cara de caja de embalaje con marco y travesaño en diagonal.',
  ancho: 64,
  alto: 64,
  formato: 'objeto',
  parametros: {
    semilla: { tipo: 'entero', etiqueta: 'Semilla aleatoria', min: 1, max: 99999 },
  },
  texturas: {
    caja: { uso: 'Cajas apiladas (x) y soporte de las velas del sótano y la buhardilla', semilla: 117 },
  },
};

export function dibujar(ctx, p) {
  const S = ctx.canvas.width;
  const r = rng(p.semilla);
  for (let y = 0; y < S; y += 16) {
    ctx.fillStyle = shade(0x5a4430, 0.7 + r() * 0.35); ctx.fillRect(0, y, S, 16);
    ctx.fillStyle = '#140d08'; ctx.fillRect(0, y, S, 1);
  }
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(0, 0, S, 5); ctx.fillRect(0, S - 5, S, 5); ctx.fillRect(0, 0, 5, S); ctx.fillRect(S - 5, 0, 5, S);
  ctx.save(); ctx.translate(S / 2, S / 2); ctx.rotate(Math.PI / 4); ctx.fillRect(-45, -3, 90, 6); ctx.restore();
  ctx.fillStyle = '#0d0907';
  for (const [x, y] of [[2, 2], [S - 4, 2], [2, S - 4], [S - 4, S - 4]]) ctx.fillRect(x, y, 2, 2);
  stains(ctx, 0, 0, S, S, r, 5, [0, 0, 0], 0.4, 14);
  grain(ctx, S, S, r, 16);
}
