# Último Refugio — Actualización v90 (app 8.4, versionCode 76): animaciones, accesibilidad y respaldo
Incluye v86 (final duro), v87 (Modo Asedio), v88 (NPC útiles) y v89 (mapa y hora dorada).

## 1. Animaciones de acción
Las 87 acciones del juego compartían el mismo temblor. Ahora se clasifican en 7 tipos:

| Tipo | Acciones | Qué se ve |
|---|---|---|
| **Golpear** | reparar, construir, colocar, fabricar, talar, desmontar/desarmar, soldar, barricadas, quitar tablones, forzar con palanca, cambiar llanta/batería… | Repite la **pose de ataque** con la herramienta en la mano: martillo (por defecto), **hacha** al talar, **palanca** al desmontar/forzar |
| **Buscar** | buscar, registrar cadáver, recoger, cosechar, sembrar, regar, llenar, cebo, repostar, puentear… | Se agacha e **inclina el torso** + ícono de lupa |
| **Vendar** | vendar, suturar, botiquín, entablillar, desinfectar | Se agacha e inclina + cruz médica |
| **Cocinar** | cocinar, hervir agua, armar fogata | Se agacha e inclina + llama |
| **Comer/beber** | comer, beber, pastillas, adrenalina | Ícono de manzana |
| **Recargar** | recargar | Ícono de balas |
| **Leer** | leer | Se inclina + ícono de libro |
Todas muestran un **ícono sobre la cabeza con una barra de avance**. Trepar, saltar y pescar conservan sus animaciones propias.

## 2. Objetos que vuelan a la mochila
Al recoger algo, su ícono viaja hasta el botón **Mochila**, que da un pequeño «latido». Máximo 5 a la vez, se desactiva en calidad baja y tiene interruptor (Ajustes › Gráficos).

## 3. Accesibilidad (Ajustes › Gráficos)
- **Modo daltónico:** paleta azul/naranja en el HUD, **texturas** en las barras de estado (rayas cuando estás en nivel bajo/medio: ya no depende solo del color) y colores del mapa que no confunden rojo con verde.
- **Tamaño del HUD:** Normal / Grande (×1,2) / Muy grande (×1,4) para barras, botones y misión.
- **Reducir destellos:** anula los relámpagos y reduce el destello rojo al recibir daño (útil para personas sensibles a la luz).
Todo se guarda con tus ajustes.

## 4. Respaldo de partida (Ajustes › Datos)
- **Exportar:** genera un código de texto comprimido (en la prueba, 53 KB → 21 KB) con botones **Copiar** y **Compartir**. Guárdalo en notas, correo o mensajes.
- **Importar** (solo desde el menú principal): pega el código (aunque venga con saltos de línea) y reemplaza tu partida. Si ya tenías una, pide confirmar y **guarda antes una copia** (`ultimo_refugio_save_prev`).
- Protege contra desinstalar la app o borrar datos del teléfono. Valida el código antes de tocar nada.

## Pruebas
Automáticas en navegador, 0 errores de JavaScript: clasificación de acciones, poses (martillo/hacha), íconos, objetos voladores (y tope de 5), ajustes de accesibilidad (paleta, HUD ×1,4, destellos anulados, guardado de opciones), exportar/importar ida y vuelta (con código inválido, con confirmación y con partida restaurada idéntica), y regresión de mapa, NPC, Modo Asedio y menú.
**No probado en teléfono real.** La prueba de rendimiento del mapa varía con la máquina (65–150 ms al construir la base HD); no cambió respecto a la v89.

## Notas y límites
- El código de respaldo se copia con el portapapeles del sistema; si el teléfono lo bloqueara, el cuadro permite seleccionar el texto a mano.
- «Compartir» usa el menú de compartir de Android si el WebView lo ofrece; si no, copia.
- No hay idioma inglés ni modo foto todavía (propuestos en el análisis).
