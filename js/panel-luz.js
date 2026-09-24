// Panel de ajuste de la iluminación, dentro del juego. Se activa con ?luz en la dirección
// y se abre y cierra con la tecla L. Los cambios se ven al momento y se guardan en este
// navegador (solo en modo ?luz); "Copiar valores" da el texto para js/iluminacion.js.
import { LUZ, guardarLuz, restablecerLuz, textoLuz } from './iluminacion.js';

// [ruta en LUZ, etiqueta, mínimo, máximo, paso]
const GRUPOS = [
  ['Linterna', [
    ['linterna.intensidad', 'Intensidad', 0, 200, 1],
    ['linterna.alcance', 'Alcance (m)', 4, 40, 0.5],
    ['linterna.angulo', 'Apertura (°)', 10, 70, 1],
    ['linterna.penumbra', 'Borde difuso', 0, 1, 0.01],
    ['linterna.caida', 'Caída con la distancia', 0.5, 2.5, 0.05],
  ]],
  ['Lente de la linterna', [
    ['lente.dureza', 'Dureza del centro', 0, 1, 0.05],
    ['lente.anillo', 'Anillo', 0, 1, 0.05],
    ['lente.suciedad', 'Suciedad', 0, 80, 1],
  ]],
  ['Luz alrededor del jugador', [
    ['relleno.intensidad', 'Intensidad', 0, 3, 0.05],
    ['relleno.alcance', 'Alcance (m)', 0.5, 6, 0.1],
  ]],
  ['Puntos de luz', [
    ['fuentes.vela.intensidad', 'Velas', 0, 10, 0.1],
    ['fuentes.vela.alcance', 'Velas: alcance (m)', 1, 12, 0.5],
    ['fuentes.candil.intensidad', 'Candiles', 0, 12, 0.1],
    ['fuentes.candil.alcance', 'Candiles: alcance (m)', 1, 14, 0.5],
    ['fuentes.chimenea.intensidad', 'Chimenea', 0, 30, 0.5],
    ['fuentes.luna.intensidad', 'Luna en las ventanas', 0, 4, 0.05],
    ['ventanas', 'Brillo del cristal', 0, 1, 0.01],
  ]],
  ['Ambiente', [
    ['ambiente', 'Luz general', 0, 0.3, 0.005],
    ['niebla', 'Niebla', 0, 0.2, 0.005],
    ['exposicion', 'Exposición', 0.3, 3, 0.05],
  ]],
];

// Estilos propios del panel (así no dependen de que el navegador recargue style.css)
const ESTILOS = `
#panel-luz {
  position: fixed;
  top: 12px;
  right: 12px;
  bottom: 12px;
  width: 300px;
  overflow-y: auto;
  z-index: 9;
  background: rgba(14, 11, 9, 0.9);
  border: 1px solid #3a3029;
  padding: 10px 12px;
  font: 12px/1.4 system-ui, 'Segoe UI', sans-serif;
  color: #d3c8b2;
  cursor: default;
}
#panel-luz .cab { display: flex; flex-direction: column; margin-bottom: 8px; }
#panel-luz .cab b { font-family: 'IM Fell English SC', serif; font-size: 18px; font-weight: normal; }
#panel-luz .cab span { color: #8a7f6d; }
#panel-luz h4 {
  margin: 12px 0 4px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #8a7f6d;
  border-bottom: 1px solid #2c2621;
}
#panel-luz .fila { display: grid; grid-template-columns: 1fr 100px 40px; align-items: center; gap: 6px; margin: 3px 0; }
#panel-luz .fila output { text-align: right; font-family: ui-monospace, Consolas, monospace; }
#panel-luz .fila input { width: 100%; }
#panel-luz .fila-check { display: flex; gap: 6px; align-items: center; }
#panel-luz .botones { display: flex; gap: 6px; margin-top: 14px; }
#panel-luz button { font: inherit; font-size: 12px; letter-spacing: 0; padding: 5px 10px; }
`;

const leer = (ruta) => ruta.split('.').reduce((o, k) => o[k], LUZ);
function escribir(ruta, v) {
  const ks = ruta.split('.');
  const ultimo = ks.pop();
  ks.reduce((o, k) => o[k], LUZ)[ultimo] = v;
}

export function crearPanelLuz({ alCambiarLente, alCopiar }) {
  const estilo = document.createElement('style');
  estilo.textContent = ESTILOS;
  document.head.append(estilo);
  const panel = document.createElement('div');
  panel.id = 'panel-luz';
  panel.className = 'hidden';
  const controles = [];

  const cab = document.createElement('div');
  cab.className = 'cab';
  cab.innerHTML = '<b>Ajuste de luz</b><span>L para cerrar · arrastra en la escena para mirar</span>';
  panel.append(cab);

  const congelar = document.createElement('label');
  congelar.className = 'fila-check';
  congelar.innerHTML = '<input type="checkbox" checked> Congelar apariciones';
  panel.append(congelar);

  for (const [titulo, campos] of GRUPOS) {
    const h = document.createElement('h4');
    h.textContent = titulo;
    panel.append(h);
    for (const [ruta, etiqueta, min, max, paso] of campos) {
      const fila = document.createElement('label');
      fila.className = 'fila';
      const nombre = document.createElement('span');
      nombre.textContent = etiqueta;
      const rango = document.createElement('input');
      Object.assign(rango, { type: 'range', min, max, step: paso });
      const valor = document.createElement('output');
      const pintar = () => {
        rango.value = leer(ruta);
        valor.textContent = (+leer(ruta)).toFixed(paso < 0.1 ? (paso < 0.01 ? 3 : 2) : paso < 1 ? 1 : 0);
      };
      rango.addEventListener('input', () => {
        escribir(ruta, parseFloat(rango.value));
        pintar();
        guardarLuz();
        if (ruta.startsWith('lente.')) alCambiarLente();
      });
      // que las teclas de movimiento no muevan el deslizador
      rango.addEventListener('keydown', (e) => e.preventDefault());
      fila.append(nombre, rango, valor);
      panel.append(fila);
      controles.push(pintar);
      pintar();
    }
  }

  const botones = document.createElement('div');
  botones.className = 'botones';
  const copiar = document.createElement('button');
  copiar.textContent = 'Copiar valores';
  copiar.addEventListener('click', () => alCopiar(textoLuz()));
  const reset = document.createElement('button');
  reset.textContent = 'Restablecer';
  reset.addEventListener('click', () => {
    restablecerLuz();
    controles.forEach((f) => f());
    alCambiarLente();
  });
  botones.append(copiar, reset);
  panel.append(botones);
  document.body.append(panel);

  return {
    get abierto() { return !panel.classList.contains('hidden'); },
    get congelar() { return panel.querySelector('.fila-check input').checked; },
    alternar() { panel.classList.toggle('hidden'); controles.forEach((f) => f()); return this.abierto; },
    cerrar() { panel.classList.add('hidden'); },
  };
}
