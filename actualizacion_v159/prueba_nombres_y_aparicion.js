// v15.9: nombres de jugador y punto de aparición (sala PvP con autoridad)
const { chromium } = require('playwright'); const fs = require('fs'); const URL = 'http://127.0.0.1:18080'; const DATA = '/tmp/srvtest/datos159'; const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ck = (ok, m, x) => { console.log(ok ? 'OK  ' : 'FAIL', m, x === undefined ? '' : JSON.stringify(x)); if (!ok) fails++; };
const ev = async js => { const t = await (await fetch(URL + '/admin/eval?sala=SALA1&js=' + encodeURIComponent(js))).text(); try { return JSON.parse(t); } catch (e) { return t; } };
const waitIn = async (p, t = 90) => { for (let i = 0; i < t * 2; i++) { await sleep(500); if (await p.evaluate(() => NET.st === 'playing' && STATE === 'play').catch(() => false)) return true; } return false; };
async function join(ctx, nick) { const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.on('dialog', d => d.accept()); await p.goto(URL + '/juego/'); await p.waitForFunction(() => typeof netJoinWs === 'function'); await p.evaluate(n => { localStorage.setItem('ur_nick', n); window.__says = []; const o = say; say = function (m) { window.__says.push(String(m)); return o.apply(this, arguments); }; }, nick); await p.evaluate(() => $('bMulti').click()); await p.waitForFunction(() => S137.ok && document.querySelector('[data-room="SALA1"]'), null, { timeout: 30000 }); await p.evaluate(() => document.querySelector('[data-room="SALA1"]').click()); if (!await waitIn(p)) throw new Error('no entra'); await p.evaluate(() => { P.ghost = 1e9; }); return p; }
const uidOf = p => p.evaluate(() => JSON.parse(localStorage.getItem('ur_id')).uid);
const sayHas = (p, re) => p.evaluate(s => window.__says.some(m => new RegExp(s).test(m)), re.source);
const pe = (u, js) => ev("(()=>{const p=NET.peers.find(q=>q.ready&&q.uid==='" + u + "');if(!p)return 'sin peer';return (" + js + ")})()");
const pos = p => p.evaluate(() => [P.x, P.y]);
const leave = async p => { await p.close(); await sleep(2500); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] }); const mk = () => b.newContext({ viewport: { width: 800, height: 380 } });
  const CA = await mk(), CB = await mk(), CC = await mk();
  let A = await join(CA, 'Lobo'); await sleep(2000); const uA = await uidOf(A);
  await ev('(SRV.MOV.on=false,SRV.AUD.on=false,1)');
  const sp0 = await pos(A);
  // ===== nombres =====
  ck(await pe(uA, "p.rp.name") === 'Lobo', 'N1: el servidor usa el nombre elegido («Lobo»)', await pe(uA, "p.rp.name"));
  const B = await join(CB, 'l0bo'); await sleep(6500); const uB = await uidOf(B);
  const nB = await pe(uB, "p.rp.name"); ck(/^Jugador \d+$/.test(nB) && await sayHas(B, /ya lo usa otro jugador/), 'N2: «l0bo» se parece a «Lobo» y ya es de otro → entra como Jugador N y se le avisa', nB);
  await A.evaluate(s => { P.x = s[0]; P.y = s[1]; }, sp0); await B.evaluate(s => { P.x = s[0] + 2; P.y = s[1]; }, sp0); await sleep(2500);
  ck(await B.evaluate(() => [...NET.oth.values()].some(r => r.name === 'Lobo')), 'N3: los demás lo ven como «Lobo»');
  const C = await join(CC, 'Pendejo1'); await sleep(6500); const uC = await uidOf(C);
  ck(/^Jugador \d+$/.test(await pe(uC, "p.rp.name")) && await sayHas(C, /no está permitido/), 'N4: un insulto no se acepta');
  const L = await (await fetch(URL + '/admin/api/sala?' + new URLSearchParams({ id: 'SALA1', accion: 'jugadores' }))).json();
  ck(L.jugadores && L.jugadores.some(j => j.nombre === 'Lobo'), 'N5: el panel del servidor muestra «Lobo»', L.jugadores && L.jugadores.map(j => j.nombre));
  ck(JSON.parse(fs.readFileSync(DATA + '/nombres.json', 'utf8'))[uA].n === 'Lobo', 'N6: queda reservado en nombres.json');
  await leave(C);
  // ===== aparición: donde lo dejó =====
  const X = await ev("(()=>{const s=SRV.spawn;for(let r=25;r<120;r+=3)for(let a=0;a<6.28;a+=.4){const x=Math.floor(s[0]+Math.cos(a)*r),y=Math.floor(s[1]+Math.sin(a)*r);if(inb(x,y)&&!solidTile(x,y)&&tg[idx(x,y)]!==G_WATER&&!to[idx(x,y)])return [x+.5,y+.5]}return null})()");
  await A.evaluate(s => { P.x = s[0]; P.y = s[1]; snapCam && snapCam(); }, X); await sleep(1500); await leave(A);
  A = await join(CA, 'Lobo'); await sleep(1500); const a1 = await pos(A);
  ck(Math.hypot(a1[0] - X[0], a1[1] - X[1]) < 2, 'R1: al volver aparece donde lo dejó (antes: punto de inicio)', { dejo: X, aparece: a1, inicio: sp0 });
  await sleep(5500); ck(await sayHas(A, /donde lo dejaste/), 'R1: y se le dice');
  ck(await pe(uA, "p.rp.name") === 'Lobo', 'N7: al volver conserva su nombre');
  // ===== cama =====
  const bed = await ev("(()=>{const q=" + JSON.stringify(X) + ";let best=null,bd=1e9;for(let y=Math.max(0,Math.floor(q[1])-150);y<Math.min(H,q[1]+150);y++)for(let x=Math.max(0,Math.floor(q[0])-150);x<Math.min(W,q[0]+150);x++){if(to[idx(x,y)]!==O_BED)continue;const f=SRV.bedFree(x,y);if(!f)continue;const d=Math.hypot(x-q[0],y-q[1]);if(d<bd){bd=d;best=[x,y,f[0],f[1]]}}return best})()");
  if (!bed) ck(false, 'R2: hay una cama en el mapa'); else {
    await A.evaluate(s => { P.x = s[2]; P.y = s[3]; P.fat = 60; snapCam && snapCam(); }, bed); await sleep(1200); await A.evaluate(() => startSleep()); await sleep(2500);
    ck(JSON.stringify(await pe(uA, "p.bed")) === JSON.stringify([bed[0], bed[1]]) && await sayHas(A, /punto de aparición/), 'R2: dormir junto a una cama la marca como punto de aparición', await pe(uA, "p.bed"));
    await A.evaluate(() => { P.sleep = false; SIM = 1; }); await A.evaluate(s => { P.x = s[0]; P.y = s[1]; }, X); await sleep(1500); await leave(A);
    A = await join(CA, 'Lobo'); await sleep(1500); const a2 = await pos(A);
    ck(Math.hypot(a2[0] - (bed[0] + .5), a2[1] - (bed[1] + .5)) < 2.5, 'R3: al volver aparece junto a su cama (aunque saliera lejos)', { cama: bed.slice(0, 2), aparece: a2 });
    await sleep(5500); ck(await sayHas(A, /en tu cama/), 'R3: y se le dice');
  }
  // ===== muerte =====
  await ev("(NET.peers.forEach(p=>{p.protUntil=0}),1)"); await pe(uA, "(SRV.pvpHurt(p,999,'prueba',null),1)"); await sleep(4000);
  const tomb = JSON.parse(fs.readFileSync(DATA + '/salas/SALA1/personajes/' + uA + '.json', 'utf8')); ck(/muerto/.test(tomb.c), 'R4: al morir el personaje se borra (queda solo la marca de muerte)');
  try { await A.close(); } catch (e) { } await sleep(2500);
  A = await join(CA, ''); await sleep(1500); const a3 = await pos(A);
  ck(bed ? Math.hypot(a3[0] - bed[0], a3[1] - bed[1]) > 6 : true, 'R5: tras morir NO aparece en su cama', { aparece: a3 });
  await sleep(5500); ck(await sayHas(A, /lugar al azar/), 'R5: aparece en un lugar al azar y se le dice');
  ck(await A.evaluate(() => P.inv.length <= 3), 'R5: con mochila nueva', await A.evaluate(() => P.inv.map(i => i.id)));
  ck(await pe(uA, "p.rp.name") === 'Lobo', 'N8: con el campo vacío (o una app antigua) sigue siendo «Lobo»');
  // ===== moderación =====
  const sl = await pe(uA, "p.slot"); const r = await (await fetch(URL + '/admin/api/sala?' + new URLSearchParams({ id: 'SALA1', accion: 'quitarnombre', slot: sl }))).json(); await sleep(2500);
  ck(r.ok && !JSON.parse(fs.readFileSync(DATA + '/nombres.json', 'utf8'))[uA], 'M1: «Quitar nombre» en el panel lo libera', r);
  ck(await A.evaluate(() => NET.st !== 'playing').catch(() => true), 'M1: y saca al jugador de la sala con el aviso');
  for (const p of [A, B]) ck(!p.isClosed() ? p.errs.length === 0 : true, 'sin errores de página', p.errs && p.errs.slice(0, 3));
  console.log('fallos:', fails); await b.close(); process.exit(0);
})().catch(e => { console.log('FALLO', e.stack || e.message); process.exit(1); });
