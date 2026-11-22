# Último Refugio v17.3 (versionCode 164) — Sangre con forma

Anuncios: Unity Ads reales (sin cambios). Mejora puramente gráfica y de rendimiento; no toca la jugabilidad ni la red.

## Qué medí primero
Con el procesador frenado ×4 revisé en qué se va el tiempo de cada fotograma (diagnóstico interno por etapas):
- La **horda** (lo más pesado, ~21 FPS) es sobre todo `drawImage` de muchos zombis. Ya está bien optimizado (cercano/lejano, sombras y contorno cacheados). Apretar más ahí arriesga el aspecto por muy poca ganancia, así que **no lo toqué**.
- Encontré un detalle real: **las manchas de sangre no se borraban ni se limitaban**, así que en partidas largas se acumulaban sin fin (memoria y dibujo que solo crecen).

## Qué cambia
### Gráficos
- **Sangre con forma:** las manchas pasan de dos rectángulos rojos planos a **salpicaduras pre-dibujadas** (4 variantes, con gotas sueltas y núcleo oscuro), elegidas de forma estable por posición para que no parpadeen. Se dibujan con **un solo `drawImage`** (igual o más barato que antes). Comparación: `sangre_antes_17.2.png` vs `sangre_despues_17.3.png`.
### Rendimiento / estabilidad
- **Tope de manchas:** se limita el número de manchas en pantalla; las más viejas se descartan. Antes crecían sin parar. En una partida de muchas horas, el juego se mantiene fino y usa menos memoria.

## Compatibilidad
- Solo cambia el dibujo. No afecta a la partida guardada (las manchas nunca se guardaron), ni a la red, ni a la simulación.
- Comprobado con la prueba de igualdad entre versiones: con el dibujo viejo forzado (`BLOOD.flat`), la imagen y los zombis son **idénticos** a la 17.2, lo que confirma que no cambió nada más.

## Pruebas
- `sangre_antes_17.2.png` / `sangre_despues_17.3.png`: comparación visual.
- Regresión completa (cliente, servidor, PvP, alianzas, misiones, voz, Zona Roja 17.0/17.1/17.2, guardado, prueba dura): ver `RESULTADO_PRUEBAS_v17.3.txt`.
