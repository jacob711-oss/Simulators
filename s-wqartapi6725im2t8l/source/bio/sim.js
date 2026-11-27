'use strict';
/* ================= Biosphere: the simulation ================= */
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,TAU=Math.PI*2;
let RNG=Math.random;const rnd=()=>RNG(),rr=(a,b)=>a+(b-a)*rnd(),ri=(a,b)=>Math.floor(rr(a,b+1));
function gauss(){let u=0,v=0;while(!u)u=rnd();while(!v)v=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(TAU*v)}
function seeded(s){let a=s>>>0||1;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* world grid: GW x GH cells, positions are in cell units */
const GW=540,GH=340,N=GW*GH,CELL=6;// a big world: about three times the old area
// mic: microbes (soil bacteria and fungi on land, plankton in water); fert: soil nutrients that microbes release from dead matter
const mic=new Float32Array(N),fert=new Float32Array(N),hgt=new Float32Array(N),moist=new Float32Array(N),veg=new Float32Array(N),alg=new Float32Array(N),wet=new Float32Array(N),scar=new Float32Array(N),burn=new Float32Array(N),tBase=new Float32Array(N),sAmp=new Float32Array(N);
const dw=new Uint8Array(N);
const SEA0=0.34;
const CL={huntQuota:20,temp:0,rain:1,seaM:0,seasons:true,dust:0,t0:0,tc:16,latK:20};
const sea=()=>SEA0+CL.seaM*0.0006;
const S={clouds:[],carcasses:[],villages:[],homes:[],oldAge:0,t:90,speed:7,paused:false,animals:[],trees:[],nextId:1,sel:null,follow:false,tool:'select',brush:4,count:2,hist:[],view:'normal',achieved:0,burning:new Set(),parts:[],scen:'meadow',terrainDirty:true,lastHist:0,maxGen:{},born:0,died:0,kills:0};

/* ---------- species ---------- */
// spd and sense in cells per day / cells; meta, thirst: share of a full tank used per day; life, mature, gest in days; t: comfortable temperature range in °C
const SP={
 rabbit:{n:'Rabbit',pl:'Rabbits',ic:'🐇',col:'#a8906f',diet:'herb',hab:'land',len:5,wid:.55,spd:1.25,sense:6,meta:.05,thirst:.06,life:1600,mature:110,gest:30,litter:[2,5],repE:.68,eat:.09,conv:6,tmin:-4,tmax:32,mass:.35},
 mouse:{n:'Mouse',pl:'Mice',ic:'🐁',col:'#8d7c6c',diet:'herb',hab:'land',len:3,wid:.5,spd:1,sense:4,meta:.06,thirst:.05,life:800,mature:55,gest:21,litter:[3,6],repE:.66,eat:.05,conv:8,tmin:-2,tmax:36,mass:.15},
 deer:{n:'Deer',pl:'Deer',ic:'🦌',col:'#9b6b43',diet:'herb',hab:'land',len:10,wid:.42,spd:1.8,sense:9,meta:.028,thirst:.06,life:4000,mature:360,gest:150,litter:[1,2],repE:.7,eat:.16,conv:4.5,tmin:-10,tmax:31,mass:1.4,herd:1},
 bison:{n:'Bison',pl:'Bison',ic:'🦬',col:'#5c4231',diet:'herb',hab:'land',len:14,wid:.55,spd:1.1,sense:7,meta:.024,thirst:.06,life:5500,mature:600,gest:230,litter:[1,1],repE:.7,eat:.26,conv:2.8,tmin:-22,tmax:31,mass:2.5,herd:1},
 zebra:{n:'Zebra',pl:'Zebras',ic:'🦓',col:'#e9e5dc',diet:'herb',hab:'land',len:12,wid:.44,spd:1.9,sense:9,meta:.028,thirst:.07,life:5000,mature:540,gest:250,litter:[1,1],repE:.7,eat:.2,conv:3.4,tmin:6,tmax:43,mass:1.8,herd:1},
 camel:{n:'Camel',pl:'Camels',ic:'🐪',col:'#c9a46a',diet:'herb',hab:'land',len:14,wid:.45,spd:1.25,sense:8,meta:.02,thirst:.012,life:9000,mature:1300,gest:390,litter:[1,1],repE:.7,eat:.2,conv:3.4,tmin:0,tmax:52,mass:2.4,sparse:1},
 fox:{n:'Fox',pl:'Foxes',ic:'🦊',col:'#c8642a',diet:'carn',hab:'land',len:7,wid:.4,spd:1.95,sense:9,meta:.022,thirst:.06,life:2600,mature:280,gest:52,litter:[2,4],repE:.72,prey:['rabbit','mouse'],tmin:-16,tmax:33,mass:.6},
 wolf:{n:'Wolf',pl:'Wolves',ic:'🐺',col:'#7e7b77',diet:'carn',hab:'land',len:12,wid:.38,spd:2.2,sense:12,meta:.018,thirst:.06,life:4000,mature:620,gest:63,litter:[2,4],repE:.74,prey:['deer','rabbit','bison'],tmin:-32,tmax:28,mass:1.2,herd:1},
 lion:{n:'Lion',pl:'Lions',ic:'🦁',col:'#c99a52',diet:'carn',hab:'land',len:14,wid:.42,spd:2.15,sense:14,meta:.012,thirst:.06,life:5000,mature:950,gest:110,litter:[1,3],repE:.74,prey:['zebra','deer','bison','camel','rabbit','mouse'],tmin:6,tmax:46,mass:1.8,herd:1},
 bear:{n:'Bear',pl:'Bears',ic:'🐻',col:'#5b3e29',diet:'omni',hab:'land',len:13,wid:.55,spd:1.35,sense:10,meta:.018,thirst:.05,life:9000,mature:1400,gest:220,litter:[1,2],repE:.74,prey:['fish','rabbit','deer'],eat:.12,conv:1.4,tmin:-28,tmax:30,mass:2.2},
 hawk:{n:'Hawk',pl:'Hawks',ic:'🦅',col:'#6f5337',diet:'carn',hab:'air',len:7,wid:.35,spd:3,sense:16,meta:.022,thirst:.03,life:5000,mature:650,gest:35,litter:[1,3],repE:.72,prey:['mouse','rabbit','fish'],tmin:-12,tmax:40,mass:.4},
 fish:{n:'Fish',pl:'Fish',ic:'🐟',col:'#a3bccb',diet:'herb',hab:'water',len:3.5,wid:.35,spd:1.4,sense:5,meta:.05,thirst:0,life:1500,mature:180,gest:20,litter:[3,8],repE:.66,eat:.05,conv:4,tmin:0,tmax:33,mass:.25,herd:1},
 otter:{n:'Otter',pl:'Otters',ic:'🦦',col:'#4f3a2a',diet:'carn',hab:'amph',len:8,wid:.35,spd:1.6,sense:8,meta:.022,thirst:0,life:4000,mature:650,gest:60,litter:[1,3],repE:.72,prey:['fish'],tmin:-12,tmax:31,mass:.6},
};
const SPK=Object.keys(SP);
const PREDS={};for(const k of SPK)PREDS[k]=SPK.filter(p=>(SP[p].prey||[]).includes(k));
const TK={
 oak:{n:'Oak',ic:'🌳',tmin:-2,tmax:28,rmin:.42,rmax:9,life:22000,fruit:1,col:'#3f6a2c'},
 pine:{n:'Pine',ic:'🌲',tmin:-18,tmax:20,rmin:.28,rmax:9,life:25000,col:'#24452a'},
 palm:{n:'Palm',ic:'🌴',tmin:17,tmax:42,rmin:.5,rmax:9,life:18000,fruit:1,col:'#4d7a2e'},
 cactus:{n:'Cactus',ic:'🌵',tmin:10,tmax:50,rmin:0,rmax:.45,life:30000,col:'#5f8a4a'},
 bush:{n:'Berry bush',ic:'🫐',tmin:2,tmax:33,rmin:.34,rmax:9,life:6000,fruit:1,col:'#3c5f33'},
};

/* ---------- noise and terrain ---------- */
function makeNoise(seed){const r=seeded(seed),P=new Uint8Array(512),G=new Float32Array(256);for(let i=0;i<256;i++){P[i]=i;G[i]=r()}for(let i=255;i>0;i--){const j=Math.floor(r()*(i+1));[P[i],P[j]]=[P[j],P[i]]}for(let i=0;i<256;i++)P[i+256]=P[i];
  const v=(x,y)=>G[P[P[x&255]+(y&255)]];const f=t=>t*t*(3-2*t);
  const m=(a,p)=>p?((a%p)+p)%p:a;
  return(x,y,px,py)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=f(x-xi),yf=f(y-yi),x0=m(xi,px),x1=m(xi+1,px),y0=m(yi,py),y1=m(yi+1,py);return lerp(lerp(v(x0,y0),v(x1,y0),xf),lerp(v(x0,y1),v(x1,y1),xf),yf)}}
// fractal noise that repeats exactly fx times across and fy times down, so the world wraps around with no seam
function pfbm(n,nx,ny,fx,fy,oct){let a=0,s=1,f=1,t=0;for(let o=0;o<oct;o++){const px=fx*f,py=fy*f;a+=n(nx*px,ny*py,px,py)*s;t+=s;s*=.5;f*=2}return a/t}
function fbm(n,x,y,oct){let a=0,s=1,f=1,t=0;for(let o=0;o<oct;o++){a+=n(x*f,y*f)*s;t+=s;s*=.5;f*=2.03}return a/t}
const lat=y=>(y/GH)*2-1;
function elevKm(i){const s=sea(),u=Math.max(0,hgt[i]-s)/(1-s);return u*u*u*5.5}
function computeClimate(){for(let i=0;i<N;i++){const y=(i/GW)|0,L=lat(y);tBase[i]=CL.t0+CL.tc-CL.latK*Math.pow(Math.abs(L),1.5)-6.5*elevKm(i);sAmp[i]=(3+13*Math.abs(L))*(L<0?1:-1)}}
function seasonF(){return CL.seasons?-Math.cos(TAU*(S.t-15)/365):0}
let SEASON=0;
const meanT=i=>tBase[i]+CL.temp-CL.dust;
const cellT=i=>tBase[i]+CL.temp-CL.dust+sAmp[i]*SEASON;
const rainAt=i=>clamp(moist[i]*CL.rain+wet[i],0,2.5);
// what plants can drink: rain plus water from a nearby lake, river or sea
const wetAt=i=>{const d=dw[i];return rainAt(i)+(d<=5?0.6*(1-d/6):0)};
const isWater=i=>hgt[i]<sea();
// the world wraps around like a planet: walk off one side and you come back on the other
const wrapX=x=>((x%GW)+GW)%GW,wrapY=y=>((y%GH)+GH)%GH;
const idx=(x,y)=>{if(!(x>-1e9&&x<1e9&&y>-1e9&&y<1e9))return -1;let xi=Math.floor(x)%GW,yi=Math.floor(y)%GH;if(xi<0)xi+=GW;if(yi<0)yi+=GH;return yi*GW+xi};
function computeDW(){const s=sea(),q=new Int32Array(N);let h=0,t=0;for(let i=0;i<N;i++){if(hgt[i]<s){dw[i]=0;q[t++]=i}else dw[i]=255}
  while(h<t){const i=q[h++],x=i%GW,d=dw[i]+1;if(d>=255)continue;const nb=[x>0?i-1:i+GW-1,x<GW-1?i+1:i-GW+1,i>=GW?i-GW:i-GW+N,i<N-GW?i+GW:i+GW-N];for(const j of nb)if(dw[j]>d){dw[j]=d;q[t++]=j}}}
const dl=new Uint8Array(N);
function computeDL(){const q=new Int32Array(N);let h=0,t=0;for(let i=0;i<N;i++){if(!isWater(i)){dl[i]=0;q[t++]=i}else dl[i]=255}
  while(h<t){const i=q[h++],x=i%GW,d=dl[i]+1;if(d>=255)continue;for(const j of [x>0?i-1:i+GW-1,x<GW-1?i+1:i-GW+1,i>=GW?i-GW:i-GW+N,i<N-GW?i+GW:i+GW-N])if(dl[j]>d){dl[j]=d;q[t++]=j}}}
function terrainChanged(){computeDL();computeDW();computeClimate();S.terrainDirty=true;S.tvNow=true}

function genTerrain(o){const n1=makeNoise(o.seed),n2=makeNoise(o.seed+7),n3=makeNoise(o.seed+13);const raw=new Float32Array(N);
  const FX=Math.max(2,Math.round(o.freq)),FY=Math.max(2,Math.round(o.freq*0.63)),RX=Math.max(3,Math.round(o.freq*1.7)),RY=Math.max(2,Math.round(o.freq*1.07));
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const i=y*GW+x,nx=x/GW,ny=y/GH;let v=pfbm(n1,nx,ny,FX,FY,6);
    const ridge=1-Math.abs(pfbm(n3,nx,ny,RX,RY,4)*2-1);v+=ridge*o.mount*0.25;v+=(pfbm(n2,nx,ny,2,2,2)-.5)*0.35;// broad continents and oceans
    raw[i]=v}
  const sorted=Float32Array.from(raw).sort(),thr=sorted[Math.floor((1-o.land)*(N-1))],mn=sorted[0],mx=sorted[N-1];
  for(let i=0;i<N;i++){const v=raw[i];hgt[i]=v<thr?SEA0*(v-mn)/(thr-mn+1e-9):SEA0+(1-SEA0)*Math.pow((v-thr)/(mx-thr+1e-9),(o.peak||1.2)+0.9)}
  for(const [lx,ly,lr] of (o.lakes||[])){for(let y=-lr;y<=lr;y++)for(let x=-lr;x<=lr;x++){const i=idx(lx*GW+x,ly*GH+y);if(i<0)continue;const d=Math.hypot(x,y)/lr;if(d<1)hgt[i]=Math.min(hgt[i],SEA0-0.02*(1-d)-0.001)}}
  {// soften the land so lakes and coasts have smooth, natural shapes
   const t=new Float32Array(N);for(let pass=0;pass<2;pass++){for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){let sum=0,n=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=(x+dx+GW)%GW,yy=(y+dy+GH)%GH;sum+=hgt[yy*GW+xx];n++}t[y*GW+x]=sum/n}hgt.set(t)}}
  computeDW();
  for(let i=0;i<N;i++){const x=i%GW,y=(i/GW)|0;moist[i]=clamp(pfbm(n2,x/GW,y/GH,4,3,4)*1.2-0.1+o.moist-0.5+(dw[i]<6?0.12*(1-dw[i]/6):0),0,1.4)}
  wet.fill(0);scar.fill(0);burn.fill(0);computeClimate();computeDL()}

/* ---------- vegetation ---------- */
function capOf(T,R){const fT=T<-9?0:T<8?(T+9)/17:T<30?1:T<44?(44-T)/14:0;return fT*Math.min(1,R/0.6)*(1-Math.min(.7,CL.dust/14))}
// plants grow in four bands of rows, one band per frame, each catching up on the time since its last turn
const VEG_PARTS=4,vegAcc=new Float32Array(VEG_PARTS);let vegTurn=0;
function updateVegSliced(dt){for(let k=0;k<VEG_PARTS;k++)vegAcc[k]+=dt;const k=vegTurn++%VEG_PARTS,d=vegAcc[k];vegAcc[k]=0;if(d>0)updateVeg(d,Math.floor(N*k/VEG_PARTS),Math.floor(N*(k+1)/VEG_PARTS))}
function updateVeg(dt,i0=0,i1=N){const s=sea();
  for(let i=i0;i<i1;i++){
    if(hgt[i]<s){veg[i]=0;const T=Math.max(3,cellT(i)),cap=T<1?0.05:T<30?Math.min(1,(s-hgt[i])<0.06?1:0.45):0.5;let a=alg[i];
      if(a<0.01){a=0.01}a=a<cap?cap/(1+(cap-a)/a*Math.exp(-0.035*dt)):a+(cap-a)*Math.min(1,0.03*dt);alg[i]=a;
      mic[i]+=((cellT(i)>0?0.25+0.7*a:0.1)-mic[i])*Math.min(1,0.06*dt);continue}// plankton thrive where algae grow
    alg[i]=0;const T=cellT(i),R=wetAt(i);let v=veg[i];
    // soil life: bacteria and fungi like warm, damp ground with roots; they turn dead matter into nutrients that feed plants
    {const fm=T<-5?0.1:T<35?1:0.35,mc=clamp(fm*(0.15+0.45*Math.min(1,R)+0.45*v+0.25*Math.min(1,fert[i])),0,1);mic[i]+=(mc-mic[i])*Math.min(1,0.05*dt);if(fert[i]>0)fert[i]=Math.max(0,fert[i]-fert[i]*0.004*dt*(0.4+mic[i]))}
    const cap=capOf(T,R)*(1+0.35*Math.min(1,fert[i])*(0.3+0.7*mic[i]));
    if(v<0.003){if(cap>0.05){const x=i%GW;const nb=(x>0?veg[i-1]:0)+(x<GW-1?veg[i+1]:0)+(i>=GW?veg[i-GW]:0)+(i<N-GW?veg[i+GW]:0);if(nb>0.25&&rnd()<0.08*dt)v=0.03}}
    else if(cap>v)v=cap/(1+(cap-v)/v*Math.exp(-0.05*dt));
    else{const floor=Math.min(v,0.12*capOf(meanT(i),R));v=Math.max(floor,v-(v-cap)*Math.min(1,0.03*dt))}
    veg[i]=v;if(wet[i]>0)wet[i]=Math.max(0,wet[i]-0.004*dt);if(scar[i]>0)scar[i]=Math.max(0,scar[i]-0.004*dt)}}

/* ---------- spatial hash for animals ---------- */
// one bucket grid per species, so a fox looking for rabbits never scans the fish
const BK=8,BW=Math.ceil(GW/BK),BH=Math.ceil(GH/BK);let SB={};
const SBUSED={};// bucket arrays are reused between steps instead of re-created
function rebuildHash(){for(const sp in SBUSED){const g=SB[sp];for(const b of SBUSED[sp])g[b].length=0;SBUSED[sp].length=0}SPN={};
  for(const a of S.animals){if(a.dead)continue;const sp=a.sp;SPN[sp]=(SPN[sp]||0)+1;const g=SB[sp]||(SB[sp]=new Array(BW*BH));const b=((a.y/BK)|0)*BW+((a.x/BK)|0);let L=g[b];if(!L)L=g[b]=[];if(!L.length)(SBUSED[sp]||(SBUSED[sp]=[])).push(b);L.push(a)}}
function nearSp(sps,x,y,r,fn){const x0=Math.max(0,((x-r)/BK)|0),x1=Math.min(BW-1,((x+r)/BK)|0),y0=Math.max(0,((y-r)/BK)|0),y1=Math.min(BH-1,((y+r)/BK)|0),r2=r*r;
  for(const sp of sps){const g=SB[sp];if(!g)continue;for(let by=y0;by<=y1;by++)for(let bx=x0;bx<=x1;bx++){const L=g[by*BW+bx];if(!L)continue;for(const a of L){if(a.dead)continue;const dx=a.x-x,dy=a.y-y,d2=dx*dx+dy*dy;if(d2<=r2)fn(a,d2)}}}}
const near=(x,y,r,fn)=>nearSp(SPK,x,y,r,fn);
// trees: a coarse bucket grid too
const TB=6,TBW=Math.ceil(GW/TB),TBH=Math.ceil(GH/TB);let tbuckets=[];
function rebuildTrees(){tbuckets=new Array(TBW*TBH);for(const t of S.trees){if(t.dead)continue;const b=((t.y/TB)|0)*TBW+((t.x/TB)|0);(tbuckets[b]||(tbuckets[b]=[])).push(t)}}
function nearTrees(x,y,r,fn){const x0=Math.max(0,((x-r)/TB)|0),x1=Math.min(TBW-1,((x+r)/TB)|0),y0=Math.max(0,((y-r)/TB)|0),y1=Math.min(TBH-1,((y+r)/TB)|0),r2=r*r;
  for(let by=y0;by<=y1;by++)for(let bx=x0;bx<=x1;bx++){const L=tbuckets[by*TBW+bx];if(!L)continue;for(const t of L){if(t.dead)continue;const dx=t.x-x,dy=t.y-y,d2=dx*dx+dy*dy;if(d2<=r2)fn(t,d2)}}}

/* ---------- animals ---------- */
const MAXA=4000,USERA=800,MAXT=5000,SPCAP={fish:600,mouse:350,rabbit:420,fox:45,hawk:30,wolf:30,lion:30,otter:40,bear:16};let SPN={};
function habitatOK(sp,i){if(i<0)return false;const h=SP[sp].hab;if(h==='air')return true;const w=isWater(i);if(h==='water')return w;if(h==='amph')return SP[sp].diet==='herb'?(!w||dwLand(i)<=2):true;return !w}
function dwLand(i){// how far a water cell is from land (approx: check neighbours)
  const x=i%GW,y=(i/GW)|0;for(let r=1;r<5;r++)for(const [dx,dy] of [[r,0],[-r,0],[0,r],[0,-r]]){const j=idx(x+dx,y+dy);if(j>=0&&!isWater(j))return r}return 9}
function furTint(col,fur){const c=parseInt(col.slice(1),16);let r=c>>16,g=c>>8&255,b=c&255;const t=clamp(fur/30,0,.75);r=lerp(r,236,t);g=lerp(g,236,t);b=lerp(b,232,t);return `rgb(${r|0},${g|0},${b|0})`}
/* ---------- genes ----------
   Quantitative genes (speed, size, senses, fur, heat, lifespan, fertility, immunity): a baby gets the average of its
   parents plus a small random mutation (now and then a big one).
   Coat colour is Mendelian: two copies (alleles), one from each parent. N = normal coat (dominant), D = dark coat,
   w = white coat (recessive: only animals with two w copies are white). */
const GENES=[['speed','Speed',.5,2.2,.06],['size','Size',.5,2.2,.06],['sense','Senses',.5,2.2,.06],['life','Lifespan',.5,1.8,.05],['fert','Fertility',.5,1.8,.06],['immune','Immunity',.3,2,.06]];
const COAT={N:'normal',D:'dark',w:'white'};
function randAllele(sp){const r=rnd();return r<0.84?'N':r<0.92?'D':'w'}
function coatOf(g){const c=g.coat||'NN';return c.includes('N')?'normal':c.includes('D')?'dark':'white'}
function newGenes(sp,fur){const g={fur:clamp((fur||0)+gauss()*1,-10,40),heat:clamp(gauss()*1,-10,20),coat:randAllele(sp)+randAllele(sp)};for(const [k,,lo,hi] of GENES)g[k]=clamp(1+gauss()*0.05,lo,hi);return g}
function mixGenes(a,b){const g={},muts=[];
  for(const [k,lab,lo,hi,sd] of GENES){const base=((a[k]??1)+(b[k]??1))/2;let v=base*(1+gauss()*sd);if(rnd()<0.03){v=base*(rnd()<.5?0.8:1.25);muts.push(lab)}g[k]=clamp(v,lo,hi)}
  g.fur=clamp(((a.fur??0)+(b.fur??0))/2+gauss()*1.6,-10,40);g.heat=clamp(((a.heat??0)+(b.heat??0))/2+gauss()*1.2,-10,20);
  // one coat allele from each parent, with a rare mutation
  const pa=(a.coat||'NN')[rnd()<.5?0:1],pb=(b.coat||'NN')[rnd()<.5?0:1];let ca=pa,cb=pb;if(rnd()<0.01){ca='NDw'[Math.floor(rnd()*3)];muts.push('Coat')}g.coat=ca+cb;g.from={m:pa,f:pb};if(muts.length)g.muts=muts;return g}
function colorOf(sp,g){const c=coatOf(g),base=furTint(SP[sp].col,g.fur);if(c==='white')return'rgb(238,236,230)';if(c==='dark')return shadeCol2(base,-70);return base}
function shadeCol2(c,d){const m=c.match(/\d+/g);return`rgb(${clamp(+m[0]+d,0,255)},${clamp(+m[1]+d,0,255)},${clamp(+m[2]+d,0,255)})`}
// camouflage: +1 hidden, -1 stands out. White hides in snow, dark in thick forest
function camoOf(b){const i=idx(b.x,b.y);if(i<0)return 0;const snowy=cellT(i)<0,c=coatOf(b.genes);if(c==='white')return snowy?1:-0.8;if(c==='dark')return snowy?-1:veg[i]>0.65?0.7:0;return snowy?-0.6:0.2}
const nameOfId=id=>typeof NAMES!=='undefined'?NAMES[id%NAMES.length]+(id>NAMES.length?' '+'IVXLC'[Math.floor(id/NAMES.length)%5]:''):'#'+id;
function addAnimal(sp,x0,y0,o={}){const x=wrapX(x0),y=wrapY(y0);if(S.animals.length>=MAXA+(o.user?USERA:0)||o.age===0&&(SPN[sp]||0)>=(SPCAP[sp]||320))return null;SPN[sp]=(SPN[sp]||0)+1;const g=o.genes||newGenes(sp,o.fur);const s=SP[sp];
  const a={id:S.nextId++,sp,x,y,dir:rnd()*TAU,e:o.e??rr(.55,.85),w:1,age:o.age??rr(s.mature*1.05,s.mature*2.2),sex:o.sex||(rnd()<.5?'f':'m'),genes:g,gen:o.gen||1,kids:0,kills:0,preg:0,pg:null,cd:rr(0,20),
    life:s.life*rr(.75,1.2)*(g.life??1),state:'wander',tx:0,ty:0,ttl:0,sick:0,fat:rr(0,0.9),col:colorOf(sp,g),mom:o.mom||0,dad:o.dad||0,par:o.par||null,born:S.t};
  S.animals.push(a);S.maxGen[sp]=Math.max(S.maxGen[sp]||0,a.gen);return a}
function kill(a,cause){if(a.dead)return;a.dead=true;a.cause=cause;S.died++;if(cause!=='removed'&&cause!=='meteor'&&cause!=='lost'&&S.carcasses.length<700){const m=SP[a.sp].mass*Math.pow(a.genes.size,1.5)*(a.age<SP[a.sp].mature?0.5:1);a.carc={carc:1,id:S.nextId++,x:a.x,y:a.y,sp:a.sp,dir:a.dir,meat:m,m0:m,t:S.t,cause};S.carcasses.push(a.carc)}if(cause==='old age'){S.oldAge=(S.oldAge||0)+1;if(S.parts.length<1400)S.parts.push({x:a.x,y:a.y,vx:0,vy:-0.4,life:1.6,max:1.6,k:'old'})}const C=S.causes||(S.causes={});const c=C[a.sp]||(C[a.sp]={});c[cause]=(c[cause]||0)+1;chEv('death',{sp:a.sp,cause});if(S.sel===a){S.selDead=cause}}
function suitableFur(sp,i){return clamp(SP[sp].tmin-meanT(i)+8,0,35)}
function spawnAt(sp,x,y,n,adapt,e,user){let made=0,tries=0;while(made<n&&tries<n*30){tries++;const px=x+(n>1?gauss()*Math.sqrt(n)*0.9:0),py=y+(n>1?gauss()*Math.sqrt(n)*0.9:0),i=idx(px,py);if(!habitatOK(sp,i))continue;
    const a=addAnimal(sp,px,py,{fur:adapt?suitableFur(sp,i):0,e,user});if(!a)break;made++}return made}
function randomCell(test,tries=4000){for(let k=0;k<tries;k++){const x=rnd()*GW,y=rnd()*GH,i=idx(x,y);if(test(i,x,y))return[x,y]}return null}

const SPD_CELLS=1;// movement scale
function stepAnimal(a,dt){
  const s=SP[a.sp],g=a.genes,i=idx(a.x,a.y);if(i<0){kill(a,'lost');return}
  a.age+=dt;if(a.age>a.life){kill(a,'old age');return}
  const wasHidden=a.hidden;a.hidden=false;const H=a.home&&!a.home.gone?a.home:(a.home=null);if(H)H.last=S.t;
  if(H&&a.bornHome===H&&a.age>s.mature){a.home=null;a.bornHome=null}// grown-up young leave to build their own
  const T=s.hab==='water'?Math.max(2,cellT(i)):cellT(i);
  // energy use: bigger, faster and sharper-sensed bodies cost more to run
  let use=s.meta*Math.pow(g.size,.75)*(0.55+0.45*g.speed*g.speed)*(0.9+0.1*g.sense*g.sense)*(0.92+0.08*(g.life??1))*(0.93+0.07*(g.fert??1))*(0.95+0.05*(g.immune??1))*(1+Math.abs(g.heat??0)*0.004);// every gene has a cost
  const tmin=s.tmin-g.fur-(g.size-1)*4,tmax=s.tmax-g.fur*0.5+(g.size<1?(1-g.size)*3:0)+(g.heat??0);
  const stress=(s.tp==='human'&&fireDist2(a.x,a.y)<36?0:Math.max(0,tmin-T))+Math.max(0,T-tmax);use+=stress*0.0065;a.stress=stress;
  if(a.immT>0)a.immT-=dt;
  if(a.sick>0){use+=.07;a.sick-=dt*(0.6+0.4*(g.immune??1));if(rnd()<0.018*dt/(g.immune??1)*(a.age<s.mature||a.age>a.life*0.8?2:1)){kill(a,'disease');return}if(a.sick<=0){a.sick=0;a.immT=150;chEv('recover',{sp:a.sp})}}
  const warm=s.tp==='human'&&fireDist2(a.x,a.y)<36;a.warm=warm;// a campfire keeps people warm
  const [zlo,zhi]=zoneOf(a),outZone=(T<zlo&&!warm||T>zhi)&&!(wasHidden||a.state==='rest');
  if(outZone){a.outT=(a.outT||0)+dt;if(a.outT>420){kill(a,T<zlo?'cold':'heat');return}}else a.outT=0;
  if(a.preg>0)use*=1.25;
  if(a.state==='rest'||a.state==='sleep')use*=0.6;// resting and sleeping save energy
  // tiredness: builds up through the day, faster when running; sleep clears it; too long without sleep is fatal
  a.fat=(a.fat||0)+dt*(a.state==='sleep'?-1.6:(a.state==='flee'||a.state==='fire'?0.5:['hunt','track','migrate','pack'].includes(a.state)?0.6:0.28));if(a.fat<0)a.fat=0;
  if(a.fat>=3){kill(a,'exhaustion');return}
  a.e-=use*dt;
  if(s.thirst){a.w-=s.thirst*0.6*dt*(1+Math.max(0,T-24)*0.04);if(dw[i]<=2||(s.hab==='air'&&dw[i]<=4)){if(a.w<0.7&&S.parts.length<1400)S.parts.push({x:a.x,y:a.y-0.4,vx:0,vy:-0.5,life:1,max:1,k:'drop'});a.w=1}else if(rainAt(i)>0.45)a.w=Math.min(1,a.w+0.25*dt*Math.min(1,(rainAt(i)-0.4)*3));if(a.w<0.9&&S.clouds.length&&underCloud(a.x,a.y))a.w=Math.min(1,a.w+0.6*dt)}// drink the rain
  if(a.e<=0){kill(a,stress>8?(T<tmin?'cold':'heat'):(a.sick>0?'disease':'starvation'));return}
  if(a.w<=0){kill(a,'thirst');return}
  if(s.hab==='water'&&!isWater(i)){a.e-=0.5*dt;if(a.e<=0){kill(a,'stranded');return}}
  if((s.hab==='land')&&!a.boat&&isWater(i)&&(sea()-hgt[i])>0.02){a.e-=0.3*dt;if(a.e<=0){kill(a,'drowned');return}}
  if(burn[i]>0&&s.hab!=='air'&&s.hab!=='water'){if(rnd()<0.6){kill(a,'fire');return}}
  if(a.preg>0){a.preg-=dt;if(a.preg<=0)giveBirth(a)}
  if(a.cd>0)a.cd-=dt;if(a.hc>0)a.hc-=dt;if(a.hurt>0)a.hurt-=dt;if(a.fleeT>0)a.fleeT-=dt;
  if(a.sick>0)nearSp([a.sp],a.x,a.y,2.6,b=>{if(b!==a&&!b.sick&&!(b.immT>0)&&rnd()<0.35*dt*clamp(1.6-(b.genes.immune??1),0.1,1.3)){b.sick=rr(14,30);chEv('infect',{sp:b.sp})}});
  const sense=s.sense*g.sense;let spd=s.spd*g.speed*(a.age<s.mature?0.75:1)*(a.sick>0?0.65:1)*(a.hurt>0?0.7:1)*(1-0.3*clamp((a.fat||0)-1,0,1.5));// tired animals are slower
  if(elevKm(i)>2.5&&s.hab==='land')spd*=0.6;
  let mode='wander';
  // young animals stay with their mother and are fed by her until they are old enough
  const m=a.momRef;if(m&&a.age<s.mature*(s.tp==='human'?0.35:0.4)){a.fat=Math.max(0,(a.fat||0)-0.6*dt);if(!m.dead){if(a.e<0.7&&m.e>0.2){const give=Math.min(0.7-a.e,0.15*dt);a.e+=give;m.e-=give*0.15}const d=Math.hypot(m.x-a.x,m.y-a.y);if(d>1.8){a.dir=Math.atan2(m.y-a.y,m.x-a.x);a.state='follow';move(a,Math.min(d,spd*1.4*dt));return}}else a.momRef=null}else if(m)a.momRef=null;
  // 1. danger: predators and fire
  let fx=0,fy=0,threat=false;a.fireScare=0;
  if(PREDS[a.sp].length&&(a.state==='flee'||((a.id+((S.t*2)|0))%2===0))){nearSp(PREDS[a.sp],a.x,a.y,sense*(a.state==='sleep'?0.2:0.55),(b,d2)=>{if(b.state==='hunt'||d2<sense*sense*0.12){const d=Math.sqrt(d2)+.1;fx+=(a.x-b.x)/d;fy+=(a.y-b.y)/d;threat=true}})}
  if(s.hab!=='water'&&S.burning.size){for(let k=0;k<12;k++){const ang=k/12*TAU,r=k%2?6:3,j=idx(a.x+Math.cos(ang)*r,a.y+Math.sin(ang)*r);if(j>=0&&burn[j]>0){fx-=Math.cos(ang)*(r===3?2:1);fy-=Math.sin(ang)*(r===3?2:1);threat=true;a.fireScare=1}}}
  if(s.tp!=='human'&&s.hab!=='water'&&S.villages.length){for(const v of S.villages){const d2=(v.x-a.x)**2+(v.y-a.y)**2,R=4+Math.sqrt(v.huts)*1.2;if(d2<R*R){const d=Math.sqrt(d2)+.1;fx+=(a.x-v.x)/d*2;fy+=(a.y-v.y)/d*2;threat=true;a.fireScare=1}}}// keep away from campfires
  const hd=H?Math.hypot(H.x-a.x,H.y-a.y):1e9;
  if(threat&&H&&H.prog>=1&&HOMEK[H.hk].safe&&hd<8){// run home and hide
    if(hd<0.8){mode='hide';a.hidden=true;spd=0}else{mode='hide';a.dir=Math.atan2(H.y-a.y,H.x-a.x);spd*=1.5}}
  else if(threat&&!a.fireScare&&s.diet==='herb'&&a.age>s.mature&&(()=>{let foe=null,fd=1e9;nearSp(PREDS[a.sp],a.x,a.y,sense*0.5,(b,d2)=>{if(d2<fd){fd=d2;foe=b}});if(foe&&strength(a)>strength(foe)*1.3){a.dir=Math.atan2(foe.y-a.y,foe.x-a.x);if(fd<2.2&&rnd()<0.6*dt)fight(a,foe,'charge');return true}return false})()){mode='defend';spd*=1.3}
  else if(threat){mode=a.fireScare?'fire':'flee';a.dir=Math.atan2(fy,fx)+gauss()*0.25;spd*=1.5;a.e-=0.01*dt}
  else if(a.fat>1.15||(a.state==='sleep'&&a.fat>0.1)||(a.fat>(restTime(a)?0.35:0.8)&&a.e>(s.diet==='herb'?0.5:0.65)&&(!s.thirst||a.w>0.5))){// sleep: at home if it is close, otherwise right here
    if(H&&H.prog>=1&&hd>0.9&&hd<10&&a.fat<1.3&&a.state!=='sleep'){mode='tohome';a.dir=Math.atan2(H.y-a.y,H.x-a.x)}else{mode='sleep';spd=0;if(H&&hd<0.9&&HOMEK[H.hk].safe)a.hidden=true}}
  else if(outZone){mode='migrate';spd*=1.4;let best=-1e9,bd=a.dir;for(let k=0;k<12;k++){const ang=k/12*TAU,j=idx(a.x+Math.cos(ang)*4,a.y+Math.sin(ang)*4);if(j<0||!habitatOK(a.sp,j))continue;const t=tFor(a.sp,j),sc=-(Math.max(0,zlo-t)+Math.max(0,t-zhi));if(sc>best){best=sc;bd=ang}}a.dir=bd}
  else if(a.preg>0&&a.preg<10&&H&&hd>1){mode='nesting';a.dir=Math.atan2(H.y-a.y,H.x-a.x)}
  else if(s.thirst&&a.w<0.75&&dw[i]>2){mode='drink';spd*=1.3;let best=dw[i],bj=-1;const x=i%GW;for(const j of [i-1,i+1,i-GW,i+GW,i-GW-1,i-GW+1,i+GW-1,i+GW+1]){if(j<0||j>=N)continue;if(dw[j]<best){best=dw[j];bj=j}}
    if(bj>=0)a.dir=Math.atan2(((bj/GW)|0)+.5-a.y,bj%GW+.5-a.x)+gauss()*.2}
  else if(a.e<(s.diet==='carn'?0.7:0.85)){mode=feed(a,s,g,i,sense,dt);if(mode==='eat')spd=0;else if(mode==='hunt')spd*=a.sprint?2.1:1.3;else if(mode==='track')spd*=1.7;else if(mode==='wander')spd*=1.8}
  else if(a.age>s.mature&&a.cd<=0&&!a.preg&&a.e>s.repE*(a.sex==='m'?0.92:1)){mode=mate(a,s,sense)}
  // homes: build one when grown up, finish building it, and come back to rest
  // boats: grown-up people build one at the shore, sail out to fish and explore, and come back to land
  if(s.tp==='human'&&a.age>s.mature){
    if(!a.boat&&mode==='wander'&&dw[i]<=1&&!isWater(i)&&a.e>0.55){if(a.boatProg>0||rnd()<0.04*dt){a.boatProg=(a.boatProg||0)+dt/6;mode='boatbuild';spd=0;if(a.boatProg>=1){a.boat=true;S.boats=(S.boats||0)+1;chEv('boat',{})}}}
    else if(a.boat&&mode==='wander'){if(isWater(i)){a.atSea=(a.atSea||0)+dt;if(a.atSea>rr(4,14)||a.e<0.5){let best=dl[i],bj=-1;for(const j of [idx(a.x-1,a.y),idx(a.x+1,a.y),idx(a.x,a.y-1),idx(a.x,a.y+1)])if(dl[j]<best){best=dl[j];bj=j}if(bj>=0)a.dir=Math.atan2(((bj/GW)|0)+.5-a.y,bj%GW+.5-a.x);mode='sail'}else{mode='sail';spd*=1.3}}
      else{a.atSea=0;if(dw[i]<=2&&rnd()<0.06*dt){let best=dw[i],bj=-1;for(const j of [idx(a.x-1,a.y),idx(a.x+1,a.y),idx(a.x,a.y-1),idx(a.x,a.y+1)])if(dw[j]<best){best=dw[j];bj=j}if(bj>=0){a.dir=Math.atan2(((bj/GW)|0)+.5-a.y,bj%GW+.5-a.x);mode='sail'}}}}}
  if(mode==='wander'&&a.age>s.mature){const hk=homeKind(a.sp);
    if(hk&&!H&&a.e>0.45&&rnd()<0.15*dt){const near2=homeNear(a.x,a.y,hk==='burrow'?8:hk==='nest'?2.5:0.01);if(near2&&near2.oname===a.sp&&near2.hk===hk){a.home=near2}else{const h=buildHome(a,false);if(h)mode='build'}}
    else if(H&&H.prog<1&&H.owner===a.id){if(hd<1.2){H.prog=Math.min(1,H.prog+dt/HOMEK[H.hk].days);mode='build';spd=0;if(H.prog>=1)chEv('homedone',{k:H.hk,sp:a.sp})}else{mode='build';a.dir=Math.atan2(H.y-a.y,H.x-a.x)}}
    else if(H&&H.prog>=1&&a.e>0.6&&(!s.thirst||a.w>0.7)){if(hd<0.9){if(rnd()<0.85){mode='rest';spd=0;a.hidden=HOMEK[H.hk].safe?true:false}}else if(hd>7||rnd()<0.08){a.dir=lerpAng(a.dir,Math.atan2(H.y-a.y,H.x-a.x),0.6)}}}
  if(mode==='wander'){a.dir+=gauss()*0.5*Math.min(1,dt*2);
    if(s.thirst&&s.hab==='land'&&dw[i]>18&&rainAt(i)<0.6&&rnd()<0.4){// stay within reach of water
      let best=dw[i],bj=-1;for(const j of [i-1,i+1,i-GW,i+GW]){if(j>=0&&j<N&&dw[j]<best){best=dw[j];bj=j}}if(bj>=0)a.dir=lerpAng(a.dir,Math.atan2(((bj/GW)|0)+.5-a.y,bj%GW+.5-a.x),.5)}
    if(s.herd&&rnd()<0.3){let cx=0,cy=0,n=0;nearSp([a.sp],a.x,a.y,sense*0.7,b=>{if(b!==a&&n<8){cx+=b.x;cy+=b.y;n++}});if(n){cx/=n;cy/=n;const d=Math.hypot(cx-a.x,cy-a.y);if(d>2.5)a.dir=lerpAng(a.dir,Math.atan2(cy-a.y,cx-a.x),.35)}}
    spd*=0.45}
  if(mode==='mate')spd*=0.9;
  a.state=mode;
  if(spd>0)move(a,spd*dt*SPD_CELLS)}
function lerpAng(a,b,t){let d=((b-a+Math.PI)%TAU+TAU)%TAU-Math.PI;return a+d*t}
// every animal has a climate zone: a few degrees past its comfortable range. More than 60 weeks outside it is fatal,
// so animals will not walk out of their zone, and if the climate shifts they head for somewhere bearable.
function zoneOf(a){const s=SP[a.sp],g=a.genes;return[s.tmin-g.fur-(g.size-1)*4-12,s.tmax-g.fur*0.5+(g.size<1?(1-g.size)*3:0)+(g.heat??0)+7]}
const ZONEFREE=new Set(['defend','fight','fire','flee','hunt','track','hide','migrate','pack']);// may leave their zone while doing these
const tFor=(sp,j)=>SP[sp].hab==='water'?Math.max(2,cellT(j)):cellT(j);
function move(a,dist){try{return move_(a,dist)}finally{a.x=wrapX(a.x);a.y=wrapY(a.y)}}
function move_(a,dist){const steps=Math.max(1,Math.ceil(dist/1.5)),d=dist/steps,[lo,hi]=zoneOf(a),ci=idx(a.x,a.y),ct=ci>=0?tFor(a.sp,ci):0,inZone=ct>=lo&&ct<=hi&&!ZONEFREE.has(a.state);
  for(let k=0;k<steps;k++){let ok=false;for(const off of [0,.6,-.6,1.2,-1.2,2.2,-2.2,Math.PI]){const ang=a.dir+off,nx=a.x+Math.cos(ang)*d,ny=a.y+Math.sin(ang)*d,j=idx(nx,ny);if(j>=0&&(habitatOK(a.sp,j)||(a.boat&&isWater(j)))&&!(burn[j]>0&&SP[a.sp].hab!=='air')&&(!inZone||(()=>{const t=tFor(a.sp,j);return t>=lo&&t<=hi})())){a.x=nx;a.y=ny;if(off)a.dir=ang;ok=true;break}}if(!ok){a.dir=rnd()*TAU;break}}}
function feed(a,s,g,i,sense,dt){
  if(s.diet==='herb'||s.diet==='omni'){
    if(s.diet==='omni'){// fruit first
      let best=null,bd=1e9;nearTrees(a.x,a.y,sense,(t,d2)=>{if(TK[t.k].fruit&&t.fruit>0.15&&d2<bd){bd=d2;best=t}});
      if(best){if(bd<2.5){const take=Math.min(best.fruit,0.5*dt);best.fruit-=take;a.e=Math.min(1,a.e+take*1.2);return 'eat'}a.dir=Math.atan2(best.y-a.y,best.x-a.x);return 'forage'}}
    if(s.hab==='water'){if(alg[i]>0.12){const take=Math.min(alg[i]-0.05,s.eat*dt);alg[i]-=take;a.e=Math.min(1,a.e+take*s.conv);return 'eat'}}
    else if(s.diet==='herb'||!s.prey){const thr=s.sparse?0.05:s.mass>1?0.07:0.13;if(veg[i]>thr){const take=Math.min(veg[i]-thr*0.5,s.eat*dt);veg[i]-=take;fert[i]=Math.min(3,fert[i]+take*0.12);a.e=Math.min(1,a.e+take*s.conv*(s.sparse&&veg[i]<0.2?1.4:1));return 'eat'}}
    if(s.hab==='land'||s.hab==='amph'){// eat saplings, browse leaves, and the giants push trees over
      let sap=null,tr=null;nearTrees(a.x,a.y,1.6,t=>{if(t.dead)return;if(t.k==='cactus'&&a.sp!=='camel')return;if(t.size<0.3){if(!sap)sap=t}else if(!tr)tr=t});
      if(sap&&s.mass>0.08){sap.dead=true;sap.cause='eaten';a.e=Math.min(1,a.e+0.12+0.1*Math.min(1,s.mass));chEv('treeeat',{sp:a.sp});return 'eat'}
      if(tr&&s.mass>0.5){a.e=Math.min(1,a.e+0.35*dt);tr.hp-=0.012*dt*Math.min(4,s.mass);if(s.tp==='giant'&&rnd()<0.02*dt){tr.dead=true;tr.cause='knocked over';chEv('treeeat',{sp:a.sp})}else if(tr.hp<=0){tr.dead=true;tr.cause='eaten'}return 'browse'}
      if(tr&&/beaver/.test(a.sp)&&dw[i]<=3&&rnd()<0.05*dt){tr.dead=true;tr.cause='felled by a beaver';a.e=Math.min(1,a.e+0.3);return 'eat'}}
    if(s.diet==='herb'){let bv=-1,bx=0,by=0;const F=s.hab==='water'?alg:veg;
      if(a.ttl>0&&rnd()<0.8){a.ttl-=dt;a.dir=Math.atan2(a.ty-a.y,a.tx-a.x);return 'graze'}
      for(let k=0;k<9;k++){const ang=rnd()*TAU,r=rnd()*sense,x=a.x+Math.cos(ang)*r,y=a.y+Math.sin(ang)*r,j=idx(x,y);if(j<0||!habitatOK(a.sp,j))continue;const v=F[j]-r*0.01;if(v>bv){bv=v;bx=x;by=y}}
      if(bv>0.1){a.tx=bx;a.ty=by;a.ttl=2;a.dir=Math.atan2(by-a.y,bx-a.x);return 'graze'}return 'wander'}}
  // carnivores (and omnivores without fruit)
  // scavenging: a carcass nearby is an easy meal
  if(S.carcasses.length){let c=null,cd2=(sense*0.8)**2;for(const k of carcNear(a.x,a.y,sense*0.8)){if(k.meat<=0.01||SP[k.sp].mass>s.mass*6)continue;const d2=(k.x-a.x)**2+(k.y-a.y)**2;if(d2<cd2){cd2=d2;c=k}}
   if(c){if(cd2<1.5){if(rnd()<0.3*dt){let rv=null;near(c.x,c.y,1.6,b=>{if(!rv&&b!==a&&b.sp!==a.sp&&b.state==='scavenge')rv=b});if(rv){const w=fight(a,rv,'carcass');if(w!==a)return 'fight'}}eatCarcass(a,c,s.mass*0.9*dt);return 'scavenge'}a.dir=Math.atan2(c.y-a.y,c.x-a.x);return 'scavenge'}}
  if(s.tp==='human'){if(S.t-(a.kyT??(a.kyT=S.t))>=365){a.kyT=S.t;a.ky=0}if(a.age<s.mature*0.75||(a.ky||0)>=CL.huntQuota){// hunting limit reached: gather plants and fruit instead
    let best=null,bd=1e9;nearTrees(a.x,a.y,sense,(t,d2)=>{if(TK[t.k].fruit&&t.fruit>0.15&&d2<bd){bd=d2;best=t}});if(best){if(bd<2.5){const take=Math.min(best.fruit,0.5*dt);best.fruit-=take;a.e=Math.min(1,a.e+take*1.2);return 'eat'}a.dir=Math.atan2(best.y-a.y,best.x-a.x);return 'gather'}
    if(veg[i]>0.12){const take=Math.min(veg[i]-0.06,0.1*dt);veg[i]-=take;a.e=Math.min(1,a.e+take*3);return 'eat'}return 'gather'}}
  let prey=null,pd=1e9;const R=sense;
  if(a.packRef){a.packT-=dt;const q=a.packRef;if(q.dead||a.packT<=0||!canCatch(a,q)||Math.hypot(q.x-a.x,q.y-a.y)>30)a.packRef=null;else{prey=q;pd=0}}
  if(!prey)nearSp(s.prey,a.x,a.y,R,(b,d2)=>{if(!canCatch(a,b))return;
    const w=d2*(b.sick?0.5:1)*(b.age<SP[b.sp].mature?0.6:1)*(1+1.2*camoOf(b));/* camouflaged prey are noticed less */if(w<pd){pd=w;prey=b}});
  if(!prey){if(s.diet==='omni'&&veg[i]>0.15){const take=Math.min(veg[i]-0.07,s.eat*dt);veg[i]-=take;a.e=Math.min(1,a.e+take*s.conv);return 'eat'}
    if(a.ttl>0){a.ttl-=dt;const d=Math.hypot(a.tx-a.x,a.ty-a.y);if(d>1){a.dir=Math.atan2(a.ty-a.y,a.tx-a.x);return 'track'}a.ttl=0}
    {let bd=1e9;nearSp(s.prey,a.x,a.y,60,(b,d2)=>{if(d2<bd&&canCatch(a,b)){bd=d2;a.tx=b.x;a.ty=b.y}});if(bd>=1e9&&((a.id+(S.t|0))%5)===0){for(const b of S.animals){if(b.dead||!s.prey.includes(b.sp)||!canCatch(a,b))continue;const d2=(b.x-a.x)**2+(b.y-a.y)**2;if(d2<bd){bd=d2;a.tx=b.x;a.ty=b.y}}}// nothing near: head for the closest prey anywhere
    if(bd<1e9){a.ttl=bd>3600?15:6;a.dir=Math.atan2(a.ty-a.y,a.tx-a.x);return 'track'}}
    return 'wander'}
  const d=Math.hypot(prey.x-a.x,prey.y-a.y);a.dir=Math.atan2(prey.y-a.y,prey.x-a.x);a.prey=prey.id;a.sprint=d<6;
  if(isPack(a.sp)&&rnd()<0.5)nearSp([a.sp],a.x,a.y,12,b=>{if(b!==a&&!b.hidden&&b.state!=='sleep'&&b.age>SP[b.sp].mature*0.6&&b.e<0.95){b.packRef=prey;b.packT=3}});// call the pack
  if(d<0.9+SP[a.sp].len/12*g.size+s.spd*g.speed*dt*0.9){if(a.hc>0)return 'hunt';
    const ps=SP[prey.sp].spd*prey.genes.speed*(prey.age<SP[prey.sp].mature?0.7:1),hs=s.spd*g.speed;
    let p=clamp(0.6+0.6*(hs-ps)/ps+0.15*(g.size-prey.genes.size)+(prey.sick?0.25:0)-(SP[prey.sp].herd&&prey.state!=='flee'?0.05:0),0.08,0.92);
    if(prey.state!=='flee')p=Math.min(0.95,p+0.2);
    p*=1-0.3*camoOf(prey);
    if(s.tp==='human')p=Math.max(p,0.55);// spears and teamwork
    let mates=0;if(isPack(a.sp))nearSp([a.sp],prey.x,prey.y,3.5,b=>{if(b!==a&&(b.state==='hunt'||b.state==='pack'))mates++});if(mates){p=Math.min(0.97,p+0.13*Math.min(3,mates));a.packKill=mates}else a.packKill=0;
    {const pi=idx(prey.x,prey.y);if(SP[prey.sp].mass<0.5&&pi>=0&&veg[pi]>0.6)p*=0.7;if((SPN[prey.sp]||0)<20)p*=0.5}// small prey hide in thick grass
    if(rnd()<p){kill(prey,'eaten');a.kills++;a.ky=(a.ky||0)+1;S.kills++;chEv('kill',{pred:a.sp,prey:prey.sp,pack:a.packKill||0});if(prey.carc)eatCarcass(a,prey.carc,1e9);else a.e=Math.min(1,a.e+SP[prey.sp].mass/s.mass*1.3);a.hc=0.5;return 'eat'}
    a.hc=0.6;prey.dir=Math.atan2(prey.y-a.y,prey.x-a.x);if(strength(prey)>strength(a)*0.55&&rnd()<0.45){fight(prey,a,'defend');return 'fight'}return 'hunt'}
  return 'hunt'}
// bears only take young deer; land and air hunters only catch fish near the shore
// eat from a carcass: up to `limit` of its meat, and no more than it takes to be full
function eatCarcass(a,c,limit){const s=SP[a.sp],per=1.3/s.mass*(s.tp==='human'?1.35:1),take=Math.min(c.meat,limit,Math.max(0,(1-a.e)/per));c.meat-=take;a.e=Math.min(1,a.e+take*per);if(c.meat<=0.01&&!c.done){c.done=1;chEv('scavenged',{sp:a.sp})}}
const PACKS=new Set(['wolf','lion','x_hyena','x_african_wild_dog','x_dingo','x_human_hunter','x_orca','x_killer_whale','x_velociraptor','x_gray_wolf','x_arctic_wolf','x_dire_wolf','x_dolphin','x_jackal','x_coyote']);
const isPack=sp=>PACKS.has(sp);
/* ---------- fights: any animal can fight any other ---------- */
// strength: body mass, size gene, age, energy and injuries; people have weapons
function strength(a){const s=SP[a.sp],g=a.genes;let st=s.mass*Math.pow(g.size,1.5)*(a.age<s.mature?0.4+0.6*a.age/s.mature:a.age>a.life*0.85?0.7:1)*(0.45+0.55*a.e)*(a.hurt>0?0.6:1)*(a.sick>0?0.7:1);
  if(s.tp==='human')st*=3;if(s.diet==='carn')st*=1.3;return st}
// a fight: the stronger usually wins; the loser is hurt or killed; both are tired afterwards
function fight(a,b,why){if(a.dead||b.dead||a===b)return null;const sa=Math.pow(strength(a),1.3),sb=Math.pow(strength(b),1.3),pa=sa/(sa+sb),aw=rnd()<pa,W=aw?a:b,L=aw?b:a,r=Math.max(strength(W),0.001)/Math.max(strength(L),0.001);
  W.e=Math.max(0.05,W.e-0.06);W.fat=(W.fat||0)+0.25;W.wins=(W.wins||0)+1;L.losses=(L.losses||0)+1;if(r<1.6&&rnd()<0.4)W.hurt=Math.max(W.hurt||0,rr(3,8));
  const killP=clamp((r-0.8)*0.35,0.04,0.85)*(why==='rival'?0.2:1);// rivals mostly fight until one backs offif(rnd()<killP){kill(L,'killed in a fight');if(SP[W.sp].diet!=='herb'&&L.carc)eatCarcass(W,L.carc,1e9)}else{L.hurt=Math.max(L.hurt||0,rr(8,25));L.e=Math.max(0.05,L.e-0.2);L.dir=Math.atan2(L.y-W.y,L.x-W.x);L.fleeT=2}
  S.fights=(S.fights||0)+1;const FW=S.fw||(S.fw={});FW[why]=(FW[why]||0)+1;chEv('fight',{a:a.sp,b:b.sp,win:W.sp,lose:L.sp,why,killed:L.dead?1:0});
  if(S.parts.length<1400)S.parts.push({x:(a.x+b.x)/2,y:(a.y+b.y)/2-0.5,vx:0,vy:-0.6,life:1.2,max:1.2,k:'fight'});return W}
function canCatch(a,b){if(b===a||b.hidden)return false;const A=SP[a.sp],B=SP[b.sp];if(a.sp==='bear'&&b.sp==='deer'&&b.age>SP.deer.mature)return false;if(B.hab==='water'&&A.hab==='land'&&!a.boat){const j=idx(b.x,b.y);if(j<0||dwLand(j)>2)return false}return true}
function mate(a,s,sense){if(a.sex==='m'){let f=null,fd=1e9;nearSp([a.sp],a.x,a.y,sense,(b,d2)=>{if(b.sex==='f'&&!b.preg&&b.age>s.mature&&b.cd<=0&&b.e>s.repE&&d2<fd){fd=d2;f=b}});
    if(!f&&((a.id+(S.t|0))%4)===0)nearSp([a.sp],a.x,a.y,45,(b,d2)=>{if(b.sex==='f'&&b.age>s.mature&&d2<fd){fd=d2;f=b}});if(!f)return 'wander';a.dir=Math.atan2(f.y-a.y,f.x-a.x);if(fd>sense*sense)return 'mate';
    if(fd<9&&rnd()<0.04){let rv=null;nearSp([a.sp],f.x,f.y,2.5,b=>{if(!rv&&b!==a&&b.sex==='m'&&b.age>s.mature&&!b.dead)rv=b});if(rv){const w=fight(a,rv,'rival');if(w!==a)return 'fight'}}if(fd<2.2){f.preg=s.gest*rr(.9,1.1);if(s.tp==='human'){if(f.home&&!f.home.gone&&f.home.hk==='hut')a.home=f.home;else if(a.home&&!a.home.gone)f.home=a.home;if(a.fam&&!f.fam)f.fam=a.fam;f.mate=a.id;a.mate=f.id}if(S.parts.length<1400)S.parts.push({x:(a.x+f.x)/2,y:(a.y+f.y)/2-0.4,vx:0,vy:-0.7,life:1.3,max:1.3,k:'heart'});f.pg=a.genes;f.pgen=a.gen;f.pdad=a.id;a.cd=s.gest*0.2+5;f.cd=s.gest+10+(s.tp==='human'?rr(300,900):0);/* people wait a while between babies */chEv('mate',{sp:a.sp})}return 'mate'}
  let m=null,md=1e9;nearSp([a.sp],a.x,a.y,sense,(b,d2)=>{if(b.sex==='m'&&b.age>s.mature&&b.cd<=0&&d2<md){md=d2;m=b}});if(!m)return 'wander';a.dir=Math.atan2(m.y-a.y,m.x-a.x);return 'mate'}
function giveBirth(a){const s=SP[a.sp],fg=(a.genes.fert??1);const n=Math.max(1,ri(s.litter[0],s.litter[1])+(fg>1.15&&rnd()<fg-1?1:0)-(fg<0.85&&rnd()<1-fg?1:0));let born=0;
  const atHome=a.home&&!a.home.gone&&Math.hypot(a.home.x-a.x,a.home.y-a.y)<2;if(atHome)a.home.kids+=n;
  if(S.parts.length<1400)S.parts.push({x:a.x,y:a.y-0.5,vx:0,vy:-0.8,life:1.4,max:1.4,k:'birth'});
  for(let k=0;k<n;k++){const g=mixGenes(a.genes,a.pg||a.genes);const dadG=a.pg||a.genes,pick=G=>{const o={};for(const [k] of GENES)o[k]=G[k];o.fur=G.fur;o.heat=G.heat;o.coat=G.coat;return o};const b=addAnimal(a.sp,a.x+gauss()*.6,a.y+gauss()*.6,{genes:g,age:0,e:.8,gen:Math.max(a.gen,a.pgen||1)+1,mom:a.id,dad:a.pdad||0,par:{m:pick(a.genes),f:pick(dadG),mn:nameOfId(a.id),fn:a.pdad?nameOfId(a.pdad):null}});if(!b)break;if(s.hab!=='water')b.momRef=a;if(a.fam)b.fam=a.fam;if(atHome){b.home=a.home;b.bornHome=a.home;b.e=0.92}
    if(!habitatOK(b.sp,idx(b.x,b.y))){b.x=a.x;b.y=a.y}born++;S.born++;const BB=S.births||(S.births={});BB[a.sp]=(BB[a.sp]||0)+1;chEv('birth',{sp:a.sp,gen:b.gen})}
  a.kids+=born;const dad=a.pdad&&S.animals.find(z=>z.id===a.pdad);if(dad)dad.kids+=born;a.e=Math.max(.3,a.e-0.04*born);a.pg=null}

/* ---------- trees ---------- */
function addTree(k,x0,y0,o={}){const x=wrapX(x0),y=wrapY(y0);if(S.trees.length>=MAXT)return null;const t={id:S.nextId++,k,x,y,age:o.age??rr(800,9000),size:o.size??rr(.5,1),hp:1,fruit:rr(0,.6),life:TK[k].life*rr(.7,1.2),rot:rnd()*TAU};S.trees.push(t);return t}
function treeOK(k,i){if(i<0||isWater(i))return false;const t=TK[k],T=meanT(i),R=wetAt(i);return T>=t.tmin-2&&T<=t.tmax+2&&R>=t.rmin*0.8&&R<=t.rmax&&elevKm(i)<3.2}
function stepTrees(dt){let crowd;
  for(const t of S.trees){if(t.dead)continue;const i=idx(t.x,t.y),k=TK[t.k];t.age+=dt;
    if(i<0||isWater(i)){t.dead=true;t.cause='flooded';continue}
    const T=meanT(i),R=wetAt(i);const bad=Math.max(0,k.tmin-T)+Math.max(0,T-k.tmax)+Math.max(0,(k.rmin-R)*20)+Math.max(0,(R-k.rmax)*20);
    if(bad>1)t.hp-=bad*0.0025*dt;else t.hp=Math.min(1,t.hp+0.01*dt);
    if(t.hp<=0||t.age>t.life){t.dead=true;t.cause=t.hp<=0?'climate':'old age';continue}
    t.size=Math.min(1,t.size+0.0006*dt*(bad>1?0.2:1));
    if(k.fruit){const sf=cellT(i)>6?1:0;t.fruit=Math.min(1,t.fruit+0.012*dt*sf*(1-CL.dust/15))}
    if(t.size>0.55&&bad<1&&rnd()<0.003*dt){const ang=rnd()*TAU,r=rr(1.2,5),x=t.x+Math.cos(ang)*r,y=t.y+Math.sin(ang)*r,j=idx(x,y);
      if(treeOK(t.k,j)){let n=0;nearTrees(x,y,1.6,()=>n++);if(n===0){addTree(t.k,x,y,{age:0,size:0.06});S.saplings=(S.saplings||0)+1;chEv('sapling',{k:t.k})}}}}}

/* ---------- fire, meteors, events ---------- */
function ignite(i){if(i<0||isWater(i)||burn[i]>0)return false;burn[i]=rr(1.5,3);S.burning.add(i);return true}
function stepFire(dt){if(!S.burning.size)return;const done=[];
  for(const i of S.burning){burn[i]-=dt;veg[i]=Math.max(0,veg[i]-0.8*dt);scar[i]=1;
    if(rnd()<0.6)S.parts.push({x:i%GW+rnd(),y:((i/GW)|0)+rnd(),vx:gauss()*.3,vy:-rr(.6,1.6),life:rr(1,2.5),max:2.5,k:'smoke'});
    const x=i%GW,dry=clamp(1.25-rainAt(i)*0.8,0.1,1.2);
    for(const j of [x>0?i-1:-1,x<GW-1?i+1:-1,i-GW,i+GW]){if(j<0||j>=N||burn[j]>0||isWater(j))continue;let fuel=veg[j];nearTrees(j%GW+.5,((j/GW)|0)+.5,1,()=>fuel+=0.6);if(rnd()<fuel*dry*0.9*dt)ignite(j)}
    nearTrees(x+.5,((i/GW)|0)+.5,1.2,t=>{if(!t.dead&&rnd()<0.7*dt){t.dead=true;t.cause='fire'}});
    if(burn[i]<=0){burn[i]=0;done.push(i)}}
  for(const i of done)S.burning.delete(i)}
function meteor(x,y,R=10){chEv('meteor',{});for(let yy=-R*1.6;yy<=R*1.6;yy++)for(let xx=-R*1.6;xx<=R*1.6;xx++){const i=idx(x+xx,y+yy);if(i<0)continue;const d=Math.hypot(xx,yy)/R;
    if(d<1){hgt[i]=Math.max(0.02,hgt[i]-0.14*(1-d*d));veg[i]=0;scar[i]=1}else if(d<1.25){hgt[i]=Math.min(1,hgt[i]+0.03*(1.25-d)*4);veg[i]=0;scar[i]=1}else if(d<1.6&&rnd()<0.5)ignite(i)}
  for(const a of S.animals)if(Math.hypot(a.x-x,a.y-y)<R*1.3)kill(a,'meteor');for(const t of S.trees)if(Math.hypot(t.x-x,t.y-y)<R*1.3){t.dead=true;t.cause='meteor'}
  CL.dust=Math.min(14,CL.dust+6);for(let k=0;k<80;k++){const ang=rnd()*TAU,v=rr(2,9);S.parts.push({x,y,vx:Math.cos(ang)*v,vy:Math.sin(ang)*v,life:rr(.6,1.4),max:1.4,k:'spark'})}
  S.flash={x,y,t:1};terrainChanged()}
function plague(sp){const L=S.animals.filter(a=>!a.dead&&(!sp||a.sp===sp)&&!(a.immT>0));if(!L.length)return 0;let n=0;for(const a of L)if(rnd()<0.25){a.sick=rr(15,35);n++}return n}

/* ---------- homes: burrows, nests, dens, lodges, huts, hives and anthills ---------- */
const HOMEK={burrow:{n:'Burrow',ic:'🕳️',days:3,safe:1},nest:{n:'Nest',ic:'🪺',days:4},den:{n:'Den',ic:'🪨',days:4,safe:1},lodge:{n:'Lodge',ic:'🪵',days:12,safe:1},hut:{n:'Hut',ic:'🛖',days:10,safe:1},hive:{n:'Hive',ic:'🍯',days:6,safe:1},anthill:{n:'Anthill',ic:'⛰️',days:8,safe:1}};
const MAXH=2400;
function homeKind(sp){const s=SP[sp];if(s.homeK!==undefined)return s.homeK;let k=null;
  if(sp==='x_human_hunter')k='hut';else if(/^x_(bee|wasp)$/.test(sp))k='hive';else if(sp==='x_ant')k='anthill';else if(/^x_(beaver|muskrat)$/.test(sp))k='lodge';else if(sp==='otter'||/otter$/.test(sp))k='den';else if(/penguin|puffin/.test(sp))k='nest';
  else switch(s.tp){case 'rod':case 'snake':case 'rept':k='burrow';break;case 'bird':case 'rapt':case 'sbird':case 'gbird':k='nest';break;case 'scarn':case 'bcarn':case 'omni':k='den';break}
  s.homeK=k;return k}
const HB=6,HBW=Math.ceil(GW/HB);let hbuckets=new Map();
function hKey(x,y){return ((y/HB)|0)*HBW+((x/HB)|0)}
function addHomeBucket(h){const k=hKey(h.x,h.y);let L=hbuckets.get(k);if(!L)hbuckets.set(k,L=[]);L.push(h)}
function rebuildHomes(){hbuckets=new Map();for(const h of S.homes)if(!h.gone)addHomeBucket(h)}
function homeNear(x,y,r){const x0=Math.max(0,((x-r)/HB)|0),x1=((x+r)/HB)|0,y0=Math.max(0,((y-r)/HB)|0),y1=((y+r)/HB)|0;for(let by=y0;by<=y1;by++)for(let bx=x0;bx<=x1;bx++){const L=hbuckets.get(by*HBW+bx);if(L)for(const h of L)if(!h.gone&&(h.x-x)**2+(h.y-y)**2<r*r)return h}return null}
const VNAMES=['Ashford','Brook','Cedar Hollow','Dunmore','Elkridge','Fernvale','Greystone','Hearth','Ironwood','Juniper','Kestrel','Longmeadow','Mossbank','Northwatch','Oakhill','Pinecrest','Quarry','Riverbend','Stonefire','Thornwick','Umber','Valewood','Willowmere','Yarrow',
 'Alderbrook','Amberfield','Applecross','Ashgrove','Badgerwood','Barrowmere','Beckford','Birchwick','Blackwater','Bramblecote','Brightwell','Broadmoor','Burnside','Caldwell','Clearwater','Cloverdale','Copperhill','Crowfoot','Deepdale','Deerhurst','Dewford','Eastmarch','Edgewood','Elmstead',
 'Embercrest','Fairhaven','Falconrest','Fallowmead','Firwood','Foxholm','Frostmoor','Glenmarsh','Goldcrest','Greenhollow','Hallowell','Hartfield','Hawkridge','Hazelmere','Heathwick','Highcliff','Hollybank','Honeywell','Kingsbridge','Larkspur','Littlemoor','Lowford','Maplewood','Marshby',
 'Meadowsweet','Millbrook','Mistvale','Northbrook','Oakmere','Otterburn','Pebbleford','Quietwater','Ravenscar','Redfern','Rowanhurst','Rushmere','Saltmarsh','Silverbirch','Southfold','Springwell','Stagsden','Stillwater','Sunnyhill','Swanmere','Tallpines','Thistledown','Wildmoor','Windmere','Wolfden','Wrenfield'];
const SURN=['Miller','Ashworth','Brook','Carver','Dunn','Fletcher','Gale','Harrow','Ivers','Jory','Kemp','Lark','Marsh','Noble','Oakes','Pike','Reed','Stone','Thorn','Vale','Wells','Yates','Birch','Cole','Flint','Hale','Moss','Rook','Shaw','Tanner','Archer','Baker','Cooper','Fisher','Hunter','Mason','Potter','Sawyer','Smith','Weaver','Bowman','Forester','Holt','Ford','Heath','Wood','Hill','Field','Lake','Rivers'];
const HFIRST=['Ada','Bram','Cora','Dain','Elin','Finn','Gwen','Hal','Isla','Jon','Kara','Lev','Mira','Nils','Oona','Per','Runa','Sten','Tova','Ulf','Vera','Wyn','Yara','Arlo','Bea','Cass','Dag','Esme','Fen','Ida','Alma','Bjorn','Cleo','Edda','Gus','Hilde','Ivo','Juno','Knut','Liv','Mads','Nora','Otto','Pia','Rolf','Saga','Tor','Ulla','Viggo','Wren'];
// distance to the nearest village campfire (squared), or Infinity
function fireDist2(x,y){let b=Infinity;for(const v of S.villages){const d=(v.x-x)**2+(v.y-y)**2;if(d<b)b=d}return b}
function villageFor(a){let best=null,bd=30*30;for(const v of S.villages){const d=(v.x-a.x)**2+(v.y-a.y)**2;if(d<bd){bd=d;best=v}}return best}
function hutSpot(v){const R=1.8+Math.sqrt(v.huts+1)*1.1;for(let t=0;t<24;t++){const ang=rnd()*TAU,r=rr(1.6,R),x=v.x+Math.cos(ang)*r,y=v.y+Math.sin(ang)*r,i=idx(x,y);if(i>=0&&!isWater(i)&&!homeNear(x,y,1.7))return[x,y]}return null}
function buildHome(a,done){const k=homeKind(a.sp);if(!k||S.homes.length>=MAXH)return null;let x=a.x,y=a.y,vil=null;
  if(k==='hut'){let v=villageFor(a);const p=v&&hutSpot(v);if(p){[x,y]=p;vil=v}else if(!homeNear(a.x,a.y,6)){vil={isVil:1,id:S.nextId++,x:a.x,y:a.y,name:(()=>{const used=new Set(S.villages.map(v=>v.name));const free=VNAMES.filter(n=>!used.has(n));return free.length?free[Math.floor(rnd()*free.length)]:VNAMES[Math.floor(rnd()*VNAMES.length)]+' '+(2+S.villages.length)})(),huts:0,born:S.t};S.villages.push(vil);chEv('village',{});if(typeof toast==='function'&&!CH.loading&&!S.quietBuild)toast(`🛖 Human hunters founded the village of ${vil.name}`)}else return null}
  if(k==='nest'){let tr=null;nearTrees(x,y,3,t=>{if(!tr&&t.k!=='cactus')tr=t});if(tr){x=tr.x+rr(-.3,.3);y=tr.y+rr(-.3,.3)}}
  const i=idx(x,y);if(i<0||isWater(i)||(k==='lodge'&&dw[i]>2)||homeNear(x,y,k==='hut'?2:1.2))return null;
  const h={id:S.nextId++,hk:k,x,y,owner:a.id,oname:a.sp,prog:done?1:0,born:S.t,last:S.t,kids:0,vil:vil?vil.id:0};if(vil)vil.huts++;if(k==='hut'){if(!a.fam)a.fam=SURN[Math.floor(rnd()*SURN.length)];h.fam=a.fam}S.homes.push(h);addHomeBucket(h);a.home=h;chEv('home',{k,sp:a.sp});return h}
// carcasses are kept in a coarse grid so hunters only look at the ones nearby
const CB=8,CBW=Math.ceil(GW/CB);let cbuckets=new Map();
function rebuildCarc(){cbuckets=new Map();for(const c of S.carcasses){const k=((c.y/CB)|0)*CBW+((c.x/CB)|0);let L=cbuckets.get(k);if(!L)cbuckets.set(k,L=[]);L.push(c)}}
function carcNear(x,y,r){const out=[],x0=Math.max(0,((x-r)/CB)|0),x1=((x+r)/CB)|0,y0=Math.max(0,((y-r)/CB)|0),y1=((y+r)/CB)|0;for(let by=y0;by<=y1;by++)for(let bx=x0;bx<=x1;bx++){const L=cbuckets.get(by*CBW+bx);if(L)for(const c of L)out.push(c)}return out}
function stepCarcasses(dt){for(const c of S.carcasses){const i=idx(c.x,c.y),mm=i>=0?mic[i]:0.3,loss=Math.min(c.meat,c.m0*0.025*dt*(0.4+1.8*mm));c.meat-=loss;
    if(i>=0){const f=loss*0.8;for(const j of [i,idx(c.x+1,c.y),idx(c.x-1,c.y),idx(c.x,c.y+1),idx(c.x,c.y-1)])if(j>=0&&!isWater(j)){fert[j]=Math.min(3,fert[j]+f/5);mic[j]=Math.min(1,mic[j]+loss*0.3)}}
    if(c.meat<=0.01&&!c.done){c.done=1;S.decomposed=(S.decomposed||0)+1;chEv('decomposed',{})}}
  S.carcasses=S.carcasses.filter(c=>c.meat>0.01&&S.t-c.t<60)}
function stepCampfires(dt){for(const v of S.villages){const i=idx(v.x,v.y);if(i>=0&&rainAt(i)<0.45&&rnd()<0.0006*dt*(0.45-rainAt(i))/0.45*10){const ang=rnd()*TAU,j=idx(v.x+Math.cos(ang)*(4+Math.sqrt(v.huts)*1.3),v.y+Math.sin(ang)*(4+Math.sqrt(v.huts)*1.3));if(j>=0&&veg[j]>0.3&&ignite(j)){chEv('fire',{});if(typeof toast==='function'&&!CH.loading)toast(`🔥 A spark from ${v.name}'s campfire started a wildfire`)}}}}
function stepHomes(dt){stepCampfires(dt);for(const h of S.homes){if(h.gone)continue;const i=idx(h.x,h.y);
  if(i<0||(isWater(i)&&h.hk!=='lodge')){h.gone='flooded'}else if(burn[i]>0&&h.hk!=='burrow'){h.gone='burned'}else if(S.t-h.last>300){h.gone='abandoned'}}
  if(S.homes.some(h=>h.gone)){for(const h of S.homes)if(h.gone&&h.vil){const v=S.villages.find(v=>v.id===h.vil);if(v)v.huts--}S.homes=S.homes.filter(h=>!h.gone);rebuildHomes();S.villages=S.villages.filter(v=>v.huts>0)}}

/* ---------- day and night ---------- */
const NOCT=new Set(['x_owl','x_snowy_owl','x_bat','x_hedgehog','x_raccoon','x_opossum','x_moth','x_badger','x_skunk','x_aardvark','x_tasmanian_devil','x_kiwi','fox','x_red_fox','x_fennec_fox','x_lynx','x_bobcat','x_leopard','x_hyena','x_scorpion','x_tarantula','x_gecko','x_frog','x_toad']);
const hourOf=()=>((S.t%1)+1)%1*24;
const isNight=()=>{const h=hourOf();return h<6||h>=19};
const restTime=a=>NOCT.has(a.sp)?!isNight():isNight();
/* ---------- weather: rain clouds drift with the wind, water the land and fill puddles ---------- */
function stepWeather(dt){const W=S.wind||(S.wind={a:rnd()*TAU,v:6});W.a+=gauss()*0.15*dt;
  const target=Math.round(N/9000*CL.rain*(0.75+0.35*Math.sin(TAU*(S.t%365)/365*2)));
  let tries=0;while(S.clouds.length<target&&tries++<8&&rnd()<Math.min(1,3*dt)){const p=randomCell(i=>rnd()<moist[i]*0.9+0.05,40);if(!p)break;S.clouds.push({x:p[0],y:p[1],r:rr(7,20),life:rr(2,7),age:0,int:rr(0.4,1),id:S.nextId++})}
  for(const c of S.clouds){c.age+=dt;c.x+=Math.cos(W.a)*W.v*dt;c.y+=Math.sin(W.a)*W.v*dt*0.6;
    const R=c.r,f=Math.min(1,c.age,Math.max(0,c.life-c.age))*c.int*0.06*dt;
    if(f>0){const R2=R*R;for(let yy=-R;yy<=R;yy++)for(let xx=-R;xx<=R;xx++){const d2=xx*xx+yy*yy;if(d2>R2)continue;const j=idx(c.x+xx,c.y+yy);if(j<0||isWater(j))continue;wet[j]=Math.min(1.3,wet[j]+f*(1.6-d2/R2))}}// soft, round patches of rain
    // a strong storm over dry ground can start a fire with lightning
    if(c.int>0.92&&rnd()<0.004*dt){const j=idx(c.x+gauss()*R*0.4,c.y+gauss()*R*0.4);if(j>=0&&rainAt(j)<0.5&&veg[j]>0.4&&ignite(j)){S.flashL={x:c.x,y:c.y,t:1};chEv('fire',{})}}}
  for(const c of S.clouds){c.x=wrapX(c.x);c.y=wrapY(c.y)}S.clouds=S.clouds.filter(c=>c.age<c.life)}
function underCloud(x,y){for(const c of S.clouds){if((c.x-x)**2+(c.y-y)**2<c.r*c.r&&c.age>0.3&&c.age<c.life-0.3)return c}return null}

/* ---------- one simulation step ---------- */
function simStep(dt){S.t+=dt;S.wxAcc=(S.wxAcc||0)+dt;if(S.wxAcc>=0.25){stepWeather(S.wxAcc);S.wxAcc=0}if(S.carcasses.length)rebuildCarc();SEASON=seasonF();if(CL.dust>0)CL.dust=Math.max(0,CL.dust-CL.dust*dt/420-0.0005*dt);
  rebuildHash();const L=S.animals;for(let k=0;k<L.length;k++){const a=L[k];if(!a.dead)stepAnimal(a,dt)}
  stepFire(dt);
  S.treeAcc=(S.treeAcc||0)+dt;if(S.treeAcc>=2){rebuildTrees();stepTrees(S.treeAcc);stepHomes(S.treeAcc);stepCarcasses(S.treeAcc);S.treeAcc=0;S.trees=S.trees.filter(t=>!t.dead)}
  if(S.animals.some(a=>a.dead))S.animals=S.animals.filter(a=>!a.dead);
  if(S.t-S.lastHist>=5){S.lastHist=S.t;sampleHist()}}
function counts(){const c={};for(const k of SPK)c[k]=0;for(const a of S.animals)if(!a.dead)c[a.sp]++;return c}
function sampleHist(){const c=counts();c.trees=S.trees.length;c.t=S.t;let v=0,n=0;for(let i=0;i<N;i+=7)if(!isWater(i)){v+=veg[i];n++}c.veg=n?v/n:0;S.hist.push(c);if(S.hist.length>720)S.hist=S.hist.filter((_,k)=>k%2===0)}
function vegCover(){let v=0,n=0;for(let i=0;i<N;i+=3)if(!isWater(i)){n++;if(veg[i]>0.25)v++}return n?v/n:0}
function avgGene(sp,k){let s=0,n=0;for(const a of S.animals)if(!a.dead&&a.sp===sp){s+=a.genes[k];n++}return n?s/n:NaN}
function speciesAlive(){return SPK.filter(k=>S.animals.some(a=>!a.dead&&a.sp===k))}
