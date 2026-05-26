/**
 * pages/home.js — Public home page template
 */

import { HEAD, NAV, FOOTER, TOAST, LIGHTBOX } from './shell.js';
import { html } from '../utils.js';

export function homePage() {
  return html(`<!DOCTYPE html>
<html lang="fr">
<head>${HEAD('Tranquille, on est en vacances')}</head>
<body class="bg-stone-50 font-sans text-stone-900 antialiased">
${NAV('home')}

<main class="pt-16">

  <!-- ── Hero photo plein écran ─────────────────────────────── -->
  <section id="hero" class="hero-photo" style="min-height:clamp(82vh,90vw,96vh);display:flex;align-items:center;justify-content:center">
    <img id="hero-bg" src="" alt="" class="hero-photo-img" aria-hidden="true" style="display:none">
    <div class="hero-photo-overlay"></div>
    <div class="hero-photo-content w-full py-24 sm:py-32">
      <div class="max-w-3xl mx-auto px-6 sm:px-10 lg:px-12 text-center">
        <div class="eyebrow mb-5 mx-auto" style="background:rgba(255,199,138,.22);border-color:rgba(255,199,138,.5);color:#fff">Carnet de bord de la famille Potet</div>
        <h1 id="hero-title" class="font-display text-4xl sm:text-5xl xl:text-6xl font-bold leading-[1.06] mb-5 text-white drop-shadow-lg mx-auto" style="max-width:16ch;text-wrap:balance">
          Nos <em style="color:var(--apricot);font-style:normal">voyages en famille</em>,<br>étape par étape.
        </h1>
        <p id="hero-subtitle" class="text-base sm:text-xl text-white/80 leading-relaxed mb-3 font-medium mx-auto" style="max-width:42ch">
          Chaque article raconte un voyage vécu par la famille Potet : itinéraire réel, activités avec les enfants et retours utiles.
        </p>
        <p class="drame-badge mb-8 mx-auto" style="border-color:rgba(255,199,138,.44);background:rgba(255,199,138,.16);color:rgba(255,255,255,.92);display:inline-block">"ça c'était bien avant le drame.."</p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/voyages" style="display:inline-flex;align-items:center;justify-content:center;gap:.55rem;padding:.85rem 1.75rem;border-radius:999px;background:var(--apricot);color:var(--ink);font-weight:700;font-size:.92rem;border:2px solid var(--apricot);box-shadow:0 6px 22px rgba(255,199,138,.40);transition:transform .2s,box-shadow .2s" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''"><i class="ph ph-airplane-takeoff"></i> Explorer nos voyages</a>
          <a href="/voyages" style="display:inline-flex;align-items:center;justify-content:center;gap:.55rem;padding:.82rem 1.6rem;border-radius:999px;background:rgba(255,255,255,.15);color:#fff;font-weight:700;font-size:.92rem;border:2px solid rgba(255,255,255,.45);backdrop-filter:blur(6px);transition:transform .2s,background .2s" onmouseover="this.style.background='rgba(255,255,255,.25)';this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(255,255,255,.15)';this.style.transform=''">Parcourir le carnet</a>
        </div>
      </div>
    </div>
  </section>

  <!-- ── Stats rapides ──────────────────────────────────────── -->
  <section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
    <div class="panel rounded-2xl px-6 py-5 grid grid-cols-3" style="divide-x:1px solid var(--line)">
      <div class="text-center px-4" style="border-right:1px solid var(--line)">
        <div id="stat-voyages" class="font-display text-3xl font-black" style="color:var(--blue)">—</div>
        <div class="text-xs font-semibold uppercase tracking-[.18em] mt-1" style="color:var(--ink-light)">Voyages</div>
      </div>
      <div class="text-center px-4" style="border-right:1px solid var(--line)">
        <div id="stat-dest" class="font-display text-3xl font-black" style="color:var(--blue)">—</div>
        <div class="text-xs font-semibold uppercase tracking-[.18em] mt-1" style="color:var(--ink-light)">Destinations</div>
      </div>
      <div class="text-center px-4">
        <div id="stat-photos" class="font-display text-3xl font-black" style="color:var(--blue)">—</div>
        <div class="text-xs font-semibold uppercase tracking-[.18em] mt-1" style="color:var(--ink-light)">Photos</div>
      </div>
    </div>
  </section>

  <!-- ── Derniers voyages ───────────────────────────────────── -->
  <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div class="flex items-end justify-between mb-10 gap-6">
      <div>
        <div class="eyebrow mb-4">Sélection maison</div>
        <h2 class="font-display text-3xl sm:text-5xl font-bold" style="color:var(--ink)">Nos derniers voyages</h2>
        <p class="mt-3 text-sm sm:text-base max-w-2xl" style="color:var(--ink-muted)">Les récits les plus récents de nos vacances, avec nos coups de cœur, nos galères et nos meilleures trouvailles.</p>
      </div>
      <a href="/voyages" class="hidden sm:inline-flex subtle-btn flex-shrink-0">Voir tout</a>
    </div>
    <div id="articles-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      ${skeletonCards(6)}
    </div>
    <div class="text-center mt-10 sm:hidden">
      <a href="/voyages" class="action-btn-sm">Voir tous les voyages</a>
    </div>
  </section>

  <!-- ── Dernières escales ──────────────────────────────────── -->
  <section class="py-12" style="background:var(--sand)">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between mb-7">
        <h2 class="font-display text-2xl sm:text-3xl font-bold" style="color:var(--ink)">Dernières escales</h2>
        <a href="/voyages" class="text-sm font-semibold hover:underline" style="color:var(--blue)">Voir tout →</a>
      </div>
      <div id="escales" class="grid gap-3 sm:grid-cols-3">
        ${Array.from({length:3}).map(()=>`<div class="h-20 rounded-2xl animate-pulse" style="background:var(--sand-deep)"></div>`).join('')}
      </div>
    </div>
  </section>

  <!-- ── Destinations ───────────────────────────────────────── -->
  <section class="py-16">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="panel rounded-[2rem] p-8 sm:p-10">
        <div class="grid lg:grid-cols-[1fr_1.5fr] gap-8 items-start">
          <div>
            <div class="eyebrow mb-4">Destinations de voyage</div>
            <h2 class="font-display text-3xl sm:text-4xl font-bold mb-3" style="color:var(--ink)">Nos destinations</h2>
            <p class="text-sm" style="color:var(--ink-muted)">Choisissez une destination et retrouvez nos itinéraires, nos photos et ce qu'on referait (ou non) en famille.</p>
          </div>
          <div id="destinations" class="flex flex-wrap gap-3">
            ${Array.from({length:3}).map(()=>`<div class="w-32 h-12 rounded-2xl animate-pulse" style="background:var(--sand)"></div>`).join('')}
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ── Citation ───────────────────────────────────────────── -->
  <section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
    <div class="quote-block">
      <blockquote id="site-tagline" class="font-display text-2xl sm:text-3xl italic leading-relaxed" style="color:var(--ink)">
        "Les voyages sont la seule chose qu'on achète qui nous rend plus riches."
      </blockquote>
      <p class="mt-4 font-medium text-sm" style="color:var(--ink-muted)">— Devise de la famille Potet <i class="ph ph-globe-hemisphere-west" style="color:var(--blue)"></i></p>
    </div>
  </section>

</main>

${FOOTER}
${TOAST}
${LIGHTBOX}

<script>
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function fmtDate(d){return new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}
function fmtDateRange(a){
  const s=a.start_date||a.date,e=a.end_date||a.date;
  if(!s) return 'Dates non définies';
  return s===e ? fmtDate(s) : fmtDate(s)+' → '+fmtDate(e);
}

function articleCard(a){
  return \`<article class="voyage-card cursor-pointer group" onclick="location.href='/voyage/\${a.slug}'" role="link" tabindex="0" onkeydown="if(event.key==='Enter')location.href='/voyage/\${a.slug}'" aria-label="\${esc('Lire le voyage : '+(a.title||'')+(a.destination?' — '+a.destination:''))}">
    <div class="relative overflow-hidden" style="height:15rem;border-radius:1.5rem 1.5rem 0 0">
      <img src="\${esc(a.cover_url||'')}" alt="\${esc(a.title)}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" onerror="this.src='https://picsum.photos/seed/\${a.id}x/800/600'">
      \${a.folder_name?'<div class="absolute top-3 left-3"><span class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm" style="background:rgba(255,253,249,.92);color:var(--palm);border:1px solid rgba(255,255,255,.6)">'+esc(a.folder_icon||'')+' '+esc(a.folder_name)+'</span></div>':''}
    </div>
    <div class="p-5">
      <div class="flex items-center gap-2 text-xs font-medium mb-2.5" style="color:var(--ink-light)">
        <span><i class="ph ph-calendar-blank"></i> \${fmtDateRange(a)}</span><span aria-hidden="true">·</span><span><i class="ph ph-map-pin"></i> \${esc(a.destination)}</span>
      </div>
      <h3 class="font-display font-bold text-lg leading-snug mb-2 line-clamp-2" style="color:var(--ink)">\${esc(a.title)}</h3>
      <p class="text-sm leading-relaxed line-clamp-2 mb-4" style="color:var(--ink-muted)">\${esc(a.short_description)}</p>
      <span class="inline-flex items-center gap-1.5 text-sm font-semibold" style="color:var(--blue)">Lire la suite
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </span>
    </div>
  </article>\`;
}

async function init(){
  const [settings, artData, folderData] = await Promise.all([
    fetch('/api/settings').then(r=>r.json()).catch(()=>({})),
    fetch('/api/articles?limit=6').then(r=>r.json()).catch(()=>({articles:[],total:0})),
    fetch('/api/folders').then(r=>r.json()).catch(()=>[]),
  ]);

  // Hero depuis settings
  const bgEl = document.getElementById('hero-bg');
  if(settings.hero_image_url){ bgEl.src=settings.hero_image_url; bgEl.style.display='block'; }
  if(settings.hero_title)     document.getElementById('hero-title').innerHTML = esc(settings.hero_title);
  if(settings.hero_subtitle)  document.getElementById('hero-subtitle').textContent = settings.hero_subtitle;
  if(settings.site_tagline)   document.getElementById('site-tagline').textContent = '"'+settings.site_tagline+'"';

  // Stats
  const totalPhotos = artData.articles.reduce((s,a)=>s+(a.photos_count||0),0);
  document.getElementById('stat-voyages').textContent = artData.total ?? artData.articles.length;
  document.getElementById('stat-dest').textContent    = folderData.length || '—';
  document.getElementById('stat-photos').textContent  = totalPhotos || '—';

  // Grille articles
  document.getElementById('articles-grid').innerHTML = artData.articles.length
    ? artData.articles.map(articleCard).join('')
    : '<div class="col-span-3 text-center py-16" style="color:var(--ink-light)">Aucun voyage publié pour l\\'instant.</div>';

  // Escales
  document.getElementById('escales').innerHTML = artData.articles.slice(0,3).map((a,i)=>
    '<a href="/voyage/'+a.slug+'" aria-label="'+esc('Consulter : '+(a.title||''))+'"\
       class="block rounded-2xl p-4 bg-white transition-all hover:-translate-y-0.5"\
       style="border:1px solid var(--line);box-shadow:var(--card-shadow)">'+
      '<div class="flex items-center justify-between gap-3">'+
        '<div>'+
          '<div class="font-semibold text-sm" style="color:var(--ink)">'+esc(a.title)+'</div>'+
          '<div class="text-xs mt-0.5 uppercase tracking-[.16em]" style="color:var(--ink-light)">'+esc(a.destination)+'</div>'+
        '</div>'+
        '<span class="text-sm font-bold flex-shrink-0" style="color:var(--ink-light)">0'+(i+1)+'</span>'+
      '</div>'+
    '</a>'
  ).join('') || '<p class="text-sm" style="color:var(--ink-light)">Aucun récit publié pour le moment.</p>';

  // Destinations
  const roots = folderData.filter(f=>!f.parent_id);
  document.getElementById('destinations').innerHTML = roots.map(f=>
    '<a href="/voyages?folder='+f.slug+'"\
       class="flex items-center gap-2.5 rounded-2xl px-5 py-3 bg-white transition-all font-semibold hover:-translate-y-0.5"\
       style="border:1px solid var(--line);box-shadow:var(--card-shadow);color:var(--ink)">'+
      '<span class="text-xl" aria-hidden="true">'+f.icon+'</span>'+
      '<span>'+esc(f.name)+'</span>'+
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
    <div class="bg-white rounded-3xl overflow-hidden" style="border:1px solid var(--line);box-shadow:var(--card-shadow)">
      <div class="h-56 animate-pulse" style="background:var(--sand)"></div>
      <div class="p-5 space-y-3">
        <div class="h-3 animate-pulse rounded-full w-1/2" style="background:var(--sand)"></div>
        <div class="h-5 animate-pulse rounded-full w-4/5" style="background:var(--sand)"></div>
        <div class="h-3 animate-pulse rounded-full w-full" style="background:var(--sand)"></div>
        <div class="h-3 animate-pulse rounded-full w-3/4" style="background:var(--sand)"></div>
      </div>
    </div>`).join('');
}
