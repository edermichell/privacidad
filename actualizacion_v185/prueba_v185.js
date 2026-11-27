// Pruebas v18.5: cola de consejos y «un rasguño»
const { newTake } = require('./lib');
let fails = 0; const ok = (c, m, x) => { console.log((c ? 'OK   ' : 'FAIL ') + m + (x !== undefined ? ' ' + JSON.stringify(x) : '')); if (!c) fails++; };
(async () => {
  const T = await newTake({ html: process.env.H, seed: 't185', w: 915, h: 412, dsf: 1, invuln: false, hideUI: [] });
  const errs = []; T.page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => T.ev(f, a);
  await ev(() => { clearZ(); window.__noZ = setInterval(() => { if (!window.__keepZ) Z.length = 0; }, 200); window.__shown = []; const _s = say; say = function (m, c) { if (c === 'tip') __shown.push([performance.now(), String(m)]); return _s.apply(this, arguments); }; });
  await T.run(8000);   /* que salgan los consejos del arranque */
  // 1) ráfaga de 8 consejos a la vez
  const r0 = await ev(() => { __shown.length = 0; TQ185.last = -1e9;
    tip('t1', 'Un zombi te persigue: pelea en pasillos.'); tip('t2', 'Nuevo: RODAR (tecla Z) te aparta.'); tip('t3', 'Puedes comerciar con los vecinos.');
    tip('t4', 'Nuevo: un zombi te puede AGARRAR.'); tip('t5', 'Estás sangrando: abre Estado y venda la herida.'); tip('t6', 'Las lesiones de órganos se curan con vendas.');
    tip('t7', 'Los cadáveres cercanos te estresan.'); tip('t8', 'Tienes hambre: come algo pronto.');
    tip('t1', 'Un zombi te persigue: pelea en pasillos.'); tip('t1', 'Un zombi te persigue: pelea en pasillos.');
    return { ya: __shown.map(x => x[1]), cola: TQ185.q.map(e => e.id) }; });
  await T.run(100); const r0b = await ev(() => __shown.map(x => x[1])); ok(r0.ya.length === 0 && r0b.length === 1 && /sangrando/.test(r0b[0]), 'de 8 consejos a la vez sale uno, y es el urgente (sangrado)', r0b);
  ok(r0.cola.length === 8 && new Set(r0.cola).size === 8, 'llegan a la cola los 8, sin repetidos', r0.cola);
  await T.run(60000);
  const r1 = await ev(() => { const mine = __shown.filter(x => /persigue|RODAR|comerciar|AGARRAR|sangrando|órganos|cadáveres|hambre/.test(x[1])); const t0 = mine[0][0]; return mine.map(x => [Math.round((x[0] - t0) / 100) / 10, x[1].slice(0, 26)]); });
  const gaps = r1.slice(1).map((x, i) => +(x[0] - r1[i][0]).toFixed(1));
  ok(r1.length === 8, 'en un minuto salen los 8', r1.length);
  ok(r1.slice(0, 3).every(x => /sangrando|órganos|hambre/.test(x[1])) && r1[2][0] < 4.6, 'los 3 urgentes (sangrado, órganos/vendas, hambre) salen primero, cada ~2 s', r1.slice(0, 3));
  ok(gaps.slice(2).every(g => g >= 5.9), 'los demás, separados al menos 6 s', gaps);
  ok(/Nuevo/.test(r1[6][1]) && /Nuevo/.test(r1[7][1]), 'los de funciones nuevas («Nuevo: …») van al final', r1.slice(5).map(x => x[1]));
  // 2) «Nuevo: …» espera mientras te persiguen
  const r2 = await ev(() => { __shown.length = 0; TQ185.last = -1e9; window.__keepZ = 1; P.ghost = 0; P.sneak = false; const z = mkZombie(P.x + 4, P.y, 'walker'); z.st = 'chase'; z.spd = 0; z.seen = 99; z.los = true; Z.push(z); window.__zz = z; window.__kc = setInterval(() => { z.st = 'chase'; z.seen = 99; z.x = P.x + 4; z.y = P.y; P.ghost = 0; }, 20); tip('n1', 'Nuevo: prueba de espera.'); return __shown.length; });
  await T.run(8000); const mid = await ev(() => __shown.map(x => x[1]));
  await ev(() => { clearInterval(__kc); window.__keepZ = 0; Z.length = 0; }); await T.run(1500); const aft = await ev(() => __shown.map(x => x[1]));
  ok(r2 === 0 && !mid.some(m => /espera/.test(m)) && aft.some(m => /espera/.test(m)), '«Nuevo: …» espera a que nadie te persiga', { conZombi8s: mid, despues: aft.filter(m => /espera/.test(m)) });
  // 3) opción «Consejos» apagada, y partida nueva
  const r3 = await ev(() => { OPT.noTips = true; tip('x1', 'No debería salir.'); const a = TQ185.q.length; OPT.noTips = false; tip('x2', 'Algo normal.'); tip('x3', 'Otro normal.'); TQ185.last = performance.now(); const b = TQ185.q.length; tipSeen.clear(); return { apagado: a, antes: b, trasPartidaNueva: TQ185.q.length }; });
  ok(r3.apagado === 0 && r3.antes >= 1 && r3.trasPartidaNueva === 0, 'con los consejos apagados no se encola nada; una partida nueva vacía la cola', r3);
  // 4) un consejo solo cuenta como visto al mostrarse
  const r4 = await ev(() => { TQ185.last = performance.now(); tip('v1', 'Visto al salir.'); const antes = tipSeen.has('v1'); return antes; });
  await T.run(7000); const r4b = await ev(() => tipSeen.has('v1'));
  ok(r4 === false && r4b === true, 'un consejo cuenta como visto solo cuando se muestra', { enCola: r4, mostrado: r4b });
  // 5) «un rasguño»
  const r5 = await ev(() => { const m = []; const _s = say; say = function (x) { m.push(String(x)); return _s.apply(this, arguments); }; const _w = mechWoundType; mechWoundType = () => 'rasguño'; if (typeof GRAB !== 'undefined') GRAB.off = true; P.ghost = 0; P.cloth = {}; const z = mkZombie(P.x + .6, P.y, 'walker');
    for (let i = 0; i < 20 && !m.some(x => /rasguño/.test(x)); i++) { if (typeof GRAB !== 'undefined') GRAB.sure = 1; zombieHit(z); if (typeof GRAB !== 'undefined') GRAB.sure = 0; }
    mechWoundType = _w; say = _s; P.hp = 100; return m.filter(x => /rasguño/.test(x)); });
  ok(r5.length && r5.every(x => /un rasguño/.test(x) && !/una rasguño/.test(x)), '«Un zombi te ha dejado un rasguño…» (antes «una rasguño»)', r5[0]);
  // 6) secundarias que no adelantan la historia
  const r6 = await ev(() => { const q = id => SIDE.find(x => x.id === id), txt = x => typeof x.o === 'function' ? x.o() : x.o; const keep = [M76.sv.acc, STORY.rd.slice(), M76.sv.side.h184];
    M76.sv.acc = 0; STORY.rd = []; M76.sv.side.h184 = 1; const a = { kit: txt(q('kit')), arma: txt(q('arma')), radioOfrece: !!q('radio').g() };
    M76.sv.side.h184 = 3; a.radioOfrece2 = !!q('radio').g(); a.radio = txt(q('radio'));
    STORY.rd = [0, 1]; M76.sv.acc = 1; a.kitTarde = txt(q('kit')); a.armaTarde = txt(q('arma')); a.radioTarde = txt(q('radio'));
    M76.sv.acc = keep[0]; STORY.rd = keep[1]; M76.sv.side.h184 = keep[2]; return a; });
  ok(!/hospital/i.test(r6.kit) && !/jefes/i.test(r6.arma) && !/142/.test(r6.radio), 'el día 2 las secundarias no hablan del hospital, de los jefes ni de la 142.7', r6);
  ok(r6.radioOfrece === false && r6.radioOfrece2 === true, '«Sintoniza la radio» solo se ofrece tras oír el fragmento del día 2', r6);
  ok(/hospital/.test(r6.kitTarde) && /jefes/.test(r6.armaTarde) && /142\.7/.test(r6.radioTarde), 'con la historia avanzada vuelven los textos de antes', [r6.kitTarde, r6.armaTarde, r6.radioTarde]);
  ok(!errs.length, 'sin errores de página', errs.slice(0, 3));
  console.log('fallos:', fails); await T.close();
})();
