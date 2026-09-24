// Lente de la linterna
import { rng } from '../../js/texlib.js';

export const familia = {
  nombre: 'Lente de la linterna',
  descripcion: 'Patrón que proyecta la linterna sobre el cono de luz: brillo que cae desde el centro hasta el borde (negro = sin luz), un anillo tenue y suciedad en la lente. La dureza decide si la luz se reparte o se concentra en el centro. En el juego, los valores de js/iluminacion.js (LUZ.lente) sustituyen a los de aquí.',
  ancho: 256,
  alto: 256,
  formato: 'luz',
  filtro: 'suave',
  parametros: {
    semilla: { tipo: 'entero', etiqueta: 'Semilla aleatoria', min: 1, max: 99999 },
    dureza: { tipo: 'numero', etiqueta: 'Dureza (0 repartida, 1 concentrada)', min: 0, max: 1, paso: 0.05 },
    anillo: { tipo: 'numero', etiqueta: 'Anillo', min: 0, max: 1, paso: 0.05 },
    suciedad: { tipo: 'entero', etiqueta: 'Manchas de la lente', min: 0, max: 80 },
  },
  texturas: {
    'lente-linterna': { uso: 'Proyección de la linterna del jugador (SpotLight.map)', semilla: 99, dureza: 0.3, anillo: 0.2, suciedad: 20 },
  },
};

export function dibujar(ctx, p) {
  const S = ctx.canvas.width;
  const r = rng(p.semilla);
  const c = S / 2;
  // perfil radial: 1 en el centro, 0 en el borde; la dureza lo afila
  const exp = 0.5 + 2.5 * p.dureza;
  const img = ctx.createImageData(S, S);
  const d = img.data;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const rr = Math.hypot(x + 0.5 - c, y + 0.5 - c) / c;
      let b = 0;
      if (rr < 1) {
        const t = 1 - rr * rr * (3 - 2 * rr);              // suave hasta 0 en el borde
        b = Math.pow(t, exp);
        b += p.anillo * 0.3 * Math.exp(-(((rr - 0.55) / 0.07) ** 2)) * t;
      }
      const i = (y * S + x) * 4;
      d[i] = Math.min(255, 255 * b);
      d[i + 1] = Math.min(255, 247 * b);
      d[i + 2] = Math.min(255, 232 * b);
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // suciedad en la lente
  for (let k = 0; k < p.suciedad; k++) {
    const a = r() * Math.PI * 2, dist = r() * c * 0.75;
    ctx.fillStyle = `rgba(0,0,0,${0.02 + r() * 0.05})`;
    ctx.beginPath(); ctx.arc(c + Math.cos(a) * dist, c + Math.sin(a) * dist, 2 + r() * 8, 0, Math.PI * 2); ctx.fill();
  }
}
