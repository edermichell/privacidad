// Jugadores simulados por WebSocket (sin navegador): miden lo que cuesta una sala con N jugadores.
const WS = require('/home/user/privacidad/servidor_tailscale/node_modules/ws'); const crypto = require('crypto'); const { exec } = require('child_process'); const pexec = require('util').promisify(exec); const fs = require('fs');
const BASE = process.env.BASE || 'http://127.0.0.1:18080', ROOM = process.env.ROOM || 'SALA1', N = +process.env.N || 10, MODE = process.env.MODE || 'spread', WORLD = +process.env.WORLD || 360, SETTLE = +process.env.SETTLE || 25, MEASURE = +process.env.MEASURE || 30;
const sha = t => crypto.createHash('sha256').update(t).digest('hex'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = n => { let t = ''; const a = 'abcdefghijklmnopqrstuvwxyz0123456789'; for (let i = 0; i < n; i++) t += a[Math.random() * 36 | 0]; return t; };
const ev = async js => (await (await fetch(BASE + '/admin/eval?sala=' + ROOM + '&js=' + encodeURIComponent(js))).text());
const cpu = async (pat, sec) => { try { return (await pexec(`python3 /tmp/claude-0/-home-user-privacidad/c6741cea-eb4a-59e0-9c29-ae88b932896e/scratchpad/tools/cpu137.py "${pat}" ${sec}`)).stdout.trim(); } catch (e) { return '?'; } };
const bots = []; let rx = 0, tx = 0, ready = 0, failed = 0;
async function bot(i) {
  const uid = rnd(16), tok = rnd(32); await (await fetch(`${BASE}/sala/${ROOM}/info?uid=${uid}&tok=${tok}`)).text();
  const n = rnd(10), s = sha(sha(tok) + ':' + n + ':' + ROOM); const ws = new WS(BASE.replace('http', 'ws') + `/ws?role=guest&room=${ROOM}&uid=${uid}&n=${n}&s=${s}`); const b = { ws, id: i, ok: false, bytes: 0, x: 0, y: 0, a: Math.random() * 6.28 }; bots.push(b);
  ws.on('open', () => { ws.send(JSON.stringify({ t: 'hi', n: 'Bot' + i })); });
  ws.on('message', (d, isBin) => { b.bytes += d.length; rx += d.length; if (!isBin) { let m; try { m = JSON.parse(d.toString()); } catch (e) { return; } if (m.t === 'W0') { b.w = true; } if (m.t === 'W1') { b.ok = true; ready++; ws.send(JSON.stringify({ t: 'R' })); start(b); } if (m.t === 'ping') { ws.send(JSON.stringify({ t: 'pong', ts: m.ts })); } } });
  ws.on('close', (c, r) => { if (process.env.DBG) console.log('bot', i, 'cerrado', c, String(r), 'ok=', b.ok, 'bytes', b.bytes); if (!b.ok) failed++; clearInterval(b.iv); }); ws.on('error', () => { });
}
function start(b) {
  if (MODE === 'cluster') { b.x = 190 + Math.random() * 12; b.y = 185 + Math.random() * 12; } else { b.x = 30 + Math.random() * (WORLD - 60); b.y = 30 + Math.random() * (WORLD - 60); }
  b.iv = setInterval(() => { if (Math.random() < .08) b.a += (Math.random() - .5) * 2.5; b.x = Math.max(8, Math.min(WORLD - 8, b.x + Math.cos(b.a) * .11)); b.y = Math.max(8, Math.min(WORLD - 8, b.y + Math.sin(b.a) * .11));
    const o = JSON.stringify({ t: 'P', x: +b.x.toFixed(2), y: +b.y.toFixed(2), d: +b.a.toFixed(2), m: 1, r: 0, s: 0, l: 0, z: 0, h: 100, k: 0, v: 0, pose: 'walk', ph: 0, hu: 0 }); tx += o.length; b.ws.send(o); }, 66);
  b.pi = setInterval(() => b.ws.send(JSON.stringify({ t: 'ping', ts: performance.now() })), 2000);
}
(async () => {
  console.log(`== ${N} jugadores simulados · ${MODE} · mundo ${WORLD}²`); await fetch(BASE + '/sala/' + ROOM + '/despertar'); for (let i = 0; i < 40; i++) { await sleep(1000); const d = await (await fetch(BASE + '/salas')).json(); if (d.salas.find(s => s.id === ROOM).estado === 'activa') break; }
  await ev('NET.max=60'); for (let i = 0; i < N; i++) { bot(i); await sleep(250); }
  await sleep(SETTLE * 1000); console.log('listos:', ready, '/', N, ' fallidos:', failed);
  const f0 = +(await ev('SRV.frames')), t0 = Date.now(); rx = 0; tx = 0; 
  const cpuHost = await cpu('WebRtcHideLocalIpsWithMdns', MEASURE); const f1 = +(await ev('SRV.frames')), dt = (Date.now() - t0) / 1000;
  const st = await ev('(()=>({peers:NET.peers.filter(p=>p.ready).length,Z:Z.filter(z=>z.st!=="dead").length,N:NPCS.length,pausa:!!SRV.paused}))()');
  console.log('CPU anfitrión (navegador):', cpuHost); console.log('pasos/s del anfitrión:', ((f1 - f0) / dt).toFixed(1), '(objetivo 30)'); console.log('estado:', st);
  console.log(`bajada por jugador: ${(rx / dt / Math.max(1, ready) / 1024).toFixed(1)} KB/s · subida por jugador: ${(tx / dt / Math.max(1, ready) / 1024).toFixed(1)} KB/s · total hacia jugadores: ${(rx / dt * 8 / 1e6).toFixed(2)} Mbit/s`);
  console.log('CPU servidor (node, relé):', await cpu('servidor.js', 3));
  for (const b of bots) { try { b.ws.close(); } catch (e) { } clearInterval(b.iv); clearInterval(b.pi); } await sleep(1500); process.exit(0);
})();
