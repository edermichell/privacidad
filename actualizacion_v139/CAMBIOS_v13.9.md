# Último Refugio v13.9 — moderación, candados de código y robos (sobre la 13.8)

## Cambios en el juego
- **«Buen anfitrión» solo en la Tienda** (canjear código allí). Ya no aparece en las salas; allí solo se ve, para quien lo tiene, el interruptor «sala siempre abierta» al crear una sala.
- **Reportar jugadores** (Pausa → MULTIJUGADOR): trampas, tóxico/insultos, molestar, otro.
- **Administrar mi sala** (dueño): **REINICIAR SALA**, **NUEVO MUNDO**, expulsar, banear/quitar baneo, ver y descartar reportes.
- **Identidad verificada** al entrar a una sala (firma, sin enviar la clave): hace posibles los baneos y evita suplantar a otro jugador.
- **Candado de código** (6 clavos + cinta, con martillo): puertas y almacenaje que construyas; 4 números que compartes con tus amigos. El anfitrión guarda los códigos; los demás jugadores solo saben que está cerrado. 5 fallos = 60 s de espera; el dueño recibe avisos.
- **Robos (solo en salas del servidor):** forzar el candado con ganzúa (lenta, silenciosa, 42 %) o palanca (rápida, ruidosa, 85 %); **romper a golpes** paredes, puertas, ventanas y almacenaje construidos (el hacha rinde más); lo que contenía cae al suelo. El ruido atrae zombis. El anfitrión valida distancia y tiempos.
- En solitario y en COOP de misma red los candados funcionan pero **no se puede robar**.
- `versionCode 136`, `versionName 13.9`.

## Servidor
Reportes, expulsión automática (3 reportes distintos), baneos por sala y por servidor, reiniciar/nuevo mundo, **panel `/admin` solo desde el PC**, límites contra abuso. Ver `LEEME_SERVIDOR.md`.

## Respuestas a tus dudas (probadas)
- **¿Lo que hace el jugador se queda en el servidor?** Sí: lo construido (paredes, puertas, casas, muebles), el contenido de las cajas, los objetos soltados y los candados sobreviven a dormir/despertar la sala y a apagar el servidor. Lo destruido sigue destruido.
- **¿Loot infinito?** No: el juego no repone botín; lo que se saca o se gasta no vuelve (el contenedor queda vacío para todos). **Pero** la mochila de cada jugador está en su dispositivo: un cliente modificado podría duplicar objetos. Mitigación: reportes y baneos. Un inventario controlado por el servidor es un cambio grande (no hecho).

## Pruebas (Chromium, una máquina; sin móviles ni Tailscale reales)
- Moderación: identidad falsa/ausente rechazada, reporte duplicado ignorado, expulsión automática, baneo y re-entrada bloqueada, dueño vs. no dueño, reiniciar sala, panel admin, canje en Tienda.
- Persistencia: muro, caja con contenido, objeto suelto y gasto sobreviven a dormir/despertar.
- Candados/robos: poner candado (y rechazos), B no recibe códigos, intentos fallidos y bloqueo, avisos al dueño, abrir con código, forzar demasiado rápido rechazado, forzar con palanca, romper pared (B la ve destruida), golpear desde lejos no funciona, romper caja suelta su contenido, los candados sobreviven a dormir/despertar; en solitario: candado, guardar/cargar y casillas destruidas.
- 10 jugadores en una sala; COOP 2 y 4; partida de la 13.8; 4 días de simulación sin errores. La comprobación de «botín repetido» de escenas sigue marcando el mismo falso positivo.
- Defectos encontrados y corregidos al probar: un nombre de campo de guardado chocaba con el de las puertas con llave del juego (renombrado) y el límite de registro de identidades contaba cada consulta.

## Límites
Intermitencia: en ~20 ejecuciones, una entrada de jugador falló y se resolvió al reintentar (no encontré la causa). La protección de candados frente a un cliente modificado es parcial. Los candados solo en lo que construyen los jugadores (no en casas originales). Sin probar: Windows, Tailscale real, móviles, APK compilada, 24 h reales. Los clientes < 13.9 no pueden entrar a las salas.
