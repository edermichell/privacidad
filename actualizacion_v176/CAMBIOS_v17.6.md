# Último Refugio 17.6 «Más ligero» (versionCode 167)

## 1. El aviso de Google sobre «SDK anterior»

No puedo ver tu Play Console, así que revisé todo lo que Google suele marcar y lo dejé al día. La app ya apuntaba a **Android 16 (targetSdk 36)**, el nivel más reciente, así que el aviso **no** era por el nivel de API. Era por las **bibliotecas**, que no se habían tocado desde la versionCode 86:

| Biblioteca | Antes | Ahora |
|---|---|---|
| Unity Ads (anuncios) | 4.16.1 | **4.22.0** |
| Google Play Billing (compras) | 8.0.0 | **9.1.0** |
| UMP (formulario de consentimiento RGPD) | 3.0.0 | **4.0.0** |
| ID de publicidad | 18.1.0 | **18.3.0** |
| In-App Updates | 2.1.0 | 2.1.0 (ya era la última) |

Además, Play Console avisa de **«APIs o parámetros obsoletos para pantalla de borde a borde»** a las apps con targetSdk 35+. La app usaba justo los que lista:
- `statusBarColor` / `navigationBarColor` en el tema → **quitados** (las barras van ocultas: no se veían).
- `windowLayoutInDisplayCutoutMode = shortEdges` (obsoleto desde Android 15) → la zona de la cámara se ajusta desde el código: **ALWAYS** en Android 11+, bordes cortos en Android 9-10.
- `setSystemUiVisibility` / `SYSTEM_UI_FLAG_*` → **WindowInsetsController** en Android 11+ (las banderas antiguas solo quedan para Android 7-10, donde no están obsoletas).
- `getDefaultDisplay()` → `getDisplay()` en Android 11+.
- `setAllowFileAccessFromFileURLs/UniversalAccess(false)` → **quitadas**: ya valen `false` por defecto. No cambia cómo carga el juego ni dónde guarda las partidas.

**Comprobado con una compilación real** (Gradle + SDK de Android 36, como en Android Studio):
- Compila y genera el `.aab` (versionCode 167, targetSdk 36).
- **Cero avisos de APIs obsoletas en el código propio.** Los 28 que quedan son de la API clásica de Unity Ads (ver abajo).
- Todas las bibliotecas nuevas admiten tu mínimo (Android 7.0, API 24).
- **Páginas de 16 KB:** Unity Ads 4.22 trae por primera vez una biblioteca nativa (`libunitycoherencenative.so`, ~0,5-0,65 MB por teléfono). Google Play exige desde noviembre de 2025 que estas bibliotecas estén alineadas a 16 KB: **lo están** (comprobado con `readelf` y `zipalign -P 16`).

**Pendiente, a propósito:** Unity Ads 4.22 marca como «obsoleta» su API clásica (`initialize`/`load`/`show`), que es la que usa la app. **Sigue funcionando en 4.22.** No la cambié porque sin un teléfono para ver anuncios reales no puedo comprobar que el cambio no rompa tus ingresos. Hay que hacerlo antes de que Unity saque la 5.x (que la quitará), con pruebas en un teléfono.

**Si el aviso de Google sigue apareciendo después de subir la 17.6**, mándame una captura del texto exacto: así sé qué SDK concreto señala.

## 2. Rendimiento: no dibujar lo que no se ve

Medí cuánta CPU gasta el juego en cada situación (procesador frenado ×4, como un teléfono modesto):

| Situación | 17.5 | **17.6** |
|---|---|---|
| Jugando | 96 % | 97 % (sin cambios) |
| Menú de pausa | 18 % | 21 % (ya iba frenado) |
| **Mochila abierta** | 94 % | **51 %** |
| **Fabricar abierto** | 91 % | **56 %** |
| **Mapa abierto** | 97 % | **54 %** |
| **Menú principal** | 83 % | **66 %** |

- **Qué pasaba:** con la mochila, fabricar, estado o el mapa abiertos (paneles que tapan el 97 % de la pantalla), el juego seguía dibujando la ciudad entera ~50 veces por segundo detrás.
- **Ahora:** con un panel que tapa al menos el 85 % de la pantalla, el mundo se dibuja **6 veces por segundo**; en el menú principal, **30**.
- **La simulación no cambia:** los zombis se siguen acercando mientras miras la mochila, como antes. Al cerrar el panel se vuelve a dibujar en el siguiente cuadro.
- El tiempo que no se dibuja se acumula: relojes, textos flotantes y efectos no se retrasan.
- Esos cuadros **no cuentan para la calidad automática**. Si contaran, creería que el teléfono va sobrado, subiría la calidad y la cámara cambiaría de zoom al cerrar el panel.
- **Resultado para el jugador:** menos calor y menos batería mientras organiza la mochila, fabrica o mira el mapa, que es mucho tiempo de juego.

## Archivos
- `prueba_v176.js`: 12 comprobaciones (ritmo de dibujo, reloj, mundo vivo, cierre inmediato, paneles, calidad automática, menú).
- `medir_cpu_en_reposo.js`: la medición de la tabla.
- `parche_android_v176.py`: los cambios de Java, del tema y de las bibliotecas.

**Cambia la parte Java y las bibliotecas:** compílala en Android Studio. Necesita internet la primera vez para descargar las bibliotecas nuevas. La política de privacidad y los permisos no cambian.
