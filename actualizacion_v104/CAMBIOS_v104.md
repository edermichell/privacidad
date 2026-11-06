# v104 (9.8, versionCode 90) — pulido, rendimiento y búsqueda de errores (sin funciones nuevas)

## Lo que se revisó
- **Estrés:** 3 pruebas de 6 min y 3 de 3 min con acciones aleatorias (Normal y Casual): 0 errores de página, 0 errores silenciosos, memoria estable (33–42 MB).
- **Partidas largas:** simulación de 5–6 días seguidos (3 mundos distintos, Normal y Casual): sin errores; las colecciones del juego
  (efectos, caché de sprites, zonas del mapa, etc.) se mantienen acotadas; los cadáveres se limpian.
- **Java (MainActivity):** revisado completo (compras, consentimiento, Unity, ciclo de vida): sin fallos encontrados.
- **Compatibilidad con WebView antiguo:** el juego usa pocas funciones modernas; solo los botones superiores y del menú dependían de `color-mix`
  (Chrome 111+) y en un WebView viejo perdían fondo y sombras. Ahora llevan un estilo de respaldo (en navegadores modernos se ve igual).

## Rendimiento (solo cambios que no alteran el resultado)
Medido con la CPU emulada 4 veces más lenta; el escenario donde se nota es la **partida avanzada** (día 8+, ~2 700 zombis en el mapa):
- **Dibujado:** se descarta con una comprobación barata a los zombis lejanos antes de calcular su distancia exacta (`Math.hypot`):
  ese bucle pasó de ~0,75 ms a ~0,31 ms por cuadro.
- **Hogueras:** un solo recorrido de zombis para todas las hogueras (antes uno por hoguera).
- **Autoguardado (cada 30 s):** la serialización de zombis es ~4 veces más rápida (1,8 ms en vez de 6,9 ms de ~40 ms en total).
- Son mejoras modestas: el resto del coste es dibujo y lógica repartidos, sin un cuello de botella único.

## Comprobaciones de que nada cambió
- **Mismo dibujo y misma simulación:** con la misma semilla de azar, la v103 y la v104 producen la imagen idéntica (píxel a píxel) y los
  mismos zombis (posición, estado, fuego) en 4 escenas: día, noche con horda de 90, hogueras y partida avanzada.
- **Guardado idéntico:** 17 777 zombis aleatorios guardados con la fórmula nueva y la vieja: 0 campos distintos.
- Regresión completa (migración de partidas v85→v104 y v103→v104, anuncios, maquetación, recarga, respaldo, cuerpo/heridas, NPC, mapa,
  sprites idénticos, asedio, estrés): 0 fallos nuevos. `test_v94`/`test_v93` fallaron una vez por carga de la máquina y pasan al repetirlos;
  `test_v95` y `test_npc88` son pruebas intermitentes conocidas.
- **Limitaciones:** Java/Gradle no compilados (no hay SDK de Android aquí); mediciones en Chromium emulado, no en un teléfono real.
