# Último Refugio — cambios de la v14.0 a la v15.4 (versionCode 137 → 151)

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
- **Actualizada** (v14.8): la anterior (v83) decía que no hay servidores propios ni cuentas. Ahora describe el multijugador con servidor, el identificador anónimo, las salas, reportes, IP/Tailscale y cómo pedir el borrado de datos. **Hay que subir el nuevo `privacy.html` a tu URL pública antes de enviar la app.**

## Pulido final (v14.8) — ver `actualizacion_v148/CAMBIOS_v14.8_pulido.md`
- Corrige el arco rojo de golpe que podía dejar de dibujarse, evita repetir el aviso de distrito en los límites, y reduce CPU y memoria del servidor (firma de autos; el navegador oculto se cierra tras 2 min con todas las salas dormidas).

## Ritmo de misiones y sucesos (v14.8) — aviso de un tester
- Antes, desde el **día 1** llegaban casi a la vez ofertas de misiones secundarias (cada 4–7 min), un SOS por radio, un lanzamiento de suministros y un helicóptero. Ahora **no hay nada de eso el día 1**; desde el día 2 hay **una misión a la vez** y, al terminar o rechazar una, **la siguiente llega otro día**. Ver `actualizacion_v148/CAMBIOS_v14.8_ritmo_misiones.md`.

## Estabilidad y gama baja (v14.8) — ver `actualizacion_v148/CAMBIOS_v14.8_estable.md`
- Android: si el sistema mata el WebView por poca memoria, la app se recupera en vez de cerrarse; libera caché ante `onTrimMemory`.
- Equipos débiles (≤ 2 GB de RAM, o ≤ 4 núcleos y ≤ 4 GB): primer arranque a 30 FPS estables, caché de mapa menor y memoria liberada al pasar a segundo plano.

## Novedades y aviso de actualización (v14.9) — ver `actualizacion_v149/CAMBIOS_v14.9_novedades_aviso.md`
- Botón **NOVEDADES** (menú y Ajustes → Datos) con los cambios de cada versión; se abre solo una vez tras actualizar.
- **Aviso automático** de versión nueva (Google Play, actualización dentro de la app; el servidor puede anunciarla también con `appUltima`), con botón ACTUALIZAR.
- Tope de **3000 objetos sueltos en el suelo** por mundo (mundos muy largos); las notas de supervivientes nunca se descartan.

## Autoridad del servidor (v15.0) — ver `actualizacion_v150/CAMBIOS_v15.0_autoridad.md`
- El servidor **valida los golpes y disparos** de los jugadores (alcance, arma, cadencia) y expulsa a quien manda daño imposible repetidamente.
- El **personaje del invitado se guarda en el servidor** (no en el teléfono): no se puede editar la mochila ni recuperar un personaje muerto. En salas de modo `full`, morir lo borra.
- Política de privacidad actualizada; opciones nuevas del servidor: `autoridadPersonaje`, `validarDano`, `versionMinimaApp`, `muerteBorraPersonaje`, `personajeCaducaDias`.

## Sala PvP y vida con autoridad del servidor (v15.1) — ver `actualizacion_v151/CAMBIOS_v15.1_sala_pvp_vida.md`
- Atributo `pvp` de sala (modo completo forzado, morir borra el personaje, exige app 15.1), etiqueta PVP y aviso al entrar.
- En salas PvP el servidor lleva la vida de cada jugador (solo sube con un presupuesto de curación) y da por muerto al que llegue a 0 aunque el cliente trucado no lo comunique.
- **Arreglo en Android:** los avisos de confirmación (borrar sala, mundo nuevo, reiniciar, banear) no aparecían y la acción se cancelaba sola; ahora se muestran.
- Aún sin daño entre jugadores (fase 2).

## Combate entre jugadores (v15.2) — ver `actualizacion_v152/CAMBIOS_v15.2_combate_pvp.md`
- En las salas `"pvp": true`: golpes y disparos contra otros jugadores decididos por el servidor (propiedad del arma, alcance, línea de visión, cadencia, puntería y daño), protección de aparición (20 s), zonas seguras junto a comerciantes, aparición aleatoria en la costa.
- Al morir el cuerpo deja todo en el suelo; cortar la conexión en pleno combate (20 s) cuenta como morir.
- Sin alianzas ni misiones de grupo todavía (fases 3 y 4).

## Alianzas y traición (v15.3) — ver `actualizacion_v153/CAMBIOS_v15.3_alianzas_traicion.md`
- En salas PvP: alianzas de hasta 4 (se proponen con el indicador de la sala, Y o E), aliados en verde y en el mapa, 4 señales rápidas, candados compartidos.
- Fuego amistoso activo: herir a un aliado (o exaliado reciente) = TRAIDOR 24 h (nombre rojo para todos, sin poder aliarse, se avisa a su alianza); defensa propia y atacar traidores sin castigo; el cliente no hiere aliados por accidente cuando hay un zombi de por medio.
- Sin «radar»: en PvP solo se conoce a los jugadores a ≤ 55 casillas y a los aliados.

## Misiones de grupo (v15.4) — ver `actualizacion_v154/CAMBIOS_v15.4_misiones_de_grupo.md`
- En salas PvP: una misión por día (de día) para alianzas con 2+ miembros conectados y cerca: limpiar un nido o mantener una radio con oleadas.
- Al cumplirla aparece un solo botín en el suelo: el primero que llegue se lo lleva (aliado, traidor o desconocido).
