/**
 * pages/shell.js - Shared HTML shell (head + nav + footer) injected into every page.
 */

export const HEAD = (title = 'Tranquille, on est en vacances', description = "Le carnet de bord des voyages de la famille Potet") => `
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="${description}">
<meta name="theme-color" content="#0057B8">
<title>${title}</title>
<link rel="icon" href="/icon-192.png" type="image/png">
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/icon-192.png">
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;1,500&family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css">
<link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css">
<script src="https://cdn.jsdelivr.net/npm/marked@9/marked.min.js"></script>
<script>
tailwind.config = {
  theme: { extend: {
    fontFamily: {
      sans:    ['Montserrat','ui-sans-serif','system-ui','sans-serif'],
      display: ['"Playfair Display"','Georgia','serif'],
    }
  }}
}
</script>
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

/* ── Base ──────────────────────────────────────────────────── */
html { scroll-behavior: smooth; background: var(--cream); }
body { min-height: 100vh; background: var(--cream); color: var(--ink); font-family: Montserrat, sans-serif; }

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
  background: rgba(255,255,255,.9); color: var(--blue); font-weight: 700; font-size: .92rem;
  border: 2px solid rgba(var(--blue-rgb), .28);
  transition: transform .2s, box-shadow .2s, background .2s, border-color .2s;
}
.btn-ghost:hover { background: var(--blue-light); border-color: var(--blue); transform: translateY(-2px); box-shadow: 0 6px 22px rgba(var(--blue-rgb), .12); }

/* alias for existing code using action-btn / subtle-btn / action-btn-sm */
.action-btn    { display:inline-flex;align-items:center;justify-content:center;gap:.55rem;padding:.85rem 1.75rem;border-radius:999px;background:var(--blue)!important;color:#fff!important;font-weight:700;font-size:.92rem;letter-spacing:.02em;border:2px solid var(--blue)!important;box-shadow:0 6px 22px rgba(var(--blue-rgb),.28);transition:transform .2s,box-shadow .2s,background .2s; }
.action-btn:hover  { background:var(--blue-dark)!important;border-color:var(--blue-dark)!important;transform:translateY(-2px);box-shadow:0 10px 32px rgba(var(--blue-rgb),.38); }
.action-btn-sm { display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:.58rem 1.15rem;border-radius:999px;background:var(--blue)!important;color:#fff!important;font-weight:700;font-size:.82rem;border:2px solid var(--blue)!important;box-shadow:0 4px 14px rgba(var(--blue-rgb),.22);transition:transform .2s,box-shadow .2s,background .2s; }
.action-btn-sm:hover { background:var(--blue-dark)!important;border-color:var(--blue-dark)!important;transform:translateY(-2px); }
.subtle-btn    { display:inline-flex;align-items:center;justify-content:center;gap:.55rem;padding:.82rem 1.6rem;border-radius:999px;background:rgba(255,255,255,.9);color:var(--blue);font-weight:700;font-size:.92rem;border:2px solid rgba(var(--blue-rgb),.28);transition:transform .2s,box-shadow .2s,background .2s,border-color .2s; }
.subtle-btn:hover { background:var(--blue-light);border-color:var(--blue);transform:translateY(-2px); }
.ghost-btn { display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:.56rem .9rem;border-radius:999px;background:transparent;color:var(--ink-muted);font-size:.82rem;font-weight:600;border:1px solid var(--line);transition:color .2s,background .2s; }
.ghost-btn:hover { color:var(--blue);background:var(--blue-light); }

/* ── Cards ─────────────────────────────────────────────────── */
.card {
  background: #fff; border: 1px solid var(--line);
  box-shadow: var(--card-shadow); border-radius: 1.5rem;
  transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease;
}
.card:hover { transform: translateY(-5px); box-shadow: var(--hover-shadow); border-color: rgba(var(--blue-rgb), .18); }

.voyage-card {
  background: #fff; border: 1px solid var(--line);
  box-shadow: var(--card-shadow); border-radius: 1.5rem; overflow: hidden;
  transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease;
}
.voyage-card:hover { transform: translateY(-5px); box-shadow: var(--hover-shadow); border-color: rgba(var(--blue-rgb), .18); }
.voyage-card img { filter: saturate(1.04) contrast(1.02); }

/* ── Panel (frosted surface) ───────────────────────────────── */
.panel {
  background: rgba(255,253,249,.96); border: 1px solid rgba(var(--sand-rgb), .7);
  border-radius: 1.5rem; box-shadow: var(--card-shadow);
}
/* alias */
.section-panel, .glass-panel, .majorelle-frame, .majorelle-showcase { background: rgba(255,253,249,.96)!important; border: 1px solid rgba(var(--sand-rgb), .7)!important; box-shadow: var(--card-shadow)!important; }
/* Plain white card with a thin line border + the theme's soft shadow - the
   pattern repeated inline for comments/prev-next cards on the voyage page.
   No border-radius here on purpose: call sites already set their own via a
   Tailwind rounded-* class. */
.card-line { background: #fff; border: 1px solid var(--line); box-shadow: var(--card-shadow); }

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
.metric-card { background: linear-gradient(135deg,#fff 0%,var(--sand) 100%)!important; border: 1px solid rgba(var(--sand-rgb),.8)!important; box-shadow: var(--card-shadow)!important; border-radius: 1.25rem; }
.majorelle-stat { background: linear-gradient(135deg,#fff 0%,var(--sand) 100%)!important; border: 1px solid rgba(var(--sand-rgb),.8)!important; box-shadow: var(--card-shadow)!important; }

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
.period-pill{padding:.4rem .9rem;border-radius:999px;font-size:.78rem;font-weight:700;background:#fff;border:1.5px solid var(--line);color:var(--ink-muted);cursor:pointer;transition:all .15s}
.period-pill:hover{border-color:rgba(var(--blue-rgb),.3);color:var(--blue)}
.period-pill.is-active{background:var(--blue);border-color:var(--blue);color:#fff}

/* ── Status picker (article editor) ─────────────────────────── */
.status-option { border-color: var(--line); background: #fff; }
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
.toolbar-sep { display:inline-block; width:1px; height:1.1rem; background:#d6d3d1; margin:0 .2rem; vertical-align:middle; }
/* On touch devices (phone/tablet - no hover capability), bump the toolbar
   buttons up to the ~44px minimum recommended touch target size. The admin
   writes articles from their phone while travelling, so mis-taps here (e.g.
   hitting "citation" instead of "gras" on a 32px button) are a real problem.
   Keep the compact 32px size for mouse-driven desktop use. */
@media (pointer: coarse) {
  .toolbar-btn { width:2.75rem; height:2.75rem; font-size:1.15rem; }
}
#e-content[data-placeholder]:empty:before { content:attr(data-placeholder); color:#a8a29e; pointer-events:none; display:block; }

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
.bg-white   { background: #fff!important; }
/* Tailwind's shadow-sm reads flat/generic (hard grey) next to the theme's
   softer double-diffuse .panel/.card shadow - used throughout admin.js for
   ordinary content cards, so this one override carries most of that visual
   gap without touching every call site individually. */
.shadow-sm  { box-shadow: var(--card-shadow)!important; }
.bg-stone-50, .bg-stone-100 { background: var(--cream)!important; }
.bg-stone-200, .hover\:bg-stone-200:hover { background: var(--sand-deep)!important; }
.bg-sky-50, .hover\:bg-sky-50:hover, .hover\:bg-sky-100:hover { background: var(--blue-light)!important; }
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
input, textarea, select { background: #fff!important; color: var(--ink)!important; border-color: rgba(var(--blue-rgb),.18)!important; }
input::placeholder, textarea::placeholder { color: var(--ink-light); }
input:focus, textarea:focus, select:focus { border-color: rgba(var(--blue-rgb),.4)!important; box-shadow: 0 0 0 3px rgba(var(--blue-rgb),.10)!important; }
#dropzone { background: var(--blue-light)!important; border-color: rgba(var(--blue-rgb),.22)!important; }
#navbar { background: rgba(255,253,249,.94)!important; border-bottom: 1px solid rgba(var(--blue-rgb),.08)!important; box-shadow: 0 2px 14px rgba(26,43,60,.06)!important; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
#site-footer { background: linear-gradient(180deg, var(--cream) 0%, var(--sand) 100%)!important; border-top: 1px solid rgba(var(--sand-rgb),.8)!important; }
.gradient-text { color: var(--blue); }
</style>
`;

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
        ${authed ? `
        <div class="relative ml-2" id="admin-menu-wrap">
          <button type="button" id="admin-menu-btn" aria-haspopup="true" aria-expanded="false"
            onclick="const m=document.getElementById('admin-menu');const o=m.classList.toggle('hidden');this.setAttribute('aria-expanded',!o)"
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors" style="background:rgba(var(--blue-rgb),.10);color:var(--blue);border:1px solid rgba(var(--blue-rgb),.25)">
            <i class="ph-fill ph-shield-check"></i> Admin <i class="ph-bold ph-caret-down" style="font-size:.7rem"></i>
          </button>
          <div id="admin-menu" class="hidden absolute right-0 mt-2 py-1.5 rounded-2xl shadow-xl" style="min-width:13rem;background:#fff;border:1px solid var(--line);z-index:60">
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
</nav>${authed ? `
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
        <button id="push-btn" class="hidden text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors" style="background:rgba(var(--blue-rgb),.10);color:var(--blue);border:1px solid rgba(var(--blue-rgb),.2)"><i class="ph-bold ph-bell"></i> Activer les notifications</button>
      </div>
      <div class="flex gap-2">
        <input type="email" id="email-sub-in" placeholder="votre@email.com" class="flex-1 min-w-0 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-400" style="background:rgba(255,255,255,.7)">
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
<div id="notif-modal" style="display:none;position:fixed;inset:0;z-index:300;background:rgba(26,43,60,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);align-items:flex-end;justify-content:center;box-sizing:border-box" onclick="if(event.target===this)notifModalDismiss()">
  <div style="background:#FFFDF9;border-radius:1.5rem 1.5rem 0 0;padding:2rem 1.5rem 2.5rem;max-width:480px;width:100%;box-shadow:0 -8px 40px rgba(26,43,60,.18)">
    <div style="width:3rem;height:.22rem;background:rgba(26,43,60,.14);border-radius:999px;margin:0 auto 1.75rem"></div>
    <div style="width:3.5rem;height:3.5rem;border-radius:999px;background:#EBF2FD;border:2px solid rgba(0,87,184,.14);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem"><i class="ph-bold ph-bell" style="font-size:1.5rem;color:#0057B8"></i></div>
    <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:1.25rem;font-weight:700;text-align:center;color:#1A2B3C;margin:0 0 .6rem">Suivre le blog ?</h2>
    <p style="text-align:center;color:#5A6A7A;font-size:.87rem;line-height:1.65;margin:0 0 1.75rem">Recevez une notification dès qu'un nouveau récit de voyage est publié.</p>
    <button onclick="notifModalAccept()" style="display:block;width:100%;background:#0057B8;color:#fff;font-family:Montserrat,sans-serif;font-weight:700;font-size:.92rem;border:none;border-radius:999px;padding:.9rem;cursor:pointer;margin-bottom:.75rem;box-shadow:0 6px 22px rgba(0,87,184,.28)"><i class="ph-bold ph-bell"></i> Activer les notifications</button>
    <button onclick="notifModalDismiss()" style="display:block;width:100%;background:none;color:#5A6A7A;font-family:Montserrat,sans-serif;font-weight:600;font-size:.87rem;border:none;padding:.6rem;cursor:pointer">Plus tard</button>
  </div>
</div>

<!-- ── Email subscription modal (web first-visit) ─────────── -->
<div id="email-modal" style="display:none;position:fixed;inset:0;z-index:300;background:rgba(26,43,60,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);align-items:flex-end;justify-content:center;box-sizing:border-box" onclick="if(event.target===this)emailModalDismiss()">
  <div style="background:#FFFDF9;border-radius:1.5rem 1.5rem 0 0;padding:2rem 1.5rem 2.5rem;max-width:480px;width:100%;box-shadow:0 -8px 40px rgba(26,43,60,.18)">
    <div style="width:3rem;height:.22rem;background:rgba(26,43,60,.14);border-radius:999px;margin:0 auto 1.75rem"></div>
    <div style="width:3.5rem;height:3.5rem;border-radius:999px;background:#E6F4F1;border:2px solid rgba(46,125,107,.16);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem"><i class="ph-bold ph-envelope" style="font-size:1.5rem;color:#2E7D6B"></i></div>
    <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:1.25rem;font-weight:700;text-align:center;color:#1A2B3C;margin:0 0 .6rem">Suivre le blog</h2>
    <p style="text-align:center;color:#5A6A7A;font-size:.87rem;line-height:1.65;margin:0 0 1.25rem">Recevez un email à chaque nouveau récit de voyage de la famille Potet.</p>
    <div style="display:flex;gap:.5rem;margin-bottom:.6rem">
      <input type="email" id="email-modal-in" placeholder="votre@email.com" style="flex:1;min-width:0;border:1.5px solid rgba(0,87,184,.18);border-radius:.75rem;padding:.75rem .9rem;font-size:.87rem;color:#1A2B3C;background:#fff;outline:none;font-family:Montserrat,sans-serif">
      <button onclick="emailModalSubscribe()" style="background:#2E7D6B;color:#fff;font-family:Montserrat,sans-serif;font-weight:700;font-size:.82rem;border:none;border-radius:.75rem;padding:.75rem 1rem;cursor:pointer;white-space:nowrap;flex-shrink:0">S'abonner</button>
    </div>
    <p id="email-modal-msg" style="display:none;font-size:.8rem;font-weight:600;text-align:center;margin:0 0 .5rem"></p>
    <button onclick="emailModalDismiss()" style="display:block;width:100%;background:none;color:#5A6A7A;font-family:Montserrat,sans-serif;font-weight:600;font-size:.85rem;border:none;padding:.6rem;cursor:pointer">Non merci</button>
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
    if (msg) { msg.style.display='block'; msg.style.color='#2E7D6B'; msg.textContent='Abonnement confirmé ! ✓'; }
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
function flagImg(icon){if(!icon)return '';const cp=[...icon].map(c=>c.codePointAt(0));if(cp.length>=2&&cp[0]>=0x1F1E6&&cp[0]<=0x1F1FF&&cp[1]>=0x1F1E6&&cp[1]<=0x1F1FF){const code=[cp[0],cp[1]].map(c=>String.fromCodePoint(c-0x1F1E6+65)).join('').toLowerCase();return '<img src="https://flagcdn.com/w20/'+code+'.png" width="20" height="15" alt="'+code.toUpperCase()+'" style="vertical-align:middle;border-radius:2px;flex-shrink:0">';}return '<span>'+icon+'</span>';}
fetch('/api/folders').then(r=>r.json()).then(data=>{const roots=data.filter(f=>!f.parent_id);const el=document.getElementById('footer-dest');if(el)el.innerHTML=roots.length?roots.map(f=>\`<li><a href="/voyages?folder=\${f.slug}" style="color:var(--ink-muted)" class="hover:underline transition-colors flex items-center gap-1.5">\${flagImg(f.icon)}<span>\${f.name}</span></a></li>\`).join(''):'';}).catch(()=>{const el=document.getElementById('footer-dest');if(el)el.innerHTML='';});
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
