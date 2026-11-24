// v17.9 · El cuerpo se queda (sala PvP): desconectarse en combate deja un cuerpo dormido atacable 30 s
const { chromium } = require('playwright'); const fs = require('fs'); const URL = 'http://127.0.0.1:18080'; const DATA = '/tmp/srvtest/datos159'; const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ck = (ok, m, x) => { console.log(ok ? 'OK  ' : 'FAIL', m, x === undefined ? '' : JSON.stringify(x)); if (!ok) fails++; };
const ev = async js => { const t = await (await fetch(URL + '/admin/eval?sala=SALA1&js=' + encodeURIComponent(js))).text(); try { return JSON.parse(t); } catch (e) { return t; } };
const waitIn = async (p, t = 90) => { for (let i = 0; i < t * 2; i++) { await sleep(500); if (await p.evaluate(() => NET.st === 'playing' && STATE === 'play').catch(() => false)) return true; } return false; };
async function join(ctx, nick) { const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.on('dialog', d => d.accept()); await p.goto(URL + '/juego/'); await p.waitForFunction(() => typeof netJoinWs === 'function');
  await p.evaluate(n => { localStorage.setItem('ur_nick', n); window.urAsk = async () => true; window.__says = []; const o = say; say = function (m) { window.__says.push(String(m)); return o.apply(this, arguments); }; }, nick);
  await p.evaluate(() => $('bMulti').click()); await p.waitForFunction(() => S137.ok && document.querySelector('[data-room="SALA1"]'), null, { timeout: 30000 }); await p.evaluate(() => document.querySelector('[data-room="SALA1"]').click());
  if (!await waitIn(p)) throw new Error('no entra ' + nick); await p.evaluate(() => { P.ghost = 1e9; guestCharSave(); }); await sleep(1200); return p; }
const uidOf = p => p.evaluate(() => JSON.parse(localStorage.getItem('ur_id')).uid);
const charFile = uid => { let f = null; const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const q = d + '/' + e.name; if (e.isDirectory()) walk(q); else if (e.name === uid + '.json') f = q; } }; walk(DATA); if (!f) return null; const o = JSON.parse(fs.readFileSync(f, 'utf8')); return JSON.parse(o.c); };
const body = uid => ev("(()=>{const L=SRV.lingers.get('" + uid + "');if(!L)return null;const n=L.n;return {x:n.x,y:n.y,hp:n.hp,zz:n.zz,st:n.st,name:n.name,id:n.id}})()");
const inCombat = uid => ev("(()=>{const q=NET.peers.find(x=>x.uid==='" + uid + "');if(!q)return false;q.lastCombat=performance.now();return true})()");
(async () => {
  const b = await chromium.launch(); const cA = await b.newContext({ viewport: { width: 915, height: 412 } }), cV = await b.newContext({ viewport: { width: 915, height: 412 } });
  await ev("(window.__noZ||(window.__noZ=setInterval(()=>{Z.length=0;},400)),1)");
  const A = await join(cA, 'Halcon'); const uA = await uidOf(A);
  let V = await join(cV, 'Lobo'); const uV = await uidOf(V);
  ck((await ev('SRV.LNG && SRV.LNG.on')) === true, 'el cuerpo que se queda está activado en la sala PvP');
  // el atacante junto a la víctima (lo coloca el servidor: ve la víctima a su lado)
  const vpos = await V.evaluate(() => [P.x, P.y]);
  // ===== 1) fuera de combate: salir NO deja cuerpo =====
  await V.close(); await sleep(2500);
  ck((await body(uV)) === null, 'fuera de combate: al salir no queda cuerpo (como antes)');
  V = await join(cV, 'Lobo');
  // ===== 2) en combate: queda el cuerpo dormido, los demás lo ven tumbado =====
  const p0 = await V.evaluate(() => [P.x, P.y]); ck(await inCombat(uV), 'Lobo está en combate');
  await V.close(); await sleep(2000);
  let bd = await body(uV);
  ck(bd && bd.zz === 1 && bd.st !== 'dead' && /\(desconectado\)/.test(bd.name) && Math.hypot(bd.x - p0[0], bd.y - p0[1]) < 1.5, 'en combate: el cuerpo se queda dormido donde estaba', bd);
  const seen = await A.evaluate(async id => { for (let i = 0; i < 20; i++) { const n = NET.nm.get(id); if (n) return { zz: n.zz, pose: npcSpec(n).pose, name: n.name, say: n.say }; await new Promise(r => setTimeout(r, 300)); } return null; }, bd.id);
  ck(!seen || (seen.zz === 1 && seen.pose === 'lie' && /desconectado/.test(seen.name)), 'el otro jugador lo ve tumbado, con «(desconectado)» y «Zzz…» (si está cerca)', seen);
  ck(await A.evaluate(id => { const n = NET.nm.get(id); if (!n) return true; const t = findInteract(); return !(t && t.type === 'npc' && t.n === n); }, bd.id), 'no se puede «hablar» con el cuerpo');
  // ===== 3) lo matan: muerte PvP (suelta la mochila, personaje borrado, cuenta para el atacante) =====
  const pkA0 = await ev("(()=>{const q=NET.peers.find(x=>x.uid==='" + uA + "');return q?(q.pk|0):-1})()"); const items0 = await ev('floorItems.length');
  await ev("(()=>{const q=NET.peers.find(x=>x.uid==='" + uA + "');const L=SRV.lingers.get('" + uV + "');netCtx(q,()=>{damageNpc(L.n,40,{by:'p',src:'m'});});return 1})()");
  bd = await body(uV); ck(bd && Math.round(bd.hp) <= 60 && bd.st !== 'dead', 'un golpe le quita vida al cuerpo', bd && bd.hp);
  await ev("(()=>{const q=NET.peers.find(x=>x.uid==='" + uA + "');const L=SRV.lingers.get('" + uV + "');netCtx(q,()=>{damageNpc(L.n,200,{by:'p',src:'m'});});return 1})()");
  await sleep(1500);
  const cf = charFile(uV), pkA1 = await ev("(()=>{const q=NET.peers.find(x=>x.uid==='" + uA + "');return q?(q.pk|0):-1})()"), items1 = await ev('floorItems.length');
  ck((await body(uV)) === null && cf && cf.muerto, 'al matarlo: el personaje de Lobo se borra (marca de muerte)', cf && Object.keys(cf));
  ck(items1 > items0, 'suelta su mochila en el suelo', { antes: items0, despues: items1 });
  ck(pkA1 === pkA0 + 1, 'cuenta como muerte en PvP para Halcón', { antes: pkA0, despues: pkA1 });
  // al volver: lugar al azar y mochila nueva (como cualquier muerte)
  V = await join(cV, 'Lobo'); const vback = await V.evaluate(() => [P.x, P.y]);
  ck(Math.hypot(vback[0] - p0[0], vback[1] - p0[1]) > 40, 'tras morir su cuerpo, Lobo vuelve lejos (más de 40 casillas: no junto a su mochila)', { cuerpo: p0, aparece: vback.map(v => +v.toFixed(1)) });
  // ===== 4) vuelve a tiempo: despierta en su cuerpo con la vida que le quede =====
  await sleep(1500); const p1 = await V.evaluate(() => [P.x, P.y]); await inCombat(uV); await V.close(); await sleep(2000);
  await ev("(()=>{const L=SRV.lingers.get('" + uV + "');if(L)damageNpc(L.n,35,{by:'z'});return 1})()");
  bd = await body(uV); ck(bd && Math.round(bd.hp) <= 65, 'los zombis también pueden herir el cuerpo', bd && bd.hp);
  V = await join(cV, 'Lobo'); await sleep(2500);
  const st4 = await V.evaluate(() => ({ pos: [P.x, P.y], hp: P.hp, says: __says.slice(-4) })); const A4 = await ev("(()=>{const q=NET.peers.find(x=>x.uid==='" + uV + "');return q?q.A:null})()");
  ck((await body(uV)) === null && (await ev("NPCS.filter(n=>n.linger&&n.st!=='dead').length")) === 0, 'al volver, el cuerpo dormido desaparece (también de la lista de personajes)');
  ck(Math.hypot(st4.pos[0] - bd.x, st4.pos[1] - bd.y) < 1.6, 'vuelve EN su cuerpo', { cuerpo: [bd.x, bd.y], aparece: st4.pos.map(v => +v.toFixed(1)) });
  ck(st4.hp <= 66 && A4 !== null && A4 <= 66, 'con la vida que le quedaba al cuerpo (teléfono y servidor)', { telefono: Math.round(st4.hp), servidor: A4 && Math.round(A4) });
  await sleep(5000); const says4 = await V.evaluate(() => __says.slice()); ck(says4.some(s => /Vuelves a tu cuerpo/.test(s)), 'se le dice «Vuelves a tu cuerpo…»', says4.filter(s => /cuerpo|Apareces|dejaste/.test(s)));
  // ===== 5) nadie lo toca y no vuelve: a los 30 s desaparece y conserva el personaje =====
  await sleep(1500); const p5 = await V.evaluate(() => [P.x, P.y]); await inCombat(uV); await V.close(); await sleep(2000);
  ck((await body(uV)) !== null, 'otra desconexión en combate: cuerpo');
  await sleep(31000);
  const cf5 = charFile(uV); ck((await body(uV)) === null && cf5 && !cf5.muerto && cf5.P, 'a los 30 s sin volver: el cuerpo desaparece y el personaje sigue vivo', cf5 && cf5.P && [cf5.P.x, cf5.P.y]);
  await ev("(()=>{window.__sfLog=[];const _sf=SRV.spawnFor;if(!window.__sfW){window.__sfW=1;SRV.spawnFor=function(pe){const r=_sf.apply(this,arguments);__sfLog.push([r.why,r.p,!!pe.chBlob,pe.chBlob&&pe.chBlob.P&&[pe.chBlob.P.x,pe.chBlob.P.y],pe.diedAt||0]);return r}};return 1})()");
  ck((await ev("NPCS.filter(n=>n.linger&&n.st!=='dead').length")) === 0, 'no queda ningún cuerpo dormido en el mundo');
  V = await join(cV, 'Lobo'); const v5 = await V.evaluate(() => [P.x, P.y]); console.log('   spawnFor:', JSON.stringify(await ev('__sfLog'))); { const L5 = await ev('__sfLog'); const q = L5[0] && L5[0][3]; if (q) console.log('   casilla', JSON.stringify(await ev('(()=>{const x=Math.floor('+q[0]+'),y=Math.floor('+q[1]+'),i=idx(x,y);return {solid:solidTile(x,y),obj:to[i],objNombre:Object.keys(window).find(k=>/^O_/.test(k)&&window[k]===to[i])||null,suelo:tg[i],agua:tg[i]===G_WATER,inb:inb(x,y),npcs:NPCS.filter(n=>Math.hypot(n.x-'+q[0]+',n.y-'+q[1]+')<1).map(n=>[n.name,n.st])}})()'))); }
  ck(Math.hypot(v5[0] - p5[0], v5[1] - p5[1]) < 2, 'y al volver aparece donde dejó el cuerpo', { dejo: p5.map(v => +v.toFixed(1)), aparece: v5.map(v => +v.toFixed(1)) });
  ck(!A.errs.length && !V.errs.length, 'sin errores de página', A.errs.concat(V.errs).slice(0, 3));
  console.log('fallos:', fails); await b.close();
})().catch(e => { console.log('FAIL excepción', e.message); process.exit(1); });
