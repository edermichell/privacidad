// Analiza los 3 primeros días de una partida nueva: todo lo que el juego le dice al jugador (mensajes, diario, ventanas), con su hora de juego
const { newTake } = require('./lib'); const fs = require('fs');
(async () => {
  const T = await newTake({ html: process.env.H, seed: process.env.SEED || 'tl1', w: 915, h: 412, dsf: 1, invuln: true, hideUI: [], mode: 'full' });
  const ev = (f, a) => T.ev(f, a);
  await ev(st => { window.__START = st; }, +(process.env.START || 0));
  await ev(() => {
    window.__tl = []; const hora = () => { const m = GT.min, d = Math.floor(m / 1440) + 1, h = Math.floor(m % 1440 / 60), mi = Math.floor(m % 60); return 'D' + d + ' ' + String(h).padStart(2, '0') + ':' + String(mi).padStart(2, '0'); };
    const _s = say; say = function (m, c) { __tl.push([GT.min, hora(), 'msg:' + (c || ''), String(m).replace(/<[^>]+>/g, '')]); return _s.apply(this, arguments); };
    const _j = jlog; jlog = function (m, k) { __tl.push([GT.min, hora(), 'diario', String(m)]); return _j.apply(this, arguments); };
    const _mm = metaModal; metaModal = function (t, h) { __tl.push([GT.min, hora(), 'VENTANA', String(t) + ' · ' + String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 120)]); const r = _mm.apply(this, arguments); setTimeout(() => { try { const b = [...document.querySelectorAll('#metam button')]; const a = b.find(x => /ACEPTAR|CERRAR|ENTENDIDO|OK|SEGUIR|CONTINUAR/i.test(x.textContent)) || b[0]; if (a) a.click(); } catch (e) { } }, 1500); return r; };
    const _tp = typeof tip === 'function' ? tip : null; if (_tp) tip = function (id, m) { if (!tipSeen.has(id)) __tl.push([GT.min, hora(), 'consejo', String(m)]); return _tp.apply(this, arguments); };
    if (+(window.__START || 0)) { GT.min = +window.__START; META.tutDone = true; QI = Math.max(QI, 2); M76.pt = 600; M76.sv.side.h184 = (M76.sv.side.h184 | 0) | 1; }
    setInterval(() => { const c = document.getElementById('side76'); if (c && !c.hidden && !c.dataset.tl) { c.dataset.tl = 1; __tl.push([GT.min, hora(), 'OFERTA', c.innerText.replace(/\s+/g, ' ').slice(0, 120)]); const b = c.querySelector('[data-m="sa"]'); if (b) b.click(); } if (c && c.hidden) delete c.dataset.tl; }, 500);
  });
  // bot: anda y pelea; come y bebe; duerme de noche
  const t0 = Date.now(); let k = 0;
  while (Date.now() - t0 < (+process.env.SECS || 420) * 1000) {
    k++;
    const day = await ev(kk => { keepAlive(); joy.active = true; joy.x = Math.cos(kk * .07); joy.y = Math.sin(kk * .05); readKeys(); if (Math.random() < .3) { P.atkCd = 0; tryAttack(); } if (Math.random() < .1) doInteract(); return Math.floor(GT.min / 1440) + 1; }, k);
    if (day > (+process.env.DAYS || 3)) break;
    await T.run(500);
  }
  const tl = await ev(() => __tl);
  fs.writeFileSync(process.env.OUT, JSON.stringify(tl));
  console.log('eventos', tl.length, 'último', tl.length ? tl[tl.length - 1][1] : '-');
  await T.close();
})();
