// Madera
import { rng, shade, grain } from '../../js/texlib.js';

export const familia = {
  nombre: 'Madera',
  descripcion: 'Madera lisa con vetas horizontales y algún nudo, para muebles.',
  ancho: 64,
  alto: 64,
  formato: 'objeto',
  parametros: {
    semilla: { tipo: 'entero', etiqueta: 'Semilla aleatoria', min: 1, max: 99999 },
    color: { tipo: 'color', etiqueta: 'Color de la madera' },
  },
  texturas: {
    'madera-oscura': { uso: 'Marcos de puerta, vigas, piano, reloj, ataúdes y mamperlanes', semilla: 111, color: '#2a1a10' },
    madera: { uso: 'Mesas, sillas, camas, mecedoras y escaleras (salvo la principal)', semilla: 112, color: '#3a2416' },
    'madera-clara': { uso: 'Barriles', semilla: 113, color: '#5a3e28' },
  },
};

export function dibujar(ctx, p) {
  const { color: base } = p;
  const S = ctx.canvas.width;
  const r = rng(p.semilla);
  ctx.fillStyle = shade(base, 1); ctx.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y++) {
    if (r() < 0.45) { ctx.fillStyle = shade(base, 0.6 + r() * 0.6, 0.5); ctx.fillRect(0, y, S, 1); }
  }
  for (let k = 0; k < 3; k++) {
    ctx.strokeStyle = shade(base, 0.5, 0.6);
    ctx.beginPath(); ctx.ellipse(r() * S, r() * S, 2 + r() * 3, 1 + r() * 2, 0, 0, Math.PI * 2); ctx.stroke();
  }
  grain(ctx, S, S, r, 14);
}
