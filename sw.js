const V='sims-b3e02d500c',PAGES=["./", "barycenter/", "life/", "lithosphere/", "troposphere/", "catalyst/", "abyssal/", "interchange/", "gridlock/", "hivemind/", "flux/", "seaway/", "contrail/", "quasar/", "simulations/"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(PAGES)).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k.startsWith('sims-')).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET')return;
  const mine=u.origin===location.origin&&u.pathname.startsWith('/Simulators/'),fonts=/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname),libs=u.hostname==='cdnjs.cloudflare.com';
  if(!mine&&!fonts&&!libs)return;
  if(r.mode==='navigate'||r.destination==='document'){e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(V).then(x=>x.put(r,c));return res}).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('./'))));return}
  e.respondWith(caches.match(r).then(m=>{const net=fetch(r).then(res=>{if(res.ok||res.type==='opaque'){const c=res.clone();caches.open(V).then(x=>x.put(r,c))}return res}).catch(()=>m);return m||net}))});
