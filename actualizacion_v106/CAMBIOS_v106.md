# v106 (10.0, versionCode 92) — calles con vida (propuestas A + B)

## A) Escenas en las calles (solo en partidas NUEVAS)
Cada ~3 manzanas de calle recta hay una escena fija (en un mapa grande, unas 130–160; en uno pequeño, unas 30):
- **Choque:** 2 autos destrozados (sin combustible, reparables con martillo y clavos; no humean) + a veces un tercero abandonado, cristales rotos, aceite, neumático,
  escombros, marcas de frenado y a veces sangre y un cuerpo.
- **Control abandonado:** 2 autos cruzados en la calzada con un hueco, conos (en pie y caídos), neumáticos, casquillos y cajas.
- **Maletas abandonadas:** maletas (algunas abiertas con ropa), mochila, ropa, bolsas y a veces un auto abandonado y un cuerpo.
- **Cuerpos:** 2 cuerpos con charcos de sangre, rastro de arrastre, casquillos y una mochila; moscas encima de día.
- **Botín:** 0–3 objetos pequeños por escena (comida, agua, venda, pastillas, munición) que aparecen la primera vez que te acercas (~16 casillas) y no se repiten.
  Las escenas visitadas se guardan con la partida. Un aviso único explica que los cuerpos y maletas pueden guardar algo útil.
- **Coste:** el suelo de la escena se pinta una sola vez al construir el bloque (0 por cuadro). El arte y los 24 sprites de cuerpos se preparan al empezar,
  poco a poco, para que no haya tirones: construir un bloque con escena cuesta lo mismo que uno sin ella (~4 ms con la CPU emulada 4× más lenta).
- **Compatibilidad:** las partidas guardadas con la v105 o anteriores NO cambian (comprobado: misma imagen píxel a píxel y mismos zombis). Modo cooperativo:
  el invitado reconstruye las mismas escenas desde la semilla y recibe los autos con el resto del mundo.

## B) Movimiento ambiental (todas las partidas, desactivado en calidad baja)
- Papeles y bolsas arrastrados por el viento (máx. 5), que se paran contra los obstáculos y rebotan con el viento.
- Vapor de alcantarillas, a ratos y con frío, de noche o con lluvia (sutil).
- Ondas en los charcos cuando llueve.
- Moscas sobre los cuerpos (de día).
- Coste medido por cuadro: ~0,02 ms la lógica y ~0,02 ms el dibujo (CPU emulada 4× más lenta).

## Rendimiento (con más autos en el mapa: de 141 a unos 300 en un mapa grande)
- La cuadrícula de colisiones de autos solo se reconstruye si algún auto se movió (antes, en cada cuadro).
- Búsqueda de objetos interactuables: descarte barato antes de calcular distancias a cada auto.
- Resultado: con el doble de autos, `updCars` pasó de 0,13 a 0,05 ms y el coste total por cuadro de la calle de día es igual al de la v105 (dentro del ruido de medición).
- Un auto destrozado sin combustible ya no humea (los que se rompen jugando, con combustible, siguen humeando).

## Comprobaciones
- Pruebas nuevas: escenas + botín + guardar/cargar + partida antigua + modo invitado (8/8), partida de la v105 cargada en la v106 (idéntica),
  asedio sin salida (v105) y zombi atascado (v105): sin regresión.
- Regresión completa (migración v85→v106 y v105→v106, anuncios, maquetación, recarga, respaldo, cuerpo/heridas, mapa, sprites idénticos, asedio, estrés 3 min):
  sin fallos nuevos (`test_v95` y `test_npc88` son intermitentes conocidos). Simulación de 5 días seguidos: sin errores y con memoria acotada.
- **Limitaciones:** mediciones en Chromium emulado, no en un teléfono real; Java/Gradle sin cambios y sin compilar aquí. El `.exe` de PC NO está actualizado (sigue siendo la v9.9).

## Pendiente (propuestas C, D, E y F)
Más fauna, señales lejanas (humo, disparos, hordas a distancia), zombis de calle con situación y luces lejanas: sin hacer.
