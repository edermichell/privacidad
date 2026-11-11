# Último Refugio v14.2 — Fase 2: mapa 960² por regiones (distritos)

Solo afecta a mundos de **960×960** (`"tamano": "colossal"` en el servidor). Los mundos de los demás tamaños se generan **idénticos** a la v14.1 (comprobado con el hash de 6 mundos de tipos y tamaños distintos).

## Qué cambia
- **Plano de distritos por regiones.** El mapa 960 (39×39 bloques de 24 casillas) se reparte con la semilla en: **Centro** (denso, casi sin solares vacíos, muchas tiendas, hospital, comisarías, iglesias, escuela, gasolineras; más zombis, casi sin árboles), **Zona industrial** (almacenes y talleres con patios vacíos), **Puerto** (almacenes y talleres en la franja de la costa), **Parques** (bloques de parque agrupados 3×3), **Barrio residencial** (casas con servicios repartidos y separados entre sí) y **Campo** (bosques, granjas, cabañas, cementerios, lagos, pantanos y la base militar, alrededor del mapa). La posición del centro/puerto/industrial gira con la semilla, así que cada mundo tiene su propia distribución. Tu casa de inicio queda en el barrio residencial del centro del mapa.
- **Aviso al cruzar de distrito:** «Entras a: Centro / Puerto / …».
- Más edificios y variedad que el 960 de la v14.1 (≈3 000 edificios, 3 hospitales, 7 comisarías, 35 gasolineras, ~115 almacenes, ~1 260 autos de calle, base militar en el campo).
- Generación ~1,1–1,6 s (6 semillas). Guardado igual que antes: el plano se reconstruye de la semilla; tras guardar/cargar es idéntico.
- `versionCode 139`, `versionName 14.2`.

## Pruebas (Chromium, una máquina)
- 6 mundos clásicos/ciudad/región/pueblo/rural de 168–360: **idénticos** a la v14.1.
- 6 semillas en 960: siempre base militar, centro, industrial, puerto, parques y campo presentes; 0 errores.
- Guardar y cargar un 960: plano y terreno idénticos; un contenedor en una casilla alta conserva su contenido.
- Coste: 0,45–0,72 ms por paso del juego en cada distrito (antes 0,5); memoria JS 65–120 MB.
- Servidor, 3 salas × 10 jugadores simulados en el mundo nuevo: **30 pasos/s en cada sala**, ~0,8 Mbit/s hacia los jugadores por sala, ~83 % de un núcleo para los 3 navegadores en conjunto y ~2,5 GB de RAM (cifras de mi equipo de 4 núcleos, no de tu HP).
- Regresión (notas, partida de la 13.5, COOP 2 y 4, 4 días simulados) y suites del servidor (moderación, candados/robos, persistencia, movimiento): sin fallos nuevos (mismo falso positivo conocido de «botín repetido» y la comprobación de proxy que espera 404 y recibe 401 por `claveAdmin` de la prueba).

## Límites (importante)
- **Todavía todo es la misma cuadrícula de calles y las mismas plantillas de edificios**: los distritos se distinguen por qué hay y cuánto, no por su arte. Callejones (Fase 3), arte, suelo y ambiente propios por distrito, y el mar del puerto con muelles (Fase 4) siguen pendientes. El «puerto» hoy es una zona de almacenes sin agua.
- El mapa 960 sigue sin poder elegirse en el menú del juego: solo lo activa el servidor.
- Medido con jugadores simulados, no con personas ni en tu portátil. Corre `PROBAR_CARGA.bat` y avísame.
- Tu servidor actual con su mundo guardado no cambia.
