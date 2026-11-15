const { chromium, devices } = require('playwright'); const HTML = process.env.HTML; const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ck = (ok, m, x) => { console.log(ok ? 'OK  ' : 'FAIL', m, x === undefined ? '' : JSON.stringify(x)); if (!ok) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  for (const [w, h, touch] of [[1032, 600, false], [800, 360, true], [640, 320, true], [740, 360, true], [915, 412, true], [1280, 800, false]]) {
    const c = await b.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + HTML); await p.waitForFunction(() => window.__UR_BOOT_OK, null, { timeout: 60000 }); await sleep(500);
    await p.evaluate(() => { $('bNew').click(); }); await sleep(1500);
    await p.evaluate(() => { const b = document.querySelector('#nmGo, #bStart, [data-go]'); if (b) b.click(); }); 
    await p.waitForFunction(() => STATE === 'play', null, { timeout: 60000 }).catch(() => { }); await sleep(2500);
    for (let k = 0; k < 20; k++) { const on = await p.evaluate(() => { const e = document.getElementById('introc'); return !!(e && e.offsetParent !== null && getComputedStyle(e).display !== 'none' && !e.hidden); }); if (!on) break; await p.keyboard.press('Space'); await sleep(500); }
    await sleep(800); await p.evaluate(() => setPause(true)); await sleep(900);
    const top = await p.evaluate(() => { const R = document.querySelector('#pause .pz-b').getBoundingClientRect(), e = document.elementFromPoint(R.left + R.width / 2, R.top + R.height / 2); return !!(e && e.closest('#pause')); }); ck(top, w + '×' + h + ': el menú de pausa está encima (nada lo tapa)');
    const r = await p.evaluate(() => { const pz = $('pause'), b = pz.querySelector('.pz-b'), q = $('bQuit').getBoundingClientRect(), R = pz.getBoundingClientRect(); return { pz: [Math.round(R.top), Math.round(R.bottom)], sh: b.scrollHeight, ch: b.clientHeight, qb: Math.round(q.bottom), vh: innerHeight, more: $('pzMore').classList.contains('on') }; });
    const fits = r.pz[0] >= 0 && r.pz[1] <= r.vh;
    ck(fits, w + '×' + h + ': el menú cabe en la pantalla', r);
    if (r.sh > r.ch + 2) {
      ck(r.more, w + '×' + h + ': sale «DESLIZA PARA VER MÁS»');
      const box = await p.evaluate(() => { const R = document.querySelector('#pause .pz-b').getBoundingClientRect(); return [R.left + R.width / 2, R.top + R.height / 2]; });
      await p.mouse.move(box[0], box[1]); for (let k = 0; k < 6; k++) { await p.mouse.wheel(0, 80); await sleep(80); }
      const ta = await p.evaluate(() => getComputedStyle(document.querySelector('#pause .pz-b')).touchAction); ck(ta === 'pan-y', w + '×' + h + ': la lista admite deslizar con el dedo (touch-action: pan-y)', ta);
      await sleep(400);
      const r2 = await p.evaluate(() => { const q = $('bQuit').getBoundingClientRect(), B = document.querySelector('#pause .pz-b').getBoundingClientRect(); return { st: document.querySelector('#pause .pz-b').scrollTop, q: [Math.round(q.top), Math.round(q.bottom)], box: [Math.round(B.top), Math.round(B.bottom)], more: $('pzMore').classList.contains('on') }; });
      ck(r2.st > 0 && r2.q[1] <= r2.box[1] + 1 && r2.q[0] >= r2.box[0] - 1 && !r2.more, w + '×' + h + ': ' + 'deslizando' + ' se llega a «Guardar y salir» y el aviso se va', r2);
      await p.screenshot({ path: '/tmp/srvtest/shots170/pz_' + w + 'x' + h + '.png' });
    } else ck(r.qb <= r.vh && !r.more, w + '×' + h + ': todo cabe sin deslizar (sin aviso)', r);
    const q = await p.evaluate(() => { const R = $('bQuit').getBoundingClientRect(); return [R.left + R.width / 2, R.top + R.height / 2]; });
    if (touch) await p.touchscreen.tap(q[0], q[1]); else await p.mouse.click(q[0], q[1]); await sleep(1500);
    ck(await p.evaluate(() => STATE === 'menu'), w + '×' + h + ': «Guardar y salir al menú» funciona');
    ck(!errs.length, w + '×' + h + ': sin errores', errs.slice(0, 2)); await c.close();
  }
  console.log(fails ? 'fallos: ' + fails : 'TODO OK'); await b.close();
})();
