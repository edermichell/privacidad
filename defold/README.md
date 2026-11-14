# Último Refugio — port a Defold

Adaptación a [Defold](https://defold.com) del juego *Último Refugio* (original: HTML5 canvas 2D en WebView Android, ~24 500 líneas JS, v15.6).
El original dibuja todo por código (sin sprites); aquí se usan sprites/tiles de pixel-art generados por `tools/gen_assets.py`.

## Cómo "conectarse" a Defold desde aquí
No hay editor gráfico: se usa **Bob**, la CLI oficial (`bob.jar`, `tools/build.sh`). Los archivos de Defold son texto
(`.collection`, `.go`, `.gui`, `.script`, `game.project`), así que se editan directamente y Bob los compila/empaqueta.
Para abrirlo en el editor de Defold: *File ▸ Open Project* → carpeta `ultimo_refugio/`.

```bash
tools/build.sh            # compila y valida
tools/build.sh html5      # bundle web (necesita red a d.defold.com)
tools/build.sh android    # APK
python3 tools/sim_test.py # prueba de humo de la lógica (pip install lupa)
```

## Estado del port (corte vertical jugable)
| Original (`index.html`) | Defold |
|---|---|
| `genWorld` (calles, edificios, puertas, botín, árboles, agua) | `gen_world` en `main/game.script`, tilemap 64×64 |
| `ITEMS` (comida, bebida, vendas, armas) con sus valores reales | tabla `ITEMS` (subconjunto) |
| Hambre / sed / salud, ciclo día-noche, hordas por día | `update`, `horde`, capa de oscuridad en el HUD |
| Zombis: vista, persecución, deambular, empuje | `update_zombies` |
| Combate cuerpo a cuerpo (dmg/alcance/velocidad de arma) | `update_combat` (auto-ataque) |
| HUD y controles táctiles | `main/hud.gui_script`, botones 1/2/3 |

**Pendiente de portar:** recetas/crafteo, construcción (fogata, barril, generadores), armas de fuego, tipos de zombi/jefes, fauna, NPC y misiones,
vehículos, clima, minimapa, tienda/compras (Google Play Billing) y anuncios (Unity Ads → extensión nativa de Defold), guardado (`sys.save`),
multijugador por WebSocket (`defold-websocket` / `socket`), pantallas de menú y opciones.

## Controles
WASD / flechas o mantener pulsado/tocar para mover · 1 comer · 2 beber · 3 venda · R reiniciar · el ataque es automático.

## Verificado / no verificado
- ✔ `bob build` compila sin errores (Defold 1.9.0).
- ✔ `tools/sim_test.py`: 10 min simulados con API mockeada, sin errores ni fugas de objetos.
- ✘ **No se ha ejecutado en el motor real** (el sandbox no alcanza `d.defold.com`). La cámara ortográfica, el HUD y el tilemap en runtime están sin probar visualmente.
