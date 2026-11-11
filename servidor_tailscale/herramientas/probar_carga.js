#!/usr/bin/env node
/* Prueba de carga: mete jugadores SIMULADOS en las salas de TU servidor y mide si el PC aguanta.
   Uso (con el servidor ya encendido):  node herramientas/probar_carga.js [--salas SALA1,SALA2,SALA3] [--n 20] [--seg 60] [--mundo 360]
   Los jugadores simulados solo caminan (no pelean ni construyen): el juego real cuesta algo más. */
'use strict';
const path = require('path'), fs = require('fs'), crypto = require('crypto'), { exec } = require('child_process'), os = require('os');
const WS = require(path.join(__dirname, '..', 'node_modules', 'ws'));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
let port = 8080; try { port = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8')).puerto || 8080; } catch (e) { }
const BASE = arg('url', 'http://127.0.0.1:' + port), SALAS = arg('salas', 'SALA1').split(',').map(s => s.trim().toUpperCase()), N = +arg('n', 20), SEG = +arg('seg', 60), WORLD = +arg('mundo', 360);
const sha = t => crypto.createHash('sha256').update(t).digest('hex'), sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = n => { let t = ''; const a = 'abcdefghijklmnopqrstuvwxyz0123456789'; for (let i = 0; i < n; i++) t += a[Math.random() * 36 | 0]; return t; };
const J = async p => (await fetch(BASE + p, { cache: 'no-store' })).json();
const bots = []; const ready = {}; for (const r of SALAS) ready[r] = 0;
async function bot(room, i) {
  const uid = rnd(16), tok = rnd(32); await (await fetch(`${BASE}/sala/${room}/info?uid=${uid}&tok=${tok}`)).text();
  const n = rnd(10), s = sha(sha(tok) + ':' + n + ':' + room), ws = new WS(BASE.replace('http', 'ws') + `/ws?role=guest&room=${room}&uid=${uid}&n=${n}&s=${s}`), b = { ws, room, a: Math.random() * 6.28, x: 0, y: 0 }; bots.push(b);
  ws.on('open', () => ws.send(JSON.stringify({ t: 'hi', n: 'Sim' + i })));
  ws.on('message', (d, isBin) => { if (isBin) return; let m; try { m = JSON.parse(d.toString()); } catch (e) { return; }
    if (m.t === 'W1') { ready[room]++; ws.send('{"t":"R"}'); b.x = 30 + Math.random() * (WORLD - 60); b.y = 30 + Math.random() * (WORLD - 60);
      b.iv = setInterval(() => { if (Math.random() < .08) b.a += (Math.random() - .5) * 2.5; b.x = Math.max(8, Math.min(WORLD - 8, b.x + Math.cos(b.a) * .11)); b.y = Math.max(8, Math.min(WORLD - 8, b.y + Math.sin(b.a) * .11)); ws.send(JSON.stringify({ t: 'P', x: +b.x.toFixed(2), y: +b.y.toFixed(2), d: +b.a.toFixed(2), m: 1, r: 0, s: 0, l: 0, z: 0, h: 100, k: 0, v: 0, pose: 'walk', ph: 0, hu: 0 })); }, 66);
      b.pi = setInterval(() => ws.send(JSON.stringify({ t: 'ping', ts: Date.now() })), 2000); }
    if (m.t === 'ping') ws.send(JSON.stringify({ t: 'pong', ts: m.ts })); });
  ws.on('error', () => { });
}
function cpuMedia(seg) { return new Promise(res => { if (os.platform() !== 'win32') return res(null); exec(`powershell -NoProfile -Command "(Get-Counter '\\Processor(_Total)\\% Processor Time' -SampleInterval 2 -MaxSamples ${Math.max(2, Math.floor(seg / 2))}).CounterSamples | Measure-Object -Property CookedValue -Average | Select -ExpandProperty Average"`, { timeout: (seg + 20) * 1000 }, (e, out) => res(e ? null : parseFloat(String(out).replace(',', '.')))); }); }
(async () => {
  console.log(`Prueba de carga: ${SALAS.length} sala(s) × ${N} jugadores simulados · ${SEG} s de medición · servidor ${BASE}`);
  let est; try { est = await J('/admin/api/estado'); } catch (e) { console.log('No se pudo hablar con el servidor. ¿Está encendido? ¿Abres esto en el mismo PC?'); process.exit(1); }
  for (const r of SALAS) { const s = (est.salas || []).find(x => x.id === r); if (!s) { console.log('No existe la sala', r); process.exit(1); } if (s.max < N) { console.log(`La sala ${r} admite ${s.max} jugadores. Pon "maxJugadores": ${N} en config.json, reinicia el servidor y repite.`); process.exit(1); } }
  for (const r of SALAS) await J('/sala/' + r + '/despertar'); for (let i = 0; i < 60; i++) { await sleep(1000); const e2 = await J('/admin/api/estado'); if (SALAS.every(r => (e2.salas.find(x => x.id === r) || {}).estado === 'activa')) break; }
  console.log('Salas despiertas. Entrando jugadores simulados…'); for (let i = 0; i < N; i++) for (const r of SALAS) { bot(r, i); await sleep(120); }
  await sleep(25000); console.log('Conectados:', SALAS.map(r => r + ' ' + ready[r] + '/' + N).join(' · '));
  const cpuP = cpuMedia(SEG), muestras = {}; for (const r of SALAS) muestras[r] = []; const t0 = Date.now();
  while (Date.now() - t0 < SEG * 1000) { await sleep(5000); const e3 = await J('/admin/api/estado'); const linea = SALAS.map(r => { const s = e3.salas.find(x => x.id === r) || {}; if (s.pps) muestras[r].push(s.pps); return `${r}: ${s.jugadores}/${s.max} jug, ${s.pps || '?'} pasos/s`; }).join(' | '); console.log('  ' + linea); }
  const cpu = await cpuP; let peor = 99;
  console.log('\n===== RESULTADO =====');
  for (const r of SALAS) { const m = muestras[r]; if (!m.length) { console.log(r + ': sin datos'); continue; } const med = m.reduce((a, b) => a + b, 0) / m.length, min = Math.min(...m); peor = Math.min(peor, med); console.log(`${r}: pasos/s medio ${med.toFixed(1)} (mínimo ${min.toFixed(1)})  → ${med >= 28 ? 'OK' : med >= 24 ? 'JUSTO' : 'NO ALCANZA'}`); }
  if (cpu != null) console.log('CPU total del PC durante la prueba:', cpu.toFixed(0) + ' %');
  console.log('Memoria libre del PC ahora:', Math.round(os.freemem() / 1048576), 'MB de', Math.round(os.totalmem() / 1048576), 'MB');
  console.log('\nCómo leerlo: 30 pasos/s = el servidor aguanta con holgura. 24–28 = al límite (se nota fluctuación). Menos de 24 = no alcanza: bajar jugadores por sala o salas activas.');
  console.log('Copia todo este texto y envíamelo.'); for (const b of bots) { try { b.ws.close(); } catch (e) { } clearInterval(b.iv); clearInterval(b.pi); } await sleep(1500); process.exit(0);
})();
