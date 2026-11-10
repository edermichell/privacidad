# Último Refugio v13.5 — paisaje más rico y mapa menos vacío

## Qué cambia
1. **Gráficos (sin coste por fotograma):** todo se dibuja una sola vez al crear cada trozo de mapa (chunk) y se guarda en caché, igual que el suelo de antes.
   - Tinte suave y variación de color por tipo de suelo y estación (verano/otoño/invierno/primavera).
   - Detalles de suelo por estación: hojas, flores, nieve, charcos, hierba alta, piedras.
   - Senderos de tierra que cruzan zonas naturales.
   - Objetos de patio junto a las casas (cajas, barriles, leña, cubos, etc.).
2. **Mapa menos vacío – puntos de interés (POI):** campamentos y pequeños sitios con botín repartidos por el mapa grande, en zonas libres y lejos de agua/carreteras. En un mapa de 360×360 salen unos **112–156** sitios. Se marcan como visitados y se guardan con la partida.

## Medido (Chromium emulando CPU 4× más lenta; NO en teléfonos reales)
- Por fotograma: **0 ms extra** (todo está en caché).
- Construir un chunk: ~4,9 ms → ~5,9 ms (+~1 ms a 4×, ≈ +0,25 ms real). Solo ocurre al descubrir terreno nuevo.
- Arte base: ~10 ms una sola vez.
- Caminar con el banco de pruebas: 48–51 fps antes y después (dentro del ruido).

## Pruebas (versión final)
- Cooperativo 2 jugadores: OK. Cooperativo 4 jugadores: 0 fallos.
- Simulación de 4 días: sin errores.
- Partida guardada de la 13.4 cargada en 13.5: zombis idénticos, 0 errores (la imagen cambia a propósito: el tinte y los detalles se aplican también a partidas viejas; es solo visual).
- Escenas/guardado: pasan todas salvo una comprobación que mide el botín al volver a visitar; el aumento se debe a que se activan escenas vecinas nuevas, no a botín repetido (verificado a mano).

## Honestidad / límites
- La mejora visual es **real pero moderada** (ver `antes_despues_paisaje_v135.png` y `puntos_de_interes_v135.png`).
- Los POI solo aparecen en mundos con escenas (`WG.sc`: mundos nuevos y partidas 13.3/13.4 con escenas).
- No se ha compilado el APK (Java/Gradle no ejecutados aquí), ni probado en teléfonos reales ni el cooperativo en Wi-Fi real.
- `versionCode 132`, `versionName 13.5`.
