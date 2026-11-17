import re
head=open('head.html').read();sim=open('sim.js').read()+'\n'+open('catalog.js').read();ui=open('ui.js').read();game=open('game.js').read()
# drawing helpers draw on a swappable context gx, so the inspector portrait can reuse them
def swap(src,name):
    s=src.index('function '+name+'(');
    # find end: next '\nfunction ' after s
    e=src.index('\nfunction ',s+10)
    body=src[s:e].replace('ctx.','gx.')
    return src[:s]+body+src[e:]
for n in ['drawTree','drawAnimal','drawAnimal_','hawkShape','drawHome']: ui=swap(ui,n)
ui=ui.replace("const cv=$('world'),ctx=cv.getContext('2d');","const cv=$('world'),ctx=cv.getContext('2d');let gx=ctx;")
ui=ui.replace("const save=ctx;ctxSwap(p,()=>{if(o.k)drawTree(o,w/2,hh/2,5.5);else drawAnimal({...o,dir:-0.35},w/2,hh/2,1,o.sp==='mouse'?7:o.sp==='fish'?6:SP[o.sp].len>10?2.6:4)})}",
 "const old=gx;gx=p;try{if(o.k)drawTree(o,w/2,hh/2,5.5);else drawAnimal({...o,dir:-0.35},w/2,hh/2,1,o.sp==='mouse'?7:o.sp==='fish'?6:SP[o.sp].len>10?2.6:4)}finally{gx=old}}")
ui=re.sub(r"function ctxSwap\(p,f\)\{.*?\n","",ui);ui=ui.replace("const CTXREF={c:null};\n","")
ui=ui.replace("function climateEvent(ev){chEv('event',{ev});","function climateEvent(ev){chEv('event',{ev});EVN++;")
assert 'ctxSwap' not in ui and 'let gx=ctx' in ui and 'EVN++' in ui
game=game.replace('resize();buildRail();',open('creator.js').read()+'\nresize();buildRail();',1)
game=game+'\n'+open('../sims/kit/noemoji.js').read()+'\n'+open('../sims/kit/extras.js').read()
import sys as _s;_s.path.insert(0,'../sims/kit');from statenames import state_names as _sn
_names=[n for n in _sn([sim,ui,game]) if n not in ('S',)]+['S']
game=game+'\nvar SIM={id:"biosphere",name:"Biosphere",freeScen:"meadow",home:"meadow",defSpeed:7,saveEvery:60000,scens:SCEN.map(s=>({id:s.id,name:s.n,desc:s.d})),start:id=>{leaveHome();loadScen(id);countPlay()}};\nvar __STATE_NAMES='+__import__('json').dumps(_names)+';\n'+open('../sims/kit/worlds.js').read()
out=head+'\n<script>\n'+sim+'\n'+ui+'\n'+game+'\n</script>\n'
open('../biosphere.html','w').write(out);print(len(out))
