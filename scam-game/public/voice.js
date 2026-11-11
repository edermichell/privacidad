// Voz: síntesis (la víctima habla), reconocimiento (tú hablas), nivel de micrófono y efectos de sonido.

const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
export const sttSupported = Boolean(SR);
export const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

// ---------- Síntesis de voz (víctima) ----------
let voices = [];
function loadVoices() {
  if (ttsSupported) voices = window.speechSynthesis.getVoices();
}
if (ttsSupported) {
  loadVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}

const FEMALE = /(sabina|paulina|monica|mónica|helena|laura|lucia|lucía|elena|female|mujer|google español|marisol|dalia|camila|lupe|paloma|salome)/i;
const MALE = /(jorge|diego|juan|carlos|pablo|enrique|raul|raúl|male|hombre|alvaro|álvaro|andres|andrés|jorge)/i;

function pickVoice(gender) {
  const es = voices.filter((v) => /^es(-|_|$)/i.test(v.lang));
  if (!es.length) return null;
  const prefer = es.filter((v) => (gender === 'f' ? FEMALE.test(v.name) && !MALE.test(v.name) : MALE.test(v.name)));
  const mx = (list) => list.find((v) => /MX|US|419/i.test(v.lang)) || list[0];
  return mx(prefer.length ? prefer : es);
}

let currentUtter = null;
export function cancelSpeech() {
  if (ttsSupported) window.speechSynthesis.cancel();
  currentUtter = null;
}

// Devuelve una promesa que se resuelve cuando termina de hablar.
export function speak(text, victim, { onStart } = {}) {
  return new Promise((resolve) => {
    if (!ttsSupported) { onStart?.(); setTimeout(resolve, Math.min(7000, 500 + text.length * 55)); return; }
    cancelSpeech();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-MX';
    const v = pickVoice(victim?.voice?.gender);
    if (v) { u.voice = v; u.lang = v.lang; }
    u.pitch = victim?.voice?.pitch ?? 1;
    u.rate = victim?.voice?.rate ?? 1;
    let done = false;
    const finish = () => { if (done) return; done = true; clearTimeout(safety); resolve(); };
    const safety = setTimeout(finish, 3000 + text.length * 120); // Chrome a veces no dispara onend
    u.onstart = () => onStart?.();
    u.onend = finish;
    u.onerror = finish;
    currentUtter = u; // evita que el recolector de basura se lo lleve a mitad
    window.speechSynthesis.speak(u);
  });
}

// ---------- Reconocimiento de voz (jugador) ----------
export class Listener {
  constructor({ onInterim, onFinal, onState, lang = 'es-MX' }) {
    this.onInterim = onInterim;
    this.onFinal = onFinal;
    this.onState = onState;
    this.lang = lang;
    this.wanted = false; // el usuario quiere el micro encendido
    this.paused = false; // pausa temporal (mientras habla la víctima o la IA piensa)
    this.rec = null;
    this.running = false;
    this.buffer = '';
    this.flushTimer = 0;
    this.denied = false;
  }

  start() { this.wanted = true; this.paused = false; this._ensure(); }
  stop() { this.wanted = false; this._kill(); }
  pause() { this.paused = true; clearTimeout(this.flushTimer); this._kill(); }
  resume() { this.paused = false; this._ensure(); }

  _ensure() {
    if (!SR || !this.wanted || this.paused || this.running || this.denied) return;
    const rec = new SR();
    rec.lang = this.lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onstart = () => { this.running = true; this.onState?.('listening'); };
    rec.onresult = (ev) => {
      let interim = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) this.buffer += (this.buffer ? ' ' : '') + r[0].transcript.trim();
        else interim += r[0].transcript;
      }
      this.onInterim?.((this.buffer + ' ' + interim).trim());
      clearTimeout(this.flushTimer);
      // Si hay texto final, espera una pausa corta por si sigues hablando y luego envía.
      if (this.buffer && !interim) this.flushTimer = setTimeout(() => this._flush(), 1100);
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { this.denied = true; this.onState?.('denied'); }
    };
    rec.onend = () => {
      this.running = false;
      this.rec = null;
      if (this.buffer) this._flush();
      if (this.wanted && !this.paused && !this.denied) setTimeout(() => this._ensure(), 150);
      else if (!this.wanted) this.onState?.('off');
    };
    this.rec = rec;
    try { rec.start(); } catch { this.running = false; this.rec = null; }
  }

  _flush() {
    const text = this.buffer.trim();
    this.buffer = '';
    clearTimeout(this.flushTimer);
    this.onInterim?.('');
    if (text) this.onFinal?.(text);
  }

  _kill() {
    if (this.rec) {
      this.rec.onend = null;
      try { this.rec.abort(); } catch { /* nada */ }
    }
    this.rec = null;
    this.running = false;
  }
}

// ---------- Nivel de micrófono (para animar tu boca) ----------
let micStream = null;
let analyser = null;
let micBuf = null;

export async function startMicLevel() {
  if (analyser) return true;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
    const ctx = audioCtx();
    const src = ctx.createMediaStreamSource(micStream);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    src.connect(analyser);
    micBuf = new Uint8Array(analyser.fftSize);
    return true;
  } catch {
    return false;
  }
}
export function stopMicLevel() {
  micStream?.getTracks().forEach((t) => t.stop());
  micStream = null; analyser = null;
}
// 0..1
export function micLevel() {
  if (!analyser) return 0;
  analyser.getByteTimeDomainData(micBuf);
  let sum = 0;
  for (let i = 0; i < micBuf.length; i++) { const v = (micBuf[i] - 128) / 128; sum += v * v; }
  return Math.min(1, Math.sqrt(sum / micBuf.length) * 5);
}

// ---------- Cámara opcional ----------
let camStream = null;
export async function startCamera(videoEl) {
  try {
    camStream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 480, facingMode: 'user' }, audio: false });
    videoEl.srcObject = camStream;
    await videoEl.play();
    return true;
  } catch {
    return false;
  }
}
export function stopCamera(videoEl) {
  camStream?.getTracks().forEach((t) => t.stop());
  camStream = null;
  if (videoEl) videoEl.srcObject = null;
}

// ---------- Efectos de sonido sintetizados ----------
let ctx = null;
function audioCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, start, dur, { type = 'sine', gain = 0.12, slide = 0 } = {}) {
  const c = audioCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime + start);
  if (slide) o.frequency.linearRampToValueAtTime(freq + slide, c.currentTime + start + dur);
  g.gain.setValueAtTime(0.0001, c.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + start);
  o.stop(c.currentTime + start + dur + 0.05);
}

export const sfx = {
  enabled: true,
  ring() { if (!this.enabled) return; for (let i = 0; i < 2; i++) { tone(440, i * 0.5, 0.35, { gain: 0.08 }); tone(480, i * 0.5, 0.35, { gain: 0.08 }); } },
  pickup() { if (!this.enabled) return; tone(700, 0, 0.08, { type: 'square', gain: 0.05 }); },
  hangup() { if (!this.enabled) return; tone(480, 0, 0.18, { gain: 0.1 }); tone(480, 0.25, 0.18, { gain: 0.1 }); tone(480, 0.5, 0.4, { gain: 0.1 }); },
  cash() { if (!this.enabled) return; [880, 1175, 1568, 2093].forEach((f, i) => tone(f, i * 0.09, 0.25, { type: 'triangle', gain: 0.1 })); },
  siren() { if (!this.enabled) return; for (let i = 0; i < 4; i++) tone(i % 2 ? 700 : 950, i * 0.28, 0.28, { type: 'sawtooth', gain: 0.05 }); },
  buzz() { if (!this.enabled) return; tone(120, 0, 0.5, { type: 'sawtooth', gain: 0.1, slide: -40 }); },
  blip() { if (!this.enabled) return; tone(900, 0, 0.06, { type: 'sine', gain: 0.05 }); },
  up() { if (!this.enabled) return; tone(600, 0, 0.1, { type: 'triangle', gain: 0.06 }); tone(800, 0.08, 0.12, { type: 'triangle', gain: 0.06 }); },
  down() { if (!this.enabled) return; tone(500, 0, 0.1, { type: 'triangle', gain: 0.06 }); tone(330, 0.08, 0.14, { type: 'triangle', gain: 0.06 }); },
  unlock() { try { audioCtx(); } catch { /* nada */ } },
};
