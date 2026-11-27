/* ================= Abyssal: a living ocean ================= */
// A side-on slice of ocean 360 units wide and 180 deep (1 unit of depth = 22 m, so the floor can be 4 km down).
// Time is in days. Plankton, nutrients, oxygen and marine snow live on a coarse 4-unit grid; animals are individuals.
const WW=360,WH=180,GS=4,GX=WW/GS,GY=WH/GS,NG=GX*GY,MPU=22,MAXAG=2600;
const P=new Float32Array(NG),Z=new Float32Array(NG),NU=new Float32Array(NG),O2=new Float32Array(NG),DET=new Float32Array(NG),OIL=new Float32Array(NG),HT=new Float32Array(NG),tmpG=new Float32Array(NG);
const FLOOR=new Float32Array(WW+1);let CORAL=[],KELP=[],VENTS=[],AG=[],PLAST=[],BOATS=[],PARTS=[],HIST=[],SNOW=[];
const ENV={temp:0,co2:420,nut:1,boats:0,base:22,heat:false,bloom:false,storm:false,upwell:false};
let LBL=true,STAT={coral:1,o2low:0,pop:{}},RELEASED={},CATCH=0,CLEANED=0,PLANTED=0,FED=0,FEDBY=0,EVN=0,EVSTOP=0,SLIDED=0,HEATED=0,BORN=0,EATEN=0;
const gi=(x,y)=>clamp(Math.floor(y/GS),0,GY-1)*GX+clamp(Math.floor(x/GS),0,GX-1);
const floorAt=x=>FLOOR[clamp(Math.round(x),0,WW)];
const depthM=y=>Math.round(y*MPU);
const lightAt=(y)=>Math.exp(-y/9)*dayLight();
const dayLight=()=>S.speed<=0.26?clamp(0.15+0.85*Math.max(0,Math.sin((mod(S.t,1)-0.25)*Math.PI*2))*1.2,0.15,1):0.75;
const tempAt=y=>{const ts=ENV.base+ENV.temp+(ENV.heat?4:0);return 2+(ts-2)*Math.exp(-y/28)};
const pH=()=>8.2-0.33*Math.log2(ENV.co2/280);
/* ---------- the underwater city ---------- */
const BT={dome:{n:'Habitat dome',ic:'🫧',house:60,pw:-2,food:0,w:7,h:5},tower:{n:'Glass tower',ic:'🏙️',house:160,pw:-5,food:0,w:4,h:16},farm:{n:'Kelp and fish farm',ic:'🌾',house:0,pw:-1,food:120,w:9,h:3},
  power:{n:'Power plant',ic:'⚡',house:0,pw:12,food:0,w:5,h:6},lab:{n:'Research lab',ic:'🔬',house:20,pw:-3,food:0,w:6,h:5},port:{n:'Submarine port',ic:'🚢',house:10,pw:-2,food:0,w:8,h:4}};
let CITY={b:[],subs:[],pop:0,built:0};
function cityStats(){let house=0,pw=0,food=0;for(const b of CITY.b){const t=BT[b.t];house+=t.house;food+=t.food;pw+=t.pw+(b.t==='power'&&VENTS.some(v=>Math.abs(v.x-b.x)<14)?18:0)}return{house,pw,food,cap:Math.max(0,Math.min(house,food+40,pw>=0?house:house*Math.max(0,1+pw/20)))}}
function cityStep(dt){if(!CITY.b.length){CITY.pop=0;return}const st=cityStats();CITY.pop+=(st.cap-CITY.pop)*Math.min(1,dt*0.2);
  for(const b of CITY.b){if(BT[b.t].house){const g=gi(b.x,b.y-3);NU[g]+=CITY.pop/Math.max(1,st.house)*BT[b.t].house*0.00004*dt*ENV.nut}}
  const ports=CITY.b.filter(b=>b.t==='port').length;while(CITY.subs.length<ports*2&&CITY.b.length>1)CITY.subs.push({x:CITY.b[0].x,y:CITY.b[0].y-6,ti:1,ph:Math.random()});while(CITY.subs.length>ports*2)CITY.subs.pop();
  for(const s0 of CITY.subs){const t=CITY.b[s0.ti%CITY.b.length];const tx=t.x,ty=t.y-BT[t.t].h-3,dx=tx-s0.x,dy=ty-s0.y,d=Math.hypot(dx,dy);if(d<2)s0.ti=Math.floor(Math.random()*CITY.b.length);else{s0.x+=dx/d*dt*60;s0.y+=dy/d*dt*60;s0.dir=dx>0?1:-1}}}
function build(t,x){const fy=floorAt(x),bt=BT[t];for(const b of CITY.b)if(Math.abs(b.x-x)<(BT[b.t].w+bt.w)/2){toast('Too close to another building');return false}CITY.b.push({t,x,y:fy,born:S.t});CITY.built++;chEv('build',{t});if(CITY.b.length===1)toast('🏙️ The first building of your underwater city!');return true}
const SP={
 sardine:{n:'Sardine',pl:'Sardines',ic:'🐟',len:1.5,col:'#c8d6e4',sp:70,d:[2,55],z:1,school:1,life:4,mat:0.6,lit:5,max:900,met:0.5,T:[1,30]},
 lantern:{n:'Lanternfish',pl:'Lanternfish',ic:'✨',len:1.2,col:'#7fa8d8',sp:55,d:[45,130],z:1,school:1,life:3,mat:0.5,lit:4,max:600,met:0.4,T:[2,26],glow:'#8fe8ff',migrate:1},
 jelly:{n:'Jellyfish',pl:'Jellyfish',ic:'🪼',len:1.6,col:'#e8a8ff',sp:12,d:[2,80],z:1,life:1,mat:0.2,lit:4,max:380,met:0.25,T:[6,32],drift:1,glow:'#ffb8ff'},
 squid:{n:'Squid',pl:'Squid',ic:'🦑',len:2.4,col:'#ff8a7a',sp:90,d:[20,130],eat:['sardine','lantern'],life:2,mat:0.5,lit:4,max:200,met:0.6,T:[-1,28]},
 tuna:{n:'Tuna',pl:'Tuna',ic:'🐟',len:3.6,col:'#6a88b8',sp:110,d:[2,70],eat:['sardine','squid','lantern'],school:1,life:12,mat:2,lit:3,max:140,met:0.9,T:[12,30]},
 dolphin:{n:'Dolphin',pl:'Dolphins',ic:'🐬',len:4,col:'#9aaab8',sp:120,d:[0,50],eat:['sardine','squid'],school:1,life:30,mat:5,lit:1,max:60,met:0.6,T:[8,30],air:1},
 seal:{n:'Seal',pl:'Seals',ic:'🦭',len:3.2,col:'#8a7a6a',sp:90,d:[0,45],eat:['sardine','tuna','squid'],life:25,mat:4,lit:1,max:50,met:0.55,T:[-2,16],air:1},
 turtle:{n:'Sea turtle',pl:'Sea turtles',ic:'🐢',len:2.8,col:'#7a9a5a',sp:35,d:[0,40],eat:['jelly'],life:60,mat:8,lit:4,max:50,met:0.3,T:[16,32],air:1},
 shark:{n:'Shark',pl:'Sharks',ic:'🦈',len:7,col:'#7a8a9a',sp:100,d:[2,120],eat:['tuna','seal','turtle','squid','dolphin','sardine'],life:40,mat:8,lit:2,max:24,met:0.7,T:[4,30]},
 whale:{n:'Blue whale',pl:'Blue whales',ic:'🐋',len:16,col:'#5a7aa0',sp:45,d:[0,90],z:1,big:1,life:80,mat:10,lit:1,max:12,met:0.4,T:[-2,28],air:1},
 angler:{n:'Anglerfish',pl:'Anglerfish',ic:'🎣',len:2,col:'#4a3a3a',sp:20,d:[110,180],eat:['lantern','squid','sardine'],life:10,mat:2,lit:6,max:60,met:0.15,T:[0,12],glow:'#9fffe0',lure:1},
 crab:{n:'Crab',pl:'Crabs',ic:'🦀',len:1.4,col:'#e06a3a',sp:15,floor:1,det:1,life:6,mat:1,lit:5,max:220,met:0.3,T:[0,34]},
};
const SPK=Object.keys(SP);
const RANGE=k=>{const s=SP[k];return s.d||[0,WH]};

/* ---------- world ---------- */
function setFloor(f){for(let x=0;x<=WW;x++)FLOOR[x]=clamp(f(x),8,WH-2)}
function clearOcean(){CITY={b:[],subs:[],pop:0,built:0};AG=[];CORAL=[];KELP=[];VENTS=[];PLAST=[];BOATS=[];PARTS=[];HIST=[];SNOW=[];RELEASED={};Object.assign(ENV,{temp:0,co2:420,nut:1,boats:0,base:22,heat:false,bloom:false,storm:false,upwell:false});OIL.fill(0);HT.fill(0)}
function initFields(){for(let j=0;j<GY;j++)for(let i=0;i<GX;i++){const g=j*GX+i,y=(j+.5)*GS;P[g]=y<40?0.35*Math.exp(-y/25):0.01;Z[g]=y<80?0.3*Math.exp(-y/40):0.04;NU[g]=0.2+0.6*(1-Math.exp(-y/40));O2[g]=1-0.35*Math.exp(-(((y-90)/35)**2));DET[g]=0.02}}
function spawnN(k,n,x0,x1){const [d0,d1]=RANGE(k);for(let q=0;q<n;q++){const x=rr(x0??4,x1??WW-4);const fy=floorAt(x);const y=SP[k].floor?fy-0.8:clamp(rr(d0,d1),1,fy-2);addAg(k,x,y,{age:rr(0,SP[k].life*0.6)*365})}}
function addAg(k,x,y,o){if(AG.length>=MAXAG)return null;const s=SP[k];const a={sp:k,x,y,vx:rr(-1,1)*s.sp*0.3,vy:rr(-1,1)*s.sp*0.1,e:0.7,age:0,air:1,kids:0,kills:0,id:Math.random(),dir:1,...(o||{})};AG.push(a);return a}
function reef(x0,x1){for(let x=x0;x<=x1;x+=1.6){const y=floorAt(x);if(y<60)CORAL.push({x:x+rr(-.5,.5),y:y-rr(0,1.5),h:rr(0.7,1),kind:pick(['brain','branch','fan','table']),col:pick(['#ff7a8a','#ffb05a','#c88aff','#5ae0c0','#ffd45a','#ff9adf']),r:rr(1,2.3)})}}
function kelpAt(x0,x1,n){for(let q=0;q<n;q++){const x=rr(x0,x1),y=floorAt(x);if(y<70)KELP.push({x,y,len:rr(10,Math.min(40,y-2)),ph:Math.random()*6})}}
const SCENS={
  reef:()=>{ENV.base=28;setFloor(x=>{const c=Math.abs(x-180)/180;return 18+Math.pow(c,1.6)*150+Math.sin(x/11)*2});reef(110,250);kelpAt(60,100,6);spawnN('sardine',260);spawnN('jelly',50);spawnN('turtle',10,100,260);spawnN('shark',5);spawnN('tuna',30);spawnN('squid',30);spawnN('crab',40,100,260);spawnN('dolphin',8);spawnN('lantern',120)},
  open:()=>{ENV.base=21;setFloor(x=>165+Math.sin(x/30)*6);spawnN('sardine',320);spawnN('tuna',50);spawnN('shark',8);spawnN('dolphin',14);spawnN('whale',4);spawnN('squid',50);spawnN('lantern',220);spawnN('jelly',60);spawnN('angler',20);spawnN('crab',30)},
  kelp:()=>{ENV.base=14;setFloor(x=>x<220?30+x*0.05+Math.sin(x/9)*3:30+(x-220)*1+Math.sin(x/9)*3);kelpAt(10,210,70);spawnN('sardine',220,0,250);spawnN('seal',14);spawnN('shark',5);spawnN('crab',60,0,220);spawnN('squid',30);spawnN('jelly',30)},
  vents:()=>{ENV.base=18;setFloor(x=>150+Math.sin(x/14)*10+(Math.abs(x-180)<30?-12+Math.abs(x-180)*0.4:0));for(const vx of [150,180,212])VENTS.push({x:vx,y:floorAt(vx)-1});spawnN('angler',30);spawnN('lantern',260);spawnN('squid',50);spawnN('crab',90,130,240);spawnN('sardine',120);spawnN('shark',4)},
  polar:()=>{ENV.base=1;setFloor(x=>120+Math.sin(x/25)*15);spawnN('whale',7);spawnN('seal',22);spawnN('lantern',150);spawnN('squid',40);spawnN('sardine',150);spawnN('crab',40);spawnN('shark',3);for(let g=0;g<NG;g++)Z[g]*=1.8},
  deadzone:()=>{ENV.base=24;ENV.nut=4;setFloor(x=>12+x*0.4);reef(20,90);spawnN('sardine',250,0,250);spawnN('tuna',25);spawnN('crab',50,0,200);spawnN('jelly',60);spawnN('shark',3)},
  empty:()=>{ENV.base=20;setFloor(x=>140+Math.sin(x/20)*8)},
};
const SCENLIST=[{id:'reef',name:'Coral reef',desc:'Warm, clear, shallow water full of colourful coral, turtles and fish.'},{id:'open',name:'Open ocean',desc:'Deep blue water with tuna, sharks, dolphins and whales, and the dark deep below.'},
  {id:'kelp',name:'Kelp forest',desc:'Cold coastal water with towering kelp, seals and crabs.'},{id:'vents',name:'Deep-sea vents',desc:'Two kilometres down: hot springs, anglerfish and glowing lanternfish.'},
  {id:'polar',name:'Polar sea',desc:'Icy water rich in krill, feeding whales and seals.'},{id:'deadzone',name:'River mouth',desc:'Farm runoff pours nutrients into the sea. Watch for a dead zone.'},{id:'empty',name:'Empty ocean',desc:'Lifeless water. Build your own ecosystem.'}];

/* ---------- fields ---------- */
function fieldStep(dt){const T0=ENV.base+ENV.temp+(ENV.heat?4:0);
  for(let j=0;j<GY;j++){const y=(j+.5)*GS,L=lightAt(y),Tf=clamp(1-Math.abs(tempAt(y)-15)/40,0.5,1);for(let i=0;i<GX;i++){const g=j*GX+i;if(y>floorAt((i+.5)*GS)){P[g]=Z[g]=0;continue}
    const gr=1.6*L*NU[g]/(NU[g]+0.15)*Tf*(1-P[g])*(ENV.bloom?2.5:1)*(1-OIL[g]);const dp=gr*P[g]*dt;P[g]+=dp+0.0004*dt*L;NU[g]=Math.max(0,NU[g]-dp*0.8);O2[g]=Math.min(1.2,O2[g]+dp*0.6);
    const graze=0.9*P[g]*Z[g]*dt;P[g]-=graze;Z[g]+=graze*0.8-0.04*Z[g]*dt+0.0006*dt;P[g]-=P[g]*0.04*dt;DET[g]+=graze*0.3+P[g]*0.04*dt+0.05*Z[g]*dt;
    const rot=DET[g]*0.08*dt*(O2[g]>0.05?1:0.2);DET[g]-=rot;NU[g]+=rot*0.9;O2[g]-=rot*1.6+0.003*dt*(y<150?1:0.3);
    if(j===0){O2[g]+=(1-O2[g])*Math.min(1,dt*(ENV.storm?3:0.8))}if(O2[g]<0)O2[g]=0;OIL[g]*=Math.exp(-dt*0.01);P[g]=clamp(P[g],0,1);Z[g]=clamp(Z[g],0,1.2)}}
  // marine snow sinks, water mixes, rivers add nutrients near the left shore, upwelling brings deep nutrients up at the right
  for(let j=GY-1;j>0;j--)for(let i=0;i<GX;i++){const g=j*GX+i,u=g-GX,m=DET[u]*Math.min(1,dt*0.6);if((j+.5)*GS<floorAt((i+.5)*GS)){DET[u]-=m;DET[g]+=m}}
  const mix=Math.min(0.2,dt*(ENV.storm?2:0.3));tmpG.set(NU);for(let j=0;j<GY;j++)for(let i=0;i<GX;i++){const g=j*GX+i;let s=0,n=0;for(const k of [g-1,g+1,g-GX,g+GX])if(k>=0&&k<NG&&Math.abs((k%GX)-i)<=1){s+=tmpG[k];n++}NU[g]+=(s/n-NU[g])*mix}
  for(let j=0;j<4;j++)for(let i=0;i<5;i++)NU[j*GX+i]+=0.05*ENV.nut*dt;
  if(ENV.upwell)for(let j=0;j<GY;j++){const i=GX-6;const g=j*GX+i;const dg=Math.min(NG-1,(j+8)*GX+i);NU[g]=Math.max(NU[g],NU[dg]*0.9)}
  for(const v of VENTS){const g=gi(v.x,v.y-1);NU[g]+=0.3*dt;DET[g]+=0.05*dt;HT[g]=8}
  if(ENV.storm&&Math.random()<dt*2)for(let g=0;g<GX*3;g++){NU[g]+=0.02}}

/* ---------- animals ---------- */
const GC=8,HX=Math.ceil(WW/GC)+1,HY=Math.ceil(WH/GC)+1;let HB=[];
function bucket(){HB=Array.from({length:HX*HY},()=>[]);for(const a of AG)HB[clamp((a.y/GC)|0,0,HY-1)*HX+clamp((a.x/GC)|0,0,HX-1)].push(a)}
function near(x,y,r,f){const x0=Math.max(0,((x-r)/GC)|0),x1=Math.min(HX-1,((x+r)/GC)|0),y0=Math.max(0,((y-r)/GC)|0),y1=Math.min(HY-1,((y+r)/GC)|0);for(let j=y0;j<=y1;j++)for(let i=x0;i<=x1;i++)for(const b of HB[j*HX+i])f(b)}
const PREDS={};for(const k of SPK)for(const p of (SP[k].eat||[]))(PREDS[p]=PREDS[p]||[]).push(k);
function die(a,cause){if(a.dead)return;a.dead=true;a.cause=cause;DET[gi(a.x,a.y)]+=0.02*SP[a.sp].len;chEv('death',{sp:a.sp,cause});if(S.sel&&S.sel.a===a)toast(`${SP[a.sp].n} died: ${cause}`)}
function animals(dt){bucket();const born=[];const cnt={};for(const a of AG)cnt[a.sp]=(cnt[a.sp]||0)+1;
  for(const a of AG){if(a.dead)continue;const s=SP[a.sp];a.age+=dt;const fy=floorAt(a.x);let ax=0,ay=0;
    // depth preference (lanternfish rise at night)
    let [d0,d1]=RANGE(a.sp);if(s.migrate&&dayLight()<0.4){d0=5;d1=60}const tgtY=s.floor?fy-0.8:null;
    if(tgtY!=null){ay+=(tgtY-a.y)*4}else{if(a.y<d0)ay+=(d0-a.y)*2;if(a.y>d1)ay-=(a.y-d1)*2}
    if(s.air){a.air-=dt*(s.big?0.35:1.2);if(a.y<2)a.air=Math.min(1,a.air+dt*20);if(a.air<-0.3){die(a,'drowned');continue}}
    if(a.y>fy-1.5)ay-=(a.y-(fy-1.5))*8;if(a.y<0.5)ay+=4;
    // food
    let target=null,flee=null,td=1e9;const sense=s.len*4+10;
    const gasp=s.air&&a.air<0.3;if(s.eat&&a.e<(a.sp==='squid'?0.7:0.5)&&!gasp){near(a.x,a.y,sense,b=>{if(b.dead||b===a||!s.eat.includes(b.sp))return;const d=(b.x-a.x)**2+(b.y-a.y)**2;if(d<td){td=d;target=b}})}
    const pr=PREDS[a.sp];if(pr){let fd=1e9;near(a.x,a.y,s.len*3+8,b=>{if(b.dead||!pr.includes(b.sp)||b.e>0.5)return;const d=(b.x-a.x)**2+(b.y-a.y)**2;if(d<fd){fd=d;flee=b}})}
    if(gasp){}else if(flee){const d=Math.sqrt((flee.x-a.x)**2+(flee.y-a.y)**2)||1;ax-=(flee.x-a.x)/d*s.sp*2;ay-=(flee.y-a.y)/d*s.sp*2}
    else if(target){const d=Math.sqrt(td)||1;ax+=(target.x-a.x)/d*s.sp*2;ay+=(target.y-a.y)/d*s.sp*2;if(d<(s.len+SP[target.sp].len)*0.6&&Math.random()<0.25){die(target,'eaten by a '+s.n.toLowerCase());a.e=Math.min(1,a.e+0.35+SP[target.sp].len/s.len*0.6);a.kills++;EATEN++;chEv('eat',{pred:a.sp,prey:target.sp})}}
    else if(s.z){const g=gi(a.x,a.y);const want=Math.min(Z[g],dt*0.5*(s.big?6:1)*s.len*0.3);Z[g]-=want;a.e=Math.min(1,a.e+want*(s.big?1.2:4));if(Z[g]<0.08){const gr=gi(a.x+6,a.y),gl=gi(a.x-6,a.y);ax+=(Z[gr]-Z[gl])*s.sp*6}}
    else if(s.det){const g=gi(a.x,fy-2);const want=Math.min(DET[g],dt*0.3);DET[g]-=want;a.e=Math.min(1,a.e+want*5)}
    // schooling
    if(s.school){let cx=0,cy=0,vx=0,vy=0,n=0,sx2=0,sy2=0;near(a.x,a.y,6,b=>{if(b===a||b.sp!==a.sp||b.dead)return;const dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy;if(d2>36)return;cx+=b.x;cy+=b.y;vx+=b.vx;vy+=b.vy;n++;if(d2<s.len*s.len*1.4){sx2-=dx;sy2-=dy}});
      if(n){ax+=(cx/n-a.x)*1.5+(vx/n-a.vx)*0.8+sx2*8;ay+=(cy/n-a.y)*1.5+(vy/n-a.vy)*0.8+sy2*8}}
    // wander
    a.wt=(a.wt||0)-dt;if(a.wt<=0){a.wt=rr(0.02,0.08);a.wx=rr(-1,1)*s.sp;a.wy=rr(-.4,.4)*s.sp}ax+=a.wx*(s.drift?0.3:1);ay+=a.wy*(s.drift?0.3:1);
    if(s.drift)ay+=Math.sin(S.t*40+a.id*9)*s.sp*0.6;
    // low oxygen: flee upward, suffocate
    const o=O2[gi(a.x,a.y)];if(o<0.25&&!s.air){ay-=s.sp*1.5;a.e-=dt*(0.25-o)*6;if(a.e<0){die(a,'no oxygen');continue}}
    if(OIL[gi(a.x,a.y)]>0.3){a.e-=dt*OIL[gi(a.x,a.y)]*2}
    const T=tempAt(a.y);if(T<s.T[0]||T>s.T[1])a.e-=dt*0.6;
    if(gasp){ax*=0.1;ay=-s.sp*6}
    a.vx+=ax*dt*6;a.vy+=ay*dt*6;const sp=Math.hypot(a.vx,a.vy),mx=s.sp*(flee||target||gasp?1.4:0.8);if(sp>mx){a.vx*=mx/sp;a.vy*=mx/sp}
    a.x+=a.vx*dt;a.y+=a.vy*dt;if(a.x<1){a.x=1;a.vx=Math.abs(a.vx)}if(a.x>WW-1){a.x=WW-1;a.vx=-Math.abs(a.vx)}a.y=clamp(a.y,0.3,floorAt(a.x)-0.5);if(Math.abs(a.vx)>0.5)a.dir=a.vx>0?1:-1;
    a.e-=dt*s.met*0.08*(1+(ENV.heat?0.3:0));
    if(a.e<=0){die(a,'starved');continue}if(a.age>s.life*365*rr(0.85,1.15)){die(a,'old age');continue}
    // babies
    if(a.age>s.mat*365&&a.e>0.75&&(cnt[a.sp]||0)<s.max&&Math.random()<dt*(s.big?0.002:0.08)/Math.max(1,s.mat)){a.e-=0.35;const n=Math.max(1,Math.round(s.lit*rr(0.5,1.2)));for(let q=0;q<n;q++)born.push([a.sp,a.x+rr(-1,1),a.y+rr(-1,1)]);a.kids+=n;cnt[a.sp]=(cnt[a.sp]||0)+n;BORN+=n;chEv('birth',{sp:a.sp,n})}}
  AG=AG.filter(a=>!a.dead);for(const [k,x,y] of born)addAg(k,x,y,{e:0.6});
  // small fish swim in from the wider ocean if they get very rare (only species that have lived here)
  for(const k of ['sardine','lantern'])if((cnt[k]||0)<12&&(S.seen||{})[k]&&Math.random()<dt*0.5)spawnN(k,4)}
function coralStep(dt){const T=tempAt(20),ph=pH();let tot=0;for(const c of CORAL){const T2=tempAt(c.y);const stress=Math.max(0,T2-30.5)*0.5+Math.max(0,7.95-ph)*6+OIL[gi(c.x,c.y)]*2+(O2[gi(c.x,c.y)]<0.2?1:0);
  if(stress>0)c.h-=dt*stress*0.03;else c.h=Math.min(1,c.h+dt*0.004*(1+P[gi(c.x,c.y)]));c.h=clamp(c.h,0,1);tot+=c.h}STAT.coral=CORAL.length?tot/CORAL.length:0;
  for(const k of KELP){const T2=tempAt(k.y-k.len/2);if(T2>22)k.len=Math.max(2,k.len-dt*0.3);else k.len=Math.min(Math.min(45,k.y-1),k.len+dt*0.15*NU[gi(k.x,k.y-k.len)]*3)}}
function boatsStep(dt){while(BOATS.length<ENV.boats)BOATS.push({x:rr(10,WW-10),d:Math.random()<.5?1:-1,net:0});while(BOATS.length>ENV.boats)BOATS.pop();
  for(const b of BOATS){b.x+=b.d*dt*60;if(b.x<5||b.x>WW-5)b.d*=-1;b.net=Math.min(35,b.net+dt*40);near(b.x-b.d*4,b.net,7,a=>{if(a.dead||a.sp==='crab'||a.sp==='angler')return;if(Math.abs(a.x-(b.x-b.d*4))<5&&a.y<b.net+2&&a.y>2&&Math.random()<dt*30){die(a,'caught in a net');CATCH++;chEv('catch',{sp:a.sp})}})}}

/* ---------- player actions ---------- */
function doEvent(ev){EVN++;chEv('event',{ev});const tog=['heat','bloom','storm','upwell'];const key={heatwave:'heat',bloom:'bloom',storm:'storm',upwell:'upwell'}[ev];
  if(ev==='normal'){if(ENV.heat||ENV.bloom||ENV.storm||ENV.upwell)EVSTOP++;for(const k of tog)ENV[k]=false;toast('All events stopped');syncUI();return}
  if(key){if(ENV[key]){ENV[key]=false;EVSTOP++;chEv('stop',{ev});toast('Stopped')}else{ENV[key]=true;toast({heat:'☀ A marine heatwave warms the surface by 4 °C',bloom:'🟢 An algae bloom spreads across the surface',storm:'🌊 A storm churns the sea and stirs it up',upwell:'⬆ Cold, rich deep water wells up along the coast'}[key])}syncUI();return}
  if(ev==='oil'){const x=rr(60,WW-60);for(let i=-8;i<=8;i++)for(let j=0;j<2;j++){const g=j*GX+clamp(Math.floor(x/GS)+i,0,GX-1);OIL[g]=Math.min(1,OIL[g]+0.9*(1-Math.abs(i)/9))}toast('🛢 A tanker spills oil on the surface');flyToW(x,10,4)}
  if(ev==='plastic'){const x=rr(40,WW-40);for(let k=0;k<120;k++)PLAST.push({x:x+rr(-30,30),y:rr(0.5,30),vy:rr(-.2,.4),ph:Math.random()*6,c:pick(['#f0f0f0','#4aa8ff','#ff5a5a','#ffd45a','#5ae08a'])});toast('🧴 A patch of plastic drifts in')}
  if(ev==='migrate'){spawnN('whale',4);toast('🐋 A pod of blue whales arrives')}syncUI()}
function syncUI(){$('tempS').value=ENV.temp;$('tempV').textContent=(ENV.temp>=0?'+':'')+ENV.temp+' °C';$('co2S').value=ENV.co2;$('co2V').textContent=ENV.co2+' ppm';$('nutS').value=Math.round(ENV.nut*100);$('nutV').textContent=Math.round(ENV.nut*100)+'%';$('boatS').value=ENV.boats;$('boatV').textContent=ENV.boats;
  const lab={heatwave:['heat','☀ Marine heatwave'],bloom:['bloom','🟢 Algae bloom'],storm:['storm','🌊 Storm'],upwell:['upwell','⬆ Upwelling']};document.querySelectorAll('[data-ev]').forEach(b=>{const L=lab[b.dataset.ev];if(!L)return;b.setAttribute('aria-pressed',ENV[L[0]]);b.textContent=ENV[L[0]]?'■ Stop '+L[1].slice(2).toLowerCase():L[1]})}
for(const [id,k,f,t] of [['tempS','temp',v=>v,v=>(v>=0?'+':'')+v+' °C'],['co2S','co2',v=>v,v=>v+' ppm'],['nutS','nut',v=>v/100,v=>v+'%'],['boatS','boats',v=>v,v=>v]])$(id).addEventListener('input',e=>{const v=+e.target.value;ENV[k]=f(v);$(id.replace('S','V')).textContent=t(v);SLIDED++;chEv('slider',{k})});
document.querySelectorAll('[data-ev]').forEach(b=>b.onclick=()=>doEvent(b.dataset.ev));
$('lblBtn').onclick=()=>{LBL=!LBL;$('lblBtn').setAttribute('aria-pressed',LBL);$('lblBtn').textContent=LBL?'On':'Off'};
function release(k,x,y,n){let c=0;for(let q=0;q<n;q++){const s=SP[k],fy=floorAt(x);const yy=s.floor?fy-0.8:clamp(y+rr(-2,2),0.5,fy-1);if(addAg(k,clamp(x+rr(-2,2),1,WW-1),yy,{age:s.mat*365*rr(1,1.4),e:0.8}))c++}RELEASED[k]=(RELEASED[k]||0)+c;chEv('release',{sp:k,n:c});return c}

/* ---------- rendering ---------- */
const FUP=5,fimg=document.createElement('canvas');fimg.width=GX*FUP;fimg.height=GY*FUP;const fg=fimg.getContext('2d'),FID=fg.createImageData(GX*FUP,GY*FUP),FC=new Float32Array(NG*4);
function fieldImage(){const v=S.view,d=FC;for(let g=0;g<NG;g++){const o=g*4;let r=0,gg=0,b=0,a=0;const y=((g/GX|0)+.5)*GS;
  if(v==='normal'){a=clamp(P[g]*0.9,0,0.55)*255;r=60;gg=200;b=90;if(OIL[g]>0.05){r=20;gg=16;b=10;a=Math.min(230,OIL[g]*260)}}
  else if(v==='plankton'){const t=clamp(P[g]*1.5,0,1),z=clamp(Z[g],0,1);r=40+z*200;gg=60+t*190;b=80;a=200}
  else if(v==='oxygen'){const t=clamp(O2[g],0,1);r=255*(1-t);gg=80+120*t;b=255*t;a=200}
  else if(v==='temp'){const t=clamp((tempAt(y)+HT[g]*0.2-2)/30,0,1);r=255*t;gg=90+60*(1-Math.abs(t-0.5)*2);b=255*(1-t);a=200}
  else if(v==='nutrients'){const t=clamp(NU[g],0,1);r=200*t;gg=150*t;b=60;a=200}
  FC[o]=r;FC[o+1]=gg;FC[o+2]=b;FC[o+3]=a}
  // smooth upsampling: each cell blends into its neighbours with an S-curve, so no blocks show
  const W2=GX*FUP,H2=GY*FUP,D=FID.data;for(let py=0;py<H2;py++){const gy=clamp((py+0.5)/FUP-0.5,0,GY-1.001),y0=gy|0,ty0=gy-y0,ty=ty0*ty0*(3-2*ty0),y1=Math.min(GY-1,y0+1);
    for(let px=0;px<W2;px++){const gx=clamp((px+0.5)/FUP-0.5,0,GX-1.001),x0=gx|0,tx0=gx-x0,tx=tx0*tx0*(3-2*tx0),x1=Math.min(GX-1,x0+1),a=(y0*GX+x0)*4,b=(y0*GX+x1)*4,c=(y1*GX+x0)*4,e=(y1*GX+x1)*4,w0=(1-tx)*(1-ty),w1=tx*(1-ty),w2=(1-tx)*ty,w3=tx*ty,o=(py*W2+px)*4;
      for(let k=0;k<4;k++)D[o+k]=FC[a+k]*w0+FC[b+k]*w1+FC[c+k]*w2+FC[e+k]*w3}}fg.putImageData(FID,0,0)}
function legendFor(v){const L={plankton:['Plankton','linear-gradient(90deg,#283c50,#3cb450,#e8c850)',['none','plant plankton','+ animal plankton']],oxygen:['Oxygen','linear-gradient(90deg,#ff5000,#c8a080,#0078ff)',['dead zone','','plenty']],temp:['Water temperature','linear-gradient(90deg,#0050ff,#a080a0,#ff3c00)',['2 °C','17 °C','32 °C']],nutrients:['Nutrients','linear-gradient(90deg,#000020,#c89640)',['poor','','rich']]}[v];if(L)setLegend(...L);else setLegend(null)}
function drawFish(c,a,X,Y,z){const s=SP[a.sp],L=Math.max(3,s.len*z),d=a.dir;c.save();c.translate(X,Y);c.scale(d,1);const ang=clamp(Math.atan2(a.vy,Math.abs(a.vx)+1e-3),-0.6,0.6);c.rotate(ang);
  c.fillStyle=s.col;
  if(a.sp==='jelly'){c.scale(d,1);c.rotate(-ang);const p=Math.sin(S.t*60+a.id*20)*0.15;c.fillStyle='rgba(232,168,255,.75)';c.beginPath();c.ellipse(0,0,L*0.5,L*(0.38+p),0,Math.PI,0);c.fill();c.strokeStyle='rgba(232,168,255,.5)';c.lineWidth=1;for(let k=-2;k<=2;k++){c.beginPath();c.moveTo(k*L*0.15,0);c.quadraticCurveTo(k*L*0.2+Math.sin(S.t*50+k)*2,L*0.5,k*L*0.12,L*0.9);c.stroke()}c.restore();return}
  if(a.sp==='crab'){c.scale(d,1);c.rotate(-ang);c.beginPath();c.ellipse(0,0,L*0.55,L*0.35,0,0,7);c.fill();c.strokeStyle=s.col;c.lineWidth=Math.max(1,L*0.12);for(const k of [-1,1]){c.beginPath();c.moveTo(k*L*0.4,0);c.lineTo(k*L*0.8,L*0.3);c.stroke();c.beginPath();c.arc(k*L*0.7,-L*0.35,L*0.18,0,7);c.fill()}c.restore();return}
  if(a.sp==='turtle'){c.fillStyle='#5a7a3a';c.beginPath();c.ellipse(0,0,L*0.5,L*0.32,0,0,7);c.fill();c.fillStyle='#9aba7a';c.beginPath();c.arc(L*0.55,0,L*0.15,0,7);c.fill();c.beginPath();c.ellipse(L*0.2,L*0.32,L*0.25,L*0.08,0.6,0,7);c.ellipse(-L*0.25,L*0.3,L*0.18,L*0.07,-0.6,0,7);c.fill();c.restore();return}
  if(a.sp==='squid'){c.beginPath();c.moveTo(L*0.6,0);c.lineTo(-L*0.1,-L*0.18);c.lineTo(-L*0.1,L*0.18);c.closePath();c.fill();c.strokeStyle=s.col;c.lineWidth=Math.max(1,L*0.06);for(let k=-2;k<=2;k++){c.beginPath();c.moveTo(-L*0.1,k*L*0.05);c.quadraticCurveTo(-L*0.4,k*L*0.12+Math.sin(S.t*80+k)*L*0.05,-L*0.65,k*L*0.1);c.stroke()}c.restore();return}
  // fish-shaped body
  const hgt=s.big?0.18:a.sp==='shark'?0.17:a.sp==='dolphin'||a.sp==='seal'?0.2:0.26;c.beginPath();c.ellipse(0,0,L*0.5,L*hgt,0,0,7);c.fill();
  c.beginPath();c.moveTo(-L*0.42,0);c.lineTo(-L*0.7,-L*hgt*1.4);c.lineTo(-L*0.62,0);c.lineTo(-L*0.7,L*hgt*1.4);c.closePath();c.fill();
  if(a.sp==='shark'||a.sp==='dolphin'){c.beginPath();c.moveTo(0,-L*hgt*0.8);c.lineTo(-L*0.12,-L*hgt*2.2);c.lineTo(-L*0.2,-L*hgt*0.8);c.fill()}
  if(s.big||a.sp==='shark'||a.sp==='tuna'||a.sp==='dolphin'){c.fillStyle='rgba(255,255,255,.18)';c.beginPath();c.ellipse(L*0.05,L*hgt*0.45,L*0.38,L*hgt*0.45,0,0,7);c.fill()}
  if(L>6){c.fillStyle='#111';c.beginPath();c.arc(L*0.33,-L*hgt*0.25,Math.max(0.8,L*0.03),0,7);c.fill()}
  if(s.lure){c.strokeStyle='rgba(160,255,220,.6)';c.lineWidth=1;c.beginPath();c.moveTo(L*0.3,-L*hgt);c.quadraticCurveTo(L*0.6,-L*0.6,L*0.75,-L*0.3);c.stroke();c.fillStyle='#bfffe8';c.shadowColor='#9fffe0';c.shadowBlur=10;c.beginPath();c.arc(L*0.75,-L*0.3,Math.max(1.5,L*0.07),0,7);c.fill();c.shadowBlur=0}
  c.restore()}
function render(c,now){c.fillStyle='rgb(3,8,18)';c.fillRect(0,0,W,H);const z=cam.z,X0=sx(0),Y0=sy(0),X1=sx(WW),Y1=sy(WH);
  // sky and water
  const sky=c.createLinearGradient(0,sy(-20),0,Y0);const dl=dayLight();sky.addColorStop(0,`rgba(${40*dl},${70*dl},${120*dl},1)`);sky.addColorStop(1,`rgba(${120*dl+20},${170*dl+20},${220*dl+30},1)`);c.fillStyle=sky;c.fillRect(X0,sy(-30),X1-X0,Y0-sy(-30));
  const wg=c.createLinearGradient(0,Y0,0,Y1);const T0=ENV.base+ENV.temp;const warm=clamp((T0-10)/20,0,1);wg.addColorStop(0,`rgb(${30+warm*20},${130+warm*40},${190+warm*20})`);wg.addColorStop(0.08,`rgb(14,${70+warm*20},140)`);wg.addColorStop(0.3,'rgb(6,28,70)');wg.addColorStop(0.7,'rgb(2,8,24)');wg.addColorStop(1,'rgb(1,3,10)');c.fillStyle=wg;c.fillRect(X0,Y0,X1-X0,Y1-Y0);
  // sun rays
  c.save();c.globalAlpha=0.07*dl;c.fillStyle='#fff';for(let k=0;k<9;k++){const x=((k*47+now*0.003)%WW);c.beginPath();c.moveTo(sx(x),Y0);c.lineTo(sx(x+6),Y0);c.lineTo(sx(x-14),sy(45));c.lineTo(sx(x-22),sy(45));c.fill()}c.restore();
  // fields
  if(this.fT===undefined||now-this.fT>200){fieldImage();this.fT=now}c.imageSmoothingEnabled=true;c.drawImage(fimg,X0,Y0,X1-X0,Y1-Y0);
  // marine snow
  c.fillStyle='rgba(220,230,240,.35)';for(const p of SNOW){const X=sx(p.x),Y=sy(p.y);if(X<0||X>W||Y<0||Y>H)continue;c.fillRect(X,Y,1.3,1.3)}
  // kelp
  for(const k of KELP){const X=sx(k.x),Yb=sy(k.y),n=8;c.strokeStyle='rgba(120,150,40,.9)';c.lineWidth=Math.max(1.5,z*0.5);c.beginPath();c.moveTo(X,Yb);let px=X,py=Yb;for(let s=1;s<=n;s++){const yy=k.y-k.len*s/n,xx=k.x+Math.sin(now*0.0015+k.ph+s*0.6)*s*0.35;px=sx(xx);py=sy(yy);c.lineTo(px,py)}c.stroke();
    c.fillStyle='rgba(140,170,50,.75)';for(let s=2;s<=n;s+=1){const yy=k.y-k.len*s/n,xx=k.x+Math.sin(now*0.0015+k.ph+s*0.6)*s*0.35;c.beginPath();c.ellipse(sx(xx)+z*0.6,sy(yy),z*0.9,z*0.3,0.5,0,7);c.fill()}}
  // floor
  c.fillStyle='#2a2418';c.beginPath();c.moveTo(X0,Y1+50);for(let x=0;x<=WW;x+=2)c.lineTo(sx(x),sy(FLOOR[x]));c.lineTo(X1,Y1+50);c.closePath();c.fill();
  c.strokeStyle='rgba(200,180,130,.45)';c.lineWidth=2;c.beginPath();for(let x=0;x<=WW;x+=2){const X=sx(x),Y=sy(FLOOR[x]);x?c.lineTo(X,Y):c.moveTo(X,Y)}c.stroke();
  // vents
  for(const v of VENTS){const X=sx(v.x),Y=sy(v.y);c.fillStyle='#1a1410';c.beginPath();c.moveTo(X-z*2,Y+z);c.lineTo(X-z*0.6,Y-z*4);c.lineTo(X+z*0.6,Y-z*4);c.lineTo(X+z*2,Y+z);c.fill();for(let k=0;k<6;k++){const t=(now*0.001+k/6)%1;c.fillStyle=`rgba(60,50,45,${0.6*(1-t)})`;c.beginPath();c.arc(X+Math.sin(k+now*0.002)*z*t*2,Y-z*4-t*z*14,z*(0.8+t*2.5),0,7);c.fill()}}
  // coral
  for(const cr of CORAL){const X=sx(cr.x),Y=sy(cr.y),R0=cr.r*z;const h=cr.h,col=h>0.35?cr.col:'#f4f0ea';c.globalAlpha=0.55+0.45*Math.max(h,0.4);c.fillStyle=col;
    if(cr.kind==='branch'){c.strokeStyle=col;c.lineWidth=Math.max(1.5,R0*0.3);for(let k=-1;k<=1;k++){c.beginPath();c.moveTo(X,Y);c.lineTo(X+k*R0*0.7,Y-R0*1.4);c.stroke()}}else if(cr.kind==='fan'){c.beginPath();c.arc(X,Y,R0*1.2,Math.PI,0);c.fill()}else if(cr.kind==='table'){c.fillRect(X-R0,Y-R0*1.2,R0*2,R0*0.4);c.fillRect(X-R0*0.15,Y-R0,R0*0.3,R0)}else{c.beginPath();c.arc(X,Y-R0*0.3,R0*0.8,0,7);c.fill()}c.globalAlpha=1}
  // city
  const night=dayLight()<0.45;for(const b of CITY.b){const t=BT[b.t],X=sx(b.x),Y=sy(b.y),w=t.w*z,hh=t.h*z,lit=CITY.pop>0;
    if(b.t==='dome'||b.t==='lab'){c.fillStyle='rgba(150,220,255,.18)';c.strokeStyle='rgba(190,235,255,.85)';c.lineWidth=Math.max(1.2,z*0.15);c.beginPath();c.ellipse(X,Y,w/2,hh,0,Math.PI,0);c.fill();c.stroke();
      c.fillStyle=lit?(night?'#ffe08a':'rgba(255,230,160,.7)'):'#556';for(let k=0;k<5;k++){c.fillRect(X-w*0.35+k*w*0.16,Y-hh*0.35,Math.max(1.5,z*0.35),Math.max(1.5,z*0.35))}if(b.t==='lab'){c.fillStyle='#ff6a6a';c.beginPath();c.arc(X,Y-hh,Math.max(2,z*0.3),0,7);c.fill()}}
    else if(b.t==='tower'){c.fillStyle='rgba(120,170,210,.35)';c.strokeStyle='rgba(190,230,255,.9)';c.lineWidth=Math.max(1,z*0.12);c.fillRect(X-w/2,Y-hh,w,hh);c.strokeRect(X-w/2,Y-hh,w,hh);c.fillStyle=lit?(night?'#ffe08a':'rgba(255,240,190,.6)'):'#445';for(let j=1;j<t.h;j+=1.6)for(let i=-1;i<=1;i+=2)c.fillRect(X+i*w*0.22-z*0.2,Y-j*z,Math.max(1.2,z*0.4),Math.max(1.2,z*0.5))}
    else if(b.t==='farm'){c.strokeStyle='rgba(200,220,200,.6)';c.lineWidth=1;c.strokeRect(X-w/2,Y-hh,w,hh);for(let k=0;k<6;k++){c.strokeStyle='rgba(110,170,60,.9)';c.beginPath();c.moveTo(X-w/2+k*w/5,Y);c.lineTo(X-w/2+k*w/5+Math.sin(now*0.002+k)*z*0.4,Y-hh*0.9);c.stroke()}}
    else if(b.t==='power'){c.fillStyle='#3a4a5a';c.fillRect(X-z*0.4,Y-hh,z*0.8,hh);c.save();c.translate(X,Y-hh);c.rotate(now*0.004);c.fillStyle='#d8e0e8';for(let k=0;k<3;k++){c.rotate(2.094);c.fillRect(-z*0.25,0,z*0.5,hh*0.5)}c.restore()}
    else if(b.t==='port'){c.fillStyle='#4a5a6a';c.fillRect(X-w/2,Y-hh,w,hh);c.fillStyle='#ffd45a';c.fillRect(X-w/2,Y-hh,w,z*0.4)}
    if(night&&lit){c.fillStyle='rgba(255,220,140,.08)';c.beginPath();c.arc(X,Y-hh/2,w*1.1,0,7);c.fill()}}
  for(const s0 of CITY.subs){const X=sx(s0.x),Y=sy(s0.y),L=Math.max(5,z*3);c.save();c.translate(X,Y);c.scale(s0.dir||1,1);c.fillStyle='#ffd23a';c.beginPath();c.ellipse(0,0,L,L*0.38,0,0,7);c.fill();c.fillRect(-L*0.2,-L*0.6,L*0.4,L*0.3);c.fillStyle='#7fd8ff';c.beginPath();c.arc(L*0.5,0,L*0.15,0,7);c.fill();if(night){c.fillStyle='rgba(255,250,200,.25)';c.beginPath();c.moveTo(L,0);c.lineTo(L*4,-L);c.lineTo(L*4,L);c.fill()}c.restore()}
  if(LBL&&CITY.b.length&&z>=2.5){const xs=CITY.b.map(b=>b.x),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=Math.min(...CITY.b.map(b=>b.y-BT[b.t].h))-4;c.font='600 12px "IBM Plex Mono",monospace';c.textAlign='center';c.fillStyle='rgba(255,230,170,.9)';c.fillText(`🏙️ ${Math.round(CITY.pop)} people`,sx(cx),sy(cy))}
  // creatures
  for(const a of AG){const X=sx(a.x),Y=sy(a.y),s=SP[a.sp];if(X<-200||X>W+200||Y<-50||Y>H+50)continue;drawFish(c,a,X,Y,z);
    if(s.glow&&a.y>40){c.fillStyle=s.glow;c.globalAlpha=0.8;c.beginPath();c.arc(X,Y,Math.max(1.2,z*0.25),0,7);c.fill();c.globalAlpha=1}}
  // plastic
  for(const p of PLAST){const X=sx(p.x),Y=sy(p.y);c.fillStyle=p.c;c.save();c.translate(X,Y);c.rotate(p.ph);c.fillRect(-z*0.4,-z*0.15,z*0.8,z*0.3);c.restore()}
  // surface waves and boats
  c.strokeStyle='rgba(220,240,255,.55)';c.lineWidth=2;c.beginPath();for(let x=0;x<=WW;x+=2){const Y=sy(Math.sin(x*0.3+now*0.002)*(ENV.storm?1.2:0.25));x?c.lineTo(sx(x),Y):c.moveTo(sx(x),Y)}c.stroke();
  for(const b of BOATS){const X=sx(b.x),Y=sy(0);c.fillStyle='#d8d0c0';c.beginPath();c.moveTo(X-z*5,Y-z*1.2);c.lineTo(X+z*5,Y-z*1.2);c.lineTo(X+z*3.5,Y+z*0.6);c.lineTo(X-z*3.5,Y+z*0.6);c.fill();c.fillStyle='#a03a2a';c.fillRect(X-z,Y-z*3.2,z*2.2,z*2);
    const nx=sx(b.x-b.d*4);c.strokeStyle='rgba(230,230,220,.5)';c.lineWidth=1;c.beginPath();c.moveTo(X,Y);c.lineTo(nx-z*4,sy(b.net));c.lineTo(nx+z*4,sy(b.net));c.closePath();c.stroke()}
  // depth ruler
  c.font='600 10px "IBM Plex Mono",monospace';c.textAlign='left';c.fillStyle='rgba(200,220,240,.6)';for(const [m,lab] of [[200,'200 m · twilight zone'],[1000,'1,000 m · midnight zone'],[3000,'3,000 m · the abyss']]){const Y=sy(m/MPU);if(Y>sy(0)&&Y<H){c.fillRect(X0,Y,6,1);c.fillText(lab,Math.max(X0+8,100),Y-3)}}
  // labels and selection
  if(false){}
  if(LBL&&z>=5){c.font='600 10px "IBM Plex Mono",monospace';c.textAlign='center';for(const a of AG){if(!SP[a.sp].big&&a.sp!=='shark'&&a.sp!=='turtle'&&a.sp!=='seal'&&a.sp!=='dolphin')continue;c.fillStyle='rgba(255,255,255,.7)';c.fillText(SP[a.sp].n,sx(a.x),sy(a.y)-SP[a.sp].len*z*0.4-6)}}
  if(S.sel&&S.sel.a){const a=S.sel.a;c.strokeStyle='#ffc35a';c.lineWidth=2;c.beginPath();c.arc(sx(a.x),sy(a.y),Math.max(10,SP[a.sp].len*z*0.6),0,7);c.stroke()}
  if(S.sel&&S.sel.c){const cr=S.sel.c;c.strokeStyle='#ffc35a';c.lineWidth=2;c.beginPath();c.arc(sx(cr.x),sy(cr.y),cr.r*z+6,0,7);c.stroke()}
  for(const p of PARTS){c.globalAlpha=Math.min(1,p.life*2);c.fillStyle=p.c;c.beginPath();c.arc(sx(p.x),sy(p.y),2,0,7);c.fill()}c.globalAlpha=1;
  if(HOVER&&TB[S.tool]){c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=1;c.beginPath();c.arc(sx(HOVER[0]),sy(HOVER[1]),(S.brush*1.5+2)*z,0,7);c.stroke()}}

/* ---------- tools ---------- */
const TB={feed:1,nutr:1,heat:1,cool:1,clean:1,remove:1};let HOVER=null,lastT=0;
const toolsList=[['',[['select','👆','Inspect']]],['Life',SPK.map(k=>['r_'+k,SP[k].ic,SP[k].n])],['Grow',[['coral','🪸','Coral','Click on a shallow sea floor to plant coral.'],['kelp','🌿','Kelp','Click on a shallow sea floor to plant kelp.'],['vent','♨️','Vent','Click on the sea floor to open a hot vent.'],['feed','🟢','Plankton','Paint a plankton bloom: food for small fish, jellyfish and whales.',1],['nutr','🧪','Nutrients','Paint nutrients that make plankton grow.',1]]],
  ['City',[['b_dome','🫧','Dome','Click on the sea floor to build a habitat dome (homes for 60 people).'],['b_tower','🏙️','Tower','A tall glass tower: homes for 160 people, but it needs lots of power.'],['b_farm','🌾','Farm','A kelp and fish farm: feeds 120 people.'],['b_power','⚡','Power','A power plant. Build it next to a hot vent for much more power.'],['b_lab','🔬','Lab','A research lab.'],['b_port','🚢','Sub port','A submarine port: subs travel between your buildings.']]],
  ['Change',[['heat','🔥','Heat','Paint to warm the water.',1],['cool','🧊','Cool','Paint to cool the water.',1],['clean','🧽','Clean up','Paint to remove plastic and oil.',1],['remove','✖️','Remove','Paint to remove creatures.',1]]]];
const SIM={id:'abyssal',name:'Abyssal',world:{w:WW,h:WH,wrapX:false,maxZ:40,followZ:9},home:'reef',freeScen:'reef',tutScen:'reef',defSpeed:1,homeSpeed:0,inspectTab:'insp',canFollow:true,
  speeds:[['1 hr',1/24],['6 hr',0.25],['1 day',1],['1 wk',7],['1 mo',30]],
  fmtRate:v=>v<1?`${Math.round(v*24)} hour${v*24>1.5?'s':''} / s`:v<7?'1 day / s':v<30?'1 week / s':'1 month / s',
  dateTxt:()=>{const y=Math.floor(S.t/365)+1,d=Math.floor(mod(S.t,365))+1,hr=Math.floor(mod(S.t,1)*24);return`Year ${y}, day ${d}${S.speed<=1?` · ${String(hr).padStart(2,'0')}:00`:''}`},
  dateSub:()=>`${(ENV.base+ENV.temp+(ENV.heat?4:0)).toFixed(1)} °C surface · pH ${pH().toFixed(2)}`,
  stepSize:sp=>clamp(sp/80,0.002,0.08),
  tools:toolsList,scens:SCENLIST,
  load(id){clearOcean();initFields();(SCENS[id]||SCENS.reef)();for(let k=0;k<30;k++)fieldStep(0.5);S.status={};S.seen={};S.statusReady=false;computeStats();HIST=[];sampleHist(true);syncUI();legendFor(S.view)},
  step(dt){fieldStep(dt);animals(dt);coralStep(dt);boatsStep(dt);cityStep(dt);
    for(const p of PLAST){p.y=clamp(p.y+p.vy*dt*2,0.3,floorAt(p.x)-0.5);p.x+=Math.sin(S.t*3+p.ph)*dt*3;p.ph+=dt;near(p.x,p.y,2,a=>{if(!a.dead&&(a.sp==='turtle'||a.sp==='whale'||a.sp==='seal')&&Math.random()<dt*2)a.e-=0.05})}},
  frame(dt){if(SNOW.length<260)SNOW.push({x:Math.random()*WW,y:Math.random()*WH});for(const p of SNOW){p.y+=dt*1.2;if(p.y>floorAt(p.x)){p.y=0;p.x=Math.random()*WW}}for(const p of PARTS){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt}PARTS=PARTS.filter(p=>p.life>0)},
  render,
  stats:()=>[...(CITY.b.length?[['City',Math.round(CITY.pop)+' people']]:[]),['Creatures',AG.length],['Species',Object.keys(STAT.pop).filter(k=>STAT.pop[k]).length],['Coral health',CORAL.length?Math.round(STAT.coral*100)+'%':'—'],['Caught',CATCH]],
  hud(){computeStats();sampleHist();renderLife();renderInspect()},
  pick(wx,wy){for(const b of CITY.b){const t=BT[b.t];if(Math.abs(wx-b.x)<t.w/2&&wy<=b.y+0.5&&wy>=b.y-t.h-1)return{b}}let best=null,bd=1e9;for(const a of AG){const d=(a.x-wx)**2+(a.y-wy)**2-SP[a.sp].len*SP[a.sp].len*0.3;if(d<bd){bd=d;best=a}}if(best&&bd<9)return{a:best};let bc=null,bcd=1e9;for(const c of CORAL){const d=(c.x-wx)**2+(c.y-wy)**2;if(d<bcd){bcd=d;bc=c}}if(bc&&bcd<6)return{c:bc};if(wy<0||wy>floorAt(wx))return null;return{w:[wx,wy]}},
  selPos:s=>s.a?(AG.includes(s.a)?[s.a.x,s.a.y]:null):null,
  pointer(type,wx,wy){const t=S.tool;HOVER=[wx,wy];if(type==='up')return;const now=performance.now();if(type==='drag'&&now-lastT<60)return;lastT=now;const fy=floorAt(wx);
    if(t.startsWith('b_')){if(type!=='down')return;if(wy<floorAt(wx)-30&&floorAt(wx)-wy>30){}build(t.slice(2),wx);return}
    if(t.startsWith('r_')){const k=t.slice(2);if(wy>fy){toast('That is under the sea floor');return}const n=release(k,wx,wy,SP[k].big||k==='shark'?1:k==='sardine'||k==='lantern'?8:3);if(!n)toast('The ocean is full');return}
    if(type!=='down'&&!TB[t])return;
    if(t==='coral'){if(fy>70){toast('Coral needs sunlight: plant it on shallow sea floor');return}for(let k=0;k<4;k++){const x=wx+rr(-2,2);CORAL.push({x,y:floorAt(x)-rr(0,1),h:0.6,kind:pick(['brain','branch','fan','table']),col:pick(['#ff7a8a','#ffb05a','#c88aff','#5ae0c0','#ffd45a']),r:rr(1,2)})}PLANTED++;chEv('coral',{});return}
    if(t==='kelp'){if(fy>70){toast('Kelp needs sunlight: plant it on shallow sea floor');return}KELP.push({x:wx,y:fy,len:3,ph:Math.random()*6});PLANTED++;chEv('kelp',{});return}
    if(t==='vent'){VENTS.push({x:wx,y:fy-1});chEv('vent',{});toast('♨️ A hydrothermal vent opens');return}
    const r=S.brush*1.5+2;const cells=[];for(let j=0;j<GY;j++)for(let i=0;i<GX;i++){const x=(i+.5)*GS,y=(j+.5)*GS;if((x-wx)**2+(y-wy)**2<r*r)cells.push(j*GX+i)}
    if(t==='feed'){for(const g of cells){P[g]=Math.min(1,P[g]+0.3);Z[g]=Math.min(1.2,Z[g]+0.25)}FED++;chEv('feed',{})}
    else if(t==='nutr'){for(const g of cells)NU[g]=Math.min(2,NU[g]+0.4);FED++;chEv('nutr',{})}
    else if(t==='heat'||t==='cool'){const d=t==='heat'?1:-1;for(const g of cells)HT[g]+=d;ENV.temp=clamp(ENV.temp+d*0.25,-6,8);HEATED++;syncUI()}
    else if(t==='clean'){const n0=PLAST.length;PLAST=PLAST.filter(p=>(p.x-wx)**2+(p.y-wy)**2>r*r);CLEANED+=n0-PLAST.length;for(const g of cells){if(OIL[g]>0.01)CLEANED+=OIL[g]*10;OIL[g]=0}chEv('clean',{})}
    else if(t==='remove'){for(const a of AG)if((a.x-wx)**2+(a.y-wy)**2<r*r)a.dead=true;AG=AG.filter(a=>!a.dead)}},
  hover(wx,wy){HOVER=[wx,wy]},
  viewChanged:v=>legendFor(v),
  find(q){const out=[],add=(label,sub,go)=>out.push({label,sub,go});
    for(const k of SPK){const s=SP[k];if(s.n.toLowerCase().includes(q)||s.pl.toLowerCase().includes(q)||k.includes(q)){const n=STAT.pop[k]||0;if(n)add(`${s.ic} Find a ${s.n.toLowerCase()}`,`${n} in the ocean`,()=>{const a=AG.find(x=>x.sp===k);if(a){S.sel={a};S.follow=true;flyToW(a.x,a.y,10);S.follow=true;showTab('insp')}});
      add(`${s.ic} Release ${s.pl.toLowerCase()} here`,'adds some in the middle of the view',()=>{const x=clamp(cam.x,4,WW-4),y=clamp(cam.y,2,floorAt(cam.x)-2);release(k,x,y,s.big||k==='shark'?2:6);toast(`Released ${s.pl.toLowerCase()}`)})}}
    for(const [,items] of SIM.tools)for(const [id,ico,name] of items)if(!id.startsWith('r_')&&id!=='select'&&name.toLowerCase().includes(q))add(`${ico} Use the ${name} tool`,'tool',()=>setTool(id));
    for(const [ev,lab] of [['heatwave','☀ Marine heatwave'],['oil','🛢 Oil spill'],['plastic','🧴 Plastic patch'],['bloom','🟢 Algae bloom'],['upwell','⬆ Upwelling'],['migrate','🐋 Whale migration'],['storm','🌊 Storm']])if(lab.toLowerCase().includes(q)||ev.includes(q))add(lab,'event',()=>doEvent(ev));
    for(const s of SCENLIST)if(s.name.toLowerCase().includes(q))add('Ocean: '+s.name,s.desc,()=>{loadScen(s.id);toast(s.name)});return out},
  tabShown(id){if(id==='life')renderLife(true)},
  selChanged(){renderInspect()},
};
/* ---------- stats and panels ---------- */
function computeStats(){const pop={};for(const k of SPK)pop[k]=0;for(const a of AG)pop[a.sp]++;STAT.pop=pop;let low=0,n=0;for(let g=0;g<NG;g++){const i=g%GX,j=(g/GX)|0;if((j+.5)*GS<floorAt((i+.5)*GS)){n++;if(O2[g]<0.2)low++}}STAT.o2low=n?low/n:0;
  let pp=0;for(let g=0;g<GX*10;g++)pp+=P[g];STAT.plank=pp/(GX*10);
  const st=S.status||(S.status={});S.seen=S.seen||{};const msgs=[];for(const k of SPK){const c=pop[k];if(c>0)S.seen[k]=1;if(!S.seen[k])continue;const now=c===0?'extinct':c<15&&SP[k].max>30?'endangered':'ok',was=st[k];
    if(S.statusReady&&was&&was!==now){if(now==='extinct'){msgs.push(`✖ ${SP[k].pl} are gone from this ocean`);chEv('extinct',{sp:k})}else if(now==='endangered'&&was==='ok'){msgs.push(`⚠ ${SP[k].pl} are endangered: only ${c} left`);chEv('endangered',{sp:k})}}st[k]=now}S.statusReady=true;for(const m of msgs.slice(0,2))toast(m)}
function sampleHist(force){const last=HIST[HIST.length-1];if(!force&&last&&S.t-last.t<Math.max(0.1,S.speed*0.6))return;HIST.push({t:S.t,pop:{...STAT.pop}});if(HIST.length>240)HIST.shift()}
function kv(rows){return rows.map(([k,v])=>`<div><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}
function renderLife(force){if($('pane-life').hidden&&!force)return;
  const cs=cityStats();$('lStats').innerHTML=kv([...(CITY.b.length?[['City population',Math.round(CITY.pop)+' / '+cs.house],['City power',(cs.pw>=0?'+':'')+cs.pw],['City food',cs.food+40+' people']]:[]),['Creatures',AG.length],['Coral health',CORAL.length?Math.round(STAT.coral*100)+'%':'no coral'],['Low-oxygen water',Math.round(STAT.o2low*100)+'%'],['Surface plankton',Math.round(STAT.plank*100)+'%'],['Water acidity',`pH ${pH().toFixed(2)}`],['Fish caught',CATCH],['Plastic pieces',PLAST.length],['Babies born',fmtN(BORN)]]);
  const g=$('graph'),gc=g.getContext('2d'),w=g.width=g.clientWidth*DPR,hh=g.height=g.clientHeight*DPR;gc.clearRect(0,0,w,hh);
  if(HIST.length>1){const t0=HIST[0].t,t1=HIST[HIST.length-1].t,X=t=>8+(w-16)*(t-t0)/Math.max(1e-6,t1-t0);for(const k of SPK){const mx=Math.max(1,...HIST.map(p=>p.pop[k]||0));if(mx<2)continue;gc.strokeStyle=SP[k].col;gc.lineWidth=1.6*DPR;gc.beginPath();HIST.forEach((p,i)=>{const y=hh-6-(hh-12)*(p.pop[k]||0)/mx;i?gc.lineTo(X(p.t),y):gc.moveTo(X(p.t),y)});gc.stroke()}}
  const L=$('plist');L.textContent='';for(const k of SPK){const n=STAT.pop[k]||0;if(!n&&!(S.seen||{})[k])continue;const r=document.createElement('button');r.className='sprow'+(n?'':' zero');r.innerHTML='<i></i><span></span><b></b>';r.children[0].style.background=SP[k].col;r.children[1].textContent=`${SP[k].ic} ${SP[k].pl}${S.status&&S.status[k]==='endangered'?' · endangered':''}`;r.children[2].textContent=n;r.onclick=()=>{const a=AG.find(x=>x.sp===k);if(a){S.sel={a};flyToW(a.x,a.y,10);showTab('insp')}};L.appendChild(r)}
  const st=S.status||{},bad=SPK.filter(k=>st[k]==='endangered'||st[k]==='extinct'),box=$('endBox');box.hidden=!bad.length;if(bad.length)box.innerHTML='<span class="k">Endangered or gone</span>'+bad.map(k=>`<div class="endrow${st[k]==='extinct'?' ext':''}"><span>${SP[k].ic} ${SP[k].pl}</span><b>${st[k]==='extinct'?'gone':STAT.pop[k]}</b></div>`).join('')}
let INSPK='';
function renderInspect(){const b=S.sel;$('inspEmpty').hidden=!!b;$('inspBody').hidden=!b;if(!b)return;const body=$('inspBody');
  if(b.a){const a=b.a;if(!AG.includes(a)){body.innerHTML=`<h2 class="ititle">${SP[a.sp].n}</h2><p class="note">It died: ${a.cause||'gone'}.</p>`;return}const s=SP[a.sp];
    if(INSPK!==a.id){INSPK=a.id;body.innerHTML=`<h2 class="ititle"></h2><div class="isub"></div><div class="kv" id="iK"></div><div class="actions"><button class="btn" id="aFeed">Feed</button><button class="btn" id="aClone">Clone</button><button class="btn" id="aFol">Follow</button></div><p class="note" id="iN"></p>`;
      $('aFeed').onclick=()=>{a.e=1;FEDBY++;chEv('feedone',{});toast('Fed')};$('aClone').onclick=()=>{release(a.sp,a.x,a.y,1);toast('Cloned')};$('aFol').onclick=()=>{S.follow=true;cam.z=Math.max(cam.z,9)}}
    body.children[0].textContent=`${s.ic} ${s.n}`;body.children[1].textContent=`${depthM(a.y)} m deep · ${(a.age/365).toFixed(1)} years old`;
    $('iK').innerHTML=kv([['Energy',Math.round(a.e*100)+'%'],['Eats',s.eat?s.eat.map(k=>SP[k].pl.toLowerCase()).join(', '):s.z?'plankton':'marine snow'],['Children',a.kids],['Kills',a.kills],['Water',tempAt(a.y).toFixed(1)+' °C'],s.air?['Air',Math.round(clamp(a.air,0,1)*100)+'%']:['Oxygen',Math.round(O2[gi(a.x,a.y)]*100)+'%']]);
    $('iN').textContent=s.air?'Air-breathing: it must swim up to the surface to breathe.':s.glow?'Glows in the dark (bioluminescence) to find mates and lure prey.':s.school?'Swims in a school: safety in numbers.':''}
  else if(b.b){const B=b.b,t=BT[B.t],cs=cityStats();INSPK='';body.innerHTML=`<h2 class="ititle">${t.ic} ${t.n}</h2><div class="isub">${depthM(B.y)} m deep · built on day ${Math.floor(B.born)+1}</div><div class="kv">${kv([['Homes',t.house],['Food',t.food?'feeds '+t.food:'—'],['Power',t.pw>0?'+'+(t.pw+(VENTS.some(v=>Math.abs(v.x-B.x)<14)?18:0)):t.pw],['City population',Math.round(CITY.pop)],['City power',(cs.pw>=0?'+':'')+cs.pw],['City food',cs.food+40]])}</div><div class="actions"><button class="btn danger" id="bDel">Demolish</button></div><p class="note">The city grows when it has homes, food and enough power. Its sewage adds nutrients to the water nearby.</p>`;$('bDel').onclick=()=>{CITY.b.splice(CITY.b.indexOf(B),1);S.sel=null;toast('Demolished')}}
  else if(b.c){const c=b.c;INSPK='';body.innerHTML=`<h2 class="ititle">🪸 Coral</h2><div class="isub">${depthM(c.y)} m deep</div><div class="kv">${kv([['Health',Math.round(c.h*100)+'%'],['State',c.h>0.35?'healthy':c.h>0?'bleached':'dead'],['Water',tempAt(c.y).toFixed(1)+' °C'],['Acidity','pH '+pH().toFixed(2)]])}</div><p class="note">Coral bleaches when the water gets too warm (above about 30.5 °C) or too acidic. It can recover if conditions improve in time.</p>`}
  else if(b.w){const [x,y]=b.w,g=gi(x,y);INSPK='';body.innerHTML=`<h2 class="ititle">Sea water</h2><div class="isub">${depthM(y)} m deep</div><div class="kv">${kv([['Temperature',tempAt(y).toFixed(1)+' °C'],['Light',Math.round(lightAt(y)*100)+'%'],['Plankton',Math.round(P[g]*100)+'%'],['Animal plankton',Math.round(Z[g]*100)+'%'],['Nutrients',Math.round(NU[g]*100)+'%'],['Oxygen',Math.round(O2[g]*100)+'%']])}</div>`}}
