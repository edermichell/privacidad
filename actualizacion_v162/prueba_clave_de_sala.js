const { chromium } = require('playwright'); const URL = 'http://127.0.0.1:18080'; const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ck = (ok, m, x) => { console.log(ok ? 'OK  ' : 'FAIL', m, x === undefined ? '' : JSON.stringify(x)); if (!ok) fails++; };
async function abrir(b) { const p = await (await b.newContext({ viewport: { width: 900, height: 420 } })).newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); await p.goto(URL + '/juego/'); await p.waitForFunction(() => typeof netJoinWs === 'function' && window.__UR_BOOT_OK); await p.evaluate(() => $('bMulti').click()); await p.waitForFunction(() => S137.ok, null, { timeout: 30000 }); return p; }
const crear = async (p, nombre, clave) => { await p.evaluate(([n, c]) => { $('mpNew').open = true; $('mpNewName').value = n; $('mpNewCode').value = c; $('mpNewCode').dispatchEvent(new Event('input')); $('mpNewGo').click(); }, [nombre, clave]); await sleep(2500); return p.evaluate(() => ({ msg: ($('mpSrvMsg') || {}).textContent || '', code: NET.code || '', st: NET.st })); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const A = await abrir(b);
  let r = await crear(A, 'Sala de Lobo', 'lobo1'); const est = async () => (await (await fetch(URL + '/estado')).json()).salas; ck((await est()).some(s => s.id === 'LOBO1' && s.nombre === 'Sala de Lobo'), 'crear sala con la clave «lobo1» → la sala se llama LOBO1 en el servidor (en mayúsculas)');
  for (let i = 0; i < 40 && await A.evaluate(() => !(NET.st === 'playing' && STATE === 'play')); i++) await sleep(500);
  ck(await A.evaluate(() => NET.st === 'playing'), 'el creador entra a su sala');
  const B = await abrir(b); await B.evaluate(() => { $('mpPrivIn').value = 'LOBO1'; $('mpPrivGo').click(); });
  for (let i = 0; i < 60 && await B.evaluate(() => !(NET.st === 'playing' && STATE === 'play')); i++) await sleep(500);
  ck(await B.evaluate(() => NET.st === 'playing' && NET.code === 'LOBO1'), 'otro jugador entra escribiendo LOBO1');
  const C = await abrir(b);
  r = await crear(C, 'Otra sala', 'LOBO1'); ck(/ya la usa otra sala/.test(r.msg) && r.code !== 'LOBO1', 'la misma clave otra vez: se rechaza', r.msg);
  r = await crear(C, 'Otra sala', 'AB'); ck(/de 4 a 6/.test(r.msg), 'clave de 2 letras: se rechaza (4 a 6)', r.msg);
  r = await crear(C, 'Otra sala', 'SALA9'); ck(/reservada/.test(r.msg), 'clave que empieza por SALA: reservada', r.msg);
  r = await crear(C, 'Sala sin clave', ''); const sc = (await est()).find(s => s.nombre === 'Sala sin clave'); ck(sc && /^[A-Z2-9]{6}$/.test(sc.id), 'sin clave: se crea una al azar de 6', sc && sc.id);
  const L = await (await fetch(URL + '/estado')).json(); ck(L.salas.some(s => s.id === 'LOBO1'), 'la sala LOBO1 existe en el servidor');
  for (const p of [A, B, C]) ck(p.errs.length === 0, 'sin errores de página', p.errs.slice(0, 2));
  console.log('fallos:', fails); await b.close(); process.exit(0);
})().catch(e => { console.log('FALLO', e.stack || e.message); process.exit(1); });
