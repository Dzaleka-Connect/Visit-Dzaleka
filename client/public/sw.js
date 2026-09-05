// Bump when cache policy changes so older cached documents are removed.
const CACHE_NAME = 'dzaleka-visit-2026-09-06-v2';
const STATIC_ASSETS = ['/manifest.json'];

const offlineResponse = () => new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Connection unavailable | Visit Dzaleka</title>
<style>body{font:1rem/1.6 system-ui,sans-serif;margin:0;padding:24px;background:#f8fafc;color:#172033}main{max-width:36rem;margin:12vh auto}h1{line-height:1.2}a{display:inline-flex;align-items:center;min-height:44px;color:#174ea6}a:focus-visible{outline:3px solid #174ea6;outline-offset:4px}</style>
</head><body><main><h1>We couldn’t connect</h1><p>Check your internet connection, then try again to load this page.</p><a href="">Try again</a></main></body></html>`, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
});

const unavailableResponse = () => new Response('Connection unavailable. Please try again.', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
});

async function cacheResponse(request, response) {
    if (!response.ok || response.type !== 'basic' || response.redirected ||
        /no-store|private/i.test(response.headers.get('Cache-Control') || '')) return;
    // Cache failures (including quota/private browsing restrictions) must not
    // turn an otherwise successful network response into a failed request.
    try {
        const copy = response.clone();
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, copy);
    } catch { /* Caching is optional. */ }
}

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        try {
            const cache = await caches.open(CACHE_NAME);
            await cache.addAll(STATIC_ASSETS);
        } catch { /* Installation also works offline or without cache storage. */ }
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        try {
            const names = await caches.keys();
            await Promise.all(names.filter(name => name.startsWith('dzaleka-visit-') && name !== CACHE_NAME)
                .map(name => caches.delete(name)));
        } catch { /* A storage failure must not prevent taking control. */ }
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin || request.method !== 'GET') return;

    // Let the browser and query client handle APIs directly, including errors.
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return;

    if (request.mode === 'navigate' || request.destination === 'document' ||
        url.pathname === '/' || url.pathname.endsWith('.html')) {
        // Never persist HTML: protected pages and old deployment shells must
        // not be replayed from the service worker cache.
        event.respondWith(fetch(request).catch(offlineResponse));
        return;
    }

    // Do not cache arbitrary authenticated endpoints or partial media requests.
    if (request.headers.has('range') ||
        (!['script', 'style', 'image', 'font'].includes(request.destination) &&
            !STATIC_ASSETS.includes(url.pathname))) return;

    const cached = caches.open(CACHE_NAME).then(cache => cache.match(request)).catch(() => undefined);
    const network = fetch(request).catch(() => null);
    event.waitUntil(network.then(response => response ? cacheResponse(request, response) : undefined));
    event.respondWith(cached.then(async response => response || await network || unavailableResponse()));
});
