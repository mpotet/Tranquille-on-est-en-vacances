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
// Strip French accents so a search for "egypte" matches "Égypte". Applied to
// both the query term (in JS) and the DB columns (via nested REPLACE below).
function deaccent(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
// SQL fragment that lowercases + de-accents a column, so LIKE is accent- and
// case-insensitive. SQLite's LOWER only handles ASCII, but de-accenting first
// reduces the accented letters to their ASCII base, so LOWER then suffices.
function sqlNorm(col) {
  let e = col;
  for (const [a, b] of [['à','a'],['â','a'],['ä','a'],['á','a'],['ã','a'],['é','e'],['è','e'],['ê','e'],['ë','e'],['î','i'],['ï','i'],['í','i'],['ô','o'],['ö','o'],['ó','o'],['õ','o'],['ù','u'],['û','u'],['ü','u'],['ú','u'],['ç','c'],['ñ','n']]) {
    e = `REPLACE(${e}, '${a}', '${b}')`;
  }
  return `LOWER(${e})`;
}

export async function listArticles(request, env, isAdmin) {
  const url = new URL(request.url);
  const statusParam = url.searchParams.get('status');   // 'published' | 'draft' | null (all for admin)
  const folderSlug  = url.searchParams.get('folder');
  const q           = (url.searchParams.get('q') || '').trim();
  // `|| fallback` catches NaN from a non-numeric ?page=abc / ?limit=xyz — an
  // unguarded parseInt('abc') is NaN, and NaN in LIMIT/OFFSET makes the D1 bind
  // throw (500). The clamps also stop ?limit=-5 (SQLite reads a negative LIMIT
  // as "unlimited", which would silently dump the whole table).
  const page        = Math.max(1, parseInt(url.searchParams.get('page')  || '1', 10) || 1);
  const limit       = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10) || 20));
  const offset      = (page - 1) * limit;

  // Whitelisted sort options only — never interpolate the raw query param
  // into ORDER BY (SQL injection). Default: most recent trip first, everywhere.
  // Sorts by start_date, not the legacy `date` column — `date` was meant to
  // mirror start_date but has drifted out of sync on many existing rows
  // (bulk-import artifact), which silently broke "most recent first".
  const SORT_OPTIONS = {
    date_desc:  'a.start_date DESC, a.created_at DESC',
    date_asc:   'a.start_date ASC, a.created_at ASC',
    views_desc: 'a.view_count DESC, a.start_date DESC',
    title_asc:  'a.title COLLATE NOCASE ASC',
  };
  const sortKey   = url.searchParams.get('sort');
  const orderBy   = SORT_OPTIONS[sortKey] || SORT_OPTIONS.date_desc;

  let whereClauses = [];
  const bindings   = [];

  // Public visitors only see published articles
  if (!isAdmin) {
    whereClauses.push("a.status = 'published'");
  } else if (statusParam) {
    whereClauses.push('a.status = ?');
    bindings.push(statusParam);
  }

  // Free-text search across title, destination and short description
  // (not the full content - keeps it fast and results relevant to headings).
  if (q) {
    const term = `%${deaccent(q).toLowerCase()}%`;
    whereClauses.push(`(${sqlNorm('a.title')} LIKE ? OR ${sqlNorm('a.destination')} LIKE ? OR ${sqlNorm('a.short_description')} LIKE ?)`);
    bindings.push(term, term, term);
  }

  // Filter by folder (all articles in the folder tree). An unknown/stale
  // slug must force zero results, not silently drop the filter - otherwise
  // /voyages?folder=deleted-slug would return ALL published articles instead
  // of an empty state.
  if (folderSlug) {
    const folder = await env.DB
      .prepare('SELECT id FROM folders WHERE slug = ?')
      .bind(folderSlug)
      .first();
    if (folder) {
      // Coerce to integers before interpolating — these come from folders.id
      // (INTEGER PK) so they're already numeric, but forcing it here keeps this
      // the only non-bound value in the query provably injection-proof.
      const ids = (await getAllFolderIds(env, folder.id)).map(Number).filter(Number.isInteger);
      whereClauses.push(ids.length ? `a.folder_id IN (${ids.join(',')})` : '0 = 1');
    } else {
      whereClauses.push('0 = 1');
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
      ORDER BY ${orderBy}
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

  const status = ['published', 'draft', 'publish_when_online'].includes(body.status) ? body.status : 'archived';
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

  const newStatus = body.status && ['published','archived','draft','publish_when_online'].includes(body.status)
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

  // A plain published/archived toggle only makes sense between those two
  // states. An article deliberately left as 'draft' or 'publish_when_online'
  // should not be silently force-published by this quick toggle - that would
  // discard the admin's explicit "not ready yet" / "wait for connectivity"
  // choice. Those statuses must be changed via the editor's status selector.
  const newStatus = article.status === 'published' ? 'archived'
    : (article.status === 'archived' ? 'published' : article.status);
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
  const slug = text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  // A purely-numeric slug (title "2024", "48"...) collides with the id-based
  // lookup: every route does `/^\d+$/.test(slug) ? id=? : slug=?`, so a numeric
  // slug would be searched as an id and the article becomes unreachable.
  // Prefix it so the slug is never all-digits. Empty slugs (title with no latin
  // chars, e.g. all emoji) also fall back to a stable non-empty value.
  if (!slug || /^\d+$/.test(slug)) return `voyage-${slug || Date.now()}`;
  return slug;
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

/**
 * Return the flat list of all folder IDs in the subtree rooted at folderId.
 * `seen` guards against a parent/child cycle in the folders table (which would
 * otherwise recurse forever and blow the stack → 500 on every /voyages request
 * filtered by that folder).
 */
async function getAllFolderIds(env, folderId, seen = new Set()) {
  if (seen.has(folderId)) return [];
  seen.add(folderId);
  const ids = [folderId];
  const { results } = await env.DB
    .prepare('SELECT id FROM folders WHERE parent_id = ?')
    .bind(folderId)
    .all();
  for (const row of results || []) {
    ids.push(...await getAllFolderIds(env, row.id, seen));
  }
  return ids;
}

// Known bot/crawler/preview-fetcher signatures. Search engine crawlers, SEO
// tools, uptime monitors and social-media link-preview fetchers can execute
// enough of a page to trigger the client-side view ping (some run headless
// Chrome), so User-Agent sniffing on this endpoint is the only practical
// server-side filter available without adding friction (CAPTCHA, etc.) for
// real visitors. Not exhaustive, but covers the large majority of automated
// traffic that would otherwise inflate "vues".
const BOT_UA_RE = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|discordbot|slackbot|embedly|quora link preview|pinterest|semrush|ahrefs|mj12bot|dotbot|petalbot|yandex|baiduspider|headlesschrome|phantomjs|lighthouse|pagespeed|uptimerobot|pingdom|gtmetrix/i;

function isBotUserAgent(request) {
  const ua = request?.headers?.get('User-Agent') || '';
  return !ua || BOT_UA_RE.test(ua);
}

/**
 * Log one visit into page_views for the analytics dashboard. Never stores an
 * IP — city/region/country come straight from Cloudflare's edge geolocation
 * (request.cf), already resolved server-side. Best-effort: a logging failure
 * must never break the page/view-count response it's attached to.
 */
async function logPageView(env, request, { articleId = null, path }) {
  try {
    const cf = request?.cf || {};
    let referrerHost = null;
    const ref = request?.headers?.get('Referer');
    if (ref) { try { referrerHost = new URL(ref).hostname || null; } catch {} }
    await env.DB
      .prepare('INSERT INTO page_views (article_id, path, country_code, region, city, referrer_host) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(articleId, path, cf.country || null, cf.region || null, cf.city || null, referrerHost)
      .run();
  } catch { /* analytics must never break the request it's attached to */ }
}

// ──────────────────────────────────────────────────────────────
// Record a view for an article
// ──────────────────────────────────────────────────────────────
export async function recordView(env, slugOrId, request, authed = false) {
  const isNumericId = /^\d+$/.test(String(slugOrId));
  const article = await env.DB
    .prepare(`SELECT id, slug, view_count FROM articles WHERE ${isNumericId ? 'id = ?' : 'slug = ?'}`)
    .bind(isNumericId ? parseInt(slugOrId) : slugOrId)
    .first();

  if (!article) return notFound('Article not found');

  // Don't count bots/crawlers/link-preview fetchers as real readers - still
  // return the current count so the client's fetch resolves normally.
  if (isBotUserAgent(request)) {
    return json({ views: article.view_count });
  }

  await env.DB
    .prepare('UPDATE articles SET view_count = view_count + 1 WHERE id = ?')
    .bind(article.id)
    .run();

  // Only log the detailed analytics event for real (non-admin) visitors — the
  // dashboard is meant to show who's reading the blog, not the admin's own
  // browsing while managing it. view_count above still increments either way
  // (unchanged prior behaviour), this only affects the page_views history.
  if (!authed) {
    await logPageView(env, request, { articleId: article.id, path: '/voyage/' + article.slug });
  }

  // We already know the pre-increment count and just added 1 — return that
  // directly instead of a second SELECT that could race with a concurrent
  // delete (returning null → `updated.view_count` TypeError → 500).
  return json({ views: article.view_count + 1 });
}

export { logPageView, isBotUserAgent };
