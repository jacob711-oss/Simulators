/* ================= Abyssal: challenges, tutorial, demo ================= */
const pop=k=>STAT.pop[k]||0;
const relN=k=>CH.events.filter(e=>e.k==='release'&&(!k||e.sp===k)).reduce((s,e)=>s+e.n,0);
CC(1,{t:'Find a shark',g:'Find a shark and follow it.',hint:'Type shark in the search bar and pick “Find a shark”.',scen:'reef',check:()=>{const ok=S.sel&&S.sel.a&&S.sel.a.sp==='shark'&&S.follow;return[ok,S.sel&&S.sel.a&&S.sel.a.sp==='shark'?0.5:0,ok?'Following a shark':'']},stars:byTime(20,45)});
CC(1.1,{t:'Into the deep',g:'Find an anglerfish, 2,500 m down in the dark.',hint:'Type angler in the search bar.',scen:'vents',check:()=>{const ok=S.sel&&S.sel.a&&S.sel.a.sp==='angler';return[ok,ok?1:0,'']},stars:byTime(20,45)});
CC(1.2,{t:'School’s in',g:'Release 40 sardines and watch them school.',hint:'Pick 🐟 Sardine in the toolbar and click in the sunlit water.',scen:'empty',check:()=>{const n=relN('sardine');return[n>=40,n/40,`${Math.min(n,40)} of 40 released`]},stars:byTime(20,50)});
CC(1.3,{t:'Plant a reef',g:'Plant 30 corals.',hint:'Pick 🪸 Coral and click on shallow sea floor (in the sunlight).',scen:'kelp',setup:()=>{CH.ref.c=CORAL.length},check:()=>{const n=CORAL.length-CH.ref.c;return[n>=30,n/30,`${n} of 30 corals`]},stars:byTime(25,60)});
CC(1.4,{t:'Bloom',g:'Turn 40% of the sunlit water green with plankton.',hint:'Paint 🟢 Plankton or 🧪 Nutrients near the surface, or press 🟢 Algae bloom.',scen:'open',check:()=>{const p=STAT.plank;return[p>=.4,p/.4,`${Math.round(p*100)}% plankton at the surface`]},stars:byTime(25,60)});
CC(1.5,{t:'Clean the sea',g:'Clean up 100 pieces of plastic.',hint:'Press 🧴 Plastic patch if there is none, then paint with 🧽 Clean up.',scen:'reef',setup:()=>{doEvent('plastic');CH.ref.c=CLEANED},check:()=>{const n=Math.floor(CLEANED-CH.ref.c);return[n>=100,n/100,`${Math.min(n,100)} of 100 cleaned`]},stars:byTime(30,70)});
CC(1.6,{t:'Turtle rescue',g:'Have 15 sea turtles on the reef.',hint:'Release turtles (🐢) and make sure there are jellyfish to eat.',scen:'reef',check:()=>{const n=pop('turtle');return[n>=15,n/15,`${n} of 15 turtles`]},stars:byTime(30,70)});
// ecology
CC(2.4,{t:'Whale feast',g:'Grow the whales to 8 in the polar sea.',hint:'Whales eat krill (animal plankton). Paint plankton and nutrients, and keep the water cold.',scen:'polar',check:()=>{const n=pop('whale');return[n>=8,n/8,`${n} of 8 whales`]},stars:byTime(60,150)});
CC(2.2,{t:'Predators and prey',g:'Keep sharks and tuna alive together for 1 year.',hint:'If the sharks eat all the tuna, they starve. Keep plenty of sardines for the tuna.',scen:'open',check:()=>{const p=hold('h',pop('shark')>0&&pop('tuna')>0,365);return[p>=1,p,`${pop('shark')} sharks · ${pop('tuna')} tuna · ${Math.round(p*365)} of 365 days`]},fail:()=>!pop('shark')?'The sharks died out':!pop('tuna')?'The tuna died out':'',stars:byTime(60,150)});
CC(2.6,{t:'Life at the vents',g:'Have 120 crabs living on the deep sea floor.',hint:'Crabs eat marine snow. More life up above means more food falling down. Open more vents too.',scen:'vents',check:()=>{const n=pop('crab');return[n>=120,n/120,`${n} of 120 crabs`]},stars:byTime(60,150)});
CC(2.3,{t:'Kelp forest',g:'Grow 30 new tall kelp plants in the cold coastal water.',hint:'Pick 🌿 Kelp and plant on shallow floor, then let it grow. Kelp shrinks in warm water.',scen:'kelp',setup:()=>{CH.ref.k=KELP.length},check:()=>{const n=KELP.slice(CH.ref.k).filter(k=>k.len>8).length;return[n>=30,n/30,`${n} of 30 new tall kelp`]},stars:byTime(60,150)});
CC(3.0,{t:'Jellyfish takeover',g:'Let the jellyfish grow to 350.',hint:'Jellyfish thrive when their predators (turtles) and competitors (small fish) vanish, and plankton is plentiful.',scen:'reef',check:()=>{const n=pop('jelly');return[n>=350,n/350,`${n} of 350 jellyfish`]},stars:byTime(60,150)});
CC(2.8,{t:'Night shift',g:'Watch lanternfish rise toward the surface at night: get 60 of them above 600 m.',hint:'Slow time to 1 hour per second. At night the lanternfish swim up to feed.',scen:'open',check:()=>{const n=AG.filter(a=>a.sp==='lantern'&&a.y<600/MPU).length;return[n>=60,n/60,`${n} of 60 lanternfish shallower than 600 m`]},stars:byTime(45,110)});
// people and the ocean
CC(2.5,{t:'Save the reef',g:'A marine heatwave is bleaching the coral. Keep average coral health above 50% for 120 days.',hint:'Cool the water with 🧊 Cool, lower the temperature or carbon dioxide, and stop the heatwave.',scen:'reef',setup:()=>{doEvent('heatwave');ENV.temp=2;syncUI()},check:()=>{const p=hold('r',STAT.coral>0.5,120);return[p>=1,p,`Coral health ${Math.round(STAT.coral*100)}% · ${Math.round(p*120)} of 120 days`]},fail:()=>STAT.coral<0.2?'The reef bleached and died':'',stars:byTime(45,110)});
CC(3.2,{t:'Fix the dead zone',g:'Farm runoff has choked the river mouth. Get low-oxygen water below 5%.',hint:'Turn down River nutrients, and let storms or time mix oxygen back in.',scen:'deadzone',setup:()=>{for(let k=0;k<60;k++)fieldStep(0.5)},check:()=>{const f=STAT.o2low;return[since()>5&&f<.05,clamp((0.3-f)/0.25,0,1),`${Math.round(f*100)}% of the water low in oxygen`]},stars:byTime(60,150)});
CC(3.4,{t:'Sustainable fishing',g:'Catch 150 fish with boats while keeping at least 150 sardines alive.',hint:'Use the Fishing boats slider. Too many boats and the sardines collapse.',scen:'open',setup:()=>{CH.ref.c=CATCH},check:()=>{const c=CATCH-CH.ref.c,s=pop('sardine');return[c>=150&&s>=150,Math.min(1,c/150)*(s>=150?1:0.5),`${c} of 150 caught · ${s} sardines`]},fail:()=>pop('sardine')<40?'The sardines were overfished':'',stars:byTime(60,150)});
CC(2.9,{t:'Oil spill',g:'Clean up an oil spill before it kills more than 20 animals.',hint:'Paint the black slick with 🧽 Clean up.',scen:'reef',setup:()=>{doEvent('oil');CH.ref.d=0},check:()=>{let oil=0;for(let g=0;g<NG;g++)oil+=OIL[g];return[oil<0.5,clamp(1-oil/12,0,1),`Oil left: ${oil.toFixed(1)}`]},fail:()=>CH.events.filter(e=>e.k==='death'&&e.cause!=='old age'&&e.cause.indexOf('eaten')<0).length>20?'Too many animals died':'',stars:byTime(40,100)});
CC(3.6,{t:'Acid ocean',g:'Raise carbon dioxide until the coral starts dissolving: average coral health below 30%.',hint:'Drag the Carbon dioxide slider up. More CO₂ makes the sea more acidic.',scen:'reef',check:()=>{const h=STAT.coral;return[h<0.3,clamp((1-h)/0.7,0,1),`Coral health ${Math.round(h*100)}% · pH ${pH().toFixed(2)}`]},stars:byTime(45,110)});
CC(4.0,{t:'Rewild the ocean',g:'In the empty ocean, have 8 species alive at once for 60 days.',hint:'Start the food web from the bottom: plankton, then small fish, then hunters.',scen:'empty',check:()=>{const n=SPK.filter(k=>pop(k)>0).length,p=hold('w',n>=8,60);return[p>=1,p*0.8+Math.min(0.2,n/40),`${n} species · ${Math.round(p*60)} of 60 days`]},stars:byTime(90,240)});
CC(1.7,{t:'First foundations',g:'Build an underwater city with 3 domes and a farm.',hint:'Pick 🫧 Dome and 🌾 Farm in the City section of the toolbar and click on the sea floor.',scen:'reef',check:()=>{const d=CITY.b.filter(b=>b.t==='dome').length,f=CITY.b.filter(b=>b.t==='farm').length;return[d>=3&&f>=1,Math.min(d,3)/4+Math.min(f,1)/4,`${d} of 3 domes · ${f} of 1 farm`]},stars:byTime(30,70)});
CC(2.7,{t:'Atlantis',g:'Grow your underwater city to 500 people.',hint:'People need homes (domes, towers), food (farms) and power (power plants: put them next to hot vents for extra power).',scen:'vents',check:()=>{const n=Math.round(CITY.pop);return[n>=500,n/500,`${n} of 500 people`]},stars:byTime(60,150)});
CC(3.3,{t:'Eco city',g:'Have a city of 300 people while the reef stays above 60% health for 60 days.',hint:'Farms and powered homes grow the city; too many people pollute the water. Balance it.',scen:'reef',check:()=>{const p=hold('e',CITY.pop>=300&&STAT.coral>0.6,60);return[p>=1,p*0.7+Math.min(0.3,CITY.pop/1000),`${Math.round(CITY.pop)} people · coral ${Math.round(STAT.coral*100)}% · ${Math.round(p*60)} of 60 days`]},stars:byTime(90,200)});

TSTEPS.push(
 ['Look around','Drag to move around the ocean. W, A, S and D work too.',r=>CNT.moved>r.m+150,r=>{r.m=CNT.moved}],
 ['Zoom','Scroll (or pinch) to zoom in on the creatures.',r=>CNT.zoomed>r.z+2,r=>{r.z=CNT.zoomed}],
 ['Pause time','Press Space or the ⏸ button to pause.',()=>S.paused],
 ['Speed up','Resume, then press “1 day”.',()=>!S.paused&&S.speed>=1],
 ['Find a creature','Type turtle in the search bar and pick “Find a sea turtle”.',()=>S.sel&&S.sel.a],
 ['Inspect','The Inspect tab shows its energy, age and what it eats. Press Feed.',r=>FEDBY>r.n,r=>{r.n=FEDBY}],
 ['Release sea life','Pick 🐟 Sardine in the toolbar and click in the water.',r=>Object.values(RELEASED).reduce((x,y)=>x+y,0)>r.n,r=>{r.n=Object.values(RELEASED).reduce((x,y)=>x+y,0)}],
 ['Build a city','Pick 🫧 Dome in the City section of the toolbar and click on the sea floor. Add a 🌾 Farm and a ⚡ Power plant so people move in.',r=>CITY.built>r.n,r=>{r.n=CITY.built}],
 ['Plant coral','Pick 🪸 Coral and click on shallow sea floor.',r=>PLANTED>r.n,r=>{r.n=PLANTED}],
 ['Feed the plankton','Pick 🟢 Plankton and paint near the surface.',r=>FED>r.n,r=>{r.n=FED}],
 ['Change the water','Pick 🔥 Heat or 🧊 Cool and paint in the water.',r=>HEATED>r.n,r=>{r.n=HEATED}],
 ['Clean up','Press 🧴 Plastic patch in the Ocean tab, then pick 🧽 Clean up and paint over it.',r=>CLEANED>r.n,r=>{r.n=CLEANED}],
 ['Fishing boats','In the Ocean tab, drag the Fishing boats slider.',r=>SLIDED>r.n,r=>{r.n=SLIDED}],
 ['Cause an event','Press one of the events, such as ☀ Marine heatwave.',r=>EVN>r.n,r=>{r.n=EVN}],
 ['Stop the event','Press the same button again (it now says ■ Stop) or ↺ Stop all events.',r=>EVSTOP>r.n,r=>{r.n=EVSTOP}],
 ['Views','Switch to the Oxygen or Plankton view.',()=>S.view==='oxygen'||S.view==='plankton'],
 ['The Life tab','Open the Life tab to see every species and the endangered list.',r=>(CNT.tab_life||0)>r.n,r=>{r.n=CNT.tab_life||0}],
 ['Other oceans','Press Oceans in the top bar and pick another one.',r=>CNT.scen>r.n,r=>{r.n=CNT.scen}],
);
DEMO.push(
 ['reef','Coral reef','Warm, clear, shallow water: corals, turtles, schools of fish and the sharks that hunt them.',()=>{setSpeed(0);flyToW(180,20,6)}],
 ['kelp','Kelp forest','Giant kelp towers up from the cold sea floor, sheltering fish, crabs and hunting seals.',()=>{setSpeed(0);flyToW(110,25,5)}],
 ['open','The open ocean','Tuna and dolphins chase sardines near the surface; far below, lanternfish glow in the dark.',()=>{setSpeed(1)}],
 ['vents','Deep-sea vents','No sunlight reaches 3 km down. Hot vents feed a strange world of crabs and anglerfish.',()=>{setSpeed(0);flyToW(180,140,5)}],
 ['polar','Whale feast','In icy water, krill swarm in the plankton, and the biggest animals on Earth come to eat.',()=>{setSpeed(1);setView('plankton')}],
 ['deadzone','Dead zone','Fertiliser from farms feeds a huge bloom. When it dies and rots, it uses up the oxygen.',()=>{setSpeed(3);setView('oxygen')}],
);
