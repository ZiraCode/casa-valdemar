// Retratos
import { rng, grain, stains } from '../../js/texlib.js';

export const familia = {
  nombre: 'Retratos',
  descripcion: 'Tira de 4 retratos de 64x80 (normal, ojos arañados, rostro borrado, lágrimas de sangre). Cada cuadro de pared usa uno al azar.',
  ancho: 256,
  alto: 80,
  formato: 'cuadro',
  parametros: {
    semilla: { tipo: 'entero', etiqueta: 'Semilla aleatoria', min: 1, max: 99999 },
  },
  texturas: {
    retratos: { uso: 'Cuadros en muros de las plantas principal y segunda', semilla: 121 },
  },
};

export function dibujar(ctx, p) {
  // 4 retratos de 64x80 en una tira de 256x80
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const r = rng(p.semilla);
  for (let v = 0; v < 4; v++) {
    const x0 = v * 64;
    ctx.fillStyle = '#5c4518'; ctx.fillRect(x0, 0, 64, H);
    ctx.fillStyle = '#8a6a28'; ctx.fillRect(x0 + 2, 2, 60, 2); ctx.fillRect(x0 + 2, 2, 2, 76);
    ctx.fillStyle = '#2e210a'; ctx.fillRect(x0 + 6, 6, 52, 68);
    const g = ctx.createRadialGradient(x0 + 32, 30, 2, x0 + 32, 40, 40);
    g.addColorStop(0, '#2a2118'); g.addColorStop(1, '#070504');
    ctx.fillStyle = g; ctx.fillRect(x0 + 8, 8, 48, 64);
    // cuerpo
    ctx.fillStyle = '#0b0908';
    ctx.beginPath(); ctx.moveTo(x0 + 12, 72); ctx.quadraticCurveTo(x0 + 32, 42, x0 + 52, 72); ctx.fill();
    ctx.fillStyle = '#d8cfbd'; ctx.fillRect(x0 + 29, 50, 6, 6);
    // cara
    if (v === 2) {
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(x0 + 32, 34, 9, 12, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#b8ab94';
      ctx.beginPath(); ctx.ellipse(x0 + 32, 34, 8, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a120c';
      ctx.beginPath(); ctx.ellipse(x0 + 32, 25, 10, 6, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.fillRect(x0 + 27, 32, 3, 3); ctx.fillRect(x0 + 34, 32, 3, 3);
      ctx.fillRect(x0 + 30, 40, 4, 1);
      if (v === 1) {
        // ojos arañados
        ctx.strokeStyle = 'rgba(230,220,200,0.9)'; ctx.lineWidth = 1;
        for (let k = 0; k < 5; k++) {
          ctx.beginPath(); ctx.moveTo(x0 + 24 + r() * 4, 29 + r() * 3); ctx.lineTo(x0 + 38 + r() * 4, 34 + r() * 4); ctx.stroke();
        }
      }
      if (v === 3) {
        ctx.fillStyle = '#6a0a08';
        ctx.fillRect(x0 + 27, 35, 1, 10); ctx.fillRect(x0 + 36, 35, 1, 8);
      }
    }
    stains(ctx, x0 + 6, 6, 52, 68, r, 5, [0, 0, 0], 0.45, 14);
  }
  grain(ctx, W, H, r, 16);
}
