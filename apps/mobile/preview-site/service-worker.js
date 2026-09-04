const CACHE = 'the-hybrid-athlete-blank-v170';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        [
          './',
          './index.html',
          './whoop.js',
          './echo-ftms.js',
          './native-ble.js',
          './concept2.js',
          './native-bridge.js',
          './log-columns.js',
          './exercise-load-profiles.js',
          './session-chrome.js',
          './session-flow.js',
          './rest-overlay.js',
          './work-overlay.js',
          './exercise-search-index.js',
          './exercise-search.js',
          './exercise-history-seed.js',
          './exercise-history-seed-apply.js',
          './manifest.json',
        ].map((url) => cache.add(url).catch(() => undefined)),
      ),
    ),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Never cache Netlify function proxies — WHOOP status/sync must be live.
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/.netlify/functions/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const fresh = await fetch(event.request);
        if (fresh && fresh.ok) await cache.put(event.request, fresh.clone());
        return fresh;
      } catch (error) {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        throw error;
      }
    })(),
  );
});
