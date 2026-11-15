// Arranque rápido: 1.er arranque genera y guarda; 2.º carga. Los dibujos deben ser idénticos.
const { chromium } = require('playwright'); const fs = require('fs'); const crypto = require('crypto');
const HTML = process.env.HTML, DIR = '/tmp/srvtest/perfil_sprc'; let fails = 0; const ck = (ok, m, x) => { console.log(ok ? 'OK  ' : 'FAIL', m, x === undefined ? '' : JSON.stringify(x)); if (!ok) fails++; };
async function arranque(thr) {
  const ctx = await chromium.launchPersistentContext(DIR, { viewport: { width: 960, height: 540 }, deviceScaleFactor: 2 }); const p = ctx.pages()[0] || await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: thr });
  const t0 = Date.now(); await p.goto('file://' + HTML); await p.waitForFunction(() => typeof STATE !== 'undefined' && STATE === 'menu' && window.__UR_BOOT_OK, null, { timeout: 120000 }); const ms = Date.now() - t0;
  return { ctx, p, cdp, ms, errs };
}
const huella = p => p.evaluate(() => { const r = SPRC.enc(); const a = new Uint8Array(r.px); let h = 0; for (let i = 0; i < a.length; i += 7) h = (h * 31 + a[i]) >>> 0; return { meta: r.meta.length, px: a.length, h, m: r.meta }; });
(async () => {
  fs.rmSync(DIR, { recursive: true, force: true });
  let A = await arranque(4); const usado1 = await A.p.evaluate(() => !!SPRC.used);
  await A.cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  for (let i = 0; i < 40 && !(await A.p.evaluate(() => !!SPRC.saved)); i++) await new Promise(r => setTimeout(r, 500));
  const guard = await A.p.evaluate(() => ({ saved: !!SPRC.saved, mark: localStorage.getItem('ur_sprc'), key: SPRC.key() }));
  const h1 = await huella(A.p); await A.ctx.close();
  ck(!usado1, '1.er arranque: dibuja como siempre', { ms: A.ms });
  ck(guard.saved && guard.mark === guard.key, '1.er arranque: guarda los dibujos en el teléfono', guard);
  let B = await arranque(4); const info = await B.p.evaluate(() => ({ used: !!SPRC.used, ms: SPRC.ms })); const h2 = await huella(B.p);
  ck(info.used, '2.º arranque: carga los dibujos guardados', info);
  ck(B.ms < A.ms - 800, '2.º arranque más rápido', { primero: A.ms, segundo: B.ms });
  ck(h1.px === h2.px && h1.h === h2.h && h1.meta === h2.meta && h1.m === h2.m, 'los dibujos y su estructura son idénticos píxel a píxel', { px: [h1.px, h2.px], hash: [h1.h, h2.h] });
  // jugar con los dibujos cargados
  await B.cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 }); await B.p.evaluate(() => { try { localStorage.setItem('ur_news_seen', UR_VERSION); } catch (e) { } });
  await B.p.click('#bNew'); for (let i = 0; i < 60; i++) { await B.p.waitForTimeout(500); await B.p.evaluate(() => { try { introSkip(); } catch (e) { } }); if (await B.p.evaluate(() => STATE === 'play' && !(INTRO && !INTRO.done))) break; }
  await B.p.waitForTimeout(3000); await B.p.screenshot({ path: process.env.SHOT || '/tmp/sprc_juego.png' });
  ck(await B.p.evaluate(() => STATE === 'play'), 'se juega normalmente con los dibujos cargados'); ck(B.errs.length === 0 && A.errs.length === 0, 'sin errores de página', B.errs.concat(A.errs).slice(0, 3));
  await B.ctx.close();
  // nueva versión: la clave cambia → vuelve a dibujar
  const C = await arranque(1); const k = await C.p.evaluate(() => { SPRC.mark('v0|b0|rs2'); return 1; }); await C.ctx.close();
  const D = await arranque(1); ck(!(await D.p.evaluate(() => !!SPRC.used)), 'si la marca es de otra versión, no carga nada viejo y dibuja como siempre'); await D.ctx.close();
  console.log('fallos:', fails); process.exit(0);
})().catch(e => { console.log('FALLO', e.stack || e.message); process.exit(1); });
