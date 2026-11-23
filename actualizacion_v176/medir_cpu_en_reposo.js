// CPU del hilo principal por segundo de reloj en distintos estados (CPU x4)
const { newTake } = require('./lib');
(async () => { const T = await newTake({ html: process.env.H, seed: 'idle', rt: true, w: 915, h: 412, dsf: 2.625, hideUI: [] });
  const cdp = await T.page.context().newCDPSession(T.page); await cdp.send('Performance.enable'); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const m = async () => { const { metrics } = await cdp.send('Performance.getMetrics'); const o = {}; for (const x of metrics) o[x.name] = x.value; return o; };
  const meas = async (name, setup) => { await T.ev(setup); await T.run(2500); const a = await m(); const fc0 = await T.ev(() => window.__fc | 0); await T.run(5000); const b = await m(); const fc1 = await T.ev(() => window.__fc | 0);
    console.log(name.padEnd(22), 'CPU', (((b.TaskDuration - a.TaskDuration) / 5) * 100).toFixed(0).padStart(3) + '% del hilo', '| render', ((fc1 - fc0) / 5).toFixed(0), 'cuadros/s'); };
  await T.ev(() => { const _r = render; render = function () { window.__fc = (window.__fc | 0) + 1; return _r.apply(this, arguments); }; window.__keep = setInterval(() => { if (P) { P.hp = 100; } }, 200); const c = nearestCross(P.x, P.y); tp(c[0], c[1]); });
  await meas('jugando', () => { PAUSED = false; const e = document.getElementById('pause'); if (e) e.hidden = true; });
  await meas('menú de pausa', () => { setPause(true); });
  await meas('mochila abierta', () => { setPause(false); UI.toggleInv(); });
  await meas('fabricar abierto', () => { UI.closeAll(); UI.toggleCraft(); });
  await meas('mapa abierto', () => { UI.closeAll(); give('map'); UI.toggleMap(); window.__mapOpen = !document.getElementById('map').hidden; });
  await meas('menú principal', () => { UI.closeAll(); toMenu(); });
  await T.close(); })();
