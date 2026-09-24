// Techo de yeso
import { rng, shade, grain, stains } from '../../js/texlib.js';

export const familia = {
  nombre: 'Techo de yeso',
  descripcion: 'Yeso agrietado con cercos de humedad.',
  ancho: 128,
  alto: 128,
  formato: 'techo',
  parametros: {
    semilla: { tipo: 'entero', etiqueta: 'Semilla aleatoria', min: 1, max: 99999 },
    color: { tipo: 'color', etiqueta: 'Color del yeso' },
  },
  texturas: {
    'techo-principal': { uso: 'Techo de la planta principal', semilla: 91, color: '#5f574c' },
    'techo-segunda': { uso: 'Techo de la segunda planta', semilla: 92, color: '#57524a' },
  },
};

export function dibujar(ctx, p) {
  const { color: base } = p;
  const S = ctx.canvas.width;
  const r = rng(p.semilla);
  ctx.fillStyle = shade(base, 1); ctx.fillRect(0, 0, S, S);
  for (let k = 0; k < 3; k++) {
    // manchas de agua con cerco
    const x = r() * S, y = r() * S, rad = 10 + r() * 22;
    ctx.fillStyle = 'rgba(60,40,20,0.2)';
    ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(50,30,12,0.35)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(15,10,6,0.55)'; ctx.lineWidth = 1;
  for (let k = 0; k < 4; k++) {
    let x = r() * S, y = r() * S;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let n = 0; n < 7; n++) { x += (r() - 0.5) * 22; y += (r() - 0.5) * 22; ctx.lineTo(x, y); }
    ctx.stroke();
  }
  stains(ctx, 0, 0, S, S, r, 14, [20, 14, 8], 0.35, 20);
  grain(ctx, S, S, r, 24);
}
