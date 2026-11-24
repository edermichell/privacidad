// v17.8: sala PvP CON validación de movimiento (sin apagarla): ¿la posición validada sigue al jugador real?
// ¿un corte de conexión devuelve al jugador a su sitio? ¿un teletransporte (trampa) se conserva al salir?
const { chromium } = require('playwright'); const fs = require('fs'); const URL = 'http://127.0.0.1:18080'; const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ck = (ok, m, x) => { console.log(ok ? 'OK  ' : 'FAIL', m, x === undefined ? '' : JSON.stringify(x)); if (!ok) fails++; };
const ev = async js => { const t = await (await fetch(URL + '/admin/eval?sala=SALA1&js=' + encodeURIComponent(js))).text(); try { return JSON.parse(t); } catch (e) { return t; } };
const waitIn = async (p, t = 90) => { for (let i = 0; i < t * 2; i++) { await sleep(500); if (await p.evaluate(() => NET.st === 'playing' && STATE === 'play').catch(() => false)) return true; } return false; };
async function join(ctx, nick) { const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.on('dialog', d => d.accept()); await p.goto(URL + '/juego/'); await p.waitForFunction(() => typeof netJoinWs === 'function');
  await p.evaluate(n => { localStorage.setItem('ur_nick', n); window.urAsk = async () => true; }, nick); await p.evaluate(() => $('bMulti').click()); await p.waitForFunction(() => S137.ok && document.querySelector('[data-room="SALA1"]'), null, { timeout: 30000 });
  await p.evaluate(() => document.querySelector('[data-room="SALA1"]').click()); if (!await waitIn(p)) throw new Error('no entra'); await p.evaluate(() => { P.ghost = 1e9; }); return p; }
const d2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 915, height: 412 } });
  let p = await join(ctx, 'Zorro'); const uid = await p.evaluate(() => JSON.parse(localStorage.getItem('ur_id')).uid);
  const sv = async () => ev("(()=>{const q=NET.peers.find(x=>x.uid==='" + uid + "');return q?SRV.vpos(q):null})()");
  ck((await ev('SRV.MOV.on')) === true, 'la sala PvP tiene la validación de movimiento encendida');
  await ev("(window.__noZ||(window.__noZ=setInterval(()=>{Z.length=0;},400)),1)");   /* sin zombis: que una muerte (que en PvP borra el personaje) no estropee las comprobaciones de posición */
  await p.evaluate(() => guestCharSave()); await sleep(1500);
  // 1) caminar de verdad: el servidor sigue al jugador
  await p.evaluate(async () => { joy.active = true; joy.x = .8; joy.y = .6; await new Promise(r => setTimeout(r, 6000)); joy.active = false; joy.x = joy.y = 0; });
  await sleep(1500); let cp = await p.evaluate(() => [P.x, P.y]), sp = await sv();
  ck(sp && d2(cp, sp) < 1.5, 'caminando: la posición validada sigue al jugador', { cliente: cp.map(v => +v.toFixed(1)), servidor: sp });
  // 2) rodar varias veces (v17.4) y correr: sigue siendo válido
  await p.evaluate(async () => { for (let i = 0; i < 5; i++) { P.rollCd = 0; P.end = 100; joy.active = true; joy.x = -.7; joy.y = .7; readKeys(); urRoll(); await new Promise(r => setTimeout(r, 700)); } keys.ShiftLeft = true; await new Promise(r => setTimeout(r, 2500)); keys.ShiftLeft = false; joy.active = false; joy.x = joy.y = 0; });
  await sleep(1500); cp = await p.evaluate(() => [P.x, P.y]); sp = await sv();
  ck(sp && d2(cp, sp) < 1.5, 'rodando y corriendo: la posición validada sigue al jugador', { cliente: cp.map(v => +v.toFixed(1)), servidor: sp });
  // 3) conducir: un auto junto al jugador, subir, conducir 4 s, bajar
  const carOk = await ev("(()=>{const q=NET.peers.find(x=>x.uid==='" + uid + "');const c=cars.find(k=>!k.dead&&k.hp>30);if(!q||!c)return false;c.x=q.rp.x+1.2;c.y=q.rp.y;c.a=Math.PI;c.fuel=50;c.spd=0;return true})()");
  if (carOk) {
    await sleep(1500);
    const inCar = await p.evaluate(async () => { for (let i = 0; i < 6 && !P.drive; i++) { const t = findInteract(); if (t && (t.type === 'car' || t.type === 'trunk')) { if (t.type === 'car') doInteract(); } else { const c = cars.find(k => Math.hypot(k.x - P.x, k.y - P.y) < 3); if (c) { P.dir = Math.atan2(c.y - P.y, c.x - P.x); } } await new Promise(r => setTimeout(r, 400)); } return !!P.drive; });
    if (inCar) {
      await p.evaluate(async () => { keys.KeyD = true; await new Promise(r => setTimeout(r, 4000)); keys.KeyD = false; await new Promise(r => setTimeout(r, 1500)); doInteract(); await new Promise(r => setTimeout(r, 800)); });
      await sleep(1500); cp = await p.evaluate(() => [P.x, P.y, !!P.drive]); sp = await sv();
      ck(sp && !cp[2] && d2(cp, sp) < 2, 'conduciendo y bajando: la posición validada sigue al jugador', { cliente: cp.slice(0, 2).map(v => +v.toFixed(1)), servidor: sp });
    } else ck(true, '(no pudo subir al auto en esta pasada: se omite)');
  } else ck(true, '(sin auto disponible: se omite)');
  // 4) corte de conexión SIN despedida tras moverse: vuelve donde estaba
  await p.evaluate(async () => { joy.active = true; joy.x = .6; joy.y = -.8; await new Promise(r => setTimeout(r, 4000)); joy.active = false; joy.x = joy.y = 0; });
  await sleep(2500); const before = await p.evaluate(() => [P.x, P.y]);
  await p.evaluate(() => NET.ch.ws.close());
  ck(await waitIn(p, 60), 'tras el corte se reconecta solo');
  await sleep(1000); const after = await p.evaluate(() => [P.x, P.y]);
  ck(d2(before, after) < 2.5, 'PvP: tras un corte vuelve donde estaba', { antes: before.map(v => +v.toFixed(1)), despues: after.map(v => +v.toFixed(1)) });
  // 5) trampa: teletransporte de 40 casillas y salir (el teléfono manda esa posición al cerrar)
  await sleep(2000); const valid = await p.evaluate(() => [P.x, P.y]);
  const tgt = await p.evaluate(() => { for (let r = 40; r < 60; r++) for (let k = 0; k < 16; k++) { const x = Math.floor(P.x + Math.cos(k * .39) * r), y = Math.floor(P.y + Math.sin(k * .39) * r); if (inb(x, y) && !solidTile(x, y) && tg[idx(x, y)] !== G_WATER) return [x + .5, y + .5]; } return null; });
  await p.evaluate(t => { P.x = t[0]; P.y = t[1]; guestCharSave(); }, tgt); await sleep(800); await p.close(); await sleep(4000);
  p = await join(ctx, 'Zorro'); await sleep(1500); const back = await p.evaluate(() => [P.x, P.y]);
  ck(d2(back, valid) < 3 && d2(back, tgt) > 20, 'trampa: el teletransporte NO se conserva al salir y volver', { valida: valid.map(v => +v.toFixed(1)), trampa: tgt, aparece: back.map(v => +v.toFixed(1)) });
  // 6) trampa con paciencia: se teletransporta, espera 10 s (su guardado SÍ llega a escribirse) y sale
  await sleep(2000); const valid2 = await p.evaluate(() => [P.x, P.y]);
  const tgt2 = await p.evaluate(() => { for (let r = 40; r < 60; r++) for (let k = 0; k < 16; k++) { const x = Math.floor(P.x + Math.cos(k * .39 + 1.5) * r), y = Math.floor(P.y + Math.sin(k * .39 + 1.5) * r); if (inb(x, y) && !solidTile(x, y) && tg[idx(x, y)] !== G_WATER) return [x + .5, y + .5]; } return null; });
  await p.evaluate(t => { P.x = t[0]; P.y = t[1]; }, tgt2); await sleep(10000); await p.evaluate(t => { P.x = t[0]; P.y = t[1]; guestCharSave(); }, tgt2); await sleep(1500); await p.close(); await sleep(4000);
  p = await join(ctx, 'Zorro'); await sleep(1500); const back2 = await p.evaluate(() => [P.x, P.y]);
  ck(d2(back2, tgt2) > 20, 'trampa con paciencia (10 s): el teletransporte tampoco se conserva', { valida: valid2.map(v => +v.toFixed(1)), trampa: tgt2, aparece: back2.map(v => +v.toFixed(1)) });
  ck(!p.errs.length, 'sin errores de página', p.errs.slice(0, 3));
  try { const lg = fs.readFileSync('/tmp/srvtest/x.log', 'utf8'); const m = lg.split('\n').filter(l => /Zorro|jugador 2/.test(l) && /muri|muert|mató/i.test(l)); if (m.length) console.log('   (el servidor registró muertes:', m.slice(-2).join(' | ').slice(0, 300), ')'); } catch (e) { }
  console.log('fallos:', fails); await b.close();
})().catch(e => { console.log('FAIL excepción', e.message); process.exit(1); });
