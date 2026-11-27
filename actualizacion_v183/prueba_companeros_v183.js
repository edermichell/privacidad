// v18.3 · en una sala del servidor: el agarrón de un jugador lo ven los demás; los golpes de otro hacen retroceder al zombi en mi pantalla
const { chromium } = require('playwright'); const URL = 'http://127.0.0.1:18080', ROOM = process.env.ROOM || 'SALA1'; const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ck = (ok, m, x) => { console.log(ok ? 'OK  ' : 'FAIL', m, x === undefined ? '' : JSON.stringify(x)); if (!ok) fails++; };
const ev = async js => { const t = await (await fetch(URL + '/admin/eval?sala=' + ROOM + '&js=' + encodeURIComponent(js))).text(); try { return JSON.parse(t); } catch (e) { return t; } };
const waitIn = async (p, t = 90) => { for (let i = 0; i < t * 2; i++) { await sleep(500); if (await p.evaluate(() => NET.st === 'playing' && STATE === 'play').catch(() => false)) return true; } return false; };
async function join(ctx, nick) { const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.on('dialog', d => d.accept()); await p.goto(URL + '/juego/'); await p.waitForFunction(() => typeof netJoinWs === 'function');
  await p.evaluate(n => { localStorage.setItem('ur_nick', n); window.urAsk = async () => true; }, nick); await p.evaluate(() => $('bMulti').click());
  await p.waitForFunction(r => S137.ok && document.querySelector('[data-room="' + r + '"]'), ROOM, { timeout: 30000 }); await p.evaluate(r => document.querySelector('[data-room="' + r + '"]').click(), ROOM);
  if (!await waitIn(p)) throw new Error('no entra ' + nick); return p; }
(async () => {
  const b = await chromium.launch(); const A = await join(await b.newContext({ viewport: { width: 915, height: 412 } }), 'Halcon'), L = await join(await b.newContext({ viewport: { width: 915, height: 412 } }), 'Lobo');
  const uA = await A.evaluate(() => JSON.parse(localStorage.getItem('ur_id')).uid), uL = await L.evaluate(() => JSON.parse(localStorage.getItem('ur_id')).uid);
  ck((await ev("typeof an183Dir")) === 'function', 'el servidor usa el juego 18.3');
  // juntar a los dos: Halcón al lado de Lobo
  await sleep(1500); const lp = await L.evaluate(() => [P.x, P.y]); await A.evaluate(p => { P.x = p[0] + 1.6; P.y = p[1]; P.ghost = 1e9; }, lp); await L.evaluate(() => { P.ghost = 0; ur180Chance = () => 1; GRAB.cd = 0; });
  await sleep(2500);
  const slotL = await ev("(()=>{const q=NET.peers.find(x=>x.uid==='" + uL + "');return q?q.slot:null})()");
  // 1) agarrón de Lobo visto por Halcón
  let got = null;
  for (let k = 0; k < 4 && !got; k++) {
    await ev("(()=>{Z.length=0;const q=NET.peers.find(x=>x.uid==='" + uL + "');let zx=null,zy=null;for(let k=0;k<16&&zx===null;k++){const a=k*Math.PI/8,x=q.rp.x+Math.cos(a)*.7,y=q.rp.y+Math.sin(a)*.7;if(!solidTile(Math.floor(x),Math.floor(y))&&losClear(x,y,q.rp.x,q.rp.y)){zx=x;zy=y;}}if(zx===null)return null;const z=mkZombie(zx,zy,'walker');z.st='chase';z.seen=99;z.los=true;Z.push(z);return z.id})()");
    for (let i = 0; i < 20 && !got; i++) { await sleep(250); got = await L.evaluate(() => !!GRAB.cur); }
  }
  ck(got, 'a Lobo le agarra un zombi del servidor');
  if (got) {
    await L.evaluate(() => { GRAB.cur.dur = 99; });
    await sleep(700); await A.screenshot({ path: process.env.OUT + '/companero_agarrado.png' });   /* que dure mientras se comprueba */
    let seen = null; for (let i = 0; i < 12; i++) { await sleep(250); seen = await A.evaluate(s => { const R = NET.oth.get(s); return R ? { gb: R.gb, name: R.name } : null; }, slotL); if (seen && seen.gb) break; }
    ck(seen && seen.gb === 1, 'Halcón ve que a Lobo le están agarrando (estado «gb» reenviado por el servidor)', seen);
    const dr = await A.evaluate(async s => { let n = 0; const _d = drawRemote; drawRemote = function (R) { if (R && R.gb) n++; return _d.apply(this, arguments); }; await new Promise(r => setTimeout(r, 600)); drawRemote = _d; return n; }, slotL);
    ck(dr > 5, 'en la pantalla de Halcón se dibuja a Lobo agarrado (tiembla y aro rojo)', dr);
    for (let i = 0; i < 12 && await L.evaluate(() => !!GRAB.cur); i++) { await L.mouse.click(450, 150); await sleep(70); }
    let off = null; for (let i = 0; i < 12; i++) { await sleep(250); off = await A.evaluate(s => { const R = NET.oth.get(s); return R ? R.gb : null; }, slotL); if (off === 0) break; }
    ck(off === 0, 'al soltarse Lobo, Halcón deja de verlo agarrado', off);
  }
  // 2) golpe de Halcón a un zombi: Lobo lo ve retroceder (bit 64)
  await ev("(()=>{Z.length=0;return 1})()"); await L.evaluate(() => { P.ghost = 1e9; GRAB.cur = null; }); await sleep(800);
  const zid = await ev("(()=>{const q=NET.peers.find(x=>x.uid==='" + uA + "');const z=mkZombie(q.rp.x+.9,q.rp.y+.3,'walker');z.st='idle';z.spd=0;z.hp=1e6;Z.push(z);return z.id})()");
  await sleep(1500);
  await L.evaluate(id => { window.__h0 = (NET.zm.get(id) || {}).hitT || 0; }, zid);
  await ev("(()=>{const q=NET.peers.find(x=>x.uid==='" + uA + "');const z=Z.find(k=>k.id===" + zid + ");damageZombie(z,3,{from:q.rp,noPush:true});return 1})()");
  let h = null; for (let i = 0; i < 10; i++) { await sleep(200); h = await L.evaluate(id => { const z = NET.zm.get(id); return z ? { hit: (z.hitT || 0) > __h0, hx: z.hx181, aZ: null } : null; }, zid); if (h && h.hit) break; }
  ck(h && h.hit && typeof h.hx === 'number', 'Lobo ve el golpe que dio Halcón: destello y retroceso en su pantalla', h);
  const dirOk = await L.evaluate(([id, s]) => { const z = NET.zm.get(id), R = NET.oth.get(s); if (!z || !R) return null; const sx = (z.x - R.x) - (z.y - R.y); return Math.sign(sx) === Math.sign(z.hx181) || Math.abs(sx) < .05; }, [zid, await ev("(()=>{const q=NET.peers.find(x=>x.uid==='" + uA + "');return q.slot})()")]);
  ck(dirOk === true, 'el retroceso va en sentido contrario a Halcón (quien golpeó)', dirOk);
  // el propio golpe no se duplica: Lobo golpea él mismo → la marca del servidor que llega después no repite el retroceso
  const own = await L.evaluate(async id => { const z = NET.zm.get(id); if (!z) return null; damageZombie(z, 2, { from: P, noPush: true }); const t0 = z.hitT; await new Promise(r => setTimeout(r, 1200)); return { t0, t1: z.hitT }; }, zid);
  ck(own && own.t0 === own.t1, 'si golpea uno mismo, la marca del servidor no repite el retroceso', own);
  ck(!A.errs.length && !L.errs.length, 'sin errores de página', A.errs.concat(L.errs).slice(0, 3));
  console.log('fallos:', fails); await b.close();
})().catch(e => { console.log('FAIL excepción', e.message); process.exit(1); });
