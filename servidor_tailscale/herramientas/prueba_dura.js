#!/usr/bin/env node
/* Último Refugio · PRUEBA DURA en TU PC: arranca su propio servidor de prueba (puerto 18099, carpeta datos_prueba; NO toca tus salas ni tus mundos),
   con 3 salas del mapa 960×960, mete 10 jugadores simulados por sala que se juntan, hacen ruido y golpean, y el anfitrión recibe una horda de ~120 zombis
   y cambios de construcción constantes. Mide pasos/s por sala, CPU y memoria, y guarda el resultado en resultado_prueba_dura.txt.
   Uso: node herramientas/prueba_dura.js [--salas 3] [--n 10] [--seg 60] [--zombis 120]   (cierra antes INICIAR_SERVIDOR y las demás aplicaciones) */
'use strict';
const path = require('path'), fs = require('fs'), os = require('os'), crypto = require('crypto'), { spawn } = require('child_process');
const ROOT = path.join(__dirname, '..'), WS = require(path.join(ROOT, 'node_modules', 'ws'));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const FPS = +(cfg0().fpsServidor) || 30; function cfg0() { try { return JSON.parse(fs.readFileSync(process.env.CONFIG || path.join(ROOT, 'config.json'), 'utf8')); } catch (e) { return {}; } }
const NS = Math.max(1, Math.min(3, +arg('salas', 3))), N = Math.max(1, Math.min(10, +arg('n', 10))), SEG = +arg('seg', 60), ZN = +arg('zombis', 120), PORT = 18099, BASE = 'http://127.0.0.1:' + PORT;
const sha = t => crypto.createHash('sha256').update(t).digest('hex'), sleep = ms => new Promise(r => setTimeout(r, ms)), rnd = n => { let t = ''; const a = 'abcdefghijklmnopqrstuvwxyz0123456789'; for (let i = 0; i < n; i++) t += a[Math.random() * 36 | 0]; return t; };
const J = async p => (await fetch(BASE + p, { cache: 'no-store' })).json();
const ev = async (room, js) => { const t = await (await fetch(BASE + '/admin/eval?sala=' + room + '&js=' + encodeURIComponent(js))).text(); try { let v = JSON.parse(t); if (typeof v === 'string') { try { v = JSON.parse(v); } catch (e) { } } return v; } catch (e) { return t; } };
const ROOMS = ['SALA1', 'SALA2', 'SALA3'].slice(0, NS), out = []; const say = (...a) => { const l = a.join(' '); console.log(l); out.push(l); };
let cfg = {}; try { cfg = JSON.parse(fs.readFileSync(process.env.CONFIG || path.join(ROOT, 'config.json'), 'utf8')); } catch (e) { }
const DATA = path.join(ROOT, 'datos_prueba'); fs.rmSync(DATA, { recursive: true, force: true }); fs.mkdirSync(DATA, { recursive: true });
const tcfg = Object.assign({}, cfg, { puerto: PORT, carpetaDatos: DATA, salas: ROOMS.map((id, i) => ({ id, nombre: 'Prueba ' + (i + 1), tamano: 'colossal', mundo: 'town' })), salasActivasMax: 3, salasUsuarioActivasMax: 0, maxJugadores: 10, dormirTrasMin: 60, urlPublica: '', claveAdmin: '', maxConexionesPorIp: 500, conexionesPorMinutoIp: 5000, registrosPorDiezMinIp: 5000, salasUsuario: false });
const CFGP = path.join(DATA, 'config_prueba.json'); fs.writeFileSync(CFGP, JSON.stringify(tcfg, null, 2));
function cpuMedia(seg) { return new Promise(res => { const snap = () => { let idle = 0, tot = 0; for (const c of os.cpus()) { for (const k in c.times) tot += c.times[k]; idle += c.times.idle; } return [idle, tot]; }; const a = snap(); setTimeout(() => { const b = snap(); res(100 * (1 - (b[0] - a[0]) / Math.max(1, b[1] - a[1]))); }, seg * 1000); }); }
const bots = []; let dropped = 0, hits = 0; const ready = {}; for (const r of ROOMS) ready[r] = 0; const ids = {}; let rx = 0;
async function bot(room, i, cx, cy) {
  const uid = rnd(16), tok = rnd(32); await (await fetch(`${BASE}/sala/${room}/info?uid=${uid}&tok=${tok}`)).text();
  const n = rnd(10), s = sha(sha(tok) + ':' + n + ':' + room), ws = new WS(BASE.replace('http', 'ws') + `/ws?role=guest&room=${room}&uid=${uid}&n=${n}&s=${s}`), b = { ws, room, ok: false, x: cx + (Math.random() - .5) * 8, y: cy + (Math.random() - .5) * 8, a: Math.random() * 6.28 }; bots.push(b);
  ws.on('open', () => ws.send(JSON.stringify({ t: 'hi', n: 'Prueba' + i })));
  ws.on('message', (d, isBin) => { rx += d.length; if (isBin) return; let m; try { m = JSON.parse(d.toString()); } catch (e) { return; }
    if (m.t === 'W1') { b.ok = true; ready[room]++; ws.send('{"t":"R"}');
      b.iv = setInterval(() => { if (Math.random() < .1) b.a += (Math.random() - .5) * 3; let nx = b.x + Math.cos(b.a) * .13, ny = b.y + Math.sin(b.a) * .13; if (Math.hypot(nx - cx, ny - cy) > 9) { b.a = Math.atan2(cy - b.y, cx - b.x); nx = b.x; ny = b.y; } b.x = nx; b.y = ny;
        ws.send(JSON.stringify({ t: 'P', x: +b.x.toFixed(2), y: +b.y.toFixed(2), d: +b.a.toFixed(2), m: 1, r: 0, s: 0, l: 0, z: 0, h: 100, k: 0, v: 0, pose: 'walk', ph: 0, hu: 0 })); }, 66);
      b.pi = setInterval(() => ws.send(JSON.stringify({ t: 'ping', ts: Date.now() })), 2000);
      b.hi = setInterval(() => { const L = ids[room] || []; if (L.length) { ws.send(JSON.stringify({ t: 'HZ', id: L[Math.random() * L.length | 0], dmg: 40, o: {} })); hits++; } if (Math.random() < .5) ws.send(JSON.stringify({ t: 'N', x: +b.x.toFixed(1), y: +b.y.toFixed(1), r: 16 })); }, 500); }
    if (m.t === 'ping') ws.send(JSON.stringify({ t: 'pong', ts: m.ts })); });
  ws.on('close', () => { if (b.ok && !b.closing) dropped++; clearInterval(b.iv); clearInterval(b.pi); clearInterval(b.hi); }); ws.on('error', () => { });
}
(async () => {
  const t0 = Date.now(); const cpus = os.cpus(); say('===== PRUEBA DURA · ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ' =====');
  say('PC: ' + (cpus[0] ? cpus[0].model.trim() : '?') + ' · ' + cpus.length + ' núcleos · RAM ' + Math.round(os.totalmem() / 1048576) + ' MB · ' + os.platform() + ' ' + os.release() + ' · Node ' + process.version);
  say('Escenario: ' + NS + ' sala(s) mapa 960 × ' + N + ' jugadores simulados que pelean y hacen ruido + horda de ~' + ZN + ' zombis por sala + cambios de construcción · ' + SEG + ' s de medición');
  const memAntes = os.freemem(); say('Memoria libre antes: ' + Math.round(memAntes / 1048576) + ' MB');
  const logf = fs.openSync(path.join(DATA, 'servidor_prueba.log'), 'w'); const srv = spawn(process.execPath, ['servidor.js'], { cwd: ROOT, env: Object.assign({}, process.env, { CONFIG: CFGP, URSRV_PRUEBA: '1' }), stdio: ['ignore', logf, logf], windowsHide: true });
  let exited = false; srv.on('exit', () => { exited = true; });
  const fin = async (code) => { for (const b of bots) { b.closing = 1; try { b.ws.close(); } catch (e) { } clearInterval(b.iv); clearInterval(b.pi); clearInterval(b.hi); } try { await fetch(BASE + '/admin/apagar'); } catch (e) { } for (let i = 0; i < 30 && !exited; i++) await sleep(500); if (!exited) { try { srv.kill(); } catch (e) { } }
    try { fs.writeFileSync(path.join(ROOT, 'resultado_prueba_dura.txt'), out.join('\n') + '\n'); say('\n(Guardado en resultado_prueba_dura.txt)'); } catch (e) { } fs.rmSync(DATA, { recursive: true, force: true }); process.exit(code); };
  let up = false; for (let i = 0; i < 40 && !up; i++) { await sleep(1000); try { await J('/salas'); up = true; } catch (e) { } } if (!up) { say('✖ El servidor de prueba no arrancó. Mira ' + path.join(DATA, 'servidor_prueba.log') + ' (¿está el puerto ' + PORT + ' ocupado o falta Edge?).'); return fin(1); }
  say('Servidor de prueba listo. Despertando las salas (cada una genera su mundo 960, unos segundos)…'); for (const r of ROOMS) await fetch(BASE + '/sala/' + r + '/despertar'); const tw = Date.now();
  for (let i = 0; i < 90; i++) { await sleep(1000); const l = await J('/salas'); if (ROOMS.every(r => (l.salas.find(s => s.id === r) || {}).estado === 'activa')) break; } say('Salas activas tras ' + ((Date.now() - tw) / 1000).toFixed(0) + ' s');
  const cl = {}; for (const r of ROOMS) { await ev(r, 'NET.max=60'); const sp = await ev(r, 'JSON.stringify(SRV.spawn)'); cl[r] = Array.isArray(sp) ? sp : [485, 475]; }
  for (let i = 0; i < N; i++) for (const r of ROOMS) { bot(r, i, cl[r][0], cl[r][1]); await sleep(120); }
  const feeder = setInterval(() => { for (const r of ROOMS) { const [cx, cy] = cl[r]; ev(r, `(()=>{const cx=${cx},cy=${cy};let n=Z.filter(z=>z.st!=="dead"&&Math.hypot(z.x-cx,z.y-cy)<40).length;for(;n<${ZN};n++){const a=Math.random()*6.28,d=12+Math.random()*22,x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d;if(solidTile(Math.floor(x),Math.floor(y)))continue;const z=mkZombie(x,y);z.st="chase";z.seen=8;z.lx=cx;z.ly=cy;Z.push(z);}
    for(let k=0;k<15;k++){const x=cx+Math.floor((Math.random()-.5)*30),y=cy+Math.floor((Math.random()-.5)*30),i=idx(x,y);if(tg[i]===G_SIDE||tg[i]===G_ROAD||tg[i]===G_GRASS){to[i]=(to[i]===O_NONE&&!tb[i])?O_WALL:(to[i]===O_WALL?O_NONE:to[i]);}}
    return JSON.stringify(Z.filter(z=>z.st!=="dead"&&Math.hypot(z.x-cx,z.y-cy)<10).slice(0,40).map(z=>z.id));})()`).then(v => { if (Array.isArray(v)) ids[r] = v; }).catch(() => { }); } }, 1500);
  await sleep(30000); say('Conectados: ' + ROOMS.map(r => r + ' ' + ready[r] + '/' + N).join(' · '));
  const f0 = {}; for (const r of ROOMS) f0[r] = +(await ev(r, 'SRV.frames')); const ta = Date.now(); rx = 0; const cpuP = cpuMedia(SEG); await sleep(SEG * 1000); const cpu = await cpuP; const dt = (Date.now() - ta) / 1000;
  say('\n===== RESULTADO ====='); let peor = 99;
  for (const r of ROOMS) { const f1 = +(await ev(r, 'SRV.frames')), pps = (f1 - f0[r]) / dt, st = await ev(r, 'JSON.stringify({z:Z.filter(z=>z.st!=="dead").length,k:GT.kills,err:(typeof E80!=="undefined"?E80.n:0)+(typeof DBGC!=="undefined"?DBGC.n:0)})'); peor = Math.min(peor, pps); say(r + ': ' + pps.toFixed(1) + ' pasos/s (objetivo ' + FPS + ') · zombis vivos ' + (st.z || '?') + ' · bajas ' + (st.k || 0) + ' · errores del juego ' + (st.err || 0)); }
  say('Jugadores simulados conectados: ' + ROOMS.reduce((a, r) => a + ready[r], 0) + ' de ' + NS * N + ' · caídos durante la prueba: ' + dropped + ' · golpes enviados: ' + hits);
  say('CPU total del PC: ' + cpu.toFixed(0) + ' % (todos los núcleos juntos) · Bajada hacia los jugadores: ' + (rx / dt * 8 / 1e6).toFixed(1) + ' Mbit/s en total (~' + (rx / dt / Math.max(1, ROOMS.reduce((a, r) => a + ready[r], 0)) / 1024).toFixed(0) + ' KB/s por jugador)');
  const memDesp = os.freemem(); say('Memoria libre durante la prueba: ' + Math.round(memDesp / 1048576) + ' MB de ' + Math.round(os.totalmem() / 1048576) + ' MB (la prueba usó ≈ ' + Math.round((memAntes - memDesp) / 1048576) + ' MB)');
  const v = (peor >= FPS * .9 && !dropped) ? 'APROBADO: el PC aguanta ' + NS + ' sala(s) con ' + N + ' jugadores peleando.' : (peor >= FPS * .73 && !dropped) ? 'JUSTO: funciona pero con poca holgura. Prueba «fpsServidor»: 24 en config.json, o «salasActivasMax»: 2, o 8 jugadores por sala.' : 'NO ALCANZA: pon «fpsServidor»: 20 en config.json y repite; si sigue igual, «salasActivasMax»: 2 o 6–8 jugadores por sala.';
  say('\nVEREDICTO: ' + v); say('Cómo leerlo: Si llega al objetivo = holgura; entre el 73 % y el 90 % = al límite; menos = se notarán tirones para todos. Copia todo este texto (o resultado_prueba_dura.txt) y envíamelo.'); return fin(0);
})().catch(e => { console.error('Error:', e && e.message || e); process.exit(1); });
