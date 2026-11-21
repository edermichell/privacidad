# Pasar Último Refugio a PRODUCCIÓN (Google Play) · v17.2 (versionCode 163)

Tienes el acceso a producción autorizado. Esta guía es lo que cambia respecto a la prueba cerrada. Para compilar y subir sigue `GUIA_SUBIR_v17.2.md` (pasos 3–5) y vuelve aquí.

## 0. Lo que ya está preparado en esta versión
- **Anuncios reales de Unity** (`UNITY_TEST_MODE=false` por defecto), como decidiste.
- **API objetivo 36 (Android 16)**, Billing 8, UMP 3, Unity Ads 4.16.1.
- **Tabletas y plegables (Android 16):** con API 36, Android ignora la orientación horizontal en pantallas grandes **salvo en juegos**. La app ahora se declara juego (`android:appCategory="game"`) y lleva además la exclusión temporal oficial (`PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY`). Sin esto, en una tableta con Android 16 el juego podía abrirse en vertical o estirado.
- **Política de privacidad por defecto:** si compilas sin la variable `PRIVACY_URL`, la app ya usa `https://edermichell.github.io/privacidad/` (antes era una dirección de relleno).
- **Código Java comprobado:** `MainActivity.java` compila sin errores contra el framework real de Android 16 y Unity Ads 4.16.1. Billing, UMP y las actualizaciones de Play se comprobaron con copias de sus firmas, porque el repositorio de Google estaba bloqueado en mi entorno. **La compilación real la haces tú en Android Studio**: si da cualquier error, mándamelo.
- Pulido: el chip de la sala ya no tapa la pantalla de muerte y dice «1 jugador» (no «1 jugadores»).

## 1. Antes de compilar la versión de producción (decisiones tuyas)
| Valor | Qué poner | Si no lo pones |
|---|---|---|
| `UNITY_TEST_MODE` | `false` | Anuncios de prueba: no generan dinero |
| `UNITY_GAME_ID` | tu ID real de Unity (ya está `800423692` por defecto; compruébalo en el panel de Unity) | — |
| `PRIVACY_URL` | `https://edermichell.github.io/privacidad/` (ya es el valor por defecto) | — |
| `UMP_APP_ID` | El ID de app de **AdMob** (`ca-app-pub-…~…`). Solo sirve para el **formulario de consentimiento** (RGPD) | En la **UE, Reino Unido y Suiza no se muestran anuncios** (el resto del mundo, sí). No es un error ni un rechazo de Google: es dinero que no entra en esas regiones |

**Para tener el formulario RGPD (recomendado si vas a publicar en Europa):** crea una cuenta gratuita de AdMob, añade la app (Android, ya publicada en Play), copia su **ID de aplicación** y ponlo en `UMP_APP_ID`. Luego en AdMob → **Privacidad y mensajes** → **RGPD** → crea y publica el mensaje para la app (y si quieres, el de **regulaciones de estados de EE. UU.**). No hace falta mostrar anuncios de AdMob: Unity sigue siendo el único proveedor.

## 2. Play Console: lo que hay que revisar para producción
1. **Contenido de la app** (menú izquierdo, abajo). Revisa que todo esté en verde:
   - **Anuncios:** «Sí, mi app contiene anuncios».
   - **Público objetivo:** 13 años o más (la app no está dirigida a niños; tiene violencia de fantasía, compras y chat de voz entre usuarios).
   - **Clasificación de contenido (IARC):** violencia de fantasía contra zombis, combate entre jugadores en la sala PvP, **interacción entre usuarios** (multijugador con chat de voz), compras dentro de la app. Si ya lo hiciste con la 16.3, no cambia.
   - **Seguridad de los datos:** igual que la 16.3 (ID de usuario, nombre de jugador, voz procesada de forma efímera, Unity Ads con ID de publicidad, compras por Google Play).
   - **Acceso a la app:** «Toda la funcionalidad está disponible sin acceso especial» (no hay inicio de sesión). El multijugador necesita tu servidor encendido; la partida individual funciona sin conexión.
2. **Ficha principal de Play Store:** sube lo de la carpeta `ficha_play/` (gráfico destacado 1024 × 500 y 7 capturas 1920 × 1080) y los textos de `ficha_play/TEXTOS_FICHA.md` (nombre, descripción breve y completa, en español e inglés).
3. **Países y regiones:** Producción → Países/regiones → elige dónde publicar (por ejemplo, toda Latinoamérica, España y EE. UU.). Si no pusiste `UMP_APP_ID`, en los países de la UE la app funciona, pero sin anuncios.
4. **Precios de los productos:** Monetización → Productos integrados: revisa que estén **activos** y con precio en cada país.

## 3. Publicar en producción (con lanzamiento por etapas)
1. **Producción → Crear nueva versión** (o, en Prueba cerrada, **Promocionar versión → Producción** sobre la 17.2 si ya la subiste ahí).
2. Sube o elige el AAB **17.2 (163)** y pega las novedades de `NOVEDADES_PLAY_v17.2.txt`.
3. **Lanzamiento por etapas: 20 %** (Play lo ofrece al revisar la versión). Así, si aparece un fallo grave solo lo ve una parte y puedes **detener el lanzamiento** desde la misma pantalla.
4. **Enviar a revisión.** Una app nueva en producción puede tardar de horas a varios días.
5. Cuando se apruebe, durante 2–3 días mira **Calidad → Android vitals** (cierres y ANR). Si va bien: **50 %**, y 2–3 días después **100 %**.
6. Mira también el **Informe previo al lanzamiento** (Pruebas → Informe previo al lanzamiento): Google prueba la app en teléfonos reales y te avisa de cierres o problemas de accesibilidad.

## 4. El servidor en producción (tu PC de casa)
- Con producción llegará gente que no conoces. Las **3 salas oficiales + la sala PvP** aguantan 10 jugadores cada una (la prueba dura dio 29,8–30 pasos/s con 30 jugadores a la vez). Cuando una sala está llena, el teléfono avisa «La sala está llena» y el jugador elige otra. Si tu PC va sobrado (mira la memoria y los pasos/s en `/admin`), puedes subir `salasActivasMax` o `maxJugadores` en `config.json`.
- **Si el PC se apaga, el multijugador no está disponible** (la partida individual sí). La app lo dice («No se encontró el servidor»). Si quieres el multijugador 24 h, deja el PC encendido con `AUTOARRANQUE_WINDOWS.bat` y `EVITAR_SUSPENSION_WINDOWS.bat` o, más adelante, pásalo a un servidor en la nube.
- **Moderación:** el panel `/admin` tiene reportes, expulsar, banear y «Quitar nombre». Con producción conviene mirarlo a diario las primeras semanas.
- Actualiza el kit del servidor (paso 7 de la guía) **justo cuando la 17.2 salga en producción**.

## 5. Si algo sale mal
| Problema | Qué hacer |
|---|---|
| Android Studio no compila | Mándame el error exacto (el Java está comprobado contra Android 16, pero las librerías de Google se resuelven en tu PC) |
| Rechazo por la política de privacidad | Comprueba que `https://edermichell.github.io/privacidad/` abre la política con «noviembre de 2026 (v16.3)» (el archivo de la rama `main` debe llamarse `index.html`) |
| Muchos cierres en Android vitals | **Detén el lanzamiento por etapas** y mándame el informe del cierre (Android vitals → el cierre → detalles) |
| En tabletas se ve mal | Mándame captura y modelo; con la 17.2 debería verse en horizontal |
| Sin anuncios en Europa | Es lo esperado sin `UMP_APP_ID` (ver punto 1) |
