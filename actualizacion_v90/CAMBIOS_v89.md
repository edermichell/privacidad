# Último Refugio — Actualización v89 (app 8.3, versionCode 75): mapa y gráficos
Incluye v86 (final duro), v87 (Modo Asedio) y v88 (NPC útiles).

**Importante:** el mapa y el minimapa siguen exigiendo el objeto «mapa» (o la profesión que lo da al empezar). Probado: sin mapa no se abre el mapa ni aparece el minimapa.

## Mapa
| Mejora | Detalle |
|---|---|
| **Etiquetas ordenadas** | Antes se pisaban unas con otras. Ahora tienen prioridad: con zoom 1 solo se rotulan tu casa, la base, hospitales, policías y campamentos (10 etiquetas); al acercar aparecen las demás (42 a zoom ×2,2 y 108 a ×4). Nunca se superponen: si no cabe, no se dibuja. El lugar seleccionado siempre se rotula. |
| **Base en alta resolución** | Dibujo interno ×4 (antes 1 píxel por casilla): edificios con contorno, calles con línea central discontinua, árboles con volumen y agua con orilla y destellos. También se usa en el minimapa. |
| **Tu recorrido** | Línea punteada amarilla por donde has caminado (mapa y minimapa). Se guarda con la partida. |
| **Zonas exploradas** | Lo que aún no has pisado se atenúa suavemente. El botón **◐** (junto a +, − y ◎) lo activa o desactiva y recuerda tu elección. |
| **Señal de evacuación** | Marca roja pulsante «SEÑAL» en el mapa y el minimapa mientras está activa. |
Rendimiento medido: construir la base HD ≈ 65 ms (una sola vez), redibujar a zoom ×4 ≈ 87 ms, a zoom ×1 ≈ 8 ms.

## Gráficos
Revisé el juego por escenas (lago, bosque, niebla, lluvia, interior, multitud) y el motor **ya tiene** sombras solares y de edificios, huellas, efectos de agua, iluminación y clima, así que no dupliqué nada. Lo que sí faltaba: el atardecer se veía igual que el mediodía.
- **Hora dorada:** al amanecer (≈5:15–8:15) y al atardecer (≈16:35–19:55) hay un resplandor cálido del lado del sol. Sube la calidez y la saturación (≈22 → 47 a las 17:50) sin desaturar el pasto.
  Se apaga con lluvia, niebla, en interiores y en calidad baja.
  *Nota:* mi primer intento (mezcla «soft-light») teñía todo de marrón; lo descarté tras compararlo A/B y usé mezcla aditiva.

## Pruebas
Automáticas en navegador, 0 errores de JavaScript: sin mapa / con mapa, recorrido, etiquetas por zoom, botón ◐, base HD, marca de la señal, guardado del recorrido, hora dorada (comparación A/B), y regresión de NPC (19 comprobaciones), Modo Asedio con blindaje de guardado y menú en 5 tamaños de pantalla.
**No probado en teléfono real.** Si en un teléfono modesto el mapa tarda al abrirse, se puede bajar `S89_K` de 4 a 3 (menos memoria: 1440² → 1080²).

## Lo que no hice
Sombras/efectos nuevos de mundo (ya existen), agua animada y bloom (costo de rendimiento en móviles sin poder medirlos), nombres de calles en el mapa.
