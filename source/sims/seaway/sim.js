/* ================= Seaway: a shipping puzzle ================= */
// The city is 120 x 80 units. Time is in seconds of game time; a week lasts 60 seconds.
const WW=120,WH=80,WEEK=60;
const TYPES={town:{ic:'🏘️',n:'Towns',col:'#7fd18a',w:40},fish:{ic:'🐟',n:'Fisheries',col:'#6aa8ff',w:24},farm:{ic:'🌾',n:'Farms',col:'#ffc35a',w:16},mine:{ic:'⛏️',n:'Mines',col:'#ff8a5c',w:8},
  factory:{ic:'🏭',n:'Factory',col:'#ff6b7a',w:6},resort:{ic:'🏝️',n:'Resort',col:'#c48bff',w:3},oil:{ic:'🛢️',n:'Oil rig',col:'#60d6e6',w:3}};
const TK=Object.keys(TYPES);const SHAPES=["circle", "square", "triangle", "diamond", "cross", "star", "hexagon"];const shapeOf=t=>SHAPES[TK.indexOf(t)%7];
const LCOL=['#ff5a8a','#4aa8ff','#ffc23a','#3ad08a','#b07aff','#ff8a3a','#3adbe0'];
const MODES={train:{ic:'🚢',n:'Cargo ship',sp:10,cap:6,bridge:0,len:1.1,d:'The workhorse of the seas.'},bus:{ic:'🚤',n:'Speedboat',sp:16,cap:3,bridge:0,len:0.75,d:'Very fast, but carries little.'},tram:{ic:'🛳️',n:'Freighter',sp:6.5,cap:14,bridge:0,len:1.5,d:'Slow, but huge.'},metro:{ic:'🛥️',n:'Hovercraft',sp:11,cap:5,bridge:0,len:1,d:'Glides straight over land and sea.'}};
const MK=Object.keys(MODES);const plur=(m,n)=>{const w=MODES[m].n.toLowerCase();return n===1||m==='metro'?w:w+'s'};const MOD=L=>MODES[L.mode||'train'],needB=L=>!!MOD(L).bridge;let MODEADD=0;
let ST=[],LINES=[],WATER=[],PARTS=[],HIST=[],NEXT={};
const G={lines:3,trains:3,cars:0,bridges:2,hubs:0,week:1,delivered:0,over:false,relaxed:false,spawnT:0,weekT:0,choosing:false,seed:1,rush:false,match:false,boom:false,storm:false,mode:'train',unlocked:['train','bus','tram','metro']};
let MODE='classic';let CUR=0,DRAG=null,HOVER=null,LBL=true,EVN=0,EVSTOP=0,UPG=0,DRAWN=0,EXT=0,TRADD=0,CARADD=0,HUBADD=0,REMOVED=0;
let RS=1;function R(){RS|=0;RS=RS+0x6D2B79F5|0;let t=Math.imul(RS^RS>>>15,1|RS);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}
/* ---------- water: rivers and coasts are polygons ---------- */
function inPoly(x,y,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const [xi,yi]=P[i],[xj,yj]=P[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c}return c}
// WATER holds the land: islands (and lagoons inside them, which count twice)
const isWater=(x,y)=>{let n=0;for(const P of WATER)if(inPoly(x,y,P))n++;return n%2===0};
function isle(x,y,rx,ry,k){const P=[];for(let a=0;a<28;a++){const t=a/28*Math.PI*2,r=1+0.2*Math.sin(t*3+k)+0.1*Math.sin(t*5+k*2);P.push([x+Math.cos(t)*rx*r,y+Math.sin(t)*ry*r])}return P}
function river(pts,w){const L=[],Rr=[];for(let i=0;i<pts.length;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,nx=-dy/l*w/2,ny=dx/l*w/2;L.push([pts[i][0]+nx,pts[i][1]+ny]);Rr.unshift([pts[i][0]-nx,pts[i][1]-ny])}return L.concat(Rr)}
function crossings(ax,ay,bx,by){let n=0,inW=isWater(ax,ay);const st=Math.ceil(Math.hypot(bx-ax,by-ay)*2);for(let k=1;k<=st;k++){const w=isWater(ax+(bx-ax)*k/st,ay+(by-ay)*k/st);if(w&&!inW)n++;inW=w}return n}
/* ---------- ports ---------- */
function spot(){for(let k=0;k<300;k++){const x=6+R()*(WW-12),y=6+R()*(WH-12);if(isWater(x,y))continue;if(![0,1,2,3,4,5,6,7].some(k=>isWater(x+Math.cos(k*0.785)*2.8,y+Math.sin(k*0.785)*2.8)))continue;if(ST.some(s=>Math.hypot(s.x-x,s.y-y)<7.5))continue;const cx=WW/2,cy=WH/2,d=Math.hypot(x-cx,y-cy);if(R()<d/(WW*0.7)*(ST.length<8?1.6:0.6))continue;return[x,y]}return null}
function pickType(){const present=new Set(ST.map(s=>s.type));let pool=TK.filter(t=>t==='town'||t==='fish'||t==='farm'||G.week>=(t==='mine'?2:t==='factory'?3:t==='resort'?4:5));
  if(!present.has('town'))return'town';if(!present.has('fish'))return'fish';const unique=['resort','oil'];pool=pool.filter(t=>!(unique.includes(t)&&ST.some(s=>s.type===t)));let tot=0;for(const t of pool)tot+=TYPES[t].w;let r=R()*tot;for(const t of pool){r-=TYPES[t].w;if(r<=0)return t}return'town'}
function addStation(type,x,y){if(x==null){const p=spot();if(!p)return null;[x,y]=p}const s={id:ST.length,type:type||pickType(),x,y,pax:[],cap:6,over:0,hub:false,spawn:R()*4+2,born:S.t,served:0};ST.push(s);FX(s.x,s.y,TYPES[s.type].col);routes();return s}
/* ---------- lines and trains ---------- */
const newLine=k=>({id:k,mode:'train',col:LCOL[k],st:[],trains:[],loop:false,pts:[],len:0,stops:[]});
// ships sail round the islands: a shortest path over the sea, then straightened where the way is clear
let SEAG=null,SPC=new Map();
function seaGrid(){SEAG=new Uint8Array(WW*WH);for(let y=0;y<WH;y++)for(let x=0;x<WW;x++)SEAG[y*WW+x]=isWater(x+0.5,y+0.5)?1:0;SPC=new Map()}
function seaPath(a,b){const key=a.id+'-'+b.id;if(SPC.has(key))return SPC.get(key);if(!SEAG)seaGrid();const ok=(x,y)=>x>=0&&y>=0&&x<WW&&y<WH&&(SEAG[(y|0)*WW+(x|0)]||Math.hypot(x+0.5-a.x,y+0.5-a.y)<3.2||Math.hypot(x+0.5-b.x,y+0.5-b.y)<3.2);
  const sx0=a.x|0,sy0=a.y|0,tx=b.x|0,ty=b.y|0,N=WW*WH,g=new Float32Array(N).fill(1e9),par=new Int32Array(N).fill(-1),open=[[0,sy0*WW+sx0]];g[sy0*WW+sx0]=0;let found=false;
  while(open.length){let bi=0;for(let i=1;i<open.length;i++)if(open[i][0]<open[bi][0])bi=i;const [,u]=open[bi];open[bi]=open[open.length-1];open.pop();const ux=u%WW,uy=(u/WW)|0;if(ux===tx&&uy===ty){found=true;break}
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const vx=ux+dx,vy=uy+dy;if(!ok(vx,vy))continue;const v=vy*WW+vx,c=g[u]+(dx&&dy?1.414:1);if(c<g[v]){g[v]=c;par[v]=u;open.push([c+Math.hypot(tx-vx,ty-vy),v])}}}
  let P;if(!found)P=[[b.x,b.y]];else{const cells=[];for(let v=ty*WW+tx;v>=0;v=par[v])cells.push([(v%WW)+0.5,((v/WW)|0)+0.5]);cells.reverse();cells[0]=[a.x,a.y];cells[cells.length-1]=[b.x,b.y];
    const clear=(p,q)=>{const n=Math.ceil(Math.hypot(q[0]-p[0],q[1]-p[1])*2);for(let k=1;k<n;k++){const x=p[0]+(q[0]-p[0])*k/n,y=p[1]+(q[1]-p[1])*k/n;if(!ok(Math.floor(x),Math.floor(y)))return false}return true};
    P=[];let i=0;while(i<cells.length-1){let j=cells.length-1;while(j>i+1&&!clear(cells[i],cells[j]))j--;P.push(cells[j]);i=j}
    // round the corners a little
    if(P.length>1){const Q=[];let prev=[a.x,a.y];for(let k=0;k<P.length;k++){const p=P[k],n=P[k+1];if(n){Q.push([prev[0]*0.15+p[0]*0.85,prev[1]*0.15+p[1]*0.85]);Q.push([p[0]*0.85+n[0]*0.15,p[1]*0.85+n[1]*0.15])}else Q.push(p);prev=p}P=Q}}
  SPC.set(key,P);return P}
function geom(L){const pts=[],stops=[];let len=0;const seq=L.loop?L.st.concat([L.st[0]]):L.st;
  for(let i=0;i<seq.length;i++){const s=ST[seq[i]];if(i===0){pts.push([s.x,s.y]);stops.push(0);continue}const a=ST[seq[i-1]],P=L.mode==='metro'?[[s.x,s.y]]:seaPath(a,s);
    for(const q of P){const p=pts[pts.length-1];len+=Math.hypot(q[0]-p[0],q[1]-p[1]);pts.push(q)}stops.push(len)}L.pts=pts;L.len=len;L.stops=stops}
function pathCross(){return 0}
function bridgesUsed(){let n=0;for(const L of LINES){if(!needB(L))continue;const seq=L.loop?L.st.concat([L.st[0]]):L.st;for(let i=1;i<seq.length;i++)n+=pathCross(ST[seq[i-1]],ST[seq[i]])}return n}
function posAt(L,d){let acc=0;for(let i=1;i<L.pts.length;i++){const a=L.pts[i-1],b=L.pts[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(acc+l>=d||i===L.pts.length-1){const t=l?clamp((d-acc)/l,0,1):0;return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,Math.atan2(b[1]-a[1],b[0]-a[0])]}acc+=l}return[L.pts[0][0],L.pts[0][1],0]}
function addTrain(L){if(G.trains<=0){toast('No ships left: you get one every week');return false}if(L.st.length<2)return false;if(L.trains.length>=8){toast('That line has 8 ships already');return false}G.trains--;const n=L.trains.length,fr=(n*0.618)%1,target=L.len*fr;let d=L.stops.reduce((b,x)=>Math.abs(x-target)<Math.abs(b-target)?x:b,0);L.trains.push({d,dir:(n%2||L.loop)?1:-1,pax:[],cars:0,wait:0.3+n*0.4,stop:0});TRADD++;chEv('train',{});return true}
function lineActive(L){return L.st.length>=2}
function linkStations(a,b){// extend the chosen line or start it
  let L=LINES[CUR];if(!L){toast('Pick a line colour first');return false}
  if(L.st.length===0){L.mode=G.unlocked.includes(G.mode)?G.mode:'train';if(needB(L)&&pathCross(a,b)>G.bridges-bridgesUsed()){toast('🌉 Not enough bridges to cross the water');return false}L.st=[a.id,b.id];geom(L);if(!L.trains.length&&!addTrain(L)){}DRAWN++;chEv('line',{n:2});routes();return true}
  if(L.loop){toast('This line is a loop. Pick another colour for a new line');return false}
  const first=L.st[0],last=L.st[L.st.length-1];let atEnd=a.id===last?1:a.id===first?-1:0;if(!atEnd){toast('Drag from the end of the line to extend it');return false}
  if(b.id===(atEnd>0?first:last)&&L.st.length>=3){if(needB(L)&&pathCross(a,b)>G.bridges-bridgesUsed()){toast('🌉 Not enough bridges');return false}L.loop=true;geom(L);for(const t of L.trains)t.dir=1;routes();EXT++;chEv('loop',{});toast('⭕ Loop closed');return true}
  if(L.st.includes(b.id)){toast('That port is already on this line');return false}
  if(needB(L)&&pathCross(a,b)>G.bridges-bridgesUsed()){toast('🌉 Not enough bridges to cross the water');return false}
  if(atEnd>0)L.st.push(b.id);else{L.st.unshift(b.id);for(const t of L.trains)t.d+=0}geom(L);if(atEnd<0)for(const t of L.trains){t.d=clamp(t.d+(L.stops[1]||0),0,L.len)}EXT++;chEv('extend',{});routes();return true}
function gapAt(L,x,y){// which pair of ports (gap index) the point is closest to along the line
  let best=0,bd=1e9,acc=0,bestD=0;for(let i=1;i<L.pts.length;i++){const [ax,ay]=L.pts[i-1],[bx,by]=L.pts[i],dx=bx-ax,dy=by-ay,l=Math.hypot(dx,dy)||1,t=clamp(((x-ax)*dx+(y-ay)*dy)/(l*l),0,1),d=(ax+dx*t-x)**2+(ay+dy*t-y)**2;if(d<bd){bd=d;bestD=acc+t*l}acc+=l}
  for(let k=1;k<L.stops.length;k++)if(bestD<=L.stops[k]+1e-6)return k;return L.stops.length-1}
function insertStation(L,gap,s){const seq=L.loop?L.st.concat([L.st[0]]):L.st;const a=ST[seq[gap-1]],b=ST[seq[gap]];if(!a||!b)return false;
  const extra=pathCross(a,s)+pathCross(s,b)-pathCross(a,b);if(needB(L)&&extra>G.bridges-bridgesUsed()){toast('🌉 Not enough bridges');return false}
  const frac=L.len?L.trains.map(t=>t.d/L.len):[];if(gap>=L.st.length)L.st.push(s.id);else L.st.splice(gap,0,s.id);geom(L);L.trains.forEach((t,i)=>{t.d=clamp(frac[i]*L.len,0,L.len)});routes();EXT++;chEv('insert',{});toast('Port added to the line');return true}
function removeLine(L){G.trains+=L.trains.length;G.cars+=L.trains.reduce((s,t)=>s+t.cars,0);for(const t of L.trains)for(const p of t.pax){const s=ST[L.st[0]];if(s)s.pax.push(p)}L.st=[];L.trains=[];L.loop=false;geom(L);routes();REMOVED++;chEv('remove',{})}
function trimLine(L,end){if(L.st.length<=2){removeLine(L);return}if(L.loop){L.loop=false}else if(end>0)L.st.pop();else L.st.shift();geom(L);for(const t of L.trains)t.d=clamp(t.d,0,L.len);routes();REMOVED++}
/* ---------- routing: from every port, the next port on the quickest way to each kind of place ---------- */
let DIST={};function routes(){if(MODE==='free'&&$('home').hidden)for(const L of LINES){if(!lineActive(L))continue;while(L.trains.length<Math.min(8,Math.ceil(L.st.length/4))&&G.trains>0){const n=TRADD;if(!addTrain(L))break;TRADD=n}}NEXT={};DIST={};const adj=ST.map(()=>[]);for(const L of LINES){if(!lineActive(L))continue;const seq=L.loop?L.st.concat([L.st[0]]):L.st;for(let i=1;i<seq.length;i++){adj[seq[i-1]].push([seq[i],L.id]);adj[seq[i]].push([seq[i-1],L.id])}}
  for(const t of TK){const dist=new Array(ST.length).fill(1e9),nx=new Array(ST.length).fill(-1),q=[];for(const s of ST)if(s.type===t){dist[s.id]=0;q.push(s.id)}
    for(let h=0;h<q.length;h++){const u=q[h];for(const [v] of adj[u])if(dist[v]>dist[u]+1){dist[v]=dist[u]+1;nx[v]=u;q.push(v)}}NEXT[t]=nx;DIST[t]=dist}}
/* ---------- the game ---------- */
function spawnPax(s,dt){const rate=(0.12+G.week*0.018)*(G.rush?2:1)*(s.type==='town'?1.3:1);s.spawn-=dt*rate;if(s.spawn>0)return;s.spawn=1.5+R()*3;
  let pool=TK.filter(t=>t!==s.type&&ST.some(o=>o.type===t));if(!pool.length)return;if(G.match&&ST.some(o=>o.type==='resort')&&s.type!=='resort'&&R()<0.6)pool=['resort'];
  const w=pool.map(t=>TYPES[t].w+(t==='town'?20:0));let tot=w.reduce((a,b)=>a+b,0),r=R()*tot,k=0;for(;k<pool.length;k++){r-=w[k];if(r<=0)break}s.pax.push({to:pool[Math.min(k,pool.length-1)],age:0})}
function trainStep(L,t,dt){if(!lineActive(L))return;const M=MOD(L);let base=M.sp;if(L.mode==='metro'){const [px,py]=posAt(L,t.d);if(!isWater(px,py))base*=0.55}const sp=base*(G.storm?0.62:1)*dt;
  if(t.wait>0){t.wait-=dt;return}
  const stops=L.stops,next=t.dir>0?stops.find(d=>d>t.d+1e-6):[...stops].reverse().find(d=>d<t.d-1e-6);
  if(next==null){if(L.loop){t.d=0;t.stop=0;return}t.dir*=-1;return}
  const dist=Math.abs(next-t.d);if(dist<=sp){t.d=next;const si=stops.indexOf(next),sid=(L.loop&&si===stops.length-1)?L.st[0]:L.st[si];t.stop=si;exchange(L,t,ST[sid]);t.wait=0.6+(ST[sid].hub?0:0.3);
    if(!L.loop&&(si===0||si===stops.length-1))t.dir=si===0?1:-1;else if(L.loop&&si===stops.length-1){t.d=0}}else t.d+=Math.sign(next-t.d)*sp}
function nextStopOf(L,t,s){const seq=L.loop?L.st.concat([L.st[0]]):L.st;const i=seq.indexOf(s.id,L.loop&&t.d>=L.len-1e-6?seq.length-1:0);let j=i+(L.loop?1:t.dir);if(L.loop&&j>=seq.length)j=1;if(j<0||j>=seq.length){j=i-(t.dir)}return seq[j]}
function exchange(L,t,s){const cap=MOD(L).cap*(1+t.cars);const nxt=nextStopOf(L,t,s);
  // drop off: arrived, or need to change here
  const keep=[];for(const p of t.pax){if(s.type===p.to){G.delivered++;s.served++;chEv('deliver',{to:p.to,mode:L.mode});FX(s.x,s.y,TYPES[p.to].col,true)}else if(DIST[p.to]&&DIST[p.to][s.id]<1e9&&!(DIST[p.to][nxt]<DIST[p.to][s.id])){s.pax.push(p)}else keep.push(p)}t.pax=keep;
  // board crates whose route continues on this train
  const stay=[];for(const p of s.pax){const d=DIST[p.to];if(d&&nxt!=null&&d[nxt]<d[s.id]&&t.pax.length<cap){t.pax.push(p)}else stay.push(p)}s.pax=stay}
function weekUp(){G.week++;G.trains++;UPG++;if(MODE==='free'){toast(`Week ${G.week}`);return}const all=[['line','🧭','New line','Another line colour to draw with'],['car','📦','Cargo hold','Add 6 cargo spaces to a ship'],['hub','🔄','Big harbour','A port that holds 3× as much cargo and loads faster'],['train','🚢','Extra ship','Another ship for any line'],...MK.filter(m=>!G.unlocked.includes(m)).map(m=>[m,MODES[m].ic,MODES[m].n+' lines',MODES[m].d])].filter(o=>!(o[0]==='line'&&G.lines>=LCOL.length));
  const opts=[];while(opts.length<2){const o=pick(all);if(!opts.includes(o))opts.push(o)}showWeek(opts)}
function grant(k){if(k==='line'){G.lines=Math.min(LCOL.length,G.lines+1);LINES.length<G.lines&&LINES.push(newLine(LINES.length))}else if(k==='car')G.cars++;else if(k==='bridge')G.bridges+=2;else if(k==='hub')G.hubs++;else if(k==='train')G.trains++;if(MODES[k]&&k!=='train'&&!G.unlocked.includes(k)){G.unlocked.push(k);G.mode=k}chEv('upgrade',{k});syncPanel()}
function showWeek(opts){if(CH.loading||!$('home').hidden||document.body.classList.contains('mDemo')){grant(opts[0][0]);return}G.choosing=true;const box=document.createElement('div');box.className='weekbox';box.innerHTML=`<div class="weekcard panel"><span class="k">Week ${G.week}</span><h2>A new ship arrives 🚢</h2><p class="hfoot">Pick one more upgrade:</p><div class="wopts"></div></div>`;
  for(const [k,ic,n,d] of opts){const b=document.createElement('button');b.className='wopt';b.innerHTML=`<span class="ic">${ic}</span><b>${n}</b><span>${d}</span>`;b.onclick=()=>{grant(k);box.remove();G.choosing=false;toast(`${ic} ${n}`)};box.querySelector('.wopts').appendChild(b)}document.body.appendChild(box)}
let ACTX=null;function beep(f,d,v){try{ACTX=ACTX||new (window.AudioContext||window.webkitAudioContext)();const o=ACTX.createOscillator(),g=ACTX.createGain();o.type='square';o.frequency.value=f;g.gain.value=v||0.05;o.connect(g);g.connect(ACTX.destination);const t=ACTX.currentTime;g.gain.setValueAtTime(v||0.05,t);g.gain.exponentialRampToValueAtTime(0.0001,t+d);o.start(t);o.stop(t+d)}catch(e){}}
function alarm(s){ALARMS++;chEv('alarm',{});if(CH.loading||!$('home').hidden||document.body.classList.contains('mDemo'))return;beep(880,0.18,0.04);setTimeout(()=>beep(660,0.22,0.04),200);toast(`🚨 The ${TYPES[s.type].n.toLowerCase()} port is overflowing! ${Math.round(s.over*100)}%`)}
let ALARMS=0;
function gameOver(s){G.over=true;chEv('gameover',{});if(CH.loading)return;const box=document.createElement('div');box.className='weekbox';box.innerHTML=`<div class="weekcard panel"><span class="k">Week ${G.week}</span><h2>The shipping company went bust 😩</h2><p class="hfoot">The ${TYPES[s.type].n.toLowerCase()} port was crowded for too long. You delivered <b>${fmtN(G.delivered)}</b> crates.</p><div class="actions" style="justify-content:center"><button class="btn primary" id="goRelax">Keep playing (relaxed)</button><button class="btn" id="goAgain">Start again</button></div></div>`;document.body.appendChild(box);
  box.querySelector('#goRelax').onclick=()=>{G.over=false;G.relaxed=true;for(const q of ST)q.over=0;box.remove();syncPanel()};box.querySelector('#goAgain').onclick=()=>{box.remove();loadScen(S.scen)};flyToW(s.x,s.y,Math.max(cam.z,10))}
/* ---------- cities ---------- */
function clearCity(){SEAG=null;SPC=new Map();ST=[];LINES=[];WATER=[];PARTS=[];HIST=[];NEXT={};Object.assign(G,{mode:'train',unlocked:['train','bus','tram','metro'],relaxed:false,lines:3,trains:3,cars:0,bridges:2,hubs:0,week:1,delivered:0,over:false,spawnT:0,weekT:0,choosing:false,rush:false,match:false,boom:false,storm:false});for(let k=0;k<G.lines;k++)LINES.push(newLine(k));CUR=0;document.querySelectorAll('.weekbox').forEach(b=>b.remove())}
const SCENS={
  archipelago:()=>{RS=11;WATER.push(isle(20,20,12,9,1),isle(60,14,10,7,2),isle(99,22,13,10,3),isle(28,60,14,11,4),isle(72,56,12,11,5),isle(106,64,8,7,6))},
  twins:()=>{RS=23;WATER.push(isle(32,40,24,30,1.3),isle(92,40,22,28,2.7))},
  lagoon:()=>{RS=37;WATER.push(isle(60,40,52,34,0.5),isle(60,40,32,19,2.2),isle(60,40,8,6,4))},
  coast:()=>{RS=41;WATER.push([[-5,-5],[38,-5],[44,14],[36,30],[46,48],[38,66],[44,85],[-5,85]],isle(78,26,10,8,2),isle(96,58,12,9,3))},
  strait:()=>{RS=53;WATER.push([[-5,-5],[125,-5],[125,28],[90,34],[60,30],[30,36],[-5,30]],[[-5,85],[125,85],[125,50],[92,46],[62,52],[28,46],[-5,50]])},
};
const SCENLIST=[{id:'archipelago',name:'Archipelago',desc:'Six islands scattered over a calm sea.'},{id:'twins',name:'Twin Isles',desc:'Two big islands and a channel between them.'},{id:'lagoon',name:'Lagoon',desc:'A ring of land round a lagoon, with an island in the middle.'},{id:'coast',name:'Coastline',desc:'A mainland coast and two islands offshore.'},{id:'strait',name:'The Strait',desc:'Two coasts and a narrow strait between them.'}];
/* ---------- UI ---------- */
function FX(x,y,col,small){PARTS.push({x,y,col,age:0,small:!!small})}
function syncPanel(){const inv=$('inv');if(!inv)return;const used=bridgesUsed();inv.innerHTML=`<div>🧭 Lines <b>${LINES.filter(lineActive).length} / ${G.lines}</b></div><div>🚢 Spare ships <b>${G.trains}</b></div><div>📦 Spare cargo holds <b>${G.cars}</b></div><div>🔄 Big harbours <b>${G.hubs}</b></div><div>⭐ Delivered <b>${fmtN(G.delivered)}</b></div>`;
  const LL=$('lineList');const lsig=[CUR,G.trains,G.cars,G.unlocked.join(),...LINES.map(L=>[L.mode,L.st.length,L.loop,L.trains.length,L.trains.reduce((s,t)=>s+t.cars,0)].join(','))].join('|');if(LL.dataset.sig!==lsig){LL.dataset.sig=lsig;LL.textContent='';LINES.forEach((L,k)=>{const r=document.createElement('div');r.className='lrow';r.style.borderColor=k===CUR?L.col:'';r.innerHTML=`<i style="background:${L.col}"></i><div><div>${L.st.length?`${MOD(L).ic} ${L.st.length} ports${L.loop?' · loop':''} · ${L.trains.length} ${plur(L.mode||'train',L.trains.length)}`:'Not built yet'}</div><div class="lbtns"></div></div><button class="btn"${k===CUR?' aria-pressed="true"':''}>${k===CUR?'Drawing':'Draw'}</button>`;
    r.children[2].onclick=()=>{CUR=k;setTool('draw');syncPanel()};const bt=r.children[1].children[1];if(L.st.length>=2)for(const m of MK){const vb=document.createElement('button');vb.className='btn';vb.style.padding='4px 7px';vb.textContent=MODES[m].ic;vb.title=MODES[m].n;vb.setAttribute('aria-pressed',(L.mode||'train')===m);vb.onclick=()=>{CUR=k;setVeh(m);LL.dataset.sig='';syncPanel()};bt.appendChild(vb)}if(L.st.length>=2){for(const [lab,fn] of [[`+ ${MOD(L).n}`,()=>{addTrain(L)}],['+ Cargo hold',()=>{const t=L.trains.find(t=>t.cars<3);if(!G.cars){toast('No spare cargo holds');return}if(!t){toast('Add a ship first');return}t.cars++;G.cars--;CARADD++;chEv('car',{})}],[`− ${MOD(L).n}`,()=>{if(L.trains.length>1){const t=L.trains.pop();G.trains++;G.cars+=t.cars;for(const p of t.pax)ST[L.st[0]].pax.push(p)}}],['Remove line',()=>removeLine(L)]]){const b=document.createElement('button');b.className='btn';b.textContent=lab;b.onclick=()=>{fn();syncPanel()};bt.appendChild(b)}}LL.appendChild(r)})}
  $('relaxBtn').setAttribute('aria-pressed',G.relaxed);$('relaxBtn').textContent=G.relaxed?'On':'Off';
  const lab={rush:'📦 Trade boom',match:'🏝 Holiday season',boom:'⚓ New ports',storm:'⛈ Storm'};document.querySelectorAll('[data-ev]').forEach(b=>{const L=lab[b.dataset.ev];if(!L)return;b.setAttribute('aria-pressed',G[b.dataset.ev]);b.textContent=G[b.dataset.ev]?'■ Stop '+L.slice(2).toLowerCase():L})}
$('relaxBtn').onclick=()=>{G.relaxed=!G.relaxed;chEv('relax',{});syncPanel()};
document.querySelectorAll('[data-ev]').forEach(b=>b.onclick=()=>{const ev=b.dataset.ev;EVN++;chEv('event',{ev});if(ev==='normal'){if(G.rush||G.match||G.boom||G.storm)EVSTOP++;G.rush=G.match=G.boom=G.storm=false;toast('All events stopped')}else{G[ev]=!G[ev];if(!G[ev]){EVSTOP++;chEv('stop',{ev})}else toast({rush:'📦 Trade boom: twice as much cargo',match:'🏝 Holiday season: everyone is heading for the resort',boom:'⚓ New ports open fast',storm:'⛈ Storm: ships slow down'}[ev])}syncPanel()});
/* ---------- drawing ---------- */
function drawVeh(c,L,len,wd,day){const md=L.mode||'train';c.fillStyle=day?'#f4efe4':'#e8eef8';if(!day){c.shadowColor=L.col;c.shadowBlur=10}c.strokeStyle=L.col;c.lineWidth=2;
  if(md==='metro'){rr2(c,-len/2,-wd*0.55,len,wd*1.1,wd*0.55);c.fillStyle='rgba(30,30,40,.85)';c.fill();c.shadowBlur=0;c.stroke();c.fillStyle=day?'#f4efe4':'#e8eef8';rr2(c,-len*0.35,-wd*0.35,len*0.7,wd*0.7,wd*0.3);c.fill();c.fillStyle=L.col;c.beginPath();c.arc(-len*0.25,0,wd*0.18,0,7);c.fill();return}
  const w=md==='bus'?wd*0.7:wd;c.beginPath();c.moveTo(len*0.62,0);c.quadraticCurveTo(len*0.32,-w*0.72,-len/2,-w*0.55);c.lineTo(-len/2,w*0.55);c.quadraticCurveTo(len*0.32,w*0.72,len*0.62,0);c.closePath();c.fill();c.shadowBlur=0;c.stroke();
  c.fillStyle=L.col;if(md==='tram'){for(let k=0;k<4;k++)c.fillRect(-len*0.42+k*len*0.2,-w*0.32,len*0.16,w*0.64)}else if(md==='bus'){c.beginPath();c.moveTo(len*0.1,-w*0.25);c.lineTo(len*0.3,0);c.lineTo(len*0.1,w*0.25);c.closePath();c.fill()}else{rr2(c,-len*0.4,-w*0.3,len*0.3,w*0.6,w*0.1);c.fill();rr2(c,-len*0.05,-w*0.3,len*0.3,w*0.6,w*0.1);c.fill()}
  // a wake behind every boat
  c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=1.2;c.beginPath();c.moveTo(-len/2,-w*0.4);c.lineTo(-len*0.95,-w*0.9);c.moveTo(-len/2,w*0.4);c.lineTo(-len*0.95,w*0.9);c.stroke()}
function setVeh(m){if(!G.unlocked.includes(m)){toast(`${MODES[m].ic} ${MODES[m].n} lines are locked: pick them as a weekly upgrade`);return}G.mode=m;const L=LINES[CUR];
  if(L&&L.st.length>=2&&L.mode!==m){const old=L.mode;L.mode=m;if(needB(L)&&bridgesUsed()>G.bridges){L.mode=old;toast('🌉 Not enough bridges for that line to switch');return}MODEADD++;chEv('mode',{m});toast(`Line ${L.id+1} now runs ${plur(m,2)} ${MODES[m].ic}`);routes()}syncPanel()}
// stations and passengers use a coloured shape per kind of place, not emoji
function glyph(c,t,x,y,sz){const m=c.font.match(/([\d.]+)px/),s=(sz||(m?+m[1]:12))*0.42,k=TK.indexOf(t),col=TYPES[t]?TYPES[t].col:'#fff';c.save();c.fillStyle=col;c.beginPath();
  switch(k%7){case 0:c.arc(x,y,s,0,7);break;case 1:c.rect(x-s*0.88,y-s*0.88,s*1.76,s*1.76);break;case 2:c.moveTo(x,y-s*1.1);c.lineTo(x+s*1.05,y+s*0.8);c.lineTo(x-s*1.05,y+s*0.8);c.closePath();break;
    case 3:c.moveTo(x,y-s*1.2);c.lineTo(x+s,y);c.lineTo(x,y+s*1.2);c.lineTo(x-s,y);c.closePath();break;case 4:{const w=s*0.4;c.rect(x-w,y-s,w*2,s*2);c.rect(x-s,y-w,s*2,w*2);break}
    case 5:for(let i=0;i<10;i++){const r=i%2?s*0.5:s*1.15,a=-Math.PI/2+i*Math.PI/5;i?c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r):c.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}c.closePath();break;
    default:for(let i=0;i<6;i++){const a=i*Math.PI/3;i?c.lineTo(x+Math.cos(a)*s,y+Math.sin(a)*s):c.moveTo(x+Math.cos(a)*s,y+Math.sin(a)*s)}c.closePath()}c.fill();c.restore()}
function rr2(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function render(c,now){const day=S.view==='day',z=cam.z;c.fillStyle=day?'#7fb3cf':'#020a14';c.fillRect(0,0,W,H);
  c.fillStyle=day?'#a9d6ec':'#08223e';c.fillRect(sx(0),sy(0),WW*z,WH*z);
  // faint street grid
  c.strokeStyle=day?'rgba(0,0,0,.05)':'rgba(140,150,220,.06)';c.lineWidth=1;c.beginPath();for(let x=0;x<=WW;x+=4){c.moveTo(sx(x),sy(0));c.lineTo(sx(x),sy(WH))}for(let y=0;y<=WH;y+=4){c.moveTo(sx(0),sy(y));c.lineTo(sx(WW),sy(y))}c.stroke();
  c.save();c.beginPath();c.rect(sx(0),sy(0),WW*z,WH*z);c.clip();c.beginPath();for(const P of WATER){P.forEach(([x,y],i)=>i?c.lineTo(sx(x),sy(y)):c.moveTo(sx(x),sy(y)));c.closePath()}c.strokeStyle=day?'rgba(220,245,255,.7)':'rgba(70,150,230,.22)';c.lineWidth=z*2.2;c.stroke();c.fillStyle=day?'#e6dcb8':'#18222e';c.fill('evenodd');c.strokeStyle=day?'#c8b47e':'rgba(150,190,230,.4)';c.lineWidth=2;c.stroke();c.restore();
  // lines
  const lw=Math.max(4,z*0.9);c.lineCap='round';c.lineJoin='round';
  LINES.forEach((L,k)=>{if(L.pts.length<2)return;const off=0;c.strokeStyle=L.col;if(!day){c.shadowColor=L.col;c.shadowBlur=lw*1.6}const md=L.mode||'train',pth=()=>{c.beginPath();L.pts.forEach(([x,y],i)=>i?c.lineTo(sx(x),sy(y)):c.moveTo(sx(x),sy(y)))};c.lineWidth=md==='tram'?lw*1.1:md==='bus'?lw*0.6:lw*0.8;c.setLineDash(md==='metro'?[lw*0.2,lw*0.9]:[lw*1.6,lw*0.7]);pth();c.stroke();c.setLineDash([]);c.shadowBlur=0;
    // bridges
    const seq=L.loop?L.st.concat([L.st[0]]):L.st;if(needB(L))for(let i=1;i<L.pts.length;i++){const a=L.pts[i-1],b=L.pts[i];const st=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*2);for(let q=0;q<=st;q++){const x=a[0]+(b[0]-a[0])*q/st,y=a[1]+(b[1]-a[1])*q/st;if(isWater(x,y)){c.fillStyle=day?'#555':'#d8d8e8';c.fillRect(sx(x)-lw*0.7,sy(y)-lw*0.7,lw*1.4,lw*1.4)}}}
    if(!L.loop&&L.st.length){for(const e of [0,L.st.length-1]){const s=ST[L.st[e]],o=ST[L.st[e?e-1:1]];if(!o)continue;const dx=s.x-o.x,dy=s.y-o.y,l=Math.hypot(dx,dy)||1;c.strokeStyle=L.col;c.lineWidth=lw;c.beginPath();c.moveTo(sx(s.x),sy(s.y));c.lineTo(sx(s.x+dx/l*2.2),sy(s.y+dy/l*2.2));c.moveTo(sx(s.x+dx/l*2.2-dy/l*1),sy(s.y+dy/l*2.2+dx/l*1));c.lineTo(sx(s.x+dx/l*2.2+dy/l*1),sy(s.y+dy/l*2.2-dx/l*1));c.stroke()}}});
  // drag preview
  if(DRAG&&DRAG.from){const L=LINES[CUR];c.strokeStyle=L?L.col:'#fff';c.globalAlpha=0.6;c.lineWidth=lw;c.setLineDash([lw,lw]);c.beginPath();c.moveTo(sx(DRAG.from.x),sy(DRAG.from.y));c.lineTo(sx(DRAG.x),sy(DRAG.y));c.stroke();c.setLineDash([]);c.globalAlpha=1}
  // trains
  for(const L of LINES)for(const t of L.trains){if(!lineActive(L))continue;const [x,y,a0]=posAt(L,t.d),a=a0+(t.dir<0&&!L.loop?Math.PI:0),X=sx(x),Y=sy(y),len=Math.max(14,z*2.6)*(1+t.cars*0.5)*MOD(L).len,wd=Math.max(8,z*1.3);c.save();c.translate(X,Y);c.rotate(a);drawVeh(c,L,len,wd,day);
    c.restore();const cap=MOD(L).cap*(1+t.cars);if(t.pax.length){const isz=Math.max(9,Math.min(16,z*1.3)),per=Math.ceil(cap/2),bw=Math.min(t.pax.length,per)*isz+6,bh=(t.pax.length>per?2:1)*isz+4,bx=X-bw/2,by=Y-wd-bh-2;c.fillStyle=day?'rgba(255,255,255,.92)':'rgba(16,16,36,.88)';c.strokeStyle=L.col;c.lineWidth=1.5;rr2(c,bx,by,bw,bh,4);c.fill();c.stroke();c.font=`${Math.round(isz*0.82)}px sans-serif`;c.textAlign='center';c.textBaseline='middle';t.pax.forEach((p,i)=>{glyph(c,p.to,bx+3+isz*(i%per)+isz/2,by+2+isz*Math.floor(i/per)+isz/2+1)});c.textBaseline='alphabetic'}}
  // ports
  const R0=Math.max(9,z*1.7);for(const s of ST){const X=sx(s.x),Y=sy(s.y),T=TYPES[s.type],crowd=s.pax.length/s.cap;
    if(s.over>0){if(s.over>0.3){const pu=0.5+0.5*Math.sin(now*0.012);c.fillStyle=`rgba(255,40,40,${0.12+0.25*pu*s.over})`;c.beginPath();c.arc(X,Y,R0*(1.9+pu*0.6),0,7);c.fill()}c.strokeStyle=`rgba(255,${120-100*s.over},80,.95)`;c.lineWidth=4;c.beginPath();c.arc(X,Y,R0*1.5,-Math.PI/2,-Math.PI/2+Math.PI*2*s.over);c.stroke()}
    if(S.view==='crowd'){c.fillStyle=`rgba(255,${200-180*Math.min(1,crowd)},80,.35)`;c.beginPath();c.arc(X,Y,R0*(1.2+crowd),0,7);c.fill()}
    c.fillStyle=day?'#fff':'#141632';c.strokeStyle=T.col;c.lineWidth=s.hub?5:3;if(!day){c.shadowColor=T.col;c.shadowBlur=12}rr2(c,X-R0,Y-R0,R0*2,R0*2,s.hub?R0:R0*0.45);c.fill();c.stroke();c.shadowBlur=0;
    c.font=`${Math.round(R0*1.15)}px sans-serif`;c.textAlign='center';c.textBaseline='middle';glyph(c,s.type,X,Y+1,R0*1.5);c.textBaseline='alphabetic';
    // waiting crates
    const ps=Math.max(9,R0*0.75);c.font=`${Math.round(ps*0.85)}px sans-serif`;c.textAlign='center';c.textBaseline='middle';s.pax.slice(0,24).forEach((p,i)=>{const col=i%6,row=Math.floor(i/6);glyph(c,p.to,X+R0*1.25+ps/2+col*ps,Y-R0*0.7+row*ps+ps/2)});c.textBaseline='alphabetic';if(s.pax.length>24){c.fillStyle=day?'#000':'#fff';c.font='600 11px "IBM Plex Mono",monospace';c.textAlign='left';c.fillText('+'+(s.pax.length-24),X+R0*1.3,Y+R0*1.6)}
    if(S.sel&&S.sel.s===s){c.strokeStyle='#ffc35a';c.lineWidth=2;c.beginPath();c.arc(X,Y,R0*1.9,0,7);c.stroke()}}
  for(const p of PARTS){const al=1-p.age;c.strokeStyle=p.col;c.globalAlpha=Math.max(0,al);c.lineWidth=2;c.beginPath();c.arc(sx(p.x),sy(p.y),(p.small?R0*1.2:R0*1.4)+p.age*R0*(p.small?1:3),0,7);c.stroke()}c.globalAlpha=1;
  if(G.choosing||G.over){}}
/* ---------- tools ---------- */
const nearStation=(x,y,r)=>{let b=null,bd=r*r;for(const s of ST){const d=(s.x-x)**2+(s.y-y)**2;if(d<bd){bd=d;b=s}}return b};
function nearLine(x,y){let best=null,bd=9;for(const L of LINES){for(let i=1;i<L.pts.length;i++){const [ax,ay]=L.pts[i-1],[bx,by]=L.pts[i],dx=bx-ax,dy=by-ay,t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1),d=(ax+dx*t-x)**2+(ay+dy*t-y)**2;if(d<bd){bd=d;best=L}}}return best}
const SIM={id:'seaway',name:'Seaway',defTool:'draw',world:{w:WW,h:WH,wrapX:false,maxZ:30,followZ:12},home:'archipelago',freeScen:'archipelago',tutScen:'coast',defSpeed:1,homeSpeed:1,inspectTab:'insp',
  speeds:[['½×',0.5],['1×',1],['2×',2],['4×',4]],fmtRate:v=>`${v}× speed`,
  dateTxt:()=>`Week ${G.week}`,dateSub:()=>`${fmtN(G.delivered)} crates delivered`,stepSize:()=>0.05,
  tools:[['',[['select','👆','Inspect']]],['Build',[['draw','✏️','Draw route','Drag from a port to another port. Drag from the end of a line to make it longer, or back to its first port to make a loop.'],['train','🚢','Add ship','Click a line to put another vehicle on it (the same kind of boat the line uses).'],['car','📦','Cargo hold','Click a line to add a cargo hold to one of its ships (6 more spaces).'],['hub','🔄','Big harbour','Click a port to make it an big harbour: room for 18 people and faster boarding.'],['erase','✂️','Shorten','Click near the end of a line to remove its last stop.']]]],
  scens:SCENLIST,
  load(id){clearCity();(SCENS[id]||SCENS.archipelago)();for(let k=0;k<3;k++)addStation(['town','fish','farm'][k]);this.t0=0;HIST=[];if(MODE==='free'&&$('home').hidden){G.lines=LCOL.length;while(LINES.length<G.lines)LINES.push(newLine(LINES.length));G.trains=G.cars=G.bridges=G.hubs=999;G.relaxed=true;G.unlocked=[...MK]}syncPanel()},
  after(){if(!$('home').hidden)return;setTool('draw')},
  step(dt){if(G.over||G.choosing)return;G.spawnT+=dt;G.weekT+=dt;const every=Math.max(4,13-G.week*0.6)*(G.boom?0.35:1);if(G.spawnT>=every&&ST.length<48){G.spawnT=0;addStation()}
    for(const s of ST){spawnPax(s,dt);for(const p of s.pax)p.age+=dt;const cap=s.hub?18:6;s.cap=cap;if(s.pax.length>cap)s.over+=dt/(G.relaxed?1e9:40);else s.over=Math.max(0,s.over-dt/20);if(!G.relaxed&&s.over>0.3){s.alT=(s.alT||0)-dt;if(s.alT<=0){s.alT=s.over>0.7?2.5:5;alarm(s)}}else s.alT=0;if(s.over>=1&&!G.relaxed&&!G.over){gameOver(s);return}}
    for(const L of LINES)for(const t of L.trains)trainStep(L,t,dt);
    if(G.weekT>=WEEK){G.weekT=0;weekUp()}},
  frame(dt){for(const p of PARTS)p.age+=dt*1.4;PARTS=PARTS.filter(p=>p.age<1)},
  render,
  stats:()=>[['Delivered',fmtN(G.delivered)],['Ports',ST.length],['Ships',LINES.reduce((s,L)=>s+L.trains.length,0)],['Week',G.week]],
  hud(){const last=HIST[HIST.length-1];if(!last||S.t-last.t>=2)HIST.push({t:S.t,d:G.delivered});if(HIST.length>300)HIST.shift();syncPanel();renderStats();renderInspect()},
  pick(wx,wy){const s=nearStation(wx,wy,2.5);if(s)return{s};const L=nearLine(wx,wy);if(L)return{L};return null},
  pointer(type,wx,wy){const t=S.tool;HOVER=[wx,wy];
    if(t==='draw'){if(type==='down'){const s=nearStation(wx,wy,3);if(s){DRAG={from:s,x:wx,y:wy}}else{const L=nearLine(wx,wy);if(L){CUR=L.id;syncPanel();DRAG={mid:L,x:wx,y:wy,gap:gapAt(L,wx,wy)}}else DRAG=null}}else if(type==='drag'&&DRAG&&DRAG.mid){DRAG.x=wx;DRAG.y=wy;const s=nearStation(wx,wy,2.6);if(s&&!DRAG.mid.st.includes(s.id)){if(insertStation(DRAG.mid,DRAG.gap,s)){DRAG.gap++;syncPanel()}}}else if(type==='drag'&&DRAG){DRAG.x=wx;DRAG.y=wy;const s=nearStation(wx,wy,2.6);if(s&&s!==DRAG.from){if(linkStations(DRAG.from,s)){DRAG.from=s;syncPanel()}else DRAG=null}}else if(type==='up')DRAG=null;return}
    if(type!=='down')return;
    if(t==='train'){const L=nearLine(wx,wy);if(L){addTrain(L);syncPanel()}else toast('Click on a line');return}
    if(t==='car'){const L=nearLine(wx,wy);if(!L){toast('Click on a line');return}if(!G.cars){toast('No spare cargo holds');return}const tr=L.trains.find(q=>q.cars<3);if(!tr){toast('Add a ship to this line first');return}tr.cars++;G.cars--;CARADD++;chEv('car',{});syncPanel();return}
    if(t==='hub'){const s=nearStation(wx,wy,3);if(!s){toast('Click a port');return}if(s.hub){toast('Already an big harbour');return}if(!G.hubs){toast('No big harbours left: pick one as a weekly upgrade');return}s.hub=true;G.hubs--;HUBADD++;chEv('hub',{});toast('🔄 Big harbour built');syncPanel();return}
    if(t==='erase'){const L=nearLine(wx,wy);if(!L){toast('Click near a line end');return}const a=ST[L.st[0]],b=ST[L.st[L.st.length-1]];trimLine(L,Math.hypot(b.x-wx,b.y-wy)<Math.hypot(a.x-wx,a.y-wy)?1:-1);syncPanel()}},
  hover(wx,wy){HOVER=[wx,wy]},
  find(q){const out=[],add=(label,sub,go)=>out.push({label,sub,go});for(const t of TK)if(TYPES[t].n.toLowerCase().includes(q)||t.includes(q)){const s=ST.find(x=>x.type===t);if(s)add(`${TYPES[t].ic} ${TYPES[t].n} port`,`${s.pax.length} waiting`,()=>{S.sel={s};flyToW(s.x,s.y,10);showTab('insp')})}
    if('busiest crowded'.includes(q))add('Most crowded port','',()=>{const s=[...ST].sort((a,b)=>b.pax.length-a.pax.length)[0];if(s){S.sel={s};flyToW(s.x,s.y,10);showTab('insp')}});
    for(const [,items] of SIM.tools)for(const [id,ico,name] of items)if(id!=='select'&&name.toLowerCase().includes(q))add(`${ico} ${name}`,'tool',()=>setTool(id));
    for(const s of SCENLIST)if(s.name.toLowerCase().includes(q))add('City: '+s.name,s.desc,()=>{loadScen(s.id);toast(s.name)});return out},
  tabShown(id){if(id==='stats')renderStats(true)},selChanged(){renderInspect()},
};
function kv(rows){return rows.map(([k,v])=>`<div><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}
function renderStats(force){if($('pane-stats').hidden&&!force)return;const wait=ST.reduce((s,x)=>s+x.pax.length,0),riding=LINES.reduce((s,L)=>s+L.trains.reduce((a,t)=>a+t.pax.length,0),0);
  $('cStats').innerHTML=kv([['Delivered',fmtN(G.delivered)],['Week',G.week],['Ports',ST.length],['Waiting now',wait],['On ships now',riding],['Ships at sea',LINES.reduce((s,L)=>s+L.trains.length,0)]]);
  const g=$('graph'),gc=g.getContext('2d'),w=g.width=g.clientWidth*DPR,hh=g.height=g.clientHeight*DPR;gc.clearRect(0,0,w,hh);if(HIST.length>1){const t0=HIST[0].t,t1=HIST[HIST.length-1].t,m=Math.max(1,HIST[HIST.length-1].d);gc.strokeStyle='#ff5ab4';gc.lineWidth=2*DPR;gc.beginPath();HIST.forEach((p,i)=>{const x=8+(w-16)*(p.t-t0)/Math.max(1e-6,t1-t0),y=hh-6-(hh-12)*p.d/m;i?gc.lineTo(x,y):gc.moveTo(x,y)});gc.stroke()}
  const L=$('sList');L.textContent='';for(const s of [...ST].sort((a,b)=>b.pax.length-a.pax.length).slice(0,8)){const r=document.createElement('button');r.className='sprow';r.innerHTML='<i></i><span></span><b></b>';r.children[0].style.background=TYPES[s.type].col;r.children[1].textContent=`${TYPES[s.type].ic} ${TYPES[s.type].n}${s.hub?' · big harbour':''}`;r.children[2].textContent=`${s.pax.length}/${s.cap}`;r.onclick=()=>{S.sel={s};flyToW(s.x,s.y,10);showTab('insp')};L.appendChild(r)}}
function renderInspect(){const b=S.sel;$('inspEmpty').hidden=!!b;$('inspBody').hidden=!b;if(!b)return;const body=$('inspBody');
  if(b.s){const s=b.s,T=TYPES[s.type],lines=LINES.filter(L=>L.st.includes(s.id));const want={};for(const p of s.pax)want[p.to]=(want[p.to]||0)+1;
    body.innerHTML=`<h2 class="ititle">${T.ic} ${T.n}</h2><div class="isub">${s.hub?'Big harbour · ':''}${lines.length?`on ${lines.length} line${lines.length>1?'s':''}`:'not connected yet'}</div><div class="kv">${kv([['Waiting',`${s.pax.length} of ${s.cap}`],['Crowding',s.over>0?Math.round(s.over*100)+'% to giving up':'fine'],['Crates arrived here',s.served],['Open since',`week ${Math.floor((s.born||0)/WEEK)+1}`]])}</div><p class="note">${Object.keys(want).length?'Heading for: '+Object.entries(want).map(([t,n])=>`${n} to ${TYPES[t].n.toLowerCase()} (${shapeOf(t)})`).join(', '):'Nobody waiting.'}</p>`;return}
  if(b.L){const L=b.L;body.innerHTML=`<h2 class="ititle" style="color:${L.col}">Line ${L.id+1}</h2><div class="isub">${MOD(L).ic} ${MOD(L).n} line · ${L.st.length} ports${L.loop?' · loop':''}</div><div class="kv">${kv([['Vehicle',MOD(L).n+' (seats '+MOD(L).cap+')'],['Vehicles',L.trains.length],['Carriages',L.trains.reduce((s,t)=>s+t.cars,0)],['On board',L.trains.reduce((s,t)=>s+t.pax.length,0)],['Length',Math.round(L.len)+' blocks']])}</div>`}}

// home page: Classic mode button; Free play means anything goes
{const f=$('hFree');const b=document.createElement('button');b.className='hb';b.id='hClassic';b.innerHTML='<span class="ht">Classic</span><span class="hd">Limited lines, ships and upgrades. Alarms sound when a port overflows, and if one stays full too long, the game is over.</span>';f.before(b);
  f.querySelector('.hd').textContent='Anything goes: every line colour, every boat, unlimited ships, cargo holds and big harbours, and no game over';
  b.onclick=()=>{MODE='classic';leaveHome();loadScen('archipelago');setSpeed(SIM.defSpeed);countPlay();toast('Classic mode: keep every port from overflowing!')};
  document.addEventListener('pointerdown',e=>{if(e.target.closest('#hFree'))MODE='free';else if(e.target.closest('#home,#chDone,#hClassic'))MODE='classic'},true)}

{const bar=document.createElement('div');bar.id='lineBar';bar.className='panel';bar.style.cssText='display:flex;gap:6px;padding:8px 10px;align-items:center;flex-wrap:wrap';const hud=document.querySelector('.hud-top .time');hud.after(bar);
  const css=document.createElement('style');css.textContent='body.mHome #lineBar,body.mDemo #lineBar{display:none!important}#lineBar button{width:30px;height:30px;border-radius:50%;border:3px solid transparent;cursor:pointer}#lineBar button[aria-pressed="true"]{border-color:#fff;transform:scale(1.15)}#lineBar button:disabled{opacity:.25;cursor:default}@media (max-width:760px){#lineBar{flex:1 1 100%;justify-content:center}}#lineBar button:not(.pz){width:26px!important;height:26px!important}#lineBar .pz{white-space:nowrap}#lineBar .vm{padding:0 6px;font-size:16px}#lineBar .vm[aria-pressed="true"]{border-color:#fff;background:rgba(255,255,255,.18)}#placeopts,#hint{display:none!important}#lineBar .pz{width:auto;height:30px;border-radius:8px;padding:0 10px;border:1px solid rgba(255,195,90,.6);background:rgba(255,195,90,.12);color:#fff;font-size:13px}';document.head.appendChild(css);
  const draw=()=>{sig=typeof sigOf==='function'?sigOf():'';bar.innerHTML='';const pz=document.createElement('button');pz.className='pz';pz.textContent=S.paused?'▶ Play':'⏸ Pause';pz.onclick=()=>{setPaused(!S.paused);draw()};bar.appendChild(pz);const lb=document.createElement('span');lb.className='k';lb.style.margin='0 2px 0 6px';lb.textContent='Line';{const vl=document.createElement('span');vl.className='k';vl.style.margin='0 2px 0 8px';vl.textContent='Boat';bar.appendChild(vl)}for(const m of MK){const b=document.createElement('button');b.className='pz vm';b.textContent=MODES[m].ic;b.title=`${MODES[m].n}: ${MODES[m].d}`+(G.unlocked.includes(m)?'':' (locked: pick it as a weekly upgrade)');b.setAttribute('aria-pressed',G.mode===m);b.style.opacity=G.unlocked.includes(m)?1:0.35;b.onclick=()=>{setVeh(m);draw()};bar.appendChild(b)}bar.appendChild(lb);
  LCOL.forEach((col,k)=>{const b=document.createElement('button');b.style.background=col;const L=LINES[k];b.disabled=!L;b.title=L?(L.st.length?`Line ${k+1}: ${L.st.length} ports`:`Line ${k+1}: not built yet`):'Not unlocked yet';b.setAttribute('aria-pressed',k===CUR);b.onclick=()=>{CUR=k;setTool('draw');syncPanel();draw()};bar.appendChild(b)})};
  const sigOf=()=>[S.paused,G.mode,CUR,LINES.length,G.unlocked.join(),LINES.map(L=>L.st.length).join()].join('|');let sig='';setInterval(()=>{if(sigOf()!==sig)draw()},300);draw()}

// a key: which shape is which kind of place
{const SYM={circle:'●',square:'■',triangle:'▲',diamond:'◆',cross:'✚',star:'★',hexagon:'⬢'};const k=document.createElement('div');k.id='shapeKey';k.style.cssText='display:flex;flex-wrap:wrap;gap:6px 12px;font-size:13px';
  const draw=()=>{const present=new Set(ST.map(s=>s.type));k.innerHTML=TK.filter(t=>present.has(t)).map(t=>`<span><b style="color:${TYPES[t].col};font-size:15px">${SYM[shapeOf(t)]}</b> ${TYPES[t].n}</span>`).join('')};
  const pane=document.getElementById('pane-world');const lab=document.createElement('span');lab.className='k';lab.textContent='Shapes';pane.prepend(k);pane.prepend(lab);setInterval(draw,1000);draw()}
