# Último Refugio v15.0 — Autoridad del servidor (base del PvP)

`versionCode 147` · `versionName 15.0`. Primer paso del plan PvP (`plan_pvp/`), útil por sí mismo en las salas actuales: cierra las tres trampas que la fase 0 demostró.

## Qué cambia
1. **El anfitrión valida el daño que mandan los invitados** (`HZ` a zombis, `HN` a NPC): alcance según el arma (cuerpo a cuerpo = su alcance + margen; arma de fuego = su alcance + margen), daño máximo según el arma (fuego ×2,5; cuerpo a cuerpo ×14 por críticos/habilidad/caído; resto 320), «disparo» solo con arma de fuego equipada, y cadencia (cubo de 120 golpes de ráfaga y 30/s sostenidos). Lo imposible se **ignora** y se anota en el registro (`daño rechazado de jugador N…`). Con rechazos graves seguidos (daño, alcance o arma imposibles) el jugador es **expulsado**; el exceso de cadencia pesa poco, para no castigar una granada sobre una horda grande.
2. **El personaje del invitado vive en el servidor.** Mochila, habilidades y estado se guardan por identidad (`uid`) en `datos/salas/<SALA>/personajes/<uid>.json`, se entregan junto con el mundo al entrar, el cliente los sube cada pocos segundos (el servidor los comprueba: formato, semilla del mundo, ≤ 60 objetos, ≤ 400 por pila, objetos existentes, vida razonable) y al salir. Editar el guardado del teléfono ya no sirve: manda el del servidor. Funciones privadas del navegador del anfitrión (no hay ruta HTTP nueva).
3. **Morir borra el personaje en las salas de modo `full`** (`muerteBorraPersonaje: "modo"`). En `casual` se conserva, como hasta ahora (salas PvE).
4. **Compatibilidad:** las versiones de la app anteriores (no mandan su versión) siguen jugando como antes, sin protección; se pueden excluir con `versionMinimaApp: 147`. Si el servidor no puede leer el almacén, el jugador entra con su guardado local (no se arriesga a borrar un personaje).
5. Nueva entrada en NOVEDADES de la app, política de privacidad actualizada (el personaje se guarda en el servidor; se borra al morir en modo completo, al reiniciar el mundo o tras 60 días), y `personajeCaducaDias` (60).

Configuración nueva (`config.json`, todas opcionales): `autoridadPersonaje` (true), `validarDano` (true), `versionMinimaApp` (0), `muerteBorraPersonaje` ("modo"), `personajeCaducaDias` (60). Detalle en `LEEME_SERVIDOR.md`.

## Pruebas (todas sin fallos)
- **Tramposo** (`auth150.js`, 16 comprobaciones, salas `full` y `casual`): daño 99 999 a un zombi lejano → rechazado; cuchillo con 5000 → rechazado; golpe legítimo → se aplica; «disparo» con cuchillo o arma inexistente → rechazado; el personaje se guarda y se recibe al volver; mochila editada en el teléfono (5 escopetas) → ignorada; basura, pila de 999, otra semilla y objeto inexistente → no se guardan; morir en `full` borra y se vuelve con personaje nuevo; en `casual` se conserva; cliente sin versión → juega sin almacén; 300 golpes en un instante → expulsado.
- **Juego legítimo** (`legit150.js`, funciones reales del cliente): fusil a ~14 casillas, hacha, y granada sobre una horda de 60 → todo el daño llega, 0 rechazos.
- **Versión mínima** y **`autoridadPersonaje: false`** funcionan como se espera.
- **Regresión:** notas, escenas/guardado, partida de la 13.5, COOP 2 y 4, 4 días simulados, mono (400 acciones, mundos chico y 960), ritmo de misiones, gama baja, novedades, suelo; servidor: moderación, candados, persistencia, movimiento, 3 salas 960 migradas; **prueba dura 3 salas × 10 jugadores: 30 pasos/s en las tres, 30/30 conectados, 0 caídos**.

## Límites que conviene saber (no es todavía anti-trampas completo)
- Un tramposo que modifique el juego **en memoria** durante la sesión puede añadirse objetos dentro de los límites del formato (el servidor no ve cada recogida). Esto se ataca en la fase 6 (libro de movimientos de inventario).
- **La vida y la muerte siguen siendo lo que el cliente cuenta**: un cliente trucado podría no avisar de su muerte o cortar la conexión justo al morir y conservar el personaje. Se corrige en la fase 1b (vida con autoridad del servidor en salas PvP).
- Los topes de daño son **generosos** (frenan lo absurdo, no al que usa el arma más fuerte que reclama tener); mejorará con la comprobación de la mochila guardada.
- No se valida todavía la velocidad ni los saltos de posición.
- En salas `casual` (PvE) morir no borra el personaje, a propósito.
- Las aplicaciones antiguas se saltan la protección hasta que pongas `versionMinimaApp`.
- Java: solo cambió el número de versión.
