# Último Refugio — Actualización v97 (app 9.1, versionCode 83): revisión de errores y de anuncios
Incluye todo lo de v86–v96. Lee también `VERIFICAR_ANUNCIOS.md` (guía de 10 minutos para comprobar Unity con tu cuenta).

## ¿Están los anuncios de Unity reales y funcionando?
**Integración: sí, real y completa. Que sirvan anuncios con TU cuenta: no se puede comprobar desde aquí** (el entorno no llega a los servidores de Unity ni tengo tu panel ni un teléfono).
- **Verificado en el código y los repositorios:** el proveedor por defecto es **Unity Ads**; el SDK `com.unity3d.ads:unity-ads:4.16.1` **existe en Maven Central** (el proyecto lo resuelve); se inicializa con el **Game ID `800423692`**, bloques `BP_Rewarded_Android` y `BP_Interstitial_Android`, y **`UNITY_TEST_MODE=false` por defecto → anuncios REALES** (con ingresos). Se carga cada bloque, se muestra, y la recompensa solo se da si el anuncio se **completa** (`COMPLETED`); el intersticial nunca castiga si no hay anuncio. Se le pasa a Unity el consentimiento (UMP).
- **No verificable aquí (hazlo con `VERIFICAR_ANUNCIOS.md`):** que ese Game ID y esos bloques sean de tu proyecto y estén activos; que haya relleno; que la UE reciba el formulario (el ID de AdMob incluido es de prueba: en EEE/Reino Unido/Suiza no se iniciarán anuncios hasta que pongas el tuyo).
- **Aviso importante antes de publicar:** `PRIVACY_URL` sigue siendo el relleno `https://TU-DOMINIO/privacidad.html`. Publica `privacy.html` en tu dominio y define el secreto.

## Errores encontrados y corregidos (todos relacionados con anuncios)
1. **Los avisos de la tienda desaparecían al instante.** `renderShop()` volvía a dibujar la tienda y borraba el mensaje justo después de mostrarlo: **«No hay anuncios disponibles», «Debes ver el anuncio completo», «¡Gracias por apoyar el juego!»** nunca se veían (el botón parecía no hacer nada). Ahora el mensaje sobrevive 6,5 s.
2. **Android — sin red al abrir = sin anuncios hasta reiniciar.** El estado del consentimiento solo se pedía al abrir la app; si fallaba, Unity no arrancaba jamás. Ahora **se reintenta al volver a la app**, y si no se pudo averiguar y el teléfono **no** está en EEE/Reino Unido/Suiza (ni por idioma ni por SIM/red), se permite iniciar Unity igualmente. En la duda, no se inician.
3. **Android — «no hay anuncios» al instante aunque se estuviera cargando** (por ejemplo, justo al abrir la app). Ahora espera hasta ~4 s a que termine de cargar.
4. **Varios toques seguidos** en «Ver anuncio» o «Revivir» lanzaban varias peticiones; ahora solo una.
5. **Intersticial colgado = botones bloqueados 3 minutos.** Ahora, si la app nativa no responde en 45 s, el juego continúa.
6. Mientras carga, aparece **«Cargando anuncio…»**.

## Búsqueda general de errores
- **Pruebas de estrés automáticas (≈ 30 minutos, 6 corridas, modos Casual y Completo, 4 mundos):** ≈ 2 600 acciones aleatorias (teclas, ratón, ~1 700 clics en botones de todos los paneles, teleportes, hordas de hasta 50 zombis, día/noche/lluvia, heridas y pérdidas de miembros al azar, guardado, diálogos, dormir, coches, construcción, señal del helicóptero, muertes y reinicios). **0 errores de JavaScript, 0 errores de consola, 0 errores «silenciosos»** (contador interno del juego) y **0 congelaciones > 400 ms**; la memoria se mantuvo en 29–60 MB.
- **Análisis estático (ESLint) de 1,6 MB de código:** sin errores reales. Hallazgos inofensivos: tres funciones definidas con `window.` (el analizador no las ve), una clave duplicada en el objeto de depuración y tres autoasignaciones sin efecto.
- **Guardar → recargar → continuar** (con miembros perdidos, órganos, heridas, infección, inventario y un refugiado escoltado): todo idéntico.
- **Contrato anuncios ↔ Android** con un puente simulado: 14 comprobaciones (anuncio completo/saltado/sin relleno, tope diario, espera de 60 s, revivir, intersticial con y sin «Sin anuncios», puente colgado, doble toque).
- Regresión: v96, v95, v94, v93, v91, techos, v90, mapa, Modo Asedio, menú y el final de 180 s del helicóptero.

## Límites y pendientes
- **No pude compilar el APK** (no hay Android SDK aquí). Los cambios de `MainActivity.java` pasaron revisión manual y de sintaxis con `javac`, y usan solo APIs ya presentes en el archivo o estándar de Android. **Compila con tu flujo habitual (GitHub Actions) y prueba en un teléfono**; si algo no compilara, dímelo y lo corrijo. Se incluye una copia suelta de `MainActivity.java`.
- Unity Ads **4.21.0** ya existe (el proyecto usa 4.16.1). No lo cambié a ciegas; si quieres, lo actualizo cuando puedas compilar.
- Dos pruebas antiguas (`test_npc88` y partes en tiempo real de `test_v95`) son intermitentes por azar, no por esta versión.
