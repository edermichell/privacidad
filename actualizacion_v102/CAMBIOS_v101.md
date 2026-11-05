# Último Refugio — Actualización v101 (app 9.5, versionCode 87): mundo más rápido de generar y personaje que se ve con lo que le falta
Incluye todo lo de v86–v100. Imágenes: `personaje_con_perdidas.png` y `anatomia_con_personaje.png`.

## Optimización (medida, sin cambiar un solo píxel ni una sola casilla)
Revisé con el perfilador de Chrome dónde se va el tiempo al **abrir la app** y al **crear una partida** (lo que más espera el jugador). Encontré tres desperdicios y los corregí manteniendo el resultado **idéntico**:
1. **Generación del mundo ≈ −30 %.** `nearAnyDoor` recorría **todas las puertas** del mapa por cada casilla candidata (≈ 1/3 del tiempo de crear el mundo). Ahora usa un índice por cubos de 8×8; además las calles se consultan en una tabla en vez de repetir `ROADS.some` por casilla. Tiempo de `newGame()`: mundo enorme **338 → 240 ms** (CPU normal) y **853–933 → 627–674 ms** (teléfono 4× más lento); mundo chico 70 → 49 ms (258 → 172–180 ms en 4×). Ahorra del orden de **0,2–0,3 s por partida en un teléfono medio y más en uno lento**.
   - **Comprobado casilla por casilla:** 6 mundos distintos (clásico/ciudad/región/pueblo/rural; chico a enorme; semillas fijas) dan **exactamente** los mismos terrenos, objetos, techos, puertas, edificios, farolas y marcas — por tanto **las partidas guardadas de versiones anteriores cargan el mismo mundo**.
2. **Grafitis al arrancar 14× más rápidos.** Cada uno de los 13 grafitis leía la textura **un píxel a la vez** (936 lecturas × 13 = 12 168 al abrir la app). Ahora se lee la textura una sola vez: **35 → 2,5 ms** en CPU normal (en teléfonos con lecturas lentas de GPU, mucho más). Texturas verificadas idénticas (hash de los 13).
3. Nada más que valiera la pena: probé también «la IA lejana a ¼ de ritmo» (la descarté: no baja el tiempo, el coste está en las llamadas, no en la IA), y el resto del arranque (≈ 0,7 s en CPU normal) es sobre todo preparar los gráficos en alta resolución, que no se puede evitar sin rediseñarlo. Con v99 ya aparece la pantalla de carga a los 0,3 s.
- **Memoria revisada:** el caché de suelo está limitado por LRU (≈ 133 bloques en Estándar, 48 en Ultra); no crece sin límite en sesiones largas.

## Gráficos: el personaje se ve con lo que le falta (completa la v96)
- **Brazo perdido:** el brazo libre se acorta y queda un **muñón vendado**; con dos brazos perdidos, los dos.
- **Pierna o pie perdidos:** una **pierna acortada con venda**; con **prótesis de madera** en la mochila, una pata de palo marrón; con **muleta**, una muleta bajo el brazo.
- **Ojo perdido:** **parche negro** sobre el ojo que falta (de frente).
- Se ve en el juego, en el retrato de Estado y en la mochila.
- **Sin pérdidas nada cambia:** se compararon **48 sprites del jugador** (4 poses × 4 direcciones × 3 armas) y **24 de zombis** y son **idénticos píxel a píxel** a la v100, y las claves de caché no cambian (no se rehacen ni se duplican sprites).
- Las 13 combinaciones de partes × poses × direcciones × armas (624 sprites) se dibujan sin errores.

## Pruebas
Nuevas: mundos idénticos (6), texturas idénticas (13), sprites idénticos y máscaras de partes (7 comprobaciones), migración v85→v101 y v100→v101. Regresión completa: anuncios (v100 y v97), diseño en pantallas pequeñas, copia de seguridad, guardado/recarga, guardado dañado o sin espacio, vista previa a 3 resoluciones, v96, v94, v93, v91, techos, v90, mapa, Modo Asedio, menú, el final de 180 s del helicóptero y **3 minutos de pruebas de estrés** (0 errores). (Intermitentes por azar, no por esta versión: el sigilo de v95 y 3 comprobaciones de NPC.)

## Límites
Las mediciones son de un emulador (Chrome sin GPU, CPU ralentizada): la mejora **relativa** es fiable; los milisegundos absolutos en tu teléfono serán distintos. La generación del mundo es solo una parte de «Nueva partida» (también cuentan el audio, el guardado y la introducción).
