'use strict';
/* IMPULSO CAPITAL CIUDADANO S.A.S. — Sistema de gestión (interfaz) */
(() => {
  // ───────────────────────── Utilidades ─────────────────────────
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  const NUM = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });
  const money = (v) => COP.format(Number(v) || 0);
  const USD = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const usd = (v) => USD.format(Number(v) || 0).replace('US$', 'US$ ');
  const numf = (v) => (v === null || v === undefined || v === '' ? '' : NUM.format(Number(v)));
  const pct = (v) => (Number.isFinite(v) ? NUM.format(Math.round(v * 1000) / 10) + ' %' : '—');
  const hoy = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
  const mesActual = () => hoy().slice(0, 7);
  const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const MES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const fdate = (d) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '');
  const flarga = (d) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '________');
  const fperiodo = (p) => { const [y, m] = p.split('-'); return `${MESES[Number(m) - 1]} ${y}`; };
  const diasHasta = (d) => Math.round((new Date(d + 'T00:00:00') - new Date(hoy() + 'T00:00:00')) / 864e5);
  const fts = (ms) => new Date(ms).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
  const sum = (arr, k) => arr.reduce((a, r) => a + (Number(typeof k === 'function' ? k(r) : r[k]) || 0), 0);

  const S = { schema: null, config: {}, cache: {}, opc: {}, yo: null, idle: null };
  const MOD = { movimientos: 'contabilidad', facturas: 'facturas', terceros: 'terceros', empleados: 'empleados', contratos: 'contratos', documentos: 'documentos', juegos: 'juegos', campanas: 'marketing', publicaciones: 'marketing', tareas: 'tareas' };
  const NIV = { no: 0, ver: 1, editar: 2 };
  const puede = (mod, nivel = 'ver') => !!S.yo && (S.yo.admin || (NIV[S.yo.permisos[mod]] || 0) >= NIV[nivel]);

  async function api(method, url, body) {
    const opts = { method, headers: { 'X-ICC': '1' }, credentials: 'same-origin' };
    if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    let r;
    try { r = await fetch(url, opts); } catch { throw new Error('No hay conexión con el servidor.'); }
    let data = null;
    try { data = await r.json(); } catch { /* sin cuerpo */ }
    if (r.status === 401 && !['/api/login', '/api/instalar'].includes(url)) {
      pantallaAcceso('Su sesión terminó. Inicie sesión de nuevo.');
      throw new Error('Sesión expirada');
    }
    if (!r.ok) throw new Error((data && data.error) || `Error ${r.status}`);
    return data;
  }
  const cargar = async (...names) => {
    await Promise.all(names.map(async (n) => { S.cache[n] = await api('GET', '/api/r/' + n); }));
  };
  // Listas para selectores (id + nombre). "para" pide los datos extra que ese módulo necesita.
  const cargarOpc = async (para, ...names) => {
    await Promise.all(names.map(async (n) => { S.opc[n] = await api('GET', `/api/opciones/${n}?para=${para}`); }));
  };

  function toast(msg, err) {
    const t = document.createElement('div');
    t.className = 'toast' + (err ? ' err' : '');
    t.textContent = msg;
    $('#toast-root').appendChild(t);
    setTimeout(() => t.remove(), err ? 6000 : 3000);
  }
  const fallo = (e) => { if (e.message !== 'Sesión expirada') toast(e.message, true); };

  function modal(titulo, cuerpo, { pie = '', tam = '' } = {}) {
    const root = $('#modal-root');
    root.innerHTML = `<div class="modal-bg"><div class="modal ${tam}" role="dialog" aria-modal="true" aria-label="${esc(titulo)}">
      <header><h2>${esc(titulo)}</h2><button class="link" data-cerrar aria-label="Cerrar">✕</button></header>
      <div class="body">${cuerpo}</div>${pie ? `<footer>${pie}</footer>` : ''}</div></div>`;
    const bg = $('.modal-bg', root);
    const cerrar = () => { root.innerHTML = ''; document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') cerrar(); };
    document.addEventListener('keydown', onKey);
    bg.addEventListener('mousedown', (e) => { if (e.target === bg) cerrar(); });
    $$('[data-cerrar]', root).forEach((b) => b.addEventListener('click', cerrar));
    const primero = $('input, select, textarea', root);
    if (primero) setTimeout(() => primero.focus(), 30);
    return { el: $('.modal', root), cerrar };
  }
  function confirmar(texto, { ok = 'Eliminar', peligro = true } = {}) {
    return new Promise((resolve) => {
      const m = modal('Confirmar', `<p>${esc(texto)}</p>`, { tam: 'sm', pie: `<button data-cerrar>Cancelar</button><button class="${peligro ? 'danger' : 'primary'}" id="cf-ok">${esc(ok)}</button>` });
      $('#cf-ok', m.el).addEventListener('click', () => { m.cerrar(); resolve(true); });
      $$('[data-cerrar]', m.el).forEach((b) => b.addEventListener('click', () => resolve(false)));
    });
  }

  function imprimir(html) {
    $('#print-area').innerHTML = `<div class="doc">${html}</div>`;
    setTimeout(() => window.print(), 50);
  }
  function vistaPrevia(titulo, html) {
    const m = modal(titulo, `<div class="preview"><div class="doc">${html}</div></div>
      <p class="small muted">Puede editar el texto antes de imprimir haciendo clic sobre él. Para guardarlo como PDF, elija "Guardar como PDF" en la ventana de impresión.</p>`,
      { pie: '<button data-cerrar>Cerrar</button><button class="primary" id="vp-print">🖨️ Imprimir / PDF</button>' });
    const doc = $('.preview .doc', m.el);
    doc.contentEditable = 'true';
    $('#vp-print', m.el).addEventListener('click', () => imprimir(doc.innerHTML));
  }

  function descargarArchivo(nombre, contenido, tipo) {
    const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
    const a = document.createElement('a');
    a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function csv(nombre, cabeceras, filas) {
    const q = (v) => { const s = String(v ?? ''); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const txt = '﻿' + [cabeceras, ...filas].map((f) => f.map(q).join(';')).join('\r\n');
    descargarArchivo(nombre, txt, 'text/csv;charset=utf-8');
  }

  // ───────────────────────── Esquema y formato ─────────────────────────
  const def = (n) => S.schema[n];
  const titulo = (n, row) => (row ? def(n).title.map((k) => row[k]).filter(Boolean).join(' ') : '');
  const refLabel = (n, id) => { if (!id) return ''; const r = (S.opc[n] || S.cache[n] || []).find((x) => x.id === id); return r ? titulo(n, r) : `#${id}`; };
  const COLOR_ESTADO = {
    ok: ['Activo', 'Vigente', 'Pagada', 'Publicado', 'Publicada', 'Hecha', 'Activa', 'Ingreso', 'Mantenimiento'],
    warn: ['Pendiente', 'Borrador', 'En firma', 'Vacaciones', 'Pausada', 'En curso', 'Programada', 'Beta / pruebas', 'Media', 'Incapacidad'],
    info: ['Planeada', 'Idea', 'En producción', 'En desarrollo', 'Preproducción', 'Idea / concepto', 'Baja'],
    bad: ['Retirado', 'Vencido', 'Anulada', 'Gasto', 'Alta', 'Descontinuado'],
  };
  function badge(v) {
    if (!v) return '';
    const c = Object.keys(COLOR_ESTADO).find((k) => COLOR_ESTADO[k].includes(v)) || '';
    return `<span class="badge ${c}">${esc(v)}</span>`;
  }
  const CAMPOS_VENCE = ['fecha_fin', 'fecha_vencimiento', 'fecha_limite', 'vencimiento'];
  const CERRADO = ['Terminado', 'Hecha', 'Pagada', 'Anulada', 'Vencido'];
  function venceBadge(fecha, row) {
    if (!fecha || CERRADO.includes(row.estado)) return '';
    const d = diasHasta(fecha);
    if (d < 0) return ` <span class="badge bad">venció hace ${-d} d</span>`;
    if (d <= 30) return ` <span class="badge warn">${d === 0 ? 'hoy' : `en ${d} d`}</span>`;
    return '';
  }
  function celda(n, f, row) {
    const v = row[f.k];
    switch (f.type) {
      case 'money': return money(v);
      case 'int': case 'number': return esc(numf(v));
      case 'date': return esc(fdate(v)) + (CAMPOS_VENCE.includes(f.k) ? venceBadge(v, row) : '');
      case 'bool': return v ? 'Sí' : 'No';
      case 'ref': return esc(refLabel(f.ref, v));
      case 'url': return v ? `<a href="${esc(v)}" target="_blank" rel="noopener noreferrer">Abrir ↗</a>` : '';
      case 'select': return ['estado', 'tipo', 'prioridad'].includes(f.k) ? badge(v) : esc(v);
      default: return esc(v);
    }
  }
  const esNum = (f) => ['money', 'int', 'number'].includes(f.type);
  const textoPlano = (f, row) => {
    const v = row[f.k];
    if (f.type === 'ref') return refLabel(f.ref, v);
    if (f.type === 'bool') return v ? 'Sí' : 'No';
    return v ?? '';
  };

  // ───────────────────────── Formularios genéricos ─────────────────────────
  function opcionesSelect(f, val, tipoMov) {
    let opts = f.options;
    if (f.groups && tipoMov && f.groups[tipoMov]) opts = f.groups[tipoMov];
    const vacia = `<option value="">— Seleccione —</option>`;
    return vacia + opts.map((o) => `<option ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('');
  }
  function campo(n, f, val, row) {
    const req = f.required ? ' <span class="req">*</span>' : '';
    const wide = f.type === 'textarea' ? ' wide' : '';
    const nm = `name="${f.k}" ${f.required ? 'required' : ''}`;
    let input;
    switch (f.type) {
      case 'bool': return `<label class="check"><input type="checkbox" name="${f.k}" ${val ? 'checked' : ''}> ${esc(f.label)}</label>`;
      case 'select': input = `<select ${nm}>${opcionesSelect(f, val, n === 'movimientos' ? row.tipo : null)}</select>`; break;
      case 'ref': {
        const lista = S.opc[f.ref] || [];
        input = `<select ${nm}><option value="">— Ninguno —</option>${lista.map((r) => `<option value="${r.id}" ${r.id === val ? 'selected' : ''}>${esc(titulo(f.ref, r))}</option>`).join('')}</select>`;
        break;
      }
      case 'textarea': input = `<textarea ${nm}>${esc(val)}</textarea>`; break;
      case 'money': input = `<input type="number" step="any" min="0" inputmode="decimal" ${nm} value="${esc(val)}">`; break;
      case 'int': input = `<input type="number" step="1" min="0" ${nm} value="${esc(val)}">`; break;
      case 'number': input = `<input type="number" step="any" ${nm} value="${esc(val)}">`; break;
      case 'date': input = `<input type="date" ${nm} value="${esc(val)}">`; break;
      case 'email': input = `<input type="email" ${nm} value="${esc(val)}" autocomplete="off">`; break;
      case 'tel': input = `<input type="tel" ${nm} value="${esc(val)}">`; break;
      case 'url': input = `<input type="url" ${nm} value="${esc(val)}" placeholder="https://">`; break;
      default: input = `<input type="text" ${nm} value="${esc(val)}" maxlength="300">`;
    }
    return `<label class="${wide}"><span>${esc(f.label)}${req}</span>${input}</label>`;
  }
  function leerFormulario(form, fields) {
    const out = {};
    for (const f of fields) {
      const el = form.elements[f.k];
      if (!el) continue;
      out[f.k] = f.type === 'bool' ? el.checked : el.value === '' ? null : el.value;
    }
    return out;
  }
  async function abrirFormulario(n, row, alGuardar, presets = {}) {
    const d = def(n);
    const refs = [...new Set(d.fields.filter((f) => f.type === 'ref').map((f) => f.ref))];
    try { await cargarOpc(n, ...refs); } catch (e) { return fallo(e); }
    const datos = row ? { ...row } : {};
    if (!row) for (const f of d.fields) if (f.def !== undefined) datos[f.k] = f.def === '@hoy' ? hoy() : f.def;
    Object.assign(datos, presets);
    const fields = d.fields.filter((f) => !f.sys);
    const m = modal(row ? `Editar ${d.singular}` : `Nuevo ${d.singular}`,
      `<form class="form-grid" id="frm" novalidate>${fields.map((f) => campo(n, f, datos[f.k], datos)).join('')}</form>`,
      { pie: '<button data-cerrar>Cancelar</button><button class="primary" id="frm-ok">Guardar</button>' });
    const form = $('#frm', m.el);
    if (n === 'movimientos') {
      form.elements.tipo.addEventListener('change', (e) => {
        const f = d.fields.find((x) => x.k === 'categoria');
        form.elements.categoria.innerHTML = opcionesSelect(f, form.elements.categoria.value, e.target.value);
      });
    }
    const guardar = async () => {
      const faltan = fields.filter((f) => f.required && f.type !== 'bool' && !form.elements[f.k].value);
      if (faltan.length) { toast(`Complete: ${faltan.map((f) => f.label).join(', ')}`, true); form.elements[faltan[0].k].focus(); return; }
      const body = leerFormulario(form, fields);
      const btn = $('#frm-ok', m.el); btn.disabled = true;
      try {
        const res = row ? await api('PUT', `/api/r/${n}/${row.id}`, body) : await api('POST', `/api/r/${n}`, body);
        m.cerrar(); toast('Guardado correctamente');
        alGuardar && alGuardar(res);
      } catch (e) { fallo(e); btn.disabled = false; }
    };
    $('#frm-ok', m.el).addEventListener('click', guardar);
    form.addEventListener('submit', (e) => { e.preventDefault(); guardar(); });
  }
  async function eliminar(n, row, alBorrar) {
    if (!(await confirmar(`¿Eliminar ${def(n).singular} "${titulo(n, row) || '#' + row.id}"? Esta acción no se puede deshacer.`))) return;
    try { await api('DELETE', `/api/r/${n}/${row.id}`); toast('Eliminado'); alBorrar && alBorrar(); } catch (e) { fallo(e); }
  }

  // ───────────────────────── Listado genérico ─────────────────────────
  // opts: { extraCols:[{label, html(row), num, csv(row)}], acciones:[{label, fn(row)}], filtrar(rows, el), resumen(rows), toolbarExtra, alNuevo, sinNuevo }
  async function vistaRecurso(el, n, opts = {}) {
    const d = def(n);
    const refs = [...new Set(d.fields.filter((f) => f.type === 'ref').map((f) => f.ref))];
    await Promise.all([cargar(n), cargarOpc(n, ...refs)]);
    const editable = puede(MOD[n], 'editar');
    const acciones = (opts.acciones || []).filter((a) => editable || !a.edita);
    const st = { q: '', f: {} };
    const filtrables = d.fields.filter((f) => f.filter);
    const cols = d.fields.filter((f) => f.list);
    const recargar = () => vistaRecurso(el, n, opts);

    el.innerHTML = `
      <div class="toolbar">
        <input type="search" id="q" placeholder="Buscar en ${esc(d.label.toLowerCase())}…" aria-label="Buscar">
        ${filtrables.map((f) => `<select data-filtro="${f.k}" aria-label="${esc(f.label)}"><option value="">${esc(f.label)}: todos</option>${f.options.map((o) => `<option>${esc(o)}</option>`).join('')}</select>`).join('')}
        ${opts.toolbarExtra || ''}
        ${editable ? '' : '<span class="badge info">👁️ Solo lectura</span>'}
        <span class="grow"></span>
        <button id="exp">⬇️ Exportar</button>
        ${d.noCreate || opts.sinNuevo || !editable ? '' : `<button class="primary" id="nuevo">＋ Nuevo ${esc(d.singular)}</button>`}
      </div>
      <div id="resumen"></div>
      <div class="tabla-wrap" id="tabla"></div>`;

    const filas = () => {
      let rows = S.cache[n];
      for (const [k, v] of Object.entries(st.f)) if (v) rows = rows.filter((r) => String(r[k] ?? '') === v);
      if (opts.filtrar) rows = opts.filtrar(rows, el);
      if (st.q) {
        const q = st.q.toLowerCase();
        rows = rows.filter((r) => d.fields.some((f) => String(textoPlano(f, r)).toLowerCase().includes(q)));
      }
      return rows;
    };
    const pintar = () => {
      const rows = filas();
      $('#resumen', el).innerHTML = opts.resumen ? opts.resumen(rows) : '';
      if (!rows.length) {
        $('#tabla', el).innerHTML = `<div class="vacio">${S.cache[n].length ? 'No hay resultados con estos filtros.' : `Aún no hay ${esc(d.label.toLowerCase())}. ${d.noCreate || opts.sinNuevo ? '' : 'Use el botón «Nuevo» para agregar el primero.'}`}</div>`;
        return;
      }
      const ex = opts.extraCols || [];
      $('#tabla', el).innerHTML = `<table><thead><tr>
        ${cols.map((f) => `<th class="${esNum(f) ? 'num' : ''}">${esc(f.label)}</th>`).join('')}
        ${ex.map((c) => `<th class="${c.num ? 'num' : ''}">${esc(c.label)}</th>`).join('')}<th></th></tr></thead>
        <tbody>${rows.map((r) => `<tr data-id="${r.id}">
          ${cols.map((f) => `<td class="${esNum(f) ? 'num' : ''}">${celda(n, f, r)}</td>`).join('')}
          ${ex.map((c) => `<td class="${c.num ? 'num' : ''}">${c.html(r)}</td>`).join('')}
          <td class="acciones">${acciones.map((a, i) => (a.si && !a.si(r) ? '' : `<button class="sm" data-acc="${i}">${esc(a.label)}</button> `)).join('')}
            ${opts.sinEditar || !editable ? '' : '<button class="sm" data-acc="editar" title="Editar">✏️</button>'}
            ${editable ? '<button class="sm danger" data-acc="borrar" title="Eliminar">🗑️</button>' : ''}</td></tr>`).join('')}</tbody></table>`;
    };
    pintar();

    $('#q', el).addEventListener('input', (e) => { st.q = e.target.value.trim(); pintar(); });
    $$('[data-filtro]', el).forEach((s) => s.addEventListener('change', () => { st.f[s.dataset.filtro] = s.value; pintar(); }));
    $$('[data-refiltrar]', el).forEach((s) => s.addEventListener('change', pintar));
    const nuevo = $('#nuevo', el);
    if (nuevo) nuevo.addEventListener('click', () => (opts.alNuevo ? opts.alNuevo(recargar) : abrirFormulario(n, null, recargar)));
    $('#exp', el).addEventListener('click', () => {
      const fs = d.fields.filter((f) => !f.sys || f.list);
      const ex = (opts.extraCols || []).filter((c) => c.csv);
      csv(`${n}-${hoy()}.csv`, [...fs.map((f) => f.label), ...ex.map((c) => c.label)],
        filas().map((r) => [...fs.map((f) => textoPlano(f, r)), ...ex.map((c) => c.csv(r))]));
    });
    $('#tabla', el).addEventListener('click', (e) => {
      const b = e.target.closest('[data-acc]');
      if (!b) return;
      const row = S.cache[n].find((r) => r.id === Number(b.closest('tr').dataset.id));
      const a = b.dataset.acc;
      if (a === 'editar') (opts.alEditar ? opts.alEditar(row, recargar) : abrirFormulario(n, row, recargar));
      else if (a === 'borrar') eliminar(n, row, recargar);
      else acciones[Number(a)].fn(row, recargar);
    });
    if (opts.alMontar) opts.alMontar(el, recargar, editable);
    return { pintar, recargar };
  }

  // ───────────────────────── Acceso / seguridad ─────────────────────────
  async function iniciar() {
    let est;
    try { est = await api('GET', '/api/estado'); } catch (e) {
      $('#app').innerHTML = `<div class="cargando">${esc(e.message)} Verifique que el servidor esté encendido (npm start).</div>`; return;
    }
    if (!est.configurado) return pantallaInstalacion();
    if (!est.autenticado) return pantallaAcceso();
    await entrar();
  }
  const cabeceraAuth = (sub) => `<div class="logo"><img src="logo.svg" alt=""><div><b>IMPULSO CAPITAL CIUDADANO</b><span>${esc(sub)}</span></div></div>`;

  function pantallaInstalacion() {
    $('#app').innerHTML = `<div class="auth"><div class="auth-card">
      ${cabeceraAuth('Configuración inicial del sistema')}
      <p class="small muted">Cree el acceso de su empresa. Con estos datos se ingresará al sistema.</p>
      <form id="f-inst" autocomplete="off">
        <label>Razón social<input name="razon_social" value="IMPULSO CAPITAL CIUDADANO S.A.S." required></label>
        <label>Número de empresa (NIT)<input name="numero" required placeholder="Ej.: 901234567-8" inputmode="text"></label>
        <label>Contraseña<input name="clave" type="password" required autocomplete="new-password" minlength="10"></label>
        <label>Repita la contraseña<input name="clave2" type="password" required autocomplete="new-password"></label>
        <label>Código de instalación<input name="codigo" required inputmode="numeric" placeholder="6 dígitos que aparecen en la consola del servidor"></label>
        <button class="primary full" type="submit">Crear acceso y entrar</button>
      </form>
      <div class="note">🔒 Mínimo 10 caracteres combinando letras y números. La contraseña se guarda cifrada (scrypt); nadie puede verla, ni siquiera desde la base de datos.</div>
    </div></div>`;
    $('#f-inst').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      if (f.clave.value !== f.clave2.value) return toast('Las contraseñas no coinciden', true);
      try {
        await api('POST', '/api/instalar', { razon_social: f.razon_social.value, numero: f.numero.value, clave: f.clave.value, codigo: f.codigo.value });
        toast('¡Sistema configurado!');
        await entrar();
      } catch (err) { fallo(err); }
    });
  }

  function pantallaAcceso(aviso) {
    clearTimeout(S.idle);
    $('#modal-root').innerHTML = '';
    $('#app').innerHTML = `<div class="auth"><div class="auth-card">
      ${cabeceraAuth('Sistema de gestión empresarial')}
      ${aviso ? `<div class="alerta info">${esc(aviso)}</div>` : ''}
      <form id="f-login">
        <label>Número de empresa<input name="numero" required autocomplete="organization" placeholder="NIT de la empresa"></label>
        <label>Usuario<input name="usuario" autocomplete="username" placeholder="Vacío = administrador principal" autocapitalize="none" spellcheck="false"></label>
        <label>Contraseña<input name="clave" type="password" required autocomplete="current-password"></label>
        <label class="check"><input type="checkbox" id="ver"> Mostrar contraseña</label>
        <button class="primary full" type="submit">Ingresar</button>
      </form>
      <div class="note">🔒 Tras 5 intentos fallidos el acceso se bloquea 15 minutos. Todos los accesos quedan registrados en la bitácora de seguridad.</div>
    </div></div>`;
    const f = $('#f-login');
    $('#ver').addEventListener('change', (e) => { f.clave.type = e.target.checked ? 'text' : 'password'; });
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('button', f); btn.disabled = true;
      try { await api('POST', '/api/login', { numero: f.numero.value, usuario: f.usuario.value, clave: f.clave.value }); await entrar(); } catch (err) { fallo(err); btn.disabled = false; f.clave.select(); }
    });
    setTimeout(() => f.numero.focus(), 30);
  }

  function pantallaCambioObligatorio() {
    $('#app').innerHTML = `<div class="auth"><div class="auth-card">
      ${cabeceraAuth('Bienvenido(a), ' + S.yo.nombre)}
      <div class="alerta info">Por seguridad, cambie la contraseña temporal que le dio el administrador. Solo usted conocerá la nueva.</div>
      <form id="f-cc" autocomplete="off">
        <label>Contraseña temporal<input name="actual" type="password" required autocomplete="current-password"></label>
        <label>Nueva contraseña<input name="nueva" type="password" required autocomplete="new-password" minlength="10"></label>
        <label>Repita la nueva contraseña<input name="nueva2" type="password" required autocomplete="new-password"></label>
        <button class="primary full" type="submit">Guardar y entrar</button>
        <button type="button" class="link" id="cc-salir">Cancelar y salir</button>
      </form>
      <div class="note">🔒 Mínimo 10 caracteres combinando letras y números.</div></div></div>`;
    const f = $('#f-cc');
    $('#cc-salir').addEventListener('click', () => salir());
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (f.nueva.value !== f.nueva2.value) return toast('Las contraseñas no coinciden', true);
      try { await api('POST', '/api/cambiar-clave', { actual: f.actual.value, nueva: f.nueva.value }); toast('Contraseña actualizada'); await entrar(); } catch (err) { fallo(err); }
    });
  }

  async function salir(motivo) {
    try { await api('POST', '/api/logout', {}); } catch { /* nada */ }
    S.cache = {}; S.opc = {}; S.yo = null;
    pantallaAcceso(motivo);
  }
  function vigilarInactividad() {
    const reiniciar = () => {
      clearTimeout(S.idle);
      const min = Number(S.config.sesion_minutos) || 30;
      S.idle = setTimeout(() => salir('Se cerró la sesión por inactividad.'), min * 60 * 1000);
    };
    ['mousemove', 'keydown', 'click', 'touchstart'].forEach((ev) => document.addEventListener(ev, reiniciar, { passive: true }));
    reiniciar();
  }

  // ───────────────────────── Layout y rutas ─────────────────────────
  const MENU = [
    ['General', [['panel', '📊', 'Panel principal'], ['tareas', '✅', 'Tareas y obligaciones']]],
    ['Finanzas', [['contabilidad', '📒', 'Contabilidad'], ['facturas', '🧾', 'Facturación y cobros'], ['terceros', '🤝', 'Clientes y proveedores']]],
    ['Talento humano', [['empleados', '👥', 'Empleados'], ['nomina', '💵', 'Nómina'], ['contratos', '📝', 'Contratos']]],
    ['Negocio', [['juegos', '🎮', 'Juegos y proyectos'], ['marketing', '📣', 'Marketing'], ['documentos', '📁', 'Documentos']]],
    ['Sistema', [['usuarios', '👤', 'Usuarios y permisos'], ['configuracion', '⚙️', 'Configuración'], ['seguridad', '🔒', 'Mi cuenta y seguridad']]],
  ];
  // Permiso que necesita cada ruta del menú (seguridad: todos; usuarios: solo administradores)
  const permitida = (ruta) => (ruta === 'seguridad' ? true : ruta === 'usuarios' ? !!(S.yo && S.yo.admin) : puede(ruta));
  const VISTAS = {};
  let entrado = false;

  async function entrar() {
    try {
      S.yo = await api('GET', '/api/yo');
      if (S.yo.debe_cambiar) return pantallaCambioObligatorio();
      [S.schema, S.config] = await Promise.all([api('GET', '/api/esquema'), api('GET', '/api/config')]);
    } catch (e) { return fallo(e); }
    $('#app').innerHTML = `<div class="layout">
      <nav class="side" id="side" aria-label="Menú principal">
        <div class="brand"><img src="logo.svg" alt=""><b>${esc(S.config.razon_social || 'IMPULSO CAPITAL CIUDADANO')}</b></div>
        ${MENU.map(([g, items]) => [g, items.filter(([k]) => permitida(k))]).filter(([, items]) => items.length).map(([g, items]) => `<div class="grupo">${esc(g)}</div>${items.map(([k, ic, l]) => `<a href="#/${k}" data-ruta="${k}"><span class="ic">${ic}</span>${esc(l)}</a>`).join('')}`).join('')}
      </nav>
      <div class="main">
        <div class="topbar"><button class="menu-btn" id="menu-btn" aria-label="Abrir menú">☰</button>
          <div class="titulo" id="titulo"></div>
          <span class="small muted quien" title="${esc(flarga(hoy()))}">👤 <b>${esc(S.yo.nombre)}</b> · ${esc(S.yo.rol)}</span>
          <button id="btn-salir">Cerrar sesión</button></div>
        <div class="content" id="contenido"></div>
      </div></div>`;
    $('#btn-salir').addEventListener('click', () => salir('Sesión cerrada correctamente.'));
    $('#menu-btn').addEventListener('click', () => $('#side').classList.toggle('abierta'));
    if (!entrado) { window.addEventListener('hashchange', router); entrado = true; }
    vigilarInactividad();
    router();
  }

  let refresco = null;
  async function router() {
    const cont = $('#contenido');
    if (!cont) return;
    clearInterval(refresco);
    const [ruta = 'panel', ...resto] = location.hash.replace(/^#\/?/, '').split('/');
    const vista = VISTAS[ruta] ? ruta : 'panel';
    if (!permitida(vista)) {
      $$('#side a').forEach((a) => a.classList.remove('on'));
      $('#titulo').textContent = '🔒 Sin acceso';
      cont.innerHTML = '<div class="card"><h2>🔒 No tiene acceso a este módulo</h2><p class="muted">Si lo necesita para su trabajo, pídale al administrador que le asigne el permiso en «Usuarios y permisos».</p></div>';
      return;
    }
    $$('#side a').forEach((a) => a.classList.toggle('on', a.dataset.ruta === vista));
    $('#side').classList.remove('abierta');
    const item = MENU.flatMap((g) => g[1]).find((i) => i[0] === vista);
    $('#titulo').textContent = item ? `${item[1]}  ${item[2]}` : '';
    cont.innerHTML = '<div class="cargando">Cargando…</div>';
    // El panel se actualiza solo cada minuto (si no hay una ventana abierta)
    if (vista === 'panel') refresco = setInterval(() => { if (!$('#modal-root').innerHTML && document.visibilityState === 'visible') VISTAS.panel(cont).catch(() => {}); }, 60000);
    try { await VISTAS[vista](cont, resto); } catch (e) { fallo(e); if (e.message !== 'Sesión expirada') cont.innerHTML = `<div class="alerta bad">${esc(e.message)}</div>`; }
  }
  function tabs(el, base, lista, actual) {
    return `<div class="tabs">${lista.map(([k, l]) => `<a href="#/${base}/${k}" class="${k === actual ? 'on' : ''}">${esc(l)}</a>`).join('')}</div>`;
  }
  const kpi = (l, v, s = '', cls = '') => `<div class="kpi ${cls}"><div class="l">${esc(l)}</div><div class="v">${v}</div>${s ? `<div class="s">${s}</div>` : ''}</div>`;

  // ───────────────────────── Panel principal ─────────────────────────
  function graficoBarras(meses, series, o = {}) {
    const etq = o.etiqueta || ((m) => MES_CORTO[Number(m.slice(5)) - 1]);
    const nomPer = o.periodo || fperiodo;
    const fmt = o.formato || money;
    // meses: ['2026-01', …]; series: [{nombre, clase, valores[]}]
    const W = 760, H = 250, pl = 64, pb = 28, pt = 12;
    const max = Math.max(1, ...series.flatMap((s) => s.valores));
    const paso = Math.pow(10, Math.floor(Math.log10(max)));
    const tope = Math.ceil(max / paso) * paso;
    const gw = (W - pl - 8) / meses.length;
    const bw = Math.min(22, (gw - 10) / series.length - 2);
    const y = (v) => pt + (H - pt - pb) * (1 - v / tope);
    const compacto = o.eje || ((v) => (v >= 1e9 ? NUM.format(v / 1e9) + ' mil M' : v >= 1e6 ? NUM.format(Math.round(v / 1e5) / 10) + ' M' : v >= 1e3 ? NUM.format(Math.round(v / 100) / 10) + ' k' : NUM.format(v)));
    let svg = '';
    for (let i = 0; i <= 4; i++) {
      const v = (tope / 4) * i;
      svg += `<line class="grid" x1="${pl}" x2="${W - 8}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${pl - 8}" y="${y(v) + 4}" text-anchor="end">${compacto(v)}</text>`;
    }
    meses.forEach((m, i) => {
      const x0 = pl + gw * i + (gw - (bw + 2) * series.length) / 2;
      series.forEach((s, j) => {
        const v = s.valores[i] || 0, h = Math.max(0, H - pb - y(v)), x = x0 + j * (bw + 2), yy = y(v), r = Math.min(4, h);
        const path = h > 0 ? `M${x},${H - pb} V${yy + r} Q${x},${yy} ${x + r},${yy} H${x + bw - r} Q${x + bw},${yy} ${x + bw},${yy + r} V${H - pb} Z` : '';
        svg += `<g class="hit"><rect x="${x - 1}" y="${pt}" width="${bw + 2}" height="${H - pt - pb}" fill="transparent"/>${path ? `<path class="${s.clase}" d="${path}"/>` : ''}<title>${esc(s.nombre)} · ${esc(nomPer(m))}: ${esc(fmt(v))}</title></g>`;
      });
      if (!o.cadaN || i % o.cadaN === 0 || i === meses.length - 1) svg += `<text class="ax" x="${pl + gw * i + gw / 2}" y="${H - 8}" text-anchor="middle">${esc(etq(m))}</text>`;
    });
    svg += `<line class="base" x1="${pl}" x2="${W - 8}" y1="${H - pb}" y2="${H - pb}"/>`;
    return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.titulo || 'Ingresos y gastos por mes')}">${svg}</svg>
      ${series.length > 1 ? `<div class="leg">${series.map((s) => `<span><i class="${s.clase}"></i>${esc(s.nombre)}</span>`).join('')}</div>` : ''}</div>`;
  }
  function ultimosMeses(n) {
    const out = []; const d = new Date(); d.setDate(1);
    for (let i = n - 1; i >= 0; i--) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`); }
    return out;
  }

  // ───────────────────────── Unity Ads ─────────────────────────
  const diasAtras = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
  function resumenUnity(filas) {
    const t = (rows) => ({ usd: sum(rows, 'ingresos'), vistas: sum(rows, 'vistas') });
    const h = hoy(), ay = diasAtras(1), d7 = diasAtras(6), mes = mesActual();
    return { hoy: t(filas.filter((f) => f.fecha === h)), ayer: t(filas.filter((f) => f.fecha === ay)), sem: t(filas.filter((f) => f.fecha >= d7)), mes: t(filas.filter((f) => f.fecha.startsWith(mes))) };
  }
  const ecpm = (x) => (x.vistas ? usd((x.usd / x.vistas) * 1000) : '—');
  const haceCuanto = (iso) => { if (!iso) return 'nunca'; const m = Math.round((Date.now() - Date.parse(iso)) / 60000); return m < 1 ? 'hace un momento' : m < 60 ? `hace ${m} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : fts(Date.parse(iso)); };

  VISTAS.panel = async (el) => {
    const vis = ['movimientos', 'empleados', 'facturas', 'contratos', 'campanas', 'juegos', 'documentos', 'tareas'].filter((n) => puede(MOD[n]));
    await Promise.all([cargar(...vis), puede('facturas') ? cargarOpc('facturas', 'terceros') : null]);
    const nominas = puede('nomina') ? await api('GET', '/api/nomina') : [];
    const uni = puede('juegos') ? await api('GET', '/api/unity/estadisticas?dias=40').catch(() => null) : null;
    const ur = uni && uni.filas.length ? resumenUnity(uni.filas) : null;
    const C = {};
    for (const n of ['movimientos', 'empleados', 'facturas', 'contratos', 'campanas', 'juegos', 'documentos', 'tareas']) C[n] = vis.includes(n) ? S.cache[n] : [];
    const mes = mesActual(), anio = mes.slice(0, 4);
    const movMes = C.movimientos.filter((m) => m.fecha && m.fecha.startsWith(mes));
    const movAnio = C.movimientos.filter((m) => m.fecha && m.fecha.startsWith(anio));
    const ing = (rows) => sum(rows.filter((r) => r.tipo === 'Ingreso'), 'valor');
    const gas = (rows) => sum(rows.filter((r) => r.tipo === 'Gasto'), 'valor');
    const activos = C.empleados.filter((e) => e.estado !== 'Retirado');
    const pendientes = C.facturas.filter((f) => f.estado === 'Pendiente');
    const vencidas = pendientes.filter((f) => f.vencimiento && diasHasta(f.vencimiento) < 0);
    const campActivas = C.campanas.filter((c) => c.estado === 'Activa');
    const ultNom = nominas[0];
    const meses = ultimosMeses(12);
    const serie = (tipo) => meses.map((m) => sum(C.movimientos.filter((r) => r.tipo === tipo && r.fecha && r.fecha.startsWith(m)), 'valor'));

    const alertas = [];
    for (const c of C.contratos) if (c.fecha_fin && !CERRADO.includes(c.estado) && diasHasta(c.fecha_fin) <= 30) alertas.push([c.fecha_fin, `📝 Contrato «${c.titulo}» ${diasHasta(c.fecha_fin) < 0 ? 'vencido' : 'vence'} el ${fdate(c.fecha_fin)}`, '#/contratos']);
    for (const d of C.documentos) if (d.fecha_vencimiento && diasHasta(d.fecha_vencimiento) <= 30) alertas.push([d.fecha_vencimiento, `📁 Documento «${d.nombre}» vence el ${fdate(d.fecha_vencimiento)}`, '#/documentos']);
    for (const f of vencidas) alertas.push([f.vencimiento, `🧾 Cobro ${f.numero} vencido (${money(f.total)}) — ${refLabel('terceros', f.tercero_id)}`, '#/facturas']);
    for (const t of C.tareas) if (t.estado !== 'Hecha' && (!S.yo.empleado_id || !t.responsable_id || t.responsable_id === S.yo.empleado_id) && t.fecha_limite && diasHasta(t.fecha_limite) <= 7) alertas.push([t.fecha_limite, `✅ ${t.titulo} — ${diasHasta(t.fecha_limite) < 0 ? 'atrasada' : 'límite'} ${fdate(t.fecha_limite)}`, '#/tareas']);
    alertas.sort((a, b) => a[0].localeCompare(b[0]));
    const cumple = activos.filter((e) => e.fecha_nacimiento && e.fecha_nacimiento.slice(5, 7) === mes.slice(5));

    el.innerHTML = `
      <h1>Hola, ${esc(S.yo.nombre.split(' ')[0])} 👋</h1><p class="muted">Resumen de ${esc(S.config.razon_social)} · ${esc(fperiodo(mes))}</p>
      ${ur ? `<div class="kpis">
        ${kpi('Unity Ads hoy', usd(ur.hoy.usd), `≈ ${money(ur.hoy.usd * uni.trm)} · ${NUM.format(ur.hoy.vistas)} vistas`, 'ok')}
        ${kpi('Unity Ads ayer', usd(ur.ayer.usd), `eCPM ${ecpm(ur.ayer)}`)}
        ${kpi('Últimos 7 días', usd(ur.sem.usd), `≈ ${money(ur.sem.usd * uni.trm)}`)}
        ${kpi('Este mes', usd(ur.mes.usd), `≈ ${money(ur.mes.usd * uni.trm)} · <a href="#/juegos/unity">ver detalle</a>`)}
      </div><p class="small muted">🔄 Unity Ads: datos de ${esc(haceCuanto(uni.ultima_sync))}. Se actualiza solo cada hora; esta pantalla se refresca cada minuto.</p>` : ''}
      <div class="kpis">
        ${puede('contabilidad') ? kpi('Ingresos del mes', money(ing(movMes)), `Año: ${money(ing(movAnio))}`) + kpi('Gastos del mes', money(gas(movMes)), `Año: ${money(gas(movAnio))}`) + kpi('Resultado del mes', money(ing(movMes) - gas(movMes)), `Año: ${money(ing(movAnio) - gas(movAnio))}`, ing(movMes) - gas(movMes) >= 0 ? 'ok' : 'bad') : ''}
        ${puede('facturas') ? kpi('Cuentas por cobrar', money(sum(pendientes, 'total')), `${pendientes.length} pendiente(s) · ${vencidas.length} vencida(s)`) : ''}
        ${puede('empleados') ? kpi('Empleados activos', String(activos.length), `Salarios base: ${money(sum(activos, 'salario'))}`) : ''}
        ${puede('nomina') ? kpi('Última nómina', ultNom ? money(ultNom.totales.costoTotal) : '—', ultNom ? `${esc(fperiodo(ultNom.periodo))} · ${esc(ultNom.estado)}` : 'Sin liquidar') : ''}
        ${puede('marketing') ? kpi('Marketing activo', money(sum(campActivas, 'gastado')), `${campActivas.length} campaña(s) activa(s)`) : ''}
        ${puede('juegos') ? kpi('Juegos', String(C.juegos.length), `${C.juegos.filter((j) => j.estado === 'Publicado').length} publicado(s)`) : ''}
        ${puede('tareas') ? kpi(S.yo.empleado_id ? 'Mis tareas pendientes' : 'Tareas pendientes', String(C.tareas.filter((t) => t.estado !== 'Hecha' && (!S.yo.empleado_id || t.responsable_id === S.yo.empleado_id)).length)) : ''}
      </div>
      <div class="cols-2">
        ${puede('contabilidad') ? `<div class="card"><h2>Ingresos y gastos · últimos 12 meses</h2>
          ${graficoBarras(meses, [{ nombre: 'Ingresos', clase: 's1', valores: serie('Ingreso') }, { nombre: 'Gastos', clase: 's2', valores: serie('Gasto') }])}
          <p class="small muted">Pase el cursor sobre una barra para ver el valor. El detalle por cuenta está en Contabilidad → Estado de resultados.</p></div>` : ''}
        <div class="card"><h2>⚠️ Alertas y vencimientos</h2>
          ${alertas.length ? `<ul class="lista">${alertas.slice(0, 12).map((a) => `<li><a href="${a[2]}">${esc(a[1])}</a></li>`).join('')}</ul>` : '<p class="muted">Todo al día. No hay vencimientos en los próximos 30 días.</p>'}
          ${cumple.length ? `<h3 style="margin-top:16px">🎂 Cumpleaños del mes</h3><ul class="lista">${cumple.map((e) => `<li><span>${esc(e.nombres)} ${esc(e.apellidos)}</span><span class="muted">${esc(new Date(e.fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long' }))}</span></li>`).join('')}</ul>` : ''}
        </div>
      </div>
      <div class="cols-2">
        ${puede('juegos') ? '' : '<!--'}<div class="card"><h2>🎮 Juegos</h2>${C.juegos.length ? `<ul class="lista">${C.juegos.map((j) => `<li><span><b>${esc(j.nombre)}</b> <span class="muted small">${esc(j.plataforma || '')} ${j.version ? 'v' + esc(j.version) : ''}</span></span><span>${badge(j.estado)}</span></li>`).join('')}</ul>` : '<p class="muted">Sin juegos registrados.</p>'}</div>${puede('juegos') ? '' : '-->'}
        ${puede('contabilidad') ? '' : '<!--'}<div class="card"><h2>📒 Últimos movimientos</h2>${C.movimientos.length ? `<ul class="lista">${C.movimientos.slice(0, 8).map((m) => `<li><span>${badge(m.tipo)} ${esc(m.descripcion)} <span class="muted small">${esc(fdate(m.fecha))}</span></span><span class="num">${money(m.valor)}</span></li>`).join('')}</ul>` : '<p class="muted">Registre ingresos y gastos en Contabilidad.</p>'}</div>${puede('contabilidad') ? '' : '-->'}
      </div>`;
  };

  // ───────────────────────── Contabilidad ─────────────────────────
  VISTAS.contabilidad = async (el, [sub = 'movimientos']) => {
    el.innerHTML = tabs(el, 'contabilidad', [['movimientos', 'Libro de movimientos'], ['resultados', 'Estado de resultados'], ['impuestos', 'IVA y retenciones']], sub) + '<div id="cv"></div>';
    const cv = $('#cv', el);
    if (sub === 'resultados') return estadoResultados(cv);
    if (sub === 'impuestos') return impuestos(cv);
    const ini = mesActual();
    await vistaRecurso(cv, 'movimientos', {
      toolbarExtra: `<label class="check small">Periodo <input type="month" id="per" value="${ini}" data-refiltrar></label><label class="check small"><input type="checkbox" id="todo" data-refiltrar> Todo</label>`,
      filtrar: (rows, c) => {
        const per = $('#per', c), todo = $('#todo', c);
        return todo.checked || !per.value ? rows : rows.filter((r) => r.fecha && r.fecha.startsWith(per.value));
      },
      resumen: (rows) => {
        const i = sum(rows.filter((r) => r.tipo === 'Ingreso'), 'valor'), g = sum(rows.filter((r) => r.tipo === 'Gasto'), 'valor');
        const ivaG = sum(rows.filter((r) => r.tipo === 'Ingreso'), 'iva'), ivaD = sum(rows.filter((r) => r.tipo === 'Gasto'), 'iva');
        return `<div class="kpis">${kpi('Ingresos', money(i))}${kpi('Gastos', money(g))}${kpi('Resultado', money(i - g), '', i - g >= 0 ? 'ok' : 'bad')}${kpi('IVA generado − descontable', money(ivaG - ivaD), `${money(ivaG)} − ${money(ivaD)}`)}</div>`;
      },
      extraCols: [{ label: 'Origen', html: (r) => (r.origen && r.origen !== 'manual' ? `<span class="badge info">${esc(r.origen)}</span>` : '') }],
    });
  };

  async function estadoResultados(el) {
    await cargar('movimientos');
    const anios = [...new Set([mesActual().slice(0, 4), ...S.cache.movimientos.map((m) => (m.fecha || '').slice(0, 4)).filter(Boolean)])].sort().reverse();
    el.innerHTML = `<div class="toolbar"><label class="check">Año <select id="anio">${anios.map((a) => `<option>${a}</option>`).join('')}</select></label><span class="grow"></span><button id="imp">🖨️ Imprimir</button><button id="exp">⬇️ Exportar</button></div><div id="er"></div>`;
    const calc = () => {
      const a = $('#anio', el).value;
      const rows = S.cache.movimientos.filter((m) => (m.fecha || '').startsWith(a));
      const mat = (tipo) => {
        const cats = {};
        for (const r of rows.filter((x) => x.tipo === tipo)) {
          const c = (cats[r.categoria] ||= Array(12).fill(0));
          c[Number(r.fecha.slice(5, 7)) - 1] += Number(r.valor) || 0;
        }
        return Object.entries(cats).sort((x, y) => x[0].localeCompare(y[0]));
      };
      return { a, ing: mat('Ingreso'), gas: mat('Gasto') };
    };
    const tot = (m) => Array.from({ length: 12 }, (_, i) => m.reduce((s, [, v]) => s + v[i], 0));
    const pintar = () => {
      const { a, ing, gas } = calc();
      const ti = tot(ing), tg = tot(gas), ut = ti.map((v, i) => v - tg[i]);
      const fila = (nom, v, cls = '') => `<tr class="${cls}"><td>${esc(nom)}</td>${v.map((x) => `<td class="num">${x ? money(x) : '—'}</td>`).join('')}<td class="num"><b>${money(v.reduce((s, x) => s + x, 0))}</b></td></tr>`;
      const html = `<h2>Estado de resultados ${esc(a)}</h2><p class="muted small">${esc(S.config.razon_social)} · NIT ${esc(S.config.nit)} · Base: movimientos registrados (criterio de caja)</p>
        <div class="tabla-wrap"><table><thead><tr><th>Cuenta</th>${MES_CORTO.map((m) => `<th class="num">${m}</th>`).join('')}<th class="num">Total</th></tr></thead><tbody>
        <tr><td colspan="14"><b>INGRESOS</b></td></tr>${ing.map(([c, v]) => fila(c, v)).join('') || '<tr><td colspan="14" class="muted">Sin ingresos</td></tr>'}
        ${fila('Total ingresos', ti)}
        <tr><td colspan="14"><b>GASTOS</b></td></tr>${gas.map(([c, v]) => fila(c, v)).join('') || '<tr><td colspan="14" class="muted">Sin gastos</td></tr>'}
        ${fila('Total gastos', tg)}</tbody><tfoot>${fila('UTILIDAD / PÉRDIDA', ut)}</tfoot></table></div>`;
      $('#er', el).innerHTML = html;
      return html;
    };
    pintar();
    $('#anio', el).addEventListener('change', pintar);
    $('#imp', el).addEventListener('click', () => imprimir(pintar()));
    $('#exp', el).addEventListener('click', () => {
      const { a, ing, gas } = calc();
      csv(`estado-resultados-${a}.csv`, ['Tipo', 'Cuenta', ...MES_CORTO, 'Total'], [
        ...ing.map(([c, v]) => ['Ingreso', c, ...v, v.reduce((s, x) => s + x, 0)]),
        ...gas.map(([c, v]) => ['Gasto', c, ...v, v.reduce((s, x) => s + x, 0)]),
      ]);
    });
  }

  async function impuestos(el) {
    await cargar('movimientos');
    const a = mesActual().slice(0, 4);
    const anios = [...new Set([a, ...S.cache.movimientos.map((m) => (m.fecha || '').slice(0, 4)).filter(Boolean)])].sort().reverse();
    el.innerHTML = `<div class="toolbar"><label class="check">Año <select id="anio">${anios.map((x) => `<option>${x}</option>`).join('')}</select></label>
      <label class="check">Periodicidad <select id="per"><option value="2">Bimestral</option><option value="4">Cuatrimestral</option></select></label></div>
      <div id="iv"></div>
      <div class="alerta info">Referencia para preparar las declaraciones. La periodicidad del IVA depende de sus ingresos brutos del año anterior; confirme con su contador y con el calendario tributario de la DIAN. Los ingresos por publicidad y ventas en tiendas extranjeras (Google Play, Unity) pueden tener tratamiento especial de IVA y retención.</div>`;
    const pintar = () => {
      const an = $('#anio', el).value, p = Number($('#per', el).value);
      const rows = S.cache.movimientos.filter((m) => (m.fecha || '').startsWith(an));
      const per = Array.from({ length: 12 / p }, (_, i) => {
        const ms = Array.from({ length: p }, (_, j) => i * p + j + 1);
        const r = rows.filter((m) => ms.includes(Number(m.fecha.slice(5, 7))));
        const g = sum(r.filter((m) => m.tipo === 'Ingreso'), 'iva'), d = sum(r.filter((m) => m.tipo === 'Gasto'), 'iva');
        return { nom: `${MES_CORTO[ms[0] - 1]} – ${MES_CORTO[ms[ms.length - 1] - 1]}`, base: sum(r.filter((m) => m.tipo === 'Ingreso'), 'valor'), g, d,
          retIng: sum(r.filter((m) => m.tipo === 'Ingreso'), 'retencion'), retGas: sum(r.filter((m) => m.tipo === 'Gasto'), 'retencion') };
      });
      $('#iv', el).innerHTML = `<div class="tabla-wrap"><table><thead><tr><th>Periodo</th><th class="num">Ingresos gravables</th><th class="num">IVA generado</th><th class="num">IVA descontable</th><th class="num">Saldo IVA a pagar</th><th class="num">Retenciones que le practicaron</th><th class="num">Retenciones practicadas a terceros</th></tr></thead>
        <tbody>${per.map((x) => `<tr><td>${x.nom}</td><td class="num">${money(x.base)}</td><td class="num">${money(x.g)}</td><td class="num">${money(x.d)}</td><td class="num"><b>${money(x.g - x.d)}</b></td><td class="num">${money(x.retIng)}</td><td class="num">${money(x.retGas)}</td></tr>`).join('')}</tbody></table></div><br>`;
    };
    pintar();
    $('#anio', el).addEventListener('change', pintar);
    $('#per', el).addEventListener('change', pintar);
  }

  // ───────────────────────── Facturación ─────────────────────────
  function docCobro(f) {
    const c = S.config, t = (S.opc.terceros || []).find((x) => x.id === f.tercero_id) || {};
    const iva = Math.round((Number(f.subtotal) || 0) * (Number(f.iva_pct) || 0)) / 100;
    return `<div class="enc"><div><b style="font-size:16px">${esc(c.razon_social)}</b><br>NIT ${esc(c.nit)}<br>${esc(c.direccion)} ${esc(c.ciudad)}<br>${esc(c.telefono)} ${esc(c.email)}<br>${esc(c.regimen)}</div>
      <div style="text-align:right"><b style="font-size:16px">CUENTA DE COBRO</b><br>N.º <b>${esc(f.numero)}</b><br>Fecha: ${esc(flarga(f.fecha))}<br>${f.vencimiento ? `Vence: ${esc(flarga(f.vencimiento))}` : ''}</div></div>
      <p><b>Cliente:</b> ${esc(t.nombre)}<br><b>${esc(t.tipo_doc || 'NIT')}:</b> ${esc(t.identificacion)}<br>${t.direccion ? `<b>Dirección:</b> ${esc(t.direccion)} ${esc(t.ciudad)}<br>` : ''}${t.email ? `<b>Correo:</b> ${esc(t.email)}` : ''}</p>
      <table><thead><tr><th>Concepto</th><th style="width:160px;text-align:right">Valor</th></tr></thead>
      <tbody><tr><td style="white-space:pre-wrap">${esc(f.concepto)}</td><td style="text-align:right">${money(f.subtotal)}</td></tr></tbody>
      <tfoot><tr><td style="text-align:right">Subtotal</td><td style="text-align:right">${money(f.subtotal)}</td></tr>
      <tr><td style="text-align:right">IVA ${esc(f.iva_pct || 0)} %</td><td style="text-align:right">${money(iva)}</td></tr>
      ${f.retencion ? `<tr><td style="text-align:right">Retenciones</td><td style="text-align:right">− ${money(f.retencion)}</td></tr>` : ''}
      <tr><td style="text-align:right"><b>TOTAL A PAGAR</b></td><td style="text-align:right"><b>${money(f.total)}</b></td></tr></tfoot></table>
      ${f.notas ? `<p><b>Observaciones:</b> ${esc(f.notas)}</p>` : ''}
      <div class="firmas"><div>${esc(c.representante || 'Representante legal')}<br>${esc(c.razon_social)}</div><div>Recibido por el cliente</div></div>
      <p style="font-size:11px;color:#555;margin-top:30px">Documento de cobro interno. Si la operación exige factura electrónica de venta, debe expedirse a través del sistema de facturación de la DIAN o de un proveedor tecnológico autorizado.</p>`;
  }
  VISTAS.facturas = async (el) => {
    await vistaRecurso(el, 'facturas', {
      resumen: (rows) => {
        const pend = rows.filter((f) => f.estado === 'Pendiente');
        const venc = pend.filter((f) => f.vencimiento && diasHasta(f.vencimiento) < 0);
        const anio = mesActual().slice(0, 4);
        return `<div class="kpis">${kpi('Por cobrar', money(sum(pend, 'total')), `${pend.length} cobro(s)`)}${kpi('Vencido', money(sum(venc, 'total')), `${venc.length} cobro(s)`, venc.length ? 'bad' : '')}${kpi(`Cobrado en ${anio}`, money(sum(rows.filter((f) => f.estado === 'Pagada' && (f.fecha_pago || '').startsWith(anio)), 'total')), '', 'ok')}</div>
          <div class="alerta info small">Al marcar un cobro como <b>Pagada</b>, el ingreso se registra automáticamente en Contabilidad.</div>`;
      },
      acciones: [
        { label: '🖨️', fn: (f) => vistaPrevia(`Cuenta de cobro ${f.numero}`, docCobro(f)) },
        { label: '✔ Pagada', edita: true, si: (f) => f.estado === 'Pendiente', fn: async (f, re) => { try { await api('PUT', `/api/r/facturas/${f.id}`, { estado: 'Pagada', fecha_pago: hoy() }); toast('Cobro pagado y registrado en contabilidad'); re(); } catch (e) { fallo(e); } } },
      ],
    });
  };

  VISTAS.terceros = (el) => vistaRecurso(el, 'terceros');

  VISTAS.tareas = (el) => vistaRecurso(el, 'tareas', {
    toolbarExtra: S.yo.empleado_id ? '<label class="check small"><input type="checkbox" id="mias" data-refiltrar checked> Solo mis tareas</label>' : '',
    filtrar: (rows, c) => { const m = $('#mias', c); return m && m.checked ? rows.filter((t) => t.responsable_id === S.yo.empleado_id) : rows; },
    resumen: (rows) => {
      const p = rows.filter((t) => t.estado !== 'Hecha');
      return `<div class="kpis">${kpi('Pendientes', String(p.length))}${kpi('Atrasadas', String(p.filter((t) => t.fecha_limite && diasHasta(t.fecha_limite) < 0).length), '', 'bad')}${kpi('Esta semana', String(p.filter((t) => t.fecha_limite && diasHasta(t.fecha_limite) >= 0 && diasHasta(t.fecha_limite) <= 7).length))}</div>`;
    },
    acciones: [{ label: '✔ Hecha', edita: true, si: (t) => t.estado !== 'Hecha', fn: async (t, re) => { try { await api('PUT', `/api/r/tareas/${t.id}`, { estado: 'Hecha' }); re(); } catch (e) { fallo(e); } } }],
  });

  // ───────────────────────── Empleados ─────────────────────────
  function certificadoLaboral(e) {
    const c = S.config, retirado = e.estado === 'Retirado';
    return `<div class="enc"><div><b style="font-size:16px">${esc(c.razon_social)}</b><br>NIT ${esc(c.nit)}</div><div style="text-align:right">${esc(c.ciudad)}<br>${esc(flarga(hoy()))}</div></div>
      <h1>CERTIFICADO LABORAL</h1><br>
      <p>${esc(c.razon_social)}, identificada con NIT ${esc(c.nit)}, <b>CERTIFICA</b> que:</p>
      <p><b>${esc(e.nombres)} ${esc(e.apellidos)}</b>, identificado(a) con ${esc(e.tipo_doc)} N.º ${esc(e.documento)}, ${retirado ? 'laboró' : 'labora'} en nuestra empresa desde el ${esc(flarga(e.fecha_ingreso))}${retirado && e.fecha_retiro ? ` hasta el ${esc(flarga(e.fecha_retiro))}` : ''}, desempeñando el cargo de <b>${esc(e.cargo)}</b>${e.area ? ` en el área de ${esc(e.area)}` : ''}, mediante contrato ${e.tipo_contrato === 'Prestación de servicios' ? 'de prestación de servicios' : `de trabajo a ${esc(String(e.tipo_contrato || '').toLowerCase())}`}, ${retirado ? 'con una asignación' : 'con una asignación actual'} mensual de <b>${money(e.salario)}</b>${e.salario_integral ? ' (salario integral)' : ''}.</p>
      <p>La presente certificación se expide a solicitud del interesado(a) en ${esc(c.ciudad || '________')}, el ${esc(flarga(hoy()))}.</p>
      <br><br><br><div style="width:300px;border-top:1px solid #111;padding-top:6px">${esc(c.representante || 'Representante legal')}<br>${esc(c.representante_doc ? 'C.C. ' + c.representante_doc : '')}<br>${esc(c.razon_social)}<br>${esc(c.telefono)} · ${esc(c.email)}</div>`;
  }
  VISTAS.empleados = (el) => vistaRecurso(el, 'empleados', {
    resumen: (rows) => {
      const a = rows.filter((e) => e.estado !== 'Retirado');
      const nomina = a.filter((e) => e.tipo_contrato !== 'Prestación de servicios');
      return `<div class="kpis">${kpi('Activos', String(a.length))}${kpi('En nómina', String(nomina.length), `Salarios: ${money(sum(nomina, 'salario'))}`)}${kpi('Contratistas', String(a.length - nomina.length), `Honorarios: ${money(sum(a.filter((e) => e.tipo_contrato === 'Prestación de servicios'), 'salario'))}`)}</div>`;
    },
    extraCols: [{ label: 'Antigüedad', html: (e) => { if (!e.fecha_ingreso) return ''; const d = -diasHasta(e.fecha_ingreso); return d < 0 ? 'Próximo ingreso' : d < 365 ? `${Math.floor(d / 30)} mes(es)` : `${NUM.format(Math.floor(d / 36.5) / 10)} años`; } }],
    acciones: [
      { label: '📄 Certificado', fn: (e) => vistaPrevia('Certificado laboral', certificadoLaboral(e)) },
      { label: '👤 Usuario', si: () => S.yo.admin, fn: (e) => { location.hash = '#/usuarios'; setTimeout(() => formUsuario(null, () => router(), e), 400); } },
      { label: '📝 Contrato', si: () => puede('contratos', 'editar'), fn: (e) => { location.hash = '#/contratos'; setTimeout(() => abrirFormulario('contratos', null, () => router(), { tipo: e.tipo_contrato === 'Prestación de servicios' ? 'Prestación de servicios' : 'Laboral', empleado_id: e.id, titulo: `Contrato ${e.nombres} ${e.apellidos}`, contraparte: `${e.nombres} ${e.apellidos}`, fecha_inicio: e.fecha_ingreso, valor: e.salario, periodicidad: 'Mensual', estado: 'Borrador' }), 400); } },
    ],
  });

  // ───────────────────────── Nómina ─────────────────────────
  VISTAS.nomina = async (el, [pid]) => {
    if (pid) return detalleNomina(el, Number(pid));
    const lista = await api('GET', '/api/nomina');
    el.innerHTML = `
      <div class="card"><h2>Liquidar nómina</h2>
        <div class="toolbar"><label class="check">Mes <input type="month" id="per" value="${mesActual()}"></label>
        ${puede('nomina', 'editar') ? '<button class="primary" id="gen">⚙️ Generar / recalcular</button>' : '<span class="badge info">👁️ Solo lectura</span>'}</div>
        <p class="small muted">Incluye a los empleados activos que no son de prestación de servicios. Calcula salud y pensión (4 % + 4 %), fondo de solidaridad, auxilio de transporte, aportes del empleador, parafiscales y provisiones de prestaciones sociales con los parámetros de <a href="#/configuracion/nomina">Configuración → Parámetros de nómina</a> (SMMLV ${money(S.config.smmlv)}, auxilio ${money(S.config.aux_transporte)}).</p></div>
      <div class="card"><h2>Historial</h2>
        ${lista.length ? `<div class="tabla-wrap"><table><thead><tr><th>Periodo</th><th>Estado</th><th class="num">Empleados</th><th class="num">Neto a pagar</th><th class="num">PILA</th><th class="num">Costo total empresa</th><th></th></tr></thead>
        <tbody>${lista.map((p) => `<tr><td><b>${esc(fperiodo(p.periodo))}</b></td><td>${badge(p.estado)}</td><td class="num">${p.totales.empleados || 0}</td><td class="num">${money(p.totales.neto)}</td><td class="num">${money(p.totales.pila)}</td><td class="num">${money(p.totales.costoTotal)}</td><td class="acciones"><a class="btn" href="#/nomina/${p.id}">Ver detalle</a></td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Todavía no ha liquidado ninguna nómina.</p>'}
      </div>`;
    $('#gen', el)?.addEventListener('click', async () => {
      try { const p = await api('POST', '/api/nomina', { periodo: $('#per', el).value }); toast('Nómina calculada'); location.hash = `#/nomina/${p.id}`; } catch (e) { fallo(e); }
    });
  };

  async function detalleNomina(el, pid) {
    const p = await api('GET', `/api/nomina/${pid}`);
    const t = p.totales, ed = puede('nomina', 'editar'), pagada = p.estado === 'Pagada' || !ed;
    const nom = (d) => `${d.empleado.nombres || ''} ${d.empleado.apellidos || ''}`;
    el.innerHTML = `
      <div class="toolbar"><a class="btn" href="#/nomina">← Volver</a><h1 style="margin:0">Nómina ${esc(fperiodo(p.periodo))}</h1>${badge(p.estado)}<span class="grow"></span>
        ${!ed ? '<span class="badge info">👁️ Solo lectura</span>' : pagada ? '<button id="reabrir">↩️ Reabrir</button>' : '<button id="recalc">🔄 Recalcular</button><button class="primary" id="pagar">✔ Marcar como pagada</button>'}
        <button id="imp">🖨️ Resumen</button><button id="exp">⬇️ Exportar</button>${pagada ? '' : '<button class="danger" id="del">🗑️</button>'}</div>
      ${!ed ? '' : pagada ? `<div class="alerta info">Pagada el ${esc(fts(Date.parse(p.pagado)))}. Se registraron en Contabilidad el pago neto y la PILA. Reábrala para hacer cambios.</div>` : '<div class="alerta warn">Borrador: registre horas extra, comisiones, incapacidades (días) y deducciones con el botón «Novedades» de cada empleado.</div>'}
      <div class="kpis">
        ${kpi('Total devengado', money(t.devengado), `${t.empleados} empleado(s)`)}
        ${kpi('Deducciones', money(t.deducciones))}
        ${kpi('Neto a pagar', money(t.neto), 'Transferir a empleados', 'ok')}
        ${kpi('Aportes empresa', money(t.aportes), 'Salud, pensión, ARL, caja, ICBF, SENA')}
        ${kpi('Total PILA', money(t.pila), 'Aportes empleado + empresa')}
        ${kpi('Provisiones', money(t.provisiones), 'Cesantías, intereses, prima, vacaciones')}
        ${kpi('Costo total empresa', money(t.costoTotal))}
      </div>
      <div class="tabla-wrap">${p.detalle.length ? `<table><thead><tr><th>Empleado</th><th class="num">Días</th><th class="num">Básico</th><th class="num">Extras y comisiones</th><th class="num">Aux. transp.</th><th class="num">Devengado</th><th class="num">Salud + pensión + FSP</th><th class="num">Otras deducc.</th><th class="num">Neto</th><th class="num">Aportes empresa</th><th class="num">Provisiones</th><th class="num">Costo total</th><th></th></tr></thead>
        <tbody>${p.detalle.map((d) => { const c = d.calculo; return `<tr data-id="${d.id}"><td><b>${esc(nom(d))}</b><br><span class="small muted">${esc(d.empleado.cargo)}</span>${d.novedades.nota ? `<br><span class="small muted">📌 ${esc(d.novedades.nota)}</span>` : ''}</td>
          <td class="num">${c.dias}</td><td class="num">${money(c.basico)}</td><td class="num">${money(c.extras + c.comisiones + c.bonificacion)}</td><td class="num">${money(c.auxTransporte)}</td><td class="num">${money(c.devengado)}</td>
          <td class="num">${money(c.salud + c.pension + c.fsp)}</td><td class="num">${money(c.retencion + c.otrasDed)}</td><td class="num"><b>${money(c.neto)}</b></td><td class="num">${money(c.aportes)}</td><td class="num">${money(c.provisiones)}</td><td class="num">${money(c.costoTotal)}</td>
          <td class="acciones">${pagada ? '' : '<button class="sm" data-a="nov">Novedades</button> '}<button class="sm" data-a="desp">🧾 Desprendible</button>${pagada ? '' : ' <button class="sm danger" data-a="quitar" title="Quitar de esta nómina">✕</button>'}</td></tr>`; }).join('')}</tbody>
        <tfoot><tr><td>Totales</td><td></td><td class="num">${money(sum(p.detalle, (d) => d.calculo.basico))}</td><td class="num">${money(sum(p.detalle, (d) => d.calculo.extras + d.calculo.comisiones + d.calculo.bonificacion))}</td><td class="num">${money(sum(p.detalle, (d) => d.calculo.auxTransporte))}</td><td class="num">${money(t.devengado)}</td><td class="num">${money(sum(p.detalle, (d) => d.calculo.salud + d.calculo.pension + d.calculo.fsp))}</td><td class="num">${money(sum(p.detalle, (d) => d.calculo.retencion + d.calculo.otrasDed))}</td><td class="num">${money(t.neto)}</td><td class="num">${money(t.aportes)}</td><td class="num">${money(t.provisiones)}</td><td class="num">${money(t.costoTotal)}</td><td></td></tr></tfoot></table>`
        : '<div class="vacio">No hay empleados en esta nómina. Registre empleados activos y pulse «Recalcular».</div>'}</div>
      <p class="small muted">Herramienta de apoyo. Verifique los valores con su contador antes de pagar la planilla PILA. Los contratistas de prestación de servicios no se incluyen en nómina.</p>`;

    const re = () => detalleNomina(el, pid);
    const accion = async (fn, msg) => { try { await fn(); if (msg) toast(msg); re(); } catch (e) { fallo(e); } };
    $('#recalc', el)?.addEventListener('click', () => accion(() => api('POST', '/api/nomina', { periodo: p.periodo }), 'Recalculada'));
    $('#pagar', el)?.addEventListener('click', async () => { if (await confirmar(`¿Marcar la nómina de ${fperiodo(p.periodo)} como pagada? Se registrarán ${money(t.neto)} (neto) y ${money(t.pila)} (PILA) como gastos en Contabilidad.`, { ok: 'Marcar pagada', peligro: false })) accion(() => api('POST', `/api/nomina/${pid}/pagar`, {}), 'Nómina pagada'); });
    $('#reabrir', el)?.addEventListener('click', async () => { if (await confirmar('¿Reabrir la nómina? Se eliminarán los gastos que se registraron automáticamente en Contabilidad.', { ok: 'Reabrir' })) accion(() => api('POST', `/api/nomina/${pid}/reabrir`, {}), 'Nómina reabierta'); });
    $('#del', el)?.addEventListener('click', async () => { if (await confirmar('¿Eliminar este borrador de nómina?')) { try { await api('DELETE', `/api/nomina/${pid}`); location.hash = '#/nomina'; } catch (e) { fallo(e); } } });
    $('#imp', el).addEventListener('click', () => imprimir(resumenNomina(p)));
    $('#exp', el).addEventListener('click', () => csv(`nomina-${p.periodo}.csv`,
      ['Empleado', 'Documento', 'Cargo', 'Días', 'Básico', 'Horas extra', 'Comisiones', 'Bonificación', 'Aux. transporte', 'Devengado', 'IBC', 'Salud', 'Pensión', 'FSP', 'Retención', 'Otras deducciones', 'Neto', 'Salud empresa', 'Pensión empresa', 'ARL', 'Caja', 'ICBF', 'SENA', 'Cesantías', 'Intereses', 'Prima', 'Vacaciones', 'Costo total', 'Banco', 'Cuenta'],
      p.detalle.map((d) => { const c = d.calculo, a = c.aportesEmpresa, pr = c.provisionesDet; return [nom(d), d.empleado.documento, d.empleado.cargo, c.dias, c.basico, c.extras, c.comisiones, c.bonificacion, c.auxTransporte, c.devengado, c.ibc, c.salud, c.pension, c.fsp, c.retencion, c.otrasDed, c.neto, a.salud, a.pension, a.arl, a.caja, a.icbf, a.sena, pr.cesantias, pr.intereses, pr.prima, pr.vacaciones, c.costoTotal, d.empleado.banco, d.empleado.numero_cuenta]; })));
    $('.tabla-wrap', el).addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const d = p.detalle.find((x) => x.id === Number(b.closest('tr').dataset.id));
      if (b.dataset.a === 'desp') vistaPrevia(`Desprendible · ${nom(d)}`, desprendible(p, d));
      else if (b.dataset.a === 'quitar') confirmar(`¿Quitar a ${nom(d)} de esta nómina?`, { ok: 'Quitar' }).then((ok) => ok && accion(() => api('DELETE', `/api/nomina/${pid}/detalle/${d.id}`)));
      else novedades(p, d, re);
    });
  }

  function novedades(p, d, re) {
    const n = d.novedades;
    const inp = (k, l, extra = '') => `<label>${l}<input type="number" min="0" step="any" name="${k}" value="${esc(n[k] ?? '')}" ${extra}></label>`;
    const m = modal(`Novedades · ${d.empleado.nombres} ${d.empleado.apellidos}`, `<form class="form-grid" id="fn">
      ${inp('dias', 'Días laborados (vacío = automático)', 'max="30" placeholder="' + d.calculo.dias + '"')}
      ${inp('he_diurnas', 'Horas extra diurnas (×1,25)')}
      ${inp('he_nocturnas', 'Horas extra nocturnas (×1,75)')}
      ${inp('recargo_nocturno', 'Horas con recargo nocturno (×0,35)')}
      ${inp('horas_dominicales', `Horas dominicales / festivas (recargo ×${esc(S.config.recargo_dominical)})`)}
      ${inp('comisiones', 'Comisiones (salariales)')}
      ${inp('bonificacion', 'Bonificación no salarial')}
      ${inp('retencion', 'Retención en la fuente')}
      ${inp('otras_deducciones', 'Otras deducciones (préstamos, libranzas)')}
      <label class="check"><input type="checkbox" name="sin_aux" ${n.sin_aux ? 'checked' : ''}> No pagar auxilio de transporte (teletrabajo / vive cerca)</label>
      <label class="wide">Nota<input name="nota" value="${esc(n.nota || '')}" maxlength="300" placeholder="Ej.: 3 días de incapacidad"></label></form>`,
      { pie: '<button data-cerrar>Cancelar</button><button class="primary" id="fn-ok">Guardar y recalcular</button>' });
    $('#fn-ok', m.el).addEventListener('click', async () => {
      const f = $('#fn', m.el), body = {};
      for (const el of f.elements) if (el.name) body[el.name] = el.type === 'checkbox' ? el.checked : el.value;
      try { await api('PUT', `/api/nomina/${p.id}/detalle/${d.id}`, body); m.cerrar(); toast('Novedades guardadas'); re(); } catch (e) { fallo(e); }
    });
  }

  function desprendible(p, d) {
    const c = d.calculo, e = d.empleado, cf = S.config;
    const fila = (l, v) => (v ? `<tr><td>${esc(l)}</td><td style="text-align:right">${money(v)}</td></tr>` : '');
    return `<div class="enc"><div><b style="font-size:16px">${esc(cf.razon_social)}</b><br>NIT ${esc(cf.nit)}</div><div style="text-align:right"><b>COMPROBANTE DE PAGO DE NÓMINA</b><br>Periodo: ${esc(fperiodo(p.periodo))}</div></div>
      <p><b>Empleado:</b> ${esc(e.nombres)} ${esc(e.apellidos)} · ${esc(e.tipo_doc)} ${esc(e.documento)}<br><b>Cargo:</b> ${esc(e.cargo)} · <b>Salario:</b> ${money(e.salario)} · <b>Días:</b> ${c.dias}<br>
      <b>EPS:</b> ${esc(e.eps || '—')} · <b>Pensión:</b> ${esc(e.afp || '—')} · <b>Pago a:</b> ${esc(e.banco || '—')} ${esc(e.numero_cuenta || '')}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <table><thead><tr><th>Devengos</th><th style="text-align:right">Valor</th></tr></thead><tbody>
          ${fila('Salario básico', c.basico)}${fila('Horas extra y recargos', c.extras)}${fila('Comisiones', c.comisiones)}${fila('Auxilio de transporte', c.auxTransporte)}${fila('Bonificación no salarial', c.bonificacion)}
          </tbody><tfoot><tr><td><b>Total devengado</b></td><td style="text-align:right"><b>${money(c.devengado)}</b></td></tr></tfoot></table>
        <table><thead><tr><th>Deducciones</th><th style="text-align:right">Valor</th></tr></thead><tbody>
          ${fila('Salud (4 %)', c.salud)}${fila('Pensión (4 %)', c.pension)}${fila(`Fondo de solidaridad (${NUM.format(c.fspPct * 100)} %)`, c.fsp)}${fila('Retención en la fuente', c.retencion)}${fila('Otras deducciones', c.otrasDed)}
          </tbody><tfoot><tr><td><b>Total deducciones</b></td><td style="text-align:right"><b>${money(c.deducciones)}</b></td></tr></tfoot></table></div>
      <p style="font-size:16px;text-align:right;margin-top:14px"><b>NETO A PAGAR: ${money(c.neto)}</b></p>
      ${d.novedades.nota ? `<p><b>Nota:</b> ${esc(d.novedades.nota)}</p>` : ''}
      <div class="firmas"><div>${esc(cf.razon_social)}</div><div>Recibí conforme: ${esc(e.nombres)} ${esc(e.apellidos)}</div></div>`;
  }
  function resumenNomina(p) {
    const t = p.totales;
    return `<div class="enc"><div><b style="font-size:16px">${esc(S.config.razon_social)}</b><br>NIT ${esc(S.config.nit)}</div><div style="text-align:right"><b>RESUMEN DE NÓMINA</b><br>${esc(fperiodo(p.periodo))} · ${esc(p.estado)}</div></div>
      <table><thead><tr><th>Empleado</th><th>Documento</th><th style="text-align:right">Devengado</th><th style="text-align:right">Deducciones</th><th style="text-align:right">Neto</th><th>Cuenta</th></tr></thead>
      <tbody>${p.detalle.map((d) => `<tr><td>${esc(d.empleado.nombres)} ${esc(d.empleado.apellidos)}</td><td>${esc(d.empleado.documento)}</td><td style="text-align:right">${money(d.calculo.devengado)}</td><td style="text-align:right">${money(d.calculo.deducciones)}</td><td style="text-align:right">${money(d.calculo.neto)}</td><td>${esc(d.empleado.banco || '')} ${esc(d.empleado.numero_cuenta || '')}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td colspan="2">Totales</td><td style="text-align:right">${money(t.devengado)}</td><td style="text-align:right">${money(t.deducciones)}</td><td style="text-align:right">${money(t.neto)}</td><td></td></tr></tfoot></table>
      <br><table><tbody><tr><td>Aportes a cargo de la empresa</td><td style="text-align:right">${money(t.aportes)}</td></tr><tr><td>Total planilla PILA</td><td style="text-align:right">${money(t.pila)}</td></tr><tr><td>Provisiones de prestaciones sociales</td><td style="text-align:right">${money(t.provisiones)}</td></tr><tr><td><b>Costo total para la empresa</b></td><td style="text-align:right"><b>${money(t.costoTotal)}</b></td></tr></tbody></table>`;
  }

  // ───────────────────────── Contratos ─────────────────────────
  function plantillaContrato(k) {
    const c = S.config;
    const e = (S.opc.empleados || []).find((x) => x.id === k.empleado_id);
    const t = (S.opc.terceros || []).find((x) => x.id === k.tercero_id);
    const parte = e ? { nombre: `${e.nombres} ${e.apellidos}`, doc: `${e.tipo_doc} N.º ${e.documento}`, dir: `${e.direccion || ''} ${e.ciudad || ''}`.trim() }
      : t ? { nombre: t.nombre, doc: `${t.tipo_doc || 'NIT'} N.º ${t.identificacion || '________'}`, dir: `${t.direccion || ''} ${t.ciudad || ''}`.trim() }
      : { nombre: k.contraparte || '________________', doc: 'identificación N.º ________', dir: '' };
    const empresa = `<b>${esc(c.razon_social)}</b>, sociedad identificada con NIT ${esc(c.nit || '________')}, representada legalmente por ${esc(c.representante || '________________')}${c.representante_doc ? `, identificado(a) con C.C. ${esc(c.representante_doc)}` : ''}`;
    const enc = `<div class="enc"><div><b>${esc(c.razon_social)}</b><br>NIT ${esc(c.nit)}</div><div style="text-align:right">${esc(c.ciudad)}<br>${esc(flarga(k.fecha_inicio))}</div></div>`;
    const firmas = (a, b) => `<div class="firmas"><div>${a}<br>${esc(c.representante || 'Representante legal')}<br>${esc(c.razon_social)}</div><div>${b}<br>${esc(parte.nombre)}<br>${esc(parte.doc)}</div></div>`;
    const pi = `Las obras, códigos fuente, diseños, arte, música, personajes, niveles, documentación y demás creaciones que se produzcan en ejecución de este contrato, incluidos los videojuegos de la empresa, serán de propiedad exclusiva de ${esc(c.razon_social)}, a quien corresponden todos los derechos patrimoniales de autor, conforme a la Ley 23 de 1982 y la Ley 1450 de 2011 (art. 28) y normas concordantes, sin perjuicio de los derechos morales.`;
    const conf = 'La información técnica, comercial, financiera, de usuarios, códigos, estrategias de lanzamiento y cualquier otra información de la empresa a la que se tenga acceso es confidencial y no podrá divulgarse ni usarse para fines distintos a este contrato, obligación que se mantendrá vigente durante el contrato y por cinco (5) años después de su terminación.';

    if (k.tipo === 'Laboral') {
      const termino = e && e.tipo_contrato && e.tipo_contrato !== 'Prestación de servicios' ? e.tipo_contrato : 'Término indefinido';
      return `${enc}<h1>CONTRATO INDIVIDUAL DE TRABAJO A ${esc(termino.toUpperCase())}</h1><br>
        <p>Entre ${empresa}, quien en adelante se denominará <b>EL EMPLEADOR</b>, y <b>${esc(parte.nombre)}</b>, identificado(a) con ${esc(parte.doc)}, domiciliado(a) en ${esc(parte.dir || '________')}, quien en adelante se denominará <b>EL TRABAJADOR</b>, se celebra el presente contrato de trabajo, regido por el Código Sustantivo del Trabajo y las siguientes cláusulas:</p>
        <p><b>PRIMERA. Objeto.</b> EL TRABAJADOR se obliga a prestar sus servicios personales en el cargo de <b>${esc(e ? e.cargo : '________')}</b>, ejecutando las funciones propias del cargo y las que le sean asignadas. ${k.objeto ? esc(k.objeto) : ''}</p>
        <p><b>SEGUNDA. Salario.</b> EL EMPLEADOR pagará un salario mensual de <b>${money(k.valor || (e && e.salario))}</b>${e && e.salario_integral ? ', bajo la modalidad de salario integral (art. 132 CST)' : ''}, pagadero ${esc((k.periodicidad || 'mensual').toLowerCase())}mente mediante transferencia bancaria.</p>
        <p><b>TERCERA. Duración.</b> El contrato inicia el ${esc(flarga(k.fecha_inicio))}${termino === 'Término fijo' ? ` y termina el ${esc(flarga(k.fecha_fin))}` : termino === 'Obra o labor' ? ' y durará hasta la terminación de la obra o labor contratada' : ' y es a término indefinido'}.</p>
        <p><b>CUARTA. Período de prueba.</b> Las partes acuerdan un período de prueba de dos (2) meses${termino === 'Término fijo' ? ', sin exceder la quinta parte del término inicial pactado' : ''}.</p>
        <p><b>QUINTA. Jornada.</b> La jornada será la máxima legal vigente, distribuida según las necesidades de la empresa. Podrá pactarse trabajo en casa o teletrabajo conforme a la ley.</p>
        <p><b>SEXTA. Propiedad intelectual.</b> ${pi}</p>
        <p><b>SÉPTIMA. Confidencialidad.</b> ${conf}</p>
        <p><b>OCTAVA. Seguridad social.</b> EL EMPLEADOR afiliará a EL TRABAJADOR al Sistema de Seguridad Social Integral y a la caja de compensación familiar, y efectuará los aportes de ley.</p>
        <p><b>NOVENA. Terminación.</b> El contrato podrá terminarse por las causas previstas en los artículos 61 y 62 del Código Sustantivo del Trabajo.</p>
        <p>Para constancia se firma en ${esc(c.ciudad || '________')}, el ${esc(flarga(k.fecha_inicio))}.</p>${firmas('EL EMPLEADOR', 'EL TRABAJADOR')}`;
    }
    if (k.tipo === 'Prestación de servicios') {
      return `${enc}<h1>CONTRATO DE PRESTACIÓN DE SERVICIOS</h1><br>
        <p>Entre ${empresa}, quien en adelante se denominará <b>EL CONTRATANTE</b>, y <b>${esc(parte.nombre)}</b>, identificado(a) con ${esc(parte.doc)}, quien en adelante se denominará <b>EL CONTRATISTA</b>, se celebra el presente contrato de prestación de servicios, regido por las normas civiles y comerciales y las siguientes cláusulas:</p>
        <p><b>PRIMERA. Objeto.</b> EL CONTRATISTA se obliga a prestar, con plena autonomía técnica, administrativa y sin subordinación, los siguientes servicios: ${esc(k.objeto || '________________')}.</p>
        <p><b>SEGUNDA. Valor y forma de pago.</b> El valor del contrato es de <b>${money(k.valor)}</b>, pagadero de forma ${esc((k.periodicidad || 'mensual').toLowerCase())}, previa presentación de la cuenta de cobro o factura y de la constancia de pago de los aportes a seguridad social.</p>
        <p><b>TERCERA. Plazo.</b> Desde el ${esc(flarga(k.fecha_inicio))} hasta el ${esc(flarga(k.fecha_fin))}.</p>
        <p><b>CUARTA. Independencia.</b> No existe relación laboral entre las partes. EL CONTRATISTA asume sus propios riesgos, herramientas y horarios, y es responsable de sus aportes a salud, pensión y riesgos laborales sobre el 40 % del valor mensual del contrato.</p>
        <p><b>QUINTA. Cesión de derechos.</b> ${pi} EL CONTRATISTA cede a EL CONTRATANTE, de forma total, exclusiva y sin límite territorial, los derechos patrimoniales sobre los entregables, por el término máximo legal.</p>
        <p><b>SEXTA. Confidencialidad.</b> ${conf}</p>
        <p><b>SÉPTIMA. Terminación.</b> Cualquiera de las partes podrá terminar el contrato con aviso escrito de quince (15) días, pagándose los servicios efectivamente prestados.</p>
        <p>Para constancia se firma en ${esc(c.ciudad || '________')}, el ${esc(flarga(k.fecha_inicio))}.</p>${firmas('EL CONTRATANTE', 'EL CONTRATISTA')}`;
    }
    if (k.tipo === 'Confidencialidad (NDA)') {
      return `${enc}<h1>ACUERDO DE CONFIDENCIALIDAD</h1><br>
        <p>Entre ${empresa} y <b>${esc(parte.nombre)}</b>, identificado(a) con ${esc(parte.doc)}, se celebra el presente acuerdo de confidencialidad:</p>
        <p><b>PRIMERA. Propósito.</b> ${esc(k.objeto || 'Las partes compartirán información para evaluar y/o ejecutar una relación comercial relacionada con el desarrollo, publicación o promoción de videojuegos.')}</p>
        <p><b>SEGUNDA. Información confidencial.</b> Es toda información técnica, comercial, financiera, de diseño, códigos fuente, builds no publicadas, métricas, datos de usuarios y planes de negocio revelada por cualquier medio.</p>
        <p><b>TERCERA. Obligaciones.</b> La parte receptora usará la información solo para el propósito indicado, no la divulgará a terceros sin autorización escrita y la protegerá con al menos el mismo cuidado que su propia información.</p>
        <p><b>CUARTA. Exclusiones.</b> No es confidencial la información que sea de dominio público sin culpa de la receptora, que ya conociera legítimamente, o cuya revelación ordene una autoridad competente.</p>
        <p><b>QUINTA. Duración.</b> Este acuerdo rige desde el ${esc(flarga(k.fecha_inicio))} y las obligaciones de confidencialidad se mantendrán durante cinco (5) años después de terminada la relación entre las partes.</p>
        <p><b>SEXTA. Devolución.</b> Al terminar la relación o a solicitud de la parte reveladora, la receptora devolverá o destruirá la información recibida.</p>
        <p>Para constancia se firma en ${esc(c.ciudad || '________')}, el ${esc(flarga(k.fecha_inicio))}.</p>${firmas(esc(c.razon_social), 'LA OTRA PARTE')}`;
    }
    return `${enc}<h1>${esc(String(k.titulo).toUpperCase())}</h1><br>
      <p>Entre ${empresa}, y <b>${esc(parte.nombre)}</b>, identificado(a) con ${esc(parte.doc)}, se celebra el presente contrato de ${esc(k.tipo.toLowerCase())}, regido por las siguientes cláusulas:</p>
      <p><b>PRIMERA. Objeto.</b> ${esc(k.objeto || '________________')}</p>
      <p><b>SEGUNDA. Valor.</b> ${k.valor ? `${money(k.valor)}, con periodicidad ${esc((k.periodicidad || 'única').toLowerCase())}.` : 'Según lo acordado entre las partes.'}</p>
      <p><b>TERCERA. Plazo.</b> Desde el ${esc(flarga(k.fecha_inicio))}${k.fecha_fin ? ` hasta el ${esc(flarga(k.fecha_fin))}` : ''}${k.renovacion_auto ? ', prorrogable automáticamente por periodos iguales salvo aviso en contrario con treinta (30) días de anticipación' : ''}.</p>
      <p><b>CUARTA. Confidencialidad.</b> ${conf}</p>
      <p><b>QUINTA. Propiedad intelectual.</b> Cada parte conserva la titularidad de sus marcas, juegos y demás derechos de propiedad intelectual; cualquier licencia o cesión deberá constar expresamente por escrito.</p>
      <p>Para constancia se firma en ${esc(c.ciudad || '________')}, el ${esc(flarga(k.fecha_inicio))}.</p>${firmas(esc(c.razon_social), 'LA OTRA PARTE')}`;
  }
  VISTAS.contratos = (el) => vistaRecurso(el, 'contratos', {
    resumen: (rows) => {
      const vig = rows.filter((c) => c.estado === 'Vigente');
      const pronto = rows.filter((c) => c.fecha_fin && !CERRADO.includes(c.estado) && diasHasta(c.fecha_fin) <= 30);
      return `<div class="kpis">${kpi('Vigentes', String(vig.length))}${kpi('Vencen en 30 días o vencidos', String(pronto.length), '', pronto.length ? 'bad' : '')}${kpi('Valor contratos vigentes', money(sum(vig, 'valor')))}</div>`;
    },
    acciones: [
      { label: '📄 Borrador', fn: async (k) => { vistaPrevia(k.titulo, plantillaContrato(k) + '<p style="font-size:11px;color:#777;margin-top:30px">[Borrador generado automáticamente. Revíselo con un abogado antes de firmar y elimine esta nota.]</p>'); } },
      { label: '📎', si: (k) => k.documento_id && puede('documentos'), fn: (k) => { window.location.href = `/api/documentos/${k.documento_id}/descargar`; } },
    ],
  });

  // ───────────────────────── Documentos ─────────────────────────
  const tamano = (b) => (b > 1048576 ? NUM.format(Math.round(b / 104857.6) / 10) + ' MB' : NUM.format(Math.ceil(b / 1024)) + ' KB');
  function subirDocumento(re) {
    const d = def('documentos');
    const cat = d.fields.find((f) => f.k === 'categoria');
    const m = modal('Subir documento', `<form class="form-grid" id="fd">
      <label class="wide"><span>Archivo (máx. 15 MB) <span class="req">*</span></span><input type="file" name="archivo" required></label>
      <label>Nombre<input name="nombre" maxlength="300" placeholder="Si lo deja vacío se usa el nombre del archivo"></label>
      <label>Categoría<select name="categoria">${cat.options.map((o) => `<option>${esc(o)}</option>`).join('')}</select></label>
      <label>Vence / renovar el<input type="date" name="fecha_vencimiento"></label>
      <label class="wide">Descripción<textarea name="descripcion"></textarea></label></form>
      <p class="small muted">Ejemplos: certificado de Cámara de Comercio, RUT, estatutos, actas, declaraciones, contratos firmados, registros de marca y derechos de autor, piezas de marketing.</p>`,
      { pie: '<button data-cerrar>Cancelar</button><button class="primary" id="fd-ok">Subir</button>' });
    $('#fd-ok', m.el).addEventListener('click', async () => {
      const f = $('#fd', m.el), file = f.archivo.files[0];
      if (!file) return toast('Seleccione un archivo', true);
      if (file.size > 15 * 1024 * 1024) return toast('El archivo supera 15 MB', true);
      const btn = $('#fd-ok', m.el); btn.disabled = true; btn.textContent = 'Subiendo…';
      try {
        const datos = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.onerror = rej; r.readAsDataURL(file); });
        await api('POST', '/api/documentos/subir', { nombre: f.nombre.value || file.name, categoria: f.categoria.value, fecha_vencimiento: f.fecha_vencimiento.value || null, descripcion: f.descripcion.value || null, archivo: { nombre: file.name, tipo: file.type, datos } });
        m.cerrar(); toast('Documento guardado'); re();
      } catch (e) { fallo(e); btn.disabled = false; btn.textContent = 'Subir'; }
    });
  }
  VISTAS.documentos = (el) => vistaRecurso(el, 'documentos', {
    toolbarExtra: puede('documentos', 'editar') ? '<button class="primary" id="subir">⬆️ Subir documento</button>' : '',
    extraCols: [{ label: 'Tamaño', num: true, html: (d) => (d.archivo_tamano ? tamano(d.archivo_tamano) : '') }],
    resumen: (rows) => `<div class="kpis">${kpi('Documentos', String(rows.length))}${kpi('Espacio usado', tamano(sum(rows, 'archivo_tamano')))}${kpi('Por vencer (30 días)', String(rows.filter((d) => d.fecha_vencimiento && diasHasta(d.fecha_vencimiento) <= 30).length))}</div>`,
    acciones: [{ label: '⬇️ Descargar', fn: (d) => { window.location.href = `/api/documentos/${d.id}/descargar`; } }],
    alMontar: (c, recargar) => $('#subir', c)?.addEventListener('click', () => subirDocumento(recargar)),
  });

  // ───────────────────────── Juegos ─────────────────────────
  VISTAS.juegos = async (el, [sub = 'lista']) => {
    el.innerHTML = tabs(el, 'juegos', [['lista', 'Portafolio'], ['unity', '📈 Ingresos Unity Ads']], sub) + '<div id="jv"></div>';
    const jv = $('#jv', el);
    if (sub === 'unity') return vistaUnity(jv);
    return vistaJuegos(jv);
  };
  async function vistaUnity(el) {
    const d = await api('GET', '/api/unity/estadisticas?dias=400');
    await cargar('juegos');
    if (!d.configurado && !d.filas.length) {
      el.innerHTML = `<div class="card"><h2>📈 Ingresos de Unity Ads</h2><p>Aún no está conectado con Unity. ${S.yo.admin ? 'Configúrelo en <a href="#/configuracion/integraciones">Configuración → Integraciones</a>.' : 'Pídale al administrador que lo configure en Configuración → Integraciones.'}</p></div>`;
      return;
    }
    const nombreJuego = (gid) => { const j = S.cache.juegos.find((x) => String(x.unity_game_id || '').trim() === gid); return j ? j.nombre : gid ? `Game ID ${gid}` : 'Sin identificar'; };
    el.innerHTML = `<div class="toolbar"><label class="check">Periodo <select id="dias"><option value="7">7 días</option><option value="30" selected>30 días</option><option value="90">90 días</option><option value="365">12 meses</option></select></label>
      <span class="grow"></span><span class="small muted">Datos de ${esc(haceCuanto(d.ultima_sync))} · TRM ${esc(NUM.format(d.trm))}</span>${S.yo.admin ? '<button id="sync">🔄 Sincronizar ahora</button>' : ''}</div>
      ${d.ultimo_error ? `<div class="alerta bad">Último error al sincronizar: ${esc(d.ultimo_error)}</div>` : ''}
      <div id="uv"></div>`;
    const pintar = () => {
      const n = Number($('#dias', el).value), desde = diasAtras(n - 1);
      const rows = d.filas.filter((f) => f.fecha >= desde);
      const fechas = Array.from({ length: n }, (_, i) => diasAtras(n - 1 - i));
      const porDia = fechas.map((f) => sum(rows.filter((r) => r.fecha === f), 'ingresos'));
      const tot = { usd: sum(rows, 'ingresos'), vistas: sum(rows, 'vistas') };
      const grupos = {};
      for (const r of rows) { const k = `${r.game_id}|${r.plataforma}`; const g = (grupos[k] ||= { game_id: r.game_id, plataforma: r.plataforma, usd: 0, vistas: 0, inicios: 0, solicitudes: 0, disponibles: 0 }); g.usd += r.ingresos; g.vistas += r.vistas; g.inicios += r.inicios; g.solicitudes += r.solicitudes; g.disponibles += r.disponibles; }
      const lista = Object.values(grupos).sort((a, b) => b.usd - a.usd);
      const relleno = (g) => (g.solicitudes ? pct(g.disponibles / g.solicitudes) : '—');
      $('#uv', el).innerHTML = `<div class="kpis">${kpi('Ingresos', usd(tot.usd), `≈ ${money(tot.usd * d.trm)}`, 'ok')}${kpi('Promedio diario', usd(tot.usd / n))}${kpi('Anuncios vistos', NUM.format(tot.vistas))}${kpi('eCPM', ecpm(tot), 'Ingreso por cada 1.000 anuncios vistos')}</div>
        <div class="card"><h2>Ingresos por día (US$)</h2>${graficoBarras(fechas, [{ nombre: 'Ingresos Unity Ads', clase: 's1', valores: porDia }], { titulo: 'Ingresos diarios de Unity Ads', etiqueta: (f) => String(Number(f.slice(8))), periodo: fdate, formato: usd, eje: (v) => 'US$ ' + NUM.format(Math.round(v * 100) / 100), cadaN: n > 31 ? Math.ceil(n / 15) : n > 14 ? 2 : 0 })}<p class="small muted">Pase el cursor sobre una barra para ver el valor. Unity reporta en dólares; el valor en pesos es aproximado con la TRM configurada.</p></div>
        <div class="tabla-wrap"><table><thead><tr><th>Juego</th><th>Plataforma</th><th class="num">Ingresos (US$)</th><th class="num">≈ COP</th><th class="num">Vistas</th><th class="num">Inicios</th><th class="num">eCPM</th><th class="num">Tasa de relleno</th></tr></thead>
        <tbody>${lista.map((g) => `<tr><td><b>${esc(nombreJuego(g.game_id))}</b></td><td>${esc(g.plataforma)}</td><td class="num">${usd(g.usd)}</td><td class="num">${money(g.usd * d.trm)}</td><td class="num">${NUM.format(g.vistas)}</td><td class="num">${NUM.format(g.inicios)}</td><td class="num">${ecpm(g)}</td><td class="num">${relleno(g)}</td></tr>`).join('') || '<tr><td colspan="8" class="muted">Sin datos en este periodo.</td></tr>'}</tbody></table></div>
        ${lista.some((g) => !S.cache.juegos.some((j) => String(j.unity_game_id || '').trim() === g.game_id)) ? '<p class="small muted">Para ver el nombre del juego en vez del número, escriba su «Game ID de Unity» en Juegos → Portafolio → ✏️ Editar.</p>' : ''}`;
    };
    pintar();
    $('#dias', el).addEventListener('change', pintar);
    $('#sync', el)?.addEventListener('click', async (e) => {
      e.target.disabled = true; e.target.textContent = 'Sincronizando…';
      try { const r = await api('POST', '/api/integraciones/unity/sincronizar', {}); toast(`Sincronizado: ${r.filas} registros`); router(); } catch (err) { fallo(err); e.target.disabled = false; e.target.textContent = '🔄 Sincronizar ahora'; }
    });
  }
  const vistaJuegos = (el) => vistaRecurso(el, 'juegos', {
    resumen: (rows) => `<div class="kpis">${kpi('Juegos y proyectos', String(rows.length))}${kpi('Publicados', String(rows.filter((j) => j.estado === 'Publicado').length))}${kpi('Descargas totales', NUM.format(sum(rows, 'descargas')))}${kpi('Usuarios activos / mes', NUM.format(sum(rows, 'usuarios_activos')))}</div>`,
    extraCols: [{ label: 'Tienda', html: (j) => (j.enlace ? `<a href="${esc(j.enlace)}" target="_blank" rel="noopener noreferrer">Ver ↗</a>` : '') }],
  });

  // ───────────────────────── Marketing ─────────────────────────
  VISTAS.marketing = async (el, [sub = 'campanas']) => {
    el.innerHTML = tabs(el, 'marketing', [['campanas', 'Campañas'], ['calendario', 'Calendario de contenido']], sub) + '<div id="mv"></div>';
    const mv = $('#mv', el);
    if (sub === 'calendario') {
      return vistaRecurso(mv, 'publicaciones', {
        toolbarExtra: '<label class="check small"><input type="checkbox" id="prox" data-refiltrar checked> Solo próximas y sin publicar</label>',
        filtrar: (rows, c) => ($('#prox', c).checked ? rows.filter((p) => p.estado !== 'Publicada' || (p.fecha && diasHasta(p.fecha) >= 0)) : rows),
        resumen: (rows) => `<div class="kpis">${kpi('Esta semana', String(rows.filter((p) => p.fecha && diasHasta(p.fecha) >= 0 && diasHasta(p.fecha) <= 7).length))}${kpi('Programadas', String(rows.filter((p) => p.estado === 'Programada').length))}${kpi('Ideas pendientes', String(rows.filter((p) => p.estado === 'Idea').length))}</div>`,
        acciones: [{ label: '✔ Publicada', edita: true, si: (p) => p.estado !== 'Publicada', fn: async (p, re) => { try { await api('PUT', `/api/r/publicaciones/${p.id}`, { estado: 'Publicada' }); re(); } catch (e) { fallo(e); } } }],
      });
    }
    const div = (a, b) => (b ? a / b : NaN);
    return vistaRecurso(mv, 'campanas', {
      resumen: (rows) => {
        const g = sum(rows, 'gastado'), ins = sum(rows, 'instalaciones'), ingr = sum(rows, 'ingresos');
        return `<div class="kpis">${kpi('Invertido', money(g), `Presupuesto: ${money(sum(rows, 'presupuesto'))}`)}${kpi('Instalaciones', NUM.format(ins))}${kpi('CPI promedio', ins ? money(g / ins) : '—', 'Costo por instalación')}${kpi('ROAS', g ? pct(ingr / g) : '—', `Ingresos atribuidos: ${money(ingr)}`)}</div>`;
      },
      extraCols: [
        { label: 'Uso presupuesto', html: (c) => { const u = div(c.gastado || 0, c.presupuesto); return Number.isFinite(u) ? `<div class="bar" title="${pct(u)}"><span class="${u > 1 ? 'over' : ''}" style="width:${Math.min(100, u * 100)}%"></span></div><span class="small muted">${pct(u)}</span>` : ''; }, csv: (c) => (c.presupuesto ? (c.gastado || 0) / c.presupuesto : '') },
        { label: 'CTR', num: true, html: (c) => pct(div(c.clics, c.impresiones)), csv: (c) => div(c.clics, c.impresiones) || '' },
        { label: 'CPI', num: true, html: (c) => (c.instalaciones ? money(c.gastado / c.instalaciones) : '—'), csv: (c) => (c.instalaciones ? c.gastado / c.instalaciones : '') },
        { label: 'ROAS', num: true, html: (c) => pct(div(c.ingresos, c.gastado)), csv: (c) => div(c.ingresos, c.gastado) || '' },
      ],
    });
  };

  // ───────────────────────── Configuración ─────────────────────────
  VISTAS.configuracion = async (el, [sub = 'empresa']) => {
    S.config = await api('GET', '/api/config');
    const c = S.config;
    el.innerHTML = tabs(el, 'configuracion', [['empresa', 'Datos de la empresa'], ['nomina', 'Parámetros de nómina'], ...(S.yo.admin ? [['integraciones', '🔌 Integraciones'], ['respaldo', 'Respaldo de datos']] : [])], sub) + '<div id="cf"></div>';
    if (['respaldo', 'integraciones'].includes(sub) && !S.yo.admin) sub = 'empresa';
    const edCfg = puede('configuracion', 'editar');
    const cf = $('#cf', el);
    if (sub === 'integraciones') return integraciones(cf);
    const inp = (k, l, t = 'text', extra = '') => `<label>${esc(l)}<input type="${t}" name="${k}" value="${esc(c[k])}" ${extra}></label>`;
    const guardar = async (form) => {
      const body = {};
      for (const x of form.elements) if (x.name) body[x.name] = x.type === 'checkbox' ? (x.checked ? '1' : '0') : x.value;
      try { S.config = await api('PUT', '/api/config', body); toast('Configuración guardada'); } catch (e) { fallo(e); }
    };
    if (sub === 'empresa') {
      cf.innerHTML = `<div class="card"><form class="form-grid" id="fc">
        ${inp('razon_social', 'Razón social')}${inp('nit', 'NIT')}${inp('representante', 'Representante legal')}${inp('representante_doc', 'Cédula del representante')}
        ${inp('direccion', 'Dirección')}${inp('ciudad', 'Ciudad')}${inp('telefono', 'Teléfono')}${inp('email', 'Correo', 'email')}
        ${inp('actividad', 'Actividad económica')}<label>Régimen tributario<select name="regimen">${['Responsable de IVA', 'No responsable de IVA', 'Régimen Simple de Tributación (RST)'].map((o) => `<option ${o === c.regimen ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
        ${inp('prefijo_factura', 'Prefijo de cuentas de cobro')}${inp('sesion_minutos', 'Cerrar sesión tras (minutos sin uso)', 'number', 'min="5" max="480"')}
        <div class="wide"><button class="primary" type="submit">Guardar</button></div></form></div>`;
    } else if (sub === 'nomina') {
      cf.innerHTML = `<div class="card"><div class="alerta warn">Actualice estos valores cada año según el decreto del Gobierno Nacional. Los valores por defecto corresponden a 2026; verifíquelos con su contador.</div>
        <form class="form-grid" id="fc">
        ${inp('smmlv', 'Salario mínimo mensual (SMMLV)', 'number')}${inp('aux_transporte', 'Auxilio de transporte', 'number')}
        ${inp('horas_mes', 'Horas laborales al mes (jornada 42 h/sem = 210)', 'number')}${inp('recargo_dominical', 'Recargo dominical / festivo (0,90 = 90 %)', 'number', 'step="0.05"')}
        <label class="check wide"><input type="checkbox" name="exoneracion_aportes" ${c.exoneracion_aportes === '1' ? 'checked' : ''}> Exoneración de salud (8,5 %), ICBF y SENA para empleados que ganan menos de 10 SMMLV (art. 114-1 Estatuto Tributario — aplica a sociedades como las S.A.S.)</label>
        <div class="wide"><button class="primary" type="submit">Guardar</button></div></form></div>`;
    } else if (sub === 'respaldo') {
      cf.innerHTML = `<div class="card"><h2>💾 Respaldo de datos</h2>
        <p>Descargue una copia de toda la información (excepto los archivos de Documentos y las credenciales) en formato JSON. Guárdela en un lugar seguro.</p>
        <button class="primary" id="resp">⬇️ Descargar respaldo</button>
        <p class="small muted" style="margin-top:14px">Respaldo completo: copie la carpeta <code>sistema/data</code> (base de datos y documentos) con el servidor apagado. Recomendación: haga una copia semanal en un disco externo o nube privada.</p></div>`;
      $('#resp', cf).addEventListener('click', () => { window.location.href = '/api/respaldo'; });
      return;
    }
    if (!edCfg) {
      $$('#fc input, #fc select', cf).forEach((x) => { x.disabled = true; });
      $('#fc button[type=submit]', cf).replaceWith(Object.assign(document.createElement('span'), { className: 'badge info', textContent: '👁️ Solo lectura' }));
    }
    $('#fc', cf).addEventListener('submit', (e) => { e.preventDefault(); if (edCfg) guardar(e.target); });
  };

  // ───────────────────────── Mi cuenta y seguridad ─────────────────────────
  const ETQ_BITACORA = { acceso: '✅ Acceso', acceso_fallido: '⛔ Acceso fallido', instalacion: '🛠️ Instalación', cambio_clave: '🔑 Cambio de clave', cambio_clave_fallido: '⛔ Cambio de clave fallido', restablecer_clave: '🔑 Restablecimiento', integraciones: '🔌 Integraciones', integracion_error: '⚠️ Error de integración', crear: '➕ Crear', editar: '✏️ Editar', eliminar: '🗑️ Eliminar', nomina: '💵 Nómina', configuracion: '⚙️ Configuración', respaldo: '💾 Respaldo', sesiones: '🔒 Sesiones', usuarios: '👤 Usuarios' };

  async function integraciones(el) {
    const { unity: u } = await api('GET', '/api/integraciones');
    el.innerHTML = `<div class="card"><h2>📈 Unity Ads — ingresos por anuncios</h2>
      <p>Descarga cada hora los ingresos, vistas e inicios de anuncios de tus juegos y los muestra en el Panel y en Juegos → Ingresos Unity Ads.</p>
      <div class="alerta ${u.ultimo_error ? 'bad' : u.ultima_sync ? 'info' : 'warn'}">${u.ultimo_error ? `⛔ ${esc(u.ultimo_error)}` : u.ultima_sync ? `✅ Conectado. Última sincronización: ${esc(fts(Date.parse(u.ultima_sync)))}` : u.clave_configurada ? 'Clave guardada. Pulse «Sincronizar ahora» para probar la conexión.' : 'Sin configurar.'}</div>
      <form class="form-grid" id="fi" autocomplete="off">
        <label><span>Organization core ID <span class="req">*</span></span><input name="unity_org_id" value="${esc(u.org_id)}" placeholder="Ej.: 1234567890123" spellcheck="false"></label>
        <label><span>Clave de «Monetization Stats API» ${u.clave_configurada ? '<span class="badge ok">guardada</span>' : '<span class="req">*</span>'}</span><input name="unity_clave" type="password" autocomplete="new-password" spellcheck="false" placeholder="${u.clave_configurada ? 'Déjelo vacío para conservar la actual' : 'Pegue aquí la clave'}"></label>
        <label><span>TRM (pesos por dólar)</span><input name="trm" type="number" step="any" min="1" value="${esc(u.trm)}"></label>
        <label class="check"><input type="checkbox" name="unity_contabilizar" ${u.contabilizar ? 'checked' : ''}> Registrar el ingreso estimado de cada mes en Contabilidad</label>
        <div class="wide toolbar"><button class="primary" type="submit">Guardar</button><button type="button" id="fi-sync" ${u.clave_configurada || u.org_id ? '' : 'disabled'}>🔄 Sincronizar ahora</button>${u.clave_configurada ? '<button type="button" class="danger" id="fi-borrar">Borrar clave</button>' : ''}</div>
      </form>
      <details><summary class="small"><b>¿Dónde encuentro estos datos?</b></summary><ol class="small">
        <li>Entre a <b>Unity Cloud Dashboard</b> → menú <b>Monetization</b> → <b>Settings / Configuración</b> → <b>API management / Gestión de API</b>.</li>
        <li>En <b>«Acceso a la API de Monetization Stats»</b> pulse <b>Crear</b> (o regenerar) y copie la clave. <i>No use la «API pública de Publisher» ni una cuenta de servicio.</i></li>
        <li>El <b>Organization core ID</b> está en la configuración de su organización en el mismo dashboard (<b>Administration → Organization settings</b>).</li>
        <li>Opcional: en Juegos → Portafolio, escriba el <b>Game ID de Unity</b> de cada juego para ver su nombre en los reportes.</li></ol>
        <p class="small muted">🔒 La clave se guarda solo en esta computadora, nunca se muestra de nuevo, no viaja al navegador de los usuarios ni se incluye en los respaldos. No la comparta por chat o correo.</p></details></div>`;
    const f = $('#fi', el);
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api('PUT', '/api/integraciones', { unity_org_id: f.unity_org_id.value, unity_clave: f.unity_clave.value || undefined, trm: f.trm.value, unity_contabilizar: f.unity_contabilizar.checked });
        toast('Integración guardada');
        if (f.unity_clave.value) {
          f.unity_clave.value = '';
          try { const r = await api('POST', '/api/integraciones/unity/sincronizar', {}); toast(`¡Conectado con Unity! ${r.filas} registros descargados`); } catch (err) { fallo(err); }
        }
        integraciones(el);
      } catch (err) { fallo(err); }
    });
    $('#fi-sync', el).addEventListener('click', async (e) => {
      e.target.disabled = true; e.target.textContent = 'Sincronizando…';
      try { const r = await api('POST', '/api/integraciones/unity/sincronizar', {}); toast(`Sincronizado: ${r.filas} registros`); } catch (err) { fallo(err); }
      integraciones(el);
    });
    $('#fi-borrar', el)?.addEventListener('click', async () => {
      if (!(await confirmar('¿Borrar la clave de Unity? La sincronización se detendrá hasta que guarde una nueva.', { ok: 'Borrar' }))) return;
      try { await api('PUT', '/api/integraciones', { borrar_clave: true }); toast('Clave borrada'); integraciones(el); } catch (err) { fallo(err); }
    });
  }

  VISTAS.seguridad = async (el) => {
    const s = await api('GET', '/api/seguridad');
    const fallidos = s.bitacora.filter((b) => b.accion === 'acceso_fallido' && Date.now() - Date.parse(b.fecha) < 7 * 864e5).length;
    const propias = s.sesiones.filter((x) => x.usuario === S.yo.usuario).length;
    el.innerHTML = `
      <div class="kpis">
        ${kpi('Usuario', esc(S.yo.principal ? 'admin (principal)' : S.yo.usuario), esc(S.yo.rol))}
        ${s.principal ? kpi('Número de empresa', esc(s.cuenta.numero)) : ''}
        ${kpi('Contraseña cambiada', s.cuenta.clave_cambiada ? esc(fts(Date.parse(s.cuenta.clave_cambiada))) : '—')}
        ${kpi(s.admin ? 'Sesiones abiertas (todos)' : 'Mis sesiones abiertas', String(s.admin ? s.sesiones.length : propias))}
        ${s.admin ? kpi('Accesos fallidos (7 días)', String(fallidos), '', fallidos ? 'bad' : 'ok') : ''}
      </div>
      <div class="cols-2">
        <div class="card"><h2>🔑 ${s.principal ? 'Cambiar credenciales' : 'Cambiar mi contraseña'}</h2>
          <form class="grid" id="fk" autocomplete="off">
            <label><span>Contraseña actual <span class="req">*</span></span><input type="password" name="actual" required autocomplete="current-password"></label>
            ${s.principal ? `<label>Nuevo número de empresa (opcional)<input name="numero" placeholder="${esc(s.cuenta.numero)}"></label>` : ''}
            <label>Nueva contraseña${s.principal ? ' (opcional)' : ''}<input type="password" name="nueva" autocomplete="new-password" minlength="10"></label>
            <label>Repita la nueva contraseña<input type="password" name="nueva2" autocomplete="new-password"></label>
            <button class="primary" type="submit">Actualizar</button></form>
          <p class="small muted">Al cambiar la contraseña se cierran sus demás sesiones. ${s.principal ? 'Si la olvida, ejecute <code>npm run restablecer-clave</code> en la computadora donde está instalado el sistema.' : 'Si la olvida, pídale al administrador que se la restablezca.'}</p></div>
        <div class="card"><h2>💻 ${s.admin ? 'Sesiones abiertas' : 'Mis sesiones'}</h2>
          <ul class="lista">${s.sesiones.map((x) => `<li><span>${x.actual ? '<b>Esta sesión</b>' : 'Otra sesión'}${s.admin ? ` · 👤 ${esc(x.usuario)}` : ''} · ${esc(x.ip)}<br><span class="small muted">${esc(x.agente.slice(0, 70))}</span></span><span class="small muted">${esc(fts(x.ultimo))}</span></li>`).join('')}</ul>
          ${s.sesiones.length > 1 ? `<button class="danger" id="cerrar-otras">${s.admin ? 'Cerrar todas las demás sesiones' : 'Cerrar mis demás sesiones'}</button>` : ''}
          <h3 style="margin-top:18px">Medidas de seguridad activas</h3>
          <ul class="small">
            <li>Contraseñas cifradas con scrypt y sal aleatoria (no reversibles).</li>
            <li>Cada persona entra con su propio usuario y solo ve los módulos que el administrador le permite.</li>
            <li>Bloqueo de 15 min tras 5 intentos fallidos por equipo y por usuario.</li>
            <li>Cierre automático tras ${esc(S.config.sesion_minutos)} min sin uso y máximo 12 h por sesión.</li>
            <li>Cookies HttpOnly + SameSite=Strict y protección contra CSRF y XSS (CSP).</li>
            <li>Bitácora de todas las acciones, con el usuario que las hizo.</li></ul></div>
      </div>
      <div class="card"><h2>📜 ${s.admin ? 'Bitácora de seguridad y actividad' : 'Mi actividad reciente'}</h2>
        <div class="toolbar"><input type="search" id="qb" placeholder="Filtrar por usuario, evento o detalle…"></div>
        <div class="tabla-wrap"><table><thead><tr><th>Fecha</th><th>Usuario</th><th>Evento</th><th>Detalle</th><th>IP</th></tr></thead>
        <tbody id="tb-bit">${s.bitacora.map((b) => `<tr><td class="small">${esc(fts(Date.parse(b.fecha)))}</td><td>${esc(b.usuario || '')}</td><td>${esc(ETQ_BITACORA[b.accion] || b.accion)}</td><td>${esc(b.detalle)}</td><td class="small muted">${esc(b.ip)}</td></tr>`).join('')}</tbody></table></div></div>`;
    $('#qb', el).addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      $$('#tb-bit tr', el).forEach((tr) => { tr.hidden = q && !tr.textContent.toLowerCase().includes(q); });
    });
    $('#fk', el).addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      if (f.nueva.value !== f.nueva2.value) return toast('Las contraseñas nuevas no coinciden', true);
      if (!f.nueva.value && !(f.numero && f.numero.value)) return toast(s.principal ? 'Escriba un nuevo número o una nueva contraseña' : 'Escriba la nueva contraseña', true);
      try { await api('POST', '/api/cambiar-clave', { actual: f.actual.value, numero: (f.numero && f.numero.value) || null, nueva: f.nueva.value || null }); toast('Credenciales actualizadas'); router(); } catch (err) { fallo(err); }
    });
    $('#cerrar-otras', el)?.addEventListener('click', async () => { try { await api('POST', '/api/cerrar-otras', {}); toast('Sesiones cerradas'); router(); } catch (e) { fallo(e); } });
  };

  // ───────────────────────── Usuarios y permisos ─────────────────────────
  const NIV_TXT = { no: '—', ver: '👁️ Ver', editar: '✏️ Editar' };
  function claveAleatoria() {
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
    const dig = '23456789';
    const todos = abc + dig;
    const r = new Uint32Array(12);
    crypto.getRandomValues(r);
    let c = [...r].map((x) => todos[x % todos.length]).join('');
    // garantiza letras y números
    c = abc[r[0] % abc.length] + dig[r[1] % dig.length] + c.slice(2);
    return c;
  }
  const sugerirUsuario = (nombre) => {
    const p = String(nombre || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/).filter(Boolean);
    return p.length > 1 ? `${p[0]}.${p[p.length > 2 ? 2 : 1]}` : p[0] || '';
  };
  function mostrarCredenciales(u, clave) {
    const m = modal('Datos de acceso', `<p>Entregue estos datos a <b>${esc(u.nombre)}</b> en persona o por un medio privado. Al entrar por primera vez el sistema le pedirá crear su propia contraseña.</p>
      <div class="tabla-wrap"><table><tbody>
        <tr><th>Número de empresa</th><td><b>${esc(S.config.nit || '(el NIT de la empresa)')}</b></td></tr>
        <tr><th>Usuario</th><td><b>${esc(u.usuario)}</b></td></tr>
        <tr><th>Contraseña temporal</th><td><b><code id="cred-clave">${esc(clave)}</code></b></td></tr>
      </tbody></table></div>
      <p class="small muted">Por seguridad, esta contraseña no se volverá a mostrar.</p>`,
      { tam: 'sm', pie: '<button id="cred-copiar">📋 Copiar</button><button class="primary" data-cerrar>Listo</button>' });
    $('#cred-copiar', m.el).addEventListener('click', async () => {
      const txt = `Sistema de gestión ${S.config.razon_social}\nNúmero de empresa: ${S.config.nit}\nUsuario: ${u.usuario}\nContraseña temporal: ${clave}`;
      try { await navigator.clipboard.writeText(txt); toast('Copiado'); } catch { toast('No se pudo copiar; selecciónelo manualmente', true); }
    });
  }

  async function formUsuario(u, re, empleado) {
    try { await cargarOpc('usuarios', 'empleados'); } catch (e) { return fallo(e); }
    const roles = S.yo.roles, mods = S.yo.modulos;
    const d = u ? { ...u } : { nombre: empleado ? `${empleado.nombres} ${empleado.apellidos}` : '', empleado_id: empleado ? empleado.id : null, rol: 'Consulta', activo: 1 };
    if (!u) d.usuario = sugerirUsuario(d.nombre);
    const permisos = { ...(u ? u.permisos : roles[d.rol].permisos) };
    const m = modal(u ? `Editar usuario · ${u.usuario}` : 'Nuevo usuario', `<form class="form-grid" id="fu" autocomplete="off">
      <label><span>Nombre completo <span class="req">*</span></span><input name="nombre" value="${esc(d.nombre)}" required maxlength="120"></label>
      <label><span>Usuario para entrar <span class="req">*</span></span><input name="usuario" value="${esc(d.usuario)}" required maxlength="40" autocapitalize="none" spellcheck="false" placeholder="ej.: laura.martinez"></label>
      <label>Empleado vinculado<select name="empleado_id"><option value="">— Ninguno (externo) —</option>${(S.opc.empleados || []).map((e) => `<option value="${e.id}" ${e.id === d.empleado_id ? 'selected' : ''}>${esc(titulo('empleados', e))}</option>`).join('')}</select></label>
      <label><span>Rol <span class="req">*</span></span><select name="rol">${Object.keys(roles).map((r) => `<option ${r === d.rol ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select></label>
      <p class="wide small muted" id="rol-desc"></p>
      <div class="wide"><b class="small">Permisos por módulo</b>
        <div class="tabla-wrap" style="margin-top:6px"><table><thead><tr><th>Módulo</th><th>Sin acceso</th><th>Ver</th><th>Editar</th></tr></thead>
        <tbody id="matriz">${Object.entries(mods).map(([k, l]) => `<tr><td>${esc(l)}</td>${['no', 'ver', 'editar'].map((n) => `<td><input type="radio" name="p_${k}" value="${n}" aria-label="${esc(l)}: ${n}"></td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <p class="small muted">«Ver» permite consultar e imprimir; «Editar» además crear, modificar y eliminar. Para elegir los permisos uno a uno, use el rol «Personalizado».</p></div>
      <label><span>${u ? 'Nueva contraseña temporal (opcional)' : 'Contraseña temporal <span class="req">*</span></span>'}<input name="clave" value="${u ? '' : esc(claveAleatoria())}" maxlength="200" autocomplete="off"></label>
      <div style="align-self:end"><button type="button" id="gen-clave">🎲 Generar contraseña</button></div>
      ${u ? `<label class="check wide"><input type="checkbox" name="activo" ${u.activo ? 'checked' : ''}> Usuario activo (puede entrar al sistema)</label>` : ''}
    </form>`, { pie: '<button data-cerrar>Cancelar</button><button class="primary" id="fu-ok">Guardar</button>' });
    const f = $('#fu', m.el);
    const pintarMatriz = () => {
      const rol = f.rol.value, pers = rol === 'Personalizado';
      $('#rol-desc', m.el).textContent = roles[rol].descripcion;
      const base = pers ? permisos : roles[rol].permisos;
      for (const k of Object.keys(mods)) {
        for (const r of f.querySelectorAll(`[name=p_${k}]`)) { r.checked = r.value === (base[k] || 'no'); r.disabled = !pers; }
      }
    };
    f.rol.addEventListener('change', () => {
      if (f.rol.value === 'Personalizado') {
        // parte de lo que estaba marcado para no empezar de cero
        for (const k of Object.keys(mods)) { const sel = f.querySelector(`[name=p_${k}]:checked`); permisos[k] = sel ? sel.value : 'no'; }
      }
      pintarMatriz();
    });
    f.addEventListener('change', (e) => { if (e.target.name && e.target.name.startsWith('p_')) permisos[e.target.name.slice(2)] = e.target.value; });
    pintarMatriz();
    f.empleado_id.addEventListener('change', () => {
      const e = (S.opc.empleados || []).find((x) => x.id === Number(f.empleado_id.value));
      if (e && !f.nombre.value) f.nombre.value = titulo('empleados', e);
      if (e && !u && !f.usuario.dataset.tocado) f.usuario.value = sugerirUsuario(titulo('empleados', e));
    });
    f.nombre.addEventListener('input', () => { if (!u && !f.usuario.dataset.tocado) f.usuario.value = sugerirUsuario(f.nombre.value); });
    f.usuario.addEventListener('input', () => { f.usuario.dataset.tocado = '1'; });
    $('#gen-clave', m.el).addEventListener('click', () => { f.clave.value = claveAleatoria(); });
    $('#fu-ok', m.el).addEventListener('click', async () => {
      const body = { nombre: f.nombre.value, usuario: f.usuario.value, empleado_id: f.empleado_id.value || null, rol: f.rol.value, permisos };
      if (f.clave.value) body.clave = f.clave.value;
      if (u) body.activo = f.activo.checked;
      const btn = $('#fu-ok', m.el); btn.disabled = true;
      try {
        const r = u ? await api('PUT', `/api/usuarios/${u.id}`, body) : await api('POST', '/api/usuarios', body);
        m.cerrar(); toast('Usuario guardado'); re && re();
        if (body.clave) mostrarCredenciales(r, body.clave);
      } catch (e) { fallo(e); btn.disabled = false; }
    });
  }

  VISTAS.usuarios = async (el) => {
    const [lista] = await Promise.all([api('GET', '/api/usuarios'), cargarOpc('usuarios', 'empleados')]);
    const mods = S.yo.modulos;
    const re = () => VISTAS.usuarios(el);
    el.innerHTML = `
      <div class="toolbar"><input type="search" id="q" placeholder="Buscar usuario…"><span class="grow"></span><button class="primary" id="nuevo">＋ Nuevo usuario</button></div>
      <div class="alerta info">El <b>administrador principal</b> entra con el número de empresa y la contraseña maestra, dejando el campo «Usuario» vacío (o escribiendo <code>admin</code>). Cada empleado entra con el número de empresa + su propio usuario y contraseña, y solo ve los módulos que usted le permita.</div>
      <div class="kpis">${kpi('Usuarios activos', String(lista.filter((u) => u.activo).length))}${kpi('Administradores', String(lista.filter((u) => u.activo && u.rol === 'Administrador').length + 1), 'Incluye al principal')}${kpi('Con contraseña temporal', String(lista.filter((u) => u.debe_cambiar && u.activo).length), 'Aún no han entrado')}</div>
      <div class="tabla-wrap" id="tabla">${lista.length ? `<table><thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Empleado</th><th>Acceso a</th><th>Estado</th><th>Último acceso</th><th></th></tr></thead><tbody>
        ${lista.map((u) => `<tr data-id="${u.id}"><td><b>${esc(u.nombre)}</b></td><td><code>${esc(u.usuario)}</code></td><td><span class="badge ${u.rol === 'Administrador' ? 'bad' : 'info'}">${esc(u.rol)}</span></td>
          <td>${esc(refLabel('empleados', u.empleado_id))}</td>
          <td class="small">${u.rol === 'Administrador' ? 'Todo' : Object.entries(u.permisos).filter(([, n]) => n !== 'no').map(([k, n]) => `<span title="${n === 'editar' ? 'Puede editar' : 'Solo ver'}">${n === 'editar' ? '✏️' : '👁️'} ${esc(mods[k])}</span>`).join(' · ') || '<span class="muted">Ningún módulo</span>'}</td>
          <td>${u.activo ? (u.debe_cambiar ? '<span class="badge warn">Clave temporal</span>' : '<span class="badge ok">Activo</span>') : '<span class="badge">Desactivado</span>'}</td>
          <td class="small muted">${u.ultimo_acceso ? esc(fts(Date.parse(u.ultimo_acceso))) : 'Nunca'}</td>
          <td class="acciones"><button class="sm" data-a="editar">✏️ Editar</button> <button class="sm" data-a="clave" title="Restablecer contraseña">🔑</button> <button class="sm" data-a="activo">${u.activo ? '⏸️ Desactivar' : '▶️ Activar'}</button> <button class="sm danger" data-a="borrar" title="Eliminar">🗑️</button></td></tr>`).join('')}
        </tbody></table>` : '<div class="vacio">Aún no hay usuarios. Cree uno para cada persona que vaya a usar el sistema; también puede hacerlo desde Empleados con el botón «👤 Usuario».</div>'}</div>
      <div class="card" style="margin-top:18px"><h2>Roles disponibles</h2><div class="tabla-wrap"><table><thead><tr><th>Rol</th><th>Para quién</th>${Object.values(mods).map((l) => `<th class="small">${esc(l)}</th>`).join('')}</tr></thead><tbody>
        ${Object.entries(S.yo.roles).filter(([r]) => r !== 'Personalizado').map(([r, x]) => `<tr><td><b>${esc(r)}</b></td><td class="small">${esc(x.descripcion)}</td>${Object.keys(mods).map((k) => `<td class="small">${NIV_TXT[x.permisos[k]]}</td>`).join('')}</tr>`).join('')}
      </tbody></table></div></div>`;
    $('#nuevo', el).addEventListener('click', () => formUsuario(null, re));
    $('#q', el).addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      $$('#tabla tbody tr', el).forEach((tr) => { tr.hidden = q && !tr.textContent.toLowerCase().includes(q); });
    });
    $('#tabla', el).addEventListener('click', async (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const u = lista.find((x) => x.id === Number(b.closest('tr').dataset.id));
      try {
        if (b.dataset.a === 'editar') formUsuario(u, re);
        else if (b.dataset.a === 'clave') {
          if (!(await confirmar(`¿Restablecer la contraseña de ${u.nombre}? Se cerrarán sus sesiones y deberá crear una nueva al entrar.`, { ok: 'Restablecer', peligro: false }))) return;
          const clave = claveAleatoria();
          const r = await api('PUT', `/api/usuarios/${u.id}`, { clave });
          mostrarCredenciales(r, clave); re();
        } else if (b.dataset.a === 'activo') {
          await api('PUT', `/api/usuarios/${u.id}`, { activo: !u.activo });
          toast(u.activo ? 'Usuario desactivado y sus sesiones cerradas' : 'Usuario activado'); re();
        } else if (b.dataset.a === 'borrar') {
          if (!(await confirmar(`¿Eliminar el usuario «${u.usuario}»? Si solo quiere quitarle el acceso por un tiempo, es mejor desactivarlo.`))) return;
          await api('DELETE', `/api/usuarios/${u.id}`); toast('Usuario eliminado'); re();
        }
      } catch (err) { fallo(err); }
    });
  };

  iniciar();
})();
