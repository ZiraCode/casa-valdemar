# Limitaciones conocidas e ideas

## Limitaciones actuales

- **Rendimiento real sin medir.** La CPU gasta unos 1,5 ms por fotograma. El coste de GPU (sombras de la linterna + 6 luces
  puntuales + postproceso) no se ha medido en equipos modestos. Sería útil un contador de FPS con `?debug`.
- **Mezcla de audio sin escuchar.** Los volúmenes se ajustaron a ojo, sin oírlos. Revisa el equilibrio entre dron, susurros,
  latido y sustos.
- Las luces puntuales **no proyectan sombra**. Una vela puede iluminar un poco la cara opuesta de un muro si está a menos de ~3 m
  de su alcance.
- Las apariciones atraviesan las puertas cerradas a propósito. En las esquinas pueden rozar los muros al girar (van de centro a
  centro de casilla, así que casi nunca ocurre).
- La hoja de una puerta abierta no tiene colisión.
- No hay guardado, menú de opciones, sensibilidad configurable, inversión del eje Y ni soporte de mando o táctil.
- No hay ciclo de derrota/victoria sin recargar: "Volver a entrar" hace `location.reload()`.
- Solo existe el modo `?debug` para depurar. No hay trucos ni selector de planta en el juego.

## Ideas de mejora (por orden aproximado de impacto)

1. **Menú de opciones:** sensibilidad, volumen, resolución, eje Y invertido y brillo (ajustaría `uExposure`), guardado en `localStorage`.
2. **Pilas de la linterna:** agotarlas al quemar y recargarlas recogiendo pilas en el mapa (un carácter nuevo). Añade tensión y exploración.
3. **Llaves y puertas cerradas:** algunas `D` bloqueadas hasta encontrar una llave, para guiar el recorrido por las plantas.
4. **Narrativa ambiental:** notas o diarios legibles (carácter nuevo, interacción con Espacio) que cuenten la historia de los Valdemar.
5. **Variedad de apariciones:** una que solo se mueve con la linterna apagada, otra que imita pasos, un niño que corre cuando
   no lo miras.
6. **Final con la puerta principal:** al desterrar a las 8, abrir la `E` para salir andando, en lugar de la pantalla final.
7. **Sustos preparados:** disparadores por casilla (una figura que cruza el fondo de un pasillo, un retrato que cambia).
8. **Contador de FPS y calidad automática:** bajar la resolución o la sombra si los FPS caen.
9. **Mapa o brújula** opcional para jugadores que se pierden (valorar si resta terror).
10. **Sombras de las velas** solo para la luz más cercana (una `PointLight` con sombra es 6 renders: cuidado).
