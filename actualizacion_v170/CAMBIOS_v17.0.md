# Último Refugio v17.0 «Zona Roja» (versionCode 161)

La ciudad ya no es solo zombis: ahora hay **bases que defender**, **un lugar al que volver** cuando mueres y **sitios a los que da miedo entrar**. Los zombis siguen siendo el centro del juego, como hasta ahora.

## La historia detrás
Al empezar el brote, el ejército intentó contenerlo: **selló el hospital con los primeros enfermos dentro, tomó la comisaría y montó un depósito** para una evacuación que nunca llegó. Rociaron todo con gas descontaminante y se fueron. Hoy esos lugares son las **Zonas Rojas**: el aire todavía quema, los podridos se pudren dentro y las bandas de saqueadores armados vigilan las cajas que el ejército dejó atrás. Fuera, cada superviviente marca su territorio con un armario de herramientas, duerme en un saco donde puede y sabe que si cae, vuelve a empezar desde ahí.

## Qué cambia (salas del servidor)
### 1. Lo construido tiene vida y se repara
- Paredes 420, puertas 240, ventanas 120, armario de herramientas 380, almacenaje 160, cama 150, saco 60.
- Al golpearlo aparece una **barra de vida** sobre la pieza (verde, amarilla, roja), que ven todos los jugadores cercanos.
- Con el **martillo en la mano**, USAR frente a la pieza: **«Reparar pared · 76 % (1 tablón + 2 clavos)»** → +100 de vida.
- **No se puede reparar en pleno asalto** (si la golpearon hace menos de 15 s) ni dentro del armario de herramientas de otro.
- Arreglo de paso: los demás jugadores ahora reciben las piezas que construyes (antes solo veían la casilla y no podían ni asaltarla ni ver su vida).

### 2. Armario de herramientas (V ▸ Almacenaje · 6 tablones, 8 clavos, 4 chatarra)
- Marca una **zona de 12 casillas** a su alrededor. Ahí **solo construyen y desmontan su dueño y quien esté autorizado**.
- **Autorizarse:** abrir el armario (si no tiene candado) o abrir su candado con el código. Ponle candado.
- **Mantenimiento:** cada 6 h reales consume **1 tablón + 2 clavos** de su interior (las primeras 6 h son gratis). Al tocarlo dice cuánto le queda («mantenimiento 18 h»). **Sin material la zona caduca**, pero la base no se cae: solo deja de impedir que otros construyan cerca.
- Máximo **3 armarios activos** por jugador. Tu zona se ve en el mapa (círculo verde discontinuo); las de los demás no (no sirve de radar).
- Para quitar el armario de otro hay que **romperlo** (380 de vida).
- El servidor rechaza lo que se construya o desmonte en zona ajena y **devuelve el material**.

### 3. Saco de dormir, camas y reaparición
- **Saco de dormir** (V ▸ Muebles · 3 trapos + 1 sábana): barato, se puede pisar y dormir en él.
- Al morir en una sala sale **ELIGE DÓNDE REAPARECER**: tus sacos y camas construidos (hasta 8, con distancia y dirección) o **«Lugar al azar»**. Sin sacos ni camas, solo al azar.
- **Espera creciente:** 10 s la primera muerte de la última hora, +15 s por cada muerte más (25, 40, 55…), máximo 90 s.
- **Anuncio para reaparecer ya** (monetización): «VER ANUNCIO · REAPARECER YA», uno cada 10 min por jugador. Los **Fundadores** reaparecen ya sin anuncio.
- El servidor **no deja volver antes de tiempo** (aunque cierres y abras la app): «Aún no puedes reaparecer: espera 23 s…».
- En la sala, la pantalla de muerte ya no ofrece «Revivir» ni «Otra vez»: se elige aquí.

### 4. Zonas Rojas
- Hasta **3 por sala**: *Hospital en cuarentena*, *Comisaría tomada* y *Depósito del ejército* (lejos del punto de inicio y separadas entre sí).
- **En el mapa** (grande y minimapa) con un círculo rojo «ZONA ROJA».
- **Gas:** sin **máscara antigás** quita vida (≈ 90 s para morir; más cerca del centro, más rápido), tiñe la pantalla de verde, sale «☣ ZONA ROJA · SIN MÁSCARA» y toses. Con máscara, nada.
- Al entrar: cartel **ZONA ROJA · Hospital en cuarentena** y la historia del lugar.
- **Saqueadores armados** (bandidos y pistoleros; un **jefe** en la primera zona) y **podridos**. Vuelven cada 12 min si no hay nadie cerca.
- **3 cajas militares** por zona con su propio botín: rifles, subfusiles, escopetas, pistolas, munición, chalecos, cascos, botiquines, **máscaras antigás**, adrenalina. Se reponen 40 min después de vaciarse (sin nadie cerca).

### 5. Sala PvP sin protección de bases desconectadas
- Antes (15.7), lo que estaba cerca de tus candados no se podía romper si llevabas más de 10 min desconectado. **En la sala PvP ya no**: paredes, candados, reparación y armario son tu defensa. En las salas normales sigue como antes.

## Compatibilidad
- **Juego individual y COOP en la misma red:** sin cambios (salvo que el saco de dormir también se puede construir para dormir).
- **Apps anteriores en el servidor nuevo:** entran como siempre, pero no ven barras, armario, zonas ni la pantalla de reaparición; el servidor les aplica igual las reglas del armario (sin devolverles el material) y no tienen espera al reaparecer.

## Pruebas
- `prueba_zona_roja_v170.js` (servidor real, sala PvP, 2 jugadores): **57 comprobaciones**, todas OK: vida y reparación (con asalto y materiales), armario (bloqueo en el teléfono y en el servidor, devolución, autorización, caducidad y cobro), saco y reaparición (lista, cuenta atrás, anuncio, espera creciente, rechazo de quien vuelve antes, al azar), Zonas Rojas (elección, cajas, botín, guardias, gas con y sin máscara, avisos) y pared rota para todos.
- Regresión completa de la 16.3 (cliente, servidor, PvP, alianzas, misiones, voz, claves, nombres y aparición, prueba dura) con la 17.0: ver `RESULTADO_PRUEBAS_v17.0.txt`.

## Opciones del servidor (config.json, todas opcionales)
`zonasRojas` (true), `armarioHerramientas` (true), `armarioRadio` (12), `armarioMax` (3), `mantenimientoHoras` (6), `reaparicionSeg` (10), `reaparicionExtraSeg` (15), `reaparicionMaxSeg` (90). En una sala concreta, `"proteccionBases": true/false` manda sobre el valor por defecto (PvP: sin protección).
