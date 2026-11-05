# Último Refugio — Actualización v102 (app 9.6, versionCode 88): torniquete, «vendar todo» y foco de infección a la vista
Incluye todo lo de v86–v101. Imágenes: `anatomia_torniquete.png` y `anatomia_vendar_todo.png`.

## Jugabilidad (aprovecha el sistema de cuerpo de la v96)
1. **Torniquete** (nuevo objeto, se reutiliza). Se fabrica con **2 trapos + 1 tablón** (Fabricar). En Estado › Anatomía (o Heridas), una herida **que sangra en un brazo o una pierna** ofrece **«Torniquete»**: tarda ~1,6 s y **detiene el sangrado al instante**. Pero hay un riesgo realista:
   - A los **150 s** te avisa de que lo aflojes; a los **300 s** avisa fuerte y la **zona pierde integridad**; a los **420 s** (7 min) **el miembro muere y se pierde** (modo Completo). En modo **Casual** se suelta solo y no pierdes nada.
   - **«Aflojar torniquete»** vuelve a dejar sangrar la herida; si en cambio la **vendas**, el torniquete se retira solo. La mejor jugada: torniquete → vendar → soltar.
   - Se ve en el personaje (banda roja en el brazo o la pierna) y en la lista de heridas (contador de segundos).
2. **«Vendar todo (n/m)»** en Anatomía (sin zona elegida): vende de una vez las heridas que sangran, **las que más sangran primero**, con las vendas que tengas. Antes había que tocar herida por herida en plena pelea.
3. **El foco de infección parpadea** (verde ↔ rojo) en la figura del cuerpo mientras aún se puede curar amputando (infección < 45 %), y la **primera vez que te muerden una extremidad** sale un consejo explicando que amputar a tiempo detiene la infección. Antes había que descubrirlo.
4. **Consejo** la primera vez que sangras de una extremidad sin torniquete: te dice cómo fabricarlo.

## Interfaz
- En el panel de detalle (estrecho) las heridas con **dos botones** (p. ej. «Vendar» + «Torniquete») se montaban sobre el nombre; ahora los botones van en su propia fila (arregla también «Vendar» + «Entablillar»/«Suturar»).

## Optimización: lo que probé y descarté (con medición)
- **Minificar el JavaScript** (−26 % de tamaño solo quitando espacios/comentarios; −29 % renombrando variables locales): el arranque en un teléfono 4× más lento pasó de ~4 070 ms a ~3 960 (−3 %) y ~3 830 (−6 %), **dentro del ruido** de la medición. No compensa el riesgo; no se aplicó.
- **IA lejana a ¼ de ritmo:** descartada en la v101 (el coste está en las llamadas, no en la IA).
- **Llamadas de dibujo en una horda de 60 (≈ 835 por fotograma):** las más numerosas son los zombis (fillRect/drawImage), el brillo de ojos de noche y las partículas; ninguna es un desperdicio claro (unir llamadas ahorraría poco con el mismo resultado).
- Los fotogramas con tirones al caminar son **0 > 40 ms**: construir bloques de suelo nuevos cuesta ~10 ms en un teléfono 4× lento.
La v101 ya recogió lo grande (mundo −30 %, grafitis 14×). **Para ir más allá hace falta medir en un teléfono real** (Ajustes › Gráficos › Mostrar FPS).

## Pruebas
17 comprobaciones nuevas: receta y fabricación; sangrado con y sin torniquete; aflojar; vendar con el torniquete puesto; avisos a los 150/300 s, pérdida del miembro a los 420 s (Completo) y suelta automática (Casual); máscaras y sprites (112 combinaciones); «Vendar todo» (orden y gasto de vendas); parpadeo del foco de infección (solo si < 45 %); guardado de los datos. Sprites sin torniquete **idénticos** a la v101 (48 jugador + 24 zombis); migración v85→v102 y v101→v102. Regresión completa (anuncios, diseño de pantallas pequeñas, copia de seguridad, guardado, vista previa, v96…v91, techos, mapa, Modo Asedio, menú, final de 180 s del helicóptero) y 3 minutos de estrés: 0 errores de JavaScript. (Intermitentes por azar: el sigilo de v95 y una prueba de NPC.)

## Límites
Los tiempos del torniquete (150/300/420 s) son un punto de partida (constantes `S102_*` en `layer v102`); si te parecen muy cortos o largos, dímelo.
