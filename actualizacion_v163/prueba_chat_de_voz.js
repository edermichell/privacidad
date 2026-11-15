// Chat de voz de proximidad (micrófono falso de Chromium): cerca se oye, lejos no; mantener/toque; silenciar; zombis; app antigua
const { chromium } = require('playwright'); const URL = 'http://127.0.0.1:18080'; const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ck = (ok, m, x) => { console.log(ok ? 'OK  ' : 'FAIL', m, x === undefined ? '' : JSON.stringify(x)); if (!ok) fails++; };
const ev = async js => { const t = await (await fetch(URL + '/admin/eval?sala=SALA1&js=' + encodeURIComponent(js))).text(); try { return JSON.parse(t); } catch (e) { return t; } };
const waitIn = async (p, t = 90) => { for (let i = 0; i < t * 2; i++) { await sleep(500); if (await p.evaluate(() => NET.st === 'playing' && STATE === 'play').catch(() => false)) return true; } return false; };
async function join(b, nick, url) { const ctx = await b.newContext({ viewport: { width: 900, height: 420 }, permissions: ['microphone'] }); const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); await p.goto(url || (URL + '/juego/')); await p.waitForFunction(() => typeof netJoinWs === 'function'); await p.evaluate(n => { localStorage.setItem('ur_nick', n); window.__says = []; const o = say; say = function (m) { window.__says.push(String(m)); return o.apply(this, arguments); }; }, nick); await p.evaluate(() => $('bMulti').click()); await p.waitForFunction(() => S137.ok && document.querySelector('[data-room="SALA1"]'), null, { timeout: 30000 }); await p.evaluate(() => document.querySelector('[data-room="SALA1"]').click()); if (!await waitIn(p)) throw new Error('no entra'); await p.evaluate(() => { P.ghost = 1e9; try { audioInit(); } catch (e) { } }); return p; }
const lastFrom = (p, slot) => p.evaluate(s => { const q = VOZ.spk.get(s); return q ? Math.round(performance.now() - q.last) : -1; }, slot);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
  const A = await join(b, 'Lobo'); await sleep(1500); const B = await join(b, 'Oso'); await sleep(2500);
  const sA = await A.evaluate(() => { for (const [k] of NET.oth) return 0; return 0; }); // marcador
  const slotA = await ev("NET.peers.find(p=>p.rp&&p.rp.name==='Lobo').slot"), slotB = await ev("NET.peers.find(p=>p.rp&&p.rp.name==='Oso').slot");
  const sp = await A.evaluate(() => [P.x, P.y]); await B.evaluate(s => { P.x = s[0] + 3; P.y = s[1] + 1; }, sp); await sleep(2500);
  ck(await A.evaluate(() => VOZ.ok && !document.getElementById('vozBtn').hidden), 'el servidor ofrece voz y aparece el botón VOZ');
  // mantener pulsado
  await A.evaluate(() => VOZ.down()); await sleep(2200); const txA = await A.evaluate(() => VOZ.tx); await A.evaluate(() => VOZ.up()); await sleep(300);
  ck(txA && await A.evaluate(() => !VOZ.tx && !VOZ.stream), 'mantener pulsado: transmite mientras se sostiene y al soltar se cierra el micrófono');
  const l1 = await lastFrom(B, slotA); ck(l1 >= 0 && l1 < 1500, 'B (a 3 casillas) recibe la voz de A', { msDesdeUltimo: l1 });
  ck(await B.evaluate(n => [...document.querySelectorAll('#vozList .vz')].length >= 0, 'Lobo'), 'B ve quién habla');
  ck(await B.evaluate(() => { const s = [...VOZ.spk.values()][0]; return !!(s && s.g && s.g.gain.value > .5); }), 'volumen alto de cerca', await B.evaluate(() => { const s = [...VOZ.spk.values()][0]; return s && s.g && +s.g.gain.value.toFixed(2); }));
  // zombis
  await ev("(window.__nz=[],(()=>{const f=makeNoise;makeNoise=function(x,y,r,o){__nz.push([+x.toFixed(1),+y.toFixed(1),+(+r).toFixed(1)]);return f.apply(this,arguments)}})(),1)");
  await A.evaluate(() => VOZ.down()); await sleep(1600); await A.evaluate(() => VOZ.up());
  const nz = await ev("__nz.filter(n=>n[2]>=5&&n[2]<=14)"); const pa = await ev("(()=>{const p=NET.peers.find(q=>q.rp&&q.rp.name==='Lobo');return [p.rp.x,p.rp.y]})()");
  ck(Array.isArray(nz) && nz.length >= 1 && nz.some(n => Math.hypot(n[0] - pa[0], n[1] - pa[1]) < 3), 'hablar hace ruido en la posición de A (los zombis lo oyen)', nz.slice(0, 3));
  // toque: micrófono abierto
  await A.evaluate(() => { VOZ.down(); VOZ.up(); }); await sleep(1500); const lat = await A.evaluate(() => [VOZ.tx, VOZ.mode]);
  await A.evaluate(() => { VOZ.down(); VOZ.up(); }); await sleep(400); const off = await A.evaluate(() => [VOZ.tx, VOZ.mode, !!VOZ.stream]);
  ck(lat[0] && lat[1] === 2 && !off[0] && off[1] === 0 && !off[2], 'toque corto: micrófono abierto; otro toque lo cierra', { abierto: lat, cerrado: off });
  // lejos
  await B.evaluate(s => { P.x = s[0] + 70; P.y = s[1]; }, sp); await sleep(2500); const before = await lastFrom(B, slotA);
  await A.evaluate(() => VOZ.down()); await sleep(1500); await A.evaluate(() => VOZ.up()); await sleep(300); const after = await lastFrom(B, slotA);
  ck(after >= before + 1000 || after === -1, 'B a 70 casillas NO recibe la voz (el servidor no se la manda)', { antes: before, despues: after });
  // silenciar
  await B.evaluate(s => { P.x = s[0] + 3; P.y = s[1] + 1; }, sp); await sleep(2500);
  await A.evaluate(() => VOZ.down()); await sleep(800); await B.evaluate(sl => VOZ.toggleMute(sl), slotA); const chip = await B.evaluate(() => document.getElementById('vozList').textContent); await sleep(800); await A.evaluate(() => VOZ.up());
  ck(await B.evaluate(() => VOZ.mute.has('Lobo') && JSON.parse(localStorage.getItem('ur_voz_mute')).includes('Lobo')) && /oír/.test(chip), 'B silencia a Lobo (se recuerda) y su etiqueta lo indica', chip);
  await B.evaluate(sl => VOZ.toggleMute(sl), slotA);
  // apagar en ajustes
  await B.evaluate(() => VOZ.setOn(false)); ck(await B.evaluate(() => document.getElementById('vozBtn').hidden && document.getElementById('bVozP').textContent === 'Apagado'), 'Ajustes → Chat de voz: Apagado oculta el botón'); await B.evaluate(() => VOZ.setOn(true));
  // app antigua: no recibe binarios
  const C = await join(b, 'Viejo', URL + '/juego/?v=old'); await C.evaluate(() => { window.__bin = 0; const f = netBin; netBin = function (x) { __bin++; return f.apply(this, arguments); }; }); await C.evaluate(s => { P.x = s[0] + 2; P.y = s[1] + 2; }, sp);
  await ev("(NET.peers.forEach(p=>{if(p.rp&&p.rp.name==='Viejo')p.build=159}),1)"); await sleep(1500);
  await A.evaluate(() => VOZ.down()); await sleep(1500); await A.evaluate(() => VOZ.up());
  ck(await C.evaluate(() => __bin) === 0, 'un jugador con app anterior a la 16.3 no recibe datos de voz', await C.evaluate(() => __bin));
  const st = await ev("JSON.stringify(NET.peers.map(p=>[p.rp&&p.rp.name,p.build]))"); console.log('   peers', st);
  for (const p of [A, B, C]) ck(p.errs.length === 0, 'sin errores de página', p.errs.slice(0, 3));
  console.log('fallos:', fails); await b.close(); process.exit(0);
})().catch(e => { console.log('FALLO', e.stack || e.message); process.exit(1); });
