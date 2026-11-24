# Lanzamiento v18.1 «Animaciones con peso» — qué hay en esta carpeta
1. **`GUIA_SUBIR_v18.1.md` ← empieza aquí** (compilar, probar, subir a Play, actualizar el servidor).
2. `UltimoRefugio_AndroidStudio_v18.1.zip` — proyecto de la app (versionCode 171, «18.1»). Fírmalo con **`ultimo_refugio_subida.jks`** (alias `upload`).
3. `NOVEDADES_PLAY_v18.1.txt` — texto de «novedades» (es + en).
4. `UltimoRefugio_Servidor_Tailscale.zip` — kit del servidor (el mismo de la 18.0, con el juego 18.1 dentro).
5. `CAMBIOS_v17.9_a_v18.1.md` — qué cambió y cómo se probó. `RESULTADO_PRUEBAS_v18.1.txt` — la batería completa.
6. `correo_testers_v181/` — correo para testers (texto + capturas, incluida la comparación de animaciones).
7. `ficha_play/`, `privacy.html`, `PASAR_A_PRODUCCION.md`, `RECUPERAR_LLAVE_FIRMA.md`, `PROBAR_SERVIDOR.html` — los mismos de siempre.

**Lo nuevo, en corto**
- **18.1:** animaciones con peso, **sin coste de rendimiento medible**:
  - Retroceso al recibir golpes.
  - Caídas con impacto, que ya no «se dan la vuelta» al final.
  - Levantarse poco a poco.
  - El jugador acompaña el golpe.
- **18.0:** agarrones de zombi, te ves en las multitudes, guardado algo más ligero.
- **17.9 (sala PvP):** el cuerpo se queda dormido 30 s si te desconectas en combate; tras morir no reapareces junto a tu mochila.
- **Sin cambios** en el código Java, la política de privacidad ni los permisos. **Sube directamente la 18.1** (incluye la 18.0 y la 17.9).
