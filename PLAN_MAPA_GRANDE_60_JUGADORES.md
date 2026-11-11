# Plan: mapa grande, diverso y con callejones — objetivo ~60 jugadores

Es un **plan**, no está implementado. Los números salen de mediciones reales del motor actual (Chromium de escritorio) y de las pruebas de 10 jugadores; lo marcado como *estimación* no está medido.

## 1. Punto de partida (medido)
| Mundo | Casillas | Edificios | Autos | Contenedores | Generar | Guardado (gz) | ms por paso |
|---|---|---|---|---|---|---|---|
| Chico 168² | 28 k | 101 | 72 | 594 | 0,7 s | 6 KB | 0,5 |
| Grande 264² | 70 k | 163 | 164 | 1 041 | 0,7 s | 12 KB | 0,7 |
| Enorme 360² | 130 k | 268 | 312 | 1 767 | 0,7 s | 18 KB | 0,8 |
| Épico 480² | 230 k | 586 | 570 | 3 563 | 1,0 s | 27 KB | 0,7 |

- **El mundo en sí escala bien**: la población (zombis, civiles) es local al jugador, así que el coste por paso casi no crece con el tamaño. Un mundo de 960² costaría ~4× en generación y memoria de mapa (*estimación*: unos 4 s y decenas de MB): factible.
- **El techo no es el mapa, son los jugadores.** Con 10 jugadores y ~50–70 zombis el anfitrión gasta ≈ 45 % de un núcleo (a 30 pasos/s, sin dibujar). El anfitrión es **un solo hilo de JavaScript**: *estimación* ≈ 20–25 jugadores por sala antes de saturar ese hilo; 60 en una sola sala **no caben** con la arquitectura actual.
- **Puntos que se rompen al crecer** (vistos en el código):
  1. Cada jugador remoto tiene dos mapas de rutas del tamaño de **todo el mundo** (`Uint16Array(W·H)` ×2). En 480² son ~0,9 MB por jugador; en 960² con 60 jugadores serían ~440 MB.
  2. Cada instantánea de red lleva a los demás jugadores: coste **cuadrático** con el número de jugadores, y en JSON (no binario).
  3. Las calles son una **cuadrícula rígida** (una carretera cada 24 casillas): no hay callejones ni variedad de trazado.
  4. El guardado y el envío del mundo al entrar son completos (hoy pequeños, crecerán con el mapa y con lo construido).

## 2. Qué significa «60 jugadores»: tres caminos
| Opción | Qué es | Pros | Contras |
|---|---|---|---|
| **A. 3–4 salas grandes** (60 en total) | Varias salas de 15–20 jugadores, cada una un mundo grande | Muy cercano a lo que ya existe; usa varios núcleos (un navegador por sala); riesgo bajo | No es un único mundo compartido de 60 |
| **B. Una sala de 60 con simulación en Node** | Sacar la simulación del navegador a un servidor sin interfaz | Un solo mundo de 60; mejor rendimiento | Reescritura grande del motor (la lógica está mezclada con el dibujo, ~23 000 líneas); meses |
| **C. Mundo único dividido en zonas** | Varios anfitriones, cada uno dueño de una región, con traspasos en las fronteras | Un mundo compartido sin reescribir todo | Muy complejo (entidades que cruzan fronteras, coches, hordas, guardado coherente) |

**Recomendación:** empezar por **A** (mapa grande + salas de ~20 con las técnicas de la sección 4) y decidir B solo si el juego demuestra demanda real. C no lo recomiendo.

## 3. Mapa: más grande, diverso y con callejones
**Tamaño.** Añadir tamaños 720² y 960² (generación por regiones, sin tocar los existentes). Primero los arreglos de memoria de la sección 4.

**Callejones y trazado** (generador de manzanas nuevo, por distrito):
- Dentro de cada manzana: **callejones de servicio** de 1–2 casillas entre edificios, **pasajes cubiertos**, patios interiores con vallas y portones, callejones sin salida, escaleras de incendios.
- Calles que no sean todas rectas: **avenidas anchas**, calles estrechas, diagonales y rotondas ocasionales, un **anillo/autopista** perimetral.
- Los zombis y civiles ya navegan por la «transitabilidad» de cada casilla, así que los callejones funcionan con su IA actual; hay que vigilar que no se atasquen en dead-ends (cuadrícula de pruebas).

**Diversidad por distritos** (cada uno con su suelo, edificios, botín y música/ambiente):
centro denso (muchos callejones, botín alto, muchos zombis), residencial, industrial/almacenes, puerto o vías de tren, rural/granjas, parque/lago con puentes, zona militar (ya existe), hospital/campus, barrio abandonado/en ruinas. Más puntos de interés (como los campamentos de la 13.5) repartidos por tipo de distrito.

**Arte:** todo lo estático sigue **dibujándose una vez por bloque y guardándose** (como en la 13.5), así que más variedad visual no cuesta fotogramas.

## 4. Técnicas de rendimiento (por orden de rentabilidad)
1. **Mapas de rutas por zona, no por jugador y no del tamaño del mundo**: ventanas de ~64×64 compartidas por los jugadores cercanos. Quita cientos de MB y CPU.
2. **Gestión de interés**: cada jugador recibe solo lo que está en su radio (cuadrícula espacial). Baja el coste cuadrático a casi lineal.
3. **Nivel de detalle en el tiempo**: cerca 20–30 Hz, lejos 5 Hz, muy lejos 1 Hz o dormido. Los zombis fuera del radio de cualquier jugador no se simulan (se «materializan» al acercarse, con densidad por distrito).
4. **Red binaria y diferencial**: posiciones cuantizadas en bytes en vez de JSON; envío por prioridad con presupuesto por jugador.
5. **Generación por regiones y en segundo plano** (Web Worker) para mapas grandes; guardado **incremental** (solo lo cambiado) y mundo enviado al entrar por zonas.
6. **Límites dinámicos**: tope de zombis por jugador y global, hordas escaladas al número de jugadores en la zona.
7. **Un navegador (proceso) por sala** para aprovechar varios núcleos; **servidor aparte (VPS)** en vez del PC de casa cuando haya muchos jugadores (subida de internet: ~30–60 KB/s por jugador; 60 jugadores ≈ 15 Mbit/s sin gestión de interés, bastante menos con ella — *estimación*).
8. **Pruebas con bots**: simulador de N jugadores por WebSocket para medir de verdad (CPU, red, memoria) antes de prometer una cifra.

## 5. Fases propuestas (esfuerzo orientativo)
| Fase | Qué | Esfuerzo (*estimación*) |
|---|---|---|
| 0 | Banco de bots + métricas: medir 10/20/30 jugadores y dónde se va la CPU | 2–4 días |
| 1 | Arreglos de escala: rutas por zona, interés, red binaria básica | 1–2 semanas |
| 2 | Tamaños 720²/960² + generación por regiones | 3–5 días |
| 3 | Generador de manzanas: callejones, pasajes, patios | 1–2 semanas |
| 4 | Distritos y puntos de interés nuevos (arte, botín, ambiente) | 2–3 semanas (el arte manda) |
| 5 | Salas de ~20 en servidor propio/VPS + pruebas reales con teléfonos | 1 semana + pruebas |
| 6 | Decidir B (simulación en Node) según resultados | proyecto grande, aparte |

## 6. Riesgos y límites
- Sin medir en teléfonos reales no hay garantía de fluidez: el mundo grande también pesa en el dispositivo (memoria de bloques en caché, ahora ~70 MB).
- Más callejones = más lugares donde atascarse y emboscadas: hace falta balance y pruebas de IA.
- Las partidas guardadas actuales no tendrán callejones (mundos nuevos únicamente, o migración opcional).
- 60 jugadores en **una** sala solo con la opción B. Con A son 60 repartidos en varias salas.

## 7. Decisiones que necesito de ti
1. ¿60 jugadores **en un mismo mundo** (B, caro) o **repartidos en salas** (A, recomendado)?
2. ¿Dónde correrá: PC de casa o un **VPS**? (con 60 jugadores el PC de casa no basta)
3. ¿Qué tamaño máximo de mapa quieres: 720² o 960²?
4. ¿Qué distritos te importan más? (centro con callejones, industrial, puerto, rural…)
5. ¿Los mundos nuevos grandes conviven con los actuales (modo «ÉPICO» ya existe) o los sustituyen?
