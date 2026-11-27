/* ================= Gridlock: a road-building traffic puzzle ================= */
// The town is a 48 x 32 grid of blocks. A week lasts 45 seconds of game time.
const WW=48,WH=32,WEEK=45,N=WW*WH;
const COLS=[{n:'Red',c:'#ff5d5d'},{n:'Blue',c:'#4ea6ff'},{n:'Yellow',c:'#ffc23a'},{n:'Green',c:'#38c98a'},{n:'Purple',c:'#b27cff'},{n:'Orange',c:'#ff8a3d'}];
let TER=new Uint8Array(N),ROAD=new Uint8Array(N),BLD=new Int16Array(N).fill(-1),DEG=new Uint8Array(N),OCC=new Uint8Array(N);
let BL=[],CARS=[],WP=[],MP=[],MW=[],MWADJ={},RB=new Set(),LT=new Set(),PARTS=[],HIST=[];
const G={roads:40,bridges:0,tunnels:0,rbs:0,lights:0,mways:1,buses:1,week:1,trips:0,over:false,relaxed:false,houseT:0,destT:0,weekT:0,dispT:0,choosing:false,rush:false,snow:false,boom:false,auto:false,colours:1};
let BUSES=[],BUSADD=0,BUSTRIPS=0,MIDSTOPS=0,BUSPEND=null,BPREV={key:''};let MODE='classic',PAINTED=0,ERASED=0,RBADD=0,LTADD=0,MWADD=0,UPG=0,ALARMS=0,EVN=0,DRAG=null,HOVER=null;
let RS=1;function R(){RS|=0;RS=RS+0x6D2B79F5|0;let t=Math.imul(RS^RS>>>15,1|RS);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}
const ix=(x,y)=>y*WW+x,cx=i=>i%WW,cy=i=>(i/WW)|0,inside=(x,y)=>x>=0&&y>=0&&x<WW&&y<WH;
const N4=i=>{const x=cx(i),y=cy(i),o=[];if(x>0)o.push(i-1);if(x<WW-1)o.push(i+1);if(y>0)o.push(i-WW);if(y<WH-1)o.push(i+WW);return o};
/* ---------- terrain: rivers, lakes and hills are smooth shapes, sampled onto the grid ---------- */
function inPoly(x,y,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const [xi,yi]=P[i],[xj,yj]=P[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c}return c}
function river(pts,w){const L=[],Rr=[];for(let i=0;i<pts.length;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,nx=-dy/l*w/2,ny=dx/l*w/2;L.push([pts[i][0]+nx,pts[i][1]+ny]);Rr.unshift([pts[i][0]-nx,pts[i][1]-ny])}return L.concat(Rr)}
function blob(x,y,rx,ry,k){const P=[];for(let a=0;a<24;a++){const t=a/24*Math.PI*2,r=1+0.18*Math.sin(t*3+k)+0.1*Math.sin(t*5+k*2);P.push([x+Math.cos(t)*rx*r,y+Math.sin(t)*ry*r])}return P}
function rasterTer(){for(let i=0;i<N;i++){const x=cx(i)+0.5,y=cy(i)+0.5;TER[i]=WP.some(P=>inPoly(x,y,P))?1:MP.some(P=>inPoly(x,y,P))?2:0}}
/* ---------- roads ---------- */
const isRoad=i=>ROAD[i]>0;
function degOf(i){let d=0;for(const j of N4(i))if(ROAD[j])d++;return d+(MWADJ[i]?MWADJ[i].length:0)}
function reDeg(i){for(const j of [i,...N4(i)])DEG[j]=ROAD[j]?degOf(j):0}
function paint(i){if(i<0||i>=N||ROAD[i]||BLD[i]>=0)return false;const t=TER[i];
  if(t===0){if(G.roads<=0){toast('🛣️ Out of road: you get more every week');return false}G.roads--;ROAD[i]=1}
  else if(t===1){if(G.bridges<=0){toast('🌉 No bridge pieces left: pick some as a weekly upgrade');return false}G.bridges--;ROAD[i]=2}
  else{if(G.tunnels<=0){toast('⛰️ No tunnel pieces left: pick some as a weekly upgrade');return false}G.tunnels--;ROAD[i]=3}
  PAINTED++;chEv('paint',{t:ROAD[i]});reDeg(i);return true}
function unpaint(i){if(!ROAD[i])return false;const t=ROAD[i];if(t===1)G.roads++;else if(t===2)G.bridges++;else G.tunnels++;ROAD[i]=0;
  if(RB.delete(i))G.rbs++;if(LT.delete(i))G.lights++;for(const m of MW.filter(m=>m.a===i||m.b===i))removeMw(m);for(const r of BUSES.filter(r=>r.a===i||r.b===i)){BUSES.splice(BUSES.indexOf(r),1);G.buses++}for(const r of BUSES)if(r.stops.includes(i)){r.stops=r.stops.filter(q=>q!==i);buildRoute(r)}reDeg(i);ERASED++;chEv('erase',{});return true}
function addMw(a,b){if(G.mways<=0){toast('🛫 No motorways left: pick one as a weekly upgrade');return false}if(a===b||MW.some(m=>(m.a===a&&m.b===b)||(m.a===b&&m.b===a)))return false;
  const len=Math.hypot(cx(a)-cx(b),cy(a)-cy(b));if(len<4){toast('A motorway must jump at least 4 blocks');return false}G.mways--;const m={a,b,len};MW.push(m);(MWADJ[a]=MWADJ[a]||[]).push(b);(MWADJ[b]=MWADJ[b]||[]).push(a);reDeg(a);reDeg(b);MWADD++;chEv('motorway',{});toast('🛫 Motorway open');return true}
function removeMw(m){MW.splice(MW.indexOf(m),1);G.mways++;for(const [p,q] of [[m.a,m.b],[m.b,m.a]]){if(MWADJ[p])MWADJ[p]=MWADJ[p].filter(v=>v!==q)}reDeg(m.a);reDeg(m.b)}
function nbrs(i){const o=[];for(const j of N4(i))if(ROAD[j])o.push(j);if(MWADJ[i])for(const j of MWADJ[i])if(ROAD[j])o.push(j);return o}
// cheapest path over the road network; motorways count as quick links
function path(starts,isGoal){const dist=new Float32Array(N).fill(1e9),par=new Int32Array(N).fill(-1),q=[];for(const s of starts)if(ROAD[s]){dist[s]=0;q.push(s)}
  for(let h=0;h<q.length;h++){const u=q[h];if(isGoal(u)){const p=[u];let v=u;while(par[v]>=0){v=par[v];p.push(v)}return p.reverse()}
    for(const v of nbrs(u)){const w=(MWADJ[u]&&MWADJ[u].includes(v))?Math.hypot(cx(u)-cx(v),cy(u)-cy(v))/3:1;if(dist[u]+w<dist[v]-1e-6){dist[v]=dist[u]+w;par[v]=u;q.push(v)}}}return null}
/* ---------- buildings ---------- */
const doorsOf=b=>{const o=[];for(const c of b.cells)for(const j of N4(c))if(BLD[j]<0&&ROAD[j]&&!o.includes(j))o.push(j);return o};
const freeCell=i=>TER[i]===0&&!ROAD[i]&&BLD[i]<0;
function nearRoom(x,y,w,h){for(let yy=y-1;yy<=y+h;yy++)for(let xx=x-1;xx<=x+w;xx++)if(inside(xx,yy)&&BLD[ix(xx,yy)]>=0)return false;return true}
function addBld(kind,c,x,y){const w=kind==='d'?2:1,cells=[];for(let yy=0;yy<w;yy++)for(let xx=0;xx<w;xx++)cells.push(ix(x+xx,y+yy));const b={id:BL.length,kind,c,x,y,w,cells,born:S.t,pins:0,inb:0,over:0,pinT:R()*3,served:0,cars:[]};
  for(const q of cells)BLD[q]=b.id;BL.push(b);if(kind==='h')for(let k=0;k<2;k++){const car={h:b,state:'home',p:null,s:0,d:null,wait:0,x:x+0.5,y:y+0.5,a:0};b.cars.push(car);CARS.push(car)}FX(x+w/2,y+w/2,COLS[c].c);if(G.auto)autoRoad(b);return b}
function addDest(c){if(c==null){const have=new Set(BL.filter(b=>b.kind==='d').map(b=>b.c));c=have.size<G.colours?[...Array(G.colours).keys()].find(k=>!have.has(k)):ri(0,G.colours-1)}
  for(let k=0;k<400;k++){const x=ri(3,WW-5),y=ri(3,WH-5);if(![0,1].every(a=>[0,1].every(b=>freeCell(ix(x+a,y+b)))))continue;if(!nearRoom(x,y,2,2))continue;if(BL.some(b=>b.kind==='d'&&Math.hypot(b.x-x,b.y-y)<7))continue;const d=Math.hypot(x-WW/2,y-WH/2);if(R()<d/(WW*0.6)*(BL.length<6?1.5:0.5))continue;return addBld('d',c,x,y)}return null}
function addHouse(c){const ds=BL.filter(b=>b.kind==='d');if(!ds.length)return null;if(c==null){const d=pick(ds);c=d.c}const near=ds.filter(d=>d.c===c);
  for(let k=0;k<400;k++){let x,y;if(near.length&&R()<0.7){const d=pick(near),r=3+R()*9,a=R()*7;x=Math.round(d.x+Math.cos(a)*r);y=Math.round(d.y+Math.sin(a)*r)}else{x=ri(1,WW-2);y=ri(1,WH-2)}
    if(!inside(x,y)||x<1||y<1||x>WW-2||y>WH-2)continue;const i=ix(x,y);if(!freeCell(i))continue;if(!N4(i).some(j=>TER[j]===0&&BLD[j]<0))continue;if(BL.some(b=>b.cells.some(q=>Math.abs(cx(q)-x)<=1&&Math.abs(cy(q)-y)<=1)))continue;return addBld('h',c,x,y)}return null}
// for the home screen and demo: lay a road from a building to the nearest road
function autoRoad(b){const keep=[G.roads,G.bridges,G.tunnels];G.roads=G.bridges=G.tunnels=1e6;const starts=[];for(const c of b.cells)for(const j of N4(c))if(BLD[j]<0)starts.push(j);
  if(!ROAD.some(v=>v)){if(starts[0]!=null)paint(starts[0]);[G.roads,G.bridges,G.tunnels]=keep;return}
  const par=new Int32Array(N).fill(-2),q=[];for(const s of starts){par[s]=-1;q.push(s)}let hit=-1;for(let h=0;h<q.length&&hit<0;h++){const u=q[h];if(ROAD[u]){hit=u;break}for(const v of N4(u))if(par[v]===-2&&BLD[v]<0){par[v]=u;q.push(v)}}
  for(let v=hit;v>=0;v=par[v])if(!ROAD[v])paint(v);[G.roads,G.bridges,G.tunnels]=keep;PAINTED=0}
/* ---------- cars ---------- */
function dispatch(){for(const d of BL){if(d.kind!=='d'||d.pins<=d.inb)continue;const ds=doorsOf(d);if(!ds.length)continue;
    const p=path(ds,u=>N4(u).some(j=>{const b=BL[BLD[j]];return b&&b.kind==='h'&&b.c===d.c&&b.cars.some(c=>c.state==='home')}));if(!p)continue;
    const end=p[p.length-1],hb=BL[BLD[N4(end).find(j=>{const b=BL[BLD[j]];return b&&b.kind==='h'&&b.c===d.c&&b.cars.some(c=>c.state==='home')})]],car=hb.cars.find(c=>c.state==='home');
    car.state='out';car.p=p.reverse();car.s=0;car.d=d;car.wait=0.2;d.inb++}}
function segLen(p,k){const a=p[k],b=p[k+1];return Math.hypot(cx(a)-cx(b),cy(a)-cy(b))}
function speedAt(i,mw){let f=G.snow?0.6:1;const o=OCC[i];if(o>1)f/=1+0.55*(o-1);if(DEG[i]>=3){f*=RB.has(i)?0.95:LT.has(i)?(o>1?0.8:0.85):(o>1?0.45:0.7)}if(ROAD[i]===3)f*=0.85;return 3.2*f*(mw?3:1)}
function carStep(car,dt){if(car.state==='home')return;if(car.wait>0){car.wait-=dt;return}const p=car.p;
  // the road under the car's route was erased: find another way, or give up and go home
  for(let k=Math.floor(car.s);k<p.length;k++)if(!ROAD[p[k]]){reroute(car);return}
  let k=Math.floor(car.s);if(k>=p.length-1){arrive(car);return}const L=segLen(p,k),mw=L>1.5;car.s+=speedAt(p[k],mw)*dt/L;
  if(Math.floor(car.s)>=p.length-1){car.s=p.length-1;arrive(car)}}
function reroute(car){const k=Math.min(p0(car),car.p.length-1),here=car.p[k];if(!ROAD[here]){goHome(car);return}
  const goal=car.state==='out'?(u=>doorsOf(car.d).includes(u)):(u=>doorsOf(car.h).includes(u));const np=path([here],goal);if(!np){goHome(car);return}car.p=np;car.s=0}
const p0=car=>Math.floor(car.s);
function goHome(car){if(car.state==='out'&&car.d)car.d.inb=Math.max(0,car.d.inb-1);car.state='home';car.p=null;car.d=null}
function arrive(car){if(car.state==='out'){const d=car.d;d.pins=Math.max(0,d.pins-1);d.inb=Math.max(0,d.inb-1);d.served++;G.trips++;chEv('trip',{c:d.c});FX(d.x+1,d.y+1,COLS[d.c].c,true);
    const back=path([car.p[car.p.length-1]],u=>doorsOf(car.h).includes(u));if(!back){goHome(car);return}car.state='back';car.p=back;car.s=0;car.wait=0.4}else{car.state='home';car.p=null;car.d=null}}
function carPos(car){if(car.state==='home'||!car.p)return null;const k=Math.min(Math.floor(car.s),car.p.length-1),a=car.p[k],b=car.p[Math.min(k+1,car.p.length-1)],t=car.s-k;
  return[cx(a)+0.5+(cx(b)-cx(a))*t,cy(a)+0.5+(cy(b)-cy(a))*t,Math.atan2(cy(b)-cy(a),cx(b)-cx(a)),car.p.length>k+1&&segLen(car.p,k)>1.5]}
/* ---------- buses: shuttle along a chain of stops, carrying up to 6 people a trip ---------- */
const nearB=(b,i,r)=>b.cells.some(q=>Math.abs(cx(q)-cx(i))<=r&&Math.abs(cy(q)-cy(i))<=r);
// the road path through every stop in order; stopAt[k] is where stop k sits on the path
function buildRoute(r){const P=[],at=[];for(let k=0;k<r.stops.length;k++){if(k===0){P.push(r.stops[0]);at.push(0);continue}const seg=path([r.stops[k-1]],u=>u===r.stops[k]);if(!seg)return false;for(let j=1;j<seg.length;j++)P.push(seg[j]);at.push(P.length-1)}r.p=P;r.at=at;r.a=r.stops[0];r.b=r.stops[r.stops.length-1];return true}
function addBus(a,b){if(G.buses<=0){toast('🚌 No buses left: pick one as a weekly upgrade');return false}if(a===b)return false;const r={id:BUSES.length,stops:[a,b],s:0,dir:1,wait:0.5,load:0,stuck:false,last:0};if(!buildRoute(r)){toast('🚌 The two stops must be joined by road');return false}
  const hasD=e=>BL.some(q=>q.kind==='d'&&nearB(q,e,3)),hasH=e=>BL.some(q=>q.kind==='h'&&nearB(q,e,3));const good=(hasD(a)&&hasH(b))||(hasD(b)&&hasH(a));
  G.buses--;BUSES.push(r);BUSADD++;chEv('bus',{});toast(good?'🚌 Bus route open. Tap the route to add stops in between':'🚌 Bus route open. Tip: a stop near homes and one near their building fills the bus');return true}
function addMidStop(r,i){if(r.stops.includes(i))return false;const k=r.p.indexOf(i);if(k<0)return false;let pos=r.at.findIndex(x=>x>k);if(pos<=0)return false;const old=r.stops.slice();r.stops.splice(pos,0,i);if(!buildRoute(r)){r.stops=old;buildRoute(r);return false}MIDSTOPS++;chEv('busstop',{});toast(`🚏 Stop added: this route now has ${r.stops.length} stops`);return true}
function routeAt(i){return BUSES.find(r=>r.p.includes(i)&&!r.stops.includes(i))}
// at a stop: people from homes near any other stop on the route ride here if a building of their colour near this stop is waiting
function busServe(r,stop){let room=6;for(const d of BL){if(room<=0)break;if(d.kind!=='d'||!d.pins||!nearB(d,stop,3))continue;if(!r.stops.some(o=>o!==stop&&BL.some(h=>h.kind==='h'&&h.c===d.c&&nearB(h,o,3))))continue;const k=Math.min(room,d.pins);if(!k)continue;
    d.pins-=k;d.served+=k;G.trips+=k;BUSTRIPS+=k;room-=k;for(let q=0;q<k;q++)chEv('trip',{c:d.c,bus:1});FX(d.x+1,d.y+1,'#ffd23a',true)}r.load=6-room}
function busStep(r,dt){if(r.wait>0){r.wait-=dt;return}if(r.p.some(c=>!ROAD[c])){if(!buildRoute(r)){r.stuck=true;return}r.s=Math.min(r.s,r.p.length-1)}r.stuck=false;
  const k=clamp(Math.floor(r.s),0,r.p.length-1),seg=r.dir>0?k:Math.max(0,Math.ceil(r.s)-1),L=r.p.length>1?segLen(r.p,Math.min(seg,r.p.length-2)):1,s0=r.s;r.s+=r.dir*speedAt(r.p[k],L>1.5)*0.8*dt/L;
  if(r.s>=r.p.length-1){r.s=r.p.length-1;r.dir=-1;r.wait=1;busServe(r,r.b);return}if(r.s<=0){r.s=0;r.dir=1;r.wait=1;busServe(r,r.a);return}
  // middle stops: pull in when the bus passes one
  for(let q=1;q<r.at.length-1;q++){const x=r.at[q];if((s0<x&&r.s>=x)||(s0>x&&r.s<=x)){r.s=x;r.wait=0.8;busServe(r,r.stops[q]);break}}}
function busPos(r){const p=r.p,k=Math.min(Math.floor(r.s),p.length-1),a=p[k],b=p[Math.min(k+1,p.length-1)],t=r.s-k;return[cx(a)+0.5+(cx(b)-cx(a))*t,cy(a)+0.5+(cy(b)-cy(a))*t,Math.atan2(cy(b)-cy(a),cx(b)-cx(a))+(r.dir<0?Math.PI:0)]}
/* ---------- the week ---------- */
function weekUp(){G.week++;UPG++;if(G.week%2===0)G.colours=Math.min(COLS.length,G.colours+1);if(MODE==='free'||G.auto){G.roads+=20;if(!G.auto)toast(`Week ${G.week}`);return}G.roads+=20;
  const all=[['roads','🛣️','30 road tiles','More road to paint'],['bridge','🌉','6 bridge pieces','Build roads over water'],['tunnel','⛰️','6 tunnel pieces','Build roads through hills'],['rb','⭕','Roundabout','Junctions stop slowing traffic'],['lights','🚦','2 traffic lights','Busy junctions flow better'],['mway','🛫','Motorway','A fast road that jumps across town'],['bus','🚌','Bus route','A bus that carries 6 people at a time']];
  const opts=[];while(opts.length<2){const o=pick(all);if(!opts.includes(o))opts.push(o)}showWeek(opts)}
function grant(k){if(k==='roads')G.roads+=30;else if(k==='bridge')G.bridges+=6;else if(k==='tunnel')G.tunnels+=6;else if(k==='rb')G.rbs++;else if(k==='lights')G.lights+=2;else if(k==='mway')G.mways++;else if(k==='bus')G.buses++;chEv('upgrade',{k});syncPanel()}
const quiet=()=>CH.loading||!$('home').hidden||document.body.classList.contains('mDemo');
function showWeek(opts){if(quiet()){grant(opts[0][0]);return}G.choosing=true;const box=document.createElement('div');box.className='weekbox';box.innerHTML=`<div class="weekcard panel"><span class="k">Week ${G.week}</span><h2>20 more road tiles 🛣️</h2><p class="hfoot">Pick one more upgrade:</p><div class="wopts"></div></div>`;
  for(const [k,ic,n,d] of opts){const b=document.createElement('button');b.className='wopt';b.innerHTML=`<span class="ic">${ic}</span><b>${n}</b><span>${d}</span>`;b.onclick=()=>{grant(k);box.remove();G.choosing=false;toast(`${ic} ${n}`)};box.querySelector('.wopts').appendChild(b)}document.body.appendChild(box)}
let ACTX=null;function beep(f,d,v){try{ACTX=ACTX||new (window.AudioContext||window.webkitAudioContext)();const o=ACTX.createOscillator(),g=ACTX.createGain();o.type='triangle';o.frequency.value=f;o.connect(g);g.connect(ACTX.destination);const t=ACTX.currentTime;g.gain.setValueAtTime(v||0.05,t);g.gain.exponentialRampToValueAtTime(0.0001,t+d);o.start(t);o.stop(t+d)}catch(e){}}
function alarm(d){ALARMS++;chEv('alarm',{});if(quiet())return;beep(740,0.16,0.05);setTimeout(()=>beep(990,0.2,0.05),180);toast(`🚨 The ${COLS[d.c].n.toLowerCase()} building is overflowing! ${Math.round(d.over*100)}%`)}
function gameOver(d){G.over=true;chEv('gameover',{});if(CH.loading)return;const box=document.createElement('div');box.className='weekbox';box.innerHTML=`<div class="weekcard panel"><span class="k">Week ${G.week}</span><h2>Gridlock! 🚗🚗🚗</h2><p class="hfoot">The ${COLS[d.c].n.toLowerCase()} building waited too long. Your town made <b>${fmtN(G.trips)}</b> trips.</p><div class="actions" style="justify-content:center"><button class="btn primary" id="goRelax">Keep playing (relaxed)</button><button class="btn" id="goAgain">Start again</button></div></div>`;document.body.appendChild(box);
  box.querySelector('#goRelax').onclick=()=>{G.over=false;G.relaxed=true;for(const q of BL)q.over=0;box.remove();syncPanel()};box.querySelector('#goAgain').onclick=()=>{box.remove();loadScen(S.scen)};flyToW(d.x+1,d.y+1,Math.max(cam.z,30))}
/* ---------- towns ---------- */
function clearTown(){TER.fill(0);ROAD.fill(0);BLD.fill(-1);DEG.fill(0);OCC.fill(0);BL=[];CARS=[];WP=[];MP=[];MW=[];MWADJ={};RB=new Set();LT=new Set();PARTS=[];HIST=[];BUSES=[];
  Object.assign(G,{roads:40,bridges:0,tunnels:0,rbs:0,lights:0,mways:1,buses:1,week:1,trips:0,over:false,relaxed:false,houseT:0,destT:0,weekT:0,dispT:0,choosing:false,rush:false,snow:false,boom:false,auto:false,colours:1});document.querySelectorAll('.weekbox').forEach(b=>b.remove())}
const SCENS={
  meadow:()=>{RS=5},
  riverside:()=>{RS=17;WP.push(river([[25,-3],[22,9],[27,18],[23,26],[26,35]],2.6));G.bridges=4},
  peaks:()=>{RS=29;MP.push(blob(14,10,5,4,1),blob(36,22,6,4.5,2.5),blob(30,6,3,2.5,4));G.tunnels=4},
  lakes:()=>{RS=31;WP.push(blob(13,22,5,4,0.5),blob(35,9,6,4,3));MP.push(blob(40,26,3.5,3,1.5));G.bridges=2},
  bay:()=>{RS=43;WP.push([[-2,20],[10,18],[20,24],[30,22],[40,26],[50,24],[50,34],[-2,34]],river([[30,22],[28,12],[34,-3]],2.2));G.bridges=4},
};
const SCENLIST=[{id:'meadow',name:'Meadowfield',desc:'Flat open fields. A gentle start.'},{id:'riverside',name:'Riverside',desc:'A winding river splits the town in two.'},{id:'peaks',name:'Highpeak',desc:'Hills everywhere: go round them or tunnel through.'},{id:'lakes',name:'Twin Lakes',desc:'Two lakes and a hill. Roads must find the way between.'},{id:'bay',name:'Saltbay',desc:'A town on a bay, with a creek running inland.'}];
/* ---------- panel ---------- */
function FX(x,y,col,small){PARTS.push({x,y,col,age:0,small:!!small})}
const inf=v=>v>=1e5?'∞':v;
function syncPanel(){const inv=$('inv');if(!inv)return;inv.innerHTML=`<div>🛣️ Road tiles <b>${inf(G.roads)}</b></div><div>🌉 Bridge pieces <b>${inf(G.bridges)}</b></div><div>⛰️ Tunnel pieces <b>${inf(G.tunnels)}</b></div><div>⭕ Roundabouts <b>${inf(G.rbs)}</b></div><div>🚦 Traffic lights <b>${inf(G.lights)}</b></div><div>🛫 Motorways <b>${inf(G.mways)}</b></div><div>🚌 Buses <b>${inf(G.buses)}</b></div><div>🚗 Trips <b>${fmtN(G.trips)}</b></div><div>🏠 Homes <b>${BL.filter(b=>b.kind==='h').length}</b></div>`;
  $('relaxBtn').setAttribute('aria-pressed',G.relaxed);$('relaxBtn').textContent=G.relaxed?'On':'Off';
  const lab={rush:'🚦 Rush hour',snow:'❄ Snow',boom:'🏗 Growth spurt'};document.querySelectorAll('[data-ev]').forEach(b=>{const L=lab[b.dataset.ev];if(!L)return;b.setAttribute('aria-pressed',G[b.dataset.ev]);b.textContent=G[b.dataset.ev]?'■ Stop '+L.slice(2).trim().toLowerCase():L})}
$('relaxBtn').onclick=()=>{G.relaxed=!G.relaxed;chEv('relax',{});syncPanel()};
document.querySelectorAll('[data-ev]').forEach(b=>b.onclick=()=>{const ev=b.dataset.ev;EVN++;chEv('event',{ev});if(ev==='normal'){G.rush=G.snow=G.boom=false;toast('All events stopped')}else{G[ev]=!G[ev];if(G[ev])toast({rush:'🚦 Rush hour: everybody needs to be somewhere',snow:'❄ Snow: cars crawl along',boom:'🏗 Growth spurt: new homes pop up fast'}[ev]);else chEv('stop',{ev})}syncPanel()});
/* ---------- drawing ---------- */
function rr2(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function poly(c,P){c.beginPath();P.forEach(([x,y],i)=>i?c.lineTo(sx(x),sy(y)):c.moveTo(sx(x),sy(y)));c.closePath()}
function render(c,now){const night=S.view==='night',traffic=S.view==='traffic',z=cam.z;
  const pal=night?{bg:'#0b0a08',land:'#16140f',grid:'rgba(255,220,150,.05)',water:'#0e2236',wEdge:'rgba(90,170,255,.35)',hill:'#2a2418',hEdge:'rgba(255,210,140,.18)',road:'#3b3a40',edge:'#000',mark:'rgba(255,220,140,.35)'}
    :{bg:'#d9d2c2',land:'#ece6d6',grid:'rgba(80,60,20,.06)',water:'#9fcbe0',wEdge:'#7fb3cf',hill:'#d6c7a4',hEdge:'#bfae86',road:'#5a5a62',edge:'#3c3c44',mark:'rgba(255,255,255,.5)'};
  c.fillStyle=pal.bg;c.fillRect(0,0,W,H);c.fillStyle=pal.land;c.fillRect(sx(0),sy(0),WW*z,WH*z);
  if(z>9){c.fillStyle=pal.grid;for(let y=1;y<WH;y++)for(let x=1;x<WW;x++)c.fillRect(sx(x)-1,sy(y)-1,2,2)}
  c.save();c.beginPath();c.rect(sx(0),sy(0),WW*z,WH*z);c.clip();
  for(const P of MP){c.fillStyle=pal.hill;c.strokeStyle=pal.hEdge;c.lineWidth=2;poly(c,P);c.fill();c.stroke();const m=P.reduce((a,p)=>[a[0]+p[0]/P.length,a[1]+p[1]/P.length],[0,0]);for(const s of [0.66,0.33]){c.beginPath();P.forEach(([x,y],i)=>{const X=sx(m[0]+(x-m[0])*s),Y=sy(m[1]+(y-m[1])*s);i?c.lineTo(X,Y):c.moveTo(X,Y)});c.closePath();c.stroke()}}
  for(const P of WP){c.fillStyle=pal.water;c.strokeStyle=pal.wEdge;c.lineWidth=2;poly(c,P);c.fill();c.stroke()}
  c.restore();
  // roads: an outline pass, then the asphalt, joined smoothly between neighbouring tiles
  const rw=z*0.62;c.lineCap='round';c.lineJoin='round';
  const roadPath=()=>{c.beginPath();for(let i=0;i<N;i++){if(!ROAD[i])continue;const X=sx(cx(i)+0.5),Y=sy(cy(i)+0.5);c.moveTo(X,Y);c.lineTo(X+0.01,Y);if(cx(i)<WW-1&&ROAD[i+1]){c.moveTo(X,Y);c.lineTo(X+z,Y)}if(cy(i)<WH-1&&ROAD[i+WW]){c.moveTo(X,Y);c.lineTo(X,Y+z)}}};
  roadPath();c.strokeStyle=pal.edge;c.lineWidth=rw+Math.max(2,z*0.12);c.stroke();c.strokeStyle=pal.road;c.lineWidth=rw;c.stroke();
  for(let i=0;i<N;i++){if(ROAD[i]<2)continue;const X=sx(cx(i)+0.5),Y=sy(cy(i)+0.5);if(ROAD[i]===2){c.strokeStyle=night?'#8a8070':'#f5efe0';c.lineWidth=Math.max(1.5,z*0.08);c.strokeRect(X-z/2+1,Y-rw/2-2,z-2,rw+4)}else{c.fillStyle=night?'rgba(120,90,50,.55)':'rgba(120,90,50,.45)';c.beginPath();c.arc(X,Y,rw*0.36,0,7);c.fill()}}
  if(traffic){for(let i=0;i<N;i++){if(!ROAD[i]||!OCC[i])continue;c.fillStyle=`rgba(255,${200-60*OCC[i]},60,.55)`;c.beginPath();c.arc(sx(cx(i)+0.5),sy(cy(i)+0.5),rw*0.6,0,7);c.fill()}}
  else if(z>14){c.strokeStyle=pal.mark;c.lineWidth=Math.max(1,z*0.04);c.setLineDash([z*0.18,z*0.18]);c.beginPath();for(let i=0;i<N;i++){if(!ROAD[i]||DEG[i]>2)continue;const X=sx(cx(i)+0.5),Y=sy(cy(i)+0.5);if(cx(i)<WW-1&&ROAD[i+1]&&DEG[i+1]<=2){c.moveTo(X,Y);c.lineTo(X+z,Y)}if(cy(i)<WH-1&&ROAD[i+WW]&&DEG[i+WW]<=2){c.moveTo(X,Y);c.lineTo(X,Y+z)}}c.stroke();c.setLineDash([])}
  // motorways
  for(const m of MW){const A=[sx(cx(m.a)+0.5),sy(cy(m.a)+0.5)],B=[sx(cx(m.b)+0.5),sy(cy(m.b)+0.5)];c.strokeStyle=night?'#000':'#2f2f36';c.lineWidth=rw*1.25+4;c.beginPath();c.moveTo(...A);c.lineTo(...B);c.stroke();c.strokeStyle='#ffd23a';c.lineWidth=rw*1.25;c.stroke();c.strokeStyle='rgba(60,50,20,.6)';c.lineWidth=Math.max(1,z*0.05);c.setLineDash([z*0.3,z*0.25]);c.stroke();c.setLineDash([])}
  for(const i of RB){const X=sx(cx(i)+0.5),Y=sy(cy(i)+0.5);c.fillStyle=pal.road;c.beginPath();c.arc(X,Y,z*0.55,0,7);c.fill();c.fillStyle=night?'#2f5a3a':'#7cc48a';c.beginPath();c.arc(X,Y,z*0.24,0,7);c.fill()}
  for(const i of LT){const X=sx(cx(i)+0.5),Y=sy(cy(i)+0.5),g=Math.floor(now/2000+i)%2;c.fillStyle='#222';rr2(c,X+z*0.22,Y-z*0.48,z*0.2,z*0.36,z*0.06);c.fill();c.fillStyle=g?'#3ae07a':'#ff4a4a';c.beginPath();c.arc(X+z*0.32,Y-z*(g?0.2:0.38),z*0.06+1,0,7);c.fill()}
  // previews
  if(DRAG&&DRAG.mw!=null&&HOVER){c.strokeStyle='rgba(255,210,58,.7)';c.lineWidth=rw;c.setLineDash([rw,rw]);c.beginPath();c.moveTo(sx(cx(DRAG.mw)+0.5),sy(cy(DRAG.mw)+0.5));c.lineTo(sx(HOVER[0]),sy(HOVER[1]));c.stroke();c.setLineDash([])}
  if(HOVER&&['road','erase','rb','lights'].includes(S.tool)&&z>6){const X=Math.floor(HOVER[0]),Y=Math.floor(HOVER[1]);if(inside(X,Y)){c.strokeStyle=S.tool==='erase'?'rgba(255,90,90,.8)':'rgba(255,210,58,.8)';c.lineWidth=2;rr2(c,sx(X)+1,sy(Y)+1,z-2,z-2,z*0.2);c.stroke()}}
  // buildings
  for(const b of BL){const col=COLS[b.c].c,X=sx(b.x),Y=sy(b.y),s=b.w*z;
    if(b.kind==='d'){if(b.over>0){if(b.over>0.3){const pu=0.5+0.5*Math.sin(now*0.012);c.fillStyle=`rgba(255,40,40,${0.12+0.25*pu*b.over})`;c.beginPath();c.arc(X+s/2,Y+s/2,s*(0.9+pu*0.25),0,7);c.fill()}c.strokeStyle=`rgba(255,${120-100*b.over},80,.95)`;c.lineWidth=4;c.beginPath();c.arc(X+s/2,Y+s/2,s*0.78,-Math.PI/2,-Math.PI/2+Math.PI*2*b.over);c.stroke()}
      c.fillStyle='rgba(0,0,0,.18)';rr2(c,X+z*0.14,Y+z*0.2,s-z*0.12,s-z*0.12,z*0.3);c.fill();c.fillStyle=col;rr2(c,X+z*0.06,Y+z*0.06,s-z*0.12,s-z*0.12,z*0.3);c.fill();c.fillStyle='rgba(255,255,255,.28)';rr2(c,X+z*0.3,Y+z*0.3,s-z*0.6,s-z*0.6,z*0.18);c.fill();
      // waiting pins
      const pr=Math.max(2.5,z*0.15),per=4;for(let k=0;k<Math.min(b.pins,12);k++){const px=X+z*0.42+(k%per)*(s-z*0.84)/(per-1),py=Y+z*0.55+Math.floor(k/per)*pr*2.6;c.fillStyle='#fff';c.beginPath();c.arc(px,py,pr,0,7);c.fill();c.fillStyle=col;c.beginPath();c.arc(px,py,pr*0.5,0,7);c.fill()}
      if(b.pins>12){c.fillStyle='#fff';c.font=`600 ${Math.max(10,z*0.4)|0}px "IBM Plex Mono",monospace`;c.textAlign='center';c.fillText('+'+(b.pins-12),X+s/2,Y+s-z*0.25)}}
    else{c.fillStyle='rgba(0,0,0,.18)';rr2(c,X+z*0.16,Y+z*0.2,z*0.76,z*0.76,z*0.18);c.fill();c.fillStyle=col;rr2(c,X+z*0.12,Y+z*0.12,z*0.76,z*0.76,z*0.18);c.fill();c.fillStyle='rgba(255,255,255,.85)';c.beginPath();c.moveTo(X+z*0.3,Y+z*0.55);c.lineTo(X+z*0.5,Y+z*0.32);c.lineTo(X+z*0.7,Y+z*0.55);c.closePath();c.fill();
      const home=b.cars.filter(q=>q.state==='home').length;for(let k=0;k<home;k++){c.fillStyle=night?'#fff':'#333';c.fillRect(X+z*(0.3+k*0.24),Y+z*0.64,z*0.16,z*0.1)}}
    if(S.sel&&S.sel.b===b){c.strokeStyle='#ffd23a';c.lineWidth=2;c.beginPath();c.arc(X+s/2,Y+s/2,s*0.85,0,7);c.stroke()}}
  // bus routes and buses
  // bus route preview: the road the bus will take from the first stop to wherever you are pointing
  {const A=DRAG&&DRAG.bus!=null?DRAG.bus:(S.tool==='bus'?BUSPEND:null),B=HOVER?cellAt(HOVER[0],HOVER[1]):-1;if(A!=null&&B>=0&&B!==A){const key=A+'>'+B;if(BPREV.key!==key){BPREV={key,p:ROAD[B]?path([A],u=>u===B):null}}
    const X1=sx(cx(B)+0.5),Y1=sy(cy(B)+0.5);if(BPREV.p){c.strokeStyle='rgba(255,210,58,.95)';c.lineWidth=Math.max(3,z*0.22);c.setLineDash([z*0.35,z*0.2]);c.beginPath();BPREV.p.forEach((q,k)=>{const X=sx(cx(q)+0.5),Y=sy(cy(q)+0.5);k?c.lineTo(X,Y):c.moveTo(X,Y)});c.stroke();c.setLineDash([]);
      c.fillStyle='#ffd23a';c.font=`600 ${Math.max(11,z*0.45)|0}px "IBM Plex Mono",monospace`;c.textAlign='center';c.lineWidth=4;c.strokeStyle='rgba(20,15,5,.85)';c.strokeText(`🚏 ${BPREV.p.length} tiles`,X1,Y1-z*0.8);c.fillText(`🚏 ${BPREV.p.length} tiles`,X1,Y1-z*0.8)}
    else{c.strokeStyle='rgba(255,90,90,.8)';c.lineWidth=2;c.setLineDash([4,6]);c.beginPath();c.moveTo(sx(cx(A)+0.5),sy(cy(A)+0.5));c.lineTo(X1,Y1);c.stroke();c.setLineDash([]);c.fillStyle='#ff6a6a';c.font=`600 ${Math.max(11,z*0.45)|0}px "IBM Plex Mono",monospace`;c.textAlign='center';c.fillText(ROAD[B]?'No road between':'Not a road',X1,Y1-z*0.8)}}}
  if(BUSPEND!=null&&S.tool==='bus'){const X=sx(cx(BUSPEND)+0.5),Y=sy(cy(BUSPEND)+0.5);c.strokeStyle='#ffd23a';c.lineWidth=2;c.beginPath();c.arc(X,Y,z*(0.6+0.1*Math.sin(now*0.01)),0,7);c.stroke();c.font=`${Math.max(12,z*0.6)|0}px sans-serif`;c.textAlign='center';c.fillText('🚏',X,Y-z*0.7)}
  for(const r of BUSES){c.strokeStyle=r.stuck?'rgba(255,90,90,.6)':'rgba(255,210,58,.55)';c.lineWidth=Math.max(1.5,z*0.08);c.setLineDash([z*0.25,z*0.2]);c.beginPath();r.p.forEach((q,k)=>{const X=sx(cx(q)+0.5),Y=sy(cy(q)+0.5);k?c.lineTo(X,Y):c.moveTo(X,Y)});c.stroke();c.setLineDash([]);
    for(const e of r.stops){const X=sx(cx(e)+0.5),Y=sy(cy(e)+0.5);c.fillStyle='#ffd23a';c.beginPath();c.arc(X,Y,Math.max(4,z*0.22),0,7);c.fill();c.fillStyle='#222';c.font=`${Math.max(8,z*0.28)|0}px sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText('🚏',X,Y-z*0.45);c.textBaseline='alphabetic'}
    const [x,y,a]=busPos(r),bl=Math.max(10,z*0.85),bw=Math.max(5,z*0.38);c.save();c.translate(sx(x),sy(y));c.rotate(a);if(night){c.shadowColor='#ffd23a';c.shadowBlur=10}c.fillStyle='#ffd23a';rr2(c,-bl/2,-bw/2,bl,bw,bw*0.25);c.fill();c.shadowBlur=0;c.fillStyle='rgba(30,40,60,.75)';for(let k=0;k<3;k++)c.fillRect(-bl/2+bl*(0.12+k*0.26),-bw*0.3,bl*0.17,bw*0.6);c.restore()}
  // cars
  const cl=Math.max(6,z*0.5),cw=Math.max(4,z*0.3);for(const car of CARS){const P=carPos(car);if(!P)continue;const [x,y,a,mw]=P;const off=car.state==='out'?0.13:-0.13,X=sx(x-Math.sin(a)*off),Y=sy(y+Math.cos(a)*off);c.save();c.translate(X,Y);c.rotate(a);if(night){c.shadowColor=COLS[car.h.c].c;c.shadowBlur=8}c.fillStyle=COLS[car.h.c].c;rr2(c,-cl/2,-cw/2,cl,cw,cw*0.35);c.fill();c.shadowBlur=0;c.fillStyle=night?'#fff8c0':'rgba(255,255,255,.7)';c.fillRect(cl*0.18,-cw*0.32,cl*0.16,cw*0.64);if(car.state==='back'){c.fillStyle='#fff';c.beginPath();c.arc(-cl*0.18,0,cw*0.22,0,7);c.fill()}c.restore()}
  for(const p of PARTS){c.strokeStyle=p.col;c.globalAlpha=Math.max(0,1-p.age);c.lineWidth=2;c.beginPath();c.arc(sx(p.x),sy(p.y),z*(p.small?1:0.8)+p.age*z*(p.small?1:2.4),0,7);c.stroke()}c.globalAlpha=1}
/* ---------- tools ---------- */
const cellAt=(wx,wy)=>{const x=Math.floor(wx),y=Math.floor(wy);return inside(x,y)?ix(x,y):-1};
function stroke(a,b,fn){let x=cx(a),y=cy(a);const X=cx(b),Y=cy(b);fn(ix(x,y));let guard=200;while((x!==X||y!==Y)&&guard--){const dx=X-x,dy=Y-y;if(Math.abs(dx)>=Math.abs(dy))x+=Math.sign(dx);else y+=Math.sign(dy);fn(ix(x,y))}}
function nearMw(wx,wy){let best=null,bd=0.6;for(const m of MW){const ax=cx(m.a)+0.5,ay=cy(m.a)+0.5,bx=cx(m.b)+0.5,by=cy(m.b)+0.5,dx=bx-ax,dy=by-ay,t=clamp(((wx-ax)*dx+(wy-ay)*dy)/(dx*dx+dy*dy||1),0,1),d=Math.hypot(ax+dx*t-wx,ay+dy*t-wy);if(d<bd){bd=d;best=m}}return best}
const SIM={id:'gridlock',name:'Gridlock',defTool:'road',world:{w:WW,h:WH,wrapX:false,maxZ:90,followZ:40},home:'meadow',freeScen:'riverside',tutScen:'meadow',defSpeed:1,homeSpeed:1,inspectTab:'insp',
  speeds:[['½×',0.5],['1×',1],['2×',2],['4×',4]],fmtRate:v=>`${v}× speed`,
  dateTxt:()=>`Week ${G.week}`,dateSub:()=>`${fmtN(G.trips)} trips made`,stepSize:()=>0.05,
  tools:[['',[['select','👆','Inspect']]],['Build',[['road','🛣️','Road','Drag to paint road tiles. Over water it uses bridge pieces, through hills tunnel pieces.'],['erase','🧽','Erase','Drag over roads to remove them and get the tiles back.'],['rb','⭕','Roundabout','Click a junction: traffic flows through without slowing down.'],['lights','🚦','Traffic lights','Click a junction: busy traffic flows a bit better.'],['mway','🛫','Motorway','Drag from one road tile to another far away: a fast link that flies over everything.'],['bus','🚌','Bus route','Tap a road tile for the first bus stop, then tap another for the last stop (or drag between them). Tap the route itself to add stops in between. Put one near homes and one near their building. A bus shuttles between, carrying 6 people a trip.']]]],
  scens:SCENLIST,
  load(id){clearTown();(SCENS[id]||SCENS.meadow)();rasterTer();this.t0=0;
    if(MODE==='free'&&$('home').hidden){G.roads=G.bridges=G.tunnels=G.rbs=G.lights=G.mways=G.buses=1e6;G.relaxed=true;G.colours=3}
    const d=addDest(0);addHouse(0);addHouse(0);if(G.colours>1){addDest(1);addHouse(1);addHouse(1)}if(G.colours>2){addDest(2);addHouse(2)}syncPanel()},
  after(){if(!$('home').hidden)return;setTool('road')},
  step(dt){if(G.over||G.choosing)return;G.weekT+=dt;G.houseT+=dt;G.destT+=dt;G.dispT+=dt;
    const hEvery=Math.max(2.2,7-G.week*0.45)*(G.boom?0.3:1);if(G.houseT>=hEvery&&BL.length<110){G.houseT=0;addHouse()}
    const dEvery=Math.max(16,32-G.week*1.2);if(G.destT>=dEvery&&BL.filter(b=>b.kind==='d').length<14){G.destT=0;addDest()}
    for(const d of BL){if(d.kind!=='d')continue;const nh=BL.filter(b=>b.kind==='h'&&b.c===d.c).length;if(!nh)continue;d.pinT-=dt*(0.1+nh*0.05+G.week*0.012)*(G.rush?2:1);if(d.pinT<=0){d.pinT=1.6+R()*2.4;d.pins++}
      const cap=6;if(d.pins>cap)d.over+=dt/(G.relaxed?1e9:40);else d.over=Math.max(0,d.over-dt/20);
      if(!G.relaxed&&d.over>0.3){d.alT=(d.alT||0)-dt;if(d.alT<=0){d.alT=d.over>0.7?2.5:5;alarm(d)}}else d.alT=0;if(d.over>=1&&!G.relaxed&&!G.over){gameOver(d);return}}
    if(G.dispT>=0.25){G.dispT=0;dispatch()}
    OCC.fill(0);for(const r of BUSES){const k=Math.min(Math.floor(r.s),r.p.length-1);OCC[r.p[k]]=Math.min(9,OCC[r.p[k]]+1)}for(const car of CARS)if(car.state!=='home'&&car.p){const k=Math.min(Math.floor(car.s),car.p.length-1);OCC[car.p[k]]=Math.min(9,OCC[car.p[k]]+1)}
    for(const car of CARS)carStep(car,dt);for(const r of BUSES)busStep(r,dt);
    if(G.weekT>=WEEK){G.weekT=0;weekUp()}},
  frame(dt){for(const p of PARTS)p.age+=dt*1.4;PARTS=PARTS.filter(p=>p.age<1)},
  render,
  stats:()=>[['Trips',fmtN(G.trips)],['Homes',BL.filter(b=>b.kind==='h').length],['Cars out',CARS.filter(c=>c.state!=='home').length],['Week',G.week]],
  hud(){const last=HIST[HIST.length-1];if(!last||S.t-last.t>=2)HIST.push({t:S.t,d:G.trips});if(HIST.length>300)HIST.shift();syncPanel();renderStats();renderInspect()},
  pick(wx,wy){const i=cellAt(wx,wy);if(i<0)return null;if(BLD[i]>=0)return{b:BL[BLD[i]]};if(ROAD[i])return{r:i};return null},
  pointer(type,wx,wy){const t=S.tool,i=cellAt(wx,wy);HOVER=[wx,wy];
    if(t==='road'||t==='erase'){const fn=t==='road'?paint:unpaint;if(type==='down'){if(i>=0){fn(i);DRAG={last:i}}}else if(type==='drag'&&DRAG&&DRAG.last!=null&&i>=0&&i!==DRAG.last){let stop=false;stroke(DRAG.last,i,q=>{if(!stop&&q!==DRAG.last&&t==='road'&&!ROAD[q]&&!paint(q)&&BLD[q]<0)stop=true;else if(t==='erase')unpaint(q)});DRAG.last=i}else if(type==='up')DRAG=null;syncPanel();return}
    if(t==='bus'){if(type==='down'){if(i<0||!ROAD[i]){toast('🚏 Bus stops go on a road tile');DRAG=null;return}if(BUSPEND!=null&&BUSPEND!==i){addBus(BUSPEND,i);BUSPEND=null;DRAG=null;syncPanel();return}if(BUSPEND==null){const r=routeAt(i);if(r){addMidStop(r,i);DRAG=null;return}}DRAG={bus:i}}else if(type==='up'&&DRAG&&DRAG.bus!=null){if(i>=0&&ROAD[i]&&i!==DRAG.bus){addBus(DRAG.bus,i);BUSPEND=null}else{BUSPEND=DRAG.bus;toast('🚏 First stop placed. Now tap a road at the other end of the route')}DRAG=null;syncPanel()}return}
    if(t==='mway'){if(type==='down'){if(i>=0&&ROAD[i])DRAG={mw:i};else{const m=nearMw(wx,wy);toast(m?'Use 🧽 Erase on a motorway end to remove it':'Start the motorway on a road tile');DRAG=null}}else if(type==='up'&&DRAG&&DRAG.mw!=null){if(i>=0&&ROAD[i])addMw(DRAG.mw,i);else if(i!==DRAG.mw)toast('End the motorway on a road tile');DRAG=null;syncPanel()}return}
    if(type!=='down')return;
    if(t==='rb'||t==='lights'){if(i<0||!ROAD[i]){toast('Click a road junction');return}if(DEG[i]<3){toast('That is not a junction: roads must meet from 3 or 4 sides');return}
      if(t==='rb'){if(RB.has(i))return;if(G.rbs<=0){toast('No roundabouts left: pick one as a weekly upgrade');return}G.rbs--;RB.add(i);if(LT.delete(i))G.lights++;RBADD++;chEv('rb',{});toast('⭕ Roundabout built')}
      else{if(LT.has(i)||RB.has(i))return;if(G.lights<=0){toast('No traffic lights left: pick some as a weekly upgrade');return}G.lights--;LT.add(i);LTADD++;chEv('lights',{});toast('🚦 Traffic lights up')}syncPanel()}},
  hover(wx,wy){HOVER=[wx,wy]},
  find(q){const out=[],add=(label,sub,go)=>out.push({label,sub,go});const fly=b=>()=>{S.sel={b};flyToW(b.x+b.w/2,b.y+b.w/2,40);showTab('insp')};
    COLS.forEach((C,k)=>{if(C.n.toLowerCase().includes(q)){const d=BL.find(b=>b.kind==='d'&&b.c===k);if(d)add(`${C.n} building`,`${d.pins} waiting`,fly(d));const h=BL.find(b=>b.kind==='h'&&b.c===k);if(h)add(`${C.n} home`,'',fly(h))}});
    if('busiest waiting overflow'.includes(q))add('Busiest building','',()=>{const d=BL.filter(b=>b.kind==='d').sort((a,b)=>b.pins-a.pins)[0];if(d)fly(d)()});
    for(const [,items] of SIM.tools)for(const [id,ico,name] of items)if(id!=='select'&&name.toLowerCase().includes(q))add(`${ico} ${name}`,'tool',()=>setTool(id));
    for(const s of SCENLIST)if(s.name.toLowerCase().includes(q))add('Town: '+s.name,s.desc,()=>{loadScen(s.id);toast(s.name)});return out},
  tabShown(id){if(id==='stats')renderStats(true)},selChanged(){renderInspect()},
};
function kv(rows){return rows.map(([k,v])=>`<div><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}
function renderStats(force){if($('pane-stats').hidden&&!force)return;let tiles=0;for(let i=0;i<N;i++)if(ROAD[i])tiles++;
  $('cStats').innerHTML=kv([['Trips',fmtN(G.trips)],['Week',G.week],['Homes',BL.filter(b=>b.kind==='h').length],['Buildings',BL.filter(b=>b.kind==='d').length],['Cars on the road',CARS.filter(c=>c.state!=='home').length],['Road tiles used',tiles]]);
  const g=$('graph'),gc=g.getContext('2d'),w=g.width=g.clientWidth*DPR,hh=g.height=g.clientHeight*DPR;gc.clearRect(0,0,w,hh);if(HIST.length>1){const t0=HIST[0].t,t1=HIST[HIST.length-1].t,m=Math.max(1,HIST[HIST.length-1].d);gc.strokeStyle='#ffd23a';gc.lineWidth=2*DPR;gc.beginPath();HIST.forEach((p,i)=>{const x=8+(w-16)*(p.t-t0)/Math.max(1e-6,t1-t0),y=hh-6-(hh-12)*p.d/m;i?gc.lineTo(x,y):gc.moveTo(x,y)});gc.stroke()}
  const L=$('dList');L.textContent='';for(const d of BL.filter(b=>b.kind==='d').sort((a,b)=>b.pins-a.pins).slice(0,8)){const r=document.createElement('button');r.className='sprow';r.innerHTML='<i></i><span></span><b></b>';r.children[0].style.background=COLS[d.c].c;r.children[1].textContent=`${COLS[d.c].n} building`;r.children[2].textContent=`${d.pins} waiting`;r.onclick=()=>{S.sel={b:d};flyToW(d.x+1,d.y+1,40);showTab('insp')};L.appendChild(r)}}
function renderInspect(){const s=S.sel;$('inspEmpty').hidden=!!s;$('inspBody').hidden=!s;if(!s)return;const body=$('inspBody');
  if(s.b){const b=s.b,C=COLS[b.c],con=doorsOf(b).length>0;if(b.kind==='d')body.innerHTML=`<h2 class="ititle" style="color:${C.c}">${C.n} building</h2><div class="isub">${con?'on the road':'not connected yet'}</div><div class="kv">${kv([['Waiting',`${b.pins} pins`],['Cars on the way',b.inb],['Overflow',b.over>0?Math.round(b.over*100)+'% to gridlock':'fine'],['Visits',b.served],['Homes of this colour',BL.filter(h=>h.kind==='h'&&h.c===b.c).length]])}</div><p class="note">Cars from ${C.n.toLowerCase()} homes come here. Connect more ${C.n.toLowerCase()} homes if pins pile up.</p>`;
    else body.innerHTML=`<h2 class="ititle" style="color:${C.c}">${C.n} home</h2><div class="isub">${con?'on the road':'not connected yet'}</div><div class="kv">${kv([['Cars at home',b.cars.filter(c=>c.state==='home').length+' of 2'],['Cars out',b.cars.filter(c=>c.state!=='home').length]])}</div>`;return}
  if(s.r!=null){const i=s.r;body.innerHTML=`<h2 class="ititle">${ROAD[i]===2?'🌉 Bridge':ROAD[i]===3?'⛰️ Tunnel':'🛣️ Road'}</h2><div class="isub">${DEG[i]>=3?(RB.has(i)?'Roundabout':LT.has(i)?'Junction with lights':'Junction'):'Road'}</div><div class="kv">${kv([['Cars here now',OCC[i]],['Roads meeting',DEG[i]]])}</div>`}}

// home page: Classic mode button; Free play means anything goes
{const f=$('hFree');const b=document.createElement('button');b.className='hb';b.id='hClassic';b.innerHTML='<span class="ht">Classic</span><span class="hd">Limited road, bridges and upgrades. Alarms sound when a building is overflowing, and if it waits too long, it is gridlock.</span>';f.before(b);
  b.onclick=()=>{MODE='classic';leaveHome();loadScen('meadow');setSpeed(SIM.defSpeed);countPlay();toast('Classic: keep every building happy!')};
  document.addEventListener('pointerdown',e=>{if(e.target.closest('#hFree'))MODE='free';else if(e.target.closest('#home,#chDone,#hClassic'))MODE='classic'},true)}
// top bar: pause, then your stock; tap one to pick that tool
{const bar=document.createElement('div');bar.id='toolBar';bar.className='panel';document.querySelector('.hud-top .time').after(bar);
  const css=document.createElement('style');css.textContent='#toolBar .tb{display:flex;align-items:center;gap:4px;font-family:var(--f-mono);font-size:13px}#toolBar .tb[aria-pressed="true"]{border-color:var(--cool);background:rgba(var(--accRGB),.18)}';document.head.appendChild(css);
  const draw=()=>{sig=typeof sigOf==='function'?sigOf():'';bar.innerHTML='';const pz=document.createElement('button');pz.className='btn';pz.textContent=S.paused?'▶ Play':'⏸ Pause';pz.onclick=()=>{setPaused(!S.paused);draw()};bar.appendChild(pz);const vl=document.createElement('span');vl.className='k';vl.textContent='Build';vl.style.margin='0 2px 0 6px';bar.appendChild(vl);
    for(const [tool,ic,k] of [['road','🛣️','roads'],['road','🌉','bridges'],['road','⛰️','tunnels'],['rb','⭕','rbs'],['lights','🚦','lights'],['mway','🛫','mways'],['bus','🚌','buses']]){if(!['roads','mways','buses'].includes(k)&&!G[k]&&!(k==='bridges'&&ROAD.includes(2))&&!(k==='tunnels'&&ROAD.includes(3)))continue;const b=document.createElement('button');b.className='btn tb';b.title={roads:'Road',bridges:'Bridge',tunnels:'Tunnel',rbs:'Roundabout',lights:'Lights',mways:'Motorway',buses:'Bus'}[k];b.innerHTML=`${ic}<span>${inf(G[k])}</span>`;b.setAttribute('aria-pressed',S.tool===tool&&k!=='bridges'&&k!=='tunnels');b.onclick=()=>{setTool(tool);draw()};bar.appendChild(b)}};
  const sigOf=()=>[S.paused,S.tool,G.roads,G.bridges,G.tunnels,G.rbs,G.lights,G.mways,G.buses,ROAD.includes(2),ROAD.includes(3)].join('|');let sig='';setInterval(()=>{if(sigOf()!==sig)draw()},300);draw()}

SIM.toolChanged=id=>{if(id!=='bus')BUSPEND=null};
