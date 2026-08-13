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
import { sendNewCommentEmail, sendCommentReplyEmail } from '../admin-email.js';
import { sendWebPush } from '../vapid.js';

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
    .prepare('SELECT id, parent_id, is_admin_reply, author_name, body, created_at FROM comments WHERE article_id = ? ORDER BY created_at ASC, id ASC')
    .bind(articleId)
    .all();

  return json({ comments: nestComments(results || []) });
}

/** Turn a flat, chronologically-sorted list into roots with a `replies` array. */
function nestComments(flat) {
  const byId = new Map(flat.map(c => [c.id, { ...c, replies: [] }]));
  const roots = [];
  for (const c of byId.values()) {
    if (c.parent_id && byId.has(c.parent_id)) {
      byId.get(c.parent_id).replies.push(c);
    } else {
      roots.push(c);
    }
  }
  return roots;
}

// ──────────────────────────────────────────────────────────────
// Submit a comment (gated by the secret question)
// ──────────────────────────────────────────────────────────────
export async function createComment(request, env, slugOrId, isAdmin, ctx) {
  const articleId = await resolveArticleId(env, slugOrId, isAdmin);
  if (articleId == null) return notFound('Article not found');

  // The gate answer is a single shared word (family trivia, not a real
  // secret) - with no throttle it could be brute-forced in seconds, and once
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
  // Both optional: the reader only supplies them if they want to hear about
  // replies. An address is never returned publicly (see listComments' SELECT).
  const authorEmail = String(body.author_email ?? '').trim().slice(0, 254);
  const pushEndpoint = String(body.push_endpoint ?? '').trim().slice(0, 500);

  if (!authorName) return badRequest('Merci d\'indiquer votre nom.');
  if (!commentBody) return badRequest('Votre commentaire est vide.');
  if (authorName.length > MAX_AUTHOR_LEN) return badRequest('Le nom est trop long.');
  if (commentBody.length > MAX_BODY_LEN) return badRequest(`Le commentaire dépasse ${MAX_BODY_LEN} caractères.`);

  // Optional: reply to an existing comment on the same article. Flatten to
  // one level deep - replying to a reply re-parents onto its root, so the
  // thread never grows past root → replies.
  let parentId = null;
  if (body.parent_id != null) {
    // Coerce to an integer up front: a non-scalar parent_id (object/array) or a
    // non-numeric string bound into the query would make D1 throw → 500 on a
    // public endpoint. Reject it as a clean 400 instead.
    const pid = parseInt(body.parent_id, 10);
    if (!Number.isInteger(pid)) return badRequest('Commentaire parent invalide.');
    const parent = await env.DB
      .prepare('SELECT id, article_id, parent_id FROM comments WHERE id = ?')
      .bind(pid)
      .first();
    if (!parent || parent.article_id !== articleId) return badRequest('Commentaire parent introuvable.');
    parentId = parent.parent_id || parent.id;
  }

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

  const result = await env.DB
    .prepare('INSERT INTO comments (article_id, parent_id, author_name, author_email, push_endpoint, body) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(articleId, parentId, authorName, authorEmail || null, pushEndpoint || null, commentBody)
    .run();

  // Count this against the post quota only once it actually succeeded, so a
  // failed INSERT (e.g. constraint error) doesn't burn one of the 5 slots.
  await recordFailedAttempt(env.DB, 'comment_post', ip);

  const comment = await env.DB
    .prepare('SELECT id, parent_id, is_admin_reply, author_name, body, created_at FROM comments WHERE id = ?')
    .bind(result.meta.last_row_id)
    .first();

  // Notifications run in the background: a reader must never wait on Mailjet
  // or a push endpoint to see their own comment appear.
  if (ctx) ctx.waitUntil(notifyAboutComment(env, { articleId, parentId, authorName, body: commentBody, isAdmin }));

  return json({ comment }, 201);
}

/**
 * Fan-out for a freshly posted comment:
 *   - always email the admin (comments appear on the site immediately, so
 *     without this the only way to notice one is to browse the article)
 *   - if it is a reply, also notify the parent's author by email and/or push,
 *     through whichever channels they opted into on the form
 * Every step is isolated: one failing channel must not stop the others, and
 * none of them can fail the comment itself.
 */
export async function notifyAboutComment(env, { articleId, parentId, authorName, body, isAdmin }) {
  try {
    const article = await env.DB
      .prepare('SELECT id, title, slug FROM articles WHERE id = ?')
      .bind(articleId)
      .first();
    if (!article) return;

    // ── Admin ──────────────────────────────────────────────────────────────
    // Skipped when the admin is the author: no point emailing yourself.
    if (!isAdmin) {
      try {
        const admin = await env.DB.prepare('SELECT email FROM admin_account WHERE id = 1').first();
        if (admin?.email) {
          await sendNewCommentEmail(env, admin.email, {
            articleTitle: article.title,
            articleSlug: article.slug,
            authorName,
            body,
            isReply: !!parentId,
          });
        }
      } catch (err) {
        console.error('[Comments] Notification admin echouee:', err?.message || err);
      }
    }

    // ── Author of the comment being replied to ─────────────────────────────
    if (!parentId) return;
    const parent = await env.DB
      .prepare('SELECT author_name, author_email, push_endpoint FROM comments WHERE id = ?')
      .bind(parentId)
      .first();
    if (!parent) return;

    if (parent.author_email) {
      try {
        await sendCommentReplyEmail(env, parent.author_email, {
          articleTitle: article.title,
          articleSlug: article.slug,
          authorName,
          body,
        });
      } catch (err) {
        console.error('[Comments] Email de reponse echoue:', err?.message || err);
      }
    }

    if (parent.push_endpoint && env.VAPID_PRIVATE_KEY && env.VAPID_PUBLIC_KEY) {
      try {
        const sub = await env.DB
          .prepare('SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE endpoint = ?')
          .bind(parent.push_endpoint)
          .first();
        if (sub) {
          const icon = `${(env.PUBLIC_URL || '').replace(/[/]+$/, '')}/icon-192.png`;
          const payload = JSON.stringify({
            title: 'On a repondu a votre commentaire',
            body: `${authorName} : ${body.slice(0, 120)}`,
            icon,
            badge: icon,
            url: `/voyage/${article.slug}#comments`,
            tag: `comment-reply-${parentId}`,
            renotify: true,
          });
          const res = await sendWebPush(sub, payload, env);
          // A dead endpoint is cleaned up here as well as in notifications.js,
          // otherwise it would be retried on every future reply.
          if (res && (res.status === 410 || res.status === 404)) {
            await env.DB.prepare('DELETE FROM push_subscriptions WHERE id = ?').bind(sub.id).run().catch(() => {});
            await env.DB.prepare('UPDATE comments SET push_endpoint = NULL WHERE push_endpoint = ?').bind(parent.push_endpoint).run().catch(() => {});
          }
        }
      } catch (err) {
        console.error('[Comments] Push de reponse echoue:', err?.message || err);
      }
    }
  } catch (err) {
    console.error('[Comments] Notifications echouees:', err?.message || err);
  }
}

// ──────────────────────────────────────────────────────────────
// Delete a comment (admin only)
// ──────────────────────────────────────────────────────────────
export async function deleteComment(env, id) {
  const comment = await env.DB.prepare('SELECT id FROM comments WHERE id = ?').bind(id).first();
  if (!comment) return notFound('Comment not found');
  // D1 doesn't enforce the parent_id FK's ON DELETE CASCADE, so replies must
  // be removed explicitly or they'd be orphaned (still visible, pointing at
  // a deleted parent_id).
  await env.DB.prepare('DELETE FROM comments WHERE id = ? OR parent_id = ?').bind(id, id).run();
  return json({ success: true });
}

// ──────────────────────────────────────────────────────────────
// Admin: list recent comments across the site
// ──────────────────────────────────────────────────────────────
export async function listRecentCommentsAdmin(env, limit = 20) {
  const { results } = await env.DB
    .prepare(`SELECT c.id, c.article_id, c.parent_id, c.is_admin_reply, a.title AS article_title, a.slug AS article_slug, c.author_name, c.body, c.created_at
              FROM comments c JOIN articles a ON a.id = c.article_id
              ORDER BY c.created_at DESC LIMIT ?`)
    .bind(limit)
    .all();
  return json({ comments: results || [] });
}

// ──────────────────────────────────────────────────────────────
// Admin: reply to a comment (creates a threaded reply as admin)
// ──────────────────────────────────────────────────────────────
export async function replyToComment(request, env, commentId, ctx) {
  const orig = await env.DB.prepare('SELECT id, article_id, parent_id FROM comments WHERE id = ?').bind(commentId).first();
  if (!orig) return notFound('Comment not found');
  const body = await request.json().catch(() => null);
  if (!body || !body.body) return badRequest('Missing reply body');
  const replyText = String(body.body).trim();
  if (!replyText) return badRequest('Empty reply body');

  // Flatten to one level deep, same rule as public replies.
  const parentId = orig.parent_id || orig.id;

  // Admin display name stored in site_settings.admin_display_name (fallback)
  const row = await env.DB.prepare("SELECT value FROM site_settings WHERE key = 'admin_display_name'").first();
  const adminName = row?.value || 'Damien Potet';

  const res = await env.DB.prepare('INSERT INTO comments (article_id, parent_id, is_admin_reply, author_name, body) VALUES (?, ?, 1, ?, ?)')
    .bind(orig.article_id, parentId, adminName, replyText)
    .run();

  const comment = await env.DB.prepare('SELECT id, parent_id, is_admin_reply, author_name, body, created_at FROM comments WHERE id = ?')
    .bind(res.meta.last_row_id)
    .first();

  // Replying from the dashboard is the main way a reader gets an answer, so
  // this path has to notify them too - isAdmin skips the "new comment" email
  // back to yourself while still reaching the person you replied to.
  if (ctx) {
    ctx.waitUntil(notifyAboutComment(env, {
      articleId: orig.article_id,
      parentId,
      authorName: adminName,
      body: replyText,
      isAdmin: true,
    }));
  }

  return json({ comment, article_id: orig.article_id }, 201);
}
