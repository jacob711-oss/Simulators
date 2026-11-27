/* ================= Lithosphere: challenges, tutorial, demo ================= */
const myr=()=>since();
const contCount=()=>STAT.cont;
const natQ=m=>evHas(e=>e.k==='quake'&&e.nat&&e.m>=m);
// getting started
CC(1,{t:'Roof of the world',g:'Find the highest mountain on the planet and select it.',hint:'Type highest in the search bar and press Enter.',scen:'earth',check:()=>{const ok=S.sel&&Math.abs(h[S.sel.i]-h[STAT.peakI])<300&&Math.abs(wdx(cxOf(S.sel.i)-cxOf(STAT.peakI)))<3;return[ok,ok?1:0,ok?'Found it':'Not found yet']},stars:byTime(20,45)});
CC(1.1,{t:'Deep time',g:'Run time at 5 million years per second.',hint:'Press “5 Myr” next to the pause button.',scen:'earth',check:()=>{const ok=!S.paused&&S.speed>=5;return[ok,ok?1:0,'']},stars:byTime(10,30)});
CC(1.25,{t:'Fault finder',g:'Find a place where two plates slide past each other (a yellow boundary line) and click on it.',hint:'Make sure Plate boundaries is On in the World tab, zoom in on a yellow line and click exactly on it.',scen:'earth',check:()=>{const ok=S.sel&&bnd[S.sel.i]===3;return[ok,ok?1:0,ok?'A transform fault!':'Click on a yellow line']},stars:byTime(25,60)});
CC(1.2,{t:'See the plates',g:'Switch to the Plates view and select the fastest-moving plate.',hint:'World tab → Views → Plates. Then open the Planet tab: plates are listed with their speeds. Click the top speed.',scen:'earth',
  check:()=>{const live=PL.filter(p=>p.n>0),f=live.reduce((a,b)=>plateCm(b)>plateCm(a)?b:a,live[0]),ok=S.view==='plates'&&S.sel&&pl[S.sel.i]===f.id;return[ok,(S.view==='plates'?.5:0)+(ok?.5:0),S.view!=='plates'?'Turn on the Plates view':ok?'That is the fastest':`Fastest is ${f.name} at ${plateCm(f).toFixed(1)} cm/yr`]},stars:byTime(30,70)});
CC(1.3,{t:'Make an island',g:'Raise 40 squares of new land out of the open ocean.',hint:'Pick Raise and paint over the sea, again and again in the same spot.',scen:'young',setup:()=>{CH.ref.l=LANDMADE},check:()=>{const n=LANDMADE-CH.ref.l;return[n>=40,n/40,`${Math.min(n,40)} of 40 squares`]},stars:byTime(25,60)});
CC(1.4,{t:'Eruption',g:'Start a volcano and watch it erupt 3 times.',hint:'Pick Volcano and click anywhere. New volcanoes erupt often for a while.',scen:'earth',check:()=>{const n=CH.events.filter(e=>e.k==='erupt'&&e.user).length;return[n>=3,n/3,`${Math.min(n,3)} of 3 eruptions`]},stars:byTime(25,60)});
CC(1.5,{t:'Shake it',g:'Set off a magnitude 8 earthquake with the Quake tool.',hint:'Pick Quake, drag the Brush slider up to 7 or more, then click.',scen:'earth',check:()=>{const ok=evHas(e=>e.k==='quake'&&e.m>=8);return[ok,ok?1:0,'']},stars:byTime(20,50)});
CC(1.6,{t:'Change course',g:'Push a plate so it moves at least 12 cm a year.',hint:'Pick Push plate and drag a long arrow across a plate, or select a plate and use the speed slider in the Inspect tab.',scen:'earth',check:()=>{const m=Math.max(0,...PL.filter(p=>p.n).map(plateCm));return[m>=12,m/12,`Fastest plate: ${m.toFixed(1)} cm/yr`]},stars:byTime(25,60)});
CC(1.7,{t:'Hotspot',g:'Place a hotspot in the ocean and let it build a volcano.',hint:'Pick Hotspot and click on deep sea, then speed up time.',scen:'earth',check:()=>{const ok=VOL.some(v=>v.kind==='hotspot'&&v.born>CH.t0&&HS.includes(v.hs)&&HS.indexOf(v.hs)>=0);return[ok&&HOTSPOTS>0,ok?1:HOTSPOTS?.5:0,ok?'A volcano is growing':HOTSPOTS?'Now let time run':'Place a hotspot first']},stars:byTime(30,70)});
CC(1.8,{t:'Impact',g:'Drop a meteor and blast a crater.',hint:'Pick Meteor and click anywhere.',scen:'earth',check:()=>{const ok=evN('meteor')>0;return[ok,ok?1:0,'']},stars:byTime(15,40)});
CC(1.9,{t:'Rising tide',g:'Raise the sea level by 300 m.',hint:'World tab → Sea level slider.',scen:'earth',check:()=>{const v=SEA;return[v>=300,clamp(v/300,0,1),`Sea level ${v>=0?'+':''}${Math.round(v)} m`]},stars:byTime(15,40)});
// mountains and oceans
CC(2.4,{t:'Himalaya',g:'Let the two continents collide and raise a peak over 7,000 m.',hint:'The small continent is already moving. Speed up time to 5 Myr and watch the Plates view.',scen:'collide',check:()=>{const p=STAT.peak;return[p>=7000,clamp(p/7000,0,1),`Highest peak ${fmtN(Math.round(p))} m`]},stars:byTime(45,110)});
CC(3.4,{t:'Everest and beyond',g:'Raise a mountain higher than 8,800 m by colliding continents.',hint:'Faster collisions build higher mountains. Push the small continent harder into the big one, and turn erosion down.',scen:'collide',setup:()=>{CH.ref.r=RAISED},check:()=>{const p=STAT.peak,ok=p>=8800&&RAISED===CH.ref.r;return[ok,clamp(p/8800,0,1),`Highest peak ${fmtN(Math.round(p))} m${RAISED!==CH.ref.r?' · painting with Raise does not count':''}`]},stars:byTime(70,160)});
CC(2.8,{t:'The abyss',g:'Grow an ocean trench deeper than 10,000 m.',hint:'Trenches form where old seafloor dives under another plate. Make the plates collide faster with Push plate.',scen:'ring',setup:()=>{CH.ref.r=RAISED},check:()=>{const d=-STAT.deep,ok=d>=10000&&RAISED===CH.ref.r;return[ok,clamp(d/10000,0,1),`Deepest ${fmtN(Math.round(d))} m${RAISED!==CH.ref.r?' · digging does not count':''}`]},stars:byTime(50,120)});
CC(2.6,{t:'Island chain',g:'Let the hotspot build a chain of 6 islands.',hint:'The plate carries each volcano away from the plume, and a new one grows. Speed up time.',scen:'hawaii',setup:()=>{CH.ref.v=0},check:()=>{const n=VOL.filter(v=>v.kind==='hotspot'&&v.born>CH.t0).length;return[n>=6,n/6,`${Math.min(n,6)} of 6 hotspot volcanoes`]},stars:byTime(45,110)});
CC(2.9,{t:'New seafloor',g:'Open the ocean wider: make 1,000 squares of brand-new seafloor (younger than 10 Myr).',hint:'Speed the two plates apart with Push plate or the speed slider.',scen:'iceland',check:()=>{let n=0;for(let i=0;i<N;i++)if(cr[i]<.5&&age[i]<10&&age[i]<myr()+0.01)n++;return[n>=1000,n/1000,`${n} of 1,000 squares`]},stars:byTime(45,110)});
CC(3.1,{t:'Break up Pangaea',g:'Split the supercontinent into at least 4 continents.',hint:'Speed up time and let the plates pull it apart, or use the Rift tool to cut it.',scen:'pangaea',check:()=>{const c=contCount();return[c>=4,c/4,`${c} continents`]},stars:byTime(60,150)});
CC(3.6,{t:'Seven continents',g:'Have exactly 7 continents at the same time.',hint:'Rift big continents, or let them drift. A continent is land bigger than about 1.8 million km².',scen:'pangaea',check:()=>{const c=contCount();return[c===7,Math.min(c,7)/7,`${c} continents`]},stars:byTime(90,200)});
CC(3.3,{t:'Rift valley',g:'Tear a continent in two with the Rift tool so a new sea opens between the halves.',hint:'Pick Rift and drag a line right across a continent. Then speed up time.',scen:'earth',setup:()=>{CH.ref.c=null},check:()=>{if(RIFTS===0)return[false,0,'Use the Rift tool first'];if(CH.ref.c==null)CH.ref.c=contCount();const c=contCount();return[c>CH.ref.c,0.5,`${c} continents · waiting for a sea to open`]},stars:byTime(60,150)});
CC(4.5,{t:'Supercontinent',g:'Bring the land back together: make one continent that holds 80% of all land.',hint:'Push the continents toward each other with Push plate. Plates collide and weld together.',scen:'earth',check:()=>{const c=(STAT.comps||[]).reduce((a,b)=>b.area>a.area?b:a,{area:0}),tot=(STAT.comps||[]).reduce((s,b)=>s+b.area,0)||1,f=c.area/tot;return[f>=.8,f/.8,`Biggest continent holds ${Math.round(f*100)}% of the land`]},stars:byTime(150,320)});
// quakes and volcanoes
CC(2.5,{t:'Ring of fire',g:'Have 30 active volcanoes at once.',hint:'Volcanoes grow where seafloor dives under another plate. Turn up Volcanism and speed up time.',scen:'ring',check:()=>{const n=STAT.vol;return[n>=30,n/30,`${n} of 30 active volcanoes`]},stars:byTime(45,110)});
CC(3.2,{t:'The big one',g:'Wait for a natural earthquake of magnitude 8 or more.',hint:'Big quakes strike where plates collide fast. Push plates into each other to build up stress (Earthquakes view).',scen:'ring',check:()=>{const ok=natQ(8);return[ok,ok?1:0,ok?'A great earthquake!':`Biggest so far: M${Math.max(0,...CH.events.filter(e=>e.k==='quake'&&e.nat).map(e=>e.m)).toFixed(1)}`]},stars:byTime(60,150)});
CC(2.7,{t:'Tsunami',g:'Cause an undersea earthquake big enough to send out a tsunami.',hint:'Use the Quake tool at magnitude 8 or more, out at sea.',scen:'ring',check:()=>{const ok=evN('tsunami')>0;return[ok,ok?1:0,'']},stars:byTime(20,60)});
CC(3.0,{t:'Supervolcano',g:'Set off a supervolcano and watch the planet cool by 4 °C.',hint:'World tab → 🌋 Supervolcano. The ash takes a moment to spread.',scen:'earth',setup:()=>{CH.ref.t=STAT.avgT},check:()=>{const d=CH.ref.t-STAT.avgT;return[d>=4,clamp(d/4,0,1),`${d.toFixed(1)} °C cooler`]},stars:byTime(25,60)});
// climate and ice
CC(2.2,{t:'Snowball Earth',g:'Freeze the planet until ice covers 70% of it, then thaw it back below 15%.',hint:'World tab → ❄ Snowball Earth. Press it again to stop, or raise the temperature.',scen:'earth',setup:()=>{CH.ref.f=false},check:()=>{if(STAT.ice>=.7)CH.ref.f=true;const ok=CH.ref.f&&STAT.ice<.15;return[ok,CH.ref.f?0.5+0.5*clamp((0.7-STAT.ice)/0.55,0,1):STAT.ice/1.4,`Ice ${Math.round(STAT.ice*100)}%${CH.ref.f?' · now thaw it':''}`]},stars:byTime(45,110)});
CC(2.3,{t:'Drowned world',g:'Flood the planet until less than 8% is land.',hint:'Raise the sea level, or melt the ice with Hothouse.',scen:'earth',check:()=>{const l=STAT.land;return[l<.08,clamp((0.3-l)/0.22,0,1),`${Math.round(l*100)}% land`]},stars:byTime(25,60)});
CC(3.5,{t:'Ice age',g:'Cover 40% of the land in ice sheets without the Snowball event.',hint:'Lower the global temperature. High mountains near the poles freeze first.',scen:'earth',check:()=>{const f=STAT.landIce,ok=f>=.4&&!EVT.snowball;return[ok,f/.4,`${Math.round(f*100)}% of land under ice${EVT.snowball?' · switch Snowball off':''}`]},stars:byTime(30,80)});
CC(3.8,{t:'Wear it down',g:'The collision has stopped. Erode the highest mountain below 2,500 m.',hint:'Turn Erosion right up and speed up time.',scen:'collide',setup:()=>{for(const p of PL){p.vx=p.vy=0}for(let i=0;i<N;i++)if(cr[i]>.5&&Math.abs(wdx(cxOf(i)-195))<16&&cyOf(i)>70&&cyOf(i)<120)h[i]=Math.max(h[i],4500+Math.random()*3500)},check:()=>{const p=STAT.peak;return[p<2500,clamp((8000-p)/5500,0,1),`Highest ${fmtN(Math.round(p))} m`]},stars:byTime(40,100)});
// building
CC(4.0,{t:'Grow a continent',g:'On the young planet, grow the continental crust by 1,000 squares without painting it.',hint:'Island arcs slowly turn into continental crust where plates collide. Push plates together and let tens of millions of years pass.',scen:'young',setup:()=>{CH.ref.c=STAT.contCells;CH.ref.r=RAISED},check:()=>{const n=STAT.contCells-CH.ref.c,ok=n>=1000&&RAISED===CH.ref.r;return[ok,clamp(n/1000,0,1),`${Math.max(0,n)} of 1,000 new squares${RAISED!==CH.ref.r?' · painting does not count':''}`]},stars:byTime(90,200)});
CC(3.7,{t:'Archipelago',g:'Have 15 islands at once.',hint:'Raise the sea level so hills become islands, or build them with hotspots and Raise.',scen:'earth',check:()=>{const n=STAT.isl;return[n>=15,n/15,`${n} of 15 islands`]},stars:byTime(60,150)});
CC(4.2,{t:'Ancient seafloor',g:'Keep some seafloor alive until it is 200 million years old.',hint:'Seafloor is destroyed in trenches. Slow down the plates that dive under others.',scen:'iceland',check:()=>{const o=STAT.old;return[o>=200,o/200,`Oldest seafloor ${Math.round(o)} Myr`]},stars:byTime(80,200)});
CC(4.4,{t:'Steady planet',g:'Keep land between 25% and 35% for 100 million years.',hint:'Watch the sea level and the ice. Big glaciers lower the sea.',scen:'earth',check:()=>{const l=STAT.land,p=hold('s',l>=.25&&l<=.35,100);return[p>=1,p,`${Math.round(l*100)}% land · ${Math.round(p*100)} of 100 Myr`]},stars:byTime(60,150)});

/* tutorial: every feature gets a step */
TSTEPS.push(
 ['Look around','Drag with the mouse (or one finger) to move across the planet. W, A, S and D work too.',r=>CNT.moved>r.m+150,r=>{r.m=CNT.moved}],
 ['Zoom','Scroll (or pinch) to zoom in. Zoom goes toward wherever your pointer is.',r=>CNT.zoomed>r.z+2,r=>{r.z=CNT.zoomed}],
 ['Pause time','Press Space or the ⏸ button to pause.',()=>S.paused],
 ['Speed up','Resume, then press “5 Myr” to run five million years every second.',()=>!S.paused&&S.speed>=5],
 ['Find the highest peak','Type highest in the search bar and press Enter.',()=>S.sel&&Math.abs(h[S.sel.i]-h[STAT.peakI])<300&&Math.abs(wdx(cxOf(S.sel.i)-cxOf(STAT.peakI)))<3],
 ['Inspect the ground','Click anywhere on the planet. The Inspect tab shows the rock, height and the plate underneath.',r=>S.sel&&S.sel.i!==STAT.peakI],
 ['See the plates','In the World tab, switch to the Plates view. Arrows show where each plate is heading; red lines are collisions.',()=>S.view==='plates'],
 ['Plate boundaries','The coloured lines are plate boundaries. Click right on a red line, where two plates collide.',()=>S.sel&&bnd[S.sel.i]===1],
 ['Steer a plate','With some ground selected, drag the Plate speed or Direction slider in the Inspect tab.',r=>PLATEED>r.n,r=>{r.n=PLATEED}],
 ['Push plate','Pick ➡️ Push plate in the toolbar and drag an arrow across a plate.',r=>PUSHES>r.n,r=>{r.n=PUSHES}],
 ['Rift','Pick ✂️ Rift and drag a line right across a plate to tear it in two.',r=>RIFTS>r.n,r=>{r.n=RIFTS}],
 ['Raise land','Pick ⛰️ Raise and paint over the sea to lift new land.',r=>RAISED>r.n,r=>{r.n=RAISED}],
 ['Volcano','Pick 🌋 Volcano and click to start an eruption.',r=>ERUPTS>r.e&&VOL.some(v=>v.kind==='user'),r=>{r.e=ERUPTS}],
 ['Hotspot','Pick 🔥 Hotspot and click on the ocean. As the plate slides over it, a chain of volcanoes forms.',r=>HOTSPOTS>r.n,r=>{r.n=HOTSPOTS}],
 ['Earthquake','Pick 💥 Quake and click. The Brush slider sets the magnitude.',r=>QUAKES>r.q&&QLOG[0]&&!QLOG[0].nat,r=>{r.q=QUAKES}],
 ['Meteor','Pick ☄️ Meteor and click to blast a crater.',r=>METEORS>r.n,r=>{r.n=METEORS}],
 ['Sea level','In the World tab, drag the Sea level slider.',r=>SLIDED>r.n,r=>{r.n=SLIDED}],
 ['Cause an event','Press one of the World tab events, such as ❄ Snowball Earth or ☀ Hothouse.',r=>EVN>r.n,r=>{r.n=EVN}],
 ['Stop the event','Press the same button again (it now says ■ Stop) or ↺ Stop all events.',r=>EVSTOP>r.n,r=>{r.n=EVSTOP}],
 ['The Planet tab','Open the Planet tab to see land, continents, peaks, every plate and recent earthquakes.',r=>(CNT.tab_planet||0)>r.n,r=>{r.n=CNT.tab_planet||0}],
 ['Seafloor age','Switch to the Seafloor age view: red seafloor is brand new, born at mid-ocean ridges.',()=>S.view==='age'],
 ['Other worlds','Press Worlds in the top bar and pick a different planet.',r=>CNT.scen>r.n,r=>{r.n=CNT.scen}],
);

/* demo */
DEMO.push(
 ['earth','Drifting plates','The surface is cracked into plates that drift a few centimetres a year. Over millions of years, whole oceans open and close.',()=>{setSpeed(3);setView('plates')}],
 ['collide','Continents collide','A small continent ploughs into a big one. The crust crumples and a mountain range rises, like the Himalaya.',()=>{setSpeed(3);flyToW(190,95,4)}],
 ['hawaii','Island chain','The ocean plate slides over a fixed hotspot. Each new volcano is carried away, leaving a trail of islands like Hawaii.',()=>{setSpeed(3);flyToW(190,100,4)}],
 ['ring','Ring of Fire','Where seafloor dives under another plate, deep trenches form and volcanoes and earthquakes ring the ocean.',()=>{setSpeed(2);setView('quake')}],
 ['pangaea','Supercontinent breakup','One giant continent splits apart. New oceans open between the pieces.',()=>{setSpeed(4);setView('plates')}],
 ['iceland','A new ocean','At a mid-ocean ridge, fresh seafloor is born and spreads outward. Red is the youngest rock.',()=>{setSpeed(3);setView('age')}],
 ['earth','Snowball Earth','Turn the temperature down far enough and ice spreads from the poles until the planet freezes over.',()=>{setSpeed(3);doEvent('snowball')}],
);
