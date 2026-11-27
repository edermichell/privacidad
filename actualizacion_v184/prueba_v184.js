// Pruebas v18.4: historia progresiva (radio por días, oferta el día 3, solo el primer paso, vuelo desde el día 7, título de cada día)
const { newTake } = require('./lib');
let fails = 0; const ok = (c, m, x) => { console.log((c ? 'OK   ' : 'FAIL ') + m + (x !== undefined ? ' ' + JSON.stringify(x) : '')); if (!c) fails++; };
(async () => {
  const T = await newTake({ html: process.env.H, seed: 't184', w: 915, h: 412, dsf: 1, invuln: true, hideUI: [] });
  const errs = []; T.page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => T.ev(f, a);
  const at = async (day, hh, mm = 0, secs = 3) => { await ev(([d, h, m]) => { clearZ(); GT.min = (d - 1) * 1440 + h * 60 + m; META.tutDone = true; QI = Math.max(QI, 1); M76.pt = Math.max(M76.pt, 400); if (!$('metam').hidden) {} }, [day, hh, mm]); await T.run(secs * 1000); };
  const st = () => ev(() => ({ f: M76.sv.side.h184 | 0, offered: !!M76.offered, acc: M76.sv.acc, modal: !$('metam').hidden ? ($('metam').innerText || '').slice(0, 400) : null, says: (window.__says || []).slice(-3), day: paceDay() }));
  await ev(() => { const c = nearestCross(P.x, P.y); tp(c[0], c[1]); window.__noZ = setInterval(() => { Z.length = 0; }, 200); window.__says = []; const _s = say; say = function (m) { __says.push(String(m)); return _s.apply(this, arguments); }; window.__jl = []; const _j = jlog; jlog = function (m) { __jl.push(String(m)); return _j.apply(this, arguments); }; });
  // 1) día 1 a mediodía, ya jugado de sobra: NO hay oferta de rescate (antes llegaba a los 4 min)
  await at(1, 12, 30, 4); let r = await st();
  ok(!r.offered && r.acc === 0 && !r.modal, 'día 1 a mediodía: no llega la misión de rescate', r);
  // 2) día 1 al anochecer: estática
  await at(1, 19, 30); r = await st(); ok((r.f & 1) && r.says.some(s => /estática/.test(s)) && !r.offered, 'día 1 al anochecer: la radio solo da estática (sin misión)', r);
  // 3) día 2 de mañana: fragmento; aún sin misión
  await at(2, 10, 30); r = await st(); const jl2 = await ev(() => __jl.filter(j => /142|radio/i.test(j)));
  ok((r.f & 2) && r.says.some(s => /uno-cuatro-dos/.test(s)) && !r.offered && jl2.some(j => /142/.test(j)), 'día 2: un fragmento por la radio, apuntado en el diario; aún sin misión', { f: r.f, diario: jl2 });
  await at(2, 15, 0); r = await st(); ok(!r.offered, 'día 2 por la tarde: todavía sin oferta');
  // 4) día 3 de día: la oferta, solo con el primer paso
  await at(3, 9, 0, 4); r = await st();
  ok(r.offered && r.modal && /RUMOR DE RESCATE/i.test(r.modal), 'día 3: llega el rumor completo y se ofrece la misión', r.modal && r.modal.slice(0, 60));
  ok(r.modal && /Primer paso/.test(r.modal) && /día 7/.test(r.modal) && !/①|Paciente Cero|radio de campaña/.test(r.modal), 'la oferta solo cuenta el primer paso (sin la muestra ni la radio) y avisa del día 7', r.modal);
  await ev(() => { [...document.querySelectorAll('#metam button')].find(b => /ACEPTAR/.test(b.textContent)).click(); }); await T.run(1500);
  r = await ev(() => ({ acc: M76.sv.acc, st: M76.st && M76.st.n })); ok(r.acc === 1 && /pista|Aurora/.test(r.st || ''), 'aceptada: la primera etapa es buscar la pista de Aurora', r);
  // 5) con todo conseguido el día 4: «Espera el primer vuelo»; la radio de campaña solo da estática
  await ev(() => { STORY.rd = [0, 1, 2, 3, 4]; STORY.fq = 1; for (const id of ['sample', 'fieldradio']) addItem(mkItem(id, 1)); }); await at(4, 11, 0);
  r = await ev(() => ({ st: M76.st && [M76.st.id, M76.st.n, M76.st.sub] })); ok(r.st && r.st[0] === 5 && /faltan 3 días/.test(r.st[2]), 'día 4 con todo: «Espera el primer vuelo · faltan 3 días»', r);
  r = await ev(() => { __says.length = 0; beaconStart(); return { beacon: !!BEACON, says: __says.slice(), dialogo: !$('metam').hidden }; });
  ok(!r.beacon && !r.dialogo && r.says.some(s => /día 7/.test(s)), 'antes del día 7, la radio de campaña no llama al helicóptero (dice por qué, sin diálogo)', r);
  // 6) día 7: ya se puede
  await at(7, 10, 0); r = await ev(() => ({ st: M76.st && M76.st.n })); ok(r.st === 'Llama al helicóptero', 'día 7: la etapa pasa a «Llama al helicóptero»', r);
  r = await ev(() => { beaconStart(); const conf = !$('metam').hidden && /señal|helic/i.test($('metam').innerText); $('metam').hidden = true; S86.ok = 1; beaconStart(); const b = !!BEACON; BEACON = null; heli = null; return { conf, b }; }); ok(r.conf && r.b, 'día 7: pide confirmación y la señal de evacuación se activa', r);
  // 7) títulos del amanecer: una vez por día, con el capítulo
  r = await ev(() => { M76.sv.side.card184 = 0; GT.min = 7 * 1440 + 6 * 60 + 30; return 1; }); await T.run(2500);
  r = await ev(() => { const e = document.getElementById('day184'); return e ? { t: e.innerText.replace(/\s+/g, ' '), go: e.classList.contains('go'), card: M76.sv.side.card184 } : null; });
  ok(r && /DÍA 8/.test(r.t) && r.go && r.card === 8, 'al amanecer aparece «DÍA N» con el capítulo', r);
  // 8) se guarda con la partida
  r = await ev(() => { const s = buildSave(); return s.mech && s.mech.m76 && s.mech.m76.s ? { h: s.mech.m76.s.h184, c: s.mech.m76.s.card184 } : null; });
  ok(r && (r.h & 3) === 3 && r.c === 8, 'las marcas de la historia se guardan con la partida', r);
  // 9) leer una nota por tu cuenta sigue contando como aceptar (no se castiga explorar)
  r = await ev(() => { M76.sv.acc = 0; STORY.rd = [0]; return m76Acc(); }); ok(r === 1, 'leer una nota de Aurora por tu cuenta sigue aceptando la misión');
  // 10) nombres de las personas: se escriben una vez y se reutilizan
  await ev(() => { LBL184.made = LBL184.hits = 0; for (let i = 0; i < 4; i++) mkNpc('refugee', P.x + 1 + i * .5, P.y + .5, {}); });
  await T.run(1500); r = await ev(() => ({ made: LBL184.made, hits: LBL184.hits }));
  ok(r.made >= 1 && r.made <= 8 && r.hits > r.made * 10, 'los nombres se escriben una vez y luego se reutilizan', r);
  ok(!errs.length, 'sin errores de página', errs.slice(0, 3));
  console.log('fallos:', fails); await T.close();
})();
