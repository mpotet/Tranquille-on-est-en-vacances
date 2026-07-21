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
<link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css">
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
  --ink-muted:     #5A6A7A;
  --ink-light:     #8A9BAC;
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
.badge-published { background: var(--palm-light); color: var(--palm); border: 1px solid rgba(var(--palm-rgb),.28); }
.badge-draft     { background: var(--blue-light);  color: var(--blue);  border: 1px solid rgba(var(--blue-rgb),.26); }
.badge-pending   { background: #fffbeb;            color: #b45309;      border: 1px solid rgba(217,119,6,.28); }

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
.toolbar-btn { display:inline-flex; align-items:center; justify-content:center; width:2rem; height:2rem; border-radius:.5rem; font-size:1rem; cursor:pointer; background:transparent; border:none; color:#57534e; transition:background .12s,color .12s; }
.toolbar-btn:hover { background:#e7e5e4; color:#1c1917; }
.toolbar-btn:active { background:#d6d3d1; }
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
@media (prefers-reduced-motion: reduce) {
  .page-in, .float-anim { animation: none!important; }
  .voyage-card, .card, .btn-primary, .btn-ghost, .action-btn, .subtle-btn { transition: none!important; }
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
.bg-stone-50, .bg-stone-100 { background: var(--cream)!important; }
.bg-stone-200, .hover\:bg-stone-200:hover { background: var(--sand-deep)!important; }
.bg-sky-50, .hover\:bg-sky-50:hover, .hover\:bg-sky-100:hover { background: var(--blue-light)!important; }
.bg-sky-500, .hover\:bg-sky-600:hover { background: var(--blue)!important; }
.bg-orange-500 { background: var(--palm)!important; }
.bg-emerald-50 { background: var(--palm-light)!important; }
.bg-amber-50   { background: rgba(var(--apricot-rgb),.18)!important; }
.bg-red-50     { background: rgba(220,60,60,.07)!important; }
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

export const NAV = (active = '') => `
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
        <a href="/" class="nav-link ${active==='home'?'nav-link-active':''}"><i class="ph ph-house"></i> Accueil</a>
        <a href="/voyages" class="nav-link ${active==='voyages'?'nav-link-active':''}"><i class="ph ph-airplane-takeoff"></i> Voyages</a>
        <a href="/admin" class="action-btn-sm ml-3"><i class="ph ph-lock-key"></i> Admin</a>
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
        <a href="/" class="mobile-nav-link ${active==='home'?'nav-link-active':''}"><i class="ph ph-house"></i> Accueil</a>
        <a href="/voyages" class="mobile-nav-link ${active==='voyages'?'nav-link-active':''}"><i class="ph ph-airplane-takeoff"></i> Voyages</a>
        <a href="/admin" class="action-btn-sm justify-center mt-2"><i class="ph ph-lock-key"></i> Admin</a>
      </div>
    </div>
  </div>
</nav>`;

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
          <li><a href="/" class="transition-colors font-medium hover:underline" style="color:var(--ink-muted)"><i class="ph ph-house"></i> Accueil</a></li>
          <li><a href="/voyages" class="transition-colors font-medium hover:underline" style="color:var(--ink-muted)"><i class="ph ph-airplane-takeoff"></i> Tous les voyages</a></li>
        </ul>
      </div>
      <div>
        <h3 class="font-bold mb-4 text-xs uppercase tracking-[0.18em]" style="color:var(--ink)">Destinations</h3>
        <ul id="footer-dest" class="space-y-2.5 text-sm" style="color:var(--ink-muted)"><li>Chargement...</li></ul>
      </div>
    </div>
    <div class="mb-8">
      <h3 class="font-bold mb-2 text-xs uppercase tracking-[0.18em]" style="color:var(--ink)"><i class="ph ph-bell"></i> Suivre le blog</h3>
      <p class="text-xs mb-3" style="color:var(--ink-muted)">Soyez notifié(e) à chaque nouveau récit de voyage.</p>
      <div class="flex flex-wrap gap-2 mb-2">
        <button id="push-btn" class="hidden text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors" style="background:rgba(var(--blue-rgb),.10);color:var(--blue);border:1px solid rgba(var(--blue-rgb),.2)"><i class="ph ph-bell"></i> Activer les notifications</button>
      </div>
      <div class="flex gap-2">
        <input type="email" id="email-sub-in" placeholder="votre@email.com" class="flex-1 min-w-0 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-400" style="background:rgba(255,255,255,.7)">
        <button onclick="subscribeEmail()" class="text-xs font-semibold px-3 py-2 rounded-xl text-white transition-colors" style="background:var(--palm)"><i class="ph ph-envelope"></i> S'abonner</button>
      </div>
      <p id="sub-msg" class="hidden text-xs mt-2 font-semibold"></p>
    </div>
    <div class="divider mb-6"></div>
    <div class="text-center text-sm" style="color:var(--ink-light)">
      &copy; ${new Date().getFullYear()} Famille Potet
    </div>
  </div>
</footer>

<!-- ── Notification prompt modal (PWA first-visit) ───────── -->
<div id="notif-modal" style="display:none;position:fixed;inset:0;z-index:300;background:rgba(26,43,60,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);align-items:flex-end;justify-content:center;box-sizing:border-box" onclick="if(event.target===this)notifModalDismiss()">
  <div style="background:#FFFDF9;border-radius:1.5rem 1.5rem 0 0;padding:2rem 1.5rem 2.5rem;max-width:480px;width:100%;box-shadow:0 -8px 40px rgba(26,43,60,.18)">
    <div style="width:3rem;height:.22rem;background:rgba(26,43,60,.14);border-radius:999px;margin:0 auto 1.75rem"></div>
    <div style="width:3.5rem;height:3.5rem;border-radius:999px;background:#EBF2FD;border:2px solid rgba(0,87,184,.14);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem"><i class="ph ph-bell" style="font-size:1.5rem;color:#0057B8"></i></div>
    <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:1.25rem;font-weight:700;text-align:center;color:#1A2B3C;margin:0 0 .6rem">Suivre le blog ?</h2>
    <p style="text-align:center;color:#5A6A7A;font-size:.87rem;line-height:1.65;margin:0 0 1.75rem">Recevez une notification dès qu'un nouveau récit de voyage est publié.</p>
    <button onclick="notifModalAccept()" style="display:block;width:100%;background:#0057B8;color:#fff;font-family:Montserrat,sans-serif;font-weight:700;font-size:.92rem;border:none;border-radius:999px;padding:.9rem;cursor:pointer;margin-bottom:.75rem;box-shadow:0 6px 22px rgba(0,87,184,.28)"><i class="ph ph-bell"></i> Activer les notifications</button>
    <button onclick="notifModalDismiss()" style="display:block;width:100%;background:none;color:#5A6A7A;font-family:Montserrat,sans-serif;font-weight:600;font-size:.87rem;border:none;padding:.6rem;cursor:pointer">Plus tard</button>
  </div>
</div>

<!-- ── Email subscription modal (web first-visit) ─────────── -->
<div id="email-modal" style="display:none;position:fixed;inset:0;z-index:300;background:rgba(26,43,60,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);align-items:flex-end;justify-content:center;box-sizing:border-box" onclick="if(event.target===this)emailModalDismiss()">
  <div style="background:#FFFDF9;border-radius:1.5rem 1.5rem 0 0;padding:2rem 1.5rem 2.5rem;max-width:480px;width:100%;box-shadow:0 -8px 40px rgba(26,43,60,.18)">
    <div style="width:3rem;height:.22rem;background:rgba(26,43,60,.14);border-radius:999px;margin:0 auto 1.75rem"></div>
    <div style="width:3.5rem;height:3.5rem;border-radius:999px;background:#E6F4F1;border:2px solid rgba(46,125,107,.16);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem"><i class="ph ph-envelope" style="font-size:1.5rem;color:#2E7D6B"></i></div>
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
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
function getServiceWorkerReady() {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker?.ready) return Promise.resolve(null);
  return navigator.serviceWorker.ready.catch(() => null);
}
// ── Warm /admin/editor in cache for offline creation ─────────
if (navigator.onLine && window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/editor') {
  getServiceWorkerReady()
    .then(() => fetch('/admin/editor').catch(() => {}))
    .catch(() => {});
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
    btn.innerHTML = '<i class="ph ph-bell-slash"></i> Désactiver les notifications';
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
    if (btn) { btn.innerHTML = '<i class="ph ph-bell-slash"></i> Désactiver les notifications'; btn.onclick = unsubscribePush; }
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
  if (btn) { btn.innerHTML = '<i class="ph ph-bell"></i> Activer les notifications'; btn.onclick = subscribePush; }
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
  el.style.color = ok ? 'var(--palm)' : '#dc3c3c';
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
    if (msg) { msg.style.display='block'; msg.style.color='#dc3c3c'; msg.textContent='Entrez votre adresse email'; }
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
    if (msg) { msg.style.display='block'; msg.style.color='#dc3c3c'; msg.textContent='Erreur, réessayez'; }
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
</script>`;

export const TOAST = `
<div id="toast" role="status" aria-live="polite" class="hidden fixed bottom-6 right-6 z-[200] bg-white rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-3 max-w-xs" style="border:1px solid var(--line)">
  <span id="toast-icon" class="text-xl flex-shrink-0" aria-hidden="true"></span>
  <p id="toast-msg" class="font-semibold text-sm" style="color:var(--ink)"></p>
</div>`;

export const LIGHTBOX = `
<div id="lightbox" role="dialog" aria-modal="true" aria-label="Visionneuse de photos"
     class="hidden fixed inset-0 z-[100] lightbox-bg flex items-center justify-center"
     style="background:rgba(10,18,30,.90)"
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
  <div class="max-w-5xl w-full px-16" onclick="event.stopPropagation()">
    <img id="lb-img" src="" alt="" class="max-w-full max-h-[78vh] mx-auto object-contain rounded-xl shadow-2xl">
    <p id="lb-caption" class="text-white/80 text-center mt-3 text-sm"></p>
    <p id="lb-counter" class="text-white/45 text-center text-xs mt-1"></p>
  </div>
</div>
<script>
const _lb={photos:[],idx:0};
function openLightbox(photos,idx){_lb.photos=photos;_lb.idx=idx;_updLb();document.getElementById('lightbox').classList.remove('hidden');document.body.style.overflow='hidden'}
function closeLightbox(){document.getElementById('lightbox').classList.add('hidden');document.body.style.overflow=''}
function lbNav(d){if(_lb.photos.length<=1)return;_lb.idx=(_lb.idx+d+_lb.photos.length)%_lb.photos.length;_updLb()}
function _updLb(){const p=_lb.photos[_lb.idx];const img=document.getElementById('lb-img');img.src=p.url;img.alt=p.caption||'';document.getElementById('lb-caption').textContent=p.caption||'';const nav=_lb.photos.length>1;document.getElementById('lb-counter').textContent=nav?(_lb.idx+1)+' / '+_lb.photos.length:'';document.querySelectorAll('#lightbox button[aria-label="Photo précédente"],#lightbox button[aria-label="Photo suivante"]').forEach(b=>b.style.display=nav?'':'none');}
document.addEventListener('keydown',e=>{if(document.getElementById('lightbox').classList.contains('hidden'))return;if(e.key==='Escape')closeLightbox();if(e.key==='ArrowLeft')lbNav(-1);if(e.key==='ArrowRight')lbNav(1)});
// Touch swipe support for lightbox
let _lbTx=null;
document.getElementById('lightbox').addEventListener('touchstart',e=>{_lbTx=e.touches[0].clientX;},{passive:true});
document.getElementById('lightbox').addEventListener('touchend',e=>{if(_lbTx===null)return;const dx=e.changedTouches[0].clientX-_lbTx;_lbTx=null;if(Math.abs(dx)>50)lbNav(dx<0?1:-1);},{passive:true});
function toast(msg,type='ok'){const i=document.getElementById('toast-icon'),m=document.getElementById('toast-msg'),el=document.getElementById('toast');i.innerHTML=type==='ok'?'<i class="ph-fill ph-check-circle" style="color:var(--palm);font-size:1.25rem"></i>':type==='err'?'<i class="ph-fill ph-x-circle" style="color:#dc3c3c;font-size:1.25rem"></i>':'<i class="ph-fill ph-info" style="color:var(--blue);font-size:1.25rem"></i>';m.textContent=msg;el.classList.remove('hidden');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.add('hidden'),3000)}
</script>`;
