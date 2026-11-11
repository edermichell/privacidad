# Mapa nuevo 960×960 — cómo pasar tus 3 salas oficiales (v14.5)

**Hasta que lo hagas, tu servidor sigue igual** (mismo mapa y mismas partidas). Nada de esto se aplica solo.

## Qué cambia al migrar
- **3 salas oficiales** (Refugio 1, 2 y 3) con el mapa nuevo: centro denso, zona industrial, puerto con mar y muelles, parques con estanques, barrio residencial, campo y callejones. **10 jugadores por sala.**
- Los mundos oficiales anteriores (y sus copias) **se mueven a una carpeta de respaldo**, no se borran: `datos\respaldo_mapa_anterior\<fecha>\` (junto con tu `config.json`).
- Las **salas creadas por jugadores no se tocan**: conservan su mundo; las nuevas se crean con el mapa normal (264×264). Como máximo **1 sala de jugadores activa a la vez**, además de las 3 oficiales (`salasUsuarioActivasMax` en `config.json`; pon 0 para no permitir salas de jugadores mientras tu PC va justo).
- La lista de salas muestra la etiqueta **MAPA 960** (esto necesita la app v14.5; con apps anteriores el mapa funciona igual, sin la etiqueta).

## Pasos (día del lanzamiento)
1. **Publica la app v14.5** en Play y deja unos días para que se actualice la gente (las apps v14.0–v14.4 también pueden entrar, pero actualizar evita problemas de cajuelas de autos).
2. Copia al PC los archivos nuevos del kit (`servidor.js`, `juego\index.html`, `herramientas\migrar_mapa_nuevo.js`, los `.bat` nuevos). **No pises tu `config.json`.**
3. **Cierra** la ventana de `INICIAR_SERVIDOR.bat`.
4. Ejecuta **`MIGRAR_A_MAPA_NUEVO.bat`**: te enseña qué hará; escribe `SI` para aplicar.
5. Abre `INICIAR_SERVIDOR.bat`. Verás: «Mapa nuevo 960×960 en 3 sala(s) oficial(es)…». La primera vez que alguien entre a cada sala tarda unos segundos en generarse el mundo (≈ 7 s; ≈ 10 s para el primer jugador en medidas de laboratorio).
6. Haz una **prueba con tu teléfono** entrando a las 3 salas y camina: centro, puerto, parque.
7. Abre `PROBAR_CARGA.bat` (3 salas, 10 jugadores) con las demás aplicaciones cerradas y mándame el resultado.

## Si algo sale mal
- Cierra el servidor y ejecuta **`VOLVER_AL_MAPA_ANTERIOR.bat`**: restaura `config.json` y los mundos oficiales de la copia (el mundo nuevo queda guardado aparte).

## Memoria y rendimiento (medido en mi equipo de 4 núcleos con Linux; el tuyo es distinto)
- Cada sala 960 activa usa ≈ 0,4–0,5 GB reales (3 salas con 30 jugadores simulados: ≈ 1,5 GB en total). El Administrador de tareas de Windows con Edge suele marcar más.
- Las salas se duermen solas tras 10 minutos sin jugadores y despiertan al entrar alguien.
- En tu portátil (i3-N305, 8 GB) **no está medido**: ejecuta `PROBAR_CARGA.bat`. Si la RAM libre baja de ~1 GB o los pasos/s bajan de 25, pon `"salasActivasMax": 2`.
