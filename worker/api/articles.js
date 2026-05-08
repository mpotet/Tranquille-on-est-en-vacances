/**
 * api/articles.js — CRUD endpoints for travel articles
 *
 * Routes:
 *   GET    /api/articles                → list articles (querystring: status, folder, page, limit)
 *   GET    /api/articles/:slug          → single article with its photos
 *   POST   /api/articles                → create article  [admin]
 *   PUT    /api/articles/:id            → update article  [admin]
 *   PATCH  /api/articles/:id/status     → toggle status   [admin]
 *   DELETE /api/articles/:id            → delete article  [admin]
 */

import { json, notFound, badRequest } from '../utils.js';

// ──────────────────────────────────────────────────────────────
// List
// ──────────────────────────────────────────────────────────────
export async function listArticles(request, env, isAdmin) {
  const url = new URL(request.url);
  const statusParam = url.searchParams.get('status');   // 'published' | 'draft' | null (all for admin)
  const folderSlug  = url.searchParams.get('folder');
  const page        = Math.max(1, parseInt(url.searchParams.get('page')  || '1'));
  const limit       = Math.min(50, parseInt(url.searchParams.get('limit') || '20'));
  const offset      = (page - 1) * limit;

  let whereClauses = [];
  const bindings   = [];

  // Public visitors only see published articles
  if (!isAdmin) {
    whereClauses.push("a.status = 'published'");
  } else if (statusParam) {
    whereClauses.push('a.status = ?');
    bindings.push(statusParam);
  }

  // Filter by folder (all articles in the folder tree)
  if (folderSlug) {
    const folder = await env.DB
      .prepare('SELECT id FROM folders WHERE slug = ?')
      .bind(folderSlug)
      .first();
    if (folder) {
      const ids = await getAllFolderIds(env, folder.id);
      whereClauses.push(`a.folder_id IN (${ids.join(',')})`);
    }
  }

  const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countRow = await env.DB
    .prepare(`SELECT COUNT(*) AS n FROM articles a ${where}`)
    .bind(...bindings)
    .first();
  const total = countRow?.n ?? 0;

  const { results } = await env.DB
    .prepare(`
      SELECT a.*, f.name AS folder_name, f.icon AS folder_icon, f.slug AS folder_slug
      FROM   articles a
      LEFT JOIN folders f ON f.id = a.folder_id
      ${where}
      ORDER BY a.date DESC, a.created_at DESC
      LIMIT ? OFFSET ?
    `)
    .bind(...bindings, limit, offset)
    .all();

  return json({ articles: results, total, page, limit, pages: Math.ceil(total / limit) });
}

// ──────────────────────────────────────────────────────────────
// Get single article (with photos)
// ──────────────────────────────────────────────────────────────
export async function getArticle(env, slug, isAdmin) {
  const article = await env.DB
    .prepare(`
      SELECT a.*, f.name AS folder_name, f.icon AS folder_icon, f.slug AS folder_slug
      FROM   articles a
      LEFT JOIN folders f ON f.id = a.folder_id
      WHERE  a.slug = ?
    `)
    .bind(slug)
    .first();

  if (!article) return notFound('Article not found');
  if (article.status !== 'published' && !isAdmin) return notFound('Article not found');

  const { results: photos } = await env.DB
    .prepare('SELECT * FROM photos WHERE article_id = ? ORDER BY sort_order, id')
    .bind(article.id)
    .all();

  return json({ ...article, photos });
}

// ──────────────────────────────────────────────────────────────
// Create
// ──────────────────────────────────────────────────────────────
export async function createArticle(request, env) {
  const body = await request.json().catch(() => null);
  if (!body?.title) return badRequest('title is required');

  const slug = await uniqueSlug(env, toSlug(body.title));

  const result = await env.DB
    .prepare(`
      INSERT INTO articles
        (title, slug, destination, date, short_description, content, status, folder_id, cover_url, cover_r2_key)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      body.title,
      slug,
      body.destination         || '',
      body.date                || new Date().toISOString().slice(0, 10),
      body.short_description   || '',
      body.content             || '',
      body.status === 'published' ? 'published' : 'draft',
      body.folder_id           || null,
      body.cover_url           || null,
      body.cover_r2_key        || null,
    )
    .run();

  const article = await env.DB
    .prepare('SELECT * FROM articles WHERE id = ?')
    .bind(result.meta.last_row_id)
    .first();

  return json(article, 201);
}

// ──────────────────────────────────────────────────────────────
// Update
// ──────────────────────────────────────────────────────────────
export async function updateArticle(request, env, id) {
  const article = await env.DB.prepare('SELECT * FROM articles WHERE id = ?').bind(id).first();
  if (!article) return notFound('Article not found');

  const body = await request.json().catch(() => ({}));

  await env.DB
    .prepare(`
      UPDATE articles
      SET title=?, destination=?, date=?, short_description=?, content=?,
          status=?, folder_id=?, cover_url=?, cover_r2_key=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `)
    .bind(
      body.title             ?? article.title,
      body.destination       ?? article.destination,
      body.date              ?? article.date,
      body.short_description ?? article.short_description,
      body.content           ?? article.content,
      body.status && ['published','draft'].includes(body.status) ? body.status : article.status,
      'folder_id' in body ? (body.folder_id || null) : article.folder_id,
      body.cover_url         ?? article.cover_url,
      body.cover_r2_key      ?? article.cover_r2_key,
      id,
    )
    .run();

  const updated = await env.DB.prepare('SELECT * FROM articles WHERE id = ?').bind(id).first();
  return json(updated);
}

// ──────────────────────────────────────────────────────────────
// Toggle status (publish / unpublish)
// ──────────────────────────────────────────────────────────────
export async function patchArticleStatus(env, id) {
  const article = await env.DB.prepare('SELECT id, status FROM articles WHERE id = ?').bind(id).first();
  if (!article) return notFound('Article not found');

  const newStatus = article.status === 'published' ? 'draft' : 'published';
  await env.DB
    .prepare('UPDATE articles SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .bind(newStatus, id)
    .run();

  return json({ id, status: newStatus });
}

// ──────────────────────────────────────────────────────────────
// Delete
// ──────────────────────────────────────────────────────────────
export async function deleteArticle(env, id) {
  const article = await env.DB.prepare('SELECT id FROM articles WHERE id = ?').bind(id).first();
  if (!article) return notFound('Article not found');
  // Photos are deleted by CASCADE; R2 objects are cleaned up separately (see photos.js)
  await env.DB.prepare('DELETE FROM articles WHERE id = ?').bind(id).run();
  return json({ success: true });
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────
function toSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

async function uniqueSlug(env, base) {
  let slug = base;
  let i = 0;
  while (true) {
    const row = await env.DB.prepare('SELECT id FROM articles WHERE slug = ?').bind(slug).first();
    if (!row) return slug;
    slug = `${base}-${++i}`;
  }
}

/** Return the flat list of all folder IDs in the subtree rooted at folderId. */
async function getAllFolderIds(env, folderId) {
  const ids = [folderId];
  const { results } = await env.DB
    .prepare('SELECT id FROM folders WHERE parent_id = ?')
    .bind(folderId)
    .all();
  for (const row of results) {
    const childIds = await getAllFolderIds(env, row.id);
    ids.push(...childIds);
  }
  return ids;
}
