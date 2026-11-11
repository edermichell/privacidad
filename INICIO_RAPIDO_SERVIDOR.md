# Cómo iniciar el servidor — paso a paso (Windows)

## PARTE A · Solo la primera vez

1. **Descomprime** `UltimoRefugio_Servidor_Tailscale.zip` en una carpeta fija, por ejemplo `C:\UltimoRefugioServidor`.
   Dentro de esa carpeta deben verse `servidor.js`, `config.json`, `INICIAR_SERVIDOR.bat`… (no los abras desde dentro del zip).
2. **Doble clic en `INSTALAR_WINDOWS.bat`.** Instala lo que falta (Node.js) y los componentes del servidor. Si al final dice que cierres la ventana y lo repitas, hazlo. Necesitas Microsoft Edge (viene con Windows) y conexión a internet.
3. **Abre Tailscale** (icono junto al reloj) y comprueba que tiene la sesión iniciada.
4. **Para que jueguen SIN instalar Tailscale:** doble clic en `PUBLICAR_FUNNEL.bat`.
   - Si muestra un enlace (por ejemplo «Funnel is not enabled»), ábrelo, acepta y vuelve a ejecutar el `.bat`.
   - Al final debe mostrar una dirección `https://….ts.net` (la tuya: `https://server.tail12bbaa.ts.net`).
5. **Abre `config.json` con el Bloc de notas** y comprueba que `"urlPublica"` tiene esa misma dirección. Guarda.
6. *(Opcional, para tenerlo 24/7)* `EVITAR_SUSPENSION_WINDOWS.bat` (que el PC no se duerma, enchufado) y `AUTOARRANQUE_WINDOWS.bat` (arranca solo al iniciar sesión).

## PARTE B · Cada vez que quieras el servidor encendido

1. **Doble clic en `INICIAR_SERVIDOR.bat`.** Se abre una ventana negra. **No la cierres.** Debes ver líneas como:
   - `Último Refugio · servidor multijugador…`
   - `Dirección pública configurada: https://…`
   - `[http] escuchando en http://127.0.0.1:8080/`
2. **Comprueba que funciona:** doble clic en `ABRIR_PANEL_ADMIN.bat` (se abre el panel en este PC). Las salas aparecen como «dormida»: es normal, despiertan solas cuando entra alguien.
3. **Prueba desde un móvil con datos móviles** (Wi-Fi apagado, sin Tailscale): abre la app **v14.0** → MULTIJUGADOR → aparecen *Refugio 1* y *Refugio 2* → UNIRSE. La primera vez tarda 5–30 segundos en despertar la sala.
4. **Para apagarlo:** en la ventana negra pulsa `Ctrl + C` (guarda los mundos) y espera a que se cierre.

## Si algo falla

| Síntoma | Qué hacer |
|---|---|
| En el móvil no aparecen salas | Comprueba que la ventana del servidor sigue abierta y que `PUBLICAR_FUNNEL.bat` mostró la dirección `https://…`. Abre esa dirección en el navegador del móvil: debe verse la página «Último Refugio». |
| Entran pero no se mueven / no se ven | El servidor lo detecta y reinicia la sala solo en ~15 s (verás «el anfitrión no avanza» en la ventana). Usa siempre la última versión del servidor. |
| El panel no abre | Ábrelo solo con `ABRIR_PANEL_ADMIN.bat` en el PC servidor. Si sigue fallando, manda las líneas `[admin] acceso denegado…` de `datos\servidor.log`. |
| «FALTA EL NAVEGADOR» en la ventana | Instala/actualiza Microsoft Edge. |
| La ventana se cierra sola | Ábrela desde una ventana de símbolo del sistema (`cmd`) en esa carpeta con `node servidor.js` y mira el error. |

Todos los jugadores deben usar la **misma versión** del juego (v14.0).
