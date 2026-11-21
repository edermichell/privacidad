const { newTake } = require('./lib');
(async () => {
  for (const sc of ['calle_dia', 'tardio']) {
  const T = await newTake({ html: process.env.H, seed: 'stg', rt: true, w: 915, h: 412, dsf: 2.625, hideUI: [] });
  const cdp = await T.page.context().newCDPSession(T.page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await T.ev(sc => { window.__keep = setInterval(() => { if (P) { P.hp = 100; } }, 100); if (sc === 'tardio') { P.ghost = 1e9; GT.min += 8 * 1440; if (OB) { OB.acc = 1; for (let i = 0; i < 30; i++) obTick(.5); } } const c = nearestCross(P.x, P.y); tp(c[0], c[1]); }, sc); await T.run(2500);
  await T.ev(() => { window.__nm = { t: 0, f: 0, near: 0, far: 0, tN: 0, tF: 0 }; const o = updNpc; updNpc = function (n, dt) { const t = performance.now(); const r = o.apply(this, arguments); const d = Math.hypot(n.x - P.x, n.y - P.y), e = performance.now() - t; if (d < 24) { __nm.near++; __nm.tN += e; } else { __nm.far++; __nm.tF += e; } return r; }; const u = updNpcs; updNpcs = function () { const t = performance.now(); const r = u.apply(this, arguments); __nm.t += performance.now() - t; __nm.f++; return r; }; });
  await T.run(6000);
  const r = await T.ev(() => { const m = __nm; return { frames: m.f, updNpcs_ms_por_fotograma: +(m.t / m.f).toFixed(2), cerca_por_fotograma: +(m.near / m.f).toFixed(1), lejos_por_fotograma: +(m.far / m.f).toFixed(1), ms_cerca: +(m.tN / m.f).toFixed(2), ms_lejos: +(m.tF / m.f).toFixed(2), npcs: NPCS.length }; });
  console.log(sc, JSON.stringify(r)); await T.close(); }
})();
