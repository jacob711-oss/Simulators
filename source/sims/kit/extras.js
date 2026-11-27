/* ===== extras for every simulator: 📸 snapshot and ⛶ full screen ===== */
var SNAPS=0;
(function(){
  const cv=document.getElementById('world')||document.getElementById('sky');if(!cv)return;
  const name=(document.title||'simulation').replace(/\s+/g,'-').toLowerCase();
  const say=m=>{try{if(typeof toast==='function')toast(m)}catch(e){}};
  function snap(){try{const w=cv.width,h=cv.height,o=document.createElement('canvas');o.width=w;o.height=h;const c=o.getContext('2d');c.drawImage(cv,0,0);
      const s=Math.max(1,w/1200),t=(document.title||'')+'  ·  '+new Date().toLocaleDateString();c.font=`600 ${Math.round(16*s)}px "IBM Plex Mono",monospace`;const tw=c.measureText(t).width;
      c.fillStyle='rgba(0,0,0,.55)';c.fillRect(w-tw-28*s,h-38*s,tw+20*s,28*s);c.fillStyle='#fff';c.textBaseline='middle';c.fillText(t,w-tw-18*s,h-24*s);
      const a=document.createElement('a');a.download=`${name}-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.png`;a.href=o.toDataURL('image/png');document.body.appendChild(a);a.click();a.remove();
      SNAPS++;try{if(typeof chEv==='function')chEv('snap',{})}catch(e){}say('Picture saved to your downloads')}catch(e){say('Could not save a picture here')}}
  const canFull=!!(document.fullscreenEnabled||document.webkitFullscreenEnabled);
  function full(){const d=document,el=d.documentElement;if(d.fullscreenElement||d.webkitFullscreenElement){(d.exitFullscreen||d.webkitExitFullscreen).call(d)}else{(el.requestFullscreen||el.webkitRequestFullscreen).call(el)}}
  const ICONS={cam:'<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M3 6h3l1.5-2h5L14 6h3v10H3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="10" cy="11" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',full:'<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M3 8V3h5M12 3h5v5M17 12v5h-5M8 17H3v-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'};const mk=(ic,tip,fn)=>{const b=document.createElement('button');if(ICONS[ic])b.innerHTML=ICONS[ic];else b.textContent=ic;b.title=tip;b.setAttribute('aria-label',tip);b.onclick=e=>{e.stopPropagation();fn()};return b};
  const zb=document.querySelector('.zoomb');let box=zb;
  if(!box){box=document.createElement('div');box.className='xtras';box.style.cssText='position:fixed;left:12px;bottom:12px;z-index:30;display:flex;gap:6px';document.body.appendChild(box);
    const st=document.createElement('style');st.textContent='.xtras button{width:38px;height:38px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(10,14,26,.82);color:#fff;font-size:17px;cursor:pointer}.xtras button:hover{background:rgba(40,50,80,.9)}@media (max-width:760px){.xtras{left:auto!important;right:10px!important;bottom:auto!important;top:220px!important;flex-direction:column}}';document.head.appendChild(st)}
  box.appendChild(mk('cam','Save a picture of the world',snap));if(canFull)box.appendChild(mk('full','Full screen',full));
  window.SIM_SNAP=snap;
  // a tutorial step and a challenge for the kit simulators
  try{if(typeof CC==='function'&&typeof TSTEPS!=='undefined'){const kit=typeof SIM!=='undefined';const su=kit?undefined:typeof scen==='function'?scen('solar'):typeof scn==='function'?scn('meadow'):undefined;
    const where=document.querySelector('.zoomb')?'next to the zoom buttons':'in the bottom-left corner';
    TSTEPS.push(['Take a picture',`Press the camera button ${where} to save a picture of your world.`,r=>SNAPS>r.n,r=>{r.n=SNAPS}]);
    const o={t:'Photographer',g:'Save a picture of the world with the camera button.',hint:`The camera button is ${where}.`,check:()=>{const ok=typeof evN==='function'?evN('snap')>0:(typeof CH!=='undefined'&&CH.events?CH.events.some(e=>e.k==='snap'):false);return[ok,ok?1:0,'']},stars:typeof byTime==='function'?byTime(10,30):undefined};if(kit)o.scen=SIM.tutScen||SIM.home;else o.setup=su;CC(1.02,o)}}catch(e){}
})();
