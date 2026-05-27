/**
 * public/sw.js — Service Worker : cache offline + notifications push
 * Stratégie : network-first avec fallback cache pour toutes les requêtes GET.
 * Les assets statiques sont pré-cachés à l'installation.
 */

const CACHE = 'tranquille-v5';

const PRECACHE = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// ── Installation : pré-cache des assets statiques ─────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(async c => {
        await c.addAll(PRECACHE);
        // Tente de pré-cacher l'éditeur si l'utilisateur est déjà authentifié
        await fetch('/admin/editor', { credentials: 'include' })
          .then(r => { if (r.ok && !r.redirected) return c.put('/admin/editor', r); })
          .catch(() => {});
        self.skipWaiting();
      })
  );
});

// ── Activation : suppression des anciens caches ───────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => clients.claim())
  );
});

// ── Fetch : network-first, fallback cache ─────────────────────
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (!req.url.startsWith('http')) return;
  event.respondWith(networkFirstCache(req));
});

async function networkFirstCache(req) {
  const cache = await caches.open(CACHE);
  try {
    const resp = await fetch(req);
    if (resp && resp.status < 400) {
      // Don't cache responses that explicitly opt out (e.g. API JSON responses)
      const cc = resp.headers.get('cache-control') || '';
      if (!cc.includes('no-store')) {
        cache.put(req, resp.clone()); // mise en cache async
      }
    }
    return resp;
  } catch (_) {
    const cached = await cache.match(req);
    if (cached) return cached;
    // For admin HTML navigations, try falling back to the editor shell
    if (req.headers.get('accept')?.includes('text/html')) {
      const url = new URL(req.url);
      if (url.pathname.startsWith('/admin')) {
        const editorShell = await cache.match('/admin/editor');
        if (editorShell) return editorShell;
      }
      return new Response(offlineFallbackHtml(), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
    return new Response('', { status: 503 });
  }
}

function offlineFallbackHtml() {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Hors connexion — Tranquille</title>
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
    <h1>Hors connexion</h1>
    <p>Cette page n'a pas encore été mise en cache.<br>Reconnectez-vous pour continuer.</p>
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
