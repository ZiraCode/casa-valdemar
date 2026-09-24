// Taller de texturas: galería, vista 2D y 3D, parámetros en vivo, recarga
// automática al cambiar los ficheros y revisión con notas para la IA.
import * as TX from '../js/textures.js';
import { Vista3D } from './vista3d.js';
import { TIPOS, ASIGNACION, POR_DEFECTO } from '../assets/apariciones.js';

const $ = (s) => document.querySelector(s);
const CLAVE_REVISION = 'casa-valdemar-revision';
const ESTADOS = { pendiente: 'Sin revisar', cambios: 'Pedir cambios', aprobada: 'Aprobada' };

const S = {
  sel: null,
  ajustes: {},            // id → { parámetro: valor } probados aquí (no se escriben en el fichero)
  zoom: 0,               // 0 = ajustar al panel
  zoomEfectivo: 1,
  mosaico: false,
  antes: false,
  iniciales: new Map(),   // id → canvas tal como estaba al abrir el taller
  cambiadas: new Set(),   // ids que ya no coinciden con su versión inicial
  fuentes: new Map(),     // fichero → contenido, para detectar cambios en disco
  revision: leerRevision(),
  fotos: [],              // canvases por fotograma de la selección (con ajustes)
  frame: 0,               // fotograma mostrado en 2D
  animar: true,
};

// ------------------------------------------------------------ utilidades
function el(tag, attrs = {}, ...hijos) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? '' : v);
  }
  for (const h of hijos.flat()) if (h !== null && h !== undefined) e.append(h);
  return e;
}

function leerRevision() {
  try { return JSON.parse(localStorage.getItem(CLAVE_REVISION)) || {}; } catch { return {}; }
}
function guardarRevision() {
  try { localStorage.setItem(CLAVE_REVISION, JSON.stringify(S.revision)); } catch { /* sin almacenamiento */ }
}

let avisoT = null;
function avisar(texto) {
  const a = $('#aviso');
  a.textContent = texto;
  a.classList.add('visible');
  clearTimeout(avisoT);
  avisoT = setTimeout(() => a.classList.remove('visible'), 2600);
}

async function copiar(texto, mensaje) {
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    const t = el('textarea', {}, texto);
    document.body.append(t);
    t.select();
    document.execCommand('copy');
    t.remove();
  }
  avisar(mensaje);
}

function copiaDe(c) {
  const k = el('canvas');
  k.width = c.width;
  k.height = c.height;
  k.getContext('2d').drawImage(c, 0, 0);
  return k;
}

function iguales(fa, fb) {
  if (!fa || !fb || fa.length !== fb.length) return false;
  return fa.every((a, k) => igualesLienzo(a, fb[k]));
}

function igualesLienzo(a, b) {
  if (!a || !b || a.width !== b.width || a.height !== b.height) return false;
  const da = new Uint32Array(a.getContext('2d').getImageData(0, 0, a.width, a.height).data.buffer);
  const db = new Uint32Array(b.getContext('2d').getImageData(0, 0, b.width, b.height).data.buffer);
  for (let i = 0; i < da.length; i++) if (da[i] !== db[i]) return false;
  return true;
}

const mismoValor = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();
const fmt = (v) => (typeof v === 'string' ? `'${v}'` : String(v));

// Devuelve { cs: [canvas por fotograma] } o { e: error }
function dibujar(id, conAjustes = true) {
  try { return { cs: TX.lienzos(id, conAjustes ? S.ajustes[id] || {} : {}) }; }
  catch (e) { return { e }; }
}

// Tipo de aparición que usa esta textura, si lo hay
function tipoDeTextura(id) {
  const e = Object.entries(TIPOS).find(([, t]) => t.calma === id || t.grito === id);
  return e ? { clave: e[0], ...e[1] } : null;
}

// ------------------------------------------------------------ galería
function marcas(id) {
  const t = TX.info(id);
  const rev = S.revision[id]?.estado;
  const m = [];
  if (t.img) m.push(el('span', { class: 'marca png', title: 'Usa una imagen PNG' }, 'PNG'));
  if (S.cambiadas.has(id)) m.push(el('span', { class: 'marca cambiada', title: 'Ha cambiado desde que abriste el taller' }, 'nueva'));
  if (Object.keys(S.ajustes[id] || {}).length) m.push(el('span', { class: 'marca cambiada', title: 'Tiene parámetros probados en el taller' }, 'ajuste'));
  if (rev === 'cambios') m.push(el('span', { class: 'marca cambios', title: 'Cambios pedidos' }, '✎'));
  if (rev === 'aprobada') m.push(el('span', { class: 'marca aprobada', title: 'Aprobada' }, '✓'));
  return m;
}

function miniatura(id) {
  const r = dibujar(id);
  return r.cs ? copiaDe(r.cs[0]) : el('canvas');
}

function construirLista() {
  const filtro = $('#buscar').value.trim().toLowerCase();
  const lista = $('#lista');
  lista.innerHTML = '';
  for (const f of TX.listaFamilias()) {
    if (f.error) {
      lista.append(el('div', { class: 'familia' },
        el('h3', {}, `${f.fichero}.js `, el('span', { class: 'marca cambios' }, 'error'))));
      continue;
    }
    const ids = Object.keys(f.familia.texturas).filter((id) => {
      if (!filtro) return true;
      const d = f.familia.texturas[id];
      return [id, f.fichero, f.familia.nombre, d.uso, f.familia.descripcion].join(' ').toLowerCase().includes(filtro);
    });
    if (!ids.length) continue;
    const bloque = el('div', { class: 'familia' },
      el('h3', {}, f.familia.nombre, ' ', el('span', { class: 'fichero' }, `· ${f.fichero}.js`)));
    for (const id of ids) {
      bloque.append(el('div', {
        class: 'item' + (id === S.sel ? ' sel' : ''), 'data-id': id, title: f.familia.texturas[id].uso || '',
        onclick: () => seleccionar(id),
      }, miniatura(id), el('span', { class: 'nombre' }, id), el('span', { class: 'marcas' }, marcas(id))));
    }
    lista.append(bloque);
  }
}

function refrescarItem(id) {
  const item = document.querySelector(`.item[data-id="${CSS.escape(id)}"]`);
  if (!item) return;
  item.querySelector('canvas').replaceWith(miniatura(id));
  item.querySelector('.marcas').replaceChildren(...marcas(id));
}

function mostrarErrores() {
  const errs = TX.listaFamilias().filter((f) => f.error);
  const caja = $('#errores');
  caja.classList.toggle('hidden', !errs.length);
  caja.textContent = errs.map((f) => `Error en assets/texturas/${f.fichero}.js: ${f.error.message}`).join('\n');
}

// ------------------------------------------------------------ selección y vistas
function seleccionar(id) {
  S.sel = id;
  history.replaceState(null, '', '#' + id);
  document.querySelectorAll('.item').forEach((i) => i.classList.toggle('sel', i.dataset.id === id));
  document.querySelector('.item.sel')?.scrollIntoView({ block: 'nearest' });
  renderDetalle();
  actualizarVistas();
}

let pendiente = false;
function actualizarVistas() {
  if (pendiente) return;
  pendiente = true;
  requestAnimationFrame(() => {
    pendiente = false;
    const r = dibujar(S.sel);
    const err = $('#error-dibujo');
    if (r.e) {
      err.textContent = `Error al dibujar «${S.sel}»:\n${r.e.stack || r.e.message}`;
      err.classList.remove('hidden');
      return;
    }
    err.classList.add('hidden');
    S.fotos = r.cs;
    S.frame %= r.cs.length;
    render2D();
    vista.mostrar(S.sel, r.cs);
    refrescarItem(S.sel);
    const anim = r.cs.length > 1;
    $('#controles-anim').classList.toggle('hidden', !anim);
    $('#controles-aparicion').classList.toggle('hidden', !vista.esAparicion);
  });
}

function render2D() {
  const fotos = S.antes ? S.iniciales.get(S.sel) || S.fotos : S.fotos;
  if (!fotos.length) return;
  const src = fotos[S.frame % fotos.length];
  const formato = TX.info(S.sel).familia.formato;
  let cols = 1, filas = 1;
  const tira = S.mosaico && fotos.length > 1;   // mosaico de un sprite animado: todos los fotogramas en fila
  if (tira) cols = fotos.length;
  else if (S.mosaico) {
    if (formato === 'pared') cols = 2;
    else if (['suelo', 'techo', 'objeto'].includes(formato)) cols = filas = 3;
  }
  $('#fotograma').textContent = fotos.length > 1 ? `${(S.frame % fotos.length) + 1}/${fotos.length}` : '';
  const c = $('#lienzo');
  c.width = src.width * cols;
  c.height = src.height * filas;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < filas; y++) {
    for (let x = 0; x < cols; x++) ctx.drawImage(tira ? fotos[x] : src, x * src.width, y * src.height);
  }
  let z = S.zoom;
  if (!z) {
    const cont = $('#lienzo-cont');
    const cabe = Math.min((cont.clientWidth - 32) / c.width, (cont.clientHeight - 32) / c.height);
    z = cabe >= 1 ? Math.floor(cabe) : Math.max(0.25, cabe);
  }
  S.zoomEfectivo = z;
  c.style.width = c.width * z + 'px';
  c.style.height = c.height * z + 'px';
  c.style.outline = S.antes ? '2px solid #c9922e' : 'none';
}

// ------------------------------------------------------------ ficha de la textura
function control(id, k, spec, valorFichero) {
  const aj = S.ajustes[id] || {};
  const valor = k in aj ? aj[k] : valorFichero;
  const caja = el('div', { class: 'param' + (k in aj ? ' modificado' : '') });
  const cambiar = (v) => {
    const a = { ...(S.ajustes[id] || {}) };
    if (mismoValor(v, valorFichero)) delete a[k]; else a[k] = v;
    if (Object.keys(a).length) S.ajustes[id] = a; else delete S.ajustes[id];
    caja.classList.toggle('modificado', k in a);
    actualizarVistas();
  };
  caja.append(el('label', {}, spec.etiqueta || k, ' ', el('code', {}, `(${k})`)));
  const fila = el('div', { class: 'fila' });
  switch (spec.tipo) {
    case 'color': {
      const texto = el('input', { type: 'text', value: valor, spellcheck: 'false' });
      const selector = el('input', { type: 'color', value: valor });
      selector.addEventListener('input', () => { texto.value = selector.value; cambiar(selector.value); });
      texto.addEventListener('change', () => {
        if (/^#[0-9a-f]{6}$/i.test(texto.value)) { selector.value = texto.value; cambiar(texto.value.toLowerCase()); }
        else texto.value = selector.value;
      });
      fila.append(selector, texto);
      break;
    }
    case 'booleano': {
      const cb = el('input', { type: 'checkbox' });
      cb.checked = !!valor;
      cb.addEventListener('change', () => cambiar(cb.checked));
      fila.append(cb, el('span', {}, cb.checked ? 'sí' : 'no'));
      cb.addEventListener('change', () => { fila.lastChild.textContent = cb.checked ? 'sí' : 'no'; });
      break;
    }
    case 'entero':
    case 'numero': {
      const paso = spec.tipo === 'entero' ? 1 : spec.paso || 0.01;
      const n = el('input', { type: 'number', value: valor, min: spec.min, max: spec.max, step: paso });
      n.addEventListener('input', () => {
        const v = spec.tipo === 'entero' ? parseInt(n.value, 10) : parseFloat(n.value);
        if (!Number.isNaN(v)) cambiar(v);
      });
      fila.append(n);
      if (k === 'semilla') {
        fila.append(el('button', {
          title: 'Probar otra semilla al azar',
          onclick: () => { n.value = 1 + Math.floor(Math.random() * 99998); cambiar(parseInt(n.value, 10)); },
        }, 'Otra'));
      }
      break;
    }
    default: {
      const t = el('input', { type: 'text', value: valor });
      t.addEventListener('input', () => cambiar(t.value));
      fila.append(t);
    }
  }
  caja.append(fila);
  return caja;
}

function lineaValores(id) {
  const t = TX.info(id);
  const v = { ...t.def, ...(S.ajustes[id] || {}) };
  const partes = Object.entries(v).map(([k, x]) => `${k}: ${fmt(x)}`);
  return `'${id}': { ${partes.join(', ')} },`;
}

function peticion(id) {
  const t = TX.info(id);
  const rev = S.revision[id] || {};
  const aj = S.ajustes[id] || {};
  const l = [`### Textura \`${id}\` (${t.familia.nombre})`, `Fichero: assets/texturas/${t.fichero}.js`, `Estado: ${ESTADOS[rev.estado || 'pendiente']}`];
  const difs = Object.entries(aj);
  if (difs.length) {
    l.push('', 'Valores probados en el taller (distintos de los del fichero):');
    for (const [k, v] of difs) l.push(`- ${k}: ${fmt(t.def[k])} → ${fmt(v)}`);
  }
  if (rev.notas?.trim()) l.push('', 'Notas:', rev.notas.trim());
  return l.join('\n');
}

function tipoFicha(id) {
  const t = tipoDeTextura(id);
  if (!t) return null;
  const donde = Object.entries(ASIGNACION).filter(([, v]) => v === t.clave).map(([k]) => k);
  const txt = `${t.nombre}: ${t.alto} m de alto, velocidad ×${t.velocidad}, voz ×${t.voz}. `
    + (t.clave === POR_DEFECTO ? 'Tipo por defecto de las G del mapa' : `Asignada a ${donde.join(' · ') || 'ninguna G'}`)
    + ' (assets/apariciones.js).';
  return [el('dt', {}, 'Aparición'), el('dd', {}, txt)];
}

function renderDetalle() {
  const d = $('#detalle');
  const id = S.sel;
  const t = TX.info(id);
  const f = t.familia;
  const rev = S.revision[id] || { estado: 'pendiente', notas: '' };
  const pared = f.formato === 'pared' && f.ancho === 256;

  const datos = el('dl', { class: 'datos' },
    el('dt', {}, 'Fichero'), el('dd', {}, el('code', {}, `assets/texturas/${t.fichero}.js`)),
    el('dt', {}, 'Uso'), el('dd', {}, t.def.uso || '—'),
    el('dt', {}, 'Tamaño'), el('dd', {}, `${f.ancho}×${f.alto} px${pared ? ' (2 variantes de 128)' : ''}`),
    el('dt', {}, 'Formato'), el('dd', {}, f.formato),
    el('dt', {}, 'Filtro'), el('dd', {}, f.filtro === 'suave' ? 'suave' : 'nítido (píxel)'),
    TX.numFotogramas(id) > 1 ? [el('dt', {}, 'Animación'), el('dd', {}, `${TX.numFotogramas(id)} fotogramas a ${TX.fps(id)} fps`)] : null,
    tipoFicha(id),
    t.def.imagen ? [el('dt', {}, 'Imagen'), el('dd', {}, el('code', {}, t.def.imagen))] : null,
  );

  const params = el('section', {}, el('h4', {}, 'Parámetros'));
  const specs = Object.entries(f.parametros || {});
  if (t.img) params.append(el('p', { class: 'nota-pie' }, 'Esta textura usa una imagen PNG: los parámetros no se aplican.'));
  else if (!specs.length) params.append(el('p', { class: 'nota-pie' }, 'Sin parámetros: se cambia editando la función dibujar() del fichero.'));
  else for (const [k, spec] of specs) params.append(control(id, k, spec, t.def[k]));
  params.append(
    el('div', { class: 'botones' },
      el('button', { onclick: () => { delete S.ajustes[id]; renderDetalle(); actualizarVistas(); } }, 'Restablecer'),
      el('button', { title: 'Copia la línea de esta textura con los valores actuales, lista para pegar en el fichero', onclick: () => copiar(lineaValores(id), 'Valores copiados') }, 'Copiar valores'),
    ),
    el('p', { class: 'nota-pie' }, 'Los cambios de parámetros son pruebas: no se guardan en el fichero. Para conservarlos, cópialos o pídeselos a la IA.'),
  );

  const notas = el('textarea', { placeholder: 'Qué te gusta, qué cambiarías… (se guarda en este navegador)' }, rev.notas || '');
  notas.addEventListener('input', () => {
    S.revision[id] = { ...(S.revision[id] || { estado: 'pendiente' }), notas: notas.value };
    guardarRevision();
  });
  const estados = el('div', { class: 'estados' }, Object.entries(ESTADOS).map(([k, txt]) => el('button', {
    'data-estado': k, class: (rev.estado || 'pendiente') === k ? 'activo' : '',
    onclick: () => {
      S.revision[id] = { ...(S.revision[id] || {}), estado: k };
      guardarRevision();
      renderDetalle();
      refrescarItem(id);
    },
  }, txt)));
  const revision = el('section', {}, el('h4', {}, 'Revisión'), estados, notas,
    el('div', { class: 'botones' },
      el('button', { onclick: () => copiar(peticion(id), 'Petición copiada: pégala en el chat de la IA') }, 'Copiar petición para la IA')),
    el('p', { class: 'nota-pie' }, 'La petición incluye el fichero, los valores que has probado y tus notas.'));

  d.replaceChildren(
    el('h2', {}, f.nombre),
    el('div', { class: 'id' }, id),
    el('section', {}, datos, el('p', { class: 'descripcion' }, f.descripcion || '')),
    params,
    revision,
  );
}

// ------------------------------------------------------------ recarga automática
function ficherosVigilados() {
  const fs = ['index.js', ...TX.listaFamilias().map((f) => `${f.fichero}.js`)];
  for (const t of TX.listaTexturas()) if (t.def.imagen) fs.push(t.def.imagen);
  return fs;
}

async function leerFuentes() {
  const pares = await Promise.all(ficherosVigilados().map(async (f) => {
    try {
      const r = await fetch(`assets/texturas/${f}`, { cache: 'no-store' });
      if (!r.ok) return [f, null];
      if (f.endsWith('.js')) return [f, await r.text()];
      return [f, `${r.headers.get('last-modified')}|${r.headers.get('content-length')}`];
    } catch { return [f, null]; }
  }));
  return new Map(pares);
}

async function recargar(cambiados) {
  await TX.cargarTexturas({ recargar: true });
  for (const id of Object.keys(S.ajustes)) if (!TX.listaTexturas().some((t) => t.id === id)) delete S.ajustes[id];
  S.cambiadas.clear();
  for (const t of TX.listaTexturas()) {
    const r = dibujar(t.id, false);
    if (!S.iniciales.has(t.id) || (r.cs && !iguales(r.cs, S.iniciales.get(t.id)))) S.cambiadas.add(t.id);
  }
  construirLista();
  mostrarErrores();
  if (!TX.listaTexturas().some((t) => t.id === S.sel)) S.sel = TX.listaTexturas()[0]?.id;
  if (S.sel) { renderDetalle(); actualizarVistas(); }
  const hora = new Date().toLocaleTimeString();
  $('#estado').textContent = `${TX.listaTexturas().length} texturas · recargado a las ${hora}`;
  avisar(`Recargado: ${cambiados.join(', ')}`);
}

let revisando = false;
async function vigilar() {
  if (revisando || !$('#vigilar').checked || document.hidden) return;
  revisando = true;
  try {
    const nuevas = await leerFuentes();
    const cambiados = [...nuevas].filter(([f, txt]) => txt !== null && S.fuentes.has(f) && S.fuentes.get(f) !== txt).map(([f]) => f);
    const nuevos = [...nuevas.keys()].filter((f) => !S.fuentes.has(f));
    S.fuentes = nuevas;
    if (cambiados.length || nuevos.length) await recargar([...cambiados, ...nuevos]);
  } finally {
    revisando = false;
  }
}

// ------------------------------------------------------------ arranque
await Promise.race([
  document.fonts.load('52px "Special Elite"').catch(() => {}),
  new Promise((r) => setTimeout(r, 2500)),
]);
await TX.cargarTexturas();
for (const t of TX.listaTexturas()) {
  const r = dibujar(t.id, false);
  if (r.cs) S.iniciales.set(t.id, r.cs);
}

const vista = new Vista3D($('#vista-3d'));

construirLista();
mostrarErrores();
const pedida = decodeURIComponent(location.hash.slice(1));
const ids = TX.listaTexturas().map((t) => t.id);
seleccionar(ids.includes(pedida) ? pedida : ids[0]);
$('#estado').textContent = `${ids.length} texturas en ${TX.listaFamilias().length} familias`;

// controles
$('#buscar').addEventListener('input', construirLista);
document.querySelectorAll('#zooms button').forEach((b) => {
  b.classList.toggle('activo', +b.dataset.zoom === S.zoom);
  b.addEventListener('click', () => {
    S.zoom = +b.dataset.zoom;
    document.querySelectorAll('#zooms button').forEach((x) => x.classList.toggle('activo', x === b));
    render2D();
  });
});
new ResizeObserver(() => { if (!S.zoom) render2D(); }).observe($('#lienzo-cont'));
$('#mosaico').addEventListener('change', (e) => { S.mosaico = e.target.checked; render2D(); });
const antes = $('#antes');
const verAntes = (on) => { S.antes = on; antes.classList.toggle('activo', on); render2D(); };
antes.addEventListener('pointerdown', () => verAntes(true));
antes.addEventListener('pointerup', () => verAntes(false));
antes.addEventListener('pointerleave', () => { if (S.antes) verAntes(false); });

document.querySelectorAll('#luces button').forEach((b) => {
  b.classList.toggle('activo', b.dataset.luz === 'linterna');
  b.addEventListener('click', () => {
    vista.setLuz(b.dataset.luz);
    document.querySelectorAll('#luces button').forEach((x) => x.classList.toggle('activo', x === b));
  });
});
$('#juego').addEventListener('change', (e) => vista.setJuego(e.target.checked));

// animación 2D de los sprites
const pasoFoto = (d) => { S.frame = (S.frame + d + S.fotos.length) % S.fotos.length; render2D(); };
$('#animar').addEventListener('click', () => { S.animar = !S.animar; $('#animar').classList.toggle('activo', S.animar); });
$('#foto-ant').addEventListener('click', () => { S.animar = false; $('#animar').classList.remove('activo'); pasoFoto(-1); });
$('#foto-sig').addEventListener('click', () => { S.animar = false; $('#animar').classList.remove('activo'); pasoFoto(1); });
let ultimoFoto = 0;
setInterval(() => {
  if (!S.animar || S.fotos.length < 2 || !S.sel) return;
  const ahora = performance.now();
  if (ahora - ultimoFoto < 1000 / (TX.fps(S.sel) || 5)) return;
  ultimoFoto = ahora;
  pasoFoto(1);
}, 40);

// estado del shader de las apariciones en la vista 3D
const aplicarEstadoAp = () => {
  const estado = $('#estado-ap').value;
  $('#nivel-ap').disabled = estado === 'calma';
  vista.setEstadoAparicion(estado, parseFloat($('#nivel-ap').value));
};
$('#estado-ap').addEventListener('change', aplicarEstadoAp);
$('#nivel-ap').addEventListener('input', aplicarEstadoAp);

// color y coordenadas del píxel bajo el ratón
$('#lienzo').addEventListener('mousemove', (e) => {
  const fotos = S.antes ? S.iniciales.get(S.sel) : S.fotos;
  if (!fotos?.length) return;
  const px = Math.floor(e.offsetX / S.zoomEfectivo), py = Math.floor(e.offsetY / S.zoomEfectivo);
  const w = fotos[0].width;
  const tira = S.mosaico && fotos.length > 1;
  const src = tira ? fotos[Math.min(fotos.length - 1, Math.floor(px / w))] : fotos[S.frame % fotos.length];
  const x = px % src.width, y = py % src.height;
  const [r, g, b, a] = src.getContext('2d').getImageData(x, y, 1, 1).data;
  const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
  $('#pixel').textContent = `x ${x} · y ${y} · ${hex}${a < 255 ? ` · α ${a}` : ''}`;
});
$('#lienzo').addEventListener('mouseleave', () => { $('#pixel').textContent = ''; });

// flechas arriba/abajo para recorrer la galería
document.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  const items = [...document.querySelectorAll('.item')];
  const i = items.findIndex((x) => x.dataset.id === S.sel);
  const sig = items[i + (e.key === 'ArrowDown' ? 1 : -1)];
  if (sig) { e.preventDefault(); seleccionar(sig.dataset.id); }
});

$('#copiar-todo').addEventListener('click', () => {
  const ids = TX.listaTexturas().map((t) => t.id).filter((id) => {
    const rev = S.revision[id] || {};
    return rev.estado === 'cambios' || (rev.notas?.trim() && rev.estado !== 'aprobada') || S.ajustes[id];
  });
  if (!ids.length) { avisar('No hay peticiones pendientes'); return; }
  const texto = ['## Peticiones del taller de texturas (Casa Valdemar)', '', ...ids.map(peticion).flatMap((p) => [p, ''])].join('\n');
  copiar(texto, `${ids.length} peticiones copiadas: pégalas en el chat de la IA`);
});

// vigilancia de ficheros (activa por defecto en local)
const local = ['localhost', '127.0.0.1', ''].includes(location.hostname);
$('#vigilar').checked = local;
S.fuentes = await leerFuentes();
setInterval(vigilar, 1500);
