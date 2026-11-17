# copies built simulators to the site and refreshes every dropdown's built-in list
import json,os,re,shutil,subprocess,sys
SC=os.path.dirname(os.path.abspath(__file__));ROOT=os.path.dirname(SC);SITE='/home/user/barycenter-site'
SIMS=json.load(open(os.path.join(SC,'kit','sims.json')))
json.dump(SIMS,open(os.path.join(SITE,'sims.json'),'w'),ensure_ascii=False,indent=1)
for s in SIMS:
    d=os.path.join(SC,s['id'])
    if os.path.exists(os.path.join(d,'meta.json')):
        subprocess.run([sys.executable,os.path.join(SC,'kit','build.py'),d],check=True,stdout=subprocess.DEVNULL)
        os.makedirs(os.path.join(SITE,s['id']),exist_ok=True);shutil.copy(os.path.join(d,'site','index.html'),os.path.join(SITE,s['id'],'index.html'))
def relist(path,me):
    t=open(path).read();n=re.subn(r'const ME="[^"]*",LIST=\[.*?\],P=','const ME='+json.dumps(me)+',LIST='+json.dumps(SIMS,ensure_ascii=False)+',P=',t,count=1,flags=re.S)
    assert n[1]==1,path;open(path,'w').write(n[0])
relist(os.path.join(ROOT,'barycenter.html'),'barycenter')
gp=os.path.join(ROOT,'bio','game.js');gt=open(gp).read();a=gt.index('/* ===== account helpers');b=gt.index('/* ================= start');gt=gt[:a]+open(os.path.join(SC,'kit','acct.js')).read()+'\n'+gt[b:];open(gp,'w').write(gt)
print('ok',[s['id'] for s in SIMS])
