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
    // Walk block-level elements AND <figure> in document order. The previous
    // version only matched h1-h4/p/li/blockquote, so every photo - which the
    // editor stores as <figure><img>...</figure>, outside all of those - was
    // silently dropped: a real article exported 0 of its 133 images. Scanning
    // both in one pass also keeps text and photos in their true order rather
    // than approximating it.
    const blockRe = /<(h1|h2|h3|h4|p|li|blockquote|figure|div)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
    let m;
    while ((m = blockRe.exec(raw)) !== null) {
      const tag = m[1].toLowerCase();
      const attrs = m[2] || '';
      const inner = m[3].trim();

      // A .img-pair wraps two <figure>s meant to sit side by side. Word has no
      // simple equivalent here, so emit them as consecutive images (flagged so
      // the caller can lay them out) rather than losing them: blockRe would
      // otherwise consume the wrapper and skip past its children.
      if (tag === 'div') {
        if (/img-pair/i.test(attrs)) pushImages(inner);
        continue;
      }
      if (tag === 'figure') { pushImages(inner); continue; }

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

/** Decode a `data:image/...;base64,...` URI into the shape loadImage returns. */
function decodeDataUri(uri) {
  try {
    const m = /^data:image\/(png|jpe?g|gif);base64,(.+)$/i.exec(uri || '');
    if (!m) return null;
    const bin = atob(m[2]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    if (bytes.length < 24) return null;
    return { data: bytes, ...imageDimensions(bytes) };
  } catch { return null; }
}

/**
 * `prescaled` maps original image URL -> data: URI of a browser-downscaled
 * copy. Embedding the full-size originals server-side meant fetching and
 * packing ~50MB for a 133-photo article, which exceeded the Worker's CPU
 * limit and returned HTTP 1102 instead of a document. The browser downscales
 * them first (see collectDownscaledImages), so this only has to assemble.
 */
export async function exportWordDocx(article, env, prescaled) {
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

  // Resolve every image. The old hard cap of 60 silently dropped every photo
  // past that point - a real 133-image article exported barely half of them,
  // with no warning. Travel articles here routinely run to 130+ photos, so
  // the cap has to clear that comfortably.
  //
  // Loading them in bounded batches rather than all at once: firing 130+
  // concurrent fetches at the same origin makes the slowest ones exceed
  // loadImage's own timeout and come back empty, so raising the cap alone
  // would still have lost images.
  const imageBlocks = blocks.filter(b => b.type === 'image').slice(0, 400);
  const resolved = new Map();
  const scaled = prescaled || {};
  // Anything the browser already downscaled is used as-is - no fetch, no
  // full-size decode. Only images it couldn't handle (canvas failure, or an
  // image not present in the rendered page) fall back to being fetched here.
  const missing = [];
  for (const b of imageBlocks) {
    const hit = scaled[b.url] ? decodeDataUri(scaled[b.url]) : null;
    if (hit) resolved.set(b, hit);
    else missing.push(b);
  }
  const BATCH = 12;
  for (let i = 0; i < missing.length; i += BATCH) {
    const batch = missing.slice(i, i + BATCH);
    await Promise.all(batch.map(async b => {
      resolved.set(b, await loadImage(b.url, env, publicUrl));
    }));
  }

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

  // Packer.toBuffer() asks JSZip for a "nodebuffer", which only exists in
  // Node - on the Workers runtime it throws "nodebuffer is not supported by
  // this platform" and the whole export 500s (every Word export was failing).
  // toBlob() uses a plain Blob, which Workers supports natively.
  const blob = await Packer.toBlob(doc);
  return new Uint8Array(await blob.arrayBuffer());
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
  /* Lighter, current-looking bar: the previous one was a heavy dark slab
     with a flat drop shadow. Now a translucent frosted surface matching the
     rest of the site, with the title centred and actions grouped right. */
  .toolbar {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    background: rgba(255,255,255,.86);
    -webkit-backdrop-filter: saturate(180%) blur(12px);
    backdrop-filter: saturate(180%) blur(12px);
    color: var(--ink);
    display: flex;
    align-items: center;
    gap: .75rem;
    padding: .7rem 1.25rem;
    font-family: 'Montserrat', sans-serif;
    font-size: .85rem;
    border-bottom: 1px solid rgba(26,43,60,.10);
  }
  .toolbar strong {
    font-size: .92rem; font-weight: 700; flex: 1; min-width: 0;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    color: var(--ink);
  }
  .tb-back {
    display: inline-flex; align-items: center; gap: .35rem;
    color: var(--ink-muted); text-decoration: none; font-size: .82rem;
    font-weight: 600; padding: .45rem .7rem; border-radius: 999px;
    transition: background .15s, color .15s;
  }
  .tb-back:hover { background: rgba(26,43,60,.06); color: var(--ink); }
  .tb-btn {
    display: inline-flex; align-items: center; gap: .4rem;
    padding: .5rem 1.05rem; border-radius: 999px; font-weight: 700;
    font-size: .82rem; cursor: pointer; border: none;
    transition: transform .12s, box-shadow .15s, background .15s;
    font-family: 'Montserrat', sans-serif;
  }
  .tb-btn:hover { transform: translateY(-1px); }
  .tb-btn:active { transform: none; }
  .tb-btn:disabled { opacity: .55; cursor: progress; transform: none; }
  .tb-btn-pdf  { background: var(--blue); color: #fff; box-shadow: 0 2px 8px rgba(0,87,184,.28); }
  .tb-btn-pdf:hover { box-shadow: 0 4px 14px rgba(0,87,184,.34); }
  .tb-btn-word { background: #fff; color: var(--ink); border: 1px solid rgba(26,43,60,.16); }
  .tb-btn-word:hover { background: #F8FAFC; }
  @media (max-width: 640px) {
    .toolbar { padding: .6rem .75rem; gap: .4rem; }
    .toolbar strong { display: none; }
    .tb-btn { padding: .5rem .8rem; }
  }

  /* ── Page layout (screen) ─────── */
  /* Matches the fixed toolbar's real height (measured 61px) - at 56px the
     top of the article slid under the bar. */
  body { padding-top: 64px; }
  .book { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }

  /* ── Header ─────────────────────
     Was a full-bleed cover image with page-break-after, which burned an
     entire sheet on a title before the story even started (a travel diary
     export is meant to be read/printed, not published as a book). Now a
     compact masthead: same title/destination/dates, but text-only, in flow,
     and the article starts right underneath on page 1. */
  .cover {
    position: relative;
    margin-bottom: 2rem;
    padding-bottom: 1.25rem;
    border-bottom: 2px solid var(--line);
  }
  /* The cover photo is dropped entirely - it duplicated the first image of
     the article in every export seen. */
  .cover-img, .cover-overlay { display: none; }
  .cover-body { padding: 0; color: var(--ink); }
  .cover-eyebrow {
    font-family: 'Crimson Pro', serif;
    font-size: .9rem;
    font-style: italic;
    color: var(--ink-muted);
    margin-bottom: .3rem;
    letter-spacing: .04em;
  }
  .cover-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 2rem;
    font-weight: 800;
    line-height: 1.2;
    margin-bottom: .5rem;
    color: var(--ink);
  }
  .cover-meta {
    display: flex; flex-wrap: wrap; gap: .75rem;
    font-size: .85rem; font-family: 'Crimson Pro', serif;
    color: var(--ink-muted);
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
  /* Side-by-side pairs. The editor stores these as
     .img-pair > figure.img-half > img, so the old ".img-pair img { width:50% }"
     sized the IMAGE to half of its figure - and the figure itself still took
     the full line, so the two photos ended up stacked and half-width instead
     of side by side (reported). Size the figures, not the images. */
  .img-pair {
    display: flex; gap: .5rem; margin: 1.5rem 0;
    align-items: flex-start;
    page-break-inside: avoid; break-inside: avoid;
  }
  .img-pair > figure,
  .img-pair > * { flex: 1 1 0; min-width: 0; margin: 0; }
  .img-pair img { width: 100%; max-width: 100%; height: auto; display: block; border-radius: .5rem; }

  /* ── Print-specific ────────────── */
  /* Word export progress overlay. Building a 130-photo document takes tens
     of seconds of canvas work + zipping; without this the tab just appears
     to hang. */
  #export-overlay {
    position: fixed; inset: 0; z-index: 200; display: none;
    align-items: center; justify-content: center;
    background: rgba(26,43,60,.55);
    -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);
  }
  .eo-card {
    background: #fff; border-radius: 1rem; padding: 1.75rem 2rem;
    width: min(360px, 88vw); text-align: center;
    box-shadow: 0 20px 50px rgba(0,0,0,.28);
    font-family: 'Montserrat', sans-serif;
  }
  .eo-spinner {
    width: 34px; height: 34px; margin: 0 auto .9rem;
    border: 3px solid rgba(0,87,184,.18); border-top-color: var(--blue);
    border-radius: 50%; animation: eo-spin .8s linear infinite;
  }
  @keyframes eo-spin { to { transform: rotate(360deg); } }
  .eo-label { font-size: .9rem; font-weight: 700; color: var(--ink); margin-bottom: .75rem; }
  .eo-bar { height: 6px; border-radius: 999px; background: rgba(26,43,60,.10); overflow: hidden; }
  .eo-bar-fill { height: 100%; width: 0%; border-radius: 999px; background: var(--blue); transition: width .25s ease; }
  .eo-hint { margin-top: .7rem; font-size: .74rem; color: var(--ink-muted); }

  @media print {
    .toolbar { display: none !important; }
    body { padding-top: 0; }
    .book { max-width: 100%; padding: 0; }
    /* No min-height/page-break here any more: the header is a masthead the
       article follows directly, not a standalone cover page. */
    .cover { border-radius: 0; }
    .img-row, .img-row-2, .img-row-3 {
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    }
  }

  @page {
    size: A4 portrait;
    margin: 2.2cm 2.5cm 2.2cm 3cm;
  }
  /* @page :first used to drop the margins so the cover image could bleed to
     the paper edge. With no cover page, page 1 must keep the same margins as
     every other page or the header would sit flush against the edge. */
</style>
</head>
<body>

<div class="toolbar no-print">
  <!-- A real link, not history.back(): this page is opened with
       target="_blank" from the editor, so the new tab has no history to go
       back to and the button did nothing (reported). -->
  <a href="/admin/editor/${article.id}" class="tb-back">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
    Retour
  </a>
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

  <!-- Masthead. The cover image markup was removed with the cover page:
       it was hidden by CSS but the browser still downloaded it, and it
       duplicated the article's own first photo. -->
  <div class="cover">
    <div class="cover-body">
      ${destination ? '<div class="cover-eyebrow">' + destination + '</div>' : ''}
      <h1 class="cover-title">${title}</h1>
      <div class="cover-meta">
        ${dateRange ? '<span>' + dateRange + '</span>' : ''}
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
// Title/destination/dates for the Word export, which is generated in the
// browser (see exportWord) and so needs them client-side.
const EXPORT_META = ${JSON.stringify({ title, destination, dateRange })};

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

  // The editor's per-image controls are saved INTO the article HTML (the
  // delete "×", the split-to-half and alt-text buttons), so they came
  // straight through into the exported PDF/Word - the "×" rendering as a
  // stray cross above every photo (reported). They are editing chrome, never
  // content: strip them before anything else looks at the markup.
  wrapper.querySelectorAll('.img-delete, .img-split, .img-expand, .img-alt, .img-pair-add, .img-alt-preview, [data-editor-only]').forEach(el => el.remove());
  // contenteditable/draggable/lazy-loading are editor concerns too, and
  // loading="lazy" in particular can leave images unrendered in a print
  // snapshot that never scrolls.
  wrapper.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
  wrapper.querySelectorAll('img').forEach(img => {
    img.removeAttribute('draggable');
    img.removeAttribute('loading');
    img.removeAttribute('decoding');
  });

  // Keep /r2/ images on the CURRENT origin rather than rewriting them to
  // PUBLIC_URL: the Word export downscales them through a <canvas>, and a
  // cross-origin image taints the canvas, making toDataURL() throw. The
  // original path is kept in data-export-src so the server can still resolve
  // the image from R2 for any that fail to downscale.
  wrapper.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src') || '';
    if (src.startsWith('/r2/')) img.setAttribute('data-export-src', src);
    // Images served from another origin (older articles stored with an
    // absolute URL) taint the canvas and can't be downscaled. Requesting them
    // with CORS keeps the canvas clean; if the server declines, the export
    // still falls back to fetching that image server-side.
    else if (/^https?:[/][/]/i.test(src)) img.crossOrigin = 'anonymous';
  });

  // Wrap lone/multiple images in figure or image grid
  wrapper.querySelectorAll('p').forEach(p => {
    const imgs = p.querySelectorAll('img');
    const text = p.childNodes;
    const onlyImgs = [...text].every(n => n.nodeType === 3 ? n.textContent.trim() === '' : n.tagName === 'IMG');

    if (!onlyImgs || imgs.length === 0) return;

    if (imgs.length === 1) {
      const fig = document.createElement('figure');
      // No figcaption from alt: the stored alts are Word-import filenames
      // ("word image 36"), not descriptions, so printing them put a line of
      // noise under every photo. Matches the public render (helpers/render.js).
      fig.appendChild(imgs[0].cloneNode());
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
// The .docx is built HERE, in the browser, not on the Worker. Assembling a
// photo-heavy article server-side meant fetching ~50MB of full-size originals
// and zipping them inside Cloudflare's per-request CPU budget, which failed
// outright with "Worker exceeded resource limits" (HTTP 1102). Downscaling the
// images first still wasn't enough - the zipping alone blew the budget. The
// browser has no such limit and already holds every image decoded, so it does
// the whole job and the server is not involved at all.
var DOCX_CDN = 'https://cdn.jsdelivr.net/npm/docx@9.7.1/dist/index.iife.js';
var _docxLib = null;
function loadDocxLib() {
  if (_docxLib) return Promise.resolve(_docxLib);
  return new Promise(function (resolve, reject) {
    var s = document.createElement('script');
    s.src = DOCX_CDN;
    s.onload = function () {
      _docxLib = window.docx;
      _docxLib ? resolve(_docxLib) : reject(new Error('librairie Word indisponible'));
    };
    s.onerror = function () { reject(new Error('telechargement de la librairie Word impossible')); };
    document.head.appendChild(s);
  });
}

// Full-screen progress overlay: generating a 130-photo document takes tens of
// seconds, and without feedback the page just looks frozen.
function exportOverlay() {
  var el = document.getElementById('export-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'export-overlay';
    el.className = 'no-print';
    el.innerHTML =
      '<div class="eo-card">' +
      '<div class="eo-spinner"></div>' +
      '<div class="eo-label" id="eo-label">Preparation...</div>' +
      '<div class="eo-bar"><div class="eo-bar-fill" id="eo-bar-fill"></div></div>' +
      '<div class="eo-hint">Ne fermez pas cet onglet</div>' +
      '</div>';
    document.body.appendChild(el);
  }
  return {
    show: function () { el.style.display = 'flex'; },
    hide: function () { el.style.display = 'none'; },
    set: function (label, pct) {
      var l = document.getElementById('eo-label');
      var f = document.getElementById('eo-bar-fill');
      if (l) l.textContent = label;
      if (f) f.style.width = Math.max(0, Math.min(100, pct)) + '%';
    },
  };
}

// Downscale one <img> to a print-sized JPEG and return raw bytes.
// 1100px at q0.72 is already beyond what an A4 text column (~6in) resolves.
function imageToBytes(img) {
  var MAX_W = 1100;
  var scale = Math.min(1, MAX_W / img.naturalWidth);
  var w = Math.max(1, Math.round(img.naturalWidth * scale));
  var h = Math.max(1, Math.round(img.naturalHeight * scale));
  var canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d').drawImage(img, 0, 0, w, h);
  return new Promise(function (resolve) {
    canvas.toBlob(function (blob) {
      if (!blob) { resolve(null); return; }
      blob.arrayBuffer().then(function (buf) {
        resolve({ data: new Uint8Array(buf), w: w, h: h });
      }).catch(function () { resolve(null); });
    }, 'image/jpeg', 0.72);
  });
}

// Walk the rendered article in document order so the Word file mirrors what
// is on screen - same sequence of paragraphs, headings and photos.
async function buildDocxBlocks(D, onProgress) {
  var body = document.getElementById('article-body');
  var nodes = body.querySelectorAll('p, h1, h2, h3, h4, blockquote, li, .img-pair, figure, img');
  var out = [];
  var seen = new Set();
  var totalImgs = body.querySelectorAll('img').length, doneImgs = 0;

  // Photos the editor placed side by side (a .img-pair row) are emitted as a
  // borderless 2-column table - that is how Word represents "these two sit on
  // the same line". Rendered as plain consecutive paragraphs they would stack
  // vertically, losing the layout the article was written with.
  var makeImageParagraph = function (bytes, maxW) {
    var dw = bytes.w, dh = bytes.h;
    if (dw > maxW) { dh = Math.round(dh * (maxW / dw)); dw = maxW; }
    return new D.Paragraph({
      alignment: D.AlignmentType.CENTER,
      spacing: { before: 0, after: 0 },
      children: [new D.ImageRun({ type: 'jpg', data: bytes.data, transformation: { width: dw, height: dh } })],
    });
  };
  var noBorder = { style: D.BorderStyle.NONE, size: 0, color: 'FFFFFF' };

  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];

    if (n.classList && n.classList.contains('img-pair')) {
      var pairImgs = [].slice.call(n.querySelectorAll('img')).filter(function (im) { return !seen.has(im); });
      if (!pairImgs.length) continue;
      var cells = [];
      for (var q = 0; q < pairImgs.length; q++) {
        seen.add(pairImgs[q]);
        var pb = null;
        try {
          if (pairImgs[q].complete && pairImgs[q].naturalWidth) pb = await imageToBytes(pairImgs[q]);
        } catch (e) { /* skip an undecodable photo rather than fail the export */ }
        doneImgs++;
        if (onProgress) onProgress(doneImgs, totalImgs);
        // Half the text column, minus a little breathing room between cells.
        cells.push(new D.TableCell({
          width: { size: Math.floor(100 / pairImgs.length), type: D.WidthType.PERCENTAGE },
          margins: { top: 60, bottom: 60, left: 60, right: 60 },
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
          children: [pb ? makeImageParagraph(pb, Math.floor(560 / pairImgs.length)) : new D.Paragraph({ children: [] })],
        }));
      }
      out.push(new D.Table({
        width: { size: 100, type: D.WidthType.PERCENTAGE },
        borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder },
        rows: [new D.TableRow({ children: cells })],
      }));
      // Word collapses two adjacent tables into one; a spacer paragraph keeps
      // consecutive pairs visually separate.
      out.push(new D.Paragraph({ spacing: { after: 160 }, children: [] }));
      continue;
    }

    if (n.tagName === 'IMG' || n.tagName === 'FIGURE') {
      var img = n.tagName === 'IMG' ? n : n.querySelector('img');
      if (!img || seen.has(img)) continue;
      seen.add(img);
      var bytes = null;
      try {
        if (img.complete && img.naturalWidth) bytes = await imageToBytes(img);
      } catch (e) { /* undecodable image: skipped rather than failing the export */ }
      doneImgs++;
      if (onProgress) onProgress(doneImgs, totalImgs);
      if (bytes) {
        var maxW = 600;
        var dw = bytes.w, dh = bytes.h;
        if (dw > maxW) { dh = Math.round(dh * (maxW / dw)); dw = maxW; }
        out.push(new D.Paragraph({
          alignment: D.AlignmentType.CENTER,
          spacing: { before: 120, after: 200 },
          children: [new D.ImageRun({ type: 'jpg', data: bytes.data, transformation: { width: dw, height: dh } })],
        }));
      }
      continue;
    }
    if (n.closest('figure')) continue;
    // Built with String.fromCharCode rather than written as escape
    // sequences: this page is a template literal, which converts such
    // escapes into real control characters and splits the regex in two -
    // the same trap applies to writing them in a comment, which is how
    // this very line broke the page the first time round.
    var WS = new RegExp('[' + String.fromCharCode(32, 9, 13, 10) + ']+', 'g');
    var text = (n.textContent || '').replace(WS, ' ').trim();
    if (!text) continue;
    var tag = n.tagName.toLowerCase();
    if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4') {
      var levels = { h1: D.HeadingLevel.HEADING_1, h2: D.HeadingLevel.HEADING_2, h3: D.HeadingLevel.HEADING_3, h4: D.HeadingLevel.HEADING_4 };
      out.push(new D.Paragraph({ heading: levels[tag], spacing: { before: 280, after: 140 }, children: [new D.TextRun({ text: text })] }));
    } else if (tag === 'li') {
      out.push(new D.Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [new D.TextRun({ text: text })] }));
    } else if (tag === 'blockquote') {
      out.push(new D.Paragraph({ spacing: { before: 120, after: 120, line: 300 }, indent: { left: 480 }, children: [new D.TextRun({ text: text, italics: true })] }));
    } else {
      out.push(new D.Paragraph({ spacing: { after: 160, line: 320 }, children: [new D.TextRun({ text: text })] }));
    }
  }
  return out;
}

async function exportWord() {
  var btn = document.querySelector('.tb-btn-word');
  var ov = exportOverlay();
  if (btn) { btn.disabled = true; }
  ov.show();
  ov.set('Chargement du generateur...', 5);
  try {
    var D = await loadDocxLib();

    ov.set('Preparation des images...', 10);
    var blocks = await buildDocxBlocks(D, function (done, total) {
      var pct = total ? 10 + Math.round((done / total) * 70) : 40;
      ov.set('Images ' + done + '/' + total, pct);
    });

    ov.set('Assemblage du document...', 85);
    var header = [];
    if (EXPORT_META.destination) {
      header.push(new D.Paragraph({ alignment: D.AlignmentType.CENTER, spacing: { after: 80 },
        children: [new D.TextRun({ text: EXPORT_META.destination.toUpperCase(), bold: true, color: '0057B8', size: 22 })] }));
    }
    header.push(new D.Paragraph({ heading: D.HeadingLevel.TITLE, alignment: D.AlignmentType.CENTER, spacing: { after: 120 },
      children: [new D.TextRun({ text: EXPORT_META.title })] }));
    if (EXPORT_META.dateRange) {
      header.push(new D.Paragraph({ alignment: D.AlignmentType.CENTER, spacing: { after: 400 },
        children: [new D.TextRun({ text: EXPORT_META.dateRange, italics: true, color: '666666' })] }));
    }

    var doc = new D.Document({
      creator: 'Tranquille, on est en vacances',
      title: EXPORT_META.title,
      description: 'Recit de voyage : ' + EXPORT_META.title,
      styles: { default: { document: { run: { font: 'Calibri', size: 24 } } } },
      sections: [{
        properties: { page: { margin: { top: 1134, bottom: 1134, left: 1418, right: 1418 } } },
        children: header.concat(blocks),
      }],
    });

    ov.set('Creation du fichier...', 95);
    var blob = await D.Packer.toBlob(doc);

    // Same escaping trap: shorthand character classes don't survive the
    // template literal, so the allowed set is spelled out as ranges.
    var BAD = new RegExp('[^A-Za-z0-9 ._-]', 'g');
    var name = (EXPORT_META.title || 'export').replace(BAD, '').replace(/[ ]+/g, ' ').trim().substring(0, 80) + '.docx';
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    ov.set('Termine', 100);
    setTimeout(function () { ov.hide(); }, 600);
  } catch (err) {
    ov.hide();
    alert('Echec de l export Word : ' + (err && err.message ? err.message : err));
  } finally {
    if (btn) { btn.disabled = false; }
  }
}
</script>
</body>
</html>`);
}
