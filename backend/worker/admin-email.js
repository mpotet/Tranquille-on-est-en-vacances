/**
 * worker/admin-email.js - Transactional admin-account emails via Resend.
 *
 * Reuses the exact Resend pattern from notifications.js:
 *   fetch('https://api.resend.com/emails', ...) with env.RESEND_API_KEY and
 *   env.NOTIFY_FROM_EMAIL (fallback 'onboarding@resend.dev').
 *
 * Four helpers:
 *   sendSetupEmail        - first-run "initialisez votre mot de passe"
 *   sendResetEmail        - "réinitialisez votre mot de passe"
 *   sendEmailChangeEmail  - sent to the NEW address to confirm an email change
 *   sendPasswordChangedEmail - courtesy notice after a self-service change
 *
 * All links are absolute, built from env.PUBLIC_URL.
 */

// ── Shared email chrome (warm family-blog branding, --blue/--cream/--ink) ─────
const BLUE = '#0057B8';
const INK = '#1A2B3C';
const INK_MUTED = '#5A6A7A';
const CREAM = '#FFFDF9';

function shell({ title, badge, badgeColor, heading, bodyHtml, ctaUrl, ctaLabel, footerNote }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${CREAM};font-family:ui-sans-serif,system-ui,sans-serif;color:${INK}">
<div style="max-width:600px;margin:0 auto;padding:28px 20px">

  <!-- Header -->
  <div style="text-align:center;padding:20px 0 24px">
    <div style="font-size:2.4rem;line-height:1">🌴</div>
    <div style="font-size:17px;font-weight:700;color:${BLUE};margin-top:8px;letter-spacing:-.02em">Tranquille, on est en vacances</div>
    <div style="font-size:11px;color:#8A9BAC;margin-top:3px;text-transform:uppercase;letter-spacing:.18em">Espace administrateur</div>
  </div>

  <!-- Card -->
  <div style="background:#ffffff;border-radius:20px;padding:28px 24px;border:1px solid rgba(26,43,60,.10);box-shadow:0 2px 12px rgba(26,43,60,.06)">
    <div style="font-size:11px;font-weight:700;color:${badgeColor};text-transform:uppercase;letter-spacing:.15em;margin-bottom:12px">${badge}</div>
    <h1 style="font-size:23px;font-weight:700;color:${INK};margin:0 0 14px;line-height:1.25;font-family:Georgia,serif">${heading}</h1>
    ${bodyHtml}
    ${ctaUrl ? `<a href="${ctaUrl}"
       style="display:inline-block;background:${BLUE};color:#ffffff;text-decoration:none;padding:13px 30px;border-radius:999px;font-weight:700;font-size:14px;letter-spacing:.01em;margin-top:8px">
      ${ctaLabel} →
    </a>
    <p style="font-size:12px;color:#8A9BAC;line-height:1.7;margin:18px 0 0">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br><span style="color:${INK_MUTED};word-break:break-all">${ctaUrl}</span></p>` : ''}
  </div>

  <!-- Footer -->
  <div style="text-align:center;margin-top:22px;font-size:12px;color:#8A9BAC;line-height:1.9">
    <p style="margin:0">${footerNote}</p>
  </div>

</div>
</body>
</html>`;
}

function publicBase(env) {
  return (env.PUBLIC_URL || '').replace(/\/$/, '');
}

async function send(env, { to, subject, html }) {
  if (!env.RESEND_API_KEY) {
    console.warn('[AdminEmail] RESEND_API_KEY manquant - email ignoré');
    return { ok: false, skipped: true };
  }
  const from = env.NOTIFY_FROM_EMAIL || 'onboarding@resend.dev';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[AdminEmail] HTTP ${res.status} pour ${to}: ${body}`);
    return { ok: false, status: res.status };
  }
  return { ok: true };
}

// ── First-run: initialise your password ───────────────────────────────────────
export function sendSetupEmail(env, to, token) {
  const url = `${publicBase(env)}/admin/setup?token=${encodeURIComponent(token)}`;
  const html = shell({
    title: 'Initialisez votre mot de passe administrateur',
    badge: '✦ Bienvenue',
    badgeColor: '#2E7D6B',
    heading: 'Initialisez votre mot de passe administrateur',
    bodyHtml: `<p style="font-size:15px;color:${INK_MUTED};line-height:1.72;margin:0 0 22px">Bienvenue dans l'espace administrateur du blog. Pour activer votre compte, choisissez un mot de passe en cliquant sur le bouton ci-dessous. Ce lien est valable <strong>1 heure</strong>.</p>`,
    ctaUrl: url,
    ctaLabel: 'Choisir mon mot de passe',
    footerNote: "Vous recevez cet email car un compte administrateur a été créé pour cette adresse.",
  });
  return send(env, { to, subject: 'Initialisez votre mot de passe administrateur', html });
}

// ── Forgot password: reset ────────────────────────────────────────────────────
export function sendResetEmail(env, to, token) {
  const url = `${publicBase(env)}/admin/reset?token=${encodeURIComponent(token)}`;
  const html = shell({
    title: 'Réinitialisez votre mot de passe',
    badge: '🔑 Réinitialisation',
    badgeColor: BLUE,
    heading: 'Réinitialisez votre mot de passe',
    bodyHtml: `<p style="font-size:15px;color:${INK_MUTED};line-height:1.72;margin:0 0 22px">Vous avez demandé la réinitialisation de votre mot de passe administrateur. Cliquez sur le bouton ci-dessous pour en choisir un nouveau. Ce lien est valable <strong>1 heure</strong>. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`,
    ctaUrl: url,
    ctaLabel: 'Réinitialiser mon mot de passe',
    footerNote: "Vous recevez cet email suite à une demande de réinitialisation de mot de passe.",
  });
  return send(env, { to, subject: 'Réinitialisez votre mot de passe', html });
}

// ── Email change: confirm the NEW address ─────────────────────────────────────
export function sendEmailChangeEmail(env, to, token) {
  const url = `${publicBase(env)}/admin/confirm-email?token=${encodeURIComponent(token)}`;
  const html = shell({
    title: 'Confirmez votre nouvelle adresse email',
    badge: '✉️ Changement d\'adresse',
    badgeColor: '#7C5CBF',
    heading: 'Confirmez votre nouvelle adresse email',
    bodyHtml: `<p style="font-size:15px;color:${INK_MUTED};line-height:1.72;margin:0 0 22px">Vous avez demandé à utiliser cette adresse comme nouvel email administrateur. Confirmez ce changement en cliquant sur le bouton ci-dessous. Ce lien est valable <strong>1 heure</strong>. Le changement ne prendra effet qu'après confirmation.</p>`,
    ctaUrl: url,
    ctaLabel: 'Confirmer cette adresse',
    footerNote: "Vous recevez cet email car cette adresse a été proposée comme nouvel email administrateur.",
  });
  return send(env, { to, subject: 'Confirmez votre nouvelle adresse email', html });
}

// ── Courtesy notice after a self-service password change ──────────────────────
export function sendPasswordChangedEmail(env, to) {
  const html = shell({
    title: 'Votre mot de passe a été modifié',
    badge: '🔒 Sécurité',
    badgeColor: '#2E7D6B',
    heading: 'Votre mot de passe a été modifié',
    bodyHtml: `<p style="font-size:15px;color:${INK_MUTED};line-height:1.72;margin:0 0 4px">Le mot de passe de votre compte administrateur vient d'être modifié.</p>
    <p style="font-size:15px;color:${INK_MUTED};line-height:1.72;margin:0 0 22px">Si vous êtes à l'origine de ce changement, aucune action n'est nécessaire. Dans le cas contraire, réinitialisez immédiatement votre mot de passe via « Mot de passe oublié » sur la page de connexion.</p>`,
    ctaUrl: `${publicBase(env)}/admin`,
    ctaLabel: 'Aller à la connexion',
    footerNote: "Vous recevez cet email car le mot de passe de votre compte a été modifié.",
  });
  return send(env, { to, subject: 'Votre mot de passe a été modifié', html });
}
