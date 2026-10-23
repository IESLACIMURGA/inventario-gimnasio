/* Service worker: permite instalar la web en el móvil y abrirla sin conexión.
   La estructura de la web se guarda en caché; los datos se piden siempre a la red
   (la propia web guarda una copia de los datos por si falla la conexión). */
const VERSION = 'inventario-v1';
const ESTRUCTURA = ['./', 'index.html', 'css/estilos.css', 'js/app.js', 'js/config.js', 'js/carga.js',
  'js/datos.js', 'js/csv.js', 'js/qr.js', 'manifest.webmanifest', 'img/icono-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ESTRUCTURA)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.includes('/datos/')) return;
  // Red primero (para recibir siempre la última versión) y caché si no hay conexión
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok) { const copia = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copia)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
