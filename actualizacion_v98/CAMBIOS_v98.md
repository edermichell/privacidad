# Último Refugio — Actualización v98 (app 9.2, versionCode 84): corrección de la vista previa con resolución Alta/Ultra
Incluye todo lo de v86–v97. `comparacion_resolucion.png` muestra el error y su corrección.

## El problema que reportó el tester: **NO estaba corregido** (existía en todas las versiones, incluida la v97)
En el menú principal, panel «TU SUPERVIVIENTE», el **personaje de la vista previa aparecía enorme, cortado y pegado a la esquina inferior derecha** del recuadro (o directamente no se veía) cuando la resolución interna estaba en **Alta** o **Ultra** (botón «Resolución» de Ajustes/pausa). Con la resolución **Estándar** se veía bien.
- **Causa:** el lienzo de la vista previa era fijo de 112×112 px, pero el sprite del personaje se dibuja a `56 × RS` px (112 en Estándar, **168 en Alta y 224 en Ultra**). En Estándar coincidía por casualidad; en Alta/Ultra el dibujo se pintaba a tamaño real y solo cabía una esquina.
- **Corrección:** el lienzo ahora sigue la resolución (112/168/224 px) y el personaje se dibuja centrado y entero. En Estándar el contenido del lienzo es **idéntico** al de antes; en Alta/Ultra además queda más nítido.
- **Reproducido y comprobado:** 9 combinaciones (pantallas 915×412, 800×360 y 1280×720 × resoluciones Estándar/Alta/Ultra), girando en las 4 direcciones: **v97 falla 6 de 9** (todas las Alta y Ultra); **v98 pasa las 9**.
- **Revisado el resto de la interfaz con Ultra:** Estado, Mochila, diálogo de NPC, vestuario de la tienda y el juego en sí se ven bien; el error estaba solo en la vista previa del menú.

## Otro error visto en la misma captura (corregido)
El menú mostraba **«LOGROS 10/95»** con un total **desactualizado**: el contador se calculaba al arrancar, antes de que se añadieran los logros de las versiones nuevas (hoy son 102; el menú decía 77). Ahora se recalcula al terminar de cargar y cada vez que vuelves al menú.

## Lo que no es un error
Los botones «SONIDO» (abajo a la izquierda) y «AJUSTES» (abajo al centro) son botones flotantes del menú y quedan sobre el borde de los paneles en pantallas bajas; es así por diseño y no tapan contenido necesario (el panel se desplaza). Si te molestara en un teléfono concreto, dime el modelo y lo muevo.

## Pruebas
Prueba nueva de la vista previa (9 combinaciones), contrato de anuncios (14), guardado y recarga, y regresión: v96, v94, v93, v91, techos, v90, mapa, Modo Asedio, menú y el final de 180 s del helicóptero. 0 errores de JavaScript.
