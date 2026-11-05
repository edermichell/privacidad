# Último Refugio — Actualización v87 (app 8.1, versionCode 73)
Incluye todo lo de la v86 (final duro del helicóptero, ver `CAMBIOS_v86.md`) más lo siguiente.

## 1. MODO ASEDIO (nuevo, oleadas sin fin)
- Botón **ASEDIO** en el menú, al lado de «Nueva partida» (en celulares queda en la misma fila, sin ocupar más alto que antes).
- Mundo chico y denso, equipo inicial (escopeta, pistola, molotovs, vendas, martillo, tablones, clavos, linterna…), noche con lluvia.
- Las oleadas usan la misma tecnología del final del helicóptero pero **no terminan**: crecen cada segundo y cada minuto sube de NIVEL
  (los niveles 2+ traen brutos). Caen suministros cada ~85 s. El centro del asedio sigue al jugador.
- **Puntos = segundos sobrevividos + 5 por baja.** El récord se guarda en el dispositivo y se muestra en el botón.
- Al morir: pantalla «ASEDIO TERMINADO» con tiempo, nivel, bajas, puntos y récord; botones REINTENTAR / MENÚ.
- Respeta la dificultad y el modo (Casual/Completo) que elijas en el menú.

### Blindaje de la partida de campaña (lo más delicado)
Morir borra el guardado en este juego, y el guardado tiene varias capas. Por eso, durante el asedio:
- `saveGame()` y la copia `sv73` quedan **bloqueados**: el asedio nunca escribe en tu partida.
- La partida se respalda en memoria y en `localStorage` (`ultimo_refugio_asedio_bak`); si el juego borra el guardado al morir, se **restaura antes de mostrar nada**.
- Si la app se cierra en pleno asedio, al abrir se recupera sola si faltara.
- Verificado con prueba automática: guardado idéntico antes / durante / después de morir, tras reintentar y tras salir al menú; «Continuar» abre la campaña original.

## 2. Flecha hacia la señal
Cuando estás a más de 14 casillas de la señal de evacuación, una flecha **orbita alrededor de tu personaje** apuntando a ella con la distancia («SEÑAL 26 m»).
(La probé primero en el borde de la pantalla, pero el panel de misión la tapaba.)

## 3. Helicóptero grande
Antes era una silueta de ~14 px. Ahora tiene cabina de cristal, fuselaje, viga y rotor de cola, mástil, patines, rotor principal animado y luz estroboscópica.
De noche lleva un halo de luz y un haz de foco hacia la zona de la señal. Mira hacia donde se mueve.

## 4. Rendimiento
- Al morir un zombi ya no se crea un arreglo nuevo con todos los zombis para contar cadáveres (era por cada baja).
- Corrección a mi análisis anterior: **el juego ya precalienta los techos al iniciar** (los primeros 120 fotogramas, detrás de la pantalla de carga). El tirón de 346 ms que medí lo causó mi propio
  teletransporte de prueba, no el juego normal. No hace falta tocar eso.

## 5. Cómo se probó
- Automático (navegador, reloj virtual): menú en 5 tamaños de pantalla; Modo Asedio completo (entrar, 70 s de juego, guardado intacto, morir, restauración, récord, reintentar,
  salir, continuar campaña); final del helicóptero completo (180 s, 10 notas); corrida larga del Modo Asedio hasta el nivel 6 (284 bajas, máx. 86 infectados cerca, cadáveres acotados). **0 errores de JavaScript.**
- Capturas revisadas: HUD del asedio, fases, helicóptero de día y de noche, flecha.
- **No probado en un teléfono real ni por jugadores.** Los números de dificultad (`s86Size`, `s86Interval`, `s86Cap`) son un punto de partida.

## 6. Lo que NO hice (y por qué)
- **Esquivar/rodar:** cambia el combate base del juego; necesita animaciones y balance propios.
- **Escena cinemática de aterrizaje:** requiere arte y guion; el helicóptero grande + descenso ya cubren lo esencial.
- **Dificultad adaptativa con las estadísticas de la v85:** necesita datos reales de jugadores para calibrarla.
- **Menos `makeNoise` con `bfs` en la señal:** son dos cálculos por ciclo y no aparecen en el perfil; no vale el riesgo.
