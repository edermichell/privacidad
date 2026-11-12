# Último Refugio v14.6 — pulido (sin funciones nuevas)

Revisé lo que ya hay buscando errores y desperdicio. Hallazgos y qué hice; todo lo demás quedó **igual** (no toqué la generación de mundos: los 6 mundos de prueba de 168 a 360 son idénticos a la v14.1 y el 960 idéntico al de la v14.5, por hash).

## Cómo busqué
- **Análisis estático** (eslint) del juego y del servidor: variables sin definir, constantes reasignadas, claves duplicadas… **0 errores reales** (solo 5 avisos de funciones redefinidas a propósito por las capas).
- **Recorridos de estrés** en 6 combinaciones de tamaño/tipo de mundo (168 a 960): 40 teletransportes, zombis al lado, 4 800 pasos, 4 000 pasos más (≈ medio día de juego), guardar y cargar, dibujo. Volcado de las excepciones que el juego «traga» (`DBGC`) y de las de página.
- **Prueba «mono»**: toques y teclas al azar por todos los menús y en partida (≈ 500 acciones en mundo chico y 960) y en el **lobby multijugador con 2 clientes y un servidor real** (≈ 200 acciones).
- **Servidor:** 28 peticiones «raras» (rutas con `..`, parámetros enormes o inválidos, WebSocket con basura, 40 conexiones abortadas, POST de 9 MB), 8 ciclos despertar/dormir de una sala 960, matar el renderizador de una sala, y una **prueba de resistencia de 12 minutos** (10 jugadores peleando, ~10 días de juego).
- **Perfiles de CPU** del anfitrión (10 jugadores peleando en 960) y de un teléfono emulado (CPU ×4).

## Qué encontré y arreglé
1. **Arco rojo de golpe (juego):** si se redibujaba la pantalla sin tiempo de fotograma (p. ej. al expandir un panel flotante) justo cuando el arco estaba activo, su temporizador quedaba en «no es un número» y el arco **dejaba de dibujarse el resto de la sesión** (más un error de dibujo en cada redibujado). Ahora ese caso es seguro.
2. **Aviso «Entras a: …» (mapa 960):** caminando por el límite entre dos distritos se repetía sin parar. Ahora, como mucho uno cada 4 s.
3. **Anfitrión (CPU):** la firma de cada auto se recalculaba por cada jugador en cada tick (2 300 autos × 10 jugadores × 10/s); ahora se reutiliza en la misma ventana de 16 ms. Esa función bajó de 2,3 % a 0,8 % del tiempo del anfitrión; la sincronización de autos entre 3 jugadores sigue funcionando (combustible, daño, auto destrozado, cambios repetidos).
4. **Servidor (memoria):** con todas las salas dormidas el navegador oculto seguía ocupando ≈ 250 MB. Ahora se cierra a los 2 minutos de inactividad y se reabre solo al despertar una sala (la memoria en reposo bajó de ≈ 360 a ≈ 105 MB; despertar sigue tardando ≈ 7 s).
5. **Registro del servidor:** se recorta a 30 días (ya declarado en la política de privacidad).
6. **Pruebas internas:** la comprobación «botín repetido», que fallaba siempre, no era un error del juego: el propio test activaba escenas vecinas nuevas; ahora distingue el caso y pasa. Las comprobaciones de proxy esperaban 404 y el panel responde 401 con `claveAdmin`: también ajustadas.

## Resultado de las pruebas
- Regresión completa (notas, escenas/guardado, partida de la 13.5 en la nueva, COOP 2 y 4 jugadores, 4 días simulados): **0 fallos**.
- Servidor (moderación, candados/robos, persistencia, movimiento, migración con 3 salas 960 y 4 salas activas): **0 fallos**.
- Mono, estrés de mundos, lobby con servidor real: **0 errores de página, 0 excepciones tragadas, 0 errores del juego**.
- Servidor: 0 caídas con las 28 peticiones raras; reinicio automático en ≈ 9 s al matar el navegador; 8 ciclos despertar/dormir sin crecer (≈ 368 MB estable antes del cambio de inactividad).

## Observaciones (no las toqué: son diseño o decisión tuya)
- **La población de zombis crece con los días de juego** (el «brote»): en 960 ≈ 500 el día 2, ≈ 1 400 el día 3, ≈ 2 900 el día 4 y ≈ 14 000 hacia el día 10 en la prueba de resistencia (360²: ≈ 840 el día 4). La CPU se mantuvo (≈ 30 pasos/s) porque lo lejano no se simula, pero la **memoria de una sala crece** (≈ 250 → 450–570 MB de memoria de JavaScript en 10 días) y el guardado también. Si una sala vive muchos días seguidos, conviene vigilarlo y, si hace falta, bajar «zombis» en `config.json` (hoy 1) o reiniciar la sala con «NUEVO MUNDO» de vez en cuando.
- **Objetos tirados en el suelo** (de zombis abatidos o de jugadores) no tienen tope ni caducidad: ≈ 33 por cada ~300 bajas. Es poco, pero en una sala de meses crecería. No lo cambié porque borraría cosas que los jugadores dejaron.
- **Exploración de todo el mapa en un teléfono emulado (CPU ×4):** la caché de bloques tiene tope (133), pero la memoria de JavaScript sube de ≈ 55 a ≈ 110–140 MB al descubrir sitios. Sin fuga grave.
- El **panel `/admin` en blanco** que me contaste antes sigue sin reproducirse aquí: si vuelve a pasar, necesito la dirección con la que lo abres y las líneas `[admin] acceso denegado…` de `datos\servidor.log`.
- `versionCode 143`, `versionName 14.6`.
