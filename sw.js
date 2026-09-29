// Page: network first, so new versions of the game arrive right away (cache is only the offline fallback).
// Everything else (three.js, icons): cache first.
const CACHE = 'forest-tag-v10';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png',
  'https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function save(req, res) {
  if (res.ok || res.type === 'opaque') {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(req, copy));
  }
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    // no-cache: always revalidate with the server, so the browser's HTTP cache can't hand back an old page either
    e.respondWith(fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then(res => save(req, res))
      .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => save(req, res))));
});
