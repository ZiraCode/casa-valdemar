// Techo de tablas
import { rng, shade, grain, stains } from '../../js/texlib.js';

export const familia = {
  nombre: 'Techo de tablas',
  descripcion: 'Tablas oscuras con telarañas en dos esquinas.',
  ancho: 128,
  alto: 128,
  formato: 'techo',
  parametros: {
    semilla: { tipo: 'entero', etiqueta: 'Semilla aleatoria', min: 1, max: 99999 },
    color: { tipo: 'color', etiqueta: 'Color de la madera' },
  },
  texturas: {
    'techo-sotano': { uso: 'Techo del sótano', semilla: 81, color: '#221a14' },
    'techo-buhardilla': { uso: 'Techo de la buhardilla', semilla: 93, color: '#2e2118' },
  },
};

export function dibujar(ctx, p) {
  const { color: base } = p;
  const S = ctx.canvas.width;
  const r = rng(p.semilla);
  for (let y = 0; y < S; y += 16) {
    const k = 0.6 + r() * 0.4;
    ctx.fillStyle = shade(base, k); ctx.fillRect(0, y, S, 16);
    for (let n = 0; n < 4; n++) { ctx.fillStyle = shade(base, k * 0.7, 0.6); ctx.fillRect(0, y + r() * 16, S, 1); }
    ctx.fillStyle = '#060403'; ctx.fillRect(0, y, S, 1);
  }
  stains(ctx, 0, 0, S, S, r, 10, [0, 0, 0], 0.5, 22);
  // telarañas en las esquinas
  ctx.strokeStyle = 'rgba(210,210,200,0.22)'; ctx.lineWidth = 0.7;
  for (let k = 0; k < 8; k++) {
    ctx.beginPath(); ctx.moveTo(0, k * 4); ctx.lineTo(k * 5, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(S, S - k * 4); ctx.lineTo(S - k * 5, S); ctx.stroke();
  }
  grain(ctx, S, S, r, 18);
}
