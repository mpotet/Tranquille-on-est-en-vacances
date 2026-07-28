/**
 * pages/home.js - Public home page template
 */

import { HEAD, NAV, FOOTER, TOAST, LIGHTBOX } from './shell.js';
import { html } from '../utils.js';
import { safeAttr, safeText } from '../helpers/html.js';

export function homePage(authed=false) {
  return html(`<!DOCTYPE html>
<html lang="fr">
<head>${HEAD('Tranquille, on est en vacances')}</head>
<body class="bg-stone-50 font-sans text-stone-900 antialiased">
${NAV('home', authed)}

<main class="pt-16">

  <!-- ── Hero photo ─────────────────────────────────────────── -->
  <section id="hero" class="hero-photo" style="min-height:clamp(30rem,72svh,46rem);display:flex;flex-direction:column">
    <img id="hero-bg" src="" alt="" class="hero-photo-img" aria-hidden="true" style="display:none">
    <div class="hero-photo-overlay"></div>
    <div class="hero-photo-content w-full flex-1 flex items-center py-12 sm:py-16">
      <div class="max-w-3xl mx-auto px-6 sm:px-10 lg:px-12 text-center">
        <div id="hero-eyebrow" class="eyebrow mb-5 mx-auto hero-anim" style="background:rgba(255,199,138,.22);border-color:rgba(255,199,138,.5);color:#fff;--d:0ms">Le carnet des Potet</div>
        <h1 id="hero-title" class="font-display font-bold mb-5 text-white drop-shadow-lg mx-auto hero-anim" style="font-size:clamp(2.2rem,6vw,4rem);line-height:1.06;letter-spacing:-.015em;max-width:18ch;text-wrap:balance;--d:80ms">
          Entrez, on allait justement <em style="color:var(--apricot);font-style:normal">raconter le voyage</em>.
        </h1>
        <p id="hero-subtitle" class="text-base sm:text-xl text-white/85 leading-relaxed mb-4 font-medium mx-auto hero-anim" style="max-width:44ch;--d:160ms">
          Depuis 2011, on part quelque part, on revient avec des histoires — et on les note ici pour ne pas les oublier (et pour vous).
        </p>
        <p id="hero-badge" class="drame-badge mb-8 mx-auto hero-anim" style="border-color:rgba(255,199,138,.44);background:rgba(255,199,138,.16);color:rgba(255,255,255,.92);display:inline-block;--d:240ms">"Mais ça c'était bien avant le drame..."</p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 hero-anim" style="--d:320ms">
          <a id="hero-cta-primary" href="/voyages" style="display:inline-flex;align-items:center;justify-content:center;gap:.55rem;padding:.85rem 1.75rem;border-radius:999px;background:var(--apricot);color:var(--ink);font-weight:700;font-size:.92rem;border:2px solid var(--apricot);box-shadow:0 6px 22px rgba(255,199,138,.40);transition:transform .2s,box-shadow .2s" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''"><i class="ph ph-book-open-text"></i> <span>Lire nos aventures</span></a>
          <a href="#destinations-section" style="display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:.85rem 1.6rem;border-radius:999px;background:rgba(255,255,255,.14);color:#fff;font-weight:700;font-size:.92rem;border:2px solid rgba(255,255,255,.5);transition:transform .2s,background .2s" onmouseover="this.style.transform='translateY(-2px)';this.style.background='rgba(255,255,255,.24)'" onmouseout="this.style.transform='';this.style.background='rgba(255,255,255,.14)'"><i class="ph ph-map-trifold"></i> <span>Nos coins du monde</span></a>
        </div>
      </div>
    </div>
    <!-- Stats en bande translucide, ancrées au bas du hero (toujours dans le 1er écran) -->
    <div class="hero-stats" style="position:relative;z-index:3;background:rgba(255,253,249,.10);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-top:1px solid rgba(255,255,255,.18)">
      <div class="max-w-3xl mx-auto px-6 py-5 grid grid-cols-3 text-center text-white">
        <div style="border-right:1px solid rgba(255,255,255,.22)">
          <div id="stat-voyages" class="font-display text-3xl sm:text-4xl font-black" data-count="0">—</div>
          <div class="text-[.7rem] font-semibold uppercase tracking-[.16em] mt-1" style="color:rgba(255,255,255,.75)">aventures depuis 2011</div>
        </div>
        <div style="border-right:1px solid rgba(255,255,255,.22)">
          <div id="stat-dest" class="font-display text-3xl sm:text-4xl font-black" data-count="0">—</div>
          <div class="text-[.7rem] font-semibold uppercase tracking-[.16em] mt-1" style="color:rgba(255,255,255,.75)">pays, une seule Dacia</div>
        </div>
        <div>
          <div id="stat-maroc" class="font-display text-3xl sm:text-4xl font-black" data-count="0">—</div>
          <div class="text-[.7rem] font-semibold uppercase tracking-[.16em] mt-1" style="color:rgba(255,255,255,.75)">séjours au Maroc</div>
        </div>
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
      <a href="/voyages" class="hidden sm:inline-flex subtle-btn flex-shrink-0">Tout le carnet →</a>
    </div>
    <div id="articles-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      ${skeletonCards(6)}
    </div>
    <div class="text-center mt-10 sm:hidden">
      <a href="/voyages" class="action-btn-sm">Tout le carnet</a>
    </div>
  </section>

  <!-- ── Le mot des Potet ───────────────────────────────────── -->
  <section class="py-4 sm:py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="panel rounded-[2rem] p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-7">
        <img src="/icon-192.png" width="84" height="84" alt="" aria-hidden="true" style="border-radius:1.25rem;flex-shrink:0;box-shadow:0 6px 20px rgba(0,87,184,.22)">
        <div>
          <div class="eyebrow mb-3">Salut, c'est nous</div>
          <p id="about-text" class="text-base sm:text-lg leading-relaxed" style="color:var(--ink)">
            Nous, c'est la famille Potet. Tout a commencé sans le vouloir en 2011, avec un voyage à Marrakech — un tajine à 5&nbsp;euros et un nom de blog plus tard, on ne s'est plus arrêtés. Une Dacia traumatisée et pas mal de galères après, on continue de tout noter ici. Bienvenue à la maison.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- ── Destinations ───────────────────────────────────────── -->
  <section id="destinations-section" class="py-16 sm:py-24" style="background:var(--sand);scroll-margin-top:5rem">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-10">
        <div class="eyebrow mb-4 mx-auto">Où on a traîné nos valises</div>
        <h2 class="font-display text-3xl sm:text-4xl font-bold mb-3" style="color:var(--ink)">Nos coins du monde</h2>
        <p class="text-sm sm:text-base max-w-2xl mx-auto" style="color:var(--ink-muted)">Choisissez un pays, on vous ressort les photos, les histoires et ce qu'on referait (ou pas).</p>
      </div>
      <div id="destinations" class="flex flex-wrap justify-center gap-3">
        ${Array.from({length:5}).map(()=>`<div class="w-32 h-12 rounded-2xl animate-pulse" style="background:var(--sand-deep)"></div>`).join('')}
      </div>
    </div>
  </section>

  <!-- ── Abonnement ─────────────────────────────────────────── -->
  <section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
    <div class="panel rounded-[2rem] p-8 sm:p-10 text-center">
      <div style="width:3.25rem;height:3.25rem;border-radius:999px;background:var(--blue-light);display:inline-flex;align-items:center;justify-content:center;margin-bottom:1rem"><i class="ph ph-paper-plane-tilt" style="font-size:1.5rem;color:var(--blue)"></i></div>
      <h2 class="font-display text-2xl sm:text-3xl font-bold mb-2" style="color:var(--ink)">On repart bientôt.</h2>
      <p class="text-sm sm:text-base mb-6 max-w-xl mx-auto" style="color:var(--ink-muted)">Laissez votre email, on vous fait signe au prochain récit. Pas de spam, juste nous.</p>
      <div class="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
        <input type="email" id="home-sub-email" placeholder="votre@email.com" class="flex-1 min-w-0 border-2 rounded-xl px-4 py-2.5 text-sm" style="border-color:rgba(var(--blue-rgb),.2)">
        <button onclick="homeSubscribe()" class="action-btn-sm justify-center"><i class="ph ph-bell"></i> Me prévenir</button>
      </div>
      <p id="home-sub-msg" class="hidden text-sm mt-3 font-semibold"></p>
    </div>
  </section>

  <!-- ── Citation ───────────────────────────────────────────── -->
  <section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 text-center">
    <div class="quote-block">
      <blockquote id="site-tagline" class="font-display text-2xl sm:text-3xl italic leading-relaxed" style="color:var(--ink)">
        "Mais ça c'était bien avant le drame..."
      </blockquote>
      <p class="mt-4 font-medium text-sm" style="color:var(--ink-muted)">- Devise de la famille Potet <i class="ph ph-globe-hemisphere-west" style="color:var(--blue)"></i></p>
    </div>
  </section>

</main>

${FOOTER}
${TOAST}
${LIGHTBOX}

<script>
const IS_ADMIN=${JSON.stringify(authed)};
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function safeText(s){return esc(s);}
function safeAttr(s){return esc(s);}
function flagImg(icon){if(!icon)return '';const cp=[...icon].map(c=>c.codePointAt(0));if(cp.length>=2&&cp[0]>=0x1F1E6&&cp[0]<=0x1F1FF&&cp[1]>=0x1F1E6&&cp[1]<=0x1F1FF){const code=[cp[0],cp[1]].map(c=>String.fromCodePoint(c-0x1F1E6+65)).join('').toLowerCase();return '<img src="https://flagcdn.com/w20/'+code+'.png" width="20" height="15" alt="'+code.toUpperCase()+'" style="vertical-align:middle;border-radius:2px;flex-shrink:0">';}return '<span>'+icon+'</span>';}
function stripMd(s){return(s||'').replace(/!\\[[^\\]]*\\]\\([^)]*\\)/g,'').replace(/\\*\\*([^*\\n]+)\\*\\*/g,'$1').replace(/\\*([^*\\n]+)\\*/g,'$1').replace(/^#{1,6}\\s+/gm,'').replace(/\\s+/g,' ').trim();}
function fmtDateCard(a){const s=a.start_date||a.date,e=a.end_date||a.date;if(!s)return'';const opt={month:'short',year:'numeric'};const ms=new Date(s).toLocaleDateString('fr-FR',opt);const me=new Date(e).toLocaleDateString('fr-FR',opt);return ms===me?ms:ms+' - '+me;}
function fmtDate(d){return new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}
function fmtDateRange(a){
  const s=a.start_date||a.date,e=a.end_date||a.date;
  if(!s) return 'Dates non définies';
  return s===e ? fmtDate(s) : fmtDate(s)+' - '+fmtDate(e);
}

// Ascending bars (signal-strength style), not equal-sized round dots — a row
// of same-size filled/unfilled circles reads as carousel/pagination
// indicators ("swipe for more"), which is misleading since the card isn't
// a slider. Bars of increasing height read as an intensity/level meter,
// matching what this represents (relative popularity among the trips shown).
function renderPopularityBars(views, minViews, maxViews) {
  const range = maxViews - minViews || 1;
  const count = Math.max(1, Math.ceil((views - minViews) / range * 5));
  const heights = [5, 8, 11, 14, 17];
  let bars = '';
  for (let i = 0; i < 5; i++) {
    bars += '<span style="display:inline-block;width:3px;height:' + heights[i] + 'px;border-radius:1px;background:' + (i < count ? 'var(--blue)' : 'rgba(0,0,0,.12)') + '"></span>';
  }
  return '<div style="display:flex;align-items:center;gap:3px" aria-hidden="true">' + bars + '<span style="font-size:.68rem;margin-left:4px;color:var(--ink-light);line-height:1">' + views + '</span></div>';
}

function renderArticleCard(article, minViews, maxViews, isAdmin) {
  const slug = safeAttr(article.slug);
  const title = safeText(article.title);
  const dest = safeText(article.destination);
  const desc = stripMd(article.short_description || '');
  const coverUrl = safeAttr(article.cover_url || '');
  const editLink = isAdmin ? '<a href="/admin/editor/' + article.id + '" onclick="event.stopPropagation()" style="position:absolute;top:.75rem;right:.75rem;z-index:5;display:inline-flex;align-items:center;gap:.35rem;padding:.3rem .75rem;border-radius:999px;font-size:.73rem;font-weight:700;background:rgba(0,87,184,.92);color:#fff;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,.25)"><i class="ph ph-pencil-simple"></i> Modifier</a>' : '';
  const folderBadge = article.folder_name ? '<div class="absolute top-3 left-3"><span class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm" style="background:rgba(255,253,249,.92);color:var(--palm);border:1px solid rgba(255,255,255,.6)">' + flagImg(article.folder_icon || '') + ' ' + safeText(article.folder_name) + '</span></div>' : '';
  const popBars = renderPopularityBars(article.view_count || 0, minViews, maxViews);
  const dest2 = article.destination ? ' - ' + safeAttr(dest) : '';

  return '<article class="voyage-card cursor-pointer group" style="position:relative;display:flex;flex-direction:column" data-slug="' + slug + '" role="link" tabindex="0" aria-label="Lire le voyage : ' + safeAttr(title) + dest2 + '">' +
    editLink +
    '<div class="relative overflow-hidden" style="height:15rem;border-radius:1.5rem 1.5rem 0 0;flex-shrink:0">' +
      '<img src="' + coverUrl + '" alt="' + safeAttr(title) + '" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" data-fallback="https://picsum.photos/seed/' + article.id + 'x/800/600">' +
      folderBadge +
    '</div>' +
    '<div class="p-5" style="display:flex;flex-direction:column;flex:1">' +
      '<div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem">' +
        '<span style="display:inline-flex;align-items:center;gap:.25rem;padding:.2rem .6rem;border-radius:999px;font-size:.72rem;font-weight:600;background:var(--sand);color:var(--ink-light)"><i class="ph ph-calendar-blank" style="color:var(--blue)"></i> ' + fmtDateCard(article) + '</span>' +
        (dest ? '<span style="display:inline-flex;align-items:center;gap:.25rem;padding:.2rem .6rem;border-radius:999px;font-size:.72rem;font-weight:600;background:var(--sand);color:var(--ink-light)"><i class="ph ph-map-pin" style="color:var(--blue)"></i> ' + dest + '</span>' : '') +
      '</div>' +
      '<h3 class="font-display font-bold" style="font-size:1.05rem;line-height:1.35;margin-bottom:.5rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:var(--ink)">' + title + '</h3>' +
      '<p style="font-size:.875rem;line-height:1.55;flex:1;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:var(--ink-muted);margin-bottom:1rem">' + desc + '</p>' +
      '<div style="display:flex;justify-content:flex-end">' + popBars + '</div>' +
    '</div>' +
  '</article>';
}

// Distinguish a genuine "no content" state from a backend/network failure.
let _fetchFailed = false;
function _fetchJson(url, fallback){
  return fetch(url).then(r=>{ if(!r.ok) throw new Error('http'); return r.json(); }).catch(()=>{ _fetchFailed = true; return fallback; });
}
function showErrorBanner(){
  if(document.getElementById('home-error-banner')) return;
  const b=document.createElement('div');
  b.id='home-error-banner';
  b.setAttribute('role','alert');
  b.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:1.25rem;z-index:120;display:flex;align-items:center;gap:.6rem;background:#fff;border:1px solid rgba(220,60,60,.35);color:#b91c1c;padding:.7rem 1.1rem;border-radius:999px;box-shadow:0 8px 28px rgba(26,43,60,.14);font-size:.85rem;font-weight:600';
  b.innerHTML='<i class="ph-fill ph-warning-circle" style="font-size:1.1rem"></i> Impossible de charger le contenu, réessayez.';
  document.body.appendChild(b);
}
function elevatedEmpty(icon, title, subtitle){
  return '<div class="col-span-3 text-center py-16" style="color:var(--ink-light)">'+
    '<i class="ph '+icon+'" style="font-size:3.5rem;display:block;margin-bottom:1rem;color:var(--ink-light)"></i>'+
    '<p class="text-lg font-semibold mb-1" style="color:var(--ink)">'+title+'</p>'+
    (subtitle?'<p class="text-sm">'+subtitle+'</p>':'')+
  '</div>';
}

async function init(){
  const [settings, artData, folderData] = await Promise.all([
    _fetchJson('/api/settings', {}),
    // Fetch the full list (only ~24 rows): needed for accurate stats (Morocco
    // count) — the grid still shows only the first 6 via slice below.
    _fetchJson('/api/articles?limit=100', {articles:[],total:0}),
    _fetchJson('/api/folders', []),
  ]);
  const recentArticles = artData.articles.slice(0, 6);

  // Hero depuis settings (rendu normal, plus d'édition inline)
  const bgEl = document.getElementById('hero-bg');
  if(settings.hero_image_url){ bgEl.src=settings.hero_image_url; bgEl.style.display='block'; }
  if(settings.hero_eyebrow)   document.getElementById('hero-eyebrow').innerHTML = settings.hero_eyebrow;
  if(settings.hero_title)     document.getElementById('hero-title').innerHTML = settings.hero_title;
  if(settings.hero_subtitle)  document.getElementById('hero-subtitle').innerHTML = settings.hero_subtitle;
  if(settings.hero_badge)     document.getElementById('hero-badge').innerHTML = settings.hero_badge;
  if(settings.hero_cta_primary) document.querySelector('#hero-cta-primary span').innerHTML = settings.hero_cta_primary;
  if(settings.site_tagline)   document.getElementById('site-tagline').innerHTML = settings.site_tagline;

  // Stats — animated count-up (respects reduced-motion). The Maroc count is a
  // deliberate wink ("la routine s'installe") rather than a generic metric.
  const nbVoyages = artData.total ?? artData.articles.length;
  const nbPays    = folderData.filter(f=>!f.parent_id).length;
  // Count Morocco stays across all articles (destination or folder mentions "maroc").
  const norm = s => (s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();
  const nbMaroc = artData.articles.filter(a => norm(a.destination).includes('maroc') || norm(a.folder_name).includes('maroc')).length;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function countUp(el, to){
    if(!el) return;
    if(reduce || to<=0){ el.textContent = to; return; }
    const dur=800, t0=performance.now();
    (function step(t){
      const p=Math.min(1,(t-t0)/dur), v=Math.round((1-Math.pow(1-p,3))*to);
      el.textContent=v;
      if(p<1) requestAnimationFrame(step);
    })(t0);
  }
  // The public /api/articles?limit=6 only returns 6 rows, so nbMaroc from it is
  // capped; use the full count when we have it, else fall back to the sample.
  countUp(document.getElementById('stat-voyages'), nbVoyages);
  countUp(document.getElementById('stat-dest'), nbPays);
  countUp(document.getElementById('stat-maroc'), nbMaroc);

  // Grille articles (6 plus récents)
  const views = recentArticles.map(a => a.view_count || 0);
  const minViews = Math.min(...views, 0);
  const maxViews = Math.max(...views, 0);
  document.getElementById('articles-grid').innerHTML = recentArticles.length
    ? recentArticles.map(a => renderArticleCard(a, minViews, maxViews, IS_ADMIN)).join('')
    : elevatedEmpty('ph-airplane-takeoff', 'Le sac n’est pas encore défait…', 'Le premier récit arrive bientôt, promis.');
  if(_fetchFailed) showErrorBanner();

  // Event delegation: card clicks and image fallback
  const grid = document.getElementById('articles-grid');
  grid.addEventListener('click', e => {
    const card = e.target.closest('[data-slug]');
    if (card && !e.target.closest('a')) location.href = '/voyage/' + card.getAttribute('data-slug');
  });
  grid.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const card = e.target.closest('[data-slug]');
    if (card) location.href = '/voyage/' + card.getAttribute('data-slug');
  });
  grid.addEventListener('error', e => {
    const img = e.target.closest('img[data-fallback]');
    if (img && img.src !== img.dataset.fallback) img.src = img.dataset.fallback;
  }, true);

  // Destinations
  const roots = folderData.filter(f=>!f.parent_id);
  document.getElementById('destinations').innerHTML = roots.map(f=>
    '<a href="/voyages?folder=' + safeAttr(f.slug) + '"' +
       ' class="flex items-center gap-2.5 rounded-2xl px-5 py-3 bg-white transition-all font-semibold hover:-translate-y-0.5"' +
       ' style="border:1px solid var(--line);box-shadow:var(--card-shadow);color:var(--ink)">' +
      flagImg(f.icon) +
      '<span>' + safeText(f.name) + '</span>' +
    '</a>'
  ).join('');

  // (No separate admin bar here anymore — the unified nav already shows the
  // grouped "Admin" menu with a link to the dashboard/settings.)
}

// Newsletter subscribe from the home CTA (reuses the public /api/email/subscribe).
async function homeSubscribe(){
  const input=document.getElementById('home-sub-email');
  const msg=document.getElementById('home-sub-msg');
  const email=(input.value||'').trim();
  msg.className='hidden';
  if(!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)){ msg.textContent='Entrez une adresse email valide.'; msg.style.color='#dc3c3c'; msg.className='text-sm mt-3 font-semibold'; return; }
  const res=await fetch('/api/email/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})}).catch(()=>null);
  const data=await res?.json().catch(()=>null);
  if(res&&res.ok){ msg.textContent='C\\'est noté ! On vous fait signe au prochain voyage. 🌴'; msg.style.color='var(--palm)'; input.value=''; }
  else { msg.textContent=(data&&data.error)||'Oups, réessayez dans un instant.'; msg.style.color='#dc3c3c'; }
  msg.className='text-sm mt-3 font-semibold';
}
window.homeSubscribe=homeSubscribe;

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
