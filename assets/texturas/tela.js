// Sábana
import { rng, shade, grain, stains } from '../../js/texlib.js';

export const familia = {
  nombre: 'Sábana',
  descripcion: 'Tela clara con pliegues verticales y manchas; para muebles tapados, manteles y figuras.',
  ancho: 64,
  alto: 64,
  formato: 'objeto',
  parametros: {
    semilla: { tipo: 'entero', etiqueta: 'Semilla aleatoria', min: 1, max: 99999 },
    color: { tipo: 'color', etiqueta: 'Color de la tela' },
  },
  texturas: {
    sabana: { uso: 'Sillones tapados, sábanas, manteles y figuras (m)', semilla: 114, color: '#b3ada2' },
  },
};

export function dibujar(ctx, p) {
  const { color: base } = p;
  const S = ctx.canvas.width;
  const r = rng(p.semilla);
  ctx.fillStyle = shade(base, 1); ctx.fillRect(0, 0, S, S);
  for (let x = 0; x < S; x += 2) {
    const k = 0.82 + 0.18 * Math.sin(x * 0.35 + r() * 0.8);
    ctx.fillStyle = shade(base, k, 0.8); ctx.fillRect(x, 0, 2, S);
  }
  stains(ctx, 0, 0, S, S, r, 8, [60, 50, 35], 0.3, 14);
  grain(ctx, S, S, r, 14);
}
