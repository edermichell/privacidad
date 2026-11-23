// Reproduce el fallo «invitado atascado en linked» (cooperativo 4 jugadores) con registro de mensajes.
const { chromium } = require('playwright');
const HTML = process.env.GAME_HTML, RUNS = +(process.env.RUNS || 6);
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function mk(b, name) { const ctx = await b.newContext({ viewport: { width: 915, height: 412 } }); const p = await ctx.newPage(); p.on('pageerror', e => console.log('PAGEERR', name, e.message)); await p.goto('file://' + HTML); await p.waitForTimeout(1500); return { p, name }; }
async function instr(x, host) {
  await x.p.evaluate(h => { window.__L = []; const t0 = performance.now(); const log = s => __L.push(((performance.now() - t0) / 1000).toFixed(2) + ' ' + s);
    window.__log = log;
    const _m = netMsg; netMsg = function (o) { if (o && o.t && !/^(P|S|Z|ping|pong|pg|PG)$/.test(o.t)) log('rx ' + o.t + (o.re ? ' REPETIDO#' + o.re : '') + (NET.cur ? ' de#' + NET.cur.slot : '') + ' st=' + NET.st); return _m.apply(this, arguments); };
    if (h) { const _w = netSendWorld; netSendWorld = function () { const p = NET.cur; log('mundo->#' + (p && p.slot) + ' INICIO'); const r = _w.apply(this, arguments); Promise.resolve(r).then(() => log('mundo->#' + (p && p.slot) + ' FIN')); return r; };
      const _sr = netSendRaw; netSendRaw = function (peer, o) { if (o && (o.t === 'W0' || o.t === 'W1')) log('tx ' + o.t + ' ->#' + (peer && peer.slot) + ' chState=' + (peer && peer.ch && peer.ch.readyState)); return _sr.apply(this, arguments); }; }
  }, host);
}
async function join(H, g) {
  const offer = await H.p.evaluate(() => netManHost()); const answer = await g.p.evaluate(o => netManGuest(o), offer); await H.p.evaluate(a => netManHostFinish(a), answer);
  for (let i = 0; i < 50; i++) { await sleep(400); const s = await g.p.evaluate(() => NET.st).catch(() => '?'); if (s === 'playing') return { ok: true, t: i * .4 }; }
  return { ok: false };
}
(async () => {
  let bad = 0;
  for (let run = 1; run <= RUNS; run++) {
    const b = await chromium.launch(); const H = await mk(b, 'host'); const G = [await mk(b, 'g1'), await mk(b, 'g2'), await mk(b, 'g3')];
    await H.p.evaluate(() => { OPT.world.seed = 'coop4'; OPT.mode = 'casual'; }); await H.p.click('#bNew'); await H.p.waitForTimeout(2500); await H.p.keyboard.press('Space'); await H.p.waitForTimeout(2000);
    await instr(H, true); for (const g of G) await instr(g, false);
    const res = []; for (const g of G) res.push(await join(H, g));
    const okAll = res.every(r => r.ok); if (!okAll) bad++;
    console.log('pasada', run, okAll ? 'OK' : 'FALLO', JSON.stringify(res));
    if (!okAll) { console.log('--- anfitrión'); (await H.p.evaluate(() => __L)).forEach(l => console.log('   ' + l));
      for (let i = 0; i < 3; i++) if (!res[i].ok) { console.log('--- ' + G[i].name + ' (atascado)'); (await G[i].p.evaluate(() => __L.concat(['NET.st=' + NET.st, 'ch=' + (NET.ch && NET.ch.readyState)]))).forEach(l => console.log('   ' + l)); }
      const hs = await H.p.evaluate(() => NET.peers.map(p => ({ slot: p.slot, st: p.st, ready: p.ready, sending: p.sending, ch: p.ch && p.ch.readyState, buf: p.ch && p.ch.bufferedAmount })));
      console.log('--- pares del anfitrión', JSON.stringify(hs)); }
    await b.close();
  }
  console.log('FALLOS', bad, 'de', RUNS);
})();
