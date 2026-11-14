#!/usr/bin/env node
/* Último Refugio · servidor multijugador por salas (pensado para Tailscale)
   - Sirve el juego (/juego/), una página de estado (/) y la lista de salas (/salas).
   - Relé de salas compatible con ntfy (/sig/…): así los jugadores se encuentran sin internet público.
   - Cada SALA es un mundo propio con un anfitrión sin pantalla (navegador Edge/Chrome) que carga su partida guardada.
     Las salas vacías se «duermen» (se guardan y se cierran) y se despiertan cuando alguien entra.
   - Solo escucha en localhost y en la dirección de Tailscale (100.x.x.x).
   Uso: node servidor.js   (ver LEEME_SERVIDOR.md) */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
let WebSocketServer; try { WebSocketServer = require('ws').WebSocketServer; } catch (e) { console.error('Falta el paquete «ws». Ejecuta INSTALAR (o: npm install).'); process.exit(1); }
let chromium; try { chromium = require('playwright-core').chromium; } catch (e) { try { chromium = require('playwright').chromium; } catch (e2) { console.error('Falta playwright-core. Ejecuta INSTALAR (o: npm install).'); process.exit(1); } }

const ROOT = __dirname;
const DEF = { puerto: 8080, nombreServidor: 'Servidor', salas: [{ id: 'SALA1', nombre: 'Refugio 1' }, { id: 'SALA2', nombre: 'Refugio 2' }], maxJugadores: 10, salasActivasMax: 3, dormirTrasMin: 10,
  semilla: '', modo: 'casual', dificultad: 'normal', tamano: 'huge', zombis: 1, botin: 1, lluvia: 1, mundo: 'region',
  simularSinJugadores: false, fpsServidor: 30, urlPublica: '', claveAdmin: '', maxConexionesPorIp: 20, conexionesPorMinutoIp: 40, registrosPorDiezMinIp: 60, reportesParaExpulsar: 3, exigirIdentidad: true, salasUsuario: true, gratisSalasMax: 1, gratisCaducaDias: 14, salas247Max: 2, simular247: false, salasUsuarioMax: 40, licenciaSalasPorDefecto: 3, guardarCadaSeg: 120, copias: 12, escuchar: 'tailscale', usarStunTurn: false, navegador: '', canal: '', carpetaDatos: 'datos', appUltima: null, autoridadPersonaje: true, validarDano: true, versionMinimaApp: 0, muerteBorraPersonaje: 'modo', personajeCaducaDias: 60, alianzaMax: 4, traidorHoras: 24 };
let CFG = Object.assign({}, DEF);
try { CFG = Object.assign(CFG, JSON.parse(fs.readFileSync(process.env.CONFIG || path.join(ROOT, 'config.json'), 'utf8'))); } catch (e) { if (e.code !== 'ENOENT') { console.error('config.json inválido:', e.message); process.exit(1); } }
if (process.env.PORT) CFG.puerto = +process.env.PORT;
if (process.env.ESCUCHAR) CFG.escuchar = process.env.ESCUCHAR;
if (process.env.NAVEGADOR) CFG.navegador = process.env.NAVEGADOR;
CFG.maxJugadores = Math.max(1, Math.min(40, CFG.maxJugadores | 0 || 10));   /* por defecto 10; probado con hasta 40 jugadores simulados */
const seen = new Set(); CFG.salas = (CFG.salas || []).map((r, i) => { const id = String(r.id || ('SALA' + (i + 1))).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); if (id.length < 4 || seen.has(id)) { console.error('Cada sala necesita un «id» único de 4 a 6 letras o números (' + id + ').'); process.exit(1); } seen.add(id); return Object.assign({}, r, { id, nombre: String(r.nombre || id).slice(0, 30) }); });
if (!CFG.salas.length) { console.error('Define al menos una sala en config.json'); process.exit(1); }
const DATA = path.resolve(ROOT, CFG.carpetaDatos); fs.mkdirSync(DATA, { recursive: true });
const crypto = require('crypto');
const sha = t => crypto.createHash('sha256').update(String(t)).digest('hex');
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')); } catch (e) { return d; } };
const writeJson = (f, o) => { const p = path.join(DATA, f); fs.writeFileSync(p + '.tmp', JSON.stringify(o, null, 1)); fs.renameSync(p + '.tmp', p); };
const CODEABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = n => { let t = ''; const b = crypto.randomBytes(n); for (let i = 0; i < n; i++) t += CODEABC[b[i] % CODEABC.length]; return t; };
const log = (...a) => { const t = new Date().toISOString().replace('T', ' ').slice(0, 19); const line = t + ' ' + a.join(' '); console.log(line); try { fs.appendFileSync(path.join(DATA, 'servidor.log'), line + '\n'); } catch (e) { } };

/* ---------------- licencias «Buen anfitrión» y dueños de salas ---------------- */
function genLicense(dias, salas, nota) {
  const L = readJson('licencias.json', {}); let c; do { c = 'BA-' + newCode(4) + '-' + newCode(4); } while (L[c]);
  L[c] = { dias: Math.max(1, dias | 0 || 30), salas: Math.max(1, salas | 0 || CFG.licenciaSalasPorDefecto), creada: Date.now(), nota: String(nota || '').slice(0, 60), uid: null, vence: null }; writeJson('licencias.json', L); return c;
}
if (process.argv.includes('--licencia')) { const i = process.argv.indexOf('--licencia'); const c = genLicense(+process.argv[i + 1] || 30, +process.argv[i + 2] || 0, process.argv.slice(i + 3).join(' ')); const L = readJson('licencias.json', {})[c]; console.log('\nCódigo de «Buen anfitrión»: ' + c + '\n  Duración: ' + L.dias + ' días desde que se canjea · Salas propias: ' + L.salas + '\n  (El jugador lo escribe en MULTIJUGADOR → Buen anfitrión → CANJEAR.)\n'); process.exit(0); }
const ownersAll = () => readJson('duenos.json', {});
function licOf(uid) { const o = ownersAll()[uid]; if (!o || !o.lic) return null; const l = readJson('licencias.json', {})[o.lic]; return l && l.vence && l.vence > Date.now() ? Object.assign({ codigo: o.lic }, l) : null; }
const licenseOk = uid => !!(uid && licOf(uid));
const UIDRE = /^[A-Za-z0-9]{8,32}$/, TOKRE = /^[A-Za-z0-9]{16,64}$/;
/* identidad: el dispositivo genera uid + token y el servidor guarda solo el hash del token (se registra en el primer uso) */
function auth(uid, tok, register) {
  if (!UIDRE.test(uid || '') || !TOKRE.test(tok || '')) return { ok: false, error: 'identidad no válida' };
  const O = ownersAll(), th = sha(tok), o = O[uid];
  if (o) return o.th === th ? { ok: true, uid } : { ok: false, error: 'identidad no válida' };
  if (typeof register === 'function' ? !register() : !register) return { ok: false, unknown: true };
  O[uid] = { th, lic: null, creado: Date.now() };
  const ks = Object.keys(O); if (ks.length > 8000) { const keep = new Set(); try { for (const r of rooms.values()) if (r.owner) keep.add(r.owner); for (const l of Object.values(readJson('licencias.json', {}))) if (l.uid) keep.add(l.uid); } catch (e) { } ks.filter(k => !keep.has(k) && k !== uid).sort((a, b) => (O[a].creado || 0) - (O[b].creado || 0)).slice(0, ks.length - 6000).forEach(k => delete O[k]); }
  writeJson('duenos.json', O); return { ok: true, uid };
}
/* ---- baneos, reportes y verificación de identidad al unirse ---- */
const bansAll = () => readJson('bans.json', { global: {}, salas: {} });
const saveBans = b => writeJson('bans.json', b);
const reportsAll = () => readJson('reportes.json', []);
const saveReports = r => writeJson('reportes.json', r.slice(-500));
function banInfo(uid, roomId) { const b = bansAll(); return (b.global && b.global[uid]) ? Object.assign({ ambito: 'servidor' }, b.global[uid]) : (b.salas && b.salas[roomId] && b.salas[roomId][uid]) ? Object.assign({ ambito: 'sala' }, b.salas[roomId][uid]) : null; }
function addBan(roomId, uid, nombre, motivo) { const b = bansAll(); const rec = { nombre: String(nombre || '').slice(0, 20), motivo: String(motivo || '').slice(0, 60), fecha: Date.now() }; if (roomId) { b.salas[roomId] = b.salas[roomId] || {}; b.salas[roomId][uid] = rec; } else b.global[uid] = rec; saveBans(b); }
function delBan(roomId, uid) { const b = bansAll(); if (roomId) { if (b.salas[roomId]) delete b.salas[roomId][uid]; } else delete b.global[uid]; saveBans(b); }
const usedNonce = new Map();
function verifyJoin(roomId, uid, n, sig) {
  if (!uid && !CFG.exigirIdentidad) return { ok: true, uid: '' };
  if (!UIDRE.test(uid || '') || !n || !/^[a-f0-9]{64}$/.test(sig || '')) return { ok: false, error: 'Actualiza el juego para entrar a esta sala (identidad no válida).' };
  const o = ownersAll()[uid]; if (!o) return { ok: false, error: 'Identidad no registrada. Vuelve a abrir MULTIJUGADOR e intenta de nuevo.' };
  const k = uid + ':' + n; const now = Date.now(); for (const [kk, t] of usedNonce) if (now - t > 600000) usedNonce.delete(kk); if (usedNonce.has(k)) return { ok: false, error: 'Intento repetido. Vuelve a intentarlo.' };
  if (sha(o.th + ':' + n + ':' + roomId) !== sig) return { ok: false, error: 'No se pudo verificar tu identidad.' };
  usedNonce.set(k, now);
  const b = banInfo(uid, roomId); if (b) return { ok: false, error: 'Estás baneado' + (b.ambito === 'servidor' ? ' de este servidor' : ' de esta sala') + (b.motivo ? ': ' + b.motivo : '') + '.' };
  return { ok: true, uid };
}
const hits = new Map(); function limited(key, max, ms) { const n = Date.now(), a = (hits.get(key) || []).filter(t => n - t < ms); a.push(n); hits.set(key, a); if (hits.size > 5000) hits.clear(); return a.length > max; }

/* ---------------- dirección de Tailscale ---------------- */
function tailscaleIp() {
  const ifs = os.networkInterfaces();
  for (const k of Object.keys(ifs)) for (const a of ifs[k] || []) { if (a.family !== 'IPv4' && a.family !== 4) continue; const p = a.address.split('.').map(Number); if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return a.address; }
  return null;
}

/* ---------------- relé de señalización (subconjunto de ntfy) ---------------- */
const topics = new Map(); const MAXBODY = 64 * 1024;
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': '*', 'Access-Control-Max-Age': '600' };
function relayPost(topic, req, res) {
  let n = 0; const chunks = []; req.on('data', c => { n += c.length; if (n > MAXBODY) { res.writeHead(413, CORS); res.end(); req.destroy(); } else chunks.push(c); });
  req.on('end', () => {
    if (n > MAXBODY) return; const ev = { id: Math.random().toString(36).slice(2, 12), time: Math.floor(Date.now() / 1000), event: 'message', topic, message: Buffer.concat(chunks).toString('utf8') };
    const subs = topics.get(topic); if (subs) for (const r of subs) { try { r.write('event: message\ndata: ' + JSON.stringify(ev) + '\n\n'); } catch (e) { } }
    res.writeHead(200, Object.assign({ 'Content-Type': 'application/json' }, CORS)); res.end(JSON.stringify(ev));
  });
}
function relaySse(topic, req, res) {
  if (topics.size > 300 && !topics.has(topic)) { res.writeHead(503, CORS); return res.end(); }
  let subs = topics.get(topic); if (!subs) topics.set(topic, subs = new Set()); if (subs.size >= 60) { res.writeHead(429, CORS); return res.end(); }
  res.writeHead(200, Object.assign({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' }, CORS));
  res.write('event: open\ndata: {"event":"open","topic":"' + topic + '"}\n\n'); subs.add(res);
  const ka = setInterval(() => { try { res.write(': ka\n\n'); } catch (e) { } }, 25000);
  req.on('close', () => { clearInterval(ka); subs.delete(res); if (!subs.size) topics.delete(topic); });
}

/* ---------------- juego servido ---------------- */
const MARK = '/* ===================== AUDIO (sintetizado) ===================== */';
let gameCache = null;
function gameHtml() {
  if (gameCache) return gameCache;
  let s = fs.readFileSync(path.join(ROOT, 'juego', 'index.html'), 'utf8'); const layer = fs.readFileSync(path.join(ROOT, 'srv_layer.js'), 'utf8');
  if (s.split(MARK).length !== 2) throw new Error('El juego no tiene el marcador esperado; ¿versión distinta?');
  s = s.replace(MARK, () => layer + '\n' + MARK); return (gameCache = Buffer.from(s, 'utf8'));
}

/* ---------------- navegador y salas ---------------- */
let browser = null, browserStarting = null;
function launchOpts() {
  const o = { headless: true, handleSIGINT: false, handleSIGTERM: false, handleSIGHUP: false, args: ['--disable-features=WebRtcHideLocalIpsWithMdns,IntensiveWakeUpThrottling,CalculateNativeWinOcclusion,BackForwardCache,AudioServiceOutOfProcess', '--autoplay-policy=no-user-gesture-required', '--mute-audio', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check'] };
  if (process.platform === 'linux' && process.getuid && process.getuid() === 0) o.args.push('--no-sandbox');
  if (CFG.navegador) o.executablePath = CFG.navegador; else if (CFG.canal) o.channel = CFG.canal; else if (process.platform === 'win32') o.channel = 'msedge';
  return o;
}
async function getBrowser() {
  if (browser && browser.isConnected()) return browser; if (browserStarting) return browserStarting;
  browserStarting = (async () => { try { const b = await chromium.launch(launchOpts()); b.on('disconnected', () => { if (browser === b) { browser = null; log('[navegador] se cerró; las salas activas se reiniciarán'); } }); browser = b; return b; } finally { browserStarting = null; } })();
  return browserStarting;
}
const ICE = () => (CFG.usarStunTurn ? [{ urls: ['stun:stun.l.google.com:19302'] }] : []);
const SIZES = { small: 168, big: 264, huge: 360, vast: 480, colossal: 960 };   /* lado del mundo en casillas (solo para mostrarlo en la lista de salas) */
const WORLDKEYS = ['semilla', 'modo', 'dificultad', 'tamano', 'zombis', 'botin', 'lluvia', 'mundo'];

class Room {
  constructor(cfg) {
    this.id = cfg.id; this.nombre = cfg.nombre; this.cfg = cfg; this.dir = path.join(DATA, 'salas', this.id); fs.mkdirSync(path.join(this.dir, 'copias'), { recursive: true });
    this.save = path.join(this.dir, 'mundo_actual.json'); this.ctx = null; this.page = null; this.status = 'dormida'; this.state = null; this.lastBusy = Date.now(); this.lastSave = 0; this.lastCopy = 0;
    this.restarts = 0; this.failN = 0; this.nextTry = 0; this.startedAt = 0; this.badCount = 0; this.promise = null; this.stopping = false; this.freshAt = 0; this.wanted = false;
    this.ctl = null; this.bridges = new Map();
    this.dynamic = !!cfg.dynamic; this.owner = cfg.owner || null; this.publica = cfg.publica !== false; this.plan247 = !!cfg.plan247; this.creada = cfg.creada || Date.now(); this.lastPlayers = cfg.lastPlayers || Date.now();
  }
  get nunca() { return this.plan247; }
  dropBridges() { for (const b of this.bridges.values()) { wsClose(b.guest, 1000, 'La sala se cerró.'); if (b.peer) wsClose(b.peer, 1000, ''); } this.bridges.clear(); if (this.ctl) { try { this.ctl.terminate(); } catch (e) { } this.ctl = null; } }
  async players() { if (!this.page || this.status !== 'activa') return []; try { return await Promise.race([this.page.evaluate(() => SRV.players()), new Promise((_, j) => setTimeout(() => j(new Error('t')), 6000))]); } catch (e) { return []; } }
  async kick(slot, msg) { if (!this.page || this.status !== 'activa') return false; try { return await this.page.evaluate(([a, b]) => SRV.kick(a, b), [slot, msg]); } catch (e) { return false; } }
  async restart() { if (this.promise) await this.promise.catch(() => { }); this.stopping = true; try { await this.saveWorld('cierre'); await this._close(true); } finally { this.stopping = false; } this.status = 'dormida'; this.nextTry = 0; this.wanted = true; this.state = null; log('[' + this.id + '] reiniciada'); await this.start(); }
  async newWorld() { await this.sleep(); try { fs.rmSync(path.join(this.dir, 'personajes'), { recursive: true, force: true }); fs.rmSync(path.join(this.dir, 'alianzas.json'), { force: true }); } catch (e) { } try { if (this.hasSave()) fs.renameSync(this.save, path.join(this.dir, 'copias', 'anterior_' + Date.now() + '.json')); } catch (e) { } this.nextSeed = this.id.toLowerCase() + '-' + Date.now().toString(36); this.nextTry = 0; this.wanted = true; log('[' + this.id + '] nuevo mundo'); await this.start(); }
  record() { return { id: this.id, nombre: this.nombre, owner: this.owner, publica: this.publica, plan247: this.plan247, creada: this.creada, lastPlayers: this.lastPlayers, dynamic: true }; }
  world() { const w = {}; for (const k of WORLDKEYS) w[k] = this.cfg[k] !== undefined ? this.cfg[k] : CFG[k]; if (this.nextSeed) { w.semilla = this.nextSeed; this.nextSeed = null; } if (this.cfg.pvp) w.modo = 'full'; return w; }   /* una sala PvP siempre es de modo completo */
  hasSave() { try { return fs.statSync(this.save).size > 1000; } catch (e) { return false; } }
  /* v15.0 · personajes de los invitados guardados en el servidor (solo los puede pedir el navegador del anfitrión de esta sala, por una función privada; no hay ruta HTTP) */
  async charOp(op, uid, data) {
    try {
      uid = String(uid || '').toLowerCase(); if (!/^[a-z0-9]{8,40}$/.test(uid)) return { ok: false };
      const dir = path.join(this.dir, 'personajes'), f = path.join(dir, uid + '.json');
      if (op === 'get') { let raw; try { raw = fs.readFileSync(f, 'utf8'); } catch (e) { return e.code === 'ENOENT' ? { ok: true, c: null } : { ok: false }; } try { const o = JSON.parse(raw); return { ok: true, c: typeof o.c === 'string' ? o.c : null }; } catch (e) { return { ok: false }; } }
      if (op === 'put') { data = String(data || ''); if (data.length > 120000) return { ok: false }; fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(f + '.tmp', JSON.stringify({ t: Date.now(), c: data })); fs.renameSync(f + '.tmp', f); return { ok: true }; }
      if (op === 'del') { try { fs.unlinkSync(f); } catch (e) { } return { ok: true }; }
    } catch (e) { return { ok: false }; }
    return { ok: false };
  }
  /* v15.3 · alianzas y traidores de la sala (un archivo; solo lo pide el navegador del anfitrión por una función privada) */
  async aliOp(op, data) {
    try {
      const f = path.join(this.dir, 'alianzas.json');
      if (op === 'get') { try { return { ok: true, c: fs.readFileSync(f, 'utf8') }; } catch (e) { return e.code === 'ENOENT' ? { ok: true, c: null } : { ok: false }; } }
      if (op === 'put') { data = String(data || ''); if (data.length > 200000) return { ok: false }; fs.mkdirSync(this.dir, { recursive: true }); fs.writeFileSync(f + '.tmp', data); fs.renameSync(f + '.tmp', f); return { ok: true }; }
    } catch (e) { return { ok: false }; }
    return { ok: false };
  }
  purgeChars() { try { const dir = path.join(this.dir, 'personajes'), lim = Date.now() - (CFG.personajeCaducaDias > 0 ? CFG.personajeCaducaDias : 60) * 86400000; for (const n of fs.readdirSync(dir)) { const f = path.join(dir, n); try { if (fs.statSync(f).mtimeMs < lim) fs.unlinkSync(f); } catch (e) { } } } catch (e) { } }
  async start() {
    if (this.promise) return this.promise; if (this.status === 'activa') return;
    this.promise = this._start().finally(() => { this.promise = null; }); return this.promise;
  }
  async _start() {
    this.status = 'iniciando'; this.wanted = true;
    try {
      await this._close(true); const b = await getBrowser(); const ctx = await b.newContext({ viewport: { width: 640, height: 360 } }); this.ctx = ctx;
      let saved = null; try { saved = fs.readFileSync(this.save, 'utf8'); } catch (e) { }
      if (saved) await ctx.addInitScript(([k, v]) => { try { if (!localStorage.getItem(k)) localStorage.setItem(k, v); } catch (e) { } }, ['ultimo_refugio_v3', saved]);
      await ctx.addInitScript(id => { window.__ROOM = id; }, this.id);
      /* el anfitrión es un navegador oculto: si el sistema deja de disparar requestAnimationFrame (ventana oculta/minimizada, ahorro de energía…) el mundo y los envíos de posiciones se paran. Se sustituye por un temporizador propio. */
      const rafMode = process.env.URSRV_RAF || 'timer';
      await ctx.addInitScript(mode => { if (!/[?&]srv=1/.test(location.search)) return; if (mode === 'parado') { window.requestAnimationFrame = () => 0; } else if (mode === 'timer') { let last = 0; window.requestAnimationFrame = cb => setTimeout(() => { last = performance.now(); cb(last); }, Math.max(0, 33 - (performance.now() - last))); window.cancelAnimationFrame = id => clearTimeout(id); } }, rafMode);
      await ctx.exposeFunction('__srvChar', (op, uid, data) => this.charOp(op, uid, data));
      await ctx.exposeFunction('__srvLog', m => log('[' + this.id + '] ' + String(m).slice(0, 300)));
      await ctx.exposeFunction('__srvAli', (op, data) => this.aliOp(op, data));
      this.purgeChars();
      const page = await ctx.newPage(); this.page = page;
      if (+process.env.URSRV_CPU > 1) { try { const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: +process.env.URSRV_CPU }); log('[' + this.id + '] PRUEBA: CPU del anfitrión frenada ×' + process.env.URSRV_CPU); } catch (e) { } }   /* solo para pruebas: imita un PC más lento */
      page.on('pageerror', e => { this.lastErr = e.message; log('[' + this.id + '] error de página:', e.message); });
      page.on('crash', () => log('[' + this.id + '] la página se cerró de forma inesperada'));
      await page.goto('http://127.0.0.1:' + CFG.puerto + '/juego/?srv=1', { waitUntil: 'load', timeout: 60000 });
      await page.waitForFunction(() => typeof startNew === 'function' && typeof hasSave === 'function' && typeof SRV !== 'undefined', null, { timeout: 60000 });
      if (await page.evaluate(() => hasSave())) { await page.evaluate(() => { $('bCont').click(); }); log('[' + this.id + '] continuando el mundo guardado'); }
      else {
        const w = this.world(); if (!w.semilla) w.semilla = this.id.toLowerCase() + '-' + Date.now().toString(36);
        await page.evaluate(c => { OPT.world = Object.assign({}, OPT.world, { seed: c.semilla, kind: c.mundo, size: c.tamano, z: c.zombis, loot: c.botin, rain: c.lluvia }); OPT.mode = c.modo; OPT.diff = c.dificultad; $('bNew').click(); }, w);
        log('[' + this.id + '] creando un mundo nuevo');
      }
      await page.waitForFunction(() => STATE === 'play', null, { timeout: 90000 });
      await page.waitForTimeout(2500); await page.keyboard.press('Space').catch(() => { }); await page.waitForTimeout(800);
      await page.evaluate(c => { SRV.boot({ pausar: c.pausar, ice: c.ice, max: c.max, code: c.code, fps: c.fps, aut: c.aut, val: c.val, minB: c.minB, muerte: c.muerte, pvp: c.pvp, amax: c.amax, thoras: c.thoras }); SRV.spawn = [P.x, P.y]; if (NET.role !== 'host') netHost(); }, { pausar: !(this.plan247 ? CFG.simular247 : CFG.simularSinJugadores), ice: ICE(), max: CFG.maxJugadores, code: this.id, fps: CFG.fpsServidor, aut: CFG.autoridadPersonaje !== false, val: CFG.validarDano !== false, minB: Math.max(CFG.versionMinimaApp | 0, this.cfg.pvp ? 150 : 0), muerte: this.cfg.pvp ? true : (CFG.muerteBorraPersonaje === undefined ? 'modo' : CFG.muerteBorraPersonaje), pvp: !!this.cfg.pvp, amax: Math.max(2, Math.min(8, CFG.alianzaMax | 0 || 4)), thoras: CFG.traidorHoras > 0 ? +CFG.traidorHoras : 24 });
      this.startedAt = Date.now(); this.failN = 0; this.lastBusy = Date.now(); this.status = 'activa'; log('[' + this.id + '] sala lista (máx. ' + CFG.maxJugadores + ' jugadores)');
    } catch (e) {
      this.failN++; this.nextTry = Date.now() + Math.min(60000, 5000 * this.failN); this.status = 'dormida'; log('[' + this.id + '] no pudo arrancar:', String(e.message || e).split('\n')[0]);
      if (/Executable doesn't exist|executable doesn't exist|Failed to launch|ENOENT/i.test(e.message || '')) log('FALTA EL NAVEGADOR. Windows: instala Microsoft Edge. Linux/Mac: «npx playwright-core install chromium», o indica «navegador» / «canal» (chrome, msedge) en config.json.');
      await this._close(true);
    }
  }
  async _close(quiet) { this.dropBridges(); const c = this.ctx; this.ctx = null; this.page = null; if (!c) return; try { await Promise.race([c.close(), new Promise(r => setTimeout(r, 8000))]); } catch (e) { } if (!quiet) log('[' + this.id + '] sala cerrada'); }
  async sleep(why) { if (this.promise) await this.promise.catch(() => { }); this.wanted = false; this.stopping = true; try { await this.saveWorld('cierre'); await this._close(); } finally { this.stopping = false; this.status = 'dormida'; this.state = null; } if (why) log('[' + this.id + '] a dormir (' + why + ')'); }
  async saveWorld(why) {
    if (!this.page) return false;
    try {
      const raw = await this.page.evaluate(() => { saveGame(); return localStorage.getItem('ultimo_refugio_v3'); }); if (!raw || raw.length < 1000) return false;
      fs.writeFileSync(this.save + '.tmp', raw); fs.renameSync(this.save + '.tmp', this.save); this.lastSave = Date.now();
      const d = new Date(), pad = n => String(n).padStart(2, '0'), nm = 'mundo_' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '_' + pad(d.getHours()) + pad(d.getMinutes()) + '.json', cdir = path.join(this.dir, 'copias');
      if (!fs.existsSync(path.join(cdir, nm)) && (why === 'cierre' || Date.now() - this.lastCopy > 30 * 60 * 1000)) { fs.copyFileSync(this.save, path.join(cdir, nm)); this.lastCopy = Date.now(); const all = fs.readdirSync(cdir).filter(f => f.startsWith('mundo_')).sort(); while (all.length > CFG.copias) fs.unlinkSync(path.join(cdir, all.shift())); }
      return true;
    } catch (e) { log('[' + this.id + '] guardado falló:', e.message); return false; }
  }
  async poll() {
    if (!this.page || this.status !== 'activa') return null;
    try {
      return await Promise.race([this.page.evaluate(() => ({ st: STATE, role: NET.role, es: NET.es ? NET.es.readyState : -1, peers: (NET.peers || []).filter(p => p.ready).length, connecting: (NET.peers || []).filter(p => !p.ready).length, names: (NET.peers || []).filter(p => p.ready).map(p => (p.rp && p.rp.name) || 'Jugador'),
        day: typeof GT !== 'undefined' ? Math.floor(GT.min / 1440) + 1 : undefined, paused: SRV.paused ? 1 : 0, fr: SRV.frames | 0, z: Z.filter(z => z.st !== 'dead').length, npcs: NPCS.length, err: (typeof E80 !== 'undefined' ? E80.n : 0) + (typeof DBGC !== 'undefined' ? DBGC.n : 0) })), new Promise((_, rej) => setTimeout(() => rej(new Error('sin respuesta')), 8000))]);
    } catch (e) { return { bad: e.message }; }
  }
  async fresh() { if (this.status !== 'activa' || Date.now() - this.freshAt < 1500) return; this.freshAt = Date.now(); const s = await this.poll(); if (s && !s.bad) this.state = s; }
  async watchdog() {
    if (this.stopping || this.promise) return;
    if (this.status === 'dormida') { if ((this.wanted || (this.nunca && licenseOk(this.owner))) && Date.now() >= this.nextTry && (this.nunca || slotFree(this))) await this.start(); return; }
    if (this.status !== 'activa') return;
    const s = await this.poll(); this.state = s;
    if (!this.page || !s || s.bad || s.st !== 'play' || !(browser && browser.isConnected())) { this.badCount++; if (this.badCount >= 2 || !this.page) { log('[' + this.id + '] anfitrión caído (' + ((s && (s.bad || s.st)) || 'sin página') + '), reiniciando'); this.badCount = 0; this.restarts++; this.status = 'dormida'; this.wanted = true; this.nextTry = 0; await this._close(true); await this.start(); } return; }
    this.badCount = 0;
    /* latido del anfitrión: si hay jugadores y el mundo no avanza (navegador oculto que dejó de dibujar fotogramas), se reinicia la sala */
    { const tn = Date.now(); if (this.lastPollT && s.fr >= this.lastFrP) this.pps = (s.fr - this.lastFrP) / ((tn - this.lastPollT) / 1000); this.lastPollT = tn; this.lastFrP = s.fr; }
    if (s.peers > 0 && s.fr === this.lastFr) { this.frStall = (this.frStall || 0) + 1; if (this.frStall >= 3) { log('[' + this.id + '] el anfitrión no avanza (sin fotogramas desde hace ~15 s): reiniciando la sala'); this.frStall = 0; this.restarts++; await this.restart(); return; } } else this.frStall = 0; this.lastFr = s.fr;
    if (s.peers + s.connecting > 0) { this.lastBusy = Date.now(); if (this.dynamic && Date.now() - this.lastPlayers > 60000) { this.lastPlayers = Date.now(); saveUserRooms(); } }
    else if (!this.nunca && CFG.dormirTrasMin > 0 && Date.now() - this.lastBusy > CFG.dormirTrasMin * 60000) { await this.sleep('sin jugadores ' + CFG.dormirTrasMin + ' min'); return; }
    if ((s.role !== 'host' || s.es === 2) && !s.peers && !s.connecting) { log('[' + this.id + '] la sala no estaba abierta, reabriendo'); try { await this.page.evaluate(() => { if (NET.role) netClose(); netHost(); }); } catch (e) { } }
  }
  info() { const s = this.state || {}; return { id: this.id, nombre: this.nombre, estado: this.status, jugadores: this.status === 'activa' ? (s.peers || 0) : 0, conectando: s.connecting || 0, max: CFG.maxJugadores, dia: this.status === 'activa' ? s.day : undefined, nombres: this.status === 'activa' ? (s.names || []) : [], zombis: s.z, pausada: !!s.paused, reinicios: this.restarts, ultimoGuardado: this.lastSave ? new Date(this.lastSave).toISOString() : null, errores: s.err || 0, guardada: this.hasSave(), publica: this.publica, plan247: this.plan247, usuario: this.dynamic, pvp: !!this.cfg.pvp, mapa: SIZES[this.cfg.tamano !== undefined ? this.cfg.tamano : CFG.tamano] || 0 }; }
}
const rooms = new Map(CFG.salas.map(c => [c.id, new Room(c)]));
const saveUserRooms = () => { try { writeJson('salas_usuario.json', [...rooms.values()].filter(r => r.dynamic).map(r => r.record())); } catch (e) { log('[salas] no se pudo guardar la lista:', e.message); } };
for (const r of readJson('salas_usuario.json', [])) { if (r && r.id && !rooms.has(r.id)) rooms.set(r.id, new Room(Object.assign({}, r, { dynamic: true }))); }
const userRooms = uid => [...rooms.values()].filter(r => r.dynamic && r.owner === uid);
/* v14.9: anuncio de la última versión de la app (opcional). Se publica en /salas y la app (Android) avisa al jugador si su versión es menor.
   config.json: "appUltima": { "codigo": 146, "version": "14.9", "notas": ["Lo nuevo 1", "Lo nuevo 2"] }   (codigo = versionCode de la app en Google Play). Sin ese bloque no se anuncia nada. */
const appInfo = () => { const a = CFG.appUltima; if (!a || !(+a.codigo > 0)) return null; return { codigo: Math.floor(+a.codigo), version: String(a.version || '').slice(0, 12), notas: (Array.isArray(a.notas) ? a.notas : []).slice(0, 8).map(x => String(x).slice(0, 180)) }; };
const max247 = () => Math.min(CFG.salas247Max, Math.max(0, CFG.salasActivasMax - 1));
function planOf(uid) { const l = licOf(uid), own = userRooms(uid); return { anfitrion: !!l, vence: l ? new Date(l.vence).toISOString() : null, salasMax: l ? l.salas : CFG.gratisSalasMax, salasUsadas: own.length, salas247: own.filter(r => r.plan247).length, gratisMax: CFG.gratisSalasMax, max247: max247(), activas247: [...rooms.values()].filter(r => r.plan247).length }; }
function createRoom(uid, nombre, publica, want247) {
  if (!CFG.salasUsuario) return { ok: false, error: 'Este servidor no permite crear salas.' };
  nombre = String(nombre || '').replace(/[<>&"\u0000-\u001f]/g, '').trim().slice(0, 24); if (nombre.length < 3) return { ok: false, error: 'Ponle un nombre de 3 a 24 letras.' };
  const pl = planOf(uid); if (want247 && !pl.anfitrion) return { ok: false, error: 'Las salas 24/7 requieren una licencia activa.' };
  if (pl.salasUsadas >= pl.salasMax) return { ok: false, error: pl.anfitrion ? 'Ya tienes ' + pl.salasMax + ' salas (tu límite). Borra una para crear otra.' : 'Ya tienes tu sala gratis. Borra la tuya para crear otra.' };
  if ([...rooms.values()].filter(r => r.dynamic).length >= CFG.salasUsuarioMax) return { ok: false, error: 'El servidor llegó a su máximo de salas de jugadores.' };
  if (want247) { if (!pl.anfitrion) return { ok: false, error: 'Las salas 24/7 requieren una licencia activa.' }; if (pl.salas247 >= pl.salasMax) return { ok: false, error: 'Ya usas todas tus salas 24/7.' }; if (pl.activas247 >= pl.max247) return { ok: false, error: 'El servidor no tiene cupo para más salas 24/7 ahora mismo.' }; }
  let id; do { id = newCode(6); } while (rooms.has(id));
  const r = new Room({ id, nombre, owner: uid, publica: !!publica, plan247: !!want247, dynamic: true }); rooms.set(id, r); saveUserRooms(); if (want247) { r.wanted = true; } log('[salas] nueva sala ' + id + ' «' + nombre + '» (' + (publica ? 'pública' : 'privada') + (want247 ? ', 24/7' : '') + ')');
  return { ok: true, id, sala: r.info() };
}
async function deleteRoom(r) { try { await r.sleep(); } catch (e) { } rooms.delete(r.id); saveUserRooms(); try { const b = bansAll(); delete b.salas[r.id]; saveBans(b); saveReports(reportsAll().filter(x => x.sala !== r.id)); } catch (e) { } try { fs.rmSync(r.dir, { recursive: true, force: true }); } catch (e) { } log('[salas] sala ' + r.id + ' borrada'); }
function maintenance() {
  for (const r of [...rooms.values()]) {
    if (!r.dynamic) continue;
    if (r.plan247 && !licenseOk(r.owner)) { r.plan247 = false; saveUserRooms(); log('[salas] ' + r.id + ' deja de ser 24/7 (licencia vencida)'); }
    if (!r.plan247 && r.status === 'dormida' && Date.now() - r.lastPlayers > CFG.gratisCaducaDias * 86400000) deleteRoom(r).catch(() => { });
  }
}
const activeCount = () => [...rooms.values()].filter(r => r.status === 'activa' || r.status === 'iniciando').length;
/* ¿cabe otra sala activa? Sin «salasUsuarioActivasMax» (servidores anteriores): un único tope para todas. Con él: las oficiales tienen su tope (salasActivasMax) y las de jugadores el suyo, para que una sala de jugadores no deje sin sitio a una oficial. */
const activeOf = f => [...rooms.values()].filter(r => (r.status === 'activa' || r.status === 'iniciando') && f(r)).length;
function slotFree(room) {
  if (CFG.salasUsuarioActivasMax == null) return activeCount() < CFG.salasActivasMax;
  return room.dynamic ? activeOf(r => r.dynamic && !r.plan247) < CFG.salasUsuarioActivasMax : activeOf(r => !r.dynamic) < CFG.salasActivasMax;
}
async function wake(room) {
  if (room.status === 'activa') return { ok: true, estado: 'activa' }; if (room.status === 'iniciando') return { ok: true, estado: 'iniciando' };
  if (!slotFree(room)) return { ok: false, error: CFG.salasUsuarioActivasMax != null ? (room.dynamic ? 'Ya hay ' + CFG.salasUsuarioActivasMax + ' sala(s) de jugadores activa(s). Entra a una oficial o espera a que se vacíe.' : 'Las ' + CFG.salasActivasMax + ' salas oficiales ya están activas.') : 'El servidor ya tiene ' + CFG.salasActivasMax + ' salas activas. Entra a una de ellas o espera a que se vacíe.' };
  room.nextTry = 0; room.start().catch(() => { }); return { ok: true, estado: 'iniciando' };
}

/* ---------------- HTTP ---------------- */
const json = (res, code, o) => { res.writeHead(code, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, CORS)); res.end(JSON.stringify(o)); };
const ownIps = () => { const out = new Set(['127.0.0.1', '::1']); try { for (const l of Object.values(os.networkInterfaces())) for (const a of l || []) out.add(a.address); } catch (e) { } return out; };
const PROXYH = ['x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto', 'forwarded', 'via', 'x-real-ip', 'cf-connecting-ip', 'cf-ray', 'tailscale-user-login', 'tailscale-funnel-request'];
/* Administración: desde el propio PC sin clave; desde otro dispositivo SOLO si defines «claveAdmin» en config.json (usuario «admin» + esa clave; úsalo solo por HTTPS) */
function adminOk(req) {
  if (isLocal(req)) return true; if (!CFG.claveAdmin) return false; if (adminBlocked(req)) return false;
  const h = String(req.headers.authorization || ''), ip = clientIp(req); if (!h.startsWith('Basic ')) return false;
  let pw = ''; try { pw = Buffer.from(h.slice(6), 'base64').toString('utf8').split(':').slice(1).join(':'); } catch (e) { return false; }
  const A = Buffer.from(sha(pw)), B = Buffer.from(sha(String(CFG.claveAdmin)));
  if (crypto.timingSafeEqual(A, B)) return true; limited('admfail:' + ip, 1e9, 600000); return false;
}
const adminBlocked = req => !!CFG.claveAdmin && (hits.get('admfail:' + clientIp(req)) || []).filter(t => Date.now() - t < 600000).length >= 8;
function adminDenied(req, res, page) {
  try { const pr = PROXYH.filter(h => req.headers[h]); log('[admin] acceso denegado: remoto=' + (req.socket.remoteAddress || '?') + ' host=' + (req.headers.host || '?') + (pr.length ? ' cabeceras de proxy=' + pr.join(',') : '') + ' ruta=' + String(req.url).split('?')[0]); } catch (e) { }
  if (adminBlocked(req)) { res.writeHead(429); return res.end('Demasiados intentos. Espera 10 minutos.'); }
  if (CFG.claveAdmin) { res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Administracion"', 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Escribe usuario admin y la clave.'); }
  if (page) { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); return res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;background:#141816;color:#e8e4da;padding:24px;max-width:560px;margin:auto"><h2>Panel de administración</h2><p>Por seguridad, el panel <b>solo abre desde el PC servidor</b>, escribiendo en su navegador:</p><p style="font-size:20px"><b>http://127.0.0.1:' + CFG.puerto + '/admin</b></p><p style="color:#9aa59d">No sirve abrirlo con la dirección pública ni con la de Tailscale desde otro dispositivo. Si quieres administrar desde otro dispositivo, define <code>claveAdmin</code> en <code>config.json</code> (y úsalo por HTTPS).</p></body>'); }
  res.writeHead(404); return res.end('no encontrado');
}
const hostIsLocal = h => { h = String(h || '').toLowerCase().replace(/:\d+$/, '').replace(/^\[|\]$/g, ''); return h === 'localhost' || ownIps().has(h); };
/* «Local» = viene del propio PC, SIN pasar por un proxy (Funnel/Cloudflare/…) y pidiendo una dirección propia: así el panel de administración nunca queda público */
const isLocal = req => { let a = req.socket.remoteAddress || ''; if (a.startsWith('::ffff:')) a = a.slice(7); if (!ownIps().has(a)) return false; for (const h of PROXYH) if (req.headers[h]) return false; return hostIsLocal(req.headers.host); };
/* IP real del cliente: si la conexión llega de un proxy en este mismo PC, se usa la última IP que añadió el proxy en X-Forwarded-For */
function clientIp(req) { let a = req.socket.remoteAddress || '?'; if (a.startsWith('::ffff:')) a = a.slice(7); if ((a === '127.0.0.1' || a === '::1') && req.headers['x-forwarded-for']) { const l = String(req.headers['x-forwarded-for']).split(',').map(t => t.trim()).filter(Boolean); if (l.length) return l[l.length - 1].slice(0, 60); } return a; }
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const freshAll = () => Promise.all([...rooms.values()].map(r => r.fresh()));
function urlJuego() { const ip = tailscaleIp(); return ip ? 'http://' + ip + ':' + CFG.puerto + '/juego/' : null; }
const urlPub = () => CFG.urlPublica ? String(CFG.urlPublica).replace(/\/+$/, '') : '';
function landing(local) {
  const ip = tailscaleIp(), url = urlJuego() || ('http://' + os.hostname() + ':' + CFG.puerto + '/juego/');
  const rs = [...rooms.values()].filter(r => !r.dynamic || r.publica).map(r => r.info()).map(r => '<div class="c"><b>' + esc(r.nombre) + '</b> <small>(' + esc(r.id) + ')</small><br>' + (r.estado === 'activa' ? '<span class="ok">activa</span> · ' + r.jugadores + '/' + r.max + ' jugadores' + (r.nombres.length ? ' (' + r.nombres.map(esc).join(', ') + ')' : '') + (r.dia ? ' · día ' + r.dia : '') + ' · zombis ' + (r.zombis ?? '–') + (r.pausada ? ' · en pausa' : '') : '<span class="no">' + r.estado + '</span>' + (r.guardada ? ' · mundo guardado' : ' · mundo sin crear')) + '</div>').join('');
  return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Último Refugio · servidor</title><style>body{font-family:system-ui,Arial;background:#141816;color:#e8e4da;margin:0;padding:20px}main{max-width:560px;margin:0 auto}h1{margin:0 0 4px}.c{background:#1f2622;border:1px solid #38423b;border-radius:10px;padding:14px;margin:12px 0}a.btn{display:inline-block;background:#d9541e;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold}small{color:#9aa59d}.ok{color:#7dd36a}.no{color:#ff9a7a}</style></head><body><main><h1>Último Refugio</h1><small>Servidor multijugador · ' + esc(CFG.nombreServidor) + '</small>'
    + rs + (urlPub() ? '<div class="c"><small>Dirección pública (cualquiera, sin Tailscale):</small><br><b>' + esc(urlPub()) + '</b><br><small>Juego: ' + esc(urlPub()) + '/juego/ · en la app: MULTIJUGADOR (las salas aparecen solas)</small></div>' : '<div class="c"><small>Servidor <b>no publicado</b>: solo entran jugadores con Tailscale. Para abrirlo a todos mira «Publicar sin Tailscale» en LEEME_SERVIDOR.md.</small></div>') + (local ? '<div class="c"><a class="btn" href="/admin">PANEL DE ADMINISTRACIÓN</a> <small>(solo visible desde este PC)</small></div>' : '') + '<div class="c"><a class="btn" href="/juego/">JUGAR</a><br><br><small>Dirección para los móviles (con Tailscale activo):<br><b>' + esc(url) + '</b><br>En el juego: MULTIJUGADOR → escribe <b>' + esc((ip || os.hostname()) + ':' + CFG.puerto) + '</b> → ACTUALIZAR → elige una sala.</small></div>'
    + (ip ? '' : '<div class="c no">No se detecta Tailscale en este equipo: solo se puede entrar desde aquí. Inicia Tailscale; se detecta solo en unos segundos.</div>') + '</main><script>setTimeout(()=>location.reload(),15000)</script></body></html>';
}
const MOTIVOS = { trampas: 'Trampas', toxico: 'Tóxico o insultos', griefing: 'Molestar / destruir sin motivo', otro: 'Otro' };
async function manage(r, act, Q, admin) {
  const pls = await r.players();
  if (act === 'jugadores') {
    const rep = reportsAll().filter(x => x.sala === r.id && x.estado === 'nuevo'), b = bansAll().salas[r.id] || {};
    return { ok: true, estado: r.status, jugadores: pls.map(p => ({ slot: p.slot, nombre: p.nombre, id: String(p.uid || '').slice(0, 6), reportes: new Set(rep.filter(x => x.contra === p.uid).map(x => x.de)).size })),
      reportes: rep.slice(-30).map(x => ({ id: x.id, nombre: x.nombreContra, motivo: MOTIVOS[x.motivo] || x.motivo, fecha: x.fecha, contra: String(x.contra).slice(0, 6) })), baneados: Object.entries(b).map(([uid, v]) => ({ uid, nombre: v.nombre, motivo: v.motivo })) };
  }
  if (act === 'expulsar') { const ok = await r.kick(+Q('slot'), 'El dueño de la sala te expulsó.'); return { ok, error: ok ? undefined : 'Ese jugador ya no está.' }; }
  if (act === 'banear') {
    const slot = +Q('slot'), pl = pls.find(p => p.slot === slot), uid = (pl && pl.uid) || Q('uid'); if (!uid) return { ok: false, error: 'No se pudo identificar a ese jugador.' };
    addBan(r.id, uid, pl ? pl.nombre : Q('nombre'), Q('motivo') || 'Baneado por el dueño'); if (pl) await r.kick(slot, 'Fuiste baneado de esta sala.');
    const R = reportsAll(); for (const x of R) if (x.sala === r.id && x.contra === uid && x.estado === 'nuevo') x.estado = 'baneado'; saveReports(R); log('[' + r.id + '] baneado ' + String(uid).slice(0, 6)); return { ok: true };
  }
  if (act === 'desbanear') { delBan(r.id, Q('uid')); return { ok: true }; }
  if (act === 'ignorar') { const R = reportsAll(); const x = R.find(y => y.id === Q('rid') && y.sala === r.id); if (x) x.estado = 'ignorado'; saveReports(R); return { ok: true }; }
  if (act === 'reiniciar') { await r.restart(); return { ok: true }; }
  if (act === 'nuevomundo') { await r.newWorld(); return { ok: true }; }
  if (admin && act === 'dormir') { await r.sleep('admin'); return { ok: true }; }
  if (admin && act === 'banglobal') { const slot = +Q('slot'), pl = pls.find(p => p.slot === slot), uid = (pl && pl.uid) || Q('uid'); if (!uid) return { ok: false, error: 'No se pudo identificar.' }; addBan(null, uid, pl ? pl.nombre : '', Q('motivo') || 'Baneado del servidor'); if (pl) await r.kick(slot, 'Fuiste baneado de este servidor.'); return { ok: true }; }
  return { ok: false, error: 'acción desconocida' };
}
function adminPage() { return fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8'); }
function handler(req, res) {
  const u = new URL(req.url, 'http://x'), p = u.pathname;
  try {
    if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
    if (p.startsWith('/sig/')) { const topic = p.slice(5).replace(/\/sse$/, ''); if (!/^[a-z0-9_-]{3,40}$/i.test(topic)) { res.writeHead(400, CORS); return res.end(); }
      if (req.method === 'POST' || req.method === 'PUT') return relayPost(topic, req, res); if (req.method === 'GET' && p.endsWith('/sse')) return relaySse(topic, req, res); res.writeHead(404, CORS); return res.end(); }
    if (p === '/juego' || p === '/juego/' || p === '/juego/index.html') { const b = gameHtml(); res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }); return res.end(b); }
    const ip = clientIp(req), Q = k => u.searchParams.get(k); let m;
    /* ---- prueba de conexión (la abre el jugador en su teléfono: mide latencia, bajada y subida hasta ESTE servidor por la ruta real) ---- */
    if (p === '/prueba' || p === '/prueba/') { let h; try { h = fs.readFileSync(path.join(ROOT, 'prueba.html')); } catch (e) { res.writeHead(404); return res.end('Falta prueba.html'); } res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); return res.end(h); }
    if (p === '/prueba/ping') { if (limited('pp:' + ip, 300, 60000)) { res.writeHead(429, CORS); return res.end(); } res.writeHead(200, Object.assign({ 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }, CORS)); return res.end(String(Date.now())); }
    if (p === '/prueba/down') { if (limited('pd:' + ip, 20, 60000)) { res.writeHead(429, CORS); return res.end(); } const kb = Math.max(1, Math.min(4096, +Q('kb') || 512)); res.writeHead(200, Object.assign({ 'Content-Type': 'application/octet-stream', 'Cache-Control': 'no-store', 'Content-Length': kb * 1024 }, CORS)); return res.end(require('crypto').randomBytes(kb * 1024)); }
    if (p === '/prueba/up' && req.method === 'POST') { if (limited('pu:' + ip, 20, 60000)) { res.writeHead(429, CORS); return res.end(); } let n = 0, big = false; req.on('data', d => { n += d.length; if (n > 6 * 1048576 && !big) { big = true; req.destroy(); } }); req.on('end', () => json(res, 200, { bytes: n })); req.on('error', () => { }); return; }
    if (p === '/admin/apagar' && isLocal(req) && process.env.URSRV_PRUEBA === '1') { json(res, 200, { ok: true }); setTimeout(() => { if (globalThis.__bye) globalThis.__bye('prueba'); }, 200); return; }
    if (p === '/salas') {
      const a = auth(Q('uid'), Q('tok'), () => (ip === '127.0.0.1' || ip === '::1' || !limited('reg:' + ip, CFG.registrosPorDiezMinIp, 600000))), uid = a.ok ? a.uid : null;
      freshAll().then(() => { const list = [...rooms.values()].filter(r => !r.dynamic || r.publica || (uid && r.owner === uid)).map(r => Object.assign(r.info(), { mia: !!(uid && r.owner === uid) }));
        list.sort((x, y) => (x.usuario ? 1 : 0) - (y.usuario ? 1 : 0) || (y.jugadores - x.jugadores)); json(res, 200, { servidor: CFG.nombreServidor, ice: ICE(), crear: CFG.salasUsuario, plan: uid ? planOf(uid) : { anfitrion: false, salasMax: CFG.gratisSalasMax, salasUsadas: 0, salas247: 0, gratisMax: CFG.gratisSalasMax, max247: max247() }, salas: list, app: appInfo() }); }); return; }
    if (p === '/sala/crear') {
      if (limited('crear:' + ip, 12, 3600000)) return json(res, 429, { ok: false, error: 'Demasiadas salas creadas desde este dispositivo. Intenta más tarde.' });
      const a = auth(Q('uid'), Q('tok'), true); if (!a.ok) return json(res, 403, { ok: false, error: a.error });
      const o = createRoom(a.uid, Q('nombre'), Q('tipo') !== 'privada', Q('plan') === '247'); return json(res, o.ok ? 200 : 400, o); }
    if (p === '/licencia/canjear') {
      if (limited('lic:' + ip, 10, 600000)) return json(res, 429, { ok: false, error: 'Demasiados intentos. Espera unos minutos.' });
      const a = auth(Q('uid'), Q('tok'), true); if (!a.ok) return json(res, 403, { ok: false, error: a.error });
      const code = String(Q('codigo') || '').toUpperCase().replace(/[^A-Z0-9-]/g, ''), L = readJson('licencias.json', {}), l = L[code];
      if (!l) return json(res, 404, { ok: false, error: 'Código no válido.' });
      if (l.uid && l.uid !== a.uid) return json(res, 409, { ok: false, error: 'Ese código ya fue usado por otro jugador.' });
      if (!l.uid) { l.uid = a.uid; l.vence = Date.now() + l.dias * 86400000; writeJson('licencias.json', L); }
      const O = ownersAll(); O[a.uid].lic = code; writeJson('duenos.json', O); log('[licencia] ' + code + ' canjeada'); return json(res, 200, { ok: true, plan: planOf(a.uid) }); }
    m = p.match(/^\/sala\/([A-Za-z0-9]{4,6})\/info$/);
    if (m) { const au = auth(Q('uid'), Q('tok'), () => (ip === '127.0.0.1' || ip === '::1' || !limited('reg:' + ip, CFG.registrosPorDiezMinIp, 600000))); const r = rooms.get(m[1].toUpperCase()); if (!r) { if (limited('nf:' + ip, 40, 60000)) return json(res, 429, { ok: false }); return json(res, 404, { ok: false, error: 'No existe una sala con ese código.' }); } r.fresh().then(() => json(res, 200, { ok: true, sala: Object.assign(r.info(), { mia: !!(au.ok && r.owner === au.uid) }) })); return; }
    m = p.match(/^\/sala\/([A-Za-z0-9]{4,6})\/verificar$/);
    if (m) { if (!isLocal(req)) return json(res, 403, { ok: false }); return json(res, 200, verifyJoin(m[1].toUpperCase(), Q('uid'), Q('n'), Q('s'))); }
    m = p.match(/^\/sala\/([A-Za-z0-9]{4,6})\/(jugadores|reportar)$/);
    if (m) {
      const r = rooms.get(m[1].toUpperCase()); if (!r) return json(res, 404, { ok: false, error: 'No existe esa sala.' });
      const a = auth(Q('uid'), Q('tok'), false); if (!a.ok) return json(res, 403, { ok: false, error: 'identidad no válida' });
      (async () => {
        const pls = await r.players(), me = pls.find(x => x.uid === a.uid); if (!me) return json(res, 403, { ok: false, error: 'Solo quien está en la sala puede hacer eso.' });
        if (m[2] === 'jugadores') return json(res, 200, { ok: true, yo: me.slot, jugadores: pls.map(x => ({ slot: x.slot, nombre: x.nombre })) });
        const slot = +Q('slot'), tg = pls.find(x => x.slot === slot), motivo = MOTIVOS[Q('motivo')] ? Q('motivo') : 'otro';
        if (!tg || tg.uid === a.uid) return json(res, 400, { ok: false, error: 'Elige a otro jugador de la sala.' });
        if (limited('rep:' + a.uid, 10, 86400000)) return json(res, 429, { ok: false, error: 'Demasiados reportes hoy.' });
        const R = reportsAll(), dup = R.find(x => x.de === a.uid && x.contra === tg.uid && Date.now() - x.fecha < 1800000); if (dup) return json(res, 200, { ok: true, mensaje: 'Ya reportaste a este jugador hace poco. Gracias.' });
        R.push({ id: newCode(6), sala: r.id, de: a.uid, contra: tg.uid, nombreContra: tg.nombre, motivo, fecha: Date.now(), estado: 'nuevo' });
        const distinct = new Set(R.filter(x => x.sala === r.id && x.contra === tg.uid && x.estado === 'nuevo' && Date.now() - x.fecha < 86400000).map(x => x.de)).size; let msg = 'Reporte enviado. Gracias por avisar.';
        if (CFG.reportesParaExpulsar > 0 && distinct >= CFG.reportesParaExpulsar) { await r.kick(tg.slot, 'Te expulsaron por reportes de otros jugadores.'); for (const x of R) if (x.sala === r.id && x.contra === tg.uid && x.estado === 'nuevo') x.estado = 'expulsado'; msg = 'Reporte enviado. El jugador fue expulsado por varios reportes.'; log('[' + r.id + '] auto-expulsión por reportes de ' + String(tg.uid).slice(0, 6)); }
        saveReports(R); log('[' + r.id + '] reporte (' + motivo + ') contra ' + String(tg.uid).slice(0, 6)); return json(res, 200, { ok: true, mensaje: msg });
      })().catch(e => json(res, 500, { ok: false, error: e.message })); return;
    }
    if (p === '/admin') { if (!adminOk(req)) return adminDenied(req, res, true);  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); return res.end(adminPage()); }
    if (p === '/admin/api/estado') { if (!adminOk(req)) return adminDenied(req, res, false); 
      (async () => { const salas = []; for (const r of rooms.values()) { await r.fresh(); const i = r.info(); i.pps = r.pps ? +r.pps.toFixed(1) : null; const rep = reportsAll().filter(x => x.sala === r.id && x.estado === 'nuevo'); const pl = await r.players(); i.jug = pl.map(x => ({ slot: x.slot, nombre: x.nombre, id: String(x.uid || '').slice(0, 6), reportes: new Set(rep.filter(y => y.contra === x.uid).map(y => y.de)).size })); salas.push(i); }
        const b = bansAll(), bans = Object.entries(b.global || {}).map(([uid, v]) => Object.assign({ uid, ambito: 'servidor', sala: '' }, v)); for (const [sid, o] of Object.entries(b.salas || {})) for (const [uid, v] of Object.entries(o)) bans.push(Object.assign({ uid, ambito: 'sala ' + sid, sala: sid }, v));
        json(res, 200, { salas, reportes: reportsAll().filter(x => x.estado === 'nuevo').slice(-50).map(x => ({ id: x.id, sala: x.sala, nombre: x.nombreContra, contra: String(x.contra).slice(0, 6), motivo: MOTIVOS[x.motivo] || x.motivo, fecha: x.fecha })), bans, licencias: Object.keys(readJson('licencias.json', {})).length }); })().catch(e => json(res, 500, { error: e.message })); return; }
    if (p === '/admin/api/sala') { if (!adminOk(req)) return adminDenied(req, res, false);  const r = rooms.get((Q('id') || '').toUpperCase()); if (!r) return json(res, 404, { ok: false, error: 'sala desconocida' }); if (Q('accion') === 'borrar') { if (!r.dynamic) return json(res, 400, { ok: false, error: 'Las salas oficiales se quitan en config.json.' }); deleteRoom(r).then(() => json(res, 200, { ok: true })); return; } manage(r, Q('accion'), Q, true).then(o => json(res, 200, o)).catch(e => json(res, 500, { ok: false, error: e.message })); return; }
    if (p === '/admin/api/desbanear') { if (!adminOk(req)) return adminDenied(req, res, false);  delBan(Q('sala') || null, Q('uid')); return json(res, 200, { ok: true }); }
    m = p.match(/^\/sala\/([A-Za-z0-9]{4,6})\/gestionar$/);
    if (m) {
      const r = rooms.get(m[1].toUpperCase()); if (!r || !r.dynamic) { if (limited('nf:' + ip, 40, 60000)) return json(res, 429, { ok: false }); return json(res, 404, { ok: false, error: 'sala desconocida' }); }
      const a = auth(Q('uid'), Q('tok'), false); if (!a.ok || r.owner !== a.uid) return json(res, 403, { ok: false, error: 'Solo el dueño de la sala puede hacer eso.' });
      const act = Q('accion');
      if (act === 'borrar') { deleteRoom(r).then(() => json(res, 200, { ok: true })); return; }
      if (act === 'publica' || act === 'privada') { r.publica = act === 'publica'; saveUserRooms(); return json(res, 200, { ok: true }); }
      manage(r, act, Q, false).then(o => json(res, o.ok === false ? 400 : 200, o)).catch(e => json(res, 500, { ok: false, error: e.message })); return; }
    if (p === '/admin/licencia') { if (!adminOk(req)) return adminDenied(req, res, false);  const c = genLicense(+Q('dias') || 30, +Q('salas') || 0, Q('nota')); return json(res, 200, { codigo: c }); }
    m = p.match(/^\/sala\/([A-Za-z0-9]{4,6})\/despertar$/);
    if (m) { auth(Q('uid'), Q('tok'), () => (ip === '127.0.0.1' || ip === '::1' || !limited('reg:' + ip, CFG.registrosPorDiezMinIp, 600000))); const r = rooms.get(m[1].toUpperCase()); if (!r) { if (limited('nf:' + ip, 40, 60000)) return json(res, 429, { ok: false, error: 'Demasiados intentos.' }); return json(res, 404, { ok: false, error: 'No existe una sala con ese código.' }); } wake(r).then(o => json(res, o.ok ? 200 : 503, o)); return; }
    if (p === '/estado') { freshAll().then(() => json(res, 200, { activo: [...rooms.values()].some(r => r.status === 'activa'), tailscale: tailscaleIp(), url: urlJuego(), salasActivas: activeCount(), salas: [...rooms.values()].map(r => r.info()) })); return; }
    if (p === '/admin/guardar') { if (!adminOk(req)) return adminDenied(req, res, false);  Promise.all([...rooms.values()].map(r => r.saveWorld('manual'))).then(o => { res.writeHead(200); res.end('guardado: ' + o.filter(Boolean).length + ' sala(s)'); }); return; }
    m = p.match(/^\/admin\/dormir\/([A-Za-z0-9]{4,6})$/); if (m) { if (!adminOk(req)) return adminDenied(req, res, false); const r = rooms.get(m[1].toUpperCase()); if (!r) { res.writeHead(404); return res.end(); } r.sleep('manual').then(() => { res.writeHead(200); res.end('dormida'); }); return; }
    if (p === '/admin/eval' && isLocal(req) && (process.env.URSRV_DEBUG === '1' || process.env.URSRV_PRUEBA === '1')) { const r = rooms.get((u.searchParams.get('sala') || '').toUpperCase()); if (!r || !r.page) { res.writeHead(404); return res.end('sala no activa'); } r.page.evaluate(c => { try { return JSON.stringify((0, eval)(c)); } catch (e) { return 'ERR ' + e.message; } }, u.searchParams.get('js') || '').then(o => { res.writeHead(200); res.end(String(o)); }).catch(e => { res.writeHead(500); res.end(e.message); }); return; }
    if (p === '/' || p === '/index.html') { freshAll().then(() => { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(landing(isLocal(req))); }); return; }
    if (p === '/favicon.ico') { res.writeHead(204); return res.end(); }
    res.writeHead(404); res.end('no encontrado');
  } catch (e) { try { res.writeHead(500); res.end(); } catch (e2) { } log('[http] error:', e.message); }
}
/* ---------------- relé WebSocket: el juego sin WebRTC (no hace falta Tailscale en el móvil) ----------------
   invitado ⇄ servidor ⇄ anfitrión de la sala (el navegador sin pantalla de este mismo PC). El servidor verifica identidad y baneos al entrar. */
const wss = new WebSocketServer({ noServer: true, maxPayload: 512 * 1024, perMessageDeflate: false });
const ipConn = new Map(); const ipConns = (ip, d) => { const n = Math.max(0, (ipConn.get(ip) || 0) + d); if (n) ipConn.set(ip, n); else ipConn.delete(ip); return n; };
function wsClose(ws, code, reason) { try { ws.close(code, String(reason || '').slice(0, 100)); } catch (e) { try { ws.terminate(); } catch (e2) { } } }
function onUpgrade(req, socket, head) {
  let u; try { u = new URL(req.url, 'http://x'); } catch (e) { return socket.destroy(); } if (u.pathname !== '/ws') return socket.destroy();
  const role = u.searchParams.get('role') || 'guest', room = rooms.get(String(u.searchParams.get('room') || '').toUpperCase().slice(0, 6)), ip = clientIp(req);
  if ((role === 'host' || role === 'peer') && !isLocal(req)) { socket.write('HTTP/1.1 403 Forbidden\r\n\r\n'); return socket.destroy(); }
  if (role === 'guest' && !isLocal(req) && limited('ws:' + ip, CFG.conexionesPorMinutoIp, 60000)) { socket.write('HTTP/1.1 429 Too Many Requests\r\n\r\n'); return socket.destroy(); }
  wss.handleUpgrade(req, socket, head, ws => {
    ws.isAlive = true; ws.on('pong', () => { ws.isAlive = true; }); ws.on('error', () => { });
    if (!room) return wsClose(ws, 4404, 'No existe esa sala.');
    if (role === 'host') return wsHost(ws, room); if (role === 'peer') return wsPeer(ws, room, u.searchParams.get('pid')); wsGuest(ws, room, u, ip);
  });
}
function wsHost(ws, room) {
  if (room.ctl && room.ctl.readyState === 1) { try { room.ctl.terminate(); } catch (e) { } } room.ctl = ws; ws.on('close', () => { if (room.ctl === ws) room.ctl = null; });
  ws.on('message', d => { let m; try { m = JSON.parse(d.toString()); } catch (e) { return; } if (m.k === 'deny') { const b = room.bridges.get(m.pid); if (b) { room.bridges.delete(m.pid); clearTimeout(b.timer); wsClose(b.guest, 4409, m.m || 'No puedes entrar.'); } } });
}
function wsGuest(ws, room, u, ip) {
  const n = ipConns(ip, +1); ws.on('close', () => ipConns(ip, -1)); if (n > CFG.maxConexionesPorIp && ip !== '127.0.0.1' && ip !== '::1') return wsClose(ws, 4429, 'Demasiadas conexiones desde tu red.');
  if (room.status !== 'activa' || !room.ctl || room.ctl.readyState !== 1) return wsClose(ws, 4503, 'La sala no está lista. Intenta de nuevo en unos segundos.');
  const v = verifyJoin(room.id, u.searchParams.get('uid'), u.searchParams.get('n'), u.searchParams.get('s')); if (!v.ok) return wsClose(ws, 4403, v.error);
  const pid = newCode(10), b = { guest: ws, peer: null, buf: [], bytes: 0, timer: null, rate: { t: Date.now(), n: 0 } }; room.bridges.set(pid, b);
  b.timer = setTimeout(() => { if (!b.peer) { room.bridges.delete(pid); wsClose(ws, 4504, 'La sala no respondió.'); } }, 10000);
  ws.on('message', (d, isBin) => {
    const t = Date.now(); if (t - b.rate.t > 1000) { b.rate.t = t; b.rate.n = 0; } if (++b.rate.n > 400) return wsClose(ws, 1008, 'Demasiados mensajes.');
    if (b.peer) { if (b.peer.readyState === 1) b.peer.send(d, { binary: isBin }); } else if (b.buf.length < 200 && b.bytes < 1e6) { b.buf.push([d, isBin]); b.bytes += d.length; }
  });
  ws.on('close', () => { clearTimeout(b.timer); room.bridges.delete(pid); if (b.peer) wsClose(b.peer, 1000, ''); });
  try { room.ctl.send(JSON.stringify({ k: 'join', pid, uid: v.uid || '' })); } catch (e) { wsClose(ws, 4503, 'La sala no está lista.'); }
}
function wsPeer(ws, room, pid) {
  const b = room.bridges.get(String(pid || '')); if (!b || b.peer) return wsClose(ws, 4404, 'sin pareja');
  b.peer = ws; clearTimeout(b.timer); for (const [d, isBin] of b.buf) ws.send(d, { binary: isBin }); b.buf = [];
  ws.on('message', (d, isBin) => { if (b.guest.readyState === 1) { if (b.guest.bufferedAmount > 8e6) return wsClose(b.guest, 1013, 'Tu conexión es demasiado lenta.'); b.guest.send(d, { binary: isBin }); } });
  ws.on('close', () => { room.bridges.delete(pid); wsClose(b.guest, 1000, ''); });
}
setInterval(() => { for (const ws of wss.clients) { if (!ws.isAlive) { try { ws.terminate(); } catch (e) { } continue; } ws.isAlive = false; try { ws.ping(); } catch (e) { } } }, 20000);
const servers = new Map();
function listen(addr) { if (servers.has(addr)) return; const srv = http.createServer(handler); srv.on('error', e => log('[http] ' + addr + ': ' + e.message)); srv.on('upgrade', onUpgrade); srv.keepAliveTimeout = 65000; srv.headersTimeout = 20000; srv.requestTimeout = 120000; srv.listen(CFG.puerto, addr, () => log('[http] escuchando en http://' + addr + ':' + CFG.puerto + '/')); servers.set(addr, srv); }
function bindAll() { listen('127.0.0.1'); if (CFG.escuchar === 'todas') { listen('0.0.0.0'); return; } const ip = tailscaleIp(); if (ip) listen(ip); }

/* ---------------- arranque / cierre ---------------- */
(async () => {
  /* el registro técnico (puede incluir IPs de accesos denegados) se conserva 30 días, como dice la política de privacidad */
  const trimLog = () => { try { const f = path.join(DATA, 'servidor.log'); if (!fs.existsSync(f)) return; const lim = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10); const ls = fs.readFileSync(f, 'utf8').split('\n'), keep = ls.filter(l => !l || l.slice(0, 10) >= lim || !/^\d{4}-\d{2}-\d{2}/.test(l)); if (keep.length < ls.length) fs.writeFileSync(f, keep.join('\n')); } catch (e) { } };
  trimLog(); setInterval(trimLog, 864e5);
  log('Último Refugio · servidor multijugador. Datos en', DATA); bindAll();
  log('PANEL DE ADMINISTRACIÓN: abre en este PC  http://127.0.0.1:' + CFG.puerto + '/admin' + (CFG.claveAdmin ? '  (desde otros dispositivos: usuario admin + claveAdmin)' : '  (solo desde este PC)'));
  if (!tailscaleIp() && CFG.escuchar !== 'todas') log('AVISO: no se detecta Tailscale (100.x.x.x). Solo se podrá jugar desde este equipo hasta que Tailscale esté activo; se detectará solo.');
  if (urlPub()) log('Dirección pública configurada:', urlPub(), '(los jugadores entran sin Tailscale mientras esté publicada)');
  else if (tailscaleIp()) log('Tailscale detectado:', tailscaleIp(), '→ en el juego: MULTIJUGADOR → «' + tailscaleIp() + ':' + CFG.puerto + '»');
  { const big = [...rooms.values()].filter(r => !r.dynamic && (SIZES[r.cfg.tamano !== undefined ? r.cfg.tamano : CFG.tamano] || 0) >= 960).length, gb = (os.totalmem() / 1073741824).toFixed(1);
    if (big) { log('Mapa nuevo 960×960 en ' + big + ' sala(s) oficial(es). Cada sala activa usa ~0,8 GB de RAM (el PC tiene ' + gb + ' GB); las salas se duermen solas tras ' + CFG.dormirTrasMin + ' min sin jugadores.'); if (os.totalmem() < 7.5 * 1073741824 && Math.min(big, CFG.salasActivasMax) >= 3) log('AVISO: con ' + gb + ' GB de RAM, 3 salas 960 activas a la vez pueden dejar poca memoria libre. Ejecuta PROBAR_CARGA.bat con las 3 salas; si falla, baja «salasActivasMax» a 2.'); } }
  log('Salas:', [...rooms.values()].map(r => r.id + ' («' + r.nombre + '»)').join(', '), '· máx. ' + CFG.maxJugadores + ' jugadores por sala · ' + (CFG.salasUsuarioActivasMax != null ? CFG.salasActivasMax + ' oficiales + ' + CFG.salasUsuarioActivasMax + ' de jugadores activas a la vez' : CFG.salasActivasMax + ' salas activas a la vez'));
  setInterval(() => { if (CFG.escuchar !== 'todas') bindAll(); }, 10000);
  maintenance(); setInterval(maintenance, 10 * 60000);
  setInterval(() => { for (const r of rooms.values()) r.watchdog().catch(e => log('[vigilante ' + r.id + ']', e.message)); }, 5000);
  /* con todas las salas dormidas el navegador no hace falta (~250 MB): se cierra tras 2 min y se vuelve a abrir solo al despertar una sala */
  let idleSince = 0;
  setInterval(() => { try {
    const busy = [...rooms.values()].some(r => r.status !== 'dormida' || r.promise);
    if (busy || !browser || browserStarting) { idleSince = 0; return; }
    if (!idleSince) { idleSince = Date.now(); return; }
    if (Date.now() - idleSince > 120000) { const b = browser; browser = null; idleSince = 0; b.close().then(() => log('[navegador] cerrado por inactividad (se abre solo al despertar una sala)')).catch(() => { }); }
  } catch (e) { } }, 15000);
  setInterval(() => { for (const r of rooms.values()) if (r.status === 'activa') r.saveWorld('auto').catch(() => { }); }, Math.max(20, CFG.guardarCadaSeg) * 1000);
  let closing = false; const bye = globalThis.__bye = async sig => { if (closing) return; closing = true; log('Cerrando (' + sig + '): guardando los mundos…'); for (const r of rooms.values()) { try { await r.sleep(); } catch (e) { } } try { if (browser) await browser.close(); } catch (e) { } process.exit(0); };
  process.on('SIGINT', () => bye('SIGINT')); process.on('SIGTERM', () => bye('SIGTERM')); process.on('SIGBREAK', () => bye('SIGBREAK')); process.on('SIGHUP', () => bye('SIGHUP'));
  process.on('uncaughtException', e => log('[error]', e.stack || e.message)); process.on('unhandledRejection', e => log('[error]', (e && e.message) || e));
})();
