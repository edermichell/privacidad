# Plan v2: mapa 960², diverso y con callejones — 3 salas oficiales de 20 jugadores

Es un **plan con una primera medición real (Fase 0 hecha)**; el mapa nuevo aún no está implementado. Lo marcado como *estimación* no está medido.

## Decisiones tomadas
1. **60 jugadores repartidos**: 3 salas oficiales × 20.
2. **Servidor: PC de casa.**
3. **Tamaño del mapa: 960 × 960.**
4. **Distritos:** centro denso, industrial, puerto, parques y más.
5. **Los mundos nuevos sustituyen a los actuales** (supuesto mío: las partidas ya guardadas se siguen pudiendo cargar; las salas oficiales y las partidas nuevas usan el mundo nuevo).

## Fase 0 — Resultados medidos (simulador de jugadores por WebSocket)
Herramienta: `herramientas_pruebas/bots_carga.js` (jugadores simulados que entran por el servidor real, caminan al azar y envían su posición). Entorno: contenedor Linux de **4 núcleos**, mundo 360², Chromium; jugadores **simulados** (caminan, no disparan, no construyen).

| Prueba | CPU del anfitrión (navegador) | Pasos/s | Bajada por jugador | Subida total del servidor |
|---|---|---|---|---|
| 1 sala × 10 jugadores | 32 % de un núcleo | 27→30* | 16 KB/s | 1,3 Mbit/s |
| 1 sala × 20 jugadores | 48 % | 29,8 | 20–30 KB/s | 3,3–5,0 Mbit/s |
| 1 sala × 30 jugadores | 61 % | 21,6 | 34 KB/s | 8,3 Mbit/s |
| 1 sala × 40 jugadores | 66 % | 21,2 | 42 KB/s | 13,9 Mbit/s |
| **3 salas × 20 jugadores a la vez (el objetivo)** | **129 % de un núcleo en total** (+16 % del relé) | **30 en cada sala** | **21–22 KB/s** | **10,7 Mbit/s** |

\* Se corrigió el bucle del anfitrión (descontaba mal el tiempo de trabajo: iba a 24–27 pasos/s con la misma carga).
Memoria: ≈ 2,2 GB entre las 3 salas. **El objetivo (3 × 20) funciona hoy en el laboratorio** y deja holgura de CPU en 4 núcleos.

**Lo que esto NO demuestra:** los bots no luchan, no disparan, no construyen ni abren cajas; los zombis activos eran pocos (20–70 por sala). El juego real cuesta más. Y el PC de casa tiene que dar **~11 Mbit/s de SUBIDA sostenidos** (haz un test de velocidad y mira la *subida*, no la bajada) más margen. La bajada por jugador crece con el número de jugadores (cada actualización lleva a los demás): por eso la gestión de interés (abajo) es prioritaria.

## Qué se rompe al pasar a 960² (visto en el código)
- Cada jugador remoto reserva **2 mapas de rutas del tamaño de todo el mundo** (`Uint16Array(W·H)`): a 960² son 3,7 MB por jugador ×2 → **~150 MB por sala (20 jugadores), ~450 MB entre las 3 salas** (*estimación*) solo en eso. Se cambia por ventanas locales compartidas.
- Las calles son una cuadrícula rígida (cada 24 casillas): sin callejones ni variedad.
- Generación, guardado y envío de mundo al entrar: hoy 1 s / 27 KB a 480²; a 960² ≈ 4 s y ≈ 100 KB (*estimación*), aceptable, pero la generación pasará a ser por regiones.

## Plan de trabajo (orden recomendado)
| Fase | Qué | Esfuerzo (*estimación*) |
|---|---|---|
| 1 | **Escala del anfitrión:** rutas por zona (ventanas compartidas), **gestión de interés** (cada jugador recibe solo lo cercano), snapshots **binarios/diferenciales**, límites de zombis. Meta: bajar a ≤ 8 KB/s por jugador (≈ 4 Mbit/s en total para 60) y bajar el coste cuadrático de CPU | 1–2 semanas |
| 2 | **Tamaño 960²** (generación por regiones, sin romper los tamaños actuales) | 3–5 días |
| 3 | **Generador de manzanas con callejones:** callejones de servicio de 1–2 casillas, pasajes, patios con vallas y portones, dead-ends; calles estrechas, avenidas, rotondas y un anillo perimetral | 1–2 semanas |
| 4 | **Distritos** con suelo, edificios, botín y ambiente propios: **centro denso** (callejones, botín alto, muchos zombis), **industrial** (almacenes, patios, contenedores), **puerto** (muelles, grúas, contenedores apilados, almacenes), **parques** (arbolado, lagos, puentes), y además: residencial, rural/granjas, zona militar, hospital/campus, barrio en ruinas. Más puntos de interés por distrito | 2–4 semanas (el arte manda) |
| 5 | **3 salas oficiales** en `config.json` con el mundo nuevo (`salasActivasMax: 3`, 20 jugadores cada una; sustituyen a Refugio 1/2) | 2–3 días |
| 6 | **Pruebas reales:** bots con comportamiento más duro (pelea, construcción, hordas), tu PC de casa, teléfonos reales y test de subida de internet | 1 semana + pruebas |

Técnicas que se aplican en las fases (resumen): arte estático dibujado una vez por bloque (sin coste por fotograma, como en la 13.5) · zombis fuera del radio de cualquier jugador no se simulan (se materializan al acercarse) · simulación a menos frecuencia con la distancia · generación en segundo plano y guardado incremental · un navegador por sala (aprovecha varios núcleos) · el relé (Node) ya es ligero (16 % de un núcleo para 60 jugadores).

## Riesgos y límites
- **Subida de internet** del PC de casa: es el primer cuello (≈ 11 Mbit/s hoy para 60; la Fase 1 debe bajarlo).
- **CPU/RAM de tu PC** (portátil HP): no conozco sus especificaciones; lo medimos en la Fase 6 y, si no alcanza, 2 salas oficiales o un VPS.
- Más callejones = más sitios donde se atascan zombis/civiles y más emboscadas: hace falta balance y pruebas de IA.
- Un mundo 960² en el teléfono pesa más (memoria de bloques en caché): probar en gama baja.
- Las partidas viejas no tendrán callejones ni distritos.

## Tu PC y tu internet (datos recibidos)
- **HP Laptop 14-ep0xxx**: Intel Core **i3-N305** (8 núcleos de bajo consumo, 1,8 GHz base), **8 GB de RAM** (7,66 utilizables), Windows 11.
- **Internet: 208 Mbps de subida** → el ancho de banda **ya no es un problema** (necesitamos ~11 Mbit/s para 60 jugadores). Se reduce la prioridad de la gestión de interés/snapshots binarios.
- **Lo que preocupa ahora es la CPU y la RAM del portátil:** cada sala corre en un solo hilo y ese procesador es más lento por núcleo que el de mi laboratorio (*estimación*: entre 0,5× y 0,8×), y las 3 salas usaban ~2,2 GB (con 960² será más) sobre 7,66 GB, con Windows y Edge aparte. **No lo sabremos hasta medirlo en ese portátil**: `PROBAR_CARGA.bat` (en el kit) lo hace en ~3 minutos.

## Calendario: seguir con el servidor actual y lanzar el mapa nuevo en ~10 días
Es una buena idea: el servidor y el mapa actuales siguen funcionando mientras se desarrolla. Pero el plan completo (Fases 1–6) son **6–10 semanas**; en 10 días cabe una **primera entrega acotada**:
- **Entrega 1 (10 días, ambiciosa):** mapa 960² + arreglo de memoria (mapas de rutas por zona) + callejones **básicos** + **4 distritos** (centro denso, industrial, puerto, parques) construidos con las plantillas de edificios y el arte actuales (variando disposición, densidad, suelo y botín), salas oficiales con el mundo nuevo y el tope de jugadores que resulte de la medición. Sin arte nuevo ni rediseño de red.
- **Entrega 2 (después):** más distritos, arte propio por distrito, gestión de interés/red binaria si hace falta, y más callejones/variedad.
Riesgo: 10 días es justo; si algo se atrasa, recortamos distritos antes que estabilidad. La APK nueva también debe pasar por Play Console (revisión) antes de la fecha.

## Qué necesito de ti para empezar la Fase 1
- ✔ Especificaciones y velocidad (recibidas).
- Resultado de **`PROBAR_CARGA.bat`** en el portátil servidor (con el mapa actual).
- Confirmar el **supuesto 5** (partidas guardadas viejas siguen cargando).
