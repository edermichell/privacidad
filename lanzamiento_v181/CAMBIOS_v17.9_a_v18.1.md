# Último Refugio 18.1 — «Animaciones con peso» (versionCode 171)

Incluye todo lo de la 18.0 y la 17.9. **No cambia el código Java, el servidor, la política ni los permisos.**

## La regla: sin perder rendimiento
- **No se crea ningún dibujo nuevo:** todo se hace moviendo, girando o fundiendo el mismo sprite al dibujarlo. La caché de sprites (que ya va justa con multitudes) no crece.
- Los personajes que no se están animando en ese momento siguen una **vía rápida** que no hace nada extra.

## Qué cambia (ver `animaciones_antes_despues.png`: arriba 18.0, abajo 18.1)
1. **La caída ya no «salta» al final.**
   - Había un fallo desde hace muchas versiones: el cuerpo caía hacia un lado y el cadáver se dibujaba con la cabeza hacia el otro. Al terminar la caída, el cuerpo se daba la vuelta de golpe.
   - Ahora cae hacia el lado correcto y se desliza un poco para acabar justo donde está el cadáver. Medido: coinciden a 1–2 píxeles en ambas orientaciones y en zombis normales y brutos.
   - Vale para zombis y para personas.
2. **Impacto contra el suelo.** Al caer hay un pequeño arco hacia atrás (en el sentido del golpe), un rebote corto al tocar el suelo, polvo y un fundido breve hacia el cadáver.
3. **Levantarse.**
   - Antes, un zombi derribado aparecía de pie de golpe.
   - Ahora se incorpora girando durante 0,4 s: empieza despacio, como apoyándose, y termina rápido.
4. **Retroceso al recibir un golpe.**
   - Zombis y personas se desplazan ~3 px hacia atrás, alejándose de quien golpea, durante 0,16 s.
   - Al principio también se aplastaban, pero dibujar un sprite escalado resultó caro, así que lo quité (ver abajo).
5. **El jugador acompaña el golpe cuerpo a cuerpo:** se echa atrás al cargar, da medio paso al golpear y vuelve. La silueta de la 18.0 le sigue.

## Rendimiento (medido)
Peor caso a propósito: 60 zombis alrededor, ~60 golpes y ~15 muertes por segundo, calidad alta. Se alterna con las animaciones encendidas y apagadas en la misma partida (8 rondas de cada, mediana):

| | Sin animaciones nuevas | Con ellas |
|---|---|---|
| PC normal | 7,00 ms por cuadro | 7,02 ms |
| Procesador frenado 4× | 46,8 ms | 44,1 ms (dentro del ruido) |

**Cómo llegué ahí:**
- La primera versión costaba un **10 % más** en ese peor caso. Tenía dos causas:
  - Escalar los sprites (el aplastamiento).
  - Crear funciones nuevas en cada dibujo de cada personaje, aunque no se estuviera animando.
- Cambié el aplastamiento por desplazamientos en píxeles enteros y añadí una vía rápida que no crea nada cuando no hay animación activa.
- **Con eso el coste queda en +0,3 %.**

## Pruebas
`prueba_v181.js` comprueba:
- **Retroceso:** guarda la dirección del golpe, se desplaza hacia atrás y vuelve a su sitio.
- **Caída:** acaba alineada con el cadáver (≤ 6 px; se miden 1–2).
- **Aterrizaje:** un solo golpe contra el suelo por caída.
- **Levantarse:** se ve girando varios cuadros.
- **Golpe del jugador:** el cuerpo se mueve con el golpe.
- **Personas:** también reaccionan.
- **Interruptor `AN181.off`:** con él todo queda como antes. Lo usa la prueba de «imagen idéntica entre versiones».

Batería completa: `RESULTADO_PRUEBAS_v18.1.txt`.

---

# Último Refugio 18.0 — «Agarrones y multitudes» (versionCode 170)

Incluye la 17.9 («El cuerpo se queda», sala PvP; ver `actualizacion_v179/CAMBIOS_v17.9.md`).

## 1. Mecánica: agarrones (forcejeo)
**Antes:** un zombi que acertaba hería en el acto. **Ahora:** a veces, en vez de golpear, **te agarra**.
- Sale **«¡TE AGARRA!»** con dos barras: la verde se llena al forcejear y la roja es el tiempo que queda.
- **Cómo te sueltas:** toca la pantalla en cualquier sitio, pulsa teclas o sacude el joystick de lado a lado.
  - Hacen falta 5 forcejeos (bruto: 8; difícil: +1; casual: −1; cada 4 niveles de fuerza: −1).
  - El tiempo es 1,9 s (difícil 1,6 s; casual 2,3 s). Mantener una tecla pulsada cuenta como un solo forcejeo.
- **Si te sueltas:** empujas al zombi y lo dejas aturdido («¡Libre!»), sin daño. A veces cae al suelo.
- **Si no te sueltas a tiempo:** te muerde. Es el golpe que iba a llegar, seguro y un 30 % más fuerte.
- **Mientras te agarra:** no puedes andar, atacar ni rodar. **Otros zombis sí pueden golpearte.**
- **Si un compañero golpea o aturde al zombi, te suelta.**
- **Cuándo pasa:**
  - En el 16 % de los golpes que aciertan, y en el 30 % sin aliento (aguante < 20).
  - Más con corredores y algo menos con brutos.
  - En difícil ×1,25 y en casual ×0,6.
  - Tras un agarrón hay unos segundos sin otro.
- **Cuándo nunca pasa:** rodando (la voltereta lo esquiva), en la torre, con jefes, con reptantes, con protección de aparición y conduciendo.
- **Multijugador:** funciona en el teléfono de quien lo sufre, que ya recibía el golpe del anfitrión o servidor.
  - Al soltarse, el invitado pide que se aturda a ese zombi.
  - El anfitrión lo hace solo si el zombi está de verdad a su lado.
  - Las apps y servidores antiguos ignoran esa petición.
- **Logro nuevo:** «Escurridizo» (suéltate de 10 agarrones).
- El agarrón no se guarda en la partida (vive fuera de los datos del jugador).

## 2. Gráficos: te ves aunque te tapen
**Antes:** en una multitud, los zombis (o un auto, o una persona) que quedan delante tapaban al jugador por completo (ver `multitud_antes_despues.png`). **Ahora:** si algo te tapa, encima se dibuja **tu contorno claro** y **un aro a tus pies**.
- Solo aparece cuando hay algo **delante** de verdad; detrás o sin nada, no.
- Aparece y se va suavemente.
- **Coste:** solo mira lo que está a tu lado; 0,03–0,06 ms por cuadro con 2.500 zombis en el mapa. El contorno de cada postura se prepara una vez y se reutiliza.

## 3. Rendimiento: guardado automático (mejora pequeña, medida)
Investigué el tirón del guardado automático (cada 30 s), que estaba pendiente desde el informe de la 16.1. Lo medí con el procesador frenado 4× (teléfono modesto), en una partida avanzada con 1.200 zombis: **el guardado completo cuesta ~15–25 ms**.
- Las medidas varían mucho entre pasadas (recolección de memoria). La primera medida que hice, con la batería de pruebas corriendo a la vez, exageraba la mejora; la descarté.
- El coste está repartido: no hay una sola pieza grande. Los zombis son el 15–25 %.

Cambios (seguros y comprobados):
1. **Un solo recorrido del mapa en vez de dos** para guardar puertas abiertas, barricadas y árboles talados. Medido en la misma página, alternando:
   - Mapa normal (360×360): **3,3 → 2,3 ms**.
   - Mapa de 960 de las salas: unas 7 veces más casillas, así que unos **23 → 16 ms**.
   - El resultado es **idéntico** al de antes (la prueba lo compara).
2. **El guardado automático escribe en la tarea siguiente** (~0,6 ms fuera del cuadro).
   - Si llega otro guardado entre medias, gana el más nuevo.
   - Si mueres justo entre medias, **la partida borrada no se resucita**.
   - Los guardados manuales, al salir y al cerrar la app siguen siendo inmediatos.

**En total:** ~1–2 ms menos por guardado en mapas normales; más en el mapa grande. **No es algo que el jugador vaya a notar**, por eso no sale en las novedades.

Descartado a propósito:
- **Preparar los zombis en el cuadro anterior:** ahorraría como mucho un 15–25 % del guardado, a cambio de complicar el guardado en edificios de varias plantas.
- **Ampliar la caché de sprites:** con multitudes enormes se rehacen 20–36 sprites/s (3–7 % de CPU), pero la caché ya ocupa ~72 MB.
- **El resto del cuadro:** lo pesado es el navegador pintando (~55 %), que no se reduce sin bajar la calidad.

## Pruebas
- `prueba_v180.js` (cliente) comprueba lo siguiente:
  - **Agarrón:** sin daño al empezar; no anda, no ataca, no rueda; el que agarra no golpea aparte y otro zombi sí.
  - **Soltarse:** se suelta tocando, con teclas y con el joystick; mantener una tecla pulsada cuenta como un solo forcejeo; si no forcejea, muerde.
  - **Compañero:** si aturde al zombi, te suelta.
  - **Excepciones:** rodando, reptantes, jefes y protección, y la pausa entre agarrones.
  - **Probabilidad real:** con 4.000 tiradas.
  - **Petición del invitado:** el anfitrión solo aturde si el zombi está cerca.
  - **Guardado:** idéntico al recorrido antiguo; escritura automática en dos tareas; morir no resucita la partida.
  - **Silueta:** solo con algo delante, y barata.
- `prueba_agarron_sala_v180.js` (servidor real) comprueba:
  - El zombi del servidor agarra al jugador.
  - Mientras agarra, no le hiere aparte.
  - El jugador se suelta y el servidor aturde a ese zombi.
- Batería completa (cliente y servidor): `RESULTADO_PRUEBAS_v18.0.txt`.

---

# Último Refugio 17.9 — «El cuerpo se queda» (opción C)

Es la opción **C** que elegiste para la regla PvP «desconectarse en combate».

## Qué cambia en la sala PvP
- **Antes:** si te desconectabas menos de 20 s después de un combate, **morías al instante** y perdías el personaje. Pasaba también con un corte honrado de Wi‑Fi, aunque volvieras en 3 s.
- **Ahora:** tu **cuerpo se queda dormido** donde estabas durante **30 s**.
  - Los demás lo ven **tumbado**, con tu nombre y «(desconectado)», y «Zzz…» encima. No se puede «hablar» con él.
  - **Pueden atacarlo** (jugadores y también zombis).
  - **Si lo matan:** es una muerte PvP normal. Sueltas la mochila en el suelo, tu personaje se borra y la muerte cuenta para quien te mató.
  - **Si vuelves a tiempo:** despiertas **en tu cuerpo**, con la vida que le quede, y el juego te lo dice («Vuelves a tu cuerpo…»).
  - **Si nadie lo toca y no vuelves:** a los 30 s el cuerpo desaparece y **conservas el personaje**. Al volver apareces donde lo dejaste.
- Desconectarse **fuera de combate** no cambia: no queda cuerpo.
- Quien huye ya no se libra: su cuerpo queda ahí, a merced de los demás. Un corte honrado deja de matarte si vuelves enseguida.

## Arreglo: tras morir ya no reapareces junto a tu mochila (sala PvP)
La aparición al azar elige, entre unos 60 puntos de la costa, el más alejado de los demás jugadores. Por eso, tras morir solía tocar **el mismo punto que la vez anterior**. Si el jugador no se había movido, reaparecía **junto a su mochila recién caída** y la recuperaba al momento (lo detectó la batería de pruebas).
- Ahora la aparición tras morir **evita 40 casillas alrededor del sitio de la muerte** (o del cuerpo dormido) durante 30 min.
- Si no hubiera ningún otro punto, usa el de siempre.

## Ajustes del servidor (`config.json`, opcionales)
| Clave | Por defecto | Para qué |
|---|---|---|
| `cuerpoDesconectado` | `true` | Con `false` vuelve la regla anterior (desconectarse en combate = morir). |
| `cuerpoSeg` | `30` | Segundos que se queda el cuerpo (mínimo 10). |

## Qué cambia en la app (17.9, versionCode 169)
Solo el aspecto del cuerpo dormido: aparece **tumbado** y no ofrece «hablar». Una app 17.7 lo ve de pie, con el nombre «(desconectado)», y la regla funciona igual (la decide el servidor).
**No hace falta subir la 17.9 a Play por separado:** va incluida en la 18.0.

## Pruebas
`prueba_cuerpo_v179.js` usa dos jugadores reales contra el servidor con la sala PvP. Comprueba 21 casos:
- Fuera de combate no queda cuerpo.
- En combate queda dormido donde estaba, y el otro jugador lo ve tumbado.
- Un golpe le quita vida. Al matarlo se borra el personaje, suelta la mochila y suma la muerte PvP.
- Los zombis también lo hieren.
- Al volver a tiempo despierta en su cuerpo, con la misma vida en el teléfono y en el servidor, y recibe el mensaje.
- A los 30 s el cuerpo desaparece, el personaje sigue vivo y al volver aparece donde lo dejó.
- No queda ningún cuerpo duplicado en el mundo.

Batería completa: `RESULTADO_PRUEBAS_v17.9.txt`.

## Cómo actualizar el servidor
1. Detén el servidor.
2. Descomprime `UltimoRefugio_Servidor_Tailscale.zip` (en esta carpeta) y copia encima de los tuyos:
   - `srv_layer.js`
   - `servidor.js`
   - `LEEME_SERVIDOR.md`
   - `juego\index.html` (17.9)
3. Arranca el servidor.
