/**
 * worker/vapid.js — Web Push (RFC 8030/8291/8188) + VAPID (RFC 8292)
 *
 * Fully implemented with SubtleCrypto — no external dependencies.
 * Compatible with Cloudflare Workers runtime.
 *
 * Required env secrets (set via `wrangler secret put`):
 *   VAPID_PUBLIC_KEY  — base64url of the raw 65-byte P-256 public key
 *   VAPID_PRIVATE_KEY — base64 of JSON.stringify(privateKeyJwk)
 *   VAPID_SUBJECT     — "mailto:your@email.com"
 */

const te = new TextEncoder();

// ── Base64url helpers ─────────────────────────────────────────────────────────

export function b64uDecode(str) {
  const padded = str.padEnd(str.length + (4 - (str.length % 4)) % 4, '=');
  const b64    = padded.replace(/-/g, '+').replace(/_/g, '/');
  const bin    = atob(b64);
  const out    = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function b64uEncode(buf) {
  const bytes  = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let   binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ── HMAC-SHA-256 primitive ────────────────────────────────────────────────────

async function hmacSha256(keyBytes, data) {
  const key = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, data));
}

// ── HKDF-Extract / HKDF-Expand (RFC 5869) ────────────────────────────────────
// Implemented manually because we need them as separate steps (RFC 8291 requires
// chaining: Extract → Expand → Extract → Expand).

async function hkdfExtract(salt, ikm) {
  // PRK = HMAC-SHA-256(salt, IKM)
  return hmacSha256(salt, ikm);
}

async function hkdfExpand(prk, info, length) {
  // T(1) = HMAC-SHA-256(PRK, info || 0x01)  — single-block expand (length ≤ 32)
  const input = new Uint8Array(info.length + 1);
  input.set(info);
  input[info.length] = 0x01;
  const t1 = await hmacSha256(prk, input);
  return t1.slice(0, length);
}

// ── RFC 8291 §3 key derivation ────────────────────────────────────────────────

async function deriveContentKeys(authSecret, receiverPub, senderPub, ecdhZ, salt) {
  // Step 1 — PRK_key = HKDF-Extract(auth_secret, ECDH_Z)
  const prkKey = await hkdfExtract(authSecret, ecdhZ);

  // Step 2 — IKM = HKDF-Expand(PRK_key, "WebPush: info\0" || receiver_pub || sender_pub, 32)
  const keyInfoPrefix = te.encode('WebPush: info\x00');
  const keyInfo = new Uint8Array(keyInfoPrefix.length + receiverPub.length + senderPub.length);
  keyInfo.set(keyInfoPrefix, 0);
  keyInfo.set(receiverPub, keyInfoPrefix.length);
  keyInfo.set(senderPub, keyInfoPrefix.length + receiverPub.length);
  const ikm = await hkdfExpand(prkKey, keyInfo, 32);

  // Step 3 — PRK = HKDF-Extract(salt, IKM)
  const prk = await hkdfExtract(salt, ikm);

  // Step 4 — CEK = HKDF-Expand(PRK, "Content-Encoding: aes128gcm\0", 16)
  const cek = await hkdfExpand(prk, te.encode('Content-Encoding: aes128gcm\x00'), 16);

  // Step 5 — NONCE = HKDF-Expand(PRK, "Content-Encoding: nonce\0", 12)
  const nonce = await hkdfExpand(prk, te.encode('Content-Encoding: nonce\x00'), 12);

  return { cek, nonce };
}

// ── VAPID JWT (RFC 8292) ──────────────────────────────────────────────────────

async function vapidJwt(privateKeyJwk, audience, subject) {
  const privKey = await crypto.subtle.importKey(
    'jwk',
    privateKeyJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );

  const header  = b64uEncode(te.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims  = b64uEncode(te.encode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 43_200, // 12 h
    sub: subject,
  })));

  const sigInput = `${header}.${claims}`;
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privKey, te.encode(sigInput))
  );

  return `${sigInput}.${b64uEncode(sig)}`;
}

// ── Main: sendWebPush ─────────────────────────────────────────────────────────

/**
 * Send an encrypted Web Push message to a single subscription.
 *
 * @param {{ endpoint:string, p256dh:string, auth:string }} sub
 * @param {string}  payloadStr  — JSON string (must be < 4078 bytes)
 * @param {object}  env         — CF Workers env (needs VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT)
 * @returns {Promise<Response|undefined>}
 */
export async function sendWebPush(sub, payloadStr, env) {
  if (!env.VAPID_PRIVATE_KEY || !env.VAPID_PUBLIC_KEY) return;

  const { endpoint, p256dh, auth } = sub;
  const audience = new URL(endpoint).origin;
  const subject  = env.VAPID_SUBJECT || 'mailto:admin@example.com';
  const privJwk  = JSON.parse(atob(env.VAPID_PRIVATE_KEY));

  // VAPID auth token
  const jwt = await vapidJwt(privJwk, audience, subject);

  // Generate ephemeral sender ECDH key pair
  const senderPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'],
  );
  const senderPubRaw = new Uint8Array(
    await crypto.subtle.exportKey('raw', senderPair.publicKey)
  );

  // Decode receiver keys
  const receiverPubRaw = b64uDecode(p256dh);
  const authSecret     = b64uDecode(auth);

  // ECDH shared secret (X-coordinate of the resulting curve point, 32 bytes)
  const receiverPubKey = await crypto.subtle.importKey(
    'raw', receiverPubRaw, { name: 'ECDH', namedCurve: 'P-256' }, false, [],
  );
  const ecdhBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: receiverPubKey },
    senderPair.privateKey,
    256,
  );
  const ecdhZ = new Uint8Array(ecdhBits);

  // Random 16-byte salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Derive CEK + nonce
  const { cek, nonce } = await deriveContentKeys(
    authSecret, receiverPubRaw, senderPubRaw, ecdhZ, salt,
  );

  // Pad: plaintext || 0x02 (RFC 8188 pad delimiter, no extra padding)
  const plain  = te.encode(payloadStr);
  const padded = new Uint8Array(plain.length + 1);
  padded.set(plain);
  padded[plain.length] = 0x02;

  // AES-128-GCM encrypt
  const cekKey     = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, cekKey, padded)
  );

  // RFC 8188 content-coding header: salt(16) + rs(4) + idlen(1) + keyid(65)
  const hdr = new Uint8Array(16 + 4 + 1 + senderPubRaw.length);
  hdr.set(salt, 0);
  new DataView(hdr.buffer).setUint32(16, 4096, false); // rs = 4096 (big-endian)
  hdr[20] = senderPubRaw.length;                       // idlen = 65
  hdr.set(senderPubRaw, 21);

  // Final body = header + ciphertext
  const body = new Uint8Array(hdr.length + ciphertext.length);
  body.set(hdr, 0);
  body.set(ciphertext, hdr.length);

  return fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization:    `vapid t=${jwt},k=${env.VAPID_PUBLIC_KEY}`,
      'Content-Type':   'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      TTL:              '86400',
    },
    body,
  });
}
