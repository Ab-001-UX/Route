"use client";

import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Unregister any active service worker to guarantee fresh live fetches from Vercel
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      if (window.caches) {
        window.caches.keys().then((keys) => {
          keys.forEach((key) => window.caches.delete(key));
        });
      }
    }
  }, []);

  return null;
}
