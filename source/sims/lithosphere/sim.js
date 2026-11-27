/* ================= Lithosphere: plates, mountains, volcanoes, earthquakes ================= */
// The planet is a 360 x 180 grid (one cell per degree, about 111 km). It wraps east-west.
// Time is in millions of years (Myr). Plate velocities are in cells per Myr: 1 cm/yr = 10 km/Myr = 0.09 cells/Myr.
const GW=360,GH=180,N=GW*GH,KMC=111,CMY=0.09;
const h=new Float32Array(N),cr=new Float32Array(N),age=new Float32Array(N),pl=new Int16Array(N),bnd=new Uint8Array(N),brel=new Float32Array(N),up=new Float32Array(N),dO=new Uint16Array(N),T0=new Float32Array(N),RAIN=new Float32Array(N),STR=new Float32Array(N);
let PL=[],HS=[],VOL=[],QK=[],PARTS=[],HIST=[],QLOG=[];
const ENV={sea:0,temp:0,speed:1,erosion:1,heat:1,dust:0,snow:0,hot:0};
const EVT={supervolcano:false,snowball:false,hothouse:false};
let SEA=0,dirtyImg=true,dirtyClim=true,lastImg=0,STAT={land:0,peak:0,peakI:0,deep:0,deepI:0,cont:0,isl:0,ice:0,avgT:15,vol:0,old:0,landIce:0,contCells:0},LBL=true;
const idx=(x,y)=>y*GW+mod(Math.round(x),GW);
const cxOf=i=>i%GW,cyOf=i=>(i/GW)|0;
const latOf=y=>90-(y+0.5)*180/GH,lonOf=x=>(x+0.5)*360/GW-180;
const wdx=dx=>{dx=mod(dx,GW);return dx>GW/2?dx-GW:dx};
let RS=1;function seed(s){RS=s>>>0||1}function R(){RS|=0;RS=RS+0x6D2B79F5|0;let t=Math.imul(RS^RS>>>15,1|RS);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}
const NAMES=['Aurora','Borealis','Cinder','Dorado','Ember','Fjordia','Gale','Halcyon','Ionia','Jadeite','Kestrel','Lumen','Marrow','Nimbus','Onyx','Pyre','Quill','Rhea','Solace','Tundria','Umber','Vesper','Wren','Zephyr','Basalta','Corvid','Drift','Echo'];
const VSYL=['Ka','Lo','Mau','Te','Ri','Sha','Vel','Ok','Na','Pu','Is','Hal','Ar','Tor','Ven','Ul'];
const vname=()=>'Mount '+pick(VSYL)+pick(VSYL).toLowerCase()+pick(['a','o','i','an','ur','eth','is']);
const PCOL=['#e8735a','#5aa0e8','#e8c45a','#7fd18a','#c07fe8','#5ad6d0','#e85a9e','#a7b85a','#e89a5a','#7f8fe8','#d8e85a','#5ae88f','#e85a5a','#5a7fe8','#e8d0a0','#a0e8d0'];

/* ---------- noise ---------- */
function fbm(oct,base,pers){const out=new Float32Array(N);let amp=1,tot=0;
  for(let o=0;o<oct;o++){const nx=Math.max(2,Math.round(GW/(base/2**o))),sp=GW/nx,ny=Math.ceil(GH/sp)+2,L=new Float32Array(nx*ny);for(let k=0;k<L.length;k++)L[k]=R()*2-1;
    for(let y=0;y<GH;y++){const fy=y/sp,y0=Math.floor(fy),ty=fy-y0,sy=ty*ty*(3-2*ty);for(let x=0;x<GW;x++){const fx=x/sp,x0=Math.floor(fx),tx=fx-x0,sx=tx*tx*(3-2*tx),xa=x0%nx,xb=(x0+1)%nx;
      const a=L[y0*nx+xa],b=L[y0*nx+xb],c=L[(y0+1)*nx+xa],d=L[(y0+1)*nx+xb];out[y*GW+x]+=amp*((a+(b-a)*sx)+((c+(d-c)*sx)-(a+(b-a)*sx))*sy)}}
    tot+=amp;amp*=pers}
  for(let i=0;i<N;i++)out[i]/=tot;return out}
function quantile(arr,q){const s=Float32Array.from(arr).sort();return s[Math.floor(clamp(q,0,1)*(s.length-1))]}

/* ---------- world building ---------- */
function newPlate(vx,vy,name){const id=PL.length;PL.push({id,name:name||NAMES[id%NAMES.length],vx,vy,ax:0,ay:0,col:PCOL[id%PCOL.length],n:0,cx:0,cy:0,cont:0});return id}
function randVel(cm){const a=R()*Math.PI*2,s=(cm??(2+R()*5))*CMY;return[Math.cos(a)*s,Math.sin(a)*s*0.7]}
function voronoi(seeds,warp){const wn=fbm(4,60,0.55),wn2=fbm(3,40,0.5);
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const i=y*GW+x;let best=1e9,bp=0;const wx=x+wn[i]*warp,wy=y+wn2[i]*warp*0.7;
    for(const s of seeds){const dx=wdx(wx-s.x),dy=wy-s.y,d=Math.sqrt(dx*dx+dy*dy)/(s.w||1);if(d<best){best=d;bp=s.p}}pl[i]=bp}}
function setCrust(mask,land){for(let i=0;i<N;i++){const c=mask[i];cr[i]=c>0?1:0;const y=cyOf(i);
  if(c>0){h[i]=150+Math.min(1600,c*2600)+Math.max(0,land[i])*900}else{age[i]=20+R()*30+Math.abs(land[i])*140;h[i]=-2500-3000*Math.sqrt(Math.min(age[i],160)/160)}
  if(c>0)age[i]=200+R()*800}}
function clearWorld(){PL=[];HS=[];VOL=[];QK=[];PARTS=[];HIST=[];QLOG=[];Object.assign(ENV,{sea:0,temp:0,speed:1,erosion:1,heat:1,dust:0,snow:0,hot:0});EVT.supervolcano=EVT.snowball=EVT.hothouse=false;STR.fill(0);bnd.fill(0);syncWorldUI()}
function genEarth(sd,landFrac,nPl,opts={}){seed(sd);clearWorld();const n=fbm(6,120,0.52),m=fbm(4,50,0.5);
  const lat=y=>Math.abs((y+.5)/GH*2-1);for(let i=0;i<N;i++){n[i]=n[i]+0.25*m[i]-(opts.poleLow?0.25*Math.max(0,lat(cyOf(i))-0.75):0)}
  const thr=landFrac>0?quantile(n,1-landFrac):9;const mask=new Float32Array(N);for(let i=0;i<N;i++)mask[i]=n[i]-thr;setCrust(mask,m);
  const seeds=[];for(let k=0;k<nPl;k++){const [vx,vy]=randVel();seeds.push({x:R()*GW,y:15+R()*(GH-30),p:newPlate(vx,vy),w:0.7+R()*0.7})}voronoi(seeds,22);finish()}
function finish(){for(const p of PL){p.ax=p.ay=0}countPlates();for(const p of PL){if(p.cont>0.5){p.vx*=0.6;p.vy*=0.6}}dirtyImg=dirtyClim=true;updateClimate();computeStats();HIST=[];sampleHist(true)}
function blob(cx,cy,rx,ry,noise,amp){const out=new Float32Array(N);for(let i=0;i<N;i++){const x=cxOf(i),y=cyOf(i),dx=wdx(x-cx)/rx,dy=(y-cy)/ry;out[i]=1-Math.sqrt(dx*dx+dy*dy)+noise[i]*(amp??0.5)}return out}
/* ---------- the real Earth: continents, mountain ranges, the major plates and their real speeds ---------- */
const LAND=[
 [[-168,66],[-162,70],[-140,70],[-125,70],[-95,72],[-80,73],[-62,66],[-55,52],[-66,45],[-70,41],[-76,35],[-81,31],[-80,25],[-82,28],[-90,30],[-97,27],[-97,21],[-87,21],[-88,16],[-83,10],[-79,9],[-80,8],[-86,12],[-92,15],[-105,20],[-110,24],[-112,29],[-117,32],[-124,40],[-124,48],[-135,58],[-150,60],[-160,58],[-166,62]],
 [[-50,60],[-42,60],[-20,70],[-18,80],[-35,83],[-60,82],[-72,78],[-55,70]],
 [[-79,9],[-72,12],[-60,10],[-50,0],[-35,-6],[-39,-15],[-48,-26],[-58,-35],[-65,-42],[-68,-55],[-74,-52],[-73,-40],[-71,-30],[-70,-18],[-76,-14],[-81,-5],[-80,0]],
 [[-10,36],[-9,43],[-2,47],[-5,48],[2,51],[8,54],[10,57],[5,62],[15,69],[28,71],[45,68],[60,69],[70,73],[90,76],[110,77],[140,72],[160,70],[180,68],[180,65],[170,60],[160,55],[155,60],[142,53],[140,46],[130,42],[127,35],[122,31],[121,25],[110,20],[106,10],[104,1],[100,7],[98,15],[94,17],[90,22],[86,20],[80,15],[77,8],[73,18],[70,22],[66,25],[57,25],[52,24],[55,17],[44,12],[43,16],[35,28],[33,31],[35,36],[27,37],[26,40],[23,38],[19,40],[16,38],[18,40],[12,44],[8,44],[3,43],[-4,37]],
 [[-17,21],[-16,12],[-12,7],[-4,5],[8,4],[9,1],[13,-12],[12,-18],[15,-27],[18,-34],[25,-34],[33,-26],[35,-18],[40,-15],[40,-3],[44,2],[51,11],[44,11],[38,18],[33,29],[32,31],[20,32],[10,37],[-6,36],[-10,30],[-13,27]],
 [[114,-22],[122,-18],[130,-12],[136,-12],[137,-16],[142,-11],[146,-19],[153,-26],[151,-34],[147,-38],[140,-38],[135,-35],[130,-32],[116,-35],[114,-26]],
 [[-180,-78],[-150,-77],[-120,-73],[-90,-72],[-60,-64],[-58,-63],[-40,-75],[0,-70],[40,-69],[70,-67],[100,-66],[140,-67],[170,-72],[180,-78],[180,-90],[-180,-90]],
 [[-5,50],[1,51],[2,53],[-2,57],[-5,58],[-6,55],[-3,54]],[[130,31],[135,34],[140,35],[142,40],[141,45],[145,44],[140,42],[136,36],[131,34]],[[44,-25],[47,-25],[50,-15],[49,-12],[44,-17]],
 [[95,5],[106,-6],[104,-5],[96,2]],[[109,1],[117,7],[119,1],[116,-4],[110,-3]],[[131,-1],[141,-3],[150,-10],[141,-9],[133,-4]],[[172,-35],[178,-38],[174,-41],[167,-46],[171,-44]],[[-24,64],[-14,65],[-16,66],[-22,66]],[[120,18],[122,14],[124,10],[126,7],[122,10]]];
const RANGES=[[[70,35],[80,32],[88,28],[95,28]],[[-80,8],[-78,-2],[-70,-20],[-70,-33],[-72,-50]],[[-150,62],[-125,55],[-115,45],[-108,37],[-106,32]],[[5,45],[10,46.5],[16,47]],[[40,42],[48,41]],[[-84,35],[-72,44]],[[60,52],[60,66]],[[44,38],[56,33],[60,30]],[[100,30],[104,24]],[[140,-38],[150,-30],[146,-18]],[[-8,32],[8,35]],[[36,8],[38,-5]],[[-50,72],[-30,72]],[[30,-90],[30,-80]]];
const ll=(lon,lat)=>[(lon+180)/360*GW,(90-lat)/180*GH];
function inPoly(x,y,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const [xi,yi]=P[i],[xj,yj]=P[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c}return c}
function genRealEarth(){seed(42);clearWorld();const n=fbm(5,40,0.55),m=fbm(4,20,0.5),polys=LAND.map(P=>P.map(([a,b])=>[a,b]));
  for(let i=0;i<N;i++){const lon=lonOf(cxOf(i)),lat=latOf(cyOf(i));let land=false;for(const P of polys)if(inPoly(lon,lat,P)){land=true;break}
    if(land){cr[i]=1;h[i]=250+Math.max(0,n[i])*900+Math.max(0,m[i])*400;age[i]=500}else{cr[i]=0;age[i]=30+Math.abs(n[i])*200;h[i]=-2500-3000*Math.sqrt(Math.min(age[i],160)/160)}}
  // continental shelves: shallow sea around the coasts
  for(let i=0;i<N;i++)if(cr[i]<.5){const x=cxOf(i),y=cyOf(i);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const j=idx(x+dx,clamp(y+dy,0,GH-1));if(cr[j]>.5){h[i]=-150;cr[i]=0.55;break}}}
  for(const L of RANGES)for(let k=0;k<L.length-1;k++){const [a,b]=ll(...L[k]),[c,d]=ll(...L[k+1]),st=Math.ceil(Math.hypot(c-a,d-b)*2);for(let q=0;q<=st;q++){const x=a+(c-a)*q/st,y=b+(d-b)*q/st;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const r=Math.hypot(dx,dy);if(r>3)continue;const j=idx(x+dx,clamp(Math.round(y+dy),0,GH-1));if(cr[j]>.5)h[j]=Math.max(h[j],(5200+n[j]*1500)*(1-r/3.5))}}}
  const PLATES=[['Pacific',-6,4,[[-150,0],[-170,30],[-130,-30],[-160,-45],[175,15],[-140,40]]],['North American',-2,0,[[-100,45],[-40,40],[-150,68],[-40,70],[150,65]]],['South American',-2.5,0.5,[[-60,-15],[-25,-25]]],
    ['Eurasian',1,0.3,[[60,55],[100,50],[15,50],[-15,50],[125,40],[95,10]]],['African',1.5,2,[[20,0],[0,-20],[50,-25],[-15,10]]],['Indo-Australian',2,6,[[78,20],[135,-25],[90,-20],[165,-30],[110,-10]]],
    ['Antarctic',0.5,0,[[0,-75],[120,-72],[-90,-72],[-150,-68],[60,-58],[-30,-60]]],['Nazca',7,1,[[-90,-20]]],['Cocos',5,5,[[-97,8]]],['Caribbean',1,0,[[-72,15]]],['Philippine',-5,3,[[133,17]]],['Arabian',2,3,[[47,23]]]];
  const seeds=[];for(const [nm,ve,vn,pts] of PLATES){const id=newPlate(ve*CMY,-vn*CMY,nm);for(const [lo,la] of pts){const [x,y]=ll(lo,la);seeds.push({x,y,p:id,w:1})}}
  for(let i=0;i<N;i++){const x=cxOf(i),y=cyOf(i);let best=1e9,bp=0;for(const sd of seeds){const dx=wdx(x-sd.x),dy=y-sd.y,d=dx*dx+dy*dy;if(d<best){best=d;bp=sd.p}}pl[i]=bp}
  for(const [nm,lo,la] of [['Hawaii',-155,19],['Iceland',-18,64],['Yellowstone',-110,44.5],['Galápagos',-91,-0.5],['Réunion',55.5,-21]]){const [x,y]=ll(lo,la);HS.push({x:Math.round(x),y:Math.round(y),str:1,name:nm})}
  finish();for(const p of PL){const o=PLATES.find(q=>q[0]===p.name);if(o){p.vx=o[1]*CMY;p.vy=-o[2]*CMY}}}
const SCENS={
  real:()=>genRealEarth(),
  earth:()=>genEarth(7,0.3,11),
  pangaea:()=>{seed(21);clearWorld();const n=fbm(5,70,0.55),m=fbm(4,40,0.5),b=blob(180,92,95,52,n,0.55);const mask=new Float32Array(N);for(let i=0;i<N;i++)mask[i]=b[i]>0?0.05+b[i]*0.6:-1;setCrust(mask,m);
    const seeds=[];const k=6;for(let j=0;j<k;j++){const a=j/k*Math.PI*2+0.3,r=42;const x=180+Math.cos(a)*r,y=92+Math.sin(a)*r*0.55;seeds.push({x,y,p:newPlate(Math.cos(a)*3.2*CMY,Math.sin(a)*2.2*CMY),w:1})}
    for(let j=0;j<4;j++){const x=j*90+20,y=j%2?30:150;seeds.push({x,y,p:newPlate(wdx(180-x)>0?1.5*CMY:-1.5*CMY,(92-y)/60*1.5*CMY),w:1.3})}voronoi(seeds,14);finish()},
  collide:()=>{seed(5);clearWorld();const n=fbm(5,50,0.55),m=fbm(4,40,0.5),A=blob(115,108,38,26,n,0.4),B=blob(250,78,70,36,n,0.4);const mask=new Float32Array(N);for(let i=0;i<N;i++)mask[i]=Math.max(A[i],B[i])>0?0.05+Math.max(A[i],B[i])*0.5:-1;setCrust(mask,m);
    const p0=newPlate(7*CMY,-0.8*CMY,'Indus'),p1=newPlate(-0.3*CMY,0,'Asiana'),p2=newPlate(-1*CMY,2*CMY),p3=newPlate(1.5*CMY,-1*CMY),p4=newPlate(-2*CMY,-1*CMY);
    voronoi([{x:128,y:108,p:p0,w:1.1},{x:250,y:72,p:p1,w:1.5},{x:40,y:40,p:p2,w:1},{x:330,y:150,p:p3,w:1},{x:60,y:160,p:p4,w:1}],10);finish()},
  hawaii:()=>{genEarth(33,0.18,8);for(let i=0;i<N;i++)if(cr[i]<.5&&wdx(cxOf(i)-200)>-70&&wdx(cxOf(i)-200)<80&&cyOf(i)>40&&cyOf(i)<150)pl[i]=0;PL[0].vx=-7*CMY;PL[0].vy=-1.6*CMY;PL[0].name='Pacifica';countPlates();HS.push({x:205,y:100,str:1,name:'Great Hotspot'})},
  ring:()=>{seed(12);clearWorld();const n=fbm(5,60,0.55),m=fbm(4,40,0.5);const ring=new Float32Array(N);for(let i=0;i<N;i++){const dx=wdx(cxOf(i)-180)/120,dy=(cyOf(i)-90)/68,d=Math.sqrt(dx*dx+dy*dy);ring[i]=0.22-Math.abs(d-1)*1.2+n[i]*0.45}
    const mask=new Float32Array(N);for(let i=0;i<N;i++)mask[i]=ring[i];setCrust(mask,m);const seeds=[{x:180,y:90,p:newPlate(-0.6*CMY,0.4*CMY,'Pacifica'),w:2.3}];
    for(let j=0;j<8;j++){const a=j/8*Math.PI*2;const x=180+Math.cos(a)*150,y=90+Math.sin(a)*80;seeds.push({x,y,p:newPlate(-Math.cos(a)*3*CMY,-Math.sin(a)*2*CMY),w:1})}voronoi(seeds,12);finish()},
  young:()=>{genEarth(3,0,9);HS.push({x:80,y:70,str:1,name:'Hotspot A'},{x:200,y:115,str:1,name:'Hotspot B'},{x:300,y:80,str:1,name:'Hotspot C'})},
  iceland:()=>{seed(9);clearWorld();const n=fbm(5,60,0.55),m=fbm(4,40,0.5),A=blob(95,85,40,60,n,0.45),B=blob(275,90,42,60,n,0.45);const mask=new Float32Array(N);for(let i=0;i<N;i++)mask[i]=Math.max(A[i],B[i])>0?0.05+Math.max(A[i],B[i])*0.5:-1;setCrust(mask,m);
    for(let i=0;i<N;i++)if(cr[i]<.5){const d=Math.abs(wdx(cxOf(i)-185));age[i]=d*2.2;h[i]=-2500-3000*Math.sqrt(Math.min(age[i],160)/160)}
    const p0=newPlate(-2.2*CMY,0,'Laurentia'),p1=newPlate(2.2*CMY,0,'Eurasia');for(let i=0;i<N;i++)pl[i]=wdx(cxOf(i)-185+Math.sin(cyOf(i)/14)*4)<0?p0:p1;HS.push({x:185,y:55,str:1.2,name:'Iceland plume'});finish()},
};
const SCENLIST=[{id:'real',name:'Earth (real map)',desc:'Our planet as it is today: real continents, mountain ranges and the 12 major plates moving at their real speeds.'},{id:'earth',name:'Earth-like',desc:'Eleven plates and scattered continents, like our own planet.'},{id:'pangaea',name:'Pangaea',desc:'One supercontinent, just starting to break apart.'},
  {id:'collide',name:'Collision course',desc:'A small continent races toward a big one. Watch a giant mountain range rise.'},{id:'hawaii',name:'Island chain',desc:'A fast ocean plate slides over a hotspot, leaving a trail of volcanic islands.'},
  {id:'ring',name:'Ring of Fire',desc:'A great ocean ringed by trenches, volcanoes and earthquakes.'},{id:'young',name:'Young planet',desc:'All ocean, three hotspots. Islands and the first continents are born.'},
  {id:'iceland',name:'Opening ocean',desc:'Two continents drift apart along a mid-ocean ridge with a plume beneath it.'}];

/* ---------- plates ---------- */
function countPlates(){for(const p of PL){p.n=0;p.sx=0;p.sy=0;p.sc=0;p.cc=0;p.yy=0}for(let i=0;i<N;i++){const p=PL[pl[i]];if(!p)continue;p.n++;const a=cxOf(i)/GW*Math.PI*2;p.sx+=Math.cos(a);p.sy+=Math.sin(a);p.yy+=cyOf(i);if(cr[i]>.5)p.cc++}
  for(const p of PL){if(p.n){p.cx=mod(Math.atan2(p.sy,p.sx)/(Math.PI*2)*GW,GW);p.cy=p.yy/p.n;p.cont=p.cc/p.n}}}
const plateCm=p=>Math.hypot(p.vx,p.vy)/CMY*ENV.speed;
function shiftPlate(p,dx,dy,list){const mv=[];if(list){for(const i of list)if(pl[i]===p)mv.push(i)}else for(let i=0;i<N;i++)if(pl[i]===p)mv.push(i);const n=mv.length;if(!n)return;
  const mh=new Float32Array(n),mc=new Float32Array(n),ma=new Float32Array(n);let coll=0;
  const vm=VOL.filter(v=>pl[v.i]===p);for(let k=0;k<n;k++){const i=mv[k];mh[k]=h[i];mc[k]=cr[i];ma[k]=age[i];pl[i]=-1}
  for(let k=0;k<n;k++){const i=mv[k],x=i%GW,y=(i/GW)|0,ny=y+dy;if(ny<0||ny>=GH)continue;const j=ny*GW+mod(x+dx,GW),q=pl[j];
    if(q<0){pl[j]=p;h[j]=mh[k];cr[j]=mc[k];age[j]=ma[k];continue}
    const mC=mc[k]>.5,tC=cr[j]>.5;
    if(mC&&tC){h[j]=Math.min(9200,Math.max(h[j],mh[k])+90);cr[j]=1;age[j]=Math.max(age[j],ma[k]);pl[j]=p;coll++}
    else if(mC&&!tC){pl[j]=p;h[j]=mh[k];cr[j]=mc[k];age[j]=ma[k]}
    else if(!mC&&tC){/* oceanic crust dives under the continent */}
    else if(ma[k]<age[j]){pl[j]=p;h[j]=Math.max(mh[k],h[j]);cr[j]=mc[k];age[j]=ma[k]}}
  // gaps left behind fill with brand-new seafloor (a mid-ocean ridge)
  for(let k=0;k<n;k++){const i=mv[k];if(pl[i]>=0)continue;const x=i%GW,y=(i/GW)|0,nb=[];
    for(const j of [y*GW+mod(x+1,GW),y*GW+mod(x-1,GW),y>0?i-GW:-1,y<GH-1?i+GW:-1])if(j>=0&&pl[j]>=0)nb.push(pl[j]);
    pl[i]=nb.length?nb[Math.floor(Math.random()*nb.length)]:p;h[i]=-2500;cr[i]=0;age[i]=0}
  for(const v of vm){const x=v.i%GW,y=(v.i/GW)|0,ny=y+dy,j=ny*GW+mod(x+dx,GW);if(ny<0||ny>=GH||pl[j]!==p){v.dead=true;continue}v.i=j}
  if(vm.length)VOL=VOL.filter(v=>!v.dead);
  if(coll>2){const P=PL[p];P.vx*=0.985;P.vy*=0.985}
  dirtyImg=true}
function movePlates(dt){const sp=ENV.speed;let L=null;const need=PL.some(p=>p.n&&(Math.abs(p.ax+p.vx*dt*sp)>=1||Math.abs(p.ay+p.vy*dt*sp)>=1));if(need){L=PL.map(()=>[]);for(let i=0;i<N;i++){const q=pl[i];if(q>=0&&L[q])L[q].push(i)}}
  for(const p of PL){if(!p.n)continue;p.ax+=p.vx*dt*sp;p.ay+=p.vy*dt*sp;let g=0;
  while(Math.abs(p.ax)>=1&&g++<4){const s=Math.sign(p.ax);p.ax-=s;shiftPlate(p.id,s,0,L&&g===1?L[p.id]:null)}
  while(Math.abs(p.ay)>=1&&g++<8){const s=Math.sign(p.ay);p.ay-=s;shiftPlate(p.id,0,s)}}}
function stepAlong(i,d,k){const x=i%GW,y=(i/GW)|0;if(d===0)return y*GW+mod(x+k,GW);const ny=y+k;return ny<0||ny>=GH?-1:ny*GW+x}
function nearVolcano(i,r){const x=cxOf(i),y=cyOf(i);return VOL.some(v=>Math.abs(wdx(cxOf(v.i)-x))<=r&&Math.abs(cyOf(v.i)-y)<=r)}
function addVolcano(i,kind,name){if(VOL.length>=150){let k=VOL.findIndex(v=>v.ext);if(k<0&&kind!=='arc')k=VOL.findIndex(v=>v.kind==='arc');if(k>=0)VOL.splice(k,1);else return null}const v={i,kind,name:name||vname(),act:0,ext:false,last:S.t,born:S.t,erupts:0};VOL.push(v);return v}
function tect(dt){bnd.fill(0);brel.fill(0);up.fill(0);const sp=ENV.speed;
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const i=y*GW+x,P=pl[i];
    for(let d=0;d<2;d++){const j=d?(y+1<GH?i+GW:-1):(y*GW+(x+1)%GW);if(j<0)continue;const Q=pl[j];if(Q===P)continue;const a=PL[P],b=PL[Q];if(!a||!b)continue;
      const rel=(d?(a.vy-b.vy):(a.vx-b.vx))*sp,sh=Math.abs(d?(a.vx-b.vx):(a.vy-b.vy))*sp,m=Math.abs(rel);
      const t=rel>0.04?1:rel<-0.04?2:sh>0.05?3:0,mm=Math.max(m,t===3?sh:0);if(!t)continue;
      if(mm>brel[i]||!bnd[i]){brel[i]=mm;bnd[i]=t}if(mm>brel[j]||!bnd[j]){brel[j]=mm;bnd[j]=t}
      if(t===1)converge(i,j,d,rel,dt);else if(t===2&&cr[i]>.5&&cr[j]>.5){const f=Math.min(1.5,m/0.4);h[i]-=60*f*dt;h[j]-=60*f*dt;if(h[i]<-300)h[i]=-300;if(h[j]<-300)h[j]=-300}
      STR[i]+=mm*dt*(t===2?0.25:1);STR[j]+=mm*dt*(t===2?0.25:1)}}
  // hotspots: plumes of hot rock build volcanoes on whatever plate passes over them
  for(const s of HS){const i=idx(s.x,s.y),c=cr[i]>.5,cap=c?3200:4300+ENV.sea;for(const [k,f] of [[0,1],[1,.5],[-1,.5],[GW,.5],[-GW,.5]]){const j=i+k;if(j<0||j>=N)continue;if(h[j]<cap*(f===1?1:0.8))h[j]+=(c?160:520)*f*s.str*ENV.heat*dt;if(!c)cr[j]=Math.min(.45,cr[j])}
    if(!nearVolcano(i,2)){const v=addVolcano(i,'hotspot');if(v)v.hs=s}}
  for(let i=0;i<N;i++){
    if(cr[i]<.5){const tg=-2500-3000*Math.sqrt(Math.min(age[i],160)/160);h[i]+=(tg-h[i])*Math.min(1,(h[i]>tg?0.016:0.09)*dt)}
    else{const base=260;if(h[i]>base)h[i]-=(h[i]-base)*Math.min(1,0.03*ENV.erosion*dt);else h[i]+=(base-h[i])*Math.min(1,0.012*dt)}
    if(up[i]){h[i]+=up[i]*dt;if(h[i]>9200)h[i]=9200}
    age[i]+=dt;STR[i]*=Math.exp(-dt*0.05)}
  // gentle smoothing: landslides and sediment spread high ground out
  const k=Math.min(0.25,0.05*ENV.erosion*dt);if(k>0)for(let y=1;y<GH-1;y++){const r=y*GW;for(let x=0;x<GW;x++){const i=r+x,hi=h[i];if(hi<-1500&&bnd[i])continue;const av=(h[r+(x+1)%GW]+h[r+(x+GW-1)%GW]+h[i-GW]+h[i+GW])*0.25;h[i]+=(av-hi)*k*(hi>0?1:0.3)}}
  dirtyImg=true}
function converge(i,j,d,rel,dt){const ci=cr[i]>.5,cj=cr[j]>.5,f=Math.min(1.6,rel/0.4);
  if(ci&&cj){for(let k=0;k<4;k++){const a=stepAlong(i,d,-k),b=stepAlong(j,d,k),w=270*f*(1-k*0.2);if(a>=0&&pl[a]===pl[i])up[a]+=w;if(b>=0&&pl[b]===pl[j])up[b]+=w}return}
  const sub=ci?j:cj?i:(age[i]>age[j]?i:j),over=sub===i?j:i,dir=over===j?1:-1,tr=-6500-4200*Math.min(1,f);
  if(h[sub]>tr)h[sub]+=(tr-h[sub])*Math.min(1,dt*0.9);
  const oc=cr[over]>.5;for(let k=2;k<=4;k++){const c=stepAlong(over,d,dir*k);if(c<0||pl[c]!==pl[over])continue;up[c]+=(oc?165:85)*f*ENV.heat;if(!oc)cr[c]=Math.min(1,cr[c]+dt*0.0045*f)}
  if(Math.random()<dt*0.014*f*ENV.heat){const c=stepAlong(over,d,dir*3);if(c>=0&&pl[c]===pl[over]&&!nearVolcano(c,6))addVolcano(c,'arc')}}

/* ---------- climate ---------- */
function updateSea(){const g=ENV.temp+ENV.hot-ENV.dust-ENV.snow;SEA=ENV.sea+(g<0?Math.max(-130,g*13):Math.min(70,g*6))}
function updateClimate(){updateSea();const q=new Int32Array(N);let qh=0,qt=0;dO.fill(65535);for(let i=0;i<N;i++)if(h[i]<SEA){dO[i]=0;q[qt++]=i}
  while(qh<qt){const i=q[qh++],x=i%GW,y=(i/GW)|0,dv=dO[i]+1;if(dv>60)continue;for(const j of [y*GW+(x+1)%GW,y*GW+(x+GW-1)%GW,y>0?i-GW:-1,y<GH-1?i+GW:-1])if(j>=0&&dO[j]>dv){dO[j]=dv;q[qt++]=j}}
  const g=ENV.temp+ENV.hot-ENV.dust-ENV.snow;
  for(let y=0;y<GH;y++){const lat=Math.abs((y+.5)/GH*2-1),t=28-50*Math.pow(lat,1.6)+g,belt=clamp(0.25+0.8*Math.exp(-((lat/0.13)**2))+0.6*Math.exp(-(((lat-0.52)/0.14)**2))-0.22*Math.exp(-(((lat-0.27)/0.07)**2)),0.03,1.1);
    for(let x=0;x<GW;x++){const i=y*GW+x;T0[i]=t;RAIN[i]=belt*Math.exp(-Math.min(dO[i],60)/16)*(g>8?1.2:1)}}
  dirtyClim=false;dirtyImg=true}
const tempAt=i=>T0[i]-6.5*Math.max(0,h[i]-SEA)/1000;
function biome(i){const hh=h[i]-SEA;if(hh<0)return tempAt(i)<-1.8?'Sea ice':hh>-200?'Shallow sea':hh>-3000?'Ocean':hh>-6500?'Deep ocean':'Ocean trench';
  const T=tempAt(i),r=RAIN[i];if(T<-9)return'Ice sheet';if(hh>3500&&T<-3)return'Snowy peaks';if(hh>2500)return'Bare mountains';if(T<-2)return'Tundra';if(T<5)return r>.25?'Boreal forest':'Cold steppe';if(r<.16)return T>10?'Desert':'Cold desert';if(r<.38)return T>18?'Savanna':'Grassland';if(T>21&&r>.55)return'Rainforest';return'Forest'}

/* ---------- stats ---------- */
const cosLat=new Float32Array(GH);for(let y=0;y<GH;y++)cosLat[y]=Math.cos(latOf(y)*Math.PI/180);
let AREA=0;for(let y=0;y<GH;y++)AREA+=cosLat[y]*GW;
function components(minSize){const seen=new Uint8Array(N),q=new Int32Array(N),out=[];
  for(let s=0;s<N;s++){if(seen[s]||h[s]<SEA)continue;let qh=0,qt=0,cnt=0,area=0,sx=0,sy=0,sc=0;q[qt++]=s;seen[s]=1;
    while(qh<qt){const i=q[qh++];cnt++;const x=i%GW,y=(i/GW)|0;area+=cosLat[y];const a=x/GW*Math.PI*2;sx+=Math.cos(a);sy+=Math.sin(a);sc+=y;
      for(const j of [y*GW+(x+1)%GW,y*GW+(x+GW-1)%GW,y>0?i-GW:-1,y<GH-1?i+GW:-1])if(j>=0&&!seen[j]&&h[j]>=SEA){seen[j]=1;q[qt++]=j}}
    out.push({n:cnt,area,cx:mod(Math.atan2(sy,sx)/(Math.PI*2)*GW,GW),cy:sc/cnt,i:s})}
  return out}
function computeStats(){let land=0,ice=0,landIce=0,tw=0,pk=-1e9,pi=0,dp=1e9,di=0,old=0,cc=0;
  for(let i=0;i<N;i++){const y=(i/GW)|0,w=cosLat[y],T=tempAt(i),lnd=h[i]>=SEA;tw+=T*w;if(lnd){land+=w;if(T<-9){ice+=w;landIce+=w}}else if(T<-1.8)ice+=w;
    if(h[i]>pk){pk=h[i];pi=i}if(h[i]<dp){dp=h[i];di=i}if(cr[i]<.5&&age[i]>old)old=age[i];if(cr[i]>.5)cc++}
  if(!STAT.comps||(STAT.ck=(STAT.ck||0)+1)%4===0){const comps=components();STAT.cont=comps.filter(c=>c.n>=150).length;STAT.isl=comps.filter(c=>c.n<150).length;STAT.comps=comps}
  Object.assign(STAT,{land:land/AREA,ice:ice/AREA,landIce:land?landIce/land:0,avgT:tw/AREA,peak:pk-SEA,peakI:pi,deep:dp-SEA,deepI:di,old,vol:VOL.filter(v=>!v.ext).length,contCells:cc})}
function sampleHist(force){const last=HIST[HIST.length-1];if(!force&&last&&S.t-last.t<Math.max(0.25,S.speed*0.6))return;HIST.push({t:S.t,land:STAT.land,peak:STAT.peak,temp:STAT.avgT});if(HIST.length>240)HIST.shift()}

/* ---------- quakes, eruptions, particles ---------- */
function quake(i,M,nat){const x=cxOf(i)+0.5,y=cyOf(i)+0.5,ocean=h[i]<SEA;QK.push({x,y,m:M,age:0});if(QK.length>60)QK.shift();
  QLOG.unshift({m:M,t:S.t,where:`${Math.abs(latOf(cyOf(i))).toFixed(0)}°${latOf(cyOf(i))>=0?'N':'S'} ${Math.abs(lonOf(cxOf(i))).toFixed(0)}°${lonOf(cxOf(i))>=0?'E':'W'}`,ocean,nat});if(QLOG.length>12)QLOG.pop();
  for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const j=(cyOf(i)+dy)*GW+mod(cxOf(i)+dx,GW);if(j>=0&&j<N)STR[j]*=0.2}
  chEv('quake',{m:M,nat:!!nat,ocean});QUAKES++;if(M>=7.8&&ocean){QK.push({x,y,m:M,age:0,tsu:true});chEv('tsunami',{m:M});toast(`🌊 Magnitude ${M.toFixed(1)} undersea earthquake: a tsunami spreads across the ocean`)}
  else if(M>=8)toast(`💥 Magnitude ${M.toFixed(1)} earthquake`)}
function erupt(v,big){v.act=1;v.last=S.t;v.erupts++;const x=cxOf(v.i)+0.5,y=cyOf(v.i)+0.5;const n=big?140:18;
  for(let k=0;k<n;k++){const a=Math.random()*Math.PI*2,s=(big?rr(1,9):rr(0.3,2.2));PARTS.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-(big?0:0.6),life:big?rr(2,5):rr(0.8,2),max:3,c:Math.random()<0.45?'#ff7a2a':Math.random()<.5?'#ffcf5a':'#8a7f78',s:big?rr(1.5,4):rr(1,2.2)})}
  if(PARTS.length>2500)PARTS.splice(0,PARTS.length-2500);if(h[v.i]<SEA+5500)h[v.i]+=big?400:40;chEv('erupt',{big:!!big,user:v.kind==='user'});ERUPTS++}
let QUAKES=0,ERUPTS=0,RIFTS=0,PUSHES=0,HOTSPOTS=0,METEORS=0,RAISED=0,PLATEED=0,EVN=0,EVSTOP=0,LANDMADE=0;
function frameEvents(dtR){if(S.paused||!$('home').hidden&&false)return;
  // earthquakes: picked along active plate boundaries, sized by the Gutenberg-Richter law (big ones are rare)
  if(Math.random()<dtR*1.6*Math.min(3,0.3+S.speed/2)){for(let tries=0;tries<40;tries++){const i=Math.floor(Math.random()*N);if(!bnd[i])continue;const t=bnd[i],rel=brel[i];if(Math.random()>Math.min(1,rel/0.5+STR[i]*0.1))continue;
      let M=5+(-Math.log10(Math.random()+1e-9))/0.62+Math.min(0.6,STR[i]*0.05);M=Math.min(t===1?9.5:t===3?8.2:6.8,M);quake(i,M,true);break}}
  for(const v of VOL){if(v.ext)continue;if(Math.random()<dtR*0.035*ENV.heat*(v.kind==='user'?6:1))erupt(v,false);if(v.act>0)v.act=Math.max(0,v.act-dtR*0.6)}
  for(const q of QK)q.age+=dtR;QK=QK.filter(q=>q.age<(q.tsu?7:3.2));
  for(const p of PARTS){p.x+=p.vx*dtR;p.y+=p.vy*dtR;p.vy+=0.6*dtR;p.vx*=0.985;p.life-=dtR}PARTS=PARTS.filter(p=>p.life>0)}
function volcanoUpkeep(){for(const v of VOL){if(v.ext)continue;let active=v.kind==='user'?S.t-v.born<6:false;
    if(!active&&v.hs)active=HS.includes(v.hs)&&Math.abs(wdx(cxOf(v.i)-v.hs.x))<=2&&Math.abs(cyOf(v.i)-v.hs.y)<=2;
    if(!active){const x=cxOf(v.i),y=cyOf(v.i);for(let dy=-5;dy<=5&&!active;dy++)for(let dx=-5;dx<=5;dx++){const j=(y+dy)*GW+mod(x+dx,GW);if(j>=0&&j<N&&bnd[j]===1){active=true;break}}}
    if(active)v.last=S.t;else if(S.t-v.last>8){v.ext=true;v.extT=S.t}}
  VOL=VOL.filter(v=>!(v.ext&&S.t-v.extT>60))}

/* ---------- player actions ---------- */
function brushCells(wx,wy,r,f){const cx=Math.floor(wx),cy=Math.floor(wy);for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const d=Math.hypot(dx,dy)/(r+0.5);if(d>1)continue;const y=cy+dy;if(y<0||y>=GH)continue;f(y*GW+mod(cx+dx,GW),1-d*d)}dirtyImg=true;dirtyClim=true;quickRedraw(wx,wy,r+2)}
function meteor(wx,wy,R0){const R=R0||8;brushCells(wx,wy,Math.ceil(R*1.4),(i,f)=>{const d=Math.sqrt(1-f);if(d<0.7)h[i]=Math.min(h[i],SEA-200-2400*(1-d/0.7))+(-800);else h[i]+=900*(1-Math.abs(d-0.85)/0.15)});
  for(let k=0;k<260;k++){const a=Math.random()*Math.PI*2,s=rr(2,14);PARTS.push({x:wx,y:wy,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rr(1,3.5),max:3,c:pick(['#ffd28a','#ff8a4a','#a89a90','#fff2d0']),s:rr(1.5,3.5)})}
  ENV.dust=Math.max(ENV.dust,R*0.9);METEORS++;chEv('meteor',{});QK.push({x:wx,y:wy,m:9,age:0});updateSea();dirtyClim=true}
function splitPlate(ax,ay,bx,by){const mx=ax+wdx(bx-ax)/2,my=(ay+by)/2,mi=idx(mx,clamp(Math.floor(my),0,GH-1)),p=pl[mi];const P=PL[p];if(!P)return false;
  const lx=wdx(bx-ax),ly=by-ay,len=Math.hypot(lx,ly);if(len<4)return false;const nxv=-ly/len,nyv=lx/len;const side=[];let a=0,b=0;
  for(let i=0;i<N;i++){if(pl[i]!==p)continue;const s=wdx(cxOf(i)+0.5-ax)*ly-(cyOf(i)+0.5-ay)*lx;if(s>0){side.push(i);a++}else b++}
  if(a<40||b<40)return false;const q=newPlate(P.vx+nxv*-2.5*CMY,P.vy+nyv*-2.5*CMY);P.vx+=nxv*1.5*CMY;P.vy+=nyv*1.5*CMY;for(const i of side)pl[i]=q;
  // a rift valley opens along the line
  const steps=Math.ceil(len);for(let k=0;k<=steps;k++){const x=ax+lx*k/steps,y=ay+ly*k/steps;if(y<0||y>=GH)continue;const i=idx(x,Math.floor(y));if(cr[i]>.5)h[i]=Math.max(-200,h[i]-500)}
  countPlates();RIFTS++;chEv('rift',{p,q});dirtyImg=true;return true}
function largestContinent(){STAT.comps=null;computeStats();const c=(STAT.comps||[]).filter(c=>c.n>=150).sort((a,b)=>b.n-a.n)[0];return c}
function doEvent(ev){EVN++;chEv('event',{ev});
  if(ev==='normal'){if(EVT.supervolcano||EVT.snowball||EVT.hothouse||ENV.dust>0.5)EVSTOP++;EVT.supervolcano=EVT.snowball=EVT.hothouse=false;ENV.dust=0;ENV.snow=0;ENV.hot=0;toast('All events stopped');syncEvents();dirtyClim=true;return}
  if(ev in EVT&&EVT[ev]){EVT[ev]=false;if(ev==='supervolcano')ENV.dust=0;if(ev==='snowball')ENV.snow=0;if(ev==='hothouse')ENV.hot=0;EVSTOP++;chEv('stop',{ev});toast('Stopped');syncEvents();dirtyClim=true;return}
  if(ev==='supervolcano'){let best=null;for(const s of HS){const i=idx(s.x,s.y);if(cr[i]>.5)best=i}if(best==null){const c=[];for(let i=0;i<N;i+=7)if(cr[i]>.5&&h[i]>SEA)c.push(i);best=c.length?pick(c):Math.floor(Math.random()*N)}
    const v=addVolcano(best,'user','Supervolcano');if(v){erupt(v,true);erupt(v,true);flyToW(cxOf(best)+.5,cyOf(best)+.5,Math.max(cam.z,4));}ENV.dust=Math.max(ENV.dust,7);EVT.supervolcano=true;toast('🌋 A supervolcano erupts! Ash cools the whole planet for a while.')}
  else if(ev==='snowball'){EVT.snowball=true;EVT.hothouse=false;ENV.hot=0;toast('❄ Snowball Earth: the planet freezes over')}
  else if(ev==='hothouse'){EVT.hothouse=true;EVT.snowball=false;ENV.snow=0;toast('☀ Hothouse: the ice melts and the seas rise')}
  else if(ev==='megaquake'){let bi=-1,bv=0;for(let i=0;i<N;i++)if(bnd[i]===1&&brel[i]>bv&&(h[i]<SEA)){bv=brel[i];bi=i}if(bi<0)for(let i=0;i<N;i++)if(bnd[i]&&brel[i]>bv){bv=brel[i];bi=i}if(bi<0)bi=Math.floor(Math.random()*N);quake(bi,9.3,false);flyToW(cxOf(bi),cyOf(bi),Math.max(cam.z,4))}
  else if(ev==='meteor'){const x=Math.random()*GW,y=30+Math.random()*(GH-60);meteor(x,y,11);flyToW(x,y,Math.max(cam.z,3.5));toast('☄ A giant meteor strikes!')}
  else if(ev==='plume'){const s={x:Math.random()*GW,y:30+Math.random()*(GH-60),str:1,name:'Plume '+(HS.length+1)};HS.push(s);HOTSPOTS++;flyToW(s.x,s.y,Math.max(cam.z,3.5));toast('🔥 A new mantle plume rises beneath the crust')}
  else if(ev==='breakup'){const c=largestContinent();if(!c){toast('There is no continent to break');return}const a=Math.random()*Math.PI;const L=40;if(splitPlate(c.cx-Math.cos(a)*L,c.cy-Math.sin(a)*L*0.6,c.cx+Math.cos(a)*L,c.cy+Math.sin(a)*L*0.6)){toast('✂ A rift tears the biggest continent apart');flyToW(c.cx,c.cy)}else toast('That continent would not split; try again')}
  syncEvents();dirtyClim=true}
function syncEvents(){document.querySelectorAll('[data-ev]').forEach(b=>{const ev=b.dataset.ev;if(!(ev in EVT))return;const on=EVT[ev];b.setAttribute('aria-pressed',on);b.textContent=on?'■ Stop '+(ev==='supervolcano'?'eruption':ev==='snowball'?'freeze':'hothouse'):({supervolcano:'🌋 Supervolcano',snowball:'❄ Snowball Earth',hothouse:'☀ Hothouse'})[ev]})}
function syncWorldUI(){const set=(id,v,t)=>{const e=$(id);if(e){e.value=v;$(id.replace('S','V')).textContent=t}};
  set('seaS',ENV.sea,(ENV.sea>=0?'+':'')+ENV.sea+' m');set('tempS',ENV.temp,(ENV.temp>=0?'+':'')+ENV.temp+' °C');set('spdS',Math.round(ENV.speed*100),Math.round(ENV.speed*100)+'%');set('eroS',Math.round(ENV.erosion*100),Math.round(ENV.erosion*100)+'%');set('volS',Math.round(ENV.heat*100),Math.round(ENV.heat*100)+'%');syncEvents()}
let SLIDED=0;
for(const [id,k,f,t] of [['seaS','sea',v=>v,v=>(v>=0?'+':'')+v+' m'],['tempS','temp',v=>v,v=>(v>=0?'+':'')+v+' °C'],['spdS','speed',v=>v/100,v=>v+'%'],['eroS','erosion',v=>v/100,v=>v+'%'],['volS','heat',v=>v/100,v=>v+'%']])
  $(id).addEventListener('input',e=>{const v=+e.target.value;ENV[k]=f(v);$(id.replace('S','V')).textContent=t(v);SLIDED++;chEv('slider',{k});dirtyClim=true;updateSea()});
document.querySelectorAll('[data-ev]').forEach(b=>b.onclick=()=>doEvent(b.dataset.ev));
let BNDON=true;$('bndBtn').onclick=()=>{BNDON=!BNDON;$('bndBtn').setAttribute('aria-pressed',BNDON);$('bndBtn').textContent=BNDON?'On':'Off';BNDT++;legendFor(S.view)};let BNDT=0;
$('lblBtn').onclick=()=>{LBL=!LBL;$('lblBtn').setAttribute('aria-pressed',LBL);$('lblBtn').textContent=LBL?'On':'Off'};

/* ---------- rendering ---------- */
const SC3=3,IW=GW*SC3,IH=GH*SC3;const img=document.createElement('canvas');img.width=IW;img.height=IH;const ig=img.getContext('2d');const ID=ig.createImageData(IW,IH);
// fine fractal detail, so coastlines and mountains look natural instead of following the grid
const DET=(()=>{const out=new Float32Array(IW*IH);let amp=1,tot=0;for(const sp of [9,4.5,2.25,1.2]){const nx=Math.round(IW/sp),ny=Math.ceil(IH/sp)+2,L=new Float32Array(nx*ny);for(let k=0;k<L.length;k++)L[k]=Math.random()*2-1;
  for(let y=0;y<IH;y++){const fy=y*nx/IW,y0=Math.floor(fy),ty=fy-y0,sy=ty*ty*(3-2*ty);for(let x=0;x<IW;x++){const fx=x*nx/IW,x0=Math.floor(fx),tx=fx-x0,sx=tx*tx*(3-2*tx),xa=x0%nx,xb=(x0+1)%nx,a=L[y0*nx+xa],b=L[y0*nx+xb],c=L[(y0+1)*nx+xa],d=L[(y0+1)*nx+xb];out[y*IW+x]+=amp*((a+(b-a)*sx)+((c+(d-c)*sx)-(a+(b-a)*sx))*sy)}}tot+=amp;amp*=0.55}
  for(let i=0;i<out.length;i++)out[i]/=tot;return out})();
const hexRGB=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
const PRGB=PCOL.map(hexRGB);
function ramp(stops,v){if(v<=stops[0][0])return stops[0][1];for(let k=1;k<stops.length;k++)if(v<=stops[k][0]){const [a,ca]=stops[k-1],[b,cb]=stops[k],t=(v-a)/(b-a);return[ca[0]+(cb[0]-ca[0])*t,ca[1]+(cb[1]-ca[1])*t,ca[2]+(cb[2]-ca[2])*t]}return stops[stops.length-1][1]}
const OCEAN=[[-11000,[4,8,26]],[-7000,[8,22,52]],[-4500,[14,44,90]],[-2500,[22,76,128]],[-600,[36,116,160]],[-120,[64,160,186]],[0,[110,196,200]]];
const ELEV=[[-10000,[30,10,60]],[-6000,[30,40,120]],[-3000,[40,90,170]],[-500,[90,160,210]],[0,[150,210,220]],[1,[60,130,70]],[500,[130,170,80]],[1500,[200,180,100]],[3000,[170,110,70]],[5000,[230,220,215]],[8000,[255,255,255]]];
const AGE=[[0,[230,50,40]],[20,[240,150,40]],[50,[230,230,70]],[90,[80,200,120]],[130,[60,120,220]],[200,[90,50,170]]];
const TEMP=[[-40,[220,230,255]],[-20,[120,150,240]],[0,[90,200,230]],[12,[120,210,120]],[22,[240,210,90]],[32,[240,110,60]],[45,[180,30,40]]];
function landRGB(i,hh,T){const r=RAIN[i];let c;
  if(T<-9)return[236,242,247];
  if(T<-2)c=[140,146,128];else if(T<5)c=r>.25?[52,92,64]:[150,150,115];else if(r<.16)c=T>10?[214,184,124]:[176,160,130];else if(r<.38)c=T>18?[182,166,92]:[128,158,84];else if(T>21&&r>.55)c=[34,104,52];else c=[62,120,62];
  if(hh>1800){const t=clamp((hh-1800)/2200,0,1);c=[c[0]+(138-c[0])*t,c[1]+(124-c[1])*t,c[2]+(110-c[2])*t]}
  if(T<-3&&hh>1200){const t=clamp((-3-T)/5,0,1);c=[c[0]+(240-c[0])*t,c[1]+(244-c[1])*t,c[2]+(248-c[2])*t]}
  return c}
const LC=new Float32Array(N*3),SC=new Float32Array(N*3),TEX=new Float32Array(N);for(let i=0;i<N;i++){const x=Math.sin(i*12.9898+78.233)*43758.5453;TEX[i]=0.94+0.12*(x-Math.floor(x))}
function cellColors(i0,i1){const v=S.view;if(i0==null){i0=0;i1=N}
  for(let i=i0;i<i1;i++){const hh=h[i]-SEA,T=T0[i]-6.5*Math.max(0,hh)/1000,o=i*3;let L,Sx;
    if(v==='elev'){L=ramp(ELEV,Math.max(1,hh));Sx=ramp(ELEV,Math.min(0,hh))}
    else if(v==='age'){L=[120,112,106];Sx=cr[i]<.5?ramp(AGE,age[i]):[120,112,106]}
    else if(v==='temp'){L=Sx=ramp(TEMP,T)}
    else{L=landRGB(i,Math.max(0,hh),T);Sx=ramp(OCEAN,Math.min(0,hh));if(T0[i]<-1.8){const t=clamp((-1.8-T0[i])/4,0,0.92);Sx=[Sx[0]+(226-Sx[0])*t,Sx[1]+(236-Sx[1])*t,Sx[2]+(243-Sx[2])*t]}}
    if(v==='plates'){const pc=PRGB[pl[i]%PRGB.length]||[128,128,128],m=c=>{const g=(c[0]+c[1]+c[2])/3;return[g*0.45+pc[0]*0.55,g*0.45+pc[1]*0.55,g*0.45+pc[2]*0.55]};L=m(L);Sx=m(Sx);const bt=bnd[i];if(bt){L=Sx=bt===1?[255,70,50]:bt===2?[90,230,255]:[255,220,70]}}
    else if(v==='quake'){const st=bnd[i]?Math.min(1,brel[i]*1.4+STR[i]*0.06):0,f=c=>{const g=(c[0]+c[1]+c[2])/3*0.55;return st>0?[g+(255-g)*st,g+(120-g)*st*0.6,g*(1-st)]:[g,g,g]};L=f(L);Sx=f(Sx)}
    const tx=1;LC[o]=L[0]*tx;LC[o+1]=L[1]*tx;LC[o+2]=L[2]*tx;SC[o]=Sx[0];SC[o+1]=Sx[1];SC[o+2]=Sx[2]}}
let JOB=null;const imgPrev=document.createElement('canvas');imgPrev.width=IW;imgPrev.height=IH;const pg=imgPrev.getContext('2d');let FADE=0;
// colour of one point of the map: gx, gy are continuous cell coordinates; dt is fine detail noise and dd its slope
function shadePix(gx,gy,dt,dd,d,o,flat,natural,wx2,wy2){if(wx2!==undefined){gx+=wx2;gy+=wy2}gy=clamp(gy,0,GH-1.001);const y0=Math.floor(gy),ty=gy-y0,y1=Math.min(GH-1,y0+1),x0=Math.floor(gx),tx=gx-x0,xa=mod(x0,GW),xb=mod(x0+1,GW);
  const ia=y0*GW+xa,ib=y0*GW+xb,ic=y1*GW+xa,ie=y1*GW+xb,a=h[ia],b=h[ib],c=h[ic],e=h[ie];
  const w0=(1-tx)*(1-ty),w1=tx*(1-ty),w2=(1-tx)*ty,w3=tx*ty;
  const hv=a*w0+b*w1+c*w2+e*w3,gr=Math.max(Math.abs(a-b),Math.abs(a-c),Math.abs(b-e),Math.abs(c-e)),hh=hv-SEA+dt*(gr*0.75+260),land=hh>=0,C=land?LC:SC;
  const r=C[ia*3]*w0+C[ib*3]*w1+C[ic*3]*w2+C[ie*3]*w3,g=C[ia*3+1]*w0+C[ib*3+1]*w1+C[ic*3+1]*w2+C[ie*3+1]*w3,bl=C[ia*3+2]*w0+C[ib*3+2]*w1+C[ic*3+2]*w2+C[ie*3+2]*w3;
  // hillshade from the local slope (light from the north-west), plus fine texture from the detail noise
  let sh=1;if(!flat){const sl=-1.5*(((b-a)*(1-ty)+(e-c)*ty)+((c-a)*(1-tx)+(e-b)*tx))/(land?1100:3000);sh=clamp(1+sl*(land?0.6:0.12)+dd*(land?(natural?0.9+Math.max(0,hv-SEA)/2500:0.5):0.15),0.55,1.45)}
  if(land&&hh<70&&natural){const t=1-hh/70;d[o]=(r+(205-r)*t*0.35)*sh;d[o+1]=(g+(190-g)*t*0.35)*sh;d[o+2]=(bl+(150-bl)*t*0.35)*sh;d[o+3]=255;return}
  if(!land&&hh>-90&&natural){const t=1+hh/90;d[o]=r+(150-r)*t*0.45;d[o+1]=g+(215-g)*t*0.45;d[o+2]=bl+(220-bl)*t*0.45;d[o+3]=255;return}
  d[o]=r*sh;d[o+1]=g*sh;d[o+2]=bl*sh;d[o+3]=255}
function renderRows(r0,r1){const d=ID.data,v=S.view,flat=v==='age'||v==='temp'||v==='plates',natural=v==='normal';
  for(let py=r0;py<r1;py++)for(let px=0;px<IW;px++){const pi=py*IW+px,dt=DET[pi],dd=(dt-DET[pi+1>=IW*IH?pi:pi+1]+dt-DET[pi+IW<IW*IH?pi+IW:pi]);shadePix((px+0.5)/SC3-0.5,(py+0.5)/SC3-0.5,dt,dd,d,pi*4,flat,natural,dt*0.8,DET[(pi+IW*40)%(IW*IH)]*0.8)}}
// sharp close-ups: when zoomed in, the part of the map on screen is redrawn at full screen resolution
const DETS=(x,y)=>{x=mod(x,IW);y=clamp(y,0,IH-1.001);const x0=Math.floor(x),y0=Math.floor(y),tx=x-x0,ty=y-y0,x1=(x0+1)%IW,y1=Math.min(IH-1,y0+1);return(DET[y0*IW+x0]*(1-tx)+DET[y0*IW+x1]*tx)*(1-ty)+(DET[y1*IW+x0]*(1-tx)+DET[y1*IW+x1]*tx)*ty};
const VIEW={c:document.createElement('canvas'),job:null,ready:null,key:''};
function viewWanted(){return cam.z>=SC3*1.25}
function startView(){const q=Math.min(DPR,Math.sqrt(900000/(W*H))),vw=Math.ceil(W*q),vh=Math.ceil(H*q),wx0=wxOf(0),wy0=Math.max(0,wyOf(0)),wy1=Math.min(GH,wyOf(H));if(wy1<=wy0)return;
  const ph=Math.max(1,Math.round((wy1-wy0)/(wyOf(H)-wyOf(0))*vh));const id=new ImageData(vw,ph);VIEW.job={id,vw,vh:ph,wx0,wy0,ww:W/cam.z,wh:wy1-wy0,row:0,v:S.view,ver:lastImg}}
function stepView(now){if(!viewWanted()){VIEW.job=null;return}if(now-(VIEW.lastT||0)>1500)VIEW.tk=lastImg;const key=[Math.round(cam.x*4),Math.round(cam.y*4),Math.round(cam.z*20),S.view,VIEW.tk].join();
  if(key!==VIEW.key&&!VIEW.job&&now-(VIEW.moved||0)>140){VIEW.key=key;VIEW.lastT=now;startView()}if(key!==VIEW.keySeen){VIEW.keySeen=key;VIEW.moved=now}
  const J=VIEW.job;if(!J)return;const d=J.id.data,flat=J.v==='age'||J.v==='temp'||J.v==='plates',natural=J.v==='normal',t0=performance.now(),sx2=J.ww/J.vw,sy2=J.wh/J.vh,f=SC3,e=1/SC3;
  while(J.row<J.vh&&performance.now()-t0<(S.paused?9:3)){const py=J.row++,wy=J.wy0+(py+0.5)*sy2;for(let px=0;px<J.vw;px++){const wx=J.wx0+(px+0.5)*sx2,X=wx*f-0.5,Y=wy*f-0.5;
      const fine=0.3*DETS(X*4.3+17,Y*4.3+5),dt=DETS(X,Y)+fine,dd=2*dt-DETS(X+1,Y)-DETS(X,Y+1)-2*fine*0.6;
      shadePix(wx-0.5,wy-0.5,dt,dd,d,(py*J.vw+px)*4,flat,natural,(dt+DETS(X*2.1+3,Y*2.1+9)*0.5)*0.85,(DETS(X+5.7,Y+40)+DETS(X*2.1+31,Y*2.1+2)*0.5)*0.85)}}
  if(J.row>=J.vh){VIEW.c.width=J.vw;VIEW.c.height=J.vh;VIEW.c.getContext('2d').putImageData(J.id,0,0);VIEW.ready={wx0:J.wx0,wy0:J.wy0,ww:J.ww,wh:J.wh,v:J.v};VIEW.job=null}}
// instant feedback: repaint only the patch that was just edited, in both the map and the sharp close-up
function quickRedraw(wx,wy,r){const v=S.view,flat=v==='age'||v==='temp'||v==='plates',natural=v==='normal';const y0=clamp(Math.floor(wy-r),0,GH-1),y1=clamp(Math.ceil(wy+r),0,GH-1);
  for(let y=y0;y<=y1;y++)cellColors(y*GW,(y+1)*GW);
  const py0=Math.max(0,y0*SC3),py1=Math.min(IH,(y1+1)*SC3);
  for(const k of [0]){const xs=Math.floor(wx-r),xe=Math.ceil(wx+r);const px0=xs*SC3,pw=(xe-xs+1)*SC3,ph=py1-py0,tmp=new ImageData(pw,ph),d=tmp.data;
    for(let py=py0;py<py1;py++)for(let q=0;q<pw;q++){const pxg=mod(px0+q,IW),pi=py*IW+pxg,dt=DET[pi],dd=(dt-DET[pi+1>=IW*IH?pi:pi+1]+dt-DET[pi+IW<IW*IH?pi+IW:pi]);shadePix((pxg+0.5)/SC3-0.5,(py+0.5)/SC3-0.5,dt,dd,d,((py-py0)*pw+q)*4,flat,natural,dt*0.8,DET[(pi+IW*40)%(IW*IH)]*0.8);const o=pi*4,o2=((py-py0)*pw+q)*4;ID.data[o]=d[o2];ID.data[o+1]=d[o2+1];ID.data[o+2]=d[o2+2];ID.data[o+3]=255}
    const bx=mod(px0,IW);for(const off of [bx,bx-IW]){ig.putImageData(tmp,off,py0);pg.putImageData(tmp,off,py0)}}
  FADE=0;
  const R0=VIEW.ready;if(viewWanted()&&R0&&R0.v===S.view){const vw=VIEW.c.width,vh=VIEW.c.height,sxp=R0.ww/vw,syp=R0.wh/vh;
    for(const k of [-1,0,1]){const cxw=wx+k*GW;let qx0=Math.floor((cxw-r-R0.wx0)/sxp),qx1=Math.ceil((cxw+r-R0.wx0)/sxp),qy0=Math.floor((wy-r-R0.wy0)/syp),qy1=Math.ceil((wy+r-R0.wy0)/syp);
      qx0=clamp(qx0,0,vw);qx1=clamp(qx1,0,vw);qy0=clamp(qy0,0,vh);qy1=clamp(qy1,0,vh);if(qx1<=qx0||qy1<=qy0)continue;const tw=qx1-qx0,th=qy1-qy0,tmp=new ImageData(tw,th),d=tmp.data,f=SC3;
      for(let py=qy0;py<qy1;py++){const wyy=R0.wy0+(py+0.5)*syp;for(let px=qx0;px<qx1;px++){const wxx=R0.wx0+(px+0.5)*sxp,X=wxx*f-0.5,Y=wyy*f-0.5,fine=0.3*DETS(X*4.3+17,Y*4.3+5),dt=DETS(X,Y)+fine,dd=2*dt-DETS(X+1,Y)-DETS(X,Y+1)-2*fine*0.6;
        shadePix(wxx-0.5,wyy-0.5,dt,dd,d,((py-qy0)*tw+px-qx0)*4,flat,natural,(dt+DETS(X*2.1+3,Y*2.1+9)*0.5)*0.85,(DETS(X+5.7,Y+40)+DETS(X*2.1+31,Y*2.1+2)*0.5)*0.85)}}
      VIEW.c.getContext('2d').putImageData(tmp,qx0,qy0)}}}
let BPATH=null;function buildBPaths(){BPATH=[new Path2D(),new Path2D(),new Path2D()];const segs=[[],[],[]];
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const i=y*GW+x,t=bnd[i];if(!t)continue;const p0=pl[i],jr=y*GW+(x+1)%GW,jd=y<GH-1?i+GW:-1;if(pl[jr]!==p0)segs[t-1].push([x+1,y,x+1,y+1]);if(jd>=0&&pl[jd]!==p0)segs[t-1].push([x,y+1,x+1,y+1])}
  segs.forEach((L,k)=>{const adj=new Map(),key=(x,y)=>x+','+y,used=new Uint8Array(L.length);L.forEach((s0,n)=>{for(const [x,y] of [[s0[0],s0[1]],[s0[2],s0[3]]]){const kk=key(x,y);if(!adj.has(kk))adj.set(kk,[]);adj.get(kk).push(n)}});
    for(let n=0;n<L.length;n++){if(used[n])continue;used[n]=1;let pts=[[L[n][0],L[n][1]],[L[n][2],L[n][3]]];
      for(const dir of [1,0]){for(;;){const end=dir?pts[pts.length-1]:pts[0],nx=(adj.get(key(end[0],end[1]))||[]).find(m=>!used[m]);if(nx==null)break;used[nx]=1;const q=L[nx],o=(q[0]===end[0]&&q[1]===end[1])?[q[2],q[3]]:[q[0],q[1]];if(dir)pts.push(o);else pts.unshift(o)}}
      if(pts.length>3){const m=[pts[0]];for(let j=0;j<pts.length-1;j++){const [ax,ay]=pts[j],[bx,by]=pts[j+1];if(Math.abs(bx-ax)>2){m.push(pts[j+1]);continue}m.push([(ax+bx)/2,(ay+by)/2])}m.push(pts[pts.length-1]);pts=m}
      for(let it=0;it<3&&pts.length>2;it++){const o=[pts[0]];for(let j=0;j<pts.length-1;j++){const [ax,ay]=pts[j],[bx,by]=pts[j+1];if(Math.abs(bx-ax)>2){o.push(pts[j+1]);continue}o.push([ax*0.75+bx*0.25,ay*0.75+by*0.25],[ax*0.25+bx*0.75,ay*0.25+by*0.75])}o.push(pts[pts.length-1]);pts=o}
      const P=BPATH[k];P.moveTo(pts[0][0],pts[0][1]);for(let j=1;j<pts.length;j++){if(Math.abs(pts[j][0]-pts[j-1][0])>2)P.moveTo(pts[j][0],pts[j][1]);else P.lineTo(pts[j][0],pts[j][1])}}})}
function finishImage(){BPATH=null;pg.clearRect(0,0,IW,IH);pg.drawImage(img,0,0);ig.putImageData(ID,0,0);FADE=performance.now();lastImg=FADE}
// full redraw at once (used when the view changes or the world loads)
function renderImage(){if(dirtyClim)updateClimate();cellColors();renderRows(0,IH);finishImage();pg.clearRect(0,0,IW,IH);pg.drawImage(img,0,0);dirtyImg=false;JOB=null}
// otherwise a few rows each frame, so drawing never stalls the animation
function stepImage(now){if(!JOB){if(!dirtyImg||now-lastImg<(S.paused?60:200))return;if(dirtyClim)updateClimate();JOB={cell:0,row:0};dirtyImg=false}
  const t0=performance.now();while(JOB.cell<N&&performance.now()-t0<2.2){cellColors(JOB.cell,Math.min(N,JOB.cell+6000));JOB.cell+=6000}
  while(JOB.cell>=N&&JOB.row<IH&&performance.now()-t0<2.2){renderRows(JOB.row,Math.min(IH,JOB.row+12));JOB.row+=12}if(JOB.row>=IH){finishImage();JOB=null}}
function legendFor(v){if(v==='elev')setLegend('Elevation','linear-gradient(90deg,#1e0a3c,#285aaa,#96d2dc,#3c8246,#c8b464,#aa6e46,#fff)',['−10 km','sea level','+8 km']);
  else if(v==='age')setLegend('Age of the seafloor','linear-gradient(90deg,#e63228,#f09628,#e6e646,#50c878,#3c78dc,#5a32aa)',['new','90 Myr','200 Myr']);
  else if(v==='temp')setLegend('Average temperature','linear-gradient(90deg,#dce6ff,#7896f0,#5ac8e6,#78d278,#f0d25a,#f06e3c,#b41e28)',['−40 °C','12 °C','45 °C']);
  else if(v==='plates')setLegend('Plate boundaries','linear-gradient(90deg,#ff4632 0 33%,#5ae6ff 33% 66%,#ffdc46 66%)',['colliding','spreading','sliding']);
  else if(v==='quake')setLegend('Earthquake stress','linear-gradient(90deg,#444,#ff7a00,#ff3c00)',['calm','','high']);
  else if(BNDON)setLegend('Plate boundaries','linear-gradient(90deg,#ff4632 0 33%,#5ae6ff 33% 66%,#ffdc46 66%)',['colliding','spreading','sliding']);else setLegend(null)}
function render(c,now){c.fillStyle='rgb('+getComputedStyle(document.documentElement).getPropertyValue('--voidRGB')+')';c.fillRect(0,0,W,H);
  stepImage(now);
  const z=cam.z,x0=sx(0),y0=sy(0),ww=GW*z;c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  const COVD=(()=>{if(!viewWanted()||!VIEW.ready||VIEW.ready.v!==S.view)return false;const R0=VIEW.ready;for(const k of [-1,0,1]){const X=sx(R0.wx0+k*GW),Xe=sx(R0.wx0+R0.ww+k*GW);if(X<=0.5&&Xe>=W-0.5&&(R0.wy0<=0.01||sy(R0.wy0)<=0.5)&&(R0.wy0+R0.wh>=GH-0.01||sy(R0.wy0+R0.wh)>=H-0.5))return true}return false})();
  const k0=Math.floor((-x0)/ww)-1,k1=Math.ceil((W-x0)/ww)+1,fa=clamp((now-FADE)/320,0,1);if(!COVD)for(let k=k0;k<=k1;k++){if(fa<1)c.drawImage(imgPrev,x0+k*ww,y0,ww,GH*z);c.globalAlpha=fa<1?fa:1;c.drawImage(img,x0+k*ww,y0,ww,GH*z);c.globalAlpha=1}
  stepView(now);if(viewWanted()&&VIEW.ready&&VIEW.ready.v===S.view){const R0=VIEW.ready;for(const k of [-1,0,1]){const X=sx(R0.wx0+k*GW),Xe=sx(R0.wx0+R0.ww+k*GW);if(Xe<0||X>W)continue;c.drawImage(VIEW.c,X,sy(R0.wy0),Xe-X,sy(R0.wy0+R0.wh)-sy(R0.wy0))}}
  // plate boundaries drawn as crisp lines on every view: red = colliding, cyan = spreading, yellow = sliding past
  if(BNDON&&S.view!=='plates'){if(!BPATH)buildBPaths();const lw=Math.max(2.5,Math.min(4.5,z*0.5))/z,cols=['rgba(255,80,60,.9)','rgba(100,230,255,.9)','rgba(255,215,70,.9)'];c.lineCap='round';c.lineJoin='round';
    for(let k=k0;k<=k1;k++){const ox=x0+k*ww;if(ox>W||ox+ww<0)continue;c.save();c.translate(ox,y0);c.scale(z,z);c.lineWidth=lw;BPATH.forEach((P,q)=>{c.strokeStyle=cols[q];c.stroke(P)});c.restore()}}
  // poles fade
  const wrapX=x=>{let X=sx(x);X=X-Math.floor((X-(-ww/2))/ww)*ww;return X};
  const each=(x,f)=>{const X=wrapX(x);for(let k=-1;k<=Math.ceil(W/ww)+1;k++){const XX=X+k*ww;if(XX>-60&&XX<W+60)f(XX)}};
  // plate arrows and names
  if(S.view==='plates'){c.lineWidth=2.5;c.font='600 12px "IBM Plex Mono",monospace';c.textAlign='center';for(const p of PL){if(p.n<60)continue;const L=Math.hypot(p.vx,p.vy)/CMY*ENV.speed*6*Math.min(2,z/3),a=Math.atan2(p.vy,p.vx),Y=sy(p.cy+.5);
      each(p.cx+.5,X=>{c.strokeStyle='rgba(255,255,255,.9)';c.fillStyle='rgba(255,255,255,.9)';c.beginPath();c.moveTo(X,Y);const ex=X+Math.cos(a)*L,ey=Y+Math.sin(a)*L;c.lineTo(ex,ey);c.stroke();c.beginPath();c.moveTo(ex+Math.cos(a)*8,ey+Math.sin(a)*8);c.lineTo(ex+Math.cos(a+2.5)*7,ey+Math.sin(a+2.5)*7);c.lineTo(ex+Math.cos(a-2.5)*7,ey+Math.sin(a-2.5)*7);c.fill();
        if(LBL){c.fillStyle='rgba(0,0,0,.55)';const tw=c.measureText(p.name).width+10;c.fillRect(X-tw/2,Y-24,tw,16);c.fillStyle='#fff';c.fillText(p.name,X,Y-12)}})}}
  // hotspots
  for(const s of HS){const Y=sy(s.y+.5);each(s.x+.5,X=>{const r=Math.max(5,z*1.6);c.strokeStyle='rgba(255,120,40,.85)';c.setLineDash([3,3]);c.lineWidth=1.5;c.beginPath();c.arc(X,Y,r,0,7);c.stroke();c.setLineDash([]);c.fillStyle='rgba(255,90,30,.25)';c.beginPath();c.arc(X,Y,r,0,7);c.fill()})}
  // volcanoes
  const vs=clamp(z*0.9,3,9);for(const v of VOL){const Y=sy(cyOf(v.i)+.5);each(cxOf(v.i)+.5,X=>{c.fillStyle=v.ext?'rgba(120,110,100,.8)':v.act>0?'#ff6a2a':'#c0503a';c.strokeStyle='rgba(0,0,0,.6)';c.lineWidth=1;c.beginPath();c.moveTo(X,Y-vs);c.lineTo(X+vs*.8,Y+vs*.5);c.lineTo(X-vs*.8,Y+vs*.5);c.closePath();c.fill();c.stroke();
    if(v.act>0){c.fillStyle=`rgba(255,140,60,${v.act*0.35})`;c.beginPath();c.arc(X,Y-vs*.3,vs*2.2*v.act+2,0,7);c.fill()}
    if(LBL&&z>=11&&!v.ext){c.font='11px "IBM Plex Sans",sans-serif';c.textAlign='left';c.fillStyle='rgba(255,230,210,.9)';c.fillText(v.name,X+vs+2,Y+3)}})}
  // quakes and tsunamis
  for(const q of QK){const Y=sy(q.y);each(q.x,X=>{if(q.tsu){const r=q.age*z*9;c.strokeStyle=`rgba(140,220,255,${Math.max(0,1-q.age/7)})`;c.lineWidth=3;c.beginPath();c.arc(X,Y,r,0,7);c.stroke();c.beginPath();c.arc(X,Y,r*0.75,0,7);c.stroke();return}
    const r=(q.m-4)*(1+q.age*2.2)*Math.max(2,z*0.8),al=Math.max(0,1-q.age/3.2);c.strokeStyle=`rgba(255,${q.m>=7?80:200},60,${al})`;c.lineWidth=q.m>=7?3:1.5;c.beginPath();c.arc(X,Y,r,0,7);c.stroke();
    if(q.age<1.2&&q.m>=6){c.fillStyle=`rgba(255,240,200,${al})`;c.font='600 11px "IBM Plex Mono",monospace';c.textAlign='center';c.fillText('M'+q.m.toFixed(1),X,Y-r-3)}})}
  for(const p of PARTS){const Y=sy(p.y);each(p.x,X=>{c.globalAlpha=Math.min(1,p.life/p.max*1.5);c.fillStyle=p.c;c.fillRect(X-p.s/2,Y-p.s/2,p.s,p.s)})}c.globalAlpha=1;
  // highest peak and deepest trench markers
  if(LBL&&STAT.peak>0){const i=STAT.peakI,Y=sy(cyOf(i)+.5);each(cxOf(i)+.5,X=>{c.fillStyle='#fff';c.font='600 11px "IBM Plex Mono",monospace';c.textAlign='center';c.fillText('▲ '+fmtN(Math.round(STAT.peak))+' m',X,Y-8)})}
  // selection
  if(S.sel){const i=S.sel.i,Y=sy(cyOf(i));each(cxOf(i),X=>{c.strokeStyle='#ffc35a';c.lineWidth=2;const s=Math.max(8,z);c.strokeRect(X-1,Y-1,s+2,s+2);c.beginPath();c.moveTo(X+s/2,Y-10);c.lineTo(X+s/2,Y-3);c.moveTo(X+s/2,Y+s+3);c.lineTo(X+s/2,Y+s+10);c.moveTo(X-10,Y+s/2);c.lineTo(X-3,Y+s/2);c.moveTo(X+s+3,Y+s/2);c.lineTo(X+s+10,Y+s/2);c.stroke()})}
  // tool previews
  if(TOOLD&&TOOLD.kind==='line'){c.strokeStyle='#ff5a5a';c.lineWidth=3;c.setLineDash([8,6]);c.beginPath();c.moveTo(sx(TOOLD.ax),sy(TOOLD.ay));c.lineTo(sx(TOOLD.ax+wdx(TOOLD.bx-TOOLD.ax)),sy(TOOLD.by));c.stroke();c.setLineDash([])}
  if(TOOLD&&TOOLD.kind==='push'){const X0=sx(TOOLD.ax),Y0=sy(TOOLD.ay),X1=sx(TOOLD.ax+wdx(TOOLD.bx-TOOLD.ax)),Y1=sy(TOOLD.by),cm=pushCm();c.strokeStyle='#fff';c.lineWidth=3;c.beginPath();c.moveTo(X0,Y0);c.lineTo(X1,Y1);c.stroke();c.fillStyle='#fff';c.font='600 12px "IBM Plex Mono",monospace';c.textAlign='left';c.fillText(cm.toFixed(1)+' cm/yr',X1+8,Y1)}
  if(HOVER&&S.tool!=='select'&&TB[S.tool]&&TB[S.tool].brush){const r=(S.brush+0.5)*z;c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=1;c.beginPath();c.arc(sx(HOVER[0]),sy(HOVER[1]),r,0,7);c.stroke()}
}

/* ---------- tools ---------- */
const TB={raise:{brush:1},lower:{brush:1},continent:{brush:1},ocean:{brush:1},quake:{brush:1},meteor:{brush:1}};
let TOOLD=null,HOVER=null;
const pushCm=()=>TOOLD?clamp(Math.hypot(wdx(TOOLD.bx-TOOLD.ax),TOOLD.by-TOOLD.ay)*0.5,0,20):0;
function applyBrush(t,wx,wy){const r=S.brush;
  if(t==='raise'){brushCells(wx,wy,r,(i,f)=>{h[i]=Math.min(9000,h[i]+(h[i]<SEA-300?700:350)*f);if(h[i]>SEA-300){if(cr[i]<.6)LANDMADE++;cr[i]=Math.max(cr[i],.6)}});RAISED++}
  else if(t==='lower'){brushCells(wx,wy,r,(i,f)=>{h[i]=Math.max(-11000,h[i]-(h[i]>SEA+300?600:450)*f);if(h[i]<SEA-1500)cr[i]=Math.min(cr[i],.4)});RAISED++}
  else if(t==='continent'){brushCells(wx,wy,r,(i,f)=>{if(cr[i]<.6)LANDMADE++;cr[i]=1;h[i]=Math.max(h[i],SEA+150+250*f);age[i]=Math.max(age[i],50)});RAISED++}
  else if(t==='ocean'){brushCells(wx,wy,r,(i,f)=>{cr[i]=0;h[i]=Math.min(h[i],SEA-3000*f-500);age[i]=0});RAISED++}
  chEv('brush',{t})}
const SIM={id:'lithosphere',name:'Lithosphere',budget:9,world:{w:GW,h:GH,wrapX:true,maxZ:40,followZ:6},home:'earth',freeScen:'earth',tutScen:'earth',defSpeed:2,homeSpeed:2,inspectTab:'insp',
  speeds:[['10k yr',0.01],['100k',0.1],['1 Myr',1],['5 Myr',5],['20 Myr',20]],
  fmtRate:v=>v<1?`${fmtN(v*1e6/1000)} thousand years / s`:`${fmtN(v,v<10?1:0)} million years / s`,
  dateTxt:()=>S.t<1?`${fmtN(S.t*1e6/1000,0)} thousand years`:`${fmtN(S.t,S.t<10?2:S.t<100?1:0)} million years`,
  dateSub:()=>`${STAT.avgT.toFixed(0)} °C average · sea ${SEA>=0?'+':''}${Math.round(SEA)} m`,
  stepSize:sp=>clamp(sp/45,0.002,0.45),
  tools:[['',[['select','👆','Inspect']]],['Plates',[['push','➡️','Push plate','Drag on a plate in the direction it should move. Longer drags push it faster.'],['rift','✂️','Rift','Drag a line across a plate to tear it in two. A new ocean opens along the line.']]],
    ['Land',[['raise','⛰️','Raise','Paint to push the ground up. Raised seafloor becomes new land.',1],['lower','🕳️','Lower','Paint to dig the ground down.',1],['continent','🟫','Continent','Paint continental crust: light rock that floats high and makes land.',1],['ocean','🟦','Ocean','Paint heavy oceanic crust that sinks into a sea basin.',1]]],
    ['Forces',[['volcano','🌋','Volcano','Click to start a volcano. It erupts and builds a cone.'],['hotspot','🔥','Hotspot','Click to place a mantle plume. Plates passing over it get a chain of volcanoes.'],['quake','💥','Quake','Click to set off an earthquake. Brush size sets the magnitude.',1],['meteor','☄️','Meteor','Click to drop a meteor. Brush size sets its size.',1]]]],
  scens:SCENLIST,
  load(id){(SCENS[id]||SCENS.earth)();for(let k=0;k<6;k++)tect(0.05);countPlates();computeStats();volcanoUpkeep();HIST=[];sampleHist(true);syncWorldUI();legendFor(S.view)},
  after(){renderImage()},
  step(dt){movePlates(dt);tect(dt);
    if(EVT.snowball)ENV.snow=Math.min(38,ENV.snow+dt*12);if(EVT.hothouse)ENV.hot=Math.min(12,ENV.hot+dt*4);
    if(ENV.dust>0){ENV.dust=Math.max(0,ENV.dust-dt*2.2);if(ENV.dust<0.3&&EVT.supervolcano){EVT.supervolcano=false;syncEvents()}}
    this.acc=(this.acc||0)+dt;if(this.acc>Math.max(0.2,S.speed*0.15)){this.acc=0;dirtyClim=true;volcanoUpkeep();countPlates()}},
  frame(dt){frameEvents(dt)},
  render,
  stats:()=>[['Land',Math.round(STAT.land*100)+'%'],['Plates',PL.filter(p=>p.n>0).length],['Highest',fmtN(Math.round(STAT.peak))+' m'],['Volcanoes',STAT.vol]],
  hud(){computeStats();sampleHist();renderPlanet();renderInspect()},
  pick(wx,wy){const y=Math.floor(wy);if(y<0||y>=GH)return null;return{i:idx(Math.floor(wx),y)}},
  selPos:s=>[cxOf(s.i)+.5,cyOf(s.i)+.5],
  pointer(type,wx,wy){const t=S.tool;HOVER=[wx,wy];
    if(t==='rift'||t==='push'){if(type==='down')TOOLD={kind:t==='rift'?'line':'push',ax:wx,ay:wy,bx:wx,by:wy};else if(type==='drag'&&TOOLD){TOOLD.bx=wx;TOOLD.by=wy}
      else if(type==='up'&&TOOLD){const d=TOOLD;TOOLD=null;if(t==='rift'){if(!splitPlate(d.ax,d.ay,wx,wy))toast('Drag a longer line right across one plate');else toast('✂ The plate tears in two: a rift valley opens')}
        else{const i=idx(Math.floor(d.ax),clamp(Math.floor(d.ay),0,GH-1)),P=PL[pl[i]],dx=wdx(wx-d.ax),dy=wy-d.ay,L=Math.hypot(dx,dy);if(!P)return;if(L<1){P.vx=P.vy=0;toast(`${P.name} plate stopped`)}else{const cm=clamp(L*0.5,0,20);P.vx=dx/L*cm*CMY;P.vy=dy/L*cm*CMY;toast(`${P.name} plate now moves ${cm.toFixed(1)} cm a year`)}PUSHES++;PLATEED++;chEv('push',{p:P.id,cm:plateCm(P)});S.sel={i}}}
      return}
    if(type==='up')return;
    if(t==='volcano'&&type==='down'){const i=idx(Math.floor(wx),clamp(Math.floor(wy),0,GH-1));const v=addVolcano(i,'user');if(v){brushCells(wx,wy,2,(j,f)=>{h[j]=Math.max(h[j],SEA-400)+500*f;cr[j]=Math.max(cr[j],0.45)});erupt(v,false);toast(`🌋 ${v.name} is erupting`)}return}
    if(t==='hotspot'&&type==='down'){if(HS.length>=14){toast('That is the most hotspots a planet can hold');return}HS.push({x:Math.floor(wx),y:clamp(Math.floor(wy),2,GH-3),str:1,name:'Hotspot '+(HS.length+1)});HOTSPOTS++;chEv('hotspot',{});toast('🔥 Hotspot placed: speed up time to watch volcanoes form');return}
    if(t==='quake'&&type==='down'){const i=idx(Math.floor(wx),clamp(Math.floor(wy),0,GH-1));quake(i,Math.min(9.6,6+S.brush*0.3),false);return}
    if(t==='meteor'&&type==='down'){meteor(wx,wy,2+S.brush*0.9);return}
    if(TB[t]&&TB[t].brush&&(type==='down'||type==='drag'))applyBrush(t,wx,wy)},
  hover(wx,wy){HOVER=[wx,wy]},
  viewChanged:v=>{legendFor(v);renderImage()},
  toolChanged:()=>{TOOLD=null},
  find(q){const out=[];const add=(label,sub,go)=>out.push({label,sub,go});
    if('highest mountain peak everest'.includes(q)||q.includes('high')||q.includes('mount')&&!VOL.some(v=>v.name.toLowerCase().includes(q)))add('Highest mountain',fmtN(Math.round(STAT.peak))+' m',()=>{const i=STAT.peakI;S.sel={i};flyToW(cxOf(i)+.5,cyOf(i)+.5,6);showTab('insp')});
    if('deepest trench ocean'.includes(q)||q.includes('trench')||q.includes('deep'))add('Deepest trench',fmtN(Math.round(-STAT.deep))+' m deep',()=>{const i=STAT.deepI;S.sel={i};flyToW(cxOf(i)+.5,cyOf(i)+.5,6);showTab('insp')});
    for(const p of PL)if(p.n&&p.name.toLowerCase().includes(q))add(p.name+' plate',`${plateCm(p).toFixed(1)} cm/yr · ${Math.round(p.cont*100)}% continent`,()=>{const i=idx(p.cx,Math.floor(p.cy));S.sel={i};flyToW(p.cx,p.cy,3);setView('plates');showTab('insp')});
    for(const v of VOL)if(v.name.toLowerCase().includes(q))add(v.name,v.ext?'extinct volcano':'active volcano',()=>{S.sel={i:v.i};flyToW(cxOf(v.i)+.5,cyOf(v.i)+.5,7);showTab('insp')});
    for(const s of HS)if(s.name.toLowerCase().includes(q))add(s.name,'hotspot',()=>flyToW(s.x,s.y,5));
    for(const [,items] of SIM.tools)for(const [id,ico,name] of items)if(id!=='select'&&(name.toLowerCase().includes(q)||id.includes(q)))add(`${ico} Use the ${name} tool`,'tool',()=>setTool(id));
    for(const [ev,lab] of [['supervolcano','🌋 Supervolcano'],['snowball','❄ Snowball Earth'],['hothouse','☀ Hothouse'],['megaquake','💥 Mega-quake'],['meteor','☄ Meteor strike'],['plume','🔥 Mantle plume'],['breakup','✂ Break a continent']])if(lab.toLowerCase().includes(q)||ev.includes(q))add(lab,'event',()=>doEvent(ev));
    for(const s of SCENLIST)if(s.name.toLowerCase().includes(q))add('World: '+s.name,s.desc,()=>{loadScen(s.id);toast(s.name)});
    return out},
  tabShown(id){if(id==='planet')renderPlanet(true)},
  selChanged(){renderInspect()},
};
/* ---------- panels ---------- */
const fmtLat=y=>{const l=latOf(y);return Math.abs(l).toFixed(0)+'°'+(l>=0?'N':'S')},fmtLon=x=>{const l=lonOf(x);return Math.abs(l).toFixed(0)+'°'+(l>=0?'E':'W')};
function kv(rows){return rows.map(([k,v])=>`<div><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}
function renderPlanet(force){if($('pane-planet').hidden&&!force)return;
  $('pStats').innerHTML=kv([['Land',Math.round(STAT.land*100)+'%'],['Continents',STAT.cont],['Islands',STAT.isl],['Highest peak',fmtN(Math.round(STAT.peak))+' m'],['Deepest trench',fmtN(Math.round(-STAT.deep))+' m'],['Active volcanoes',STAT.vol],['Ice cover',Math.round(STAT.ice*100)+'%'],['Oldest seafloor',Math.round(STAT.old)+' Myr']]);
  const g=$('graph'),gc=g.getContext('2d'),w=g.width=g.clientWidth*DPR,hh=g.height=g.clientHeight*DPR;gc.clearRect(0,0,w,hh);
  if(HIST.length>1){const t0=HIST[0].t,t1=HIST[HIST.length-1].t||1,X=t=>8+(w-16)*(t-t0)/Math.max(1e-6,t1-t0);
    const line=(f,lo,hi,col)=>{gc.strokeStyle=col;gc.lineWidth=2*DPR;gc.beginPath();HIST.forEach((p,k)=>{const y=hh-8-(hh-16)*clamp((f(p)-lo)/(hi-lo),0,1);k?gc.lineTo(X(p.t),y):gc.moveTo(X(p.t),y)});gc.stroke()};
    line(p=>p.land,0,0.6,'#7fd18a');line(p=>p.peak,0,9000,'#ff8a5c');line(p=>p.temp,-30,35,'#7fb2ff')}
  $('gKey').innerHTML='<span style="color:#7fd18a">■ land 0–60%</span> · <span style="color:#ff8a5c">■ highest peak 0–9 km</span> · <span style="color:#7fb2ff">■ temperature</span>';
  const L=$('plist');const ps=PL.filter(p=>p.n>0).sort((a,b)=>b.n-a.n);if(L.children.length!==ps.length){L.textContent='';for(const p of ps){const r=document.createElement('button');r.className='sprow';r.innerHTML='<i></i><span></span><b></b>';L.appendChild(r)}}
  ps.forEach((p,k)=>{const r=L.children[k];r.children[0].style.background=p.col;r.children[1].textContent=`${p.name} · ${Math.round(p.n/N*100)}% of surface${p.cont>.3?' · continental':''}`;r.children[2].textContent=plateCm(p).toFixed(1)+' cm/yr';r.onclick=()=>{const i=idx(p.cx,Math.floor(p.cy));S.sel={i};flyToW(p.cx,p.cy);setView('plates');showTab('insp')}});
  const Q=$('qlog');Q.innerHTML=QLOG.length?QLOG.map(q=>`<div><span>${q.where}${q.ocean?' · undersea':''}</span><b style="color:${q.m>=8?'#ff6b5a':q.m>=7?'#ffc35a':'inherit'}">M${q.m.toFixed(1)}</b></div>`).join(''):'<p class="note">None yet. Earthquakes happen along plate boundaries.</p>'}
let INSPK='';
function renderInspect(){const b=S.sel;$('inspEmpty').hidden=!!b;$('inspBody').hidden=!b;if(!b)return;const i=b.i,P=PL[pl[i]];if(!P)return;
  const x=cxOf(i),y=cyOf(i),hh=h[i]-SEA,bt=['None','Colliding','Spreading','Sliding past'][bnd[i]],vol=VOL.find(v=>v.i===i);
  const key=[i,pl[i],P.vx.toFixed(4),P.vy.toFixed(4)].join();const body=$('inspBody');
  if(INSPK!==key){INSPK=key;const dir=(Math.atan2(-P.vy,P.vx)*180/Math.PI+360)%360;
    body.innerHTML=`<h2 class="ititle" id="iTitle"></h2><div class="isub" id="iSub"></div><div class="kv" id="iKv"></div>
    <span class="k">The ${P.name} plate</span><div class="kv" id="iPl"></div>
    <div class="sl"><div class="row"><span class="k">Plate speed</span><span id="pSpV"></span></div><input type="range" id="pSp" min="0" max="20" step="0.1"></div>
    <div class="sl"><div class="row"><span class="k">Direction</span><span id="pDirV"></span></div><input type="range" id="pDir" min="0" max="359" step="1"></div>
    <div class="actions"><button class="btn" id="pStop">Stop plate</button><button class="btn" id="pSplit">✂ Split here</button><button class="btn" id="pView">Show plates</button></div>
    <p class="note">Plates really move 1–15 cm a year, about as fast as fingernails grow. Over millions of years that adds up to thousands of kilometres.</p>`;
    const sp=$('pSp'),dr=$('pDir');sp.value=plateCm(P)/ENV.speed||0;dr.value=Math.round(dir);
    const apply=()=>{const cm=+sp.value,a=+dr.value*Math.PI/180;P.vx=Math.cos(a)*cm*CMY;P.vy=-Math.sin(a)*cm*CMY;PLATEED++;chEv('push',{p:P.id,cm:plateCm(P)});INSPK=[i,pl[i],P.vx.toFixed(4),P.vy.toFixed(4)].join();$('pSpV').textContent=cm.toFixed(1)+' cm/yr';$('pDirV').textContent=compass(+dr.value)};
    sp.oninput=apply;dr.oninput=apply;$('pStop').onclick=()=>{sp.value=0;apply()};$('pView').onclick=()=>setView('plates');
    $('pSplit').onclick=()=>{const a=Math.random()*Math.PI,L=30;if(splitPlate(x-Math.cos(a)*L,y-Math.sin(a)*L,x+Math.cos(a)*L,y+Math.sin(a)*L))toast('✂ The plate splits in two');else toast('Too close to the plate edge to split here')};
    $('pSpV').textContent=(+sp.value).toFixed(1)+' cm/yr';$('pDirV').textContent=compass(+dr.value)}
  $('iTitle').textContent=vol?vol.name:biome(i);$('iSub').textContent=`${fmtLat(y)} ${fmtLon(x)}${vol?` · ${vol.ext?'extinct':'active'} ${vol.kind==='hotspot'?'hotspot ':vol.kind==='arc'?'arc ':''}volcano · ${vol.erupts} eruptions`:''}`;
  $('iKv').innerHTML=kv([[hh>=0?'Elevation':'Depth',fmtN(Math.round(Math.abs(hh)))+' m'],['Temperature',tempAt(i).toFixed(0)+' °C'],['Crust',cr[i]>.5?'Continental':'Oceanic'],['Crust age',cr[i]>.5?'over 200 Myr':Math.round(age[i])+' Myr'],['Plate boundary',bt],['Quake stress',bnd[i]?Math.min(100,Math.round((brel[i]*1.4+STR[i]*0.06)*100))+'%':'low']]);
  $('iPl').innerHTML=kv([['Speed',plateCm(P).toFixed(1)+' cm/yr'],['Heading',compass((Math.atan2(-P.vy,P.vx)*180/Math.PI+360)%360)],['Size',Math.round(P.n/N*100)+'% of surface'],['Continental',Math.round(P.cont*100)+'%']])}
const compass=d=>['east','north-east','north','north-west','west','south-west','south','south-east'][Math.round(d/45)%8];
