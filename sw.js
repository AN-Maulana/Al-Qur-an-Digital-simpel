// ==========================================================================
// SERVICE WORKER - Al-Quran Digital PWA
// Cache strategy: Cache-first untuk assets, Network-first untuk API
// ==========================================================================

const CACHE_NAME = 'alquran-pwa-v2';
const CACHE_STATIC = [
    './',
    './index.html',
    './script.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    'https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap',
    'https://cdn.tailwindcss.com'
];

// Install: cache semua asset statis
self.addEventListener('install', event => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(CACHE_STATIC.filter(url => !url.startsWith('https://cdn.')));
        }).then(() => {
            console.log('[SW] Static assets cached');
            return self.skipWaiting();
        }).catch(err => {
            console.warn('[SW] Cache install error (non-fatal):', err);
            return self.skipWaiting();
        })
    );
});

// Activate: hapus cache lama
self.addEventListener('activate', event => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => {
                        console.log('[SW] Deleting old cache:', key);
                        return caches.delete(key);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: strategi hybrid
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // API calls: Network-first (jangan cache response API)
    if (url.hostname.includes('equran.id') ||
        url.hostname.includes('aladhan.com') ||
        url.hostname.includes('ournoor.com') ||
        url.hostname.includes('republika') ||
        url.hostname.includes('rss2json') ||
        url.hostname.includes('vercel.app')) {
        event.respondWith(
            fetch(event.request).catch(() => {
                return new Response(JSON.stringify({ error: 'Offline - koneksi tidak tersedia' }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            })
        );
        return;
    }

    // Static assets: Cache-first
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;
            return fetch(event.request).then(networkResponse => {
                // Cache response baru
                if (networkResponse && networkResponse.status === 200) {
                    const cloned = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
                }
                return networkResponse;
            }).catch(() => {
                // Offline fallback untuk HTML pages
                if (event.request.destination === 'document') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});

