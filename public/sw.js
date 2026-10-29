/**
 * sw.js - Personal Hub Offline-First Service Worker
 * Fully offline-capable caching for all app assets, scripts, styles, fonts, and pages.
 */

const CACHE_NAME = "personal-hub-v3.0-offline";

const CORE_PRECACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.png",
  "/apple-touch-icon.png",
  "/icon.svg",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
  "/Personal_Hub_Template.xlsx"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_PRECACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Do not intercept WebSocket connections or chrome extensions
  if (url.protocol === "ws:" || url.protocol === "wss:" || !url.protocol.startsWith("http")) {
    return;
  }

  // Navigation requests: try network first, fallback to cached index.html
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(async () => {
          const cachedIndex = await caches.match("/index.html");
          if (cachedIndex) return cachedIndex;
          return caches.match("/");
        })
    );
    return;
  }

  // Static assets & scripts: Stale-while-revalidate or Cache-first
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(() => {
          // If network failed and nothing cached, check if index fallback helps
          return cachedRes;
        });

      return cachedRes || fetchPromise;
    })
  );
});
