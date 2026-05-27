/**
 * import-canalblog.js
 * Scrape cetipar.canalblog.com, convert content to Markdown,
 * and write an SQL file ready for:
 *   npx wrangler d1 execute tranquille-vacances-db --local --file=scripts/canalblog-import.sql
 *
 * Run with: node scripts/import-canalblog.js
 * Requires Node 18+ (built-in fetch)
 */

import { writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

// ── Voyage definitions ─────────────────────────────────────────
const VOYAGES = [
  { title: 'Maroc Octobre 2011',         url: 'https://cetipar.canalblog.com/pages/maroc-octobre-2011/37992808.html',        destination: 'Maroc',      start_date: '2011-10-07', end_date: '2011-10-09', folder: 'maroc' },
  { title: 'Maroc Mai 2013 – Marrakech', url: 'https://cetipar.canalblog.com/pages/maroc-mai-2013---marrakech/29722514.html',  destination: 'Maroc',      start_date: '2013-05-01', end_date: '2013-05-14', folder: 'maroc' },
  { title: 'Espagne 2013 – Sierra de Guara', url: 'https://cetipar.canalblog.com/pages/espagne-2013---sierra-de-guara/29722516.html', destination: 'Espagne', start_date: '2013-07-01', end_date: '2013-07-14', folder: 'espagne' },
  { title: 'Maroc Mai 2014 – Fès',       url: 'https://cetipar.canalblog.com/pages/maroc-mai-2014---fes/29722527.html',       destination: 'Maroc',      start_date: '2014-05-01', end_date: '2014-05-14', folder: 'maroc' },
  { title: 'Maroc Avril 2015',           url: 'https://cetipar.canalblog.com/pages/maroc-avril-2015/31934514.html',           destination: 'Maroc',      start_date: '2015-04-01', end_date: '2015-04-14', folder: 'maroc' },
  { title: 'Maroc Avril 2016',           url: 'https://cetipar.canalblog.com/pages/maroc-avril-2016/33578630.html',           destination: 'Maroc',      start_date: '2016-04-01', end_date: '2016-04-14', folder: 'maroc' },
  { title: 'Maroc Octobre 2016',         url: 'https://cetipar.canalblog.com/pages/maroc-octobre-2016/34445993.html',         destination: 'Maroc',      start_date: '2016-10-07', end_date: '2016-10-16', folder: 'maroc' },
  { title: 'Oman Avril 2017',            url: 'https://cetipar.canalblog.com/pages/oman-avril-2017/35207620.html',            destination: 'Oman',       start_date: '2017-04-01', end_date: '2017-04-14', folder: 'oman' },
  { title: 'Maroc Avril 2018',           url: 'https://cetipar.canalblog.com/pages/maroc-avril-2018/36324848.html',           destination: 'Maroc',      start_date: '2018-04-01', end_date: '2018-04-14', folder: 'maroc' },
  { title: 'Oman Mars 2019',             url: 'https://cetipar.canalblog.com/pages/oman-mars-2019/37163239.html',             destination: 'Oman',       start_date: '2019-03-01', end_date: '2019-03-14', folder: 'oman' },
  { title: 'Maroc Octobre 2019',         url: 'https://cetipar.canalblog.com/pages/maroc-octobre-2019/37718054.html',         destination: 'Maroc',      start_date: '2019-10-01', end_date: '2019-10-14', folder: 'maroc' },
  { title: 'Maroc Juillet 2020',         url: 'https://cetipar.canalblog.com/pages/maroc-juillet-2020/37992769.html',         destination: 'Maroc',      start_date: '2020-07-01', end_date: '2020-07-14', folder: 'maroc' },
  { title: 'Maroc Septembre 2021',       url: 'https://cetipar.canalblog.com/pages/maroc-septembre-2021/39128198.html',       destination: 'Maroc',      start_date: '2021-09-01', end_date: '2021-09-14', folder: 'maroc' },
  { title: 'Jordanie Avril 2022',        url: 'https://cetipar.canalblog.com/pages/jordanie-avril-2022/37992760.html',        destination: 'Jordanie',   start_date: '2022-04-29', end_date: '2022-05-17', folder: 'jordanie' },
  { title: 'Maroc 2022',                 url: 'https://cetipar.canalblog.com/pages/maroc-2022/39630854.html',                 destination: 'Maroc',      start_date: '2022-09-18', end_date: '2022-10-02', folder: 'maroc' },
  { title: 'Maroc 2023',                 url: 'https://cetipar.canalblog.com/pages/maroc-2023/39892185.html',                 destination: 'Maroc',      start_date: '2023-04-01', end_date: '2023-04-14', folder: 'maroc' },
  { title: 'Egypte 2023',               url: 'https://cetipar.canalblog.com/pages/egypte-2023/40076727.html',               destination: 'Egypte',     start_date: '2023-11-07', end_date: '2023-11-25', folder: 'egypte' },
  { title: 'Maroc 2024',                 url: 'https://cetipar.canalblog.com/2024/05/maroc-2024.html',                        destination: 'Maroc',      start_date: '2024-05-01', end_date: '2024-05-14', folder: 'maroc' },
  { title: 'Oman 2024',                  url: 'https://cetipar.canalblog.com/2024/10/oman-2024.html',                         destination: 'Oman',       start_date: '2024-10-01', end_date: '2024-10-14', folder: 'oman' },
  { title: 'Oman 2024 – suite',          url: 'https://cetipar.canalblog.com/2024/11/oman-2024-suite.html',                   destination: 'Oman',       start_date: '2024-11-01', end_date: '2024-11-14', folder: 'oman' },
  { title: 'Tunisie 2025',               url: 'https://cetipar.canalblog.com/2025/04/tunisie-2025.html',                      destination: 'Tunisie',    start_date: '2025-04-01', end_date: '2025-04-14', folder: 'tunisie' },
  { title: 'Maroc 2025',                 url: 'https://cetipar.canalblog.com/2025/09/maroc-2025.html',                        destination: 'Maroc',      start_date: '2025-09-01', end_date: '2025-09-14', folder: 'maroc' },
  { title: 'Mauritanie Février 2026',    url: 'https://cetipar.canalblog.com/2026/01/mauritanie-fevrier-2026.html',           destination: 'Mauritanie', start_date: '2026-02-01', end_date: '2026-02-14', folder: 'mauritanie' },
  { title: 'Maroc 2026',                 url: 'https://cetipar.canalblog.com/2025/10/maroc-2026.html',                        destination: 'Maroc',      start_date: '2026-03-01', end_date: '2026-03-14', folder: 'maroc' },
];

// ── Folder definitions ─────────────────────────────────────────
const FOLDERS = [
  { slug: 'maroc',      name: 'Maroc',       icon: '🇲🇦', sort_order: 1 },
  { slug: 'oman',       name: 'Oman',        icon: '🇴🇲', sort_order: 2 },
  { slug: 'jordanie',   name: 'Jordanie',    icon: '🇯🇴', sort_order: 3 },
  { slug: 'egypte',     name: 'Égypte',      icon: '🇪🇬', sort_order: 4 },
  { slug: 'tunisie',    name: 'Tunisie',     icon: '🇹🇳', sort_order: 5 },
  { slug: 'espagne',    name: 'Espagne',     icon: '🇪🇸', sort_order: 6 },
  { slug: 'mauritanie', name: 'Mauritanie',  icon: '🇲🇷', sort_order: 7 },
];

// ── HTML → Markdown converter ──────────────────────────────────
function htmlToMarkdown(html) {
  // Remove scripts, styles, nav, header, footer, ads
  // ── Step 1: strip noise ────────────────────────────────────
  html = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // ── Step 2: extract article body ──────────────────────────
  // "Posté par cetipar" is the reliable end-of-content marker on every Canalblog page.
  // Use lookahead ((?=...)) so we never stop early at a nested </div>.
  let content = null;
  const extractionPatterns = [
    // post_body_content (blog post pages)
    /<div[^>]*class="[^"]*\bpost_body_content\b[^"]*"[^>]*>([\s\S]+?)(?=Post[eé]\s+par\s+cetipar)/i,
    // post_body (static pages)
    /<div[^>]*class="[^"]*\bpost_body\b[^"]*"[^>]*>([\s\S]+?)(?=Post[eé]\s+par\s+cetipar)/i,
    // post-body (hyphenated)
    /<div[^>]*class="[^"]*\bpost-body\b[^"]*"[^>]*>([\s\S]+?)(?=Post[eé]\s+par\s+cetipar)/i,
    // entry-content
    /<div[^>]*class="[^"]*\bentry[-_]content\b[^"]*"[^>]*>([\s\S]+?)(?=Post[eé]\s+par\s+cetipar)/i,
    // page_post_content
    /<div[^>]*class="[^"]*\bpage[-_](?:post[-_])?content\b[^"]*"[^>]*>([\s\S]+?)(?=Post[eé]\s+par\s+cetipar)/i,
    // article tag
    /<article[^>]*>([\s\S]+?)(?=Post[eé]\s+par\s+cetipar)/i,
    // fallback: from the h2 title to the marker
    /<h2[^>]*>[\s\S]*?<\/h2>([\s\S]+?)(?=Post[eé]\s+par\s+cetipar)/i,
  ];

  for (const p of extractionPatterns) {
    const m = html.match(p);
    if (m && m[1].trim().length > 300) {
      content = m[1];
      break;
    }
  }

  // Last resort: truncate everything after "Posté par cetipar"
  if (!content) {
    const markerIdx = html.search(/Post[eé]\s+par\s+cetipar/i);
    content = markerIdx > 100 ? html.substring(0, markerIdx) : html;
  }

  // ── Step 3: HTML → Markdown conversion ───────────────────
  let md = content;

  // 3a. New format: ob-row-N-col divs (image.canalblog.com)
  // Each div contains N images displayed side by side.
  md = md.replace(
    /<div[^>]*\bclass="ob-row-(\d)-col"[^>]*>([\s\S]*?)<\/div>/gi,
    (_, _n, inner) => {
      const urls = [];
      const re = /href="(https:\/\/image\.canalblog\.com[^"]+)"/gi;
      let m;
      while ((m = re.exec(inner)) !== null) urls.push(m[1]);
      if (!urls.length) return '';
      return '\n\n' + urls.map(u => `![](${u})`).join(' ') + '\n\n';
    }
  );

  // 3b. Old format: <p> containing ONLY storage.canalblog.com image links
  // Group multiple images in the same <p> on the same markdown line.
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (match, inner) => {
    const storRe = /<a[^>]*href="(https:\/\/storage\.canalblog\.com\/[^"]+)"[^>]*>[\s\S]*?<\/a>/gi;
    const urls = [];
    let sm;
    while ((sm = storRe.exec(inner)) !== null) urls.push(sm[1]);
    if (!urls.length) return match; // no storage images, leave for later
    // Strip image links + whitespace; if nothing meaningful remains → image-only paragraph
    const stripped = inner
      .replace(/<a[^>]*href="https:\/\/storage\.canalblog\.com\/[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '')
      .replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '').trim();
    if (!stripped) return '\n\n' + urls.map(u => `![](${u})`).join(' ') + '\n\n';
    return match; // mixed content, leave for later
  });

  // 3c. Remaining standalone storage image links (outside <p>)
  md = md.replace(
    /<a[^>]*href="(https:\/\/storage\.canalblog\.com\/[^"]+)"[^>]*>[\s\S]*?<\/a>/gi,
    (_, url) => `\n\n![](${url})\n\n`
  );

  // 3d. Standalone <img src="storage..."> (no anchor)
  md = md.replace(
    /<img[^>]*src="(https:\/\/storage\.canalblog\.com\/[^"]+)"[^>]*(?:alt="([^"]*)")?[^>]*\/?>/gi,
    (_, src, alt) => `\n\n![${alt || ''}](${src})\n\n`
  );

  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, c) => `\n\n${c}\n\n`);

  for (let i = 6; i >= 1; i--) {
    md = md.replace(new RegExp(`<h${i}[^>]*>(.*?)<\/h${i}>`, 'gi'), '\n\n' + '#'.repeat(i) + ' $1\n\n');
  }

  md = md.replace(/<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, '**$1**');
  md = md.replace(/<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, '_$1_');
  md = md.replace(/<[^>]+>/g, ''); // strip remaining tags

  // ── Step 4: decode HTML entities ─────────────────────────
  md = md
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&laquo;/g, '«').replace(/&raquo;/g, '»')
    .replace(/&eacute;/g, 'é').replace(/&egrave;/g, 'è').replace(/&ecirc;/g, 'ê')
    .replace(/&euml;/g, 'ë').replace(/&agrave;/g, 'à').replace(/&acirc;/g, 'â')
    .replace(/&ocirc;/g, 'ô').replace(/&ucirc;/g, 'û').replace(/&ugrave;/g, 'ù')
    .replace(/&iuml;/g, 'ï').replace(/&ccedil;/g, 'ç').replace(/&oe?lig;/g, 'œ')
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, c) => String.fromCharCode(parseInt(c, 16)));

  // ── Step 5: post-process - remove any navigation remnants ─
  const NAV_PATTERNS = [
    /^(Tous les blogs|Top blogs|MENU|Connexion|Créer mon blog|Suivre ce blog|Editer la page|Administration|Partager|Vous aimez|Vous aimerez aussi|Hall of Game|J'accepte|Je m'abonne|Lire plus|Préférences cookies|Albums Photos|Publicité)\s*[>]?\s*$/i,
    /cetipar\.canalblog\.com\/(pages|archives|albums|contact|top|summary|user)\//i,
    /canalblog\.com\/(cf\/|terms|abuse|cookies|user\/)/i,
    /Voir le profil de cetipar/i,
    /Créer un blog gratuit/i,
    /Signaler un abus/i,
    /^(Image: Image\s*)+$/i,
    /Exprimez vos choix/i,
    /Webedia et ses/i,
  ];
  const lines = md.split('\n');
  md = lines
    .filter(line => !NAV_PATTERNS.some(p => p.test(line.trim())))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');

  return md.trim();
}

// ── Extract cover image URL ───────────────────────────────────
function extractCoverUrl(html) {
  // og:image is reliable for both old (storage.canalblog.com) and new (image.canalblog.com) formats
  const ogMatch = html.match(/property="og:image"[^>]*content="([^"]+)"|content="([^"]+)"[^>]*property="og:image"/i);
  const ogUrl = ogMatch ? ogMatch[1] || ogMatch[2] : null;
  // Exclude profile pictures (not article covers)
  if (ogUrl && !ogUrl.includes('profilepics.canalblog.com')) return ogUrl;
  // Fallback: storage.canalblog.com _o.jpg
  const storageMatch = html.match(/https:\/\/storage\.canalblog\.com\/[^\s"'<>]+_o\.jpg/);
  return storageMatch ? storageMatch[0] : null;
}

// ── Extract short description (first paragraph of text) ───────
function extractShortDescription(markdown, maxLen = 200) {
  const paras = markdown.split('\n\n').filter(p => p.trim() && !p.startsWith('!') && !p.startsWith('#'));
  const first = paras[0] || '';
  return first.replace(/[*_#]/g, '').substring(0, maxLen).trim();
}

// ── Slugify ────────────────────────────────────────────────────
function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── SQL escape ────────────────────────────────────────────────
const MAX_CONTENT_LENGTH = 80_000; // D1 statement-size safety limit

function sq(str) {
  const s = (str || '').substring(0, MAX_CONTENT_LENGTH);
  return s.replace(/'/g, "''");
}

// ── Fetch a page with retry ────────────────────────────────────
async function fetchPage(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'fr-FR,fr;q=0.9',
        },
        redirect: 'follow',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      console.warn(`  Attempt ${i + 1} failed for ${url}: ${err.message}`);
      if (i < retries - 1) await sleep(2000 * (i + 1));
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
}

// ── Main ───────────────────────────────────────────────────────
async function main() {
  console.log('🌍 Canalblog import script');
  console.log(`   ${VOYAGES.length} voyages to import\n`);

  const sqlLines = [];

  sqlLines.push('-- =====================================================');
  sqlLines.push('-- Canalblog import - generated by import-canalblog.js');
  sqlLines.push(`-- Generated: ${new Date().toISOString()}`);
  sqlLines.push('-- =====================================================\n');

  // 1. Insert folders
  sqlLines.push('-- Folders');
  for (const f of FOLDERS) {
    sqlLines.push(
      `INSERT OR IGNORE INTO folders (name, slug, icon, sort_order) VALUES ('${sq(f.name)}', '${f.slug}', '${f.icon}', ${f.sort_order});`
    );
  }
  sqlLines.push('');

  // 2. Fetch and insert articles
  for (let i = 0; i < VOYAGES.length; i++) {
    const v = VOYAGES[i];
    console.log(`[${i + 1}/${VOYAGES.length}] Fetching: ${v.title}`);

    let markdown = '';
    let coverUrl = null;

    try {
      const html = await fetchPage(v.url);
      markdown = htmlToMarkdown(html);
      coverUrl = extractCoverUrl(html);
      console.log(`  ✓ ${markdown.length} chars, cover: ${coverUrl ? coverUrl.substring(0, 60) + '…' : 'none'}`);
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`);
      markdown = `Contenu temporairement indisponible. Voir l'original : ${v.url}`;
    }

    const slug = slugify(v.title);
    const shortDesc = extractShortDescription(markdown);

    // Throttle requests
    if (i < VOYAGES.length - 1) await sleep(1500);

    sqlLines.push(`-- Article: ${v.title}`);
    // UPDATE existing row to overwrite any previously-polluted content
    sqlLines.push(
      `UPDATE articles SET ` +
      `content = '${sq(markdown)}', ` +
      `short_description = '${sq(shortDesc)}', ` +
      `cover_url = ${coverUrl ? `'${sq(coverUrl)}'` : 'NULL'}, ` +
      `updated_at = CURRENT_TIMESTAMP ` +
      `WHERE slug = '${sq(slug)}';`
    );
    sqlLines.push('');
  }

  const sqlOutput = sqlLines.join('\n');
  const outputPath = fileURLToPath(new URL('./canalblog-import.sql', import.meta.url));
  writeFileSync(outputPath, sqlOutput, 'utf8');
  console.log(`\n✅ SQL file written: scripts/canalblog-import.sql`);
  console.log(`\nNext step:`);
  console.log(`  cd backend`);
  console.log(`  npx wrangler d1 execute tranquille-vacances-db --local --file=scripts/canalblog-import.sql`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
