'use strict';
// Cálculo de nómina mensual (Colombia). Todos los parámetros (SMMLV, auxilio de
// transporte, horas del mes, exoneración de aportes) se ajustan en Configuración.
// Es una herramienta de apoyo: valide siempre con su contador antes de pagar la PILA.

const ARL = { 1: 0.00522, 2: 0.01044, 3: 0.02436, 4: 0.0435, 5: 0.0696 };
const r = (n) => Math.round(Number(n) || 0);
const num = (v, d = 0) => (Number.isFinite(Number(v)) && v !== '' && v !== null ? Number(v) : d);

function fspPct(ibc, smmlv) {
  const v = ibc / smmlv;
  if (v < 4) return 0;
  if (v < 16) return 0.01;
  if (v < 17) return 0.012;
  if (v < 18) return 0.014;
  if (v < 19) return 0.016;
  if (v < 20) return 0.018;
  return 0.02;
}

// Días laborados del periodo (AAAA-MM) según fechas de ingreso y retiro, base 30.
function diasDelPeriodo(emp, periodo) {
  const [y, m] = periodo.split('-').map(Number);
  const ultimo = new Date(Date.UTC(y, m, 0)).getUTCDate();
  let desde = 1, hasta = 30;
  if (emp.fecha_ingreso) {
    const [iy, im, id] = emp.fecha_ingreso.split('-').map(Number);
    if (iy > y || (iy === y && im > m)) return 0;
    if (iy === y && im === m) desde = Math.min(id, 30);
  }
  if (emp.fecha_retiro) {
    const [ry, rm, rd] = emp.fecha_retiro.split('-').map(Number);
    if (ry < y || (ry === y && rm < m)) return 0;
    if (ry === y && rm === m) hasta = rd >= ultimo ? 30 : Math.min(rd, 30);
  }
  return Math.max(0, hasta - desde + 1);
}

function calcular(emp, nov, cfg) {
  const smmlv = num(cfg.smmlv, 1);
  const aux = num(cfg.aux_transporte);
  const horasMes = num(cfg.horas_mes, 210) || 210;
  const recDom = num(cfg.recargo_dominical, 0.9);
  const exoneracion = String(cfg.exoneracion_aportes) === '1';

  const salario = num(emp.salario);
  const integral = !!emp.salario_integral;
  const dias = Math.max(0, Math.min(30, num(nov.dias, 30)));
  const vh = salario / horasMes;

  const basico = r((salario * dias) / 30);
  const extras = r(vh * (
    1.25 * num(nov.he_diurnas) +
    1.75 * num(nov.he_nocturnas) +
    0.35 * num(nov.recargo_nocturno) +
    recDom * num(nov.horas_dominicales)
  ));
  const comisiones = r(nov.comisiones);
  const bonificacion = r(nov.bonificacion);          // no constitutiva de salario
  const devSalarial = basico + extras + comisiones;
  const auxTransporte = !integral && dias > 0 && salario <= 2 * smmlv && !nov.sin_aux ? r((aux * dias) / 30) : 0;
  const devengado = devSalarial + auxTransporte + bonificacion;

  let ibc = integral ? devSalarial * 0.7 : devSalarial;
  if (dias > 0) ibc = Math.max(ibc, (smmlv * dias) / 30);
  ibc = r(Math.min(ibc, 25 * smmlv));

  const salud = r(ibc * 0.04);
  const pension = r(ibc * 0.04);
  const fsp = r(ibc * fspPct(ibc, smmlv));
  const retencion = r(nov.retencion);
  const otrasDed = r(nov.otras_deducciones);
  const deducciones = salud + pension + fsp + retencion + otrasDed;
  const neto = devengado - deducciones;

  const exon = exoneracion && ibc < 10 * smmlv;
  const ap = {
    salud: exon ? 0 : r(ibc * 0.085),
    pension: r(ibc * 0.12),
    arl: r(ibc * (ARL[emp.riesgo_arl] || ARL[1])),
    caja: r(ibc * 0.04),
    icbf: exon ? 0 : r(ibc * 0.03),
    sena: exon ? 0 : r(ibc * 0.02),
  };
  const aportes = Object.values(ap).reduce((a, b) => a + b, 0);

  const basePrest = devSalarial + auxTransporte;
  const pr = integral
    ? { cesantias: 0, intereses: 0, prima: 0, vacaciones: r(basico * 0.0417) }
    : {
        cesantias: r(basePrest * 0.0833),
        intereses: r(basePrest * 0.0833 * 0.12),
        prima: r(basePrest * 0.0833),
        vacaciones: r(basico * 0.0417),
      };
  const provisiones = Object.values(pr).reduce((a, b) => a + b, 0);

  return {
    dias, salario, integral, basico, extras, comisiones, bonificacion, auxTransporte,
    devengado, ibc, salud, pension, fsp, fspPct: fspPct(ibc, smmlv), retencion, otrasDed,
    deducciones, neto, exonerado: exon, aportesEmpresa: ap, aportes, provisionesDet: pr,
    provisiones, costoTotal: devengado + aportes + provisiones,
    pila: salud + pension + fsp + aportes,
  };
}

function totales(detalles) {
  const t = { empleados: 0, devengado: 0, deducciones: 0, neto: 0, aportes: 0, provisiones: 0, costoTotal: 0, pila: 0 };
  for (const d of detalles) {
    const c = d.calculo;
    t.empleados++;
    for (const k of Object.keys(t)) if (k !== 'empleados') t[k] += c[k] || 0;
  }
  return t;
}

module.exports = { calcular, totales, diasDelPeriodo };
