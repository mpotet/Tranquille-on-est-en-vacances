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
 * - Mutations (POST/PUT/DELETE) et tout /admin/* : toujours réseau, jamais de cache.
 * - Retour de connexion : aucune action utilisateur requise, la prochaine requête
 *   revalide silencieusement le cache.
 */

const VERSION = 'v9';
const PAGES_CACHE = `tranquille-pages-${VERSION}`;
const ASSETS_CACHE = `tranquille-assets-${VERSION}`;
const API_CACHE = `tranquille-api-${VERSION}`;
const CACHES = [PAGES_CACHE, ASSETS_CACHE, API_CACHE];

const PRECACHE_ASSETS = [
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

const PRECACHE_PAGES = [
  '/',
  '/voyages',
];

const PUBLIC_API_PREFIXES = [
  '/api/articles',
  '/api/folders',
  '/api/settings',
];

function isPublicApiGet(url) {
  return PUBLIC_API_PREFIXES.some(p => url.pathname.startsWith(p));
}

// ── Installation : pré-cache du shell et des pages clés ───────
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

      self.skipWaiting();
    })()
  );
});

// ── Activation : suppression des anciens caches ───────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => !CACHES.includes(k)).map(k => caches.delete(k)));
      await clients.claim();
    })()
  );
});

// ── Fetch ───────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (!req.url.startsWith('http')) return;

  const url = new URL(req.url);
  if (url.pathname.startsWith('/admin')) return;

  if (url.pathname.startsWith('/api/')) {
    // Admin views need fresh data (e.g. the folder tree right after creating a
    // folder). They send `cache: 'no-store'`, which surfaces here as a
    // no-cache request header — honour it by going straight to the network
    // instead of serving the stale-while-revalidate cached copy.
    const wantsFresh = (req.headers.get('cache-control') || '').includes('no-cache');
    if (isPublicApiGet(url) && !wantsFresh) {
      event.respondWith(staleWhileRevalidateJson(event, req, API_CACHE));
    }
    return;
  }

  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(staleWhileRevalidate(event, req, PAGES_CACHE));
  } else {
    event.respondWith(cacheFirst(req, ASSETS_CACHE));
  }
});

// Réponse immédiate depuis le cache si dispo, revalidation réseau en tâche de fond.
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
    <h1>Page non disponible hors connexion</h1>
    <p>Cette page n'a pas encore été consultée avec une connexion active.<br>Elle sera disponible hors connexion après une première visite.</p>
    <button onclick="location.reload()">Réessayer</button>
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
