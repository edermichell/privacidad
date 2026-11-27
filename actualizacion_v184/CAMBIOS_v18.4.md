# Último Refugio 18.4 — «Una historia sin prisas» (versionCode 174)

Incluye todo desde la 17.9. Cambia el juego (`index.html`, que también usa el servidor). No cambia `srv_layer.js`, el código Java, la política ni los permisos.

## 1. Historia progresiva (lo que pediste)
**Antes:** a los 4 minutos de juego (hacia el mediodía del día 1) llegaba «RUMOR DE RESCATE» con el plan entero de golpe (notas, muestra del Paciente Cero, radio del oficial, helicóptero), y con suerte se terminaba en una tarde. Un día de juego dura 24 minutos reales.

**Ahora** la historia se cuenta por la radio, poco a poco, a lo largo de una semana de juego:

| Día | Capítulo | Qué pasa |
|---|---|---|
| 1 | Los primeros días | Solo sobrevivir. Al anochecer, la radio vieja da estática y media palabra: «…evacua…». |
| 2 | Una voz en la radio | Un fragmento entrecortado: «…frecuencia uno-cuatro-dos… helicóptero…». Va al diario; aún no hay misión. |
| 3 | El rumor | Por fin se oye entero y se ofrece la misión (de día, cuando no te persiguen). |
| — | El archivo Aurora → El Paciente Cero → La radio del oficial | Las notas de Aurora van revelando el resto, como antes. |
| 7 | La evacuación | Primer vuelo. Antes, la radio de campaña solo da estática y el panel dice «Espera el primer vuelo · faltan N días». |

- **La oferta solo cuenta el primer paso:** averiguar qué es el Proyecto Aurora leyendo sus notas. La muestra y la radio se descubren después, en las notas.
- **Cada amanecer** aparece «DÍA N» con el capítulo en que vas, en una franja oscura que se lee sobre cualquier panel (3,6 s; ver `titulo_del_dia.png`).
- **Leer una nota de Aurora por tu cuenta** sigue contando como aceptar la misión: explorar no se castiga. Lo que fija el ritmo es el día 7 del helicóptero.
- **Si tienes todo antes del día 7**, la radio de campaña te lo dice al momento («hoy es el día N»), sin abrir el diálogo de confirmación.
- **Las partidas guardadas siguen sirviendo.** Si ya habías aceptado la misión, la conservas, pero el helicóptero también espera al día 7.

## 2. Diseño: título del día y oferta
Ver `dia_y_rumor.png`. La oferta ahora reproduce el mensaje de radio entre comillas, explica el primer paso y avisa de que «los vuelos no empiezan hasta el día 7».

## 3. Rendimiento: nombres de las personas
- **Qué medí:** al perfilar una escena normal (ciudad de día, gente alrededor), lo más caro de dibujar a cada persona era su **nombre**: más del 80 % del tiempo de esa función. En cada cuadro se cambiaba la fuente y se escribía el texto dos veces (borde y relleno).
- **Qué cambié:** cada nombre se escribe una vez en una imagen pequeña, a la resolución interna, y se reutiliza. Se ve igual (ver `nombres_antes_ahora.png`).
- **Resultado medido** (misma partida, alternando, mediana de 8 rondas, ~24 personas dibujadas por cuadro):

| | Antes | Ahora |
|---|---|---|
| Procesador frenado 4×: dibujar a las personas | 3,37 ms/cuadro | **2,79 ms (−17 %)** |
| Procesador frenado 4×: cuadro entero | 7,17 ms | 6,96 ms (−3 %) |
| PC normal | sin diferencia medible | |

Es una mejora pequeña y sin desventajas. Parte del coste de escribir texto lo paga después la tarjeta gráfica y no entra en esta medida.

## Pruebas
`prueba_v184.js` recorre la historia de principio a fin:
- **Día 1:** no hay oferta a mediodía; al anochecer solo hay estática.
- **Día 2:** llega el fragmento y queda en el diario, pero aún no hay oferta.
- **Día 3:** se ofrece la misión, solo con el primer paso, y avisa del día 7.
- **Día 4 con todo:** el panel dice «Espera el primer vuelo, faltan 3 días» y la radio de campaña no llama al helicóptero (sin diálogo).
- **Día 7:** la radio pide confirmación y llama al helicóptero.
- **Otros:** el título del amanecer, que las marcas se guardan con la partida, que leer una nota sigue aceptando la misión y que los nombres se reutilizan.

Batería completa: `RESULTADO_PRUEBAS_v18.4.txt`.
