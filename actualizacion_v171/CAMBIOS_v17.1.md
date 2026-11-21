# Último Refugio v17.1 (versionCode 162) — pulido de la «Zona Roja»

Revisión de la 17.0 en rendimiento, errores, gráficos, animaciones y mecánicas. Primero medí y después cambié solo lo que tenía sentido.

## 1. Qué medí (procesador frenado ×4, como un teléfono modesto)
| Área | Resultado | Decisión |
|---|---|---|
| Errores | 0 errores de página y **0 errores silenciosos** en el anfitrión tras toda la prueba de la Zona Roja y en las partidas largas | El código está sano; no había nada que arreglar |
| Fluidez en calle, noche con lluvia, horda de 60 y día 9 | El juego usa todo el procesador frenado; la mayor parte es el navegador pintando la pantalla | La oscuridad ya se pinta a resolución reducida y el presupuesto de sprites ya se adapta solo a cada fotograma: no hay ganancia segura sin bajar la calidad |
| Sprites nuevos en una horda | ~48 por segundo, ~2 ms cada uno; la caché no expulsa nada (son sprites nuevos de verdad) | Se queda como está |
| Guardado automático (día 7, ~2.300 zombis) | ~25 ms y **247 KB**; los zombis son el 75 % del archivo | **Mejorado** (ver abajo) |

## 2. Qué cambia
### Rendimiento
- **Guardado un 34 % más pequeño** (247 KB → 162 KB en la misma partida): los colores y tipos de cada zombi se guardan con un diccionario en vez de repetirse en texto. Las partidas guardadas con versiones anteriores **se cargan idénticas** (mismos zombis, posición, vida, tipo, colores, sangre y ropa rota). El tiempo de guardado no cambia (~25 ms); lo que gana es espacio en el teléfono y margen para la copia de seguridad.
### Gráficos y animaciones
- **Nube de gas** en las Zonas Rojas, anclada al mundo y moviéndose despacio. Se ve **desde fuera** (sabes dónde empieza la cuarentena) y es más espesa dentro.
- **Grietas** en paredes, puertas y muebles construidos cuando bajan de 2/3 de su vida (más marcadas por debajo de 1/3).
- **Polvo y sacudida** cuando golpean algo construido cerca: el dueño ve y oye que le atacan la base.
- **Martillazos** y astillas al reparar.
### Mecánicas
- **El filtro de la máscara antigás se gasta** dentro de una Zona Roja: unos 3 minutos en el centro y más tiempo cerca del borde. Debajo del rótulo sale «FILTRO 97 %»; con menos del 25 % avisa, y al llegar a 0 la máscara se tira y el gas vuelve a quemar. Las cajas militares de las zonas traen más máscaras (probabilidad subida).
### Interfaz
- **Menú de pausa deslizable** en pantallas bajas (ya entregado como arreglo de la 17.0, incluido aquí).

## 3. Pruebas
- `prueba_guardado_v171.js`: guardado de la 17.0 cargado en la 17.1 (idéntico), guardar y cargar en la 17.1 (idéntico), tamaño 247 → 162 KB, tiempo de guardado igual en las dos.
- `prueba_zona_roja_v171.js` (servidor real): sin daño fuera, filtro que se gasta, aviso, máscara tirada al agotarse, el gas vuelve a quemar, polvo al golpear la base del dueño, 0 errores de página y 0 silenciosos.
- Comparación objetiva de la nube: con y sin nube cambia el 32 % de la pantalla dentro y el 6 % desde 3–4 casillas fuera (la neblina sobre el edificio).
- Regresión completa de la 17.0 con la 17.1: ver `RESULTADO_PRUEBAS_v17.1.txt`.
