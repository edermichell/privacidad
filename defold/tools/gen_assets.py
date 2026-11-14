#!/usr/bin/env python3
"""Genera los PNG de pixel-art y el .tilemap base. Uso: python3 tools/gen_assets.py"""
import random, os
from PIL import Image, ImageDraw
OUT = os.path.join(os.path.dirname(__file__), "..", "ultimo_refugio", "main")
TS = 16
rnd = random.Random(7)

def noise(img, base, amp, px=1):
    d = ImageDraw.Draw(img)
    for y in range(img.height):
        for x in range(img.width):
            v = rnd.randint(-amp, amp)
            d.point((x, y), tuple(max(0, min(255, c + v)) for c in base) + (255,))

# ---- tiles.png: 1 hierba, 2 calle, 3 acera, 4 suelo, 5 agua, 6 pared, 7 puerta, 8 arbol ----
tiles = Image.new("RGBA", (TS * 8, TS), (0, 0, 0, 0))
def tile(i, base, amp, extra=None, transparent=False):
    t = Image.new("RGBA", (TS, TS), (0, 0, 0, 0 if transparent else 255))
    if not transparent: noise(t, base, amp)
    if extra: extra(ImageDraw.Draw(t))
    tiles.paste(t, (i * TS, 0))
tile(0, (74, 112, 58), 10)
tile(1, (58, 60, 64), 6, lambda d: d.line([(0, 8), (5, 8)], fill=(200, 190, 90, 255)))
tile(2, (150, 148, 140), 6, lambda d: d.rectangle([0, 0, 15, 0], fill=(120, 118, 110, 255)))
tile(3, (138, 104, 70), 7, lambda d: [d.line([(0, y), (15, y)], fill=(110, 80, 52, 255)) for y in (5, 11)])
tile(4, (44, 96, 150), 9, lambda d: [d.line([(2, y), (6, y)], fill=(110, 160, 210, 255)) for y in (4, 10)])
def wall(d):
    d.rectangle([0, 0, 15, 15], fill=(112, 82, 70, 255)); d.rectangle([0, 0, 15, 15], outline=(70, 48, 40, 255))
    for y in (4, 8, 12): d.line([(0, y), (15, y)], fill=(80, 58, 48, 255))
    for y, o in ((0, 4), (4, 10), (8, 4), (12, 10)): d.line([(o, y), (o, y + 4)], fill=(80, 58, 48, 255))
tile(5, (0, 0, 0), 0, wall)
def door(d):
    d.rectangle([2, 0, 13, 15], fill=(96, 62, 34, 255), outline=(52, 32, 16, 255)); d.ellipse([10, 8, 11, 9], fill=(220, 190, 80, 255))
tile(6, (0, 0, 0), 0, door)
def tree(d):
    d.rectangle([7, 10, 8, 15], fill=(84, 56, 30, 255))
    d.ellipse([1, 0, 14, 12], fill=(38, 84, 38, 255)); d.ellipse([4, 2, 10, 7], fill=(58, 110, 50, 255))
tile(7, (0, 0, 0), 0, tree, transparent=True)
tiles.save(os.path.join(OUT, "tiles.png"))

# ---- sprites ----
def sprite(name, size, fn):
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0)); fn(ImageDraw.Draw(im)); im.save(os.path.join(OUT, name + ".png"))
def person(skin, shirt, pants, torn=False):
    def f(d):
        d.ellipse([5, 1, 10, 6], fill=skin, outline=(20, 20, 20, 255))
        d.rectangle([4, 7, 11, 11], fill=shirt, outline=(20, 20, 20, 255))
        d.rectangle([2, 7, 3, 11], fill=skin); d.rectangle([12, 7, 13, 11], fill=skin)
        d.rectangle([5, 12, 10, 15], fill=pants)
        d.line([(7, 12), (7, 15)], fill=(20, 20, 20, 255))
        if torn: d.rectangle([4, 9, 6, 11], fill=(110, 30, 30, 255)); d.point((6, 3), fill=(200, 30, 30, 255)); d.point((9, 3), fill=(200, 30, 30, 255))
    return f
sprite("player", 16, person((232, 190, 150, 255), (50, 90, 170, 255), (60, 60, 70, 255)))
sprite("zombie", 16, person((120, 160, 110, 255), (110, 100, 80, 255), (70, 70, 50, 255), torn=True))
def crate(d):
    d.rectangle([1, 3, 10, 10], fill=(190, 140, 70, 255), outline=(80, 50, 20, 255)); d.line([(1, 6), (10, 6)], fill=(80, 50, 20, 255)); d.line([(5, 3), (5, 10)], fill=(80, 50, 20, 255))
sprite("loot", 12, crate)

# ---- world.tilemap: capa ground llena de hierba (64x64) y capa obj vacia ----
W = H = 64
lines = ['tile_set: "/main/tiles.tilesource"', "layers {", '  id: "ground"', "  z: 0.0", "  is_visible: 1"]
for y in range(H):
    for x in range(W):
        lines.append(f"  cell {{ x: {x} y: {y} tile: 0 h_flip: 0 v_flip: 0 }}")
lines += ["}", "layers {", '  id: "obj"', "  z: 0.1", "  is_visible: 1", "}",
          'material: "/builtins/materials/tile_map.material"', "blend_mode: BLEND_MODE_ALPHA"]
open(os.path.join(OUT, "world.tilemap"), "w").write("\n".join(lines) + "\n")
print("assets ok")
