
/* ================= net and racket sports ================= */
function netScore(fmt,len,cap){const s={fmt,p:[0,0],g:[0,0],sets:[0,0],hist:[],tb:false,server:0,tbFirst:0,done:false,winner:-1,
 tbOnly:fmt==='tennis'&&len===0,games:fmt==='tennis'?len:0,noAd:fmt==='tennis'&&len===4,target:fmt==='tt'?11:Math.abs(len),bestOf:fmt==='tt'?len:fmt==='tennis'?1:(len<0?3:1),cap:cap||0,ptsInGame:0};
 if(s.tbOnly)s.tb=true;return s}
function netClone(s){return JSON.parse(JSON.stringify(s))}
function netAdd(s,w){const o=1-w;let ev='point';
 if(s.fmt==='tennis'){s.p[w]++;const tgt=s.tb?(s.games===4?5:7):4;
  if(s.tb){const tot=s.p[0]+s.p[1];if(s.p[w]>=tgt&&s.p[w]-s.p[o]>=2){s.g[w]++;ev='set'}else{if(tot%2===1)s.server=1-s.server}}
  else{const won=s.noAd?(s.p[w]>=4&&(s.p[w]>s.p[o]||s.p[w]+s.p[o]>=7)):(s.p[w]>=4&&s.p[w]-s.p[o]>=2);if(won){s.g[w]++;s.p=[0,0];s.server=1-s.server;ev='game';
    if(s.g[w]>=s.games&&s.g[w]-s.g[o]>=2)ev='set';else if(s.g[0]===s.games&&s.g[1]===s.games){s.tb=true;s.tbFirst=s.server}}}
  if(ev==='set'){s.done=true;s.winner=w;s.sets[w]++;ev='match'}return ev}
 s.p[w]++;const T=s.target,pw=s.p[w],po=s.p[o];let gameWon=pw>=T&&pw-po>=2;if(s.cap&&pw>=s.cap)gameWon=true;
 if(s.fmt==='rally')s.server=w;else{const tot=s.p[0]+s.p[1];if(s.p[0]>=10&&s.p[1]>=10)s.server=1-s.server;else if(tot%2===0)s.server=1-s.server}
 if(gameWon){s.sets[w]++;s.hist.push(s.p.slice());s.p=[0,0];ev='set';if(s.sets[w]>Math.floor(s.bestOf/2)){s.done=true;s.winner=w;ev='match'}else if(s.fmt==='tt')s.server=s.hist.length%2}
 return ev}
function netAdapter(){const S=SPORTS[M.sp],F=S.field,L=F.L,hw=F.W/2,isTT=M.sp==='tabletennis',isV=M.sp==='volleyball',zT=isTT?F.table:0;
 const s=netScore(S.fmt,M.len,S.cap);s.server=M.userFirst?0:1;s.tbFirst=s.server;const ad={s};
 const TN=['0','15','30','40','AD'];
 ad.scoreText=()=>S.fmt==='tennis'?(s.tbOnly?s.p[0]+' - '+s.p[1]:s.g[0]+' - '+s.g[1]):s.p[0]+' - '+s.p[1];
 ad.clock=()=>S.fmt==='tennis'?(s.tb?'TIEBREAK':(s.p[0]>=3&&s.p[1]>=3&&!s.noAd?(s.p[0]===s.p[1]?'DEUCE':(s.p[0]>s.p[1]?'AD '+M.cA:'AD '+M.cB)):TN[Math.min(3,s.p[0])]+'-'+TN[Math.min(3,s.p[1])])):(s.bestOf>1?'SET '+(s.hist.length+1):'GAME');
 ad.sub=()=>{const srv=s.server===0?M.tA:M.tB;if(S.fmt==='tennis')return`${s.tbOnly?'Match tiebreak':s.tb?'Tiebreak '+s.p[0]+'-'+s.p[1]:'Games '+s.g[0]+'-'+s.g[1]} • 🎾 ${srv} serving`;return`${s.bestOf>1?'Sets '+s.sets[0]+'-'+s.sets[1]+' • ':''}${s.hist.length?'Last set '+s.hist[s.hist.length-1].join('-')+' • ':''}Serve: ${srv}`};
 const pp=()=>clamp(.5+(M.uR-M.oR)/210+(M.style==='Aggressive'?.01:0),.2,.8);
 ad.winP=()=>{if(s.done)return s.winner===0?1:0;let w=0;const n=200,p=pp();for(let i=0;i<n;i++){const c=netClone(s);let g=0;while(!c.done&&g++<400)netAdd(c,rnd()<p?0:1);w+=c.winner===0?1:0}return w/n};
 ad.statsRows=()=>{const A=M.stats.A,B=M.stats.B;return[['Points won',A.pw||0,B.pw||0],['Aces / service winners',A.ace||0,B.ace||0],['Winners',A.win||0,B.win||0],['Errors',A.err||0,B.err||0],['Great defence',A.sv||0,B.sv||0],['Longest rally',M.longRally||0,'–'],['Perfect timings',A.pf||0,'–']]};
 const me=()=>M.scene.actors.find(a=>a.team==='A'&&a.hl),them=()=>M.scene.actors.find(a=>a.team==='B'&&a.main);
 const by=isTT?-.7:isV?1.5:-.4,oy=isTT?L+.7:isV?L-1.5:L+.4,hz=isTT?F.table+.25:isV?2.6:1,dur=isTT?.55:M.sp==='badminton'?.85:isV?.9:.8;
 function scene(){const sc=M.scene;sc.actors=[];const tool=isV?null:'#e5e7eb';sc.actors.push(mkActor('A',0,by,{hl:1,ghost:isTT?1:0,no:M.squadA[0].no,tag:isTT?null:M.squadA[0].n.split(' ').pop(),tool,toolUp:1}));sc.actors.push(mkActor('B',0,oy,{main:1,no:M.squadB[0].no,tool,toolUp:1}));
  if(isV){for(let i=1;i<6;i++){const x=((i%3)-1)*3,y=i<3?L/2-1:L/2-6;sc.actors.push(mkActor('A',x,L-y-0,{no:M.squadA[i].no}));}for(let i=1;i<6;i++){const x=((i%3)-1)*3,y=i<3?L/2+1:L/2+6;sc.actors.push(mkActor('B',x,y,{no:M.squadB[i].no}))}
   sc.actors.filter(a=>a.team==='A'&&!a.hl).forEach((a,i)=>{a.y=i<2?L/2-1:L/2-5.5})}
  sc.ball={x:0,y:by+.3,z:hz,vis:true};view(isTT?-1.5:-L*.1,isTT?6:F.Lv,0,isTT?1.6:1,isTT?1.27:null);snapView()}
 function tgt(aim,far){const x=clamp(aim*hw*.62+(rnd()-.5)*hw*.25,-hw+.05,hw-.05);return[x,far?L*(isTT?.8:.78):L*(isTT?.2:.22),zT]}
 async function myShot(act,aim,res){const a=me(),o=them(),B=M.scene.ball;const t=tgt(aim,true);let to=t;if(res==='err'){to=rnd()<.5?[t[0],L/2,zT+(F.net||1)*.5]:[t[0]+(rnd()<.5?-1:1)*(rnd()<.4?hw*.5:0),L*(1.08+rnd()*.06),zT]}
  SFX.hit(act.fast?1.2:.8);a.toolUp=0;setTimeout(()=>{a.toolUp=1},200);const hgt=act.n.match(/Lob|Clear|Kick|High/)?(isTT?.5:6):act.n.match(/Smash|Spike/)?(isTT?.1:.8):act.n.match(/Drop|Tip|Push/)?(isTT?.25:1.4):(isTT?.25:isV?2:1.6);
  if(o){const gx=res==='win'?-t[0]*.6:t[0];moveActor(o,clamp(gx,-hw,hw),oy,dur*.95)}
  await flyBall([a.x,a.y+.3,act.n.match(/Smash|Spike/)?(isTT?zT+.4:3):hz],to,act.fast?dur*.75:dur,hgt,1);if(res!=='err'||to[1]!==L/2){SFX.thud()}
  if(res==='win')await flyBall(to,[to[0]*1.2,L+3,zT],.5,isTT?.2:.6);B.z=Math.max(zT,B.z)}
 async function theirShot(act,aim,guess,res){const a=me(),o=them();const t=tgt(aim,false);SFX.hit(.8);o.toolUp=0;setTimeout(()=>{o.toolUp=1},200);
  if(res==='err'){const to=rnd()<.5?[t[0],L/2,zT+(F.net||1)*.5]:[t[0]+(rnd()<.5?-1:1)*hw*.6,-L*.08,zT];await flyBall([o.x,o.y-.3,hz],to,dur,isTT?.25:1.6,1);return}
  const gx=clamp(guess*hw*.62,-hw,hw);moveActor(a,gx,by,dur*.9);await flyBall([o.x,o.y-.3,act.n.match(/Smash|Spike/)?(isTT?zT+.4:3):hz],t,act.fast?dur*.75:dur,act.n.match(/Lob|Clear/)?6:isTT?.25:1.6,1);SFX.thud();
  if(res==='lost')await flyBall(t,[t[0]*1.1,-3,zT],.45,isTT?.2:.5)}
 async function point(){live();scene();const n=s.p[0]+s.p[1];let turn=s.server===0?'serve':'oserve',ex=0,weak=1,fault=0;
  if(rnd()<.35)say(pick([`${s.server===0?M.tA:M.tB} to serve. ${ad.scoreText()} ${S.fmt==='tennis'?'('+ad.clock()+')':''}`,`Here's the serve...`,`Quiet please... ${ad.clock()}.`]),'POINT');
  while(true){live();ex++;M.longRally=Math.max(M.longRally||0,ex);
   if(ex>9){const w=rnd()<pp()?0:1;return end(w,w===0?'win':'win','Long rally finally ends')}
   if(turn==='serve'){const acts=fault?S.serve.slice(-1):S.serve;const aiG=aiGuessAim(M.aimHist,M.lvl);const r=await moment({title:fault?'Second serve. Play it safe!':`Your serve • ${ad.scoreText()} ${S.fmt==='tennis'?'• '+ad.clock():''}`,role:S.roles[0],acts,hint:`👀 Receiver cheating ${['left','middle','right'][(rnd()<.6?aiG:pick([-1,0,1]))+1]}`,simAct:()=>acts[acts.length-1]});
    const q=r.g.q;if(q>=1)st('A','pf');const a=r.act,gu=a.aim&&aiG===r.aim;const W=a.w*(.4+.9*q)*(gu?.5:1.25)*rmult()*(1+upg(M.sp).pow*.012),E=a.e*(1.6-q)/rmult()*(fault?.6:1);const x=rnd();
    if(x<W){await myShot(a,r.aim,'win');st('A','ace');return end(0,'ace',`ACE! ${M.squadA[0].n.split(' ').pop()} ${pick(['paints the line','is untouchable','fires it past them'])}.`)}
    if(x<W+E){await myShot(a,r.aim,'err');if(S.fmt==='tennis'&&!fault){fault=1;say('Fault. Second serve coming.','SERVE');scene();continue}return end(1,'err',S.fmt==='tennis'?'Double fault!':'Service error.')}
    await myShot(a,r.aim,'in');turn='oshot';continue}
   if(turn==='oserve'||turn==='oshot'){const pool=turn==='oserve'?S.serve:S.shots,oa=pick(pool),oAim=pick([-1,0,1]),sk=clamp((M.oR-45)/55,.1,1);
    const Eo=oa.e*(1.15-sk*.45)*(turn==='oserve'?.6:1)*(M.style==='Aggressive'?1.1:1);if(rnd()<Eo){await theirShot(oa,oAim,0,'err');st('B','err');return end(0,'oerr',pick([`${M.tB} ${turn==='oserve'?'serve into the net':'make the error'}. Point to you!`,`Unforced error from ${M.squadB[0].n.split(' ').pop()}.`]))}
    const hs=rnd()<({easy:.76,medium:.62,hard:.5})[CFG.diff]?oAim:pick([-1,0,1]);
    const r=await moment({title:turn==='oserve'?`${M.tB} serve: ${oa.n}. Read it!`:`${M.tB} hit a ${oa.n.toLowerCase()}. Get there!`,role:S.roles[1],acts:S.dfn,forceAim:1,aimLbl:'GUESS',aimNames:['◀ Left','● Middle','Right ▶'],hint:`👀 They're looking ${['left','middle','right'][hs+1]}`,simAim:hs,simAct:()=>S.dfn[0]});
    const q=r.g.q;if(q>=1)st('A','pf');const right=r.aim===oAim;let stop=right?.52+.44*q:.18+.3*q;if(r.act.dig){stop+=.12;weak=.8}else weak=1;stop=clamp(stop+upg(M.sp).def*.02,0,.98);
    const Wo=oa.w*(.8+sk*.5)*(M.style==='Safe'?.9:1);const lost=rnd()<clamp((1-stop)*(.45+Wo*1.6),0,.95);
    if(lost){await theirShot(oa,oAim,r.aim,'lost');st('B',turn==='oserve'?'ace':'win');return end(1,'owin',turn==='oserve'?`Ace from ${M.tB}. No chance.`:pick([`Winner from ${M.squadB[0].n.split(' ').pop()}. ${right?'You read it but could not get there':'Wrong way!'}`,`${M.tB} win the point with a ${oa.n.toLowerCase()}.`]))}
    await theirShot(oa,oAim,r.aim,'ok');st('A','sv');if(q>=1&&rnd()<.5)say(`${S.W.save} What a get!`,'RALLY');turn='shot';continue}
   if(turn==='shot'){const acts=S.shots,aiG=aiGuessAim(M.aimHist,M.lvl);const r=await moment({title:`Rally shot ${ex}. Go for it!`,role:'RALLY',acts,hint:`👀 ${M.squadB[0].n.split(' ').pop()} covering ${['left','middle','right'][(rnd()<.6?aiG:pick([-1,0,1]))+1]}`,simAct:()=>pick(acts)});
    const q=r.g.q;if(q>=1)st('A','pf');const a=r.act,gu=a.aim?aiG===r.aim:rnd()<.33;const agg=M.style==='Aggressive'?1.15:M.style==='Safe'?.85:1;
    const W=a.w*(.45+.85*q)*(gu?.55:1.25)*rmult()*weak*agg*(1+upg(M.sp).pow*.012),E=a.e*(1.55-q)/rmult()*agg;const x=rnd();
    if(x<W){await myShot(a,r.aim,'win');st('A','win');return end(0,'win',`${S.W.score} ${M.squadA[0].n.split(' ').pop()} ${pick(['rips a '+a.n.toLowerCase()+' past them','finds the gap','ends it in style'])}!`)}
    if(x<W+E){await myShot(a,r.aim,'err');st('A','err');return end(1,'err',pick([`${r.g.tag==='EARLY'?'Too early':r.g.tag==='LATE'?'Too late':'Just off'} and it's an error.`,`Into the net. Point ${M.tB}.`,`Long! That's an error.`]))}
    await myShot(a,r.aim,'in');turn='oshot';continue}}}
 async function end(w,kind,line){const ev=netAdd(s,w);st(w===0?'A':'B','pw');updBug();setWin(ad.winP());const big=ev!=='point';
  if(w===0){SFX.cheer(big?1.3:.7);bigText(ev==='match'?'MATCH!':ev==='set'?(S.fmt==='rally'||S.fmt==='tt'?'GAME!':'SET!'):ev==='game'?'GAME!':kind==='ace'?'ACE!':kind==='win'?S.W.score:'POINT',ad.scoreText(),'#ffe9a8')}else{SFX.groan();if(big)bigText(ev==='match'?'MATCH OVER':ev==='set'?'SET LOST':'GAME LOST',ad.scoreText(),'#fca5a5')}
  say(line+(big?` ${ev==='game'?'Game':ev==='set'?(S.fmt==='tennis'?'Set':'Game'):'Match'} to ${w===0?M.tA:M.tB}. ${ad.scoreText()}.`:''),w===0?'POINT':'THEM',big);await wait(big?1600:700)}
 ad.init=()=>{scene()};
 ad.run=async()=>{say(`Welcome to the ${S.nm.toLowerCase()} final. ${M.tA} face ${M.tB}. ${s.server===0?M.tA:M.tB} to serve first.`,'START',true);SFX.whistle();await wait(900);while(!s.done){await point()}};
 ad.result=()=>({r:s.winner===0?'WIN':'LOSS',line:`${M.tA} ${S.fmt==='tennis'?(s.tbOnly?s.p.join('-')+' (tiebreak)':s.g.join('-')):s.bestOf>1?s.sets.join('-')+' sets ('+s.hist.map(h=>h.join('-')).join(', ')+')':s.hist[0].join('-')} ${M.tB}`});
 return ad}
