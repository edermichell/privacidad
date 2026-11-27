'use strict';
// Restablece el número de empresa y la contraseña desde la computadora donde está
// instalado el sistema (solo quien tenga acceso a esta máquina puede hacerlo).
// Uso:  node scripts/restablecer-clave.js
process.removeAllListeners('warning');
const path = require('node:path');
const crypto = require('node:crypto');
const readline = require('node:readline');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', 'data'));
const db = new DatabaseSync(path.join(DATA_DIR, 'empresa.db'));
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const preguntar = (q) => new Promise((r) => rl.question(q, r));

(async () => {
  const c = db.prepare('SELECT numero FROM cuenta WHERE id = 1').get();
  if (!c) { console.log('El sistema aún no está configurado. Inícielo con "npm start".'); process.exit(0); }
  console.log(`Número de empresa actual: ${c.numero}`);
  const numero = ((await preguntar('Nuevo número de empresa (Enter para conservar): ')).replace(/[\s.]/g, '').toUpperCase()) || c.numero;
  const clave = await preguntar('Nueva contraseña (mín. 10 caracteres, letras y números): ');
  if (clave.length < 10 || !/[a-zA-Z]/.test(clave) || !/\d/.test(clave)) { console.log('Contraseña demasiado débil. No se hicieron cambios.'); process.exit(1); }
  const sal = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(clave, Buffer.from(sal, 'hex'), 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString('hex');
  db.prepare('UPDATE cuenta SET numero = ?, hash = ?, sal = ?, clave_cambiada = ? WHERE id = 1').run(numero, hash, sal, new Date().toISOString());
  db.prepare('DELETE FROM sesiones').run();
  db.prepare('DELETE FROM intentos').run();
  db.prepare('INSERT INTO bitacora (fecha, accion, detalle, ip) VALUES (?, ?, ?, ?)').run(new Date().toISOString(), 'restablecer_clave', 'Credenciales restablecidas desde la consola', 'local');
  console.log('Listo. Credenciales actualizadas y todas las sesiones cerradas.');
  rl.close();
})();
