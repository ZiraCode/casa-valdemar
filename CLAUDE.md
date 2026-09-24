# Casa Valdemar — guía para Claude

FPS de terror psicológico en el navegador, con HTML5 y three.js, al estilo de Doom y Wolfenstein 3D.
El jugador recorre una mansión a oscuras con una linterna. Las apariciones solo se mueven cuando no las mira,
y el haz sostenido de cerca durante 5-8 s las desintegra. El jugador gana al desterrar a las 8.

## Reglas del proyecto

- **Idioma:** los textos del juego, los comentarios del código y la documentación van en **español**.
  Los identificadores de código van en inglés, salvo excepciones que ya existen (`LEVEL_NAMES`, etc.).
- **Sin paso de compilación.** Son módulos ES nativos y three.js **r160** se carga por importmap desde jsDelivr
  (`index.html`). No añadas npm, bundlers ni TypeScript salvo que el usuario lo pida.
- **Gráficos 2D generados por código, nunca modelos 3D** (decisión del autor). Las texturas se dibujan en canvas,
  una familia por fichero en `assets/texturas/` (ver [docs/graficos.md](docs/graficos.md)). Solo en casos concretos
  se admite un PNG. Los muebles se construyen con primitivas en `js/world.js`. El sonido es síntesis Web Audio
  (`js/audio.js`), sin ficheros de audio.
- **El rendimiento manda** ("que no vaya a trompicones"). No crees luces ni materiales nuevos en tiempo de juego:
  cambiar el número de luces recompila shaders. La geometría estática se fusiona por material y por planta.
  Evita reservar memoria en el bucle; reutiliza vectores.
- **Terror psicológico ante todo.** No hay luz general: solo la linterna y puntos de luz (velas, candiles,
  chimenea, luna en las ventanas). La oscuridad y el sonido son la mecánica, no un adorno.
- Después de tocar el mapa, ejecuta siempre `node tools/validar-mapa.mjs`.
- **Git:** rama `main`, mensajes de commit en español. `.gitattributes` fuerza LF, salvo en `.bat` (CRLF).
  Remoto `origin` = <https://github.com/ZiraCode/casa-valdemar> (público).
- **Publicación:** GitHub Pages sirve la rama `main` (raíz, sin Jekyll gracias a `.nojekyll`) en
  <https://ziracode.github.io/casa-valdemar/>. **Cada `git push` a `main` publica el juego** en ~1 minuto.
  No subas cambios a medio hacer a `main`; usa una rama si el trabajo es largo.

## Ejecutar

Hace falta un servidor HTTP estático, porque los módulos ES no cargan desde `file://`:

```bash
python -m http.server 8000
```

Luego abre <http://localhost:8000> (o `http://localhost:8000/?debug` para el modo depuración).
El taller de texturas está en <http://localhost:8000/editor.html>.
`iniciar.bat` hace esto mismo en Windows. En el panel de navegador de la app de escritorio existe
`.claude/launch.json` (configuración `mansion`, puerto 8123).

## Mapa de ficheros

| Fichero | Contenido |
|---|---|
| `index.html`, `css/style.css` | HUD, pantallas de título/pausa/final, importmap |
| `js/main.js` | arranque, estados (`title/playing/paused/dead/won`), entrada, HUD, eventos aleatorios, relámpagos, bucle `tick(dt)` |
| `js/map.js` | plantas en texto, escaleras, altura del suelo, colisiones, grafo BFS, línea de visión |
| `js/world.js` | construcción de la geometría, puertas (`Door`), decoración, reparto de luces puntuales |
| `js/player.js` | movimiento, cámara, pasos, linterna (`SpotLight` con sombras y textura de lente) |
| `js/ghosts.js` | IA de las apariciones, tipos y animación de sus sprites |
| `js/ghostmat.js` | material y shader de las apariciones (quemadura y desintegración); lo comparten juego y taller |
| `assets/apariciones.js` | tipos de aparición (sprites, tamaño, velocidad, voz) y qué tipo usa cada `G` del mapa |
| `js/audio.js` | todo el sonido; voces posicionales HRTF de las apariciones |
| `js/post.js` | render a baja resolución + pase final (tone mapping ACES, grano, viñeta, aberración) |
| `assets/texturas/*.js` | una familia de texturas por fichero (metadatos + `dibujar()`); registro en `index.js` |
| `js/textures.js` | cargador del registro: `cargarTexturas()`, `lienzo(id)`, `textura(id)`; admite PNG |
| `js/texlib.js` | utilidades de dibujo (`rng`, `shade`, `stains`, `drips`, `grain`...) |
| `editor.html`, `editor/` | taller de texturas: galería, vista 2D/3D, parámetros en vivo, recarga automática y revisión |
| `tools/validar-mapa.mjs` | validador del mapa en Node |

## Documentación de referencia

- [docs/arquitectura.md](docs/arquitectura.md): cómo encajan los módulos, el orden del bucle, la iluminación y el render.
- [docs/mapa.md](docs/mapa.md): formato del mapa, leyenda, reglas de escaleras y cómo añadir objetos.
- [docs/jugabilidad.md](docs/jugabilidad.md): mecánicas y **todas las constantes de ajuste**, con su fichero.
- [docs/graficos.md](docs/graficos.md): **formato de las texturas, convenciones visuales, uso del taller y flujo de trabajo supervisado con IA**.
- [docs/pruebas.md](docs/pruebas.md): cómo probar, incluido el modo `?debug` y las trampas del panel de navegador.
- [docs/despliegue.md](docs/despliegue.md): cómo publicarlo en un servidor web.
- [docs/pendiente.md](docs/pendiente.md): limitaciones conocidas e ideas de mejora.

## Trampas conocidas (léelas antes de cambiar nada)

- **Coordenadas:** la casilla `(i, j)` = (columna, fila) ocupa `x ∈ [i·2, i·2+2]` y `z ∈ [j·2, j·2+2]`. La planta `L`
  tiene el suelo en `y = L·3`. "Norte" es `-z`. Con `yaw = 0` se mira hacia `-z`.
- **Planta actual:** se deduce de la altura de los pies (`levelFromY`), no de la posición. Si teletransportas
  al jugador en pruebas, actualiza también `player.L` y `player.feetY`.
- Suelos, techos y alfombras **no proyectan sombra** (`userData.noCast`). Los muros sí, porque evitan que la
  linterna ilumine a través de ellos.
- **Planos coincidentes:** nada puede quedar en `y = L·3` exacto fuera del suelo, o aparece z-fighting. Por eso
  las vigas terminan 4 cm por debajo del techo.
- Los materiales de las apariciones (`js/ghostmat.js`) comparten programa gracias a `customProgramCacheKey`. Si cambias
  el shader, cambia también la clave (`'aparicion-v1'`). Los fotogramas se cambian con `ponerFotograma()`, que solo sustituye
  `map`/`emissiveMap` y no recompila. `main.js` sube todos los fotogramas a la GPU al empezar.
- **Texturas:** cambiar los parámetros o el código de una familia cambia el juego. Si el cambio es solo de organización,
  comprueba que las texturas salen idénticas píxel a píxel (comparando `getImageData`, como se hizo al separarlas).
  No uses `willReadFrequently` en los lienzos: cambia el suavizado de todas las texturas.
- El audio solo existe tras el primer clic (`audio.ready`). Cualquier nodo de audio debe crearse de forma perezosa.
  El `AudioContext` se suspende en pausa y con la pestaña oculta.
- En el panel de navegador de la app, `requestAnimationFrame` **no corre si el panel está oculto**: usa `?debug` y
  `__casa.tick(1/60)` para avanzar. Además, cierra la pestaña y para el servidor al terminar, porque el audio sigue
  sonando de fondo.
