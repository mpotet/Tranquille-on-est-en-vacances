/**
 * worker/admin-account.js - Data-access helpers for the single admin account
 * and one-time token lifecycle (setup / reset / email-change).
 *
 * The account lives in the `admin_account` D1 table (id = 1). All credential and
 * token columns stay here and are NEVER exposed through the generic settings API.
 */

const TOKEN_BYTES = 32;                 // 256 bits of entropy
const TOKEN_TTL_MS = 60 * 60 * 1000;    // 1 hour

/** base64url-encode a byte array (no padding). */
function bytesToB64url(bytes) {
  let bin = '';
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Generate a cryptographically-random one-time token (base64url). */
export function generateToken() {
  return bytesToB64url(crypto.getRandomValues(new Uint8Array(TOKEN_BYTES)));
}

/** Fetch the admin account row (id = 1), or null. */
export function getAdminAccount(db) {
  return db.prepare('SELECT * FROM admin_account WHERE id = 1').first();
}

/** Fetch the admin account by (confirmed) email, case-insensitive. */
export function getAdminByEmail(db, email) {
  return db
    .prepare('SELECT * FROM admin_account WHERE lower(email) = lower(?) LIMIT 1')
    .bind(email)
    .first();
}

/**
 * Create/overwrite the current one-time token for a given purpose.
 *
 * Only one token can be active at a time (single `token`/`token_purpose`
 * column on the account row). Issuing a new one silently invalidates any
 * still-valid previous token - e.g. requesting "forgot password" and then an
 * email change before clicking the first link makes that first email's link
 * die with a generic "invalid or expired" message, with no indication why.
 * To avoid that silent footgun, refuse to overwrite a token that's still
 * live for a *different* purpose; the caller should surface this to the
 * admin instead of quietly discarding their pending request.
 *
 * @returns {Promise<{ token: string, expiresAt: string }|{ conflict: string }>}
 */
export async function issueToken(db, purpose) {
  const existing = await getAdminAccount(db);
  if (
    existing?.token &&
    existing.token_purpose &&
    existing.token_purpose !== purpose &&
    existing.token_expires_at &&
    new Date(existing.token_expires_at).getTime() > Date.now()
  ) {
    return { conflict: existing.token_purpose };
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
  await db
    .prepare(
      `UPDATE admin_account
       SET token = ?, token_purpose = ?, token_expires_at = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = 1`,
    )
    .bind(token, purpose, expiresAt)
    .run();
  return { token, expiresAt };
}

/**
 * Look up the admin row by an active, non-expired token matching `purpose`.
 * Returns the row on success, or null (invalid / expired / wrong purpose).
 */
export async function findByValidToken(db, token, purpose) {
  if (!token) return null;
  const row = await db
    .prepare('SELECT * FROM admin_account WHERE token = ? AND token_purpose = ? LIMIT 1')
    .bind(token, purpose)
    .first();
  if (!row) return null;
  if (!row.token_expires_at) return null;
  if (new Date(row.token_expires_at).getTime() < Date.now()) return null;
  return row;
}

/** Clear the token triplet (single-use consumption / cancel). */
export function clearToken(db) {
  return db
    .prepare(
      `UPDATE admin_account
       SET token = NULL, token_purpose = NULL, token_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = 1`,
    )
    .run();
}
