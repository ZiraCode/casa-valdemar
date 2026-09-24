# Servidor local para desarrollo: sirve la carpeta del proyecto sin caché del navegador
# (así cada recarga usa los ficheros actuales) y con el tipo MIME correcto para los módulos.
# Uso: python tools/servidor.py [puerto]   (por defecto 8000)
import functools
import http.server
import os
import sys


class SinCache(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript',
        '.mjs': 'text/javascript',
        '.webp': 'image/webp',
    }

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, formato, *args):
        pass  # sin una línea por petición


if __name__ == '__main__':
    puerto = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    manejador = functools.partial(SinCache, directory=raiz)
    print(f'Casa Valdemar en http://localhost:{puerto}  (Ctrl+C para parar)')
    http.server.ThreadingHTTPServer(('', puerto), manejador).serve_forever()
