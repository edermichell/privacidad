// "Cerebro" de la víctima: Claude (vía /api/turn) o, si no hay IA, un cerebro offline con reglas.
export async function checkAI() {
  if (location.protocol === 'file:') return { ai: false, models: [] }; // abierto como archivo: sin servidor
  try {
    const r = await fetch('/api/status', { cache: 'no-store' });
    if (!r.ok) throw new Error();
    return await r.json();
  } catch {
    return { ai: false, models: [] };
  }
}

export async function aiTurn(payload) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 30000);
  try {
    const r = await fetch('/api/turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    if (!r.ok) throw new Error('http ' + r.status);
    const j = await r.json();
    return { ...j, source: 'ai' };
  } finally {
    clearTimeout(to);
  }
}

// ---------------------------------------------------------------------------
// Cerebro offline
// ---------------------------------------------------------------------------
const norm = (s) =>
  String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s$]/g, ' ').replace(/\s+/g, ' ').trim();

const RX = {
  cortesia: /\b(buenas|buenos dias|buenas tardes|buenas noches|hola|con gusto|disculpe|disculpa|por favor|gracias|encantad[oa]|un placer|senor|senora|usted)\b/,
  autoridad: /\b(banco|policia|gobierno|hacienda|sat|microsoft|apple|amazon|google|soporte|departamento|oficial|licenciado|ingeniero|doctor|agente|seguridad|certificad[oa]|folio|ticket|sucursal|paqueteria|aduana|fedex|dhl|empleado)\b/,
  empatia: /\b(entiendo|tranquil[oa]|no se preocupe|no te preocupes|le ayudo|te ayudo|estoy aqui|lamento|siento|abuela|abuelita|tia|tio|mama|papa|familia|carino|mi amor|mija|mijo|sin compromiso|me preocupa)\b/,
  urgencia: /\b(urgente|ahora mismo|inmediatamente|ya mismo|rapido|rapidito|ultima oportunidad|se vence|expira|caduca|hoy mismo|antes de que|cuanto antes|no hay tiempo|de inmediato|minutos)\b/,
  secreto: /\b(no le diga|no le cuente|no digas|no cuentes|secreto|confidencial|no cuelgue|no cuelgues|no hable con|no le diga a nadie|entre nosotros)\b/,
  amenaza: /\b(arrest\w*|carcel|multa|demanda|bloquear|bloqueada|bloqueado|congelar|cancelar|suspender|suspendida|embargo|denuncia|perdera|consecuencias|virus|hackeo|hackeado|hackers?)\b/,
  pagoRaro: /\b(tarjetas? de regalo|gift ?cards?|itunes|google play|steam|bitcoin|cripto\w*|western union|giro|efectivo|oxxo|cupon|cupones|vouchers?)\b/,
  pagoNormal: /\b(transferencia|transferir|deposito|depositar|pagar|pague|pagas|cobro|cuenta segura|numero de cuenta|clabe|mande dinero|envie dinero|manda dinero|envia dinero|pago|invertir|inversion)\b/,
  datos: /\b(contrasena|password|clave|nip|cvv|codigo|numero de tarjeta|tarjeta de credito|tarjeta de debito|token|sms|pin|acceso remoto|anydesk|teamviewer)\b/,
  agresion: /\b(idiota|estupid[oa]|pendej[oa]|cabron|imbecil|callate|vieja|viejo|inutil|tonta|tonto|maldit[oa]|chingad[oa]|puta|mierda)\b/,
  prueba: /\b(otros clientes|miles de personas|mucha gente|testimonio|garantizad[oa]|ya ganaron|todos ganan|ganancias|rendimiento|triplic\w*)\b/,
  verifica: /\b(mi nombre es|me llamo|soy el|soy la|numero de empleado|id de empleado|folio|extension|\d{3,})\b/,
  promesa: /\b(es seguro|segur[oa]|garantiz\w+|le aseguro|te aseguro|se lo juro|te lo juro|le juro|confie|confia|de confianza|no pasa nada|sin riesgo|legitim[oa]|es verdad|es cierto|es real|se lo prometo)\b/,
  // Rasgos concretos para responder a "¿cómo sé que es cierto?"
  fNum: /(\d{3,}|\bfolio\b|\bticket\b|\bcaso\b|\bempleado\b|\bextension\b|\bsucursal\b|\bcedula\b|\bcredencial\b)/,
  fName: /\b(mi nombre es|me llamo|soy [a-z]+ [a-z]+|habla [a-z]+ [a-z]+|le habla [a-z]+)\b/,
  fChannel: /\b(correo|email|mensaje|pagina|sitio|web|link|enlace|numero oficial|llame|llamar|marque|verifique|verificar|compruebe|comprobar|comprobante|documento|expediente|registro|app|aplicacion|estado de cuenta|reverso|tarjeta|sucursal)\b/,
  fWhy: /\b(porque|para que|ya que|debido|es que|con el fin|motivo|razon|se debe|necesario|requisito|trato|procedimiento|politica|reglamento)\b/,
  fOrg: /\b(banco|empresa|compania|departamento|oficina|gobierno|microsoft|apple|amazon|paqueteria|aduana|sorteo|plataforma|corporativo)\b/,
};

const THOUGHTS = {
  pickup: ['Número desconocido... ¿será importante?', 'A ver quién es ahora.'],
  neutral: ['Mmm, no sé a dónde va esto.', 'Sigo escuchando, pero con cuidado.'],
  warm: ['Parece buena persona, la verdad.', 'Qué atento. Igual y sí es de fiar.'],
  confused: ['No entendí nada de lo que dijo.', 'Esto no tiene sentido.'],
  suspicious: ['Algo no me cuadra aquí.', 'Esto huele a trampa.'],
  probe: ['Voy a pedirle datos para verificar.', 'Que se identifique bien.'],
  hesitate: ['¿Dinero? Ni de chiste... ¿o sí?', 'No sé si fiarme de esto.'],
  agree: ['Bueno, qué más da, voy a hacerlo.', 'Me convenció, aunque quién sabe.'],
  hangup: ['Ya, se acabó, cuelgo.', 'Qué pérdida de tiempo.'],
  police: ['Esto es un fraude clarísimo. A denunciar.', 'Tengo todo para reportarlo.'],
  silence: ['¿Se habrá cortado?'],
  proofOk: ['Eso al menos tiene sentido.', 'Me explicó bien, parece razonable.'],
  insist: ['No me está respondiendo, qué raro.', 'Sigue evadiendo mi pregunta.'],
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function createOfflineBrain(victim, pretext) {
  const used = new Set();
  const { gullible: g, savvy: sv, paranoia: pa } = victim;
  const weak = victim.weakness.includes(pretext.id);
  const firstName = norm(victim.name).split(' ').pop();
  const kws = victim.keywords.map(norm);
  let asked = 0;
  let probes = 0;
  let convince = 0; // cada duda resuelta baja la barrera para aceptar pagar
  let pending = null; // objeción abierta de la víctima: { fails }
  let lastText = '';

  const pickFrom = (arr, key) => {
    let pool = arr.filter((x) => !used.has(key + x));
    if (!pool.length) { arr.forEach((x) => used.delete(key + x)); pool = arr; }
    const choice = pool[Math.floor(Math.random() * pool.length)];
    used.add(key + choice);
    return choice;
  };
  const line = (cat) => pickFrom(victim.lines[cat] || victim.lines.neutral, victim.id + cat);
  const thought = (cat) => pickFrom(THOUGHTS[cat] || THOUGHTS.neutral, 't' + cat);
  const out = (cat, mood, t, s, action = 'none', tags = []) => ({
    say: line(cat), mood, trust_delta: t, suspicion_delta: s, action, tags, thought: thought(cat), source: 'offline',
  });

  // ¿Cuántas pruebas concretas dio el jugador? (número/folio, nombre, canal verificable, motivo, organización)
  const concreteCount = (n) => ['fNum', 'fName', 'fChannel', 'fWhy', 'fOrg'].filter((k) => RX[k].test(n)).length;

  return {
    startTrust: () => clamp(Math.round(20 + (weak ? 10 : 0) - sv * 10 + g * 6), 5, 60),
    startSuspicion: () => Math.round(5 + pa * 10),

    turn({ text, kind, state }) {
      if (kind === 'pickup') return out('pickup', 'neutral', 0, 0);
      if (kind === 'silence') return out('silence', 'confused', 0, 3);

      const n = norm(text);
      const words = n ? n.split(' ').length : 0;
      let t = 0, s = 0, matched = false, ask = false, rude = false;
      let answered = false, failed = false, flags = 0;
      const tags = [];
      const add = (id) => { if (!tags.includes(id)) tags.push(id); matched = true; };

      if (RX.cortesia.test(n)) { t += 3; matched = true; if (words >= 8) add('rapport'); }
      if (RX.autoridad.test(n)) { t += Math.round(4 + g * 10 - sv * 6); s += Math.round(sv * 4); add('autoridad'); }
      if (RX.empatia.test(n)) { t += Math.round(3 + g * 8); add('empatia'); }
      if (kws.some((k) => k && n.includes(k)) || (firstName.length > 2 && n.includes(firstName))) { t += 9; add('info_personal'); }
      if (RX.urgencia.test(n)) { t += Math.round((g - sv) * 6); s += Math.round(2 + sv * 8 + pa * 6); add('urgencia'); flags++; }
      if (RX.secreto.test(n)) { t -= 4; s += Math.round(10 + pa * 12); add('secreto'); flags++; }
      if (RX.amenaza.test(n)) { t += Math.round(g * 6 - sv * 4); s += Math.round(sv * 8 + pa * 4); add('amenaza'); if (g > 0.5) tags.push('miedo'); }
      if (RX.prueba.test(n)) { t += Math.round(g * 6); s += Math.round(sv * 3); add('prueba_social'); }
      if (RX.datos.test(n)) { s += Math.round(10 + sv * 14 + pa * 8 - state.trust / 10); add('pide_datos'); ask = true; flags++; }
      if (RX.pagoRaro.test(n)) { s += Math.round(8 + sv * 14 + pa * 6 - g * 6); add('pago_raro'); ask = true; flags++; }
      if (RX.pagoNormal.test(n)) { s += Math.round(3 + sv * 6); matched = true; ask = true; }
      if (RX.agresion.test(n)) { t -= 15; s += 25; rude = true; add('agresividad'); flags++; }

      // Promesas vacías ("es seguro", "se lo juro"): convencen a los crédulos, no a los listos
      if (RX.promesa.test(n)) {
        t += Math.round(g * 5 - sv * 3);
        if (sv >= 0.4) { s += Math.round(2 + sv * 5); add('promesas_vacias'); flags++; } else matched = true;
      }

      // --- ¿Está respondiendo a una duda abierta? ("¿cómo sé que es cierto?") ---
      if (pending) {
        const need = sv >= 0.7 ? 3 : sv >= 0.4 ? 2 : 1;
        const got = concreteCount(n) + (RX.promesa.test(n) && g > 0.6 ? 1 : 0);
        if (got >= need && words >= (sv >= 0.7 ? 8 : 4)) {
          answered = true; pending = null; convince++;
          t += 6 + Math.round(g * 4); s -= 3 + Math.round(sv * 4);
          add('historia_creible');
        } else {
          failed = true; pending.fails++;
          s += Math.round(3 + sv * 5 + pending.fails * 2); t -= 3;
          if (n && n === lastText) { s += 4; add('incoherencia'); }
          else if (!RX.agresion.test(n)) add('verificacion_evitada');
        }
      } else if (n && n === lastText) { s += 5; add('incoherencia'); flags++; }
      lastText = n;

      // La conversación coherente, sin banderas rojas, hace avanzar la confianza y baja un poco la sospecha
      if (!rude && !flags && !failed && words >= 4) { t += 1 + Math.round(g * 3); if (state.suspicion > 15) s -= 2; }
      if (words >= 18 && !rude) { t += 2; add('historia_creible'); }
      if (!matched && words > 3) matched = true;
      if (t > 0 && weak) t = Math.round(t * 1.25);

      let T = clamp(state.trust + t, 0, 100);
      let S = clamp(state.suspicion + s, 0, 100);

      // ¿Pidió pagar/dar el dato? ¿Se lo cree?
      let ok = false;
      if (ask) {
        asked++;
        const threshold = 55 + sv * 25 + pa * 10 - g * 10 - (weak ? 8 : 0) - Math.min(3, convince) * 8;
        ok = T >= threshold && S < 60 && !rude && !failed && !pending;
        if (!ok) s += Math.round(2 + Math.min(asked, 4) + sv * 3);
      }
      S = clamp(state.suspicion + s, 0, 100);

      const strongTags = ['pago_raro', 'pide_datos', 'secreto', 'agresividad', 'incoherencia', 'promesas_vacias'];
      const redFlags = tags.filter((x) => strongTags.includes(x)).length;

      // 1) Finales negativos: sospecha al límite, grosería o paciencia agotada con la duda sin responder
      const patienceOut = pending && pending.fails >= 3;
      if (S >= 100 || (rude && S >= 70) || patienceOut) {
        const police = Math.random() < (sv + pa) / 2.2 && !rude;
        return out(police ? 'police' : 'hangup', 'angry', t, s, police ? 'call_police' : 'hang_up', tags);
      }
      // 2) Acepta pagar
      if (ok) return out('agree', g > 0.5 ? 'happy' : 'worried', t, s, 'send_money', tags);
      // 3) Respondiste su duda: lo reconoce y la conversación avanza
      if (answered && !ask) return out('proofOk', S >= 45 ? 'neutral' : 'happy', t, s, 'none', tags);
      // 4) No respondiste su duda: insiste (con frase distinta cada vez)
      if (failed) return out('insist', S >= 60 ? 'angry' : 'suspicious', t, s, 'none', tags);
      // 5) Pide pagar sin convencerlo: expone una duda concreta que debes responder
      if (ask) { pending = { fails: 0 }; return out('hesitate', 'worried', t, s, 'none', tags); }
      // 6) Desconfía de la autoridad (o la sospecha sube): pide verificarte
      const wantsProbe = !pending && probes < 3 && ((sv >= 0.45 && tags.includes('autoridad') && state.turn <= 4) || (S >= 45 && sv >= 0.3));
      if (wantsProbe) { probes++; pending = { fails: 0 }; return out('probe', 'suspicious', t, s + 2, 'none', tags); }
      if (tags.includes('amenaza') && g > 0.5) return out('hesitate', 'scared', t, s, 'none', tags);
      if (S >= 45 || (redFlags > 0 && sv > 0.5)) return out('suspicious', S >= 70 ? 'angry' : 'suspicious', t, s, 'none', tags);
      if (!matched) return out('confused', 'confused', -1, 0, 'none', tags);
      if (T >= 40) return out('warm', 'happy', t, s, 'none', tags);
      return out('neutral', 'neutral', t, s, 'none', tags);
    },
  };
}
