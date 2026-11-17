# Checks every link to our own site in every page (and sims.json): the repo is "Simulators" (capital S) and
# GitHub Pages is case-sensitive, so each link must start with /Simulators/ and point at a file that exists.
import os,re,json,sys
SITE='/home/user/barycenter-site';BASE='https://jacob711-oss.github.io/'
bad=[];seen=0
def check(url,where):
    global seen
    u=url.split('#')[0].split('?')[0]
    if not u.lower().startswith(BASE.lower()):return
    seen+=1;path=u[len(BASE):]
    if not path.startswith('Simulators/') and path!='Simulators':bad.append((where,url,'wrong case or name'));return
    rel=path[len('Simulators/'):] if path.startswith('Simulators/') else ''
    f=os.path.join(SITE,rel)
    if rel=='' or rel.endswith('/'):f=os.path.join(SITE,rel,'index.html')
    if not os.path.exists(f):bad.append((where,url,'missing '+os.path.relpath(f,SITE)))
for root,_,files in os.walk(SITE):
    if '.git' in root or '/source' in root:continue
    for fn in files:
        p=os.path.join(root,fn)
        if fn.endswith('.html'):
            t=open(p,encoding='utf-8',errors='ignore').read()
            for m in re.finditer(r'https://jacob711-oss\.github\.io/[A-Za-z0-9_./?#=%&+-]*',t):check(m.group(0),os.path.relpath(p,SITE))
            # relative links and pictures inside the page
            for m in re.finditer(r'(?:href|src)="([^"#:]+)"',t):
                r=m.group(1)
                if r.startswith(('//','data:','mailto:','javascript:')) or '${' in r:continue
                q=os.path.normpath(os.path.join(root,r.split('?')[0]));q=os.path.join(q,'index.html') if r.endswith('/') else q
                if not os.path.exists(q):bad.append((os.path.relpath(p,SITE),r,'missing relative'))
for s in json.load(open(os.path.join(SITE,'sims.json'))):check(s['url'],'sims.json')
print('checked',seen,'site links;',len(bad),'problems')
for b in bad[:40]:print(' ',b)
sys.exit(1 if bad else 0)
