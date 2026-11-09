/* CaVeSal® Calculadora prenatal — full. Red primero para páginas y scripts; copia guardada solo sin internet. */
const CACHE = "cavesal-full-v22";

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll([new Request("./", { cache: "reload" }), new Request("../cvs-export.js?v=3", { cache: "reload" })]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => (k.startsWith("cavesal-full-") || /^cavesal-v\d+$/.test(k)) && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const esCodigo = req.mode === "navigate" || /\.(html|js|css|json)$/.test(url.pathname) || url.pathname.endsWith("/");
  if (esCodigo) {
    e.respondWith(
      fetch(req, { cache: "no-cache" }).then(r => {
        if (r && r.status === 200) { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(req, c)); }
        return r;
      }).catch(() => caches.match(req).then(m => m || caches.match(req, { ignoreSearch: true })).then(m => m || caches.match("./")))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(r => {
      if (r && r.status === 200) { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(req, c)); }
      return r;
    }))
  );
});
