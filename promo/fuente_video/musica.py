import numpy as np, wave, struct, sys
SR=44100; DUR=24.0; N=int(SR*DUR)
t=np.arange(N)/SR
L=np.zeros(N); Rr=np.zeros(N)
def env(a,d,s,r,n):  # ADSR sobre n muestras
    e=np.zeros(n); ai=int(a*SR); di=int(d*SR); ri=int(r*SR); si=max(0,n-ai-di-ri)
    i=0
    if ai: e[:ai]=np.linspace(0,1,ai); i=ai
    if di: e[i:i+di]=np.linspace(1,s,di); i+=di
    if si: e[i:i+si]=s; i+=si
    if ri: e[i:i+ri]=np.linspace(s,0,ri)
    return e
def saw(f,n): ph=2*np.pi*f*np.arange(n)/SR; return (2*(ph/(2*np.pi)%1)-1)
def sq(f,n,duty=.5): ph=(f*np.arange(n)/SR)%1; return np.where(ph<duty,1.0,-1.0)
def add(buf,sig,at):
    i=int(at*SR); j=min(len(buf),i+len(sig)); buf[i:j]+=sig[:j-i]
def note(freq,dur,vol,kind='sq',a=.005,d=.04,s=.6,r=.05,duty=.5):
    n=int(dur*SR); 
    if kind=='sq': w=sq(freq,n,duty)
    elif kind=='saw': w=saw(freq,n)
    else: w=np.sin(2*np.pi*freq*np.arange(n)/SR)
    return w*env(a,d,s,r,n)*vol
NF={'A2':110.0,'C3':130.81,'D3':146.83,'E3':164.81,'F3':174.61,'G3':196.0,'A3':220.0,'C4':261.63,'D4':293.66,'E4':329.63,'F4':349.23,'G4':392.0,'A4':440.0,'E2':82.41,'F2':87.31,'G2':98.0}
BPM=124.0; beat=60.0/BPM; bar=beat*4
# progresión por compás (Am - F - G - E), oscura y tensa; 20s de loop + outro
prog=['A','F','G','E']
root={'A':'A2','F':'F2','G':'G2','E':'E2'}
chord={'A':['A3','C4','E4'],'F':['F3','A3','C4'],'G':['G3','D4','G4'] if False else ['G3','D4','G4'],'E':['E3','G3','E4'] if False else ['E3','G3','B3'] if False else ['E3','A3','C4']}
chord={'A':['A3','C4','E4'],'F':['F3','A3','C4'],'G':['G3','D4','G4'],'E':['E3','G3','C4']}
# --- batería ---
def kick(at,vol=0.9):
    n=int(0.16*SR); tt=np.arange(n)/SR; f=110*np.exp(-tt*28)+45; w=np.sin(2*np.pi*np.cumsum(f)/SR); w*=np.exp(-tt*9)*vol; add(L,w,at); add(Rr,w,at)
def hat(at,vol=0.22,dur=0.04):
    n=int(dur*SR); w=(np.random.rand(n)*2-1)*np.exp(-np.arange(n)/SR*90)*vol; add(L,w*.9,at); add(Rr,w,at)
def snare(at,vol=0.5):
    n=int(0.12*SR); tt=np.arange(n)/SR; no=(np.random.rand(n)*2-1); to=np.sin(2*np.pi*190*tt); w=(no*.7+to*.3)*np.exp(-tt*22)*vol; add(L,w,at); add(Rr,w,at)
NBARS=5  # 5 compases de groove (~9.7s)... extenderemos
total_bars=int(20/bar)+1
for b in range(total_bars):
    ch=prog[b%4]; at0=b*bar
    # bajo: raíz en corcheas con octava
    for k in range(8):
        f=NF[root[ch]]*(1.0 if k%2==0 else 2.0)
        add(L,note(f,beat/2*0.95,0.33,'saw',a=.004,d=.05,s=.5,r=.03)*.9, at0+k*beat/2)
        add(Rr,note(f,beat/2*0.95,0.33,'saw',a=.004,d=.05,s=.5,r=.03)*.9, at0+k*beat/2)
    # pad de acorde (suave, estéreo)
    for ni,nm in enumerate(chord[ch]):
        pan=0.5+(ni-1)*0.33
        sig=note(NF[nm],bar*0.98,0.11,'sq',a=.03,d=.2,s=.7,r=.15,duty=.46)
        add(L,sig*(1-pan)*1.4,at0); add(Rr,sig*pan*1.4,at0)
    # arpegio agudo en corcheas
    arp=chord[ch]*3
    for k in range(8):
        nm=arp[k%len(chord[ch])]; f=NF[nm]*2
        sig=note(f,beat/2*0.8,0.12,'sq',a=.002,d=.03,s=.3,r=.03,duty=.3)
        add(L,sig*(.7 if k%2 else 1.0),at0+k*beat/2); add(Rr,sig*(1.0 if k%2 else .7),at0+k*beat/2)
    # batería: kick a negras, hats a corcheas, snare en 2 y 4
    for k in range(4): kick(at0+k*beat, .95 if k==0 else .8)
    for k in range(8): hat(at0+k*beat/2, .18 if k%2 else .12)
    snare(at0+beat); snare(at0+3*beat)
# --- riser y golpe final (outro para la tarjeta) ---
rise_at=20.0
n=int(1.0*SR); no=(np.random.rand(n)*2-1); sweep=np.exp(np.linspace(0,2.0,n))-1; sweep/=sweep.max()
riser=no*sweep*0.5*np.linspace(.2,1,n)
add(L,riser,rise_at); add(Rr,riser,rise_at)
# golpe: kick fuerte + crash + acorde Am sostenido
kick(21.0,1.1)
ncr=int(2.4*SR); cr=(np.random.rand(ncr)*2-1)*np.exp(-np.arange(ncr)/SR*3.2)*0.4; add(L,cr,21.0); add(Rr,cr*.95,21.0)
for ni,nm in enumerate(['A3','C4','E4','A4']):
    pan=0.5+(ni-1.5)*0.22
    sig=note(NF.get(nm,440),2.9,0.16,'saw',a=.01,d=.3,s=.6,r=1.2)
    add(L,sig*(1-pan)*1.3,21.0); add(Rr,sig*pan*1.3,21.0)
add(L,note(NF['A2'],2.9,0.3,'saw',a=.01,d=.4,s=.6,r=1.2),21.0); add(Rr,note(NF['A2'],2.9,0.3,'saw',a=.01,d=.4,s=.6,r=1.2),21.0)
# --- mezcla final: fade in/out, normaliza, soft-clip ---
mix=np.vstack([L,Rr])
fi=int(0.06*SR); mix[:, :fi]*=np.linspace(0,1,fi)
fo=int(0.6*SR); mix[:, -fo:]*=np.linspace(1,0,fo)
mix=np.tanh(mix*0.8)
mix/=np.max(np.abs(mix))+1e-9; mix*=0.95
data=(mix.T*32767).astype('<i2')
with wave.open(sys.argv[1],'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes())
print('musica ok', sys.argv[1], round(DUR,1),'s')
