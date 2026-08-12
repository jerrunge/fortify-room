// Offline-first shell. The room never waits on a network.
// DEPLOY RULE: bump CACHE on every deploy, or devices keep the old build.
const CACHE = "fortify-room-v2";
const SHELL = [
  "./", "./index.html", "./app.css", "./manifest.webmanifest",
  "./js/main.js", "./js/map.js", "./js/state.js", "./js/geometry.js",
  "./content/content.js", "./content/arsenal.js", "./content/evidence.js",
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)));
});
