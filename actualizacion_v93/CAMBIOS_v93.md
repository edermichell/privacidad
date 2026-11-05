# Último Refugio — Actualización v93 (app 8.7, versionCode 79): Cocinero, Modo foto, botín del asedio y hordas
Incluye todo lo de v86–v92 (ver `CAMBIOS_v92.md`, `CAMBIOS_v91.md`…).

## Novedades
1. **Cocinero (4.ª especialidad de compañero).** Al reclutar a un superviviente ahora puede salir Paramédico, Mecánico, Recolector o **Cocinero**. El cocinero, desde su diálogo, te prepara **una comida caliente al día**: gasta 1 conserva/pan/fruta/carne de tu mochila y te baja mucho el hambre, un poco la sed, el estrés y el frío, y te cura unos puntos de vida. Si no tienes ingredientes, te lo dice sin gastar nada. Se guarda con la partida. (Compañeros ya reclutados mantienen su especialidad.)
2. **Zombis con uniforme en el asedio, con más botín.** En la señal del helicóptero y el Modo Asedio, **~35 % de la horda** viene uniformada (policía, médico, obrero, cocinero, soldado) y al registrarlos **rinden el doble de objetos** (y a veces tapones extra). Medido: botín ×2 respecto a un uniformado normal.
3. **Modo foto.** Pausa → botón **MODO FOTO** (o tecla **O**): congela el juego, oculta HUD, minimapa y botones táctiles y muestra «Guardar imagen» y «Salir». En PC «Guardar imagen» descarga un PNG; si el sistema permite compartir archivos, abre «Compartir». **En Android depende del WebView:** si no descarga, usa la captura de pantalla del teléfono (la pantalla queda limpia). Esc/P salen.

## Rendimiento
- **Línea de vista de zombis en caché (0,14 s):** antes `losClear` se calculaba en cada fotograma para cada zombi cercano (~100 llamadas/fotograma en una horda); ahora ~1/5.
- **Tope de zombis dibujados en hordas muy grandes:** solo si hay más de 48 a la vista (30 en calidad baja) se dejan de **dibujar** los más lejanos (a >12 casillas); siguen existiendo, se mueven y te persiguen. Se recalcula cada 0,5 s. Los de menos de ~10 casillas nunca se ocultan.
- Las funciones nuevas no cuestan nada cuando no se usan (modo foto, cocinero y botín no corren por fotograma).

### Medición honesta
En el emulador (CPU ×4) comparé v92 y v93 **alternando corridas** para descartar el ruido de la máquina: calle de día 36–45 vs 38–40 FPS, horda de 60 zombis ~25 vs ~25 FPS. **No hay mejora medible en FPS** con estos dos cambios: están dentro de la variación (±15 %) entre corridas, así que no te la prometo. Sí confirmé que no hay regresión. Probé además un «cuarto de ritmo» para la IA muy lejana y no ayudaba, así que **no lo incluí**.
Lo que domina el coste de una horda es dibujar y animar ~50 personajes (sprites y raster del canvas), no la lógica; el siguiente paso real sería medir en un teléfono con «Mostrar FPS».

## Pruebas (navegador, 0 errores de JavaScript)
19 comprobaciones nuevas (tope de zombis, caché de vista, cocinero con/sin ingredientes y límite diario, guardado, las 4 especialidades, uniformados y botín del asedio, modo foto con descarga PNG, Esc y tecla O) + regresión: correctitud v91, techos, v90, mapa, NPC, Modo Asedio, menú y el **final de 180 s del helicóptero** de principio a fin.

## Propuestas que siguen pendientes
Esquiva con enfriamiento; kit de barricadas rápidas; escoltar refugiados a un campamento; reclutar a un bandido redimido; dificultad adaptativa; inglés. Dime cuáles quieres.
