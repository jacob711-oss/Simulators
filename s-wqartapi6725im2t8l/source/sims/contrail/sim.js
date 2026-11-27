/* ================= Contrail: air traffic control and airports ================= */
// The airspace is 120 x 80 km. A week lasts 60 seconds of game time.
const WW=120,WH=80,WEEK=60;
const PT={prop:{n:'Prop plane',ic:'🛩️',col:'#ffcf4a',sp:3.6,len:1.5,turn:1.6,need:'short'},jet:{n:'Jet',ic:'✈️',col:'#4ab8ff',sp:5.2,len:2.1,turn:1.2,need:'long'},
  jumbo:{n:'Jumbo jet',ic:'🛫',col:'#ff6a6a',sp:4.6,len:2.9,turn:0.9,need:'long'},heli:{n:'Helicopter',ic:'🚁',col:'#5ad08a',sp:2.6,len:1.4,turn:3,need:'pad'}};
const PK=Object.keys(PT),AIRL=['CX','QF','LH','AF','NZ','SK','KL','AC','IB','TK','EK','AY'];
let PL=[],RW=[],PADS=[],LANDS=[],DEPQ=[],STORMS=[],HIST=[],PARTS=[],PID=1;
const G={week:1,landed:0,departed:0,crashes:0,over:false,relaxed:false,choosing:false,spawnT:4,weekT:0,runways:0,pads:0,rush:false,storm:false,wind:false,heli:false,jumbo:false,labels:true,stormT:0};
let MODE='classic',ROUTED=0,HOLDS=0,RWADD=0,PADADD=0,UPG=0,ALARMS=0,EVN=0,DRAG=null,HOVER=null,BEEPT=0;
let RS=1;function R(){RS|=0;RS=RS+0x6D2B79F5|0;let t=Math.imul(RS^RS>>>15,1|RS);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}
const angD=(a,b)=>{let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d};
function inPoly(x,y,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const [xi,yi]=P[i],[xj,yj]=P[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c}return c}
function blob(x,y,rx,ry,k){const P=[];for(let a=0;a<28;a++){const t=a/28*Math.PI*2,r=1+0.2*Math.sin(t*3+k)+0.1*Math.sin(t*5+k*2);P.push([x+Math.cos(t)*rx*r,y+Math.sin(t)*ry*r])}return P}
let SEA=[],AP=[];// sea shapes for the map, and named airports
/* ---------- runways and helipads ---------- */
function addRunway(x1,y1,x2,y2,ap){const L=Math.hypot(x2-x1,y2-y1),r={id:RW.length,x1,y1,x2,y2,len:L,cls:L>=11?'long':'short',ap:ap??nearAP(x1,y1),landed:0,busyT:0};RW.push(r);return r}
function nearAP(x,y){let b=0,bd=1e9;AP.forEach((a,k)=>{const d=Math.hypot(a.x-x,a.y-y);if(d<bd){bd=d;b=k}});return AP.length?b:0}
function addPad(x,y,ap){const p={id:PADS.length,x,y,ap:ap??nearAP(x,y),landed:0};PADS.push(p);return p}
const fits=(t,r)=>t==='heli'||(PT[t].need==='short'?true:r.cls==='long');
/* ---------- planes ---------- */
function spawnArrival(type){if(PL.filter(p=>p.state==='fly').length>=30)return null;const side=Math.floor(R()*4),u=0.1+R()*0.8;let x,y;if(side===0){x=u*WW;y=-2}else if(side===1){x=WW+2;y=u*WH}else if(side===2){x=u*WW;y=WH+2}else{x=-2;y=u*WH}
  if(!type){const pool=['prop','prop','jet','jet','jet'];if(G.jumbo||G.week>=2)pool.push('jumbo');if(G.heli||PADS.length)pool.push('heli');type=pick(pool)}
  const a=Math.atan2(WH/2+(R()-0.5)*40-y,WW/2+(R()-0.5)*60-x),p={id:PID++,code:pick(AIRL)+' '+(100+Math.floor(R()*899)),type,x,y,a,sp:PT[type].sp,path:[],state:'fly',hold:false,born:S.t,warn:false};PL.push(p);return p}
function spawnDeparture(q){const rs=RW.filter(r=>fits(q.type,r)&&r.busyT<=0&&!PL.some(p=>Math.hypot(p.x-r.x1,p.y-r.y1)<5||(p.state==='land'&&p.rw===r)));if(!rs.length)return false;const r=pick(rs),a=Math.atan2(r.y2-r.y1,r.x2-r.x1);
  PL.push({id:PID++,code:pick(AIRL)+' '+(100+Math.floor(R()*899)),type:q.type,x:r.x1,y:r.y1,a,sp:PT[q.type].sp*0.4,path:[],state:'takeoff',rw:r,born:S.t,alt:0});r.busyT=4;return true}
function tryLand(p){if(p.state!=='fly'||p.hold)return;const t=p.type;
  if(t==='heli'){for(const pad of PADS)if(Math.hypot(pad.x-p.x,pad.y-p.y)<1.3){land(p,null,pad);return}}
  for(const r of RW){if(!fits(t,r))continue;for(const [tx,ty,ex,ey] of [[r.x1,r.y1,r.x2,r.y2],[r.x2,r.y2,r.x1,r.y1]]){if(Math.hypot(tx-p.x,ty-p.y)>2.4)continue;const ra=Math.atan2(ey-ty,ex-tx);if(t==='heli'||Math.abs(angD(p.a,ra))<(p.locked&&p.locked.r===r?1.6:1.0)){p.state='land';p.rw=r;p.end=[ex,ey];p.a=ra;p.path=[];r.busyT=3;return}}}}
function land(p,r,pad){p.dead=true;G.landed++;if(r)r.landed++;if(pad)pad.landed++;LANDS.push({t:S.t,type:p.type});chEv('land',{type:p.type,ap:r?r.ap:pad?pad.ap:0,code:p.code});FX(p.x,p.y,PT[p.type].col,true);if(p.type!=='heli'||RW.length)DEPQ.push({type:p.type==='heli'&&!RW.length?'heli':p.type,t:10+R()*12})}
function planeStep(p,dt){const T=PT[p.type];let sp=p.sp*(STORMS.some(s=>Math.hypot(s.x-p.x,s.y-p.y)<s.r)?0.55:1);
  if(p.state==='land'){p.sp=Math.max(T.sp*0.35,p.sp-T.sp*0.5*dt);p.x+=Math.cos(p.a)*p.sp*dt;p.y+=Math.sin(p.a)*p.sp*dt;p.roll=(p.roll||0)+p.sp*dt;if(p.roll>=Math.min(p.rw?p.rw.len*0.6:2,9)){land(p,p.rw)}return}
  if(p.state==='takeoff'){p.sp=Math.min(T.sp,p.sp+T.sp*0.5*dt);p.x+=Math.cos(p.a)*p.sp*dt;p.y+=Math.sin(p.a)*p.sp*dt;p.alt=Math.min(1,(p.alt||0)+dt*0.25);if(p.alt>=1)p.state='climb';return}
  if(p.state==='climb'){p.x+=Math.cos(p.a)*sp*dt;p.y+=Math.sin(p.a)*sp*dt;if(p.x<-4||p.y<-4||p.x>WW+4||p.y>WH+4){p.dead=true;G.departed++;chEv('depart',{type:p.type})}return}
  // flying: follow the drawn path, circle if holding, otherwise fly straight and turn back at the edge
  let want=null;if(p.path.length){const [tx,ty]=p.path[0];if(Math.hypot(tx-p.x,ty-p.y)<0.9){p.path.shift();if(!p.path.length)tryLand(p)}else want=Math.atan2(ty-p.y,tx-p.x)}
  if(p.hold&&!p.path.length)p.a+=T.turn*0.55*dt;else if(want!=null){const d=angD(p.a,want);p.a+=clamp(d,-12*dt,12*dt)}
  else if(p.x<3||p.y<3||p.x>WW-3||p.y>WH-3){if(S.t-p.born>4){const d=angD(p.a,Math.atan2(WH/2-p.y,WW/2-p.x));p.a+=clamp(d,-T.turn*dt,T.turn*dt)}}
  if(G.wind){p.x+=0.6*dt;}p.x+=Math.cos(p.a)*sp*dt;p.y+=Math.sin(p.a)*sp*dt;tryLand(p)}
function separation(dt){const air=PL.filter(p=>!p.dead);for(const p of air)p.warn=false;
  for(let i=0;i<air.length;i++)for(let j=i+1;j<air.length;j++){const a=air[i],b=air[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<4.5){a.warn=b.warn=true}
    if(d<0.42*(PT[a.type].len+PT[b.type].len)&&!G.relaxed){crash(a,b);return}}
  if(air.some(p=>p.warn)){BEEPT-=dt;if(BEEPT<=0){BEEPT=2.5;ALARMS++;chEv('alarm',{});if(!quiet())beep(1046,0.12,0.04)}}}
function crash(a,b){G.crashes++;chEv('crash',{});FX(a.x,a.y,'#ff5040');a.dead=b.dead=true;if(G.relaxed)return;G.over=true;if(CH.loading)return;const box=document.createElement('div');box.className='weekbox';box.innerHTML=`<div class="weekcard panel"><span class="k">Week ${G.week}</span><h2>Mid-air collision 💥</h2><p class="hfoot">${a.code} and ${b.code} flew too close. Your tower landed <b>${fmtN(G.landed)}</b> planes.</p><div class="actions" style="justify-content:center"><button class="btn primary" id="goRelax">Keep playing (relaxed)</button><button class="btn" id="goAgain">Start again</button></div></div>`;document.body.appendChild(box);
  box.querySelector('#goRelax').onclick=()=>{G.over=false;G.relaxed=true;box.remove();syncPanel()};box.querySelector('#goAgain').onclick=()=>{box.remove();loadScen(S.scen)};flyToW(a.x,a.y,Math.max(cam.z,10))}
const quiet=()=>CH.loading||!$('home').hidden||document.body.classList.contains('mDemo');
let ACTX=null;function beep(f,d,v){try{ACTX=ACTX||new (window.AudioContext||window.webkitAudioContext)();const o=ACTX.createOscillator(),g=ACTX.createGain();o.type='sine';o.frequency.value=f;o.connect(g);g.connect(ACTX.destination);const t=ACTX.currentTime;g.gain.setValueAtTime(v||0.05,t);g.gain.exponentialRampToValueAtTime(0.0001,t+d);o.start(t);o.stop(t+d)}catch(e){}}
function lockAt(p,wx,wy){const R0=3.2;if(p.type==='heli')for(const pad of PADS)if(Math.hypot(pad.x-wx,pad.y-wy)<R0)return{pad,pts:[[pad.x,pad.y]]};
  for(const r of RW){if(!fits(p.type,r))continue;for(const [tx,ty,ex,ey] of [[r.x1,r.y1,r.x2,r.y2],[r.x2,r.y2,r.x1,r.y1]]){if(Math.hypot(tx-wx,ty-wy)>R0)continue;const a=Math.atan2(ey-ty,ex-tx),L=p.type==='heli'?0:4;return{r,pts:L?[[tx-Math.cos(a)*L,ty-Math.sin(a)*L],[tx-Math.cos(a)*1.5,ty-Math.sin(a)*1.5],[tx,ty]]:[[tx,ty]]}}}return null}
let LOCKS=0;
/* ---------- weeks and upgrades ---------- */
function weekUp(){G.week++;UPG++;if(MODE==='free'||quiet()){if(!quiet())toast(`Week ${G.week}`);G.runways++;return}const all=[['runway','🛬','New runway','Build another runway anywhere'],['pad','🚁','Helipad','Helicopters start arriving'],['jumbo','🛫','Jumbo jets','Big planes, more passengers'],['slow','🐢','Slower approach','Arriving planes fly 10% slower']].filter(o=>!(o[0]==='jumbo'&&G.jumbo));
  const opts=[];while(opts.length<2){const o=pick(all);if(!opts.includes(o))opts.push(o)}G.choosing=true;const box=document.createElement('div');box.className='weekbox';box.innerHTML=`<div class="weekcard panel"><span class="k">Week ${G.week}</span><h2>Pick an upgrade ✈️</h2><div class="wopts"></div></div>`;
  for(const [k,ic,n,d] of opts){const b=document.createElement('button');b.className='wopt';b.innerHTML=`<span class="ic">${ic}</span><b>${n}</b><span>${d}</span>`;b.onclick=()=>{grant(k);box.remove();G.choosing=false;toast(`${ic} ${n}`)};box.querySelector('.wopts').appendChild(b)}document.body.appendChild(box)}
function grant(k){if(k==='runway')G.runways++;else if(k==='pad'){G.pads++;G.heli=true}else if(k==='jumbo')G.jumbo=true;else if(k==='slow')for(const t of PK)PT[t].sp*=0.9;chEv('upgrade',{k});syncPanel()}
/* ---------- airports ---------- */
const SPEEDS0=Object.fromEntries(PK.map(k=>[k,PT[k].sp]));
function clearSky(){PL=[];RW=[];PADS=[];LANDS=[];DEPQ=[];STORMS=[];HIST=[];PARTS=[];SEA=[];AP=[];for(const k of PK)PT[k].sp=SPEEDS0[k];Object.assign(G,{week:1,landed:0,departed:0,crashes:0,over:false,relaxed:false,choosing:false,spawnT:3,weekT:0,runways:0,pads:0,rush:false,storm:false,wind:false,heli:false,jumbo:false,stormT:0});document.querySelectorAll('.weekbox').forEach(b=>b.remove())}
const SCENS={
  regional:()=>{RS=5;SEA.push(blob(110,70,22,16,1));AP.push({n:'Millbrook Regional',x:60,y:40});addRunway(52,40,68,40,0);addRunway(56,34,63,46,0)},
  hub:()=>{RS=9;SEA.push(blob(-6,10,22,24,2));AP.push({n:'Grand Central Intl',x:62,y:40});addRunway(50,34,72,34,0);addRunway(50,46,72,46,0);addRunway(76,30,82,38,0);addPad(62,40,0);G.jumbo=true;G.heli=true},
  islands:()=>{RS=13;SEA.push([[-5,-5],[125,-5],[125,85],[-5,85]]);SEA.push(blob(32,40,16,13,1),blob(90,38,15,14,3));AP.push({n:'West Isle',x:32,y:40},{n:'East Isle',x:90,y:38});addRunway(24,40,40,40,0);addRunway(86,32,94,44,1)},
  twin:()=>{RS=17;SEA.push(blob(60,90,40,14,1));AP.push({n:'North Field',x:36,y:24},{n:'South Field',x:84,y:56});addRunway(28,24,44,24,0);addRunway(33,29,38,20,0);addRunway(76,56,92,56,1);addPad(84,62,1);G.heli=true},
  mountain:()=>{RS=21;AP.push({n:'Alpine Strip',x:60,y:44});addRunway(54,44,63,44,0);addPad(66,48,0);G.heli=true},
};
const SCENLIST=[{id:'regional',name:'Millbrook Regional',desc:'A small airport with two crossing runways. A gentle start.'},{id:'hub',name:'Grand Central',desc:'A giant hub: parallel runways, jumbos and a helipad.'},{id:'islands',name:'Island hopper',desc:'Two island airports over open sea.'},{id:'twin',name:'Twin fields',desc:'Two airports share one busy sky.'},{id:'mountain',name:'Alpine strip',desc:'One short runway and a helipad in the mountains.'}];
/* ---------- panel ---------- */
function FX(x,y,col,small){PARTS.push({x,y,col,age:0,small:!!small})}
const inf=v=>v>=1e5?'∞':v;
function syncPanel(){const inv=$('inv');if(!inv)return;inv.innerHTML=`<div>🛬 Landed <b>${fmtN(G.landed)}</b></div><div>🛫 Departed <b>${fmtN(G.departed)}</b></div><div>✈️ In the air <b>${PL.filter(p=>p.state==='fly').length}</b></div><div>⏳ Waiting to leave <b>${DEPQ.length}</b></div><div>🛣️ Spare runways <b>${inf(G.runways)}</b></div><div>🚁 Spare helipads <b>${inf(G.pads)}</b></div>`;
  $('relaxBtn').setAttribute('aria-pressed',G.relaxed);$('relaxBtn').textContent=G.relaxed?'On':'Off';$('lblBtn').setAttribute('aria-pressed',G.labels);$('lblBtn').textContent=G.labels?'On':'Off';
  const lab={rush:'🛬 Rush hour',storm:'⛈ Storms',wind:'🌬 Strong wind'};document.querySelectorAll('[data-ev]').forEach(b=>{const L=lab[b.dataset.ev];if(!L)return;b.setAttribute('aria-pressed',G[b.dataset.ev]);b.textContent=G[b.dataset.ev]?'■ Stop '+L.slice(2).trim().toLowerCase():L})}
$('relaxBtn').onclick=()=>{G.relaxed=!G.relaxed;chEv('relax',{});syncPanel()};$('lblBtn').onclick=()=>{G.labels=!G.labels;syncPanel()};
document.querySelectorAll('[data-ev]').forEach(b=>b.onclick=()=>{const ev=b.dataset.ev;EVN++;chEv('event',{ev});if(ev==='normal'){G.rush=G.storm=G.wind=false;STORMS=[];toast('All events stopped')}else{G[ev]=!G[ev];if(!G[ev]&&ev==='storm')STORMS=[];if(G[ev])toast({rush:'🛬 Rush hour: twice as many arrivals',storm:'⛈ Storm cells drift across the sky: planes slow right down inside',wind:'🌬 A strong wind pushes every plane east'}[ev])}syncPanel()});
/* ---------- drawing ---------- */
function planeShape(c,type,L){c.beginPath();if(type==='heli'){c.ellipse(0,0,L*0.45,L*0.3,0,0,7);c.moveTo(-L*0.4,0);c.lineTo(-L*1.0,0);c.lineWidth=Math.max(1,L*0.12);return 'heli'}
  const w=type==='prop'?0.9:type==='jumbo'?1.05:0.95;c.moveTo(L*0.55,0);c.quadraticCurveTo(L*0.45,-L*0.1,L*0.2,-L*0.09);c.lineTo(0.02*L,-L*0.55*w);c.lineTo(-L*0.12,-L*0.55*w);c.lineTo(-L*0.08,-L*0.09);c.lineTo(-L*0.38,-L*0.08);c.lineTo(-L*0.48,-L*0.26);c.lineTo(-L*0.55,-L*0.26);c.lineTo(-L*0.5,0);
  c.lineTo(-L*0.55,L*0.26);c.lineTo(-L*0.48,L*0.26);c.lineTo(-L*0.38,L*0.08);c.lineTo(-L*0.08,L*0.09);c.lineTo(-L*0.12,L*0.55*w);c.lineTo(0.02*L,L*0.55*w);c.lineTo(L*0.2,L*0.09);c.quadraticCurveTo(L*0.45,L*0.1,L*0.55,0);c.closePath();return 'plane'}
function render(c,now){const z=cam.z,v=S.view,radar=v==='radar',night=v==='night';c.fillStyle=radar?'#020a06':night?'#04060e':'#2a3a2c';c.fillRect(0,0,W,H);
  c.fillStyle=radar?'#04140b':night?'#0a1018':'#9db58a';c.fillRect(sx(0),sy(0),WW*z,WH*z);
  if(!radar){c.save();c.beginPath();c.rect(sx(0),sy(0),WW*z,WH*z);c.clip();c.beginPath();for(const P of SEA){P.forEach(([x,y],i)=>i?c.lineTo(sx(x),sy(y)):c.moveTo(sx(x),sy(y)));c.closePath()}c.fillStyle=night?'#071a30':'#6aa9cf';c.fill('evenodd');
    if(S.scen==='mountain'){c.strokeStyle=night?'rgba(150,170,200,.18)':'rgba(70,60,40,.25)';c.lineWidth=1.5;for(const [x,y,r] of [[25,20,10],[95,22,12],[30,64,9],[98,62,11]])for(let k=1;k<=4;k++){c.beginPath();c.arc(sx(x),sy(y),r*z*k/4,0,7);c.stroke()}}c.restore()}
  // radar rings and range lines
  c.strokeStyle=radar?'rgba(80,255,140,.18)':'rgba(255,255,255,.08)';c.lineWidth=1;for(let r=10;r<80;r+=10){c.beginPath();c.arc(sx(WW/2),sy(WH/2),r*z,0,7);c.stroke()}
  if(radar){const a=(now/1000)%(Math.PI*2);const g=c.createConicGradient?c.createConicGradient(a,sx(WW/2),sy(WH/2)):null;if(g){g.addColorStop(0,'rgba(80,255,140,.25)');g.addColorStop(0.08,'rgba(80,255,140,0)');g.addColorStop(1,'rgba(80,255,140,0)');c.fillStyle=g;c.fillRect(sx(0),sy(0),WW*z,WH*z)}}
  for(const s of STORMS){const g=c.createRadialGradient(sx(s.x),sy(s.y),0,sx(s.x),sy(s.y),s.r*z);g.addColorStop(0,'rgba(120,60,200,.45)');g.addColorStop(1,'rgba(120,60,200,0)');c.fillStyle=g;c.beginPath();c.arc(sx(s.x),sy(s.y),s.r*z,0,7);c.fill()}
  // airports, runways and helipads
  for(const a of AP){if(z>3){c.fillStyle=radar?'rgba(80,255,140,.7)':'rgba(255,255,255,.8)';c.font=`600 ${Math.max(10,z*0.9)|0}px "IBM Plex Mono",monospace`;c.textAlign='center';c.fillText(a.n,sx(a.x),sy(a.y+9))}}
  for(const r of RW){const a=Math.atan2(r.y2-r.y1,r.x2-r.x1),w=Math.max(5,z*1.1),col=r.cls==='long'?'#4ab8ff':'#ffcf4a';c.save();c.translate(sx(r.x1),sy(r.y1));c.rotate(a);const L=r.len*z;
    c.fillStyle=radar?'#0c2a18':'#2b2d33';c.fillRect(-w*0.3,-w/2,L+w*0.6,w);c.strokeStyle=col;c.lineWidth=2;c.strokeRect(-w*0.3,-w/2,L+w*0.6,w);c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=Math.max(1,w*0.08);c.setLineDash([w*0.6,w*0.5]);c.beginPath();c.moveTo(w*0.5,0);c.lineTo(L-w*0.5,0);c.stroke();c.setLineDash([]);
    c.fillStyle=col;for(const [x,d] of [[0,1],[L,-1]]){c.beginPath();c.moveTo(x-d*w*1.4,0);c.lineTo(x-d*w*0.4,-w*0.4);c.lineTo(x-d*w*0.4,w*0.4);c.closePath();c.fill()}c.restore()}
  for(const p of PADS){const X=sx(p.x),Y=sy(p.y),r=Math.max(6,z*0.9);c.fillStyle=radar?'#0c2a18':'#2b2d33';c.beginPath();c.arc(X,Y,r,0,7);c.fill();c.strokeStyle='#5ad08a';c.lineWidth=2;c.stroke();c.fillStyle='#5ad08a';c.font=`700 ${r|0}px sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText('H',X,Y+1);c.textBaseline='alphabetic'}
  if(DRAG&&DRAG.rw){c.strokeStyle='rgba(255,255,255,.6)';c.setLineDash([6,6]);c.lineWidth=Math.max(5,z*1.1);c.beginPath();c.moveTo(sx(DRAG.rw[0]),sy(DRAG.rw[1]));c.lineTo(sx(DRAG.rw[2]),sy(DRAG.rw[3]));c.stroke();c.setLineDash([])}
  // flight paths, then planes
  for(const p of PL){if(p.locked&&!p.dead&&p.state==='fly'){const q=p.path[p.path.length-1]||[p.x,p.y];c.strokeStyle='#fff';c.lineWidth=2;c.beginPath();c.arc(sx(q[0]),sy(q[1]),Math.max(8,z*1.1)*(1+0.15*Math.sin(now*0.01)),0,7);c.stroke()}if(!p.path.length)continue;c.strokeStyle=PT[p.type].col;c.globalAlpha=0.7;c.lineWidth=2;c.setLineDash([4,5]);c.beginPath();c.moveTo(sx(p.x),sy(p.y));for(const [x,y] of p.path)c.lineTo(sx(x),sy(y));c.stroke();c.setLineDash([]);c.globalAlpha=1}
  for(const p of PL){if(p.dead)continue;const T=PT[p.type],X=sx(p.x),Y=sy(p.y);let L=Math.max(14,z*T.len);if(p.state==='land')L*=Math.max(0.6,p.sp/T.sp*0.6+0.4);if(p.state==='takeoff')L*=0.6+0.4*(p.alt||0);
    if(radar){c.fillStyle='#50ff8c';c.beginPath();c.arc(X,Y,3,0,7);c.fill()}else{c.save();c.translate(X+L*0.25,Y+L*0.35);c.rotate(p.a);c.fillStyle='rgba(0,0,0,.22)';planeShape(c,p.type,L);c.fill();c.restore();
      c.save();c.translate(X,Y);c.rotate(p.a);const kind=planeShape(c,p.type,L);c.fillStyle=night?T.col:'#f6f6fa';if(night){c.shadowColor=T.col;c.shadowBlur=10}c.fill();c.shadowBlur=0;c.strokeStyle=T.col;c.lineWidth=Math.max(1.5,L*0.06);c.stroke();
      if(kind==='heli'){c.strokeStyle='rgba(30,30,30,.55)';c.lineWidth=1.5;const ra=now*0.03;c.beginPath();c.moveTo(Math.cos(ra)*L*0.7,Math.sin(ra)*L*0.7);c.lineTo(-Math.cos(ra)*L*0.7,-Math.sin(ra)*L*0.7);c.moveTo(-Math.sin(ra)*L*0.7,Math.cos(ra)*L*0.7);c.lineTo(Math.sin(ra)*L*0.7,-Math.cos(ra)*L*0.7);c.stroke()}c.restore()}
    if(p.warn){c.strokeStyle=`rgba(255,60,60,${0.5+0.5*Math.sin(now*0.02)})`;c.lineWidth=2;c.beginPath();c.arc(X,Y,2.25*z,0,7);c.stroke()}
    if(p.hold){c.strokeStyle='rgba(255,255,255,.35)';c.setLineDash([3,4]);c.beginPath();c.arc(X,Y,L*1.2,0,7);c.stroke();c.setLineDash([])}
    if(G.labels&&p.state==='fly'){c.fillStyle=radar?'#50ff8c':'#fff';c.font=`600 ${Math.max(10,Math.min(14,z*0.8))|0}px "IBM Plex Mono",monospace`;c.textAlign='left';c.fillText(`${p.code}`,X+L*0.6,Y-L*0.5)}
    if(S.sel&&S.sel.p===p){c.strokeStyle='#ffd23a';c.lineWidth=2;c.beginPath();c.arc(X,Y,L*1.1,0,7);c.stroke()}}
  for(const p of PARTS){c.strokeStyle=p.col;c.globalAlpha=Math.max(0,1-p.age);c.lineWidth=2;c.beginPath();c.arc(sx(p.x),sy(p.y),z*(p.small?1:2)+p.age*z*(p.small?2:6),0,7);c.stroke()}c.globalAlpha=1}
/* ---------- tools ---------- */
function nearPlane(x,y,r){let b=null,bd=r;for(const p of PL){if(p.dead||p.state!=='fly')continue;const d=Math.hypot(p.x-x,p.y-y);if(d<bd){bd=d;b=p}}return b}
function distSeg(px,py,r){const dx=r.x2-r.x1,dy=r.y2-r.y1,t=clamp(((px-r.x1)*dx+(py-r.y1)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(r.x1+dx*t-px,r.y1+dy*t-py)}
const SIM={id:'contrail',name:'Contrail',defTool:'route',world:{w:WW,h:WH,wrapX:false,maxZ:30,followZ:14},home:'hub',freeScen:'hub',tutScen:'regional',defSpeed:1,homeSpeed:1,inspectTab:'insp',canFollow:true,
  speeds:[['½×',0.5],['1×',1],['2×',2],['3×',3]],fmtRate:v=>`${v}× speed`,
  dateTxt:()=>`Week ${G.week}`,dateSub:()=>`${fmtN(G.landed)} landed · ${fmtN(G.departed)} departed`,stepSize:()=>0.04,
  tools:[['',[['select','👆','Inspect']]],['Tower',[['route','✏️','Flight path','Drag from a plane to draw where it should fly. Bring the line near a runway end and it locks on: the plane lines up and lands by itself.'],['hold','🔁','Hold','Click a plane to make it circle until you give it a new path.']]],
    ['Build',[['runway','🛬','Runway','Drag to build a runway. 11 km or longer is a long runway for jets.'],['pad','🚁','Helipad','Click to build a helipad.'],['erase','🧽','Remove','Click a runway or helipad to remove it.']]]],
  scens:SCENLIST,
  load(id){clearSky();(SCENS[id]||SCENS.regional)();if(MODE==='free'&&$('home').hidden){G.runways=G.pads=1e6;G.relaxed=true;G.jumbo=G.heli=true}syncPanel()},
  after(){if(!$('home').hidden)return;setTool('route')},
  step(dt){if(G.over||G.choosing)return;G.weekT+=dt;G.spawnT-=dt*(G.rush?2:1);if(G.spawnT<=0){G.spawnT=Math.max(3.2,9-G.week*0.6)*(0.8+R()*0.4);spawnArrival()}
    for(const q of DEPQ)q.t-=dt;for(let i=0;i<DEPQ.length;i++)if(DEPQ[i].t<=0&&spawnDeparture(DEPQ[i])){DEPQ.splice(i,1);break}
    for(const r of RW)r.busyT-=dt;
    if(G.storm){G.stormT-=dt;if(G.stormT<=0&&STORMS.length<4){G.stormT=6;STORMS.push({x:-8,y:10+R()*60,r:6+R()*5,vx:1.2+R(),vy:(R()-0.5)})}for(const s of STORMS){s.x+=s.vx*dt;s.y+=s.vy*dt}STORMS=STORMS.filter(s=>s.x<WW+15)}
    for(const p of PL)planeStep(p,dt);separation(dt);PL=PL.filter(p=>!p.dead);
    if(G.weekT>=WEEK){G.weekT=0;weekUp()}},
  frame(dt){for(const p of PARTS)p.age+=dt*1.2;PARTS=PARTS.filter(p=>p.age<1)},
  render,
  stats:()=>[['Landed',fmtN(G.landed)],['Departed',fmtN(G.departed)],['In the air',PL.filter(p=>p.state==='fly').length],['Week',G.week]],
  hud(){const last=HIST[HIST.length-1];if(!last||S.t-last.t>=2)HIST.push({t:S.t,l:G.landed});if(HIST.length>300)HIST.shift();syncPanel();renderStats();renderInspect()},
  pick(wx,wy){const p=nearPlane(wx,wy,2.5)||PL.find(q=>Math.hypot(q.x-wx,q.y-wy)<2.5);if(p)return{p};for(const r of RW)if(distSeg(wx,wy,r)<1.5)return{r};for(const pad of PADS)if(Math.hypot(pad.x-wx,pad.y-wy)<1.5)return{pad};return null},
  selPos(s){return s.p&&!s.p.dead?[s.p.x,s.p.y]:null},
  pointer(type,wx,wy){HOVER=[wx,wy];const t=S.tool;
    if(t==='route'){if(type==='down'){const p=nearPlane(wx,wy,3);if(p){p.path=[];p.hold=false;p.locked=null;DRAG={p,last:[p.x,p.y]}}else DRAG=null}else if(type==='drag'&&DRAG&&DRAG.p&&!DRAG.p.locked){const lk=lockAt(DRAG.p,wx,wy);if(lk){DRAG.p.path.push(...lk.pts);DRAG.p.locked=lk;LOCKS++;chEv('lock',{});if(!quiet())beep(1318,0.08,0.035);return}const [lx,ly]=DRAG.last;if(Math.hypot(wx-lx,wy-ly)>0.7){DRAG.p.path.push([wx,wy]);DRAG.last=[wx,wy]}}
      else if(type==='up'&&DRAG&&DRAG.p){if(DRAG.p.path.length>1){ROUTED++;chEv('route',{})}DRAG=null}return}
    if(t==='runway'){if(type==='down')DRAG={rw:[wx,wy,wx,wy]};else if(type==='drag'&&DRAG&&DRAG.rw){const [x0,y0]=DRAG.rw,L=Math.hypot(wx-x0,wy-y0),k=L>22?22/L:1;DRAG.rw[2]=x0+(wx-x0)*k;DRAG.rw[3]=y0+(wy-y0)*k}
      else if(type==='up'&&DRAG&&DRAG.rw){const [x1,y1,x2,y2]=DRAG.rw;DRAG=null;if(Math.hypot(x2-x1,y2-y1)<5){toast('Drag further: a runway must be at least 5 km long');return}if(G.runways<=0){toast('No runways left: pick one as a weekly upgrade');return}G.runways--;if(!AP.length)AP.push({n:'New Field',x:(x1+x2)/2,y:(y1+y2)/2});const r=addRunway(x1,y1,x2,y2);RWADD++;chEv('runway',{cls:r.cls});toast(`🛬 ${r.cls==='long'?'Long':'Short'} runway open`);syncPanel()}return}
    if(type!=='down')return;
    if(t==='hold'){const p=nearPlane(wx,wy,3);if(!p){toast('Click a plane in the air');return}p.hold=true;p.path=[];HOLDS++;chEv('hold',{});toast(`🔁 ${p.code} is holding`);return}
    if(t==='pad'){if(G.pads<=0){toast('No helipads left: pick one as a weekly upgrade');return}G.pads--;G.heli=true;if(!AP.length)AP.push({n:'Heliport',x:wx,y:wy});addPad(wx,wy);PADADD++;chEv('pad',{});toast('🚁 Helipad open');syncPanel();return}
    if(t==='erase'){const r=RW.find(r=>distSeg(wx,wy,r)<1.5);if(r){RW.splice(RW.indexOf(r),1);G.runways++;syncPanel();return}const p=PADS.find(p=>Math.hypot(p.x-wx,p.y-wy)<1.5);if(p){PADS.splice(PADS.indexOf(p),1);G.pads++;syncPanel()}}},
  hover(wx,wy){HOVER=[wx,wy]},
  find(q){const out=[],add=(label,sub,go)=>out.push({label,sub,go});const Q=q.toLowerCase();
    for(const p of PL)if(p.code.toLowerCase().replace(' ','').includes(Q.replace(' ',''))||PT[p.type].n.toLowerCase().includes(Q))add(`${PT[p.type].ic} ${p.code}`,PT[p.type].n,()=>{S.sel={p};S.follow=true;flyToW(p.x,p.y,12);showTab('insp')});
    for(const a of AP)if(a.n.toLowerCase().includes(Q))add(`🛬 ${a.n}`,'airport',()=>flyToW(a.x,a.y,8));
    for(const [,items] of SIM.tools)for(const [id,ico,name] of items)if(id!=='select'&&name.toLowerCase().includes(Q))add(`${ico} ${name}`,'tool',()=>setTool(id));
    for(const s of SCENLIST)if(s.name.toLowerCase().includes(Q))add('Airport: '+s.name,s.desc,()=>{loadScen(s.id);toast(s.name)});return out.slice(0,12)},
  tabShown(id){if(id==='stats')renderStats(true)},selChanged(){renderInspect()},
};
function kv(rows){return rows.map(([k,v])=>`<div><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}
function renderStats(force){if($('pane-stats').hidden&&!force)return;const by={};for(const l of LANDS)by[l.type]=(by[l.type]||0)+1;
  $('cStats').innerHTML=kv([['Landed',fmtN(G.landed)],['Departed',fmtN(G.departed)],...PK.map(k=>[PT[k].ic+' '+PT[k].n+' landings',by[k]||0]),['Near misses',ALARMS],['Crashes',G.crashes]]);
  const g=$('graph'),gc=g.getContext('2d'),w=g.width=g.clientWidth*DPR,hh=g.height=g.clientHeight*DPR;gc.clearRect(0,0,w,hh);if(HIST.length>1){const t0=HIST[0].t,t1=HIST[HIST.length-1].t,m=Math.max(5,HIST[HIST.length-1].l);gc.strokeStyle='#9fa8ff';gc.lineWidth=2*DPR;gc.beginPath();HIST.forEach((p,i)=>{const x=8+(w-16)*(p.t-t0)/Math.max(1e-6,t1-t0),y=hh-6-(hh-12)*p.l/m;i?gc.lineTo(x,y):gc.moveTo(x,y)});gc.stroke()}
  const L=$('fList');L.textContent='';for(const p of PL.filter(p=>p.state==='fly').slice(0,10)){const r=document.createElement('button');r.className='sprow';r.innerHTML='<i></i><span></span><b></b>';r.children[0].style.background=PT[p.type].col;r.children[1].textContent=`${PT[p.type].ic} ${p.code}`;r.children[2].textContent=p.hold?'holding':p.path.length?'on a path':'no path';r.onclick=()=>{S.sel={p};flyToW(p.x,p.y,12);showTab('insp')};L.appendChild(r)}}
function renderInspect(){const s=S.sel;$('inspEmpty').hidden=!!s;$('inspBody').hidden=!s;if(!s)return;const body=$('inspBody');
  if(s.p){const p=s.p,T=PT[p.type];if(p.dead){body.innerHTML=`<h2 class="ititle">${T.ic} ${p.code}</h2><p class="note">This flight has left your airspace.</p>`;return}
    body.innerHTML=`<h2 class="ititle" style="color:${T.col}">${T.ic} ${p.code}</h2><div class="isub">${T.n}</div><div class="kv">${kv([['Status',{fly:p.hold?'Holding':p.path.length?'Following your path':'Waiting for a path',land:'Landing',takeoff:'Taking off',climb:'Climbing away'}[p.state]],['Lands on',T.need==='short'?'any runway':T.need==='long'?'long runways':'helipads or runways'],['Speed',Math.round(p.sp*60)+' km/h'],['Heading',Math.round(((p.a*180/Math.PI)+450)%360)+'°']])}</div>`;return}
  if(s.r){const r=s.r;body.innerHTML=`<h2 class="ititle" style="color:${r.cls==='long'?'#4ab8ff':'#ffcf4a'}">🛬 ${r.cls==='long'?'Long':'Short'} runway</h2><div class="isub">${AP[r.ap]?AP[r.ap].n:''}</div><div class="kv">${kv([['Length',r.len.toFixed(1)+' km'],['Landings',r.landed],['Takes',r.cls==='long'?'every plane':'prop planes and helicopters']])}</div>`;return}
  if(s.pad){body.innerHTML=`<h2 class="ititle" style="color:#5ad08a">🚁 Helipad</h2><div class="kv">${kv([['Landings',s.pad.landed]])}</div>`}}
// home page: Classic mode button; Free play means anything goes
{const f=$('hFree');const b=document.createElement('button');b.className='hb';b.id='hClassic';b.innerHTML='<span class="ht">Classic</span><span class="hd">Planes keep coming. Build runways as weekly upgrades. One mid-air collision and it is over.</span>';f.before(b);
  b.onclick=()=>{MODE='classic';leaveHome();loadScen('regional');setSpeed(SIM.defSpeed);countPlay();toast('Classic: land them all, safely!')};
  document.addEventListener('pointerdown',e=>{if(e.target.closest('#hFree'))MODE='free';else if(e.target.closest('#home,#chDone,#hClassic'))MODE='classic'},true)}
