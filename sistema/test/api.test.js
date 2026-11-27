'use strict';
// Pruebas de extremo a extremo de la API (base de datos temporal).
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const http = require('node:http');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'icc-test-'));
process.env.DATA_DIR = TMP;
// Servidor falso de Unity para las pruebas
let ultimaConsultaUnity = null;
const hoyISO = new Date().toISOString().slice(0, 10);
const mesISO = hoyISO.slice(0, 7);
const unityFalso = http.createServer((q, r) => {
  const u = new URL(q.url, 'http://x');
  ultimaConsultaUnity = { path: u.pathname, params: Object.fromEntries(u.searchParams), accept: q.headers.accept };
  if (u.searchParams.get('apikey') !== 'clave-de-prueba-1234567890') { r.writeHead(401); return r.end('{"error":"unauthorized"}'); }
  r.writeHead(200, { 'Content-Type': 'text/csv' });
  r.end(`timestamp,source_game_id,platform,adrequest_count,available_sum,revenue_sum,start_count,view_count\n${hoyISO}T00:00:00.000Z,5551234,android,1000,950,12.5,900,850\n${hoyISO}T00:00:00.000Z,5551234,ios,100,90,"1.5",80,70\n`);
});
unityFalso.listen(0);
process.env.UNITY_API_URL = `http://127.0.0.1:${unityFalso.address().port}`;
const { server, arrancar } = require('../server');
let base, codigo, cookie = '';

async function req(method, url, body, extra = {}) {
  const headers = { 'X-ICC': '1', ...(cookie ? { Cookie: cookie } : {}), ...extra };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(base + url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const sc = r.headers.get('set-cookie');
  if (sc) cookie = sc.split(';')[0];
  let data = null; try { data = await r.json(); } catch {}
  return { status: r.status, data, headers: r.headers };
}

before(async () => { ({ port: base, codigo } = await arrancar(0, '127.0.0.1', true)); base = `http://127.0.0.1:${base}`; });
after(() => { server.close(); unityFalso.close(); fs.rmSync(TMP, { recursive: true, force: true }); });

test('instalación y acceso', async () => {
  assert.equal((await req('GET', '/api/estado')).data.configurado, false);
  assert.equal((await req('GET', '/api/r/empleados')).status, 401);
  assert.equal((await req('POST', '/api/instalar', { numero: '901234567-8', clave: 'Clave12345x', codigo: '000' })).status, 403);
  assert.equal((await req('POST', '/api/instalar', { numero: '901234567-8', clave: 'corta', codigo })).status, 400);
  assert.equal((await req('POST', '/api/instalar', { numero: '901.234.567-8', clave: 'Clave12345x', codigo })).status, 200);
  assert.equal((await req('POST', '/api/instalar', { numero: 'x', clave: 'Clave12345x', codigo })).status, 409);
  await req('POST', '/api/logout', {});
  cookie = '';
  assert.equal((await req('POST', '/api/login', { numero: '901234567-8', clave: 'mala' })).status, 401);
  assert.equal((await req('POST', '/api/login', { numero: '901234567-8', clave: 'Clave12345x' })).status, 200);
  assert.equal((await req('GET', '/api/estado')).data.autenticado, true);
});

test('protección CSRF', async () => {
  const r = await fetch(base + '/api/r/terceros', { method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body: '{"nombre":"x"}' });
  assert.equal(r.status, 403);
  const r2 = await req('POST', '/api/r/terceros', { nombre: 'x', tipo: 'Cliente' }, { Origin: 'http://malicioso.example' });
  assert.equal(r2.status, 403);
});

test('cobro pagado genera ingreso contable', async () => {
  const t = await req('POST', '/api/r/terceros', { nombre: 'Cliente SAS', tipo: 'Cliente', identificacion: '800' });
  assert.equal(t.status, 200);
  const f = await req('POST', '/api/r/facturas', { fecha: '2026-11-01', tercero_id: t.data.id, concepto: 'Desarrollo', subtotal: 1000000, iva_pct: '19', estado: 'Pendiente' });
  assert.equal(f.data.total, 1190000);
  assert.match(f.data.numero, /^CC-0001$/);
  const p = await req('PUT', `/api/r/facturas/${f.data.id}`, { estado: 'Pagada' });
  assert.ok(p.data.movimiento_id);
  const movs = (await req('GET', '/api/r/movimientos')).data;
  assert.equal(movs.length, 1);
  assert.equal(movs[0].valor, 1000000);
  assert.equal(movs[0].iva, 190000);
  await req('PUT', `/api/r/facturas/${f.data.id}`, { estado: 'Pendiente' });
  assert.equal((await req('GET', '/api/r/movimientos')).data.length, 0);
});

test('validaciones', async () => {
  assert.equal((await req('POST', '/api/r/movimientos', { fecha: 'ayer', tipo: 'Ingreso', categoria: '4250 Otros ingresos', descripcion: 'x', valor: 1 })).status, 400);
  assert.equal((await req('POST', '/api/r/movimientos', { fecha: '2026-11-01', tipo: 'Robo', categoria: '4250 Otros ingresos', descripcion: 'x', valor: 1 })).status, 400);
  assert.equal((await req('POST', '/api/r/empleados', { nombres: 'A' })).status, 400);
});

test('nómina: cálculo y pago', async () => {
  const e = await req('POST', '/api/r/empleados', { nombres: 'Ana', apellidos: 'Gómez', documento: '123', cargo: 'Programadora', fecha_ingreso: '2025-01-01', tipo_contrato: 'Término indefinido', salario: 1750905, riesgo_arl: '1', estado: 'Activo' });
  assert.equal(e.status, 200);
  await req('POST', '/api/r/empleados', { nombres: 'Carlos', apellidos: 'Ruiz', documento: '456', cargo: 'Artista', fecha_ingreso: '2025-01-01', tipo_contrato: 'Prestación de servicios', salario: 3000000, estado: 'Activo' });
  const n = await req('POST', '/api/nomina', { periodo: '2026-11' });
  assert.equal(n.status, 200);
  assert.equal(n.data.detalle.length, 1, 'el contratista no entra a nómina');
  const c = n.data.detalle[0].calculo;
  assert.equal(c.basico, 1750905);
  assert.equal(c.auxTransporte, 249095);
  assert.equal(c.salud, Math.round(1750905 * 0.04));
  assert.equal(c.neto, 1750905 + 249095 - 2 * Math.round(1750905 * 0.04));
  assert.equal(c.aportesEmpresa.salud, 0, 'exonerado');
  const nov = await req('PUT', `/api/nomina/${n.data.id}/detalle/${n.data.detalle[0].id}`, { dias: 15, he_diurnas: 10 });
  assert.equal(nov.data.detalle[0].calculo.dias, 15);
  assert.ok(nov.data.detalle[0].calculo.extras > 0);
  const pg = await req('POST', `/api/nomina/${n.data.id}/pagar`, {});
  assert.equal(pg.data.estado, 'Pagada');
  const movs = (await req('GET', '/api/r/movimientos')).data.filter((m) => m.origen === 'nomina');
  assert.equal(movs.length, 2);
  await req('POST', `/api/nomina/${n.data.id}/reabrir`, {});
  assert.equal((await req('GET', '/api/r/movimientos')).data.filter((m) => m.origen === 'nomina').length, 0);
});

test('documentos: subir y descargar', async () => {
  const datos = Buffer.from('hola mundo').toString('base64');
  const d = await req('POST', '/api/documentos/subir', { nombre: 'RUT', categoria: 'RUT / DIAN', archivo: { nombre: 'rut ñ.pdf', tipo: 'application/pdf', datos } });
  assert.equal(d.status, 200);
  assert.equal(d.data.archivo_ruta, undefined, 'la ruta interna no se expone');
  const r = await fetch(`${base}/api/documentos/${d.data.id}/descargar`, { headers: { Cookie: cookie } });
  assert.equal(await r.text(), 'hola mundo');
  assert.match(r.headers.get('content-disposition'), /attachment/);
  assert.equal((await req('DELETE', `/api/r/documentos/${d.data.id}`)).status, 200);
});

test('usuarios por empleado con permisos', async () => {
  const admin = cookie;
  const emp = (await req('GET', '/api/r/empleados')).data[0];
  // Crear usuario de marketing vinculado a un empleado
  assert.equal((await req('POST', '/api/usuarios', { nombre: 'Ana', usuario: 'Ana Gómez', rol: 'Marketing', clave: 'Temporal123x' })).status, 400, 'usuario con espacios');
  assert.equal((await req('POST', '/api/usuarios', { nombre: 'Ana', usuario: 'admin', rol: 'Marketing', clave: 'Temporal123x' })).status, 400, 'admin reservado');
  const u = await req('POST', '/api/usuarios', { nombre: 'Ana Gómez', usuario: 'ana.gomez', empleado_id: emp.id, rol: 'Marketing', clave: 'Temporal123x' });
  assert.equal(u.status, 200);
  assert.equal(u.data.hash, undefined, 'no expone el hash');
  assert.equal(u.data.permisos.nomina, 'no');
  assert.equal((await req('POST', '/api/usuarios', { nombre: 'Otra', usuario: 'ana.gomez', rol: 'Marketing', clave: 'Temporal123x' })).status, 409);

  // Entrar como Ana: número + usuario + contraseña
  cookie = '';
  assert.equal((await req('POST', '/api/login', { numero: '901234567-8', usuario: 'ana.gomez', clave: 'mala' })).status, 401);
  const l = await req('POST', '/api/login', { numero: '901234567-8', usuario: 'ANA.GOMEZ', clave: 'Temporal123x' });
  assert.equal(l.status, 200);
  assert.equal(l.data.debe_cambiar, true);
  assert.equal((await req('GET', '/api/r/campanas')).status, 403, 'bloqueado hasta cambiar la clave temporal');
  assert.equal((await req('POST', '/api/cambiar-clave', { actual: 'Temporal123x', nueva: 'MiClaveAna2026' })).status, 200);
  const yo = (await req('GET', '/api/yo')).data;
  assert.equal(yo.usuario, 'ana.gomez');
  assert.equal(yo.debe_cambiar, false);

  // Permisos: marketing sí, nómina/contabilidad/usuarios/respaldo no
  assert.equal((await req('GET', '/api/r/campanas')).status, 200);
  assert.equal((await req('POST', '/api/r/campanas', { nombre: 'Lanzamiento' })).status, 200);
  assert.equal((await req('GET', '/api/r/terceros')).status, 200, 'terceros: ver');
  assert.equal((await req('POST', '/api/r/terceros', { nombre: 'X', tipo: 'Cliente' })).status, 403, 'terceros: no editar');
  assert.equal((await req('GET', '/api/nomina')).status, 403);
  assert.equal((await req('GET', '/api/r/movimientos')).status, 403);
  assert.equal((await req('GET', '/api/r/empleados')).status, 403);
  assert.equal((await req('GET', '/api/usuarios')).status, 403);
  assert.equal((await req('GET', '/api/respaldo')).status, 403);
  assert.equal((await req('PUT', '/api/config', { razon_social: 'X' })).status, 403);
  assert.equal((await req('POST', '/api/cambiar-clave', { actual: 'MiClaveAna2026', numero: '999999' })).status, 403, 'no cambia el NIT');
  // Selectores: solo nombres, sin cédula
  const op = (await req('GET', '/api/opciones/empleados')).data;
  assert.deepEqual(Object.keys(op[0]).sort(), ['apellidos', 'id', 'nombres']);
  assert.equal((await req('GET', '/api/opciones/empleados?para=contratos')).status, 403, 'datos extra exigen permiso del módulo');
  // Bitácora: solo su actividad
  const seg = (await req('GET', '/api/seguridad')).data;
  assert.equal(seg.admin, false);
  assert.ok(seg.bitacora.every((b) => b.usuario === 'ana.gomez'));
  const anaCookie = cookie;

  // El administrador desactiva a Ana: su sesión deja de valer
  cookie = admin;
  const bit = (await req('GET', '/api/seguridad')).data.bitacora;
  assert.ok(bit.some((b) => b.usuario === 'ana.gomez' && b.detalle.includes('campanas')), 'la bitácora registra quién creó la campaña');
  assert.equal((await req('PUT', `/api/usuarios/${u.data.id}`, { activo: false })).status, 200);
  cookie = anaCookie;
  assert.equal((await req('GET', '/api/r/campanas')).status, 401);
  assert.equal((await req('POST', '/api/login', { numero: '901234567-8', usuario: 'ana.gomez', clave: 'MiClaveAna2026' })).status, 401);

  // Rol personalizado: solo ver contratos
  cookie = admin;
  const p = await req('POST', '/api/usuarios', { nombre: 'Abogado', usuario: 'abogado', rol: 'Personalizado', permisos: { contratos: 'ver', nomina: 'superpoder' }, clave: 'Temporal123x' });
  assert.equal(p.data.permisos.contratos, 'ver');
  assert.equal(p.data.permisos.nomina, 'no', 'nivel inválido se ignora');
  cookie = '';
  await req('POST', '/api/login', { numero: '901234567-8', usuario: 'abogado', clave: 'Temporal123x' });
  await req('POST', '/api/cambiar-clave', { actual: 'Temporal123x', nueva: 'Abogado2026x' });
  assert.equal((await req('GET', '/api/r/contratos')).status, 200);
  assert.equal((await req('GET', '/api/opciones/empleados?para=contratos')).status, 200);
  assert.equal((await req('POST', '/api/r/contratos', { titulo: 'x', tipo: 'Otro', fecha_inicio: '2026-01-01' })).status, 403);
  cookie = admin;
});

test('integración con Unity Ads', async () => {
  // Sin configurar
  assert.equal((await req('POST', '/api/integraciones/unity/sincronizar', {})).status, 502);
  assert.equal((await req('PUT', '/api/integraciones', { unity_org_id: 'org 1; DROP' })).status, 400);
  // Clave equivocada → mensaje claro, sin filtrar la clave
  await req('PUT', '/api/integraciones', { unity_org_id: '99887766', unity_clave: 'clave-equivocada-000000', trm: 4000 });
  const mal = await req('POST', '/api/integraciones/unity/sincronizar', {});
  assert.equal(mal.status, 502);
  assert.match(mal.data.error, /rechazó la clave/);
  assert.ok(!JSON.stringify(mal.data).includes('clave-equivocada'));
  // Clave correcta
  await req('PUT', '/api/integraciones', { unity_clave: 'clave-de-prueba-1234567890' });
  const ok = await req('POST', '/api/integraciones/unity/sincronizar', {});
  assert.equal(ok.status, 200);
  assert.equal(ok.data.filas, 2);
  assert.equal(ultimaConsultaUnity.path, '/stats/v1/operate/organizations/99887766');
  assert.equal(ultimaConsultaUnity.params.groupBy, 'game,platform');
  assert.equal(ultimaConsultaUnity.params.scale, 'day');
  assert.match(ultimaConsultaUnity.params.fields, /revenue_sum/);
  const est = (await req('GET', '/api/unity/estadisticas?dias=7')).data;
  assert.equal(est.filas.length, 2);
  assert.equal(est.filas.reduce((a, f) => a + f.ingresos, 0), 14);
  // Movimiento contable estimado del mes (14 USD × 4000) y sin duplicar al resincronizar
  await req('POST', '/api/integraciones/unity/sincronizar', {});
  const movs = (await req('GET', '/api/r/movimientos')).data.filter((m) => m.origen === 'unity');
  assert.equal(movs.length, 1);
  assert.equal(movs[0].valor, 56000);
  assert.equal(movs[0].comprobante, `UNITY-${mesISO}`);
  // La clave nunca sale del servidor
  const todo = JSON.stringify([(await req('GET', '/api/config')).data, (await req('GET', '/api/integraciones')).data]);
  assert.ok(!todo.includes('clave-de-prueba'));
  const resp = await fetch(base + '/api/respaldo', { headers: { Cookie: cookie } });
  assert.ok(!(await resp.text()).includes('clave-de-prueba'));
  assert.equal((await req('GET', '/api/integraciones')).data.unity.clave_configurada, true);
});

test('cambio de contraseña y bloqueo por intentos', async () => {
  assert.equal((await req('POST', '/api/cambiar-clave', { actual: 'mala', nueva: 'OtraClave999' })).status, 400);
  assert.equal((await req('POST', '/api/cambiar-clave', { actual: 'Clave12345x', nueva: 'OtraClave999' })).status, 200);
  cookie = '';
  for (let i = 0; i < 5; i++) await req('POST', '/api/login', { numero: '901234567-8', clave: 'Clave12345x' });
  const r = await req('POST', '/api/login', { numero: '901234567-8', clave: 'OtraClave999' });
  assert.equal(r.status, 429, 'bloqueado tras 5 intentos aunque la clave sea correcta');
});

test('cabeceras de seguridad y archivos estáticos', async () => {
  const r = await fetch(base + '/');
  assert.match(r.headers.get('content-security-policy'), /script-src 'self'/);
  assert.equal(r.headers.get('x-frame-options'), 'DENY');
  assert.equal((await fetch(base + '/../server.js')).status, 404);
  assert.equal((await fetch(base + '/%2e%2e/server.js')).status, 404);
});
