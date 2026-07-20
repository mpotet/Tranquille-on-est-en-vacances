/**
 * pages/print.js - Print/export page for articles (PDF + Word)
 */
import { html } from '../utils.js';
import { safeText } from '../helpers/html.js';
import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, AlignmentType, WidthType, BorderStyle, convertInchesToTwip } from 'docx';

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtDateRange(a) {
  const s = a.start_date || a.date;
  const e = a.end_date   || a.date;
  if (!s) return '';
  return s === e ? fmtDate(s) : `${fmtDate(s)} - ${fmtDate(e)}`;
}

export async function exportWordDocx(article) {
  const title = article.title || 'Export';
  const destination = article.destination || '';
  const dateRange = fmtDateRange(article);

  const sections = [
    new Paragraph({
      text: destination,
      style: 'Heading3',
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: title,
      style: 'Heading1',
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: dateRange,
      spacing: { after: 400, line: 360 },
      pageBreakBefore: true,
    }),
  ];

  // Simple text extraction from HTML content
  const content = (article.content || '')
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  sections.push(
    new Paragraph({
      text: content,
      spacing: { after: 200, line: 360 },
    })
  );

  const doc = new Document({
    sections: [{ children: sections }],
  });

  return await Packer.toBuffer(doc);
}

export function printPage(article) {
  const title       = safeText(article.title || '');
  const destination = safeText(article.destination || '');
  const dateRange   = fmtDateRange(article);
  const coverUrl    = article.cover_url || '';
  const publicUrl   = article.publicUrl || '';

  const contentJson = JSON.stringify(article.content || '').replace(/<\//g, '<\\/');
  const titleJson   = JSON.stringify(title);
  const publicJson  = JSON.stringify(publicUrl);

  return html(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Export</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink: #1A2B3C;
    --ink-muted: #4A5568;
    --line: #E2E8F0;
    --blue: #0057B8;
  }

  html, body {
    font-family: 'Crimson Pro', Georgia, serif;
    font-size: 12pt;
    color: var(--ink);
    background: #fff;
    line-height: 1.8;
  }

  /* ── Screen-only toolbar ─────── */
  .toolbar {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    background: #1A2B3C;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: .75rem 1.5rem;
    font-family: 'Montserrat', sans-serif;
    font-size: .85rem;
    box-shadow: 0 2px 12px rgba(0,0,0,.25);
  }
  .toolbar strong { font-size: .9rem; font-weight: 700; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .toolbar a { color: rgba(255,255,255,.65); text-decoration: none; font-size: .8rem; }
  .toolbar a:hover { color: #fff; }
  .tb-btn {
    display: inline-flex; align-items: center; gap: .4rem;
    padding: .45rem 1rem; border-radius: 999px; font-weight: 700;
    font-size: .8rem; cursor: pointer; border: none; transition: opacity .15s;
    font-family: 'Montserrat', sans-serif;
  }
  .tb-btn:hover { opacity: .85; }
  .tb-btn-pdf  { background: var(--blue); color: #fff; }
  .tb-btn-word { background: rgba(255,255,255,.14); color: #fff; border: 1px solid rgba(255,255,255,.25); }

  /* ── Page layout (screen) ─────── */
  body { padding-top: 56px; }
  .book { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }

  /* ── Cover page ─────────────── */
  .cover {
    position: relative;
    width: 100%;
    min-height: 520px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    border-radius: 1rem;
    overflow: hidden;
    margin-bottom: 3rem;
    page-break-after: always;
    break-after: page;
  }
  .cover-img {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover;
  }
  .cover-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(10,20,35,.85) 40%, rgba(10,20,35,.25) 100%);
  }
  .cover-body {
    position: relative; z-index: 2;
    padding: 2.5rem 2.5rem 2.5rem;
    color: #fff;
  }
  .cover-eyebrow {
    font-family: 'Crimson Pro', serif;
    font-size: .9rem;
    font-style: italic;
    opacity: .8;
    margin-bottom: .6rem;
    letter-spacing: .04em;
  }
  .cover-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 2.6rem;
    font-weight: 800;
    line-height: 1.15;
    margin-bottom: 1rem;
    text-shadow: 0 2px 8px rgba(0,0,0,.35);
  }
  .cover-meta {
    display: flex; flex-wrap: wrap; gap: .75rem;
    font-size: .85rem; font-family: 'Crimson Pro', serif;
    opacity: .85;
  }
  .cover-meta span { display: flex; align-items: center; gap: .3rem; }

  /* ── Article body ─────────────── */
  .article-body { font-size: 12pt; line-height: 1.85; color: var(--ink); }

  .article-body h1 { font-family: 'Playfair Display', serif; font-size: 1.9rem; font-weight: 800; margin: 2.5rem 0 1rem; line-height: 1.2; }
  .article-body h2 { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 700; margin: 2.2rem 0 .9rem; line-height: 1.25; }
  .article-body h3 { font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 700; margin: 1.8rem 0 .7rem; color: var(--ink-muted); }
  .article-body p  { margin: 0 0 1.1rem; }
  .article-body strong { font-weight: 600; }
  .article-body em { font-style: italic; color: #2E7D6B; }
  .article-body ul, .article-body ol { margin: 1rem 0 1rem 1.5rem; }
  .article-body li { margin-bottom: .35rem; }
  .article-body blockquote {
    border-left: 3px solid var(--blue);
    padding: .6rem 1rem;
    margin: 1.5rem 0;
    font-style: italic;
    color: var(--ink-muted);
    background: #F8FAFC;
    border-radius: 0 .5rem .5rem 0;
  }
  .article-body hr { border: none; border-top: 1px solid var(--line); margin: 2rem 0; }
  .article-body a  { color: var(--blue); }

  .article-body figure {
    margin: 1.5rem 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .article-body figure img {
    width: 100%; max-width: 100%;
    height: auto; display: block;
    border-radius: .5rem;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .article-body figcaption {
    font-size: .82rem; font-style: italic;
    color: var(--ink-muted); text-align: center;
    margin-top: .4rem;
  }

  /* image grids → stacked in print */
  .img-row, .img-row-2, .img-row-3 {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: .5rem;
    margin: 1.5rem 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .img-row > *, .img-row-2 > *, .img-row-3 > * {
    min-width: 0;
    overflow: hidden;
    border-radius: .5rem;
  }
  .img-row img, .img-row-2 img, .img-row-3 img {
    width: 100%; max-width: 100%;
    height: auto; display: block;
  }
  .img-pair { display: flex; gap: .5rem; margin: 1.5rem 0; }
  .img-pair img { width: 50%; max-width: 50%; height: auto; display: block; border-radius: .5rem; object-fit: cover; }

  /* ── Print-specific ────────────── */
  @media print {
    .toolbar { display: none !important; }
    body { padding-top: 0; }
    .book { max-width: 100%; padding: 0; }
    .cover { border-radius: 0; min-height: 100vh; margin-bottom: 0; }
    .cover-title { font-size: 3rem; }
    .img-row, .img-row-2, .img-row-3 {
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    }
  }

  @page {
    size: A4 portrait;
    margin: 2.2cm 2.5cm 2.2cm 3cm;
  }

  @page :first {
    margin: 0;
  }
</style>
</head>
<body>

<div class="toolbar no-print">
  <a href="javascript:history.back()">< Retour</a>
  <strong>${title}</strong>
  <button class="tb-btn tb-btn-word" onclick="exportWord()">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8" fill="none" stroke="currentColor" stroke-width="2"/></svg>
    Word
  </button>
  <button class="tb-btn tb-btn-pdf" onclick="window.print()">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
    Imprimer / PDF
  </button>
</div>

<div class="book" id="book-root">

  <!-- ── Cover ─────────────────────────────────── -->
  <div class="cover">
    ${coverUrl ? "<img class=\"cover-img\" src=\"" + (coverUrl.startsWith('/r2/') ? publicUrl + coverUrl : coverUrl) + "\" alt=\"\">" : '<svg class="cover-img" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#0057B8;stop-opacity:1" /><stop offset="100%" style="stop-color:#003D82;stop-opacity:1" /></linearGradient><pattern id="dots" patternUnits="userSpaceOnUse" width="40" height="40"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="1200" height="800" fill="url(#grad1)"/><rect width="1200" height="800" fill="url(#dots)"/></svg>'}
    <div class="cover-overlay"></div>
    <div class="cover-body">
      ${destination ? "<div class=\"cover-eyebrow\">✈ " + destination + "</div>" : ''}
      <h1 class="cover-title">${title}</h1>
      <div class="cover-meta">
        ${dateRange ? "<span>📅 " + dateRange + "</span>" : ''}
        ${destination ? "<span>📍 " + destination + "</span>" : ''}
      </div>
    </div>
  </div>

  <!-- ── Content ───────────────────────────────── -->
  <div class="article-body" id="article-body"></div>

</div>

<script src="https://cdn.jsdelivr.net/npm/marked@9/marked.min.js"></script>
<script>
const RAW_CONTENT = ${contentJson};
const PUBLIC_URL  = ${publicJson};

function fixMd(s) {
  return (s||'')
    .replace(/\\*\\* +/g,'**').replace(/ +\\*\\*/g,'**')
    .replace(/!\\[\\]\\(\\s*\\)/g,'').replace(/!\\[\\]\\s*$/gm,'')
    .trim();
}

function renderContent(raw) {
  const body = document.getElementById('article-body');
  const trimmed = (raw||'').trim();
  const wrapper = document.createElement('div');
  wrapper.innerHTML = trimmed.startsWith('<')
    ? trimmed
    : marked.parse(fixMd(raw));

  // Rewrite relative R2 URLs to absolute
  wrapper.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src') || '';
    if (src.startsWith('/r2/')) img.src = PUBLIC_URL + src;
  });

  // Wrap lone/multiple images in figure or image grid
  wrapper.querySelectorAll('p').forEach(p => {
    const imgs = p.querySelectorAll('img');
    const text = p.childNodes;
    const onlyImgs = [...text].every(n => n.nodeType === 3 ? n.textContent.trim() === '' : n.tagName === 'IMG');

    if (!onlyImgs || imgs.length === 0) return;

    if (imgs.length === 1) {
      const fig = document.createElement('figure');
      const alt = imgs[0].alt;
      fig.appendChild(imgs[0].cloneNode());
      if (alt) { const cap = document.createElement('figcaption'); cap.textContent = alt; fig.appendChild(cap); }
      p.replaceWith(fig);
    } else if (imgs.length >= 2) {
      const wrapper = document.createElement('div');
      wrapper.className = imgs.length === 2 ? 'img-pair' : 'img-row';
      [...imgs].forEach(img => wrapper.appendChild(img.cloneNode()));
      p.replaceWith(wrapper);
    }
  });

  body.appendChild(wrapper);
}

renderContent(RAW_CONTENT);

// ── Word export ──────────────────────────────────────────────
function exportWord() {
  var id = window.location.pathname.split('/')[3];
  fetch('/admin/articles/' + id + '/export-word').then(function(r) { return r.blob(); }).then(function(blob) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'export.docx';
    a.click();
    setTimeout(function() { URL.revokeObjectURL(url); }, 5000);
  }).catch(function(err) { alert('Error: ' + err.message); });
}
</script>
</body>
</html>`);
}
