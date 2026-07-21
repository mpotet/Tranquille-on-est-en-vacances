/**
 * rate-limit.js - Simple D1-backed sliding-window rate limiter.
 *
 * Cloudflare Workers have no shared in-memory state across instances, so
 * counters must live somewhere durable. There's no KV/Durable Object binding
 * in this project, so a small D1 table (rate_limit_attempts) is used instead
 * — cheap enough at this traffic volume (a family blog, not a public SaaS).
 *
 * Usage: call `checkRateLimit` before doing the sensitive check (password
 * verify, gate-answer compare). If it returns blocked=true, reject the
 * request immediately without even looking at the submitted credential —
 * that's what actually stops a brute force, not just recording the failure
 * after the fact.
 */

/** Best-effort client identifier. Cloudflare sets CF-Connecting-IP on every
 *  request reaching a Worker; fall back to a constant if it's ever missing
 *  (e.g. local dev) rather than throwing. */
export function clientKey(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
}

/**
 * @param {D1Database} db
 * @param {string} scope        e.g. 'login', 'comment_gate'
 * @param {string} key          e.g. client IP
 * @param {{max:number, windowMinutes:number}} opts
 * @returns {Promise<{blocked:boolean, retryAfterSeconds:number}>}
 */
export async function checkRateLimit(db, scope, key, { max, windowMinutes }) {
  const windowStart = `-${windowMinutes} minutes`;
  const row = await db
    .prepare(`SELECT COUNT(*) AS n, MIN(created_at) AS oldest FROM rate_limit_attempts
              WHERE scope = ? AND attempt_key = ? AND created_at > datetime('now', ?)`)
    .bind(scope, key, windowStart)
    .first();
  const count = row?.n ?? 0;
  if (count >= max) {
    // Oldest attempt in the window falls out after windowMinutes; that's the
    // earliest point the caller could succeed again.
    const oldestMs = row?.oldest ? new Date(row.oldest.replace(' ', 'T') + 'Z').getTime() : Date.now();
    const retryAfterSeconds = Math.max(1, Math.round((oldestMs + windowMinutes * 60000 - Date.now()) / 1000));
    return { blocked: true, retryAfterSeconds };
  }
  return { blocked: false, retryAfterSeconds: 0 };
}

/** Record a failed attempt. Call only on failure — successful auth doesn't count against the limit. */
export async function recordFailedAttempt(db, scope, key) {
  await db.prepare('INSERT INTO rate_limit_attempts (scope, attempt_key) VALUES (?, ?)').bind(scope, key).run();
  // Opportunistic cleanup so the table doesn't grow unbounded — cheap, and
  // only needs to run occasionally (1-in-20 chance per call is enough).
  if (Math.random() < 0.05) {
    await db.prepare("DELETE FROM rate_limit_attempts WHERE created_at < datetime('now', '-1 day')").run().catch(() => {});
  }
}

/** Clear attempts for a key on success (e.g. correct password) so a
 *  legitimate user isn't left half-throttled after recovering their account. */
export async function clearAttempts(db, scope, key) {
  await db.prepare('DELETE FROM rate_limit_attempts WHERE scope = ? AND attempt_key = ?').bind(scope, key).run().catch(() => {});
}
