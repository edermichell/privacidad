# Último Refugio 15.8 (versionCode 155) — Fase 6: salas PvP más limpias

Esta fase endurece las **salas PvP** contra dos trampas típicas: **inventarse objetos** y **moverse más rápido de lo posible**.
Solo se aplica en salas PvP y a jugadores con la app **15.8 o superior** (la sala PvP ahora exige la 15.8; las salas normales siguen admitiendo apps antiguas).

## 1. Libro de inventario (el servidor sabe de dónde sale cada objeto valioso)

Objetos que se vigilan (los «valiosos»):

| Objeto | Puntos |
|---|---|
| Arma de fuego (pistola, escopeta, revólver, rifle, subfusil, ballesta) | 30 |
| Chaleco / casco / chaqueta con protección ≥ 0,4 | 5 |
| Botiquín | 3 |
| Arma cuerpo a cuerpo fuerte (daño ≥ 50, p. ej. hacha) | 3 |
| Munición (también la que va **dentro** del arma) | 0,15 por bala |

Cada vez que el jugador sube su personaje, todo objeto valioso **de más** tiene que tener un origen que el servidor haya visto:

- **Suelo**: recoger algo que está en el suelo cerca de ti.
- **Muebles y maleteros**: sacar algo de un mueble cercano. Cuando registras un mueble por primera vez, el teléfono manda **en el acto** lo que salió y el servidor comprueba que cabe en la tabla de botín de ese mueble (una nevera con un rifle no cuela).
- **Cadáveres de zombis con uniforme** (policía, médico, soldado…): el teléfono dice qué salió y el servidor comprueba que ese uniforme lo puede llevar. Los objetos raros (la pistola «del 5 %» de un policía) tienen un **límite estadístico**: sacar una pistola en cada cadáver no se acepta.
- **Comerciantes**: su existencia baja.
- **Fabricar**: el teléfono avisa al terminar y el servidor lo acepta con un ritmo máximo (lo que tarda de verdad fabricar).
- **Recargar el arma**: la munición del cargador y la de la mochila cuentan juntas, así que recargar no cambia nada.
- **Pasarse cosas**: si un jugador suelta un arma y otro la recoge, al segundo se le guarda… **pero solo si el primero la tenía de verdad**. «Tirar» al suelo o meter en un cofre un objeto inventado no sirve para darle origen.

**Tolerancia**: hay un margen de 12 puntos al entrar, que se recarga a 12 puntos por hora (máximo 24), para recompensas de misiones, rescates, entregas, etc. (ninguna de esas da armas de fuego). Un arma vale 30: **un arma sin origen nunca se guarda**.

**Espera antes de decidir**: el personaje se sube en cuanto cambia el inventario, a veces antes de que llegue el aviso de «recogí del suelo» o «compré». Si falta algo, el servidor espera 2,5 s y vuelve a comprobar antes de recortar nada.

**Qué pasa con lo que no tiene origen**:
- No se guarda en el personaje del servidor.
- No cuenta como «arma que lleva», así que **no puede usarse para dañar a otros jugadores**.
- El teléfono del jugador también lo pierde, y el jugador ve un aviso.
- Suma un aviso de actividad sospechosa (solo la primera vez por objeto) y queda en el registro: `INVENTARIO SOSPECHOSO de jugador N …`.

## 2. Validación de movimiento

- Límite: **9 casillas/s a pie** y **16 en coche** (el coche más rápido del juego va a 8,6), con margen.
- Se acumula hasta 3 s de «tiempo de viaje», para que los mensajes que llegan juntos tras un corte de red no cuenten como trampa.
- Si alguien supera el límite 3 veces seguidas, el servidor lo devuelve a su última posición válida (`El servidor te devolvió a tu posición`) y le suma un aviso.
- **Los golpes y disparos entre jugadores usan la posición validada**, no la que dice el teléfono.
- Al morir y reaparecer, el control empieza de cero.

## 3. Otras mejoras

- Los invitados **ahora ven el uniforme de los zombis** (policía, soldado, médico…) y pueden sacar su botín especial. Antes ese dato solo lo tenía el anfitrión.

## Configuración (config.json del servidor)

```json
"auditarInventario": true,
"validarMovimiento": true
```
Ambas vienen activadas. Ponlas a `false` para desactivar cada control.

## Límites que quedan (honestos)

- Un tramposo podría fingir que compra a un comerciante sin pagar (los tapones no se vigilan), pero la existencia del comerciante es limitada y baja para todos.
- La tolerancia permite colar de vez en cuando un botiquín o un puñado de balas.
- El daño a **zombis** sigue calculándolo el teléfono (un «modo dios» contra zombis no se detecta). No afecta a otros jugadores.
