/* ================= Contrail: autopilot for the home screen and demo, challenges, tutorial ================= */
// autopilot: line each plane up with a fitting runway end (or helipad) and send it in
function autoPilot(){for(const p of PL){if(p.state!=='fly'||p.path.length||p.hold)continue;let best=null,bd=1e9;
    if(p.type==='heli')for(const pad of PADS){const d=Math.hypot(pad.x-p.x,pad.y-p.y);if(d<bd){bd=d;best=[[pad.x,pad.y]]}}
    for(const r of RW){if(!fits(p.type,r))continue;for(const [tx,ty,ex,ey] of [[r.x1,r.y1,r.x2,r.y2],[r.x2,r.y2,r.x1,r.y1]]){const a=Math.atan2(ey-ty,ex-tx),fx=tx-Math.cos(a)*9,fy=ty-Math.sin(a)*9,d=Math.hypot(fx-p.x,fy-p.y);if(d<bd){bd=d;best=[[fx,fy],[tx-Math.cos(a)*4,ty-Math.sin(a)*4],[tx,ty]]}}}
    if(best)p.path=best}}
{const l0=SIM.load;SIM.load=function(id){const show=!$('home').hidden||document.body.classList.contains('mDemo');if(show)MODE='classic';l0.call(this,id);if(show){G.relaxed=true;G.auto=true;for(let k=0;k<6;k++)spawnArrival()}else G.auto=false}}
{const s0=SIM.step;SIM.step=function(dt){s0.call(this,dt);if(G.auto)autoPilot()}}
const landed=t=>CH.events.filter(e=>e.k==='land'&&(!t||e.type===t)).length,sname=id=>SCENLIST.find(s=>s.id===id).name;
const landCh=(t,d,n,sc,hint)=>CC(d,{t,g:`Land ${fmtN(n)} planes at ${sname(sc)} without a crash.`,hint:hint||'Draw each path out past the runway end, then turn in so the plane flies straight down the runway.',scen:sc,setup:()=>{G.relaxed=false},check:()=>{const n2=landed();return[n2>=n,n2/n,`${n2} of ${n} landed`]},fail:()=>G.over?'Two planes collided':'',stars:byTime(n*5+30,n*9+90)});
CC(1,{t:'First landing',g:'Land one plane.',hint:'Pick ✏️ Flight path and drag from a plane towards the end of a runway: the path locks on.',scen:'regional',check:()=>[landed()>=1,landed()>=1?1:0,''],stars:byTime(30,80)});
CC(1.1,{t:'Busy skies',g:'Land 10 planes.',hint:'Yellow runways take small props, blue runways take everything.',scen:'regional',setup:()=>{G.relaxed=false},check:()=>[landed()>=10,landed()/10,`${landed()} of 10`],fail:()=>G.over?'Two planes collided':'',stars:byTime(90,200)});
CC(1.05,{t:'Lock on',g:'Lock 5 planes onto runways.',hint:'Drag from a plane towards a runway end: the path snaps on when you get close.',scen:'regional',check:()=>{const n=evN('lock');return[n>=5,n/5,`${n} of 5`]},stars:byTime(40,100)});
CC(1.2,{t:'Holding pattern',g:'Put a plane into a holding circle.',hint:'Pick 🔁 Hold and click a plane.',scen:'regional',check:()=>[evN('hold')>0,evN('hold')>0?1:0,''],stars:byTime(15,40)});
CC(1.3,{t:'New runway',g:'Build a runway of your own and land a plane on it.',hint:'Pick 🛬 Runway and drag at least 11 km for a long one. Then guide a plane onto it.',scen:'regional',setup:()=>{G.runways=1},check:()=>{const r=RW.slice(2).find(r=>r.landed>0);return[!!r,RW.length>2?(r?1:0.5):0,RW.length>2?(r?'':'Now land on it'):'Build a runway']},stars:byTime(60,150)});
CC(1.4,{t:'Chopper',g:'Build a helipad and land 3 helicopters.',hint:'Pick 🚁 Helipad and click. Helicopters start arriving; draw them to the H.',scen:'regional',setup:()=>{G.pads=1;G.heli=true;spawnArrival('heli')},check:()=>{const n=landed('heli');return[n>=3,n/3,`${n} of 3`]},stars:byTime(90,200)});
CC(1.5,{t:'Departures board',g:'See 10 planes take off.',hint:'Planes you land get refuelled and take off again. Keep the runway ends clear.',scen:'regional',check:()=>[G.departed>=10,G.departed/10,`${G.departed} of 10`],fail:()=>G.over?'Two planes collided':'',stars:byTime(150,300)});
landCh('Rush hour',2,30,'regional');landCh('Hub controller',2.6,50,'hub','Use the two parallel runways for jets and the short one for props.');landCh('Island hopper',3,40,'islands','The two islands are far apart: send each plane to the closer airport.');landCh('Mountain flying',3.2,25,'mountain','Only one short runway: jets cannot land here. Send them round, or build a long runway.');
CC(2.4,{t:'Survive 5 weeks',g:'Keep the skies safe until week 6.',hint:'Each week brings an upgrade. Hold planes when the runways are busy.',scen:'regional',setup:()=>{G.relaxed=false},check:()=>[G.week>=6,(G.week-1)/5,`Week ${G.week}`],fail:()=>G.over?'Two planes collided':'',stars:byTime(330,480)});
CC(2.8,{t:'Jumbo',g:'Land 5 jumbo jets.',hint:'Jumbos are slow to turn: start lining them up early.',scen:'hub',setup:()=>{G.relaxed=false;for(let k=0;k<2;k++)spawnArrival('jumbo')},check:()=>{const n=landed('jumbo');return[n>=5,n/5,`${n} of 5`]},fail:()=>G.over?'Two planes collided':'',stars:byTime(150,320)});
CC(3.4,{t:'Twin fields',g:'Land 15 planes at each airport.',hint:'Split the traffic: planes from the north to North Field, from the south to South Field.',scen:'twin',setup:()=>{G.relaxed=false},check:()=>{const a=CH.events.filter(e=>e.k==='land'&&e.ap===0).length,b=CH.events.filter(e=>e.k==='land'&&e.ap===1).length;return[a>=15&&b>=15,(Math.min(a,15)+Math.min(b,15))/30,`North ${a} · South ${b}`]},fail:()=>G.over?'Two planes collided':'',stars:byTime(200,420)});
CC(3.6,{t:'Storm front',g:'Land 25 planes while storms drift through.',hint:'Planes crawl inside storm cells. Route them round.',scen:'hub',setup:()=>{G.relaxed=false;G.storm=true},check:()=>[landed()>=25,landed()/25,`${landed()} of 25`],fail:()=>G.over?'Two planes collided':'',stars:byTime(200,400)});
CC(4,{t:'Tower legend',g:'Land 150 planes at Grand Central without a crash.',hint:'Hold planes when it gets busy, and keep departures in mind.',scen:'hub',setup:()=>{G.relaxed=false},check:()=>[landed()>=150,landed()/150,`${landed()} of 150`],fail:()=>G.over?'Two planes collided':'',stars:byTime(700,1200)});
TSTEPS.push(
 ['Look around','Right-drag (or two fingers) to move around the sky. Scroll or pinch to zoom.',r=>CNT.moved+CNT.zoomed*50>r.m+150,r=>{r.m=CNT.moved+CNT.zoomed*50}],
 ['Draw a flight path','With ✏️ Flight path, drag from a plane to somewhere else. It follows your line.',r=>ROUTED>r.n,r=>{r.n=ROUTED}],
 ['Lock on','Drag a path towards the end of a runway. When you get close it locks on with a ring and the plane lines itself up. Yellow runways are short (props only); blue are long.',r=>LOCKS>r.n,r=>{r.n=LOCKS}],
 ['Land a plane','Watch the locked-on plane land.',r=>G.landed>r.n,r=>{r.n=G.landed}],
 ['Hold','Pick 🔁 Hold and click a plane: it circles until you draw it a new path.',r=>HOLDS>r.n,r=>{r.n=HOLDS}],
 ['Keep apart','When two planes get close a red ring flashes and an alarm beeps. If they touch, they crash. Land 3 more.',r=>G.landed>=r.n+3,r=>{r.n=G.landed}],
 ['Build a runway','Pick 🛬 Runway and drag. 11 km or more makes a long runway.',r=>RWADD>r.n,r=>{r.n=RWADD;G.runways=Math.max(G.runways,1)}],
 ['Helipad','Pick 🚁 Helipad and click. Helicopters start arriving.',r=>PADADD>r.n,r=>{r.n=PADADD;G.pads=Math.max(G.pads,1)}],
 ['Radar','Switch to the Radar view in the Tower tab.',()=>S.view==='radar'],
 ['Weather','Press ⛈ Storms in the Tower tab.',()=>G.storm],
 ['Other airports','Press Airports in the top bar and pick another one.',r=>CNT.scen>r.n,r=>{r.n=CNT.scen}],
);
DEMO.push(
 ['hub','Grand Central','Arrivals line up with the runways, land, refuel and take off again.',()=>{setSpeed(2)}],
 ['islands','Island hopper','Two airports, one ocean.',()=>{setSpeed(2)}],
 ['twin','Twin fields at night','Two airports share one busy sky.',()=>{setSpeed(2);setView('night')}],
 ['regional','Radar','How the tower sees it.',()=>{setSpeed(2);setView('radar')}],
);
