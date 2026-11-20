# Mini 2 Bridge (Android)

App Android que conecta el **DJI Mini 2** con la interfaz web `dji-mini2-control.html` y la muestra
**dentro del propio celular** (con el vídeo del dron incluido).

```
Mini 2 ⇄ RC-N1 ⇄(USB)⇄ celular ── app Mini2 Bridge ──► WebView con la interfaz
                                      │  HTTP :8080  (sirve la interfaz)
                                      └─ WebSocket :8765  (comandos, telemetría, vídeo JPEG)
```

> ⚠️ **Estado: sin compilar ni probar con un dron real.** Está escrito contra DJI Mobile SDK V4 (4.16.x)
> a partir de su API pública. Es normal que haya que corregir algún nombre de clase/método al compilar.
> Pruébalo primero **sin hélices**, luego en un espacio abierto y con el mando RC en la mano.

## Requisitos
- Android Studio (Giraffe o superior, JDK 17) y un celular Android con depuración USB.
- Mini 2 + mando **RC-N1** (o RC-N1C) con su cable USB al celular.
- Cuenta en <https://developer.dji.com> y una **App Key** (tipo *Android*, package name `com.mini2.bridge`).
  Comprueba en la tabla de compatibilidad del SDK que tu modelo/firmware está soportado por MSDK V4.

## Pasos
1. Abre la carpeta `android-bridge/` en Android Studio y deja que sincronice Gradle
   (genera el wrapper si hace falta).
2. Pon tu App Key en `app/src/main/AndroidManifest.xml` (`PON_AQUI_TU_APP_KEY`).
3. Revisa `res/xml/accessory_filter.xml` contra el del proyecto de ejemplo de tu versión del SDK.
4. En cada compilación se copia `../dji-mini2-control.html` a `assets/index.html` (tarea `copyWebUi`).
   Si solo tienes esta carpeta, ya lleva una copia en `app/src/main/assets/index.html`.
5. Instala la app en el celular. La primera vez necesita Internet para registrar el SDK.
6. Enciende el dron y el RC-N1, conecta el celular al RC-N1 por USB y abre **Mini 2 Bridge**
   (acepta el diálogo de acceso USB).
7. Se abre la interfaz con la URL `http://127.0.0.1:8080/?bridge=1`: conecta sola al WebSocket y muestra
   el vídeo. Abajo a la izquierda ves el estado del puente.

## Cómo se controla
- **Sticks de la interfaz** (táctiles, teclado o un mando Bluetooth conectado al celular) → *Virtual Stick*.
  El puente lo activa solo cuando hay movimiento y lo **desactiva tras 2 s sin actividad**, devolviendo los
  sticks físicos del RC-N1. **Mientras está activo, los sticks del RC no pilotan.**
- Si la interfaz deja de enviar datos 500 ms, el puente manda stick a cero (el dron frena y mantiene posición).
- Despegar, aterrizar, RTH, cancelar RTH, confirmar aterrizaje, parada de emergencia, foto, grabar,
  gimbal, punto de origen, altura/distancia máxima, altura de RTH, comportamiento ante pérdida de señal y
  calibración de brújula están implementados.
- **No implementado** (responde `ack ok:false`): QuickShots, Hyperlapse, Panorama, misiones de waypoints,
  zoom, y ajustes de cámara (ISO, obturador, EV, resolución…). Hay un `TODO` en `Bridge.kt`.
- Mientras esta app tiene el control del dron, **DJI Fly no puede usarse a la vez**.

## Vídeo
`DJICodecManager` decodifica el H.264 a YUV; `Bridge.kt` lo convierte a JPEG (~15 fps, calidad 60) y lo envía
como mensajes binarios por el WebSocket. Si la imagen sale con colores raros, revisa `toNv21()` (formato
NV12 vs I420 según el dispositivo).

## Seguridad
- Por defecto (`Bridge.ALLOW_LAN = false`) los servidores solo escuchan en `127.0.0.1`: nadie en tu red
  puede pilotar. Si pones `true` para abrir la interfaz desde otro dispositivo
  (`http://IP-DEL-CELULAR:8080/?bridge=1`), **cualquiera en esa red podría controlar el dron**: no hay
  autenticación. Úsalo solo en una red privada tuya.
- Vuela en línea de vista, por debajo de 120 m y cumpliendo la normativa local. Esto es un proyecto
  independiente, no afiliado a DJI.
