'use strict';
// IMPULSO CAPITAL CIUDADANO S.A.S. — Sistema de gestión empresarial
// Servidor sin dependencias externas (Node.js 22.13 o superior).
process.removeAllListeners('warning'); // oculta el aviso "SQLite is experimental"

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const { RESOURCES } = require('./schema');
const nomina = require('./nomina');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const FILES_DIR = path.join(DATA_DIR, 'archivos');
const PUBLIC_DIR = path.join(__dirname, 'public');
const COOKIE_SECURE = process.env.COOKIE_SECURE === '1';
const COOKIE = 'icc_sesion';
const MAX_FALLOS = 5;
const BLOQUEO_MS = 15 * 60 * 1000;
const SESION_MAX_MS = 12 * 60 * 60 * 1000;
const MAX_ARCHIVO = 15 * 1024 * 1024;

fs.mkdirSync(FILES_DIR, { recursive: true });

// ───────────────────────── Base de datos ─────────────────────────
const db = new DatabaseSync(path.join(DATA_DIR, 'empresa.db'));
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS cuenta (id INTEGER PRIMARY KEY CHECK (id = 1), numero TEXT NOT NULL,
    hash TEXT NOT NULL, sal TEXT NOT NULL, creado TEXT, clave_cambiada TEXT);
  CREATE TABLE IF NOT EXISTS sesiones (token TEXT PRIMARY KEY, creado INTEGER, ultimo INTEGER, ip TEXT, agente TEXT);
  CREATE TABLE IF NOT EXISTS intentos (clave TEXT PRIMARY KEY, fallos INTEGER, bloqueado_hasta INTEGER);
  CREATE TABLE IF NOT EXISTS bitacora (id INTEGER PRIMARY KEY AUTOINCREMENT, fecha TEXT, accion TEXT, detalle TEXT, ip TEXT);
  CREATE TABLE IF NOT EXISTS config (clave TEXT PRIMARY KEY, valor TEXT);
  CREATE TABLE IF NOT EXISTS nomina_periodos (id INTEGER PRIMARY KEY AUTOINCREMENT, periodo TEXT UNIQUE,
    estado TEXT, creado TEXT, pagado TEXT, totales TEXT, movimientos TEXT);
  CREATE TABLE IF NOT EXISTS nomina_detalle (id INTEGER PRIMARY KEY AUTOINCREMENT,
    periodo_id INTEGER REFERENCES nomina_periodos(id) ON DELETE CASCADE, empleado_id INTEGER,
    empleado TEXT, novedades TEXT, calculo TEXT, UNIQUE (periodo_id, empleado_id));
`);

const colType = (t) => (t === 'money' || t === 'number' ? 'REAL' : t === 'int' || t === 'bool' || t === 'ref' ? 'INTEGER' : 'TEXT');
for (const [name, def] of Object.entries(RESOURCES)) {
  db.exec(`CREATE TABLE IF NOT EXISTS ${name} (id INTEGER PRIMARY KEY AUTOINCREMENT, creado TEXT, actualizado TEXT)`);
  const existing = new Set(db.prepare(`PRAGMA table_info(${name})`).all().map((c) => c.name));
  for (const f of def.fields) {
    if (!existing.has(f.k)) db.exec(`ALTER TABLE ${name} ADD COLUMN ${f.k} ${colType(f.type)}`);
  }
}

const CONFIG_DEFAULT = {
  razon_social: 'IMPULSO CAPITAL CIUDADANO S.A.S.', nit: '', direccion: '', ciudad: '', telefono: '', email: '',
  representante: '', representante_doc: '', actividad: 'Desarrollo y publicación de videojuegos',
  regimen: 'Responsable de IVA', smmlv: '1750905', aux_transporte: '249095', horas_mes: '210',
  recargo_dominical: '0.9', exoneracion_aportes: '1', prefijo_factura: 'CC-', sesion_minutos: '30',
};
const insCfg = db.prepare('INSERT OR IGNORE INTO config (clave, valor) VALUES (?, ?)');
for (const [k, v] of Object.entries(CONFIG_DEFAULT)) insCfg.run(k, v);

// Juego inicial de ejemplo
if (db.prepare('SELECT COUNT(*) n FROM juegos').get().n === 0) {
  db.prepare(`INSERT INTO juegos (nombre, plataforma, estado, genero, motor, monetizacion, creado, actualizado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run('Último Refugio', 'Android', 'Publicado', 'Supervivencia / zombis · multijugador',
    'Otro', 'Unity Ads + compras in-app (Google Play)', ahora(), ahora());
}

function ahora() { return new Date().toISOString(); }
function hoy() { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
function getConfig() {
  const o = {};
  for (const r of db.prepare('SELECT clave, valor FROM config').all()) o[r.clave] = r.valor;
  return o;
}
function log(accion, detalle, ip) {
  db.prepare('INSERT INTO bitacora (fecha, accion, detalle, ip) VALUES (?, ?, ?, ?)').run(ahora(), accion, String(detalle || '').slice(0, 500), ip || '');
}
function tx(fn) {
  db.exec('BEGIN');
  try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; }
}

// ───────────────────────── Seguridad ─────────────────────────
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const normNumero = (s) => String(s || '').replace(/[\s.]/g, '').toUpperCase().slice(0, 40);
function hashClave(clave, sal) {
  return crypto.scryptSync(String(clave), Buffer.from(sal, 'hex'), 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString('hex');
}
function validarClave(c) {
  c = String(c || '');
  if (c.length < 10) return 'La contraseña debe tener al menos 10 caracteres.';
  if (!/[a-zA-Z]/.test(c) || !/\d/.test(c)) return 'La contraseña debe combinar letras y números.';
  if (c.length > 200) return 'La contraseña es demasiado larga.';
  return null;
}
function guardarClave(numero, clave, nueva) {
  const sal = crypto.randomBytes(16).toString('hex');
  const hash = hashClave(clave, sal);
  if (nueva) db.prepare('INSERT INTO cuenta (id, numero, hash, sal, creado, clave_cambiada) VALUES (1, ?, ?, ?, ?, ?)').run(numero, hash, sal, ahora(), ahora());
  else db.prepare('UPDATE cuenta SET numero = ?, hash = ?, sal = ?, clave_cambiada = ? WHERE id = 1').run(numero, hash, sal, ahora());
}
function bloqueo(clave) {
  const r = db.prepare('SELECT * FROM intentos WHERE clave = ?').get(clave);
  return r && r.bloqueado_hasta > Date.now() ? r.bloqueado_hasta : 0;
}
function registrarFallo(clave) {
  const r = db.prepare('SELECT * FROM intentos WHERE clave = ?').get(clave);
  const fallos = (r && r.bloqueado_hasta && r.bloqueado_hasta <= Date.now() ? 0 : r ? r.fallos : 0) + 1;
  const hasta = fallos >= MAX_FALLOS ? Date.now() + BLOQUEO_MS : 0;
  db.prepare('INSERT INTO intentos (clave, fallos, bloqueado_hasta) VALUES (?, ?, ?) ON CONFLICT(clave) DO UPDATE SET fallos = excluded.fallos, bloqueado_hasta = excluded.bloqueado_hasta')
    .run(clave, hasta ? 0 : fallos, hasta);
  return hasta;
}
function crearSesion(res, req) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sesiones (token, creado, ultimo, ip, agente) VALUES (?, ?, ?, ?, ?)')
    .run(sha256(token), Date.now(), Date.now(), ipDe(req), String(req.headers['user-agent'] || '').slice(0, 200));
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict${COOKIE_SECURE ? '; Secure' : ''}`);
}
function sesionActual(req) {
  const m = String(req.headers.cookie || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([a-f0-9]{64})`));
  if (!m) return null;
  const token = sha256(m[1]);
  const s = db.prepare('SELECT * FROM sesiones WHERE token = ?').get(token);
  if (!s) return null;
  const inactividad = (Number(getConfig().sesion_minutos) || 30) * 60 * 1000;
  if (Date.now() - s.ultimo > inactividad || Date.now() - s.creado > SESION_MAX_MS) {
    db.prepare('DELETE FROM sesiones WHERE token = ?').run(token);
    return null;
  }
  db.prepare('UPDATE sesiones SET ultimo = ? WHERE token = ?').run(Date.now(), token);
  return { token };
}
function ipDe(req) { return String(req.socket.remoteAddress || '').replace(/^::ffff:/, ''); }

// Código de instalación: impide que alguien con acceso a la red configure el sistema antes que usted.
let CODIGO_INSTALACION = null;
function hayCuenta() { return !!db.prepare('SELECT 1 FROM cuenta WHERE id = 1').get(); }

// ───────────────────────── Utilidades HTTP ─────────────────────────
const SEC_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
function json(res, status, obj) {
  res.writeHead(status, { ...SEC_HEADERS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(new HttpError(413, 'La solicitud es demasiado grande.')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(new HttpError(400, 'JSON inválido.')); }
    });
    req.on('error', reject);
  });
}

// ───────────────────────── Recursos genéricos ─────────────────────────
function limpiar(name, body, previo) {
  const def = RESOURCES[name];
  const out = {};
  for (const f of def.fields) {
    if (f.sys) continue;
    let v = body[f.k];
    if (v === undefined) { if (previo) continue; v = null; }
    if (v === '' || v === null) v = null;
    else switch (f.type) {
      case 'money': case 'number': v = Number(String(v).replace(/,/g, '.')); if (!Number.isFinite(v)) throw new HttpError(400, `"${f.label}" debe ser un número.`); if (f.type === 'money') v = Math.round(v * 100) / 100; break;
      case 'int': v = Math.round(Number(v)); if (!Number.isFinite(v)) throw new HttpError(400, `"${f.label}" debe ser un número entero.`); break;
      case 'bool': v = v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0; break;
      case 'date': v = String(v); if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new HttpError(400, `"${f.label}" debe ser una fecha válida.`); break;
      case 'select': v = String(v); if (!f.options.includes(v)) throw new HttpError(400, `Valor no permitido en "${f.label}".`); break;
      case 'ref': {
        v = Math.round(Number(v));
        if (!db.prepare(`SELECT 1 FROM ${f.ref} WHERE id = ?`).get(v)) throw new HttpError(400, `El registro elegido en "${f.label}" no existe.`);
        break;
      }
      case 'email': v = String(v).trim().slice(0, 200); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw new HttpError(400, `"${f.label}" no es un correo válido.`); break;
      case 'url': v = String(v).trim().slice(0, 500); if (!/^https?:\/\//i.test(v)) throw new HttpError(400, `"${f.label}" debe empezar por http:// o https://`); break;
      case 'textarea': v = String(v).slice(0, 20000); break;
      default: v = String(v).trim().slice(0, 300);
    }
    if (f.type === 'bool' && v === null) v = 0;
    out[f.k] = v;
  }
  const merged = { ...(previo || {}), ...out };
  for (const f of def.fields) {
    if (f.required && (merged[f.k] === null || merged[f.k] === undefined || merged[f.k] === '')) throw new HttpError(400, `El campo "${f.label}" es obligatorio.`);
  }
  return out;
}
function publico(name, row) {
  if (!row) return row;
  for (const f of RESOURCES[name].fields) if (f.secret) delete row[f.k];
  return row;
}
function insertar(name, data) {
  data = { ...data, creado: ahora(), actualizado: ahora() };
  const keys = Object.keys(data);
  const info = db.prepare(`INSERT INTO ${name} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`).run(...keys.map((k) => data[k]));
  return Number(info.lastInsertRowid);
}
function actualizar(name, id, data) {
  data = { ...data, actualizado: ahora() };
  const keys = Object.keys(data);
  db.prepare(`UPDATE ${name} SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).run(...keys.map((k) => data[k]), id);
}
const obtener = (name, id) => db.prepare(`SELECT * FROM ${name} WHERE id = ?`).get(id);

// Reglas de negocio por módulo
const HOOKS = {
  movimientos: {
    before(data, previo) { if (!previo) data.origen = 'manual'; },
  },
  facturas: {
    before(data, previo) {
      const m = { ...(previo || {}), ...data };
      const sub = Number(m.subtotal) || 0;
      const iva = Math.round(sub * (Number(m.iva_pct) || 0)) / 100;
      data.total = Math.round((sub + iva - (Number(m.retencion) || 0)) * 100) / 100;
      if (!m.numero) {
        const pref = getConfig().prefijo_factura || '';
        const n = db.prepare('SELECT COUNT(*) n FROM facturas').get().n + 1;
        let num = n, cand;
        do { cand = `${pref}${String(num++).padStart(4, '0')}`; } while (db.prepare('SELECT 1 FROM facturas WHERE numero = ?').get(cand));
        data.numero = cand;
      }
      if (m.estado === 'Pagada' && !m.fecha_pago) data.fecha_pago = hoy();
    },
    after(id) {
      const f = obtener('facturas', id);
      const mov = f.movimiento_id ? obtener('movimientos', f.movimiento_id) : null;
      if (f.estado === 'Pagada') {
        const sub = Number(f.subtotal) || 0;
        const datos = {
          fecha: f.fecha_pago || hoy(), tipo: 'Ingreso', categoria: f.categoria || '4155 Servicios de desarrollo',
          descripcion: `Cobro ${f.numero}: ${String(f.concepto).split('\n')[0].slice(0, 120)}`, tercero_id: f.tercero_id,
          valor: sub, iva: Math.round(sub * (Number(f.iva_pct) || 0)) / 100, retencion: f.retencion || 0,
          medio_pago: 'Transferencia', comprobante: f.numero, origen: 'factura',
        };
        if (mov) actualizar('movimientos', mov.id, datos);
        else db.prepare('UPDATE facturas SET movimiento_id = ? WHERE id = ?').run(insertar('movimientos', datos), id);
      } else if (f.movimiento_id) {
        if (mov) db.prepare('DELETE FROM movimientos WHERE id = ?').run(mov.id);
        db.prepare('UPDATE facturas SET movimiento_id = NULL WHERE id = ?').run(id);
      }
    },
    remove(row) { if (row.movimiento_id) db.prepare('DELETE FROM movimientos WHERE id = ?').run(row.movimiento_id); },
  },
  documentos: {
    remove(row) {
      if (row.archivo_ruta && /^[a-f0-9]{32}$/.test(row.archivo_ruta)) fs.rmSync(path.join(FILES_DIR, row.archivo_ruta), { force: true });
    },
  },
};

// Antes de borrar, desvincula referencias para no romper otros registros
function desvincular(name, id) {
  for (const [rn, def] of Object.entries(RESOURCES)) {
    for (const f of def.fields) if (f.type === 'ref' && f.ref === name) db.prepare(`UPDATE ${rn} SET ${f.k} = NULL WHERE ${f.k} = ?`).run(id);
  }
}

// ───────────────────────── Nómina ─────────────────────────
function recalcularPeriodo(pid) {
  const cfg = getConfig();
  const p = db.prepare('SELECT * FROM nomina_periodos WHERE id = ?').get(pid);
  const filas = db.prepare('SELECT * FROM nomina_detalle WHERE periodo_id = ?').all(pid);
  const dets = [];
  for (const d of filas) {
    const emp = obtener('empleados', d.empleado_id) || JSON.parse(d.empleado);
    const nov = JSON.parse(d.novedades || '{}');
    if (nov.dias === undefined || nov.dias === null || nov.dias === '') nov.dias = nomina.diasDelPeriodo(emp, p.periodo);
    const calculo = nomina.calcular(emp, nov, cfg);
    const snap = JSON.stringify({ nombres: emp.nombres, apellidos: emp.apellidos, documento: emp.documento, tipo_doc: emp.tipo_doc, cargo: emp.cargo, salario: emp.salario, banco: emp.banco, numero_cuenta: emp.numero_cuenta, eps: emp.eps, afp: emp.afp });
    db.prepare('UPDATE nomina_detalle SET calculo = ?, empleado = ? WHERE id = ?').run(JSON.stringify(calculo), snap, d.id);
    dets.push({ calculo });
  }
  db.prepare('UPDATE nomina_periodos SET totales = ? WHERE id = ?').run(JSON.stringify(nomina.totales(dets)), pid);
}
function periodoCompleto(pid) {
  const p = db.prepare('SELECT * FROM nomina_periodos WHERE id = ?').get(pid);
  if (!p) throw new HttpError(404, 'Periodo no encontrado.');
  p.totales = JSON.parse(p.totales || '{}');
  p.detalle = db.prepare('SELECT * FROM nomina_detalle WHERE periodo_id = ? ORDER BY id').all(pid).map((d) => ({
    id: d.id, empleado_id: d.empleado_id, empleado: JSON.parse(d.empleado || '{}'),
    novedades: JSON.parse(d.novedades || '{}'), calculo: JSON.parse(d.calculo || '{}'),
  }));
  return p;
}
const NOVEDADES = ['dias', 'he_diurnas', 'he_nocturnas', 'recargo_nocturno', 'horas_dominicales', 'comisiones', 'bonificacion', 'retencion', 'otras_deducciones'];
function limpiarNovedades(b) {
  const n = {};
  for (const k of NOVEDADES) {
    if (b[k] === '' || b[k] === null || b[k] === undefined) continue;
    const v = Number(b[k]);
    if (!Number.isFinite(v) || v < 0) throw new HttpError(400, 'Las novedades deben ser números positivos.');
    n[k] = k === 'dias' ? Math.min(30, v) : v;
  }
  if (b.sin_aux) n.sin_aux = true;
  if (b.nota) n.nota = String(b.nota).slice(0, 300);
  return n;
}

// ───────────────────────── Rutas API ─────────────────────────
async function api(req, res, url) {
  const ip = ipDe(req);
  const method = req.method;
  const p = url.pathname;

  // Protección CSRF: solo JSON con cabecera propia y mismo origen.
  if (method !== 'GET' && method !== 'HEAD') {
    const conCuerpo = Number(req.headers['content-length'] || 0) > 0 || req.headers['transfer-encoding'];
    if (req.headers['x-icc'] !== '1' || (conCuerpo && !String(req.headers['content-type'] || '').startsWith('application/json'))) throw new HttpError(403, 'Solicitud no permitida.');
    const origin = req.headers.origin;
    if (origin) {
      let host = null;
      try { host = new URL(origin).host; } catch { /* origen inválido */ }
      if (host !== req.headers.host) throw new HttpError(403, 'Origen no permitido.');
    }
  }

  if (p === '/api/estado' && method === 'GET') {
    const cfg = getConfig();
    return json(res, 200, { configurado: hayCuenta(), autenticado: !!sesionActual(req), empresa: cfg.razon_social });
  }

  if (p === '/api/instalar' && method === 'POST') {
    if (hayCuenta()) throw new HttpError(409, 'El sistema ya fue configurado.');
    const b = await readBody(req, 10000);
    if (bloqueo('instalar:' + ip)) throw new HttpError(429, 'Demasiados intentos. Espere 15 minutos.');
    if (!CODIGO_INSTALACION || String(b.codigo || '').trim() !== CODIGO_INSTALACION) {
      registrarFallo('instalar:' + ip);
      throw new HttpError(403, 'Código de instalación incorrecto. Revise la ventana donde inició el servidor.');
    }
    const numero = normNumero(b.numero);
    if (numero.length < 4) throw new HttpError(400, 'El número de empresa debe tener al menos 4 caracteres.');
    const err = validarClave(b.clave);
    if (err) throw new HttpError(400, err);
    guardarClave(numero, b.clave, true);
    if (b.razon_social) db.prepare('UPDATE config SET valor = ? WHERE clave = ?').run(String(b.razon_social).slice(0, 200), 'razon_social');
    db.prepare("UPDATE config SET valor = ? WHERE clave = 'nit' AND valor = ''").run(numero);
    CODIGO_INSTALACION = null;
    log('instalacion', 'Cuenta de empresa creada', ip);
    crearSesion(res, req);
    return json(res, 200, { ok: true });
  }

  if (p === '/api/login' && method === 'POST') {
    const b = await readBody(req, 10000);
    const numero = normNumero(b.numero);
    const claves = ['ip:' + ip, 'num:' + numero];
    const hasta = Math.max(...claves.map(bloqueo));
    if (hasta) {
      const min = Math.ceil((hasta - Date.now()) / 60000);
      throw new HttpError(429, `Acceso bloqueado temporalmente por intentos fallidos. Intente de nuevo en ${min} min.`);
    }
    const c = db.prepare('SELECT * FROM cuenta WHERE id = 1').get();
    const sal = c ? c.sal : '00'.repeat(16);
    const calc = Buffer.from(hashClave(String(b.clave || ''), sal), 'hex');
    const ok = !!c && c.numero === numero && crypto.timingSafeEqual(calc, Buffer.from(c.hash, 'hex'));
    if (!ok) {
      const bloq = claves.map(registrarFallo).some(Boolean);
      log('acceso_fallido', `Número: ${numero.slice(0, 20)}${bloq ? ' — BLOQUEADO 15 min' : ''}`, ip);
      throw new HttpError(401, 'Número de empresa o contraseña incorrectos.');
    }
    for (const k of claves) db.prepare('DELETE FROM intentos WHERE clave = ?').run(k);
    crearSesion(res, req);
    log('acceso', 'Inicio de sesión correcto', ip);
    return json(res, 200, { ok: true });
  }

  if (p === '/api/logout' && method === 'POST') {
    const m = String(req.headers.cookie || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([a-f0-9]{64})`));
    if (m) db.prepare('DELETE FROM sesiones WHERE token = ?').run(sha256(m[1]));
    res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
    return json(res, 200, { ok: true });
  }

  // ─── A partir de aquí, todo requiere sesión ───
  const ses = sesionActual(req);
  if (!ses) throw new HttpError(401, 'Sesión expirada. Inicie sesión de nuevo.');

  if (p === '/api/esquema' && method === 'GET') {
    const out = {};
    for (const [n, d] of Object.entries(RESOURCES)) out[n] = { ...d, fields: d.fields.filter((f) => !f.secret) };
    return json(res, 200, out);
  }

  if (p === '/api/config') {
    if (method === 'GET') return json(res, 200, getConfig());
    if (method === 'PUT') {
      const b = await readBody(req, 20000);
      const up = db.prepare('UPDATE config SET valor = ? WHERE clave = ?');
      tx(() => { for (const k of Object.keys(CONFIG_DEFAULT)) if (b[k] !== undefined) up.run(String(b[k]).slice(0, 300), k); });
      log('configuracion', 'Datos de empresa / parámetros actualizados', ip);
      return json(res, 200, getConfig());
    }
  }

  if (p === '/api/seguridad' && method === 'GET') {
    const c = db.prepare('SELECT numero, creado, clave_cambiada FROM cuenta WHERE id = 1').get();
    const sesiones = db.prepare('SELECT creado, ultimo, ip, agente, token FROM sesiones ORDER BY ultimo DESC').all()
      .map((s) => ({ creado: s.creado, ultimo: s.ultimo, ip: s.ip, agente: s.agente, actual: s.token === ses.token ? 1 : 0 }));
    const bitacora = db.prepare('SELECT fecha, accion, detalle, ip FROM bitacora ORDER BY id DESC LIMIT 300').all();
    return json(res, 200, { cuenta: c, sesiones, bitacora });
  }

  if (p === '/api/cambiar-clave' && method === 'POST') {
    const b = await readBody(req, 10000);
    const c = db.prepare('SELECT * FROM cuenta WHERE id = 1').get();
    if (bloqueo('cambio:' + ip)) throw new HttpError(429, 'Demasiados intentos. Espere 15 minutos.');
    const calc = Buffer.from(hashClave(String(b.actual || ''), c.sal), 'hex');
    if (!crypto.timingSafeEqual(calc, Buffer.from(c.hash, 'hex'))) {
      registrarFallo('cambio:' + ip);
      log('cambio_clave_fallido', 'Contraseña actual incorrecta', ip);
      throw new HttpError(400, 'La contraseña actual no es correcta.');
    }
    const numero = b.numero ? normNumero(b.numero) : c.numero;
    if (numero.length < 4) throw new HttpError(400, 'El número de empresa debe tener al menos 4 caracteres.');
    const nueva = b.nueva ? String(b.nueva) : null;
    if (nueva) { const err = validarClave(nueva); if (err) throw new HttpError(400, err); }
    tx(() => {
      if (nueva) guardarClave(numero, nueva, false);
      else db.prepare('UPDATE cuenta SET numero = ? WHERE id = 1').run(numero);
      db.prepare('DELETE FROM sesiones WHERE token <> ?').run(ses.token);
    });
    log('cambio_clave', nueva ? 'Contraseña cambiada; otras sesiones cerradas' : 'Número de empresa cambiado', ip);
    return json(res, 200, { ok: true });
  }

  if (p === '/api/cerrar-otras' && method === 'POST') {
    db.prepare('DELETE FROM sesiones WHERE token <> ?').run(ses.token);
    log('sesiones', 'Se cerraron las demás sesiones', ip);
    return json(res, 200, { ok: true });
  }

  if (p === '/api/respaldo' && method === 'GET') {
    const out = { sistema: 'ICC-gestion', fecha: ahora(), config: getConfig(), datos: {} };
    for (const n of Object.keys(RESOURCES)) out.datos[n] = db.prepare(`SELECT * FROM ${n}`).all().map((r) => publico(n, r));
    out.datos.nomina_periodos = db.prepare('SELECT * FROM nomina_periodos').all();
    out.datos.nomina_detalle = db.prepare('SELECT * FROM nomina_detalle').all();
    log('respaldo', 'Se descargó un respaldo de datos', ip);
    res.writeHead(200, { ...SEC_HEADERS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
      'Content-Disposition': `attachment; filename="respaldo-icc-${hoy()}.json"` });
    return res.end(JSON.stringify(out, null, 1));
  }

  // ─── Documentos (subida/descarga) ───
  if (p === '/api/documentos/subir' && method === 'POST') {
    const b = await readBody(req, Math.ceil(MAX_ARCHIVO * 1.4) + 20000);
    const a = b.archivo || {};
    const buf = Buffer.from(String(a.datos || ''), 'base64');
    if (!buf.length) throw new HttpError(400, 'Seleccione un archivo.');
    if (buf.length > MAX_ARCHIVO) throw new HttpError(413, 'El archivo supera 15 MB.');
    const data = limpiar('documentos', { ...b, nombre: b.nombre || a.nombre });
    const ruta = crypto.randomBytes(16).toString('hex');
    fs.writeFileSync(path.join(FILES_DIR, ruta), buf);
    data.archivo_nombre = String(a.nombre || 'archivo').replace(/[\\/\r\n"]/g, '_').slice(0, 200);
    data.archivo_tipo = /^[\w.+-]+\/[\w.+-]+$/.test(a.tipo || '') ? a.tipo : 'application/octet-stream';
    data.archivo_tamano = buf.length;
    data.archivo_ruta = ruta;
    const id = insertar('documentos', data);
    log('crear', `documentos #${id}: ${data.nombre}`, ip);
    return json(res, 200, publico('documentos', obtener('documentos', id)));
  }
  let m = p.match(/^\/api\/documentos\/(\d+)\/descargar$/);
  if (m && method === 'GET') {
    const d = obtener('documentos', Number(m[1]));
    if (!d || !/^[a-f0-9]{32}$/.test(d.archivo_ruta || '')) throw new HttpError(404, 'Documento no encontrado.');
    const file = path.join(FILES_DIR, d.archivo_ruta);
    if (!fs.existsSync(file)) throw new HttpError(404, 'El archivo no existe en el disco.');
    const ascii = d.archivo_nombre.replace(/[^\x20-\x7e]/g, '_');
    res.writeHead(200, { ...SEC_HEADERS, 'Content-Type': 'application/octet-stream', 'Cache-Control': 'no-store',
      'Content-Disposition': `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(d.archivo_nombre)}` });
    return fs.createReadStream(file).pipe(res);
  }

  // ─── Nómina ───
  if (p === '/api/nomina' && method === 'GET') {
    const rows = db.prepare('SELECT * FROM nomina_periodos ORDER BY periodo DESC').all();
    return json(res, 200, rows.map((r) => ({ ...r, totales: JSON.parse(r.totales || '{}'), movimientos: undefined })));
  }
  if (p === '/api/nomina' && method === 'POST') {
    const b = await readBody(req, 10000);
    const periodo = String(b.periodo || '');
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodo)) throw new HttpError(400, 'Periodo inválido (AAAA-MM).');
    const pid = tx(() => {
      let per = db.prepare('SELECT * FROM nomina_periodos WHERE periodo = ?').get(periodo);
      if (per && per.estado === 'Pagada') throw new HttpError(409, 'Esa nómina ya está pagada. Reábrala para modificarla.');
      if (!per) {
        const id = Number(db.prepare("INSERT INTO nomina_periodos (periodo, estado, creado) VALUES (?, 'Borrador', ?)").run(periodo, ahora()).lastInsertRowid);
        per = { id };
      }
      const emps = db.prepare("SELECT * FROM empleados WHERE tipo_contrato <> 'Prestación de servicios' OR tipo_contrato IS NULL").all()
        .filter((e) => nomina.diasDelPeriodo(e, periodo) > 0 && (e.estado !== 'Retirado' || (e.fecha_retiro && e.fecha_retiro.slice(0, 7) >= periodo)));
      const ins = db.prepare("INSERT OR IGNORE INTO nomina_detalle (periodo_id, empleado_id, empleado, novedades, calculo) VALUES (?, ?, '{}', '{}', '{}')");
      for (const e of emps) ins.run(per.id, e.id);
      recalcularPeriodo(per.id);
      return per.id;
    });
    log('nomina', `Nómina ${periodo} generada / recalculada`, ip);
    return json(res, 200, periodoCompleto(pid));
  }
  m = p.match(/^\/api\/nomina\/(\d+)(?:\/(pagar|reabrir|detalle\/(\d+)))?$/);
  if (m) {
    const pid = Number(m[1]);
    const per = db.prepare('SELECT * FROM nomina_periodos WHERE id = ?').get(pid);
    if (!per) throw new HttpError(404, 'Periodo no encontrado.');
    if (!m[2] && method === 'GET') return json(res, 200, periodoCompleto(pid));
    if (!m[2] && method === 'DELETE') {
      if (per.estado === 'Pagada') throw new HttpError(409, 'Reabra la nómina antes de eliminarla.');
      db.prepare('DELETE FROM nomina_periodos WHERE id = ?').run(pid);
      log('nomina', `Nómina ${per.periodo} eliminada`, ip);
      return json(res, 200, { ok: true });
    }
    if (m[3] && (method === 'PUT' || method === 'DELETE')) {
      if (per.estado === 'Pagada') throw new HttpError(409, 'La nómina está pagada. Reábrala para editarla.');
      const did = Number(m[3]);
      if (method === 'DELETE') db.prepare('DELETE FROM nomina_detalle WHERE id = ? AND periodo_id = ?').run(did, pid);
      else {
        const b = await readBody(req, 10000);
        db.prepare('UPDATE nomina_detalle SET novedades = ? WHERE id = ? AND periodo_id = ?').run(JSON.stringify(limpiarNovedades(b)), did, pid);
      }
      recalcularPeriodo(pid);
      return json(res, 200, periodoCompleto(pid));
    }
    if (m[2] === 'pagar' && method === 'POST') {
      if (per.estado === 'Pagada') throw new HttpError(409, 'Ya está pagada.');
      tx(() => {
        recalcularPeriodo(pid);
        const t = JSON.parse(db.prepare('SELECT totales FROM nomina_periodos WHERE id = ?').get(pid).totales || '{}');
        const fecha = hoy();
        const ids = [];
        if (t.neto) ids.push(insertar('movimientos', { fecha, tipo: 'Gasto', categoria: '5105 Gastos de personal (nómina)', descripcion: `Nómina ${per.periodo} — pago neto a ${t.empleados} empleado(s)`, valor: t.neto, medio_pago: 'Transferencia', comprobante: `NOM-${per.periodo}`, origen: 'nomina' }));
        if (t.pila) ids.push(insertar('movimientos', { fecha, tipo: 'Gasto', categoria: '5105 Gastos de personal (nómina)', descripcion: `Seguridad social y parafiscales (PILA) ${per.periodo}`, valor: t.pila, medio_pago: 'PSE', comprobante: `PILA-${per.periodo}`, origen: 'nomina' }));
        db.prepare("UPDATE nomina_periodos SET estado = 'Pagada', pagado = ?, movimientos = ? WHERE id = ?").run(ahora(), JSON.stringify(ids), pid);
      });
      log('nomina', `Nómina ${per.periodo} marcada como pagada`, ip);
      return json(res, 200, periodoCompleto(pid));
    }
    if (m[2] === 'reabrir' && method === 'POST') {
      tx(() => {
        for (const id of JSON.parse(per.movimientos || '[]')) db.prepare("DELETE FROM movimientos WHERE id = ? AND origen = 'nomina'").run(id);
        db.prepare("UPDATE nomina_periodos SET estado = 'Borrador', pagado = NULL, movimientos = NULL WHERE id = ?").run(pid);
      });
      log('nomina', `Nómina ${per.periodo} reabierta`, ip);
      return json(res, 200, periodoCompleto(pid));
    }
  }

  // ─── CRUD genérico: /api/r/:recurso[/:id] ───
  m = p.match(/^\/api\/r\/([a-z_]+)(?:\/(\d+))?$/);
  if (m && RESOURCES[m[1]]) {
    const name = m[1], def = RESOURCES[name], hook = HOOKS[name] || {};
    const id = m[2] ? Number(m[2]) : null;
    if (method === 'GET' && !id) return json(res, 200, db.prepare(`SELECT * FROM ${name} ORDER BY ${def.order || 'id DESC'}`).all().map((r) => publico(name, r)));
    if (method === 'GET' && id) { const r = obtener(name, id); if (!r) throw new HttpError(404, 'No encontrado.'); return json(res, 200, publico(name, r)); }
    if (method === 'POST' && !id) {
      if (def.noCreate) throw new HttpError(400, 'Use el formulario de subida.');
      const b = await readBody(req, 100000);
      const nid = tx(() => {
        const data = limpiar(name, b);
        hook.before && hook.before(data, null);
        const nid = insertar(name, data);
        hook.after && hook.after(nid);
        return nid;
      });
      log('crear', `${name} #${nid}`, ip);
      return json(res, 200, publico(name, obtener(name, nid)));
    }
    if (method === 'PUT' && id) {
      const previo = obtener(name, id);
      if (!previo) throw new HttpError(404, 'No encontrado.');
      const b = await readBody(req, 100000);
      tx(() => {
        const data = limpiar(name, b, previo);
        hook.before && hook.before(data, previo);
        actualizar(name, id, data);
        hook.after && hook.after(id);
      });
      log('editar', `${name} #${id}`, ip);
      return json(res, 200, publico(name, obtener(name, id)));
    }
    if (method === 'DELETE' && id) {
      const previo = obtener(name, id);
      if (!previo) throw new HttpError(404, 'No encontrado.');
      tx(() => {
        desvincular(name, id);
        db.prepare(`DELETE FROM ${name} WHERE id = ?`).run(id);
        if (name === 'movimientos') db.prepare('UPDATE facturas SET movimiento_id = NULL WHERE movimiento_id = ?').run(id);
      });
      hook.remove && hook.remove(previo);
      log('eliminar', `${name} #${id}`, ip);
      return json(res, 200, { ok: true });
    }
  }

  throw new HttpError(404, 'Ruta no encontrada.');
}

// ───────────────────────── Archivos estáticos ─────────────────────────
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json' };
function estatico(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/' || !path.extname(rel)) rel = '/index.html';
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, SEC_HEADERS); return res.end('No encontrado');
  }
  res.writeHead(200, { ...SEC_HEADERS, 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  let url;
  try { url = new URL(req.url, 'http://localhost'); } catch { res.writeHead(400); return res.end(); }
  try {
    if (url.pathname.startsWith('/api/')) await api(req, res, url);
    else if (req.method === 'GET' || req.method === 'HEAD') estatico(req, res, url);
    else { res.writeHead(405, SEC_HEADERS); res.end(); }
  } catch (e) {
    const status = e.status || 500;
    if (status === 500) console.error(e);
    if (!res.headersSent) json(res, status, { error: status === 500 ? 'Error interno del servidor.' : e.message });
    else res.end();
  }
});

// Limpieza periódica de sesiones caducadas
setInterval(() => {
  db.prepare('DELETE FROM sesiones WHERE creado < ?').run(Date.now() - SESION_MAX_MS);
  db.prepare('DELETE FROM bitacora WHERE id NOT IN (SELECT id FROM bitacora ORDER BY id DESC LIMIT 5000)').run();
}, 60 * 60 * 1000).unref();

function arrancar(port = PORT, host = HOST, silencioso = false) {
  if (!hayCuenta()) CODIGO_INSTALACION = String(crypto.randomInt(100000, 1000000));
  return new Promise((resolve) => server.listen(port, host, () => {
    if (!silencioso) {
      const dir = `http://${host === '0.0.0.0' ? 'localhost' : host}:${server.address().port}`;
      console.log('\n  IMPULSO CAPITAL CIUDADANO — Sistema de gestión');
      console.log(`  Abra en su navegador: ${dir}\n`);
      if (CODIGO_INSTALACION) {
        console.log('  ┌────────────────────────────────────────────┐');
        console.log(`  │  PRIMERA VEZ — Código de instalación: ${CODIGO_INSTALACION} │`);
        console.log('  └────────────────────────────────────────────┘');
        console.log('  Escríbalo en la pantalla de configuración inicial.\n');
      }
      console.log('  Para detener el servidor presione Ctrl + C.\n');
    }
    resolve({ port: server.address().port, codigo: CODIGO_INSTALACION });
  }));
}

if (require.main === module) arrancar();

module.exports = { server, db, arrancar };
