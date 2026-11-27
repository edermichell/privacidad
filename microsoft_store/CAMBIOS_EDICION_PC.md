# Edición PC (Microsoft Store / navegador) · basada en el juego 18.5

El juego es el **mismo `index.html` que el de Android (18.5, versionCode 175)**, con un módulo añadido (`herramientas/zpc.js`) y los archivos de PWA. Ese módulo solo se activa fuera de la app de Android, y el APK/AAB de Android no cambia.

## Qué cambia en PC
| En Android | En la edición PC |
|---|---|
| Anuncio con recompensa → caja extra, revivir, recuperar aliento, duplicar caja | Se dan **directamente**, sin anuncio. Mismos límites por día y tiempos de espera («Espera 60 s para la siguiente recompensa»). |
| Anuncio entre partidas | **Nunca.** |
| Tienda con compras de Google Play (Sin anuncios, Trajes, Pack Fundador, Cajas) y la tarjeta «Buen anfitrión» | La tienda pasa a llamarse **«Cajas y trajes»** (botón «CAJAS»): caja diaria, cajas extra, abrir cajas y trajes. **Sin compras.** Los trajes premium (solo estética) vienen incluidos; el traje y las ventajas del Fundador no. |
| «Privacidad y anuncios» abre la pantalla de Android | «Privacidad» abre `https://edermichell.github.io/privacidad/`. |
| Antes, en el navegador: anuncio simulado de 5 s y «MODO DEMO» con compras de mentira | Eliminado. |

## Archivos de PWA
- `manifest.webmanifest`: nombre, iconos (incluidos los *maskable*), pantalla completa y horizontal, y capturas.
- `sw.js`: la página se pide primero a la red (así las versiones nuevas llegan solas) y, sin conexión, se usa la copia guardada. El multijugador no pasa por el service worker.
- `icons/`: generados a partir de `icono_play_store_512.png`. El maskable es la escena sin el marco, con la cara dentro de la zona segura.

## Pruebas (`herramientas/testpc.js`, Chromium de escritorio a 1366 × 768)
Resultado: **10 de 10 correctas** (ver `RESULTADO_PRUEBAS_PC.txt`):
- manifest válido y service worker activo;
- menú y ayuda sin tienda ni anuncios, y nunca hay intersticial;
- «Cajas y trajes» sin compras: la caja extra llega al momento y respeta la espera;
- «Privacidad» abre la política;
- al morir, «Revivir (una vez por partida)» funciona sin anuncio;
- **sin conexión, el juego abre desde la caché**;
- sin errores de página.

Las capturas de `web/capturas/` y el arte de `arte_store/` salen de la propia edición PC a 1920 × 1080 (interfaz de escritorio, sin controles táctiles).

**No probado:** un Windows real con el paquete MSIX (aquí no hay Windows) ni el permiso de micrófono dentro de la app de Store.

## Regenerar para una versión nueva
```
python3 herramientas/build_pc.py <assets/index.html de Android> web <icono_play_store_512.png>
W=$PWD/web node herramientas/testpc.js
```
Después, sube el contenido de `web/` al repo `ultimo-refugio`.
