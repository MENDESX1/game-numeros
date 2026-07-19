const CACHE_NAME = 'logicmatch-v4';
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

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).catch((err) => {
        console.warn(`[Service Worker] Fetch failed for: ${event.request.url}`, err);
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
