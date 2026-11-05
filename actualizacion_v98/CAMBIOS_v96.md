# Último Refugio — Actualización v96 (app 9.0, versionCode 82): cuerpo, heridas por zona, órganos y extremidades
Incluye todo lo de v86–v95 (ver `CAMBIOS_v95.md`, `CAMBIOS_v94.md`…). `captura_anatomia.png` muestra la pestaña nueva.

## 1. Pestaña «Anatomía» (Estado)
Figura del cuerpo con **12 zonas**: cabeza, cuello, tórax, abdomen, brazos, manos, piernas y pies (izquierdo/derecho), más los **órganos**: ojos, oídos, pulmones, bazo y riñón. Cada zona se colorea según su **integridad** (sano, lastimado, grave, crítico, perdido) y muestra marcas de heridas: sangra, vendada, fractura, interna, infectada. **Toca una zona** para ver sus heridas, sus botones (vendar, entablillar, suturar…), el estado de sus órganos y, en extremidades, el botón **Amputar**. Abajo aparece el resumen de **secuelas** («Golpes ×0,44 · Puntería −47 % · Visión ×0,85…»). La pestaña *Heridas* ahora indica el lado («laceración · brazo (derecho)»).

## 2. Heridas por zona y su gravedad
Cada herida nueva cae en una zona concreta, con lado. La integridad baja según el tipo (rasguño 4 · laceración 12 · mordida 18 · herida profunda 22 · bala 24 · fractura 26 · hemorragia interna 30), mejora si la vendas/suturas/entablillas y empeora si sangra o se infecta. Cuello y cabeza siguen siendo críticos (v81). Una zona muy dañada te estorba: piernas bajo 50 % → más lenta, bajo 25 % → mucho más; brazos bajo 50 % → golpes más débiles.

## 3. Riesgos reales (solo modo Completo)
| Zona | Qué puede pasar | Cómo se evita / cura |
|---|---|---|
| **Cabeza** | lesión de **ojo** u **oído** (10 % / 8 % por golpe; ×1,8 con herida profunda, mordida o bala). Una parte de los casos graves lo destroza al instante. | Vendar la herida y descansar (≈150 s). Si la herida sigue sangrando sin vendar más de ~70 s, el órgano se pierde. |
| **Tórax** | **pulmón perforado** (7 %, ×1,8 grave): aguante máximo 60, toses. | No correr ni pelear: en reposo se cura en ~4 min. Esforzarte ~45 s lo destruye. |
| **Abdomen** | **hemorragia interna** (10 %, ×1,8 grave): sangrado que **no se venda**. | **Botiquín** (Estado → «Tratar con botiquín»). Si se corta sola, 50 % de perder **bazo o riñón**. |
| **Brazos, manos, piernas, pies** | **pérdida traumática** si el golpe llega a una extremidad que ya está por debajo del 25 % (mordida/herida profunda 3,5 %; fractura 2 %; ×3 con un bruto al lado). Un brazo sano no se pierde de un solo golpe. | Mantén las heridas vendadas; evita que la zona llegue a «crítica». |
En **Casual** no hay hemorragias internas ni pérdidas permanentes (las lesiones se curan solas) y las heridas solo tienen zona e integridad.

## 4. Amputar (y la infección)
Con **hoja** (cuchillo, machete, hacha o cuchilla) y **2 vendas**, 7 s. Los analgésicos reducen el daño (−6 vida y el dolor; sin ellos −14, aguante a 0 y casi te desmayas). Perder un brazo/pierna pierde también su mano/pie. **Si el foco de una infección (mordida o herida infectada) está en esa extremidad y tu infección es < 45 %, amputarla la cura**: «¡La infección se detuvo!». Si ya es ≥ 45 % o hay otro foco (torso, cuello, cabeza, otra extremidad), no te cura (te lo dice).

## 5. Desventajas permanentes
- **Pierna perdida:** velocidad ×0,55 (**muleta** ×0,75, **prótesis** ×0,85); dos piernas ×0,25. Pie perdido ×0,85.
- **Brazo perdido:** golpes ×0,55 (con **garfio** ×0,75), puntería −33 %, recarga ×1,5. Mano: golpes ×0,8, recarga ×1,25.
- **Ojo perdido:** visión ×0,85, puntería −23 % y **sombra en el borde** de la pantalla del lado del ojo (ambos: casi ciego). Ojo lesionado: sombra suave.
- **Oído perdido:** el volumen general baja a ×0,75 (ambos ×0,35).
- **Pulmón perdido:** aguante máximo 70 (ambos 40), te cansas más al correr y **toses** (ruido que atrae zombis).
- **Riñón perdido:** más sed. **Bazo perdido:** infecciones +30 %.
Objetos nuevos (Fabricar, basta llevarlos en la mochila): **Muleta** (2 tablones + 2 trapos), **Prótesis de madera** (3 tablones + 4 clavos + 2 trapos, martillo) y **Garfio** (1 tubo + 3 clavos + 2 trapos, martillo).

## Pruebas (navegador, 0 errores de JavaScript)
Pruebas automáticas con el azar forzado para cada riesgo: zonas y lados, integridad, lesión de ojo/oído/pulmón, hemorragia interna, pérdida traumática (y que un brazo sano no se pierde), amputación (cura a tiempo; no cura si ≥ 45 % o hay otro foco; sin hoja/sin heridas no se puede), velocidades con pierna/muleta/prótesis/dos piernas, brazo+mano+garfio, pulmón/riñón/bazo, complicaciones y recuperación, botiquín vs hemorragia interna, interfaz (pestaña, 12 zonas, selección, botón Amputar, zonas perdidas clicables), herida real de zombi, guardado/carga (`bd96` dentro de la partida), oído y modo Casual. El chequeo del cuerpo cuesta ≈ 9 µs cada 0,5 s y el dibujo de la sombra de visión solo ocurre si falta un ojo. Regresión: v95, v94, v93, v91, techos, v90, mapa, Modo Asedio, menú y el final de 180 s del helicóptero.

## Límites (sé honesto con las expectativas)
- **No probado por jugadores:** las probabilidades y penalizaciones son un punto de partida (están al inicio de `layer v96`); si resultan crueles o blandas, dime cómo ajustarlas.
- El **sprite del personaje no cambia** (no se le dibuja el brazo/pierna que falta); el cuerpo se ve en Anatomía y las secuelas en juego (velocidad, sombra de visión, tos…).
- Con el ritmo del juego (1 min de juego = 1 s real), los tiempos de curación/complicación son de segundos a pocos minutos reales.
- Una comprobación antigua de `test_npc88` es intermitente desde la v93 (azar de especialidades y del botín del zombi); no es una regresión.
