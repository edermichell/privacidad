# Último Refugio 18.2 — arreglos y «Forcejeo fácil» (versionCode 172)

Incluye la 18.1, la 18.0 y la 17.9. **Cambia el servidor** (`srv_layer.js`), además del juego. No cambia el código Java, la política ni los permisos.

## Cómo busqué errores
1. **Errores que el juego se traga en silencio.**
   - Muchas partes del código capturan sus errores para no romper la partida (`catch`), y 90 de esos `catch` estaban vacíos: si algo fallaba allí, nadie se enteraba.
   - Hice una copia de prueba del juego y del servidor en la que todos avisan: 109 en el juego y 99 en el servidor.
   - La pasé por dos pruebas:
     - Un bot que juega 4–6 días seguidos: pelea, rueda, empuja, usa, abre paneles, duerme, conduce, cambia de arma, provoca agarrones…
     - Tres bots en la sala PvP durante 5 minutos: combates, cortes de conexión y salidas en pleno combate con cuerpo dormido.
   - **Resultado: 0 errores escondidos** en el juego, en los teléfonos y en el servidor.
2. **Registro del servidor de esa partida:** ninguna corrección ni rechazo del antitrampas a jugadores honrados.
3. **Revisión de cómo encajan las funciones nuevas entre sí.** Ahí salieron los tres fallos de abajo.

## Errores arreglados
1. **Servidor · el cuerpo dormido se quedaba en el mundo para siempre (sala PvP).**
   - Mientras dura, el cuerpo es un personaje del mundo. El servidor guarda el mundo cada 2 minutos, al dormirse una sala vacía y al cerrarse, y lo grababa como un personaje más.
   - Al reiniciar o despertar la sala aparecía un «Nombre (desconectado)» paseando por el mapa para siempre. Lo comprobé: estaba en `mundo_actual.json` y en las copias.
   - Ahora el cuerpo se aparta un instante de la lista mientras se guarda: no se graba y sigue en su sitio. Lo comprueba la prueba del cuerpo.
2. **Agarrón · USAR seguía funcionando.** Con un zombi sujetándote podías abrir el maletero de un auto, un armario… Ahora USAR no hace nada mientras forcejeas (ese toque ya cuenta como forcejeo).
3. **Agarrón · los toques de forcejeo pulsaban botones.**
   - Al tocar rápido la pantalla podías pulsar sin querer «Soltar» en la mochila (y tirar cosas), o «Mapa», «Construir»…
   - Lo mismo con las teclas (I, M…).
   - Ahora, mientras dura el agarrón, los toques y teclas solo cuentan como forcejeo. Siguen funcionando la pausa, Escape y el joystick (sacudirlo también es forcejear).
   - Además, al empezar un agarrón se cierran los paneles abiertos.

## Mejora: «Forcejeo fácil» (accesibilidad)
**Ajustes → Forcejeo fácil** (apagado por defecto). Para quien le cuesta machacar la pantalla (una mano, dedos, artritis):
- Hacen falta **la mitad de forcejeos**.
- Basta con **mantener el dedo** en la pantalla (o una tecla pulsada): cuenta un forcejeo cada 0,25 s. El aviso lo indica.

## Pruebas
- `prueba_v182.js`: lo de arriba. Contra la 18.1 confirma los fallos: USAR abría el maletero y la mochila seguía abierta.
- `prueba_cuerpo_v179.js` (servidor): caso nuevo, «guardar el mundo NO graba el cuerpo dormido (y el cuerpo sigue ahí)».
- Herramientas de búsqueda de errores: `explorador_errores_silenciosos.js` y `explorador_multijugador.js`.
- Batería completa: `RESULTADO_PRUEBAS_v18.2.txt`.
