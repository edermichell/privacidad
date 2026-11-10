# Último Refugio v14.0 — jugar sin Tailscale (sobre la 13.9)

## Qué cambia
- **El juego se conecta a las salas por WebSocket** a través del servidor (ya no usa WebRTC con las salas). Basta con que el servidor sea alcanzable por internet con HTTPS: **los jugadores no instalan nada**. El protocolo de juego es el mismo; solo cambia el canal (`WsChan`).
- El servidor reenvía invitado ⇄ anfitrión de la sala (el navegador sin pantalla de su PC), verificando identidad y baneos al entrar, con límites por IP real, de mensajes y de conexiones.
- **Publicación:** `PUBLICAR_FUNNEL.bat` (Tailscale Funnel) / `QUITAR_FUNNEL.bat`, `urlPublica` en `config.json`, guía en `LEEME_SERVIDOR.md`. La app trae como primera dirección `https://server.tail12bbaa.ts.net` (y la de Tailscale como respaldo).
- **Seguridad al publicar:** el panel `/admin`, licencias, guardado y verificación solo abren desde el propio PC y **sin pasar por un proxy** (detrás de un proxy público dan 404/403); nadie de fuera puede hacerse pasar por anfitrión; la IP de los límites es la del cliente real (X-Forwarded-For del proxy local).
- Los clientes v13.9 (WebRTC, con Tailscale) siguen entrando al servidor nuevo. COOP de misma red: sin cambios.
- `versionCode 137`, `versionName 14.0`.

## Pruebas (Chromium, una máquina; con un proxy de prueba que imita a Funnel)
- Detrás del proxy: `/admin`, `/admin/api/estado`, `/admin/licencia`, `/admin/guardar` → 404; `/sala/…/verificar` → 403; `role=host` por WebSocket → 403; petición local con cabecera de proxy o Host público → 404; directo desde el PC el panel sí abre.
- Jugadores entrando **por el proxy con WebSocket** (el canal es `WsChan`, sin WebRTC), se ven entre sí, los movimientos llegan, al cerrar uno el servidor lo quita; **10 jugadores** en una sala y el 11.º rechazado.
- Moderación, persistencia, candados/robos (suites de la 13.9) sobre WebSocket: sin fallos nuevos. Cliente v13.9 → servidor 14.0: entra. Regresión: COOP 2 y 4, notas, partida de la 13.9, 4 días de simulación sin errores (la comprobación de «botín repetido» sigue con el mismo falso positivo).

## Límites (importante)
- **No probado con Funnel real, ni con datos móviles reales, ni con la APK compilada.** Funnel tiene límites de ancho de banda de Tailscale; la **subida de tu internet** es el techo (~30–60 KB/s por jugador).
- Un WebSocket sobre datos móviles se corta si el teléfono cambia de red (Wi-Fi ↔ datos): el jugador vuelve al menú y reentra.
- Al ser público: cualquiera puede crear salas gratis/despertarlas (límites en `config.json`); sin moderación automática más allá de reportes/baneos.
