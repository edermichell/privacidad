const { newTake } = require('./lib');
(async () => { const T = await newTake({ html: process.env.H, seed: 't175', w: 1280, h: 720, dsf: 1, hideUI: [] });
  const r = await T.ev(() => { clearZ(); const c = nearestCross(P.x, P.y); tp(c[0] + .5, c[1] + .5); floorItems.length = 0;
    const car = cars.find(q => !q.dead); car.x = P.x + .8; car.y = P.y + .2; car.a = Math.PI;
    const z = mkZombie(P.x - .4, P.y, 'walker'); z.st = 'dead'; z.dieAt = 0; Z.push(z);
    P.dir = Math.PI; const a1 = findInteract().type; P.dir = 0; const a2 = findInteract().type; return [a1, a2]; });
  console.log('mirando al cadáver ->', r[0], '| mirando al auto ->', r[1]); await T.close(); })();
