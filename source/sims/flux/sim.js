/* ================= Flux: electric charges, fields and magnets ================= */
// The lab is 120 x 80 units. Forces follow Coulomb's law (softened up close) and the magnetic Lorentz force.
const WW=120,WH=80,K=120,MAXP=400;
let Q=[],EM=[],TG=[],BZ=new Float32Array(WW*WH),HIST=[],LINES=[],DIRTY=true,BDIRTY=true,VDIRTY=true,QID=0;
let MASSCH=0;const G={q:2,v:22,bmag:1,mm:1,trails:true,absorbed:0,hits:0,fired:0,escaped:0};
let PLACED=0,BPAINT=0,MOVED=0,ERASED=0,EMADD=0,TGADD=0,FREEADD=0,EVN=0,DRAG=null,HOVER=null;
const ixb=(x,y)=>(y|0)*WW+(x|0),inW=(x,y)=>x>=0&&y>=0&&x<WW&&y<WH,Bat=(x,y)=>inW(x,y)?BZ[ixb(x,y)]*G.bmag:0;
const fixedQ=()=>Q.filter(c=>!c.free),freeQ=()=>Q.filter(c=>c.free);
function addCharge(x,y,q,free,vx,vy){if(free&&freeQ().length>=MAXP){Q.splice(Q.findIndex(c=>c.free),1)}const c={id:QID++,x,y,q,free:!!free,vx:vx||0,vy:vy||0,m:free?(q<0?0.25:1)*(G.mm||1):1e9,trail:[],age:0,turn:0,orbitT:0,absorbed:0};Q.push(c);if(!free)DIRTY=VDIRTY=true;return c}
const proton=(x,y,vx,vy)=>addCharge(x,y,1,true,vx,vy),electron=(x,y,vx,vy)=>addCharge(x,y,-1,true,vx,vy);
function addEm(x,y,a,sign){const e={id:QID++,x,y,a:a||0,sign,t:0,rate:3,on:true};EM.push(e);return e}
function addTg(x,y,r){const t={id:QID++,x,y,r:r||3,hits:0};TG.push(t);return t}
function paintB(x,y,r,v){for(let yy=-r;yy<=r;yy++)for(let xx=-r;xx<=r;xx++){const d=Math.hypot(xx,yy);if(d>r)continue;const X=(x|0)+xx,Y=(y|0)+yy;if(!inW(X,Y))continue;const i=ixb(X,Y),f=1-d/(r+1)*0.5;BZ[i]=v>0?Math.max(BZ[i],v*f):v<0?Math.min(BZ[i],v*f):0}BDIRTY=true}
/* ---------- fields ---------- */
function E(x,y,skip){let ex=0,ey=0;for(const c of Q){if(c===skip||(c.free&&!skip))continue;const dx=x-c.x,dy=y-c.y,r2=dx*dx+dy*dy+0.8,f=K*c.q/(r2*Math.sqrt(r2));ex+=dx*f;ey+=dy*f}return[ex,ey]}
function V(x,y){let v=0;for(const c of Q){if(c.free)continue;const dx=x-c.x,dy=y-c.y;v+=K*c.q/Math.sqrt(dx*dx+dy*dy+0.8)}return v}
function traceLines(){LINES=[];const F=fixedQ(),pos=F.filter(c=>c.q>0),neg=F.filter(c=>c.q<0),src=pos.length?pos:neg,dir=pos.length?1:-1;let budget=160;
  for(const s of src){const n=Math.min(24,Math.round(6*Math.abs(s.q)));for(let k=0;k<n&&budget>0;k++,budget--){const a=(k+0.5)/n*Math.PI*2;let x=s.x+Math.cos(a)*1.1,y=s.y+Math.sin(a)*1.1;const pts=[[x,y]];
      for(let st=0;st<320;st++){let [ex,ey]=E(x,y);let m=Math.hypot(ex,ey)||1;const h=0.55*dir,mx=x+ex/m*h/2,my=y+ey/m*h/2;[ex,ey]=E(mx,my);m=Math.hypot(ex,ey)||1;x+=ex/m*h;y+=ey/m*h;pts.push([x,y]);
        if(x<-15||y<-15||x>WW+15||y>WH+15)break;if(F.some(c=>c.q*dir<0&&Math.hypot(c.x-x,c.y-y)<0.9))break}LINES.push(pts)}}DIRTY=false}
/* ---------- particles ---------- */
function stepParticles(dt){const P=freeQ(),F=fixedQ(),mutual=P.length<=120,SUB=6,h=dt/SUB;
  for(let s=0;s<SUB;s++){for(const p of P){if(p.dead)continue;let ax=0,ay=0;for(const c of (mutual?Q:F)){if(c===p||c.dead)continue;const dx=p.x-c.x,dy=p.y-c.y,r2=dx*dx+dy*dy+0.8,f=K*p.q*c.q/(r2*Math.sqrt(r2))/p.m;ax+=dx*f;ay+=dy*f;
        if(!c.free&&c.q*p.q<0&&r2<1.3+0.15*Math.abs(c.q)){p.dead=true;p.cause='absorbed';c.absorbed++;G.absorbed++;chEv('absorb',{q:p.q});FX(c.x,c.y,p.q>0?'#ff6a6a':'#5ab4ff',true);break}}
      if(p.dead)continue;const b=Bat(p.x,p.y);if(b){const qm=p.q/p.m*2;ax+=qm*p.vy*b;ay-=qm*p.vx*b}
      const a0=Math.atan2(p.vy,p.vx);p.vx+=ax*h;p.vy+=ay*h;const sp=Math.hypot(p.vx,p.vy);if(sp>140){p.vx*=140/sp;p.vy*=140/sp}let da=Math.atan2(p.vy,p.vx)-a0;if(da>Math.PI)da-=2*Math.PI;if(da<-Math.PI)da+=2*Math.PI;if(sp>0.5)p.turn+=da;
      p.x+=p.vx*h;p.y+=p.vy*h;
      for(const t of TG)if(Math.hypot(t.x-p.x,t.y-p.y)<t.r){p.dead=true;p.cause='target';t.hits++;G.hits++;chEv('hit',{t:t.id});FX(t.x,t.y,'#ffd23a',true);break}
      if(p.x<-8||p.y<-8||p.x>WW+8||p.y>WH+8){p.dead=true;p.cause='escaped';G.escaped++;chEv('escape',{})}}}
  for(const p of P){if(p.dead)continue;p.age+=dt;let near=1e9;for(const c of F)if(c.q*p.q<0)near=Math.min(near,Math.hypot(c.x-p.x,c.y-p.y));p.orbitT=near<25?p.orbitT+dt:0}
  if(P.some(p=>p.dead))Q=Q.filter(c=>!c.dead)}
/* ---------- labs ---------- */
function clearLab(){Q=[];EM=[];TG=[];BZ.fill(0);HIST=[];PARTS=[];LINES=[];DIRTY=BDIRTY=VDIRTY=true;Object.assign(G,{absorbed:0,hits:0,fired:0,escaped:0})}
const orbitE=(c,r,a,dirn)=>{const v=Math.sqrt(K*c.q/(0.25*r))*(dirn||1);electron(c.x+Math.cos(a)*r,c.y+Math.sin(a)*r,-Math.sin(a)*v,Math.cos(a)*v)};
const SCENS={
  dipole:()=>{addCharge(45,40,3);addCharge(75,40,-3);electron(60,22,6,0)},
  atom:()=>{const n=addCharge(60,40,5);orbitE(n,10,0);orbitE(n,15,2.1);orbitE(n,21,4.2)},
  range:()=>{addEm(8,40,0,-1);addTg(100,16,3.5);addCharge(60,8,2)},
  cyclotron:()=>{paintB(60,40,34,1.3);addEm(60,40,0,1).rate=1.5},
  capacitor:()=>{for(let x=30;x<=90;x+=4){addCharge(x,26,1);addCharge(x,54,-1)}addEm(6,40,0,-1);addTg(114,40,4)},
  gallery:()=>{addEm(10,70,-0.5,-1);addTg(40,10,3);addTg(90,12,3);addTg(110,60,3)},
  blank:()=>{},
};
const SCENLIST=[{id:'dipole',name:'Dipole',desc:'A positive and a negative charge, and the field between them.'},{id:'atom',name:'Atom',desc:'Electrons orbiting a heavy positive nucleus.'},{id:'range',name:'Firing range',desc:'An electron gun and a target that is not in line with it.'},{id:'cyclotron',name:'Cyclotron',desc:'A magnetic field curls a proton beam into circles.'},{id:'capacitor',name:'Capacitor',desc:'Two charged plates bend a beam of electrons.'},{id:'gallery',name:'Shooting gallery',desc:'Three targets, one gun.'},{id:'blank',name:'Empty lab',desc:'Nothing at all. Build anything.'}];
/* ---------- panel ---------- */
let PARTS=[];function FX(x,y,col,small){PARTS.push({x,y,col,age:0,small:!!small})}
function syncPanel(){const inv=$('inv');if(!inv)return;const F=fixedQ(),P=freeQ();inv.innerHTML=`<div>➕ Positive <b>${F.filter(c=>c.q>0).length}</b></div><div>➖ Negative <b>${F.filter(c=>c.q<0).length}</b></div><div>⚛️ Free particles <b>${P.length}</b></div><div>🎯 Target hits <b>${G.hits}</b></div>`;
  $('qV').textContent='±'+G.q;$('vV').textContent=G.v;$('bV').textContent=G.bmag.toFixed(1)+'×';$('trBtn').setAttribute('aria-pressed',G.trails);$('trBtn').textContent=G.trails?'On':'Off'}
$('qS').oninput=e=>{G.q=+e.target.value;syncPanel()};{const ms=$('mS');if(ms)ms.oninput=e=>{G.mm=Math.pow(10,+e.target.value);$('mV').textContent=fmtMass(G.mm)+'×';(MASSCH++,chEv('mass',{}));syncPanel()}}$('vS').oninput=e=>{G.v=+e.target.value;chEv('tweak',{});syncPanel()};$('bS').oninput=e=>{G.bmag=+e.target.value;BDIRTY=true;chEv('tweak',{});syncPanel()};$('trBtn').onclick=()=>{G.trails=!G.trails;syncPanel()};
document.querySelectorAll('[data-ev]').forEach(b=>b.onclick=()=>{const ev=b.dataset.ev;EVN++;chEv('event',{ev});
  if(ev==='clearp'){Q=Q.filter(c=>!c.free);toast('Particles cleared')}else if(ev==='burst'){for(let k=0;k<30;k++){const a=Math.random()*7,s=4+Math.random()*12;(k%2?proton:electron)(WW/2+Math.cos(a)*30*Math.random(),WH/2+Math.sin(a)*20*Math.random(),Math.cos(a+1.6)*s,Math.sin(a+1.6)*s)}toast('💥 30 particles released')}
  else if(ev==='flip'){for(const c of Q)if(!c.free)c.q=-c.q;for(const e of EM)e.sign=-e.sign;DIRTY=VDIRTY=true;toast('🔄 Every charge flipped')}else if(ev==='freeze'){let n=0;for(const c of Q)if(c.free){c.free=false;c.m=1e9;c.vx=c.vy=0;n++}DIRTY=VDIRTY=true;toast(`🧊 ${n} particles frozen in place`)}syncPanel()});
/* ---------- drawing ---------- */
const vOff=document.createElement('canvas');vOff.width=WW;vOff.height=WH;const vx=vOff.getContext('2d'),vImg=vx.createImageData(WW,WH);
const bOff=document.createElement('canvas');bOff.width=WW;bOff.height=WH;const bx=bOff.getContext('2d'),bImg=bx.createImageData(WW,WH);
function paintV(){const d=vImg.data;for(let y=0;y<WH;y++)for(let x=0;x<WW;x++){const v=Math.tanh(V(x+0.5,y+0.5)/60),o=(y*WW+x)*4;if(v>0){d[o]=20+235*v;d[o+1]=20+60*v;d[o+2]=40+30*v}else{d[o]=20-10*v;d[o+1]=20-130*v;d[o+2]=40-215*v}d[o+3]=255}vx.putImageData(vImg,0,0);VDIRTY=false}
function paintB2(){const d=bImg.data;for(let i=0;i<WW*WH;i++){const b=BZ[i]*G.bmag,o=i*4,a=Math.min(1,Math.abs(b)*0.9);if(b>0){d[o]=180;d[o+1]=90;d[o+2]=255}else{d[o]=80;d[o+1]=255;d[o+2]=170}d[o+3]=a*90}bx.putImageData(bImg,0,0);BDIRTY=false}
function render(c,now){const z=cam.z,v=S.view;c.fillStyle='#03050b';c.fillRect(0,0,W,H);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  if(v==='potential'){if(VDIRTY)paintV();c.drawImage(vOff,sx(0),sy(0),WW*z,WH*z)}else{c.fillStyle='#070b17';c.fillRect(sx(0),sy(0),WW*z,WH*z);c.strokeStyle='rgba(120,160,255,.06)';c.lineWidth=1;c.beginPath();for(let x=0;x<=WW;x+=5){c.moveTo(sx(x),sy(0));c.lineTo(sx(x),sy(WH))}for(let y=0;y<=WH;y+=5){c.moveTo(sx(0),sy(y));c.lineTo(sx(WW),sy(y))}c.stroke()}
  if(BDIRTY)paintB2();c.drawImage(bOff,sx(0),sy(0),WW*z,WH*z);
  if(z>6){c.font=`${Math.round(z*0.7)}px sans-serif`;c.textAlign='center';c.textBaseline='middle';for(let y=2;y<WH;y+=4)for(let x=2;x<WW;x+=4){const b=BZ[ixb(x,y)];if(Math.abs(b)<0.1)continue;c.fillStyle=b>0?'rgba(200,150,255,.55)':'rgba(120,255,190,.55)';c.fillText(b>0?'⊗':'⊙',sx(x+0.5),sy(y+0.5))}c.textBaseline='alphabetic'}
  if(v==='normal'){if(DIRTY)traceLines();c.save();c.beginPath();c.rect(sx(0),sy(0),WW*z,WH*z);c.clip();c.strokeStyle='rgba(110,210,255,.5)';c.lineWidth=Math.max(1,z*0.08);c.beginPath();for(const L of LINES){L.forEach(([x,y],i)=>i?c.lineTo(sx(x),sy(y)):c.moveTo(sx(x),sy(y)))}c.stroke();
    c.fillStyle='rgba(140,220,255,.75)';for(const L of LINES){const k=Math.floor(L.length*0.4);if(k<2||k>=L.length-1)continue;const [x0,y0]=L[k-1],[x1,y1]=L[k+1],a=Math.atan2(y1-y0,x1-x0)*(fixedQ().some(q=>q.q>0)?1:-1)+(fixedQ().some(q=>q.q>0)?0:Math.PI),X=sx(L[k][0]),Y=sy(L[k][1]),s=Math.max(4,z*0.5);c.beginPath();c.moveTo(X+Math.cos(a)*s,Y+Math.sin(a)*s);c.lineTo(X+Math.cos(a+2.5)*s*0.7,Y+Math.sin(a+2.5)*s*0.7);c.lineTo(X+Math.cos(a-2.5)*s*0.7,Y+Math.sin(a-2.5)*s*0.7);c.fill()}c.restore()}
  if(v==='arrows'){c.strokeStyle='rgba(150,220,255,.7)';c.lineWidth=1.5;c.beginPath();for(let y=2.5;y<WH;y+=5)for(let x=2.5;x<WW;x+=5){const [ex,ey]=E(x,y),m=Math.hypot(ex,ey);if(m<0.05)continue;const L=Math.min(2.2,0.6+Math.log10(1+m)*0.9),ux=ex/m*L,uy=ey/m*L,X=sx(x),Y=sy(y);c.moveTo(X-ux*z,Y-uy*z);c.lineTo(X+ux*z,Y+uy*z);const a=Math.atan2(uy,ux);c.lineTo(X+ux*z-Math.cos(a-0.5)*z*0.6,Y+uy*z-Math.sin(a-0.5)*z*0.6);c.moveTo(X+ux*z,Y+uy*z);c.lineTo(X+ux*z-Math.cos(a+0.5)*z*0.6,Y+uy*z-Math.sin(a+0.5)*z*0.6)}c.stroke()}
  // targets and emitters
  for(const t of TG){const X=sx(t.x),Y=sy(t.y),R0=t.r*z;for(let k=3;k>=1;k--){c.strokeStyle=k%2?'rgba(255,210,58,.9)':'rgba(255,255,255,.7)';c.lineWidth=Math.max(1.5,z*0.15);c.beginPath();c.arc(X,Y,R0*k/3,0,7);c.stroke()}c.fillStyle='#ffd23a';c.font=`600 ${Math.max(11,z*1)|0}px "IBM Plex Mono",monospace`;c.textAlign='center';c.fillText(t.hits,X,Y-R0-6)}
  for(const e of EM){const X=sx(e.x),Y=sy(e.y),s=Math.max(10,z*1.6),col=e.sign>0?'#ff6a6a':'#5ab4ff';c.save();c.translate(X,Y);c.rotate(e.a);c.fillStyle='#1a2236';c.strokeStyle=col;c.lineWidth=2;c.beginPath();c.roundRect(-s*0.7,-s*0.45,s*1.9,s*0.9,s*0.3);c.fill();c.stroke();c.fillStyle=col;c.globalAlpha=0.5+0.5*Math.sin(now*0.01+e.id);c.beginPath();c.arc(s*1.2,0,s*0.22,0,7);c.fill();c.globalAlpha=1;c.restore()}
  // trails and particles
  if(G.trails){c.lineWidth=Math.max(1,z*0.12);for(const p of Q){if(!p.free||p.trail.length<2)continue;c.strokeStyle=p.q>0?'rgba(255,110,110,.35)':'rgba(90,180,255,.35)';c.beginPath();p.trail.forEach(([x,y],i)=>i?c.lineTo(sx(x),sy(y)):c.moveTo(sx(x),sy(y)));c.stroke()}}
  for(const p of Q){if(!p.free)continue;const X=sx(p.x),Y=sy(p.y),r=Math.max(2.2,z*(p.q>0?0.5:0.35));c.fillStyle=p.q>0?'#ff7a7a':'#7cc6ff';c.shadowColor=c.fillStyle;c.shadowBlur=8;c.beginPath();c.arc(X,Y,r,0,7);c.fill();c.shadowBlur=0;if(S.sel&&S.sel.c===p){c.strokeStyle='#ffd23a';c.lineWidth=2;c.beginPath();c.arc(X,Y,r+6,0,7);c.stroke()}}
  for(const q of fixedQ()){const X=sx(q.x),Y=sy(q.y),r=Math.max(7,z*(1+0.22*Math.abs(q.q))),pos=q.q>0;const gr=c.createRadialGradient(X,Y,0,X,Y,r*2.6);gr.addColorStop(0,pos?'rgba(255,90,90,.55)':'rgba(70,160,255,.55)');gr.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gr;c.beginPath();c.arc(X,Y,r*2.6,0,7);c.fill();
    c.fillStyle=pos?'#ff5a5a':'#3a9cff';c.beginPath();c.arc(X,Y,r,0,7);c.fill();c.strokeStyle='#fff';c.lineWidth=Math.max(1.5,r*0.18);c.beginPath();c.moveTo(X-r*0.5,Y);c.lineTo(X+r*0.5,Y);if(pos){c.moveTo(X,Y-r*0.5);c.lineTo(X,Y+r*0.5)}c.stroke();
    if(S.sel&&S.sel.c===q){c.strokeStyle='#ffd23a';c.lineWidth=2;c.beginPath();c.arc(X,Y,r+6,0,7);c.stroke()}}
  if(DRAG&&DRAG.aim){const e=DRAG.aim;c.strokeStyle='rgba(255,255,255,.5)';c.setLineDash([6,6]);c.lineWidth=1.5;c.beginPath();c.moveTo(sx(e.x),sy(e.y));c.lineTo(sx(e.x+Math.cos(e.a)*12),sy(e.y+Math.sin(e.a)*12));c.stroke();c.setLineDash([])}
  if(HOVER&&['bin','bout','erase'].includes(S.tool)){c.strokeStyle='rgba(200,220,255,.6)';c.lineWidth=1.5;c.beginPath();c.arc(sx(HOVER[0]),sy(HOVER[1]),S.brush*z,0,7);c.stroke()}
  for(const p of PARTS){c.strokeStyle=p.col;c.globalAlpha=Math.max(0,1-p.age);c.lineWidth=2;c.beginPath();c.arc(sx(p.x),sy(p.y),z*(p.small?1:2)+p.age*z*3,0,7);c.stroke()}c.globalAlpha=1}
/* ---------- tools ---------- */
function nearObj(x,y,r){let b=null,bd=r;for(const o of [...Q.filter(c=>!c.free),...EM,...TG,...Q.filter(c=>c.free)]){const d=Math.hypot(o.x-x,o.y-y);if(d<bd){bd=d;b=o}}return b}
const kindOf=o=>EM.includes(o)?'em':TG.includes(o)?'tg':'c';
const SIM={id:'flux',name:'Flux',defTool:'pos',world:{w:WW,h:WH,wrapX:false,maxZ:40,followZ:14},home:'atom',freeScen:'blank',tutScen:'blank',defSpeed:2,homeSpeed:2,inspectTab:'insp',canFollow:true,
  speeds:[['¼×',0.25],['½×',0.5],['1×',1],['2×',2]],fmtRate:v=>`${v}× speed`,
  dateTxt:()=>`${S.t.toFixed(1)} s`,dateSub:()=>`${freeQ().length} particles · ${G.hits} target hits`,stepSize:()=>0.02,
  tools:[['',[['select','👆','Inspect'],['move','✋','Move','Drag a charge, gun or target to move it.']]],['Charges',[['pos','➕','Positive','A fixed positive charge. Its strength is set in the Field tab.'],['neg','➖','Negative','A fixed negative charge.'],['proton','🔴','Proton','A free positive particle. Drag to throw it.'],['electron','🔵','Electron','A free negative particle, 4× lighter. Drag to throw it.']]],
    ['Beams',[['gunp','🔫','Proton gun','Click to place, drag to aim. Fires protons.'],['gune','🔫','Electron gun','Click to place, drag to aim. Fires electrons.'],['target','🎯','Target','Click to place a target that catches particles.']]],
    ['Magnets',[['bin','⊗','Magnet in','Paint a magnetic field pointing into the screen.',1],['bout','⊙','Magnet out','Paint a magnetic field pointing out of the screen.',1],['erase','🧽','Erase','Remove anything in the brush.',1]]]],
  scens:SCENLIST,
  load(id){clearLab();(SCENS[id]||SCENS.blank)();syncPanel()},
  after(){if(!$('home').hidden)return;setTool('pos')},
  step(dt){for(const e of EM){if(!e.on)continue;e.t+=dt*e.rate;while(e.t>=1){e.t-=1;const v=G.v*(0.97+Math.random()*0.06),a=e.a+(Math.random()-0.5)*0.03;{const nc=addCharge(e.x+Math.cos(e.a)*2,e.y+Math.sin(e.a)*2,e.sign,true,Math.cos(a)*v,Math.sin(a)*v);if(nc&&e.mm)nc.m=(e.sign>0?1:0.25)*e.mm}G.fired++}}
    stepParticles(dt);if(Q.some(c=>!c.free&&c.moved)){DIRTY=VDIRTY=true}},
  frame(dt){for(const p of PARTS)p.age+=dt*1.4;PARTS=PARTS.filter(p=>p.age<1);for(const p of Q){if(!p.free)continue;const L=p.trail[p.trail.length-1];if(!L||Math.hypot(L[0]-p.x,L[1]-p.y)>0.6){p.trail.push([p.x,p.y]);if(p.trail.length>60)p.trail.shift()}}},
  render,
  stats:()=>[['Particles',freeQ().length],['Charges',fixedQ().length],['Hits',G.hits],['Absorbed',G.absorbed]],
  hud(){const last=HIST[HIST.length-1];if(!last||S.t-last.t>=0.5)HIST.push({t:S.t,n:freeQ().length});if(HIST.length>300)HIST.shift();syncPanel();renderStats();renderInspect()},
  pick(wx,wy){const o=nearObj(wx,wy,2.5);if(!o)return null;const k=kindOf(o);return k==='c'?{c:o}:k==='em'?{e:o}:{t:o}},
  selPos(s){const o=s.c||s.e||s.t;return o&&Q.concat(EM,TG).includes(o)?[o.x,o.y]:null},
  pointer(type,wx,wy){HOVER=[wx,wy];const t=S.tool;
    if(t==='move'){if(type==='down'){const o=nearObj(wx,wy,3);DRAG=o?{obj:o}:null}else if(type==='drag'&&DRAG&&DRAG.obj){const o=DRAG.obj;o.x=clamp(wx,0,WW);o.y=clamp(wy,0,WH);if(o.free){o.vx=o.vy=0}else if(kindOf(o)==='c')DIRTY=VDIRTY=true;MOVED++;chEv('move',{})}else if(type==='up')DRAG=null;return}
    if(t==='bin'||t==='bout'){if(type!=='up'){paintB(wx,wy,S.brush,t==='bin'?1:-1);BPAINT++;chEv('magnet',{})}return}
    if(t==='erase'){if(type==='up')return;const r=S.brush;const n0=Q.length+EM.length+TG.length;Q=Q.filter(c=>Math.hypot(c.x-wx,c.y-wy)>r);EM=EM.filter(c=>Math.hypot(c.x-wx,c.y-wy)>r);TG=TG.filter(c=>Math.hypot(c.x-wx,c.y-wy)>r);paintB(wx,wy,r,0);if(Q.length+EM.length+TG.length<n0){DIRTY=VDIRTY=true}ERASED++;chEv('erase',{});return}
    if(t==='gunp'||t==='gune'){if(type==='down'){const e=addEm(wx,wy,0,t==='gunp'?1:-1);DRAG={aim:e,x0:wx,y0:wy};EMADD++;chEv('gun',{})}else if(type==='drag'&&DRAG&&DRAG.aim){if(Math.hypot(wx-DRAG.x0,wy-DRAG.y0)>0.5)DRAG.aim.a=Math.atan2(wy-DRAG.y0,wx-DRAG.x0)}else if(type==='up')DRAG=null;return}
    if(t==='proton'||t==='electron'){if(type==='down')DRAG={throw:[wx,wy]};else if(type==='up'&&DRAG&&DRAG.throw){const [x0,y0]=DRAG.throw;(t==='proton'?proton:electron)(x0,y0,(wx-x0)*1.5,(wy-y0)*1.5);FREEADD++;chEv('free',{q:t==='proton'?1:-1});DRAG=null}return}
    if(type!=='down')return;
    if(t==='pos'||t==='neg'){addCharge(wx,wy,t==='pos'?G.q:-G.q);PLACED++;chEv('charge',{q:t==='pos'?1:-1});syncPanel();return}
    if(t==='target'){addTg(wx,wy,3);TGADD++;chEv('target',{});return}},
  hover(wx,wy){HOVER=[wx,wy]},
  find(q){const out=[],add=(label,sub,go)=>out.push({label,sub,go});const fly=s=>()=>{S.sel=s;const o=s.c||s.e||s.t;flyToW(o.x,o.y,14);showTab('insp')};
    if('positive charge plus'.includes(q))fixedQ().filter(c=>c.q>0).slice(0,3).forEach(c=>add(`➕ Positive charge (+${c.q})`,'',fly({c})));
    if('negative charge minus'.includes(q))fixedQ().filter(c=>c.q<0).slice(0,3).forEach(c=>add(`➖ Negative charge (${c.q})`,'',fly({c})));
    if('electron particle'.includes(q)){const p=freeQ().find(p=>p.q<0);if(p)add('🔵 An electron','follow it',()=>{S.sel={c:p};S.follow=true;flyToW(p.x,p.y,14)})}
    if('proton particle'.includes(q)){const p=freeQ().find(p=>p.q>0);if(p)add('🔴 A proton','follow it',()=>{S.sel={c:p};S.follow=true;flyToW(p.x,p.y,14)})}
    if('gun emitter beam'.includes(q))EM.forEach(e=>add(`🔫 ${e.sign>0?'Proton':'Electron'} gun`,'',fly({e})));if('target'.includes(q))TG.forEach(t=>add('🎯 Target',`${t.hits} hits`,fly({t})));
    for(const [,items] of SIM.tools)for(const [id,ico,name] of items)if(id!=='select'&&name.toLowerCase().includes(q))add(`${ico} ${name}`,'tool',()=>setTool(id));
    for(const s of SCENLIST)if(s.name.toLowerCase().includes(q))add('Lab: '+s.name,s.desc,()=>{loadScen(s.id);toast(s.name)});return out},
  tabShown(id){if(id==='stats')renderStats(true)},selChanged(){renderInspect()},
};
function kv(rows){return rows.map(([k,v])=>`<div><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}
function renderStats(force){if($('pane-stats').hidden&&!force)return;const P=freeQ();$('cStats').innerHTML=kv([['Protons',P.filter(p=>p.q>0).length],['Electrons',P.filter(p=>p.q<0).length],['Fired by guns',G.fired],['Target hits',G.hits],['Absorbed by charges',G.absorbed],['Flew away',G.escaped]]);
  const g=$('graph'),gc=g.getContext('2d'),w=g.width=g.clientWidth*DPR,hh=g.height=g.clientHeight*DPR;gc.clearRect(0,0,w,hh);if(HIST.length>1){const t0=HIST[0].t,t1=HIST[HIST.length-1].t,m=Math.max(5,...HIST.map(p=>p.n));gc.strokeStyle='#5ae0ff';gc.lineWidth=2*DPR;gc.beginPath();HIST.forEach((p,i)=>{const x=8+(w-16)*(p.t-t0)/Math.max(1e-6,t1-t0),y=hh-6-(hh-12)*p.n/m;i?gc.lineTo(x,y):gc.moveTo(x,y)});gc.stroke()}
  const L=$('tList');L.textContent='';for(const t of TG){const r=document.createElement('button');r.className='sprow';r.innerHTML='<i></i><span>🎯 Target</span><b></b>';r.children[0].style.background='#ffd23a';r.children[2].textContent=`${t.hits} hits`;r.onclick=()=>{S.sel={t};flyToW(t.x,t.y,14);showTab('insp')};L.appendChild(r)}}
// mass: anything can be made heavier or lighter; a pinned charge has endless mass (it never moves)
const fmtMass=m=>m>=1e8?'∞':m>=100?m.toFixed(0):m>=1?(+m.toFixed(2)).toString():m>=0.01?(+m.toFixed(3)).toString():m.toExponential(1);
function massUI(id,m,pinned){const v=pinned?3:Math.log10(Math.max(0.01,Math.min(1000,m)));return`<div class="sl"><div class="row"><span class="k">Mass</span><span id="${id}V">${pinned?'∞ (pinned)':fmtMass(m)}</span></div><input type="range" id="${id}" min="-2" max="3" step="0.05" value="${v}"></div>`}
function renderInspect(){const s=S.sel;$('inspEmpty').hidden=!!s;$('inspBody').hidden=!s;if(!s)return;const body=$('inspBody');
  if(s.c){const c=s.c;if(!Q.includes(c)){body.innerHTML=`<h2 class="ititle">Particle gone</h2><p class="note">It was ${c.cause==='absorbed'?'absorbed by an opposite charge':c.cause==='target'?'caught by a target':'flung out of the lab'}.</p>`;return}const [ex,ey]=E(c.x,c.y,c);
    if(c.free)body.innerHTML=`<h2 class="ititle" style="color:${c.q>0?'#ff7a7a':'#7cc6ff'}">${c.q>0?'🔴 Proton':'🔵 Electron'}</h2><div class="isub">Free particle</div><div class="kv">${kv([['Charge',c.q>0?'+1':'−1'],['Mass',fmtMass(c.m)],['Speed',Math.hypot(c.vx,c.vy).toFixed(1)],['Field here',Math.hypot(ex,ey).toFixed(2)],['Magnet here',Bat(c.x,c.y).toFixed(2)],['Turned',(Math.abs(c.turn)/(2*Math.PI)).toFixed(1)+' circles'],['Age',c.age.toFixed(1)+' s']])}</div>${massUI('cM',c.m,false)}<div class="actions"><button class="btn" id="mUp">Heavier ×2</button><button class="btn" id="mDn">Lighter ÷2</button><button class="btn" id="mPin">Pin in place</button></div>`;
    else body.innerHTML=`<h2 class="ititle" style="color:${c.q>0?'#ff5a5a':'#3a9cff'}">${c.q>0?'➕ Positive':'➖ Negative'} charge</h2><div class="isub">Fixed in place</div><div class="kv">${kv([['Charge',(c.q>0?'+':'')+c.q],['Voltage here',V(c.x+1.5,c.y).toFixed(0)],['Particles absorbed',c.absorbed]])}</div><div class="actions"><button class="btn" id="qUp">Stronger</button><button class="btn" id="qDn">Weaker</button><button class="btn" id="qFl">Flip</button></div>${massUI('cM',c.m,true)}<div class="actions"><button class="btn" id="mFree">Let it move (mass 10)</button></div>`;
    {const sl=$('cM'),setM=m=>{const was=c.free;c.m=Math.max(0.01,Math.min(1000,m));if(!c.free){c.free=true;c.vx=c.vy=0;DIRTY=VDIRTY=true}(MASSCH++,chEv('mass',{}));if(!was)toast('Charge set free: it now moves with mass '+fmtMass(c.m));renderInspect()};
      if(sl){sl.oninput=e=>{const m=Math.pow(10,+e.target.value);if(c.free||+e.target.value<3){if(!c.free&&+e.target.value>=2.99)return;c.m=m;if(!c.free){c.free=true;c.vx=c.vy=0;DIRTY=VDIRTY=true}$('cMV').textContent=fmtMass(c.m);(MASSCH++,chEv('mass',{}))}};sl.onchange=()=>renderInspect()}
      if($('mUp'))$('mUp').onclick=()=>setM(c.m*2);if($('mDn'))$('mDn').onclick=()=>setM(c.m/2);if($('mFree'))$('mFree').onclick=()=>setM(10);
      if($('mPin'))$('mPin').onclick=()=>{c.free=false;c.m=1e9;c.vx=c.vy=0;DIRTY=VDIRTY=true;(MASSCH++,chEv('mass',{}));toast('Pinned in place (endless mass)');renderInspect()}}
    if(!c.free){$('qUp').onclick=()=>{c.q+=Math.sign(c.q);DIRTY=VDIRTY=true;renderInspect()};$('qDn').onclick=()=>{if(Math.abs(c.q)>1)c.q-=Math.sign(c.q);DIRTY=VDIRTY=true;renderInspect()};$('qFl').onclick=()=>{c.q=-c.q;DIRTY=VDIRTY=true;chEv('flip',{});renderInspect()}}return}
  if(s.e){const e=s.e;body.innerHTML=`<h2 class="ititle">🔫 ${e.sign>0?'Proton':'Electron'} gun</h2><div class="kv">${kv([['Aim',Math.round(e.a*180/Math.PI)+'°'],['Rate',e.rate+' per second']])}</div>${massUI('eM',(e.sign>0?1:0.25)*(e.mm||1),false)}<div class="actions"><button class="btn" id="eOn">${e.on?'Turn off':'Turn on'}</button><button class="btn" id="eFast">Faster</button><button class="btn" id="eSlow">Slower</button></div>`;$('eOn').onclick=()=>{e.on=!e.on;renderInspect()};$('eM').oninput=ev=>{const m=Math.pow(10,+ev.target.value);e.mm=m/(e.sign>0?1:0.25);$('eMV').textContent=fmtMass(m);(MASSCH++,chEv('mass',{}))};$('eFast').onclick=()=>{e.rate=Math.min(12,e.rate*1.5);renderInspect()};$('eSlow').onclick=()=>{e.rate=Math.max(0.3,e.rate/1.5);renderInspect()};return}
  if(s.t){body.innerHTML=`<h2 class="ititle">🎯 Target</h2><div class="kv">${kv([['Hits',s.t.hits]])}</div>`}}
