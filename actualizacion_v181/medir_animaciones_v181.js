const { newTake } = require('./lib');
(async () => {
  const T = await newTake({ html: process.env.H, seed: 'pf181', w: 915, h: 412, dsf: 2, rt: true, hideUI: [] });
  const ev = (f, a) => T.ev(f, a);
  await ev(() => { const c = nearestCross(P.x, P.y); tp(c[0] + 1, c[1] + 1); P.ghost = 1e9; if (typeof GRAB !== 'undefined') GRAB.off = true; OPT.q = 'high'; LOWQ = false; resize();
    window.__spawn = () => { spawnRing(60 - Z.filter(z => z.st !== 'dead').length, 2, 8, ['walker', 'runner']); for (const z of Z) if (z.st !== 'dead') { z.st = 'chase'; z.seen = 99; } };
    __spawn(); setInterval(() => { P.hp = 100; P.ghost = 1e9; }, 300);
    /* golpes continuos: 6 golpes cada 100 ms y alguna muerte; los cadáveres se retiran para no acumular */
    setInterval(() => { const L = Z.filter(z => z.st !== 'dead' && Math.hypot(z.x - P.x, z.y - P.y) < 9); for (let i = 0; i < 6 && L.length; i++) { const z = L[(Math.random() * L.length) | 0]; damageZombie(z, Math.random() < .25 ? 9999 : 3, { from: P, noPush: true }); }
      for (let i = Z.length - 1; i >= 0; i--) if (Z[i].st === 'dead' && performance.now() - Z[i].dieAt > 2000) Z.splice(i, 1); __spawn(); }, 100);
    window.__acc = { on: [0, 0], off: [0, 0] }; window.__rounds = { on: [], off: [] }; const _r = render; render = function () { const t = performance.now(); const r = _r.apply(this, arguments); const k = AN181.off ? 'off' : 'on'; __acc[k][0] += performance.now() - t; __acc[k][1]++; return r; }; });
  await T.run(3000);
  const cdp = await T.page.context().newCDPSession(T.page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: +(process.env.RATE || 4) });
  await ev(() => { __acc.on = [0, 0]; __acc.off = [0, 0]; AN181.stats.recoil = AN181.stats.land = 0; });
  for (let r = 0; r < 16; r++) { await ev(o => { AN181.off = o; __acc.on = [0, 0]; __acc.off = [0, 0]; }, r % 2 === 1); await T.run(2000); await ev(() => { for (const k of ['on', 'off']) if (__acc[k][1]) __rounds[k].push(__acc[k][0] / __acc[k][1]); }); }
  console.log(JSON.stringify(await ev(() => ({ conAnim_mediana: (a => +a.sort((x, y) => x - y)[a.length >> 1].toFixed(2))(__rounds.on.slice()), sinAnim_mediana: (a => +a.sort((x, y) => x - y)[a.length >> 1].toFixed(2))(__rounds.off.slice()), rondas: __rounds.on.length, retrocesosDibujados: AN181.stats.recoil, aterrizajes: AN181.stats.land, LOWQ }))));
  await T.close();
})();
