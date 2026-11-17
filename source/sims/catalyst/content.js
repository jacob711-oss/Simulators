/* ================= Catalyst: reaction log, challenges, tutorial, demo ================= */
let PREVC=null;
{const h0=SIM.hud;SIM.hud=function(){h0.call(this);const c={};for(const m of MOLS)if(NAME[m.f]&&m.ats.length>1)c[m.f]=(c[m.f]||0)+1;
  if(PREVC){for(const f in c){const d=c[f]-(PREVC[f]||0);if(d>0){logR(`+${d} ${NAME[f]} (${subs(f)})`);chEv('formed',{f,n:d})}}}PREVC=c}}
{const l0=SIM.load;SIM.load=function(id){l0.call(this,id);PREVC=null}}
const madeN=f=>CH.events.filter(e=>e.k==='formed'&&e.f===f).reduce((s,e)=>s+e.n,0);
const biggest=f=>MOLS.reduce((m,x)=>f(x)&&x.ats.length>m?x.ats.length:m,0);
// getting started
CC(1,{t:'Find the water',g:'Find a water molecule and select it.',hint:'Type water in the search bar and pick “Water (H₂O)”.',scen:'water',check:()=>{const m=S.sel&&MOLS[S.sel.a.mol],ok=m&&m.f==='H2O';return[ok,ok?1:0,ok?'Found one':'Not found yet']},stars:byTime(20,45)});
CC(1.1,{t:'Kaboom',g:'Spark the hydrogen and oxygen and make 20 water molecules.',hint:'Pick 💥 Spark and click in the gas, or press 💥 Spark in the Lab tab.',scen:'combust',check:()=>{const n=madeN('H2O');return[n>=20,n/20,`${Math.min(n,20)} of 20 water molecules made`]},stars:byTime(20,50)});
CC(1.2,{t:'Hands on',g:'Grab an atom and pull it hard enough to snap a bond.',hint:'Pick ✋ Grab, press on an atom in a molecule and drag it away quickly.',scen:'air',setup:()=>{CH.ref.g=GRABBREAK},check:()=>{const ok=GRABBREAK>CH.ref.g;return[ok,ok?1:0,ok?'Snap!':'']},stars:byTime(20,50)});
CC(1.3,{t:'Ice cold',g:'Freeze the glass of water: get 70% of the box solid.',hint:'Drag the Wall temperature right down, or press ❄ Deep freeze.',scen:'water',check:()=>{const s=STAT.solid;return[since()>3&&s>=.7,s/.7,`${Math.round(s*100)}% solid`]},stars:byTime(25,60)});
CC(1.4,{t:'Boil it',g:'Boil the water: turn 90% of the box into gas.',hint:'Raise the Wall temperature above 400 K, or press 🔥 Boil.',scen:'water',check:()=>{const g=STAT.gas;return[since()>3&&g>=.9,g/.9,`${Math.round(g*100)}% gas`]},stars:byTime(30,70)});
CC(1.5,{t:'Squeeze',g:'Squash the room air until the pressure passes 4 atmospheres.',hint:'Drag the Box size slider down. Squeezing a gas also heats it.',scen:'air',check:()=>{const p=STAT.P;return[p>=4,p/4,`${p.toFixed(2)} atm`]},stars:byTime(20,50)});
CC(1.6,{t:'Build an atom zoo',g:'Put 6 different elements in the box.',hint:'Pick elements in the Lab tab, then paint them with the Atoms tool.',scen:'empty',check:()=>{const n=new Set(A.map(a=>a.e)).size;return[n>=6,n/6,`${n} of 6 elements`]},stars:byTime(30,70)});
CC(1.65,{t:'Periodic explorer',g:'Use the search bar to add 3 elements that are not on the Lab tab buttons (such as gold, lithium or neon).',hint:'Type gold (or any element) in the search bar and pick it.',scen:'empty',check:()=>{const n=new Set(CH.events.filter(e=>e.k==='add'&&!['H','C','N','O','S','Na','Cl','He','Ar','Fe'].includes(e.e)).map(e=>e.e)).size;return[n>=3,n/3,`${n} of 3 new elements`]},stars:byTime(30,70)});
CC(1.7,{t:'Make methane',g:'Make 5 methane molecules (CH₄) from carbon and hydrogen atoms.',hint:'Add some C atoms and plenty of H atoms. Radicals snap together by themselves.',scen:'empty',check:()=>{const n=molCount('CH4');return[n>=5,n/5,`${n} of 5 methane`]},stars:byTime(30,70)});
CC(1.8,{t:'Split water',g:'Use electrolysis to split water and collect 10 hydrogen molecules.',hint:'Pick ⚡ Electrolysis and paint over the water. Free H atoms pair up into H₂.',scen:'water',check:()=>{const n=madeN('H2');return[n>=10,n/10,`${Math.min(n,10)} of 10 H₂ made`]},stars:byTime(30,70)});
CC(1.9,{t:'Absolute zero',g:'Cool the box below 10 K.',hint:'Wall temperature right down, thermostat on. Or use the Cool tool.',scen:'air',check:()=>{const T=STAT.T;return[T<10,clamp((300-T)/290,0,1),`${T.toFixed(1)} K`]},stars:byTime(30,70)});
// reactions
CC(2.4,{t:'Burn methane',g:'Light the methane and make 15 carbon dioxide molecules.',hint:'Spark it a few times; hot gas keeps the fire going. Raise the temperature to help.',scen:'methane',check:()=>{const n=molCount('CO2');return[n>=15,n/15,`${n} of 15 CO₂`]},stars:byTime(45,110)});
CC(2.8,{t:'Haber process',g:'Make 6 ammonia molecules (NH₃) from nitrogen and hydrogen.',hint:'The iron helps break the strong N≡N bond. Keep it hot (around 700–900 K) and wait.',scen:'haber',check:()=>{const n=molCount('H3N');return[n>=6,n/6,`${n} of 6 ammonia`]},stars:byTime(60,150)});
CC(2.2,{t:'Ozone layer',g:'Make 5 ozone molecules (O₃) with ultraviolet light.',hint:'UV splits O₂ into O atoms, which join other O₂. Use ☀ UV light or the Light tool on air.',scen:'air',check:()=>{const n=molCount('O3');return[n>=5,n/5,`${n} of 5 ozone`]},stars:byTime(45,110)});
CC(2.6,{t:'Salt crystal',g:'Grow a salt crystal with 40 sodium and chlorine atoms stuck together.',hint:'Add Na and Cl atoms (Lab tab) and cool them down so they cling.',scen:'empty',check:()=>{let best=0;const seen=new Set();for(const a of A){if((a.e!=='Na'&&a.e!=='Cl')||seen.has(a))continue;let n=0;const st=[a];seen.add(a);while(st.length){const x=st.pop();n++;for(const b of A)if(!seen.has(b)&&(b.e==='Na'||b.e==='Cl')&&(b.x-x.x)**2+(b.y-x.y)**2<6.5){seen.add(b);st.push(b)}}best=Math.max(best,n)}return[best>=40,best/40,`Biggest crystal: ${best} atoms`]},stars:byTime(60,150)});
CC(3.0,{t:'Primordial soup',g:'Zap the early Earth chemicals until a molecule with C, H, N and O and at least 6 atoms appears.',hint:'Lightning breaks molecules into radicals that join into bigger ones. Keep it warm and wait.',scen:'soup',check:()=>{const ok=MOLS.some(m=>m.ats.length>=6&&['C','H','N','O'].every(e=>m.ats.some(a=>a.e===e)));const b=biggest(m=>m.ats.some(a=>a.e==='C'));return[ok,ok?1:Math.min(.9,b/12),ok?'Life’s building blocks!':`Biggest carbon molecule: ${b} atoms`]},stars:byTime(60,160)});
CC(3.4,{t:'Big molecule',g:'Build one molecule with 14 or more atoms.',hint:'Carbon makes 4 bonds, so it builds chains. Add C and H, spark them, and grab pieces together.',scen:'empty',check:()=>{const b=biggest(()=>true);return[b>=14,b/14,`Biggest: ${b} atoms`]},stars:byTime(60,160)});
CC(2.5,{t:'Hydrogen peroxide',g:'Make 3 hydrogen peroxide molecules (H₂O₂).',hint:'Two OH radicals join into H₂O₂. Make OH by splitting water with light or electrolysis, then cool it.',scen:'water',check:()=>{const n=molCount('H2O2');return[n>=3,n/3,`${n} of 3 H₂O₂`]},stars:byTime(60,150)});
CC(3.2,{t:'Rust',g:'Make 10 iron oxide molecules.',hint:'Add iron (Fe) atoms to air and heat them. Oxygen grabs the iron.',scen:'air',check:()=>{const n=MOLS.filter(m=>m.ats.some(a=>a.e==='Fe')&&m.ats.some(a=>a.e==='O')).length;return[n>=10,n/10,`${n} of 10 rusty molecules`]},stars:byTime(60,150)});
CC(2.9,{t:'Laughing gas',g:'Make a molecule of laughing gas (N₂O).',hint:'Break N₂ and O₂ apart with sparks or heat (over 3000 K), then cool it quickly.',scen:'air',check:()=>{const ok=molCount('N2O')>0;return[ok,ok?1:0,ok?'Ha ha!':'Not yet']},stars:byTime(60,160)});
// heat and energy
CC(2.3,{t:'Chain reaction',g:'With the thermostat off, let a reaction heat the gas to 1,500 K.',hint:'Turn the thermostat off, then spark the hydrogen and oxygen. Making bonds releases energy.',scen:'combust',check:()=>{const ok=!ENV.therm&&STAT.T>=1500;return[ok,ENV.therm?0:clamp(STAT.T/1500,0,1),ENV.therm?'Turn the thermostat off first':`${Math.round(STAT.T)} K`]},stars:byTime(30,80)});
CC(3.6,{t:'Plasma',g:'Heat the room air until 90% of its atoms are torn free of their bonds.',hint:'Crank the wall temperature to the top and squeeze the box.',scen:'air',check:()=>{const f=A.length?A.filter(a=>a.bonds.length===0).length/A.length:0;return[f>=.9,f/.9,`${Math.round(f*100)}% free atoms`]},stars:byTime(45,110)});
CC(2.7,{t:'Rain in a box',g:'Turn on gravity and condense the water vapour into a liquid pool (60% liquid).',hint:'Air above, steam in the box. Add gravity and cool to about 300 K.',scen:'water',setup:()=>{ENV.tw=480;ENV.grav=0;for(const a of A){a.vx*=1.4;a.vy*=1.4}syncUI()},check:()=>{const l=STAT.liquid;return[since()>3&&l>=.6&&ENV.grav>0,l/.6,`${Math.round(l*100)}% liquid${ENV.grav>0?'':' · turn on gravity'}`]},stars:byTime(45,110)});
CC(3.8,{t:'Pressure cooker',g:'Reach 50 atmospheres.',hint:'Squeeze the box small and heat it up. Pressure rises with both.',scen:'air',check:()=>{const p=STAT.P;return[p>=50,p/50,`${p.toFixed(1)} atm`]},stars:byTime(45,110)});

/* tutorial */
TSTEPS.push(
 ['Look around','Drag to move around the box. W, A, S and D work too.',r=>CNT.moved>r.m+150,r=>{r.m=CNT.moved}],
 ['Zoom in','Scroll (or pinch) to zoom right in on the atoms.',r=>CNT.zoomed>r.z+2,r=>{r.z=CNT.zoomed}],
 ['Pause time','Press Space or the ⏸ button to pause.',()=>S.paused],
 ['Speed up','Resume, then press “fast”.',()=>!S.paused&&S.speed>=5],
 ['Inspect a molecule','Click any atom. The Inspect tab shows its molecule, its bonds and how hot it is.',()=>S.sel&&S.sel.a],
 ['Grab','Pick ✋ Grab and drag an atom around.',r=>GRABBED!=null||evN('grab')>r.n,r=>{r.n=evN('grab')}],
 ['Choose an element','In the Lab tab, click an element button such as C or O.',r=>ELPICK>r.n,r=>{r.n=ELPICK}],
 ['Any element','Type gold (or any of the 118 elements) in the search bar and pick it.',r=>ELPICK>r.n,r=>{r.n=ELPICK}],
 ['Add atoms','With the Atoms tool, paint some atoms into the box.',r=>ADDED>r.n,r=>{r.n=ADDED}],
 ['Find a molecule','Type water in the search bar and pick “Add Water” to drop some in.',r=>evN('addmol')>r.n||CNT.find>r.f,r=>{r.n=evN('addmol');r.f=CNT.find}],
 ['Heat','Pick 🔥 Heat and paint over some atoms: they speed up.',r=>HEATS>r.n,r=>{r.n=HEATS}],
 ['Spark','Pick 💥 Spark and click among the molecules.',r=>SPARKS>r.n,r=>{r.n=SPARKS}],
 ['Light','Pick ☀️ Light and paint ultraviolet light: it splits molecules.',r=>LIGHTS>r.n,r=>{r.n=LIGHTS}],
 ['Electrolysis','Pick ⚡ Electrolysis and paint over water to split it.',r=>ZAPS>r.n,r=>{r.n=ZAPS}],
 ['Remove','Pick 🧽 Remove and paint to take atoms out.',r=>ERASED>r.n,r=>{r.n=ERASED}],
 ['Temperature','In the Lab tab, drag the Wall temperature slider.',r=>SLIDED>r.n,r=>{r.n=SLIDED}],
 ['Cause an event','Press one of the events, such as ☀ UV light or 〰 Shake.',r=>EVN>r.n,r=>{r.n=EVN}],
 ['Stop the event','Press the same button again (it now says ■ Stop) or ↺ Stop all events.',r=>EVSTOP>r.n,r=>{r.n=EVSTOP}],
 ['Views','Switch to the Solid / liquid / gas view.',()=>S.view==='phase'],
 ['The Molecules tab','Open the Molecules tab to see everything in the box and the latest reactions.',r=>(CNT.tab_mols||0)>r.n,r=>{r.n=CNT.tab_mols||0}],
 ['Other experiments','Press Experiments in the top bar and pick another one.',r=>CNT.scen>r.n,r=>{r.n=CNT.scen}],
);

/* demo */
DEMO.push(
 ['combust','Hydrogen meets oxygen','The gas sits calmly until a spark breaks a few bonds. Then a chain reaction races through it, making water and heat.',()=>{setSpeed(1);setTimeout(()=>doEvent('spark'),1500)}],
 ['water','A glass of water','Water molecules cling together into a liquid. Heat makes them jiggle faster until they fly off as steam.',()=>{setSpeed(1);flyToW(60,62,9)}],
 ['ice','Ice cube','Cold molecules lock into a solid. Warm the box and watch the ice melt.',()=>{setSpeed(2);ENV.tw=420;syncUI()}],
 ['salt','Salt crystal','Sodium and chlorine stick together in a crystal. In water, the edges slowly come apart.',()=>{setSpeed(1);flyToW(60,60,8)}],
 ['haber','The Haber process','Iron helps split the strong bond in nitrogen, so hydrogen can attach and form ammonia: the reaction that feeds the world.',()=>{setSpeed(3)}],
 ['soup','Primordial soup','Lightning tears simple molecules apart, and the pieces rejoin into bigger, more complex ones.',()=>{setSpeed(3);setView('mol')}],
);
