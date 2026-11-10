# Servidor 24/7 — plan (el cooperativo de 4 ya está hecho en la 13.4)

Sustituye al plan anterior (`PLAN_MULTIJUGADOR_5_Y_SERVIDOR_24_7.md`): la parte «varios jugadores» ya está implementada y probada con 4 navegadores reales.

## Cómo quedó el cooperativo de 4 (13.4)
- **Estrella:** el anfitrión sigue siendo la autoridad (simula zombis, civiles, coches, clima) y mantiene hasta **3 conexiones WebRTC**, una por invitado. Los invitados solo hablan con el anfitrión; este les reenvía a los demás jugadores dentro de cada instantánea.
- **Cada conexión es un «par»** con su propio estado (sombras del mapa, qué zombis/civiles ya envió, temporizadores). Para no reescribir la red del cooperativo de 2, los campos de un par se cargan en `NET` mientras se procesa su mensaje o su reloj (`netCtx`); lo que el anfitrión envía sin contexto se difunde a todos.
- **IA:** zombis y civiles eligen al jugador más cercano entre todos; cada jugador remoto tiene su propio mapa de rutas; los compañeros reclutados y el perro siguen a **quien los reclutó** (`gid`); las mordidas llegan solo al invitado atacado.
- **Compatible hacia atrás:** un invitado de la 13.3 entra a un anfitrión 13.4 (probado). Máximo: 4 jugadores; el quinto recibe «sala llena».

## Lo que falta para el 24/7
Hoy el anfitrión es un teléfono o PC con el juego abierto. Dos caminos:
1. **Anfitrión sin pantalla (recomendado):** ejecutar el mismo `index.html` en un Chromium sin interfaz (Playwright) en un VPS/Raspberry Pi, como anfitrión permanente.
   - **Transporte:** WebRTC es frágil en servidores detrás de NAT. Cambiar el transporte de `NET` a **WebSocket** a través de un relé (el `netSendRaw`/`netBindPeer` ya aíslan el envío y la recepción, así que es un cambio acotado).
   - **Persistencia:** guardar el mundo a disco cada pocos minutos y al cerrar; recuperar al reiniciar.
   - **Jugador anfitrión fantasma:** hoy el anfitrión es también un jugador (`P`). En un servidor hace falta un modo «sin jugador local» (la IA ya elige entre jugadores remotos; falta que `P` no cuente ni muera).
   - **Reconexión y personajes:** identificadores de jugador para recuperar el personaje (hoy el invitado guarda el suyo por semilla en su teléfono).
   - **Operación:** reinicio automático, límite de jugadores por sala, nombre de sala, expulsar/silenciar, anti-trampas básico (el anfitrión ya valida los golpes; falta validar objetos), registro.
2. **Simulación en Node.js sin navegador:** proyecto grande (el motor mezcla lógica y dibujo en ~23 000 líneas); solo si el 24/7 se vuelve el centro del juego.

## Siguiente paso concreto
Modo «sin jugador local» + transporte WebSocket + guardado a disco, probado con 4 navegadores como ahora (el arnés `coop4.js` ya existe).
