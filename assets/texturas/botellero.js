// Botellero
import { rng, grain, stains } from '../../js/texlib.js';

export const familia = {
  nombre: 'Botellero',
  descripcion: 'Botellero de madera con celdas; la mayoría con botellas verdes o marrones vistas desde el culo.',
  ancho: 256,
  alto: 192,
  formato: 'pared',
  parametros: {
    semilla: { tipo: 'entero', etiqueta: 'Semilla aleatoria', min: 1, max: 99999 },
  },
  texturas: {
    botellero: { uso: 'Casillas k del sótano', semilla: 102 },
  },
};

export function dibujar(ctx, p) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const r = rng(p.semilla);
  ctx.fillStyle = '#231710'; ctx.fillRect(0, 0, W, H);
  for (let y = 4; y < H - 10; y += 16) {
    for (let x = 4; x < W; x += 16) {
      ctx.fillStyle = '#0a0605'; ctx.fillRect(x, y, 14, 14);
      if (r() < 0.78) {
        ctx.fillStyle = r() < 0.5 ? '#0f2412' : '#1c0f0a';
        ctx.beginPath(); ctx.arc(x + 7, y + 7, 5.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(160,190,150,0.35)';
        ctx.fillRect(x + 4, y + 4, 2, 2);
        ctx.fillStyle = 'rgba(80,20,15,0.8)';
        ctx.beginPath(); ctx.arc(x + 7, y + 7, 1.8, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  ctx.fillStyle = '#3a2618'; ctx.fillRect(0, H - 12, W, 12);
  stains(ctx, 0, 0, W, H, r, 16, [60, 60, 55], 0.12, 30);
  grain(ctx, W, H, r, 18);
}
