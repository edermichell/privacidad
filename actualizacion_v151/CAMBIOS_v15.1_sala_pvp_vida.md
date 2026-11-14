# Último Refugio v15.1 — Sala PvP y vida con autoridad del servidor

`versionCode 148` · `versionName 15.1`. Fase 1b del plan PvP. **Todavía no hay daño entre jugadores** (llega en la fase 2): esta versión deja listos los cimientos. No actives una sala PvP al público hasta la v15.2.

## Qué cambia
1. **Atributo `pvp` de sala** (`config.json`, en la propia sala: `{ "id": "SALA4", "nombre": "Frontera PvP", "pvp": true }`). Una sala PvP: se fuerza a **modo completo** (sin segundo aliento), **morir borra el personaje**, exige la **app 15.1 o superior** (`versionCode 148`), `/salas` y `/sala/<id>/info` la marcan `pvp: true`.
2. **En la app:** etiqueta roja **PVP** en la lista de salas; al pulsar UNIRSE aparece un aviso («otros jugadores pueden atacarte y quedarse con tu equipo; si mueres pierdes tu personaje») con ENTRAR / VOLVER; dentro, el indicador dice «SALA PVP» y sale un aviso en pantalla.
3. **Vida con autoridad del servidor (solo salas PvP).** El anfitrión lleva su propia cuenta de la vida de cada jugador:
   - puede **bajar** con lo que el cliente cuente (daño que sufre);
   - **solo sube** hasta un presupuesto de curación (30 al entrar, +2 por segundo, máximo 80): una curación legítima cabe, una «vida infinita» queda frenada y el servidor le manda su vida real (`HP`);
   - el **daño entre jugadores** (fase 2) se aplicará en el anfitrión con `SRV.pvpHurt` y el cliente solo lo muestra;
   - si la vida del servidor llega a 0 el anfitrión **declara la muerte y borra el personaje aunque el cliente trucado no se muera**; al que no comunica su muerte lo echa a los 2,5 s. El cliente honrado ve su pantalla de muerte y **no** es expulsado.
4. **Arreglo de un fallo existente en Android:** `window.confirm()` **no funciona en el WebView de Android** (no muestra nada y devuelve «no»), así que «¿Borrar esta sala?», «¿Empezar un mundo nuevo?», «¿Reiniciar la sala?» y «¿Banear?» **se cancelaban solas** en el teléfono. Ahora hay un aviso propio en pantalla (en el navegador sigue el nativo).
5. NOVEDADES de la app actualizadas; política de privacidad con una frase sobre la vida en salas PvP.

## Pruebas (todas sin fallos)
- **Sala PvP** (`pvp151.js`, 25 comprobaciones): etiqueta en el lobby, aviso con VOLVER/ENTRAR, modo completo forzado, cliente antiguo rechazado, daño del servidor que llega al jugador, curación legítima sin corrección, muerte por vida 0 con borrado del personaje, **cliente honrado no expulsado**, **tramposo que ignora el aviso de vida: el servidor lo da por muerto, le borra el personaje y lo echa**, lógica del presupuesto de curación (de 10 solo sube ~30 de golpe), sala normal sin control de vida, aviso propio (Aceptar / Cancelar / Esc).
- **Regresión:** cliente completo (notas, guardado, partida de la 13.5, COOP 2 y 4, 4 días simulados, mono, ritmo de misiones, gama baja, novedades, suelo); servidor (moderación, candados, persistencia, movimiento, 3 salas 960, tramposo y juego legítimo de la v15.0); **prueba dura 3 salas × 10 jugadores: 29,9–30 pasos/s, 30/30 conectados, 0 caídos**.

## Límites
- **Sin combate entre jugadores todavía** (fase 2): por eso no se debe abrir una sala PvP al público con esta versión.
- El presupuesto de curación es una **barrera por tiempo, no por objetos**: un tramposo puede curarse hasta ~2 puntos por segundo sin gastar vendas. Se afina con el libro de movimientos de inventario (fase 6).
- El daño que **sufre un jugador de zombis y NPC** lo sigue calculando su cliente (solo se vigila que no se cure de más); un cliente trucado puede ignorarlo. Lo que sí manda el servidor es el daño entre jugadores.
- No cubre el corte de conexión justo al morir por zombis (cuerpo dormido: fase 2).
- Java: solo el número de versión.
