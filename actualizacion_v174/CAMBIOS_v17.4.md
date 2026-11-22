# Último Refugio 17.4 «Rueda y esquiva» (versionCode 165)

## Qué cambia para el jugador

### Nuevo: RODAR para esquivar
- **Botón RODAR** (azul, encima de USAR) o **tecla Z**. Se puede mover y cambiar de tamaño en *Ajustes → Personalizar*, y respeta el modo de mano izquierda.
- Voltereta de unas **2,2 casillas en 0,32 s** en la dirección del joystick. **Sin dirección rueda hacia atrás**, alejándote de lo que tienes enfrente.
- Durante los **primeros 0,26 s esquiva**: golpes de zombis, el **salto del saltador** (queda aturdido, como al esquivarlo a pie) y los **golpes cuerpo a cuerpo de bandidos**.
  **No esquiva balas ni golpes de otros jugadores** (esos los valida el servidor en PvP).
- Cuesta **16 de aguante** (menos con la habilidad Forma física) y tiene **0,55 s de enfriamiento**. El botón se oscurece cuando no se puede usar.
- **Contraataque:** si pulsas ATACAR mientras ruedas, el golpe sale justo al levantarte (antes se perdía).
- Animación: giro completo con estela y polvo. **Los demás jugadores ven tu voltereta** (las apps antiguas te ven deslizarte caminando, sin errores).
- Un consejo aparece la primera vez que un zombi te persigue de cerca. Logro nuevo: **«Acróbata»** (esquiva 10 golpes rodando).
- Compatible con la vigilancia de velocidad de las salas PvP: la voltereta y su enfriamiento quedan muy por debajo del límite (9 casillas/s), **no hace falta tocar el servidor**.

### Calidad automática que se recuerda
- Con calidad «Automática», si el teléfono va justo el juego baja la calidad a los ~3 s de partida, y eso **acerca la cámara de golpe**. Pasaba en **cada partida**.
- Ahora, si el teléfono estuvo más de **1 minuto** en calidad baja, se recuerda y la siguiente partida **ya empieza así**: la cámara no salta a mitad del juego.
- Si el teléfono vuelve a ir sobrado (p. ej. tras actualizarlo), el juego sube la calidad solo y olvida la marca. Elegir la calidad a mano también la borra.

## Rendimiento: lo que se midió (procesador frenado ×4, como un teléfono modesto)

| Escena | FPS | Dibujo del mundo | Simulación |
|---|---|---|---|
| Calle de día | 55 | 3,1 ms | 2,6 ms |
| Noche con lluvia | 35 | 2,1 ms (+1,4 luces) | 2,3 ms |
| Horda (60 zombis) | 27 | 7,3 ms | 4,8 ms |
| Partida avanzada | 46 | 2,1 ms | 4,1 ms |

- Perfil de CPU real (`medir_perfil_cpu.js`): entre el **44 y el 56 %** del tiempo es trabajo propio del navegador (pintar y componer), no código del juego.
- Se probó quitar el borde de luz y la sombra de cuerpo a los zombis en hordas: **sin diferencia medible** (10,5 ms frente a 10,9 ms por cuadro, mediana de 3 pasadas). **No se quitaron**: habría bajado la calidad sin ganar nada.
- Al aparecer una horda el juego crea ~75 sprites/s los primeros segundos (después ~13/s). Ya está repartido por cuadro con un presupuesto; precargar todo costaría ~45 MB de memoria, demasiado para teléfonos de 2-3 GB. Se deja así.
- La calidad automática **no oscila** (probado 90 s con CPU ×4 y ×6: cambia una sola vez); el problema era el salto de zoom en cada partida, ya resuelto.

## Archivos
- `voltereta_secuencia.png`: 11 cuadros de la voltereta (1/30 s cada uno).
- `boton_rodar.png`: el botón en la pantalla táctil.
- `prueba_v174.js`: 25 comprobaciones de la voltereta y de la calidad recordada.
- `medir_perfil_cpu.js`: perfil de CPU por función en una horda y de noche.

Sin cambios en Java, permisos, política de privacidad ni servidor (solo `juego/index.html`).
