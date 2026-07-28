/**
 * worker/api/settings.js - Site-wide settings CRUD
 *
 * GET  /api/settings  - public, returns all settings as { key: value }
 * PUT  /api/settings  - admin only, updates allowed keys
 */

import { json } from '../utils.js';

const ALLOWED_KEYS = [
  'hero_image_url', 'hero_image_r2_key',
  'hero_title', 'hero_subtitle', 'site_tagline',
  'hero_eyebrow', 'hero_badge', 'hero_cta_primary', 'hero_cta_secondary',
  'comment_gate_question', 'comment_gate_answer',
  'admin_display_name',
];

// Allow-list of keys safe to expose to anonymous visitors. Anything NOT listed
// here (Mailjet API keys/secret, sender address, the spam-gate answer, and any
// future secret added to site_settings) is stripped from the public response —
// a deny-list would silently leak a newly-added secret if we forgot to list it.
const PUBLIC_KEYS = new Set([
  'hero_image_url', 'hero_image_r2_key',
  'hero_title', 'hero_subtitle', 'site_tagline',
  'hero_eyebrow', 'hero_badge', 'hero_cta_primary', 'hero_cta_secondary',
  'comment_gate_question',
  'admin_display_name',
]);

export async function getSettings(env, isAdmin = false) {
  const { results } = await env.DB.prepare(
    'SELECT key, value FROM site_settings'
  ).all();
  const settings = Object.fromEntries(
    (results || [])
      .filter(r => isAdmin || PUBLIC_KEYS.has(r.key))
      .map(r => [r.key, r.value])
  );
  return json(settings);
}

export async function updateSettings(request, env) {
  const body = await request.json().catch(() => ({}));
  const stmt = env.DB.prepare(
    "INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))"
  );
  for (const key of ALLOWED_KEYS) {
    if (key in body) {
      await stmt.bind(key, String(body[key] ?? '')).run();
    }
  }
  return json({ ok: true });
}
