# Lanzar la v18.2 «Arreglos y forcejeo fácil» en Google Play · paso a paso

**Qué subes:** la app **18.2** (versionCode **172**) a la misma pista de **prueba cerrada (alpha)**. Después actualizas el servidor de tu PC.

> **Firma (importante):** desde el **24 de noviembre de 2026** se firma con la llave nueva **`ultimo_refugio_subida.jks`** (alias `upload`) y la contraseña que te di. En Android Studio: *Build → Generate Signed Bundle / APK → Android App Bundle → Choose existing…* y elige ese archivo. La llave y su contraseña **no** están en este repositorio (guárdalas tú, con copia de seguridad).

**Tiempo:** ~1 h de trabajo tuyo + la revisión de Google (de horas a varios días).
**Sube directamente la 18.2:** incluye la 18.1, la 18.0, la 17.9 y todo lo de la 17.7 hacia atrás. Si no llegaste a subir alguna de ellas, la 18.2 las sustituye sin problema.

## Archivos de esta carpeta
| Archivo | Para qué |
|---|---|
| `UltimoRefugio_AndroidStudio_v18.2.zip` | Proyecto de Android Studio (versionCode 172, versionName «18.2») |
| `NOVEDADES_PLAY_v18.2.txt` | Texto de «Novedades» para Play (español e inglés, menos de 500 caracteres) |
| `UltimoRefugio_Servidor_Tailscale.zip` | Kit del servidor nuevo (se instala **después**, paso 7) |
| `correo_testers_v182/` | Correo para testers (texto + imágenes) |
| `CAMBIOS_v17.9_a_v18.2.md` | Qué cambió y cómo se probó |
| `privacy.html` | Política de privacidad (la de la 16.3; la 18.2 no la cambia) |
| `PROBAR_SERVIDOR.html` | Página para comprobar tu servidor desde el navegador |

---

## Paso 1 · Política de privacidad y formularios
La 18.2 **no recoge datos nuevos** ni cambia permisos. Si ya subiste la política de la 16.3 (arriba dice «noviembre de 2026 (v16.3)») y actualizaste «Seguridad de los datos» y la clasificación con la 16.3, **no hagas nada**. Si no, mira el paso 1 y 2 de la guía de la 17.7 (en `lanzamiento_v177/`).

## Paso 2 · Compilar el AAB firmado (15–30 min)
1. Descomprime `UltimoRefugio_AndroidStudio_v18.2.zip` y abre `UltimoRefugio_Android` en **Android Studio**. Deja que sincronice Gradle.
2. Revisa `app/build.gradle`: `versionCode 172` y `versionName "18.2"`.
3. Tus valores de siempre: `UNITY_TEST_MODE=false`, `PRIVACY_URL`, `UNITY_GAME_ID`.
4. **Build ▸ Generate Signed Bundle / APK… ▸ Android App Bundle**, con la llave **`ultimo_refugio_subida.jks`** ▸ **release**.
5. La 18.2 **no cambia el código Java** respecto a la 17.7 (solo el juego, `assets/index.html`). Si Gradle da error, mándame el texto exacto.

## Paso 3 · Probar en tu teléfono antes de subir (15 min)
1. El juego abre y la partida va como siempre.
2. **NOVEDADES:** la primera entrada es la 18.2, «Arreglos y forcejeo fácil» (debajo, la 18.1, la 18.0 y la 17.9).
2a. **Forcejeo fácil:** en Ajustes aparece «Forcejeo fácil» (apagado). Actívalo y deja que te agarre un zombi: debe decir «Mantén el dedo en la pantalla» y soltarte en menos de un segundo con el dedo apoyado. Apágalo y comprueba que vuelve a hacer falta tocar rápido.
2c. **Agarrón y botones:** con la mochila abierta, deja que te agarre un zombi: la mochila se cierra. Mientras forcejeas, tocar «Mochila» o «Mapa» no los abre.
2b. **Animaciones:** golpea zombis con un arma cuerpo a cuerpo. Fíjate en que retroceden al recibir el golpe, en que al morir caen hacia el lado del cadáver sin «darse la vuelta» al final, y en el polvo al tocar el suelo. Si empujas a uno y cae, mira cómo se levanta. Comprueba que el juego va igual de fluido que antes en una pelea con muchos zombis.
3. **Agarrón:** deja que los zombis te alcancen unas cuantas veces (mejor con poco aguante, después de correr). A veces sale **«¡TE AGARRA!»** con una barra verde: toca la pantalla muy rápido en cualquier sitio. Al llenarla, empujas al zombi («¡Libre!»). Si no tocas, a los ~2 s te muerde.
   - Mientras te agarra no puedes andar, atacar ni rodar. Rodar a tiempo lo evita.
   - Mira si notas la vibración al agarrarte y en cada toque.
4. **Multitudes:** métete entre varios zombis. Cuando alguno quede delante de ti, verás **tu contorno claro y un aro a tus pies** encima de ellos. Sin nada delante no aparece.
5. **Guardado:** juega unos minutos y sal con «Guardar y salir al menú». Al volver con CONTINUAR, todo debe seguir igual (puertas abiertas, árboles talados, mochila).
6. **Sala PvP (si la tienes, con el servidor ya actualizado):** con otro teléfono, pelead un momento y cierra la app de uno de los dos. El otro debe ver **el cuerpo tumbado «(desconectado)»** durante 30 s y poder atacarlo. Si vuelves antes, despiertas en tu cuerpo.

## Paso 4 · Subir a Play Console (10 min)
1. Play Console → **Pruebas → Prueba cerrada (alpha)** → **Crear nueva versión**.
2. Sube `app-release.aab`. Nombre: **18.2 (172)**.
3. Pega los dos bloques de `NOVEDADES_PLAY_v18.2.txt`.
4. **Revisar versión** (los avisos rojos, mándamelos) → **Guardar → Enviar cambios a revisión**.

## Paso 5 · Cuando Google la apruebe
1. Comprueba en un teléfono de tester que Play ofrece la 18.2 (la app avisa sola en el menú).
2. Manda el correo de `correo_testers_v182/` rellenando los `[PEGAR AQUÍ…]`.

## Paso 6 · Actualizar el servidor de tu PC (10 min)
**Qué cambia para todos:**
- En la **sala PvP**, quien se desconecta en combate deja **el cuerpo dormido 30 s** en vez de morir al instante (17.9).
- El servidor usa el juego 18.2, así que en las salas los zombis también **agarran**. Los invitados que se sueltan dejan al zombi **aturdido** en el servidor.
- Las apps antiguas siguen entrando. Ven el cuerpo de pie, con «(desconectado)», y no tienen agarrones.

**18.2 (servidor):** el cuerpo dormido de la sala PvP ya no se queda grabado en el mundo al guardar; solo podía pasar si ya pusiste en tu PC el servidor de la 17.9. Si ves algún personaje «… (desconectado)» paseando por el mapa, dímelo y te digo cómo quitarlo.

Pasos:
1. Cierra el servidor (ventana de `INICIAR_SERVIDOR.bat` → Ctrl+C) y haz una copia de la carpeta.
2. Del zip `UltimoRefugio_Servidor_Tailscale.zip`, copia **encima** solo: `servidor.js`, `srv_layer.js`, `LEEME_SERVIDOR.md` y `juego\index.html`. **No pises tu `config.json`** ni la carpeta `datos`.
3. Arranca el servidor.
4. Opcional, para avisar a todos: en `config.json`, `"appUltima": { "codigo": 172, "version": "18.2", "notas": ["Forcejeo fácil en Ajustes", "Animaciones con más peso: golpes, caídas y levantarse", "Los zombis pueden agarrarte: toca rápido para soltarte", "En una multitud te sigues viendo", "Sala PvP: desconectarse en combate deja tu cuerpo dormido 30 s"] }`.
5. **Ajustes opcionales** (`config.json`, detalle en `LEEME_SERVIDOR.md`):
   - `"cuerpoDesconectado": false` vuelve a la regla anterior (desconectarse en combate = morir).
   - `"cuerpoSeg": 30` son los segundos que se queda el cuerpo.

## Paso 7 · Vigilar 2–3 días
- **Play Console → Android vitals:** cierres y ANR de la 18.2.
- **Registro del servidor, sala PvP:** cuántos cuerpos de desconectados acaban muertos y si alguien se queja.
- Pregunta a los testers:
  - ¿Los agarrones son justos? (¿muy frecuentes, muy difíciles de soltar?) Hoy: 16 % de los golpes que aciertan, 30 % sin aliento; en casual menos. Se sueltan con 5 toques en ~2 s.
  - ¿El contorno en las multitudes ayuda o molesta?
  - Lo ajusto en la siguiente versión.

## Si algo sale mal
| Problema | Qué hacer |
|---|---|
| Play rechaza la versión | Copia el motivo y mándamelo |
| «Clave de firma incorrecta» | Usa `ultimo_refugio_subida.jks` (alias `upload`) |
| «Version code 172 ya usado» | Dime y lo paso a 173 |
| El agarrón no se suelta tocando | Mándame el modelo del teléfono; mientras, sacudir el joystick también cuenta |
| Fallo del servidor nuevo | Restaura la copia del paso 6.1 y mándame el registro |

---

# Anexo: referencia por versión (para consulta)

## Novedades y aviso de actualización (nuevo en la 14.9)
- **Botón NOVEDADES** en el menú principal (abajo, junto a SONIDO) y en **Ajustes → Datos → «Novedades y actualización»**: lista lo que cambió en cada versión y permite «BUSCAR ACTUALIZACIÓN».
- **Tras actualizar**, el panel se abre una sola vez. En una instalación nueva no molesta.
- **Aviso automático:** al abrir el menú, la app (Android) pregunta a Google Play si hay una versión más nueva (*actualización dentro de la app*, librería `com.google.android.play:app-update:2.1.0`, ya añadida a `build.gradle`). Si la hay, aparece un aviso abajo («Versión nueva disponible · ACTUALIZAR»), un punto rojo en NOVEDADES y el botón ACTUALIZAR AHORA en el panel. Al pulsar, Google Play hace la actualización (pantalla completa, «inmediata»); si Play no la permite, abre la ficha de la app. El jugador puede descartar el aviso (no vuelve hasta que salga otra versión).
- **Anuncio desde tu servidor (opcional):** en `config.json` puedes poner `"appUltima": { "codigo": 147, "version": "14.10", "notas": ["Lo nuevo 1", "Lo nuevo 2"] }` (codigo = versionCode de Play). La app lo recibe con la lista de salas y avisa (con esas notas) a quien tenga una versión menor. Sin ese bloque no se anuncia nada; el aviso de Google Play funciona igual. **Cada vez que subas una versión nueva, añade también sus cambios a la lista `UR_NEWS` del juego** (primeras líneas del bloque «v15.7 · NOVEDADES»), o pídeme que lo haga.
- **Cómo probar el aviso (hay que hacerlo con Google Play, no se puede en el emulador sin Play):** instala la 15.9 desde la pista (alpha/interna) en un teléfono; luego sube **otra compilación con un versionCode mayor** (p. ej. 157) a la misma pista; cuando Play la procese (puede tardar de minutos a horas), abre la app en el teléfono: debe salir el aviso. Con «Compartir app interna» también sirve. Qué mirar: (1) aviso y punto rojo; (2) ACTUALIZAR abre la pantalla de actualización de Play; (3) al terminar, la app arranca en la versión nueva y abre las novedades una vez.
- **Aún sin probar en un teléfono real:** el código Java de esta función compila contra una copia de la API de Play hecha por mí, pero **no se ha ejecutado con Google Play real**. Es la primera cosa a revisar con la 15.8 (Android Studio debe descargar la librería `app-update` al sincronizar Gradle; necesita internet).


---

## Autoridad del servidor (nuevo en la 15.0)
**Qué es:** el servidor comprueba los golpes y disparos que mandan los jugadores y guarda el personaje de cada uno (mochila, habilidades) en tu PC, así que ya no se puede inventar objetos desde el teléfono ni recuperar un personaje muerto. Es la base del futuro servidor PvP. Detalle completo en `actualizacion_v157/CAMBIOS_v15.7_autoridad.md`.

**En tu PC (servidor):**
1. Cierra el servidor. Copia del kit nuevo: `servidor.js`, `srv_layer.js`, `LEEME_SERVIDOR.md` y `juego\index.html`. **No pises tu `config.json`** (las opciones nuevas son opcionales y traen buenos valores por defecto).
2. Arranca. En el registro, al jugar, puedes ver líneas `[SALA1] daño rechazado…` si alguien manda golpes imposibles, y `murió: personaje borrado`. Los personajes quedan en `datos\salas\<SALA>\personajes\`.
3. Con las salas oficiales en modo `casual`, morir **no** borra el personaje (como ahora). Para una sala con muerte real, pon su `"modo": "full"` en `config.json` (en la propia sala) y cambia de mundo.
4. **Cuándo exigir la 15.0 (o posterior):** las apps anteriores siguen entrando, pero **sin esta protección**. Cuando tus testers ya tengan la 15.7, pon `"versionMinimaApp": 147` (o 155 para exigir la 15.8) en `config.json` y quien tenga una versión antigua verá «actualiza la app».

**Prueba rápida con 2 testers (10 min):** (1) entrar a una sala, recoger algo y salir/volver a entrar: debe conservar la mochila; (2) en `datos\salas\SALA1\personajes\` aparece un archivo por jugador; (3) en una sala `full`, morir y volver a entrar: personaje nuevo.
**Política de privacidad:** ya incluye el nuevo punto «Tu personaje en la sala»; súbela a tu URL pública antes de enviar la app (igual que antes).


---

## Sala PvP y confirmaciones (nuevo en la 15.1)
- **Aviso importante:** esta versión solo trae los **cimientos** del PvP (sala marcada, aviso, vida controlada por el servidor). *(Esto era así en la 15.1; la 15.7 ya trae el combate: ver la sección siguiente.)*
- **Para probar una sala PvP con tus testers:** en `config.json`, dentro de `"salas"`, añade `{ "id": "SALA4", "nombre": "Frontera PvP", "pvp": true }` (y sube `salasActivasMax` si hace falta). Es de modo completo: **morir borra el personaje**; solo entra quien tenga la app 15.1 (`versionCode 154`).
- **Arreglo en Android:** los avisos de confirmación de «Borrar sala», «Mundo nuevo», «Reiniciar» y «Banear» no se mostraban en el teléfono (la acción se cancelaba sola). Ahora aparecen. Pruébalo: en tu sala (Multijugador → tu sala → administrar) pulsa REINICIAR y comprueba que sale el aviso.
- **En tu PC:** copia `servidor.js`, `srv_layer.js`, `LEEME_SERVIDOR.md` y `juego\index.html` del kit (sin pisar `config.json`).
- **Política de privacidad:** subir la nueva (una frase sobre la vida en salas PvP).


---

## Combate PvP (nuevo en la 15.2)
- **Ya hay daño entre jugadores en las salas `"pvp": true`.** Reglas: protección de 20 s al aparecer, zonas seguras a 10 casillas de comerciantes, el servidor decide aciertos y daño (cuchillo ≈ 14, hacha ≈ 37, pistola ≈ 41, rifle ≈ 74), al morir el cuerpo deja todo en el suelo y el personaje se borra, cortar la conexión en pleno combate (20 s) = morir, aparición aleatoria en la costa. Detalle en `actualizacion_v157/CAMBIOS_v15.7_combate_pvp.md`.
- **Recomendación:** abre la sala PvP **solo a tus testers** primero. Todo está probado con clientes de prueba, no con teléfonos reales: hay que ver cómo se siente con red real (precisión de los disparos, el castigo por cortar en combate).
- **Guion de prueba PvP (20 min, 4 testers):** (1) entrar a la sala PvP (aceptar el aviso); (2) comprobar que aparecen en sitios distintos y que sale «Protección de aparición»; (3) esperar 20 s, buscarse y pelear con cuchillo/hacha y con armas de fuego; (4) al morir: ¿el cuerpo deja las cosas?, ¿el que mató puede recogerlas?; (5) acercarse a un comerciante y comprobar que ahí no se puede atacar; (6) probar a cerrar la app en medio de una pelea (debe contar como muerte); (7) pasarme sus impresiones sobre la puntería y el daño (muy poco / mucho).
- **Servidor:** copia `servidor.js`, `srv_layer.js`, `LEEME_SERVIDOR.md` y `juego\index.html` (sin pisar `config.json`). Las salas PvP exigían la app **15.2** (`versionCode 149`).
- **Google Play:** antes de publicar revisa la clasificación por edades (cuestionario IARC: ahora hay **violencia entre usuarios** en las salas PvP) y «Seguridad de los datos» (el servidor guarda tu personaje y registra heridas y bajas). Los controles de reportar, expulsar y banear ya existen.
- **Política de privacidad:** subir la nueva.


---

## Alianzas y traición (nuevo en la 15.3)
- **Solo en salas `"pvp": true`.** Se forman acercándose (≤ 8 casillas) y proponiendo desde el indicador de la sala (tócalo), la tecla **Y** o **E** junto al jugador. Hasta 4 (`alianzaMax`). Los aliados se ven en verde y en el mapa, se mandan 4 señales y abren los candados del otro.
- **Traición:** el fuego amistoso está activo. Quien hiere a un aliado (o a un exaliado que salió hace < 10 min) es **TRAIDOR 24 h** (`traidorHoras`): nombre rojo para todos, sale de la alianza, no puede aliarse, se avisa a su alianza. Defensa propia (5 min) o atacar a un traidor: sin castigo. El cliente no hiere a un aliado cuando hay un zombi de por medio.
- **Sin radar:** en PvP cada cliente solo conoce a los jugadores a ≤ 55 casillas y a sus aliados.
- **Guion de prueba (20 min, 4 testers, sala PvP):** (1) formar una alianza de 3 y comprobar nombres verdes y el mapa; (2) mandar las 4 señales; (3) poner un candado y que un aliado lo abra con «ABRIR COMO ALIADO»; (4) pelear contra zombis junto a un aliado: no debe herirlo; (5) **traición real:** un tester hiere a un aliado a propósito → debe quedar TRAIDOR (rojo para todos) y la alianza debe avisarse; (6) el traidor intenta aliarse (debe fallar); (7) salir de la alianza y atacar enseguida → traición; (8) reiniciar el servidor y comprobar que la alianza sigue.
- **Servidor:** copia `servidor.js`, `srv_layer.js`, `LEEME_SERVIDOR.md` y `juego\index.html` (sin pisar `config.json`). Opcionales en `config.json`: `"alianzaMax": 4`, `"traidorHoras": 24`. Las salas PvP exigen la app **15.3** (`versionCode 154`).
- **Límites importantes:** quien desinstale la app obtiene una identidad nueva y se libra del estado de traidor (no hay cuentas). Aún no hay almacén compartido de alianza, reacción de comerciantes ante traidores (fase 5) ni misiones de grupo (fase 4).
- **Política de privacidad:** subir la nueva (las alianzas y el estado de traidor se guardan en el servidor).


---

## Misiones de grupo (nuevo en la 15.4)
- **Solo en salas `"pvp": true`, para alianzas con 2+ miembros conectados y cerca.** Una misión por día de juego y de día: **Limpiar el nido** o **Mantener la radio** (150 s cerca del punto, con oleadas). Se marca en el mapa y en el panel ALIANZA (tecla Y).
- **El botín:** al cumplirla aparece **un solo botín** en el suelo del punto. **Se lo lleva el primero que llegue** (aliado, traidor o desconocido): ahí se decide la confianza. Una arma con munición, vendas, un botiquín y objetos extra.
- **Servidor:** copia `servidor.js`, `srv_layer.js`, `LEEME_SERVIDOR.md` y `juego\index.html` (sin pisar `config.json`). Opcional: `"misionesGrupo": false`. Las salas PvP exigían la app **15.4** (`versionCode 154`).
- **Guion de prueba (25 min, 3–4 testers en la sala PvP):** (1) formar una alianza y esperar de día a que llegue la misión (acelerar con el reloj del mundo no es posible desde el teléfono: basta esperar al amanecer del juego; si es de noche, el servidor lo anota y llega al día siguiente); (2) ir juntos al punto marcado; (3) **nido:** eliminar a todos los infectados; **radio:** que uno aguante en el punto mientras los otros defienden las oleadas; (4) al cumplirla, ver quién llega primero al botín y qué pasa con la confianza; (5) probar que un desconocido también puede llevarse el botín; (6) reconectarse a mitad de misión.
- **Límites:** solo dos tipos de misión; el botín no se reparte; la misión en curso se pierde si el servidor se reinicia.


---

## Arreglo: los jugadores no se veían en las salas (nuevo en la 15.5)
- **Fallo de la app** presente desde la 14.0 hasta la 15.4: cada jugador cercano se dibujaba como el «Anfitrión» del servidor, quieto en el punto de entrada. Análisis completo, pruebas y opciones en **`arreglo_jugadores_invisibles/ANALISIS_Y_ARREGLO.md`**.
- **Hay que actualizar la app en Play** (no basta con el servidor). Dos caminos: la **14.0.1** (versionCode 138: la 14.0 aprobada más solo este arreglo, riesgo mínimo) o esta **15.5** (versionCode 154, con todo lo nuevo).
- **Servidor:** el kit nuevo trae un paliativo para quien siga con la app antigua (ve al jugador más cercano, rotulado «Anfitrión»); se apaga con `"parcheAppAntigua": false`. Copia `servidor.js`, `srv_layer.js` y `juego\index.html` sin pisar `config.json`.
- **Prueba obligatoria con 3 teléfonos actualizados:** cada uno debe ver a los otros dos moviéndose, con «Jugador N», sin ningún «Anfitrión».
- Las salas PvP exigían entonces la app 15.5 (`versionCode 152`).


---

## Golpes y disparos visibles, y salas sin «anfitrión» (nuevo en la 15.6)
- **Animaciones:** cada golpe y cada disparo de otro jugador se ve completo (animación, arco, estela de la bala, fogonazo, casquillo) y se oye con la distancia. **Hace falta la app nueva y el kit nuevo del servidor** (el servidor reenvía los eventos).
- **Sin anfitrión:** en las salas oficiales el primer jugador es «Jugador 1» y los textos ya no hablan de «anfitrión» ni de «tu compañero».
- Detalle, pruebas y la opción mínima **14.0.2** (versionCode 139): `actualizacion_v156/CAMBIOS_v15.6_y_v14.0.2.md`.
- **Prueba con 2–3 teléfonos:** uno golpea y dispara; los demás deben verlo y oírlo.


---

## Fase 5: salas vivas (nuevo en la 15.7)
- **Solo servidor (sirve ya para la 14.0.x):** el botín de muebles vacíos vuelve tras 3 h sin nadie cerca; las bases (lo que rodea a tus candados) quedan protegidas si todos sus dueños llevan más de 10 min desconectados; temporadas PvP de 14 días con avisos, ranking y mundo nuevo.
- **PvP:** 3 asesinatos de inocentes en 24 h = BANDIDO (nombre naranja con la app 15.7), recompensa para quien lo mate; los comerciantes no atienden a bandidos ni traidores.
- **Servidor:** copia `servidor.js`, `srv_layer.js`, `LEEME_SERVIDOR.md` y `juego\index.html` (sin pisar `config.json`). Opciones nuevas: `botinReapareceHoras` (3), `proteccionBases` (true), `proteccionBasesMin` (10), `temporadaDias` (14, salas PvP).
- **Consejo para tus testers:** pongan al menos un candado en su base para que quede protegida al desconectarse.
- Detalle y pruebas: `actualizacion_v157/CAMBIOS_v15.7_fase5.md`.

## Fase 6: salas PvP más limpias (nuevo en la 15.8)
- **Libro de inventario:** el servidor apunta de dónde saca cada jugador las armas de fuego, la munición (también la cargada), los botiquines, los chalecos/cascos y las armas fuertes: suelo, muebles, cadáveres de zombis con uniforme, comerciantes y fabricar. Lo que aparece sin origen **no se guarda**, no sirve para dañar a otros jugadores y el teléfono del tramposo también lo pierde. Hay una pequeña tolerancia para las recompensas de misiones (nunca dan armas).
- **Movimiento:** más de 9 casillas/s a pie o 16 en coche (con margen) = el servidor devuelve al jugador a su última posición válida; los golpes usan esa posición.
- **Los invitados ven ahora el uniforme de los zombis** (policía, soldado…) y pueden sacar su botín.
- **Servidor:** copia `servidor.js`, `srv_layer.js`, `LEEME_SERVIDOR.md` y `juego\index.html` (sin pisar `config.json`). Opcionales: `"auditarInventario": false`, `"validarMovimiento": false`. **Las salas PvP exigen la app 15.8** (`versionCode 155`); en el registro verás `INVENTARIO SOSPECHOSO de jugador N …` si alguien lo intenta.
- Detalle, límites y pruebas: `actualizacion_v158/CAMBIOS_v15.8_fase6.md`.

## Tu nombre y tu cama (nuevo en la 15.9)
- **Aparición (solo servidor, apps 15.0+):** al volver a una sala, junto a la cama donde durmió; si no, donde lo dejó; tras morir, en un lugar al azar.
- **Nombre (app 15.9):** campo «TU NOMBRE» en MULTIJUGADOR, único en el servidor y sin insultos (`datos/nombres.json`); botón **Quitar nombre** en el panel.
- **Servidor:** copia también `admin.html` (botón nuevo). Detalle, opción de Google Play Juegos y pruebas: `actualizacion_v159/CAMBIOS_v15.9.md`.

## Interfaz renovada (nuevo en la 16.0)
- Solo cambia el aspecto de menús, botones y ventanas; la partida y el servidor no cambian. Comparación y detalle: `actualizacion_v160/`.
- **Servidor:** basta copiar `juego\index.html` del kit nuevo (para quien juegue desde el navegador).

## Partidas largas más fluidas (nuevo en la 16.1)
- Optimización: con miles de zombis en el mapa (día 5 en adelante) la simulación cuesta un 18 % menos. No cambia la partida. Informe con todas las medidas: `actualizacion_v161/INFORME_RENDIMIENTO_v16.1.md`.
- **Servidor:** copia `juego\index.html` del kit nuevo (las salas usan este mismo código).

## Clave de sala, arranque rápido y pantalla de juego (nuevo en la 16.2)
- **Clave de sala** (app 16.2 + servidor nuevo): al crear una sala se puede elegir la clave (4 a 6 letras o números) o dejarla vacía para una al azar. **Servidor:** copia también `servidor.js`.
- **Arranque rápido:** de 5,9 s a 2,7 s desde la segunda vez (procesador frenado ×4).
- **Pantalla de juego:** el tutorial ya no tapa los botones; barras y mensajes más legibles.
- Detalle y pruebas: `actualizacion_v162/CAMBIOS_v16.2.md`.

## Chat de voz y sala PvP oficial (nuevo en la 16.3)
- **Chat de voz de proximidad** (app 16.3 + servidor nuevo): botón VOZ (o tecla T), solo se oye a menos de 40 casillas, los zombis también lo oyen, nada se graba. Requiere el permiso de micrófono (Java y manifiesto nuevos) y actualizar la política y *Seguridad de los datos*.
- **Sala PvP oficial:** `AGREGAR_SALA_PVP.bat` añade «Frontera PvP» (mapa 480) a tu config.
- Opciones en `config.json`: `"chatVoz": false` lo apaga; `"radioVoz": 40` es la distancia en casillas. En cada sala, `"voz": false` lo apaga solo ahí.
- Detalle y pruebas: `actualizacion_v163/CAMBIOS_v16.3.md`.

## Zona Roja (nuevo en la 17.0)
- **Vida y reparación** de lo construido; **armario de herramientas** con mantenimiento; **saco de dormir y camas** para elegir dónde reaparecer, con espera creciente y anuncio recompensado; **Zonas Rojas** con gas, saqueadores y cajas militares; **sin protección de bases desconectadas en PvP**.
- **Servidor:** copia `servidor.js`, `srv_layer.js`, `LEEME_SERVIDOR.md` y `juego\index.html` (sin pisar `config.json`). Opciones nuevas: `zonasRojas`, `armarioHerramientas`, `armarioRadio`, `armarioMax`, `mantenimientoHoras`, `reaparicionSeg`, `reaparicionExtraSeg`, `reaparicionMaxSeg`.
- Detalle y pruebas: `actualizacion_v170/CAMBIOS_v17.0.md`.

## Gas, grietas y guardado ligero (nuevo en la 17.1)
- Nube de gas visible en las Zonas Rojas (también desde fuera); el filtro de la máscara antigás se gasta dentro (≈3 min en el centro) y las cajas militares traen más máscaras; grietas en lo construido dañado, polvo cuando atacan tu base y martillazos al reparar; guardado un 34 % más pequeño (compatible con los antiguos); menú de pausa deslizable.
- **Servidor:** basta copiar `juego\index.html` del kit nuevo (el servidor no cambia respecto a la 17.0).
- Detalle y pruebas: `actualizacion_v171/CAMBIOS_v17.1.md`.

## Cuarentena y lluvia (nuevo en la 17.2)
- Perímetro de cuarentena en las Zonas Rojas (postes con cinta amarilla y negra y carteles); la nube de gas forma parte del mundo (de noche se oscurece); la lluvia salpica el suelo; los civiles lejanos y tranquilos gastan menos procesador.
- **Servidor:** basta copiar `juego\\index.html` del kit nuevo. Detalle: `actualizacion_v172/CAMBIOS_v17.2.md`.

## Sangre con forma (nuevo en la 17.3)
- La sangre ahora son salpicaduras pre-dibujadas (gotas y núcleo oscuro) en vez de rectángulos planos, y las manchas se limitan para que no se acumulen en partidas largas. Solo cambia el aspecto. **Servidor:** copia `juego\\index.html`. Detalle: `actualizacion_v174/CAMBIOS_v17.4.md`.

## Rueda y esquiva (nuevo en la 17.4)
- **RODAR** (botón azul encima de USAR, o tecla Z): voltereta de ~2 casillas que durante un instante esquiva golpes de zombis, el salto del saltador y los golpes cuerpo a cuerpo de bandidos (no balas ni golpes de jugadores). Gasta aguante; sin dirección rueda hacia atrás; si pulsas ATACAR rodando, el golpe sale al levantarte.
- **Calidad automática recordada:** en teléfonos justos la partida ya empieza en calidad baja; la cámara no se acerca de golpe a mitad del juego.
- Qué probar en el teléfono: el botón RODAR (que no tape nada y se pueda mover en *Personalizar*), rodar entre zombis, y en una sala con otro teléfono que el compañero vea la voltereta.
- Sin cambios en Java, permisos, política ni servidor: en el PC basta con copiar el `juego\index.html` nuevo (viene dentro del zip del servidor).

## Se ven venir (nuevo en la 17.5)
- Los zombis se **echan hacia atrás con un destello rojo y un gruñido corto** antes de golpear (0,3 s; corredor 0,22 s; bruto 0,39 s). Retrocede, rueda o pégale primero: un golpe durante la preparación lo aturde y cancela su ataque. El ritmo de ataques no cambia.
- **USAR** junto a un cadáver al lado de un auto ya no te sube siempre al auto: gana lo que tienes enfrente.
- Qué probar en el teléfono: que el destello se vea bien de día y de noche; pelear contra 3-4 zombis y ver si da tiempo a reaccionar; matar un zombi junto a un auto y registrarlo.
- Sin cambios en Java, permisos, política ni servidor (solo `juego\index.html`).

## Más ligero (nuevo en la 17.6) — **esta vez cambia la parte Java**
- **Bibliotecas al día** (el aviso de Google de «SDK anterior»): Unity Ads 4.22.0, Billing 9.1.0, UMP 4.0.0, ID de publicidad 18.3.0. Pantalla completa, zona de la cámara y pantalla con las APIs modernas de Android (sin las obsoletas que Play Console señala para «borde a borde»).
- **Al abrir el proyecto en Android Studio:** deja que Gradle sincronice con internet (descarga las bibliotecas nuevas). Compílalo y **prueba en un teléfono**:
  1. que el juego ocupe toda la pantalla, sin barras, y que deslizando desde el borde aparezcan un momento y se vuelvan a ocultar;
  2. que en un teléfono con cámara en la pantalla (notch) no quede una franja negra;
  3. **que se vea un anuncio** (el de «volver ya» al morir o el de recompensa) y que **una compra** abra la ventana de Google Play.
- **Rendimiento:** con la mochila, fabricar, estado o el mapa abiertos el mundo se dibuja 6 veces por segundo en vez de ~50 (de 94 % a 51 % de CPU medido); el menú principal, 30. La simulación sigue igual.
- Después de subirla, mira en Play Console si el aviso del SDK desaparece. Si sigue, mándame una captura del texto exacto.

## Conexión firme (nuevo en la 17.7) — **también se actualiza el servidor**
- Cooperativo: los invitados ya no se quedan atascados en «conectando» (pasaba en 3 de cada 8 uniones de 3 invitados; ahora 0 de 16).
- Salas del servidor: si se corta la conexión en plena partida, **se reconecta solo** a la misma sala (hasta ~1 minuto; con botón «Salir al menú»).
- **Servidor del PC:** además de `juego\index.html`, copia el **`srv_layer.js`** nuevo (los dos vienen en `UltimoRefugio_Servidor_Tailscale.zip`) y reinicia el servidor. Arregla que al volver a una sala aparecieras donde se guardó la última vez en vez de donde lo dejaste.
- La parte Java no cambia desde la 17.6 (si ya probaste la 17.6 en el teléfono, basta con compilar).
- Qué probar: en una sala del servidor, quita el Wi-Fi unos segundos en pleno juego y vuélvelo a poner (debe reconectar solo y dejarte en tu sitio); y que 3 amigos se unan a la vez a un cooperativo.
