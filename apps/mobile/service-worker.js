const CACHE = 'the-hybrid-athlete-engine-v52';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        [
          './',
          './index.html',
          './whoop.js',
          './nutrition-bundle.js',
          './strength-bundle.js',
          './recovery-engine.js',
          './recovery-signals.js',
          './strength-adapter.js',
          './load-headline.js',
          './coordinator-adapter.js',
          './strength-sync.js',
          './nutrition-ui.js',
          './engine-bundle.js',
          './engine-adapter.js',
          './echo-ftms.js',
          './concept2.js',
          './native-bridge.js',
          './label-scan.js',
          './label-scan-live.js',
          './food-catalog.js',
          './food-catalog-au.json',
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
