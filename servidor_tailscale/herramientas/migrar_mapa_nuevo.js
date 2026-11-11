#!/usr/bin/env node
/* Último Refugio · pasa las salas OFICIALES al mapa nuevo (960×960, 3 salas) con copia de seguridad, y permite volver atrás.
   Uso:  node herramientas/migrar_mapa_nuevo.js --aplicar      (cambia a 3 salas con el mapa nuevo)
         node herramientas/migrar_mapa_nuevo.js --revertir     (vuelve a la copia más reciente: config y mundos anteriores)
         node herramientas/migrar_mapa_nuevo.js                (solo muestra lo que haría)
   - Cierra el servidor antes (el programa lo comprueba).
   - NO toca las salas creadas por jugadores (siguen con su mundo y su tamaño).
   - Los mundos oficiales anteriores se MUEVEN (con sus copias) a  datos/respaldo_mapa_anterior/<fecha>/  y config.json se copia allí. */
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.join(__dirname, '..'), CFGP = process.env.CONFIG || path.join(ROOT, 'config.json'), APLICAR = process.argv.includes('--aplicar'), REVERTIR = process.argv.includes('--revertir');
const NUEVAS = [{ id: 'SALA1', nombre: 'Refugio 1' }, { id: 'SALA2', nombre: 'Refugio 2' }, { id: 'SALA3', nombre: 'Refugio 3' }];
const MAPA = { tamano: 'colossal', mundo: 'town' };      /* mundo 960×960 con centro, industrial, puerto, parques, callejones y mar */
const say = (...a) => console.log(...a), die = m => { console.error('\n✖ ' + m + '\n'); process.exit(1); };
let CFG = {}; try { CFG = JSON.parse(fs.readFileSync(CFGP, 'utf8')); } catch (e) { die('No pude leer ' + CFGP + ': ' + e.message); }
const DATA = path.isAbsolute(CFG.carpetaDatos || 'datos') ? (CFG.carpetaDatos || 'datos') : path.join(ROOT, CFG.carpetaDatos || 'datos'), SALAS = path.join(DATA, 'salas'), BK = path.join(DATA, 'respaldo_mapa_anterior');
const stamp = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '_' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()); };
const corriendo = () => new Promise(r => { const q = http.get({ host: '127.0.0.1', port: CFG.puerto || 8080, path: '/salas', timeout: 2500 }, res => { res.resume(); r(true); }); q.on('error', () => r(false)); q.on('timeout', () => { q.destroy(); r(false); }); });
const mover = (a, b) => { fs.mkdirSync(path.dirname(b), { recursive: true }); fs.renameSync(a, b); };
(async () => {
  if (await corriendo()) die('El servidor está abierto (puerto ' + (CFG.puerto || 8080) + '). Ciérralo (la ventana de INICIAR_SERVIDOR) y vuelve a ejecutar esto.');
  if (REVERTIR) {
    const lista = fs.existsSync(BK) ? fs.readdirSync(BK).filter(n => fs.existsSync(path.join(BK, n, 'config.json')) && !fs.existsSync(path.join(BK, n, 'revertido.json'))).sort() : []; if (!lista.length) die('No hay copias sin usar en ' + BK);
    const dir = path.join(BK, lista[lista.length - 1]); say('Volviendo a la copia: ' + dir);
    const meta = (() => { try { return JSON.parse(fs.readFileSync(path.join(dir, 'respaldo.json'), 'utf8')); } catch (e) { return { salas: [] }; } })();
    const desc = path.join(BK, 'descartado_' + stamp()); fs.mkdirSync(desc, { recursive: true });
    fs.copyFileSync(CFGP, path.join(desc, 'config_mapa_nuevo.json')); fs.copyFileSync(path.join(dir, 'config.json'), CFGP); say('  config.json anterior restaurado (el del mapa nuevo quedó en ' + desc + ')');
    for (const id of meta.salas) { const cur = path.join(SALAS, id), old = path.join(dir, id); if (!fs.existsSync(old)) continue;
      if (fs.existsSync(cur)) { mover(cur, path.join(desc, id)); say('  mundo nuevo de ' + id + ' guardado en ' + path.join(desc, id)); }
      mover(old, cur); say('  mundo anterior de ' + id + ' restaurado'); }
    for (const s of NUEVAS) if (!meta.salas.includes(s.id) && fs.existsSync(path.join(SALAS, s.id)) && !(JSON.parse(fs.readFileSync(CFGP, 'utf8')).salas || []).some(o => o.id === s.id)) { mover(path.join(SALAS, s.id), path.join(desc, s.id)); say('  mundo nuevo de ' + s.id + ' guardado en ' + path.join(desc, s.id)); }
    fs.writeFileSync(path.join(dir, 'revertido.json'), JSON.stringify({ fecha: new Date().toISOString() }));
    say('\n✔ Listo. Abre INICIAR_SERVIDOR.bat.'); return;
  }
  const oficiales = (CFG.salas || []).map(s => s.id), existentes = oficiales.filter(id => fs.existsSync(path.join(SALAS, id)));
  say('\nSalas oficiales actuales: ' + (oficiales.join(', ') || '(ninguna)') + ' · tamaño actual del mundo: ' + (CFG.tamano || 'huge'));
  say('Después del cambio:');
  for (const s of NUEVAS) say('  ' + s.id + ' «' + s.nombre + '» → mapa nuevo 960×960 (' + (existentes.includes(s.id) ? 'su mundo anterior se mueve a la copia' : 'mundo nuevo') + ')');
  say('  Salas creadas por jugadores: sin cambios (tamaño «big», 264×264; no se tocan sus mundos). Como máximo 1 activa a la vez (además de las 3 oficiales).');
  say('  Copia de seguridad en: ' + path.join(BK, '<fecha>'));
  if (!APLICAR) { say('\n(Solo vista previa. Para aplicar:  node herramientas/migrar_mapa_nuevo.js --aplicar)'); return; }
  const dir = path.join(BK, stamp()); fs.mkdirSync(dir, { recursive: true }); fs.copyFileSync(CFGP, path.join(dir, 'config.json'));
  const movidas = []; for (const id of existentes) { mover(path.join(SALAS, id), path.join(dir, id)); movidas.push(id); say('  mundo anterior de ' + id + ' → ' + path.join(dir, id)); }
  /* salas oficiales ya existentes en config que no sean SALA1-3 (si las hubiera) se conservan sin cambios */
  const otras = (CFG.salas || []).filter(s => !NUEVAS.some(n => n.id === s.id));
  const nuevo = Object.assign({}, CFG, { salas: NUEVAS.map(s => Object.assign({}, (CFG.salas || []).find(o => o.id === s.id) || s, MAPA)).concat(otras), tamano: 'big', maxJugadores: Math.min(10, CFG.maxJugadores || 10), salasActivasMax: Math.max(3, CFG.salasActivasMax || 3), salasUsuarioActivasMax: CFG.salasUsuarioActivasMax != null ? CFG.salasUsuarioActivasMax : 1 });
  fs.writeFileSync(path.join(dir, 'respaldo.json'), JSON.stringify({ fecha: new Date().toISOString(), salas: movidas }, null, 2)); fs.writeFileSync(CFGP, JSON.stringify(nuevo, null, 2));
  say('\n✔ Listo. config.json actualizado (3 salas oficiales con el mapa 960×960, 10 jugadores por sala).');
  say('  Abre INICIAR_SERVIDOR.bat: la primera vez que alguien entre a cada sala se genera su mundo (≈ 7 s).');
  say('  Para volver atrás:  VOLVER_AL_MAPA_ANTERIOR.bat');
})();
