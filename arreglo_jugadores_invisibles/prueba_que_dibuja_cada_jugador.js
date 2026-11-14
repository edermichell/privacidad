// 3 jugadores en la misma sala: ¿qué DIBUJA de verdad cada cliente? CLIENTS = lista separada por comas de html (file://) o «srv» para el del servidor
const { chromium } = require('playwright'); const URL = process.env.SRVURL || 'http://127.0.0.1:18080'; const CL = (process.env.CLIENTS || 'srv,srv,srv').split(','); const SHOT = process.env.SHOT || ''; const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ck = (ok, m, x) => { console.log(ok ? 'OK  ' : 'FAIL', m, x === undefined ? '' : JSON.stringify(x)); if (!ok) fails++; };
const waitIn = async (p, t = 90) => { for (let i = 0; i < t * 2; i++) { await sleep(500); if (await p.evaluate(() => NET.st === 'playing' && STATE === 'play').catch(() => false)) return true; } return false; };
async function join(b, room, cl) { const ctx = await b.newContext({ viewport: { width: 900, height: 420 } }); await ctx.addInitScript(u => { try { localStorage.setItem('ur_srv', u); } catch (e) { } }, URL); const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto(cl === 'srv' ? URL + '/juego/' : 'file://' + cl); await p.waitForFunction(() => typeof netJoinWs === 'function'); await p.evaluate(() => $('bMulti').click()); await p.waitForFunction(r => S137.ok && document.querySelector('[data-room="' + r + '"]'), room, { timeout: 30000 }); await p.evaluate(r => document.querySelector('[data-room="' + r + '"]').click(), room); if (!await waitIn(p)) throw new Error('no entra: ' + await p.evaluate(() => NET.err || NET.st)); await p.evaluate(() => { P.ghost = 1e9; }); return p; }
const drawn = p => p.evaluate(() => { const o = []; const f = drawRemote; drawRemote = function (R) { o.push({ n: R.name, x: +(+R.x).toFixed(1), y: +(+R.y).toFixed(1), skin: !!(R.sp && R.sp.skin) }); return f.apply(this, arguments); }; try { render(.016); } finally { drawRemote = f; } return { ver: (document.querySelector('.mfoot span') || {}).textContent.split('·')[0].trim(), yo: [+P.x.toFixed(1), +P.y.toFixed(1)], dib: o }; });
const near = (a, b, t) => Math.hypot(a[0] - b[0], a[1] - b[1]) <= (t || 1.2);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] }); const G = [];
  for (let i = 0; i < CL.length; i++) { G.push(await join(b, 'SALA1', CL[i])); await sleep(3000); }
  const spot = await G[0].evaluate(() => { for (let y = 20; y < H - 20; y += 3) for (let x = 20; x < W - 40; x += 3) { let ok = true; for (let dx = 0; dx < 14 && ok; dx++) { const xx = x + dx; if (!inb(xx, y) || to[idx(xx, y)] || tb[idx(xx, y)] || tg[idx(xx, y)] !== G_ROAD) ok = false; } if (ok) return [x, y]; } return null; });
  const POS = [[spot[0] + .5, spot[1] + .5], [spot[0] + 3.5, spot[1] + .5], [spot[0] + 8.5, spot[1] + .5]];
  for (let i = 0; i < G.length; i++) await G[i].evaluate(s => { P.x = s[0]; P.y = s[1]; snapCam && snapCam(); }, POS[i]); await sleep(4000);
  const D = []; for (let i = 0; i < G.length; i++) { D.push(await drawn(G[i])); console.log('jugador ' + (i + 1) + ' (' + D[i].ver + ') dibuja:', JSON.stringify(D[i].dib)); }
  for (let i = 0; i < G.length; i++) {
    const nuevo = D[i].ver === 'v14.0.1' || parseFloat(D[i].ver.replace('v', '')) >= 15.5, otros = POS.filter((_, j) => j !== i), dib = D[i].dib;
    if (nuevo) { ck(otros.every(o => dib.some(d => near([d.x, d.y], o) && d.skin)), 'jugador ' + (i + 1) + ' (' + D[i].ver + '): dibuja a TODOS los demás, cada uno en su sitio'); ck(dib.every(d => /^Jugador \d+$/.test(d.n)), 'jugador ' + (i + 1) + ': con su nombre («Jugador N»), sin «Anfitrión»', dib.map(d => d.n)); ck(dib.length === otros.length, 'jugador ' + (i + 1) + ': exactamente uno por jugador', dib.length); }
    else { const nearest = otros.slice().sort((a, b2) => Math.hypot(a[0] - POS[i][0], a[1] - POS[i][1]) - Math.hypot(b2[0] - POS[i][0], b2[1] - POS[i][1]))[0]; ck(dib.length > 0 && dib.every(d => near([d.x, d.y], nearest) && d.skin), 'jugador ' + (i + 1) + ' (app antigua ' + D[i].ver + '): con el paliativo ve al jugador MÁS CERCANO en su sitio real', { cercano: nearest, dib: dib.slice(0, 2) }); }
  }
  // movimiento: el jugador 2 camina y los demás lo ven moverse
  if (G.length > 1) { const x0 = (await G[1].evaluate(() => P.x)); await G[1].evaluate(() => { P.x += 1.5; P.y += 1; }); await sleep(2500); const d0 = await drawn(G[0]); const want = [x0 + 1.5, POS[1][1] + 1]; ck(d0.dib.some(d => near([d.x, d.y], want, .8)), 'cuando el jugador 2 se mueve, el jugador 1 lo ve en la posición nueva', { quiere: want, dib: d0.dib.map(d => [d.x, d.y]) }); }
  if (SHOT) for (let i = 0; i < G.length; i++) await G[i].screenshot({ path: SHOT + '_' + (i + 1) + '.png' });
  ck(!G.some(p => p.errs.length), 'sin errores de página', G.map(p => p.errs.slice(0, 1)));
  console.log('fallos:', fails); await b.close(); process.exit(0);
})().catch(e => { console.log('FALLO', e.message); process.exit(1); });
