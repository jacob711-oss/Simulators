/* ================= Arena: challenges, tutorial, demo ================= */
const play=()=>{G.ctrl=true};
const need=(k,n,label)=>()=>{const v=evc(k);return[v>=n,v/n,`${Math.min(v,n)} of ${n} ${label||''}`.trim()]};
CC(1,{t:'First pass',g:'Pick 🎮 Play and pass the ball to a teammate.',hint:'Tap a teammate (or press E) when your ringed player has the ball.',scen:'football',setup:()=>{play();G.sk=[80,50]},check:need('youPassDone',1,'passes'),stars:byTime(40,120)});
CC(1.1,{t:'Take a shot',g:'Shoot at goal yourself.',hint:'Run towards the right-hand goal and tap inside it, or press Space.',scen:'football',setup:()=>{play();G.sk=[80,50]},check:need('youShot',1,'shots'),stars:byTime(40,120)});
CC(1.2,{t:'Goal!',g:'Score a football goal yourself.',hint:'Get close to the goal before you shoot, and aim for a corner away from the keeper.',scen:'football',setup:()=>{play();G.sk=[90,40]},check:need('youGoal',1,'goals'),stars:byTime(90,240)});
CC(1.3,{t:'Ball winner',g:'Win the ball back with a tackle.',hint:'When Blue has the ball, run straight at the player with it. Press Space to lunge.',scen:'football',setup:()=>{play();G.sk=[80,60]},check:need('youTackle',1,'tackles'),stars:byTime(40,120)});
CC(1.4,{t:'Hoops',g:'Score a basket yourself in basketball.',hint:'Drive towards the hoop on the right and press Space (or tap the hoop) when you are close.',scen:'basketball',setup:()=>{play();G.sk=[85,50]},check:need('youBasket',1,'baskets'),stars:byTime(60,180)});
CC(1.5,{t:'From downtown',g:'Score a three-pointer yourself.',hint:'Shoot from outside the big curved line.',scen:'basketball',setup:()=>{play();G.sk=[95,40]},check:need('youThree',1,'threes'),stars:byTime(90,240)});
CC(1.6,{t:'Slapshot',g:'Score a goal in ice hockey yourself.',hint:'The puck slides a long way on ice. Shoot from close in front of the net.',scen:'hockey',setup:()=>{play();G.sk=[90,45]},check:need('youGoal',1,'goals'),stars:byTime(90,240)});
CC(1.7,{t:'Try time',g:'Score a rugby try yourself.',hint:'Run the ball over the try line at the right. Passes have to go backwards.',scen:'rugby',setup:()=>{play();G.sk=[90,45]},check:need('youTry',1,'tries'),stars:byTime(90,240)});
CC(1.8,{t:'Seven-a-side',g:'Your handball team scores 3 goals.',hint:'Pick Attack tactics and speed the game up.',scen:'handball',setup:()=>{G.ctrl=false;G.sk=[75,60]},check:need('goal0',3,'goals'),stars:byTime(90,200)});
CC(2,{t:'Boundary',g:'Hit a four in cricket.',hint:'With 🎮 Play, tap the field just before the ball reaches you. Aim into a gap between fielders.',scen:'cricket',setup:()=>{play();G.sk=[80,55]},check:need('youFour',1,'fours'),stars:byTime(60,180)});
CC(2.1,{t:'Maximum',g:'Hit a six: clear the rope without a bounce.',hint:'Turn on lofted shots (key L) and time your tap well.',scen:'cricket',setup:()=>{play();G.sk=[90,45];G.loft=true},check:need('youSix',1,'sixes'),stars:byTime(90,240)});
CC(2.2,{t:'Strike bowler',g:'Take a wicket while your team bowls.',hint:'Tap the pitch to choose where the ball lands. A good length is a few steps in front of the batter, in line with the stumps.',scen:'cricket',setup:()=>{play();G.sk=[85,50];crInnings(1)},check:need('wkt0',1,'wickets'),stars:byTime(60,180)});
CC(2.3,{t:'Safe at first',g:'Get a hit in baseball.',hint:'Tap towards the field while the pitch is on its way. Aim between the fielders.',scen:'baseball',setup:()=>{play();G.sk=[85,50]},check:need('youSafe',1,'hits'),stars:byTime(60,180)});
CC(2.4,{t:'Home run',g:'Hit the ball over the fence.',hint:'Turn on Hit it in the air (key L) and tap just as the ball reaches the plate.',scen:'baseball',setup:()=>{play();G.sk=[95,40];G.loft=true},check:need('youHR',1,'home runs'),stars:byTime(120,300)});
CC(2.5,{t:'Love game',g:'Win a game of tennis.',hint:'Move with the arrows or by holding the court. Tap the far court to aim away from your rival.',scen:'tennis',setup:()=>{play();G.sk=[85,55]},check:need('game0',1,'games'),stars:byTime(90,240)});
CC(2.6,{t:'Shuttle run',g:'Win 5 points in badminton.',hint:'Stay near the middle of your court; tap the back corners to aim.',scen:'badminton',setup:()=>{play();G.sk=[85,55]},check:need('pt0',5,'points'),stars:byTime(90,240)});
CC(2.7,{t:'Ping pong',g:'Win 3 points in table tennis.',hint:'Stand back from the table. Space hits harder but riskier.',scen:'tabletennis',setup:()=>{play();G.sk=[85,55]},check:need('pt0',3,'points'),stars:byTime(60,180)});
CC(2.8,{t:'Spike it',g:'Your volleyball team wins 5 points.',hint:'Tap the far court to choose where your spikes land.',scen:'volleyball',setup:()=>{play();G.sk=[80,60]},check:need('pt0',5,'points'),stars:byTime(90,240)});
CC(3,{t:'Par for the course',g:'Make par or better on a golf hole.',hint:'Drag back from your ball and let go. Watch the yellow circle: that is where it lands.',scen:'golf',setup:()=>{play();G.sk=[85,70]},check:need('parOrBetter0',1,'holes'),stars:byTime(120,300)});
CC(3.1,{t:'Birdie',g:'Finish a golf hole one under par.',hint:'Par 3 holes are your best chance. Mind the wind arrow by the tee.',scen:'golf',setup:()=>{play();G.sk=[90,70]},check:()=>{const v=evc('birdie0');return[v>=1,v,`${v} of 1 birdies`]},stars:byTime(180,420)});
CC(3.2,{t:'Fastest in the heat',g:'Win a 100 m sprint.',hint:'Wait for the gun (tapping early is a false start), then tap or press keys as fast as you can.',scen:'sprint',setup:()=>{play()},check:need('youWin',1,'wins'),stars:byTime(30,90)});
CC(3.3,{t:'Gold in the pool',g:'Win a 50 m freestyle race.',hint:'Same as the sprint: wait for the gun, then tap fast all the way to the wall.',scen:'swim',setup:()=>{play()},check:need('youWin',1,'wins'),stars:byTime(45,120)});
CC(3.4,{t:'Super coach',g:'Win a whole football match without playing: only tactics, skills and coach tools.',hint:'Raise your team’s skill, pick Attack and speed time up to 4×.',scen:'football',setup:()=>{G.ctrl=false;setTool('select')},check:()=>{const v=evc('win0');return[v>=1,M.over?1:Math.min(0.95,M.clk/sc().real),v?'Won!':`${M.sc[0]} – ${M.sc[1]}`]},stars:byTime(120,240)});
CC(3.5,{t:'Run chase',g:'Win a 2-over cricket match.',hint:'Score fast when you bat, and bowl a good length to take wickets.',scen:'cricket',setup:()=>{play();G.overs=2;loadSport('cricket')},check:()=>{const v=evc('win0');return[v>=1,v,M.over&&!v?'Lost this one':'']},fail:()=>M.over&&!evc('win0')?'The other team won':'',stars:byTime(240,420)});
CC(3.6,{t:'Match point',g:'Win a full tennis match.',hint:'Long rallies favour the more skilful player. Aim for the corners.',scen:'tennis',setup:()=>{play();G.sk=[85,65]},check:()=>{const v=evc('win0');return[v>=1,M.n.games[0]/4,`${M.n.games[0]} – ${M.n.games[1]} in games`]},fail:()=>M.over&&!evc('win0')?'Your rival won':'',stars:byTime(400,800)});
CC(3.8,{t:'Hole in one',g:'Sink your tee shot on a par 3.',hint:'This is hole 2, a par 3. Line up on the flag and get the power just right. It takes luck!',scen:'golf',setup:()=>{play();G.club='auto';holeStart(2)},check:need('ace0',1,'aces'),stars:byTime(300,900)});
TSTEPS.push(
 ['Look around','Right-drag (or two fingers) to move around the stadium. Scroll or pinch to zoom.',r=>CNT.moved+CNT.zoomed*50>r.m+150,r=>{r.m=CNT.moved+CNT.zoomed*50}],
 ['Join the game','Pick 🎮 Play. The player with the yellow ring is you.',()=>S.tool==='ctrl'&&G.ctrl],
 ['Run','Hold or drag on the pitch to run there, or use the arrow keys or WASD.',r=>DRAG.taps>r.n+2,r=>{r.n=DRAG.taps}],
 ['Pass','When you have the ball, tap a teammate or press E to pass.',r=>evc('youPass')>r.n,r=>{r.n=evc('youPass')}],
 ['Shoot','Tap inside the goal on the right, or press Space, to shoot.',r=>evc('youShot')>r.n,r=>{r.n=evc('youShot')}],
 ['Tactics','In the Match tab, pick Attack or Defend for your team.',r=>evc('tactic')>r.n,r=>{r.n=evc('tactic')}],
 ['Skill','Drag a skill slider. Higher skill means better passes, shots and tackles.',r=>G.sk[0]!==r.a||G.sk[1]!==r.b,r=>{r.a=G.sk[0];r.b=G.sk[1]}],
 ['Move a player','Pick ✋ Move player and drag someone to a new spot.',r=>evc('moved')>r.n,r=>{r.n=evc('moved')}],
 ['Kick the ball','Pick 🦶 Kick ball and drag across the pitch: the ball flies that way.',r=>evc('kicked')>r.n,r=>{r.n=evc('kicked')}],
 ['Heat map','Switch to the Heat map view to see where each team has been.',()=>S.view==='heat'],
 ['Stats','Open the Stats tab for possession, shots and every player.',r=>(CNT.tab_stats||0)>r.n,r=>{r.n=CNT.tab_stats||0}],
 ['Another sport','Press Sports at the top (or use the Sport list) and pick cricket.',()=>SP==='cricket'],
 ['Bat','With 🎮 Play, tap the field just before the ball reaches you to hit it there.',r=>evc('youHit')>r.n,r=>{r.n=evc('youHit')}],
);
DEMO.push(
 ['football','Football','Eleven a side. Players keep their shape, press the ball and look for the open pass.',()=>{G.ctrl=false;setSpeed(3)}],
 ['basketball','Basketball','Five on five. Guards bring the ball up, then the team works it for an open shot.',()=>{G.ctrl=false;setSpeed(3)}],
 ['cricket','Cricket','The bowler runs in, the batter picks a gap, and the fielders chase it to the rope.',()=>{G.ctrl=false;setSpeed(3)}],
 ['tennis','Tennis','A singles rally. Each player runs to where the ball will bounce and aims away from the other.',()=>{G.ctrl=false;setSpeed(2)}],
 ['volleyball','Volleyball','Pass, set, spike: three touches to get the ball over the net.',()=>{G.ctrl=false;setSpeed(2)}],
 ['golf','Golf','Two golfers, one hole. The wind pushes the ball and the greens slope.',()=>{G.ctrl=false;setSpeed(4)}],
 ['sprint','100 m sprint','Reaction time, a hard start, and holding top speed to the line.',()=>{G.ctrl=false;setSpeed(2)}],
);
