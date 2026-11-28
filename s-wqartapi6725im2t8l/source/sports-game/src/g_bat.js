
/* ================= baseball ================= */
function wpick(w){let s=0;for(const k in w)s+=Math.max(0,w[k]);let r=rnd()*s;for(const k in w){r-=Math.max(0,w[k]);if(r<=0)return k}return Object.keys(w)[0]}
function batAdapter(){const S=SPORTS.baseball,N=M.len;const ad={inn:1,top:true,outs:0,bases:[null,null,null],runs:[[],[]],sc:[0,0],hits:[0,0],done:false,balls:0,strikes:0};
 const userBatsFirst=M.userFirst;const batting=()=>ad.top===userBatsFirst?0:1;
 const PITCHES=[{n:'Fastball',d:'Fast meter, overpowers',fast:1.4,k:.06,aim:1},{n:'Slider',d:'Late break',fast:1.15,k:.04,aim:1},{n:'Curveball',d:'Big drop',fast:.95,k:.03,aim:1},{n:'Change-up',d:'Slow, fools timing',fast:.8,k:.05,aim:1}];
 const LOC=['inside','middle','away'];
 ad.clock=()=>(ad.top?'▲':'▼')+ad.inn+' • '+ad.outs+' OUT';
 ad.scoreText=()=>ad.sc[0]+' - '+ad.sc[1];
 ad.sub=()=>{const b=ad.bases.map((x,i)=>x?['1B','2B','3B'][i]:null).filter(Boolean);return`${batting()===0?'⚾ '+M.tA+' batting':'🧤 '+M.tA+' pitching'} • Count ${ad.balls}-${ad.strikes} • Bases: ${b.length?b.join(' '):'empty'}`};
 ad.winP=()=>{if(ad.done)return ad.sc[0]>ad.sc[1]?1:0;const halvesLeft=Math.max(0,(N-ad.inn)*2+(ad.top?1:0)+0.5);let w=0;const n=300,mu=.55*rmult(),mo=.55/rmult();
  for(let i=0;i<n;i++){let a=ad.sc[0],b=ad.sc[1];for(let h=0;h<Math.ceil(halvesLeft);h++){const r=-Math.log(rnd())*(h%2?mo:mu);(h%2===0)===(batting()===0)?a+=Math.floor(r):b+=Math.floor(r)}w+=a>b?1:a===b?.5:0}return w/n};
 ad.statsRows=()=>{const A=M.stats.A,B=M.stats.B;return[['Runs',ad.sc[0],ad.sc[1]],['Hits',ad.hits[0],ad.hits[1]],['Home runs',A.hr||0,B.hr||0],['Strikeouts (by)',A.k||0,B.k||0],['Walks',A.bb||0,B.bb||0],['Perfect timings',A.pf||0,'–'],['Line score',ad.runs[0].join(' ')||'-',ad.runs[1].join(' ')||'-']]};
 const BASE=[[19.4,19.4],[0,38.8],[-19.4,19.4],[0,0]];
 function scene(){const sc=M.scene;sc.actors=[];const bt=batting()===0?'A':'B',ft=bt==='A'?'B':'A';const bl=bt==='A'?M.squadA:M.squadB,fl=ft==='A'?M.squadA:M.squadB;
  sc.actors.push(mkActor(bt,-.9,.2,{bat:1,tool:'#c08a52',toolUp:1,hl:bt==='A'?1:0,no:bl[ad.bi%9].no,tag:bt==='A'?bl[ad.bi%9].n.split(' ').pop():null}));
  sc.actors.push(mkActor(ft,0,18.4,{pitch:1,hl:ft==='A'?1:0,no:fl[0].no,tag:ft==='A'?fl[0].n.split(' ').pop():null}));sc.actors.push(mkActor(ft,0,-1.2,{no:fl[1].no,h:1.3}));
  [[22,24],[8,34],[-8,34],[-22,24],[-35,75],[0,88],[35,75]].forEach((p,i)=>sc.actors.push(mkActor(ft,p[0],p[1],{no:fl[(i+2)%9].no})));
  ad.bases.forEach((r,i)=>{if(r)sc.actors.push(mkActor(bt,BASE[i][0]-1,BASE[i][1],{runner:i,no:r.no}))});sc.ball={x:0,y:18.4,z:1.8,vis:true};view(-4,S.field.Lv);snapView()}
 async function pitchAnim(loc,swing,hit){const B=M.scene.ball,p=M.scene.actors.find(a=>a.pitch),bt=M.scene.actors.find(a=>a.bat);p.arms=1;await anim(.25,k=>{p.lean=-k*.5});p.lean=.4;p.arms=0;SFX.thud();
  await flyBall([.3,17.5,1.9],[loc*.28,.3,.75+rnd()*.3],.5,.25,1);if(swing){bt.toolUp=0;setTimeout(()=>{bt.toolUp=1},250)}
  if(!hit){SFX.thud();B.vis=false;return}SFX.hit(hit==='HR'?1.3:1);const side=(rnd()-.5)*2;
  const to={HR:[side*40,112,6],'3B':[side*45,92,0],'2B':[side*38,78,0],'1B':[side*22,42,0],out:[side*18,rnd()<.5?28:70,rnd()<.5?0:0],foul:[(rnd()<.5?-1:1)*45,25,0]}[hit];
  view(hit==='1B'||hit==='foul'?-4:8,hit==='HR'?95:hit==='1B'?40:70,side*8,1.2);await flyBall([B.x,B.y,B.z],to,hit==='HR'?2.2:1.4,hit==='HR'?38:hit==='out'&&to[1]>50?30:hit==='foul'?12:hit==='1B'?3:10,1)}
 function advance(hit,team,batter){let r=0;const b=ad.bases;const n={'BB':1,'1B':1,'2B':2,'3B':3,'HR':4}[hit];
  if(hit==='BB'){if(b[0]){if(b[1]){if(b[2])r++;b[2]=b[1]}b[1]=b[0]}b[0]=batter;return r}
  for(let i=2;i>=0;i--)if(b[i]){const adv=i+n+(hit==='1B'&&i===1?1:0);if(adv>=3){r++;b[i]=null}else{b[adv]=b[i];b[i]=null}}
  if(n>=4)r++;else b[n-1]=batter;return r}
 async function runAnim(){const sc=M.scene;sc.actors=sc.actors.filter(a=>a.runner==null);const bt=batting()===0?'A':'B';const rs=[];ad.bases.forEach((r,i)=>{if(r){const a=mkActor(bt,BASE[i][0]-1,BASE[i][1],{runner:i,no:r.no,run:true});sc.actors.push(a);rs.push(a)}});await anim(.5,()=>{});rs.forEach(a=>a.run=false)}
 function score(team,r){if(!r)return;ad.sc[team]+=r;ad.runs[team][ad.inn-1]=(ad.runs[team][ad.inn-1]||0)+r}
 async function userBat(){const team=0,b=M.squadA[ad.bi%9];ad.balls=0;ad.strikes=0;scene();say(`Now batting: ${b.n}, number ${b.no}.`,'AT BAT');
  while(true){live();scene();const p=pick(PITCHES),loc=pick([-1,0,1]),inZone=loc===0||rnd()<.45;const truth=({easy:.75,medium:.6,hard:.48})[CFG.diff];const hl=rnd()<truth?loc:pick([-1,0,1]);updBug();
   const r=await moment({title:`${b.n} • Count ${ad.balls}-${ad.strikes} • ${p.n} coming`,role:S.roles[0],speed:p.fast,acts:[{n:'Contact swing',d:'Put it in play'},{n:'Power swing',d:'Swing for the fences',fast:1.1},{n:'Take',d:'Let it go by',noMeter:1}],forceAim:1,aimLbl:'SIT ON',aimNames:['Inside','Middle','Away'],hint:`👀 Catcher sets up ${LOC[hl+1]}`,simAim:hl,simAct:()=>({n:rnd()<.7?'Contact swing':'Power swing'})});
   const q=r.g.q;if(q>=1)st('A','pf');const nm=r.act.n;
   if(nm==='Take'){await pitchAnim(loc,false,null);if(inZone){ad.strikes++;if(ad.strikes>=3){st('B','k');ad.outs++;SFX.groan();bigText('STRIKE THREE','called','#fca5a5');say(`Called strike three! ${b.n.split(' ').pop()} has to sit down.`,'OUT');break}say(`Strike ${ad.strikes}, caught looking.`,'PITCH')}
    else{ad.balls++;if(ad.balls>=4){st('A','bb');const run=advance('BB',team,b);score(team,run);bigText('WALK','',"#93c5fd");say(`Ball four. ${b.n.split(' ').pop()} takes first base.`,'WALK');await runAnim();break}say(`Ball ${ad.balls}, ${LOC[loc+1]}.`,'PITCH')}continue}
   const guess=r.aim===loc,qe=clamp(q*(guess?1.08:.72)*rmult()*(1+upg(M.sp).pow*.015),0,1.2),pow=nm==='Power swing';
   const W=pow?{miss:.6-.48*qe,foul:.15,out:.45-.1*qe,'1B':.05+.04*qe,'2B':.03+.08*qe,'3B':.01,HR:.01+.3*qe*qe}:{miss:.35-.28*qe,foul:.2,out:.55-.2*qe,'1B':.08+.22*qe,'2B':.02+.08*qe,'3B':.005+.015*qe,HR:.004+.05*qe*qe};
   const out=wpick(W);
   if(out==='miss'){await pitchAnim(loc,true,null);ad.strikes++;if(ad.strikes>=3){st('B','k');ad.outs++;SFX.groan();bigText('STRUCK OUT','','#fca5a5');say(`Swing and a miss, strike three! ${r.g.tag==='EARLY'?'Way out in front of the '+p.n.toLowerCase():'Beaten by the '+p.n.toLowerCase()}.`,'OUT');break}say(`Swing and a miss. ${ad.balls}-${ad.strikes}.`,'PITCH');continue}
   if(out==='foul'){await pitchAnim(loc,true,'foul');if(ad.strikes<2)ad.strikes++;say(`Fouled off. ${ad.balls}-${ad.strikes}.`,'PITCH');continue}
   await pitchAnim(loc,true,out);
   if(out==='out'){ad.outs++;SFX.groan();bigText('OUT','','#fca5a5');say(pick([`Hit hard, but right at the fielder. ${ad.outs} out.`,`Routine play, ${b.n.split(' ').pop()} is out.`,`Caught on the warning track! So close.`]),'OUT');break}
   ad.hits[0]++;if(out==='HR')st('A','hr');const run=advance(out,team,b);score(team,run);SFX.cheer(out==='HR'?1.4:.9);
   bigText(out==='HR'?'HOME RUN!':{'1B':'SINGLE','2B':'DOUBLE','3B':'TRIPLE'}[out],run?`+${run} run${run>1?'s':''}`:'','#ffe9a8');
   say(out==='HR'?`${b.n.split(' ').pop()} crushes it! That ball is gone! ${run} run${run>1?'s':''} score. ${ad.scoreText()}`:`${{'1B':'Base hit','2B':'Into the gap for a double','3B':'All the way to the wall, a triple'}[out]} for ${b.n.split(' ').pop()}${run?`, and ${run} run${run>1?'s':''} come in`:''}.`,'HIT',out==='HR');await runAnim();break}
  ad.bi++}
 async function userPitch(){const team=1,b=M.squadB[ad.oi%9];ad.balls=0;ad.strikes=0;scene();const aiG=aiGuessAim(M.aimHist,M.lvl);updBug();
  const r=await moment({title:`${M.tB} batter: ${b.n}. Pick your pitch and spot.`,role:S.roles[1],acts:PITCHES,aimLbl:'LOCATE',aimNames:['Inside','Middle','Away'],hint:`👀 Hitter looking ${LOC[(rnd()<.6?aiG:pick([-1,0,1]))+1]}`,simAct:()=>pick(PITCHES)});
  const q=r.g.q;if(q>=1)st('A','pf');const right=aiG===r.aim,qe=clamp(q*(right?.62:1.12)*(1+upg(M.sp).def*.015),0,1.2),edge=1/rmult(),mid=r.aim===0?1.25:1;
  const W={K:.1+.32*qe+r.act.k,out:.36,BB:.16*(1.25-q),'1B':.17*edge*mid*(1.2-qe),'2B':.06*edge*mid*(1.2-qe),'3B':.01,HR:.05*edge*mid*(1.4-qe)};const out=wpick(W);
  await pitchAnim(r.aim,out!=='BB'&&out!=='K',out==='K'||out==='BB'?null:out);
  if(out==='K'){st('A','k');ad.outs++;SFX.cheer(.9);bigText('STRIKEOUT!','','#86efac');say(`${r.g.tag==='PERFECT'?'Painted the corner':'Got him'}! ${b.n.split(' ').pop()} strikes out on the ${r.act.n.toLowerCase()}.`,'K');}
  else if(out==='out'){ad.outs++;SFX.cheer(.6);bigText('OUT','',"#86efac");say(pick([`Weak contact, easy out.`,`Popped up and caught. ${ad.outs} out.`,`Grounder to short, throw to first, out!`]),'OUT')}
  else if(out==='BB'){st('B','bb');const run=advance('BB',team,b);score(team,run);bigText('WALK','',"#fca5a5");say(`Ball four, that's a walk${run?' and a run is forced in':''}.`,'WALK');await runAnim()}
  else{ad.hits[1]++;if(out==='HR')st('B','hr');const run=advance(out,team,b);score(team,run);SFX.groan();bigText(out==='HR'?'HOME RUN':{'1B':'SINGLE','2B':'DOUBLE','3B':'TRIPLE'}[out],run?`${M.tB} +${run}`:'','#fca5a5');say(`${b.n.split(' ').pop()} ${out==='HR'?'goes deep! Home run for '+M.tB:'gets a hit'}${run&&out!=='HR'?', '+run+' scores':''}. ${ad.scoreText()}`,'HIT',out==='HR');await runAnim()}
  ad.oi++}
 ad.init=()=>{ad.bi=0;ad.oi=0;scene()};
 ad.run=async()=>{SFX.whistle();say(`Play ball! ${userBatsFirst?M.tA:M.tB} bat first.`,'START',true);await wait(700);
  for(ad.inn=1;;ad.inn++){for(const top of [true,false]){ad.top=top;ad.outs=0;ad.bases=[null,null,null];updBug();if(ad.inn>1||!top)bigText((top?'TOP ':'BOTTOM ')+ad.inn,ad.scoreText());
    const home=userBatsFirst?1:0;if(!top&&ad.inn>=N&&ad.sc[home]>ad.sc[1-home])break;
    say(`${top?'Top':'Bottom'} of inning ${ad.inn}. ${batting()===0?M.tA+' up to bat':M.tA+' in the field'}.`,'INNING');await wait(600);
    let pa=0;while(ad.outs<3&&pa<14){live();if(batting()===0)await userBat();else await userPitch();pa++;updBug();setWin(ad.winP());
     if(!top&&ad.inn>=N&&ad.sc[home]>ad.sc[1-home]){bigText('WALK-OFF!','',batting()===0?'#ffe9a8':'#fca5a5');say('Walk-off! That ends the game!','FINAL',true);break}await wait(300)}
    ad.runs[batting()][ad.inn-1]=ad.runs[batting()][ad.inn-1]||0;if(pa>=14)say('The side is retired.','INNING')}
   if(ad.inn>=N&&(ad.sc[0]!==ad.sc[1]||(!M.needWinner&&ad.inn>=N+1)||ad.inn>=N+3))break;if(ad.inn>=N&&ad.sc[0]===ad.sc[1])say('Tied up! Extra innings.','EXTRAS',true)}
  ad.done=true;SFX.buzzer()};
 ad.result=()=>({r:ad.sc[0]>ad.sc[1]?'WIN':ad.sc[0]<ad.sc[1]?'LOSS':'DRAW',line:`${M.tA} ${ad.sc[0]} - ${ad.sc[1]} ${M.tB} • Hits ${ad.hits[0]}-${ad.hits[1]}`});
 return ad}
