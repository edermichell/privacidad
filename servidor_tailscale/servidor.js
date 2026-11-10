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
let chromium; try { chromium = require('playwright-core').chromium; } catch (e) { try { chromium = require('playwright').chromium; } catch (e2) { console.error('Falta playwright-core. Ejecuta INSTALAR (o: npm install).'); process.exit(1); } }

const ROOT = __dirname;
const DEF = { puerto: 8080, nombreServidor: 'Servidor', salas: [{ id: 'SALA1', nombre: 'Refugio 1' }, { id: 'SALA2', nombre: 'Refugio 2' }], maxJugadores: 10, salasActivasMax: 3, dormirTrasMin: 10,
  semilla: '', modo: 'casual', dificultad: 'normal', tamano: 'huge', zombis: 1, botin: 1, lluvia: 1, mundo: 'region',
  simularSinJugadores: false, fpsServidor: 30, salasUsuario: true, gratisSalasMax: 1, gratisCaducaDias: 14, salas247Max: 2, simular247: false, salasUsuarioMax: 40, licenciaSalasPorDefecto: 3, guardarCadaSeg: 120, copias: 12, escuchar: 'tailscale', usarStunTurn: false, navegador: '', canal: '', carpetaDatos: 'datos' };
let CFG = Object.assign({}, DEF);
try { CFG = Object.assign(CFG, JSON.parse(fs.readFileSync(process.env.CONFIG || path.join(ROOT, 'config.json'), 'utf8'))); } catch (e) { if (e.code !== 'ENOENT') { console.error('config.json inválido:', e.message); process.exit(1); } }
if (process.env.PORT) CFG.puerto = +process.env.PORT;
if (process.env.ESCUCHAR) CFG.escuchar = process.env.ESCUCHAR;
if (process.env.NAVEGADOR) CFG.navegador = process.env.NAVEGADOR;
CFG.maxJugadores = Math.max(1, Math.min(10, CFG.maxJugadores | 0 || 10));
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
  if (!register) return { ok: false, unknown: true };
  O[uid] = { th, lic: null, creado: Date.now() }; writeJson('duenos.json', O); return { ok: true, uid };
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
  const o = { headless: true, handleSIGINT: false, handleSIGTERM: false, handleSIGHUP: false, args: ['--disable-features=WebRtcHideLocalIpsWithMdns', '--autoplay-policy=no-user-gesture-required', '--mute-audio', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check'] };
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
const WORLDKEYS = ['semilla', 'modo', 'dificultad', 'tamano', 'zombis', 'botin', 'lluvia', 'mundo'];

class Room {
  constructor(cfg) {
    this.id = cfg.id; this.nombre = cfg.nombre; this.cfg = cfg; this.dir = path.join(DATA, 'salas', this.id); fs.mkdirSync(path.join(this.dir, 'copias'), { recursive: true });
    this.save = path.join(this.dir, 'mundo_actual.json'); this.ctx = null; this.page = null; this.status = 'dormida'; this.state = null; this.lastBusy = Date.now(); this.lastSave = 0; this.lastCopy = 0;
    this.restarts = 0; this.failN = 0; this.nextTry = 0; this.startedAt = 0; this.badCount = 0; this.promise = null; this.stopping = false; this.freshAt = 0; this.wanted = false;
    this.dynamic = !!cfg.dynamic; this.owner = cfg.owner || null; this.publica = cfg.publica !== false; this.plan247 = !!cfg.plan247; this.creada = cfg.creada || Date.now(); this.lastPlayers = cfg.lastPlayers || Date.now();
  }
  get nunca() { return this.plan247; }
  record() { return { id: this.id, nombre: this.nombre, owner: this.owner, publica: this.publica, plan247: this.plan247, creada: this.creada, lastPlayers: this.lastPlayers, dynamic: true }; }
  world() { const w = {}; for (const k of WORLDKEYS) w[k] = this.cfg[k] !== undefined ? this.cfg[k] : CFG[k]; return w; }
  hasSave() { try { return fs.statSync(this.save).size > 1000; } catch (e) { return false; } }
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
      const page = await ctx.newPage(); this.page = page;
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
      await page.evaluate(c => { SRV.boot({ pausar: c.pausar, ice: c.ice, max: c.max, code: c.code, fps: c.fps }); SRV.spawn = [P.x, P.y]; if (NET.role !== 'host') netHost(); }, { pausar: !(this.plan247 ? CFG.simular247 : CFG.simularSinJugadores), ice: ICE(), max: CFG.maxJugadores, code: this.id, fps: CFG.fpsServidor });
      this.startedAt = Date.now(); this.failN = 0; this.lastBusy = Date.now(); this.status = 'activa'; log('[' + this.id + '] sala lista (máx. ' + CFG.maxJugadores + ' jugadores)');
    } catch (e) {
      this.failN++; this.nextTry = Date.now() + Math.min(60000, 5000 * this.failN); this.status = 'dormida'; log('[' + this.id + '] no pudo arrancar:', String(e.message || e).split('\n')[0]);
      if (/Executable doesn't exist|executable doesn't exist|Failed to launch|ENOENT/i.test(e.message || '')) log('FALTA EL NAVEGADOR. Windows: instala Microsoft Edge. Linux/Mac: «npx playwright-core install chromium», o indica «navegador» / «canal» (chrome, msedge) en config.json.');
      await this._close(true);
    }
  }
  async _close(quiet) { const c = this.ctx; this.ctx = null; this.page = null; if (!c) return; try { await Promise.race([c.close(), new Promise(r => setTimeout(r, 8000))]); } catch (e) { } if (!quiet) log('[' + this.id + '] sala cerrada'); }
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
        day: typeof GT !== 'undefined' ? Math.floor(GT.min / 1440) + 1 : undefined, paused: SRV.paused ? 1 : 0, z: Z.filter(z => z.st !== 'dead').length, npcs: NPCS.length, err: (typeof E80 !== 'undefined' ? E80.n : 0) + (typeof DBGC !== 'undefined' ? DBGC.n : 0) })), new Promise((_, rej) => setTimeout(() => rej(new Error('sin respuesta')), 8000))]);
    } catch (e) { return { bad: e.message }; }
  }
  async fresh() { if (this.status !== 'activa' || Date.now() - this.freshAt < 1500) return; this.freshAt = Date.now(); const s = await this.poll(); if (s && !s.bad) this.state = s; }
  async watchdog() {
    if (this.stopping || this.promise) return;
    if (this.status === 'dormida') { if ((this.wanted || (this.nunca && licenseOk(this.owner))) && Date.now() >= this.nextTry && (this.nunca || activeCount() < CFG.salasActivasMax)) await this.start(); return; }
    if (this.status !== 'activa') return;
    const s = await this.poll(); this.state = s;
    if (!this.page || !s || s.bad || s.st !== 'play' || !(browser && browser.isConnected())) { this.badCount++; if (this.badCount >= 2 || !this.page) { log('[' + this.id + '] anfitrión caído (' + ((s && (s.bad || s.st)) || 'sin página') + '), reiniciando'); this.badCount = 0; this.restarts++; this.status = 'dormida'; this.wanted = true; this.nextTry = 0; await this._close(true); await this.start(); } return; }
    this.badCount = 0;
    if (s.peers + s.connecting > 0) { this.lastBusy = Date.now(); if (this.dynamic && Date.now() - this.lastPlayers > 60000) { this.lastPlayers = Date.now(); saveUserRooms(); } }
    else if (!this.nunca && CFG.dormirTrasMin > 0 && Date.now() - this.lastBusy > CFG.dormirTrasMin * 60000) { await this.sleep('sin jugadores ' + CFG.dormirTrasMin + ' min'); return; }
    if ((s.role !== 'host' || s.es === 2) && !s.peers && !s.connecting) { log('[' + this.id + '] la sala no estaba abierta, reabriendo'); try { await this.page.evaluate(() => { if (NET.role) netClose(); netHost(); }); } catch (e) { } }
  }
  info() { const s = this.state || {}; return { id: this.id, nombre: this.nombre, estado: this.status, jugadores: this.status === 'activa' ? (s.peers || 0) : 0, conectando: s.connecting || 0, max: CFG.maxJugadores, dia: this.status === 'activa' ? s.day : undefined, nombres: this.status === 'activa' ? (s.names || []) : [], zombis: s.z, pausada: !!s.paused, reinicios: this.restarts, ultimoGuardado: this.lastSave ? new Date(this.lastSave).toISOString() : null, errores: s.err || 0, guardada: this.hasSave(), publica: this.publica, plan247: this.plan247, usuario: this.dynamic }; }
}
const rooms = new Map(CFG.salas.map(c => [c.id, new Room(c)]));
const saveUserRooms = () => { try { writeJson('salas_usuario.json', [...rooms.values()].filter(r => r.dynamic).map(r => r.record())); } catch (e) { log('[salas] no se pudo guardar la lista:', e.message); } };
for (const r of readJson('salas_usuario.json', [])) { if (r && r.id && !rooms.has(r.id)) rooms.set(r.id, new Room(Object.assign({}, r, { dynamic: true }))); }
const userRooms = uid => [...rooms.values()].filter(r => r.dynamic && r.owner === uid);
const max247 = () => Math.min(CFG.salas247Max, Math.max(0, CFG.salasActivasMax - 1));
function planOf(uid) { const l = licOf(uid), own = userRooms(uid); return { anfitrion: !!l, vence: l ? new Date(l.vence).toISOString() : null, salasMax: l ? l.salas : CFG.gratisSalasMax, salasUsadas: own.length, salas247: own.filter(r => r.plan247).length, gratisMax: CFG.gratisSalasMax, max247: max247(), activas247: [...rooms.values()].filter(r => r.plan247).length }; }
function createRoom(uid, nombre, publica, want247) {
  if (!CFG.salasUsuario) return { ok: false, error: 'Este servidor no permite crear salas.' };
  nombre = String(nombre || '').replace(/[<>&"\u0000-\u001f]/g, '').trim().slice(0, 24); if (nombre.length < 3) return { ok: false, error: 'Ponle un nombre de 3 a 24 letras.' };
  const pl = planOf(uid); if (want247 && !pl.anfitrion) return { ok: false, error: 'Las salas 24/7 son para «Buen anfitrión».' };
  if (pl.salasUsadas >= pl.salasMax) return { ok: false, error: pl.anfitrion ? 'Ya tienes ' + pl.salasMax + ' salas (tu límite). Borra una para crear otra.' : 'Ya tienes tu sala gratis. Con «Buen anfitrión» puedes tener más y 24/7.' };
  if ([...rooms.values()].filter(r => r.dynamic).length >= CFG.salasUsuarioMax) return { ok: false, error: 'El servidor llegó a su máximo de salas de jugadores.' };
  if (want247) { if (!pl.anfitrion) return { ok: false, error: 'Las salas 24/7 son para «Buen anfitrión».' }; if (pl.salas247 >= pl.salasMax) return { ok: false, error: 'Ya usas todas tus salas 24/7.' }; if (pl.activas247 >= pl.max247) return { ok: false, error: 'El servidor no tiene cupo para más salas 24/7 ahora mismo.' }; }
  let id; do { id = newCode(6); } while (rooms.has(id));
  const r = new Room({ id, nombre, owner: uid, publica: !!publica, plan247: !!want247, dynamic: true }); rooms.set(id, r); saveUserRooms(); if (want247) { r.wanted = true; } log('[salas] nueva sala ' + id + ' «' + nombre + '» (' + (publica ? 'pública' : 'privada') + (want247 ? ', 24/7' : '') + ')');
  return { ok: true, id, sala: r.info() };
}
async function deleteRoom(r) { try { await r.sleep(); } catch (e) { } rooms.delete(r.id); saveUserRooms(); try { fs.rmSync(r.dir, { recursive: true, force: true }); } catch (e) { } log('[salas] sala ' + r.id + ' borrada'); }
function maintenance() {
  for (const r of [...rooms.values()]) {
    if (!r.dynamic) continue;
    if (r.plan247 && !licenseOk(r.owner)) { r.plan247 = false; saveUserRooms(); log('[salas] ' + r.id + ' deja de ser 24/7 (licencia vencida)'); }
    if (!r.plan247 && r.status === 'dormida' && Date.now() - r.lastPlayers > CFG.gratisCaducaDias * 86400000) deleteRoom(r).catch(() => { });
  }
}
const activeCount = () => [...rooms.values()].filter(r => r.status === 'activa' || r.status === 'iniciando').length;
async function wake(room) {
  if (room.status === 'activa') return { ok: true, estado: 'activa' }; if (room.status === 'iniciando') return { ok: true, estado: 'iniciando' };
  if (activeCount() >= CFG.salasActivasMax) return { ok: false, error: 'El servidor ya tiene ' + CFG.salasActivasMax + ' salas activas. Entra a una de ellas o espera a que se vacíe.' };
  room.nextTry = 0; room.start().catch(() => { }); return { ok: true, estado: 'iniciando' };
}

/* ---------------- HTTP ---------------- */
const json = (res, code, o) => { res.writeHead(code, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, CORS)); res.end(JSON.stringify(o)); };
const isLocal = req => { const a = req.socket.remoteAddress || ''; return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1'; };
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const freshAll = () => Promise.all([...rooms.values()].map(r => r.fresh()));
function urlJuego() { const ip = tailscaleIp(); return ip ? 'http://' + ip + ':' + CFG.puerto + '/juego/' : null; }
function landing() {
  const ip = tailscaleIp(), url = urlJuego() || ('http://' + os.hostname() + ':' + CFG.puerto + '/juego/');
  const rs = [...rooms.values()].filter(r => !r.dynamic || r.publica).map(r => r.info()).map(r => '<div class="c"><b>' + esc(r.nombre) + '</b> <small>(' + esc(r.id) + ')</small><br>' + (r.estado === 'activa' ? '<span class="ok">activa</span> · ' + r.jugadores + '/' + r.max + ' jugadores' + (r.nombres.length ? ' (' + r.nombres.map(esc).join(', ') + ')' : '') + (r.dia ? ' · día ' + r.dia : '') + ' · zombis ' + (r.zombis ?? '–') + (r.pausada ? ' · en pausa' : '') : '<span class="no">' + r.estado + '</span>' + (r.guardada ? ' · mundo guardado' : ' · mundo sin crear')) + '</div>').join('');
  return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Último Refugio · servidor</title><style>body{font-family:system-ui,Arial;background:#141816;color:#e8e4da;margin:0;padding:20px}main{max-width:560px;margin:0 auto}h1{margin:0 0 4px}.c{background:#1f2622;border:1px solid #38423b;border-radius:10px;padding:14px;margin:12px 0}a.btn{display:inline-block;background:#d9541e;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold}small{color:#9aa59d}.ok{color:#7dd36a}.no{color:#ff9a7a}</style></head><body><main><h1>Último Refugio</h1><small>Servidor multijugador · ' + esc(CFG.nombreServidor) + '</small>'
    + rs + '<div class="c"><a class="btn" href="/juego/">JUGAR</a><br><br><small>Dirección para los móviles (con Tailscale activo):<br><b>' + esc(url) + '</b><br>En el juego: MULTIJUGADOR → escribe <b>' + esc((ip || os.hostname()) + ':' + CFG.puerto) + '</b> → ACTUALIZAR → elige una sala.</small></div>'
    + (ip ? '' : '<div class="c no">No se detecta Tailscale en este equipo: solo se puede entrar desde aquí. Inicia Tailscale; se detecta solo en unos segundos.</div>') + '</main><script>setTimeout(()=>location.reload(),15000)</script></body></html>';
}
function handler(req, res) {
  const u = new URL(req.url, 'http://x'), p = u.pathname;
  try {
    if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
    if (p.startsWith('/sig/')) { const topic = p.slice(5).replace(/\/sse$/, ''); if (!/^[a-z0-9_-]{3,40}$/i.test(topic)) { res.writeHead(400, CORS); return res.end(); }
      if (req.method === 'POST' || req.method === 'PUT') return relayPost(topic, req, res); if (req.method === 'GET' && p.endsWith('/sse')) return relaySse(topic, req, res); res.writeHead(404, CORS); return res.end(); }
    if (p === '/juego' || p === '/juego/' || p === '/juego/index.html') { const b = gameHtml(); res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }); return res.end(b); }
    const ip = req.socket.remoteAddress || '?', Q = k => u.searchParams.get(k); let m;
    if (p === '/salas') {
      const a = auth(Q('uid'), Q('tok'), false), uid = a.ok ? a.uid : null;
      freshAll().then(() => { const list = [...rooms.values()].filter(r => !r.dynamic || r.publica || (uid && r.owner === uid)).map(r => Object.assign(r.info(), { mia: !!(uid && r.owner === uid) }));
        list.sort((x, y) => (x.usuario ? 1 : 0) - (y.usuario ? 1 : 0) || (y.jugadores - x.jugadores)); json(res, 200, { servidor: CFG.nombreServidor, ice: ICE(), crear: CFG.salasUsuario, plan: uid ? planOf(uid) : { anfitrion: false, salasMax: CFG.gratisSalasMax, salasUsadas: 0, salas247: 0, gratisMax: CFG.gratisSalasMax, max247: max247() }, salas: list }); }); return; }
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
    if (m) { const r = rooms.get(m[1].toUpperCase()); if (!r) { if (limited('nf:' + ip, 40, 60000)) return json(res, 429, { ok: false }); return json(res, 404, { ok: false, error: 'No existe una sala con ese código.' }); } r.fresh().then(() => json(res, 200, { ok: true, sala: r.info() })); return; }
    m = p.match(/^\/sala\/([A-Za-z0-9]{4,6})\/gestionar$/);
    if (m) {
      const r = rooms.get(m[1].toUpperCase()); if (!r || !r.dynamic) { if (limited('nf:' + ip, 40, 60000)) return json(res, 429, { ok: false }); return json(res, 404, { ok: false, error: 'sala desconocida' }); }
      const a = auth(Q('uid'), Q('tok'), false); if (!a.ok || r.owner !== a.uid) return json(res, 403, { ok: false, error: 'Solo el dueño de la sala puede hacer eso.' });
      const act = Q('accion');
      if (act === 'borrar') { deleteRoom(r).then(() => json(res, 200, { ok: true })); return; }
      if (act === 'publica' || act === 'privada') { r.publica = act === 'publica'; saveUserRooms(); return json(res, 200, { ok: true }); }
      return json(res, 400, { ok: false, error: 'acción desconocida' }); }
    if (p === '/admin/licencia' && isLocal(req)) { const c = genLicense(+Q('dias') || 30, +Q('salas') || 0, Q('nota')); return json(res, 200, { codigo: c }); }
    m = p.match(/^\/sala\/([A-Za-z0-9]{4,6})\/despertar$/);
    if (m) { const r = rooms.get(m[1].toUpperCase()); if (!r) { if (limited('nf:' + ip, 40, 60000)) return json(res, 429, { ok: false, error: 'Demasiados intentos.' }); return json(res, 404, { ok: false, error: 'No existe una sala con ese código.' }); } wake(r).then(o => json(res, o.ok ? 200 : 503, o)); return; }
    if (p === '/estado') { freshAll().then(() => json(res, 200, { activo: [...rooms.values()].some(r => r.status === 'activa'), tailscale: tailscaleIp(), url: urlJuego(), salasActivas: activeCount(), salas: [...rooms.values()].map(r => r.info()) })); return; }
    if (p === '/admin/guardar' && isLocal(req)) { Promise.all([...rooms.values()].map(r => r.saveWorld('manual'))).then(o => { res.writeHead(200); res.end('guardado: ' + o.filter(Boolean).length + ' sala(s)'); }); return; }
    m = p.match(/^\/admin\/dormir\/([A-Za-z0-9]{4,6})$/); if (m && isLocal(req)) { const r = rooms.get(m[1].toUpperCase()); if (!r) { res.writeHead(404); return res.end(); } r.sleep('manual').then(() => { res.writeHead(200); res.end('dormida'); }); return; }
    if (p === '/admin/eval' && isLocal(req) && process.env.URSRV_DEBUG === '1') { const r = rooms.get((u.searchParams.get('sala') || '').toUpperCase()); if (!r || !r.page) { res.writeHead(404); return res.end('sala no activa'); } r.page.evaluate(c => { try { return JSON.stringify((0, eval)(c)); } catch (e) { return 'ERR ' + e.message; } }, u.searchParams.get('js') || '').then(o => { res.writeHead(200); res.end(String(o)); }).catch(e => { res.writeHead(500); res.end(e.message); }); return; }
    if (p === '/' || p === '/index.html') { freshAll().then(() => { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(landing()); }); return; }
    if (p === '/favicon.ico') { res.writeHead(204); return res.end(); }
    res.writeHead(404); res.end('no encontrado');
  } catch (e) { try { res.writeHead(500); res.end(); } catch (e2) { } log('[http] error:', e.message); }
}
const servers = new Map();
function listen(addr) { if (servers.has(addr)) return; const srv = http.createServer(handler); srv.on('error', e => log('[http] ' + addr + ': ' + e.message)); srv.keepAliveTimeout = 65000; srv.listen(CFG.puerto, addr, () => log('[http] escuchando en http://' + addr + ':' + CFG.puerto + '/')); servers.set(addr, srv); }
function bindAll() { listen('127.0.0.1'); if (CFG.escuchar === 'todas') { listen('0.0.0.0'); return; } const ip = tailscaleIp(); if (ip) listen(ip); }

/* ---------------- arranque / cierre ---------------- */
(async () => {
  log('Último Refugio · servidor multijugador. Datos en', DATA); bindAll();
  if (!tailscaleIp() && CFG.escuchar !== 'todas') log('AVISO: no se detecta Tailscale (100.x.x.x). Solo se podrá jugar desde este equipo hasta que Tailscale esté activo; se detectará solo.');
  else if (tailscaleIp()) log('Tailscale detectado:', tailscaleIp(), '→ en el juego: MULTIJUGADOR → «' + tailscaleIp() + ':' + CFG.puerto + '»');
  log('Salas:', [...rooms.values()].map(r => r.id + ' («' + r.nombre + '»)').join(', '), '· máx. ' + CFG.maxJugadores + ' jugadores por sala · ' + CFG.salasActivasMax + ' salas activas a la vez');
  setInterval(() => { if (CFG.escuchar !== 'todas') bindAll(); }, 10000);
  maintenance(); setInterval(maintenance, 10 * 60000);
  setInterval(() => { for (const r of rooms.values()) r.watchdog().catch(e => log('[vigilante ' + r.id + ']', e.message)); }, 5000);
  setInterval(() => { for (const r of rooms.values()) if (r.status === 'activa') r.saveWorld('auto').catch(() => { }); }, Math.max(20, CFG.guardarCadaSeg) * 1000);
  let closing = false; const bye = async sig => { if (closing) return; closing = true; log('Cerrando (' + sig + '): guardando los mundos…'); for (const r of rooms.values()) { try { await r.sleep(); } catch (e) { } } try { if (browser) await browser.close(); } catch (e) { } process.exit(0); };
  process.on('SIGINT', () => bye('SIGINT')); process.on('SIGTERM', () => bye('SIGTERM')); process.on('SIGBREAK', () => bye('SIGBREAK')); process.on('SIGHUP', () => bye('SIGHUP'));
  process.on('uncaughtException', e => log('[error]', e.stack || e.message)); process.on('unhandledRejection', e => log('[error]', (e && e.message) || e));
})();
