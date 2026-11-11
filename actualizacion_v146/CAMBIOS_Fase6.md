# Fase 6 — pruebas «reales» (lo que pude medir y lo que falta en tu PC y teléfonos)

**La app no cambia (sigue la v14.5).** Cambia el kit del servidor: herramientas para que las pruebas reales las hagas tú en tu PC y teléfonos.

## Herramientas nuevas (kit del servidor)
- **`PRUEBA_DURA.bat`** (`herramientas\prueba_dura.js`): arranca su propio servidor de prueba (puerto 18099, carpeta `datos_prueba`, **no toca tus salas**), 3 salas mapa 960 × 10 jugadores simulados que se juntan, hacen ruido y golpean zombis, con una horda de ~120 zombis por sala y 15 cambios de construcción por segundo. Mide pasos/s por sala, CPU, memoria y caídos, da un veredicto y guarda `resultado_prueba_dura.txt`. Apaga el servidor y los navegadores al terminar (comprobado: sin procesos residuales).
- **Página `/prueba`** (`prueba.html`): el jugador la abre en su teléfono (`https://…/prueba`) y mide **latencia, bajada, subida y si el WebSocket conecta** por la ruta real hasta tu servidor; copia un resultado para enviarlo. Límites por IP; solo lee/escribe datos de prueba.
- **`GUION_PRUEBAS_REALES.md`:** pasos, criterios de «listo para lanzar» y mensaje para testers.
- Para pruebas (no se usan en el día a día): variable `URSRV_CPU=N` frena la CPU del anfitrión ×N (imita un PC más lento); `URSRV_PRUEBA=1` habilita `/admin/eval` y `/admin/apagar` solo desde el propio PC.

## Lo que medí (Chromium/Node en mi equipo de 4 núcleos; jugadores simulados)
**3 salas × 10 jugadores «duros»** (juntos en un punto, ~20 golpes/s por sala, ruido, horda de ~120–200 zombis, ~15 cambios de construcción/s) en el mapa 960:
| CPU del anfitrión | pasos/s por sala | caídos | bajada por jugador |
|---|---|---|---|
| normal | 29,8–29,9 | 0 | 19–20 KB/s (≈ 70 MB/h) |
| frenada ×2 | 28,3–28,8 | 0 | 20–21 KB/s |
| frenada ×3 | 24,7–24,9 | 0 | 20–22 KB/s |
- Con `fpsServidor: 20` y CPU ×3, las 3 salas dan ~22 pasos/s (cumple el objetivo reducido).
- Memoria real del servidor (PSS) con las 3 salas bajo esa carga: ≈ 1,3–1,5 GB (con ×3: 1,85 GB). Una sala por sí sola, ≈ 0,4–0,5 GB.
- 0 jugadores caídos en todas las pruebas.
- **Teléfono emulado** (Chromium con CPU ×4 más lenta, pantalla de móvil) en una sala 960 con 9 jugadores duros: entra en ≈ 7 s, **53–57 FPS** caminando, memoria JS 46–60 MB estable, RTT 4–76 ms (red local).
- **Exploración del mapa completo** (150 saltos a puntos aleatorios con CPU ×4): la caché de bloques queda limitada a 133; la memoria JS sube de ~55 a ~110–140 MB mientras se descubren sitios nuevos y se recupera en parte en reposo. No encontré una fuga que importe; sí un crecimiento (diarios, lugares descubiertos, objetos en el suelo, techos cacheados). Un teléfono de gama baja con poca RAM no está probado.

## Lo que NO pude probar (queda para ti y tus testers)
- **Tu portátil** (i3-N305, 8 GB, Windows 11, Edge): puede comportarse distinto a mi Linux. `PRUEBA_DURA.bat` lo mide en 5 minutos.
- **Teléfonos reales y redes móviles**, la ruta por Funnel y la subida de tu internet con gente real: `/prueba` y el guion.
- **Personas jugando** (comportamiento humano, construcciones grandes, el balance de zombis/emboscadas en callejones y muelles).
- **Instalación de la APK desde Play** y el comportamiento con pantallas apagadas/cambios de red en un teléfono real.
