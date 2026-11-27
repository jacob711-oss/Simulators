/* ================= Hivemind: challenges, tutorial, demo ================= */
const gat=()=>G.gathered,sc=id=>SCENLIST.find(s=>s.id===id).name;
CC(1,{t:'First harvest',g:'Bring 20 food back to the nest.',hint:'Just watch: scouts wander until one finds food, then the trail builds up. Paint 🍯 Food near the nest to speed it up.',scen:'meadow',check:()=>[gat()>=20,gat()/20,`${Math.round(gat())} of 20`],stars:byTime(30,80)});
CC(1.1,{t:'Growing up',g:'Grow the colony to 120 ants.',hint:'Every 1.5 food makes a new ant. Food close to the nest is gathered fastest.',scen:'meadow',check:()=>[ANTS.length>=120,ANTS.length/120,`${ANTS.length} of 120`],stars:byTime(60,150)});
CC(1.2,{t:'Desert relief',g:'Gather 40 food in the desert.',hint:'The food here is far away. Paint some closer to the nest with 🍯 Food.',scen:'desert',check:()=>[gat()>=40,gat()/40,`${Math.round(gat())} of 40`],stars:byTime(50,130)});
CC(1.3,{t:'Maze runner',g:'Gather 30 food in the maze.',hint:'Be patient, or use 🧽 Erase to open a short cut through a wall.',scen:'maze',check:()=>[gat()>=30,gat()/30,`${Math.round(gat())} of 30`],stars:byTime(90,220)});
CC(1.4,{t:'Roadblock',g:'Build a wall across a busy trail, then gather 30 more food.',hint:'Paint 🪨 Wall over a trail. The ants find a way round.',scen:'meadow',setup:()=>{for(let k=0;k<60;k++)spawnAnt(NESTS[0])},check:()=>{const w=evN('wall')>0;if(!w)CH.ref.g0=gat();const d=w?gat()-(CH.ref.g0||0):0;return[w&&d>=30,w?0.2+0.8*d/30:0,w?`${Math.round(d)} of 30 since the wall`:'Build a wall first']},stars:byTime(60,150)});
CC(1.5,{t:'Lost and found',g:'Spray away the trails, then gather 25 more food.',hint:'💨 Spray wipes scent. The colony must find the food again.',scen:'meadow',setup:()=>{for(let k=0;k<60;k++)spawnAnt(NESTS[0])},check:()=>{const w=evN('spray')>0;if(!w)CH.ref.g0=gat();const d=w?gat()-(CH.ref.g0||0):0;return[w&&d>=25,w?0.2+0.8*d/25:0,w?`${Math.round(d)} of 25 since spraying`:'Spray a trail first']},stars:byTime(60,150)});
CC(2,{t:'New queen',g:'Found a second colony and grow it to 60 ants.',hint:'Pick 🏠 New nest and click near food.',scen:'meadow',check:()=>{const n=NESTS.find(q=>q.c!==0);const k=n?antsOf(n.c):0;return[k>=60,n?0.2+0.8*k/60:0,n?`${k} of 60`:'Found a nest first']},stars:byTime(90,220)});
CC(2.4,{t:'Turf war',g:'Make the Ember colony twice the size of Azure.',hint:'Put food near Ember and walls round Azure, or spray Azure’s trails.',scen:'rivals',check:()=>{const a=antsOf(0),b=Math.max(1,antsOf(1));return[a>=2*b&&a>=40,Math.min(1,a/(2*b)),`Ember ${a} · Azure ${antsOf(1)}`]},stars:byTime(90,240)});
CC(2.8,{t:'Three kingdoms',g:'Have all three garden colonies reach 80 ants at once.',hint:'Give every colony food of its own, far from the others.',scen:'garden',check:()=>{const m=Math.min(antsOf(0),antsOf(1),antsOf(2));return[m>=80,m/80,`Smallest colony: ${m} of 80`]},stars:byTime(120,300)});
CC(3,{t:'Rainy season',g:'Gather 60 food while it rains.',hint:'Rain washes scent away fast. Food close to the nest helps.',scen:'meadow',setup:()=>{G.rain=true},check:()=>[gat()>=60&&G.rain,G.rain?gat()/60:0,G.rain?`${Math.round(gat())} of 60`:'Keep the rain on'],stars:byTime(90,220)});
CC(3.4,{t:'Megacolony',g:'Grow one colony to 600 ants.',hint:'Lots of food near the nest, and a strong scent.',scen:'meadow',check:()=>{const n=Math.max(...CIDX.map(antsOf));return[n>=600,n/600,`${n} of 600`]},stars:byTime(200,450)});
CC(3.8,{t:'Warlord',g:'See 150 ants fall in battle.',hint:'Two colonies sharing one feast fight a lot.',scen:'rivals',check:()=>[G.kills>=150,G.kills/150,`${G.kills} of 150`],stars:byTime(120,300)});
CC(3.3,{t:'Last kingdom standing',g:'In Ten kingdoms, be the last of the ten colonies still standing. You play Ember.',hint:'Raid the weakest neighbours first, wall off food from the others, and spray rival trails.',scen:'kingdoms',setup:()=>{G.raids=true},check:()=>{const alive=CIDX.filter(k=>NESTS.some(n=>n.c===k)).length,me=NESTS.some(n=>n.c===0);return[me&&alive===1,me?(10-alive)/9:0,me?`${alive} colonies left`:'Ember has fallen']},fail:()=>NESTS.some(n=>n.c===0)?'':'The Ember colony fell',stars:byTime(400,900)});
CC(1.6,{t:'Busy neighbourhood',g:'Have 5 colonies living at the same time.',hint:'Set Number of colonies in the Colony tab, or pick 🏠 New nest and found colonies near food. You can have up to 10.',scen:'meadow',check:()=>{const n=CIDX.filter(k=>antsOf(k)>0).length;return[n>=5,n/5,`${n} of 5 colonies`]},stars:byTime(60,150)});
CC(2.2,{t:'Raid party',g:'Raid the Azure nest and steal 10 food.',hint:'Pick ⚔️ Raid, tap the Ember nest, then tap the Azure nest. The war party needs at least 15 ants at home.',scen:'rivals',setup:()=>{for(let k=0;k<30;k++)spawnAnt(NESTS[0]);NESTS[1].store+=20},check:()=>{const n=CH.events.filter(e=>e.k==='steal').length;return[n>=10,n/10,`${n} of 10 stolen`]},stars:byTime(40,100)});
CC(3.2,{t:'Plunder',g:'Steal 60 food from rival nests in the garden.',hint:'Raid the nests with full larders. Raiders fight harder than defenders.',scen:'garden',setup:()=>{for(const n of NESTS)n.store+=15},check:()=>{const n=CH.events.filter(e=>e.k==='steal').length;return[n>=60,n/60,`${n} of 60 stolen`]},stars:byTime(120,300)});
CC(3.9,{t:'Conquest',g:'Make a rival colony fall.',hint:'Raid it again and again, spray its trails and wall off its food. A nest with no ants and an empty larder falls.',scen:'rivals',check:()=>[evN('fall')>0,evN('fall')>0?1:Math.max(0,1-antsOf(1)/80)*0.9,`Azure ants left: ${antsOf(1)}`],stars:byTime(200,450)});
TSTEPS.push(
 ['Look around','Right-drag (or two fingers) to move. Scroll or pinch to zoom in on the ants.',r=>CNT.moved+CNT.zoomed*50>r.m+150,r=>{r.m=CNT.moved+CNT.zoomed*50}],
 ['Add food','With 🍯 Food, paint a little food near the nest.',r=>FOODADD>r.n+5,r=>{r.n=FOODADD}],
 ['A trail forms','Watch. When an ant finds food it carries it home, leaving food scent. Others follow. Wait for 10 food to come home.',r=>G.gathered>=r.g+10,r=>{r.g=G.gathered}],
 ['Scent trails','Switch to the Scent trails view in the Colony tab.',()=>S.view==='trails'],
 ['Walls','Pick 🪨 Wall and paint a rock across a trail.',r=>WALLADD>r.n,r=>{r.n=WALLADD}],
 ['Spray','Pick 💨 Spray and wipe a trail away.',r=>SPRAYED>r.n,r=>{r.n=SPRAYED}],
 ['Erase','Pick 🧽 Erase and remove some rock or food.',r=>ERASED>r.n,r=>{r.n=ERASED}],
 ['A new colony','Pick 🏠 New nest and click somewhere to found a rival colony. You can have up to 10 colonies, each with its own colour and its own scent trails. Or set Number of colonies in the Colony tab to jump straight to 1–10.',r=>NESTADD>r.n,r=>{r.n=NESTADD}],
 ['Raids','Pick ⚔️ Raid, tap one nest, then tap the other. A war party marches off to steal food.',r=>RAIDS>r.n,r=>{r.n=RAIDS;if(NESTS.length<2)addNest(Math.max(10,Math.min(150,NESTS[0].x+60)),NESTS[0].y,null,30);for(let k=0;k<20;k++)spawnAnt(NESTS[0])}],
 ['Follow an ant','Click an ant, then press Follow (or double-click it).',()=>S.follow&&S.sel&&S.sel.a],
 ['Weather','Press 🌧 Rain in the Colony tab.',()=>G.rain],
 ['Speed up','Press 4× next to the time.',()=>!S.paused&&S.speed>=4],
 ['Other worlds','Press Worlds in the top bar and pick another world.',r=>CNT.scen>r.n,r=>{r.n=CNT.scen}],
);
DEMO.push(
 ['meadow','The meadow','Scouts wander at random. Once one finds food, a scent trail grows into a highway.',()=>{setSpeed(2);for(let k=0;k<80;k++)spawnAnt(NESTS[0])}],
 ['maze','The maze','No ant knows the way, yet together they solve the maze.',()=>{setSpeed(4);setView('trails')}],
 ['rivals','Rivals','Two colonies race for the same food, and raid each other’s nests.',()=>{setSpeed(2);G.raids=true;G.raidT=3;for(let k=0;k<40;k++){spawnAnt(NESTS[0]);spawnAnt(NESTS[1])}}],
 ['kingdoms','Ten kingdoms','Ten colonies, one in every colour, race for the food and raid each other.',()=>{setSpeed(2);G.raids=true;G.raidT=3;setView('night')}],
 ['garden','The garden at night','Three colonies glow in the dark.',()=>{setSpeed(2);setView('night')}],
);
