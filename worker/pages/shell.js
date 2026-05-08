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
  --majorelle:#6050DC;
  --majorelle-rgb:96,80,220;
  --majorelle-deep:#271D77;
  --majorelle-soft:#EEE9FF;
  --majorelle-wash:#F6F1FF;
  --palm:#2F7A59;
  --palm-rgb:47,122,89;
  --palm-deep:#1F5B41;
  --palm-soft:#E2F1E8;
  --sun:#F4C85D;
  --sun-soft:#FFF2CC;
  --sand:#FFF7E8;
  --ink:#241C58;
  --ink-rgb:36,28,88;
  --muted:#6D6598;
  --line:rgba(96,80,220,.18);
}
html{scroll-behavior:smooth}
body{background:radial-gradient(circle at 85% 10%,rgba(var(--majorelle-rgb),.13),transparent 28%),radial-gradient(circle at 12% 18%,rgba(var(--palm-rgb),.11),transparent 24%),linear-gradient(180deg,#FCFBFF 0%,#F7F2FF 52%,#FFF8EC 100%);color:var(--ink)}
.hero-overlay{background:linear-gradient(to top,rgba(var(--ink-rgb),.88) 0%,rgba(var(--ink-rgb),.32) 54%,transparent 100%),linear-gradient(135deg,rgba(var(--majorelle-rgb),.56) 0%,rgba(var(--palm-rgb),.34) 100%)}
.voyage-card{transition:transform .3s cubic-bezier(.34,1.56,.64,1),box-shadow .3s ease;border:1px solid rgba(96,80,220,.08)}
.voyage-card:hover{transform:translateY(-6px);box-shadow:0 24px 48px rgba(39,29,119,.14)}
.gradient-text{background:linear-gradient(135deg,var(--majorelle) 0%,var(--sun) 52%,var(--palm) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.prose-vacation h1,.prose-vacation h2,.prose-vacation h3{font-family:'Playfair Display',Georgia,serif;color:var(--majorelle-deep)}
.prose-vacation h1{font-size:2rem;margin:2rem 0 1rem;font-weight:800}
.prose-vacation h2{font-size:1.6rem;margin:1.8rem 0 .9rem;font-weight:700}
.prose-vacation h3{font-size:1.25rem;margin:1.4rem 0 .7rem;font-weight:700}
.prose-vacation p{margin:1rem 0;line-height:1.85}
.prose-vacation figure{margin:2rem auto;max-width:100%}
.prose-vacation figure img{border-radius:1rem;box-shadow:0 14px 32px rgba(39,29,119,.12);margin:0 auto}
.prose-vacation figcaption{margin-top:.6rem;font-size:.85rem;color:var(--muted);text-align:center;font-style:italic}
.prose-vacation ul,.prose-vacation ol{margin:1rem 0;padding-left:1.5rem}
.prose-vacation li{margin:.4rem 0}
.prose-vacation strong{color:var(--majorelle-deep);font-weight:700}
.prose-vacation em{color:var(--palm);font-weight:600}
.prose-vacation blockquote{border-left:4px solid var(--sun);padding:.6rem 0 .6rem 1rem;margin:1.5rem 0;color:var(--muted);font-style:italic;background:var(--sand);border-radius:0 16px 16px 0}
.prose-vacation a{color:var(--majorelle);text-decoration:underline}
.prose-vacation hr{margin:2rem 0;border-color:rgba(96,80,220,.12)}
.badge-published{background:linear-gradient(135deg,var(--palm-soft),#CBE5D8);color:var(--palm-deep)}
.badge-draft{background:linear-gradient(135deg,var(--sun-soft),#FFE3A6);color:#A06A00}
.lightbox-bg{backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.md-editor{font-family:'Courier New',monospace;font-size:.88rem;line-height:1.65;resize:vertical}
.page-in{animation:fadeIn .28s ease-in-out}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.float-anim{animation:float 3.5s ease-in-out infinite}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.line-clamp-3{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#F6F1FF}
::-webkit-scrollbar-thumb{background:rgba(96,80,220,.34);border-radius:3px}
.bg-sky-950{background-color:var(--majorelle-deep)!important}
.bg-sky-500,.hover\:bg-sky-600:hover{background-color:var(--majorelle)!important}
.bg-sky-50,.hover\:bg-sky-50:hover,.hover\:bg-sky-100:hover{background-color:var(--majorelle-soft)!important}
.bg-amber-50{background-color:#FFF2CC!important}
.bg-emerald-50,.hover\:bg-emerald-50:hover{background-color:var(--palm-soft)!important}
.bg-orange-500{background-color:#E4B24C!important}
.bg-black\/50{background-color:rgba(36,28,88,.5)!important}
.bg-stone-900{background:linear-gradient(135deg,var(--majorelle-deep),#1A1450)!important}
.text-stone-600{color:#5E578A!important}
.text-stone-500,.text-stone-400{color:var(--muted)!important}
.text-stone-300{color:#ECE6FF!important}
.border-stone-100,.border-stone-200{border-color:rgba(96,80,220,.12)!important}
.text-sky-100{color:#F1ECFF!important}
.text-sky-800,.text-sky-700,.text-sky-600,.hover\:text-sky-700:hover,.hover\:text-sky-600:hover,.hover\:text-sky-400:hover{color:var(--majorelle)!important}
.group:hover .group-hover\:text-sky-700{color:var(--majorelle)!important}
.text-orange-500,.text-orange-400,.hover\:text-orange-600:hover{color:var(--palm)!important}
.text-yellow-300{color:var(--sun)!important}
.text-amber-700,.text-amber-600,.hover\:text-amber-600:hover{color:#A06A00!important}
.text-emerald-700,.text-emerald-600,.hover\:text-emerald-600:hover{color:var(--palm)!important}
.border-sky-500,.border-sky-400,.focus\:border-sky-400:focus,.hover\:border-sky-300:hover{border-color:rgba(96,80,220,.42)!important}
.border-emerald-100{border-color:rgba(47,122,89,.18)!important}
.border-amber-100,.border-orange-500,.hover\:border-orange-300:hover{border-color:rgba(244,200,93,.34)!important}
.from-sky-500{--tw-gradient-from:var(--majorelle)!important;--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to,rgba(96,80,220,0))!important}
.from-emerald-500{--tw-gradient-from:var(--palm)!important;--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to,rgba(47,122,89,0))!important}
.from-sky-50{--tw-gradient-from:var(--majorelle-wash)!important;--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to,rgba(246,241,255,0))!important}
.via-white{--tw-gradient-stops:var(--tw-gradient-from),#FFFFFF,var(--tw-gradient-to,rgba(255,255,255,0))!important}
.to-blue-600,.to-blue-700{--tw-gradient-to:var(--palm)!important}
.to-green-600{--tw-gradient-to:var(--palm-deep)!important}
.to-orange-50{--tw-gradient-to:var(--sand)!important}
</style>
`;

export const NAV = (active = '') => `
<nav class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-stone-100">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <a href="/" class="flex items-center gap-2 group">
        <span class="text-2xl">🌴</span>
        <div class="leading-none">
          <span class="font-display font-bold text-base text-sky-600 group-hover:text-sky-700 transition-colors block">Tranquille,</span>
          <span class="text-xs font-bold text-emerald-600 block">on est en vacances</span>
        </div>
      </a>
      <div class="hidden md:flex items-center gap-5">
        <a href="/" class="text-stone-600 hover:text-sky-600 font-semibold transition-colors text-sm ${active==='home'?'text-sky-600':''}">🏠 Accueil</a>
        <a href="/voyages" class="text-stone-600 hover:text-sky-600 font-semibold transition-colors text-sm ${active==='voyages'?'text-sky-600':''}">✈️ Voyages</a>
        <a href="/admin" class="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:shadow-lg hover:scale-105 transition-all">🔐 Admin</a>
      </div>
      <button onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" class="md:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
    <div id="mobile-menu" class="hidden md:hidden pb-4">
      <div class="flex flex-col gap-1">
        <a href="/" class="px-4 py-2.5 text-stone-700 hover:bg-sky-50 hover:text-sky-600 rounded-xl font-semibold text-sm">🏠 Accueil</a>
        <a href="/voyages" class="px-4 py-2.5 text-stone-700 hover:bg-sky-50 hover:text-sky-600 rounded-xl font-semibold text-sm">✈️ Voyages</a>
        <a href="/admin" class="px-4 py-2.5 bg-sky-50 text-sky-700 rounded-xl font-bold text-sm">🔐 Admin</a>
      </div>
    </div>
  </div>
</nav>`;

export const FOOTER = `
<footer class="bg-stone-900 text-stone-300 py-12 mt-0">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
      <div>
        <div class="flex items-center gap-2 mb-4">
          <span class="text-3xl">🌴</span>
          <div class="leading-none">
            <div class="font-display font-bold text-white text-base">Tranquille,</div>
            <div class="text-emerald-600 text-xs font-bold">on est en vacances</div>
          </div>
        </div>
        <p class="text-stone-400 text-sm leading-relaxed">Le blog de voyage de la famille Potet.</p>
      </div>
      <div>
        <h3 class="text-white font-bold mb-4 text-sm uppercase tracking-wide">Navigation</h3>
        <ul class="space-y-2 text-sm">
          <li><a href="/" class="hover:text-sky-400 transition-colors">🏠 Accueil</a></li>
          <li><a href="/voyages" class="hover:text-sky-400 transition-colors">✈️ Tous les voyages</a></li>
        </ul>
      </div>
      <div>
        <h3 class="text-white font-bold mb-4 text-sm uppercase tracking-wide">Destinations</h3>
        <ul id="footer-dest" class="space-y-2 text-sm text-stone-400">
          <li>Chargement...</li>
        </ul>
      </div>
    </div>
    <div class="border-t border-stone-800 pt-6 text-center text-stone-500 text-sm">
      ✨ Fait avec amour par la famille Potet &bull; ${new Date().getFullYear()} ✨
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
// Load footer destinations
fetch('/api/folders').then(r=>r.json()).then(data=>{const roots=data.filter(f=>!f.parent_id);document.getElementById('footer-dest').innerHTML=roots.map(f=>`<li><a href="/voyages?folder=${f.slug}" class="hover:text-sky-400 transition-colors">${f.icon} ${f.name}</a></li>`).join('')}).catch(()=>{});
</script>`;
