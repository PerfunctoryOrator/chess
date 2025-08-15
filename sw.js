// Service Worker for Chess Web Interface
// Version management and offline caching

const CORE_VERSION = "1.0.1beta";
const MEDIA_VERSION = "1.0.1beta";

const CORE_CACHE_NAME = `chess-core-v${CORE_VERSION}`;
const MEDIA_CACHE_NAME = `chess-media-v${MEDIA_VERSION}`;

// Files associated with core version
const CORE_FILES = [
    "/chess-web/",
    "/chess-web/index.html",
    "/chess-web/board-manager.js",
    "/chess-web/board-styles.css",
    "/chess-web/document-set-up.js",
    "/chess-web/error-styles.css",
    "/chess-web/general-styles.css",
    "/chess-web/settings-manager.js",
    "/chess-web/square-positions.css",
];

// Files associated with media version
const MEDIA_FILES = [
    "/chess-web/square-positions.css",
    "/chess-web/board-pieces.css",
    "/chess-web/media-support/apple-touch-icon-dark.png",
    "/chess-web/media-support/apple-touch-icon-tint.png",
    "/chess-web/media-support/apple-touch-icon.png",
    "/chess-web/media-support/favicon-dark.ico",
    "/chess-web/media-support/favicon-tint.ico",
    "/chess-web/media-support/favicon.ico",
    "/chess-web/media-support/white-pawn.png",
    "/chess-web/media-support/fonts/noto-sans/noto-sans.ttf",
    "/chess-web/media-support/fonts/noto-sans/noto-sans-italic.ttf",
    "/chess-web/media-support/fonts/noto-serif/noto-serif.ttf",
    "/chess-web/media-support/fonts/noto-serif/noto-serif-italic.ttf",
];

// Installation event — cache initial files
self.addEventListener("install", event => {
    console.log("[SW] Installing service worker…");

    event.waitUntil(
        Promise.all([
            cacheFiles(CORE_CACHE_NAME, CORE_FILES),
            cacheFiles(MEDIA_CACHE_NAME, MEDIA_FILES)
        ]).then(() => {
            console.log("[SW] All files cached successfully");
            return self.skipWaiting(); // Activate immediately
        })
    );
});

// Activation event — clean up old caches and check for updates
self.addEventListener("activate", event => {
    console.log("[SW] Activating service worker…");

    event.waitUntil(
        cleanupOldCaches().then(() => {
            console.log("[SW] Service worker activated");
            return self.clients.claim(); // Take control of all pages
        })
    );
});

// Fetch event — serve from cache or network
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Serve from cache
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(event.request)
          .then(response => {
            // Don’t cache non-successful responses
            if (!response || response.status !== 200 || response.type !== "basic") {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Determine which cache to use based on the request URL
            const url = event.request.url;
            let cacheName;

            if (MEDIA_FILES.some(file => url.includes(file))) {
              cacheName = MEDIA_CACHE_NAME;
            } else if (CORE_FILES.some(file => url.includes(file) || url.endsWith("/"))) {
              cacheName = CORE_CACHE_NAME;
            }

            // Cache the response if it belongs to our files
            if (cacheName) {
              caches.open(cacheName)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          });
      })
      .catch(() => {
        // Network failed, try to serve offline page for HTML requests
        if (event.request.headers.get("accept").includes("text/html")) {
          return caches.match("/chess-web/index.html");
        }
      })
  );
});

// Message event — handle version checks and updates
self.addEventListener("message", event => {
    if (event.data && event.data.type === "CHECK_UPDATES") {
        checkForUpdates().then(hasUpdates => {
            event.ports[0].postMessage({ hasUpdates });
        });
    }

    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});

// Helper function to cache files
async function cacheFiles(cacheName, files) {
    try {
        const cache = await caches.open(cacheName);
        console.log(`[SW] Caching ${files.length} files in ${cacheName}`);
        await cache.addAll(files);
    } catch (error) {
        console.error(`[SW] Failed to cache files in ${cacheName}:`, error);
    }
}

// Helper function to clean up old caches
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const validCaches = [CORE_CACHE_NAME, MEDIA_CACHE_NAME];

  const deletePromises = cacheNames
    .filter(cacheName => !validCaches.includes(cacheName))
    .map(cacheName => {
      console.log(`[SW] Deleting old cache: ${cacheName}`);
      return caches.delete(cacheName);
    });

  return Promise.all(deletePromises);
}

// Helper function to check for updates
async function checkForUpdates() {
  try {
    // Fetch the service worker file to check for version changes
    const response = await fetch("/chess-web/sw.js", { cache: "no-cache" });
    const swContent = await response.text();

    // Extract versions from the fetched service worker
    const coreVersionMatch = swContent.match(/CORE_VERSION = "([^"]+)"/);
    const mediaVersionMatch = swContent.match(/MEDIA_VERSION = "([^"]+)"/);

    if (!coreVersionMatch || !mediaVersionMatch) {
      console.log("[SW] Could not extract versions from service worker");
      return false;
    }

    const remoteCoreVersion = coreVersionMatch[1];
    const remoteMediaVersion = mediaVersionMatch[1];

    console.log(`[SW] Current versions - Core: ${CORE_VERSION}, Media: ${MEDIA_VERSION}`);
    console.log(`[SW] Remote versions - Core: ${remoteCoreVersion}, Media: ${remoteMediaVersion}`);

    const coreNeedsUpdate = CORE_VERSION !== remoteCoreVersion;
    const mediaNeedsUpdate = MEDIA_VERSION !== remoteMediaVersion;

    if (coreNeedsUpdate || mediaNeedsUpdate) {
      console.log("[SW] Updates available");

      // Pre-cache updated files in the background
      if (coreNeedsUpdate) {
        await precacheUpdatedFiles(CORE_FILES, `chess-core-v${remoteCoreVersion}`);
      }

      if (mediaNeedsUpdate) {
        await precacheUpdatedFiles(MEDIA_FILES, `chess-media-v${remoteMediaVersion}`);
      }

      return true;
    }

    console.log("[SW] No updates available");
    return false;

  } catch (error) {
    console.error("[SW] Error checking for updates:", error);
    return false;
  }
}

// Helper function to precache updated files
async function precacheUpdatedFiles(files, newCacheName) {
  try {
    console.log(`[SW] Pre-caching updated files in ${newCacheName}`);
    const cache = await caches.open(newCacheName);

    // Fetch each file with cache-busting
    const cachePromises = files.map(async (file) => {
      try {
        const url = `${file}?v=${Date.now()}`;
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(file, response);
        }
      } catch (error) {
        console.warn(`[SW] Failed to cache ${file}:`, error);
      }
    });

    await Promise.all(cachePromises);
    console.log(`[SW] Pre-caching completed for ${newCacheName}`);

  } catch (error) {
    console.error(`[SW] Error pre-caching files for ${newCacheName}:`, error);
  }
}

// Notify clients about available updates
function notifyClientsOfUpdate() {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: "UPDATE_AVAILABLE",
        coreVersion: CORE_VERSION,
        mediaVersion: MEDIA_VERSION
      });
    });
  });
}

// Periodic update check (every 30 minutes when service worker is active)
setInterval(() => {
    checkForUpdates().then(hasUpdates => {
        if (hasUpdates) {
            notifyClientsOfUpdate();
        }
    });
}, 30 * 60 * 1000);

console.log("[SW] Service worker script loaded");
