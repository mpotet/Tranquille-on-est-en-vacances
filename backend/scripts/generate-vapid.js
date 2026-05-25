#!/usr/bin/env node
/**
 * scripts/generate-vapid.js
 * Generates VAPID key pair for Web Push notifications.
 *
 * Usage:
 *   node scripts/generate-vapid.js
 *
 * Then run each `wrangler secret put` command shown in the output.
 */
import { webcrypto } from 'node:crypto';

const { subtle } = webcrypto;

const pair = await subtle.generateKey(
  { name: 'ECDSA', namedCurve: 'P-256' },
  true,
  ['sign', 'verify'],
);

const pubRaw  = Buffer.from(await subtle.exportKey('raw', pair.publicKey));
const privJwk = await subtle.exportKey('jwk', pair.privateKey);

const VAPID_PUBLIC_KEY  = pubRaw.toString('base64url');
const VAPID_PRIVATE_KEY = Buffer.from(JSON.stringify(privJwk)).toString('base64');

console.log('\n=== VAPID Keys generated — run these commands ===\n');
console.log(`wrangler secret put VAPID_PUBLIC_KEY`);
console.log(`# Value: ${VAPID_PUBLIC_KEY}\n`);
console.log(`wrangler secret put VAPID_PRIVATE_KEY`);
console.log(`# Value: ${VAPID_PRIVATE_KEY}\n`);
console.log(`wrangler secret put VAPID_SUBJECT`);
console.log(`# Value: mailto:your@email.com\n`);
console.log(`wrangler secret put RESEND_API_KEY`);
console.log(`# Value: re_xxxx  (from resend.com)\n`);
console.log(`wrangler secret put NOTIFY_FROM_EMAIL`);
console.log(`# Value: Blog Potet <noreply@yourdomain.com>\n`);
console.log('=================================================\n');
