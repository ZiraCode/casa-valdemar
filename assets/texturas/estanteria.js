// Estantería
import { rng, shade, grain, stains } from '../../js/texlib.js';

export const familia = {
  nombre: 'Estantería',
  descripcion: 'Estantería de cinco baldas con libros de colores apagados, alguno caído, y telarañas en las esquinas. Se usa como bloque de muro (k).',
  ancho: 256,
  alto: 192,
  formato: 'pared',
  parametros: {
    semilla: { tipo: 'entero', etiqueta: 'Semilla aleatoria', min: 1, max: 99999 },
  },
  texturas: {
    estanteria: { uso: 'Casillas k de las plantas principal y segunda', semilla: 101 },
  },
};

export function dibujar(ctx, p) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const r = rng(p.semilla);
  ctx.fillStyle = '#2a1a10'; ctx.fillRect(0, 0, W, H);
  const cols = [0x5a1a14, 0x1e3a24, 0x23304f, 0x5b4a22, 0x3b2a1e, 0x6b5a45, 0x2b1b2e, 0x40120e];
  for (let v = 0; v < 2; v++) {
    const x0 = v * 128;
    ctx.fillStyle = '#1a0f09'; ctx.fillRect(x0 + 6, 6, 116, 180);
    for (let s = 0; s < 5; s++) {
      const y = 10 + s * 36;
      let x = x0 + 8;
      while (x < x0 + 118) {
        const bw = 3 + Math.floor(r() * 6);
        if (r() < 0.08) { x += bw + 4; continue; }
        const bh = 20 + Math.floor(r() * 10);
        const col = cols[Math.floor(r() * cols.length)];
        const k = 0.6 + r() * 0.5;
        if (r() < 0.07) {
          // libro caído
          ctx.fillStyle = shade(col, k);
          ctx.save(); ctx.translate(x, y + 30); ctx.rotate(-0.5); ctx.fillRect(0, -bh, bw, bh); ctx.restore();
          x += bw + 8;
          continue;
        }
        ctx.fillStyle = shade(col, k);
        ctx.fillRect(x, y + 30 - bh, bw, bh);
        ctx.fillStyle = shade(0xc8a860, 0.8, 0.5);
        ctx.fillRect(x, y + 30 - bh + 4, bw, 1);
        ctx.fillRect(x, y + 24, bw, 1);
        x += bw + (r() < 0.2 ? 1 : 0);
      }
      ctx.fillStyle = '#3b2616'; ctx.fillRect(x0 + 4, y + 30, 120, 5);
      ctx.fillStyle = '#56381f'; ctx.fillRect(x0 + 4, y + 30, 120, 1);
    }
    ctx.fillStyle = '#3b2616';
    ctx.fillRect(x0, 0, 6, H); ctx.fillRect(x0 + 122, 0, 6, H); ctx.fillRect(x0, 0, 128, 6);
    // telarañas
    ctx.strokeStyle = 'rgba(200,200,190,0.25)';
    ctx.lineWidth = 0.6;
    for (let k = 0; k < 6; k++) {
      ctx.beginPath(); ctx.moveTo(x0 + 6, 6 + k * 3); ctx.lineTo(x0 + 6 + k * 4, 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x0 + 6, 6); ctx.lineTo(x0 + 6 + 20 - k * 3, 6 + k * 4); ctx.stroke();
    }
  }
  stains(ctx, 0, 0, W, H, r, 10, [0, 0, 0], 0.35, 30);
  grain(ctx, W, H, r, 18);
}
