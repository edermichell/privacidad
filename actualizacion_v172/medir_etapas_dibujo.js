// Desglose por etapa del dibujo (diagnóstico interno del juego), procesador frenado ×4, escenas fijas
const { newTake } = require('./lib'); const THR = +(process.env.THROTTLE || 4);
const SC = { calle_dia: () => { clearZ(); const c = nearestCross(P.x, P.y); tp(c[0], c[1]); window.__lock = 13 * 60; spawnRing(10, 6, 14); Z.forEach(z => { z.st = 'idle'; }); },
  noche_lluvia: () => { clearZ(); const c = nearestCross(P.x, P.y); tp(c[0], c[1]); window.__lock = 23 * 60; GT.rain = 1; GT.rainTarget = 1; give('flash'); P.light = true; },
  horda: () => { clearZ(); const c = nearestCross(P.x, P.y); tp(c[0], c[1]); window.__lock = 22 * 60; spawnRing(60, 5, 16); },
  tardio: () => { P.ghost = 1e9; GT.min += 8 * 1440; if (OB) { OB.acc = 1; for (let i = 0; i < 30; i++) obTick(.5); } window.__lock = 8 * 1440 + 13 * 60; const c2 = nearestCross(P.x, P.y); tp(c2[0], c2[1]); } };
(async () => {
  const out = {};
  for (const [n, f] of Object.entries(SC)) {
    const T = await newTake({ html: process.env.H, seed: 'stg', rt: true, w: 915, h: 412, dsf: 2.625, hideUI: [] });
    const cdp = await T.page.context().newCDPSession(T.page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: THR });
    await T.ev(() => { window.__keep = setInterval(() => { if (P) { P.hp = 100; P.end = 100; } if (window.__lock) GT.min = window.__lock; }, 100); });
    await T.ev(f); await T.ev(() => { if (GT.rain === 0) { GT.rainTarget = 0; GT.rainT = 9999; } }); await T.run(2500);
    await T.ev(() => { PERF.diagOn = true; v122ResetRenderStats(); window.__fr = []; let l = performance.now(); (function q() { const t = performance.now(); window.__fr.push(t - l); l = t; if (window.__fr.length < 4000) requestAnimationFrame(q); })(); window.__t0 = performance.now(); });
    await T.run(7000);
    out[n] = await T.ev(() => { const s = v122GetRenderStats(), fr = window.__fr.slice(3).sort((a, b) => a - b); const o = { fps: +(fr.length / ((performance.now() - window.__t0) / 1000)).toFixed(1), p95: +fr[Math.floor(fr.length * .95)].toFixed(0), simMs: +(PERF.simMs || 0).toFixed(1), renderMs: +(PERF.renderMs || 0).toFixed(1) }; for (const k of V122_RENDER_NAMES) if (s[k]) o[k] = +s[k].mean.toFixed(1); return o; });
    console.log(n, JSON.stringify(out[n])); await T.close();
  }
})();
