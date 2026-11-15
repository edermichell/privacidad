# Lanzamiento v15.9 — qué hay en esta carpeta
1. `GUIA_SUBIR_v15.9.md` ← **empieza aquí: los 8 pasos para lanzar la 15.9** (política, compilar, subir a Play, servidor).
2. `UltimoRefugio_AndroidStudio_v15.9.zip` — proyecto de la app (versionCode 156, «15.9»), con la política nueva y el resumen de cambios.
3. `privacy.html` — política de privacidad **actualizada (v15.9)** (súbela a tu URL pública antes de enviar la app).
4. `NOVEDADES_PLAY_v15.9.txt` — texto de «novedades» (es + en).
5. `correo_testers_v159/` — correo para testers (HTML con imágenes + texto + jpg sueltos).
6. `UltimoRefugio_Servidor_Tailscale.zip` — kit del servidor (migración al mapa nuevo, `PRUEBA_DURA.bat`, página `/prueba`, guion de pruebas).
7. `CAMBIOS_v14.0_a_v15.9.md` — todo lo que cambió desde la versión que está en revisión.

**IMPORTANTE (v15.5):** corrige el fallo por el que en las salas no se veía a los demás jugadores (solo un «Anfitrión»). Lee `arreglo_jugadores_invisibles/ANALISIS_Y_ARREGLO.md` (en la raíz): explica la causa, por qué hay que actualizar la app y la opción mínima **14.0.1**.

**v15.6:** golpes y disparos de los demás jugadores a la vista y salas oficiales sin «anfitrión» (primer jugador = «Jugador 1»). Ver `actualizacion_v156/CAMBIOS_v15.6_y_v14.0.2.md` (incluye la opción mínima **14.0.2**).

**v15.7 (fase 5):** botín que reaparece, bases protegidas con los dueños desconectados y temporadas PvP **funcionan solo con el servidor nuevo** (sirven también para la app 14.0.x). Bandidos y recompensas en PvP. Ver `actualizacion_v157/CAMBIOS_v15.7_fase5.md`.

**v15.8 (fase 6):** salas PvP más limpias. El servidor apunta de dónde sale cada objeto valioso (armas, munición, botiquines, chalecos): lo inventado no se guarda ni sirve para atacar a otros. También vigila la velocidad (quien se teletransporta vuelve a su sitio). **La sala PvP exige ahora la app 15.8** (versionCode 155); las salas normales no cambian. Ver `actualizacion_v158/CAMBIOS_v15.8_fase6.md`.

**v15.9:** cada jugador puede poner **su nombre** (único en el servidor; botón «Quitar nombre» en el panel). Al volver a una sala aparece **en su cama** si durmió en una, si no **donde lo dejó**, y tras morir **en un lugar al azar** (esto último funciona con el servidor nuevo desde la app 15.0). Ver `actualizacion_v159/CAMBIOS_v15.9.md`. **Si todavía no subiste la 15.8, sube directamente la 15.9: incluye todo.**
