/**
 * api/articles.js - CRUD endpoints for travel articles
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
import { notifySubscribers } from '../notifications.js';

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

  return json({ articles: results.map(normalizeArticle), total, page, limit, pages: Math.ceil(total / limit) });
}

// ──────────────────────────────────────────────────────────────
// Get single article (with photos)
// ──────────────────────────────────────────────────────────────
export async function getArticle(env, slugOrId, isAdmin) {
  const isNumericId = /^\d+$/.test(String(slugOrId));
  const article = await env.DB
    .prepare(`
      SELECT a.*, f.name AS folder_name, f.icon AS folder_icon, f.slug AS folder_slug
      FROM   articles a
      LEFT JOIN folders f ON f.id = a.folder_id
      WHERE  ${isNumericId ? 'a.id = ?' : 'a.slug = ?'}
    `)
    .bind(isNumericId ? parseInt(slugOrId) : slugOrId)
    .first();

  if (!article) return notFound('Article not found');
  if (article.status !== 'published' && !isAdmin) return notFound('Article not found');

  const { results: photos } = await env.DB
    .prepare('SELECT * FROM photos WHERE article_id = ? ORDER BY sort_order, id')
    .bind(article.id)
    .all();

  return json({ ...normalizeArticle(article), photos });
}

// ──────────────────────────────────────────────────────────────
// Create
// ──────────────────────────────────────────────────────────────
export async function createArticle(request, env, ctx) {
  const body = await request.json().catch(() => null);
  if (!body?.title) return badRequest('title is required');
  const { startDate, endDate, writingDays, error } = normalizeTripFields(body);
  if (error) return badRequest(error);

  const status = body.status === 'published' ? 'published' : 'archived';
  const slug   = await uniqueSlug(env, toSlug(body.title));

  const result = await env.DB
    .prepare(`
      INSERT INTO articles
        (title, slug, destination, date, start_date, end_date, writing_days, short_description, content, status, folder_id, cover_url, cover_r2_key)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      body.title,
      slug,
      body.destination         || '',
      startDate,
      startDate,
      endDate,
      JSON.stringify(writingDays),
      body.short_description   || '',
      body.content             || '',
      status,
      body.folder_id           || null,
      body.cover_url           || null,
      body.cover_r2_key        || null,
    )
    .run();

  const article = await env.DB
    .prepare('SELECT * FROM articles WHERE id = ?')
    .bind(result.meta.last_row_id)
    .first();

  // Notify subscribers if publishing (and notify flag not explicitly false)
  if (status === 'published' && body.notify !== false && ctx) {
    notifySubscribers(env, ctx, normalizeArticle(article), { isUpdate: false });
  }

  return json(normalizeArticle(article), 201);
}

// ──────────────────────────────────────────────────────────────
// Update
// ──────────────────────────────────────────────────────────────
export async function updateArticle(request, env, id, ctx) {
  const article = await env.DB.prepare('SELECT * FROM articles WHERE id = ?').bind(id).first();
  if (!article) return notFound('Article not found');

  const body = await request.json().catch(() => ({}));
  const merged = {
    ...article,
    ...body,
    start_date: body.start_date ?? article.start_date ?? article.date,
    end_date: body.end_date ?? article.end_date ?? article.date,
    writing_days: 'writing_days' in body ? body.writing_days : article.writing_days,
  };
  const { startDate, endDate, writingDays, error } = normalizeTripFields(merged);
  if (error) return badRequest(error);

  const newStatus = body.status && ['published','archived','draft'].includes(body.status)
    ? (body.status === 'draft' ? 'archived' : body.status)
    : article.status;

  await env.DB
    .prepare(`
      UPDATE articles
      SET title=?, destination=?, date=?, start_date=?, end_date=?, writing_days=?, short_description=?, content=?,
          status=?, folder_id=?, cover_url=?, cover_r2_key=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `)
    .bind(
      body.title             ?? article.title,
      body.destination       ?? article.destination,
      startDate,
      startDate,
      endDate,
      JSON.stringify(writingDays),
      body.short_description ?? article.short_description,
      body.content           ?? article.content,
      newStatus,
      'folder_id' in body ? (body.folder_id || null) : article.folder_id,
      body.cover_url         ?? article.cover_url,
      body.cover_r2_key      ?? article.cover_r2_key,
      id,
    )
    .run();

  const updated = await env.DB.prepare('SELECT * FROM articles WHERE id = ?').bind(id).first();

  // Notify subscribers when saving a published article (and notify flag not explicitly false)
  if (newStatus === 'published' && body.notify !== false && ctx) {
    const changes = [];
    if ('title' in body && body.title !== article.title) changes.push(`Titre : ${body.title}`);
    if ('destination' in body && body.destination !== article.destination) changes.push(`Destination : ${body.destination || '-'}`);
    if (('start_date' in body || 'end_date' in body) && (body.start_date !== article.start_date || body.end_date !== article.end_date)) changes.push('Dates modifiées');
    if ('content' in body && body.content !== article.content) changes.push('Contenu mis à jour');
    if ('cover_url' in body && body.cover_url !== article.cover_url) changes.push('Photo de couverture modifiée');
    notifySubscribers(env, ctx, normalizeArticle(updated), { isUpdate: true, changes });
  }

  return json(normalizeArticle(updated));
}

// ──────────────────────────────────────────────────────────────
// Toggle status (publish / unpublish)
// ──────────────────────────────────────────────────────────────
export async function patchArticleStatus(env, id, ctx) {
  const article = await env.DB.prepare('SELECT * FROM articles WHERE id = ?').bind(id).first();
  if (!article) return notFound('Article not found');

  const newStatus = article.status === 'published' ? 'archived' : 'published';
  await env.DB
    .prepare('UPDATE articles SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .bind(newStatus, id)
    .run();

  // Notify when publishing via the quick toggle (always notify - no checkbox here)
  if (newStatus === 'published' && ctx) {
    notifySubscribers(env, ctx, normalizeArticle({ ...article, status: newStatus }));
  }

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

function normalizeArticle(article) {
  if (!article) return article;
  const startDate = article.start_date || article.date || '';
  const endDate = article.end_date || article.date || '';
  return {
    ...article,
    start_date: startDate,
    end_date: endDate,
    date: startDate,
    writing_days: parseWritingDays(article.writing_days),
  };
}

function parseWritingDays(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeTripFields(source) {
  const startDate = (source.start_date || source.date || '').trim();
  const endDate = (source.end_date || source.date || '').trim();
  if (!startDate || !endDate) {
    return { error: 'start_date and end_date are required' };
  }
  if (endDate < startDate) {
    return { error: 'end_date must be after or equal to start_date' };
  }

  // writing_days is optional - keep existing if not provided, otherwise parse
  const rawWritingDays = parseWritingDays(source.writing_days);
  const writingDays = rawWritingDays
    .map(d => ({ date: (d?.date || '').trim(), summary: (d?.summary || '').trim() }))
    .filter(d => d.date && d.summary);

  return { startDate, endDate, writingDays };
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
