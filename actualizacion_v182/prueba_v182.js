// Pruebas v18.2: el agarrón no deja usar ni pulsar botones; cierra los paneles; la pausa sigue funcionando
const { newTake } = require('./lib');
let fails = 0; const ok = (c, m, x) => { console.log((c ? 'OK   ' : 'FAIL ') + m + (x !== undefined ? ' ' + JSON.stringify(x) : '')); if (!c) fails++; };
(async () => {
  const T = await newTake({ html: process.env.H, seed: 'g182', w: 915, h: 412, dsf: 1, invuln: false, hideUI: ['#tut', '#quest'] });
  const errs = []; T.page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => T.ev(f, a);
  const grab = () => ev(() => { GRAB.cur = null; GRAB.cd = 0; ur180Chance = () => 1; P.ghost = 0; keepAlive(); const z = mkZombie(P.x - .7, P.y, 'walker'); z.st = 'chase'; Z.push(z); zombieHit(z); return !!GRAB.cur; });
  const open = () => ev(() => ['inv', 'craft', 'map'].filter(i => { const e = document.getElementById(i); return e && !e.hidden; }));
  await ev(() => { clearZ(); PAUSED = false; });
  // 1) panel abierto + agarrón → se cierra
  await ev(() => UI.toggleInv()); let o1 = await open(); let g = await grab(); let o2 = await open();
  ok(o1.includes('inv') && g && o2.length === 0, 'al empezar el agarrón se cierra la mochila', { antes: o1, despues: o2 });
  // 2) USAR no hace nada
  let r = await ev(() => { const c = cars.find(k => !k.dead); c.x = P.x + 1.1; c.y = P.y; P.dir = 0; const t = findInteract(); doInteract(); doInteract(); return { t: t && t.type, drive: !!P.drive, act: !!P.act, pan: ['inv', 'craft', 'map', 'loot'].filter(i => { const e = document.getElementById(i); return e && !e.hidden; }) }; });
  ok(r.t && !r.drive && !r.act && r.pan.length === 0, 'agarrado: USAR no sube al auto ni abre el maletero', r);
  // 3) un clic real en el botón Mochila: cuenta como forcejeo y NO abre la mochila
  const n0 = await ev(() => GRAB.cur.n); await T.page.click('#bInv'); await T.run(50);
  r = await ev(n0 => ({ n: GRAB.cur ? GRAB.cur.n - n0 : 'suelto', open: !document.getElementById('inv').hidden }), n0);
  ok(r.n === 1 && !r.open, 'agarrado: tocar «Mochila» cuenta como forcejeo y no la abre', r);
  // 4) tecla I: igual
  const n1 = await ev(() => GRAB.cur.n); await T.page.keyboard.press('KeyI'); await T.run(50);
  r = await ev(n1 => ({ n: GRAB.cur ? GRAB.cur.n - n1 : 'suelto', open: !document.getElementById('inv').hidden }), n1);
  ok(r.n === 1 && !r.open, 'agarrado: la tecla I cuenta como forcejeo y no abre la mochila', r);
  // 5) la pausa sí funciona
  await T.page.click('#bPause'); await T.run(50); r = await ev(() => PAUSED); ok(r === true, 'agarrado: el botón de pausa sigue funcionando');
  await ev(() => { PAUSED = false; const p = document.getElementById('pause'); if (p) p.hidden = true; });
  // 6) suelto: todo vuelve a funcionar
  await ev(() => { GRAB.cur = null; }); await T.page.click('#bInv'); await T.run(50); r = await ev(() => !document.getElementById('inv').hidden);
  ok(r, 'sin agarrón, el botón Mochila funciona como siempre'); await ev(() => UI.closeAll());
  await T.page.keyboard.press('KeyI'); await T.run(50); r = await ev(() => !document.getElementById('inv').hidden); ok(r, 'sin agarrón, la tecla I funciona'); await ev(() => UI.closeAll());
  // 7) Forcejeo fácil (Ajustes): apagado por defecto; mitad de forcejeos; mantener pulsado suelta; se guarda
  r = await ev(() => { const z = mkZombie(P.x - .7, P.y, 'walker'); const nNormal = ur180Need(z); OPT.grabEasy = false; const def = !!JSON.parse(localStorage.getItem(OPTKEY) || '{}').grabEasy; return { nNormal, def }; });
  ok(!r.def, 'Forcejeo fácil está apagado por defecto');
  await ev(() => { UI.closeAll(); }); r = await ev(() => { const b = document.getElementById('bGrabE'); const t0 = b.textContent; b.click(); return { t0, t1: b.textContent, on: OPT.grabEasy, saved: !!JSON.parse(localStorage.getItem(OPTKEY)).grabEasy }; });
  ok(r.on && r.saved && r.t0 !== r.t1, 'el botón de Ajustes lo activa y se guarda', r);
  r = await ev(() => { const z = mkZombie(P.x - .7, P.y, 'walker'); OPT.grabEasy = false; const a = ur180Need(z); OPT.grabEasy = true; const b = ur180Need(z); return { normal: a, facil: b }; });
  ok(r.facil === Math.max(2, Math.ceil(r.normal / 2)), 'fácil: la mitad de forcejeos', r);
  await grab(); r = await ev(() => ({ txt: document.querySelector('#grab180 span').textContent, n: GRAB.cur.n }));
  await T.page.mouse.move(600, 300); await T.page.mouse.down(); await T.run(1200); const freed = await ev(() => !GRAB.cur && GRAB.stats.free > 0); await T.page.mouse.up();
  ok(/Mantén/.test(r.txt) && freed, 'fácil: mantener pulsado suelta del agarrón (y el aviso lo dice)', { aviso: r.txt, suelto: freed });
  await ev(() => { OPT.grabEasy = false; saveOpt(); }); await grab(); await T.page.mouse.down(); await T.run(1200); r = await ev(() => GRAB.cur ? GRAB.cur.n : 'suelto'); await T.page.mouse.up();
  ok(r !== 'suelto' && r <= 1, 'normal: mantener pulsado NO suelta (cuenta un solo toque)', r); await ev(() => { GRAB.cur = null; });
  ok(!errs.length, 'sin errores de página', errs.slice(0, 3));
  console.log('fallos:', fails); await T.close();
})();
