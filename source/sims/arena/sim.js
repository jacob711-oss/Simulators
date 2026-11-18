/* ================= Arena: every sport in one stadium ================= */
// The stadium is 140 x 92 units. Each sport sets how many metres one unit is (m), so speeds and distances stay true to life.
const WW=140,WH=92,CX=70,CY=46;
const NM1=['Ari','Bex','Cato','Dax','Eli','Fen','Gus','Hal','Ida','Jax','Kai','Lux','Milo','Nia','Oli','Pax','Quin','Rio','Sol','Tay','Uma','Vik','Wren','Yuri','Zed','Ash','Bo','Cy','Dee','Ezra','Noor','Remy','Suki','Tomas','Ines','Kofi','Lena','Mateo','Priya','Sami'];
const NM2=['Hart','Vale','Stone','Brook','Fox','Reed','Lake','Frost','Moss','Kerr','Wolfe','Drake','Pike','Shaw','Rowe','Lyle','Marsh','Penn','Quill','Sage','Okoro','Silva','Tanaka','Novak','Ruiz','Ahmed','Kowal','Mbeki','Varga','Lund'];
let SP='football',P=[],PID=0,CTRL=-1;
let B={x:CX,y:CY,z:0,vx:0,vy:0,vz:0,own:-1,lt:0,lp:-1,kt:0,bn:0,fly:null,sv:-1,shot:0};
let M={sc:[0,0]};
let TEAMS=[{nm:'Red Comets',sh:'RED',col:'#ff5a4e',dk:'#6e1a14'},{nm:'Blue Harbour',sh:'BLU',col:'#3fa2ff',dk:'#0f3a66'}];
const G={autoSw:false,sk:[70,70],tac:1,ctrl:true,loft:false,overs:3,wind:0,club:'auto',gcam:true,auto:true};
let EVC={};
let HEAT=[new Float32Array(56*37),new Float32Array(56*37)],HIST=[];
let FR={x0:0,x1:0,y0:0,y1:0};
let PARTS=[],HOVER=null,DRAG={keys:new Set(),ptr:null,up:null,act:0,idle:9,taps:0,mv:null};
const isYou=p=>!!p&&p.id===CTRL&&G.ctrl&&DRAG.idle<5;
const ev=(k,n)=>{EVC[k]=(EVC[k]||0)+(n||1)};
const evc=k=>EVC[k]||0;
const sc=()=>SC[SP];
const byId=id=>{for(const p of P)if(p.id===id)return p;return null};
const gauss=()=>{let u=0;for(let i=0;i<4;i++)u+=Math.random();return (u-2)*1.2};
const SC={};const ENG={};
function setRect(){const s=sc();FR={x0:CX-s.L/2,x1:CX+s.L/2,y0:CY-s.Wd/2,y1:CY+s.Wd/2}}
function mkPlayer(t,role,x,y,o){const s=sc(),sk=clamp(G.sk[t]/100+rr(-.08,.08),.15,1);
  return Object.assign({id:PID++,t,role,n:0,nm:pick(NM1)+' '+pick(NM2),x,y,vx:0,vy:0,fx:t?-1:1,fy:0,tx:x,ty:y,mul:0,sk,spd:(s.spd||8)*(0.88+0.2*sk)*rr(.96,1.04),st:1,dist:0,tch:0,pts:0,pas:0,tk:0,down:0,cd:rr(0,.3),h:s.ph||2,sw:0},o||{})}
function newMatch(){return{sc:[0,0],clk:0,per:1,state:'play',dt:0,rs:null,poss:[0,0],shots:[0,0],pas:[0,0],tk:[0,0],msg:'',over:false,overT:0}}
function addScore(t,n,label,p,x,y){M.sc[t]+=n;if(p){p.pts+=n}callout(label,x??B.x,y??B.y-4,TEAMS[t].col);burst(x??B.x,y??B.y,TEAMS[t].col);
  ev('score'+t,n);if(t===0&&isYou(p))ev('youScore',n);chEv('score',{t,n,sp:SP,you:isYou(p)});HIST.push({t:S.t,a:M.sc[0],b:M.sc[1]})}
function callout(text,x,y,col){PARTS.push({k:'txt',text,x,y,col:col||'#fff',age:0})}
function burst(x,y,col){PARTS.push({k:'ring',x,y,col:col||'#fff',age:0})}
function say(m){M.msg=m}
/* ---------- moving players ---------- */
function steer(p,tx,ty,mul,dt){p.tx=tx;p.ty=ty;p.mul=mul;const dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy);let sp=p.spd*mul*(0.72+0.28*p.st);if(d<2.5)sp*=d/2.5;
  const wx=d>1e-3?dx/d*sp:0,wy=d>1e-3?dy/d*sp:0,a=(sc().acc||14)*dt,ax=wx-p.vx,ay=wy-p.vy,am=Math.hypot(ax,ay);if(am>a){p.vx+=ax/am*a;p.vy+=ay/am*a}else{p.vx=wx;p.vy=wy}}
function moveAll(dt,keepIn){const s=sc(),n=P.length,sep=(s.pr||1.3)*1.6;
  for(let i=0;i<n;i++){const a=P[i];if(a.off)continue;for(let j=i+1;j<n;j++){const b=P[j];if(b.off)continue;const dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy;if(d2<sep*sep&&d2>1e-6){const d=Math.sqrt(d2),f=(sep-d)/d*0.5*Math.min(1,dt*10);a.x-=dx*f;a.y-=dy*f;b.x+=dx*f;b.y+=dy*f}}}
  for(const p of P){if(p.off)continue;if(p.down>0){p.down-=dt;p.vx*=0.85;p.vy*=0.85}
    const sp=Math.hypot(p.vx,p.vy);p.x+=p.vx*dt;p.y+=p.vy*dt;p.dist+=sp*dt*(s.m||1);if(sp>0.3){p.fx=p.vx/sp;p.fy=p.vy/sp}
    p.st=clamp(p.st+(p.mul>0.85&&sp>p.spd*0.6?-0.010:0.006)*dt,0.25,1);
    if(keepIn){const k=keepIn;p.x=clamp(p.x,k.x0,k.x1);p.y=clamp(p.y,k.y0,k.y1)}
    const hx=clamp(Math.floor(p.x/2.5),0,55),hy=clamp(Math.floor(p.y/2.5),0,36);HEAT[p.t][hy*56+hx]+=dt}}
/* ---------- your controls: arrows/WASD to run, Space and E for actions, or the mouse/finger ---------- */
const ctrlOn=()=>G.ctrl&&S.tool==='ctrl'&&$('home').hidden;
addEventListener('keydown',e=>{if(!ctrlOn())return;const t=e.target.tagName;if(t==='INPUT'||t==='SELECT'||t==='TEXTAREA')return;const k=e.key.toLowerCase();
  if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d',' ','e','l','q'].includes(k)){e.preventDefault();e.stopImmediatePropagation();if(!DRAG.keys.has(k)){DRAG.keys.add(k);DRAG.idle=0;DRAG.taps++;if(k===' ')DRAG.act=1;else if(k==='e')DRAG.act=2;else if(k==='l')toggleLoft();else if(k==='q')DRAG.act=3}}},true);
addEventListener('keyup',e=>DRAG.keys.delete(e.key.toLowerCase()),true);
addEventListener('blur',()=>DRAG.keys.clear());
function ctrlMove(){const k=DRAG.keys;let dx=0,dy=0;if(k.has('a')||k.has('arrowleft'))dx--;if(k.has('d')||k.has('arrowright'))dx++;if(k.has('w')||k.has('arrowup'))dy--;if(k.has('s')||k.has('arrowdown'))dy++;
  if(dx||dy){const d=Math.hypot(dx,dy);return{dx:dx/d,dy:dy/d}}if(DRAG.ptr&&DRAG.ptr.hold)return{to:[DRAG.ptr.x,DRAG.ptr.y]};return null}
function toggleLoft(){G.loft=!G.loft;toast(G.loft?'Lofted shots: the ball goes up in the air':'Ground shots: the ball stays low');syncPanel()}
/* ---------- loading a sport ---------- */
function loadSport(id){if(!SC[id])id='football';SP=id;P=[];PID=0;CTRL=-1;PARTS=[];HIST=[{t:0,a:0,b:0}];EVC={};HEAT=[new Float32Array(56*37),new Float32Array(56*37)];
  B={x:CX,y:CY,z:0,vx:0,vy:0,vz:0,own:-1,lt:0,lp:-1,kt:0,bn:0,fly:null,sv:-1,shot:0};M=newMatch();setRect();ENG[sc().eng].setup();buildSportOpts();syncPanel()}
/* ---------- drawing ---------- */
const Z=()=>cam.z;
function lift(z){return z*cam.z*0.55}
function crowd(c){const s=sc(),pad=s.stand||6,x0=FR.x0-pad-9,x1=FR.x1+pad+9,y0=FR.y0-pad-9,y1=FR.y1+pad+9,z=Z();
  const g=c.createLinearGradient(0,sy(y0),0,sy(y1));g.addColorStop(0,'#1b1e27');g.addColorStop(0.5,'#232734');g.addColorStop(1,'#1b1e27');c.fillStyle=g;c.beginPath();c.roundRect(sx(x0),sy(y0),(x1-x0)*z,(y1-y0)*z,5*z);c.fill();
  c.strokeStyle='rgba(255,255,255,.05)';c.lineWidth=Math.max(1,z*0.12);for(let k=1;k<5;k++){const e=k*1.8;c.beginPath();c.roundRect(sx(x0+e),sy(y0+e),(x1-x0-2*e)*z,(y1-y0-2*e)*z,Math.max(0,5-e*0.5)*z);c.stroke()}
  c.fillStyle=s.apron||'#1d2a1f';c.beginPath();c.roundRect(sx(FR.x0-pad),sy(FR.y0-pad),(FR.x1-FR.x0+pad*2)*z,(FR.y1-FR.y0+pad*2)*z,2*z);c.fill();
  if(z<2.5)return;const cols=['#b85a50','#d9d4c8','#5a86c4','#d6b95a','#7c8094','#5fa078','#c98a5c'];let k=7;const r=z*0.45;c.globalAlpha=0.7;
  for(let ci=0;ci<cols.length;ci++){c.fillStyle=cols[ci];c.beginPath();k=ci*977+13;
    for(let y=y0+1.2,row=0;y<y1-0.6;y+=1.7,row++)for(let x=x0+1.2+(row%2)*0.85;x<x1-0.6;x+=1.7){if(x>FR.x0-pad-0.6&&x<FR.x1+pad+0.6&&y>FR.y0-pad-0.6&&y<FR.y1+pad+0.6)continue;const h=((Math.floor(x*7.3)*73856093)^(Math.floor(y*5.1)*19349663))>>>0;if(h%7!==ci)continue;c.moveTo(sx(x)+r,sy(y));c.arc(sx(x),sy(y),r,0,7)}c.fill()}c.globalAlpha=1}
function line(c,pts,col,w){c.strokeStyle=col;c.lineWidth=Math.max(1,w*Z());c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(sx(x),sy(y)):c.moveTo(sx(x),sy(y)));c.stroke()}
function rectL(c,x0,y0,x1,y1,col,w){line(c,[[x0,y0],[x1,y0],[x1,y1],[x0,y1],[x0,y0]],col,w)}
function circL(c,x,y,r,col,w,a0,a1){c.strokeStyle=col;c.lineWidth=Math.max(1,w*Z());c.beginPath();c.arc(sx(x),sy(y),r*Z(),a0||0,a1??Math.PI*2);c.stroke()}
function fillR(c,x0,y0,x1,y1,col){c.fillStyle=col;c.fillRect(sx(x0),sy(y0),(x1-x0)*Z(),(y1-y0)*Z())}
function stripes(c,col1,col2,n,vertical){const w=(FR.x1-FR.x0)/n;for(let i=0;i<n;i++)fillR(c,FR.x0+i*w,FR.y0,FR.x0+(i+1)*w,FR.y1,i%2?col1:col2)}
function drawBall(c,x,y,z,r,col){const X=sx(x),Y=sy(y),R=Math.max(2,r*Z()*(1+z*0.015));c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(X+lift(z)*0.25,Y,R*1.05,R*0.6,0,0,7);c.fill();
  const Yb=Y-lift(z);c.fillStyle=col||'#fff';c.strokeStyle='rgba(0,0,0,.6)';c.lineWidth=1;c.beginPath();c.arc(X,Yb,R,0,7);c.fill();c.stroke();return[X,Yb]}
function drawPlayer(c,p){const s=sc(),T=TEAMS[p.t],X=sx(p.x),Y=sy(p.y),R=Math.max(3,(s.pr||1.3)*Z());if(p.off)return;
  c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(X+R*0.25,Y+R*0.35,R*1.05,R*0.65,0,0,7);c.fill();
  if(p.down>0){c.fillStyle=T.col;c.beginPath();c.ellipse(X,Y,R*1.3,R*0.6,Math.atan2(p.fy,p.fx),0,7);c.fill();return}
  if(s.tool){c.strokeStyle=s.tool;c.lineWidth=Math.max(1.5,R*0.25);c.beginPath();c.moveTo(X+p.fx*R*0.6-p.fy*R*0.7,Y+p.fy*R*0.6+p.fx*R*0.7);c.lineTo(X+p.fx*R*1.9-p.fy*R*0.9,Y+p.fy*R*1.9+p.fx*R*0.9);c.stroke()}
  c.fillStyle=p.role==='GK'||p.role==='WK'||p.role==='CAT'?T.dk:T.col;c.strokeStyle=p.id===CTRL&&G.ctrl?'#ffe14a':'rgba(0,0,0,.65)';c.lineWidth=p.id===CTRL&&G.ctrl?Math.max(2,R*0.28):1.2;
  c.beginPath();c.arc(X,Y,R,0,7);c.fill();c.stroke();c.fillStyle='rgba(255,255,255,.85)';c.beginPath();c.arc(X+p.fx*R*0.55,Y+p.fy*R*0.55,R*0.28,0,7);c.fill();
  if(R>9){c.fillStyle='#fff';c.font=`700 ${Math.round(R*0.9)}px "IBM Plex Mono",monospace`;c.textAlign='center';c.textBaseline='middle';c.fillText(p.n,X,Y+1);c.textBaseline='alphabetic'}
  if(p.id===CTRL&&G.ctrl){c.fillStyle='#ffe14a';c.beginPath();c.moveTo(X,Y-R-3);c.lineTo(X-5,Y-R-11);c.lineTo(X+5,Y-R-11);c.fill()}
  if(S.sel&&S.sel.p===p.id){c.strokeStyle='#fff';c.lineWidth=2;c.beginPath();c.arc(X,Y,R+5,0,7);c.stroke()}}
function drawParts(c){for(const p of PARTS){const a=Math.max(0,1-p.age/ (p.k==='txt'?2.2:1));c.globalAlpha=a;
    if(p.k==='txt'){c.fillStyle=p.col;c.strokeStyle='rgba(0,0,0,.7)';c.lineWidth=4;c.font=`800 ${Math.round(clamp(Z()*3.2,18,44))}px Oxanium,sans-serif`;c.textAlign='center';const Y=sy(p.y)-p.age*30;c.strokeText(p.text,sx(p.x),Y);c.fillText(p.text,sx(p.x),Y)}
    else{c.strokeStyle=p.col;c.lineWidth=3;c.beginPath();c.arc(sx(p.x),sy(p.y),(1+p.age*8)*Z(),0,7);c.stroke()}}c.globalAlpha=1}
let HEATC=null;
function drawHeat(c){if(!HEATC){HEATC=document.createElement('canvas');HEATC.width=56;HEATC.height=37}const hc=HEATC.getContext('2d'),img=hc.createImageData(56,37),d=img.data;const m=[Math.max(1e-3,...HEAT[0]),Math.max(1e-3,...HEAT[1])];
  const rgb=TEAMS.map(T=>[1,3,5].map(i=>parseInt(T.col.slice(i,i+2),16)));for(let i=0;i<56*37;i++){const a=Math.min(1,HEAT[0][i]/m[0]),b=Math.min(1,HEAT[1][i]/m[1]),t=a+b||1;for(let k=0;k<3;k++)d[i*4+k]=(rgb[0][k]*a+rgb[1][k]*b)/t;d[i*4+3]=Math.min(1,Math.max(a,b)*1.4)*170}
  hc.putImageData(img,0,0);c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.filter=`blur(${Math.max(2,Z()*1.6)}px)`;c.drawImage(HEATC,sx(0),sy(0),56*2.5*Z(),37*2.5*Z());c.restore()}
function render(c,now){c.fillStyle='#0b0d12';c.fillRect(0,0,W,H);const E=ENG[sc().eng];crowd(c);if(E.field)E.field(c);else if(sc().field)sc().field(c);
  if(S.view==='heat')drawHeat(c);
  if(S.view==='tactics'){c.setLineDash([4,4]);for(const p of P){if(p.off)continue;line(c,[[p.x,p.y],[p.tx,p.ty]],TEAMS[p.t].col,0.12)}c.setLineDash([])}
  E.draw(c,now);drawParts(c);
  if(DRAG.mv&&DRAG.mv.kick){const k=DRAG.mv;c.setLineDash([6,5]);line(c,[[k.x0,k.y0],[k.x1,k.y1]],'#ffe14a',0.18);c.setLineDash([])}}
/* ---------- panel ---------- */
const SPORTLIST=()=>Object.keys(SC).map(id=>({id,name:SC[id].nm,desc:SC[id].desc}));
function buildSportOpts(){const box=$('spOpts');if(!box)return;box.innerHTML=(ENG[sc().eng].opts||(()=>''))();box.querySelectorAll('[data-opt]').forEach(el=>{const f=()=>{ENG[sc().eng].opt(el.dataset.opt,el);syncPanel()};el.oninput=f;if(el.tagName==='BUTTON')el.onclick=f})}
function syncPanel(){if(!$('sb'))return;const E=ENG[sc().eng];$('sb').innerHTML=E.sb();$('sk0V').textContent=G.sk[0];$('sk1V').textContent=G.sk[1];$('sk0L').textContent=TEAMS[0].nm+' skill';$('sk1L').textContent=TEAMS[1].nm+' skill';
  $('ctrlBtn').textContent=G.ctrl?'On':'Off';if($('autoSwBtn')){$('autoSwBtn').textContent=G.autoSw?'On':'Off';$('autoSwBtn').setAttribute('aria-pressed',G.autoSw);$('swRow').hidden=sc().eng!=='inv'}$('ctrlBtn').setAttribute('aria-pressed',G.ctrl);$('ctrlL').textContent='You play for '+TEAMS[0].nm;
  document.querySelectorAll('[data-tac]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.tac===G.tac));$('spSel').value=SP;$('msg').textContent=M.msg||'';$('tacRow').hidden=!E.tactics;
  if(E.sync)E.sync()}
function initPanel(){const sel=$('spSel');sel.innerHTML=Object.keys(SC).map(id=>`<option value="${id}">${SC[id].nm}</option>`).join('');sel.onchange=()=>{loadScen(sel.value);chEv('sport',{sp:sel.value});toast(SC[sel.value].nm)};
  $('sk0').oninput=e=>{G.sk[0]=+e.target.value;for(const p of P)if(p.t===0)p.sk=clamp(G.sk[0]/100+rr(-.06,.06),.15,1);syncPanel()};
  $('sk1').oninput=e=>{G.sk[1]=+e.target.value;for(const p of P)if(p.t===1)p.sk=clamp(G.sk[1]/100+rr(-.06,.06),.15,1);syncPanel()};
  $('ctrlBtn').onclick=()=>{G.ctrl=!G.ctrl;if(G.ctrl)setTool('ctrl');else if(S.tool==='ctrl')setTool('select');syncPanel()};
  document.querySelectorAll('[data-tac]').forEach(b=>b.onclick=()=>{G.tac=+b.dataset.tac;chEv('tactic',{v:G.tac});ev('tactic');syncPanel()});
  document.querySelectorAll('[data-ev]').forEach(b=>b.onclick=()=>{const k=b.dataset.ev;ev('act_'+k);chEv('act',{k});
    if(k==='restart'){loadScen(SP);toast('New match')}else if(k==='fresh'){for(const p of P)p.st=1;toast('Fresh legs for everyone')}else if(k==='follow'){S.sel={ball:1};S.follow=true;cam.z=Math.max(cam.z,SIM.world.followZ);toast('Following the ball')}
    else if(k==='swap'){TEAMS.reverse();const a=G.sk[0];G.sk[0]=G.sk[1];G.sk[1]=a;$('sk0').value=G.sk[0];$('sk1').value=G.sk[1];loadScen(SP);toast('You now play for '+TEAMS[0].nm)}
    else if(k==='next'&&ENG[sc().eng].next){ENG[sc().eng].next()}syncPanel()})}
function kv(rows){return rows.map(([k,v])=>`<div><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}
function renderStats(force){if($('pane-stats').hidden&&!force)return;const E=ENG[sc().eng];$('cStats').innerHTML=kv(E.stats());
  const g=$('graph'),gc=g.getContext('2d'),w=g.width=g.clientWidth*DPR,hh=g.height=g.clientHeight*DPR;gc.clearRect(0,0,w,hh);
  if(HIST.length>1){const t0=HIST[0].t,t1=Math.max(t0+1,S.t),m=Math.max(1,...HIST.map(h=>Math.max(h.a,h.b)));for(const [k,col] of [['a',TEAMS[0].col],['b',TEAMS[1].col]]){gc.strokeStyle=col;gc.lineWidth=2*DPR;gc.beginPath();let py=null;
      HIST.concat([{t:S.t,a:M.sc[0],b:M.sc[1]}]).forEach((h,i)=>{const x=8+(w-16)*(h.t-t0)/(t1-t0),y=hh-6-(hh-12)*h[k]/m;if(i){gc.lineTo(x,py);gc.lineTo(x,y)}else gc.moveTo(x,y);py=y});gc.stroke()}}
  const L=$('pList');L.textContent='';const ps=P.filter(p=>!p.off||p.bat).slice().sort((a,b)=>a.t-b.t||b.pts-a.pts);for(const p of ps.slice(0,40)){const r=document.createElement('button');r.className='sprow'+(p.pts?'':' zero');r.innerHTML='<i></i><span></span><b></b>';r.children[0].style.background=TEAMS[p.t].col;r.children[1].textContent=`${p.n?'#'+p.n+' ':''}${p.nm}${p.role?' · '+p.role:''}`;r.children[2].textContent=p.pts+' '+(sc().ptsName||'pts');r.onclick=()=>{S.sel={p:p.id};flyToW(p.x,p.y,12);showTab('insp')};L.appendChild(r)}}
function renderInspect(){const e=$('inspEmpty'),b=$('inspBody');if(!e)return;const s=S.sel;if(!s){e.hidden=false;b.hidden=true;return}e.hidden=true;b.hidden=false;
  if(s.ball){const sp=Math.hypot(B.vx,B.vy,B.vz)*(sc().m||1)*3.6;const o=B.own>=0?byId(B.own):null;b.innerHTML=`<h3>${sc().ballName||'The ball'}</h3>`+kv([['Speed',fmtN(sp)+' km/h'],['Height',fmtN(B.z*(sc().m||1),1)+' m'],['With',o?o.nm:'nobody'],['Last touch',TEAMS[B.lt]?TEAMS[B.lt].nm:'']]);return}
  const p=byId(s.p);if(!p){S.sel=null;return}const T=TEAMS[p.t];const m=sc().m||1;
  b.innerHTML=`<h3 style="color:${T.col}">${p.n?'#'+p.n+' ':''}${p.nm}</h3><p class="note">${T.nm} · ${roleName(p.role)}${p.id===CTRL&&G.ctrl?' · you control this player':''}</p>`+kv([['Skill',Math.round(p.sk*100)],['Top speed',fmtN(p.spd*m*3.6)+' km/h'],['Stamina',Math.round(p.st*100)+'%'],['Distance',fmtN(p.dist)+' m'],['Touches',p.tch],[(sc().ptsName||'Points').replace(/^./,c=>c.toUpperCase()),p.pts]].concat(ENG[sc().eng].insp?ENG[sc().eng].insp(p):[]))+
    `<div class="evs" style="margin-top:8px"><button class="btn" id="iFollow">Follow</button>${p.t===0&&ENG[sc().eng].canCtrl?'<button class="btn" id="iCtrl">Control this player</button>':''}</div>`;
  $('iFollow').onclick=()=>{S.follow=true;cam.z=Math.max(cam.z,SIM.world.followZ)};if($('iCtrl'))$('iCtrl').onclick=()=>{G.ctrl=true;CTRL=p.id;DRAG.lock=S.t+4;setTool('ctrl');syncPanel()}}
const ROLES={GK:'Goalkeeper',D:'Defender',M:'Midfielder',F:'Forward',G:'Guard',C:'Centre',W:'Wing',P:'Pivot',BK:'Back',FW:'Forward',WK:'Wicket-keeper',BWL:'Bowler',BAT:'Batter',FLD:'Fielder',S:'Setter',H:'Hitter',L:'Libero',PL:'Player',GO:'Golfer',RUN:'Athlete',SWIM:'Swimmer','1B':'First base','2B':'Second base','3B':'Third base',SS:'Shortstop',LF:'Left field',CF:'Centre field',RF:'Right field',PIT:'Pitcher',CAT:'Catcher'};
const roleName=r=>ROLES[r]||r||'Player';
