// v17.5 en cooperativo real (2 navegadores): un zombi del anfitrión ataca al INVITADO.
// El invitado debe ver la preparación (bit 32) y recibir el golpe a él, no al anfitrión.
const { chromium } = require('playwright');
const HTML = process.env.GAME_HTML;
let fails = 0; const ok = (c, m, x) => { console.log((c ? 'OK   ' : 'FAIL ') + m + (x !== undefined ? ' ' + JSON.stringify(x) : '')); if (!c) fails++; };
async function mk(b, name) { const ctx = await b.newContext({ viewport: { width: 915, height: 412 } }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(name + ': ' + e.message)); await p.goto('file://' + HTML); await p.waitForTimeout(1500); return { p, errs }; }
(async () => {
  const b = await chromium.launch();
  const A = await mk(b, 'host'), B = await mk(b, 'guest');
  await A.p.evaluate(() => { OPT.world.seed = 'coop175'; OPT.mode = 'casual'; }); await A.p.click('#bNew'); await A.p.waitForTimeout(2500); await A.p.keyboard.press('Space'); await A.p.waitForTimeout(2000);
  const offer = await A.p.evaluate(() => netManHost()); const answer = await B.p.evaluate(o => netManGuest(o), offer); await A.p.evaluate(a => netManHostFinish(a), answer);
  for (let i = 0; i < 30; i++) { await A.p.waitForTimeout(500); if ((await B.p.evaluate(() => NET.st)) === 'playing') break; }
  ok(await B.p.evaluate(() => NET.st === 'playing' && STATE === 'play'), 'invitado conectado y jugando');
  await A.p.waitForTimeout(2000);
  // anfitrión lejos; un zombi quieto junto al invitado
  await A.p.evaluate(() => { const g = NET.rp; P.x = g.x + 14; P.y = g.y + 14; snapCam(); Z.length = 0; const z = mkZombie(g.x + .7, g.y, 'walker'); z.st = 'chase'; z.seen = 99; z.spd = 0; z.atkCd = 0; Z.push(z); window.__z = z;
    window.__ws = []; const _s = ur175WindStart; ur175WindStart = function (z, t) { __ws.push(t === P ? 'anfitrion' : 'invitado'); return _s.apply(this, arguments); };
    window.__hk = setInterval(() => { P.hp = 100; P.wounds = []; }, 100); });
  await B.p.evaluate(() => { window.__h0 = P.hp; window.__vis = 0; window.__hits = 0; let last = P.hp; window.__iv = setInterval(() => { if (Z.some(z => z.windVis)) __vis++; if (P.hp < last - .01) __hits++; last = P.hp; if (P.hp < 40) { P.hp = 100; last = 100; } P.wounds = []; }, 40); });
  await A.p.waitForTimeout(9000);
  const ha = await A.p.evaluate(() => __ws.slice());
  const hb = await B.p.evaluate(() => ({ vis: __vis, hits: __hits }));
  ok(ha.length >= 4 && ha.every(x => x === 'invitado'), 'el zombi del anfitrión prepara sus ataques contra el invitado', ha);
  ok(hb.vis >= 3, 'el invitado VE la preparación (destello) en su pantalla', hb);
  ok(hb.hits >= 1, 'el golpe llega al invitado tras la preparación', hb);
  ok(!A.errs.length && !B.errs.length, 'sin errores de página', A.errs.concat(B.errs).slice(0, 4));
  console.log('fallos:', fails); await b.close();
})();
