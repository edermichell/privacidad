# Último Refugio v14.7 — ritmo de misiones y sucesos

**Aviso de un tester:** «salen muchas misiones en poco rato; ya el día 1 salen de rescate, de suministros, de helicópteros… debería ser que al terminar una misión, otro día salga otra».

## Qué lo provocaba (todo funcionaba a la vez, sin coordinarse)
Un día del juego dura ≈ 24 minutos reales (1 minuto de juego por segundo). Hasta la v14.6 había **cinco sistemas independientes**, cada uno con su propio reloj:

| Sistema | Cuándo llegaba (v14.6) |
|---|---|
| **Misiones secundarias** (tarjeta ACEPTAR / AHORA NO: botiquín, protección, rescate, entrega, alijo…) | primera a los **7 min** de juego; después cada **4–7 min**, y 5 min tras rechazar una |
| **SOS por radio** («¡Auxilio!… estoy atrapado») | desde el minuto ≈ 6,4 del día 1 si usas la radio (26 % cada emisión) |
| **Lanzamiento de suministros** (avión, humo rojo) | primero a los **6–10 min**; luego cada 17–30 min |
| **Helicóptero** (ruido que atrae zombis) | primero a los **13–22 min**; luego cada 23–48 min |
| **Encargos de entrega** (paquete) | cuando un superviviente lo ofrece al hablarle (ese no era automático) |

En el primer día del juego (≈ 24 min) un jugador podía recibir 3–4 ofertas de secundarias, un SOS, suministros y un helicóptero.

## Qué cambia
- **Día 1 tranquilo:** ni secundarias, ni SOS, ni suministros, ni helicóptero. Quedan el tutorial y la oferta **opcional** de la misión principal (a los 4 min, como siempre).
- **Desde el día 2:** **una misión a la vez** (secundaria, SOS o encargo de entrega). Mientras hay una oferta o misión en curso no empieza otra.
- **Al terminar, fallar o rechazar una misión, la siguiente llega otro día** (por ejemplo: la rechazas el día 2 → la próxima oferta, el día 3 por la mañana). Esto incluye el SOS: tras uno, no hay otro el mismo día.
- Las secundarias se ofrecen **de día** (07:00–16:00).
- **Suministros:** no el día 1, no antes de las 09:00 (primero se ofrece la misión) y **esperan** si hay una misión en curso. **Helicóptero:** no el día 1.
- Se guarda en la partida (el día en que terminó la última misión). Las partidas antiguas siguen funcionando.
- `versionCode 144`, `versionName 14.7`. No cambia la generación de mundos ni el servidor.

## Pruebas (Chromium)
- Simulando horas del juego: **día 1** sin oferta, SOS, suministros ni helicóptero; **día 2** (08:00) sale **una** oferta y los suministros esperan; con una misión en curso no llega un SOS; **rechazar** una misión → ese día no hay otra ni SOS, pero los suministros sí pueden llegar; **día 3** sale otra; aceptar → una misión activa; **completarla** → la siguiente no llega ese día.
- Guardar y cargar conserva el día de la última misión. Regresión completa (notas, escenas/guardado, partida de la 13.5, COOP 2 y 4 jugadores, 4 días simulados): **0 fallos**.

## Cosas a saber
- **Dónde se aplica:** en la **app** (misiones secundarias y SOS), y en el **servidor** para los suministros y el helicóptero de las salas, porque los ejecuta el navegador oculto del anfitrión. Para que las salas actuales (mapa antiguo) lo tengan, hay que copiar `juego\index.html` del kit nuevo; no hace falta migrar de mapa.
- El ritmo exacto (1 misión por día, desde el día 2) es **una propuesta mía basada en el comentario**: si al jugarlo sientes que es poco o mucho, se cambia en un par de números (por ejemplo, permitir otra misión media jornada después).
- No probé esto con personas: solo con el simulador. Pídele al mismo tester que repita los primeros 3 días.
