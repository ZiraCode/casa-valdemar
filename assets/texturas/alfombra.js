// Alfombra
import { rng, grain, stains } from '../../js/texlib.js';

export const familia = {
  nombre: 'Alfombra',
  descripcion: 'Alfombra persa: cenefa, campo de rombos pequeños y medallón central. Se estira sobre rectángulos de varias casillas.',
  ancho: 256,
  alto: 128,
  formato: 'suelo',
  parametros: {
    semilla: { tipo: 'entero', etiqueta: 'Semilla aleatoria', min: 1, max: 99999 },
  },
  texturas: {
    alfombra: { uso: 'Alfombras (lista RUGS de world.js)', semilla: 119 },
  },
};

export function dibujar(ctx, p) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const r = rng(p.semilla);
  ctx.fillStyle = '#2a0907'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#5a1510'; ctx.fillRect(8, 8, W - 16, H - 16);
  ctx.strokeStyle = '#8a6a30'; ctx.lineWidth = 2; ctx.strokeRect(12, 12, W - 24, H - 24);
  ctx.strokeStyle = '#3a0c08'; ctx.lineWidth = 1; ctx.strokeRect(18, 18, W - 36, H - 36);
  // cenefa
  for (let x = 16; x < W - 16; x += 8) {
    ctx.fillStyle = (x / 8) % 2 ? '#7a5a28' : '#2a0907';
    ctx.fillRect(x, 3, 4, 3); ctx.fillRect(x, H - 6, 4, 3);
  }
  // campo con motivos pequeños
  for (let y = 26; y < H - 26; y += 12) {
    for (let x = 26; x < W - 26; x += 12) {
      const odd = ((x + y) / 12) % 2;
      ctx.fillStyle = odd ? '#7a2a1a' : '#3a0e0a';
      ctx.beginPath(); ctx.moveTo(x + 6, y); ctx.lineTo(x + 11, y + 6); ctx.lineTo(x + 6, y + 12); ctx.lineTo(x + 1, y + 6); ctx.closePath(); ctx.fill();
      if (odd) { ctx.fillStyle = '#8a6a30'; ctx.fillRect(x + 5, y + 5, 2, 2); }
    }
  }
  // medallón
  ctx.fillStyle = '#6a1c12';
  ctx.beginPath(); ctx.ellipse(W / 2, H / 2, 34, 22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8a6a30'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(W / 2, H / 2, 34, 22, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(W / 2, H / 2, 18, 11, 0, 0, Math.PI * 2); ctx.stroke();
  // desgaste y manchas
  stains(ctx, 0, 0, W, H, r, 14, [10, 3, 2], 0.45, 26);
  for (let k = 0; k < 300; k++) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(r() * W, r() * H, 1, 1);
  }
  grain(ctx, W, H, r, 18);
}
