# Último Refugio 16.2 (versionCode 159): clave de sala, arranque rápido y pantalla de juego más limpia

## 1. Elegir la clave al crear una sala (app 16.2 + servidor nuevo)
- En MULTIJUGADOR → **+ CREAR SALA** hay un campo nuevo, **CLAVE (opcional)**: de **4 a 6 letras o números**. Se pasa a mayúsculas sola.
- Si se deja vacía, la sala recibe una clave **al azar** de 6 caracteres, como antes.
- Los demás entran escribiendo esa clave en «ENTRAR CON CÓDIGO», **con cualquier versión de la app** (por eso el máximo es 6: es lo que admite ese campo en todas las versiones).
- El servidor rechaza, con un mensaje claro:
  - una clave que ya usa otra sala («Esa clave ya la usa otra sala. Elige otra o déjala vacía.»);
  - una de menos de 4 o más de 6 caracteres;
  - las que empiezan por **SALA** (reservadas para las salas oficiales).
- **Consejo para tus jugadores:** una clave corta y fácil («1234») es más fácil de adivinar; para salas privadas, mejor 6 caracteres.

## 2. Arranque rápido
- La primera vez el juego dibuja, como siempre, todos los muebles, muros, árboles y coches píxel a píxel, y luego, ya en el menú y sin bloquear, los **guarda en el teléfono** (unos 10 MB).
- A partir de la segunda vez los **carga** en vez de volver a dibujarlos.

| Procesador frenado ×4 (teléfono modesto) | Hasta el menú |
|---|---|
| Primer arranque (o tras actualizar) | 5,9 s |
| Siguientes | **2,7 s (−54 %)** (cargar los dibujos: 0,5 s, en vez de 2,5 s de dibujarlos) |

- Comprobado que los dibujos cargados son **idénticos píxel a píxel** a los generados (los mismos 9,6 millones de bytes y la misma huella).
- **Seguro ante fallos:** solo intenta cargar si un arranque anterior dejó anotado que guardó bien para esta misma versión. Si el teléfono no tiene ese almacenamiento, tarda más de 1,5 s o falla, vuelve a dibujar como siempre y borra la nota. Cada versión nueva vuelve a generar y guardar.

## 3. Pantalla de juego más limpia
- **El tutorial ya no tapa los botones** (Mochila, Estado…) en pantallas medianas, ni el aviso «LUGAR DESCUBIERTO».
- El aviso «LUGAR DESCUBIERTO» aparece más abajo, fuera de la zona de paneles. En el teléfono queda bajo el personaje.
- **Barras de vida y aliento** redondeadas y con un brillo suave.
- **Hambre, sed, descanso y abrigo:** barras finas con la etiqueta **encima** (antes el texto tapaba el relleno y costaba leerlo).
- **Mensajes** en tarjetas más compactas. En el teléfono quedan un poco más abajo para no tapar la línea del arma.

Comparación: `pantalla_de_juego_antes_y_despues.jpg`.
