# Último Refugio 13.3 (versionCode 130) — sobre la 13.2.4

## Corrección de error
- **Recarga interrumpida:** si cambiabas o soltabas el arma a mitad de la recarga, al terminar saltaba una excepción (`Cannot read properties of null (reading 'a')`, atrapada en silencio por el protector v80) o se metía munición en el arma nueva. Ahora la recarga se cancela si el arma ya no es la misma. Probado: 13.2.4 → 1 excepción; 13.3 → 0.
- Resto de la revisión de 13.2.4: arranque, partida nueva, horda de 80, noche con lluvia, civiles + zombis y asedio sin excepciones; estrés de 2×6 min (completo y casual) sin errores salvo el de arriba (el único aviso de consola restante es la red bloqueada del entorno de prueba).

## Mejoras (portadas de mi rama 10.x, que la 13.2.4 no tenía)
- **Calles con vida (solo en partidas nuevas):** escenas fijas en las calles (choques con autos destrozados, controles abandonados, maletas, cuerpos con moscas), botín pequeño que aparece al acercarte y no se repite, y movimiento ambiental ligero (papeles al viento, vapor de alcantarillas, ondas en charcos con lluvia). Detalle y capturas: `escenas_calles_v106.png`.
- **Rendimiento con más autos:** la cuadrícula de colisiones de autos solo se reconstruye si algún auto se movió, y descarte barato en la búsqueda de objetos interactuables.
- Las partidas guardadas con la 13.2.4 no cambian (comprobado: misma imagen píxel a píxel y mismos zombis).

## Rendimiento: medido, sin cambios mayores
Banco con CPU emulada 4× (Chromium): la 13.2.4 rinde igual que mi base 9.9 dentro del ruido (calle de día ~46–50 fps; horda de 60 ~21–25 fps). El perfil es plano (dibujo de sprites, IA de civiles, cuadrícula de autos); no hay un cuello de botella único que justifique más cambios sin riesgo.

## Pruebas
Regresión completa (migración v85→13.3 y 13.2.4→13.3, anuncios, maquetación, recarga, respaldo, cuerpo, mapa, asedio, estrés): sin fallos nuevos; `test_v95` y `test_npc88` son intermitentes conocidos. Escenas/guardado/modo invitado: 8/8.
**Limitaciones:** Java/Gradle sin cambios y sin compilar (no hay Android SDK); mediciones en Chromium emulado, no en teléfono.

## Multijugador
Ver `PLAN_MULTIJUGADOR_5_Y_SERVIDOR_24_7.md`: es un plan, no está implementado.
