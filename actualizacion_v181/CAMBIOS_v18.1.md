# Último Refugio 18.1 — «Animaciones con peso» (versionCode 171)

Incluye todo lo de la 18.0 y la 17.9. **No cambia el código Java, el servidor, la política ni los permisos.**

## La regla: sin perder rendimiento
- **No se crea ningún dibujo nuevo:** todo se hace moviendo, girando o fundiendo el mismo sprite al dibujarlo. La caché de sprites (que ya va justa con multitudes) no crece.
- Los personajes que no se están animando en ese momento siguen una **vía rápida** que no hace nada extra.

## Qué cambia (ver `animaciones_antes_despues.png`: arriba 18.0, abajo 18.1)
1. **La caída ya no «salta» al final.**
   - Había un fallo desde hace muchas versiones: el cuerpo caía hacia un lado y el cadáver se dibujaba con la cabeza hacia el otro. Al terminar la caída, el cuerpo se daba la vuelta de golpe.
   - Ahora cae hacia el lado correcto y se desliza un poco para acabar justo donde está el cadáver. Medido: coinciden a 1–2 píxeles en ambas orientaciones y en zombis normales y brutos.
   - Vale para zombis y para personas.
2. **Impacto contra el suelo.** Al caer hay un pequeño arco hacia atrás (en el sentido del golpe), un rebote corto al tocar el suelo, polvo y un fundido breve hacia el cadáver.
3. **Levantarse.**
   - Antes, un zombi derribado aparecía de pie de golpe.
   - Ahora se incorpora girando durante 0,4 s: empieza despacio, como apoyándose, y termina rápido.
4. **Retroceso al recibir un golpe.**
   - Zombis y personas se desplazan ~3 px hacia atrás, alejándose de quien golpea, durante 0,16 s.
   - Al principio también se aplastaban, pero dibujar un sprite escalado resultó caro, así que lo quité (ver abajo).
5. **El jugador acompaña el golpe cuerpo a cuerpo:** se echa atrás al cargar, da medio paso al golpear y vuelve. La silueta de la 18.0 le sigue.

## Rendimiento (medido)
Peor caso a propósito: 60 zombis alrededor, ~60 golpes y ~15 muertes por segundo, calidad alta. Se alterna con las animaciones encendidas y apagadas en la misma partida (8 rondas de cada, mediana):

| | Sin animaciones nuevas | Con ellas |
|---|---|---|
| PC normal | 7,00 ms por cuadro | 7,02 ms |
| Procesador frenado 4× | 46,8 ms | 44,1 ms (dentro del ruido) |

**Cómo llegué ahí:**
- La primera versión costaba un **10 % más** en ese peor caso. Tenía dos causas:
  - Escalar los sprites (el aplastamiento).
  - Crear funciones nuevas en cada dibujo de cada personaje, aunque no se estuviera animando.
- Cambié el aplastamiento por desplazamientos en píxeles enteros y añadí una vía rápida que no crea nada cuando no hay animación activa.
- **Con eso el coste queda en +0,3 %.**

## Pruebas
`prueba_v181.js` comprueba:
- **Retroceso:** guarda la dirección del golpe, se desplaza hacia atrás y vuelve a su sitio.
- **Caída:** acaba alineada con el cadáver (≤ 6 px; se miden 1–2).
- **Aterrizaje:** un solo golpe contra el suelo por caída.
- **Levantarse:** se ve girando varios cuadros.
- **Golpe del jugador:** el cuerpo se mueve con el golpe.
- **Personas:** también reaccionan.
- **Interruptor `AN181.off`:** con él todo queda como antes. Lo usa la prueba de «imagen idéntica entre versiones».

Batería completa: `RESULTADO_PRUEBAS_v18.1.txt`.
