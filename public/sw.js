const CACHE_NAME = "route-cache-v3";
const STATIC_ASSETS = [
  "/home",
  "/saved",
  "/manifest.json"
];

// 1. Install Event: Cache essential shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // We wrap in a try-catch/ignore to ensure install finishes even if some assets aren't present yet
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("Service worker cache.addAll warning during install:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean up outdated caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Intercept requests and apply custom caching strategies
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // API Call to getSavedVehicles
  if (url.pathname === "/api/saved-vehicles") {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch((err) => {
              console.log("SW: API fetch failed (offline). Serving from cache if available:", err);
              return cachedResponse || Response.error();
            });

          // Serve cached response instantly if we have it, otherwise wait for network
          return cachedResponse || fetchPromise;
        });
      })
    );
  } else {
    // Standard static resource matching (Stale-While-Revalidate)
    // Avoid caching POST requests, Chrome extensions, or Convex WebSocket/HTTP requests
    if (
      event.request.method !== "GET" ||
      url.protocol.startsWith("chrome-extension") ||
      url.hostname.includes("convex.cloud") ||
      url.hostname.includes("clerk") ||
      url.pathname.startsWith("/_next/webpack-hmr") ||
      url.pathname === "/sw.js"
    ) {
      return;
    }

    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (
              networkResponse.status === 200 &&
              (url.pathname.endsWith(".css") ||
                url.pathname.endsWith(".js") ||
                url.pathname.includes("/fonts/") ||
                url.pathname.includes("/icons/"))
            ) {
              const cacheClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, cacheClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            return cachedResponse || Response.error();
          });

        return cachedResponse || fetchPromise;
      })
    );
  }
});
