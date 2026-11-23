# Último Refugio 17.5 «Se ven venir» (versionCode 166)

## Qué cambia para el jugador

### Los zombis avisan antes de golpear
- **Antes:** el zombi hería en el mismo instante en que decidía atacar. No había forma de reaccionar, y la voltereta de la 17.4 solo servía por suerte.
- **Ahora:** se **echa hacia atrás** con un **destello rojo** que late y un **gruñido corto** durante la preparación, y entonces golpea:
  - caminante 0,3 s (0,36 s en modo casual), **corredor** 0,22 s, **bruto** 0,39 s; en difícil, un 20 % menos.
- Lo que puedes hacer al verlo venir:
  - **Retroceder:** si ya no estás a su alcance (1,2 casillas), falla.
  - **Rodar** (botón RODAR / Z).
  - **Pegarle primero:** el golpe lo aturde y **cancela su ataque**.
- **El ritmo de ataques no cambia** (8 intentos en 10 s, como antes). Quien se queda quieto recibe los mismos golpes, solo que un instante después: no se ha hecho el juego más fácil para quien no reacciona.
- **En las salas**, los demás jugadores ven la preparación de los zombis que les atacan (se envía como un dato más del zombi; las apps antiguas lo ignoran sin errores). El golpe va al jugador al que el zombi se preparó para atacar, aunque en ese momento haya otro más cerca.

### USAR junto a un cadáver al lado de un auto
- **Fallo encontrado** (lo destapó una prueba automática): si un zombi moría junto a un auto (en la calle es lo normal), **USAR te subía siempre al auto** y no había forma de registrar el cadáver.
  - Reproducido en la 17.4: con el auto a 0,8 casillas, mirando al cadáver → «auto»; mirando al auto → «auto».
  - 17.5: mirando al cadáver → «cadáver»; mirando al auto → «auto».
- Ahora, cuando compiten un auto y un cadáver, **gana lo que tienes enfrente**. La prioridad frente a puertas, muebles u objetos del suelo **no cambia**.

## Archivos
- `preparacion_golpe_zombi.png`: el zombi preparando el golpe, cuadro a cuadro (1/15 s).
- `prueba_v175.js`: 10 comprobaciones (tiempos, fallar al alejarse, cancelar golpeando, voltereta, tipos, dibujo, red, USAR).
- `prueba_cooperativo_v175.js`: 2 navegadores conectados; el zombi del anfitrión ataca al invitado.
- `reproducir_usar_auto_cadaver.js`: reproduce el fallo de USAR en la 17.4 y su arreglo en la 17.5.

Sin cambios en Java, permisos, política de privacidad ni servidor (solo `juego/index.html`).
