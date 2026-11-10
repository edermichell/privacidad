/* ===================== MODO SERVIDOR (solo cuando el servidor sirve el juego) =====================
   Se inserta al servir la página; el APK no lo lleva. Activo solo con ?srv=1 (el anfitrión sin pantalla).
   - El jugador local del anfitrión es un "fantasma": no cuenta como objetivo de zombis/civiles si hay invitados.
   - Sin sonido, sin dibujo (ahorra casi toda la CPU); la simulación y la red siguen igual. */
const SRV = { on: false, spawn: null, ticks: 0 };
/* el servidor lo llama una vez cargado todo el juego (así ninguna capa posterior pisa estos cambios) */
SRV.boot = function (opt) {
  if (SRV.on) return; SRV.on = true; opt = opt || {}; SRV.pauseEmpty = !!opt.pausar; SRV.park = null;
  /* la sala usa el relé de este mismo servidor, conexiones directas (Tailscale) y hasta «max» jugadores reales */
  window.__SRV_HOST = 1; NET.sig = location.origin + '/sig'; NET.ice = opt.ice || []; NET.srv = 1; NET.max = Math.max(1, Math.min(10, opt.max | 0 || 10)); NET.cap = NET.max;
  if (opt.code) { netCode = () => String(opt.code); }
  /* entrada de jugadores por WebSocket (sin WebRTC): el servidor avisa de cada invitado y aquí se abre su canal */
  { const base = location.origin.replace(/^http/, 'ws'), room = window.__ROOM || '';
    const openCtl = () => {
      const ws = new WebSocket(base + '/ws?role=host&room=' + room); SRV.ctl = ws;
      ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (er) { return; } if (m.k === 'join') SRV.wsJoin(m); };
      ws.onclose = () => { if (SRV.ctl === ws) SRV.ctl = null; setTimeout(openCtl, 2000); }; ws.onerror = () => { };
    };
    SRV.wsJoin = function (m) {
      if (NET.role !== 'host') { try { SRV.ctl.send(JSON.stringify({ k: 'deny', pid: m.pid, m: 'La sala no está lista.' })); } catch (e) { } return; }
      if (NET.peers.length >= NET.max) { try { SRV.ctl.send(JSON.stringify({ k: 'deny', pid: m.pid, m: 'La sala está llena (máximo ' + NET.max + ' jugadores).' })); } catch (e) { } return; }
      try { if (SRV.spawn) { P.x = SRV.spawn[0]; P.y = SRV.spawn[1]; SRV.lastBusy = true; } } catch (e) { }
      const peer = netNewPeer('ws' + m.pid); peer.uid = m.uid || ''; NET.peers.push(peer); netAgg(); netUI();
      netBindPeer(peer, new WsChan(new WebSocket(base + '/ws?role=peer&room=' + room + '&pid=' + encodeURIComponent(m.pid))));
      peer.joinT = setTimeout(() => { if (peer.st === 'connecting') netPeerFail(peer, 'El otro jugador no logró conectarse.'); }, 30000);
    };
    openCtl(); setInterval(() => { try { if (SRV.ctl && SRV.ctl.readyState === 1) SRV.ctl.send('{"k":"ka"}'); } catch (e) { } }, 20000); }
  /* el mundo que recibe un invitado nuevo lleva la posición del anfitrión: siempre debe ser el punto de entrada (no el rincón donde se aparca con la sala vacía) */
  { const _nsw = netSendWorld; netSendWorld = function () { try { if (SRV.spawn && P) { P.x = SRV.spawn[0]; P.y = SRV.spawn[1]; SRV.lastBusy = true; } } catch (e) { } return _nsw.apply(this, arguments); }; }
  /* jugadores conectados y expulsión (los usa el servidor) */
  SRV.players = () => (NET.peers || []).filter(p => p.ready).map(p => ({ slot: p.slot, uid: p.uid || '', nombre: ((p.rp && p.rp.name) || ('Jugador ' + p.slot)) }));
  SRV.kick = (slot, msg) => { const p = (NET.peers || []).find(q => q.slot === slot); if (!p) return false; try { netSendRaw(p, { t: 'end', m: msg || 'Fuiste expulsado de la sala.' }); } catch (e) { } setTimeout(() => { try { netPeerLost(p, true); } catch (e) { } }, 450); return true; };
  /* identidad verificada de los invitados al unirse (para baneos y reportes) */
  { const _hs = netHostSig; netHostSig = async function (m) {
    if (m && m.k === 'join' && NET.role === 'host') {
      let v; try { const q = new URLSearchParams({ uid: m.uid || '', n: m.n || '', s: m.s || '' }); const r = await fetch('/sala/' + (window.__ROOM || '') + '/verificar?' + q.toString(), { cache: 'no-store' }); v = await r.json(); } catch (e) { v = { ok: false, error: 'No se pudo verificar tu identidad. Intenta de nuevo.' }; }
      if (!v.ok) { netPost({ k: 'ban', to: m.id, m: v.error || 'No puedes entrar a esta sala.' }); return; }
      if (NET.peers.some(p => p.gid === m.id)) return;
      const before = new Set(NET.peers), pr = _hs.call(this, m), np = NET.peers.find(p => !before.has(p)); if (np) np.uid = v.uid || '';
      return pr;
    }
    return _hs.apply(this, arguments);
  }; }
  /* el anfitrión no dibuja: 30 pasos por segundo bastan y gastan menos CPU */
  try { OPT.fps = opt.fps === 0 ? 0 : (opt.fps || 30); frameDeadline = 0; } catch (e) { }
  /* sitio de aparcamiento lejos del punto de entrada (para simular el mundo con el servidor vacío sin que los zombis se amontonen donde entra la gente) */
  try { let best = null, bd = -1; for (let y = 12; y < H - 12; y += 6) for (let x = 12; x < W - 12; x += 6) { const d = Math.hypot(x - P.x, y - P.y); if (d > bd && inb(x, y) && !solidTile(x, y) && !to[idx(x, y)] && !tb[idx(x, y)]) { bd = d; best = [x + .5, y + .5]; } } SRV.park = best; } catch (e) { }
  audioInit = function () { };
  render = function () { };
  updateHUD = function () { };
  drawMini = function () { };
  const _nt = netTarget; netTarget = function (z) {
    const L = netLive(); if (!L.length) return _nt.apply(this, arguments);
    let b = null, bd = 1e18; for (const r of L) { const d = (r.x - z.x) * (r.x - z.x) + (r.y - z.y) * (r.y - z.y); if (d < bd) { bd = d; b = r; } } return b;
  };
  const _na = netAnchor; netAnchor = function () { const L = netLive(); if (NET.role !== 'host' || !L.length) return _na.apply(this, arguments); return L[(Math.random() * L.length) | 0]; };
  const _np = npcTarget; npcTarget = function (n) {
    if (NET.role !== 'host') return _np.apply(this, arguments); const L = netLive(); if (!L.length) return _np.apply(this, arguments);
    if (n.follow && n.own === 'g') { const r = netOwnerRp(n); return r || L[0]; }
    let b = null, bd = 1e18; for (const r of L) { const d = (r.x - n.x) * (r.x - n.x) + (r.y - n.y) * (r.y - n.y); if (d < bd) { bd = d; b = r; } } return b;
  };
  const _ug = updateGame; updateGame = function (dt) {
    const busy = !!(NET.peers && NET.peers.length);
    if (P && !P.dead) { P.ghost = 1e9; P.hp = 100; P.hun = Math.min(P.hun, 8); P.thi = Math.min(P.thi, 8); P.fat = Math.min(P.fat, 5); P.inf = 0; P.sick = 0; P.wounds.length = 0; P.sleep = false; P.cold = 0;
      /* con gente: el anfitrión está en el punto de entrada (ahí aparecen los invitados); vacío: aparcado lejos */
      const t = busy || !SRV.park ? SRV.spawn : SRV.park; if (t && (SRV.ticks++ % 30 === 0 || busy !== SRV.lastBusy)) { P.x = t[0]; P.y = t[1]; } SRV.lastBusy = busy; }
    if (!busy && SRV.pauseEmpty) { SRV.paused = true; return; }
    SRV.paused = false; return _ug.apply(this, arguments);
  };
};
