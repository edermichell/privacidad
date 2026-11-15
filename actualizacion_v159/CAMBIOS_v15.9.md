# Último Refugio 15.9 (versionCode 156): tu nombre y tu cama

## 1. Punto de aparición (solo servidor; sirve también para las apps 15.0 a 15.8)

Antes, al volver a una sala, el jugador aparecía siempre en el punto de inicio (en PvP, en uno al azar), aunque el servidor ya guardaba su mochila.

Ahora:

| Situación | Dónde aparece |
|---|---|
| Durmió junto a una cama (y la cama sigue ahí) | **Junto a su cama**, aunque saliera lejos de ella |
| No tiene cama | **Donde lo dejó** (la última posición que vio el servidor) |
| Murió | **En un lugar al azar**, con mochila nueva |
| Primera vez en la sala | En el punto de inicio, como antes (PvP: al azar) |

- Al dormir junto a una cama, el jugador ve: «Esta cama es ahora tu punto de aparición». Dormir en otra cama la cambia.
- Si la cama se rompe o se desmonta, aparece donde lo dejó.
- Al entrar se le dice dónde apareció («Apareces en tu cama», «Apareces donde lo dejaste», «Apareces en un lugar al azar»).
- La posición se guarda en el servidor al desconectarse, aunque el teléfono no haya guardado (el teléfono solo guarda cuando cambia la mochila).
- Si la posición guardada quedó bloqueada (un muro construido encima, agua), aparece en el punto normal.
- **Apps 14.0.x:** no guardan el personaje en el servidor, así que para ellas no cambia nada.

## 2. Nombre del jugador (necesita la app 15.9)

- En MULTIJUGADOR hay un campo nuevo, **TU NOMBRE**: de 3 a 14 letras, números, espacios, punto, guion o guion bajo. Si se deja vacío, el jugador entra como «Jugador N», como antes.
- Los demás lo ven sobre su personaje, en los avisos («X se unió»), en las bajas PvP y en el panel del servidor.
- **El nombre es del jugador**: el servidor lo reserva para su identificador (el que protege la clave secreta guardada en su teléfono). Nadie más puede usarlo, ni con variantes como «l0bo» por «Lobo» o con mayúsculas y acentos distintos.
- Se rechazan insultos y nombres que suplantan («admin», «moderador», «servidor», «oficial»…). Se le avisa al jugador y entra como «Jugador N».
- Una vez reservado, el nombre se mantiene aunque entre con una app antigua o con el campo vacío.
- **Moderación:** en el panel del servidor hay un botón nuevo, **Quitar nombre**. Libera el nombre y saca al jugador con el aviso «Tu nombre no está permitido. Elige otro en MULTIJUGADOR».
- Se guardan en `datos/nombres.json` (`{ identificador: { n: nombre, t: fecha } }`).

## ¿Y el nombre de Google Play?

Es posible con **Google Play Juegos (Play Games Services v2)**, pero no está en esta versión porque requiere pasos que solo puedes hacer tú:
1. En Play Console, crear el proyecto de **Servicios de juegos de Play** y vincular la app (huella SHA-1 de tu llave de firma y la de Play App Signing).
2. Añadir la librería `play-services-games-v2` a la app (inicio de sesión automático en Android).
3. Para que el servidor se fíe del nombre, el servidor tiene que **verificar con Google** un código que manda la app. Eso necesita un ID y secreto de cliente OAuth en tu `config.json` y que tu PC hable con los servidores de Google.

Lo práctico es usar el **nombre propio de la 15.9** ahora (funciona también en el navegador y con quien no use Play Juegos) y, si quieres, añadir Play Juegos después como «cuenta verificada» que rellena el nombre automáticamente.

## Pruebas

`prueba_nombres_y_aparicion.js`: 21 comprobaciones, 0 fallos.
- **Nombres:** se acepta «Lobo»; «l0bo» se rechaza por parecido; un insulto se rechaza; el nombre sale en el panel y se conserva al volver y tras morir; «Quitar nombre» lo libera y saca al jugador.
- **Aparición:** donde lo dejó, junto a su cama aunque saliera lejos, y en un lugar al azar tras morir, con mochila nueva.
