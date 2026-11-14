# Último Refugio · servidor multijugador por salas (Tailscale)

Tu PC hace de servidor: varias **salas** (cada una es un mundo propio, hasta **10 jugadores**), que se guardan solas. Los jugadores entran desde el móvil por **Tailscale** (red privada: nada queda abierto a internet).
En el juego, el botón del menú es **MULTIJUGADOR**: arriba, las **salas del servidor** (aparecen solas, sin escribir la dirección), con **salas oficiales**, **salas de jugadores públicas o privadas** y **«Buen anfitrión»** (salas 24/7); abajo, el **COOP de misma red** (hasta 4, sin servidor).

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

## Publicar sin Tailscale (que cualquiera pueda jugar)
Desde la v14.0 el juego se conecta al servidor por **WebSocket** (ya no usa WebRTC con las salas): basta con que el servidor sea **alcanzable por internet con HTTPS**. Los jugadores **no instalan nada**: solo la app (o el juego en el navegador) y las salas aparecen solas. Los jugadores con Tailscale siguen entrando igual.
**Opción recomendada: Tailscale Funnel** (la tienes casi lista: tu máquina ya tiene HTTPS/MagicDNS):
1. Ejecuta **`PUBLICAR_FUNNEL.bat`** (si falta permiso, Tailscale muestra un enlace para activar *Funnel* en tu panel).
2. Copia la dirección `https://….ts.net` que muestra (para ti: `https://server.tail12bbaa.ts.net`) y ponla en `config.json` → `"urlPublica"`. Reinicia el servidor.
3. Prueba desde un móvil **sin** Tailscale (datos móviles): abre `https://server.tail12bbaa.ts.net/` y luego el juego → MULTIJUGADOR. La app v14.0 ya trae esa dirección como primera opción.
4. Para dejar de publicarlo: **`QUITAR_FUNNEL.bat`**.
**Otras opciones** (para cualquier dirección HTTPS que llegue a `127.0.0.1:8080`): Cloudflare Tunnel (gratis, sin abrir puertos), o abrir el puerto 8080 en el router con un nombre dinámico y un proxy HTTPS (Caddy). En ese caso pon `"escuchar": "todas"` solo si el puerto va directo, y escribe esa dirección en `urlPublica`; en la app, «Cambiar servidor».
**Lo que debes saber antes de publicarlo**
- **Subida de tu internet:** cada jugador consume ~30–60 KB/s de subida del PC (10 jugadores ≈ 4 Mbit/s). Funnel además tiene límites de ancho de banda de Tailscale (no garantizados).
- **Seguridad:** el panel `/admin`, las licencias, el guardado y la verificación **solo abren desde el propio PC y sin pasar por el proxy** (probado: detrás de un proxy público dan 404/403; nadie de fuera puede hacerse pasar por anfitrión). Públicos quedan: el juego, la lista de salas, crear salas (con límites), y el WebSocket de jugadores (identidad verificada, baneos, límite de conexiones por IP `maxConexionesPorIp`, límite de mensajes).
- **Abuso:** al ser público, cualquiera puede crear salas gratis y despertar salas (hasta `salasActivasMax`). Si no quieres salas de jugadores: `"salasUsuario": false`. Baja `salasUsuarioMax`/`gratisSalasMax` si hace falta, y usa el panel para expulsar/banear.
- **Privacidad:** el servidor ve la IP de los jugadores (solo para límites; no se guarda en disco) y sus nombres de sala. Actualiza tu política de privacidad.

## Cómo entran los jugadores
0. **Sin Tailscale:** si publicaste el servidor (arriba), solo necesitan la app v14.0: MULTIJUGADOR → las salas aparecen. Lo siguiente es para quien use Tailscale.
1. Tailscale activo en su móvil y con acceso a tu red (o tú compartes la máquina *Servidor* desde el panel de Tailscale: *Machines → Share*).
2. En el juego: **MULTIJUGADOR** → las salas aparecen solas → **UNIRSE**. El juego trae de fábrica `100.70.104.87:8080` y `server.tail12bbaa.ts.net:8080` (cambiables en «Cambiar servidor»); recuerda el último que funcionó.
   - Con la **app de Android (APK v13.8)** o con el juego en el navegador (`http://100.70.104.87:8080/juego/`).
3. **COOP misma red** (hasta 4, sin servidor): igual que antes, en el mismo menú.

## Salas de jugadores (públicas y privadas) y «Buen anfitrión»
- **Cualquier jugador** puede **crear una sala**: *MULTIJUGADOR → + CREAR SALA*, con nombre y tipo **pública** (sale en la lista) o **privada** (solo entra quien tenga el **código de 6 letras**, con *ENTRAR CON CÓDIGO*). El dueño ve en su sala los botones CÓDIGO, HACER PÚBLICA/PRIVADA y BORRAR.
- **Gratis:** 1 sala por jugador (`gratisSalasMax`); se duerme sin jugadores y se **borra tras 14 días** sin nadie (`gratisCaducaDias`).
- **«Buen anfitrión»** (licencia con vencimiento): más salas (según la licencia) y **salas 24/7**: no se duermen, no caducan y están siempre listas (sin esperar a que despierten). Cupo en el servidor: `salas247Max` (y siempre queda un hueco libre de `salasActivasMax`).
- **Dueño sin cuentas:** cada dispositivo genera una identidad (id + clave) y el servidor guarda solo el *hash* de la clave. Si el jugador reinstala o cambia de móvil, pierde el control de sus salas y su licencia (limitación actual).
- **Dar una licencia:** `GENERAR_LICENCIA.bat` (o `node servidor.js --licencia 30 3` = 30 días, 3 salas) imprime un código `BA-XXXX-XXXX`; el jugador lo escribe en *MULTIJUGADOR → Buen anfitrión → CANJEAR* (cuenta los días desde que lo canjea; un código sirve para un solo jugador). Funciona con el servidor encendido. Si la licencia vence, sus salas 24/7 pasan a gratis.
- **Venderlo dentro de la app:** ver `PRODUCTO_BUEN_ANFITRION.md`. **Hoy no cobra nada**: el producto está **solo en la Tienda** (no aparece en las salas); dice «Precio por definir» y se canjea allí con códigos que tú entregas. Quien tiene la licencia ve el interruptor «sala siempre abierta» al crear una sala.

## Moderación: reportes, expulsión, baneos y reiniciar la sala
- **Identidad verificada:** al entrar a una sala del servidor el juego demuestra la identidad del dispositivo (sin enviar la clave); así los baneos y reportes se pueden asociar a un jugador y no se puede suplantar a otro. **Los clientes anteriores a la v13.9 no pueden entrar a las salas** (`exigirIdentidad: false` lo desactiva, pero entonces no hay baneos fiables).
- **Reportar:** *Pausa → MULTIJUGADOR → «Reportar un jugador»* (trampas, tóxico, molestar, otro). Solo puede reportar quien está en la sala. Con `reportesParaExpulsar` (3) reportes de jugadores distintos en 24 h, el jugador es **expulsado** automáticamente (no baneado).
- **Dueño de la sala:** *Pausa → MULTIJUGADOR → ADMINISTRAR MI SALA* (o desde la lista): **expulsar**, **banear/quitar baneo**, ver **reportes** (ignorar), **REINICIAR SALA** (recarga con su mundo guardado y desconecta a todos) y **NUEVO MUNDO** (archiva el actual en `copias\anterior_*.json` y empieza otro).
- **Administrador (tú, en el PC):** doble clic en **`ABRIR_PANEL_ADMIN.bat`** o escribe `http://127.0.0.1:8080/admin` en el navegador **del PC servidor** (también hay un botón en `http://127.0.0.1:8080/`). **No abre** con la dirección pública, ni con la de Tailscale desde otro dispositivo (por seguridad); en ese caso muestra un aviso que lo explica. Para administrar desde otro dispositivo define `"claveAdmin"` en `config.json` (usuario `admin` + esa clave; úsalo solo por HTTPS; 8 claves erróneas bloquean 10 min). Cada acceso denegado queda en `datos\servidor.log` con el motivo (`[admin] acceso denegado…`). Contenido: todas las salas con sus jugadores, reiniciar/dormir/nuevo mundo/borrar, reportes de todas las salas, **baneo en todo el servidor**, quitar baneos y generar licencias. Las salas oficiales solo las gestionas tú desde ahí.
- Los reportes y baneos se guardan en `datos\reportes.json` y `datos\bans.json`.

## ¿Qué se conserva en el servidor? (probado)
- **Sí se conserva** al dormir/despertar la sala y al apagar/encender el servidor: lo que construyen los jugadores con el sistema de construcción (paredes, puertas, casas, muebles), el **contenido de las cajas y muebles de almacenaje**, los objetos soltados en el suelo, los candados y sus códigos, y lo destruido sigue destruido.
- **Loot finito:** el juego no tiene reaparición de botín: lo que un jugador saca de un contenedor o gasta **no vuelve** (el contenedor queda vacío para todos).
- **Límite importante:** la **mochila de cada jugador vive en su dispositivo**. Un cliente modificado podría duplicar objetos; el servidor no lo detecta. Por eso existen los reportes/baneos. Un inventario controlado por el servidor es un cambio grande (no hecho).

## Candados de código, almacenaje y robos
- **Candado de código** (se fabrica: 6 clavos + cinta, con martillo): en puertas y muebles de almacenaje **que construyas**. Eliges 4 números y los compartes. El anfitrión de la sala guarda el código (los demás jugadores solo saben que está cerrado) y limita los intentos (5 fallos = 60 s de espera); el dueño recibe avisos.
- **Robar (solo en salas del servidor):** forzar el candado con **ganzúa** (~11 s, silenciosa, puede romperse, 42 %) o **palanca** (~4 s, muy ruidosa, 85 %), o **romper a golpes** paredes, puertas, ventanas y almacenaje construidos (el hacha rinde más); al romper un mueble su contenido cae al suelo. El ruido atrae zombis. El anfitrión valida distancia y tiempos.
- **Limitación:** la protección frente a un cliente modificado es parcial (los contenidos viajan a los jugadores cercanos). Las casas del mundo original (no construidas por jugadores) conservan sus cerraduras de siempre.

## Ajustes (`config.json`)
| Clave | Qué hace |
|---|---|
| `puerto` | Puerto (8080). Si lo cambias, edita también `ABRIR_FIREWALL_TAILSCALE.bat`. |
| `salas` | Lista de salas: `id` (4–6 letras/números, único), `nombre`, y opcionalmente `semilla`, `modo`, `tamano`… propios de esa sala. Añadir una sala = añadir una línea. |
| `maxJugadores` | Jugadores por sala (1–10). |
| `salasActivasMax` | Salas despiertas a la vez (incluye las 24/7). Cada una usa ~0,5–1 GB de RAM y CPU (ver «Rendimiento»). |
| `claveAdmin` | Clave para abrir el panel de administración desde otros dispositivos (vacía = solo desde el propio PC). |
| `urlPublica`, `maxConexionesPorIp` | Dirección pública HTTPS (se muestra en la página de estado) y conexiones simultáneas por IP real (20). |
| `reportesParaExpulsar`, `exigirIdentidad` | Reportes distintos para expulsar automáticamente (3; 0 = nunca) y exigir identidad verificada para entrar (true). |
| `salasUsuario`, `salasUsuarioMax` | Permitir que los jugadores creen salas (true/false) y máximo de salas de jugadores (40). |
| `gratisSalasMax`, `gratisCaducaDias` | Salas gratis por jugador (1) y días sin jugadores antes de borrarla (14). |
| `salas247Max`, `simular247`, `licenciaSalasPorDefecto` | Cupo de salas 24/7; `simular247: true` hace que el mundo siga corriendo sin jugadores; salas por licencia (3). |
| `dormirTrasMin` | Minutos sin jugadores antes de dormir la sala (0 = nunca). |
| `appUltima` | (Opcional) Anuncia la última versión de la app: `{ "codigo": 146, "version": "14.9", "notas": ["…"] }` (`codigo` = versionCode de Google Play). La app Android avisa «hay una versión nueva» a quien tenga un código menor cuando abre la lista de salas. Sin este bloque no se anuncia nada (la app también se entera por Google Play por su cuenta). |
| `autoridadPersonaje` | `true` (por defecto). **v15.0:** el personaje de cada invitado (mochila, habilidades) se guarda en el servidor, por identidad, en `datos/salas/<SALA>/personajes/`, y se entrega al entrar. El teléfono ya no es la fuente: no sirve editar el guardado ni recuperar un personaje muerto. Las versiones antiguas de la app siguen jugando como antes, sin esta protección. |
| `muerteBorraPersonaje` | `"modo"` (por defecto): al morir se borra el personaje **solo en salas de modo `full`** (en `casual` se conserva, como hasta ahora). `true` = siempre, `false` = nunca. |
| `validarDano` | `true` (por defecto). **v15.0:** el servidor comprueba el daño que mandan los invitados (alcance, arma, cadencia). Los golpes imposibles se ignoran y se anotan en el registro (`daño rechazado…`); con muchos seguidos se expulsa al jugador. |
| `versionMinimaApp` | `0` (por defecto: no exigir). Un número de `versionCode` de la app (la v15.0 es **147**): quien tenga una versión menor no puede entrar y ve «actualiza la app». Úsalo cuando quieras cerrar la puerta a versiones sin protección. |
| `personajeCaducaDias` | `60`: se borran los personajes guardados que no se han tocado en tantos días. |
| `pvp` (en una sala) | `{ "id": "SALA4", "nombre": "Frontera PvP", "pvp": true }`. **Sala PvP (v15.2):** combate entre jugadores decidido por el servidor (arma que lleva, alcance, línea de visión, cadencia, puntería y daño), protección de 20 s al aparecer, zonas seguras a 10 casillas de comerciantes, aparición aleatoria en la costa, el cuerpo deja su botín al morir, cortar en pleno combate (20 s) = morir. Modo completo forzado, morir borra el personaje, exige la app 15.2+ (`versionCode 149`). Pruébala primero con testers. |
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
- **El panel `/admin` sale vacío:** usa la última versión de `servidor.js` y `admin.html` (deben estar los dos en la carpeta), reinicia el servidor y recarga con Ctrl+F5. Si falla, el panel ahora muestra el motivo en pantalla; también puedes abrir `http://127.0.0.1:8080/admin/api/estado` y mirar qué responde.
- **«No se pudo conectar con el servidor»** en el juego: Tailscale activo en el móvil y en el PC, servidor encendido, regla de firewall, y la dirección con `:8080`.
- **La sala tarda en despertar:** la primera vez crea el mundo (hasta ~30 s). Si el servidor dice que ya hay `salasActivasMax` salas activas, espera a que una se vacíe y duerma.
- **«No se encontró la sala» / se queda en «conectando»:** reintenta; si persiste mira `datos\servidor.log`. Último recurso: `"usarStunTurn": true`.
- **Falta el navegador** (Linux/Mac): `npx playwright-core install chromium`.

## Qué está probado y qué no
**Probado (Linux, Chromium, una sola máquina):** instalación limpia; salas con mundos independientes; **las salas aparecen solas (también desde `file://`, como la APK)**; **crear sala pública/privada, entrar con código, privada oculta de la lista, límite de salas gratis, canjear licencia, sala 24/7, borrar, ajena rechazada, licencia vencida y sala gratis inactiva borrada**; despertar/dormir y continuar el mundo; límite de salas activas (503); **10 jugadores en una sala** entrando por la lista, el 11.º rechazado, todos se ven entre sí, el anfitrión fantasma oculto, zombis que persiguen a los jugadores y no al anfitrión; reinicio automático tras caída; guardado al cerrar; COOP de misma red (2 y 4 jugadores) sin cambios.
**NO probado:** Windows (los `.bat`), **Tailscale real**, móviles reales (rendimiento, calor, pantalla bloqueada, reconexión), la APK dentro del servidor (no se compiló), 24 h reales seguidas, ni 10 jugadores con dibujo real en 10 dispositivos (en la prueba los invitados no dibujaban). La conexión directa móvil↔PC por Tailscale usa WebRTC con direcciones de Tailscale: debería funcionar, pero hay que confirmarlo.


## Mapa nuevo 960×960 (v14.5)
Ver `MAPA_NUEVO_960.md` (migración con copia de seguridad: `MIGRAR_A_MAPA_NUEVO.bat`; volver atrás: `VOLVER_AL_MAPA_ANTERIOR.bat`). Opciones por sala en `config.json`: dentro de cada elemento de `salas` puedes poner `"tamano"` (`small`, `big`, `huge`, `vast`, `colossal`), `"mundo"` y `"semilla"`. `"salasUsuarioActivasMax"` limita las salas de jugadores activas a la vez, aparte de `"salasActivasMax"` (oficiales).
