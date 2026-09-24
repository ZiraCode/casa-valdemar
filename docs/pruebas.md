# Cómo probar

## 1. Sin navegador

```bash
node tools/validar-mapa.mjs          # mapa, escaleras, alcanzabilidad, tipos de aparición y sitios de los cuadros
```

Para comprobar la sintaxis de un módulo, cópialo con extensión `.mjs` a una carpeta temporal y ejecuta
`node --check`. Así funciona incluso con el `await` de nivel superior de `main.js`.

## 2. En el navegador

Arranca el servidor con `python -m http.server 8000` y abre `http://localhost:8000/?debug`. En el panel de navegador
de la app de escritorio, usa `preview_start` con la configuración `mansion` (puerto 8123).

Con `?debug` existe `window.__casa`, que expone `{ THREE, scene, camera, renderer, player, world, ghosts, mansion, post, audio, G, tick }`.

### Trampas del panel de navegador integrado

- **`requestAnimationFrame` no corre si el panel está oculto.** El juego parece congelado y la linterna no alcanza a
  la cámara. Avanza a mano: `for (let k = 0; k < 60; k++) __casa.tick(1/60)`.
- Antes de hacer clic por coordenadas hay que tomar una captura, que fija el marco de coordenadas.
- El pointer lock no funciona ahí: el juego entra en el modo de "arrastrar para mirar".
- **Al terminar, cierra la pestaña (`tabs_close`) y para el servidor (`preview_stop`).** El audio del juego sigue sonando
  de fondo aunque el panel esté oculto.
- Las teclas se pueden simular con `player.keys.add('KeyW')` o con
  `document.dispatchEvent(new KeyboardEvent('keydown', {code: 'Space'}))`.

### Recetas (en la consola, con `?debug` y tras hacer clic para empezar)

```js
const c = __casa, p = c.player;

// Teletransporte: actualiza SIEMPRE pos, feetY y L
p.pos.set(21, 0, 11); p.feetY = 6; p.L = 2; p.yaw = -Math.PI / 2; p.pitch = 0;
for (let k = 0; k < 40; k++) c.tick(1/60);

// Mirar a una aparición y quemarla hasta que muera
const g = c.ghosts.list.find(g => g.L === 2 && g.z < 10);
p.pos.set(36.2, 0, 7.4); p.feetY = 6; p.L = 2;
p.yaw = Math.atan2(-(g.x - p.pos.x), -(g.z - p.pos.z));
let n = 0; while (g.state !== 'dying' && n < 900) { c.tick(1/60); n++; }
console.log('segundos hasta desintegrarse', n / 60, g.required);

// Dar la espalda y comprobar que se acerca y ataca
p.yaw += Math.PI; for (let k = 0; k < 600; k++) c.tick(1/60);
console.log(c.G.sanity, g.state, g.x, g.z);

// Coste de CPU por fotograma (referencia: ~1,5 ms)
const t0 = performance.now(); for (let k = 0; k < 60; k++) c.tick(1/60); (performance.now() - t0) / 60;

// Probar que ningún sonido lanza excepciones
['stinger', 'scare', 'thunder', 'stepsAbove', 'scrape'].forEach(f => c.audio[f]());
```

Posiciones útiles, en metros:

| Sitio | `pos` (x, z) | `feetY` | `L` |
|---|---|---|---|
| inicio en el vestíbulo | 21, 27 | 3 | 1 |
| pie de la escalera principal | 21, 19 | 3 | 1 |
| salón, frente a la chimenea | 9, 23.5 | 3 | 1 |
| rellano de la segunda planta | 21, 11 | 6 | 2 |
| cuarto infantil (aparición en 39, 5) | 36.2, 7.4 | 6 | 2 |
| pasillo del sótano | 41, 13 | 0 | 0 |
| buhardilla, zona abierta | 21, 17 | 9 | 3 |

## 3. Taller de texturas

- Abre `editor.html`. La cabecera debe decir «36 texturas en 25 familias» (o las que haya) y no debe aparecer la franja roja.
- Cambia un valor en un fichero de `assets/texturas/` y en ~2 s debe aparecer el aviso «Recargado: ...» y la marca **nueva**.
- Para comprobar que una reorganización no cambia nada: dibuja cada textura antes y después y compara `getImageData`
  byte a byte (una página HTML temporal que importe las dos versiones sirve).
- El panel del navegador integrado pausa `requestAnimationFrame` si está oculto. Las vistas del taller se actualizan al
  volver a mostrarlo (o al hacer una captura).
- Una navegación que solo cambia el `#ancla` no recarga la página: añade `?r=1` para forzarla.

## 4. Qué revisar después de cambiar algo

- La consola sin errores ni avisos de `Mansion`.
- Una captura en cada planta: que no haya caras sin textura, z-fighting ni luz que atraviese muros.
- Con la linterna delante de una aparición, que la desintegración ocurra entre 5 y 8 s.
- Con la espalda a una aparición, que se acerque, ataque y baje la cordura.
- Espacio delante de una puerta: que se abra hacia el lado contrario al jugador y cierre.
- Esc y pestaña oculta: que el audio se detenga.
