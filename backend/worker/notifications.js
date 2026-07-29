/**
 * worker/notifications.js - Dispatch push + email notifications when an article
 * is published or updated.
 *
 * Required env bindings / secrets:
 *   DB                - Cloudflare D1
 *   VAPID_PUBLIC_KEY  - base64url raw P-256 public key
 *   VAPID_PRIVATE_KEY - base64(JSON.stringify(jwk))
 *   VAPID_SUBJECT     - "mailto:..."
 *   PUBLIC_URL        - public base URL e.g. "https://vacances.potet.fr"
 *
 * Email sending uses Mailjet (same provider + config as worker/admin-email.js:
 * site_settings.mailjet_api_key / mailjet_api_secret / email_from_address /
 * email_from_name) rather than Resend - this used to be the one place still
 * on Resend after the rest of the app migrated, which meant subscriber
 * notifications would silently fail (only a console.error, invisible in the
 * editor UI) once the Resend key stopped being the thing actually configured.
 */

import { sendWebPush } from './vapid.js';

// ── Date helpers ──────────────────────────────────────────────────────────────

function esc(s) {
  return (s == null ? '' : String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

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

function buildEmailHtml(article, articleUrl, unsubUrl, isUpdate = false, changes = []) {
  const dates = fmtDateRange(article);
  const dest  = article.destination ? ` · 📍 ${esc(article.destination)}` : '';
  const desc  = esc(article.short_description) || (isUpdate ? 'Le récit de voyage a été mis à jour.' : 'Un nouveau récit de voyage vient d\'être publié sur le blog !');

  const badge = isUpdate
    ? `<div style="font-size:11px;font-weight:700;color:#7C5CBF;text-transform:uppercase;letter-spacing:.15em;margin-bottom:12px">✏️ Récit mis à jour</div>`
    : `<div style="font-size:11px;font-weight:700;color:#2E7D6B;text-transform:uppercase;letter-spacing:.15em;margin-bottom:12px">✦ Nouveau récit de voyage</div>`;

  const changesHtml = isUpdate && changes.length
    ? `<div style="margin:14px 0;padding:12px 16px;background:#F5F3FF;border-radius:12px;border-left:3px solid #7C5CBF">
        <div style="font-size:11px;font-weight:700;color:#7C5CBF;margin-bottom:6px;text-transform:uppercase;letter-spacing:.1em">Ce qui a changé</div>
        ${changes.map(c => `<div style="font-size:13px;color:#4A3B6A;line-height:1.6">• ${esc(c)}</div>`).join('')}
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(article.title)}</title>
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
    ${badge}
    <h1 style="font-size:23px;font-weight:700;color:#1A2B3C;margin:0 0 10px;line-height:1.25;font-family:Georgia,serif">${esc(article.title)}</h1>
    ${dates ? `<div style="font-size:13px;color:#8A9BAC;margin-bottom:14px">📅 ${dates}${dest}</div>` : ''}
    ${changesHtml}
    <p style="font-size:15px;color:#5A6A7A;line-height:1.72;margin:0 0 22px">${desc}</p>
    <a href="${articleUrl}"
       style="display:inline-block;background:#0057B8;color:#ffffff;text-decoration:none;padding:13px 30px;border-radius:999px;font-weight:700;font-size:14px;letter-spacing:.01em">
      ${isUpdate ? 'Voir les mises à jour →' : 'Lire le récit →'}
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
 * @param {object} ctx   - Cloudflare Workers ExecutionContext
 * @param {object} article - normalised article object (slug, title, etc.)
 */
export function notifySubscribers(env, ctx, article, { isUpdate = false, changes = [] } = {}) {
  ctx.waitUntil(_doNotify(env, article, isUpdate, changes));
}

async function _doNotify(env, article, isUpdate, changes) {
  const publicUrl = (env.PUBLIC_URL || '').replace(/\/$/, '');
  const articleUrl = `${publicUrl}/voyage/${article.slug}`;

  // ── Push notifications ────────────────────────────────────────────────────
  if (env.VAPID_PRIVATE_KEY && env.VAPID_PUBLIC_KEY) {
    try {
      const { results: pushSubs } = await env.DB
        .prepare('SELECT id, endpoint, p256dh, auth FROM push_subscriptions')
        .all();

      console.log(`[Push] ${pushSubs?.length ?? 0} abonné(s) push`);

      if (pushSubs && pushSubs.length > 0) {
        const iconUrl = publicUrl ? `${publicUrl}/icon-192.png` : '/icon-192.png';

        // Build notification content
        let notifTitle, notifBody;
        if (isUpdate) {
          notifTitle = `✏️ ${article.title}`;
          notifBody = changes.length
            ? changes.join(' · ')
            : (article.short_description || 'Le récit a été mis à jour.');
        } else {
          notifTitle = `✈️ Nouveau récit : ${article.title}`;
          const dates = fmtDateRange(article);
          const dest  = article.destination ? ` · ${article.destination}` : '';
          notifBody = [dates + dest, article.short_description].filter(Boolean).join('\n') || 'Un nouveau voyage vient d\'être publié !';
        }

        const payload = JSON.stringify({
          title: notifTitle,
          body:  notifBody,
          icon:  iconUrl,
          badge: iconUrl,
          url:   `/voyage/${article.slug}`,
          tag:   `article-${article.id}`,
          renotify: true,
        });

        await Promise.allSettled(pushSubs.map(async sub => {
          try {
            const res = await sendWebPush(sub, payload, env);
            if (!res) { console.warn('[Push] sendWebPush returned nothing for', sub.endpoint); return; }
            if (res.status === 410 || res.status === 404) {
              console.log('[Push] subscription expired, suppression →', sub.endpoint);
              await env.DB
                .prepare('DELETE FROM push_subscriptions WHERE id=?')
                .bind(sub.id).run();
            } else if (!res.ok) {
              const body = await res.text().catch(() => '');
              console.error(`[Push] HTTP ${res.status} pour ${sub.endpoint}: ${body}`);
            } else {
              console.log('[Push] ✓ envoyé à', sub.endpoint);
            }
          } catch (err) {
            console.error('[Push] erreur pour', sub.endpoint, err);
          }
        }));
      }
    } catch (err) {
      console.error('[Push] notifications échouées:', err);
    }
  } else {
    console.warn('[Push] VAPID_PUBLIC_KEY ou VAPID_PRIVATE_KEY manquants - push ignoré');
  }

  // ── Email notifications (via Mailjet) ─────────────────────────────────────
  try {
    const { results: settingsRows } = await env.DB
      .prepare("SELECT key, value FROM site_settings WHERE key IN ('mailjet_api_key', 'mailjet_api_secret', 'email_from_address', 'email_from_name')")
      .all();
    const settings = Object.fromEntries((settingsRows || []).map(r => [r.key, r.value]));
    const apiKey = settings.mailjet_api_key || '';
    const apiSecret = settings.mailjet_api_secret || '';
    const fromAddress = settings.email_from_address || '';
    const fromName = settings.email_from_name || 'Tranquille, on est en vacances';

    if (!apiKey || !apiSecret || !fromAddress) {
      console.warn('[Email] Configuration Mailjet incomplète - notifications email ignorées');
    } else {
      const { results: emailSubs } = await env.DB
        .prepare('SELECT email, token FROM email_subscriptions WHERE active=1')
        .all();

      console.log(`[Email] ${emailSubs?.length ?? 0} abonné(s) email`);

      if (emailSubs && emailSubs.length > 0) {
        const auth = btoa(`${apiKey}:${apiSecret}`);
        await Promise.allSettled(emailSubs.map(async sub => {
          try {
            const unsubUrl = `${publicUrl}/unsubscribe?token=${sub.token}`;
            const subject = isUpdate
              ? `✏️ Récit mis à jour : ${article.title}`
              : `✈️ Nouveau voyage : ${article.title}`;
            const emailRes = await fetch('https://api.mailjet.com/v3.1/send', {
              method:  'POST',
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                Messages: [{
                  From: { Email: fromAddress, Name: fromName },
                  To:   [{ Email: sub.email }],
                  Subject: subject,
                  HTMLPart: buildEmailHtml(article, articleUrl, unsubUrl, isUpdate, changes),
                }],
              }),
              signal: AbortSignal.timeout(10000),
            });
            const emailBody = await emailRes.json().catch(() => null);
            const msgResult = emailBody?.Messages?.[0];
            if (!emailRes.ok || !msgResult || msgResult.Status !== 'success') {
              console.error(`[Email] HTTP ${emailRes.status} pour ${sub.email}:`, emailBody);
            } else {
              console.log('[Email] ✓ envoyé à', sub.email);
            }
          } catch (err) {
            console.error('[Email] error for', sub.email, err);
          }
        }));
      }
    }
  } catch (err) {
    console.error('[Email] notifications failed:', err);
  }
}
