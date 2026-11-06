# Último Refugio v9.9 para PC (solo para probar)

**Cómo usarlo:** haz doble clic en `UltimoRefugio_PC_v9.9.exe`. Se abre el juego en su propia ventana (usa Microsoft Edge o Google Chrome,
que ya tiene casi todo Windows 10/11). Al cerrar la ventana, el programa se cierra solo. No hay instalador.

- **Windows puede avisar** («Windows protegió su PC» / SmartScreen) porque el .exe no está firmado digitalmente: «Más información» → «Ejecutar de todas formas».
- **Controles de teclado:** WASD / flechas para moverse, Espacio o clic para atacar, E para usar, I mochila, B barricada (como en la versión de móvil).
- **Partidas:** se guardan en `%LOCALAPPDATA%\UltimoRefugio\perfil` (carpeta propia, no mezcla nada con tu navegador). Son independientes de las del móvil.
- **Anuncios y compras:** en PC funcionan en **modo demo** (el anuncio es una pantalla de prueba de 5 s y las compras se simulan gratis); no hay Unity Ads ni Google Play.
  Sirve para probar el juego, no para verificar anuncios (eso solo se puede en el móvil).
- **Cooperativo (multijugador):** necesita internet; no lo probé entre PC y móvil.
- **Si no abre:** comprueba que tienes Edge o Chrome. Si no hay ninguno, abre el navegador predeterminado en `http://127.0.0.1:47615/` (el programa debe seguir abierto).
  Si ya había una copia abierta, la segunda solo abre otra ventana.
- `lanzador_main.go` es el código del programa (un servidor local mínimo + ventana de Edge/Chrome); el juego va incrustado dentro del .exe.
- Sin icono propio en el .exe (usa el genérico de Windows).
