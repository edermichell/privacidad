# Último Refugio v14.3 — Fase 3: callejones y mini-rotondas (mapa 960²)

Igual que la v14.2: **solo afecta a mundos de 960×960** (`"tamano": "colossal"` en el servidor). Los demás tamaños se generan idénticos a la v14.1 (hash de 6 mundos comparado).

## Qué cambia
- **Callejones de servicio** en ~15 % de los bloques (≈ 230–260 por mundo; ≈ 7 400–8 700 casillas), más en el **centro** (85 % de los bloques) que en el barrio residencial (40 %), la zona industrial (50 %) y el puerto (45 %). Tipos:
  - **Pasaje o callejón pasante** vertical u horizontal, de **1 o 2 casillas** de ancho, de una calle a la siguiente.
  - **Cruz** de dos callejones que se cortan (centro y resto).
  - **Sin salida:** entra por una calle y termina en un fondo vallado con una **caja de botín reforzada**, un **contenedor** (si hay 2 de ancho) y un **grupo de 2–3 zombis** (emboscada).
  - Suelo de acera, **vallas a ambos lados** donde no hay edificio, y contenedores de basura (con botín) en algunos, siempre dejando paso libre. Los edificios del bloque respetan el hueco.
- **Mini-rotondas:** isla central en los cruces del centro (uno de cada dos) y en ~9 % de los del barrio residencial (≈ 110–125 por mundo).
- `versionCode 140`, `versionName 14.3`.

## Pruebas (Chromium, una máquina)
- 4 semillas en 960: se recorre con la **física real del jugador** (radio de colisión) cada callejón de 1 y de 2 casillas de punta a punta, y los sin salida llegan al fondo y se detienen; 0 callejones bloqueados; 0 objetos que estorben (solo contenedores/cajas de botín). Todas las bocas de callejón son alcanzables desde el inicio a pie.
- Mundos de otros tamaños: idénticos a la v14.1. Guardar y cargar un 960: terreno y plano idénticos. 0 errores de página.
- Coste: generación ~1,4–1,5 s; 0,46–0,77 ms por paso del juego; memoria JS 74–119 MB.
- Servidor, 3 salas × 10 jugadores simulados: 30 pasos/s por sala, ~0,8 Mbit/s hacia los jugadores por sala, ~89 % de un núcleo para los navegadores y ~2,5 GB de RAM en conjunto (mi equipo de 4 núcleos, no tu HP).
- Regresión (notas, partida de la 13.5, COOP 2 y 4, 4 días simulados) y suites del servidor (moderación, candados/robos, persistencia, movimiento): sin fallos nuevos (mismos dos falsos positivos conocidos).

## Límites (importante)
- **No hay avenidas ni calles estrechas ni anillo perimetral:** las calles siguen siendo la misma cuadrícula de 3 casillas; cambiarlas toca el trazado base (aceras, farolas, tráfico) y no lo hice para no arriesgar la estabilidad. La «rotonda» es una isla de 1 casilla en el cruce, no una glorieta amplia.
- **No hay patios con portones** (la valla de los callejones no tiene puerta): la valla se rompe o se bordea por los solares como las demás.
- Los callejones están hechos con las vallas, cajas y contenedores actuales (sin arte nuevo). Alrededor de un callejón el solar sigue siendo abierto (césped entre casas); en el centro, con casas pegadas, se nota más el «cañón».
- Cualquier coche parqueado/abandonado en la calle puede tapar la boca de un callejón: es aleatorio y se puede rodear.
- Falta probar en un teléfono real, con personas, y el IA de zombis dentro de callejones muy largos; medido con jugadores simulados.
