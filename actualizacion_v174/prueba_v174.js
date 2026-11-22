// Pruebas v17.4: voltereta (RODAR) y calidad automática recordada
const { newTake } = require('./lib');
let fails = 0; const ok = (c, m, x) => { console.log((c ? 'OK   ' : 'FAIL ') + m + (x !== undefined ? ' ' + JSON.stringify(x) : '')); if (!c) fails++; };
(async () => {
  const T = await newTake({ html: process.env.H, seed: 't174', w: 1280, h: 720, dsf: 1, invuln: false, hideUI: [] });
  const ev = (f, a) => T.ev(f, a);
  await ev(() => { clearZ(); const c = nearestCross(P.x, P.y); tp(c[0], c[1]); P.end = 100; P.dir = 0; for (const k in keys) keys[k] = false; PAUSED = false; });
  // 1) voltereta sin dirección: hacia atrás (P.dir=0 -> ángulo PI), ~2,2 casillas
  let r = await ev(() => { const x0 = P.x, y0 = P.y, e0 = P.end; const ok = urRoll(); return { ok, x0, y0, e0, roll: !!P.roll, a: P.roll && P.roll.a }; });
  ok(r.ok && r.roll, 'urRoll() inicia la voltereta', r);
  ok(Math.abs(Math.cos(r.a) + 1) < .01, 'sin dirección rueda hacia atrás', r.a);
  let again = await ev(() => urRoll()); ok(again === false, 'no se encadena otra voltereta mientras rueda');
  await T.run(150);
  let atk = await ev(() => tryAttack()); ok(atk === false, 'no ataca mientras rueda');
  await T.run(350);
  let st = await ev(([x0, y0, e0]) => ({ d: Math.hypot(P.x - x0, P.y - y0), roll: !!P.roll, end: P.end, e0, cd: P.rollCd, pose: pSpec().pose }), [r.x0, r.y0, r.e0]);
  ok(st.d > 1.6 && st.d < 2.9, 'distancia de la voltereta 1,6-2,9 casillas', +st.d.toFixed(2));
  ok(!st.roll, 'la voltereta termina (~0,32 s)');
  ok(st.e0 - st.end > 8, 'gasta aguante', { antes: st.e0, despues: +st.end.toFixed(1) });
  ok(st.pose !== 'roll', 'pSpec vuelve a la pose normal al acabar', st.pose);
  let cdNow = await ev(() => urRoll()); ok(cdNow === false, 'enfriamiento: no puede rodar justo después', st.cd);
  await T.run(700);
  let cdLater = await ev(() => { const o = urRoll(); return o; }); ok(cdLater === true, 'tras el enfriamiento vuelve a poder rodar');
  await T.run(600);
  // 1b) contraataque: atacar durante la voltereta golpea al levantarse
  r = await ev(() => { clearZ(); P.rollCd = 0; P.end = 100; P.atkCd = 0; const w = give('katana'); P.eq = w; P.dir = Math.PI; urRoll(); return { cd0: P.atkCd }; });
  await T.run(120); await ev(() => tryAttack()); const mid = await ev(() => P.atkCd);
  await T.run(300); const aft = await ev(() => ({ cd: P.atkCd, roll: !!P.roll, atk: P.atk }));
  ok(mid <= 0 && !aft.roll && aft.cd > 0, 'contraataque: el golpe pedido rodando sale al terminar la voltereta', { mid, aft });
  await T.run(1200);
  // 2) sin aguante
  let tired = await ev(() => { P.end = 8; P.rollCd = 0; return urRoll(); }); ok(tired === false, 'sin aguante no rueda');
  // 3) dirección del joystick: derecha en pantalla = mundo (+x,-y)
  let dirR = await ev(() => { P.end = 100; P.rollCd = 0; joy.active = true; joy.x = 1; joy.y = 0; readKeys(); const o = urRoll(); const a = P.roll && P.roll.a; joy.active = false; joy.x = joy.y = 0; return { o, a, s: P.roll && P.roll.s }; });
  ok(dirR.o && Math.abs(dirR.a - (-Math.PI / 4)) < .01 && dirR.s === 1, 'con joystick a la derecha rueda a la derecha de la pantalla (giro horario)', dirR);
  await T.run(1200);
  // 4) invulnerabilidad: golpes de zombi durante la voltereta no hacen daño
  r = await ev(() => { P.end = 100; P.rollCd = 0; P.hp = 100; P.wounds = []; const z = mkZombie(P.x + .6, P.y, 'walker'); z.st = 'chase'; Z.push(z); const d0 = MX.rollDodge | 0; urRoll(); let hp0 = P.hp; for (let i = 0; i < 12; i++) zombieHit(z); return { hp0, hp: P.hp, dodge: (MX.rollDodge | 0) - d0, w: P.wounds.length }; });
  ok(r.hp === r.hp0 && r.w === 0 && r.dodge === 12, 'rodando, 12 golpes de zombi esquivados sin daño', r);
  await T.run(1000);
  r = await ev(() => { P.hp = 100; P.wounds = []; const z = Z[Z.length - 1]; for (let i = 0; i < 12; i++) zombieHit(z); return { hp: P.hp, w: P.wounds.length }; });
  ok(r.hp < 100 && r.w > 0, 'sin rodar, los golpes sí hieren', r);
  // bandido: cuerpo a cuerpo esquivado, bala no
  r = await ev(() => { P.hp = 100; P.wounds = []; P.rollCd = 0; P.end = 100; urRoll(); const n = { name: 'B', x: P.x + 1, y: P.y }; npcHitPlayer(n, 10, 'melee'); const h1 = P.hp; npcHitPlayer(n, 10, 'bullet'); return { h1, h2: P.hp }; });
  ok(r.h1 === 100 && r.h2 < 100, 'rodando: esquiva el golpe del bandido pero no la bala', r);
  await T.run(1200);
  // 5) paredes: no atraviesa sólidos
  r = await ev(() => { let best = null; for (let dx = -8; dx <= 8 && !best; dx++) for (let dy = -8; dy <= 8; dy++) { const tx = Math.floor(P.x) + dx, ty = Math.floor(P.y) + dy; if (solidTile(tx, ty) && !solidTile(tx - 1, ty)) { best = [tx, ty]; break; } } if (!best) return null;
    P.x = best[0] - .6; P.y = best[1] + .5; P.rollCd = 0; P.end = 100; P.roll = null; P.dir = Math.PI; return best; });   // de espaldas a la pared: rueda hacia ella
  if (r) { await ev(() => urRoll()); await T.run(500); const w = await ev(() => ({ x: P.x, y: P.y, solid: solidTile(Math.floor(P.x), Math.floor(P.y)) })); ok(!w.solid && w.x < r[0] + .01, 'rodando contra una pared no la atraviesa', w); } else ok(false, 'no se encontró pared');
  // 6) tecla Z
  await ev(() => { const c = nearestCross(P.x, P.y); tp(c[0], c[1]); P.rollCd = 0; P.end = 100; });
  await T.page.keyboard.down('KeyZ'); await T.run(40); await T.page.keyboard.up('KeyZ');
  ok(await ev(() => !!P.roll || (MX.rolls | 0) > 4), 'la tecla Z hace rodar');
  await T.run(1200);
  // 7) botón táctil
  r = await ev(() => { setTouchMode(); const b = document.getElementById('bRoll'); P.rollCd = 0; P.end = 100; const n0 = MX.rolls | 0; b.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true })); b.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true })); const rc = b.getBoundingClientRect(); return { n: (MX.rolls | 0) - n0, vis: rc.width > 0, r: [rc.left, rc.top, rc.width] }; });
  ok(r.vis && r.n === 1, 'el botón RODAR existe, se ve y hace rodar', r);
  await T.run(1200);
  // solapes del botón con los demás botones visibles
  r = await ev(() => { const ids = ['bAtk', 'bUse', 'bRun', 'bSnk', 'bMore', 'bThr']; const a = document.getElementById('bRoll').getBoundingClientRect(); const hit = []; for (const id of ids) { const e = document.getElementById(id); if (!e || e.hidden) continue; const b = e.getBoundingClientRect(); if (!b.width) continue; if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) hit.push(id); } return hit; });
  ok(r.length === 0, 'RODAR no se superpone a otros botones (1280x720)', r);
  await T.page.setViewportSize({ width: 800, height: 400 }); await T.run(300);
  r = await ev(() => { const ids = ['bAtk', 'bUse', 'bRun', 'bSnk', 'bMore', 'bThr']; const a = document.getElementById('bRoll').getBoundingClientRect(); const hit = []; for (const id of ids) { const e = document.getElementById(id); if (!e || e.hidden) continue; const b = e.getBoundingClientRect(); if (!b.width) continue; if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) hit.push(id); } return { hit, w: a.width }; });
  ok(r.hit.length === 0 && r.w > 30, 'RODAR no se superpone en pantalla pequeña (800x400)', r);
  await T.page.setViewportSize({ width: 1280, height: 720 }); await T.run(300);
  // 8) red: pose 'roll' y dibujo del compañero rodando sin errores
  r = await ev(() => { P.rollCd = 0; P.end = 100; urRoll(); const sp = pSpec(); let err = null; try { const R = { x: P.x + 2, y: P.y, dir: 0, pose: 'roll', ph: 3, sp: netSpecNow(), name: 'Prueba' }; drawRemote(R); drawRemote(Object.assign({}, R, { ph: 11 })); R.pose = 'walk'; drawRemote(R); } catch (e) { err = e.message; } return { pose: sp.pose, ph: sp.ph, err }; });
  ok(r.pose === 'roll' && r.err === null, 'en red se envía pose «roll» y el compañero se dibuja rodando sin errores', r);
  await T.run(1200);
  // 9) calidad automática recordada
  r = await ev(() => { OPT.q = 'auto'; ur174AutoLowClear(); ur174AutoLowHold(30); const a = ur174AutoLowGet(); ur174AutoLowHold(31); const b = ur174AutoLowGet(); return { a, b }; });
  ok(r.a === false && r.b === true, 'se recuerda la calidad baja solo tras >60 s en ella', r);
  await ev(() => saveOpt());
  await T.page.reload(); await T.run(1500);
  r = await ev(() => ({ LOWQ, q: OPT.q, cw: CW }));
  ok(r.LOWQ === true && r.q === 'auto', 'al reabrir, arranca ya en calidad baja (sin salto de zoom después)', r);
  r = await ev(() => { setQuality('auto'); return { LOWQ, mark: ur174AutoLowGet() }; });
  ok(r.mark === false, 'elegir calidad a mano borra la marca', r);
  console.log('fallos:', fails); await T.close();
})();
