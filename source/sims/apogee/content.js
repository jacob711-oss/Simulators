/* ================= Apogee: challenges, tutorial, demo ================= */
const sb=parts=>()=>{carNew('sandbox');DESIGN=parts.slice()};
const evAny=f=>CH.events.some(f);
CC(1,{t:'Lift-off',g:'Launch a rocket and fly higher than 1 km.',hint:'Press Launch, then Space to light the engine. Hold W for full throttle.',scen:'sandbox',setup:sb(PRESETS.hopper.parts),check:()=>{const a=R?R.maxAlt:0;return[a>1000,a/1000,`${fmtKm(a)} of 1 km`]},stars:byTime(30,90)});
CC(1.1,{t:'Edge of space',g:'Climb above 60 km, where the air runs out.',hint:'Point straight up (Straight up button) and use full throttle.',scen:'sandbox',setup:sb(PRESETS.hopper.parts),check:()=>{const a=R?R.maxAlt:0;return[a>60000,a/60000,`${fmtKm(a)} of 60 km`]},stars:byTime(90,240)});
CC(1.2,{t:'Safe return',g:'Go above 60 km and land safely back on Terra.',hint:'On the way down, the parachute opens by itself once you are low and slow (press C to arm it).',scen:'sandbox',setup:sb(PRESETS.hopper.parts),check:()=>[mv('returned')>0,mv('returned')?1:R&&R.maxAlt>60000?0.5:0,''],fail:()=>R&&R.dead?'The capsule crashed':'',stars:byTime(240,600)});
CC(1.3,{t:'Rocket designer',g:'Change the rocket by adding a part, then fly it above 10 km.',hint:'In the Rocket tab, press any part to add it. Check the push is more than 1× before you launch.',scen:'sandbox',setup:sb(['chute','pod1','tankS','spark']),check:()=>{const ok=evN('add')>0,a=R?R.maxAlt:0;return[ok&&a>10000,(ok?0.3:0)+Math.min(0.7,a/10000*0.7),ok?`${fmtKm(a)} of 10 km`:'Add a part first']},stars:byTime(90,240)});
CC(2,{t:'Orbit!',g:'Get into orbit around Terra: periapsis (lowest point) above 60 km.',hint:'Use the Orbiter. Lean over towards the right as you climb, then burn sideways at the highest point. Or press Fly to orbit.',scen:'sandbox',setup:sb(PRESETS.orbiter.parts),check:()=>{const o=R&&!R.dead?orbitOf(R,S.t):null;return[mv('orbit0')>0,o?clamp((o.pe+640000)/700000,0,1):0,o?`Periapsis ${fmtKm(o.pe)}`:'']},stars:byTime(400,900)});
CC(2.1,{t:'Hands on',g:'Reach orbit without the autopilot.',hint:'Climb straight up to 10 km, then tilt slowly right. Cut the engine when the apoapsis passes 80 km, coast, then burn forward near the top.',scen:'sandbox',setup:sb(PRESETS.orbiter.parts),check:()=>[mv('orbit0')>0&&!mv('ap_orbit'),mv('orbit0')?1:0,mv('ap_orbit')?'No autopilot this time!':''],stars:byTime(500,1200)});
CC(2.2,{t:'Coming home',g:'Bring the falling capsule down safely.',hint:'Keep the heat shield in front (Backward button). The parachute opens by itself low down.',scen:'reentry',check:()=>[mv('land0')>0,mv('land0')?1:0,''],fail:()=>R&&R.dead?'The capsule did not survive':'',stars:byTime(200,500)});
CC(2.3,{t:'Space scientist',g:'Make a crew report while in space near Terra.',hint:'In orbit, open the Flight tab and press Crew report.',scen:'orbit',check:()=>{const ok=evAny(e=>e.k==='exp'&&e.b===0&&(e.s==='space'||e.s==='farspace'));return[ok,ok?1:0,'']},stars:byTime(30,90)});
CC(2.4,{t:'To the Moon',g:'Reach Luna’s pull.',hint:'Wait until Luna is about 110° ahead (see Plan a burn), then burn forward about +870 m/s. The orange line shows your new path.',scen:'moonready',check:()=>[mv('soi1')>0,mv('soi1')?1:PINFO.enc?0.6:0,PINFO.enc?'You are on your way!':''],stars:byTime(300,900)});
CC(2.5,{t:'Lunar orbit',g:'Get into orbit around Luna.',hint:'When you arrive near Luna, point Backward and burn at the lowest point until your path closes into a loop.',scen:'moonready',check:()=>[mv('orbit1')>0,mv('orbit1')?1:mv('soi1')?0.5:0,''],stars:byTime(600,1500)});
CC(3,{t:'One small step',g:'Land on Luna without crashing (slower than 15 m/s with legs).',hint:'Point Backward and burn to kill your sideways speed, then let gravity pull you down. Burn gently near the ground.',scen:'lunaorbit',check:()=>[mv('land1')>0,mv('land1')?1:0,''],fail:()=>R&&R.dead?'Crashed into Luna':'',stars:byTime(300,800)});
CC(3.1,{t:'Touchdown',g:'Land the falling lander softly on Luna.',hint:'Point Backward (it already is). Wait, then burn hard when you are a few kilometres up. Ease off as you slow down.',scen:'descent',check:()=>[mv('land1')>0,mv('land1')?1:0,''],fail:()=>R&&R.dead?'Crashed into Luna':'',stars:byTime(120,300)});
CC(3.2,{t:'Moon rocks',g:'Land on Luna and take a surface sample.',hint:'After landing, open the Flight tab and press Surface sample.',scen:'descent',check:()=>{const ok=evAny(e=>e.k==='exp'&&e.k2!==1&&e.b===1&&e.s==='landed'&&e.kk!==1)&&evAny(e=>e.k==='exp'&&e.b===1);return[ok&&mv('land1')>0,(mv('land1')?0.5:0)+(ok?0.5:0),'']},fail:()=>R&&R.dead?'Crashed into Luna':'',stars:byTime(180,400)});
CC(3.4,{t:'Escape',g:'Leave Terra’s pull for good.',hint:'From orbit, point Forward and burn about +1,000 m/s. Your path opens up and never comes back.',scen:'orbit',check:()=>[mv('escape')>0,mv('escape')?1:0,''],stars:byTime(400,1200)});
CC(3.6,{t:'Space agency',g:'In your space agency, complete 2 missions in one go.',hint:'Start with the Hopper: First launch and Touch space are close together. Science from flights unlocks bigger parts.',scen:'pad',check:()=>{const n=evN('mission');return[n>=2,n/2,`${n} of 2 missions`]},stars:byTime(400,900)});
TSTEPS.push(
 ['Look around','Drag (or use two fingers) to move around. Scroll or pinch to zoom out and see the whole planet.',r=>CNT.moved+CNT.zoomed*50>r.m+150,r=>{r.m=CNT.moved+CNT.zoomed*50}],
 ['A ready-made rocket','In the Rocket tab, use “Load a ready-made rocket” and pick the Orbiter.',r=>mv('preset')>r.n||evN('preset')>r.e,r=>{r.n=mv('preset');r.e=evN('preset')}],
 ['Add a part','Click a part in the list (a parachute, a fuel tank…) to add it. Click a row first to add under it.',r=>evN('add')>r.n,r=>{r.n=evN('add')}],
 ['Remove a part','Press ✕ on a row to remove that part.',r=>evN('remove')>r.n,r=>{r.n=evN('remove')}],
 ['Launch','Check the push is more than 1× its weight, then press Launch.',r=>evN('launch')>r.n,r=>{r.n=evN('launch')}],
 ['Light the engines','Press Space (or the STAGE button) to start the engines.',r=>mv('stage')>0],
 ['Throttle','Hold W to go faster, S to slow down. Z is full power, X is off.',r=>mv('thr')>0],
 ['Steer','Hold A or D to tilt the rocket. To reach orbit you climb, then tilt to the right.',r=>mv('steer')>0],
 ['Drop a stage','When a stage runs dry, press Space again to drop it and light the next one.',r=>mv('stage')>1],
 ['Map view','Press M (or Map) to zoom out and see your path. Ap is your highest point, Pe your lowest.',r=>mv('map')>0],
 ['Point the rocket','Press Forward to keep the rocket pointing the way it is moving.',r=>mv('sas_pro')>0],
 ['Autopilot','Press Fly to orbit and watch the autopilot. You can take over any time.',r=>mv('ap_orbit')+mv('ap_home')>0],
 ['Time warp','Use the 50× or 500× buttons at the top to skip the boring bits (not while burning or in the air).',()=>S.speedI>=2],
 ['Plan a burn','Move the Speed change slider. The orange line shows where that burn would take you.',r=>mv('plan')>0],
 ['Science','Press Crew report to record what your astronaut sees. Each place gives science once.',r=>mv('exp')>0],
 ['Your agency','Open the Agency tab: missions pay money, science unlocks parts, and you can hire astronauts.',r=>(CNT.tab_agency||0)>0],
);
DEMO.push(
 ['demo','Lift-off','The autopilot flies the Orbiter: straight up, then a slow lean to the right.',()=>{setSpeed(1)}],
 ['orbit','In orbit','At 2,300 m/s the capsule falls around Terra and keeps missing it.',()=>{setSpeed(2);setTimeout(mapView,300)}],
 ['moonready','Ready for Luna','A burn here, with Luna about 110° ahead, would send this lander to the Moon.',()=>{PLAN={at:'now',dv:880};setTimeout(()=>{mapView();cam.z/=9;clampCam()},300)}],
 ['descent','Landing on Luna','No air on Luna: only the engine can slow you down.',()=>{setSpeed(0)}],
 ['reentry','Coming home','The heat shield takes the heat, then the parachute opens.',()=>{setSpeed(1)}],
);

(()=>{const f=document.getElementById('hFree');if(f&&!document.getElementById('hBary')){const a=document.createElement('a');a.className='hb';a.id='hBary';a.href='../';a.style.cssText='text-decoration:none;color:inherit';a.innerHTML='<span class="ht">Back to Barycenter</span><span class="hd">Planets, stars, gravity and black holes</span>';f.after(a)}})();
