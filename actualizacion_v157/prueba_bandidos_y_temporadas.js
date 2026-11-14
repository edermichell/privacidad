// Fase 5 en sala PvP: bandidos, recompensa, comerciantes, ranking y fin de temporada
const { chromium } = require('playwright'); const fs = require('fs'); const URL = 'http://127.0.0.1:18080'; const DATA = '/tmp/srvtest/datos157/salas/SALA1'; const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ck = (ok, m, x) => { console.log(ok ? 'OK  ' : 'FAIL', m, x === undefined ? '' : JSON.stringify(x)); if (!ok) fails++; };
const ev = async js => { const t = await (await fetch(URL + '/admin/eval?sala=SALA1&js=' + encodeURIComponent(js))).text(); try { return JSON.parse(t); } catch (e) { return t; } };
const waitIn = async (p, t = 90) => { for (let i = 0; i < t * 2; i++) { await sleep(500); if (await p.evaluate(() => NET.st === 'playing' && STATE === 'play').catch(() => false)) return true; } return false; };
async function join(ctx) { const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.on('dialog', d => d.accept()); await p.goto(URL + '/juego/'); await p.waitForFunction(() => typeof netJoinWs === 'function'); await p.evaluate(() => { window.__says = []; const o = say; say = function (m) { window.__says.push(String(m)); return o.apply(this, arguments); }; }); await p.evaluate(() => $('bMulti').click()); await p.waitForFunction(() => S137.ok && document.querySelector('[data-room="SALA1"]'), null, { timeout: 30000 }); await p.evaluate(() => document.querySelector('[data-room="SALA1"]').click()); if (!await waitIn(p)) throw new Error('no entra'); await p.evaluate(() => { P.ghost = 1e9; }); return p; }
const uidOf = p => p.evaluate(() => JSON.parse(localStorage.getItem('ur_id')).uid);
const sayHas = (p, re) => p.evaluate(s => window.__says.some(m => new RegExp(s).test(m)), re.source);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] }); const mk = () => b.newContext({ viewport: { width: 800, height: 380 } });
  const C = {}, G = {}, U = {}; for (const k of ['A', 'B', 'C', 'D', 'E']) { C[k] = await mk(); G[k] = await join(C[k]); await sleep(2200); U[k] = await uidOf(G[k]); }
  const sp = await G.A.evaluate(() => [P.x, P.y]); for (const k of ['B', 'C', 'D', 'E']) await G[k].evaluate((s) => { P.x = s[0] + 2 + Math.random() * 3; P.y = s[1] + 1; }, sp); await sleep(3000);
  await ev("(NET.peers.forEach(p=>{p.protUntil=0}),1)");
  const kill = (a, v) => ev("(()=>{const A=NET.peers.find(p=>p.ready&&p.uid==='" + U[a] + "'),V=NET.peers.find(p=>p.ready&&p.uid==='" + U[v] + "');if(!A||!V)return 'falta';return SRV.pvpHurt(V,999,A.rp.name,A)})()");
  const nameA = await ev("NET.peers.find(p=>p.uid==='" + U.A + "').rp.name");
  // ---- bandido ----
  await kill('A', 'B'); await sleep(400); await kill('A', 'C'); await sleep(400); ck(await ev("SRV.isBandit('" + U.A + "')") === 0, 'tras 2 asesinatos todavía no es bandido');
  await kill('A', 'D'); await sleep(1800);
  ck(await ev("SRV.isBandit('" + U.A + "')>0"), 'al 3.er asesinato de inocentes en 24 h, A es BANDIDO');
  ck(await sayHas(G.A, /eres BANDIDO/) && await sayHas(G.E, /BANDIDO: hay recompensa/), 'se le avisa a él y a todos los de la sala');
  await sleep(1500); ck(await G.E.evaluate(n => [...NET.oth.values()].some(r => r.name === n && r.bd === 1), nameA), 'los demás lo ven marcado (nombre naranja «· BANDIDO»)');
  ck(await G.A.evaluate(() => NET.ali && NET.ali.bd > 0), 'su panel de alianza dice que es bandido');
  // ---- comerciantes ----
  const tr = await ev("(()=>{const n=NPCS.find(q=>q.st!=='dead'&&NT[q.type]&&NT[q.type].shop);return n?n.id:null})()");
  if (tr === null) console.log('SKIP no hay comerciantes en este mundo'); else {
    await G.A.evaluate(id => { NET.dlgWait = id; netSend({ t: 'NO', id }); }, tr); await G.E.evaluate(id => { NET.dlgWait = id; netSend({ t: 'NO', id }); }, tr); await sleep(1500);
    ck(await sayHas(G.A, /No hago tratos con bandidos/), 'el comerciante no atiende al bandido'); ck(!(await sayHas(G.E, /No hago tratos/)), 'a un jugador normal sí lo atiende'); }
  // ---- recompensa ----
  const posA = await ev("(()=>{const p=NET.peers.find(q=>q.uid==='" + U.A + "');return [p.rp.nx,p.rp.ny]})()"); const fl0 = await ev("floorItems.filter(f=>Math.hypot(f.x-" + posA[0] + ",f.y-" + posA[1] + ")<2).length");
  await kill('E', 'A'); await sleep(1500); const fl1 = await ev("floorItems.filter(f=>Math.hypot(f.x-" + posA[0] + ",f.y-" + posA[1] + ")<2).length");
  ck(await sayHas(G.E, /Cobraste la recompensa/), 'quien mata al bandido cobra la recompensa'); ck(fl1 - fl0 >= 5 + 2, 'su cuerpo deja el botín normal MÁS la recompensa', { antes: fl0, despues: fl1 });
  ck(await ev("SRV.isBandit('" + U.A + "')") === 0, 'al morir deja de ser bandido');
  ck(await ev("(SRV.ali.m['" + U.E + "']||[]).length") === 0, 'matar a un bandido no cuenta como asesinato');
  // ---- defensa propia y traidores ----
  G.B = await join(C.B); await sleep(2500); G.C = await join(C.C); await sleep(2500); await ev("(NET.peers.forEach(p=>{p.protUntil=0}),1)");
  await ev("(()=>{const e=NET.peers.find(p=>p.uid==='" + U.E + "');e.atkBy=e.atkBy||{};e.atkBy['" + U.B + "']=performance.now();SRV.ali.t['" + U.C + "']=Date.now()+1e6;return 1})()");
  await kill('E', 'B'); await sleep(300); await kill('E', 'C'); await sleep(800);
  ck(await ev("(SRV.ali.m['" + U.E + "']||[]).length") === 0, 'matar en defensa propia o a un traidor no cuenta como asesinato');
  // ---- ranking ----
  const top = await ev("SRV.seasonTop()"); ck(top[0] && top[0].nombre && top.find(q => q.bajas === 3) && top.find(q => q.bajas === 3).nombre === nameA, 'ranking de la temporada: A con 3 bajas', top.slice(0, 3));
  ck(await G.E.evaluate(() => NET.ali && Array.isArray(NET.ali.top) && NET.ali.top.length >= 1 && NET.ali.tf > Date.now()), 'el panel recibe el ranking y el fin de temporada', await G.E.evaluate(() => NET.ali && [NET.ali.top, NET.ali.tf]));
  const L = await (await fetch(URL + '/salas')).json(); const s1 = L.salas.find(s => s.id === 'SALA1'); ck(s1.temporada > Date.now() + 13 * 864e5 && s1.temporada < Date.now() + 14.1 * 864e5, 'la lista de salas muestra el fin de temporada (14 días)', s1.temporada);
  // ---- fin de temporada ----
  const tf = DATA + '/temporada.json'; fs.writeFileSync(tf, JSON.stringify({ inicio: Date.now() - 14 * 864e5 + 30 * 60000, avisos: {} })); await sleep(7000);
  ck(await sayHas(G.E, /termina en unas 24 horas/) && await sayHas(G.E, /termina en 1 hora/), 'avisos de fin de temporada (24 h y 1 h) a los jugadores conectados');
  const seed0 = await ev("SEED"); fs.writeFileSync(tf, JSON.stringify({ inicio: Date.now() - 15 * 864e5, avisos: { d1: 1, h1: 1 } }));
  let seed1 = seed0; for (let i = 0; i < 40 && (seed1 === seed0 || typeof seed1 !== 'number'); i++) { await sleep(2000); const st = await ev("({s:SEED,p:STATE,r:NET.role})").catch(() => null); seed1 = st && st.p === 'play' && st.r === 'host' ? st.s : seed0; }
  ck(await sayHas(G.E, /Fin de la temporada/), 'al terminar se avisa «¡Fin de la temporada!»');
  ck(typeof seed1 === 'number' && seed1 !== seed0, 'la sala arranca con un mundo nuevo', { antes: seed0, despues: seed1 });
  let hist = []; try { hist = JSON.parse(fs.readFileSync(DATA + '/temporadas.json', 'utf8')); } catch (e) { } ck(hist.length === 1 && hist[0].top.length >= 1 && hist[0].top.find(q => q.nombre === nameA), 'el ranking de la temporada queda guardado en temporadas.json', hist[0] && hist[0].top.slice(0, 2));
  ck(!fs.existsSync(DATA + '/alianzas.json') || JSON.parse(fs.readFileSync(DATA + '/alianzas.json', 'utf8')).g.length === 0, 'alianzas, traidores, bandidos y bajas empiezan de cero');
  const t2 = JSON.parse(fs.readFileSync(tf, 'utf8')); ck(Date.now() - t2.inicio < 120000, 'empieza una temporada nueva de 14 días');
  console.log('fallos:', fails); await b.close(); process.exit(0);
})().catch(e => { console.log('FALLO', e.stack || e.message); process.exit(1); });
