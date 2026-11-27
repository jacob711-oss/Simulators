self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys())await caches.delete(k);await self.registration.unregister();for(const c of await self.clients.matchAll({type:'window'})){if(!c.url.includes('/s-wqartapi6725im2t8l/'))c.navigate(c.url)}})())});
