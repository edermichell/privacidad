# Último Refugio — cambios de la v14.0 a la v14.5 (versionCode 137 → 142)

## En la app (lo que ven los jugadores)
- **Mapa nuevo de 960×960** para las salas oficiales (solo lo activa el servidor; el juego individual y el COOP no cambian):
  - Distritos: **centro** denso (pavimentado, más zombis y botín alto), **zona industrial** (patios de cajas), **puerto** con **mar, costa irregular y muelles de madera** con cajas de botín, **parques con estanque y puentes**, **barrio residencial** y **campo** (bosques, lagos, pantanos, granjas, cabañas, cementerios y la base militar).
  - **Callejones**: pasajes de 1 o 2 casillas, cruces y callejones sin salida con caja de botín y emboscada; **mini-rotondas**.
  - Aviso «Entras a: Centro / Puerto / …» al cruzar de distrito.
- **Lista de salas:** etiqueta **MAPA 960** en las salas oficiales.
- **Guardado:** corregido un error que hacía que cajas y cofres en la parte baja de los mundos grandes (360² y 480²) no se guardaran.
- Mundos de los demás tamaños: **idénticos** a los de la 14.0 (comprobado por hash).

## En el servidor (kit)
- `MIGRAR_A_MAPA_NUEVO.bat` / `VOLVER_AL_MAPA_ANTERIOR.bat`: pasan las 3 salas oficiales al mapa nuevo con copia de seguridad y vuelta atrás.
- `PRUEBA_DURA.bat`, página `/prueba` (latencia, bajada, subida, WebSocket) y `GUION_PRUEBAS_REALES.md`.
- Límites separados para salas oficiales y de jugadores (`salasUsuarioActivasMax`), opciones de tamaño/mundo/semilla por sala.
- Menor CPU del anfitrión con mundos grandes (escaneo de cambios por ventana: −47 %).
- El registro técnico (`servidor.log`) se recorta a **30 días** (lo dice la política de privacidad).

## Política de privacidad
- **Actualizada** (v14.5): la anterior (v83) decía que no hay servidores propios ni cuentas. Ahora describe el multijugador con servidor, el identificador anónimo, las salas, reportes, IP/Tailscale y cómo pedir el borrado de datos. **Hay que subir el nuevo `privacy.html` a tu URL pública antes de enviar la app.**
