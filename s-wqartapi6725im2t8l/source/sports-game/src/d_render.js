
/* ================= 3D broadcast renderer ================= */
const cv=$('cv'),g2=cv.getContext('2d');let CW=0,CH=0,DPR=1;
const CAM={camY:0,camH:0,f:1,hy:0,cx:0,camX:0,near:.45};
const SKIN=['#f1c9a5','#e0ac80','#c68642','#8d5524','#f6d7b8','#a8754a'];
let crowdPat=null;
function fitCanvas(){DPR=Math.min(2,window.devicePixelRatio||1);const w=Math.round(innerWidth*DPR),h=Math.round(innerHeight*DPR);if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}CW=w;CH=h}
function makeCrowd(){const c=document.createElement('canvas');c.width=240;c.height=120;const x=c.getContext('2d');x.fillStyle='#0c1224';x.fillRect(0,0,240,120);
 const cols=['#e11d48','#facc15','#38bdf8','#f97316','#22c55e','#f8fafc','#a78bfa','#1d4ed8','#fb7185','#fde047'];
 for(let row=0;row<20;row++)for(let i=0;i<60;i++){x.fillStyle=cols[(Math.random()*cols.length)|0];x.globalAlpha=.35+Math.random()*.5;x.beginPath();x.arc(i*4+(row%2)*2+Math.random(),row*6+3,1.5+Math.random()*.7,0,7);x.fill()}
 x.globalAlpha=1;crowdPat=g2.createPattern(c,'repeat')}
function setCam(v){const Lv=v.Lv;CAM.camY=v.y0-Lv*.38;CAM.camH=Lv*.34*(v.h||1);CAM.f=Math.min(CH*.93,CW*1.25);CAM.hy=CH*(v.anchor||.74)-CAM.camH*CAM.f/(Lv*.38);CAM.cx=CW/2;CAM.camX=v.x||0}
function P(x,y,z){const d=y-CAM.camY;if(d<CAM.near)return null;const s=CAM.f/d;return{x:CAM.cx+(x-CAM.camX)*s,y:CAM.hy+(CAM.camH-z)*s,s}}
function clipPoly(pts){const n=CAM.camY+CAM.near,out=[];for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];const ia=a[1]>=n,ib=b[1]>=n;if(ia)out.push(a);if(ia!==ib){const t=(n-a[1])/(b[1]-a[1]);out.push([a[0]+(b[0]-a[0])*t,n,(a[2]||0)+((b[2]||0)-(a[2]||0))*t])}}return out}
function poly(pts,fill,stroke,lw){const c=clipPoly(pts);if(c.length<3)return;g2.beginPath();c.forEach((p,i)=>{const q=P(p[0],p[1],p[2]||0);if(!q)return;i?g2.lineTo(q.x,q.y):g2.moveTo(q.x,q.y)});g2.closePath();if(fill){g2.fillStyle=fill;g2.fill()}if(stroke){g2.strokeStyle=stroke;g2.lineWidth=lw||DPR;g2.stroke()}}
function seg(x1,y1,x2,y2,z1=0,z2=z1){const n=CAM.camY+CAM.near;if(y1<n&&y2<n)return;if(y1<n){const t=(n-y1)/(y2-y1);x1+=(x2-x1)*t;z1+=(z2-z1)*t;y1=n}if(y2<n){const t=(n-y2)/(y1-y2);x2+=(x1-x2)*t;z2+=(z1-z2)*t;y2=n}const a=P(x1,y1,z1),b=P(x2,y2,z2);if(!a||!b)return;g2.moveTo(a.x,a.y);g2.lineTo(b.x,b.y)}
function rectL(x1,y1,x2,y2,z=0){seg(x1,y1,x2,y1,z);seg(x2,y1,x2,y2,z);seg(x2,y2,x1,y2,z);seg(x1,y2,x1,y1,z)}
function arc(cx,cy,r,a0,a1,z=0,n=28){let px=cx+Math.cos(a0)*r,py=cy+Math.sin(a0)*r;for(let i=1;i<=n;i++){const a=a0+(a1-a0)*i/n,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;seg(px,py,x,y,z);px=x;py=y}}
function lineStyle(c,w){g2.strokeStyle=c;g2.lineWidth=Math.max(1,w*CAM.f/400);g2.beginPath()}

function drawSky(){const g=g2.createLinearGradient(0,0,0,CH);g.addColorStop(0,'#030712');g.addColorStop(.5,'#0b1a3a');g.addColorStop(1,'#0b1a3a');g2.fillStyle=g;g2.fillRect(0,0,CW,CH);
 const t=performance.now()/1000;[[.12,.06],[.38,.03],[.62,.03],[.88,.06]].forEach(([x,y],i)=>{const r=CH*.22;const gr=g2.createRadialGradient(CW*x,CH*y,0,CW*x,CH*y,r);gr.addColorStop(0,'rgba(255,250,225,'+(.42+.04*Math.sin(t*3+i))+')');gr.addColorStop(1,'rgba(255,250,225,0)');g2.fillStyle=gr;g2.fillRect(CW*x-r,CH*y-r,2*r,2*r);g2.fillStyle='#fffbe6';g2.fillRect(CW*x-10*DPR,CH*y-3*DPR,20*DPR,6*DPR)})}
function stands(F,x0,x1,y0,y1){if(!crowdPat)makeCrowd();const H=Math.max(9,F.L*.12),m=Math.max(4,F.L*.08);
 const far=y1+m;poly([[x0-60,far,0],[x1+60,far,0],[x1+60,far+H*1.2,H],[x0-60,far+H*1.2,H]],crowdPat);poly([[x0-60,far,0],[x1+60,far,0],[x1+60,far,1.1],[x0-60,far,1.1]],'#0b1430');
 [[x0-m,-1],[x1+m,1]].forEach(([sx,sg])=>{poly([[sx,y0-60,0],[sx,far,0],[sx+sg*H*1.2,far+H,H],[sx+sg*H*1.2,y0-60,H]],crowdPat);poly([[sx,y0-60,0],[sx,far,0],[sx,far,1],[sx,y0-60,1]],'#0b1430')});
 const t=performance.now();if(t%3<1.5){const a=P(rnd()*(x1-x0)+x0,far+H*.6,H*.55);if(a){g2.fillStyle='#fff';g2.fillRect(a.x,a.y,2*DPR,2*DPR)}}}

function drawField(F){const W=F.W,L=F.L,hw=W/2,k=F.kind;const y0=-12,y1=L+12;
 const out=F.out||(F.ice?'#cfd9e2':'#22662d');const tt=k==='tt';
 poly([[-300,CAM.camY+CAM.near,0],[300,CAM.camY+CAM.near,0],[300,y1+400,0],[-300,y1+400,0]],tt?'#141c33':out);
 if(k!=='baseball')stands(F,-hw-(F.ice?2:6),hw+(F.ice?2:6),y0,y1);
 if(k==='baseball'){drawBaseball(F);return}
 const z=tt?F.table:0;
 if(tt){poly([[-hw-.02,-.02,z],[hw+.02,-.02,z],[hw+.02,L+.02,z],[-hw-.02,L+.02,z]],'#0f2a6b');[[-hw+.1,.15],[hw-.1,.15],[-hw+.1,L-.15],[hw-.1,L-.15]].forEach(([x,y])=>{lineStyle('#111',8);seg(x,y,x,y,0,z);g2.stroke()})}
 if(k==='rugby'){poly([[-hw,-10,0],[hw,-10,0],[hw,0,0],[-hw,0,0]],'#2a7a35');poly([[-hw,L,0],[hw,L,0],[hw,L+10,0],[-hw,L+10,0]],'#2a7a35')}
 const ns=F.ice?1:Math.max(6,Math.round(L/(k==='basketball'?2.5:8)));for(let i=0;i<ns;i++){const a=L*i/ns,b=L*(i+1)/ns;poly([[-hw,a,z],[hw,a,z],[hw,b,z],[-hw,b,z]],i%2?F.c2:F.c1)}
 if(k==='basketball'){poly([[-2.45,0,0],[2.45,0,0],[2.45,5.8,0],[-2.45,5.8,0]],'#9a3412');poly([[-2.45,L,0],[2.45,L,0],[2.45,L-5.8,0],[-2.45,L-5.8,0]],'#9a3412')}
 if(k==='volleyball'){poly([[-hw,L/2-3,0],[hw,L/2-3,0],[hw,L/2+3,0],[-hw,L/2+3,0]],'#ea9a50')}
 lineStyle(F.line,F.ice?.3:k==='tt'?.02:.12);
 rectL(-hw,0,hw,L,z);seg(-hw,L/2,hw,L/2,z);
 if(k==='football'){arc(0,L/2,9.15,0,Math.PI*2);[[0,1],[L,-1]].forEach(([gy,s])=>{rectL(-20.16,gy,20.16,gy+s*16.5);rectL(-9.16,gy,9.16,gy+s*5.5);arc(0,gy+s*11,9.15,s>0?.93:-2.21,s>0?2.21:-.93)})}
 if(k==='basketball'){arc(0,L/2,1.8,0,7);[[0,1],[L,-1]].forEach(([gy,s])=>{rectL(-2.45,gy,2.45,gy+s*5.8);arc(0,gy+s*5.8,1.8,0,7);const hy=gy+s*1.575;seg(-6.6,gy,-6.6,gy+s*2.99);seg(6.6,gy,6.6,gy+s*2.99);arc(0,hy,6.75,s>0?.22:-2.92,s>0?2.92:-.22,0,36)})}
 if(k==='hockey'){g2.stroke();lineStyle('#c8102e',.3);seg(-hw,L/2,hw,L/2);seg(-hw,4,hw,4);seg(-hw,L-4,hw,L-4);g2.stroke();lineStyle('#1d4ed8',.3);seg(-hw,L/2-7.6,hw,L/2-7.6);seg(-hw,L/2+7.6,hw,L/2+7.6);g2.stroke();lineStyle('#c8102e',.08);[[-6.7,10],[6.7,10],[-6.7,L-10],[6.7,L-10]].forEach(([x,y])=>arc(x,y,4.5,0,7));arc(0,L/2,4.5,0,7)}
 if(k==='handball'){[[0,1],[L,-1]].forEach(([gy,s])=>{arc(-1.5,gy,6,s>0?Math.PI/2:-Math.PI,s>0?Math.PI:-Math.PI/2);arc(1.5,gy,6,s>0?0:-Math.PI/2,s>0?Math.PI/2:0);seg(-1.5,gy+s*6,1.5,gy+s*6);seg(-.5,gy+s*7,.5,gy+s*7)})}
 if(k==='rugby'){seg(-hw,22,hw,22);seg(-hw,L-22,hw,L-22);seg(-hw,-10,hw,-10);seg(-hw,L+10,hw,L+10);seg(-hw,-10,-hw,L+10);seg(hw,-10,hw,L+10);for(let x=-hw+5;x<hw;x+=6){seg(x,L/2-10,x+2,L/2-10);seg(x,L/2+10,x+2,L/2+10)}}
 if(k==='tennis'){seg(-hw,L/2-6.4,hw,L/2-6.4);seg(-hw,L/2+6.4,hw,L/2+6.4);seg(0,L/2-6.4,0,L/2+6.4);rectL(-5.485,0,5.485,L)}
 if(k==='badminton'){seg(-hw,L/2-1.98,hw,L/2-1.98);seg(-hw,L/2+1.98,hw,L/2+1.98);seg(0,0,0,L/2-1.98);seg(0,L/2+1.98,0,L);seg(-hw,.76,hw,.76);seg(-hw,L-.76,hw,L-.76)}
 if(k==='volleyball'){seg(-hw,L/2-3,hw,L/2-3);seg(-hw,L/2+3,hw,L/2+3)}
 if(k==='tt'){seg(0,0,0,L,z)}
 g2.stroke();
 if(F.net)drawNet(F,z);
 const S=SPORTS[M.sp];if(S.goal)[[S.goal.y||0,-1],[L-(S.goal.y||0),1]].forEach(([gy,s])=>drawGoal(S.goal,gy,s));if(S.hoop)[[1.2,-1],[L-1.2,1]].forEach(([by,s])=>drawHoop(by,s));if(k==='rugby'){drawPosts(0,-1);drawPosts(L,1)}}
function drawGoal(G,gy,s){const hw=G.w/2,d=G.d,bk=gy+s*d;g2.globalAlpha=.55;lineStyle('#e5e7eb',.03);for(let i=0;i<=10;i++){const x=-hw+G.w*i/10;seg(x,bk,x,bk,0,G.h*.85);seg(x,gy,x,bk,G.h,G.h*.85)}for(let j=0;j<=5;j++){const z=G.h*.85*j/5;seg(-hw,bk,hw,bk,z);seg(-hw,gy,-hw,bk,z*1.17,z);seg(hw,gy,hw,bk,z*1.17,z)}g2.stroke();g2.globalAlpha=1;
 lineStyle(M.sp==='hockey'?'#dc2626':'#fff',G.w*.016);seg(-hw,gy,-hw,gy,0,G.h);seg(hw,gy,hw,gy,0,G.h);seg(-hw,gy,hw,gy,G.h);g2.stroke()}
function drawHoop(by,s){lineStyle('#475569',.12);seg(0,by+s*.9,0,by+s*.9,0,3.95);seg(0,by+s*.9,0,by,3.6,3.6);g2.stroke();poly([[-.9,by,2.9],[.9,by,2.9],[.9,by,3.95],[-.9,by,3.95]],'rgba(255,255,255,.75)','#111',DPR);lineStyle('#dc2626',.02);seg(-.3,by,.3,by,3.05);seg(-.3,by,-.3,by,3.05,3.5);seg(.3,by,.3,by,3.05,3.5);seg(-.3,by,.3,by,3.5);g2.stroke();
 const cy=by-s*.375;lineStyle('#f97316',.04);arc(0,cy,.23,0,7,3.05,16);g2.stroke();g2.globalAlpha=.6;lineStyle('#fff',.015);for(let i=0;i<8;i++){const a=i/8*7;seg(Math.cos(a)*.23,cy+Math.sin(a)*.23,Math.cos(a)*.13,cy+Math.sin(a)*.13,3.05,2.62)}g2.stroke();g2.globalAlpha=1}
function drawPosts(gy,s){lineStyle('#fff',.12);seg(-2.8,gy,-2.8,gy,0,13);seg(2.8,gy,2.8,gy,0,13);seg(-2.8,gy,2.8,gy,3);g2.stroke();lineStyle(M.kitA.jersey,.4);seg(-2.8,gy,-2.8,gy,0,1.8);seg(2.8,gy,2.8,gy,0,1.8);g2.stroke()}
function drawNet(F,z0){const hw=F.W/2+(F.kind==='tt'?.15:.5),y=F.L/2,top=z0+F.net,bot=F.kind==='tennis'?z0:F.kind==='tt'?z0:top-(F.kind==='badminton'?.76:1);
 poly([[-hw,y,bot],[hw,y,bot],[hw,y,top],[-hw,y,top]],'rgba(15,23,42,.45)');g2.globalAlpha=.5;lineStyle('#cbd5e1',.01);const n=Math.round(hw*4);for(let i=0;i<=n;i++){const x=-hw+2*hw*i/n;seg(x,y,x,y,bot,top)}g2.stroke();g2.globalAlpha=1;lineStyle('#fff',F.kind==='tt'?.012:.05);seg(-hw,y,hw,y,top);g2.stroke();lineStyle('#334155',F.kind==='tt'?.02:.08);seg(-hw,y,-hw,y,0,top);seg(hw,y,hw,y,0,top);g2.stroke()}
function drawBaseball(F){poly([[-200,-20,0],[200,-20,0],[200,200,0],[-200,200,0]],'#2f8a3a');for(let i=0;i<10;i++){const a=10+i*11,b=a+5.5;poly([[-150,a,0],[150,a,0],[150,b,0],[-150,b,0]],'#297d34')}
 const pts=[];for(let i=0;i<=20;i++){const a=Math.PI/4+i/20*Math.PI/2;pts.push([Math.cos(a)*29,Math.sin(a)*29,0])}pts.push([0,-3,0]);poly(pts,'#b98552');poly([[0,8,0],[11,19.4,0],[0,30.8,0],[-11,19.4,0]],'#2f8a3a');
 arc(0,18.4,2.7,0,7);poly(Array.from({length:16},(_,i)=>[Math.cos(i/16*7)*2.7,18.4+Math.sin(i/16*7)*2.7,0]),'#b98552');
 const fp=[];for(let i=0;i<=30;i++){const a=Math.PI/4+i/30*Math.PI/2;fp.push([Math.cos(a)*105,Math.sin(a)*105])}for(let i=0;i<30;i++){poly([[fp[i][0],fp[i][1],0],[fp[i+1][0],fp[i+1][1],0],[fp[i+1][0],fp[i+1][1],3],[fp[i][0],fp[i][1],3]],'#14532d')}
 if(!crowdPat)makeCrowd();for(let i=0;i<30;i++){poly([[fp[i][0]*1.05,fp[i][1]*1.05,3],[fp[i+1][0]*1.05,fp[i+1][1]*1.05,3],[fp[i+1][0]*1.25,fp[i+1][1]*1.25,22],[fp[i][0]*1.25,fp[i][1]*1.25,22]],crowdPat)}
 lineStyle('#fff',.1);seg(0,0,80,80);seg(0,0,-80,80);g2.stroke();[[19.4,19.4],[0,38.8],[-19.4,19.4]].forEach(([x,y])=>poly([[x-.25,y-.25,0],[x+.25,y-.25,0],[x+.25,y+.25,0],[x-.25,y+.25,0]],'#fff'));poly([[-.22,0,0],[.22,0,0],[.22,.22,0],[0,.43,0],[-.22,.22,0]],'#fff')}

function drawActor(a,kit){if(a.ghost){g2.globalAlpha=.3;drawActor2(a,kit);g2.globalAlpha=1;return}drawActor2(a,kit)}
function drawActor2(a,kit){const p=P(a.x,a.y,a.z||0),h=P(a.x,a.y,(a.z||0)+(a.h||1.8));if(!p||!h)return;const hp=p.y-h.y,w=hp*.3,sh=P(a.x,a.y,0);
 if(sh){g2.fillStyle='rgba(0,0,0,.35)';g2.beginPath();g2.ellipse(sh.x,sh.y,w*.9,w*.25,0,0,7);g2.fill()}
 if(a.hl&&sh){g2.strokeStyle='#ffd166';g2.lineWidth=Math.max(1.5,w*.12);g2.beginPath();g2.ellipse(sh.x,sh.y,w*1.25,w*.4,0,0,7);g2.stroke()}
 const ph=a.run?Math.sin(performance.now()/90+a.x*3)*w*.18:0,jer=a.gk?(a.team==='A'?'#10b981':'#f97316'):kit.jersey,x=p.x,y=p.y,lean=(a.lean||0)*w;
 g2.fillStyle=kit.pants;g2.fillRect(x-w*.42+ph+lean*.3,y-hp*.46,w*.34,hp*.46);g2.fillRect(x+w*.08-ph+lean*.3,y-hp*.46,w*.34,hp*.46);
 g2.fillStyle=jer;g2.beginPath();g2.roundRect?g2.roundRect(x-w/2+lean,y-hp*.84,w,hp*.42,w*.2):g2.rect(x-w/2+lean,y-hp*.84,w,hp*.42);g2.fill();g2.fillStyle=kit.trim;g2.fillRect(x-w/2+lean,y-hp*.84,w,hp*.05);
 g2.strokeStyle=SKIN[a.skin||0];g2.lineWidth=Math.max(1,w*.17);g2.lineCap='round';g2.beginPath();const ar=a.arms||0;g2.moveTo(x-w*.5+lean,y-hp*.78);g2.lineTo(x-w*.75+lean,y-hp*(.55+ar*.45));g2.moveTo(x+w*.5+lean,y-hp*.78);g2.lineTo(x+w*.75+lean,y-hp*(.55+ar*.45));g2.stroke();
 g2.fillStyle=SKIN[a.skin||0];g2.beginPath();g2.arc(x+lean,y-hp*.92,hp*.085,0,7);g2.fill();
 if(a.tool){g2.strokeStyle=a.tool;g2.lineWidth=Math.max(1,w*.12);g2.beginPath();g2.moveTo(x+w*.75+lean,y-hp*.6);g2.lineTo(x+w*1.2+lean,y-hp*(a.toolUp?1.05:.25));g2.stroke()}
 if(hp>34*DPR&&a.no!=null){g2.fillStyle=kit.textCol;g2.font='900 '+Math.round(hp*.17)+'px system-ui';g2.textAlign='center';g2.fillText(a.no,x+lean,y-hp*.56)}
 if(a.tag&&hp>18*DPR){g2.font='800 '+Math.round(Math.max(10*DPR,hp*.13))+'px system-ui';g2.textAlign='center';const t=a.tag,tw=g2.measureText(t).width+8*DPR;g2.fillStyle='rgba(6,13,31,.8)';g2.fillRect(x-tw/2,y-hp*1.18,tw,hp*.17+4*DPR);g2.fillStyle='#ffd166';g2.fillText(t,x,y-hp*1.04)}}
function drawBall(b,B){if(!b||!b.vis)return;const p=P(b.x,b.y,b.z),s=P(b.x,b.y,0);if(!p)return;const r=Math.max(1.6*DPR,B.r*p.s);
 if(s){g2.fillStyle='rgba(0,0,0,'+clamp(.45-b.z*.04,.08,.45)+')';g2.beginPath();g2.ellipse(s.x,s.y,r*1.1,r*.4,0,0,7);g2.fill()}
 if(b.trail){g2.strokeStyle='rgba(255,255,255,.35)';g2.lineWidth=Math.max(1,r*.6);g2.beginPath();b.trail.forEach((t,i)=>{const q=P(t[0],t[1],t[2]);if(q)i?g2.lineTo(q.x,q.y):g2.moveTo(q.x,q.y)});g2.stroke()}
 g2.fillStyle=B.c;g2.beginPath();if(B.puck)g2.ellipse(p.x,p.y,r*1.3,r*.5,0,0,7);else if(B.oval)g2.ellipse(p.x,p.y,r*1.35,r*.85,.6,0,7);else g2.arc(p.x,p.y,r,0,7);g2.fill();
 if(B.shuttle){g2.fillStyle='#e5e7eb';g2.beginPath();g2.moveTo(p.x-r,p.y);g2.lineTo(p.x-r*2.6,p.y-r*1.6);g2.lineTo(p.x+r*.6,p.y-r*1.9);g2.closePath();g2.fill()}
 if(!B.puck&&!B.shuttle){g2.strokeStyle='rgba(0,0,0,.35)';g2.lineWidth=Math.max(.8,r*.14);g2.stroke()}}

function render(){fitCanvas();if(!M){requestAnimationFrame(render);return}const sc=M.scene,now=performance.now();
 for(const a of M.anims.slice()){const k=clamp((now-a.t0)/a.dur,0,1);try{a.fn(k)}catch(e){}if(k>=1){M.anims.splice(M.anims.indexOf(a),1);a.res()}}
 if(M.ad.draw2d){M.ad.draw2d(g2,CW,CH,now);requestAnimationFrame(render);return}
 const v=sc.view,t=sc.viewT;v.y0=lerp(v.y0,t.y0,.06);v.Lv=lerp(v.Lv,t.Lv,.06);v.x=lerp(v.x||0,t.x||0,.06);v.h=lerp(v.h||1,t.h||1,.06);v.anchor=t.anchor;
 setCam(v);drawSky();const F=SPORTS[M.sp].field;drawField(F);
 const items=sc.actors.map(a=>({y:a.y,a})).concat(sc.ball&&sc.ball.vis?[{y:sc.ball.y,b:1}]:[]);items.sort((p,q)=>q.y-p.y);
 for(const it of items){if(it.b)drawBall(sc.ball,SPORTS[M.sp].ball);else drawActor(it.a,it.a.team==='A'?M.kitA:M.kitB)}
 requestAnimationFrame(render)}
function anim(dur,fn){live();return new Promise(res=>{M.anims.push({t0:performance.now(),dur:(M.auto?dur*.6:dur)*1000,fn,res})})}
function arcPos(a,b,k,h){return[lerp(a[0],b[0],k),lerp(a[1],b[1],k),lerp(a[2]||0,b[2]||0,k)+Math.sin(Math.PI*k)*h]}
async function flyBall(from,to,dur,h,trail){const b=M.scene.ball;b.vis=true;b.trail=trail?[]:null;await anim(dur,k=>{const p=arcPos(from,to,k,h);b.x=p[0];b.y=p[1];b.z=Math.max(0,p[2]);if(b.trail){b.trail.push([b.x,b.y,b.z]);if(b.trail.length>18)b.trail.shift()}});b.trail=null}
function moveActor(a,tx,ty,dur,extra){const sx=a.x,sy=a.y;a.run=true;return anim(dur,k=>{const e=ease(k);a.x=lerp(sx,tx,e);a.y=lerp(sy,ty,e);if(extra)extra(k);if(k>=1)a.run=false})}
function view(y0,Lv,x,h,anchor){M.scene.viewT={y0,Lv,x:x||0,h:h||1,anchor}}
function snapView(){Object.assign(M.scene.view,M.scene.viewT)}
function mkActor(team,x,y,o){return Object.assign({team,x,y,z:0,skin:(Math.abs(Math.round(x*7+y*3)))%SKIN.length},o||{})}
