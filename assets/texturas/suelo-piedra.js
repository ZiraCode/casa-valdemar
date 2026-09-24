// Losas de piedra
import { rng, shade, grain, stains } from '../../js/texlib.js';

export const familia = {
  nombre: 'Losas de piedra',
  descripcion: 'Losas cuadradas de piedra con grietas y humedad.',
  ancho: 128,
  alto: 128,
  formato: 'suelo',
  parametros: {
    semilla: { tipo: 'entero', etiqueta: 'Semilla aleatoria', min: 1, max: 99999 },
  },
  texturas: {
    'suelo-sotano': { uso: 'Suelo del sótano', semilla: 51 },
    piedra: { uso: 'Peanas de los ataúdes y losa de la chimenea', semilla: 118 },
  },
};

export function dibujar(ctx, p) {
  const S = ctx.canvas.width;
  const r = rng(p.semilla);
  ctx.fillStyle = '#141210'; ctx.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y += 32) {
    for (let x = 0; x < S; x += 32) {
      const k = 0.65 + r() * 0.4;
      ctx.fillStyle = shade(0x45403a, k);
      ctx.fillRect(x + 1, y + 1, 30, 30);
      ctx.fillStyle = shade(0x45403a, k * 1.2, 0.5); ctx.fillRect(x + 1, y + 1, 30, 1);
      if (r() < 0.5) {
        ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1;
        ctx.beginPath(); let cx = x + r() * 30, cy = y + 1; ctx.moveTo(cx, cy);
        for (let n = 0; n < 5; n++) { cx += (r() - 0.5) * 10; cy += 6; ctx.lineTo(cx, cy); }
        ctx.stroke();
      }
    }
  }
  stains(ctx, 0, 0, S, S, r, 12, [6, 10, 4], 0.55, 20);
  grain(ctx, S, S, r, 26);
}
