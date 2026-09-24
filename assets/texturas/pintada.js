// Pintada
import { rng } from '../../js/texlib.js';

export const familia = {
  nombre: 'Pintada',
  descripcion: 'Texto escrito con sangre, con chorretones. El juego la genera con cada frase de DECALS (world.js).',
  ancho: 512,
  alto: 160,
  formato: 'pintada',
  filtro: 'suave',
  parametros: {
    semilla: { tipo: 'entero', etiqueta: 'Semilla aleatoria', min: 1, max: 99999 },
    texto: { tipo: 'texto', etiqueta: 'Texto' },
  },
  texturas: {
    pintada: { uso: 'Casillas ! (el texto lo pone world.js)', semilla: 501, texto: 'SIGUE MIRANDO' },
  },
};

export function dibujar(ctx, p) {
  const { texto: text } = p;
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const r = rng(p.semilla);
  ctx.clearRect(0, 0, W, H);
  ctx.font = '52px "Special Elite", "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.translate(W / 2, H / 2 - 10);
  ctx.rotate((r() - 0.5) * 0.12);
  ctx.fillStyle = 'rgba(95,8,6,0.92)';
  ctx.fillText(text, 0, 0);
  ctx.restore();
  // chorretones
  const m = ctx.measureText(text).width;
  for (let k = 0; k < 26; k++) {
    const x = W / 2 - m / 2 + r() * m;
    const y = H / 2 + 2 + r() * 10;
    const len = 8 + r() * 50;
    const g = ctx.createLinearGradient(0, y, 0, y + len);
    g.addColorStop(0, 'rgba(90,6,5,0.85)');
    g.addColorStop(1, 'rgba(90,6,5,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, 1.5 + r() * 2, len);
  }
}
