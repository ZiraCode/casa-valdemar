# Casa Valdemar

FPS de terror psicológico para navegador (HTML5 + three.js), al estilo de Doom y Wolfenstein 3D.
Las texturas y el sonido se generan por código, así que no hay ficheros de recursos.

## Cómo jugar

El juego usa módulos ES, así que necesita un servidor HTTP (abrir `index.html` con doble clic no funciona):

- **Windows:** doble clic en `iniciar.bat` (solo es un atajo que arranca un servidor local)
- **Cualquier sistema:** `python -m http.server 8000` en esta carpeta y abrir <http://localhost:8000>
- **En internet:** se sube tal cual a cualquier alojamiento estático (GitHub Pages, Netlify, itch.io...). Ver [docs/despliegue.md](docs/despliegue.md).

Hace falta conexión a internet: three.js y las fuentes se cargan desde un CDN.

| Tecla | Acción |
|---|---|
| W A S D / flechas | moverse |
| Ratón | mirar y apuntar la linterna |
| Shift | correr |
| Espacio | abrir / cerrar puertas |
| P | resolución interna 50 % (retro) → 75 % → 100 % |
| Esc | pausa |

## Reglas

- Las apariciones **solo se mueven cuando no las miras** (fuera de un cono de ~34° o sin línea de visión).
- Si mantienes el haz de la linterna sobre una, a menos de ~8,5 m, empieza a deshacerse entre 5 y 8 segundos después (el tiempo es aleatorio para cada una). Si apartas la luz, lo acumulado baja poco a poco.
- Si una te alcanza, pierdes cordura. Con la cordura a cero pierdes la partida.
- Cuando destierras a las 8, ganas.

## Estructura

```
index.html        interfaz y pantallas
css/style.css
js/main.js        bucle, estados, HUD, eventos aleatorios, relámpagos
js/map.js         las 4 plantas en rejilla, escaleras, colisiones, grafo y línea de visión
js/world.js       geometría fusionada por material, puertas, decoración, reparto de luces
js/player.js      movimiento, balanceo de cámara, linterna (SpotLight con sombras)
js/ghosts.js      IA (campo de flujo BFS entre plantas) y shader de desintegración
js/audio.js       sonido procedural con Web Audio (HRTF posicional)
js/post.js        postproceso: baja resolución, grano, viñeta, aberración
js/textures.js    texturas procedurales en canvas
```

Para editar el mapa, cambia las cadenas de `RAW` en `js/map.js` y valida con `node tools/validar-mapa.mjs`.
La documentación técnica está en [CLAUDE.md](CLAUDE.md) y en la carpeta [docs/](docs/).
