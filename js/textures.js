// Texturas procedurales dibujadas en canvas (sin ficheros externos).
import * as THREE from 'three';

export function rng(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

const rgb = (r, g, b, a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a})`;
const hx = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
function shade(hex, k, a = 1) {
  const [r, g, b] = hx(hex);
  return rgb(Math.min(255, r * k), Math.min(255, g * k), Math.min(255, b * k), a);
}

export function toTexture(c, { nearest = true, repeat = false, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = nearest ? THREE.NearestFilter : THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.anisotropy = 4;
  t.wrapS = t.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  return t;
}

function grain(ctx, w, h, r, amt) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * amt;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

function stains(ctx, x0, y0, w, h, r, count, col = [25, 15, 6], maxA = 0.35, maxR = 26) {
  for (let k = 0; k < count; k++) {
    const x = x0 + r() * w, y = y0 + r() * h, rad = 4 + r() * maxR;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, rgb(col[0], col[1], col[2], maxA * r()));
    g.addColorStop(0.7, rgb(col[0], col[1], col[2], maxA * 0.3 * r()));
    g.addColorStop(1, rgb(col[0], col[1], col[2], 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
}

function drips(ctx, x0, w, yStart, h, r, count, col = [20, 12, 5], alpha = 0.35) {
  for (let k = 0; k < count; k++) {
    const x = x0 + r() * w;
    const len = 10 + r() * h;
    const wd = 1 + r() * 2;
    const g = ctx.createLinearGradient(0, yStart, 0, yStart + len);
    g.addColorStop(0, rgb(col[0], col[1], col[2], alpha * (0.5 + r() * 0.5)));
    g.addColorStop(1, rgb(col[0], col[1], col[2], 0));
    ctx.fillStyle = g;
    ctx.fillRect(x, yStart, wd, len);
  }
}

// ---------------------------------------------------------------- paredes
// Todas las texturas de pared miden 256x192: dos variantes de 128 px lado a lado.

export function wallpaper(seed, base, ink, wood) {
  const W = 256, H = 192;
  const [c, ctx] = mk(W, H);
  const r = rng(seed);
  ctx.fillStyle = shade(base, 1);
  ctx.fillRect(0, 0, W, H);
  // rayas finas
  for (let x = 0; x < W; x += 16) {
    ctx.fillStyle = shade(ink, 1, 0.22);
    ctx.fillRect(x, 0, 2, 124);
    ctx.fillStyle = shade(base, 1.15, 0.25);
    ctx.fillRect(x + 8, 0, 1, 124);
  }
  // motivos damasco
  for (let row = 0, y = 10; y < 118; y += 26, row++) {
    for (let x = 0; x < W; x += 32) {
      const cx = x + (row % 2 ? 16 : 0) + 8, cy = y + 6;
      ctx.fillStyle = shade(ink, 1, 0.6);
      ctx.strokeStyle = shade(ink, 1, 0.6);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(cx, cy, 2.5, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx, cy - 10); ctx.lineTo(cx + 6, cy); ctx.lineTo(cx, cy + 10); ctx.lineTo(cx - 6, cy); ctx.closePath();
      ctx.stroke();
      ctx.beginPath(); ctx.arc(cx - 7, cy + 5, 1.6, 0, Math.PI * 2); ctx.arc(cx + 7, cy + 5, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(cx - 0.5, cy + 10, 1, 4);
    }
  }
  // moldura superior
  ctx.fillStyle = shade(wood, 0.6); ctx.fillRect(0, 0, W, 5);
  ctx.fillStyle = shade(wood, 1.1); ctx.fillRect(0, 5, W, 1);
  // zócalo de madera
  ctx.fillStyle = shade(wood, 1); ctx.fillRect(0, 124, W, 68);
  ctx.fillStyle = shade(wood, 1.35); ctx.fillRect(0, 122, W, 3);
  ctx.fillStyle = shade(wood, 0.5); ctx.fillRect(0, 125, W, 2);
  for (let x = 0; x < W; x += 64) {
    ctx.fillStyle = shade(wood, 0.62); ctx.fillRect(x + 6, 134, 52, 42);
    ctx.fillStyle = shade(wood, 0.9 + r() * 0.2); ctx.fillRect(x + 9, 137, 46, 36);
    ctx.fillStyle = shade(wood, 1.3, 0.5); ctx.fillRect(x + 6, 134, 52, 1); ctx.fillRect(x + 6, 134, 1, 42);
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = shade(wood, 0.7, 0.4);
      ctx.fillRect(x + 10 + r() * 44, 138, 1, 34);
    }
  }
  ctx.fillStyle = shade(wood, 0.45); ctx.fillRect(0, 182, W, 10);
  // suciedad y humedad
  for (let v = 0; v < 2; v++) {
    const x0 = v * 128;
    stains(ctx, x0, 0, 128, 190, r, 14, [20, 12, 6], 0.45, 30);
    drips(ctx, x0, 128, 5, 90, r, 10, [18, 10, 4], 0.4);
    // papel despegado
    for (let k = 0; k < 3; k++) {
      const px = x0 + r() * 110, py = 10 + r() * 90, pw = 4 + r() * 14, ph = 6 + r() * 20;
      ctx.fillStyle = shade(base, 1.6, 0.35);
      ctx.fillRect(px, py, pw, ph);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(px, py + ph, pw, 2);
    }
  }
  grain(ctx, W, H, r, 22);
  return c;
}

export function stoneWall(seed, base = 0x514a42) {
  const W = 256, H = 192;
  const [c, ctx] = mk(W, H);
  const r = rng(seed);
  ctx.fillStyle = '#1a1714';
  ctx.fillRect(0, 0, W, H);
  for (let y = 0, row = 0; y < H; y += 24, row++) {
    let x = row % 2 ? -18 : 0;
    while (x < W) {
      const w = 26 + Math.floor(r() * 26);
      const k = 0.7 + r() * 0.5;
      ctx.fillStyle = shade(base, k);
      ctx.fillRect(x + 2, y + 2, w - 3, 21);
      ctx.fillStyle = shade(base, k * 1.25, 0.6); ctx.fillRect(x + 2, y + 2, w - 3, 2);
      ctx.fillStyle = shade(base, k * 0.6, 0.7); ctx.fillRect(x + 2, y + 20, w - 3, 3);
      for (let n = 0; n < 5; n++) {
        ctx.fillStyle = shade(base, k * (0.6 + r() * 0.3), 0.6);
        ctx.fillRect(x + 3 + r() * (w - 6), y + 4 + r() * 16, 2 + r() * 4, 1 + r() * 3);
      }
      x += w;
    }
  }
  // humedad en la base
  const g = ctx.createLinearGradient(0, 120, 0, H);
  g.addColorStop(0, 'rgba(10,18,8,0)');
  g.addColorStop(1, 'rgba(10,20,8,0.65)');
  ctx.fillStyle = g; ctx.fillRect(0, 120, W, 72);
  stains(ctx, 0, 0, W, H, r, 26, [8, 12, 4], 0.5, 22);
  drips(ctx, 0, W, 0, 110, r, 20, [5, 8, 3], 0.45);
  grain(ctx, W, H, r, 26);
  return c;
}

export function planksWall(seed, base = 0x4a3526) {
  const W = 256, H = 192;
  const [c, ctx] = mk(W, H);
  const r = rng(seed);
  for (let x = 0; x < W; x += 16) {
    const k = 0.7 + r() * 0.45;
    ctx.fillStyle = shade(base, k); ctx.fillRect(x, 0, 16, H);
    for (let n = 0; n < 8; n++) {
      ctx.fillStyle = shade(base, k * 0.75, 0.6);
      ctx.fillRect(x + 1 + r() * 13, 0, 1, H);
    }
    ctx.fillStyle = '#0c0806'; ctx.fillRect(x, 0, 1, H);
    ctx.fillStyle = shade(base, k * 1.3, 0.4); ctx.fillRect(x + 1, 0, 1, H);
    if (r() < 0.5) {
      const ky = r() * H;
      ctx.fillStyle = shade(base, 0.45);
      ctx.beginPath(); ctx.ellipse(x + 8, ky, 2.5, 4, 0, 0, Math.PI * 2); ctx.fill();
    }
    // clavos
    ctx.fillStyle = '#15110e';
    ctx.fillRect(x + 7, 8, 2, 2); ctx.fillRect(x + 7, 182, 2, 2); ctx.fillRect(x + 7, 96, 2, 2);
  }
  // viga horizontal
  ctx.fillStyle = shade(base, 0.55); ctx.fillRect(0, 88, W, 14);
  ctx.fillStyle = shade(base, 0.8, 0.6); ctx.fillRect(0, 88, W, 2);
  stains(ctx, 0, 0, W, H, r, 20, [10, 6, 3], 0.5, 26);
  drips(ctx, 0, W, 0, 70, r, 12, [8, 5, 2], 0.3);
  grain(ctx, W, H, r, 20);
  return c;
}

export function bookshelf(seed) {
  const W = 256, H = 192;
  const [c, ctx] = mk(W, H);
  const r = rng(seed);
  ctx.fillStyle = '#2a1a10'; ctx.fillRect(0, 0, W, H);
  const cols = [0x5a1a14, 0x1e3a24, 0x23304f, 0x5b4a22, 0x3b2a1e, 0x6b5a45, 0x2b1b2e, 0x40120e];
  for (let v = 0; v < 2; v++) {
    const x0 = v * 128;
    ctx.fillStyle = '#1a0f09'; ctx.fillRect(x0 + 6, 6, 116, 180);
    for (let s = 0; s < 5; s++) {
      const y = 10 + s * 36;
      let x = x0 + 8;
      while (x < x0 + 118) {
        const bw = 3 + Math.floor(r() * 6);
        if (r() < 0.08) { x += bw + 4; continue; }
        const bh = 20 + Math.floor(r() * 10);
        const col = cols[Math.floor(r() * cols.length)];
        const k = 0.6 + r() * 0.5;
        if (r() < 0.07) {
          // libro caído
          ctx.fillStyle = shade(col, k);
          ctx.save(); ctx.translate(x, y + 30); ctx.rotate(-0.5); ctx.fillRect(0, -bh, bw, bh); ctx.restore();
          x += bw + 8;
          continue;
        }
        ctx.fillStyle = shade(col, k);
        ctx.fillRect(x, y + 30 - bh, bw, bh);
        ctx.fillStyle = shade(0xc8a860, 0.8, 0.5);
        ctx.fillRect(x, y + 30 - bh + 4, bw, 1);
        ctx.fillRect(x, y + 24, bw, 1);
        x += bw + (r() < 0.2 ? 1 : 0);
      }
      ctx.fillStyle = '#3b2616'; ctx.fillRect(x0 + 4, y + 30, 120, 5);
      ctx.fillStyle = '#56381f'; ctx.fillRect(x0 + 4, y + 30, 120, 1);
    }
    ctx.fillStyle = '#3b2616';
    ctx.fillRect(x0, 0, 6, H); ctx.fillRect(x0 + 122, 0, 6, H); ctx.fillRect(x0, 0, 128, 6);
    // telarañas
    ctx.strokeStyle = 'rgba(200,200,190,0.25)';
    ctx.lineWidth = 0.6;
    for (let k = 0; k < 6; k++) {
      ctx.beginPath(); ctx.moveTo(x0 + 6, 6 + k * 3); ctx.lineTo(x0 + 6 + k * 4, 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x0 + 6, 6); ctx.lineTo(x0 + 6 + 20 - k * 3, 6 + k * 4); ctx.stroke();
    }
  }
  stains(ctx, 0, 0, W, H, r, 10, [0, 0, 0], 0.35, 30);
  grain(ctx, W, H, r, 18);
  return c;
}

export function wineRack(seed) {
  const W = 256, H = 192;
  const [c, ctx] = mk(W, H);
  const r = rng(seed);
  ctx.fillStyle = '#231710'; ctx.fillRect(0, 0, W, H);
  for (let y = 4; y < H - 10; y += 16) {
    for (let x = 4; x < W; x += 16) {
      ctx.fillStyle = '#0a0605'; ctx.fillRect(x, y, 14, 14);
      if (r() < 0.78) {
        ctx.fillStyle = r() < 0.5 ? '#0f2412' : '#1c0f0a';
        ctx.beginPath(); ctx.arc(x + 7, y + 7, 5.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(160,190,150,0.35)';
        ctx.fillRect(x + 4, y + 4, 2, 2);
        ctx.fillStyle = 'rgba(80,20,15,0.8)';
        ctx.beginPath(); ctx.arc(x + 7, y + 7, 1.8, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  ctx.fillStyle = '#3a2618'; ctx.fillRect(0, H - 12, W, 12);
  stains(ctx, 0, 0, W, H, r, 16, [60, 60, 55], 0.12, 30);
  grain(ctx, W, H, r, 18);
  return c;
}

export function fireplace(seed) {
  const W = 256, H = 192;
  const [c, ctx] = mk(W, H);
  const r = rng(seed);
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
  return c;
}

export function windowTex(seed, wallHex, emissive = false) {
  const W = 256, H = 192;
  const [c, ctx] = mk(W, H);
  const r = rng(seed);
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
  return c;
}

export function frontDoor(seed) {
  const W = 256, H = 192;
  const [c, ctx] = mk(W, H);
  const r = rng(seed);
  for (let v = 0; v < 2; v++) {
    const x0 = v * 128;
    ctx.fillStyle = '#2a2320'; ctx.fillRect(x0, 0, 128, H);
    ctx.fillStyle = '#1b120b'; ctx.fillRect(x0 + 10, 14, 108, 178);
    for (let x = x0 + 14; x < x0 + 114; x += 10) {
      ctx.fillStyle = shade(0x3a2616, 0.8 + r() * 0.3); ctx.fillRect(x, 18, 9, 174);
    }
    for (const [px, py] of [[x0 + 22, 30], [x0 + 70, 30], [x0 + 22, 110], [x0 + 70, 110]]) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(px, py, 36, 66);
      ctx.fillStyle = 'rgba(120,80,50,0.25)'; ctx.fillRect(px + 3, py + 3, 30, 60);
    }
    // aldaba y cerrojo
    ctx.fillStyle = '#6a5423';
    ctx.beginPath(); ctx.arc(x0 + 64, 100, 7, 0, Math.PI * 2); ctx.lineWidth = 2; ctx.strokeStyle = '#6a5423'; ctx.stroke();
    ctx.fillRect(x0 + (v ? 18 : 102), 104, 6, 16);
    // arañazos
    ctx.strokeStyle = 'rgba(190,160,130,0.35)';
    ctx.lineWidth = 1;
    for (let k = 0; k < 4; k++) {
      const sx = x0 + 40 + k * 6;
      ctx.beginPath(); ctx.moveTo(sx, 120); ctx.lineTo(sx - 4 + r() * 8, 175); ctx.stroke();
    }
  }
  grain(ctx, W, H, r, 18);
  return c;
}

// ---------------------------------------------------------------- suelos / techos (128x128)

export function woodFloor(seed, base = 0x4a2f1c) {
  const S = 128;
  const [c, ctx] = mk(S, S);
  const r = rng(seed);
  for (let y = 0; y < S; y += 16) {
    let x = -Math.floor(r() * 64);
    while (x < S) {
      const w = 40 + Math.floor(r() * 50);
      const k = 0.65 + r() * 0.45;
      ctx.fillStyle = shade(base, k); ctx.fillRect(x, y, w, 16);
      for (let n = 0; n < 5; n++) {
        ctx.fillStyle = shade(base, k * 0.72, 0.55);
        ctx.fillRect(x, y + 2 + r() * 12, w, 1);
      }
      ctx.fillStyle = '#0b0705'; ctx.fillRect(x, y, 1, 16);
      ctx.fillStyle = '#1c120b'; ctx.fillRect(x + 3, y + 7, 1, 1); ctx.fillRect(x + w - 4, y + 7, 1, 1);
      x += w;
    }
    ctx.fillStyle = '#090604'; ctx.fillRect(0, y + 15, S, 1);
  }
  stains(ctx, 0, 0, S, S, r, 8, [10, 6, 2], 0.5, 22);
  grain(ctx, S, S, r, 18);
  return c;
}

export function stoneFloor(seed) {
  const S = 128;
  const [c, ctx] = mk(S, S);
  const r = rng(seed);
  ctx.fillStyle = '#141210'; ctx.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y += 32) {
    for (let x = 0; x < S; x += 32) {
      const k = 0.65 + r() * 0.4;
      ctx.fillStyle = shade(0x45403a, k);
      ctx.fillRect(x + 1, y + 1, 30, 30);
      ctx.fillStyle = shade(0x45403a, k * 1.2, 0.5); ctx.fillRect(x + 1, y + 1, 30, 1);
      if (r() < 0.5) {
        ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1;
        ctx.beginPath(); let cx = x + r() * 30, cy = y + 1; ctx.moveTo(cx, cy);
        for (let n = 0; n < 5; n++) { cx += (r() - 0.5) * 10; cy += 6; ctx.lineTo(cx, cy); }
        ctx.stroke();
      }
    }
  }
  stains(ctx, 0, 0, S, S, r, 12, [6, 10, 4], 0.55, 20);
  grain(ctx, S, S, r, 26);
  return c;
}

export function plaster(seed, base = 0x5f574c) {
  const S = 128;
  const [c, ctx] = mk(S, S);
  const r = rng(seed);
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
  return c;
}

export function beamCeiling(seed, base = 0x2e2118) {
  const S = 128;
  const [c, ctx] = mk(S, S);
  const r = rng(seed);
  for (let y = 0; y < S; y += 16) {
    const k = 0.6 + r() * 0.4;
    ctx.fillStyle = shade(base, k); ctx.fillRect(0, y, S, 16);
    for (let n = 0; n < 4; n++) { ctx.fillStyle = shade(base, k * 0.7, 0.6); ctx.fillRect(0, y + r() * 16, S, 1); }
    ctx.fillStyle = '#060403'; ctx.fillRect(0, y, S, 1);
  }
  stains(ctx, 0, 0, S, S, r, 10, [0, 0, 0], 0.5, 22);
  // telarañas en las esquinas
  ctx.strokeStyle = 'rgba(210,210,200,0.22)'; ctx.lineWidth = 0.7;
  for (let k = 0; k < 8; k++) {
    ctx.beginPath(); ctx.moveTo(0, k * 4); ctx.lineTo(k * 5, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(S, S - k * 4); ctx.lineTo(S - k * 5, S); ctx.stroke();
  }
  grain(ctx, S, S, r, 18);
  return c;
}

// ---------------------------------------------------------------- objetos

export function woodTex(seed, base = 0x3a2416) {
  const S = 64;
  const [c, ctx] = mk(S, S);
  const r = rng(seed);
  ctx.fillStyle = shade(base, 1); ctx.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y++) {
    if (r() < 0.45) { ctx.fillStyle = shade(base, 0.6 + r() * 0.6, 0.5); ctx.fillRect(0, y, S, 1); }
  }
  for (let k = 0; k < 3; k++) {
    ctx.strokeStyle = shade(base, 0.5, 0.6);
    ctx.beginPath(); ctx.ellipse(r() * S, r() * S, 2 + r() * 3, 1 + r() * 2, 0, 0, Math.PI * 2); ctx.stroke();
  }
  grain(ctx, S, S, r, 14);
  return c;
}

export function crateTex(seed) {
  const S = 64;
  const [c, ctx] = mk(S, S);
  const r = rng(seed);
  for (let y = 0; y < S; y += 16) {
    ctx.fillStyle = shade(0x5a4430, 0.7 + r() * 0.35); ctx.fillRect(0, y, S, 16);
    ctx.fillStyle = '#140d08'; ctx.fillRect(0, y, S, 1);
  }
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(0, 0, S, 5); ctx.fillRect(0, S - 5, S, 5); ctx.fillRect(0, 0, 5, S); ctx.fillRect(S - 5, 0, 5, S);
  ctx.save(); ctx.translate(S / 2, S / 2); ctx.rotate(Math.PI / 4); ctx.fillRect(-45, -3, 90, 6); ctx.restore();
  ctx.fillStyle = '#0d0907';
  for (const [x, y] of [[2, 2], [S - 4, 2], [2, S - 4], [S - 4, S - 4]]) ctx.fillRect(x, y, 2, 2);
  stains(ctx, 0, 0, S, S, r, 5, [0, 0, 0], 0.4, 14);
  grain(ctx, S, S, r, 16);
  return c;
}

export function fabricTex(seed, base = 0xb3ada2) {
  const S = 64;
  const [c, ctx] = mk(S, S);
  const r = rng(seed);
  ctx.fillStyle = shade(base, 1); ctx.fillRect(0, 0, S, S);
  for (let x = 0; x < S; x += 2) {
    const k = 0.82 + 0.18 * Math.sin(x * 0.35 + r() * 0.8);
    ctx.fillStyle = shade(base, k, 0.8); ctx.fillRect(x, 0, 2, S);
  }
  stains(ctx, 0, 0, S, S, r, 8, [60, 50, 35], 0.3, 14);
  grain(ctx, S, S, r, 14);
  return c;
}

export function velvetTex(seed, base = 0x4a0e0c) {
  const S = 64;
  const [c, ctx] = mk(S, S);
  const r = rng(seed);
  ctx.fillStyle = shade(base, 1); ctx.fillRect(0, 0, S, S);
  for (let k = 0; k < 20; k++) {
    ctx.fillStyle = shade(base, 0.7 + r() * 0.6, 0.35);
    ctx.fillRect(r() * S, r() * S, 2 + r() * 10, 1 + r() * 3);
  }
  ctx.fillStyle = shade(0x8a6a2a, 0.9); ctx.fillRect(0, 0, S, 3); ctx.fillRect(0, S - 3, S, 3);
  grain(ctx, S, S, r, 18);
  return c;
}

export function rugTex(seed) {
  const W = 256, H = 128;
  const [c, ctx] = mk(W, H);
  const r = rng(seed);
  ctx.fillStyle = '#2a0907'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#5a1510'; ctx.fillRect(8, 8, W - 16, H - 16);
  ctx.strokeStyle = '#8a6a30'; ctx.lineWidth = 2; ctx.strokeRect(12, 12, W - 24, H - 24);
  ctx.strokeStyle = '#3a0c08'; ctx.lineWidth = 1; ctx.strokeRect(18, 18, W - 36, H - 36);
  // cenefa
  for (let x = 16; x < W - 16; x += 8) {
    ctx.fillStyle = (x / 8) % 2 ? '#7a5a28' : '#2a0907';
    ctx.fillRect(x, 3, 4, 3); ctx.fillRect(x, H - 6, 4, 3);
  }
  // campo con motivos pequeños
  for (let y = 26; y < H - 26; y += 12) {
    for (let x = 26; x < W - 26; x += 12) {
      const odd = ((x + y) / 12) % 2;
      ctx.fillStyle = odd ? '#7a2a1a' : '#3a0e0a';
      ctx.beginPath(); ctx.moveTo(x + 6, y); ctx.lineTo(x + 11, y + 6); ctx.lineTo(x + 6, y + 12); ctx.lineTo(x + 1, y + 6); ctx.closePath(); ctx.fill();
      if (odd) { ctx.fillStyle = '#8a6a30'; ctx.fillRect(x + 5, y + 5, 2, 2); }
    }
  }
  // medallón
  ctx.fillStyle = '#6a1c12';
  ctx.beginPath(); ctx.ellipse(W / 2, H / 2, 34, 22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8a6a30'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(W / 2, H / 2, 34, 22, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(W / 2, H / 2, 18, 11, 0, 0, Math.PI * 2); ctx.stroke();
  // desgaste y manchas
  stains(ctx, 0, 0, W, H, r, 14, [10, 3, 2], 0.45, 26);
  for (let k = 0; k < 300; k++) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(r() * W, r() * H, 1, 1);
  }
  grain(ctx, W, H, r, 18);
  return c;
}

export function doorLeaf(seed) {
  const W = 64, H = 128;
  const [c, ctx] = mk(W, H);
  const r = rng(seed);
  ctx.fillStyle = '#2e1c10'; ctx.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 8) {
    ctx.fillStyle = shade(0x3e2616, 0.75 + r() * 0.35); ctx.fillRect(x, 0, 8, H);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x, 0, 1, H);
  }
  for (const [px, py, pw, ph] of [[8, 8, 20, 48], [36, 8, 20, 48], [8, 68, 20, 52], [36, 68, 20, 52]]) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = shade(0x4a2e1a, 0.9); ctx.fillRect(px + 2, py + 2, pw - 4, ph - 4);
    ctx.fillStyle = 'rgba(255,220,180,0.08)'; ctx.fillRect(px + 2, py + 2, pw - 4, 1);
  }
  stains(ctx, 0, 0, W, H, r, 6, [0, 0, 0], 0.45, 16);
  grain(ctx, W, H, r, 16);
  return c;
}

export function portraits(seed) {
  // 4 retratos de 64x80 en una tira de 256x80
  const W = 256, H = 80;
  const [c, ctx] = mk(W, H);
  const r = rng(seed);
  for (let v = 0; v < 4; v++) {
    const x0 = v * 64;
    ctx.fillStyle = '#5c4518'; ctx.fillRect(x0, 0, 64, H);
    ctx.fillStyle = '#8a6a28'; ctx.fillRect(x0 + 2, 2, 60, 2); ctx.fillRect(x0 + 2, 2, 2, 76);
    ctx.fillStyle = '#2e210a'; ctx.fillRect(x0 + 6, 6, 52, 68);
    const g = ctx.createRadialGradient(x0 + 32, 30, 2, x0 + 32, 40, 40);
    g.addColorStop(0, '#2a2118'); g.addColorStop(1, '#070504');
    ctx.fillStyle = g; ctx.fillRect(x0 + 8, 8, 48, 64);
    // cuerpo
    ctx.fillStyle = '#0b0908';
    ctx.beginPath(); ctx.moveTo(x0 + 12, 72); ctx.quadraticCurveTo(x0 + 32, 42, x0 + 52, 72); ctx.fill();
    ctx.fillStyle = '#d8cfbd'; ctx.fillRect(x0 + 29, 50, 6, 6);
    // cara
    if (v === 2) {
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(x0 + 32, 34, 9, 12, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#b8ab94';
      ctx.beginPath(); ctx.ellipse(x0 + 32, 34, 8, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a120c';
      ctx.beginPath(); ctx.ellipse(x0 + 32, 25, 10, 6, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.fillRect(x0 + 27, 32, 3, 3); ctx.fillRect(x0 + 34, 32, 3, 3);
      ctx.fillRect(x0 + 30, 40, 4, 1);
      if (v === 1) {
        // ojos arañados
        ctx.strokeStyle = 'rgba(230,220,200,0.9)'; ctx.lineWidth = 1;
        for (let k = 0; k < 5; k++) {
          ctx.beginPath(); ctx.moveTo(x0 + 24 + r() * 4, 29 + r() * 3); ctx.lineTo(x0 + 38 + r() * 4, 34 + r() * 4); ctx.stroke();
        }
      }
      if (v === 3) {
        ctx.fillStyle = '#6a0a08';
        ctx.fillRect(x0 + 27, 35, 1, 10); ctx.fillRect(x0 + 36, 35, 1, 8);
      }
    }
    stains(ctx, x0 + 6, 6, 52, 68, r, 5, [0, 0, 0], 0.45, 14);
  }
  grain(ctx, W, H, r, 16);
  return c;
}

export function clockFace() {
  const S = 64;
  const [c, ctx] = mk(S, S);
  ctx.fillStyle = '#1d140c'; ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = '#c8bc9c';
  ctx.beginPath(); ctx.arc(32, 32, 28, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a120a';
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    ctx.fillRect(32 + Math.cos(a) * 23 - 1, 32 + Math.sin(a) * 23 - 1, 3, 3);
  }
  // agujas paradas en las 3:07
  ctx.strokeStyle = '#0a0705'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(32, 32); ctx.lineTo(50, 34); ctx.stroke();
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(32, 32); ctx.lineTo(36, 12); ctx.stroke();
  return c;
}

// ---------------------------------------------------------------- efectos

export function flameTex() {
  const W = 32, H = 64;
  const [c, ctx] = mk(W, H);
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
  return c;
}

export function glowTex() {
  const S = 64;
  const [c, ctx] = mk(S, S);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,190,110,0.55)');
  g.addColorStop(0.35, 'rgba(255,140,50,0.18)');
  g.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  return c;
}

export function flashlightCookie() {
  const S = 256;
  const [c, ctx] = mk(S, S);
  const r = rng(99);
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
  return c;
}

export function ghostCanvas(scream) {
  const W = 128, H = 256;
  const [c, ctx] = mk(W, H);
  const r = rng(scream ? 71 : 17);
  // halo
  ctx.save();
  ctx.translate(64, 118);
  ctx.scale(1, 2);
  let g = ctx.createRadialGradient(0, 0, 4, 0, 0, 58);
  g.addColorStop(0, 'rgba(190,210,235,0.2)');
  g.addColorStop(1, 'rgba(190,210,235,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, 58, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // vestido
  g = ctx.createLinearGradient(0, 64, 0, 256);
  g.addColorStop(0, 'rgba(225,230,236,0.97)');
  g.addColorStop(0.55, 'rgba(175,190,205,0.7)');
  g.addColorStop(1, 'rgba(140,160,185,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(46, 74);
  ctx.quadraticCurveTo(64, 64, 82, 74);
  ctx.lineTo(90, 120);
  ctx.lineTo(102, 250);
  for (let x = 102; x >= 26; x -= 6) ctx.lineTo(x, 226 + r() * 28);
  ctx.lineTo(38, 120);
  ctx.closePath();
  ctx.fill();
  // pliegues
  ctx.strokeStyle = 'rgba(80,95,120,0.28)';
  ctx.lineWidth = 2;
  for (let k = 0; k < 7; k++) {
    ctx.beginPath(); ctx.moveTo(50 + k * 5, 90); ctx.quadraticCurveTo(46 + k * 7, 170, 34 + k * 10, 245); ctx.stroke();
  }
  // brazos colgando, demasiado largos
  ctx.fillStyle = 'rgba(215,222,230,0.9)';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(64 + s * 17, 76);
    ctx.quadraticCurveTo(64 + s * 30, 120, 64 + s * 32, 168);
    ctx.lineTo(64 + s * 26, 168);
    ctx.quadraticCurveTo(64 + s * 22, 120, 64 + s * 12, 84);
    ctx.fill();
    // dedos
    ctx.strokeStyle = 'rgba(215,222,230,0.85)';
    ctx.lineWidth = 1.2;
    for (let f = 0; f < 4; f++) {
      ctx.beginPath();
      ctx.moveTo(64 + s * (26 + f * 2), 166);
      ctx.lineTo(64 + s * (24 + f * 3), 184 + f * 2);
      ctx.stroke();
    }
  }
  // pelo negro por detrás
  ctx.fillStyle = 'rgba(6,6,8,0.96)';
  ctx.beginPath();
  ctx.moveTo(64, 18);
  ctx.bezierCurveTo(36, 18, 38, 60, 34, 138);
  ctx.lineTo(46, 132);
  ctx.bezierCurveTo(50, 90, 48, 60, 52, 42);
  ctx.lineTo(76, 42);
  ctx.bezierCurveTo(80, 60, 78, 90, 82, 132);
  ctx.lineTo(94, 138);
  ctx.bezierCurveTo(90, 60, 92, 18, 64, 18);
  ctx.fill();
  // cara
  g = ctx.createRadialGradient(64, 44, 2, 64, 46, 20);
  g.addColorStop(0, 'rgba(240,244,248,1)');
  g.addColorStop(1, 'rgba(170,185,200,0.95)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(64, 46, 12, 18, 0, 0, Math.PI * 2); ctx.fill();
  // flequillo tapando
  ctx.fillStyle = 'rgba(6,6,8,0.97)';
  ctx.beginPath(); ctx.ellipse(64, 30, 14, 7, 0, Math.PI, 0); ctx.fill();
  ctx.fillRect(52, 28, 4, 30);
  // ojos
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 4;
  ctx.fillStyle = '#000';
  const ey = scream ? 44 : 43;
  const erx = scream ? 4 : 3.2, ery = scream ? 6 : 3.6;
  ctx.beginPath(); ctx.ellipse(58.5, ey, erx, ery, 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(69.5, ey, erx, ery, -0.1, 0, Math.PI * 2); ctx.fill();
  // boca
  ctx.beginPath();
  if (scream) ctx.ellipse(64, 60, 4.5, 9, 0, 0, Math.PI * 2);
  else ctx.ellipse(64, 56, 2.2, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // lágrimas negras
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(58, ey + 3, 1, scream ? 16 : 11);
  ctx.fillRect(70, ey + 3, 1, scream ? 13 : 8);
  // pupilas
  if (!scream) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(58, 43, 1, 1); ctx.fillRect(69, 43, 1, 1);
  }
  // mechones sueltos sobre la cara
  ctx.strokeStyle = 'rgba(5,5,7,0.85)';
  ctx.lineWidth = 1;
  for (let k = 0; k < 10; k++) {
    const sx = 52 + r() * 24;
    ctx.beginPath(); ctx.moveTo(sx, 26); ctx.quadraticCurveTo(sx + (r() - 0.5) * 10, 50, sx + (r() - 0.5) * 16, 70 + r() * 50); ctx.stroke();
  }
  // textura etérea: ruido y líneas
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  for (let y = 0; y < H; y++) {
    const line = y % 3 === 0 ? 0.78 : 1;
    for (let x = 0; x < W; x++) {
      const p = (y * W + x) * 4 + 3;
      d[p] = d[p] * line * (0.82 + r() * 0.18);
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

export function decalText(text, seed) {
  const W = 512, H = 160;
  const [c, ctx] = mk(W, H);
  const r = rng(seed);
  ctx.clearRect(0, 0, W, H);
  ctx.font = '52px "Special Elite", "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.translate(W / 2, H / 2 - 10);
  ctx.rotate((r() - 0.5) * 0.12);
  ctx.fillStyle = 'rgba(95,8,6,0.92)';
  ctx.fillText(text, 0, 0);
  ctx.restore();
  // chorretones
  const m = ctx.measureText(text).width;
  for (let k = 0; k < 26; k++) {
    const x = W / 2 - m / 2 + r() * m;
    const y = H / 2 + 2 + r() * 10;
    const len = 8 + r() * 50;
    const g = ctx.createLinearGradient(0, y, 0, y + len);
    g.addColorStop(0, 'rgba(90,6,5,0.85)');
    g.addColorStop(1, 'rgba(90,6,5,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, 1.5 + r() * 2, len);
  }
  return c;
}
