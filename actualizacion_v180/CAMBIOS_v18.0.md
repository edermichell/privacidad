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
