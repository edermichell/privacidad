# Último Refugio 13.4 (versionCode 131) — cooperativo de 4 jugadores y música más ligera

## 1. Cooperativo de 4 jugadores (anfitrión + 3 invitados)
- Arquitectura en estrella: el anfitrión sigue siendo la autoridad y mantiene hasta 3 conexiones WebRTC; cada invitado ve a los demás porque el anfitrión se los reenvía en cada instantánea. Chip «COOP ● N jugadores»; el cuarto invitado recibe «sala llena».
- Cada conexión es un «par» con su propio estado (sombras del mapa, listas de zombis/civiles enviados, temporizadores): el código del cooperativo de 2 corre tal cual para cada par.
- IA con N jugadores: zombis y civiles eligen al jugador más cercano; un mapa de rutas por jugador remoto; los compañeros reclutados y el perro siguen a quien los reclutó; las mordidas y golpes llegan solo al invitado atacado.
- Mundo compartido: los cambios de un invitado llegan al anfitrión y este los reenvía a los demás (muros, puertas, objetos, contenedores).
- Entrada por código de sala o por conexión manual (un código por invitado). Compatible con invitados de la 13.3 (probado).
- **Probado con 4 navegadores reales** (WebRTC local): entrada de 3 invitados, posiciones cruzadas, zombis que eligen objetivos distintos, mundo compartido en los dos sentidos, propiedad de compañeros, mordidas dirigidas, desconexión de un invitado y entrada de otro (se reutiliza el número), cierre de sala; sin errores atrapados en silencio. También por código de sala con la señalización simulada.
- Medido (4 navegadores en una sola máquina): ~50–57 KB/s de subida del anfitrión con 3 invitados en reposo; 3,3–3,6 ms por cuadro de lógica con ~100 zombis persiguiendo (sin limitar CPU).
- **No probado:** teléfonos reales, redes Wi-Fi reales, el servicio público de salas (ntfy.sh, bloqueado aquí) ni más de ~15 minutos de partida con 4 jugadores.

## 2. Música: «se traba y el teléfono se calienta» (informe de un tester, modelo desconocido)
**Medido** (renderizado fuera de línea en escritorio; en un teléfono es varias veces más): la música sintetizada usa ~11 % de un núcleo en calma, ~9 % de noche y ~22 % con tensión. La reverberación sola es ~40 % del coste en calma.
- **Cortes:** las notas se programaban desde el bucle de dibujo (cada 4 fotogramas) con 0,25 s de margen; un tirón de 0,3–0,5 s (guardado, bloque de suelo, recolector de basura) las dejaba tarde y se perdía hasta el 19 % de los pasos de música. Ahora un temporizador propio programa cada 100 ms con 0,6 s de margen: con bloqueos de 150–500 ms cada 1,2 s no se pierde ningún paso (antes: 125 y 105 de 130).
- **Calentamiento:** nuevo ajuste «Calidad de música: automática / completa / ligera». El modo ligero apaga la reverberación, usa un solo diente de sierra por nota en cuerdas y colchón, la mitad de platillos y sin timbales. Coste medido: calma 0,114 → 0,068, noche 0,091 → 0,042, tensión máxima 0,215 → 0,147 (−40 %, −54 %, −32 %). La automática lo activa si el teléfono parece justo (≤ 6 núcleos, ≤ 4 GB, calidad baja o límite de 30 FPS).
- **Lo que no puedo afirmar:** que esto arregle el caso concreto del tester sin saber su modelo; el calor también depende del dibujo a 60 FPS (el límite de 30 FPS del menú ayuda) y no puedo medir temperatura. Pide al tester su modelo y la versión de Android, y si el problema sigue con «Música: ligera» y 30 FPS.

## 3. Corrección y mejoras heredadas de la 13.3
Recarga interrumpida al cambiar de arma (excepción oculta); escenas de calle, movimiento ambiental y optimización de autos (ver `CAMBIOS_v13.3.md`).

## Pruebas
Regresión completa (migración v85→13.4 y 13.3→13.4, anuncios, maquetación, recarga, respaldo, cuerpo, mapa, NPC, asedio, estrés 3 min): sin fallos. Cooperativo de 2 igual que antes (5/5 entradas correctas, 13.3 y 13.4). Java/Gradle sin cambios y sin compilar (no hay Android SDK).
