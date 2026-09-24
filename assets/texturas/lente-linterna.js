// Lente de la linterna
import { rng } from '../../js/texlib.js';

export const familia = {
  nombre: 'Lente de la linterna',
  descripcion: 'Patrón que proyecta la linterna: centro brillante, anillo y lente con suciedad. Negro = sin luz.',
  ancho: 256,
  alto: 256,
  formato: 'luz',
  filtro: 'suave',
  parametros: {
    semilla: { tipo: 'entero', etiqueta: 'Semilla aleatoria', min: 1, max: 99999 },
  },
  texturas: {
    'lente-linterna': { uso: 'Proyección de la linterna del jugador (SpotLight.map)', semilla: 99 },
  },
};

export function dibujar(ctx, p) {
  const S = ctx.canvas.width;
  const r = rng(p.semilla);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, S, S);
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, '#fff8ec');
  g.addColorStop(0.18, '#f4ead8');
  g.addColorStop(0.3, '#b9ad9a');
  g.addColorStop(0.36, '#d8ccb6');
  g.addColorStop(0.42, '#6e665a');
  g.addColorStop(0.75, '#26221d');
  g.addColorStop(1, '#000');
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  // suciedad en la lente
  for (let k = 0; k < 40; k++) {
    const a = r() * Math.PI * 2, d = r() * 90;
    ctx.fillStyle = `rgba(0,0,0,${0.02 + r() * 0.05})`;
    ctx.beginPath(); ctx.arc(128 + Math.cos(a) * d, 128 + Math.sin(a) * d, 2 + r() * 6, 0, Math.PI * 2); ctx.fill();
  }
}
