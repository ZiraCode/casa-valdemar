# Gráficos: texturas y taller

## Principio

Todos los gráficos del juego son **2D**. No hay modelos 3D importados: los muebles se componen con cajas, cilindros y
esferas en `js/world.js`, y así seguirá siendo (**decisión del autor: nunca modelos 3D**). Casi todo se genera por código
en un canvas. Las **imágenes hechas fuera** (por ahora, los cuadros) se usan para lo que es difícil de dibujar así; ver
«Cuadros e imágenes externas» más abajo.

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
  animacion: { fotogramas: 4, fps: 5 },  // opcional: dibujar() se llama una vez por fotograma con p.fotograma
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

## Sprites animados

Si la familia declara `animacion: { fotogramas: N, fps }`, se dibuja N veces con `p.fotograma` = 0…N−1. Las reglas:

- **Mismo azar en todos los fotogramas:** crea `r = rng(p.semilla)` al principio y haz siempre las mismas llamadas a `r()`,
  en el mismo orden. Así los detalles aleatorios (bajo del vestido, mechones) no parpadean de un fotograma a otro.
- **El movimiento sale del fotograma, no del azar.** Las apariciones usan un vaivén
  `sw = Math.sin(p.fotograma / N * 2π)`: sumado a unas pocas coordenadas (bajo del vestido, puntas del pelo, dedos, muñeca),
  da un balanceo en bucle. Con `sw = 0` (fotograma 0) queda la pose base.
- **Movimientos pequeños:** 1-3 px bastan a esta resolución. Más da tirones.
- Las texturas PNG son siempre de un fotograma.

En el juego, cada aparición recorre sus fotogramas a `fps`, desfasada respecto a las demás. En el taller, la vista 2D tiene
*Animación* (reproducir o pausar) y ‹ › para ir fotograma a fotograma; el *Mosaico* de un sprite animado muestra todos los
fotogramas en fila.

## Apariciones: tipos y asignación

`assets/apariciones.js` define los **tipos** de aparición:

| Campo | Qué es |
|---|---|
| `calma`, `grito` | identificadores de textura. La de grito se usa a menos de 3,8 m o con la quemadura por encima del 55 % |
| `alto`, `ancho` | tamaño del sprite en metros (respeta la proporción de la textura) |
| `velocidad` | multiplicador de la velocidad de avance |
| `voz` | multiplicador del tono de susurros y gemidos (> 1, más aguda) |

`ASIGNACION` dice qué tipo usa cada `G` del mapa (clave `"planta:columna,fila"`). El resto usa `POR_DEFECTO`.
Ahora mismo hay dos tipos: **la dama** (6) y **la niña** (2, en los cuartos infantiles de la segunda planta y la buhardilla).

Para crear un tipo nuevo:
1. Crea su familia de sprites (con `calma` y `grito`) en `assets/texturas/` y regístrala en `index.js`.
2. Añade el tipo en `TIPOS` y asígnalo a alguna `G` en `ASIGNACION`.
3. Ejecuta `node tools/validar-mapa.mjs`: comprueba que las texturas existen y que las claves corresponden a apariciones del mapa.

**Convenciones de los sprites de aparición:** fondo transparente, figura pálida (casi blanca, porque el material la tiñe de
azul y la linterna la ilumina fuerte), rasgos en negro puro, halo suave que se desvanece **antes** del borde del lienzo (si no,
se ve el rectángulo) y las líneas de exploración y el ruido de alfa del final, que le dan el aspecto etéreo. La cabeza queda
hacia el 60 % de la altura desde los pies: el juego calcula ahí si la estás mirando.

El material y el shader (quemadura y desintegración) están en `js/ghostmat.js` y los comparten el juego y el taller. En la
vista 3D del taller, los sprites de aparición tienen un selector **Calma / Quemándose / Desintegrándose** con un control
deslizante, para verlos exactamente como en el juego y a la escala de su tipo.

## Cuadros e imágenes externas

Los cuadros son imágenes hechas fuera del juego (por ejemplo, generadas con otra IA en estilo pixel art). Cada uno tiene una
**versión normal y otra tétrica**.

**Dónde va cada cosa:**

```
assets/cuadros/casa.png                la imagen (y su pareja tétrica)
assets/texturas/cuadros.js             una textura por imagen: 'cuadro-casa', 'cuadro-casa-tetrica'...
assets/cuadros.js                      CUADROS (parejas, tamaño y dónde se cuelgan) y REGLAS
```

**Añadir un cuadro:**
1. Copia las dos imágenes en `assets/cuadros/`.
2. En `assets/texturas/cuadros.js`, añade dos texturas con `imagen: '../cuadros/<fichero>'`.
3. En `assets/cuadros.js`, añade una entrada con `normal`, `tetrica`, `alto` (en metros) y `sitios`. Cada sitio es la casilla
   transitable delante del cuadro y la pared de esa casilla donde se cuelga (`'norte'`, `'sur'`, `'este'` u `'oeste'`), que
   tiene que ser un muro `#`.
4. Ejecuta `node tools/validar-mapa.mjs`: comprueba que las texturas existen y que cada sitio es válido y no está repetido.
   Los retratos aleatorios nunca se colocan en una pared ocupada por un cuadro.

**Requisitos de la imagen:**

| Aspecto | Requisito |
|---|---|
| Formato | PNG, JPG o WebP |
| Tamaño | unos 200 px de ancho. Si es más grande se reduce al cargar (`anchoMax: 200`); más pequeña se usa tal cual |
| Proporción | libre. El ancho en el juego sale de `alto` × la proporción. Las dos versiones de una pareja deben tener **la misma proporción y el mismo encuadre** para que el cambio no se note |
| Marco | incluido en la imagen, como en los ejemplos |
| Estilo | pixel art con píxeles gruesos (bloques de 3-4 px a 200 px de ancho, unos 60 px por metro, como las paredes) y colores oscuros y apagados |
| Transparencia | no hace falta |
| Nombre | minúsculas, sin espacios ni tildes |
| Derechos | propia, generada por ti, de dominio público o con licencia que permita usarla (el repositorio y el juego son públicos) |

**Integración:** la familia `cuadros` tiene `usaImagen: true`, así que su `dibujar()` recibe la imagen en `p.imagen` y le
aplica **barniz** (oscurece y amarillea), **manchas** y **grano**, con parámetros ajustables en el taller.
Cualquier familia puede usar este mecanismo.

**Cuándo se ve la versión tétrica** (`REGLAS` en `assets/cuadros.js`). Un cuadro **solo cambia mientras no lo estás viendo**:
fuera de pantalla (fuera del campo de visión de la cámara) o tapado por una pared. Nunca lo ves cambiar; solo notas al volver
a mirarlo que ya no es igual.
- Cada vez que deja de verse, se decide cómo estará la próxima vez: tétrico con probabilidad `probabilidad` (0,3) +
  `probabilidadPorLocura` (0,4) × la cordura perdida.
- Durante el destello de los relámpagos se ve tétrico (el propio destello disimula el cambio).
- A partir de la cuarta aparición desterrada (`tetricosTrasDesterrar`), el juego avisa con un susurro y un mensaje, y la
  próxima vez que mires cada cuadro estará tétrico para siempre.

**En el taller:** los cuadros llevan la marca **IMG**, la ficha tiene un botón para saltar entre la versión normal y la
tétrica, y la vista 3D los cuelga a su tamaño real. Puedes **arrastrar una imagen** sobre la vista 2D o 3D para probarla
en el cuadro seleccionado sin copiarla al proyecto (marca **prueba**, botón *Quitar prueba*).

## Usar una imagen tal cual (sin tratar)

Pon el PNG en `assets/texturas/` y añade `imagen` a la textura:

```js
texturas: {
  'retrato-abuela': { uso: 'Cuadro del vestíbulo', imagen: 'retrato-abuela.png' },
},
```

Si existe `imagen` y la familia no tiene `usaImagen`, se copia tal cual en lugar de llamar a `dibujar()`, y el taller la
muestra con la marca **IMG**. La familia sigue
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
