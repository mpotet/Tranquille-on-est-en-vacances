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
import { parseDays, dayLabel, dayAnchor } from '../helpers/days.js';

// ── Commentaires sur une journee (articles jour par jour) ──────────────────
// La colonne comments.day arrive par la migration 012. Tant qu'elle n'existe
// pas (code deploye avant la migration), tout fonctionne comme avant : les
// commentaires sont simplement tous "sur l'article". Detection mise en cache,
// reverifiee au plus une fois par minute pour prendre la migration en compte.
let _dayColumn = null, _dayColumnCheckedAt = 0;
export async function commentDayColumn(env) {
  if (_dayColumn === true) return true;
  if (_dayColumn === false && Date.now() - _dayColumnCheckedAt < 60000) return false;
  try {
    const { results } = await env.DB.prepare('PRAGMA table_info(comments)').all();
    _dayColumn = (results || []).some(c => c.name === 'day');
  } catch { _dayColumn = false; }
  _dayColumnCheckedAt = Date.now();
  return _dayColumn;
}
/** Colonnes publiques d'un commentaire, `day` compris quand elle existe. */
export async function commentColumns(env, prefix = '') {
  const base = ['id', 'parent_id', 'is_admin_reply', 'author_name', 'body', 'created_at'];
  if (await commentDayColumn(env)) base.push('day');
  return base.map(c => prefix + c).join(', ');
}
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

// Libelle et ancre du jour d'un commentaire, pour les e-mails ("sur le Jour 3
// · dim. 8 fevr.", lien direct vers ce jour). null si commentaire general ou
// jour disparu de l'article.
async function dayContext(env, articleId, day) {
  if (!day) return null;
  const art = await env.DB.prepare('SELECT content, start_date FROM articles WHERE id = ?').bind(articleId).first();
  const days = parseDays(art?.content);
  const i = days.findIndex(d => d.date === day);
  if (i === -1) return null;
  return { label: dayLabel(days[i], art.start_date, i), anchor: dayAnchor(day, i) };
}

// ── Cloudflare Turnstile (anti-robot des commentaires) ─────────────────────
// Actif seulement si TURNSTILE_SITE_KEY (var) ET TURNSTILE_SECRET (secret)
// sont definis ; sinon la question secrete reste en place, inchangee.
export function turnstileEnabled(env) {
  return !!(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET);
}

const TURNSTILE_ACTION = 'comment';

// Noms d'hote autorises pour le formulaire : TURNSTILE_HOSTNAMES (liste
// separee par des virgules), a defaut celui de PUBLIC_URL.
function turnstileHostnames(env) {
  const list = String(env.TURNSTILE_HOSTNAMES || '').split(',').map(h => h.trim()).filter(Boolean);
  if (list.length) return new Set(list);
  try { return new Set([new URL(env.PUBLIC_URL).hostname]); } catch { return new Set(); }
}

export async function verifyTurnstile(env, token, request) {
  const hostnames = turnstileHostnames(env);
  if (typeof token !== 'string' || !token || token.length > 2048 || hostnames.size === 0) return false;
  let result;
  try {
    const form = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token });
    const ip = request.headers.get('CF-Connecting-IP');
    if (ip) form.set('remoteip', ip);
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return false;
    result = await r.json();
  } catch {
    return false; // reseau, delai, reponse illisible : on refuse
  }
  if (!result || result.success !== true) return false;
  // Les cles de test officielles (developpement local uniquement) renvoient
  // toujours hostname "example.com" et aucune action : seul ce marqueur,
  // impossible a obtenir avec une vraie cle, les fait accepter.
  if (result.metadata && result.metadata.result_with_testing_key === true) return true;
  return result.action === TURNSTILE_ACTION && hostnames.has(result.hostname);
}

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
    .prepare(`SELECT ${await commentColumns(env)} FROM comments WHERE article_id = ? ORDER BY created_at ASC, id ASC`)
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
  const hasDay = await commentDayColumn(env);
  let parentId = null;
  let day = null;
  if (body.parent_id != null) {
    // Coerce to an integer up front: a non-scalar parent_id (object/array) or a
    // non-numeric string bound into the query would make D1 throw → 500 on a
    // public endpoint. Reject it as a clean 400 instead.
    const pid = parseInt(body.parent_id, 10);
    if (!Number.isInteger(pid)) return badRequest('Commentaire parent invalide.');
    const parent = await env.DB
      .prepare(`SELECT id, article_id, parent_id${hasDay ? ', day' : ''} FROM comments WHERE id = ?`)
      .bind(pid)
      .first();
    if (!parent || parent.article_id !== articleId) return badRequest('Commentaire parent introuvable.');
    parentId = parent.parent_id || parent.id;
    // Une reponse reste dans la journee du commentaire auquel elle repond.
    day = parent.day || null;
  } else if (hasDay && body.day != null && body.day !== '') {
    // Commentaire sur une journee : elle doit exister dans l'article.
    const wanted = String(body.day);
    if (!DAY_RE.test(wanted)) return badRequest('Journée invalide.');
    const art = await env.DB.prepare('SELECT content FROM articles WHERE id = ?').bind(articleId).first();
    if (!parseDays(art?.content).some(d => d.date === wanted)) return badRequest('Cette journée n\'existe pas dans le récit.');
    day = wanted;
  }

  if (turnstileEnabled(env)) {
    // Cloudflare Turnstile remplace la question secrete des que ses deux
    // cles sont configurees. Verifie cote serveur, jamais dans le navigateur.
    const passed = await verifyTurnstile(env, body.turnstile_token, request);
    if (!passed) {
      await recordFailedAttempt(env.DB, 'comment_gate', ip);
      return forbidden('La vérification anti-robot a échoué. Réessayez.');
    }
  } else {
    // Validate the gate answer server-side (never trust the client).
    const setting = await env.DB
      .prepare("SELECT value FROM site_settings WHERE key = 'comment_gate_answer'")
      .first();
    const expected = String(setting?.value ?? DEFAULT_GATE_ANSWER).trim().toLowerCase();
    if (!gateAnswer || gateAnswer !== expected) {
      await recordFailedAttempt(env.DB, 'comment_gate', ip);
      return forbidden('Mauvaise réponse à la question. Réessayez.');
    }
  }

  // The gate above only throttles WRONG guesses - once the (single, shared)
  // answer is known, nothing stopped unlimited comment submissions. Throttle
  // successful submissions too, separately from gate attempts.
  const postLimit = await checkRateLimit(env.DB, 'comment_post', ip, { max: 5, windowMinutes: 10 });
  if (postLimit.blocked) {
    return forbidden(`Trop de commentaires envoyés récemment. Réessayez dans ${Math.ceil(postLimit.retryAfterSeconds / 60)} min.`);
  }

  const result = hasDay
    ? await env.DB
      .prepare('INSERT INTO comments (article_id, parent_id, author_name, author_email, push_endpoint, body, day) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(articleId, parentId, authorName, authorEmail || null, pushEndpoint || null, commentBody, day)
      .run()
    : await env.DB
      .prepare('INSERT INTO comments (article_id, parent_id, author_name, author_email, push_endpoint, body) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(articleId, parentId, authorName, authorEmail || null, pushEndpoint || null, commentBody)
      .run();

  // Count this against the post quota only once it actually succeeded, so a
  // failed INSERT (e.g. constraint error) doesn't burn one of the 5 slots.
  await recordFailedAttempt(env.DB, 'comment_post', ip);

  const comment = await env.DB
    .prepare(`SELECT ${await commentColumns(env)} FROM comments WHERE id = ?`)
    .bind(result.meta.last_row_id)
    .first();

  // Notifications run in the background: a reader must never wait on Mailjet
  // or a push endpoint to see their own comment appear.
  if (ctx) ctx.waitUntil(notifyAboutComment(env, { articleId, parentId, authorName, body: commentBody, isAdmin, day }));

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
export async function notifyAboutComment(env, { articleId, parentId, authorName, body, isAdmin, day = null }) {
  try {
    const article = await env.DB
      .prepare('SELECT id, title, slug FROM articles WHERE id = ?')
      .bind(articleId)
      .first();
    if (!article) return;
    // Commentaire sur une journee : les e-mails le disent et menent a ce jour.
    const dayCtx = await dayContext(env, articleId, day).catch(() => null);

    // ── Admin ──────────────────────────────────────────────────────────────
    // Skipped when the admin is the author: no point emailing yourself.
    if (!isAdmin) {
      try {
        // contact_email (Paramètres du site) is the address the admin actually
        // configured to be reached at - NOT admin_account.email, which is only
        // the login identity and can be a different address entirely (this
        // was the bug: notifications silently went to the wrong inbox, with
        // no error since the send itself succeeded). Falls back to the login
        // email only if no contact address was ever set.
        const contactRow = await env.DB.prepare("SELECT value FROM site_settings WHERE key = 'contact_email'").first();
        let notifyEmail = contactRow?.value?.trim();
        if (!notifyEmail) {
          const admin = await env.DB.prepare('SELECT email FROM admin_account WHERE id = 1').first();
          notifyEmail = admin?.email;
        }
        if (notifyEmail) {
          await sendNewCommentEmail(env, notifyEmail, {
            articleTitle: article.title,
            articleSlug: article.slug,
            authorName,
            body,
            isReply: !!parentId,
            dayLabel: dayCtx?.label,
            anchor: dayCtx?.anchor,
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
          dayLabel: dayCtx?.label,
          anchor: dayCtx?.anchor,
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
            url: `/voyage/${article.slug}#${dayCtx?.anchor || 'comments'}`,
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
  const dayCol = (await commentDayColumn(env)) ? ', c.day' : '';
  const { results } = await env.DB
    .prepare(`SELECT c.id, c.article_id, c.parent_id, c.is_admin_reply, c.is_read, a.title AS article_title, a.slug AS article_slug, c.author_name, c.body, c.created_at${dayCol}
              FROM comments c JOIN articles a ON a.id = c.article_id
              ORDER BY c.created_at DESC LIMIT ?`)
    .bind(limit)
    .all();
  return json({ comments: results || [] });
}

/** Count of reader comments the admin hasn't seen yet, for the dashboard's
 *  unread badge. Admin's own replies never count - only readers writing in. */
export async function countUnreadComments(env) {
  const row = await env.DB
    .prepare('SELECT COUNT(*) AS n FROM comments WHERE is_read = 0 AND is_admin_reply = 0')
    .first();
  return json({ count: row?.n || 0 });
}

/** Mark every reader comment as read - called when the admin opens the tab.
 *  A per-comment "mark read" would be more precise but adds friction for no
 *  real benefit here: the whole point is a quick "anything new?" glance. */
export async function markCommentsRead(env) {
  await env.DB.prepare('UPDATE comments SET is_read = 1 WHERE is_read = 0').run();
  return json({ success: true });
}

// ──────────────────────────────────────────────────────────────
// Admin: reply to a comment (creates a threaded reply as admin)
// ──────────────────────────────────────────────────────────────
export async function replyToComment(request, env, commentId, ctx) {
  const hasDay = await commentDayColumn(env);
  const orig = await env.DB.prepare(`SELECT id, article_id, parent_id${hasDay ? ', day' : ''} FROM comments WHERE id = ?`).bind(commentId).first();
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

  // La reponse de l'auteur reste dans la journee du commentaire.
  const res = hasDay
    ? await env.DB.prepare('INSERT INTO comments (article_id, parent_id, is_admin_reply, author_name, body, day) VALUES (?, ?, 1, ?, ?, ?)')
      .bind(orig.article_id, parentId, adminName, replyText, orig.day || null)
      .run()
    : await env.DB.prepare('INSERT INTO comments (article_id, parent_id, is_admin_reply, author_name, body) VALUES (?, ?, 1, ?, ?)')
      .bind(orig.article_id, parentId, adminName, replyText)
      .run();

  const comment = await env.DB.prepare(`SELECT ${await commentColumns(env)} FROM comments WHERE id = ?`)
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
      day: orig.day || null,
    }));
  }

  return json({ comment, article_id: orig.article_id }, 201);
}
