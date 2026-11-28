
/* ================= screens, menus, pre-match show, match flow ================= */
let SP='football';
function show(id){['home','setup','pre','match','summary'].forEach(s=>$(s).classList.toggle('hidden',s!==id));window.scrollTo(0,0)}
function segBtns(id,val,fn){const el=$(id);[...el.querySelectorAll('button')].forEach(b=>{b.setAttribute('aria-pressed',b.dataset.v===String(val));b.onclick=()=>{fn(b.dataset.v);segBtns(id,b.dataset.v,fn)}})}
function openModal(html){$('modalBody').innerHTML=html;$('modal').classList.remove('hidden');const c=$('modalBody').querySelector('[data-close]');if(c)c.onclick=closeModal}
function closeModal(){$('modal').classList.add('hidden')}
$('modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});

function renderHome(){updCoins();const g=$('sportGrid');g.innerHTML='';const cr=document.createElement('a');cr.className='card feat';cr.href='cricket/';cr.innerHTML='<span class="ic">🏏</span><b>Cricket</b><small>The full 3D cricket game: bat, bowl, captain your country through a 100-level career.</small><span class="lv">★ FLAGSHIP • 3D STADIUM</span>';
 ORDER.forEach((id,i)=>{const S=SPORTS[id];const b=document.createElement('button');b.className='card';const lv=maxLvl(id);b.innerHTML=`<span class="ic">${S.ic}</span><b>${esc(S.nm)}</b><small>${esc(S.desc)}</small><span class="lv">CAREER ${Math.min(lv,100)}/100${lv>100?' ✓ DONE':''}</span>`;b.onclick=()=>openSetup(id);g.appendChild(b);if(i===0)g.appendChild(cr)})}

function renderCountries(){const q=$('cSearch').value.trim().toLowerCase();const g=$('cGrid');g.innerHTML='';
 COUNTRIES.filter(c=>!q||c.name.toLowerCase().includes(q)||c.code.toLowerCase().includes(q)).forEach(c=>{const b=document.createElement('button');b.className='cbtn';b.setAttribute('aria-pressed',CFG.country===c.code);b.innerHTML=`<span class="f">${c.flag}</span><span>${esc(c.name)}<br><span class="kit" style="background:${c.jersey}"></span> <span class="kit" style="background:${c.trim}"></span></span>`;b.onclick=()=>{CFG.country=c.code;saveCfg();renderCountries();$('customBox').classList.add('hidden');refreshSetup()};g.appendChild(b)});
 const cu=document.createElement('button');cu.className='cbtn';cu.setAttribute('aria-pressed',CFG.country==='CUSTOM');cu.innerHTML='<span class="f">🛠️</span><span>Custom country</span>';cu.onclick=()=>{CFG.country='CUSTOM';if(!CFG.custom)CFG.custom={code:'CUS',name:'My Nation',flag:'🏳️',jersey:'#7c3aed',trim:'#facc15',pants:'#1e1b4b',textCol:'#fff'};saveCfg();renderCountries();fillCustom();$('customBox').classList.remove('hidden');refreshSetup()};g.appendChild(cu)}
function fillCustom(){const c=CFG.custom;if(!c)return;$('cuName').value=c.name;$('cuCode').value=c.code;$('cuFlag').value=c.flag;$('cuJ').value=c.jersey;$('cuT').value=c.trim}
['cuName','cuCode','cuFlag','cuJ','cuT'].forEach(id=>$(id).addEventListener('input',()=>{const c=CFG.custom||{};c.name=$('cuName').value.trim()||'My Nation';c.code=($('cuCode').value.trim().toUpperCase()||'CUS').slice(0,3);c.flag=$('cuFlag').value.trim()||'🏳️';c.jersey=$('cuJ').value;c.trim=$('cuT').value;c.pants='#111827';c.textCol='#fff';CFG.custom=c;saveCfg();refreshSetup()}));
$('cSearch').addEventListener('input',renderCountries);

function openSetup(id){SP=id;const S=SPORTS[id];show('setup');$('sTitle').textContent=S.nm.toUpperCase();$('sDesc').textContent=S.desc;
 if(CFG.len[id]==null)CFG.len[id]=S.type==='net'||S.type==='race'?0:1;renderCountries();if(CFG.country==='CUSTOM'){fillCustom();$('customBox').classList.remove('hidden')}else $('customBox').classList.add('hidden');
 segBtns('gSeg',CFG.gender,v=>{CFG.gender=v;saveCfg();refreshSetup()});segBtns('mSeg',CFG.mode,v=>{CFG.mode=v;saveCfg();refreshSetup()});segBtns('dSeg',CFG.diff,v=>{CFG.diff=v;saveCfg();refreshSetup()});segBtns('tSeg',CFG.toss,v=>{CFG.toss=v;saveCfg()});
 const ls=$('lenSeg');ls.innerHTML='';S.lens.forEach((l,i)=>{const b=document.createElement('button');b.dataset.v=i;b.textContent=l[0];ls.appendChild(b)});segBtns('lenSeg',CFG.len[id],v=>{CFG.len[id]=+v;saveCfg()});
 $('lenLbl').textContent=S.type==='race'?'Distance':S.type==='golf'?'Round':'Match length';$('tossLbl').parentElement.classList.toggle('hidden',S.type==='race');$('tossLbl').textContent=S.type==='golf'?'Toss for the honour':'Toss call';
 if(!SP||CFG.lvlSel==null||CFG.lvlSp!==id){CFG.lvlSel=Math.min(maxLvl(id),100);CFG.lvlSp=id}refreshSetup()}
function refreshSetup(){const id=SP,S=SPORTS[id],max=maxLvl(id);updCoins();$('lvlSec').classList.toggle('hidden',CFG.mode!=='CAREER');$('oppSec').classList.toggle('hidden',CFG.mode!=='QUICK');
 const lg=$('lGrid');lg.innerHTML='';for(let i=1;i<=100;i++){const b=document.createElement('button');b.textContent=i%10===0?'🏆'+i:i;if(i<max)b.className='done';if(i%10===0)b.classList.add('final');b.disabled=i>max;b.setAttribute('aria-pressed',i===CFG.lvlSel);b.onclick=()=>{CFG.lvlSel=i;saveCfg();refreshSetup()};lg.appendChild(b)}
 const lvl=CFG.mode==='CAREER'?CFG.lvlSel:Math.max(1,Math.round(max*.6)),opp=oppFor(id,lvl);$('lvlInfo').textContent=` • ${lvl}${lvl%10===0?' (Cup Final)':''} vs ${opp.flag} ${opp.name}`;
 const os=$('oppSel');if(!os.options.length||os.dataset.me!==country().code){os.innerHTML='';os.dataset.me=country().code;COUNTRIES.filter(c=>c.code!==country().code).forEach(c=>{const o=document.createElement('option');o.value=c.code;o.textContent=c.flag+' '+c.name;os.appendChild(o)})}
 os.value=CFG.opp[id]||os.options[0].value;os.onchange=()=>{CFG.opp[id]=os.value;saveCfg();refreshSetup()};
 $('rateNote').textContent=`Your ${divName()} ${S.sq>1?'team':'athlete'} rating ${Math.round(teamRating(id))} • ${opp.code} rating ${Math.round(oppRating(lvl))} • Upgrades: ${UPG.map(u=>u.ic+upg(id)[u.k]).join(' ')}`;syncVoice()}
$('sBack').onclick=()=>{renderHome();show('home')};
$('bVoice1').onclick=toggleVoice;
$('bStore').onclick=()=>storeModal();
$('bLineup').onclick=()=>lineupModal(false);
$('bHelp').onclick=()=>helpModal();

function storeModal(){const sp=M&&!M.dead?M.sp:SP,u=upg(sp);openModal(`<div class="mhead"><h2>🛒 ${esc(SPORTS[sp].nm)} store</h2><div style="display:flex;gap:8px;align-items:center"><span class="pill coins">🪙 ${coins().toLocaleString()}</span><button class="btn" data-close>✕</button></div></div>
 <p class="note" style="margin-bottom:10px">Upgrades are for this sport only and raise your rating. Coins are shared with every sport, including Cricket.</p>`+UPG.map(x=>{const l=u[x.k],c=upgCost(l);return`<div class="upg"><div><b>${x.ic} ${x.n}</b> <span class="note">Level ${l}/10 • ${x.d}</span><div class="bar" style="margin-top:6px"><i style="width:${l*10}%"></i></div></div><button class="btn gold" data-buy="${x.k}" ${l>=10||coins()<c?'disabled':''}>${l>=10?'MAX':'🪙 '+c}</button></div>`}).join(''));
 $('modalBody').querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{const k=b.dataset.buy,uu=upg(sp),c=upgCost(uu[k]);if(coins()<c||uu[k]>=10)return;addCoins(-c);uu[k]++;LS.set('sports_upg_'+sp,uu);SFX.init();SFX.cheer(.5);toast(UPG.find(x=>x.k===k).n+' upgraded!');if(M&&!M.dead)M.uR=teamRating(sp);storeModal();if(!$('setup').classList.contains('hidden'))refreshSetup()})}
function lineupModal(inMatch){const sp=inMatch?M.sp:SP,S=SPORTS[sp];let sq=inMatch?M.squadA.slice():mySquad(sp);const starters=Math.max(S.sq,1);
 const draw=()=>{openModal(`<div class="mhead"><h2>👥 ${inMatch?'Your lineup':'Lineup editor'}</h2><button class="btn" data-close>✕</button></div><p class="note" style="margin-bottom:8px">${S.sq>1?`Top ${starters} start${S.goal?' (number 1 is your keeper/goalie)':''}. Rename players, change numbers and move them up or down.`:'Name your athlete.'}</p>
 <table><tr><th>#</th><th>Name</th><th></th></tr>${sq.map((p,i)=>`<tr${i>=starters?' style="opacity:.6"':''}><td><input class="inp" data-no="${i}" value="${p.no}" style="width:58px" ${inMatch?'disabled':''}></td><td><input class="inp" data-nm="${i}" value="${esc(p.n)}" maxlength="24" ${inMatch?'disabled':''}></td><td style="white-space:nowrap">${inMatch?(i<starters?'Starting':'Bench'):`<button class="btn" data-up="${i}">▲</button> <button class="btn" data-dn="${i}">▼</button>`}</td></tr>`).join('')}</table>
 ${inMatch?'':'<div style="display:flex;gap:8px;margin-top:10px"><button class="btn gold" id="luSave">Save lineup</button><button class="btn" id="luReset">Reset names</button></div>'}`);
  if(inMatch)return;const grab=()=>{$('modalBody').querySelectorAll('[data-nm]').forEach(e=>{sq[+e.dataset.nm].n=e.value.trim().slice(0,24)||sq[+e.dataset.nm].n});$('modalBody').querySelectorAll('[data-no]').forEach(e=>{sq[+e.dataset.no].no=clamp(parseInt(e.value)||1,1,99)})};
  $('modalBody').querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{grab();const i=+b.dataset.up;if(i>0)[sq[i-1],sq[i]]=[sq[i],sq[i-1]];draw()});$('modalBody').querySelectorAll('[data-dn]').forEach(b=>b.onclick=()=>{grab();const i=+b.dataset.dn;if(i<sq.length-1)[sq[i+1],sq[i]]=[sq[i],sq[i+1]];draw()});
  $('luSave').onclick=()=>{grab();LS.set(squadKey(sp),sq);toast('Lineup saved');closeModal()};$('luReset').onclick=()=>{try{localStorage.removeItem(squadKey(sp))}catch(e){}sq=mySquad(sp);draw()}};draw()}
const HELP={inv:'Each match is a run of big moments. When you attack, pick a shot and an aim, then tap when the needle is in the green PERFECT zone. The defence learns where you aim most, so mix it up! When they attack, guess their side (watch the 👀 hint) and time your save or tackle.',
 net:'Every point is played out. On serve, pick a serve and side. In the rally, choose your shot. When they hit, guess where it is going and time your return. Better timing means more winners and fewer errors.',
 bat:'Batting: read the pitch type and the catcher hint, choose where to sit (inside, middle, away), then swing for contact or power, or take the pitch. Pitching: pick a pitch and spot, then time the release.',
 golf:'Pick a club (its full distance is shown), aim to beat the wind and time your swing. EARLY pulls left, LATE pushes right. On the green, read the break and pick a start line.',
 race:'Wait for the gun or beep, then TAP. Tapping too early is a false start. Then tap once each time the needle reaches the green zone to build rhythm and speed. In 100 m swims, tap at the wall to turn.'};
function helpModal(){const S=SPORTS[M&&!M.dead?M.sp:SP];openModal(`<div class="mhead"><h2>❓ How to play ${esc(S.nm)}</h2><button class="btn" data-close>✕</button></div><p style="line-height:1.55">${HELP[S.type]}</p>
 <h3 style="margin:12px 0 6px;font-size:13px;color:#f2d58b">CONTROLS</h3><p class="note">Space or the gold button: start the meter, then tap to lock it. Keys 1 to 4 choose actions. Left and right arrows change your aim. ⏩ Sim lets your team play the moment. 🤖 Auto plays everything for you. 🧠 Tactics changes how your team plays.</p>
 <h3 style="margin:12px 0 6px;font-size:13px;color:#f2d58b">CAREER</h3><p class="note">100 levels per sport. Opponents get stronger as you climb. Every 10th level is a Cup Final that must have a winner. Win coins after every match and spend them in the store.</p>`)}

/* ---------- start a match ---------- */
function kitDist(a,b){const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));const x=p(a),y=p(b);return Math.abs(x[0]-y[0])+Math.abs(x[1]-y[1])+Math.abs(x[2]-y[2])}
function startMatch(){SFX.init();const id=SP,S=SPORTS[id];const lvl=CFG.mode==='CAREER'?CFG.lvlSel:Math.max(1,Math.round(maxLvl(id)*.6));const me=country(),opp=oppFor(id,lvl);
 let kitB=Object.assign({},opp);if(kitDist(me.jersey,opp.jersey)<120)kitB=Object.assign({},opp,{jersey:opp.trim,trim:opp.jersey,textCol:kitDist(opp.trim,'#ffffff')<200?'#0f172a':'#fff'});
 const n=Math.max(S.sq,1)+(S.sq>1?3:0);
 M={sp:id,lvl,mode:CFG.mode,len:S.lens[CFG.len[id]||0][1],dead:false,auto:false,aim:0,aimHist:{},anims:[],scene:{view:{y0:0,Lv:30},viewT:{y0:0,Lv:30},actors:[],ball:null},stats:{A:{},B:{}},log:[],worm:[],goals:[],
  uR:teamRating(id),oR:oppRating(lvl),opp,kitA:me,kitB,tA:me.name,tB:opp.name,cA:me.code,cB:opp.code,squadA:mySquad(id),squadB:genSquad(id,opp,CFG.gender,n),mentality:'Balanced',style:'Balanced',
  needWinner:CFG.mode==='CAREER'&&lvl%10===0,userFirst:true,wp:.5};
 M.ad=S.type==='inv'?invAdapter():S.type==='net'?netAdapter():S.type==='bat'?batAdapter():S.type==='golf'?golfAdapter():raceAdapter();
 preShow()}
$('bStart').onclick=startMatch;

/* ---------- pre-match show: lineups → walkout → toss → countdown ---------- */
async function preShow(){const S=SPORTS[M.sp],m=M;show('pre');const st=$('preStage');let skip=false;
 const bar=`<div class="pm-bar"><button class="btn" id="pmVoice">${CFG.voice?'🎙️ MALE VOICE ON':'🔇 MALE VOICE OFF'}</button><button class="btn" id="pmSkip">Skip to the action ⏭</button></div>`;
 const wire=()=>{const v=$('pmVoice');if(v)v.onclick=()=>{toggleVoice();v.textContent=CFG.voice?'🎙️ MALE VOICE ON':'🔇 MALE VOICE OFF'};const s=$('pmSkip');if(s)s.onclick=()=>{skip=true;try{speechSynthesis.cancel()}catch(e){}if(m.skipRes)m.skipRes()}};
 const pause=ms=>new Promise(r=>{m.skipRes=r;setTimeout(r,ms)});const live2=()=>{if(m.dead)throw ABORT};
 const head=`<div class="emb" style="width:110px;height:88px;margin:0 auto 8px;border-radius:10px;border:1px solid rgba(222,181,83,.6)"></div><div class="pm-eye">SPORTS • ${esc(S.nm.toUpperCase())} • ${M.mode==='CAREER'?'CAREER LEVEL '+M.lvl+(M.needWinner?' • CUP FINAL':''):'QUICK MATCH'}</div>`;
 const tlist=(c,sq,k)=>`<div class="pm-team"><h4><span style="font-size:22px">${c.flag}</span>${esc(c.name)} ${divName()}<span class="kit" style="background:${k.jersey}"></span></h4><ol>${sq.slice(0,Math.max(S.sq,1)).map((p,i)=>`<li style="animation-delay:${i*.09}s"><b>${p.no}</b>${esc(p.n)}${i===0&&S.goal?' (GK)':''}</li>`).join('')}</ol></div>`;
 try{
  st.innerHTML=head+`<div class="pm-title">${esc(M.tA)} vs ${esc(M.tB)}</div><div class="pm-teams">${tlist(M.kitA,M.squadA,M.kitA)}${tlist(M.opp,M.squadB,M.kitB)}</div>`+bar;wire();SFX.swell(.6,3);
  speak(`Good evening and welcome to ${S.nm}. ${M.tA} ${divName()} take on ${M.tB}. ${S.sq>1?'Here are the teams.':'Here are the athletes.'}`,true);await pause(5200);live2();
  if(!skip){const walkers=Math.min(Math.max(S.sq,1),8);let ps='';for(let i=0;i<walkers;i++){ps+=`<div class="p" style="left:calc(50% - 9px);background:linear-gradient(${M.kitA.jersey} 60%,${M.kitA.pants} 60%);--dx:${-60-i*34}px;animation-delay:${i*.18}s"></div><div class="p" style="left:calc(50% - 9px);background:linear-gradient(${M.kitB.jersey} 60%,${M.kitB.pants} 60%);--dx:${60+i*34}px;animation-delay:${i*.18+.09}s"></div>`}
   st.innerHTML=head+`<div class="pm-title">The walkout</div><div class="walk"><div class="flash" style="--fx:20%"></div><div class="flash" style="--fx:80%;animation-delay:.4s"></div><div class="tun"></div>${ps}</div><p class="note">${S.sq>1?'The captains lead the teams out':'The athletes are introduced'} to a huge roar from the crowd.</p>`+bar;wire();SFX.cheer(1.2);speak(`And here they come! ${M.tA} and ${M.tB} walk out to a wall of noise.`,true);await pause(4200);live2()}
  if(S.type!=='race'){const call=CFG.toss,flip=rnd()<.5?'H':'T',won=call===flip;
   const choices=S.type==='inv'?['Attack first','Defend first']:S.type==='net'?['Serve first','Receive first']:S.type==='bat'?['Bat first','Field first']:['Tee off first','Go second'];
   st.innerHTML=head+`<div class="pm-title">The toss</div><div class="coin" id="pmCoin"><span>SPT</span><span class="b">${esc(M.cA)}</span></div><p id="pmTossT" style="font-weight:800">${esc(M.squadA[0].n)} calls ${call==='H'?'heads':'tails'}…</p><div class="pm-bar" id="pmCh"></div>`+bar;wire();
   speak(`${M.tA} call ${call==='H'?'heads':'tails'}.`,true);await pause(300);const c=$('pmCoin');if(c)c.style.transform=`rotateY(${(flip==='H'?1800:1980)}deg)`;SFX.tone('triangle',900,1300,.1,.2);await pause(skip?300:2800);live2();
   $('pmTossT').textContent=`It's ${flip==='H'?'heads':'tails'}! ${won?M.tA+' win the toss.':M.tB+' win the toss.'}`;speak(`It's ${flip==='H'?'heads':'tails'}. ${won?M.tA:M.tB} win the toss.`,true);
   if(won&&!skip){const ch=$('pmCh');await new Promise(r=>{m.skipRes=r;choices.forEach((t,i)=>{const b=document.createElement('button');b.className='btn '+(i?'':'gold');b.textContent=t;b.onclick=()=>{M.userFirst=i===0;r()};ch.appendChild(b)});setTimeout(r,9000)});const ch2=$('pmCh');if(ch2)ch2.innerHTML=''}
   else M.userFirst=won?true:rnd()<.5;live2();if(S.type==='inv'&&M.userFirst)M.ad.force='A';if(S.type==='inv'&&!M.userFirst)M.ad.force='B';
   if(S.type==='net'){M.ad.s.server=M.userFirst?0:1}
   $('pmTossT').textContent+=` ${M.userFirst?M.tA:M.tB} will ${choices[0].toLowerCase()}.`;await pause(skip?100:1600);live2()}
  else{st.innerHTML=head+`<div class="pm-title">Lane draw</div><p style="font-size:20px;font-weight:900">${M.kitA.flag} ${esc(M.squadA[0].n)} • Lane 4</p><p class="note">Fastest qualifier gets the middle lane.</p>`+bar;wire();speak(`${M.squadA[0].n} of ${M.tA} is in lane four.`,true);await pause(skip?100:2600);live2()}
  for(const n of ['3','2','1']){st.innerHTML=`<div class="pm-eye">SPORTS • MATCHDAY • LIVE</div><div class="count">${n}</div>`;SFX.tone('sine',660,660,.12,.2);await pause(skip?250:800);live2()}
  runMatch()}catch(e){if(e!==ABORT)console.error(e)}}

/* ---------- running the match ---------- */
function updBug(){if(!M)return;const a=M.ad;$('sbA').innerHTML=`<span>${M.kitA.flag||''}</span>${esc(M.cA)}`;$('sbB').innerHTML=`${esc(M.cB)}<span>${M.opp.flag}</span>`;$('sbS').textContent=a.scoreText();$('sbC').textContent=a.clock();$('sbSub').textContent=a.sub();
 const t=SPORTS[M.sp].type;if(t==='golf'||t==='race'){$('sbB').innerHTML=t==='golf'?'LEADER':'';}}
async function runMatch(){const m=M;show('match');$('commL').innerHTML='';fitCanvas();m.ad.init();updBug();setWin(m.ad.winP?m.ad.winP():.5);$('tTac').classList.toggle('hidden',SPORTS[m.sp].type==='golf'||SPORTS[m.sp].type==='race');
 $('wbA').style.background=m.kitA.jersey;$('wbB').style.background=m.kitB.jersey;$('commL').classList.toggle('hidden',SPORTS[m.sp].type==='race');$('cHide').textContent=SPORTS[m.sp].type==='race'?'+':'–';$('bAuto').setAttribute('aria-pressed','false');$('bAuto').textContent='🤖 Auto';syncVoice();idle('Get ready…');
 try{await m.ad.run();if(m.dead)return;await wait(900);finishMatch()}catch(e){if(e!==ABORT){console.error(e);toast('Something went wrong, the match was ended.');if(!m.dead)finishMatch()}}}
function finishMatch(){const m=M;if(!m||m.dead)return;m.dead=true;meterStop();try{speechSynthesis.cancel()}catch(e){}const res=m.ad.result(),S=SPORTS[m.sp];
 let earn=res.r==='WIN'?(m.mode==='CAREER'?40+m.lvl*4:30):res.r==='DRAW'?20:(res.podium?25:10);earn+=Math.min(40,(m.stats.A.pf||0)*2);if(m.needWinner&&res.r==='WIN')earn+=100;
 addCoins(earn);let unlocked=false;if(m.mode==='CAREER'&&res.r==='WIN'&&m.lvl>=maxLvl(m.sp)){setMaxLvl(m.sp,m.lvl+1);unlocked=true}
 const rows=m.ad.statsRows().slice(0,8);const scorers=m.goals.filter(g=>g.team==='A').map(g=>g.who);const mvp=scorers.length?Object.entries(scorers.reduce((o,n)=>(o[n]=(o[n]||0)+1,o),{})).sort((a,b)=>b[1]-a[1])[0][0]:m.squadA[0].n;
 show('summary');$('sumBody').innerHTML=`<div class="emb" style="width:120px;height:96px;margin:0 auto;border-radius:10px;border:1px solid rgba(222,181,83,.6)"></div><div class="tag" style="margin-top:6px">${esc(S.nm)} • ${m.mode==='CAREER'?'Career level '+m.lvl:'Quick match'}</div>
 <div class="sum-res" style="color:${res.r==='WIN'?'#ffe9a8':res.r==='DRAW'?'#fff':'#fca5a5'}">${res.r==='WIN'?'🏆 VICTORY':res.r==='DRAW'?'🤝 DRAW':res.podium?'🥉 PODIUM':'DEFEAT'}</div><div class="sum-sc">${esc(res.line)}</div>
 <div class="statgrid"><div class="stat"><b>🪙 +${earn}</b><small>COINS EARNED</small></div><div class="stat"><b>${Math.round((m.wp||0)*100)}%</b><small>FINAL WIN METER</small></div><div class="stat"><b>${m.stats.A.pf||0}</b><small>PERFECT TIMINGS</small></div><div class="stat"><b style="font-size:15px">${esc(mvp)}</b><small>PLAYER OF THE MATCH</small></div></div>
 ${unlocked?`<p style="text-align:center;font-weight:900;color:#86efac;margin:6px 0">🔓 Level ${m.lvl+1} unlocked!</p>`:''}
 <table style="margin:8px 0"><tr><th></th><th class="n">${esc(m.cA)}</th><th class="n">${SPORTS[m.sp].type==='race'?'':esc(SPORTS[m.sp].type==='golf'?'Rival':m.cB)}</th></tr>${rows.map(r=>`<tr><td>${esc(r[0])}</td><td class="n">${esc(r[1])}</td><td class="n">${esc(r[2])}</td></tr>`).join('')}</table>
 <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-top:10px">${m.mode==='CAREER'&&res.r==='WIN'&&m.lvl<100?'<button class="btn gold" id="smNext">▶ Next level</button>':''}<button class="btn ${m.mode==='CAREER'&&res.r==='WIN'?'':'gold'}" id="smAgain">🔁 Play again</button><button class="btn" id="smSetup">⚙ Match setup</button><button class="btn" id="smStore">🛒 Store</button><button class="btn" id="smHome">🏟 All sports</button></div>`;
 if(res.r==='WIN'){fireworks();SFX.cheer(1.4);speak(`${m.tA} win! ${res.line}. What a performance.`,true)}else speak(res.r==='DRAW'?`It ends all square. ${res.line}.`:`${m.tB} win this one. ${res.line}. Head to the store, upgrade, and go again.`,true);
 const n=$('smNext');if(n)n.onclick=()=>{CFG.lvlSel=Math.min(100,m.lvl+1);saveCfg();SP=m.sp;startMatch()};$('smAgain').onclick=()=>{SP=m.sp;startMatch()};$('smSetup').onclick=()=>openSetup(m.sp);$('smStore').onclick=()=>{SP=m.sp;storeModal()};$('smHome').onclick=()=>{renderHome();show('home')}}
function quitMatch(){openModal(`<div class="mhead"><h2>Leave the match?</h2><button class="btn" data-close>✕</button></div><p class="note">Your progress in this match will be lost.</p><div style="display:flex;gap:8px;margin-top:12px"><button class="btn red" id="qYes">Leave match</button><button class="btn" data-close2>Keep playing</button></div>`);
 $('qYes').onclick=()=>{closeModal();if(M){M.dead=true;meterStop();if(M.momentRej)try{M.momentRej(ABORT)}catch(e){}}try{speechSynthesis.cancel()}catch(e){}openSetup(M?M.sp:SP)};$('modalBody').querySelector('[data-close2]').onclick=closeModal}
function statsModal(){if(!M)return;const rows=M.ad.statsRows();openModal(`<div class="mhead"><h2>📊 Match centre</h2><button class="btn" data-close>✕</button></div><div class="tabs"><span class="pill">${esc(M.cA)} ${esc(M.ad.scoreText())} ${SPORTS[M.sp].type==='race'||SPORTS[M.sp].type==='golf'?'':esc(M.cB)}</span><span class="pill">${esc(M.ad.clock())}</span></div>
 <table><tr><th>STAT</th><th class="n">${esc(M.cA)}</th><th class="n">${SPORTS[M.sp].type==='race'?'':esc(M.cB)}</th></tr>${rows.map(r=>`<tr><td>${esc(r[0])}</td><td class="n">${esc(r[1])}</td><td class="n">${esc(r[2])}</td></tr>`).join('')}</table>
 <h3 style="margin:12px 0 6px;font-size:12px;color:#f2d58b;letter-spacing:.12em">WIN PROBABILITY WORM</h3><canvas id="worm" width="700" height="150" style="width:100%;height:150px;background:#0b1430;border-radius:10px"></canvas>
 <h3 style="margin:12px 0 6px;font-size:12px;color:#f2d58b;letter-spacing:.12em">YOUR AIM MAP <span class="note" style="letter-spacing:0">(the AI learns your favourite side)</span></h3><div style="display:flex;gap:6px">${[-1,0,1].map(a=>{const n=M.aimHist[a]||0,t=(M.aimHist[-1]||0)+(M.aimHist[0]||0)+(M.aimHist[1]||0)||1;return`<div class="stat" style="flex:1"><b>${Math.round(n/t*100)}%</b><small>${['LEFT','CENTRE','RIGHT'][a+1]} • ${n}</small></div>`}).join('')}</div>
 <h3 style="margin:12px 0 6px;font-size:12px;color:#f2d58b;letter-spacing:.12em">KEY MOMENTS</h3><div class="note" style="max-height:160px;overflow:auto">${M.log.slice(-40).reverse().map(l=>`<div style="padding:3px 0;border-top:1px solid #ffffff12"><b style="color:#f2d58b">${esc(l.t)}</b> ${esc(l.x)}</div>`).join('')||'Nothing yet'}</div>`);
 const c=$('worm'),x=c.getContext('2d'),w=M.worm.length?M.worm:[.5];x.strokeStyle='#ffffff22';x.beginPath();x.moveTo(0,75);x.lineTo(700,75);x.stroke();x.lineWidth=3;x.strokeStyle='#ffd166';x.beginPath();w.forEach((p,i)=>{const X=w.length>1?i/(w.length-1)*690+5:350,Y=145-p*140;i?x.lineTo(X,Y):x.moveTo(X,Y)});x.stroke();x.fillStyle='#fff';x.font='bold 12px system-ui';x.fillText(M.cA+' 100%',8,16);x.fillText(SPORTS[M.sp].type==='race'||SPORTS[M.sp].type==='golf'?'0%':M.cB+' 100%',8,142)}
function tacticsModal(){if(!M)return;const t=SPORTS[M.sp].type,key=t==='net'?'style':'mentality',opts=t==='net'?['Safe','Balanced','Aggressive']:['Defensive','Balanced','Attacking'];
 const d={Defensive:'Fewer chances for both sides. Harder for them to score.',Balanced:'The normal plan.',Attacking:'More chances for you, but you leave gaps at the back.',Safe:'Fewer errors, fewer winners.',Aggressive:'More winners, more errors.'};
 openModal(`<div class="mhead"><h2>🧠 Tactics</h2><button class="btn" data-close>✕</button></div>${opts.map(o=>`<div class="upg"><div><b>${o}</b><div class="note">${d[o]}</div></div><button class="btn ${M[key]===o?'gold':''}" data-t="${o}">${M[key]===o?'Selected':'Choose'}</button></div>`).join('')}`);
 $('modalBody').querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{M[key]=b.dataset.t;say(`Tactical change: ${M.tA} go ${b.dataset.t.toLowerCase()}.`,'TACTICS');updBug();closeModal()})}
$('tVoice').onclick=toggleVoice;$('tMute').onclick=()=>{SFX.init();SFX.setMute(!SFX.muted);$('tMute').textContent=SFX.muted?'🔇':'🔊'};$('tStats').onclick=statsModal;$('tTac').onclick=tacticsModal;$('tTeam').onclick=()=>lineupModal(true);$('tQuit').onclick=quitMatch;
$('cHide').onclick=()=>{const l=$('commL');l.classList.toggle('hidden');$('cHide').textContent=l.classList.contains('hidden')?'+':'–'};
$('go').onclick=()=>{SFX.init();if(M&&M.momentCtl)M.momentCtl.tap()};$('meter').onclick=()=>{if(M&&M.momentCtl)M.momentCtl.tap()};
$('bSim').onclick=()=>{if(M&&M.momentCtl)M.momentCtl.sim()};
$('bAuto').onclick=()=>{if(!M)return;M.auto=!M.auto;$('bAuto').setAttribute('aria-pressed',M.auto);$('bAuto').textContent=M.auto?'🤖 Auto ON':'🤖 Auto';if(M.auto&&M.momentCtl)M.momentCtl.sim()};
$('aimRow').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(!M)return;M.aim=+b.dataset.a;$('aimRow').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b))});
addEventListener('keydown',e=>{if(e.target&&e.target.tagName==='INPUT')return;if(e.key==='Escape'){closeModal();return}if($('match').classList.contains('hidden')||!$('modal').classList.contains('hidden'))return;
 if(e.code==='Space'||e.key==='Enter'){e.preventDefault();SFX.init();if(M&&M.momentCtl)M.momentCtl.tap()}else if(/^[1-4]$/.test(e.key)){if(M&&M.momentCtl)M.momentCtl.key(+e.key-1)}
 else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();if(!M)return;M.aim=clamp(M.aim+(e.key==='ArrowLeft'?-1:1),-1,1);$('aimRow').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',+x.dataset.a===M.aim))}});

/* ---------- fireworks ---------- */
function fireworks(){const c=$('fw'),x=c.getContext('2d');c.width=innerWidth;c.height=innerHeight;const ps=[];let t0=performance.now();
 const burst=()=>{const cx=innerWidth*(.2+rnd()*.6),cy=innerHeight*(.15+rnd()*.3),col=pick(['#ffd166','#ef4444','#38bdf8','#22c55e','#f472b6','#fff']);for(let i=0;i<60;i++){const a=rnd()*7,s=2+rnd()*4;ps.push({x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:1,col})}SFX.fire()};
 const loop=now=>{x.clearRect(0,0,c.width,c.height);if(now-t0<3500&&rnd()<.06)burst();ps.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.05;p.l-=.012;x.globalAlpha=Math.max(0,p.l);x.fillStyle=p.col;x.fillRect(p.x,p.y,3,3)});x.globalAlpha=1;for(let i=ps.length-1;i>=0;i--)if(ps[i].l<=0)ps.splice(i,1);if(now-t0<6000||ps.length)requestAnimationFrame(loop);else x.clearRect(0,0,c.width,c.height)};burst();requestAnimationFrame(loop)}

/* ---------- boot ---------- */
renderHome();requestAnimationFrame(render);
const qp=new URLSearchParams(location.search).get('sport');if(qp&&SPORTS[qp])openSetup(qp);
window.SPORTS_DEBUG={get M(){return M},SPORTS,openSetup,startMatch};
})();
</script>
</body>
</html>
