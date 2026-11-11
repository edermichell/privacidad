# Último Refugio v14.4 — Fase 4: identidad de los distritos (mapa 960²)

Igual que las v14.2/14.3: **solo afecta a mundos de 960×960** (`"tamano": "colossal"` en el servidor). Los demás tamaños se generan idénticos a la v14.1 (hash de 6 mundos comparado).

## Qué cambia
- **Mar y muelles en el puerto.** En el borde del mapa junto al puerto hay mar (≈ 30 000–43 000 casillas de agua, de 3 bloques de fondo, con la costa irregular que entra hasta 11 casillas donde no hay edificios). Borde de cemento junto al agua y **7–21 muelles de madera** (3 de ancho, 26–42 casillas hacia el mar) con **2 cajas de botín reforzado al final** y un grupo de 2–3 zombis. Cada muelle se comprueba: solo se construye si su extremo de tierra conecta a pie con una calle.
- **Parques con estanque y puentes.** En el distrito Parques cada bloque de parque tiene un estanque con orilla de arena, juncos y **dos senderos que lo cruzan como puentes de madera** de 2 casillas (36 estanques por mundo).
- **Patios de carga** en los solares vacíos del distrito industrial y del puerto: filas de cajas con pasillos de 1 casilla, sobre suelo de cemento/tierra (≈ 3 500–4 500 cajas de botín tipo almacén por mundo, incluidos almacenes y muelles).
- **Suelo por distrito:** el Centro queda pavimentado (≈ 97 % de acera/cemento en lugar de césped, con árboles de calle sueltos); industrial y puerto, cemento y tierra. Parques, residencial y campo conservan el césped.
- **Botín alto en el Centro:** todos los contenedores de edificios del centro (≈ 2 400–3 000) dan una segunda tirada de botín con 55 % de probabilidad.
- `versionCode 141`, `versionName 14.4`.

## Pruebas (Chromium, una máquina)
- Mundos de otros tamaños: idénticos a la v14.1. Guardar y cargar un 960: terreno y plano idénticos. 0 errores de página.
- 4 semillas en 960: **todos** los muelles y puentes son alcanzables a pie desde el inicio y ≥ 99,7 % de las puertas de edificio también; ningún zombi de la generación nace en el agua. Se recorren a pie todos los callejones con la física real del jugador (los que quedan en la costa terminan en el mar, esperado).
- Render del juego: ≈ 2–3 ms por fotograma junto al mar, en el centro, en el estanque y en el campo (sin diferencia con la v14.3). Generación del mundo ≈ 1,2–1,6 s; 0,3–0,5 ms por paso.
- Servidor, 3 salas × 10 jugadores simulados: 30 pasos/s por sala, ≈ 0,8 Mbit/s por sala hacia los jugadores, ≈ 83 % de un núcleo y ≈ 2,5 GB de RAM en conjunto (mi equipo de 4 núcleos, no tu HP).
- Regresión (notas, partida de la 13.5, COOP 2 y 4, 4 días simulados) y suites del servidor (moderación, candados/robos, persistencia, movimiento): sin fallos nuevos (mismos dos falsos positivos conocidos: «botín repetido» y la comprobación de proxy que espera 404 y recibe 401).

## Límites (importante)
- **Sin arte nuevo:** los muelles, el agua, las cajas y los estanques usan los gráficos que ya tenía el juego. No hay grúas, contenedores de carga apilados, barcos, faros ni rascacielos; el centro sigue usando las plantillas de casas y tiendas (solo más densas y pavimentadas).
- **Sin ambiente propio por distrito** (música/sonido/niebla distintos): solo cambian el suelo, los objetos, el botín y la cantidad de zombis.
- El mar es una barrera: no se puede nadar ni cruzar. El mapa es más pequeño en superficie transitable (≈ 3–5 % menos).
- Los muelles dependen de la forma de la costa: en algunos mundos salen pocos (mínimo visto 7).
- Falta probar con personas y en un teléfono real; medido con jugadores simulados. Los 10 días hasta el mapa nuevo deben incluir pruebas en tu portátil (`PROBAR_CARGA.bat`).
