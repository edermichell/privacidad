# Último Refugio · servidor cooperativo en tu PC (con Tailscale)

Convierte tu PC en un servidor: el mundo vive en tu PC, se guarda solo y tus amigos entran desde el móvil por **Tailscale** (red privada: nada queda abierto a internet).

## Cómo funciona
- `servidor.js` hace tres cosas: **sirve el juego** (`/juego/`), hace de **relé de salas** (así los jugadores se encuentran sin depender de ntfy.sh) y mantiene un **anfitrión permanente**: un navegador sin pantalla (Edge/Chrome) que carga tu mundo guardado y abre la sala.
- El anfitrión es un jugador «fantasma»: no come, no muere, no atrae zombis. Los zombis y civiles persiguen solo a los **jugadores reales** conectados.
- Solo escucha en `127.0.0.1` y en tu dirección de Tailscale (`100.x.x.x`). Si Tailscale no está activo, solo se juega desde el propio PC (se detecta solo cuando lo activas).
- **Jugadores reales: hasta 3** a la vez (el anfitrión fantasma ocupa el 4.º sitio; el juego dirá «máximo 4 jugadores»).
- Por defecto, **el mundo se pausa cuando no hay jugadores** (no gasta CPU y el mundo no se llena de zombis sin nadie). Puedes cambiarlo (ver `simularSinJugadores`).

## Instalación en Windows (PC o portátil)
1. Copia esta carpeta al PC (por ejemplo `C:\UltimoRefugioServidor`).
2. Doble clic en **`INSTALAR_WINDOWS.bat`** (instala Node.js y Tailscale con `winget` si faltan, y los componentes del servidor). Si dice que cierres y repitas, hazlo.
3. Abre **Tailscale** (icono junto al reloj) e inicia sesión. Anota la dirección `100.x.x.x` de este PC (o su nombre en el panel de Tailscale).
4. Clic derecho → *Ejecutar como administrador* en **`ABRIR_FIREWALL_TAILSCALE.bat`** (una sola vez): abre el puerto **solo para direcciones de Tailscale**.
5. Doble clic en **`INICIAR_SERVIDOR.bat`**. Deja la ventana abierta. La primera vez crea el mundo (≈ 10 s); las siguientes continúa el guardado.
6. Opcional para 24/7: **`EVITAR_SUSPENSION_WINDOWS.bat`** (no suspender, ni al cerrar la tapa, enchufado) y **`AUTOARRANQUE_WINDOWS.bat`** (arranca al iniciar sesión).

> Portátil como servidor: déjalo enchufado y ventilado; si la batería está hinchada o se calienta mucho, no lo uses 24/7.

## Cómo entran los jugadores
1. Cada jugador instala **Tailscale** en su móvil y entra a **tu red** (o tú le **compartes** este PC desde el panel de Tailscale: *Machines → Share*, y él lo acepta con su propia cuenta). Revisa los límites de tu plan en tailscale.com.
2. En el navegador del móvil (Chrome) abre: `http://100.x.x.x:8080/juego/` (la dirección exacta aparece en la ventana del servidor y en `http://100.x.x.x:8080/`).
3. En el juego: **COOPERATIVO** → el código de sala (`REFUGI` por defecto) ya viene escrito → **UNIRSE**.
4. Consejo: en Chrome, menú ⋮ → *Añadir a la pantalla de inicio* para abrirlo como app.

La página `http://100.x.x.x:8080/` muestra el estado (jugadores, zombis, día) y el código de sala; `/estado` lo da en JSON.

## Ajustes (`config.json`)
| Clave | Qué hace |
|---|---|
| `puerto` | Puerto (8080). Si lo cambias, edita también `ABRIR_FIREWALL_TAILSCALE.bat`. |
| `sala` | Código de sala, 4–6 letras/números. |
| `semilla`, `modo`, `dificultad`, `tamano`, `zombis`, `botin`, `lluvia`, `mundo` | Solo al **crear un mundo nuevo** (modo `casual`/`full`, tamaño `huge`…). Para empezar de cero, apaga el servidor y borra `datos\mundo_actual.json` y la carpeta `datos\perfil`. |
| `maxJugadores` | 1–3 jugadores reales. |
| `simularSinJugadores` | `false` (defecto): el mundo se pausa vacío. `true`: sigue corriendo con el anfitrión aparcado lejos del punto de entrada (la población de zombis crece con los días). |
| `guardarCadaSeg` / `copias` | Guardado automático (120 s) y cuántas copias conservar (12; se hace una cada 30 min). |
| `escuchar` | `tailscale` (defecto, seguro) o `todas` (también tu red local; **menos seguro**). |
| `usarStunTurn` | `false`: solo conexiones directas (Tailscale/LAN). `true`: añade servidores STUN/TURN públicos (necesita internet). |
| `navegador` / `canal` | Ruta de un Chrome/Chromium, o `"msedge"` / `"chrome"`. En Windows se usa Edge por defecto. |

## Datos y copias de seguridad
Todo está en `datos\`: `mundo_actual.json` (último guardado), `copias\` (una copia cada 30 min, se conservan 12), `servidor.log` (registro) y `perfil\` (datos del navegador del anfitrión). Para **restaurar** una copia: apaga el servidor, copia la copia sobre `mundo_actual.json`, borra `datos\perfil` y arráncalo.
El servidor guarda al cerrarlo con Ctrl+C. Si se apaga de golpe se pierde, como mucho, lo jugado desde el último guardado (≤ `guardarCadaSeg`).

## Seguridad
- No hay contraseñas: **cualquiera que esté en tu Tailscale (o al que compartas el PC) puede entrar y jugar**. Compártelo solo con quien quieras. Según la documentación de Tailscale, un equipo compartido solo expone ese equipo, no el resto de tu red (compruébalo en tu panel).
- Los jugadores pueden hacer lo que permite el juego; el anfitrión valida golpes, pero **no hay anti-trampas completo**.
- Las rutas `/admin/*` solo responden desde el propio PC.

## Actualizar el juego
Copia el nuevo `index.html` del juego sobre `juego\index.html` y reinicia el servidor (el servidor le añade el modo servidor automáticamente; si el juego cambia mucho puede avisar de que falta algún texto esperado). **Todos los jugadores usan la misma versión**, porque el navegador carga el juego desde el servidor.

## Linux
`bash linux/instalar.sh` y, para 24/7, el servicio `linux/urefugio.service` (edita `USUARIO` y `RUTA`). Tailscale: `curl -fsSL https://tailscale.com/install.sh | sh && sudo tailscale up`.

## Solución de problemas
- **«No se detecta Tailscale»** en el log: abre Tailscale e inicia sesión; el servidor lo detecta solo en ≤ 10 s.
- **El móvil no abre la página**: comprueba que Tailscale está activo en el móvil y en el PC, la regla del firewall y la dirección `100.x.x.x`.
- **«No se encontró la sala»**: el anfitrión no está listo (mira `/estado`) o el código es otro.
- **Se queda en «conectando»**: reintenta; si persiste, revisa que ambos están en Tailscale y no usan «exit node» raro. Como último recurso pon `"usarStunTurn": true`.
- **Falta el navegador** (Linux/Mac): `npx playwright-core install chromium`.

## Qué está probado y qué no
**Probado (Linux, Chromium, todo en una misma máquina):** arranque desde una instalación limpia, mundo nuevo y continuar el guardado, 3 invitados entrando por código con el relé propio, el 4.º rechazado, zombis que ignoran al anfitrión y persiguen a los invitados, pausa/reanudación con y sin jugadores, reinicio automático si el navegador se cierra, guardado al cerrar, unos 2 días de juego acelerados (con y sin jugadores) sin errores, y ≈ 25 % de un núcleo con 3 invitados y ~25 zombis (CPU de escritorio; el anfitrión no dibuja ni suena).
**NO probado:** Windows (los `.bat` están sin ejecutar), **Tailscale real**, móviles reales (rendimiento, calor, reconexión al bloquear la pantalla), jornadas de 24 h reales, ni más de ~5 minutos con 3 jugadores a la vez. La conexión directa entre móviles y PC por Tailscale usa WebRTC con direcciones de Tailscale: debería funcionar, pero hay que confirmarlo.
La APK de Android **no** se conecta a este servidor todavía (solo el juego en el navegador); haría falta cambiar la app.
