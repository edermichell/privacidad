# Último Refugio v14.8 — versión estable y optimizada (candidata a lanzamiento)

Reúne lo anterior (v14.6 pulido, v14.7 ritmo de misiones) más mejoras de estabilidad para teléfonos de gama baja. **No añade funciones de juego.**

## Qué cambia
1. **Android — recuperación si el sistema mata el WebView** (`MainActivity.java`): con poca memoria Android puede cerrar el proceso que dibuja el juego; sin manejarlo, la app se cerraba. Ahora se recrea la pantalla y el juego continúa desde su último guardado. Si falla dos veces en menos de 20 s, se cierra la app (evita un bucle). Sigue el patrón de la guía oficial de Android.
2. **Android — `onTrimMemory`:** cuando el sistema avisa de poca RAM, el juego suelta su caché de bloques de mapa (se redibujan solos).
3. **Equipos débiles** (≤ 2 GB de RAM, o ≤ 4 núcleos con ≤ 4 GB): el **primer arranque va a 30 FPS estables** (menos calor y batería; se cambia en Ajustes y, si el jugador ya eligió, se respeta), **caché de bloques de 40 MB en vez de 70** (≈ 76 bloques en vez de 133) y se **libera esa caché al pasar a segundo plano**. Un PC con Google Play Games (8 GB) o un teléfono de 4 GB con 8 núcleos **no** cuentan como débiles, y el navegador oculto del servidor tampoco (aunque el PC o VPS sea pequeño).
4. Incluye el **ritmo de misiones** de la v14.7 y el **pulido** de la v14.6.

## Qué probé
- **Java:** el código nuevo **compila contra stubs de Android** (comprobación de sintaxis y tipos); **no lo pude compilar con el SDK real ni probar en un teléfono** (no hay SDK en este entorno). Hay que compilarlo en Android Studio y probarlo (ver lista de verificación en la guía).
- **JavaScript (Chromium):** equipos de 2 GB / 4 GB+4 núcleos → 30 FPS; PC de 8 GB, equipo normal y 4 GB con 8 núcleos → 60 FPS; lo ya elegido por el jugador se respeta; caché con tope 76 (2 GB) y 133 (normal); `__urTrim` libera y se redibuja solo; pasar a segundo plano y volver sin errores; el anfitrión `?srv=1` no se trata como débil.
- **Regresión completa** (notas, escenas/guardado, partida de la 13.5, COOP 2 y 4 jugadores, 4 días simulados): 0 fallos. **Mono** (≈ 400 acciones en mundo chico y 960): 0 errores. **Ritmo de misiones:** 0 fallos. **Servidor** (moderación, candados, persistencia, movimiento, migración con 3 salas 960 y 4 activas): 0 fallos.
- Nota: una vez, en la regresión, la prueba COOP de 2 jugadores quedó en «conectando» y al repetirla 4 veces pasó siempre (parece un fallo puntual de la conexión de prueba, no del juego).

## Lo que medí y NO cambié (sin beneficio claro)
- **Minificar el juego** (quitar comentarios y espacios): −25 % de tamaño (1,9 → 1,4 MB de JavaScript) pero **sin mejora medible en el arranque** (3,7–4,5 s en ambos con la CPU 4× más lenta); no vale el riesgo.
- **Arranque:** lo que lo domina es dibujar los sprites por código (≈ 44 % en `boot`: `initHi` 24 %, mundo del menú 10 %). Acelerarlo exige rehacer el arranque; se deja para una versión posterior si los teléfonos reales lo piden.
- **Servidor:** ya reinicia solo si se cae (`INICIAR_SERVIDOR.bat` con bucle), cierra el navegador oculto cuando todas las salas duermen y recorta su registro a 30 días.

## Lo que no puedo confirmar desde aquí
- Que `onRenderProcessGone` funcione bien en un teléfono real (hay que provocarlo: ver la guía).
- FPS reales en teléfonos de gama baja (solo emulación).
- La compra, los anuncios y el consentimiento (UMP): no los toqué, pero tampoco los pude probar aquí.

`versionCode 145`, `versionName 14.8`.
