const CACHE_NAME = 'towers-v4';
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
    const request = event.request;
    const url = new URL(request.url);
    const shouldRefreshFirst =
        request.mode === 'navigate' ||
        request.destination === 'script' ||
        request.destination === 'style' ||
        url.pathname.endsWith('.json');

    if (shouldRefreshFirst) {
        event.respondWith(
            fetch(request).then(fetchResponse => {
                if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                    return fetchResponse;
                }

                const responseToCache = fetchResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(request, responseToCache);
                });

                return fetchResponse;
            }).catch(() => caches.match(request))
        );
        return;
    }

    event.respondWith(
        caches.match(request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(request).then(fetchResponse => {
                    // Check if we received a valid response
                    if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                        return fetchResponse;
                    }

                    // Dynamically cache new assets (like JS modules)
                    const responseToCache = fetchResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseToCache);
                    });

                    return fetchResponse;
                });
            })
    );
});
