# Último Refugio 18.3 — «En compañía se ve todo» (versionCode 173)

Incluye la 18.2, la 18.1, la 18.0 y la 17.9. Cambia el juego (`index.html`), que **también usa el servidor**. No cambia `srv_layer.js` respecto a la 18.2, ni el código Java, la política o los permisos.

## Por qué
Las mejoras de la 18.0 y la 18.1 solo se veían bien en la pantalla de quien las vivía:
- Si a un compañero le agarraba un zombi, **tú no veías nada**: parecía quieto y no sabías que necesitaba ayuda.
- Los zombis solo retrocedían y destellaban con **tus** golpes, no con los de los demás.

## Qué cambia
1. **El agarrón de otro jugador se ve.**
   - Tiembla y tiene un **aro rojo** a los pies mientras forcejea.
   - Golpea al zombi para soltarlo (eso ya funcionaba; ahora sabes cuándo hacerlo). Ver `companero_agarrado.png`.
   - Funciona en las salas del servidor (el estado se reenvía con el resto) y en el cooperativo (también se ve al anfitrión).
2. **Los golpes de los demás hacen retroceder y destellar a los zombis en tu pantalla.**
   - El anfitrión o servidor marca los zombis recién golpeados.
   - Tu teléfono los empuja lejos del jugador más cercano, que casi seguro es quien golpeó.
   - Con tus propios golpes no se repite el retroceso cuando llega esa marca.
3. **Las apps antiguas** ignoran los datos nuevos y siguen funcionando igual.

## Pruebas
`prueba_companeros_v183.js`, contra el servidor real con dos jugadores:
- A Lobo le agarra un zombi del servidor.
- Halcón recibe el estado y lo dibuja agarrado; al soltarse, deja de verlo.
- Un golpe de Halcón hace destellar y retroceder al zombi en la pantalla de Lobo, en el sentido contrario a Halcón.
- Si Lobo golpea él mismo, no hay retroceso doble.
- Sin errores.

Batería completa: `RESULTADO_PRUEBAS_v18.3.txt`.
