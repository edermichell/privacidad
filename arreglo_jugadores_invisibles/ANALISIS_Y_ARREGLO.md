# Los jugadores no se veían en las salas (solo un «Anfitrión») — análisis y arreglo

## Qué pasaba
En una sala del servidor, cada jugador veía **un personaje quieto llamado «Anfitrión»** en el punto de entrada y **nunca a los demás jugadores**.

## Causa (comprobada)
Es un **fallo de la app (el cliente), no del servidor.** Al preparar la lista de cosas que se dibujan en cada cuadro, el juego guardaba a cada jugador remoto como «vacío» y, al pintarlo, usaba siempre los datos del anfitrión:

```
e.o = (slot === 'p' || slot === 'rp') ? null : value;     // se descartaba el jugador remoto
…
drawRemote(e.o || NET.rp);                                 // …y se pintaba siempre NET.rp = el anfitrión
```

Ese código es de cuando solo existía un compañero (cooperativo de 2). En las salas, el servidor mandaba bien las posiciones de todos (por eso el indicador decía «2 jugadores»), pero **por cada jugador cercano la app dibujaba al anfitrión del servidor** (un personaje invisible para el juego, aparcado en el punto de entrada, con el cuchillo inicial).

- Está en la **v14.0 publicada** y en **todas las versiones posteriores que te entregué (hasta la 15.4)**.
- **No lo detecté antes** porque mis pruebas de multijugador comprobaban los datos (posiciones y nombres que recibe cada cliente), no lo que realmente se pinta en pantalla. Es un fallo mío de verificación; desde ahora hay una prueba que mira lo que se dibuja.

## Qué se corrigió
1. **En la app** (el arreglo de verdad): cada jugador remoto se dibuja con sus propios datos. Además: el anfitrión del servidor ya no aparece en el mapa, y un coche que conduce cualquier otro jugador cuenta como ocupado (antes solo se miraba al anfitrión).
2. **En el servidor (paliativo para quien siga con la app antigua):** como esa app pinta siempre «al anfitrión», el servidor le manda como anfitrión **al jugador que tiene más cerca** (posición, movimiento y aspecto reales). Con la app antigua se ve **un jugador a la vez (el más cercano), con el rótulo «Anfitrión»**. No es una solución, es un alivio hasta que actualicen. Se puede apagar con `"parcheAppAntigua": false`.

## ¿Hay que actualizar la app en Play Store? **Sí.**
- Solo con corregir el servidor **no basta**: una app ya instalada no se puede arreglar desde el servidor. Con el servidor nuevo y la app antigua solo se consigue el paliativo (un jugador, mal rotulado).
- Con la app corregida funciona **aunque no toques el servidor** (probado con el servidor antiguo).
- Quien juegue **desde el navegador** (la página `/juego/` del servidor) queda arreglado en cuanto copies el kit nuevo, sin Play.

## Dos opciones de app (elige una)
| | **A · 14.0.1 (recomendada ahora)** | **B · 15.5** |
|---|---|---|
| Qué es | La 14.0 aprobada **más solo este arreglo** (8 líneas distintas en `index.html` y el número de versión; **Java idéntico**) | Todo lo nuevo (mapa 960, novedades, aviso de actualización, PvP, alianzas, misiones…) más este arreglo |
| versionCode / nombre | **138** / «14.0.1» | **152** / «15.5» |
| Riesgo | Mínimo: mismo proyecto que ya compilaste y te aprobaron | Mayor: trae cambios de Java sin probar en un teléfono (recuperación del WebView, actualización dentro de la app, que necesita descargar una librería al compilar) |
| Archivo | `arreglo_jugadores_invisibles/UltimoRefugio_AndroidStudio_v14.0.1.zip` | `lanzamiento_v155/UltimoRefugio_AndroidStudio_v15.5.zip` |

Recomiendo la **A** para que tus testers se vean cuanto antes, y subir la 15.5 después, con calma (el 152 es mayor que el 138, así que no hay conflicto).

## Pasos
1. **App:** abre el proyecto de la opción elegida en Android Studio, compila el `.aab` firmado y súbelo a la pista **alpha**. Texto de novedades: `arreglo_jugadores_invisibles/NOVEDADES_PLAY_v14.0.1.txt` (o el de la 15.5).
2. **Servidor (opcional pero recomendable):** cierra el servidor y copia del kit nuevo `servidor.js`, `srv_layer.js` y `juego\index.html` (**no pises `config.json`**). Así los que aún tengan la app antigua ven al menos al jugador más cercano, y los que entren por navegador quedan arreglados.
3. **Comprueba con 3 teléfonos** ya actualizados: cada uno debe ver a los otros dos, moviéndose, con «Jugador N» encima, y ningún «Anfitrión».

## Pruebas hechas (con 3 jugadores en la misma sala, mirando qué se dibuja de verdad)
| Caso | Resultado |
|---|---|
| **Antes:** servidor antiguo + 3 apps 14.0 | **Reproduce tu problema:** los tres dibujan solo «Anfitrión» en el punto de entrada |
| Servidor **antiguo** + 3 apps **14.0.1** | Cada uno ve a los otros dos en su sitio, con su nombre |
| Servidor nuevo + 3 apps 14.0.1 | Igual, correcto |
| Servidor antiguo + 3 apps 15.5 | Correcto |
| Servidor nuevo + 3 apps 15.5 | Correcto (captura `despues_3_jugadores_visibles.png`) |
| Servidor nuevo + 3 por navegador | Correcto |
| Servidor nuevo + 3 apps **14.0 antiguas** (paliativo) | Cada una ve al jugador más cercano en su sitio real y moviéndose (rotulado «Anfitrión») |
| Mezcla 14.0 / 14.0.1 / 15.5 | Cada una según su versión, sin errores |

Regresión: **14.0.1** — notas, guardado, partida antigua, COOP de 2 y de 4, 4 días simulados: sin fallos. **15.5** — cliente completo y servidor (vida, combate, tramposo, juego legítimo, moderación, candados, persistencia, movimiento, 3 salas 960, alianzas, misiones de grupo, prueba dura): ver el resumen final.

## Límites y avisos
- **Probado en Chromium con el código de la app, no en teléfonos reales.** El fallo y el arreglo son de JavaScript puro (no dependen de Android), pero confírmalo con el paso 3.
- El paliativo del servidor solo muestra **un** jugador a la vez y con el rótulo «Anfitrión»; no arregla la app antigua.
- La prueba automática de COOP de 4 jugadores (WebRTC local) falla de vez en cuando en mi entorno **también con la versión anterior**; repetida, pasa. No está relacionada con este cambio.
- Los rótulos de nombre salen bastante por encima de la cabeza (igual que los de los NPC); con varios jugadores juntos puede costar saber de quién es cada uno. No lo cambié en este arreglo.
- Las salas PvP exigen ahora la app 15.5 (versionCode 152).
