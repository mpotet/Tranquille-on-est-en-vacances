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
  <section id="hero" class="relative min-h-screen flex items-center overflow-hidden bg-white">
    <div class="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-stone-900 pb-20 pt-28 sm:py-20">
      <div class="flex flex-col items-center gap-8">
        <div class="maroc-arch w-full mx-auto">
          <div class="maroc-arch-copy">
            <div class="eyebrow mb-6">Carnet de bord de la famille Potet</div>
            <h1 class="font-display text-4xl sm:text-5xl xl:text-[4.2rem] font-bold leading-[1.06] mb-6 drop-shadow-lg">
              Nos <span class="gradient-text">voyages en famille</span>, étape par étape.
            </h1>
            <p class="hero-intro text-base sm:text-xl text-stone-500 leading-relaxed mb-8">
              Chaque article raconte un voyage vécu par la famille Potet : itinéraire réel, activités avec les enfants et retours utiles.
            </p>
            <p class="drame-badge mb-8">🎭 "ça c'était bien avant le drame.."</p>
          </div>
          <div class="majorelle-illustration" aria-hidden="true">
            <svg viewBox="0 0 420 270" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="9" y="8" width="402" height="254" rx="34" fill="#0B239F"/>
              <path d="M28 213L122 177L203 196L282 164L392 201V244H28V213Z" fill="#6D7F2B"/>
              <path d="M40 223L131 186L213 205L299 173L380 202V243H40V223Z" fill="#87A037" opacity=".72"/>
              <path d="M110 162L130 149L148 154L162 147L170 159L188 150L206 164L221 155L240 170L254 162L270 176L292 172L307 182L321 178L337 194L353 190" stroke="#F6DA18" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M84 161C93 136 118 119 144 119C167 119 188 131 202 150C211 145 223 142 234 142C256 142 276 154 286 173" stroke="#F6DA18" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M170 166C179 147 199 134 221 134C236 134 252 140 263 152" stroke="#F6DA18" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M207 104C215 87 234 76 254 76C269 76 283 83 292 95C302 91 313 89 325 89C345 89 363 99 373 115" stroke="#F6DA18" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>
              <ellipse cx="196" cy="186" rx="77" ry="25" fill="#7A8F34"/>
              <path d="M130 176C130 152 154 134 187 134C219 134 241 147 248 166C264 166 278 176 278 190C278 205 266 214 253 214H151C139 214 130 205 130 194V176Z" fill="#F6DA18"/>
              <path d="M190 134C190 122 200 113 213 113C224 113 234 121 236 133C245 135 253 141 253 150C253 160 244 168 233 168H202C190 168 180 160 180 149C180 141 185 136 190 134Z" fill="#E5C80E"/>
              <path d="M232 116C232 104 242 95 255 95C269 95 280 104 280 117V136H232V116Z" fill="#F6DA18"/>
              <rect x="161" y="206" width="13" height="27" rx="5" fill="#E8CB11"/>
              <rect x="218" y="206" width="13" height="27" rx="5" fill="#E8CB11"/>
              <rect x="250" y="206" width="13" height="27" rx="5" fill="#E8CB11"/>
              <circle cx="212" cy="142" r="2.5" fill="#0B239F"/>
              <circle cx="144" cy="155" r="2.2" fill="#0B239F"/>
              <circle cx="195" cy="154" r="2.2" fill="#0B239F"/>
              <circle cx="223" cy="154" r="2.2" fill="#0B239F"/>
              <circle cx="171" cy="156" r="2.2" fill="#0B239F"/>
              <circle cx="248" cy="155" r="2.2" fill="#0B239F"/>
              <path d="M205 147L210 150L216 147" stroke="#0B239F" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="maroc-arch-actions flex flex-col sm:flex-row gap-3">
            <a href="/voyages" class="action-btn">Explorer nos voyages</a>
            <a href="/voyages" class="subtle-btn">Parcourir le carnet</a>
          </div>
          <div class="maroc-arch-highlights flex flex-wrap gap-3 mt-8 text-[0.7rem] uppercase tracking-[0.24em] text-slate-400 font-semibold">
            <span class="px-4 py-2 rounded-full border border-white/10 bg-white/5">✈️ Voyages vécus</span>
            <span class="px-4 py-2 rounded-full border border-white/10 bg-white/5">👨‍👩‍👧‍👦 Avec les enfants</span>
            <span class="px-4 py-2 rounded-full border border-white/10 bg-white/5">📸 Moments partagés</span>
          </div>
        </div>
        <div class="glass-panel rounded-[2rem] p-6 sm:p-8 overflow-hidden relative w-full max-w-xl mx-auto">
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
          <div class="luxe-divider my-5"></div>
          <div class="grid gap-4 text-sm text-stone-700 lg:grid-cols-2">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">Dans les valises</p>
              <p class="leading-relaxed">Des étapes vécues avec les enfants, les adresses qu'on a gardées et les petits moments qui ont rendu le voyage unique.</p>
            </div>
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">Repères utiles</p>
              <p class="leading-relaxed">Un aperçu rapide des récits récents, des destinations visitées et des souvenirs photo à parcourir sans se perdre.</p>
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
          <h2 class="font-display text-3xl sm:text-5xl font-bold text-stone-900">Nos derniers voyages</h2>
          <p class="text-slate-400 mt-3 text-sm sm:text-base max-w-2xl">Les récits les plus récents de nos vacances, avec nos coups de cœur, nos galères et nos meilleures trouvailles.</p>
        </div>
      <a href="/voyages" class="hidden sm:flex subtle-btn">Voir tous les voyages</a>
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
            <div class="eyebrow mb-4">Destinations de voyage</div>
            <h2 class="font-display text-3xl sm:text-4xl font-bold text-stone-900 mb-3">Nos destinations</h2>
            <p class="text-stone-500 text-sm">Choisissez une destination et retrouvez nos itinéraires, nos photos et ce qu'on referait (ou non) en famille.</p>
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
    </div>
    <div class="p-5">
      <div class="text-stone-400 text-xs mb-2 uppercase tracking-[0.16em]">📅 \${fmtDateRange(a)} · 📍 \${esc(a.destination)}</div>
      <h3 class="font-display font-bold text-lg text-stone-900 mb-2 line-clamp-2 leading-snug">\${esc(a.title)}</h3>
      <p class="text-stone-500 text-sm leading-relaxed line-clamp-2 mb-4">\${esc(a.short_description)}</p>
      \${a.folder_name?'<div class="mb-4"><span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-white border border-stone-200 text-stone-700">'+esc(a.folder_icon||'')+' '+esc(a.folder_name)+'</span></div>':''}
      <span class="text-sky-600 text-sm font-bold uppercase tracking-[0.14em]">Lire la suite →</span>
    </div>
  </article>\`;
}

async function init(){
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
    '<a href="/voyage/'+a.slug+'" aria-label="'+esc('Consulter le voyage '+(a.title||'')+' à '+(a.destination||''))+'" class="block rounded-[1.4rem] px-4 py-3 bg-white hover:bg-sky-50 transition-colors border border-stone-200">'+
      '<div class="flex items-center justify-between gap-3">'+
        '<div><div class="text-stone-900 font-semibold">'+esc(a.title)+'</div><div class="text-stone-500 text-xs mt-1 uppercase tracking-[0.18em]">'+esc(a.destination)+'</div></div>'+
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
