#!/usr/bin/env node
/**
 * migrate-images.js
 * Download all canalblog images → upload to local R2 → update DB content.
 *
 * Run from backend/ directory:
 *   node scripts/migrate-images.js
 *
 * For production (once deployed):
 *   node scripts/migrate-images.js --remote
 */

import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, unlinkSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, extname } from 'node:path';

const REMOTE = process.argv.includes('--remote');
const LOCAL_FLAG = REMOTE ? '--remote' : '--local';
const DB      = 'tranquille-vacances-db';
const BUCKET  = 'tranquille-vacances-photos';
const DELAY   = 400; // ms between downloads — be kind to canalblog CDN

const CANALBLOG_RE = /https:\/\/(?:storage|image)\.canalblog\.com\/[^\s"'\)\]\n]+/g;

// ── helpers ───────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));
const sq    = s  => (s || '').replace(/'/g, "''");

function dbExecFile(sqlPath) {
  execSync(
    `npx wrangler d1 execute ${DB} ${LOCAL_FLAG} --yes --file "${sqlPath}"`,
    { encoding: 'utf8', maxBuffer: 1024 * 1024 * 1024, stdio: ['pipe','pipe','pipe'] }
  );
}

function dbQuery(sql) {
  const f = join(tmpdir(), `tvq-${Date.now()}.sql`);
  writeFileSync(f, sql, 'utf8');
  try {
    const out = execSync(
      `npx wrangler d1 execute ${DB} ${LOCAL_FLAG} --json --file "${f}"`,
      { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 }
    );
    return JSON.parse(out)[0]?.results || [];
  } finally { try { unlinkSync(f); } catch {} }
}

function r2Put(key, filePath, contentType) {
  // wrangler r2 object put <bucket>/<key> --file <path> --content-type <ct> --local
  execSync(
    `npx wrangler r2 object put "${BUCKET}/${key}" --file "${filePath}" --content-type "${contentType}" ${LOCAL_FLAG}`,
    { encoding: 'utf8', stdio: ['pipe','pipe','pipe'] }
  );
}

async function downloadImage(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Referer': 'https://cetipar.canalblog.com/',
        },
        redirect: 'follow',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const contentType = (res.headers.get('content-type') || 'image/jpeg').split(';')[0].trim();
      const buffer = Buffer.from(await res.arrayBuffer());
      return { buffer, contentType };
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(1000 * (i + 1));
    }
  }
}

function inferExt(url, ct) {
  const fromPath = extname(new URL(url).pathname).toLowerCase();
  if (fromPath && fromPath !== '.') return fromPath;
  if (ct.includes('jpeg') || ct.includes('jpg')) return '.jpg';
  if (ct.includes('png'))  return '.png';
  if (ct.includes('gif'))  return '.gif';
  if (ct.includes('webp')) return '.webp';
  return '.jpg';
}

function urlKey(url) {
  const hash = createHash('md5').update(url).digest('hex').slice(0, 12);
  return hash;
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`🌍 Image migration: canalblog → R2 (${REMOTE ? 'remote' : 'local'})\n`);

  // 1. Load all articles
  const articles = dbQuery('SELECT id, slug, content, cover_url FROM articles;');
  console.log(`Articles found: ${articles.length}`);

  // 2. Collect unique canalblog image URLs
  const allUrls = new Set();
  for (const art of articles) {
    for (const m of (art.content || '').matchAll(CANALBLOG_RE)) allUrls.add(m[0].replace(/[.,!?]+$/, ''));
    const c = art.cover_url || '';
    if (c.includes('canalblog.com')) allUrls.add(c);
  }
  console.log(`Unique canalblog images: ${allUrls.size}\n`);
  if (!allUrls.size) { console.log('Nothing to migrate.'); return; }

  // 3. Download + upload to R2
  const tmpDir = join(tmpdir(), 'tvac-migrate');
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

  const urlMap = new Map(); // originalUrl → '/r2/imported/<hash>.<ext>'
  let ok = 0, fail = 0;

  for (const url of allUrls) {
    const hash = urlKey(url);
    try {
      const { buffer, contentType } = await downloadImage(url);
      const ext = inferExt(url, contentType);
      const key  = `imported/${hash}${ext}`;
      const tmp  = join(tmpDir, hash + ext);

      writeFileSync(tmp, buffer);
      r2Put(key, tmp, contentType);
      urlMap.set(url, `/r2/${key}`);
      ok++;
      process.stdout.write(`  ✓ ${ok}/${allUrls.size}  ${url.slice(-50).padEnd(50)}\r`);
    } catch (err) {
      fail++;
      process.stdout.write('\n');
      console.error(`  ✗ ${url}\n    ${err.message}`);
    }
    await sleep(DELAY);
  }

  console.log(`\n\nDownloaded: ${ok} ✓   Failed: ${fail} ✗\n`);
  if (!urlMap.size) { console.log('No images uploaded, stopping.'); return; }

  // 4. Update articles — write one SQL file per article to avoid size limits
  let updated = 0;
  for (const art of articles) {
    let content  = art.content  || '';
    let coverUrl = art.cover_url || '';
    let changed  = false;

    for (const [orig, newPath] of urlMap) {
      if (content.includes(orig)) {
        content = content.split(orig).join(newPath);
        changed = true;
      }
      if (coverUrl === orig) {
        coverUrl = newPath;
        changed = true;
      }
    }

    if (!changed) continue;

    const sqlFile = join(tmpDir, `update-${art.id}.sql`);
    writeFileSync(sqlFile,
      `UPDATE articles SET content = '${sq(content)}', cover_url = '${sq(coverUrl)}', updated_at = CURRENT_TIMESTAMP WHERE id = ${art.id};`,
      'utf8'
    );
    dbExecFile(sqlFile);
    try { unlinkSync(sqlFile); } catch {}
    updated++;
    console.log(`  Updated: ${art.slug}`);
  }

  console.log(`\n✅ Done! ${updated} articles updated.`);
  console.log('   Images now served from /r2/imported/<hash>.<ext>');
  console.log('\nFor production: run again with --remote after deploying the worker.');
}

main().catch(err => {
  console.error('\nFatal:', err.message);
  process.exit(1);
});
