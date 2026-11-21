# Último Refugio v17.2 (versionCode 163) — gráficos y rendimiento

Anuncios: **Unity Ads reales** (sin cambios: `UNITY_TEST_MODE=false` por defecto).

## 1. Qué medí (procesador frenado ×4, como un teléfono modesto; diagnóstico interno del juego por etapas)
| Escena | FPS | Simulación | Dibujo (JS) | Lo demás (el navegador pintando) |
|---|---|---|---|---|
| Calle de día | 41 | 8,1 ms | 5,0 ms | el resto del fotograma |
| Noche con lluvia | 31 | 3,2 ms | 4,7 ms | ídem |
| Horda de 60 | 21 | 7,2 ms | 13,0 ms | ídem |
| Día 9 | 32 | 8,6 ms | 10,1 ms | ídem |

- En la calle de día, lo más caro de la simulación eran **los civiles**: el 9 % de todo el tiempo. De ~185 civiles cercanos, **145 estaban a más de 24 casillas** (fuera de la pantalla) y se simulaban en cada fotograma igual que los que ves.
- En la horda, lo caro es crear los sprites nuevos de cada zombi (~2 ms cada uno). Probé hacer el sombreado y el contorno en una sola pasada: el resultado era **idéntico píxel a píxel**, pero **no más rápido** (dentro del ruido de medida), así que **no lo incluí**.

## 2. Qué cambia
### Rendimiento
- **Civiles por niveles de detalle:** los que están lejos (más de 24 casillas de cualquier jugador) y tranquilos (paseando o quietos, sin pelea, sin hablar contigo, sin seguirte) se simulan **1 de cada 3 fotogramas** con el tiempo acumulado. Los demás, a ritmo completo. Resultado en la calle de día: **civiles simulados por fotograma 145 → 56** y su coste **1,55 → 0,78 ms**. El servidor de tu PC usa el mismo código, así que también le ahorra trabajo.
### Gráficos
- **Perímetro de cuarentena** en cada Zona Roja: postes con **cinta amarilla y negra** y **carteles de peligro** alrededor de la zona (sobre calles y aceras; no dentro de edificios ni del agua).
- **La nube de gas forma parte del mundo:** ahora se dibuja ordenada por profundidad junto a personajes y objetos. De noche se oscurece como el resto, y los personajes quedan delante o detrás de la nube según dónde estén (antes se pintaba encima de todo y de noche «brillaba»).
- **La lluvia salpica el suelo:** pequeñas ondas y gotas que rebotan, con la misma densidad que la lluvia (menos en calidad baja).

## 3. Pruebas
- Capturas de día, de noche y con lluvia: `perimetro_cuarentena.png`, `zona_roja_dentro.png`, `zona_roja_noche.png`.
- `medir_civiles.js` y `medir_etapas_dibujo.js`: las medidas de arriba.
- Regresión completa (cliente, servidor, PvP, alianzas, misiones, voz, Zona Roja 17.0 y 17.1, guardado compatible, prueba dura): ver `RESULTADO_PRUEBAS_v17.2.txt`.
