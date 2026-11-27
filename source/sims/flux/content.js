/* ================= Flux: challenges, tutorial, demo ================= */
const maxOrbit=()=>Math.max(0,...freeQ().map(p=>p.orbitT));
CC(1,{t:'Opposites attract',g:'Throw an electron into a positive charge.',hint:'Pick 🔵 Electron and click near the red charge. It pulls the electron in.',scen:'blank',setup:()=>{addCharge(60,40,3)},check:()=>[G.absorbed>=1,G.absorbed>=1?1:0,''],stars:byTime(15,40)});
CC(1.1,{t:'Dipole',g:'Place a positive and a negative charge and see the field lines join them.',hint:'Pick ➕ Positive and click, then ➖ Negative and click somewhere else.',scen:'blank',check:()=>{const F=fixedQ(),p=F.some(c=>c.q>0),n=F.some(c=>c.q<0);return[p&&n,(p?0.5:0)+(n?0.5:0),'']},stars:byTime(15,40)});
CC(1.2,{t:'Bullseye',g:'Bend the electron beam into the target 10 times.',hint:'Move the red charge (✋ Move) or add a ➕ charge near the target to pull the beam towards it.',scen:'range',check:()=>[G.hits>=10,G.hits/10,`${G.hits} of 10 hits`],stars:byTime(40,100)});
CC(1.3,{t:'Magnetic steering',g:'Use a magnet (not charges) to bend the beam into the target 10 times.',hint:'Erase the red charge, then paint ⊗ Magnet in or ⊙ Magnet out across the beam.',scen:'range',setup:()=>{Q=Q.filter(c=>c.free)},check:()=>{const ok=BPAINT>0&&!fixedQ().length;return[ok&&G.hits>=10,ok?G.hits/10:0,ok?`${G.hits} of 10 hits`:'Use only magnets']},stars:byTime(40,100)});
CC(1.4,{t:'Gun range',g:'Build an electron gun and a target of your own and hit it 5 times.',hint:'🔫 Electron gun: click and drag to aim. 🎯 Target: click where the beam goes.',scen:'blank',check:()=>[EMADD>0&&TGADD>0&&G.hits>=5,EMADD&&TGADD?G.hits/5:0,`${G.hits} of 5`],stars:byTime(30,80)});
CC(1.6,{t:'Heavy hitters',g:'Make the gun fire particles of mass 20 or more, then hit the target 5 times.',hint:'Inspect the gun (tap it) and drag its Mass slider right. Heavy particles hardly bend, so aim the gun straight at the target.',scen:'range',check:()=>{const e=EM[0],m=e?(e.sign>0?1:0.25)*(e.mm||1):0,ok=m>=20;if(!ok)CH.ref.h0=G.hits;const d=ok?G.hits-(CH.ref.h0||0):0;return[ok&&d>=5,ok?0.3+0.7*d/5:0,ok?`${d} of 5 heavy hits`:'make the gun fire heavier particles']},stars:byTime(40,100)});
CC(2,{t:'In orbit',g:'Keep a free electron circling a positive charge for 20 seconds.',hint:'Throw the electron sideways (drag while placing), not straight at the charge.',scen:'blank',setup:()=>{addCharge(60,40,4)},check:()=>{const t=maxOrbit();return[t>=20,t/20,`${t.toFixed(1)} of 20 s`]},stars:byTime(40,120)});
CC(2.4,{t:'Build an atom',g:'Have 3 electrons orbiting the nucleus at the same time for 15 seconds.',hint:'Throw each electron sideways at a different distance.',scen:'blank',setup:()=>{addCharge(60,40,5)},check:()=>{const n=freeQ().filter(p=>p.q<0&&p.orbitT>=15).length;return[n>=3,n/3,`${n} of 3 electrons`]},stars:byTime(60,180)});
CC(2.8,{t:'Cyclotron',g:'Make a proton loop 3 full circles in the magnetic field.',hint:'Slow the beam (Beam speed in the Field tab) or raise the magnet strength so the circles fit inside.',scen:'cyclotron',check:()=>{const m=Math.max(0,...freeQ().map(p=>Math.abs(p.turn)))/(2*Math.PI);return[m>=3,m/3,`${m.toFixed(1)} of 3 circles`]},stars:byTime(30,90)});
CC(3,{t:'Through the plates',g:'Get 20 electrons through the capacitor into the target.',hint:'The plates pull the beam up. Flip a plate, add a magnet, or move the gun.',scen:'capacitor',check:()=>[G.hits>=20,G.hits/20,`${G.hits} of 20`],stars:byTime(60,150)});
CC(3.4,{t:'Trick shot',g:'Hit all three targets at least 5 times each.',hint:'One gun, three targets: move charges around or paint magnets to split the beam.',scen:'gallery',check:()=>{const m=Math.min(...TG.map(t=>t.hits));return[TG.length>=3&&m>=5,m/5,`Fewest hits: ${m} of 5`]},stars:byTime(90,240)});
CC(3.8,{t:'Particle storm',g:'Have 200 free particles flying at once.',hint:'💥 Particle burst in the Field tab, plus fast guns.',scen:'blank',check:()=>{const n=freeQ().length;return[n>=200,n/200,`${n} of 200`]},stars:byTime(30,90)});
TSTEPS.push(
 ['Look around','Right-drag (or two fingers) to move around the lab. Scroll or pinch to zoom.',r=>CNT.moved+CNT.zoomed*50>r.m+150,r=>{r.m=CNT.moved+CNT.zoomed*50}],
 ['A positive charge','Pick ➕ Positive and click in the lab. Field lines spread out from it.',r=>PLACED>r.n,r=>{r.n=PLACED}],
 ['A negative charge','Pick ➖ Negative and click nearby. The field lines now run from + to −.',()=>fixedQ().some(c=>c.q<0)&&fixedQ().some(c=>c.q>0)],
 ['Free particles','Pick 🔵 Electron and drag to throw one past the charges.',r=>FREEADD>r.n,r=>{r.n=FREEADD}],
 ['Move things','Pick ✋ Move and drag a charge somewhere else.',r=>MOVED>r.n+3,r=>{r.n=MOVED}],
 ['Particle guns','Pick 🔫 Proton gun: click to place it and drag to aim.',r=>EMADD>r.n,r=>{r.n=EMADD}],
 ['Mass','Anything can be heavier or lighter. Inspect a particle, charge or gun and drag its Mass slider (or set Mass of new particles in the Field tab). Heavy particles barely bend; light ones whip around. A pinned charge has endless mass: drag its slider down to set it free.',r=>MASSCH>r.n,r=>{r.n=MASSCH}],
 ['Magnets','Pick ⊗ Magnet in and paint across the beam. Watch it curve.',r=>BPAINT>r.n+3,r=>{r.n=BPAINT}],
 ['Targets','Pick 🎯 Target and place one where the beam goes.',r=>TGADD>r.n,r=>{r.n=TGADD}],
 ['Voltage','Switch to the Voltage view in the Field tab.',()=>S.view==='potential'],
 ['Erase','Pick 🧽 Erase and wipe something away.',r=>ERASED>r.n,r=>{r.n=ERASED}],
 ['Other labs','Press Labs in the top bar and pick another lab.',r=>CNT.scen>r.n,r=>{r.n=CNT.scen}],
);
DEMO.push(
 ['dipole','A dipole','Field lines leave the positive charge and land on the negative one.',()=>{setSpeed(2)}],
 ['atom','An atom','Electrons circle a heavy nucleus, held by electric attraction.',()=>{setSpeed(2)}],
 ['cyclotron','A cyclotron','In a magnetic field, moving protons curl into circles.',()=>{setSpeed(2)}],
 ['capacitor','A capacitor','Charged plates bend a beam of electrons. Here is the voltage between them.',()=>{setSpeed(2);setView('potential')}],
);
