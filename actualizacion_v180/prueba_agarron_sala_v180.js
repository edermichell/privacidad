// v18.0 · agarrón en una sala del servidor: el zombi del servidor agarra al invitado, este forcejea y el servidor aturde al zombi
const { chromium } = require('playwright'); const URL = 'http://127.0.0.1:18080', ROOM = process.env.ROOM || 'SALA1'; const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ck = (ok, m, x) => { console.log(ok ? 'OK  ' : 'FAIL', m, x === undefined ? '' : JSON.stringify(x)); if (!ok) fails++; };
const ev = async js => { const t = await (await fetch(URL + '/admin/eval?sala=' + ROOM + '&js=' + encodeURIComponent(js))).text(); try { return JSON.parse(t); } catch (e) { return t; } };
const waitIn = async (p, t = 90) => { for (let i = 0; i < t * 2; i++) { await sleep(500); if (await p.evaluate(() => NET.st === 'playing' && STATE === 'play').catch(() => false)) return true; } return false; };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 915, height: 412 } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto(URL + '/juego/'); await p.waitForFunction(() => typeof netJoinWs === 'function');
  await p.evaluate(() => { localStorage.setItem('ur_nick', 'Tigre'); window.urAsk = async () => true; });
  await p.evaluate(() => $('bMulti').click()); await p.waitForFunction(r => S137.ok && document.querySelector('[data-room="' + r + '"]'), ROOM, { timeout: 30000 });
  await p.evaluate(r => document.querySelector('[data-room="' + r + '"]').click(), ROOM);
  ck(await waitIn(p), 'el invitado entra en la sala');
  const uid = await p.evaluate(() => JSON.parse(localStorage.getItem('ur_id')).uid);
  ck((await ev('typeof GRAB')) === 'object', 'el servidor usa el juego 18.0 (tiene agarrones)');
  await sleep(1500);
  await p.evaluate(() => { P.ghost = 0; keys.KeyW = false; ur180Chance = () => 1; GRAB.cd = 0; window.__hp = []; });
  let got = null;
  for (let k = 0; k < 4 && !got; k++) {
    const zid = await ev("(()=>{Z.length=0;const q=NET.peers.find(x=>x.uid==='" + uid + "');if(!q||!q.rp)return null;let zx=null,zy=null;for(let k=0;k<16&&zx===null;k++){const a=k*Math.PI/8,x=q.rp.x+Math.cos(a)*.7,y=q.rp.y+Math.sin(a)*.7;if(!solidTile(Math.floor(x),Math.floor(y))&&losClear(x,y,q.rp.x,q.rp.y)){zx=x;zy=y;}}if(zx===null)return null;const z=mkZombie(zx,zy,'walker');z.st='chase';z.seen=99;z.los=true;z.id=z.id||Date.now();Z.push(z);return z.id})()");
    for (let i = 0; i < 20 && !got; i++) { await sleep(250); got = await p.evaluate(() => GRAB.cur ? { id: GRAB.cur.id, need: GRAB.cur.need, hp: P.hp, w: P.wounds.length } : null); }
    if (!got && process.env.DBG) { console.log('   srv', JSON.stringify(await ev("(()=>{const q=NET.peers.find(x=>x.uid==='" + uid + "');const z=Z.find(k=>k.id===" + zid + ");if(!z)return 'sin zombi';return {st:z.st,d:+Math.hypot(z.x-q.rp.x,z.y-q.rp.y).toFixed(2),atkCd:+(z.atkCd||0).toFixed(2),wind:z.wind,tgt:z.windT?(z.windT===P?'host':'rp'):null,stun:z.stun,P:[+P.x.toFixed(1),+P.y.toFixed(1)],rp:[+q.rp.x.toFixed(1),+q.rp.y.toFixed(1)],zp:[+z.x.toFixed(1),+z.y.toFixed(1)],ghost:P.ghost,MXw:MX.zwhiff|0,rp:!!NET.rp,rpOk:NET.rp&&NET.rp.ok,rpIsPeer:!!NET.rp&&NET.peers.some(p=>p.rp===NET.rp),live:netLive().length,role:NET.role,tgt2:(()=>{const t=netTarget(z);return t===P?'host':t===q.rp?'guest':'otro'})()}})()"))); console.log('   cli', JSON.stringify(await p.evaluate(() => ({ hp: P.hp, w: P.wounds.length, g: !!GRAB.cur, cd: GRAB.cd, ghost: P.ghost, roll: !!P.roll, pos: [+P.x.toFixed(1), +P.y.toFixed(1)] })))); }
    if (got) got.zid = zid;
  }
  ck(!!got, 'el zombi del servidor agarra al invitado (golpe «ZH» convertido en agarrón)', got);
  if (got) {
    ck(got.id === got.zid, 'el agarrón recuerda qué zombi es (id del servidor)', { cliente: got.id, servidor: got.zid });
    await sleep(900);
    const mid = await p.evaluate(() => ({ g: !!GRAB.cur, w: P.wounds.length }));
    ck(mid.g && mid.w === got.w, 'mientras agarra, ese zombi no le hiere aparte', mid);
    for (let i = 0; i < got.need + 1 && await p.evaluate(() => !!GRAB.cur); i++) { await p.mouse.click(450, 150); await sleep(70); }
    ck(await p.evaluate(() => !GRAB.cur && GRAB.stats.free === 1), 'forcejeando se suelta');
    let st = null; for (let i = 0; i < 10; i++) { await sleep(150); st = await ev("(()=>{const z=Z.find(q=>q.id===" + got.zid + ");return z?{stun:+z.stun.toFixed(2),st:z.st}:null})()"); if (st && (st.stun > 0 || st.st === 'down')) break; }
    ck(st && (st.stun > 0 || st.st === 'down'), 'el servidor recibe «ZG» y aturde a ese zombi', st);
  }
  ck(!errs.length, 'sin errores de página', errs.slice(0, 3));
  console.log('fallos:', fails); await b.close();
})().catch(e => { console.log('FAIL excepción', e.message); process.exit(1); });
