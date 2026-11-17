/* ================= Creator: design your own creatures and microbes ================= */
const BODY=[['rod','Small plant eater','🐭'],['graz','Herd grazer','🦌'],['giant','Giant browser','🐘'],['ahrb','River grazer (swims)','🦛'],['scarn','Small hunter','🦊'],['bcarn','Big hunter','🦁'],['omni','Omnivore (eats anything)','🐻'],['bird','Bird','🐦'],['rapt','Bird of prey','🦅'],['insect','Flying insect','🦋'],['bug','Crawling bug','🐞'],['fish','Fish','🐟'],['pfish','Hunting fish','🦈'],['whale','Gentle sea giant','🐋'],['rept','Lizard','🦎'],['snake','Snake','🐍'],['croc','River ambusher','🐊'],['herp','Frog-like','🐸'],['tort','Tortoise-like','🐢']].filter(b=>ATPL[b[0]]);
const CABIL=[['speedy','⚡ Speedy','Runs 50% faster'],['senses','👁️ Sharp senses','Spots food and danger from far away'],['hardy','🧥 Hardy','Survives far colder and hotter weather'],['longlife','⏳ Long life','Lives twice as long'],['babies','🍼 Many babies','Bigger litters, more often'],['thrifty','🔋 Thrifty','Needs 40% less food'],['nothirst','🏜️ Never thirsty','Never needs to drink'],['armour','🛡️ Armoured','Nothing can eat it'],['pack','🐺 Pack hunter','Hunts in packs and takes bigger prey'],['immune','💪 Disease-proof','Never gets sick'],['giant','🦣 Giant','Twice the size']];
const MABIL=[['rot','🍂 Decomposer','Rots dead matter: richer soil'],['fert','🌾 Fertiliser','Feeds the soil so plants grow better'],['grow','🌱 Plant helper','Makes grass grow fast'],['plank','🌊 Plankton','Lives in water and feeds the algae'],['toxic','☠️ Toxic','Kills plants where it grows'],['cold','❄️ Cold-loving','Thrives in ice and snow'],['heat','🔥 Heat-loving','Thrives in deserts and hot springs'],['disease','🤒 Disease','Makes animals sick'],['glow','✨ Glows','Glows in the dark so you can see it spread'],['fast','🚀 Fast spreader','Spreads three times as quickly']];
const CEMO=['🦄','🐉','🦖','🦕','🐲','👾','🐙','🦑','🦀','🦞','🦔','🦥','🦦','🦩','🦚','🦜','🐝','🐞','🦂','🕷️','🐌','🐊','🐸','🐢','🐟','🐠','🐡','🦈','🐳','🐬','🦭','🐺','🦊','🐱','🐯','🦁','🐮','🐷','🐰','🐭','🐻','🐼','🐨','🐵','🦒','🐘','🦏','🦓','🦌','🐫','🐑','🐐','🦬','🐲','🦇','🦉','🦅','🕊️','🐧','🦢'];
const MCOL=['#ff5ab4','#5ad8ff','#b6ff5a','#ffb35a','#c48bff','#ff5a5a','#5affb0','#ffe45a'];
let CUSTOM={cre:[],mic:[]},STR=[],CREATED=0,MCREATED=0,STRPAINT=0;
function applyCAbil(key,ab){const s=SP[key];s.ab=ab;s.custom=1;
  if(ab.includes('speedy'))s.spd*=1.5;if(ab.includes('senses'))s.sense*=1.6;if(ab.includes('hardy')){s.tmin-=18;s.tmax+=14}if(ab.includes('longlife')){s.life*=2}
  if(ab.includes('babies')){s.litter=[s.litter[0]+1,s.litter[1]+2];s.gest*=0.6}if(ab.includes('thrifty'))s.meta*=0.6;if(ab.includes('nothirst'))s.thirst=0;
  if(ab.includes('pack'))PACKS.add(key);if(ab.includes('armour')){for(const k of SPK)if(SP[k].prey)SP[k].prey=SP[k].prey.filter(q=>q!==key);PREDS[key]=[]}
  if(ab.includes('pack')&&s.prey)s.prey=SPK.filter(q=>q!==key&&fitsPrey(key,q)&&!(SP[q].ab||[]).includes('armour'))}
function makeCreature(d,quiet){const key='u_'+d.n.toLowerCase().replace(/[^a-z0-9]+/g,'_')+'_'+(d.id||'');if(SP[key])return key;
  const k=addSpecies({n:d.n,pl:pluralOf(d.n),ic:d.ic,tp:d.tp,mass:d.mass*(d.ab.includes('giant')?2:1),cl:d.cl,col:d.col,sm:1,key},true);applyCAbil(k,d.ab);try{SPCOL[k]=d.col}catch(e){}
  PLACEDEVER.add(k);if(!quiet){addRailTool(k);CREATED++;chEv('create',{sp:k,ab:d.ab})}else{TOOLS.splice(0,TOOLS.length,...TOOLS0())}return k}
function makeStrain(d,quiet){if(STR.some(s=>s.id===d.id))return;const s={...d,amt:new Float32Array(N)};STR.push(s);if(!quiet){MCREATED++;chEv('mcreate',{ab:d.ab})}TOOLS.splice(0,TOOLS.length,...TOOLS0());if(!quiet){buildRail();setTool('strain_'+s.id)}return s}
const saveCustom=()=>lsSet('bio_custom',CUSTOM);
{const a0=animalTools;animalTools=function(){const out=a0();STR.forEach((s,j)=>out.push(['strain_'+s.id,s.n,'🦠',j===0?'My microbes':0]));return out}}
{const t0=toolTip;toolTip=function(id){const s=STR.find(q=>'strain_'+q.id===id);if(s)return`${s.n}: paint your microbe onto the world (${s.ab.map(a=>MABIL.find(m=>m[0]===a)[1]).join(', ')||'no special abilities'})`;return t0(id)}}
{const ap=applyTool;applyTool=function(px,py,first){const t=S.tool;if(!t.startsWith('strain_'))return ap(px,py,first);const s=STR.find(q=>'strain_'+q.id===t);if(!s)return;
  const x=wrapX(wxOf(px)),y=wrapY(wyOf(py)),R=S.brush;for(let yy=-R;yy<=R;yy++)for(let xx=-R;xx<=R;xx++){const d=Math.hypot(xx,yy);if(d>R)continue;const j=idx(x+xx,y+yy);if(j<0)continue;s.amt[j]=Math.max(s.amt[j],0.85*(1-d/(R+1))+0.1)}STRPAINT++;chEv('strainpaint',{id:s.id})}}
// microbes grow where they like it, spread to neighbours and change the world around them
let STROFF=0,STRDIS=0;
function suitOf(s,i){const T=cellT(i),w=isWater(i);if(w&&!s.ab.includes('plank'))return -1;if(!w&&s.ab.includes('plank')&&!s.ab.includes('rot')&&!s.ab.includes('fert'))return -0.3;
  const lo=s.ab.includes('cold')?-40:-2,hi=s.ab.includes('heat')?60:36;if(T<lo||T>hi)return -1;return w?0.8:0.4+0.6*Math.min(1,veg[i]+fert[i]*0.5)}
function stepStrains(dt){if(!STR.length)return;const ST=16;STROFF=(STROFF+1)%ST;const D=dt*ST;
  for(const s of STR){const a=s.amt,sp=s.ab.includes('fast')?3:1;for(let i=STROFF;i<N;i+=ST){const v=a[i];if(v<0.004)continue;const su=suitOf(s,i);
      a[i]=clamp(v+(su>0?0.06*su*v*(1-v):-0.08)*D,0,1);
      if(v>0.25){const x=i%GW,y=(i/GW)|0,r=rnd(),j=idx(x+(r<0.25?1:r<0.5?-1:0),y+(r>=0.5&&r<0.75?1:r>=0.75?-1:0));if(j>=0&&a[j]<v)a[j]=Math.min(1,a[j]+0.025*sp*v*D)}
      if(v>0.1){const f=v*D;if(s.ab.includes('rot'))mic[i]=Math.min(1,mic[i]+0.02*f);if(s.ab.includes('fert')&&!isWater(i))fert[i]=Math.min(3,fert[i]+0.012*f);
        if(s.ab.includes('grow')&&!isWater(i))veg[i]=Math.min(1,veg[i]+0.01*f);if(s.ab.includes('plank')&&isWater(i))alg[i]=Math.min(1,alg[i]+0.01*f);if(s.ab.includes('toxic')&&!isWater(i))veg[i]=Math.max(0,veg[i]-0.012*f)}}}
  STRDIS+=dt;if(STRDIS>=0.5){const sick=STR.filter(s=>s.ab.includes('disease'));if(sick.length)for(const an of S.animals){if(an.dead||an.sick>0||an.immT>0||(SP[an.sp].ab||[]).includes('immune'))continue;const i=idx(an.x,an.y);if(i<0)continue;
      for(const s of sick)if((s.target==='any'||s.target===an.sp)&&s.amt[i]>0.25&&rnd()<0.25*STRDIS){an.sick=rr(14,30);chEv('infect',{sp:an.sp,strain:s.id});break}}STRDIS=0}
  for(const an of S.animals)if(an.sick>0&&(SP[an.sp].ab||[]).includes('immune'))an.sick=0}
{const ss=simStep;simStep=function(dt){ss(dt);stepStrains(dt)}}
{const r0=render;render=function(now){r0(now);if(!STR.length)return;const show=S.view==='microbe'||cam.z>=3||STR.some(s=>s.ab.includes('glow'));if(!show)return;
  const x0=Math.floor(wxOf(0)),y0=Math.floor(wyOf(0)),x1=Math.ceil(wxOf(W)),y1=Math.ceil(wyOf(H)),st=Math.max(1,Math.ceil(Math.max(x1-x0,y1-y0)/110)),cs=CELL*cam.z*st;
  for(const s of STR){if(!(S.view==='microbe'||cam.z>=3||s.ab.includes('glow')))continue;const glow=s.ab.includes('glow');ctx.fillStyle=s.col;
    for(let y=y0;y<=y1;y+=st)for(let x=x0;x<=x1;x+=st){const i=idx(x,y);if(i<0)continue;const v=s.amt[i];if(v<0.06)continue;ctx.globalAlpha=Math.min(0.85,(glow?0.35:0.22)+v*0.5);ctx.beginPath();ctx.arc(sx(x)+cs/2,sy(y)+cs/2,cs*(0.25+0.4*v),0,TAU);ctx.fill()}}ctx.globalAlpha=1}}
const strainCover=s=>{let n=0,m=0;for(let i=0;i<N;i+=23){m++;if(s.amt[i]>0.2)n++}return n/Math.max(1,m)};
/* ---------- the maker window ---------- */
function makerBox(html){const box=document.createElement('div');box.className='mkbox';box.innerHTML=`<div class="mkcard panel">${html}</div>`;box.onclick=e=>{if(e.target===box)box.remove()};document.body.appendChild(box);return box}
function chips(list,sel,multi){return list.map(([k,n,d])=>`<button class="btn mkchip" data-k="${k}" aria-pressed="${sel.includes(k)}" title="${d||''}">${n}</button>`).join('')}
function wireChips(el,multi,max){el.querySelectorAll('.mkchip').forEach(b=>b.onclick=()=>{if(!multi)el.querySelectorAll('.mkchip').forEach(q=>q.setAttribute('aria-pressed','false'));const on=b.getAttribute('aria-pressed')!=='true';if(on&&multi&&max&&el.querySelectorAll('.mkchip[aria-pressed="true"]').length>=max){toast(`Pick up to ${max}`);return}b.setAttribute('aria-pressed',multi?on:'true')})}
const picked=el=>[...el.querySelectorAll('.mkchip[aria-pressed="true"]')].map(b=>b.dataset.k);
function openCreature(){const box=makerBox(`<span class="k">Creature maker</span><h2>✨ Design a creature</h2>
  <label class="mkrow">Name <input id="mkName" maxlength="24" placeholder="e.g. Glimmerfox"></label>
  <span class="k">Look</span><div class="mkemo" id="mkEmo">${CEMO.map((e,i)=>`<button class="btn mkchip" data-k="${e}" aria-pressed="${i===0}">${e}</button>`).join('')}</div>
  <label class="mkrow">Colour <input type="color" id="mkCol" value="#ff8a3d"></label>
  <span class="k">Body and diet</span><div class="mkgrid" id="mkBody">${chips(BODY.map(b=>[b[0],b[2]+' '+b[1]]),['rod'])}</div>
  <div class="sl"><div class="row"><span class="k">Size</span><span id="mkSzV"></span></div><input type="range" id="mkSz" min="0" max="100" value="40"></div>
  <span class="k">Home climate</span><div class="mkgrid" id="mkCl">${chips([['P','🧊 Polar'],['C','🏔 Cold'],['T','🌳 Mild'],['W','🌾 Warm'],['H','🌴 Tropical'],['D','🏜 Desert'],['A','🌍 Anywhere']],['T'])}</div>
  <span class="k">Abilities · pick up to 4</span><div class="mkgrid" id="mkAb">${chips(CABIL,[])}</div>
  <div class="actions"><button class="btn primary" id="mkGo">Create and release</button><button class="btn" id="mkX">Cancel</button></div>`);
  const sz=()=>{const v=+$('mkSz').value,m=+(0.02*Math.pow(400,v/100)).toFixed(2);$('mkSzV').textContent=m<0.15?`tiny (${m})`:m<0.6?`small (${m})`:m<2?`medium (${m})`:m<4.5?`large (${m})`:`huge (${m})`;return m};sz();$('mkSz').oninput=sz;
  for(const [id,multi,max] of [['mkEmo'],['mkBody'],['mkCl'],['mkAb',1,4]])wireChips($(id),!!multi,max);$('mkX').onclick=()=>box.remove();
  $('mkGo').onclick=()=>{const n=$('mkName').value.trim()||'Mystery beast';if(SPK.some(k=>SP[k].n.toLowerCase()===n.toLowerCase())){toast('That name is taken: pick another');return}
    const d={id:Date.now().toString(36),n,ic:picked($('mkEmo'))[0]||'🦄',col:$('mkCol').value,tp:picked($('mkBody'))[0]||'rod',mass:sz(),cl:picked($('mkCl'))[0]||'T',ab:picked($('mkAb'))};
    const k=makeCreature(d);CUSTOM.cre.push(d);saveCustom();box.remove();setTool(k);toast(`${d.ic} ${n} created! Click the map to release some`)}}
function openMicrobe(){if(STR.length>=6){toast('You can have up to 6 microbes');return}const box=makerBox(`<span class="k">Microbe lab</span><h2>🧫 Design a microbe</h2>
  <label class="mkrow">Name <input id="mkName" maxlength="24" placeholder="e.g. Glowmold"></label>
  <span class="k">Colour</span><div class="mkemo" id="mkMc">${MCOL.map((c,i)=>`<button class="btn mkchip" data-k="${c}" aria-pressed="${i===STR.length%MCOL.length}" style="background:${c};width:34px;height:34px"></button>`).join('')}</div>
  <span class="k">Abilities · pick up to 4</span><div class="mkgrid" id="mkAb">${chips(MABIL,['rot'])}</div>
  <label class="mkrow" id="mkTgtRow" hidden>Infects <select id="mkTgt" class="gsel"><option value="any">Every animal</option>${SPK.filter(k=>!SP[k].cat||PLACEDEVER.has(k)||SP[k].custom).map(k=>`<option value="${k}">${SP[k].ic} ${SP[k].n}</option>`).join('')}</select></label>
  <div class="actions"><button class="btn primary" id="mkGo">Create and paint</button><button class="btn" id="mkX">Cancel</button></div>`);
  wireChips($('mkMc'),false);wireChips($('mkAb'),true,4);$('mkAb').addEventListener('click',()=>{$('mkTgtRow').hidden=!picked($('mkAb')).includes('disease')});$('mkX').onclick=()=>box.remove();
  $('mkGo').onclick=()=>{const n=$('mkName').value.trim()||'Microbe '+(STR.length+1);const d={id:Date.now().toString(36),n,col:picked($('mkMc'))[0]||MCOL[0],ab:picked($('mkAb')),target:$('mkTgt').value};makeStrain(d);CUSTOM.mic.push(d);saveCustom();box.remove();toast(`🦠 ${n} created! Paint it onto the world`)}}
{const css=document.createElement('style');css.textContent=`.mkbox{position:fixed;inset:0;z-index:60;display:grid;place-items:center;background:rgba(4,10,8,.6)}.mkcard{width:min(560px,calc(100% - 24px));max-height:calc(100% - 24px);overflow:auto;padding:18px;display:flex;flex-direction:column;gap:10px}
.mkcard h2{font-family:var(--f-display);font-weight:500;margin:0;font-size:22px}.mkrow{display:flex;gap:10px;align-items:center;justify-content:space-between;font-size:14px}.mkrow input[type=text],.mkrow input:not([type]){flex:1;min-width:0;padding:8px 10px;border-radius:8px;border:1px solid var(--line-strong);background:rgba(0,0,0,.25);color:var(--ink);font-size:16px}
.mkemo{display:flex;flex-wrap:wrap;gap:4px;max-height:110px;overflow:auto}.mkemo .mkchip{padding:4px 6px;font-size:20px;line-height:1}.mkgrid{display:flex;flex-wrap:wrap;gap:5px}.mkgrid .mkchip{font-size:12.5px;padding:6px 8px}.mkchip[aria-pressed="true"]{outline:2px solid var(--cool);background:rgba(var(--accRGB),.18)}
.mkbtns{display:flex;gap:6px;flex-wrap:wrap}.mkcard .actions{display:flex;gap:8px;justify-content:flex-end}`;document.head.appendChild(css)}
{const p=$('pane-life'),w=document.createElement('div');w.className='mkbtns';w.innerHTML='<button class="btn primary" id="mkCre">✨ Create a creature</button><button class="btn" id="mkMic">🧫 Create a microbe</button>';p.prepend(w);$('mkCre').onclick=openCreature;$('mkMic').onclick=openMicrobe}
// bring back what you made last time
{const c=lsGet('bio_custom');if(c&&c.cre&&c.mic){CUSTOM=c;for(const d of c.cre)try{makeCreature(d,true)}catch(e){}for(const d of c.mic)try{makeStrain(d,true)}catch(e){}}}
const customOut=()=>S.animals.filter(a=>!a.dead&&SP[a.sp].custom).length;
CC(1.45,{t:'Mad scientist',g:'Create your own creature and release at least 5 of them.',hint:'Open the Life tab and press ✨ Create a creature. Then click the map with its tool.',setup:scn('meadow'),check:()=>{const n=customOut();return[CREATED>0&&n>=5,(CREATED>0?0.4:0)+Math.min(0.6,n/5*0.6),CREATED?`${n} of 5 released`:'Make a creature first']},stars:byTime(60,150)});
CC(1.46,{t:'Microbe lab',g:'Make your own microbe and let it spread across a good patch of land.',hint:'Life tab → 🧫 Create a microbe, then paint it on warm, green land. Fast spreader helps.',setup:scn('meadow'),check:()=>{const c=Math.max(0,...STR.map(strainCover));return[MCREATED>0&&c>=0.03,MCREATED?Math.min(1,0.3+c/0.03*0.7):0,MCREATED?`Covers ${(c*100).toFixed(1)}% of 3%`:'Make a microbe first']},stars:byTime(80,200)});
CC(2.65,{t:'Super species',g:'Create a creature with 3 abilities and grow it to 40 animals.',hint:'Many babies and Thrifty help a species grow fast. Armoured keeps it safe.',setup:scn('meadow'),check:()=>{const ks=SPK.filter(k=>SP[k].custom&&(SP[k].ab||[]).length>=3);const n=S.animals.filter(a=>!a.dead&&ks.includes(a.sp)).length;return[n>=40,n/40,ks.length?`${n} of 40`:'Make a creature with 3 abilities']},stars:byTime(150,360)});
CC(3.25,{t:'Germ warfare',g:'Use a disease microbe of your own to make 15 animals sick.',hint:'Create a microbe with 🤒 Disease and paint it where animals live.',setup:scn('meadow'),check:()=>{const n=CH.events.filter(e=>e.k==='infect'&&e.strain).length;return[n>=15,n/15,`${n} of 15 infected`]},stars:byTime(60,160)});
TSTEPS.push(['Make a creature','Open the Life tab and press ✨ Create a creature. Give it a name, body and abilities.',r=>CREATED>r.n,r=>{r.n=CREATED}],
  ['Make a microbe','Press 🧫 Create a microbe in the Life tab, then paint it onto the map.',r=>STRPAINT>r.n&&MCREATED>0,r=>{r.n=STRPAINT}]);
/* ================= Minds: intelligence and personalities for creatures you design ================= */
const IQN=['Instinct','Clever','Smart','Brilliant','Genius'];
const PERS=[['bold','Bold','Keeps going when danger is near'],['shy','Shy','Spots danger early and keeps away'],['curious','Curious','Explores every corner'],['playful','Playful','Zig-zags and bounces about'],
  ['friendly','Friendly','Sticks close to its own kind'],['loner','Loner','Keeps away from others'],['lazy','Lazy','Slow and saves energy'],['energetic','Energetic','Always on the move, fast'],
  ['greedy','Greedy','Eats more at every meal'],['nocturnal','Night owl','Sleeps by day, active at night'],['wanderer','Wanderer','Roams far across the world'],['homebody','Homebody','Stays near where it was born'],
  ['brave','Brave','Stands its ground to protect others'],['cautious','Cautious','Careful: senses sharper, moves slower'],['sneaky','Sneaky','Quiet and hard to spot'],['leader','Leader','Others of its kind follow it']];
const PN=Object.fromEntries(PERS.map(p=>[p[0],p[1]]));
const NAMESX=['Pip','Mo','Zuri','Kit','Juno','Nova','Bo','Rue','Ash','Fern','Iggy','Luna','Odo','Pax','Remy','Sol','Tia','Vex','Wren','Yuki','Zed','Echo','Fizz','Gus','Hana','Ivo','Jett','Koa','Lark','Milo','Nix','Oona','Pico','Quill','Rook','Sage','Tov','Uma','Vala','Wolf'];
let MINDS=0;
function applyMind(key,d){const s=SP[key];if(!s)return;const iq=Math.max(1,Math.min(5,d.iq||1));s.iq=iq;s.pers=(d.pers||[]).slice(0,3);
  s.sense*=1+0.12*(iq-1);s.meta*=1+0.05*(iq-1);// a bigger brain notices more but needs more food
  if(iq>=4){if(s.diet==='carn')PACKS.add(key);else s.herd=1}
  if(s.pers.includes('nocturnal'))NOCT.add(key);if(s.pers.includes('greedy')&&s.eat)s.eat*=1.25;if(s.pers.includes('friendly')||s.pers.includes('leader'))s.herd=1}
{const mc=makeCreature;makeCreature=function(d,quiet){const k=mc(d,quiet);applyMind(k,d);return k}}
// every animal of a designed species gets a name, the species' personality plus quirks of its own
{const add0=addAnimal;addAnimal=function(sp,x0,y0,o){const a=add0(sp,x0,y0,o);const s=SP[sp];if(a&&s&&s.custom&&!a.pers){const mine=new Set(s.pers||[]);
    const pool=PERS.map(p=>p[0]).filter(p=>!mine.has(p));const n=1+(rnd()<0.5?1:0);for(let k=0;k<n&&pool.length;k++)mine.add(pool.splice(Math.floor(rnd()*pool.length),1)[0]);
    a.pers=[...mine];a.iq=Math.max(1,Math.min(5,(s.iq||1)+(rnd()<0.2?1:rnd()<0.2?-1:0)));a.nick=NAMESX[Math.floor(rnd()*NAMESX.length)];a.hx=a.x;a.hy=a.y;
    const g=a.genes;if(a.pers.includes('energetic'))g.speed*=1.12;if(a.pers.includes('lazy'))g.speed*=0.86;if(a.pers.includes('cautious')){g.sense*=1.15;g.speed*=0.94}if(a.pers.includes('shy'))g.sense*=1.1}
  return a}}
const turnTo=(a,ang,k)=>{let d=ang-a.dir;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;a.dir+=d*k};
const pDist=(ax,ay,bx,by)=>Math.hypot(dWX(ax-bx),dWY(ay-by));
{const st0=stepAnimal;stepAnimal=function(a,dt){const r=st0(a,dt);if(a.dead||!a.pers)return r;const P=a.pers,iq=a.iq||1,s=SP[a.sp];
  // memory: smart creatures remember where they last found food and go back when hungry
  if(iq>=2){if(a._le!=null&&a.e>a._le+0.002)a.mem={x:a.x,y:a.y};a._le=a.e;
    if(a.mem&&a.state==='wander'&&a.e<0.75&&rnd()<0.15*iq*dt*4)turnTo(a,Math.atan2(dWY(a.mem.y-a.y),dWX(a.mem.x-a.x)),0.35)}
  // geniuses (and shy or cautious ones) spot predators early and steer away
  if((iq>=5||P.includes('shy')||P.includes('cautious'))&&PREDS[a.sp]&&PREDS[a.sp].length&&!P.includes('bold')&&!P.includes('brave')){let fx=0,fy=0;
    nearSp(PREDS[a.sp],a.x,a.y,s.sense*(iq>=5?1.4:1.2),b=>{if(!b.dead){fx+=dWX(a.x-b.x);fy+=dWY(a.y-b.y)}});if(fx||fy)turnTo(a,Math.atan2(fy,fx),0.4)}
  if(a.state==='wander'){
    if(P.includes('curious'))a.dir+=(rnd()-0.5)*1.6*dt*3;if(P.includes('playful'))a.dir+=Math.sin(S.t*3+a.id)*0.6*dt*3;
    if(P.includes('wanderer')){if(!a.wd||rnd()<0.01*dt)a.wd=rnd()*Math.PI*2;turnTo(a,a.wd,0.15)}
    if(P.includes('homebody')&&a.hx!=null&&pDist(a.x,a.y,a.hx,a.hy)>14)turnTo(a,Math.atan2(dWY(a.hy-a.y),dWX(a.hx-a.x)),0.3)
    if(P.includes('friendly')||P.includes('loner')){let n=null,nd=1e9;nearSp([a.sp],a.x,a.y,10,b=>{if(b!==a&&!b.dead){const d=pDist(a.x,a.y,b.x,b.y);if(d<nd){nd=d;n=b}}});
      if(n){const ang=Math.atan2(dWY(n.y-a.y),dWX(n.x-a.x));if(P.includes('friendly')&&nd>4)turnTo(a,ang,0.3);if(P.includes('loner')&&nd<6)turnTo(a,ang+Math.PI,0.35)}}
    if(!P.includes('leader')){let L=null;nearSp([a.sp],a.x,a.y,12,b=>{if(!L&&b!==a&&b.pers&&b.pers.includes('leader'))L=b});if(L&&pDist(a.x,a.y,L.x,L.y)>3)turnTo(a,Math.atan2(dWY(L.y-a.y),dWX(L.x-a.x)),0.2)}}
  if(P.includes('sneaky'))a.hidden=a.hidden||a.state!=='hunt'&&rnd()<0.3;
  return r}}
// the inspector shows each creature's name, mind and personality
{const bi=buildInspector;buildInspector=function(){bi();const o=S.sel;if(!o||!o.pers)return;const B=$('inspBody'),d=document.createElement('div');d.className='kv';
  d.innerHTML=`<div><span class="k">Name</span><span class="v"></span></div><div><span class="k">Intelligence</span><span class="v">${IQN[(o.iq||1)-1]}</span></div><div><span class="k">Personality</span><span class="v"></span></div><div><span class="k">Memory</span><span class="v">${o.mem?'remembers a good feeding spot':(o.iq||1)>=2?'still exploring':'lives by instinct'}</span></div>`;
  d.children[0].children[1].textContent=o.nick||'';d.children[2].children[1].textContent=o.pers.map(p=>PN[p]).join(', ');B.insertBefore(d,B.children[1]||null)}}
// the creature maker gets an intelligence slider and personality choices
{const oc=openCreature;openCreature=function(){oc();const ab=$('mkAb');if(!ab)return;const w=document.createElement('div');w.style.cssText='display:grid;gap:8px';
  w.innerHTML=`<div class="sl"><div class="row"><span class="k">Intelligence</span><span id="mkIqV">Smart</span></div><input type="range" id="mkIq" min="1" max="5" step="1" value="3"></div><span class="k">Personality · pick up to 3 (each animal also gets its own quirks)</span><div class="mkgrid" id="mkPers">${chips(PERS,[])}</div>`;
  ab.after(w);wireChips($('mkPers'),true,3);const iv=()=>$('mkIqV').textContent=IQN[$('mkIq').value-1];$('mkIq').oninput=iv;iv();
  const go=$('mkGo'),g0=go.onclick;go.onclick=()=>{const iq=+$('mkIq').value,pers=picked($('mkPers'));const before=CUSTOM.cre.length;MINDNEXT={iq,pers};g0();MINDNEXT=null;
    const d=CUSTOM.cre[CUSTOM.cre.length-1];if(CUSTOM.cre.length>before&&d){d.iq=iq;d.pers=pers;saveCustom();const k=SPK.find(k=>SP[k].custom&&SP[k].n===d.n);if(k)applyMind(k,d);MINDS++;chEv('mind',{iq,n:pers.length})}}}}
let MINDNEXT=null;$('mkCre').onclick=()=>openCreature();
CC(1.48,{t:'Genius creature',g:'Create a creature with Genius intelligence and release 5 of them.',hint:'Life tab: Create a creature, slide Intelligence all the way to Genius.',setup:scn('meadow'),check:()=>{const n=S.animals.filter(a=>!a.dead&&a.iq>=5).length;return[n>=5,n/5,`${n} of 5 geniuses`]},stars:byTime(60,150)});
CC(2.68,{t:'Big personalities',g:'Grow a creature with 3 personality traits to 25 animals.',hint:'Pick 3 personalities in the creature maker. Friendly and Leader help them stay together.',setup:scn('meadow'),check:()=>{const ks=SPK.filter(k=>SP[k].custom&&(SP[k].pers||[]).length>=3);const n=S.animals.filter(a=>!a.dead&&ks.includes(a.sp)).length;return[n>=25,n/25,ks.length?`${n} of 25`:'Make a creature with 3 personalities']},stars:byTime(150,360)});
TSTEPS.push(['Minds','In the creature maker, set an Intelligence level and pick personalities. Then click one of your creatures to see its name, mind and personality.',r=>MINDS>r.n,r=>{r.n=MINDS}]);
