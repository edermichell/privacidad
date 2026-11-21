const { chromium } = require('playwright'); const { newTake } = require('./lib'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ck = (ok, m, x) => { console.log(ok ? 'OK  ' : 'FAIL', m, x === undefined ? '' : JSON.stringify(x)); if (!ok) fails++; };
const OLD = process.env.OLD_HTML, NEW = process.env.GAME_HTML;
const sig = () => Z.filter(z => z.st !== 'dead').map(z => [Math.round(z.x * 100), Math.round(z.y * 100), Math.round(z.hp), z.type, z.skin, z.shirt, z.pants, z.hair, !!z.blood, !!z.torn].join(',')).sort().join('|');
const prep = () => { P.ghost = 1e9; GT.min += 6 * 1440; if (OB) { OB.acc = 1; for (let i = 0; i < 30; i++) obTick(.5); } let k = 0; for (const z of Z) { if (k % 3 === 0) z.blood = true; if (k % 5 === 0) z.torn = true; k++; } };
(async () => {
  // 1) guardado de la 17.0 → se carga en la 17.1
  let T = await newTake({ html: OLD, rt: false, seed: 'sv171', mode: 'full', diff: 'normal', w: 915, h: 412, dsf: 1, hideUI: [] });
  await T.ev(prep); await T.run(500); await T.ev(() => { PAUSED = true; }); const old = await T.ev(() => { saveGame(); return localStorage.getItem(SAVEKEY); }); const sigOld = await T.ev(sig + ';(' + sig.toString() + ')()').catch(async () => T.ev(new Function('return (' + sig.toString() + ')()')));
  await T.close();
  ck(old && old.length > 50000, 'guardado de la 17.0 obtenido', old && old.length);
  // la 17.1 lo carga
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const c = await b.newContext({ viewport: { width: 915, height: 412 } }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + NEW); await p.waitForFunction(() => window.__UR_BOOT_OK, null, { timeout: 60000 });
  await p.evaluate(raw => { localStorage.setItem(SAVEKEY, raw); }, old);
  const ld = await p.evaluate(fn => { const ok = loadGame(); PAUSED = true; return [ok, new Function('return (' + fn + ')()')()]; }, sig.toString());
  ck(ld[0], 'la 17.1 carga la partida guardada con la 17.0');
  ck(ld[1] === sigOld, 'mismos zombis (posición, vida, tipo, colores, sangre, ropa rota)', { iguales: ld[1] === sigOld, n: ld[1].split('|').length });
  // 2) la 17.1 guarda y vuelve a cargar idéntico, en el formato nuevo
  const rt = await p.evaluate(fn => { const f = new Function('return (' + fn + ')()'); const a = f(); STATE = 'play'; saveGame(); const raw = localStorage.getItem(SAVEKEY), o = JSON.parse(raw); const ok = loadGame(); PAUSED = true; return { ok, igual: f() === a, kb: Math.round(raw.length / 1024), zd: Array.isArray(o.zd) ? o.zd.length : -1, len: o.Z[0].length }; }, sig.toString());
  ck(rt.ok && rt.igual && rt.zd > 0 && rt.len === 11, 'guardar y cargar en la 17.1: idéntico, con diccionario de ' + rt.zd + ' valores', rt);
  ck(rt.kb < old.length / 1024 * .8, 'el archivo ocupa menos: ' + Math.round(old.length / 1024) + ' KB → ' + rt.kb + ' KB');
  // 3) tiempo de guardado con el procesador frenado ×4 (media de 12)
  const cdp = await c.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const tNew = await p.evaluate(() => { STATE = 'play'; const o = []; for (let k = 0; k < 12; k++) { const t = performance.now(); saveGame(); o.push(performance.now() - t); } o.sort((a, b) => a - b); return +(o[6]).toFixed(1); });
  await p.evaluate(raw => { localStorage.setItem(SAVEKEY, raw); }, old);
  console.log('   mediana del guardado (×4) en la 17.1:', tNew, 'ms'); ck(!errs.length, 'sin errores', errs.slice(0, 2));
  await b.close();
  // misma medida en la 17.0
  T = await newTake({ html: OLD, rt: false, seed: 'sv171', mode: 'full', diff: 'normal', w: 915, h: 412, dsf: 1, hideUI: [] }); await T.ev(prep); await T.run(500);
  const cd2 = await T.page.context().newCDPSession(T.page); await cd2.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const tOld = await T.ev(() => { PAUSED = true; const o = []; for (let k = 0; k < 12; k++) { const t = performance.now(); saveGame(); o.push(performance.now() - t); } o.sort((a, b) => a - b); return +(o[6]).toFixed(1); });
  console.log('   mediana del guardado (×4) en la 17.0:', tOld, 'ms'); await T.close();
  console.log(fails ? 'fallos: ' + fails : 'TODO OK');
})();
