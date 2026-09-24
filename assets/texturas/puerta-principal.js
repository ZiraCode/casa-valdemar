// Puerta principal
import { rng, shade, grain } from '../../js/texlib.js';

export const familia = {
  nombre: 'Puerta principal',
  descripcion: 'Puerta de entrada de tablones oscuros con cuarterones, aldaba y arañazos. Es un muro que no se abre (E).',
  ancho: 256,
  alto: 192,
  formato: 'pared',
  parametros: {
    semilla: { tipo: 'entero', etiqueta: 'Semilla aleatoria', min: 1, max: 99999 },
  },
  texturas: {
    'puerta-principal': { uso: 'Casillas E del vestíbulo', semilla: 104 },
  },
};

export function dibujar(ctx, p) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const r = rng(p.semilla);
  for (let v = 0; v < 2; v++) {
    const x0 = v * 128;
    ctx.fillStyle = '#2a2320'; ctx.fillRect(x0, 0, 128, H);
    ctx.fillStyle = '#1b120b'; ctx.fillRect(x0 + 10, 14, 108, 178);
    for (let x = x0 + 14; x < x0 + 114; x += 10) {
      ctx.fillStyle = shade(0x3a2616, 0.8 + r() * 0.3); ctx.fillRect(x, 18, 9, 174);
    }
    for (const [px, py] of [[x0 + 22, 30], [x0 + 70, 30], [x0 + 22, 110], [x0 + 70, 110]]) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(px, py, 36, 66);
      ctx.fillStyle = 'rgba(120,80,50,0.25)'; ctx.fillRect(px + 3, py + 3, 30, 60);
    }
    // aldaba y cerrojo
    ctx.fillStyle = '#6a5423';
    ctx.beginPath(); ctx.arc(x0 + 64, 100, 7, 0, Math.PI * 2); ctx.lineWidth = 2; ctx.strokeStyle = '#6a5423'; ctx.stroke();
    ctx.fillRect(x0 + (v ? 18 : 102), 104, 6, 16);
    // arañazos
    ctx.strokeStyle = 'rgba(190,160,130,0.35)';
    ctx.lineWidth = 1;
    for (let k = 0; k < 4; k++) {
      const sx = x0 + 40 + k * 6;
      ctx.beginPath(); ctx.moveTo(sx, 120); ctx.lineTo(sx - 4 + r() * 8, 175); ctx.stroke();
    }
  }
  grain(ctx, W, H, r, 18);
}
