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
  --lemon:#F6DA18;
  --lemon-rgb:246,218,24;
  --olive:#6D7F2B;
  --olive-rgb:109,127,43;
  --sand:#FDF7DE;
  --ink:#101B53;
  --muted:#2C3D76;
  --muted-deep:#1A2863;
  --panel:#FDF7DE;
  --panel-soft:rgba(253,247,222,.9);
  --line:rgba(16,27,83,.22);
  --line-strong:rgba(109,127,43,.58);
  --shadow:0 18px 42px rgba(3,16,105,.28);
  --shadow-soft:0 10px 24px rgba(6,26,155,.14);
  --shadow-strong:0 24px 52px rgba(3,16,105,.32);
}
html{scroll-behavior:smooth;background:var(--blue)}
body{
  position:relative;
  min-height:100vh;
  background:
    linear-gradient(180deg,#061A9B 0%,#061A9B 100%),
    var(--blue);
  color:var(--ink);
}
body::before{
  content:'';
  position:fixed;
  inset:0;
  pointer-events:none;
  background:
    linear-gradient(90deg, rgba(253,247,222,.04) 0 3%, transparent 3% 97%, rgba(253,247,222,.04) 97% 100%),
    repeating-linear-gradient(-38deg, rgba(253,247,222,.06) 0 2px, transparent 2px 34px),
    radial-gradient(circle at 82% 16%, rgba(var(--lemon-rgb),.12) 0 10%, transparent 34%);
  z-index:0;
}
body::after{
  content:'';
  position:fixed;
  inset:0;
  pointer-events:none;
  background:
    linear-gradient(90deg, transparent 0 5%, rgba(var(--olive-rgb),.22) 5% 5.25%, transparent 5.25% 94.75%, rgba(var(--olive-rgb),.22) 94.75% 95%, transparent 95% 100%),
    linear-gradient(0deg, transparent 0 14%, rgba(var(--lemon-rgb),.16) 14% 14.2%, transparent 14.2% 100%);
  z-index:0;
}
#navbar,main,#site-footer,#toast,#lightbox{position:relative;z-index:1}
.hero-overlay{background:rgba(6,26,155,.58)}
.glass-panel,.section-panel,.voyage-card,#toast{backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.section-panel,.voyage-card,.bg-white,.bg-stone-50,.bg-sky-50,.bg-emerald-50,.bg-amber-50,.bg-red-50,#toast{background:var(--panel)!important;border:1px solid var(--line)!important;color:var(--ink)!important;box-shadow:var(--shadow-soft)}
.glass-panel,.metric-card{background:var(--panel-soft)!important;border:1px solid rgba(var(--olive-rgb),.28)!important;box-shadow:var(--shadow)}
.voyage-card{transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease;background:var(--panel)!important}
.voyage-card:hover{transform:translateY(-6px);border-color:var(--line-strong)!important;box-shadow:var(--shadow-strong)}
.gradient-text{color:var(--blue);background:none!important;-webkit-text-fill-color:currentColor}
.eyebrow{display:inline-flex;align-items:center;gap:.6rem;border-radius:999px;padding:.65rem 1rem;background:rgba(var(--lemon-rgb),.2);border:1px solid rgba(var(--olive-rgb),.6);color:var(--muted-deep);font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;font-weight:800}
.eyebrow::before{content:'✦';color:var(--olive);font-size:.9rem;line-height:1}
.nav-link{color:var(--muted);font-size:.92rem;font-weight:700;padding:.72rem 1rem;border-radius:999px;transition:color .2s ease,background-color .2s ease,border-color .2s ease;border:1px solid transparent}
.nav-link:hover{color:var(--blue);background:rgba(var(--lemon-rgb),.2);border-color:rgba(var(--olive-rgb),.4)}
.action-btn,.action-btn-sm{display:inline-flex;align-items:center;justify-content:center;gap:.7rem;border-radius:999px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;transition:transform .2s ease,box-shadow .2s ease,background-color .2s ease,border-color .2s ease;background:linear-gradient(135deg,#F4D40B,#FFE254)!important;color:#1a2370!important;border:1px solid rgba(var(--olive-rgb),.75);box-shadow:0 14px 30px rgba(6,26,155,.26)}
.action-btn{padding:1rem 1.55rem}
.action-btn-sm{padding:.82rem 1.18rem;font-size:.82rem}
.action-btn:hover,.action-btn-sm:hover{transform:translateY(-2px);background:linear-gradient(135deg,#e7c500,#f3d62f)!important;border-color:var(--olive);box-shadow:0 18px 36px rgba(6,26,155,.32)}
.subtle-btn{display:inline-flex;align-items:center;justify-content:center;gap:.7rem;border-radius:999px;padding:.98rem 1.5rem;border:1px solid rgba(var(--olive-rgb),.55);background:rgba(252,251,244,.95);color:var(--olive);font-weight:700;letter-spacing:.08em;text-transform:uppercase;transition:background-color .2s ease,border-color .2s ease,transform .2s ease,color .2s ease}
.subtle-btn:hover{transform:translateY(-2px);border-color:var(--olive);background:rgba(var(--lemon-rgb),.17);color:var(--blue);box-shadow:0 14px 28px rgba(6,26,155,.18)}
.luxe-divider{height:2px;width:100%;background:linear-gradient(90deg,rgba(var(--olive-rgb),.14),rgba(var(--lemon-rgb),.42),rgba(var(--olive-rgb),.14))}
.orb{display:none}
.drame-badge{display:inline-flex;align-items:center;gap:.5rem;border-radius:999px;border:1px solid rgba(var(--olive-rgb),.48);background:linear-gradient(135deg,rgba(var(--lemon-rgb),.24),rgba(var(--lemon-rgb),.08));color:var(--olive);font-size:.875rem;font-style:italic;font-weight:600;padding:.55rem 1.1rem;margin-bottom:2rem;box-shadow:0 4px 14px rgba(6,26,155,.14),inset 0 1px 0 rgba(255,255,255,.8);letter-spacing:.01em;transition:transform .2s ease,box-shadow .2s ease}
.drame-badge:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(6,26,155,.2)}
.maroc-arch{position:relative;isolation:isolate;display:grid;gap:1.6rem;width:min(100%,69rem);min-height:clamp(35rem,58vw,46rem);overflow:clip;border:2px solid rgba(var(--lemon-rgb),.58);border-radius:24rem 24rem 2rem 2rem / 16rem 16rem 2rem 2rem;background:#061A9B;padding:clamp(5.8rem,8vw,7.1rem) clamp(1.15rem,3.2vw,3rem) clamp(2rem,4vw,3rem);box-shadow:0 26px 58px rgba(3,14,89,.44), inset 0 0 0 1px rgba(var(--olive-rgb),.3)}
.maroc-arch-copy,.maroc-arch-actions,.maroc-arch-highlights{width:min(100%,31rem)}
.maroc-arch-copy h1{max-width:11ch;text-wrap:balance;color:#FFF8DA}
.maroc-arch-copy .hero-intro{max-width:28rem;color:rgba(253,247,222,.92)!important}
.maroc-arch .eyebrow{align-self:flex-start;margin-top:0;margin-bottom:1.15rem;max-width:min(100%,25rem);padding:.72rem 1rem;font-size:.64rem;letter-spacing:.15em;line-height:1.45;white-space:normal;text-wrap:balance;background:rgba(var(--lemon-rgb),.95);color:#13256A;border-color:rgba(var(--olive-rgb),.8)}
.maroc-arch>*{position:relative;z-index:1}
.maroc-arch::before{content:'';position:absolute;inset:.7rem;border-radius:22.4rem 22.4rem 1.35rem 1.35rem / 14.6rem 14.6rem 1.35rem 1.35rem;border:1px solid rgba(var(--lemon-rgb),.5);background:linear-gradient(180deg,rgba(var(--lemon-rgb),.12),transparent 62%);z-index:0;pointer-events:none}
.maroc-arch::after{content:'';position:absolute;top:1.2rem;left:50%;transform:translateX(-50%);width:min(78%,26rem);height:1.08rem;background:repeating-linear-gradient(90deg,rgba(var(--lemon-rgb),.98) 0 14px,transparent 14px 21px);opacity:.88;z-index:0;pointer-events:none}
.maroc-arch-highlights span{background:rgba(var(--olive-rgb),.17)!important;border-color:rgba(var(--lemon-rgb),.56)!important;color:#fff7d8!important}
.majorelle-illustration{width:min(100%,21rem);margin:.2rem 0 .3rem;border:1px solid rgba(var(--lemon-rgb),.42);border-radius:1.5rem;padding:.8rem .8rem .7rem;background:linear-gradient(180deg,rgba(var(--lemon-rgb),.08),rgba(var(--olive-rgb),.16));box-shadow:inset 0 0 0 1px rgba(var(--olive-rgb),.26)}
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
::-webkit-scrollbar-track{background:rgba(6,26,155,.15)}
::-webkit-scrollbar-thumb{background:rgba(var(--lemon-rgb),.6);border-radius:999px}
::-webkit-scrollbar-thumb:hover{background:rgba(var(--lemon-rgb),.85)}
.bg-sky-950{background-color:rgba(var(--lemon-rgb),.14)!important}
.bg-sky-500,.hover\:bg-sky-600:hover{background-color:var(--blue)!important}
.bg-sky-50,.hover\:bg-sky-50:hover,.hover\:bg-sky-100:hover,.hover\:bg-emerald-50:hover{background-color:rgba(var(--lemon-rgb),.14)!important}
.bg-amber-50,.bg-emerald-50{background-color:rgba(var(--olive-rgb),.12)!important}
.bg-orange-500{background-color:rgba(var(--olive-rgb),.22)!important}
.bg-black\/50,.bg-black\/40,.bg-black\/88{background-color:rgba(6,26,155,.58)!important}
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
.bg-stone-100,.hover\:bg-stone-200:hover,.hover\:bg-stone-100:hover,.hover\:bg-stone-50:hover{background-color:rgba(var(--lemon-rgb),.13)!important}
input,textarea,select{background:#fffdf5!important;color:var(--ink)!important;border-color:var(--line)!important}
input::placeholder,textarea::placeholder{color:var(--muted)}
input:focus,textarea:focus,select:focus{border-color:var(--line-strong)!important;box-shadow:0 0 0 3px rgba(var(--lemon-rgb),.24)}
#dropzone{background:rgba(var(--lemon-rgb),.13);border-color:var(--line)!important}
#navbar{background:rgba(252,251,244,.92)!important;border-bottom:1px solid var(--line)!important;box-shadow:0 10px 28px rgba(6,26,155,.2);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
#site-footer{background:var(--panel)!important;border-top:1px solid var(--line)!important}
.bg-gradient-to-t,.bg-gradient-to-tr,.bg-gradient-to-r,.bg-gradient-to-br,.bg-gradient-to-b,.bg-gradient-to-bl,.bg-gradient-to-l,.bg-gradient-to-tl{background-image:none!important}
.from-sky-500,.from-emerald-500,.from-sky-50,.from-stone-900,.via-white,.to-blue-600,.to-blue-700,.to-green-600,.to-orange-50,.to-stone-800{--tw-gradient-from:initial!important;--tw-gradient-stops:initial!important;--tw-gradient-to:initial!important}
</style>
`;

export const NAV = (active = '') => `
<nav class="fixed top-0 left-0 right-0 z-50 backdrop-blur-md shadow-sm border-b border-stone-100">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <a href="/" class="flex items-center gap-3 group">
        <span class="text-2xl">🌴</span>
        <div class="leading-none">
          <span class="font-display font-bold text-base text-white group-hover:text-sky-600 transition-colors block">Tranquille,</span>
          <span class="text-[0.72rem] font-bold tracking-[0.24em] uppercase text-slate-400 block mt-1">on est en vacances</span>
        </div>
      </a>
      <div class="hidden md:flex items-center gap-2">
        <a href="/" class="px-4 py-2 rounded-full font-semibold transition-colors text-sm ${active==='home'?'bg-white/10 text-white border border-white/10':'text-stone-500 hover:text-sky-600'}">🏠 Accueil</a>
        <a href="/voyages" class="px-4 py-2 rounded-full font-semibold transition-colors text-sm ${active==='voyages'?'bg-white/10 text-white border border-white/10':'text-stone-500 hover:text-sky-600'}">✈️ Voyages</a>
        <a href="/admin" class="action-btn-sm">🔐 Admin</a>
      </div>
      <button onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" class="md:hidden p-2 rounded-lg text-stone-500 hover:bg-stone-100 transition-colors border border-white/10">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
    <div id="mobile-menu" class="hidden md:hidden pb-4">
      <div class="glass-panel rounded-3xl p-3 flex flex-col gap-1">
        <a href="/" class="px-4 py-2.5 text-stone-700 hover:bg-sky-50 hover:text-sky-600 rounded-xl font-semibold text-sm">🏠 Accueil</a>
        <a href="/voyages" class="px-4 py-2.5 text-stone-700 hover:bg-sky-50 hover:text-sky-600 rounded-xl font-semibold text-sm">✈️ Voyages</a>
        <a href="/admin" class="action-btn-sm justify-center">🔐 Admin</a>
      </div>
    </div>
  </div>
</nav>`;

export const FOOTER = `
<footer class="bg-stone-900 text-stone-300 py-12 mt-0">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="section-panel rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div>
          <div class="flex items-center gap-3 mb-4">
            <span class="text-3xl">🌴</span>
            <div class="leading-none">
              <div class="font-display font-bold text-white text-base">Tranquille,</div>
              <div class="text-slate-400 text-[0.72rem] font-bold uppercase tracking-[0.24em] mt-1">on est en vacances</div>
            </div>
          </div>
          <p class="text-stone-500 text-sm leading-relaxed">Le carnet de voyage de la famille Potet — des souvenirs partagés avec ceux qu'on aime.</p>
        </div>
        <div>
          <h3 class="text-white font-bold mb-4 text-sm uppercase tracking-[0.22em]">Explorer</h3>
          <ul class="space-y-2 text-sm">
            <li><a href="/" class="hover:text-sky-400 transition-colors">🏠 Accueil</a></li>
            <li><a href="/voyages" class="hover:text-sky-400 transition-colors">✈️ Tous les voyages</a></li>
          </ul>
        </div>
        <div>
          <h3 class="text-white font-bold mb-4 text-sm uppercase tracking-[0.22em]">Destinations</h3>
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
