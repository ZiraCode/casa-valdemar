# El mapa

Está en `js/map.js`, en la constante `RAW`: 4 plantas de **22 columnas × 16 filas**, un carácter por casilla.
Cada casilla mide 2×2 m y cada planta 3 m de alto. La fila 0 es el norte (`-z`).

## Leyenda

| Car. | Significado | Notas |
|---|---|---|
| `#` | muro | textura según la planta: piedra, papel rojo, papel verde, tablones |
| `k` | estantería (muro) | en el sótano se pinta como botellero |
| `F` | chimenea (muro) | fuego, luz y suelo de piedra delante de cada cara abierta |
| `E` | puerta principal (muro) | no se abre; con Espacio muestra un mensaje |
| `w` | ventana (muro) | **no se escribe en `RAW`**: se añade con la lista `WINDOWS` (debe caer sobre un `#`) |
| `.` | suelo | |
| `D` | puerta | necesita muro a ambos lados (izq./der. o arriba/abajo) para saber su orientación |
| `^ v < >` | escalera que **sube** en esa dirección | se escribe en la planta de abajo |
| `_` | hueco sobre una escalera | se escribe en la planta de arriba |
| `P` | inicio del jugador | solo uno; mira al norte |
| `G` | aparición | el juego cuenta las que haya; su tipo (dama, niña...) se asigna en `assets/apariciones.js` |
| `!` | pintada en un muro `#` vecino | los textos están en `DECALS` (`world.js`), en orden |
| `t` | mesa | varias `t` seguidas forman una mesa larga con mantel |
| `C` | silla | se orienta hacia la `t` vecina |
| `a` | sillón tapado | mira a la chimenea si hay una a 4 casillas o menos en línea recta |
| `c` | candelabro (luz) | en sótano y buhardilla es una vela sobre una caja |
| `l` | candil colgante (luz) | se balancea; no bloquea el paso |
| `b` | cama | cabecero contra un muro; a veces con "alguien" bajo la sábana; más pequeña en la buhardilla |
| `p` | piano | contra un muro; suena en eventos aleatorios de la planta principal |
| `n` | reloj de pie | péndulo animado y tictac |
| `x` | cajas apiladas | |
| `r` | barriles | |
| `o` | ataúd sobre peana | tapa entreabierta |
| `m` | figura tapada con sábana | |
| `h` | mecedora | se mece más cuanto más cerca está el jugador |
| `d` | muñeca | se gira hacia el jugador cuando no la mira |
| `T` | bañera | agua oscura |

Los objetos que se apoyan en la pared (`b p n T` y las mecedoras) eligen un muro vecino con el RNG fijo del mundo
(`rng(1337)`). El resultado es el mismo en cada partida, pero **cambia si añades o quitas objetos antes en el recorrido**.

## Reglas de las escaleras

Ejemplo: la escalera principal sube hacia el norte (`^`) en la planta 1, columnas 10-11 y filas 6-8.

```
Planta 1 (abajo)            Planta 2 (arriba)
fila 5:  ##  ← muro         fila 5:  ..  ← rellano (salida superior)
fila 6:  ^^                 fila 6:  __
fila 7:  ^^                 fila 7:  __
fila 8:  ^^                 fila 8:  __
fila 9:  ..  ← entrada      fila 9:  ##  ← muro
```

- Encima de cada casilla de escalera, en la planta L+1, tiene que haber un `_`.
- La casilla siguiente al último peldaño es **muro en L** y **suelo en L+1**.
- La casilla anterior al primer peldaño es **suelo en L** y **muro en L+1**. Si no, se puede caer por el hueco.
- Los laterales de la escalera tienen que ser muro **en las dos plantas**.
- Cada columna de `^` es un tramo independiente, así que una escalera ancha son varios tramos paralelos.

`Mansion.parseStairs` avisa por consola si no se cumple alguna regla. `node tools/validar-mapa.mjs` convierte esos
avisos en error y además comprueba que todo sea alcanzable.

## Conexiones actuales

| Escalera | Planta baja | Dirección | Casillas | Llega a |
|---|---|---|---|---|
| Sótano → Principal | 0 | `^` | col 20, filas 2-4 | cocina de la planta 1, puerta en (19,1) |
| Principal → Segunda (x2) | 1 | `^` | cols 10-11, filas 6-8 | rellano del pasillo de la planta 2, fila 5 |
| Segunda → Buhardilla | 2 | `v` | col 20, filas 6-8 | buhardilla, (20,9) |

## Distribución

- **Sótano (0):** almacén de barriles (NO), bodega con botellero (N), trastero (NE) y escalera (E); pasillo en la fila 6; cuarto de calderas (SO), cripta con ataúdes (S) y cuarto del pozo (SE).
- **Planta principal (1):** biblioteca (NO), estudio con reloj (N), cocina (NE); salón con chimenea y piano (O), vestíbulo con la escalera y la puerta principal (centro), comedor (E).
- **Segunda planta (2):** dormitorio, baño, dormitorio y cuarto infantil al norte; pasillo en la fila 5; dormitorio principal (SO), saleta (S) y cuarto de invitados (SE).
- **Buhardilla (3):** trasteros al norte, gran espacio abierto con figuras tapadas y cuarto infantil cerrado (SO).

## Otros datos del mapa

- **Ventanas:** `WINDOWS` en `map.js`, con formato `[planta, columna, fila]`. Cada ventana es también una fuente de luz de luna.
- **Alfombras:** `RUGS` en `world.js`, con formato `[planta, col0, fila0, col1, fila1]`, rectángulos inclusivos.
- **Retratos:** se colocan al azar (10 %) en caras de muro `#` de las plantas 1 y 2 que dan a una casilla `.`, salvo en las
  paredes ocupadas por un cuadro.
- **Cuadros hechos fuera:** en `assets/cuadros.js`, cada uno con sus `sitios` (casilla + pared). Ahora mismo: *Los Valdemar*
  en la pared este de la casilla (13,12) del vestíbulo y *La casa del páramo* en la pared oeste de (1,8) del salón. Ver
  [graficos.md](graficos.md).

## Añadir un tipo de objeto nuevo

1. Elige un carácter libre y documéntalo en la leyenda de `map.js` y en esta tabla.
2. Añade el `case` en `World.buildDecor` y un método que use `this.part(L, material, geometría, lx, ly, lz, F)`. Aquí `F = {x, y, z, ry}` es el marco de la casilla, y así la pieza entra en la fusión de geometría.
3. Si bloquea el paso, llama a `this.block(L, i, j, cx, cz, semiAncho, semiFondo)`. Es una caja AABB, así que con giros de 90° hay que intercambiar los ejes.
4. Si da luz, llama a `addLight(...)` + `addFlame(...)` (+ `addGlow`). Si se anima, crea un `Group` propio y actualízalo en `World.update`.
5. Ejecuta `node tools/validar-mapa.mjs`.
