# Lanzamiento v17.3 «Zona Roja» — qué hay en esta carpeta
1. **`PASAR_A_PRODUCCION.md` ← empieza aquí si vas a publicar en producción** (decisiones antes de compilar, Play Console, lanzamiento por etapas, servidor).
1a. `RECUPERAR_LLAVE_FIRMA.md` — si olvidaste la contraseña de la llave `.jks` (se puede restablecer: no pierdes la app).
1b. `GUIA_SUBIR_v17.3.md` — los 8 pasos de siempre (compilar, probar, subir a Play, servidor).
1c. `ficha_play/` — gráfico destacado, 7 capturas y textos de la ficha (español e inglés) para producción.
2. `UltimoRefugio_AndroidStudio_v17.3.zip` — proyecto de la app (versionCode 164, «17.3»).
3. `privacy.html` — política de privacidad (la de la 16.3; la 17.0 no la cambia: súbela solo si no subiste la de la 16.3).
4. `NOVEDADES_PLAY_v17.3.txt` — texto de «novedades» (es + en).
5. `correo_testers_v173/` — correo para testers (HTML con imágenes + texto + jpg sueltos).
6. `UltimoRefugio_Servidor_Tailscale.zip` — kit del servidor (migración al mapa nuevo, `PRUEBA_DURA.bat`, página `/prueba`, guion de pruebas).
7. `CAMBIOS_v14.0_a_v17.3.md` — todo lo que cambió desde la versión que está en revisión.

**IMPORTANTE (v15.5):** corrige el fallo por el que en las salas no se veía a los demás jugadores (solo un «Anfitrión»). Lee `arreglo_jugadores_invisibles/ANALISIS_Y_ARREGLO.md` (en la raíz): explica la causa, por qué hay que actualizar la app y la opción mínima **14.0.1**.

**v15.6:** golpes y disparos de los demás jugadores a la vista y salas oficiales sin «anfitrión» (primer jugador = «Jugador 1»). Ver `actualizacion_v156/CAMBIOS_v15.6_y_v14.0.2.md` (incluye la opción mínima **14.0.2**).

**v15.7 (fase 5):** botín que reaparece, bases protegidas con los dueños desconectados y temporadas PvP **funcionan solo con el servidor nuevo** (sirven también para la app 14.0.x). Bandidos y recompensas en PvP. Ver `actualizacion_v157/CAMBIOS_v15.7_fase5.md`.

**v15.8 (fase 6):** salas PvP más limpias. El servidor apunta de dónde sale cada objeto valioso (armas, munición, botiquines, chalecos): lo inventado no se guarda ni sirve para atacar a otros. También vigila la velocidad (quien se teletransporta vuelve a su sitio). **La sala PvP exige ahora la app 15.8** (versionCode 155); las salas normales no cambian. Ver `actualizacion_v158/CAMBIOS_v15.8_fase6.md`.

**v15.9:** cada jugador puede poner **su nombre** (único en el servidor; botón «Quitar nombre» en el panel). Al volver a una sala aparece **en su cama** si durmió en una, si no **donde lo dejó**, y tras morir **en un lugar al azar** (esto último funciona con el servidor nuevo desde la app 15.0). Ver `actualizacion_v159/CAMBIOS_v15.9.md`. **Si todavía no subiste la 15.8, sube directamente la 15.9: incluye todo.**

**v16.0:** interfaz renovada (menús, botones y ventanas limpios; arregla los solapes del menú en el teléfono). Solo cambia el aspecto. Ver `actualizacion_v160/` (incluye `antes_y_despues.jpg`). 

**v16.1:** partidas largas más fluidas (−18 % de cálculo con miles de zombis). Ver `actualizacion_v161/INFORME_RENDIMIENTO_v16.1.md`. 

**v16.2:** elegir la clave al crear una sala (o al azar si se deja vacía), arranque rápido (5,9 s → 2,7 s desde la segunda vez) y pantalla de juego más limpia. Ver `actualizacion_v162/CAMBIOS_v16.2.md`. 

**v16.3:** **chat de voz de proximidad** (botón VOZ; los zombis también oyen) y **sala PvP oficial** («Frontera PvP», con `AGREGAR_SALA_PVP.bat`). Cambia la parte Java (permiso de micrófono): compílala y pruébala en un teléfono. **Hay que volver a subir la política y actualizar Seguridad de los datos y la clasificación.** Ver `actualizacion_v163/CAMBIOS_v16.3.md`. **Si todavía no subiste ninguna de las 15.8–16.2, sube directamente la 16.3: incluye todo.**

**v17.0 «Zona Roja»:** lo construido tiene **vida** y se **repara** con el martillo; **armario de herramientas** (nadie construye junto a tu base mientras tenga mantenimiento); **saco de dormir y camas** para **elegir dónde reaparecer**, con espera que crece con las muertes y **anuncio para volver ya** (monetización); **Zonas Rojas** (hospital, comisaría y depósito en cuarentena: gas, saqueadores armados, cajas militares); en la **sala PvP** las bases ya **no se protegen** al desconectarse. No cambia Java ni la política. Ver `actualizacion_v170/CAMBIOS_v17.0.md`. **Si todavía no subiste la 16.3, sube directamente la 17.0: incluye todo.**

**v17.1:** pulido de la 17.0. **Nube de gas** visible en las Zonas Rojas (también desde fuera), el **filtro de la máscara antigás se gasta** dentro, **grietas** en lo construido dañado, polvo cuando atacan tu base, martillazos al reparar, **guardado un 34 % más pequeño** y menú de pausa deslizable. Sin cambios en Java, la política ni el servidor (solo `juego\index.html`). Ver `actualizacion_v171/CAMBIOS_v17.1.md`. **Sube directamente la 17.1.**

**Preparación para producción (17.1, mismo versionCode 162):** la app se declara juego (Android 16 respeta la orientación horizontal en tabletas y plegables), la política de privacidad real queda por defecto, el Java compila contra Android 16, ficha nueva de Play (`ficha_play/`) y guía `PASAR_A_PRODUCCION.md`.

**v17.2:** perímetro de cuarentena y nube de gas dentro del mundo en las Zonas Rojas, salpicaduras de lluvia y civiles lejanos más ligeros. Anuncios reales de Unity. **Sube directamente la 17.2.** Ver `actualizacion_v172/CAMBIOS_v17.2.md`.

**v17.3:** la sangre pasa de rectángulos planos a salpicaduras de verdad (con gotas), y las manchas ya no se acumulan sin fin en partidas largas. Solo cambia el aspecto. Sube directamente la 17.3. Ver `actualizacion_v173/CAMBIOS_v17.3.md`.
