// Explorador multijugador: 2-3 invitados-bot en una sala del servidor; al final, errores silenciosos del servidor y de los teléfonos
const { chromium } = require('playwright'); const URL = 'http://127.0.0.1:18080', ROOM = process.env.ROOM || 'SALA1'; const sleep = ms => new Promise(r => setTimeout(r, ms));
const ev = async js => { const t = await (await fetch(URL + '/admin/eval?sala=' + ROOM + '&js=' + encodeURIComponent(js))).text(); try { return JSON.parse(t); } catch (e) { return t; } };
const waitIn = async (p, t = 90) => { for (let i = 0; i < t * 2; i++) { await sleep(500); if (await p.evaluate(() => NET.st === 'playing' && STATE === 'play').catch(() => false)) return true; } return false; };
async function join(ctx, nick) { const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.on('dialog', d => d.accept()); await p.goto(URL + '/juego/'); await p.waitForFunction(() => typeof netJoinWs === 'function');
  await p.evaluate(n => { localStorage.setItem('ur_nick', n); window.urAsk = async () => true; }, nick); await p.evaluate(() => $('bMulti').click());
  await p.waitForFunction(r => S137.ok && document.querySelector('[data-room="' + r + '"]'), ROOM, { timeout: 30000 }); await p.evaluate(r => document.querySelector('[data-room="' + r + '"]').click(), ROOM);
  if (!await waitIn(p)) throw new Error('no entra ' + nick); await p.evaluate(() => { DBGC.n = 0; DBGC.msg = {}; DBGC.nk = 0; }); return p; }
(async () => {
  const b = await chromium.launch(); const N = +(process.env.N || 3), names = ['Halcon', 'Lobo', 'Zorro'];
  await ev('(DBGC.n=0,DBGC.msg={},DBGC.nk=0,1)');
  const ctxs = [], pages = []; for (let i = 0; i < N; i++) { ctxs.push(await b.newContext({ viewport: { width: 915, height: 412 } })); pages.push(await join(ctxs[i], names[i])); }
  // juntarlos: todos al lado del primero
  const t0 = Date.now(), SECS = +(process.env.SECS || 240); let k = 0, rejoin = 0;
  while (Date.now() - t0 < SECS * 1000) {
    k++;
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      try {
        await p.evaluate(k => { const r = Math.random(); P.hp = Math.max(P.hp, 60); joy.active = true; joy.x = Math.cos(k * .3 + Math.random()); joy.y = Math.sin(k * .41); readKeys();
          if (r < .3) { const o = [...(NET.oth ? NET.oth.values() : [])].find(q => q.ok && !q.dead); if (o) P.dir = Math.atan2(o.y - P.y, o.x - P.x); P.atkCd = 0; tryAttack(); }
          else if (r < .4) doInteract(); else if (r < .45) { if (typeof urRoll === 'function') urRoll(); } else if (r < .5) shove();
          else if (r < .52) { UI.toggleInv(); } else if (r < .55) UI.closeAll(); else if (r < .57) { P.fat = 90; try { startSleep(); } catch (e) { } } else if (r < .6) { P.sleep = false; }
        }, k);
      } catch (e) { }
    }
    // cada ~60 s: uno se va sin despedirse (corte) y vuelve; otro se va en combate
    if (k % 120 === 60 && pages[1]) { try { await pages[1].evaluate(() => NET.ch && NET.ch.ws && NET.ch.ws.close()); } catch (e) { } }
    if (k % 160 === 100 && pages[2]) { try { await ev("(()=>{for(const q of NET.peers)q.lastCombat=performance.now();return 1})()"); await pages[2].close(); } catch (e) { } await sleep(1500); try { pages[2] = await join(ctxs[2], names[2]); rejoin++; } catch (e) { pages.splice(2, 1); } }
    await sleep(400);
  }
  const srv = await ev('({n:DBGC.n,msg:DBGC.msg})');
  const cli = []; for (const p of pages) { try { cli.push(await p.evaluate(() => ({ n: DBGC.n, msg: DBGC.msg, st: NET.st }))); } catch (e) { cli.push('cerrada'); } }
  console.log('VUELTAS', k, 'reentradas', rejoin);
  console.log('PAGEERR', JSON.stringify(pages.map(p => p.errs.slice(0, 4))));
  console.log('SERVIDOR', JSON.stringify(srv, null, 1));
  console.log('CLIENTES', JSON.stringify(cli, null, 1));
  await b.close();
})().catch(e => { console.log('FAIL excepción', e.message); process.exit(1); });
