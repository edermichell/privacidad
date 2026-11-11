// Avatares SVG animados: parpadeo, labios, cejas y emociones.
const NS = 'http://www.w3.org/2000/svg';

const MOODS = {
  //            brow L/R (grados)  browY  eyeScale  smile  blush  sweat  anger
  neutral:    { bl: 0,   br: 0,   by: 0,   eye: 1,    smile: 0.25,  blush: 0,   sweat: 0, anger: 0 },
  happy:      { bl: -6,  br: 6,   by: -2,  eye: 1,    smile: 1,     blush: 0.7, sweat: 0, anger: 0 },
  confused:   { bl: -14, br: 8,   by: -3,  eye: 1,    smile: -0.1,  blush: 0,   sweat: 0, anger: 0 },
  suspicious: { bl: 14,  br: -14, by: 2,   eye: 0.55, smile: -0.25, blush: 0,   sweat: 0, anger: 0 },
  worried:    { bl: -16, br: 16,  by: -4,  eye: 1.05, smile: -0.55, blush: 0,   sweat: 1, anger: 0 },
  angry:      { bl: 24,  br: -24, by: 4,   eye: 0.7,  smile: -0.95, blush: 0.5, sweat: 0, anger: 1 },
  scared:     { bl: -10, br: 10,  by: -8,  eye: 1.3,  smile: -0.4,  blush: 0,   sweat: 1, anger: 0 },
};

function el(name, attrs = {}, parent) {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, c + amt));
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => f(c).toString(16).padStart(2, '0')).join('');
}

function drawBackground(svg, look) {
  const bg = look.bg || '#ccd';
  el('rect', { x: -100, y: -100, width: 400, height: 440, fill: bg }, svg);
  el('rect', { x: -100, y: 170, width: 400, height: 140, fill: shade(bg, -22) }, svg);
  const d = look.decor;
  if (d === 'kitchen') {
    el('rect', { x: 14, y: 24, width: 54, height: 46, rx: 3, fill: '#bfe3ee', stroke: shade(bg, -60), 'stroke-width': 3 }, svg);
    el('path', { d: 'M41 24v46M14 47h54', stroke: shade(bg, -60), 'stroke-width': 2 }, svg);
    el('ellipse', { cx: 172, cy: 160, rx: 16, ry: 10, fill: '#e9a36a' }, svg); // gato
    el('circle', { cx: 164, cy: 150, r: 3, fill: '#e9a36a' }, svg);
    el('circle', { cx: 176, cy: 150, r: 3, fill: '#e9a36a' }, svg);
  } else if (d === 'office') {
    el('rect', { x: 118, y: 18, width: 66, height: 40, fill: '#fff', stroke: shade(bg, -60), 'stroke-width': 2 }, svg);
    el('path', { d: 'M124 50l14-14 12 8 18-20 10 10', fill: 'none', stroke: '#4a90d9', 'stroke-width': 3 }, svg);
    el('rect', { x: 14, y: 30, width: 40, height: 26, fill: '#e6e0b9', stroke: shade(bg, -60), 'stroke-width': 2 }, svg);
  } else if (d === 'neon') {
    el('rect', { x: 20, y: 28, width: 60, height: 6, rx: 3, fill: '#ff3df2' }, svg);
    el('rect', { x: 130, y: 40, width: 50, height: 6, rx: 3, fill: '#33e0ff' }, svg);
    el('rect', { x: 150, y: 90, width: 30, height: 40, fill: '#2d1f55', stroke: '#33e0ff', 'stroke-width': 2 }, svg);
  } else if (d === 'taxi') {
    el('rect', { x: 0, y: 20, width: 200, height: 30, fill: '#f5d442' }, svg);
    for (let i = 0; i < 10; i++) el('rect', { x: i * 20, y: 20, width: 10, height: 30, fill: '#222' }, svg);
    el('text', { x: 100, y: 188, 'text-anchor': 'middle', 'font-size': 10, fill: '#222', 'font-weight': 700 }, svg).textContent = 'TAXI';
  } else if (d === 'garage') {
    el('rect', { x: 16, y: 26, width: 54, height: 44, fill: '#2a331f', stroke: '#1d2415', 'stroke-width': 2 }, svg);
    el('path', { d: 'M16 40h54M16 54h54', stroke: '#1d2415', 'stroke-width': 2 }, svg);
    el('rect', { x: 140, y: 30, width: 44, height: 30, fill: '#b9a56a' }, svg);
    el('text', { x: 162, y: 50, 'text-anchor': 'middle', 'font-size': 9, fill: '#3a2f10' }, svg).textContent = '★★★';
  } else if (d === 'monitors') {
    for (const [x, y, w] of [[10, 22, 56], [74, 14, 56], [138, 22, 56]]) {
      el('rect', { x, y, width: w, height: 36, rx: 2, fill: '#0a1018', stroke: '#2f4b73', 'stroke-width': 2 }, svg);
      for (let i = 0; i < 4; i++) el('rect', { x: x + 5, y: y + 6 + i * 7, width: 10 + ((i * 17 + x) % 36), height: 2.5, fill: i % 2 ? '#35e08a' : '#3aa0ff' }, svg);
    }
  } else if (d === 'hacker') {
    el('rect', { x: -100, y: -100, width: 400, height: 270, fill: '#0b1018' }, svg);
    for (let i = 0; i < 14; i++) el('text', { x: 6 + i * 14, y: 24 + ((i * 37) % 120), 'font-size': 10, fill: '#1c7a4a', opacity: 0.7, 'font-family': 'monospace' }, svg).textContent = i % 2 ? '1' : '0';
  }
}

function drawHairBack(g, look) {
  const c = look.hair || '#222';
  if (look.hairStyle === 'bob') el('path', { d: 'M46 100 Q44 48 100 46 Q156 48 154 100 L156 158 Q100 170 44 158Z', fill: c }, g);
  if (look.hairStyle === 'ponytail') el('path', { d: 'M138 82 Q176 90 168 140 Q160 120 138 118Z', fill: c }, g);
  if (look.hood) el('path', { d: 'M30 200 Q28 70 100 40 Q172 70 170 200Z', fill: '#171a24' }, g);
}

function drawHairFront(g, look) {
  const c = look.hair || '#222';
  const cap = 'M52 106 Q50 52 100 50 Q150 52 148 106 Q136 80 100 78 Q64 80 52 106Z';
  switch (look.hairStyle) {
    case 'bun':
      el('circle', { cx: 100, cy: 49, r: 15, fill: c }, g);
      el('path', { d: cap, fill: c }, g);
      break;
    case 'short':
      el('path', { d: cap, fill: c }, g);
      break;
    case 'bob':
      el('path', { d: 'M52 100 Q58 54 100 54 Q142 54 148 100 Q124 72 100 74 Q76 72 52 100Z', fill: c }, g);
      break;
    case 'messy':
      el('path', { d: cap, fill: c }, g);
      for (const x of [62, 80, 100, 120, 138]) el('path', { d: `M${x - 8} 60 L${x} 34 L${x + 8} 60Z`, fill: c }, g);
      break;
    case 'ponytail':
      el('path', { d: cap, fill: c }, g);
      break;
    case 'bald':
      el('ellipse', { cx: 56, cy: 104, rx: 7, ry: 14, fill: c }, g);
      el('ellipse', { cx: 144, cy: 104, rx: 7, ry: 14, fill: c }, g);
      break;
    case 'cap':
      el('path', { d: 'M50 92 Q50 44 100 42 Q150 44 150 92Z', fill: '#2d6cb5' }, g);
      el('path', { d: 'M48 92 Q100 100 168 96 L168 88 Q110 90 48 84Z', fill: '#24558f' }, g);
      break;
    default:
      break;
  }
}

export function createAvatar(container, look, opts = {}) {
  container.textContent = '';
  const svg = el('svg', { viewBox: opts.viewBox || '0 30 200 170', class: 'avatar-svg', 'aria-hidden': 'true', preserveAspectRatio: 'xMidYMid slice' });
  container.appendChild(svg);
  drawBackground(svg, look);
  const person = el('g', { class: 'person' }, svg);
  const skin = look.skin || '#e8b896';
  const dark = shade(skin, -35);

  drawHairBack(person, look);
  // cuerpo
  el('path', { d: 'M20 240 Q22 192 70 184 L130 184 Q178 192 180 240Z', fill: look.shirt || '#58a' }, person);
  if (look.hood) el('path', { d: 'M70 184 Q100 214 130 184 Q122 176 100 176 Q78 176 70 184Z', fill: '#0e1018' }, person);
  else el('path', { d: 'M82 184 Q100 206 118 184Z', fill: shade(skin, -15) }, person);
  el('rect', { x: 86, y: 150, width: 28, height: 36, rx: 8, fill: shade(skin, -12) }, person);
  // cabeza
  el('circle', { cx: 52, cy: 116, r: 9, fill: skin }, person);
  el('circle', { cx: 148, cy: 116, r: 9, fill: skin }, person);
  el('ellipse', { cx: 100, cy: 110, rx: 48, ry: 56, fill: skin }, person);
  drawHairFront(person, look);

  // cejas
  const browL = el('rect', { x: 66, y: 82, width: 24, height: 5, rx: 2.5, fill: look.hair && look.hairStyle !== 'bald' ? shade(look.hair, -20) : '#666', class: 'brow' }, person);
  const browR = el('rect', { x: 110, y: 82, width: 24, height: 5, rx: 2.5, fill: browL.getAttribute('fill'), class: 'brow' }, person);
  // ojos
  const eyes = el('g', {}, person);
  const eyeL = el('ellipse', { cx: 78, cy: 100, rx: 8, ry: 9, fill: '#fff' }, eyes);
  const eyeR = el('ellipse', { cx: 122, cy: 100, rx: 8, ry: 9, fill: '#fff' }, eyes);
  const pupL = el('circle', { cx: 78, cy: 101, r: 4.2, fill: '#2a1d14' }, eyes);
  const pupR = el('circle', { cx: 122, cy: 101, r: 4.2, fill: '#2a1d14' }, eyes);
  // nariz
  el('path', { d: 'M100 104 Q94 124 102 126', fill: 'none', stroke: dark, 'stroke-width': 3, 'stroke-linecap': 'round' }, person);
  // mejillas
  const blushL = el('circle', { cx: 68, cy: 126, r: 8, fill: '#ff7f90', opacity: look.blush ? 0.25 : 0 }, person);
  const blushR = el('circle', { cx: 132, cy: 126, r: 8, fill: '#ff7f90', opacity: look.blush ? 0.25 : 0 }, person);
  if (look.lipstick) el('ellipse', { cx: 100, cy: 142, rx: 13, ry: 5, fill: '#b01c3a', opacity: 0.0 }, person);
  // boca
  const mouthLine = el('path', { d: 'M84 142 Q100 150 116 142', fill: 'none', stroke: look.lipstick ? '#b01c3a' : '#6b2f2f', 'stroke-width': 4, 'stroke-linecap': 'round' }, person);
  const mouthOpen = el('g', { opacity: 0 }, person);
  const mouthShape = el('ellipse', { cx: 100, cy: 143, rx: 13, ry: 6, fill: '#4a1a1a' }, mouthOpen);
  const tongue = el('ellipse', { cx: 100, cy: 148, rx: 8, ry: 3, fill: '#d9576b' }, mouthOpen);
  // vello facial / accesorios
  if (look.mustache) el('path', { d: 'M74 134 Q88 124 100 132 Q112 124 126 134 Q112 140 100 136 Q88 140 74 134Z', fill: '#555' }, person);
  if (look.beard) el('path', { d: 'M56 128 Q58 170 100 172 Q142 170 144 128 Q128 150 100 150 Q72 150 56 128Z', fill: shade(look.hair || '#333', -5), opacity: 0.95 }, person);
  if (look.glasses) {
    el('circle', { cx: 78, cy: 100, r: 15, fill: 'rgba(255,255,255,.12)', stroke: '#222', 'stroke-width': 3 }, person);
    el('circle', { cx: 122, cy: 100, r: 15, fill: 'rgba(255,255,255,.12)', stroke: '#222', 'stroke-width': 3 }, person);
    el('path', { d: 'M93 100h14', stroke: '#222', 'stroke-width': 3 }, person);
  }
  if (look.shades) {
    el('rect', { x: 58, y: 90, width: 38, height: 22, rx: 8, fill: '#111' }, person);
    el('rect', { x: 104, y: 90, width: 38, height: 22, rx: 8, fill: '#111' }, person);
    el('path', { d: 'M96 98h8', stroke: '#111', 'stroke-width': 3 }, person);
    el('path', { d: 'M62 94l12 0', stroke: 'rgba(255,255,255,.5)', 'stroke-width': 2 }, person);
  }
  if (look.headphones) {
    el('path', { d: 'M50 112 Q46 40 100 40 Q154 40 150 112', fill: 'none', stroke: '#e9e9ef', 'stroke-width': 7, 'stroke-linecap': 'round' }, person);
    el('rect', { x: 40, y: 104, width: 16, height: 28, rx: 7, fill: '#e04a6a' }, person);
    el('rect', { x: 144, y: 104, width: 16, height: 28, rx: 7, fill: '#e04a6a' }, person);
  }
  if (look.headset) {
    el('path', { d: 'M52 108 Q50 46 100 46 Q150 46 148 108', fill: 'none', stroke: '#222', 'stroke-width': 6, 'stroke-linecap': 'round' }, person);
    el('rect', { x: 42, y: 104, width: 14, height: 24, rx: 6, fill: '#222' }, person);
    el('path', { d: 'M48 128 Q60 156 86 148', fill: 'none', stroke: '#222', 'stroke-width': 4, 'stroke-linecap': 'round' }, person);
    el('circle', { cx: 88, cy: 148, r: 5, fill: '#444' }, person);
  }
  // efectos
  const sweat = el('path', { d: 'M150 70 Q156 82 150 88 Q144 82 150 70Z', fill: '#7fd0ff', opacity: 0 }, person);
  const anger = el('g', { opacity: 0, stroke: '#e03030', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, person);
  el('path', { d: 'M138 60 l8 -6 M142 66 l10 -2 M140 54 l2 -10', }, anger);

  // --- estado y control ---
  const st = { mood: 'neutral', target: MOODS.neutral, cur: { ...MOODS.neutral }, mouth: 0, talking: false, blink: 0, look: { x: 0, y: 0 } };

  function mouthPath(smile) {
    const y = 142, cy = y + smile * 9;
    return `M84 ${y} Q100 ${cy + 6} 116 ${y}`;
  }

  function render() {
    const c = st.cur;
    browL.setAttribute('transform', `translate(0 ${c.by}) rotate(${c.bl} 78 84)`);
    browR.setAttribute('transform', `translate(0 ${c.by}) rotate(${c.br} 122 84)`);
    const ey = Math.max(0.08, c.eye * (1 - st.blink)) * 9;
    eyeL.setAttribute('ry', ey);
    eyeR.setAttribute('ry', ey);
    const px = st.look.x, py = st.look.y;
    pupL.setAttribute('cx', 78 + px); pupL.setAttribute('cy', 101 + py);
    pupR.setAttribute('cx', 122 + px); pupR.setAttribute('cy', 101 + py);
    const pr = st.blink > 0.6 ? 0 : 4.2;
    pupL.setAttribute('r', pr); pupR.setAttribute('r', pr);
    mouthLine.setAttribute('d', mouthPath(c.smile));
    mouthLine.setAttribute('opacity', st.mouth < 0.1 ? 1 : 0);
    mouthOpen.setAttribute('opacity', st.mouth < 0.1 ? 0 : 1);
    const open = st.mouth;
    mouthShape.setAttribute('ry', 3 + open * 15);
    mouthShape.setAttribute('rx', 10 + open * 5 + Math.max(0, c.smile) * 4);
    mouthShape.setAttribute('cy', 142 + open * 5);
    tongue.setAttribute('cy', 142 + open * 9);
    tongue.setAttribute('opacity', open > 0.4 ? 1 : 0);
    blushL.setAttribute('opacity', 0.25 * (look.blush ? 1 : 0) + c.blush * 0.4);
    blushR.setAttribute('opacity', 0.25 * (look.blush ? 1 : 0) + c.blush * 0.4);
    sweat.setAttribute('opacity', c.sweat);
    anger.setAttribute('opacity', c.anger);
  }

  // bucle de animación suave
  let raf = 0, last = performance.now(), t = 0, nextBlink = 2000 + Math.random() * 2500, blinkT = -1, nextGlance = 1500;
  function tick(now) {
    const dt = Math.min(64, now - last); last = now; t += dt;
    for (const k of Object.keys(st.target)) st.cur[k] += (st.target[k] - st.cur[k]) * Math.min(1, dt / 160);
    // boca
    if (st.talking) {
      const base = 0.35 + 0.35 * Math.abs(Math.sin(t / 95)) + 0.2 * Math.abs(Math.sin(t / 53 + 1));
      st.mouth = Math.min(1, base * (0.7 + 0.3 * Math.sin(t / 400)));
    } else if (st.extMouth == null) {
      st.mouth += (0 - st.mouth) * Math.min(1, dt / 80);
    }
    if (st.extMouth != null) st.mouth += (st.extMouth - st.mouth) * Math.min(1, dt / 50);
    // parpadeo
    nextBlink -= dt;
    if (nextBlink <= 0 && blinkT < 0) { blinkT = 0; nextBlink = 2000 + Math.random() * 3500; }
    if (blinkT >= 0) { blinkT += dt; const p = blinkT / 160; st.blink = p < 0.5 ? p * 2 : Math.max(0, 2 - p * 2); if (p >= 1) { blinkT = -1; st.blink = 0; } }
    // mirada
    nextGlance -= dt;
    if (nextGlance <= 0) { st.look = { x: (Math.random() - 0.5) * 5, y: (Math.random() - 0.4) * 3 }; nextGlance = 900 + Math.random() * 2200; }
    person.setAttribute('transform', `translate(0 ${Math.sin(t / 900) * 1.2}) rotate(${Math.sin(t / 1700) * 0.8 + (st.talking ? Math.sin(t / 210) * 0.8 : 0)} 100 200)`);
    render();
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  return {
    setMood(m) { st.mood = MOODS[m] ? m : 'neutral'; st.target = MOODS[st.mood]; container.dataset.mood = st.mood; },
    talk(on) { st.talking = on; },
    setMouth(v) { st.extMouth = v == null ? null : Math.max(0, Math.min(1, v)); },
    destroy() { cancelAnimationFrame(raf); },
    get mood() { return st.mood; },
  };
}
