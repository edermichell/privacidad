# Último Refugio — Actualización v99 (app 9.3, versionCode 85): errores de diseño en celulares, arranque y partidas dañadas
Incluye todo lo de v86–v98. Imágenes: `comparacion_paneles_640x360.png` y `comparacion_pantalla_muerte.png`.

## Errores encontrados y corregidos
1. **Paneles rotos a 640×360 (celulares de 720×1280 y similares).** Estado, Mochila, Fabricar, Construir y Mapa quedaban con la columna central de **solo 128 px**: el contenido se montaba sobre el panel de detalle y, en el Mapa, el mapa tapaba los botones de marcas (Destino, Peligro, Agua…). **Causa:** dos reglas de CSS que se contradecían (una oculta la columna lateral a ≤640 px y otra, por el alto, volvía a pedir 3 columnas). **Corrección:** 2 columnas forzadas a ≤640 px. Medido: la columna central pasa de 120 a ≥ 230 px en los 5 paneles (también a 568×320).
2. **Pantalla de muerte con los botones principales fuera de la pantalla en TODOS los celulares (915×412, 780×360, 640×360…).** «Revivir», «Otra vez» y «Menú» quedaban **debajo** de los consejos y había que desplazarse sin ninguna pista. Ahora van justo debajo del resumen (Revivir a todo lo ancho; Otra vez y Compartir; Menú) y los consejos quedan al final. Prueba: antes fuera de pantalla en las 5 medidas; ahora visibles en las 5.
3. **«MODO FOTO» (v93) quedaba solo en una fila de la pausa:** ahora ocupa el ancho completo.
4. **Guardado dañado = mensaje falso.** Con el guardado ilegible, «Continuar» decía «No hay partida guardada» y el botón se quedaba para siempre. Ahora: (a) **copia de seguridad local rotativa** (cada ≥ 4 min se conserva la partida anterior) que se **restaura sola** si la principal no se puede leer; (b) si no hay copia, explica el problema, **aparta una copia del archivo dañado** y oculta «Continuar»; (c) si el guardado es válido pero falla al cargar (un error), **no se borra nada** y se avisa. La copia se borra al morir y al empezar otra partida, así que **no se puede «resucitar»** (muerte definitiva intacta).

## Mejora de arranque
En un teléfono medio (CPU 4× más lenta) la app mostraba **una pantalla negra ~3,9 s** y en uno lento (6×) **~5,8 s**, porque el script del juego (1,7 MB) tarda en ejecutarse. Ahora aparece una **pantalla de carga («ÚLTIMO REFUGIO · Cargando…») a los ~0,3 s** (primer contenido pintado: 3 916 → 284 ms y 5 752 → 356 ms). El menú sigue apareciendo cuando termina la carga (≈ 3,8 s en 4×), pero ya no parece que la app se colgó. Se quita sola al haber imagen (y a los 25 s por seguridad).

## Revisado y sin problemas
Compatibilidad de partidas **v85 → v99** (inventario, heridas, hora, cajas); guardado sin espacio, con `localStorage` bloqueado, incompleto o con JSON roto (el juego no se rompe); ~15 minutos más de pruebas de estrés (0 errores); análisis de diseño en 4 tamaños de pantalla × 20 pantallas; resolución Estándar/Alta/Ultra.

## Análisis de mejoras (no incluidas; por orden de valor)
1. **Arranque más rápido de verdad:** el 80 % es la preparación de gráficos al abrir (`initHi` ≈ 0,5 s a velocidad normal, ≈ 2 s en un teléfono medio). Se puede repartir en trozos tras mostrar el menú. Estimo 1–2 s menos; requiere pruebas porque el menú de fondo usa esos gráficos.
2. **Zonas táctiles pequeñas** en el menú: las fichas de «Mundo» miden 15–17 px de alto y «SONIDO» 20 px (recomendado ≥ 40). Agrandarlas en pantallas táctiles.
3. **Botones flotantes** «SONIDO»/«AJUSTES» tapan el borde inferior del menú hasta desplazarse (todo es alcanzable; es cosmético): añadir espacio inferior.
4. **Reducir el tamaño del juego (1,7 MB):** minificar el JavaScript acortaría la carga (no lo medí).
5. **Unity Ads 4.21.0** (el proyecto usa 4.16.1) cuando puedas compilar y probar en un teléfono.
6. **Sprite del personaje con extremidad perdida** (v96) y un indicador de «tu infección puede curarse amputando» en el HUD.
7. **PRIVACY_URL** sigue siendo el relleno (ver `VERIFICAR_ANUNCIOS.md`).

## Pruebas
Pruebas nuevas: diseño de paneles y pantalla de muerte (5 tamaños), copia de seguridad y avisos (7 casos), migración v85→v99; regresión: anuncios (14), vista previa (9), guardado/recarga, v96, v94, v93, v91, techos, v90, mapa, Modo Asedio, menú y el final de 180 s del helicóptero; 0 errores de JavaScript. (Una prueba antigua de sigilo de la v95 es intermitente por azar.)
