
/* ================= team invasion sports ================= */
function rmult(){return 1+(M.uR-M.oR)/110}
function playerName(list,i){const p=list[i%list.length];return p.n.split(' ').slice(-1)[0]}
function outfield(list,S){const gk=S.goal?1:0;return list.slice(gk,Math.max(S.sq,2))}
function invAdapter(){
 const S=SPORTS[M.sp],F=S.field,L=F.L,N=M.len,ad={sc:[0,0],i:0,N,extra:0,mode:'reg',pens:null,force:null};
 const goalY=S.goal&&S.goal.y||0,farGoal=S.hoop?L-1.575:L-goalY,nearGoal=S.hoop?1.575:goalY;
 const per=S.mins/S.periods;
 ad.clock=()=>{if(ad.mode==='pens')return'PENS';if(ad.mode==='ot')return S.tie==='golden'?'GOLDEN':'OT';const e=Math.min(S.mins,S.mins*ad.i/N);
  if(S.pn==='Q'||S.pn==='P'){const p=Math.min(S.periods,Math.floor(e/per)+1),rem=Math.max(0,per*p-e),mm=Math.floor(rem),ss=Math.floor((rem-mm)*60);return S.pn+p+' '+mm+':'+String(ss).padStart(2,'0')}return Math.round(e)+"'"};
 ad.scoreText=()=>ad.sc[0]+' - '+ad.sc[1];
 ad.sub=()=>ad.pens?`Shootout ${ad.pens[0]} - ${ad.pens[1]}`:`${S.nm} • ${M.mentality} • ${ad.i<N?'Chance '+(ad.i+1)+' of '+N:'Extra time'}`;
 const avgPts=S.rugby?6.3:M.sp==='basketball'?2.2:1;
 function pScore(){return clamp(.4*rmult(),.12,.75)}
 function pAtk(){return clamp(.5+({Defensive:-.08,Balanced:0,Attacking:.08})[M.mentality]+(M.uR-M.oR)/320,.3,.7)}
 ad.winP=()=>{if(ad.pens)return clamp(.5+(ad.pens[0]-ad.pens[1])*.15,.05,.95);const left=Math.max(0,N-ad.i);let w=0;const n=260,pu=pScore(),po=clamp(.4/rmult()*(M.mentality==='Attacking'?1.1:M.mentality==='Defensive'?.9:1),.12,.75),pa=pAtk();
  for(let k=0;k<n;k++){let a=ad.sc[0],b=ad.sc[1];for(let j=0;j<left;j++){if(rnd()<pa){if(rnd()<pu)a+=avgPts}else if(rnd()<po)b+=avgPts;if(S.bg)for(let q=0;q<S.bg;q++){if(rnd()<S.bgP*rmult())a+=S.bgPts;if(rnd()<S.bgP/rmult())b+=S.bgPts}}w+=a>b?1:a===b?.5:0}return w/n};
 ad.statsRows=()=>{const A=M.stats.A,B=M.stats.B;return[['Shots / attempts',A.sh||0,B.sh||0],['On target',A.ot||0,B.ot||0],[S.unit==='goal'?'Goals':'Points',ad.sc[0],ad.sc[1]],['Saves / stops',A.sv||0,B.sv||0],['Chances created',A.ch||0,B.ch||0],['Perfect timings',A.pf||0,'–']]};

 function baseScene(){const sc=M.scene;sc.actors=[];sc.ball={x:0,y:L/2,z:0,vis:true}}
 function addB(x,y,o){const a=mkActor('B',x,y,o);M.scene.actors.push(a);return a}
 function addA(x,y,o){const a=mkActor('A',x,y,o);M.scene.actors.push(a);return a}

 async function bgPlay(){if(!S.bg)return;let a=0,b=0;for(let q=0;q<S.bg;q++){if(rnd()<S.bgP*rmult()){const p=M.sp==='basketball'&&rnd()<.3?3:S.bgPts===1?1:2;a+=p}if(rnd()<S.bgP/rmult()){const p=M.sp==='basketball'&&rnd()<.3?3:S.bgPts===1?1:2;b+=p}}
  ad.sc[0]+=a;ad.sc[1]+=b;st('A','sh',S.bg);st('B','sh',S.bg);st('A','ot',a);st('B','ot',b);if(a||b){updBug();if(a-b>=4)say(`What a run! ${M.tA} go on a ${a}-${b} burst.`,'PLAY');else if(b-a>=4)say(`${M.tB} answer with a ${b}-${a} run. Time to respond.`,'PLAY');else if(rnd()<.5)say(pick([`End-to-end stuff. ${a} for ${M.tA}, ${b} for ${M.tB} in that spell.`,`Trading baskets here, ${ad.scoreText()}.`,`Both sides keep the scoreboard ticking: ${ad.scoreText()}.`]),'PLAY')}}

 async function attack(pens){const sh=pens?outfield(M.squadA,S)[ad.i%outfield(M.squadA,S).length]:pick(outfield(M.squadA,S));const nm=sh.n.split(' ').pop();baseScene();st('A','ch');
  const dist=pens?(M.sp==='hockey'?10:M.sp==='handball'?7:11):S.hoop?6:M.sp==='hockey'?9:M.sp==='handball'?9:S.rugby?22:16+rnd()*6;const sx=pens?0:(rnd()-.5)*(S.hoop?4:F.W*.25);
  const shooter=addA(sx,farGoal-dist,{no:sh.no,hl:1,tag:nm,tool:M.sp==='hockey'?'#8b5a2b':null});
  let keeper=null;if(S.goal)keeper=addB(0,farGoal-.4,{gk:1,no:1});
  if(!pens){if(S.rugby){for(let i=-2;i<=2;i++)addB(i*7+(rnd()-.5)*3,L-12+rnd()*3,{no:2+i+3});addA(sx-8,farGoal-dist-3,{no:9});addA(sx+8,farGoal-dist-3,{no:10})}
   else{addB(sx+2,farGoal-dist+2.5,{no:4});addB(sx-3,farGoal-dist+4,{no:5});addA(sx+(rnd()<.5?-1:1)*F.W*.18,farGoal-dist-1,{no:7})}}
  M.scene.ball={x:sx+.3,y:farGoal-dist+.4,z:S.hoop?1:0,vis:true};view(farGoal-(S.field.Lv*.82),S.field.Lv,sx*.4);snapView();
  const aiG=aiGuessAim(M.aimHist,M.lvl);const truth=({easy:.78,medium:.64,hard:.52})[CFG.diff];const hintSide=rnd()<truth?aiG:pick([-1,0,1]);
  const who=S.goal?(M.sp==='hockey'?'Goalie':'Keeper'):S.hoop?'Defender':'Defence';const side=['left','centre','right'][hintSide+1];
  const title=pens?`Shootout: ${sh.n} steps up${ad.pens?` (${ad.pens[0]}-${ad.pens[1]})`:''}`:S.rugby?`${sh.n} has the ball 22 m out. Find a way through!`:S.hoop?`${sh.n} brings it up. Pick your shot.`:`${sh.n} (#${sh.no}) is in on goal!`;
  if(!pens&&rnd()<.6)say(pick([`${nm} picks it up and drives forward...`,`Good work in the build-up, it falls to ${nm}.`,`${M.tA} on the attack, ${nm} with space.`,`Here's a chance for ${nm}!`]),'ATTACK');
  const acts=pens?S.atk.filter(a=>a.aim).slice(0,2):S.atk;
  const r=await moment({title,role:S.roles[0],acts,hint:`👀 ${who} leaning ${side}`,simAct:()=>pick(acts)});
  const act=r.act,q=r.g.q;if(q>=1)st('A','pf');st('A','sh');const guessed=act.aim?(aiG===r.aim):rnd()<.3;
  let P=act.p*(.3+.78*q)*(guessed?.55:1.14)*rmult()*(pens?1.25:1)*(1+upg(M.sp).pow*.012);P=clamp(P,.04,.93);const scored=rnd()<P;const onT=scored||q>=.6;if(onT)st('A','ot');
  const res=scored?'score':(q<.45?'miss':'save');shooter.lean=.3;SFX.hit(act.fast?1.2:.9);
  await shotAnim(true,shooter,keeper,act,r.aim,aiG,res,r.g.side);
  if(res==='score'){const pts=act.pts||S.pts;if(pens)ad.pens[0]++;else{ad.sc[0]+=pts;st('A','sc',pts)}M.goals.push({who:sh.n,t:clockText(),team:'A'});SFX.cheer(1.2);bigText(S.W.score,`${nm} • ${pens?'':ad.scoreText()}`,'#ffe9a8');
   say(pick([`${S.W.score} ${sh.n} ${act.n==='Chip'?'dinks it over the top':act.n==='Three-pointer'?'drains it from deep':act.n==='Dunk'?'throws it down':'finishes brilliantly'}! ${pens?'':ad.scoreText()}`,`${S.W.score} What a finish from ${nm}! ${M.tA} lead the way${pens?'':', '+ad.scoreText()}.`]),'SCORE',true);
   if(S.rugby&&!pens)await conversion(true,shooter.x)}
  else{SFX.groan();if(res==='save'){st('B','sv');bigText(S.W.save,'',"#93c5fd");say(pick([`${S.W.save} ${who} reads it ${guessed?'perfectly':'and gets across'}.`,`Denied! Great stop on ${nm}.`,`${nm} ${r.g.tag==='PERFECT'?'struck it sweetly but':'went for it and'} it's kept out.`]),'CHANCE')}
   else{bigText(S.W.miss,'','#fca5a5');say(pick([`${nm} ${r.g.side<0?'snatched at it, too early':'was a fraction late'}, and it goes begging.`,`Off target! ${nm} will want that one back.`,`${r.g.tag}! The timing was off and the chance is gone.`]),'CHANCE')}}
  shooter.lean=0}

 async function defend(pens){const opp=pens?M.squadB[1+ad.i%Math.max(2,S.sq-1)]:pick(M.squadB.slice(1));const nm=opp.n.split(' ').pop();baseScene();
  const dist=pens?(M.sp==='hockey'?10:M.sp==='handball'?7:11):S.hoop?6:M.sp==='hockey'?9:M.sp==='handball'?9:S.rugby?22:16+rnd()*5;const sx=pens?0:(rnd()-.5)*(S.hoop?4:F.W*.22);
  const shooter=addB(sx,nearGoal+dist,{no:opp.no,tag:nm,tool:M.sp==='hockey'?'#8b5a2b':null});const gk=M.squadA[0];
  const me=S.goal?addA(0,nearGoal+.4,{gk:1,no:gk.no,hl:1,tag:gk.n.split(' ').pop()}):addA(sx*.5,nearGoal+dist*(S.rugby?.45:.55),{no:M.squadA[1].no,hl:1,tag:M.squadA[1].n.split(' ').pop()});
  if(!pens){if(S.rugby){for(let i=-2;i<=2;i++)if(i)addA(i*7+(rnd()-.5)*3,12+rnd()*2,{no:5+i})}else{addA(sx-2,nearGoal+dist-3,{no:4});addB(sx+F.W*.2,nearGoal+dist+1,{no:9})}}
  M.scene.ball={x:sx-.3,y:nearGoal+dist-.4,z:S.hoop?1:0,vis:true};view(nearGoal-S.field.Lv*.1,S.field.Lv,sx*.3);snapView();st('B','ch');
  const oa=pick(S.atk),oAim=oa.aim?pick([-1,0,1]):pick([-1,0,1]);const truth=({easy:.76,medium:.62,hard:.5})[CFG.diff];const hs=rnd()<truth?oAim:pick([-1,0,1]);
  const title=pens?`Shootout: ${opp.n} to shoot. Save it!`:S.rugby?`${opp.n} charges at your line. Make the tackle!`:S.hoop?`${opp.n} attacks the rim. Read the lane!`:`${opp.n} is through on your goal!`;
  if(!pens&&rnd()<.6)say(pick([`${M.tB} break forward, ${nm} in support...`,`Danger here for ${M.tA}! ${nm} has space.`,`${nm} picks up a loose ball and goes.`]),'DEFEND');
  const r=await moment({title,role:S.roles[1],acts:S.dfn,forceAim:1,aimLbl:'GUESS',aimNames:['◀ Their left','● Middle','Their right ▶'],hint:`👀 ${nm} is shaping ${['left','middle','right'][hs+1]}`,simAim:hs,simAct:()=>S.dfn[0]});
  const q=r.g.q;if(q>=1)st('A','pf');const right=r.aim===oAim;const steal=r.act.steal;
  let stop=right?(steal?.28+.62*q:.36+.56*q):(steal?.02:.06+.15*q);stop=clamp(stop+upg(M.sp).def*.022,0,.97);
  const base=clamp(oa.p*1.32/rmult()*(pens?1.15:1)*(M.mentality==='Defensive'?.9:M.mentality==='Attacking'?1.08:1),.1,.95);
  const conceded=rnd()<base*(1-stop);st('B','sh');if(conceded||rnd()<.75)st('B','ot');const res=conceded?'score':(rnd()<.25&&!right?'miss':'save');
  SFX.hit(.9);await shotAnim(false,shooter,me,oa,oAim,r.aim,res,r.g.side);
  if(conceded){const pts=oa.pts||S.pts;if(pens)ad.pens[1]++;else ad.sc[1]+=pts;M.goals.push({who:opp.n,t:clockText(),team:'B'});SFX.groan();bigText(S.W.score,`${M.tB} • ${pens?'':ad.scoreText()}`,'#fca5a5');
   say(pick([`${S.W.score} for ${M.tB}. ${nm} ${right?'beats you even though you read it':'sends you the wrong way'}. ${pens?'':ad.scoreText()}`,`They score. ${nm} makes no mistake${pens?'':', '+ad.scoreText()}.`]),'SCORE',true);
   if(S.rugby&&!pens)await conversion(false,shooter.x)}
  else{st('A','sv');SFX.cheer(.9);if(steal&&right){bigText('STOLEN!','','#86efac');say(`Steal! ${M.squadA[1].n.split(' ').pop()} picks the pocket and ${M.tA} break.`,'DEFEND');ad.force='A'}
   else{bigText(res==='miss'?S.W.miss:S.W.save,'','#86efac');say(res==='miss'?pick([`${nm} pulls it wide. Let off for ${M.tA}!`,`Off target from ${nm}, the pressure told.`]):pick([`${S.W.save} ${right?'You guessed right and timed it '+(q>=1?'perfectly':'well'):'Scrambled clear somehow'}!`,`Huge stop from ${M.tA}! The crowd roars.`]),'DEFEND')}}}

 async function shotAnim(mine,sh,keep,act,aim,guess,res,side){const B=M.scene.ball;const gy=mine?farGoal:nearGoal,s=mine?1:-1;const from=[B.x,B.y,B.z];
  if(S.hoop){const jump=keep&&!mine?keep:null;const def=M.scene.actors.find(a=>a.team===(mine?'B':'A')&&a!==sh);const rim=[0,gy,3.05];
   const p=moveActor(sh,lerp(sh.x,0,act.n==='Layup'||act.n==='Dunk'?.7:.1),lerp(sh.y,gy,act.n==='Layup'||act.n==='Dunk'?.75:.1),.45);if(def){def.run=true;anim(.5,k=>{def.z=Math.sin(Math.PI*k)*(res==='save'?.9:.4);def.arms=Math.sin(Math.PI*k)})}if(jump){anim(.5,k=>{jump.z=Math.sin(Math.PI*k)*.8;jump.arms=1})}await p;
   sh.arms=1;await anim(.2,k=>{sh.z=Math.sin(Math.PI*k)*.6});sh.arms=0;
   if(res==='score'){await flyBall([sh.x,sh.y,2.3],rim,.75,act.n==='Dunk'?.3:act.n==='Three-pointer'?3:2,1);SFX.thud();await flyBall(rim,[0,gy,.1],.35,0)}
   else{await flyBall([sh.x,sh.y,2.3],res==='save'?[sh.x*.7,lerp(sh.y,gy,.2),2.8]:rim,.6,res==='save'?.5:2.2,1);SFX.thud();await flyBall([B.x,B.y,B.z],[(rnd()-.5)*6,gy-s*(3+rnd()*3),0],.6,1.5)}return}
  if(S.rugby){const run=sh;if(act.n==='Pass wide'){const mate=M.scene.actors.find(a=>a.team===run.team&&a!==run);if(mate){mate.x=run.x+(aim||1)*12;await flyBall(from,[mate.x,mate.y,1],.5,1);M.scene.actors.forEach(a=>a.hl=0);mate.hl=1;mate.tag=run.tag;run.tag=null}}
   const carrier=M.scene.actors.find(a=>a.hl)||run;const lineY=mine?L:0,tx=clamp(carrier.x+aim*6,-F.W/2+3,F.W/2-3);
   if(act.n==='Grubber kick'){await flyBall([carrier.x,carrier.y,.3],[tx,mine?L+3:-3,0],.9,.6)}
   if(res==='score'){const b=M.scene.ball;const tackler=M.scene.actors.find(a=>a.team!==carrier.team);if(tackler)moveActor(tackler,tx+2,lineY-s*1,1.1);await moveActor(carrier,tx,lineY+s*3,1.2,k=>{b.x=carrier.x+.3;b.y=carrier.y;b.z=1});await anim(.3,k=>{carrier.z=-.0;carrier.lean=k});b.z=0}
   else{const tk=M.scene.actors.filter(a=>a.team!==carrier.team).sort((a,b)=>Math.abs(a.x-tx)-Math.abs(b.x-tx))[0];const ty=lerp(carrier.y,lineY,.35);const b=M.scene.ball;if(tk)moveActor(tk,tx,ty,.8);await moveActor(carrier,tx,ty,.9,k=>{b.x=carrier.x+.3;b.y=carrier.y;b.z=1});SFX.thud();b.vis=true;await flyBall([b.x,b.y,1],[b.x+rnd()*3-1.5,b.y-s,0],.4,.5)}
   return}
  /* goal sports */
  const G=S.goal,hw=G.w/2;let tx=aim*hw*.62+(rnd()-.5)*.4,tz=clamp((act.z||.5)+(rnd()-.4)*.4,.1,G.h*.9);if(act.n==='Chip'||act.n==='Lob')tz=G.h*.82;if(act.n==='Deke')tx=(aim||pick([-1,1]))*hw*.5;
  if(res==='miss'){if(rnd()<.5||!side){tx=(aim||pick([-1,1]))*(hw+.6+rnd())}else tz=G.h+.4+rnd()*.8}
  const kx=guess*hw*.55,dur=act.fast?.42:act.n==='Chip'||act.n==='Lob'?.95:.6;
  if(keep){const k0=keep.x;anim(dur*.9,k=>{keep.x=lerp(k0,kx,ease(k));keep.z=Math.sin(Math.PI*k)*(guess?.5:.2);keep.lean=guess*k*.8;keep.arms=k})}
  sh.lean=.4;const to=res==='save'?[kx*.95,gy-s*.25,clamp(tz,.2,1.6)]:[tx,gy+s*.4,tz];
  await flyBall(from,to,dur,act.n==='Chip'||act.n==='Lob'?3.2:act.n==='Bounce shot'?.1:Math.max(.2,tz*.4),1);
  if(res==='score'){await flyBall(to,[tx*.9,gy+s*(G.d*.8),Math.max(.1,tz*.5)],.25,0);SFX.thud()}
  else if(res==='save'){SFX.thud();await flyBall(to,[to[0]+(guess||1)*3,gy-s*(2+rnd()*3),0],.55,1.2)}
  else await flyBall(to,[to[0]*1.3,gy+s*4,0],.4,.3);
  if(keep)setTimeout(()=>{if(keep){keep.z=0;keep.lean=0;keep.arms=0}},400)}

 async function conversion(mine,x){const kx=clamp(x,-25,25),ky=mine?L-15:15,gy=mine?L:0,s=mine?1:-1;baseScene();const kk=mine?addA(kx,ky-s*1.5,{hl:1,no:10,tag:'Kicker'}):addB(kx,ky-s*1.5,{no:10});M.scene.ball={x:kx,y:ky,z:.25,vis:true};
  view(mine?ky-S.field.Lv*.35:-S.field.Lv*.08,S.field.Lv,kx*.6);snapView();const wind=pick([-1,0,1]);
  let ok;if(mine){const r=await moment({title:`Conversion from ${Math.abs(Math.round(kx))} m ${kx<0?'left':'right'} of the posts. Wind: ${['← blowing left','calm','blowing right →'][wind+1]}`,role:'KICKER',acts:[{n:'Place kick',d:'Aim into the wind',aim:1}],aimLbl:'AIM',hint:'Aim against the wind',simAct:()=>({n:'Place kick',aim:1})});
   const need=-wind;ok=rnd()<clamp((.3+.62*r.g.q)*(r.aim===need?1.05:.45)*(1-Math.abs(kx)/80),.05,.95);if(r.g.q>=1)st('A','pf')}else ok=rnd()<clamp(.68/rmult(),.3,.9);
  SFX.hit(1);const tx=ok?(rnd()-.5)*3:(rnd()<.5?-1:1)*(3.5+rnd()*2);await flyBall([kx,ky,.25],[tx,gy+s*4,ok?6:3.5],1.1,4,1);
  if(ok){if(mine){ad.sc[0]+=2;st('A','sc',2)}else ad.sc[1]+=2;bigText('CONVERTED','+2',mine?'#ffe9a8':'#fca5a5');mine?SFX.cheer(.9):SFX.groan();say(`The conversion is good. ${ad.scoreText()}.`,'KICK')}
  else{bigText('MISSED','conversion',mine?'#fca5a5':'#86efac');mine?SFX.groan():SFX.cheer(.6);say(`The kick drifts wide. Still ${ad.scoreText()}.`,'KICK')}updBug()}

 async function idleScene(text){baseScene();const sc=M.scene;for(let i=0;i<Math.min(S.sq,6);i++){sc.actors.push(mkActor('A',(i-2.5)*F.W/7,L/2-4-(i%2)*6,{no:M.squadA[i%M.squadA.length].no,run:true}));sc.actors.push(mkActor('B',(i-2.5)*F.W/7+2,L/2+4+(i%2)*6,{no:M.squadB[i%M.squadB.length].no,run:true}))}
  sc.ball={x:0,y:L/2,z:0,vis:true};view(L/2-S.field.Lv*.55,S.field.Lv*1.15);idle(text);const b=sc.ball;await anim(1.4,k=>{b.x=Math.sin(k*9)*F.W*.2;b.y=L/2+Math.cos(k*5)*L*.1;b.z=Math.abs(Math.sin(k*14))*.6;sc.actors.forEach((a,i)=>{a.x+=(b.x-a.x)*.004*(i%3+1);a.y+=(b.y-a.y)*.002})})}

 ad.init=()=>{baseScene();view(L/2-S.field.Lv*.55,S.field.Lv*1.15);snapView()};
 ad.run=async()=>{await idleScene('Kick-off!');SFX.whistle(true);say(pick([`And we're underway! ${M.tA} against ${M.tB}.`,`Here we go. ${M.tA} versus ${M.tB}, let's play!`]),'START',true);
  let lastPer=1;
  while(ad.i<N){live();await bgPlay();setWin(ad.winP());updBug();
   const atk=ad.force?ad.force==='A':rnd()<pAtk();ad.force=null;if(atk)await attack();else await defend();ad.i++;updBug();setWin(ad.winP());
   const perNow=Math.min(S.periods,Math.floor(ad.i/N*S.periods-1e-9)+1);if(ad.i<N&&perNow!==lastPer){lastPer=perNow;SFX.whistle(true);const lbl=S.periods===2?'Half-time':S.pn==='Q'?(perNow===3?'Half-time':'End of quarter '+(perNow-1)):'End of period '+(perNow-1);
    bigText(lbl.toUpperCase(),ad.scoreText());say(`${lbl}. ${M.tA} ${ad.sc[0]}, ${M.tB} ${ad.sc[1]}. ${ad.sc[0]>ad.sc[1]?'You lead, keep it going.':ad.sc[0]<ad.sc[1]?'Work to do after the break.':'All square, everything to play for.'}`,'BREAK',true);await idleScene(lbl);}
   else await idleScene(pick(['Play continues…','Building again…','Ball in play…']))}
  if(ad.sc[0]===ad.sc[1]&&M.needWinner){SFX.whistle(true);
   if(S.tie==='shootout'){ad.mode='pens';ad.pens=[0,0];bigText('SHOOTOUT!','Sudden drama');say(`Level at full time! We go to a shootout.`,'SHOOTOUT',true);let rd=0;
    while(true){live();ad.i=rd;await attack(true);updBug();setWin(ad.winP());await wait(500);await defend(true);updBug();setWin(ad.winP());rd++;const left=Math.max(0,5-rd);if(rd>=5&&ad.pens[0]!==ad.pens[1])break;if(rd<5&&(ad.pens[0]>ad.pens[1]+left||ad.pens[1]>ad.pens[0]+left))break;if(rd>12)break;await wait(400)}
    if(ad.pens[0]===ad.pens[1])ad.pens[rnd()<.5?0:1]++}
   else{ad.mode='ot';bigText(S.tie==='golden'?'GOLDEN POINT':'OVERTIME','Next score matters');say(S.tie==='golden'?'Golden point! Next score wins it.':'We are going to overtime!','EXTRA',true);let n=0;
    while(ad.sc[0]===ad.sc[1]&&n<8){live();if(n%2===0)await attack();else await defend();n++;updBug();setWin(ad.winP());await wait(400)}
    if(ad.sc[0]===ad.sc[1]){if(rnd()<.5)ad.sc[0]+=S.pts;else ad.sc[1]+=S.pts;say('A late, late score settles it!','EXTRA')}}}
  SFX.whistle(true);SFX.buzzer();ad.i=N};
 ad.result=()=>{const a=ad.sc[0],b=ad.sc[1];let r=a>b?'WIN':a<b?'LOSS':'DRAW';if(ad.pens)r=ad.pens[0]>ad.pens[1]?'WIN':'LOSS';return{r,line:`${M.tA} ${a} - ${b} ${M.tB}${ad.pens?` (shootout ${ad.pens[0]}-${ad.pens[1]})`:''}`}};
 return ad}
