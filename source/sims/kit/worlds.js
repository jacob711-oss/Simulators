/* ===== Your worlds: Free play keeps a list of saved worlds. Create world, carry on later, Save & exit while playing. =====
   A world is saved by walking every piece of the game's state (listed at build time in __STATE_NAMES), keeping shared
   references, typed arrays, Sets and Maps, then squeezing it with gzip into the browser's IndexedDB. */
(function(){
  const GAME=SIM.id,NAMES=(typeof __STATE_NAMES!=='undefined'?__STATE_NAMES:[]).filter(n=>!/^(SIM|TB|SCENS|SCENLIST|LC|SC|SC3|TEX|LCL|LCS|CL|VIEW|JOB|DETS|DET|PARTS|FX|HOVER|DRAG|DRAGR|TOOLD|INSPK|BPATH|ACTX|MODE|off|ox|img|vOff|vx|vImg|bOff|bx|bImg|sig|SEAG|SPC|BPREV)$/.test(n));
  const geval=eval;const get=n=>{try{return geval(n)}catch(e){return undefined}};
  /* ---------- turning the world into data and back ---------- */
  const TA={Float32Array,Float64Array,Int8Array,Int16Array,Int32Array,Uint8Array,Uint16Array,Uint32Array,Uint8ClampedArray};
  const b64=u8=>{let s='';for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s)};
  const unb64=s=>{const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u};
  function pack(roots){const ids=new Map(),objs=[];const bad=v=>typeof v==='function'||(typeof Node!=='undefined'&&v instanceof Node)||(typeof CanvasRenderingContext2D!=='undefined'&&v instanceof CanvasRenderingContext2D)||(typeof ImageData!=='undefined'&&v instanceof ImageData)||(typeof AudioContext!=='undefined'&&v instanceof AudioContext);
    function enc(v){if(v===null||typeof v==='boolean'||typeof v==='string')return v;if(typeof v==='number')return Number.isFinite(v)?v:{$n:String(v)};if(v===undefined)return{$u:1};if(bad(v))return{$u:1};if(typeof v!=='object')return{$u:1};
      if(ids.has(v))return{$r:ids.get(v)};const id=objs.length;ids.set(v,id);objs.push(null);let o;
      const tn=Object.keys(TA).find(k=>v instanceof TA[k]);
      if(tn)o={$t:tn,d:b64(new Uint8Array(v.buffer,v.byteOffset,v.byteLength))};
      else if(Array.isArray(v))o={$a:v.map(enc)};else if(v instanceof Set)o={$s:[...v].map(enc)};else if(v instanceof Map)o={$m:[...v].map(([k,x])=>[enc(k),enc(x)])};
      else{const p={};for(const k of Object.keys(v)){if(bad(v[k]))continue;p[k]=enc(v[k])}o={$o:p}}objs[id]=o;return{$r:id}}
    const out={};for(const n of Object.keys(roots))out[n]=enc(roots[n]);return{objs,roots:out}}
  function unpack(P){const live=new Array(P.objs.length);
    function make(i){if(live[i]!==undefined)return live[i];const o=P.objs[i];let v;
      if(o.$t){const u=unb64(o.d);v=new TA[o.$t](u.buffer,0,u.byteLength/TA[o.$t].BYTES_PER_ELEMENT);live[i]=v;return v}
      if(o.$a){v=[];live[i]=v;for(const x of o.$a)v.push(dec(x));return v}if(o.$s){v=new Set();live[i]=v;for(const x of o.$s)v.add(dec(x));return v}
      if(o.$m){v=new Map();live[i]=v;for(const [k,x] of o.$m)v.set(dec(k),dec(x));return v}v={};live[i]=v;for(const k of Object.keys(o.$o))v[k]=dec(o.$o[k]);return v}
    function dec(x){if(x===null||typeof x!=='object')return x;if(x.$u)return undefined;if(x.$n)return Number(x.$n);if(x.$r!==undefined)return make(x.$r);return x}
    const r={};for(const n of Object.keys(P.roots))r[n]=dec(P.roots[n]);return r}
  // put a saved value back: reassign `let` variables; for `const` ones, refill the existing object in place
  function restoreInto(name,val){const cur=get(name);if(cur===undefined&&val===undefined)return;
    window.__wv=val;try{geval(name+'=window.__wv');return}catch(e){}
    if(cur&&val&&typeof cur==='object'){const tn=Object.keys(TA).find(k=>cur instanceof TA[k]);
      if(tn){if(val.length===cur.length)cur.set(val);return}if(Array.isArray(cur)&&Array.isArray(val)){cur.length=0;for(const x of val)cur.push(x);return}
      if(cur instanceof Set&&val instanceof Set){cur.clear();val.forEach(x=>cur.add(x));return}if(cur instanceof Map&&val instanceof Map){cur.clear();val.forEach((x,k)=>cur.set(k,x));return}
      for(const k of Object.keys(val)){const c=cur[k];if(c&&typeof c==='object'&&Object.keys(TA).some(t=>c instanceof TA[t])&&val[k]&&val[k].length===c.length)c.set(val[k]);else if(typeof c!=='function')try{cur[k]=val[k]}catch(e){}}}}
  async function gz(str){try{const s=new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'));return 'gz:'+b64(new Uint8Array(await new Response(s).arrayBuffer()))}catch(e){return str}}
  async function ungz(s){if(!s.startsWith('gz:'))return s;const st=new Blob([unb64(s.slice(3))]).stream().pipeThrough(new DecompressionStream('gzip'));return await new Response(st).text()}
  function snapshot(){const roots={};for(const n of NAMES){const v=get(n);if(v!==undefined&&typeof v!=='function')roots[n]=v}
    roots.__S={t:S.t,scen:S.scen,view:S.view,speedI:S.speedI,status:S.status,brush:S.brush};roots.__cam={x:cam.x,y:cam.y,z:cam.z};return pack(roots)}
  function apply(P){const r=unpack(P);for(const n of Object.keys(r)){if(n==='__S'||n==='__cam')continue;restoreInto(n,r[n])}
    const s=r.__S||{};S.t=s.t||0;S.scen=s.scen;if(s.status)S.status=s.status;if(s.brush)S.brush=s.brush;S.sel=null;S.follow=false;
    // rebuild anything drawn from the world
    for(const f of ['dirtyImg','dirtyClim','DIRTY','VDIRTY','BDIRTY'])try{geval(f+'=true')}catch(e){}
    try{if(typeof VIEW!=='undefined'&&VIEW){VIEW.key='';VIEW.ready=null;VIEW.job=null}}catch(e){}
    try{if(typeof SEAG!=='undefined'){geval('SEAG=null;SPC=new Map()')}}catch(e){}
    for(const f of ['routes','syncPanel','syncWorldUI','computeStats','countPlates'])try{const fn=get(f);if(typeof fn==='function')fn()}catch(e){}
    if(typeof SIM.afterRestore==='function')try{SIM.afterRestore()}catch(e){}
    if(s.view)try{setView(s.view)}catch(e){}if(s.speedI!=null)setSpeed(s.speedI);if(r.__cam){cam.x=r.__cam.x;cam.y=r.__cam.y;cam.z=r.__cam.z;try{clampCam()}catch(e){}}}
  /* ---------- storage: IndexedDB on this device (localStorage if that is unavailable) ---------- */
  let dbp=null;const db=()=>dbp||(dbp=new Promise((ok,no)=>{try{const r=indexedDB.open('sim_worlds',1);r.onupgradeneeded=()=>{const s=r.result.createObjectStore('worlds',{keyPath:'id'});s.createIndex('game','game')};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)}catch(e){no(e)}}));
  const tx=async(mode,fn)=>{const d=await db();return new Promise((ok,no)=>{const t=d.transaction('worlds',mode),st=t.objectStore('worlds');const q=fn(st);t.oncomplete=()=>ok(q&&q.result);t.onerror=()=>no(t.error)})};
  const LSK='sim_worlds_'+GAME;const lsAll=()=>{try{return JSON.parse(localStorage.getItem(LSK)||'[]')}catch(e){return[]}};const lsPut=a=>{try{localStorage.setItem(LSK,JSON.stringify(a));return true}catch(e){return false}};
  async function listWorlds(){try{const all=await tx('readonly',st=>st.index('game').getAll(GAME));return(all||[]).map(({data,...m})=>m).sort((a,b)=>b.updated-a.updated)}catch(e){return lsAll().map(({data,...m})=>m).sort((a,b)=>b.updated-a.updated)}}
  async function getWorld(id){try{return await tx('readonly',st=>st.get(id))}catch(e){return lsAll().find(w=>w.id===id)}}
  async function putWorld(w){try{await tx('readwrite',st=>st.put(w));return true}catch(e){const a=lsAll().filter(x=>x.id!==w.id);a.push(w);return lsPut(a)}}
  async function delWorld(id){try{await tx('readwrite',st=>st.delete(id))}catch(e){lsPut(lsAll().filter(w=>w.id!==id))}}
  /* ---------- the current world ---------- */
  let CUR=null,saving=false,lastSave=0;window.WORLDSAVES=0;
  function thumb(){try{const c=document.getElementById('world')||document.getElementById('sky'),t=document.createElement('canvas'),k=240/Math.max(c.width,c.height);t.width=Math.round(c.width*k);t.height=Math.round(c.height*k);t.getContext('2d').drawImage(c,0,0,t.width,t.height);return t.toDataURL('image/jpeg',.7)}catch(e){return''}}
  async function saveNow(quietly){if(!CUR||saving)return;saving=true;try{const data=await gz(SIM.saveState?SIM.saveState():JSON.stringify(snapshot()));CUR.data=data;CUR.updated=Date.now();CUR.scen=S.scen;CUR.thumb=thumb();CUR.t=S.t;
      const ok=await putWorld(CUR);lastSave=Date.now();WORLDSAVES++;if(!ok&&!quietly)toast('Could not save: this browser is out of storage space');else if(!quietly)toast('World saved')}catch(e){if(!quietly)toast('Could not save this world')}saving=false}
  setInterval(()=>{if(CUR&&$('home').hidden&&!document.body.classList.contains('mDemo')&&Date.now()-lastSave>(SIM.saveEvery||30000))saveNow(true)},5000);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&CUR)saveNow(true)});addEventListener('pagehide',()=>{if(CUR)saveNow(true)});
  /* ---------- screens ---------- */
  const css=document.createElement('style');css.textContent=`#hWorldsView .wgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px}
  .wcard{display:flex;flex-direction:column;border:1px solid var(--line-strong);border-radius:12px;overflow:hidden;background:rgba(255,255,255,.03)}.wcard .wth{aspect-ratio:16/10;background:#000 center/cover no-repeat;cursor:pointer}
  .wcard .wb{padding:9px 10px;display:flex;flex-direction:column;gap:3px}.wcard b{font-family:var(--f-display);font-weight:500;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.wcard small{color:var(--dim);font-size:12px}
  .wcard .wa{display:flex;gap:4px;padding:0 8px 8px}.wcard .wa .btn{flex:1;padding:5px 4px;font-size:12px}.wnew{display:grid;place-items:center;min-height:150px;border:2px dashed var(--line-strong);border-radius:12px;cursor:pointer;color:var(--ink);background:none;font:600 15px var(--f-body)}.wnew:hover{border-color:var(--cool)}
  .wform{display:grid;gap:10px;margin-top:10px}.wform input{font:16px var(--f-body);color:var(--ink);background:rgba(0,0,0,.3);border:1px solid var(--line-strong);border-radius:10px;padding:9px 11px}.wscens{display:grid;gap:6px}.wscens button{text-align:left;padding:9px 11px}.wscens button[aria-pressed="true"]{border-color:var(--cool);background:rgba(var(--accRGB),.14)}
  #exitWorld{display:none}body.inWorld #exitWorld{display:inline-flex}.wxs{display:none}@media (max-width:760px){.wxl{display:none}.wxs{display:inline}}.wempty{color:var(--dim);font-size:14px;margin:4px 0 10px}`;document.head.appendChild(css);
  const home=$('home'),view=document.createElement('div');view.id='hWorldsView';view.className='hview';view.hidden=true;
  view.innerHTML=`<div class="hbar"><button class="btn ghost hback" id="wBack">← Back</button><h2>Your worlds</h2></div><p class="wempty" id="wEmpty"></p><div class="wgrid" id="wGrid"></div><div id="wCreate" hidden></div>`;
  const chal=$('hChalView');chal.parentElement.insertBefore(view,chal);
  const ohv=homeView;homeView=function(v){view.hidden=v!=='hWorldsView';if(v==='hWorldsView'){for(const id of ['hMain','hChalView','hDemoView'])$(id).hidden=true;renderWorlds();return}ohv(v)};
  $('wBack').onclick=()=>homeView('hMain');
  const ago=t=>{const s=(Date.now()-t)/1000;return s<60?'just now':s<3600?Math.round(s/60)+' min ago':s<86400?Math.round(s/3600)+' h ago':new Date(t).toLocaleDateString()};
  const scenName=id=>{const s=(SIM.scens||[]).find(x=>x.id===id);return s?s.name:''};
  async function renderWorlds(){$('wCreate').hidden=true;const g=$('wGrid');g.hidden=false;g.textContent='';const ws=await listWorlds();
    $('wEmpty').textContent=ws.length?'Pick up where you left off, or start something new.':'You have no worlds yet. Create your first one!';
    const nb=document.createElement('button');nb.className='wnew';nb.id='wNew';nb.textContent='+ Create world';nb.onclick=showCreate;g.appendChild(nb);
    for(const w of ws){const c=document.createElement('div');c.className='wcard';c.innerHTML='<div class="wth"></div><div class="wb"><b></b><small></small></div><div class="wa"><button class="btn primary">Play</button><button class="btn">Rename</button><button class="btn">Delete</button></div>';
      if(w.thumb)c.querySelector('.wth').style.backgroundImage=`url(${w.thumb})`;c.querySelector('b').textContent=w.name;c.querySelector('small').textContent=`${scenName(w.scen)} · ${ago(w.updated)}`;
      const [pl,rn,dl]=c.querySelectorAll('.wa .btn');c.querySelector('.wth').onclick=pl.onclick=()=>playWorld(w.id);
      rn.onclick=async()=>{const n=prompt('New name for this world:',w.name);if(n&&n.trim()){const full=await getWorld(w.id);full.name=n.trim().slice(0,40);await putWorld(full);renderWorlds()}};
      dl.onclick=async()=>{if(confirm(`Delete "${w.name}"? This cannot be undone.`)){await delWorld(w.id);renderWorlds()}};g.appendChild(c)}}
  function showCreate(){const f=$('wCreate');$('wGrid').hidden=true;f.hidden=false;let pick=SIM.freeScen||SIM.home;
    f.innerHTML=`<div class="wform"><label class="k">World name</label><input id="wName" maxlength="40" value="My ${SIM.name} world"><label class="k">Start from</label><div class="wscens" id="wScens"></div><div class="actions"><button class="btn primary" id="wGo">Create world</button><button class="btn" id="wCancel">Cancel</button></div></div>`;
    const L=$('wScens');for(const s of SIM.scens||[]){const b=document.createElement('button');b.className='btn';b.setAttribute('aria-pressed',s.id===pick);b.innerHTML='<b></b><br><small></small>';b.querySelector('b').textContent=s.name;b.querySelector('small').textContent=s.desc||'';b.onclick=()=>{pick=s.id;L.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b))};L.appendChild(b)}
    $('wCancel').onclick=renderWorlds;$('wGo').onclick=()=>{const name=($('wName').value||'').trim()||`My ${SIM.name} world`;createWorld(name,pick)};$('wName').select()}
  async function createWorld(name,scen){CUR={id:GAME+'-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),game:GAME,name:name.slice(0,40),scen,created:Date.now(),updated:Date.now()};
    __startFree(scen);document.body.classList.add('inWorld');await saveNow(true);chEv('worldnew',{});toast(`Created "${CUR.name}"`)}
  async function playWorld(id){const w=await getWorld(id);if(!w)return;toast('Loading…');__startFree(w.scen);try{const txt=await ungz(w.data);if(SIM.loadState){if(SIM.loadState(txt)===false)throw new Error('load')}else apply(JSON.parse(txt));CUR=w;document.body.classList.add('inWorld');lastSave=Date.now();toast(`Welcome back to "${w.name}"`)}catch(e){CUR=w;document.body.classList.add('inWorld');toast('Could not load the saved state, so this world starts fresh')}}
  // Free play opens Your worlds
  const __startFree=scen=>{if(SIM.start){SIM.start(scen||SIM.freeScen||SIM.home);return}if(typeof MODE!=='undefined')try{geval("MODE='free'")}catch(e){}leaveHome();loadScen(scen||SIM.freeScen||SIM.home);setSpeed(SIM.defSpeed);countPlay()};
  const hf0=$('hFree'),hf=hf0.cloneNode(true);hf0.replaceWith(hf);hf.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();if(typeof MODE!=='undefined')try{geval("MODE='free'")}catch(x){}homeView('hWorldsView')};
  const hd=hf.querySelector('.hd');if(hd&&!/saved/i.test(hd.textContent))hd.textContent=hd.textContent.replace(/\.?\s*$/,'')+'. Your worlds are saved, so you can carry on later.';
  // Save & exit while playing a world; Home also saves first
  const ex=document.createElement('button');ex.id='exitWorld';ex.className='btn';ex.title='Save this world and go back to Your worlds';ex.innerHTML='<span class="wxl">Save &amp; e</span><span class="wxs">E</span>xit';
  const hb=$('homeBtn');hb.parentElement.insertBefore(ex,hb);
  ex.onclick=async()=>{await saveNow(true);const keep=CUR;CUR=null;document.body.classList.remove('inWorld');showHome();homeView('hWorldsView');if(keep)toast(`Saved "${keep.name}"`)};
  const osh=showHome;showHome=function(){if(CUR){saveNow(true);CUR=null;document.body.classList.remove('inWorld')}osh()};
  hb.onclick=()=>showHome();
  // a changed town/sea/world inside a saved world keeps saving into the same world
  {const m=location.hash.match(/^#world=([\w-]+)/);if(m){setTimeout(()=>{history.replaceState(null,'',location.pathname+location.search);playWorld(m[1])},400)}}
  window.WORLD={save:saveNow,list:listWorlds,current:()=>CUR,fp:()=>SIM.saveState?SIM.saveState().length:snapshot().objs.length};
  TSTEPS.push(['Your worlds','Free play keeps your worlds: press Free play on the home page to see them, or Create world to start a new one. While playing a world, Save & exit (next to Home) keeps it for later.',r=>Date.now()-r.t0>6000,r=>{r.t0=Date.now()}]);
})();
