# Último Refugio 16.3 (versionCode 160): chat de voz de proximidad y sala PvP oficial

## 1. Chat de voz de proximidad (app 16.3 + servidor nuevo)
**Cómo se usa** (solo en las salas del servidor):
- **Botón VOZ** (encima de CORRER) o **tecla T** en el PC:
  - **mantener pulsado** = hablas mientras lo sostienes;
  - **un toque corto** = micrófono **abierto** (el botón queda con borde dorado y dice «abierto»); **otro toque** lo cierra.
- Mientras hablas, el botón se pone **rojo** («hablando»).
- La primera vez Android pide el **permiso de micrófono**.

**Cómo se oye:**
- Solo te oyen los jugadores a menos de **40 casillas**, más fuerte cuanto más cerca, y a izquierda o derecha según dónde estés.
- Abajo en el centro aparece **quién está hablando** con un botón **silenciar**. El silencio se recuerda por su nombre, aunque salga y vuelva.
- **Ajustes → Sonido → Chat de voz**: Activado / Apagado. Apagado no oyes a nadie y no aparece el botón.

**¡Los zombis también te oyen!** Mientras hablas haces ruido en tu posición: hablar normal se oye a unas 7–10 casillas y gritar, hasta 14. Los zombis cercanos acuden.

**Cómo funciona por dentro:**
- El micrófono se capta con eliminación de eco y de ruido, y se comprime a **calidad de teléfono** (8 kHz, unos 64 kbps mientras hablas). Los silencios no se envían.
- El servidor **reenvía la voz solo a quien está cerca**; nadie lejos puede escucharla, aunque modifique su app.
- La voz **no pasa por la simulación** de la sala, así que no la frena.
- **Nada se graba ni se guarda.** El micrófono se libera al soltar el botón.
- Las apps anteriores a la 16.3 no reciben datos de voz y siguen funcionando igual.

**Opciones en `config.json` del servidor:**
- `"chatVoz": false` lo apaga en todo el servidor.
- `"radioVoz": 40` es la distancia en casillas.
- Dentro de una sala, `"voz": false` lo apaga solo en esa sala.

**Android (parte nueva de Java, compruébala al compilar):**
- `AndroidManifest.xml`: permisos `RECORD_AUDIO` y `MODIFY_AUDIO_SETTINGS`.
- `MainActivity.java`: el navegador interno pide el permiso de micrófono a Android cuando el juego lo necesita (`onPermissionRequest`) y se lo concede al juego si el jugador acepta (`onRequestPermissionsResult`).

**Play Console (obligatorio antes de publicar):**
- Vuelve a subir `privacy.html`. Ahora explica el chat de voz y ya no dice «No usamos micrófono».
- En *Seguridad de los datos*: **Audio → Grabaciones de voz o sonido**, recopilado, procesado de forma efímera, funcionalidad de la app, opcional.
- **Clasificación de contenido:** los usuarios pueden comunicarse por voz.

## 2. Sala PvP oficial
- `AGREGAR_SALA_PVP.bat` (con el servidor cerrado) añade a **tu** `config.json` la sala **«Frontera PvP»**:
  - PvP activado y mapa de 480×480, para que los 10 jugadores se encuentren;
  - se guarda una copia de seguridad de tu config y no toca tus 3 salas ni sus mundos;
  - sube el máximo de salas activas a la vez.
  - Si ya tienes una sala PvP, no hace nada.
- La sala PvP exige la app **15.8 o posterior**: con controles contra trampas, alianzas, bandidos y temporadas de 14 días. Queda así: **3 salas normales + 1 PvP**.
- El `config.json` del kit (instalaciones nuevas) ya trae las 4 salas.

## 3. Pequeños arreglos de pantalla
- En el teléfono, el aviso «SALA · N jugadores» pasa arriba a la derecha (antes se montaba sobre el tutorial).

## Pruebas
- `prueba_chat_de_voz.js`, con dos jugadores reales y micrófono simulado, 0 fallos:
  - se oye a 3 casillas (volumen 0,92) y no a 70;
  - mantener pulsado y el toque funcionan, y el micrófono se libera al soltar;
  - el ruido llega a los zombis en la posición de quien habla;
  - silenciar se recuerda y Ajustes → Apagado oculta el botón;
  - una app antigua no recibe datos de voz.
- Capturas: `voz_hablando.png` (el que habla) y `voz_escuchando.png` (el que oye, con «● Lobo · silenciar»).
