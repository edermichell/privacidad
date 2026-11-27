# Construye la edición PC (PWA para Microsoft Store / GitHub Pages) a partir del juego de Android
# Uso: python3 build_pc.py <index.html de Android> <carpeta web de salida> <icono 512 png>
# Las capturas de web/capturas no se tocan.
import os, sys, json, shutil
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__))   # zpc.js y sw_pc.js están junto a este script
SRC = sys.argv[1]; OUT = sys.argv[2]; ICON = sys.argv[3]
os.makedirs(OUT + '/icons', exist_ok=True)
h = open(SRC, encoding='utf-8').read()
def rep(a, b, cnt=1):
    global h
    assert h.count(a) == cnt, (a[:60], h.count(a))
    h = h.replace(a, b)
zpc = open(D + '/zpc.js', encoding='utf-8').read()
rep('const SPRC = {', zpc + '\nconst SPRC = {')
head = ('<title>Último Refugio</title>\n<meta name="description" content="Supervivencia zombi isométrica: explora la ciudad, busca recursos, construye tu refugio y aguanta las noches.">\n'
        '<link rel="manifest" href="manifest.webmanifest">\n<meta name="theme-color" content="#14110d">\n'
        '<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">\n<link rel="apple-touch-icon" href="icons/icon-192.png">')
rep('<title>Último Refugio</title>', head)
sw = ("<script>/* edición PC: funciona sin conexión (el multijugador sí necesita internet) */"
      "if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));</script>\n</body>")
assert h.rstrip().endswith('</html>')
i = h.rfind('</body>'); h = h[:i] + sw + h[i + 7:]
import re; ver = re.search(r"UR_VERSION = '([^']+)'", h).group(1)
open(OUT + '/index.html', 'w', encoding='utf-8').write(h)
im = Image.open(ICON).convert('RGBA')
for s in (48, 72, 96, 144, 192, 256, 384, 512):
    im.resize((s, s), Image.LANCZOS).save(OUT + f'/icons/icon-{s}.png')
# maskable: el dibujo dentro de la zona segura (80 %) sobre el color de fondo del icono
# maskable: la escena sin el marco, a sangre (la cara queda dentro de la zona segura central)
W0 = im.width; c = int(W0 * 18 / 512); m = im.crop((c, c, W0 - c, W0 - c)).resize((512, 512), Image.LANCZOS); m.convert('RGB').save(OUT + '/icons/maskable-512.png')
m.resize((192, 192), Image.LANCZOS).convert('RGB').save(OUT + '/icons/maskable-192.png')
man = {
  "id": "/ultimo-refugio/", "name": "Último Refugio", "short_name": "Último Refugio",
  "description": "Supervivencia zombi isométrica: explora la ciudad, busca recursos, construye tu refugio, cumple misiones y aguanta las noches. Juega solo o con amigos.",
  "lang": "es", "dir": "ltr", "start_url": "./", "scope": "./",
  "display": "fullscreen", "display_override": ["fullscreen", "standalone"], "orientation": "landscape",
  "background_color": "#14110d", "theme_color": "#14110d",
  "categories": ["games", "entertainment"],
  "icons": [{"src": f"icons/icon-{s}.png", "sizes": f"{s}x{s}", "type": "image/png", "purpose": "any"} for s in (48, 72, 96, 144, 192, 256, 384, 512)]
           + [{"src": "icons/maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable"},
              {"src": "icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}],
  "screenshots": [{"src": f"capturas/pc_{i}.png", "sizes": "1920x1080", "type": "image/png", "form_factor": "wide", "label": l}
                  for i, l in enumerate(["Explora la ciudad", "La horda", "Noche y lluvia", "Tu refugio"], 1)]
}
json.dump(man, open(OUT + '/manifest.webmanifest', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
swjs = open(D + '/sw_pc.js', encoding='utf-8').read().replace('__VER__', ver)
open(OUT + '/sw.js', 'w', encoding='utf-8').write(swjs)
print('ok', ver, len(h))
