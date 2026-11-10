#!/usr/bin/env node
/* Último Refugio · servidor 24/7 por Tailscale
   - Sirve el juego (/juego/) y una página de estado (/).
   - Relé de salas compatible con ntfy (/sig/…): lo usa el cooperativo para que los jugadores se encuentren sin internet público.
   - Anfitrión permanente: un navegador sin pantalla (Edge/Chrome/Chromium) que carga el mundo guardado y abre la sala.
   - Solo escucha en localhost y en la dirección de Tailscale (100.x.x.x): nada queda expuesto a tu red doméstica ni a internet.
   Uso: node servidor.js            (ver LEEME_SERVIDOR.md) */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
let chromium; try { chromium = require('playwright-core').chromium; } catch (e) { try { chromium = require('playwright').chromium; } catch (e2) { console.error('Falta playwright-core. Ejecuta INSTALAR (o: npm install).'); process.exit(1); } }

const ROOT = __dirname;
const DEF = { puerto: 8080, sala: 'REFUGI', semilla: '', modo: 'casual', dificultad: 'normal', tamano: 'huge', zombis: 1, botin: 1, lluvia: 1, mundo: 'region',
  guardarCadaSeg: 120, copias: 12, navegador: '', canal: '', escuchar: 'tailscale', usarStunTurn: false, maxJugadores: 3, simularSinJugadores: false, carpetaDatos: 'datos' };
let CFG = Object.assign({}, DEF);
try { CFG = Object.assign(CFG, JSON.parse(fs.readFileSync(process.env.CONFIG || path.join(ROOT, 'config.json'), 'utf8'))); } catch (e) { if (e.code !== 'ENOENT') console.error('config.json inválido:', e.message); }
if (process.env.PORT) CFG.puerto = +process.env.PORT;
if (process.env.ESCUCHAR) CFG.escuchar = process.env.ESCUCHAR;
if (process.env.NAVEGADOR) CFG.navegador = process.env.NAVEGADOR;
CFG.sala = String(CFG.sala).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); if (CFG.sala.length < 4) { console.error('«sala» debe tener entre 4 y 6 letras o números.'); process.exit(1); }
const DATA = path.resolve(ROOT, CFG.carpetaDatos); fs.mkdirSync(path.join(DATA, 'copias'), { recursive: true });
const log = (...a) => { const t = new Date().toISOString().replace('T', ' ').slice(0, 19); const line = t + ' ' + a.join(' '); console.log(line); try { fs.appendFileSync(path.join(DATA, 'servidor.log'), line + '\n'); } catch (e) { } };

/* ---------------- dirección de Tailscale ---------------- */
function tailscaleIp() {
  const ifs = os.networkInterfaces();
  for (const k of Object.keys(ifs)) for (const a of ifs[k] || []) { if (a.family !== 'IPv4' && a.family !== 4) continue; const p = a.address.split('.').map(Number); if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return a.address; }
  return null;
}

/* ---------------- relé de señalización (subconjunto de ntfy) ---------------- */
const topics = new Map(); // nombre -> Set(res)
const MAXBODY = 64 * 1024;
function relayPost(topic, req, res) {
  let n = 0, chunks = []; req.on('data', c => { n += c.length; if (n > MAXBODY) { res.writeHead(413); res.end(); req.destroy(); } else chunks.push(c); });
  req.on('end', () => {
    if (n > MAXBODY) return; const body = Buffer.concat(chunks).toString('utf8'); const ev = { id: Math.random().toString(36).slice(2, 12), time: Math.floor(Date.now() / 1000), event: 'message', topic, message: body };
    const subs = topics.get(topic); if (subs) for (const r of subs) { try { r.write('event: message\ndata: ' + JSON.stringify(ev) + '\n\n'); } catch (e) { } }
    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(ev));
  });
}
function relaySse(topic, req, res) {
  if (topics.size > 300 && !topics.has(topic)) { res.writeHead(503); return res.end(); }
  let subs = topics.get(topic); if (!subs) topics.set(topic, subs = new Set()); if (subs.size >= 40) { res.writeHead(429); return res.end(); }
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.write('event: open\ndata: {"event":"open","topic":"' + topic + '"}\n\n'); subs.add(res);
  const ka = setInterval(() => { try { res.write(': ka\n\n'); } catch (e) { } }, 25000);
  req.on('close', () => { clearInterval(ka); subs.delete(res); if (!subs.size) topics.delete(topic); });
}

/* ---------------- juego servido (se adapta al servidor) ---------------- */
const MARK = '/* ===================== AUDIO (sintetizado) ===================== */';
let gameCache = null;
function gameHtml() {
  if (gameCache) return gameCache;
  let s = fs.readFileSync(path.join(ROOT, 'juego', 'index.html'), 'utf8'), layer = fs.readFileSync(path.join(ROOT, 'srv_layer.js'), 'utf8');
  const rep = (a, b) => { if (s.split(a).length !== 2) throw new Error('El juego no tiene el texto esperado: ' + a.slice(0, 50)); s = s.replace(a, () => b); };
  rep("sig: 'https://ntfy.sh'", "sig: location.origin + '/sig'");
  if (!CFG.usarStunTurn) { const i = s.indexOf('const NET_ICE = ['), j = s.indexOf('const ZST = ', i); if (i < 0 || j < 0) throw new Error('NET_ICE no encontrado'); s = s.slice(0, i) + 'const NET_ICE = [];\n' + s.slice(j); }
  rep('<head>', '<head><script>window.SRV_CODE=' + JSON.stringify(CFG.sala) + ';window.SRV_MAX=' + (CFG.maxJugadores | 0) + ';</script>');
  rep(MARK, layer + '\n' + MARK);
  return (gameCache = Buffer.from(s, 'utf8'));
}

/* ---------------- anfitrión sin pantalla ---------------- */
const H = { ctx: null, page: null, state: null, starting: false, restarts: 0, startedAt: 0, lastSave: 0, lastErr: '', stopping: false };
const PROFILE = path.join(DATA, 'perfil');
const SAVEFILE = path.join(DATA, 'mundo_actual.json');
function launchOpts() {
  const o = { headless: true, handleSIGINT: false, handleSIGTERM: false, handleSIGHUP: false, viewport: { width: 640, height: 360 }, args: ['--disable-features=WebRtcHideLocalIpsWithMdns', '--autoplay-policy=no-user-gesture-required', '--mute-audio', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check'] };
  if (process.platform === 'linux' && process.getuid && process.getuid() === 0) o.args.push('--no-sandbox');
  if (CFG.navegador) o.executablePath = CFG.navegador; else if (CFG.canal) o.channel = CFG.canal; else if (process.platform === 'win32') o.channel = 'msedge';
  return o;
}
async function startHost() {
  if (H.starting || H.stopping) return; H.starting = true;
  try {
    await stopHost(true);
    const ctx = await chromium.launchPersistentContext(PROFILE, launchOpts()); H.ctx = ctx;
    ctx.on('close', () => { if (H.ctx === ctx) { H.ctx = null; H.page = null; } });
    let saved = null; try { saved = fs.readFileSync(SAVEFILE, 'utf8'); } catch (e) { }
    if (saved) await ctx.addInitScript(([k, v]) => { try { if (!localStorage.getItem(k)) localStorage.setItem(k, v); } catch (e) { } }, ['ultimo_refugio_v3', saved]);
    const page = ctx.pages()[0] || await ctx.newPage(); H.page = page;
    page.on('pageerror', e => { H.lastErr = e.message; log('[anfitrión] error de página:', e.message); });
    page.on('crash', () => log('[anfitrión] la página se cerró de forma inesperada'));
    await page.goto('http://127.0.0.1:' + CFG.puerto + '/juego/?srv=1', { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => typeof startNew === 'function' && typeof hasSave === 'function' && typeof SRV !== 'undefined', null, { timeout: 60000 });
    const resumed = await page.evaluate(() => hasSave());
    if (resumed) { await page.evaluate(() => { $('bCont').click(); }); log('[anfitrión] continuando el mundo guardado'); }
    else {
      await page.evaluate(c => { OPT.world = Object.assign({}, OPT.world, { seed: c.semilla || ('srv' + Date.now().toString(36)), kind: c.mundo, size: c.tamano, z: c.zombis, loot: c.botin, rain: c.lluvia }); OPT.mode = c.modo; OPT.diff = c.dificultad; $('bNew').click(); }, CFG);
      log('[anfitrión] creando un mundo nuevo');
    }
    await page.waitForFunction(() => STATE === 'play', null, { timeout: 90000 });
    await page.waitForTimeout(2500); await page.keyboard.press('Space').catch(() => { }); await page.waitForTimeout(800);
    await page.evaluate(c => {
      SRV.boot({ pausar: c.pausar }); NET.max = Math.max(1, Math.min(3, c.max)); netCode = () => c.sala;
      SRV.spawn = [P.x, P.y]; if (NET.role !== 'host') netHost();
      try { if (typeof tutorialOff === 'function') tutorialOff(); } catch (e) { }
    }, { sala: CFG.sala, max: CFG.maxJugadores, pausar: !CFG.simularSinJugadores });
    H.startedAt = Date.now(); H.failN = 0; log('[anfitrión] listo. Sala', CFG.sala);
  } catch (e) {
    H.lastErr = e.message; H.failN = (H.failN || 0) + 1; H.nextTry = Date.now() + Math.min(60000, 5000 * H.failN);
    const msg = String(e.message || '').split('\n')[0];
    log('[anfitrión] no pudo arrancar:', msg);
    if (/Executable doesn't exist|executable doesn't exist|Failed to launch|spawn .* ENOENT/i.test(e.message || '')) log('[anfitrión] FALTA EL NAVEGADOR. Windows: instala Microsoft Edge. Linux/Mac: ejecuta «npx playwright-core install chromium», o indica la ruta en config.json («navegador») o «canal»: "chrome" / "msedge".');
    await stopHost(true);
  }
  finally { H.starting = false; }
}
async function stopHost(quiet) {
  const c = H.ctx; H.ctx = null; H.page = null; if (!c) return;
  try { await Promise.race([c.close(), new Promise(r => setTimeout(r, 8000))]); } catch (e) { } if (!quiet) log('[anfitrión] detenido');
}
async function saveWorld(why) {
  if (!H.page) return false;
  try {
    const raw = await H.page.evaluate(() => { saveGame(); return localStorage.getItem('ultimo_refugio_v3'); });
    if (!raw || raw.length < 1000) return false;
    fs.writeFileSync(SAVEFILE + '.tmp', raw); fs.renameSync(SAVEFILE + '.tmp', SAVEFILE); H.lastSave = Date.now();
    const d = new Date(), pad = n => String(n).padStart(2, '0'), nm = 'mundo_' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '_' + pad(d.getHours()) + pad(d.getMinutes()) + '.json';
    const cdir = path.join(DATA, 'copias'); if (!fs.existsSync(path.join(cdir, nm)) && (why === 'cierre' || Date.now() - (H.lastCopy || 0) > 30 * 60 * 1000)) { fs.copyFileSync(SAVEFILE, path.join(cdir, nm)); H.lastCopy = Date.now(); const all = fs.readdirSync(cdir).filter(f => f.startsWith('mundo_')).sort(); while (all.length > CFG.copias) fs.unlinkSync(path.join(cdir, all.shift())); }
    return true;
  } catch (e) { log('[guardado] falló:', e.message); return false; }
}
async function pollState() {
  if (!H.page) return null;
  try {
    return await Promise.race([H.page.evaluate(() => ({ st: STATE, role: NET.role, es: NET.es ? NET.es.readyState : -1, code: NET.code, peers: (NET.peers || []).filter(p => p.ready).map(p => (p.rp && p.rp.name) || 'Jugador'), connecting: (NET.peers || []).filter(p => !p.ready).length,
      day: typeof GT !== 'undefined' ? Math.floor(GT.min / 1440) + 1 : undefined, min: typeof GT !== 'undefined' ? Math.floor(GT.min) : undefined, paused: SRV.paused ? 1 : 0, z: Z.filter(z => z.st !== 'dead').length, npcs: NPCS.length, err: (typeof E80 !== 'undefined' ? E80.n : 0) + (typeof DBGC !== 'undefined' ? DBGC.n : 0) })), new Promise((_, rej) => setTimeout(() => rej(new Error('sin respuesta')), 8000))]);
  } catch (e) { return { bad: e.message }; }
}
let badCount = 0;
async function watchdog() {
  if (H.starting || H.stopping || (H.nextTry && Date.now() < H.nextTry && !H.page)) return; const s = await pollState(); H.state = s;
  if (!H.page || !s || s.bad || s.st !== 'play') { badCount++; if (badCount >= 2 || !H.page) { log('[vigilante] anfitrión caído (' + ((s && (s.bad || s.st)) || 'sin página') + '), reiniciando'); badCount = 0; H.restarts++; await startHost(); } return; }
  badCount = 0;
  if (s.role !== 'host' || s.es === 2) { if (!s.peers.length && !s.connecting) { log('[vigilante] la sala no estaba abierta, reabriendo'); try { await H.page.evaluate(() => { if (NET.role) netClose(); netHost(); }); } catch (e) { } } }
}

/* ---------------- HTTP ---------------- */
function statusJson() {
  const s = H.state || {}, ip = tailscaleIp();
  return { activo: !!(H.page && s.st === 'play'), sala: CFG.sala, jugadores: s.peers || [], conectando: s.connecting || 0, max: CFG.maxJugadores, zombis: s.z, civiles: s.npcs, dia: s.day, pausado: !!s.paused, reinicios: H.restarts, ultimoGuardado: H.lastSave ? new Date(H.lastSave).toISOString() : null, errores: s.err || 0, tailscale: ip, url: ip ? 'http://' + ip + ':' + CFG.puerto + '/juego/' : null, desdeHace: H.startedAt ? Math.round((Date.now() - H.startedAt) / 1000) : 0 };
}
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function landing(local) {
  const st = statusJson(), url = st.url || ('http://' + (os.hostname()) + ':' + CFG.puerto + '/juego/');
  return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Último Refugio · servidor</title><style>body{font-family:system-ui,Arial;background:#141816;color:#e8e4da;margin:0;padding:20px}main{max-width:560px;margin:0 auto}h1{margin:0 0 4px}.c{background:#1f2622;border:1px solid #38423b;border-radius:10px;padding:14px;margin:12px 0}b.cod{font-size:30px;letter-spacing:6px;color:#f0a35a}a.btn{display:inline-block;background:#d9541e;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold}small{color:#9aa59d}.ok{color:#7dd36a}.no{color:#ff6a5a}</style></head><body><main><h1>Último Refugio</h1><small>Servidor cooperativo</small>'
    + '<div class="c">Estado: <b class="' + (st.activo ? 'ok' : 'no') + '">' + (st.activo ? 'en línea' : 'iniciando / caído') + '</b><br>Jugadores: <b>' + st.jugadores.length + '/' + CFG.maxJugadores + '</b>' + (st.jugadores.length ? ' (' + st.jugadores.map(esc).join(', ') + ')' : '') + '<br>Zombis activos: ' + (st.zombis ?? '–') + (st.pausado ? ' · <b>mundo en pausa (sin jugadores)</b>' : '') + ' · Día ' + (st.dia ?? '–') + '</div>'
    + '<div class="c">Código de sala<br><b class="cod">' + esc(CFG.sala) + '</b><br><small>En el juego: COOPERATIVO → escribe el código → UNIRSE (ya viene escrito).</small></div>'
    + '<div class="c"><a class="btn" href="/juego/">JUGAR</a><br><br><small>Dirección para los móviles (con Tailscale activo):<br><b>' + esc(url) + '</b></small></div>'
    + (st.tailscale ? '' : '<div class="c no">No se detecta Tailscale en este equipo: solo se puede entrar desde aquí. Instala/inicia Tailscale y reinicia el servidor.</div>')
    + '<small>Los jugadores entran con la app de Tailscale instalada en el móvil, en la misma cuenta o con el equipo compartido.</small></main><script>setTimeout(()=>location.reload(),15000)</script></body></html>';
}
let freshAt = 0; async function fresh() { if (!H.page || H.starting || Date.now() - freshAt < 1500) return; freshAt = Date.now(); const s = await pollState(); if (s && !s.bad) H.state = s; }
const isLocal = req => { const a = req.socket.remoteAddress || ''; return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1'; };
function handler(req, res) {
  const u = new URL(req.url, 'http://x'), p = u.pathname;
  try {
    if (p.startsWith('/sig/')) { const topic = p.slice(5).replace(/\/sse$/, ''); if (!/^[a-z0-9_-]{3,40}$/i.test(topic)) { res.writeHead(400); return res.end(); }
      if (req.method === 'POST' || req.method === 'PUT') return relayPost(topic, req, res); if (req.method === 'GET' && p.endsWith('/sse')) return relaySse(topic, req, res); res.writeHead(404); return res.end(); }
    if (p === '/juego' || p === '/juego/' || p === '/juego/index.html') { const b = gameHtml(); res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }); return res.end(b); }
    if (p === '/estado') { fresh().then(() => { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(statusJson())); }); return; }
    if (p === '/admin/guardar' && isLocal(req)) { saveWorld('manual').then(ok => { res.writeHead(200); res.end(ok ? 'guardado' : 'no se pudo'); }); return; }
    if (p === '/admin/eval' && isLocal(req) && process.env.URSRV_DEBUG === '1' && H.page) { const code = u.searchParams.get('js') || ''; H.page.evaluate(c => { try { return JSON.stringify((0, eval)(c)); } catch (e) { return 'ERR ' + e.message; } }, code).then(r => { res.writeHead(200); res.end(String(r)); }).catch(e => { res.writeHead(500); res.end(e.message); }); return; }
    if (p === '/admin/reiniciar' && isLocal(req)) { res.writeHead(200); res.end('reiniciando anfitrión'); saveWorld('manual').then(() => startHost()); return; }
    if (p === '/' || p === '/index.html') { fresh().then(() => { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(landing(isLocal(req))); }); return; }
    if (p === '/favicon.ico') { res.writeHead(204); return res.end(); }
    res.writeHead(404); res.end('no encontrado');
  } catch (e) { try { res.writeHead(500); res.end(); } catch (e2) { } log('[http] error:', e.message); }
}
const servers = new Map(); // dirección -> server
function listen(addr) {
  if (servers.has(addr)) return; const srv = http.createServer(handler); srv.on('error', e => log('[http] ' + addr + ': ' + e.message)); srv.keepAliveTimeout = 65000;
  srv.listen(CFG.puerto, addr, () => log('[http] escuchando en http://' + addr + ':' + CFG.puerto + '/')); servers.set(addr, srv);
}
function bindAll() {
  listen('127.0.0.1');
  if (CFG.escuchar === 'todas') { listen('0.0.0.0'); return; }
  const ip = tailscaleIp(); if (ip) listen(ip);
}

/* ---------------- arranque / cierre ---------------- */
(async () => {
  log('Último Refugio · servidor. Datos en', DATA); bindAll();
  if (!tailscaleIp() && CFG.escuchar !== 'todas') log('AVISO: no se detecta Tailscale (100.x.x.x). Solo se podrá jugar desde este equipo hasta que Tailscale esté activo; se detectará solo.');
  else if (tailscaleIp()) log('Tailscale detectado:', tailscaleIp(), '→ los jugadores entran en http://' + tailscaleIp() + ':' + CFG.puerto + '/juego/');
  await new Promise(r => setTimeout(r, 400)); await startHost();
  setInterval(() => { if (CFG.escuchar !== 'todas') bindAll(); }, 10000);
  setInterval(() => watchdog().catch(e => log('[vigilante]', e.message)), 5000);
  setInterval(() => saveWorld('auto').catch(() => { }), Math.max(20, CFG.guardarCadaSeg) * 1000);
  let closing = false; const bye = async sig => { if (closing) return; closing = true; H.stopping = true; log('Cerrando (' + sig + '): guardando el mundo…'); H.stopping = false; await saveWorld('cierre'); H.stopping = true; await stopHost(); process.exit(0); };
  process.on('SIGINT', () => bye('SIGINT')); process.on('SIGTERM', () => bye('SIGTERM')); process.on('SIGBREAK', () => bye('SIGBREAK')); process.on('SIGHUP', () => bye('SIGHUP'));
  process.on('uncaughtException', e => log('[error]', e.stack || e.message)); process.on('unhandledRejection', e => log('[error]', (e && e.message) || e));
})();
