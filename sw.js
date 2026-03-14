const CACHE_NAME = 'ahc-portal-v26';
const ASSETS = [
  './',
  './index.html',
  './home/index.html',
  './daily/index.html',
  './daily/daily.js',
  './evening/index.html',
  './evening/evening.js',
  './miniclub/index.html',
  './miniclub/miniclub.js',
  './team/index.html',
  './team/team.js',
  './admin/index.html',
  './admin/admin.js',
  './css/style.css',
  './js/core.js',
  './js/data.js',
  './js/translations.js',
  './js/weather.js',
  './manifest.json',
  './assets/logo.png',
  './assets/home-bg.jpg',
  './404.html',
  'https://unpkg.com/@phosphor-icons/web'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, networkResponse.clone());
        });
        return networkResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const targetUrl = e.notification.data.url || './';
  
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
