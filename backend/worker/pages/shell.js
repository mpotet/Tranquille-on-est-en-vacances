/**
 * pages/shell.js - Shared HTML shell (head + nav + footer) injected into every page.
 */

// Every page's <head>, including Open Graph / Twitter Card social preview tags
// so a shared link (WhatsApp, iMessage, Facebook...) shows a real title/image
// instead of a bare URL. `opts` lets a specific page (an article) override the
// defaults with its own cover photo / canonical URL / og:type; callers that
// pass nothing still get sane site-wide defaults, so this is safe everywhere.
export const HEAD = (
  title = 'Tranquille, on est en vacances',
  description = "Le carnet de bord des voyages de la famille Potet",
  opts = {}
) => {
  const {
    image = 'https://tranquille-vacances.esti-archi.workers.dev/icon-512.png',
    url = '',
    type = 'website',
  } = opts;
  return `
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="${description}">
<meta name="theme-color" content="#0057B8">
<title>${title}</title>
<script>
// Applied before any CSS/paint so a saved dark-mode preference doesn't flash
// light-then-dark on load. Reads localStorage only - if unset, the
// prefers-color-scheme media query in the stylesheet takes over on its own.
(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();
</script>
<link rel="icon" href="/icon-192.png" type="image/png">
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/icon-192.png">
${url ? `<link rel="canonical" href="${url}">` : ''}
<link rel="alternate" type="application/rss+xml" title="Tranquille, on est en vacances" href="/feed.xml">
<!-- Open Graph -->
<meta property="og:site_name" content="Tranquille, on est en vacances">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${image}">
${url ? `<meta property="og:url" content="${url}">` : ''}
<meta property="og:locale" content="fr_FR">
<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">
<!-- Pre-built, purged Tailwind stylesheet (see tailwind.config.js / npm run
     build:css) — replaces the cdn.tailwindcss.com <script>, which shipped the
     full JIT compiler to every visitor and recompiled all classes in-browser
     on every single page load. This static file is generated once at build
     time and is a fraction of the size. -->
<link rel="stylesheet" href="/tailwind.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;1,500&family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css">
<link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css">
<script src="https://cdn.jsdelivr.net/npm/marked@9/marked.min.js"></script>
<style>
/* ── Design tokens ─────────────────────────────────────────── */
:root {
  color-scheme: light;
  --blue:          #0057B8;
  --blue-dark:     #003D80;
  --blue-light:    #EBF2FD;
  --blue-rgb:      0,87,184;
  --sky:           #69C6E8;
  --sky-rgb:       105,198,232;
  --sand:          #F4E8D3;
  --sand-rgb:      244,232,211;
  --sand-deep:     #E8D5B8;
  --apricot:       #FFC78A;
  --apricot-rgb:   255,199,138;
  --palm:          #2E7D6B;
  --palm-rgb:      46,125,107;
  --palm-light:    #E6F4F1;
  --cream:         #FFFDF9;
  --cream-rgb:     255,253,249;
  --ink:           #1A2B3C;
  --ink-rgb:       26,43,60;
  --ink-muted:     #5A6A7A;
  --ink-light:     #8A9BAC;
  --danger:        #DC3C3C;
  --danger-rgb:    220,60,60;
  --pending:       #9A5B12;   /* deep amber - "brouillon / en attente / archivé" ink */
  --pending-rgb:   154,91,18;
  --line:          rgba(26,43,60,.10);
  --card-shadow:   0 2px 12px rgba(26,43,60,.06), 0 8px 28px rgba(26,43,60,.04);
  --hover-shadow:  0 8px 36px rgba(0,87,184,.18);
}

/* ── Dark mode ─────────────────────────────────────────────────
   Every color in the site is already a var(--token) reference (design system
   built that way from the start), so a dark theme is just re-pointing the
   base surface/text/line tokens - no component CSS below needs to change.
   Brand accents (--blue, --palm, --apricot, --danger…) stay the same in both
   themes; only what changes is what's a "page background" vs "ink" here.
   Activated either by the OS preference or by #theme-toggle writing
   data-theme to <html> (see the script at the bottom of NAV()). */
[data-theme="dark"] {
  color-scheme: dark;
  --cream:      #14202E;
  --cream-rgb:  20,32,46;
  --sand:       #1C2C3D;
  --sand-rgb:   28,44,61;
  --sand-deep:  #24384D;
  --ink:        #F1F5F9;
  --ink-rgb:    241,245,249;
  --ink-muted:  #AEBDCC;
  --ink-light:  #7C8CA0;
  --line:       rgba(241,245,249,.12);
  --card-shadow: 0 2px 12px rgba(0,0,0,.28), 0 8px 28px rgba(0,0,0,.22);
  --blue-light: rgba(0,87,184,.18);
  --palm-light: rgba(46,125,107,.16);
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --cream:      #14202E;
    --cream-rgb:  20,32,46;
    --sand:       #1C2C3D;
    --sand-rgb:   28,44,61;
    --sand-deep:  #24384D;
    --ink:        #F1F5F9;
    --ink-rgb:    241,245,249;
    --ink-muted:  #AEBDCC;
    --ink-light:  #7C8CA0;
    --line:       rgba(241,245,249,.12);
    --card-shadow: 0 2px 12px rgba(0,0,0,.28), 0 8px 28px rgba(0,0,0,.22);
    --blue-light: rgba(0,87,184,.18);
    --palm-light: rgba(46,125,107,.16);
  }
}

/* ── Base ──────────────────────────────────────────────────── */
html { scroll-behavior: smooth; background: var(--cream); }
body { min-height: 100vh; background: var(--cream); color: var(--ink); font-family: Montserrat, sans-serif; }
/* Plain white surfaces (Tailwind's bg-white utility, and native form controls
   which browsers render white regardless of page CSS) still need an explicit
   flip in dark mode - unlike .panel/.section-panel below, these aren't part of
   the token system, so a rule swap is the correct fix here (not a token). */
[data-theme="dark"] .bg-white, [data-theme="dark"] input,
[data-theme="dark"] textarea, [data-theme="dark"] select {
  background: var(--sand) !important;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .bg-white, :root:not([data-theme="light"]) input,
  :root:not([data-theme="light"]) textarea, :root:not([data-theme="light"]) select {
    background: var(--sand) !important;
  }
}

/* ── Typography ────────────────────────────────────────────── */
.font-display, h1, h2, h3 { font-family: "Playfair Display", Georgia, serif; }

/* ── Eyebrow label ─────────────────────────────────────────── */
.eyebrow {
  display: inline-flex; align-items: center; gap: .5rem;
  padding: .45rem .9rem; border-radius: 999px;
  background: rgba(var(--apricot-rgb), .18);
  border: 1px solid rgba(var(--apricot-rgb), .42);
  color: var(--palm); font-size: .7rem; letter-spacing: .18em;
  text-transform: uppercase; font-weight: 700;
}
.eyebrow::before { content: '✦'; color: var(--apricot); font-size: .8rem; }

/* ── Buttons ───────────────────────────────────────────────── */
.btn-primary {
  display: inline-flex; align-items: center; justify-content: center; gap: .55rem;
  padding: .85rem 1.75rem; border-radius: 999px;
  background: var(--blue); color: #fff; font-weight: 700; font-size: .92rem; letter-spacing: .02em;
  border: 2px solid var(--blue);
  box-shadow: 0 6px 22px rgba(var(--blue-rgb), .28);
  transition: transform .2s, box-shadow .2s, background .2s;
}
.btn-primary:hover { background: var(--blue-dark); border-color: var(--blue-dark); transform: translateY(-2px); box-shadow: 0 10px 32px rgba(var(--blue-rgb), .38); }
.btn-primary:focus-visible { outline: 3px solid rgba(var(--blue-rgb), .5); outline-offset: 3px; }

.btn-ghost {
  display: inline-flex; align-items: center; justify-content: center; gap: .55rem;
  padding: .82rem 1.6rem; border-radius: 999px;
  background: rgba(var(--cream-rgb),.9); color: var(--blue); font-weight: 700; font-size: .92rem;
  border: 2px solid rgba(var(--blue-rgb), .28);
  transition: transform .2s, box-shadow .2s, background .2s, border-color .2s;
}
.btn-ghost:hover { background: var(--blue-light); border-color: var(--blue); transform: translateY(-2px); box-shadow: 0 6px 22px rgba(var(--blue-rgb), .12); }

/* alias for existing code using action-btn / subtle-btn / action-btn-sm */
.action-btn    { display:inline-flex;align-items:center;justify-content:center;gap:.55rem;padding:.85rem 1.75rem;border-radius:999px;background:var(--blue)!important;color:#fff!important;font-weight:700;font-size:.92rem;letter-spacing:.02em;border:2px solid var(--blue)!important;box-shadow:0 6px 22px rgba(var(--blue-rgb),.28);transition:transform .2s,box-shadow .2s,background .2s; }
.action-btn:hover  { background:var(--blue-dark)!important;border-color:var(--blue-dark)!important;transform:translateY(-2px);box-shadow:0 10px 32px rgba(var(--blue-rgb),.38); }
.action-btn-sm { display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:.58rem 1.15rem;border-radius:999px;background:var(--blue)!important;color:#fff!important;font-weight:700;font-size:.82rem;border:2px solid var(--blue)!important;box-shadow:0 4px 14px rgba(var(--blue-rgb),.22);transition:transform .2s,box-shadow .2s,background .2s; }
.action-btn-sm:hover { background:var(--blue-dark)!important;border-color:var(--blue-dark)!important;transform:translateY(-2px); }
.subtle-btn    { display:inline-flex;align-items:center;justify-content:center;gap:.55rem;padding:.82rem 1.6rem;border-radius:999px;background:var(--blue-light);color:var(--blue);font-weight:700;font-size:.92rem;border:2px solid rgba(var(--blue-rgb),.28);transition:transform .2s,box-shadow .2s,background .2s,border-color .2s; }
.subtle-btn:hover { background:var(--blue);color:#fff;border-color:var(--blue);transform:translateY(-2px); }
.ghost-btn { display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:.56rem .9rem;border-radius:999px;background:transparent;color:var(--ink-muted);font-size:.82rem;font-weight:600;border:1px solid var(--line);transition:color .2s,background .2s; }
.ghost-btn:hover { color:var(--blue);background:var(--blue-light); }

/* ── Cards ─────────────────────────────────────────────────── */
.card {
  background: var(--cream); border: 1px solid var(--line);
  box-shadow: var(--card-shadow); border-radius: 1.5rem;
  transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease;
}
.card:hover { transform: translateY(-5px); box-shadow: var(--hover-shadow); border-color: rgba(var(--blue-rgb), .18); }

.voyage-card {
  background: var(--cream); border: 1px solid var(--line);
  box-shadow: var(--card-shadow); border-radius: 1.5rem; overflow: hidden;
  transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease;
}
.voyage-card:hover { transform: translateY(-5px); box-shadow: var(--hover-shadow); border-color: rgba(var(--blue-rgb), .18); }
.voyage-card img { filter: saturate(1.04) contrast(1.02); }

/* ── Panel (frosted surface) ───────────────────────────────── */
.panel {
  background: rgba(var(--cream-rgb),.96); border: 1px solid rgba(var(--sand-rgb), .7);
  border-radius: 1.5rem; box-shadow: var(--card-shadow);
}
/* alias */
.section-panel, .glass-panel, .majorelle-frame, .majorelle-showcase { background: rgba(var(--cream-rgb),.96)!important; border: 1px solid rgba(var(--sand-rgb), .7)!important; box-shadow: var(--card-shadow)!important; }
/* Plain white card with a thin line border + the theme's soft shadow - the
   pattern repeated inline for comments/prev-next cards on the voyage page.
   No border-radius here on purpose: call sites already set their own via a
   Tailwind rounded-* class. */
.card-line { background: var(--cream); border: 1px solid var(--line); box-shadow: var(--card-shadow); }

/* ── Full-bleed photo hero ──────────────────────────────────── */
.hero-photo {
  position: relative; overflow: hidden;
  background: linear-gradient(135deg, #0057B8 0%, #003D80 40%, #2E7D6B 100%);
}
.hero-photo-img {
  position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
  filter: saturate(1.1) brightness(.88);
}
.hero-photo-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(10,18,30,.22) 0%,
    rgba(10,18,30,.36) 40%,
    rgba(10,18,30,.68) 100%
  );
}
.hero-photo-content { position: relative; z-index: 2; }

/* ── Section panel used in admin ───────────────────────────── */
.metric-card { background: linear-gradient(135deg,var(--cream) 0%,var(--sand) 100%)!important; border: 1px solid rgba(var(--sand-rgb),.8)!important; box-shadow: var(--card-shadow)!important; border-radius: 1.25rem; }
.majorelle-stat { background: linear-gradient(135deg,var(--cream) 0%,var(--sand) 100%)!important; border: 1px solid rgba(var(--sand-rgb),.8)!important; box-shadow: var(--card-shadow)!important; }

/* ── Quote block ───────────────────────────────────────────── */
.quote-block {
  background: linear-gradient(135deg, var(--blue-light) 0%, rgba(var(--sky-rgb),.10) 100%);
  border: 1px solid rgba(var(--blue-rgb), .12); border-radius: 2rem;
  padding: 2.5rem 2rem;
}

/* ── Divider ────────────────────────────────────────────────── */
.divider {
  height: 1px; width: 100%;
  background: linear-gradient(90deg, transparent, rgba(var(--blue-rgb),.14), rgba(var(--apricot-rgb),.36), rgba(var(--blue-rgb),.14), transparent);
}
/* alias */
.luxe-divider { height:1px;width:100%;background:linear-gradient(90deg,transparent,rgba(var(--blue-rgb),.14),rgba(var(--apricot-rgb),.36),rgba(var(--blue-rgb),.14),transparent); }

/* ── Drame badge ────────────────────────────────────────────── */
.drame-badge {
  display: inline-flex; align-items: center; gap: .45rem;
  padding: .48rem 1rem; border-radius: 999px;
  border: 1px solid rgba(var(--apricot-rgb), .44);
  background: rgba(var(--apricot-rgb), .13);
  color: var(--palm); font-size: .85rem; font-style: italic; font-weight: 600;
}

/* ── Brand mark ─────────────────────────────────────────────── */
.brand-mark {
  display: grid; place-items: center; width: 2.4rem; height: 2.4rem;
  border-radius: .875rem; background: var(--blue-light);
  border: 1.5px solid rgba(var(--blue-rgb), .18);
}
.brand-title   { color: var(--blue)!important; letter-spacing: -.02em; }
.brand-subtitle { color: var(--ink-muted)!important; }

/* ── Nav links ──────────────────────────────────────────────── */
.nav-link, .mobile-nav-link {
  display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
  border-radius: 999px; font-size: .88rem; font-weight: 600;
  padding: .55rem .95rem; color: var(--ink-muted);
  border: 1px solid transparent;
  transition: color .2s, background .2s, border-color .2s;
}
.nav-link:hover, .mobile-nav-link:hover { color: var(--blue); background: var(--blue-light); border-color: rgba(var(--blue-rgb), .16); }
.nav-link-active { background: var(--blue)!important; color: #fff!important; border-color: var(--blue)!important; box-shadow: 0 4px 14px rgba(var(--blue-rgb),.26)!important; }

/* ── Status badges ──────────────────────────────────────────── */
.badge-published { background: var(--palm-light);              color: var(--palm);      border: 1px solid rgba(var(--palm-rgb),.28); }
.badge-draft     { background: var(--sand);                     color: var(--ink-muted); border: 1px solid var(--line); }
.badge-archived  { background: rgba(90,106,122,.10);             color: var(--ink-muted); border: 1px solid rgba(90,106,122,.22); }
.badge-pending   { background: rgba(var(--apricot-rgb),.20);     color: var(--pending);          border: 1px solid rgba(var(--apricot-rgb),.5); }

/* ── Period pills (admin analytics) ─────────────────────────── */
.period-pill{padding:.4rem .9rem;border-radius:999px;font-size:.78rem;font-weight:700;background:var(--cream);border:1.5px solid var(--line);color:var(--ink-muted);cursor:pointer;transition:all .15s}
.period-pill:hover{border-color:rgba(var(--blue-rgb),.3);color:var(--blue)}
.period-pill.is-active{background:var(--blue);border-color:var(--blue);color:#fff}

/* ── Status picker (article editor) ─────────────────────────── */
.status-option { border-color: var(--line); background: var(--cream); }
.status-option-icon { color: var(--ink-light); }
.status-option .status-btn-title { color: var(--ink-muted); }
.status-option .status-check { display: none; color: inherit; }
.status-option.is-active .status-check { display: block; }
.status-option.is-active .status-btn-title { color: var(--ink); }
.status-option[data-status="archived"].is-active  { border-color: rgba(90,106,122,.4);      background: rgba(90,106,122,.06); }
.status-option[data-status="archived"].is-active  .status-option-icon,
.status-option[data-status="archived"].is-active  .status-check { color: var(--ink-muted); }
.status-option[data-status="published"].is-active { border-color: rgba(var(--palm-rgb),.5); background: var(--palm-light); }
.status-option[data-status="published"].is-active .status-option-icon,
.status-option[data-status="published"].is-active .status-check { color: var(--palm); }
.status-option[data-status="publish_when_online"].is-active { border-color: rgba(var(--apricot-rgb),.6); background: rgba(var(--apricot-rgb),.14); }
.status-option[data-status="publish_when_online"].is-active .status-option-icon,
.status-option[data-status="publish_when_online"].is-active .status-check { color: var(--pending); }

/* ── Prose (article body) ───────────────────────────────────── */
.prose-vacation h1, .prose-vacation h2, .prose-vacation h3 { font-family: "Playfair Display", Georgia, serif; color: var(--ink); letter-spacing: -.02em; }
.prose-vacation h1 { font-size: 2rem; margin: 2rem 0 1rem; font-weight: 700; }
.prose-vacation h2 { font-size: 1.6rem; margin: 1.8rem 0 .9rem; font-weight: 700; }
.prose-vacation h3 { font-size: 1.25rem; margin: 1.4rem 0 .7rem; font-weight: 700; }
.prose-vacation p  { margin: 1rem 0; line-height: 1.85; color: var(--ink); }
.prose-vacation figure { margin: 2rem auto; max-width: 100%; }
.prose-vacation figure img { border-radius: 1rem; box-shadow: 0 8px 24px rgba(26,43,60,.12); margin: 0 auto; }
.prose-vacation figcaption { margin-top: .6rem; font-size: .85rem; color: var(--ink-muted); text-align: center; font-style: italic; }
.prose-vacation ul, .prose-vacation ol { margin: 1rem 0; padding-left: 1.5rem; color: var(--ink); }
.prose-vacation li { margin: .4rem 0; }
.prose-vacation strong { color: var(--ink); font-weight: 700; }
.prose-vacation em { color: var(--palm); font-weight: 600; }
.prose-vacation blockquote { border-left: 4px solid rgba(var(--blue-rgb),.30); padding: .75rem 0 .75rem 1rem; margin: 1.5rem 0; color: var(--ink-muted); font-style: italic; background: var(--blue-light); border-radius: 0 16px 16px 0; }
.prose-vacation a { color: var(--blue); text-decoration: underline; }
.prose-vacation hr { margin: 2rem 0; border-color: var(--line); }

/* ── Image grid rows (2 or 3 images side-by-side) ──────────── */
.img-row { display:grid; gap:.5rem; margin:1.5rem 0; }
.img-row-2 { grid-template-columns:1fr 1fr; }
.img-row-3 { grid-template-columns:1fr 1fr 1fr; }
.img-row > div { overflow:hidden; border-radius:.75rem; aspect-ratio:4/3; }
.img-row > div > img { width:100%; height:100%; object-fit:cover; display:block; border-radius:.75rem; box-shadow:0 4px 16px rgba(26,43,60,.10); cursor:zoom-in; }
@media(max-width:480px){ .img-row-2,.img-row-3 { grid-template-columns:1fr; } }
/* ── Half-width image pairs (WYSIWYG & public) ───────────────── */
.img-pair { display:flex; gap:.75rem; margin:1.5rem 0; }
.img-pair figure { flex:1; min-width:0; margin:0 !important; }
.img-pair figure img { width:100%; aspect-ratio:4/3; object-fit:cover; border-radius:.75rem; }
@media(max-width:640px){ .img-pair { flex-direction:column; } }
/* ── Rich text editor toolbar ────────────────────────────────── */
.toolbar-btn { display:inline-flex; align-items:center; justify-content:center; width:2rem; height:2rem; border-radius:.5rem; font-size:1rem; cursor:pointer; background:transparent; border:none; color:var(--ink-muted); transition:background .12s,color .12s; }
.toolbar-btn:hover { background:var(--sand); color:var(--ink); }
.toolbar-btn:active { background:var(--sand-deep); }
.toolbar-sep { display:inline-block; width:1px; height:1.1rem; background:var(--line); margin:0 .2rem; vertical-align:middle; }
/* On touch devices (phone/tablet - no hover capability), bump the toolbar
   buttons up to the ~44px minimum recommended touch target size. The admin
   writes articles from their phone while travelling, so mis-taps here (e.g.
   hitting "citation" instead of "gras" on a 32px button) are a real problem.
   Keep the compact 32px size for mouse-driven desktop use. */
@media (pointer: coarse) {
  .toolbar-btn { width:2.75rem; height:2.75rem; font-size:1.15rem; }
}
#e-content[data-placeholder]:empty:before { content:attr(data-placeholder); color:var(--ink-light); pointer-events:none; display:block; }

/* ── Lightbox ───────────────────────────────────────────────── */
.lightbox-bg { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }

/* ── Animations ─────────────────────────────────────────────── */
.page-in { animation: fadeUp .4s ease-out; }
@keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
.float-anim { animation: float 5s ease-in-out infinite; }
@keyframes float { 0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)} }
/* Staggered hero entrance: each element sets its own --d delay inline. */
.hero-anim { opacity:0; animation: heroUp .6s ease-out forwards; animation-delay: var(--d, 0ms); }
@keyframes heroUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
/* Slow Ken-Burns zoom on the hero background photo when present. */
.hero-photo-img { animation: heroZoom 1.8s ease-out both; }
@keyframes heroZoom { from { transform:scale(1.06); } to { transform:scale(1); } }
.scroll-cue { animation: float 2s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .page-in, .float-anim, .scroll-cue { animation: none!important; }
  .hero-anim { opacity:1!important; animation:none!important; }
  .hero-photo-img { animation:none!important; }
  .voyage-card, .card, .btn-primary, .btn-ghost, .action-btn, .subtle-btn { transition: none!important; }
  /* Lightbox zoom/pan image transform + the zoom control buttons' hover
     transitions were not covered by the rule above and kept animating even
     with "reduce motion" enabled at the OS level. */
  #lb-img, #lightbox button { transition: none!important; }
}

/* ── Admin ──────────────────────────────────────────────────── */
.folder-row { transition: background .14s, border-color .14s; border: 1px solid transparent; }
.folder-row:hover { background: var(--blue-light); border-color: rgba(var(--blue-rgb),.18); }

/* ── Utils ──────────────────────────────────────────────────── */
.line-clamp-2 { display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden; }
.line-clamp-3 { display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden; }

/* ── Scrollbar ──────────────────────────────────────────────── */
::-webkit-scrollbar { width: 7px; }
::-webkit-scrollbar-track { background: var(--sand); }
::-webkit-scrollbar-thumb { background: rgba(var(--blue-rgb),.30); border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background: rgba(var(--blue-rgb),.50); }

/* ── Tailwind colour overrides (keep light theme coherent) ── */
.bg-white   { background: var(--cream)!important; }
/* Tailwind's shadow-sm reads flat/generic (hard grey) next to the theme's
   softer double-diffuse .panel/.card shadow - used throughout admin.js for
   ordinary content cards, so this one override carries most of that visual
   gap without touching every call site individually. */
.shadow-sm  { box-shadow: var(--card-shadow)!important; }
.bg-stone-50, .bg-stone-100 { background: var(--cream)!important; }
.bg-stone-200, .hover\:bg-stone-200:hover { background: var(--sand-deep)!important; }
.bg-sky-50, .hover\:bg-sky-50:hover, .hover\:bg-sky-100:hover { background: var(--blue-light)!important; }
.bg-blue-50, .hover\:bg-blue-50:hover { background: var(--blue-light)!important; }
.bg-sky-500, .hover\:bg-sky-600:hover { background: var(--blue)!important; }
.bg-orange-500 { background: var(--palm)!important; }
.bg-emerald-50 { background: var(--palm-light)!important; }
.bg-amber-50   { background: rgba(var(--apricot-rgb),.18)!important; }
.bg-red-50, .hover\:bg-red-50:hover     { background: rgba(var(--danger-rgb),.07)!important; }
.bg-red-400, .bg-red-500  { background: var(--danger)!important; }
.text-red-400, .text-red-500, .text-red-600, .text-red-700, .hover\:text-red-500:hover { color: var(--danger)!important; }
.bg-black\/50, .bg-black\/40 { background: rgba(26,43,60,.72)!important; }
.text-stone-900, .text-stone-800, .text-stone-700 { color: var(--ink)!important; }
.text-stone-600, .text-stone-500 { color: var(--ink-muted)!important; }
.text-stone-400, .text-stone-300, .text-slate-400 { color: var(--ink-light)!important; }
.text-sky-600, .text-sky-700, .hover\:text-sky-600:hover, .hover\:text-sky-700:hover { color: var(--blue)!important; }
.text-emerald-600, .text-emerald-700, .hover\:text-emerald-600:hover { color: var(--palm)!important; }
.text-amber-600, .text-amber-700 { color: var(--palm)!important; }
.text-orange-500, .text-orange-400 { color: var(--palm)!important; }
.border-stone-100, .border-stone-200 { border-color: var(--line)!important; }
.border-sky-400, .focus\:border-sky-400:focus, .hover\:border-sky-300:hover { border-color: rgba(var(--blue-rgb),.30)!important; }
.border-sky-500 { border-color: var(--blue)!important; }
.border-orange-500 { border-color: var(--palm)!important; }
input, textarea, select { background: var(--cream)!important; color: var(--ink)!important; border-color: rgba(var(--blue-rgb),.18)!important; }
input::placeholder, textarea::placeholder { color: var(--ink-light); }
input:focus, textarea:focus, select:focus { border-color: rgba(var(--blue-rgb),.4)!important; box-shadow: 0 0 0 3px rgba(var(--blue-rgb),.10)!important; }
#dropzone { background: var(--blue-light)!important; border-color: rgba(var(--blue-rgb),.22)!important; }
#navbar { background: rgba(var(--cream-rgb),.94)!important; border-bottom: 1px solid rgba(var(--blue-rgb),.08)!important; box-shadow: 0 2px 14px rgba(26,43,60,.06)!important; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
#site-footer { background: linear-gradient(180deg, var(--cream) 0%, var(--sand) 100%)!important; border-top: 1px solid rgba(var(--sand-rgb),.8)!important; }
/* ── Easter egg : scène saharienne (voir tvPlayCamel dans NAV) ── */
/* Easter egg — mise en scène : le dromadaire commence à marcher sur le blog,
   PUIS un panneau (ciel/soleil/dunes) tombe du haut comme un décor de cinéma
   déployé en urgence (léger rebond), le dromadaire finit sa traversée, et à la
   fin le panneau remonte d'un coup - pas de fondu. */
.tv-sahara{position:fixed;inset:0;z-index:9998;overflow:hidden;pointer-events:none}
/* Le PANNEAU décor : fond doux dans la palette du blog. Retenu par le haut,
   il tombe (translateY) avec un rebond, puis remonte à la sortie. */
.tv-panel{position:absolute;inset:0;overflow:hidden;transform:translateY(-100%);
  background:linear-gradient(180deg,#6db6e0 0%,#a9d6ec 30%,#e8ecd8 52%,#ffe6bf 66%,#f4e8d3 78%,#ecdcbc 100%)}
.tv-panel.tv-drop{animation:tvdrop .85s cubic-bezier(.34,1.56,.64,1) forwards}   /* chute + rebond */
.tv-panel.tv-lift{animation:tvlift .5s cubic-bezier(.5,0,.75,0) forwards}         /* remontée nette */
@keyframes tvdrop{0%{transform:translateY(-100%)}100%{transform:translateY(0)}}
@keyframes tvlift{0%{transform:translateY(0)}100%{transform:translateY(-100%)}}
.tv-sun{position:absolute;left:50%;top:30%;width:180px;height:180px;margin:-90px 0 0 -90px;border-radius:50%;
  background:radial-gradient(circle,#fffef8 0%,#fff3d4 45%,#ffe6bf 62%,rgba(255,230,191,0) 74%);
  box-shadow:0 0 100px 40px rgba(255,224,160,.5)}
.tv-dune{position:absolute;left:-5%;width:110%}
.tv-dune1{bottom:0;height:16vh;background:#d9c199;border-radius:60% 40% 0 0/100% 100% 0 0;transform:scaleX(1.5)}
.tv-dune2{bottom:0;height:22vh;background:#e8d5b8;border-radius:55% 45% 0 0/100% 100% 0 0;left:-15%;width:70%}
.tv-dune3{bottom:0;height:18vh;background:#e0cba8;border-radius:50% 50% 0 0/100% 100% 0 0;left:45%;width:75%}
/* Le dromadaire : couche au-dessus du panneau. Il commence sa marche avant que
   le panneau tombe, donc on le voit brièvement sur le blog. */
.tv-camel{position:absolute;bottom:11vh;left:-180px;width:240px;z-index:5;will-change:transform;
  animation:tvcross 9s linear forwards;filter:drop-shadow(0 6px 8px rgba(90,58,26,.25))}
@keyframes tvcross{to{transform:translateX(calc(100vw + 220px))}}
.tv-bob{animation:tvbob .55s ease-in-out infinite;transform-origin:center bottom}
@keyframes tvbob{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-7px) rotate(1deg)}}
@media (prefers-reduced-motion: reduce){ .tv-camel{animation-duration:.01ms} .tv-bob{animation:none} .tv-panel.tv-drop,.tv-panel.tv-lift{animation-duration:.01ms} }

.gradient-text { color: var(--blue); }
</style>
`;
};

export const NAV = (active = '', authed = false) => `
<nav id="navbar" class="fixed top-0 left-0 right-0 z-50">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <a href="/" class="flex items-center gap-3 group" aria-label="Tranquille, on est en vacances - Accueil">
        <img src="/icon-192.png" width="38" height="38" alt="" aria-hidden="true" style="border-radius:.75rem;flex-shrink:0;box-shadow:0 2px 8px rgba(0,87,184,.20)">
        <div class="leading-none">
          <span class="brand-title font-display font-bold text-base block">Tranquille,</span>
          <span class="brand-subtitle text-[0.68rem] font-semibold tracking-[0.20em] uppercase block mt-0.5">on est en vacances</span>
        </div>
      </a>
      <div class="hidden md:flex items-center gap-1">
        <a href="/" class="nav-link ${active==='home'?'nav-link-active':''}"><i class="ph-bold ph-house"></i> Accueil</a>
        <a href="/voyages" class="nav-link ${active==='voyages'?'nav-link-active':''}"><i class="ph-bold ph-airplane-takeoff"></i> Voyages</a>
        <button type="button" id="theme-toggle" onclick="toggleTheme()" class="p-2 rounded-full transition-colors" style="color:var(--ink-muted)" aria-label="Changer le thème clair/sombre" title="Thème clair/sombre">
          <i class="ph-bold ph-moon" id="theme-toggle-icon"></i>
        </button>
        ${authed ? `
        <div class="relative ml-2" id="admin-menu-wrap">
          <button type="button" id="admin-menu-btn" aria-haspopup="true" aria-expanded="false"
            onclick="const m=document.getElementById('admin-menu');const o=m.classList.toggle('hidden');this.setAttribute('aria-expanded',!o)"
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors" style="background:rgba(var(--blue-rgb),.10);color:var(--blue);border:1px solid rgba(var(--blue-rgb),.25)">
            <i class="ph-fill ph-shield-check"></i> Admin <i class="ph-bold ph-caret-down" style="font-size:.7rem"></i>
          </button>
          <div id="admin-menu" class="hidden absolute right-0 mt-2 py-1.5 rounded-2xl shadow-xl" style="min-width:13rem;background:var(--cream);border:1px solid var(--line);z-index:60">
            <div class="px-4 py-2 text-[.68rem] font-bold uppercase tracking-[.14em]" style="color:var(--ink-light);border-bottom:1px solid var(--line)">Espace admin</div>
            <a href="/admin" class="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-blue-50" style="color:var(--ink)"><i class="ph-bold ph-gauge" style="color:var(--blue)"></i> Tableau de bord</a>
            <a href="/admin/editor" class="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-blue-50" style="color:var(--ink)"><i class="ph-bold ph-plus-circle" style="color:var(--blue)"></i> Nouvel article</a>
            <form method="POST" action="/admin/logout" style="border-top:1px solid var(--line);margin-top:.25rem;padding-top:.25rem">
              <button type="submit" class="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold w-full text-left transition-colors hover:bg-red-50" style="color:var(--danger);background:none;border:none;cursor:pointer"><i class="ph-bold ph-sign-out"></i> Déconnexion</button>
            </form>
          </div>
        </div>
        ` : `
        <a href="/admin" class="action-btn-sm ml-3"><i class="ph-bold ph-lock-key"></i> Admin</a>
        `}
      </div>
      <button onclick="const m=document.getElementById('mobile-menu');m.classList.toggle('hidden');this.setAttribute('aria-expanded',!m.classList.contains('hidden'))"
              class="md:hidden p-2 rounded-xl transition-colors"
              style="color:var(--ink-muted)"
              aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="mobile-menu">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
    </div>
    <div id="mobile-menu" class="hidden md:hidden pb-4">
      <div class="panel rounded-2xl p-3 flex flex-col gap-1 mt-1 shadow-lg">
        <a href="/" class="mobile-nav-link ${active==='home'?'nav-link-active':''}"><i class="ph-bold ph-house"></i> Accueil</a>
        <a href="/voyages" class="mobile-nav-link ${active==='voyages'?'nav-link-active':''}"><i class="ph-bold ph-airplane-takeoff"></i> Voyages</a>
        <button type="button" onclick="toggleTheme()" class="mobile-nav-link w-full text-left" style="background:none;border:none;cursor:pointer">
          <i class="ph-bold ph-moon" id="theme-toggle-icon-mobile"></i> <span id="theme-toggle-label-mobile">Thème sombre</span>
        </button>
        ${authed ? `
        <div class="mt-2 pt-2" style="border-top:1px solid var(--line)">
          <div class="flex items-center gap-1.5 px-3 pb-1 text-[.68rem] font-bold uppercase tracking-[.14em]" style="color:var(--blue)"><i class="ph-fill ph-shield-check"></i> Espace admin</div>
          <a href="/admin" class="mobile-nav-link"><i class="ph-bold ph-gauge"></i> Tableau de bord</a>
          <a href="/admin/editor" class="mobile-nav-link"><i class="ph-bold ph-plus-circle"></i> Nouvel article</a>
          <form method="POST" action="/admin/logout"><button type="submit" class="mobile-nav-link w-full text-left" style="color:var(--danger);background:none;border:none;cursor:pointer"><i class="ph-bold ph-sign-out"></i> Déconnexion</button></form>
        </div>
        ` : `
        <a href="/admin" class="action-btn-sm justify-center mt-2"><i class="ph-bold ph-lock-key"></i> Admin</a>
        `}
      </div>
    </div>
  </div>
</nav>
<script>
// Dark mode toggle: flips <html data-theme>, persists the explicit choice in
// localStorage, and syncs the moon/sun icon on every page (the inline script
// in HEAD() already applied any saved preference before first paint).
function _themeIsDark(){
  var t=document.documentElement.getAttribute('data-theme');
  if(t==='dark') return true;
  if(t==='light') return false;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}
function _syncThemeIcon(){
  var dark=_themeIsDark();
  ['theme-toggle-icon','theme-toggle-icon-mobile'].forEach(function(id){
    var el=document.getElementById(id);
    if(el) el.className='ph-bold '+(dark?'ph-sun':'ph-moon');
  });
  var lbl=document.getElementById('theme-toggle-label-mobile');
  if(lbl) lbl.textContent=dark?'Thème clair':'Thème sombre';
}
function toggleTheme(){
  var next=_themeIsDark()?'light':'dark';
  document.documentElement.setAttribute('data-theme',next);
  try{localStorage.setItem('theme',next);}catch(e){}
  _syncThemeIcon();
}
_syncThemeIcon();
</script>
<script>
/* ── Easter egg : caravane saharienne ─────────────────────────
   Tapez "maroc" ou "sahara" (hors champ de saisie) et un chameau
   traverse l'écran dans une ambiance coucher de soleil du désert.
   Sur mobile (pas de clavier), un secours : 5 tics rapides sur le
   palmier de la citation en bas d'accueil. Respecte reduced-motion. */
(function(){
  var running=false, buf='';
  /* Mot déclencheur paramétrable dans l'admin (Paramètres du site), "maroc"
     par défaut. Chargé de façon asynchrone depuis /api/settings au démarrage
     de la page - une frappe pendant cette courte fenêtre ne matchera
     simplement rien, ce qui est sans conséquence pour un easter egg. */
  var WORDS=['maroc'];
  fetch('/api/settings',{cache:'no-store'}).then(function(r){return r.ok?r.json():null;}).then(function(s){
    var w=(s&&s.easter_egg_word||'').trim().toLowerCase();
    if(w) WORDS=[w];
    var email=(s&&s.contact_email||'').trim();
    var link=document.getElementById('footer-contact-link');
    if(link&&email) link.href='mailto:'+email;
  }).catch(function(){});
  function reduced(){return window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;}
  function typingTarget(el){
    if(!el) return false;
    var t=(el.tagName||'').toLowerCase();
    return t==='input'||t==='textarea'||t==='select'||el.isContentEditable;
  }
  function playCamel(){
    if(running) return; running=true;
    if(reduced()){ running=false; return; } /* pas d'anim si l'utilisateur a désactivé les animations */
    var s=document.createElement('div');
    s.setAttribute('aria-hidden','true');
    s.className='tv-sahara';
    s.innerHTML=''+
      '<div class="tv-panel">'+
        '<div class="tv-sun"></div>'+
        '<div class="tv-dune tv-dune2"></div>'+
        '<div class="tv-dune tv-dune3"></div>'+
        '<div class="tv-dune tv-dune1"></div>'+
      '</div>'+
      '<div class="tv-camel"><div class="tv-bob">'+
        '<svg width="240" height="240" viewBox="0 0 512 512">'+
          '<defs><linearGradient id="tvbody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8ac54"></stop><stop offset="0.6" stop-color="#d4933c"></stop><stop offset="1" stop-color="#bd7f2c"></stop></linearGradient></defs>'+
          '<path fill="url(#tvbody)" d="M420.8 26.91c-11.4.76-23.7 4.65-33.6 10.29-5.3-4.86-13.5-10.52-19.3-6.11-12.5 9.46-2.4 20.76 6.8 27.94 5.5 35.86 20.7 93.17-9.8 105.97C317 183.1 308.4 36.14 241 37.94c-40.4 1.08-22.6 59.65-62.6 61.65-29.5 1.51-27.3-54.51-51.9-55.36-25.9-.9-44.62 18.9-57.71 86.97-25.63-.1-35.73 20.1-47.42 59.2-11.686 39-3 115.6 1.2 162.4l7.87-76.3c2.43 12 6.19 24.1 11.91 36.7 3.91 18.7 5.44 37.4 5.81 56-8.2 10.2-8.8 26.2-.42 35.5-.92 26.8-2.67 53.5-1.68 80.3 34.48.5 66.04-1 99.54 0 1.8-11.9-14.9-20.4-34.3-30.3.3-13.7.2-30.5 0-47.5 8.8-10.2 9-28.1-.2-36.8.1-21.3.8-38.6 3.3-43.9 8-17.1 20.6-31.9 29.1-47.2 28.7 5.3 59.7 2.9 91.9-4.7l.7 85.5c-7.7 11.3-8 27.7.3 37.8 4.7 29 .6 58.1.8 87.1h58c2.3-15-22.5-23.1-34.6-30.1 0-22.1-3.9-38.8-.4-60.3 5-9.9 5.3-21.5.4-30.8.9-33 3.3-66 10.7-99 1.6-.6 7.9-3.7 9.3-5.3l10.9 98.4c-5.6 11.9-4.4 27.3 4 36.7 6.6 30.1 4.5 59.5 7.9 89.6l61.2.8c.3-12.3-29.1-20-40.3-25.5-6.4-21.4-5.7-43.1-6.7-64.9 8-12.1 7.6-28.9-1.1-39.5.5-38.3 5.5-76.8 18.4-114.6 106.6-5.9 96.2-72 99.3-133.2 1.4-27.24 55.5 1.7 60-11.61 2.4-6.92 3.6-13.89 0-21.84-8.6-19.29-23.9-20.32-36.7-20.63-12.3-7.36-22.6-25.96-35.5-26.31zm6.7 19.58c4.9 2.64 3.8 7.47 2.7 10.11-6.6 1.96-16.3-1.08-20.8-4.59 3.9-2.99 12.2-5.39 18.1-5.52zM80.6 302.3c3.05 7.8 5.74 15.6 7.35 23.2 3.22 15.3 4.91 30.7 5.72 46.2-7.48 10.3-7.78 26.1.59 35-.25 21.6-1.3 43.2-1.52 64.7-4.54-7.5-12.92-14-24.94-17.1.16-14.4-.44-32.4-1.08-50.6 6.91-10.2 7.01-25.6-1.11-34.3-.67-27-.34-49.4 3.78-54.1 3.95-4.5 7.67-8.8 11.21-13z"></path>'+
        '</svg>'+
      '</div></div>';
    document.body.appendChild(s);
    var panel=s.querySelector('.tv-panel');
    /* Chorégraphie (le dromadaire traverse en 9s, il marche dès t=0) :
       - t=500ms  : on a vu le dromadaire démarrer sur le blog -> le panneau
                    tombe du haut (chute + rebond, comme un décor déployé).
       - t=8300ms : le dromadaire finit sa sortie -> le panneau remonte d'un
                    coup (pas de fondu).
       - t=9000ms : fin de la traversée, on retire tout. */
    setTimeout(function(){ if(panel) panel.classList.add('tv-drop'); }, 1000);
    setTimeout(function(){ if(panel){ panel.classList.remove('tv-drop'); panel.classList.add('tv-lift'); } }, 8300);
    setTimeout(function(){ if(s.parentNode) s.parentNode.removeChild(s); running=false; }, 9000);
  }
  window.tvPlayCamel=playCamel;
  /* déclencheur clavier */
  document.addEventListener('keydown',function(e){
    if(typingTarget(e.target)) { buf=''; return; }      /* jamais dans un champ */
    if(e.key&&e.key.length===1){
      /* Le buffer suit la longueur du mot courant (min 8) - un mot admin plus
         long que "maroc" ne doit jamais devenir undetectable faute de place. */
      var maxLen=Math.max(8,WORDS[0]?WORDS[0].length:0);
      buf=(buf+e.key.toLowerCase()).slice(-maxLen);
      for(var i=0;i<WORDS.length;i++){ if(WORDS[i]&&buf.indexOf(WORDS[i])!==-1){ buf=''; playCamel(); break; } }
    }
  });
  /* secours tactile : le palmier 🌴 de la citation (accueil), 5 tics en <3s */
  document.addEventListener('DOMContentLoaded',function(){
    var tag=document.getElementById('site-tagline');
    if(!tag) return;
    var host=tag.parentNode; if(!host) return;
    var n=0,t0=0;
    host.addEventListener('click',function(){
      var now=Date.now();
      if(now-t0>3000) n=0;
      t0=now; n++;
      if(n>=5){ n=0; playCamel(); }
    });
  });
})();
</script>
${authed ? `
<script>
// Close the admin dropdown when clicking outside it or pressing Escape.
(function(){
  var wrap=document.getElementById('admin-menu-wrap');
  if(!wrap) return;
  document.addEventListener('click',function(e){
    var menu=document.getElementById('admin-menu'), btn=document.getElementById('admin-menu-btn');
    if(!menu||menu.classList.contains('hidden')) return;
    if(!wrap.contains(e.target)){ menu.classList.add('hidden'); btn.setAttribute('aria-expanded','false'); }
  });
  document.addEventListener('keydown',function(e){
    if(e.key!=='Escape') return;
    var menu=document.getElementById('admin-menu'), btn=document.getElementById('admin-menu-btn');
    if(menu&&!menu.classList.contains('hidden')){ menu.classList.add('hidden'); btn.setAttribute('aria-expanded','false'); btn.focus(); }
  });
})();
</script>` : ''}`;

export const FOOTER = `
<footer id="site-footer" class="py-14 mt-0">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
      <div>
        <div class="flex items-center gap-3 mb-4">
          <img src="/icon-192.png" width="38" height="38" alt="" aria-hidden="true" style="border-radius:.75rem;flex-shrink:0">
          <div class="leading-none">
            <div class="brand-title font-display font-bold text-base">Tranquille,</div>
            <div class="brand-subtitle text-[0.68rem] font-semibold uppercase tracking-[0.20em] mt-0.5">on est en vacances</div>
          </div>
        </div>
        <p class="text-sm leading-relaxed" style="color:var(--ink-muted)">Le carnet de voyage de la famille Potet - des souvenirs partagés avec ceux qu'on aime.</p>
      </div>
      <div>
        <h3 class="font-bold mb-4 text-xs uppercase tracking-[0.18em]" style="color:var(--ink)">Explorer</h3>
        <ul class="space-y-2.5 text-sm">
          <li><a href="/" class="transition-colors font-medium hover:underline" style="color:var(--ink-muted)"><i class="ph-bold ph-house"></i> Accueil</a></li>
          <li><a href="/voyages" class="transition-colors font-medium hover:underline" style="color:var(--ink-muted)"><i class="ph-bold ph-airplane-takeoff"></i> Tous les voyages</a></li>
          <li><a href="/creer-mon-carnet" class="transition-colors font-medium hover:underline" style="color:var(--ink-muted)"><i class="ph-bold ph-sparkle"></i> Créer mon carnet</a></li>
          <li><a id="footer-contact-link" href="mailto:tranquilleonestenvacances@free.fr" class="transition-colors font-medium hover:underline" style="color:var(--ink-muted)"><i class="ph-bold ph-envelope-simple"></i> Contact</a></li>
        </ul>
      </div>
      <div>
        <h3 class="font-bold mb-4 text-xs uppercase tracking-[0.18em]" style="color:var(--ink)">Destinations</h3>
        <ul id="footer-dest" class="space-y-2.5 text-sm" style="color:var(--ink-muted)"><li>Chargement...</li></ul>
      </div>
    </div>
    <div class="mb-8">
      <h3 class="font-bold mb-2 text-xs uppercase tracking-[0.18em]" style="color:var(--ink)"><i class="ph-bold ph-bell"></i> Suivre le blog</h3>
      <p class="text-xs mb-3" style="color:var(--ink-muted)">Soyez notifié(e) à chaque nouveau récit de voyage.</p>
      <div class="flex flex-wrap gap-2 mb-2">
        <button id="push-btn" class="hidden text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors" style="background:var(--blue-light);color:var(--blue);border:1px solid rgba(var(--blue-rgb),.2)"><i class="ph-bold ph-bell"></i> Activer les notifications</button>
      </div>
      <div class="flex gap-2">
        <input type="email" id="email-sub-in" placeholder="votre@email.com" class="flex-1 min-w-0 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-400" style="background:rgba(var(--cream-rgb),.7)">
        <button onclick="subscribeEmail()" class="text-xs font-semibold px-3 py-2 rounded-xl text-white transition-colors" style="background:var(--palm)"><i class="ph-bold ph-envelope"></i> S'abonner</button>
      </div>
      <p id="sub-msg" class="hidden text-xs mt-2 font-semibold"></p>
    </div>
    <div class="divider mb-6"></div>
    <div class="text-center text-sm" style="color:var(--ink-light)">
      &copy; <span id="footer-year">2026</span> Famille Potet
    </div>
  </div>
</footer>

<!-- ── Notification prompt modal (PWA first-visit) ───────── -->
<div id="notif-modal" style="display:none;position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);align-items:flex-end;justify-content:center;box-sizing:border-box" onclick="if(event.target===this)notifModalDismiss()">
  <div style="background:var(--cream);border-radius:1.5rem 1.5rem 0 0;padding:2rem 1.5rem 2.5rem;max-width:480px;width:100%;box-shadow:0 -8px 40px rgba(0,0,0,.28)">
    <div style="width:3rem;height:.22rem;background:var(--line);border-radius:999px;margin:0 auto 1.75rem"></div>
    <div style="width:3.5rem;height:3.5rem;border-radius:999px;background:var(--blue-light);border:2px solid rgba(var(--blue-rgb),.14);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem"><i class="ph-bold ph-bell" style="font-size:1.5rem;color:var(--blue)"></i></div>
    <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:1.25rem;font-weight:700;text-align:center;color:var(--ink);margin:0 0 .6rem">Suivre le blog ?</h2>
    <p style="text-align:center;color:var(--ink-muted);font-size:.87rem;line-height:1.65;margin:0 0 1.75rem">Recevez une notification dès qu'un nouveau récit de voyage est publié.</p>
    <button onclick="notifModalAccept()" style="display:block;width:100%;background:var(--blue);color:#fff;font-family:Montserrat,sans-serif;font-weight:700;font-size:.92rem;border:none;border-radius:999px;padding:.9rem;cursor:pointer;margin-bottom:.75rem;box-shadow:0 6px 22px rgba(var(--blue-rgb),.28)"><i class="ph-bold ph-bell"></i> Activer les notifications</button>
    <button onclick="notifModalDismiss()" style="display:block;width:100%;background:none;color:var(--ink-muted);font-family:Montserrat,sans-serif;font-weight:600;font-size:.87rem;border:none;padding:.6rem;cursor:pointer">Plus tard</button>
  </div>
</div>

<!-- ── Email subscription modal (web first-visit) ─────────── -->
<div id="email-modal" style="display:none;position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);align-items:flex-end;justify-content:center;box-sizing:border-box" onclick="if(event.target===this)emailModalDismiss()">
  <div style="background:var(--cream);border-radius:1.5rem 1.5rem 0 0;padding:2rem 1.5rem 2.5rem;max-width:480px;width:100%;box-shadow:0 -8px 40px rgba(0,0,0,.28)">
    <div style="width:3rem;height:.22rem;background:var(--line);border-radius:999px;margin:0 auto 1.75rem"></div>
    <div style="width:3.5rem;height:3.5rem;border-radius:999px;background:var(--palm-light);border:2px solid rgba(var(--palm-rgb),.16);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem"><i class="ph-bold ph-envelope" style="font-size:1.5rem;color:var(--palm)"></i></div>
    <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:1.25rem;font-weight:700;text-align:center;color:var(--ink);margin:0 0 .6rem">Suivre le blog</h2>
    <p style="text-align:center;color:var(--ink-muted);font-size:.87rem;line-height:1.65;margin:0 0 1.25rem">Recevez un email à chaque nouveau récit de voyage de la famille Potet.</p>
    <div style="display:flex;gap:.5rem;margin-bottom:.6rem">
      <input type="email" id="email-modal-in" placeholder="votre@email.com" style="flex:1;min-width:0;border:1.5px solid rgba(var(--blue-rgb),.18);border-radius:.75rem;padding:.75rem .9rem;font-size:.87rem;color:var(--ink);background:var(--sand);outline:none;font-family:Montserrat,sans-serif">
      <button onclick="emailModalSubscribe()" style="background:var(--palm);color:#fff;font-family:Montserrat,sans-serif;font-weight:700;font-size:.82rem;border:none;border-radius:.75rem;padding:.75rem 1rem;cursor:pointer;white-space:nowrap;flex-shrink:0">S'abonner</button>
    </div>
    <p id="email-modal-msg" style="display:none;font-size:.8rem;font-weight:600;text-align:center;margin:0 0 .5rem"></p>
    <button onclick="emailModalDismiss()" style="display:block;width:100%;background:none;color:var(--ink-muted);font-family:Montserrat,sans-serif;font-weight:600;font-size:.85rem;border:none;padding:.6rem;cursor:pointer">Non merci</button>
  </div>
</div>

<script>
// ── Service Worker + Push notifications ──────────────────────
// Registered on every page load, with an explicit re-check for updates each
// time there's a network connection - this is what keeps the offline article
// precache current (new trips) and recovers a stuck/broken SW without the
// user having to do anything. Never block rendering on this.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then(reg => { if (navigator.onLine) reg.update().catch(() => {}); })
    .catch(() => {});
}
function getServiceWorkerReady() {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker?.ready) return Promise.resolve(null);
  return navigator.serviceWorker.ready.catch(() => null);
}

// ── "Install app" button (home page) ─────────────────────────
// Chrome/Android/Edge fire beforeinstallprompt and let us trigger the native
// install dialog from our own button. iOS Safari never fires it (Apple has no
// programmatic install API) - there we show the same button but it opens
// manual "Partager → Sur l'écran d'accueil" instructions instead. Hidden
// entirely once the app is already running standalone (already installed).
var _deferredInstallPrompt = null;
function _isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
function _isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
window.addEventListener('beforeinstallprompt', function(e){
  e.preventDefault();
  _deferredInstallPrompt = e;
  var s = document.getElementById('install-section');
  if (s && !_isStandalone()) s.classList.remove('hidden');
});
window.addEventListener('appinstalled', function(){
  _deferredInstallPrompt = null;
  var s = document.getElementById('install-section');
  if (s) s.classList.add('hidden');
});
async function installApp(){
  if (_deferredInstallPrompt) {
    _deferredInstallPrompt.prompt();
    try { await _deferredInstallPrompt.userChoice; } catch {}
    _deferredInstallPrompt = null;
    var s = document.getElementById('install-section');
    if (s) s.classList.add('hidden');
    return;
  }
  // iOS (or any browser without the native prompt): show manual steps instead.
  var txt = document.getElementById('install-text');
  var btn = document.getElementById('install-btn');
  if (txt) {
    txt.innerHTML = _isIOS()
      ? 'Sur iPhone/iPad : appuyez sur <i class="ph-bold ph-export"></i> <strong>Partager</strong> en bas de Safari, puis <strong>« Sur l\\'écran d\\'accueil »</strong>.'
      : 'Ouvrez le menu de votre navigateur (⋮ ou ...) puis choisissez <strong>« Installer l\\'application »</strong> ou <strong>« Ajouter à l\\'écran d\\'accueil »</strong>.';
  }
  if (btn) btn.style.display = 'none';
}
// Show the install block for iOS visitors too (no beforeinstallprompt there),
// as long as the app isn't already running standalone.
(function(){
  if (_isIOS() && !_isStandalone()) {
    var s = document.getElementById('install-section');
    if (s) s.classList.remove('hidden');
  }
})();
// ── Warm the admin shell in cache while online, so the whole admin area
// (dashboard + new-article editor) keeps working with no signal - someone
// travelling can still open the dashboard and start/edit an article, which
// gets queued (publish_when_online) and synced automatically once back online.
if (navigator.onLine && window.location.pathname.startsWith('/admin')) {
  getServiceWorkerReady().then(() => {
    ['/admin/dashboard', '/admin/editor'].forEach(function(p){
      if (p !== window.location.pathname) fetch(p).catch(() => {});
    });
  }).catch(() => {});
}
function urlB64ToUint8(b) {
  const p = '='.repeat((4 - b.length % 4) % 4);
  const s = atob((b + p).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, c => c.charCodeAt(0));
}
async function initPushBtn() {
  if (!('PushManager' in window) || !('serviceWorker' in navigator)) return;
  const btn = document.getElementById('push-btn');
  if (!btn) return;
  const reg = await getServiceWorkerReady();
  if (!reg) return;
  btn.classList.remove('hidden');
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    btn.innerHTML = '<i class="ph-bold ph-bell-slash"></i> Désactiver les notifications';
    btn.onclick = unsubscribePush;
  } else {
    btn.onclick = subscribePush;
  }
}
async function subscribePush() {
  try {
    if (!('serviceWorker' in navigator)) { showSubMsg('Notifications non disponibles ici', false); return; }
    const config = await fetch('/api/push/config').then(r => r.json()).catch(() => ({}));
    if (!config.vapidPublicKey) { showSubMsg('Notifications non configurées', false); return; }
    const reg = await getServiceWorkerReady();
    if (!reg) { showSubMsg('Service worker indisponible', false); return; }
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8(config.vapidPublicKey) });
    const res = await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub.toJSON()) });
    if (!res.ok) { showSubMsg("Erreur lors de l'inscription", false); return; }
    showSubMsg('Notifications activées !', true);
    const btn = document.getElementById('push-btn');
    if (btn) { btn.innerHTML = '<i class="ph-bold ph-bell-slash"></i> Désactiver les notifications'; btn.onclick = unsubscribePush; }
  } catch (err) {
    if (err.name === 'NotAllowedError') {
      showSubMsg('Permission refusée par le navigateur', false);
    } else {
      showSubMsg('Erreur : ' + (err.message || err), false);
    }
    console.error('[Push] subscribe error', err);
  }
}
async function unsubscribePush() {
  const reg = await getServiceWorkerReady();
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    await fetch('/api/push/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) });
    await sub.unsubscribe();
  }
  showSubMsg('Notifications désactivées', true);
  const btn = document.getElementById('push-btn');
  if (btn) { btn.innerHTML = '<i class="ph-bold ph-bell"></i> Activer les notifications'; btn.onclick = subscribePush; }
}
async function subscribeEmail() {
  const email = (document.getElementById('email-sub-in')?.value || '').trim();
  if (!email) { showSubMsg('Entrez votre email', false); return; }
  const res = await fetch('/api/email/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
  if (res.ok) { showSubMsg('Abonnement confirmé ! ✓', true); document.getElementById('email-sub-in').value = ''; }
  else { const d = await res.json().catch(() => {}); showSubMsg(d?.error || 'Erreur', false); }
}
function showSubMsg(msg, ok) {
  const el = document.getElementById('sub-msg');
  if (!el) return;
  el.textContent = msg;
  el.style.color = ok ? 'var(--palm)' : 'var(--danger)';
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}
// ── First-visit notification prompts ─────────────────────────
async function initNotifPrompt() {
  if (location.pathname.startsWith('/admin')) return;
  const isPwa = window.matchMedia('(display-mode: standalone)').matches;
  if (isPwa) {
    if (!('PushManager' in window)) return;
    if (localStorage.getItem('notif-prompt-seen')) return;
    const reg = await getServiceWorkerReady();
    if (!reg) return;
    const existing = await reg.pushManager.getSubscription().catch(() => null);
    if (existing) { localStorage.setItem('notif-prompt-seen', '1'); return; }
    setTimeout(showPushModal, 1800);
  } else {
    if (localStorage.getItem('email-prompt-seen')) return;
    setTimeout(showEmailModal, 4000);
  }
}
function showPushModal() {
  const m = document.getElementById('notif-modal');
  if (m) m.style.display = 'flex';
}
async function notifModalAccept() {
  localStorage.setItem('notif-prompt-seen', '1');
  document.getElementById('notif-modal').style.display = 'none';
  await subscribePush();
}
function notifModalDismiss() {
  localStorage.setItem('notif-prompt-seen', 'skip');
  document.getElementById('notif-modal').style.display = 'none';
}
function showEmailModal() {
  const m = document.getElementById('email-modal');
  if (m) m.style.display = 'flex';
}
async function emailModalSubscribe() {
  const email = (document.getElementById('email-modal-in')?.value || '').trim();
  const msg = document.getElementById('email-modal-msg');
  if (!email) {
    if (msg) { msg.style.display='block'; msg.style.color='var(--danger)'; msg.textContent='Entrez votre adresse email'; }
    return;
  }
  const res = await fetch('/api/email/subscribe', {
    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email })
  }).catch(() => null);
  if (res?.ok) {
    localStorage.setItem('email-prompt-seen', '1');
    if (msg) { msg.style.display='block'; msg.style.color='var(--palm)'; msg.textContent='Abonnement confirmé ! ✓'; }
    setTimeout(() => { document.getElementById('email-modal').style.display = 'none'; }, 1800);
  } else {
    if (msg) { msg.style.display='block'; msg.style.color='var(--danger)'; msg.textContent='Erreur, réessayez'; }
  }
}
function emailModalDismiss() {
  localStorage.setItem('email-prompt-seen', 'skip');
  document.getElementById('email-modal').style.display = 'none';
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { initPushBtn(); initNotifPrompt(); });
else { initPushBtn(); initNotifPrompt(); }
// ── Footer destinations ───────────────────────────────────────
function escFooter(s){return (s==null? '': String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function flagImg(icon){if(!icon)return '';const cp=[...icon].map(c=>c.codePointAt(0));if(cp.length>=2&&cp[0]>=0x1F1E6&&cp[0]<=0x1F1FF&&cp[1]>=0x1F1E6&&cp[1]<=0x1F1FF){const code=[cp[0],cp[1]].map(c=>String.fromCodePoint(c-0x1F1E6+65)).join('').toLowerCase();return '<img src="https://flagcdn.com/w20/'+code+'.png" width="20" height="15" alt="'+code.toUpperCase()+'" style="vertical-align:middle;border-radius:2px;flex-shrink:0">';}return '<span>'+escFooter(icon)+'</span>';}
fetch('/api/folders').then(r=>r.json()).then(data=>{const roots=data.filter(f=>!f.parent_id);const el=document.getElementById('footer-dest');if(el)el.innerHTML=roots.length?roots.map(f=>\`<li><a href="/voyages?folder=\${encodeURIComponent(f.slug)}" style="color:var(--ink-muted)" class="hover:underline transition-colors flex items-center gap-1.5">\${flagImg(f.icon)}<span>\${escFooter(f.name)}</span></a></li>\`).join(''):'';}).catch(()=>{const el=document.getElementById('footer-dest');if(el)el.innerHTML='';});
(function(){var y=document.getElementById('footer-year');if(y)y.textContent=new Date().getFullYear();})();
</script>`;

export const TOAST = `
<div id="toast" role="status" aria-live="polite" class="hidden fixed bottom-6 right-6 z-[200] bg-white rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-3 max-w-xs" style="border:1px solid var(--line)">
  <span id="toast-icon" class="text-xl flex-shrink-0" aria-hidden="true"></span>
  <p id="toast-msg" class="font-semibold text-sm" style="color:var(--ink)"></p>
</div>`;

export const LIGHTBOX = `
<div id="lightbox" role="dialog" aria-modal="true" aria-label="Visionneuse de photos"
     class="hidden fixed inset-0 z-[100] lightbox-bg flex items-center justify-center"
     style="background:rgba(10,18,30,.90);touch-action:none"
     onclick="closeLightbox()">
  <button onclick="closeLightbox()" aria-label="Fermer"
          class="absolute top-4 right-4 text-white/80 hover:text-white rounded-full p-2.5 transition-all z-10"
          style="background:rgba(255,255,255,.15)">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
  </button>
  <button onclick="event.stopPropagation();lbNav(-1)" aria-label="Photo précédente"
          class="absolute left-3 sm:left-6 text-white/80 hover:text-white rounded-full p-3 transition-all"
          style="background:rgba(255,255,255,.15)">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
  </button>
  <button onclick="event.stopPropagation();lbNav(1)" aria-label="Photo suivante"
          class="absolute right-3 sm:right-6 text-white/80 hover:text-white rounded-full p-3 transition-all"
          style="background:rgba(255,255,255,.15)">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
  </button>
  <div class="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10" onclick="event.stopPropagation()">
    <button onclick="lbZoomBy(-0.5)" aria-label="Dézoomer" class="text-white/80 hover:text-white rounded-full p-2.5 transition-all" style="background:rgba(255,255,255,.15)">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"/></svg>
    </button>
    <button onclick="lbZoomReset()" aria-label="Réinitialiser le zoom, actuellement 100%" id="lb-zoom-pct" class="text-white/80 hover:text-white rounded-full px-3 py-2.5 text-xs font-semibold transition-all" style="background:rgba(255,255,255,.15);min-width:3.2rem">100%</button>
    <button onclick="lbZoomBy(0.5)" aria-label="Zoomer" class="text-white/80 hover:text-white rounded-full p-2.5 transition-all" style="background:rgba(255,255,255,.15)">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v14M5 12h14"/></svg>
    </button>
  </div>
  <div id="lb-viewport" class="max-w-5xl w-full h-[78vh] px-16 overflow-hidden" style="touch-action:none" onclick="event.stopPropagation()">
    <img id="lb-img" src="" alt="" class="w-full h-full object-contain rounded-xl shadow-2xl" style="transform-origin:center center;transition:transform .12s ease-out;user-select:none;-webkit-user-drag:none" draggable="false">
  </div>
  <p id="lb-caption" class="text-white/80 text-center mt-3 text-sm absolute left-0 right-0" style="bottom:4.75rem"></p>
  <p id="lb-counter" class="text-white/45 text-center text-xs mt-1 absolute left-0 right-0" style="bottom:3.25rem"></p>
</div>
<script>
// ── Lightbox zoom/pan state ────────────────────────────────────
// Real pinch/scroll/double-click zoom with drag-to-pan, not just a bigger
// fit-to-screen view - the zoom-in cursor on article images promises actual
// zoom, so the lightbox needs to deliver it.
const _lb={photos:[],idx:0,scale:1,tx:0,ty:0,MIN:1,MAX:4};
function openLightbox(photos,idx){_lb.photos=photos;_lb.idx=idx;_lbResetZoom();_updLb();document.getElementById('lightbox').classList.remove('hidden');document.body.style.overflow='hidden'}
function closeLightbox(){document.getElementById('lightbox').classList.add('hidden');document.body.style.overflow=''}
function lbNav(d){if(_lb.photos.length<=1)return;_lb.idx=(_lb.idx+d+_lb.photos.length)%_lb.photos.length;_lbResetZoom();_updLb()}
function _updLb(){const p=_lb.photos[_lb.idx];const img=document.getElementById('lb-img');img.src=p.url;img.alt=p.caption||'';document.getElementById('lb-caption').textContent=p.caption||'';const nav=_lb.photos.length>1;document.getElementById('lb-counter').textContent=nav?(_lb.idx+1)+' / '+_lb.photos.length:'';document.querySelectorAll('#lightbox button[aria-label="Photo précédente"],#lightbox button[aria-label="Photo suivante"]').forEach(b=>b.style.display=nav?'':'none');}
function _lbResetZoom(){_lb.scale=1;_lb.tx=0;_lb.ty=0;_lbApplyTransform()}
function _lbApplyTransform(){
  const img=document.getElementById('lb-img');if(!img)return;
  img.style.transform='translate('+_lb.tx+'px,'+_lb.ty+'px) scale('+_lb.scale+')';
  const pct=document.getElementById('lb-zoom-pct');
  if(pct){const pctText=Math.round(_lb.scale*100)+'%';pct.textContent=pctText;pct.setAttribute('aria-label','Réinitialiser le zoom, actuellement '+pctText);}
}
// Disable the CSS transition while a drag/pinch/pan is actively in progress -
// otherwise every frame is smoothed by the .12s transition, creating a lag
// between the finger/cursor and the image during continuous gestures. Only
// re-enable it for discrete jumps (buttons, wheel, double-click, reset).
function _lbSetTransition(on){const img=document.getElementById('lb-img');if(img)img.style.transitionDuration=on?'.12s':'0s'}
function lbZoomReset(){_lbSetTransition(true);_lbResetZoom()}
function lbZoomBy(delta,cx,cy){_lbSetTransition(true);_lbSetZoom(_lb.scale+delta,cx,cy)}
function _lbSetZoom(newScale,cx,cy){
  const clamped=Math.min(_lb.MAX,Math.max(_lb.MIN,newScale));
  if(clamped===_lb.scale)return;
  // Zoom toward the cursor/finger position rather than always the image center.
  const vp=document.getElementById('lb-viewport');
  const rect=vp.getBoundingClientRect();
  const originX=cx!=null?cx-rect.left-rect.width/2:0;
  const originY=cy!=null?cy-rect.top-rect.height/2:0;
  const ratio=clamped/_lb.scale;
  _lb.tx=originX-(originX-_lb.tx)*ratio;
  _lb.ty=originY-(originY-_lb.ty)*ratio;
  _lb.scale=clamped;
  if(_lb.scale===_lb.MIN){_lb.tx=0;_lb.ty=0;}
  _lbClampPan();
  _lbApplyTransform();
}
function _lbClampPan(){
  // Keep the image from being dragged entirely off-screen once zoomed.
  // Clamp against the actual RENDERED image size, not the viewport size -
  // with object-contain, a tall/narrow image inside a wide viewport leaves
  // empty side margins, and clamping to the viewport would let the image be
  // panned fully out of view before hitting the limit.
  const img=document.getElementById('lb-img');
  if(!img)return;
  const w=img.offsetWidth*_lb.scale, h=img.offsetHeight*_lb.scale;
  const vp=document.getElementById('lb-viewport');
  const vw=vp.clientWidth, vh=vp.clientHeight;
  const maxX=Math.max(0,(w-vw)/2)+40;
  const maxY=Math.max(0,(h-vh)/2)+40;
  _lb.tx=Math.min(maxX,Math.max(-maxX,_lb.tx));
  _lb.ty=Math.min(maxY,Math.max(-maxY,_lb.ty));
}
const LB_PAN_STEP=60;
document.addEventListener('keydown',e=>{
  if(document.getElementById('lightbox').classList.contains('hidden'))return;
  if(e.key==='Escape'){ _lb.scale>_lb.MIN ? lbZoomReset() : closeLightbox(); return; }
  if(e.key==='ArrowLeft'){ if(_lb.scale===_lb.MIN){lbNav(-1);}else{e.preventDefault();_lbSetTransition(false);_lb.tx+=LB_PAN_STEP;_lbClampPan();_lbApplyTransform();} return; }
  if(e.key==='ArrowRight'){ if(_lb.scale===_lb.MIN){lbNav(1);}else{e.preventDefault();_lbSetTransition(false);_lb.tx-=LB_PAN_STEP;_lbClampPan();_lbApplyTransform();} return; }
  if(e.key==='ArrowUp'&&_lb.scale>_lb.MIN){e.preventDefault();_lbSetTransition(false);_lb.ty+=LB_PAN_STEP;_lbClampPan();_lbApplyTransform();return;}
  if(e.key==='ArrowDown'&&_lb.scale>_lb.MIN){e.preventDefault();_lbSetTransition(false);_lb.ty-=LB_PAN_STEP;_lbClampPan();_lbApplyTransform();return;}
  if(e.key==='+'||e.key==='=')lbZoomBy(0.5);
  if(e.key==='-')lbZoomBy(-0.5);
});
// Double-click / double-tap to zoom in, mouse wheel to zoom, drag to pan when zoomed.
const _lbVp=document.getElementById('lb-viewport');
_lbVp.addEventListener('dblclick',e=>{e.stopPropagation();_lbSetTransition(true);_lb.scale>_lb.MIN?_lbResetZoom():_lbSetZoom(2.5,e.clientX,e.clientY)});
_lbVp.addEventListener('wheel',e=>{e.preventDefault();e.stopPropagation();_lbSetTransition(true);_lbSetZoom(_lb.scale-e.deltaY*0.0025,e.clientX,e.clientY)},{passive:false});
let _lbDrag=null;
_lbVp.addEventListener('mousedown',e=>{if(_lb.scale<=_lb.MIN)return;e.preventDefault();e.stopPropagation();_lbSetTransition(false);_lbDrag={x:e.clientX,y:e.clientY,tx:_lb.tx,ty:_lb.ty}});
window.addEventListener('mousemove',e=>{if(!_lbDrag)return;_lb.tx=_lbDrag.tx+(e.clientX-_lbDrag.x);_lb.ty=_lbDrag.ty+(e.clientY-_lbDrag.y);_lbClampPan();_lbApplyTransform()});
window.addEventListener('mouseup',()=>{_lbDrag=null});
// Touch: swipe to navigate (only when not zoomed), pinch to zoom, one-finger drag to pan when zoomed.
let _lbTouch=null;
function _lbTouchDist(t){const dx=t[0].clientX-t[1].clientX,dy=t[0].clientY-t[1].clientY;return Math.hypot(dx,dy)}
function _lbTouchMid(t){return{x:(t[0].clientX+t[1].clientX)/2,y:(t[0].clientY+t[1].clientY)/2}}
_lbVp.addEventListener('touchstart',e=>{
  _lbSetTransition(false);
  if(e.touches.length===2){_lbTouch={mode:'pinch',dist:_lbTouchDist(e.touches),scale0:_lb.scale};}
  else if(e.touches.length===1){
    if(_lb.scale>_lb.MIN)_lbTouch={mode:'pan',x:e.touches[0].clientX,y:e.touches[0].clientY,tx:_lb.tx,ty:_lb.ty};
    else _lbTouch={mode:'swipe',x:e.touches[0].clientX};
  }
},{passive:true});
_lbVp.addEventListener('touchmove',e=>{
  if(!_lbTouch)return;
  // If a finger is lifted mid-pinch (2→1), fall back to a one-finger pan
  // from the remaining finger's current position instead of leaving the
  // gesture stuck in a dead 'pinch' mode that no longer reacts to input.
  if(_lbTouch.mode==='pinch'&&e.touches.length===1){
    _lbTouch=_lb.scale>_lb.MIN
      ? {mode:'pan',x:e.touches[0].clientX,y:e.touches[0].clientY,tx:_lb.tx,ty:_lb.ty}
      : {mode:'swipe',x:e.touches[0].clientX};
    return;
  }
  if(_lbTouch.mode==='pinch'&&e.touches.length===2){
    e.preventDefault();
    const mid=_lbTouchMid(e.touches);
    const ratio=_lbTouchDist(e.touches)/_lbTouch.dist;
    _lbSetZoom(_lbTouch.scale0*ratio,mid.x,mid.y);
  }else if(_lbTouch.mode==='pan'&&e.touches.length===1){
    e.preventDefault();
    _lb.tx=_lbTouch.tx+(e.touches[0].clientX-_lbTouch.x);
    _lb.ty=_lbTouch.ty+(e.touches[0].clientY-_lbTouch.y);
    _lbClampPan();_lbApplyTransform();
  }
},{passive:false});
_lbVp.addEventListener('touchend',e=>{
  _lbSetTransition(true);
  if(_lbTouch&&_lbTouch.mode==='swipe'&&e.changedTouches.length){
    const dx=e.changedTouches[0].clientX-_lbTouch.x;
    if(Math.abs(dx)>50)lbNav(dx<0?1:-1);
  }
  _lbTouch=null;
},{passive:true});
function toast(msg,type='ok'){const i=document.getElementById('toast-icon'),m=document.getElementById('toast-msg'),el=document.getElementById('toast');i.innerHTML=type==='ok'?'<i class="ph-fill ph-check-circle" style="color:var(--palm);font-size:1.25rem"></i>':type==='err'?'<i class="ph-fill ph-x-circle" style="color:var(--danger);font-size:1.25rem"></i>':'<i class="ph-fill ph-info" style="color:var(--blue);font-size:1.25rem"></i>';m.textContent=msg;el.classList.remove('hidden');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.add('hidden'),3000)}
</script>`;
