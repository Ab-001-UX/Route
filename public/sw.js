const CACHE_NAME = "route-cache-v5";
const STATIC_ASSETS = [
  "/manifest.json"
];

// 1. Install Event: Cache essential shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("Service worker cache.addAll warning during install:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean up all outdated caches immediately
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

// 3. Listen for SKIP_WAITING message
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// 4. Fetch Event: Network-First for HTML navigations to prevent stale chunk mismatches
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Exclude non-GET, Clerk, Convex, Webpack HMR, and SW requests
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

  // Network-First for HTML Page Navigations (Prevents "This page couldn't load" chunk errors)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline, fallback to cached HTML page
          return caches.match(event.request).then((cached) => cached || caches.match("/home"));
        })
    );
    return;
  }

  // Stale-While-Revalidate for static assets (images, css, js)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
