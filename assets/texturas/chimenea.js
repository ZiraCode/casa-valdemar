// Chimenea
import { rng, shade, grain, stains } from '../../js/texlib.js';

export const familia = {
  nombre: 'Chimenea',
  descripcion: 'Frente de chimenea de piedra con repisa, columnas, boca negra con hollín y un marco vacío encima. El fuego real son sprites delante.',
  ancho: 256,
  alto: 192,
  formato: 'pared',
  parametros: {
    semilla: { tipo: 'entero', etiqueta: 'Semilla aleatoria', min: 1, max: 99999 },
  },
  texturas: {
    chimenea: { uso: 'Casillas F (salón)', semilla: 103 },
  },
};

export function dibujar(ctx, p) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const r = rng(p.semilla);
  for (let v = 0; v < 2; v++) {
    const x0 = v * 128;
    ctx.fillStyle = '#3d3630'; ctx.fillRect(x0, 0, 128, H);
    // piedra
    for (let y = 0; y < H; y += 12) {
      for (let x = x0 + ((y / 12) % 2 ? -8 : 0); x < x0 + 128; x += 16) {
        const k = 0.7 + r() * 0.4;
        ctx.fillStyle = shade(0x5a5048, k);
        ctx.fillRect(x + 1, y + 1, 15, 11);
      }
    }
    // repisa
    ctx.fillStyle = '#2a1c12'; ctx.fillRect(x0 + 6, 86, 116, 10);
    ctx.fillStyle = '#4a3220'; ctx.fillRect(x0 + 6, 86, 116, 2);
    ctx.fillStyle = '#1a110b'; ctx.fillRect(x0 + 10, 96, 108, 3);
    // columnas
    ctx.fillStyle = '#6a6058'; ctx.fillRect(x0 + 14, 99, 14, 93); ctx.fillRect(x0 + 100, 99, 14, 93);
    ctx.fillStyle = '#7d736a'; ctx.fillRect(x0 + 14, 99, 3, 93); ctx.fillRect(x0 + 100, 99, 3, 93);
    // boca negra
    const g = ctx.createLinearGradient(0, 104, 0, 192);
    g.addColorStop(0, '#030202'); g.addColorStop(0.7, '#120806'); g.addColorStop(1, '#2a1208');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x0 + 28, 192); ctx.lineTo(x0 + 28, 120);
    ctx.quadraticCurveTo(x0 + 64, 98, x0 + 100, 120); ctx.lineTo(x0 + 100, 192); ctx.closePath();
    ctx.fill();
    // hollín
    stains(ctx, x0 + 30, 70, 68, 40, r, 10, [5, 3, 2], 0.6, 20);
    // retrato encima (marco vacío)
    ctx.fillStyle = '#5a4520'; ctx.fillRect(x0 + 38, 18, 52, 58);
    ctx.fillStyle = '#0c0907'; ctx.fillRect(x0 + 43, 23, 42, 48);
    ctx.fillStyle = 'rgba(200,190,170,0.15)';
    ctx.beginPath(); ctx.ellipse(x0 + 64, 44, 9, 12, 0, 0, Math.PI * 2); ctx.fill();
  }
  grain(ctx, W, H, r, 20);
}
