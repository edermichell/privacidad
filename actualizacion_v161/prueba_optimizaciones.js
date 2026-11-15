const { newTake } = require('./lib'); let fails = 0; const ck = (ok, m, x) => { console.log(ok ? 'OK  ' : 'FAIL', m, x === undefined ? '' : JSON.stringify(x)); if (!ok) fails++; };
(async () => {
  const T = await newTake({ rt: false, seed: 'func161', mode: 'full', diff: 'normal', w: 915, h: 412, dsf: 1, hideUI: [] });
  await T.ev(() => { P.ghost = 1e9; Z.length = 0; });
  // fuego
  const f = await T.ev(() => { const x = P.x + 6, y = P.y + 3; fires.push({ x, y, t: 60, kind: 'fire', f: 0 }); const z = mkZombie(x + .2, y); Z.push(z); const far = mkZombie(x + 30, y + 30); Z.push(far); updFires(1 / 30); return [z.burn > 0, far.burn > 0]; });
  ck(f[0] && !f[1], 'el fuego quema al zombi que está encima y no a uno lejano', f);
  // supervivientes
  const n = await T.ev(() => { const npc = mkNpc('soldier', P.x + 3, P.y, {}); NPCS.push(npc); const z = mkZombie(P.x + 7, P.y); z.st = 'chase'; Z.push(z); npcBuildZombieGrid(); let seen = false; npcGridEachNear(npc.x, npc.y, 10, q => { if (q === z) seen = true; }); const lejos = mkZombie(Math.min(W - 3, P.x + 150), P.y); Z.push(lejos); npcBuildZombieGrid(); let seenFar = false; npcGridEachNear(lejos.x, lejos.y, 10, q => { if (q === lejos) seenFar = true; }); return [seen, seenFar]; });
  ck(n[0], 'un superviviente cerca del jugador encuentra al zombi cercano en la cuadrícula', n);
  // separación en un montón
  const s = await T.ev(() => { Z.length = 0; const c = [P.x + 4, P.y + 4]; for (let i = 0; i < 300; i++) { const z = mkZombie(c[0] + Math.random() * .3, c[1] + Math.random() * .3); z.st = 'idle'; Z.push(z); } const spread = () => { let m = 0; for (const z of Z) m += Math.hypot(z.x - c[0], z.y - c[1]); return m / Z.length; }; const a = spread(), t0 = performance.now(); for (let k = 0; k < 60; k++) { ZS69.t = 0; zsep69(1 / 30); } return [a, spread(), (performance.now() - t0) / 60]; });
  ck(s[1] > s[0] * 1.5, 'un montón de 300 zombis se separa (distancia media al centro)', s.map(v => +v.toFixed(2)));
  ck(s[2] < 3, 'y separarlos cuesta poco por paso (ms)', +s[2].toFixed(2));
  console.log('fallos:', fails); await T.close();
})();
