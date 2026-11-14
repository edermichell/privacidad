// Fase 5 en una sala NORMAL: botín que reaparece y bases protegidas con los dueños desconectados. CLIENT: html (file://) o vacío para el del servidor
const { chromium } = require('playwright'); const URL = 'http://127.0.0.1:18080'; const CLIENT = process.env.CLIENT || ''; const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ck = (ok, m, x) => { console.log(ok ? 'OK  ' : 'FAIL', m, x === undefined ? '' : JSON.stringify(x)); if (!ok) fails++; };
const ev = async js => { const t = await (await fetch(URL + '/admin/eval?sala=SALA1&js=' + encodeURIComponent(js))).text(); try { return JSON.parse(t); } catch (e) { return t; } };
const waitIn = async (p, t = 90) => { for (let i = 0; i < t * 2; i++) { await sleep(500); if (await p.evaluate(() => NET.st === 'playing' && STATE === 'play').catch(() => false)) return true; } return false; };
async function join(ctx) { await ctx.addInitScript(u => { try { localStorage.setItem('ur_srv', u); } catch (e) { } }, URL); const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.on('dialog', d => d.accept()); await p.goto(CLIENT ? 'file://' + CLIENT : URL + '/juego/'); await p.waitForFunction(() => typeof netJoinWs === 'function'); await p.evaluate(() => { window.__says = []; const o = say; say = function (m) { window.__says.push(String(m)); return o.apply(this, arguments); }; }); await p.evaluate(() => $('bMulti').click()); await p.waitForFunction(() => S137.ok && document.querySelector('[data-room="SALA1"]'), null, { timeout: 30000 }); await p.evaluate(() => document.querySelector('[data-room="SALA1"]').click()); if (!await waitIn(p)) throw new Error('no entra'); await p.evaluate(() => { P.ghost = 1e9; }); return p; }
const uidOf = p => p.evaluate(() => JSON.parse(localStorage.getItem('ur_id')).uid);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] }); const mk = () => b.newContext({ viewport: { width: 800, height: 380 } });
  const c1 = await mk(), c2 = await mk(); const G1 = await join(c1); await sleep(2500); const G2 = await join(c2); await sleep(2500); const u1 = await uidOf(G1);
  // ---------- A · botín que reaparece ----------
  const me = await G1.evaluate(() => [P.x, P.y]);
  const pick = await ev("(()=>{const me=" + JSON.stringify(me) + ";let far=null,near=null;for(const [i,c] of containers){if(i>=TRUNK_BASE||!c||BLD.pc.has(i)||LK.codes.has(i))continue;const x=i%W,y=(i/W)|0,d=Math.max(Math.abs(x-me[0]),Math.abs(y-me[1]));if(!far&&d>60)far=i;if(!near&&d<12&&d>1)near=i;if(far&&near)break;}return [far,near,containers.size]})()");
  ck(pick[0] !== null, 'hay contenedores (lejos) para probar', pick);
  const [far, near] = pick;
  // el invitado conoce el contenedor lejano como «vacío»
  await ev("(()=>{for(const i of [" + far + (near !== null ? "," + near : "") + "]){containers.get(i).items=[];SRV.lootEmpty.set(i,Date.now()-4*3600e3);netSend({t:'C',i,items:[]})}return 1})()"); await sleep(1200);
  ck(await G1.evaluate(i => { const c = containers.get(i); return !!c && Array.isArray(c.items) && c.items.length === 0; }, far), 'el invitado ve el mueble lejano como vacío (ya registrado)');
  const n = await ev("SRV.lootTick()"); await sleep(1200);
  ck(n >= 1 && await ev("containers.get(" + far + ").items===null"), 'tras 3 h vacío y sin nadie cerca, el mueble vuelve a tener botín (se puede registrar)', n);
  ck(await G1.evaluate(i => { const c = containers.get(i); return !!c && c.items === null; }, far), 'el invitado recibe el cambio: lo puede volver a registrar');
  if (near !== null) ck(await ev("Array.isArray(containers.get(" + near + ").items)&&containers.get(" + near + ").items.length===0"), 'un mueble vacío CERCA de un jugador no se repone (no aparece botín delante de nadie)');
  const lk = await ev("(()=>{let k=null;for(const [i,c] of containers){if(i>=TRUNK_BASE||!c||i==" + far + (near !== null ? "||i==" + near : "") + ")continue;k=i;break;}containers.get(k).items=[];LK.codes.set(k,{c:'1111',u:'zzzzzzzzzzzz'});SRV.lootEmpty.set(k,Date.now()-9*3600e3);SRV.lootTick();const r=Array.isArray(containers.get(k).items);LK.codes.delete(k);return r})()");
  ck(lk === true, 'un mueble con candado no se repone (es de alguien)');
  const fresh = await ev("(()=>{let k=null;for(const [i,c] of containers){if(i>=TRUNK_BASE||!c||LK.codes.has(i)||BLD.pc.has(i)||i==" + far + ")continue;const x=i%W,y=(i/W)|0;if(Math.abs(x-" + me[0] + ")>60){k=i;break;}}containers.get(k).items=[];SRV.lootEmpty.delete(k);SRV.lootTick();const a=Array.isArray(containers.get(k).items);return [a,SRV.lootEmpty.has(k)]})()");
  ck(fresh[0] === true && fresh[1] === true, 'un mueble recién vaciado no se repone al momento: empieza a contar', fresh);
  // ---------- B · bases protegidas ----------
  const gp = await G2.evaluate(() => [Math.floor(P.x), Math.floor(P.y)]);
  const tgt = await ev("(()=>{const g=" + JSON.stringify(gp) + ";for(let r=1;r<6;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const x=g[0]+dx,y=g[1]+dy;if(!inb(x,y))continue;const i=idx(x,y);if(to[i]||tb[i]||solidTile(x,y))continue;for(const [ox,oy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+ox,yy=y+oy;if(inb(xx,yy)&&!to[idx(xx,yy)]&&!solidTile(xx,yy)&&!(xx===x&&yy===y)){to[i]=O_WALL;BLD.pc.set(i,{k:'p',c:'prueba',i,hp:420});return {i,sx:xx+.5,sy:yy+.5,raid:lkRaidable(i)}}}}return null})()");
  ck(!!tgt, 'hay una pared/puerta de casa asaltable cerca para la prueba', tgt);
  if (tgt) {
    await G2.evaluate(t => { P.x = t.sx; P.y = t.sy; snapCam && snapCam(); }, tgt); await sleep(1500);
    await ev("(LK.codes.set(" + tgt.i + "+1,{c:'4321',u:'" + u1 + "'}),LK.rh.delete(" + tgt.i + "),1)");
    const hp = () => ev("LK.rh.has(" + tgt.i + ")?LK.rh.get(" + tgt.i + "):-1");
    const hit = async () => { await G2.evaluate(i => netSend({ t: 'RD', i, d: 30 }), tgt.i); await sleep(400); };
    await hit(); const h1 = await hp(); ck(h1 > 0, 'con el dueño CONECTADO la base se puede asaltar (el golpe hace daño)', h1);
    await G1.close(); await sleep(2500); await hit(); const h2 = await hp(); ck(h2 < h1, 'recién desconectado (menos de 10 min) aún se puede asaltar (no sirve salirse para salvarla)', { antes: h1, despues: h2 });
    await ev("(SRV.seen.set('" + u1 + "',Date.now()-11*60000),1)"); await hit(); await hit(); const h3 = await hp(); ck(h3 === h2, 'con el dueño desconectado más de 10 min: el golpe NO hace daño', { antes: h2, despues: h3 });
    ck(await G2.evaluate(() => window.__says.some(m => /Base protegida/.test(m))), 'y el asaltante recibe el aviso «Base protegida»');
    const fz = await G2.evaluate(i => lkCall({ t: 'LKX', i, how: 'crowbar' }), tgt.i + 1); ck(!fz.ok && /protegida/.test(fz.m || ''), 'tampoco se puede forzar su candado', fz);
    const G1b = await join(c1); await sleep(2500); await G2.evaluate(t => { P.x = t.sx; P.y = t.sy; }, tgt); await sleep(1200); await hit(); const h4 = await hp(); ck(h4 < h3, 'cuando el dueño vuelve a conectarse, la protección se quita', { antes: h3, despues: h4 });
    await ev("(LK.codes.delete(" + tgt.i + "+1),1)");
    ck(!G1b.errs.length && !G2.errs.length, 'sin errores de página', [G1b.errs.slice(0, 1), G2.errs.slice(0, 1)]);
  }
  console.log('fallos:', fails); await b.close(); process.exit(0);
})().catch(e => { console.log('FALLO', e.stack || e.message); process.exit(1); });
