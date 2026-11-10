# Último Refugio v13.6 — notas de supervivientes (sobre la 13.5)

## Qué cambia
- Parte de los campamentos, tumbas y picnics de la 13.5 dejan una **nota de superviviente** (12 textos breves, según el tipo de sitio): unos 58 de 131 sitios en el mapa de prueba (33 campamentos, 13 picnics, 12 tumbas).
- **Leer la nota** (botón «Leer» en la mochila) cuenta la historia y, la primera vez, **marca en el mapa otro sitio sin visitar** (marca «Botín»), a la distancia indicada. Así un sitio te lleva al siguiente.
- Para ver la marca hace falta tener **un mapa** en la mochila (el juego ya lo exigía); la nota lo avisa si no lo tienes.
- La nota aparece siempre al acercarte al sitio (no depende del azar del botín). Las marcas ya se guardaban con la partida; no cambia el formato de guardado.
- Sin coste por fotograma.

## Pruebas (Chromium; no teléfonos reales)
- Prueba nueva: notas presentes, aparecen en el suelo, «Leer» abre la nota, marca un sitio una sola vez, se guarda la marca; sin errores.
- Partida de la 13.5 cargada en la 13.6: imagen idéntica y zombis idénticos, 0 errores.
- Cooperativo de 4: 0 fallos. Cooperativo de 2: bien (una primera ejecución falló por arranque en frío; dos repeticiones bien). Simulación de 4 días: sin errores.
- Prueba de escenas/guardado: una comprobación («no repite el botín») marca fallo porque la prueba teletransporta al jugador y activa escenas vecinas nuevas; no es botín repetido (comprobado en la 13.5).

## Límites
- Solo hay notas en mundos con escenas (igual que los sitios de la 13.5).
- **Cooperativo:** todos los jugadores deben tener la misma versión (13.6): las notas son objetos nuevos y un invitado con la 13.5 no los conoce.
- La marca en el mapa la verifiqué por datos y la nota por captura; no tengo captura nítida del marcador sobre el mapa.
- APK sin compilar (no hay Android SDK); sin pruebas en teléfonos reales. `versionCode 133`, `versionName 13.6`.
