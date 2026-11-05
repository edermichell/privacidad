# Último Refugio — Actualización v91 (app 8.5, versionCode 77): rendimiento / caídas de FPS
Incluye v86–v90. **Solo cambia rendimiento; no cambia reglas ni el aspecto del juego** (salvo el repertorio de aspectos de zombi, ver nº 4).

## Cómo se midió
Chromium con un **celular emulado**: pantalla 915×412 @2,6 (como un teléfono de 2400×1080), **CPU 4 veces más lenta**, tiempo real. Se mide el tiempo de JavaScript por fotograma (update + render), los FPS y los fotogramas que pasan de 16,7 ms (60 FPS) y de 33 ms (30 FPS). 7 escenas: calle de día, caminando, noche con lluvia, horda de 60 y de 100 zombis, interior y mapa abierto (+ menú y guardado).

## Resultado (FPS con CPU ×4; mayor = mejor)
| Escena | v85 original | v90 | **v91** | Mejora vs v90 |
|---|---|---|---|---|
| Calle de día | 25,7 | 22,6 | **39,6** | **+75 %** |
| Caminando por la ciudad | 29,3 | 32,7 | **52,3** | **+60 %** |
| Noche con lluvia | 23,5 | 23,8 | **28,9** | +21 % |
| Horda de 60 zombis | 13,5 | 14,6 | **19,5** | +34 % (caídas >33 ms: 64 → 36) |
| Horda de 100 zombis | 13,6 | 14,1 | **19,5** | +38 % |
| Interior | 33,0 | 33,9 | **38,5** | +14 % |
| Mapa abierto | 31,4 | 32,9 (tirones de 31 ms p95) | **34,3** (12 ms p95) | tirones eliminados |
Tiempo de JS por fotograma en la calle de día: 28 ms → 12 ms.

## Las causas que se encontraron (de mayor a menor impacto)
1. **Techos construidos sin parar (error del juego original).** En `render` el techo de un edificio se pedía *antes* de comprobar si estaba en pantalla (esa comprobación usa coordenadas que solo existen tras construirlo). Así se construían techos de edificios **fuera de pantalla** (misma diagonal, lejos en horizontal); el escaneo los descartaba a >90 casillas y se reconstruían: un ciclo perpetuo de **~6 techos por segundo** (≈10–16 % de la CPU, además de memoria y GC por lienzos de varios MB). Ahora se predice el recuadro del techo con la misma geometría del constructor (verificado: 0 diferencias en 40 edificios) y **se construyen 0 techos en estado estable** (antes ≈76 cada 10 s). Los techos visibles siguen apareciendo a tiempo (0 pendientes en 8 paradas caminando).
2. **Sprites de zombis.** `humanKey` armaba un arreglo de 26 elementos + `join` por personaje y fotograma, la caché LRU se reordenaba en cada acierto, y los «ojos brillantes» de noche pedían el sprite una segunda vez solo para leer una altura constante. Ahora: concatenación directa (misma partición de claves en 8000 pruebas), reordenado cada 2 s y una sola llamada por zombi.
3. **Mapa abierto (regresión mía de la v89).** La base HD se redibujaba entera cada 0,5 s; ahora la parte estática va en caché (2.ª pasada: 7,5 ms → 2,2 ms).
4. **Saturación de la caché de sprites en hordas.** Se creaban ~80 sprites/s (169 aspectos distintos entre 182 zombis) y la caché de ~1275 se llenaba. Ahora los zombis comunes usan **28 aspectos fijos** (12 en calidad baja; los de piel especial 8) y a más de 7 casillas animan con 8 cuadros en vez de 16: ~400 → ~66 sprites cada 5 s. La multitud se ve igual de variada (comparado lado a lado). *Es el único cambio visible: menos combinaciones de ropa distintas.*
5. **Música:** `musTick` recorría todos los zombis/NPC y reprogramaba 8 parámetros de audio en cada fotograma → ahora ~15 veces por segundo.
6. **Logros:** ~230 condiciones evaluadas de golpe cada 0,45 s → 4 tandas (se desbloquean en ≤ 2 s).
7. **Zombis lejanos (>8 casillas):** sin sombra solar extra ni inclinación por mitades.
8. **Techos precargados:** radio según el tamaño real de la pantalla (antes 38 casillas fijas) y medido al borde del edificio.
9. **Pantallas de 90/120 Hz:** si nunca elegiste un tope de FPS, se limita a 60 (menos calor/consumo y ritmo más parejo). Si ya elegiste «Libre», 30 o 60, se respeta.
10. **Guardado automático:** ya no se ejecuta con un zombi persiguiéndote a <14 casillas ni conduciendo rápido (hasta 4 aplazamientos de 6 s, luego guarda igual: no se pierde progreso).
11. **Calidad automática:** baja antes (promedio >27 ms durante 4 s; antes 31 ms durante 5 s).

## Pruebas
Automáticas, 0 errores de JavaScript: equivalencia de `humanKey`, `oy`=48 en todos los sprites, 1 llamada por zombi, cobertura de techos (0 fallos de 18 visibles), logros, aplazamiento y forzado del guardado, música ≈1/4, detección 120/60 Hz y respeto a tu elección, caché del mapa; regresión completa de v90 (animaciones/accesibilidad/respaldo), mapa, NPC, Modo Asedio y menú.

## Límites (importante)
- **Es un emulador, no tu teléfono.** El navegador de pruebas no tiene GPU, así que parte del dibujado cuenta como CPU. Los valores absolutos de FPS cambiarán en un teléfono real; lo fiable es la **comparación relativa** y las causas halladas (el ciclo de techos, la caché de sprites y la música son costos de JavaScript que sí existen en el teléfono).
- Las hordas siguen siendo la escena más pesada (≈20 FPS en el emulador con CPU ×4).
- **Para verificar en tu teléfono:** Ajustes › Gráficos › «Mostrar FPS» y compara una horda nocturna con la versión anterior; si sigue yéndose por debajo de 30 FPS, dime el modelo y lo afinamos (siguiente candidato: reducir el límite de zombis dibujados a la vez).
