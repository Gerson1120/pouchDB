const CACHE_NAME = "only-cache-v2"; // Mantenemos v2 o podemos subir a v3
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles/main.css",
  "./main.js",
  "./scripts/app.js",
  "./manifest.json",
  "./images/icons/192.png",
  "./images/icons/512.png",
  "https://cdn.jsdelivr.net/npm/pouchdb@9.0.0/dist/pouchdb.min.js"
];

// Install: Cachear el App Shell (sin cambios)
self.addEventListener("install", e => {
  console.log("[SW] Instalando...");
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("[SW] Cacheando el App Shell");
      return cache.addAll(APP_SHELL);
    })
    .then(() => self.skipWaiting()) // Forzar la activación inmediata
  );
});

// Activate: Limpiar cachés antiguos (sin cambios)
self.addEventListener("activate", e => {
  console.log("[SW] Activado");
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log("[SW] Limpiando caché antiguo:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch: Estrategia "Cache, falling back to Network" CON MANEJO DE ERRORES
self.addEventListener("fetch", e => {
  // Ignorar peticiones que no sean GET (como POST) o de extensiones de Chrome
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) {
    return;
  }

  e.respondWith(
    // 1. Intentar buscar la respuesta en el caché
    caches.match(e.request)
      .then(cachedResponse => {
        // 2. Si la encontramos, la devolvemos. ¡Rápido y offline!
        if (cachedResponse) {
          return cachedResponse;
        }

        // 3. Si no está en caché, la buscamos en la red.
        return fetch(e.request).then(networkResponse => {
            // 3a. Si la encontramos en la red, la devolvemos.
            return networkResponse;
          })
          .catch(error => {
            // 3b. **AQUÍ ESTÁ LA MAGIA**
            // Si la petición de red falla (porque estás offline),
            // el '.catch()' captura el error y evita que el Service Worker se rompa.
            console.error('[SW] La petición de red falló para:', e.request.url);
            
            // En lugar de no devolver nada, podemos devolver una respuesta de error genérica.
            // Esto satisface al navegador y evita el TypeError.
            // Para recursos como JS o CSS, el navegador simplemente verá que la carga falló.
            return new Response(null, {
              status: 404,
              statusText: "Not found in cache and offline"
            });
          });
      })
  );
});