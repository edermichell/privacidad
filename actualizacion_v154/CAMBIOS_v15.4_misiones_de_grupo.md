# Último Refugio v15.4 — Misiones de grupo (salas PvP)

`versionCode 151` · `versionName 15.4`. Fase 4 del plan PvP. Solo en salas `"pvp": true`. Captura: `captura_panel_mision.png`.

## Cómo funciona
- **Quién la recibe:** una alianza con **2 o más miembros conectados y a menos de 90 casillas entre sí**. Llega **una misión por día de juego** (≈ 24 min reales) y **solo de día** (07:00–16:00). Si el grupo no llega a reunirse ese día, no hay misión hasta el siguiente.
- **Tipos** (al azar):
  - **Limpiar el nido:** aparece un nido de infectados (5 + 3 por jugador conectado, hasta 20; algunos corredores y un bruto) en un punto a 45–95 casillas del grupo. Se cumple al eliminar al 90 %.
  - **Mantener la radio:** alguien del grupo debe estar a menos de 7 casillas del punto **150 s** (suma de segundos). El ruido atrae infectados y cada 20 s llega una **oleada** (3 + 1 por jugador).
- **Tiempo límite:** 15 min (nido) y 12 min (radio). Falla si se acaba el tiempo, si nadie del grupo sigue conectado o si la alianza se disuelve.
- **Guía:** el punto se marca como destino en el mapa y se ve en el panel ALIANZA (tecla **Y** o el indicador de la sala): título, descripción, progreso, tiempo y distancia. Quien se reconecta a mitad de misión la recibe.
- **El botín (el dilema):** al cumplirla aparece **UN solo botín en el suelo del punto** (un arma con munición, vendas, un botiquín y 1 objeto extra por jugador conectado). **Lo coge el primero que llegue: otro aliado, un traidor o un desconocido.** Aquí es donde se decide la confianza. La marca pasa a señalar el botín.
- Lo lleva el servidor (el cliente solo muestra). Opcional en `config.json`: `"misionesGrupo": false` para desactivarlas. Exige la app **15.4** (`versionCode 151`).

## Pruebas (todas sin fallos)
- **Misiones de grupo** (`gm154.js`, 29 comprobaciones con 4 clientes reales): de noche no llega nada; de día, con 3 aliados conectados y cerca, llega; la reciben los aliados y no un desconocido; marca en el mapa y aviso; el punto está a 40–100 casillas; el panel muestra título, progreso y tiempo; al acabarse el tiempo falla; **una por día** y otra al día siguiente; **nido** (infectados vivos en su sitio, progreso, cumplida al eliminarlos); botín único en el suelo que **ve y puede coger cualquiera**; **radio** (no avanza si nadie está cerca, avanza con un aliado cerca, llegan oleadas, se cumple); quien se reconecta recibe la misión en curso; si la alianza se disuelve la misión termina; con un solo aliado conectado no llega; sala normal sin misiones.
- **Regresión:** cliente completo; vida (15.1), combate (15.2), tramposo y legítimo (15.0), alianzas (15.3), moderación, candados, persistencia, movimiento, 3 salas 960; **prueba dura 3 × 10: 29,8–29,9 pasos/s, 30/30 conectados, 0 caídos**.

## Límites (honestos)
- Probado con clientes de prueba, no con teléfonos reales; el panel se revisó a 800×360 (en pantallas muy bajas se desplaza).
- Solo **dos tipos** de misión (nido y radio). No hay escolta ni entrega; se añaden fácilmente.
- **No hay arbitraje del botín:** el primero que llegue se lo lleva (es a propósito). No hay reparto automático ni recompensa por participar.
- Los infectados de un nido que se alejan del punto siguen contando; si se los lleva el sistema de población y desaparecen cuentan como eliminados.
- El día de juego se mide con el reloj del mundo: si el servidor está en pausa (sin jugadores) no avanza.
- Las misiones no se guardan si el servidor se reinicia (se pierde la misión en curso; el siguiente día llega otra).
- Java: solo el número de versión.
