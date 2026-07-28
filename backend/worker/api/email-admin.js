/**
 * api/email-admin.js - "Emails" dashboard tab: send history + Mailjet sender setup.
 *
 * Routes (all admin-only):
 *   GET  /api/admin/email-log        - recent transactional email attempts
 *   GET  /api/admin/email-config     - current Mailjet config + sender verification status
 *   POST /api/admin/email-config     - save Mailjet API key/secret + sender address/name
 *   POST /api/admin/email-config/check - re-check sender verification status with Mailjet
 *   POST /api/admin/email-config/verify - (re)send the sender verification email
 *
 * Mailjet is used here after Resend (needs a verified domain), Brevo (free
 * accounts need a manual support-ticket activation of the transactional
 * API), and SMTP2GO (refuses account signup itself with a Gmail/ISP
 * address, independent of sender verification) all turned out unusable
 * without a domain. Mailjet accepted signup with a personal address and its
 * per-address sender verification (click a confirmation link, no domain
 * ownership needed) worked in practice. See worker/admin-email.js for the
 * actual send() implementation and the same reasoning.
 */

import { json, badRequest, cleanEmailInput } from '../utils.js';

async function mailjetFetch(apiKey, apiSecret, path, options = {}) {
  if (!apiKey || !apiSecret) return { ok: false, error: 'Clés API Mailjet manquantes.' };
  const auth = btoa(`${apiKey}:${apiSecret}`);
  // Without a timeout, a slow/unresponsive Mailjet API would hang the request
  // handler indefinitely - e.g. GET /api/admin/email-config calls this live
  // on every load of the Emails tab, so the whole dashboard tab would stall.
  let res;
  try {
    res = await fetch(`https://api.mailjet.com${path}`, {
      ...options,
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    return { ok: false, error: err?.name === 'TimeoutError' ? 'Mailjet ne répond pas (délai dépassé).' : 'Erreur réseau vers Mailjet.' };
  }
  const parsed = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, error: parsed?.ErrorMessage || `Erreur HTTP ${res.status}`, errorCode: parsed?.ErrorCode, status: res.status };
  return { ok: true, data: parsed };
}

async function getConfig(env) {
  const { results } = await env.DB
    .prepare("SELECT key, value FROM site_settings WHERE key IN ('mailjet_api_key', 'mailjet_api_secret', 'email_from_address', 'email_from_name')")
    .all();
  const settings = Object.fromEntries((results || []).map(r => [r.key, r.value]));
  return {
    apiKey: settings.mailjet_api_key || '',
    apiSecret: settings.mailjet_api_secret || '',
    fromAddress: settings.email_from_address || '',
    fromName: settings.email_from_name || 'Tranquille, on est en vacances',
  };
}

async function checkSenderVerified(apiKey, apiSecret, fromAddress) {
  const result = await mailjetFetch(apiKey, apiSecret, '/v3/REST/sender');
  if (!result.ok) return { checked: false, error: result.error };
  const senders = result.data?.Data || [];
  const match = senders.find(s => (s.Email || '').toLowerCase() === fromAddress.toLowerCase());
  return { checked: true, found: !!match, verified: match ? match.Status === 'Active' : false };
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
// Current Mailjet config + sender verification status
// ──────────────────────────────────────────────────────────────
export async function getEmailConfigStatus(env) {
  const { apiKey, apiSecret, fromAddress, fromName } = await getConfig(env);

  // Never send the raw API secret back to the client - only whether one is
  // set. For a short key, slice(0,8) and slice(-4) would overlap and reveal
  // nearly the whole thing "in plain text" - fall back to a fixed mask.
  const maskKey = (k) => k ? (k.length > 16 ? k.slice(0, 8) + '…' + k.slice(-4) : '••••••••') : '';

  let senderStatus = null; // null = unknown/not checked, true = verified, false = not verified
  let senderFound = null;
  if (apiKey && apiSecret && fromAddress) {
    const result = await checkSenderVerified(apiKey, apiSecret, fromAddress);
    if (result.checked) { senderStatus = result.verified; senderFound = result.found; }
  }

  return json({
    api_key_configured: !!(apiKey && apiSecret),
    api_key_masked: maskKey(apiKey),
    api_secret_masked: maskKey(apiSecret),
    from_address: fromAddress,
    from_name: fromName,
    sender_verified: senderStatus,
    sender_found: senderFound,
  });
}

// ──────────────────────────────────────────────────────────────
// Save Mailjet API key/secret + sender address/name
// ──────────────────────────────────────────────────────────────
export async function saveEmailConfig(request, env) {
  const body = await request.json().catch(() => ({}));
  const apiKey = String(body.api_key ?? '').trim();
  const apiSecret = String(body.api_secret ?? '').trim();
  const fromAddress = cleanEmailInput(body.from_address);
  const fromName = String(body.from_name ?? '').trim();

  if (fromAddress && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fromAddress)) {
    return badRequest('Adresse email invalide.');
  }

  const stmt = env.DB.prepare("INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))");
  // Both API fields are masked client-side (never sent back in full), so an
  // empty submit for either must mean "keep the existing value", not "clear
  // it". The sender name has no such masking - the client always sees its
  // current value, so an explicit empty submission is a deliberate "reset to
  // default" and must be allowed through, not silently ignored.
  if (apiKey) await stmt.bind('mailjet_api_key', apiKey).run();
  if (apiSecret) await stmt.bind('mailjet_api_secret', apiSecret).run();
  if (fromAddress) await stmt.bind('email_from_address', fromAddress).run();
  if ('from_name' in body) await stmt.bind('email_from_name', fromName).run();

  return json({ ok: true });
}

// ──────────────────────────────────────────────────────────────
// Re-check sender verification status with Mailjet
// ──────────────────────────────────────────────────────────────
export async function checkEmailSenderStatus(env) {
  const { apiKey, apiSecret, fromAddress } = await getConfig(env);
  if (!apiKey || !apiSecret) return badRequest('Clés API Mailjet non configurées.');
  if (!fromAddress) return badRequest('Adresse expéditrice non configurée.');

  const result = await checkSenderVerified(apiKey, apiSecret, fromAddress);
  if (!result.checked) return badRequest(result.error);
  return json({ from_address: fromAddress, sender_verified: result.verified, found: result.found });
}

// ──────────────────────────────────────────────────────────────
// Trigger (or re-trigger) the sender verification email from Mailjet
// ──────────────────────────────────────────────────────────────
export async function requestSenderVerification(env) {
  const { apiKey, apiSecret, fromAddress } = await getConfig(env);
  if (!apiKey || !apiSecret) return badRequest('Clés API Mailjet non configurées.');
  if (!fromAddress) return badRequest('Adresse expéditrice non configurée.');

  const result = await mailjetFetch(apiKey, apiSecret, '/v3/REST/sender', {
    method: 'POST',
    body: JSON.stringify({ Email: fromAddress }),
  });
  if (!result.ok) {
    // MJ18: this address is already registered as a sender on the account
    // (e.g. added earlier via the Mailjet dashboard directly) - not an
    // error, just nothing new to do. Point the admin at "Vérifier le statut"
    // instead of showing a confusing failure for an address that likely
    // already works. Matched against the message text (not result.errorCode)
    // because Mailjet's v3 REST error payload doesn't reliably expose "MJ18"
    // as a separate ErrorCode field — it shows up as the leading token of
    // ErrorMessage instead, which is what result.error actually contains.
    if (/\bMJ18\b/.test(result.error || '')) {
      return json({ ok: true, message: `${fromAddress} est déjà enregistrée chez Mailjet. Cliquez sur « Vérifier le statut » pour voir si elle est déjà validée.` });
    }
    return badRequest(result.error);
  }
  return json({ ok: true, message: `Email de vérification envoyé à ${fromAddress}. Cliquez le lien reçu, puis revenez vérifier le statut.` });
}
