// Service worker for PWA offline capability
const CACHE_NAME = 'evently-v2';
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/icon-192.svg',
  '/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip API and Socket.IO calls
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/socket.io')) return;

  // For HTML navigation requests: ALWAYS network-first to ensure fresh index.html
  // and prevent stale bundle hash references after new deployments
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // For static assets: try network first or cache match
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((networkResponse) => {
        // Never cache HTML responses when requesting static assets or scripts
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          !networkResponse.headers.get('content-type')?.includes('text/html')
        ) {
          // Cache non-HTML static resources safely
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      });
    })
  );
});
