"use client";

import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "development") {
        // Automatically unregister service worker and clear Cache Storage in development
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister().then((unregistered) => {
              if (unregistered) {
                console.log("Service Worker unregistered in development mode.");
              }
            });
          }
        });
        if (typeof window !== "undefined" && window.caches) {
          window.caches.keys().then((keys) => {
            keys.forEach((key) => {
              window.caches.delete(key).then(() => {
                console.log("Deleted Cache Storage:", key);
              });
            });
          });
        }
        return;
      }

      const handleLoad = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("Service Worker registered with scope:", reg.scope);
          })
          .catch((err) => {
            console.error("Service Worker registration failed:", err);
          });
      };

      // If page is already loaded, register immediately. Otherwise, register on load.
      if (document.readyState === "complete") {
        handleLoad();
      } else {
        window.addEventListener("load", handleLoad);
        return () => window.removeEventListener("load", handleLoad);
      }
    }
  }, []);

  return null;
}
