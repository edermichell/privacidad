# Último Refugio — Actualización v92 (app 8.6, versionCode 78): segunda ronda de optimización
Incluye todo lo de v86–v91. Continúa el trabajo de la v91 (ver `CAMBIOS_v91.md` para las causas ya corregidas).

## Resultado acumulado (FPS en un celular emulado con CPU ×4; mayor = mejor)
| Escena | v90 (antes de optimizar) | v91 | **v92** | Mejora total |
|---|---|---|---|---|
| Calle de día | 22,6 | 39,6 | **42,8** | **+89 %** |
| Caminando por la ciudad | 32,7 | 52,3 | **57,6** | **+76 %** |
| Noche con lluvia | 23,8 | 28,9 | **32,4** | +36 % |
| Horda de 60 zombis | 14,6 | 17,5 | **21,9** | **+50 %** (fotogramas >33 ms: 64 → 6) |
| Horda de 100 zombis | 14,1 | 15,9 | **18,9** | +34 % (>33 ms: 59 → 14) |
| Interior | 33,9 | 38,5 | **40,2** | +19 % |
| Mapa abierto | 32,9 | 34,3 | **41,1** | +25 % (0 tirones) |

Tiempo de JavaScript por fotograma en una horda de 60: 35,6 ms → 17,8 ms.

## Qué se hizo en esta ronda
Se volvió a medir *dentro* de la horda (separando aciertos de caché, reutilización de cuadros vecinos y creación de sprites): los aciertos de la caché cuestan solo 3 µs; **lo caro era crear sprites nuevos** (1,4 por fotograma ≈ 3,5 ms) y la lógica de cientos de personajes lejanos.

1. **Animación adaptativa a la multitud.** Con ≥16 zombis a <12 casillas se animan con 8 cuadros en vez de 16 (con ≥40, los lejanos usan 4). Sprites creados por fotograma: **1,43 → 0,67**.
2. **IA lejana a mitad de ritmo.** Los NPC a >28 casillas y los zombis a >24 que *no te persiguen* se actualizan un fotograma sí y otro no (con el tiempo acumulado, así se mueven igual). Siempre a ritmo completo: compañeros, NPC en diálogo/persecución/pelea/huida, zombis que te persiguen, jefes y aturdidos. Se desactiva en Coop.
3. **Ojos brillantes de noche más baratos:** sin `save/restore` por zombi (≈480 llamadas de dibujo menos por fotograma en una horda nocturna).

## Pruebas
Regresión completa sin fallos ni errores de JavaScript: correctitud v91, techos, funciones v90, mapa, NPC, Modo Asedio con blindaje de guardado y el **final de 180 s del helicóptero** de principio a fin.

## Límites
- Las mediciones son de un emulador sin GPU: los FPS absolutos cambian en un teléfono real; lo fiable es la comparación.
- Las hordas siguen siendo lo más pesado. Si en tu teléfono bajan de 30 FPS, el siguiente paso sería limitar cuántos zombis se dibujan a la vez; para eso necesito el modelo y una medición con «Mostrar FPS» (Ajustes › Gráficos).
- Pendiente: el suelo se dibuja dos veces por bloque cuando llueve (capa de charcos); no lo toqué porque en GPU es barato y requiere más memoria.
