# Último Refugio — Actualización v88 (app 8.2, versionCode 74): NPC con más utilidad
Incluye v86 (final duro) y v87 (Modo Asedio). Todo lo nuevo funciona solo en partida individual/anfitrión (en Coop las funciones nuevas de NPC se desactivan para no desincronizar).

## CIUDADANOS (compañeros) — ahora tienen especialidad
Al reclutar a un superviviente/vagabundo (botón «Pídele que te acompañe») recibe una especialidad (se ve en su ficha y se guarda con la partida):

| Especialidad | Qué hace |
|---|---|
| **Paramédico** | Si sangras y llevas vendas, **te venda solo** (usa tu venda). Botón «Pedir que me cure»: +25 de salud, venda todas las heridas y baja el dolor, **1 vez al día**. |
| **Mecánico** | Botón «Reparar equipo y barricadas», **1 vez al día**: repara +50 % de durabilidad de tus armas y **refuerza hasta 6 barricadas** cercanas con tus tablones y clavos (gasta 1 y 1 por barricada). |
| **Recolector** | Sus salidas a «Buscar suministros» duran **15 min menos** y al volver traen **2 objetos más**. |

## MILITARES Y COMERCIANTES — servicios
- **Reparar mis armas** (Intendente militar y Comerciante): deja todas tus armas como nuevas por tapones (≈0,22 por punto de desgaste; el comerciante cobra ×1,3).
- **Informe de la zona** (Soldados e Intendente, gratis, 1 vez al día, requiere no ser «Peligroso»): cuántos infectados hay a 45 pasos, hacia dónde se concentran y **marca en el mapa** un campamento de saqueadores y uno de civiles. Queda anotado en el diario.

## BANDIDOS — pueden rendirse
Al quedar por debajo del 30 % de vida, un bandido (no el jefe) tiene un 55 % de **soltar el arma y rendirse** (el arma cae al suelo). Puedes hablar con él (USAR):
- **Perdonarle la vida:** +6 de reputación y te **delata su campamento** (marcado en el mapa). Luego huye.
- **Exigir el botín:** 4–12 tapones (y 40 % un objeto), −4 de reputación. Luego huye.
- **Dejarlo / atacarlo:** si lo ejecutas, −8 de reputación («ejecutaste a un rendido»). Si lo ignoras, se escapa solo a los 70 s.

## ZOMBIS — con uniforme
~14 % de los zombis comunes llevan uniforme (ropa de color distinto): **policía** (azul: balas, linterna, a veces pistola), **médico** (blanco: vendas, pastillas, antiséptico, rara vez botiquín), **obrero** (amarillo: clavos, tablones, martillo), **cocinero** (comida, cerillos) y **soldado** (verde: balas, cartuchos, adrenalina, casco/chaleco raros).
Al registrar el cadáver se indica el oficio («Registrar cadáver (médico)») y da objetos de su oficio además del botín normal. Un aviso lo explica la primera vez.

## Cómo se probó
Pruebas automáticas en navegador (25 comprobaciones, 0 errores de JavaScript): rendición, soltar arma, diálogo, perdonar/exigir/ejecutar, reclutar con especialidad, auto-vendaje, cura diaria (y bloqueo del 2.º intento), reparación y refuerzo de barricada, salida del recolector, guardado de la especialidad, reparación y cobro del intendente, informe con campamentos marcados, proporción de zombis uniformados (69/600) y botín del zombi médico.
Regresión OK: Modo Asedio completo con blindaje del guardado y menú en 5 tamaños de pantalla.
**No probado en teléfono real ni por jugadores.** Los porcentajes (14 % de uniformados, 55 % de rendición, precios) son un punto de partida fácil de ajustar en `layer v88` (`S88_JOBP`, `Math.random() < .14`, `.55`, `s88RepairCost`).

## Ideas que quedan (no incluidas)
Escoltar refugiados a un campamento a cambio de pago; reclutar a un bandido redimido; mejorar campamentos con los compañeros; cocinero como especialidad; zombis uniformados en la horda de la señal con más botín.
