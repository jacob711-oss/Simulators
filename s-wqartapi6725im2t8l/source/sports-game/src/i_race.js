
/* ================= sprint and swimming ================= */
function raceAdapter(){const S=SPORTS[M.sp],swim=!!S.swim,D=M.len,G=CFG.gender==='GIRL'?.91:1;
 const myLane=4;const others=COUNTRIES.filter(c=>c.code!==country().code&&c.code!==M.opp.code);
 const lanes=[];for(let i=1;i<=8;i++){const mine=i===myLane;const c=mine?country():i===5?M.opp:others[(M.lvl*5+i*3)%others.length];const r=mine?M.uR:M.oR+(i===5?2:-(Math.abs(i-4.5)*1.4))+(rnd()-.5)*4;
  lanes.push({lane:i,c,mine,nm:mine?M.squadA[0].n:genSquad(M.sp,c,CFG.gender,1)[0].n,r,x:0,v:0,react:mine?0:.12+rnd()*.08,rh:mine?.7:clamp(.62+(r-60)*.01+rnd()*.1,.5,.98),t:null,dq:false,turned:false,boost:0})}
 const me=lanes[myLane-1];const vmax=r=>swim?(1.6+r*.0095)*G:(9.35+r*.022)*G;
 const ad={lanes,phase:'marks',t0:0,tGo:0,fs:0,done:false,taps:0,lastSweep:-1};
 ad.scoreText=()=>{const ord=order();return 'POS '+['1st','2nd','3rd','4th','5th','6th','7th','8th'][ord.indexOf(me)]};
 ad.clock=()=>ad.phase==='run'||ad.phase==='done'?((performance.now()-ad.tGo)/1000).toFixed(2)+'s':ad.phase.toUpperCase();
 ad.sub=()=>`${D} m ${swim?'freestyle':'sprint'} • Lane ${myLane} • ${Math.min(D,me.x).toFixed(0)} m • Rhythm ${Math.round(me.rh*100)}%${ad.fs?' • ⚠️ false start warning':''}`;
 function order(){return lanes.slice().sort((a,b)=>(a.t!=null&&b.t!=null)?a.t-b.t:a.t!=null?-1:b.t!=null?1:b.x-a.x)}
 ad.winP=()=>{if(ad.done)return order()[0]===me?1:0;const now=(performance.now()-ad.tGo)/1000;const proj=lanes.map(l=>l.t!=null?l.t:now+Math.max(0,D-l.x)/Math.max(.5,l.v||vmax(l.r)*.9));const b=Math.min(...proj);const w=proj.map(t=>Math.exp(-(t-b)/(swim?.35:.1)));return w[myLane-1]/w.reduce((s,x)=>s+x,0)};
 ad.statsRows=()=>{const ord=order();return ord.map((l,i)=>[`${i+1}. ${l.c.flag} ${l.nm}${l.mine?' (you)':''}`,l.dq?'DQ':l.t!=null?l.t.toFixed(2)+'s':'-',l.lane===myLane?'Reaction '+(me.reactT!=null?me.reactT.toFixed(3)+'s':'-'):'Lane '+l.lane]).concat([['Perfect taps',M.stats.A.pf||0,'Taps '+ad.taps]])};
 function tap(g){if(ad.phase==='set'){falseStart();return}if(ad.phase==='go'||ad.phase==='run'){if(me.reactT==null){me.reactT=(performance.now()-ad.tGo)/1000;if(me.reactT<.1){falseStart();return}ad.phase='run';say(`${me.reactT<.15?'Rocket start!':'Away cleanly.'} Reaction ${me.reactT.toFixed(3)}.`,'START');return}
   if(swim&&D>50&&!me.turned&&Math.abs(50-me.x)<2.5){me.turned=true;const good=Math.abs(50-me.x)<1.2;me.boost=good?.5:-.4;toast(good?'GREAT TURN ✨':'Slow turn');say(good?'Superb tumble turn!':'A slow turn there.','TURN');return}
   ad.taps++;let q=g.q;if(MT.sweeps===ad.lastSweep){q=.15;toast('Too fast! Keep the rhythm')}else if(q>=1)st('A','pf');ad.lastSweep=MT.sweeps;me.rh=clamp(me.rh*.72+q*.28+upg(M.sp).pow*.002,0,1);me.lastTap=performance.now()}}
 let fsRes=null;function falseStart(){if(ad.phase!=='set'&&ad.phase!=='go'&&ad.phase!=='run')return;if(fsRes){const r=fsRes;fsRes=null;r()}ad.false=true}
 function step(dt){const now=performance.now(),el=(now-ad.tGo)/1000;
  for(const l of lanes){if(l.t!=null||l.dq)continue;if(l.mine&&me.reactT==null)continue;if(!l.mine&&el<l.react)continue;
   if(l.mine&&now-(l.lastTap||now)>700)l.rh=clamp(l.rh-dt*.5,0,1);if(!l.mine)l.rh=clamp(l.rh+(rnd()-.5)*dt*.3,.45,.99);
   let target=vmax(l.r)*(.8+.22*l.rh);if(!swim&&D>100&&l.x>120)target*=1-(l.x-120)/80*.07*(1.2-l.rh);if(swim&&l.x>D*.7)target*=1-.04*(1.1-l.rh);
   if(swim&&D>50&&!l.turned&&l.x>=50){if(l.mine){l.turned=true;l.boost=-.6}else{l.turned=true;l.boost=rnd()<.6?.4:-.1}}
   if(l.boost){target+=l.boost*1.5;l.boost*=Math.pow(.2,dt)}
   const acc=swim?2.5:(l.x<30?4.2:2.5);l.v+=(target-l.v)*clamp(acc*dt/Math.max(1,target)*2,0,1);if(swim&&l.v<1&&l.x<2)l.v=1.8;l.x+=l.v*dt;
   if(l.x>=D){const over=(l.x-D)/Math.max(.1,l.v);l.t=el-over;l.x=D;if(l.mine){SFX.cheer(1);}}}
  if(lanes.every(l=>l.t!=null||l.dq))ad.finishRes&&ad.finishRes()}
 let lastF=0;ad.draw2d=(c,W,H,now)=>{let dt=lastF?Math.min(.5,(now-lastF)/1000):0;lastF=now;if(ad.phase==='run'||ad.phase==='go'){while(dt>0){const h=Math.min(.02,dt);step(h);dt-=h}}
  const lead=Math.max(...lanes.map(l=>Math.min(l.x,D)));const span=swim?24:30;const camX=clamp(Math.max(me.x,lead-span*.4)-span*.35,-3,D-span*.85);const sc=W/span,top=H*.24,lh=(H*.62)/8;
  const X=x=>(x-camX)*sc;c.fillStyle='#0b1226';c.fillRect(0,0,W,H);
  if(!crowdPat)makeCrowd();c.fillStyle=crowdPat;c.fillRect(0,0,W,top-6*DPR);c.fillRect(0,top+8*lh+6*DPR,W,H);c.fillStyle='rgba(6,13,31,.45)';c.fillRect(0,0,W,top-6*DPR);
  c.fillStyle=swim?'#0e7490':'#b4432d';c.fillRect(0,top,W,8*lh);
  for(let i=0;i<=8;i++){const y=top+i*lh;if(swim){for(let x=Math.floor(camX);x<camX+span+1;x+=1){c.fillStyle=(Math.floor(x)%5===0)?'#ef4444':(i%2?'#f8fafc':'#facc15');c.beginPath();c.arc(X(x),y,3*DPR,0,7);c.fill()}}else{c.fillStyle='#f8fafc';c.fillRect(0,y-1*DPR,W,2*DPR)}}
  if(swim){c.fillStyle='rgba(255,255,255,.06)';for(let i=0;i<14;i++){const x=((i*53+now/40)%W);c.fillRect(x,top,30*DPR,8*lh)}c.fillStyle='#0a3b4f';for(let i=0;i<8;i++)c.fillRect(0,top+i*lh+lh*.46,W,lh*.08)}
  for(let m=0;m<=D;m+=10){const x=X(m);if(x<-40||x>W+40)continue;c.fillStyle='rgba(255,255,255,.5)';c.fillRect(x,top,1.5*DPR,8*lh);c.font=`800 ${11*DPR}px system-ui`;c.textAlign='center';c.fillText(m+'m',x,top-10*DPR)}
  if(swim&&D>50){const x=X(50);c.fillStyle='#e2e8f0';c.fillRect(x-4*DPR,top,8*DPR,8*lh)}
  const fx=X(D);c.fillStyle='#fff';c.fillRect(fx-3*DPR,top,6*DPR,8*lh);for(let i=0;i<16;i++){c.fillStyle=i%2?'#111':'#fff';c.fillRect(fx+3*DPR,top+i*lh/2,6*DPR,lh/2)}
  const sx=X(0);c.fillStyle='#e2e8f0';c.fillRect(sx-2*DPR,top,4*DPR,8*lh);
  lanes.forEach((l,i)=>{const y=top+i*lh+lh/2,x=X(Math.min(l.x,D)),k=l.c,bob=Math.sin(now/(swim?160:70)+i)*(l.v>.5?1:0);
   c.fillStyle='rgba(6,13,31,.75)';c.fillRect(4*DPR,y-lh*.32,20*DPR,lh*.64);c.fillStyle='#fff';c.font=`900 ${12*DPR}px system-ui`;c.textAlign='center';c.fillText(l.lane,14*DPR,y+4*DPR);
   if(swim){c.fillStyle='rgba(255,255,255,.35)';if(l.v>.5){c.beginPath();c.ellipse(x-lh*.5,y,lh*.4,lh*.15,0,0,7);c.fill()}c.fillStyle=k.jersey;c.beginPath();c.ellipse(x,y,lh*.42,lh*.16,0,0,7);c.fill();c.fillStyle=k.trim;c.beginPath();c.arc(x+lh*.38,y,lh*.13,0,7);c.fill();c.strokeStyle='#f1c9a5';c.lineWidth=3*DPR;c.beginPath();c.moveTo(x+lh*.2,y);c.lineTo(x+lh*.2+Math.cos(now/150+i)*lh*.35,y+Math.sin(now/150+i)*lh*.3);c.stroke()}
   else{c.fillStyle=k.pants;c.fillRect(x-lh*.12,y-lh*.05+bob,lh*.24,lh*.3);c.fillStyle=k.jersey;c.fillRect(x-lh*.16,y-lh*.36+bob,lh*.32,lh*.32);c.fillStyle='#e0ac80';c.beginPath();c.arc(x+lh*.04,y-lh*.44+bob,lh*.11,0,7);c.fill();c.strokeStyle='#e0ac80';c.lineWidth=3*DPR;c.beginPath();const s=Math.sin(now/70+i)*lh*.22*(l.v>.5?1:0);c.moveTo(x,y-lh*.24+bob);c.lineTo(x+s,y-lh*.02);c.moveTo(x,y+lh*.2);c.lineTo(x-s,y+lh*.42);c.stroke()}
   if(l.mine){c.strokeStyle='#ffd166';c.lineWidth=2*DPR;c.strokeRect(x-lh*.55,y-lh*.48,lh*1.1,lh*.96)}
   c.font=`800 ${11*DPR}px system-ui`;c.textAlign='left';c.fillStyle=l.mine?'#ffd166':'#fff';c.fillText(`${k.flag} ${l.nm.split(' ').pop()}${l.t!=null?'  '+l.t.toFixed(2):''}`,Math.max(30*DPR,x+lh*.55),y-lh*.2)});
  if(ad.phase==='marks'||ad.phase==='set'){c.fillStyle='rgba(6,13,31,.6)';c.fillRect(W/2-170*DPR,H*.08,340*DPR,48*DPR);c.fillStyle='#ffe9a8';c.font=`900 ${26*DPR}px system-ui`;c.textAlign='center';c.fillText(ad.phase==='marks'?(swim?'TAKE YOUR MARKS':'ON YOUR MARKS'):'SET…',W/2,H*.08+34*DPR)}};
 ad.init=()=>{};
 async function startSeq(){ad.phase='marks';lanes.forEach(l=>{l.x=0;l.v=0;l.t=null;l.turned=false;l.boost=0});me.reactT=null;ad.false=false;idle(swim?'Take your marks. Wait for the beep, then TAP.':'On your marks. Wait for the gun, then TAP.','START');
  $('go').textContent='TAP AT THE GUN';say(swim?'Take your marks...':'On your marks...','STARTER',true);await wait(1700);ad.phase='set';say(swim?'':'Set.','STARTER');
  meterZones();MT.run=false;M.momentCtl={tap(){tap({q:0})},key(){},sim(){}};
  await new Promise(r=>{fsRes=r;setTimeout(()=>{if(fsRes){fsRes=null;r()}},1300+rnd()*1600)});live();
  if(ad.false){ad.fs++;SFX.whistle(true);if(ad.fs>=2){me.dq=true;bigText('DISQUALIFIED','False start','#fca5a5');say('Second false start. Disqualified!','DQ',true);return'dq'}bigText('FALSE START','Warning','#fca5a5');say('False start! One more and you are out.','STARTER',true);await wait(1800);return'again'}
  swim?SFX.tone('square',1000,1000,.4,.2):SFX.gun();ad.phase='go';ad.tGo=performance.now();return'go'}
 ad.run=async()=>{say(`Welcome to the ${D} metre ${swim?'freestyle':'final'}. ${M.tA} in lane ${myLane}.`,'START',true);await wait(1200);
  let r;do{r=await startSeq()}while(r==='again');
  if(r!=='dq'){M.momentCtl=null;$('sitT').textContent=swim?'Tap on every stroke when the needle hits the green.':'Tap on every stride when the needle hits the green.';$('sitR').textContent='RHYTHM';$('go').textContent='TAP • SPACE';
   meterStart(swim?1.25:2.0,g=>tap(g),true);M.momentCtl={tap(){if(me.reactT==null)tap({q:0});else meterLock()},key(){},sim(){}};
   const tGo=performance.now();const auto=setInterval(()=>{if(!M||me.t!=null)return;if(me.reactT==null){if(M.auto||performance.now()-tGo>3000){tap({q:0});if(!M.auto)say('A very slow reaction there!','START')}return}if(M.auto&&Math.abs(MT.v-.5)<.07&&MT.sweeps!==ad.lastSweep)tap(simGrade(M.uR))},30);
   let call=0;const ci=setInterval(()=>{if(!M||M.dead||ad.done){clearInterval(ci);return}call++;const ord=order(),p=ord.indexOf(me)+1;updBug();setWin(ad.winP());if(call%3===0&&me.t==null)say(p===1?pick([`${M.cA} in front!`,`${me.nm.split(' ').pop()} leads!`]):`${me.nm.split(' ').pop()} in ${['','first','second','third','fourth','fifth','sixth','seventh','eighth'][p]}. ${ord[0].c.name} lead.`,'RACE')},900);
   await new Promise(res=>{ad.finishRes=res;const chk=setInterval(()=>{if(!M||M.dead){clearInterval(chk);res()}else if(lanes.every(l=>l.t!=null||l.dq)){clearInterval(chk);res()}},200)});clearInterval(auto);clearInterval(ci);live()}
  else{lanes.forEach(l=>{if(!l.mine){l.t=(D/vmax(l.r))*(1.05+rnd()*.05)}})}
  meterStop();ad.phase='done';ad.done=true;const ord=order(),p=ord.indexOf(me)+1;updBug();setWin(ad.winP());
  if(!me.dq){bigText(p===1?'GOLD!':p===2?'SILVER':p===3?'BRONZE':p+'th',me.t.toFixed(2)+'s',p===1?'#ffe9a8':'#fff');say(p===1?`${me.nm} wins it in ${me.t.toFixed(2)}! What a performance!`:`${ord[0].nm} takes it in ${ord[0].t.toFixed(2)}. You finish ${['','first','second','third','fourth','fifth','sixth','seventh','eighth'][p]} in ${me.t.toFixed(2)}.`,'RESULT',true)}await wait(1500)};
 ad.result=()=>{const ord=order(),p=ord.indexOf(me)+1;return{r:me.dq?'LOSS':p===1?'WIN':'LOSS',podium:p<=3&&!me.dq,line:me.dq?'Disqualified for false starts':`${['','1st','2nd','3rd','4th','5th','6th','7th','8th'][p]} place in ${me.t.toFixed(2)}s • Winner ${ord[0].c.flag} ${ord[0].nm} ${ord[0].t.toFixed(2)}s`}};
 return ad}
