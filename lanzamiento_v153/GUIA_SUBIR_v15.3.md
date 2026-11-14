# Guía para subir la v15.3 a Google Play (la 14.0 ya está aprobada al 100 % en la prueba cerrada «alpha»)

> **Estado actual:** la 14.0 ya fue aprobada y está en alpha. Puedes saltarte la fila de «rechazada / en revisión» de la tabla de abajo y seguir directamente con la sección 1.

Contenido de esta carpeta: `UltimoRefugio_AndroidStudio_v15.3.zip` (app, versionCode **150** / «15.3») · `UltimoRefugio_Servidor_Tailscale.zip` (kit del servidor) · `privacy.html` (política **actualizada**) · `NOVEDADES_PLAY_v15.3.txt` · `correo_testers_v153/` · `CAMBIOS_v14.0_a_v15.3.md`.

## 0. Qué hacer según el estado de la 14.0
| Estado de la 14.0 | Qué hacer |
|---|---|
| **Aprobada** (100 %) | Sigue con los pasos de abajo y sube la 15.3 como una versión nueva en la misma pista (alpha). |
| **Rechazada / con problemas** | Lee el motivo en *Recibidos* y *Política y programas*. La 15.2 ya incluye la política de privacidad corregida; corrige lo que pida Google y sube la 15.1 (no hace falta arreglar la 14.0). Mándame el texto del rechazo si quieres que lo revisemos. |
| **Sigue «En revisión» tras 3–4 días** | Opción: en la versión, *Quitar de la revisión* y enviar directamente la 15.3 (reinicia la espera). Decídelo tú; no lo hagas antes. |

## 1. Antes de subir (en este orden)
1. **Sube `privacy.html` a tu URL pública** (la misma que tienes en Play Console y en la variable `PRIVACY_URL`). La política anterior (v83) decía que *no hay servidores propios ni cuentas*; el multijugador ya no encaja con eso. Compruébalo abriendo la URL desde el teléfono: debe decir «noviembre de 2026 (v15.3)».
2. **Seguridad de los datos** (Play Console → Contenido de la app → Seguridad de los datos). Propuesta, **verifica cada casilla con el formulario actual** (cambia con frecuencia):
   - *ID de usuario* (identificador anónimo creado por la app para el multijugador): **recopilado**, finalidad «Funcionalidad de la app», **no compartido**, **opcional**, cifrado en tránsito: sí (HTTPS).
   - *Contenido generado por el usuario* (nombres de salas y motivos de reportes) y *actividad en la app / acciones dentro del juego* (el servidor guarda el mundo de cada sala): **recopilado**, «Funcionalidad de la app», no compartido.
   - Lo que ya tenías de Unity Ads (ID de publicidad/dispositivo, IP aproximada, interacción con anuncios; compras): se mantiene.
   - **Eliminación de datos:** indica que se pueden solicitar al correo de contacto (así lo dice la nueva política).
3. **Clasificación de contenido** (cuestionario IARC): vuelve a contestarlo honestamente: ahora **los usuarios pueden interactuar entre sí** (multijugador por salas, **sin chat de texto ni voz**) y hay violencia de fantasía contra zombis. Puede cambiar la clasificación.
4. **Contenido generado por usuarios (política de Play):** cumples lo que se pide: **reportar** (botón en la partida), **expulsar/banear** (dueño de la sala y panel del servidor) y moderación por el responsable. Si el formulario pregunta, dilo así.
5. **Compruebas el proyecto:** `app/build.gradle` tiene `versionCode 150` y `versionName "15.3"` (mayor que el 137 de la 14.0). Los secretos de compilación siguen igual: `UNITY_TEST_MODE=false`, `PRIVACY_URL` con tu dirección real, `UNITY_GAME_ID`, firma (`KEYSTORE_FILE`…). El mensaje de la compilación *release* avisa si queda algo de prueba.

## 2. Compilar y subir
1. Descomprime el zip, abre la carpeta `UltimoRefugio_Android` en Android Studio y compila el **AAB firmado** (ver `LEEME_PASOS.md`, sección «APK/AAB firmado») con la **misma llave** de siempre.
2. Play Console → Pruebas cerradas (alpha) → **Crear nueva versión** → sube el `.aab`.
3. «Novedades»: pega el texto de `NOVEDADES_PLAY_v15.3.txt` (≤ 500 caracteres).
4. Revisa los avisos de Play Console (permisos, dispositivos, API) y **Enviar a revisión**.
5. Mientras revisa, **no cambies más cosas** de la ficha; cada cambio puede reiniciar la espera.

## 3. Cuando la 15.3 esté disponible para los testers
1. Manda el correo de `correo_testers_v153/` (rellena enlace, dirección de `/prueba` y horario). Pídeles las pruebas del guion.
2. En tu PC copia el kit nuevo (`UltimoRefugio_Servidor_Tailscale.zip`) **sin pisar tu `config.json`** y sigue `MAPA_NUEVO_960.md`: cierra el servidor → `MIGRAR_A_MAPA_NUEVO.bat` → `INICIAR_SERVIDOR.bat` → prueba con tu teléfono.
3. Corre `PRUEBA_DURA.bat` (3 salas, con todo cerrado) y, si quieres más seguridad, una de 30 min: `node herramientas\prueba_dura.js --seg 1800`.
4. Si algo sale mal: `VOLVER_AL_MAPA_ANTERIOR.bat` restaura el config y los mundos anteriores.
5. **Avisa a quienes jueguen en las salas oficiales actuales** antes de migrar: esas partidas quedan en el respaldo y no continúan en el mapa nuevo.

## 4. Orden recomendado (resumen)
1. Esperar la revisión de la 14.0 → 2. subir `privacy.html` → 3. actualizar Seguridad de los datos y clasificación → 4. subir la 15.1 → 5. testers + pruebas de teléfonos → 6. migrar el servidor → 7. observar 2–3 días (memoria y pasos/s en `/admin`) → 8. (más adelante) producción.

## Pendiente que solo tú puedes confirmar
- El texto de la política afirma que el registro técnico se borra a los 30 días (el servidor lo hace solo desde esta versión) y que atiendes solicitudes de borrado por correo (hay que hacerlo a mano editando `duenos.json`, `reportes.json`, `bans.json` y la carpeta de la sala).
- La subida de tu internet, los teléfonos reales y la RAM con gente real (ver `GUION_PRUEBAS_REALES.md`).
- No soy abogado: si Play pide ajustar la redacción de la política o de Seguridad de los datos, hazlo siguiendo lo que pida el formulario.


---

## Lista de verificación ANTES de enviar la v15.3 (30–45 min)
1. **Compila en Android Studio.** Esta versión toca `MainActivity.java` (recuperación del WebView y `onTrimMemory`); no pude compilarla con el SDK real. Si Gradle marca un error en esas líneas, avísame con el texto.
2. **Provoca el cierre del WebView** en un teléfono con depuración USB: Ajustes del teléfono → Opciones de desarrollador → «Límite de procesos en segundo plano» o, con Android Studio abierto, `adb shell am send-trim-memory com.impulso.ultimorefugio RUNNING_CRITICAL`. El juego **no** debe cerrarse (puede reiniciarse y volver a su último guardado).
3. **Prueba en el teléfono más modesto que tengas:** Ajustes → «Diagnóstico avanzado» → ABRIR → COPIAR tras 5 min en el centro de la ciudad. El primer arranque debe ir a «30 FPS».
4. **Compras y anuncios** (no los tocamos, pero verifícalos en la compilación de prueba firmada): una compra de prueba, un anuncio recompensado, el consentimiento.
5. **Política de privacidad** subida a tu URL y «Seguridad de los datos» actualizada (sección 1 de esta guía).
6. **Servidor:** copia `juego\index.html` del kit nuevo para que las salas actuales tengan el ritmo de misiones; no hace falta migrar de mapa.
7. Sube a la pista **alpha** primero, comprueba el *Android vitals* (cierres y ANR) 24–48 h y recién entonces pasa a producción.


---

## Novedades y aviso de actualización (nuevo en la 14.9)
- **Botón NOVEDADES** en el menú principal (abajo, junto a SONIDO) y en **Ajustes → Datos → «Novedades y actualización»**: lista lo que cambió en cada versión y permite «BUSCAR ACTUALIZACIÓN».
- **Tras actualizar**, el panel se abre una sola vez. En una instalación nueva no molesta.
- **Aviso automático:** al abrir el menú, la app (Android) pregunta a Google Play si hay una versión más nueva (*actualización dentro de la app*, librería `com.google.android.play:app-update:2.1.0`, ya añadida a `build.gradle`). Si la hay, aparece un aviso abajo («Versión nueva disponible · ACTUALIZAR»), un punto rojo en NOVEDADES y el botón ACTUALIZAR AHORA en el panel. Al pulsar, Google Play hace la actualización (pantalla completa, «inmediata»); si Play no la permite, abre la ficha de la app. El jugador puede descartar el aviso (no vuelve hasta que salga otra versión).
- **Anuncio desde tu servidor (opcional):** en `config.json` puedes poner `"appUltima": { "codigo": 147, "version": "14.10", "notas": ["Lo nuevo 1", "Lo nuevo 2"] }` (codigo = versionCode de Play). La app lo recibe con la lista de salas y avisa (con esas notas) a quien tenga una versión menor. Sin ese bloque no se anuncia nada; el aviso de Google Play funciona igual. **Cada vez que subas una versión nueva, añade también sus cambios a la lista `UR_NEWS` del juego** (primeras líneas del bloque «v15.3 · NOVEDADES»), o pídeme que lo haga.
- **Cómo probar el aviso (hay que hacerlo con Google Play, no se puede en el emulador sin Play):** instala la 15.3 desde la pista (alpha/interna) en un teléfono; luego sube **otra compilación con un versionCode mayor** (p. ej. 151) a la misma pista; cuando Play la procese (puede tardar de minutos a horas), abre la app en el teléfono: debe salir el aviso. Con «Compartir app interna» también sirve. Qué mirar: (1) aviso y punto rojo; (2) ACTUALIZAR abre la pantalla de actualización de Play; (3) al terminar, la app arranca en la versión nueva y abre las novedades una vez.
- **Aún sin probar en un teléfono real:** el código Java de esta función compila contra una copia de la API de Play hecha por mí, pero **no se ha ejecutado con Google Play real**. Es la primera cosa a revisar con la 15.1 (Android Studio debe descargar la librería `app-update` al sincronizar Gradle; necesita internet).


---

## Autoridad del servidor (nuevo en la 15.0)
**Qué es:** el servidor comprueba los golpes y disparos que mandan los jugadores y guarda el personaje de cada uno (mochila, habilidades) en tu PC, así que ya no se puede inventar objetos desde el teléfono ni recuperar un personaje muerto. Es la base del futuro servidor PvP. Detalle completo en `actualizacion_v153/CAMBIOS_v15.3_autoridad.md`.

**En tu PC (servidor):**
1. Cierra el servidor. Copia del kit nuevo: `servidor.js`, `srv_layer.js`, `LEEME_SERVIDOR.md` y `juego\index.html`. **No pises tu `config.json`** (las opciones nuevas son opcionales y traen buenos valores por defecto).
2. Arranca. En el registro, al jugar, puedes ver líneas `[SALA1] daño rechazado…` si alguien manda golpes imposibles, y `murió: personaje borrado`. Los personajes quedan en `datos\salas\<SALA>\personajes\`.
3. Con las salas oficiales en modo `casual`, morir **no** borra el personaje (como ahora). Para una sala con muerte real, pon su `"modo": "full"` en `config.json` (en la propia sala) y cambia de mundo.
4. **Cuándo exigir la 15.0 (o posterior):** las apps anteriores siguen entrando, pero **sin esta protección**. Cuando tus testers ya tengan la 15.3, pon `"versionMinimaApp": 147` en `config.json` y quien tenga una versión antigua verá «actualiza la app».

**Prueba rápida con 2 testers (10 min):** (1) entrar a una sala, recoger algo y salir/volver a entrar: debe conservar la mochila; (2) en `datos\salas\SALA1\personajes\` aparece un archivo por jugador; (3) en una sala `full`, morir y volver a entrar: personaje nuevo.
**Política de privacidad:** ya incluye el nuevo punto «Tu personaje en la sala»; súbela a tu URL pública antes de enviar la app (igual que antes).


---

## Sala PvP y confirmaciones (nuevo en la 15.1)
- **Aviso importante:** esta versión solo trae los **cimientos** del PvP (sala marcada, aviso, vida controlada por el servidor). *(Esto era así en la 15.1; la 15.3 ya trae el combate: ver la sección siguiente.)*
- **Para probar una sala PvP con tus testers:** en `config.json`, dentro de `"salas"`, añade `{ "id": "SALA4", "nombre": "Frontera PvP", "pvp": true }` (y sube `salasActivasMax` si hace falta). Es de modo completo: **morir borra el personaje**; solo entra quien tenga la app 15.1 (`versionCode 150`).
- **Arreglo en Android:** los avisos de confirmación de «Borrar sala», «Mundo nuevo», «Reiniciar» y «Banear» no se mostraban en el teléfono (la acción se cancelaba sola). Ahora aparecen. Pruébalo: en tu sala (Multijugador → tu sala → administrar) pulsa REINICIAR y comprueba que sale el aviso.
- **En tu PC:** copia `servidor.js`, `srv_layer.js`, `LEEME_SERVIDOR.md` y `juego\index.html` del kit (sin pisar `config.json`).
- **Política de privacidad:** subir la nueva (una frase sobre la vida en salas PvP).


---

## Combate PvP (nuevo en la 15.2)
- **Ya hay daño entre jugadores en las salas `"pvp": true`.** Reglas: protección de 20 s al aparecer, zonas seguras a 10 casillas de comerciantes, el servidor decide aciertos y daño (cuchillo ≈ 14, hacha ≈ 37, pistola ≈ 41, rifle ≈ 74), al morir el cuerpo deja todo en el suelo y el personaje se borra, cortar la conexión en pleno combate (20 s) = morir, aparición aleatoria en la costa. Detalle en `actualizacion_v153/CAMBIOS_v15.3_combate_pvp.md`.
- **Recomendación:** abre la sala PvP **solo a tus testers** primero. Todo está probado con clientes de prueba, no con teléfonos reales: hay que ver cómo se siente con red real (precisión de los disparos, el castigo por cortar en combate).
- **Guion de prueba PvP (20 min, 4 testers):** (1) entrar a la sala PvP (aceptar el aviso); (2) comprobar que aparecen en sitios distintos y que sale «Protección de aparición»; (3) esperar 20 s, buscarse y pelear con cuchillo/hacha y con armas de fuego; (4) al morir: ¿el cuerpo deja las cosas?, ¿el que mató puede recogerlas?; (5) acercarse a un comerciante y comprobar que ahí no se puede atacar; (6) probar a cerrar la app en medio de una pelea (debe contar como muerte); (7) pasarme sus impresiones sobre la puntería y el daño (muy poco / mucho).
- **Servidor:** copia `servidor.js`, `srv_layer.js`, `LEEME_SERVIDOR.md` y `juego\index.html` (sin pisar `config.json`). Las salas PvP exigen la app **15.2** (`versionCode 150`).
- **Google Play:** antes de publicar revisa la clasificación por edades (cuestionario IARC: ahora hay **violencia entre usuarios** en las salas PvP) y «Seguridad de los datos» (el servidor guarda tu personaje y registra heridas y bajas). Los controles de reportar, expulsar y banear ya existen.
- **Política de privacidad:** subir la nueva.


---

## Alianzas y traición (nuevo en la 15.3)
- **Solo en salas `"pvp": true`.** Se forman acercándose (≤ 8 casillas) y proponiendo desde el indicador de la sala (tócalo), la tecla **Y** o **E** junto al jugador. Hasta 4 (`alianzaMax`). Los aliados se ven en verde y en el mapa, se mandan 4 señales y abren los candados del otro.
- **Traición:** el fuego amistoso está activo. Quien hiere a un aliado (o a un exaliado que salió hace < 10 min) es **TRAIDOR 24 h** (`traidorHoras`): nombre rojo para todos, sale de la alianza, no puede aliarse, se avisa a su alianza. Defensa propia (5 min) o atacar a un traidor: sin castigo. El cliente no hiere a un aliado cuando hay un zombi de por medio.
- **Sin radar:** en PvP cada cliente solo conoce a los jugadores a ≤ 55 casillas y a sus aliados.
- **Guion de prueba (20 min, 4 testers, sala PvP):** (1) formar una alianza de 3 y comprobar nombres verdes y el mapa; (2) mandar las 4 señales; (3) poner un candado y que un aliado lo abra con «ABRIR COMO ALIADO»; (4) pelear contra zombis junto a un aliado: no debe herirlo; (5) **traición real:** un tester hiere a un aliado a propósito → debe quedar TRAIDOR (rojo para todos) y la alianza debe avisarse; (6) el traidor intenta aliarse (debe fallar); (7) salir de la alianza y atacar enseguida → traición; (8) reiniciar el servidor y comprobar que la alianza sigue.
- **Servidor:** copia `servidor.js`, `srv_layer.js`, `LEEME_SERVIDOR.md` y `juego\index.html` (sin pisar `config.json`). Opcionales en `config.json`: `"alianzaMax": 4`, `"traidorHoras": 24`. Las salas PvP exigen la app **15.3** (`versionCode 150`).
- **Límites importantes:** quien desinstale la app obtiene una identidad nueva y se libra del estado de traidor (no hay cuentas). Aún no hay almacén compartido de alianza, reacción de comerciantes ante traidores (fase 5) ni misiones de grupo (fase 4).
- **Política de privacidad:** subir la nueva (las alianzas y el estado de traidor se guardan en el servidor).
