/* Service Worker - Undanganku PWA */
const CACHE_NAME = "undanganku-v1";

// Aset inti yang di-cache saat service worker pertama aktif
const CORE_ASSETS = ["/", "/icon.svg"];

// Hanya cache request GET. Jangan cache API yang dinamis (auth, order, dll).
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Hapus cache lama saat service worker baru aktif
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Strategi:
// - Navigasi (dokumen HTML): network-first, fallback ke cache, fallback offline page.
// - Aset statis (gambar, font, CSS): cache-first.
// - API /auth, /api: network-only (jangan cache data sensitif).
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Hanya tangani GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Jangan cache API dan halaman admin/dashboard
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/register")
  ) {
    return;
  }

  // Navigasi halaman: network-first dengan fallback offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone & simpan HTML ke cache
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then(
            (cached) =>
              cached ||
              caches.match("/offline").then(
                (offline) => offline || caches.match("/")
              )
          )
        )
    );
    return;
  }

  // Aset statis: cache-first, lalu fetch & simpan
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            // Hanya cache respons sukses
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
  }
});