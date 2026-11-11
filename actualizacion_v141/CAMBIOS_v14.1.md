# Último Refugio v14.1 — Fase 1 del mapa grande (cimientos para 60 jugadores)

Esta versión **no cambia lo que ves en el juego actual**: prepara el motor para el mapa grande de 960×960 y reduce la carga del servidor. El mapa que se juega hoy sigue igual; el mapa nuevo llegará en la siguiente entrega.

## Qué cambia
- **Mapas de hasta 960×960 sin choques de datos:** las "piezas" del mapa (chunks) se numeraban suponiendo un mapa de máximo 512 casillas; en 960 dos zonas distintas compartían número (comprobado: la (70,0) y la (6,1)). Ahora el número se calcula según el tamaño del mundo. Mapas existentes: sin cambios.
- **Error existente corregido (guardado):** los contenedores (cajas, cofres, armarios) en casillas con índice ≥ 100 000 no se guardaban y chocaban con las cajuelas de los autos. Afectaba a las partes bajas de los mundos *enorme* (360²) y *vasto* (480²); antes pasaba desapercibido porque las pruebas usaban cajas cerca del punto de inicio. Las partidas guardadas antiguas siguen cargando (el contenido de las cajuelas se guarda dentro de cada auto).
- **Menos CPU en el servidor:** la detección de cambios del mundo por jugador ahora mira solo ±44 casillas alrededor de cada jugador (antes recorría una cuarta parte de todo el mapa cada 0,1 s por jugador), y los mapas pequeños (bombas, ramas, arbustos) se revisan cada ~2,4 s. Medido con 3 salas × 10 jugadores simulados en 960×960: **CPU total 171 % → 90 %** y **30 pasos/s por sala** (antes 26,5).
- **Tamaño `colossal` (960×960):** solo por el servidor (`"tamano": "colossal"` en `config.json`). Generar el mundo tarda ~2,5 s; ~2 200 edificios, ~2 300 autos, ~13 000 contenedores; guardado ~86 KB comprimido.
- **Límite: 10 jugadores por sala** (se mantiene por ahora; 3 salas oficiales).
- `versionCode 138`, `versionName 14.1`.

## Pruebas (Chromium, una máquina)
- Cambio cerca de un jugador se sincroniza en < 2,5 s; un jugador a 150 casillas no lo recibe hasta acercarse, entonces se pone al día y el anfitrión conserva la verdad.
- Servidor: moderación, candados/robos, persistencia (dormir/despertar), sincronización de movimiento (error < 0,1 casillas) y WebSocket por proxy: sin fallos nuevos. (Las comprobaciones "el panel no abre por proxy" esperan 404 y ahora responden 401 porque la prueba usa `claveAdmin`: sigue sin abrir.)
- Regresión: notas, partida de la 13.5 cargada en la nueva, COOP 2 y 4 jugadores, 4 días de simulación sin errores. Sigue el mismo falso positivo conocido de "botín repetido" (escena vecina activada).

## Límites
- Medido con **jugadores simulados** (bots) en un equipo de 4 núcleos, no con 30 personas reales ni en tu HP. Corre `PROBAR_CARGA.bat` en tu PC cuando puedas.
- Aún no hay barrios, callejones ni puerto: el mapa 960 actual es solo una ciudad en cuadrícula más grande. Eso es la Fase 2–4.
- Clientes v14.0 pueden entrar a un servidor 14.1 (solo cambia la clave interna de cajuelas); conviene que todos actualicen.
- **Si tu servidor ya corre un mundo guardado, no cambia**: el mapa 960 solo aparece en mundos nuevos con `tamano: colossal`.
