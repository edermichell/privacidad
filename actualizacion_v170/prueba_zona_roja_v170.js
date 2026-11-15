// v17.0 «Zona Roja»: vida de paredes y reparación, armario de herramientas, sacos/camas y reaparición, Zonas Rojas (sala PvP)
const { chromium } = require('playwright'); const fs = require('fs'); const URL = 'http://127.0.0.1:18080'; const sleep = ms => new Promise(r => setTimeout(r, ms));
const SHOT = process.env.SHOT || '/tmp/srvtest/shots170'; fs.mkdirSync(SHOT, { recursive: true });
let fails = 0; const ck = (ok, m, x) => { console.log(ok ? 'OK  ' : 'FAIL', m, x === undefined ? '' : JSON.stringify(x)); if (!ok) fails++; };
const ev = async js => { const t = await (await fetch(URL + '/admin/eval?sala=SALA1&js=' + encodeURIComponent(js))).text(); try { return JSON.parse(t); } catch (e) { return t; } };
const waitIn = async (p, t = 90) => { for (let i = 0; i < t * 2; i++) { await sleep(500); if (await p.evaluate(() => NET.st === 'playing' && STATE === 'play').catch(() => false)) return true; } return false; };
const hook = p => p.evaluate(() => { window.__says = window.__says || []; if (!window.__sh) { window.__sh = 1; const o = say; say = function (m) { window.__says.push(String(m)); return o.apply(this, arguments); }; } });
async function join(ctx, nick) { const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.on('dialog', d => d.accept()); await p.goto(URL + '/juego/'); await p.waitForFunction(() => typeof netJoinWs === 'function'); await p.evaluate(n => { localStorage.setItem('ur_nick', n); }, nick); await hook(p); await p.evaluate(() => { urAsk = async () => true; $('bMulti').click(); }); await p.waitForFunction(() => S137.ok && document.querySelector('[data-room="SALA1"]'), null, { timeout: 30000 }); await p.evaluate(() => document.querySelector('[data-room="SALA1"]').click()); if (!await waitIn(p)) throw new Error('no entra'); await p.evaluate(() => { P.ghost = 1e9; }); return p; }
const uidOf = p => p.evaluate(() => JSON.parse(localStorage.getItem('ur_id')).uid);
const sayHas = (p, re) => p.evaluate(s => window.__says.some(m => new RegExp(s).test(m)), re.source);
const pe = (u, js) => ev("(()=>{const p=NET.peers.find(q=>q.ready&&q.uid==='" + u + "');if(!p)return 'sin peer';return (" + js + ")})()");
const tp = (p, x, y, dir) => p.evaluate(([x, y, d]) => { P.x = x; P.y = y; if (d !== undefined) P.dir = d; if (typeof snapCam === 'function') snapCam(); }, [x, y, dir]);
const place = (p, cid, i) => p.evaluate(([cid, i]) => { const c = BCID[cid]; const ww = to[i] === O_WALL ? tv[i] + 1 : 0; applyPiece(c, i); const rec = { k: 'p', c: c.id, i, hp: c.hp || 0, w: ww }; BLD.pc.set(i, rec); BLD.list.push(rec); netBld({ k: 'p', c: c.id, i, w: ww }); }, [cid, i]);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] }); const mk = () => b.newContext({ viewport: { width: 900, height: 420 } });
  const CA = await mk(), CB = await mk();
  let A = await join(CA, 'Lobo'); await sleep(1500); const uA = await uidOf(A);
  await ev('(SRV.MOV.on=false,SRV.AUD.on=false,1)');
  const B = await join(CB, 'Zorro'); await sleep(1500); const uB = await uidOf(B);
  ck(await ev('SRV.PROT.on') === false, 'A0: sala PvP: las bases desconectadas ya no se protegen (SRV.PROT.on = false)');
  // un terreno libre lejos del inicio, con 9×9 casillas sin nada
  const F = await ev("(()=>{const s=SRV.spawn,Z=SRV.zrPick()||[];for(let r=30;r<170;r+=3)for(let a=0;a<6.28;a+=.25){const x=Math.floor(s[0]+Math.cos(a)*r),y=Math.floor(s[1]+Math.sin(a)*r);let ok=!Z.some(z=>Math.hypot(z.x-x,z.y-y)<z.r+20);for(let dy=-5;dy<=5&&ok;dy++)for(let dx=-5;dx<=5;dx++){const xx=x+dx,yy=y+dy;if(!inb(xx,yy)||tb[idx(xx,yy)]||tg[idx(xx,yy)]===G_WATER||containers.has(idx(xx,yy))){ok=false;break}}if(!ok)continue;for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){const i=idx(x+dx,y+dy);to[i]=0;td[i]=0;tbar[i]=0;tbh[i]=0;tg[i]=G_GRASS;invalidateChunkAt(x+dx,y+dy)}return [x,y]}return null})()"); await sleep(3000);   /* se despeja un terreno de 11×11 para la prueba */
  ck(Array.isArray(F), 'terreno libre para la prueba', F); const [fx, fy] = F;
  const Wd = await ev('W'), ix = (x, y) => y * Wd + x;
  for (const p of [A, B]) await p.evaluate(([x, y]) => { for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) tg[idx(x + dx, y + dy)] = G_GRASS; }, F);   /* el suelo no viaja en las diferencias */
  // ===== A) pared con vida y reparación =====
  const wi = ix(fx + 1, fy); await tp(A, fx - .5, fy + .5, 0); await sleep(500); await place(A, 'wall', wi); await sleep(1500);
  ck(await ev("BLD.pc.has(" + wi + ")&&BLD.pc.get(" + wi + ").u==='" + uA + "'"), 'A1: el servidor sabe que la pared es de Lobo');
  ck(await B.evaluate(i => BLD.pc.has(i), wi), 'A2: el otro jugador recibe la pieza (puede asaltarla)');
  await tp(B, fx + 2.5, fy + .5, Math.PI); await sleep(700);
  for (let k = 0; k < 2; k++) { await B.evaluate(i => netSend({ t: 'RD', i, d: 50 }), wi); await sleep(400); }
  await sleep(800);
  const hA = await A.evaluate(i => LK.rh.get(i), wi), hH = await ev('LK.rh.get(' + wi + ')');
  ck(hH === 320 && hA === 320, 'A3: dos golpes de 50: la pared baja a 320/420 en el servidor y el dueño lo ve', { servidor: hH, dueno: hA });
  await A.evaluate(() => { const h = mkItem('hammer'); addItem(h); P.eq = h; addItem(mkItem('plank', 4)); addItem(mkItem('nails', 8)); });
  await sleep(300);
  const fi = await A.evaluate(() => { const t = findInteract(); return t && [t.type, hintFor(t)]; });
  ck(fi && fi[0] === 'wrep' && /Reparar pared · 76%/.test(fi[1]), 'A4: con el martillo en la mano, USAR ofrece «Reparar pared · 76%»', fi);
  await A.evaluate(() => { doInteract(); }); await sleep(3500);
  ck(await sayHas(A, /pleno asalto/) && await ev('LK.rh.get(' + wi + ')') === 320, 'A5: recién golpeada no se puede reparar (en pleno asalto)');
  ck(await A.evaluate(() => countItem('plank') === 4 && countItem('nails') === 8), 'A5: y no gasta materiales');
  await ev('(SRV.REP.quiet=0,1)'); await A.evaluate(() => { doInteract(); }); await sleep(3800);
  const hH2 = await ev('LK.rh.has(' + wi + ')?LK.rh.get(' + wi + '):420'); ck(hH2 === 420, 'A6: reparar: +100 → 420/420', hH2);
  ck(await A.evaluate(() => countItem('plank') === 3 && countItem('nails') === 6), 'A6: gasta 1 tablón y 2 clavos', await A.evaluate(() => [countItem('plank'), countItem('nails')]));
  ck(await B.evaluate(i => !LK.rh.has(i), wi), 'A7: los demás también ven la pared sana');
  await ev('(SRV.REP.quiet=15000,1)');
  // ===== B) armario de herramientas =====
  const ti = ix(fx, fy + 2); await place(A, 'tc', ti); await sleep(1500); await ev('(SRV.tcSendAll(),1)'); await sleep(800);
  const rec = await ev("(()=>{const r=BLD.pc.get(" + ti + ");return r&&{c:r.c,u:r.u,on:r.on,au:r.au,h:SRV.tcInfo(r)}})()");
  ck(rec && rec.c === 'tc' && rec.u === uA && rec.on === 1 && rec.h === 6, 'B1: armario de herramientas de Lobo activo, con las primeras 6 h gratis', rec);
  const zA = await A.evaluate(i => ZR17.tcm.get(i), ti), zB = await B.evaluate(i => ZR17.tcm.get(i), ti);
  ck(zA && zA.own === 2 && zB && zB.own === 0 && zB.on === 1, 'B2: Lobo lo ve como suyo; Zorro, como zona ajena', { zA, zB });
  // Zorro intenta construir dentro de la zona
  await tp(B, fx + 3.5, fy + 3.5, 0); await B.evaluate(() => { const h = mkItem('hammer'); addItem(h); P.eq = h; addItem(mkItem('plank', 10)); addItem(mkItem('nails', 20)); BLD.on = true; BLD.mode = 'build'; BLD.sel = BCID.crate; bldUpdate(); });
  const bw = await B.evaluate(() => [BLD.ok, BLD.why]); ck(bw[0] === false && /armario de herramientas/.test(bw[1]), 'B3: el teléfono no le deja construir en zona ajena', bw);
  await B.evaluate(() => { BLD.on = false; });
  const ki = ix(fx + 4, fy + 3); await place(B, 'crate', ki); await sleep(1800);
  ck(await ev('!BLD.pc.has(' + ki + ')'), 'B4: aunque lo fuerce, el servidor lo rechaza');
  ck(await B.evaluate(i => !BLD.pc.has(i), ki) && await sayHas(B, /armario de herramientas de otro/), 'B4: la caja desaparece en su teléfono y se le explica');
  ck(await B.evaluate(() => countItem('plank') === 12 && countItem('nails') === 23), 'B4: y le devuelve el coste (2 tablones + 3 clavos)', await B.evaluate(() => [countItem('plank'), countItem('nails')]));
  // Lobo sí puede construir dentro de su zona
  const ki2 = ix(fx - 2, fy + 3); await A.evaluate(() => { addItem(mkItem('plank', 4)); addItem(mkItem('nails', 6)); }); await place(A, 'crate', ki2); await sleep(1500);
  ck(await ev('BLD.pc.has(' + ki2 + ')'), 'B5: el dueño construye sin problema en su zona');
  // Zorro se autoriza abriendo el armario (sin candado)
  await tp(B, fx + .5, fy + 3.6, -Math.PI / 2); await sleep(600); await B.evaluate(i => UI.openCont(i), ti); await sleep(1500); await B.evaluate(() => UI.closeAll());
  ck(await ev("BLD.pc.get(" + ti + ").au.includes('" + uB + "')") && await sayHas(B, /Quedas autorizado/), 'B6: al abrir el armario, Zorro queda autorizado');
  const ki3 = ix(fx + 4, fy + 4); await place(B, 'crate', ki3); await sleep(1500);
  ck(await ev('BLD.pc.has(' + ki3 + ')'), 'B7: autorizado, ya puede construir en la zona');
  // mantenimiento
  await ev("(()=>{const r=BLD.pc.get(" + ti + ");r.pt=Date.now()-1;containers.get(" + ti + ").items=[];SRV.tcUpkeep();return r.on})()");
  ck(await ev('BLD.pc.get(' + ti + ').on') === 0, 'B8: sin tablones ni clavos dentro, la zona caduca'); await sleep(1500);
  ck(await sayHas(A, /sin mantenimiento/), 'B8: y se avisa al dueño');
  const up = await ev("(()=>{const r=BLD.pc.get(" + ti + "),c=containers.get(" + ti + ");c.items=[mkItem('plank',3),mkItem('nails',5)];SRV.tcUpkeep();return {on:r.on,h:SRV.tcInfo(r),it:c.items.map(q=>q.id+':'+q.n)}})()");
  ck(up.on === 1 && up.it.join() === 'plank:2,nails:3' && up.h === 12, 'B9: con material vuelve a activarse; cobra 1 tablón + 2 clavos por cada 6 h', up);
  // ===== C) saco de dormir y reaparición =====
  const bi = ix(fx - 3, fy - 2); await A.evaluate(() => { addItem(mkItem('rag', 3)); addItem(mkItem('sheet', 1)); }); await place(A, 'bag', bi); await sleep(1500);
  ck(await ev("(()=>{const r=BLD.pc.get(" + bi + ");return !!r&&r.c==='bag'&&r.u==='" + uA + "'&&to[" + bi + "]===O_BAG})()"), 'C1: saco de dormir puesto (y es de Lobo)');
  ck(await A.evaluate(i => !solidTile(i % W, (i / W) | 0), bi), 'C1: se puede pisar');
  await tp(A, fx - 2.5, fy - 1.5, Math.PI); await A.evaluate(() => { P.fat = 60; }); await sleep(300);
  const fb = await A.evaluate(() => { const sv = cars.splice(0); const t = findInteract(); cars.push(...sv); return t && [t.type, hintFor(t)]; });   /* sin el auto aparcado al lado */ ck(fb && fb[0] === 'bed' && fb[1] === 'Dormir en el saco', 'C2: USAR: «Dormir en el saco»', fb);
  // morir lejos
  await tp(A, fx + 40.5, fy + .5); await sleep(1200);
  await ev("(NET.peers.forEach(p=>{p.protUntil=0}),1)"); await pe(uA, "(SRV.pvpHurt(p,999,'prueba',null),1)"); await sleep(2500);
  const sp1 = await A.evaluate(() => ({ st: STATE, spl: ZR17.spl && { l: ZR17.spl.l.length, w: ZR17.spl.w, n: ZR17.spl.n, ad: ZR17.spl.ad }, vis: !$('spPanel').hidden, btn: [...document.querySelectorAll('#spPanel button[data-sp]')].map(b => [b.textContent.replace(/\s+/g, ' ').trim(), b.disabled]), rev: $('bRevive').hidden, again: $('bAgain').hidden }));
  ck(sp1.st === 'dead' && sp1.vis && sp1.spl && sp1.spl.l === 1 && sp1.spl.w === 10 && sp1.spl.n === 1 && sp1.spl.ad === 1, 'C3: al morir se ofrece elegir: su saco (1), espera 10 s, con anuncio', sp1.spl);
  ck(sp1.btn.length === 3 && sp1.btn[0][1] === true && /Saco de dormir/.test(sp1.btn[0][0]) && /Lugar al azar/.test(sp1.btn[1][0]) && /ANUNCIO/.test(sp1.btn[2][0]) && sp1.btn[2][1] === false, 'C3: saco y azar bloqueados con cuenta atrás; el anuncio no', sp1.btn);
  ck(sp1.rev && sp1.again, 'C3: sin «Revivir» ni «Otra vez» (en la sala se elige aquí)');
  await A.screenshot({ path: SHOT + '/c3_reaparecer.png' });
  // anuncio → reaparece ya en el saco
  await A.evaluate(() => { MS.vip = true; }); await A.evaluate(() => document.querySelector('#spAd').click());   /* Fundador: el «anuncio» es gratis; mismo camino */
  ck(await waitIn(A, 60), 'C4: tras el anuncio vuelve a la sala sin esperar');
  await sleep(1200); const p4 = await A.evaluate(() => [P.x, P.y]);
  ck(Math.hypot(p4[0] - (fx - 2.5), p4[1] - (fy - 1.5)) < 2.6, 'C4: aparece junto a su saco de dormir', { aparece: p4, saco: [fx - 3, fy - 2] });
  await sleep(6000); ck(await sayHas(A, /saco de dormir/), 'C4: y se le dice «Apareces en tu saco de dormir»');
  await hook(A);
  // segunda muerte: 25 s, sin anuncio (ya usó uno hace menos de 10 min)
  await tp(A, fx + 40.5, fy + .5); await sleep(1200); await ev("(NET.peers.forEach(p=>{p.protUntil=0}),1)"); await pe(uA, "(SRV.pvpHurt(p,999,'prueba',null),1)"); await sleep(2500);
  const sp2 = await A.evaluate(() => ({ w: ZR17.spl && ZR17.spl.w, n: ZR17.spl && ZR17.spl.n, ad: !!document.querySelector('#spAd') }));
  await A.evaluate(() => { MS.vip = false; });
  ck(sp2.w === 25 && sp2.n === 2 && !sp2.ad, 'C5: segunda muerte en la hora: 25 s y sin anuncio (uno cada 10 min)', sp2);
  // intentar volver antes de tiempo (app trucada): el servidor lo rechaza
  await A.evaluate(() => { const c = NET.code; netLeave(true); toMenu(); netOpenUI(); s138JoinId(c); }); await sleep(5000);
  const er = await A.evaluate(() => [STATE, NET.err, window.__says.slice(-3)]); ck(er[0] === 'menu' && /Aún no puedes reaparecer/.test(er[1] + er[2].join()), 'C6: volver antes de tiempo: el servidor no te deja entrar y explica cuánto falta', er);
  await sleep(21000);
  await A.evaluate(() => { NET.spReq = { sp: -1, ad: 0 }; s138JoinId('SALA1'); }); ck(await waitIn(A, 60), 'C7: pasada la espera, entra');
  await sleep(1200); const p7 = await A.evaluate(() => [P.x, P.y]); ck(Math.hypot(p7[0] - fx, p7[1] - fy) > 8, 'C7: eligió «al azar»: lejos de su saco', p7);
  // ===== D) Zonas Rojas =====
  const Z = await ev("(SRV.zrTick(),SRV.zrPick().map(z=>({id:z.id,k:z.k,x:z.x,y:z.y,r:z.r,cr:z.crates.length,ok:z.crates.every(i=>to[i]===O_MCRATE&&containers.get(i).bk==='zr'&&Array.isArray(containers.get(i).items)),g:NPCS.filter(n=>n.zr===z.id&&n.st!=='dead').map(n=>n.type)})))");
  ck(Array.isArray(Z) && Z.length >= 1, 'D1: el servidor elige Zonas Rojas', Z);
  ck(Z.every(z => z.cr === 3 && z.ok), 'D2: cada una con 3 cajas militares con su propio botín', Z.map(z => z.cr));
  ck(Z.every(z => z.g.length >= 4) && Z[0].g.includes('boss'), 'D3: vigiladas por saqueadores armados (y un jefe en la primera)', Z.map(z => z.g));
  await sleep(500); await ev("(NET.peers.forEach(p=>SRV.zrSend(p)),1)"); await sleep(800);
  const zc = await A.evaluate(() => ZR17.zr.map(z => [z.id, z.n, z.k])); ck(zc.length === Z.length, 'D4: el teléfono las recibe', zc);
  const z0 = Z[0]; const lt = await ev("(()=>{const z=SRV.zrPick()[0];const c=containers.get(z.crates[0]);return c.items.map(q=>q.id)})()");
  ck(lt.length >= 2 && lt.every(id => ['rifle', 'smg', 'shotgun', 'pistol', 'revolver', 'ammo9', 'shells', 'ammo762', 'ammo38', 'vest', 'helmet', 'riothelm', 'medkit', 'gasmask', 'adrenaline', 'pills', 'bandage', 'sbandage'].includes(id)), 'D5: botín de la Zona Roja (armas, munición, protección, médico)', lt);
  // entrar sin máscara
  const sp = await ev("(()=>{const z=SRV.zrPick()[0];for(let r=0;r<z.r*.6;r+=.5)for(let a=0;a<6.28;a+=.5){const x=z.x+Math.cos(a)*r,y=z.y+Math.sin(a)*r;if(!solidTile(Math.floor(x),Math.floor(y))&&tg[idx(Math.floor(x),Math.floor(y))]!==G_WATER)return [Math.floor(x)+.5,Math.floor(y)+.5]}return [z.x,z.y]})()");
  await ev("(NPCS.filter(n=>n.zr).forEach(n=>{n.st='dead';n.hp=0}),1)");   /* que los guardias no lo maten durante la medida */
  await A.evaluate(() => { P.hp = 100; P.ghost = 1e9; }); await tp(A, sp[0], sp[1]); await sleep(4000);
  const g1 = await A.evaluate(() => [P.hp, !!ZR17.inZ, LOCB.n, window.__says.slice(-6).join(' | ')]);
  ck(g1[1] && g1[0] < 98, 'D6: dentro sin máscara, el gas quita vida', g1[0]);
  ck(/ZONA ROJA/.test(g1[2]) || /ZONA ROJA/.test(g1[3]), 'D7: cartel «ZONA ROJA» y la historia del lugar', g1.slice(2));
  await A.screenshot({ path: SHOT + '/d7_zona_roja.png' });
  await A.evaluate(() => { const m = mkItem('gasmask'); addItem(m); P.cloth.head = m; P.hp = 100; }); await sleep(4000);
  const g2 = await A.evaluate(() => P.hp); ck(g2 > 99.5, 'D8: con máscara antigás no hace daño', g2);
  await A.evaluate(() => { P.cloth.head = null; delete P.cloth.head; }); await tp(A, z0.x + z0.r + 15, z0.y); await sleep(2500);
  ck(await A.evaluate(() => !ZR17.inZ) && await sayHas(A, /Sales de la Zona Roja/), 'D9: al salir se avisa');
  await A.evaluate(() => { UI.closeAll && UI.closeAll(); if (typeof openBigMap === 'function') openBigMap(); else if ($('bMap')) $('bMap').click(); }); await sleep(1200); await A.screenshot({ path: SHOT + '/d10_mapa.png' });
  // pared rota del todo → desaparece para todos
  await A.evaluate(() => { if ($('bigmap')) $('bigmap').hidden = true; UI.closeAll && UI.closeAll(); });
  await tp(B, fx + 2.5, fy + .5, Math.PI); await sleep(600);
  for (let k = 0; k < 9; k++) { await B.evaluate(i => netSend({ t: 'RD', i, d: 50 }), wi); await sleep(300); }
  await sleep(1500); console.log('   diag', await ev("JSON.stringify({t:to[" + wi + "],h:LK.rh.get(" + wi + "),b:(()=>{const p=NET.peers.find(q=>q.uid==='" + uB + "');return p&&p.rp&&[p.rp.x,p.rp.y,p.rp.dead,p.chDead]})()})"), await B.evaluate(() => [P.x, P.y, P.dead, STATE]));
  await sleep(1500); ck(await ev('to[' + wi + ']') === 0 && await B.evaluate(i => to[i] === 0 && !LK.rh.has(i) && !BLD.pc.has(i), wi), 'A8: a 0 de vida la pared se rompe (también en el teléfono del atacante)');
  for (const p of [A, B]) ck(p.errs.length === 0, 'sin errores de página', p.errs.slice(0, 3));
  console.log(fails ? 'fallos: ' + fails : 'TODO OK'); await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('FAIL excepción', e && e.stack || e); process.exit(1); });
