// Halo

export const familia = {
  nombre: 'Halo',
  descripcion: 'Resplandor radial cálido alrededor de cada punto de luz.',
  ancho: 64,
  alto: 64,
  formato: 'sprite',
  filtro: 'suave',
  mezcla: 'aditiva',
  parametros: {},
  texturas: {
    halo: { uso: 'Halos de velas, candiles y chimenea' },
  },
};

export function dibujar(ctx, p) {
  const S = ctx.canvas.width;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,190,110,0.55)');
  g.addColorStop(0.35, 'rgba(255,140,50,0.18)');
  g.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
}
