/**
 * api/email-admin.js - "Emails" dashboard tab: send history + Brevo sender setup.
 *
 * Routes (all admin-only):
 *   GET  /api/admin/email-log        - recent transactional email attempts
 *   GET  /api/admin/email-config     - current Brevo config + sender verification status
 *   POST /api/admin/email-config     - save Brevo API key + sender address/name
 *   POST /api/admin/email-config/check - re-check sender verification status with Brevo
 *
 * Brevo (not Resend) is used here specifically because it lets you verify a
 * single sender ADDRESS via a 6-digit code emailed to it - no domain/DNS
 * ownership required - then send to any recipient. That's what makes this
 * usable without buying a domain. See worker/admin-email.js for the actual
 * send() implementation and why it was chosen.
 */

import { json, badRequest } from '../utils.js';

async function brevoFetch(apiKey, path, options = {}) {
  if (!apiKey) return { ok: false, error: 'Clé API Brevo manquante.' };
  const res = await fetch(`https://api.brevo.com${path}`, {
    ...options,
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json', 'Accept': 'application/json', ...(options.headers || {}) },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, error: body?.message || `Erreur HTTP ${res.status}`, status: res.status };
  return { ok: true, data: body };
}

async function getConfig(env) {
  const { results } = await env.DB
    .prepare("SELECT key, value FROM site_settings WHERE key IN ('brevo_api_key', 'email_from_address', 'email_from_name')")
    .all();
  const settings = Object.fromEntries((results || []).map(r => [r.key, r.value]));
  return {
    apiKey: settings.brevo_api_key || '',
    fromAddress: settings.email_from_address || '',
    fromName: settings.email_from_name || 'Tranquille, on est en vacances',
  };
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
// Current Brevo config + sender verification status
// ──────────────────────────────────────────────────────────────
export async function getEmailConfigStatus(env) {
  const { apiKey, fromAddress, fromName } = await getConfig(env);

  // Never send the raw API key back to the client - only whether one is set.
  const masked = apiKey ? apiKey.slice(0, 8) + '…' + apiKey.slice(-4) : '';

  let senderStatus = null; // null = unknown/not checked, true = verified, false = not verified
  if (apiKey && fromAddress) {
    const result = await brevoFetch(apiKey, '/v3/senders');
    if (result.ok) {
      const match = (result.data.senders || []).find(s => s.email.toLowerCase() === fromAddress.toLowerCase());
      senderStatus = match ? !!match.active : false;
    }
  }

  return json({
    api_key_configured: !!apiKey,
    api_key_masked: masked,
    from_address: fromAddress,
    from_name: fromName,
    sender_verified: senderStatus,
  });
}

// ──────────────────────────────────────────────────────────────
// Save Brevo API key + sender address/name
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
  // Only overwrite the API key if a new one was actually provided - the
  // client never receives the real key back, so an empty submit must not
  // wipe out a previously-saved one.
  if (apiKey) await stmt.bind('brevo_api_key', apiKey).run();
  if (fromAddress) await stmt.bind('email_from_address', fromAddress).run();
  if (fromName) await stmt.bind('email_from_name', fromName).run();

  return json({ ok: true });
}

// ──────────────────────────────────────────────────────────────
// Re-check sender verification status with Brevo
// ──────────────────────────────────────────────────────────────
export async function checkEmailSenderStatus(env) {
  const { apiKey, fromAddress } = await getConfig(env);
  if (!apiKey) return badRequest('Clé API Brevo non configurée.');
  if (!fromAddress) return badRequest('Adresse expéditrice non configurée.');

  const result = await brevoFetch(apiKey, '/v3/senders');
  if (!result.ok) return badRequest(result.error);

  const match = (result.data.senders || []).find(s => s.email.toLowerCase() === fromAddress.toLowerCase());
  return json({ from_address: fromAddress, sender_verified: match ? !!match.active : false, found: !!match });
}
