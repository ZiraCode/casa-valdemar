// Esfera de reloj

export const familia = {
  nombre: 'Esfera de reloj',
  descripcion: 'Esfera del reloj de pie, con las agujas paradas en las 3:07.',
  ancho: 64,
  alto: 64,
  formato: 'objeto',
  parametros: {},
  texturas: {
    'esfera-reloj': { uso: 'Relojes de pie (n)' },
  },
};

export function dibujar(ctx, p) {
  const S = ctx.canvas.width;
  ctx.fillStyle = '#1d140c'; ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = '#c8bc9c';
  ctx.beginPath(); ctx.arc(32, 32, 28, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a120a';
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    ctx.fillRect(32 + Math.cos(a) * 23 - 1, 32 + Math.sin(a) * 23 - 1, 3, 3);
  }
  // agujas paradas en las 3:07
  ctx.strokeStyle = '#0a0705'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(32, 32); ctx.lineTo(50, 34); ctx.stroke();
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(32, 32); ctx.lineTo(36, 12); ctx.stroke();
}
