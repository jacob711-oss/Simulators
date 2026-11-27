/* ================= rendering ================= */
const cv=$('world'),ctx=cv.getContext('2d');let W=0,H=0,DPR=1;
const cam={x:GW*CELL/2,y:GH*CELL/2,z:1,ox:0};
// terrain: every cell gets a colour and a slope shade; the visible area is then drawn pixel by pixel at screen
// resolution, with wobbly (not blocky) borders between cells and fine surface detail, so it stays sharp at any zoom
const img={data:new Uint8ClampedArray(N*4)},SH=new Float32Array(N),LC=new Float32Array(N*3),WC=new Float32Array(N*3);
function tileNoise(seed,blur,passes){const r=seeded(seed),T=new Float32Array(65536);for(let i=0;i<65536;i++)T[i]=r();const tmp=new Float32Array(65536);
  for(let p=0;p<passes;p++){for(let y=0;y<256;y++)for(let x=0;x<256;x++){let s=0;for(let k=-blur;k<=blur;k++)s+=T[y*256+((x+k)&255)];tmp[y*256+x]=s/(2*blur+1)}
    for(let y=0;y<256;y++)for(let x=0;x<256;x++){let s=0;for(let k=-blur;k<=blur;k++)s+=tmp[((y+k)&255)*256+x];T[y*256+x]=s/(2*blur+1)}}
  let mn=1,mx=0;for(const v of T){if(v<mn)mn=v;if(v>mx)mx=v}for(let i=0;i<65536;i++)T[i]=(T[i]-mn)/(mx-mn);return T}
const WARPX=tileNoise(3,6,2),WARPY=tileNoise(4,6,2),DET1=tileNoise(5,2,1),DET2=tileNoise(6,1,1);
// The ground is redrawn as a background job a few rows at a time, over an area a little larger than the screen.
// Every frame just shows the latest finished picture, shifted and scaled to the current camera, so moving stays smooth.
const tvFront=document.createElement('canvas'),tvfx=tvFront.getContext('2d'),tvBack=document.createElement('canvas'),tvbx=tvBack.getContext('2d');
let tvInfo=null,tvJob=null,tvStill=0,tvLastFull=0;
function startTerrainJob(RS){const M=RS>0.9?0.08:0.18,w=Math.max(1,Math.ceil(W*(1+2*M)*RS)),h=Math.max(1,Math.ceil(H*(1+2*M)*RS));
  if(tvBack.width!==w||tvBack.height!==h){tvBack.width=w;tvBack.height=h}
  const inv=1/(cam.z*RS*CELL);tvJob={w,h,RS,inv,wx0:wxOf(-W*M),wy0:wyOf(-H*M),row:0,img:tvbx.createImageData(w,h),cam:{z:cam.z,x:cam.x,y:cam.y,ox:cam.ox,W,H}}}
function stepTerrainJob(budget){const J=tvJob;if(!J)return;const t0=performance.now(),D=J.img.data,C=img.data,inv=J.inv,wx0=J.wx0,wy0=J.wy0,w=J.w,nat=S.view==='normal';
  const a1=nat?0.10*clamp(1-inv*5,0,1):0,a2=nat?0.12*clamp(1-inv*24,0,1):0,wa=clamp(1-inv*2,0,1),sl=sea(),edge=Math.max(0.0015,inv*0.012);
  let py=J.row,q=py*w*4;
  for(;py<J.h;py++){const wy=wrapY(wy0+py*inv);
    for(let px=0;px<w;px++,q+=4){const wx=wrapX(wx0+px*inv);
      const fx=wx-.5,fy=wy-.5,x0=fx<0?0:fx|0,y0=fy<0?0:fy|0,x1=x0<GW-1?x0+1:0,y1=y0<GH-1?y0+1:0,tx=fx-x0<0?0:fx-x0>1?1:fx-x0,ty=fy-y0<0?0:fy-y0>1?1:fy-y0;
      const i00=y0*GW+x0,i10=y0*GW+x1,i01=y1*GW+x0,i11=y1*GW+x1,w00=(1-tx)*(1-ty),w10=tx*(1-ty),w01=(1-tx)*ty,w11=tx*ty;
      const ti=(((wy*3)|0)&255)*256+(((wx*3)|0)&255);
      const hb=hgt[i00]*w00+hgt[i10]*w10+hgt[i01]*w01+hgt[i11]*w11+(WARPX[ti]-.5)*0.03*wa;
      // 0 = land, 1 = water, with a one-pixel soft edge
      let wt=(sl-hb)/edge+0.5;wt=wt<0?0:wt>1?1:wt;
      let f=SH[i00]*w00+SH[i10]*w10+SH[i01]*w01+SH[i11]*w11;
      if(a1)f*=1+(DET1[(((wy*5)|0)&255)*256+(((wx*5)|0)&255)]-.5)*2*a1;if(a2)f*=1+(DET2[(((wy*26)|0)&255)*256+(((wx*26)|0)&255)]-.5)*2*a2;
      const fw=nat?1+(DET1[(((wy*3)|0)&255)*256+(((wx*3)|0)&255)]-.5)*0.08*wa:1;
      const j00=i00*3,j10=i10*3,j01=i01*3,j11=i11*3;
      for(let k=0;k<3;k++){const l=(LC[j00+k]*w00+LC[j10+k]*w10+LC[j01+k]*w01+LC[j11+k]*w11)*f,wv=(WC[j00+k]*w00+WC[j10+k]*w10+WC[j01+k]*w01+WC[j11+k]*w11)*fw;D[q+k]=l+(wv-l)*wt}
      D[q+3]=255}
    if((py&7)===7&&performance.now()-t0>budget){py++;break}}
  J.row=py;if(py>=J.h){tvbx.putImageData(J.img,0,0);if(tvFront.width!==J.w||tvFront.height!==J.h){tvFront.width=J.w;tvFront.height=J.h}tvfx.drawImage(tvBack,0,0);
    tvInfo={wx0:J.wx0,wy0:J.wy0,inv:J.inv,RS:J.RS,...J.cam};tvJob=null}}
function drawTerrain(now){const hi=Math.min(DPR,Math.sqrt(4000000/(W*H))),lo=Math.min(hi,Math.sqrt(300000/(W*H)));
  const c=tvInfo,moved=!c||c.z!==cam.z||c.x!==cam.x||c.y!==cam.y||c.ox!==cam.ox||c.W!==W||c.H!==H;
  if(moved)tvStill=now;
  if(S.tvNow&&c){// something the player did changed the ground: show it straight away
    S.tvNow=false;if(S.terrainDirty){paintTerrain();S.terrainDirty=false}startTerrainJob(lo);stepTerrainJob(1e9);tvStill=now}
  else if(!c){startTerrainJob(lo);stepTerrainJob(1e9)}
  else{// how stale is what we have?
    // redraw as soon as any part of the screen is no longer covered by the picture we have
    const k=cam.z/c.z,gone=k>1.7||k<0.6||wxOf(0)<c.wx0||wyOf(0)<c.wy0||wxOf(W)>c.wx0+tvFront.width*c.inv||wyOf(H)>c.wy0+tvFront.height*c.inv;
    if(!tvJob){if(moved&&gone)startTerrainJob(lo);else if(!moved&&now-tvStill>90&&(c.RS<hi||c.z!==cam.z||c.x!==cam.x||c.y!==cam.y))startTerrainJob(hi);else if(S.tvDirty&&now-tvLastFull>2500&&!moved){startTerrainJob(hi);S.tvDirty=false;tvLastFull=now}}
    else if(moved&&tvJob.RS>lo&&gone){startTerrainJob(lo)}
    stepTerrainJob(tvJob&&tvJob.RS<=lo+1e-9?8:4)}
  const ci=tvInfo,k=ci.inv*CELL*cam.z;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality=ci.RS<hi?'low':'high';ctx.drawImage(tvFront,sxr(ci.wx0),syr(ci.wy0),tvFront.width*k,tvFront.height*k)}
let texPat=null;
function measureHud(){const e=document.querySelector('.hud-top');if(e)document.documentElement.style.setProperty('--hudH',e.offsetHeight+'px')}
function resize(){measureHud();DPR=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0)}
const nX=x=>x+GW*Math.round((cam.x/CELL-x)/GW),nY=y=>y+GH*Math.round((cam.y/CELL-y)/GH);
const sxr=wx=>(wx*CELL-cam.x)*cam.z+W/2+cam.ox,syr=wy=>(wy*CELL-cam.y)*cam.z+H/2;
const sx=wx=>sxr(nX(wx)),sy=wy=>syr(nY(wy));
const inV=(x,y)=>{const X=sx(x),Y=sy(y);return X>-60&&X<W+60&&Y>-60&&Y<H+60};
const wxOf=px=>((px-W/2-cam.ox)/cam.z+cam.x)/CELL,wyOf=py=>((py-H/2)/cam.z+cam.y)/CELL;
function fitWorld(){cam.z=Math.min(W/(GW*CELL),H/(GH*CELL))*1.02;cam.x=GW*CELL/2;cam.y=GH*CELL/2}
function zoomAt(f,px,py){const wx=wxOf(px),wy=wyOf(py);cam.z=clamp(cam.z*f,Math.min(W/(GW*CELL),H/(GH*CELL))*0.98,14);cam.x=wx*CELL-(px-W/2-cam.ox)/cam.z;cam.y=wy*CELL-(py-H/2)/cam.z;S.follow=false}
function heatCol(t){// -30..45 °C
  const u=clamp((t+30)/75,0,1);const st=[[40,60,170],[60,150,220],[120,200,140],[240,220,90],[235,120,50],[180,30,40]];const f=u*(st.length-1),k=Math.min(st.length-2,f|0),q=f-k;return st[k].map((c,j)=>c+(st[k+1][j]-c)*q)}
function paintTerrain(i0=0,i1=N){const d=img.data,s=sea(),v=S.view;
  for(let i=i0;i<i1;i++){const x=i%GW,y=(i/GW)|0,h=hgt[i];let r,g,b;
    const hl=hgt[idx(x-1,y-1)],hr=hgt[idx(x+1,y+1)];const shade=1+clamp((hl-hr)*11,-.38,.38);
    if(v==='temp'){[r,g,b]=heatCol(cellT(i));if(h<s){r*=.7;g*=.7;b*=.8}}
    else if(v==='rain'){const R=clamp(rainAt(i)/1.4,0,1);r=lerp(200,30,R);g=lerp(170,110,R);b=lerp(110,220,R);if(h<s){r=20;g=40;b=80}}
    else if(v==='microbe'){const m=mic[i];if(h<s){r=lerp(10,40,m);g=lerp(30,200,m);b=lerp(70,170,m)}else{const f=Math.min(1,fert[i]);r=lerp(40,190,m)*(0.8+0.2*f);g=lerp(30,90,m)+f*60;b=lerp(28,230,m)}}
    else if(v==='food'){if(h<s){const a=alg[i];r=10;g=30+a*120;b=60+a*80}else{const f=veg[i];r=lerp(60,40,f);g=lerp(45,210,f);b=lerp(35,60,f)}}
    else if(h<s){const dep=clamp((s-h)/0.12,0,1),T=cellT(i),a=alg[i];r=lerp(62,14,dep);g=lerp(140,48,dep);b=lerp(160,92,dep);g+=a*22*(1-dep*0.5);r-=a*8;
      if(T<-3){const ice=clamp((-3-T)/6,0,1)*(dep<0.7?1:0.4);r=lerp(r,214,ice);g=lerp(g,228,ice);b=lerp(b,238,ice)}}
    else{const T=cellT(i),Tm=meanT(i),R=rainAt(i),ek=elevKm(i),f=veg[i];
      const sand=h<s+0.012||(R<0.22&&Tm>8);let br,bg,bb;if(sand){br=214;bg=192;bb=140}else if(ek>3){br=118;bg=112;bb=104}else if(Tm<-6){br=138;bg=134;bb=118}else{br=116;bg=94;bb=66}
      let gr,gg,gb;if(Tm>24&&R>0.8){gr=34;gg=104;gb=40}else if(Tm>20&&R<0.55){gr=164;gg=156;gb=74}else if(Tm<2){gr=74;gg=104;gb=60}else if(R>0.75){gr=52;gg=110;gb=44}else{gr=104;gg=146;gb=58}
      const t=clamp(f*1.15,0,1);r=lerp(br,gr,t);g=lerp(bg,gg,t);b=lerp(bb,gb,t);
      if(scar[i]>0){const c=scar[i]*0.8;r=lerp(r,34,c);g=lerp(g,30,c);b=lerp(b,26,c)}
      if(T<-3||ek>3.8){const sn=clamp(Math.max((-3-T)/4,(ek-3.8)*1.5),0,1)*(R>0.12?1:0.4);r=lerp(r,238,sn);g=lerp(g,242,sn);b=lerp(b,246,sn)}
      }
    SH[i]=v!=='normal'||h<s?1:shade;const o=i*4;d[o]=r;d[o+1]=g;d[o+2]=b;d[o+3]=255;const o3=i*3;
    if(v!=='normal'){LC[o3]=WC[o3]=r;LC[o3+1]=WC[o3+1]=g;LC[o3+2]=WC[o3+2]=b}
    else if(h<s){WC[o3]=r;WC[o3+1]=g;WC[o3+2]=b;LC[o3]=214;LC[o3+1]=196;LC[o3+2]=146}
    else{LC[o3]=r;LC[o3+1]=g;LC[o3+2]=b;const T=cellT(i);if(T<-3){WC[o3]=214;WC[o3+1]=228;WC[o3+2]=238}else{WC[o3]=70;WC[o3+1]=150;WC[o3+2]=168}}}
  S.terrainDirty=false;S.tvDirty=true}
function drawTree(t,X,Y,z){const k=TK[t.k];if(t.size<0.3){const q=Math.max(1.6,(0.5+t.size*2)*z*CELL*0.45);ctx.strokeStyle='#5a4228';ctx.lineWidth=Math.max(.8,q*.18);ctx.beginPath();ctx.moveTo(X,Y+q*.6);ctx.lineTo(X,Y-q*.2);ctx.stroke();ctx.fillStyle=t.k==='pine'?'#2e5a33':t.k==='cactus'?'#5c8a4b':'#6aa848';ctx.beginPath();ctx.ellipse(X-q*.35,Y-q*.3,q*.45,q*.22,-.5,0,TAU);ctx.ellipse(X+q*.35,Y-q*.4,q*.45,q*.22,.5,0,TAU);ctx.fill();return}
  const s=(0.45+t.size*0.75)*z*CELL;
  ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(X+s*0.35,Y+s*0.4,s*1.05,s*0.75,0,0,TAU);ctx.fill();
  if(t.k==='pine'){ctx.fillStyle='#1d3a22';ctx.beginPath();for(let q=0;q<16;q++){const a=q/16*TAU+t.rot,r=q%2?s*0.55:s*1.05;ctx.lineTo(X+Math.cos(a)*r,Y+Math.sin(a)*r)}ctx.fill();ctx.fillStyle='#2e5a33';ctx.beginPath();ctx.arc(X-s*.12,Y-s*.12,s*.45,0,TAU);ctx.fill()}
  else if(t.k==='palm'){ctx.strokeStyle='#4f7d2c';ctx.lineWidth=Math.max(1,s*0.28);ctx.lineCap='round';for(let q=0;q<7;q++){const a=q/7*TAU+t.rot;ctx.beginPath();ctx.moveTo(X,Y);ctx.quadraticCurveTo(X+Math.cos(a+.3)*s*.8,Y+Math.sin(a+.3)*s*.8,X+Math.cos(a)*s*1.3,Y+Math.sin(a)*s*1.3);ctx.stroke()}ctx.fillStyle='#6b5333';ctx.beginPath();ctx.arc(X,Y,s*.2,0,TAU);ctx.fill()}
  else if(t.k==='cactus'){ctx.fillStyle='#5c8a4b';const w=s*.32;ctx.beginPath();ctx.roundRect(X-w,Y-s*.9,w*2,s*1.8,w);ctx.fill();ctx.beginPath();ctx.roundRect(X-s*.85,Y-s*.25,s*.6,w*1.4,w*.6);ctx.fill();ctx.beginPath();ctx.roundRect(X+s*.25,Y-s*.55,s*.6,w*1.4,w*.6);ctx.fill();ctx.fillStyle='rgba(255,255,255,.15)';ctx.fillRect(X-w*.4,Y-s*.8,w*.3,s*1.5)}
  else{const g=ctx.createRadialGradient(X-s*.35,Y-s*.35,s*.1,X,Y,s*1.05);const c=t.k==='bush'?['#5b8a48','#2c4a27']:['#5f9443','#2c4f25'];g.addColorStop(0,c[0]);g.addColorStop(1,c[1]);ctx.fillStyle=g;ctx.beginPath();ctx.arc(X,Y,s*(t.k==='bush'?.7:1),0,TAU);ctx.fill();
    if(t.k==='bush'&&t.fruit>0.25&&z>0.8){ctx.fillStyle='#5560c8';for(let q=0;q<Math.round(t.fruit*6);q++){const a=q*2.4+t.rot;ctx.beginPath();ctx.arc(X+Math.cos(a)*s*.4,Y+Math.sin(a)*s*.4,Math.max(1,s*.1),0,TAU);ctx.fill()}}}
  if(t.hp<0.6){ctx.fillStyle=`rgba(150,120,60,${(0.6-t.hp)*0.9})`;ctx.beginPath();ctx.arc(X,Y,s*.9,0,TAU);ctx.fill()}}
function drawAnimal(a,X,Y,z,big){if(a.hidden&&!big){ctx.globalAlpha=.35;try{return drawAnimal_(a,X,Y,z,big)}finally{ctx.globalAlpha=1}}return drawAnimal_(a,X,Y,z,big)}
function drawAnimal_(a,X,Y,z,big){const s=SP[a.sp],k=(a.age<s.mature?0.55+0.45*a.age/s.mature:1)*Math.pow(a.genes.size,.6);let L=s.len*k*z*(big||1)*0.9,Wd=L*s.wid;
  if(!big&&L<5.5){const r=z<0.45?2:2.8;ctx.fillStyle='rgba(0,0,0,.55)';ctx.beginPath();ctx.arc(X,Y,r+1,0,TAU);ctx.fill();ctx.fillStyle=SPCOL[a.sp];ctx.beginPath();ctx.arc(X,Y,r,0,TAU);ctx.fill();return}
  if(!big&&L<9){const f=9/L;L*=f;Wd*=f}
  ctx.save();ctx.translate(X,Y);ctx.rotate(a.dir);
  if(s.hab==='air'){const sh=L*0.9;ctx.fillStyle='rgba(0,0,0,.2)';ctx.save();ctx.translate(sh,sh);hawkShape(L);ctx.fill();ctx.restore();ctx.fillStyle=a.col;hawkShape(L);ctx.fill();ctx.fillStyle='#e8e0d0';ctx.beginPath();ctx.arc(L*.42,0,L*.1,0,TAU);ctx.fill();ctx.restore();return}
  if(s.hab!=='water'){ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(L*.08,L*.12,L*.55,Wd*.6,0,0,TAU);ctx.fill()}
  ctx.fillStyle=a.col;
  if(s.shape==='human'&&(a.state==='hunt'||a.state==='track'||a.state==='pack')){const f=.6+.4*Math.sin(performance.now()/90+a.id);ctx.fillStyle=`rgba(255,${150+60*f|0},50,.95)`;ctx.beginPath();ctx.arc(L*.75,-Wd*.6,Math.max(1.5,L*.14*f),0,TAU);ctx.fill()}
  if(s.shape==='human'&&a.boat&&big!==2){const j=idx(a.x,a.y);if(j>=0&&isWater(j)){ctx.fillStyle='#7a5530';ctx.strokeStyle='#3e2a16';ctx.lineWidth=Math.max(1,L*.06);ctx.beginPath();ctx.moveTo(L*1.1,0);ctx.quadraticCurveTo(L*.4,-Wd*1.6,-L*.9,-Wd*1.1);ctx.lineTo(-L*.9,Wd*1.1);ctx.quadraticCurveTo(L*.4,Wd*1.6,L*1.1,0);ctx.fill();ctx.stroke();ctx.strokeStyle='#c8a070';ctx.beginPath();ctx.moveTo(-L*.1,-Wd*1.9);ctx.lineTo(-L*.1,Wd*1.9);ctx.stroke()}}
  if(s.shape==='human'){ctx.strokeStyle='#5a4028';ctx.lineWidth=Math.max(1,L*.07);ctx.beginPath();ctx.moveTo(-L*.5,Wd*.55);ctx.lineTo(L*.75,Wd*.55);ctx.stroke();ctx.fillStyle='#8a6a48';ctx.beginPath();ctx.ellipse(0,0,L*.22,Wd*.75,0,0,TAU);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.55)';ctx.lineWidth=Math.max(.8,L*.05);ctx.stroke();ctx.fillStyle=a.col;ctx.beginPath();ctx.arc(L*.05,0,Wd*.42,0,TAU);ctx.fill();ctx.stroke();ctx.restore();return}
  if(s.shape==='snake'){ctx.strokeStyle=a.col;ctx.lineCap='round';ctx.lineWidth=Math.max(1.2,Wd);ctx.beginPath();for(let q=0;q<=8;q++){const t=q/8,xx=L*(0.5-t),yy=Math.sin(t*9+S.t*4+a.id)*L*.08;q?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)}ctx.stroke();ctx.restore();return}
  if(s.shape==='fish'){ctx.globalAlpha=.9;ctx.beginPath();ctx.ellipse(0,0,L/2,Wd/2,0,0,TAU);ctx.fill();ctx.beginPath();ctx.moveTo(-L*.4,0);ctx.lineTo(-L*.75,-Wd*.6);ctx.lineTo(-L*.75,Wd*.6);ctx.fill();ctx.globalAlpha=1;ctx.restore();return}
  // tail
  if(a.sp==='fox'||a.sp==='wolf'||a.sp==='lion'||a.sp==='otter'){ctx.strokeStyle=a.col;ctx.lineWidth=Math.max(1,Wd*(a.sp==='fox'?.45:.25));ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-L*.4,0);ctx.quadraticCurveTo(-L*.65,Wd*.3*Math.sin(S.t*3+a.id),-L*(a.sp==='fox'?.85:.75),0);ctx.stroke()}
  ctx.beginPath();ctx.ellipse(0,0,L/2,Wd/2,0,0,TAU);ctx.fill();if(a.age>a.life*0.8){ctx.fillStyle='rgba(200,200,200,.35)';ctx.fill();ctx.fillStyle=a.col}ctx.strokeStyle='rgba(0,0,0,.55)';ctx.lineWidth=Math.max(.8,L*.05);ctx.stroke();
  if(a.sp==='zebra'&&L>6){ctx.strokeStyle='#222';ctx.lineWidth=Math.max(.6,L*.04);for(let q=-3;q<=3;q++){ctx.beginPath();ctx.moveTo(q*L*.1,-Wd*.45);ctx.lineTo(q*L*.1+L*.03,Wd*.45);ctx.stroke()}}
  if(a.sp==='camel'){ctx.fillStyle='rgba(120,85,40,.45)';ctx.beginPath();ctx.arc(-L*.05,0,Wd*.35,0,TAU);ctx.fill();ctx.fillStyle=a.col}
  const hx=L*.5,hr=Wd*.42;ctx.fillStyle=shadeCol(a.col,-18);ctx.beginPath();ctx.arc(hx,0,hr,0,TAU);ctx.fill();ctx.stroke();
  if(a.sp==='rabbit'){ctx.beginPath();ctx.ellipse(hx-hr*.4,-hr*.7,hr*1,hr*.32,-.5,0,TAU);ctx.ellipse(hx-hr*.4,hr*.7,hr*1,hr*.32,.5,0,TAU);ctx.fill()}
  if(a.sp==='deer'&&a.sex==='m'&&a.age>s.mature){ctx.strokeStyle='#d8c6a0';ctx.lineWidth=Math.max(.6,L*.04);ctx.beginPath();ctx.moveTo(hx,-hr*.5);ctx.lineTo(hx-hr,-hr*1.8);ctx.moveTo(hx,hr*.5);ctx.lineTo(hx-hr,hr*1.8);ctx.stroke()}
  if(a.sp==='lion'&&a.sex==='m'&&a.age>s.mature){ctx.fillStyle='#8a5a28';ctx.beginPath();ctx.arc(hx-hr*.2,0,hr*1.45,0,TAU);ctx.fill();ctx.fillStyle=shadeCol(a.col,-10);ctx.beginPath();ctx.arc(hx+hr*.1,0,hr*.9,0,TAU);ctx.fill()}
  if(a.sick>0&&big!==2){ctx.fillStyle='rgba(140,220,90,.6)';ctx.beginPath();ctx.arc(0,0,L*.32,0,TAU);ctx.fill();ctx.strokeStyle='rgba(150,255,90,.9)';ctx.lineWidth=Math.max(1,L*.08);ctx.beginPath();ctx.arc(0,0,L*.62,0,TAU);ctx.stroke()}
  ctx.restore()}
// colour animals by a gene, to watch evolution spread across the map
function geneColor(a){const k=S.geneView,G=a.genes;if(k==='coat'){const c=coatOf(G);return c==='white'?'#ffffff':c==='dark'?'#222':(G.coat||'').includes('w')?'#ffd27a':'#c08850'}
  const def=GENES.find(x=>x[0]===k),v=k==='fur'||k==='heat'?(G[k]??0)/15:((G[k]??1)-1)/((def?def[3]:2)-1);const t=clamp(0.5+v*1.4,0,1);return `rgb(${Math.round(lerp(60,255,t))},${Math.round(lerp(120,90,Math.abs(t-.5)*2))},${Math.round(lerp(255,60,t))})`}
function drawGeneView(vx0,vx1,vy0,vy1,z){const r=Math.max(2.5,z*3.2);for(const a of S.animals){if(a.dead||!inV(a.x,a.y))continue;ctx.strokeStyle=geneColor(a);ctx.lineWidth=Math.max(1.5,z*.9);ctx.beginPath();ctx.arc(sx(a.x),sy(a.y),r+SP[a.sp].len*z*0.35,0,TAU);ctx.stroke()}}
const BADGES={};
function badge(sp){let c=BADGES[sp];if(c)return c;c=document.createElement('canvas');c.width=c.height=36;const g=c.getContext('2d');g.fillStyle='rgba(8,14,11,.62)';g.beginPath();g.arc(18,18,16,0,TAU);g.fill();g.font='22px system-ui,"Apple Color Emoji","Segoe UI Emoji"';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#fff';g.fillText(SP[sp].ic,18,20);BADGES[sp]=c;return c}
function drawHome(h,X,Y,z){const r=Math.max(2.5,CELL*z*0.75),k=h.hk;ctx.save();ctx.globalAlpha=h.prog<1?0.35+0.55*h.prog:1;
  if(k==='burrow'){ctx.fillStyle='#8a6a46';ctx.beginPath();ctx.ellipse(X,Y,r,r*0.75,0,0,TAU);ctx.fill();ctx.fillStyle='#1a120c';ctx.beginPath();ctx.ellipse(X,Y+r*.08,r*.5,r*.36,0,0,TAU);ctx.fill()}
  else if(k==='nest'){ctx.strokeStyle='#8a6a3a';ctx.lineWidth=Math.max(1.2,r*.32);ctx.beginPath();ctx.arc(X,Y,r*.62,0,TAU);ctx.stroke();ctx.strokeStyle='#5a4228';ctx.lineWidth=Math.max(.6,r*.1);ctx.beginPath();ctx.arc(X,Y,r*.8,0,TAU);ctx.stroke();if(h.prog>=1&&z>1.2){ctx.fillStyle='#f4efe4';for(let q=0;q<3;q++){ctx.beginPath();ctx.ellipse(X+(q-1)*r*.22,Y+(q%2)*r*.1,r*.15,r*.2,0,0,TAU);ctx.fill()}}}
  else if(k==='den'){ctx.fillStyle='#6f6a62';for(const [dx,dy,rr2] of [[-.45,.1,.55],[.4,.05,.6],[0,-.35,.6]]){ctx.beginPath();ctx.arc(X+dx*r,Y+dy*r,rr2*r,0,TAU);ctx.fill()}ctx.fillStyle='#14100c';ctx.beginPath();ctx.ellipse(X,Y+r*.25,r*.38,r*.3,0,0,TAU);ctx.fill()}
  else if(k==='lodge'){ctx.fillStyle='#6a4a2a';ctx.beginPath();ctx.ellipse(X,Y,r*1.2,r*.95,0,0,TAU);ctx.fill();ctx.strokeStyle='#3e2a16';ctx.lineWidth=Math.max(.6,r*.1);for(let q=0;q<6;q++){const a2=q/6*Math.PI;ctx.beginPath();ctx.moveTo(X-Math.cos(a2)*r,Y-Math.sin(a2)*r*.8);ctx.lineTo(X+Math.cos(a2)*r,Y+Math.sin(a2)*r*.8);ctx.stroke()}}
  else if(k==='hut'){ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(X+r*.3,Y+r*.35,r*1.3,r*1,0,0,TAU);ctx.fill();ctx.fillStyle='#b8925a';ctx.beginPath();ctx.arc(X,Y,r*1.25,0,TAU);ctx.fill();ctx.strokeStyle='#7a5a30';ctx.lineWidth=Math.max(.6,r*.08);for(let q=0;q<10;q++){const a2=q/10*TAU;ctx.beginPath();ctx.moveTo(X,Y);ctx.lineTo(X+Math.cos(a2)*r*1.25,Y+Math.sin(a2)*r*1.25);ctx.stroke()}ctx.fillStyle='#e8c070';ctx.beginPath();ctx.arc(X,Y,r*.22,0,TAU);ctx.fill();
    if(h.prog>=1){const f=.6+.4*Math.sin(performance.now()/120+h.id);ctx.fillStyle=`rgba(255,${130+70*f|0},40,.9)`;ctx.beginPath();ctx.arc(X+r*1.9,Y+r*.6,r*.3*f+1,0,TAU);ctx.fill()}}
  else if(k==='hive'){ctx.fillStyle='#e0b040';ctx.beginPath();for(let q=0;q<6;q++){const a2=q/6*TAU;ctx.lineTo(X+Math.cos(a2)*r*.8,Y+Math.sin(a2)*r*.8)}ctx.closePath();ctx.fill();ctx.strokeStyle='#8a6a20';ctx.lineWidth=1;ctx.stroke()}
  else if(k==='anthill'){ctx.fillStyle='#a0784a';ctx.beginPath();ctx.ellipse(X,Y,r,r*.8,0,0,TAU);ctx.fill();ctx.fillStyle='#6a4a2a';ctx.beginPath();ctx.arc(X,Y,r*.2,0,TAU);ctx.fill()}
  ctx.restore();if(S.sel===h){ctx.strokeStyle='#ffc35a';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(X,Y,r*1.6+4,0,TAU);ctx.stroke()}}
function hawkShape(L){ctx.beginPath();ctx.moveTo(L*.5,0);ctx.lineTo(L*.05,-L*.12);ctx.lineTo(-L*.1,-L*.9);ctx.lineTo(-L*.3,-L*.85);ctx.lineTo(-L*.2,-L*.1);ctx.lineTo(-L*.55,-L*.18);ctx.lineTo(-L*.55,L*.18);ctx.lineTo(-L*.2,L*.1);ctx.lineTo(-L*.3,L*.85);ctx.lineTo(-L*.1,L*.9);ctx.lineTo(L*.05,L*.12);ctx.closePath()}
function shadeCol(c,d){const m=c.match(/\d+/g);if(m)return`rgb(${clamp(+m[0]+d,0,255)},${clamp(+m[1]+d,0,255)},${clamp(+m[2]+d,0,255)})`;const n=parseInt(c.slice(1),16);return`rgb(${clamp((n>>16)+d,0,255)},${clamp((n>>8&255)+d,0,255)},${clamp((n&255)+d,0,255)})`}
let lastPaint=0;
function render(now){ctx.fillStyle='#08100c';ctx.fillRect(0,0,W,H);
  if(S.terrainDirty){paintTerrain();lastPaint=now;S.paintPart=0}else if(now-lastPaint>180){const k=(S.paintPart||0)%4;paintTerrain(Math.floor(N*k/4),Math.floor(N*(k+1)/4));S.paintPart=k+1;lastPaint=now}
  drawTerrain(now);
  const z=cam.z,vx0=wxOf(-40),vx1=wxOf(W+40),vy0=wyOf(-40),vy1=wyOf(H+40);
  // fire
  if(S.burning.size){for(const i of S.burning){const x=i%GW,y=(i/GW)|0;if(!inV(x,y))continue;const f=.6+.4*Math.sin(performance.now()/90+i);ctx.fillStyle=`rgba(255,${120+60*f|0},40,${.55+.3*f})`;ctx.fillRect(sx(x)-1,sy(y)-1,CELL*z+2,CELL*z+2)}}
  // microscope: zoomed right in, the microbes in the soil and water become visible
  if(z>=6){const now3=performance.now()/1000,cx0=Math.floor(wxOf(0)),cy0=Math.floor(wyOf(0)),cx1=Math.ceil(wxOf(W)),cy1=Math.ceil(wyOf(H));let drawn=0;
    for(let yy=cy0;yy<=cy1&&drawn<1600;yy++)for(let xx=cx0;xx<=cx1&&drawn<1600;xx++){const i=idx(xx,yy);if(i<0)continue;const m=mic[i],wat=isWater(i),n=Math.round(m*7);
      for(let k=0;k<n;k++){const hsh=((xx*73856093)^(yy*19349663)^(k*83492791))>>>0,u1=(hsh%1000)/1000,u2=((hsh>>10)%1000)/1000,u3=((hsh>>20)%1000)/1000;
        const X=sxr(xx+u1)+Math.sin(now3*1.3+hsh)*z*0.25,Y=syr(yy+u2)+Math.cos(now3*1.1+hsh)*z*0.25,L2=z*(0.45+u3*0.35);drawn++;
        if(wat){ctx.strokeStyle=u3<0.5?'rgba(150,240,200,.7)':'rgba(200,220,120,.65)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(X,Y,L2*0.5,0,TAU);ctx.stroke();if(u3<0.5){ctx.beginPath();ctx.moveTo(X-L2*0.5,Y);ctx.lineTo(X+L2*0.5,Y);ctx.stroke()}}
        else if(u3<0.25){ctx.strokeStyle='rgba(235,225,200,.55)';ctx.lineWidth=Math.max(0.8,z*0.04);ctx.beginPath();ctx.moveTo(X,Y);ctx.quadraticCurveTo(X+L2*1.5,Y-L2,X+L2*3,Y+L2*0.4);ctx.stroke()}// fungal thread
        else{ctx.save();ctx.translate(X,Y);ctx.rotate(hsh%6+now3*0.3);ctx.fillStyle=u3<0.6?'rgba(200,120,240,.75)':'rgba(120,230,150,.75)';ctx.beginPath();if(u3<0.6)ctx.ellipse(0,0,L2*0.7,L2*0.28,0,0,TAU);else ctx.arc(0,0,L2*0.3,0,TAU);ctx.fill();ctx.restore()}}}}
  // carcasses: a fallen body that turns to bones as it is eaten or rots away
  if(z>0.5)for(const c of S.carcasses){if(!inV(c.x,c.y))continue;const X=sx(c.x),Y=sy(c.y),L=Math.max(5,SP[c.sp].len*z*0.9),f=c.meat/c.m0;ctx.save();ctx.translate(X,Y);ctx.rotate(c.dir);
    if(f>0.3){ctx.globalAlpha=0.85;ctx.fillStyle='#5a4638';ctx.beginPath();ctx.ellipse(0,0,L/2,L*0.22,0,0,TAU);ctx.fill();ctx.fillStyle='#7a2e22';ctx.beginPath();ctx.ellipse(-L*.05,0,L*.18*(1-f)+L*.05,L*.1,0,0,TAU);ctx.fill()}
    ctx.globalAlpha=f>0.3?0.5:0.85;ctx.strokeStyle='#ece6d8';ctx.lineWidth=Math.max(.8,L*.05);ctx.beginPath();ctx.moveTo(-L*.4,0);ctx.lineTo(L*.4,0);for(let q=-2;q<=2;q++){ctx.moveTo(q*L*.12,-L*.16);ctx.lineTo(q*L*.12,L*.16)}ctx.stroke();ctx.restore();if(S.sel===c){ctx.strokeStyle='#ffc35a';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(X,Y,L*.7+4,0,TAU);ctx.stroke()}}
  // villages: trodden ground, a fence once they grow, and the name
  if(z>0.45)for(const v of S.villages){const X=sx(v.x),Y=sy(v.y),R=(2.4+Math.sqrt(v.huts)*1.25)*CELL*z;ctx.fillStyle='rgba(120,92,58,.38)';ctx.beginPath();ctx.arc(X,Y,R,0,TAU);ctx.fill();
    if(v.huts>=5){ctx.strokeStyle='#6a4a28';ctx.lineWidth=Math.max(1,z*1.2);ctx.setLineDash([Math.max(2,z*3),Math.max(2,z*2)]);ctx.beginPath();ctx.arc(X,Y,R*1.08,0,TAU);ctx.stroke();ctx.setLineDash([])}
    const f=.6+.4*Math.sin(performance.now()/110+v.id),gl=ctx.createRadialGradient(X,Y,0,X,Y,CELL*z*2.4);gl.addColorStop(0,`rgba(255,170,60,${.35*f})`);gl.addColorStop(1,'rgba(255,120,40,0)');ctx.fillStyle=gl;ctx.beginPath();ctx.arc(X,Y,CELL*z*2.4,0,TAU);ctx.fill();ctx.fillStyle=`rgba(255,${130+80*f|0},40,.95)`;ctx.beginPath();ctx.arc(X,Y,Math.max(2,CELL*z*.4*f),0,TAU);ctx.fill();if(S.parts.length<1200&&Math.random()<0.15)S.parts.push({x:v.x+(Math.random()-.5)*.3,y:v.y,vx:(Math.random()-.5)*.3,vy:-0.9,life:2,max:2,k:'smoke'})}
  // homes on the ground (nests are drawn after the trees, up in the branches)
  const hv=[];if(z>0.6)for(const h of S.homes){if(!inV(h.x,h.y))continue;if(h.hk==='nest')hv.push(h);else drawHome(h,sx(h.x),sy(h.y),z)}
  // trees, sorted by y for a little depth
  const vis=[];for(const t of S.trees)if(!t.dead&&inV(t.x,t.y))vis.push(t);vis.sort((a,b)=>a.y-b.y);
  if(z<0.55){for(const t of vis){ctx.fillStyle=t.k==='pine'?'#1f3d24':t.k==='cactus'?'#5c8a4b':'#2f5527';const r=Math.max(1.2,(0.6+t.size)*z*CELL*0.8);ctx.fillRect(sx(t.x)-r/2,sy(t.y)-r/2,r,r)}}else for(const t of vis)drawTree(t,sx(t.x),sy(t.y),z);
  for(const h of hv)drawHome(h,sx(h.x),sy(h.y),z);
  if(z>2.4){ctx.font='11px IBM Plex Sans, system-ui';ctx.textAlign='center';for(const h of S.homes){if(h.hk!=='hut'||!h.fam||!inV(h.x,h.y))continue;const X=sx(h.x),Y=sy(h.y)+CELL*z*1.25+12,t=`${h.fam} hut`,w=ctx.measureText(t).width+8;ctx.fillStyle='rgba(8,14,11,.6)';ctx.fillRect(X-w/2,Y-11,w,15);ctx.fillStyle='#f0dcb8';ctx.fillText(t,X,Y)}ctx.textAlign='start'}
  if(z>0.7){ctx.font='600 12px IBM Plex Sans, system-ui';ctx.textAlign='center';for(const v of S.villages){const X=sx(v.x),Y=sy(v.y)-(2.4+Math.sqrt(v.huts)*1.25)*CELL*z-6;const t=`${v.name} · ${v.huts} hut${v.huts>1?'s':''}`;ctx.fillStyle='rgba(8,14,11,.65)';const w=ctx.measureText(t).width+12;ctx.fillRect(X-w/2,Y-13,w,18);ctx.fillStyle='#ffe2b0';ctx.fillText(t,X,Y)}ctx.textAlign='start'}
  // animals (birds last)
  const air=[];for(const a of S.animals){if(a.dead||!inV(a.x,a.y))continue;if(SP[a.sp].hab==='air'){air.push(a);continue}drawAnimal(a,sx(a.x),sy(a.y),z)}for(const a of air)drawAnimal(a,sx(a.x),sy(a.y),z);
  if(S.geneView)drawGeneView(vx0,vx1,vy0,vy1,z);
  if(z>=2.2){ctx.font='bold 11px IBM Plex Mono, monospace';ctx.fillStyle='rgba(220,230,255,.85)';const ph=performance.now()/600;for(const a of S.animals){if(a.state!=='sleep'||a.hidden||a.dead||!inV(a.x,a.y))continue;ctx.fillText('z',sx(a.x)+6,sy(a.y)-6-((ph+a.id)%1)*6)}}
  if(S.labels&&z>=1.8){let n=0;for(const a of S.animals){if(a.dead||!inV(a.x,a.y))continue;if(++n>400)break;const X=sx(a.x),Y=sy(a.y)-Math.max(7,SP[a.sp].len*z*0.55);ctx.drawImage(badge(a.sp),X-9,Y-16,18,18)}}
  // particles
  for(const p of S.parts){const X=sx(p.x),Y=sy(p.y),u=p.life/p.max;if(p.k==='fight'){if(z<0.8)continue;ctx.globalAlpha=Math.min(1,u*1.5);ctx.font='bold 14px system-ui';ctx.textAlign='center';ctx.fillStyle='#ff6b5a';ctx.fillText('⚔',X,Y);ctx.globalAlpha=1;ctx.textAlign='start';continue}
    if(p.k==='drop'){if(z<1.5)continue;ctx.globalAlpha=Math.min(1,u*1.5);ctx.fillStyle='#7fd0ff';ctx.beginPath();ctx.arc(X,Y,2.2,0,TAU);ctx.fill();ctx.beginPath();ctx.moveTo(X-2,Y-0.5);ctx.lineTo(X,Y-5);ctx.lineTo(X+2,Y-0.5);ctx.fill();ctx.globalAlpha=1;continue}
    if(p.k==='heart'||p.k==='birth'||p.k==='old'){if(z<1)continue;ctx.globalAlpha=Math.min(1,u*1.5);ctx.font=`${p.k==='heart'?12:11}px system-ui`;ctx.textAlign='center';ctx.fillStyle=p.k==='heart'?'#ff7aa8':p.k==='birth'?'#fff3a0':'#c8c8c8';ctx.fillText(p.k==='heart'?'♥':p.k==='birth'?'✦':'✝',X,Y);ctx.globalAlpha=1;ctx.textAlign='start';continue}
    if(p.k==='smoke'){ctx.fillStyle=`rgba(70,70,70,${u*.35})`;ctx.beginPath();ctx.arc(X,Y,(1-u)*10*z+2,0,TAU);ctx.fill()}else{ctx.fillStyle=`rgba(255,${180*u|0},60,${u})`;ctx.fillRect(X-1.5,Y-1.5,3,3)}}
  if(S.flash&&S.flash.t>0){const X=sx(S.flash.x),Y=sy(S.flash.y),r=(1-S.flash.t)*160*z+20;const g=ctx.createRadialGradient(X,Y,0,X,Y,r);g.addColorStop(0,`rgba(255,240,200,${S.flash.t})`);g.addColorStop(1,'rgba(255,120,40,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(X,Y,r,0,TAU);ctx.fill()}
  if(S.falling){const f=S.falling,u=f.t;const X=sx(f.x)+(1-u)*-300,Y=sy(f.y)+(1-u)*-300;ctx.strokeStyle='rgba(255,200,120,.8)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(X-60,Y-60);ctx.lineTo(X,Y);ctx.stroke();ctx.fillStyle='#fff3d0';ctx.beginPath();ctx.arc(X,Y,5,0,TAU);ctx.fill()}
  // weather: soft clouds, with rain streaks (or snowflakes in the cold) falling beneath
  if(S.clouds.length){const now2=performance.now()/1000;for(const c of S.clouds){const X=sx(c.x),Y=sy(c.y),R=c.r*CELL*z;if(X+R<0||X-R>W||Y+R<0||Y-R>H)continue;const a=Math.min(1,c.age/0.3,Math.max(0,(c.life-c.age)/0.3))*c.int;
    const ci=idx(c.x,c.y),snow=ci>=0&&cellT(ci)<0;
    // falling rain
    const n=Math.min(140,Math.round(R*R/350)+14);ctx.strokeStyle=snow?'rgba(255,255,255,.9)':'rgba(150,190,255,.8)';ctx.fillStyle='rgba(255,255,255,.85)';ctx.lineWidth=1;ctx.beginPath();
    for(let k=0;k<n;k++){const hx=((k*97+c.id*13)%1000)/1000,hy=((k*61+c.id*7)%1000)/1000,ang=hx*TAU,rr2=Math.sqrt(hy)*R*0.9,px=X+Math.cos(ang)*rr2,ph=((now2*(snow?0.35:1.6)+hx*3)%1),py=Y+Math.sin(ang)*rr2*0.7-R*0.15+ph*R*0.35;
      if(snow){ctx.moveTo(px+1.6,py);ctx.arc(px,py,1.6,0,TAU)}else{ctx.moveTo(px,py);ctx.lineTo(px-2.5,py+12)}}
    if(snow)ctx.fill();else ctx.stroke();
    const g=ctx.createRadialGradient(X,Y-R*0.2,R*0.1,X,Y-R*0.2,R);g.addColorStop(0,`rgba(235,238,245,${0.42*a})`);g.addColorStop(0.6,`rgba(200,205,215,${0.28*a})`);g.addColorStop(1,'rgba(200,205,215,0)');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(X,Y-R*0.2,R,R*0.75,0,0,TAU);ctx.fill()}}
  if(S.flashL&&S.flashL.t>0){ctx.fillStyle=`rgba(230,235,255,${S.flashL.t*0.35})`;ctx.fillRect(0,0,W,H);S.flashL.t-=0.08}
  // dust dims the world after a meteor
  if(CL.dust>0.3){ctx.fillStyle=`rgba(60,45,30,${Math.min(.45,CL.dust/30)})`;ctx.fillRect(0,0,W,H)}
  // night falls when time is slow enough to see it; fires and torches glow in the dark
  {const h=hourOf(),dark=S.speed<=1.01?clamp((Math.abs(h-12.5)-5)/2.2,0,1):0;if(dark>0.01){ctx.fillStyle=`rgba(8,14,40,${0.62*dark})`;ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='lighter';
    const glow=(X,Y,R,al)=>{const g=ctx.createRadialGradient(X,Y,0,X,Y,R);g.addColorStop(0,`rgba(255,170,70,${al})`);g.addColorStop(1,'rgba(255,120,40,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(X,Y,R,0,TAU);ctx.fill()};
    for(const v of S.villages)glow(sx(v.x),sy(v.y),CELL*z*5,0.55*dark);
    let nb=0;for(const i of S.burning){if(++nb>400)break;glow(sx(i%GW+.5),sy(((i/GW)|0)+.5),CELL*z*2.2,0.35*dark)}
    for(const a of S.animals)if(!a.dead&&SP[a.sp].tp==='human'&&(a.state==='hunt'||a.state==='track'||a.state==='pack'))glow(sx(a.x),sy(a.y),CELL*z*1.6,0.4*dark);
    ctx.globalCompositeOperation='source-over'}}
  // selection and brush
  const sel=S.sel;if(sel&&!sel.dead){const X=sx(sel.x),Y=sy(sel.y),r=Math.max(10,(SP[sel.sp]?SP[sel.sp].len:6)*z*0.9);ctx.strokeStyle='#ffc35a';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(X,Y,r,0,TAU);ctx.stroke()}
  if(ptr.in&&BRUSH_TOOLS.has(S.tool)){ctx.strokeStyle='rgba(255,255,255,.5)';ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(ptr.x,ptr.y,S.brush*CELL*z,0,TAU);ctx.stroke();ctx.setLineDash([])}}

/* ================= input ================= */
setupHuman();
// animals in the toolbar, grouped by what they eat (animals added from the search bar join their group)
const DIETG=[['herb','Plant eaters'],['carn','Meat eaters'],['omni','Omnivores']];
function animalTools(){const out=[];for(const [d,lab] of DIETG){const L=SPK.filter(k=>SP[k].diet===d&&(!SP[k].cat||SP[k].tp==='human'||PLACEDEVER.has(k)));L.forEach((k,j)=>out.push([k,SP[k].n,SP[k].ic,j===0?lab:0]))}return out}
const PLACEDEVER=new Set();
const TOOLS0=()=>[['select','Select','🖐','Tools'],
 ['grass','Grass','🌱','Plants'],['oak','Oak','🌳'],['pine','Pine','🌲'],['palm','Palm','🌴'],['cactus','Cactus','🌵'],['bush','Berries','🫐'],['algae','Algae','🌿'],['microbes','Microbes','🧫'],
 ...animalTools(),
 ['raise','Raise','⛰','Land'],['lower','Lower','🕳'],['water','Water','💧'],['rain','Rain','🌧'],['fire','Fire','🔥'],['meteor','Meteor','☄'],['hut','Hut','🛖'],['plague','Disease','🦠'],['remove','Remove','✖']];
const TOOLS=TOOLS0();
const BRUSH_TOOLS=new Set(['microbes','grass','algae','raise','lower','water','rain','fire','plague','remove']);
let railAdded=false;
function addRailTool(k){PLACEDEVER.add(k);const keep=S.tool;TOOLS.splice(0,TOOLS.length,...TOOLS0());buildRail();setTool(keep);return;const r=$('rail');if(!railAdded){const h=document.createElement('h3');h.textContent='Added';h.id='railAdded';r.appendChild(h);railAdded=true}const b=document.createElement('button');b.className='tool';b.dataset.tool=k;b.setAttribute('aria-pressed','false');b.title=toolTip(k);b.innerHTML='<span class="ico"></span><span></span>';b.children[0].textContent=SP[k].ic;b.children[1].textContent=SP[k].n;b.onclick=()=>setTool(k);r.appendChild(b)}
function buildRail(){railAdded=false;const r=$('rail');r.textContent='';for(const [id,label,ic,grp] of TOOLS){if(grp){const h=document.createElement('h3');h.textContent=grp;r.appendChild(h)}
  const b=document.createElement('button');b.className='tool';b.dataset.tool=id;b.setAttribute('aria-pressed','false');b.title=toolTip(id);b.innerHTML='<span class="ico"></span><span></span>';b.children[0].textContent=ic;b.children[1].textContent=label;b.onclick=()=>setTool(id);r.appendChild(b)}}
const DIETN={herb:'Herbivore (plant eater)',carn:'Carnivore (meat eater)',omni:'Omnivore (eats plants and animals)'};
function toolTip(id){if(SP[id])return`${SP[id].n}: click to release ${SP[id].pl.toLowerCase()} · ${DIETN[SP[id].diet]}`;if(TK[id])return`${TK[id].n}: click to plant (grows where the climate suits it)`;
  return{select:'Select, inspect and look around (1)',grass:'Paint grass seeds',algae:'Seed algae in water (fish food)',microbes:'Seed microbes: soil bacteria and fungi that rot dead matter into nutrients so plants grow better',raise:'Raise the land (makes hills and mountains)',lower:'Lower the land',water:'Flood an area to make lakes',rain:'Make an area wetter',fire:'Start a fire',meteor:'Drop a meteor',plague:'Spread a disease',remove:'Remove life in an area',hut:'Build a hut: click in a village to add a hut and a family of two hunters, or on open land to found a new village'}[id]||id}
function setTool(t){S.tool=t;document.querySelectorAll('.tool').forEach(b=>b.setAttribute('aria-pressed',b.dataset.tool===t?'true':'false'));cv.classList.toggle('place',t!=='select');
  $('placeopts').hidden=t==='select';$('cntK').hidden=$('cntSeg').hidden=!SP[t];
  $('hint').textContent=t==='select'?'Drag to look around · scroll to zoom · click an animal to inspect it':SP[t]?`Click to release ${SP[t].pl.toLowerCase()} · right-drag or WASD to move the camera`:TK[t]?'Click or drag to plant · it only grows in a suitable climate':t==='meteor'?'Click where the meteor should hit':'Drag to paint · change the brush size at the bottom'}
const ptr={x:0,y:0,in:false,down:false,pan:false,lx:0,ly:0,moved:0,id:null,pts:new Map(),pinch:0,lastPaint:{x:-99,y:-99}};
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);ptr.pts.set(e.pointerId,{x:e.clientX,y:e.clientY});ptr.pmx=null;if(ptr.pts.size===2){const [a,b]=[...ptr.pts.values()];ptr.pinch=Math.hypot(a.x-b.x,a.y-b.y);ptr.down=false;return}
  ptr.down=true;ptr.moved=0;ptr.lx=e.clientX;ptr.ly=e.clientY;ptr.pan=e.button===2||e.button===1||S.tool==='select';ptr.btn=e.button;
  if(!ptr.pan)applyTool(e.clientX,e.clientY,true)});
cv.addEventListener('pointermove',e=>{ptr.x=e.clientX;ptr.y=e.clientY;ptr.in=true;if(ptr.pts.has(e.pointerId))ptr.pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptr.pts.size===2){const [a,b]=[...ptr.pts.values()],d=Math.hypot(a.x-b.x,a.y-b.y),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;if(ptr.pinch)zoomAt(d/ptr.pinch,mx,my);if(ptr.pmx!=null){S.follow=false;cam.x-=(mx-ptr.pmx)/cam.z;cam.y-=(my-ptr.pmy)/cam.z}ptr.pmx=mx;ptr.pmy=my;ptr.pinch=d;return}
  if(!ptr.down)return;const dx=e.clientX-ptr.lx,dy=e.clientY-ptr.ly;ptr.moved+=Math.abs(dx)+Math.abs(dy);ptr.lx=e.clientX;ptr.ly=e.clientY;
  if(ptr.pan){cam.x-=dx/cam.z;cam.y-=dy/cam.z;if(ptr.moved>4)S.follow=false;CAMMOVED+=Math.abs(dx)+Math.abs(dy)}else if(BRUSH_TOOLS.has(S.tool)||TK[S.tool])applyTool(e.clientX,e.clientY,false)});
const endPtr=e=>{ptr.pts.delete(e.pointerId);if(ptr.pts.size<2)ptr.pinch=0;if(!ptr.down)return;ptr.down=false;if(ptr.pan&&ptr.btn===0&&ptr.moved<5&&S.tool==='select')pick(e.clientX,e.clientY)};
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);cv.addEventListener('pointerleave',()=>ptr.in=false);
cv.addEventListener('dblclick',e=>{if(S.tool!=='select')return;pick(e.clientX,e.clientY);if(S.sel){S.follow=true;cam.z=Math.max(cam.z,3.5);toast(`Following ${S.sel.k?TK[S.sel.k].n.toLowerCase():nameOf(S.sel)}`)}});
cv.addEventListener('wheel',e=>{e.preventDefault();zoomAt(Math.exp(-e.deltaY*(e.ctrlKey?0.012:0.0022)),e.clientX,e.clientY);ZOOMED++},{passive:false});
let CAMMOVED=0,ZOOMED=0;
const dWX=d=>((d%GW)+GW*1.5)%GW-GW/2,dWY=d=>((d%GH)+GH*1.5)%GH-GH/2;
function pick(px,py){const wx=wrapX(wxOf(px)),wy=wrapY(wyOf(py)),r=Math.max(1.4,12/(cam.z*CELL));let best=null,bd=r*r;
  for(const a of S.animals){if(a.dead)continue;const d=dWX(a.x-wx)**2+dWY(a.y-wy)**2;if(d<bd){bd=d;best=a}}
  if(!best){for(const v of S.villages){const d=dWX(v.x-wx)**2+dWY(v.y-wy)**2;if(d<(r*1.3)**2){best=v;break}}}
  if(!best){let cd=(r*1.1)**2;for(const c of S.carcasses){const d=dWX(c.x-wx)**2+dWY(c.y-wy)**2;if(d<cd){cd=d;best=c}}}
  if(!best){let hd2=(r*1.1)**2;for(const h of S.homes){const d=dWX(h.x-wx)**2+dWY(h.y-wy)**2;if(d<hd2){hd2=d;best=h}}}
  if(!best){let td=(r*1.2)**2;for(const t of S.trees){if(t.dead)continue;const d=dWX(t.x-wx)**2+dWY(t.y-wy)**2;if(d<td){td=d;best=t}}}
  select(best)}
function select(o){S.sel=o;S.selDead=null;if(!o)S.follow=false;buildInspector();if(o)showTab('insp')}
function applyTool(px,py,first){const x=wrapX(wxOf(px)),y=wrapY(wyOf(py)),t=S.tool,i=idx(x,y);if(i<0)return;
  if(SP[t]){if(!first)return;const n=spawnAt(t,x,y,S.count,false,undefined,true);if(!n)toast(S.animals.length>=MAXA+USERA?`The world is full (${S.animals.length} animals). Remove some animals or let time pass, then try again.`:SP[t].hab==='water'?`${SP[t].pl} need water: click on a lake or the sea`:SP[t].hab==='land'||SP[t].hab==='amph'?`${SP[t].pl} need land`:'No room');else{PLACED[t]=(PLACED[t]||0)+n;chEv('place',{sp:t,n})}return}
  if(TK[t]){if(!first&&Math.hypot(x-ptr.lastPaint.x,y-ptr.lastPaint.y)<1.6)return;ptr.lastPaint={x,y};if(isWater(i)){if(first)toast('Trees need land');return}
    let crowd=0;nearTrees(x,y,1.2,()=>crowd++);if(crowd&&!first)return;rebuildTreesSoon();const tr=addTree(t,x,y,{age:0,size:0.18});if(tr){PLACED[t]=(PLACED[t]||0)+1;if(first&&!treeOK(t,i))toast(`${TK[t].n} trees struggle here: ${meanT(i)<TK[t].tmin?'too cold':meanT(i)>TK[t].tmax?'too hot':wetAt(i)<TK[t].rmin?'too dry':'too wet'}`)}return}
  if(t==='meteor'){if(!first||S.falling)return;S.falling={x,y,t:0};return}
  if(t==='hut'){if(!first)return;if(isWater(i)){toast('Huts need dry land');return}let v=null,bd=15*15;for(const q of S.villages){const d=(q.x-x)**2+(q.y-y)**2;if(d<bd){bd=d;v=q}}
    const h=v?addHutToVillage(v):foundVillage(x,y);if(h){HUTS++;toast(v?`🛖 The ${h.fam} family built a hut in ${v.name}`:`🛖 New village founded: ${S.villages.find(q=>q.id===h.vil).name}`)}else toast('No room for a hut here');return}
  const R=S.brush;let changed=false;
  for(let yy=-R;yy<=R;yy++)for(let xx=-R;xx<=R;xx++){const d=Math.hypot(xx,yy);if(d>R)continue;const j=idx(x+xx,y+yy);if(j<0)continue;const f=1-d/(R+1);
    if(t==='grass'){if(!isWater(j))veg[j]=Math.max(veg[j],0.25*f+0.05)}
    else if(t==='algae'){if(isWater(j))alg[j]=Math.max(alg[j],0.5)}
    else if(t==='microbes'){mic[j]=Math.max(mic[j],0.9);if(!isWater(j))fert[j]=Math.min(3,fert[j]+0.3*f);MICS++}
    else if(t==='raise'){hgt[j]=Math.min(1,hgt[j]+0.012*f);changed=true}
    else if(t==='lower'){hgt[j]=Math.max(0.01,hgt[j]-0.012*f);changed=true}
    else if(t==='water'){if(!isWater(j)){hgt[j]=sea()-0.006-0.02*f;changed=true;WATERED++}}
    else if(t==='rain'){wet[j]=Math.min(1.2,wet[j]+0.15*f);RAINED++;if(xx===0&&yy===0&&(!S.lastRainCloud||Math.hypot(S.lastRainCloud.x-x,S.lastRainCloud.y-y)>R)){const c={x,y,r:Math.max(5,R*1.6),life:3,age:0.3,int:0.9,id:S.nextId++};S.clouds.push(c);S.lastRainCloud=c}}
    else if(t==='fire'){if(rnd()<0.5&&ignite(j)){chEv('fire',{});FIRELIT++}}
    else if(t==='remove'){veg[j]*=0.5}}
  if(t==='plague'){let n=0;near(x,y,R,a=>{if(!a.sick&&!(a.immT>0)&&rnd()<.7){a.sick=rr(15,35);n++}});if(n&&first)toast(`🦠 ${n} animals infected · it spreads to neighbours of the same species`)}
  if(t==='remove'){near(x,y,R,a=>kill(a,'removed'));for(const tr of S.trees)if(Math.hypot(tr.x-x,tr.y-y)<R){tr.dead=true;tr.cause='removed'}S.trees=S.trees.filter(q=>!q.dead);S.animals=S.animals.filter(q=>!q.dead)}
  if(changed)terrainChangedSoon();S.terrainDirty=true;S.tvNow=true}
let MICS=0,FEEDS=0,CLONES=0,BOATS=0,FIGHTS=0,HUTS=0,FIRELIT=0,PLACED={},WATERED=0,RAINED=0,tcTimer=0,rtTimer=0;
function addHutToVillage(v){const p=hutSpot(v);if(!p)return null;setupHuman();const fam=SURN[Math.floor(Math.random()*SURN.length)];
  const m=addAnimal('x_human_hunter',p[0],p[1],{sex:'m',e:.9}),f=addAnimal('x_human_hunter',p[0]+.3,p[1]+.2,{sex:'f',e:.9});if(!m||!f)return null;
  m.fam=f.fam=fam;m.mate=f.id;f.mate=m.id;const h={id:S.nextId++,hk:'hut',x:p[0],y:p[1],owner:m.id,oname:'x_human_hunter',prog:1,born:S.t,last:S.t,kids:0,vil:v.id,fam};
  S.homes.push(h);addHomeBucket(h);v.huts++;m.home=f.home=h;chEv('home',{k:'hut',sp:'x_human_hunter'});return h}
function foundVillage(x,y){const used=new Set(S.villages.map(v=>v.name)),free=VNAMES.filter(n=>!used.has(n));
  const v={isVil:1,id:S.nextId++,x,y,name:free.length?free[Math.floor(Math.random()*free.length)]:VNAMES[0]+' '+(2+S.villages.length),huts:0,born:S.t};S.villages.push(v);chEv('village',{});
  const h=addHutToVillage(v);if(!h){S.villages=S.villages.filter(q=>q!==v);return null}return h}
function terrainChangedSoon(){clearTimeout(tcTimer);tcTimer=setTimeout(terrainChanged,120)}
function rebuildTreesSoon(){clearTimeout(rtTimer);rtTimer=setTimeout(rebuildTrees,50)}
const KEYS=new Set();
addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
  if(!$('acct').hidden){if(e.key==='Escape')$('acct').hidden=true;return}
  if(!$('home').hidden||!$('chDone').hidden){if(e.key==='Escape'&&!$('home').hidden)homeView('hMain');return}
  if(document.body.classList.contains('mDemo')){if(e.key==='Escape')stopDemo();return}
  const k=e.key.toLowerCase();if('wasd'.includes(k)&&k.length===1||e.key.startsWith('Arrow')){KEYS.add(k);e.preventDefault();return}
  if(e.key===' '){e.preventDefault();setPaused(!S.paused)}else if(e.key==='Escape'){if(S.sel)select(null);else if(S.tool!=='select')setTool('select');$('scen').hidden=true}
  else if(k==='1')setTool('select');else if(e.key==='+'||e.key==='=')zoomAt(1.3,W/2,H/2);else if(e.key==='-')zoomAt(1/1.3,W/2,H/2)});
addEventListener('keyup',e=>KEYS.delete(e.key.toLowerCase()));
function camKeys(dt){let dx=0,dy=0;if(KEYS.has('w')||KEYS.has('arrowup'))dy--;if(KEYS.has('s')||KEYS.has('arrowdown'))dy++;if(KEYS.has('a')||KEYS.has('arrowleft'))dx--;if(KEYS.has('d')||KEYS.has('arrowright'))dx++;
  if(dx||dy){const v=500*dt/cam.z;cam.x+=dx*v;cam.y+=dy*v;S.follow=false;CAMMOVED+=v*cam.z}}
$('zIn').onclick=()=>{zoomAt(1.4,W/2,H/2);ZOOMED++};$('zOut').onclick=()=>{zoomAt(1/1.4,W/2,H/2);ZOOMED++};$('zFit').onclick=()=>{fitWorld();S.follow=false};

/* ================= panels ================= */
function toast(msg){const box=$('toasts');const d=document.createElement('div');d.className='toast';d.textContent=msg;box.appendChild(d);while(box.children.length>3)box.firstChild.remove();setTimeout(()=>d.remove(),3200)}
const SPEEDS=[[1/24,'1 hr'],[0.25,'6 hr'],[1,'1 day'],[7,'1 wk'],[30,'1 mo'],[182,'6 mo'],[365,'1 yr']];
function buildSpeeds(){const b=$('spds');b.textContent='';for(const [v,l] of SPEEDS){const x=document.createElement('button');x.className='spd';x.textContent=l;x.dataset.v=v;x.onclick=()=>{setSpeed(v);setPaused(false)};b.appendChild(x)}}
function setSpeed(v){S.speed=v;document.querySelectorAll('.spd').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.v===v?'true':'false'))}
function setPaused(p){S.paused=p;$('pauseBtn').textContent=p?'▶':'⏸';$('pauseBtn').setAttribute('aria-label',p?'Resume':'Pause')}
$('pauseBtn').onclick=()=>setPaused(!S.paused);
const fmtRate=d=>d<0.99?`${Math.round(d*24)} hr / s`:d>=365?`${(d/365).toFixed(d>=730?0:1)} yr / s`:d>=28?`${Math.round(d/30)} mo / s`:d>=7?`${Math.round(d/7)} wk / s`:`${d.toFixed(d<1?2:0)} day / s`;
function dateTxt(){const y=Math.floor(S.t/365)+1,d=S.t%365;const se=['winter','spring','summer','autumn'][Math.floor(((d+10)%365)/91.25)];const h=hourOf();return`Year ${y}, ${se} · ${String(Math.floor(h)).padStart(2,'0')}:${String(Math.floor(h%1*60)).padStart(2,'0')} ${isNight()?'🌙':'☀️'}`}
function showTab(t){document.querySelectorAll('.tab').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===t?'true':'false'));for(const p of ['world','life','insp'])$('pane-'+p).hidden=p!==t;if(t==='life')LIFEOPEN++;if(t==='insp'&&S.sel&&!S.sel.k)INSPOPEN++}
let LIFEOPEN=0,INSPOPEN=0;
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
function syncClimateUI(){$('quotaS').value=CL.huntQuota;$('quotaV').textContent=CL.huntQuota+' per hunter per year';$('tempS').value=CL.temp;$('rainS').value=Math.round(CL.rain*100);$('seaS').value=CL.seaM;$('tempV').textContent=(CL.temp>=0?'+':'')+CL.temp+' °C';$('rainV').textContent=Math.round(CL.rain*100)+'%';$('seaV').textContent=(CL.seaM>=0?'+':'')+CL.seaM+' m';$('seasonBtn').setAttribute('aria-pressed',CL.seasons);$('seasonBtn').textContent=CL.seasons?'On':'Off'}
$('tempS').oninput=e=>{CL.temp=+e.target.value;EVP.ice=EVP.heat=null;syncClimateUI();CLIMCH++};$('rainS').oninput=e=>{CL.rain=e.target.value/100;syncClimateUI();CLIMCH++};
$('seaS').oninput=e=>{CL.seaM=+e.target.value;syncClimateUI();terrainChangedSoon();CLIMCH++};$('quotaS').oninput=e=>{CL.huntQuota=+e.target.value;syncClimateUI();QUOTACH++};let QUOTACH=0;
$('seasonBtn').onclick=()=>{CL.seasons=!CL.seasons;syncClimateUI()};
let CLIMCH=0;
// events: press once to start, press again to stop (the button shows which events are running)
const EVP={};
const EVNAME={ice:'Ice age',heat:'Heat wave',drought:'Drought',flood:'Floods',plague:'Plague',meteor:'Meteor',fire:'Wildfire'};
function evActive(ev){if(ev==='ice')return EVP.ice!=null;if(ev==='heat')return EVP.heat!=null;if(ev==='drought')return EVP.drought!=null;if(ev==='flood')return EVP.flood!=null;
  if(ev==='plague')return S.animals.some(a=>a.sick>0);if(ev==='fire')return S.burning.size>0;if(ev==='meteor')return !!S.falling||CL.dust>0.4;return false}
function stopEvent(ev){chEv('stop',{ev});EVSTOP++;
  if(ev==='ice'||ev==='heat'){CL.temp=EVP[ev]??0;EVP[ev]=null}else if(ev==='drought'){CL.rain=EVP.drought??1;EVP.drought=null}else if(ev==='flood'){CL.seaM=EVP.flood??0;EVP.flood=null;terrainChanged()}
  else if(ev==='plague'){for(const a of S.animals)a.sick=0}else if(ev==='fire'){for(const i of S.burning)burn[i]=0;S.burning.clear()}else if(ev==='meteor'){S.falling=null;CL.dust=0}
  toast(`${EVNAME[ev]} stopped`);syncClimateUI();updateEventButtons()}
function climateEvent(ev){if(ev!=='normal'&&evActive(ev)){stopEvent(ev);return}chEv('event',{ev});EVN++;
  if(ev==='ice'){if(EVP.heat!=null){EVP.ice=EVP.heat;EVP.heat=null}else EVP.ice=CL.temp;CL.temp=-10;toast('An ice age begins: −10 °C · press again to stop it')}
  else if(ev==='heat'){if(EVP.ice!=null){EVP.heat=EVP.ice;EVP.ice=null}else EVP.heat=CL.temp;CL.temp=8;toast('A heat wave: +8 °C · press again to stop it')}
  else if(ev==='drought'){EVP.drought=CL.rain;CL.rain=0.3;toast('Drought: rainfall falls to 30% · press again to stop it')}
  else if(ev==='flood'){EVP.flood=CL.seaM;CL.seaM=60;terrainChanged();toast('The seas rise 60 m · press again to stop it')}
  else if(ev==='normal'){CL.temp=0;CL.rain=1;CL.seaM=0;CL.dust=0;S.falling=null;for(const i of S.burning)burn[i]=0;S.burning.clear();for(const a of S.animals)a.sick=0;for(const k in EVP)EVP[k]=null;terrainChanged();EVSTOP++;chEv('stop',{ev:'all'});toast('All events stopped: climate back to normal')}
  else if(ev==='plague'){const c=counts();const sp=SPK.slice().sort((a,b)=>c[b]-c[a])[0];const n=plague(sp);toast(n?`A plague strikes the ${SP[sp].pl.toLowerCase()}: ${n} sick · press again to cure it`:'Nobody to infect')}
  else if(ev==='meteor'){const p=randomCell(i=>!isWater(i))||[GW/2,GH/2];S.falling={x:p[0],y:p[1],t:0};toast('A meteor is coming! Press again to stop it')}
  else if(ev==='fire'){let n=0;for(let k=0;k<400&&n<4;k++){const p=randomCell(i=>!isWater(i)&&veg[i]>0.4);if(p&&ignite(idx(p[0],p[1])))n++}toast(n?'Wildfire! Press again to put it out':'Nothing dry enough to burn');if(n)chEv('fire',{})}
  syncClimateUI();updateEventButtons()}
function updateEventButtons(){document.querySelectorAll('[data-ev]').forEach(b=>{const ev=b.dataset.ev;if(ev==='normal')return;const on=evActive(ev);if(!b.dataset.label)b.dataset.label=b.textContent;const t=on?'■ Stop '+EVNAME[ev].toLowerCase():b.dataset.label;if(b.textContent!==t)b.textContent=t;b.classList.toggle('danger',on);b.setAttribute('aria-pressed',on?'true':'false')})}
let EVSTOP=0;
document.querySelectorAll('[data-ev]').forEach(b=>b.onclick=()=>climateEvent(b.dataset.ev));
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
const LEGENDS={microbe:['Microbes: bacteria, fungi and plankton','linear-gradient(90deg,rgb(40,30,28),rgb(115,70,140),rgb(190,120,230))','few','','teeming'],temp:['Temperature','linear-gradient(90deg,rgb(40,60,170),rgb(60,150,220),rgb(120,200,140),rgb(240,220,90),rgb(235,120,50),rgb(180,30,40))','−30 °C','0 °C','+45 °C'],
  food:['Food for plant-eaters','linear-gradient(90deg,rgb(60,45,35),rgb(50,130,48),rgb(40,210,60))','none','some','lots'],
  rain:['Rain and moisture','linear-gradient(90deg,rgb(200,170,110),rgb(115,140,165),rgb(30,110,220))','dry','','wet']};
function setView(v){const L=LEGENDS[v],g=$('legend');g.hidden=!L;if(L){g.children[0].textContent=L[0];g.children[1].style.background=L[1];g.children[2].children[0].textContent=L[2];g.children[2].children[1].textContent=L[3];g.children[2].children[2].textContent=L[4]}
  S.view=v;S.terrainDirty=true;S.tvNow=true;document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===v?'true':'false'));VIEWCH++}
let VIEWCH=0;
$('brush').oninput=e=>{S.brush=+e.target.value;$('brushV').textContent=S.brush};
document.querySelectorAll('#cntSeg button').forEach(b=>b.onclick=()=>{S.count=+b.dataset.n;document.querySelectorAll('#cntSeg button').forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false'))});
$('dockBtn').onclick=()=>document.body.classList.toggle('dockOpen');

/* species list and graph */
const SPCOL={rabbit:'#d8b48a',mouse:'#a99886',deer:'#c98a52',bison:'#8a6346',zebra:'#e9e5dc',camel:'#e0bd7a',fox:'#ff8a3d',wolf:'#a9a6a2',lion:'#f0c36a',bear:'#9c6a44',hawk:'#c9a070',fish:'#8fd0ff',otter:'#7ea0b8',trees:'#5fbf5f',x_human_hunter:'#e0b080'};
function coatShare(sp){let w=0,d=0,n=0;for(const a of S.animals)if(!a.dead&&a.sp===sp){n++;const c=coatOf(a.genes);if(c==='white')w++;else if(c==='dark')d++}return n?`${Math.round(w/n*100)}% white, ${Math.round(d/n*100)}% dark`:''}
function renderLife(){const c=counts(),L=$('splist');{const hc={};for(const h of S.homes)if(h.prog>=1)hc[h.hk]=(hc[h.hk]||0)+1;{const dn={herb:0,carn:0,omni:0};for(const a of S.animals)if(!a.dead)dn[SP[a.sp].diet]++;let sick=0;for(const a of S.animals)if(!a.dead&&a.sick>0)sick++;$('dietSum').textContent=`🌿 ${dn.herb} herbivores · 🥩 ${dn.carn} carnivores · 🍓 ${dn.omni} omnivores`+(sick?` · 🦠 ${sick} sick`:'')}{let ms=0,fs=0,ws=0,nl=0,nw=0;for(let i=0;i<N;i+=11){if(isWater(i)){ws+=mic[i];nw++}else{ms+=mic[i];fs+=Math.min(1,fert[i]);nl++}}$('micSum').textContent=`🧫 Soil microbes ${Math.round(ms/Math.max(1,nl)*100)}% · plankton ${Math.round(ws/Math.max(1,nw)*100)}% · soil richness ${Math.round(fs/Math.max(1,nl)*100)}% · ${S.decomposed||0} carcasses rotted away`}$('lifeSum').textContent=`Born: ${S.born} · died of old age: ${S.oldAge||0} · homes: ${Object.values(hc).reduce((a,b)=>a+b,0)}`+(Object.keys(hc).length?` (${Object.entries(hc).map(([k,n])=>n+' '+HOMEK[k].n.toLowerCase()+(n>1?(k==='hut'?'s':k==='burrow'?'s':'s'):'')).join(', ')})`:'')}if(L.dataset.n!=SPK.length){L.textContent='';L.dataset.n=SPK.length}renderEndangered(c);if(!L.children.length){for(const k of [...SPK,'trees']){const r=document.createElement('button');r.className='sprow';r.dataset.k=k;r.innerHTML='<i></i><span></span><b></b>';r.children[0].style.background=SPCOL[k];r.onclick=()=>k==='trees'?flyTree():flyTo(k);L.appendChild(r)}}
  for(const r of L.children){const k=r.dataset.k;const n=k==='trees'?S.trees.length:c[k];r.classList.toggle('zero',!n);
    r.style.display=k!=='trees'&&!n&&!(S.seen||{})[k]?'none':'';r.children[1].textContent=k==='trees'?'🌳 Trees':`${SP[k].ic} ${SP[k].pl}`+(n?` · speed ${avgGene(k,'speed').toFixed(2)} · fur ${avgGene(k,'fur').toFixed(0)}° · ${coatShare(k)}`:'');r.children[2].textContent=n}
  drawGraph()}
function drawGraph(){const g=$('graph'),r=g.getBoundingClientRect();if(!r.width)return;const d=Math.min(2,devicePixelRatio||1);if(g.width!==Math.round(r.width*d)){g.width=r.width*d;g.height=r.height*d}const c=g.getContext('2d');c.setTransform(d,0,0,d,0,0);c.clearRect(0,0,r.width,r.height);
  const Hh=S.hist;if(Hh.length<2)return;const keys=[...SPK,'trees'].filter(k=>Hh.some(h=>h[k]>0));let mx=1;for(const h of Hh)for(const k of keys)mx=Math.max(mx,h[k]||0);
  const t0=Hh[0].t,t1=Hh[Hh.length-1].t||1;c.strokeStyle='rgba(150,210,170,.12)';c.lineWidth=1;for(let q=1;q<4;q++){c.beginPath();c.moveTo(0,r.height*q/4);c.lineTo(r.width,r.height*q/4);c.stroke()}
  for(const k of keys){c.strokeStyle=SPCOL[k];c.lineWidth=k==='trees'?1:1.6;c.globalAlpha=k==='trees'?.6:1;c.beginPath();Hh.forEach((h,j)=>{const x=(h.t-t0)/Math.max(1,t1-t0)*r.width,y=r.height-4-(h[k]||0)/mx*(r.height-12);j?c.lineTo(x,y):c.moveTo(x,y)});c.stroke()}
  c.globalAlpha=1;c.fillStyle='rgba(230,240,233,.6)';c.font='10px IBM Plex Mono, monospace';c.fillText('max '+Math.round(mx),4,11);c.fillText(`${((t1-t0)/365).toFixed(1)} years`,r.width-64,r.height-4)}
function flyTo(sp){const L=S.animals.filter(a=>!a.dead&&a.sp===sp);if(!L.length){toast(`No ${SP[sp].pl.toLowerCase()} alive. Pick ${SP[sp].n} in the toolbar to release some.`);return false}
  const cx=wxOf(W/2),cy=wyOf(H/2);L.sort((a,b)=>Math.hypot(a.x-cx,a.y-cy)-Math.hypot(b.x-cx,b.y-cy));select(L[0]);S.follow=true;cam.z=Math.max(cam.z,3.2);FOUND[sp]=(FOUND[sp]||0)+1;return true}
function flyTree(){const t=S.trees[0];if(t){select(t);S.follow=true;cam.z=Math.max(cam.z,3)}}
let FOUND={};

/* inspector */
const NAMES=['Ash','Bree','Cleo','Dax','Echo','Fern','Gus','Hazel','Iris','Juno','Kit','Luna','Milo','Nell','Oak','Pip','Quill','Rue','Sage','Tilly','Uma','Vex','Wren','Yara','Zed','Basil','Clover','Dusty','Ember','Flint','Ginger','Hops','Ivy','Jasper','Koda','Lark','Maple','Nova','Olive','Pepper','Rowan','Sky','Thistle','Willow'];
const nameOf=a=>a.sp==='x_human_hunter'?`${HFIRST[a.id%HFIRST.length]} ${a.fam||SURN[(a.id*7)%SURN.length]}`:NAMES[a.id%NAMES.length]+(a.id>NAMES.length?' '+'IVXLC'[Math.floor(a.id/NAMES.length)%5]:'');
const STATE={boatbuild:'Building a boat',sail:'Sailing',fight:'Fighting!',defend:'Standing its ground',browse:'Eating leaves from a tree',fire:'Running from fire',tohome:'Heading home to sleep',sleep:'Sleeping',pack:'Hunting with the pack',scavenge:'Eating a carcass',migrate:'Moving to a bearable climate',gather:'Gathering plants (hunting limit reached)',build:'Building a home',rest:'Resting at home',hide:'Hiding at home',nesting:'Going home to give birth',wander:'Wandering',eat:'Eating',graze:'Looking for food',forage:'Foraging for fruit',hunt:'Hunting',track:'Tracking prey',follow:'Following its mother',flee:'Fleeing!',drink:'Going to drink',mate:'Looking for a mate'};
let inspRefs={};
function buildInspector(){const o=S.sel,B=$('inspBody');B.textContent='';$('inspEmpty').hidden=!!o;B.hidden=!o;if(!o)return;inspRefs={};
  const h=document.createElement('h2');h.className='ititle';const sub=document.createElement('div');sub.className='isub';B.append(h,sub);inspRefs.sub=sub;inspRefs.h=h;
  const pic=document.createElement('canvas');pic.id='iPic';B.appendChild(pic);inspRefs.pic=pic;
  const kv=document.createElement('div');kv.className='kv';B.appendChild(kv);inspRefs.kv=kv;
  if(o.isVil){h.textContent=`🏘️ ${o.name}`;const L=document.createElement('div');L.className='hview';L.style.gap='4px';B.appendChild(L);inspRefs.vlist=L;const n=document.createElement('p');n.className='note';n.textContent='A village of human hunters. Each family has its own hut around the campfire; grown-up children leave to start a hut of their own, often in the same village.';B.appendChild(n)}
  else if(o.carc){h.textContent='🦴 Carcass';const n=document.createElement('p');n.className='note';n.textContent='When an animal dies it leaves a carcass. Hungry hunters and scavengers such as vultures, hyenas, foxes and bears eat it; whatever is left rots away in a few weeks.';B.appendChild(n)}
  else if(o.hk){const K=HOMEK[o.hk];h.textContent=`${K.ic} ${K.n}`;const n=document.createElement('p');n.className='note';n.textContent=`Animals build homes to raise their young${K.safe?' and to hide from hunters':''}. Babies born at home start out stronger and live there with the family until they are grown. A home nobody uses for about a year crumbles away.`;B.appendChild(n)}
  else if(!o.k){h.textContent=`${SP[o.sp].ic} ${nameOf(o)}`;
    // DNA strip: one band per gene, brighter = higher than the species' normal
    const dk=document.createElement('span');dk.className='k';dk.textContent='DNA';B.appendChild(dk);const dna=document.createElement('canvas');dna.className='dna';B.appendChild(dna);inspRefs.dna=dna;
    // parents and inheritance
    const fam=document.createElement('div');fam.className='fam';B.appendChild(fam);inspRefs.fam=fam;
    const gk=document.createElement('span');gk.className='k';gk.textContent='Genes · parents’ average → this animal (drag to edit)';B.appendChild(gk);
    const GL=[...GENES.map(([k,lab,lo,hi])=>[k,lab,lo,hi,.01]),['fur','Fur (cold °C)',-10,40,.5],['heat','Heat tolerance °C',-10,20,.5]];
    for(const [g,lab,lo,hi,st] of GL){const row=document.createElement('label');row.className='gene';row.innerHTML='<span></span><input type="range"><span class="v"></span>';row.children[0].textContent=lab;const inp=row.children[1];inp.min=lo;inp.max=hi;inp.step=st;inp.value=o.genes[g]??(g==='fur'||g==='heat'?0:1);
      inp.oninput=()=>{o.genes[g]=+inp.value;if(g==='fur')o.col=colorOf(o.sp,o.genes);if(g==='life')o.life=SP[o.sp].life*o.genes.life;GENEDIT++};inspRefs['g_'+g]=row.children[2];B.appendChild(row)}
    // coat colour: two alleles
    const cr=document.createElement('label');cr.className='gene';cr.innerHTML='<span>Coat genes</span><select class="coatsel"></select><span class="v"></span>';const sel=cr.children[1];for(const c of ['NN','ND','Nw','DD','Dw','ww']){const op=document.createElement('option');op.value=c;op.textContent=c;sel.appendChild(op)}
    sel.value=[...(o.genes.coat||'NN')].sort((x,y)=>'NDw'.indexOf(x)-'NDw'.indexOf(y)).join('');sel.onchange=()=>{o.genes.coat=sel.value;o.col=colorOf(o.sp,o.genes);GENEDIT++};inspRefs.coat=cr.children[2];B.appendChild(cr);
    const n=document.createElement('p');n.className='note';n.textContent=`Every gene helps and costs something. Speed catches food or escapes, size resists cold, senses spot danger, fur survives cold, heat tolerance survives heat, lifespan lives longer, fertility has bigger litters, immunity resists disease, but each one uses more energy. Babies get the average of their parents plus small random mutations. Coat colour follows Mendel's rules: N (normal) beats D (dark), which beats w (white), so two normal-looking parents can have a white baby if both carry w. White coats hide in snow and dark coats in forest.`;B.appendChild(n)}
  else{h.textContent=`${o.size<0.3?'🌱':TK[o.k].ic} ${TK[o.k].n}${o.size<0.3?' sapling':''}`;const n=document.createElement('p');n.className='note';n.textContent=`Grows from ${TK[o.k].tmin} to ${TK[o.k].tmax} °C${TK[o.k].rmax<9?', only where it is dry':''}${TK[o.k].fruit?'. Its fruit feeds bears.':'.'} Grown trees drop saplings nearby, which grow into new trees in a few years if the climate suits them.`;B.appendChild(n)}
  const act=document.createElement('div');act.className='actions';B.appendChild(act);
  const mk=(t,f,cls)=>{const b=document.createElement('button');b.className='btn'+(cls?' '+cls:'');b.textContent=t;b.onclick=f;act.appendChild(b);return b};
  mk('Follow',()=>{S.follow=true;cam.z=Math.max(cam.z,3.5)});
  if(!o.k&&!o.hk&&!o.carc&&!o.isVil&&SP[o.sp].tp==='human')mk('⛵ Build a boat',()=>{if(o.age<SP[o.sp].mature){toast(`${nameOf(o)} is too young to build a boat`);return}if(o.boat){toast(`${nameOf(o)} already has a boat`);return}o.boat=true;S.boats=(S.boats||0)+1;BOATS++;chEv('boat',{});toast(`⛵ ${nameOf(o)} built a boat`)});
  if(!o.k&&!o.hk&&!o.carc&&!o.isVil){mk('⚔ Attack nearest',()=>{let foe=null,bd=1e9;for(const b of S.animals){if(b===o||b.dead)continue;const d=dWX(b.x-o.x)**2+dWY(b.y-o.y)**2;if(d<bd){bd=d;foe=b}}if(!foe){toast('No other animal nearby');return}if(bd>25*25){toast('The nearest animal is too far away');return}const w=fight(o,foe,'player');FIGHTS++;toast(w?`⚔ ${nameOf(o)} the ${SP[o.sp].n.toLowerCase()} fought a ${SP[foe.sp].n.toLowerCase()}: ${w===o?'won':'lost'}${(w===o?foe:o).dead?' (killed)':''}`:'No fight')});mk('Feed',()=>{if(o.e<0.95||o.w<0.95)FEEDS++;o.e=1;o.w=1;toast(`Fed ${nameOf(o)}`)});mk('Clone',()=>{const c=addAnimal(o.sp,o.x+0.6,o.y+0.6,{genes:{...o.genes},age:o.age,gen:o.gen});if(c){CLONES++;toast(`Cloned ${nameOf(o)}`)}})}
  if(o.isVil)mk('🛖 Build a hut here',()=>{const h=addHutToVillage(o);if(h){HUTS++;toast(`🛖 The ${h.fam} family built a hut in ${o.name}`);inspRefs.vkey=null}else toast('No room for another hut')});
  if(!o.isVil)mk('Remove',()=>{if(o.carc){o.meat=0;S.carcasses=S.carcasses.filter(c=>c!==o)}else if(o.hk){o.gone='removed';S.homes=S.homes.filter(x=>!x.gone);rebuildHomes()}else if(o.k){o.dead=true;S.trees=S.trees.filter(t=>!t.dead)}else{kill(o,'removed');S.animals=S.animals.filter(a=>!a.dead)}select(null)},'danger');
  updateInspector()}
function drawDNA(c,o){const d=Math.min(2,devicePixelRatio||1),w=c.clientWidth||300,h=28;if(c.width!==Math.round(w*d)){c.width=w*d;c.height=h*d}const p=c.getContext('2d');p.setTransform(d,0,0,d,0,0);p.clearRect(0,0,w,h);
  const G=o.genes,vals=[...GENES.map(([k,,lo,hi])=>[(G[k]??1),1,lo,hi]),[G.fur??0,0,-10,40],[G.heat??0,0,-10,20]],cols=['#ff8a5a','#c9a06a','#7fd0ff','#b48cff','#ff7aa8','#7fe0a8','#e8e8f0','#ffc35a'],n=vals.length+1,bw=w/n;
  p.strokeStyle='rgba(150,210,170,.35)';p.lineWidth=1.5;p.beginPath();for(let x=0;x<=w;x+=2){p.lineTo(x,h/2+Math.sin(x/9)*9)}p.stroke();p.beginPath();for(let x=0;x<=w;x+=2){p.lineTo(x,h/2-Math.sin(x/9)*9)}p.stroke();
  vals.forEach(([v,base,lo,hi],j)=>{const t=(v-lo)/(hi-lo),tb=(base-lo)/(hi-lo);p.fillStyle=cols[j];p.globalAlpha=0.35+0.65*clamp(0.5+(t-tb)*2,0,1);p.fillRect(j*bw+2,3,bw-4,h-6)});
  p.globalAlpha=1;const cc=coatOf(G);p.fillStyle=cc==='white'?'#f0f0ec':cc==='dark'?'#3a2e26':'#a8906f';p.fillRect((n-1)*bw+2,3,bw-4,h-6);p.fillStyle=cc==='dark'?'#fff':'#000';p.font='bold 10px IBM Plex Mono, monospace';p.textAlign='center';p.fillText(G.coat||'NN',(n-0.5)*bw,h/2+3.5);p.textAlign='start'}
function updateInspector(){const o=S.sel;if(!o||$('pane-insp').hidden)return;const R=inspRefs;if(!R.kv)return;
  if(o.dead){R.sub.textContent=`Died: ${o.cause||S.selDead}`;return}
  if(o.gone){R.sub.textContent=`Gone: ${o.gone}`;return}
  if(o.carc&&(o.meat<=0.01||!S.carcasses.includes(o))){R.sub.textContent='Nothing left';return}
  const i=idx(o.x,o.y),T=cellT(i);let rows;
  if(o.isVil){if(!S.villages.includes(o)){R.sub.textContent='This village has been abandoned';return}const huts=S.homes.filter(h=>h.vil===o.id),people=S.animals.filter(a=>!a.dead&&a.home&&a.home.vil===o.id);R.sub.textContent=`Village of human hunters · founded ${((S.t-o.born)/365).toFixed(1)} years ago`;rows=[['Huts',huts.length],['People',people.length],['Boats',people.filter(p=>p.boat).length],['Children',people.filter(p=>p.age<SP[p.sp].mature).length]];
    const key=huts.map(h=>h.id+':'+people.filter(p=>p.home===h).length).join(',');if(R.vkey!==key){R.vkey=key;R.vlist.textContent='';for(const hh of huts){const ppl=people.filter(p=>p.home===hh);const b=document.createElement('button');b.className='endrow';b.style.color='var(--ink)';b.innerHTML='<span></span><b></b>';b.children[0].textContent=`🛖 ${hh.fam||'Unnamed'} hut${hh.prog<1?' (building)':''}`;b.children[1].textContent=ppl.length?ppl.map(p=>HFIRST[p.id%HFIRST.length]).join(', '):'empty';b.children[1].style.color='var(--dim)';b.onclick=()=>select(hh);R.vlist.appendChild(b)}}}
  else if(o.carc){R.sub.textContent=`A ${SP[o.sp].n.toLowerCase()} that died of ${o.cause==='eaten'?'being hunted':o.cause}`;rows=[['Meat left',Math.round(o.meat/o.m0*100)+'%'],['Died',Math.round(S.t-o.t)+' days ago']]}
  else if(o.hk){const res=S.animals.filter(a=>!a.dead&&a.home===o),own=S.animals.find(a=>a.id===o.owner&&!a.dead),bs=SP[o.oname]||{n:'animal'};R.sub.textContent=o.fam?`The ${o.fam} family's hut · built by ${own?nameOf(own):'an earlier '+o.fam}`:`${HOMEK[o.hk].n} built by ${own?nameOf(own)+' the '+bs.n.toLowerCase():'a '+bs.n.toLowerCase()}`;
    const vv=o.vil&&S.villages.find(v=>v.id===o.vil);rows=[...(vv?[['Village',`${vv.name} · ${vv.huts} huts`]]:[]),['Built',o.prog>=1?'Finished':Math.round(o.prog*100)+'%'],['Age',((S.t-o.born)/365).toFixed(1)+' years'],['Living here',res.length],['Hiding inside',res.filter(a=>a.hidden).length],['Young born here',o.kids],['Builder',own?'Alive':'Gone']]}
  else if(!o.k){const s=SP[o.sp];R.sub.textContent=`${s.n}, ${o.sex==='f'?'female':'male'} · ${(o.age/365).toFixed(1)} years · generation ${o.gen}${o.preg>0?' · pregnant':''}${o.sick>0?' · sick':''}`;
    const tmin=s.tmin-o.genes.fur-(o.genes.size-1)*4,tmax=s.tmax-o.genes.fur*0.5;
    const st=o.age<s.mature*0.4?'Baby':o.age<s.mature?`Young · adult at ${(s.mature/365).toFixed(1)} yrs`:o.age>o.life*0.8?'Elderly':'Adult',br=o.age<s.mature?'Not yet':o.preg>0?`Pregnant · ${Math.ceil(o.preg)} days to go`:o.cd>0?`In ${Math.ceil(o.cd)} days`:o.e<s.repE?'Needs more food':'Ready';
    rows=[['Life',`${(o.age/365).toFixed(1)} of about ${(o.life/365).toFixed(0)} years`],['Stage',st],['Can breed',br],['Home',o.home&&!o.home.gone?`${HOMEK[o.home.hk].n}${o.home.prog<1?' (building)':''} · ${Math.hypot(o.home.x-o.x,o.home.y-o.y).toFixed(0)} away`:homeKind(o.sp)?'None yet':'Roams (no home)'],['Health',o.sick>0?`Sick 🦠 · about ${Math.ceil(o.sick)} days to go`:o.immT>0?`Immune for ${Math.ceil(o.immT)} days`:'Healthy'],...(o.mate?[['Partner',(()=>{const m=S.animals.find(z=>z.id===o.mate&&!z.dead);return m?nameOf(m):'—'})()]]:[]),['Diet',DIETN[s.diet]],['Energy',Math.round(o.e*100)+'%'],['Tiredness',Math.round(Math.min(1,(o.fat||0)/1.6)*100)+'%'+((o.fat||0)>1.15?' · exhausted!':'')],['Water',s.thirst?Math.round(o.w*100)+'%':'—'],['Doing',STATE[o.state]||o.state],...(s.tp==='human'?[['Boat',o.boat?'Yes ⛵':o.boatProg>0?`Building (${Math.round(o.boatProg*100)}%)`:o.age<s.mature?'Too young':'Not yet']]:[]),['Children',o.kids],['Fights',`${o.wins||0} won · ${o.losses||0} lost${o.hurt>0?' · injured':''} · strength ${strength(o).toFixed(2)}`],['Kills',o.kills+(s.tp==='human'?` · ${o.ky||0} of ${CL.huntQuota} this year`:'')],['Eats',s.diet==='herb'?(s.hab==='water'?'Algae':'Plants'):s.diet==='omni'?'Fruit, fish, small animals, plants':s.tp==='human'?'Almost any animal, from rabbits to mammoths':((L=>L.length>6?L.slice(0,6).join(', ')+` and ${L.length-6} more`:L.join(', '))((s.prey||[]).map(k=>SP[k].pl)))],['Comfort',`${tmin.toFixed(0)} to ${tmax.toFixed(0)} °C`],['Here',`${T.toFixed(0)} °C${o.warm?' · warmed by the campfire':''}${o.outT>0?` · outside its zone: ${Math.round(o.outT/7)} of 60 weeks`:o.stress>1?' (stressed)':''}`]];
    const P=o.par;for(const [k] of GENES){const v=o.genes[k]??1,pv=P?((P.m[k]??1)+(P.f[k]??1))/2:null;R['g_'+k].textContent=(pv!=null?pv.toFixed(2)+'→':'')+v.toFixed(2)}
    for(const k of ['fur','heat']){const v=o.genes[k]??0,pv=P?((P.m[k]??0)+(P.f[k]??0))/2:null;R['g_'+k].textContent=(pv!=null?pv.toFixed(0)+'→':'')+v.toFixed(1)}
    R.coat.textContent=`${coatOf(o.genes)}${o.genes.from?` · ${o.genes.from.m} from mum, ${o.genes.from.f} from dad`:''}`;
    if(!R.famDone){R.famDone=1;R.fam.textContent='';const mk2=(lab,id,nm)=>{const b=document.createElement('button');b.className='btn';b.textContent=`${lab}: ${nm}`;b.onclick=()=>{const t=S.animals.find(z=>z.id===id&&!z.dead);if(t){select(t);S.follow=true}else toast(`${nm} is no longer alive`)};R.fam.appendChild(b)};
      if(P){mk2('Mother',o.mom,P.mn);if(P.fn)mk2('Father',o.dad,P.fn)}else{const sp=document.createElement('span');sp.className='note';sp.textContent='First generation: no known parents.';R.fam.appendChild(sp)}
      const kids=S.animals.filter(z=>!z.dead&&(z.mom===o.id||z.dad===o.id)).length;const sp2=document.createElement('span');sp2.className='note';sp2.textContent=` ${kids} living children${o.genes.muts?` · mutations at birth: ${o.genes.muts.join(', ')}`:''}`;R.fam.appendChild(sp2)}
    drawDNA(R.dna,o)}

  else rows=[['Age',(o.age/365).toFixed(0)+' years'],['Stage',o.size<0.3?'Sapling':o.size<0.55?'Young tree':'Grown (drops saplings)'],['Size',Math.round(o.size*100)+'%'],['Health',Math.round(o.hp*100)+'%'],['Fruit',TK[o.k].fruit?Math.round(o.fruit*100)+'%':'—'],['Here',`${meanT(i).toFixed(0)} °C average`],['Water',Math.round(wetAt(i)*100)+'%'+(dw[i]<=4?' (near water)':'')]];
  if(R.kv.children.length!==rows.length){R.kv.textContent='';for(const r of rows){const d=document.createElement('div');d.innerHTML='<span class="k"></span><span class="v"></span>';R.kv.appendChild(d)}}
  rows.forEach((r,j)=>{R.kv.children[j].children[0].textContent=r[0];R.kv.children[j].children[1].textContent=r[1]});
  // portrait
  const c=R.pic,d=Math.min(2,devicePixelRatio||1),w=c.clientWidth||300,hh=c.clientHeight||120;if(c.width!==w*d){c.width=w*d;c.height=hh*d}const p=c.getContext('2d');p.setTransform(d,0,0,d,0,0);
  const px=img.data,o4=i*4;p.fillStyle=`rgb(${px[o4]},${px[o4+1]},${px[o4+2]})`;p.fillRect(0,0,w,hh);
  if(o.isVil){p.font='54px system-ui';p.textAlign='center';p.textBaseline='middle';p.fillText('🏘️',w/2,hh/2);p.textAlign='start';return}
  if(o.carc){p.font='54px system-ui';p.textAlign='center';p.textBaseline='middle';p.fillText(o.meat/o.m0>0.3?SP[o.sp].ic:'🦴',w/2,hh/2);p.textAlign='start';return}
  if(o.hk){const old=gx;gx=p;try{drawHome(o,w/2,hh/2,4)}finally{gx=old}return}
  const save=ctx;ctxSwap(p,()=>{if(o.k)drawTree(o,w/2,hh/2,5.5);else drawAnimal({...o,dir:-0.35},w/2,hh/2,1,o.sp==='mouse'?7:o.sp==='fish'?6:SP[o.sp].len>10?2.6:4)})}
let GENEDIT=0;
function ctxSwap(p,f){const real=window.__ctx||ctx;const old=ctx;try{CTXREF.c=p;f()}finally{CTXREF.c=old}}
const CTXREF={c:null};

/* search */
let findItems=[],findSel=0;
const lev=(a,b)=>{const m=a.length,n=b.length,d=Array.from({length:m+1},(_,i)=>[i]);for(let j=1;j<=n;j++)d[0][j]=j;for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[m][n]};
function findMatches(q){q=q.toLowerCase().trim();if(!q)return[];const out=[];
  const all=[...SPK.map(k=>({k,t:'sp',names:[SP[k].n,SP[k].pl]})),...CATA.filter(c=>!SP[c.key]).map(c=>({k:c.key,t:'cat',c,names:[c.n,c.pl]})),...Object.keys(TK).map(k=>({k,t:'tree',names:[TK[k].n]})),...SCEN.map(s=>({k:s.id,t:'world',names:[s.n]}))];
  for(const it of all){let best=9;for(const n of it.names){const nl=n.toLowerCase();if(nl.startsWith(q))best=0;else if(nl.includes(q))best=Math.min(best,1);else best=Math.min(best,lev(q,nl.slice(0,Math.max(q.length,3)))+1)}if(best<=2)out.push({...it,score:best})}
  return out.sort((a,b)=>a.score-b.score||(a.t==='sp'?-1:1)).slice(0,7)}
function renderFind(){const q=$('find').value,L=$('findList');L.textContent='';findItems=[];findSel=0;const ms=findMatches(q);
  for(const m of ms){if(m.t==='cat'){const c=m.c;findItems.push({label:`${c.ic} Release ${c.pl.toLowerCase()} here`,sm:`${{herb:'herbivore',carn:'carnivore',omni:'omnivore'}[ATPL[c.tp].diet]} · 6 at the centre of the view`,go:()=>{const k=addSpecies(c);const p=nearestHab(k);if(p){const n=spawnAt(k,p[0],p[1],6,true,undefined,true);PLACED[k]=(PLACED[k]||0)+n;toast(`${c.ic} Released ${c.pl.toLowerCase()} · find them under Added in the toolbar`)}else toast(SP[k].hab==='water'?`${c.pl} need water: move the view over a lake or the sea`:'No suitable place in view')}});continue}
    if(m.t==='sp'){const n=S.animals.filter(a=>!a.dead&&a.sp===m.k).length;if(n)findItems.push({label:`${SP[m.k].ic} Find a ${SP[m.k].n.toLowerCase()}`,sm:`${n} alive`,go:()=>flyTo(m.k)});findItems.push({label:`${SP[m.k].ic} Release ${SP[m.k].pl.toLowerCase()} here`,sm:'6 at the centre of the view',go:()=>{const c=nearestHab(m.k);if(c){spawnAt(m.k,c[0],c[1],6,true,undefined,true);PLACED[m.k]=(PLACED[m.k]||0)+6;toast(`Released ${SP[m.k].pl.toLowerCase()}`)}else toast('No suitable place in view')}})}
    else if(m.t==='tree')findItems.push({label:`${TK[m.k].ic} Plant ${TK[m.k].n.toLowerCase()}s`,sm:'pick the tool',go:()=>setTool(m.k)});else findItems.push({label:`🌍 World: ${SCEN.find(s=>s.id===m.k).n}`,sm:'load it',go:()=>loadScen(m.k)})}
  if(q&&!findItems.length){const e=document.createElement('div');e.className='note';e.style.padding='6px 8px';e.textContent='No match. Try elephant, tiger, penguin, shark, oak…';L.appendChild(e)}
  findItems.forEach((it,j)=>{const b=document.createElement('button');b.textContent=it.label;const s=document.createElement('small');s.textContent=it.sm;b.appendChild(s);b.className=j===0?'on':'';b.onmousedown=e=>{e.preventDefault();pickFind(j)};L.appendChild(b)});
  L.hidden=!q}
function nearestHab(sp){const cx=wxOf(W/2),cy=wyOf(H/2);for(let r=0;r<60;r+=2)for(let k=0;k<12;k++){const a=k/12*TAU,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;if(habitatOK(sp,idx(x,y)))return[x,y]}return null}
function pickFind(j){const it=findItems[j];if(!it)return;$('find').value='';$('findList').hidden=true;$('find').blur();it.go()}
$('find').addEventListener('input',renderFind);$('find').addEventListener('blur',()=>setTimeout(()=>$('findList').hidden=true,150));
$('find').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();pickFind(findSel)}else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();findSel=clamp(findSel+(e.key==='ArrowDown'?1:-1),0,findItems.length-1);[...$('findList').children].forEach((b,j)=>b.className=j===findSel?'on':'')}else if(e.key==='Escape'){$('find').value='';renderFind();$('find').blur()}});

/* ================= worlds ================= */
const SCEN=[
 {id:'meadow',n:'Temperate meadow',d:'Woods, grassland and lakes: rabbits, deer, foxes, wolves, bears and hawks.',ter:{seed:11,freq:3.2,land:.62,mount:.35,edge:3,center:.2,moist:.62,peak:1.6,lakes:[[.42,.5,6],[.6,.38,4],[.3,.62,4]]},t0:0,trees:{oak:220,pine:60,bush:80},an:{rabbit:220,mouse:180,deer:100,fox:10,wolf:3,bear:6,hawk:8,fish:250,otter:8,x_squirrel:40,x_hedgehog:20,x_badger:8,x_owl:6,x_frog:50,x_duck:30,x_bee:40,x_butterfly:40,x_beaver:10,x_wild_boar:16,x_robin:30,x_snake:8}},
 {id:'savanna',n:'Savanna',d:'Hot dry grassland with herds of zebras and bison, prides of lions and a few waterholes.',ter:{seed:23,freq:2.6,land:.72,mount:.4,edge:3,center:.25,moist:.42,lakes:[[.35,.45,6],[.62,.55,6],[.5,.3,4],[.25,.65,5],[.75,.35,5],[.5,.72,5],[.15,.35,4],[.85,.6,4]]},t0:8,trees:{palm:60,bush:30,cactus:20,oak:20},an:{zebra:110,bison:50,lion:6,mouse:150,hawk:4,fish:150,rabbit:60}},
 {id:'arctic',n:'Arctic',d:'A frozen land: only the thickest fur survives. Wolves hunt deer and bears fish the coast.',ter:{seed:37,freq:3,land:.6,mount:1,edge:3,center:.2,moist:.55},t0:-7,trees:{pine:180},an:{rabbit:160,deer:90,wolf:3,bear:3,fox:5,fish:200,otter:4},adapt:1},
 {id:'rainforest',n:'Rainforest',d:'Hot, wet and packed with life. Palms and oaks crowd the rivers.',ter:{seed:41,freq:3.4,land:.64,mount:.6,edge:3,center:.2,moist:.98},t0:10,trees:{palm:300,oak:80,bush:100},an:{deer:60,mouse:180,rabbit:120,bear:3,hawk:5,fish:250,otter:6,lion:4}},
 {id:'desert',n:'Desert',d:'Scorching dunes, cactus and rare oases. Camels go weeks without water.',ter:{seed:53,freq:2.4,land:.86,mount:.5,edge:3,center:.1,moist:.12,lakes:[[.3,.4,4],[.7,.6,4],[.5,.7,3]]},t0:12,trees:{cactus:160,palm:24},an:{camel:30,mouse:150,fox:5,hawk:3,rabbit:50,fish:60}},
 {id:'islands',n:'Archipelago',d:'Dozens of islands in a warm sea, full of fish and otters.',ter:{seed:67,freq:5.2,land:.36,mount:.5,edge:2,center:0,moist:.72},t0:8,trees:{palm:100,oak:40,bush:50},an:{fish:400,otter:10,rabbit:120,deer:25,hawk:5,mouse:100}},
 {id:'pangaea',n:'Supercontinent',d:'One huge continent from the frozen north to the hot south: every species finds its place.',ter:{seed:79,freq:2.2,land:.7,mount:1,edge:3,center:.35,moist:.6,lakes:[[.5,.5,5]]},t0:0,tc:27,latK:40,trees:{oak:160,pine:120,palm:100,cactus:40,bush:80},an:{rabbit:200,mouse:180,deer:70,bison:40,zebra:50,camel:15,fox:7,wolf:3,lion:3,bear:3,hawk:5,fish:300,otter:5},adapt:1},
 {id:'africa',n:'African savanna',d:'Elephants, giraffes, wildebeest and gazelles; lions, hyenas and cheetahs; hippos and crocodiles at the waterholes.',ter:{seed:101,freq:2.6,land:.74,mount:.35,edge:3,center:.25,moist:.45,lakes:[[.35,.45,6],[.62,.55,6],[.5,.3,5],[.25,.65,5],[.75,.35,5],[.5,.72,5]]},t0:9,trees:{palm:70,bush:40,cactus:15,oak:25},an:{x_elephant:16,x_giraffe:18,x_gazelle:90,x_wildebeest:80,zebra:60,x_warthog:30,mouse:80,x_ostrich:14,fish:150,x_hippopotamus:8,lion:5,x_hyena:4,x_cheetah:4,x_crocodile:3,x_vulture:3}},
 {id:'outback',n:'Australian outback',d:'Red dust and gum trees: kangaroos, wallabies, emus and koalas, with dingoes and snakes.',ter:{seed:113,freq:2.4,land:.8,mount:.4,edge:3,center:.15,moist:.3,lakes:[[.3,.4,5],[.7,.6,5],[.5,.5,4]]},t0:10,trees:{oak:40,palm:20,cactus:30,bush:30},an:{x_kangaroo:70,x_wallaby:40,x_emu:20,x_koala:12,rabbit:40,x_cockatoo:20,x_lizard:30,fish:60,x_dingo:6,x_snake:8}},
 {id:'amazon',n:'Amazon rainforest',d:'Jaguars, capybaras, tapirs, monkeys and sloths; piranhas and caimans in the rivers.',ter:{seed:127,freq:3.6,land:.6,mount:.4,edge:3,center:.2,moist:1},t0:11,trees:{palm:320,oak:80,bush:120},an:{x_capybara:60,x_tapir:30,x_monkey:50,x_sloth:30,x_parrot:30,x_toucan:20,x_frog:80,fish:250,x_jaguar:3,x_anaconda:3,x_piranha:40,x_caiman:3}},
 {id:'polar',n:'Polar coast',d:'Ice and ocean: polar bears hunt seals, penguins crowd the shore, reindeer and arctic foxes roam the tundra.',ter:{seed:139,freq:4,land:.42,mount:.6,edge:2,center:.1,moist:.55},t0:-5,trees:{pine:80},an:{x_lemming:150,x_arctic_hare:80,x_reindeer:60,fish:450,x_seal:14,x_walrus:6,x_penguin:24,x_polar_bear:2,x_arctic_fox:4,x_arctic_wolf:3,x_snowy_owl:3,x_orca:2},adapt:1},
 {id:'reef',n:'Ocean and reef',d:'A warm sea dotted with islands: reef fish, sea turtles, dolphins, sharks and whales.',ter:{seed:151,freq:5,land:.22,mount:.4,edge:1,center:0,moist:.75},t0:10,trees:{palm:90,bush:20},an:{fish:450,x_clownfish:120,x_sea_turtle:20,x_jellyfish:60,x_crab:30,x_whale:3,x_dolphin:5,x_shark:3,x_octopus:5,x_seagull:6,x_pelican:4}},
 {id:'jurassic',n:'Jurassic world',d:'Long-necked giants, triceratops and stegosaurus, hunted by velociraptors and a T. rex.',ter:{seed:163,freq:3,land:.66,mount:.6,edge:3,center:.2,moist:.8,lakes:[[.4,.5,6],[.65,.4,5]]},t0:10,trees:{palm:200,oak:80,bush:60},an:{x_triceratops:16,x_stegosaurus:16,x_brachiosaurus:10,x_dragonfly:20,fish:150,x_frog:60,x_velociraptor:5,x_t_rex:2,x_crocodile:3}},
 {id:'farm',n:'Farmland and hunters',d:'Cows, sheep, pigs and chickens share the fields with deer and rabbits, while human hunters stalk the woods.',ter:{seed:177,freq:3,land:.66,mount:.25,edge:3,center:.2,moist:.62,peak:1.6,lakes:[[.45,.5,5],[.3,.35,4]]},t0:1,trees:{oak:160,bush:60,pine:30},an:{x_cow:30,x_sheep:40,x_pig:20,x_chicken:40,x_horse:10,rabbit:80,deer:40,mouse:60,fish:100,fox:5,x_human_hunter:8}},
 {id:'iceage',n:'Ice age',d:'Woolly mammoths, reindeer and musk oxen on the cold steppe, hunted by sabre-toothed cats, wolves and human hunters.',ter:{seed:189,freq:2.8,land:.7,mount:.5,edge:3,center:.25,moist:.5,lakes:[[.5,.5,5],[.3,.6,4]]},t0:0,trees:{pine:150},an:{x_mammoth:20,x_reindeer:80,x_musk_ox:30,x_arctic_hare:80,fish:150,wolf:3,x_sabre_toothed_cat:2,x_human_hunter:6},adapt:1},
 {id:'barren',n:'Barren land',d:'Bare soil and empty lakes, with a mild climate. Bring it to life yourself.',ter:{seed:91,freq:3,land:.62,mount:.7,edge:3,center:.2,moist:.62,lakes:[[.45,.5,6]]},t0:0,trees:{},an:{},bare:1},
];
function loadScen(id,opts={}){const sc=SCEN.find(s=>s.id===id)||SCEN[0];RNG=seeded((sc.ter.seed*977+(opts.seed||0))>>>0);
  S.scen=sc.id;CL.tc=sc.tc??16;CL.latK=sc.latK??20;S.animals=[];S.trees=[];S.t=90;S.hist=[];S.lastHist=0;S.sel=null;S.follow=false;S.burning.clear();S.parts=[];S.maxGen={};S.born=S.died=S.kills=0;S.falling=null;S.flash=null;
  CL.temp=0;CL.rain=1;CL.seaM=0;CL.dust=0;CL.seasons=true;CL.t0=sc.t0;S.homes=[];S.villages=[];S.carcasses=[];S.clouds=[];tvInfo=null;tvJob=null;S.oldAge=0;hbuckets=new Map();PLACED={};WATERED=0;RAINED=0;
  genTerrain(sc.ter);SEASON=seasonF();
  // grow the vegetation in for a while so the world starts lush
  if(!sc.bare){for(let i=0;i<N;i++)veg[i]=isWater(i)?0:capOf(meanT(i),rainAt(i))*rr(.5,.9);for(let k=0;k<8;k++)updateVeg(10)}else{veg.fill(0)}
  for(let i=0;i<N;i++){alg[i]=isWater(i)?(sc.bare?0.02:0.5):0;mic[i]=isWater(i)?(sc.bare?0.1:0.5):sc.bare?0.08:0.25+0.45*veg[i];fert[i]=sc.bare?0:0.2}
  for(const [k,n0] of Object.entries(sc.trees)){const n=Math.round(n0*2.2);let made=0;for(let q=0;q<n*20&&made<n;q++){const p=randomCell(i=>treeOK(k,i),50);if(!p)continue;let c=0;nearTrees(p[0],p[1],1.2,()=>c++);if(c)continue;addTree(k,p[0],p[1]);made++;if(made%20===0)rebuildTrees()}rebuildTrees()}
  for(const k of Object.keys(sc.an)){if(!SP[k]){const c=CATA.find(c=>c.key===k);if(c)addSpecies(c)}}
  S.seen={};S.status={};S.statusReady=false;
  for(const [k,n0] of Object.entries(sc.an).filter(([k])=>SP[k]).sort((x,y)=>(SP[x[0]].diet==='herb'?0:1)-(SP[y[0]].diet==='herb'?0:1))){const n=Math.round(n0*1.35);let made=0;const s=SP[k];
    const grp=Math.max(s.herd?5:3,Math.ceil(n/18));for(let g=0;g<n+30&&made<n;g++){const pr=s.prey&&S.animals.filter(z=>s.prey.includes(z.sp));if(pr&&pr.length){const z=pr[Math.floor(rnd()*pr.length)];made+=spawnAt(k,z.x,z.y,Math.min(n-made,s.herd?4:2),true,0.92);continue}const p=randomCell(i=>habitatOK(k,i)&&(s.hab==='water'||s.hab==='air'||(meanT(i)>s.tmin-14&&meanT(i)<s.tmax+2))&&(s.hab!=='amph'||dw[i]<=1),400);if(!p)continue;made+=spawnAt(k,p[0],p[1],Math.min(n-made,grp),true)}}
  // many adults already have a home when the world begins (humans start in villages)
  S.quietBuild=true;rebuildTrees();for(const a of S.animals){const s=SP[a.sp];if(a.age>s.mature&&homeKind(a.sp)&&(s.tp==='human'||rnd()<0.55)){const h=buildHome(a,true);if(h)for(const b of S.animals)if(b!==a&&b.sp===a.sp&&!b.home&&Math.hypot(b.x-a.x,b.y-a.y)<2&&rnd()<0.5)b.home=h}}S.quietBuild=false;
  if(sc.an.x_human_hunter){S.quietBuild=true;for(const v of S.villages.slice())while(v.huts<5&&addHutToVillage(v)){}S.quietBuild=false}
  for(let k=0;k<40;k++)stepWeather(0.25);RNG=Math.random;rebuildHash();rebuildTrees();sampleHist();S.terrainDirty=true;paintTerrain();tvInfo=null;tvJob=null;syncClimateUI();select(null);if(!opts.keepCam){fitWorld();cam.z*=1.9}setView('normal');VIEWCH=0}
function buildScen(){const g=$('scgrid');g.textContent='';for(const s of SCEN){const b=document.createElement('button');b.className='scb';b.innerHTML='<b></b><span></span>';b.children[0].textContent=s.n;b.children[1].textContent=s.d;b.onclick=()=>{loadScen(s.id);$('scen').hidden=true;toast(s.n)};g.appendChild(b)}}
$('scenBtn').onclick=()=>{$('scen').hidden=!$('scen').hidden};$('scenClose').onclick=()=>$('scen').hidden=true;
