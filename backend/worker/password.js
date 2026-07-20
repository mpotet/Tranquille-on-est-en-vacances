/**
 * worker/password.js - Password hashing for the admin account.
 *
 * Uses WebCrypto PBKDF2-SHA256, which is available both in the Cloudflare
 * Workers runtime and in Node.js (via globalThis.crypto on Node 18+), so the
 * same module is reused by the one-off setup script.
 *
 * Stored format (all base64url, ':'-separated):
 *   "<salt>:<iterations>:<hash>"
 *
 * Never store or log the plaintext password.
 */

// ~100k iterations: a common edge-runtime baseline. Comfortably fast (a few ms)
// on Workers while staying well within the per-request CPU budget.
const ITERATIONS = 100_000;
const SALT_BYTES = 16;
const HASH_BITS = 256; // SHA-256 output length

// ── base64url helpers (no padding) ────────────────────────────────────────────
function bytesToB64url(bytes) {
  let bin = '';
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlToBytes(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveHash(plain, salt, iterations, bits) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(plain),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    bits,
  );
  return new Uint8Array(derived);
}

/**
 * Hash a plaintext password. Returns the composite "salt:iterations:hash" string
 * to store in admin_account.password_hash.
 * @param {string} plain
 * @returns {Promise<string>}
 */
export async function hashPassword(plain) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await deriveHash(plain, salt, ITERATIONS, HASH_BITS);
  return `${bytesToB64url(salt)}:${ITERATIONS}:${bytesToB64url(hash)}`;
}

/**
 * Verify a plaintext password against a stored composite string.
 * Constant-time comparison of the derived hash. Returns false for any malformed
 * or NULL stored value (e.g. first-run state where no password is set yet).
 * @param {string} plain
 * @param {string|null|undefined} stored
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(plain, stored) {
  if (!stored || typeof stored !== 'string') return false;
  const parts = stored.split(':');
  if (parts.length !== 3) return false;
  const [saltB64, iterStr, hashB64] = parts;
  const iterations = parseInt(iterStr, 10);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;

  let salt, expected;
  try {
    salt = b64urlToBytes(saltB64);
    expected = b64urlToBytes(hashB64);
  } catch {
    return false;
  }

  const actual = await deriveHash(plain, salt, iterations, expected.length * 8);
  if (actual.length !== expected.length) return false;

  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}
