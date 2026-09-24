// Cuadros hechos fuera (imágenes en assets/cuadros/)
import { rng, grain, stains } from '../../js/texlib.js';

export const familia = {
  nombre: 'Cuadros (imágenes)',
  descripcion: 'Cuadros creados fuera del juego, con su marco incluido. Cada uno tiene versión normal y tétrica: la tétrica se ve fuera del haz de la linterna, durante los relámpagos y, tras el evento, siempre (ver assets/cuadros.js). Aquí solo se integran en el estilo con un barniz oscuro y algo de grano.',
  ancho: 200,
  alto: 236,
  formato: 'cuadro',
  usaImagen: true,
  anchoMax: 200,
  parametros: {
    semilla: { tipo: 'entero', etiqueta: 'Semilla aleatoria', min: 1, max: 99999 },
    barniz: { tipo: 'numero', etiqueta: 'Barniz (oscurece y amarillea)', min: 0, max: 1, paso: 0.05 },
    manchas: { tipo: 'entero', etiqueta: 'Manchas de humedad', min: 0, max: 30 },
    grano: { tipo: 'entero', etiqueta: 'Grano', min: 0, max: 60 },
  },
  texturas: {
    'cuadro-casa': { uso: 'La casa del páramo (normal)', imagen: '../cuadros/casa.png', semilla: 7, barniz: 0.15, manchas: 4, grano: 12 },
    'cuadro-casa-tetrica': { uso: 'La casa del páramo (tétrica)', imagen: '../cuadros/casa-tetrica.webp', semilla: 7, barniz: 0.15, manchas: 4, grano: 12 },
    'cuadro-familia': { uso: 'Los Valdemar (normal)', imagen: '../cuadros/familia.png', semilla: 9, barniz: 0.15, manchas: 4, grano: 12 },
    'cuadro-familia-tetrica': { uso: 'Los Valdemar (tétrica)', imagen: '../cuadros/familia-tetrica.png', semilla: 9, barniz: 0.15, manchas: 4, grano: 12 },
  },
};

export function dibujar(ctx, p) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  if (!p.imagen) {
    // sin imagen (no debería ocurrir): lienzo negro con un aviso
    ctx.fillStyle = '#100a08'; ctx.fillRect(0, 0, W, H);
    return;
  }
  const r = rng(p.semilla);
  // reducción de calidad alta: solo actúa si la imagen es más ancha que anchoMax
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(p.imagen, 0, 0, W, H);
  // barniz viejo: oscurece con un tono ámbar
  if (p.barniz > 0) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(${Math.round(255 - 120 * p.barniz)},${Math.round(255 - 150 * p.barniz)},${Math.round(255 - 200 * p.barniz)},1)`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  }
  if (p.manchas > 0) stains(ctx, 0, 0, W, H, r, p.manchas, [20, 12, 4], 0.35, 24);
  if (p.grano > 0) grain(ctx, W, H, r, p.grano);
}
