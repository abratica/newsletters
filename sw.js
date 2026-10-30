const SHELL = "nl-shell-v17";
const SHELL_FILES = ["./", "index.html", "manifest.webmanifest",
  "css/base.css", "css/home.css", "css/sports.css", "css/wire.css", "css/todo.css", "js/app.js", "js/sports.js", "js/wire.js", "js/todo.js",
  "icons/icon-192.png", "icons/icon-512.png",
  "fonts/manrope-latin-500-normal.woff2", "fonts/manrope-latin-600-normal.woff2",
  "fonts/manrope-latin-700-normal.woff2", "fonts/manrope-latin-800-normal.woff2",
  "fonts/barlow-condensed-latin-500-normal.woff2", "fonts/barlow-condensed-latin-600-normal.woff2",
  "fonts/barlow-condensed-latin-700-normal.woff2", "fonts/source-serif-4-latin-400-normal.woff2",
  "fonts/source-serif-4-latin-600-normal.woff2", "fonts/source-serif-4-latin-700-normal.woff2",
  "fonts/archivo-black-latin-400-normal.woff2"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith("nl-") && k !== SHELL && k !== "nl-data").map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Only "nl-" caches are cleaned up, so other apps on this site (Boston Sports, Mario Habit) keep theirs.
// Network first for everything (new issues and app updates show up right away),
// falling back to the cache when offline.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  const bucket = url.pathname.endsWith(".json") ? "nl-data" : SHELL;
  e.respondWith(
    // no-cache: always check GitHub for a newer file, so app updates show up on the next open.
    fetch(e.request, { cache: "no-cache" }).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(bucket).then((c) => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match("index.html")))
  );
});
