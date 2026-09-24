# Arquitectura

## Arranque (`js/main.js`)

1. Espera a que cargue la fuente *Special Elite*, con un límite de 2,5 s, porque las pintadas de las paredes se dibujan con ella.
2. Crea el `WebGLRenderer` (sin antialias, `pixelRatio` 1, sombras `PCFSoftShadowMap`, sin tone mapping, que lo hace `post.js`).
3. Crea la escena con `FogExp2` negra de densidad 0,075 y una `HemisphereLight` casi nula (0,035) que solo sube con los relámpagos.
4. Instancia, por este orden, `AudioEngine`, `Mansion` (datos), `World` (geometría), `Player`, `Post` y `GhostManager`.
5. Llama a `renderer.compile()` para precompilar los shaders y evitar tirones al empezar.
6. Arranca el bucle `frame()`, que ejecuta `requestAnimationFrame` y después `tick(dt)` con `dt ≤ 0,05`.

## Orden de `tick(dt)`

```
G.time += dt
si playing → updatePlaying(dt):
    player.update                 movimiento, colisión, altura, cámara, linterna
    cambio de planta              world.setVisibleLevel, audio.setLevel, mensaje la primera vez
    ghosts.update                 flujo BFS cada 0,2 s + cada aparición
    parpadeo por peligro          linterna parpadea si hay una aparición cerca y sin mirar
    cordura, eventos aleatorios, relámpagos, cuenta atrás de victoria, pista [ESPACIO]
si dead/won → fundido y pantalla final
world.update                      puertas, llamas, candiles, péndulos, mecedoras, muñecas, relámpago, reparto de luces
decaimiento de efectos (hit, flash, miedo suavizado), inclinación de cámara por cordura
audio.update                      oyente, miedo, latido, fuego, reloj, goteo, quemadura
HUD y uniforms de post → post.render
```

## Estados del juego (`G.state`)

`title` → clic → `playing` ⇄ `paused` (Esc o pestaña oculta) → `dead` o `won` → pantalla final → `location.reload()`.

- Con pointer lock se juega con el ratón capturado. Si el navegador no lo permite (por ejemplo, dentro de un iframe), se juega arrastrando con el botón pulsado (`G.dragLook`).
- Chrome exige esperar ~1 s tras salir con Esc para volver a capturar el ratón. `onLockFail` muestra un aviso en ese caso.

## Datos del mapa (`js/map.js`, clase `Mansion`)

- `grid[L][j][i]`: un carácter por casilla. Ver [mapa.md](mapa.md).
- `stairs`: tramos de escalera con `a0` (borde inferior proyectado en la dirección de subida) y `len`. La altura en una rampa es `(L + t)·3`, con `t = (p·dir − a0)/len`.
- `heightAt(x, z, L)`: altura del suelo. En una casilla `_` de la planta L usa la escalera de la planta L−1.
- `levelFromY(feetY)`: redondea a la planta más cercana. Así se pasa de planta justo a mitad de escalera.
- `collectBoxes` / `resolveCircle`: colisión de un círculo contra cajas AABB en las 3×3 casillas vecinas. Cuentan los muros, los marcos y hojas de puerta cerradas (`Door.boxes`) y los bloqueadores de muebles (`addBlocker`).
- `buildGraph` / `bfs`: grafo de casillas transitables. Las escaleras solo se conectan por sus extremos. Las puertas son transitables siempre, porque las apariciones las atraviesan.
- `los(a, b)`: línea de visión 3D por muestreo cada 0,2 m. La bloquean muros, puertas cerradas (cerca del plano de la hoja), el interior de los peldaños y los forjados, salvo por un hueco `_`.

## Construcción (`js/world.js`)

- **Muros:** para cada casilla muro se genera un quad por cada cara que da a una casilla no muro. Cada textura de pared mide 256×192 con **dos variantes** de 128 px, y cada cara elige una de las dos mitades en `u`.
- **Suelos y techos:** un quad por casilla. No hay techo donde la planta de arriba tiene hueco `_`.
- **Fusión de geometría:** todo lo estático se acumula por `(planta, material)` y al final se fusiona con `mergeGeometries` en una sola malla. El resultado son unas 15-25 llamadas de dibujo por planta.
- **Planta visible:** cada planta es un `Group`. Solo se ven la actual y las contiguas (`setVisibleLevel`).
- **Objetos animados** (fuera de la fusión): hojas de puerta, candiles, péndulos, mecedoras y muñecas.
- **Luces:**
  - Hay **6 `PointLight` fijas** (`POOL_SIZE`) que cada fotograma se asignan a las fuentes más cercanas de la planta actual (radio de 22 m, con desvanecimiento entre 15 y 22 m).
  - Las fuentes están en `lightSources`. Su tipo (`candle`, `lamp`, `fire`, `moon`) define el parpadeo.
  - Cerca de una aparición (< 4,5 m), las llamas se debilitan.
  - Las llamas visibles son `Sprite` aditivos con `fog: false`, así que se ven a lo lejos en la oscuridad.

## Jugador (`js/player.js`)

- La cámara usa rotación `YXZ` con `yaw` y `pitch`. El balanceo al andar genera los pasos en cada cruce por cero.
- **Linterna:**
  - `SpotLight` hija de un `rig` que sigue a la cámara con `slerp`. Ese retraso da sensación de peso.
  - Está desplazada 16 cm a la derecha y 14 cm abajo, para que las sombras se vean.
  - Lleva textura de lente (`spot.map`) y proyecta sombras (mapa de 1024).
  - Una `PointLight` de relleno débil (`spill`) ilumina lo más cercano.
- `startFlicker(s)`: parpadeo aleatorio. `lightOn` es falso cuando la intensidad baja del 50 %, y entonces no quema.
- `lightPos` y `lightDir` son los datos que usan las apariciones para saber si están iluminadas.

## Apariciones (`js/ghosts.js`)

- Cada una es un plano de 1,05×2,1 m que siempre gira hacia la cámara, con textura de canvas. Hay dos texturas: calma y grito.
- Material `MeshStandardMaterial` modificado con `onBeforeCompile`:
  - Uniforms `uDissolve`, `uBurn`, `uTime` y `uAlpha`.
  - Al disolverse, el ruido descarta píxeles y deja un borde de brasas.
- Estados: `dormant` → `hunt` → `dying` → `dead`. Ver [jugabilidad.md](jugabilidad.md).
- **Movimiento:** siguen de centro a centro de casilla el vecino con menor distancia BFS al jugador. Con eso suben y bajan escaleras solas. Cuando están cerca, van directas hacia el jugador.
- La voz (`audio.createVoice`) se crea de forma perezosa cuando el audio ya está listo.

## Audio (`js/audio.js`)

- La cadena de salida es `master → compresor → salida`, con un envío a una reverb de convolución (impulso generado).
- **Capas continuas:** dron grave, viento (por planta), tensión aguda y grave (miedo), acúfeno (cordura baja), fuego y quemadura.
- **Efectos puntuales:** pasos, crujidos, puertas, portazo, cerradura, stinger, susto, despertar, muerte de aparición, trueno, piano, golpes, pasos arriba, susurro al oído, arrastre.
- `at(pos)` crea un `PannerNode` HRTF para los sonidos 3D. El oyente se actualiza cada fotograma.
- `suspend()` y `resume()` se usan en pausa y cuando la pestaña queda oculta.

## Postproceso (`js/post.js`)

- La escena se dibuja en un `WebGLRenderTarget` HalfFloat al 50 %, 75 % o 100 % de resolución (tecla P). Por debajo del 100 % se escala con filtro *nearest*, lo que da el aspecto retro.
- El pase final hace ondulación, saltos de línea tipo cinta, aberración cromática, exposición, ACES, desaturación, sangre en los bordes al recibir un golpe, viñeta, gamma, grano y fundido.
- Uniforms que controla `main.js`: `uFear`, `uSanity`, `uHit`, `uFlash`, `uFade`.
