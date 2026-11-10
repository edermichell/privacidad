# Último Refugio v13.8 — salas automáticas, salas públicas/privadas y «Buen anfitrión» (sobre la 13.7)

## En el juego
- **Las salas aparecen solas** al abrir MULTIJUGADOR: el juego trae servidores por defecto (`100.70.104.87:8080` y `server.tail12bbaa.ts.net:8080`), prueba el último usado y se refresca cada 6 s. Ya no hay que escribir la dirección (queda en «Cambiar servidor»).
- **Crear sala** (nombre + **pública** o **privada**): se crea y entras. Las privadas no salen en la lista: se entra con **ENTRAR CON CÓDIGO** (6 letras). El dueño ve CÓDIGO, HACER PÚBLICA/PRIVADA y BORRAR en su sala.
- **Etiquetas:** OFICIAL, PÚBLICA, PRIVADA, TUYA y **24/7**.
- **«Buen anfitrión»** (salas 24/7): tarjeta en el menú MULTIJUGADOR y en la **Tienda**; se activa canjeando un código. **Todavía no cobra:** muestra «Precio por definir» (ver `PRODUCTO_BUEN_ANFITRION.md`).
- COOP misma red (hasta 4): sin cambios. `versionCode 135`, `versionName 13.8`.

## En el servidor (carpeta `servidor_tailscale`)
Salas de jugadores públicas/privadas con dueño por dispositivo (solo se guarda el hash de la clave), límites (gratis: 1 sala; se borra tras 14 días sin jugadores), licencias con vencimiento y salas 24/7, `GENERAR_LICENCIA.bat`, límites de velocidad contra abuso. Ver `LEEME_SERVIDOR.md`.

## Pruebas (Chromium, una máquina; sin móviles ni Tailscale reales)
- Salas automáticas, también desde `file://` (como la APK); A crea pública → B la ve; B crea privada → C no la ve y entra con el código; 24/7 desactivado sin licencia; canjear código → habilita 24/7; la sala 24/7 queda activa; la Tienda muestra la tarjeta; el dueño borra su sala y otro usuario no puede; token falso rechazado; límites de salas; licencia vencida → deja de ser 24/7; sala gratis inactiva → se borra. Sin errores de página.
- 10 jugadores en una sala con el lobby nuevo: bien. Regresión: COOP 2 y 4 jugadores, notas, partida de la 13.7, 4 días de simulación sin errores. La comprobación de «botín repetido» de escenas sigue marcando el mismo falso positivo (escenas vecinas).

## Límites
- La identidad es el dispositivo: si reinstalan o cambian de móvil pierden el control de sus salas y la licencia.
- Cobrar dentro de la app requiere Play Billing + verificación en el servidor (no hecho). No hay moderación (reportes/expulsión).
- Sin probar: Windows, Tailscale real, móviles reales, APK compilada, 24 h reales.
