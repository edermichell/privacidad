# Guía para subir la v14.6 a Google Play (cuando termine la revisión de la 14.0)

Contenido de esta carpeta: `UltimoRefugio_AndroidStudio_v14.6.zip` (app, versionCode **143** / «14.6») · `UltimoRefugio_Servidor_Tailscale.zip` (kit del servidor) · `privacy.html` (política **actualizada**) · `NOVEDADES_PLAY_v14.6.txt` · `correo_testers_v146/` · `CAMBIOS_v14.0_a_v14.6.md`.

## 0. Qué hacer según el estado de la 14.0
| Estado de la 14.0 | Qué hacer |
|---|---|
| **Aprobada** (100 %) | Sigue con los pasos de abajo y sube la 14.6 como una versión nueva en la misma pista (alpha). |
| **Rechazada / con problemas** | Lee el motivo en *Recibidos* y *Política y programas*. La 14.6 ya incluye la política de privacidad corregida; corrige lo que pida Google y sube la 14.6 (no hace falta arreglar la 14.0). Mándame el texto del rechazo si quieres que lo revisemos. |
| **Sigue «En revisión» tras 3–4 días** | Opción: en la versión, *Quitar de la revisión* y enviar directamente la 14.6 (reinicia la espera). Decídelo tú; no lo hagas antes. |

## 1. Antes de subir (en este orden)
1. **Sube `privacy.html` a tu URL pública** (la misma que tienes en Play Console y en la variable `PRIVACY_URL`). La política anterior (v83) decía que *no hay servidores propios ni cuentas*; el multijugador ya no encaja con eso. Compruébalo abriendo la URL desde el teléfono: debe decir «noviembre de 2026 (v14.6)».
2. **Seguridad de los datos** (Play Console → Contenido de la app → Seguridad de los datos). Propuesta, **verifica cada casilla con el formulario actual** (cambia con frecuencia):
   - *ID de usuario* (identificador anónimo creado por la app para el multijugador): **recopilado**, finalidad «Funcionalidad de la app», **no compartido**, **opcional**, cifrado en tránsito: sí (HTTPS).
   - *Contenido generado por el usuario* (nombres de salas y motivos de reportes) y *actividad en la app / acciones dentro del juego* (el servidor guarda el mundo de cada sala): **recopilado**, «Funcionalidad de la app», no compartido.
   - Lo que ya tenías de Unity Ads (ID de publicidad/dispositivo, IP aproximada, interacción con anuncios; compras): se mantiene.
   - **Eliminación de datos:** indica que se pueden solicitar al correo de contacto (así lo dice la nueva política).
3. **Clasificación de contenido** (cuestionario IARC): vuelve a contestarlo honestamente: ahora **los usuarios pueden interactuar entre sí** (multijugador por salas, **sin chat de texto ni voz**) y hay violencia de fantasía contra zombis. Puede cambiar la clasificación.
4. **Contenido generado por usuarios (política de Play):** cumples lo que se pide: **reportar** (botón en la partida), **expulsar/banear** (dueño de la sala y panel del servidor) y moderación por el responsable. Si el formulario pregunta, dilo así.
5. **Compruebas el proyecto:** `app/build.gradle` tiene `versionCode 143` y `versionName "14.6"` (mayor que el 137 de la 14.0). Los secretos de compilación siguen igual: `UNITY_TEST_MODE=false`, `PRIVACY_URL` con tu dirección real, `UNITY_GAME_ID`, firma (`KEYSTORE_FILE`…). El mensaje de la compilación *release* avisa si queda algo de prueba.

## 2. Compilar y subir
1. Descomprime el zip, abre la carpeta `UltimoRefugio_Android` en Android Studio y compila el **AAB firmado** (ver `LEEME_PASOS.md`, sección «APK/AAB firmado») con la **misma llave** de siempre.
2. Play Console → Pruebas cerradas (alpha) → **Crear nueva versión** → sube el `.aab`.
3. «Novedades»: pega el texto de `NOVEDADES_PLAY_v14.6.txt` (≤ 500 caracteres).
4. Revisa los avisos de Play Console (permisos, dispositivos, API) y **Enviar a revisión**.
5. Mientras revisa, **no cambies más cosas** de la ficha; cada cambio puede reiniciar la espera.

## 3. Cuando la 14.6 esté disponible para los testers
1. Manda el correo de `correo_testers_v146/` (rellena enlace, dirección de `/prueba` y horario). Pídeles las pruebas del guion.
2. En tu PC copia el kit nuevo (`UltimoRefugio_Servidor_Tailscale.zip`) **sin pisar tu `config.json`** y sigue `MAPA_NUEVO_960.md`: cierra el servidor → `MIGRAR_A_MAPA_NUEVO.bat` → `INICIAR_SERVIDOR.bat` → prueba con tu teléfono.
3. Corre `PRUEBA_DURA.bat` (3 salas, con todo cerrado) y, si quieres más seguridad, una de 30 min: `node herramientas\prueba_dura.js --seg 1800`.
4. Si algo sale mal: `VOLVER_AL_MAPA_ANTERIOR.bat` restaura el config y los mundos anteriores.
5. **Avisa a quienes jueguen en las salas oficiales actuales** antes de migrar: esas partidas quedan en el respaldo y no continúan en el mapa nuevo.

## 4. Orden recomendado (resumen)
1. Esperar la revisión de la 14.0 → 2. subir `privacy.html` → 3. actualizar Seguridad de los datos y clasificación → 4. subir la 14.6 → 5. testers + pruebas de teléfonos → 6. migrar el servidor → 7. observar 2–3 días (memoria y pasos/s en `/admin`) → 8. (más adelante) producción.

## Pendiente que solo tú puedes confirmar
- El texto de la política afirma que el registro técnico se borra a los 30 días (el servidor lo hace solo desde esta versión) y que atiendes solicitudes de borrado por correo (hay que hacerlo a mano editando `duenos.json`, `reportes.json`, `bans.json` y la carpeta de la sala).
- La subida de tu internet, los teléfonos reales y la RAM con gente real (ver `GUION_PRUEBAS_REALES.md`).
- No soy abogado: si Play pide ajustar la redacción de la política o de Seguridad de los datos, hazlo siguiendo lo que pida el formulario.
