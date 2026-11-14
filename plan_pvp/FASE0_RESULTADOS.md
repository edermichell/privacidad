# PvP — Fase 0: comprobaciones técnicas (resultados)

*Sin cambios al juego ni al servidor. Todo medido contra el servidor de pruebas de esta sesión (cliente y servidor en la misma máquina, 2 invitados, mundo de 360×360).*

Decisiones confirmadas por el dueño: **todas las recomendadas** (sala PvP aparte; mapa 480 con 10–16 jugadores; al morir se pierde la mochila y se conservan las habilidades; fuego amistoso activo entre aliados; alianzas de hasta 4; señales rápidas sin chat libre; bases protegidas con todos los dueños desconectados; temporada de 14 días).

## Resultados
| # | Pregunta | Resultado | Qué significa |
|---|---|---|---|
| E1 | ¿Los invitados reciben misiones? | **No.** Para un invitado `m76On()` es falso. En el anfitrión del servidor las misiones sí funcionan, pero para su jugador aparcado, que nadie ve (forzando la oferta se crea la tarjeta). | Las misiones de grupo son un sistema **nuevo** en el anfitrión; no se puede «activar» el existente. |
| E2 | ¿Con qué frecuencia llegan las posiciones? | Invitado → anfitrión: **27,5 paquetes/s**. Anfitrión → invitados (posiciones de los demás, dentro del snapshot): **7 por segundo**. Retardo de lo que ve un invitado de otro, medido en la misma máquina: **mediana 38 ms, p90 80 ms, máx 101 ms**. | Al anfitrión le llega información de sobra para validar golpes. Los **7/s son pocos para PvP**: en salas PvP hay que mandar las posiciones de los jugadores cercanos a ~15–20/s con un mensaje ligero. Con red real se suman 50–150 ms: el historial de posiciones para validar debe cubrir ~0,5 s. |
| E3 | ¿Se puede mandar daño falso? | **Sí.** Un invitado mató con `HZ` y daño 99 999 a un zombi a **209 y a 234 casillas** de todos los jugadores. El anfitrión no comprueba alcance, arma ni cadencia. | Confirma el riesgo. Es una trampa que **ya existe en las salas actuales** (PvE). |
| E4 | ¿Qué pasa al morir un invitado? | En modo casual no muere (el «segundo aliento» lo impide). Sin él: el anfitrión lo ve muerto, pero `UR_GUEST` (el personaje guardado en el teléfono) **no se borra** y al volver a entrar el personaje reaparece vivo con la mochila anterior. | La muerte es **gratis**. Para PvP: personaje en el servidor + sala PvP en modo completo (sin segundo aliento). |
| E5 | ¿Se puede editar la mochila en el teléfono? | **Sí.** Editando `UR_GUEST` antes de cargar: entró con 5 escopetas y 999 balas sin que nadie lo notara. | Confirma que la mochila no puede vivir en el teléfono en una sala PvP. |
| E6 | ¿Qué sabe el anfitrión de la vida de los invitados? | Guarda `hp`, `hurt` y `dead` de cada uno, **pero son lo que el invitado le cuenta**. | Hay que invertir la autoridad: en salas PvP el anfitrión decide la vida y el invitado solo la muestra. |

Limitaciones: la latencia es de bucle local (sin red real) y el retardo medido incluye el muestreo de la prueba; 2 invitados, no 10; mundo de 360 en vez de 480.

## Ajustes al plan
1. **Hay un trabajo previo que mejora también las salas actuales**, y no depende del PvP: validar en el anfitrión el daño que mandan los invitados (alcance, arma, cadencia, daño según la tabla de armas) y guardar el personaje del invitado en el servidor. Cierra E3/E4/E5 para todos. Propongo hacerlo primero como la **v15.0 «autoridad del servidor»** (sin PvP todavía): se prueba con el cooperativo y las salas oficiales, y es la parte más arriesgada del plan.
2. La sala PvP necesita `modo: "full"` (sin segundo aliento); hay que revisar que ese modo se siente bien con zombis + jugadores.
3. Mensaje rápido de posiciones (15–20/s) para jugadores cercanos en salas PvP.
4. Misiones de grupo: nuevo sistema del anfitrión, con el ritmo de la v14.7 (una por día y por grupo).

## Siguiente paso propuesto
**Fase 1a (v15.0): autoridad del servidor, sin PvP.** 1) El anfitrión valida y recalcula el daño que envían los invitados (zombis y NPC). 2) Personaje del invitado guardado en el servidor por `uid` (inventario, habilidades, estado) y cargado desde ahí al entrar; el teléfono ya no es fuente de verdad. 3) En modo completo, morir borra el personaje en el servidor. 4) Pruebas de «cliente tramposo» (daño falso, mochila inventada, rollback tras morir) que ahora deben fallar, y regresión completa del cooperativo y de las salas.
Después, **Fase 1b:** atributo `pvp` de sala, etiqueta y aviso, vida con autoridad del servidor.
