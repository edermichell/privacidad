# Último Refugio 17.7 «Conexión firme» (versionCode 168)

Esta versión trata del **multijugador**: dos fallos reales encontrados con pruebas repetidas, más la reconexión automática.

## 1. Invitados atascados en «conectando» (cooperativo)
- **Medido:** al unirse 3 invitados a una partida, en **3 de 8 intentos** uno se quedaba en «conectando» para siempre (hasta el aviso de error a los 40 s).
- **Causa:** el primer mensaje del invitado («hi»: «estoy aquí, mándame el mundo») a veces se perdía en la carrera entre abrirse el canal y estar listo el anfitrión, y nadie lo volvía a pedir. El registro lo muestra: el anfitrión nunca recibió el «hi» de ese invitado.
- **Arreglo:**
  - Si en 4 s no le llega nada, el invitado repite el «hi» (cada 3 s, hasta 6 veces).
  - El anfitrión ignora los «hi» repetidos de quien ya recibe o recibió el mundo, así que nunca lo manda dos veces.
  - Sirve igual para el cooperativo directo y para las salas del servidor.
- **Resultado: 0 fallos en 16 intentos (48 uniones).** En 2 de ellas el primer «hi» se perdió y la repetición, a los 4 s, salvó la conexión.

## 2. Reconexión automática en las salas del servidor
- **Antes:** si se cortaba la conexión en plena partida (p. ej. el teléfono pasa de Wi-Fi a datos, o el servidor se reinicia), salía «Se perdió la conexión» y el juego volvía al menú; había que buscar la sala a mano.
- **Ahora:** aparece «Conexión perdida · reconectando (1/7)…» y el juego vuelve a entrar **solo** en la misma sala.
  - Si el servidor se reinició y la sala está dormida, la despierta como al entrar a mano.
  - Hace 7 intentos (1,5 · 3 · 5 · 8 · 12 · 15 · 20 s, alrededor de 1 minuto). Si ninguno sale bien, vuelve al menú como antes.
  - Mientras reconecta, el movimiento se bloquea y hay un botón **«Salir al menú»**.
  - El cooperativo directo (sin servidor) no cambia, porque depende del teléfono del anfitrión.

## 3. Arreglos en el servidor: «aparecer donde lo dejaste»
- **Fallo:** si la conexión se cortaba sin despedida (el teléfono se queda sin señal), el servidor anotaba la última posición del jugador como «pendiente de guardar». Pero el guardado periódico solo recorre a los jugadores conectados, así que **nunca se escribía**. Al volver, el jugador aparecía donde se guardó la última vez (cuando cambió su mochila).
- **Medido:** en una sala normal, con el servidor anterior volvía unas 7 casillas atrás. Con el arreglado, en su sitio (repetido 4 veces).
- **Arreglo (`srv_layer.js`):**
  - En las salas normales la posición se escribe al desconectarse.
  - La posición «validada» de la sala PvP solo se usa mientras la validación de movimiento está activa. Si se apaga, se quedaba congelada en el punto de aparición.
- **Sala PvP: sin cambios de comportamiento.** Al investigarlo vi que, en una de las pruebas, la posición validada de la sala PvP podía quedarse atrás respecto a la real. Hasta revisarlo a fondo, en PvP se sigue guardando como en la 17.6: manda la posición que envía el teléfono al salir.
- **Pendiente de revisar (no es de esta versión):** en PvP, un jugador con trampas que se teletransporta y sale podría volver al sitio teletransportado. Es así desde la 15.9. Arreglarlo requiere confiar en la posición validada, y antes hay que comprobar que nunca se queda atrás.

## Pruebas
- `prueba_reconexion_v177.js` (contra el servidor real; lo apaga y lo enciende): 12 comprobaciones. Corte en plena partida, servidor caído y vuelto a encender, «Salir al menú» y abandono tras 7 intentos.
- `prueba_uniones_cooperativo_v177.js`: uniones repetidas de 3 invitados con registro de mensajes.
- Las dos quedan en la batería de regresión.

## Qué hay que actualizar
- **App (17.7):** solo cambia `juego/index.html`. Java, bibliotecas y política siguen como en la 17.6.
- **Servidor del PC:** copia el **`srv_layer.js`** nuevo, además del `juego\index.html`. Los dos vienen en el zip del servidor. Reinicia el servidor.
