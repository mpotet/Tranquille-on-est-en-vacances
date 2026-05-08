/**
 * pages/shell.js — Shared HTML shell (head + nav + footer) injected into every page.
 *
 * The Cloudflare Worker serves these as full HTML documents.
 * Each page is a single HTML file; JavaScript fetches data from /api/* at runtime.
 */

export const HEAD = (title = 'Tranquille, on est en vacances 🌴', description = "Le blog de voyage de la famille Potet") => `
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
  --blue:#6050DC;
  --blue-rgb:96,80,220;
  --orange:#C65A1E;
  --orange-rgb:198,90,30;
  --white:#FFFFFF;
  --ink:#6050DC;
  --muted:rgba(96,80,220,.82);
  --muted-deep:rgba(96,80,220,.62);
  --panel:#FFFFFF;
  --panel-soft:rgba(96,80,220,.05);
  --line:rgba(96,80,220,.22);
  --line-strong:rgba(96,80,220,.38);
  --shadow:0 16px 38px rgba(96,80,220,.12);
}
html{scroll-behavior:smooth;background:var(--white)}
body{position:relative;min-height:100vh;background:var(--white);color:var(--ink)}
body::before,body::after{display:none}
.hero-overlay{background:rgba(96,80,220,.26)}
.glass-panel,.section-panel,.voyage-card,#toast{backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.section-panel,.voyage-card,.bg-white,.bg-stone-50,.bg-sky-50,.bg-emerald-50,.bg-amber-50,.bg-red-50,#toast{background:var(--panel)!important;border:1px solid var(--line)!important;color:var(--ink)!important;box-shadow:var(--shadow)}
.glass-panel,.metric-card{background:var(--panel-soft)!important;border:1px solid var(--line)!important;box-shadow:var(--shadow)}
.voyage-card{transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease;background:var(--panel)!important}
.voyage-card:hover{transform:translateY(-6px);border-color:var(--line-strong)!important;box-shadow:0 20px 44px rgba(96,80,220,.16)}
.gradient-text{color:var(--blue);background:none!important;-webkit-text-fill-color:currentColor}
.eyebrow{display:inline-flex;align-items:center;gap:.6rem;border-radius:999px;padding:.65rem 1rem;background:rgba(96,80,220,.08);border:1px solid var(--line-strong);color:var(--muted);font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;font-weight:800}
.eyebrow::before{content:'✦';color:var(--orange);font-size:.9rem;line-height:1}
.nav-link{color:var(--muted);font-size:.92rem;font-weight:700;padding:.72rem 1rem;border-radius:999px;transition:color .2s ease,background-color .2s ease,border-color .2s ease;border:1px solid transparent}
.nav-link:hover{color:var(--blue);background:rgba(96,80,220,.08);border-color:var(--line)}
.action-btn,.action-btn-sm{display:inline-flex;align-items:center;justify-content:center;gap:.7rem;border-radius:999px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;transition:transform .2s ease,box-shadow .2s ease,background-color .2s ease,border-color .2s ease;background:var(--blue)!important;color:#fff!important;border:1px solid rgba(96,80,220,.65);box-shadow:0 12px 28px rgba(96,80,220,.22)}
.action-btn{padding:1rem 1.55rem}
.action-btn-sm{padding:.82rem 1.18rem;font-size:.82rem}
.action-btn:hover,.action-btn-sm:hover{transform:translateY(-2px);background:var(--blue)!important;border-color:var(--blue);box-shadow:0 16px 34px rgba(96,80,220,.26)}
.subtle-btn{display:inline-flex;align-items:center;justify-content:center;gap:.7rem;border-radius:999px;padding:.98rem 1.5rem;border:1px solid var(--line-strong);background:#fff;color:var(--blue);font-weight:700;letter-spacing:.08em;text-transform:uppercase;transition:background-color .2s ease,border-color .2s ease,transform .2s ease,color .2s ease}
.subtle-btn:hover{transform:translateY(-2px);border-color:var(--blue);background:rgba(96,80,220,.08);color:var(--blue)}
.luxe-divider{height:1px;width:100%;background:rgba(96,80,220,.25)}
.orb{display:none}
.prose-vacation h1,.prose-vacation h2,.prose-vacation h3{font-family:'Playfair Display',Georgia,serif;color:var(--ink);letter-spacing:-.03em}
.prose-vacation h1{font-size:2rem;margin:2rem 0 1rem;font-weight:700}
.prose-vacation h2{font-size:1.6rem;margin:1.8rem 0 .9rem;font-weight:700}
.prose-vacation h3{font-size:1.25rem;margin:1.4rem 0 .7rem;font-weight:700}
.prose-vacation p{margin:1rem 0;line-height:1.85;color:var(--muted)}
.prose-vacation figure{margin:2rem auto;max-width:100%}
.prose-vacation figure img{border-radius:1rem;box-shadow:0 10px 24px rgba(96,80,220,.16);margin:0 auto}
.prose-vacation figcaption{margin-top:.6rem;font-size:.85rem;color:var(--muted-deep);text-align:center;font-style:italic}
.prose-vacation ul,.prose-vacation ol{margin:1rem 0;padding-left:1.5rem;color:var(--muted)}
.prose-vacation li{margin:.4rem 0}
.prose-vacation strong{color:var(--ink);font-weight:700}
.prose-vacation em{color:var(--orange);font-weight:600}
.prose-vacation blockquote{border-left:4px solid rgba(198,90,30,.55);padding:.75rem 0 .75rem 1rem;margin:1.5rem 0;color:var(--muted);font-style:italic;background:rgba(96,80,220,.06);border-radius:0 16px 16px 0}
.prose-vacation a{color:var(--blue);text-decoration:underline}
.prose-vacation hr{margin:2rem 0;border-color:rgba(96,80,220,.2)}
.badge-published{background:rgba(198,90,30,.14);color:var(--orange);border:1px solid rgba(198,90,30,.35)}
.badge-draft{background:rgba(96,80,220,.12);color:var(--blue);border:1px solid rgba(96,80,220,.3)}
.lightbox-bg{backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.md-editor{font-family:'Courier New',monospace;font-size:.88rem;line-height:1.65;resize:vertical}
.page-in{animation:fadeIn .28s ease-in-out}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.float-anim{animation:float 3.5s ease-in-out infinite}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.menu-slide{animation:slideDown .22s ease-out}
@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
.folder-row{transition:background-color .14s ease,border-color .14s ease;border:1px solid transparent}
.folder-row:hover{background:rgba(96,80,220,.08);border-color:rgba(96,80,220,.25)}
.line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.line-clamp-3{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
::-webkit-scrollbar{width:8px}
::-webkit-scrollbar-track{background:rgba(96,80,220,.08)}
::-webkit-scrollbar-thumb{background:rgba(96,80,220,.35);border-radius:999px}
::-webkit-scrollbar-thumb:hover{background:rgba(96,80,220,.5)}
.bg-sky-950{background-color:rgba(96,80,220,.08)!important}
.bg-sky-500,.hover\:bg-sky-600:hover{background-color:var(--blue)!important}
.bg-sky-50,.hover\:bg-sky-50:hover,.hover\:bg-sky-100:hover,.hover\:bg-emerald-50:hover{background-color:rgba(96,80,220,.08)!important}
.bg-amber-50,.bg-emerald-50{background-color:rgba(96,80,220,.05)!important}
.bg-orange-500{background-color:rgba(198,90,30,.18)!important}
.bg-black\/50,.bg-black\/40,.bg-black\/88{background-color:rgba(96,80,220,.18)!important}
.bg-stone-900{background:#fff!important;border-top:1px solid var(--line)!important}
.text-stone-600,.text-stone-700,.text-stone-800,.text-stone-900,.text-white,.text-slate-100,.text-slate-200{color:var(--ink)!important}
.text-stone-500,.text-slate-300{color:var(--muted)!important}
.text-stone-400,.text-slate-400,.text-slate-500,.text-stone-300{color:var(--muted-deep)!important}
.text-sky-100,.text-sky-800,.text-sky-700,.text-sky-600,.hover\:text-sky-700:hover,.hover\:text-sky-600:hover,.hover\:text-sky-400:hover,.text-cyan-300,.text-cyan-200,.hover\:text-cyan-300:hover,.hover\:text-cyan-200:hover{color:var(--blue)!important}
.group:hover .group-hover\:text-sky-700{color:var(--blue)!important}
.text-orange-500,.text-orange-400,.hover\:text-orange-600:hover,.text-yellow-300,.text-amber-700,.text-amber-600,.text-red-700,.text-red-600{color:var(--orange)!important}
.text-emerald-700,.text-emerald-600,.hover\:text-emerald-600:hover{color:var(--blue)!important}
.border-stone-100,.border-stone-200,.border-stone-300,.border-stone-800,.border-sky-100,.border-red-100,.border-emerald-100,.border-amber-100,.border-white\/10{border-color:var(--line)!important}
.border-sky-500,.border-sky-400,.focus\:border-sky-400:focus,.hover\:border-sky-300:hover,.hover\:border-cyan-300\/30:hover,.border-cyan-400\/20,.border-orange-500,.hover\:border-orange-300:hover{border-color:var(--line-strong)!important}
.bg-cyan-500\/10,.bg-white\/5{background-color:rgba(96,80,220,.06)!important}
.bg-white\/10{background-color:rgba(96,80,220,.1)!important}
.bg-red-500,.hover\:bg-red-600:hover{background-color:rgba(198,90,30,.22)!important}
.bg-stone-100,.hover\:bg-stone-200:hover,.hover\:bg-stone-100:hover,.hover\:bg-stone-50:hover{background-color:rgba(96,80,220,.06)!important}
input,textarea,select{background:#fff!important;color:var(--ink)!important;border-color:var(--line)!important}
input::placeholder,textarea::placeholder{color:var(--muted-deep)}
input:focus,textarea:focus,select:focus{border-color:var(--line-strong)!important;box-shadow:0 0 0 3px rgba(96,80,220,.12)}
#dropzone{background:rgba(96,80,220,.06);border-color:var(--line)!important}
#navbar{background:rgba(255,255,255,.95)!important;border-bottom:1px solid var(--line)!important;box-shadow:0 8px 24px rgba(96,80,220,.1);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
#site-footer{background:#fff!important;border-top:1px solid var(--line)!important}
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
          <p class="text-stone-500 text-sm leading-relaxed">Un carnet de voyage familial épuré, sur fond blanc avec bleu #6050DC et quelques touches orange brûlé.</p>
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
        Bleu #6050DC &bull; ${new Date().getFullYear()}
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
