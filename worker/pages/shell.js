/**
 * pages/shell.js — Shared HTML shell (head + nav + footer) injected into every page.
 *
 * The Cloudflare Worker serves these as full HTML documents.
 * Each page is a single HTML file; JavaScript fetches data from /api/* at runtime.
 */

export const HEAD = (title = 'Tranquille, on est en vacances 🌴', description = "Le carnet de bord des voyages de la famille Potet") => `
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="${description}">
<title>${title}</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌴</text></svg>">
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,600&family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/marked@9/marked.min.js"></script>
<script>
tailwind.config = {
  theme: { extend: {
    fontFamily: {
      sans: ['Nunito','ui-sans-serif','system-ui','sans-serif'],
      display: ['"Playfair Display"','Georgia','serif'],
    }
  }}
}
</script>
<style>
:root{
  color-scheme:light;
  --blue:#061A9B;
  --blue-rgb:6,26,155;
  --blue-night:#071469;
  --blue-matte:#0A1D8B;
  --lemon:#F1D44B;
  --lemon-rgb:241,212,75;
  --olive:#66772A;
  --olive-rgb:102,119,42;
  --sand:#F8EFD0;
  --sand-strong:#FFF8E4;
  --ink:#15204B;
  --muted:#37477B;
  --muted-deep:#23326B;
  --panel:#FBF3D9;
  --panel-strong:#FFF9EA;
  --panel-soft:rgba(251,243,217,.94);
  --line:rgba(21,32,75,.18);
  --line-strong:rgba(102,119,42,.56);
  --line-gold:rgba(241,212,75,.42);
  --shadow:0 18px 46px rgba(3,16,95,.24);
  --shadow-soft:0 12px 30px rgba(6,26,155,.14);
  --shadow-strong:0 28px 68px rgba(3,16,95,.34);
}
html{scroll-behavior:smooth;background:var(--blue-night)}
body{
  position:relative;
  min-height:100vh;
  background:
    radial-gradient(circle at 16% 14%, rgba(var(--lemon-rgb),.08) 0, transparent 16%),
    radial-gradient(circle at 82% 18%, rgba(var(--olive-rgb),.12) 0, transparent 18%),
    radial-gradient(circle at 50% -12%, rgba(255,255,255,.08) 0, transparent 42%),
    linear-gradient(180deg,#091C93 0%,#071469 46%,#081985 100%);
  color:var(--ink);
}
body::before{
  content:'';
  position:fixed;
  inset:0;
  pointer-events:none;
  background:
    linear-gradient(135deg, rgba(255,248,224,.06), transparent 24%, transparent 76%, rgba(255,248,224,.04)),
    repeating-linear-gradient(90deg, transparent 0 10rem, rgba(var(--lemon-rgb),.055) 10rem 10.18rem, transparent 10.18rem 20rem),
    repeating-linear-gradient(0deg, transparent 0 7rem, rgba(var(--olive-rgb),.05) 7rem 7.14rem, transparent 7.14rem 14rem);
  z-index:0;
}
body::after{
  content:'';
  position:fixed;
  inset:0;
  pointer-events:none;
  background:
    radial-gradient(115% 62% at 50% -6%, transparent 0 52%, rgba(var(--lemon-rgb),.12) 52.2% 52.9%, transparent 53.2%),
    linear-gradient(90deg, transparent 0 4.8%, rgba(var(--olive-rgb),.14) 4.8% 5%, transparent 5% 95%, rgba(var(--olive-rgb),.14) 95% 95.2%, transparent 95.2% 100%),
    linear-gradient(180deg, transparent 0 12%, rgba(255,248,224,.04) 12% 12.16%, transparent 12.16% 100%);
  z-index:0;
}
#navbar,main,#site-footer,#toast,#lightbox{position:relative;z-index:1}
.hero-overlay{background:rgba(7,20,105,.64)}
.glass-panel,.section-panel,.voyage-card,#toast{backdrop-filter:none;-webkit-backdrop-filter:none}
.section-panel,.voyage-card,.bg-white,.bg-stone-50,.bg-sky-50,.bg-emerald-50,.bg-amber-50,.bg-red-50,#toast{
  background:linear-gradient(180deg,var(--panel-strong) 0%,var(--panel) 100%)!important;
  border:1px solid var(--line)!important;
  color:var(--ink)!important;
  box-shadow:var(--shadow-soft), inset 0 1px 0 rgba(255,255,255,.78), inset 0 -1px 0 rgba(var(--lemon-rgb),.14)
}
.glass-panel,.metric-card{
  background:linear-gradient(180deg,rgba(255,249,234,.96) 0%,var(--panel-soft) 100%)!important;
  border:1px solid rgba(var(--lemon-rgb),.34)!important;
  box-shadow:var(--shadow), inset 0 1px 0 rgba(255,255,255,.72)
}
.voyage-card{transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease;background:var(--panel)!important}
.voyage-card:hover{transform:translateY(-7px);border-color:var(--line-strong)!important;box-shadow:var(--shadow-strong)}
.voyage-card img,.prose-vacation img{filter:saturate(.94) contrast(1.03)}
.gradient-text{color:var(--blue);background:none!important;-webkit-text-fill-color:currentColor;text-shadow:0 6px 18px rgba(6,26,155,.12)}
.eyebrow{display:inline-flex;align-items:center;gap:.6rem;border-radius:999px;padding:.7rem 1.05rem;background:rgba(var(--lemon-rgb),.22);border:1px solid rgba(var(--olive-rgb),.55);color:var(--muted-deep);font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;font-weight:800;box-shadow:inset 0 1px 0 rgba(255,255,255,.65)}
.eyebrow::before{content:'✦';color:var(--olive);font-size:.9rem;line-height:1}
.brand-mark{display:grid;place-items:center;width:2.8rem;height:2.8rem;border-radius:1.1rem;background:linear-gradient(180deg,rgba(var(--lemon-rgb),.24),rgba(var(--lemon-rgb),.1));border:1px solid rgba(var(--lemon-rgb),.42);box-shadow:inset 0 1px 0 rgba(255,255,255,.58)}
.brand-title{color:var(--blue-night)!important;letter-spacing:-.02em}
.brand-subtitle{color:var(--muted)!important}
.nav-link,.mobile-nav-link,.ghost-btn{display:inline-flex;align-items:center;justify-content:center;gap:.55rem;border-radius:999px;font-size:.9rem;font-weight:700;padding:.78rem 1.05rem;transition:color .2s ease,background-color .2s ease,border-color .2s ease,transform .2s ease;border:1px solid transparent;color:var(--muted)}
.nav-link:hover,.mobile-nav-link:hover,.ghost-btn:hover{color:var(--blue);background:rgba(var(--lemon-rgb),.16);border-color:rgba(var(--olive-rgb),.34);transform:translateY(-1px)}
.nav-link-active{background:rgba(var(--blue-rgb),.92)!important;color:var(--sand-strong)!important;border-color:rgba(var(--lemon-rgb),.38)!important;box-shadow:0 12px 24px rgba(4,16,92,.18)}
.action-btn,.action-btn-sm{display:inline-flex;align-items:center;justify-content:center;gap:.7rem;border-radius:999px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;transition:transform .2s ease,box-shadow .2s ease,background-color .2s ease,border-color .2s ease;background:linear-gradient(180deg,#F3D850 0%,#E6C53A 100%)!important;color:#1A2367!important;border:1px solid rgba(var(--olive-rgb),.76);box-shadow:0 16px 32px rgba(6,26,155,.24), inset 0 1px 0 rgba(255,248,224,.72)}
.action-btn{padding:1rem 1.55rem}
.action-btn-sm{padding:.82rem 1.18rem;font-size:.82rem}
.action-btn:hover,.action-btn-sm:hover{transform:translateY(-2px);background:linear-gradient(180deg,#F6DE68 0%,#E2BE2B 100%)!important;border-color:var(--olive);box-shadow:0 22px 38px rgba(6,26,155,.28)}
.subtle-btn{display:inline-flex;align-items:center;justify-content:center;gap:.7rem;border-radius:999px;padding:.98rem 1.5rem;border:1px solid rgba(var(--olive-rgb),.52);background:linear-gradient(180deg,rgba(255,250,236,.94),rgba(249,241,212,.94));color:var(--muted-deep);font-weight:700;letter-spacing:.08em;text-transform:uppercase;transition:background-color .2s ease,border-color .2s ease,transform .2s ease,color .2s ease,box-shadow .2s ease;box-shadow:inset 0 1px 0 rgba(255,255,255,.66)}
.subtle-btn:hover{transform:translateY(-2px);border-color:var(--olive);background:linear-gradient(180deg,rgba(255,248,224,.98),rgba(246,235,195,.98));color:var(--blue);box-shadow:0 14px 28px rgba(6,26,155,.16)}
.ghost-btn{padding:.78rem 1.15rem;background:rgba(255,249,234,.24);border-color:rgba(var(--lemon-rgb),.18);font-size:.82rem;text-transform:uppercase;letter-spacing:.12em}
.luxe-divider{height:2px;width:100%;background:linear-gradient(90deg,rgba(var(--olive-rgb),.08),rgba(var(--lemon-rgb),.56),rgba(var(--olive-rgb),.08))}
.orb{display:none}
.drame-badge{display:inline-flex;align-items:center;gap:.5rem;border-radius:999px;border:1px solid rgba(var(--olive-rgb),.48);background:linear-gradient(180deg,rgba(var(--lemon-rgb),.28),rgba(var(--lemon-rgb),.11));color:var(--olive);font-size:.875rem;font-style:italic;font-weight:600;padding:.55rem 1.1rem;margin-bottom:2rem;box-shadow:0 6px 18px rgba(6,26,155,.14),inset 0 1px 0 rgba(255,255,255,.72);letter-spacing:.01em;transition:transform .2s ease,box-shadow .2s ease}
.drame-badge:hover{transform:translateY(-1px);box-shadow:0 10px 22px rgba(6,26,155,.2)}
.majorelle-hero{padding-bottom:5.5rem}
.majorelle-stage{display:grid;gap:2rem}
.majorelle-showcase,.majorelle-frame,.majorelle-quote{position:relative;overflow:hidden}
.majorelle-showcase::before,.majorelle-frame::before,.majorelle-quote::before{content:'';position:absolute;inset:.7rem;border:1px solid rgba(var(--lemon-rgb),.24);border-radius:inherit;pointer-events:none}
.majorelle-showcase{border-radius:2.2rem}
.majorelle-frame{border-radius:2rem}
.majorelle-quote{border-radius:2rem;padding:2.4rem 1.5rem;background:linear-gradient(180deg,rgba(255,249,234,.9),rgba(248,239,205,.92))}
.majorelle-quote blockquote{color:var(--blue-night)}
.majorelle-quote p{color:var(--muted-deep)!important}
.majorelle-stat{padding:1.05rem 1rem!important;border-radius:1.55rem;background:linear-gradient(180deg,rgba(255,250,236,.96),rgba(248,239,206,.95))!important;border:1px solid rgba(var(--lemon-rgb),.28)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.7)}
.majorelle-list-button,.majorelle-chip{background:linear-gradient(180deg,rgba(255,250,236,.98),rgba(246,236,201,.96))!important;border:1px solid var(--line)!important;color:var(--ink)!important;box-shadow:0 8px 20px rgba(6,26,155,.08);transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
.majorelle-list-button:hover,.majorelle-chip:hover{transform:translateY(-2px);box-shadow:0 14px 26px rgba(6,26,155,.14);border-color:var(--line-strong)!important}
.maroc-arch{position:relative;isolation:isolate;display:grid;gap:1.7rem;width:min(100%,70rem);min-height:clamp(36rem,58vw,47rem);overflow:clip;border:1px solid rgba(var(--lemon-rgb),.48);border-radius:24rem 24rem 2.2rem 2.2rem / 16.5rem 16.5rem 2.2rem 2.2rem;background:
  radial-gradient(circle at 14% 18%, rgba(var(--lemon-rgb),.1) 0, transparent 16%),
  radial-gradient(circle at 84% 14%, rgba(var(--olive-rgb),.14) 0, transparent 18%),
  linear-gradient(180deg,#0A1D8B 0%,#071469 100%);
  padding:clamp(6rem,8vw,7.25rem) clamp(1.2rem,3.2vw,3.1rem) clamp(2rem,4vw,3rem);
  box-shadow:0 30px 64px rgba(3,14,89,.4), inset 0 0 0 1px rgba(var(--olive-rgb),.26)
}
.maroc-arch-copy,.maroc-arch-actions,.maroc-arch-highlights{width:min(100%,31rem)}
.maroc-arch-copy h1{max-width:11ch;text-wrap:balance;color:#FFF8DA;text-shadow:0 10px 26px rgba(2,11,62,.34)}
.maroc-arch-copy .hero-intro{max-width:28rem;color:rgba(253,247,222,.92)!important}
.maroc-arch .eyebrow{align-self:flex-start;margin-top:0;margin-bottom:1.15rem;max-width:min(100%,25rem);padding:.72rem 1rem;font-size:.64rem;letter-spacing:.15em;line-height:1.45;white-space:normal;text-wrap:balance;background:rgba(var(--lemon-rgb),.93);color:#13256A;border-color:rgba(var(--olive-rgb),.8)}
.maroc-arch>*{position:relative;z-index:1}
.maroc-arch::before{content:'';position:absolute;inset:.72rem;border-radius:22.4rem 22.4rem 1.55rem 1.55rem / 14.9rem 14.9rem 1.55rem 1.55rem;border:1px solid rgba(var(--lemon-rgb),.5);background:
  linear-gradient(180deg,rgba(var(--lemon-rgb),.12),transparent 58%),
  linear-gradient(90deg, transparent 0 6%, rgba(var(--olive-rgb),.14) 6% 6.15%, transparent 6.15% 93.85%, rgba(var(--olive-rgb),.14) 93.85% 94%, transparent 94% 100%);
  z-index:0;pointer-events:none
}
.maroc-arch::after{content:'';position:absolute;top:1.1rem;left:50%;transform:translateX(-50%);width:min(82%,27rem);height:1.4rem;background:
  repeating-linear-gradient(90deg,rgba(var(--lemon-rgb),.98) 0 14px,transparent 14px 22px),
  linear-gradient(180deg,rgba(var(--lemon-rgb),.18),transparent);
  opacity:.88;z-index:0;pointer-events:none
}
.maroc-arch-highlights span{background:rgba(var(--olive-rgb),.18)!important;border-color:rgba(var(--lemon-rgb),.56)!important;color:#fff7d8!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.08)}
.majorelle-illustration{width:min(100%,21rem);margin:.2rem 0 .3rem;border:1px solid rgba(var(--lemon-rgb),.42);border-radius:1.6rem;padding:.9rem .9rem .8rem;background:linear-gradient(180deg,rgba(var(--lemon-rgb),.08),rgba(var(--olive-rgb),.18));box-shadow:inset 0 0 0 1px rgba(var(--olive-rgb),.24),0 16px 32px rgba(5,16,88,.2)}
.majorelle-illustration svg{display:block;width:100%;height:auto}
@media (min-width:1024px){.maroc-arch{grid-template-columns:minmax(0,1fr) minmax(17rem,22rem);align-items:end;padding-top:clamp(4.8rem,6.8vw,6.4rem);padding-bottom:clamp(3.2rem,5.5vw,4.8rem)}.maroc-arch-copy,.maroc-arch-actions,.maroc-arch-highlights{grid-column:1;width:min(100%,32rem)}.majorelle-illustration{grid-column:2;grid-row:1 / span 3;align-self:end;justify-self:end;margin:0}.maroc-arch-highlights{margin-top:.45rem}}
@media (max-width:1023px){.maroc-arch{width:100%;min-height:auto}.maroc-arch-copy,.maroc-arch-actions,.maroc-arch-highlights,.majorelle-illustration{width:100%}.majorelle-illustration{max-width:20rem}}
@media (max-width:640px){.maroc-arch{border-radius:12rem 12rem 1.45rem 1.45rem / 8.9rem 8.9rem 1.45rem 1.45rem;padding:5.75rem .95rem 1.5rem}.maroc-arch .eyebrow{margin-bottom:1rem;font-size:.58rem;letter-spacing:.12em}.maroc-arch::before{inset:.5rem;border-radius:11.2rem 11.2rem 1rem 1rem / 8rem 8rem 1rem 1rem}.maroc-arch::after{top:1rem;height:.82rem}.majorelle-illustration{padding:.62rem;border-radius:1.2rem}}
.prose-vacation h1,.prose-vacation h2,.prose-vacation h3{font-family:'Playfair Display',Georgia,serif;color:var(--ink);letter-spacing:-.03em}
.prose-vacation h1{font-size:2rem;margin:2rem 0 1rem;font-weight:700}
.prose-vacation h2{font-size:1.6rem;margin:1.8rem 0 .9rem;font-weight:700}
.prose-vacation h3{font-size:1.25rem;margin:1.4rem 0 .7rem;font-weight:700}
.prose-vacation p{margin:1rem 0;line-height:1.85;color:var(--ink)}
.prose-vacation figure{margin:2rem auto;max-width:100%}
.prose-vacation figure img{border-radius:1rem;box-shadow:0 10px 24px rgba(6,26,155,.24);margin:0 auto}
.prose-vacation figcaption{margin-top:.6rem;font-size:.85rem;color:var(--muted-deep);text-align:center;font-style:italic}
.prose-vacation ul,.prose-vacation ol{margin:1rem 0;padding-left:1.5rem;color:var(--ink)}
.prose-vacation li{margin:.4rem 0}
.prose-vacation strong{color:var(--ink);font-weight:700}
.prose-vacation em{color:var(--olive);font-weight:600}
.prose-vacation blockquote{border-left:4px solid rgba(var(--olive-rgb),.62);padding:.75rem 0 .75rem 1rem;margin:1.5rem 0;color:var(--muted);font-style:italic;background:rgba(var(--lemon-rgb),.18);border-radius:0 16px 16px 0}
.prose-vacation a{color:var(--blue);text-decoration:underline}
.prose-vacation hr{margin:2rem 0;border-color:rgba(6,26,155,.25)}
.badge-published{background:rgba(var(--olive-rgb),.2);color:var(--olive);border:1px solid rgba(var(--olive-rgb),.45)}
.badge-draft{background:rgba(6,26,155,.13);color:var(--blue);border:1px solid rgba(6,26,155,.34)}
.lightbox-bg{backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.md-editor{font-family:'Courier New',monospace;font-size:.88rem;line-height:1.65;resize:vertical}
.page-in{animation:fadeIn .28s ease-in-out}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.float-anim{animation:float 3.5s ease-in-out infinite}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.menu-slide{animation:slideDown .22s ease-out}
@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
.folder-row{transition:background-color .14s ease,border-color .14s ease;border:1px solid transparent}
.folder-row:hover{background:rgba(var(--lemon-rgb),.18);border-color:rgba(var(--olive-rgb),.45)}
.line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.line-clamp-3{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
::-webkit-scrollbar{width:8px}
::-webkit-scrollbar-track{background:rgba(6,26,155,.16)}
::-webkit-scrollbar-thumb{background:rgba(var(--lemon-rgb),.68);border-radius:999px}
::-webkit-scrollbar-thumb:hover{background:rgba(var(--lemon-rgb),.88)}
.bg-sky-950{background-color:rgba(var(--blue-rgb),.16)!important}
.bg-sky-500,.hover\:bg-sky-600:hover{background-color:var(--blue)!important}
.bg-sky-50,.hover\:bg-sky-50:hover,.hover\:bg-sky-100:hover,.hover\:bg-emerald-50:hover{background-color:rgba(var(--lemon-rgb),.14)!important}
.bg-amber-50,.bg-emerald-50{background-color:rgba(var(--olive-rgb),.12)!important}
.bg-orange-500{background-color:rgba(var(--lemon-rgb),.22)!important}
.bg-black\/50,.bg-black\/40,.bg-black\/88{background-color:rgba(5,15,74,.72)!important}
.bg-stone-900{background:var(--panel)!important;border-top:1px solid var(--line)!important}
.text-stone-600,.text-stone-700,.text-stone-800,.text-stone-900,.text-white,.text-slate-100,.text-slate-200{color:var(--ink)!important}
.text-stone-500,.text-slate-300{color:var(--muted)!important}
.text-stone-400,.text-slate-400,.text-slate-500,.text-stone-300{color:var(--muted-deep)!important}
.text-sky-100,.text-sky-800,.text-sky-700,.text-sky-600,.hover\:text-sky-700:hover,.hover\:text-sky-600:hover,.hover\:text-sky-400:hover,.text-cyan-300,.text-cyan-200,.hover\:text-cyan-300:hover,.hover\:text-cyan-200:hover{color:var(--blue)!important}
.group:hover .group-hover\:text-sky-700{color:var(--blue)!important}
.text-orange-500,.text-orange-400,.hover\:text-orange-600:hover,.text-yellow-300,.text-amber-700,.text-amber-600,.text-red-700,.text-red-600{color:var(--olive)!important}
.text-emerald-700,.text-emerald-600,.hover\:text-emerald-600:hover{color:var(--olive)!important}
.border-stone-100,.border-stone-200,.border-stone-300,.border-stone-800,.border-sky-100,.border-red-100,.border-emerald-100,.border-amber-100,.border-white\/10{border-color:var(--line)!important}
.border-sky-500,.border-sky-400,.focus\:border-sky-400:focus,.hover\:border-sky-300:hover,.hover\:border-cyan-300\/30:hover,.border-cyan-400\/20,.border-orange-500,.hover\:border-orange-300:hover{border-color:var(--line-strong)!important}
.bg-cyan-500\/10,.bg-white\/5{background-color:rgba(var(--lemon-rgb),.14)!important}
.bg-white\/10{background-color:rgba(var(--lemon-rgb),.2)!important}
.bg-red-500,.hover\:bg-red-600:hover{background-color:rgba(var(--olive-rgb),.27)!important}
.bg-stone-100,.hover\:bg-stone-200:hover,.hover\:bg-stone-100:hover,.hover\:bg-stone-50:hover,.bg-stone-200,.hover\:bg-stone-300:hover,.bg-stone-300{background-color:rgba(var(--lemon-rgb),.13)!important}
input,textarea,select{background:#fffdf5!important;color:var(--ink)!important;border-color:var(--line)!important}
input::placeholder,textarea::placeholder{color:var(--muted)}
input:focus,textarea:focus,select:focus{border-color:var(--line-strong)!important;box-shadow:0 0 0 3px rgba(var(--lemon-rgb),.24)}
#dropzone{background:rgba(var(--lemon-rgb),.13);border-color:var(--line)!important}
#navbar{background:rgba(255,249,233,.86)!important;border-bottom:1px solid rgba(var(--lemon-rgb),.28)!important;box-shadow:0 10px 28px rgba(6,26,155,.18);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
#site-footer{background:transparent!important;border-top:0!important}
.bg-gradient-to-t,.bg-gradient-to-tr,.bg-gradient-to-r,.bg-gradient-to-br,.bg-gradient-to-b,.bg-gradient-to-bl,.bg-gradient-to-l,.bg-gradient-to-tl{background-image:none!important}
.from-sky-500,.from-emerald-500,.from-sky-50,.from-stone-900,.via-white,.to-blue-600,.to-blue-700,.to-green-600,.to-orange-50,.to-stone-800{--tw-gradient-from:initial!important;--tw-gradient-stops:initial!important;--tw-gradient-to:initial!important}
</style>
`;

export const NAV = (active = '') => `
<nav class="fixed top-0 left-0 right-0 z-50 backdrop-blur-md shadow-sm border-b border-stone-100">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <a href="/" class="flex items-center gap-3 group">
        <span class="brand-mark text-xl">🌴</span>
        <div class="leading-none">
          <span class="brand-title font-display font-bold text-base group-hover:text-sky-600 transition-colors block">Tranquille,</span>
          <span class="brand-subtitle text-[0.72rem] font-bold tracking-[0.24em] uppercase block mt-1">on est en vacances</span>
        </div>
      </a>
      <div class="hidden md:flex items-center gap-2">
        <a href="/" class="nav-link ${active==='home'?'nav-link-active':''}">🏠 Accueil</a>
        <a href="/voyages" class="nav-link ${active==='voyages'?'nav-link-active':''}">✈️ Voyages</a>
        <a href="/admin" class="action-btn-sm">🔐 Admin</a>
      </div>
      <button onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" class="md:hidden p-2 rounded-xl text-stone-500 hover:bg-stone-100 transition-colors border border-white/10">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
    <div id="mobile-menu" class="hidden md:hidden pb-4">
      <div class="glass-panel rounded-3xl p-3 flex flex-col gap-1">
        <a href="/" class="mobile-nav-link ${active==='home'?'nav-link-active':''}">🏠 Accueil</a>
        <a href="/voyages" class="mobile-nav-link ${active==='voyages'?'nav-link-active':''}">✈️ Voyages</a>
        <a href="/admin" class="action-btn-sm justify-center">🔐 Admin</a>
      </div>
    </div>
  </div>
</nav>`;

export const FOOTER = `
<footer class="bg-stone-900 text-stone-300 py-12 mt-0">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="section-panel majorelle-frame rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div>
          <div class="flex items-center gap-3 mb-4">
            <span class="brand-mark text-xl">🌴</span>
            <div class="leading-none">
              <div class="brand-title font-display font-bold text-base">Tranquille,</div>
              <div class="brand-subtitle text-[0.72rem] font-bold uppercase tracking-[0.24em] mt-1">on est en vacances</div>
            </div>
          </div>
          <p class="text-stone-500 text-sm leading-relaxed">Le carnet de voyage de la famille Potet — des souvenirs partagés avec ceux qu'on aime.</p>
        </div>
        <div>
          <h3 class="text-stone-900 font-bold mb-4 text-sm uppercase tracking-[0.22em]">Explorer</h3>
          <ul class="space-y-2 text-sm">
            <li><a href="/" class="hover:text-sky-400 transition-colors">🏠 Accueil</a></li>
            <li><a href="/voyages" class="hover:text-sky-400 transition-colors">✈️ Tous les voyages</a></li>
          </ul>
        </div>
        <div>
          <h3 class="text-stone-900 font-bold mb-4 text-sm uppercase tracking-[0.22em]">Destinations</h3>
          <ul id="footer-dest" class="space-y-2 text-sm text-stone-500">
            <li>Chargement...</li>
          </ul>
        </div>
      </div>
      <div class="border-t border-stone-800 pt-6 text-center text-stone-500 text-sm">
        Famille Potet &bull; ${new Date().getFullYear()}
      </div>
    </div>
  </div>
</footer>`;

export const TOAST = `
<div id="toast" class="hidden fixed bottom-6 right-6 z-[200] bg-white rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-3 border border-stone-100 max-w-xs">
  <span id="toast-icon" class="text-xl flex-shrink-0"></span>
  <p id="toast-msg" class="text-stone-700 font-semibold text-sm"></p>
</div>`;

export const LIGHTBOX = `
<div id="lightbox" class="hidden fixed inset-0 z-[100] lightbox-bg bg-black/88 flex items-center justify-center" onclick="closeLightbox()">
  <button onclick="closeLightbox()" class="absolute top-4 right-4 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2.5 transition-all z-10">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
  </button>
  <button onclick="event.stopPropagation();lbNav(-1)" class="absolute left-3 sm:left-6 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-3 transition-all">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
  </button>
  <button onclick="event.stopPropagation();lbNav(1)" class="absolute right-3 sm:right-6 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-3 transition-all">
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
function lbNav(d){_lb.idx=(_lb.idx+d+_lb.photos.length)%_lb.photos.length;_updLb()}
function _updLb(){const p=_lb.photos[_lb.idx];document.getElementById('lb-img').src=p.url;document.getElementById('lb-img').alt=p.caption||'';document.getElementById('lb-caption').textContent=p.caption||'';document.getElementById('lb-counter').textContent=(_lb.idx+1)+' / '+_lb.photos.length}
document.addEventListener('keydown',e=>{if(document.getElementById('lightbox').classList.contains('hidden'))return;if(e.key==='Escape')closeLightbox();if(e.key==='ArrowLeft')lbNav(-1);if(e.key==='ArrowRight')lbNav(1)});
function toast(msg,type='ok'){const i=document.getElementById('toast-icon'),m=document.getElementById('toast-msg'),el=document.getElementById('toast');i.textContent=type==='ok'?'✅':type==='err'?'❌':'ℹ️';m.textContent=msg;el.classList.remove('hidden');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.add('hidden'),3000)}
fetch('/api/folders').then(r=>r.json()).then(data=>{const roots=data.filter(f=>!f.parent_id);document.getElementById('footer-dest').innerHTML=roots.map(f=>\`<li><a href="/voyages?folder=\${f.slug}" class="hover:text-sky-400 transition-colors">\${f.icon} \${f.name}</a></li>\`).join('')}).catch(()=>{});
</script>`;
