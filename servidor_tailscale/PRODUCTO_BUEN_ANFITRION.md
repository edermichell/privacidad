# Producto extra «Buen anfitrión» — qué hay y qué falta

**Idea:** *Crea salas 24/7 y juega con tus amigos.* Un extra de pago que da al jugador salas propias (públicas o privadas) que siempre están encendidas en tu servidor.

## Ya funciona (probado en Chromium)
- Licencias con **código** (`BA-XXXX-XXXX`), duración y número de salas; se generan con `GENERAR_LICENCIA.bat`.
- El jugador las canjea en *MULTIJUGADOR → Buen anfitrión → CANJEAR*; el servidor activa sus salas 24/7 y las baja a gratis cuando vence.
- Tarjeta «Buen anfitrión» en **Tienda** y en el menú MULTIJUGADOR (el precio es un texto: busca `const UR_HOST_PRICE = ''` en `index.html` y escribe, por ejemplo, `'$49 MXN al mes'`).
- Límites por servidor (`salas247Max`, `salasActivasMax`) para no saturar tu PC.

## Falta para cobrarlo dentro de la app (no está hecho)
1. **Google Play Console:** crear el producto (lo natural es una **suscripción mensual**, porque el servidor cuesta cada mes) y definir el precio.
2. **App (Java):** añadir el SKU a `MainActivity.java` (como `noads`, `skins`, `vip`) y a `SKUS` en el juego. Cambio pequeño pero **sin compilar ni probar** aquí.
3. **Servidor:** verificar la compra con la **API de Google Play Developer** (cuenta de servicio) y emitir la licencia solo si es válida; renovar/cancelar según el estado de la suscripción. Sin esto, cualquiera podría decir «ya pagué».
4. **Cuentas:** hoy la identidad es el dispositivo; con dinero de por medio conviene ligar la licencia a una cuenta (o a la compra de Play) para poder recuperarla.
5. **Reglas y legal:** los bienes digitales dentro de la app deben cobrarse con **Google Play Billing**, y Google cobra comisión (revisa el porcentaje que te aplica); conviene actualizar la **política de privacidad** (nombres, IP) y definir **términos y moderación** (reportes, expulsar jugadores, borrar salas).
6. **Costos:** una sala 24/7 reserva ~0,5–1 GB de RAM y ~0,4 núcleo con 10 jugadores (medido en un PC de escritorio). Fija el precio y el cupo (`salas247Max`) según lo que tu PC aguante; si crece, un VPS.

## Variantes que puedes ofrecer (sugerencias)
- **Buen anfitrión:** 3 salas, 1 de ellas 24/7.
- **Gran anfitrión:** más salas 24/7 y salas más grandes. (Se logra con `licenciaSalasPorDefecto` / el número de salas de cada código.)
- **Código de regalo** para testers: `GENERAR_LICENCIA.bat` con pocos días.
