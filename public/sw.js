// Route Lightweight PWA Worker (Push & Notification handling only)
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

// Pass all fetch requests directly to the network without interfering with Next.js App Router chunks
self.addEventListener("fetch", () => {
  // Let the browser/Next.js handle all page routing & chunk fetching natively
  return;
});
