const { newTake } = require('./lib');
(async () => {
  const T = await newTake({ html: process.env.H, seed: 'pf184', w: 915, h: 412, dsf: 2, rt: true, hideUI: [] });
  const ev = (f, a) => T.ev(f, a);
  await ev(() => { const c = nearestCross(P.x, P.y); tp(c[0] + 1, c[1] + 1); P.ghost = 1e9; if (typeof GRAB !== 'undefined') GRAB.off = true; GT.min = 13 * 60; setInterval(() => { P.hp = 100; P.ghost = 1e9; }, 500);
    /* gente alrededor (como en un barrio con vida) */ for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28, x = P.x + Math.cos(a) * (2 + i % 4), y = P.y + Math.sin(a) * (2 + i % 4); if (!solidTile(Math.floor(x), Math.floor(y))) mkNpc('refugee', x, y, {}); }
    window.__a = { on: [], off: [] }; window.__c = { n: 0, ms: 0, f: 0, fms: 0 };
    const _d = drawNpc; drawNpc = function () { const t = performance.now(); const r = _d.apply(this, arguments); __c.ms += performance.now() - t; __c.n++; return r; };
    const _r = render; render = function () { const t = performance.now(); const r = _r.apply(this, arguments); __c.fms += performance.now() - t; __c.f++; return r; }; });
  await T.run(2500);
  const cdp = await T.page.context().newCDPSession(T.page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: +(process.env.RATE || 4) });
  for (let r = 0; r < 16; r++) { await ev(o => { LBL184.off = o; __c.n = __c.ms = __c.f = __c.fms = 0; }, r % 2 === 1); await T.run(2000); await ev(o => { __a[o ? 'off' : 'on'].push([__c.ms / Math.max(1, __c.f), __c.fms / Math.max(1, __c.f), __c.n / Math.max(1, __c.f)]); }, r % 2 === 1); }
  console.log(JSON.stringify(await ev(() => { const med = (a, i) => { const v = a.map(x => x[i]).sort((p, q) => p - q); return +v[v.length >> 1].toFixed(2); };
    return { personasDibujadasPorCuadro: med(__a.on, 2), dibujarPersonas_ms: { conCache: med(__a.on, 0), sinCache: med(__a.off, 0) }, cuadroEntero_ms: { conCache: med(__a.on, 1), sinCache: med(__a.off, 1) }, nombresCreados: LBL184.made, reutilizados: LBL184.hits }; })));
  await T.close();
})();
