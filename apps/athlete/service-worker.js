const CACHE = 'strength-brain-1.3.4';
const ASSETS = ["./","./app.js","./assets/hpp-logo.jpg","./capgo-updates.js","./connectors/whoop.js","./home.css","./hybrid-integrations.js","./hybrid-sc.js","./index.html","./library-ui.js","./library.css","./library.js","./logger.css","./logger.js","./native-bridge.js","./plan-sync.js","./release.js","./session.js","./strength-brain-core.js","./strength-brain.js","./strength-config.js","./strength-equipment.js","./strength-home.css","./strength-home.js","./strength-memory.js","./strength-only.js","./strength-policy.js","./strength-rts.js","./strength-targets.js","./timer.js","./training-core.js","./vendor/supabase.min.js","./whoop-common.js"];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes('/functions/v1/')) return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => cached))
  );
});
