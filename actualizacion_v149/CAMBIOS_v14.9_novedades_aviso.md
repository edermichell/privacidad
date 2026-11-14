# Último Refugio v14.9 — Novedades y aviso de actualización

`versionCode 146` · `versionName 14.9`. Se pidió: un botón que diga los cambios de la versión, un aviso automático cuando haya actualización y seguir buscando mejoras.

## 1. Botón NOVEDADES
- Abajo en el menú principal (junto a SONIDO) y en **Ajustes → Datos → «Novedades y actualización»**.
- Panel con la lista de cambios por versión (14.9, 14.8, 14.1–14.7, 14.0), el estado («Tienes la última versión» / «¡Hay una versión nueva!») y los botones **BUSCAR ACTUALIZACIÓN** / **ACTUALIZAR AHORA**. Se cierra con LISTO, tocando fuera o Esc (encima de Ajustes: Esc cierra solo el panel).
- **Tras actualizar** se abre una sola vez. Una instalación nueva no lo abre (solo anota la versión). Si el jugador ya tenía partida/ajustes guardados de antes de existir esta función (viene de la 14.0), sí se abre.
- **Mantenimiento:** la lista es `UR_NEWS` (en `index.html`, bloque «v14.9 · NOVEDADES»). Cada versión nueva debe añadir su entrada al principio.

## 2. Aviso automático de actualización
| Fuente | Cómo funciona | Dónde |
|---|---|---|
| **Google Play (principal)** | Al abrir el menú (y al volver tras > 6 h) la app (Android) llama a `AppUpdateManager.getAppUpdateInfo()`. Si Play dice «actualización disponible», avisa. Pulsar ACTUALIZAR inicia la actualización **inmediata** de Play; si no está permitida, abre la ficha en Google Play. Si una actualización inmediata queda a medias, se retoma en `onResume`. | `MainActivity.java` (`checkUpdate`, `startUpdate`), librería `com.google.android.play:app-update:2.1.0` |
| **Tu servidor (opcional)** | `/salas` devuelve `app: { codigo, version, notas }` si en `config.json` hay `"appUltima"`. La app (solo Android) compara `codigo` con su versionCode (146) y avisa, mostrando las `notas`. | `servidor.js`, `LEEME_SERVIDOR.md` |

- El aviso es una tira pequeña abajo en el menú («Versión nueva disponible · ACTUALIZAR · ×»), un punto rojo en NOVEDADES y el botón en el panel. Con × se descarta para esa versión (el punto y el panel siguen).
- **No interrumpe la partida:** nada aparece mientras se juega.
- **Privacidad:** no añade peticiones a tu servidor (el anuncio viaja con la lista de salas que ya se pide); la consulta a Play la hace Google Play. En el navegador/PC no hay aviso (la web se recarga sola). El anfitrión del servidor (`?srv=1`) nunca consulta ni abre nada.
- Las notas del servidor se muestran como **texto** (sin HTML) y con límites (8 líneas × 180 caracteres).

## 3. Mejora de estabilidad adicional
- **Tope de 3000 objetos en el suelo** por mundo. Antes no había tope: un mundo 24/7 acumulaba objetos sin fin (partida guardada más grande, más trabajo por cuadro y por sincronización). Al guardar (anfitrión / un jugador) se descartan los **más antiguos** por encima de 3000; las **notas de supervivientes nunca**. No afecta a guardados ni a invitados.
- Revisado y **sin cambio**: la población de zombis que crece con los días (≈14 000 hacia el día 10 en el mapa 960) es el avance diseñado de la infección (los civiles se contagian por grupos), no una fuga; se controla con `zombis` en `config.json` o «NUEVO MUNDO».

## 4. Pruebas (todas sin fallos)
- **Novedades/aviso** (`upd149.js`, 40 comprobaciones): instalación nueva vs. actualizada, abrir/cerrar, encima de Ajustes, puente Android simulado (hay actualización / al día / error), descartar y reiniciar, versión aún más nueva, anuncio del servidor con basura y con HTML (no se inyecta), navegador sin aviso, anfitrión `?srv=1`, en partida no aparece nada, pantalla pequeña 640×300.
- **De extremo a extremo:** servidor real con `appUltima` → la lista de salas del juego produce el aviso; `/salas` sin el bloque devuelve `app: null`.
- **Suelo** (`floor149.js`): hasta 3000 no toca nada; sobre el tope recorta a 3000 conservando lo nuevo y las notas; la partida guardada trae 3000.
- **Regresión completa:** notas, escenas/guardado, partida de la 13.5, COOP 2 y 4 jugadores, 4 días simulados, mono ~400 acciones (mundo chico y 960), ritmo de misiones, gama baja; **servidor:** moderación, candados, persistencia, movimiento entre jugadores, 3 salas oficiales 960 migradas + sala de jugador.

## 5. Lo que NO pude comprobar
- **Google Play real:** el Java nuevo compila contra una copia mínima de la API de Play escrita por mí (no el SDK real) y la lógica de JavaScript se probó con un puente simulado. **Nunca se ejecutó con Google Play de verdad.** Es lo primero que hay que probar en un teléfono (la guía explica cómo: subir una compilación con versionCode mayor a la misma pista).
- Que la librería `app-update:2.1.0` resuelva sin problemas en tu Android Studio (necesita internet al sincronizar Gradle).
- El aviso de Play solo existe si la app se instaló desde Google Play (no con APK suelto).
