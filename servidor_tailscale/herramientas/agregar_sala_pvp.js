/* Último Refugio · añade la sala oficial PvP («Frontera PvP») a config.json, con copia de seguridad.
   Uso:  node herramientas/agregar_sala_pvp.js            (solo muestra lo que hará)
         node herramientas/agregar_sala_pvp.js --aplicar  (lo hace)
   - No toca tus otras salas ni sus mundos. Si ya hay una sala PvP, no hace nada.
   - Mapa 480×480 (tamaño «huge»): con 10 jugadores se encuentran más que en el de 960.
   - Sube «salasActivasMax» para que las salas oficiales + la PvP puedan estar abiertas a la vez. */
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.join(__dirname, '..'), CFGP = process.env.CONFIG || path.join(ROOT, 'config.json');
const say = m => console.log(m);
let CFG; try { CFG = JSON.parse(fs.readFileSync(CFGP, 'utf8')); } catch (e) { say('No se pudo leer ' + CFGP + ': ' + e.message); process.exit(1); }
const salas = Array.isArray(CFG.salas) ? CFG.salas : [];
const corriendo = () => new Promise(r => { const q = http.get({ host: '127.0.0.1', port: CFG.puerto || 8080, path: '/salas', timeout: 2500 }, res => { res.resume(); r(true); }); q.on('error', () => r(false)); q.on('timeout', () => { q.destroy(); r(false); }); });
(async () => {
  say('\nSalas oficiales actuales:'); for (const s of salas) say('  ' + s.id + ' · ' + (s.nombre || '') + (s.pvp ? ' · PVP' : '') + (s.tamano ? ' · mapa ' + s.tamano : ''));
  const ya = salas.find(s => s.pvp); if (ya) { say('\nYa tienes una sala PvP (' + ya.id + ' «' + (ya.nombre || '') + '»). No hace falta hacer nada.'); return; }
  let id = ''; for (let i = 4; i <= 9; i++) { if (!salas.some(s => String(s.id).toUpperCase() === 'SALA' + i)) { id = 'SALA' + i; break; } } if (!id) { say('No hay un identificador libre (SALA4–SALA9).'); process.exit(1); }
  const nueva = { id, nombre: 'Frontera PvP', pvp: true, tamano: 'huge', mundo: 'town' };
  const activas = Math.max((CFG.salasActivasMax || 3) + 1, salas.length + 2);   /* las oficiales + la PvP + 1 sala de jugador */
  say('\nSe añadirá:  ' + id + ' · «Frontera PvP» · PVP · mapa 480×480');
  say('Salas activas a la vez: ' + (CFG.salasActivasMax || 3) + ' → ' + activas);
  if (!process.argv.includes('--aplicar')) { say('\n(Nada cambiado todavía. Ejecuta con --aplicar para hacerlo.)'); return; }
  if (await corriendo()) { say('\n✖ El servidor está encendido. Ciérralo (ventana de INICIAR_SERVIDOR.bat → Ctrl+C) y vuelve a intentarlo.'); process.exit(1); }
  const bk = CFGP + '.antes_pvp_' + new Date().toISOString().replace(/[:.]/g, '-'); fs.copyFileSync(CFGP, bk);
  const out = Object.assign({}, CFG, { salas: salas.concat([nueva]), salasActivasMax: activas });
  fs.writeFileSync(CFGP, JSON.stringify(out, null, 2));
  say('\n✔ Listo. Copia de tu config anterior: ' + path.basename(bk));
  say('  Abre INICIAR_SERVIDOR.bat: la sala «Frontera PvP» aparecerá en la lista con la etiqueta PVP (pide la app 15.8 o posterior).');
  say('  Para quitarla: borra su bloque de «salas» en config.json (o restaura la copia).');
})();
