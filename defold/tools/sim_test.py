#!/usr/bin/env python3
"""Prueba de humo de game.script con una API de Defold simulada (pip install lupa).
No sustituye probar en el motor real; sirve para cazar errores de logica/nil en Lua."""
import os, sys
from lupa import LuaRuntime
base = os.path.join(os.path.dirname(__file__), "..", "ultimo_refugio", "main")
L = LuaRuntime(unpack_returned_tuples=True)
L.execute(r'''
W, H = 64, 64
vmath = { vector3 = function(x,y,z) return {x=x,y=y,z=z} end,
          vector4 = function(x,y,z,w) return {x=x,y=y,z=z,w=w} end }
function hash(s) return "h:"..s end
window = { get_size = function() return 960, 540 end }
tcount = 0
tilemap = { get_bounds = function() return 1, 1, W, H end,
  set_tile = function(u,l,x,y,t)
    assert(x>=1 and x<=W and y>=1 and y<=H, "set_tile fuera de limites "..x..","..y)
    assert(t>=1 and t<=8, "tile invalido "..tostring(t)); tcount = tcount + 1 end }
gos, nid = {}, 0
go = { set_position = function(p,id) assert(p.x==p.x and p.y==p.y, "NaN pos") end,
       delete = function(id) assert(gos[id], "go.delete doble/invalido "..tostring(id)); gos[id]=nil end }
factory = { create = function(u,pos) nid=nid+1; gos[nid]=true; return nid end }
last_state = nil
msg = { post = function(r,m,d) if m=="state" then last_state=d end end }
function go_count() local c=0 for _ in pairs(gos) do c=c+1 end return c end
''')
L.execute(open(os.path.join(base, "game.script")).read())
G = L.globals()
self = L.eval("{}")
G.init(self)
assert L.eval("tcount") >= 64 * 64, "no se pinto el mundo"
print("mundo ok: tiles puestos =", L.eval("tcount"), "| zombis =", len(self.zombies), "| botin =", len(self.loot))

import random
random.seed(1)
keys = ["up", "down", "left", "right"]
dead_seen = False
for frame in range(60 * 600):               # 10 minutos simulados a 60 fps
    if frame % 40 == 0:
        a = random.choice(keys)
        G.on_input(self, "h:" + a, L.eval("{pressed=true,released=false}"))
        G.on_input(self, "h:" + random.choice(keys), L.eval("{pressed=false,released=true}"))
    if frame % 300 == 0:
        G.on_input(self, "h:use_food", L.eval("{pressed=true}"))
        G.on_input(self, "h:use_drink", L.eval("{pressed=true}"))
        G.on_input(self, "h:use_med", L.eval("{pressed=true}"))
    G.update(self, 1 / 60)
    if self.dead and not dead_seen:
        dead_seen = True
        print("murio en frame", frame, "dia", self.day, "bajas", self.kills)
        G.on_input(self, "h:restart", L.eval("{pressed=true}"))
        assert not self.dead and self.hp == 100, "restart fallo"
st = L.eval("last_state")
print("estado final:", dict(st))
print("go vivos:", L.eval("go_count()"), "= zombis", len(self.zombies), "+ botin", len(self.loot), "+ 0")
assert L.eval("go_count()") == len(self.zombies) + len(self.loot), "fuga de gameobjects"
print("OK")
