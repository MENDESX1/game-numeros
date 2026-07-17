const CACHE_NAME = 'logicmatch-cache-v4';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png'
];

// Install Event - Precache App Shell
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the waiting service worker to become active immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching app shell...');
      // Use individual caching promises so a single network/file error doesn't abort installation
      const cachePromises = PRECACHE_ASSETS.map((url) => {
        return cache.add(url).catch((err) => {
          console.warn(`[Service Worker] Failed to precache asset ${url}:`, err);
        });
      });
      return Promise.all(cachePromises);
    })
  );
});

// Activate Event - Clean up old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // Take control of all open pages immediately
    })
  );
});

// Handle skipWaiting messages from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch Event - Strategic Caching
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // 1. Navigation requests (HTML pages) - Always Network-First to detect updates instantly, fallback to Cache
  if (request.mode === 'navigate' || requestUrl.pathname === '/' || requestUrl.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          console.log('[Service Worker] Fetch failed, serving offline layout.');
          return caches.match('/') || caches.match('/index.html');
        })
    );
    return;
  }

  // 2. Pure Cache-First for static media, icons, and fonts (these do not change between versions, or are versioned)
  const isMediaOrFont = 
    /\.(png|jpg|jpeg|gif|svg|ico|webp|woff2|woff|ttf|otf|mp3|wav|ogg|m4a)$/i.test(requestUrl.pathname) ||
    requestUrl.hostname.includes('fonts.gstatic.com') ||
    requestUrl.hostname.includes('fonts.googleapis.com');

  if (isMediaOrFont) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 3. Cache-First with Stale-While-Revalidate for JS/CSS assets (Hashed builds)
  const isBuildAsset = requestUrl.pathname.includes('/assets/');
  if (isBuildAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {/* Silent catch */});

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 4. Default: Network-First with Cache fallback for general API requests or other assets
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});
