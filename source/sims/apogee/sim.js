/* ================= Apogee: build rockets and fly them to orbit and the Moon ================= */
// Units are metres, seconds, tonnes and kilonewtons (so kN / t = m/s²). Terra sits in the middle of a 32,000 km world.
const WS=3.2e11,C0=0,G0=9.80665;
// The solar system: Aster (a star) in the middle, planets around it, moons around planets. Every name here is our own.
// [id, name, parent, radius m, surface gravity m/s², orbit radius m, start angle, air height m, sea-level air density, air scale height m, day length s (0 = always faces its parent), science ×, kind]
const BODIES=[
 ['terra','Terra',2,640000,9.81,1.36e10,0.0,60000,1.2,6000,21600,1,'terra'],
 ['luna','Luna',0,200000,1.62,4e6,2.2,0,0,1,0,4,'moon'],
 ['aster','Aster',-1,2.6e8,0,0,0,0,0,1,400000,1,'star'],
 ['cinder','Cinder',2,250000,2.4,5.5e9,1.0,0,0,1,420000,7,'cinder'],
 ['veil','Veil',2,700000,15.5,9.6e9,4.0,90000,5,7000,80000,5,'veil'],
 ['rust','Rust',2,330000,3.6,2.05e10,2.6,40000,0.08,5000,25000,5,'rust'],
 ['dot','Dot',5,25000,0.15,3.0e6,1.3,0,0,1,0,6,'rock'],
 ['goliath','Goliath',2,6.0e6,8.5,6.8e10,0.6,220000,15,30000,36000,6,'gas'],
 ['frost','Frost',7,450000,1.3,2.8e7,0.4,0,0,1,0,8,'frost'],
 ['ember','Ember',7,300000,2.0,6.5e7,3.3,0,0,1,0,8,'ember'],
 ['rime','Rime',2,180000,0.9,1.0e11,3.5,0,0,1,50000,10,'rime'],
].map(([id,nm,parent,R,g,orbit,m0,atm,rho0,H,day,sci,kind])=>({id,nm,parent,R,mu:(id==='aster'?1.2e18:g*R*R),orbit,m0,atm,rho0,H,day,sci,kind}));
BODIES.forEach(B=>{if(B.parent>=0){const P=BODIES[B.parent];B.period=2*Math.PI*Math.sqrt(B.orbit**3/P.mu);B.soi=B.orbit*Math.pow(B.mu/P.mu,0.4)}else{B.period=Infinity;B.soi=Infinity}B.rot=B.day?2*Math.PI/B.day:(B.parent>=0?2*Math.PI/B.period:0)});
const KIDS=BODIES.map((_,i)=>BODIES.map((B,j)=>B.parent===i?j:-1).filter(j=>j>=0));const SUN=2;
const PT={
 pod1:{nm:'Capsule, 1 seat',k:'pod',m:0.84,h:2.1,w:2.4,crew:1,trq:14},
 pod3:{nm:'Capsule, 3 seats',k:'pod',m:2.4,h:3,w:3.6,crew:3,trq:28},
 chute:{nm:'Parachute',k:'chute',m:0.1,h:0.6,w:1.3},
 cone:{nm:'Nose cone',k:'cone',m:0.08,h:1.6,w:2.4},
 shield:{nm:'Heat shield',k:'shield',m:0.3,h:0.35,w:2.6},
 dec:{nm:'Decoupler',k:'dec',m:0.05,h:0.4,w:2.4},
 tankS:{nm:'Small tank',k:'tank',m:0.25,fuel:1.75,h:1.9,w:2.4},
 tankM:{nm:'Medium tank',k:'tank',m:0.5,fuel:4,h:3.8,w:2.4},
 tankL:{nm:'Large tank',k:'tank',m:1.1,fuel:9,h:6.5,w:3.6},
 spark:{nm:'Spark engine (best in space)',k:'eng',m:0.4,thr:60,isp:[240,335],h:1.3,w:1.8},
 lifter:{nm:'Lifter engine',k:'eng',m:1.3,thr:230,isp:[285,310],h:2,w:2.4},
 thunder:{nm:'Thunder engine (huge)',k:'eng',m:4,thr:1150,isp:[290,305],h:2.6,w:3.6},
 srb:{nm:'Solid booster',k:'srb',m:1.2,fuel:6.3,thr:270,isp:[205,225],h:7,w:2.2},
 fins:{nm:'Fins',k:'fins',m:0.1,h:0,w:0},
 legs:{nm:'Landing legs',k:'legs',m:0.25,h:0,w:0},
};
const PRESETS={
 hopper:{nm:'Hopper (up and down)',parts:['chute','pod1','tankS','spark']},
 orbiter:{nm:'Orbiter (reaches orbit)',parts:['chute','pod1','shield','dec','tankM','spark','dec','tankL','lifter','fins']},
 lunar:{nm:'Moon lander (there and back)',parts:['chute','pod1','shield','dec','tankM','tankM','spark','legs','dec','tankL','tankL','lifter','dec','tankL','tankL','tankL','tankL','thunder','fins']},
 heavy:{nm:'Big crew (3 seats)',parts:['chute','pod3','shield','dec','tankM','tankM','spark','dec','tankL','tankL','tankL','thunder','fins']},
};
const OMEGA=2*Math.PI/21600,PAD_A0=-Math.PI/2;// Terra's spin and where the launch pad starts
let PREDV=0,PREDREF=[0,0];
const padAngle=t=>PAD_A0+OMEGA*t;
function airVel(b,dx,dy){const w=BODIES[b].rot||0;return[-w*dy,w*dx]}
function soundSpeed(alt){const T=alt<11000?288-6.5*alt/1000:alt<20000?216.6:alt<47000?216.6+(alt-20000)/27000*54:270-(alt-47000)/13000*70;return 20.05*Math.sqrt(Math.max(150,T))}
function machCd(M){return M<0.8?1:M<1.05?1+(M-0.8)/0.25*1.1:M<1.3?2.1-(M-1.05)/0.25*0.6:Math.max(1.05,1.5-(M-1.3)*0.25)}
let DESIGN=PRESETS.orbiter.parts.slice(),R=null,DEB=[],PRED=[],PINFO={},MODE='build',MISSION={};
const AP={mode:'',ph:''};
const G={throttleStep:0.1,autoChute:true,crashV:9,target:1};
let PARTS=[],HOVER=null,DRAG={keys:new Set(),idle:9,rot:0,thr:0},TB=[];
const sayT=(m,ms)=>{if($('home').hidden)toast(m,ms)};const ev=(k,n)=>{MISSION[k]=(MISSION[k]||0)+(n||1)},mv=k=>MISSION[k]||0;
/* ---------- every world moves on a circle around its parent ---------- */
function bodyPos(i,t){const B=BODIES[i];if(B.parent<0)return[0,0];const p=bodyPos(B.parent,t),a=B.m0+2*Math.PI*t/B.period;return[p[0]+B.orbit*Math.cos(a),p[1]+B.orbit*Math.sin(a)]}
function bodyVel(i,t){const B=BODIES[i];if(B.parent<0)return[0,0];const p=bodyVel(B.parent,t),a=B.m0+2*Math.PI*t/B.period,w=2*Math.PI/B.period*B.orbit;return[p[0]-Math.sin(a)*w,p[1]+Math.cos(a)*w]}
function bodyAcc(i,t){const B=BODIES[i];if(B.parent<0)return[0,0];const p=bodyAcc(B.parent,t),a=B.m0+2*Math.PI*t/B.period,w=2*Math.PI/B.period,k=w*w*B.orbit;return[p[0]-Math.cos(a)*k,p[1]-Math.sin(a)*k]}
// whose gravity are we in? Walk down from the star into any planet or moon whose pull (sphere of influence) we are inside
function domBody(x,y,t,z){let cur=SUN;for(let d=0;d<4;d++){let next=-1;for(const k of KIDS[cur]){const p=bodyPos(k,t);if(Math.hypot(x-p[0],y-p[1],z||0)<BODIES[k].soi){next=k;break}}if(next<0)break;cur=next}return cur}
const moonPos=t=>bodyPos(1,t),moonVel=t=>bodyVel(1,t);
/* ---------- exact orbits ("on rails"): where will something coasting around a world be after dt seconds? ---------- */
const stumpC=z=>z>1e-8?(1-Math.cos(Math.sqrt(z)))/z:z<-1e-8?(Math.cosh(Math.sqrt(-z))-1)/(-z):0.5;
const stumpS=z=>{if(z>1e-8){const s=Math.sqrt(z);return(s-Math.sin(s))/(s*s*s)}if(z<-1e-8){const s=Math.sqrt(-z);return(Math.sinh(s)-s)/(s*s*s)}return 1/6};
function kepler(mu,rx,ry,vx,vy,dt,rz,vz){rz=rz||0;vz=vz||0;const r0=Math.hypot(rx,ry,rz),v2=vx*vx+vy*vy+vz*vz,sm=Math.sqrt(mu),vr0=(rx*vx+ry*vy+rz*vz)/r0,alpha=2/r0-v2/mu;let chi=alpha>0?sm*alpha*dt:Math.sign(dt)*Math.sqrt(-1/alpha)*Math.log(Math.max(1e-9,(-2*mu*alpha*dt)/(vr0*r0+Math.sign(dt)*Math.sqrt(-mu/alpha)*(1-r0*alpha))));if(!isFinite(chi))chi=sm*dt/r0;
  for(let i=0;i<60;i++){const z=alpha*chi*chi,C=stumpC(z),Sz=stumpS(z),F=r0*vr0/sm*chi*chi*C+(1-alpha*r0)*chi*chi*chi*Sz+r0*chi-sm*dt,dF=r0*vr0/sm*chi*(1-z*Sz)+(1-alpha*r0)*chi*chi*C+r0,d=F/dF;chi-=d;if(Math.abs(d)<1e-9*Math.max(1,Math.abs(chi)))break}
  const z=alpha*chi*chi,C=stumpC(z),Sz=stumpS(z),f=1-chi*chi/r0*C,g=dt-chi*chi*chi/sm*Sz,nx=f*rx+g*vx,ny=f*ry+g*vy,nz=f*rz+g*vz,r=Math.hypot(nx,ny,nz),fd=sm/(r*r0)*(alpha*chi*chi*chi*Sz-chi),gd=1-chi*chi/r*C;return[nx,ny,fd*rx+gd*vx,fd*ry+gd*vy,nz,fd*rz+gd*vz]}
// move a coasting state forward by dt around whichever world holds it
// kepler with a safety net: the orbit's energy must not change; if it does, take two half steps instead
function keplerSafe(mu,rx,ry,vx,vy,dt,depth,rz,vz){rz=rz||0;vz=vz||0;const k=kepler(mu,rx,ry,vx,vy,dt,rz,vz);const e0=(vx*vx+vy*vy+vz*vz)/2-mu/Math.hypot(rx,ry,rz),e1=(k[2]*k[2]+k[3]*k[3]+k[5]*k[5])/2-mu/Math.hypot(k[0],k[1],k[4]);
  if(k.every(isFinite)&&Math.abs(e1-e0)<=2e-4*Math.abs(e0)+0.5)return k;if((depth||0)>=10)return null;const h=keplerSafe(mu,rx,ry,vx,vy,dt/2,(depth||0)+1,rz,vz);if(!h)return null;return keplerSafe(mu,h[0],h[1],h[2],h[3],dt/2,(depth||0)+1,h[4],h[5])}
function railStep(st,dt){const z=st.z||0,vz=st.vz||0,b=domBody(st.x,st.y,st.t,z),bp=bodyPos(b,st.t),bv=bodyVel(b,st.t);const k=keplerSafe(BODIES[b].mu,st.x-bp[0],st.y-bp[1],st.vx-bv[0],st.vy-bv[1],dt,0,z,vz);if(!k){const g=gravity(st.x,st.y,st.t,z);st.vx+=g[0]*dt;st.vy+=g[1]*dt;st.vz=vz+g[2]*dt;st.x+=st.vx*dt;st.y+=st.vy*dt;st.z=z+st.vz*dt;st.t+=dt;return b}const np=bodyPos(b,st.t+dt),nv=bodyVel(b,st.t+dt);st.x=np[0]+k[0];st.y=np[1]+k[1];st.vx=nv[0]+k[2];st.vy=nv[1]+k[3];st.z=k[4];st.vz=k[5];st.t+=dt;return b}
// a sensible step: small near the ground or near a moon's pull, big far out
function railDt(st,k){const z=st.z||0,vz=st.vz||0,b=domBody(st.x,st.y,st.t,z),bp=bodyPos(b,st.t),bv=bodyVel(b,st.t),r=Math.hypot(st.x-bp[0],st.y-bp[1],z),v=Math.hypot(st.vx-bv[0],st.vy-bv[1],vz)||1,alt=r-BODIES[b].R;let dt=r/v*(k||0.02);dt=Math.min(dt,Math.max(alt,2000)*0.25/v);
  for(const c of KIDS[b]){const cp=bodyPos(c,st.t),cv=bodyVel(c,st.t),ex=st.x-cp[0],ey=st.y-cp[1],dd=Math.hypot(ex,ey,z),rvx=st.vx-cv[0],rvy=st.vy-cv[1],close=-(ex*rvx+ey*rvy+z*vz)/dd,d=dd-BODIES[c].soi;if(close<=0&&d>BODIES[c].soi*0.5)continue;dt=Math.min(dt,Math.max(d,BODIES[c].soi*0.05)*0.3/Math.max(Math.abs(close),Math.hypot(rvx,rvy,vz)*0.3,1))}if(BODIES[b].parent>=0){const sp=BODIES[b].soi-r;dt=Math.min(dt,Math.max(sp,BODIES[b].soi*0.02)*0.3/v)}return clamp(dt,0.05,4e4)}
/* ---------- rocket bookkeeping ---------- */
function sections(parts){const S=[[]];parts.forEach((p,i)=>{if(PT[p].k==='dec'&&S[S.length-1].length)S.push([]);S[S.length-1].push(i)});return S}
function partMass(id,fuel){return PT[id].m+(fuel||0)}
function stats(parts,fuelArr){const sec=sections(parts),out=[];let above=0;const tot=[];for(let k=0;k<sec.length;k++){let m=0,f=0;for(const i of sec[k]){const fu=fuelArr?fuelArr[i]:(PT[parts[i]].fuel||0);m+=PT[parts[i]].m+fu}tot.push(m)}
  for(let k=sec.length-1;k>=0;k--){let mass=0;for(let j=0;j<=k;j++)mass+=tot[j];let thr=0,isp0=0,isp1=0,fuel=0,dry=0;for(const i of sec[k]){const P=PT[parts[i]],fu=fuelArr?fuelArr[i]:(P.fuel||0);if(P.k==='eng'||P.k==='srb'){thr+=P.thr;isp0+=P.thr/P.isp[0];isp1+=P.thr/P.isp[1]}if(P.k==='tank'||P.k==='srb')fuel+=fu}
    const ia=thr?thr/isp0:0,iv=thr?thr/isp1:0,mEnd=mass-fuel;const dvv=thr&&fuel>0?iv*G0*Math.log(mass/mEnd):0,dva=thr&&fuel>0?ia*G0*Math.log(mass/mEnd):0;out.push({k,mass,thr,twr:thr/(mass*9.81),dv:dvv,dvSea:dva,fuel,burn:thr?fuel/(thr/((iv||1)*G0)):0})}
  return out}// first entry = first stage to fire (the bottom one)
function rocketLen(parts){return parts.reduce((s,p)=>s+PT[p].h,0)}
function rocketW(parts){return Math.max(...parts.map(p=>PT[p].w||0),1)}
function crewNames(n){const A=['Ada','Yuri','Mae','Neil','Sally','Valentina','Chris','Kalpana','Rakesh','Ellen','Tim','Samantha','Jaxon','Mila','Kofi','Rin'],B=['Vega','Orion','Kepler','Lovell','Ride','Hadfield','Peake','Okafor','Ito','Novak','Reyes','Banerjee'];return Array.from({length:n},()=>pick(A)+' '+pick(B))}
function newRocket(parts,x,y,vx,vy,a){const crew=parts.reduce((s,p)=>s+(PT[p].crew||0),0);return{parts:parts.slice(),fuel:parts.map(p=>PT[p].fuel||0),x,y,vx,vy,a,z:0,vz:0,el:0,oe:0,om:0,thr:0,lit:false,chute:0,heat:0,dead:'',landed:-1,sas:'hold',sasA:a,crew:crewNames(crew),maxAlt:0,t0:S.t,staged:0}}
function rMass(r){let m=0;r.parts.forEach((p,i)=>m+=PT[p].m+r.fuel[i]);return m}
function bottomSec(r){const s=sections(r.parts);return s[s.length-1]}
function engines(r){return bottomSec(r).filter(i=>PT[r.parts[i]].k==='eng'||PT[r.parts[i]].k==='srb')}
function liquid(r){let f=0;for(const i of bottomSec(r))if(PT[r.parts[i]].k==='tank')f+=r.fuel[i];return f}
const has=(r,k)=>r.parts.some(p=>PT[p].k===k)||(r.side||[]).some(s=>PT[s.id]&&PT[s.id].k===k);
/* ---------- where am I? ---------- */
function rel(r,t){const z=r.z||0,b=domBody(r.x,r.y,t,z),bp=bodyPos(b,t),bv=bodyVel(b,t);return{b,dx:r.x-bp[0],dy:r.y-bp[1],dz:z,vx:r.vx-bv[0],vy:r.vy-bv[1],vz:r.vz||0}}
function orbitOf(r,t){const q=rel(r,t),B0=BODIES[q.b],rr=Math.hypot(q.dx,q.dy,q.dz),v2=q.vx*q.vx+q.vy*q.vy+q.vz*q.vz,mu=B0.mu,eps=v2/2-mu/rr,hx=q.dy*q.vz-q.dz*q.vy,hy=q.dz*q.vx-q.dx*q.vz,hz=q.dx*q.vy-q.dy*q.vx,hm=Math.hypot(hx,hy,hz),h=(hz<0?-1:1)*hm,inc=hm>1e-9?Math.acos(clamp(Math.abs(hz)/hm,0,1)):0,a=-mu/(2*eps);let e=Math.sqrt(Math.max(0,1+2*eps*h*h/(mu*mu)));
  const bound=eps<0,pe=(bound?a*(1-Math.min(e,1)):h*h/mu/(1+e))-B0.R,ap=bound?a*(1+Math.min(e,1))-B0.R:Infinity;e=bound?Math.min(e,0.99999):e;return{b:q.b,alt:rr-B0.R,r:rr,spd:Math.sqrt(v2),vr:(q.dx*q.vx+q.dy*q.vy+q.dz*q.vz)/rr,vh:Math.abs(h)/rr,ap,pe,e,a,h,inc,hv:[hx,hy,hz],period:e<1?2*Math.PI*Math.sqrt(a*a*a/mu):Infinity}}
function rho(b,alt){const B0=BODIES[b];return B0.atm&&alt<B0.atm?B0.rho0*Math.exp(-alt/B0.H):0}
/* ---------- physics ---------- */
// only the world you are near pulls on you (like most space games): add how that world itself is accelerating, so its orbit carries you along
function gravity(x,y,t,z){z=z||0;const b=domBody(x,y,t,z),p=bodyPos(b,t),dx=p[0]-x,dy=p[1]-y,d2=dx*dx+dy*dy+z*z,d=Math.sqrt(d2),g=BODIES[b].mu/d2,ba=bodyAcc(b,t);return[dx/d*g+ba[0],dy/d*g+ba[1],-z/d*g]}
// engines need a moment to spool up to full thrust (and die away when cut)
function spoolTick(r,dt){const want=r.lit&&r.thr>0&&liquid(r)>0?1:0;if(dt>0.5){r.spool=want;return}r.spool=r.spool==null?want:r.spool+(want-r.spool)*Math.min(1,dt*(want>r.spool?1.6:5))}
// wind: steady breeze plus gusts, strongest low down, gone where the air is thin
function windAt(b,alt,t){const B=BODIES[b];if(!B.atm||alt>B.atm*0.4)return[0,0,0];const k=Math.sqrt(clamp(rho(b,alt)/1.2,0,1)),base=(B.kind==='veil'?10:B.kind==='rust'?8:6)*(0.7+0.3*Math.sin(t*0.013+b)),g1=Math.sin(t*1.7+b*3)*Math.sin(t*0.37),g2=Math.sin(t*2.9+1.3)*Math.sin(t*0.21+b);return[(base+g1*3)*k,(g2*1.5)*k,Math.sin(t*0.9+b)*1.2*k]}
function thrustNow(r,dt,alt,b){if(!r.lit||r.dead)return 0;spoolTick(r,dt);let F=0;const p=rho(b,alt)/1.2;for(const i of engines(r)){const P=PT[r.parts[i]],isp=lerp(P.isp[1],P.isp[0],clamp(p,0,1));
    if(P.k==='srb'){if(r.fuel[i]<=0)continue;const md=P.thr/(P.isp[0]*G0);r.fuel[i]=Math.max(0,r.fuel[i]-md*dt);F+=P.thr*isp/P.isp[0]}
    else{if(r.thr<=0)continue;const fl=liquid(r);if(fl<=0)continue;const f=P.thr*r.thr*isp/P.isp[0]*(r.spool??1),md=P.thr*r.thr/(P.isp[0]*G0)*dt;let need=md;for(const j of bottomSec(r)){if(PT[r.parts[j]].k!=='tank'||need<=0)continue;const take=Math.min(r.fuel[j],need*r.fuel[j]/fl+1e-9);r.fuel[j]-=take;need-=take}F+=f}}return F}
function stepRocket(r,dt){if(r.dead)return;if(r.z==null){r.z=0;r.vz=0}if(r.el==null){r.el=0;r.oe=0}const t=S.t,q=rel(r,t),B0=BODIES[q.b],rr=Math.hypot(q.dx,q.dy,q.dz),alt=rr-B0.R,ux=q.dx/rr,uy=q.dy/rr,uz=q.dz/rr,m=rMass(r);
  // steering: your keys, the stability assist or the autopilot. A/D swing the nose round, Q/E tilt it up or down out of the flat plane (depth)
  let cmd=r.blackout?0:DRAG.rot,cmdE=r.blackout?0:(DRAG.tilt||0);if(AP.mode)cmd=apSteer(r)??cmd;const trq=r.parts.reduce((s,p)=>s+(PT[p].trq||0),0)+(r.lit?0.06*PT_thrust(r):0),aC=trq/Math.max(1,m)*0.5;
  let tgt=null,tgtE=null;if(!cmd&&!cmdE&&r.sas){const sp=Math.hypot(q.vx,q.vy,q.vz),sh=Math.hypot(q.vx,q.vy,q.vz||0);if(r.sas==='hold'){tgt=r.sasA;tgtE=r.sasE||0}else if(r.sas==='pro'&&sp>1){tgt=Math.atan2(q.vy,q.vx);tgtE=Math.atan2(q.vz,sh)}else if(r.sas==='retro'&&sp>1){tgt=Math.atan2(-q.vy,-q.vx);tgtE=Math.atan2(-q.vz,sh)}else if(r.sas==='up'){tgt=Math.atan2(uy,ux);tgtE=Math.asin(clamp(uz,-1,1))}else if(r.sas==='down'){tgt=Math.atan2(-uy,-ux);tgtE=Math.asin(clamp(-uz,-1,1))}else if((r.sas==='tgt'||r.sas==='atgt')&&G.target!=null){const tp=bodyPos(G.target,t),sg=r.sas==='tgt'?1:-1,ex=(tp[0]-r.x)*sg,ey=(tp[1]-r.y)*sg,ez=-(r.z||0)*sg;tgt=Math.atan2(ey,ex);tgtE=Math.atan2(ez,Math.hypot(ex,ey))}
    else if(r.sas==='nrm'||r.sas==='anti'){const o=orbitOf(r,t),hm=Math.hypot(o.hv[0],o.hv[1],o.hv[2])||1,sg=r.sas==='nrm'?1:-1,nx=o.hv[0]/hm*sg,ny=o.hv[1]/hm*sg,nz=o.hv[2]/hm*sg;tgtE=Math.asin(clamp(nz,-1,1));tgt=Math.hypot(nx,ny)>1e-3?Math.atan2(ny,nx):r.a}
    if(AP.mode&&AP.tgt!=null){tgt=AP.tgt;tgtE=AP.tgtE!=null?AP.tgtE:0}if(r.chute===2&&(!AP.mode||AP.mode==='home')){tgt=Math.atan2(uy,ux);tgtE=Math.asin(clamp(uz,-1,1))}
    if(tgt!=null){let d=tgt-r.a;d=Math.atan2(Math.sin(d),Math.cos(d));const want=clamp(d*2.2,-1.2,1.2);cmd=clamp((want-r.om)*4,-1,1)}if(tgtE!=null){const want=clamp((tgtE-r.el)*2.2,-1.2,1.2);cmdE=clamp((want-r.oe)*4,-1,1)}}
  else{if(cmd)r.sasA=r.a;if(cmdE)r.sasE=r.el}
  let aero=0,aeroE=0;const den=rho(q.b,alt),av=airVel(q.b,q.dx,q.dy),wd=r.landed<0?windAt(q.b,alt,t):[0,0,0],tx0=-uy,ty0=ux,vrx=q.vx-av[0]-tx0*wd[0]-ux*wd[1],vry=q.vy-av[1]-ty0*wd[0]-uy*wd[1],vrz=q.vz-wd[2],vs=Math.hypot(vrx,vry,vrz),vsh=Math.hypot(vrx,vry);r.mach=den>0?vs/soundSpeed(alt):0;r.q=0.5*den*vs*vs;r.maxQ=Math.max(r.maxQ||0,r.q);
  const vEl=vs>1?Math.atan2(vrz,vsh):0,ae=vEl-r.el;
  if(den>0&&vs>30&&r.landed<0){const aoa=Math.atan2(Math.sin(Math.atan2(vry,vrx)-r.a),Math.cos(Math.atan2(vry,vrx)-r.a)),qd=0.5*den*vs*vs,k=(has(r,'fins')?1:-0.35)*qd/1000/Math.max(1,m)*0.6;aero=k*Math.sin(aoa);aeroE=Math.cos(aoa)>=0?k*Math.sin(ae):-k*Math.sin(-vEl-r.el);const ce0=Math.cos(r.el),cosA=(ce0*Math.cos(r.a)*vrx+ce0*Math.sin(r.a)*vry+Math.sin(r.el)*vrz)/vs;if(qd>32000&&1-cosA*cosA>0.25&&r.landed<0){boom(r,'broke apart: it turned sideways while flying fast through thick air');return}}
  const LF=typeof liftForces==='function'&&r.landed<0?liftForces(r,den,vrx,vry,vs,dt,m):null;if(LF){aero=LF.alpha-LF.damp*r.om;aeroE=(Math.sin(ae)*3-r.oe*2)*Math.min(1,r.q/3000);r.aoa=LF.aoa;if(LF.stalled&&vs>40&&!r.stallT){r.stallT=1;callout('Stall!',r.x,r.y,'#ffb347')}if(!LF.stalled)r.stallT=0}
  if(dt>0.08){r.om=0;r.oe=0;if(tgt!=null)r.a=tgt;else if(cmd)r.a+=cmd*0.6*Math.min(dt,0.3);if(tgtE!=null)r.el=tgtE;else if(cmdE)r.el+=cmdE*0.6*Math.min(dt,0.3)}else{r.om+=(cmd*(aC+(LF?LF.ctrl:0))+aero)*dt;r.om*=Math.exp(-0.6*dt);r.a+=r.om*dt;r.oe+=(cmdE*(aC+(LF?LF.ctrl:0))+aeroE)*dt;r.oe*=Math.exp(-0.6*dt);r.el+=r.oe*dt}
  if(Math.abs(r.el)>Math.PI/2){r.el=Math.sign(r.el)*Math.PI/2;r.oe=0}
  // forces
  const F=thrustNow(r,dt,alt,q.b),ce=Math.cos(r.el),dx=Math.cos(r.a)*ce,dy=Math.sin(r.a)*ce,dz=Math.sin(r.el);r.thrAcc=F/m;let ax=F*dx/m,ay=F*dy/m,az=F*dz/m,dragA=0;
  if(LF&&vs>0.5){ax+=LF.ax-vrx/vs*LF.drag;ay+=LF.ay-vry/vs*LF.drag;az+=-vrz/vs*LF.drag;
    // wings also push sideways when the nose is turned out of the plane: that is how a plane turns
    const vz2=vrz/vs,sx=-vrx/vs*vz2,sy=-vry/vs*vz2,sz=1-vz2*vz2,sl=Math.hypot(sx,sy,sz)||1,side=r.q*(LF.area||0)*3.5*clamp(-ae,-0.3,0.3)/1000/m;ax+=sx/sl*side;ay+=sy/sl*side;az+=sz/sl*side}
  if(den>0&&vs>0.1){const top=PT[r.parts[0]].k,cd=r.chute===2?0:(['pod','cone','chute'].includes(top)?0.35:0.8),A=Math.PI*(rocketW(r.parts)/2)**2,cda=cd*A+(r.chute===2?chuteArea(q.b):0),Fd=0.5*den*vs*vs*cda*machCd(r.mach)/1000;ax-=vrx/vs*Fd/m;ay-=vry/vs*Fd/m;az-=vrz/vs*Fd/m;dragA=Fd/m;
    const heat=den*vs*vs*vs*2.6e-10*(has(r,'shield')&&(vrx*dx+vry*dy+vrz*dz)/vs<-0.7?0.08:1);r.heat=Math.max(0,r.heat+(heat-0.06)*dt);if(r.heat>1){boom(r,'burned up coming back into the air');return}}else r.heat=Math.max(0,r.heat-0.08*dt);
  if(r.chute===1&&G.autoChute&&den>0&&alt<Math.max(5000,(B0.atm||0)*0.25)&&0.5*den*vs*vs<40000&&q.vx*ux+q.vy*uy+q.vz*uz<0)openChute(r);
  if(r.chute===2&&0.5*den*vs*vs>60000){r.chute=-1;callout('The parachute ripped!',r.x,r.y,'#ffb347')}
  if(r.landed>=0){const bp=bodyPos(r.landed,t+dt),bv=bodyVel(r.landed,t+dt);const up=Math.atan2(uy,ux),upE=Math.asin(clamp(uz,-1,1));const lift=F/m;const gl=B0.mu/(rr*rr);if(F>0&&lift<=gl*1.001&&!r.heavyWarn){r.heavyWarn=1;toast(`Too heavy to lift off: the engines push only ${(lift/gl).toFixed(2)}× the rocket's weight. Use fewer or smaller tanks, or a stronger engine (Lifter, Thunder or boosters).`,9000)}if(lift<=gl*1.001||dx*ux+dy*uy+dz*uz<0.2){if(BODIES[r.landed].rot){const w=BODIES[r.landed].rot,c=Math.cos(w*dt),s=Math.sin(w*dt),lx=r.lx*c-r.ly*s;r.ly=r.lx*s+r.ly*c;r.lx=lx}const sv=airVel(r.landed,r.lx,r.ly);r.x=bp[0]+r.lx;r.y=bp[1]+r.ly;r.z=r.lz||0;r.vx=bv[0]+sv[0];r.vy=bv[1]+sv[1];r.vz=0;r.a=lerp(r.a,up,Math.min(1,dt*2));r.el=lerp(r.el,upE,Math.min(1,dt*2));r.om=0;r.oe=0;return}
    r.landed=-1;callout('Lift-off!',r.x,r.y,'#9fd0ff');ev('liftoff');chEv('liftoff',{b:q.b})}
  r.gf=r.landed>=0?1:Math.hypot(ax,ay,az)/G0;r.maxG=Math.max(r.maxG||0,r.gf);
  // the crew can only take so much: above 9 g for a few seconds they black out and cannot steer until it eases
  if(r.crew&&r.crew.length&&dt<0.5){r.gT=Math.max(0,(r.gT||0)+(r.gf>9?dt:-dt*1.5));if(!r.blackout&&r.gT>3){r.blackout=true;toast('The crew blacked out from the g-force! They cannot steer until it eases off.',6000);ev('blackout')}else if(r.blackout&&r.gT<=0.5&&r.gf<5){r.blackout=false;toast('The crew are awake again',4000)}}if(ax===0&&ay===0&&az===0&&r.landed<0&&den===0&&alt>2000){const st={x:r.x,y:r.y,z:r.z,vx:r.vx,vy:r.vy,vz:r.vz,t};railStep(st,dt);r.x=st.x;r.y=st.y;r.z=st.z;r.vx=st.vx;r.vy=st.vy;r.vz=st.vz}else{const g=gravity(r.x,r.y,t,r.z);r.vx+=(ax+g[0])*dt;r.vy+=(ay+g[1])*dt;r.vz+=(az+g[2])*dt;r.x+=r.vx*dt;r.y+=r.vy*dt;r.z+=r.vz*dt}if(typeof wheels==='function'){wheels(r,dt);if(r.dead)return;if(r.onWheels){r.vz*=Math.exp(-dt*2);r.maxAlt=Math.max(r.maxAlt,0);return}}
  // the ground (mountains and craters included, anywhere on the world, in all three directions)
  const q2=rel(r,t+dt),rr2=Math.hypot(q2.dx,q2.dy,q2.dz),half=rocketLen(r.parts)/2,gH=groundH3(q2.b,q2.dx,q2.dy,q2.dz,t+dt),cosNU=(dx*q2.dx+dy*q2.dy+dz*q2.dz)/rr2,bottom=rr2-BODIES[q2.b].R-gH-Math.max(0,half*cosNU);
  if(bottom<=0&&BODIES[q2.b].kind==='star')return boom(r,'flew into Aster and melted');if(bottom<=0&&BODIES[q2.b].kind==='gas')return boom(r,'sank into the crushing clouds of Goliath');if(bottom<=0){const sv2=airVel(q2.b,q2.dx,q2.dy),gvx=q2.vx-sv2[0],gvy=q2.vy-sv2[1],gvz=q2.vz,vdown=(gvx*q2.dx+gvy*q2.dy+gvz*q2.dz)/rr2,vside=Math.sqrt(Math.max(0,gvx*gvx+gvy*gvy+gvz*gvz-vdown*vdown)),vimp=Math.hypot(vdown,vside*0.5),tilt=Math.acos(clamp(cosNU,-1,1)),safe=G.crashV+(has(r,'legs')?6:0);
    if(vimp>safe)return boom(r,`hit ${BODIES[q2.b].nm} at ${Math.round(vimp)} m/s`);if(tilt>0.7&&vimp>2)return boom(r,'tipped over on landing');
    r.landed=q2.b;const bp=bodyPos(q2.b,t+dt);const k=(BODIES[q2.b].R+gH+half)/rr2;r.lx=q2.dx*k;r.ly=q2.dy*k;r.lz=q2.dz*k;r.x=bp[0]+r.lx;r.y=bp[1]+r.ly;r.z=r.lz;r.vz=0;r.om=0;r.oe=0;r.thr=0;const wasFlight=r.maxAlt>200;
    if(wasFlight){const nm=BODIES[q2.b].nm;callout(`Landed on ${nm}!`,r.x,r.y,'#8fe39a');toast(`Touchdown on ${nm} at ${vimp.toFixed(1)} m/s. ${r.crew.length?'The crew are safe!':''}`,6000);ev('land'+q2.b);if(r.maxAlt>BODIES[0].atm&&q2.b===0)ev('returned');if(mv('land1')&&q2.b===0)ev('moonReturn');chEv('land',{b:q2.b,v:vimp});if(AP.mode==='home'||AP.mode==='land')apOff('Landed safely')}}
  r.maxAlt=Math.max(r.maxAlt,alt);if(q.b===1&&!mv('soi1')){ev('soi1');toast('You are in Luna’s pull now: its gravity takes over',5000);chEv('soi',{})}}
function PT_thrust(r){let f=0;for(const i of engines(r))f+=PT[r.parts[i]].thr;return f}
// thin air needs a much bigger canopy: Rust's air is 15 times thinner than Terra's
function chuteArea(b){const r0=BODIES[b].rho0||1.2;return 450*Math.pow(clamp(1.2/r0,1,15),0.75)}
function openChute(r){if(!has(r,'chute')||r.chute===2)return;r.chute=2;callout('Parachute open',r.x,r.y,'#ffd28a');ev('chute');chEv('chute',{})}
function boom(r,why){if(r.dead)return;r.dead=why;r.lit=false;r.thr=0;for(let i=0;i<14;i++)PARTS.push({k:'fire',x:r.x+rr(-8,8),y:r.y+rr(-8,8),vx:rr(-15,15),vy:rr(-15,15),age:rr(0,0.3),s:rr(4,12)});callout('BOOM',r.x,r.y,'#ff6a3a');toast(`Your rocket ${why}. Press Revert to try again.`,6000);ev('crash');chEv('crash',{why});if(AP.mode)apOff('')}
/* ---------- staging ---------- */
function stage(r){if(!r||r.dead)return;if(!r.lit){r.lit=true;if(r.thr===0)r.thr=1;r.staged++;callout('Ignition!',r.x,r.y,'#ffd23a');ev('stage');chEv('stage',{});if(r.landed>=0&&PT_thrust(r)===0)toast('There are no engines in this stage');return}
  const S0=sections(r.parts);if(S0.length<=1){if(has(r,'chute')&&r.chute<2){const q=rel(r,S.t),alt=Math.hypot(q.dx,q.dy,q.dz)-BODIES[q.b].R,vs=Math.hypot(q.vx,q.vy,q.vz);if(rho(q.b,alt)>0&&0.5*rho(q.b,alt)*vs*vs<40000)openChute(r);else{r.chute=1;toast('Parachute armed: it opens by itself when it is safe (low and slow)')}}return}
  const drop=S0[S0.length-1],keep=S0.slice(0,-1).flat(),dropParts=drop.map(i=>r.parts[i]),dropFuel=drop.map(i=>r.fuel[i]);const L=rocketLen(r.parts),Lk=keep.reduce((s,i)=>s+PT[r.parts[i]].h,0),ce=Math.cos(r.el||0),dx=Math.cos(r.a)*ce,dy=Math.sin(r.a)*ce,dz=Math.sin(r.el||0);
  const dcy=(L/2)-Lk-(L-Lk)/2;DEB.push({parts:dropParts,fuel:dropFuel,x:r.x-dx*(L/2-(L-Lk)/2),y:r.y-dy*(L/2-(L-Lk)/2),z:(r.z||0)-dz*(L/2-(L-Lk)/2),vx:r.vx-dx*3,vy:r.vy-dy*3,vz:(r.vz||0)-dz*3,a:r.a,el:r.el||0,om:rr(-0.2,0.2),age:0});if(DEB.length>12)DEB.shift();
  r.parts=keep.map(i=>r.parts[i]);r.fuel=keep.map(i=>r.fuel[i]);r.x+=dx*(L-Lk)/2;r.y+=dy*(L-Lk)/2;r.z=(r.z||0)+dz*(L-Lk)/2;r.staged++;r.lit=true;callout('Stage!',r.x,r.y,'#ffd23a');ev('stage');chEv('stage',{})}
function stepDebris(dt){for(const d of DEB){if(d.dead)continue;d.age+=dt;d.z=d.z||0;d.vz=d.vz||0;const g=gravity(d.x,d.y,S.t,d.z);const b=domBody(d.x,d.y,S.t,d.z),bp=bodyPos(b,S.t),rr0=Math.hypot(d.x-bp[0],d.y-bp[1],d.z),alt=rr0-BODIES[b].R,den=rho(b,alt);let ax=g[0],ay=g[1],az=g[2];
    if(den>0){const bv=bodyVel(b,S.t),vx=d.vx-bv[0],vy=d.vy-bv[1],vs=Math.hypot(vx,vy,d.vz),m=d.parts.reduce((s,p,i)=>s+PT[p].m+(d.fuel[i]||0),0),Fd=0.5*den*vs*vs*0.9*10/1000;if(vs>0.1){ax-=vx/vs*Fd/m;ay-=vy/vs*Fd/m;az-=d.vz/vs*Fd/m}}
    d.vx+=ax*dt;d.vy+=ay*dt;d.vz+=az*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.z+=d.vz*dt;d.a+=d.om*dt;if(alt<0){d.dead=1;for(let i=0;i<5;i++)PARTS.push({k:'fire',x:d.x,y:d.y,vx:rr(-8,8),vy:rr(-8,8),age:rr(0,.3),s:rr(3,7)})}}DEB=DEB.filter(d=>!d.dead&&d.age<900)}
/* ---------- the flight path ahead ---------- */
function predict(){PRED=[];PINFO={};if(!R||R.dead||R.landed>=0){PREDV++;return}const t0=S.t,b0=domBody(R.x,R.y,t0,R.z||0),o=orbitOf(R,t0),tg=G.target;let x=R.x,y=R.y,z=R.z||0,vx=R.vx,vy=R.vy,vz=R.vz||0,t=t0,closest=1e30,closestT=0,bprev=b0;
  const f0=bodyPos(b0,t0),maxT=o.e<1&&o.period<3e7?o.period*1.02:BODIES[b0].kind==='star'?4e7:3e7;PREDREF=[R.x,R.y];
  const st={x,y,z,vx,vy,vz,t};for(let i=0;i<4000&&t-t0<maxT;i++){railStep(st,railDt(st,0.03));({x,y,z,vx,vy,vz,t}=st);
    if(tg!=null&&tg!==b0){const tp=bodyPos(tg,t),dm=Math.hypot(x-tp[0],y-tp[1],z);if(dm<closest){closest=dm;closestT=t}}
    const bn=domBody(x,y,t,z);if(bn!==bprev){if(!PINFO.enc){PINFO.enc=true;PINFO.encB=bn;PINFO.encT=t-t0}if(bn===tg){PINFO.encTarget=true;PINFO.tT=t-t0}bprev=bn}
    const fb=bodyPos(b0,t);PRED.push([x-fb[0]+f0[0],y-fb[1]+f0[1],z]);
    const bq=bodyPos(bn,t);if(Math.hypot(x-bq[0],y-bq[1],z)<BODIES[bn].R+groundH3(bn,x-bq[0],y-bq[1],z,t)){PINFO.impact=BODIES[bn].nm;PINFO.impT=t-t0;break}}
  if(tg!=null){PINFO.closest=closest-BODIES[tg].R;PINFO.closestT=closestT-t0}PREDV++}
