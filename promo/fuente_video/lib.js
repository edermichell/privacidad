// Framework de captura determinista del juego (reloj virtual + captura cuadro a cuadro)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const HTML = process.env.GAME_HTML || '/tmp/claude-0/-home-user-privacidad/c6741cea-eb4a-59e0-9c29-ae88b932896e/scratchpad/game/UltimoRefugio_Android/app/src/main/assets/index.html';

async function newTake(opts = {}) {
  const o = Object.assign({ seed: 'z3', w: 1280, h: 720, dsf: 2800/1280, fps: 30, quality: 92, hideUI: ['#tut', '#quest', '#toasts', '#achtoast', '#hint', '#moodles'] }, opts);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: o.w, height: o.h }, deviceScaleFactor: o.dsf });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERR', e.message));
  if (!o.rt) await page.clock.install({ time: 0 });
  await page.goto('file://' + (o.html || HTML));
  if (o.rt) await page.waitForTimeout(1500); else await page.clock.runFor(1500);
  await page.evaluate(([s, m, d]) => { OPT.world.seed = s; if (m) OPT.mode = m; if (d) OPT.diff = d; }, [o.seed, o.mode, o.diff]);
  await page.click('#bNew');
  if (o.rt) await page.waitForTimeout(2500); else await page.clock.runFor(2500);
  await page.keyboard.press('Space');        // saltar intro
  if (o.rt) await page.waitForTimeout(2500); else await page.clock.runFor(2500);
  if (o.hideUI.length) await page.addStyleTag({ content: o.hideUI.join(',') + '{display:none!important}' });
  await page.evaluate(v => { window.__invuln = v; }, o.invuln);
  await page.evaluate(() => {
    window.give = (id, n) => { const it = mkItem(id, n || 1); if (ITEMS[id].gun) it.a = ITEMS[id].mag; addItem(it); return it; };
    window.spawnRing = (n, rmin, rmax, types, cx, cy) => { cx = cx == null ? P.x : cx; cy = cy == null ? P.y : cy; let made = 0, tries = 0; while (made < n && tries++ < 600) { const a = Math.random() * Math.PI * 2, d = rmin + Math.random() * (rmax - rmin); const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d; const tx = Math.floor(x), ty = Math.floor(y); if (!inb(tx, ty) || solidTile(tx, ty) || to[idx(tx, ty)] !== O_NONE) continue; const z = mkZombie(x, y, types ? types[made % types.length] : undefined); z.st = 'chase'; z.seen = 99; z.los = true; z.lx = P.x; z.ly = P.y; Z.push(z); made++; } return made; };
    window.keepAlive = () => { P.hp = 100; P.end = 100; P.panic = 0; P.pain = 0; P.hurt = 0; P.wounds = []; P.inf = 0; P.stress = 0; P.hun = 5; P.thi = 5; P.fat = 5; };
    // intersección de calles más cercana a (x,y)
    window.nearestCross = (x, y) => { let best = null, bd = 1e9; for (const rx of ROADS) for (const ry of ROADS) { const cx = rx + 1.5, cy = ry + 1.5; const d = Math.hypot(cx - x, cy - y); if (d < bd) { bd = d; best = [cx, cy]; } } return best; };
    window.tp = (x, y) => { P.x = x; P.y = y; snapCam(); };
    // retira zombis lejanos para que no estorben el plano
    window.clearZ = () => { Z.length = 0; };
    try { m77On = () => false; } catch (e) {}
    if (window.__invuln !== false) try { Object.defineProperty(P, 'hurt', { get() { return 0; }, set(v) {}, configurable: true }); let _hp = 100; Object.defineProperty(P, 'hp', { get() { return _hp; }, set(v) { if (v > _hp) _hp = v; }, configurable: true }); } catch (e) { console.log(e); }
    window.guard = r => { const st = spawnText; spawnText = () => {}; try { for (const z of Z) { if (z.st === 'dead' || z.st === 'down') continue; if (Math.hypot(z.x - P.x, z.y - P.y) < r) damageZombie(z, 9999, { noPush: false }); } } finally { spawnText = st; } };
    try { LANDMARKS.forEach((_, i) => DISC.add(i)); } catch (e) {}
  });
  const T = { browser, page, o, frame: 0, dir: null };
  T.run = ms => o.rt ? page.waitForTimeout(ms) : page.clock.runFor(ms);
  T.ev = (f, a) => page.evaluate(f, a);
  T.key = k => page.keyboard.press(k);
  T.down = k => page.keyboard.down(k);
  T.up = k => page.keyboard.up(k);
  T.close = () => browser.close();
  // Captura `seconds` segundos; hook(t, i) se ejecuta antes de cada cuadro
  T.rec = async (dir, seconds, hook) => {
    fs.mkdirSync(dir, { recursive: true });
    const n = Math.round(seconds * o.fps);
    for (let i = 0; i < n; i++) {
      if (hook) await hook(i / o.fps, i);
      await page.clock.runFor(1000 / o.fps);
      await page.screenshot({ path: path.join(dir, 'f' + String(T.frame++).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: o.quality });
    }
  };
  return T;
}

// utilidades en el contexto del juego
const GAME = {
  // prepara: invulnerable, hora, lluvia
  setup: `(cfg) => {
    if (cfg.min != null) { GT.min = cfg.min; }
    if (cfg.rain != null) { GT.rain = cfg.rain; GT.rainTarget = cfg.rain; GT.rainT = 9999; }
    P.hp = 100;
  }`,
};

module.exports = { newTake, HTML, GAME };
