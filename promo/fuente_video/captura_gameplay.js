const { newTake } = require('./lib'); const DIR = process.env.DIR; const FPS = 30;
const HIDE = ['#tut','#quest','#toasts','#achtoast','#moodles','#mis76','#side76','#hint','#netchip','#bSet','#rot'];
(async () => {
  const T = await newTake({ html: process.env.H, seed: process.env.SEED||'gp3', mode:'full', diff:'normal', w:960, h:540, dsf:2, fps:FPS, quality:92, hideUI:HIDE });
  const page = T.page, ev = (fn,arg) => T.ev(fn,arg);
  await ev(() => {
    const F="'Press Start 2P','VT323',monospace", V="'VT323',monospace";
    const vig=document.createElement('div'); vig.id='adVig';
    vig.style.cssText="position:fixed;inset:0;z-index:100000;pointer-events:none;background:radial-gradient(120% 78% at 50% 40%,transparent 56%,rgba(6,5,4,.5) 100%),linear-gradient(to bottom,rgba(6,5,4,.4) 0%,transparent 20%,transparent 56%,rgba(6,5,4,.9) 100%)";
    document.body.appendChild(vig);
    const tx=document.createElement('div'); tx.id='adTx';
    tx.style.cssText="position:fixed;left:0;right:0;bottom:18%;z-index:100002;pointer-events:none;text-align:center;padding:0 24px;font-family:"+F+";font-size:30px;line-height:1.3;color:#fff;text-shadow:4px 4px 0 #000,0 0 16px rgba(0,0,0,.7);opacity:0";
    document.body.appendChild(tx);
    const fl=document.createElement('div'); fl.id='adFlash';
    fl.style.cssText="position:fixed;inset:0;z-index:100003;background:#fff;pointer-events:none;opacity:0"; document.body.appendChild(fl);
    const end=document.createElement('div'); end.id='adEnd';
    end.style.cssText="position:fixed;inset:0;z-index:100004;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:radial-gradient(90% 70% at 50% 38%,rgba(20,10,8,.3),rgba(6,4,4,.94));opacity:0;text-align:center;padding:0 24px;font-family:"+F+"";
    end.innerHTML='<div style="font-size:22px;letter-spacing:5px;color:#f0e4d0;text-shadow:3px 3px 0 #000">ÚLTIMO</div>'+
      '<div style="font-size:56px;line-height:1.05;color:#e2563a;text-shadow:5px 5px 0 #000,0 0 26px rgba(214,64,47,.55);margin-top:-6px">REFUGIO</div>'+
      '<div style="font-family:"+V+";font-size:31px;color:#e8dcc0;line-height:1.3">ZOMBIS · SUPERVIVENCIA<br>SOLO O MULTIJUGADOR</div>'+
      '<div style="font-size:20px;color:#0c0a06;background:#8dbb6e;padding:14px 18px;box-shadow:5px 5px 0 #000;line-height:1.5">DESCÁRGALO <b style=\'color:#15340c\'>GRATIS</b></div>'+
      '<div style="font-family:"+V+";font-size:27px;color:#bfe08a">Google Play · "Último Refugio"</div>';
    document.body.appendChild(end);
    const _r=document.getElementById('rot'); if(_r)_r.style.display='none';
    window.__play=()=>{try{PAUSED=false;const _rr=document.getElementById('rot');if(_rr)_rr.style.display='none';if(typeof SIM!=='undefined')SIM=20;const e=document.getElementById('pause');if(e)e.hidden=true;if(typeof STATE!=='undefined'&&STATE==='dead')STATE='play';}catch(_){}}
    window.__ad={say(h){document.getElementById('adTx').innerHTML=h;},op(o){document.getElementById('adTx').style.opacity=o;},flash(o){document.getElementById('adFlash').style.opacity=o;},end(o){document.getElementById('adEnd').style.opacity=o;}}
    // ======== CONTROL HUMANO: joystick analógico (coords. de pantalla) + puntería tipo ratón ========
    window.__LOG=[];
    window.__H={dir:null,m:0,t:0,side:1,react:-1,mode:'',modeT:0,nz:Math.random()*9,ax:null,ay:null};
    window.__clear=(x,y)=>{const r=.33;for(const o of [[-r,-r],[r,-r],[-r,r],[r,r]]){if(solidTile(Math.floor(x+o[0]),Math.floor(y+o[1])))return false;}try{if(cars.length&&carHit(x,y,r*.8,null))return false;}catch(_){}return true;};
    window.__free=(a,len)=>{for(let d=.35;d<=len;d+=.35){if(!__clear(P.x+Math.cos(a)*d,P.y+Math.sin(a)*d))return false;}return true;};
    window.__freeLen=(x,y,a,max)=>{let d=0;for(;d<max;d+=.5){if(!__clear(x+Math.cos(a)*d,y+Math.sin(a)*d))break;}return d;};
    window.__steer=a=>{const H=__H;if(__free(a,1.5))return a;for(const o of [.3,.6,.9,1.2,1.6,2.1,2.6]){for(const s of [H.side,-H.side]){if(__free(a+o*s,1.3)){H.side=s;return a+o*s;}}}return a+Math.PI;};
    // mover: ang = rumbo deseado en el MUNDO (o null para parar); mag 0..1 (analógico)
    window.__mv=(ang,mag,o)=>{o=o||{};const H=__H;for(const k in keys)keys[k]=false;
      if(ang!=null){const a=__steer(ang)+Math.sin(H.t*.07+H.nz)*.05;if(H.dir==null)H.dir=a;let dd=a-H.dir;while(dd>Math.PI)dd-=6.2832;while(dd<-Math.PI)dd+=6.2832;H.dir+=dd*(o.turn||.2);}else mag=0;
      H.m+=(mag-H.m)*(mag>H.m?.2:.32); if(H.dir==null)H.dir=0;
      const wx=Math.cos(H.dir),wy=Math.sin(H.dir);const ix=(wx-wy)/2,iy=(wx+wy)/2,n=Math.hypot(ix,iy)||1;   // mundo -> pantalla (inversa de wx=ix+iy, wy=iy-ix)
      joy.active=H.m>.06;joy.x=joy.active?ix/n*H.m:0;joy.y=joy.active?iy/n*H.m:0;
      if(o.run&&H.m>.85)keys.ShiftLeft=true;};
    // apuntar como con ratón a un punto del mundo (suavizado: la mano no salta)
    window.__aim=(x,y,k)=>{const H=__H;if(x==null){IN.mouseT=99;H.ax=null;return;}if(H.ax==null){H.ax=P.x+Math.cos(P.dir)*2;H.ay=P.y+Math.sin(P.dir)*2;}H.ax+=(x-H.ax)*(k||.3);H.ay+=(y-H.ay)*(k||.3);const s=w2s(H.ax,H.ay);IN.mx=s[0]*SC;IN.my=s[1]*SC;IN.mouseT=0;};
    window.__near=()=>{let tz=null,td=1e9,n=0,cx=0,cy=0;for(const z of Z){if(z.st==='dead'||z.st==='down')continue;const d=Math.hypot(z.x-P.x,z.y-P.y);if(d<td){td=d;tz=z;}if(d<1.9){n++;cx+=z.x;cy+=z.y;}}return {tz,td,n,cx:n?cx/n:0,cy:n?cy/n:0};};
    // pulsar atacar cuando el arma está lista, con tiempo de reacción humano (1-5 cuadros)
    window.__trig=ok=>{const H=__H;IN.atk=false;if(!ok||P.atkCd>0||(P.act)){H.react=-1;return;}if(H.react<0)H.react=1+Math.floor(Math.random()*5);if(--H.react<=0){IN.atk=true;IN.atkQ=.3;H.react=-1;}};
    window.__log=tag=>{const n=__near();__LOG.push([tag,__H.t,+P.x.toFixed(2),+P.y.toFixed(2),+(P.dir||0).toFixed(2),+__H.m.toFixed(2),P.moving?1:0,IN.atk?1:0,+n.td.toFixed(2),Z.filter(z=>z.st!=='dead').length,LOWQ?1:0,CW,window.__placed||0,+(P.atkCd||0).toFixed(2),Math.round(P.end),P.act?(P.act.k||P.act.n||1):0,P.atk?1:0,BLD.on?(BLD.ok?1:0)+':'+(BLD.why||''):'']);};
    // --- cerebros por tipo de escena ---
    window.__melee=()=>{const H=__H;H.t++;const N=__near(),tz=N.tz,td=N.td;const w=wpnOf(),rng=w?w.rng:.85;
      if(!tz){__aim(null);__mv(null,0);IN.atk=false;return;}
      if(td<3.2)__aim(tz.x,tz.y,.35);else __aim(null);
      if(H.mode==='back'){if(--H.modeT<=0)H.mode='';__mv(Math.atan2(P.y-N.cy,P.x-N.cx),.95);__trig(td<rng+.2);return;}
      if(N.n>=3&&Math.random()<.08){H.mode='back';H.modeT=9+Math.floor(Math.random()*8);}
      const base=Math.atan2(tz.y-P.y,tz.x-P.x);
      if(td>rng+.45)__mv(base,td>4?1:.85,{run:td>4});
      else if(td<.6)__mv(base+Math.PI,.45);
      else __mv(base+Math.PI/2*H.side,.18);   // pequeño ajuste lateral mientras golpea
      __trig(td<rng+.35);};
    window.__gun=()=>{const H=__H;H.t++;const N=__near(),tz=N.tz,td=N.td;
      if(!tz){__aim(null);__mv(null,0);IN.atk=false;return;}
      __aim(tz.x,tz.y,.28);
      const base=Math.atan2(tz.y-P.y,tz.x-P.x);
      if(td<2.6)__mv(base+Math.PI,.85);                 // retrocede disparando
      else if(td<5)__mv(base+Math.PI/2*H.side,.32);     // se desplaza de lado
      else __mv(null,0);
      if(H.t%45===0)H.side=-H.side;
      __trig(td<6.5);};
  });
  await page.setViewportSize({ width:540, height:960 });
  // zoom fijo y calidad fija: sin el ajuste automático (que cambiaba el zoom a media escena)
  await ev(()=>{ try{ Object.defineProperty(window,'devicePixelRatio',{get:()=>1,configurable:true}); }catch(_){}
    OPT.q='high'; LOWQ=false; resize(); window.dispatchEvent(new Event('resize')); window.__play&&window.__play(); });
  // reloj CONGELADO: el tiempo del juego sólo avanza 1/30 s por cuadro (antes corría en tiempo real
  // durante cada captura de pantalla -> juego acelerado 4-7x y a tirones)
  { let ok=false; for(const add of [500,3000,30000,300000]){ try{ const now=await page.evaluate(()=>Date.now()); await page.clock.pauseAt(now+add); ok=true; console.log('pausado +'+add); break; }catch(e){ console.log('pauseAt +'+add+' fallo: '+e.message.split('\n')[0]); } } if(!ok) throw new Error('no se pudo congelar el reloj'); }
  await T.run(400);
  await ev(()=>{ OPT.q='high'; LOWQ=false; resize(); });
  const FAST=!!process.env.FAST, ONLY=process.env.SCENES||'';
  const rec = FAST ? async (dir,secs,hook)=>{ const n=Math.round(secs*FPS); for(let i=0;i<n;i++){ await hook(i/FPS,i); await page.clock.runFor(1000/FPS); } } : (d,s,h)=>T.rec(d,s,h);
  async function scene(tag, secs, setup, perFrame){
    if(ONLY && !ONLY.includes(tag)) return;
    if(setup){ await ev(setup); await ev(()=>{window.__play(); window.__H.dir=null; window.__H.m=0; window.__H.mode=''; window.__H.ax=null;}); }
    await rec(DIR, secs, (t,i)=>page.evaluate(([t,secs,i,tag])=>{window.__play(); if(LOWQ){LOWQ=false;resize();} window.__ad.op('0'); window.__ad.flash(i<2?(0.8-i*0.4).toFixed(2):'0'); window.__log(tag);},[t,secs,i,tag]).then(()=>perFrame&&perFrame(t,i)));
  }
  // ===== A · huir corriendo por la calle (esquivando zombis) =====
  await scene('A',3.6,()=>{ keepAlive(); clearZ(); const c=nearestCross(P.x,P.y); tp(c[0],c[1]); GT.min=17*60; GT.rain=0;GT.rainTarget=0;GT.rainT=9999;
      let best=0,bl=-1; for(const a of [0,Math.PI/2,Math.PI,-Math.PI/2]){ const L=__freeLen(P.x,P.y,a,30)+(a===0||a===Math.PI/2?3:0); if(L>bl){bl=L;best=a;} } window.__runA=best;
      const ca=Math.cos(best),sa=Math.sin(best);
      for(let k=0;k<7;k++){ const d=2.5+Math.random()*4, s=(Math.random()-.5)*5; const x=P.x-ca*d-sa*s, y=P.y-sa*d+ca*s; if(__clear(x,y)){const z=mkZombie(x,y);z.st='chase';z.seen=99;Z.push(z);} }   // detrás
      for(let k=0;k<4;k++){ const d=7+k*3.2, s=(k%2?1:-1)*(.6+Math.random()*1.2); const x=P.x+ca*d-sa*s, y=P.y+sa*d+ca*s; if(__clear(x,y)){const z=mkZombie(x,y);z.st='chase';z.seen=99;Z.push(z);} }       // delante: hay que esquivarlos
      window.__keep=setInterval(()=>keepAlive(),80); },
    (t,i)=>ev(i=>{ const H=__H;H.t++; __aim(null); let a=window.__runA, ax=0, ay=0;
      for(const z of Z){ if(z.st==='dead')continue; const dx=z.x-P.x,dy=z.y-P.y,d=Math.hypot(dx,dy); if(d<3.2&&d>.01){ const fwd=(dx*Math.cos(a)+dy*Math.sin(a)); if(fwd>-.3){ const w=(3.2-d)/3.2; ax-=dx/d*w*1.6; ay-=dy/d*w*1.6; } } }
      const vx=Math.cos(a)+ax, vy=Math.sin(a)+ay; __mv(i<4?null:Math.atan2(vy,vx), 1, {run:true,turn:.22}); IN.atk=false; },i));
  // ===== B · combate cuerpo a cuerpo =====
  await scene('B',4.0,()=>{ clearZ(); const c=nearestCross(P.x,P.y); tp(c[0],c[1]); GT.min=13*60; const w=give('katana'); P.eq=w; spawnRing(6,1.8,4); Z.forEach(z=>z.st='chase'); },
    (t,i)=>ev(i=>{ window.__melee(); if(Z.filter(z=>z.st!=='dead').length<5 && i%14===0){ spawnRing(2,3,5); Z.forEach(z=>{if(z.st!=='dead')z.st='chase';}); } },i));
  // ===== C · escopeta =====
  await scene('C',3.5,()=>{ clearZ(); const c=nearestCross(P.x,P.y); tp(c[0],c[1]); GT.min=15*60; const g=give('shotgun'); g.a=ITEMS.shotgun.mag; P.eq=g; give('shells',40);
      let best=0,bl=-1; for(const a of [0,Math.PI/2,Math.PI,-Math.PI/2]){ const L=__freeLen(P.x,P.y,a,14); if(L>bl){bl=L;best=a;} } window.__cA=best;
      for(let k=0;k<8;k++){ const a=best+(k-3.5)*.16, d=4.8+Math.random()*2.2, x=P.x+Math.cos(a)*d, y=P.y+Math.sin(a)*d; if(__clear(x,y)){ const z=mkZombie(x,y,'walker'); z.st='chase'; z.seen=99; Z.push(z);} } },
    (t,i)=>ev(i=>{ window.__gun(); if(Z.filter(z=>z.st!=='dead').length<4 && i%15===0){ const a=window.__cA+(Math.random()-.5)*1.1, d=6+Math.random()*1.5, x=P.x+Math.cos(a)*d,y=P.y+Math.sin(a)*d; if(__clear(x,y)){const z=mkZombie(x,y,'walker'); z.st='chase'; z.seen=99; Z.push(z);} } },i));
  // ===== D · construir (coloca un muro en L, a ritmo de persona) =====
  await scene('D',3.4,()=>{ clearZ(); const c=nearestCross(P.x,P.y); tp(c[0]+1,c[1]+1); GT.min=16*60; give('hammer'); give('plank',40); give('nails',60); try{ if(typeof addXP==='function'){ for(let k=0;k<30;k++) addXP('carp',10);} }catch(_){ } BLD.on=true; BLD.mode='build'; BLD.sel=BCID.wall;
      // buscar un solar donde SÍ se pueda construir (no en la calle) y una dirección con 4 casillas válidas
      let found=null; for(let r=2;r<14&&!found;r++) for(let k=0;k<32&&!found;k++){ const a=k/32*6.2832; const x=Math.floor(c[0]+Math.cos(a)*r)+.5, y=Math.floor(c[1]+Math.sin(a)*r)+.5; if(!__clear(x,y))continue;
        for(const d of [0,Math.PI/2,Math.PI,-Math.PI/2]){ let ok=true; for(let st=0;st<4&&ok;st++){ P.x=x+Math.cos(d)*st; P.y=y+Math.sin(d)*st; P.dir=d; if(!__clear(P.x,P.y)){ok=false;break;} bldUpdate(); if(!BLD.ok)ok=false; } if(ok){found=[x,y,d];break;} } }
      if(found){ tp(found[0],found[1]); P.dir=found[2]; window.__dA=found[2]; } else { tp(c[0]+1,c[1]+1); window.__dA=0; }
      bldUpdate(); window.__placed=0; window.__bfound=!!found; },
    (t,i)=>ev(i=>{ const H=__H;H.t++; __aim(null); IN.atk=false; const seg=24, s=Math.floor(i/seg), k=i%seg; const a=window.__dA+(s>=3?Math.PI/2:0);
      if(k<14) __mv(a,.55,{turn:.3}); else __mv(null,0);
      if(typeof bldUpdate==='function')bldUpdate(); if(k===18 && BLD.ok && typeof bldConfirm==='function'){ bldConfirm(); window.__placed++; } },i));
  await ev(()=>{ BLD.on=false; });
  // ===== E · la noche: avanza con cautela, se detiene a mirar con la linterna, retrocede ante un zombi =====
  await scene('E',3.3,()=>{ clearZ(); const c=nearestCross(P.x,P.y); tp(c[0],c[1]); GT.min=23.3*60; GT.rain=.6;GT.rainTarget=.6;GT.rainT=9999; give('flash'); P.light=true; P.eq=null;
      let best=0,bl=-1; for(const a of [0,Math.PI/2,Math.PI,-Math.PI/2]){ const L=__freeLen(P.x,P.y,a,20); if(L>bl){bl=L;best=a;} } window.__eA=best;
      const ca=Math.cos(best),sa=Math.sin(best); for(let k=0;k<6;k++){ const d=5.5+k*1.3, s=(k%2?1:-1)*(1+Math.random()*2); const x=P.x+ca*d-sa*s, y=P.y+sa*d+ca*s; if(__clear(x,y)){const z=mkZombie(x,y);z.st=k<3?'chase':'idle';z.seen=99;Z.push(z);} } },
    (t,i)=>ev(i=>{ const H=__H;H.t++; IN.atk=false; const N=__near(), a=window.__eA;
      if(N.tz && N.td<3.4){ __aim(N.tz.x,N.tz.y,.25); __mv(Math.atan2(P.y-N.tz.y,P.x-N.tz.x),.7); return; }
      const ph=i%50;
      if(ph<30){ __aim(P.x+Math.cos(a)*4,P.y+Math.sin(a)*4,.2); __mv(a,.42); }
      else { const sw=Math.sin((ph-30)/20*Math.PI*2)*1.0; __aim(P.x+Math.cos(a+sw)*4,P.y+Math.sin(a+sw)*4,.18); __mv(null,0); } },i));
  // ===== F · mundo enorme (mapa) =====
  await scene('F',3.0,()=>{ GT.min=14*60; GT.rain=0;GT.rainTarget=0; give('map'); UI.showMap(true); }, (t,i)=>ev(()=>{ __mv(null,0); IN.atk=false; }));
  await ev(()=>UI.showMap(false));
  // ===== G · cierre =====
  await scene('G',3.2,()=>{ clearZ(); const c=nearestCross(P.x,P.y); tp(c[0],c[1]); GT.min=18.5*60; GT.rain=.25;GT.rainTarget=.25; spawnRing(6,3,6); Z.forEach(z=>z.st='chase'); const w=give('katana'); P.eq=w; },
    (t,i)=>page.evaluate(([t])=>{ window.__ad.end(Math.min(1,t/0.45).toFixed(2)); window.__melee(); },[t]));
  const log=await ev(()=>window.__LOG);
  require('fs').writeFileSync(process.env.LOG||'/dev/null', JSON.stringify(log));
  console.log('FRAMES_END', T.frame); await T.close();
})();
