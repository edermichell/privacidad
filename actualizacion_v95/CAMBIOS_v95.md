# Último Refugio — Actualización v95 (app 8.9, versionCode 81): música y efectos de suspenso
Incluye todo lo de v86–v94 (ver `CAMBIOS_v94.md`, `CAMBIOS_v93.md`…). **`demo_sonidos_v95.mp3`** (44 s) permite oír los golpes nuevos sin instalar nada.

Todo se **sintetiza con WebAudio** (sin archivos, el APK no crece) y solo se programa cuando ocurre algo: en reposo el director cuesta 0,22 µs por llamada. Se mezcla con tu volumen de **Música** y respeta «Sonido: no».

## Momentos nuevos
| Momento | Qué se oye |
|---|---|
| **Cuenta atrás del helicóptero** | A partir de los 20 s se oyen las **palas**: golpes graves que **se aceleran y suben de volumen** al acercarse. La música sube de tensión por fases (más percusión y cuerdas, más rápida). Cada cambio de fase: golpe de tambor + subida; la última, bocina grave. **Últimos 10 s: tic-tac** (más agudo en los 3 últimos), **subida final** de 6 s y **fanfarria de llegada** al aparecer el helicóptero. |
| **Modo Asedio** | Golpe de tambor con subida cada vez que sube de nivel; la música se vuelve más tensa con el nivel. |
| **«¡Te vieron!»** | Cuerda aguda (violines en segunda menor) cuando algo empieza a perseguirte *desde la calma* (máx. 1 vez cada 20 s; no durante la señal). |
| **Sigilo** | Si hay un zombi cerca que aún no te ve, la música va **subiendo la tensión** (cuerdas) según la distancia, más si vas agachado; baja al alejarte. |
| **Jefe / bruto** | Bocina grave con subida y campanada al verlo aparecer (una vez por cada uno); la tensión se mantiene mientras esté cerca. |
| **Anochecer / amanecer** | Campanadas graves y acorde oscuro al caer la noche; acorde abierto y arpegio de **alivio** al amanecer. |
| **Eventos** | **Luna de sangre** (subida larga + campana), **gran horda/manada** (golpe de horda), **caída de avión** (explosión grave), caravana (campanilla de hallazgo). |
| **Ruidos lejanos** | De noche o con lluvia, y solo en calma: gemidos, un grito, vidrios, golpes, puertas o ladridos **muy lejos** y por un lado de los auriculares (cada 30–70 s). |
| **Crujidos** | Dentro de edificios oscuros: crujido lento de madera cada 20–50 s. |
| **Escolta completada / compañero que cae** | Arpegio mayor de victoria; arpegio descendente menor al caer un compañero. |

## Ajuste nuevo: Ajustes › Sonido › «Suspenso sonoro»
**Completo** (todo) · **Suave** (solo momentos clave: cuenta atrás, fases, jefes, anochecer/amanecer, eventos y escolta; sin «te vieron», sin ruidos lejanos ni crujidos, sin tensión de sigilo) · **No** (como antes). Se guarda con tus ajustes.

## Cómo se comprobó (sin poder escuchar con oídos: se midió)
- 19 comprobaciones automáticas con audio real en el navegador (el contexto de audio corre; se cuentan osciladores): «te vieron» y su enfriamiento, jefe, sigilo, anochecer/amanecer, ruidos lejanos, crujidos, palas que se aceleran (31 → 47 osciladores/s al pasar de t=30 s a t=150 s), tic-tac, subida y llegada, y los tres niveles del ajuste.
- **Render sin conexión de cada golpe:** ninguno satura (pico máx 0,82 con la música al 60 %) ni queda mudo. El perfil de volumen de la demo sube hacia el final como se diseñó (−31 dB → −20 dB).
- Regresión completa: v93, v94, v91, techos, v90, mapa, Modo Asedio y el **final de 180 s del helicóptero**. 0 errores de JavaScript.
- **Límites:** el gusto musical no se puede medir: si algún golpe te parece muy fuerte o largo, dime cuál. Los volúmenes dependen de tu teléfono; el control de Música y «Suspenso sonoro: Suave» sirven para bajarlo.
