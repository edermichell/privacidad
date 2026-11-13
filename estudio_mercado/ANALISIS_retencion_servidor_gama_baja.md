# Último Refugio — retención, qué añadir, servidor futuro y gama baja

*Noviembre de 2026 · sobre la versión 14.6.*
Marcas: **[Nuestro]** = sale de tu código o de mis pruebas; **[Web]** = encontrado en buscadores (orientativo, algunas fuentes se contradicen); **[Mi criterio]** = opinión o hipótesis mía.

---

## 1. ¿Por qué la retención diaria sería baja?

**Aclaración importante:** **no tengo tus cifras reales.** En el estudio anterior puse un 2/5 a «retención» como *opinión mía sobre el diseño*, no como medición. Lo que sigue son **hipótesis ordenadas por probabilidad**, cada una con qué evidencia hay en el juego y cómo comprobarla.

**Qué es:** retención día 1 (D1) = de cada 100 que instalan, cuántos vuelven al día siguiente; D7 y D30 igual a 7 y 30 días. Referencias generales de juegos móviles [Web]: mediana D1 ≈ 22 %, D7 ≈ 4 %, D30 < 1 %; un juego medio con marketing ≈ 25–30 % / 10–15 % / 3–6 %; los mejores 45 % / 25 % / 12 %; en Android el D1 de los mejores ronda el 25–27 %. **Primero mira tu número real** (Play Console → KPIs/Estadísticas → «Usuarios retenidos») y compáralo con eso: si tu D1 está en 20–30 %, **no es baja**.

### Hipótesis (de más a menos probable) [Mi criterio]

| # | Hipótesis | Qué hay en el juego [Nuestro] | Cómo comprobarla |
|---|---|---|---|
| 1 | **Al morir lo pierdes todo.** No hay un motivo que sobreviva a la muerte para «volver mañana». | Al morir se borra la partida guardada (también en Casual). Lo que permanece: unos 39 logros, estadísticas, trajes y el récord. | Play Console no lo muestra; mide cuánto dura una partida y cuántos mueren antes de 10 min (p. ej. con 5 testers nuevos). |
| 2 | **Los primeros 5–10 minutos abruman o frustran.** Es un simulador con muchas reglas (hambre, sed, heridas, clima, ruido). | Hay tutorial de 7 pasos, modo Casual por defecto y un mensaje «moriste muy pronto: puedes bajar la dificultad». | Observa a 5–10 personas que no conocen el juego: ¿llegan a su primera casa y a su primer combate sin ayuda? Es la prueba más valiosa y barata. |
| 3 | **Pocos motivos para volver *hoy*.** | Existe un reto diario (misma semilla del día), racha de caja diaria (3 días: +1 caja; 7 días: +3), logros. No hay ranking, eventos ni recordatorios. | Revisa cuánta gente abre el reto diario/ caja diaria (no se mide hoy). |
| 4 | **Nadie te avisa.** Sin notificaciones, quien no se acuerda no vuelve. | La app no envía recordatorios. | — |
| 5 | **Comunidad vacía al principio.** El multijugador es lo más diferente, pero con pocos jugadores las salas están vacías. | 3 salas oficiales, etiqueta «MAPA 960», sin chat ni forma de invitar fácil a un amigo. | Cuántos entran a MULTIJUGADOR y cuántos coinciden en la misma sala (el panel `/admin` lo muestra). |
| 6 | **Arranque lento / tirones en teléfonos modestos.** El jugador se va sin avisar. | Con CPU 4× más lenta el menú tarda ≈ 4,5 s y una partida 960 ≈ 11 s (sección 4). | Play Console → *Android vitals* (ANR, cierres, arranque lento) y valoraciones por dispositivo. |
| 7 | **Expectativa de la ficha.** Si la ficha promete algo distinto, el D1 cae. | Ficha con pocas capturas del mapa nuevo. | Tasa de conversión de la ficha y reseñas de 1–2 estrellas: ¿de qué se quejan? |

**Mi lectura:** lo más probable es la suma de **1 + 2 + 3** (juego profundo sin gancho para volver) y, en teléfonos modestos, **6**. Las demás son secundarias hasta que haya comunidad. Pero **sin datos es una hipótesis**: antes de construir nada, mide.

---

## 2. ¿Qué más podemos añadir o lo que tenemos sobra?

**Respuesta corta:** **en contenido y sistemas, sobra.** Ya tienes más mundo, sistemas y distritos de los que un jugador nuevo ve en sus primeras horas. Lo que falta no son más funciones de juego, sino **«motivos para volver»** y **medir**. Y **no añadiría** por ahora: más distritos, más salas, chat de voz, más trajes.

Si quieres añadir algo, esto es lo que yo priorizaría (impacto / esfuerzo) [Mi criterio]:

| Prioridad | Qué | Por qué | Esfuerzo |
|---|---|---|---|
| 1 | **Medir** (sin añadir juego): Play Console (retención, vitals) + 5–10 testers nuevos observados | Convierte hipótesis en datos | Bajo |
| 2 | **Algo que sobreviva a la muerte**: p. ej. un «legado» (un objeto inicial desbloqueado por días sobrevividos, o un récord por mundo) | Ataca la hipótesis 1, la más probable | Medio |
| 3 | **Recordatorio local diario** («tu caja del día te espera», «hay reto nuevo») | Ataca 3 y 4; funciona sin servidor | Bajo-medio (Java + permiso de notificaciones en Android 13+) |
| 4 | **Invitar a un amigo con un toque** (compartir enlace/código de sala por WhatsApp) | Ataca 5; el multijugador solo vale con gente | Bajo-medio |
| 5 | **Ranking semanal del reto diario** en tu servidor (ID anónimo) | Da razón de competir; ya tienes servidor | Medio-alto |
| 6 | **Primer-día más amable**: 3 metas cortas con recompensa visible en los primeros 10 minutos | Ataca 2 | Medio |

**Cuidado:** cualquier medición dentro del juego (analítica) **cambia la política de privacidad y «Seguridad de los datos»** de Play; por eso primero usa lo que Play ya te da.

---

## 3. Servidor: casa hoy, opciones baratas para crecer

### 3.1 Cuánto necesita realmente [Nuestro, medido en mi equipo]
Con 3 salas × 10 jugadores peleando contra hordas (la prueba dura), en Linux:

| Recursos del servidor | Resultado |
|---|---|
| **2 núcleos** | 29,6–29,7 pasos/s por sala (objetivo 30): **aguanta** |
| **1 núcleo** | 11 pasos/s: **no alcanza** |
| Memoria | 1,4–1,7 GB para las 3 salas (+ el sistema y el navegador oculto) |

**Mínimo razonable para 3 salas: 2 núcleos rápidos + 4 GB de RAM. Cómodo: 4 núcleos + 8 GB.** Tu portátil (i3-N305, 8 GB) ya cumple, como mostró la `PRUEBA_DURA`. Cada sala consume por el navegador oculto que la ejecuta; es lo más pesado (ver 3.4).

### 3.2 Opciones [Web — precios de terceros que **se contradicen**; confirma en la página del proveedor]

| Opción | Costo aproximado | Ventajas | Riesgos |
|---|---|---|---|
| **A. Seguir en tu PC de casa** | ≈ electricidad (portátil de 15–30 W ≈ unos cientos de pesos al año; estimación mía) | Ya funciona, cero gasto, tu internet (208 Mbps de subida) sobra | Apagones, internet, el PC se usa para otra cosa. Mitigación: un **regulador/UPS** pequeño y `EVITAR_SUSPENSION_WINDOWS.bat` |
| **B. Mini PC dedicado (Intel N100, 16 GB)** | ≈ US$250–340 nuevo (las fuentes van de US$150 a US$340; la RAM subió de precio) | Una sola compra, consumo bajo (~10 W), libera tu portátil, ya probado con N305 | Pago inicial; sigue dependiendo de tu casa |
| **C. VPS en EE. UU. 2 vCPU / 4 GB** (p. ej. Hetzner CPX22 en Ashburn/Hillsboro) | ≈ €8/mes (una fuente; otra lo sitúa más alto) | Barato, sin apagones, internet de datacenter | Latencia desde México (Ashburn/Hillsboro están lejos); Hetzner subió precios en 2026 |
| **D. VPS en Dallas** (Vultr/DigitalOcean/Linode) | ≈ US$20–24/mes (4 GB), US$40–48 (8 GB) | **La mejor latencia a México** entre los comerciales; precio estable | El más caro |
| **E. Contabo VPS 10 (4 vCPU / 8 GB)** | ≈ €4,5–5,5/mes con contrato de 12 meses; recargo por región EE. UU. | El más barato por recurso | Rendimiento compartido variable; hay que **probarlo con `PRUEBA_DURA`** antes de confiar |
| **F. Oracle «Always Free» (ARM)** | US$0 | Gratis | En 2026 se reportó un recorte a ~2 núcleos/12 GB y que reclaman instancias «inactivas»; **poco fiable** para producción |

### 3.3 Mi recomendación por etapas [Mi criterio]

1. **Ahora:** quédate en casa. Compra un UPS pequeño, deja `AUTOARRANQUE_WINDOWS.bat` y vigila `/admin`.
2. **Cuando haya jugadores a diario y los cortes duelan:** un **VPS de Dallas 2 vCPU/4 GB (~US$20)** o un **mini PC N100** (pago único). Antes de contratar cualquiera, **corre `PRUEBA_DURA` allí** (hay versión Linux en el kit) y exige ≥ 27 pasos/s.
3. **Si «Buen anfitrión» vende:** salas 24/7 pagadas en un VPS aparte, para no mezclar con tu PC.

**Latencia:** para acción en tiempo real conviene < 100 ms. Un servidor en EE. UU. central (Dallas) suele quedar mucho mejor que Europa para México; confírmalo con la página `/prueba` desde un teléfono.

### 3.4 Lo que más ahorraría a futuro (no ahora)
Cada sala corre en un **navegador oculto**; eso es el 80 % de la memoria. Una versión del anfitrión **sin navegador** (en Node) bajaría mucho el costo por sala, pero es un **rediseño grande**; solo tiene sentido si el servidor llega a muchas salas.

---

## 4. Optimizar para gama baja

### 4.1 Lo que el juego ya hace [Nuestro]
Calidad automática con histéresis (baja a «gráficos bajos» tras ~3 s de sobrecarga y recupera a los 15 s), modo de gráficos bajos manual, tope de 30 FPS opcional, resolución interna según pantalla, presupuesto de cachés (sprites y bloques de mapa), animación y simulación por distancia (LOD), trabajo diferido, panel de diagnóstico con FPS/ms/memoria, y en Android la capa de hardware y aceleración activadas. **Es un sistema bastante completo; no hay «una gran mejora fácil» pendiente.**

### 4.2 Lo que medí [Nuestro — emulación, ver límites abajo]
Teléfono emulado de 800×360 a densidad 2 con la CPU frenada ×K, mapa 960 (el más pesado):

| CPU más lenta que mi equipo | Gráficos «altos» | Modo automático (baja solo) |
|---|---|---|
| ×1 | 59,5 FPS | — |
| ×2 | 34,7 FPS | — |
| ×4 | 19,7 FPS | **≈ 37 FPS** (centro de la ciudad) |
| ×6 | 10–12 FPS | **23–27 FPS** |

- **Coste de JavaScript por fotograma** (×4): altos ≈ 37–43 ms; bajos ≈ 15–18 ms (**el modo bajo recorta unas 3 veces** lo que dibuja). Más de la mitad del tiempo del fotograma es del navegador (composición), no del juego.
- **Dibujo por fotograma:** ≈ 200–300 llamadas y ≈ 1,5 millones de píxeles (altos) / 0,7–0,8 (bajos): **ligero**.
- **Arranque (×4):** menú ≈ 4,5–5 s; partida «enorme» ≈ 2,5 s; mapa 960 ≈ 11 s; «Continuar» ≈ 6–12 s. **Lo que domina el arranque es dibujar los sprites por código** (cv, isoBox, slabHi, treeHi…).
- **Memoria:** navegador completo ≈ 420–525 MB (mapa enorme) y 550–600 MB (mapa 960) en escritorio; heap de JavaScript 50–100 MB. Android WebView será distinto.

**Límites de la emulación:** frena solo el procesador principal de JavaScript; la GPU, el calor, la RAM real y el sistema Android de un teléfono de gama baja **no se reproducen**. Estos números sirven para **comparar** cambios, no para prometer FPS en un modelo concreto.

### 4.3 Oportunidades, ordenadas [Mi criterio]

| # | Mejora | Beneficio esperado | Riesgo/esfuerzo |
|---|---|---|---|
| 1 | **Android: manejar `onRenderProcessGone`** (cuando el sistema mata el WebView por poca memoria, recrearlo en lugar de que la app se cierre) | **Evita cierres en teléfonos de poca RAM** (la guía oficial de Android lo recomienda [Web: [Handle WebView termination](https://developer.android.com/develop/ui/views/layout/webapps/handle-termination)]) | Bajo-medio; **Java no probado aquí** (no hay Android SDK en este entorno): compílalo y pruébalo en un teléfono |
| 2 | **Arranque más rápido**: generar solo los sprites del menú y dejar el resto para después | Menú de ~4,5 s → mucho menos en teléfono lento (estimación) | Medio; toca el arranque, hay que probar mucho |
| 3 | **Liberar cachés al pasar a segundo plano** (`visibilitychange` ya guarda; añadir vaciar bloques de mapa) | Menos probabilidad de que Android cierre el juego | Bajo |
| 4 | **Tope de 30 FPS por defecto en dispositivos débiles** (≤ 4 núcleos o ≤ 3 GB RAM) | Menos calor y batería; el modo automático ya existe | Bajo |
| 5 | **Tercer nivel automático** (aún más bajo) solo si ya está en «bajo» y sigue < 30 FPS | Ayuda al 5 % más débil; **reduce el campo visible** | Medio; cambia lo que se ve |
| 6 | **Unirse a una sala 960 con teléfono lento**: ≈ 7 s hoy (el invitado vuelve a generar el mundo) | Entrada más rápida | Alto (rediseño de red) — no ahora |

**Requisito mínimo recomendado [Mi criterio]:** ≥ 2 GB de RAM; con 1 GB (Android Go) puede cerrarse por memoria. Falta confirmarlo en teléfonos reales.

### 4.4 Cómo comprobarlo en teléfonos reales (lo único que da certeza)

1. Consigue 2–3 teléfonos **baratos** (p. ej. de 2–3 GB de RAM, Android 9–11).
2. En cada uno: **Ajustes → «Diagnóstico avanzado» → ABRIR**, camina 5 minutos en el centro de la ciudad y **COPIAR**; manda los textos.
3. Repite con **Gráficos: Bajos** y con el **tope a 30 FPS**.
4. Con esos datos decidimos cuál de las mejoras 1–5 aporta de verdad.

---

## 5. Qué haría primero (resumen)

1. **Medir:** D1/D7/D30 y *Android vitals* en Play Console; observar a 5–10 testers nuevos.
2. **Estabilidad en gama baja (Java `onRenderProcessGone`)** y **tope de 30 FPS en equipos débiles**: bajo esfuerzo, evitan perder jugadores en silencio.
3. **Un motivo para volver** que sobreviva a la muerte y **un recordatorio diario** (cuando los datos confirmen la hipótesis).
4. **Servidor:** quedarse en casa con UPS; planear mini PC N100 o VPS de Dallas 2 vCPU/4 GB cuando haya uso diario.

## 6. Fuentes y límites

- Retención: [GameAnalytics 2025 (resumen)](https://gamedevreports.substack.com/p/gameanalytics-mobile-gaming-benchmarks), [AppAgent](https://appagent.com/?p=61637). Datos generales, no específicos de survival.
- Servidor: [Hetzner 2026](https://www.bitdoze.com/hetzner-cloud-cost-optimized-plans/), [Contabo](https://pricingsaas.com/companies/contabo.main/diffs/2026Q2), [Oracle Always Free](https://docs.oracle.com/iaas/Content/FreeTier/resourceref.htm), [comparativa Vultr/DO/Linode](https://www.vpsbenchmarks.com/compare/vultr_vs_digitalocean_vs_linode), [mini PC N100](https://www.pcbuildadvisor.com/?p=3051). **Los precios varían mucho entre fuentes y cambian**; confirma en la página del proveedor.
- Android: [Manage WebView objects](https://developer.android.com/guide/webapps/managing-webview), [WebView termination](https://developer.android.com/develop/ui/views/layout/webapps/handle-termination).
- Mis mediciones usan Chromium en Linux de 4 núcleos con la CPU frenada; no sustituyen a teléfonos reales.
- No pude abrir muchas páginas completas desde este entorno; usé lo que muestran los buscadores.
