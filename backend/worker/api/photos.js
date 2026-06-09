/**
 * api/photos.js - Photo upload / delete endpoints
 *
 * Routes:
 *   POST   /api/articles/:id/photos   → upload one or more photos to R2  [admin]
 *   DELETE /api/photos/:id            → delete a photo (R2 + DB)          [admin]
 *   PATCH  /api/photos/:id            → update caption / sort_order        [admin]
 *
 * Upload flow:
 *   1. Client sends a multipart/form-data POST with one or more "photo" fields.
 *   2. Worker converts each image to WebP via Canvas API (client-side) - or
 *      receives already-optimised WebP if the client supports it.
 *   3. Worker stores the raw bytes in R2 under keys like
 *      "photos/<year>/<articleId>/<uuid>.webp".
 *   4. Worker inserts a row in the photos table with the public URL.
 *
 * Note: actual in-worker image transcoding (e.g. via @cf/image-to-webp) requires
 * a Cloudflare AI binding.  For simplicity we accept whatever the client sends and
 * store it as-is.  The client-side demo already does client-side WebP conversion
 * via the Canvas API before uploading.
 */

import { json, notFound, badRequest } from '../utils.js';

// ──────────────────────────────────────────────────────────────
// Upload photo(s) for an article
// ──────────────────────────────────────────────────────────────
export async function uploadPhotos(request, env, articleId) {
  const article = await env.DB
    .prepare('SELECT id FROM articles WHERE id = ?')
    .bind(articleId)
    .first();
  if (!article) return notFound('Article not found');

  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return badRequest('Expected multipart/form-data');
  }

  const formData = await request.formData();
  const uploaded = [];

  // Count existing photos to set initial sort_order
  const countRow = await env.DB
    .prepare('SELECT COUNT(*) AS n FROM photos WHERE article_id = ?')
    .bind(articleId)
    .first();
  let sortOrder = (countRow?.n ?? 0);

  for (const [, file] of formData.entries()) {
    if (!(file instanceof File)) continue;

    const ext      = file.type.includes('webp') ? 'webp'
                   : file.type.includes('png')  ? 'png'
                   : 'jpg';
    const uuid     = crypto.randomUUID();
    const year     = new Date().getFullYear();
    const r2Key    = `photos/${year}/${articleId}/${uuid}.${ext}`;

    const arrayBuf = await file.arrayBuffer();
    await env.PHOTOS.put(r2Key, arrayBuf, {
      httpMetadata: { contentType: file.type },
    });

    // Build the public URL.  If the R2 bucket has a custom domain configured
    // via Cloudflare, replace PUBLIC_URL accordingly.
    const publicUrl = `${env.PUBLIC_URL}/r2/${r2Key}`;

    const result = await env.DB
      .prepare('INSERT INTO photos (article_id, r2_key, url, caption, sort_order) VALUES (?, ?, ?, ?, ?)')
      .bind(articleId, r2Key, publicUrl, file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '), sortOrder++)
      .run();

    uploaded.push({
      id:         result.meta.last_row_id,
      r2_key:     r2Key,
      url:        publicUrl,
      caption:    '',
      sort_order: sortOrder - 1,
    });
  }

  return json({ uploaded });
}

// ──────────────────────────────────────────────────────────────
// Delete a photo
// ──────────────────────────────────────────────────────────────
export async function deletePhoto(env, photoId) {
  const photo = await env.DB
    .prepare('SELECT * FROM photos WHERE id = ?')
    .bind(photoId)
    .first();
  if (!photo) return notFound('Photo not found');

  // Remove from R2
  await env.PHOTOS.delete(photo.r2_key).catch(() => {});

  // Remove from DB
  await env.DB.prepare('DELETE FROM photos WHERE id = ?').bind(photoId).run();

  return json({ success: true });
}

// ──────────────────────────────────────────────────────────────
// Update photo metadata (caption, sort_order)
// ──────────────────────────────────────────────────────────────
export async function patchPhoto(request, env, photoId) {
  const photo = await env.DB
    .prepare('SELECT * FROM photos WHERE id = ?')
    .bind(photoId)
    .first();
  if (!photo) return notFound('Photo not found');

  const body = await request.json().catch(() => ({}));
  const caption    = body.caption    ?? photo.caption;
  const sortOrder  = body.sort_order ?? photo.sort_order;

  await env.DB
    .prepare('UPDATE photos SET caption=?, sort_order=? WHERE id=?')
    .bind(caption, sortOrder, photoId)
    .run();

  const updated = await env.DB.prepare('SELECT * FROM photos WHERE id=?').bind(photoId).first();
  return json(updated);
}

// ──────────────────────────────────────────────────────────────
// Upload / replace cover photo for an article
// ──────────────────────────────────────────────────────────────
export async function uploadCover(request, env, articleId) {
  const article = await env.DB
    .prepare('SELECT id, cover_r2_key FROM articles WHERE id = ?')
    .bind(articleId)
    .first();
  if (!article) return notFound('Article not found');

  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.includes('multipart/form-data')) return badRequest('Expected multipart/form-data');

  const formData = await request.formData();
  const file = formData.get('cover');
  if (!file || !(file instanceof File)) return badRequest('No cover file');

  // Delete old cover from R2 if exists
  if (article.cover_r2_key) {
    await env.PHOTOS.delete(article.cover_r2_key).catch(() => {});
  }

  const ext   = file.type.includes('webp') ? 'webp' : file.type.includes('png') ? 'png' : 'jpg';
  const uuid  = crypto.randomUUID();
  const year  = new Date().getFullYear();
  const r2Key = `covers/${year}/${articleId}/${uuid}.${ext}`;

  await env.PHOTOS.put(r2Key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });

  const publicUrl = `${env.PUBLIC_URL}/r2/${r2Key}`;
  await env.DB
    .prepare('UPDATE articles SET cover_url=?, cover_r2_key=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .bind(publicUrl, r2Key, articleId)
    .run();

  return json({ url: publicUrl, r2_key: r2Key });
}

export async function uploadHeroImage(request, env) {
  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.includes('multipart/form-data')) return badRequest('Expected multipart/form-data');

  const formData = await request.formData();
  const file = formData.get('image');
  if (!file || !(file instanceof File)) return badRequest('No hero image file');

  const current = await env.DB.prepare('SELECT key, value FROM site_settings WHERE key IN (?, ?)')
    .bind('hero_image_url', 'hero_image_r2_key')
    .all();
  const currentSettings = Object.fromEntries((current.results || []).map(r => [r.key, r.value]));
  if (currentSettings.hero_image_r2_key) {
    await env.PHOTOS.delete(currentSettings.hero_image_r2_key).catch(() => {});
  }

  const ext = file.type.includes('webp') ? 'webp' : file.type.includes('png') ? 'png' : 'jpg';
  const uuid = crypto.randomUUID();
  const year = new Date().getFullYear();
  const r2Key = `hero/${year}/${uuid}.${ext}`;

  await env.PHOTOS.put(r2Key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  const publicUrl = `${env.PUBLIC_URL}/r2/${r2Key}`;

  const stmt = env.DB.prepare("INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))");
  await stmt.bind('hero_image_url', publicUrl).run();
  await stmt.bind('hero_image_r2_key', r2Key).run();

  return json({ url: publicUrl, r2_key: r2Key });
}

export async function deleteHeroImage(env) {
  const current = await env.DB.prepare('SELECT key, value FROM site_settings WHERE key IN (?, ?)')
    .bind('hero_image_url', 'hero_image_r2_key')
    .all();
  const currentSettings = Object.fromEntries((current.results || []).map(r => [r.key, r.value]));

  if (currentSettings.hero_image_r2_key) {
    await env.PHOTOS.delete(currentSettings.hero_image_r2_key).catch(() => {});
  }

  const stmt = env.DB.prepare("INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))");
  await stmt.bind('hero_image_url', '').run();
  await stmt.bind('hero_image_r2_key', '').run();

  return json({ success: true });
}

// ──────────────────────────────────────────────────────────────
// Serve an R2 object (proxied through the Worker)
// ──────────────────────────────────────────────────────────────
export async function serveR2Object(env, r2Key) {
  const object = await env.PHOTOS.get(r2Key);
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('ETag', object.httpEtag);

  return new Response(object.body, { headers });
}
