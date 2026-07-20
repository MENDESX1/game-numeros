const CACHE_NAME = 'logicmatch-v5';
const isDev = self.location.hostname === 'localhost' || 
              self.location.hostname.includes('ais-dev') || 
              self.location.hostname.includes('ais-pre') || 
              self.location.hostname.includes('127.0.0.1');

if (isDev) {
  // Self-destroying/unregistering Service Worker for development/preview environments
  self.addEventListener('install', () => {
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .then(() => self.registration.unregister())
        .then(() => console.log('[Service Worker] Unregistered active development SW successfully.'))
    );
  });
} else {
  // Production PWA Service Worker
  const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico',
    '/favicon-32x32.png',
    '/favicon-16x16.png',
    '/icon-192.png',
    '/icon-512.png',
    '/apple-touch-icon.png'
  ];

  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
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

    try {
      const url = new URL(event.request.url);
      if (
        url.pathname.startsWith('/@vite') ||
        url.pathname.startsWith('/src/') ||
        url.pathname.includes('hot-update') ||
        url.origin !== self.location.origin
      ) {
        return; // Let browser handle it natively
      }
    } catch (e) {
      // Ignore invalid URL formats
    }

    // For navigation/HTML requests, use Network-First strategy
    if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
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
        return fetch(event.request);
      })
    );
  });
}

