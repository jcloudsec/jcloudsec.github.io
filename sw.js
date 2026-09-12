const CACHE_NAME = 'devsecjuan-security-portfolio-v2';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/work.html',
    '/certs.html',
    '/contact.html',
    '/style.css',
    '/manifest.json',

    // Core images
    '/assets/img/linux_logo.png',
    '/assets/img/devops.png',
    '/assets/img/about-page-image.png',
    '/assets/img/DevSecOps-Diagram.png',

    // Project images
    '/assets/img/urlshortener-aws.png',
    '/assets/img/cloudwatch-pagerduty.png',
    '/assets/img/alz-tf-module-overview.png',
    '/assets/img/SAST:DAST.png',

    // Certification images
    '/assets/img/fundamentalbadge.png',
    '/assets/img/AWS-Certified-Cloud-Practitioner_badge.png',
    '/assets/img/CompTIA_Security_2B.png',
    '/assets/img/ejptbadge.png',
    '/assets/img/CCSK.png'
];


/* =========================================================
   INSTALL
   Cache the main portfolio assets.
   ========================================================= */

self.addEventListener('install', event => {

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching portfolio assets');

                return cache.addAll(STATIC_ASSETS);
            })
    );

    self.skipWaiting();
});


/* =========================================================
   ACTIVATE
   Remove old versions of the portfolio cache.
   ========================================================= */

self.addEventListener('activate', event => {

    event.waitUntil(

        caches.keys().then(cacheNames => {

            return Promise.all(

                cacheNames
                    .filter(cacheName => cacheName !== CACHE_NAME)
                    .map(cacheName => {
                        console.log(
                            '[Service Worker] Removing old cache:',
                            cacheName
                        );

                        return caches.delete(cacheName);
                    })

            );

        })

    );

    self.clients.claim();
});


/* =========================================================
   FETCH
   Network-first for HTML.
   Cache-first for static assets.
   ========================================================= */

self.addEventListener('fetch', event => {

    const request = event.request;

    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);


    /* -----------------------------------------------------
       HTML / Navigation

       Use the network first so portfolio updates appear
       quickly instead of visitors seeing stale pages.
       ----------------------------------------------------- */

    if (
        request.mode === 'navigate' ||
        request.destination === 'document'
    ) {

        event.respondWith(

            fetch(request)
                .then(networkResponse => {

                    const responseClone = networkResponse.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(request, responseClone);
                        });

                    return networkResponse;
                })
                .catch(() => {

                    return caches.match(request)
                        .then(cachedResponse => {

                            return cachedResponse ||
                                caches.match('/index.html');

                        });

                })

        );

        return;
    }


    /* -----------------------------------------------------
       External resources

       Bootstrap, Font Awesome, Google Fonts, etc.
       should be fetched normally.
       ----------------------------------------------------- */

    if (url.origin !== self.location.origin) {

        event.respondWith(
            fetch(request)
                .catch(() => caches.match(request))
        );

        return;
    }


    /* -----------------------------------------------------
       Local static assets

       Images, CSS, fonts, etc.
       ----------------------------------------------------- */

    event.respondWith(

        caches.match(request)
            .then(cachedResponse => {

                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(request)
                    .then(networkResponse => {

                        if (
                            !networkResponse ||
                            networkResponse.status !== 200 ||
                            networkResponse.type !== 'basic'
                        ) {
                            return networkResponse;
                        }

                        const responseClone =
                            networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(
                                    request,
                                    responseClone
                                );
                            });

                        return networkResponse;
                    });

            })

    );

});