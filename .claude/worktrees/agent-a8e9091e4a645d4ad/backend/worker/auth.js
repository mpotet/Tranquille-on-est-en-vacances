/**
 * auth.js - Authentication helpers for the Cloudflare Worker
 *
 * Strategy:
 *  - Admin logs in with ADMIN_PASSWORD (stored as a Worker secret)
 *  - On success the worker issues a signed session token (HMAC-SHA256)
 *  - Token is stored in an HttpOnly cookie ("session")
 *  - Every protected request verifies the cookie signature
 */

const COOKIE_NAME = 'session';
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ──────────────────────────────────────────────────────────────
// Internal helpers
// ──────────────────────────────────────────────────────────────

/**
 * Derive a CryptoKey from the SESSION_SECRET environment variable.
 * @param {string} secret
 * @returns {Promise<CryptoKey>}
 */
async function getKey(secret) {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

/**
 * Sign a payload string with HMAC-SHA256 and return a base64url token.
 * Token format:  base64url(payload) . base64url(signature)
 */
async function sign(payload, secret) {
  const key = await getKey(secret);
  const enc = new TextEncoder();
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  const b64 = v => btoa(String.fromCharCode(...new Uint8Array(v)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `${btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')}.${b64(sig)}`;
}

/**
 * Verify a token returned by sign() and return the original payload or null.
 */
async function verify(token, secret) {
  try {
    const [encPayload, encSig] = token.split('.');
    if (!encPayload || !encSig) return null;

    const fromB64 = s => atob(s.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = fromB64(encPayload);

    // Re-sign the payload and compare
    const expected = await sign(payload, secret);
    if (expected !== token) return null;

    return JSON.parse(payload);
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────

/**
 * Validate the incoming admin password and, if correct, return a Set-Cookie
 * header value containing a signed session token.
 *
 * @param {string} password     - Password submitted by the user
 * @param {string} adminPw      - ADMIN_PASSWORD env variable
 * @param {string} sessionSecret - SESSION_SECRET env variable
 * @returns {Promise<string|null>} Set-Cookie header value or null on failure
 */
export async function createSession(password, adminPw, sessionSecret) {
  // Constant-time comparison to avoid timing attacks
  const enc = new TextEncoder();
  const a = enc.encode(password);
  const b = enc.encode(adminPw);
  if (a.length !== b.length) return null;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  if (diff !== 0) return null;

  const payload = JSON.stringify({ role: 'admin', exp: Date.now() + TOKEN_TTL_MS });
  const token = await sign(payload, sessionSecret);

  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${TOKEN_TTL_MS / 1000}`;
}

/**
 * Check if the request carries a valid admin session cookie.
 *
 * @param {Request} request
 * @param {string}  sessionSecret
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated(request, sessionSecret) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;
  const data = await verify(match[1], sessionSecret);
  if (!data || data.role !== 'admin') return false;
  if (data.exp < Date.now()) return false;
  return true;
}

/**
 * Return a Set-Cookie header that clears the session.
 */
export function clearSession() {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;
}
