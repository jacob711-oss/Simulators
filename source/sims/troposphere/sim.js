/* ================= Troposphere: weather and climate ================= */
// A 240 x 120 grid (1.5 degrees, about 167 km per cell at the equator) that wraps east-west.
// Time is in days. Winds are in m/s; 1 m/s moves about 0.52 cells a day at the equator.
const GW=240,GH=120,N=GW*GH,KM=167,MS2C=86.4/KM;
const elev=new Float32Array(N),T=new Float32Array(N),Ts=new Float32Array(N),q=new Float32Array(N),cl=new Float32Array(N),rn=new Float32Array(N),sn=new Float32Array(N),ice=new Float32Array(N),
  P=new Float32Array(N),Pa=new Float32Array(N),u=new Float32Array(N),v=new Float32Array(N),ravg=new Float32Array(N),tavg=new Float32Array(N),soil=new Float32Array(N),tmp=new Float32Array(N),tmp2=new Float32Array(N),tmp3=new Float32Array(N),sunC=new Float32Array(N),dT=new Float32Array(N);
const WU=new Float32Array(N),WV=new Float32Array(N);let STEERED=0;
const ENV={co2:280,sun:1,tilt:23,spin:1,ocean:0,dust:0,heat:0,cold:0,dry:0,nino:0,locked:false,evap:1};
const EVT={heatwave:false,coldsnap:false,season:false,elnino:false,volcano:false,drought:false,outbreak:false};
let STORMS=[],SYS=[],TORN=[],FLASH=[],PTS=[],HIST=[],RECS={hot:-99,hotI:0,cold:99,coldI:0,wind:0,windI:0,lowP:1013},STAT={avgT:14,ice:0,snow:0,rain:0,storms:0,maxCat:0,avgT0:14},LBL=true,STREAK=true,dirtyImg=true,lastImg=0,HL=[];
let LIGHT=0,TORNS=0,HURRS=0,LANDF=0,HEATED=0,COOLED=0,WETTED=0,PRESSED=0,RAISEDM=0,EVN=0,EVSTOP=0,SLIDED=0,NAMEI=0,USERSTORM=0;
const isOcean=i=>elev[i]<=0;
const cxOf=i=>i%GW,cyOf=i=>(i/GW)|0,idx=(x,y)=>clamp(Math.floor(y),0,GH-1)*GW+mod(Math.floor(x),GW);
const latOf=y=>90-(y+0.5)*180/GH,lonOf=x=>(x+0.5)*360/GW-180;
const COS=new Float32Array(GH);for(let y=0;y<GH;y++)COS[y]=Math.max(0.12,Math.cos(latOf(y)*Math.PI/180));
const wdx=dx=>{dx=mod(dx,GW);return dx>GW/2?dx-GW:dx};
let RS=1;function seed(s){RS=s>>>0||1}function R(){RS|=0;RS=RS+0x6D2B79F5|0;let t=Math.imul(RS^RS>>>15,1|RS);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}
const NAMES=['Ava','Basil','Cora','Dmitri','Elena','Felix','Greta','Hugo','Isla','Jonas','Kira','Leon','Mira','Nico','Opal','Pavel','Quinn','Rosa','Sami','Tess','Umar','Vera','Wes','Xena','Yuri','Zara'];
const qsat=t=>3.8*Math.exp(17.27*t/(t+237.3));
function fbm(oct,base,pers){const out=new Float32Array(N);let amp=1,tot=0;
  for(let o=0;o<oct;o++){const nx=Math.max(2,Math.round(GW/(base/2**o))),sp=GW/nx,ny=Math.ceil(GH/sp)+2,L=new Float32Array(nx*ny);for(let k=0;k<L.length;k++)L[k]=R()*2-1;
    for(let y=0;y<GH;y++){const fy=y/sp,y0=Math.floor(fy),ty=fy-y0,sy=ty*ty*(3-2*ty);for(let x=0;x<GW;x++){const fx=x/sp,x0=Math.floor(fx),tx=fx-x0,sx=tx*tx*(3-2*tx),xa=x0%nx,xb=(x0+1)%nx;
      const a=L[y0*nx+xa],b=L[y0*nx+xb],c=L[(y0+1)*nx+xa],d=L[(y0+1)*nx+xb];out[y*GW+x]+=amp*((a+(b-a)*sx)+((c+(d-c)*sx)-(a+(b-a)*sx))*sy)}}tot+=amp;amp*=pers}
  for(let i=0;i<N;i++)out[i]/=tot;return out}
function quantile(arr,q){const s=Float32Array.from(arr).sort();return s[Math.floor(clamp(q,0,1)*(s.length-1))]}

/* ---------- worlds ---------- */
function makeLand(sd,frac,shape){seed(sd);const n=fbm(6,80,0.52),m=fbm(4,30,0.5);for(let i=0;i<N;i++){n[i]+=0.2*m[i]+(shape?shape(cxOf(i),cyOf(i)):0)}
  const thr=frac>0?quantile(n,1-frac):9,mt=fbm(5,40,0.55);for(let i=0;i<N;i++){const d=n[i]-thr;elev[i]=d>0?40+d*2500+Math.max(0,mt[i])*3200*Math.min(1,d*6):-200-Math.min(1,-d*6)*4000}}
function resetEnv(){WU.fill(0);WV.fill(0);Object.assign(ENV,{co2:280,sun:1,tilt:23,spin:1,ocean:0,dust:0,heat:0,cold:0,dry:0,nino:0,locked:false,evap:1});for(const k in EVT)EVT[k]=false;STORMS=[];SYS=[];TORN=[];FLASH=[];HIST=[];NAMEI=0;RECS={hot:-99,hotI:0,cold:99,coldI:0,wind:0,windI:0,lowP:1013};Pa.fill(0);dT.fill(0)}
const SCENS={
  earth:()=>{makeLand(11,0.29)},
  hurricane:()=>{makeLand(11,0.29);ENV.ocean=1.5;S.t=228},
  tornado:()=>{makeLand(4,0.36,(x,y)=>Math.exp(-(((wdx(x-70)/40)**2)+((y-38)/14)**2))*0.5);S.t=125},
  iceage:()=>{makeLand(11,0.32);ENV.co2=180;ENV.ocean=-2},
  hothouse:()=>{makeLand(11,0.27);ENV.co2=1400},
  monsoon:()=>{makeLand(8,0.3,(x,y)=>Math.exp(-(((wdx(x-140)/55)**2)+((y-38)/16)**2))*0.9-Math.exp(-(((wdx(x-140)/70)**2)+((y-75)/14)**2))*0.7);S.t=150},
  locked:()=>{makeLand(15,0.25);ENV.locked=true;ENV.tilt=0;ENV.spin=0.3},
  water:()=>{makeLand(19,0.03);ENV.ocean=1},
  desert:()=>{makeLand(23,0.72);ENV.evap=0.5},
};
const SCENLIST=[{id:'earth',name:'Earth-like',desc:'Oceans, continents and seasons much like our own planet.'},{id:'hurricane',name:'Hurricane season',desc:'Late summer with warm oceans: tropical storms are brewing.'},
  {id:'tornado',name:'Tornado alley',desc:'Spring on a wide continent where warm, wet air meets cold, dry air.'},{id:'iceage',name:'Ice age',desc:'Low carbon dioxide and cold oceans. Ice sheets reach far from the poles.'},
  {id:'hothouse',name:'Hothouse',desc:'Five times today’s carbon dioxide. No ice, fierce storms.'},{id:'monsoon',name:'Monsoon',desc:'A giant continent beside a warm ocean: summer brings torrential rain.'},
  {id:'locked',name:'No night',desc:'A tidally locked planet: one side always faces the sun, the other is in endless night.'},{id:'water',name:'Water world',desc:'Almost all ocean, with a few small islands.'},{id:'desert',name:'Desert planet',desc:'Mostly dry land with small seas.'}];
function initFields(){for(let i=0;i<N;i++){const y=cyOf(i),la=Math.abs(latOf(y));const t=(ENV.locked?-10:TANN(la))+ENV.ocean*0.5+3*Math.log2(ENV.co2/280)-6.5*Math.max(0,elev[i])/1000;T[i]=t;Ts[i]=Math.max(-1.8,t+1);tavg[i]=t;q[i]=qsat(t)*0.6;cl[i]=0.2;rn[i]=0;sn[i]=t<-8&&!isOcean(i)?20:0;ice[i]=isOcean(i)&&t<-2?1:0;soil[i]=0.5;ravg[i]=isOcean(i)?0.2:0.1+0.3*Math.exp(-(((la-5)/18)**2))+0.15*Math.exp(-(((la-50)/12)**2))}
  for(let k=0;k<60;k++)physics(1,true);for(let k=0;k<40;k++)physics(0.25,false);STAT.avgT0=STAT.avgT}

/* ---------- sunlight ---------- */
const DOY=()=>mod(S.t,365);
function decl(){return ENV.tilt*Math.PI/180*Math.sin(2*Math.PI*(DOY()-80)/365)}
function sunAt(y,x,daily){const la=latOf(y)*Math.PI/180,d=decl();
  if(ENV.locked){const lo=lonOf(x)*Math.PI/180;return Math.max(0,Math.cos(la)*Math.cos(lo))*1.35}
  if(daily){const ws=Math.acos(clamp(-Math.tan(la)*Math.tan(d),-1,1));return(ws*Math.sin(la)*Math.sin(d)+Math.cos(la)*Math.cos(d)*Math.sin(ws))/Math.PI*2.2}
  const hr=mod(S.t,1)*24,lo=lonOf(x),ha=((hr-12)*15+lo)*Math.PI/180;return Math.max(0,Math.sin(la)*Math.sin(d)+Math.cos(la)*Math.cos(d)*Math.cos(ha))}
const dayCycle=()=>S.speed<=0.26&&!ENV.locked;

/* ---------- weather systems (lows and highs that drift with the winds) ---------- */
function addSys(x,y,dp,r,life){SYS.push({x,y,dp,r:r||5,life:life||rr(4,9),age:0});if(SYS.length>40)SYS.shift()}
function spawnSystems(dt){for(const hemi of [1,-1]){if(Math.random()<dt*0.9){const la=hemi*rr(38,62),y=(90-la)/180*GH,x=Math.random()*GW;addSys(x,y,Math.random()<0.6?-rr(10,28):rr(8,18),rr(4,7))}}}
function newStormName(){return NAMES[NAMEI++%NAMES.length]+(NAMEI>NAMES.length?' '+Math.ceil(NAMEI/NAMES.length):'')}
function addStorm(x,y,pc,user){const s={x,y,pc:pc||1004,name:newStormName(),age:0,land:!isOcean(idx(x,y)),track:[[x,y]],peak:0,user:!!user,id:Math.random()};STORMS.push(s);if(STORMS.length>10)STORMS.shift();HURRS++;chEv('storm',{user:!!user});return s}
const vmax=s=>Math.max(0,6.3*Math.sqrt(Math.max(0,1010-s.pc)));
const catOf=s=>{const k=vmax(s)*3.6;return k>=252?5:k>=209?4:k>=178?3:k>=154?2:k>=119?1:0};
const catName=s=>{const c=catOf(s);return c?`Category ${c} hurricane`:vmax(s)*3.6>=63?'Tropical storm':'Tropical depression'};
function stormStep(dt){
  if(Math.random()<dt*(0.05+(EVT.season?0.5:0))*(1+Math.max(0,ENV.ocean)*0.3)){for(let k=0;k<30;k++){const hemi=Math.random()<.5?1:-1,la=hemi*rr(7,20),y=(90-la)/180*GH,x=Math.random()*GW,i=idx(x,y);if(isOcean(i)&&Ts[i]>26.5){addStorm(x,y,1006);break}}}
  for(const s of STORMS){const i=idx(s.x,s.y),la=latOf(s.y),oc=isOcean(i),sst=Ts[i];s.age+=dt;
    // steering: the average wind around the storm, plus a slow poleward drift
    let su=0,sv=0,n=0;for(const [dx,dy] of [[-5,0],[5,0],[0,-5],[0,5],[-4,-4],[4,4],[-4,4],[4,-4]]){const j=idx(s.x+dx,s.y+dy);su+=u[j];sv+=v[j];n++}su/=n;sv/=n;
    sv-=la>=0?1.6:-1.6;su-=1.0;if(s.steer&&s.steerT>0){su=s.steer.u;sv=s.steer.v;s.steerT-=dt}
    s.x=mod(s.x+su*MS2C/COS[clamp(Math.floor(s.y),0,GH-1)]*dt*0.75,GW);s.y=clamp(s.y+sv*MS2C*dt*0.75,2,GH-3);
    const pot=oc&&!ice[i]?Math.max(0,sst-26)*14+Math.max(0,ENV.ocean)*2:0,target=oc?1010-Math.min(140,pot*2.2):1012;
    if(oc&&sst>26)s.pc+=(target-s.pc)*Math.min(1,dt*0.35);else s.pc+=dt*(oc?14:22);
    s.pc=Math.max(870,s.pc);const c=catOf(s);if(c>s.peak){s.peak=c;if(c>=1)chEv('cat',{c,user:s.user,name:s.name});if(c>=4&&(c>s.saidCat||0)){s.saidCat=c;toast(`🌀 ${s.name} is now a category ${c} hurricane`)}}
    const nowLand=!oc;if(nowLand&&!s.land&&c>=1){LANDF++;chEv('landfall',{c,name:s.name});toast(`🌀 ${s.name} makes landfall as a category ${c} hurricane`)}s.land=nowLand;
    const tl=s.track[s.track.length-1];if(Math.hypot(wdx(s.x-tl[0]),s.y-tl[1])>1.2){s.track.push([s.x,s.y]);if(s.track.length>200)s.track.shift()}
    if(s.pc>=1009||Math.abs(la)>48)s.dead=true}
  STORMS=STORMS.filter(s=>!s.dead);
  for(const s of SYS){s.age+=dt;const j=idx(s.x,s.y);let su=u[j],sv=v[j]*0.6;if(s.steer&&s.steerT>0){su=s.steer.u;sv=s.steer.v;s.steerT-=dt}s.x=mod(s.x+su*MS2C/COS[clamp(Math.floor(s.y),0,GH-1)]*dt*0.8,GW);s.y=clamp(s.y+sv*MS2C*dt*0.8,3,GH-4)}SYS=SYS.filter(s=>s.age<s.life)}
function tornadoStep(dt){
  const chance=dt*(0.25+(EVT.outbreak?6:0));if(Math.random()<chance*4){for(let k=0;k<40;k++){const i=Math.floor(Math.random()*N);if(isOcean(i))continue;const la=Math.abs(latOf(cyOf(i)));if(la<22||la>52)continue;
      const wet=q[i]>9,warm=T[i]>17,shear=Math.hypot(u[i],v[i])>5,storm=rn[i]>0.6||EVT.outbreak;if(wet&&warm&&shear&&storm&&Math.random()<0.5){addTornado(cxOf(i)+Math.random(),cyOf(i)+Math.random(),false);break}}}
  for(const t of TORN){t.age+=dt;const j=idx(t.x,t.y);let su=u[j]+3,sv=v[j];if(t.steer){su=t.steer.u;sv=t.steer.v}t.x=mod(t.x+su*MS2C*dt*1.5,GW);t.y+=sv*MS2C*dt*1.5;t.path.push([t.x,t.y]);if(t.path.length>40)t.path.shift()}TORN=TORN.filter(t=>t.age<t.life)}
function addTornado(x,y,user){const ef=Math.min(5,Math.floor(-Math.log(Math.random()+1e-9)*1.1));const t={x,y,ef,age:0,life:rr(0.03,0.12)*(1+ef*0.4),path:[[x,y]],user};TORN.push(t);if(TORN.length>30)TORN.shift();TORNS++;chEv('tornado',{ef,user:!!user});if(ef>=4)toast(`🌪 A violent EF${ef} tornado touches down`);return t}

/* ---------- physics ---------- */
function advect(F,dt,out){for(let y=0;y<GH;y++){const cy=COS[y];for(let x=0;x<GW;x++){const i=y*GW+x,sx0=x-u[i]*MS2C/cy*dt,sy0=clamp(y+v[i]*MS2C*dt,0,GH-1.001);
  const x0=Math.floor(sx0),tx=sx0-x0,y0=Math.floor(sy0),ty=sy0-y0,xa=mod(x0,GW),xb=mod(x0+1,GW),y1=Math.min(GH-1,y0+1);
  out[i]=(F[y0*GW+xa]*(1-tx)+F[y0*GW+xb]*tx)*(1-ty)+(F[y1*GW+xa]*(1-tx)+F[y1*GW+xb]*tx)*ty}}F.set(out)}
function advect3(dt){for(let y=0;y<GH;y++){const cy=COS[y];for(let x=0;x<GW;x++){const i=y*GW+x;let sx0=x-u[i]*MS2C/cy*dt,sy0=y-v[i]*MS2C*dt;if(sy0<0)sy0=0;else if(sy0>GH-1.001)sy0=GH-1.001;
  const x0=Math.floor(sx0),tx=sx0-x0,y0=sy0|0,ty=sy0-y0,xa=((x0%GW)+GW)%GW,xb=xa+1===GW?0:xa+1,y1=y0+1<GH?y0+1:y0,a=y0*GW+xa,b=y0*GW+xb,c=y1*GW+xa,d=y1*GW+xb,w0=(1-tx)*(1-ty),w1=tx*(1-ty),w2=(1-tx)*ty,w3=tx*ty;
  tmp[i]=T[a]*w0+T[b]*w1+T[c]*w2+T[d]*w3;tmp2[i]=q[a]*w0+q[b]*w1+q[c]*w2+q[d]*w3;tmp3[i]=cl[a]*w0+cl[b]*w1+cl[c]*w2+cl[d]*w3}}T.set(tmp);q.set(tmp2);cl.set(tmp3)}
const BASEP=la=>{const a=Math.abs(la);return 1013-5*Math.exp(-((a/9)**2))+8*Math.exp(-(((a-31)/9)**2))-11*Math.exp(-(((a-62)/9)**2))+6*Math.exp(-(((a-88)/8)**2))};
const QANN=new Float32Array(GH);let QTILT=-1,CHA=null;
function updQann(){if(QTILT===ENV.tilt)return;QTILT=ENV.tilt;const t0=S.t;for(let y=0;y<GH;y++){let s=0;for(let d=0;d<365;d+=5){S.t=d;s+=sunAt(y,0,true)}QANN[y]=s/73}S.t=t0}
const TANN=la=>{const s2=Math.sin(la*Math.PI/180)**2;return 28-32*s2-12*s2*s2};
function physics(dt,fast){updQann();const day=!fast&&dayCycle(),gh=3*Math.log2(ENV.co2/280),sunk=(ENV.sun-1)*70,evf=ENV.evap*(EVT.drought?0.35:1),dust=ENV.dust;
  // zonal mean temperature, for thermal pressure anomalies
  const zm=new Float32Array(GH);for(let y=0;y<GH;y++){let s=0;for(let x=0;x<GW;x++)s+=T[y*GW+x];zm[y]=s/GW}
  const DL=new Float32Array(GH),dd=decl(),sd=Math.sin(dd),cd=Math.cos(dd),hr=mod(S.t,1)*24;if(!CHA||CHA.length!==GW)CHA=new Float32Array(GW);for(let x=0;x<GW;x++)CHA[x]=ENV.locked?Math.max(0,Math.cos(lonOf(x)*Math.PI/180)):Math.cos(((hr-12)*15+lonOf(x))*Math.PI/180);
  for(let y=0;y<GH;y++){const dl=sunAt(y,0,true);DL[y]=dl;const la=latOf(y)*Math.PI/180,sl=Math.sin(la),cl0=Math.cos(la),r=y*GW;
    if(ENV.locked)for(let x=0;x<GW;x++)sunC[r+x]=cl0*CHA[x]*1.35;else if(day)for(let x=0;x<GW;x++){const v0=sl*sd+cl0*cd*CHA[x];sunC[r+x]=v0>0?v0:0}else for(let x=0;x<GW;x++)sunC[r+x]=dl}
  for(let i=0;i<N;i++){const y=(i/GW)|0,la=latOf(y),oc=isOcean(i),e=Math.max(0,elev[i]);
    const white=(oc?(ice[i]>.5?1:0):sn[i]>2?1:0);
    let Te=ENV.locked?-58+95*Math.sqrt(sunC[i]/1.35):TANN(la)+33*(DL[y]-QANN[y])*(oc?0.7:1)+(day?(sunC[i]-DL[y]*0.55)*(oc?2:9):0);
    Te+=gh+sunk-dust-6.5*e/1000-white*5+cl[i]*(day?-1.5:2)+dT[i];
    if(EVT.heatwave&&!oc&&Math.abs(la)<55&&Math.abs(la)>15)Te+=9;if(EVT.coldsnap&&Math.abs(la)>35)Te-=14;
    if(oc){const nino=EVT.elnino&&Math.abs(la)<12&&lonOf(i%GW)>-170&&lonOf(i%GW)<-80?3:0;const tse=Math.max(-1.8,Te+1+ENV.ocean+nino);Ts[i]+=(tse-Ts[i])*Math.min(1,dt/(fast?4:45));
      if(Ts[i]<-1.6)ice[i]=Math.min(1,ice[i]+dt*0.05);else if(Ts[i]>-0.5)ice[i]=Math.max(0,ice[i]-dt*0.08);
      const tgt=ice[i]>.5?Math.min(Te,-2):Ts[i];T[i]+=(tgt-T[i])*Math.min(1,dt/(ice[i]>.5?3:1.2))}
    else T[i]+=(Te-T[i])*Math.min(1,dt/(day?0.6:2.5));
    // evaporation
    const ws=Math.hypot(u[i],v[i]),qs=qsat(T[i]);
    const ev=(oc?(ice[i]>.5?0.05:1):0.25*soil[i])*Math.max(0,qs*0.78-q[i])*0.6*(1+ws/12)*evf;q[i]+=ev*dt}
  // pressure: background belts, thermal lows over warm air, drifting weather systems, storms and pushes
  for(let y=0;y<GH;y++){const bp=BASEP(latOf(y));for(let x=0;x<GW;x++){const i=y*GW+x;P[i]=bp-0.45*(T[i]-zm[y])*(isOcean(i)?0.6:1)+Pa[i]}}
  for(const s of SYS){const r=s.r,r2=r*r,amp=Math.min(1,s.age,(s.life-s.age)/1.5);for(let dy=-r*2;dy<=r*2;dy++){const yy=Math.floor(s.y)+dy;if(yy<0||yy>=GH)continue;for(let dx=-r*2;dx<=r*2;dx++){const d2=dx*dx+dy*dy;if(d2>4*r2)continue;const f0=1-d2/(4*r2);P[yy*GW+mod(Math.floor(s.x)+dx,GW)]+=s.dp*f0*f0*f0*amp}}}
  for(const s of STORMS){const r=2.2,dp=s.pc-1010;for(let dy=-6;dy<=6;dy++){const yy=Math.floor(s.y)+dy;if(yy<0||yy>=GH)continue;for(let dx=-6;dx<=6;dx++){const d2=dx*dx+dy*dy;P[yy*GW+mod(Math.floor(s.x)+dx,GW)]+=dp*Math.exp(-d2/(r*r))}}}
  for(let i=0;i<N;i++)Pa[i]*=Math.exp(-dt/2.5);
  // wind: turns from straight-downhill (equator) toward along the isobars (mid-latitudes) because of the Coriolis effect
  for(let y=0;y<GH;y++){const la=latOf(y),th=Math.min(1.25,Math.abs(la)*Math.PI/180*2.6*Math.sqrt(ENV.spin))*Math.sign(la),c=Math.cos(th),s=Math.sin(th),cy=COS[y],yn=Math.max(0,y-1),ys=Math.min(GH-1,y+1);
    for(let x=0;x<GW;x++){const i=y*GW+x,gx=(P[y*GW+(x+1)%GW]-P[y*GW+(x+GW-1)%GW])/(2*cy),gy=(P[yn*GW+x]-P[ys*GW+x])/2;// gy: northward gradient
      const dx=-gx,dy=-gy;// toward low pressure, east/north components
      let ue=dx*c+dy*s,vn=-dx*s+dy*c;const k=isOcean(i)?9:6.5,cap=70;ue*=k;vn*=k;ue+=WU[i];vn-=WV[i];const m=Math.hypot(ue,vn);if(m>cap){ue*=cap/m;vn*=cap/m}
      u[i]+=(ue-u[i])*Math.min(1,dt*3);v[i]+=(-vn-v[i])*Math.min(1,dt*3)}}// v is stored southward-positive (screen down)
  if(fast)return;
  advect3(dt);
  // clouds and rain: rising air (low pressure, upslopes, storms) cools and condenses
  let totT=0,totW=0;
  for(let y=0;y<GH;y++){const cy=COS[y],yn=Math.max(0,y-1),ys=Math.min(GH-1,y+1),la=latOf(y);for(let x=0;x<GW;x++){const i=y*GW+x,oc=isOcean(i);
    const up=Math.max(0,(u[i]*(Math.max(0,elev[y*GW+(x+1)%GW])-Math.max(0,elev[y*GW+(x+GW-1)%GW]))/cy-v[i]*(Math.max(0,elev[yn*GW+x])-Math.max(0,elev[ys*GW+x])))/2/1000);
    const lift=up*3.5+Math.max(0,1008-P[i])*0.4+Math.max(0,T[i]-25)*0.3*(oc?0.4:1);
    const qs=qsat(T[i]-lift),ex=q[i]-qs*0.9;let r=0;
    if(ex>0){r=ex*0.55;q[i]-=r*dt*4;if(q[i]<0)q[i]=0;cl[i]+=(Math.min(1,0.45+ex*0.15)-cl[i])*Math.min(1,dt*6);T[i]+=r*dt*0.6}
    else cl[i]*=Math.exp(-dt*(P[i]>1016?4:2));
    rn[i]=r*12;ravg[i]+=(rn[i]-ravg[i])*Math.min(1,dt/60);tavg[i]+=(T[i]-tavg[i])*Math.min(1,dt/120);
    if(!oc){soil[i]=clamp(soil[i]+r*dt*0.3-dt*0.02*Math.max(0,T[i])/20,0,1);if(r>0&&T[i]<0.5)sn[i]+=r*dt*8;if(T[i]>0.5&&sn[i]>0)sn[i]=Math.max(0,sn[i]-dt*(T[i])*1.2)}
    else sn[i]=0;
    totT+=T[i]*cy;totW+=cy;
    if(T[i]>RECS.hot){RECS.hot=T[i];RECS.hotI=i}if(T[i]<RECS.cold){RECS.cold=T[i];RECS.coldI=i}}}
  STAT.avgT=totT/totW;
  // lightning in strong, warm thunderstorms
  if(!fast)for(let k=0;k<6;k++){const i=Math.floor(Math.random()*N);if(rn[i]>1.4&&T[i]>14&&Math.random()<dt*14)flash(cxOf(i)+Math.random(),cyOf(i)+Math.random(),false)}}
function flash(x,y,user){FLASH.push({x,y,age:0,seg:Array.from({length:5},()=>[rr(-1,1),rr(0.3,1)])});if(FLASH.length>60)FLASH.shift();LIGHT++;chEv('lightning',{user:!!user})}

/* ---------- player actions ---------- */
function brushCells(wx,wy,r,f){const cx=Math.floor(wx),cy=Math.floor(wy);for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const d=Math.hypot(dx,dy)/(r+0.5);if(d>1)continue;const y=cy+dy;if(y<0||y>=GH)continue;f(y*GW+mod(cx+dx,GW),1-d*d)}dirtyImg=true}
function doEvent(ev){EVN++;chEv('event',{ev});
  if(ev==='normal'){if(Object.values(EVT).some(Boolean)||ENV.dust>0.3)EVSTOP++;for(const k in EVT)EVT[k]=false;ENV.dust=0;toast('All events stopped');syncEvents();return}
  if(EVT[ev]){EVT[ev]=false;if(ev==='volcano')ENV.dust=0;EVSTOP++;chEv('stop',{ev});toast('Stopped');syncEvents();return}
  EVT[ev]=true;
  const msg={heatwave:'☀ A heat wave bakes the continents',coldsnap:'❄ The polar vortex breaks loose: bitter cold spills south',season:'🌀 Hurricane season: the tropics are brewing storms',elnino:'🌊 El Niño: the eastern tropical ocean warms up',volcano:'🌋 A huge eruption fills the sky with ash: the planet cools',drought:'🏜 Drought: the air dries out and the rains fail',outbreak:'🌪 Tornado outbreak: violent storms over the plains'}[ev];
  if(ev==='volcano')ENV.dust=4;if(ev==='season'){for(let k=0;k<3;k++){for(let t=0;t<40;t++){const hemi=DOY()>150&&DOY()<320?1:-1,y=(90-hemi*rr(9,18))/180*GH,x=Math.random()*GW,i=idx(x,y);if(isOcean(i)){Ts[i]=Math.max(Ts[i],28.5);addStorm(x,y,1000);break}}}}
  toast(msg);syncEvents()}
function syncEvents(){const lab={heatwave:'☀ Heat wave',coldsnap:'❄ Polar vortex',season:'🌀 Hurricane season',elnino:'🌊 El Niño',volcano:'🌋 Volcanic winter',drought:'🏜 Drought',outbreak:'🌪 Tornado outbreak'};
  document.querySelectorAll('[data-ev]').forEach(b=>{const ev=b.dataset.ev;if(!(ev in EVT))return;b.setAttribute('aria-pressed',EVT[ev]);b.textContent=EVT[ev]?'■ Stop '+lab[ev].slice(2).toLowerCase():lab[ev]})}
function syncWorldUI(){const set=(id,v,t)=>{$(id).value=v;$(id.replace('S','V')).textContent=t};set('co2S',ENV.co2,ENV.co2+' ppm');set('sunS',Math.round(ENV.sun*1000)/10,(Math.round(ENV.sun*1000)/10)+'%');set('tiltS',ENV.tilt,ENV.tilt+'°');set('spinS',Math.round(ENV.spin*100),Math.round(ENV.spin*100)+'%');set('oceanS',ENV.ocean,(ENV.ocean>=0?'+':'')+ENV.ocean+' °C');syncEvents()}
for(const [id,k,f,t] of [['co2S','co2',v=>v,v=>v+' ppm'],['sunS','sun',v=>v/100,v=>v+'%'],['tiltS','tilt',v=>v,v=>v+'°'],['spinS','spin',v=>v/100,v=>v+'%'],['oceanS','ocean',v=>v,v=>(v>=0?'+':'')+v+' °C']])
  $(id).addEventListener('input',e=>{const v=+e.target.value;ENV[k]=f(v);$(id.replace('S','V')).textContent=t(v);SLIDED++;chEv('slider',{k})});
document.querySelectorAll('[data-ev]').forEach(b=>b.onclick=()=>doEvent(b.dataset.ev));
$('lblBtn').onclick=()=>{LBL=!LBL;$('lblBtn').setAttribute('aria-pressed',LBL);$('lblBtn').textContent=LBL?'On':'Off'};
$('streakBtn').onclick=()=>{STREAK=!STREAK;$('streakBtn').setAttribute('aria-pressed',STREAK);$('streakBtn').textContent=STREAK?'On':'Off'};

/* ---------- stats ---------- */
function computeStats(){let tw=0,iw=0,sw=0,lw=0,rw=0,mw=0,mwI=0;for(let i=0;i<N;i++){const c=COS[(i/GW)|0];tw+=c;if(isOcean(i)){if(ice[i]>.5)iw+=c}else{lw+=c;if(sn[i]>2)sw+=c}rw+=rn[i]*c;const w=Math.hypot(u[i],v[i]);if(w>mw){mw=w;mwI=i}}
  for(const s of STORMS){const w=vmax(s);if(w>mw){mw=w;mwI=idx(s.x,s.y)}RECS.lowP=Math.min(RECS.lowP,s.pc)}if(mw>RECS.wind){RECS.wind=mw;RECS.windI=mwI}
  let minP=1e9;for(let i=0;i<N;i++)if(P[i]<minP)minP=P[i];RECS.lowP=Math.min(RECS.lowP,minP);
  Object.assign(STAT,{ice:iw/tw,snow:lw?sw/lw:0,rain:rw/tw,storms:STORMS.filter(s=>catOf(s)>=1).length,maxCat:Math.max(0,...STORMS.map(catOf)),windNow:mw,maxP:Math.max(...P),minP})}
function sampleHist(force){const last=HIST[HIST.length-1];if(!force&&last&&S.t-last.t<Math.max(0.5,S.speed*0.6))return;HIST.push({t:S.t,temp:STAT.avgT,ice:STAT.ice,co2:ENV.co2});if(HIST.length>240)HIST.shift()}
function findHL(){const C=[];const r=9;for(let y=r;y<GH-r;y+=3)for(let x=0;x<GW;x+=3){const p=P[y*GW+x];let mx=true,mn=true,ring=0,rn2=0;for(let dy=-r;dy<=r&&(mx||mn);dy+=3)for(let dx=-r;dx<=r;dx+=3){if(!dx&&!dy)continue;const o=P[(y+dy)*GW+mod(x+dx,GW)];if(o>=p)mx=false;if(o<=p)mn=false;ring+=o;rn2++}
  const pr=Math.abs(p-ring/Math.max(1,rn2));if(mx&&p>1018&&pr>2.5)C.push({x:x+.5,y:y+.5,t:'H',p,pr});if(mn&&p<1006&&pr>2.5)C.push({x:x+.5,y:y+.5,t:'L',p,pr})}
  C.sort((a,b)=>b.pr-a.pr);HL=[];for(const c of C)if(!HL.some(h=>Math.abs(wdx(h.x-c.x))<14&&Math.abs(h.y-c.y)<10))HL.push(c);HL=HL.slice(0,24)}

/* ---------- rendering ---------- */
const SC3=3,IW=GW*SC3,IH=GH*SC3;const img=document.createElement('canvas');img.width=IW;img.height=IH;const ig=img.getContext('2d');const ID=ig.createImageData(IW,IH);
const DET=(()=>{const out=new Float32Array(IW*IH);let amp=1,tot=0;for(const sp of [14,7,3.5,1.7]){const nx=Math.round(IW/sp),ny=Math.ceil(IH/sp)+2,L=new Float32Array(nx*ny);for(let k=0;k<L.length;k++)L[k]=Math.random()*2-1;
  for(let y=0;y<IH;y++){const fy=y*nx/IW,y0=Math.floor(fy),ty=fy-y0,sy=ty*ty*(3-2*ty);for(let x=0;x<IW;x++){const fx=x*nx/IW,x0=Math.floor(fx),tx=fx-x0,sx=tx*tx*(3-2*tx),xa=x0%nx,xb=(x0+1)%nx,a=L[y0*nx+xa],b=L[y0*nx+xb],c=L[(y0+1)*nx+xa],d=L[(y0+1)*nx+xb];out[y*IW+x]+=amp*((a+(b-a)*sx)+((c+(d-c)*sx)-(a+(b-a)*sx))*sy)}}tot+=amp;amp*=0.55}
  for(let i=0;i<out.length;i++)out[i]/=tot;return out})();
function ramp(stops,val){if(val<=stops[0][0])return stops[0][1];for(let k=1;k<stops.length;k++)if(val<=stops[k][0]){const [a,ca]=stops[k-1],[b,cb]=stops[k],t=(val-a)/(b-a);return[ca[0]+(cb[0]-ca[0])*t,ca[1]+(cb[1]-ca[1])*t,ca[2]+(cb[2]-ca[2])*t]}return stops[stops.length-1][1]}
const TEMPR=[[-50,[230,235,255]],[-30,[150,120,230]],[-15,[80,120,230]],[0,[80,200,230]],[12,[110,210,120]],[22,[240,215,90]],[32,[240,120,50]],[45,[170,20,40]]];
const RAINR=[[0,[0,0,0]],[0.15,[30,90,60]],[0.6,[40,180,70]],[1.5,[240,220,60]],[3,[240,120,40]],[6,[220,40,90]]];
const HUMR=[[0,[90,60,30]],[0.3,[170,140,80]],[0.6,[110,170,140]],[0.85,[60,140,210]],[1,[40,80,200]]];
const PRESR=[[970,[160,40,120]],[995,[90,90,200]],[1008,[100,160,200]],[1016,[230,230,220]],[1025,[240,180,90]],[1040,[200,80,40]]];
const LC=new Float32Array(N*3),LCL=new Float32Array(N*3),LCS=new Float32Array(N*3),CL=new Float32Array(N),NIGHT=new Float32Array(N),LN=new Float32Array(N);
function cellColors(){const vw=S.view,day=dayCycle()||ENV.locked;for(let i=0;i<N;i++)LN[i]=clamp(elev[i]>0?0.15+elev[i]/600:elev[i]/600-0.15,-1,1);
  for(let i=0;i<N;i++){const o=i*3,oc=isOcean(i);let c;
    if(vw==='temp')c=ramp(TEMPR,T[i]);
    else if(vw==='pressure')c=ramp(PRESR,P[i]);
    else if(vw==='humid')c=ramp(HUMR,clamp(q[i]/qsat(T[i]),0,1));
    else{if(oc){c=ice[i]>.5?[218,228,238]:[14+Ts[i]*0.4,40+Ts[i]*0.9,80+Ts[i]*1.1];}
      else{const e=elev[i],r=ravg[i],t=tavg[i];{const sm=(a,b,x)=>{const k=clamp((x-a)/(b-a),0,1);return k*k*(3-2*k)},mix=(A,B,k)=>[A[0]+(B[0]-A[0])*k,A[1]+(B[1]-A[1])*k,A[2]+(B[2]-A[2])*k];
          const warm=sm(8,22,t);let veg=mix(mix([176,158,124],[206,178,118],warm),mix([116,148,80],[164,156,84],warm),sm(0.06,0.22,r));veg=mix(veg,mix([50,104,58],[26,92,44],warm),sm(0.3,0.65,r));
          c=mix(veg,[136,140,124],sm(4,-3,t));c=mix(c,[228,234,240],sm(-5,-12,t));if(sn[i]>0.5)c=mix(c,[238,242,247],clamp(sn[i]/8,0,1));
        if(e>2000){const k=clamp((e-2000)/2500,0,1);c=[c[0]+(130-c[0])*k,c[1]+(118-c[1])*k,c[2]+(106-c[2])*k]}}}
      if(vw==='wind'||vw==='rain'){const g=(c[0]+c[1]+c[2])/3*0.38;c=[g*0.8,g*0.9,g*1.1]}}
    LC[o]=c[0];LC[o+1]=c[1];LC[o+2]=c[2];if(oc){LCS[o]=c[0];LCS[o+1]=c[1];LCS[o+2]=c[2]}else{LCL[o]=c[0];LCL[o+1]=c[1];LCL[o+2]=c[2]}CL[i]=vw==='normal'?clamp((cl[i]-0.22)*1.6,0,0.95):0;NIGHT[i]=day?clamp(sunC[i]*3,0,1):1}
  for(let i=0;i<N;i++){const oc=isOcean(i),x=i%GW,y=(i/GW)|0,T=oc?LCL:LCS;let r=0,g=0,b=0,n=0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){const yy=y+dy;if(yy<0||yy>=GH)continue;const j=yy*GW+mod(x+dx,GW);if(isOcean(j)!==oc){r+=LC[j*3];g+=LC[j*3+1];b+=LC[j*3+2];n++}}const o=i*3;if(n){T[o]=r/n;T[o+1]=g/n;T[o+2]=b/n}else{T[o]=LC[o];T[o+1]=LC[o+1];T[o+2]=LC[o+2]}}}
function shadeT(gx,gy,dt,d,o,rainv,nat){gy=clamp(gy,0,GH-1.001);const y0=Math.floor(gy),ty=gy-y0,y1=Math.min(GH-1,y0+1),x0=Math.floor(gx),tx=gx-x0,xa=mod(x0,GW),xb=mod(x0+1,GW),ia=y0*GW+xa,ib=y0*GW+xb,ic=y1*GW+xa,ie=y1*GW+xb,w0=(1-tx)*(1-ty),w1=tx*(1-ty),w2=(1-tx)*ty,w3=tx*ty;
  const lv=LN[ia]*w0+LN[ib]*w1+LN[ic]*w2+LN[ie]*w3,land=lv+dt*0.75>0,C=land?LCL:LCS;
  let r=C[ia*3]*w0+C[ib*3]*w1+C[ic*3]*w2+C[ie*3]*w3,g=C[ia*3+1]*w0+C[ib*3+1]*w1+C[ic*3+1]*w2+C[ie*3+1]*w3,b=C[ia*3+2]*w0+C[ib*3+2]*w1+C[ic*3+2]*w2+C[ie*3+2]*w3;
  if(land&&nat){const ex=(elev[ib]-elev[ia])*(1-ty)+(elev[ie]-elev[ic])*ty,ey=(elev[ic]-elev[ia])*(1-tx)+(elev[ie]-elev[ib])*tx,s=1+dt*0.18-(ex+ey)/5000;r*=s;g*=s;b*=s}
  if(rainv){const rv=rn[ia]*w0+rn[ib]*w1+rn[ic]*w2+rn[ie]*w3+dt*0.12;if(rv>0.15){const c=ramp(RAINR,rv);r=c[0];g=c[1];b=c[2]}}
  if(nat){const cv=CL[ia]*w0+CL[ib]*w1+CL[ic]*w2+CL[ie]*w3,ca=clamp(cv*1.25+dt*0.75*Math.min(1,cv*3)-0.05,0,0.96);if(ca>0){const w=235+dt*18;r+=(w-r)*ca;g+=(w-g)*ca;b+=(w+6-b)*ca}}
  const nl=NIGHT[ia]*w0+NIGHT[ib]*w1+NIGHT[ic]*w2+NIGHT[ie]*w3;if(nl<1){const k=0.22+0.78*nl;r*=k;g*=k;b*=k*1.08}
  d[o]=r;d[o+1]=g;d[o+2]=b;d[o+3]=255}
function renderImage(){cellColors();const d=ID.data,vw=S.view,rainv=vw==='rain',nat=vw==='normal';
  for(let py=0;py<IH;py++)for(let px=0;px<IW;px++){const pi=py*IW+px,dt=DET[pi];shadeT((px+0.5)/SC3-0.5+dt*0.6,(py+0.5)/SC3-0.5+DET[(pi+IW*40)%(IW*IH)]*0.6,dt,d,pi*4,rainv,nat)}
  ig.putImageData(ID,0,0);dirtyImg=false;lastImg=performance.now()}
// sharp close-ups: when zoomed in, the part of the map on screen is redrawn at full screen resolution
const DETS=(x,y)=>{x=mod(x,IW);y=clamp(y,0,IH-1.001);const x0=Math.floor(x),y0=Math.floor(y),tx=x-x0,ty=y-y0,x1=(x0+1)%IW,y1=Math.min(IH-1,y0+1);return(DET[y0*IW+x0]*(1-tx)+DET[y0*IW+x1]*tx)*(1-ty)+(DET[y1*IW+x0]*(1-tx)+DET[y1*IW+x1]*tx)*ty};
const VIEW={c:document.createElement('canvas'),job:null,ready:null,key:''};
function viewWanted(){return cam.z>=SC3*1.25}
function startView(){const q=Math.min(DPR,Math.sqrt(800000/(W*H))),vw=Math.ceil(W*q),vh=Math.ceil(H*q),wx0=wxOf(0),wy0=Math.max(0,wyOf(0)),wy1=Math.min(GH,wyOf(H));if(wy1<=wy0)return;
  const ph=Math.max(1,Math.round((wy1-wy0)/(wyOf(H)-wyOf(0))*vh));VIEW.job={id:new ImageData(vw,ph),vw,vh:ph,wx0,wy0,ww:W/cam.z,wh:wy1-wy0,row:0,v:S.view}}
function stepView(now){if(!viewWanted()){VIEW.job=null;return}if(now-(VIEW.lastT||0)>1500)VIEW.tk=lastImg;const key=[Math.round(cam.x*4),Math.round(cam.y*4),Math.round(cam.z*20),S.view,VIEW.tk].join();
  if(key!==VIEW.key&&!VIEW.job&&now-(VIEW.moved||0)>140){VIEW.key=key;VIEW.lastT=now;startView()}if(key!==VIEW.keySeen){VIEW.keySeen=key;VIEW.moved=now}
  const J=VIEW.job;if(!J)return;const d=J.id.data,rainv=J.v==='rain',nat=J.v==='normal',t0=performance.now(),sx2=J.ww/J.vw,sy2=J.wh/J.vh,f=SC3;
  while(J.row<J.vh&&performance.now()-t0<(S.paused?9:3)){const py=J.row++,wy=J.wy0+(py+0.5)*sy2;for(let px=0;px<J.vw;px++){const wx=J.wx0+(px+0.5)*sx2,X=wx*f-0.5,Y=wy*f-0.5,dt=DETS(X,Y)+0.3*DETS(X*4.3+17,Y*4.3+5);
      shadeT(wx-0.5+(dt+DETS(X*2.1+3,Y*2.1+9)*0.5)*0.6,wy-0.5+(DETS(X+5.7,Y+40)+DETS(X*2.1+31,Y*2.1+2)*0.5)*0.6,dt,d,(py*J.vw+px)*4,rainv,nat)}}
  if(J.row>=J.vh){VIEW.c.width=J.vw;VIEW.c.height=J.vh;VIEW.c.getContext('2d').putImageData(J.id,0,0);VIEW.ready={wx0:J.wx0,wy0:J.wy0,ww:J.ww,wh:J.wh,v:J.v};VIEW.job=null}}
function legendFor(vw){if(vw==='temp')setLegend('Temperature','linear-gradient(90deg,#e6ebff,#9678e6,#5078e6,#50c8e6,#6ed278,#f0d75a,#f07832,#aa1428)',['−50 °C','12 °C','45 °C']);
  else if(vw==='pressure')setLegend('Air pressure','linear-gradient(90deg,#a02878,#5a5ac8,#64a0c8,#e6e6dc,#f0b45a,#c85028)',['970 hPa','1013','1040 hPa']);
  else if(vw==='rain')setLegend('Rain','linear-gradient(90deg,#1e5a3c,#28b446,#f0dc3c,#f07828,#dc285a)',['drizzle','heavy','torrential']);
  else if(vw==='humid')setLegend('Relative humidity','linear-gradient(90deg,#5a3c1e,#aa8c50,#6eaa8c,#3c8cd2,#2850c8)',['dry','50%','saturated']);
  else if(vw==='wind')setLegend('Wind speed','linear-gradient(90deg,#3c6e8c,#78c8dc,#f0e678,#f07832,#e6286e)',['calm','50 km/h','150+ km/h']);
  else setLegend(null)}
const windCol=w=>{const k=w*3.6;return k<20?'rgba(110,170,200,':k<50?'rgba(150,215,230,':k<90?'rgba(240,230,120,':k<150?'rgba(240,130,60,':'rgba(240,50,120,'};
function initPts(){PTS=[];for(let k=0;k<1500;k++)PTS.push({x:Math.random()*GW,y:Math.random()*GH,a:Math.random()*3,tr:[]})}
function render(c,now){c.fillStyle='rgb(5,9,14)';c.fillRect(0,0,W,H);
  if(dirtyImg&&now-lastImg>(S.paused?60:dayCycle()?120:200))renderImage();
  const z=cam.z,x0=sx(0),y0=sy(0),ww=GW*z;c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  const COVD=(()=>{if(!viewWanted()||!VIEW.ready||VIEW.ready.v!==S.view)return false;const R0=VIEW.ready;for(const k of [-1,0,1]){const X=sx(R0.wx0+k*GW),Xe=sx(R0.wx0+R0.ww+k*GW);if(X<=0.5&&Xe>=W-0.5&&(R0.wy0<=0.01||sy(R0.wy0)<=0.5)&&(R0.wy0+R0.wh>=GH-0.01||sy(R0.wy0+R0.wh)>=H-0.5))return true}return false})();
  const k0=Math.floor((-x0)/ww)-1,k1=Math.ceil((W-x0)/ww)+1;if(!COVD)for(let k=k0;k<=k1;k++)c.drawImage(img,x0+k*ww,y0,ww,GH*z);
  stepView(now);if(viewWanted()&&VIEW.ready&&VIEW.ready.v===S.view){const R0=VIEW.ready;for(const k of [-1,0,1]){const X=sx(R0.wx0+k*GW),Xe=sx(R0.wx0+R0.ww+k*GW);if(Xe<0||X>W)continue;c.drawImage(VIEW.c,X,sy(R0.wy0),Xe-X,sy(R0.wy0+R0.wh)-sy(R0.wy0))}}
  const wrapX=x=>{let X=sx(x);return X-Math.floor((X+ww/2)/ww)*ww};
  const each=(x,f)=>{const X=wrapX(x);for(let k=-1;k<=Math.ceil(W/ww)+1;k++){const XX=X+k*ww;if(XX>-80&&XX<W+80)f(XX)}};
  // wind streaks: each particle leaves a short fading trail along the flow
  if(STREAK&&(S.view==='wind'||S.view==='normal')){const al=S.view==='wind'?0.9:0.35,B=[[],[],[],[],[]];
    for(let pi2=0;pi2<PTS.length;pi2+=(S.view==='wind'?1:3)){const p=PTS[pi2];if(p.tr.length<2)continue;const i=idx(p.x,p.y),k=Math.hypot(u[i],v[i])*3.6;B[k<20?0:k<50?1:k<90?2:k<150?3:4].push(p)}
    const cols=['110,170,200','150,215,230','240,230,120','240,130,60','240,50,120'];c.lineWidth=S.view==='wind'?1.5:1;c.lineCap='round';
    B.forEach((list,bi)=>{c.strokeStyle=`rgba(${cols[bi]},${al})`;c.beginPath();for(const p of list){const t=p.tr;let X0=wrapX(t[0][0]);const Y0=sy(t[0][1]);if(Y0<-20||Y0>H+20)continue;
      for(let kk=-1;kk<=Math.ceil(W/ww);kk++){const off=kk*ww;if(X0+off<-60||X0+off>W+60)continue;c.moveTo(X0+off,Y0);let px=t[0][0];let XX=X0+off;for(let j=1;j<t.length;j++){XX+=wdx(t[j][0]-px)*z;px=t[j][0];c.lineTo(XX,sy(t[j][1]))}}}c.stroke()})}
  // pressure isobars labels H / L
  if(S.view==='pressure'||(S.view==='normal'&&LBL&&z<9)){c.font='700 20px "Oxanium",sans-serif';c.textAlign='center';c.textBaseline='middle';for(const hl of HL){const Y=sy(hl.y);each(hl.x,X=>{c.fillStyle=hl.t==='H'?'rgba(80,140,255,.9)':'rgba(255,90,80,.9)';c.fillText(hl.t,X,Y);if(S.view==='pressure'){c.font='600 10px "IBM Plex Mono",monospace';c.fillText(Math.round(hl.p),X,Y+15);c.font='700 20px "Oxanium",sans-serif'}})}c.textBaseline='alphabetic'}
  // storms
  for(const s of STORMS){const cat=catOf(s),Y=sy(s.y),R=Math.max(14,z*(2.4+cat*0.5)),rot=now/1000*(1.5+cat*0.4)*(s.y<GH/2?-1:1);
    if(LBL){c.strokeStyle='rgba(255,255,255,.35)';c.setLineDash([3,4]);c.lineWidth=1.2;c.beginPath();s.track.forEach((p,k)=>{const XX=wrapX(p[0]),YY=sy(p[1]);k?c.lineTo(XX,YY):c.moveTo(XX,YY)});c.stroke();c.setLineDash([])}
    each(s.x,X=>{c.save();c.translate(X,Y);c.rotate(rot);for(let arm=0;arm<3;arm++){c.beginPath();for(let t=0;t<1;t+=0.04){const a=arm*2.094+t*4.2,rr0=R*(0.25+t*1.1);c.lineTo(Math.cos(a)*rr0,Math.sin(a)*rr0*(s.y<GH/2?1:-1))}c.strokeStyle=`rgba(245,248,255,${0.55+cat*0.07})`;c.lineWidth=R*0.32;c.lineCap='round';c.stroke()}
      c.fillStyle='rgba(245,248,255,.85)';c.beginPath();c.arc(0,0,R*0.42,0,7);c.fill();if(cat>=1){c.fillStyle='rgba(30,50,80,.9)';c.beginPath();c.arc(0,0,R*0.1+1.5,0,7);c.fill()}c.restore();
      if(LBL){c.font='600 11px "IBM Plex Mono",monospace';c.textAlign='center';const lab=`${s.name}${cat?' · cat '+cat:''}`;c.fillStyle='rgba(0,0,0,.6)';const tw=c.measureText(lab).width+10;c.fillRect(X-tw/2,Y+R*1.3,tw,16);c.fillStyle=cat>=4?'#ff8a6a':cat>=1?'#ffd27a':'#e6eef5';c.fillText(lab,X,Y+R*1.3+12)}
      if(S.sel&&S.sel.storm===s){c.strokeStyle='#ffc35a';c.lineWidth=2;c.beginPath();c.arc(X,Y,R*1.6,0,7);c.stroke()}})}
  // tornadoes
  for(const t of TORN){const Y=sy(t.y);each(t.x,X=>{c.strokeStyle='rgba(120,100,90,.6)';c.lineWidth=2;c.beginPath();t.path.forEach((p,k)=>{const XX=X+(p[0]-t.x)*z,YY=Y+(p[1]-t.y)*z;k?c.lineTo(XX,YY):c.moveTo(XX,YY)});c.stroke();
    const s=Math.max(7,z*0.9);c.fillStyle='rgba(70,60,60,.9)';c.beginPath();c.moveTo(X-s,Y-s*1.8);c.lineTo(X+s,Y-s*1.8);c.lineTo(X+s*0.15,Y+s*0.4);c.lineTo(X-s*0.15,Y+s*0.4);c.closePath();c.fill();
    if(LBL&&z>=4){c.font='600 10px "IBM Plex Mono",monospace';c.textAlign='center';c.fillStyle='#ffd0b0';c.fillText('EF'+t.ef,X,Y-s*2.2)}})}
  // lightning
  for(const f of FLASH){const Y=sy(f.y);each(f.x,X=>{const al=Math.max(0,1-f.age*3);if(al<=0)return;c.strokeStyle=`rgba(255,255,210,${al})`;c.lineWidth=2;c.beginPath();let px=X,py=Y-18;c.moveTo(px,py);for(const [dx,dy] of f.seg){px+=dx*6;py+=dy*8;c.lineTo(px,py)}c.stroke();c.fillStyle=`rgba(255,255,220,${al*0.25})`;c.beginPath();c.arc(X,Y,16,0,7);c.fill()})}
  // records
  if(LBL&&S.view==='temp'){c.font='600 11px "IBM Plex Mono",monospace';c.textAlign='center';for(const [i,t,col] of [[RECS.hotI,RECS.hot,'#ffb38a'],[RECS.coldI,RECS.cold,'#b8c8ff']]){const Y=sy(cyOf(i)+.5);each(cxOf(i)+.5,X=>{c.fillStyle=col;c.fillText(`● ${t.toFixed(0)} °C`,X,Y-6)})}}
  if(S.sel&&S.sel.i!=null){const i=S.sel.i,Y=sy(cyOf(i));each(cxOf(i),X=>{const s=Math.max(8,z);c.strokeStyle='#ffc35a';c.lineWidth=2;c.strokeRect(X-1,Y-1,s+2,s+2)})}
  if(STEERD){const X0=sx(STEERD.ax),Y0=sy(STEERD.ay),X1=sx(STEERD.ax+wdx(STEERD.bx-STEERD.ax)),Y1=sy(STEERD.by),a=Math.atan2(Y1-Y0,X1-X0);c.strokeStyle='#ffc35a';c.fillStyle='#ffc35a';c.lineWidth=3;c.beginPath();c.moveTo(X0,Y0);c.lineTo(X1,Y1);c.stroke();c.beginPath();c.moveTo(X1+Math.cos(a)*10,Y1+Math.sin(a)*10);c.lineTo(X1+Math.cos(a+2.5)*9,Y1+Math.sin(a+2.5)*9);c.lineTo(X1+Math.cos(a-2.5)*9,Y1+Math.sin(a-2.5)*9);c.fill();c.font='600 12px "IBM Plex Mono",monospace';c.textAlign='left';c.fillText(STEERD.obj?STEERD.kind:'push the wind',X1+12,Y1)}
  if(HOVER&&TB[S.tool]){const r=(S.brush+0.5)*z;c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=1;c.beginPath();c.arc(sx(HOVER[0]),sy(HOVER[1]),r,0,7);c.stroke()}
}

/* ---------- tools ---------- */
const TB={heat:1,cool:1,wet:1,dry:1,mountain:1,sea:1};let HOVER=null,lastPress=0,STEERD=null;
function applyTool(t,wx,wy,type){const r=S.brush;
  if(t==='heat'){brushCells(wx,wy,r,(i,f)=>{T[i]+=4*f;dT[i]=Math.min(25,dT[i]+1.5*f);if(isOcean(i))Ts[i]+=1.5*f});HEATED++}
  else if(t==='cool'){brushCells(wx,wy,r,(i,f)=>{T[i]-=4*f;dT[i]=Math.max(-40,dT[i]-1.5*f);if(isOcean(i))Ts[i]-=1.5*f});COOLED++}
  else if(t==='wet'){brushCells(wx,wy,r,(i,f)=>{q[i]=Math.min(qsat(T[i])*1.3+2,q[i]+3*f);soil[i]=Math.min(1,soil[i]+0.1*f)});WETTED++}
  else if(t==='dry'){brushCells(wx,wy,r,(i,f)=>{q[i]*=1-0.5*f;cl[i]*=1-0.6*f;soil[i]*=1-0.2*f});WETTED++}
  else if(t==='mountain'){brushCells(wx,wy,r,(i,f)=>{elev[i]=Math.min(8800,Math.max(elev[i],0)+400*f)});RAISEDM++}
  else if(t==='sea'){brushCells(wx,wy,r,(i,f)=>{elev[i]=Math.min(elev[i],-300-2000*f);sn[i]=0});RAISEDM++}
  chEv('brush',{t})}
const SIM={id:'troposphere',name:'Troposphere',world:{w:GW,h:GH,wrapX:true,maxZ:40,followZ:7},home:'earth',freeScen:'earth',tutScen:'earth',defSpeed:2,homeSpeed:2,inspectTab:'insp',canFollow:true,
  speeds:[['1 hr',1/24],['6 hr',0.25],['1 day',1],['1 wk',7],['1 mo',30]],
  fmtRate:v=>v<1?`${Math.round(v*24)} hour${v*24>1.5?'s':''} / s`:v<7?`${fmtN(v,0)} day / s`:v<30?`${fmtN(v/7,0)} week / s`:`${fmtN(v/30,0)} month / s`,
  dateTxt:()=>{const y=Math.floor(S.t/365)+1,d=DOY(),M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],mi=Math.min(11,Math.floor(d/30.42)),dd=Math.floor(d-mi*30.42)+1,hr=Math.floor(mod(S.t,1)*24);return`Year ${y}, ${dd} ${M[mi]}${S.speed<=1?` · ${String(hr).padStart(2,'0')}:00`:''}`},
  dateSub:()=>`${STAT.avgT.toFixed(1)} °C average · ${ENV.co2} ppm CO₂`,
  stepSize:sp=>clamp(sp/10,0.004,0.35),
  tools:[['',[['select','👆','Inspect']]],['Air',[['heat','🔥','Heat','Paint to warm the air and sea. Warm air rises and pulls in wind.',1],['cool','🧊','Cool','Paint to chill the air and sea.',1],['wet','💧','Moisten','Paint water vapour into the air. Rising damp air makes clouds and rain.',1],['dry','🏜️','Dry','Paint to dry the air out and clear the clouds.',1]]],
    ['Pressure',[['low','🌀','Low','Click to make a low-pressure system. Air spirals into it, bringing clouds and rain.'],['high','☀️','High','Click to make a high-pressure system: clear, calm skies.']]],
    ['Steer',[['steer','🧭','Steer','Drag from a storm, tornado or weather system to send it that way. Drag anywhere else to push the wind in that direction.']]],
    ['Storms',[['hurricane','🌀','Hurricane','Click on warm ocean to start a tropical storm. Warm water makes it stronger.'],['tornado','🌪️','Tornado','Click on land to touch down a tornado.'],['lightning','⚡','Lightning','Click to strike lightning.']]],
    ['Land',[['mountain','⛰️','Mountain','Paint to raise mountains. Wind blowing up them drops rain; the far side stays dry.',1],['sea','🌊','Sea','Paint to flood the land with sea.',1]]]],
  scens:SCENLIST,
  load(id){resetEnv();S.t=0;(SCENS[id]||SCENS.earth)();this.t0=S.t;initFields();computeStats();findHL();HIST=[];sampleHist(true);syncWorldUI();legendFor(S.view);if(!PTS.length)initPts();dirtyImg=true;lastImg=0},
  after(){S.t=this.t0||0;dirtyImg=true},
  step(dt){spawnSystems(dt);physics(dt,false);stormStep(dt);tornadoStep(dt);if(ENV.dust>0&&!EVT.volcano)ENV.dust=Math.max(0,ENV.dust-dt*0.02);if(EVT.volcano)ENV.dust=Math.min(6,ENV.dust+dt*0.5);
    {const f=Math.exp(-dt/6),g=Math.exp(-dt/5);for(let i=0;i<N;i++){dT[i]*=f;if(WU[i]||WV[i]){WU[i]*=g;WV[i]*=g;if(Math.abs(WU[i])+Math.abs(WV[i])<0.2){WU[i]=0;WV[i]=0}}}}dirtyImg=true},
  frame(dt){const sp=1.6;this.fk=(this.fk||0)+1;for(const p of PTS){const i=idx(p.x,p.y);p.x=mod(p.x+u[i]*MS2C/COS[clamp(Math.floor(p.y),0,GH-1)]*dt*sp,GW);p.y+=v[i]*MS2C*dt*sp;p.a+=dt;if(this.fk%2===0){p.tr.push([p.x,p.y]);if(p.tr.length>14)p.tr.shift()}if(p.y<0||p.y>=GH||p.a>5+Math.random()*4){p.x=Math.random()*GW;p.y=Math.random()*GH;p.a=0;p.tr=[]}}
    for(const f of FLASH)f.age+=dt;FLASH=FLASH.filter(f=>f.age<0.5)},
  render,
  stats:()=>[['Average',STAT.avgT.toFixed(1)+' °C'],['Hurricanes',STAT.storms],['Sea ice',Math.round(STAT.ice*100)+'%'],['Strongest wind',Math.round((STAT.windNow||0)*3.6)+' km/h']],
  hud(){computeStats();findHL();sampleHist();renderClimate();renderInspect()},
  pick(wx,wy){for(const s of STORMS)if(Math.abs(wdx(s.x-wx))<3&&Math.abs(s.y-wy)<3)return{storm:s};const y=Math.floor(wy);if(y<0||y>=GH)return null;return{i:idx(wx,wy)}},
  selPos:s=>s.storm?(s.storm.dead||!STORMS.includes(s.storm)?null:[s.storm.x,s.storm.y]):[cxOf(s.i)+.5,cyOf(s.i)+.5],
  pointer(type,wx,wy){const t=S.tool;HOVER=[wx,wy];
    if(t==='steer'){if(type==='down'){let obj=null,kind='wind';for(const s0 of STORMS)if(Math.abs(wdx(s0.x-wx))<3&&Math.abs(s0.y-wy)<3){obj=s0;kind='storm'}if(!obj)for(const t0 of TORN)if(Math.abs(wdx(t0.x-wx))<2&&Math.abs(t0.y-wy)<2){obj=t0;kind='tornado'}if(!obj)for(const s0 of SYS)if(Math.abs(wdx(s0.x-wx))<3&&Math.abs(s0.y-wy)<3){obj=s0;kind='system'}STEERD={obj,kind,ax:obj?obj.x:wx,ay:obj?obj.y:wy,bx:wx,by:wy}}
      else if(type==='drag'&&STEERD){STEERD.bx=wx;STEERD.by=wy}
      else if(type==='up'&&STEERD){const d=STEERD;STEERD=null;const dx=wdx(wx-d.ax),dy=wy-d.ay,L=Math.hypot(dx,dy);if(L<0.8){if(d.obj){d.obj.steer=null;d.obj.steerT=0;toast('Released: it drifts with the winds again')}return}
        const sp=clamp(L*1.2,3,45),st={u:dx/L*sp,v:dy/L*sp},dir=compass(st.u,st.v);STEERED++;chEv('steer',{kind:d.kind,u:st.u,v:st.v});
        if(d.kind==='storm'){d.obj.steer=st;d.obj.steerT=8;toast(`🧭 ${d.obj.name} turns ${dir}`)}else if(d.kind==='tornado'){d.obj.steer=st;toast(`🧭 The tornado veers ${dir}`)}else if(d.kind==='system'){d.obj.steer=st;d.obj.steerT=10;toast(`🧭 The ${d.obj.dp<0?'low':'high'} heads ${dir}`)}
        else{const r=S.brush+2;brushCells(d.ax,d.ay,r,(j,f)=>{WU[j]=clamp(WU[j]+st.u*f,-60,60);WV[j]=clamp(WV[j]+st.v*f,-60,60)});const steps=Math.ceil(L);for(let k=1;k<=steps;k++)brushCells(d.ax+dx*k/steps,d.ay+dy*k/steps,Math.max(1,r-1),(j,f)=>{WU[j]=clamp(WU[j]+st.u*f*0.5,-60,60);WV[j]=clamp(WV[j]+st.v*f*0.5,-60,60)});toast(`🧭 The wind now blows ${dir} here`)}}
      return}
    if(type==='up')return;const i=idx(wx,wy);
    if(t==='low'||t==='high'){if(type!=='down')return;addSys(wx,wy,t==='low'?-26:22,5,8);PRESSED++;chEv('press',{t});toast(t==='low'?'🌀 A low-pressure system forms':'☀️ A high-pressure system builds');return}
    if(t==='hurricane'&&type==='down'){if(!isOcean(i)){toast('Hurricanes need warm ocean: click on the sea');return}if(Math.abs(latOf(wy))<4){toast('Too close to the equator: storms need the Coriolis effect to spin');return}if(Ts[i]<26.5)toast(`The water here is only ${Ts[i].toFixed(0)} °C: storms need 26.5 °C or warmer to grow`);const s=addStorm(wx,wy,996,true);USERSTORM++;S.sel={storm:s};return}
    if(t==='tornado'&&type==='down'){if(isOcean(i)){toast('Tornadoes touch down on land');return}addTornado(wx,wy,true);return}
    if(t==='lightning'&&type==='down'){flash(wx,wy,true);return}
    if(TB[t]&&(type==='down'||type==='drag')){const now=performance.now();if(type==='drag'&&now-lastPress<40)return;lastPress=now;applyTool(t,wx,wy)}},
  hover(wx,wy){HOVER=[wx,wy]},
  viewChanged:vw=>{legendFor(vw);dirtyImg=true;lastImg=0},
  find(qs){const out=[],add=(label,sub,go)=>out.push({label,sub,go});
    for(const s of STORMS)if(s.name.toLowerCase().includes(qs)||'hurricane storm cyclone typhoon'.includes(qs)||qs.includes('hurric')||qs.includes('storm'))add(`🌀 ${s.name}`,catName(s),()=>{S.sel={storm:s};S.follow=true;flyToW(s.x,s.y,6);S.follow=true;showTab('insp')});
    if('hottest heat warmest'.includes(qs)||qs.includes('hot'))add('Hottest place',RECS.hot.toFixed(0)+' °C',()=>{const i=RECS.hotI;S.sel={i};flyToW(cxOf(i),cyOf(i),5);showTab('insp')});
    if('coldest cold freezing'.includes(qs)||qs.includes('cold'))add('Coldest place',RECS.cold.toFixed(0)+' °C',()=>{const i=RECS.coldI;S.sel={i};flyToW(cxOf(i),cyOf(i),5);showTab('insp')});
    if('windiest wind gale'.includes(qs)||qs.includes('wind'))add('Windiest place',Math.round(RECS.wind*3.6)+' km/h',()=>{let m=0,mi=0;for(let i=0;i<N;i++){const w=Math.hypot(u[i],v[i]);if(w>m){m=w;mi=i}}S.sel={i:mi};flyToW(cxOf(mi),cyOf(mi),5);showTab('insp')});
    if('tornado twister'.includes(qs)||qs.includes('torn'))for(const t of TORN)add(`🌪 EF${t.ef} tornado`,'on the ground now',()=>{S.sel={i:idx(t.x,t.y)};flyToW(t.x,t.y,8)});
    for(const [,items] of SIM.tools)for(const [id,ico,name] of items)if(id!=='select'&&(name.toLowerCase().includes(qs)||id.includes(qs)))add(`${ico} Use the ${name} tool`,'tool',()=>setTool(id));
    for(const [ev,lab] of [['heatwave','☀ Heat wave'],['coldsnap','❄ Polar vortex'],['season','🌀 Hurricane season'],['elnino','🌊 El Niño'],['volcano','🌋 Volcanic winter'],['drought','🏜 Drought'],['outbreak','🌪 Tornado outbreak']])if(lab.toLowerCase().includes(qs)||ev.includes(qs))add(lab,'event',()=>doEvent(ev));
    for(const s of SCENLIST)if(s.name.toLowerCase().includes(qs))add('World: '+s.name,s.desc,()=>{loadScen(s.id);toast(s.name)});
    return out},
  tabShown(id){if(id==='climate')renderClimate(true)},
  selChanged(){INSPK='';renderInspect()},
};
/* ---------- panels ---------- */
function kv(rows){return rows.map(([k,vv])=>`<div><span class="k">${k}</span><span class="v">${vv}</span></div>`).join('')}
const fmtLat=y=>{const l=latOf(y);return Math.abs(l).toFixed(0)+'°'+(l>=0?'N':'S')},fmtLon=x=>{const l=lonOf(x);return Math.abs(l).toFixed(0)+'°'+(l>=0?'E':'W')};
const compass=(ue,vs)=>{const a=(Math.atan2(-vs,ue)*180/Math.PI+360)%360;return['east','north-east','north','north-west','west','south-west','south','south-east'][Math.round(a/45)%8]};
const fromDir=(ue,vs)=>compass(-ue,-vs);
function renderClimate(force){if($('pane-climate').hidden&&!force)return;
  $('cStats').innerHTML=kv([['Average temperature',STAT.avgT.toFixed(1)+' °C'],['Change',(STAT.avgT-STAT.avgT0>=0?'+':'')+(STAT.avgT-STAT.avgT0).toFixed(1)+' °C'],['Sea ice',Math.round(STAT.ice*100)+'%'],['Snow on land',Math.round(STAT.snow*100)+'%'],['Hurricanes now',STAT.storms],['Tornadoes now',TORN.length],['Carbon dioxide',ENV.co2+' ppm'],['Lightning so far',fmtN(LIGHT)]]);
  const g=$('graph'),gc=g.getContext('2d'),w=g.width=g.clientWidth*DPR,hh=g.height=g.clientHeight*DPR;gc.clearRect(0,0,w,hh);
  if(HIST.length>1){const t0=HIST[0].t,t1=HIST[HIST.length-1].t,X=t=>8+(w-16)*(t-t0)/Math.max(1e-6,t1-t0);const line=(f,lo,hi,col)=>{gc.strokeStyle=col;gc.lineWidth=2*DPR;gc.beginPath();HIST.forEach((p,k)=>{const y=hh-8-(hh-16)*clamp((f(p)-lo)/(hi-lo),0,1);k?gc.lineTo(X(p.t),y):gc.moveTo(X(p.t),y)});gc.stroke()};
    const lo=Math.min(...HIST.map(p=>p.temp))-1,hi=Math.max(...HIST.map(p=>p.temp))+1;line(p=>p.temp,lo,hi,'#ff8a5c');line(p=>p.ice,0,0.3,'#dfe9f5');line(p=>p.co2,100,2100,'#7fd18a')}
  $('gKey').innerHTML='<span style="color:#ff8a5c">■ average temperature</span> · <span style="color:#dfe9f5">■ sea ice</span> · <span style="color:#7fd18a">■ CO₂</span>';
  const L=$('slist');const ss=[...STORMS].sort((a,b)=>a.pc-b.pc);L.innerHTML='';if(!ss.length)L.innerHTML='<p class="note">No tropical storms right now. They form over oceans warmer than 26.5 °C, mostly in late summer.</p>';
  for(const s of ss){const r=document.createElement('button');r.className='sprow';r.innerHTML='<i></i><span></span><b></b>';r.children[0].style.background=catOf(s)>=4?'#ff6b5a':catOf(s)>=1?'#ffc35a':'#cfdbe6';r.children[1].textContent=`${s.name} · ${catName(s)}`;r.children[2].textContent=Math.round(vmax(s)*3.6)+' km/h';r.onclick=()=>{S.sel={storm:s};S.follow=true;flyToW(s.x,s.y,6);S.follow=true;showTab('insp')};L.appendChild(r)}
  $('cRec').innerHTML=kv([['Hottest',RECS.hot.toFixed(1)+' °C'],['Coldest',RECS.cold.toFixed(1)+' °C'],['Strongest wind',Math.round(RECS.wind*3.6)+' km/h'],['Lowest pressure',Math.round(RECS.lowP)+' hPa']])}
let INSPK='';
function renderInspect(){const b=S.sel;$('inspEmpty').hidden=!!b;$('inspBody').hidden=!b;if(!b)return;const body=$('inspBody');
  if(b.storm){const s=b.storm;if(!STORMS.includes(s)){body.innerHTML=`<h2 class="ititle">${s.name}</h2><p class="note">This storm has died out. Peak strength: ${s.peak?'category '+s.peak:'tropical storm'}.</p>`;INSPK='';return}
    if(INSPK!=='s'+s.id){INSPK='s'+s.id;body.innerHTML=`<h2 class="ititle" id="iT"></h2><div class="isub" id="iS"></div><div class="kv" id="iK"></div><div class="sl"><div class="row"><span class="k">Steer it</span><span id="sDirV">drifting</span></div><input type="range" id="sDir" min="0" max="359" step="1" value="0"></div><div class="actions"><button class="btn" id="sDrift">Let it drift</button><button class="btn" id="sUp">Strengthen</button><button class="btn" id="sDn">Weaken</button><button class="btn" id="sFol">Follow</button></div><p class="note">Hurricanes feed on warm ocean water. Over land or cold seas they lose their fuel and fade. The eye is calm; the eyewall around it has the strongest winds.</p>`;
      $('sUp').onclick=()=>{s.pc=Math.max(880,s.pc-12);chEv('stormedit',{});toast(`${s.name} strengthens`)};$('sDn').onclick=()=>{s.pc=Math.min(1009,s.pc+12);chEv('stormedit',{weaken:1});toast(`${s.name} weakens`)};$('sFol').onclick=()=>{S.follow=true;cam.z=Math.max(cam.z,6)};$('sDir').oninput=e=>{const a=+e.target.value*Math.PI/180;s.steer={u:Math.cos(a)*9,v:-Math.sin(a)*9};s.steerT=8;STEERED++;chEv('steer',{kind:'storm',u:s.steer.u,v:s.steer.v});$('sDirV').textContent='heading '+compass(s.steer.u,s.steer.v)};$('sDrift').onclick=()=>{s.steer=null;s.steerT=0;$('sDirV').textContent='drifting'}}
    if(!(s.steer&&s.steerT>0))$('sDirV').textContent='drifting with the winds';$('iT').textContent=s.name;$('iS').textContent=`${catName(s)} · ${fmtLat(s.y)} ${fmtLon(s.x)}`;const i=idx(s.x,s.y);
    $('iK').innerHTML=kv([['Top winds',Math.round(vmax(s)*3.6)+' km/h'],['Central pressure',Math.round(s.pc)+' hPa'],['Sea temperature',isOcean(i)?Ts[i].toFixed(1)+' °C':'over land'],['Age',s.age.toFixed(1)+' days'],['Peak',s.peak?'category '+s.peak:'tropical storm'],['Heading',compass(u[i],v[i])]]);return}
  const i=b.i,ws=Math.hypot(u[i],v[i]),rh=clamp(q[i]/qsat(T[i]),0,1);INSPK='';
  const sky=rn[i]>2.5?'Torrential rain':rn[i]>0.9?(T[i]<0.5?'Heavy snow':'Heavy rain'):rn[i]>0.15?(T[i]<0.5?'Snow':'Rain'):cl[i]>0.6?'Overcast':cl[i]>0.3?'Partly cloudy':'Clear';
  body.innerHTML=`<h2 class="ititle">${sky}</h2><div class="isub">${fmtLat(cyOf(i))} ${fmtLon(cxOf(i))} · ${isOcean(i)?(ice[i]>.5?'sea ice':'ocean'):elev[i]>2000?'mountains':sn[i]>2?'snow-covered land':'land'}</div><div class="kv">${kv([['Temperature',T[i].toFixed(1)+' °C'],['Pressure',Math.round(P[i])+' hPa'],['Wind',`${Math.round(ws*3.6)} km/h from the ${fromDir(u[i],v[i])}`],['Humidity',Math.round(rh*100)+'%'],['Cloud',Math.round(cl[i]*100)+'%'],['Rain',(rn[i]).toFixed(1)+' mm/h'],[isOcean(i)?'Sea temperature':'Elevation',isOcean(i)?Ts[i].toFixed(1)+' °C':fmtN(Math.round(elev[i]))+' m'],['Snow',sn[i]>0.5?Math.round(sn[i])+' cm':'none']])}</div><p class="note">Average here: ${tavg[i].toFixed(0)} °C and ${ravg[i]<0.12?'very dry':ravg[i]<0.35?'fairly dry':ravg[i]<0.6?'damp':'very wet'}.</p>`}
