const CACHE_NAME = 'logicmatch-v5';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/manifest.json?v=4',
  '/favicon.ico',
  '/favicon.ico?v=4',
  '/favicon-32x32.png',
  '/favicon-32x32.png?v=4',
  '/favicon-16x16.png',
  '/favicon-16x16.png?v=4',
  '/icon-192.png',
  '/icon-192.png?v=4',
  '/icon-512.png',
  '/icon-512.png?v=4',
  '/apple-touch-icon.png',
  '/apple-touch-icon.png?v=4'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Individually cache each asset so that if any single download fails
      // (e.g. due to server restart, query strings, or offline states),
      // the entire install process succeeds and never throws "Failed to download file".
      return Promise.allSettled(
        ASSETS_TO_CACHE.map((url) => {
          return cache.add(url).catch((err) => {
            console.warn(`[Service Worker] Failed to cache asset: ${url}`, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // For navigation/HTML requests, use Network-First strategy
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If successful, clone response and cache it for offline fallback
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed (offline), fall back to cached index.html
          return caches.match('/index.html');
        })
    );
    return;
  }

  // For all other static assets, use Cache-First, falling back to network
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch((err) => {
        console.warn(`[Service Worker] Fetch failed for: ${event.request.url}`, err);
      });
    })
  );
});
