# v105 (9.9, versionCode 91) — arreglos a partir de los comentarios del tester

## 1. Pantalla muerta sin salida tras morir en el Modo Asedio
**Qué pasó:** al morir en el asedio sale el cuadro «ASEDIO TERMINADO». Tocar **fuera** del cuadro (el fondo oscuro, o los botones del HUD que
lo rodean) lo cerraba, y como el jugador ya estaba muerto no quedaba ningún botón que funcionara: había que reiniciar el juego.
Además, el botón MENÚ tardaba ~1 s en aparecer (solo se veía REINTENTAR).
**Arreglo:**
- Estando muerto, tocar fuera del cuadro ya no lo cierra.
- Red de seguridad: si el cuadro se oculta por cualquier causa estando muerto en el asedio, reaparece solo (revisión cada 0,6 s).
- REINTENTAR y MENÚ aparecen a la vez, de inmediato.
**Comprobado:** reproduje el fallo (tocar fuera → sin salida) y con la v105 el cuadro aguanta toques en 7 puntos de la pantalla y teclas
(Esc, Espacio, E), reaparece si se oculta a la fuerza, y MENÚ vuelve al menú. La muerte normal (fuera del asedio) ya no tenía este problema.

## 2. «Ese zombi se quedó pegado ahí»
**Qué pasaba:** un zombi que te ve en línea recta con un **poste de luz** (u otro objeto sólido pequeño) en medio seguía empujándolo para
siempre: esos objetos bloquean el paso pero no tapan la vista, así que el zombi no buscaba otro camino. Pasaba sobre todo cuando quedaba casi
alineado con el poste.
**Medido (zombi a 3 casillas, objeto en medio, 13 s):** llegaba hasta el jugador solo en 97 de 258 pruebas (los buzones, 0 de 18; farolas 51 de 120;
rocas, bancos, hidrantes y papeleras también fallaban).
**Arreglo:** si un zombi que te persigue avanza menos del 30 % de lo debido durante 0,5 s, pasa 2,5 s siguiendo la ruta que rodea los
obstáculos (la misma que ya usaba cuando no te veía). No se aplica a puertas, ventanas, vallas ni barricadas: ahí sigue golpeando como siempre.
**Resultado:** llegan 251 de 258 (las farolas, bancos, papeleras, hidrantes y buzones 100 %; quedan 7 casos con rocas, en bordes del mapa).
Barricadas: mismo comportamiento que la v104 (mismo daño y posición en 6 puertas probadas).
**Efecto secundario esperado:** en una escena de calle con 76 zombis, 13 se desatascaron en 4 s; por eso la simulación ya no es idéntica a la v104.

## Notas
- Música: el tester dice que «ya se escucha un poco mejor». Sin cambios.
- Observación (no cambiada): al pulsar REINTENTAR en el asedio se vuelve a reproducir la intro cinematográfica («Nadie imaginó lo que…»),
  que se puede saltar tocando. Dime si prefieres que el asedio no la muestre.
- Regresión completa (migración v85→v105 y v104→v105, anuncios, maquetación, recarga, respaldo, cuerpo, mapa, sprites idénticos, asedio, estrés):
  sin fallos nuevos; `test_v95` y `test_npc88` son intermitentes conocidos.
- Java/Gradle sin cambios; no compilados aquí (no hay SDK de Android).
