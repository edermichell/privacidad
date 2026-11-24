// Explorador: juega varios días (modo prueba larga) y vuelca los errores silenciosos (DBGC)
const { newTake } = require('./lib');
(async () => {
  const T = await newTake({ html: process.env.H, seed: process.env.SEED || 'exp1', w: 915, h: 412, dsf: 1, invuln: true, hideUI: [], mode: process.env.MODE || 'full' });
  const errs = []; T.page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => T.ev(f, a);
  await ev(() => { DBGC.n = 0; DBGC.msg = {}; DBGC.nk = 0; window.__acts = 0; });
  const t0 = Date.now(); const DAYS = +(process.env.DAYS || 2);
  // bot: se mueve, ataca, usa, abre paneles, construye, come, duerme, conduce, dispara
  for (let step = 0; step < 100000 && Date.now() - t0 < (+process.env.SECS || 240) * 1000; step++) {
    await ev(k => {
      const r = Math.random(); keepAlive(); P.ghost = (k % 40 < 20) ? 0 : 1e9; if (k % 100 === 0) OPT.grabEasy = !OPT.grabEasy; if (typeof GRAB !== 'undefined' && Math.random() < .3) GRAB.cd = 0;
      joy.active = true; joy.x = Math.cos(k * .37) ; joy.y = Math.sin(k * .53); readKeys();
      try {
        if (r < .25) { P.atkCd = 0; tryAttack(); }
        else if (r < .35) doInteract();
        else if (r < .38) { UI.toggleInv(); } else if (r < .40) UI.closeAll();
        else if (r < .42) { if (typeof urRoll === 'function') urRoll(); }
        else if (r < .44) shove();
        else if (r < .46) { const W_ = Object.keys(ITEMS).filter(i => ITEMS[i].t === 'wpn'); const w = give(W_[k % W_.length]); P.eq = w; const A_ = Object.keys(ITEMS).filter(i => /ammo|shell/.test(i)); if (A_.length) give(A_[k % A_.length], 20); }
        else if (r < .47) { if (ITEMS.molotov) give('molotov'); } else if (r < .48) { if (ITEMS.pipebomb) give('pipebomb'); }
        else if (r < .50) { const z = mkZombie(P.x + 1.2, P.y + .4, ['walker', 'runner', 'brute', 'crawler', 'armored'][k % 5]); z.st = 'chase'; Z.push(z); }
        else if (r < .51) { GT.min += 180; } else if (r < .515) { P.fat = 90; startSleep(); }
        else if (r < .52) { const c = cars.find(q => !q.dead && Math.hypot(q.x - P.x, q.y - P.y) < 40); if (c) { P.x = c.x + 1; P.y = c.y; } }
        else if (r < .53) { const n = NPCS.find(q => q.st !== 'dead' && Math.hypot(q.x - P.x, q.y - P.y) < 30); if (n) damageNpc(n, 8, { from: P }); }
        else if (r < .54) { if (typeof saveGame === 'function') saveGame(); }
        else if (r < .545) { const b = buildings[(k * 7) % buildings.length]; if (b) { P.x = b.x + 1.5; P.y = b.y + 1.5; } }
      } catch (e) { (window.__botErr = window.__botErr || []).push(String(e.message).slice(0, 80)); }
      __acts++;
    }, step);
    await T.run(120);
    
  }
  const r = await ev(() => ({ min: GT.min, acts: __acts, n: DBGC.n, msg: DBGC.msg, bot: (window.__botErr || []).slice(0, 5), st: STATE }));
  console.log('PAGEERR', JSON.stringify(errs.slice(0, 8)));
  console.log(JSON.stringify(r, null, 1));
  await T.close();
})();
