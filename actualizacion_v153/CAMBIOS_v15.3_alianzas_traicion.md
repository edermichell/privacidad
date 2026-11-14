# Último Refugio v15.3 — Alianzas y traición (salas PvP)

`versionCode 150` · `versionName 15.3`. Fase 3 del plan PvP. Solo en salas `"pvp": true`. Captura del panel: `captura_panel_alianza.png`.

## Cómo se usa
- Indicador de la sala («SALA PVP ● n jugadores · ALIANZA …»): **tócalo**, o pulsa **Y**, o **E** junto a otro jugador. Abre el panel **ALIANZA**: estado de tu alianza, jugadores cercanos (con **PROPONER ALIANZA**), **cuatro señales rápidas** (ALTO, AYUDA, BOTÍN AQUÍ, PELIGRO) y **SALIR DE LA ALIANZA**.
- El otro jugador recibe un aviso con ACEPTAR / RECHAZAR. Alianza de hasta **4** (`alianzaMax`, 2–8), cerca (≤ 8 casillas); no puedes proponer a quien ya tiene alianza, ni a un traidor, ni siendo traidor tú.
- Los aliados se ven con el nombre **verde** (desconocidos en blanco, traidores en **rojo** con «· TRAIDOR»), aparecen en el **mapa** (en PvP el mapa solo muestra aliados), se mandan **señales** y **abren los candados del otro** (botón «ABRIR COMO ALIADO» en el aviso del candado).

## La traición
- **Fuego amistoso activo:** puedes herir a un aliado.
- **Herir a un aliado** (o a un **exaliado que salió hace menos de 10 min**) → eres **TRAIDOR 24 h** (`traidorHoras`): sales de la alianza, **nombre rojo para todos**, no puedes entrar en otra alianza ni nadie puede aliarse contigo, y se **avisa a tu alianza**. Persiste aunque te desconectes o el servidor se reinicie (va por identidad).
- **Sin castigo** si el atacado ya te había atacado (**defensa propia**, 5 min) o si el atacado es un traidor; el traidor puede ser atacado libremente.
- **Anti-accidente con zombis:** el cliente **no apunta a un aliado** cuando tu golpe alcanzó a un zombi o hay un zombi en la línea de tiro (delante o justo detrás del aliado). Herir a un aliado exige apuntarle sin zombis de por medio.

## Otros cambios en salas PvP
- **Sin «radar»:** un cliente solo conoce a los jugadores a **≤ 55 casillas** (y a sus aliados, siempre). Antes todos los jugadores de la sala llegaban siempre a todos.
- Persistencia: `datos/salas/<SALA>/alianzas.json` (alianzas y traidores; se borra con «NUEVO MUNDO»).
- Exige la app **15.3** (`versionCode 150`).

## Pruebas (todas sin fallos)
- **Alianzas** (`ali153.js`, ~33 comprobaciones con 4 clientes reales): botón y panel, proponer/aceptar por la interfaz, marca de aliado para unos y no para otros, alianza llena (3 con `alianzaMax: 3`), sin radar a 150 casillas y aliado visible aunque esté lejos, candado de aliado sin código (un desconocido no puede y no cuenta como intento), señales solo a aliados, **persistencia tras reiniciar el servidor**, **zombi de por medio protege al aliado (golpe y disparo)**, **traición** (traidor, sale de la alianza, los demás siguen aliados, aviso, nombre rojo para todos, indicador en rojo), traidor no puede proponer ni recibir alianzas, la víctima puede devolver el golpe sin castigo, **salir y atacar enseguida = traición**, **defensa propia**, sala normal sin nada de esto.
- **Regresión:** cliente completo; PvP vida (15.1), combate (15.2), tramposo y legítimo (15.0), moderación, candados, persistencia, movimiento, 3 salas 960; **prueba dura 3 × 10: 29,9–30 pasos/s, 30/30 conectados, 0 caídos**.

## Límites (honestos)
- Probado con clientes de prueba, no con teléfonos reales. El panel se revisó en pantalla de 800×360.
- **Las identidades son anónimas:** quien desinstale la app y vuelva obtiene identidad nueva y **se libra del estado de traidor** (y de sus aliados). Es una limitación del sistema de identidad sin cuentas.
- Aún **no hay**: cofre/almacén de alianza compartido, niveles de confianza, reacción de los comerciantes ante un traidor (fase 5), ni misiones de grupo (fase 4). Las señales son texto con distancia y dirección, sin marca en el mapa. Los nombres son «Jugador N».
- La protección contra golpes accidentales a aliados vive en el cliente: un cliente modificado puede saltársela, pero entonces el servidor lo trata como traidor igualmente.
- Alguien podría «cebar» a un aliado para provocar el primer golpe: la defensa propia solo cubre al que atacó antes; no hay arbitraje más fino.
- Java: solo el número de versión.
