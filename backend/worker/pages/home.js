/**
 * pages/home.js - Public home page template
 */

import { HEAD, NAV, FOOTER, TOAST, LIGHTBOX } from './shell.js';
import { html } from '../utils.js';
import { safeAttr, safeText } from '../helpers/html.js';

const SITE_URL = 'https://tranquille-vacances.esti-archi.workers.dev';

export function homePage(authed=false) {
  return html(`<!DOCTYPE html>
<html lang="fr">
<head>${HEAD('Tranquille, on est en vacances', undefined, { url: SITE_URL + '/' })}</head>
<body class="bg-stone-50 font-sans text-stone-900 antialiased">
${NAV('home', authed)}

<main class="pt-16">

  <!-- ── Hero photo ─────────────────────────────────────────── -->
  <section id="hero" class="hero-photo" style="min-height:clamp(30rem,72svh,46rem);display:flex;flex-direction:column">
    <img id="hero-bg" src="" alt="" class="hero-photo-img" aria-hidden="true" style="display:none">
    <div class="hero-photo-overlay"></div>
    <div class="hero-photo-content w-full flex-1 flex items-center py-12 sm:py-16">
      <div class="max-w-3xl mx-auto px-6 sm:px-10 lg:px-12 text-center">
        <div id="hero-eyebrow" class="eyebrow mb-5 mx-auto hero-anim hero-eyebrow-glow" style="background:rgba(255,199,138,.22);border-color:rgba(255,199,138,.5);color:#fff;--d:0ms">Le carnet des Potet</div>
        <h1 id="hero-title" class="font-display font-bold mb-5 text-white drop-shadow-lg mx-auto hero-anim" style="font-size:clamp(2.2rem,6vw,4rem);line-height:1.06;letter-spacing:-.015em;max-width:18ch;text-wrap:balance;--d:80ms">
          Entrez, on allait justement <em style="color:var(--apricot);font-style:normal">raconter le voyage</em>.
        </h1>
        <p id="hero-subtitle" class="text-base sm:text-xl text-white/85 leading-relaxed mb-4 font-medium mx-auto hero-anim" style="max-width:44ch;--d:160ms">
          Depuis 2011, on part quelque part, on revient avec des histoires - et on les note ici pour ne pas les oublier (et pour vous).
        </p>
        <p id="hero-badge" class="font-display mb-8 mx-auto hero-anim" style="font-style:italic;font-weight:700;font-size:clamp(1.05rem,2.4vw,1.35rem);color:var(--apricot);text-shadow:0 2px 12px rgba(0,0,0,.35);--d:240ms">"Mais ça c'était bien avant le drame..."</p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 hero-anim" style="--d:320ms">
          <a id="hero-cta-primary" href="/voyages" style="display:inline-flex;align-items:center;justify-content:center;gap:.55rem;padding:.85rem 1.75rem;border-radius:999px;background:var(--apricot);color:#1A2B3C;font-weight:700;font-size:.92rem;border:2px solid var(--apricot);box-shadow:0 6px 22px rgba(255,199,138,.40);transition:transform .2s,box-shadow .2s" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''"><i class="ph-bold ph-book-open-text"></i> <span>Lire nos aventures</span></a>
          <a id="hero-cta-secondary" href="#destinations-section" style="display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:.85rem 1.6rem;border-radius:999px;background:rgba(255,255,255,.14);color:#fff;font-weight:700;font-size:.92rem;border:2px solid rgba(255,255,255,.5);transition:transform .2s,background .2s" onmouseover="this.style.transform='translateY(-2px)';this.style.background='rgba(255,255,255,.24)'" onmouseout="this.style.transform='';this.style.background='rgba(255,255,255,.14)'"><i class="ph-bold ph-map-trifold"></i> <span>Nos coins du monde</span></a>
        </div>
      </div>
    </div>
    <!-- Stats en bande translucide, ancrées au bas du hero (toujours dans le 1er écran) -->
    <div class="hero-stats" style="position:relative;z-index:3;background:rgba(255,253,249,.10);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-top:1px solid rgba(255,255,255,.18)">
      <div class="max-w-3xl mx-auto px-6 py-5 grid grid-cols-3 text-center text-white">
        <div style="border-right:1px solid rgba(255,255,255,.22)">
          <div id="stat-voyages" class="font-display text-3xl sm:text-4xl font-black" data-count="0">-</div>
          <div id="stat-voyages-label" class="text-[.7rem] font-semibold uppercase tracking-[.16em] mt-1" style="color:rgba(255,255,255,.75)">aventures depuis 2011</div>
        </div>
        <div style="border-right:1px solid rgba(255,255,255,.22)">
          <div id="stat-dest" class="font-display text-3xl sm:text-4xl font-black" data-count="0">-</div>
          <div id="stat-dest-label" class="text-[.7rem] font-semibold uppercase tracking-[.16em] mt-1" style="color:rgba(255,255,255,.75)">pays, une seule Dacia</div>
        </div>
        <div>
          <div id="stat-maroc" class="font-display text-3xl sm:text-4xl font-black" data-count="0">-</div>
          <div id="stat-maroc-label" class="text-[.7rem] font-semibold uppercase tracking-[.16em] mt-1" style="color:rgba(255,255,255,.75)">séjours au Maroc</div>
        </div>
      </div>
    </div>
  </section>

  <!-- ── Derniers voyages ───────────────────────────────────── -->
  <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div class="flex items-end justify-between mb-10 gap-6">
      <div>
        <div id="recent-eyebrow" class="eyebrow mb-4">Sélection maison</div>
        <h2 id="recent-title" class="font-display text-3xl sm:text-5xl font-bold" style="color:var(--ink)">Nos derniers voyages</h2>
        <p id="recent-subtitle" class="mt-3 text-sm sm:text-base max-w-2xl" style="color:var(--ink-muted)">Les récits les plus récents de nos vacances, avec nos coups de cœur, nos galères et nos meilleures trouvailles.</p>
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
  <section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
    <div class="panel rounded-[2rem] p-8 sm:p-10 text-center">
      <img src="/icon-192.png" width="56" height="56" alt="" aria-hidden="true" style="border-radius:1rem;display:block;margin:0 auto 1rem;box-shadow:0 6px 20px rgba(0,87,184,.22)">
      <div id="about-eyebrow" class="eyebrow mb-3 mx-auto">Salut, c'est nous</div>
      <p id="about-text" class="text-base sm:text-lg leading-relaxed max-w-xl mx-auto" style="color:var(--ink)">
        Nous, c'est la famille Potet. Tout a commencé sans le vouloir en 2011, avec un voyage à Marrakech - un tajine à 5&nbsp;euros et un nom de blog plus tard, on ne s'est plus arrêtés. Une Dacia traumatisée et pas mal de galères après, on continue de tout noter ici. Bienvenue à la maison.
      </p>
    </div>
  </section>

  <!-- ── Destinations ───────────────────────────────────────── -->
  <section id="destinations-section" class="py-16 sm:py-24" style="background:var(--sand);scroll-margin-top:5rem">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-10">
        <div id="dest-eyebrow" class="eyebrow mb-4 mx-auto">Où on a traîné nos valises</div>
        <h2 id="dest-title" class="font-display text-3xl sm:text-4xl font-bold mb-3" style="color:var(--ink)">Nos coins du monde</h2>
        <p id="dest-subtitle" class="text-sm sm:text-base max-w-2xl mx-auto" style="color:var(--ink-muted)">Choisissez un pays, on vous ressort les photos, les histoires et ce qu'on referait (ou pas).</p>
      </div>
      <div id="destinations" class="flex flex-wrap justify-center gap-3">
        ${Array.from({length:5}).map(()=>`<div class="w-32 h-12 rounded-2xl animate-pulse" style="background:var(--sand-deep)"></div>`).join('')}
      </div>
    </div>
  </section>

  <!-- ── Abonnement ─────────────────────────────────────────── -->
  <section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
    <div class="panel rounded-[2rem] p-8 sm:p-10 text-center">
      <div style="width:3.25rem;height:3.25rem;border-radius:999px;background:var(--blue-light);display:inline-flex;align-items:center;justify-content:center;margin-bottom:1rem"><i class="ph-bold ph-paper-plane-tilt" style="font-size:1.5rem;color:var(--blue)"></i></div>
      <h2 id="sub-title" class="font-display text-2xl sm:text-3xl font-bold mb-2" style="color:var(--ink)">On repart bientôt.</h2>
      <p id="sub-subtitle" class="text-sm sm:text-base mb-6 max-w-xl mx-auto" style="color:var(--ink-muted)">Laissez votre email, on vous fait signe au prochain récit. Pas de spam, juste nous.</p>
      <div class="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
        <input type="email" id="home-sub-email" placeholder="votre@email.com" class="flex-1 min-w-0 border-2 rounded-xl px-4 py-2.5 text-sm" style="border-color:rgba(var(--blue-rgb),.2)">
        <button onclick="homeSubscribe()" class="action-btn-sm justify-center"><i class="ph-bold ph-paper-plane-tilt"></i> Me prévenir</button>
      </div>
      <p id="home-sub-msg" class="hidden text-sm mt-3 font-semibold"></p>
    </div>
  </section>

  <!-- ── Installer l'app (masqué par défaut, affiché par JS si pertinent) ── -->
  <section id="install-section" class="hidden max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
    <div class="panel rounded-[2rem] p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
      <img src="/icon-192.png" width="56" height="56" alt="" aria-hidden="true" style="border-radius:1rem;flex-shrink:0;box-shadow:0 4px 14px rgba(0,87,184,.22)">
      <div class="flex-1">
        <h2 id="install-title" class="font-display text-xl font-bold mb-1" style="color:var(--ink)">Gardez le carnet sur vous</h2>
        <p id="install-text" class="text-sm" style="color:var(--ink-muted)">Installez l'app sur votre téléphone : elle s'ouvre d'une icône, même sans réseau en voyage.</p>
      </div>
      <button id="install-btn" onclick="installApp()" class="action-btn-sm flex-shrink-0"><i class="ph-bold ph-download-simple"></i> Installer l'app</button>
    </div>
  </section>

  <!-- ── Citation ───────────────────────────────────────────── -->
  <section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 text-center">
    <div class="quote-block relative overflow-hidden">
      <i class="ph-fill ph-quotes" aria-hidden="true" style="position:absolute;top:-.5rem;left:1.25rem;font-size:5rem;color:rgba(255,199,138,.35);line-height:1"></i>
      <blockquote id="site-tagline" class="font-display text-2xl sm:text-3xl font-bold italic leading-relaxed relative" style="color:var(--ink)">
        "Mais ça c'était bien avant le drame..."
      </blockquote>
      <p class="mt-4 font-semibold text-sm tracking-wide" style="color:var(--palm)">- <span id="tagline-author">Devise de la famille Potet</span> <i class="ph-bold ph-globe-hemisphere-west"></i></p>
    </div>
  </section>

  <!-- ── Bandeau "créer mon carnet" ─────────────────────────────── -->
  <section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
    <a href="/creer-mon-carnet" class="group flex flex-col sm:flex-row items-center gap-4 sm:gap-5 panel rounded-[1.75rem] p-5 sm:p-6 text-center sm:text-left transition-transform hover:-translate-y-0.5" style="text-decoration:none">
      <div class="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center" style="background:var(--blue-light)"><i class="ph-bold ph-sparkle" style="font-size:1.4rem;color:var(--blue)"></i></div>
      <div class="flex-1">
        <h2 class="font-display text-lg font-bold" style="color:var(--ink)">Vous aussi, vous voulez un carnet comme celui-ci ?</h2>
        <p class="text-sm mt-0.5" style="color:var(--ink-muted)">Découvrez comment ce blog est fait - et comment en avoir un pour vos propres voyages.</p>
      </div>
      <span class="flex-shrink-0 inline-flex items-center gap-1.5 text-sm font-bold transition-transform group-hover:translate-x-1" style="color:var(--blue)">Je découvre <i class="ph-bold ph-arrow-right"></i></span>
    </a>
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
// A root folder is a real "pays" only if its icon is an actual flag emoji
// (two Unicode Regional Indicator Symbols, U+1F1E6-U+1F1FF) - a generic
// organisational folder like "Autres" keeps the default 📁 icon, which
// isn't a flag, so it must not inflate the "X pays" homepage stat.
function isFlagIcon(icon){const cp=[...(icon||'')].map(c=>c.codePointAt(0));return cp.length>=2&&cp[0]>=0x1F1E6&&cp[0]<=0x1F1FF&&cp[1]>=0x1F1E6&&cp[1]<=0x1F1FF;}
function stripMd(s){return(s||'').replace(/!\\[[^\\]]*\\]\\([^)]*\\)/g,'').replace(/\\*\\*([^*\\n]+)\\*\\*/g,'$1').replace(/\\*([^*\\n]+)\\*/g,'$1').replace(/^#{1,6}\\s+/gm,'').replace(/\\s+/g,' ').trim();}
function fmtDateCard(a){const s=a.start_date||a.date,e=a.end_date||a.date;if(!s)return'';const opt={month:'short',year:'numeric'};const ms=new Date(s).toLocaleDateString('fr-FR',opt);const me=new Date(e).toLocaleDateString('fr-FR',opt);return ms===me?ms:ms+' - '+me;}
function fmtDate(d){return new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}
function fmtDateRange(a){
  const s=a.start_date||a.date,e=a.end_date||a.date;
  if(!s) return 'Dates non définies';
  return s===e ? fmtDate(s) : fmtDate(s)+' - '+fmtDate(e);
}

// Ascending bars (signal-strength style), not equal-sized round dots - a row
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
    bars += '<span style="display:inline-block;width:3px;height:' + heights[i] + 'px;border-radius:1px;background:' + (i < count ? 'var(--blue)' : 'rgba(var(--ink-rgb),.12)') + '"></span>';
  }
  return '<div style="display:flex;align-items:center;gap:3px" aria-hidden="true">' + bars + '<span style="font-size:.68rem;margin-left:4px;color:var(--ink-light);line-height:1">' + views + '</span></div>';
}

function renderArticleCard(article, minViews, maxViews, isAdmin) {
  const slug = safeAttr(article.slug);
  const title = safeText(article.title);
  const dest = safeText(article.destination);
  const desc = stripMd(article.short_description || '');
  const coverUrl = safeAttr(article.cover_url || '');
  const editLink = isAdmin ? '<a href="/admin/editor/' + article.id + '" onclick="event.stopPropagation()" style="position:absolute;top:.75rem;right:.75rem;z-index:5;display:inline-flex;align-items:center;gap:.35rem;padding:.3rem .75rem;border-radius:999px;font-size:.73rem;font-weight:700;background:rgba(0,87,184,.92);color:#fff;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,.25)"><i class="ph-bold ph-pencil-simple"></i> Modifier</a>' : '';
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
        '<span style="display:inline-flex;align-items:center;gap:.25rem;padding:.2rem .6rem;border-radius:999px;font-size:.72rem;font-weight:600;background:var(--sand);color:var(--ink-light)"><i class="ph-bold ph-calendar-blank" style="color:var(--blue)"></i> ' + fmtDateCard(article) + '</span>' +
        (dest ? '<span style="display:inline-flex;align-items:center;gap:.25rem;padding:.2rem .6rem;border-radius:999px;font-size:.72rem;font-weight:600;background:var(--sand);color:var(--ink-light)"><i class="ph-bold ph-map-pin" style="color:var(--blue)"></i> ' + dest + '</span>' : '') +
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
  b.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:1.25rem;z-index:120;display:flex;align-items:center;gap:.6rem;background:var(--cream);border:1px solid rgba(220,60,60,.35);color:#b91c1c;padding:.7rem 1.1rem;border-radius:999px;box-shadow:0 8px 28px rgba(26,43,60,.14);font-size:.85rem;font-weight:600';
  b.innerHTML='<i class="ph-fill ph-warning-circle" style="font-size:1.1rem"></i> Impossible de charger le contenu, réessayez.';
  document.body.appendChild(b);
}
function elevatedEmpty(icon, title, subtitle){
  return '<div class="col-span-3 text-center py-16" style="color:var(--ink-light)">'+
    '<i class="ph-bold '+icon+'" style="font-size:3.5rem;display:block;margin-bottom:1rem;color:var(--ink-light)"></i>'+
    '<p class="text-lg font-semibold mb-1" style="color:var(--ink)">'+title+'</p>'+
    (subtitle?'<p class="text-sm">'+subtitle+'</p>':'')+
  '</div>';
}

async function init(){
  const [settings, artData, folderData] = await Promise.all([
    _fetchJson('/api/settings', {}),
    // Fetch the full list (only ~24 rows): needed for accurate stats (Morocco
    // count) - the grid still shows only the first 6 via slice below.
    _fetchJson('/api/articles?limit=100', {articles:[],total:0}),
    _fetchJson('/api/folders', []),
  ]);
  const recentArticles = artData.articles.slice(0, 6);

  // ── Tous les textes de la page depuis les paramètres admin ──
  // Chaque texte de la home est pilotable depuis l'onglet Paramètres. On ne
  // remplace que si la valeur est non vide, sinon on garde le texte par défaut
  // codé dans le template (jamais de section vide).
  const bgEl = document.getElementById('hero-bg');
  if(settings.hero_image_url){ bgEl.src=settings.hero_image_url; bgEl.style.display='block'; }

  // setTxt : innerHTML sur l'élément #id si la clé existe et est non vide.
  // innerHTML (pas textContent) car certains champs autorisent <em>/<br>.
  const setTxt = (id, val) => { const el = document.getElementById(id); if(el && val) el.innerHTML = val; };
  // setSpan : idem mais cible le <span> interne (boutons avec icône + libellé).
  const setSpan = (sel, val) => { const el = document.querySelector(sel); if(el && val) el.innerHTML = val; };

  // Hero
  setTxt('hero-eyebrow',  settings.hero_eyebrow);
  setTxt('hero-title',    settings.hero_title);
  setTxt('hero-subtitle', settings.hero_subtitle);
  setTxt('hero-badge',    settings.hero_badge);
  setSpan('#hero-cta-primary span',   settings.hero_cta_primary);
  setSpan('#hero-cta-secondary span', settings.hero_cta_secondary);
  // Stats (libellés sous les 3 compteurs - le nombre reste calculé)
  setTxt('stat-voyages-label', settings.stat_voyages_label);
  setTxt('stat-dest-label',    settings.stat_dest_label);
  setTxt('stat-maroc-label',   settings.stat_maroc_label);
  // Section "Nos derniers voyages"
  setTxt('recent-eyebrow',  settings.recent_eyebrow);
  setTxt('recent-title',    settings.recent_title);
  setTxt('recent-subtitle', settings.recent_subtitle);
  // Section "Le mot des Potet"
  setTxt('about-eyebrow', settings.about_eyebrow);
  setTxt('about-text',    settings.about_text);
  // Section "Nos coins du monde"
  setTxt('dest-eyebrow',  settings.dest_eyebrow);
  setTxt('dest-title',    settings.dest_title);
  setTxt('dest-subtitle', settings.dest_subtitle);
  // Section abonnement
  setTxt('sub-title',    settings.sub_title);
  setTxt('sub-subtitle', settings.sub_subtitle);
  // Section installer l'app
  setTxt('install-title', settings.install_title);
  setTxt('install-text',  settings.install_text);
  // Citation de bas de page
  setTxt('site-tagline',   settings.site_tagline);
  setTxt('tagline-author', settings.tagline_author);

  // Stats - animated count-up (respects reduced-motion). The Maroc count is a
  // deliberate wink ("la routine s'installe") rather than a generic metric.
  const nbVoyages = artData.total ?? artData.articles.length;
  const nbPays    = folderData.filter(f=>!f.parent_id && isFlagIcon(f.icon)).length;
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

  // (No separate admin bar here anymore - the unified nav already shows the
  // grouped "Admin" menu with a link to the dashboard/settings.)
}

// Newsletter subscribe from the home CTA (reuses the public /api/email/subscribe).
async function homeSubscribe(){
  const input=document.getElementById('home-sub-email');
  const msg=document.getElementById('home-sub-msg');
  const email=(input.value||'').trim();
  msg.className='hidden';
  if(!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)){ msg.textContent='Entrez une adresse email valide.'; msg.style.color='var(--danger)'; msg.className='text-sm mt-3 font-semibold'; return; }
  const res=await fetch('/api/email/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})}).catch(()=>null);
  const data=await res?.json().catch(()=>null);
  if(res&&res.ok){ msg.textContent='C\\'est noté ! On vous fait signe au prochain voyage. 🌴'; msg.style.color='var(--palm)'; input.value=''; }
  else { msg.textContent=(data&&data.error)||'Oups, réessayez dans un instant.'; msg.style.color='var(--danger)'; }
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
