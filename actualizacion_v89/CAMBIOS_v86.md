# Último Refugio — Actualización v86 (app 8.0, versionCode 72)

## 1. Final del helicóptero: ahora es un FINAL DURO
Antes: 150 s de señal, oleadas de 4–14 zombis y un tope que en la práctica casi nunca dejaba aparecer más
(el tope contaba TODOS los zombis del mapa, ~90 desde el inicio, así que en Casual las oleadas se omitían).

Ahora (la señal dura **180 s**, constante `SIEGE_T`):

| Fase | Tiempo | Qué pasa |
|---|---|---|
| 1/4 Aproximación | 0–45 s | Oleadas pequeñas desde 2 direcciones |
| 2/4 Asedio | 45–90 s | Más seguidas, 3 direcciones, corredores y arrastrados |
| 3/4 La marea | 90–135 s | Oleada masiva + tormenta; brutos y chillones; 5 direcciones |
| 4/4 Última resistencia | 135–180 s | Pico de intensidad, 3 brutos + 2 chillones, el helicóptero desciende, polvo de aspas, latido y pulso rojo |

- Cada oleada es mayor (3 → 19 zombis, ×dificultad) y más seguida (cada 10 s → cada 2,6 s).
- **«Última carga»** a los 12 s finales (+6 corredores desde muy cerca).
- Escala con la dificultad elegida (Fácil ×0,55 · Normal ×1 · Pesadilla ×1,5) y es ×0,75 en modo Casual.
- Suministros del helicóptero a los 54 s y a los 108 s (2.ª entrega con botiquín, molotov y adrenalina).
- En los últimos 30 s el artillero de Halcón-3 abre fuego de cobertura (máx. 2 disparos cada 1,1 s dentro de 11 casillas).
- La pantalla del final muestra «Asedio: X infectados abatidos en Y oleadas».
- **Confirmación antes de activar la señal** (resume salud, munición, lanzables, vendas, armas) y guardado automático.
- Logros nuevos: **Contra viento y marea** (resistir el asedio) y **Muro de plomo** (80 bajas en un solo asedio).
- HUD: barra de progreso con las 4 fases + infectados cercanos; anillo de la zona en el suelo; foco del helicóptero que barre.
- Vibración en cada cambio de fase y en la última carga.
- Ajustes rápidos: arriba de la capa v86 (`s86Interval`, `s86Size`, `s86Cap`, `s86Type`, `SIEGE_T`).
- El texto de la nota del piloto Barrera ahora dice «unos 180 segundos».

### Rendimiento del asedio
- El mapa de rutas (`bfs`) de la señal se calcula **una sola vez** y se reutiliza (antes: una vez por oleada).
- Los zombis nuevos entran en **cola** (3 por fotograma; 1 en calidad baja) para evitar tirones.
- El tope cuenta solo infectados cerca de la señal (radio 42); baja un 20 % si los FPS caen de 24, y en calidad baja se recortan cadáveres a 60.

## 2. Qué encontré al revisar el juego (mejoras)
**Medido (perfil de CPU, escena de horda nocturna con lluvia y 190 zombis, navegador sin GPU):**
- El JavaScript del juego es barato (`render` 1,4 %, `updZombie` 0,3 %). Casi todo el costo es rasterizado del lienzo.
- El único tirón real viene de `buildRoofGen` (generación de techos): hasta 346 ms al aparecer muchos edificios nuevos de golpe
  (teletransporte, auto a alta velocidad). Ya se hace por tandas (v85); queda margen para **precalentar los techos cercanos durante la pantalla de carga**.
- `getImageData` solo se usa al crear sprites (no por fotograma). OK.
- Los cadáveres ya están limitados a 140. Al morir un zombi se recorre `Z` con `filter` (asigna un arreglo); un contador sería más barato.
- Lado Android: aceleración por hardware, capa de hardware y vibración ya están bien configurados.

**Propuestas (no incluidas en v86, por riesgo/tiempo; dime cuáles quieres):**
1. *Gráficos:* sprite del helicóptero mucho más grande y detallado (hoy ~14 px) con rotor animado y haz cónico; escena corta de aterrizaje al terminar el asedio; halo/bloom en luces nocturnas.
2. *Jugabilidad:* **Modo Asedio rejugable** (oleadas infinitas con la misma tecnología + marcador); kit de barricadas rápidas para la fase de preparación; esquiva con cooldown; dificultad adaptativa conectada a las estadísticas de muerte de v85.
3. *Rendimiento:* precalentar techos en la carga, contador de cadáveres en vez de `filter`, culling de zombis fuera de pantalla en el dibujo y menos `makeNoise` con `bfs` (la señal hace dos por ciclo).
4. *Calidad de vida:* indicador en el borde de pantalla que apunta a la señal cuando te alejas; botón de «recargar todas las armas».

## 3. Cómo se probó
Partida completa simulada con navegador (reloj virtual, 180 s de juego): confirmación → 4 fases → pantalla del helicóptero → logros, tanto con 10 notas
(final con decisión) como con 5 (final clásico). Sin errores de JavaScript. Balance con un bot estático (el peor jugador posible):
Casual/Normal llega a la fase 4 antes de caer; Completo/Pesadilla cae hacia el segundo 56. **No se probó en un teléfono real**: conviene probar la APK en un
dispositivo modesto y ajustar `s86Size` / `s86Cap` si hace falta.
