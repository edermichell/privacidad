# Plan — Servidor PvP estilo DayZ con alianzas y traición

*Solo plan: no se ha tocado el juego ni el servidor. Basado en una revisión del código de la v14.9.*

## 1. Idea en una frase
Una sala de supervivencia donde **otros jugadores son la amenaza principal** (además de los zombis): matar a alguien te deja su equipo, morir te quita lo que llevas, y puedes **aliarte** para hacer misiones de grupo… sabiendo que **un aliado puede traicionarte**, con consecuencias para el traidor.

## 2. Qué existe hoy y qué falta (hallazgos del código)
| Tema | Hoy | Consecuencia para el PvP |
|---|---|---|
| Daño entre jugadores | **No existe.** Los golpes y disparos solo afectan a zombis y NPC. | Hay que construir toda la lógica de combate jugador contra jugador. |
| Autoridad | El anfitrión (navegador oculto del servidor) manda sobre zombis, NPC, mapa y contenedores. **Cada jugador manda sobre su propia vida y su mochila.** | En PvP eso permite trampas: ignorar daño, inventarse objetos. Hay que mover la vida y la mochila a autoridad del servidor. |
| Daño a zombis | El invitado envía `HZ` con el daño y el anfitrión **se fía del número**. | Se corrige también: el anfitrión debe calcular el daño según el arma. |
| Personaje del invitado | Se guarda **en el teléfono** (`UR_GUEST` en localStorage). Al morir no se borra: al volver se carga el último guardado en vida. | La muerte sería gratis (se recarga y listo) y la mochila editable. Para DayZ el personaje debe vivir **en el servidor**. |
| Identidad | Ya hay `uid` + token por jugador y lista de baneos/reportes por sala. | Buena base: el personaje se asocia a ese `uid`. |
| Misiones | M76, SOS, entregas, suministros corren para el jugador local del anfitrión; a los invitados **no les llegan** (hay `NET.role === 'guest'` que las corta). Por confirmar: en las salas del servidor el «jugador» del anfitrión está aparcado. | Las misiones de grupo requieren un sistema nuevo en el anfitrión, por grupo. |
| Candados, cofres y robos | Ya existen (v13.9). | Se reutilizan como base de las bases y de la traición. |
| Reputación | Existe `npcRepChange` para NPC. | Se reutiliza como «karma» del asesino. |
| Chat / emotes | No hay. | Mejor: señales rápidas predefinidas (sin moderar texto libre). |
| Puntería | Sin autoapuntado. | Bien para PvP; hay que revisar los controles táctiles para disparar a jugadores. |
| Zombis y días | La infección avanza por días (≈ 14 000 zombis hacia el día 10 en el mapa 960). | Encaja con un **ciclo de temporada**: reiniciar el mundo cada ~14 días. |
| Moderación | Reportar, expulsar, banear por sala, panel de administración. | Se amplía (baneo global, registro de muertes). |

## 3. Decisiones de diseño (recomendación en negrita)
1. **¿Cambiar las 3 salas oficiales a PvP?** **No: añadir una sala PvP aparte** (o dos), y dejar las 3 como están. Quien viene a jugar tranquilo no se va, y el PvP se prueba sin riesgo. Las salas de jugadores podrán activar PvP como opción más adelante.
2. **Mapa de la sala PvP:** **480×480 («vast») con 10–16 jugadores.** En 960 con 10 jugadores casi nunca se encuentran (≈ 92 000 casillas por jugador); en 480 son ≈ 23 000 y gasta menos RAM.
3. **Muerte:** **pierdes la mochila y el equipo (se quedan en tu cuerpo, saqueable ~10 min) y reapareces en la costa con kit mínimo; conservas tus habilidades.** Alternativas: perder todo (más DayZ, más duro) o conservar la ropa.
4. **Fuego amistoso entre aliados:** **activado**, para que la traición sea posible (ver sección 5).
5. **Tamaño de alianza:** **hasta 4.**
6. **Comunicación:** **señales rápidas** («alto», «ayuda», «aquí hay botín», «peligro»), sin chat libre.
7. **Bases:** **protección de bases con todos los dueños desconectados** al principio (si no, perder la base mientras duermes expulsa a la gente); se puede endurecer después.
8. **Temporada:** **mundo nuevo cada 14 días**, con aviso y un historial de «quién fue el más temido».

## 4. PvP: cómo funciona
- **Vida y daño con autoridad del servidor:** el anfitrión lleva la vida de cada jugador en las salas PvP. El cliente solo *pide* «golpeé a X con el arma W»; el anfitrión valida alcance, línea de visión (rejilla del mapa), tiempo de recarga, munición y arma equipada, y aplica el daño él mismo. Se corrige a la vez la confianza actual en `HZ`.
- **Tolerancia a la latencia:** el anfitrión guarda ~0,5 s de historial de posiciones de cada jugador para comprobar los golpes (la ruta por el servidor añade 50–150 ms).
- **Heridas:** se reutiliza el sistema de heridas/sangrado/fracturas existente para balas y golpes.
- **Muerte:** el cuerpo queda en el mapa con el inventario (usa los objetos sueltos existentes, que ya tienen tope); el servidor borra o resetea el personaje del `uid`; pantalla «Te mató X» con el lugar de tu cuerpo.
- **Desconexión en combate:** el personaje queda como cuerpo dormido unos 30–60 s (anti «salirse para escapar»).
- **Zonas seguras:** campamento de comerciantes y punto de aparición, sin daño entre jugadores (el PvP está desactivado ahí).
- **Aparición:** costa aleatoria, lejos de otros jugadores; 20 s de protección hasta que te muevas o ataques.
- **Botín que reaparece:** en un servidor de semanas el botín debe regenerarse (por edificio, cada varias horas); si no, el mapa se vacía.
- **Armas y munición escasas** para que cada combate importe; revisar los controles táctiles para apuntar a jugadores.

## 5. Alianzas y traición
**Cómo se forma:** cerca de otro jugador, pulsas E → *Proponer alianza*; debe aceptar. Hasta 4 miembros. Se guarda en el servidor por `uid` (sobrevive a desconexiones).

**Qué da una alianza:** nombre en verde y punto en el minimapa de tus aliados cercanos; señales rápidas compartidas; **compartir candados** (en lugar de pasar el código a mano); acceso a un cofre de alianza.

**La traición (lo que la hace interesante y no solo injusta):**
- El fuego amistoso está **activo**: puedes matar a un aliado.
- **Estado «Traidor»** durante 24 h: nombre rojo visible para todos, no puedes entrar a otra alianza, los comerciantes te suben el precio o se niegan, y se avisa a los antiguos compañeros.
- **Incentivo:** el traidor se queda el botín del muerto (y, si tenía el código, la base). El riesgo es la fama y la venganza.
- **Anti-trampa:** salirte de la alianza y atacar en los siguientes 10 min cuenta también como traición.
- **Defensa propia:** quien recibe un ataque queda «habilitado» 5 min para responder sin penalización.
- **Confianza gradual:** cuanto más tiempo y misiones lleváis juntos, más acceso compartido, y por tanto más que ganar traicionando.

**Misiones de grupo (el motor de las alianzas):**
- Un generador de misiones por grupo en el anfitrión, con el ritmo de la v14.7 (una por día y por grupo). Ejemplos: escoltar un convoy de suministros, mantener la radio durante 3 min, entregar una caja a un comerciante, rescatar a alguien de un campamento de bandidos, limpiar un nido de zombis.
- **El dilema:** la recompensa final aparece en **un solo cofre** que cualquier miembro puede abrir; quien llega primero se la lleva. Es el momento natural de la traición.
- Opcional más adelante: «contrato del traidor» (a uno se le ofrece en secreto una recompensa por entregar al grupo).

## 6. Servidor y datos
- **Atributo de sala `pvp`** (config y panel de administración): etiqueta PVP en el lobby, aviso al entrar («otros jugadores pueden matarte y quedarse tu equipo») y confirmación.
- **Personajes en el servidor:** archivo por sala y `uid` (inventario, habilidades, estado), guardado cada ~30 s y al salir; al morir se borra; al unirse el cliente carga **del servidor**, no de su teléfono.
- **Alianzas:** `alianzas.json` por sala (miembros, fecha, estado de traidor).
- **Panel admin:** registro de muertes y traiciones, baneo global por `uid`, alianzas activas.
- **Capacidad:** una sala 480 con 10–16 jugadores cuesta menos RAM que una de 960; hay que medirlo con las pruebas de carga que ya existen (`PRUEBA_DURA`).

## 7. Interfaz
Nombres sobre los jugadores (verde aliado, blanco desconocido, rojo traidor/asesino); menú al pulsar E sobre un jugador (saludar, aliarse, comerciar); rueda de señales; marcas de impacto; mensajes de muerte y de traición; panel de alianza (miembros, salir, candados compartidos); aviso PvP al entrar; ajuste «mostrar nombres».

## 8. Fases propuestas (cada una con su paquete y pruebas, como las v14.x)
| Fase | Contenido | Riesgo |
|---|---|---|
| **0** | Confirmar decisiones de la sección 3. Pequeñas pruebas técnicas: ¿corren misiones en las salas?, medir latencia real de la ruta por el servidor. | Bajo |
| **1** | Cimientos: atributo `pvp`, etiqueta y aviso, personajes en el servidor (la muerte borra), vida con autoridad del servidor en salas PvP, corregir la confianza en el daño enviado (`HZ`). | **Alto** (toca el modelo de autoridad) |
| **2** | Combate PvP: golpes y disparos contra jugadores con validación, heridas, cuerpo saqueable, desconexión en combate, zonas seguras, aparición y protección, mensajes de muerte. | Alto |
| **3** | Alianzas: proponer/aceptar, marcadores, señales, candados compartidos, fuego amistoso y estado de traidor, persistencia. | Medio |
| **4** | Misiones de grupo: generador, objetivos compartidos, cofre de recompensa, ritmo diario. | Medio |
| **5** | Karma y recompensas por cabeza, reacción de NPC, reglas de asalto a bases, botín que reaparece, temporadas de 14 días. | Medio |
| **6** | Endurecimiento: contra trampas (velocidad, teletransporte, límites), pruebas de bots PvP (peleas, traiciones, desconexión en combate, intentos de daño falso), prueba de carga, panel admin, y papeleo de Google Play. | Medio |

**Pruebas previstas:** reutilizar los bots de la prueba dura, ampliados para pelear, aliarse y traicionar; pruebas de «cliente tramposo» (daño y vida falsos, mochila inventada, teletransporte) que el servidor debe rechazar; muerte → el personaje se borra → al volver no hay rollback; prueba de carga con 10–16 jugadores.

## 9. Riesgos y cosas que conviene saber
- **El cambio de autoridad (fase 1) es lo más delicado**: toca cómo se guardan mochila y vida desde hace muchas versiones. Hay que hacerlo con cuidado y con pruebas de regresión del cooperativo actual.
- **Trampas:** con PvP real un tramposo arruina la partida de los demás. Sin la fase 1 y la 6 no se debe abrir al público.
- **Retención y griefing:** el PvP puro ahuyenta a jugadores nuevos (ser matado nada más aparecer). Mitigaciones: sala aparte, protección al aparecer, aliados y misiones como motivo para quedarse, temporadas.
- **Google Play:** hay que revisar la clasificación por edades (IARC: interacción entre usuarios y violencia), actualizar «Seguridad de los datos» y la política de privacidad (se guarda un personaje por `uid` en el servidor, alianzas y registros de muertes), y tener los controles de reporte/bloqueo (ya existen).
- **Coste del servidor:** con 10–16 jugadores por sala en un mapa 480 el consumo sube respecto a una sala PvE; hay que medirlo antes de abrir (el PC de casa funciona para empezar; el análisis de opciones de servidor sigue en `estudio_mercado/`).
- **No probado todavía:** todo lo de este plan es diseño; las cifras (latencia, tolerancias de validación) se fijarán con las pruebas de la fase 0.

## 10. Qué necesito de ti para empezar
Tu respuesta a las 8 decisiones de la sección 3 (puedes decir «todas las recomendadas»). Con eso arranco por la **fase 0** y te presento los resultados antes de tocar nada de lo grande.
