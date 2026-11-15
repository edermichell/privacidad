// Fase 6 (v15.8) en sala PvP: libro de inventario y validación de movimiento. A = tramposo; B y C = juego legítimo (no debe recortarse nada)
const { chromium } = require('playwright'); const URL = 'http://127.0.0.1:18080'; const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ck = (ok, m, x) => { console.log(ok ? 'OK  ' : 'FAIL', m, x === undefined ? '' : JSON.stringify(x)); if (!ok) fails++; };
const ev = async js => { const t = await (await fetch(URL + '/admin/eval?sala=SALA1&js=' + encodeURIComponent(js))).text(); try { return JSON.parse(t); } catch (e) { return t; } };
const waitIn = async (p, t = 90) => { for (let i = 0; i < t * 2; i++) { await sleep(500); if (await p.evaluate(() => NET.st === 'playing' && STATE === 'play').catch(() => false)) return true; } return false; };
async function join(ctx) { const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.on('dialog', d => d.accept()); await p.goto(URL + '/juego/'); await p.waitForFunction(() => typeof netJoinWs === 'function'); await p.evaluate(() => { window.__says = []; const o = say; say = function (m) { window.__says.push(String(m)); return o.apply(this, arguments); }; }); await p.evaluate(() => $('bMulti').click()); await p.waitForFunction(() => S137.ok && document.querySelector('[data-room="SALA1"]'), null, { timeout: 30000 }); await p.evaluate(() => document.querySelector('[data-room="SALA1"]').click()); if (!await waitIn(p)) throw new Error('no entra'); await p.evaluate(() => { P.ghost = 1e9; }); return p; }
const uidOf = p => p.evaluate(() => JSON.parse(localStorage.getItem('ur_id')).uid);
const sayHas = (p, re) => p.evaluate(s => window.__says.some(m => new RegExp(s).test(m)), re.source);
const pe = (u, js) => ev("(()=>{const p=NET.peers.find(q=>q.ready&&q.uid==='" + u + "');if(!p)return 'sin peer';return (" + js + ")})()");
const stored = (u, id) => pe(u, "p.chBlob?p.chBlob.P.inv.filter(i=>i.id==='" + id + "').reduce((s,i)=>s+(ITEMS[i.id].stack?i.n:1),0):-1");
const storedAmmo = (u, am) => pe(u, "p.chBlob?SRV.invCount(p.chBlob.P.inv)['" + am + "']||0:-1");
const save = async p => { await p.evaluate(() => guestCharSave()); await sleep(3400); };
const tp = async (p, x, y) => { await ev('(SRV.MOV.on=false,1)'); await p.evaluate(s => { P.x = s[0]; P.y = s[1]; snapCam && snapCam(); }, [x, y]); await sleep(900); await ev('(NET.peers.forEach(q=>{q.mv=null}),SRV.MOV.on=true,1)'); await sleep(400); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] }); const mk = () => b.newContext({ viewport: { width: 800, height: 380 } });
  const G = {}, U = {}; for (const k of ['A', 'B', 'C']) { G[k] = await join(await mk()); await sleep(2500); U[k] = await uidOf(G[k]); }
  for (let i = 0; i < 30; i++) { if (await ev("NET.peers.filter(p=>p.ready&&p.chAu).length") >= 3) break; await sleep(500); }
  ck(await ev("SRV.AUD.on&&SRV.MOV.on") === true, 'sala PvP con auditoría de inventario y validación de movimiento activas');
  const sp = await G.A.evaluate(() => [P.x, P.y]); await tp(G.B, sp[0] + 3, sp[1]); await tp(G.C, sp[0] + 4, sp[1] + 1);
  await ev("(NET.peers.forEach(p=>{p.protUntil=0}),1)");
  for (const k of ['B', 'C']) await pe(U[k], "(SRV.audInit(p).slack=0,1)");   /* los legítimos sin tolerancia: todo debe tener origen */
  // =========== TRAMPOSO ===========
  await G.A.evaluate(() => { const g = mkItem('pistol'); g.a = 12; P.inv.push(g); addItem(mkItem('ammo9', 50)); }); await save(G.A); await sleep(800);
  ck(await stored(U.A, 'pistol') === 0 && await storedAmmo(U.A, 'ammo9') === 0, 'A1: pistola y 62 balas inventadas NO se guardan en el servidor', [await stored(U.A, 'pistol'), await storedAmmo(U.A, 'ammo9')]);
  ck(await pe(U.A, "p.chInv.has('pistol')") === false, 'A1: el servidor no la cuenta como arma que lleva (no puede disparar a jugadores)');
  ck(await G.A.evaluate(() => !P.inv.some(i => i.id === 'pistol') && !P.inv.some(i => i.id === 'ammo9')), 'A1: el teléfono del tramposo también la pierde');
  ck(await sayHas(G.A, /no reconoce de dónde salieron/), 'A1: se le avisa');
  ck(await pe(U.A, "p.rej|0") >= 1, 'A1: suma aviso de actividad sospechosa', await pe(U.A, "p.rej|0"));
  // mueble con contenido imposible
  const ci = await pe(U.A, "(()=>{const q=SRV.vpos(p);for(const [i,c] of containers){if(i>=TRUNK_BASE||c.items||c.k!==O_FRIDGE)continue;const x=i%W+.5,y=((i/W)|0)+.5;if(Math.hypot(x-q[0],y-q[1])<40)return [i,x,y]}return null})()");
  if (!ci) console.log('SKIP no hay nevera cerca'); else {
    await tp(G.A, ci[1], ci[2] + 1); const r0 = await pe(U.A, "p.rej|0");
    await G.A.evaluate(i => netSend({ t: 'C', i, items: [{ id: 'rifle', n: 1, a: 5 }, { id: 'ammo9', n: 40 }] }), ci[0]); await sleep(1200);
    ck(await ev("(containers.get(" + ci[0] + ")||{}).items===null||!(containers.get(" + ci[0] + ")||{}).items") === true && await pe(U.A, "p.rej|0") > r0, 'A2: una nevera «registrada» con un rifle y 40 balas se rechaza');
  }
  // suelo falso
  const ap = await pe(U.A, "SRV.vpos(p)");
  await G.A.evaluate(q => netSend({ t: 'L', n: 'f', add: [['falso#1', { x: q[0] + .2, y: q[1], it: { id: 'pistol', n: 1, a: 12 }, t0: 0 }]], del: [] }), ap); await sleep(800);
  ck(await ev("floorItems.some(f=>f.it.id==='pistol'&&SRV.FAKE.has(f))") === true, 'A3: una pistola «tirada» al suelo que no tenía queda marcada sin respaldo');
  await G.A.evaluate(() => netSend({ t: 'L', n: 'f', add: [], del: ['falso#1'] })); await sleep(600);
  await G.A.evaluate(() => { const g = mkItem('pistol'); g.a = 12; P.inv.push(g); }); await save(G.A); await sleep(600);
  ck(await stored(U.A, 'pistol') === 0, 'A3: recogerla no le da origen: sigue sin guardarse');
  // cadáveres con demasiada suerte
  const nOk = await pe(U.A, "(()=>{const q=SRV.vpos(p);let n0=(p.cr||[]).filter(c=>c.id==='pistol').length;for(let k=0;k<10;k++){const z=mkZombie(q[0]+.5,q[1],'walker');z.job='police';z.st='dead';z.hp=0;Z.push(z);SRV.corpseLoot(p,{id:z.id,it:[['pistol',1,3]]})}return (p.cr||[]).filter(c=>c.id==='pistol').length-n0})()");
  ck(nOk >= 1 && nOk <= 2, 'A4: 10 cadáveres de policía «con pistola» (5 % cada uno): el servidor solo acepta 1–2', nOk);
  const nBad = await pe(U.A, "(()=>{const q=SRV.vpos(p),r0=p.rej|0;const z=mkZombie(q[0]+.5,q[1],'walker');z.job='cook';z.st='dead';z.hp=0;Z.push(z);SRV.corpseLoot(p,{id:z.id,it:[['smg',1,0]]});return (p.rej|0)-r0})()");
  ck(nBad >= 1, 'A4: un cocinero no lleva subfusil → rechazado');
  // velocidad imposible
  const a0 = await G.A.evaluate(() => [P.x, P.y]); await G.A.evaluate(() => { P.x += 35; }); await sleep(2500);
  const a1 = await G.A.evaluate(() => [P.x, P.y]);
  ck(Math.hypot(a1[0] - a0[0], a1[1] - a0[1]) < 3 && await sayHas(G.A, /devolvió a tu posición/), 'A5: un salto de 35 casillas devuelve al jugador a su sitio', { antes: a0, despues: a1 });
  const mvA = await pe(U.A, "[p.mv.x,p.mv.y]"); ck(Math.hypot(mvA[0] - a0[0], mvA[1] - a0[1]) < 3, 'A5: el servidor se queda con la última posición válida (la usa para los golpes)');
  // =========== LEGÍTIMO ===========
  const bp = await G.B.evaluate(() => [P.x, P.y]); const rB0 = await pe(U.B, "p.rej|0");
  // suelo
  await ev("(floorItems.push({x:" + (bp[0] + .3) + ",y:" + bp[1] + ",it:Object.assign(mkItem('pistol'),{a:5}),t0:TIME}),1)"); await sleep(1800);
  const gotF = await G.B.evaluate(() => { const k = floorItems.findIndex(f => f.it.id === 'pistol' && Math.hypot(f.x - P.x, f.y - P.y) < 2); if (k < 0) return false; const f = floorItems[k]; addItem(f.it); floorItems.splice(k, 1); return true; });
  await sleep(1500); await save(G.B);
  ck(gotF && await stored(U.B, 'pistol') === 1 && await storedAmmo(U.B, 'ammo9') === 5, 'B1: pistola recogida del suelo (con 5 balas) se guarda', [gotF, await stored(U.B, 'pistol'), await storedAmmo(U.B, 'ammo9')]);
  // mueble lleno por el servidor
  const bc = await pe(U.B, "(()=>{const q=SRV.vpos(p);let best=null,bd=9;for(const [i,c] of containers){if(i>=TRUNK_BASE||c.items)continue;const x=i%W+.5,y=((i/W)|0)+.5,d=Math.hypot(x-q[0],y-q[1]);if(d<bd){bd=d;best=[i,x,y]}}return best})()");
  if (!bc) console.log('SKIP sin mueble'); else {
    await tp(G.B, bc[1], bc[2] + 1); await ev("(()=>{const c=containers.get(" + bc[0] + ");c.items=[mkItem('vest'),mkItem('shells',6)];netSend({t:'C',i:" + bc[0] + ",items:c.items});return 1})()"); await sleep(1500);
    await G.B.evaluate(i => { const c = containers.get(i); while (c && c.items && c.items.length) addItem(c.items.splice(0, 1)[0]); }, bc[0]); await sleep(1600); await save(G.B);
    ck(await stored(U.B, 'vest') === 1 && await stored(U.B, 'shells') === 6, 'B2: chaleco y cartuchos sacados de un mueble se guardan', [await stored(U.B, 'vest'), await stored(U.B, 'shells')]);
  }
  // registrar un mueble nuevo (botín generado en el teléfono) y vaciarlo
  const bc2 = await pe(U.B, "(()=>{const q=SRV.vpos(p);let best=null,bd=30;for(const [i,c] of containers){if(i>=TRUNK_BASE||c.items)continue;const x=i%W+.5,y=((i/W)|0)+.5,d=Math.hypot(x-q[0],y-q[1]);if(d<bd){bd=d;best=[i,x,y]}}return best})()");
  if (bc2) { await tp(G.B, bc2[1], bc2[2] + 1); const r1 = await pe(U.B, "p.rej|0");
    const gen = await G.B.evaluate(i => { const c = containers.get(i); c.items = genLoot(c.k, c.bk); netSend({ t: 'C', i, items: c.items }); NET.csig.set(i, contSig(c)); return c.items.map(x => x.id); }, bc2[0]);
    await sleep(1200); ck(await ev("Array.isArray((containers.get(" + bc2[0] + ")||{}).items)") === true && await pe(U.B, "p.rej|0") === r1, 'B3: el botín normal de un mueble se acepta', gen);
    await G.B.evaluate(i => { const c = containers.get(i); while (c.items.length) addItem(c.items.splice(0, 1)[0]); }, bc2[0]); await sleep(1600); await save(G.B);
    const kept = await pe(U.B, "p.rej|0") === r1; ck(kept, 'B3: vaciarlo no da avisos');
  }
  // comerciante
  const tr = await ev("(()=>{const n=NPCS.find(q=>q.st!=='dead'&&NT[q.type]&&NT[q.type].shop);if(!n)return null;n.stock=[['revolver',1],['ammo38',20]];return [n.id,n.x,n.y]})()");
  if (!tr) console.log('SKIP no hay comerciantes'); else {
    await tp(G.B, tr[1] + 1.2, tr[2]); await G.B.evaluate(() => { const pr = Math.max(1, Math.round(npcVal('revolver') * 1.35 * 1.3)); addItem(mkItem('caps', Math.min(400, pr + 20))); }); await G.B.evaluate(id => { NET.dlgWait = id; netSend({ t: 'NO', id }); }, tr[0]); await sleep(1800);
    const bought = await G.B.evaluate(() => { if (!DLG) return 'sin diálogo'; DLG.mode = 'trade'; const st = DLG.n.stock; const k = st.findIndex(s => s[0] === 'revolver'); if (k < 0) return 'sin revólver ' + JSON.stringify(st); const bt = document.createElement('button'); bt.dataset.n = 'buy'; bt.dataset.k = k; document.body.appendChild(bt); bt.click(); bt.remove(); return P.inv.some(i => i.id === 'revolver'); });
    await sleep(1500); try { await G.B.evaluate(() => npcCloseDlg()); } catch (e) { } await save(G.B);
    ck(bought === true && await stored(U.B, 'revolver') === 1, 'B4: revólver comprado al comerciante se guarda', bought);
  }
  // cadáver de policía (botín del uniforme)
  const bq = await G.B.evaluate(() => [P.x, P.y]);
  const zid = await ev("(()=>{const z=mkZombie(" + (bq[0] + .9) + "," + bq[1] + ",'walker');z.job='police';z.shirt=S88_JOB.police.sh;z.pants=S88_JOB.police.pa;Z.push(z);z.hp=1;damageZombie(z,999,{});return [z.id,z.st]})()");
  await sleep(2000); const zb = await G.B.evaluate(id => { const z = Z.find(q => q.id === id); return z ? [z.st, z.job || null] : null; }, zid[0]);
  console.log('   cadáver en el anfitrión', zid, 'en B', zb);
  if (zb && zb[0] === 'dead') {
    ck(zb[1] === 'police', 'B5: el invitado ve el uniforme del zombi (antes no le llegaba)', zb);
    await G.B.evaluate(() => { for (let i = fires.length - 1; i >= 0; i--) if (Math.hypot(fires[i].x - P.x, fires[i].y - P.y) < 6) fires.splice(i, 1); });
    await G.B.evaluate(id => { const z = Z.find(q => q.id === id); P.x = z.x - .4; P.y = z.y; }, zid[0]);
    const g0 = await G.B.evaluate(() => P.inv.filter(i => i.id === 'pistol').length);
    await G.B.evaluate(() => { window.__mr = Math.random; Math.random = () => .01; doInteract(); }); await sleep(2200); await G.B.evaluate(() => { Math.random = window.__mr; }); await sleep(400);
    const g1 = await G.B.evaluate(() => [P.inv.filter(i => i.id === 'pistol').length, findInteract() && findInteract().type]); await sleep(800); await save(G.B);
    ck(g1[0] === g0 + 1 && await stored(U.B, 'pistol') === 2, 'B5: pistola del uniforme de un policía muerto se guarda', { antes: g0, despues: g1, guardadas: await stored(U.B, 'pistol') });
  } else ck(false, 'B5: el cadáver llega al jugador', zb);
  // fabricar
  await G.B.evaluate(() => { addItem(mkItem('bandage', 2)); addItem(mkItem('alcohol', 1)); addItem(mkItem('pills', 2)); const r = RECIPES.find(q => q.id === 'medkit'); window.__st = r.st; delete r.st; craft('medkit'); r.st = window.__st; });   /* la mesa médica no es lo que se prueba */ await sleep(4200); console.log('   fabricar:', await G.B.evaluate(() => [window.__says.slice(-3), P.inv.filter(i => i.id === 'medkit').length, !!P.act]), await pe(U.B, 'JSON.stringify([p.cr,p.crfH&&p.crfH.length])')); await save(G.B);
  ck(await stored(U.B, 'medkit') >= 1, 'B6: botiquín fabricado se guarda (los ingredientes se gastaron)', await stored(U.B, 'medkit'));
  // recargar
  const am0 = await storedAmmo(U.B, 'ammo9');
  await G.B.evaluate(() => { const g = P.inv.find(i => i.id === 'pistol'); if (!g) return; P.eq = g; const u = Math.min(3, g.a | 0); g.a -= u; if (u) addItem(mkItem('ammo9', u)); }); await G.B.evaluate(() => startReload()); await sleep(2200); await save(G.B);
  ck(await storedAmmo(U.B, 'ammo9') === am0 && await pe(U.B, "p.rej|0") === rB0, 'B7: recargar el arma no cuenta como munición nueva', [am0, await storedAmmo(U.B, 'ammo9')]);
  // pasar un arma a otro jugador por el suelo
  const cB = await stored(U.B, 'pistol'); await tp(G.C, bq[0] + 1, bq[1]);
  await G.B.evaluate(() => dropItem(P.inv.find(i => i.id === 'pistol'))); await sleep(1800); await save(G.B);
  const gotC = await G.C.evaluate(() => { const k = floorItems.findIndex(f => f.it.id === 'pistol' && Math.hypot(f.x - P.x, f.y - P.y) < 4); if (k < 0) return false; addItem(floorItems[k].it); floorItems.splice(k, 1); return true; }); await sleep(1600); await save(G.C);
  ck(gotC && await stored(U.B, 'pistol') === cB - 1 && await stored(U.C, 'pistol') === 1, 'B8: B suelta una pistola y C la recoge: a C se le guarda', [gotC, await stored(U.B, 'pistol'), await stored(U.C, 'pistol')]);
  // caminar y correr de verdad
  await G.B.evaluate(() => new Promise(res => { let t = 0; const step = () => { t += .1; P.x += .55; P.moving = true; P.run = true; if (t < 7) setTimeout(step, 100); else { P.moving = false; P.run = false; res(); } }; step(); })); await sleep(1500);
  ck(!(await sayHas(G.B, /devolvió a tu posición/)) && (await pe(U.B, "p.mvRej|0")) === 0, 'B9: correr 7 s a 5,5 casillas/s no se toma como trampa', await pe(U.B, "p.mvRej|0"));
  // red con cortes: mensajes que llegan juntos
  await G.B.evaluate(() => new Promise(res => { let t = 0; const step = () => { t += .5; P.x += 2.6; if (t < 4) setTimeout(step, 500); else res(); }; step(); })); await sleep(1500);
  ck(!(await sayHas(G.B, /devolvió a tu posición/)), 'B10: posiciones a saltos de medio segundo (red lenta) tampoco');
  ck(await pe(U.B, "p.rej|0") === rB0 && await pe(U.C, "p.rej|0") === 0, 'B: ningún aviso para los jugadores legítimos', [await pe(U.B, "p.rej|0"), await pe(U.C, "p.rej|0")]);
  ck(!(await sayHas(G.B, /no reconoce/)) && !(await sayHas(G.C, /no reconoce/)), 'B: nunca se les quitó nada');
  for (const k of ['A', 'B', 'C']) ck(G[k].errs.length === 0, 'sin errores de página en ' + k, G[k].errs.slice(0, 3));
  console.log('fallos:', fails); await b.close(); process.exit(0);
})().catch(e => { console.log('FALLO', e.stack || e.message); process.exit(1); });
