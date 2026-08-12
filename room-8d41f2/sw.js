// Offline-first shell. The room never waits on a network.
// DEPLOY RULE: bump CACHE on every deploy, or devices keep the old build.
const CACHE = "fortify-room-v6";
const SHELL = [
  "./", "./index.html", "./app.css", "./manifest.webmanifest",
  "./js/main.js", "./js/map.js", "./js/state.js", "./js/geometry.js",
  "./content/content.js", "./content/arsenal.js", "./content/evidence.js",
  "./fonts/schibsted.woff2", "./fonts/newsreader.woff2", "./fonts/newsreader-italic.woff2",
  "./fonts/plexmono-400.woff2", "./fonts/plexmono-500.woff2",
];
self.addEventListener("install", (e) => {
  // cache:'reload' bypasses the browser HTTP cache, or a new version can install
  // with stale files mixed in (found live 2026-08-11: a fresh cache name captured
  // an old module from the HTTP cache and served a version skew).
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(SHELL.map(u => new Request(u, { cache: "reload" }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)));
});
