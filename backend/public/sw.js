/**
 * public/sw.js — Service Worker pour les notifications push PWA
 */

const CACHE_NAME = 'tranquille-v1';

// Installation : mise en cache des ressources statiques essentielles
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

// Réception d'une notification push
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {}

  const options = {
    body:    data.body    || 'Un nouveau récit de voyage vient d\'être publié !',
    icon:    data.icon    || '/icon.svg',
    badge:   '/icon.svg',
    tag:     data.tag     || 'tranquille-notif',
    renotify: true,
    data:    { url: data.url || '/' },
    actions: [
      { action: 'read', title: 'Lire le récit →' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Tranquille, on est en vacances',
      options
    )
  );
});

// Clic sur la notification
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});
