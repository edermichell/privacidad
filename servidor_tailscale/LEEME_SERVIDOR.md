# Último Refugio · servidor multijugador por salas (Tailscale)

Tu PC hace de servidor: varias **salas** (cada una es un mundo propio, hasta **10 jugadores**), que se guardan solas. Los jugadores entran desde el móvil por **Tailscale** (red privada: nada queda abierto a internet).
En el juego, el botón del menú ahora es **MULTIJUGADOR**: arriba, las **salas del servidor**; abajo, el **COOP de misma red** (hasta 4, como antes, sin servidor).

## Cómo funciona
- `servidor.js` sirve el juego, hace de relé para que los jugadores se encuentren y mantiene los anfitriones: un navegador sin pantalla (Edge en Windows) por cada sala activa.
- Cada anfitrión es un jugador «fantasma»: no come, no muere, no atrae zombis y los jugadores no lo ven. Los zombis y civiles persiguen solo a los jugadores reales.
- **Salas que duermen:** una sala sin jugadores durante `dormirTrasMin` minutos se guarda y se cierra (no gasta nada). Al pulsar **UNIRSE** en una sala dormida, el servidor la despierta (5–30 s) y continúa donde quedó.
- **Límite de salas activas** (`salasActivasMax`, por defecto 2) para no saturar el PC.
- Con la sala vacía el mundo está **en pausa** (por defecto): el tiempo y los zombis solo avanzan cuando hay gente.
- Solo escucha en `127.0.0.1` y en tu dirección de Tailscale (`100.x.x.x`).

## Tus datos de Tailscale (de las capturas)
Máquina **Servidor** (`HPDERUBI`, Windows 11), IPv4 `100.70.104.87`, nombre completo `server.tail12bbaa.ts.net`. En el juego se escribe: **`100.70.104.87:8080`** (o `servidor:8080` si MagicDNS está activo en el móvil). Si cambia la IP, el servidor lo detecta solo; la dirección actual aparece en la ventana del servidor y en `http://100.70.104.87:8080/`.

## Instalación en Windows
1. Copia esta carpeta al PC servidor (por ejemplo `C:\UltimoRefugioServidor`).
2. Doble clic en **`INSTALAR_WINDOWS.bat`** (Node.js con `winget` si falta, y los componentes del servidor). Si pide cerrar y repetir, hazlo. Tailscale ya lo tienes.
3. Clic derecho → *Ejecutar como administrador* en **`ABRIR_FIREWALL_TAILSCALE.bat`** (una vez): abre el puerto **solo para direcciones de Tailscale**.
4. Doble clic en **`INICIAR_SERVIDOR.bat`** y deja la ventana abierta. Comprueba `http://100.70.104.87:8080/` desde el móvil.
5. Para 24/7: **`EVITAR_SUSPENSION_WINDOWS.bat`** (no suspender, ni al cerrar la tapa, enchufado) y **`AUTOARRANQUE_WINDOWS.bat`** (arranca al iniciar sesión).
> Si es un portátil: enchufado y ventilado; si se calienta mucho, baja `maxJugadores` o `salasActivasMax`.

## Cómo entran los jugadores
1. Tailscale activo en su móvil y con acceso a tu red (o tú compartes la máquina *Servidor* desde el panel de Tailscale: *Machines → Share*).
2. En el juego: **MULTIJUGADOR** → escribir `100.70.104.87:8080` → **ACTUALIZAR** → elegir una sala → **UNIRSE**. La dirección se recuerda.
   - Con la **app de Android (APK v13.7)** o con el juego en el navegador (`http://100.70.104.87:8080/juego/`; en el navegador la dirección ya viene escrita).
3. **COOP misma red** (hasta 4, sin servidor): igual que antes, en el mismo menú.

## Ajustes (`config.json`)
| Clave | Qué hace |
|---|---|
| `puerto` | Puerto (8080). Si lo cambias, edita también `ABRIR_FIREWALL_TAILSCALE.bat`. |
| `salas` | Lista de salas: `id` (4–6 letras/números, único), `nombre`, y opcionalmente `semilla`, `modo`, `tamano`… propios de esa sala. Añadir una sala = añadir una línea. |
| `maxJugadores` | Jugadores por sala (1–10). |
| `salasActivasMax` | Salas despiertas a la vez. Cada una usa ~0,5–1 GB de RAM y CPU (ver «Rendimiento»). |
| `dormirTrasMin` | Minutos sin jugadores antes de dormir la sala (0 = nunca). |
| `simularSinJugadores` | `false`: sala vacía en pausa. `true`: el mundo sigue sin gente, con el anfitrión aparcado lejos del punto de entrada (los zombis se acumulan con los días). |
| `fpsServidor` | Pasos por segundo del anfitrión (30 por defecto; menos CPU). |
| `guardarCadaSeg`, `copias` | Guardado automático (120 s) y copias a conservar (una cada 30 min). |
| `modo`, `dificultad`, `tamano`, `zombis`, `botin`, `lluvia`, `mundo`, `semilla` | Solo al **crear** el mundo de una sala nueva. |
| `escuchar` | `tailscale` (seguro) o `todas` (también tu red local; menos seguro). |
| `usarStunTurn` | `false`: solo conexiones directas (Tailscale/LAN). `true`: añade STUN público (necesita internet). |
| `navegador` / `canal` | Ruta de Chrome/Chromium o `"msedge"`/`"chrome"`. En Windows se usa Edge. |

## Datos y copias
Todo en `datos\`: `salas\<ID>\mundo_actual.json`, `salas\<ID>\copias\` y `servidor.log`. **Empezar una sala de cero:** apaga el servidor y borra `datos\salas\<ID>`. **Restaurar:** copia una copia sobre `mundo_actual.json` con el servidor apagado. Se guarda al cerrar con Ctrl+C; si se apaga de golpe se pierde, como mucho, lo jugado desde el último guardado.

## Rendimiento (medido en un PC de escritorio; tu portátil será más lento)
Una sala con **10 jugadores** y ~50–70 zombis: ≈ 45 % de un núcleo (anfitrión a 30 pasos/s, sin dibujar) y ~0,7 ms de simulación por paso. Más zombis y más jugadores dispersos suben el coste. Si ves tirones: baja `maxJugadores`, usa una sola sala activa o sube `dormirTrasMin`.

## Seguridad
- **No hay contraseñas:** cualquiera en tu Tailscale (o con quien compartas el PC) puede entrar y jugar. Los jugadores pueden hacer lo que permite el juego; el anfitrión valida golpes, pero no hay anti-trampas completo.
- Las rutas `/admin/*` solo responden desde el propio PC.
- La APK ahora permite conexiones `http` (necesario para hablar con tu servidor por Tailscale, que ya va cifrado). Solo se usa para la dirección que escribas.

## Actualizar el juego
Copia el nuevo `index.html` sobre `juego\index.html` y reinicia el servidor. **Todos deben usar la misma versión** (la APK v13.7 con el servidor sirviendo la v13.7).

## Linux
`bash linux/instalar.sh`; para 24/7 el servicio `linux/urefugio.service` (edita `USUARIO` y `RUTA`).

## Solución de problemas
- **«No se pudo conectar con el servidor»** en el juego: Tailscale activo en el móvil y en el PC, servidor encendido, regla de firewall, y la dirección con `:8080`.
- **La sala tarda en despertar:** la primera vez crea el mundo (hasta ~30 s). Si el servidor dice que ya hay `salasActivasMax` salas activas, espera a que una se vacíe y duerma.
- **«No se encontró la sala» / se queda en «conectando»:** reintenta; si persiste mira `datos\servidor.log`. Último recurso: `"usarStunTurn": true`.
- **Falta el navegador** (Linux/Mac): `npx playwright-core install chromium`.

## Qué está probado y qué no
**Probado (Linux, Chromium, una sola máquina):** instalación limpia; salas con mundos independientes; despertar/dormir y continuar el mundo; límite de salas activas (503); **10 jugadores en una sala** entrando por la lista, el 11.º rechazado, todos se ven entre sí, el anfitrión fantasma oculto, zombis que persiguen a los jugadores y no al anfitrión; reinicio automático tras caída; guardado al cerrar; COOP de misma red (2 y 4 jugadores) sin cambios.
**NO probado:** Windows (los `.bat`), **Tailscale real**, móviles reales (rendimiento, calor, pantalla bloqueada, reconexión), la APK dentro del servidor (no se compiló), 24 h reales seguidas, ni 10 jugadores con dibujo real en 10 dispositivos (en la prueba los invitados no dibujaban). La conexión directa móvil↔PC por Tailscale usa WebRTC con direcciones de Tailscale: debería funcionar, pero hay que confirmarlo.
