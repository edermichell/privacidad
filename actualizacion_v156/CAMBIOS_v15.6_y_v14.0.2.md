# Último Refugio v15.6 y v14.0.2 — sin «anfitrión» en las salas oficiales y golpes/disparos de los demás a la vista

Dos versiones con el mismo arreglo: **15.6** (`versionCode 153`, línea completa) y **14.0.2** (`versionCode 139`, la 14.0 aprobada + arreglos de multijugador; **Java idéntico a la 14.0**).

## 1. «Que el primer jugador no sea el anfitrión»
En una sala oficial **nadie es anfitrión**: el mundo lo lleva el servidor. Lo que quedaba a la vista y se corrigió:
- **Numeración:** el primer jugador que entraba se llamaba «Jugador 2», porque el «1» era el anfitrión invisible del servidor. Ahora los jugadores se numeran desde **«Jugador 1»**. *(Cambio del servidor: vale para todas las apps.)*
- **Textos de la app** en salas del servidor: «Te uniste a la partida de tu compañero» → «Entraste a la sala»; «Se perdió la conexión con el anfitrión» → «…con el servidor»; «Descargando el mundo de tu compañero…» → «…de la sala…»; «Tu compañero está conduciendo ese auto» → «Otro jugador…»; y los avisos de error equivalentes. En el cooperativo directo entre dos teléfonos (ahí sí hay anfitrión) los textos siguen igual.
- **Lo que no se puede cambiar:** quien siga con la app **14.0 original** ve al jugador más cercano con el rótulo «Anfitrión» (es el paliativo del servidor para esa app; el rótulo está fijo dentro de la app instalada). Desaparece al actualizar a la 14.0.1 o posterior.

## 2. Animaciones que a veces no se veían (golpe de puños, disparo…)
**Causa:** lo que hace otro jugador solo llegaba como una «pose» que el servidor reenvía unas **7 veces por segundo**. Un disparo dura 0,14 s (menos que el intervalo: casi nunca coincidía) y un golpe se veía a saltos o no se veía. Además, **la estela de la bala, el fogonazo, el casquillo, el humo y el sonido no se enviaban nunca**: solo existían en la pantalla de quien disparaba.

**Arreglo:** cada golpe y cada disparo viaja como un **evento propio**. El servidor lo reenvía al momento a los jugadores que estén a menos de 48 casillas y cada uno lo reproduce completo:
- **Golpe:** animación entera (los 6 cuadros, con su duración real según el arma), el arco del golpe alrededor de quien golpea y el sonido, atenuado por la distancia.
- **Disparo:** postura de disparo, **estela de cada bala** (las 3 de la escopeta), fogonazo, casquillo, humo y sonido con distancia.
- El servidor limita el reenvío (máx. ~16 por segundo y jugador) y descarta eventos mal formados.
- Funciona igual en el cooperativo directo (anfitrión ↔ invitado).

**Requiere las dos cosas:** la app nueva (14.0.2 o 15.6) **y** el kit nuevo del servidor (es el servidor quien reenvía). Con el servidor antiguo todo sigue funcionando como antes, solo que sin estas animaciones.

## Qué subir
| | **14.0.2** (recomendada si subiste o ibas a subir la 14.0.1) | **15.6** |
|---|---|---|
| Contenido | La 14.0 + jugadores visibles (14.0.1) + este arreglo. 51 líneas distintas en `index.html`; **Java, permisos y dependencias idénticos a la 14.0** | Todo lo nuevo (mapa 960, PvP, alianzas, misiones…) + estos arreglos |
| versionCode | **139** («14.0.2») | **153** («15.6») |
| Archivo | `actualizacion_v156/UltimoRefugio_AndroidStudio_v14.0.2.zip` | `lanzamiento_v156/UltimoRefugio_AndroidStudio_v15.6.zip` |

La 14.0.2 **sustituye** a la 14.0.1 (si ya subiste la 138, sube la 139 encima).

## Pasos
1. **Servidor:** cierra el servidor y copia del kit nuevo `servidor.js`, `srv_layer.js` y `juego\index.html` (sin pisar `config.json`). Con esto ya cambia la numeración («Jugador 1») para todos.
2. **App:** compila y sube a alpha la 14.0.2 (o la 15.6). Novedades: `actualizacion_v156/NOVEDADES_PLAY_v14.0.2.txt`.
3. **Prueba con 2–3 teléfonos actualizados:** uno da puñetazos y dispara; los otros deben ver el golpe completo, la estela y el fogonazo, y oír el disparo.

## Pruebas (3 jugadores en una sala, usando las funciones reales de golpe y disparo)
| Caso | Resultado |
|---|---|
| Servidor nuevo + 3 apps 15.6 | Golpe: los 6 cuadros, arco alrededor del que golpea y sonido. Disparo: estela desde el tirador, fogonazo, postura y sonido con distancia. Escopeta: 3 estelas. Nombres «Jugador 1, 2, 3» |
| Servidor nuevo + 3 apps 14.0.2 | Igual, sin fallos |
| Servidor nuevo + navegador | Igual, sin fallos |
| Mezcla 14.0.1 / 14.0.2 / 15.6 | Las apps con el cambio lo ven todo; la 14.0.1 sigue como antes (solo cuadros sueltos del golpe, sin estela ni sonido); sin errores |
| Emisor con app antigua (14.0.1) | Los demás lo ven como antes (por muestreo): hace falta que **quien golpea** también tenga la app nueva |
| Servidor **antiguo** + 3 apps 15.6 | No se ven estas animaciones (el servidor antiguo no reenvía), sin errores |
| 200 eventos de golpe en un instante / eventos basura | El servidor reenvía 1; nada se rompe |
| Cooperativo directo (15.6 y 14.0.2) | Anfitrión e invitado ven y oyen los golpes y disparos del otro |

Regresión completa de las dos versiones y del servidor: ver el resumen de la entrega.

## Límites
- **Probado en Chromium con el código de la app, no en teléfonos reales.**
- Solo se envían **golpes y disparos**. Otras acciones (recargar, lanzar objetos, usar/curarse, talar) siguen sin evento propio; los objetos lanzados y sus explosiones ya los mostraba el servidor.
- Los impactos sobre zombis (sangre, números de daño) ya dependían del servidor y no cambian.
- El evento usa la posición con la que ves al otro jugador; con mucha latencia la estela puede salir ligeramente desplazada respecto a donde disparó.
- En salas PvP los eventos solo llegan a quien tenga al tirador en su lista (≤ 55 casillas o aliado).
