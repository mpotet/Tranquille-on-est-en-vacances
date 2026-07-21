/**
 * api/email-admin.js - "Emails" dashboard tab: send history + SMTP2GO sender setup.
 *
 * Routes (all admin-only):
 *   GET  /api/admin/email-log        - recent transactional email attempts
 *   GET  /api/admin/email-config     - current SMTP2GO config + sender verification status
 *   POST /api/admin/email-config     - save SMTP2GO API key + sender address/name
 *   POST /api/admin/email-config/check - re-check sender verification status with SMTP2GO
 *   POST /api/admin/email-config/verify - (re)send the sender verification email
 *
 * SMTP2GO (not Resend, not Brevo) is used here specifically because its
 * "Single Sender Email" verification (click a confirmation link sent to the
 * address, no domain/DNS ownership needed) works immediately on a fresh free
 * account - Resend requires a verified domain outright, and Brevo's free
 * accounts require a manual support-ticket activation of the transactional
 * API before /v3/smtp/email works at all ("Your SMTP account is not yet
 * activated"). See worker/admin-email.js for the actual send()
 * implementation and the same reasoning.
 */

import { json, badRequest } from '../utils.js';

async function smtp2goFetch(apiKey, path, body) {
  if (!apiKey) return { ok: false, error: 'Clé API SMTP2GO manquante.' };
  // Without a timeout, a slow/unresponsive SMTP2GO API would hang the request
  // handler indefinitely - e.g. GET /api/admin/email-config calls this live
  // on every load of the Emails tab, so the whole dashboard tab would stall.
  let res;
  try {
    res = await fetch(`https://api.smtp2go.com${path}`, {
      method: 'POST',
      headers: { 'X-Smtp2go-Api-Key': apiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body || {}),
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    return { ok: false, error: err?.name === 'TimeoutError' ? 'SMTP2GO ne répond pas (délai dépassé).' : 'Erreur réseau vers SMTP2GO.' };
  }
  const parsed = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, error: parsed?.data?.error || `Erreur HTTP ${res.status}`, status: res.status };
  return { ok: true, data: parsed?.data };
}

async function getConfig(env) {
  const { results } = await env.DB
    .prepare("SELECT key, value FROM site_settings WHERE key IN ('smtp2go_api_key', 'email_from_address', 'email_from_name')")
    .all();
  const settings = Object.fromEntries((results || []).map(r => [r.key, r.value]));
  return {
    apiKey: settings.smtp2go_api_key || '',
    fromAddress: settings.email_from_address || '',
    fromName: settings.email_from_name || 'Tranquille, on est en vacances',
  };
}

async function checkSenderVerified(apiKey, fromAddress) {
  const result = await smtp2goFetch(apiKey, '/v3/single_sender_emails/view', { email_address: fromAddress });
  if (!result.ok) return { checked: false, error: result.error };
  const senders = result.data?.senders || result.data?.email_addresses || [];
  const match = senders.find(s => (s.email_address || '').toLowerCase() === fromAddress.toLowerCase());
  return { checked: true, found: !!match, verified: match ? !!match.verified : false };
}

// ──────────────────────────────────────────────────────────────
// Recent email send history
// ──────────────────────────────────────────────────────────────
export async function listEmailLog(env) {
  const { results } = await env.DB
    .prepare('SELECT id, email_type, recipient, ok, error, created_at FROM email_log ORDER BY created_at DESC LIMIT 50')
    .all();
  return json({ entries: results || [] });
}

// ──────────────────────────────────────────────────────────────
// Current SMTP2GO config + sender verification status
// ──────────────────────────────────────────────────────────────
export async function getEmailConfigStatus(env) {
  const { apiKey, fromAddress, fromName } = await getConfig(env);

  // Never send the raw API key back to the client - only whether one is set.
  // For a short key, slice(0,8) and slice(-4) would overlap and reveal nearly
  // the whole thing in "plain text" - fall back to a fixed-width mask instead.
  const masked = apiKey
    ? (apiKey.length > 16 ? apiKey.slice(0, 8) + '…' + apiKey.slice(-4) : '••••••••')
    : '';

  let senderStatus = null; // null = unknown/not checked, true = verified, false = not verified
  let senderFound = null;
  if (apiKey && fromAddress) {
    const result = await checkSenderVerified(apiKey, fromAddress);
    if (result.checked) { senderStatus = result.verified; senderFound = result.found; }
  }

  return json({
    api_key_configured: !!apiKey,
    api_key_masked: masked,
    from_address: fromAddress,
    from_name: fromName,
    sender_verified: senderStatus,
    sender_found: senderFound,
  });
}

// ──────────────────────────────────────────────────────────────
// Save SMTP2GO API key + sender address/name
// ──────────────────────────────────────────────────────────────
export async function saveEmailConfig(request, env) {
  const body = await request.json().catch(() => ({}));
  const apiKey = String(body.api_key ?? '').trim();
  const fromAddress = String(body.from_address ?? '').trim();
  const fromName = String(body.from_name ?? '').trim();

  if (fromAddress && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fromAddress)) {
    return badRequest('Adresse email invalide.');
  }

  const stmt = env.DB.prepare("INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))");
  // The API key is masked client-side (never sent back in full), so an empty
  // submit there must mean "keep the existing key", not "clear it". The
  // sender name has no such masking - the client always sees its current
  // value, so an explicit empty submission is a deliberate "reset to
  // default" and must be allowed through, not silently ignored.
  if (apiKey) await stmt.bind('smtp2go_api_key', apiKey).run();
  if (fromAddress) await stmt.bind('email_from_address', fromAddress).run();
  if ('from_name' in body) await stmt.bind('email_from_name', fromName).run();

  return json({ ok: true });
}

// ──────────────────────────────────────────────────────────────
// Re-check sender verification status with SMTP2GO
// ──────────────────────────────────────────────────────────────
export async function checkEmailSenderStatus(env) {
  const { apiKey, fromAddress } = await getConfig(env);
  if (!apiKey) return badRequest('Clé API SMTP2GO non configurée.');
  if (!fromAddress) return badRequest('Adresse expéditrice non configurée.');

  const result = await checkSenderVerified(apiKey, fromAddress);
  if (!result.checked) return badRequest(result.error);
  return json({ from_address: fromAddress, sender_verified: result.verified, found: result.found });
}

// ──────────────────────────────────────────────────────────────
// Trigger (or re-trigger) the sender verification email from SMTP2GO
// ──────────────────────────────────────────────────────────────
export async function requestSenderVerification(env) {
  const { apiKey, fromAddress } = await getConfig(env);
  if (!apiKey) return badRequest('Clé API SMTP2GO non configurée.');
  if (!fromAddress) return badRequest('Adresse expéditrice non configurée.');

  const result = await smtp2goFetch(apiKey, '/v3/single_sender_emails/add', { email_address: fromAddress });
  if (!result.ok) return badRequest(result.error);
  return json({ ok: true, message: `Email de vérification envoyé à ${fromAddress}. Cliquez le lien reçu, puis revenez vérifier le statut.` });
}
