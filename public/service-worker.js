const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/assets/css/styles.css",
    "/assets/icons/icon-192x192.png",
    "/assets/icons/icon-512x512.png",
    "/dist/app.bundle.js",
    "/dist/manifest.json",
    "https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"
  ];
const STATIC_CACHE = "static-cache-v1";
const DATA_CACHE = "data-cache-v1";

// install
self.addEventListener("install", evt => {
  // pre cache transaction data
  evt.waitUntil(
    caches.open(DATA_CACHE).then(cache => cache.add("/api/transaction"))
  );
  // pre cache all static assets
  evt.waitUntil(
    caches.open(STATIC_CACHE)
    .then(cache => cache.addAll(FILES_TO_CACHE))
    .then(() => self.skipWaiting())
  );
});

// activate
self.addEventListener("activate", evt => {
  const currentCaches = [STATIC_CACHE, DATA_CACHE];
  evt.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        // return array of cache names that are old to delete
        return cacheNames.filter(
          cacheName => !currentCaches.includes(cacheName)
        );
      })
      .then(cachesToDelete => {
        return Promise.all(
          cachesToDelete.map(cacheToDelete => {
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// fetch
self.addEventListener("fetch", evt => {
  // non GET requests are not cached and requests to other origins are not cached
  if (
    evt.request.method !== "GET" ||
    !evt.request.url.startsWith(self.location.origin)
  ) {
    evt.respondWith(fetch(evt.request));
    return;
  }

  // handle data GET requests for data from /api routes
  if (
    evt.request.method === "GET" && 
    evt.request.url.includes("/api/")) {
    // make network request and fallback to cache if network request fails (offline)
    evt.respondWith(
      caches.open(DATA_CACHE).then(cache => {
        return fetch(evt.request)
          .then(response => {
            cache.add(evt.request, response.clone());
            return response;
          })
          .catch(() => caches.match(evt.request));
      })
    );
    return;
  }

  // use cache first for all other requests for performance
  evt.respondWith(
    caches.match(evt.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // request is not in cache. make network request and cache the response
      return caches.open(DATA_CACHE).then(cache => {
        return fetch(evt.request).then(response => {
          return cache.put(evt.request, response.clone()).then(() => {
            return response;
          });
        });
      });
    })
  );
});
