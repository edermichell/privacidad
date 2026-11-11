# Último Refugio v14.5 — Fase 5: 3 salas oficiales con el mapa nuevo (960×960)

**No cambia tu servidor hasta que ejecutes la migración.** Esta entrega trae las herramientas y el cambio de la app; el mapa nuevo (v14.2–14.4) ya estaba en el código, opcional.

## Qué cambia
- **`MIGRAR_A_MAPA_NUEVO.bat`** (`herramientas\migrar_mapa_nuevo.js`): comprueba que el servidor esté cerrado, te enseña lo que hará y, si escribes `SI`:
  - deja **3 salas oficiales** (Refugio 1, 2 y 3) con mapa 960×960 y 10 jugadores por sala;
  - **mueve** los mundos oficiales anteriores (con sus copias) y tu `config.json` a `datos\respaldo_mapa_anterior\<fecha>\` (nada se borra);
  - conserva el resto de tu `config.json` (puerto, `urlPublica`, `claveAdmin`…) y **no toca las salas creadas por jugadores**.
- **`VOLVER_AL_MAPA_ANTERIOR.bat`**: restaura `config.json` y los mundos de la última copia (el mundo nuevo queda guardado aparte). No se puede aplicar dos veces la misma copia.
- **Límites separados:** nuevo `salasUsuarioActivasMax` (la migración pone 1): las 3 oficiales siempre caben y una sala de jugadores no puede quitarles el sitio. Sin esa clave el servidor se comporta como antes. Mensajes claros cuando no cabe una sala.
- **Opciones por sala** en `config.json`: cada sala de `salas` admite `tamano`, `mundo` y `semilla` propios.
- **Lista de salas:** etiqueta **MAPA 960** (app v14.5). Aviso de memoria al arrancar si el PC tiene poca RAM.
- `PROBAR_CARGA.bat` ahora propone 10 jugadores por sala; guía `MAPA_NUEVO_960.md`.
- `versionCode 142`, `versionName 14.5`.

## Pruebas (Chromium, una máquina; jugadores reales de navegador contra el servidor migrado)
- Migración y vuelta atrás sobre una copia de prueba: `config.json` idéntico tras revertir, mundos oficiales restaurados, sala de jugador intacta, segunda reversión rechazada.
- Servidor migrado: la lista muestra 3 salas **OFICIAL · MAPA 960**; un jugador entra a una sala dormida (se despierta y genera el mundo: **≈ 10–11 s** el primero, **≈ 2,5 s** el segundo); el mundo es 960 con distritos y mar; el servidor cuenta los jugadores; una sala de jugador usa el mapa 264; **SALA1 + SALA2 + SALA3 + una sala de jugador** arrancan a la vez; una segunda sala de jugador se rechaza con mensaje claro.
- Guardar/despertar con mundo 960 (moderación, candados/robos, persistencia, movimiento): sin fallos nuevos. Regresión del juego (notas, partida de la 13.5, COOP 2 y 4, 4 días): sin fallos nuevos (mismos falsos positivos conocidos).
- **Memoria real (corrijo mi cifra anterior de ≈ 2,5 GB):** sumando memoria proporcional (PSS) de los procesos del servidor, **3 salas 960 con 30 jugadores simulados usan ≈ 1,5 GB** (≈ 1,0 GB en reposo; 0,1 GB el servidor solo). Las cifras de 2,2–2,5 GB sumaban memoria compartida varias veces. En Windows con Edge el Administrador de tareas marcará más.

## Límites (importante)
- **No probado en tu portátil (i3-N305, 8 GB) ni con personas ni con teléfonos reales.** Falta `PROBAR_CARGA.bat` con las 3 salas y tu opinión jugando.
- Los jugadores que estén en las salas oficiales actuales **pierden esas partidas** al migrar (quedan en el respaldo); hay que avisarles antes.
- La app v14.5 debe estar publicada antes; apps anteriores entran igual pero sin la etiqueta.
- Con 3 oficiales + 1 de jugadores activas a la vez son 4 navegadores: si tu PC va justo, `salasUsuarioActivasMax: 0` o `salasActivasMax: 2`.
