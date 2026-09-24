# Mecánicas y parámetros de ajuste

Todos los valores son los que hay ahora en el código. Si cambias alguno, actualiza esta tabla.

## Jugador — `js/player.js`

| Parámetro | Valor | Dónde |
|---|---|---|
| Altura de ojos / radio de colisión | 1,62 m / 0,28 m | `EYE`, `RADIUS` |
| Velocidad andando / corriendo | 2,6 / 4,6 m/s | `update()` |
| Sensibilidad del ratón | 0,0022 rad/px | `update()` |
| Linterna y luz de relleno | en `js/iluminacion.js` (ver «Iluminación» más abajo) | `LUZ.linterna`, `LUZ.relleno` |
| Retraso de la linterna respecto a la cámara | `slerp` con factor `1 − e^(−13·dt)` | `updateFlashlight()` |
| Sombras de la linterna | mapa de 1024, bias −0,0006, normalBias 0,02 | constructor |

## Apariciones — `js/ghosts.js`

| Parámetro | Valor | Constante |
|---|---|---|
| Se consideran "miradas" si están dentro de este cono | 34° (55° si están a menos de 2,2 m) y con línea de visión | `WATCH_COS`, `WATCH_NEAR_COS` |
| Se queman si están dentro del cono de la linterna | 55 % de la apertura (20° con 36°) y a menos de 8,5 m | `BURN_FRAC`, `BURN_RANGE` |
| Tiempo de exposición para desintegrarlas | aleatorio de 5 a 8 s por aparición | `required` |
| Pérdida de exposición sin luz | 0,35 s por segundo | `update()` |
| Duración de la desintegración | 2,4 s | `DIE_TIME` |
| Despiertan si... | están a ≤ 8 casillas de camino o las ves a < 12 m | `update()` |
| Velocidad | 1,55 m/s (< 6 m), 1,9 (< 14 m), 2,7 (más lejos), × 0,75–1,1 oscilante, × `velocidad` del tipo (niña 1,1) | `move()` |
| Distancia de ataque | < 0,8 m en horizontal y < 1,2 m de altura | `update()` |
| Tras atacar | se teletransportan a 10-18 casillas, reaparecen poco a poco y esperan 3 s | `teleportAway()` |
| Primer avistamiento (stinger) | 70 % de la apertura de la linterna y a < 14 m | `SEEN_FRAC` |
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
| Cuadros tétricos | solo cambian mientras no los ves. Al dejar de verlos: tétricos con probabilidad 0,3 + 0,4 × cordura perdida. También con los relámpagos, y siempre desde la 4.ª aparición desterrada (`assets/cuadros.js`) |

## Iluminación — `js/iluminacion.js`

Toda la luz se define en el objeto `LUZ`, que el juego lee en cada fotograma:

| Grupo | Valores actuales | Notas |
|---|---|---|
| `linterna` | 45 cd, alcance 24 m, apertura 36°, borde difuso 0,85, caída 1,3 | caída 2 = física real, que quema de cerca; menos = luz más uniforme |
| `lente` | dureza 0,3, anillo 0,2, suciedad 20 | patrón proyectado (textura `lente-linterna`); dureza baja = luz repartida |
| `relleno` | 0,3 cd, 3 m | luz tenue pegada al jugador |
| `fuentes.vela` | 2,2 / 5,5 m | la vela sobre caja usa ×0,8 |
| `fuentes.candil` | 3 / 6,5 m | |
| `fuentes.chimenea` | 9 / 9 m | |
| `fuentes.luna` | 0,7 / 4,5 m | ×(1 + 7·relámpago) |
| `ventanas` | 0,22 | brillo propio del cristal |
| `ambiente`, `niebla`, `exposicion` | 0,02, 0,085, 1,25 | |

**Panel de ajuste:** abre el juego con `?luz` en la dirección (`http://localhost:8000/?luz`) y pulsa **L** durante la
partida. Sale un panel con controles deslizantes; con él abierto se juega sin capturar el ratón (se mira arrastrando) y
las apariciones pueden quedar congeladas. Los cambios se ven al momento y se guardan en ese navegador, pero solo se
aplican en modo `?luz`. *Copiar valores* genera el texto para sustituir `LUZ` en `js/iluminacion.js`. El taller usa la
misma linterna.

- `POOL_SIZE = 6` luces puntuales en `world.js`. Más luces = más coste por píxel.

## Filosofía de diseño (para no romperla)

- La regla central es **"se mueven cuando no las miras"**. Todo lo demás debe empujar al jugador a apartar la vista:
  varias apariciones a la vez, sonidos a la espalda, portazos, puertas que hay que abrir.
- El jugador **nunca debe tener luz de sobra**. La luz general es casi cero a propósito.
- Avisar sin mostrar: el parpadeo de la linterna, los latidos y los susurros HRTF indican el peligro antes que la imagen.
