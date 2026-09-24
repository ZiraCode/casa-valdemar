# Mecánicas y parámetros de ajuste

Todos los valores son los que hay ahora en el código. Si cambias alguno, actualiza esta tabla.

## Jugador — `js/player.js`

| Parámetro | Valor | Dónde |
|---|---|---|
| Altura de ojos / radio de colisión | 1,62 m / 0,28 m | `EYE`, `RADIUS` |
| Velocidad andando / corriendo | 2,6 / 4,6 m/s | `update()` |
| Sensibilidad del ratón | 0,0022 rad/px | `update()` |
| Linterna: intensidad, alcance, ángulo, penumbra | 240 cd, 30 m, 0,5 rad, 0,5 | `SpotLight(...)` y `baseSpot` |
| Luz de relleno cercana | 1,2 cd, 4,5 m | `spill`, `baseSpill` |
| Retraso de la linterna respecto a la cámara | `slerp` con factor `1 − e^(−13·dt)` | `updateFlashlight()` |
| Sombras de la linterna | mapa de 1024, bias −0,0006, normalBias 0,02 | constructor |

## Apariciones — `js/ghosts.js`

| Parámetro | Valor | Constante |
|---|---|---|
| Se consideran "miradas" si están dentro de este cono | 34° (55° si están a menos de 2,2 m) y con línea de visión | `WATCH_COS`, `WATCH_NEAR_COS` |
| Se queman si están dentro del cono de la linterna | 19° y a menos de 8,5 m | `BURN_COS`, `BURN_RANGE` |
| Tiempo de exposición para desintegrarlas | aleatorio de 5 a 8 s por aparición | `required` |
| Pérdida de exposición sin luz | 0,35 s por segundo | `update()` |
| Duración de la desintegración | 2,4 s | `DIE_TIME` |
| Despiertan si... | están a ≤ 8 casillas de camino o las ves a < 12 m | `update()` |
| Velocidad | 1,55 m/s (< 6 m), 1,9 (< 14 m), 2,7 (más lejos), × 0,75–1,1 oscilante | `move()` |
| Distancia de ataque | < 0,8 m en horizontal y < 1,2 m de altura | `update()` |
| Tras atacar | se teletransportan a 10-18 casillas, reaparecen poco a poco y esperan 3 s | `teleportAway()` |
| Primer avistamiento (stinger) | con el cono de 24° y a < 14 m | `SEEN_COS` |
| Cara de grito | a < 3,8 m, o cuando la quemadura supera el 55 % | `update()` |

El campo de flujo BFS desde la casilla del jugador se recalcula cada 0,2 s (`GhostManager.update`).

## Partida — `js/main.js`

| Parámetro | Valor |
|---|---|
| Cordura inicial / daño por ataque | 100 / −34 (el tercer golpe es la derrota) |
| Recuperación | +1,5/s si pasan más de 6 s sin golpe y el miedo es < 0,25 |
| Desgaste | −1,5/s si el miedo es > 0,75 (una aparición muy cerca) |
| Miedo (`ghosts.fear`) | `1 − dist/13` de la aparición cazadora más cercana, ×1,15 si no la miras |
| Peligro (`ghosts.danger`) | aparición sin mirar a < 7 m: la linterna parpadea con probabilidad `(0,2 + 1,3·peligro)·dt` |
| Eventos aleatorios | cada 12-34 s: golpes, susurro al oído, parpadeo, arrastre, crujido, portazo, pasos arriba (salvo en la buhardilla), piano (planta principal) |
| Relámpagos | cada 20-55 s, solo de la planta principal hacia arriba |
| Victoria | 4,5 s después de desterrar la última, fundido y pantalla final |

## Mundo y luces — `js/world.js`

| Fuente | Intensidad / alcance | Parpadeo |
|---|---|---|
| Candelabro (`candle`) | 4,5 cd / 7 m (vela sobre caja: 3,5 / 6) | suave, con caídas ocasionales |
| Candil (`lamp`) | 6 / 8,5 | muy suave |
| Chimenea (`fire`) | 18 / 11 | fuerte |
| Ventana (`moon`) | 1,6 / 5,5 | ×(1 + 7·relámpago) |

- `POOL_SIZE = 6` luces puntuales. Más luces = más coste por píxel.
- La niebla es `FogExp2(0x000000, 0.075)` (`main.js`). Subirla oscurece más y oculta más; bajarla deja ver más lejos.
- La exposición del postproceso es `uExposure = 1.25` (`post.js`).

## Filosofía de diseño (para no romperla)

- La regla central es **"se mueven cuando no las miras"**. Todo lo demás debe empujar al jugador a apartar la vista:
  varias apariciones a la vez, sonidos a la espalda, portazos, puertas que hay que abrir.
- El jugador **nunca debe tener luz de sobra**. La luz general es casi cero a propósito.
- Avisar sin mostrar: el parpadeo de la linterna, los latidos y los susurros HRTF indican el peligro antes que la imagen.
