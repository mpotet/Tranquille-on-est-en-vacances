/**
 * pages/print.js - Print/export page for articles (PDF + Word)
 */
import { html } from '../utils.js';
import { safeText } from '../helpers/html.js';
import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType } from 'docx';

// Max rendered width for embedded images, in EMU (docx unit). 1 inch = 914400
// EMU; the printable text column at our margins is ~6 inches ≈ 5.5M EMU.
const MAX_IMG_WIDTH_EMU = 5486400;

/** Read intrinsic pixel dimensions from JPEG/PNG/GIF/WebP header bytes. */
function imageDimensions(bytes) {
  const b = bytes;
  // PNG: width/height are big-endian uint32 at offset 16/20.
  if (b.length > 24 && b[0] === 0x89 && b[1] === 0x50) {
    return { w: (b[16] << 24) | (b[17] << 16) | (b[18] << 8) | b[19], h: (b[20] << 24) | (b[21] << 16) | (b[22] << 8) | b[23], type: 'png' };
  }
  // GIF: little-endian uint16 at offset 6/8.
  if (b.length > 10 && b[0] === 0x47 && b[1] === 0x49) {
    return { w: b[6] | (b[7] << 8), h: b[8] | (b[9] << 8), type: 'gif' };
  }
  // JPEG: scan SOF markers for height/width.
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { h: (b[i + 5] << 8) | b[i + 6], w: (b[i + 7] << 8) | b[i + 8], type: 'jpg' };
      }
      i += 2 + ((b[i + 2] << 8) | b[i + 3]);
    }
  }
  // WebP (RIFF….WEBP): VP8/VP8L/VP8X - fall back to a default aspect if unparsed.
  return { w: 0, h: 0, type: 'jpg' };
}

/**
 * Resolve one image URL to { data: Uint8Array, w, h, type } or null on failure.
 * R2-hosted images (`/r2/<key>`) are read straight from the bucket binding;
 * external URLs are fetched. Any failure returns null so the export never breaks.
 */
async function loadImage(url, env, publicUrl) {
  try {
    let buf;
    let key = null;
    if (url.startsWith('/r2/')) key = url.slice(4);
    else if (publicUrl && url.startsWith(publicUrl + '/r2/')) key = url.slice((publicUrl + '/r2/').length);

    if (key && env?.PHOTOS) {
      const obj = await env.PHOTOS.get(decodeURIComponent(key));
      if (!obj) return null;
      buf = new Uint8Array(await obj.arrayBuffer());
    } else if (/^https?:\/\//i.test(url)) {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return null;
      buf = new Uint8Array(await res.arrayBuffer());
    } else {
      return null;
    }
    if (!buf || buf.length < 24) return null;
    const dim = imageDimensions(buf);
    return { data: buf, ...dim };
  } catch {
    return null;
  }
}

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

// ──────────────────────────────────────────────────────────────
// Word export
// ──────────────────────────────────────────────────────────────

/** Decode the handful of HTML entities that actually appear in stored content. */
function decodeEntities(s) {
  return String(s || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&rsquo;/g, "'")
    .replace(/&hellip;/g, '…')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&[a-z]+;/gi, ' '); // drop any remaining unknown entity
}

/**
 * Parse a single block of inline content (already stripped of block tags) into
 * an array of docx TextRun with bold/italic runs preserved. Handles both HTML
 * (`<strong>`, `<em>`, `<b>`, `<i>`) and Markdown (`**bold**`, `*italic*`).
 */
function inlineRuns(rawHtml) {
  // Single-char control sentinels (never present in real prose) mark emphasis
  // toggles: =bold on, =bold off, =italic on, =italic off.
  let s = String(rawHtml || '')
    .replace(/<\s*(strong|b)\s*>/gi, '\x01').replace(/<\s*\/\s*(strong|b)\s*>/gi, '\x02')
    .replace(/<\s*(em|i)\s*>/gi, '\x03').replace(/<\s*\/\s*(em|i)\s*>/gi, '\x04')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  s = decodeEntities(s);

  // Markdown emphasis -> same sentinels.
  s = s
    .replace(/\*\*([^*]+)\*\*/g, '\x01$1\x02')
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1\x03$2\x04');

  const runs = [];
  let bold = false, italic = false, buf = '';
  const flush = () => { if (buf) { runs.push(new TextRun({ text: buf, bold, italics: italic })); buf = ''; } };
  for (const ch of s) {
    if (ch === '\x01') { flush(); bold = true; }
    else if (ch === '\x02') { flush(); bold = false; }
    else if (ch === '\x03') { flush(); italic = true; }
    else if (ch === '\x04') { flush(); italic = false; }
    else buf += ch;
  }
  flush();
  return runs.length ? runs : [new TextRun('')];
}

/**
 * Turn stored article content (HTML from the WYSIWYG editor, or raw Markdown)
 * into an ordered list of block descriptors: { type, text }.
 */
function parseBlocks(content) {
  const raw = String(content || '').trim();
  const blocks = [];

  const pushImages = (htmlFragment) => {
    const imgs = [...htmlFragment.matchAll(/<img[^>]*>/gi)];
    for (const [tag] of imgs) {
      const src = (tag.match(/src="([^"]+)"/i) || tag.match(/src='([^']+)'/i) || [])[1];
      const alt = (tag.match(/alt="([^"]*)"/i) || [])[1] || '';
      if (src) blocks.push({ type: 'image', url: src, text: alt });
    }
  };

  if (raw.startsWith('<')) {
    // HTML: split on block-level tags, keep the tag name to map to a style.
    const blockRe = /<(h1|h2|h3|h4|p|li|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi;
    let m;
    while ((m = blockRe.exec(raw)) !== null) {
      const tag = m[1].toLowerCase();
      const inner = m[2].trim();
      // Extract any images in this block first (order is approximate but fine).
      if (/<img/i.test(inner)) pushImages(inner);
      const textOnly = inner.replace(/<img[^>]*>/gi, '').trim();
      if (!textOnly) continue;
      const type = tag === 'p' ? 'p'
        : tag === 'li' ? 'li'
        : tag === 'blockquote' ? 'quote'
        : tag; // h1..h4
      blocks.push({ type, text: textOnly });
    }
    if (blocks.length) return blocks;
  }

  // Markdown (or HTML that didn't match): split on blank lines.
  raw.split(/\n{2,}/).forEach(chunk => {
    const line = chunk.trim();
    if (!line) return;
    // A standalone image (Markdown or a bare <img>).
    let mi;
    if ((mi = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/))) {
      blocks.push({ type: 'image', url: mi[2].trim(), text: mi[1] });
      return;
    }
    if (/^<img[^>]*>$/i.test(line)) { pushImages(line); return; }
    let m2;
    if ((m2 = line.match(/^(#{1,4})\s+(.*)$/))) {
      blocks.push({ type: 'h' + m2[1].length, text: m2[2] });
    } else if (/^>\s?/.test(line)) {
      blocks.push({ type: 'quote', text: line.replace(/^>\s?/gm, '') });
    } else if (/^[-*+]\s+/.test(line)) {
      line.split(/\n/).forEach(li => {
        const t = li.replace(/^[-*+]\s+/, '').trim();
        if (t) blocks.push({ type: 'li', text: t });
      });
    } else {
      blocks.push({ type: 'p', text: line });
    }
  });
  return blocks;
}

/** Build the Paragraph(s) for one block. `resolvedImg` is set for image blocks. */
function blockToParagraphs(block, resolvedImg) {
  if (block.type === 'image') {
    if (!resolvedImg || !resolvedImg.data) {
      // Image couldn't be loaded - degrade to a caption placeholder.
      const label = block.text ? `[Photo : ${block.text}]` : '[Photo]';
      return [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [new TextRun({ text: label, italics: true, color: '888888', size: 20 })] })];
    }
    // Scale to fit the text column while preserving aspect ratio.
    let w = resolvedImg.w || 800, h = resolvedImg.h || 600;
    const emuPerPx = 9525; // 914400 EMU / 96 px per inch
    let wEmu = w * emuPerPx, hEmu = h * emuPerPx;
    if (wEmu > MAX_IMG_WIDTH_EMU) { const r = MAX_IMG_WIDTH_EMU / wEmu; wEmu = MAX_IMG_WIDTH_EMU; hEmu = Math.round(hEmu * r); }
    const out = [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: block.text ? 40 : 200 },
      children: [new ImageRun({ type: resolvedImg.type, data: resolvedImg.data, transformation: { width: Math.round(wEmu / emuPerPx), height: Math.round(hEmu / emuPerPx) } })],
    })];
    if (block.text) {
      out.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: block.text, italics: true, color: '888888', size: 20 })] }));
    }
    return out;
  }

  const runs = inlineRuns(block.text);
  switch (block.type) {
    case 'h1': return [new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 160 }, children: runs })];
    case 'h2': return [new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 140 }, children: runs })];
    case 'h3': return [new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 240, after: 120 }, children: runs })];
    case 'h4': return [new Paragraph({ heading: HeadingLevel.HEADING_4, spacing: { before: 200, after: 100 }, children: runs })];
    case 'li': return [new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: runs })];
    case 'quote': return [new Paragraph({ spacing: { before: 120, after: 120, line: 300 }, indent: { left: 480 }, children: inlineRuns(block.text).map(r => new TextRun({ ...r, italics: true })) })];
    default: return [new Paragraph({ spacing: { after: 160, line: 320 }, children: runs })];
  }
}

export async function exportWordDocx(article, env) {
  const title = article.title || 'Export';
  const destination = article.destination || '';
  const dateRange = fmtDateRange(article);
  const publicUrl = (article.publicUrl || env?.PUBLIC_URL || '').replace(/\/$/, '');

  const header = [];
  if (destination) {
    header.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: destination.toUpperCase(), bold: true, color: '0057B8', size: 22 })],
    }));
  }
  header.push(new Paragraph({
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: title })],
  }));
  if (dateRange) {
    header.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: dateRange, italics: true, color: '666666' })],
    }));
  }

  const blocks = parseBlocks(article.content);

  // Resolve every image in parallel (cap to avoid pathological documents).
  const imageBlocks = blocks.filter(b => b.type === 'image').slice(0, 60);
  const resolved = new Map();
  await Promise.all(imageBlocks.map(async b => {
    resolved.set(b, await loadImage(b.url, env, publicUrl));
  }));

  const bodyParagraphs = [];
  for (const b of blocks) {
    for (const p of blockToParagraphs(b, resolved.get(b))) bodyParagraphs.push(p);
  }

  const doc = new Document({
    creator: 'Tranquille, on est en vacances',
    title,
    description: `Récit de voyage : ${title}`,
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 24 } },
      },
    },
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1418, right: 1418 } } },
      children: [...header, ...bodyParagraphs],
    }],
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
<title>${title} - Export</title>
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
      ${destination ? "<div class=\"cover-eyebrow\"><svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"currentColor\" style=\"vertical-align:-1px;margin-right:.3em\"><path d=\"M22 16.5v-2l-8.5-5V3.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v6l-8.5 5v2l8.5-2.6V19l-2.5 1.5V22l4-1 4 1v-1.5L14 19v-5.6l8 2.6z\"/></svg> " + destination + "</div>" : ''}
      <h1 class="cover-title">${title}</h1>
      <div class="cover-meta">
        ${dateRange ? "<span><svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" style=\"vertical-align:-2px;margin-right:.3em\"><rect x=\"3\" y=\"4\" width=\"18\" height=\"18\" rx=\"2\"/><path d=\"M16 2v4M8 2v4M3 10h18\"/></svg>" + dateRange + "</span>" : ''}
        ${destination ? "<span><svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" style=\"vertical-align:-2px;margin-right:.3em\"><path d=\"M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z\"/><circle cx=\"12\" cy=\"10\" r=\"3\"/></svg>" + destination + "</span>" : ''}
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
async function exportWord() {
  var btn = document.querySelector('.tb-btn-word');
  var prev = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.style.opacity = '.6'; btn.innerHTML = 'Export…'; }
  try {
    var id = window.location.pathname.split('/')[3];
    var res = await fetch('/admin/articles/' + id + '/export-word');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var blob = await res.blob();

    // Prefer the filename the server sent (RFC 5987 filename* first).
    var name = 'export.docx';
    var cd = res.headers.get('Content-Disposition') || '';
    var star = cd.match(/filename\\*=UTF-8''([^;]+)/i);
    var plain = cd.match(/filename="([^"]+)"/i);
    if (star) name = decodeURIComponent(star[1]);
    else if (plain) name = plain[1];

    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function() { URL.revokeObjectURL(url); }, 5000);
  } catch (err) {
    alert('Échec de l\\'export Word : ' + err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.style.opacity = ''; btn.innerHTML = prev; }
  }
}
</script>
</body>
</html>`);
}
