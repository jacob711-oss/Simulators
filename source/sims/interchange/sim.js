/* ================= Interchange: a transit puzzle ================= */
// The city is 120 x 80 units. Time is in seconds of game time; a week lasts 60 seconds.
const WW=120,WH=80,WEEK=60;
const TYPES={home:{ic:'🏠',n:'Homes',col:'#7fd18a',w:40},office:{ic:'🏢',n:'Offices',col:'#6aa8ff',w:24},shop:{ic:'🛍️',n:'Shops',col:'#ffc35a',w:16},school:{ic:'🏫',n:'School',col:'#ff8a5c',w:8},
  hospital:{ic:'🏥',n:'Hospital',col:'#ff6b7a',w:6},stadium:{ic:'🏟️',n:'Stadium',col:'#c48bff',w:3}};
const TK=Object.keys(TYPES);const SHAPES=["circle", "square", "triangle", "diamond", "cross", "star", "hexagon"];const shapeOf=t=>SHAPES[TK.indexOf(t)%7];
const LCOL=['#ff5a8a','#4aa8ff','#ffc23a','#3ad08a','#b07aff','#ff8a3a','#3adbe0'];
const MODES={train:{ic:'🚆',n:'Train',sp:8,cap:6,bridge:1,len:1,d:'The all-rounder.'},metro:{ic:'🚇',n:'Metro',sp:11,cap:8,bridge:0,len:1.2,d:'Fast and runs underground: no bridges needed.'},tram:{ic:'🚊',n:'Tram',sp:6.5,cap:7,bridge:1,len:1.1,d:'Street trams: roomy but slower.'}};
const MK=Object.keys(MODES);const plur=(m,n)=>{const w=MODES[m].n.toLowerCase();return n===1?w:m==='bus'?'buses':m==='ferry'?'ferries':w+'s'};const MOD=L=>MODES[L.mode||'train'],needB=L=>!!MOD(L).bridge;let MODEADD=0;
let ST=[],LINES=[],WATER=[],PARTS=[],HIST=[],NEXT={};
const G={lines:3,trains:3,cars:0,bridges:2,hubs:0,week:1,delivered:0,over:false,relaxed:false,spawnT:0,weekT:0,choosing:false,seed:1,rush:false,match:false,boom:false,storm:false,mode:'train',unlocked:['train','tram','metro']};
let MODE='classic';let CUR=0,DRAG=null,HOVER=null,LBL=true,EVN=0,EVSTOP=0,UPG=0,DRAWN=0,EXT=0,TRADD=0,CARADD=0,HUBADD=0,REMOVED=0;
let RS=1;function R(){RS|=0;RS=RS+0x6D2B79F5|0;let t=Math.imul(RS^RS>>>15,1|RS);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}
/* ---------- water: rivers and coasts are polygons ---------- */
function inPoly(x,y,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const [xi,yi]=P[i],[xj,yj]=P[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c}return c}
const isWater=(x,y)=>WATER.some(P=>inPoly(x,y,P));
function river(pts,w){const L=[],Rr=[];for(let i=0;i<pts.length;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,nx=-dy/l*w/2,ny=dx/l*w/2;L.push([pts[i][0]+nx,pts[i][1]+ny]);Rr.unshift([pts[i][0]-nx,pts[i][1]-ny])}return L.concat(Rr)}
function crossings(ax,ay,bx,by){let n=0,inW=isWater(ax,ay);const st=Math.ceil(Math.hypot(bx-ax,by-ay)*2);for(let k=1;k<=st;k++){const w=isWater(ax+(bx-ax)*k/st,ay+(by-ay)*k/st);if(w&&!inW)n++;inW=w}return n}
/* ---------- stations ---------- */
function spot(){for(let k=0;k<300;k++){const x=6+R()*(WW-12),y=6+R()*(WH-12);if(isWater(x,y))continue;if(ST.some(s=>Math.hypot(s.x-x,s.y-y)<7.5))continue;const cx=WW/2,cy=WH/2,d=Math.hypot(x-cx,y-cy);if(R()<d/(WW*0.7)*(ST.length<8?1.6:0.6))continue;return[x,y]}return null}
function pickType(){const present=new Set(ST.map(s=>s.type));let pool=TK.filter(t=>t==='home'||t==='office'||t==='shop'||G.week>=(t==='school'?2:t==='hospital'?3:4));
  if(!present.has('home'))return'home';if(!present.has('office'))return'office';const unique=['stadium'];pool=pool.filter(t=>!(unique.includes(t)&&ST.some(s=>s.type===t)));let tot=0;for(const t of pool)tot+=TYPES[t].w;let r=R()*tot;for(const t of pool){r-=TYPES[t].w;if(r<=0)return t}return'home'}
function addStation(type,x,y){if(x==null){const p=spot();if(!p)return null;[x,y]=p}const s={id:ST.length,type:type||pickType(),x,y,pax:[],cap:6,over:0,hub:false,spawn:R()*4+2,born:S.t,served:0};ST.push(s);FX(s.x,s.y,TYPES[s.type].col);routes();return s}
/* ---------- lines and trains ---------- */
const newLine=k=>({id:k,mode:'train',col:LCOL[k],st:[],trains:[],loop:false,pts:[],len:0,stops:[]});
function geom(L){// octilinear path: from each station go diagonally, then straight
  const pts=[],stops=[];let len=0;const seq=L.loop?L.st.concat([L.st[0]]):L.st;
  for(let i=0;i<seq.length;i++){const s=ST[seq[i]];if(i===0){pts.push([s.x,s.y]);stops.push(0);continue}const p=pts[pts.length-1],dx=s.x-p[0],dy=s.y-p[1],ad=Math.min(Math.abs(dx),Math.abs(dy));
    const m=[p[0]+Math.sign(dx)*ad,p[1]+Math.sign(dy)*ad];if(Math.hypot(m[0]-p[0],m[1]-p[1])>0.01&&Math.hypot(m[0]-s.x,m[1]-s.y)>0.01){len+=Math.hypot(m[0]-p[0],m[1]-p[1]);pts.push(m)}len+=Math.hypot(s.x-pts[pts.length-1][0],s.y-pts[pts.length-1][1]);pts.push([s.x,s.y]);stops.push(len)}
  L.pts=pts;L.len=len;L.stops=stops}
function pathCross(a,b){const dx=b.x-a.x,dy=b.y-a.y,ad=Math.min(Math.abs(dx),Math.abs(dy)),m=[a.x+Math.sign(dx)*ad,a.y+Math.sign(dy)*ad];return crossings(a.x,a.y,m[0],m[1])+crossings(m[0],m[1],b.x,b.y)}
function bridgesUsed(){let n=0;for(const L of LINES){if(!needB(L))continue;const seq=L.loop?L.st.concat([L.st[0]]):L.st;for(let i=1;i<seq.length;i++)n+=pathCross(ST[seq[i-1]],ST[seq[i]])}return n}
function posAt(L,d){let acc=0;for(let i=1;i<L.pts.length;i++){const a=L.pts[i-1],b=L.pts[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(acc+l>=d||i===L.pts.length-1){const t=l?clamp((d-acc)/l,0,1):0;return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,Math.atan2(b[1]-a[1],b[0]-a[0])]}acc+=l}return[L.pts[0][0],L.pts[0][1],0]}
function addTrain(L){if(G.trains<=0){toast('No vehicles left: you get one every week');return false}if(L.st.length<2)return false;if(L.trains.length>=8){toast('That line has 8 trains already');return false}G.trains--;const n=L.trains.length,fr=(n*0.618)%1,target=L.len*fr;let d=L.stops.reduce((b,x)=>Math.abs(x-target)<Math.abs(b-target)?x:b,0);L.trains.push({d,dir:(n%2||L.loop)?1:-1,pax:[],cars:0,wait:0.3+n*0.4,stop:0});TRADD++;chEv('train',{});return true}
function lineActive(L){return L.st.length>=2}
function linkStations(a,b){// extend the chosen line or start it
  let L=LINES[CUR];if(!L){toast('Pick a line colour first');return false}
  if(L.st.length===0){L.mode=G.unlocked.includes(G.mode)?G.mode:'train';if(needB(L)&&pathCross(a,b)>G.bridges-bridgesUsed()){toast('🌉 Not enough bridges to cross the water');return false}L.st=[a.id,b.id];geom(L);if(!L.trains.length&&!addTrain(L)){}DRAWN++;chEv('line',{n:2});routes();return true}
  if(L.loop){toast('This line is a loop. Pick another colour for a new line');return false}
  const first=L.st[0],last=L.st[L.st.length-1];let atEnd=a.id===last?1:a.id===first?-1:0;if(!atEnd){toast('Drag from the end of the line to extend it');return false}
  if(b.id===(atEnd>0?first:last)&&L.st.length>=3){if(needB(L)&&pathCross(a,b)>G.bridges-bridgesUsed()){toast('🌉 Not enough bridges');return false}L.loop=true;geom(L);for(const t of L.trains)t.dir=1;routes();EXT++;chEv('loop',{});toast('⭕ Loop closed');return true}
  if(L.st.includes(b.id)){toast('That station is already on this line');return false}
  if(needB(L)&&pathCross(a,b)>G.bridges-bridgesUsed()){toast('🌉 Not enough bridges to cross the water');return false}
  if(atEnd>0)L.st.push(b.id);else{L.st.unshift(b.id);for(const t of L.trains)t.d+=0}geom(L);if(atEnd<0)for(const t of L.trains){t.d=clamp(t.d+(L.stops[1]||0),0,L.len)}EXT++;chEv('extend',{});routes();return true}
function gapAt(L,x,y){// which pair of stations (gap index) the point is closest to along the line
  let best=0,bd=1e9,acc=0,bestD=0;for(let i=1;i<L.pts.length;i++){const [ax,ay]=L.pts[i-1],[bx,by]=L.pts[i],dx=bx-ax,dy=by-ay,l=Math.hypot(dx,dy)||1,t=clamp(((x-ax)*dx+(y-ay)*dy)/(l*l),0,1),d=(ax+dx*t-x)**2+(ay+dy*t-y)**2;if(d<bd){bd=d;bestD=acc+t*l}acc+=l}
  for(let k=1;k<L.stops.length;k++)if(bestD<=L.stops[k]+1e-6)return k;return L.stops.length-1}
function insertStation(L,gap,s){const seq=L.loop?L.st.concat([L.st[0]]):L.st;const a=ST[seq[gap-1]],b=ST[seq[gap]];if(!a||!b)return false;
  const extra=pathCross(a,s)+pathCross(s,b)-pathCross(a,b);if(needB(L)&&extra>G.bridges-bridgesUsed()){toast('🌉 Not enough bridges');return false}
  const frac=L.len?L.trains.map(t=>t.d/L.len):[];if(gap>=L.st.length)L.st.push(s.id);else L.st.splice(gap,0,s.id);geom(L);L.trains.forEach((t,i)=>{t.d=clamp(frac[i]*L.len,0,L.len)});routes();EXT++;chEv('insert',{});toast('Station added to the line');return true}
function removeLine(L){G.trains+=L.trains.length;G.cars+=L.trains.reduce((s,t)=>s+t.cars,0);for(const t of L.trains)for(const p of t.pax){const s=ST[L.st[0]];if(s)s.pax.push(p)}L.st=[];L.trains=[];L.loop=false;geom(L);routes();REMOVED++;chEv('remove',{})}
function trimLine(L,end){if(L.st.length<=2){removeLine(L);return}if(L.loop){L.loop=false}else if(end>0)L.st.pop();else L.st.shift();geom(L);for(const t of L.trains)t.d=clamp(t.d,0,L.len);routes();REMOVED++}
/* ---------- routing: from every station, the next station on the quickest way to each kind of place ---------- */
let DIST={};function routes(){if(MODE==='free'&&$('home').hidden)for(const L of LINES){if(!lineActive(L))continue;while(L.trains.length<Math.min(8,Math.ceil(L.st.length/4))&&G.trains>0){const n=TRADD;if(!addTrain(L))break;TRADD=n}}NEXT={};DIST={};const adj=ST.map(()=>[]);for(const L of LINES){if(!lineActive(L))continue;const seq=L.loop?L.st.concat([L.st[0]]):L.st;for(let i=1;i<seq.length;i++){adj[seq[i-1]].push([seq[i],L.id]);adj[seq[i]].push([seq[i-1],L.id])}}
  for(const t of TK){const dist=new Array(ST.length).fill(1e9),nx=new Array(ST.length).fill(-1),q=[];for(const s of ST)if(s.type===t){dist[s.id]=0;q.push(s.id)}
    for(let h=0;h<q.length;h++){const u=q[h];for(const [v] of adj[u])if(dist[v]>dist[u]+1){dist[v]=dist[u]+1;nx[v]=u;q.push(v)}}NEXT[t]=nx;DIST[t]=dist}}
/* ---------- the game ---------- */
function spawnPax(s,dt){const rate=(0.12+G.week*0.018)*(G.rush?2:1)*(s.type==='home'?1.3:1);s.spawn-=dt*rate;if(s.spawn>0)return;s.spawn=1.5+R()*3;
  let pool=TK.filter(t=>t!==s.type&&ST.some(o=>o.type===t));if(!pool.length)return;if(G.match&&ST.some(o=>o.type==='stadium')&&s.type!=='stadium'&&R()<0.6)pool=['stadium'];
  const w=pool.map(t=>TYPES[t].w+(t==='home'?20:0));let tot=w.reduce((a,b)=>a+b,0),r=R()*tot,k=0;for(;k<pool.length;k++){r-=w[k];if(r<=0)break}s.pax.push({to:pool[Math.min(k,pool.length-1)],age:0})}
function trainStep(L,t,dt){if(!lineActive(L))return;const M=MOD(L);let base=M.sp;const sp=base*(G.storm?0.62:1)*dt;
  if(t.wait>0){t.wait-=dt;return}
  const stops=L.stops,next=t.dir>0?stops.find(d=>d>t.d+1e-6):[...stops].reverse().find(d=>d<t.d-1e-6);
  if(next==null){if(L.loop){t.d=0;t.stop=0;return}t.dir*=-1;return}
  const dist=Math.abs(next-t.d);if(dist<=sp){t.d=next;const si=stops.indexOf(next),sid=(L.loop&&si===stops.length-1)?L.st[0]:L.st[si];t.stop=si;exchange(L,t,ST[sid]);t.wait=0.6+(ST[sid].hub?0:0.3);
    if(!L.loop&&(si===0||si===stops.length-1))t.dir=si===0?1:-1;else if(L.loop&&si===stops.length-1){t.d=0}}else t.d+=Math.sign(next-t.d)*sp}
function nextStopOf(L,t,s){const seq=L.loop?L.st.concat([L.st[0]]):L.st;const i=seq.indexOf(s.id,L.loop&&t.d>=L.len-1e-6?seq.length-1:0);let j=i+(L.loop?1:t.dir);if(L.loop&&j>=seq.length)j=1;if(j<0||j>=seq.length){j=i-(t.dir)}return seq[j]}
function exchange(L,t,s){const cap=MOD(L).cap*(1+t.cars);const nxt=nextStopOf(L,t,s);
  // drop off: arrived, or need to change here
  const keep=[];for(const p of t.pax){if(s.type===p.to){G.delivered++;s.served++;chEv('deliver',{to:p.to,mode:L.mode});FX(s.x,s.y,TYPES[p.to].col,true)}else if(DIST[p.to]&&DIST[p.to][s.id]<1e9&&!(DIST[p.to][nxt]<DIST[p.to][s.id])){s.pax.push(p)}else keep.push(p)}t.pax=keep;
  // board passengers whose route continues on this train
  const stay=[];for(const p of s.pax){const d=DIST[p.to];if(d&&nxt!=null&&d[nxt]<d[s.id]&&t.pax.length<cap){t.pax.push(p)}else stay.push(p)}s.pax=stay}
function weekUp(){G.week++;G.trains++;UPG++;if(MODE==='free'){toast(`Week ${G.week}`);return}const all=[['line','🛤️','New line','Another line colour to draw with'],['car','🚃','Carriage','Add 6 seats to a train'],['bridge','🌉','2 bridges','Cross more rivers'],['hub','🔄','Interchange','A station that holds 3× as many people and boards faster'],['train','🚆','Extra vehicle','Another vehicle for any line'],...MK.filter(m=>!G.unlocked.includes(m)).map(m=>[m,MODES[m].ic,MODES[m].n+' lines',MODES[m].d])].filter(o=>!(o[0]==='line'&&G.lines>=LCOL.length));
  const opts=[];while(opts.length<2){const o=pick(all);if(!opts.includes(o))opts.push(o)}showWeek(opts)}
function grant(k){if(k==='line'){G.lines=Math.min(LCOL.length,G.lines+1);LINES.length<G.lines&&LINES.push(newLine(LINES.length))}else if(k==='car')G.cars++;else if(k==='bridge')G.bridges+=2;else if(k==='hub')G.hubs++;else if(k==='train')G.trains++;if(MODES[k]&&k!=='train'&&!G.unlocked.includes(k)){G.unlocked.push(k);G.mode=k}chEv('upgrade',{k});syncPanel()}
function showWeek(opts){if(CH.loading||!$('home').hidden||document.body.classList.contains('mDemo')){grant(opts[0][0]);return}G.choosing=true;const box=document.createElement('div');box.className='weekbox';box.innerHTML=`<div class="weekcard panel"><span class="k">Week ${G.week}</span><h2>A new train arrives 🚆</h2><p class="hfoot">Pick one more upgrade:</p><div class="wopts"></div></div>`;
  for(const [k,ic,n,d] of opts){const b=document.createElement('button');b.className='wopt';b.innerHTML=`<span class="ic">${ic}</span><b>${n}</b><span>${d}</span>`;b.onclick=()=>{grant(k);box.remove();G.choosing=false;toast(`${ic} ${n}`)};box.querySelector('.wopts').appendChild(b)}document.body.appendChild(box)}
let ACTX=null;function beep(f,d,v){try{ACTX=ACTX||new (window.AudioContext||window.webkitAudioContext)();const o=ACTX.createOscillator(),g=ACTX.createGain();o.type='square';o.frequency.value=f;g.gain.value=v||0.05;o.connect(g);g.connect(ACTX.destination);const t=ACTX.currentTime;g.gain.setValueAtTime(v||0.05,t);g.gain.exponentialRampToValueAtTime(0.0001,t+d);o.start(t);o.stop(t+d)}catch(e){}}
function alarm(s){ALARMS++;chEv('alarm',{});if(CH.loading||!$('home').hidden||document.body.classList.contains('mDemo'))return;beep(880,0.18,0.04);setTimeout(()=>beep(660,0.22,0.04),200);toast(`🚨 The ${TYPES[s.type].n.toLowerCase()} station is overflowing! ${Math.round(s.over*100)}%`)}
let ALARMS=0;
function gameOver(s){G.over=true;chEv('gameover',{});if(CH.loading)return;const box=document.createElement('div');box.className='weekbox';box.innerHTML=`<div class="weekcard panel"><span class="k">Week ${G.week}</span><h2>The city gave up 😩</h2><p class="hfoot">The ${TYPES[s.type].n.toLowerCase()} station was crowded for too long. You delivered <b>${fmtN(G.delivered)}</b> passengers.</p><div class="actions" style="justify-content:center"><button class="btn primary" id="goRelax">Keep playing (relaxed)</button><button class="btn" id="goAgain">Start again</button></div></div>`;document.body.appendChild(box);
  box.querySelector('#goRelax').onclick=()=>{G.over=false;G.relaxed=true;for(const q of ST)q.over=0;box.remove();syncPanel()};box.querySelector('#goAgain').onclick=()=>{box.remove();loadScen(S.scen)};flyToW(s.x,s.y,Math.max(cam.z,10))}
/* ---------- cities ---------- */
function clearCity(){ST=[];LINES=[];WATER=[];PARTS=[];HIST=[];NEXT={};Object.assign(G,{mode:'train',unlocked:['train','tram','metro'],relaxed:false,lines:3,trains:3,cars:0,bridges:2,hubs:0,week:1,delivered:0,over:false,spawnT:0,weekT:0,choosing:false,rush:false,match:false,boom:false,storm:false});for(let k=0;k<G.lines;k++)LINES.push(newLine(k));CUR=0;document.querySelectorAll('.weekbox').forEach(b=>b.remove())}
const SCENS={
  harbour:()=>{RS=11;WATER.push(river([[60,-5],[58,20],[64,40],[56,60],[60,90]],5))},
  twin:()=>{RS=23;WATER.push(river([[-5,30],[30,28],[60,36],[90,30],[125,34]],4.5),river([[80,-5],[78,20],[86,40],[82,85]],4))},
  island:()=>{RS=37;WATER.push([[0,0],[120,0],[120,8],[0,8]],[[0,72],[120,72],[120,80],[0,80]],[[0,0],[8,0],[8,80],[0,80]],[[112,0],[120,0],[120,80],[112,80]],river([[40,8],[46,30],[42,50]],3.5))},
  delta:()=>{RS=41;WATER.push(river([[-5,20],[40,30],[70,24],[125,30]],4),river([[40,30],[50,50],[45,85]],3.5),river([[70,24],[90,50],[110,85]],3.5))},
  plain:()=>{RS=53},
};
const SCENLIST=[{id:'harbour',name:'Harbourton',desc:'A river splits the city in two. Bridges are precious.'},{id:'twin',name:'Twin Rivers',desc:'Two rivers cross the city. Plan your bridges well.'},{id:'island',name:'Isla Nova',desc:'An island city with a creek down the middle.'},{id:'delta',name:'Deltaport',desc:'A river delta splits the city into four parts.'},{id:'plain',name:'Prairie City',desc:'Flat open land. No bridges needed: a gentle start.'}];
/* ---------- UI ---------- */
function FX(x,y,col,small){PARTS.push({x,y,col,age:0,small:!!small})}
function syncPanel(){const inv=$('inv');if(!inv)return;const used=bridgesUsed();inv.innerHTML=`<div>🛤️ Lines <b>${LINES.filter(lineActive).length} / ${G.lines}</b></div><div>🚆 Spare vehicles <b>${G.trains}</b></div><div>🚃 Spare carriages <b>${G.cars}</b></div><div>🌉 Bridges left <b>${G.bridges-used}</b></div><div>🔄 Interchanges <b>${G.hubs}</b></div><div>⭐ Delivered <b>${fmtN(G.delivered)}</b></div>`;
  const LL=$('lineList');const lsig=[CUR,G.trains,G.cars,G.unlocked.join(),...LINES.map(L=>[L.mode,L.st.length,L.loop,L.trains.length,L.trains.reduce((s,t)=>s+t.cars,0)].join(','))].join('|');if(LL.dataset.sig!==lsig){LL.dataset.sig=lsig;LL.textContent='';LINES.forEach((L,k)=>{const r=document.createElement('div');r.className='lrow';r.style.borderColor=k===CUR?L.col:'';r.innerHTML=`<i style="background:${L.col}"></i><div><div>${L.st.length?`${MOD(L).ic} ${L.st.length} stations${L.loop?' · loop':''} · ${L.trains.length} ${plur(L.mode||'train',L.trains.length)}`:'Not built yet'}</div><div class="lbtns"></div></div><button class="btn"${k===CUR?' aria-pressed="true"':''}>${k===CUR?'Drawing':'Draw'}</button>`;
    r.children[2].onclick=()=>{CUR=k;setTool('draw');syncPanel()};const bt=r.children[1].children[1];if(L.st.length>=2)for(const m of MK){const vb=document.createElement('button');vb.className='btn';vb.style.padding='4px 7px';vb.textContent=MODES[m].ic;vb.title=MODES[m].n;vb.setAttribute('aria-pressed',(L.mode||'train')===m);vb.onclick=()=>{CUR=k;setVeh(m);LL.dataset.sig='';syncPanel()};bt.appendChild(vb)}if(L.st.length>=2){for(const [lab,fn] of [[`+ ${MOD(L).n}`,()=>{addTrain(L)}],['+ Carriage',()=>{const t=L.trains.find(t=>t.cars<3);if(!G.cars){toast('No spare carriages');return}if(!t){toast('Add a train first');return}t.cars++;G.cars--;CARADD++;chEv('car',{})}],[`− ${MOD(L).n}`,()=>{if(L.trains.length>1){const t=L.trains.pop();G.trains++;G.cars+=t.cars;for(const p of t.pax)ST[L.st[0]].pax.push(p)}}],['Remove line',()=>removeLine(L)]]){const b=document.createElement('button');b.className='btn';b.textContent=lab;b.onclick=()=>{fn();syncPanel()};bt.appendChild(b)}}LL.appendChild(r)})}
  $('relaxBtn').setAttribute('aria-pressed',G.relaxed);$('relaxBtn').textContent=G.relaxed?'On':'Off';
  const lab={rush:'🚶 Rush hour',match:'🏟 Big match',boom:'🏗 Building boom',storm:'🌧 Storm'};document.querySelectorAll('[data-ev]').forEach(b=>{const L=lab[b.dataset.ev];if(!L)return;b.setAttribute('aria-pressed',G[b.dataset.ev]);b.textContent=G[b.dataset.ev]?'■ Stop '+L.slice(2).toLowerCase():L})}
$('relaxBtn').onclick=()=>{G.relaxed=!G.relaxed;chEv('relax',{});syncPanel()};
document.querySelectorAll('[data-ev]').forEach(b=>b.onclick=()=>{const ev=b.dataset.ev;EVN++;chEv('event',{ev});if(ev==='normal'){if(G.rush||G.match||G.boom||G.storm)EVSTOP++;G.rush=G.match=G.boom=G.storm=false;toast('All events stopped')}else{G[ev]=!G[ev];if(!G[ev]){EVSTOP++;chEv('stop',{ev})}else toast({rush:'🚶 Rush hour: twice as many passengers',match:'🏟 Big match: everyone is heading for the stadium',boom:'🏗 Building boom: new stations open fast',storm:'🌧 Storm: trains slow down'}[ev])}syncPanel()});
/* ---------- drawing ---------- */
function drawVeh(c,L,len,wd,day){const md=L.mode||'train',body=day?'#222':'#f4f0ff';c.fillStyle=body;if(!day){c.shadowColor=L.col;c.shadowBlur=10}c.strokeStyle=L.col;c.lineWidth=2;
  if(md==='ferry'){c.beginPath();c.moveTo(len*0.6,0);c.quadraticCurveTo(len*0.3,-wd*0.75,-len/2,-wd*0.6);c.lineTo(-len/2,wd*0.6);c.quadraticCurveTo(len*0.3,wd*0.75,len*0.6,0);c.closePath();c.fill();c.shadowBlur=0;c.stroke();c.fillStyle=L.col;rr2(c,-len*0.3,-wd*0.3,len*0.45,wd*0.6,wd*0.15);c.fill();return}
  if(md==='bus'){rr2(c,-len/2,-wd/2,len,wd,wd*0.2);c.fill();c.shadowBlur=0;c.stroke();c.fillStyle=L.col;for(let k=0;k<3;k++)c.fillRect(-len/2+len*(0.12+k*0.27),-wd*0.32,len*0.18,wd*0.64);return}
  if(md==='metro'){rr2(c,-len/2,-wd/2,len,wd,wd*0.5);c.fill();c.shadowBlur=0;c.stroke();c.fillStyle=L.col;c.fillRect(-len/2+wd*0.4,-wd*0.12,len-wd*0.8,wd*0.24);return}
  if(md==='tram'){rr2(c,-len/2,-wd*0.42,len,wd*0.84,wd*0.25);c.fill();c.shadowBlur=0;c.stroke();c.strokeStyle=L.col;c.beginPath();for(let k=1;k<4;k++){c.moveTo(-len/2+len*k/4,-wd*0.42);c.lineTo(-len/2+len*k/4,wd*0.42)}c.stroke();return}
  rr2(c,-len/2,-wd/2,len,wd,wd/2);c.fill();c.shadowBlur=0;c.stroke()}
function setVeh(m){if(!G.unlocked.includes(m)){toast(`${MODES[m].ic} ${MODES[m].n} lines are locked: pick them as a weekly upgrade`);return}G.mode=m;const L=LINES[CUR];
  if(L&&L.st.length>=2&&L.mode!==m){const old=L.mode;L.mode=m;if(needB(L)&&bridgesUsed()>G.bridges){L.mode=old;toast('🌉 Not enough bridges for that line to switch');return}MODEADD++;chEv('mode',{m});toast(`Line ${L.id+1} now runs ${plur(m,2)} ${MODES[m].ic}`);routes()}syncPanel()}
// stations and passengers use a coloured shape per kind of place, not emoji
function glyph(c,t,x,y,sz){const m=c.font.match(/([\d.]+)px/),s=(sz||(m?+m[1]:12))*0.42,k=TK.indexOf(t),col=TYPES[t]?TYPES[t].col:'#fff';c.save();c.fillStyle=col;c.beginPath();
  switch(k%7){case 0:c.arc(x,y,s,0,7);break;case 1:c.rect(x-s*0.88,y-s*0.88,s*1.76,s*1.76);break;case 2:c.moveTo(x,y-s*1.1);c.lineTo(x+s*1.05,y+s*0.8);c.lineTo(x-s*1.05,y+s*0.8);c.closePath();break;
    case 3:c.moveTo(x,y-s*1.2);c.lineTo(x+s,y);c.lineTo(x,y+s*1.2);c.lineTo(x-s,y);c.closePath();break;case 4:{const w=s*0.4;c.rect(x-w,y-s,w*2,s*2);c.rect(x-s,y-w,s*2,w*2);break}
    case 5:for(let i=0;i<10;i++){const r=i%2?s*0.5:s*1.15,a=-Math.PI/2+i*Math.PI/5;i?c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r):c.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}c.closePath();break;
    default:for(let i=0;i<6;i++){const a=i*Math.PI/3;i?c.lineTo(x+Math.cos(a)*s,y+Math.sin(a)*s):c.moveTo(x+Math.cos(a)*s,y+Math.sin(a)*s)}c.closePath()}c.fill();c.restore()}
function rr2(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function render(c,now){const day=S.view==='day',z=cam.z;c.fillStyle=day?'#e8e4da':'#070814';c.fillRect(0,0,W,H);
  c.fillStyle=day?'#f2efe8':'#0d0f20';c.fillRect(sx(0),sy(0),WW*z,WH*z);
  // faint street grid
  c.strokeStyle=day?'rgba(0,0,0,.05)':'rgba(140,150,220,.06)';c.lineWidth=1;c.beginPath();for(let x=0;x<=WW;x+=4){c.moveTo(sx(x),sy(0));c.lineTo(sx(x),sy(WH))}for(let y=0;y<=WH;y+=4){c.moveTo(sx(0),sy(y));c.lineTo(sx(WW),sy(y))}c.stroke();
  c.save();c.beginPath();c.rect(sx(0),sy(0),WW*z,WH*z);c.clip();for(const P of WATER){c.fillStyle=day?'#a8cfe6':'#0f2a4a';c.strokeStyle=day?'#8ab8d8':'rgba(80,170,255,.35)';c.lineWidth=2;c.beginPath();P.forEach(([x,y],i)=>i?c.lineTo(sx(x),sy(y)):c.moveTo(sx(x),sy(y)));c.closePath();c.fill();c.stroke()}c.restore();
  // lines
  const lw=Math.max(4,z*0.9);c.lineCap='round';c.lineJoin='round';
  LINES.forEach((L,k)=>{if(L.pts.length<2)return;const off=0;c.strokeStyle=L.col;if(!day){c.shadowColor=L.col;c.shadowBlur=lw*1.6}const md=L.mode||'train',pth=()=>{c.beginPath();L.pts.forEach(([x,y],i)=>i?c.lineTo(sx(x),sy(y)):c.moveTo(sx(x),sy(y)))};c.lineWidth=md==='tram'?lw*0.6:md==='bus'?lw*0.75:lw;if(md==='bus')c.setLineDash([lw*1.3,lw*0.9]);else if(md==='ferry'){c.setLineDash([lw*0.2,lw*1.1]);c.lineWidth=lw*0.9}pth();c.stroke();c.setLineDash([]);c.shadowBlur=0;if(md==='metro'){c.strokeStyle=day?'#fff':'#0d0f20';c.lineWidth=lw*0.32;pth();c.stroke();c.strokeStyle=L.col}if(md==='tram'){c.lineWidth=Math.max(1,lw*0.18);c.setLineDash([2,lw*0.8]);c.strokeStyle=day?'#555':'#ccc';pth();c.stroke();c.setLineDash([]);c.strokeStyle=L.col}
    // bridges
    const seq=L.loop?L.st.concat([L.st[0]]):L.st;if(needB(L))for(let i=1;i<L.pts.length;i++){const a=L.pts[i-1],b=L.pts[i];const st=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*2);for(let q=0;q<=st;q++){const x=a[0]+(b[0]-a[0])*q/st,y=a[1]+(b[1]-a[1])*q/st;if(isWater(x,y)){c.fillStyle=day?'#555':'#d8d8e8';c.fillRect(sx(x)-lw*0.7,sy(y)-lw*0.7,lw*1.4,lw*1.4)}}}
    if(!L.loop&&L.st.length){for(const e of [0,L.st.length-1]){const s=ST[L.st[e]],o=ST[L.st[e?e-1:1]];if(!o)continue;const dx=s.x-o.x,dy=s.y-o.y,l=Math.hypot(dx,dy)||1;c.strokeStyle=L.col;c.lineWidth=lw;c.beginPath();c.moveTo(sx(s.x),sy(s.y));c.lineTo(sx(s.x+dx/l*2.2),sy(s.y+dy/l*2.2));c.moveTo(sx(s.x+dx/l*2.2-dy/l*1),sy(s.y+dy/l*2.2+dx/l*1));c.lineTo(sx(s.x+dx/l*2.2+dy/l*1),sy(s.y+dy/l*2.2-dx/l*1));c.stroke()}}});
  // drag preview
  if(DRAG&&DRAG.from){const L=LINES[CUR];c.strokeStyle=L?L.col:'#fff';c.globalAlpha=0.6;c.lineWidth=lw;c.setLineDash([lw,lw]);c.beginPath();c.moveTo(sx(DRAG.from.x),sy(DRAG.from.y));c.lineTo(sx(DRAG.x),sy(DRAG.y));c.stroke();c.setLineDash([]);c.globalAlpha=1}
  // trains
  for(const L of LINES)for(const t of L.trains){if(!lineActive(L))continue;const [x,y,a0]=posAt(L,t.d),a=a0+(t.dir<0&&!L.loop?Math.PI:0),X=sx(x),Y=sy(y),len=Math.max(14,z*2.6)*(1+t.cars*0.5)*MOD(L).len,wd=Math.max(8,z*1.3);c.save();c.translate(X,Y);c.rotate(a);drawVeh(c,L,len,wd,day);
    c.restore();const cap=MOD(L).cap*(1+t.cars);if(t.pax.length){const isz=Math.max(9,Math.min(16,z*1.3)),per=Math.ceil(cap/2),bw=Math.min(t.pax.length,per)*isz+6,bh=(t.pax.length>per?2:1)*isz+4,bx=X-bw/2,by=Y-wd-bh-2;c.fillStyle=day?'rgba(255,255,255,.92)':'rgba(16,16,36,.88)';c.strokeStyle=L.col;c.lineWidth=1.5;rr2(c,bx,by,bw,bh,4);c.fill();c.stroke();c.font=`${Math.round(isz*0.82)}px sans-serif`;c.textAlign='center';c.textBaseline='middle';t.pax.forEach((p,i)=>{glyph(c,p.to,bx+3+isz*(i%per)+isz/2,by+2+isz*Math.floor(i/per)+isz/2+1)});c.textBaseline='alphabetic'}}
  // stations
  const R0=Math.max(9,z*1.7);for(const s of ST){const X=sx(s.x),Y=sy(s.y),T=TYPES[s.type],crowd=s.pax.length/s.cap;
    if(s.over>0){if(s.over>0.3){const pu=0.5+0.5*Math.sin(now*0.012);c.fillStyle=`rgba(255,40,40,${0.12+0.25*pu*s.over})`;c.beginPath();c.arc(X,Y,R0*(1.9+pu*0.6),0,7);c.fill()}c.strokeStyle=`rgba(255,${120-100*s.over},80,.95)`;c.lineWidth=4;c.beginPath();c.arc(X,Y,R0*1.5,-Math.PI/2,-Math.PI/2+Math.PI*2*s.over);c.stroke()}
    if(S.view==='crowd'){c.fillStyle=`rgba(255,${200-180*Math.min(1,crowd)},80,.35)`;c.beginPath();c.arc(X,Y,R0*(1.2+crowd),0,7);c.fill()}
    c.fillStyle=day?'#fff':'#141632';c.strokeStyle=T.col;c.lineWidth=s.hub?5:3;if(!day){c.shadowColor=T.col;c.shadowBlur=12}rr2(c,X-R0,Y-R0,R0*2,R0*2,s.hub?R0:R0*0.45);c.fill();c.stroke();c.shadowBlur=0;
    c.font=`${Math.round(R0*1.15)}px sans-serif`;c.textAlign='center';c.textBaseline='middle';glyph(c,s.type,X,Y+1,R0*1.5);c.textBaseline='alphabetic';
    // waiting passengers
    const ps=Math.max(9,R0*0.75);c.font=`${Math.round(ps*0.85)}px sans-serif`;c.textAlign='center';c.textBaseline='middle';s.pax.slice(0,24).forEach((p,i)=>{const col=i%6,row=Math.floor(i/6);glyph(c,p.to,X+R0*1.25+ps/2+col*ps,Y-R0*0.7+row*ps+ps/2)});c.textBaseline='alphabetic';if(s.pax.length>24){c.fillStyle=day?'#000':'#fff';c.font='600 11px "IBM Plex Mono",monospace';c.textAlign='left';c.fillText('+'+(s.pax.length-24),X+R0*1.3,Y+R0*1.6)}
    if(S.sel&&S.sel.s===s){c.strokeStyle='#ffc35a';c.lineWidth=2;c.beginPath();c.arc(X,Y,R0*1.9,0,7);c.stroke()}}
  for(const p of PARTS){const al=1-p.age;c.strokeStyle=p.col;c.globalAlpha=Math.max(0,al);c.lineWidth=2;c.beginPath();c.arc(sx(p.x),sy(p.y),(p.small?R0*1.2:R0*1.4)+p.age*R0*(p.small?1:3),0,7);c.stroke()}c.globalAlpha=1;
  if(G.choosing||G.over){}}
/* ---------- tools ---------- */
const nearStation=(x,y,r)=>{let b=null,bd=r*r;for(const s of ST){const d=(s.x-x)**2+(s.y-y)**2;if(d<bd){bd=d;b=s}}return b};
function nearLine(x,y){let best=null,bd=9;for(const L of LINES){for(let i=1;i<L.pts.length;i++){const [ax,ay]=L.pts[i-1],[bx,by]=L.pts[i],dx=bx-ax,dy=by-ay,t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1),d=(ax+dx*t-x)**2+(ay+dy*t-y)**2;if(d<bd){bd=d;best=L}}}return best}
const SIM={id:'interchange',name:'Interchange',defTool:'draw',world:{w:WW,h:WH,wrapX:false,maxZ:30,followZ:12},home:'plain',freeScen:'harbour',tutScen:'plain',defSpeed:1,homeSpeed:1,inspectTab:'insp',
  speeds:[['½×',0.5],['1×',1],['2×',2],['4×',4]],fmtRate:v=>`${v}× speed`,
  dateTxt:()=>`Week ${G.week}`,dateSub:()=>`${fmtN(G.delivered)} passengers delivered`,stepSize:()=>0.05,
  tools:[['',[['select','👆','Inspect']]],['Build',[['draw','✏️','Draw line','Drag from a station to another station. Drag from the end of a line to make it longer, or back to its first station to make a loop.'],['train','🚆','Add vehicle','Click a line to put another vehicle on it (a train, metro or tram, to match the line).'],['car','🚃','Carriage','Click a line to add a carriage to one of its trains (6 more seats).'],['hub','🔄','Interchange','Click a station to make it an interchange: room for 18 people and faster boarding.'],['erase','✂️','Shorten','Click near the end of a line to remove its last stop.']]]],
  scens:SCENLIST,
  load(id){clearCity();(SCENS[id]||SCENS.harbour)();for(let k=0;k<3;k++)addStation(['home','office','shop'][k]);this.t0=0;HIST=[];if(MODE==='free'&&$('home').hidden){G.lines=LCOL.length;while(LINES.length<G.lines)LINES.push(newLine(LINES.length));G.trains=G.cars=G.bridges=G.hubs=999;G.relaxed=true;G.unlocked=[...MK]}syncPanel()},
  after(){if(!$('home').hidden)return;setTool('draw')},
  step(dt){if(G.over||G.choosing)return;G.spawnT+=dt;G.weekT+=dt;const every=Math.max(4,13-G.week*0.6)*(G.boom?0.35:1);if(G.spawnT>=every&&ST.length<48){G.spawnT=0;addStation()}
    for(const s of ST){spawnPax(s,dt);for(const p of s.pax)p.age+=dt;const cap=s.hub?18:6;s.cap=cap;if(s.pax.length>cap)s.over+=dt/(G.relaxed?1e9:40);else s.over=Math.max(0,s.over-dt/20);if(!G.relaxed&&s.over>0.3){s.alT=(s.alT||0)-dt;if(s.alT<=0){s.alT=s.over>0.7?2.5:5;alarm(s)}}else s.alT=0;if(s.over>=1&&!G.relaxed&&!G.over){gameOver(s);return}}
    for(const L of LINES)for(const t of L.trains)trainStep(L,t,dt);
    if(G.weekT>=WEEK){G.weekT=0;weekUp()}},
  frame(dt){for(const p of PARTS)p.age+=dt*1.4;PARTS=PARTS.filter(p=>p.age<1)},
  render,
  stats:()=>[['Delivered',fmtN(G.delivered)],['Stations',ST.length],['Trains',LINES.reduce((s,L)=>s+L.trains.length,0)],['Week',G.week]],
  hud(){const last=HIST[HIST.length-1];if(!last||S.t-last.t>=2)HIST.push({t:S.t,d:G.delivered});if(HIST.length>300)HIST.shift();syncPanel();renderStats();renderInspect()},
  pick(wx,wy){const s=nearStation(wx,wy,2.5);if(s)return{s};const L=nearLine(wx,wy);if(L)return{L};return null},
  pointer(type,wx,wy){const t=S.tool;HOVER=[wx,wy];
    if(t==='draw'){if(type==='down'){const s=nearStation(wx,wy,3);if(s){DRAG={from:s,x:wx,y:wy}}else{const L=nearLine(wx,wy);if(L){CUR=L.id;syncPanel();DRAG={mid:L,x:wx,y:wy,gap:gapAt(L,wx,wy)}}else DRAG=null}}else if(type==='drag'&&DRAG&&DRAG.mid){DRAG.x=wx;DRAG.y=wy;const s=nearStation(wx,wy,2.6);if(s&&!DRAG.mid.st.includes(s.id)){if(insertStation(DRAG.mid,DRAG.gap,s)){DRAG.gap++;syncPanel()}}}else if(type==='drag'&&DRAG){DRAG.x=wx;DRAG.y=wy;const s=nearStation(wx,wy,2.6);if(s&&s!==DRAG.from){if(linkStations(DRAG.from,s)){DRAG.from=s;syncPanel()}else DRAG=null}}else if(type==='up')DRAG=null;return}
    if(type!=='down')return;
    if(t==='train'){const L=nearLine(wx,wy);if(L){addTrain(L);syncPanel()}else toast('Click on a line');return}
    if(t==='car'){const L=nearLine(wx,wy);if(!L){toast('Click on a line');return}if(!G.cars){toast('No spare carriages');return}const tr=L.trains.find(q=>q.cars<3);if(!tr){toast('Add a train to this line first');return}tr.cars++;G.cars--;CARADD++;chEv('car',{});syncPanel();return}
    if(t==='hub'){const s=nearStation(wx,wy,3);if(!s){toast('Click a station');return}if(s.hub){toast('Already an interchange');return}if(!G.hubs){toast('No interchanges left: pick one as a weekly upgrade');return}s.hub=true;G.hubs--;HUBADD++;chEv('hub',{});toast('🔄 Interchange built');syncPanel();return}
    if(t==='erase'){const L=nearLine(wx,wy);if(!L){toast('Click near a line end');return}const a=ST[L.st[0]],b=ST[L.st[L.st.length-1]];trimLine(L,Math.hypot(b.x-wx,b.y-wy)<Math.hypot(a.x-wx,a.y-wy)?1:-1);syncPanel()}},
  hover(wx,wy){HOVER=[wx,wy]},
  find(q){const out=[],add=(label,sub,go)=>out.push({label,sub,go});for(const t of TK)if(TYPES[t].n.toLowerCase().includes(q)||t.includes(q)){const s=ST.find(x=>x.type===t);if(s)add(`${TYPES[t].ic} ${TYPES[t].n} station`,`${s.pax.length} waiting`,()=>{S.sel={s};flyToW(s.x,s.y,10);showTab('insp')})}
    if('busiest crowded'.includes(q))add('Most crowded station','',()=>{const s=[...ST].sort((a,b)=>b.pax.length-a.pax.length)[0];if(s){S.sel={s};flyToW(s.x,s.y,10);showTab('insp')}});
    for(const [,items] of SIM.tools)for(const [id,ico,name] of items)if(id!=='select'&&name.toLowerCase().includes(q))add(`${ico} ${name}`,'tool',()=>setTool(id));
    for(const s of SCENLIST)if(s.name.toLowerCase().includes(q))add('City: '+s.name,s.desc,()=>{loadScen(s.id);toast(s.name)});return out},
  tabShown(id){if(id==='stats')renderStats(true)},selChanged(){renderInspect()},
};
function kv(rows){return rows.map(([k,v])=>`<div><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}
function renderStats(force){if($('pane-stats').hidden&&!force)return;const wait=ST.reduce((s,x)=>s+x.pax.length,0),riding=LINES.reduce((s,L)=>s+L.trains.reduce((a,t)=>a+t.pax.length,0),0);
  $('cStats').innerHTML=kv([['Delivered',fmtN(G.delivered)],['Week',G.week],['Stations',ST.length],['Waiting now',wait],['On trains now',riding],['Bridges used',`${bridgesUsed()} of ${G.bridges}`]]);
  const g=$('graph'),gc=g.getContext('2d'),w=g.width=g.clientWidth*DPR,hh=g.height=g.clientHeight*DPR;gc.clearRect(0,0,w,hh);if(HIST.length>1){const t0=HIST[0].t,t1=HIST[HIST.length-1].t,m=Math.max(1,HIST[HIST.length-1].d);gc.strokeStyle='#ff5ab4';gc.lineWidth=2*DPR;gc.beginPath();HIST.forEach((p,i)=>{const x=8+(w-16)*(p.t-t0)/Math.max(1e-6,t1-t0),y=hh-6-(hh-12)*p.d/m;i?gc.lineTo(x,y):gc.moveTo(x,y)});gc.stroke()}
  const L=$('sList');L.textContent='';for(const s of [...ST].sort((a,b)=>b.pax.length-a.pax.length).slice(0,8)){const r=document.createElement('button');r.className='sprow';r.innerHTML='<i></i><span></span><b></b>';r.children[0].style.background=TYPES[s.type].col;r.children[1].textContent=`${TYPES[s.type].ic} ${TYPES[s.type].n}${s.hub?' · interchange':''}`;r.children[2].textContent=`${s.pax.length}/${s.cap}`;r.onclick=()=>{S.sel={s};flyToW(s.x,s.y,10);showTab('insp')};L.appendChild(r)}}
function renderInspect(){const b=S.sel;$('inspEmpty').hidden=!!b;$('inspBody').hidden=!b;if(!b)return;const body=$('inspBody');
  if(b.s){const s=b.s,T=TYPES[s.type],lines=LINES.filter(L=>L.st.includes(s.id));const want={};for(const p of s.pax)want[p.to]=(want[p.to]||0)+1;
    body.innerHTML=`<h2 class="ititle">${T.ic} ${T.n}</h2><div class="isub">${s.hub?'Interchange · ':''}${lines.length?`on ${lines.length} line${lines.length>1?'s':''}`:'not connected yet'}</div><div class="kv">${kv([['Waiting',`${s.pax.length} of ${s.cap}`],['Crowding',s.over>0?Math.round(s.over*100)+'% to giving up':'fine'],['Passengers arrived here',s.served],['Open since',`week ${Math.floor((s.born||0)/WEEK)+1}`]])}</div><p class="note">${Object.keys(want).length?'Heading for: '+Object.entries(want).map(([t,n])=>`${n} to ${TYPES[t].n.toLowerCase()} (${shapeOf(t)})`).join(', '):'Nobody waiting.'}</p>`;return}
  if(b.L){const L=b.L;body.innerHTML=`<h2 class="ititle" style="color:${L.col}">Line ${L.id+1}</h2><div class="isub">${MOD(L).ic} ${MOD(L).n} line · ${L.st.length} stations${L.loop?' · loop':''}</div><div class="kv">${kv([['Vehicle',MOD(L).n+' (seats '+MOD(L).cap+')'],['Vehicles',L.trains.length],['Carriages',L.trains.reduce((s,t)=>s+t.cars,0)],['On board',L.trains.reduce((s,t)=>s+t.pax.length,0)],['Length',Math.round(L.len)+' blocks']])}</div>`}}

// home page: Classic mode button; Free play means anything goes
{const f=$('hFree');const b=document.createElement('button');b.className='hb';b.id='hClassic';b.innerHTML='<span class="ht">Classic</span><span class="hd">Limited lines, trains and bridges. Alarms sound when a station overflows, and if one stays full too long, the game is over.</span>';f.before(b);
  f.querySelector('.hd').textContent='Anything goes: every line colour, unlimited trains, carriages, bridges and interchanges, and no game over';
  b.onclick=()=>{MODE='classic';leaveHome();loadScen('harbour');setSpeed(SIM.defSpeed);countPlay();toast('Classic mode: keep every station from overflowing!')};
  document.addEventListener('pointerdown',e=>{if(e.target.closest('#hFree'))MODE='free';else if(e.target.closest('#home,#chDone,#hClassic'))MODE='classic'},true)}

{const bar=document.createElement('div');bar.id='lineBar';bar.className='panel';bar.style.cssText='display:flex;gap:6px;padding:8px 10px;align-items:center;flex-wrap:wrap';const hud=document.querySelector('.hud-top .time');hud.after(bar);
  const css=document.createElement('style');css.textContent='body.mHome #lineBar,body.mDemo #lineBar{display:none!important}#lineBar button{width:30px;height:30px;border-radius:50%;border:3px solid transparent;cursor:pointer}#lineBar button[aria-pressed="true"]{border-color:#fff;transform:scale(1.15)}#lineBar button:disabled{opacity:.25;cursor:default}@media (max-width:760px){#lineBar{flex:1 1 100%;justify-content:center}}#lineBar button:not(.pz){width:26px!important;height:26px!important}#lineBar .pz{white-space:nowrap}#lineBar .vm{padding:0 6px;font-size:16px}#lineBar .vm[aria-pressed="true"]{border-color:#fff;background:rgba(255,255,255,.18)}#placeopts,#hint{display:none!important}#lineBar .pz{width:auto;height:30px;border-radius:8px;padding:0 10px;border:1px solid rgba(255,195,90,.6);background:rgba(255,195,90,.12);color:#fff;font-size:13px}';document.head.appendChild(css);
  const draw=()=>{sig=typeof sigOf==='function'?sigOf():'';bar.innerHTML='';const pz=document.createElement('button');pz.className='pz';pz.textContent=S.paused?'▶ Play':'⏸ Pause';pz.onclick=()=>{setPaused(!S.paused);draw()};bar.appendChild(pz);const lb=document.createElement('span');lb.className='k';lb.style.margin='0 2px 0 6px';lb.textContent='Line';{const vl=document.createElement('span');vl.className='k';vl.style.margin='0 2px 0 8px';vl.textContent='Vehicle';bar.appendChild(vl)}for(const m of MK){const b=document.createElement('button');b.className='pz vm';b.textContent=MODES[m].ic;b.title=`${MODES[m].n}: ${MODES[m].d}`+(G.unlocked.includes(m)?'':' (locked: pick it as a weekly upgrade)');b.setAttribute('aria-pressed',G.mode===m);b.style.opacity=G.unlocked.includes(m)?1:0.35;b.onclick=()=>{setVeh(m);draw()};bar.appendChild(b)}bar.appendChild(lb);
  LCOL.forEach((col,k)=>{const b=document.createElement('button');b.style.background=col;const L=LINES[k];b.disabled=!L;b.title=L?(L.st.length?`Line ${k+1}: ${L.st.length} stations`:`Line ${k+1}: not built yet`):'Not unlocked yet';b.setAttribute('aria-pressed',k===CUR);b.onclick=()=>{CUR=k;setTool('draw');syncPanel();draw()};bar.appendChild(b)})};
  const sigOf=()=>[S.paused,G.mode,CUR,LINES.length,G.unlocked.join(),LINES.map(L=>L.st.length).join()].join('|');let sig='';setInterval(()=>{if(sigOf()!==sig)draw()},300);draw()}

// a key: which shape is which kind of place
{const SYM={circle:'●',square:'■',triangle:'▲',diamond:'◆',cross:'✚',star:'★',hexagon:'⬢'};const k=document.createElement('div');k.id='shapeKey';k.style.cssText='display:flex;flex-wrap:wrap;gap:6px 12px;font-size:13px';
  const draw=()=>{const present=new Set(ST.map(s=>s.type));k.innerHTML=TK.filter(t=>present.has(t)).map(t=>`<span><b style="color:${TYPES[t].col};font-size:15px">${SYM[shapeOf(t)]}</b> ${TYPES[t].n}</span>`).join('')};
  const pane=document.getElementById('pane-world');const lab=document.createElement('span');lab.className='k';lab.textContent='Shapes';pane.prepend(k);pane.prepend(lab);setInterval(draw,1000);draw()}
