/* ===== simulator kit: core helpers shared by every simulator ===== */
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,rr=(a,b)=>a+Math.random()*(b-a),ri=(a,b)=>Math.floor(rr(a,b+1)),pick=a=>a[Math.floor(Math.random()*a.length)];
const mod=(a,n)=>((a%n)+n)%n;
let W=innerWidth,H=innerHeight,DPR=Math.min(2,devicePixelRatio||1);
const S={t:0,speed:1,speedI:0,paused:false,sel:null,view:'normal',tool:'select',brush:4,follow:false};
const cam={x:0,y:0,z:4,ox:0};
const CNT={moved:0,zoomed:0,scen:0,find:0,tool:0,view:0};const bump=k=>{CNT[k]=(CNT[k]||0)+1};
function toast(msg,ms=3200){const el=document.createElement('div');el.className='toast panel';el.textContent=msg;const box=$('toasts');box.appendChild(el);while(box.children.length>4)box.firstChild.remove();setTimeout(()=>el.remove(),ms)}
const fmtN=(v,d=0)=>Number(v).toLocaleString(undefined,{maximumFractionDigits:d,minimumFractionDigits:d});
/* challenges */
const CH={active:null,idx:-1,events:[],hold:{},t0:0,real0:0,done:false,failed:'',loading:false,ref:{}};
function chEv(k,d){if(CH.active&&!CH.done&&!CH.loading)CH.events.push({k,...(d||{}),t:S.t})}
const evN=k=>CH.events.filter(e=>e.k===k).length;
const evHas=f=>CH.events.some(f);
// hold a condition for an amount of simulated time (in the simulator's own time units)
function hold(key,cond,dur){if(!cond){CH.hold[key]=null;return 0}if(CH.hold[key]==null)CH.hold[key]=S.t;return Math.min(1,(S.t-CH.hold[key])/dur)}
const realSecs=()=>(performance.now()-CH.real0)/1000;
const byTime=(t3,t2)=>()=>{const s=realSecs();return s<=t3?3:s<=t2?2:1};
const CHALS=[];const CC=(diff,o)=>CHALS.push({diff,...o});
const TSTEPS=[];const DEMO=[];
const since=()=>S.t-CH.t0;
