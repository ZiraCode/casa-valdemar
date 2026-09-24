// Llama

export const familia = {
  nombre: 'Llama',
  descripcion: 'Gradiente de llama alargada; se dibuja en sprites con mezcla aditiva.',
  ancho: 32,
  alto: 64,
  formato: 'sprite',
  filtro: 'suave',
  mezcla: 'aditiva',
  parametros: {},
  texturas: {
    llama: { uso: 'Velas, candiles y fuego de la chimenea' },
  },
};

export function dibujar(ctx, p) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.save();
  ctx.translate(16, 42);
  ctx.scale(1, 2.2);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 14);
  g.addColorStop(0, 'rgba(255,250,220,1)');
  g.addColorStop(0.25, 'rgba(255,200,90,0.95)');
  g.addColorStop(0.6, 'rgba(230,90,20,0.45)');
  g.addColorStop(1, 'rgba(120,20,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
