# Gráficos: texturas y taller

## Principio

Todos los gráficos del juego son **2D y se generan por código** en un canvas. No hay modelos 3D importados: los muebles
se componen con cajas, cilindros y esferas en `js/world.js`, y así seguirá siendo (**decisión del autor: nunca modelos 3D**).
Para un caso concreto se puede usar una imagen PNG, pero lo normal es dibujar con código.

## Dónde están

```
assets/texturas/index.js        registro: lista de familias (una por fichero)
assets/texturas/<familia>.js    metadatos + función dibujar()
js/texlib.js                    utilidades de dibujo compartidas
js/textures.js                  cargador: cargarTexturas(), lienzo(id), textura(id)
editor.html + editor/           taller de texturas
```

El juego pide cada textura por su **identificador**, por ejemplo `TX.textura('pared-principal')` en `js/world.js`.

## Formato de un fichero de familia

Una *familia* es una función de dibujo. Cada una de sus *texturas* es un juego de valores para esa función.

```js
// Suelo de tarima
import { rng, shade, grain, stains } from '../../js/texlib.js';

export const familia = {
  nombre: 'Suelo de tarima',
  descripcion: 'Qué dibuja, para que la IA y el taller lo entiendan.',
  ancho: 128,              // tamaño del canvas en px
  alto: 128,
  formato: 'suelo',        // cómo se muestra en el taller: pared | suelo | techo | objeto | cuadro | pintada | sprite | luz
  filtro: 'suave',         // opcional: 'suave' = filtrado lineal; por defecto nítido (píxeles de Doom)
  mezcla: 'aditiva',       // opcional: solo para sprites de luz (llamas, halos)
  parametros: {            // controles que el taller genera automáticamente
    semilla: { tipo: 'entero', etiqueta: 'Semilla aleatoria', min: 1, max: 99999 },
    color: { tipo: 'color', etiqueta: 'Color de la madera' },
  },
  texturas: {              // id → valores (+ `uso`, que es solo descriptivo)
    'suelo-principal': { uso: 'Suelo de la planta principal', semilla: 52, color: '#4a2f1c' },
  },
};

export function dibujar(ctx, p) {
  const S = ctx.canvas.width;     // usa siempre el tamaño del canvas, no números fijos
  const r = rng(p.semilla);       // todo lo aleatorio sale de r(): mismo resultado siempre
  // ... dibujar con la API normal de canvas 2D ...
}
```

**Tipos de parámetro:** `entero`, `numero` (admite `paso`), `color` ('#rrggbb'), `booleano` y `texto`.
`min` y `max` son opcionales.

**Utilidades de `js/texlib.js`:**

| Función | Qué hace |
|---|---|
| `rng(semilla)` | generador aleatorio determinista; devuelve `r()` en [0, 1) |
| `shade(color, k, alfa)` | color (número `0xrrggbb` o `'#rrggbb'`) multiplicado por `k`, como `rgba()` |
| `rgb(r, g, b, a)` | cadena `rgba()` |
| `stains(ctx, x0, y0, w, h, r, n, col, alfaMax, radioMax)` | manchas difusas |
| `drips(ctx, x0, w, yInicio, h, r, n, col, alfa)` | chorretones verticales |
| `grain(ctx, w, h, r, amplitud)` | grano monocromo (conviene hacerlo al final) |

## Convenciones visuales

- **Tamaños:**
  - paredes: 256×192 (dos variantes de 128×192 lado a lado; cada tramo de muro usa una);
  - suelos y techos: 128×128 (una casilla de 2×2 m);
  - objetos: 64×64;
  - aparición: 128×256 con fondo transparente.
- **Pixel art:** 1 px ≈ 1,5 cm en paredes y suelos. Se ve ampliado sin suavizar, así que los detalles de 1 px sí se notan.
- **Paleta oscura y apagada:** el juego es casi negro y se ve con linterna. Colores muy saturados o muy claros "brillan"
  demasiado. Las manchas, la suciedad y el grano son parte del estilo.
- **Relieve:** paredes y suelos usan la propia textura como mapa de relieve. Lo oscuro parece hundido (juntas, grietas)
  y lo claro, saliente.
- **Paredes:** la franja inferior (y > 124 px) es el zócalo, a la altura de las rodillas. Evita detalles que se corten mal
  entre las dos variantes.
- **Determinismo:** nada de `Math.random()`, solo `r()`. Así la misma semilla da siempre la misma textura.

## Usar una imagen PNG (casos concretos)

Pon el PNG en `assets/texturas/` y añade `imagen` a la textura:

```js
texturas: {
  'retrato-abuela': { uso: 'Cuadro del vestíbulo', imagen: 'retrato-abuela.png' },
},
```

Si existe `imagen`, se usa en lugar de `dibujar()`, y el taller la muestra con la marca **PNG**. La familia sigue
necesitando `ancho`, `alto`, `formato` y un `dibujar()`, que puede estar vacío. Respeta los tamaños de la tabla anterior.
Guarda las imágenes con transparencia si es un sprite.

## Añadir una textura o una familia nueva

1. **Otra textura de una familia existente:** añade una entrada en `texturas` con otros valores.
2. **Familia nueva:** crea `assets/texturas/<nombre>.js` y añade `'<nombre>'` a `FAMILIAS` en `index.js`.
3. **Que el juego la use:** pídela con `TX.textura('<id>')` donde corresponda (normalmente en `World.makeMaterials()` de
   `js/world.js`).

## El taller de texturas (`editor.html`)

Se abre con el servidor local en `http://localhost:8000/editor.html` (o 8123 en el panel de la app).

- **Galería (izquierda):** todas las texturas por familia, con buscador. Se recorre con las flechas ↑/↓. Marcas:
  - **nueva:** cambió en disco desde que se abrió el taller;
  - **ajuste:** tiene parámetros probados;
  - **✎:** tiene cambios pedidos;
  - **✓:** está aprobada;
  - **PNG:** usa una imagen.
- **2D:** zoom (Ajustar, 1× a 4×), mosaico para ver cómo casa al repetirse, y **Antes** (mantener pulsado) para comparar con
  la versión que había al abrir el taller. Al pasar el ratón se ven las coordenadas y el color de cada píxel.
- **3D:** una habitación de 3×3 casillas donde la textura se coloca según su `formato`: en las paredes, el suelo, el techo,
  sobre objetos, como cuadro o pintada en la pared del fondo, como figura o sprite, o como lente de la linterna. La luz puede
  ser **Linterna**, **Vela** o **Luz plena**, y la opción *Como en el juego* aplica la baja resolución, el grano y la viñeta.
  Se mira arrastrando, la rueda mueve la cámara y el doble clic la devuelve a su sitio.
- **Parámetros (derecha):** controles generados desde `parametros`. Los cambios son **pruebas**: no tocan el fichero.
  *Copiar valores* copia la línea de la textura lista para pegar.
- **Revisión:** estado (Sin revisar / Pedir cambios / Aprobada) y notas, guardados en el `localStorage` del navegador.
  *Copiar petición para la IA* (o *Copiar peticiones pendientes*, arriba) genera un texto con el fichero, los valores
  probados y las notas, listo para pegar en el chat.
- **Vigilar cambios:** cada 1,5 s comprueba si cambió algún fichero de `assets/texturas/` y recarga sin perder la
  selección. Está activado por defecto en local.
  - Un error de sintaxis se muestra en una franja roja y el resto sigue funcionando.
  - Un error al dibujar se muestra sobre la vista 2D.
  - Los cambios en `js/texlib.js` necesitan recargar la página.

## Flujo de trabajo con una IA (supervisado)

1. Abres el taller y describes lo que quieres. Puedes hacerlo con notas en la textura y *Copiar petición*, o directamente en
   el chat: «un papel pintado azul con pájaros, más deteriorado».
2. La IA edita o crea el fichero en `assets/texturas/` **en una rama**, no en `main`, porque `main` se publica.
3. El taller recarga solo. Revisas en 2D, en 3D con la linterna y con *Antes*, y apruebas o escribes nuevas notas.
4. Cuando está aprobada, la IA hace commit. Git guarda el historial y cualquier cambio se puede deshacer.

Para la IA: lee la `descripcion` y el `uso` de la familia antes de cambiarla. Conserva los identificadores que usa el juego
y no cambies el tamaño de una familia sin revisar dónde se usa. Tras el cambio, comprueba en el taller o en la consola que no
hay errores.
