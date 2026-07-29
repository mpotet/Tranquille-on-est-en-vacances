/**
 * public/sw.js - Service Worker : PWA offline-first + notifications push
 *
 * Stratégie :
 * - Pages HTML (navigations) : stale-while-revalidate → réponse immédiate depuis
 *   le cache si dispo, mise à jour silencieuse en arrière-plan. Ne bascule sur
 *   la page "hors connexion" que si la page n'a VRAIMENT jamais été visitée.
 * - Assets statiques (icônes, manifest, polices, JS/CSS, images R2) : cache-first.
 * - API publique en lecture (GET /api/articles, /api/folders, /api/settings) :
 *   stale-while-revalidate, pour que le contenu déjà consulté reste lisible hors ligne
 *   (les pages voyage/:slug chargent leur contenu via ces endpoints en client-side).
 * - Admin (dashboard, éditeur) : mêmes pages HTML mises en cache que le public,
 *   pour rester utilisable hors connexion (créer/modifier un article). Seules
 *   les routes d'auth (/admin/login, /admin/logout) et l'API admin JSON
 *   (/api/admin/*) forcent toujours le réseau.
 * - Mutations (POST/PUT/DELETE) : jamais mises en cache (comportement natif du SW,
 *   qui n'intercepte que les GET) - mais un article sauvegardé hors ligne est mis
 *   en file d'attente (IndexedDB) et rejoué automatiquement via Background Sync
 *   dès que le réseau revient, même si l'app/l'onglet a été fermé entre-temps.
 * - Retour de connexion : aucune action utilisateur requise, la prochaine requête
 *   revalide silencieusement le cache.
 */

const VERSION = 'v29';
const PAGES_CACHE = `tranquille-pages-${VERSION}`;
const ASSETS_CACHE = `tranquille-assets-${VERSION}`;
const API_CACHE = `tranquille-api-${VERSION}`;
const CACHES = [PAGES_CACHE, ASSETS_CACHE, API_CACHE];

const PRECACHE_ASSETS = [
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/tailwind.css',
];

// Always precached, regardless of article list (the app shell + entry points).
const PRECACHE_PAGES = [
  '/',
  '/voyages',
  '/creer-mon-carnet',
];

const PUBLIC_API_PREFIXES = [
  '/api/articles',
  '/api/folders',
  '/api/settings',
];

function isPublicApiGet(url) {
  return PUBLIC_API_PREFIXES.some(p => url.pathname.startsWith(p));
}

// Fetch every published article's slug and precache its full page, so a trip
// nobody has opened yet on this device is still readable offline - critical
// for someone travelling with no signal who never manually visited every
// article beforehand. Each fetch is independent and failures are swallowed:
// one broken article must never abort caching the rest.
async function precacheAllArticlePages(pagesCache) {
  try {
    const res = await fetch('/api/articles?status=published&limit=100');
    if (!res.ok) return;
    const data = await res.json();
    const slugs = (data.articles || []).map(a => a.slug).filter(Boolean);
    await Promise.all(slugs.map(slug =>
      fetch('/voyage/' + slug).then(r => { if (r.ok) return pagesCache.put('/voyage/' + slug, r); }).catch(() => {})
    ));
  } catch { /* offline at install time, or API unreachable - precache what we can elsewhere */ }
}

// ── Installation : pré-cache du shell, des pages clés et de tous les récits ──
self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const assetsCache = await caches.open(ASSETS_CACHE);
      await assetsCache.addAll(PRECACHE_ASSETS);

      const pagesCache = await caches.open(PAGES_CACHE);
      await Promise.all(
        PRECACHE_PAGES.map(url =>
          fetch(url).then(r => { if (r.ok) return pagesCache.put(url, r); }).catch(() => {})
        )
      );
      await precacheAllArticlePages(pagesCache);

      self.skipWaiting();
    })()
  );
});

// ── Activation : suppression des anciens caches + re-précache en tâche de fond ──
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => !CACHES.includes(k)).map(k => caches.delete(k)));
      await clients.claim();
      // Refresh the article precache on every activation (new deploy, or
      // browser waking the SW back up) - keeps offline coverage current as
      // new trips get published, without waiting for the user to visit them.
      const pagesCache = await caches.open(PAGES_CACHE);
      precacheAllArticlePages(pagesCache);
    })()
  );
});

// Some browsers hibernate/kill the SW between app launches on mobile without
// ever firing activate again for a long time. A periodic background sync (if
// supported) or this manual "keep it fresh" ping on each fetch event is the
// closest thing to a heartbeat - cheap, and only actually re-fetches if the
// cache is stale (browser HTTP cache still applies).
let _lastRefresh = 0;
function maybeRefreshPrecache() {
  const now = Date.now();
  if (now - _lastRefresh < 6 * 60 * 60 * 1000) return; // at most every 6h
  _lastRefresh = now;
  caches.open(PAGES_CACHE).then(precacheAllArticlePages);
}

// ── Fetch ───────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (!req.url.startsWith('http')) return;

  const url = new URL(req.url);

  // Auth actions (login, password reset/setup, email confirmation) must always
  // hit the network - never cached, never served stale. Each of these embeds
  // a one-time token or reflects the current session state in the page itself
  // (e.g. an already-consumed reset link, or a stale "email confirmed" state);
  // serving a cached copy could show a since-invalidated form as if it still
  // worked, or mask a session that has since expired server-side.
  const ADMIN_AUTH_PATHS = new Set([
    '/admin', '/admin/', '/admin/login', '/admin/logout',
    '/admin/setup', '/admin/reset', '/admin/forgot-password',
    '/admin/set-password', '/admin/confirm-email',
  ]);
  if (ADMIN_AUTH_PATHS.has(url.pathname)) return;

  // Same reasoning for the public unsubscribe link: it's a one-time token
  // action, not a page that should ever be replayed from cache.
  if (url.pathname === '/unsubscribe') return;

  // Admin JSON API: always fresh, same reasoning as the public API's
  // cache-control no-cache override above, but unconditional here - admin
  // screens must never silently show stale data as if it were current.
  if (url.pathname.startsWith('/api/admin/')) return;

  // Admin HTML pages (dashboard, editor) are GET navigations behind a login
  // cookie: cache them the same way as public pages so the whole admin stays
  // usable offline (create/edit articles while offline, synced later via
  // publish_when_online + background sync). The server sends Cache-Control:
  // no-store on these to stop the browser's own HTTP cache from serving a
  // stale authenticated page across different users/devices - that doesn't
  // apply to this app-controlled cache on a single person's own device, so we
  // intentionally do not honour it here.
  if (url.pathname.startsWith('/admin/')) {
    event.respondWith(staleWhileRevalidate(event, req, PAGES_CACHE));
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    // Admin views need fresh data (e.g. the folder tree right after creating a
    // folder). They send `cache: 'no-store'`, which surfaces here as a
    // no-cache request header - honour it by going straight to the network
    // instead of serving the stale-while-revalidate cached copy.
    const wantsFresh = (req.headers.get('cache-control') || '').includes('no-cache');
    if (isPublicApiGet(url) && !wantsFresh) {
      event.respondWith(staleWhileRevalidateJson(event, req, API_CACHE));
    }
    return;
  }

  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    maybeRefreshPrecache();
    event.respondWith(staleWhileRevalidate(event, req, PAGES_CACHE));
  } else {
    event.respondWith(cacheFirst(req, ASSETS_CACHE));
  }
});

// Réponse immédiate depuis le cache si dispo, revalidation réseau en tâche de fond.
// Never surface a blank/error screen for a navigation: if the exact page was
// never cached (e.g. a brand-new article published after the last precache
// run, or a cache entry evicted by the OS), fall back to the app shell ('/')
// rather than an offline error - the person can still reach every other page
// from there instead of hitting a dead end mid-trip with no signal.
async function staleWhileRevalidate(event, req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);

  const revalidate = fetch(req).then(resp => {
    if (resp && resp.ok) cache.put(req, resp.clone());
    return resp;
  }).catch(() => null);

  if (cached) {
    event.waitUntil(revalidate);
    return cached;
  }

  const fresh = await revalidate;
  if (fresh) return fresh;

  const shell = await cache.match('/');
  if (shell) return shell;

  return new Response(offlineFallbackHtml(), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// Comme staleWhileRevalidate, mais renvoie un corps JSON en cas d'échec total
// (ces endpoints sont toujours consommés via response.json() côté client).
async function staleWhileRevalidateJson(event, req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);

  const revalidate = fetch(req).then(resp => {
    if (resp && resp.ok) cache.put(req, resp.clone());
    return resp;
  }).catch(() => null);

  if (cached) {
    event.waitUntil(revalidate);
    return cached;
  }

  const fresh = await revalidate;
  if (fresh) return fresh;

  return new Response('{"error":"offline"}', {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Assets statiques : servir depuis le cache s'il existe, sinon aller au réseau et cacher.
async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;

  try {
    const resp = await fetch(req);
    if (resp && resp.ok) cache.put(req, resp.clone());
    return resp;
  } catch (_) {
    return new Response('', { status: 503 });
  }
}

function offlineFallbackHtml() {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Hors connexion - Tranquille</title>
  <style>
    body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;
         min-height:100svh;margin:0;background:#FFFDF9;color:#1A2B3C;padding:1rem}
    .card{text-align:center;max-width:340px}
    .ico{font-size:4rem;margin-bottom:1rem}
    h1{font-size:1.4rem;font-weight:700;margin:0 0 .5rem}
    p{color:#5A6A7A;font-size:.9rem;margin:0 0 1.5rem;line-height:1.6}
    button{background:#0057B8;color:#fff;border:none;padding:.75rem 2rem;
           border-radius:999px;font-size:1rem;font-weight:700;cursor:pointer}
  </style>
</head>
<body>
  <div class="card">
    <div class="ico">📡</div>
    <h1>Connexion introuvable</h1>
    <p>Cette page précise n'est pas encore en mémoire sur cet appareil.<br>Reconnectez-vous une fois pour la mettre en cache, ou réessayez.</p>
    <button onclick="location.reload()">Réessayer</button>
    <button onclick="location.href='/'" style="background:transparent;color:#0057B8;box-shadow:none;margin-top:.5rem">Retour à l'accueil</button>
  </div>
</body>
</html>`;
}

// ── Push notifications ────────────────────────────────────────
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {}

  const options = {
    body:     data.body    || 'Un nouveau récit de voyage vient d\'être publié !',
    icon:     data.icon    || '/icon-192.png',
    badge:    data.badge   || '/icon-192.png',
    tag:      data.tag     || 'tranquille-notif',
    renotify: true,
    data:     { url: data.url || '/' },
    actions:  [{ action: 'read', title: 'Lire le récit →' }],
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Tranquille, on est en vacances',
      options
    )
  );
});

// ── Clic sur notification ─────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        for (const c of list) {
          if (c.url === url && 'focus' in c) return c.focus();
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});

// ── Background sync : articles sauvegardés hors ligne ─────────────────────
// The editor page (admin.js) writes queued saves to IndexedDB (see
// queueOfflineArticleSave() there) instead of just localStorage, specifically
// so the Service Worker - which has no access to localStorage - can read and
// replay them here, independently of whether the tab/app is even open.
const SYNC_TAG = 'tranquille-sync-articles';
const DB_NAME = 'tranquille-offline';
const STORE = 'pending-articles';
// v2 adds 'pending-photos' - same DB the admin editor writes to (see
// _openOfflineDB() in admin.js), opened with matching version/upgrade logic
// here since the two DB handles are independent even though they share a
// name. onupgradeneeded fires for a brand-new DB and for an existing v1 one
// alike, so the 'if not exists' guards make both paths safe.
const PHOTO_STORE = 'pending-photos';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: 'localId' });
      }
      if (!req.result.objectStoreNames.contains(PHOTO_STORE)) {
        req.result.createObjectStore(PHOTO_STORE, { keyPath: 'localId' });
      }
    };
    req.onblocked = () => reject(new Error('IndexedDB upgrade blocked'));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAllPending() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function deletePending(localId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(localId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function notifyClients(message) {
  const list = await clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const c of list) c.postMessage(message);
}

// Replays every queued article save in order. Each entry is either a POST
// (new article, no id yet) or a PUT (editing an existing one). Successes are
// removed from the queue and the open app (if any) is told to refresh; a
// failure that isn't a plain network error (e.g. the server rejected the
// payload) also removes it - retrying a request the server has already
// explicitly refused forever would just loop silently.
async function syncPendingArticles() {
  let pending;
  try { pending = await getAllPending(); } catch { return; }
  for (const item of pending) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      });
      if (res.status === 401) {
        // Session cookie expired/invalid while offline. Deleting the item here
        // would silently lose the article - leave it queued and tell every open
        // tab to prompt a re-login instead; the next successful sync (after the
        // admin logs back in) will replay it normally.
        await notifyClients({ type: 'auth-expired', kind: 'article', localId: item.localId });
        continue;
      }
      if (res.ok || res.status < 500) {
        // 2xx = saved; other 4xx = server permanently rejected it (bad payload,
        // deleted article, etc.) - either way, stop retrying it.
        await deletePending(item.localId);
        const data = await res.json().catch(() => null);
        await notifyClients({ type: 'article-synced', ok: res.ok, localId: item.localId, data });
      }
      // 5xx / thrown network error: leave it queued, will retry on next sync.
    } catch {
      // Still offline or request failed - keep it queued for the next sync event.
    }
  }
}

// ── Background sync : photos mises en attente (upload échoué / hors ligne) ──
// Same DB, second object store (see openDB() above). Unlike articles (small
// JSON payloads), photos are stored as the actual compressed File/Blob -
// IndexedDB handles binary values natively, so no base64 round-trip is needed.
const PHOTO_SYNC_TAG = 'tranquille-sync-photos';

async function getAllPendingPhotos() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readonly');
    const req = tx.objectStore(PHOTO_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function deletePendingPhoto(localId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    tx.objectStore(PHOTO_STORE).delete(localId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Replays every queued photo in order. A cover upload goes to a different
// endpoint (and expects a 'cover' field, not 'photo') than a gallery photo -
// same success/failure handling as syncPendingArticles: 5xx/network error
// keeps it queued, anything else (2xx success or a permanent 4xx rejection)
// removes it so a photo the server has already refused doesn't retry forever.
async function syncPendingPhotos() {
  let pending;
  try { pending = await getAllPendingPhotos(); } catch { return; }
  for (const item of pending) {
    try {
      const fd = new FormData();
      fd.append(item.isCover ? 'cover' : 'photo', item.file, item.fileName);
      const url = item.isCover
        ? '/api/articles/' + item.articleId + '/cover'
        : '/api/articles/' + item.articleId + '/photos';
      const res = await fetch(url, { method: 'POST', body: fd });
      if (res.status === 401) {
        // Same reasoning as syncPendingArticles: an expired session must not
        // silently delete a queued photo - keep it and ask for a re-login.
        await notifyClients({ type: 'auth-expired', kind: 'photo', localId: item.localId });
        continue;
      }
      if (res.ok || res.status < 500) {
        await deletePendingPhoto(item.localId);
        const data = await res.json().catch(() => null);
        // Gallery uploads return {uploaded:[...]}; take the first (each
        // queued item is a single file, uploaded one at a time here so a
        // failure never silently loses the rest of the batch).
        const single = item.isCover ? data : (data && data.uploaded && data.uploaded[0]) || null;
        await notifyClients({ type: 'photo-synced', ok: res.ok && !!single, articleId: item.articleId, isCover: item.isCover, data: single });
      }
      // 5xx / thrown network error: leave it queued, retry on next sync.
    } catch {
      // Still offline or request failed - keep it queued for the next sync event.
    }
  }
}

self.addEventListener('sync', event => {
  if (event.tag === SYNC_TAG) event.waitUntil(syncPendingArticles());
  if (event.tag === PHOTO_SYNC_TAG) event.waitUntil(syncPendingPhotos());
});

// Background Sync isn't available at all on iOS Safari / WebKit, and even
// where supported the browser decides when to actually fire it. As a
// fallback that works everywhere, also retry whenever the SW itself observes
// the network coming back (covers the case where the app gets reopened).
self.addEventListener('online', () => { syncPendingArticles(); syncPendingPhotos(); });
// Let an open page ask the SW to try immediately (e.g. right after the admin
// UI detects `navigator.onLine` flip back to true).
self.addEventListener('message', event => {
  if (event.data === 'sync-now') { event.waitUntil(syncPendingArticles()); event.waitUntil(syncPendingPhotos()); }
});
