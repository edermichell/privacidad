# Mini 2 Bridge (iPhone / iPad)

Versión iOS del puente: abre la interfaz `dji-mini2-control.html` dentro de la app y la conecta al
**DJI Mini 2** (con el vídeo en vivo incluido).

```
Mini 2 ⇄ RC-N1 ⇄(cable Lightning/USB-C)⇄ iPhone ── app Mini 2 Bridge ─► WKWebView con la interfaz
                                                     └─ WebSocket 127.0.0.1:8765 (comandos, telemetría, vídeo JPEG)
```

> ✅ **Estado:** el código **compila** con Xcode 16.4 contra DJI-SDK-iOS 4.16 en un servidor macOS de GitHub
> (ver «Compilar en la nube»). ⚠️ **Nunca se ha probado con un dron real.** La parte del vídeo
> (`DJIVideoPreviewer` + `snapshotPreview`) es la más delicada. Prueba **sin hélices** primero y luego en
> espacio abierto con el RC-N1 en la mano.

## Compilar en la nube (sin Mac)
El flujo `.github/workflows/ios-build.yml` compila el proyecto en un servidor macOS de GitHub Actions
(`macos-15`; las etiquetas `macos-13/14` ya no existen) y deja un **IPA sin firmar**:

1. Sube cambios a la rama o lanza el flujo a mano (*Actions → Compilar iOS → Run workflow*).
2. Cuando termine, abre la ejecución y descarga el artefacto **`Mini2Bridge-unsigned-ipa`** (zip con el `.ipa`).
   Si falla, el artefacto `xcodebuild-log` trae el registro completo.
3. **Instálalo en tu iPhone** firmándolo con tu Apple ID: [Sideloadly](https://sideloadly.io) o AltStore
   (Windows/macOS). Con cuenta gratuita caduca a los 7 días (hay que reinstalar).
4. **App Key de DJI:** guarda tu clave como secreto del repositorio `DJI_APP_KEY`
   (*Settings → Secrets and variables → Actions*). El flujo la inyecta en `project.yml`.
   ⚠️ Queda dentro del IPA, y en un repositorio **público** cualquier usuario con sesión de GitHub puede
   descargar los artefactos: si eso te importa, usa un repositorio privado. Sin secreto, la app compila pero
   **no podrá registrar el SDK**.

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
