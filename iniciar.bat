@echo off
rem Arranca un servidor local y abre el juego en el navegador.
cd /d "%~dp0"
start "" http://localhost:8000
python tools\servidor.py 8000 || npx --yes serve -l 8000 .
