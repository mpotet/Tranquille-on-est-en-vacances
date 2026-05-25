/**
 * worker/api/settings.js — Site-wide settings CRUD
 *
 * GET  /api/settings  — public, returns all settings as { key: value }
 * PUT  /api/settings  — admin only, updates allowed keys
 */

import { json } from '../utils.js';

const ALLOWED_KEYS = ['hero_image_url', 'hero_title', 'hero_subtitle', 'site_tagline'];

export async function getSettings(env) {
  const { results } = await env.DB.prepare(
    'SELECT key, value FROM site_settings'
  ).all();
  const settings = Object.fromEntries((results || []).map(r => [r.key, r.value]));
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
