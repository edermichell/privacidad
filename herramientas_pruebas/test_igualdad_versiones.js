// Una partida creada con la v105 debe verse y simularse EXACTAMENTE igual en la v106 (con el movimiento ambiental desactivado para comparar).
const { chromium } = require('playwright'); const crypto = require('crypto'); const fs = require('fs');
const SR = fs.readFileSync(__dirname + '/lib.js', 'utf8').split('\n').find(l => l.includes('window.spawnRing = ')).trim();
async function page(html) {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 915, height: 412 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { let s = 123456789; Math.random = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; let t = 1e6; performance.now = () => (t += 16.7); window.requestAnimationFrame = () => 0; const D0 = 1.7e12; Date.now = () => D0; });
  await p.goto('file://' + html); await p.waitForTimeout(1500); await p.evaluate(SR); return { b, p, errs };
}
(async () => {
  const A = await page(process.env.OLD_HTML);
  const sav = await A.p.evaluate(() => { OPT.mode = 'full'; OPT.world = Object.assign({}, OPT.world || {}, { seed: 'old106' }); newGame(); if (window.INTRO) { try { introSkip(); } catch (e) { } } P.ghost = 1e9; GT.min = 13 * 60; window.spawnRing(40, 5, 16); for (let i = 0; i < 30; i++) updateGame(.1); return JSON.stringify(buildSave()); });
  await A.b.close(); let fails = 0;
  const res = [];
  for (const html of [process.env.OLD_HTML, process.env.GAME_HTML]) {
    const { b, p, errs } = await page(html);
    const r = await p.evaluate((sav) => { if (typeof S106 !== 'undefined') S106.vis = false; if (typeof NPCLOD !== 'undefined') NPCLOD.on = false; const ok = applySave(JSON.parse(sav), false); P.ghost = 1e9; GT.min = 13 * 60; GT.rain = 0; GT.rainTarget = 0; GT.rainT = 9999; const hs = []; IN.jx = 0; IN.jy = 0;
      for (let i = 0; i < 240; i++) { if (i % 60 === 0) { IN.jx = [1, 0, -1, 0][i / 60 | 0]; IN.jy = [0, 1, 0, -1][i / 60 | 0]; } updateGame(1 / 60); render(1 / 60); }
      const z = Z.filter(q => q.st !== 'dead').slice(0, 300).map(q => [q.x.toFixed(3), q.y.toFixed(3), q.st].join(',')).join(';'); const c = document.getElementById('c'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let x = 2166136261; for (let i = 0; i < d.length; i++) { x ^= d[i]; x = Math.imul(x, 16777619) >>> 0; }
      return { ok, z, img: String(x), n: Z.length, cars: cars.length, sc: typeof WG !== 'undefined' && WG.sc || 0 }; }, sav);
    r.errs = errs; res.push(r); await b.close();
  }
  const [a, n] = res; const same = a.z === n.z && a.img === n.img && a.n === n.n && a.cars === n.cars && !a.errs.length && !n.errs.length;
  console.log(same ? 'OK  ' : 'FAIL', 'partida de la v105 cargada en la v106: imagen', a.img === n.img ? 'idéntica' : 'DISTINTA', '| zombis', a.z === n.z ? 'idénticos' : 'DISTINTOS', '| autos', a.cars, n.cars, '| escenas en v106:', n.sc, '| errores', a.errs.length + n.errs.length);
  process.exit(same ? 0 : 1);
})();
