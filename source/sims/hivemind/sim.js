/* ================= Hivemind: ant colonies and their scent trails ================= */
// The world is a 160 x 100 grid of 1 cm cells. A day lasts 60 seconds of game time.
const WW=160,WH=100,N=WW*WH,DAY=60,MAXANTS=2400;
const NCOL=[{n:'Ember',c:'#ff7a3d',rgb:[255,122,61]},{n:'Azure',c:'#4ec3ff',rgb:[78,195,255]},{n:'Violet',c:'#c77dff',rgb:[199,125,255]},{n:'Moss',c:'#7ed957',rgb:[126,217,87]},{n:'Gold',c:'#ffd23a',rgb:[255,210,58]},{n:'Rose',c:'#ff6fae',rgb:[255,111,174]},{n:'Frost',c:'#e8f4ff',rgb:[232,244,255]},{n:'Jade',c:'#2fd6b5',rgb:[47,214,181]}];
const NC=NCOL.length,CIDX=NCOL.map((_,i)=>i);
let FOOD=new Float32Array(N),WALL=new Uint8Array(N),TOF=[],TOH=[],NESTS=[],ANTS=[],HIST=[],BASE=new Float32Array(N);
const G={gathered:0,kills:0,born:0,deaths:0,rain:false,feast:false,winter:false,raids:false,stolen:0,fallen:0,scent:1,fade:30,speed:1,feastT:0,raidT:20};
let RAIDS=0,RAIDPEND=null,FOODADD=0,WALLADD=0,ERASED=0,SPRAYED=0,NESTADD=0,EVN=0,AID=0;
let RS=1;function R(){RS|=0;RS=RS+0x6D2B79F5|0;let t=Math.imul(RS^RS>>>15,1|RS);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}
const ix=(x,y)=>(y|0)*WW+(x|0),inW=(x,y)=>x>=0&&y>=0&&x<WW&&y<WH,blocked=(x,y)=>!inW(x,y)||WALL[ix(x,y)]>0;
for(let c=0;c<NC;c++){TOF.push(new Float32Array(N));TOH.push(new Float32Array(N))}
/* ---------- world building ---------- */
function addFood(x,y,r,amt){let n=0;for(let yy=-r;yy<=r;yy++)for(let xx=-r;xx<=r;xx++){const d=Math.hypot(xx,yy);if(d>r)continue;const X=x+xx,Y=y+yy;if(!inW(X,Y))continue;const i=ix(X,Y);if(WALL[i])continue;const v=amt*(1-d/(r+1))+1;if(FOOD[i]<v){n+=v-FOOD[i];FOOD[i]=v}}return n}
function addWall(x,y,r){for(let yy=-r;yy<=r;yy++)for(let xx=-r;xx<=r;xx++){if(Math.hypot(xx,yy)>r)continue;const X=x+xx,Y=y+yy;if(!inW(X,Y))continue;if(NESTS.some(n=>Math.hypot(n.x-X,n.y-Y)<n.r+1))continue;const i=ix(X,Y);WALL[i]=1;FOOD[i]=0}}
function wallLine(x0,y0,x1,y1,w){const L=Math.hypot(x1-x0,y1-y0);for(let k=0;k<=L;k+=0.7)addWall(x0+(x1-x0)*k/L,y0+(y1-y0)*k/L,w)}
function addNest(x,y,c,ants){if(c==null){c=CIDX.find(k=>!NESTS.some(n=>n.c===k));if(c==null)return null}const n={c,x,y,r:3.2,food:0,store:ants!=null?0:10,born:0,id:NESTS.length};NESTS.push(n);for(let k=0;k<(ants??40);k++)spawnAnt(n);FX(x,y,NCOL[c].c);return n}
function spawnAnt(n){if(ANTS.length>=MAXANTS)return null;const a=R()*7,ant={id:AID++,c:n.c,nest:n,x:n.x+Math.cos(a)*n.r*0.6,y:n.y+Math.sin(a)*n.r*0.6,a,carry:0,t:0,age:0,life:110+R()*80,trail:[]};ANTS.push(ant);n.born++;G.born++;return ant}
/* ---------- raids: a war party marches on a rival nest, fights its way in and steals from the larder ---------- */
function launchRaid(from,to,quietly){if(!from||!to||from===to||from.c===to.c)return 0;const pool=ANTS.filter(a=>a.c===from.c&&!a.carry&&!a.raid).sort((a,b)=>Math.hypot(a.x-from.x,a.y-from.y)-Math.hypot(b.x-from.x,b.y-from.y));
  const n=Math.min(40,Math.ceil(pool.length*0.3));if(n<5){if(!quietly)toast(`The ${NCOL[from.c].n} colony is too small to raid (needs 15+ ants)`);return 0}
  for(const a of pool.slice(0,n)){a.raid=to;a.t=0}RAIDS++;chEv('raid',{c:from.c,on:to.c});if(!quietly)toast(`⚔️ ${n} ${NCOL[from.c].n} ants march on the ${NCOL[to.c].n} nest!`);FX(from.x,from.y,'#ff4040');return n}
function raidStep(n,dt){const T=n.raid;if(!NESTS.includes(T)){n.raid=null;return}n.t=0;const want=Math.atan2(T.y-n.y,T.x-n.x);n.a+=angTo(n.a,want)*0.3+(R()-0.5)*0.3;
  const sp=10*G.speed*(G.winter?0.45:1)*dt,nx=n.x+Math.cos(n.a)*sp,ny=n.y+Math.sin(n.a)*sp;if(blocked(nx,ny)){n.a+=Math.PI*(0.4+R()*0.5);return}n.x=nx;n.y=ny;n.age+=dt;
  if(Math.hypot(T.x-n.x,T.y-n.y)<T.r){let took=false;if(T.store>=1){T.store-=1;took=true}else{const v=ANTS.find(q=>q.c===T.c&&!q.raid&&!q.dead&&Math.hypot(q.x-T.x,q.y-T.y)<T.r*4);if(v){v.dead=true;v.cause='carried off by raiders';took=true}else if(T.born>0){T.born--;took=true}}
    if(took){n.carry=1;n.stolen=true;G.stolen++;chEv('steal',{c:n.c,from:T.c});FX(T.x,T.y,'#b8f070',true)}n.raid=null;n.a+=Math.PI}}
/* ---------- the ants ---------- */
function sense(f,x,y){if(!inW(x,y))return -1;const i=ix(x,y);return WALL[i]?-1:f[i]}
function antStep(n,dt){if(n.raid&&!n.carry){raidStep(n,dt);return}const fld=n.carry?TOH[n.c]:TOF[n.c],sd=2.6,sa=0.62;
  const l=sense(fld,n.x+Math.cos(n.a-sa)*sd,n.y+Math.sin(n.a-sa)*sd),m=sense(fld,n.x+Math.cos(n.a)*sd,n.y+Math.sin(n.a)*sd),r=sense(fld,n.x+Math.cos(n.a+sa)*sd,n.y+Math.sin(n.a+sa)*sd);
  // searching ants smell food that is close by
  if(!n.carry){const fl=sense(FOOD,n.x+Math.cos(n.a-sa)*sd,n.y+Math.sin(n.a-sa)*sd),fr=sense(FOOD,n.x+Math.cos(n.a+sa)*sd,n.y+Math.sin(n.a+sa)*sd);if(fl>0||fr>0)n.a+=fl>fr?-0.5:0.5}
  else{const dn=Math.hypot(n.nest.x-n.x,n.nest.y-n.y);if(dn<16)n.a+=angTo(n.a,Math.atan2(n.nest.y-n.y,n.nest.x-n.x))*0.25}
  if(m>=l&&m>=r){}else if(l>r)n.a-=0.35;else if(r>l)n.a+=0.35;n.a+=(R()-0.5)*0.55;
  const sp=9*G.speed*(G.winter?0.45:1)*dt,nx=n.x+Math.cos(n.a)*sp,ny=n.y+Math.sin(n.a)*sp;
  if(blocked(nx,ny)){n.a+=Math.PI*(0.6+R()*0.8);return}n.x=nx;n.y=ny;n.t+=dt;n.age+=dt;
  const i=ix(n.x,n.y),drop=Math.max(0,1-n.t/40)*0.5*G.scent*dt*10;if(n.carry)TOF[n.c][i]=Math.min(4,TOF[n.c][i]+drop);else TOH[n.c][i]=Math.min(4,TOH[n.c][i]+drop);
  if(!n.carry&&FOOD[i]>0){const take=Math.min(1,FOOD[i]);FOOD[i]-=take;n.carry=take;n.t=0;n.a+=Math.PI;chEv('pickup',{c:n.c})}
  const nst=n.nest;if(Math.hypot(nst.x-n.x,nst.y-n.y)<nst.r){if(n.carry){nst.food+=n.carry;nst.store+=n.carry;G.gathered+=n.carry;n.carry=0;n.a+=Math.PI;chEv('gather',{c:n.c})}n.t=0}}
const angTo=(a,b)=>{let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d};
function fights(dt){const B=new Map();for(const a of ANTS){const k=((a.x/3)|0)*1000+((a.y/3)|0);let L=B.get(k);if(!L)B.set(k,L=[]);L.push(a)}
  for(const L of B.values()){if(L.length<2)continue;const c0=L[0].c;if(L.every(a=>a.c===c0))continue;for(const a of L){if(a.dead)continue;for(const b of L){if(b.dead||b.c===a.c)continue;if(Math.hypot(a.x-b.x,a.y-b.y)<1.4&&R()<0.9*dt){const loser=a.raid&&!b.raid?(R()<0.12?a:b):b.raid&&!a.raid?(R()<0.12?b:a):(R()<0.5?a:b);loser.dead=true;loser.cause='fight';G.kills++;chEv('kill',{c:loser.c===a.c?b.c:a.c});FX(loser.x,loser.y,'#fff',true);break}}}}}
/* ---------- scenes ---------- */
function clearWorld(){FOOD.fill(0);WALL.fill(0);for(const f of [...TOF,...TOH])f.fill(0);NESTS=[];ANTS=[];HIST=[];PARTS=[];Object.assign(G,{gathered:0,kills:0,born:0,deaths:0,rain:false,feast:false,winter:false,raids:false,stolen:0,fallen:0,feastT:0,raidT:20});RAIDPEND=null;
  for(let i=0;i<N;i++){const x=i%WW,y=(i/WW)|0;BASE[i]=0.5+0.25*Math.sin(x*0.21+Math.sin(y*0.13)*2)*Math.cos(y*0.17+x*0.05)+0.15*(R()-0.5)}}
const SCENS={
  meadow:()=>{RS=3;addNest(80,50,0);for(const [x,y,r] of [[30,25,4],[130,30,5],[40,80,3],[125,78,4],[85,12,3]])addFood(x,y,r,6)},
  maze:()=>{RS=7;addNest(14,50,0);wallLine(35,0,35,70,1.2);wallLine(70,30,70,100,1.2);wallLine(105,0,105,70,1.2);addFood(140,50,6,8);addFood(88,88,3,5)},
  rivals:()=>{RS=11;addNest(30,50,0);addNest(130,50,1);addFood(80,50,7,8);addFood(80,15,3,6);addFood(80,85,3,6)},
  desert:()=>{RS=17;addNest(80,85,0,30);addFood(20,10,4,10);addFood(145,15,3,10);for(const [x,y,w] of [[50,40,2],[110,45,2]])addWall(x,y,w*3)},
  kingdoms:()=>{RS=31;const P=[[22,20],[80,12],[138,20],[150,62],[120,90],[40,90],[10,58],[80,55]];P.forEach(([x,y],i)=>addNest(x,y,i,25));for(const [x,y] of [[50,35],[110,35],[110,72],[50,72],[80,32],[80,80]])addFood(x,y,3.5,7)},
  garden:()=>{RS=23;addNest(30,30,0);addNest(130,30,1);addNest(80,82,2);for(let k=0;k<7;k++)addFood(20+R()*120,10+R()*80,3,6)},
};
const SCENLIST=[{id:'meadow',name:'Meadow',desc:'One colony and scattered food. A gentle start.'},{id:'maze',name:'Maze',desc:'Walls stand between the nest and the food. Can the ants find the way?'},{id:'rivals',name:'Rivals',desc:'Two colonies, one feast in the middle. Expect war.'},{id:'desert',name:'Desert',desc:'Food is scarce and far away. Help them out.'},{id:'garden',name:'Garden',desc:'Three colonies share a garden.'},{id:'kingdoms',name:'Eight kingdoms',desc:'Eight rival colonies, one in every colour, fight over the same food.'}];
/* ---------- panel ---------- */
let PARTS=[];function FX(x,y,col,small){PARTS.push({x,y,col,age:0,small:!!small})}
const antsOf=c=>ANTS.filter(a=>a.c===c).length;
function syncPanel(){const inv=$('inv');if(!inv)return;inv.innerHTML=`<div>🐜 Ants <b>${ANTS.length}</b></div><div>🍯 Food gathered <b>${fmtN(Math.round(G.gathered))}</b></div><div>🏠 Colonies <b>${NESTS.length}</b></div><div>⚔️ Fights lost <b>${G.kills}</b></div><div>🗡️ Food stolen <b>${G.stolen}</b></div><div>💀 Colonies fallen <b>${G.fallen}</b></div>`;
  $('scV').textContent=Math.round(G.scent*100)+'%';$('evV').textContent=G.fade+' s';$('spV').textContent=Math.round(G.speed*100)+'%';
  const lab={rain:'🌧 Rain',feast:'🍯 Feast',winter:'❄ Winter',raids:'⚔️ Raids'};document.querySelectorAll('[data-ev]').forEach(b=>{const L=lab[b.dataset.ev];if(!L)return;b.setAttribute('aria-pressed',G[b.dataset.ev]);b.textContent=G[b.dataset.ev]?'■ Stop '+L.slice(2).trim().toLowerCase():L})}
$('scS').oninput=e=>{G.scent=e.target.value/100;chEv('tweak',{});syncPanel()};$('evS').oninput=e=>{G.fade=+e.target.value;chEv('tweak',{});syncPanel()};$('spS').oninput=e=>{G.speed=e.target.value/100;chEv('tweak',{});syncPanel()};
document.querySelectorAll('[data-ev]').forEach(b=>b.onclick=()=>{const ev=b.dataset.ev;EVN++;chEv('event',{ev});if(ev==='normal'){G.rain=G.feast=G.winter=G.raids=false;toast('All events stopped')}else{G[ev]=!G[ev];if(G[ev])toast({rain:'🌧 Rain washes the scent trails away',feast:'🍯 Feast: food appears everywhere',winter:'❄ Winter: ants slow right down',raids:'⚔️ Raids: big colonies send war parties against their rivals'}[ev])}syncPanel()});
/* ---------- drawing ---------- */
const off=document.createElement('canvas');off.width=WW;off.height=WH;const ox=off.getContext('2d'),img=ox.createImageData(WW,WH);
function paintLayer(){const d=img.data,v=S.view,night=v==='night',tr=v==='trails';
  for(let i=0;i<N;i++){const b=BASE[i];let r,g,bl;if(WALL[i]){r=74+b*30;g=66+b*26;bl=58+b*20}else if(night){r=18+b*12;g=16+b*10;bl=14+b*8}else if(tr){r=14;g=12;bl=10}else{r=118+b*40;g=94+b*30;bl=60+b*20}
    if(!WALL[i]){const f=FOOD[i];if(f>0){const k=Math.min(1,f/5);r=r*(1-k)+120*k;g=g*(1-k)+200*k;bl=bl*(1-k)+60*k}
      for(let c=0;c<NC;c++){const tf=TOF[c][i],th=TOH[c][i];if(tf+th<0.01)continue;const C=NCOL[c].rgb,k=Math.min(1,(tr?1.4:night?0.9:0.35)*(tf+th*0.5));r+=(C[0]-r)*k;g+=(C[1]-g)*k;bl+=(C[2]-bl)*k}}
    const o=i*4;d[o]=r;d[o+1]=g;d[o+2]=bl;d[o+3]=255}ox.putImageData(img,0,0)}
function render(c,now){const z=cam.z,night=S.view==='night';c.fillStyle='#0c0905';c.fillRect(0,0,W,H);paintLayer();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(off,sx(0),sy(0),WW*z,WH*z);
  for(const n of NESTS){const X=sx(n.x),Y=sy(n.y),R0=n.r*z,col=NCOL[n.c].c;const gr=c.createRadialGradient(X,Y,R0*0.2,X,Y,R0*1.5);gr.addColorStop(0,'rgba(60,40,20,.95)');gr.addColorStop(0.55,'rgba(150,110,70,.9)');gr.addColorStop(1,'rgba(150,110,70,0)');c.fillStyle=gr;c.beginPath();c.arc(X,Y,R0*1.5,0,7);c.fill();
    c.fillStyle='#1a1008';c.beginPath();c.arc(X,Y,R0*0.4,0,7);c.fill();c.strokeStyle=col;c.lineWidth=Math.max(2,z*0.35);c.beginPath();c.arc(X,Y,R0*1.05,0,7);c.stroke();
    if(z>3){c.fillStyle='#fff';c.font=`600 ${Math.max(11,z*1.2)|0}px "IBM Plex Mono",monospace`;c.textAlign='center';c.fillText(`${NCOL[n.c].n} · ${antsOf(n.c)}`,X,Y-R0*1.6)}
    if(RAIDPEND===n&&S.tool==='raid'){c.strokeStyle='#ff4040';c.lineWidth=3;c.setLineDash([6,5]);c.beginPath();c.arc(X,Y,R0*2.1,0,7);c.stroke();c.setLineDash([])}
    if(S.sel&&S.sel.n===n){c.strokeStyle='#ffd23a';c.lineWidth=2;c.beginPath();c.arc(X,Y,R0*1.9,0,7);c.stroke()}}
  // ants: dots when far away, little bodies when close
  if(z<5){for(let k=0;k<NC;k++){const C0=NCOL[k].rgb;c.fillStyle=night?NCOL[k].c:`rgb(${C0[0]*0.16|0},${C0[1]*0.12|0},${C0[2]*0.12|0})`;const s=Math.max(1.6,z*0.55);for(const a of ANTS)if(a.c===k)c.fillRect(sx(a.x)-s/2,sy(a.y)-s/2,s,s)}
    c.fillStyle='#ff4040';const rs=Math.max(2.4,z*0.8);for(const a of ANTS)if(a.raid)c.fillRect(sx(a.x)-rs/2,sy(a.y)-rs/2,rs,rs);
    c.fillStyle='#b8f070';for(const a of ANTS)if(a.carry)c.fillRect(sx(a.x+Math.cos(a.a)*0.5)-1,sy(a.y+Math.sin(a.a)*0.5)-1,2,2)}
  else{const L=z*0.45;for(const a of ANTS){const X=sx(a.x),Y=sy(a.y);if(X<-20||Y<-20||X>W+20||Y>H+20)continue;c.save();c.translate(X,Y);c.rotate(a.a);c.fillStyle=night?NCOL[a.c].c:'#1c0f06';c.strokeStyle=c.fillStyle;c.lineWidth=Math.max(1,L*0.12);
      const wig=Math.sin(now*0.03+a.id)*L*0.25;c.beginPath();for(const s of [-1,1])for(const k of [-0.5,0,0.5]){c.moveTo(k*L,0);c.lineTo(k*L+wig*s*(k===0?-1:1),s*L*0.75)}c.stroke();
      c.beginPath();c.ellipse(-L*0.7,0,L*0.5,L*0.32,0,0,7);c.ellipse(0,0,L*0.28,L*0.2,0,0,7);c.ellipse(L*0.55,0,L*0.3,L*0.26,0,0,7);c.fill();if(!night){c.fillStyle=NCOL[a.c].c;c.beginPath();c.arc(-L*0.75,0,L*0.18,0,7);c.fill()}if(a.raid){c.strokeStyle='#ff4040';c.lineWidth=Math.max(1.5,L*0.15);c.beginPath();c.moveTo(L*0.8,-L*0.25);c.lineTo(L*1.15,-L*0.05);c.moveTo(L*0.8,L*0.25);c.lineTo(L*1.15,L*0.05);c.stroke()}
      if(a.carry){c.fillStyle='#b8f070';c.beginPath();c.arc(L*1.05,0,L*0.32,0,7);c.fill()}c.restore();if(S.sel&&S.sel.a===a){c.strokeStyle='#ffd23a';c.lineWidth=2;c.beginPath();c.arc(X,Y,L*2.4,0,7);c.stroke()}}}
  if(G.rain){c.strokeStyle='rgba(170,200,255,.35)';c.lineWidth=1;c.beginPath();for(let k=0;k<120;k++){const x=(k*97+now*0.4)%W,y=(k*53+now*0.9)%H;c.moveTo(x,y);c.lineTo(x-4,y+12)}c.stroke()}
  for(const p of PARTS){c.strokeStyle=p.col;c.globalAlpha=Math.max(0,1-p.age);c.lineWidth=2;c.beginPath();c.arc(sx(p.x),sy(p.y),z*(p.small?0.6:3)+p.age*z*(p.small?1.5:6),0,7);c.stroke()}c.globalAlpha=1;
  if(HOVER&&S.tool!=='select'&&S.tool!=='nest'){c.strokeStyle='rgba(255,210,140,.6)';c.lineWidth=1.5;c.beginPath();c.arc(sx(HOVER[0]),sy(HOVER[1]),S.brush*z,0,7);c.stroke()}}
let HOVER=null,DRAGR=null;const quiet=()=>CH.loading||!$('home').hidden||document.body.classList.contains('mDemo');
const SIM={id:'hivemind',name:'Hivemind',defTool:'food',world:{w:WW,h:WH,wrapX:false,maxZ:40,followZ:18},home:'meadow',freeScen:'meadow',tutScen:'meadow',defSpeed:1,homeSpeed:1,inspectTab:'insp',canFollow:true,
  speeds:[['½×',0.5],['1×',1],['2×',2],['4×',4]],fmtRate:v=>`${v}× speed`,
  dateTxt:()=>`Day ${Math.floor(S.t/DAY)+1}`,dateSub:()=>`${ANTS.length} ants · ${fmtN(Math.round(G.gathered))} food gathered`,stepSize:()=>0.05,
  tools:[['',[['select','👆','Inspect']]],['Build',[['food','🍯','Food','Paint food for the ants to find.',1],['wall','🪨','Wall','Paint rocks the ants must walk around.',1],['erase','🧽','Erase','Remove walls and food.',1],['spray','💨','Spray','Wipe away scent trails: the ants have to find the way again.',1],['nest','🏠','New nest','Click to found a new colony (up to 3).'],['raid','⚔️','Raid','Tap a nest to send its war party, then tap the rival nest to attack (or drag from one to the other).']]]],
  scens:SCENLIST,
  load(id){clearWorld();(SCENS[id]||SCENS.meadow)();syncPanel()},
  after(){if(!$('home').hidden)return;setTool('food')},
  step(dt){const ev=Math.exp(-dt*(G.rain?2.5:1)*1.5/G.fade);for(let c=0;c<NC;c++){if(!NESTS.some(n=>n.c===c)&&!TOF[c][0])continue;const F=TOF[c],Hh=TOH[c];for(let i=0;i<N;i++){F[i]*=ev;Hh[i]*=ev}}
    for(const a of ANTS)antStep(a,dt);fights(dt);
    for(const a of ANTS){if(a.age>a.life&&!a.dead){a.dead=true;a.cause='old age'}if(a.t>80&&!a.carry&&!a.dead){a.dead=true;a.cause='lost'}}
    const before=ANTS.length;ANTS=ANTS.filter(a=>!a.dead);G.deaths+=before-ANTS.length;
    for(const n of [...NESTS])if(antsOf(n.c)===0&&n.store<0.3&&S.t>5){NESTS.splice(NESTS.indexOf(n),1);G.fallen++;chEv('fall',{c:n.c});FX(n.x,n.y,'#ff4040');if(!quiet())toast(`💀 The ${NCOL[n.c].n} colony has fallen`)}
    if(G.raids&&NESTS.length>1){G.raidT-=dt;if(G.raidT<=0){G.raidT=18+R()*12;const big=NESTS.filter(n=>antsOf(n.c)>=40);if(big.length){const f=pick(big),to=pick(NESTS.filter(n=>n!==f));launchRaid(f,to,quiet())}}}
    for(const n of NESTS){if(n.store>=1.5){n.store-=1.5;spawnAnt(n)}else if(antsOf(n.c)<6&&n.store>=0.3){n.store-=0.3;spawnAnt(n)}}
    if(G.feast){G.feastT-=dt;if(G.feastT<=0){G.feastT=3;addFood(5+R()*(WW-10),5+R()*(WH-10),2,5)}}},
  frame(dt){for(const p of PARTS)p.age+=dt*1.4;PARTS=PARTS.filter(p=>p.age<1)},
  render,
  stats:()=>[['Ants',ANTS.length],['Gathered',fmtN(Math.round(G.gathered))],['Colonies',NESTS.length],['Day',Math.floor(S.t/DAY)+1]],
  hud(){const last=HIST[HIST.length-1];if(!last||S.t-last.t>=2)HIST.push({t:S.t,n:CIDX.map(antsOf)});if(HIST.length>300)HIST.shift();syncPanel();renderStats();renderInspect()},
  pick(wx,wy){for(const n of NESTS)if(Math.hypot(n.x-wx,n.y-wy)<n.r*1.3)return{n};let b=null,bd=2.2;for(const a of ANTS){const d=Math.hypot(a.x-wx,a.y-wy);if(d<bd){bd=d;b=a}}return b?{a:b}:null},
  selPos(s){return s.a?[s.a.x,s.a.y]:s.n?[s.n.x,s.n.y]:null},
  pointer(type,wx,wy){HOVER=[wx,wy];const t=S.tool,r=S.brush;if(type==='up'&&t!=='raid')return;
    if(t==='raid'){const nn=NESTS.find(q=>Math.hypot(q.x-wx,q.y-wy)<q.r*1.8);if(type==='down'){if(RAIDPEND&&nn&&nn!==RAIDPEND){launchRaid(RAIDPEND,nn);RAIDPEND=null;syncPanel();return}RAIDPEND=null;if(!nn){toast('Tap a nest to raise a war party');return}DRAGR=nn}
      else if(type==='up'){if(DRAGR&&nn&&nn!==DRAGR){launchRaid(DRAGR,nn);RAIDPEND=null}else if(DRAGR){RAIDPEND=DRAGR;toast(`⚔️ ${NCOL[DRAGR.c].n} war party ready. Tap the nest to attack`)}DRAGR=null;syncPanel()}return}
    if(t==='nest'){if(type!=='down')return;if(blocked(wx,wy)){toast('Nests need open ground');return}if(NESTS.length>=3){toast('Three colonies is the limit');return}const n=addNest(wx,wy,null,20);if(n){NESTADD++;chEv('nest',{c:n.c});toast(`🏠 The ${NCOL[n.c].n} colony is founded`)}syncPanel();return}
    if(t==='food'){FOODADD+=addFood(wx|0,wy|0,r,6);chEv('food',{})}else if(t==='wall'){addWall(wx|0,wy|0,Math.max(1,r*0.6));WALLADD++;chEv('wall',{})}
    else if(t==='erase'){for(let yy=-r;yy<=r;yy++)for(let xx=-r;xx<=r;xx++){if(Math.hypot(xx,yy)>r)continue;const X=(wx|0)+xx,Y=(wy|0)+yy;if(!inW(X,Y))continue;const i=ix(X,Y);WALL[i]=0;FOOD[i]=0}ERASED++;chEv('erase',{})}
    else if(t==='spray'){for(let yy=-r*1.5;yy<=r*1.5;yy++)for(let xx=-r*1.5;xx<=r*1.5;xx++){const X=(wx|0)+xx,Y=(wy|0)+yy;if(!inW(X,Y))continue;const i=ix(X,Y);for(let c=0;c<NC;c++){TOF[c][i]=0;TOH[c][i]=0}}SPRAYED++;chEv('spray',{})}},
  hover(wx,wy){HOVER=[wx,wy]},
  find(q){const out=[],add=(label,sub,go)=>out.push({label,sub,go});for(const n of NESTS)if(NCOL[n.c].n.toLowerCase().includes(q)||'nest colony'.includes(q))add(`🏠 ${NCOL[n.c].n} colony`,`${antsOf(n.c)} ants`,()=>{S.sel={n};flyToW(n.x,n.y,12);showTab('insp')});
    if('ant carrying food'.includes(q)){const a=ANTS.find(a=>a.carry);if(a)add('🐜 An ant carrying food','follow it',()=>{S.sel={a};S.follow=true;flyToW(a.x,a.y,20);showTab('insp')})}
    for(const [,items] of SIM.tools)for(const [id,ico,name] of items)if(id!=='select'&&name.toLowerCase().includes(q))add(`${ico} ${name}`,'tool',()=>setTool(id));
    for(const s of SCENLIST)if(s.name.toLowerCase().includes(q))add('World: '+s.name,s.desc,()=>{loadScen(s.id);toast(s.name)});return out},
  tabShown(id){if(id==='stats')renderStats(true)},selChanged(){renderInspect()},
};
function kv(rows){return rows.map(([k,v])=>`<div><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}
function renderStats(force){if($('pane-stats').hidden&&!force)return;$('cStats').innerHTML=kv([['Ants',ANTS.length],['Carrying food',ANTS.filter(a=>a.carry).length],['Food gathered',fmtN(Math.round(G.gathered))],['Born',G.born],['Died',G.deaths],['Lost in fights',G.kills]]);
  const g=$('graph'),gc=g.getContext('2d'),w=g.width=g.clientWidth*DPR,hh=g.height=g.clientHeight*DPR;gc.clearRect(0,0,w,hh);if(HIST.length>1){const t0=HIST[0].t,t1=HIST[HIST.length-1].t,m=Math.max(10,...HIST.flatMap(p=>p.n));for(let c=0;c<NC;c++){if(!HIST.some(p=>p.n[c]))continue;gc.strokeStyle=NCOL[c].c;gc.lineWidth=2*DPR;gc.beginPath();HIST.forEach((p,i)=>{const x=8+(w-16)*(p.t-t0)/Math.max(1e-6,t1-t0),y=hh-6-(hh-12)*p.n[c]/m;i?gc.lineTo(x,y):gc.moveTo(x,y)});gc.stroke()}}
  const L=$('nList');L.textContent='';for(const n of NESTS){const r=document.createElement('button');r.className='sprow';r.innerHTML='<i></i><span></span><b></b>';r.children[0].style.background=NCOL[n.c].c;r.children[1].textContent=`${NCOL[n.c].n} colony`;r.children[2].textContent=`${antsOf(n.c)} ants`;r.onclick=()=>{S.sel={n};flyToW(n.x,n.y,12);showTab('insp')};L.appendChild(r)}}
function renderInspect(){const s=S.sel;$('inspEmpty').hidden=!!s;$('inspBody').hidden=!s;if(!s)return;const body=$('inspBody');
  if(s.n){const n=s.n;body.innerHTML=`<h2 class="ititle" style="color:${NCOL[n.c].c}">${NCOL[n.c].n} colony</h2><div class="isub">Nest</div><div class="kv">${kv([['Ants',antsOf(n.c)],['Food brought home',Math.round(n.food)],['In the larder',n.store.toFixed(1)],['Ants born here',n.born],['Raiders out',ANTS.filter(a=>a.c===n.c&&a.raid).length]])}</div><p class="note">Every 1.5 food in the larder becomes a new ant.</p>`;return}
  if(s.a){const a=s.a;if(!ANTS.includes(a)){body.innerHTML=`<h2 class="ititle">🐜 Ant</h2><p class="note">This ant has died${a.cause?` (${a.cause})`:''}.</p>`;return}body.innerHTML=`<h2 class="ititle" style="color:${NCOL[a.c].c}">🐜 ${NCOL[a.c].n} ant</h2><div class="isub">${a.raid?'⚔️ Raiding the '+NCOL[a.raid.c].n+' nest':a.carry?(a.stolen?'Carrying stolen food home':'Carrying food home'):'Searching for food'}</div><div class="kv">${kv([['Age',Math.round(a.age)+' s of '+Math.round(a.life)],['Time since nest or food',a.t.toFixed(1)+' s'],['Following',a.carry?'home scent':'food scent']])}</div>`}}

SIM.toolChanged=id=>{if(id!=='raid')RAIDPEND=null};
