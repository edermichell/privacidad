/* ===================== MODO SERVIDOR (solo cuando el servidor sirve el juego) =====================
   Se inserta al servir la página; el APK no lo lleva. Activo solo con ?srv=1 (el anfitrión sin pantalla).
   - El jugador local del anfitrión es un "fantasma": no cuenta como objetivo de zombis/civiles si hay invitados.
   - Sin sonido, sin dibujo (ahorra casi toda la CPU); la simulación y la red siguen igual. */
const SRV = { on: false, spawn: null, ticks: 0 };
/* el servidor lo llama una vez cargado todo el juego (así ninguna capa posterior pisa estos cambios) */
SRV.boot = function (opt) {
  if (SRV.on) return; SRV.on = true; opt = opt || {}; SRV.pauseEmpty = !!opt.pausar; SRV.park = null;
  /* la sala usa el relé de este mismo servidor, conexiones directas (Tailscale) y hasta «max» jugadores reales */
  window.__SRV_HOST = 1; NET.sig = location.origin + '/sig'; NET.ice = opt.ice || []; NET.srv = 1; NET.max = Math.max(1, Math.min(40, opt.max | 0 || 10)); NET.cap = NET.max;
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
  /* v15.6: en una sala del servidor nadie es «el anfitrión»: los jugadores se numeran desde 1 (antes el primero era «Jugador 2» porque el 1 era el anfitrión invisible) */
  { const _nsw = netSendWorld; netSendWorld = function () { try { if (NET.cur && (!NET.rpName || /^Jugador \d+$/.test(NET.rpName))) NET.rpName = 'Jugador ' + Math.max(1, NET.cur.slot - 1); } catch (e) { } try { if (SRV.spawn && P) { const sp = SRV.pvp && SRV.pickSpawn ? SRV.pickSpawn() : SRV.spawn; P.x = sp[0]; P.y = sp[1]; SRV.lastBusy = true; } } catch (e) { } return _nsw.apply(this, arguments); }; }
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
  /* ===== v15.0 · AUTORIDAD DEL SERVIDOR =====
     1) El daño que manda un invitado (HZ/HN) se valida: alcance, arma, cadencia. Los rechazos suman «avisos»; con muchos seguidos se expulsa.
     2) El personaje del invitado (mochila, habilidades) vive en el servidor, por identidad (uid): el teléfono ya no es la fuente de verdad.
        Se entrega con el mundo al entrar, se guarda cada pocos segundos y, si el modo es completo, se borra al morir.
     Las versiones anteriores de la app (sin «b» en el saludo) siguen jugando como antes, sin esta protección (se pueden excluir con «versionMinimaApp»). */
  SRV.auth = opt.aut !== false && typeof window.__srvChar === 'function'; SRV.val = opt.val !== false; SRV.minB = opt.minB | 0; SRV.muerte = opt.muerte === undefined ? 'modo' : opt.muerte;
  SRV.pvp = !!opt.pvp; if (SRV.pvp) NET.pvpRoom = 1;   /* v15.1: sala PvP (el servidor la fuerza a modo completo, con muerte que borra el personaje) */
  const slog = m => { try { if (typeof window.__srvLog === 'function') window.__srvLog(m); } catch (e) { } };
  const who = p => 'jugador ' + (p.slot || '?') + ' (' + String(p.uid || '').slice(0, 6) + ')';
  const charCall = async (op, uid, data) => { try { return await Promise.race([window.__srvChar(op, uid, data || ''), new Promise((_, j) => setTimeout(() => j(new Error('t')), 3000))]); } catch (e) { return { ok: false }; } };
  SRV.charValid = c => {
    if (typeof c !== 'string' || c.length > 100000) return null; let o; try { o = JSON.parse(c); } catch (e) { return null; }
    if (!o || o.seed !== SEED || !o.P || !Array.isArray(o.P.inv) || o.P.inv.length > 60) return null;
    for (const it of o.P.inv) { if (!okIt(it) || it.n < 0 || it.n > 400) return null; }
    if (!isFinite(o.P.hp) || o.P.hp < 0 || o.P.hp > 200) return null; return o;
  };
  SRV.charFlush = peer => { if (!peer.chPend || !peer.uid) return; const c = peer.chPend; peer.chPend = null; peer.chT = performance.now(); charCall('put', peer.uid, c); };
  SRV.charPut = (peer, c, fin) => {
    if (!SRV.auth || !peer.chAu || peer.chDead) return;
    let cv = SRV.charValid(c); if (!cv) { peer.chBadN = (peer.chBadN | 0) + 1; if (peer.chBadN <= 3) slog('personaje rechazado de ' + who(peer) + ' (formato o valores no válidos)'); return; }
    if (audOn(peer)) { try { peer.audSeq = (peer.audSeq | 0) + 1; const ar = SRV.audit(peer, cv, !!fin); if (ar.wait) { const sq = peer.audSeq, c0 = c; clearTimeout(peer.audTm); peer.audTm = setTimeout(() => { try { if (peer.audSeq === sq && !peer.chDead) SRV.charPut(peer, c0, true); } catch (e) { } }, 2500); return; } if (ar.cut) { cv = ar.cv; c = JSON.stringify(cv); } } catch (e) { slog('auditoría: ' + e.message); } }   /* v15.8 */
    peer.chBlob = cv; peer.chInv = new Set(cv.P.inv.map(i => i.id));   /* v15.2: lo que el servidor sabe que lleva (armas, botín del cuerpo) */
    peer.chPend = c; if (!peer.chT || performance.now() - peer.chT > 8000) SRV.charFlush(peer);
  };
  setInterval(() => { try { for (const p of NET.peers) if (p.chPend && performance.now() - (p.chT || 0) > 8000) SRV.charFlush(p); } catch (e) { } }, 4000);
  SRV.hitOk = (peer, o) => {
    const r = peer.rp; if (!r) return true; const isZ = o.t === 'HZ', tg = isZ ? zById(o.id) : NPCS.find(q => q.id === o.id); if (!tg) return true;
    const oo = o.o || {}, dmg = +o.dmg, rx = r.nx !== undefined ? r.nx : r.x, ry = r.ny !== undefined ? r.ny : r.y, d = Math.hypot(tg.x - rx, tg.y - ry), now = performance.now();
    const Wp = oo.w && ITEMS[oo.w] && ITEMS[oo.w].t === 'wpn' ? ITEMS[oo.w] : null; let why = null, cap, reach;
    if (oo.src === 'g') { if (!Wp || !Wp.gun) why = 'disparo sin arma de fuego'; else { cap = Wp.dmg * 2.5; reach = Wp.rng + 6; } }
    else if (oo.src === 'm') { if (Wp && Wp.gun) why = 'golpe cuerpo a cuerpo con arma de fuego'; else { cap = (Wp ? Wp.dmg : 7) * 14; reach = (Wp ? Wp.rng : .85) + 7; } }
    else { cap = 320; reach = 32; }                                                       /* explosiones, vehículos, lanzados… */
    if (!why) { if (!isFinite(dmg) || dmg < 0) why = 'daño no válido'; else if (dmg > cap) why = 'daño ' + Math.round(dmg) + ' mayor que el máximo ' + Math.round(cap); else if (d > reach) why = 'objetivo a ' + Math.round(d) + ' casillas (alcance ' + Math.round(reach) + ')'; }
    if (peer.kicked) return false; const b = peer.hb || (peer.hb = { tk: 120, t: now, s: 0 }); const el = Math.max(0, now - b.t); b.t = now; b.tk = Math.min(120, b.tk + el * .03); b.s = Math.max(0, b.s - el / 2000);   /* cubo de 120 golpes de ráfaga, 30/s de ritmo sostenido (una granada sobre una horda grande manda decenas de golpes a la vez) */
    if (!why) { if (b.tk < 1) why = 'demasiados golpes por segundo'; else b.tk -= 1; }
    if (!why) return true;
    peer.rej = (peer.rej | 0) + 1; b.s += why === 'demasiados golpes por segundo' ? .1 : 1;   /* un exceso de cadencia pesa poco (puede ser una explosión legítima); un daño/alcance/arma imposible pesa mucho */
    if (now - (peer.rejLog || 0) > 10000) { peer.rejLog = now; slog('daño rechazado de ' + who(peer) + ': ' + why + ' · total ' + peer.rej); }
    if (b.s >= 12 && !peer.kicked) { peer.kicked = 1; slog(who(peer) + ' expulsado por daño inválido repetido'); try { netSendRaw(peer, { t: 'end', m: 'Conexión cerrada: actividad sospechosa.' }); } catch (e) { } setTimeout(() => { try { netPeerLost(peer, true); } catch (e) { } }, 300); }
    return false;
  };
  /* ===== v15.3 · ALIANZAS Y TRAICIÓN (salas PvP) =====
     Las alianzas viven en el servidor, por identidad (uid), y se guardan en un archivo de la sala. Máximo «alianzaMax» (4). Se forman acercándose (≤ 8 casillas), proponiendo y aceptando.
     El fuego amistoso está ACTIVO: quien daña a un aliado (o a un exaliado que salió hace < 10 min) queda como TRAIDOR «traidorHoras» (24 h): sale de la alianza, nombre rojo para todos, no puede aliarse y se avisa a su
     alianza. Si el atacado ya había atacado antes a quien le pega (defensa propia, 5 min) o es un Traidor, no hay castigo. Los aliados se ven en el mapa, comparten señales y abren los candados del otro. */
  SRV.AL = { max: Math.max(2, Math.min(8, opt.amax | 0 || 4)), traitMs: (opt.thoras > 0 ? opt.thoras : 24) * 3600e3, leaveMs: 600e3, selfDefMs: 300e3, propMs: 30e3, near: 8, see: 55 };
  SRV.ali = { g: [], t: {}, l: {}, b: {}, k: {}, m: {} };
  { let tm = 0; SRV.aliSave = () => { clearTimeout(tm); tm = setTimeout(() => { try { if (typeof window.__srvAli === 'function') window.__srvAli('put', JSON.stringify(SRV.ali)); } catch (e) { } }, 1500); }; }
  if (SRV.pvp && typeof window.__srvAli === 'function') window.__srvAli('get', '').then(r => {
    try { if (r && r.ok && r.c) { const o = JSON.parse(r.c), ok = u => typeof u === 'string' && /^[a-z0-9]{8,40}$/.test(u), g = []; for (const x of (o.g || [])) { const m = (x.m || []).filter(ok).slice(0, 8); if (m.length >= 2) g.push({ id: String(x.id || Math.random().toString(36).slice(2, 8)).slice(0, 8), m }); } const tt = {}; for (const k in (o.t || {})) if (ok(k) && +o.t[k] > Date.now()) tt[k] = +o.t[k]; const bb = {}; for (const k in (o.b || {})) if (ok(k) && +o.b[k] > Date.now()) bb[k] = +o.b[k]; const kk = {}; for (const k in (o.k || {})) if (ok(k) && o.k[k] && (o.k[k].n | 0) > 0) kk[k] = { n: o.k[k].n | 0, nm: String(o.k[k].nm || '?').slice(0, 14) }; const mm = {}; for (const k in (o.m || {})) if (ok(k) && Array.isArray(o.m[k])) mm[k] = o.m[k].filter(x => +x > Date.now() - 864e5).slice(-10); SRV.ali = { g, t: tt, l: {}, b: bb, k: kk, m: mm }; } } catch (e) { }
  }).catch(() => { });
  const peerByUid = u => NET.peers.find(p => p.ready && p.uid === u), peerBySlot = i => NET.peers.find(p => p.ready && p.slot === i), pname = p => (p && p.rp && p.rp.name) || 'Jugador';
  const ppos = p => [p.rp.nx !== undefined ? p.rp.nx : p.rp.x, p.rp.ny !== undefined ? p.rp.ny : p.rp.y];
  SRV.grp = u => SRV.ali.g.find(g => g.m.includes(u));
  SRV.allied = (a, b) => { if (!a || !b || a === b) return false; const g = SRV.grp(a); return !!(g && g.m.includes(b)); };
  SRV.traitLeft = u => { const x = SRV.ali.t[u]; if (!x) return 0; if (x <= Date.now()) { delete SRV.ali.t[u]; SRV.aliSave(); return 0; } return x - Date.now(); };
  SRV.rel = (a, b) => { if (SRV.allied(a, b)) return 'ally'; const now = Date.now(), la = SRV.ali.l[a], lb = SRV.ali.l[b]; if ((la && now - la.t < SRV.AL.leaveMs && la.w.includes(b)) || (lb && now - lb.t < SRV.AL.leaveMs && lb.w.includes(a))) return 'ex'; return null; };
  SRV.aliSay = (p, m, c) => { try { netSendRaw(p, { t: 'say', m, c: c || 'tip' }); } catch (e) { } };
  SRV.aliSend = peer => {
    const g = SRV.grp(peer.uid), mem = []; if (g) for (const u of g.m) { if (u === peer.uid) continue; const q = peerByUid(u); mem.push({ i: q ? q.slot : 0, n: q ? pname(q) : '', on: q ? 1 : 0 }); }
    try { netSendRaw(peer, { t: 'AI', n: g ? g.m.length : 0, max: SRV.AL.max, mem, tr: Math.ceil(SRV.traitLeft(peer.uid) / 60000), bd: Math.ceil(SRV.isBandit(peer.uid) / 60000), top: SRV.seasonTop().slice(0, 5).map(q => [q.nombre, q.bajas]), tf: SRV.tfin || 0 }); } catch (e) { }
  };
  SRV.aliSendGroup = u => { const g = SRV.grp(u); if (g) for (const m of g.m) { const q = peerByUid(m); if (q) SRV.aliSend(q); } };
  SRV.aliJoin = peer => { SRV.aliSend(peer); try { SRV.gmSendTo(peer); } catch (e) { } try { if (SRV.tfin) { const dd = Math.max(0, Math.ceil((SRV.tfin - Date.now()) / 864e5)); SRV.aliSay(peer, 'Temporada PvP: quedan ' + dd + ' día' + (dd === 1 ? '' : 's') + '. Después el mundo se reinicia.', 'tip'); } if (SRV.isBandit(peer.uid) > 0) SRV.aliSay(peer, 'Sigues siendo BANDIDO: hay recompensa por tu cabeza.', 'bad'); } catch (e) { } SRV.aliSendGroup(peer.uid); const tl = SRV.traitLeft(peer.uid); if (tl) SRV.aliSay(peer, 'Sigues marcado como TRAIDOR durante ' + Math.ceil(tl / 3600000) + ' h.', 'bad'); };
  SRV.aliPropose = (peer, o) => {
    const tg = peerBySlot(o.i | 0), now = performance.now(); if (!tg || tg === peer || !peer.rp || !tg.rp || peer.chDead || tg.chDead) return;
    const a = ppos(peer), b = ppos(tg), d = Math.hypot(a[0] - b[0], a[1] - b[1]); let why = null; const g = SRV.grp(peer.uid);
    if (d > SRV.AL.near) why = 'Está demasiado lejos (acércate a menos de ' + SRV.AL.near + ' casillas).'; else if (SRV.traitLeft(peer.uid)) why = 'Eres Traidor: nadie quiere aliarse contigo.'; else if (SRV.traitLeft(tg.uid)) why = 'Ese jugador es un Traidor.';
    else if (SRV.grp(tg.uid)) why = 'Ya está en una alianza.'; else if (g && g.m.length >= SRV.AL.max) why = 'Tu alianza está completa (' + SRV.AL.max + ').'; else if (SRV.rel(peer.uid, tg.uid) === 'ex') why = 'Salieron de una alianza hace muy poco.';
    if (why) return SRV.aliSay(peer, why, 'bad');
    if (tg.prop && now - tg.prop.t < SRV.AL.propMs) return SRV.aliSay(peer, 'Ya tiene una propuesta pendiente.', 'bad');
    tg.prop = { from: peer.uid, t: now }; try { netSendRaw(tg, { t: 'AQ', i: peer.slot, n: pname(peer) }); } catch (e) { } SRV.aliSay(peer, 'Propuesta enviada a ' + pname(tg) + '.');
  };
  SRV.aliAnswer = (peer, yes) => {
    const pr = peer.prop; peer.prop = null; if (!pr || performance.now() - pr.t > SRV.AL.propMs + 10000) return; const from = peerByUid(pr.from); if (!from || !from.rp || !peer.rp) return;
    if (!yes) return SRV.aliSay(from, pname(peer) + ' rechazó la alianza.', 'bad');
    const a = ppos(from), b = ppos(peer); let g = SRV.grp(from.uid);
    if (SRV.traitLeft(from.uid) || SRV.traitLeft(peer.uid) || SRV.grp(peer.uid) || Math.hypot(a[0] - b[0], a[1] - b[1]) > SRV.AL.near * 2 || (g && g.m.length >= SRV.AL.max)) return SRV.aliSay(peer, 'La alianza ya no es posible.', 'bad');
    if (!g) { g = { id: Math.random().toString(36).slice(2, 8), m: [from.uid] }; SRV.ali.g.push(g); } g.m.push(peer.uid); delete SRV.ali.l[from.uid]; delete SRV.ali.l[peer.uid]; SRV.aliSave();
    for (const u of g.m) { const q = peerByUid(u); if (q) SRV.aliSay(q, q === peer ? 'Te uniste a la alianza de ' + pname(from) + ' (' + g.m.length + '/' + SRV.AL.max + ').' : pname(peer) + ' se unió a la alianza (' + g.m.length + '/' + SRV.AL.max + ').', 'good'); }
    SRV.aliSendGroup(peer.uid); slog('alianza: ' + pname(from) + ' + ' + pname(peer) + ' (' + g.m.length + ')');
  };
  SRV.aliLeave = peer => {
    const g = SRV.grp(peer.uid); if (!g) return; const rest = g.m.filter(u => u !== peer.uid); g.m = rest; SRV.ali.l[peer.uid] = { t: Date.now(), w: rest.slice() };
    for (const u of rest) { const q = peerByUid(u); if (q) SRV.aliSay(q, pname(peer) + ' salió de la alianza.', 'bad'); }
    if (rest.length <= 1) { SRV.ali.g = SRV.ali.g.filter(x => x !== g); for (const u of rest) { const q = peerByUid(u); if (q) { SRV.aliSay(q, 'La alianza se disolvió.', 'bad'); SRV.aliSend(q); } } } else SRV.aliSendGroup(rest[0]);
    SRV.aliSave(); SRV.aliSend(peer); slog('alianza: ' + pname(peer) + ' salió');
  };
  SRV.betray = (att, vic, rel) => {
    const g = SRV.grp(att.uid), mates = g ? g.m.filter(u => u !== att.uid) : []; SRV.ali.t[att.uid] = Date.now() + SRV.AL.traitMs;
    if (g) { g.m = mates; if (mates.length <= 1) SRV.ali.g = SRV.ali.g.filter(x => x !== g); } delete SRV.ali.l[att.uid]; SRV.aliSave();
    const hrs = Math.round(SRV.AL.traitMs / 3600000), m = pname(att) + ' traicionó a ' + pname(vic) + ': ahora es un TRAIDOR durante ' + hrs + ' h.';
    for (const u of mates.concat([vic.uid])) { const q = peerByUid(u); if (q) { SRV.aliSay(q, m, 'bad'); SRV.aliSend(q); } }
    SRV.aliSay(att, 'Traicionaste a ' + pname(vic) + '. Eres TRAIDOR durante ' + hrs + ' h: nombre rojo para todos y sin poder aliarte.', 'bad'); SRV.aliSend(att);
    slog('TRAICIÓN: ' + pname(att) + ' atacó a ' + pname(vic) + ' (' + (rel === 'ally' ? 'aliado' : 'exaliado reciente') + ')');
  };
  SRV.aliMsg = (peer, o) => {
    if (peer.chDead) return;
    if (o.t === 'AP') SRV.aliPropose(peer, o); else if (o.t === 'AA') SRV.aliAnswer(peer, true); else if (o.t === 'AD') SRV.aliAnswer(peer, false); else if (o.t === 'AL') SRV.aliLeave(peer);
    else if (o.t === 'SG') { const k = o.k | 0, now = performance.now(); if (k < 0 || k > 3 || now - (peer.sgT || 0) < 1500 || !peer.rp) return; peer.sgT = now; const g = SRV.grp(peer.uid); if (!g) return; const p = ppos(peer); for (const u of g.m) { if (u === peer.uid) continue; const q = peerByUid(u); if (q) { try { netSendRaw(q, { t: 'SGR', i: peer.slot, n: pname(peer), k, x: p[0], y: p[1] }); } catch (e) { } } } }
  };
  /* en PvP un cliente solo conoce a los jugadores cercanos (y a sus aliados): sin «radar» */
  { const _nof = netOthersFor; netOthersFor = function (peer) {
      const out = _nof.apply(this, arguments); if (!SRV.pvp || !peer.rp) return out; const me = ppos(peer), res = [];
      for (const a of out) { const q = NET.peers.find(p => p.slot === a.i), ally = !!(q && SRV.allied(peer.uid, q.uid)); if (!ally && Math.hypot(a.x - me[0], a.y - me[1]) > SRV.AL.see) { try { peer.oSeen.delete(a.i); } catch (e) { } continue; } a.al = ally ? 1 : 0; a.tr = q && SRV.traitLeft(q.uid) ? 1 : 0; a.bd = q && SRV.isBandit(q.uid) ? 1 : 0; res.push(a); }
      return res;
    }; }
  /* los candados de un aliado se abren sin código (el cliente manda «ALLY»; si no es aliado no cuenta como intento ni avisa al dueño) */
  { const _lt = lkTryH; lkTryH = function (i, code, w, remove) {
      if (SRV.pvp && String(code) === 'ALLY') { const L = LK.codes.get(i); if (!L) return { ok: false, m: 'No tiene candado.' }; if (!lkNear(w, i)) return { ok: false, m: 'Estás muy lejos.' }; if (!remove && w.uid && L.u && SRV.allied(L.u, w.uid)) { if (to[i] === O_DOOR) td[i] &= ~2; return { ok: true, m: 'Abierto (candado de tu aliado).' }; } return { ok: false, m: 'Este candado no es de un aliado tuyo.' }; }
      return _lt.apply(this, arguments);
    }; }
  /* ===== v15.4 · MISIONES DE GRUPO (salas PvP) =====
     Cada alianza con 2+ miembros conectados y cerca recibe UNA misión por día de juego, de día: «Limpiar el nido» (matar a todos los infectados de un punto) o «Mantener la radio» (alguien del grupo cerca del punto
     X segundos mientras llegan oleadas). Al cumplirla aparece UN solo botín en el suelo del punto: el primero que llegue se lo lleva (aliados, traidores o desconocidos). Las lleva el anfitrión; los clientes solo la muestran. */
  SRV.GM = { on: opt.gm !== false, tod: [420, 960], tNido: 15 * 60e3, tRadio: 12 * 60e3, radioNeed: 150, near: 90, minD: 45, maxD: 95 };
  SRV.gm = new Map();
  const gmDay = () => Math.floor(GT.min / 1440) + 1;
  const gmFree = (x, y) => { for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const xx = Math.floor(x) + ox, yy = Math.floor(y) + oy; if (!inb(xx, yy) || to[idx(xx, yy)] || tb[idx(xx, yy)] || solidTile(xx, yy) || tg[idx(xx, yy)] === G_WATER) return false; } return true; };
  SRV.gmOnline = g => g.m.map(peerByUid).filter(p => p && p.rp && !p.chDead && p.A !== undefined && !p.rp.dead);
  SRV.gmPick = (cx, cy) => { for (let k = 0; k < 400; k++) { const a = Math.random() * 6.283, d = SRV.GM.minD + Math.random() * (SRV.GM.maxD - SRV.GM.minD), x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d; if (x < 10 || y < 10 || x > W - 10 || y > H - 10) continue; if (gmFree(x, y)) return [Math.floor(x) + .5, Math.floor(y) + .5]; } return null; };
  SRV.gmSend = (peer, m, a) => { try { netSendRaw(peer, { t: 'GM', a, id: m.id, k: m.k, n: m.n, d: m.d, x: m.x, y: m.y, p: m.prog | 0, m: m.need | 0, tl: Math.max(0, Math.round((m.exp - performance.now()) / 1000)), ok: m.ok ? 1 : 0 }); } catch (e) { } };
  SRV.gmSendTo = peer => { const g = SRV.grp(peer.uid); if (!g) return; const st = SRV.gm.get(g.id); if (st && st.cur) SRV.gmSend(peer, st.cur, 'new'); };
  SRV.gmWave = (m, n) => {
    const fld = bfs(Math.floor(m.x), Math.floor(m.y), 45); let made = 0;
    for (let k = 0; k < 40 && made < 3 + n; k++) { const a = Math.random() * 6.283, d = 14 + Math.random() * 7, x = m.x + Math.cos(a) * d, y = m.y + Math.sin(a) * d; if (!inb(Math.floor(x), Math.floor(y)) || solidTile(Math.floor(x), Math.floor(y)) || to[idx(Math.floor(x), Math.floor(y))]) continue; const z = mkZombie(x, y, made % 5 === 4 ? 'runner' : 'walker'); z.st = 'invest'; z.tx = m.x; z.ty = m.y; z.fld = fld; z.invT = 90; z.evz = 1; Z.push(z); made++; }
    return made;
  };
  SRV.gmStart = (g, st, online, kind) => {
    const c = [0, 0]; for (const p of online) { const q = ppos(p); c[0] += q[0] / online.length; c[1] += q[1] / online.length; } const sp = SRV.gmPick(c[0], c[1]); if (!sp) return false;
    kind = kind || (Math.random() < .5 ? 'nido' : 'radio'); const now = performance.now(), m = { id: Math.random().toString(36).slice(2, 7), k: kind, x: sp[0], y: sp[1], prog: 0, need: 0, zs: [], last: 0, wave: now, ok: false };
    if (kind === 'nido') {
      const K = Math.min(20, 5 + 3 * online.length); for (let i = 0; i < K; i++) { const a = Math.random() * 6.283, d = Math.random() * 5, x = sp[0] + Math.cos(a) * d, y = sp[1] + Math.sin(a) * d; if (solidTile(Math.floor(x), Math.floor(y))) continue; const z = mkZombie(x, y, i % 7 === 6 ? 'brute' : i % 4 === 3 ? 'runner' : 'walker'); z.st = 'idle'; Z.push(z); m.zs.push(z.id); }
      m.need = m.zs.length; m.exp = now + SRV.GM.tNido; m.n = 'Limpiar el nido'; m.d = 'Hay un nido de ' + m.need + ' infectados en el punto marcado. Eliminadlos a todos.';
    } else { m.need = SRV.GM.radioNeed; m.exp = now + SRV.GM.tRadio; m.n = 'Mantener la radio'; m.d = 'Una radio pide refuerzos: que alguien del grupo se mantenga a menos de 7 casillas del punto marcado ' + (Math.round(m.need / 6) / 10) + ' min. El ruido atraerá infectados.'; }
    st.cur = m; st.lastDay = gmDay(); for (const u of g.m) { const q = peerByUid(u); if (q) SRV.gmSend(q, m, 'new'); }
    slog('misión de grupo «' + m.n + '» (' + online.length + ' jugadores conectados) en ' + Math.round(sp[0]) + ',' + Math.round(sp[1])); return true;
  };
  SRV.gmReward = (m, n) => {
    const G = [['pistol', 'ammo9', 24], ['revolver', 'ammo38', 12], ['shotgun', 'shells', 10], ['rifle', 'ammo762', 10]], gp = G[(Math.random() * G.length) | 0], out = [];
    const add = (id, c) => { if (!ITEMS[id]) return; const it = mkItem(id, c || 1); if (ITEMS[id].gun) it.a = ITEMS[id].mag; out.push(it); };
    add(gp[0], 1); add(gp[1], gp[2]); add('bandage', 3); add('medkit', 1); for (let i = 0; i < n; i++) add(['water', 'beans', 'chips', 'soda', 'pills', 'antiseptic', 'machete', 'vest'][(Math.random() * 8) | 0], 1);
    for (const it of out) { const a = Math.random() * 6.283, d = Math.random() * 1.2; floorItems.push({ x: m.x + Math.cos(a) * d, y: m.y + Math.sin(a) * d, it, t0: TIME }); } return out.length;
  };
  SRV.gmEnd = (g, st, ok, why) => {
    const m = st.cur; if (!m) return; m.ok = ok; st.cur = null; const n = ok ? SRV.gmReward(m, Math.max(1, g ? SRV.gmOnline(g).length : 2)) : 0;
    if (g) for (const u of g.m) { const q = peerByUid(u); if (!q) continue; SRV.gmSend(q, m, 'end'); SRV.aliSay(q, ok ? 'MISIÓN CUMPLIDA: el botín (' + n + ' objetos) está en el suelo en el punto marcado. El primero que llegue se lo lleva…' : 'Misión de grupo fallida: ' + (why || ''), ok ? 'good' : 'bad'); }
    slog('misión de grupo «' + m.n + '» ' + (ok ? 'CUMPLIDA (' + n + ' objetos de botín)' : 'fallida: ' + (why || '')));
  };
  SRV.gmForce = (gid, kind) => { const g = SRV.ali.g.find(x => x.id === gid); if (!g) return 'sin alianza'; let st = SRV.gm.get(g.id); if (!st) { st = { lastDay: 0, cur: null }; SRV.gm.set(g.id, st); } if (st.cur) return 'ya hay una'; return SRV.gmStart(g, st, SRV.gmOnline(g), kind) ? 'ok' : 'sin sitio'; };
  SRV.gmTick = () => {
    if (!SRV.pvp || !SRV.GM.on || SRV.paused || !NET.peers.length) return; const now = performance.now(), day = gmDay(), tod = GT.min % 1440, ids = new Set(SRV.ali.g.map(g => g.id));
    for (const [id, st] of SRV.gm) if (!ids.has(id)) { if (st.cur) SRV.gmEnd(null, st, false, 'La alianza se disolvió.'); SRV.gm.delete(id); }
    for (const g of SRV.ali.g) {
      let st = SRV.gm.get(g.id); if (!st) { st = { lastDay: 0, cur: null }; SRV.gm.set(g.id, st); } const on = SRV.gmOnline(g), m = st.cur;
      if (m) {
        if (!on.length) { SRV.gmEnd(g, st, false, 'Nadie del grupo sigue conectado.'); continue; } if (now > m.exp) { SRV.gmEnd(g, st, false, 'Se acabó el tiempo.'); continue; }
        if (m.k === 'nido') { m.prog = m.zs.filter(id => { const z = zById(id); return !z || z.st === 'dead'; }).length; if (m.prog >= Math.ceil(m.need * .9)) { SRV.gmEnd(g, st, true); continue; } }
        else { if (on.some(p => { const q = ppos(p); return Math.hypot(q[0] - m.x, q[1] - m.y) < 7; })) { m.prog++; if (m.prog % 10 === 0) makeNoise(m.x, m.y, 25); } if (now - m.wave > 20000) { m.wave = now; SRV.gmWave(m, on.length); } if (m.prog >= m.need) { SRV.gmEnd(g, st, true); continue; } }
        if (now - m.last > 5000) { m.last = now; for (const u of g.m) { const q = peerByUid(u); if (q) SRV.gmSend(q, m, 'upd'); } }
      } else if (on.length >= 2 && st.lastDay < day && tod >= SRV.GM.tod[0] && tod <= SRV.GM.tod[1]) {
        const base = ppos(on[0]), near = on.filter(p => { const q = ppos(p); return Math.hypot(q[0] - base[0], q[1] - base[1]) <= SRV.GM.near; }); if (near.length >= 2) SRV.gmStart(g, st, near);
      }
    }
  };
  setInterval(() => { try { SRV.gmTick(); } catch (e) { slog('error en misiones de grupo: ' + (e && e.message)); } }, 1000);
  /* ===== v15.7 · FASE 5 =====
     1) BOTÍN QUE REAPARECE (todas las salas del servidor): un mueble o caja que lleva «botinReapareceHoras» (3) vacío y sin nadie a < 40 casillas vuelve a tener botín (se puede registrar otra vez).
        No toca lo que construyen los jugadores, lo que tiene candado ni los maleteros. Funciona con cualquier versión de la app.
     2) BASES PROTEGIDAS CON LOS DUEÑOS DESCONECTADOS (todas las salas): la «base» es lo que está a ≤ 8 casillas de los candados de un jugador. Si todos sus dueños (y, en PvP, sus aliados)
        llevan más de «proteccionBasesMin» (10) minutos desconectados, no se pueden romper paredes/puertas/muebles ni forzar sus candados. Cualquier versión de la app.
     3) BANDIDOS Y RECOMPENSAS (PvP): matar a 3 jugadores inocentes en 24 h (ni traidores, ni bandidos, ni en defensa propia) te hace BANDIDO 24 h: nombre naranja, los comerciantes no te atienden,
        y quien te mate cobra una recompensa (botín extra en tu cuerpo). Morir quita el estado de bandido.
     4) COMERCIANTES (PvP): no comercian con traidores ni bandidos.
     5) TEMPORADAS (PvP): fin de temporada y ranking de bajas (los lleva el servidor, servidor.js). */
  SRV.LOOT = { h: +opt.loot || 0, far: 40 }; SRV.lootEmpty = new Map();
  SRV.lootTick = () => {
    if (!(SRV.LOOT.h > 0)) return 0; const now = Date.now(), lim = SRV.LOOT.h * 3600e3, live = NET.peers.filter(p => p.ready && p.rp).map(p => [p.rp.nx !== undefined ? p.rp.nx : p.rp.x, p.rp.ny !== undefined ? p.rp.ny : p.rp.y]); let n = 0;
    for (const [i, c] of containers) {
      if (i >= TRUNK_BASE || !c) continue; if (!(Array.isArray(c.items) && c.items.length === 0)) { SRV.lootEmpty.delete(i); continue; } if (BLD.pc.has(i) || LK.codes.has(i)) continue;
      const t0 = SRV.lootEmpty.get(i); if (!t0) { SRV.lootEmpty.set(i, now); continue; } if (now - t0 < lim) continue;
      const x = i % W, y = (i / W) | 0; if (live.some(q => Math.abs(q[0] - x) < SRV.LOOT.far && Math.abs(q[1] - y) < SRV.LOOT.far)) continue;
      c.items = null; SRV.lootEmpty.delete(i); try { netSend({ t: 'C', i, items: null }); } catch (e) { } if (++n >= 400) break;
    }
    if (n) slog('botín repuesto en ' + n + ' muebles/cajas vacíos'); return n;
  };
  setInterval(() => { try { SRV.lootTick(); } catch (e) { } }, 60000);
  SRV.PROT = { on: opt.prot !== false, ms: Math.max(1, +opt.protMin || 10) * 60000, r: 8 }; SRV.seen = new Map(); const bootT = Date.now();
  SRV.isOn = u => NET.peers.some(p => p.ready && p.uid === u);
  SRV.offFor = u => SRV.isOn(u) ? 0 : Date.now() - (SRV.seen.get(u) || bootT);
  SRV.baseOwners = i => { const x = i % W, y = (i / W) | 0, own = new Set(); for (const [j, L] of LK.codes) { if (!L || !L.u || L.u[0] === 's') continue; if (Math.abs((j % W) - x) <= SRV.PROT.r && Math.abs(((j / W) | 0) - y) <= SRV.PROT.r) own.add(L.u); } return own; };
  SRV.isProtected = (i, w) => {
    if (!SRV.PROT.on) return false; const own = SRV.baseOwners(i); if (!own.size) return false; if (w && w.uid && (own.has(w.uid) || [...own].some(u => SRV.allied && SRV.allied(u, w.uid)))) return false;
    for (const u of own) { if (SRV.offFor(u) < SRV.PROT.ms) return false; const g = SRV.grp && SRV.grp(u); if (g && g.m.some(m => SRV.offFor(m) < SRV.PROT.ms)) return false; }
    return true;
  };
  const protMsg = w => { try { const p = NET.peers.find(q => q.slot === (w && w.slot)); if (!p) return; const now = performance.now(); if (now - (p.protMsgT || 0) < 6000) return; p.protMsgT = now; netSendRaw(p, { t: 'say', m: 'Base protegida: sus dueños están desconectados. No se puede asaltar ahora.', c: 'bad' }); } catch (e) { } };
  { const _d = lkDamageH; lkDamageH = function (i, d, w) { if (SRV.isProtected(i, w)) { protMsg(w); return; } return _d.apply(this, arguments); }; }
  { const _f0 = lkForceStartH; lkForceStartH = function (i, how, w) { if (SRV.isProtected(i, w)) { protMsg(w); return; } return _f0.apply(this, arguments); }; }
  { const _f1 = lkForceH; lkForceH = function (i, how, w) { if (SRV.isProtected(i, w)) return { ok: false, m: 'Base protegida: sus dueños están desconectados.' }; return _f1.apply(this, arguments); }; }
  SRV.BAND = { n: 3, win: 864e5, dur: 864e5 };
  SRV.isBandit = u => { const x = SRV.ali.b && SRV.ali.b[u]; if (!x) return 0; if (x <= Date.now()) { delete SRV.ali.b[u]; SRV.aliSave(); return 0; } return x - Date.now(); };
  SRV.seasonTop = () => Object.entries(SRV.ali.k || {}).map(([u, v]) => ({ nombre: v.nm || '?', bajas: v.n | 0 })).sort((a, b) => b.bajas - a.bajas).slice(0, 10);
  SRV.tfin = +opt.tfin || 0;
  SRV.onKill = (att, vic) => {
    if (!SRV.pvp || !att || !vic || !att.uid || !vic.uid) return; const now = Date.now(), an = (att.rp && att.rp.name) || 'Jugador', vn = (vic.rp && vic.rp.name) || 'Jugador';
    SRV.ali.k = SRV.ali.k || {}; SRV.ali.b = SRV.ali.b || {}; SRV.ali.m = SRV.ali.m || {};
    const k = SRV.ali.k[att.uid] || (SRV.ali.k[att.uid] = { n: 0, nm: an }); k.n++; k.nm = an;
    const vBand = SRV.isBandit(vic.uid) > 0, vTrait = SRV.traitLeft(vic.uid) > 0, selfDef = !!(att.atkBy && att.atkBy[vic.uid] && performance.now() - att.atkBy[vic.uid] < 300e3);
    if (vBand) {                                                                       /* recompensa por la cabeza de un bandido */
      delete SRV.ali.b[vic.uid]; const r = vic.rp, x0 = r ? (r.nx !== undefined ? r.nx : r.x) : 0, y0 = r ? (r.ny !== undefined ? r.ny : r.y) : 0, out = [];
      const add = (id, c) => { if (!ITEMS[id]) return; const it = mkItem(id, c || 1); if (ITEMS[id].gun) it.a = ITEMS[id].mag; out.push(it); }; add('ammo9', 30); add('ammo762', 10); add('medkit', 1); add('bandage', 3); add(['revolver', 'shotgun', 'rifle'][(Math.random() * 3) | 0], 1);
      for (const it of out) { const a = Math.random() * 6.283, d = Math.random() * 1.1; floorItems.push({ x: x0 + Math.cos(a) * d, y: y0 + Math.sin(a) * d, it, t0: TIME }); }
      SRV.aliSay(att, 'Cobraste la recompensa por el bandido ' + vn + ': ' + out.length + ' objetos más en su cuerpo.', 'good'); for (const q of NET.peers) if (q.ready && q !== att) SRV.aliSay(q, an + ' acabó con el bandido ' + vn + ' y cobró la recompensa.', 'tip');
      slog('RECOMPENSA: ' + an + ' mató al bandido ' + vn);
    } else if (!vTrait && !selfDef) {                                                  /* asesinato de un inocente */
      const L = (SRV.ali.m[att.uid] || []).filter(t => t > now - SRV.BAND.win); L.push(now); SRV.ali.m[att.uid] = L.slice(-10);
      if (L.length >= SRV.BAND.n) { const was = SRV.isBandit(att.uid) > 0; SRV.ali.b[att.uid] = now + SRV.BAND.dur; if (!was) { for (const q of NET.peers) if (q.ready) SRV.aliSay(q, q === att ? 'Has matado a ' + L.length + ' inocentes: eres BANDIDO durante 24 h. Hay recompensa por tu cabeza y los comerciantes no te atienden.' : '⚠ ' + an + ' es ahora un BANDIDO: hay recompensa por su cabeza.', 'bad'); slog('BANDIDO: ' + an + ' (' + L.length + ' asesinatos en 24 h)'); } }
    }
    SRV.aliSave(); try { SRV.aliSend(att); } catch (e) { }
  };
  { const _no = netNpcOpen; netNpcOpen = function (o) {
      try { const peer = NET.cur; if (SRV.pvp && peer && peer.uid && (SRV.traitLeft(peer.uid) > 0 || SRV.isBandit(peer.uid) > 0)) { const n = NPCS.find(q => q.id === o.id), T = n && NT[n.type]; if (T && T.shop) { netSend({ t: 'NS', id: o.id, no: 1 }); SRV.aliSay(peer, (n.name || T.n) + ': «No hago tratos con ' + (SRV.isBandit(peer.uid) > 0 ? 'bandidos' : 'traidores') + '.»', 'bad'); return; } } } catch (e) { }
      return _no.apply(this, arguments);
    }; }
  /* ===== v15.8 · FASE 6: LIBRO DE INVENTARIO Y MOVIMIENTO (salas PvP, app 15.8+) =====
     INVENTARIO: el servidor apunta de dónde saca cada jugador los objetos VALIOSOS (armas de fuego, munición —también la cargada—, botiquines, chalecos/cascos, armas cuerpo a cuerpo fuertes):
       suelo que recoge cerca · muebles y maleteros que vacía cerca (comprobando que lo que «sale» de un mueble nuevo cabe en su tabla de botín) · cadáveres de zombis (lo que dice su uniforme) ·
       comerciantes (su existencia baja) · fabricar (deben gastarse los ingredientes) · descargar un arma (la munición cuenta junta).
       Cuando el jugador sube su personaje, cada objeto valioso de más debe tener origen. Hay una pequeña tolerancia (12 «puntos» por hora) para lo que no se vea; lo que la supere NO SE GUARDA,
       no cuenta como «arma que lleva» para atacar a otros y suma avisos. El jugador se entera con un aviso.
     MOVIMIENTO: con más de 9 casillas/s a pie o 32 en coche (con margen), el servidor se queda con la última posición válida (es la que usa para los golpes) y, si se repite, devuelve al jugador a ella. */
  SRV.AUD = { on: !!SRV.pvp && opt.audit !== false, minB: 155, slack0: 12, slackH: 12, slackMax: 24, credMs: 15 * 60e3 };
  SRV.MOV = { on: !!SRV.pvp && opt.mov !== false, foot: 9, car: 16, slack: 2.5, bank: 3 };
  const audOn = peer => SRV.AUD.on && peer && (peer.build | 0) >= SRV.AUD.minB;
  SRV.valOf = id => { const d = ITEMS[id]; if (!d) return 0; if (d.gun) return 30; if (d.t === 'ammo') return .15; if (id === 'medkit') return 3; if (d.t === 'cloth' && d.prot >= .4) return 5; if (d.t === 'wpn' && d.dmg >= 50) return 3; return 0; };
  SRV.invCount = inv => { const all = {}; for (const it of (inv || [])) { if (!it || !ITEMS[it.id]) continue; const d = ITEMS[it.id], n = d.stack ? Math.max(0, it.n | 0) : 1; all[it.id] = (all[it.id] || 0) + n; if (d.gun && d.ammo && (it.a | 0) > 0) all[d.ammo] = (all[d.ammo] || 0) + (it.a | 0); } return all; };
  SRV.audInit = peer => peer.aud || (peer.aud = { prev: SRV.invCount(peer.chBlob ? peer.chBlob.P.inv : [mkItem('knife'), mkItem('bandage', 2)]), slack: SRV.AUD.slack0, t: Date.now() });
  SRV.cred = (peer, id, n) => { if (!audOn(peer) || !(n > 0) || !(SRV.valOf(id) > 0)) return; const D = peer.dropd || (peer.dropd = {}), u = Math.min(n, D[id] || 0); if (u) { D[id] -= u; n -= u; } if (!(n > 0)) return; (peer.cr || (peer.cr = [])).push({ id, n, t: Date.now() }); if (peer.cr.length > 400) peer.cr.splice(0, peer.cr.length - 400); };
  /* soltar algo valioso (al suelo o a un mueble): ¿lo tenía de verdad? devuelve cuánto está respaldado */
  SRV.take = (peer, id, n) => {
    if (!audOn(peer) || !(SRV.valOf(id) > 0)) return n; const A = SRV.audInit(peer), D = peer.dropd || (peer.dropd = {}), now = Date.now(); let r = n, ok = 0;
    for (const q of (peer.rel || [])) { if (r <= 0) break; if (q.id !== id || q.n <= 0 || now - q.t > 20000) continue; const u = Math.min(r, q.n); q.n -= u; r -= u; ok += u; }   /* lo que acaba de salir de su inventario (el guardado llegó antes que el aviso) */
    const base = Math.max(0, (A.prev[id] || 0) - (D[id] || 0)), u1 = Math.min(r, base); D[id] = (D[id] || 0) + u1; r -= u1; ok += u1;
    for (const c of (peer.cr || [])) { if (r <= 0) break; if (c.id !== id || c.n <= 0 || now - c.t > SRV.AUD.credMs) continue; const u = Math.min(r, c.n); c.n -= u; r -= u; ok += u; }
    return ok;
  };
  SRV.FAKE = new WeakSet();   /* objetos del suelo sin respaldo: recogerlos no cuenta */
  const itParts = it => { const d = ITEMS[it.id], o = [[it.id, d.stack ? Math.max(1, it.n | 0) : 1]]; if (d.gun && d.ammo && (it.a | 0) > 0) o.push([d.ammo, it.a | 0]); return o; };
  SRV.credIt = (peer, it) => { if (!it || !ITEMS[it.id]) return; const d = ITEMS[it.id]; SRV.cred(peer, it.id, d.stack ? Math.max(1, it.n | 0) : 1); if (d.gun && d.ammo && (it.a | 0) > 0) SRV.cred(peer, d.ammo, it.a | 0); };
  SRV.vpos = p => p.mv ? [p.mv.x, p.mv.y] : [p.rp.nx !== undefined ? p.rp.nx : p.rp.x, p.rp.ny !== undefined ? p.rp.ny : p.rp.y];
  const contPos = i => { if (i >= TRUNK_BASE) { const c = cars.find(q => TRUNK_BASE + q.id === i); return c ? [c.x, c.y] : null; } return [(i % W) + .5, ((i / W) | 0) + .5]; };
  const bag = items => { const m = new Map(); for (const it of (items || [])) { if (!it || !ITEMS[it.id]) continue; const k = it.id; m.set(k, (m.get(k) || []).concat([it])); } return m; };
  /* ¿lo que aparece en un mueble registrado por primera vez cabe en su tabla de botín? */
  SRV.lootOk = (c, items) => {
    try {
      if (!c || !Array.isArray(items)) return true; const grp = c.k === O_CAR ? LOOT.car : (LOOT[c.bk] || LOOT.house), tb_ = grp[c.k] || grp.def || LOOT.house.def, ok = new Set(tb_.t.map(q => q[0]));
      const maxN = (tb_.n[1] + 1) * (c.bonus ? 2 : 1) + 2; if (items.length > maxN) return false;
      for (const it of items) { if (!it || !ITEMS[it.id]) return false; if (SRV.valOf(it.id) > 0 && !ok.has(it.id) && it.id !== c.force) return false; if ((it.n | 0) > 40) return false; if (ITEMS[it.id].gun && (it.a | 0) > ITEMS[it.id].mag) return false; }
      return true;
    } catch (e) { return true; }
  };
  { const _al = netApplyList; netApplyList = function (o) {
      try {
        const peer = NET.role === 'host' ? NET.cur : null;
        if (audOn(peer) && o && o.n === 'f' && peer.rp) {
          const m = NET.fsh, q = SRV.vpos(peer);
          for (const k of (Array.isArray(o.del) ? o.del : [])) { const f = m && m.get(k); if (f && f.it && !SRV.FAKE.has(f) && Math.hypot(f.x - q[0], f.y - q[1]) < 6) SRV.credIt(peer, f.it); }
          for (const e of (Array.isArray(o.add) ? o.add : [])) { const f = e && e[1]; if (!f || !f.it || !ITEMS[f.it.id] || (m && m.has(e[0]))) continue; let ok = Math.hypot((+f.x) - q[0], (+f.y) - q[1]) < 6; for (const [id, n] of itParts(f.it)) if (SRV.valOf(id) > 0 && SRV.take(peer, id, n) < n) ok = false; if (!ok && itParts(f.it).some(x => SRV.valOf(x[0]) > 0)) SRV.FAKE.add(f); }
        }
      } catch (e) { }
      return _al.apply(this, arguments);
    }; }
  { const _ac = netApplyCont; netApplyCont = function (o) {
      try {
        const peer = NET.role === 'host' ? NET.cur : null;
        if (audOn(peer) && o && typeof o.i === 'number' && peer.rp) {
          const c = containers.get(o.i), old = c ? c.items : null, pos = contPos(o.i), q = SRV.vpos(peer), near = pos && Math.hypot(pos[0] - q[0], pos[1] - q[1]) < 5;
          if (!Array.isArray(old) && Array.isArray(o.items)) { if (!near || !SRV.lootOk(o.i >= TRUNK_BASE ? { k: O_CAR, bk: 'car' } : (c && c.k !== undefined ? c : { k: to[o.i], bk: 0 }), o.items)) { SRV.strike(peer, 1, 'contenido imposible en un mueble'); return; } }
          else if (Array.isArray(old) && Array.isArray(o.items) && c) {
            const a0 = SRV.invCount(old), a1 = SRV.invCount(o.items), fk = c.fk || (c.fk = {});
            for (const id of new Set(Object.keys(a0).concat(Object.keys(a1)))) {
              if (!(SRV.valOf(id) > 0)) continue; const d = (a1[id] || 0) - (a0[id] || 0);
              if (d > 0) { const ok = near ? SRV.take(peer, id, d) : 0; if (ok < d) fk[id] = (fk[id] || 0) + (d - ok); }
              else if (d < 0) { const n = -d, f = Math.min(n, fk[id] || 0); if (f) fk[id] -= f; if (near && n - f > 0) SRV.cred(peer, id, n - f); }
            }
          }
        }
      } catch (e) { }
      return _ac.apply(this, arguments);
    }; }
  { const _nu = netNpcUpdate; netNpcUpdate = function (o) {
      try { const peer = NET.role === 'host' ? NET.cur : null; if (audOn(peer) && o && Array.isArray(o.stock) && peer.rp) { const n = NPCS.find(x => x.id === o.id), q = SRV.vpos(peer); if (n && Array.isArray(n.stock) && Math.hypot(n.x - q[0], n.y - q[1]) < 5) { const nw = new Map(o.stock.map(a => [a[0], +a[1] || 0])); for (const [id, c0] of n.stock) { const c1 = nw.has(id) ? nw.get(id) : 0; if (c0 > c1) SRV.cred(peer, id, c0 - c1); } } } } catch (e) { }
      return _nu.apply(this, arguments);
    }; }
  SRV.corpseLoot = (peer, o) => {
    if (!audOn(peer) || !peer.rp) return; const z = zById(o.id), q = SRV.vpos(peer); if (!z || z.st !== 'dead' || z.lootedBy || Math.hypot(z.x - q[0], z.y - q[1]) > 3.5) return; z.lootedBy = peer.uid;
    const J = z.job && typeof S88_JOB !== 'undefined' ? S88_JOB[z.job] : null, tab = new Map(J ? J.t.map(e => [e[0], e[3]]) : []);
    const pr = new Map(J ? J.t.map(e => [e[0], e[1]]) : []); if (J) peer.corpN = (peer.corpN | 0) + 1; const RA = peer.rare || (peer.rare = {});
    for (const e of (Array.isArray(o.it) ? o.it.slice(0, 12) : [])) { const id = e && e[0], n = Math.max(1, e[1] | 0); if (!ITEMS[id] || !(SRV.valOf(id) > 0)) continue; if (!tab.has(id) || n > Math.max(1, tab.get(id))) { SRV.strike(peer, .5, 'cadáver con ' + id + ' imposible'); continue; }
      const p_ = pr.get(id) || 1; if (p_ < .15) { if ((RA[id] | 0) >= 1 + peer.corpN * p_ * 2) { slog('demasiada suerte con ' + id + ' en cadáveres: ' + who(peer)); continue; } RA[id] = (RA[id] | 0) + 1; }   /* un arma «del 5 %» en cada cadáver no cuela */
      SRV.cred(peer, id, n); if (ITEMS[id].gun && ITEMS[id].ammo) SRV.cred(peer, ITEMS[id].ammo, Math.min(3, e[2] | 0)); }
  };
  /* ¿de dónde salió cada objeto valioso de más? final=false: si falta algo, se espera (el aviso de «recogí/compré» puede llegar después del guardado) */
  SRV.audit = (peer, cv, final) => {
    const now = Date.now(), cur = SRV.invCount(cv.P.inv), A = SRV.audInit(peer);
    A.slack = Math.min(SRV.AUD.slackMax, A.slack + (now - A.t) / 3600e3 * SRV.AUD.slackH); A.t = now;
    const cr = (peer.cr || []).filter(c => now - c.t < SRV.AUD.credMs).map(c => Object.assign({}, c));
    const miss = []; let pts = 0;
    for (const id in cur) {
      const v = SRV.valOf(id); if (!(v > 0)) continue; let r = cur[id] - (A.prev[id] || 0); if (r <= 0) continue;
      for (const c of cr) { if (r <= 0) break; if (c.id !== id || c.n <= 0) continue; const u = Math.min(r, c.n); c.n -= u; r -= u; }
      if (r > 0) { miss.push([id, r]); pts += r * v; }
    }
    const commit = keepCnt => { const D = peer.dropd || {}, rel = (peer.rel || []).filter(q => q.n > 0 && now - q.t < 20000); for (const id in A.prev) { if (!(SRV.valOf(id) > 0)) continue; const d = A.prev[id] - (keepCnt[id] || 0) - (D[id] || 0); if (d > 0) rel.push({ id, n: d, t: now }); } peer.rel = rel.slice(-200); peer.cr = cr.filter(c => c.n > 0); A.prev = keepCnt; peer.dropd = {}; A.waitT = 0; };
    if (!miss.length || pts <= A.slack) { if (pts) A.slack -= pts; commit(cur); return { cv, cut: false }; }
    if (!final) { if (!A.waitT) A.waitT = now; if (now - A.waitT < 6000) return { wait: true }; }
    /* sin origen: no se guarda */
    const inv = cv.P.inv.map(it => Object.assign({}, it)), gone = [];
    for (const [id, r0] of miss) { let r = r0; const d = ITEMS[id];
      if (d.t === 'ammo') { for (const it of inv) { if (r <= 0) break; if (it.id === id && (it.n | 0) > 0) { const u = Math.min(r, it.n | 0); it.n -= u; r -= u; } } for (const it of inv) { if (r <= 0) break; const g = ITEMS[it.id]; if (g && g.gun && g.ammo === id && (it.a | 0) > 0) { const u = Math.min(r, it.a | 0); it.a -= u; r -= u; } } }
      else if (d.stack) { for (const it of inv) { if (r <= 0) break; if (it.id === id) { const u = Math.min(r, it.n | 0); it.n -= u; r -= u; } } }
      else { for (let k = inv.length - 1; k >= 0 && r > 0; k--) if (inv[k].id === id && !inv[k]._x) { inv[k]._x = 1; r--; } }
      gone.push((d.n || id) + ' ×' + r0);
    }
    const keep = inv.filter(it => !it._x && (!ITEMS[it.id].stack || (it.n | 0) > 0)), ncv = JSON.parse(JSON.stringify(cv)); ncv.P.inv = keep.map(it => { const o = Object.assign({}, it); delete o._x; return o; });
    const remap = k => { if (!(k >= 0) || !inv[k]) return -1; return keep.indexOf(inv[k]); };
    ncv.P.eq = remap(cv.P.eq); ncv.P.cloth = {}; for (const sl in (cv.P.cloth || {})) { const j = remap(cv.P.cloth[sl]); if (j >= 0) ncv.P.cloth[sl] = j; }
    commit(SRV.invCount(keep)); const D = A.deny || (A.deny = {}); let fresh = false; for (const [id, r] of miss) { if (r > (D[id] || 0)) { fresh = true; D[id] = r; } }
    try { netSendRaw(peer, { t: 'IV', rm: miss }); } catch (e) { }   /* el teléfono también lo quita */
    if (fresh) { SRV.strike(peer, 1, 'inventario sin origen: ' + gone.join(', ')); slog('INVENTARIO SOSPECHOSO de ' + who(peer) + ': ' + gone.join(', ') + ' (no se guarda)'); SRV.aliSay(peer, 'El servidor no reconoce de dónde salieron: ' + gone.join(', ') + '. Se quitan de tu personaje.', 'bad'); }
    return { cv: ncv, cut: true };
  };
  /* fabricar: el teléfono avisa al terminar; se acredita lo fabricado con un ritmo máximo (lo que tarda de verdad) */
  SRV.craftMsg = (peer, o) => {
    if (!audOn(peer) || !o) return; const r = RECIPES.find(q => q.id === o.id); if (!r || !Array.isArray(r.out) || r.place) return; const now = performance.now();
    if (now - (peer.crfT || -1e9) < (r.t || 1) * 600) { SRV.strike(peer, .3, 'fabricar demasiado rápido'); return; } peer.crfT = now;
    const H = peer.crfH = (peer.crfH || []).filter(t => now - t < 3600e3); if (H.length >= 40) return; H.push(now);
    for (const [id, n] of r.out) SRV.cred(peer, id, n);
  };
  /* movimiento */
  SRV.moveCheck = (peer, o) => {
    if (!SRV.MOV.on || !peer || !o) return; if (o.k || peer.chDead) { peer.mv = null; return; } if (!isFinite(o.x) || !isFinite(o.y)) return; const now = performance.now();
    if (!peer.mv) { peer.mv = { x: +o.x, y: +o.y, t: now, bad: 0 }; return; }
    /* «tiempo de viaje» acumulado (hasta 3 s): los mensajes que llegan juntos tras un corte de red no cuentan como trampa */
    const M = peer.mv, v = o.v ? SRV.MOV.car : SRV.MOV.foot; M.t = Math.max(M.t, now - SRV.MOV.bank * 1000); const dt = Math.max(0, (now - M.t) / 1000), d = Math.hypot(o.x - M.x, o.y - M.y), lim = v * dt + SRV.MOV.slack;
    if (d <= lim) { M.x = +o.x; M.y = +o.y; M.t = Math.min(now, M.t + Math.max(0, d - SRV.MOV.slack * .5) / v * 1000); M.bad = 0; return; }
    M.bad++; peer.mvRej = (peer.mvRej | 0) + 1;
    if (M.bad >= 3) { M.bad = 0; M.t = now; SRV.strike(peer, 1, 'movimiento imposible (' + d.toFixed(1) + ' casillas en ' + dt.toFixed(2) + ' s)'); try { netSendRaw(peer, { t: 'PZ', x: Math.round(M.x * 100) / 100, y: Math.round(M.y * 100) / 100 }); } catch (e) { } }
  };
  { const _m = netMsg; netMsg = function (o) {
      const peer = NET.role === 'host' ? NET.cur : null;
      if (peer && o && typeof o.t === 'string') {
        if (o.t === 'hi') {
          peer.build = o.b | 0;
          if (SRV.minB && peer.build < SRV.minB) { try { netSendRaw(peer, { t: 'end', m: 'Esta sala pide una versión más reciente de la app. Actualiza Último Refugio desde Google Play.' }); } catch (e) { } setTimeout(() => { try { netPeerLost(peer, true); } catch (e) { } }, 400); slog('versión antigua rechazada: ' + who(peer) + ' build ' + peer.build); return; }
          if (SRV.auth && peer.build >= 147 && !peer.chDone) {
            peer.chDone = 1; const self = this, args = arguments;
            charCall('get', peer.uid, '').then(r => {
              if (!NET.peers.includes(peer)) return;
              if (r && r.ok) { let rec = r.c || null; const cv0 = rec ? SRV.charValid(rec) : null; if (!cv0) rec = null; else { peer.chBlob = cv0; peer.chInv = new Set(cv0.P.inv.map(i => i.id)); } peer.chAu = 1; peer.chRec = rec; } else { peer.chAu = 0; slog('almacén de personajes no disponible para ' + who(peer)); }
              netCtx(peer, () => _m.apply(self, args));
            });
            return;
          }
        } else if (o.t === 'CHS') { SRV.charPut(peer, o.c); return; }
        else if (o.t === 'AP' || o.t === 'AA' || o.t === 'AD' || o.t === 'AL' || o.t === 'SG') { if (SRV.pvp) SRV.aliMsg(peer, o); return; }
        else if (o.t === 'CL') { try { SRV.corpseLoot(peer, o); } catch (e) { } return; }
        else if (o.t === 'CR') { try { SRV.craftMsg(peer, o); } catch (e) { } return; }
        else if (o.t === 'PH') { if (SRV.pvp) SRV.pvpAttack(peer, o); return; }
        else if ((o.t === 'HZ' || o.t === 'HN') && SRV.val && !SRV.hitOk(peer, o)) return;
      }
      return _m.apply(this, arguments);
    }; }
  /* ----- v15.1 · VIDA CON AUTORIDAD DEL SERVIDOR (salas PvP) -----
     El anfitrión lleva su propia cuenta de la vida de cada jugador («A»): puede bajar con lo que el cliente cuente (daño que se hace a sí mismo), pero solo SUBE hasta un presupuesto de curación
     (30 al entrar, +2 por segundo, máximo 80): una curación legítima cabe, un «vida infinita» no. El daño entre jugadores (fase 2) se aplica aquí, con SRV.pvpHurt.
     Si A llega a 0, el anfitrión declara la muerte y borra el personaje del servidor aunque el cliente trucado ignore el aviso o no la comunique. */
  SRV.hpSync = (peer, h) => {
    if (!isFinite(h)) return; const now = performance.now();
    if (peer.A === undefined) { peer.A = Math.max(0, Math.min(120, h)); peer.bud = 30; peer.hpT = now; peer.protUntil = now + SRV.PV.prot; try { SRV.aliJoin(peer); } catch (e) { } try { netSendRaw(peer, { t: 'say', m: 'Protección de aparición: ' + Math.round(SRV.PV.prot / 1000) + ' s sin que otros jugadores puedan dañarte (termina si atacas).', c: 'tip' }); } catch (e) { } return; }
    const dt = Math.min(2, Math.max(0, (now - peer.hpT) / 1000)); peer.hpT = now; peer.bud = Math.min(80, peer.bud + dt * 2);
    if (h <= peer.A) peer.A = Math.max(0, h);
    else { const inc = h - peer.A, ok = Math.min(inc, peer.bud); peer.A += ok; peer.bud -= ok;
      if (inc > ok + 2 && now - (peer.hpMsgT || 0) > 1000) { peer.hpMsgT = now; peer.hpFix = (peer.hpFix | 0) + 1; netSendRaw(peer, { t: 'HP', h: Math.round(peer.A) }); if (peer.hpFix <= 3 || peer.hpFix % 20 === 0) slog('vida corregida de ' + who(peer) + ' (decía ' + Math.round(h) + ', permitido ' + Math.round(peer.A) + ')'); } }
    if (peer.A <= 0) SRV.pvpKill(peer, null);
  };
  /* ----- v15.2 · COMBATE ENTRE JUGADORES (solo salas PvP) -----
     El cliente solo dice «apunté a X con el arma W» (PH). El anfitrión decide TODO: que el atacante tenga esa arma en su mochila guardada, que no sea un arma equivocada para el ataque, alcance, línea de visión, cadencia,
     protección de aparición, zonas seguras, si acierta (puntería) y cuánto daño hace (tabla de armas × factor PvP). Lo imposible suma «avisos» y se expulsa. */
  SRV.PV = { prot: 20000, safeR: 10, fMelee: .6, fGun: .55, combat: 20000 };
  SRV.safe = (x, y) => { for (const n of NPCS) { if (n.st === 'dead') continue; const T = NT[n.type]; if (T && T.shop && Math.hypot(n.x - x, n.y - y) < SRV.PV.safeR) return true; } return false; };
  SRV.strike = (peer, wgt, why) => {
    const now = performance.now(), b = peer.hb || (peer.hb = { tk: 120, t: now, s: 0 }); b.s = Math.max(0, b.s - Math.max(0, now - (b.pt || now)) / 2000); b.pt = now; b.s += wgt; peer.rej = (peer.rej | 0) + 1;
    if (now - (peer.rejLog || 0) > 10000) { peer.rejLog = now; slog('ataque rechazado de ' + who(peer) + ': ' + why + ' · total ' + peer.rej); }
    if (b.s >= 12 && !peer.kicked) { peer.kicked = 1; slog(who(peer) + ' expulsado por ataques inválidos repetidos'); try { netSendRaw(peer, { t: 'end', m: 'Conexión cerrada: actividad sospechosa.' }); } catch (e) { } setTimeout(() => { try { netPeerLost(peer, true); } catch (e) { } }, 300); }
  };
  SRV.dropLoot = peer => {
    try {
      const b = peer.chBlob, r = peer.rp; if (!b || !b.P || !Array.isArray(b.P.inv) || !r) return 0; const x0 = r.nx !== undefined ? r.nx : r.x, y0 = r.ny !== undefined ? r.ny : r.y; let n = 0;
      for (const it of b.P.inv) { if (!okIt(it)) continue; const a = Math.random() * 6.283, d = Math.random() * 1.1; let x = x0 + Math.cos(a) * d, y = y0 + Math.sin(a) * d; if (solidTile(Math.floor(x), Math.floor(y))) { x = x0; y = y0; } floorItems.push({ x, y, it: Object.assign({}, it), t0: TIME }); n++; }
      peer.chBlob = null; return n;
    } catch (e) { return 0; }
  };
  SRV.pvpHurt = (peer, dmg, by, att) => {
    if (!SRV.pvp || !peer || peer.A === undefined || peer.chDead || !(dmg > 0)) return false; peer.A = Math.max(0, peer.A - dmg); peer.lastCombat = performance.now();
    if (peer.A <= 0) SRV.pvpKill(peer, by, false, att); else netSendRaw(peer, { t: 'HP', h: Math.round(peer.A), by: by ? String(by).slice(0, 14) : undefined }); return true;
  };
  SRV.pvpKill = (peer, by, quiet, att) => {
    if (peer.chDead) return; peer.chDead = 1; peer.chPend = null; peer.A = 0; const nl = SRV.dropLoot(peer);
    if (!quiet) netSendRaw(peer, { t: 'HP', h: 0, k: 1, by: by ? String(by).slice(0, 14) : undefined }); if (SRV.auth && peer.chAu) charCall('del', peer.uid, '');
    if (att) { att.pk = (att.pk | 0) + 1; netSendRaw(att, { t: 'PX', n: (peer.rp && peer.rp.name) || '?', k: 1 }); try { SRV.onKill(att, peer); } catch (e) { } }
    slog(who(peer) + ' murió' + (by ? ' (' + by + ')' : '') + (quiet ? ' al desconectarse en combate' : '') + ': personaje borrado, ' + nl + ' objetos en el suelo');
    if (quiet) return;
    setTimeout(() => { try { if (NET.peers.includes(peer) && !(peer.rp && peer.rp.dead)) { netSendRaw(peer, { t: 'end', m: 'Moriste. Tu personaje se perdió.' }); setTimeout(() => { try { netPeerLost(peer, true); } catch (e) { } }, 400); } } catch (e) { } }, 2500);   /* un cliente honrado ya muestra su pantalla de muerte; solo se echa al que no comunicó su muerte */
  };
  SRV.pickSpawn = () => {
    if (!SRV.cands) {
      const near = [], other = []; for (let t = 0; t < 6000 && near.length < 60; t++) {
        const x = 8 + ((Math.random() * (W - 16)) | 0), y = 8 + ((Math.random() * (H - 16)) | 0), i = idx(x, y); if (to[i] || tb[i] || solidTile(x, y)) continue; const g = tg[i]; if (g === G_WATER || g === G_ROAD) continue; let free = true; for (let oy = -1; oy <= 1 && free; oy++) for (let ox = -1; ox <= 1; ox++) { const xx = x + ox, yy = y + oy; if (!inb(xx, yy) || to[idx(xx, yy)] || tb[idx(xx, yy)] || solidTile(xx, yy) || tg[idx(xx, yy)] === G_WATER) { free = false; break; } } if (!free) continue;   /* la casilla y sus 8 vecinas libres: el invitado aparece un poco desplazado y no debe quedar dentro de una pared */
        let coast = false; for (let k = 0; k < 8 && !coast; k++) { const a = k * .785, xx = Math.floor(x + Math.cos(a) * 7), yy = Math.floor(y + Math.sin(a) * 7); if (inb(xx, yy) && tg[idx(xx, yy)] === G_WATER) coast = true; }
        (coast ? near : other).push([x + .5, y + .5]);
      }
      SRV.cands = near.length >= 6 ? near : near.concat(other).slice(0, 80); if (!SRV.cands.length) SRV.cands = [SRV.spawn];
    }
    const live = NET.peers.filter(p => p.ready && p.rp && p.rp.ok).map(p => [p.rp.nx !== undefined ? p.rp.nx : p.rp.x, p.rp.ny !== undefined ? p.rp.ny : p.rp.y]); let best = null, bd = -1;
    for (let k = 0; k < 14; k++) { const s = SRV.cands[(Math.random() * SRV.cands.length) | 0]; let md = 1e9; for (const q of live) md = Math.min(md, Math.hypot(q[0] - s[0], q[1] - s[1])); if (md > bd) { bd = md; best = s; } }
    return best || SRV.spawn;
  };
  SRV.pvpAttack = (peer, o) => {
    const now = performance.now(), vic = NET.peers.find(p => p.slot === (o.i | 0) && p.ready);
    if (!vic || vic === peer || !peer.rp || !vic.rp || peer.chDead || vic.chDead || peer.A === undefined || vic.A === undefined || peer.rp.dead || vic.rp.dead) return;
    const [ax, ay] = SRV.vpos(peer), [vx, vy] = SRV.vpos(vic), d = Math.hypot(vx - ax, vy - ay);   /* v15.8: posiciones validadas */
    const gun = o.s === 'g', Wp = o.w && ITEMS[o.w] && ITEMS[o.w].t === 'wpn' ? ITEMS[o.w] : null; let why = null;
    if (o.s !== 'g' && o.s !== 'm') why = 'tipo de ataque desconocido';
    else if (gun ? (!Wp || !Wp.gun) : (Wp && Wp.gun)) why = 'arma no válida para este ataque (' + o.w + ')';
    else if (Wp && SRV.auth && peer.chInv && !peer.chInv.has(o.w)) why = 'no lleva esa arma (' + o.w + ')';
    else if (d > (gun ? Wp.rng + 4 : (Wp ? Wp.rng : .85) + 2)) why = 'objetivo a ' + Math.round(d) + ' casillas';
    if (why) { SRV.strike(peer, 1, why); return; }
    if (now - (peer.pvT || 0) < (Wp ? Wp.spd : .45) * 600) { SRV.strike(peer, .1, 'cadencia'); return; } peer.pvT = now;
    if (gun && d > 2 && !losClear(ax, ay, vx, vy)) { SRV.strike(peer, .25, 'sin línea de visión'); return; }
    if (peer.protUntil && now < peer.protUntil) peer.protUntil = 0;                 /* atacar termina tu propia protección */
    if (vic.protUntil && now < vic.protUntil) return;                                 /* la víctima está protegida: sin efecto */
    if (SRV.safe(ax, ay) || SRV.safe(vx, vy)) { if (now - (peer.safeMsg || 0) > 5000) { peer.safeMsg = now; netSendRaw(peer, { t: 'say', m: 'Zona segura: aquí no se puede atacar a otros jugadores.', c: 'tip' }); } return; }
    peer.lastCombat = vic.lastCombat = now;
    vic.atkBy = vic.atkBy || {}; vic.atkBy[peer.uid] = now;                           /* anotado: «peer me atacó» (permite la defensa propia de la víctima) */
    const acc = gun ? Math.max(.4, Math.min(.95, .95 - d * .012)) : .85, np = gun ? (Wp.pellets || 1) : 1; let hits = 0; for (let k = 0; k < np; k++) if (Math.random() < (np > 1 ? acc * Math.max(.25, 1 - d / Wp.rng) : acc)) hits++;
    if (!hits) return;
    { const rel = SRV.rel(peer.uid, vic.uid), defensa = !!(peer.atkBy && peer.atkBy[vic.uid] && now - peer.atkBy[vic.uid] < SRV.AL.selfDefMs);   /* v15.3: herir a un aliado = traición, salvo defensa propia o si la víctima ya es Traidor */
      if (rel && !defensa && !SRV.traitLeft(vic.uid) && !SRV.traitLeft(peer.uid)) SRV.betray(peer, vic, rel); }
    const dmg = (Wp ? Wp.dmg : 7) * (gun ? SRV.PV.fGun : SRV.PV.fMelee) * hits * (.85 + Math.random() * .3), vn = (vic.rp && vic.rp.name) || '?', an = (peer.rp && peer.rp.name) || '?';
    const ok = SRV.pvpHurt(vic, dmg, an, peer); if (!ok) return; if (!vic.chDead) netSendRaw(peer, { t: 'PX', n: vn, k: 0 }); slog(an + ' → ' + vn + ': ' + Math.round(dmg) + ' (' + (Wp ? o.w : 'puños') + ', ' + d.toFixed(1) + ' casillas)' + (vic.chDead ? ' · MUERTE' : ''));
  };
  { const _op = netOnPlayer; netOnPlayer = function (o) {
      const r = _op.apply(this, arguments);
      try { const pe = NET.cur; if (SRV.pvp && pe && o && !pe.chDead && !o.k) SRV.hpSync(pe, +o.h); } catch (e) { }
      try { if (SRV.pvp && NET.cur && (NET.cur.build | 0) >= 155) SRV.moveCheck(NET.cur, o); } catch (e) { }
      try { const peer = NET.cur; if (peer && o && o.k && SRV.auth && peer.chAu && !peer.chDead) { if (SRV.pvp) SRV.dropLoot(peer); peer.chDead = 1; peer.chPend = null; if (SRV.muerte === true || (SRV.muerte !== false && !CASUAL)) { charCall('del', peer.uid, ''); slog(who(peer) + ' murió: personaje borrado'); } } } catch (e) { }
      return r;
    }; }
  { const _npl = netPeerLost; netPeerLost = function (peer, silent) { try { if (SRV.pvp && peer.A > 0 && !peer.chDead && performance.now() - (peer.lastCombat || -1e9) < SRV.PV.combat) SRV.pvpKill(peer, null, true); else SRV.charFlush(peer); } catch (e) { } try { if (peer && peer.uid) SRV.seen.set(peer.uid, Date.now()); } catch (e) { } try { if (SRV.pvp) { const u = peer.uid; setTimeout(() => { try { SRV.aliSendGroup(u); } catch (e) { } }, 80); } } catch (e) { } return _npl.apply(this, arguments); }; }   /* v15.2: cortar la conexión en pleno combate = morir (el cuerpo deja su botín) */
  { const _pl = SRV.players; SRV.players = () => _pl().map(x => { const p = NET.peers.find(q => q.slot === x.slot); return Object.assign(x, { build: p ? p.build | 0 : 0, rechazos: p ? p.rej | 0 : 0 }); }); }
  /* ===== v15.5 · PALIATIVO PARA LA APP ANTIGUA (anterior a la 15.5, versionCode < 152) =====
     Esas apps tienen un fallo de dibujo: pintan a CUALQUIER jugador cercano con los datos del «anfitrión» (por eso en las salas solo se veía un «Anfitrión» quieto en el punto de entrada y nunca a los demás).
     No se puede arreglar una app ya instalada, pero sí decidir qué «anfitrión» recibe: a esas apps se les manda, como si fuera el anfitrión, el JUGADOR MÁS CERCANO (posición, movimiento y aspecto reales).
     Resultado en una app antigua: ve moverse al jugador que tiene más cerca (uno a la vez, con el rótulo «Anfitrión»). La app 15.5 no lo necesita: ve a todos, con su nombre. */
  SRV.FIXB = 152; SRV.oldFix = opt.oldfix !== false;
  { const _nsF = netSend; netSend = function (o) {
      try {
        const peer = NET.role === 'host' ? NET.cur : null;
        if (SRV.oldFix && peer && o && o.t === 'S' && o.h && (peer.build | 0) < SRV.FIXB && !(peer.build >= 138 && peer.build <= 145) && peer.rp) {   /* 138–145 = apps 14.0.x, que ya traen el arreglo */
          const mx = peer.rp.nx !== undefined ? peer.rp.nx : peer.rp.x, my = peer.rp.ny !== undefined ? peer.rp.ny : peer.rp.y; let best = null, bd = 70 * 70;
          for (const q of NET.peers) { if (q === peer || !q.ready || !q.rp || !q.rp.ok || q.rp.dead) continue; const r = q.rp, x = r.nx !== undefined ? r.nx : r.x, y = r.ny !== undefined ? r.ny : r.y, d = (x - mx) * (x - mx) + (y - my) * (y - my); if (d < bd) { bd = d; best = q; } }
          if (best) {
            const r = best.rp, h = { x: r2(r.nx !== undefined ? r.nx : r.x), y: r2(r.ny !== undefined ? r.ny : r.y), d: r2(r.dir || 0), m: r.moving ? 1 : 0, r: r.run ? 1 : 0, s: r.sneak ? 1 : 0, z: r.sleep ? 1 : 0, hp: Math.round(r.hp === undefined ? 100 : r.hp), k: 0, v: r.drive ? 1 : 0, pose: r.pose, ph: r.ph, hu: r.hurt > 0 ? 1 : 0 };
            peer.fixN = (peer.fixN | 0) + 1; if (r.sp && r.sp.skin && (peer.fixSlot !== best.slot || peer.fixN % 10 === 0)) h.sp = r.sp; peer.fixSlot = best.slot;
            o = Object.assign({}, o, { h });
          } else if (peer.fixSlot) { peer.fixSlot = 0; o = Object.assign({}, o, { h: Object.assign({}, o.h, { sp: netSpecNow() }) }); }
        }
      } catch (e) { }
      return _nsF.call(this, o);
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
    SRV.frames = (SRV.frames | 0) + 1;
    const busy = !!(NET.peers && NET.peers.length);
    if (P && !P.dead) { P.ghost = 1e9; P.hp = 100; P.hun = Math.min(P.hun, 8); P.thi = Math.min(P.thi, 8); P.fat = Math.min(P.fat, 5); P.inf = 0; P.sick = 0; P.wounds.length = 0; P.sleep = false; P.cold = 0;
      /* con gente: el anfitrión está en el punto de entrada (ahí aparecen los invitados); vacío: aparcado lejos */
      const t = busy || !SRV.park ? SRV.spawn : SRV.park; if (t && (SRV.ticks++ % 30 === 0 || busy !== SRV.lastBusy)) { P.x = t[0]; P.y = t[1]; } SRV.lastBusy = busy; }
    if (!busy && SRV.pauseEmpty) { SRV.paused = true; return; }
    SRV.paused = false; return _ug.apply(this, arguments);
  };
};
