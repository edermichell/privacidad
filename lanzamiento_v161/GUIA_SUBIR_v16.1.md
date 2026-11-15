# Lanzar la v16.1 en Google Play · paso a paso

**Qué subes:** la app **16.1** (versionCode **158**) a la misma pista de **prueba cerrada (alpha)** donde ya está aprobada la 14.0. Después actualizas el servidor de tu PC.
**Tiempo:** ~1 h de trabajo tuyo + la revisión de Google (de horas a varios días).

## Archivos de esta carpeta
| Archivo | Para qué |
|---|---|
| `UltimoRefugio_AndroidStudio_v16.1.zip` | Proyecto de Android Studio (versionCode 158, versionName «16.1») |
| `privacy.html` | Política de privacidad actualizada («noviembre de 2026 (v15.9)») |
| `NOVEDADES_PLAY_v16.1.txt` | Texto de «Novedades» para Play (español 394 caracteres, inglés 370; máximo 500) |
| `UltimoRefugio_Servidor_Tailscale.zip` | Kit del servidor nuevo (se instala **después**, paso 7) |
| `correo_testers_v161/` | Correo para testers (HTML con imágenes y texto) |
| `CAMBIOS_v14.0_a_v16.1.md` | Todo lo que cambió desde la 14.0 aprobada |

---

## Paso 1 · Política de privacidad (5 min)
1. Sube `privacy.html` a **tu URL pública de siempre** (la que está en Play Console → Contenido de la app → Política de privacidad, y en la variable `PRIVACY_URL`), sustituyendo la anterior.
2. Ábrela desde el teléfono: arriba debe decir **«noviembre de 2026 (v15.9)»** (la 16.0 y la 16.1 no cambian la política).

## Paso 2 · Formularios de Play Console (solo si no los actualizaste con la 15.x)
Desde la 15.9 hay un dato nuevo: **el nombre de jugador que cada uno elige** (visible para los demás, guardado en tu servidor). Si aún no lo declaraste, añádelo en Seguridad de los datos (ver abajo). La 16.0 y la 16.1 no añaden nada más.
- **Seguridad de los datos:** *ID de usuario* (identificador anónimo del multijugador **y el nombre de jugador que elige**; si el formulario lo pide aparte, decláralo como *Otros contenidos generados por el usuario*) e *Interacciones/actividad en la app*: recopilados, finalidad «Funcionalidad de la app» (y «Prevención de fraudes y seguridad» si el formulario la ofrece), **no compartidos**, cifrados en tránsito, y se puede pedir el borrado por correo. Lo de Unity Ads y las compras sigue igual. Comprueba cada casilla con el formulario actual.
- **Clasificación de contenido (IARC):** los usuarios interactúan entre sí (multijugador por salas, **sin chat de texto ni voz**), hay violencia de fantasía contra zombis y combate entre jugadores en la sala PvP.

## Paso 3 · Compilar el AAB firmado (15–30 min)
1. Descomprime `UltimoRefugio_AndroidStudio_v16.1.zip` y abre la carpeta `UltimoRefugio_Android` en **Android Studio**. Deja que sincronice Gradle (necesita internet).
2. Revisa `app/build.gradle`: debe tener `versionCode 158` y `versionName "16.1"`.
3. Revisa tus valores de compilación (los mismos de la 14.0): `UNITY_TEST_MODE=false`, `PRIVACY_URL` con tu dirección real, `UNITY_GAME_ID` y la firma (`KEYSTORE_FILE`…).
4. **Build ▸ Generate Signed Bundle / APK… ▸ Android App Bundle**, con **la misma llave `.jks` de la 14.0** (si usas otra, Play la rechaza) ▸ **release** ▸ Finish. El archivo queda en `app/release/app-release.aab`.
5. Si Gradle da un error, mándame el texto exacto. El código Java (actualización dentro de la app y recuperación del WebView) es distinto del de la 14.0 y no pude compilarlo con el SDK real.

## Paso 4 · Probar en tu teléfono antes de subir (15 min)
Instala la compilación release en un teléfono (o súbela primero a **Prueba interna**) y comprueba:
1. Que el juego abre, se puede jugar una partida individual y se conserva el guardado anterior.
2. **MULTIJUGADOR:** aparecen las salas y puedes entrar a una (con el servidor encendido).
3. Una compra de prueba, un anuncio recompensado y la pantalla de consentimiento.
4. **NOVEDADES:** la primera entrada de la lista es la 16.1, «Partidas largas más fluidas».
5. **MULTIJUGADOR → TU NOMBRE:** escribe un nombre, entra a una sala y comprueba que otro jugador lo ve sobre tu personaje.

## Paso 5 · Subir a Play Console (10 min)
1. Play Console → tu app → **Pruebas → Prueba cerrada (alpha)** → **Crear nueva versión**.
2. Sube `app-release.aab`. Nombre de la versión: **16.1 (158)**.
3. En **«Novedades de esta versión»** pega los dos bloques de `NOVEDADES_PLAY_v16.1.txt` (es-419 / es-ES y en-US).
4. **Siguiente → Revisar versión**: lee los avisos (permisos, API objetivo, dispositivos). Los avisos amarillos no impiden publicar; los rojos sí (mándamelos).
5. **Guardar → Enviar cambios a revisión** (en *Resumen de la publicación*).
6. Mientras dure la revisión **no cambies la ficha ni los formularios**, porque cada cambio puede alargar la espera.

## Paso 6 · Cuando Google la apruebe
1. Comprueba en un teléfono de tester que Play ofrece la actualización a la 16.1. Con la 14.9 o posterior instalada, la app avisa sola en el menú («Versión nueva disponible · ACTUALIZAR»).
2. Manda el correo de `correo_testers_v161/`: rellena `[PEGAR AQUÍ…]` con el enlace de la prueba, la dirección de `/prueba` y el horario.

## Paso 7 · Actualizar el servidor de tu PC (10 min), cuando los testers ya tengan la 16.1
**Importante:** con el kit nuevo, la **sala PvP solo deja entrar a la app 16.1**; quien tenga una versión anterior ve que debe actualizar. Las salas normales siguen admitiendo las apps antiguas. Por eso conviene actualizar el servidor **después** de que la 16.1 esté en Play.
1. Cierra el servidor (ventana de `INICIAR_SERVIDOR.bat` → Ctrl+C).
2. Haz una copia de la carpeta del servidor (por seguridad).
3. Del zip `UltimoRefugio_Servidor_Tailscale.zip`, copia **encima** solo estos archivos: `servidor.js`, `srv_layer.js`, `admin.html`, `LEEME_SERVIDOR.md` y `juego\index.html`. **No pises tu `config.json`** ni la carpeta `datos`.
4. Abre `INICIAR_SERVIDOR.bat` y entra con tu teléfono a una sala normal y a la sala PvP.
5. Opcional: `PRUEBA_DURA.bat` con todo cerrado. Debe decir **APROBADO**.
6. Opcional: para que Play avise a todos, añade a `config.json` `"appUltima": { "codigo": 158, "version": "16.1", "notas": ["Pon tu nombre en las salas", "Apareces en tu cama o donde lo dejaste"] }`.

## Paso 8 · Vigilar 2–3 días
- **Play Console → Android vitals:** cierres y ANR de la 16.1.
- **Panel `/admin` del servidor:** memoria y pasos/s.
- **Registro del servidor:** si ves `INVENTARIO SOSPECHOSO de jugador N` o `movimiento imposible` de alguien que juega limpio, mándame esas líneas y qué estaba haciendo. Mientras tanto puedes apagar el control con `"auditarInventario": false` o `"validarMovimiento": false` en `config.json`.
- Cuando la alpha vaya bien 1–2 semanas, puedes **promover la versión a producción** desde la misma pantalla (Play exige haber cumplido los requisitos de prueba cerrada de tu cuenta).

## Si algo sale mal
| Problema | Qué hacer |
|---|---|
| Play rechaza la versión | Copia el motivo (*Recibidos* / *Política y programas*) y mándamelo |
| «Clave de firma incorrecta» | Usaste otra llave: compila con la `.jks` de la 14.0 |
| «Version code 158 ya usado» | Ya subiste un 158 antes: dime y lo paso a 158 |
| La sala PvP no deja entrar | Ese teléfono no tiene aún la 16.1 (es lo esperado) |
| Fallo del servidor nuevo | Restaura la copia del paso 7.2 y mándame el registro |

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
