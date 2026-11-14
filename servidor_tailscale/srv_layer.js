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
  { const _nsw = netSendWorld; netSendWorld = function () { try { if (SRV.spawn && P) { const sp = SRV.pvp && SRV.pickSpawn ? SRV.pickSpawn() : SRV.spawn; P.x = sp[0]; P.y = sp[1]; SRV.lastBusy = true; } } catch (e) { } return _nsw.apply(this, arguments); }; }
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
  SRV.charPut = (peer, c) => {
    if (!SRV.auth || !peer.chAu || peer.chDead) return;
    const cv = SRV.charValid(c); if (!cv) { peer.chBadN = (peer.chBadN | 0) + 1; if (peer.chBadN <= 3) slog('personaje rechazado de ' + who(peer) + ' (formato o valores no válidos)'); return; }
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
    if (peer.A === undefined) { peer.A = Math.max(0, Math.min(120, h)); peer.bud = 30; peer.hpT = now; peer.protUntil = now + SRV.PV.prot; try { netSendRaw(peer, { t: 'say', m: 'Protección de aparición: ' + Math.round(SRV.PV.prot / 1000) + ' s sin que otros jugadores puedan dañarte (termina si atacas).', c: 'tip' }); } catch (e) { } return; }
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
    if (att) { att.pk = (att.pk | 0) + 1; netSendRaw(att, { t: 'PX', n: (peer.rp && peer.rp.name) || '?', k: 1 }); }
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
    const ax = peer.rp.nx !== undefined ? peer.rp.nx : peer.rp.x, ay = peer.rp.ny !== undefined ? peer.rp.ny : peer.rp.y, vx = vic.rp.nx !== undefined ? vic.rp.nx : vic.rp.x, vy = vic.rp.ny !== undefined ? vic.rp.ny : vic.rp.y, d = Math.hypot(vx - ax, vy - ay);
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
    const acc = gun ? Math.max(.4, Math.min(.95, .95 - d * .012)) : .85, np = gun ? (Wp.pellets || 1) : 1; let hits = 0; for (let k = 0; k < np; k++) if (Math.random() < (np > 1 ? acc * Math.max(.25, 1 - d / Wp.rng) : acc)) hits++;
    if (!hits) return;
    const dmg = (Wp ? Wp.dmg : 7) * (gun ? SRV.PV.fGun : SRV.PV.fMelee) * hits * (.85 + Math.random() * .3), vn = (vic.rp && vic.rp.name) || '?', an = (peer.rp && peer.rp.name) || '?';
    const ok = SRV.pvpHurt(vic, dmg, an, peer); if (!ok) return; if (!vic.chDead) netSendRaw(peer, { t: 'PX', n: vn, k: 0 }); slog(an + ' → ' + vn + ': ' + Math.round(dmg) + ' (' + (Wp ? o.w : 'puños') + ', ' + d.toFixed(1) + ' casillas)' + (vic.chDead ? ' · MUERTE' : ''));
  };
  { const _op = netOnPlayer; netOnPlayer = function (o) {
      const r = _op.apply(this, arguments);
      try { const pe = NET.cur; if (SRV.pvp && pe && o && !pe.chDead && !o.k) SRV.hpSync(pe, +o.h); } catch (e) { }
      try { const peer = NET.cur; if (peer && o && o.k && SRV.auth && peer.chAu && !peer.chDead) { if (SRV.pvp) SRV.dropLoot(peer); peer.chDead = 1; peer.chPend = null; if (SRV.muerte === true || (SRV.muerte !== false && !CASUAL)) { charCall('del', peer.uid, ''); slog(who(peer) + ' murió: personaje borrado'); } } } catch (e) { }
      return r;
    }; }
  { const _npl = netPeerLost; netPeerLost = function (peer, silent) { try { if (SRV.pvp && peer.A > 0 && !peer.chDead && performance.now() - (peer.lastCombat || -1e9) < SRV.PV.combat) SRV.pvpKill(peer, null, true); else SRV.charFlush(peer); } catch (e) { } return _npl.apply(this, arguments); }; }   /* v15.2: cortar la conexión en pleno combate = morir (el cuerpo deja su botín) */
  { const _pl = SRV.players; SRV.players = () => _pl().map(x => { const p = NET.peers.find(q => q.slot === x.slot); return Object.assign(x, { build: p ? p.build | 0 : 0, rechazos: p ? p.rej | 0 : 0 }); }); }
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
