// Aparición
import { rng } from '../../js/texlib.js';

export const familia = {
  nombre: 'Aparición',
  descripcion: 'Mujer pálida de pelo negro largo, ojos hundidos y lágrimas negras, con vestido que se desvanece. Fondo transparente. La versión «grito» se usa de cerca o al quemarse.',
  ancho: 128,
  alto: 256,
  formato: 'sprite',
  parametros: {
    semilla: { tipo: 'entero', etiqueta: 'Semilla aleatoria', min: 1, max: 99999 },
    grito: { tipo: 'booleano', etiqueta: 'Boca abierta (grito)' },
  },
  texturas: {
    aparicion: { uso: 'Apariciones en calma', semilla: 17, grito: false },
    'aparicion-grito': { uso: 'Apariciones a menos de 3,8 m o quemándose', semilla: 71, grito: true },
  },
};

export function dibujar(ctx, p) {
  const { grito: scream } = p;
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const r = rng(p.semilla);
  // halo
  ctx.save();
  ctx.translate(64, 118);
  ctx.scale(1, 2);
  let g = ctx.createRadialGradient(0, 0, 4, 0, 0, 58);
  g.addColorStop(0, 'rgba(190,210,235,0.2)');
  g.addColorStop(1, 'rgba(190,210,235,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, 58, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // vestido
  g = ctx.createLinearGradient(0, 64, 0, 256);
  g.addColorStop(0, 'rgba(225,230,236,0.97)');
  g.addColorStop(0.55, 'rgba(175,190,205,0.7)');
  g.addColorStop(1, 'rgba(140,160,185,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(46, 74);
  ctx.quadraticCurveTo(64, 64, 82, 74);
  ctx.lineTo(90, 120);
  ctx.lineTo(102, 250);
  for (let x = 102; x >= 26; x -= 6) ctx.lineTo(x, 226 + r() * 28);
  ctx.lineTo(38, 120);
  ctx.closePath();
  ctx.fill();
  // pliegues
  ctx.strokeStyle = 'rgba(80,95,120,0.28)';
  ctx.lineWidth = 2;
  for (let k = 0; k < 7; k++) {
    ctx.beginPath(); ctx.moveTo(50 + k * 5, 90); ctx.quadraticCurveTo(46 + k * 7, 170, 34 + k * 10, 245); ctx.stroke();
  }
  // brazos colgando, demasiado largos
  ctx.fillStyle = 'rgba(215,222,230,0.9)';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(64 + s * 17, 76);
    ctx.quadraticCurveTo(64 + s * 30, 120, 64 + s * 32, 168);
    ctx.lineTo(64 + s * 26, 168);
    ctx.quadraticCurveTo(64 + s * 22, 120, 64 + s * 12, 84);
    ctx.fill();
    // dedos
    ctx.strokeStyle = 'rgba(215,222,230,0.85)';
    ctx.lineWidth = 1.2;
    for (let f = 0; f < 4; f++) {
      ctx.beginPath();
      ctx.moveTo(64 + s * (26 + f * 2), 166);
      ctx.lineTo(64 + s * (24 + f * 3), 184 + f * 2);
      ctx.stroke();
    }
  }
  // pelo negro por detrás
  ctx.fillStyle = 'rgba(6,6,8,0.96)';
  ctx.beginPath();
  ctx.moveTo(64, 18);
  ctx.bezierCurveTo(36, 18, 38, 60, 34, 138);
  ctx.lineTo(46, 132);
  ctx.bezierCurveTo(50, 90, 48, 60, 52, 42);
  ctx.lineTo(76, 42);
  ctx.bezierCurveTo(80, 60, 78, 90, 82, 132);
  ctx.lineTo(94, 138);
  ctx.bezierCurveTo(90, 60, 92, 18, 64, 18);
  ctx.fill();
  // cara
  g = ctx.createRadialGradient(64, 44, 2, 64, 46, 20);
  g.addColorStop(0, 'rgba(240,244,248,1)');
  g.addColorStop(1, 'rgba(170,185,200,0.95)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(64, 46, 12, 18, 0, 0, Math.PI * 2); ctx.fill();
  // flequillo tapando
  ctx.fillStyle = 'rgba(6,6,8,0.97)';
  ctx.beginPath(); ctx.ellipse(64, 30, 14, 7, 0, Math.PI, 0); ctx.fill();
  ctx.fillRect(52, 28, 4, 30);
  // ojos
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 4;
  ctx.fillStyle = '#000';
  const ey = scream ? 44 : 43;
  const erx = scream ? 4 : 3.2, ery = scream ? 6 : 3.6;
  ctx.beginPath(); ctx.ellipse(58.5, ey, erx, ery, 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(69.5, ey, erx, ery, -0.1, 0, Math.PI * 2); ctx.fill();
  // boca
  ctx.beginPath();
  if (scream) ctx.ellipse(64, 60, 4.5, 9, 0, 0, Math.PI * 2);
  else ctx.ellipse(64, 56, 2.2, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // lágrimas negras
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(58, ey + 3, 1, scream ? 16 : 11);
  ctx.fillRect(70, ey + 3, 1, scream ? 13 : 8);
  // pupilas
  if (!scream) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(58, 43, 1, 1); ctx.fillRect(69, 43, 1, 1);
  }
  // mechones sueltos sobre la cara
  ctx.strokeStyle = 'rgba(5,5,7,0.85)';
  ctx.lineWidth = 1;
  for (let k = 0; k < 10; k++) {
    const sx = 52 + r() * 24;
    ctx.beginPath(); ctx.moveTo(sx, 26); ctx.quadraticCurveTo(sx + (r() - 0.5) * 10, 50, sx + (r() - 0.5) * 16, 70 + r() * 50); ctx.stroke();
  }
  // textura etérea: ruido y líneas
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  for (let y = 0; y < H; y++) {
    const line = y % 3 === 0 ? 0.78 : 1;
    for (let x = 0; x < W; x++) {
      const p = (y * W + x) * 4 + 3;
      d[p] = d[p] * line * (0.82 + r() * 0.18);
    }
  }
  ctx.putImageData(img, 0, 0);
}
