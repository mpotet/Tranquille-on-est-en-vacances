/**
 * api/email-admin.js - "Emails" dashboard tab: send history + sending domain setup.
 *
 * Routes (all admin-only):
 *   GET  /api/admin/email-log        - recent transactional email attempts
 *   GET  /api/admin/email-domain     - current from-address + Resend domain status
 *   POST /api/admin/email-domain     - register a new domain with Resend, get DNS records
 *   POST /api/admin/email-from       - set the from-address used for outgoing emails
 *
 * Domain verification itself happens on Resend's side (DNS propagation, then
 * their own check) - this module only registers the domain, surfaces the DNS
 * records the admin needs to add at their registrar, and reports back the
 * verification status Resend has recorded.
 */

import { json, badRequest } from '../utils.js';

async function resendFetch(env, path, options = {}) {
  if (!env.RESEND_API_KEY) return { ok: false, error: 'Clé API Resend non configurée sur le serveur.' };
  const res = await fetch(`https://api.resend.com${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, error: body?.message || `Erreur HTTP ${res.status}`, status: res.status };
  return { ok: true, data: body };
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
// Current from-address + domain verification status
// ──────────────────────────────────────────────────────────────
export async function getEmailDomainStatus(env) {
  const fromRow = await env.DB.prepare("SELECT value FROM site_settings WHERE key = 'email_from_address'").first();
  const domainIdRow = await env.DB.prepare("SELECT value FROM site_settings WHERE key = 'email_resend_domain_id'").first();
  const fromAddress = fromRow?.value || env.NOTIFY_FROM_EMAIL || 'onboarding@resend.dev';

  let domain = null;
  if (domainIdRow?.value) {
    const result = await resendFetch(env, `/domains/${domainIdRow.value}`);
    if (result.ok) {
      domain = {
        id: result.data.id,
        name: result.data.name,
        status: result.data.status, // 'not_started' | 'pending' | 'verified' | 'failed'
        records: result.data.records || [],
      };
    }
  }
  return json({ from_address: fromAddress, domain, api_key_configured: !!env.RESEND_API_KEY });
}

// ──────────────────────────────────────────────────────────────
// Register a new sending domain with Resend
// ──────────────────────────────────────────────────────────────
export async function registerEmailDomain(request, env) {
  const body = await request.json().catch(() => ({}));
  const name = String(body.domain || '').trim().toLowerCase();
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(name)) {
    return badRequest('Nom de domaine invalide.');
  }

  const result = await resendFetch(env, '/domains', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  if (!result.ok) return badRequest(result.error);

  await env.DB
    .prepare("INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES ('email_resend_domain_id', ?, datetime('now'))")
    .bind(result.data.id)
    .run();

  return json({
    id: result.data.id,
    name: result.data.name,
    status: result.data.status,
    records: result.data.records || [],
  });
}

// ──────────────────────────────────────────────────────────────
// Re-check verification status of the currently registered domain
// ──────────────────────────────────────────────────────────────
export async function verifyEmailDomain(env) {
  const domainIdRow = await env.DB.prepare("SELECT value FROM site_settings WHERE key = 'email_resend_domain_id'").first();
  if (!domainIdRow?.value) return badRequest('Aucun domaine enregistré.');

  const result = await resendFetch(env, `/domains/${domainIdRow.value}/verify`, { method: 'POST' });
  if (!result.ok) return badRequest(result.error);

  const statusResult = await resendFetch(env, `/domains/${domainIdRow.value}`);
  if (!statusResult.ok) return badRequest(statusResult.error);

  return json({
    id: statusResult.data.id,
    name: statusResult.data.name,
    status: statusResult.data.status,
    records: statusResult.data.records || [],
  });
}

// ──────────────────────────────────────────────────────────────
// Set the "from" address used for all outgoing admin emails
// ──────────────────────────────────────────────────────────────
export async function setEmailFromAddress(request, env) {
  const body = await request.json().catch(() => ({}));
  const address = String(body.from_address || '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address)) {
    return badRequest('Adresse email invalide.');
  }
  await env.DB
    .prepare("INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES ('email_from_address', ?, datetime('now'))")
    .bind(address)
    .run();
  return json({ ok: true });
}
