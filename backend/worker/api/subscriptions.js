/**
 * worker/api/subscriptions.js - Push & email subscription endpoints
 *
 * Routes (all public except GET /api/push/subscribers which is admin-only):
 *   GET    /api/push/config          → VAPID public key for browser
 *   POST   /api/push/subscribe       → register push subscription
 *   POST   /api/push/unsubscribe     → remove push subscription
 *   POST   /api/email/subscribe      → add email subscriber
 *   GET    /unsubscribe?token=xxx    → remove email subscriber (renders HTML page)
 */

import { json, badRequest, notFound, html } from '../utils.js';
import { isEmailConfigured } from '../admin-email.js';

// ── Push: VAPID public key ────────────────────────────────────────────────────

export function getPushConfig(env) {
  return json({ vapidPublicKey: env.VAPID_PUBLIC_KEY || null });
}

// ── Push: subscribe ───────────────────────────────────────────────────────────

export async function pushSubscribe(request, env) {
  const body = await request.json().catch(() => null);
  if (!body || !body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return badRequest('endpoint, keys.p256dh and keys.auth are required');
  }

  await env.DB
    .prepare('INSERT OR REPLACE INTO push_subscriptions (endpoint, p256dh, auth) VALUES (?, ?, ?)')
    .bind(body.endpoint, body.keys.p256dh, body.keys.auth)
    .run();

  return json({ ok: true });
}

// ── Push: unsubscribe ─────────────────────────────────────────────────────────

export async function pushUnsubscribe(request, env) {
  const body = await request.json().catch(() => null);
  if (!body?.endpoint) return badRequest('endpoint required');

  await env.DB
    .prepare('DELETE FROM push_subscriptions WHERE endpoint=?')
    .bind(body.endpoint)
    .run();

  return json({ ok: true });
}

// ── Email: subscribe ──────────────────────────────────────────────────────────

export async function emailSubscribe(request, env) {
  // Without a configured email provider, notifications can never actually be
  // sent - accepting the subscription anyway would silently give visitors a
  // false sense that they'll be notified.
  if (!(await isEmailConfigured(env))) {
    return badRequest("Les notifications par email ne sont pas disponibles pour le moment.");
  }

  const body  = await request.json().catch(() => null);
  const email = (body?.email || '').trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return badRequest('Adresse email invalide');
  }

  // Generate a random 32-char unsubscribe token
  const tokenBytes = crypto.getRandomValues(new Uint8Array(24));
  const token = btoa(String.fromCharCode(...tokenBytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  await env.DB
    .prepare(`
      INSERT INTO email_subscriptions (email, token, active)
      VALUES (?, ?, 1)
      ON CONFLICT(email) DO UPDATE SET active = 1
    `)
    .bind(email, token)
    .run();

  return json({ ok: true });
}

// ── Email: unsubscribe (public GET, returns HTML) ─────────────────────────────

export async function emailUnsubscribe(request, env) {
  const url   = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) return badRequest('token manquant');

  const sub = await env.DB
    .prepare('SELECT id, email FROM email_subscriptions WHERE token = ?')
    .bind(token)
    .first();

  if (!sub) return notFound('Abonnement introuvable ou déjà supprimé');

  await env.DB
    .prepare('UPDATE email_subscriptions SET active = 0 WHERE token = ?')
    .bind(token)
    .run();

  return html(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Désabonnement - Tranquille, on est en vacances</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:ui-sans-serif,system-ui,sans-serif;background:#FFFDF9;color:#1A2B3C;
         min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem}
    .box{max-width:440px;width:100%;text-align:center}
    .emoji{font-size:3.5rem;display:block;margin-bottom:1.25rem}
    h1{font-family:Georgia,serif;font-size:1.8rem;font-weight:700;color:#0057B8;margin-bottom:.75rem}
    p{font-size:1rem;color:#5A6A7A;line-height:1.75;margin-bottom:.5rem}
    .btn{display:inline-block;margin-top:1.5rem;background:#0057B8;color:#fff;text-decoration:none;
         padding:.75rem 1.75rem;border-radius:999px;font-weight:700;font-size:.9rem}
  </style>
</head>
<body>
  <div class="box">
    <span class="emoji">👋</span>
    <h1>Vous êtes désabonné(e)</h1>
    <p>Votre adresse a bien été retirée de la liste de diffusion.</p>
    <p>Vous ne recevrez plus les notifications email du blog.</p>
    <a href="/" class="btn">< Retour au blog</a>
  </div>
</body>
</html>`);
}
