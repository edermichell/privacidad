# Último Refugio 17.8 — solo servidor («la sala PvP también te deja donde estabas»)

**La app no cambia** (sigue siendo la 17.7, versionCode 168): no hay que subir nada a Google Play. Solo se actualiza el servidor del PC (`srv_layer.js`).

## Qué arregla
1. **Sala PvP: tras un corte de conexión vuelves donde estabas.**
   - En la 17.7 esto se arregló para las salas normales. En PvP seguía pasando: si la conexión se cortaba sin despedida (p. ej. el teléfono se queda sin señal), al reconectarte aparecías unas 4 casillas atrás (la última vez que se guardó tu mochila).
   - Ahora el servidor guarda tu posición **validada** en el momento del corte.
   - Antes de hacerlo medí que esa posición sigue al jugador real: al caminar, rodar, correr y **conducir** coincide con la del teléfono a menos de 0,1 casillas.
2. **Un teletransporte (trampa) ya no se conserva al salir.**
   - El registro del servidor muestra que la posición teletransportada **llegaba a guardarse en disco**. Con la app honrada no pasaba nada, porque acepta la corrección del servidor y vuelve atrás. Una **app modificada** que la ignorara se quedaría con el teletransporte al salir y volver.
   - Ahora, al irse, manda la posición validada del servidor. Ningún guardado tardío del teléfono (como el que la auditoría de inventario aplaza 2,5 s) puede cambiarla.
3. **Si tu última posición cae en una puerta o un marco**, se guarda la casilla libre más cercana (hasta 3). Antes, una casilla ocupada podía mandarte a un punto al azar.
   - A propósito **no** se usa esa búsqueda al *entrar* (si alguien construyó un muro donde saliste). En PvP podría aprovecharse para aparecer dentro de una base ajena, al otro lado de la pared.

## Lo que NO cambia (decisión tuya)
- **Regla PvP «desconectarse en combate = morir»:** si te desconectas menos de 20 s después de un combate, mueres y pierdes el personaje.
  - Con la reconexión automática de la 17.7, un corte de Wi-Fi en plena pelea también te mata, aunque vuelvas en 3 s.
  - **Opción A (como ahora):** justo contra quien huye, duro con los cortes honrados.
  - **Opción B (gracia de ~25 s):** si vuelves a tiempo no mueres. El riesgo es que un tramposo pueda «desaparecer» unos segundos con el modo avión.
  - **Opción C (la buena, más trabajo):** el cuerpo se queda en el mundo mientras estás desconectado y se le puede atacar.
- No la toqué sin que decidas.

## Pruebas
- `prueba_pvp_posicion_v178.js`, contra el servidor real con la validación encendida:
  - La posición validada sigue al jugador al caminar, rodar, correr y conducir.
  - Tras un corte vuelve donde estaba.
  - Un teletransporte no se conserva, ni al salir enseguida ni esperando 10 s.
- Batería completa de todo lo que usa el servidor: ver `RESULTADO_PRUEBAS_v17.8.txt`.

## Cómo actualizar el servidor
1. Detén el servidor.
2. Descomprime `UltimoRefugio_Servidor_Tailscale.zip` (en esta carpeta) y copia **`srv_layer.js`** encima del tuyo. `juego\index.html` es la 17.7 de siempre.
3. Arranca el servidor.
