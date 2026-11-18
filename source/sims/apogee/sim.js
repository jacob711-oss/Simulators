/* ================= Apogee: build rockets and fly them to orbit and the Moon ================= */
// Units are metres, seconds, tonnes and kilonewtons (so kN / t = m/s²). Terra sits in the middle of a 32,000 km world.
const WS=3.2e7,C0=WS/2,G0=9.80665;
const BODIES=[{id:'terra',nm:'Terra',R:640000,mu:9.81*640000*640000,atm:60000,rho0:1.2,H:6000},{id:'luna',nm:'Luna',R:200000,mu:1.62*2e5*2e5,orbit:1.2e7,m0:2.2}];
BODIES[1].period=2*Math.PI*Math.sqrt(BODIES[1].orbit**3/BODIES[0].mu);BODIES[1].soi=BODIES[1].orbit*Math.pow(BODIES[1].mu/BODIES[0].mu,0.4);
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
let DESIGN=PRESETS.orbiter.parts.slice(),R=null,DEB=[],PRED=[],PINFO={},MODE='build',MISSION={};
const AP={mode:'',ph:''};
const G={throttleStep:0.1,autoChute:true,crashV:9};
let PARTS=[],HOVER=null,DRAG={keys:new Set(),idle:9,rot:0,thr:0},TB=[];
const sayT=(m,ms)=>{if($('home').hidden)toast(m,ms)};const ev=(k,n)=>{MISSION[k]=(MISSION[k]||0)+(n||1)},mv=k=>MISSION[k]||0;
/* ---------- the Moon moves around Terra ---------- */
function moonPos(t){const L=BODIES[1],a=L.m0+2*Math.PI*t/L.period;return[C0+L.orbit*Math.cos(a),C0+L.orbit*Math.sin(a)]}
function moonVel(t){const L=BODIES[1],a=L.m0+2*Math.PI*t/L.period,w=2*Math.PI/L.period*L.orbit;return[-Math.sin(a)*w,Math.cos(a)*w]}
const bodyPos=(i,t)=>i?moonPos(t):[C0,C0],bodyVel=(i,t)=>i?moonVel(t):[0,0];
function domBody(x,y,t){const m=moonPos(t);return Math.hypot(x-m[0],y-m[1])<BODIES[1].soi?1:0}
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
function newRocket(parts,x,y,vx,vy,a){const crew=parts.reduce((s,p)=>s+(PT[p].crew||0),0);return{parts:parts.slice(),fuel:parts.map(p=>PT[p].fuel||0),x,y,vx,vy,a,om:0,thr:0,lit:false,chute:0,heat:0,dead:'',landed:-1,sas:'hold',sasA:a,crew:crewNames(crew),maxAlt:0,t0:S.t,staged:0}}
function rMass(r){let m=0;r.parts.forEach((p,i)=>m+=PT[p].m+r.fuel[i]);return m}
function bottomSec(r){const s=sections(r.parts);return s[s.length-1]}
function engines(r){return bottomSec(r).filter(i=>PT[r.parts[i]].k==='eng'||PT[r.parts[i]].k==='srb')}
function liquid(r){let f=0;for(const i of bottomSec(r))if(PT[r.parts[i]].k==='tank')f+=r.fuel[i];return f}
const has=(r,k)=>r.parts.some(p=>PT[p].k===k);
/* ---------- where am I? ---------- */
function rel(r,t){const b=domBody(r.x,r.y,t),bp=bodyPos(b,t),bv=bodyVel(b,t);return{b,dx:r.x-bp[0],dy:r.y-bp[1],vx:r.vx-bv[0],vy:r.vy-bv[1]}}
function orbitOf(r,t){const q=rel(r,t),B0=BODIES[q.b],rr=Math.hypot(q.dx,q.dy),v2=q.vx*q.vx+q.vy*q.vy,mu=B0.mu,eps=v2/2-mu/rr,h=q.dx*q.vy-q.dy*q.vx,a=-mu/(2*eps);let e=Math.sqrt(Math.max(0,1+2*eps*h*h/(mu*mu)));
  const bound=eps<0,pe=(bound?a*(1-Math.min(e,1)):h*h/mu/(1+e))-B0.R,ap=bound?a*(1+Math.min(e,1))-B0.R:Infinity;e=bound?Math.min(e,0.99999):e;return{b:q.b,alt:rr-B0.R,r:rr,spd:Math.sqrt(v2),vr:(q.dx*q.vx+q.dy*q.vy)/rr,vh:Math.abs(h)/rr,ap,pe,e,a,h,period:e<1?2*Math.PI*Math.sqrt(a*a*a/mu):Infinity}}
function rho(b,alt){const B0=BODIES[b];return B0.atm&&alt<B0.atm?B0.rho0*Math.exp(-alt/B0.H):0}
/* ---------- physics ---------- */
function gravity(x,y,t){let ax=0,ay=0;for(let i=0;i<2;i++){const p=bodyPos(i,t),dx=p[0]-x,dy=p[1]-y,d2=dx*dx+dy*dy,d=Math.sqrt(d2),g=BODIES[i].mu/d2;ax+=dx/d*g;ay+=dy/d*g}return[ax,ay]}
function thrustNow(r,dt,alt,b){if(!r.lit||r.dead)return 0;let F=0;const p=rho(b,alt)/1.2;for(const i of engines(r)){const P=PT[r.parts[i]],isp=lerp(P.isp[1],P.isp[0],clamp(p,0,1));
    if(P.k==='srb'){if(r.fuel[i]<=0)continue;const md=P.thr/(isp*G0);r.fuel[i]=Math.max(0,r.fuel[i]-md*dt);F+=P.thr}
    else{if(r.thr<=0)continue;const fl=liquid(r);if(fl<=0)continue;const f=P.thr*r.thr,md=f/(isp*G0)*dt;let need=md;for(const j of bottomSec(r)){if(PT[r.parts[j]].k!=='tank'||need<=0)continue;const take=Math.min(r.fuel[j],need*r.fuel[j]/fl+1e-9);r.fuel[j]-=take;need-=take}F+=f}}return F}
function stepRocket(r,dt){if(r.dead)return;const t=S.t,q=rel(r,t),B0=BODIES[q.b],rr=Math.hypot(q.dx,q.dy),alt=rr-B0.R,ux=q.dx/rr,uy=q.dy/rr,m=rMass(r);
  // steering: your keys, the stability assist or the autopilot
  let cmd=DRAG.rot;if(AP.mode)cmd=apSteer(r)??cmd;const trq=r.parts.reduce((s,p)=>s+(PT[p].trq||0),0)+(r.lit?0.06*PT_thrust(r):0),aC=trq/Math.max(1,m)*0.5;
  if(!cmd&&r.sas){let tgt=null;const sp=Math.hypot(q.vx,q.vy);if(r.sas==='hold')tgt=r.sasA;else if(r.sas==='pro'&&sp>1)tgt=Math.atan2(q.vy,q.vx);else if(r.sas==='retro'&&sp>1)tgt=Math.atan2(-q.vy,-q.vx);else if(r.sas==='up')tgt=Math.atan2(uy,ux);
    if(AP.mode&&AP.tgt!=null)tgt=AP.tgt;if(tgt!=null){let d=tgt-r.a;d=Math.atan2(Math.sin(d),Math.cos(d));const want=clamp(d*2.2,-1.2,1.2);cmd=clamp((want-r.om)*4,-1,1)}}
  else if(cmd)r.sasA=r.a;
  let aero=0;const den=rho(q.b,alt),vrx=q.vx,vry=q.vy,vs=Math.hypot(vrx,vry);
  if(den>0&&vs>30&&r.landed<0){const aoa=Math.atan2(Math.sin(Math.atan2(vry,vrx)-r.a),Math.cos(Math.atan2(vry,vrx)-r.a)),qd=0.5*den*vs*vs;aero=(has(r,'fins')?1:-0.35)*Math.sin(aoa)*qd/1000/Math.max(1,m)*0.6}
  r.om+=(cmd*aC+aero)*dt;r.om*=Math.exp(-0.6*dt);r.a+=r.om*dt;
  // forces
  const F=thrustNow(r,dt,alt,q.b),dx=Math.cos(r.a),dy=Math.sin(r.a);let ax=F*dx/m,ay=F*dy/m;
  if(den>0&&vs>0.1){const top=PT[r.parts[0]].k,cd=r.chute===2?0:(['pod','cone','chute'].includes(top)?0.35:0.8),A=Math.PI*(rocketW(r.parts)/2)**2,cda=cd*A+(r.chute===2?450:0),Fd=0.5*den*vs*vs*cda/1000;ax-=vrx/vs*Fd/m;ay-=vry/vs*Fd/m;
    const heat=den*vs*vs*vs*2.6e-10*(has(r,'shield')&&Math.cos(Math.atan2(vry,vrx)-r.a)<-0.7?0.08:1);r.heat=Math.max(0,r.heat+(heat-0.06)*dt);if(r.heat>1){boom(r,'burned up coming back into the air');return}}else r.heat=Math.max(0,r.heat-0.08*dt);
  if(r.chute===1&&G.autoChute&&den>0&&alt<5000&&vs<260&&q.vx*ux+q.vy*uy<0)openChute(r);
  if(r.chute===2&&vs>320&&den>0.05){r.chute=-1;callout('The parachute ripped!',r.x,r.y,'#ffb347')}
  if(r.landed>=0){const bp=bodyPos(r.landed,t),bv=bodyVel(r.landed,t);const up=Math.atan2(uy,ux);const lift=F/m;const gl=B0.mu/(rr*rr);if(lift<=gl*1.001||Math.cos(r.a-up)<0.2){r.x=bp[0]+r.lx;r.y=bp[1]+r.ly;r.vx=bv[0];r.vy=bv[1];r.a=lerp(r.a,up,Math.min(1,dt*2));r.om=0;return}
    r.landed=-1;callout('Lift-off!',r.x,r.y,'#9fd0ff');ev('liftoff');chEv('liftoff',{b:q.b})}
  const g=gravity(r.x,r.y,t);r.vx+=(ax+g[0])*dt;r.vy+=(ay+g[1])*dt;r.x+=r.vx*dt;r.y+=r.vy*dt;
  // the ground
  const q2=rel(r,t+dt),rr2=Math.hypot(q2.dx,q2.dy),half=rocketLen(r.parts)/2,bottom=rr2-B0.R-Math.max(0,half*Math.cos(r.a-Math.atan2(q2.dy,q2.dx)));
  if(bottom<=0){const vimp=Math.hypot(q2.vx,q2.vy),up=Math.atan2(q2.dy,q2.dx),tilt=Math.abs(Math.atan2(Math.sin(r.a-up),Math.cos(r.a-up))),safe=G.crashV+(has(r,'legs')?6:0);
    if(vimp>safe)return boom(r,`hit ${BODIES[q2.b].nm} at ${Math.round(vimp)} m/s`);if(tilt>0.7&&vimp>2)return boom(r,'tipped over on landing');
    r.landed=q2.b;const bp=bodyPos(q2.b,t);const k=(BODIES[q2.b].R+half)/rr2;r.lx=q2.dx*k;r.ly=q2.dy*k;r.x=bp[0]+r.lx;r.y=bp[1]+r.ly;r.om=0;r.thr=0;const wasFlight=r.maxAlt>200;
    if(wasFlight){const nm=BODIES[q2.b].nm;callout(`Landed on ${nm}!`,r.x,r.y,'#8fe39a');toast(`Touchdown on ${nm} at ${vimp.toFixed(1)} m/s. ${r.crew.length?'The crew are safe!':''}`,6000);ev('land'+q2.b);if(r.maxAlt>BODIES[0].atm&&q2.b===0)ev('returned');if(mv('land1')&&q2.b===0)ev('moonReturn');chEv('land',{b:q2.b,v:vimp});if(AP.mode==='home')apOff('Landed safely')}}
  r.maxAlt=Math.max(r.maxAlt,alt);if(q.b===1&&!mv('soi1')){ev('soi1');toast('You are in Luna’s pull now: its gravity takes over',5000);chEv('soi',{})}}
function PT_thrust(r){let f=0;for(const i of engines(r))f+=PT[r.parts[i]].thr;return f}
function openChute(r){if(!has(r,'chute')||r.chute===2)return;r.chute=2;callout('Parachute open',r.x,r.y,'#ffd28a');ev('chute');chEv('chute',{})}
function boom(r,why){if(r.dead)return;r.dead=why;r.lit=false;r.thr=0;for(let i=0;i<14;i++)PARTS.push({k:'fire',x:r.x+rr(-8,8),y:r.y+rr(-8,8),vx:rr(-15,15),vy:rr(-15,15),age:rr(0,0.3),s:rr(4,12)});callout('BOOM',r.x,r.y,'#ff6a3a');toast(`Your rocket ${why}. Press Revert to try again.`,6000);ev('crash');chEv('crash',{why});if(AP.mode)apOff('')}
/* ---------- staging ---------- */
function stage(r){if(!r||r.dead)return;if(!r.lit){r.lit=true;if(r.thr===0)r.thr=1;r.staged++;callout('Ignition!',r.x,r.y,'#ffd23a');ev('stage');chEv('stage',{});if(r.landed>=0&&PT_thrust(r)===0)toast('There are no engines in this stage');return}
  const S0=sections(r.parts);if(S0.length<=1){if(has(r,'chute')&&r.chute<2){const q=rel(r,S.t),alt=Math.hypot(q.dx,q.dy)-BODIES[q.b].R,vs=Math.hypot(q.vx,q.vy);if(rho(q.b,alt)>0&&vs<260)openChute(r);else{r.chute=1;toast('Parachute armed: it opens by itself when it is safe (low and slow)')}}return}
  const drop=S0[S0.length-1],keep=S0.slice(0,-1).flat(),dropParts=drop.map(i=>r.parts[i]),dropFuel=drop.map(i=>r.fuel[i]);const L=rocketLen(r.parts),Lk=keep.reduce((s,i)=>s+PT[r.parts[i]].h,0),dx=Math.cos(r.a),dy=Math.sin(r.a);
  const dcy=(L/2)-Lk-(L-Lk)/2;DEB.push({parts:dropParts,fuel:dropFuel,x:r.x-dx*(L/2-(L-Lk)/2),y:r.y-dy*(L/2-(L-Lk)/2),vx:r.vx-dx*3,vy:r.vy-dy*3,a:r.a,om:rr(-0.2,0.2),age:0});if(DEB.length>12)DEB.shift();
  r.parts=keep.map(i=>r.parts[i]);r.fuel=keep.map(i=>r.fuel[i]);r.x+=dx*(L-Lk)/2;r.y+=dy*(L-Lk)/2;r.staged++;r.lit=true;callout('Stage!',r.x,r.y,'#ffd23a');ev('stage');chEv('stage',{})}
function stepDebris(dt){for(const d of DEB){if(d.dead)continue;d.age+=dt;const g=gravity(d.x,d.y,S.t);const q={x:d.x,y:d.y};const b=domBody(d.x,d.y,S.t),bp=bodyPos(b,S.t),rr0=Math.hypot(d.x-bp[0],d.y-bp[1]),alt=rr0-BODIES[b].R,den=rho(b,alt);let ax=g[0],ay=g[1];
    if(den>0){const bv=bodyVel(b,S.t),vx=d.vx-bv[0],vy=d.vy-bv[1],vs=Math.hypot(vx,vy),m=d.parts.reduce((s,p,i)=>s+PT[p].m+(d.fuel[i]||0),0),Fd=0.5*den*vs*vs*0.9*10/1000;if(vs>0.1){ax-=vx/vs*Fd/m;ay-=vy/vs*Fd/m}}
    d.vx+=ax*dt;d.vy+=ay*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.a+=d.om*dt;if(alt<0){d.dead=1;for(let i=0;i<5;i++)PARTS.push({k:'fire',x:d.x,y:d.y,vx:rr(-8,8),vy:rr(-8,8),age:rr(0,.3),s:rr(3,7)})}}DEB=DEB.filter(d=>!d.dead&&d.age<900)}
/* ---------- the flight path ahead ---------- */
function predict(){PRED=[];PINFO={};if(!R||R.dead||R.landed>=0)return;const t0=S.t,b0=domBody(R.x,R.y,t0),o=orbitOf(R,t0);let x=R.x,y=R.y,vx=R.vx,vy=R.vy,t=t0,inLuna=b0===1,closest=1e18,closestT=0;const m0=moonPos(t0),maxT=o.e<1&&o.period<4e5?o.period*1.02:4e5;
  for(let i=0;i<1400&&t-t0<maxT;i++){const bnow=domBody(x,y,t),bp=bodyPos(bnow,t),r0=Math.hypot(x-bp[0],y-bp[1]),v=Math.hypot(vx-bodyVel(bnow,t)[0],vy-bodyVel(bnow,t)[1]);const dt=clamp(r0/Math.max(v,1)*0.012,0.5,200);
    const g1=gravity(x,y,t);vx+=g1[0]*dt*0.5;vy+=g1[1]*dt*0.5;x+=vx*dt;y+=vy*dt;t+=dt;const g2=gravity(x,y,t);vx+=g2[0]*dt*0.5;vy+=g2[1]*dt*0.5;
    const mp=moonPos(t),dm=Math.hypot(x-mp[0],y-mp[1]);if(dm<closest){closest=dm;closestT=t}if(bnow===1&&b0===0&&!PINFO.enc){PINFO.enc=true;PINFO.encT=t-t0}
    let px=x,py=y;if(b0===1){px=x-mp[0]+m0[0];py=y-mp[1]+m0[1]}PRED.push([px,py]);
    const bb=domBody(x,y,t),bq=bodyPos(bb,t);if(Math.hypot(x-bq[0],y-bq[1])<BODIES[bb].R){PINFO.impact=BODIES[bb].nm;PINFO.impT=t-t0;break}}
  PINFO.closest=closest-BODIES[1].R;PINFO.closestT=closestT-t0}
