const { chromium } = require('playwright'); const HTML = process.env.GAME_HTML; const SHOTS = process.env.SHOTS || '/tmp'; let fails = 0; const ck = (ok, m, x) => { console.log(ok ? 'OK  ' : 'FAIL', m, x === undefined ? '' : JSON.stringify(x)); if (!ok) fails++; };
const bridge = (mode) => () => {};
async function open(b, o) {
  o = o || {}; const ctx = o.ctx || await b.newContext({ viewport: o.vp || { width: 800, height: 360 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(([existing, native, mode]) => {
    if (existing && !sessionStorage.getItem('__init')) { sessionStorage.setItem('__init', '1'); try { localStorage.setItem('ultimo_refugio_opt', '{}'); } catch (e) { } }
    if (native) { window.__calls = []; window.AndroidMonet = { checkUpdate() { window.__calls.push('check'); setTimeout(() => window.__urUpd(mode === 'avail' ? { avail: true, code: 162, days: 3 } : mode === 'err' ? { err: 1 } : { avail: false, code: 0 }), 200); }, startUpdate() { window.__calls.push('start'); }, sync() { }, privacy() { }, setPreferredFps() { }, vibrate() { }, peekCredits() { return 0; }, ackCredits() { } }; }
  }, [!!o.existing, !!o.native, o.mode || 'none']);
  const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); await p.goto('file://' + HTML + (o.q || '')); await p.waitForTimeout(o.wait || 1000); return p;
}
const vis = (p, id) => p.evaluate(i => { const e = document.getElementById(i); return !!e && !e.hidden && getComputedStyle(e).display !== 'none'; }, id);
(async () => {
  const b = await chromium.launch();
  // 1 instalación nueva
  { const p = await open(b, { wait: 2500 }); ck(!await vis(p, 'updm'), 'instalación nueva: el panel NO se abre solo'); ck(await p.evaluate(() => localStorage.getItem('ur_news_seen')) === '17.0', 'anota la versión como vista'); ck(!await vis(p, 'newsDot'), 'sin punto rojo'); ck(!await vis(p, 'updBar'), 'sin aviso (no es la app Android)');
    await p.click('#bNews'); ck(await vis(p, 'updm'), 'botón NOVEDADES abre el panel'); const txt = await p.evaluate(() => document.getElementById('updList').innerText); ck(/v15\.7/.test(txt) && /TU VERSIÓN/.test(txt) && /v14\.8/.test(txt) && /960/.test(txt), 'lista las versiones', txt.slice(0, 80)); ck(/última versión/.test(await p.evaluate(() => document.getElementById('updMsg').textContent)), 'en el navegador dice «última versión»', await p.evaluate(() => document.getElementById('updMsg').textContent));
    await p.screenshot({ path: SHOTS + '/upd_panel.png' }); await p.keyboard.press('Escape'); ck(!await vis(p, 'updm'), 'Esc cierra'); await p.click('#bNews'); await p.click('#bUpdX'); ck(!await vis(p, 'updm'), 'LISTO cierra');
    await p.click('#bNews'); await p.mouse.click(5, 5); ck(!await vis(p, 'updm'), 'tocar fuera cierra');
    // Ajustes -> Datos
    await p.click('#bSet'); await p.click('#stt button[data-t="4"]'); ck(await vis(p, 'bNewsS'), 'fila «Novedades y actualización» en Ajustes → Datos'); await p.click('#bNewsS'); ck(await vis(p, 'updm') && await vis(p, 'setm'), 'abre sobre Ajustes'); const z = await p.evaluate(() => [getComputedStyle(document.getElementById('updm')).zIndex, getComputedStyle(document.getElementById('setm')).zIndex]); ck(+z[0] > +z[1], 'z-index por encima', z); await p.keyboard.press('Escape'); ck(!await vis(p, 'updm') && await vis(p, 'setm'), 'Esc cierra solo el panel, Ajustes sigue');
    ck(!p.errs.length, 'sin errores (1)', p.errs.slice(0, 2)); await p.context().close(); }
  // 2 jugador que actualiza
  { const ctx = await b.newContext({ viewport: { width: 800, height: 360 } }); const p = await open(b, { ctx, existing: true, wait: 3000 }); ck(await vis(p, 'updm'), 'jugador existente: el panel se abre solo tras actualizar'); ck(await p.evaluate(() => localStorage.getItem('ur_news_seen')) === '17.0', 'queda anotado'); await p.screenshot({ path: SHOTS + '/upd_auto.png' });
    await p.reload(); await p.waitForTimeout(3000); ck(!await vis(p, 'updm'), 'no se vuelve a abrir en el siguiente arranque'); ck(!await vis(p, 'newsDot'), 'sin punto'); 
    // versión vista antigua -> punto rojo + abre
    await p.evaluate(() => localStorage.setItem('ur_news_seen', '14.0')); await p.reload(); await p.waitForTimeout(3000); ck(await vis(p, 'updm'), '«visto 14.0» → vuelve a abrir'); await p.close(); await ctx.close(); }
  // 3 Android: hay actualización
  { const ctx = await b.newContext({ viewport: { width: 800, height: 360 } }); const p = await open(b, { ctx, native: true, mode: 'avail', wait: 4000 }); const st = await p.evaluate(() => [UPD.st, UPD.code, window.__calls.join()]); ck(st[0] === 'avail' && st[1] === 162 && st[2] === 'check', 'Android: consulta a Play al abrir y detecta la versión 162', st);
    ck(await vis(p, 'updBar'), 'aviso visible en el menú'); ck(await vis(p, 'newsDot'), 'punto rojo en NOVEDADES'); await p.screenshot({ path: SHOTS + '/upd_bar.png' });
    await p.click('#bUpdBar'); ck(await p.evaluate(() => window.__calls.includes('start')), 'ACTUALIZAR llama a startUpdate()');
    await p.click('#bUpdBarX'); ck(!await vis(p, 'updBar'), '× oculta el aviso'); ck(await vis(p, 'newsDot'), 'el punto sigue');
    await p.click('#bNews'); ck(await vis(p, 'bUpdGo') && !await vis(p, 'bUpdChk'), 'panel: ACTUALIZAR AHORA visible'); ck(/versión nueva/.test(await p.evaluate(() => document.getElementById('updMsg').textContent)), 'mensaje de versión nueva'); await p.waitForTimeout(400); await p.screenshot({ path: SHOTS + '/upd_panel_avail.png' }); await p.click('#bUpdGo'); ck((await p.evaluate(() => window.__calls.filter(c => c === 'start').length)) === 2, 'botón del panel también actualiza');
    await p.click('#bUpdX'); await p.reload(); await p.waitForTimeout(4000); ck(!await vis(p, 'updBar'), 'tras reiniciar, el aviso descartado de esa versión no vuelve a molestar'); ck(await vis(p, 'newsDot'), 'pero el punto sigue');
    await p.evaluate(() => { urUpdSet({ avail: true, code: 163, ver: '14.10' }, 'srv'); }); ck(await vis(p, 'updBar'), 'una versión aún más nueva vuelve a avisar'); ck(!p.errs.length, 'sin errores (3)', p.errs.slice(0, 2)); await ctx.close(); }
  // 4 Android: al día / error
  { const p = await open(b, { native: true, mode: 'none', wait: 3500 }); ck(await p.evaluate(() => UPD.st) === 'none' && !await vis(p, 'updBar'), 'Android al día: sin aviso'); await p.click('#bNews'); ck(/última versión/.test(await p.evaluate(() => document.getElementById('updMsg').textContent)), 'panel: «última versión»'); await p.click('#bUpdChk'); await p.waitForTimeout(100); ck(/Buscando/.test(await p.evaluate(() => document.getElementById('updMsg').textContent)), 'BUSCAR muestra «Buscando…»'); await p.waitForTimeout(600); ck(await p.evaluate(() => UPD.st) === 'none', 'y vuelve a «al día»'); await p.context().close(); }
  { const p = await open(b, { native: true, mode: 'err', wait: 3500 }); ck(await p.evaluate(() => UPD.st) === 'idle' && !await vis(p, 'updBar'), 'error en la comprobación automática: silencioso'); await p.click('#bNews'); await p.click('#bUpdChk'); await p.waitForTimeout(700); ck(/No se pudo/.test(await p.evaluate(() => document.getElementById('updMsg').textContent)), 'error en la manual: lo dice', await p.evaluate(() => document.getElementById('updMsg').textContent)); await p.context().close(); }
  // 5 aviso del servidor
  { const p = await open(b, { native: true, mode: 'none', wait: 3500 }); await p.evaluate(() => urSrvApp({ codigo: 146, version: '14.9' })); ck(await p.evaluate(() => UPD.st) === 'none', 'servidor con la misma versión: nada');
    await p.evaluate(() => urSrvApp({ codigo: 162, version: '14.10<img src=x onerror=window.__x=1>', notas: ['Arreglo <b>uno</b>', 'Dos'] })); ck(await p.evaluate(() => UPD.st) === 'avail', 'servidor anuncia 150 → aviso'); await p.click('#bNews'); const h = await p.evaluate(() => ({ bold: document.querySelectorAll('#updList ul:first-of-type li b').length, img: document.querySelectorAll('#updList img').length, x: window.__x || 0, t: document.getElementById('updList').innerText.slice(0, 70) })); ck(!h.bold && !h.img && !h.x, 'las notas del servidor no inyectan HTML', h); ck(/Arreglo <b>uno<\/b>/.test(h.t), 'se muestran como texto', h.t);
    await p.evaluate(() => urSrvApp({ codigo: 'x' })); await p.evaluate(() => urSrvApp(null)); await p.evaluate(() => urSrvApp({ codigo: -3 })); ck(await p.evaluate(() => UPD.st) === 'avail', 'datos basura del servidor no rompen ni quitan el aviso'); ck(!p.errs.length, 'sin errores (5)', p.errs.slice(0, 2)); await p.context().close(); }
  // 6 navegador/PC: el servidor NO provoca aviso (la web se recarga sola)
  { const p = await open(b, { wait: 1500 }); await p.evaluate(() => urSrvApp({ codigo: 162, version: '14.10' })); ck(await p.evaluate(() => UPD.st) === 'idle', 'en el navegador no hay aviso por anuncio del servidor'); await p.context().close(); }
  // 7 anfitrión del servidor
  { const p = await open(b, { native: true, mode: 'avail', q: '?srv=1', wait: 3500 }); ck(await p.evaluate(() => UPD.st) === 'idle' && !await vis(p, 'updm'), 'anfitrión (?srv=1): no consulta ni abre nada', await p.evaluate(() => window.__calls)); await p.context().close(); }
  // 8 el juego sigue funcionando
  { const p = await open(b, { wait: 1500 }); await p.click('#bNew'); await p.waitForFunction(() => STATE === 'play', null, { timeout: 90000 }); await p.waitForTimeout(1500); ck(!await vis(p, 'updBar') && !await vis(p, 'updm'), 'en partida no aparece nada'); ck(!p.errs.length, 'sin errores (8)', p.errs.slice(0, 2)); await p.context().close(); }
  // 9 móvil pequeño en horizontal (el juego es solo horizontal)
  { const p = await open(b, { vp: { width: 640, height: 300 }, native: true, mode: 'avail', wait: 4000 }); await p.screenshot({ path: SHOTS + '/upd_bar_small.png' }); const r = await p.evaluate(() => { const e = document.getElementById('updBar').getBoundingClientRect(); return [Math.round(e.left), Math.round(e.right), Math.round(e.bottom), innerWidth, innerHeight]; }); ck(r[0] >= 0 && r[1] <= r[3] && r[2] <= r[4], 'aviso cabe en 640×300', r); await p.click('#bNews'); await p.screenshot({ path: SHOTS + '/upd_panel_small.png' }); await p.context().close(); }
  console.log('fallos:', fails); await b.close();
})();
