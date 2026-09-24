# Ejecución y despliegue

## Por qué hace falta un servidor

El juego usa **módulos ES** (`<script type="module">` e `import`). Los navegadores bloquean la carga de módulos desde
`file://` por seguridad (CORS), así que abrir `index.html` con doble clic muestra una pantalla en negro.
Basta con **cualquier servidor HTTP de ficheros estáticos**: no hay backend, base de datos ni paso de compilación.

`iniciar.bat` es solo una comodidad para Windows. Lanza `python -m http.server 8000` (o `npx serve` si no hay Python)
y abre el navegador. **No es necesario para publicar el juego.**

## Publicar en la web

Sube la carpeta tal cual (`index.html`, `css/`, `js/`, `assets/`) a cualquier alojamiento estático:

| Opción | Cómo |
|---|---|
| **GitHub Pages** | sube el repositorio y activa *Settings → Pages → Deploy from branch* (raíz) |
| **Netlify / Cloudflare Pages / Vercel** | arrastra la carpeta o conecta el repositorio; sin comando de build y con la raíz como directorio de publicación |
| **itch.io** | comprime en ZIP (con `index.html` en la raíz), crea un proyecto HTML y marca *This file will be played in the browser* |
| **Servidor propio** (Apache, nginx, IIS) | copia los ficheros en la carpeta pública |

No hace falta subir: `iniciar.bat`, `tools/`, `docs/`, `.claude/`, `CLAUDE.md` ni `README.md`.
`editor.html` y `editor/` son opcionales. En GitHub Pages se publican y funcionan como visor, pero sin recarga automática,
que solo tiene sentido en local.
Sí hay que subir `assets/`, porque el juego dibuja sus texturas desde ahí.

### Requisitos del servidor

- Tiene que servir los `.js` con tipo MIME `text/javascript` (o `application/javascript`). Casi todos lo hacen por defecto.
  En IIS puede hacer falta añadir el tipo `.mjs`/`.js` si no está.
- Se recomienda **HTTPS**. Algunos navegadores limitan funciones como la captura del ratón o el audio en páginas no seguras
  que no sean `localhost`.
- Dentro de un iframe (itch.io), el pointer lock depende de que el iframe lo permita. Si no lo permite, el juego pasa al
  modo de arrastrar con el ratón.

## Dependencias externas (CDN)

`index.html` carga en tiempo de ejecución:

- three.js r160 desde `cdn.jsdelivr.net`, por importmap (`three` y `three/addons/`).
- Las fuentes *IM Fell English SC* y *Special Elite* desde Google Fonts.

Sin conexión, el juego no arranca: falla three.js; las fuentes tienen alternativa.

### Hacerlo 100 % autónomo (opcional)

1. Descarga `three.module.js` y `examples/jsm/utils/BufferGeometryUtils.js` de three@0.160.0 en `vendor/three/`,
   respetando la ruta `vendor/three/examples/jsm/utils/`.
2. Cambia el importmap:
   ```json
   { "imports": {
       "three": "./vendor/three/three.module.js",
       "three/addons/": "./vendor/three/examples/jsm/" } }
   ```
3. Para las fuentes, descarga los `.woff2`, decláralos con `@font-face` en `css/style.css` y quita el `<link>` a Google Fonts.

## Compatibilidad

Hace falta WebGL2 (cualquier navegador de escritorio actual). No hay controles táctiles: está pensado para teclado y
ratón. La resolución interna arranca al 50 % (la tecla P la sube al 75 % y al 100 %). Si aun así va lento en un equipo
modesto, se puede bajar `POOL_SIZE` en `world.js` (menos luces) o el mapa de sombras de la linterna en `player.js`.
