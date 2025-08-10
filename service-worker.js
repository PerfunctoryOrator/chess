// service-worker.js
// Edit these names before each deploy when you want the background update flow.
// Example: bump CORE_CACHE to 'chess-core-v2' on the next release.
const CORE_CACHE = 'chess-core-v2';
const ASSETS_CACHE = 'chess-assets-v1';

const CORE_FILES = [
  '/', '/index.html',
  '/board-manager.js',
  '/board-pieces.css',
  '/board-styles.css',
  '/document-set-up.js',
  '/error-styles.css',
  '/general-styles.css',
  '/settings-manager.js',
  '/square-positions.css'
];

const STATIC_ASSETS = [
  '/media-support/apple-touch-icon.png',
  '/media-support/apple-touch-icon-dark.png',
  '/media-support/apple-touch-icon-tint.png',
  '/media-support/favicon.ico',
  '/media-support/favicon-dark.ico',
  '/media-support/favicon-tint.ico',
  '/media-support/white-pawn.png',
  '/media-support/fonts/noto-sans/noto-sans.ttf',
  '/media-support/fonts/noto-sans/noto-sans-italic.ttf',
  '/media-support/fonts/noto-serif/noto-serif.ttf',
  '/media-support/fonts/noto-serif/noto-serif-italic.ttf'
];

// Internal guards
let backgroundPopulating = false;

// Utility: find existing cache keys for this app
async function existingAppCaches() {
  const keys = await caches.keys();
  return keys.filter(k => k.startsWith('chess-core-') || k.startsWith('chess-assets-'));
}

// Install: if this is the first-ever install (no old caches) pre-cache
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const existing = await existingAppCaches();
    if (existing.length === 0) {
      // first install: pre-cache both sets so user gets an offline-ready shell
      const c1 = await caches.open(CORE_CACHE);
      await c1.addAll(CORE_FILES).catch(() => { /* ignore individual failures */ });
      const c2 = await caches.open(ASSETS_CACHE);
      await c2.addAll(STATIC_ASSETS).catch(() => { /* ignore individual failures */ });
    }
    // if not first install, we do NOT prefetch new caches here — we'll do background fetch on activate
    self.skipWaiting();
  })());
});

// Activate: don't delete older caches yet. If the current cache names are missing,
// start a background population. Notify clients only if we detected a previous version.
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Claim clients ASAP so fetches are routed to this worker
    await self.clients.claim();

    const keys = await caches.keys();
    const coreExists = keys.includes(CORE_CACHE);
    const assetsExists = keys.includes(ASSETS_CACHE);

    // Did we have a previous release (some cache with our app prefix)?
    const hadPrevious = keys.some(k => (k.startsWith('chess-core-') || k.startsWith('chess-assets-'))
                                       && (k !== CORE_CACHE && k !== ASSETS_CACHE));

    // If either cache is missing, start background population.
    // Do not block activation on this — populate in background so users keep using old cache until ready.
    if ((!coreExists || !assetsExists) && !backgroundPopulating) {
      backgroundPopulating = true;
      // run but don't await here (background)
      populateMissingCaches(coreExists, assetsExists, hadPrevious).catch(() => {
        // ignore; we don't want activation to fail if background populate failed
      });
    }
  })());
});

// Background fetch + populate the missing cache(s).
// If hadPrevious === true, notify clients when new caches are fully ready.
async function populateMissingCaches(coreExists, assetsExists, hadPrevious) {
  try {
    if (!coreExists) {
      const cache = await caches.open(CORE_CACHE);
      // fetch each file fresh
      await Promise.all(CORE_FILES.map(async path => {
        try {
          const res = await fetch(path, { cache: 'no-store' });
          if (res && res.ok) await cache.put(path, res.clone());
        } catch (e) { /* ignore per-file errors */ }
      }));
    }

    if (!assetsExists) {
      const cache = await caches.open(ASSETS_CACHE);
      await Promise.all(STATIC_ASSETS.map(async path => {
        try {
          const res = await fetch(path, { cache: 'no-store' });
          if (res && res.ok) await cache.put(path, res.clone());
        } catch (e) { /* ignore per-file errors */ }
      }));
    }

    // Only notify if there was an earlier installation (i.e., this is an update)
    if (hadPrevious) {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clients.forEach(c => c.postMessage({
        type: 'UPDATE_READY',
        coreCached: !coreExists,
        assetsCached: !assetsExists
      }));
    }
  } finally {
    backgroundPopulating = false;
  }
}

// Message handler: client can ask us to apply the update (delete old caches)
self.addEventListener('message', event => {
  const msg = event.data || {};
  if (msg && msg.type === 'APPLY_UPDATE') {
    // delete any old caches that match our prefixes but are not current
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => {
        if ((k.startsWith('chess-core-') && k !== CORE_CACHE) ||
            (k.startsWith('chess-assets-') && k !== ASSETS_CACHE)) {
          return caches.delete(k);
        }
        return Promise.resolve();
      }));
      // tell the client we applied the update
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clients.forEach(c => c.postMessage({ type: 'UPDATE_APPLIED' }));
    })();
  }
});

// Fetch: prefer cache (any cache), fallback to network. For cacheable lists, we
// try to serve cached copy immediately. If there is no cache at all we fall back to network and cache it.
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  const path = url.pathname;

  // Serve core files (prefer cache)
  if (CORE_FILES.includes(path)) {
    event.respondWith((async () => {
      // caches.match checks across all caches; returns the first matching response
      const cached = await caches.match(req);
      if (cached) return cached;
      // No cached copy at all => fetch + cache into current core cache
      try {
        const netResp = await fetch(req);
        if (netResp && netResp.ok) {
          const cache = await caches.open(CORE_CACHE);
          await cache.put(req, netResp.clone());
        }
        return netResp;
      } catch (e) {
        return new Response('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });
      }
    })());
    return;
  }

  // Static assets: prefer cache, otherwise fetch and cache in assets cache
  if (STATIC_ASSETS.includes(path)) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const netResp = await fetch(req);
        if (netResp && netResp.ok) {
          const cache = await caches.open(ASSETS_CACHE);
          await cache.put(req, netResp.clone());
        }
        return netResp;
      } catch (e) {
        return new Response(null, { status: 404 });
      }
    })());
    return;
  }

  // Default: try cache first, else network
  event.respondWith(caches.match(req).then(r => r || fetch(req)));
});
