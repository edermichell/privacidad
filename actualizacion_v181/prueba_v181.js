// Pruebas v18.1: animaciones con peso (retroceso, caída alineada con el cadáver, aterrizaje, levantarse, golpe del jugador)
const { newTake } = require('./lib');
let fails = 0; const ok = (c, m, x) => { console.log((c ? 'OK   ' : 'FAIL ') + m + (x !== undefined ? ' ' + JSON.stringify(x) : '')); if (!c) fails++; };
(async () => {
  const T = await newTake({ html: process.env.H, seed: 't181', w: 915, h: 412, dsf: 1, invuln: false, hideUI: [] });
  const errs = []; T.page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => T.ev(f, a);
  await ev(() => { clearZ(); const c = nearestCross(P.x, P.y); tp(c[0] + 2, c[1] + 2); keepAlive(); P.ghost = 1e9; if (typeof GRAB !== 'undefined') GRAB.off = true; PAUSED = false;
    window.__tr = []; const _t = ctx.translate.bind(ctx); ctx.translate = function (x, y) { if (window.__rec) __tr.push([x, y]); return _t(x, y); }; });
  // 1) retroceso: se aleja de quien golpea (en pantalla), dura ~0,16 s y vuelve a su sitio
  let r = await ev(() => { const z = mkZombie(P.x + 1, P.y, 'walker'); z.st = 'idle'; z.spd = 0; z.hp = 1e6; Z.push(z); window.__z = z; damageZombie(z, 5, { from: P, noPush: true });
    const sx = (z.x - P.x) - (z.y - P.y); return { hx: z.hx181, hy: z.hy181, sx }; });
  ok(r.hx !== undefined && Math.sign(r.hx) === Math.sign(r.sx), 'el golpe guarda la dirección de retroceso (lejos de quien golpea)', r);
  r = await ev(() => { __tr.length = 0; window.__rec = 1; RENDER_NOW = __z.hitT + 40; drawZombie(__z, null); window.__rec = 0; const a = __tr[0]; return { dx: a && a[0], hx: __z.hx181 }; });
  ok(r.dx && Math.sign(r.dx) === Math.sign(r.hx), 'el desplazamiento va hacia atrás (sentido del golpe)', r);
  r = await ev(() => { __tr.length = 0; window.__rec = 1; RENDER_NOW = __z.hitT + 400; drawZombie(__z, null); window.__rec = 0; RENDER_NOW = 0; return __tr.length; });
  ok(r === 0, 'pasado el retroceso, se dibuja sin moverlo (vía rápida)', r);
  // 2) la caída gira hacia el lado del cadáver y acaba donde se dibuja (antes se daba la vuelta al final)
  r = await ev(() => {
    const out = {}; PAUSED = true; const g = ctx;
    for (const dir of [0, Math.PI]) for (const ty of ['walker', 'brute']) {
      const z = mkZombie(P.x, P.y, ty); z.dir = dir; z.st = 'dead'; z.hp = 0;
      const box = fk => { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, g.canvas.width, g.canvas.height); g.restore();
        const now = performance.now(); RENDER_NOW = now; z.dieAt = now - fk * 300; try { drawZombie(z, null); } finally { RENDER_NOW = 0; }
        const W_ = g.canvas.width, H_ = g.canvas.height, d = g.getImageData(0, 0, W_, H_).data; let x0 = 1e9, x1 = -1; for (let y = 0; y < H_; y++) for (let x = 0; x < W_; x++) { const q = (y * W_ + x) * 4; if (d[q] + d[q + 1] + d[q + 2] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; } } return [x0, x1]; };
      const a = box(.999), b = box(2); out[ty + (dir ? 'I' : 'D')] = Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
    }
    PAUSED = false; return out; });
  ok(Object.values(r).every(v => v <= 6), 'al acabar de caer, el cuerpo coincide con el cadáver (≤ 6 px, ambas orientaciones y tamaños)', r);
  // 3) aterrizaje: polvo una sola vez por caída
  r = await ev(() => { clearZ(); const z = mkZombie(P.x + 1, P.y + .5, 'walker'); z.st = 'idle'; z.spd = 0; z.hp = 5; Z.push(z); window.__z = z; AN181.stats.land = 0; damageZombie(z, 999, { from: P }); return z.st; });
  await T.run(900); r = await ev(() => AN181.stats.land);
  ok(r === 1, 'al caer muerto: un golpe contra el suelo (polvo) y solo uno', r);
  // 4) levantarse: se ve girando durante ~0,4 s tras estar derribado
  await ev(() => { clearZ(); const z = mkZombie(P.x + 1.5, P.y + .5, 'walker'); z.st = 'idle'; z.spd = 0; z.hp = 1e6; Z.push(z); window.__z = z; AN181.stats.up = 0; z.st = 'down'; z.downAt = performance.now(); z.downT = .6; window.__rot = 0;
    const _r = ctx.rotate.bind(ctx); ctx.rotate = function (a) { if (window.__inZ && Math.abs(a) > .05) __rot++; return _r(a); };
    const _dz = drawZombie; drawZombie = function (z) { window.__inZ = z === __z; try { return _dz.apply(this, arguments); } finally { window.__inZ = false; } }; });
  await T.run(700); const rot0 = await ev(() => { __rot = 0; return __z.st; });
  for (let i = 0; i < 20 && await ev(() => __z.st === 'down'); i++) await T.run(100);
  await T.run(500); r = await ev(() => ({ up: AN181.stats.up, rot: __rot, st: __z.st }));
  ok(r.up === 1 && r.rot >= 6, 'al levantarse se ve girando varios cuadros (antes aparecía de pie de golpe)', r);
  // 5) el jugador acompaña el golpe cuerpo a cuerpo (y la silueta de la 18.0 le sigue)
  r = await ev(() => { clearZ(); const w = give('bat'); P.eq = w; P.atkCd = 0; P.dir = 0; AN181.stats.lunge = 0; tryAttack(); return P.atk > 0; });
  await T.run(250); r = await ev(() => AN181.stats.lunge);
  ok(r > 3, 'al golpear, el cuerpo del jugador se mueve con el golpe', r);
  // 6) personas: también retroceden y su caída gira hacia el lado correcto
  r = await ev(() => { const n = mkNpc('refugee', P.x + 1, P.y, {}); n.hp = 1e6; damageNpc(n, 1, { from: P }); const o = { hx: n.hx181 }; NPCS.splice(NPCS.indexOf(n), 1); return o; });
  ok(typeof r.hx === 'number', 'las personas también guardan la dirección del golpe', r);
  // 7) apagado: se dibuja como antes (sin desplazamientos)
  r = await ev(() => { const z = mkZombie(P.x + 1, P.y, 'walker'); z.hp = 1e6; Z.push(z); damageZombie(z, 1, { from: P, noPush: true }); AN181.off = true; __tr.length = 0; window.__rec = 1; RENDER_NOW = z.hitT + 30; drawZombie(z, null); window.__rec = 0; RENDER_NOW = 0; AN181.off = false; return __tr.length; });
  ok(r === 0, 'con AN181.off no se aplica nada', r);
  ok(!errs.length, 'sin errores de página', errs.slice(0, 3));
  console.log('fallos:', fails); await T.close();
})();
