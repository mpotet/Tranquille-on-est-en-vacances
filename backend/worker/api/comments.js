/**
 * api/comments.js - Reader comments on articles (guestbook-style)
 *
 * Routes:
 *   GET    /api/articles/:id/comments   → list comments for an article (public)
 *   POST   /api/articles/:id/comments   → submit a comment (public, gated by secret question)
 *   DELETE /api/comments/:id            → delete a comment [admin]
 *
 * The spam gate is a single site-wide "secret question" stored in site_settings
 * (keys: comment_gate_question / comment_gate_answer). The answer is compared
 * case-insensitively and whitespace-trimmed. This is a low-stakes family blog
 * gate, not a security boundary, so the answer is stored as plain text.
 */

import { json, notFound, badRequest, forbidden } from '../utils.js';
import { checkRateLimit, recordFailedAttempt, clientKey } from '../rate-limit.js';

const MAX_AUTHOR_LEN = 80;
const MAX_BODY_LEN = 2000;
const DEFAULT_GATE_ANSWER = 'wifi';

/** Fetch the article id for a slug or numeric id, respecting visibility. */
async function resolveArticleId(env, slugOrId, isAdmin) {
  const isNumericId = /^\d+$/.test(String(slugOrId));
  const article = await env.DB
    .prepare(`SELECT id, status FROM articles WHERE ${isNumericId ? 'id = ?' : 'slug = ?'}`)
    .bind(isNumericId ? parseInt(slugOrId) : slugOrId)
    .first();
  if (!article) return null;
  if (article.status !== 'published' && !isAdmin) return null;
  return article.id;
}

// ──────────────────────────────────────────────────────────────
// List comments for an article
// ──────────────────────────────────────────────────────────────
export async function listComments(env, slugOrId, isAdmin) {
  const articleId = await resolveArticleId(env, slugOrId, isAdmin);
  if (articleId == null) return notFound('Article not found');

  const { results } = await env.DB
    .prepare('SELECT id, author_name, body, created_at FROM comments WHERE article_id = ? ORDER BY created_at ASC, id ASC')
    .bind(articleId)
    .all();

  return json({ comments: results || [] });
}

// ──────────────────────────────────────────────────────────────
// Submit a comment (gated by the secret question)
// ──────────────────────────────────────────────────────────────
export async function createComment(request, env, slugOrId, isAdmin) {
  const articleId = await resolveArticleId(env, slugOrId, isAdmin);
  if (articleId == null) return notFound('Article not found');

  // The gate answer is a single shared word (family trivia, not a real
  // secret) — with no throttle it could be brute-forced in seconds, and once
  // found, used to flood every article with spam comments. Block by IP
  // before even reading the submitted answer.
  const ip = clientKey(request);
  const limit = await checkRateLimit(env.DB, 'comment_gate', ip, { max: 6, windowMinutes: 10 });
  if (limit.blocked) {
    return forbidden(`Trop de tentatives. Réessayez dans ${Math.ceil(limit.retryAfterSeconds / 60)} min.`);
  }

  const body = await request.json().catch(() => null);
  if (!body) return badRequest('Invalid request body');

  const authorName = String(body.author_name ?? '').trim();
  const commentBody = String(body.body ?? '').trim();
  const gateAnswer = String(body.gate_answer ?? '').trim().toLowerCase();

  if (!authorName) return badRequest('Merci d\'indiquer votre nom.');
  if (!commentBody) return badRequest('Votre commentaire est vide.');
  if (authorName.length > MAX_AUTHOR_LEN) return badRequest('Le nom est trop long.');
  if (commentBody.length > MAX_BODY_LEN) return badRequest(`Le commentaire dépasse ${MAX_BODY_LEN} caractères.`);

  // Validate the gate answer server-side (never trust the client).
  const setting = await env.DB
    .prepare("SELECT value FROM site_settings WHERE key = 'comment_gate_answer'")
    .first();
  const expected = String(setting?.value ?? DEFAULT_GATE_ANSWER).trim().toLowerCase();
  if (!gateAnswer || gateAnswer !== expected) {
    await recordFailedAttempt(env.DB, 'comment_gate', ip);
    return forbidden('Mauvaise réponse à la question. Réessayez.');
  }

  // The gate above only throttles WRONG guesses - once the (single, shared)
  // answer is known, nothing stopped unlimited comment submissions. Throttle
  // successful submissions too, separately from gate attempts.
  const postLimit = await checkRateLimit(env.DB, 'comment_post', ip, { max: 5, windowMinutes: 10 });
  if (postLimit.blocked) {
    return forbidden(`Trop de commentaires envoyés récemment. Réessayez dans ${Math.ceil(postLimit.retryAfterSeconds / 60)} min.`);
  }
  await recordFailedAttempt(env.DB, 'comment_post', ip);

  const result = await env.DB
    .prepare('INSERT INTO comments (article_id, author_name, body) VALUES (?, ?, ?)')
    .bind(articleId, authorName, commentBody)
    .run();

  const comment = await env.DB
    .prepare('SELECT id, author_name, body, created_at FROM comments WHERE id = ?')
    .bind(result.meta.last_row_id)
    .first();

  return json({ comment }, 201);
}

// ──────────────────────────────────────────────────────────────
// Delete a comment (admin only)
// ──────────────────────────────────────────────────────────────
export async function deleteComment(env, id) {
  const comment = await env.DB.prepare('SELECT id FROM comments WHERE id = ?').bind(id).first();
  if (!comment) return notFound('Comment not found');
  await env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(id).run();
  return json({ success: true });
}

// ──────────────────────────────────────────────────────────────
// Admin: list recent comments across the site
// ──────────────────────────────────────────────────────────────
export async function listRecentCommentsAdmin(env, limit = 20) {
  const { results } = await env.DB
    .prepare(`SELECT c.id, c.article_id, a.title AS article_title, c.author_name, c.body, c.created_at
              FROM comments c JOIN articles a ON a.id = c.article_id
              ORDER BY c.created_at DESC LIMIT ?`)
    .bind(limit)
    .all();
  return json({ comments: results || [] });
}

// ──────────────────────────────────────────────────────────────
// Admin: reply to a comment (creates a new comment as admin)
// ──────────────────────────────────────────────────────────────
export async function replyToComment(request, env, commentId) {
  const orig = await env.DB.prepare('SELECT id, article_id FROM comments WHERE id = ?').bind(commentId).first();
  if (!orig) return notFound('Comment not found');
  const body = await request.json().catch(() => null);
  if (!body || !body.body) return badRequest('Missing reply body');
  const replyText = String(body.body).trim();
  if (!replyText) return badRequest('Empty reply body');

  // Admin display name stored in site_settings.admin_display_name (fallback)
  const row = await env.DB.prepare("SELECT value FROM site_settings WHERE key = 'admin_display_name'").first();
  const adminName = row?.value || 'Damien Potet';

  const res = await env.DB.prepare('INSERT INTO comments (article_id, author_name, body) VALUES (?, ?, ?)')
    .bind(orig.article_id, adminName, replyText)
    .run();

  const comment = await env.DB.prepare('SELECT id, author_name, body, created_at FROM comments WHERE id = ?')
    .bind(res.meta.last_row_id)
    .first();
  return json({ comment }, 201);
}
