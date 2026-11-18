import json,sys,os,re,html
K=os.path.dirname(os.path.abspath(__file__));D=os.path.abspath(sys.argv[1])
M=json.load(open(os.path.join(D,'meta.json')))
SIMS=json.load(open(os.path.join(K,'sims.json')))
if not M.get('nohub') and not any(s['id']==M['id'] for s in SIMS):
    SIMS.append({k:M[k] for k in ['id','icon','name','tag','url','color']});json.dump(SIMS,open(os.path.join(K,'sims.json'),'w'),ensure_ascii=False,indent=1)
css=open(os.path.join(K,'style.css')).read().replace('/*THEME*/',M['theme'])
extra=open(os.path.join(D,'extra.css')).read() if os.path.exists(os.path.join(D,'extra.css')) else ''
css=css.replace('</style>',extra+'\n</style>')
dd=open(os.path.join(K,'dropdown.html')).read()
dd=re.sub(r'const ME="[^"]*",LIST=\[.*?\],P=','const ME='+json.dumps(M['id'])+',LIST='+json.dumps(SIMS,ensure_ascii=False)+',P=',dd,count=1,flags=re.S)
assert 'const ME='+json.dumps(M['id']) in dd

def state_names(srcs):
    # every top-level let/const/var name in the game's own code: these hold the world, for saving
    names=[]
    for src in srcs:
        for line in src.split('\n'):
            m=re.match(r'(let|const|var)\s+(.*)',line)
            if not m:continue
            rest=m.group(2);depth=0;q=None;start=0;parts=[]
            i=0
            while i<len(rest):
                ch=rest[i]
                if q:
                    if ch=='\\':i+=2;continue
                    if ch==q:q=None
                elif ch in '\'"`':q=ch
                elif ch in '([{':depth+=1
                elif ch in ')]}':depth-=1
                elif ch==',' and depth==0:parts.append(rest[start:i]);start=i+1
                elif ch==';' and depth==0:break
                if depth<0:break
                i+=1
            parts.append(rest[start:i])
            for p in parts:
                n=re.match(r'\s*([A-Za-z_$][\w$]*)\s*(=|$)',p)
                if n and n.group(1) not in names:names.append(n.group(1))
    return names
shell=open(os.path.join(K,'shell.html')).read()
tabs=''.join(f'<button class="tab" role="tab" data-tab="{t}" aria-selected="{"true" if i==0 else "false"}">{l}</button>' for i,(t,l) in enumerate(M['tabs']))
rep={'TABS':tabs,'PANES':open(os.path.join(D,'panes.html')).read(),'DROPDOWN':dd}
for k,v in M['text'].items():rep[k]=html.escape(v,quote=True)
def sub(m):
    k=m.group(1);assert k in rep,k;return rep[k]
shell=re.sub(r'\{\{(\w+)\}\}',sub,shell)
js='const __STATE_NAMES='+json.dumps(state_names([open(os.path.join(D,f)).read() for f in M['js']]))+';\n'+'const SIMLIST='+json.dumps(SIMS,ensure_ascii=False)+',LB_GAME='+json.dumps(M['id'])+';\n'+'\n'.join(open(os.path.join(K,'core.js')).read() if f=='@core' else open(os.path.join(K,'run.js')).read() if f=='@run' else open(os.path.join(K,'extras.js')).read() if f=='@extras' else open(os.path.join(K,'noemoji.js')).read() if f=='@noemoji' else open(os.path.join(K,'worlds.js')).read() if f=='@worlds' else open(os.path.join(K,'askq.js')).read() if f=='@askq' else open(os.path.join(D,f)).read() for f in ['@core']+M['js']+['@noemoji','@extras','@askq','@run','@worlds'])+'\n'+open(os.path.join(K,'acct.js')).read()
head=f'<title>{html.escape(M["title"])}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oxanium:wght@500;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">\n'
libs=''.join('<script>\n'+open(os.path.join(D,l)).read()+'\n</script>\n' for l in M.get('libs',[]))
frag=head+css+'\n'+shell+'\n'+libs+'<script>\n'+js+'\n</script>\n'
out=os.path.join(os.path.dirname(D),M['id']+'.html');open(out,'w').write(frag)
page='<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="description" content="'+html.escape(M['text']['TAG'],quote=True)+'">\n'+head+css+'\n</head>\n<body>\n'+shell+'\n'+libs+'<script>\n'+js+'\n</script>\n</body>\n</html>\n'
os.makedirs(os.path.join(D,'site'),exist_ok=True);open(os.path.join(D,'site','index.html'),'w').write(page)
print(out,len(frag))
