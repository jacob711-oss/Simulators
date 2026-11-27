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
CC(1.25,{t:'Your club',g:'Rename your team, then score a goal with it.',hint:'Type a name in the Rename box in the Match tab and press Rename. Then go and score!',scen:'football',setup:()=>{play();G.sk=[90,40]},check:()=>{const r=evc('rename')>0,g=evc('youGoal')>0;return[r&&g,(r?0.5:0)+(g?0.5:0),r?(g?'Done':'Named: now score'):'Rename your team first']},stars:byTime(90,240)});
CC(2.95,{t:'Hat-trick',g:'Score 3 football goals yourself in one match.',hint:'Stay as your striker (do not switch) and shoot from close range, aiming away from the keeper.',scen:'football',setup:()=>{play();G.sk=[95,35]},check:need('youGoal',3,'goals'),fail:()=>M.over&&evc('youGoal')<3?'The final whistle went':'',stars:byTime(240,480)});
CC(3,{t:'Par for the course',g:'Make par or better on a golf hole.',hint:'Drag back from your ball and let go. Watch the yellow circle: that is where it lands.',scen:'golf',setup:()=>{play();G.sk=[85,70]},check:need('parOrBetter0',1,'holes'),stars:byTime(120,300)});
CC(3.1,{t:'Birdie',g:'Finish a golf hole one under par.',hint:'Par 3 holes are your best chance. Mind the wind arrow by the tee.',scen:'golf',setup:()=>{play();G.sk=[90,70]},check:()=>{const v=evc('birdie0');return[v>=1,v,`${v} of 1 birdies`]},stars:byTime(180,420)});
CC(3.2,{t:'Fastest in the heat',g:'Win a 100 m sprint.',hint:'Wait for the gun (tapping early is a false start), then tap or press keys as fast as you can.',scen:'sprint',setup:()=>{play()},check:need('youWin',1,'wins'),stars:byTime(30,90)});
CC(3.3,{t:'Gold in the pool',g:'Win a 50 m freestyle race.',hint:'Same as the sprint: wait for the gun, then tap fast all the way to the wall.',scen:'swim',setup:()=>{play()},check:need('youWin',1,'wins'),stars:byTime(45,120)});
CC(3.4,{t:'Super coach',g:'Win a whole football match without playing: only tactics, skills and coach tools.',hint:'Raise your team’s skill, pick Attack and speed time up to 4×.',scen:'football',setup:()=>{G.ctrl=false;setTool('select')},check:()=>{const v=evc('win0');return[v>=1,M.over?1:Math.min(0.95,M.clk/sc().real),v?'Won!':`${M.sc[0]} – ${M.sc[1]}`]},stars:byTime(120,240)});
CC(3.5,{t:'Run chase',g:'Win a 2-over cricket match.',hint:'Score fast when you bat, and bowl a good length to take wickets.',scen:'cricket',setup:()=>{play();G.overs=2;loadSport('cricket')},check:()=>{const v=evc('win0');return[v>=1,v,M.over&&!v?'Lost this one':'']},fail:()=>M.over&&!evc('win0')?'The other team won':'',stars:byTime(240,420)});
CC(3.6,{t:'Match point',g:'Win a full tennis match.',hint:'Long rallies favour the more skilful player. Aim for the corners.',scen:'tennis',setup:()=>{play();G.sk=[85,65]},check:()=>{const v=evc('win0');return[v>=1,M.n.games[0]/4,`${M.n.games[0]} – ${M.n.games[1]} in games`]},fail:()=>M.over&&!evc('win0')?'Your rival won':'',stars:byTime(400,800)});
CC(3.8,{t:'Hole in one',g:'Sink your tee shot on a par 3.',hint:'This is hole 2, a par 3. Line up on the flag and get the power just right. It takes luck!',scen:'golf',setup:()=>{play();G.club='auto';holeStart(2)},check:need('ace0',1,'aces'),stars:byTime(300,900)});
// the tutorial walks through every sport; each sport's first step loads it for you
const goSp=(id,k,extra)=>r=>{if(SP!==id)loadScen(id);G.ctrl=true;setTool('ctrl');setSpeed(SP==='golf'?2:1);if(extra)extra();r.n=evc(k)};
const did=k=>r=>evc(k)>r.n,base=k=>r=>{r.n=evc(k)};
const TUTAT={};
TSTEPS.push(
 ['Look around','Right-drag (or two fingers) to move around the stadium. Scroll or pinch to zoom.',r=>CNT.moved+CNT.zoomed*50>r.m+150,r=>{r.m=CNT.moved+CNT.zoomed*50}],
 ['Join the game','Pick 🎮 Play. The player with the yellow ring is you.',()=>S.tool==='ctrl'&&G.ctrl],
 ['Your team','In the Match tab, pick a club for your team (or the other team). Every club has its own kit.',did('kit'),base('kit')],
 ['Phone controls','On a phone or tablet, use the joystick to run and the Shoot, Pass and Switch buttons. (On a computer this step finishes by itself.)',r=>!TOUCH||evc('padUse')>r.n,base('padUse')],
 ['Run','Hold or drag on the pitch to run there, or use the arrow keys or WASD.',r=>DRAG.taps>r.n+2,r=>{r.n=DRAG.taps}],
 ['Pass','When you have the ball, tap a teammate or press E to pass.',did('youPass'),base('youPass')],
 ['Switch player','You stay as the same player until you choose. Press 🔁 Switch player (or Q) to become the teammate nearest the ball.',did('switched'),base('switched')],
 ['Shoot','Tap inside the goal on the right, or press Space, to shoot.',did('youShot'),base('youShot')],
 ['Tackle','When Blue has the ball, run at the player with it. Press Space to lunge.',did('youTackle'),base('youTackle')],
 ['Tactics','In the Match tab, pick Attack or Defend for your team.',did('tactic'),base('tactic')],
 ['Skill','Drag a skill slider. Higher skill means better passes, shots and tackles.',r=>G.sk[0]!==r.a||G.sk[1]!==r.b,r=>{r.a=G.sk[0];r.b=G.sk[1]}],
 ['Move a player','Pick ✋ Move player and drag someone to a new spot.',did('moved'),base('moved')],
 ['Kick the ball','Pick 🦶 Kick ball and drag across the pitch: the ball flies that way.',did('kicked'),base('kicked')],
 ['Heat map','Switch to the Heat map view to see where each team has been.',()=>S.view==='heat'],
 ['Stats','Open the Stats tab for possession, shots and every player.',r=>(CNT.tab_stats||0)>r.n,r=>{r.n=CNT.tab_stats||0}],
 ['Commentary','Read the live commentary in the Match tab. Wait for the commentator to call the next big moment.',did('comm'),base('comm')],
 ['Sound','Press Sound in the Match tab to turn the crowd, whistles and ball sounds off, then on again.',r=>evc('sound')>r.n+1,base('sound')],
 ['Basketball','Now basketball. Dribble towards the hoop on the right, then press Space or tap the hoop to shoot.',did('youShot'),goSp('basketball','youShot')],
 ['Ice hockey','The puck slides on the ice and bounces off the boards. Take a shot at the net on the right.',did('youShot'),goSp('hockey','youShot')],
 ['Handball','Only the keepers may go into the orange goal areas. Pass the ball to a teammate.',did('youPass'),goSp('handball','youPass')],
 ['Rugby sevens','In rugby, passes must go backwards. Run forward with the ball, then pass to someone behind you.',did('youPass'),goSp('rugby','youPass')],
 ['Cricket: batting','Tap the field just before the ball reaches you to hit it there. Aim for gaps between the fielders. L switches lofted shots on and off.',did('youHit'),goSp('cricket','youHit')],
 ['Cricket: bowling','Now you bowl. Tap the light brown pitch to choose where the next ball lands. A few steps in front of the batter is a good length.',did('youAim'),r=>{if(SP!=='cricket')loadScen('cricket');G.ctrl=true;setTool('ctrl');crInnings(1);r.n=evc('youAim')}],
 ['Baseball','Tap towards the field as the pitch arrives to swing. Tap too early or late and you miss.',did('youHit'),goSp('baseball','youHit')],
 ['Tennis','Hold or drag on your side to run. You swing by yourself when the ball is in reach. Return the ball once.',did('youHit'),goSp('tennis','youHit')],
 ['Aim','Tap the far side of the court to choose where your shots land.',did('youAim'),base('youAim')],
 ['Badminton','The shuttle floats, then drops fast. Get under it to hit it back.',did('youHit'),goSp('badminton','youHit')],
 ['Table tennis','Stand back from the table and return the ball. Space hits harder but riskier.',did('youHit'),goSp('tabletennis','youHit')],
 ['Volleyball','Your team gets three touches: pass, set, spike. Tap the far court to aim your spikes.',did('youAim'),goSp('volleyball','youAim')],
 ['Golf','Drag back from your red ball like a slingshot and let go. The yellow circle shows where it will land.',did('youShot'),goSp('golf','youShot')],
 ['100 m sprint','Wait for the gun (tapping early is a false start), then tap or press keys as fast as you can until the finish.',did('finished'),goSp('sprint','finished')],
 ['50 m swim','Same again in the pool: wait for the gun, then tap fast all the way to the wall.',did('finished'),goSp('swim','finished')],
);
TSTEPS.forEach((st,i)=>{const m={Basketball:'basketball','Ice hockey':'hockey',Handball:'handball','Rugby sevens':'rugby','Cricket: batting':'cricket',Baseball:'baseball',Tennis:'tennis',Badminton:'badminton','Table tennis':'tabletennis',Volleyball:'volleyball',Golf:'golf','100 m sprint':'sprint','50 m swim':'swim','Join the game':'football'}[st[0]];if(m)TUTAT[m]=i});
function learnSport(){const id=SP;startTutorial();TUT.i=TUTAT[id]??0;if(id==='football'){TUT.i=1}tutStep();toast(`Tutorial: ${sc().nm}`)}
DEMO.push(
 ['football','Football','Eleven a side. Players keep their shape, press the ball and look for the open pass.',()=>{G.ctrl=false;setSpeed(3)}],
 ['basketball','Basketball','Five on five. Guards bring the ball up, then the team works it for an open shot.',()=>{G.ctrl=false;setSpeed(3)}],
 ['cricket','Cricket','The bowler runs in, the batter picks a gap, and the fielders chase it to the rope.',()=>{G.ctrl=false;setSpeed(3)}],
 ['tennis','Tennis','A singles rally. Each player runs to where the ball will bounce and aims away from the other.',()=>{G.ctrl=false;setSpeed(2)}],
 ['volleyball','Volleyball','Pass, set, spike: three touches to get the ball over the net.',()=>{G.ctrl=false;setSpeed(2)}],
 ['golf','Golf','Two golfers, one hole. The wind pushes the ball and the greens slope.',()=>{G.ctrl=false;setSpeed(4)}],
 ['sprint','100 m sprint','Reaction time, a hard start, and holding top speed to the line.',()=>{G.ctrl=false;setSpeed(2)}],
);
