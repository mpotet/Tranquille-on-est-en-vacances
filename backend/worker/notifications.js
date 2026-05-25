/**
 * worker/notifications.js — Dispatch push + email notifications when an article
 * is published or updated.
 *
 * Required env bindings / secrets:
 *   DB                — Cloudflare D1
 *   VAPID_PUBLIC_KEY  — base64url raw P-256 public key
 *   VAPID_PRIVATE_KEY — base64(JSON.stringify(jwk))
 *   VAPID_SUBJECT     — "mailto:..."
 *   RESEND_API_KEY    — Resend.com API key
 *   NOTIFY_FROM_EMAIL — e.g. "Blog Potet <noreply@yourdomain.com>"
 *   PUBLIC_URL        — public base URL e.g. "https://vacances.potet.fr"
 */

import { sendWebPush } from './vapid.js';

// ── Date helpers ──────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtDateRange(a) {
  const s = a.start_date || a.date;
  const e = a.end_date   || a.date;
  if (!s) return '';
  return s === e ? fmtDate(s) : `${fmtDate(s)} → ${fmtDate(e)}`;
}

// ── Email HTML template ───────────────────────────────────────────────────────

function buildEmailHtml(article, articleUrl, unsubUrl) {
  const dates = fmtDateRange(article);
  const dest  = article.destination ? ` · 📍 ${article.destination}` : '';
  const desc  = article.short_description || 'Un nouveau récit de voyage vient d\'être publié sur le blog !';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${article.title}</title>
</head>
<body style="margin:0;padding:0;background:#FFFDF9;font-family:ui-sans-serif,system-ui,sans-serif;color:#1A2B3C">
<div style="max-width:600px;margin:0 auto;padding:28px 20px">

  <!-- Header -->
  <div style="text-align:center;padding:20px 0 24px">
    <div style="font-size:2.4rem;line-height:1">🌴</div>
    <div style="font-size:17px;font-weight:700;color:#0057B8;margin-top:8px;letter-spacing:-.02em">Tranquille, on est en vacances</div>
    <div style="font-size:11px;color:#8A9BAC;margin-top:3px;text-transform:uppercase;letter-spacing:.18em">Carnet de bord Potet</div>
  </div>

  <!-- Article card -->
  <div style="background:#ffffff;border-radius:20px;padding:28px 24px;border:1px solid rgba(26,43,60,.10);box-shadow:0 2px 12px rgba(26,43,60,.06)">
    <div style="font-size:11px;font-weight:700;color:#2E7D6B;text-transform:uppercase;letter-spacing:.15em;margin-bottom:12px">✦ Nouveau récit de voyage</div>
    <h1 style="font-size:23px;font-weight:700;color:#1A2B3C;margin:0 0 10px;line-height:1.25;font-family:Georgia,serif">${article.title}</h1>
    ${dates ? `<div style="font-size:13px;color:#8A9BAC;margin-bottom:14px">📅 ${dates}${dest}</div>` : ''}
    <p style="font-size:15px;color:#5A6A7A;line-height:1.72;margin:0 0 22px">${desc}</p>
    <a href="${articleUrl}"
       style="display:inline-block;background:#0057B8;color:#ffffff;text-decoration:none;padding:13px 30px;border-radius:999px;font-weight:700;font-size:14px;letter-spacing:.01em">
      Lire le récit →
    </a>
  </div>

  <!-- Footer -->
  <div style="text-align:center;margin-top:22px;font-size:12px;color:#8A9BAC;line-height:1.9">
    <p style="margin:0">Vous recevez cet email parce que vous êtes abonné(e) aux mises à jour du blog.</p>
    <p style="margin:4px 0 0"><a href="${unsubUrl}" style="color:#8A9BAC;text-decoration:underline">Se désabonner</a></p>
  </div>

</div>
</body>
</html>`;
}

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * Notify all subscribers (push + email) about a new/updated article.
 * Uses ctx.waitUntil so the calling route can return its response immediately.
 *
 * @param {object} env
 * @param {object} ctx   — Cloudflare Workers ExecutionContext
 * @param {object} article — normalised article object (slug, title, etc.)
 */
export function notifySubscribers(env, ctx, article) {
  ctx.waitUntil(_doNotify(env, article));
}

async function _doNotify(env, article) {
  const publicUrl = (env.PUBLIC_URL || '').replace(/\/$/, '');
  const articleUrl = `${publicUrl}/voyage/${article.slug}`;

  // ── Push notifications ────────────────────────────────────────────────────
  if (env.VAPID_PRIVATE_KEY && env.VAPID_PUBLIC_KEY) {
    try {
      const { results: pushSubs } = await env.DB
        .prepare('SELECT id, endpoint, p256dh, auth FROM push_subscriptions')
        .all();

      if (pushSubs && pushSubs.length > 0) {
        const payload = JSON.stringify({
          title: `✈️ ${article.title}`,
          body:  article.short_description || 'Un récit de voyage vient d\'être publié !',
          icon:  '/icon.svg',
          url:   `/voyage/${article.slug}`,
          tag:   `article-${article.id}`,
        });

        await Promise.allSettled(pushSubs.map(async sub => {
          try {
            const res = await sendWebPush(sub, payload, env);
            // 410 Gone / 404 = subscription expired → remove it
            if (res && (res.status === 410 || res.status === 404)) {
              await env.DB
                .prepare('DELETE FROM push_subscriptions WHERE id=?')
                .bind(sub.id).run();
            }
          } catch (err) {
            console.error('[Push] error for', sub.endpoint, err);
          }
        }));
      }
    } catch (err) {
      console.error('[Push] notifications failed:', err);
    }
  }

  // ── Email notifications ───────────────────────────────────────────────────
  if (env.RESEND_API_KEY) {
    try {
      const { results: emailSubs } = await env.DB
        .prepare('SELECT email, token FROM email_subscriptions WHERE active=1')
        .all();

      if (emailSubs && emailSubs.length > 0) {
        const fromEmail = env.NOTIFY_FROM_EMAIL || 'onboarding@resend.dev';

        await Promise.allSettled(emailSubs.map(async sub => {
          try {
            const unsubUrl = `${publicUrl}/unsubscribe?token=${sub.token}`;
            await fetch('https://api.resend.com/emails', {
              method:  'POST',
              headers: {
                Authorization:  `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from:    fromEmail,
                to:      [sub.email],
                subject: `✈️ Nouveau voyage : ${article.title}`,
                html:    buildEmailHtml(article, articleUrl, unsubUrl),
              }),
            });
          } catch (err) {
            console.error('[Email] error for', sub.email, err);
          }
        }));
      }
    } catch (err) {
      console.error('[Email] notifications failed:', err);
    }
  }
}
