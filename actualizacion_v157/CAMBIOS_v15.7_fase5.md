# Último Refugio v15.7 — Fase 5: salas vivas (botín que vuelve, bases a salvo, bandidos y temporadas)

`versionCode 154` · `versionName 15.7`.

## Lo más importante: tres mejoras que solo dependen del servidor
Funcionan **con cualquier versión de la app** (también la 14.0 original y la 14.0.2 que tienen tus testers): basta con copiar el kit nuevo del servidor. Probado con las tres.

### 1. El botín vuelve a aparecer (todas las salas del servidor)
- Un mueble o caja que lleva **3 horas vacío** (`botinReapareceHoras`) y **sin nadie a menos de 40 casillas** se puede volver a registrar con botín nuevo. Así un mundo 24/7 no se queda vacío.
- No toca lo que construyen los jugadores, lo que tiene candado ni los maleteros. No aparece botín delante de nadie.
- `"botinReapareceHoras": 0` lo desactiva.

### 2. Bases protegidas con los dueños desconectados (todas las salas)
- La **base** de un jugador es lo que está a 8 casillas o menos de sus **candados**.
- Si **todos sus dueños** (y, en PvP, todos sus aliados) llevan **más de 10 minutos desconectados** (`proteccionBasesMin`), **no se pueden romper** sus paredes, puertas ni muebles ni **forzar** sus candados. El asaltante ve «Base protegida».
- Los primeros 10 minutos tras desconectarse **no** protegen: no sirve salirse en mitad de un asalto.
- Una base sin candados no está protegida (pon al menos un candado).
- `"proteccionBases": false` lo desactiva.

### 3. Temporadas en salas PvP
- Cada **14 días** (`temporadaDias`, también por sala) la sala PvP **se reinicia con un mundo nuevo**. Avisos a los jugadores conectados **24 h y 1 h antes**, y «¡Fin de la temporada!» al terminar.
- Se guarda el **ranking de los más temidos** (bajas) en `datos/salas/<SALA>/temporadas.json` y en el registro del servidor. Alianzas, traidores, bandidos y bajas empiezan de cero.
- Al entrar se dice cuántos días quedan; la lista de salas muestra «PVP · N d» (app 15.7) y el panel ALIANZA el ranking.

## Salas PvP: bandidos, recompensas y comerciantes
- **Bandido:** matar a **3 jugadores inocentes en 24 h** te convierte en BANDIDO 24 h. **No cuentan** como asesinato matar a un traidor, a un bandido o hacerlo en **defensa propia** (si el otro te atacó primero).
- Un bandido se ve con el **nombre naranja «· BANDIDO»** (app 15.7) y se avisa a toda la sala.
- **Recompensa:** quien mata a un bandido **cobra una recompensa**: su cuerpo deja, además de lo que llevaba, munición, un botiquín, vendas y un arma. Al morir, el bandido deja de serlo.
- **Comerciantes:** no atienden a **traidores ni bandidos** («No hago tratos con…»). Esto funciona con cualquier versión de la app.

## Pruebas (todas sin fallos)
- **Sala normal** (`f5a157.js`, 15 comprobaciones, con la app 15.7, la **14.0 original** y la **14.0.2**): el mueble vacío vuelve a tener botín y el invitado lo recibe; uno cerca de un jugador no se repone; con candado tampoco; uno recién vaciado empieza a contar; con el dueño conectado la base se puede asaltar; recién desconectado también; con más de 10 min desconectado el golpe no hace daño, se avisa y no se puede forzar el candado; al volver el dueño se quita la protección.
- **Sala PvP** (`f5b157.js`, 21 comprobaciones con 5 jugadores): 2 asesinatos no bastan; al 3.º es bandido; aviso a todos; marca naranja; el comerciante no lo atiende y a otro sí; recompensa (7 objetos en el cuerpo); deja de ser bandido; matar a un bandido, en defensa propia o a un traidor no cuenta; ranking; panel con ranking y fin de temporada; lista de salas con 14 días; avisos de 24 h y 1 h; «¡Fin de la temporada!»; mundo nuevo; ranking guardado; todo empieza de cero; temporada nueva.
- **Regresión:** ver el resumen de la entrega.

## Límites (honestos)
- **Probado con clientes de prueba, no con teléfonos reales.**
- La protección de bases se basa en los **candados** (es lo único que el servidor sabe de quién es). Las piezas sin candado cerca se pueden romper siempre.
- El botín repuesto usa las mismas tablas que al empezar el mundo; no hay «zonas calientes».
- Las identidades son anónimas: reinstalar la app libra a un bandido de su estado (igual que a un traidor).
- Al terminar una temporada la sala se reinicia aunque no haya nadie (se queda despierta unos minutos y vuelve a dormirse sola).
- El ranking usa los nombres «Jugador N», que cambian entre sesiones.
