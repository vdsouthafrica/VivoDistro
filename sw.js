const CACHE_NAME = 'vivo-distro-v3';

function appUrl(path = '') {
    return new URL(path, self.registration.scope).toString();
}

function normalizeAppPath(path = 'index.html') {
    return path.startsWith('/') ? path.slice(1) : path;
}

const PRECACHE_URLS = [
    appUrl(''),
    appUrl('index.html'),
    appUrl('login.html'),
    appUrl('style.css'),
    appUrl('icon-192.png'),
    appUrl('icon-512.png'),
    appUrl('icon-maskable-512.png'),
    appUrl('favicon-32x32.png'),
    appUrl('manifest.json')
];

// ===== INSTALL: pre-cache core shell =====
self.addEventListener('install', function(event) {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(PRECACHE_URLS);
        })
    );
});

// ===== ACTIVATE: clean up old caches =====
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// ===== FETCH: network-first, fall back to cache =====
self.addEventListener('fetch', function(event) {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(function() {
                return caches.match(event.request).then(function(cached) {
                    return cached || caches.match(appUrl('index.html'));
                });
            })
        );
        return;
    }

    const isStaticAsset = /\.(?:css|js|png|jpg|jpeg|webp|svg|ico|json)$/i.test(url.pathname);
    if (!isStaticAsset) return;

    event.respondWith(
        caches.match(event.request).then(function(cached) {
            const networkFetch = fetch(event.request)
                .then(function(networkResponse) {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                    }
                    return networkResponse;
                })
                .catch(function() {
                    return cached;
                });

            return cached || networkFetch;
        })
    );
});

// ===== PUSH NOTIFICATIONS (existing) =====
self.addEventListener('push', function(event) {
    console.log('Received a push message', event);

    let data = { title: 'New Alert', body: 'You have a new notification from Vivo Distro.', url: 'inbox.html' };
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: 'favicon-32x32.png',
        badge: 'favicon-32x32.png',
        vibrate: [100, 50, 100],
        data: {
            url: normalizeAppPath(data.url || 'inbox.html')
        }
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    const urlToOpen = appUrl(normalizeAppPath(event.notification.data.url || 'inbox.html'));

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
