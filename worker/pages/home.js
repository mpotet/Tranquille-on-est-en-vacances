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
  <section id="hero" class="relative min-h-screen flex items-end sm:items-center overflow-hidden bg-sky-950">
    <div class="absolute inset-0">
      <img id="hero-img" src="" alt="Voyage en famille" class="w-full h-full object-cover opacity-0 transition-opacity duration-1000">
      <div class="absolute inset-0 hero-overlay"></div>
    </div>
    <div class="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 text-white pb-24 pt-28 sm:py-24">
      <div class="grid lg:grid-cols-[1.08fr_0.92fr] gap-10 items-center">
        <div class="max-w-3xl">
          <div class="eyebrow mb-6">Bleu Majorelle · Esprit riad</div>
          <h1 class="font-display text-4xl sm:text-5xl lg:text-7xl font-bold leading-[0.98] mb-6 drop-shadow-lg">
            Un carnet de voyage pensé comme un <span class="gradient-text">écrin familial</span>.
          </h1>
          <p class="text-base sm:text-xl text-slate-300 leading-relaxed mb-8 max-w-2xl">
            Des souvenirs enveloppés de bleu Majorelle, de lumière dorée et d'une mise en scène plus précieuse, plus chaleureuse, plus mémorable.
          </p>
          <div class="flex flex-col sm:flex-row gap-3">
            <a href="/voyages" class="action-btn">Explorer nos voyages</a>
            <a href="/voyages" class="subtle-btn">Ouvrir le salon photo</a>
          </div>
          <div class="flex flex-wrap gap-3 mt-8 text-[0.7rem] uppercase tracking-[0.24em] text-slate-400 font-semibold">
            <span class="px-4 py-2 rounded-full border border-white/10 bg-white/5">Récits immersifs</span>
            <span class="px-4 py-2 rounded-full border border-white/10 bg-white/5">Collections familiales</span>
            <span class="px-4 py-2 rounded-full border border-white/10 bg-white/5">Souvenirs éditorialisés</span>
          </div>
        </div>
        <div class="glass-panel rounded-[2rem] p-6 sm:p-8 overflow-hidden relative">
          <div class="grid gap-4 sm:grid-cols-3 mb-6" id="stats">
            <div class="bg-white rounded-[1.6rem] p-4 text-center"><div class="text-3xl font-black gradient-text">—</div><div class="text-stone-500 text-xs font-semibold mt-1 uppercase tracking-[0.2em]">voyages</div></div>
            <div class="bg-white rounded-[1.6rem] p-4 text-center"><div class="text-3xl font-black gradient-text">—</div><div class="text-stone-500 text-xs font-semibold mt-1 uppercase tracking-[0.2em]">destinations</div></div>
            <div class="bg-white rounded-[1.6rem] p-4 text-center"><div class="text-3xl font-black gradient-text">—</div><div class="text-stone-500 text-xs font-semibold mt-1 uppercase tracking-[0.2em]">photos</div></div>
          </div>
          <div class="section-panel rounded-[1.75rem] p-5">
            <p class="text-xs font-bold uppercase tracking-[0.22em] text-stone-500 mb-3">Dernières escales</p>
            <div id="hero-selection" class="space-y-3">
              <div class="h-16 rounded-[1.4rem] bg-white/5 border border-white/10 animate-pulse"></div>
              <div class="h-16 rounded-[1.4rem] bg-white/5 border border-white/10 animate-pulse"></div>
              <div class="h-16 rounded-[1.4rem] bg-white/5 border border-white/10 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div class="flex items-end justify-between mb-10 gap-6">
      <div>
        <div class="eyebrow mb-4">Sélection maison</div>
        <h2 class="font-display text-3xl sm:text-4xl font-bold text-stone-900">Derniers voyages</h2>
        <p class="text-stone-500 mt-2 text-sm max-w-2xl">Les aventures les plus récentes, mises en scène avec davantage de contraste, de matière et d'élégance.</p>
      </div>
      <a href="/voyages" class="hidden sm:flex subtle-btn">Voir toute la collection</a>
    </div>
    <div id="articles-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      ${skeletonCards(6)}
    </div>
    <div class="text-center mt-10 sm:hidden">
      <a href="/voyages" class="action-btn-sm">Voir tous les voyages</a>
    </div>
  </section>

  <section class="py-16">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="section-panel rounded-[2rem] p-8 sm:p-10">
        <div class="grid lg:grid-cols-[0.78fr_1.22fr] gap-8 items-start">
          <div>
            <div class="eyebrow mb-4">Routes & collections</div>
            <h2 class="font-display text-3xl sm:text-4xl font-bold text-stone-900 mb-3">Nos destinations</h2>
            <p class="text-stone-500 text-sm">Explorez le monde comme on traverse les salons d'un riad : une ambiance, une destination, une histoire.</p>
          </div>
          <div id="destinations" class="flex flex-wrap gap-3">
            <div class="w-32 h-12 bg-white/60 rounded-2xl animate-pulse"></div>
            <div class="w-28 h-12 bg-white/60 rounded-2xl animate-pulse"></div>
            <div class="w-36 h-12 bg-white/60 rounded-2xl animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  </section>

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
      <div class="absolute inset-0 bg-sky-50"></div>
      \${a.folder_name?'<div class="absolute top-3 left-3 glass-panel rounded-full px-3 py-1 text-xs font-bold text-stone-700">'+esc(a.folder_icon||'')+' '+esc(a.folder_name)+'</div>':''}
    </div>
    <div class="p-5">
      <div class="text-stone-400 text-xs mb-2 uppercase tracking-[0.16em]">📅 \${fmtDateRange(a)} · 📍 \${esc(a.destination)}</div>
      <h3 class="font-display font-bold text-lg text-stone-900 mb-2 line-clamp-2 leading-snug">\${esc(a.title)}</h3>
      <p class="text-stone-500 text-sm leading-relaxed line-clamp-2 mb-4">\${esc(a.short_description)}</p>
      <span class="text-sky-600 text-sm font-bold uppercase tracking-[0.14em]">Lire la suite →</span>
    </div>
  </article>\`;
}

async function init(){
  fetch('/api/articles?limit=1').then(r=>r.json()).then(data=>{
    if(data.articles?.[0]?.cover_url){
      const img=document.getElementById('hero-img');
      img.src=data.articles[0].cover_url;
      img.addEventListener('load',()=>img.classList.remove('opacity-0'));
    }
  }).catch(()=>{});

  const artData = await fetch('/api/articles?limit=6').then(r=>r.json()).catch(()=>({articles:[]}));
  document.getElementById('articles-grid').innerHTML = artData.articles.length
    ? artData.articles.map(articleCard).join('')
    : '<div class="col-span-3 text-center text-stone-400 py-16">Aucun voyage publié pour l\'instant.</div>';

  const totalPhotos = artData.articles.reduce((s,a)=>s+(a.photos_count||0),0);
  const folderData  = await fetch('/api/folders').then(r=>r.json()).catch(()=>[]);
  const statsEl = document.getElementById('stats');
  statsEl.querySelector('div:nth-child(1) .gradient-text').textContent = artData.total ?? artData.articles.length;
  statsEl.querySelector('div:nth-child(2) .gradient-text').textContent = folderData.length || '—';
  statsEl.querySelector('div:nth-child(3) .gradient-text').textContent = totalPhotos || '—';

  document.getElementById('hero-selection').innerHTML = artData.articles.slice(0,3).map((a, idx)=>
    '<a href="/voyage/'+a.slug+'" class="block rounded-[1.4rem] px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors border border-white/10">'+
      '<div class="flex items-center justify-between gap-3">'+
        '<div><div class="text-white font-semibold">'+esc(a.title)+'</div><div class="text-stone-400 text-xs mt-1 uppercase tracking-[0.18em]">'+esc(a.destination)+'</div></div>'+
        '<span class="text-stone-500 text-sm">0'+(idx + 1)+'</span>'+
      '</div>'+
    '</a>'
  ).join('') || '<div class="text-stone-400 text-sm">Aucun récit publié pour le moment.</div>';

  const roots = folderData.filter(f=>!f.parent_id);
  document.getElementById('destinations').innerHTML = roots.map(f=>
    '<a href="/voyages?folder='+f.slug+'" class="flex items-center gap-2 bg-white rounded-2xl px-5 py-3 shadow-sm hover:shadow-md hover:scale-105 transition-all font-semibold text-stone-700 border border-stone-100">'+
      '<span class="text-2xl">'+f.icon+'</span><span>'+esc(f.name)+'</span>'+
    '</a>'
  ).join('');
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
