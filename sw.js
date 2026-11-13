// ═══════════════════════════════════════════════════════════════
// 📦 SERVICE WORKER — caché del "shell" de la app
// ═══════════════════════════════════════════════════════════════
// Objetivo: que la app abra rápido (o sin señal) después de la primera visita.
// El juego en sí sigue necesitando conexión: Firebase no pasa por acá.
//
// Estrategias:
//   • Archivos propios  → red primero (siempre la última versión deployada);
//     si la red tarda más de 3s o falla, se sirve la copia en caché.
//   • CDNs con versión fija (SDK de Firebase, fuentes, QR) → caché primero.
//   • Todo lo demás (Firebase Realtime DB, auth) → no se toca.
//
// Al agregar un archivo nuevo a la app, sumarlo a PRECACHE
// (tests/unit/sw.test.js falla si falta alguno).
const CACHE = "dame-la-main-v1";

const PRECACHE = [
  "./",
  "index.html",
  "styles.css",
  "manifest.webmanifest",
  "icon.svg",
  "js/main.js",
  "js/firebase.js",
  "js/firebase.config.js",
  "js/logica.js",
  "js/shuffle.js",
  "js/historial.js",
  "js/audio.js",
  "js/motion.js",
  "js/theme.config.js",
  "js/preguntas.js",
  "js/preguntas.classic.js",
  "js/preguntas.mundial.js",
  "js/games/info.js",
  "js/games/dame-la-main/index.js",
  "js/games/quien-es-main/index.js",
  "js/games/quien-es-main/logica.js",
  "js/games/quien-es-main/famosos.js",
  "js/games/pictionary/index.js",
  "js/games/pictionary/logica.js",
  "js/games/pictionary/palabras.js",
  "js/games/numero-main/index.js",
  "js/games/numero-main/logica.js",
  "js/games/tipo-main/index.js",
  "js/games/tipo-main/logica.js",
  "js/games/tipo-main/palabras.js",
];

// Hosts de terceros que sirven archivos versionados e inmutables
const CDN_HOSTS = ["www.gstatic.com", "fonts.googleapis.com", "fonts.gstatic.com", "cdnjs.cloudflare.com"];

const NETWORK_TIMEOUT_MS = 3000;

self.addEventListener("install", (event) => {
  // Cada archivo por separado: si uno falla, el resto igual queda cacheado
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// `key`: bajo qué entrada se guarda (por defecto, la propia request)
async function guardar(request, response, key = request) {
  // Las respuestas opacas (scripts de CDN sin CORS) tienen status 0 y se pueden cachear igual
  if (response && (response.ok || response.type === "opaque")) {
    const cache = await caches.open(CACHE);
    await cache.put(key, response.clone());
  }
  return response;
}

async function redPrimero(request) {
  const cache  = await caches.open(CACHE);
  // Las navegaciones ("?room=ABC123" incluido) comparten una sola entrada: el index
  const key    = request.mode === "navigate" ? "./" : request;
  const cached = await cache.match(key);
  const red    = fetch(request).then((res) => guardar(request, res, key));
  if (!cached) return red;
  red.catch(() => {}); // si la red falla después de servir el caché, que no quede sin manejar
  const timeout = new Promise((resolve) => setTimeout(() => resolve(cached), NETWORK_TIMEOUT_MS));
  return Promise.race([red.catch(() => cached), timeout]);
}

async function cachePrimero(request) {
  const cached = await caches.match(request);
  return cached || fetch(request).then((res) => guardar(request, res));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    event.respondWith(redPrimero(request));
  } else if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(cachePrimero(request));
  }
});
