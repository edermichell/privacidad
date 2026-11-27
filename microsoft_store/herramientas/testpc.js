// Edición PC (PWA): sin anuncios ni compras, manifest + service worker, funciona sin conexión, ventana de escritorio
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const DIR = process.env.W; const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (c, m, x) => { console.log((c ? 'OK   ' : 'FAIL ') + m + (x !== undefined ? ' ' + JSON.stringify(x) : '')); if (!c) fails++; };
const MT = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(DIR, p); if (!f.startsWith(DIR) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': MT[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
(async () => {
  await new Promise(r => srv.listen(18090, r));
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); const pops = []; ctx.on('page', np => pops.push(np.url()));
  await p.goto('http://localhost:18090/'); await p.waitForFunction(() => typeof PCED === 'object', null, { timeout: 30000 });
  let r = await p.evaluate(async () => { const m = document.querySelector('link[rel=manifest]'); const j = await (await fetch(m.href)).json(); return { pc: PCED.on, name: j.name, icons: j.icons.length, mask: j.icons.some(i => i.purpose === 'maskable'), start: j.start_url, disp: j.display }; });
  ok(r.pc && r.name === 'Último Refugio' && r.icons >= 8 && r.mask, 'manifest válido con iconos (incluido maskable) y edición PC activa', r);
  r = await p.evaluate(async () => { for (let i = 0; i < 40; i++) { const g = await navigator.serviceWorker.getRegistration(); if (g && g.active) return true; await new Promise(q => setTimeout(q, 250)); } return false; });
  ok(r, 'el service worker se registra y queda activo');
  r = await p.evaluate(() => ({ shop: $('bShop').textContent.trim(), shopP: $('bShopP').textContent.trim(), inter: monInterDue(), help: document.querySelector('.hp[data-t="5"]').textContent }));
  ok(/^★CAJAS/.test(r.shop) && /^★CAJAS/.test(r.shopP) && !r.inter && !/ver un anuncio|compras:/i.test(r.help), 'menú y ayuda sin tienda ni anuncios; nunca hay intersticial', r);
  // partida
  await p.evaluate(() => { OPT.world.seed = 'pc1'; }); await p.click('#bNew'); await sleep(2500); await p.keyboard.press('Space'); await sleep(2500);
  r = await p.evaluate(() => STATE); ok(r === 'play', 'empieza la partida', r);
  // tienda → cajas y trajes
  r = await p.evaluate(async () => { openShop(); const el = $('shop'); const t = el.textContent; const o = { head: el.querySelector('.ph').textContent, prods: !!el.querySelector('.prods'), restore: !!el.querySelector('[data-sh="restore"]'), funda: !!el.querySelector('[data-id="fundador"]'), anuncio: /ver anuncio|anuncio completo|demo|google play|MXN/i.test(t), locked: el.querySelectorAll('.sk.lock').length };
    const c0 = MS.crates; MS.adT = 0; MS.adN = 0; adCrate(); await new Promise(q => setTimeout(q, 300)); o.crate = MS.crates - c0; o.ov = !$('adov').hidden; o.msg = $('shmsg').textContent;
    adCrate(); await new Promise(q => setTimeout(q, 100)); o.wait = $('shmsg').textContent; closeShop(); return o; });
  ok(/CAJAS Y TRAJES/.test(r.head) && /EDICIÓN PC/.test(r.head) && !r.prods && !r.restore && !r.funda && !r.anuncio && r.locked === 0, 'la tienda es «Cajas y trajes»: sin compras, sin anuncios, trajes premium incluidos', r);
  ok(r.crate === 1 && !r.ov && /Espera \d+ s para la siguiente recompensa/.test(r.wait), 'caja extra al momento (sin anuncio simulado) y con el mismo tiempo de espera', r);
  // privacidad
  r = await p.evaluate(() => { const o = window.open; let u = null; window.open = x => { u = x; return null; }; try { openShop(); document.querySelector('[data-sh="privacy"]').click(); } finally { window.open = o; closeShop(); } return u; });
  ok(/^https:\/\/edermichell\.github\.io\/privacidad/.test(r || ''), 'Privacidad abre la política pública', r);
  // morir y revivir
  r = await p.evaluate(async () => { P.ghost = 0; P.wind = 0; die('prueba'); for (let i = 0; i < 80 && $('death').hidden; i++) await new Promise(q => setTimeout(q, 100)); const lab = $('bRevive').textContent; $('bRevive').click(); await new Promise(q => setTimeout(q, 400)); return { lab, st: STATE, ov: !$('adov').hidden, hp: P.hp }; });
  ok(/REVIVIR \(UNA VEZ POR PARTIDA\)/.test(r.lab) && r.st === 'play' && !r.ov, 'al morir: «Revivir (una vez por partida)» sin anuncio', r);
  // sin conexión: recargar con la red cortada
  await ctx.setOffline(true); await p.reload(); await sleep(2500);
  r = await p.evaluate(() => ({ t: document.title, pc: typeof PCED === 'object' && PCED.on, menu: !$('menu').hidden })).catch(e => ({ err: e.message }));
  ok(r.pc && r.menu, 'sin conexión el juego abre igual (copia en caché)', r);
  await ctx.setOffline(false);
  await p.screenshot({ path: (process.env.OUT || '.') + '/pc_menu_1366.png' });
  ok(!errs.length, 'sin errores de página', errs.slice(0, 3));
  console.log('fallos:', fails); await b.close(); srv.close();
})().catch(e => { console.log('FAIL excepción', e.message); process.exit(1); });
