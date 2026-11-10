# Último Refugio v13.7 — MULTIJUGADOR con salas (hasta 10) + COOP misma red

## Qué cambia en el juego
- El botón **COOP** pasa a **MULTIJUGADOR** («hasta 10 jugadores»), en el menú y en la pausa.
- Dentro:
  - **Servidor · salas (hasta 10 jugadores):** escribes la dirección de tu servidor (p. ej. `100.x.x.x:8080`), **ACTUALIZAR** y aparece la lista de salas con jugadores/máximo; **UNIRSE** entra (si la sala está dormida, el servidor la despierta). La dirección se recuerda. Si abres el juego desde el propio servidor, ya viene escrita.
  - **COOP · misma red (hasta 4 jugadores):** igual que antes (código de sala o conexión manual); no usa el servidor.
- En una sala del servidor: cartel «SALA ● N jugadores», mensaje «sala llena (máximo N)», y el anfitrión fantasma del servidor no se ve.
- Android: se permite tráfico `http` (`usesCleartextTraffic`) para hablar con el servidor por Tailscale (ya cifrado). **No compilado ni probado en un teléfono.**
- `versionCode 134`, `versionName 13.7`.

## Servidor (carpeta `servidor_tailscale`, aparte)
Salas con mundo propio, dormir/despertar, límite de salas activas, relé de señalización, guardado y copias, arranque/reinicio automático, scripts de Windows y Linux. Ver `LEEME_SERVIDOR.md`.

## Pruebas (Chromium, una sola máquina; no móviles reales ni Tailscale real)
- **10 jugadores en una sala** entrando por la lista: todos conectados, cada uno ve a los otros 9, el 11.º rechazado («sala llena (máximo 10)»), zombis que persiguen a los jugadores y no al anfitrión, sin errores. CPU del anfitrión ≈ 45 % de un núcleo (a 30 pasos/s, sin dibujar; los invitados de la prueba no dibujaban).
- Dos salas con mundos distintos; dormir tras inactividad y despertar desde la lista continuando el mismo mundo; límite de salas activas.
- COOP misma red sin cambios: 2 jugadores bien, 4 jugadores 0 fallos; tras usar el servidor, COOP vuelve a usar el servicio público. Partida de la 13.6 en la 13.7: imagen y zombis idénticos. Simulación de 4 días sin errores. Notas de superviventes: 0 fallos.
- Prueba de escenas/guardado: la misma comprobación de siempre marca fallo por activar escenas vecinas (no es botín repetido).

## Límites
Sin probar: Windows (`.bat`), Tailscale real, móviles reales, APK compilada, 24 h seguidas, 10 dispositivos dibujando a la vez. Los jugadores deben usar la misma versión (13.7). No hay contraseñas: entra quien esté en tu Tailscale.
