// Terciopelo
import { rng, shade, grain } from '../../js/texlib.js';

export const familia = {
  nombre: 'Terciopelo',
  descripcion: 'Terciopelo con brillos irregulares y ribete dorado arriba y abajo.',
  ancho: 64,
  alto: 64,
  formato: 'objeto',
  parametros: {
    semilla: { tipo: 'entero', etiqueta: 'Semilla aleatoria', min: 1, max: 99999 },
    color: { tipo: 'color', etiqueta: 'Color del terciopelo' },
  },
  texturas: {
    terciopelo: { uso: 'Asientos de sillas, libros del escritorio y vestido de la muñeca', semilla: 115, color: '#4a0e0c' },
    'moqueta-escalera': { uso: 'Escalera principal', semilla: 116, color: '#520e0b' },
  },
};

export function dibujar(ctx, p) {
  const { color: base } = p;
  const S = ctx.canvas.width;
  const r = rng(p.semilla);
  ctx.fillStyle = shade(base, 1); ctx.fillRect(0, 0, S, S);
  for (let k = 0; k < 20; k++) {
    ctx.fillStyle = shade(base, 0.7 + r() * 0.6, 0.35);
    ctx.fillRect(r() * S, r() * S, 2 + r() * 10, 1 + r() * 3);
  }
  ctx.fillStyle = shade(0x8a6a2a, 0.9); ctx.fillRect(0, 0, S, 3); ctx.fillRect(0, S - 3, S, 3);
  grain(ctx, S, S, r, 18);
}
