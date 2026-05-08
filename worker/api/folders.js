/**
 * api/folders.js — CRUD endpoints for the folder hierarchy
 *
 * Routes (all under /api/folders):
 *   GET    /api/folders          → list all folders (nested tree)
 *   POST   /api/folders          → create a folder
 *   PUT    /api/folders/:id      → rename / re-parent a folder
 *   DELETE /api/folders/:id      → delete a folder
 */

import { json, notFound, badRequest } from '../utils.js';

// ──────────────────────────────────────────────────────────────
// List — returns a flat array; client builds the tree
// ──────────────────────────────────────────────────────────────
export async function listFolders(env) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM folders ORDER BY parent_id NULLS FIRST, sort_order, name',
  ).all();
  return json(results);
}

// ──────────────────────────────────────────────────────────────
// Create
// ──────────────────────────────────────────────────────────────
export async function createFolder(request, env) {
  const body = await request.json().catch(() => null);
  if (!body?.name) return badRequest('name is required');

  const slug = toSlug(body.name);

  // Check uniqueness
  const existing = await env.DB.prepare('SELECT id FROM folders WHERE slug = ?').bind(slug).first();
  if (existing) return badRequest(`A folder with slug "${slug}" already exists`);

  const result = await env.DB
    .prepare('INSERT INTO folders (name, slug, icon, parent_id, sort_order) VALUES (?, ?, ?, ?, ?)')
    .bind(body.name, slug, body.icon || '📁', body.parent_id || null, body.sort_order || 0)
    .run();

  const folder = await env.DB
    .prepare('SELECT * FROM folders WHERE id = ?')
    .bind(result.meta.last_row_id)
    .first();

  return json(folder, 201);
}

// ──────────────────────────────────────────────────────────────
// Update
// ──────────────────────────────────────────────────────────────
export async function updateFolder(request, env, id) {
  const folder = await env.DB.prepare('SELECT * FROM folders WHERE id = ?').bind(id).first();
  if (!folder) return notFound('Folder not found');

  const body = await request.json().catch(() => ({}));
  const name = body.name ?? folder.name;
  const slug = body.name ? toSlug(body.name) : folder.slug;
  const icon = body.icon ?? folder.icon;
  const parentId = 'parent_id' in body ? (body.parent_id || null) : folder.parent_id;
  const sortOrder = body.sort_order ?? folder.sort_order;

  await env.DB
    .prepare('UPDATE folders SET name=?, slug=?, icon=?, parent_id=?, sort_order=? WHERE id=?')
    .bind(name, slug, icon, parentId, sortOrder, id)
    .run();

  const updated = await env.DB.prepare('SELECT * FROM folders WHERE id = ?').bind(id).first();
  return json(updated);
}

// ──────────────────────────────────────────────────────────────
// Delete
// ──────────────────────────────────────────────────────────────
export async function deleteFolder(env, id) {
  const folder = await env.DB.prepare('SELECT id FROM folders WHERE id = ?').bind(id).first();
  if (!folder) return notFound('Folder not found');
  await env.DB.prepare('DELETE FROM folders WHERE id = ?').bind(id).run();
  return json({ success: true });
}

// ──────────────────────────────────────────────────────────────
// Helper
// ──────────────────────────────────────────────────────────────
function toSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}
