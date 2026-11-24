// Pruebas v18.0: agarrón de zombi (forcejeo)
const { newTake } = require('./lib');
let fails = 0; const ok = (c, m, x) => { console.log((c ? 'OK   ' : 'FAIL ') + m + (x !== undefined ? ' ' + JSON.stringify(x) : '')); if (!c) fails++; };
(async () => {
  const T = await newTake({ html: process.env.H, seed: 't180', w: 1280, h: 720, dsf: 1, invuln: false, hideUI: [] });
  const errs = []; T.page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => T.ev(f, a);
  const setup = () => ev(() => { clearZ(); const c = nearestCross(P.x, P.y); tp(c[0], c[1]); keepAlive(); P.ghost = 0; P.rollCd = 0; P.roll = null; P.act = null; GRAB.cur = null; GRAB.cd = 0; P.dir = 0; for (const k in keys) keys[k] = false; joy.active = false; joy.x = joy.y = 0; PAUSED = false;
    window.__ch = window.__ch || ur180Chance; ur180Chance = () => 1;
    const z = mkZombie(P.x + .7, P.y, 'walker'); z.st = 'chase'; z.seen = 99; z.los = true; Z.push(z); window.__z = z; return 1; });
  // 1) un golpe que acierta se convierte en agarrón: sin daño todavía, aviso en pantalla
  await setup();
  let r = await ev(() => { const h0 = P.hp, w0 = P.wounds.length; zombieHit(__z); const el = document.getElementById('grab180'); return { g: !!GRAB.cur, dh: h0 - P.hp, dw: P.wounds.length - w0, vis: !!el && !el.hidden, need: GRAB.cur && GRAB.cur.need }; });
  ok(r.g && r.dh === 0 && r.dw === 0, 'el golpe se convierte en agarrón (sin daño aún)', r);
  ok(r.vis, 'aparece el aviso «¡TE AGARRA!» con la barra de forcejeo');
  // 2) sujeto: no anda, no ataca, no rueda; el mismo zombi no golpea aparte
  r = await ev(() => { const x0 = P.x, y0 = P.y; joy.active = true; joy.x = 1; joy.y = 0; readKeys(); return [x0, y0]; });
  await T.run(300);
  let s2 = await ev(([x0, y0]) => { const d = Math.hypot(P.x - x0, P.y - y0); joy.active = false; joy.x = joy.y = 0; readKeys(); return { d, atk: tryAttack(), roll: urRoll() }; }, r);
  ok(s2.d < .05, 'agarrado no puede andar', +s2.d.toFixed(3));
  ok(s2.atk === false && s2.roll === false, 'agarrado no puede atacar ni rodar', s2);
  r = await ev(() => { const h0 = P.hp; zombieHit(__z); zombieHit(__z); return h0 - P.hp; });
  ok(r === 0, 'el zombi que agarra no golpea aparte', r);
  r = await ev(() => { const z2 = mkZombie(P.x - .6, P.y, 'walker'); z2.st = 'chase'; Z.push(z2); const h0 = P.hp, w0 = P.wounds.length; GRAB.sure = 1; zombieHit(z2); GRAB.sure = 0; return { dh: h0 - P.hp, dw: P.wounds.length - w0, g: !!GRAB.cur }; });
  ok(r.g && (r.dh > 0 || r.dw > 0), 'otro zombi sí puede herirte mientras te agarran', r);
  // 3) forcejear con toques (clics reales en la pantalla): se suelta, el zombi queda aturdido, sin mordisco
  r = await ev(() => ({ h: P.hp, w: P.wounds.length, need: GRAB.cur.need }));
  for (let i = 0; i < r.need; i++) { await T.page.mouse.click(640 + i * 3, 300); await T.run(60); }
  let s3 = await ev(([h, w]) => ({ g: !!GRAB.cur, stun: __z.stun, d: Math.hypot(__z.x - P.x, __z.y - P.y), vis: !document.getElementById('grab180').hidden, free: GRAB.stats.free, dw: P.wounds.length - w }), [r.h, r.w]);
  ok(!s3.g && s3.free === 1, 'tocando rápido la pantalla se suelta', s3);
  ok(s3.stun > 0, 'al soltarse empuja y aturde al zombi', s3.stun);
  ok(!s3.vis && s3.dw === 0, 'sin mordisco (ninguna herida nueva) y el aviso desaparece', s3);
  await T.run(300);
  s3 = await ev(() => { const x0 = P.x; joy.active = true; joy.x = 1; joy.y = 0; readKeys(); return x0; });
  await T.run(300); r = await ev(x0 => { joy.active = false; joy.x = joy.y = 0; readKeys(); return Math.hypot(P.x - x0, 0) ; }, s3);
  ok(r > .3, 'libre: vuelve a andar', +r.toFixed(2));
  // 4) sin forcejear: a los ~1,9 s muerde (golpe seguro)
  let bites = 0, hurt = 0;
  for (let k = 0; k < 3; k++) {
    await setup();
    const dur = await ev(() => { P.hp = 100; P.wounds = []; zombieHit(__z); return GRAB.cur.dur; });
    await T.run(dur * 1000 - 400); const mid = await ev(() => !!GRAB.cur);
    await T.run(800);
    const b = await ev(() => ({ g: !!GRAB.cur, hp: P.hp, w: P.wounds.length, bit: GRAB.stats.bit }));
    if (mid && !b.g) bites++; if (b.hp < 100 || b.w > 0) hurt++;
  }
  ok(bites === 3, 'sin forcejear, al acabar el tiempo te suelta… mordiéndote', bites);
  ok(hurt >= 2, 'el mordisco hiere (la ropa a veces lo para)', hurt);
  // 5) teclado: pulsar teclas también forcejea (mantener pulsada no cuenta)
  await setup(); await ev(() => zombieHit(__z));
  await T.page.keyboard.down('KeyF'); await T.run(400); await T.page.keyboard.up('KeyF');
  r = await ev(() => GRAB.cur ? GRAB.cur.n : -1); ok(r === 1, 'mantener una tecla cuenta un solo forcejeo', r);
  for (let i = 0; i < 8 && await ev(() => !!GRAB.cur); i++) { await T.page.keyboard.press(i % 2 ? 'KeyA' : 'KeyD'); await T.run(60); }
  ok(await ev(() => !GRAB.cur && GRAB.stats.free === 2), 'pulsando teclas rápido también se suelta');
  // 6) joystick: sacudirlo de lado a lado cuenta medio forcejeo por cambio
  await setup(); await ev(() => zombieHit(__z));
  for (let i = 0; i < 14 && await ev(() => !!GRAB.cur); i++) { await ev(s => { joy.active = true; joy.x = s; joy.y = 0; readKeys(); }, i % 2 ? 1 : -1); await T.run(70); }
  ok(await ev(() => { joy.active = false; joy.x = joy.y = 0; readKeys(); return !GRAB.cur && GRAB.stats.free === 3; }), 'sacudiendo el joystick también se suelta');
  // 7) un compañero lo aturde → te suelta
  await setup(); await ev(() => zombieHit(__z)); await T.run(200);
  await ev(() => { damageZombie(__z, 5, {}); __z.stun = Math.max(__z.stun, .5); });
  await T.run(100); r = await ev(() => ({ g: !!GRAB.cur, h: P.hp }));
  ok(!r.g, 'si alguien golpea y aturde al zombi, te suelta', r);
  // 8) cuándo NO hay agarrón
  r = await ev(() => { const o = {};
    clearZ(); keepAlive(); GRAB.cur = null; GRAB.cd = 0; P.rollCd = 0; P.end = 100; const z = mkZombie(P.x + .7, P.y, 'walker'); z.st = 'chase'; Z.push(z);
    urRoll(); zombieHit(z); o.roll = !GRAB.cur; P.roll = null; GRAB.cur = null;
    const c = mkZombie(P.x + .7, P.y, 'crawler'); c.st = 'chase'; Z.push(c); zombieHit(c); o.crawler = !GRAB.cur; GRAB.cur = null; GRAB.cd = 0;
    const b = mkZombie(P.x + .7, P.y, 'walker'); b.wb = 'police'; zombieHit(b); o.boss = !GRAB.cur; GRAB.cur = null; GRAB.cd = 0;
    GRAB.off = true; zombieHit(z); o.off = !GRAB.cur; GRAB.off = false; GRAB.cur = null; GRAB.cd = 0;
    zombieHit(z); o.firstOk = !!GRAB.cur; ur180Free(); zombieHit(z); o.cooldown = !GRAB.cur; GRAB.cur = null; GRAB.cd = 0;
    P.ghost = 3; zombieHit(z); o.ghost = !GRAB.cur; P.ghost = 0;
    return o; });
  ok(r.roll && r.crawler && r.boss && r.off && r.ghost, 'no agarra: rodando, reptantes, jefes, apagado ni con protección', r);
  ok(r.firstOk && r.cooldown, 'tras soltarte hay unos segundos sin otro agarrón', r);
  // 9) probabilidad real: ~16 % normal, ~30 % sin aliento; casual menos
  r = await ev(() => { ur180Chance = __ch; const z = Z.find(q => q.type === 'walker'); const f = e => { P.end = e; let n = 0; for (let i = 0; i < 4000; i++) if (Math.random() < ur180Chance(z)) n++; return n / 4000; }; const o = { normal: f(100), cansado: f(10), k: CASUAL ? .6 : DIFFK === 'hard' ? 1.25 : 1 }; P.end = 100; return o; });
  ok(Math.abs(r.normal - .16 * r.k) < .03 && Math.abs(r.cansado - .30 * r.k) < .035, 'probabilidad: ~16 % normal y ~30 % sin aliento (× dificultad)', r);
  // 10) anfitrión: un invitado se suelta («ZG») → aturde al zombi solo si está a su lado
  r = await ev(() => { clearZ(); const z = mkZombie(P.x + 3, P.y, 'walker'); z.id = 9991; z.st = 'chase'; Z.push(z); const cur = NET.cur;
    NET.cur = { rp: { x: z.x + .6, y: z.y } }; netMsg({ t: 'ZG', id: 9991 }); const near = z.stun;
    z.stun = 0; NET.cur = { rp: { x: z.x + 9, y: z.y } }; netMsg({ t: 'ZG', id: 9991 }); const far = z.stun; NET.cur = cur; return { near, far }; });
  ok(r.near > 0 && r.far === 0, 'anfitrión: «ZG» aturde al zombi solo si el invitado está a su lado', r);
  // 11) partida: guardar con un agarrón en curso funciona y no guarda el agarrón
  await setup(); await ev(() => zombieHit(__z));
  r = await ev(() => { try { const j = JSON.stringify(P); return { ok: true, has: /grab/i.test(j) }; } catch (e) { return { ok: false, e: e.message }; } });
  ok(r.ok && !r.has, 'el agarrón no entra en los datos del jugador (guardado intacto)', r);
  await T.page.screenshot({ path: (process.env.OUT || '/tmp') + '/agarron_v180.png' });
  await T.run(2500);
  // 15) silueta: solo cuando algo tapa al jugador; barata con miles de zombis
  await setup(); await ev(() => { clearZ(); GRAB.cur = null; GRAB.off = true; XR180.n = 0; });
  await T.run(400); const n0 = await ev(() => XR180.n);
  await ev(() => { const z = mkZombie(P.x + .5, P.y + .6, 'walker'); z.spd = 0; z.st = 'idle'; Z.push(z); }); await T.run(400); const n1 = await ev(() => XR180.n);
  await ev(() => { clearZ(); const z = mkZombie(P.x - .6, P.y - .6, 'walker'); z.spd = 0; z.st = 'idle'; Z.push(z); XR180.n = 0; }); await T.run(400); const n2 = await ev(() => XR180.n);
  ok(n0 === 0 && n1 > 5 && n2 === 0, 'la silueta aparece solo si algo queda delante del jugador (no detrás ni sin nada)', { solo: n0, delante: n1, detras: n2 });
  r = await ev(() => { for (let i = 0; i < 2500; i++) Z.push(mkZombie(Math.random() * W, Math.random() * H, 'walker')); const t = performance.now(); for (let i = 0; i < 200; i++) xr180Covered(); return (performance.now() - t) / 200; });
  ok(r < .3, 'comprobar si te tapan cuesta poco con 2.500 zombis', { msPorCuadro: +r.toFixed(3) });
  await ev(() => { clearZ(); GRAB.off = false; });
  // 13) guardado: mismo contenido que el recorrido antiguo (puertas abiertas, barricadas, árboles talados)
  r = await ev(() => { GRAB.cur = null; clearZ();
    let nd = 0, nb = 0, nt = 0; for (let i = 0; i < W * H && (nd < 5 || nb < 3 || nt < 4); i++) { if (to[i] === O_DOOR && nd < 5) { td[i] |= 1; nd++; } else if (to[i] === O_WALL && nb < 3) { tbar[i] = 2; tbh[i] = 40; nb++; } else if (to[i] === O_TREE && nt < 4) { to[i] = O_NONE; tvTree[i] = 1; nt++; } }
    const s = buildSave(); const d = [], b = [], c = []; for (let i = 0; i < W * H; i++) { if (to[i] === O_DOOR && (td[i] & 1)) d.push(i); if (tbar[i] > 0) b.push([i, tbar[i], tbh[i]]); if (to[i] === O_NONE && tvTree[i]) c.push(i); }
    return { same: JSON.stringify([s.doors, s.bars, s.cut]) === JSON.stringify([d, b, c]), n: [s.doors.length, s.bars.length, s.cut.length] }; });
  ok(r.same && r.n[0] >= 5 && r.n[1] >= 3 && r.n[2] >= 4, 'guardado: puertas, barricadas y árboles talados idénticos al recorrido antiguo', r);
  // 14) guardado automático en dos tareas; el normal, al momento; morir justo entre medias no resucita la partida
  r = await ev(() => { localStorage.removeItem(SAVEKEY); saveGame(); const now = !!localStorage.getItem(SAVEKEY); localStorage.removeItem(SAVEKEY);
    SV180.auto = 1; try { saveGame(); } finally { SV180.auto = 0; } return { now, auto0: !!localStorage.getItem(SAVEKEY) }; });
  await T.run(50); const auto1 = await ev(() => { const j = localStorage.getItem(SAVEKEY); try { return !!j && JSON.parse(j).v === 3; } catch (e) { return false; } });
  ok(r.now && !r.auto0 && auto1, 'guardado normal al momento; el automático se escribe en la tarea siguiente', { ...r, auto1 });
  r = await ev(() => { P.ghost = 0; P.wind = 0; SV180.auto = 1; try { saveGame(); } finally { SV180.auto = 0; } window.__cas = CASUAL; P.hp = -50; die('prueba'); return { dead: P.dead }; });
  await T.run(50); r.save = await ev(() => !!localStorage.getItem(SAVEKEY));
  ok(r.dead && !r.save, 'si muere justo después del guardado automático, la partida borrada no vuelve', r);
  // 12) logro
  ok(await ev(() => ACH.some(a => a.id === 'grab10')), 'logro «Escurridizo»');
  ok(!errs.length, 'sin errores de página', errs.slice(0, 3));
  console.log('fallos:', fails); await T.close();
})();
