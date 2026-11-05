# Último Refugio — Actualización v94 (app 8.8, versionCode 80): kit de barricada, escolta, bandido redimido
Incluye todo lo de v86–v93 (ver `CAMBIOS_v93.md`, `CAMBIOS_v92.md`…).

## Novedades
1. **Kit de barricada rápida.** Nuevo objeto *Kit de barricada* (receta en Fabricar: **2 tablones + 3 clavos → 2 kits**, sin herramienta). Si llevas uno, **B** junto a una puerta o ventana la refuerza **+1 nivel en 1 s** (antes 2,4 s), **sin martillo** y con menos ruido (5 en vez de 9). Sin kits, B funciona como siempre. **La señal del helicóptero te da 3 kits** y **el Modo Asedio empieza con 6**, para la fase de preparación.
2. **Escoltar refugiados.** Los refugiados que vagan por la ciudad ahora ofrecen **«Ofrecer escolta a un campamento»** (si tu reputación no es mala). Eligen el campamento amigo más cercano a ≥28 casillas; se **marca en el mapa**, aparece un aviso arriba con **nombre, dirección y distancia** («ESCOLTA · Marta → campamento al sur · 169 m») y una **flecha amarilla** sobre su cabeza. Te sigue y huye/se protege como un compañero (más vida durante la misión). Al llegar: se queda en el campamento, **16–32 tapones, un objeto (70 %) y +8 de reputación**. Si muere, la misión termina sin penalización. Solo uno a la vez, se puede cancelar desde su diálogo y se guarda con la partida. Los refugiados de misiones (SOS/entrega) no se pueden escoltar.
3. **Bandido redimido.** Al rendirse un bandido ahora puedes **«Ofrecerle unirse a ti»** (con reputación baja puede negarse). Si acepta, te sigue como compañero armado con un bate y no te ataca; desde su diálogo puedes **«Que siga su camino»**.

## Rendimiento (sin cambiar ni un píxel)
- **No se pintan los bloques de suelo que no tocan la pantalla.** Cada bloque de 256×128 es un rombo con las esquinas transparentes; antes se pintaba aunque su rombo quedara fuera (solo su caja tocaba la pantalla). Ahora se construye igual (sin tirones al llegar), pero solo se pinta si su rombo (con margen) toca la pantalla. **Medido: 13 → 11 bloques por fotograma y −10 % de área de dibujo**; verificado con 40 pantallas aleatorias: **0 píxeles distintos** entre pintar y recortar.
- Honestidad de medición: en el emulador, las pruebas de FPS alternadas v93/v94 caen dentro del ruido (±15 %), así que **no puedo prometerte una cifra de FPS**; sí que se pinta menos con el mismo resultado visual. Nada de lo nuevo corre por fotograma salvo una marca sobre un solo NPC y un aviso que se actualiza cada 0,5 s.
- Sin cambios en gráficos (no hay mejora gráfica en esta versión; solo la flecha de escolta).

## Pruebas (navegador, 0 errores de JavaScript)
20 comprobaciones nuevas: recorte del suelo (0 px de diferencia), receta/objeto del kit, B con kit (1 s, sin martillo, +1 y se consume) y sin kit (comportamiento normal), kits de la señal y del asedio, escolta completa (oferta, marca de mapa, aviso, seguimiento, llegada con pago y reputación, muerte, cancelar, refugiados SOS no escoltables, guardado), bandido redimido (oferta, se une, sigue, no ataca, despedir). Regresión: v93, v91, techos, v90, mapa, NPC, Modo Asedio, menú y el final de 180 s del helicóptero. *Nota:* una comprobación antigua de `test_npc88` («el cadáver del uniformado se distingue») es intermitente por azar en v93 y v94 (el zombi suelta un objeto que tapa el cadáver); no es una regresión.

## Pendiente
Esquiva con enfriamiento; dificultad adaptativa; inglés; cocina/campamento mejorado con compañeros. Para más FPS en hordas sigo necesitando una medición en un teléfono real (Ajustes › Gráficos › Mostrar FPS) y su modelo.
