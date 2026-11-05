# Último Refugio — Actualización v100 (app 9.4, versionCode 86): anuncios opcionales nuevos y un intersticial más justo
Incluye todo lo de v86–v99. Todo lo nuevo es **opcional** (el jugador elige verlo). `VERIFICAR_ANUNCIOS.md` está actualizado.

## Anuncios nuevos (con recompensa, siempre opcionales)
1. **Duplicar la caja.** Al abrir una caja de suministros aparece **«Duplicar contenido · ver anuncio»**. Si se ve el anuncio completo, recibes **otra copia de todo el contenido** (la lista pasa a ×2). **Máx. 3 al día**; el botón desaparece al llegar al tope o después de duplicar esa caja.
2. **Recuperar aliento (solo modo Casual).** En la **pausa**, si te falta algún «aliento» (1/3 o 2/3), aparece **«Recuperar aliento (n/3) · ver anuncio»** y da **+1 aliento**. **Máx. 2 al día.** No aparece en modo Completo, con 3/3 ni en coop.
- **Reglas comunes:** entre dos anuncios con recompensa pasa **al menos 1 minuto** (compartido con la caja de la Tienda y revivir); anuncio saltado o sin relleno → no da nada y lo explica («Debes ver el anuncio completo…», «No hay anuncios disponibles ahora…»); varios toques seguidos lanzan **un solo** anuncio; mientras carga se ve «Cargando anuncio…».

## Intersticial más justo (el automático de la pantalla de muerte)
- **Ya no sale si acabas de ver un anuncio con recompensa** (últimos 5 min). Antes podías ver uno para revivir, morir otra vez y recibir enseguida otro anuncio.
- **Ya no sale si la partida duró menos de 3 minutos** (el momento de más frustración).
- Sigue igual: desde la 2.ª partida terminada, máx. 1 cada 2,5 min, y «Sin anuncios» / Fundador lo quitan.

## Cómo se comprobó (con un puente nativo simulado)
18 comprobaciones nuevas: aparece el botón; anuncio saltado / sin relleno / completo; contenido duplicado una sola vez (y un solo anuncio con varios toques); espera de 1 min; tope de 3 duplicaciones; aliento +1, tope de 2, desaparece a 3/3 y en modo Completo; intersticial bloqueado tras anuncio con recompensa reciente y en partidas cortas, y permitido si no. Las pruebas de anuncios anteriores se actualizaron a las reglas nuevas. Regresión: diseño de pantallas pequeñas, copia de seguridad, guardado y recarga, v96, v94, v93, v91, techos, v90, mapa, Modo Asedio, menú y el final de 180 s del helicóptero. 0 errores de JavaScript.

## Límites
- No probado con anuncios reales de Unity ni en un teléfono (ver `VERIFICAR_ANUNCIOS.md`): la prueba usa un puente simulado, igual que en la v97.
- Los topes (3 y 2 al día, 1 minuto, 5 minutos, 3 minutos) son un punto de partida; se ajustan en `layer v100` (`S100_CAP_DBL`, `S100_CAP_WIND`, `S100_WAIT`) y en `monInterDue`.
- Siguen sin implementarse: suministro por radio, reconocimiento del mapa, probar un traje y banner (propuestas 2, 3, 4 y 7 del análisis).
