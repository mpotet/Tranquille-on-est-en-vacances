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
// Image type validation (magic bytes) — never trust the client-supplied
// File.type/filename for the stored R2 Content-Type. An attacker-controlled
// Content-Type (e.g. image/svg+xml or text/html) served back verbatim by
// serveR2Object() from the same origin would be a stored XSS vector, since
// SVG/HTML can embed executable <script>. Only a small allowlist of real
// raster image formats — verified by their leading bytes — is accepted.
// ──────────────────────────────────────────────────────────────
// HEIC/HEIF (ISOBMFF container) brand codes seen from real devices — iPhone's
// native Camera app shoots HEIC by default (unless the user opted into "Most
// Compatible" in Settings > Camera > Formats), so admins editing from a phone
// while travelling will very often be uploading this format.
const HEIF_BRANDS = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1'];

const IMAGE_SIGNATURES = [
  { ext: 'jpg',  contentType: 'image/jpeg', match: b => b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF },
  { ext: 'png',  contentType: 'image/png',  match: b => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47 },
  { ext: 'gif',  contentType: 'image/gif',  match: b => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 },
  {
    ext: 'webp', contentType: 'image/webp',
    match: b => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
                b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
  {
    ext: 'heic', contentType: 'image/heic',
    // ISOBMFF box layout: 4-byte size, then ASCII "ftyp", then a 4-byte brand.
    match: b => b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 &&
                HEIF_BRANDS.includes(String.fromCharCode(b[8], b[9], b[10], b[11])),
  },
];

/**
 * Identify a real, safe image format from the file's actual bytes.
 * @param {ArrayBuffer} buf
 * @returns {{ext: string, contentType: string}|null} null if not a recognised image.
 */
function detectImageType(buf) {
  const bytes = new Uint8Array(buf.slice(0, 12));
  for (const sig of IMAGE_SIGNATURES) {
    if (sig.match(bytes)) return { ext: sig.ext, contentType: sig.contentType };
  }
  return null;
}

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
  const rejected = []; // filenames that failed magic-byte validation — surfaced to the client instead of silently vanishing

  // Count existing photos to set initial sort_order
  const countRow = await env.DB
    .prepare('SELECT COUNT(*) AS n FROM photos WHERE article_id = ?')
    .bind(articleId)
    .first();
  let sortOrder = (countRow?.n ?? 0);

  for (const [, file] of formData.entries()) {
    if (!(file instanceof File)) continue;

    const arrayBuf = await file.arrayBuffer();
    const detected = detectImageType(arrayBuf);
    if (!detected) { rejected.push(file.name || 'fichier'); continue; }

    const uuid     = crypto.randomUUID();
    const year     = new Date().getFullYear();
    const r2Key    = `photos/${year}/${articleId}/${uuid}.${detected.ext}`;

    await env.PHOTOS.put(r2Key, arrayBuf, {
      httpMetadata: { contentType: detected.contentType },
    });

    // Build the public URL.  If the R2 bucket has a custom domain configured
    // via Cloudflare, replace PUBLIC_URL accordingly.
    // Store a ROOT-RELATIVE url (`/r2/<key>`), not an absolute one: it stays
    // valid regardless of the site's domain, and the browser resolves it
    // against the current origin. The worker serves /r2/* from the same origin.
    const publicUrl = `/r2/${r2Key}`;

    const result = await env.DB
      .prepare('INSERT INTO photos (article_id, r2_key, url, caption, sort_order) VALUES (?, ?, ?, ?, ?)')
      .bind(articleId, r2Key, publicUrl, file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '), sortOrder++)
      .run();

    uploaded.push({
      id:         result.meta.last_row_id,
      r2_key:     r2Key,
      url:        publicUrl,
      caption:    '',
      // The client submits multiple files per request and needs to map each
      // uploaded result back to its source File — array position alone isn't
      // reliable once some files are rejected, so echo back the original name.
      source_name: file.name || '',
      sort_order: sortOrder - 1,
    });
  }

  return json({ uploaded, rejected });
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

  const arrayBuf = await file.arrayBuffer();
  const detected = detectImageType(arrayBuf);
  if (!detected) return badRequest('Fichier image invalide.');

  // Only delete the old cover once the new file is confirmed valid — deleting
  // first would leave the article with no cover if validation failed below.
  if (article.cover_r2_key) {
    await env.PHOTOS.delete(article.cover_r2_key).catch(() => {});
  }

  const uuid  = crypto.randomUUID();
  const year  = new Date().getFullYear();
  const r2Key = `covers/${year}/${articleId}/${uuid}.${detected.ext}`;

  await env.PHOTOS.put(r2Key, arrayBuf, { httpMetadata: { contentType: detected.contentType } });

  const publicUrl = `/r2/${r2Key}`; // root-relative — domain-independent (see uploadPhotos)
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

  const arrayBuf = await file.arrayBuffer();
  const detected = detectImageType(arrayBuf);
  if (!detected) return badRequest('Fichier image invalide.');

  // Only delete the old hero image once the new file is confirmed valid —
  // deleting first would leave the site with no hero image if validation failed.
  if (currentSettings.hero_image_r2_key) {
    await env.PHOTOS.delete(currentSettings.hero_image_r2_key).catch(() => {});
  }

  const uuid = crypto.randomUUID();
  const year = new Date().getFullYear();
  const r2Key = `hero/${year}/${uuid}.${detected.ext}`;

  await env.PHOTOS.put(r2Key, arrayBuf, { httpMetadata: { contentType: detected.contentType } });
  const publicUrl = `/r2/${r2Key}`; // root-relative — domain-independent (see uploadPhotos)

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
  // Defense in depth: uploads are validated by magic bytes to a raster-image
  // allowlist at write time, but never let a browser "sniff" a served object
  // into executing as HTML/script regardless of what Content-Type is stored.
  headers.set('X-Content-Type-Options', 'nosniff');

  return new Response(object.body, { headers });
}
