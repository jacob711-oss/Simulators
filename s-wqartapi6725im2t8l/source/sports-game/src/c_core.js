<script>
(function(){
"use strict";
const $=id=>document.getElementById(id);
const rnd=Math.random,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,pick=a=>a[Math.floor(rnd()*a.length)];
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function toast(t){const e=$('toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),2300)}
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const ABORT={abort:1};

/* ---------- countries and kits ---------- */
const COUNTRIES=[
["AUS","Australia","🇦🇺","#facc15","#15803d","#15803d","#0f172a"],["IND","India","🇮🇳","#0284c7","#f97316","#0369a1","#fff"],["ENG","England","🏴󠁧󠁢󠁥󠁮󠁧󠁿","#f8fafc","#dc2626","#1e3a8a","#0f172a"],
["PAK","Pakistan","🇵🇰","#16a34a","#a3e635","#14532d","#fff"],["RSA","South Africa","🇿🇦","#15803d","#facc15","#052e16","#fff"],["NZL","New Zealand","🇳🇿","#111827","#94a3b8","#090d16","#fff"],
["WIN","West Indies","🌴","#881337","#fbbf24","#4c0519","#fff"],["SRL","Sri Lanka","🇱🇰","#1e3a8a","#facc15","#172554","#fff"],["BAN","Bangladesh","🇧🇩","#047857","#dc2626","#064e3b","#fff"],
["AFG","Afghanistan","🇦🇫","#1d4ed8","#ef4444","#1e3a8a","#fff"],["USA","United States","🇺🇸","#1e3a8a","#ef4444","#172554","#fff"],["CAN","Canada","🇨🇦","#dc2626","#ffffff","#991b1b","#fff"],
["IRE","Ireland","🇮🇪","#16a34a","#f97316","#14532d","#fff"],["SCO","Scotland","🏴󠁧󠁢󠁳󠁣󠁴󠁿","#1e1b4b","#38bdf8","#0f172a","#fff"],["NED","Netherlands","🇳🇱","#f97316","#1d4ed8","#c2410c","#fff"],
["NEP","Nepal","🇳🇵","#1d4ed8","#dc2626","#1e3a8a","#fff"],["UAE","UAE","🇦🇪","#334155","#dc2626","#1e293b","#fff"],["NAM","Namibia","🇳🇦","#1e40af","#ef4444","#172554","#fff"],
["ZIM","Zimbabwe","🇿🇼","#dc2626","#facc15","#991b1b","#fff"],["OMA","Oman","🇴🇲","#dc2626","#16a34a","#991b1b","#fff"],["PNG","Papua New Guinea","🇵🇬","#111827","#facc15","#991b1b","#fff"],
["UGA","Uganda","🇺🇬","#facc15","#dc2626","#111827","#0f172a"],["JPN","Japan","🇯🇵","#1d4ed8","#ffffff","#1e3a8a","#fff"],["GER","Germany","🇩🇪","#f8fafc","#111827","#1e293b","#0f172a"],
["BRA","Brazil","🇧🇷","#facc15","#16a34a","#1d4ed8","#0f172a"],["FRA","France","🇫🇷","#1e3a8a","#ffffff","#f8fafc","#fff"],["ESP","Spain","🇪🇸","#dc2626","#facc15","#1e3a8a","#fff"],
["ITA","Italy","🇮🇹","#2563eb","#ffffff","#f8fafc","#fff"],["ARG","Argentina","🇦🇷","#7dd3fc","#ffffff","#111827","#0f172a"],["POR","Portugal","🇵🇹","#991b1b","#16a34a","#14532d","#fff"],
["MEX","Mexico","🇲🇽","#166534","#ffffff","#f8fafc","#fff"],["CHN","China","🇨🇳","#dc2626","#facc15","#dc2626","#fff"],["KOR","South Korea","🇰🇷","#dc2626","#1e3a8a","#111827","#fff"],
["KEN","Kenya","🇰🇪","#16a34a","#dc2626","#111827","#fff"],["JAM","Jamaica","🇯🇲","#facc15","#16a34a","#111827","#0f172a"],["NGA","Nigeria","🇳🇬","#16a34a","#ffffff","#16a34a","#fff"],
["CRO","Croatia","🇭🇷","#f8fafc","#dc2626","#1e3a8a","#0f172a"],["NOR","Norway","🇳🇴","#dc2626","#1e3a8a","#f8fafc","#fff"],["SWE","Sweden","🇸🇪","#facc15","#1d4ed8","#1d4ed8","#0f172a"],
["FIJ","Fiji","🇫🇯","#f8fafc","#111827","#111827","#0f172a"],["SAM","Samoa","🇼🇸","#1d4ed8","#ffffff","#1d4ed8","#fff"],["SUI","Switzerland","🇨🇭","#dc2626","#ffffff","#f8fafc","#fff"],
["SRB","Serbia","🇷🇸","#b91c1c","#1e3a8a","#f8fafc","#fff"],["GRE","Greece","🇬🇷","#1d4ed8","#ffffff","#f8fafc","#fff"],["CHI","Chile","🇨🇱","#dc2626","#1e3a8a","#f8fafc","#fff"]
].map(a=>({code:a[0],name:a[1],flag:a[2],jersey:a[3],trim:a[4],pants:a[5],textCol:a[6]}));

const FIRST_M=['Liam','Noah','Oliver','Jack','Leo','Mateo','Lucas','Arjun','Kenji','Omar','Ethan','Max','Luca','Rafael','Kai','Samir','Diego','Jonah','Felix','Ravi','Theo','Hugo','Marco','Tariq','Ben','Isaac','Sione','Yuto','Mason','Adam','Elias','Tom'];
const FIRST_F=['Olivia','Ava','Mia','Zoe','Isla','Priya','Yuki','Sofia','Amara','Chloe','Lena','Maya','Grace','Ruby','Aisha','Elena','Nina','Hana','Ella','Lucia','Freya','Ana','Imani','Leila','Sara','Tia','Mele','Jade','Nora','Ivy','Emma','Kira'];
const SUR=['Smith','Silva','Khan','Müller','Rossi','Garcia','Kim','Tanaka','Okafor','Dubois','Jensen','Novak','Patel','Costa','Murphy','Lopez','Nguyen','Ali','Fernandes','Brown','Walker','Sato','Mendes','Petrov','Hughes','Ito','Kowalski','Larsen','Mensah','Reyes','Clarke','Haddad','Moreau','Bianchi','Kumar','Owusu','Sharma','Ruiz','Wilson','Taylor','Schmidt','Andersen','Park','Chen','Vega','Santos','Evans','Fischer','Nkosi','Barros'];

/* ---------- the sports ---------- */
const INV_LENS=[['Quick • 6 chances',6],['Standard • 10',10],['Full • 14',14]];
const SPORTS={
football:{nm:'Football',ic:'⚽',type:'inv',sq:11,desc:'Pick your shot and corner, nail the timing, then go in goal and guess their side.',lens:INV_LENS,periods:2,pn:'Half',mins:90,pts:1,unit:'goal',
 field:{W:68,L:105,Lv:30,c1:'#2f8a3a',c2:'#297d34',line:'#f4f4f4',kind:'football'},goal:{w:7.32,h:2.44,d:2},ball:{r:.2,c:'#fff'},
 atk:[{n:'Placed shot',d:'Aim for a corner',p:.52,aim:1,z:.5},{n:'Power shot',d:'Fast meter, hard to stop',p:.47,aim:1,fast:1.35,z:1.3},{n:'Chip',d:'Lift it over the keeper',p:.4,z:2.2},{n:'Header',d:'Attack the cross',p:.42,aim:1,z:1.7}],
 dfn:[{n:'Dive',d:'Guess the side, time the dive'}],roles:['STRIKER','GOALKEEPER'],tie:'shootout',W:{score:'GOAL!',save:'SAVED!',miss:'OFF TARGET'}},
basketball:{nm:'Basketball',ic:'🏀',type:'inv',sq:5,desc:'Layups, jumpers, threes and dunks. On defence, read their drive and contest.',lens:[['Quick • 8 plays',8],['Standard • 12',12],['Full • 16',16]],periods:4,pn:'Q',mins:40,pts:2,unit:'point',bg:7,bgP:.47,bgPts:2.15,
 field:{W:15,L:28,Lv:15,c1:'#c98d52',c2:'#bd8449',line:'#fff',kind:'basketball'},hoop:1,ball:{r:.12,c:'#e07a1f'},
 atk:[{n:'Layup',d:'2 pts • safest',p:.6,pts:2},{n:'Jump shot',d:'2 pts • mid-range',p:.5,pts:2,aim:1},{n:'Three-pointer',d:'3 pts • long range',p:.39,pts:3,aim:1},{n:'Dunk',d:'2 pts • fast meter',p:.66,pts:2,fast:1.45}],
 dfn:[{n:'Contest',d:'Guess their lane and jump'},{n:'Steal',d:'Risky: win it back if timed',steal:1}],roles:['SHOOTER','DEFENDER'],tie:'overtime',W:{score:'BUCKET!',save:'BLOCKED!',miss:'NO GOOD'}},
hockey:{nm:'Ice hockey',ic:'🏒',type:'inv',sq:6,desc:'Wristers, slapshots and dekes. Then drop into the butterfly as the goalie.',lens:INV_LENS,periods:3,pn:'P',mins:60,pts:1,unit:'goal',
 field:{W:26,L:60,Lv:20,c1:'#eaf2f9',c2:'#e0ebf4',line:'#c8102e',kind:'hockey',ice:1},goal:{w:1.83,h:1.22,d:1.1,y:4},ball:{r:.12,c:'#111',puck:1},
 atk:[{n:'Wrist shot',d:'Quick and accurate',p:.48,aim:1,z:.4},{n:'Slapshot',d:'Fast meter, rocket',p:.44,aim:1,fast:1.4,z:.6},{n:'Deke',d:'Fake out the goalie',p:.43,z:.15},{n:'One-timer',d:'Off the pass',p:.46,aim:1,fast:1.2,z:.35}],
 dfn:[{n:'Butterfly',d:'Guess the side, time the save'}],roles:['FORWARD','GOALIE'],tie:'shootout',W:{score:'GOAL!',save:'SAVED!',miss:'WIDE'}},
handball:{nm:'Handball',ic:'🤾',type:'inv',sq:7,desc:'Jump shots and lobs from outside the 6 m line, then save as the keeper.',lens:INV_LENS,periods:2,pn:'Half',mins:60,pts:1,unit:'goal',bg:3,bgP:.5,bgPts:1,
 field:{W:20,L:40,Lv:18,c1:'#2563eb',c2:'#1f58d6',line:'#fff',kind:'handball'},goal:{w:3,h:2,d:1},ball:{r:.1,c:'#fde047'},
 atk:[{n:'Jump shot',d:'Over the wall',p:.55,aim:1,z:1.2},{n:'Bounce shot',d:'Skip it in',p:.48,aim:1,z:.2},{n:'Lob',d:'Over the keeper',p:.42,z:1.9},{n:'Wing spin',d:'Fast meter',p:.46,aim:1,fast:1.25,z:.8}],
 dfn:[{n:'Save',d:'Guess the side, time it'}],roles:['BACK','GOALKEEPER'],tie:'shootout',W:{score:'GOAL!',save:'SAVED!',miss:'MISSED'}},
rugby:{nm:'Rugby sevens',ic:'🏉',type:'inv',sq:7,rugby:1,desc:'Step, pass and kick for the try line, then kick the conversion. On defence, make the tackle.',lens:[['Quick • 6 plays',6],['Standard • 10',10],['Full • 14',14]],periods:2,pn:'Half',mins:14,pts:5,unit:'point',
 field:{W:70,L:100,Lv:34,c1:'#2f8a3a',c2:'#297d34',line:'#fff',kind:'rugby'},ball:{r:.16,c:'#f5f0e0',oval:1},
 atk:[{n:'Sidestep',d:'Pick a gap',p:.46,aim:1},{n:'Pass wide',d:'Find the overlap',p:.5,aim:1},{n:'Grubber kick',d:'Chase it in',p:.36,aim:1},{n:'Pick & go',d:'Fast meter, power',p:.43,fast:1.2}],
 dfn:[{n:'Tackle',d:'Guess their line, time the hit'}],roles:['BALL CARRIER','TACKLER'],tie:'golden',W:{score:'TRY!',save:'TACKLED!',miss:'TURNOVER'}},
baseball:{nm:'Baseball',ic:'⚾',type:'bat',sq:9,desc:'Read the pitch and swing for contact or power, then pitch: pick the pitch and spot.',lens:[['3 innings',3],['6 innings',6],['9 innings',9]],unit:'run',
 field:{W:120,L:120,Lv:30,c1:'#2f8a3a',c2:'#297d34',line:'#fff',kind:'baseball'},ball:{r:.1,c:'#fff'},roles:['BATTER','PITCHER']},
tennis:{nm:'Tennis',ic:'🎾',type:'net',sq:1,fmt:'tennis',desc:'Serve, drive, slice and drop shot. Read their shot to stay in the rally.',lens:[['Tiebreak to 7',0],['Fast4 set',4],['Full set',6]],
 field:{W:8.23,L:23.77,Lv:26,c1:'#2d6cb5',c2:'#2d6cb5',out:'#3f8f5a',line:'#fff',kind:'tennis',net:.914},ball:{r:.07,c:'#d9f99d'},
 serve:[{n:'Flat serve',d:'Big ace chance',w:.2,e:.16,aim:1,fast:1.3},{n:'Slice serve',d:'Swings wide',w:.13,e:.09,aim:1},{n:'Kick serve',d:'Safe and high',w:.07,e:.05}],
 shots:[{n:'Drive',d:'Flat and deep',w:.18,e:.09,aim:1},{n:'Topspin',d:'Heavy and safe',w:.13,e:.05,aim:1},{n:'Drop shot',d:'Short, risky',w:.24,e:.17},{n:'Lob',d:'Over their head',w:.14,e:.11}],
 dfn:[{n:'Chase',d:'Guess their side, time the return'}],roles:['ON SERVE','RETURNING'],W:{score:'WINNER!',save:'GREAT GET!',miss:'ERROR'}},
badminton:{nm:'Badminton',ic:'🏸',type:'net',sq:1,fmt:'rally',cap:30,desc:'Smash, clear and drop. Guess where their shuttle lands and get it back.',lens:[['Game to 11',11],['Game to 21',21],['Best of 3 to 11',-11]],
 field:{W:5.18,L:13.4,Lv:15,c1:'#15803d',c2:'#15803d',out:'#7c5a3a',line:'#fff',kind:'badminton',net:1.55},ball:{r:.06,c:'#fff',shuttle:1},
 serve:[{n:'Low serve',d:'Tight and safe',w:.03,e:.03},{n:'Flick serve',d:'Catch them out',w:.11,e:.08,aim:1}],
 shots:[{n:'Smash',d:'Fast meter, big winner',w:.32,e:.14,aim:1,fast:1.4},{n:'Clear',d:'Deep and safe',w:.07,e:.04,aim:1},{n:'Drop',d:'Just over the net',w:.21,e:.1,aim:1},{n:'Drive',d:'Flat and quick',w:.15,e:.07,aim:1}],
 dfn:[{n:'Reach',d:'Guess their side, time it'}],roles:['ON SERVE','RECEIVING'],W:{score:'WINNER!',save:'WHAT A SAVE!',miss:'ERROR'}},
tabletennis:{nm:'Table tennis',ic:'🏓',type:'net',sq:1,fmt:'tt',desc:'Spin serves, loops and smashes at lightning speed. Read the spin to return.',lens:[['Game to 11',1],['Best of 3',3],['Best of 5',5]],
 field:{W:1.525,L:2.74,Lv:3.6,c1:'#1e3a8a',c2:'#1e3a8a',out:'#0b1430',line:'#fff',kind:'tt',net:.1525,table:.76},ball:{r:.02,c:'#fb923c'},
 serve:[{n:'Backspin',d:'Low and safe',w:.08,e:.05,aim:1},{n:'Topspin',d:'Fast and long',w:.12,e:.08,aim:1,fast:1.2},{n:'Sidespin',d:'Tricky bounce',w:.15,e:.11,aim:1}],
 shots:[{n:'Loop',d:'Heavy topspin',w:.2,e:.1,aim:1},{n:'Push',d:'Safe backspin',w:.06,e:.03,aim:1},{n:'Smash',d:'Fast meter, kill it',w:.32,e:.17,aim:1,fast:1.45},{n:'Block',d:'Redirect',w:.09,e:.04,aim:1}],
 dfn:[{n:'Return',d:'Guess their side, time it'}],roles:['ON SERVE','RECEIVING'],W:{score:'WINNER!',save:'GREAT RETURN!',miss:'ERROR'}},
volleyball:{nm:'Volleyball',ic:'🏐',type:'net',sq:6,fmt:'rally',desc:'Serve, spike, tip and roll. On defence, block or dig their attack.',lens:[['Set to 15',15],['Set to 25',25],['Best of 3 to 15',-15]],
 field:{W:9,L:18,Lv:20,c1:'#e08a3c',c2:'#e08a3c',out:'#2563eb',line:'#fff',kind:'volleyball',net:2.43},ball:{r:.11,c:'#fde68a'},
 serve:[{n:'Float serve',d:'Wobbles, safe',w:.09,e:.07,aim:1},{n:'Jump serve',d:'Fast meter, ace chance',w:.19,e:.16,aim:1,fast:1.3}],
 shots:[{n:'Spike',d:'Fast meter, hammer it',w:.42,e:.14,aim:1,fast:1.35},{n:'Tip',d:'Soft over the block',w:.3,e:.08},{n:'Roll shot',d:'Into the gap',w:.33,e:.1,aim:1}],
 dfn:[{n:'Block',d:'Guess the hit, time the jump'},{n:'Dig',d:'Safer save, less pressure',dig:1}],roles:['ON SERVE','RECEIVING'],W:{score:'KILL!',save:'BIG DIG!',miss:'ERROR'}},
golf:{nm:'Golf',ic:'⛳',type:'golf',sq:1,desc:'Pick the club, aim for the wind and time your swing. Read the break on the green.',lens:[['3 holes',3],['9 holes',9],['18 holes',18]],unit:'stroke',roles:['ON THE TEE','PUTTING']},
sprint:{nm:'Athletics sprint',ic:'🏃',type:'race',sq:1,desc:'React to the gun, then tap in rhythm on every stride. Beat seven rivals to the line.',lens:[['100 m',100],['200 m',200]],unit:'m'},
swim:{nm:'Swimming',ic:'🏊',type:'race',sq:1,swim:1,desc:'Dive on the beep, tap every stroke in rhythm and nail the turn.',lens:[['50 m',50],['100 m',100]],unit:'m'}
};
const ORDER=['football','basketball','tennis','rugby','hockey','baseball','golf','sprint','swim','badminton','tabletennis','volleyball','handball'];

/* ---------- saved settings, coins, levels, upgrades ---------- */
const CFG=Object.assign({country:'AUS',gender:'BOY',custom:null,diff:'medium',mode:'CAREER',voice:true,len:{},toss:'H',opp:{}},LS.get('sports_cfg',{}));
function saveCfg(){LS.set('sports_cfg',CFG)}
function coins(){const c=Number(LS.get('cricket_coins',0));return isFinite(c)?c:0}
function addCoins(n){LS.set('cricket_coins',Math.max(0,Math.round(coins()+n)));updCoins()}
function updCoins(){const t='🪙 '+coins().toLocaleString();['hCoins','sCoins'].forEach(i=>{const e=$(i);if(e)e.textContent=t})}
function maxLvl(sp){return clamp(LS.get('sports_lvl_'+sp,1)|0,1,101)}
function setMaxLvl(sp,v){LS.set('sports_lvl_'+sp,clamp(v,1,101))}
const UPG=[{k:'pow',n:'Power',ic:'💥',d:'More success on good timing'},{k:'pre',n:'Precision',ic:'🎯',d:'Wider PERFECT zone'},{k:'spd',n:'Speed',ic:'⚡',d:'Slower meter, more time'},{k:'def',n:'Defence',ic:'🛡️',d:'Better saves, tackles and returns'}];
function upg(sp){return Object.assign({pow:0,pre:0,spd:0,def:0},LS.get('sports_upg_'+sp,{}))}
function upgCost(l){return 80+l*70}
function country(){if(CFG.country==='CUSTOM'&&CFG.custom)return CFG.custom;return COUNTRIES.find(c=>c.code===CFG.country)||COUNTRIES[0]}
function oppFor(sp,lvl){const me=country();const pool=COUNTRIES.filter(c=>c.code!==me.code);if(CFG.mode==='QUICK'){const o=pool.find(c=>c.code===CFG.opp[sp]);if(o)return o}return pool[(lvl*7+hashStr(sp))%pool.length]}
function teamRating(sp){const u=upg(sp);return 60+(u.pow+u.pre+u.spd+u.def)*1.1}
function oppRating(lvl){return 52+lvl*0.42+({easy:-6,medium:0,hard:7})[CFG.diff]}
function divName(){return CFG.gender==='GIRL'?"Women's":"Men's"}

function genSquad(sp,c,gender,n){const r=rng(hashStr(sp+c.code+gender));const F=gender==='GIRL'?FIRST_F:FIRST_M;const out=[],used=new Set();
 for(let i=0;i<n;i++){let nm;do{nm=F[Math.floor(r()*F.length)]+' '+SUR[Math.floor(r()*SUR.length)]}while(used.has(nm));used.add(nm);out.push({n:nm,no:i===0&&n>1?1:(i+1+Math.floor(r()*3)*10)%99||7})}
 const nos=new Set();out.forEach((p,i)=>{while(nos.has(p.no))p.no=(p.no%98)+1;nos.add(p.no)});return out}
function squadKey(sp){const c=country();return 'sports_squad_'+sp+'_'+c.code+'_'+CFG.gender}
function mySquad(sp){const S=SPORTS[sp];const n=Math.max(S.sq,1)+(S.sq>1?3:0);const base=genSquad(sp,country(),CFG.gender,n);const saved=LS.get(squadKey(sp),null);
 if(saved&&Array.isArray(saved)&&saved.length===n)return saved.map((p,i)=>({n:String(p.n||base[i].n).slice(0,24),no:(p.no|0)||base[i].no}));return base}

/* ---------- sound ---------- */
const SFX={ctx:null,m:null,amb:null,ambF:null,muted:false,vol:.7,
 init(){try{if(!this.ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;this.ctx=new A();this.m=this.ctx.createGain();this.m.gain.value=this.muted?0:this.vol;this.m.connect(this.ctx.destination)}if(this.ctx.state==='suspended')this.ctx.resume();if(!this.amb)this.crowd()}catch(e){}},
 crowd(){const c=this.ctx,n=Math.floor(c.sampleRate*4),b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);let b0=0,b1=0,b2=0;for(let i=0;i<n;i++){const w=rnd()*2-1;b0=.997*b0+w*.029;b1=.985*b1+w*.032;b2=.95*b2+w*.048;d[i]=(b0+b1+b2+w*.05)*.35}
  const s=c.createBufferSource();s.buffer=b;s.loop=true;this.ambF=c.createBiquadFilter();this.ambF.type='bandpass';this.ambF.frequency.value=420;this.ambF.Q.value=.8;this.amb=c.createGain();this.amb.gain.value=.06;s.connect(this.ambF);this.ambF.connect(this.amb);this.amb.connect(this.m);s.start()},
 swell(i=1,dur=2){if(!this.amb)return;const t=this.ctx.currentTime;const g=this.amb.gain;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(Math.min(.3,.06+.15*i),t+.25);g.exponentialRampToValueAtTime(.06,t+dur);const f=this.ambF.frequency;f.cancelScheduledValues(t);f.setValueAtTime(420,t);f.linearRampToValueAtTime(800,t+.3);f.linearRampToValueAtTime(420,t+dur)},
 tone(type,f0,f1,dur,vol,delay=0){if(this.muted||!this.ctx)return;const c=this.ctx,t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(this.m);o.start(t);o.stop(t+dur+.02)},
 noise(dur,f,vol,q=1,delay=0){if(this.muted||!this.ctx)return;const c=this.ctx,t=c.currentTime+delay,n=Math.floor(c.sampleRate*dur),b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=rnd()*2-1;const s=c.createBufferSource();s.buffer=b;const fl=c.createBiquadFilter();fl.type='bandpass';fl.frequency.value=f;fl.Q.value=q;const g=c.createGain();g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(vol,t+Math.min(.2,dur*.2));g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(fl);fl.connect(g);g.connect(this.m);s.start(t)},
 hit(p=1){this.init();this.tone('triangle',260+p*180,60,.14,.5*Math.min(p,1.2))},
 thud(){this.init();this.tone('sine',140,42,.09,.25)},
 whistle(long){this.init();this.tone('square',2300,2150,long?.7:.32,.06);if(long)this.tone('square',2300,2200,.5,.05,.8)},
 buzzer(){this.init();this.tone('sawtooth',180,170,.9,.12)},
 gun(){this.init();this.noise(.35,900,.5,.6);this.tone('sine',120,30,.3,.4)},
 splash(){this.init();this.noise(.5,1400,.25,.8)},
 cheer(i=1){this.init();this.swell(i,2.4);this.noise(1.6,820,.25*i,.7)},
 groan(){this.init();this.swell(.5,1.5);this.noise(1,330,.12,.9)},
 fire(){this.init();this.tone('sine',145,36,.35,.32);this.noise(.5,1400,.18,1.2)},
 setMute(m){this.muted=m;if(this.m)this.m.gain.value=m?0:this.vol}};

/* ---------- male voice commentary ---------- */
let VOICE=null;
function chooseMaleEnglishVoice(){if(!('speechSynthesis' in window))return null;const v=speechSynthesis.getVoices()||[];if(!v.length)return null;
 const pref=[{l:/^en-AU/i,n:/\blee\b/i},{l:/^en-GB/i,n:/\b(daniel|arthur|oliver|thomas|george|james)\b/i},{l:/^en-US/i,n:/\b(alex|fred|matthew|mathew|aaron|evan|eddy|reed|rocko)\b/i},{l:/^en/i,n:/\b(lee|daniel|alex|fred|matthew|aaron|arthur|oliver|thomas|george|james|eddy|reed|rocko|gordon|rishi|liam)\b/i}];
 for(const r of pref){const m=v.find(x=>r.l.test(x.lang||'')&&r.n.test(x.name||''));if(m)return m}
 const lm=v.find(x=>/^en/i.test(x.lang||'')&&/\bmale\b/i.test(x.name||''));if(lm)return lm;const fem=/(samantha|victoria|karen|moira|tessa|susan|allison|ava|zoe|zira|female)/i;return v.find(x=>/^en/i.test(x.lang||'')&&!fem.test(x.name||''))||null}
try{if('speechSynthesis' in window){VOICE=chooseMaleEnglishVoice();speechSynthesis.onvoiceschanged=()=>{VOICE=chooseMaleEnglishVoice()}}}catch(e){}
function speak(text,big){if(!CFG.voice||!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined')return;try{const s=speechSynthesis;if(big)s.cancel();else if(s.pending||(s.speaking&&rnd()<.5))return;
 const u=new SpeechSynthesisUtterance(String(text).replace(/[^\w\s.,!?'’%:-]/g,' '));if(!VOICE)VOICE=chooseMaleEnglishVoice();if(VOICE){u.voice=VOICE;u.lang=VOICE.lang}else u.lang='en-AU';u.pitch=VOICE?.85:.62;u.rate=1.06;u.volume=Math.min(1,SFX.vol+.2);s.speak(u)}catch(e){}}
function syncVoice(){const t=CFG.voice?'🎙️ MALE VOICE ON':'🔇 MALE VOICE OFF';$('bVoice1').textContent=t;$('tVoice').textContent=CFG.voice?'🎙️ Voice':'🔇 Voice';$('tVoice').setAttribute('aria-pressed',CFG.voice)}
function toggleVoice(){CFG.voice=!CFG.voice;saveCfg();syncVoice();if(!CFG.voice){try{speechSynthesis.cancel()}catch(e){}}else speak('Male commentary is now on. Welcome to Sports.',true)}

/* ---------- match state (one at a time) ---------- */
let M=null;
function live(){if(!M||M.dead)throw ABORT}
function wait(ms){return new Promise((res,rej)=>{const m=M;setTimeout(()=>{if(!m||m.dead)rej(ABORT);else res()},M&&M.auto?ms*.55:ms)})}
function say(text,tag,big){const L=$('commL');const d=document.createElement('div');d.className='ln';d.innerHTML=(tag?'<em>'+esc(tag)+'</em>':'')+esc(text);L.prepend(d);while(L.children.length>5)L.lastChild.remove();if(M)M.log.push({t:clockText(),x:text});speak(text,big)}
function bigText(t,sub,col){const b=$('big');b.innerHTML=esc(t)+(sub?'<small>'+esc(sub)+'</small>':'');b.style.color=col||'#fff';b.classList.remove('on');void b.offsetWidth;b.classList.add('on');clearTimeout(bigText.t);bigText.t=setTimeout(()=>b.classList.remove('on'),1700)}
function clockText(){return M&&M.ad&&M.ad.clock?M.ad.clock():''}

/* ---------- timing meter + moment controls ---------- */
const MT={run:false,v:0,dir:1,t0:0,speed:1,sweeps:0,cb:null,cont:false,raf:0,pw:.07,gw:.2};
function meterZones(){const u=M?upg(M.sp):{pre:0};MT.pw=clamp(.065+u.pre*.0065+({easy:.018,medium:0,hard:-.012})[CFG.diff],.04,.16);MT.gw=MT.pw+.15;const z=$('meter').children;
 z[0].style.flex=(.5-MT.gw)*100;z[1].style.flex=(MT.gw-MT.pw)*100;z[2].style.flex=MT.pw*200;z[3].style.flex=(MT.gw-MT.pw)*100;z[4].style.flex=(.5-MT.gw)*100}
function grade(v){const d=Math.abs(v-.5);if(d<MT.pw)return{q:1,tag:'PERFECT',col:'#22c55e'};if(d<MT.gw)return{q:.72,tag:'GOOD',col:'#facc15'};return{q:.35,tag:v<.5?'EARLY':'LATE',col:'#ef4444',side:v<.5?-1:1}}
function meterStart(speed,cb,cont){meterZones();MT.run=true;MT.cont=!!cont;MT.cb=cb;MT.v=0;MT.dir=1;MT.sweeps=0;const u=M?upg(M.sp):{spd:0};
 MT.speed=speed*({easy:.82,medium:1,hard:1.22})[CFG.diff]*(1-u.spd*.035)*(M?1+(M.lvl||1)*.003:1);let last=performance.now();cancelAnimationFrame(MT.raf);
 const step=now=>{if(!MT.run)return;const dt=Math.min(.05,(now-last)/1000);last=now;MT.v+=MT.dir*dt*MT.speed/0.85;if(MT.v>=1){MT.v=1;MT.dir=-1;MT.sweeps++}else if(MT.v<=0){MT.v=0;MT.dir=1;MT.sweeps++}
  $('needle').style.left=(MT.v*100)+'%';if(!MT.cont&&MT.sweeps>=4){meterLock(true);return}MT.raf=requestAnimationFrame(step)};MT.raf=requestAnimationFrame(step)}
function meterLock(timeout){if(!MT.run)return;if(!MT.cont)MT.run=false;const g=timeout?{q:.08,tag:'TOO LATE',col:'#ef4444',side:1}:grade(MT.v);const cb=MT.cb;if(!MT.cont)MT.cb=null;if(cb)cb(g)}
function meterStop(){MT.run=false;MT.cb=null;cancelAnimationFrame(MT.raf)}
/* AI learns which aim you use most and guesses it more often at higher levels */
function aiGuessAim(hist,lvl){const k=.4+Math.min(lvl,100)/60;const w=[-1,0,1].map(a=>Math.pow((hist[a]||0)+1,k));const s=w[0]+w[1]+w[2];let r=rnd()*s;for(let i=0;i<3;i++){r-=w[i];if(r<=0)return i-1}return 1}
function simGrade(rating){const r=rnd(),p=.16+(rating-60)*.004;if(r<p)return{q:1,tag:'PERFECT',col:'#22c55e'};if(r<p+.48)return{q:.72,tag:'GOOD',col:'#facc15'};return{q:.35,tag:rnd()<.5?'EARLY':'LATE',col:'#ef4444',side:rnd()<.5?-1:1}}

/* moment(spec) shows the action buttons and resolves with {act,aim,g} */
function moment(spec){live();return new Promise((res,rej)=>{const m=M;m.momentRej=rej;const acts=$('acts');acts.innerHTML='';$('sitT').textContent=spec.title;$('sitR').textContent=spec.role||'LIVE';
 const aimOn=spec.aim!==false;$('aimRow').classList.toggle('hidden',!aimOn);$('aimLbl').textContent=spec.aimLbl||'AIM';
 const ab=[...$('aimRow').querySelectorAll('button')];const lbls=spec.aimNames||['◀ Left','● Centre','Right ▶'];ab.forEach((b,i)=>{b.textContent=lbls[i];b.setAttribute('aria-pressed',(+b.dataset.a)===m.aim)});
 $('hint').textContent=spec.hint||'';let chosen=null,done=false;$('go').textContent=spec.go||'TAP • SPACE';
 const finish=(act,g,simmed)=>{if(done)return;done=true;meterStop();m.momentRej=null;m.momentCtl=null;[...acts.children].forEach(b=>b.disabled=true);
  const aim=(act.aim||spec.forceAim)?m.aim:0;if(act.aim||spec.forceAim)m.aimHist[aim]=(m.aimHist[aim]||0)+1;setTimeout(()=>res({act,aim,g,simmed}),simmed?60:120)};
 const startAct=(a,b)=>{if(done)return;chosen=a;m.lastAct=a.n;if(a.noMeter){[...acts.children].forEach(x=>x.setAttribute('aria-pressed',x===b));finish(a,{q:0,tag:'TAKE',col:'#93c5fd'});return}[...acts.children].forEach(x=>x.setAttribute('aria-pressed',x===b));SFX.init();meterStart((a.fast||1)*(spec.speed||1),g=>{tagFlash(g);finish(a,g)})};
 spec.acts.forEach((a,i)=>{const b=document.createElement('button');b.innerHTML=esc(a.n)+(a.d?'<small>'+esc(a.d)+'</small>':'');b.onclick=()=>startAct(a,b);acts.appendChild(b)});
 m.momentCtl={tap(){if(done)return;if(MT.run)meterLock();else{const i=Math.max(0,spec.acts.indexOf(m.lastAct&&spec.acts.find(x=>x.n===m.lastAct)||spec.acts[0]));startAct(spec.acts[i],acts.children[i])}},
  key(n){if(acts.children[n])acts.children[n].click()},sim(){if(done)return;const a=spec.simAct?spec.simAct():pick(spec.acts);if(a.aim||spec.forceAim)m.aim=spec.simAim!=null&&rnd()<.6?spec.simAim:pick([-1,0,1]);finish(a,simGrade(m.uR),true)}};
 if(m.auto)setTimeout(()=>{if(!done&&m.momentCtl)m.momentCtl.sim()},450)})}
function tagFlash(g){const n=$('needle');n.style.background=g.col;setTimeout(()=>n.style.background='#fff',600);toast(g.tag+(g.q>=1?' ✨':''))}
function idle(text,role){$('sitT').textContent=text;$('sitR').textContent=role||'LIVE';$('acts').innerHTML='';$('aimRow').classList.add('hidden');$('hint').textContent='';$('needle').style.left='50%'}

/* stats and win probability */
function st(team,k,n=1){M.stats[team][k]=(M.stats[team][k]||0)+n}
function setWin(p){p=clamp(p,.01,.99);M.wp=p;M.worm.push(p);$('wA').textContent=Math.round(p*100)+'%';$('wB').textContent=Math.round((1-p)*100)+'%';$('wbA').style.width=(p*100)+'%';$('wbB').style.width=((1-p)*100)+'%'}
