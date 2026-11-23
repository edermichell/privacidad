// Pruebas v17.5: ataques de zombi con preparación y prioridad de USAR
const { newTake } = require('./lib');
let fails = 0; const ok = (c, m, x) => { console.log((c ? 'OK   ' : 'FAIL ') + m + (x !== undefined ? ' ' + JSON.stringify(x) : '')); if (!c) fails++; };
(async () => {
  const T = await newTake({ html: process.env.H, seed: 't175', w: 1280, h: 720, dsf: 1, invuln: false, hideUI: [] });
  const ev = (f, a) => T.ev(f, a);
  // un sitio despejado y registro de preparaciones y golpes
  await ev(() => { clearZ(); const c = nearestCross(P.x, P.y); tp(c[0], c[1]); for (const k in keys) keys[k] = false; PAUSED = false;
    window.__ws = []; window.__hs = []; const _s = ur175WindStart; ur175WindStart = function (z, t) { __ws.push(TIME); return _s.apply(this, arguments); };
    const _h = zombieHit; zombieHit = function (z) { __hs.push([TIME, z.wind || 0]); return _h.apply(this, arguments); };
    window.__mk = (dx, dy, ty) => { const z = mkZombie(P.x + dx, P.y + dy, ty || 'walker'); z.st = 'chase'; z.seen = 99; z.los = true; z.lx = P.x; z.ly = P.y; z.spd = 0; Z.push(z); return z; };
    window.__keep = () => { P.hp = 100; P.wounds = []; P.inf = 0; P.end = 100; P.pain = 0; }; });
  // 1) quieto junto a un zombi: los golpes llegan ~0,3 s después de empezar la preparación
  await ev(() => { __keep(); window.__z = __mk(.7, 0); });
  for (let i = 0; i < 10; i++) { await T.run(1000); await ev(() => __keep()); }
  let r = await ev(() => { const d = __hs.map(h => { const w = __ws.filter(t => t <= h[0] + 1e-6).pop(); return w === undefined ? -1 : +(h[0] - w).toFixed(3); }); return { prep: __ws.length, golpes: __hs.length, retrasos: d }; });
  ok(r.prep >= 6 && r.prep <= 11, 'ritmo de ataques igual que antes (6-11 en 10 s)', r.prep);
  ok(r.golpes >= 3 && r.retrasos.every(x => x > .26 && x < .4), 'cada golpe llega 0,26-0,4 s después de su preparación', r);
  // 2) si te alejas durante la preparación, falla
  r = await ev(() => { clearZ(); __keep(); const z = __mk(.7, 0); z.atkCd = 0; window.__hs.length = 0; const w0 = MX.zwhiff | 0; return { w0 }; });
  for (let k = 0; k < 40; k++) { const st = await ev(() => Z[0].wind > 0); if (st) break; await T.run(20); }
  r = await ev(w0 => { const z = Z[0]; const had = z.wind > 0; P.x -= 1.6; return { had, w0 }; }, r.w0);
  await T.run(500);
  let r2 = await ev(w0 => ({ golpes: __hs.length, fallos: (MX.zwhiff | 0) - w0, hp: P.hp }), r.w0);
  ok(r.had && r2.golpes === 0 && r2.fallos >= 1 && r2.hp === 100, 'alejarse durante la preparación hace que falle', { ...r, ...r2 });
  // 3) pegarle durante la preparación cancela su golpe
  await ev(() => { clearZ(); __keep(); const c = nearestCross(P.x, P.y); tp(c[0], c[1]); const z = __mk(.7, 0); z.atkCd = 0; z.hp = 999; __hs.length = 0; });
  for (let k = 0; k < 40; k++) { if (await ev(() => Z[0].wind > 0)) break; await T.run(20); }
  r = await ev(() => { const z = Z[0]; const had = z.wind > 0; damageZombie(z, 5, {}); return { had, stun: z.stun, wind: z.wind }; });
  await T.run(450);
  r2 = await ev(() => ({ golpes: __hs.filter(h => true).length, hp: P.hp }));
  ok(r.had && r2.golpes === 0 && r2.hp === 100, 'golpearlo durante su preparación lo aturde y cancela el ataque', { ...r, ...r2 });
  // 4) con la voltereta al ver la preparación, no hiere
  await ev(() => { clearZ(); __keep(); const c = nearestCross(P.x, P.y); tp(c[0], c[1]); P.dir = 0; const z = __mk(.7, 0); z.atkCd = 0; __hs.length = 0; P.rollCd = 0; });
  for (let k = 0; k < 40; k++) { if (await ev(() => Z[0].wind > 0)) break; await T.run(20); }
  await ev(() => urRoll()); await T.run(600);
  r = await ev(() => ({ hp: P.hp, w: P.wounds.length }));
  ok(r.hp === 100 && r.w === 0, 'rodar al ver la preparación evita el golpe', r);
  // 5) tipos: corredor más rápido, bruto más lento; difícil más rápido
  r = await ev(() => { const a = ur175WindTime({ type: 'walker' }), b = ur175WindTime({ type: 'runner' }), c = ur175WindTime({ type: 'brute' }); return [a, b, c].map(x => +x.toFixed(3)); });
  ok(r[1] < r[0] && r[2] > r[0], 'preparación: corredor < caminante < bruto', r);
  // 6) dibujo: se dibuja inclinado y en rojo, sin errores
  await ev(() => { clearZ(); __keep(); const c = nearestCross(P.x, P.y); tp(c[0], c[1]); GT.min = 13 * 60; const z = __mk(1.4, -1.4); z.wind = 5; z.windT = P; z.atkCd = 9; window.__zv = z; });
  await T.run(200);
  const shot = await T.page.screenshot({ clip: { x: 540, y: 250, width: 200, height: 200 } });
  require('fs').writeFileSync(process.env.OUT + '/prep.png', shot);
  r = await ev(() => { let err = null; try { __zv.windVis = true; __zv.wind = 0; drawZombie(__zv, P); } catch (e) { err = e.message; } return err; });
  ok(r === null, 'el zombi preparando el golpe se dibuja sin errores (también en invitado)', r);
  // 7) red: el bit 32 enciende la preparación en el invitado y se apaga
  r = await ev(() => { const z = { x: P.x + 2, y: P.y }; ur175WindVis(z, true); const a = ur175Winding(z); ur175WindVis(z, false); return [a, ur175Winding(z)]; });
  ok(r[0] === true && r[1] === false, 'invitado: la preparación se ve y se apaga con el estado del anfitrión', r);
  // 8) USAR: cadáver junto a un auto
  r = await ev(() => { clearZ(); const c = nearestCross(P.x, P.y); tp(c[0] + .5, c[1] + .5); floorItems.length = 0;
    let car = cars.find(q => !q.dead) || null; if (!car) return null; const sv = [car.x, car.y, car.a]; car.x = P.x + .9; car.y = P.y + .2; car.a = Math.PI;   /* maletero hacia fuera (a 1,9 casillas) */
    const z = mkZombie(P.x - .4, P.y, 'walker'); z.st = 'dead'; z.dieAt = 0; Z.push(z);
    P.dir = Math.PI; const t1 = findInteract(); const a1 = t1 && t1.type;      // mirando al cadáver
    P.dir = 0; const t2 = findInteract(); const a2 = t2 && t2.type;            // mirando al auto
    car.x = sv[0]; car.y = sv[1]; car.a = sv[2]; return [a1, a2]; });
  ok(r && r[0] === 'corpse' && r[1] === 'car', 'USAR: mirando al cadáver lo registra; mirando al auto, el auto', r);
  // 9) sin autos, la prioridad entre cadáver y objeto en el suelo no cambia (gana lo más cercano)
  r = await ev(() => { clearZ(); const c = nearestCross(P.x, P.y); tp(c[0] + .5, c[1] + .5); const sv = cars.map(q => [q, q.x, q.y]); for (const q of cars) { if (Math.hypot(q.x - P.x, q.y - P.y) < 4) { q.x += 50; } }
    const z = mkZombie(P.x + .8, P.y, 'walker'); z.st = 'dead'; Z.push(z); floorItems.length = 0; floorItems.push({ x: P.x - .3, y: P.y, it: mkItem('nails', 2) });
    const t = findInteract(); for (const [q, x, y] of sv) { q.x = x; q.y = y; } floorItems.length = 0; return t && t.type; });
  ok(r === 'item', 'sin autos, un objeto más cercano sigue ganando al cadáver', r);
  console.log('fallos:', fails); await T.close();
})();
