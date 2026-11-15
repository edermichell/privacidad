# Último Refugio 16.1 (versionCode 158): revisión de rendimiento

Todas las medidas se tomaron en Chromium con el procesador **frenado 4 veces** (parecido a un teléfono modesto), salvo donde se indica.

## 1. Qué medí y qué encontré

| Área | Medida | Conclusión |
|---|---|---|
| Fluidez en partida (noche, 40 zombis cerca) | La mitad de los fotogramas a 33 ms (30 FPS, el objetivo); el 5 % más lento a 50–66 ms | El código del juego **no** es el cuello de botella: la mayor parte del fotograma es el navegador pintando. Esto depende de la tarjeta gráfica del teléfono y aquí no se puede medir igual. |
| Caché de sprites de personajes | Falla el 3 % de las veces, siempre por sprites nuevos de verdad | Funciona bien. |
| Errores silenciosos (3 días haciendo de todo) | 0 errores capturados, 0 errores de página | El código está sano. |
| Memoria | 10–24 MB | Bien. |
| Guardado automático (cada 30 s, día 2) | ~25 ms | Tirón pequeño, aceptable. |
| Arranque hasta el menú | ~5 s (la pantalla «Cargando…» aparece a los 0,4 s) | Lo más lento: dibujar todos los muebles, muros, árboles y coches píxel a píxel al iniciar (2 s). Mejorarlo de verdad exige guardar esos dibujos entre arranques: es un cambio grande, que **no** está en esta versión. |
| **Partidas largas** | Los civiles se van convirtiendo en zombis: ~2.500 en el mapa hacia el día 7 | Tres partes del juego recorrían **todos** los zombis del mapa en cada paso. **Optimizado en esta versión.** |

## 2. Qué cambia en la 16.1
1. **Cuadrícula de zombis para los supervivientes:** antes se rehacía en cada paso con los 2.500 zombis, aunque ningún superviviente la consultara. Ahora se construye solo cuando un superviviente la necesita en ese paso, y solo con los zombis a menos de 100 casillas de algún jugador (los supervivientes más lejanos no se simulan).
2. **Hogueras:** antes cada zombi del mapa se comparaba con cada hoguera. Ahora se descartan primero, de un vistazo, los que están fuera del área de todas las hogueras.
3. **Hordas amontonadas:** cuando cientos de zombis acuden al mismo ruido, cada uno se comparaba con todos los demás de su zona (coste al cuadrado). Ahora cada zombi mira como mucho 40 vecinos, elegidos de forma repartida. En montones normales no cambia nada; en un montón extremo (300 zombis en una casilla) se separan un poco más despacio.

## 3. Resultado (misma partida, mismo azar, día 7, ~2.500 zombis)

| | Simulación por paso (PC) |
|---|---|
| 16.0 | 2,15 ms |
| 16.1 | **1,76 ms (−18 %)** |

En un teléfono modesto son unos **2 ms menos por fotograma** a partir del día 5–6. El servidor de tu PC usa este mismo código para simular las salas, así que también le ayuda.

Comprobado en `prueba_optimizaciones.js`: el fuego sigue quemando a los zombis que pisa, los supervivientes encuentran a los zombis cercanos y un montón de 300 zombis se separa.

## 4. Siguientes mejoras posibles (no incluidas)
- **Arranque más rápido** (de ~5 s a ~2 s en teléfonos modestos): guardar en el teléfono los dibujos generados la primera vez y reutilizarlos en cada arranque. Es el cambio con más efecto que queda, pero toca muchas partes del juego.
- **Guardado automático sin tirón:** preparar la partida en trozos entre fotogramas.
