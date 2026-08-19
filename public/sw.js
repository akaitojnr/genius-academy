// Minimal app-shell service worker. Caches the offline fallback and a
// handful of static routes so the app still opens (with a friendly offline
// page) on a flaky connection — a real concern for the target audience.
// This intentionally does NOT cache API responses or lesson/video data,
// since that content changes and must always be fetched fresh.

const CACHE_NAME = "brightpath-shell-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [OFFLINE_URL, "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Only intervene on top-level navigations; let everything else (API
  // calls, video, JS/CSS chunks) go straight to the network as normal.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
  }
});
