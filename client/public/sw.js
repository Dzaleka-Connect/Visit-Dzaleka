// Version updated on each deploy - change this when deploying!
// Or use a build step to inject a timestamp
const CACHE_VERSION = '2026-01-13-v1';
const CACHE_NAME = `dzaleka-visit-${CACHE_VERSION}`;

const STATIC_ASSETS = [
    '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    // Force the waiting service worker to become active
    self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    // Delete all caches that don't match current version
                    if (cache !== CACHE_NAME && cache.startsWith('dzaleka-visit-')) {
                        console.log('SW: Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    // Take control of all pages immediately
    self.clients.claim();
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Handle API requests (Network Only - don't cache API responses)
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Handle HTML requests (Network First - CRITICAL for avoiding stale HTML)
    // This includes the root / and any navigation requests
    if (event.request.mode === 'navigate' ||
        url.pathname === '/' ||
        url.pathname.endsWith('.html')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Cache the fresh response
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                })
                .catch(() => {
                    // Fallback to cache only if offline
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Handle static assets (CSS, JS, images) - Stale While Revalidate
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request)
                .then((networkResponse) => {
                    // Only cache valid responses
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }

                    // Don't try to clone if body is already used
                    if (networkResponse.bodyUsed) {
                        return networkResponse;
                    }

                    // Clone and cache the response
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return networkResponse;
                })
                .catch((error) => {
                    // Silently fail for background updates if offline
                    console.log('SW: Background fetch failed (offline?):', error.message);
                    return cachedResponse;
                });

            // Return cached immediately, update in background
            return cachedResponse || fetchPromise;
        })
    );
});

