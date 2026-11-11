import { VICTIMS, PRETEXTS, TACTICS, MODELS, DIFFICULTY_MULT, byId } from './data.js';
import { createAvatar } from './avatar.js';
import { checkAI, aiTurn, createOfflineBrain } from './brain.js';
import { Listener, speak, cancelSpeech, sttSupported, ttsSupported, startMicLevel, stopMicLevel, micLevel, startCamera, stopCamera, sfx } from './voice.js';

const $ = (id) => document.getElementById(id);
const COLORS = ['#ff5d73', '#35d0ba', '#ffc145', '#8b7bff', '#ff8a3d', '#4cc9f0'];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Crea un elemento con texto seguro (nunca innerHTML con datos del usuario).
function h(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) n.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null) n.append(kid.nodeType ? kid : document.createTextNode(kid));
  return n;
}

const S = {
  players: [{ name: 'Jugador 1' }, { name: 'Jugador 2' }],
  settings: { rounds: 1, duration: 150, mic: true, voice: true, sfx: true, model: MODELS[0].id },
  ai: { ai: false },
  queue: [], qi: 0,
  scores: [], best: [],
  sel: { victim: null, pretext: null },
  call: null,
  thumbs: [],
};

function load(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* sin almacenamiento */ } }

let toastTimer = 0;
function toast(msg, ms = 2800) {
  const t = $('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

function show(id) {
  for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== id;
  window.scrollTo(0, 0);
}

// ----------------------------------------------------------------------------
// MENÚ
// ----------------------------------------------------------------------------
function renderPlayers() {
  const ul = $('players');
  ul.textContent = '';
  S.players.forEach((p, i) => {
    const input = h('input', { type: 'text', maxlength: 16, value: p.name, 'aria-label': `Nombre del jugador ${i + 1}`, placeholder: `Jugador ${i + 1}` });
    input.addEventListener('input', () => { p.name = input.value; });
    ul.append(h('li', {},
      h('span', { class: 'swatch', style: `background:${COLORS[i % COLORS.length]}` }),
      input,
      S.players.length > 1 ? h('button', { class: 'btn ghost', type: 'button', 'aria-label': 'Quitar jugador', text: '✕', onclick: () => { S.players.splice(i, 1); renderPlayers(); } }) : null));
  });
  $('addPlayer').hidden = S.players.length >= 6;
}

async function initMenu() {
  const saved = load('scamcall.settings', {});
  Object.assign(S.settings, saved);
  S.players = load('scamcall.players', S.players).slice(0, 6);
  if (!S.players.length) S.players = [{ name: 'Jugador 1' }];

  S.ai = await checkAI();
  const sel = $('model');
  const list = S.ai.models?.length ? S.ai.models : MODELS;
  for (const m of list) sel.append(h('option', { value: m.id, text: m.label }));
  if (!list.some((m) => m.id === S.settings.model)) S.settings.model = S.ai.model || list[0].id;
  sel.value = S.settings.model;
  sel.disabled = !S.ai.ai;

  const st = $('aiStatus');
  if (S.ai.ai) {
    st.className = 'status ok';
    st.textContent = '🧠 IA de Claude conectada: las víctimas responden con conversación real.';
  } else {
    st.className = 'status warn';
    st.textContent = '🧩 Sin IA conectada: las víctimas usan el cerebro offline (reglas simples). Arranca el servidor con ANTHROPIC_API_KEY para conversaciones reales.';
  }
  const vs = $('voiceStatus');
  const issues = [];
  if (!sttSupported) issues.push('Tu navegador no tiene reconocimiento de voz (usa Chrome o Edge); podrás escribir.');
  if (!ttsSupported) issues.push('Tu navegador no tiene síntesis de voz; verás subtítulos.');
  if (issues.length) { vs.className = 'status warn'; vs.textContent = '🔇 ' + issues.join(' '); } else { vs.hidden = true; }

  $('rounds').value = S.settings.rounds;
  $('duration').value = S.settings.duration;
  $('optMic').checked = S.settings.mic && sttSupported;
  $('optMic').disabled = !sttSupported;
  $('optVoice').checked = S.settings.voice && ttsSupported;
  $('optVoice').disabled = !ttsSupported;
  $('optSfx').checked = S.settings.sfx;
  renderPlayers();
}

$('addPlayer').addEventListener('click', () => {
  if (S.players.length < 6) { S.players.push({ name: `Jugador ${S.players.length + 1}` }); renderPlayers(); }
});

$('startGame').addEventListener('click', () => {
  sfx.unlock();
  S.settings = {
    rounds: Number($('rounds').value), duration: Number($('duration').value),
    mic: $('optMic').checked, voice: $('optVoice').checked, sfx: $('optSfx').checked, model: $('model').value,
  };
  S.players = S.players.map((p, i) => ({ name: (p.name || '').trim().slice(0, 16) || `Jugador ${i + 1}` }));
  save('scamcall.settings', S.settings);
  save('scamcall.players', S.players);
  newGame();
});

function newGame() {
  S.queue = [];
  for (let r = 0; r < S.settings.rounds; r++) S.players.forEach((_, p) => S.queue.push({ player: p, round: r + 1 }));
  S.qi = 0;
  S.scores = S.players.map(() => 0);
  S.best = S.players.map(() => ({ money: 0, score: 0 }));
  S.sel = { victim: null, pretext: null };
  goPlan();
}

// ----------------------------------------------------------------------------
// PREPARACIÓN
// ----------------------------------------------------------------------------
function destroyThumbs() { S.thumbs.forEach((a) => a.destroy()); S.thumbs = []; }

function goPlan() {
  show('screen-plan');
  const turn = S.queue[S.qi];
  const pl = S.players[turn.player];
  $('planRound').textContent = `Ronda ${turn.round} de ${S.settings.rounds} · Turno ${S.qi + 1} de ${S.queue.length}`;
  $('planTurn').textContent = `📱 ${pl.name}, te toca estafar`;
  const mini = $('miniScores');
  mini.textContent = '';
  S.players.forEach((p, i) => mini.append(h('span', { class: i === turn.player ? 'active' : '', text: `${p.name}: ${S.scores[i]}` })));
  S.sel = { victim: null, pretext: null };

  destroyThumbs();
  const vl = $('victimList');
  vl.textContent = '';
  for (const v of VICTIMS) {
    const thumb = h('div', { class: 'thumb' }, h('div', { class: 'avatar' }));
    const card = h('button', { class: 'opt', type: 'button', 'data-id': v.id, onclick: () => { S.sel.victim = v.id; refreshPlan(); sfx.blip(); } },
      thumb,
      h('div', { class: 'body' },
        h('b', {}, `${v.name}, ${v.age}`, h('span', { class: 'mult', text: `×${DIFFICULTY_MULT[v.difficulty]}` })),
        h('span', { class: 'stars', text: '★'.repeat(v.difficulty) + '☆'.repeat(5 - v.difficulty) }),
        h('span', { text: v.tagline })));
    vl.append(card);
    const av = createAvatar(thumb.firstChild, v.look, { viewBox: '20 30 160 150' });
    av.setMood('neutral');
    S.thumbs.push(av);
  }
  const pl2 = $('pretextList');
  pl2.textContent = '';
  for (const p of PRETEXTS) {
    pl2.append(h('button', { class: 'opt pre', type: 'button', 'data-id': p.id, onclick: () => { S.sel.pretext = p.id; refreshPlan(); sfx.blip(); } },
      h('div', { class: 'body' },
        h('b', {}, h('span', { class: 'icon', text: p.icon + ' ' }), p.title, h('span', { class: 'mult', text: `×${p.mult}` })),
        h('span', { text: p.pitch }),
        h('span', { text: `Botín: $${p.amount}` }))));
  }
  refreshPlan();
}

function refreshPlan() {
  for (const el of $('victimList').children) el.classList.toggle('sel', el.dataset.id === S.sel.victim);
  for (const el of $('pretextList').children) el.classList.toggle('sel', el.dataset.id === S.sel.pretext);
  const v = byId(VICTIMS, S.sel.victim), p = byId(PRETEXTS, S.sel.pretext);
  const d = $('dossier');
  d.textContent = '';
  if (!v && !p) { d.append(h('p', { text: 'Elige una víctima y un pretexto para ver el expediente.' })); }
  else {
    d.append(h('h3', { text: '🗂️ Expediente' }));
    const kv = h('dl', { class: 'kv' });
    if (v) kv.append(h('dt', { text: 'Víctima' }), h('dd', { text: `${v.name} (${v.age}) · ${v.job}` }), h('dt', { text: 'Dificultad' }), h('dd', { text: '★'.repeat(v.difficulty) + '☆'.repeat(5 - v.difficulty) }), h('dt', { text: 'Debilidad' }), h('dd', { text: '🔒 La descubrirás hablando (o con una pista)' }));
    if (p) kv.append(h('dt', { text: 'Tu papel' }), h('dd', { text: p.pitch }), h('dt', { text: 'Objetivo' }), h('dd', { text: p.goal }));
    if (v && p) kv.append(h('dt', { text: 'Multiplicador' }), h('dd', { text: `×${(DIFFICULTY_MULT[v.difficulty] * p.mult).toFixed(2)}` }));
    d.append(kv);
  }
  $('callBtn').disabled = !(v && p);
}

$('callBtn').addEventListener('click', () => { sfx.unlock(); destroyThumbs(); startCall(); });

// ----------------------------------------------------------------------------
// LLAMADA
// ----------------------------------------------------------------------------
let listener = null;
let victimAv = null, youAv = null;
let rafId = 0;
let timerId = 0, silenceId = 0, talkOffId = 0;

function setChip(id, text) { $(id).textContent = text; }
function caption(id, text) {
  const el = $(id);
  el.textContent = text || '';
  el.classList.toggle('show', Boolean(text));
}
function logLine(who, name, text) {
  const log = $('log');
  const p = h('p', { class: who }, who === 'sys' ? null : h('b', { text: name }), text);
  log.append(p);
  log.scrollTop = log.scrollHeight;
}
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

function updateMeters() {
  const c = S.call;
  $('trustBar').style.width = c.trust + '%';
  $('suspBar').style.width = c.susp + '%';
  $('trustVal').textContent = Math.round(c.trust);
  $('suspVal').textContent = Math.round(c.susp);
}

async function startCall() {
  const turn = S.queue[S.qi];
  const player = S.players[turn.player];
  const v = byId(VICTIMS, S.sel.victim), p = byId(PRETEXTS, S.sel.pretext);
  const brain = createOfflineBrain(v, p);
  const c = S.call = {
    v, p, player, turn: turn, brain,
    useAI: S.ai.ai, aiFails: 0,
    history: [], trust: brain.startTrust(), susp: brain.startSuspicion(),
    peak: 0, timeLeft: S.settings.duration, n: 0, started: false, over: false, busy: false, timeUp: false,
    tags: {}, series: [], hints: 0, micOn: S.settings.mic && sttSupported, camOn: false,
    speaking: false, usedAI: false, usedOffline: false,
  };
  c.peak = c.trust;
  c.series.push({ t: 0, trust: c.trust, susp: c.susp });

  show('screen-call');
  $('endOverlay').hidden = true;
  $('log').textContent = '';
  $('hintBox').hidden = true;
  $('hintBtn').textContent = '💡 Pista (−50)';
  $('sayInput').value = '';
  $('timer').textContent = fmt(c.timeLeft);
  $('timer').classList.remove('low');
  $('vName').textContent = v.name; $('yName').textContent = player.name + ' (tú)';
  $('callInfo').textContent = `${p.icon} ${p.title}`;
  $('goalBox').replaceChildren(h('b', { text: '🎯 Objetivo: ' }), p.goal);
  $('cam').hidden = true; $('camBtn').textContent = '📷 Mi cámara';
  $('tileYou').querySelector('.avatar').hidden = false;
  updateMeters();
  setChip('vStatus', ''); setChip('yStatus', '');
  caption('vCaption', ''); caption('yCaption', '');

  victimAv?.destroy(); youAv?.destroy();
  victimAv = createAvatar($('avV'), v.look);
  youAv = createAvatar($('avY'), { skin: '#e0b08a', hair: '#1c1c22', hairStyle: 'short', shades: true, headset: true, hood: true, shirt: COLORS[turn.player % COLORS.length], bg: '#0b1018', decor: 'hacker' });
  victimAv.setMood('neutral'); youAv.setMood('neutral');
  setMicButton();
  sfx.enabled = S.settings.sfx;

  // Micrófono y reconocimiento de voz
  listener?.stop();
  listener = new Listener({
    onInterim: (t) => { if (S.call?.over) return; caption('yCaption', t); if (t) { youAv.talk(true); clearTimeout(talkOffId); talkOffId = setTimeout(() => youAv.talk(false), 700); clearSilence(); } },
    onFinal: (t) => playerSays(t),
    onState: (st) => {
      if (!S.call || S.call.over) return;
      if (st === 'listening') setChip('yStatus', '🎤 escuchando');
      if (st === 'denied') { S.call.micOn = false; setMicButton(); setChip('yStatus', '🚫 micrófono bloqueado'); toast('Micrófono bloqueado: escribe tus frases en el cuadro de texto.'); }
    },
  });
  if (c.micOn) startMicLevel();
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(mouthLoop);

  // Marcando...
  $('ringOverlay').hidden = false;
  $('ringText').textContent = `Marcando a ${v.name}…`;
  sfx.ring();
  await sleep(1100);
  sfx.ring();
  await sleep(1300);
  if (S.call !== c || c.over) return;
  sfx.pickup();
  $('ringOverlay').hidden = true;
  c.started = true;
  clearInterval(timerId);
  timerId = setInterval(tickTimer, 1000);
  await victimReply({ kind: 'pickup' });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function mouthLoop() {
  const c = S.call;
  if (!c || c.over) return;
  if (c.micOn && !c.busy && !c.speaking) {
    const lv = micLevel();
    youAv.setMouth(lv > 0.07 ? Math.min(1, lv * 1.3) : null);
  }
  rafId = requestAnimationFrame(mouthLoop);
}

function tickTimer() {
  const c = S.call;
  if (!c || c.over) return;
  c.timeLeft--;
  $('timer').textContent = fmt(Math.max(0, c.timeLeft));
  $('timer').classList.toggle('low', c.timeLeft <= 20);
  if (c.timeLeft <= 0) {
    if (c.busy) c.timeUp = true;
    else endCall('timeout');
  }
}

function armSilence() {
  clearSilence();
  silenceId = setTimeout(() => {
    const c = S.call;
    if (!c || c.over || c.busy || !c.started) return;
    victimReply({ kind: 'silence' });
  }, 15000);
}
function clearSilence() { clearTimeout(silenceId); }

function setMicButton() {
  const c = S.call;
  const b = $('micBtn');
  const on = c?.micOn;
  b.className = 'btn mic ' + (on ? 'on' : 'off');
  b.textContent = on ? '🎤 Micrófono: ON' : sttSupported ? '🎤 Micrófono: OFF' : '🎤 No disponible';
  b.disabled = !sttSupported;
}

$('micBtn').addEventListener('click', async () => {
  const c = S.call;
  if (!c || c.over) return;
  c.micOn = !c.micOn;
  setMicButton();
  if (c.micOn) {
    listener.denied = false;
    await startMicLevel();
    if (!c.busy && c.started) listener.start();
  } else {
    listener.stop(); stopMicLevel(); youAv.setMouth(null); setChip('yStatus', '');
  }
});

$('camBtn').addEventListener('click', async () => {
  const c = S.call;
  if (!c || c.over) return;
  const video = $('cam');
  if (!c.camOn) {
    const ok = await startCamera(video);
    if (!ok) { toast('No pude acceder a la cámara. Seguirás con tu avatar.'); return; }
    c.camOn = true; video.hidden = false; $('tileYou').querySelector('.avatar').hidden = true;
    $('camBtn').textContent = '🧑‍💻 Usar avatar';
  } else {
    stopCamera(video); c.camOn = false; video.hidden = true; $('tileYou').querySelector('.avatar').hidden = false;
    $('camBtn').textContent = '📷 Mi cámara';
  }
});

$('hintBtn').addEventListener('click', () => {
  const c = S.call;
  if (!c || c.over) return;
  const all = [...c.v.hints, ...c.p.hints];
  if (c.hints >= all.length) { toast('Ya no hay más pistas.'); return; }
  const text = all[c.hints++];
  const box = $('hintBox');
  box.hidden = false;
  box.textContent = `💡 ${text}  (−50 pts)`;
  $('hintBtn').textContent = `💡 Pista (−50) · ${c.hints}/${all.length}`;
});

$('scriptBtn').addEventListener('click', () => {
  const c = S.call;
  if (!c || c.over) return;
  const box = $('hintBox');
  box.hidden = false;
  box.textContent = `📜 Para empezar puedes decir: «${c.p.script}»`;
});

$('sayForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('sayInput');
  const t = input.value.trim();
  if (!t) return;
  input.value = '';
  // Anima tu boca mientras "hablas" el texto escrito
  youAv.talk(true); clearTimeout(talkOffId); talkOffId = setTimeout(() => youAv.talk(false), Math.min(4000, 500 + t.length * 45));
  playerSays(t);
});
$('sayInput').addEventListener('input', clearSilence);

$('hangBtn').addEventListener('click', () => { if (S.call && !S.call.over) endCall('quit'); });

async function playerSays(raw) {
  const c = S.call;
  if (!c || c.over || c.busy || !c.started) return;
  const text = String(raw).trim().slice(0, 400);
  if (!text) return;
  clearSilence();
  c.n++;
  c.history.push({ who: 'player', text });
  logLine('y', c.player.name, text);
  caption('yCaption', text);
  setTimeout(() => { if (S.call === c) caption('yCaption', ''); }, 3500);
  await victimReply({ kind: 'turn', text });
}

async function victimReply({ kind, text = '' }) {
  const c = S.call;
  c.busy = true;
  listener.pause();
  youAv.setMouth(null);
  setChip('vStatus', '💭 pensando…');
  setChip('yStatus', '');
  const state = { trust: Math.round(c.trust), suspicion: Math.round(c.susp), turn: c.n, timeLeft: c.timeLeft };

  let r = null;
  if (c.useAI) {
    try {
      r = await aiTurn({
        victimId: c.v.id, pretextId: c.p.id, model: S.settings.model, kind, text,
        history: c.history.slice(-16).map(({ who, text: t }) => ({ who, text: t })), state,
      });
      c.usedAI = true;
    } catch {
      c.aiFails++;
      if (c.aiFails >= 3) { c.useAI = false; toast('La IA no responde: la víctima pasa al cerebro offline.'); }
    }
  }
  if (!r) { r = c.brain.turn({ text, kind, state }); c.usedOffline = true; }
  if (S.call !== c || c.over) return;

  // Validación del turno
  const dT = clamp(Math.round(r.trust_delta) || 0, -25, 25);
  const dS = clamp(Math.round(r.suspicion_delta) || 0, -15, 30);
  const nt = clamp(c.trust + dT, 0, 100), ns = clamp(c.susp + dS, 0, 100);
  let action = r.action || 'none';
  if (action === 'send_money' && nt < 45) action = 'none';
  if (ns >= 100 && action === 'none') action = 'hang_up';
  if (kind === 'pickup') action = 'none';

  if (dT > 0) sfx.up(); else if (dT < -2 || dS > 6) sfx.down();
  c.trust = nt; c.susp = ns; c.peak = Math.max(c.peak, nt);
  c.series.push({ t: c.series.length, trust: nt, susp: ns });
  for (const tag of r.tags || []) c.tags[tag] = (c.tags[tag] || 0) + 1;
  updateMeters();
  victimAv.setMood(r.mood || 'neutral');
  $('tileVictim').dataset.mood = r.mood || 'neutral';

  c.history.push({ who: 'victim', text: r.say, thought: kind === 'pickup' ? '' : r.thought || '' });
  logLine('v', c.v.name, r.say);
  caption('vCaption', r.say);
  c.speaking = true;
  setChip('vStatus', '🗣️ hablando');
  $('tileVictim').classList.add('speaking');
  victimAv.talk(true);
  if (S.settings.voice) await speak(r.say, c.v); else await sleep(Math.min(6000, 700 + r.say.length * 55));
  victimAv.talk(false);
  $('tileVictim').classList.remove('speaking');
  c.speaking = false;
  if (S.call !== c || c.over) return;
  setTimeout(() => { if (S.call === c && !c.speaking) caption('vCaption', ''); }, 1800);

  if (action !== 'none') { endCall(action); return; }
  if (c.timeUp || c.timeLeft <= 0) { endCall('timeout'); return; }
  c.busy = false;
  setChip('vStatus', '👂 te escucha');
  if (c.micOn) listener.start();
  armSilence();
}

// ----------------------------------------------------------------------------
// FIN DE LA LLAMADA
// ----------------------------------------------------------------------------
function computeScore(kind) {
  const c = S.call;
  const mult = DIFFICULTY_MULT[c.v.difficulty] * c.p.mult;
  let base, money = 0;
  if (kind === 'send_money') {
    money = c.p.amount;
    base = c.p.amount + c.timeLeft * 4 + (100 - c.susp) * 3 + c.peak * 2;
  } else {
    base = c.peak * 2 + c.n * 5;
  }
  const hintCost = c.hints * 50;
  return { money, base: Math.round(base), mult, hintCost, score: Math.max(0, Math.round(base * mult) - hintCost) };
}

const END_TEXT = {
  send_money: { cls: 'win', h: '¡ESTAFA COMPLETADA!', icon: '💸', p: (c) => `${c.v.name} aceptó ${c.p.item}. (Todo es de mentiritas, ¡pero qué labia!)` },
  hang_up: { cls: 'lose', h: 'Te colgaron', icon: '📵', p: (c) => `${c.v.name} se cansó y colgó la llamada.` },
  call_police: { cls: 'lose', h: '¡Llamó a la policía!', icon: '🚓', p: (c) => `${c.v.name} te reconoció y ya está denunciándote.` },
  timeout: { cls: 'lose', h: 'Se acabó el tiempo', icon: '⏰', p: (c) => `${c.v.name} tuvo que irse. No lograste cerrar el trato.` },
  quit: { cls: 'lose', h: 'Colgaste', icon: '📴', p: () => 'Tú mismo colgaste la llamada.' },
};

function endCall(kind) {
  const c = S.call;
  if (!c || c.over) return;
  c.over = true; c.end = kind;
  clearInterval(timerId); clearSilence(); clearTimeout(talkOffId);
  listener.stop(); stopMicLevel(); cancelSpeech();
  victimAv?.talk(false); youAv?.talk(false); youAv?.setMouth(null);
  stopCamera($('cam'));
  const res = c.result = computeScore(kind);
  S.scores[c.turn.player] += res.score;
  const b = S.best[c.turn.player];
  b.score = Math.max(b.score, res.score); b.money += res.money;

  if (kind === 'send_money') { sfx.cash(); confetti(); victimAv.setMood('happy'); }
  else if (kind === 'call_police') { sfx.siren(); victimAv.setMood('angry'); }
  else { sfx.hangup(); }
  if (kind !== 'send_money') victimAv.setMood(kind === 'timeout' ? 'neutral' : 'angry');

  const info = END_TEXT[kind];
  const ov = $('endOverlay');
  ov.className = 'overlay ' + info.cls;
  ov.replaceChildren(
    h('div', { style: 'font-size:64px', text: info.icon }),
    h('h2', { text: info.h }),
    h('p', { text: info.p(c) }),
    h('p', { text: kind === 'send_money' ? `Botín: $${res.money} · Puntos: ${res.score}` : `Puntos: ${res.score}` }),
    h('button', { class: 'btn primary big', type: 'button', text: 'Ver resultados', onclick: () => showResult() }));
  setTimeout(() => { ov.hidden = false; ov.querySelector('button')?.focus(); }, kind === 'send_money' ? 900 : 700);
}

function confetti() {
  const box = $('confetti');
  const em = ['💸', '💵', '🤑', '💰'];
  for (let i = 0; i < 36; i++) {
    const s = h('span', { text: em[i % em.length], style: `left:${Math.random() * 100}%;animation-duration:${2.2 + Math.random() * 2}s;animation-delay:${Math.random() * 0.6}s` });
    box.append(s);
    setTimeout(() => s.remove(), 5200);
  }
}

// ----------------------------------------------------------------------------
// RESULTADO
// ----------------------------------------------------------------------------
function chartSvg(series) {
  const W = 320, H = 130, pad = 8;
  const n = Math.max(1, series.length - 1);
  const x = (i) => pad + (i / n) * (W - 2 * pad);
  const y = (v) => H - pad - (v / 100) * (H - 2 * pad);
  const line = (key, color) => `<polyline fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" points="${series.map((p, i) => `${x(i)},${y(p[key])}`).join(' ')}"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Gráfica de confianza y sospecha"><rect x="0" y="0" width="${W}" height="${H}" rx="10" fill="#0a0f19"/>
    <line x1="${pad}" x2="${W - pad}" y1="${y(50)}" y2="${y(50)}" stroke="#263250" stroke-dasharray="4 4"/>${line('susp', '#ff5d73')}${line('trust', '#35e08a')}</svg>`;
}

function showResult() {
  const c = S.call;
  $('endOverlay').hidden = true;
  show('screen-result');
  const info = END_TEXT[c.end];
  const res = c.result;
  const banner = $('resultBanner');
  banner.className = 'banner ' + info.cls;
  banner.replaceChildren(h('div', { style: 'font-size:48px', text: info.icon }), h('h2', { text: info.h }), h('p', { text: info.p(c) }));

  const rows = [
    ['Botín', `$${res.money}`],
    ['Puntos base', res.base],
    [`Multiplicador (${c.v.name} × ${c.p.title})`, `×${res.mult.toFixed(2)}`],
    ['Pistas usadas', res.hintCost ? `−${res.hintCost}` : '0'],
  ];
  const tbl = h('table', { class: 'table' });
  for (const [k, v] of rows) tbl.append(h('tr', {}, h('td', { text: k }), h('td', { text: String(v) })));
  tbl.append(h('tr', { class: 'total' }, h('td', { text: `Puntos de ${c.player.name}` }), h('td', { text: String(res.score) })));
  $('scoreBreak').replaceChildren(h('h3', { text: '🧮 Puntuación' }), tbl,
    h('p', { class: 'fine', text: `Respuestas de la víctima: ${c.usedAI && c.usedOffline ? 'IA + offline' : c.usedAI ? 'IA de Claude' : 'cerebro offline'}` }));
  $('chart').innerHTML = chartSvg(c.series); // SVG generado solo con números

  const lessons = $('lessons');
  lessons.textContent = '';
  const ids = Object.keys(c.tags).filter((t) => TACTICS[t]).sort((a, b) => c.tags[b] - c.tags[a]);
  if (!ids.length) lessons.append(h('p', { text: 'No detecté tácticas claras en esta llamada. Recuerda: ¡en la vida real, ante la duda, cuelga y verifica por otro canal!' }));
  for (const id of ids) {
    const t = TACTICS[id];
    lessons.append(h('div', { class: 'lesson' },
      h('div', { class: 'ic', text: t.icon }),
      h('div', {}, h('b', {}, t.label, ' ', h('small', { text: `× ${c.tags[id]}` })), h('p', { text: t.lesson }))));
  }

  const rb = $('replayBody');
  rb.textContent = '';
  for (const item of c.history) {
    if (item.who === 'player') rb.append(h('p', { class: 'y', text: `🕶️ ${c.player.name}: ${item.text}` }));
    else rb.append(h('p', { class: 'v' }, `${c.v.name}: ${item.text}`, item.thought ? h('em', { text: `💭 ${item.thought}` }) : null));
  }

  const last = S.qi >= S.queue.length - 1;
  $('nextBtn').textContent = last ? '🏆 Ver podio' : `Siguiente: ${S.players[S.queue[S.qi + 1].player].name} ▶`;
  $('retryBtn').hidden = S.players.length > 1;
  save('scamcall.best', Math.max(load('scamcall.best', 0), res.score));
}

$('nextBtn').addEventListener('click', () => {
  if (S.qi >= S.queue.length - 1) return goFinal();
  S.qi++;
  goPlan();
});
$('retryBtn').addEventListener('click', () => {
  // Solo para partidas de un jugador: otra llamada, mismas puntuaciones acumuladas.
  S.queue.push({ player: 0, round: S.queue.length + 1 });
  S.qi++;
  goPlan();
});
$('menuBtn').addEventListener('click', toMenu);
$('toMenuBtn').addEventListener('click', toMenu);
$('againBtn').addEventListener('click', newGame);

function toMenu() {
  S.call = null;
  show('screen-menu');
}

function goFinal() {
  show('screen-final');
  const ol = $('podium');
  ol.textContent = '';
  const medals = ['🥇', '🥈', '🥉'];
  const order = S.players.map((p, i) => ({ p, i, score: S.scores[i], best: S.best[i] })).sort((a, b) => b.score - a.score);
  order.forEach((o, rank) => {
    ol.append(h('li', {},
      h('span', { text: medals[rank] || `${rank + 1}.` }),
      h('span', { class: 'swatch', style: `background:${COLORS[o.i % COLORS.length]}` }),
      h('div', {}, o.p.name, h('small', { text: `Botín total: $${o.best.money} · Mejor llamada: ${o.best.score}` })),
      h('span', { class: 'pts', text: `${o.score} pts` })));
  });
  if (order[0].score > 0) confetti();
}

// ----------------------------------------------------------------------------
initMenu();
