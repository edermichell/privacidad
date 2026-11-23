// v17.7: reconexión automática a la misma sala del servidor tras un corte
const { spawn, execSync } = require('child_process'); const K = '/home/user/privacidad/servidor_tailscale';
let SRVP = null; const srvUp = async () => { SRVP = spawn('node', ['servidor.js'], { cwd: K, env: Object.assign({}, process.env, { CONFIG: '/tmp/srvtest/configA.json', URSRV_DEBUG: '1' }), stdio: 'ignore', detached: true }); for (let i = 0; i < 40; i++) { await new Promise(r => setTimeout(r, 500)); try { await fetch('http://127.0.0.1:18080/'); return; } catch (e) { } } };
const srvDown = () => { try { process.kill(-SRVP.pid, 'SIGKILL'); } catch (e) { } try { execSync('pkill -9 -f "node servidor.js"'); } catch (e) { } };
const { chromium } = require('playwright'); const URL = 'http://127.0.0.1:18080'; const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ck = (ok, m, x) => { console.log(ok ? 'OK  ' : 'FAIL', m, x === undefined ? '' : JSON.stringify(x)); if (!ok) fails++; };
const waitIn = async (p, t = 90) => { for (let i = 0; i < t * 2; i++) { await sleep(500); if (await p.evaluate(() => NET.st === 'playing' && STATE === 'play').catch(() => false)) return true; } return false; };
async function join(ctx, nick) { const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.on('dialog', d => d.accept()); await p.goto(URL + '/juego/'); await p.waitForFunction(() => typeof netJoinWs === 'function');
  await p.evaluate(n => { localStorage.setItem('ur_nick', n); window.__says = []; const o = say; say = function (m) { window.__says.push(String(m)); return o.apply(this, arguments); }; }, nick);
  await p.evaluate(() => $('bMulti').click()); await p.waitForFunction(() => S137.ok && document.querySelector('[data-room="SALA1"]'), null, { timeout: 30000 }); await p.evaluate(() => document.querySelector('[data-room="SALA1"]').click());
  if (!await waitIn(p)) throw new Error('no entra'); await p.evaluate(() => { P.ghost = 1e9; }); return p; }
(async () => {
  await srvUp();
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 915, height: 412 } });
  const p = await join(ctx, 'Lobo'); ck(true, 'entra en SALA1');
  // se coloca en un sitio y espera a que el servidor lo sepa
  await p.evaluate(() => guestCharSave()); await sleep(1500);   /* como al recoger algo: el servidor guarda el personaje (con la posición de ese momento) */
  const spot = await p.evaluate(() => { let c = null; for (let r = 5; r < 14 && !c; r++) for (let k = 0; k < 16 && !c; k++) { const x = Math.floor(P.x + Math.cos(k * .39) * r), y = Math.floor(P.y + Math.sin(k * .39) * r); if (inb(x, y) && !solidTile(x, y) && tg[idx(x, y)] !== G_WATER) c = [x + .5, y + .5]; } P.x = c[0]; P.y = c[1]; snapCam(); return c; });   /* casilla libre (el servidor no te deja dentro de una pared) */ await sleep(4000);
  // 1) corte limpio de la conexión en plena partida -> reconecta solo, sin pasar por el menú
  const cdp = await ctx.newCDPSession(p);
  await p.evaluate(() => { window.__states = []; window.__stT = setInterval(() => { __states.push(STATE); }, 200); NET.ch.ws.close(); });
  await sleep(700); let st = await p.evaluate(() => ({ rc: RC177.on, ui: !!document.getElementById('rc177') && !document.getElementById('rc177').hidden, txt: (document.getElementById('rc177t') || {}).textContent }));
  ck(st.rc && st.ui && /reconectando \(1\/7\)/.test(st.txt), 'al cortarse muestra «reconectando (1/7)…» en vez de ir al menú', st);
  const back = await waitIn(p, 40);
  const af = await p.evaluate(() => ({ menu: __states.includes('menu'), pos: [P.x, P.y], rc: RC177.on, ui: !document.getElementById('rc177').hidden, says: __says.slice(-3) }));
  ck(back && !af.menu && !af.rc && !af.ui, 'vuelve a jugar en la misma sala sin pasar por el menú', { back, menu: af.menu });
  ck(Math.hypot(af.pos[0] - spot[0], af.pos[1] - spot[1]) < 2.5, 'reaparece donde estaba', { antes: spot, despues: af.pos.map(v => +v.toFixed(1)) });
  ck(af.says.some(s => /Reconectado/.test(s)), 'avisa «Reconectado»', af.says);
  // 2) el servidor se cae un rato: los primeros intentos fallan y, cuando vuelve, entra solo
  await sleep(3000); srvDown();
  await sleep(6500); st = await p.evaluate(() => ({ rc: RC177.on, n: RC177.n, txt: document.getElementById('rc177t').textContent, state: STATE }));
  ck(st.rc && st.n >= 2 && st.state === 'play', 'servidor caído: sigue reintentando (varios intentos), sin salir al menú', st);
  await srvUp();
  const okBack = await waitIn(p, 60); ck(okBack, 'al volver el servidor, entra solo en la sala', okBack ? undefined : await p.evaluate(() => ({ rc: RC177.on, n: RC177.n, st: NET.st, state: STATE, says: __says.slice(-3) })));
  // 3) botón «Salir al menú» durante la reconexión
  await sleep(3000); srvDown(); await sleep(1500);
  await p.evaluate(() => document.getElementById('rc177b').click()); await sleep(1500);
  st = await p.evaluate(() => ({ state: STATE, rc: RC177.on, ui: !document.getElementById('rc177').hidden, net: NET.st }));
  ck(st.state === 'menu' && !st.rc && !st.ui, '«Salir al menú» cancela la reconexión y va al menú', st);
  await srvUp(); await sleep(6000); st = await p.evaluate(() => ({ state: STATE, net: NET.st })); ck(st.state === 'menu' && st.net === 'off', 'y no vuelve a intentar entrar después', st);
  // 4) cinco intentos con el servidor caído -> al menú como antes
  await p.evaluate(() => document.querySelector('[data-room="SALA1"]') ? 0 : $('bMulti').click()); await p.waitForFunction(() => S137.ok && document.querySelector('[data-room="SALA1"]'), null, { timeout: 30000 }).catch(() => {});
  await p.evaluate(() => document.querySelector('[data-room="SALA1"]').click()); ck(await waitIn(p, 60), 'vuelve a entrar a mano');
  await sleep(2000); srvDown(); await sleep(72000);
  st = await p.evaluate(() => ({ state: STATE, rc: RC177.on, says: __says.slice(-2) }));
  ck(st.state === 'menu' && !st.rc && st.says.some(s => /No se pudo reconectar/.test(s)), 'tras 7 intentos sin servidor (~1 min): «No se pudo reconectar» y al menú', st);
  ck(!p.errs.length, 'sin errores de página', p.errs.slice(0, 3));
  console.log('fallos:', fails); await b.close(); srvDown();
})().catch(e => { console.log('FAIL excepción', e.message); process.exit(1); });
