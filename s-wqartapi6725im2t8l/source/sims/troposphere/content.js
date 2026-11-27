/* ================= Troposphere: challenges, tutorial, demo ================= */
const bestCat=()=>Math.max(0,...CH.events.filter(e=>e.k==='cat').map(e=>e.c));
const landCellsWhere=f=>{let n=0;for(let i=0;i<N;i++)if(!isOcean(i)&&f(i))n++;return n};
const nearEq=i=>Math.abs(latOf(cyOf(i)))<=10;
// getting started
CC(1,{t:'Storm watch',g:'Find a hurricane and select it.',hint:'Type hurricane in the search bar and press Enter.',scen:'hurricane',setup:()=>{if(!STORMS.length){const s=addStorm(150,42,975);s.name='Ava'}},check:()=>{const ok=S.sel&&S.sel.storm;return[ok,ok?1:0,ok?'Tracking '+S.sel.storm.name:'Not found yet']},stars:byTime(20,45)});
CC(1.1,{t:'Fast forward',g:'Run time at 1 week per second.',hint:'Press “1 wk” next to the pause button.',scen:'earth',check:()=>{const ok=!S.paused&&S.speed>=7;return[ok,ok?1:0,'']},stars:byTime(10,30)});
CC(1.2,{t:'Day and night',g:'Slow time to 1 hour per second and watch night fall somewhere.',hint:'Press “1 hr”. The dark band is night moving across the planet.',scen:'earth',check:()=>{const ok=!S.paused&&S.speed<=1/24+1e-6;return[ok,ok?1:0,'']},stars:byTime(15,40)});
CC(1.3,{t:'Read the winds',g:'Switch to the Wind view and find a place with winds over 60 km/h.',hint:'World tab → Views → Wind. Then click on bright yellow or orange streaks.',scen:'earth',check:()=>{const w=S.sel&&S.sel.i!=null?Math.hypot(u[S.sel.i],v[S.sel.i])*3.6:0,ok=S.view==='wind'&&w>=60;return[ok,(S.view==='wind'?.5:0)+Math.min(.5,w/120),S.view!=='wind'?'Turn on the Wind view':`Selected: ${Math.round(w)} km/h`]},stars:byTime(30,70)});
CC(1.4,{t:'Thunderstorm',g:'Watch 30 lightning strikes.',hint:'Lightning flashes in heavy, warm rain. Use the Lightning tool, or Moisten warm land and wait.',scen:'earth',check:()=>{const n=evN('lightning');return[n>=30,n/30,`${Math.min(n,30)} of 30 strikes`]},stars:byTime(25,60)});
CC(1.5,{t:'Twister',g:'Touch down 3 tornadoes.',hint:'Pick Tornado and click on land.',scen:'tornado',check:()=>{const n=evN('tornado');return[n>=3,n/3,`${Math.min(n,3)} of 3 tornadoes`]},stars:byTime(15,40)});
CC(1.6,{t:'Make it rain',g:'Make it rain on 25 squares of desert at once.',hint:'Pick Moisten and paint over a desert (sandy yellow land). Then add a Low for lift.',scen:'desert',check:()=>{const n=landCellsWhere(i=>ravg[i]<0.15&&rn[i]>0.3);return[n>=25,n/25,`${n} of 25 desert squares getting rain`]},stars:byTime(30,70)});
CC(1.7,{t:'Spin it up',g:'Start a hurricane yourself and grow it to category 1.',hint:'Pick Hurricane and click on deep blue warm sea between 8° and 20° from the equator.',scen:'hurricane',check:()=>{const ok=CH.events.some(e=>e.k==='cat'&&e.user&&e.c>=1);return[ok,ok?1:USERSTORM?.4:0,ok?'A hurricane is born':'']},stars:byTime(30,70)});
CC(1.8,{t:'Highs and lows',g:'Make one low and one high pressure system.',hint:'Pick Low and click, then pick High and click.',scen:'earth',check:()=>{const l=CH.events.some(e=>e.k==='press'&&e.t==='low'),h2=CH.events.some(e=>e.k==='press'&&e.t==='high');return[l&&h2,(l?.5:0)+(h2?.5:0),'']},stars:byTime(15,40)});
CC(1.9,{t:'Greenhouse',g:'Double the carbon dioxide and warm the planet by 1.5 °C.',hint:'World tab → Carbon dioxide slider. Then let time run: the oceans take a while to warm.',scen:'earth',setup:()=>{CH.ref.t=STAT.avgT},check:()=>{const d=STAT.avgT-CH.ref.t;return[d>=1.5,clamp(d/1.5,0,1),`${d>=0?'+':''}${d.toFixed(2)} °C`]},stars:byTime(30,80)});
// storms
CC(1.65,{t:'Turn the wind',g:'Make the wind blow toward the west somewhere in the stormy westerlies (40°–60° from the equator), at over 40 km/h.',hint:'Pick 🧭 Steer and drag a long arrow pointing left across the middle latitudes. Then click there to check.',scen:'earth',check:()=>{const i=S.sel&&S.sel.i!=null?S.sel.i:-1,la=i>=0?Math.abs(latOf(cyOf(i))):0,ok=i>=0&&la>=40&&la<=60&&u[i]<0&&Math.hypot(u[i],v[i])*3.6>40;return[ok,STEERED?0.5:0,ok?'The wind has turned!':STEERED?'Click on the place you pushed to check it':'Push the wind with Steer first']},stars:byTime(30,70)});
CC(2.1,{t:'Change course',g:'Steer a hurricane so it travels east for at least 2 days.',hint:'Pick 🧭 Steer and drag from the storm toward the east (right), or select it and use the Steer it slider.',scen:'hurricane',setup:()=>{if(!STORMS.length){const s=addStorm(150,42,980);s.name='Ava'}CH.ref.x={}},check:()=>{let best=0;for(const s of STORMS){if(s.steer&&s.steerT>0&&s.steer.u>2){CH.ref.x[s.id]=CH.ref.x[s.id]??S.t;best=Math.max(best,S.t-CH.ref.x[s.id])}else delete CH.ref.x[s.id]}return[best>=2,best/2,best?`Heading east for ${best.toFixed(1)} of 2 days`:'Steer a storm east']},stars:byTime(30,70)});
CC(2.6,{t:'Category 5',g:'Grow a hurricane to category 5 (winds over 252 km/h).',hint:'Hurricanes strengthen over very warm water. Raise the Ocean warmth slider, or Heat the sea in the storm’s path.',scen:'hurricane',check:()=>{const c=bestCat();return[c>=5,c/5,`Strongest so far: ${c?'category '+c:'none'}`]},stars:byTime(45,110)});
CC(2.2,{t:'Landfall',g:'Have a category 3 or stronger hurricane hit land.',hint:'Storms drift west and then curve toward the poles. Start one near a coast, or steer it with highs and lows.',scen:'hurricane',check:()=>{const ok=CH.events.some(e=>e.k==='landfall'&&e.c>=3);return[ok,ok?1:0,ok?'Landfall!':`Landfalls so far: ${evN('landfall')}`]},stars:byTime(45,110)});
CC(3.2,{t:'Save the coast',g:'A category 4 hurricane is heading for land. Weaken it below category 1 before it hits.',hint:'Cool the sea in front of it with the Cool tool, steer it with a High, or select it and press Weaken.',scen:'hurricane',
  setup:()=>{STORMS=[];let best=null;for(let k=0;k<400;k++){const x=Math.random()*GW,y=(90-rr(14,20))/180*GH,i=idx(x,y);if(!isOcean(i))continue;let land=false;for(let d=4;d<=12;d++)if(!isOcean(idx(x-d,y-d*0.3))){land=true;break}if(land){best=[x,y];break}}const [x,y]=best||[150,40];const s=addStorm(x,y,935);s.name='Greta';s.peak=4;CH.ref.s=s},
  check:()=>{const s=CH.ref.s,alive=STORMS.includes(s),c=alive?catOf(s):0;return[!alive||c===0,alive?1-c/4:1,alive?`${s.name}: ${c?'category '+c:'tropical storm'}`:`${s.name} has faded away`]},fail:()=>CH.events.some(e=>e.k==='landfall'&&e.name==='Greta'&&e.c>=1)?'Greta made landfall as a hurricane':'',stars:byTime(40,100)});
CC(2.9,{t:'Three at once',g:'Have 3 hurricanes (category 1 or more) at the same time.',hint:'Press 🌀 Hurricane season, warm the oceans, or start them yourself.',scen:'hurricane',check:()=>{const n=STAT.storms;return[n>=3,n/3,`${n} of 3 hurricanes`]},stars:byTime(40,100)});
CC(2.4,{t:'Tornado alley',g:'Have 6 tornadoes touch down by themselves.',hint:'Tornadoes need warm, wet air, strong winds and thunderstorms over land. Try 🌪 Tornado outbreak, or Moisten and Heat the plains.',scen:'tornado',check:()=>{const n=CH.events.filter(e=>e.k==='tornado'&&!e.user).length;return[n>=6,n/6,`${n} of 6 tornadoes`]},stars:byTime(45,110)});
CC(3.4,{t:'EF5',g:'See a violent EF5 tornado.',hint:'The strongest tornadoes are rare. Start lots of them, or trigger a tornado outbreak and wait.',scen:'tornado',check:()=>{const m=Math.max(-1,...CH.events.filter(e=>e.k==='tornado').map(e=>e.ef));return[m>=5,Math.max(0,m)/5,m<0?'No tornadoes yet':`Strongest: EF${m}`]},stars:byTime(45,120)});
CC(2.7,{t:'Deep low',g:'Make a storm with central pressure below 950 hPa.',hint:'Hurricanes have the lowest pressures. Grow one over warm water.',scen:'hurricane',check:()=>{const p=Math.min(1013,...STORMS.map(s=>s.pc));return[p<950,clamp((1010-p)/60,0,1),`Lowest now: ${Math.round(p)} hPa`]},stars:byTime(40,100)});
CC(2.3,{t:'Big high',g:'Build a high-pressure system above 1045 hPa.',hint:'Stack several Highs in one place, or cool a cold continent further.',scen:'earth',check:()=>{const p=STAT.maxP||0;return[p>=1045,clamp((p-1013)/32,0,1),`Highest now: ${Math.round(p)} hPa`]},stars:byTime(30,80)});
// temperature records
CC(2.1,{t:'Scorcher',g:'Make somewhere reach 55 °C.',hint:'Deserts in summer get hottest. Use ☀ Heat wave or the Heat tool on dry land.',scen:'desert',check:()=>{let m=-99;for(let i=0;i<N;i++)if(T[i]>m)m=T[i];return[m>=55,clamp(m/55,0,1),`Hottest now: ${m.toFixed(1)} °C`]},stars:byTime(30,80)});
CC(2.5,{t:'Big chill',g:'Make somewhere reach −70 °C.',hint:'Polar winter nights get coldest. Try ❄ Polar vortex or the Cool tool on an ice sheet.',scen:'iceage',check:()=>{let m=99;for(let i=0;i<N;i++)if(T[i]<m)m=T[i];return[m<=-70,clamp(-m/70,0,1),`Coldest now: ${m.toFixed(1)} °C`]},stars:byTime(30,80)});
CC(3.0,{t:'Snow on the equator',g:'Get snow lying on land within 10° of the equator.',hint:'High mountains near the equator are coldest. Raise a big Mountain there and Cool it, or chill the whole planet.',scen:'earth',check:()=>{const n=landCellsWhere(i=>nearEq(i)&&sn[i]>2);return[n>0,n?1:0,n?'Tropical snow!':'No snow near the equator yet']},stars:byTime(45,110)});
CC(2.8,{t:'Snowy world',g:'Cover half of all land with snow.',hint:'Lower the carbon dioxide or the sunlight, and let the winter come.',scen:'earth',check:()=>{const f=STAT.snow;return[f>=.5,f/.5,`${Math.round(f*100)}% of land snowy`]},stars:byTime(40,100)});
// climate
CC(3.3,{t:'Melt the poles',g:'Shrink the sea ice below 2% of the planet.',hint:'Raise carbon dioxide and ocean warmth. Ice takes a while to melt.',scen:'earth',check:()=>{const f=STAT.ice;return[f<.02,clamp((0.12-f)/0.1,0,1),`Sea ice ${(f*100).toFixed(1)}%`]},stars:byTime(45,120)});
CC(3.6,{t:'Ice age',g:'Spread sea ice over 15% of the planet without Volcanic winter.',hint:'Lower carbon dioxide and sunlight. White ice reflects sunlight, so it cools things further.',scen:'earth',check:()=>{const f=STAT.ice,ok=f>=.15&&!EVT.volcano;return[ok,f/.15,`Sea ice ${(f*100).toFixed(1)}%${EVT.volcano?' · stop the volcanic winter':''}`]},stars:byTime(45,120)});
CC(2.9,{t:'Volcanic winter',g:'Trigger a volcanic winter and cool the planet by 2 °C.',hint:'World tab → 🌋 Volcanic winter. Ash blocks the sunlight.',scen:'earth',setup:()=>{CH.ref.t=STAT.avgT},check:()=>{const d=CH.ref.t-STAT.avgT;return[d>=2,clamp(d/2,0,1),`${d.toFixed(2)} °C cooler`]},stars:byTime(30,80)});
CC(3.5,{t:'Steady climate',g:'Carbon dioxide is rising by itself. Keep the average temperature within 0.7 °C of the start for 2 years.',hint:'Push the Carbon dioxide slider back down, dim the sunlight, or brighten the planet with clouds.',scen:'earth',setup:()=>{CH.ref.t=STAT.avgT},
  check:()=>{ENV.co2=Math.min(2000,ENV.co2+(S.paused?0:0.5));$('co2S').value=ENV.co2;$('co2V').textContent=Math.round(ENV.co2)+' ppm';const d=Math.abs(STAT.avgT-CH.ref.t),p=hold('k',d<=0.7,730);return[p>=1,p,`Off by ${d.toFixed(2)} °C · ${Math.round(p*730)} of 730 days`]},stars:byTime(60,150)});
CC(3.1,{t:'Monsoon',g:'Bring heavy rain to 20% of the giant continent at once.',hint:'Monsoon rains come when the land heats up in summer and pulls in wet ocean air. Let summer arrive, or Heat the land.',scen:'monsoon',check:()=>{let n=0,t=0;for(let i=0;i<N;i++){const x=cxOf(i),y=cyOf(i);if(isOcean(i)||Math.abs(wdx(x-140))>55||y<22||y>56)continue;t++;if(rn[i]>0.8)n++}const f=t?n/t:0;return[f>=.2,f/.2,`${Math.round(f*100)}% of the continent in heavy rain`]},stars:byTime(45,110)});
CC(3.8,{t:'Rain shadow',g:'Raise a mountain over 3,000 m and make it rain on its slopes.',hint:'Pick Mountain and paint a ridge near a coast where the wind blows in from the sea. Rising air drops its rain.',scen:'earth',check:()=>{const n=landCellsWhere(i=>elev[i]>3000&&rn[i]>0.6&&RAISEDM>0);return[n>=3,n/3,`${n} of 3 rainy mountain squares`]},stars:byTime(45,110)});
CC(4.0,{t:'Warm the dark side',g:'On the planet with no night, raise the average temperature of the dark side above −15 °C.',hint:'More carbon dioxide traps heat; a faster spin and warm oceans carry heat around the planet.',scen:'locked',check:()=>{let s=0,n=0;for(let i=0;i<N;i++){const lo=lonOf(cxOf(i));if(Math.abs(lo)>100){s+=T[i];n++}}const m=s/n;return[m>-15,clamp((m+45)/30,0,1),`Dark side: ${m.toFixed(1)} °C`]},stars:byTime(45,120)});

/* tutorial */
TSTEPS.push(
 ['Look around','Drag with the mouse (or one finger) to move across the planet. W, A, S and D work too.',r=>CNT.moved>r.m+150,r=>{r.m=CNT.moved}],
 ['Zoom','Scroll (or pinch) to zoom in.',r=>CNT.zoomed>r.z+2,r=>{r.z=CNT.zoomed}],
 ['Pause time','Press Space or the ⏸ button to pause.',()=>S.paused],
 ['Speed up','Resume, then press “1 wk” to run a week every second.',()=>!S.paused&&S.speed>=7],
 ['Day and night','Press “1 hr” and watch the night side move across the planet.',()=>!S.paused&&S.speed<=1/24+1e-6],
 ['Read the weather','Click anywhere. The Inspect tab shows temperature, wind, pressure, humidity and rain there.',()=>S.sel&&S.sel.i!=null],
 ['Wind view','In the World tab, switch to the Wind view. Streaks show where the air is flowing.',()=>S.view==='wind'],
 ['Pressure view','Switch to the Pressure view. Air flows from highs (H) to lows (L), twisted by the planet’s spin.',()=>S.view==='pressure'],
 ['Heat','Pick 🔥 Heat and paint over some land. Warm air rises and pulls in wind.',r=>HEATED>r.n,r=>{r.n=HEATED}],
 ['Cool','Pick 🧊 Cool and paint somewhere.',r=>COOLED>r.n,r=>{r.n=COOLED}],
 ['Moisten','Pick 💧 Moisten and paint water vapour into the air: clouds and rain follow.',r=>WETTED>r.n,r=>{r.n=WETTED}],
 ['Low pressure','Pick 🌀 Low and click to make a low-pressure system. Watch the wind spiral into it.',r=>PRESSED>r.n,r=>{r.n=PRESSED}],
 ['Steer','Pick 🧭 Steer and drag across the map to push the wind that way (or drag from a storm to send it somewhere).',r=>STEERED>r.n,r=>{r.n=STEERED}],
 ['Hurricane','Pick 🌀 Hurricane and click on warm tropical sea to start a storm.',r=>USERSTORM>r.n,r=>{r.n=USERSTORM}],
 ['Tornado','Pick 🌪️ Tornado and click on land.',r=>TORNS>r.n,r=>{r.n=TORNS}],
 ['Lightning','Pick ⚡ Lightning and click.',r=>LIGHT>r.n,r=>{r.n=LIGHT}],
 ['Mountain','Pick ⛰️ Mountain and paint a ridge. Winds blowing up it drop their rain.',r=>RAISEDM>r.n,r=>{r.n=RAISEDM}],
 ['Greenhouse','In the World tab, drag the Carbon dioxide slider.',r=>SLIDED>r.n,r=>{r.n=SLIDED}],
 ['Cause an event','Press one of the events, such as ☀ Heat wave or 🌀 Hurricane season.',r=>EVN>r.n,r=>{r.n=EVN}],
 ['Stop the event','Press the same button again (it now says ■ Stop) or ↺ Stop all events.',r=>EVSTOP>r.n,r=>{r.n=EVSTOP}],
 ['The Climate tab','Open the Climate tab to see the average temperature, ice, storms and records.',r=>(CNT.tab_climate||0)>r.n,r=>{r.n=CNT.tab_climate||0}],
 ['Other worlds','Press Worlds in the top bar and pick a different planet.',r=>CNT.scen>r.n,r=>{r.n=CNT.scen}],
);

/* demo */
DEMO.push(
 ['earth','The winds of the world','Trade winds near the equator, westerlies in the middle latitudes: the planet’s spin twists the air into great swirls.',()=>{setSpeed(2);setView('wind')}],
 ['hurricane','Hurricane','Over warm ocean, a storm feeds on rising moist air and spins up into a hurricane with a calm eye at its heart.',()=>{setSpeed(2);const s=addStorm(150,42,930);s.name='Ava';S.sel={storm:s};S.follow=true;cam.z=6}],
 ['tornado','Tornado alley','Warm, wet air from the south meets cold, dry air from the north over the plains, and twisters touch down.',()=>{setSpeed(1);doEvent('outbreak');flyToW(70,38,4)}],
 ['earth','Day and night','At one hour per second you can watch the night side sweep across the planet, and the land cool after dark.',()=>{setSpeed(0)}],
 ['iceage','Ice age','With little carbon dioxide, ice spreads from the poles. White ice reflects sunlight, so it gets colder still.',()=>{setSpeed(4);setView('temp')}],
 ['monsoon','Monsoon','In summer the giant continent heats up and sucks in wet ocean air, bringing torrential rain.',()=>{setSpeed(3);setView('rain')}],
 ['locked','A planet with no night','One side always faces its sun. Winds carry heat from the scorching day side to the frozen night side.',()=>{setSpeed(2);setView('temp')}],
);
