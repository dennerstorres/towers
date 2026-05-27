const CACHE_NAME = 'towers-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './assets/icons/manifest.json',
    './assets/og-image.png',
    './src/game/data/locales.json',
    './src/game/data/config.json',
    './src/game/data/enemies.json',
    './src/game/data/classes.json',
    './src/game/data/races.json',
    './src/game/data/feats.json',
    './src/game/data/effects.json',
    './src/game/data/items.json',
    './src/game/data/maps.json',
    './src/game/data/modifiers.json',
    './src/game/data/meta.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then(fetchResponse => {
                    // Check if we received a valid response
                    if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                        return fetchResponse;
                    }

                    // Dynamically cache new assets (like JS modules)
                    const responseToCache = fetchResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                    return fetchResponse;
                });
            })
    );
});
