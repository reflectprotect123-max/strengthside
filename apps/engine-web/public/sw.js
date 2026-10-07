/* STRENGTHSIDE-DESIGNED: cache public app files only. */
const NAME='hybrid-engine-web-4d91b1e188b715b6',ASSETS=["/index.html","/native-plugins.js","/web.js","/manifest.webmanifest","/icons/icon-192.png","/icons/icon-512.png"];
self.addEventListener('install',event=>event.waitUntil(caches.open(NAME).then(cache=>cache.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'}))))));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE')self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('hybrid-engine-web-')&&k!==NAME).map(k=>caches.delete(k))))));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;const asset=event.request.mode==='navigate'?'/index.html':url.pathname;if(!ASSETS.includes(asset))return;event.respondWith(caches.open(NAME).then(cache=>cache.match(asset)).then(hit=>hit||fetch(event.request)));});
