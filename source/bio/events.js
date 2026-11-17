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
