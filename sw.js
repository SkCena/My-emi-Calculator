// My EMI Calculator — Service Worker
// Bump CACHE_VERSION whenever you deploy changes to force-refresh cached files.
const CACHE_VERSION = 'myemi-v1';
const CORE_ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/i18n.js',
    './js/calculator.js',
    './js/app.js',
    './manifest.json',
    './assets/logo.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
        ))
    );
    self.clients.claim();
});

// Strategy: cache-first for our own core assets (instant offline loads),
// network-first for everything else (e.g. CDN libraries) so those always stay fresh.
self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const isCoreAsset = CORE_ASSETS.some((asset) => req.url.endsWith(asset.replace('./', '')));

    if (isCoreAsset) {
        event.respondWith(
            caches.match(req).then((cached) => cached || fetch(req).then((res) => {
                const resClone = res.clone();
                caches.open(CACHE_VERSION).then((cache) => cache.put(req, resClone));
                return res;
            }))
        );
    } else {
        event.respondWith(
            fetch(req).catch(() => caches.match(req))
        );
    }
});
