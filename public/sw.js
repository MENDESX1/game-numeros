// Self-destroying service worker to clear any old cache and unregister itself completely.
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installed. Forcing activation...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated. Cleaning up all caches and unregistering...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[Service Worker] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[Service Worker] Unregistering self...');
      return self.registration.unregister();
    }).then(() => {
      console.log('[Service Worker] Claiming clients...');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Let everything go straight to the network without caching
  event.respondWith(fetch(event.request));
});
