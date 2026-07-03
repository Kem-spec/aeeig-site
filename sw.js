/* AEEIG — Service Worker minimal (permet l'installation + un secours hors-ligne).
   Stratégie « réseau d'abord » : en ligne on a toujours la version à jour ;
   hors-ligne on sert la dernière version en cache. Les appels Supabase
   (autre origine) ne sont jamais mis en cache. */
const CACHE = "aeeig-v1";
const SHELL = [
  "./index.html", "./css/style.css", "./js/config.js", "./js/data.js", "./js/app.js",
  "./assets/logo-full.png", "./assets/logo-mark.png", "./assets/icon-192.png",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  // Ne traiter que les GET de même origine ; laisser passer Supabase, polices, CDN…
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
  );
});
