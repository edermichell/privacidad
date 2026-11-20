# Mini 2 Bridge (iPhone / iPad)

Versión iOS del puente: abre la interfaz `dji-mini2-control.html` dentro de la app y la conecta al
**DJI Mini 2** (con el vídeo en vivo incluido).

```
Mini 2 ⇄ RC-N1 ⇄(cable Lightning/USB-C)⇄ iPhone ── app Mini 2 Bridge ─► WKWebView con la interfaz
                                                     └─ WebSocket 127.0.0.1:8765 (comandos, telemetría, vídeo JPEG)
```

> ⚠️ **Estado: sin compilar ni probar con un dron real** (necesita un Mac con Xcode). Está escrito contra
> DJI Mobile SDK V4 para iOS (4.16.x) a partir de su API pública; es normal ajustar algún nombre/tipo al
> compilar. La parte del vídeo (`DJIVideoPreviewer` + `snapshotPreview`) es la más delicada. Prueba
> **sin hélices** primero y luego en espacio abierto con el RC-N1 en la mano.

## Requisitos
- Mac con **Xcode 14+**, **CocoaPods** y **XcodeGen** (`brew install cocoapods xcodegen`).
- iPhone/iPad con cable al RC-N1 (Lightning o USB-C según el cable). Cuenta de Apple (la gratuita sirve
  para instalar en tu propio dispositivo, caduca a los 7 días).
- Cuenta en <https://developer.dji.com> y una **App Key** de tipo *iOS* con el bundle id `com.mini2.bridge`.
  Comprueba que tu modelo/firmware está soportado por MSDK V4.

## Pasos
1. Pon tu App Key en `project.yml` (`DJISDKAppKey: PON_AQUI_TU_APP_KEY`).
2. En esta carpeta ejecuta:
   ```bash
   xcodegen generate     # crea Mini2Bridge.xcodeproj
   pod install           # instala DJI-SDK-iOS y DJIWidget
   open Mini2Bridge.xcworkspace
   ```
3. En Xcode: elige tu *Team* en *Signing & Capabilities* y tu dispositivo, y pulsa **Run**.
4. Enciende dron y RC-N1, conecta el iPhone al RC-N1 y abre la app (primera vez: necesita Internet para
   registrar el SDK).
5. La interfaz carga sola, conecta al WebSocket y muestra el vídeo. Abajo ves el estado del puente.

Si prefieres no usar XcodeGen: crea un proyecto iOS *App* (Swift, storyboard vacío), añade los `.swift` y
el `.h` de `Mini2Bridge/`, `index.html` como recurso, copia las claves de `Info.plist` que aparecen en
`project.yml` (App Key, protocolos de *External Accessory*, ATS) y apunta el *Bridging Header* al `.h`.

## Cómo se controla
Igual que en la versión Android (ver `../android-bridge/README.md`):
- Los sticks de la interfaz (táctiles, teclado o un mando Bluetooth/MFi conectado al iPhone) usan *Virtual
  Stick*, que el puente activa solo cuando hay movimiento y **desactiva tras 2 s de inactividad**,
  devolviendo el control al RC-N1. **Mientras está activo, los sticks del RC no pilotan.**
- Si la interfaz deja de enviar datos 500 ms, manda stick a cero (frena y mantiene posición).
- Implementado: despegar, aterrizar, RTH, confirmar aterrizaje, parada de emergencia, foto, grabar, gimbal,
  punto de origen, altura/distancia máxima, altura de RTH, acción ante pérdida de señal y calibración de brújula.
- **No implementado** (responde `ack ok:false`): QuickShots, Hyperlapse, Panorama, waypoints, zoom, ajustes de
  cámara (ISO, EV, resolución…) y señal del mando (`rc`/`vid` se muestran a 0). Hay `TODO` en `Bridge.swift`.
- Mientras esta app tiene el control, **DJI Fly no puede usarse a la vez**.

## Seguridad
El WebSocket solo escucha en loopback (`requiredInterfaceType = .loopback`): nadie en tu red puede pilotar.
No hay modo LAN en iOS (no hay servidor HTTP). Vuela en línea de vista, por debajo de 120 m y cumpliendo la
normativa local. Proyecto independiente, no afiliado a DJI.
