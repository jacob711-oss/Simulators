/* ===== simulator kit: UI, home, accounts, challenges, tutorial, demo, main loop ===== */
const cv=$('world'),ctx=cv.getContext('2d');
function resize(){W=innerWidth;H=innerHeight;DPR=Math.min(2,devicePixelRatio||1);cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);measureHud();if(SIM.resize)SIM.resize()}
function measureHud(){const h=document.querySelector('.hud-top');if(h)document.documentElement.style.setProperty('--hudH',Math.round(h.getBoundingClientRect().height)+'px')}
const sx=wx=>(wx-cam.x)*cam.z+W/2+cam.ox,sy=wy=>(wy-cam.y)*cam.z+H/2;
const wxOf=px=>(px-W/2-cam.ox)/cam.z+cam.x,wyOf=py=>(py-H/2)/cam.z+cam.y;
function freeRect(){let l=0,r=W,t=0,b=H;if(!$('home').hidden)return{l,r,t,b};const vis=e=>e&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().width>0;const hud=document.querySelector('.hud-top'),rail=$('rail'),dock=$('dock');
  if(vis(hud))t=hud.getBoundingClientRect().bottom+8;if(innerWidth>760){if(vis(rail))l=rail.getBoundingClientRect().right+8;if(vis(dock))r=dock.getBoundingClientRect().left-8;b=H-50}else{if(vis(rail))b=rail.getBoundingClientRect().top-8;if(vis(dock)&&document.body.classList.contains('dockOpen'))b=Math.min(b,dock.getBoundingClientRect().top-8)}
  if(r-l<200){l=0;r=W}if(b-t<150){t=0;b=H}return{l,r,t,b}}
function fitWorld(){const w=SIM.world.w,h=SIM.world.h;if(SIM.world.wrapX){cam.z=Math.max(W/w,H/h);cam.x=w/2;cam.y=h/2;clampCam();return}const f=freeRect(),fw=f.r-f.l,fh=f.b-f.t;cam.z=Math.min(fw/w,fh/h)*0.96;if(W<760&&fh>fw*1.05)cam.z=Math.min(Math.max(fw/w,fh/h),cam.z*1.7);cam.x=w/2-((f.l+f.r)/2-W/2-cam.ox)/cam.z;cam.y=h/2-((f.t+f.b)/2-H/2)/cam.z;clampCam()}
function minZoom(){const w=SIM.world.w,h=SIM.world.h;return SIM.world.wrapX?H/h:Math.min(W/w,H/h)*0.5}
function clampCam(){const h=SIM.world.h,w=SIM.world.w;cam.z=clamp(cam.z,minZoom(),SIM.world.maxZ||40);if(SIM.world.wrapX){const hy=H/2/cam.z;cam.y=clamp(cam.y,Math.min(h/2,hy),Math.max(h/2,h-hy))}else cam.y=clamp(cam.y,-h*0.5,h*1.5);if(SIM.world.wrapX)cam.x=mod(cam.x,w);else cam.x=clamp(cam.x,-w*0.5,w*1.5)}
function zoomAt(f,px,py){const wx=wxOf(px),wy=wyOf(py);cam.z*=f;clampCam();cam.x+=wx-wxOf(px);cam.y+=wy-wyOf(py);clampCam();bump('zoomed')}
function flyToW(x,y,z){S.follow=false;cam.x=x;cam.y=y;if(z)cam.z=Math.max(cam.z,z);clampCam()}

/* speeds */
function buildSpeeds(){const b=$('spds');b.textContent='';SIM.speeds.forEach(([l,v],i)=>{const e=document.createElement('button');e.className='spd';e.textContent=l;e.onclick=()=>{setSpeed(i);setPaused(false)};b.appendChild(e)})}
function setSpeed(i){i=clamp(i,0,SIM.speeds.length-1);S.speedI=i;S.speed=SIM.speeds[i][1];[...$('spds').children].forEach((e,k)=>e.setAttribute('aria-pressed',k===i));updateRate()}
function setPaused(p){S.paused=p;$('pauseBtn').innerHTML=p?'<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 2.2l10 5.8-10 5.8z" fill="currentColor"/></svg>':'<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="3" y="2" width="3.6" height="12" rx="1" fill="currentColor"/><rect x="9.4" y="2" width="3.6" height="12" rx="1" fill="currentColor"/></svg>';$('pauseBtn').setAttribute('aria-label',p?'Resume':'Pause');updateRate()}
function updateRate(){$('rateTxt').textContent=S.paused?'Paused':SIM.fmtRate(S.speed)+(S.achieved<S.speed*0.8&&!S.paused?` (running ${SIM.fmtRate(Math.max(S.achieved,S.speed*0.01))})`:'')}
$('pauseBtn').onclick=()=>setPaused(!S.paused);

/* tools */
function buildRail(){const r=$('rail');r.textContent='';for(const [g,items] of SIM.tools){if(g){const h=document.createElement('h3');h.textContent=g;r.appendChild(h)}
  for(const [id,ico,name] of items){const b=document.createElement('button');b.className='tool';b.dataset.tool=id;b.innerHTML='<span class="ico"></span><span></span>';b.children[0].textContent=ico;b.children[1].textContent=name;b.onclick=()=>setTool(id);r.appendChild(b)}}}
function toolInfo(id){for(const [,items] of SIM.tools)for(const t of items)if(t[0]===id)return t;return null}
function setTool(id){S.tool=id;document.querySelectorAll('.tool').forEach(b=>b.setAttribute('aria-pressed',b.dataset.tool===id));const t=toolInfo(id);
  $('placeopts').hidden=id==='select'||!t;$('toolNote').textContent=t&&t[3]||'';$('brush').parentElement.hidden=!(t&&t[4]);cv.classList.toggle('place',id!=='select');if(id!=='select')bump('tool');if(SIM.toolChanged)SIM.toolChanged(id)}
$('brush').oninput=e=>{S.brush=+e.target.value;$('brushV').textContent=S.brush};

/* dock tabs */
function showTab(id){document.body.classList.remove('dockHidden');document.querySelectorAll('.tab').forEach(t=>t.setAttribute('aria-selected',t.dataset.tab===id));document.querySelectorAll('#dock .pane').forEach(p=>p.hidden=p.id!=='pane-'+id);bump('tab_'+id);if(SIM.tabShown)SIM.tabShown(id)}
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>showTab(t.dataset.tab));
$('dockBtn').onclick=()=>{if(document.body.classList.contains('dockHidden')){document.body.classList.remove('dockHidden');document.body.classList.add('dockOpen')}else document.body.classList.toggle('dockOpen');setTimeout(()=>{if(!SIM.world.wrapX)fitWorld()},30)};
$('dockClose').onclick=()=>{document.body.classList.add('dockHidden');document.body.classList.remove('dockOpen');bump('dockclose');setTimeout(()=>{if(!SIM.world.wrapX)fitWorld()},30)};
function setView(v){S.view=v;document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===v));bump('view');if(SIM.viewChanged)SIM.viewChanged(v)}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
function setLegend(title,grad,ticks){const L=$('legend');if(!title){L.hidden=true;return}L.hidden=false;L.children[0].textContent=title;L.children[1].style.background=grad;[...L.children[2].children].forEach((s,i)=>s.textContent=ticks[i]||'')}

/* scenarios */
function buildScen(){const g=$('scgrid');g.textContent='';for(const s of SIM.scens){const b=document.createElement('button');b.className='scb';b.innerHTML='<b></b><span></span>';b.children[0].textContent=s.name;b.children[1].textContent=s.desc;b.onclick=()=>{$('scen').hidden=true;loadScen(s.id);bump('scen');toast(s.name)};g.appendChild(b)}}
function loadScen(id){S.t=0;S.sel=null;S.follow=false;SIM.load(id);S.scen=id;fitWorld();if(SIM.after)SIM.after()}
$('scenBtn').onclick=()=>$('scen').hidden=!$('scen').hidden;$('scenClose').onclick=()=>$('scen').hidden=true;

/* find */
let findItems=[],findI=0;
function renderFind(){const L=$('findList'),q=$('find').value.trim();findItems=q?SIM.find(q.toLowerCase()).slice(0,10):[];findI=0;L.hidden=!findItems.length;L.textContent='';
  findItems.forEach((it,i)=>{const b=document.createElement('button');b.className=i===findI?'on':'';b.innerHTML='<span></span><small></small>';b.children[0].textContent=it.label;b.children[1].textContent=it.sub||'';b.onmousedown=e=>{e.preventDefault();doFind(i)};L.appendChild(b)})}
function doFind(i){const it=findItems[i];if(!it)return;$('find').value='';$('findList').hidden=true;$('find').blur();it.go();bump('find')}
$('find').oninput=renderFind;$('find').onblur=()=>setTimeout(()=>$('findList').hidden=true,120);
$('find').onkeydown=e=>{if(e.key==='Enter'){doFind(findI)}else if(e.key==='ArrowDown'||e.key==='ArrowUp'){findI=clamp(findI+(e.key==='ArrowDown'?1:-1),0,findItems.length-1);[...$('findList').children].forEach((b,k)=>b.className=k===findI?'on':'');e.preventDefault()}else if(e.key==='Escape'){$('find').blur()}};

/* pointer input */
const ptrs=new Map();let drag=null,pinch=null;
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:cam.z};if(drag&&drag.tool)SIM.pointer('up',wxOf(e.clientX),wyOf(e.clientY),e);drag=null;return}
  const pan=S.tool==='select'||e.button===1||e.button===2;
  drag={x0:e.clientX,y0:e.clientY,lx:e.clientX,ly:e.clientY,moved:0,pan,tool:!pan};
  if(!pan)SIM.pointer('down',wxOf(e.clientX),wyOf(e.clientY),e)});
cv.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(p){p.x=e.clientX;p.y=e.clientY}
  if(pinch&&ptrs.size===2){const [a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;const f=pinch.z*d/pinch.d/cam.z;zoomAt(f,mx,my);if(pinch.mx!=null){S.follow=false;cam.x-=(mx-pinch.mx)/cam.z;cam.y-=(my-pinch.my)/cam.z;clampCam();CNT.moved+=Math.abs(mx-pinch.mx)+Math.abs(my-pinch.my)}pinch.mx=mx;pinch.my=my;return}
  if(!drag){if(SIM.hover)SIM.hover(wxOf(e.clientX),wyOf(e.clientY));return}
  const dx=e.clientX-drag.lx,dy=e.clientY-drag.ly;drag.lx=e.clientX;drag.ly=e.clientY;drag.moved+=Math.abs(dx)+Math.abs(dy);
  if(drag.pan){S.follow=false;cam.x-=dx/cam.z;cam.y-=dy/cam.z;clampCam();CNT.moved+=Math.abs(dx)+Math.abs(dy)}else SIM.pointer('drag',wxOf(e.clientX),wyOf(e.clientY),e)});
function endPtr(e){ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=null;if(!drag)return;const d=drag;drag=null;
  if(d.tool)SIM.pointer('up',wxOf(e.clientX),wyOf(e.clientY),e);else if(d.moved<6&&e.button!==2){S.follow=false;S.sel=SIM.pick(wxOf(e.clientX),wyOf(e.clientY))||null;if(S.sel&&SIM.inspectTab){showTab(SIM.inspectTab);document.body.classList.add('dockOpen')}if(SIM.selChanged)SIM.selChanged();deselBtn()}}
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);
cv.addEventListener('dblclick',e=>{if(S.sel&&S.tool==='select'&&SIM.canFollow){S.follow=true;cam.z=Math.max(cam.z,SIM.world.followZ||cam.z)}});
cv.addEventListener('wheel',e=>{e.preventDefault();zoomAt(Math.exp(-e.deltaY*0.0015),e.clientX,e.clientY)},{passive:false});
$('zIn').onclick=()=>zoomAt(1.4,W/2+cam.ox,H/2);$('zOut').onclick=()=>zoomAt(1/1.4,W/2+cam.ox,H/2);$('zFit').onclick=()=>{fitWorld();bump('zoomed')};
const keys=new Set();
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT'||e.target.tagName==='TEXTAREA')return;const k=e.key.toLowerCase();
  if(k===' '){e.preventDefault();setPaused(!S.paused)}else if(k==='escape'){if(S.tool!=='select')setTool('select');else{S.sel=null;S.follow=false;if(SIM.selChanged)SIM.selChanged()}}
  else if(k==='+'||k==='=')zoomAt(1.25,W/2+cam.ox,H/2);else if(k==='-')zoomAt(0.8,W/2+cam.ox,H/2);else keys.add(k)});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function camKeys(dt){let dx=0,dy=0;if(keys.has('a')||keys.has('arrowleft'))dx--;if(keys.has('d')||keys.has('arrowright'))dx++;if(keys.has('w')||keys.has('arrowup'))dy--;if(keys.has('s')||keys.has('arrowdown'))dy++;
  if(dx||dy){S.follow=false;const sp=600*dt/cam.z;cam.x+=dx*sp;cam.y+=dy*sp;clampCam();CNT.moved+=600*dt}}

/* accounts (shared by every simulator on the site) */
const lsGet=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const ACC_KEY='barycenter.accounts',PROG_KEY=SIM.id+'.progress';
let ACC=lsGet(ACC_KEY);if(!ACC||!Array.isArray(ACC.list))ACC={list:[],cur:'guest',devicePlays:0};if(ACC.cur!=='guest'&&!ACC.list.some(a=>a.id===ACC.cur))ACC.cur='guest';
let ACCN=0;
const progKey=id=>id==='guest'?PROG_KEY:PROG_KEY+'.'+id;
const blankProg=()=>({stars:{},plays:0,secs:0});
let PROG=blankProg();
function loadProg(){const v=lsGet(progKey(ACC.cur));PROG=Object.assign(blankProg(),v&&typeof v.stars==='object'?v:{})}
function saveProg(){lsSet(progKey(ACC.cur),PROG)}
function saveAcc(){const cur=lsGet(ACC_KEY);if(cur&&Array.isArray(cur.list)){for(const a of ACC.list){const o=cur.list.find(x=>x.id===a.id);if(o)Object.keys(o).forEach(k=>{if(!(k in a))a[k]=o[k]})}for(const o of cur.list)if(!ACC.list.some(a=>a.id===o.id))ACC.list.push(o);if(cur.devicePlays>ACC.devicePlays)ACC.devicePlays=cur.devicePlays}lsSet(ACC_KEY,ACC)}
const curAcc=()=>ACC.list.find(a=>a.id===ACC.cur);
const accName=()=>(curAcc()||{name:'Guest'}).name;
const pinHash=p=>{let h=5381;for(const c of 'bary:'+p)h=((h*33)^c.charCodeAt(0))>>>0;return h.toString(36)};
const GCOUNT='https://abacus.jasoncameron.dev',GPATH='barycenter-sandbox/'+SIM.id+'-plays';let GLOBAL=null;
function gCount(op){try{const ctl=new AbortController();setTimeout(()=>ctl.abort(),6000);fetch(`${GCOUNT}/${op}/${GPATH}`,{signal:ctl.signal,cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{if(j&&Number.isFinite(+j.value)){GLOBAL=Math.max(GLOBAL||0,+j.value);updateAcctUI()}}).catch(()=>{})}catch(e){}}
function countPlay(){PROG.plays++;ACC.devicePlays=(ACC.devicePlays||0)+1;saveProg();saveAcc();if(GLOBAL!=null)GLOBAL++;updateAcctUI();gCount('hit')}
function updateAcctUI(){$('hAcctName').textContent=curAcc()?accName():'Guest · make an account';$('hPlaysN').textContent=(GLOBAL!=null?GLOBAL:PROG.plays).toLocaleString();$('hPlaysL').textContent=GLOBAL!=null?'plays by everyone':'plays';$('acctBtn').title=`Account: ${accName()} (saved on this device)`}
function switchAcc(id,quiet){if(id===ACC.cur)return;saveProg();ACC.cur=id;saveAcc();loadProg();ACCN++;updateAcctUI();if(!$('home').hidden)homeView($('hChalView').hidden?'hMain':'hChalView');if(!quiet)toast(`Signed in as ${accName()}`);renderAcct()}
let acctPend=null;
function renderAcct(msg){const L=$('acctList');L.textContent='';$('acctMsg').textContent=msg||'';
  for(const a of [{id:'guest',name:'Guest',guest:1},...ACC.list]){const pr=a.id===ACC.cur?PROG:(lsGet(progKey(a.id))||{stars:{},plays:0}),cur=a.id===ACC.cur,r=document.createElement('div');r.className='arow'+(cur?' cur':'');
    const nm=document.createElement('div');nm.className='an';nm.innerHTML='<div></div><div class="as"></div>';nm.children[0].textContent=(a.pin?'🔒 ':'')+a.name+(cur?' (signed in)':'');nm.children[1].textContent=`★ ${Object.values(pr.stars||{}).reduce((x,y)=>x+y,0)} in ${SIM.name} · ${pr.plays||0} plays`;r.appendChild(nm);
    if(!cur){if(acctPend===a.id){const inp=document.createElement('input');inp.placeholder='PIN';inp.maxLength=4;const go=document.createElement('button');go.className='btn primary';go.textContent='OK';const t=()=>{if(pinHash(inp.value)===a.pin){acctPend=null;switchAcc(a.id)}else renderAcct('Wrong PIN')};go.onclick=t;inp.onkeydown=e=>{if(e.key==='Enter')t()};r.append(inp,go);setTimeout(()=>inp.focus(),0)}
      else{const b=document.createElement('button');b.className='btn';b.textContent=a.guest?'Use guest':'Sign in';b.onclick=()=>{if(a.pin){acctPend=a.id;renderAcct()}else switchAcc(a.id)};r.appendChild(b)}}
    else if(!a.guest){const so=document.createElement('button');so.className='btn';so.textContent='Sign out';so.onclick=()=>switchAcc('guest');r.appendChild(so)}
    L.appendChild(r)}}
function openAcct(){acctPend=null;$('acct').hidden=false;renderAcct()}
$('acctForm').addEventListener('submit',e=>{e.preventDefault();const name=$('acctNew').value.trim().replace(/\s+/g,' ').slice(0,20),pin=$('acctPin').value.trim();
  if(!name)return renderAcct('Type a name first');if(/^guest$/i.test(name)||ACC.list.some(a=>a.name.toLowerCase()===name.toLowerCase()))return renderAcct('That name is taken on this device');if(pin&&!/^\d{4}$/.test(pin))return renderAcct('A PIN is 4 digits (or leave it empty)');
  const fromGuest=ACC.cur==='guest'&&(PROG.plays||Object.keys(PROG.stars).length);const a={id:'a'+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36),name,created:Date.now()};if(pin)a.pin=pinHash(pin);
  if(fromGuest){lsSet(progKey(a.id),PROG);lsSet(PROG_KEY,blankProg())}ACC.list.push(a);saveAcc();$('acctNew').value='';$('acctPin').value='';switchAcc(a.id,true);toast(`Account ${name} created`);renderAcct(fromGuest?'Your guest progress moved into this account.':'')});
$('hAcctBtn').onclick=openAcct;$('acctBtn').onclick=openAcct;$('acctClose').onclick=()=>$('acct').hidden=true;$('acct').addEventListener('click',e=>{if(e.target.id==='acct')$('acct').hidden=true});
$('hPlays').onclick=()=>{gCount('get');toast(GLOBAL!=null?`${GLOBAL.toLocaleString()} plays by everyone · ${PROG.plays} by you`:`${PROG.plays} plays by you on this device`)};

/* challenges */
CHALS.sort((a,b)=>a.diff-b.diff);loadProg();
const NCH=CHALS.length;
const starsOf=i=>(CHALS[i]&&PROG.stars[CHALS[i].t])||0;
const unlocked=i=>{if(i===0||starsOf(i-1)||starsOf(i))return true;for(let j=i+1;j<NCH;j++)if(starsOf(j))return true;return false};
function totalStars(){let n=0;for(let i=0;i<NCH;i++)n+=starsOf(i);return n}
const doneCount=()=>CHALS.filter((c,i)=>starsOf(i)>0).length;
function setMode(m){document.body.classList.toggle('mHome',m==='home');document.body.classList.toggle('mDemo',m==='demo')}
function homeView(v){for(const id of ['hMain','hChalView','hDemoView'])$(id).hidden=id!==v;if(v==='hChalView')renderGrid();const d=doneCount();$('hChalSub').textContent=d?`${d} of ${NCH} complete · ${totalStars()} of ${NCH*3} stars`:`${NCH} goals, from easy to fiendish`;updateAcctUI()}
function showHome(){stopDemo(true);if(CH.active)endChallenge();if(TUT.on)endTutorial();$('chDone').hidden=true;$('scen').hidden=true;
  CH.loading=true;loadScen(SIM.home);CH.loading=false;setSpeed(SIM.homeSpeed??SIM.defSpeed);setPaused(false);setTool('select');setView('normal');
  cam.ox=innerWidth>900?innerWidth*0.2:0;setMode('home');$('home').hidden=false;homeView('hMain')}
function leaveHome(){cam.ox=0;$('home').hidden=true;setMode('');fitWorld()}
$('homeBtn').onclick=showHome;document.querySelectorAll('.hback').forEach(b=>b.onclick=()=>homeView('hMain'));
$('hChal').onclick=()=>homeView('hChalView');$('hDemo').onclick=()=>homeView('hDemoView');
function startFree(){leaveHome();loadScen(SIM.freeScen||SIM.home);setSpeed(SIM.defSpeed);countPlay()}
$('hFree').onclick=startFree;
function renderGrid(){const g=$('hGrid');g.textContent='';let next=-1;
  CHALS.forEach((c,i)=>{const st=starsOf(i),un=unlocked(i);if(un&&!st&&next<0)next=i;const b=document.createElement('button');b.className='ct'+(i===next?' next':'');b.disabled=!un;b.title=un?`${c.t}: ${c.g}`:'Finish the previous challenge to unlock';
    b.innerHTML='<span class="cn"></span><span class="ctt"></span><span class="cs"></span>';b.children[0].textContent=`#${i+1}`;b.children[1].textContent=un?c.t:'Locked';b.children[2].textContent=un?(st?'★'.repeat(st)+'☆'.repeat(3-st):'☆☆☆'):'🔒';b.onclick=()=>startChallenge(i);g.appendChild(b)});
  $('hStars').textContent=`★ ${totalStars()} / ${NCH*3}`;if(next>=0)setTimeout(()=>{const el=g.children[next];if(el)el.scrollIntoView({block:'nearest'})},30)}
function startChallenge(i){const c=CHALS[i];if(!c||!unlocked(i))return;leaveHome();countPlay();$('chDone').hidden=true;
  CH.active=c;CH.idx=i;CH.events=[];CH.hold={};CH.ref={};CH.done=false;CH.failed='';CH.loading=true;try{loadScen(c.scen||SIM.home);setSpeed(c.speed??SIM.defSpeed);if(c.setup)c.setup()}finally{CH.loading=false}
  CH.t0=S.t;CH.real0=performance.now();setPaused(false);setTool(SIM.defTool||'select');
  $('chHud').hidden=false;$('chNum').textContent=`Challenge ${i+1} of ${NCH}`;$('chTitle').textContent=c.t;$('chGoal').textContent=c.g;$('chProg').textContent='';$('chBar').style.width='0%';$('chHint').hidden=!c.hint;$('chRestart').textContent='Restart'}
function endChallenge(){CH.active=null;$('chHud').hidden=true}
function chTick(){if(TUT.on)tutTick();if(!CH.active||CH.done)return;const c=CH.active;let r;try{r=c.check()}catch(e){console.warn(e);r=[false,0,'']}
  const [done,p,txt]=r;$('chProg').textContent=txt||'';$('chBar').style.width=Math.round(clamp(p||0,0,1)*100)+'%';const t=realSecs();$('chTime').textContent=`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
  if(done){CH.done=true;const st=clamp((c.stars||byTime(60,150))(),1,3),prev=starsOf(CH.idx);if(st>prev)PROG.stars[c.t]=st;saveProg();
    $('dStars').innerHTML='★'.repeat(st)+'<span class="off">'+'★'.repeat(3-st)+'</span>';$('dTitle').textContent=`Challenge ${CH.idx+1} complete!`;$('dText').textContent=`${c.t} · ${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}${st<3?' · Faster solutions earn more stars.':' · Perfect!'}${prev>st?` Your best is still ${prev} ★.`:''}`;
    $('dNext').hidden=CH.idx>=NCH-1;$('dNext').textContent='Next challenge';$('dRetry').hidden=false;$('dList').textContent='All challenges';$('chDone').hidden=false;$('chHud').hidden=true;return}
  const f=c.fail&&c.fail();if(f){CH.done=true;$('dStars').innerHTML='<span class="off">★★★</span>';$('dTitle').textContent='Not this time';$('dText').textContent=f+'. Try again?';$('dNext').hidden=true;$('dRetry').hidden=false;$('dList').textContent='All challenges';$('chDone').hidden=false;$('chHud').hidden=true}}
$('chRestart').addEventListener('click',()=>{if(TUT.on){TUT.i++;tutStep();return}startChallenge(CH.idx)});
$('chExit').addEventListener('click',()=>{if(TUT.on){endTutorial();showHome();homeView('hDemoView');return}endChallenge();showHome();homeView('hChalView')});
$('chHint').onclick=()=>{if(CH.active)toast('Hint: '+CH.active.hint,6000)};
$('dNext').onclick=()=>{if(TUT.finished){TUT.finished=false;showHome();homeView('hChalView');return}startChallenge(CH.idx+1)};
$('dRetry').onclick=()=>{if(TUT.finished){TUT.finished=false;startTutorial();return}startChallenge(CH.idx)};
$('dList').onclick=()=>{if(TUT.finished){TUT.finished=false;$('chDone').hidden=true;startFree();return}endChallenge();showHome();homeView('hChalView')};

/* tutorial */
const TUT={on:false,i:0,ref:{},finished:false};
function startTutorial(){leaveHome();countPlay();$('chDone').hidden=true;CH.loading=true;loadScen(SIM.tutScen||SIM.home);CH.loading=false;setSpeed(SIM.defSpeed);setPaused(false);setTool(SIM.defTool||'select');TUT.on=true;TUT.i=0;TUT.finished=false;tutStep()}
function tutStep(){const st=TSTEPS[TUT.i];if(!st){TUT.on=false;TUT.finished=true;$('chHud').hidden=true;$('dStars').innerHTML='★★★';$('dTitle').textContent='Tutorial complete!';$('dText').textContent='You know all the controls. Try the challenges, or build anything in free play.';$('dNext').hidden=false;$('dNext').textContent='Challenges';$('dRetry').hidden=false;$('dList').textContent='Free play';$('chDone').hidden=false;$('chRestart').textContent='Restart';return}
  TUT.ref={};if(st[3])st[3](TUT.ref);$('chHud').hidden=false;$('chNum').textContent=`Tutorial · step ${TUT.i+1} of ${TSTEPS.length}`;$('chTitle').textContent=st[0];$('chGoal').textContent=st[1];$('chProg').textContent='';$('chTime').textContent='';$('chBar').style.width=Math.round(TUT.i/TSTEPS.length*100)+'%';$('chHint').hidden=true;$('chRestart').textContent='Skip step'}
function tutTick(){const st=TSTEPS[TUT.i];let ok=false;try{ok=st&&st[2](TUT.ref)}catch(e){}if(ok){TUT.i++;toast('✓ '+st[0]);tutStep()}}
function endTutorial(){TUT.on=false;$('chHud').hidden=true;$('chRestart').textContent='Restart'}
$('hTut').onclick=startTutorial;

/* demo */
let demoI=-1,demoTimer=0;
function startDemo(){leaveHome();countPlay();setMode('demo');$('demoCap').hidden=false;demoI=-1;nextDemo()}
function nextDemo(){clearTimeout(demoTimer);demoI=(demoI+1)%DEMO.length;const [id,t,x,f]=DEMO[demoI];CH.loading=true;loadScen(id);CH.loading=false;setView('normal');setPaused(false);if(f)f();
  $('demoStep').textContent=`Demo · ${demoI+1} of ${DEMO.length}`;$('demoTitle').textContent=t;$('demoText').textContent=x;demoTimer=setTimeout(nextDemo,12000)}
function stopDemo(quiet){clearTimeout(demoTimer);if(demoI<0&&quiet)return;demoI=-1;$('demoCap').hidden=true;setMode('');if(!quiet)showHome()}
$('hWatch').onclick=startDemo;$('demoExit').onclick=()=>stopDemo();$('demoNext').onclick=nextDemo;

/* main loop */
let last=performance.now(),uiT=0,achAcc=0,achT=0,renderMs=4,stepMs=1;S.achieved=1;
function frame(now){const dtR=Math.min(0.1,(now-last)/1000);last=now;camKeys(dtR);
  try{
    if(!S.paused){const want=S.speed*dtR,step=SIM.stepSize(S.speed),t0=performance.now(),budget=clamp((SIM.budget||12.5)-renderMs,2,9);let done=0;
      while(done<want-1e-12){const el=performance.now()-t0;if(el+stepMs*0.9>budget&&done>0)break;const s0=performance.now(),d=Math.min(step,want-done);SIM.step(d);S.t+=d;done+=d;stepMs=stepMs*0.8+(performance.now()-s0)*0.2}
      achAcc+=done}
    achT+=dtR;if(achT>=0.5){S.achieved=achAcc/achT;achAcc=0;achT=0}
    if(SIM.frame)SIM.frame(dtR);
    if(S.follow&&S.sel&&SIM.selPos){const p=SIM.selPos(S.sel);if(p){cam.x=lerp(cam.x,p[0],Math.min(1,dtR*6));cam.y=lerp(cam.y,p[1],Math.min(1,dtR*6));clampCam()}}
    const r0=performance.now();ctx.setTransform(DPR,0,0,DPR,0,0);SIM.render(ctx,now);renderMs=renderMs*0.85+(performance.now()-r0)*0.15;
    uiT+=dtR;if(uiT>0.25){uiT=0;updateHud()}
  }catch(err){console.error('['+SIM.name+']',err)}
  requestAnimationFrame(frame)}
function deselect(){S.sel=null;S.follow=false;if(SIM.selChanged)SIM.selChanged()}
function deselBtn(){const p=$('pane-insp');if(!p)return;let b=$('kitDesel');if(!b){b=document.createElement('button');b.id='kitDesel';b.className='btn';b.textContent='✕ Stop inspecting';b.onclick=deselect;p.insertBefore(b,p.firstChild)}b.hidden=!S.sel}
function updateHud(){deselBtn();measureHud();const st=SIM.stats(),box=$('stats');if(box.children.length!==st.length){box.textContent='';for(const [k] of st){const d=document.createElement('div');d.className='stat';d.innerHTML='<span class="k"></span><span class="v"></span>';d.children[0].textContent=k;box.appendChild(d)}}
  st.forEach(([k,v],i)=>{box.children[i].children[1].textContent=v});$('dateTxt').textContent=SIM.dateTxt();$('dateSub').textContent=SIM.dateSub?SIM.dateSub():'';updateRate();SIM.hud();chTick();
  if(document.visibilityState==='visible'&&$('home').hidden)PROG.secs=(PROG.secs||0)+0.25}
addEventListener('resize',resize);addEventListener('pagehide',saveProg);
resize();buildRail();buildSpeeds();buildScen();if(SIM.init)SIM.init();setSpeed(SIM.defSpeed);setTool('select');updateAcctUI();gCount('get');showHome();requestAnimationFrame(frame);
