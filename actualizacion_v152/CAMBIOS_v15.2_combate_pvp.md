# Último Refugio v15.2 — Combate entre jugadores (salas PvP)

`versionCode 149` · `versionName 15.2`. Fase 2 del plan PvP. Con esta versión una sala marcada `"pvp": true` ya es jugable como PvP. **Pruébala primero solo con testers** (ver «Límites»).

## Cómo funciona
**El cliente solo dice «apunté a X con esta arma» (mensaje `PH`); nunca manda el daño.** El anfitrión decide todo:
1. **Propiedad del arma:** el servidor conoce la mochila de cada jugador (la última que le subió el cliente; el cliente la sube al instante cuando cambia el arma o el número de objetos). Un arma que no lleva → ataque rechazado.
2. **Tipo y alcance:** un «disparo» exige arma de fuego y un golpe cuerpo a cuerpo no puede ser con arma de fuego; alcance del arma + margen por retardo (cuerpo a cuerpo +2 casillas, disparo +4); **línea de visión** en el mapa para los disparos; **cadencia** (cada arma tiene su ritmo).
3. **Protección de aparición:** 20 s sin que otros jugadores puedan dañarte; termina antes si atacas tú.
4. **Zonas seguras:** a 10 casillas de un comerciante, médico o intendente no se puede atacar a otros jugadores.
5. **Puntería y daño decididos por el servidor:** cuerpo a cuerpo acierta el 85 %; disparo según la distancia (95 % cerca, mínimo 40 %); escopeta: cada perdigón se tira por separado. Daño = daño del arma × **0,6** (cuerpo a cuerpo) o **0,55** (fuego) × 0,85–1,15 (por ejemplo cuchillo ≈ 14, hacha ≈ 37, pistola ≈ 41, rifle ≈ 74: dos tiros). El daño se aplica con la vida controlada por el servidor (v15.1).
6. **Aviso a los dos:** «Acertaste a X» / «Mataste a X» al atacante; «X te hirió» y sacudida de pantalla a la víctima.
7. **Al morir:** el cuerpo **deja todo lo que llevaba en el suelo** (también si muere por zombis), el personaje se borra del servidor y se acredita la baja al atacante.
8. **Cortar la conexión en pleno combate (20 s) = morir:** mismo resultado que morir (personaje borrado, botín en el suelo). Salir sin combate conserva el personaje.
9. **Aparición aleatoria en la costa** y lejos de los demás jugadores, en casillas con las 8 vecinas libres (cada vez que entras).
10. Ataques inválidos repetidos (arma que no lleva, objetivo imposible) **suman avisos y expulsan**; el registro del servidor anota cada herida y muerte: `Jugador 2 → Jugador 3: 74 (rifle, 9.0 casillas) · MUERTE`.

Cambios de versión: la sala PvP exige ahora la app **15.2** (`versionCode 149`).

## Pruebas (todas sin fallos)
- **Combate** (`pvpc152.js`, 17 comprobaciones, con clientes reales y las funciones reales de golpe y disparo): aparición alejada y transitable; protección de aparición; atacar termina tu protección; cuchillo hiere (lo decide el servidor y la víctima lo ve); rifle mata, borra el personaje y deja pistola y balas en el suelo; baja acreditada; reclamar un arma que no lleva → sin daño y con aviso; **un golpe válido con `dmg: 9999` inventado hace ~14, no 9999**; golpe desde 80 casillas → sin daño; **zona segura junto a un comerciante**; **cortar en combate = morir**; salir sin combate conserva; sala normal sin combate.
- **Regresión:** cliente completo; vida (v15.1), tramposo y juego legítimo (v15.0); moderación, candados, persistencia, movimiento, 3 salas 960; **prueba dura 3 × 10: 30 pasos/s, 30/30 conectados, 0 caídos**.
- Dos hallazgos propios de las pruebas, ya corregidos: una aparición podía caer en una casilla junto a una pared (ahora se exige la casilla y las 8 vecinas libres) y el margen de alcance cuerpo a cuerpo era demasiado generoso (de +3 a +2).

## Límites (honestos)
- **Probado con clientes de prueba, no con teléfonos reales ni con red real.** Con retardo de red el golpe a larga distancia puede sentirse impreciso (los jugadores se ven a ~7 actualizaciones por segundo; el margen de alcance lo compensa en parte).
- **No hay armaduras en PvP** (la protección de la ropa no reduce el daño entre jugadores), ni sangrado/heridas por golpes de jugadores, ni retroceso.
- **Cortar en combate = morir** también castiga una caída de conexión legítima en los 20 s posteriores a un golpe. Es la regla elegida; se puede subir o bajar `SRV.PV.combat`.
- El botín queda en el suelo hasta que alguien lo recoja o se llene el tope de 3000 objetos sueltos (v14.9).
- Las **alianzas, la traición y las misiones de grupo** (fases 3 y 4) **no están todavía**: hoy todos son enemigos de todos. No hay karma ni recompensas.
- La mochila que conoce el servidor es la que sube el cliente: un tramposo que modifique el juego en memoria puede declararse un arma. Se endurece con el libro de inventario (fase 6).
- El daño que un jugador recibe de **zombis y NPC** lo sigue calculando su cliente.
- Java: solo el número de versión.
