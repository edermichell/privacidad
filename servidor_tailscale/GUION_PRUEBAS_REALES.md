# Guion de pruebas reales — mapa nuevo 960×960 (Fase 6)

Objetivo: comprobar en **tu PC** y en **teléfonos reales** lo que yo solo pude medir con jugadores simulados. Son 3 pruebas; cada una deja un texto que me puedes mandar.

## Prueba 1 — Tu PC aguanta (≈ 5 min, solo tú)
1. Cierra `INICIAR_SERVIDOR.bat` y todas las aplicaciones (navegador, juegos…). Conecta el cargador.
2. Ejecuta **`PRUEBA_DURA.bat`**. Arranca su propio servidor de prueba (puerto 18099, carpeta `datos_prueba`; **no toca tus salas ni tus mundos**), con 3 salas del mapa 960 y 10 jugadores simulados por sala que pelean y hacen ruido contra hordas de ~120 zombis.
3. Al final verás un **VEREDICTO** y se guarda `resultado_prueba_dura.txt`. **Mándame el texto.**
   - *APROBADO* (≥ 90 % del objetivo de pasos/s y nadie caído): el PC puede con 3 salas llenas peleando.
   - *JUSTO*: pon `"fpsServidor": 24` en `config.json` o `"salasActivasMax": 2` y repite.
   - *NO ALCANZA*: `"fpsServidor": 20`; si sigue igual, `"salasActivasMax": 2` o 8 jugadores por sala.
   > Referencia en mi equipo (4 núcleos Linux): 30 pasos/s en las 3 salas; con la CPU frenada ×3 bajó a ~21 y con `fpsServidor: 20` llegó a ~22. Tu portátil (i3-N305) no está medido.

## Prueba 2 — La conexión de los teléfonos (≈ 1 min por teléfono)
1. El servidor debe estar encendido y publicado (Funnel).
2. En el teléfono abre **`<tu urlPublica>/prueba`** (con tu config: `https://server.tail12bbaa.ts.net/prueba`).
3. Pulsa **EMPEZAR LA PRUEBA** (gasta ~8 MB), espera, **COPIAR RESULTADO** y pégalo en un mensaje.
4. Hazla **dos veces por teléfono**: con Wi-Fi y con datos móviles (apagando el Wi-Fi). Si puedes, también con alguien lejos de tu casa.
- Bien: latencia < 150 ms, bajada ≥ 1 Mbit/s, subida ≥ 0,5 Mbit/s y «WebSocket conecta». Si el WebSocket no conecta, la gente no podrá jugar: dime qué pantalla ven.

## Prueba 3 — Jugar de verdad (≈ 20 min, 3 o más personas)
Tú en el PC servidor con el servidor encendido (`INICIAR_SERVIDOR.bat`, ya migrado con `MIGRAR_A_MAPA_NUEVO.bat`) y los testers con la app v14.5.
1. En MULTIJUGADOR deben verse **Refugio 1, 2 y 3 con la etiqueta MAPA 960**. Entren repartidos en las 3 salas (≈ 10 s la primera vez, unos segundos después).
2. Caminen: **centro** (calles pavimentadas, más zombis y botín), **zona industrial** (cajas en patios), **puerto** (muelles de madera con cajas al final), **parque** (estanque con puente) y **un callejón**.
3. Pelea con zombis (ir a un callejón sin salida activa la emboscada), construir un muro, abrir cajas y **salir y volver a entrar**: lo construido debe seguir.
4. **Cambia de Wi-Fi a datos** a mitad de partida (se cortará: debe volver al menú y poder reentrar).
5. Cada tester, ya jugando 5 minutos: **Ajustes → «Diagnóstico avanzado» → ABRIR → COPIAR** y me manda el texto (FPS efectivos, tiempos de fotograma). Anotar el modelo del teléfono y su Android.
6. Anota cualquier cosa rara: personajes quietos, tirones, desconexiones, zonas imposibles de cruzar, sitios donde te quedas atascado.

## Qué enviarme
- El texto de la Prueba 1 y de la Prueba 2 (por teléfono y por red) y el Diagnóstico de cada tester.
- Un mensaje con modelo de teléfono, Android, y lo raro que viste.

## Criterios para lanzar el mapa nuevo (propuestos)
- Prueba 1: *APROBADO* (o *JUSTO* resuelto con un ajuste y repetido).
- Prueba 2: todos los teléfonos con WebSocket conectando y latencia < 150 ms en al menos Wi-Fi; datos móviles < 250 ms.
- Prueba 3: ≥ 30 FPS efectivos en el teléfono más modesto, sin desconexiones en 15 min, la construcción se conserva al reentrar.

## Mensaje para los testers (copiar y pegar)
> Hola. Estamos probando el **mapa nuevo (960×960)** del Último Refugio. Instala la v14.5 y entra a **Refugio 1, 2 o 3 (etiqueta MAPA 960)**. Antes de jugar abre `https://server.tail12bbaa.ts.net/prueba` en el teléfono, pulsa EMPEZAR y mándame el resultado (COPIAR RESULTADO). Después juega 15–20 minutos: ve al centro, al puerto (muelles), al parque con estanque y entra a un callejón; pelea, construye y sal/entra una vez. A los 5 minutos abre Ajustes → Diagnóstico avanzado → ABRIR → COPIAR y mándamelo junto con el modelo de tu teléfono y tu versión de Android. Cuéntame cualquier tirón o desconexión. ¡Gracias!
