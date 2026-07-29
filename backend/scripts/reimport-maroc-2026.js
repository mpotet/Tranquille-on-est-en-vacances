#!/usr/bin/env node
/**
 * reimport-maroc-2026.js
 *
 * One-off: the "Maroc 2026" article (id 96, slug maroc-2026) was imported from
 * CanalBlog as text ONLY - its 347 photos never made it into the app. This
 * scrapes the original CanalBlog post, rebuilds the article body preserving the
 * exact text/image ordering, downloads every photo into R2, and rewrites the
 * article's `content` so the images are served from our own bucket.
 *
 * Run from backend/:
 *   node scripts/reimport-maroc-2026.js            # local D1/R2 (dry test)
 *   node scripts/reimport-maroc-2026.js --remote   # production
 *
 * Idempotent-ish: re-running re-downloads/re-uploads (same R2 keys, overwrite)
 * and rewrites the same content. Safe to retry after a partial failure.
 */

import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, unlinkSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, extname } from 'node:path';

const REMOTE     = process.argv.includes('--remote');
const LOCAL_FLAG = REMOTE ? '--remote' : '--local';
const DB         = 'tranquille-vacances-db';
const BUCKET     = 'tranquille-vacances-photos';
const ARTICLE_ID = 96;
const SOURCE_URL = 'https://cetipar.canalblog.com/2025/10/maroc-2026.html';
const DELAY      = 250; // ms between downloads - be kind to the CanalBlog CDN
const EXEC_TIMEOUT_MS = 60_000;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const sq    = s  => (s || '').replace(/'/g, "''");

// ── HTML entity decode ────────────────────────────────────────
// Named entities CanalBlog emits (French accents + common punctuation), then
// numeric (decimal & hex) as a catch-all. &amp; is decoded LAST so an escaped
// "&amp;eacute;" doesn't get double-decoded.
const NAMED = {
  nbsp: ' ', eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë',
  agrave: 'à', acirc: 'â', auml: 'ä', aacute: 'á', ccedil: 'ç',
  icirc: 'î', iuml: 'ï', ocirc: 'ô', ouml: 'ö', ugrave: 'ù',
  ucirc: 'û', uuml: 'ü', ntilde: 'ñ', oelig: 'œ', aelig: 'æ',
  laquo: '«', raquo: '»', hellip: '…', deg: '°', euro: '€',
  rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', ndash: '–', mdash: '-',
  quot: '"', lt: '<', gt: '>', apos: "'",
};
function decodeEntities(s) {
  return String(s || '')
    .replace(/&#x20;/gi, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (whole, name) => {
      const k = name.toLowerCase();
      return k in NAMED ? NAMED[k] : whole; // leave unknown entities untouched
    })
    .replace(/&amp;/g, '&');
}

// HTML-escape for re-emitting text inside our own <p> tags.
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── wrangler helpers ──────────────────────────────────────────
function dbQuery(sql) {
  const out = execSync(
    `npx wrangler d1 execute ${DB} ${LOCAL_FLAG} --json --command "${sql.replace(/"/g, '\\"')}"`,
    { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, timeout: EXEC_TIMEOUT_MS }
  );
  const start = out.indexOf('['), end = out.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('No JSON in wrangler output:\n' + out);
  return JSON.parse(out.slice(start, end + 1))[0]?.results || [];
}
function dbExecFile(sqlPath) {
  execSync(
    `npx wrangler d1 execute ${DB} ${LOCAL_FLAG} --yes --file "${sqlPath}"`,
    { encoding: 'utf8', maxBuffer: 1024 * 1024 * 1024, stdio: ['pipe','pipe','pipe'], timeout: EXEC_TIMEOUT_MS }
  );
}
function r2Put(key, filePath, contentType) {
  execSync(
    `npx wrangler r2 object put "${BUCKET}/${key}" --file "${filePath}" --content-type "${contentType}" ${LOCAL_FLAG}`,
    { encoding: 'utf8', stdio: ['pipe','pipe','pipe'], timeout: EXEC_TIMEOUT_MS }
  );
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    redirect: 'follow', signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

async function downloadImage(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Referer': 'https://cetipar.canalblog.com/',
        },
        redirect: 'follow', signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ct = (res.headers.get('content-type') || 'image/jpeg').split(';')[0].trim();
      return { buffer: Buffer.from(await res.arrayBuffer()), contentType: ct };
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(1000 * (i + 1));
    }
  }
}
function inferExt(url, ct) {
  const fromPath = extname(new URL(url).pathname).toLowerCase();
  if (fromPath && fromPath !== '.') return fromPath;
  if (ct.includes('png')) return '.png';
  if (ct.includes('gif')) return '.gif';
  if (ct.includes('webp')) return '.webp';
  return '.jpg';
}
// Stable R2 key derived from the image's real underlying path (dedup across the
// proxy-hash variants CanalBlog serves for the same photo).
function keyFor(url) {
  const m = url.match(/no_upscale\(\)\/(.+)$/);
  const real = m ? decodeURIComponent(m[1]) : url;
  return createHash('md5').update(real).digest('hex').slice(0, 12);
}

function progress(cur, total, label) {
  const w = 36, pct = total ? cur / total * 100 : 0;
  const f = Math.round(w * pct / 100);
  return `${label} [${'█'.repeat(f)}${'░'.repeat(w - f)}] ${pct.toFixed(0).padStart(3)}% ${cur}/${total}`;
}

// ── Parse the CanalBlog post into an ordered list of blocks ────
// The Overblog body interleaves <p> text paragraphs and <img class="…ob-media">
// photos. We walk them in document order so the rebuilt article keeps the exact
// "photo follows the paragraph it illustrates" sequence of the original.
function parseBlocks(html) {
  // Body window: from the first real <p> after the title to just past the last
  // photo. These offsets bracket the post content and exclude the site chrome
  // (menu, share bar, comments). Derived by inspection of the page structure.
  const firstP = html.indexOf('<p', html.indexOf('ob-h1'));
  const lastImg = html.lastIndexOf('ob-media');
  const end = html.indexOf('>', lastImg) + 1;
  const body = html.slice(firstP, end);

  const blocks = [];
  const re = /<p\b[^>]*>(.*?)<\/p>|<img[^>]*ob-media[^>]*>/gis;
  let m;
  while ((m = re.exec(body)) !== null) {
    const frag = m[0];
    if (frag.startsWith('<img')) {
      const src = (frag.match(/src="([^"]+)"/i) || [])[1];
      if (src && /image\.canalblog\.com/.test(src)) blocks.push({ type: 'img', src });
    } else {
      // Keep <br> as newlines, strip every other inline tag, decode entities.
      let inner = m[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
      inner = decodeEntities(inner).replace(/ /g, ' ').trim();
      if (inner) blocks.push({ type: 'txt', text: inner });
    }
  }
  return blocks;
}

async function main() {
  console.log(`\n🌍 Ré-import Maroc 2026 depuis CanalBlog → R2 (${REMOTE ? 'REMOTE' : 'local'})\n`);

  // 1. Scrape the source post.
  console.log('· Récupération de la page source…');
  const html = await fetchText(SOURCE_URL);
  const blocks = parseBlocks(html);
  const imgBlocks = blocks.filter(b => b.type === 'img');
  const txtBlocks = blocks.filter(b => b.type === 'txt');
  console.log(`  → ${blocks.length} blocs : ${txtBlocks.length} paragraphes, ${imgBlocks.length} images`);
  if (!imgBlocks.length) { console.log('Aucune image trouvée, abandon.'); return; }

  // 2. Download + upload every unique image, mapping source URL → /r2/ path.
  const tmpDir = join(tmpdir(), 'tvac-maroc');
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

  const urlToR2 = new Map();
  const uniqueUrls = [...new Set(imgBlocks.map(b => b.src))];
  console.log(`\n· Téléchargement de ${uniqueUrls.length} images uniques → R2\n`);
  let ok = 0, fail = 0;
  for (const url of uniqueUrls) {
    const hash = keyFor(url);
    try {
      const { buffer, contentType } = await downloadImage(url);
      const ext = inferExt(url, contentType);
      const key = `imported/${hash}${ext}`;
      const tmp = join(tmpDir, hash + ext);
      writeFileSync(tmp, buffer);
      r2Put(key, tmp, contentType);
      try { unlinkSync(tmp); } catch {}
      urlToR2.set(url, `/r2/${key}`);
      ok++;
      process.stdout.write(progress(ok + fail, uniqueUrls.length, '⬇️ ') + '\r');
    } catch (err) {
      fail++;
      process.stdout.write('\n  ✗ ' + url.slice(0, 80) + ' - ' + err.message + '\n');
    }
    await sleep(DELAY);
  }
  console.log(`\n\n  → ${ok} importées, ${fail} échecs\n`);
  if (!ok) { console.log('Aucune image importée, abandon (contenu inchangé).'); return; }

  // 3. Rebuild the article body: <p> per text block, raw <img> per photo (the
  //    server-side renderVoyageContent wraps them in figures / groups runs).
  //    Photos that failed to import are skipped rather than left pointing at
  //    CanalBlog (the whole point is to stop depending on it).
  const parts = [];
  for (const b of blocks) {
    if (b.type === 'txt') {
      // A CanalBlog paragraph may hold several lines (from <br>) → keep them as
      // separate <p> so spacing matches the reader's expectation.
      for (const line of b.text.split('\n').map(s => s.trim()).filter(Boolean)) {
        parts.push(`<p>${esc(line)}</p>`);
      }
    } else {
      const r2 = urlToR2.get(b.src);
      if (r2) parts.push(`<img src="${r2}" alt="Maroc 2026">`);
    }
  }
  const content = parts.join('\n');
  console.log(`· Nouveau contenu : ${content.length} caractères, ${parts.length} blocs`);

  // 4. Persist.
  const sqlFile = join(tmpDir, 'update.sql');
  writeFileSync(sqlFile,
    `UPDATE articles SET content = '${sq(content)}', updated_at = CURRENT_TIMESTAMP WHERE id = ${ARTICLE_ID};`,
    'utf8');
  dbExecFile(sqlFile);
  try { unlinkSync(sqlFile); } catch {}

  console.log(`\n✅ Article ${ARTICLE_ID} mis à jour - ${ok} images servies depuis /r2/imported/`);
  if (!REMOTE) console.log('   (local seulement - relancer avec --remote pour la production)');
}

main().catch(err => { console.error('\nFatal:', err.message); process.exit(1); });
