/**
 * pages/home.js — Public home page template
 */

import { HEAD, NAV, FOOTER, TOAST, LIGHTBOX } from './shell.js';
import { html } from '../utils.js';

export function homePage() {
  return html(`<!DOCTYPE html>
<html lang="fr">
<head>${HEAD('Tranquille, on est en vacances 🌴')}</head>
<body class="bg-stone-50 font-sans text-stone-900 antialiased">
${NAV('home')}

<main class="pt-16">

  <!-- Hero -->
  <section id="hero" class="relative min-h-screen flex items-end sm:items-center overflow-hidden bg-sky-950">
    <div class="absolute inset-0">
      <img id="hero-img" src="" alt="Voyage en famille" class="w-full h-full object-cover opacity-0 transition-opacity duration-1000">
      <div class="absolute inset-0 hero-overlay"></div>
    </div>
    <div class="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 text-white pb-24 pt-28 sm:py-24">
      <div class="max-w-xl">
        <div class="inline-flex items-center gap-2 mb-5 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-4 py-2">
          <span class="text-xl float-anim">🌴</span>
          <span class="text-sm font-semibold">Le blog de voyage de la famille Potet</span>
        </div>
        <h1 class="font-display text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] mb-5 drop-shadow-lg">
          Tranquille,<br><span class="text-yellow-300">on est en</span><br>vacances ! ☀️
        </h1>
        <p class="text-base sm:text-xl text-white/85 leading-relaxed mb-8">
          Nos aventures, nos découvertes, nos coups de cœur.<br class="hidden sm:block">Des souvenirs à partager avec ceux qu'on aime.
        </p>
        <div class="flex flex-col sm:flex-row gap-3">
          <a href="/voyages" class="inline-flex items-center justify-center gap-2 bg-white text-sky-700 font-bold px-7 py-4 rounded-2xl hover:bg-yellow-300 hover:text-stone-900 transition-all hover:scale-105 shadow-xl">✈️ Découvrir nos voyages</a>
          <a href="/voyages" class="inline-flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm text-white font-bold px-7 py-4 rounded-2xl hover:bg-white/30 transition-all border border-white/40">📸 Voir les photos</a>
        </div>
      </div>
    </div>
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 flex flex-col items-center gap-1 animate-bounce">
      <span class="text-xs font-medium tracking-wider uppercase">Découvrir</span>
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
    </div>
  </section>

  <!-- Stats bar -->
  <section class="bg-white shadow-sm border-b border-stone-100">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div id="stats" class="grid grid-cols-3 gap-4 text-center">
        <div><div class="text-3xl font-black gradient-text">—</div><div class="text-stone-500 text-xs font-semibold mt-1 uppercase tracking-wide">voyages</div></div>
        <div><div class="text-3xl font-black gradient-text">—</div><div class="text-stone-500 text-xs font-semibold mt-1 uppercase tracking-wide">destinations</div></div>
        <div><div class="text-3xl font-black gradient-text">—</div><div class="text-stone-500 text-xs font-semibold mt-1 uppercase tracking-wide">photos</div></div>
      </div>
    </div>
  </section>

  <!-- Latest voyages -->
  <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div class="flex items-end justify-between mb-10">
      <div>
        <h2 class="font-display text-3xl sm:text-4xl font-bold text-stone-900">Derniers voyages ✈️</h2>
        <p class="text-stone-500 mt-2 text-sm">Nos aventures les plus récentes</p>
      </div>
      <a href="/voyages" class="hidden sm:flex items-center gap-1.5 text-sky-600 hover:text-sky-700 font-bold transition-colors text-sm">
        Tout voir <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </a>
    </div>
    <div id="articles-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      ${skeletonCards(6)}
    </div>
    <div class="text-center mt-10 sm:hidden">
      <a href="/voyages" class="inline-flex items-center gap-2 bg-sky-500 text-white font-bold px-6 py-3 rounded-2xl hover:bg-sky-600 transition-colors">Voir tous les voyages →</a>
    </div>
  </section>

  <!-- Destinations chips -->
  <section class="bg-gradient-to-br from-sky-50 to-orange-50 py-16">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 class="font-display text-3xl sm:text-4xl font-bold text-stone-900 mb-2">Nos destinations 🗺️</h2>
      <p class="text-stone-500 text-sm mb-10">Explorez le monde avec nous</p>
      <div id="destinations" class="flex flex-wrap justify-center gap-3">
        <div class="w-32 h-12 bg-white/60 rounded-2xl animate-pulse"></div>
        <div class="w-28 h-12 bg-white/60 rounded-2xl animate-pulse"></div>
        <div class="w-36 h-12 bg-white/60 rounded-2xl animate-pulse"></div>
      </div>
    </div>
  </section>

  <!-- Quote -->
  <section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
    <blockquote class="font-display text-2xl sm:text-3xl text-stone-600 italic leading-relaxed">
      "Les voyages sont la seule chose qu'on achète qui nous rend plus riches."
    </blockquote>
    <p class="text-stone-400 mt-4 font-medium text-sm">— Devise de la famille Potet 🌍</p>
  </section>
</main>

${FOOTER}
${TOAST}
${LIGHTBOX}

<script>
// ── Helpers ───────────────────────────────────────────────────
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function fmtDate(d){return new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}
function fmtDateRange(a){
  const s = a.start_date || a.date;
  const e = a.end_date || a.date;
  if (!s) return 'Dates non définies';
  return s === e ? fmtDate(s) : fmtDate(s)+' → '+fmtDate(e);
}

function articleCard(a){
  return \`<article class="voyage-card bg-white rounded-3xl overflow-hidden shadow-md cursor-pointer" onclick="location.href='/voyage/\${a.slug}'">
    <div class="relative h-52 overflow-hidden">
      <img src="\${esc(a.cover_url||'')}" alt="\${esc(a.title)}" class="w-full h-full object-cover transition-transform duration-500 hover:scale-110" loading="lazy" onerror="this.src='https://picsum.photos/seed/\${a.id}x/800/600'">
      <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      \${a.folder_name?'<div class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold text-stone-700">'+esc(a.folder_icon||'')+'  '+esc(a.folder_name)+'</div>':''}
    </div>
    <div class="p-5">
      <div class="text-stone-400 text-xs mb-2">📅 \${fmtDateRange(a)} · 📍 \${esc(a.destination)}</div>
      <h3 class="font-display font-bold text-lg text-stone-900 mb-2 line-clamp-2 leading-snug">\${esc(a.title)}</h3>
      <p class="text-stone-500 text-sm leading-relaxed line-clamp-2 mb-4">\${esc(a.short_description)}</p>
      <span class="text-sky-600 text-sm font-bold">Lire la suite →</span>
    </div>
  </article>\`;
}

// ── Load data ─────────────────────────────────────────────────
async function init(){
  // Hero image (first article cover)
  fetch('/api/articles?limit=1').then(r=>r.json()).then(data=>{
    if(data.articles?.[0]?.cover_url){
      const img=document.getElementById('hero-img');
      img.src=data.articles[0].cover_url;
      img.addEventListener('load',()=>img.classList.remove('opacity-0'));
    }
  }).catch(()=>{});

  // Articles
  const artData = await fetch('/api/articles?limit=6').then(r=>r.json()).catch(()=>({articles:[]}));
  document.getElementById('articles-grid').innerHTML = artData.articles.length
    ? artData.articles.map(articleCard).join('')
    : '<div class="col-span-3 text-center text-stone-400 py-16">Aucun voyage publié pour l\'instant.</div>';

  // Stats
  const totalPhotos = artData.articles.reduce((s,a)=>s+(a.photos_count||0),0);
  const folderData  = await fetch('/api/folders').then(r=>r.json()).catch(()=>[]);
  const statsEl = document.getElementById('stats');
  statsEl.querySelector('div:nth-child(1) .gradient-text').textContent = artData.total ?? artData.articles.length;
  statsEl.querySelector('div:nth-child(2) .gradient-text').textContent = folderData.length || '—';
  statsEl.querySelector('div:nth-child(3) .gradient-text').textContent = totalPhotos || '—';

  // Destinations
  const roots = folderData.filter(f=>!f.parent_id);
  document.getElementById('destinations').innerHTML = roots.map(f=>\`
    <a href="/voyages?folder=\${f.slug}" class="flex items-center gap-2 bg-white rounded-2xl px-5 py-3 shadow-sm hover:shadow-md hover:scale-105 transition-all font-semibold text-stone-700 border border-stone-100">
      <span class="text-2xl">\${f.icon}</span><span>\${esc(f.name)}</span>
    </a>\`).join('');
}

init();
</script>
</body>
</html>`);
}

function skeletonCards(n) {
  return Array.from({length:n}).map(()=>`
    <div class="bg-white rounded-3xl overflow-hidden shadow-md">
      <div class="h-52 bg-stone-200 animate-pulse"></div>
      <div class="p-5 space-y-3">
        <div class="h-3 bg-stone-200 animate-pulse rounded w-1/2"></div>
        <div class="h-5 bg-stone-200 animate-pulse rounded w-4/5"></div>
        <div class="h-3 bg-stone-200 animate-pulse rounded w-full"></div>
        <div class="h-3 bg-stone-200 animate-pulse rounded w-3/4"></div>
      </div>
    </div>`).join('');
}
