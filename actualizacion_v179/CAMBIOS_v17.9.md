# Último Refugio 17.9 — «El cuerpo se queda» (opción C)

Es la opción **C** que elegiste para la regla PvP «desconectarse en combate».

## Qué cambia en la sala PvP
- **Antes:** si te desconectabas menos de 20 s después de un combate, **morías al instante** y perdías el personaje. Pasaba también con un corte honrado de Wi‑Fi, aunque volvieras en 3 s.
- **Ahora:** tu **cuerpo se queda dormido** donde estabas durante **30 s**.
  - Los demás lo ven **tumbado**, con tu nombre y «(desconectado)», y «Zzz…» encima. No se puede «hablar» con él.
  - **Pueden atacarlo** (jugadores y también zombis).
  - **Si lo matan:** es una muerte PvP normal. Sueltas la mochila en el suelo, tu personaje se borra y la muerte cuenta para quien te mató.
  - **Si vuelves a tiempo:** despiertas **en tu cuerpo**, con la vida que le quede, y el juego te lo dice («Vuelves a tu cuerpo…»).
  - **Si nadie lo toca y no vuelves:** a los 30 s el cuerpo desaparece y **conservas el personaje**. Al volver apareces donde lo dejaste.
- Desconectarse **fuera de combate** no cambia: no queda cuerpo.
- Quien huye ya no se libra: su cuerpo queda ahí, a merced de los demás. Un corte honrado deja de matarte si vuelves enseguida.

## Arreglo: tras morir ya no reapareces junto a tu mochila (sala PvP)
La aparición al azar elige, entre unos 60 puntos de la costa, el más alejado de los demás jugadores. Por eso, tras morir solía tocar **el mismo punto que la vez anterior**. Si el jugador no se había movido, reaparecía **junto a su mochila recién caída** y la recuperaba al momento (lo detectó la batería de pruebas).
- Ahora la aparición tras morir **evita 40 casillas alrededor del sitio de la muerte** (o del cuerpo dormido) durante 30 min.
- Si no hubiera ningún otro punto, usa el de siempre.

## Ajustes del servidor (`config.json`, opcionales)
| Clave | Por defecto | Para qué |
|---|---|---|
| `cuerpoDesconectado` | `true` | Con `false` vuelve la regla anterior (desconectarse en combate = morir). |
| `cuerpoSeg` | `30` | Segundos que se queda el cuerpo (mínimo 10). |

## Qué cambia en la app (17.9, versionCode 169)
Solo el aspecto del cuerpo dormido: aparece **tumbado** y no ofrece «hablar». Una app 17.7 lo ve de pie, con el nombre «(desconectado)», y la regla funciona igual (la decide el servidor).
**No hace falta subir la 17.9 a Play por separado:** va incluida en la 18.0.

## Pruebas
`prueba_cuerpo_v179.js` usa dos jugadores reales contra el servidor con la sala PvP. Comprueba 21 casos:
- Fuera de combate no queda cuerpo.
- En combate queda dormido donde estaba, y el otro jugador lo ve tumbado.
- Un golpe le quita vida. Al matarlo se borra el personaje, suelta la mochila y suma la muerte PvP.
- Los zombis también lo hieren.
- Al volver a tiempo despierta en su cuerpo, con la misma vida en el teléfono y en el servidor, y recibe el mensaje.
- A los 30 s el cuerpo desaparece, el personaje sigue vivo y al volver aparece donde lo dejó.
- No queda ningún cuerpo duplicado en el mundo.

Batería completa: `RESULTADO_PRUEBAS_v17.9.txt`.

## Cómo actualizar el servidor
1. Detén el servidor.
2. Descomprime `UltimoRefugio_Servidor_Tailscale.zip` (en esta carpeta) y copia encima de los tuyos:
   - `srv_layer.js`
   - `servidor.js`
   - `LEEME_SERVIDOR.md`
   - `juego\index.html` (17.9)
3. Arranca el servidor.
