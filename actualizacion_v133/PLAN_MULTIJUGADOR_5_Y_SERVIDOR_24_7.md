# Plan: cooperativo de 5 jugadores (misma red) y servidor 24/7

Basado en el código real de la 13.2.4 (`NET`, líneas ~12113–12640 de `index.html`) y en mediciones hechas con la 13.3.
**Esto es un plan y no está implementado**: el cooperativo actual sigue siendo de 2 jugadores. No lo prometo "listo" porque tocar la red sin poder probarla con 5 dispositivos reales sería arriesgado.

## 1. Cómo funciona hoy (2 jugadores)
- Arquitectura **anfitrión autoritativo**: el anfitrión simula todo (zombis, civiles, coches, clima); el invitado descarga una copia del mundo y juega su personaje.
- Transporte: **WebRTC DataChannel** directo; para encontrarse usa `ntfy.sh` (servicio público de salas) con un código de 6 letras, o intercambio manual de códigos.
- El invitado manda su estado cada 66 ms; el anfitrión manda una instantánea cada 100 ms.
- **Un solo compañero está cableado en el código**: `NET.rp` (jugador remoto) aparece 87 veces, `NET.role === 'guest'` 59 veces, `own === 'g'` (dueño invitado de un NPC/perro) 15 veces, y hay un único campo de rutas `fieldR` para zombis que persiguen al compañero.

## 2. Mediciones (13.3, mundo grande, 100 zombis cerca, 218 civiles, 304 autos)
| Dato | Valor |
|---|---|
| Mundo al unirse (JSON → gzip) | 61 KB → **18 KB** |
| Primera instantánea (todo nuevo) | 37 KB |
| Instantánea con 100 zombis moviéndose | **3,3 KB** (≈ 32 KB/s a 10 Hz por invitado) |
| 4 invitados (5 jugadores) | ≈ 130 KB/s de subida del anfitrión (~1 Mbit/s) |
Conclusión: **el ancho de banda no es el problema** en Wi-Fi local. El límite será la **CPU del teléfono anfitrión** (simula todo + envía 4 instantáneas) y el código "de uno solo".

## 3. Fase A — 5 jugadores en la misma red (anfitrión en un teléfono/PC)
1. **Generalizar `NET.rp` → `NET.peers[]`** (hasta 4 invitados). Cada par con su `pc`, `ch`, estado, instantánea propia y `lastRx`. Mantener un alias `NET.rp` = "el par más cercano" mientras se migra, para no romper los 87 usos de golpe.
2. **Zombis y civiles eligen al jugador más cercano de N** (hoy `netTarget` compara solo 2) y `fieldR` pasa a una caché de rutas por jugador (limitada: p. ej. solo para los 2 jugadores con más perseguidores; el resto usa línea recta/`fieldP`).
3. **Instantáneas por interés**: ya se filtran a ±50 casillas del invitado; con 5 jugadores la lista de cada uno sale de su zona (coste ×4 en CPU del anfitrión → medir y, si hace falta, bajar a 7–8 Hz para jugadores lejanos).
4. **Dueño de NPC/perro**: `own === 'g'` → `own = id del par` (compañeros reclutados por cada jugador).
5. **Mundo compartido**: puertas/barricadas/contenedores/objetos ya se sincronizan por diferencias (`D`, `C`, `L`, `U`, `M`); hay que difundirlas a todos los pares (hoy van a uno).
6. **Interfaz**: lista de jugadores (nombres, color), chip "COOP ● 5 jugadores", expulsar/silenciar.
7. **Descubrimiento en red local sin internet**: WebRTC necesita un canal de señalización. Opciones: (a) mantener ntfy (necesita internet); (b) **pequeño servidor de señalización/relé en el propio anfitrión** (en Android: un `ServerSocket` en `MainActivity.java` expuesto al juego por `AndroidMonet`; en PC: el lanzador ya hecho en Go puede servirlo) con un código de sala o QR de la IP local. Recomendado: (b).
8. **Pruebas necesarias**: 5 instancias de navegador en una máquina con el intercambio manual de códigos (se puede automatizar), medir CPU del anfitrión con 4 invitados y 100+ zombis, y una prueba real con 5 teléfonos.

Esfuerzo estimado: **medio-alto** (la red es ~500 líneas, pero toca la IA de zombis, NPC, guardado y UI). Riesgo principal: regresiones en el cooperativo de 2 que hoy funciona.

## 4. Fase B — Servidor 24/7 (futuro)
Hoy el "servidor" es un teléfono. Para 24/7 hay dos caminos:
- **B1 (recomendado, menos riesgo): anfitrión headless.** Ejecutar el **mismo `index.html`** como anfitrión en un Chromium sin pantalla (Playwright) en un VPS/Raspberry Pi, y que los jugadores entren por **WebSocket** a través de un relé (en lugar de WebRTC, que en servidores es frágil con NAT). Ventaja: cero reescritura de la simulación; el mundo es el mismo código que ya probamos. Costes: una CPU decente (el anfitrión simula todo), reinicio automático, guardado periódico a disco, y una capa `NET` con transporte intercambiable (WebRTC ⇄ WebSocket).
- **B2 (largo plazo): simulación en Node.js sin navegador.** Reescribir/extraer el motor de simulación (zombis, NPC, mundo) fuera del DOM: es un proyecto grande (el código mezcla lógica y dibujo en ~23 000 líneas).
Necesidades comunes: persistencia del mundo, cuentas/identificadores de jugador (para recuperar personaje; hoy `UR_GUEST` guarda el personaje por semilla), anti-trampas básico (el anfitrión ya es autoritativo: validar daño y objetos), moderación, y **política de privacidad** actualizada (nombres, IP del servidor).

## 5. Orden recomendado
1. Abstraer el transporte (`netSend`/`ch.onmessage`) para poder usar WebRTC o WebSocket → base de B1 y de la señalización local.
2. `NET.peers[]` con **3 jugadores** (el salto 2→3 destapa casi todos los problemas); después 5.
3. Servidor de señalización local (Android/PC) y QR.
4. Anfitrión headless 24/7 con reinicio y guardado.
Cada paso con pruebas automáticas (2 y 5 navegadores) antes de tocar el siguiente.
