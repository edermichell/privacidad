// Pruebas v17.6: dibujo reducido con paneles que tapan la pantalla y en el menú principal
const { newTake } = require('./lib');
let fails = 0; const ok = (c, m, x) => { console.log((c ? 'OK   ' : 'FAIL ') + m + (x !== undefined ? ' ' + JSON.stringify(x) : '')); if (!c) fails++; };
(async () => {
  const T = await newTake({ html: process.env.H, seed: 't176', w: 915, h: 412, dsf: 1, hideUI: [] });
  const ev = (f, a) => T.ev(f, a);
  await T.ev(() => { if (typeof GRAB !== 'undefined') GRAB.off = true; });   /* v18.2: un agarrón cierra la mochila (a propósito); aquí se mide solo el dibujo con paneles */
  await ev(() => { clearZ(); const c = nearestCross(P.x, P.y); tp(c[0], c[1]); PAUSED = false; });
  await T.run(500);
  // 1) jugando sin paneles: se dibuja cada cuadro
  let a = await ev(() => ({ ...UR176.stats })); await T.run(1000); let b = await ev(() => ({ ...UR176.stats }));
  ok(b.skipped - a.skipped === 0 && b.drawn - a.drawn >= 50, 'jugando: se dibujan todos los cuadros (~60/s)', { dibujados: b.drawn - a.drawn, saltados: b.skipped - a.skipped });
  // 2) mochila abierta: ~6 dibujos/s, el tiempo del juego avanza igual y el mundo sigue vivo
  a = await ev(() => { const z = mkZombie(P.x + 7, P.y, 'walker'); z.st = 'chase'; z.seen = 99; z.los = true; Z.push(z); window.__zt = z; spawnText(P.x, P.y, 'prueba', '#fff');
    UI.toggleInv(); return { ...UR176.stats, T: TIME, d: Math.hypot(z.x - P.x, z.y - P.y), tx: texts.length }; });
  await T.run(3000);
  b = await ev(() => ({ ...UR176.stats, T: TIME, d: Math.hypot(__zt.x - P.x, __zt.y - P.y), tx: texts.filter(t => t.s === 'prueba').length, cov: UR176.cov }));
  const rate = (b.drawn - a.drawn) / 3;
  ok(b.cov && rate >= 4 && rate <= 8, 'mochila abierta: el mundo se dibuja ~6 veces por segundo', { porSegundo: +rate.toFixed(1) });
  ok(Math.abs((b.T - a.T) - 3) < .25, 'el reloj de animación avanza al ritmo real (no se retrasa)', { avanzó: +(b.T - a.T).toFixed(2) });
  ok(b.d < a.d - 1, 'el mundo sigue vivo: el zombi se acerca con la mochila abierta', { antes: +a.d.toFixed(1), despues: +b.d.toFixed(1) });
  ok(b.tx === 0, 'los textos flotantes caducan a su tiempo aunque no se dibujen', b.tx);
  // 3) al cerrar, se vuelve a dibujar en el siguiente cuadro
  a = await ev(() => { UI.closeAll(); return { ...UR176.stats }; }); await T.run(50); b = await ev(() => ({ ...UR176.stats, cov: UR176.cov }));
  ok(!b.cov && b.drawn - a.drawn >= 2 && b.skipped === a.skipped, 'al cerrar el panel se dibuja de inmediato', { dibujados: b.drawn - a.drawn });
  // 4) fabricar y mapa también cuentan como paneles que tapan; construir (modo colocar) no
  let r = await ev(() => { UI.toggleCraft(); return 1; }); await T.run(600); r = await ev(() => UR176.cov); ok(r === true, 'fabricar abierto cuenta como tapado'); await ev(() => UI.closeAll());
  await ev(() => { give('map'); UI.toggleMap(); }); await T.run(600); r = await ev(() => ({ cov: UR176.cov, open: !document.getElementById('map').hidden })); ok(r.open && r.cov, 'mapa abierto cuenta como tapado', r); await ev(() => UI.closeAll());
  await T.run(300); r = await ev(() => UR176.cov); ok(r === false, 'sin paneles, nada tapado');
  // 5) calidad automática: con un panel encima no se mide (no sube la calidad ni cambia el zoom al cerrar)
  await ev(() => { OPT.q = 'auto'; LOWQ = true; resize(); highT = 0; lowT = 0; UI.toggleInv(); });
  await T.run(20000); r = await ev(() => ({ LOWQ, highT }));
  ok(r.LOWQ === true && r.highT === 0, 'con la mochila abierta 20 s la calidad automática no se mueve', r);
  await ev(() => UI.closeAll()); await T.run(20000); r = await ev(() => ({ LOWQ }));
  ok(r.LOWQ === false, 'sin paneles la calidad automática funciona como siempre (sube si va sobrado)', r);
  // 6) menú principal: ~30 dibujos/s
  await ev(() => { UI.closeAll(); toMenu(); }); await T.run(800); a = await ev(() => ({ ...UR176.stats })); await T.run(2000); b = await ev(() => ({ ...UR176.stats }));
  const mr = (b.drawn - a.drawn) / 2; ok(mr >= 25 && mr <= 34, 'menú principal: ~30 dibujos por segundo', { porSegundo: mr });
  console.log('fallos:', fails); await T.close();
})();
