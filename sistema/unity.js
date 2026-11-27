'use strict';
// Conexión con la API de estadísticas de monetización de Unity Ads.
// Descarga ingresos, vistas e inicios de anuncios por día, juego y plataforma.
// La clave se guarda en la tabla "secretos" (nunca se envía al navegador ni a los respaldos).

const UNITY_API = process.env.UNITY_API_URL || 'https://monetization.api.unity.com';
const CAMPOS = ['adrequest_count', 'available_sum', 'revenue_sum', 'start_count', 'view_count'];

// CSV sencillo con soporte de comillas
function parsearCSV(texto) {
  const filas = [];
  let fila = [], campo = '', comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (comillas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') comillas = false;
      else campo += c;
    } else if (c === '"') comillas = true;
    else if (c === ',') { fila.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      fila.push(campo); campo = '';
      if (fila.some((x) => x !== '')) filas.push(fila);
      fila = [];
    } else campo += c;
  }
  fila.push(campo);
  if (fila.some((x) => x !== '')) filas.push(fila);
  return filas;
}

// Convierte el CSV de Unity en filas {fecha, game_id, plataforma, ingresos, vistas, inicios, solicitudes, disponibles}
function interpretar(texto) {
  const filas = parsearCSV(String(texto || '').replace(/^﻿/, ''));
  if (!filas.length) return [];
  const cab = filas[0].map((h) => h.trim().toLowerCase());
  const col = (...nombres) => { for (const n of nombres) { const i = cab.indexOf(n); if (i >= 0) return i; } return -1; };
  const busca = (re) => cab.findIndex((h) => re.test(h));
  const iFecha = col('timestamp', 'date', 'day') >= 0 ? col('timestamp', 'date', 'day') : busca(/time|date/);
  const iJuego = col('source_game_id', 'game_id', 'game') >= 0 ? col('source_game_id', 'game_id', 'game') : busca(/game/);
  const iPlat = col('platform');
  const idx = Object.fromEntries(CAMPOS.map((c) => [c, col(c)]));
  if (iFecha < 0 || idx.revenue_sum < 0) throw new Error('Unity respondió en un formato inesperado (faltan las columnas de fecha o ingresos).');
  const n = (f, i) => (i >= 0 ? Number(f[i]) || 0 : 0);
  return filas.slice(1).map((f) => ({
    fecha: String(f[iFecha] || '').slice(0, 10),
    game_id: iJuego >= 0 ? String(f[iJuego] || '').trim() : '',
    plataforma: iPlat >= 0 ? String(f[iPlat] || '').trim().toLowerCase() : '',
    ingresos: n(f, idx.revenue_sum),
    vistas: Math.round(n(f, idx.view_count)),
    inicios: Math.round(n(f, idx.start_count)),
    solicitudes: Math.round(n(f, idx.adrequest_count)),
    disponibles: Math.round(n(f, idx.available_sum)),
  })).filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.fecha));
}

async function descargar({ orgId, clave, dias = 35 }) {
  const fin = new Date();
  const ini = new Date(Date.UTC(fin.getUTCFullYear(), fin.getUTCMonth(), fin.getUTCDate() - dias));
  const url = new URL(`${UNITY_API}/stats/v1/operate/organizations/${encodeURIComponent(orgId)}`);
  url.searchParams.set('fields', CAMPOS.join(','));
  url.searchParams.set('groupBy', 'game,platform');
  url.searchParams.set('scale', 'day');
  url.searchParams.set('start', ini.toISOString().slice(0, 19) + 'Z');
  url.searchParams.set('end', fin.toISOString().slice(0, 19) + 'Z');
  url.searchParams.set('apikey', clave);
  let r;
  try {
    r = await fetch(url, { headers: { Accept: 'text/csv' }, signal: AbortSignal.timeout(30000) });
  } catch (e) {
    // Nunca se incluye la URL en el mensaje: lleva la clave.
    throw new Error(`No se pudo conectar con Unity (${e.name === 'TimeoutError' ? 'tiempo agotado' : 'sin conexión a internet o servidor no disponible'}).`);
  }
  const cuerpo = await r.text();
  if (r.status === 401 || r.status === 403) throw new Error('Unity rechazó la clave o el ID de organización. Revise que la clave sea la de «Monetization Stats API» y el Organization core ID sea correcto.');
  if (r.status === 404) throw new Error('Unity no encontró la organización. Revise el Organization core ID.');
  if (r.status === 429) throw new Error('Unity limitó las consultas por exceso de solicitudes. Se reintentará en la próxima hora.');
  if (!r.ok) throw new Error(`Unity respondió con error ${r.status}.`);
  return interpretar(cuerpo);
}

module.exports = { descargar, interpretar, parsearCSV };
