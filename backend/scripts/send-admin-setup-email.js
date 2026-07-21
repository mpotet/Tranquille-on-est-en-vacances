#!/usr/bin/env node
/**
 * scripts/send-admin-setup-email.js
 *
 * One-off first-run helper. Generates a 1-hour setup token for the seeded admin
 * account, writes it into the `admin_account` row via wrangler d1, and emails a
 * setup link (PUBLIC_URL/admin/setup?token=...) to the account's email via Resend.
 *
 * Run from the backend/ directory AFTER the schema has been applied:
 *   RESEND_API_KEY=re_xxx PUBLIC_URL=https://... npm run admin:send-setup-email
 *   RESEND_API_KEY=re_xxx PUBLIC_URL=https://... npm run admin:send-setup-email:remote
 *
 * Env vars (all overridable):
 *   RESEND_API_KEY     (required) Resend API key.
 *   PUBLIC_URL         (required) public base URL used to build the setup link.
 *   NOTIFY_FROM_EMAIL  (optional) "From" address; defaults to onboarding@resend.dev.
 *
 * The token itself is generated here (Node WebCrypto) and stored in the DB; the
 * Worker validates it at /admin/setup. Nothing sensitive is printed.
 */
import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REMOTE = process.argv.includes('--remote');
const LOCAL_FLAG = REMOTE ? '--remote' : '--local';
const DB = 'tranquille-vacances-db';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const PUBLIC_URL = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
const FROM = process.env.NOTIFY_FROM_EMAIL || 'onboarding@resend.dev';

if (!RESEND_API_KEY) { console.error('✗ RESEND_API_KEY manquant (env var requise).'); process.exit(1); }
if (!PUBLIC_URL)     { console.error('✗ PUBLIC_URL manquant (env var requise).');     process.exit(1); }

const sq = s => (s || '').replace(/'/g, "''");

function dbQuery(sql) {
  // NOTE: `--file` with `--remote` returns an upload/execution summary (rows
  // read/written counts), not the SELECT's actual result rows - only
  // `--command` reliably returns query results in both --local and --remote.
  // (Using --file here previously made account.email come back as undefined,
  // which silently became `to: [null]` in the Resend payload → 422 error.)
  const out = execSync(
    `npx wrangler d1 execute ${DB} ${LOCAL_FLAG} --json --command "${sql.replace(/"/g, '\\"')}"`,
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  // --remote prints progress lines ("├ Checking if file needs uploading...")
  // before the JSON output; --json only guarantees the final payload is JSON,
  // not that stdout contains nothing else. Extract the first '[' .. last ']'.
  const start = out.indexOf('[');
  const end = out.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('No JSON array found in wrangler output:\n' + out);
  return JSON.parse(out.slice(start, end + 1))[0]?.results || [];
}

function dbExec(sql) {
  const f = join(tmpdir(), `admin-setup-exec-${Date.now()}.sql`);
  writeFileSync(f, sql, 'utf8');
  try {
    execSync(
      `npx wrangler d1 execute ${DB} ${LOCAL_FLAG} --yes --file "${f}"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
    );
  } finally { try { unlinkSync(f); } catch {} }
}

function generateToken() {
  return Buffer.from(webcrypto.getRandomValues(new Uint8Array(32))).toString('base64url');
}

// ── main ──────────────────────────────────────────────────────────────────────
console.log(`\n=== Envoi de l'email de configuration admin (${REMOTE ? 'REMOTE/production' : 'local'}) ===\n`);

const rows = dbQuery('SELECT id, email, password_hash FROM admin_account WHERE id = 1');
const account = rows[0];
if (!account) {
  console.error('✗ Aucun compte admin (admin_account id=1). Appliquez schema.sql d\'abord.');
  process.exit(1);
}
if (account.password_hash) {
  console.error(`⚠ Le compte ${account.email} a déjà un mot de passe. Utilisez plutôt le flux « mot de passe oublié » si nécessaire.`);
  process.exit(1);
}

const token = generateToken();
const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

dbExec(
  `UPDATE admin_account
   SET token='${sq(token)}', token_purpose='setup', token_expires_at='${sq(expiresAt)}', updated_at=CURRENT_TIMESTAMP
   WHERE id=1;`,
);
console.log(`✓ Token de configuration écrit dans la base (expire le ${expiresAt}).`);

const setupUrl = `${PUBLIC_URL}/admin/setup?token=${encodeURIComponent(token)}`;
const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Initialisez votre mot de passe administrateur</title></head>
<body style="margin:0;padding:0;background:#FFFDF9;font-family:ui-sans-serif,system-ui,sans-serif;color:#1A2B3C">
<div style="max-width:600px;margin:0 auto;padding:28px 20px">
  <div style="text-align:center;padding:20px 0 24px">
    <div style="font-size:2.4rem;line-height:1">🌴</div>
    <div style="font-size:17px;font-weight:700;color:#0057B8;margin-top:8px;letter-spacing:-.02em">Tranquille, on est en vacances</div>
    <div style="font-size:11px;color:#8A9BAC;margin-top:3px;text-transform:uppercase;letter-spacing:.18em">Espace administrateur</div>
  </div>
  <div style="background:#ffffff;border-radius:20px;padding:28px 24px;border:1px solid rgba(26,43,60,.10);box-shadow:0 2px 12px rgba(26,43,60,.06)">
    <div style="font-size:11px;font-weight:700;color:#2E7D6B;text-transform:uppercase;letter-spacing:.15em;margin-bottom:12px">✦ Bienvenue</div>
    <h1 style="font-size:23px;font-weight:700;color:#1A2B3C;margin:0 0 14px;line-height:1.25;font-family:Georgia,serif">Initialisez votre mot de passe administrateur</h1>
    <p style="font-size:15px;color:#5A6A7A;line-height:1.72;margin:0 0 22px">Bienvenue dans l'espace administrateur du blog. Pour activer votre compte, choisissez un mot de passe en cliquant sur le bouton ci-dessous. Ce lien est valable <strong>1 heure</strong>.</p>
    <a href="${setupUrl}" style="display:inline-block;background:#0057B8;color:#ffffff;text-decoration:none;padding:13px 30px;border-radius:999px;font-weight:700;font-size:14px;letter-spacing:.01em;margin-top:8px">Choisir mon mot de passe →</a>
    <p style="font-size:12px;color:#8A9BAC;line-height:1.7;margin:18px 0 0">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br><span style="color:#5A6A7A;word-break:break-all">${setupUrl}</span></p>
  </div>
  <div style="text-align:center;margin-top:22px;font-size:12px;color:#8A9BAC;line-height:1.9">
    <p style="margin:0">Vous recevez cet email car un compte administrateur a été créé pour cette adresse.</p>
  </div>
</div></body></html>`;

const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: FROM,
    to: [account.email],
    subject: 'Initialisez votre mot de passe administrateur',
    html,
  }),
});

if (!res.ok) {
  const body = await res.text().catch(() => '');
  console.error(`✗ Échec de l'envoi Resend (HTTP ${res.status}): ${body}`);
  console.error('  Le token reste valide en base ; relancez le script après correction.');
  process.exit(1);
}

console.log(`✓ Email de configuration envoyé à ${account.email}.`);
console.log('  Le destinataire a 1 heure pour choisir son mot de passe.\n');
