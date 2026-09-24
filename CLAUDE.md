# Casa Valdemar — guía para Claude

FPS de terror psicológico en el navegador, con HTML5 y three.js, al estilo de Doom y Wolfenstein 3D.
El jugador recorre una mansión a oscuras con una linterna. Las apariciones solo se mueven cuando no las mira,
y el haz sostenido de cerca durante 5-8 s las desintegra. El jugador gana al desterrar a las 8.

## Reglas del proyecto

- **Idioma:** los textos del juego, los comentarios del código y la documentación van en **español**.
  Los identificadores de código van en inglés, salvo excepciones que ya existen (`LEVEL_NAMES`, etc.).
- **Sin paso de compilación.** Son módulos ES nativos y three.js **r160** se carga por importmap desde jsDelivr
  (`index.html`). No añadas npm, bundlers ni TypeScript salvo que el usuario lo pida.
- **Sin ficheros de recursos.** Las texturas se dibujan en canvas (`js/textures.js`) y el sonido es síntesis
  Web Audio (`js/audio.js`). Mantén esta línea: si hace falta un recurso nuevo, se genera por código.
- **El rendimiento manda** ("que no vaya a trompicones"). No crees luces ni materiales nuevos en tiempo de juego:
  cambiar el número de luces recompila shaders. La geometría estática se fusiona por material y por planta.
  Evita reservar memoria en el bucle; reutiliza vectores.
- **Terror psicológico ante todo.** No hay luz general: solo la linterna y puntos de luz (velas, candiles,
  chimenea, luna en las ventanas). La oscuridad y el sonido son la mecánica, no un adorno.
- Después de tocar el mapa, ejecuta siempre `node tools/validar-mapa.mjs`.

## Ejecutar

Hace falta un servidor HTTP estático, porque los módulos ES no cargan desde `file://`:

```bash
python -m http.server 8000
```

Luego abre <http://localhost:8000> (o `http://localhost:8000/?debug` para el modo depuración).
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
| `js/ghosts.js` | IA de las apariciones y shader de desintegración (`onBeforeCompile`) |
| `js/audio.js` | todo el sonido; voces posicionales HRTF de las apariciones |
| `js/post.js` | render a baja resolución + pase final (tone mapping ACES, grano, viñeta, aberración) |
| `js/textures.js` | generadores de texturas en canvas |
| `tools/validar-mapa.mjs` | validador del mapa en Node |

## Documentación de referencia

- [docs/arquitectura.md](docs/arquitectura.md): cómo encajan los módulos, el orden del bucle, la iluminación y el render.
- [docs/mapa.md](docs/mapa.md): formato del mapa, leyenda, reglas de escaleras y cómo añadir objetos.
- [docs/jugabilidad.md](docs/jugabilidad.md): mecánicas y **todas las constantes de ajuste**, con su fichero.
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
- Los materiales de las apariciones comparten programa gracias a `customProgramCacheKey`. Si cambias el shader,
  cambia también la clave (`'aparicion-v1'`).
- El audio solo existe tras el primer clic (`audio.ready`). Cualquier nodo de audio debe crearse de forma perezosa.
  El `AudioContext` se suspende en pausa y con la pestaña oculta.
- En el panel de navegador de la app, `requestAnimationFrame` **no corre si el panel está oculto**: usa `?debug` y
  `__casa.tick(1/60)` para avanzar. Además, cierra la pestaña y para el servidor al terminar, porque el audio sigue
  sonando de fondo.
