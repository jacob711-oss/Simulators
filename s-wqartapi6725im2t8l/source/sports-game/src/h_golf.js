
/* ================= golf ================= */
function golfAdapter(){const N=M.len,R=rng(hashStr('golf'+M.lvl+CFG.diff));const PARS=[4,3,5,4,4,3,4,5,4,4,5,3,4,4,3,5,4,4];
 const holes=[];for(let i=0;i<N;i++){const par=PARS[(i+M.lvl)%18];const len=par===3?140+R()*60:par===4?320+R()*100:470+R()*80;holes.push({par,len:Math.round(len),dog:(R()-.5)*2*(par===3?.2:1),water:R()<.45?(R()<.5?-1:1):0,wy:.35+R()*.3,bunk:[[(R()-.5)*30,len-22-R()*10],[(R()-.5)*26,len*(.55+R()*.15)]],seed:R()})}
 const CLUBS=[{n:'Driver',m:240},{n:'3-Wood',m:215},{n:'5-Iron',m:175},{n:'7-Iron',m:150},{n:'9-Iron',m:125},{n:'Wedge',m:95},{n:'Sand wedge',m:60},{n:'Chip',m:30}];
 const rivals=[0,1,2].map(i=>{const c=COUNTRIES.filter(x=>x.code!==country().code)[(M.lvl*3+i*11)%(COUNTRIES.length-1)];const nm=genSquad('golf',c,CFG.gender,1)[0].n;return{n:nm,c,tot:0,cards:[]}});
 rivals[0].c=M.opp;rivals[0].n=M.squadB[0].n;
 const ad={h:0,strokes:0,tot:0,card:[],ball:null,trail:[],wind:0,windY:0,lie:'tee',putt:null,done:false};
 const H=()=>holes[ad.h];
 const cxAt=(h,y)=>Math.sin(clamp(y/h.len,0,1)*Math.PI)*h.dog*28;
 const par=()=>holes.slice(0,ad.done?N:ad.h).reduce((s,h)=>s+h.par,0);
 const toPar=n=>n===0?'E':n>0?'+'+n:''+n;
 ad.scoreText=()=>toPar(ad.tot-par())+' | '+toPar(Math.min(...rivals.map(r=>r.tot-r.cards.reduce((s,_,i)=>s+holes[i].par,0))));
 ad.clock=()=>ad.done?'FINAL':'HOLE '+(ad.h+1)+' • PAR '+H().par;
 ad.sub=()=>{if(ad.done)return'Round complete';const d=ad.ball?Math.round(Math.hypot(ad.ball.x-0,H().len-ad.ball.y)):H().len;const lb=[{n:M.cA+' (you)',v:ad.tot-par()}].concat(rivals.map(r=>({n:r.c.code,v:r.tot-r.cards.reduce((s,_,i)=>s+holes[i].par,0)}))).sort((a,b)=>a.v-b.v);
  return`${H().len} m • Stroke ${ad.strokes+1} • ${d} m to pin • Wind ${Math.abs(ad.wind)} m/s ${ad.wind<0?'←':ad.wind>0?'→':''} • ${lb.map(x=>x.n+' '+toPar(x.v)).join('  ')}`};
 ad.winP=()=>{const left=N-ad.h;let w=0;const n=300,sk=clamp((M.oR-45)/55,.1,1),us=clamp((M.uR-45)/55,.1,1.2);const myCur=ad.tot-par()+(ad.done?0:Math.max(0,ad.strokes-H().par*.5));
  for(let i=0;i<n;i++){let me=myCur;for(let h=0;h<left;h++)me+=golfDelta(us);let best=99;rivals.forEach(r=>{let v=r.tot-r.cards.reduce((s,_,j)=>s+holes[j].par,0);for(let h=0;h<left;h++)v+=golfDelta(sk);best=Math.min(best,v)});w+=me<best?1:me===best?.5:0}return w/n};
 function golfDelta(s){const r=rnd();if(r<.03*s)return-2;if(r<.03*s+.12+.2*s)return-1;if(r<.65+.15*s)return 0;if(r<.93)return 1;return 2}
 ad.statsRows=()=>{const rows=[['Score to par',toPar(ad.tot-par()),toPar(rivals[0].tot-rivals[0].cards.reduce((s,_,i)=>s+holes[i].par,0))],['Strokes',ad.tot,rivals[0].tot],['Birdies or better',M.stats.A.bird||0,rivals[0].cards.filter((c,i)=>c<holes[i].par).length],['Fairways hit',M.stats.A.fw||0,'–'],['Putts',M.stats.A.putt||0,'–'],['Perfect timings',M.stats.A.pf||0,'–']];
  rows.push(['Card',ad.card.map((c,i)=>c-holes[i].par>0?'+'+(c-holes[i].par):c-holes[i].par===0?'E':c-holes[i].par).join(' ')||'-',rivals[0].cards.map((c,i)=>c-holes[i].par).join(' ')||'-']);return rows};
 function lieAt(x,y){const h=H(),d=Math.hypot(x,h.len-y);if(d<14)return'green';if(h.bunk.some(b=>Math.hypot(x-b[0],y-b[1])<7))return'sand';const off=x-cxAt(h,y);if(h.water&&Math.sign(off)===h.water&&Math.abs(off)>18&&y>h.len*(h.wy-.18)&&y<h.len*(h.wy+.18))return'water';if(Math.abs(off)<14)return'fairway';if(Math.abs(off)>48)return'trees';return'rough'}
 async function shot(){const h=H(),b=ad.ball,d=Math.hypot(b.x,h.len-b.y);
  if(ad.lie==='green'){return putt(d)}
  const lf={tee:1,fairway:1,rough:.85,sand:.72,trees:.7}[ad.lie]||1;let best=CLUBS.findIndex(c=>c.m*lf<=d+8);if(best<0)best=CLUBS.length-1;if(ad.lie==='tee'&&h.par>3)best=0;
  const acts=CLUBS.slice(Math.max(0,best-1),best+3).map(c=>({n:c.n,d:Math.round(c.m*lf)+' m',m:c.m,aim:1,fast:c.m>200?1.2:1}));
  const r=await moment({title:`Hole ${ad.h+1}, par ${h.par} • ${Math.round(d)} m to the pin from the ${ad.lie}`,role:SPORTS.golf.roles[0],acts,aimLbl:'AIM',aimNames:['◀ Left','● At pin','Right ▶'],simAim:ad.wind>3?-1:ad.wind<-3?1:0,hint:`🌬️ Wind ${Math.abs(ad.wind)} m/s ${ad.wind<0?'blowing left':ad.wind>0?'blowing right':'calm'}`,simAct:()=>acts[acts.findIndex(a=>a.n===CLUBS[best].n)]||acts[0]});
  const q=r.g.q;if(q>=1)st('A','pf');const club=r.act;let dist=Math.min(club.m*lf,club.m<=60?d*1.02:9e9)*(q>=1?1:q>=.7?.95:.82)*(1+upg(M.sp).pow*.008)*(.98+rnd()*.04)-ad.windY*club.m/160*3;
  let lat=r.aim*9+ad.wind*club.m/160*2.6+(r.g.side||0)*(1-q)*(club.m/9)+(rnd()-.5)*(1.6-q)*club.m/40;lat*=1-upg(M.sp).pre*.03;
  const ux=-b.x/d,uy=(h.len-b.y)/d,nx=uy,ny=-ux;const nb={x:b.x+ux*dist+nx*lat,y:b.y+uy*dist+ny*lat};SFX.hit(club.m/200);
  const from={...b};await anim(1.6,k=>{ad.ball={x:lerp(from.x,nb.x,k),y:lerp(from.y,nb.y,k),z:Math.sin(Math.PI*k)*club.m/6}});ad.ball.z=0;ad.trail.push([from,nb]);SFX.thud();ad.strokes++;
  let lie=lieAt(nb.x,nb.y);if(nb.y>h.len+25)lie='rough';
  if(lie==='water'){ad.strokes++;SFX.splash();bigText('SPLASH!','+1 penalty','#93c5fd');say('Into the water! That will cost a penalty stroke.','HAZARD');ad.ball={x:cxAt(h,nb.y)+h.water*12,y:nb.y,z:0};lie='rough'}
  else if(lie==='trees'){bigText('IN THE TREES','',"#fca5a5");say('That one is in the trees. Tough recovery from here.','TROUBLE');ad.ball={x:cxAt(h,nb.y)+Math.sign(nb.x-cxAt(h,nb.y))*40,y:nb.y,z:0}}
  else{ad.ball=nb;if(ad.strokes===1&&lie==='fairway')st('A','fw');say(lie==='green'?pick([`On the green! ${Math.round(Math.hypot(nb.x,h.len-nb.y))} m for ${ad.strokes+1===h.par-1?'eagle':ad.strokes+1===h.par?'birdie':'par'}.`,'Lovely approach, that finds the putting surface.']):lie==='fairway'?pick(['Down the middle. Lovely strike.','Fairway found, good position.']):lie==='sand'?'In the bunker. Needs a delicate touch.':'Into the rough, that will be tricky.',r.g.tag)}
  ad.lie=lie;if(lie==='green'&&Math.hypot(ad.ball.x,h.len-ad.ball.y)<.8)return holed()}
 async function putt(d){const h=H(),brk=pick([-1,0,1]);ad.putt={d,brk};
  if(d<.8)return holed(true);
  const r=await moment({title:`${d.toFixed(1)} m putt for ${['albatross','eagle','birdie','par','bogey','double bogey'][clamp(ad.strokes+1-h.par+3,0,5)]}`,role:SPORTS.golf.roles[1],acts:[{n:'Putt',d:'Time the stroke',aim:1}],aimLbl:'START LINE',aimNames:['◀ Left edge','● Straight','Right edge ▶'],simAim:-brk,hint:`⛳ Green breaks ${brk<0?'to the LEFT':brk>0?'to the RIGHT':'dead straight'}`,simAct:()=>({n:'Putt',aim:1})});
  const q=r.g.q;if(q>=1)st('A','pf');st('A','putt');ad.strokes++;const need=-brk,ok=rnd()<clamp((1.08-d*.085)*(.35+.65*q)*(r.aim===need?1:.4)*(1+upg(M.sp).pre*.02),.03,.97);SFX.hit(.3);
  const from={...ad.ball};const left=ok?0:d*(.1+.32*(1-q))+.25;const to=ok?{x:0,y:h.len}:{x:(rnd()-.5)*left*1.2,y:h.len-(r.g.side<0?left:-left)};
  await anim(1.4,k=>{ad.ball={x:lerp(from.x,to.x,k)+Math.sin(Math.PI*k)*brk*.6*(1-(r.aim===need?1:0)),y:lerp(from.y,to.y,k),z:0}});
  if(ok)return holed();say(pick([`${r.g.side<0?'Left it short':'Just slides by'}. ${left.toFixed(1)} m back.`,'Lips out! So close.','Misread the line there.']),'PUTT')}
 async function holed(gimme){const h=H();if(gimme){ad.strokes++;st('A','putt')}const diff=ad.strokes-h.par;const name={'-3':'ALBATROSS!','-2':'EAGLE!','-1':'BIRDIE!','0':'PAR','1':'BOGEY','2':'DOUBLE BOGEY'}[diff]||(diff>0?'+'+diff:'ACE!');
  if(ad.strokes===1)bigText('HOLE IN ONE!','','#ffe9a8');else bigText(name,`Hole ${ad.h+1}`,diff<0?'#ffe9a8':diff===0?'#fff':'#fca5a5');diff<0?SFX.cheer(1.3):diff===0?SFX.cheer(.5):SFX.groan();if(diff<0)st('A','bird');
  say(`${gimme?'Tapped in for':'In the hole for'} ${name.toLowerCase().replace('!','')}. ${ad.strokes} strokes.`,'HOLED',diff<0);ad.putt=null;ad.hdone=true}
 function rivalsPlay(){const sk=clamp((M.oR-45)/55,.1,1);rivals.forEach(r=>{const s=Math.max(1,H().par+golfDelta(sk));r.cards.push(s);r.tot+=s})}
 ad.init=()=>{};
 ad.run=async()=>{say(`Welcome to the course. ${N} holes, ${M.tA} against a strong field led by ${M.tB}.`,'START',true);
  for(ad.h=0;ad.h<N;ad.h++){live();const h=H();ad.strokes=0;ad.trail=[];ad.lie='tee';ad.ball={x:0,y:0,z:0};ad.hdone=false;ad.wind=Math.round((rnd()-.5)*12);ad.windY=Math.round((rnd()-.5)*4);updBug();
   bigText('HOLE '+(ad.h+1),`Par ${h.par} • ${h.len} m`);say(`Hole ${ad.h+1}, a par ${h.par} of ${h.len} metres.${h.water?' Water lurks on the '+(h.water<0?'left':'right')+'.':''}`,'TEE');await wait(900);
   while(!ad.hdone){live();await shot();updBug();if(!ad.hdone&&ad.strokes>=h.par+5){ad.strokes++;say('Picking up on this hole.','HOLE');ad.hdone=true}await wait(300)}
   ad.card.push(ad.strokes);ad.tot+=ad.strokes;rivalsPlay();updBug();setWin(ad.winP());await wait(900)}
  ad.done=true;ad.h=N-1;const best=Math.min(...rivals.map(r=>r.tot));if(ad.tot===best&&M.needWinner){say('A tie for the lead! Playoff: the closest putt wins.','PLAYOFF',true);ad.tot+=rnd()<.5+(M.uR-M.oR)/200?-0:1;if(ad.tot===best)rivals.forEach(r=>{if(r.tot===best)r.tot++})}
  setWin(ad.winP());SFX.buzzer()};
 ad.result=()=>{const best=Math.min(...rivals.map(r=>r.tot)),tp=par();const pos=1+rivals.filter(r=>r.tot<ad.tot).length;return{r:ad.tot<best?'WIN':ad.tot===best?'DRAW':'LOSS',line:`You shot ${ad.tot} (${toPar(ad.tot-tp)}) • Finished ${['1st','2nd','3rd','4th'][pos-1]} • Best rival ${best}`}};
 ad.draw2d=(c,W,Hh,now)=>{const h=H();if(!h)return;const g=c.createLinearGradient(0,0,0,Hh);g.addColorStop(0,'#1f5130');g.addColorStop(1,'#163d24');c.fillStyle=g;c.fillRect(0,0,W,Hh);
  const onGreen=ad.lie==='green'&&ad.ball;const span=onGreen?40:h.len+60,sc=Math.min(Hh*.82/span,W*.85/(onGreen?40:140));const cy0=onGreen?h.len:h.len/2,cxv=onGreen?0:0;
  const X=x=>W/2+(x-cxv)*sc,Y=y=>Hh*.5-(y-cy0)*sc;
  const rr=rng(hashStr('t'+ad.h));for(let i=0;i<70;i++){const y=rr()*h.len,side=rr()<.5?-1:1,x=cxAt(h,y)+side*(32+rr()*40);c.fillStyle='#0f3a1e';c.beginPath();c.arc(X(x),Y(y),Math.max(3,5*sc),0,7);c.fill();c.fillStyle='#14532d';c.beginPath();c.arc(X(x)-1,Y(y)-1,Math.max(2,3.6*sc),0,7);c.fill()}
  if(h.water){c.fillStyle='#1d6fb8';c.beginPath();const y0=h.len*(h.wy-.18),y1=h.len*(h.wy+.18);for(let i=0;i<=12;i++){const y=lerp(y0,y1,i/12);c.lineTo(X(cxAt(h,y)+h.water*(18+Math.sin(i)*3)),Y(y))}for(let i=12;i>=0;i--){const y=lerp(y0,y1,i/12);c.lineTo(X(cxAt(h,y)+h.water*(46)),Y(y))}c.fill()}
  c.strokeStyle='#4ca35e';c.lineWidth=28*sc;c.lineCap='round';c.beginPath();for(let i=0;i<=30;i++){const y=lerp(h.par===3?h.len*.4:15,h.len-6,i/30);i?c.lineTo(X(cxAt(h,y)),Y(y)):c.moveTo(X(cxAt(h,y)),Y(y))}c.stroke();
  c.fillStyle='#5cc06e';c.beginPath();c.arc(X(0),Y(h.len),15*sc,0,7);c.fill();c.fillStyle='#4ca35e';c.fillRect(X(-4),Y(4),8*sc,8*sc);
  h.bunk.forEach(b=>{c.fillStyle='#e8d6a0';c.beginPath();c.ellipse(X(b[0]),Y(b[1]),7*sc,5*sc,.4,0,7);c.fill()});
  c.fillStyle='#111';c.beginPath();c.arc(X(0),Y(h.len),Math.max(2,.6*sc),0,7);c.fill();c.strokeStyle='#fff';c.lineWidth=2*DPR;c.beginPath();c.moveTo(X(0),Y(h.len));c.lineTo(X(0),Y(h.len)-30*DPR);c.stroke();c.fillStyle='#ef4444';c.beginPath();c.moveTo(X(0),Y(h.len)-30*DPR);c.lineTo(X(0)+16*DPR,Y(h.len)-25*DPR);c.lineTo(X(0),Y(h.len)-20*DPR);c.fill();
  c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=1.5*DPR;c.setLineDash([4*DPR,4*DPR]);ad.trail.forEach(([a,b])=>{c.beginPath();c.moveTo(X(a.x),Y(a.y));c.lineTo(X(b.x),Y(b.y));c.stroke()});
  if(ad.ball&&M.momentCtl&&!ad.done){const b=ad.ball,d=Math.hypot(b.x,h.len-b.y)||1;c.strokeStyle='rgba(255,209,102,.8)';c.beginPath();c.moveTo(X(b.x),Y(b.y));const nx=(h.len-b.y)/d,ny=b.x/d;const L2=Math.min(d,onGreen?d:200);c.lineTo(X(b.x+(-b.x/d)*L2+nx*M.aim*9*(onGreen?.15:1)),Y(b.y+((h.len-b.y)/d)*L2+ny*M.aim*9*(onGreen?.15:1)));c.stroke()}
  c.setLineDash([]);if(ad.ball){const b=ad.ball,r=Math.max(3*DPR,.5*sc)*(1+(b.z||0)/30);c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.arc(X(b.x)+2+(b.z||0)*.4,Y(b.y)+2+(b.z||0)*.4,r,0,7);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(X(b.x),Y(b.y)-(b.z||0)*sc*.3,r,0,7);c.fill()}
  c.fillStyle='rgba(6,13,31,.8)';c.fillRect(W-150*DPR,Hh-170*DPR,140*DPR,60*DPR);c.fillStyle='#fff';c.font=`800 ${12*DPR}px system-ui`;c.textAlign='left';c.fillText('WIND',W-140*DPR,Hh-150*DPR);c.fillText(Math.abs(ad.wind)+' m/s',W-140*DPR,Hh-128*DPR);
  c.save();c.translate(W-50*DPR,Hh-140*DPR);c.rotate(ad.wind<0?Math.PI:0);c.strokeStyle='#ffd166';c.lineWidth=3*DPR;c.beginPath();c.moveTo(-14*DPR,0);c.lineTo(14*DPR,0);c.lineTo(7*DPR,-6*DPR);c.moveTo(14*DPR,0);c.lineTo(7*DPR,6*DPR);if(ad.wind)c.stroke();c.restore()};
 return ad}
