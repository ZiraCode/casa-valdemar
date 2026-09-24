// Aparición: la niña
import { rng } from '../../js/texlib.js';

export const familia = {
  nombre: 'Aparición: la niña',
  descripcion: 'Niña pálida con camisón de encaje, melena negra con flequillo que le tapa las cejas, cabeza ladeada y una muñeca de trapo colgando de la mano. Las piernas se desvanecen antes de llegar al suelo. Fondo transparente; la versión «grito» abre la boca y los ojos.',
  ancho: 80,
  alto: 160,
  formato: 'sprite',
  animacion: { fotogramas: 4, fps: 5 },
  parametros: {
    semilla: { tipo: 'entero', etiqueta: 'Semilla aleatoria', min: 1, max: 99999 },
    grito: { tipo: 'booleano', etiqueta: 'Boca abierta (grito)' },
    cinta: { tipo: 'color', etiqueta: 'Color de la cinta y del vestido de la muñeca' },
  },
  texturas: {
    'aparicion-nina': { uso: 'La niña en calma (cuartos infantiles)', semilla: 23, grito: false, cinta: '#5a1612' },
    'aparicion-nina-grito': { uso: 'La niña de cerca o quemándose', semilla: 23, grito: true, cinta: '#5a1612' },
  },
};

export function dibujar(ctx, p) {
  const { grito: scream, cinta } = p;
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const r = rng(p.semilla);
  // vaivén del fotograma: 0 → quieta, ±1 → extremos
  const sw = Math.sin(((p.fotograma || 0) / familia.animacion.fotogramas) * Math.PI * 2);
  const cx = W / 2;

  // halo
  ctx.save();
  ctx.translate(cx, 84);
  ctx.scale(1, 2.1);
  let g = ctx.createRadialGradient(0, 0, 3, 0, 0, 36);
  g.addColorStop(0, 'rgba(190,210,235,0.2)');
  g.addColorStop(1, 'rgba(190,210,235,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, 36, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // piernas que se desvanecen antes de los pies
  g = ctx.createLinearGradient(0, 112, 0, 154);
  g.addColorStop(0, 'rgba(214,221,230,0.95)');
  g.addColorStop(1, 'rgba(200,210,225,0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - 8, 112, 5, 42);
  ctx.fillRect(cx + 3, 112, 5, 42);
  ctx.fillStyle = 'rgba(70,58,52,0.35)';
  ctx.fillRect(cx - 8, 124, 5, 3);
  ctx.fillRect(cx + 3, 126, 5, 2);

  // camisón
  g = ctx.createLinearGradient(0, 46, 0, 122);
  g.addColorStop(0, 'rgba(228,232,238,0.97)');
  g.addColorStop(1, 'rgba(182,196,212,0.82)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(cx - 9, 48);
  ctx.quadraticCurveTo(cx, 44, cx + 9, 48);
  ctx.lineTo(cx + 11, 70);
  ctx.lineTo(cx + 17 + sw * 2, 117);
  for (let k = 0; k < 8; k++) {
    // bajo festoneado
    const x0 = cx + 17 - k * 4.25 + sw * 2;
    ctx.quadraticCurveTo(x0 - 2.1, 123 + r() * 2, x0 - 4.25, 117 + r());
  }
  ctx.lineTo(cx - 11, 70);
  ctx.closePath();
  ctx.fill();
  // encaje del bajo
  ctx.fillStyle = 'rgba(250,250,255,0.75)';
  for (let k = 0; k < 11; k++) ctx.fillRect(cx - 16 + k * 3.2 + sw * 2, 118 + (k % 2), 1, 1);
  // pliegues
  ctx.strokeStyle = 'rgba(80,95,120,0.25)';
  ctx.lineWidth = 1;
  for (let k = 0; k < 5; k++) {
    ctx.beginPath();
    ctx.moveTo(cx - 6 + k * 3, 56);
    ctx.quadraticCurveTo(cx - 8 + k * 4, 90, cx - 12 + k * 6 + sw * 1.5, 116);
    ctx.stroke();
  }
  // manchas en el camisón
  for (let k = 0; k < 4; k++) {
    ctx.fillStyle = 'rgba(70,55,45,0.18)';
    ctx.beginPath(); ctx.ellipse(cx - 9 + r() * 18, 70 + r() * 40, 2 + r() * 3, 1.5 + r() * 2, 0, 0, Math.PI * 2); ctx.fill();
  }
  // cinta del cuello
  ctx.fillStyle = cinta;
  ctx.fillRect(cx - 3, 46, 6, 2);
  ctx.fillRect(cx - 1, 48, 2, 4);

  // brazos flacos, perfilados para que se separen del camisón
  ctx.lineCap = 'round';
  const brazo = (lado, finX, finY) => {
    ctx.beginPath(); ctx.moveTo(cx + lado * 9, 51); ctx.quadraticCurveTo(cx + lado * 16, 70, finX, finY); ctx.stroke();
  };
  for (const [w, col] of [[4.5, 'rgba(60,70,90,0.55)'], [3, 'rgba(214,221,230,0.97)']]) {
    ctx.lineWidth = w;
    ctx.strokeStyle = col;
    brazo(1, cx + 17 + sw * 0.5, 91);
    brazo(-1, cx - 17, 90);
  }
  ctx.lineWidth = 1;
  for (let f = 0; f < 3; f++) {
    ctx.beginPath(); ctx.moveTo(cx + 16 + f, 91); ctx.lineTo(cx + 15 + f * 1.5 + sw * 0.5, 96); ctx.stroke();
  }

  // muñeca de trapo colgando de la mano izquierda
  ctx.save();
  ctx.translate(cx - 17, 91);
  ctx.rotate(sw * 0.18);
  ctx.strokeStyle = 'rgba(150,120,95,0.95)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 5); ctx.stroke();            // brazo de la muñeca
  ctx.fillStyle = cinta;
  ctx.beginPath(); ctx.moveTo(-4, 5); ctx.lineTo(4, 5); ctx.lineTo(6, 17); ctx.lineTo(-6, 17); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(160,130,105,1)';
  ctx.beginPath(); ctx.arc(0, 21, 4, 0, Math.PI * 2); ctx.fill();               // cabeza boca abajo
  ctx.fillStyle = 'rgba(70,40,22,1)';
  ctx.fillRect(-4, 23, 8, 3);                                                     // pelo de lana
  ctx.fillStyle = '#000';
  ctx.fillRect(-2, 20, 1, 1);                                                     // un ojo de botón
  ctx.fillRect(1, 19, 2, 1); ctx.fillRect(1, 21, 2, 1);                           // el otro, cosido en cruz
  ctx.strokeStyle = 'rgba(150,120,95,0.95)';
  ctx.beginPath(); ctx.moveTo(-3, 17); ctx.lineTo(-4, 13); ctx.moveTo(3, 17); ctx.lineTo(5, 13); ctx.stroke();
  ctx.restore();

  // cuello y cabeza ladeada
  ctx.fillStyle = 'rgba(214,221,230,0.97)';
  ctx.fillRect(cx - 2, 41, 4, 6);
  ctx.save();
  ctx.translate(cx, 32);
  ctx.rotate(-0.16 + sw * 0.025);
  // melena por detrás
  ctx.fillStyle = 'rgba(8,7,9,0.97)';
  ctx.beginPath(); ctx.ellipse(0, -1, 13, 13, 0, Math.PI, 0); ctx.fill();
  ctx.fillRect(-13, -2, 26, 13);
  // cara
  g = ctx.createRadialGradient(0, 1, 1, 0, 2, 12);
  g.addColorStop(0, 'rgba(242,245,249,1)');
  g.addColorStop(1, 'rgba(172,186,202,0.96)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(0, 2, 9, 11, 0, 0, Math.PI * 2); ctx.fill();
  // flequillo recto y mechones laterales
  ctx.fillStyle = 'rgba(8,7,9,0.98)';
  ctx.fillRect(-11, -12, 22, 9);
  for (let k = 0; k < 7; k++) ctx.fillRect(-10 + k * 3, -3, 2, 1 + Math.floor(r() * 3));
  ctx.fillRect(-11, -4, 3, 16);
  ctx.fillRect(8, -4, 3, 16);
  // ojos
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 3;
  ctx.fillStyle = '#000';
  const erx = scream ? 2.7 : 2.1, ery = scream ? 3.8 : 2.4;
  ctx.beginPath(); ctx.ellipse(-3.8, 1.5, erx, ery, 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(3.8, 1.5, erx, ery, -0.1, 0, Math.PI * 2); ctx.fill();
  // boca
  ctx.beginPath();
  if (scream) ctx.ellipse(0, 8.5, 2.3, 4.5 + Math.abs(sw), 0, 0, Math.PI * 2);
  else ctx.ellipse(0, 7, 1.1, 1.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // lágrimas negras
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(-4, 4, 1, scream ? 9 : 6);
  ctx.fillRect(3, 4, 1, scream ? 7 : 4);
  if (!scream) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(-4, 1, 1, 1);
    ctx.fillRect(3, 1, 1, 1);
  }
  // mechones sueltos sobre la cara
  ctx.strokeStyle = 'rgba(5,5,7,0.85)';
  ctx.lineWidth = 0.8;
  for (let k = 0; k < 5; k++) {
    const sx = -7 + r() * 14;
    ctx.beginPath(); ctx.moveTo(sx, -4); ctx.quadraticCurveTo(sx + (r() - 0.5) * 5, 4, sx + (r() - 0.5) * 7 + sw * 0.8, 10 + r() * 6); ctx.stroke();
  }
  ctx.restore();

  // textura etérea: ruido y líneas
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  for (let y = 0; y < H; y++) {
    const line = y % 3 === 0 ? 0.78 : 1;
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4 + 3;
      d[i] = d[i] * line * (0.82 + r() * 0.18);
    }
  }
  ctx.putImageData(img, 0, 0);
}
