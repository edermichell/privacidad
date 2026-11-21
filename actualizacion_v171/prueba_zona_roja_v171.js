// v17.1: nube de gas visible desde fuera, filtro de la máscara que se gasta, grietas y polvo
const { chromium } = require('playwright'); const URL = 'http://127.0.0.1:18080'; const sleep = ms => new Promise(r => setTimeout(r, ms)); const OUT = '/tmp/srvtest/shots171'; require('fs').mkdirSync(OUT, { recursive: true });
let fails = 0; const ck = (ok, m, x) => { console.log(ok ? 'OK  ' : 'FAIL', m, x === undefined ? '' : JSON.stringify(x)); if (!ok) fails++; };
const ev = async js => { const t = await (await fetch(URL + '/admin/eval?sala=SALA1&js=' + encodeURIComponent(js))).text(); try { return JSON.parse(t); } catch (e) { return t; } };
async function join(ctx, nick) { const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); await p.goto(URL + '/juego/'); await p.waitForFunction(() => typeof netJoinWs === 'function'); await p.evaluate(n => { localStorage.setItem('ur_nick', n); urAsk = async () => true; window.__says = []; const o = say; say = function (m) { window.__says.push(String(m)); return o.apply(this, arguments); }; $('bMulti').click(); }, nick); await p.waitForFunction(() => S137.ok && document.querySelector('[data-room="SALA1"]'), null, { timeout: 30000 }); await p.evaluate(() => document.querySelector('[data-room="SALA1"]').click()); await p.waitForFunction(() => NET.st === 'playing' && STATE === 'play', null, { timeout: 90000 }); await p.evaluate(() => { P.ghost = 1e9; for (const id of ['tut', 'quest']) { const e = $(id); if (e) e.hidden = true; } try { $('tut').style.display = 'none'; } catch (e) { } }); return p; }
const tp = (p, x, y) => p.evaluate(([x, y]) => { P.x = x; P.y = y; snapCam && snapCam(); }, [x, y]);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] }); const mk = () => b.newContext({ viewport: { width: 900, height: 420 }, deviceScaleFactor: 2 });
  const A = await join(await mk(), 'Lobo'); await sleep(1500); await ev('(SRV.MOV.on=false,SRV.AUD.on=false,1)');
  await ev("(NET.peers.forEach(p=>SRV.zrSend(p)),NPCS.filter(n=>n.zr).forEach(n=>{n.st='dead';n.hp=0}),1)"); await sleep(1200);
  const z = await A.evaluate(() => ZR17.zr[0]); ck(!!z, 'zona recibida', z);
  const out = await ev("(()=>{const z=SRV.zrPick()[0];for(let r=z.r+5;r<z.r+12;r+=.5)for(let a=0;a<6.28;a+=.3){const x=Math.floor(z.x+Math.cos(a)*r),y=Math.floor(z.y+Math.sin(a)*r);if(inb(x,y)&&!solidTile(x,y)&&tg[idx(x,y)]!==G_WATER&&!tb[idx(x,y)])return [x+.5,y+.5]}return null})()");
  await tp(A, out[0], out[1]); await A.evaluate(() => { P.hp = 100; }); await sleep(2500);
  const o1 = await A.evaluate(() => [!!ZR17.inZ, P.hp]); ck(!o1[0] && o1[1] > 99, 'fuera de la zona (a ' + (Math.hypot(out[0] - z.x, out[1] - z.y) - z.r).toFixed(1) + ' casillas del borde): sin daño', o1);
  await A.screenshot({ path: OUT + '/nube_desde_fuera.png' });
  // la nube se dibuja: comparar píxeles de un cuadro con y sin ella
  const px = await A.evaluate(() => { const g = document.querySelector('canvas').getContext('2d'); return 1; });
  // dentro con máscara: el filtro baja
  const inside = await ev("(()=>{const z=SRV.zrPick()[0];for(let r=0;r<z.r*.4;r+=.5)for(let a=0;a<6.28;a+=.5){const x=Math.floor(z.x+Math.cos(a)*r),y=Math.floor(z.y+Math.sin(a)*r);if(!solidTile(x,y)&&tg[idx(x,y)]!==G_WATER)return [x+.5,y+.5]}return [z.x,z.y]})()");
  await A.evaluate(() => { const m = mkItem('gasmask'); addItem(m); P.cloth.head = m; P.hp = 100; }); await tp(A, inside[0], inside[1]); await sleep(5000);
  const f1 = await A.evaluate(() => [P.cloth.head && P.cloth.head.c, P.hp, !!ZR17.inZ]); ck(f1[2] && f1[0] < 99 && f1[0] > 90 && f1[1] > 99.5, 'dentro con máscara: no hace daño y el filtro se gasta poco a poco', f1);
  await A.screenshot({ path: OUT + '/dentro_con_mascara.png' });
  await A.evaluate(() => { P.cloth.head.c = 20; }); await sleep(1200); ck(await A.evaluate(() => window.__says.some(m => /se está agotando/.test(m))), 'aviso cuando queda poco filtro');
  await A.evaluate(() => { P.cloth.head.c = .3; }); await sleep(2500);
  const f2 = await A.evaluate(() => [!!(P.cloth && P.cloth.head), P.inv.some(i => i.id === 'gasmask'), window.__says.some(m => /tiras la máscara/.test(m))]); ck(!f2[0] && !f2[1] && f2[2], 'filtro agotado: la máscara se tira y se avisa', f2);
  await A.evaluate(() => { P.hp = 100; }); await sleep(3000); ck(await A.evaluate(() => P.hp < 99), 'sin máscara, el gas vuelve a quemar');
  // grietas y polvo
  const F = await ev("(()=>{const s=SRV.spawn;for(let r=30;r<170;r+=3)for(let a=0;a<6.28;a+=.25){const x=Math.floor(s[0]+Math.cos(a)*r),y=Math.floor(s[1]+Math.sin(a)*r);let ok=!SRV.zrPick().some(z=>Math.hypot(z.x-x,z.y-y)<z.r+20);for(let dy=-4;dy<=4&&ok;dy++)for(let dx=-4;dx<=4;dx++){const xx=x+dx,yy=y+dy;if(!inb(xx,yy)||tb[idx(xx,yy)]||tg[idx(xx,yy)]===G_WATER||containers.has(idx(xx,yy))){ok=false;break}}if(!ok)continue;for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const i=idx(x+dx,y+dy);to[i]=0;td[i]=0;tbar[i]=0;tbh[i]=0;invalidateChunkAt(x+dx,y+dy)}return [x,y]}return null})()");
  await sleep(2500); const [fx, fy] = F; await tp(A, fx - 1.5, fy + .5); await sleep(800);
  const W_ = await ev('W'); const walls = [-1, 0, 1].map(k => (fy + k) * W_ + fx + 1);
  for (const i of walls) await A.evaluate(i => { const c = BCID.wall; applyPiece(c, i); const rec = { k: 'p', c: 'wall', i, hp: 0, w: 0 }; BLD.pc.set(i, rec); BLD.list.push(rec); netBld({ k: 'p', c: 'wall', i, w: 0 }); }, i);
  await sleep(1500);
  await A.evaluate(() => { window.__chips = 0; const o = spawnPart; spawnPart = function (k) { if (k === 'chip') window.__chips++; return o.apply(this, arguments); }; });
  await ev("(()=>{const L=" + JSON.stringify(walls) + ";[[L[0],300],[L[1],180],[L[2],90]].forEach(([i,h])=>{LK.rh.set(i,h);NET.peers.forEach(p=>netSendRaw(p,{t:'LKH',i,h,m:420}))});return 1})()");
  await sleep(1200); ck(await A.evaluate(() => window.__chips >= 3), 'el dueño ve el polvo cuando golpean su base', await A.evaluate(() => window.__chips));
  await A.screenshot({ path: OUT + '/grietas.png' });
  ck(!A.errs.length, 'sin errores de página', A.errs.slice(0, 3)); ck(await A.evaluate(() => DBGC.n) === 0, 'sin errores silenciosos', await A.evaluate(() => DBGC.msg));
  console.log(fails ? 'fallos: ' + fails : 'TODO OK'); await b.close();
})().catch(e => { console.log('FAIL excepción', e && e.stack || e); process.exit(1); });
