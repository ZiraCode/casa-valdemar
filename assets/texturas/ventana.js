// Ventana
import { rng, shade, grain, stains } from '../../js/texlib.js';

export const familia = {
  nombre: 'Ventana',
  descripcion: 'Ventana de noche con luna, árbol desnudo, gotas de lluvia, parteluces y cortinas rojas. La versión «brillo» es el mapa emisivo: solo el cristal, sobre negro.',
  ancho: 256,
  alto: 192,
  formato: 'pared',
  parametros: {
    semilla: { tipo: 'entero', etiqueta: 'Semilla aleatoria', min: 1, max: 99999 },
    pared: { tipo: 'color', etiqueta: 'Color del muro alrededor' },
    brillo: { tipo: 'booleano', etiqueta: 'Mapa emisivo (solo cristal)' },
  },
  texturas: {
    ventana: { uso: 'Casillas w (color)', semilla: 105, pared: '#2a1a14', brillo: false },
    'ventana-brillo': {
      uso: 'Casillas w (brillo de la luna; se intensifica con los relámpagos)',
      semilla: 105,
      pared: '#2a1a14',
      brillo: true,
    },
  },
};

export function dibujar(ctx, p) {
  const { pared: wallHex, brillo: emissive } = p;
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const r = rng(p.semilla);
  for (let v = 0; v < 2; v++) {
    const x0 = v * 128;
    if (emissive) {
      ctx.fillStyle = '#000'; ctx.fillRect(x0, 0, 128, H);
    } else {
      ctx.fillStyle = shade(wallHex, 0.8); ctx.fillRect(x0, 0, 128, H);
      stains(ctx, x0, 0, 128, H, r, 10, [15, 10, 5], 0.5, 30);
    }
    // cristal
    const gx = x0 + 30, gy = 22, gw = 68, gh = 116;
    const g = ctx.createRadialGradient(gx + 50, gy + 20, 2, gx + 40, gy + 40, 110);
    if (emissive) {
      g.addColorStop(0, '#6c80b8'); g.addColorStop(0.4, '#1e2a4a'); g.addColorStop(1, '#070a14');
    } else {
      g.addColorStop(0, '#39486e'); g.addColorStop(0.4, '#121a2e'); g.addColorStop(1, '#05070d');
    }
    ctx.fillStyle = g; ctx.fillRect(gx, gy, gw, gh);
    // silueta de árbol desnudo
    ctx.strokeStyle = emissive ? '#000' : '#020203';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(gx + 14, gy + gh); ctx.lineTo(gx + 20, gy + 50); ctx.lineTo(gx + 8, gy + 20);
    ctx.moveTo(gx + 20, gy + 60); ctx.lineTo(gx + 40, gy + 35); ctx.lineTo(gx + 48, gy + 10);
    ctx.moveTo(gx + 18, gy + 80); ctx.lineTo(gx + 2, gy + 62);
    ctx.stroke();
    // gotas
    for (let k = 0; k < 30; k++) {
      ctx.fillStyle = emissive ? 'rgba(150,170,220,0.5)' : 'rgba(120,140,190,0.35)';
      ctx.fillRect(gx + r() * gw, gy + r() * gh, 1, 1 + r() * 4);
    }
    // parteluces
    ctx.fillStyle = emissive ? '#000' : '#1b120c';
    ctx.fillRect(gx + gw / 2 - 2, gy, 4, gh);
    ctx.fillRect(gx, gy + gh / 3 - 2, gw, 4);
    ctx.fillRect(gx, gy + (2 * gh) / 3 - 2, gw, 4);
    if (!emissive) {
      // marco y alféizar
      ctx.fillStyle = '#2b1c12';
      ctx.fillRect(gx - 6, gy - 6, gw + 12, 6); ctx.fillRect(gx - 6, gy + gh, gw + 12, 10);
      ctx.fillRect(gx - 6, gy, 6, gh); ctx.fillRect(gx + gw, gy, 6, gh);
      ctx.fillStyle = '#4a3322'; ctx.fillRect(gx - 10, gy + gh + 8, gw + 20, 4);
      // cortinas
      for (const side of [0, 1]) {
        const cx = side ? x0 + 100 : x0 + 4;
        for (let f = 0; f < 24; f += 4) {
          ctx.fillStyle = shade(0x4a0f0c, 0.6 + ((f / 4) % 2) * 0.35);
          ctx.fillRect(cx + f, 8, 4, 160);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(cx, 150, 24, 18);
      }
      ctx.fillStyle = '#3a2a14'; ctx.fillRect(x0 + 2, 6, 124, 4);
    }
  }
  if (!emissive) grain(ctx, W, H, r, 16);
}
