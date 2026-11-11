import os,sys,time,glob
pat=sys.argv[1]; dur=float(sys.argv[2])
def snap():
    t=0; n=0; rss=0
    for p in glob.glob('/proc/[0-9]*'):
        try:
            cmd=open(p+'/cmdline','rb').read().decode('utf8','ignore')
            if pat not in cmd: continue
            st=open(p+'/stat').read().rsplit(')',1)[1].split(); t+=int(st[11])+int(st[12]); n+=1
            rss+=int(open(p+'/statm').read().split()[1])*4096
        except Exception: pass
    return t,n,rss
a=snap(); t0=time.time(); time.sleep(dur); b=snap(); dt=time.time()-t0
hz=os.sysconf('SC_CLK_TCK'); print('CPU %.1f%% de un núcleo, %d procesos, %.0f MB'%((b[0]-a[0])/hz/dt*100,b[1],b[2]/1e6))
