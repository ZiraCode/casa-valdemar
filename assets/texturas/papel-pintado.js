// Papel pintado
import { rng, shade, grain, stains, drips } from '../../js/texlib.js';

export const familia = {
  nombre: 'Papel pintado',
  descripcion: 'Papel pintado de damasco sobre zócalo de madera con paneles. Manchas de humedad, chorretones y trozos de papel despegado. Dos variantes de 128 px lado a lado.',
  ancho: 256,
  alto: 192,
  formato: 'pared',
  parametros: {
    semilla: { tipo: 'entero', etiqueta: 'Semilla aleatoria', min: 1, max: 99999 },
    fondo: { tipo: 'color', etiqueta: 'Color del papel' },
    tinta: { tipo: 'color', etiqueta: 'Color del dibujo' },
    madera: { tipo: 'color', etiqueta: 'Madera del zócalo' },
  },
  texturas: {
    'pared-principal': { uso: 'Muros de la planta principal', semilla: 21, fondo: '#4a1714', tinta: '#250605', madera: '#3a2416' },
    'pared-segunda': { uso: 'Muros de la segunda planta', semilla: 31, fondo: '#2d3a2b', tinta: '#131b12', madera: '#33251a' },
  },
};

export function dibujar(ctx, p) {
  const { fondo: base, tinta: ink, madera: wood } = p;
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const r = rng(p.semilla);
  ctx.fillStyle = shade(base, 1);
  ctx.fillRect(0, 0, W, H);
  // rayas finas
  for (let x = 0; x < W; x += 16) {
    ctx.fillStyle = shade(ink, 1, 0.22);
    ctx.fillRect(x, 0, 2, 124);
    ctx.fillStyle = shade(base, 1.15, 0.25);
    ctx.fillRect(x + 8, 0, 1, 124);
  }
  // motivos damasco
  for (let row = 0, y = 10; y < 118; y += 26, row++) {
    for (let x = 0; x < W; x += 32) {
      const cx = x + (row % 2 ? 16 : 0) + 8, cy = y + 6;
      ctx.fillStyle = shade(ink, 1, 0.6);
      ctx.strokeStyle = shade(ink, 1, 0.6);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(cx, cy, 2.5, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx, cy - 10); ctx.lineTo(cx + 6, cy); ctx.lineTo(cx, cy + 10); ctx.lineTo(cx - 6, cy); ctx.closePath();
      ctx.stroke();
      ctx.beginPath(); ctx.arc(cx - 7, cy + 5, 1.6, 0, Math.PI * 2); ctx.arc(cx + 7, cy + 5, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(cx - 0.5, cy + 10, 1, 4);
    }
  }
  // moldura superior
  ctx.fillStyle = shade(wood, 0.6); ctx.fillRect(0, 0, W, 5);
  ctx.fillStyle = shade(wood, 1.1); ctx.fillRect(0, 5, W, 1);
  // zócalo de madera
  ctx.fillStyle = shade(wood, 1); ctx.fillRect(0, 124, W, 68);
  ctx.fillStyle = shade(wood, 1.35); ctx.fillRect(0, 122, W, 3);
  ctx.fillStyle = shade(wood, 0.5); ctx.fillRect(0, 125, W, 2);
  for (let x = 0; x < W; x += 64) {
    ctx.fillStyle = shade(wood, 0.62); ctx.fillRect(x + 6, 134, 52, 42);
    ctx.fillStyle = shade(wood, 0.9 + r() * 0.2); ctx.fillRect(x + 9, 137, 46, 36);
    ctx.fillStyle = shade(wood, 1.3, 0.5); ctx.fillRect(x + 6, 134, 52, 1); ctx.fillRect(x + 6, 134, 1, 42);
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = shade(wood, 0.7, 0.4);
      ctx.fillRect(x + 10 + r() * 44, 138, 1, 34);
    }
  }
  ctx.fillStyle = shade(wood, 0.45); ctx.fillRect(0, 182, W, 10);
  // suciedad y humedad
  for (let v = 0; v < 2; v++) {
    const x0 = v * 128;
    stains(ctx, x0, 0, 128, 190, r, 14, [20, 12, 6], 0.45, 30);
    drips(ctx, x0, 128, 5, 90, r, 10, [18, 10, 4], 0.4);
    // papel despegado
    for (let k = 0; k < 3; k++) {
      const px = x0 + r() * 110, py = 10 + r() * 90, pw = 4 + r() * 14, ph = 6 + r() * 20;
      ctx.fillStyle = shade(base, 1.6, 0.35);
      ctx.fillRect(px, py, pw, ph);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(px, py + ph, pw, 2);
    }
  }
  grain(ctx, W, H, r, 22);
}
