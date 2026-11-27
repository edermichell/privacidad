# Último Refugio 18.5 — «Consejos de uno en uno» (versionCode 175)

Incluye todo desde la 17.9. Solo cambia el juego (`index.html`, que también usa el servidor). No cambia `srv_layer.js`, el código Java, la política ni los permisos.

## Cómo lo analicé
Hice una herramienta (`analizar_linea_de_tiempo.js`) que juega una partida nueva y anota **todo lo que el juego le dice al jugador**, con su hora de juego: mensajes, consejos, diario, ventanas y ofertas de misión. La pasé por el día 1 y por los días 2–3. Tres hallazgos:

1. **Avalancha de consejos al empezar.**
   - Entre las 9:03 y las 9:10 del día 1 (unos 7 segundos reales) llegaban 8 consejos seguidos: huir, rodar, comerciar, agarrón, sangrado, órganos, cadáveres…
   - La caja de avisos solo guarda 4 a la vez, así que se tapaban entre ellos y con los mensajes del combate.
   - El urgente («estás sangrando») quedaba mezclado con los de funciones nuevas.
2. **Las misiones secundarias adelantaban la historia.** El día 2, antes del rumor del día 3:
   - «Botiquín de campaña» decía «Antes de ir **al hospital**…».
   - «Calibre real» decía «**Los jefes** no caen a palos…».
   - «Sintoniza la radio» daba la frecuencia completa, **142.7**.
3. **Un error de redacción:** «Un zombi te ha dejado **una rasguño**».

Los días 2–3 tienen buen ritmo: el fragmento de radio a las 10:00, el aviso de horda y la primera secundaria después de las 13:00, todo espaciado.

## Qué cambia
1. **Consejos de uno en uno.**
   - **Ritmo:** como mínimo uno cada 6 s.
   - **Urgentes primero:** sangrado, vendas, infección, hambre, sed, frío, gas… pasan delante, con 2 s entre ellos.
   - **Funciones nuevas al final:** los avisos «Nuevo: …» esperan a que nadie te persiga.
   - **Visto al mostrarse:** un consejo cuenta como visto solo cuando sale; si estaba esperando y la partida termina, podrá volver a salir.
   - **Opción «Consejos»:** si la apagas, sigue sin mostrar ninguno.
   - **Resultado medido**, con la misma herramienta y una partida nueva: en los 20 segundos más cargados del comienzo, **de 6 consejos a 3**. Esos 3 son los urgentes de la herida, que deben ir juntos; el resto se reparte por la mañana.
2. **Las secundarias ya no adelantan la historia.**
   - El hospital y los jefes se nombran a partir de 2 notas de Aurora leídas, que es cuando el juego marca el hospital en tu mapa.
   - La 142.7 se nombra cuando ya conoces la misión.
   - «Sintoniza la radio» solo se ofrece tras oír el fragmento del día 2, y ahora enlaza con él («con un radio de verdad se oiría entero»).
3. **«un rasguño».** Es la única herida en masculino; las demás (contusión, laceración, mordida, herida profunda, fractura) ya estaban bien.

## Pruebas
`prueba_v185.js` comprueba:
- **Cola de consejos:**
  - De 8 consejos a la vez sale uno, el urgente.
  - Los 3 urgentes salen primero, cada ~2 s, y el resto cada 6 s.
  - «Nuevo: …» espera mientras te persigue un zombi de verdad.
  - Con los consejos apagados no se encola nada, y una partida nueva vacía la cola.
  - Un consejo cuenta como visto al mostrarse.
- **Redacción:** «un rasguño».
- **Secundarias:** los textos del día 2, que «Sintoniza la radio» espera al fragmento, y que vuelven los textos originales cuando la historia avanza.

Batería completa: `RESULTADO_PRUEBAS_v18.5.txt`.
