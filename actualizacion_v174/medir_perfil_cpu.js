// Perfil de CPU real (CDP Profiler) en escenas pesadas, CPU x4; agrega tiempo propio por función
const { newTake } = require('./lib'); const THR=+(process.env.THROTTLE||4);
const SC={ horda:()=>{ clearZ(); const c=nearestCross(P.x,P.y); tp(c[0],c[1]); window.__lock=22*60; spawnRing(60,5,16); },
  noche:()=>{ clearZ(); const c=nearestCross(P.x,P.y); tp(c[0],c[1]); window.__lock=23*60; GT.rain=1; GT.rainTarget=1; give('flash'); P.light=true; spawnRing(15,5,14); } };
(async()=>{ for(const [n,f] of Object.entries(SC)){ if(process.env.ONLY&&process.env.ONLY!==n)continue;
  const T=await newTake({html:process.env.H,seed:'stg',rt:true,w:915,h:412,dsf:2.625,hideUI:[]});
  const cdp=await T.page.context().newCDPSession(T.page); await cdp.send('Emulation.setCPUThrottlingRate',{rate:THR});
  await T.ev(()=>{ window.__keep=setInterval(()=>{ if(P){P.hp=100;P.end=100;} if(window.__lock)GT.min=window.__lock; },100); });
  await T.ev(f); await T.run(2500);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval',{interval:200}); await cdp.send('Profiler.start');
  await T.run(6000);
  const {profile}=await cdp.send('Profiler.stop');
  const self={}; const byId={}; for(const nd of profile.nodes) byId[nd.id]=nd;
  const dt=profile.timeDeltas; const cnt={}; profile.samples.forEach((id,i)=>{ cnt[id]=(cnt[id]||0)+(dt[i]||0); });
  let tot=0; for(const id in cnt){ const nd=byId[id]; const k=(nd.callFrame.functionName||'(anon)')+(nd.callFrame.url?'':'*'); self[k]=(self[k]||0)+cnt[id]; tot+=cnt[id]; }
  const top=Object.entries(self).sort((a,b)=>b[1]-a[1]).slice(0,28);
  console.log('### '+n+' total '+(tot/1000).toFixed(0)+'ms');
  for(const [k,v] of top) console.log(String((v/tot*100).toFixed(1)).padStart(5)+'%  '+k);
  await T.close(); } })();
