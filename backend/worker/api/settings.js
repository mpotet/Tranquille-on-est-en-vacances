/**
 * worker/api/settings.js - Site-wide settings CRUD
 *
 * GET  /api/settings  - public, returns all settings as { key: value }
 * PUT  /api/settings  - admin only, updates allowed keys
 */

import { json } from '../utils.js';

// Every editable text on the public home page, so the whole page is
// admin-configurable - not just the hero. Grouped by the section they belong
// to. Kept in one list reused by both ALLOWED_KEYS (writable) and PUBLIC_KEYS
// (readable by anonymous visitors) so a new home text can never be forgotten
// in one place or the other.
const HOME_CONTENT_KEYS = [
  // Hero
  'hero_image_url', 'hero_image_r2_key',
  'hero_eyebrow', 'hero_title', 'hero_subtitle', 'hero_badge',
  'hero_cta_primary', 'hero_cta_secondary',
  // Hero stats (the 3 counters' labels)
  'stat_voyages_label', 'stat_dest_label', 'stat_maroc_label',
  // "Nos derniers voyages" section
  'recent_eyebrow', 'recent_title', 'recent_subtitle',
  // "Le mot des Potet" section
  'about_eyebrow', 'about_text',
  // "Nos coins du monde" (destinations) section
  'dest_eyebrow', 'dest_title', 'dest_subtitle',
  // Newsletter section
  'sub_title', 'sub_subtitle',
  // Install-app section
  'install_title', 'install_text',
  // Closing quote
  'site_tagline', 'tagline_author',
];

const ALLOWED_KEYS = [
  ...HOME_CONTENT_KEYS,
  'comment_gate_question', 'comment_gate_answer',
  'admin_display_name',
  'easter_egg_word',
  'contact_email',
];

// Allow-list of keys safe to expose to anonymous visitors. Anything NOT listed
// here (Mailjet API keys/secret, sender address, the spam-gate answer, and any
// future secret added to site_settings) is stripped from the public response -
// a deny-list would silently leak a newly-added secret if we forgot to list it.
const PUBLIC_KEYS = new Set([
  ...HOME_CONTENT_KEYS,
  'comment_gate_question',
  'admin_display_name',
  // Public because the client-side keydown listener (see NAV's script in
  // shell.js) needs the current trigger word to know what to match against -
  // it's a fun easter egg, not a secret, so exposing it is fine.
  'easter_egg_word',
  // Public because it's displayed as a mailto: link in the footer and the
  // "créer mon carnet" showcase page - it's meant to be found, not hidden.
  'contact_email',
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
