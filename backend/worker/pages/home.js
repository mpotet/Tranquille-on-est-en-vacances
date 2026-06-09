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
${NAV('home')}

<main class="pt-16">

  <!-- ── Hero photo plein écran ─────────────────────────────── -->
  <section id="hero" class="hero-photo" style="min-height:clamp(82vh,90vw,96vh);display:flex;align-items:center;justify-content:center">
    <img id="hero-bg" src="" alt="" class="hero-photo-img" aria-hidden="true" style="display:none">
    <div class="hero-photo-overlay"></div>
    <div class="hero-photo-content w-full py-24 sm:py-32">
      <div class="max-w-3xl mx-auto px-6 sm:px-10 lg:px-12 text-center">
        <div id="hero-eyebrow" class="eyebrow mb-5 mx-auto" style="background:rgba(255,199,138,.22);border-color:rgba(255,199,138,.5);color:#fff">Carnet de bord de la famille Potet</div>
        <h1 id="hero-title" class="font-display text-4xl sm:text-5xl xl:text-6xl font-bold leading-[1.06] mb-5 text-white drop-shadow-lg mx-auto" style="max-width:16ch;text-wrap:balance">
          Nos <em style="color:var(--apricot);font-style:normal">voyages en famille</em>,<br>étape par étape.
        </h1>
        <p id="hero-subtitle" class="text-base sm:text-xl text-white/80 leading-relaxed mb-3 font-medium mx-auto" style="max-width:42ch">
          Chaque article raconte un voyage vécu par la famille Potet : itinéraire réel, activités avec les enfants et retours utiles.
        </p>
        <p id="hero-badge" class="drame-badge mb-8 mx-auto" style="border-color:rgba(255,199,138,.44);background:rgba(255,199,138,.16);color:rgba(255,255,255,.92);display:inline-block">"Mais ça c'était bien avant le drame..."</p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <a id="hero-cta-primary" href="/voyages" style="display:inline-flex;align-items:center;justify-content:center;gap:.55rem;padding:.85rem 1.75rem;border-radius:999px;background:var(--apricot);color:var(--ink);font-weight:700;font-size:.92rem;border:2px solid var(--apricot);box-shadow:0 6px 22px rgba(255,199,138,.40);transition:transform .2s,box-shadow .2s" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''"><i class="ph ph-airplane-takeoff"></i> <span>Explorer nos voyages</span></a>
          <a id="hero-cta-secondary" href="/voyages" style="display:inline-flex;align-items:center;justify-content:center;gap:.55rem;padding:.82rem 1.6rem;border-radius:999px;background:rgba(255,255,255,.15);color:#fff;font-weight:700;font-size:.92rem;border:2px solid rgba(255,255,255,.45);backdrop-filter:blur(6px);transition:transform .2s,background .2s" onmouseover="this.style.background='rgba(255,255,255,.25)';this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(255,255,255,.15)';this.style.transform=''"><span>Parcourir le carnet</span></a>
        </div>
      </div>
    </div>
  </section>

  <!-- ── Stats rapides ──────────────────────────────────────── -->
  <section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
    <div class="panel rounded-2xl px-6 py-5 grid grid-cols-2" style="divide-x:1px solid var(--line)">
      <div class="text-center px-4" style="border-right:1px solid var(--line)">
        <div id="stat-voyages" class="font-display text-3xl font-black" style="color:var(--blue)">-</div>
        <div class="text-xs font-semibold uppercase tracking-[.18em] mt-1" style="color:var(--ink-light)">Voyages</div>
      </div>
      <div class="text-center px-4">
        <div id="stat-dest" class="font-display text-3xl font-black" style="color:var(--blue)">-</div>
        <div class="text-xs font-semibold uppercase tracking-[.18em] mt-1" style="color:var(--ink-light)">Destinations</div>
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
function normalizeHeroHtml(html){return(html||'').replace(/<div>/gi,'<br>').replace(/<\\/div>/gi,'').trim();}
function flagImg(icon){if(!icon)return '';const cp=[...icon].map(c=>c.codePointAt(0));if(cp.length>=2&&cp[0]>=0x1F1E6&&cp[0]<=0x1F1FF&&cp[1]>=0x1F1E6&&cp[1]<=0x1F1FF){const code=[cp[0],cp[1]].map(c=>String.fromCodePoint(c-0x1F1E6+65)).join('').toLowerCase();return '<img src="https://flagcdn.com/w20/'+code+'.png" width="20" height="15" alt="'+code.toUpperCase()+'" style="vertical-align:middle;border-radius:2px;flex-shrink:0">';}return '<span>'+icon+'</span>';}
function fmtDate(d){return new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}
function fmtDateRange(a){
  const s=a.start_date||a.date,e=a.end_date||a.date;
  if(!s) return 'Dates non définies';
  return s===e ? fmtDate(s) : fmtDate(s)+' → '+fmtDate(e);
}

function renderPopularityBars(views, minViews, maxViews) {
  const range = maxViews - minViews || 1;
  const barCount = Math.max(1, Math.ceil((views - minViews) / range * 5));
  const bars = '★★★★★'.slice(0, barCount) + '☆☆☆☆☆'.slice(0, 5 - barCount);
  return '<div class="text-xs font-semibold" style="color:var(--apricot);letter-spacing:.05em">' + bars + ' <span style="font-size:.7rem">' + views + '</span></div>';
}

function renderArticleCard(article, minViews, maxViews, isAdmin) {
  const slug = safeAttr(article.slug);
  const title = safeText(article.title);
  const dest = safeText(article.destination);
  const desc = safeText(article.short_description);
  const coverUrl = safeAttr(article.cover_url || '');
  const editLink = isAdmin ? '<a href="/admin/editor/' + article.id + '" onclick="event.stopPropagation()" style="position:absolute;top:.75rem;right:.75rem;z-index:5;display:inline-flex;align-items:center;gap:.35rem;padding:.3rem .75rem;border-radius:999px;font-size:.73rem;font-weight:700;background:rgba(0,87,184,.92);color:#fff;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,.25)"><i class="ph ph-pencil-simple"></i> Modifier</a>' : '';
  const folderBadge = article.folder_name ? '<div class="absolute top-3 left-3"><span class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm" style="background:rgba(255,253,249,.92);color:var(--palm);border:1px solid rgba(255,255,255,.6)">' + flagImg(article.folder_icon || '') + ' ' + safeText(article.folder_name) + '</span></div>' : '';
  const popBars = renderPopularityBars(article.view_count || 0, minViews, maxViews);
  const dest2 = article.destination ? ' - ' + safeAttr(dest) : '';

  return '<article class="voyage-card cursor-pointer group" style="position:relative" onclick="location.href=\'/voyage/' + slug + '\'" role="link" tabindex="0" onkeydown="if(event.key===\'Enter\')location.href=\'/voyage/' + slug + '\'" aria-label="Lire le voyage : ' + safeAttr(title) + dest2 + '">' +
    editLink +
    '<div class="relative overflow-hidden" style="height:15rem;border-radius:1.5rem 1.5rem 0 0">' +
      '<img src="' + coverUrl + '" alt="' + safeAttr(title) + '" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" onerror="this.src=\'https://picsum.photos/seed/' + article.id + 'x/800/600\'">' +
      folderBadge +
    '</div>' +
    '<div class="p-5">' +
      '<div class="flex flex-col gap-1 text-xs font-medium mb-2.5" style="color:var(--ink-light)">' +
        '<span><i class="ph ph-calendar-blank"></i> ' + fmtDateRange(article) + '</span><span><i class="ph ph-map-pin"></i> ' + dest + '</span>' +
      '</div>' +
      '<h3 class="font-display font-bold text-lg leading-snug mb-2 line-clamp-2" style="color:var(--ink)">' + title + '</h3>' +
      '<p class="text-sm leading-relaxed line-clamp-2 mb-4" style="color:var(--ink-muted)">' + desc + '</p>' +
      '<div class="flex items-center justify-between">' +
        '<span class="inline-flex items-center gap-1.5 text-sm font-semibold" style="color:var(--blue)">Lire la suite' +
          '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>' +
        '</span>' +
        popBars +
      '</div>' +
    '</div>' +
  '</article>';
}
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
  if(settings.hero_eyebrow)   document.getElementById('hero-eyebrow').innerHTML = settings.hero_eyebrow;
  if(settings.hero_title)     document.getElementById('hero-title').innerHTML = settings.hero_title;
  if(settings.hero_subtitle)  document.getElementById('hero-subtitle').innerHTML = settings.hero_subtitle;
  if(settings.hero_badge)     document.getElementById('hero-badge').innerHTML = settings.hero_badge;
  if(settings.hero_cta_primary) document.querySelector('#hero-cta-primary span').innerHTML = settings.hero_cta_primary;
  if(settings.hero_cta_secondary) document.querySelector('#hero-cta-secondary span').innerHTML = settings.hero_cta_secondary;
  if(settings.site_tagline)   document.getElementById('site-tagline').innerHTML = settings.site_tagline;

  // Stats
  document.getElementById('stat-voyages').textContent = artData.total ?? artData.articles.length;
  document.getElementById('stat-dest').textContent    = folderData.length || '-';

  // Grille articles
  const views = artData.articles.map(a => a.view_count || 0);
  const minViews = Math.min(...views, 0);
  const maxViews = Math.max(...views, 0);
  document.getElementById('articles-grid').innerHTML = artData.articles.length
    ? artData.articles.map(a => renderArticleCard(a, minViews, maxViews, IS_ADMIN)).join('')
    : "<div class=\"col-span-3 text-center py-16\" style=\"color:var(--ink-light)\">Aucun voyage publié pour l'instant.</div>";

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
      flagImg(f.icon)+
      '<span>'+esc(f.name)+'</span>'+
    '</a>'
  ).join('');

  if(IS_ADMIN){
    const heroStyle=document.createElement('style');
    heroStyle.textContent='.admin-editable-cue{position:relative;transition:box-shadow .15s ease,background .15s ease}.admin-editable-cue:hover{box-shadow:0 0 0 2px rgba(255,199,138,.55),0 0 0 8px rgba(255,199,138,.12);border-radius:1rem;background:rgba(255,255,255,.03)}.admin-editable-cue.admin-editing{box-shadow:0 0 0 2px rgba(255,199,138,.95),0 0 0 10px rgba(255,199,138,.18);border-radius:1rem}.admin-editable-cue::after{content:attr(data-admin-label);position:absolute;top:-.85rem;right:0;padding:.18rem .5rem;border-radius:999px;background:rgba(10,18,30,.82);color:#fff;font-size:.66rem;font-weight:700;letter-spacing:.04em;opacity:0;transform:translateY(3px);transition:opacity .15s ease,transform .15s ease;pointer-events:none}.admin-editable-cue:hover::after,.admin-editable-cue.admin-editing::after{opacity:1;transform:translateY(0)}#hero-admin-toolbar{position:fixed;right:1rem;top:7rem;z-index:60;display:flex;align-items:center;gap:.65rem;padding:.7rem .9rem;border-radius:1rem;background:rgba(10,18,30,.88);backdrop-filter:blur(10px);box-shadow:0 10px 28px rgba(0,0,0,.22);color:#fff}';
    document.head.appendChild(heroStyle);
    const bar=document.createElement('div');
    bar.setAttribute('style','position:fixed;top:64px;left:0;right:0;z-index:49;background:#0057B8;color:#fff;padding:.4rem 1rem .4rem 1.25rem;font-size:.78rem;font-weight:600;display:flex;align-items:center;gap:.75rem;box-shadow:0 2px 6px rgba(0,0,0,.18)');
    bar.innerHTML='<i class="ph ph-shield-check"></i> Mode admin <span style="opacity:.7;font-weight:400">\u2014 double-clic pour éditer, puis utilisez la palette de couleur</span><a href="/admin/dashboard" style="margin-left:auto;color:#fff;text-decoration:none;background:rgba(255,255,255,.2);padding:.2rem .65rem;border-radius:999px;font-size:.73rem">Dashboard \u2192</a>';
    document.body.prepend(bar);
    const toolbar=document.createElement('div');
    toolbar.id='hero-admin-toolbar';
    toolbar.style.display='none';
    toolbar.innerHTML='<span style="font-size:.72rem;font-weight:700;opacity:.8">Texte héro</span><input id="hero-color-picker" type="color" value="#ffffff" style="width:2.25rem;height:2.25rem;border:none;background:none;padding:0;cursor:pointer"><button type="button" id="hero-save-btn" class="subtle-btn" style="background:rgba(255,255,255,.14);color:#fff;border-color:rgba(255,255,255,.18)">Sauver</button><button type="button" id="hero-cancel-btn" class="subtle-btn" style="background:rgba(255,255,255,.08);color:#fff;border-color:rgba(255,255,255,.12)">Annuler</button>';
    document.body.appendChild(toolbar);
    let activeEditor=null;
    let savedRange=null;
    function saveRange(){const sel=window.getSelection();if(sel&&sel.rangeCount)savedRange=sel.getRangeAt(0).cloneRange();}
    function restoreRange(){if(!savedRange)return;const sel=window.getSelection();sel.removeAllRanges();sel.addRange(savedRange);}
    function finishEditor(save){
      if(!activeEditor)return;
      const el=activeEditor.el;
      const key=activeEditor.key;
      const prev=activeEditor.prev;
      const next=normalizeHeroHtml(el.innerHTML);
      el.contentEditable='false';
      el.classList.remove('admin-editing');
      toolbar.style.display='none';
      el.removeEventListener('mouseup', saveRange);
      el.removeEventListener('keyup', saveRange);
      el.onkeydown=null;
      if(!save){el.innerHTML=prev;activeEditor=null;return;}
      if(next && next!==prev){fetch('/api/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({[key]:next})}).then(()=>toast('Modifie !','ok')).catch(()=>toast('Erreur','err'));}
      activeEditor=null;
    }
    document.getElementById('hero-color-picker').addEventListener('input',function(){
      if(!activeEditor)return;
      activeEditor.el.focus();
      restoreRange();
      document.execCommand('styleWithCSS',false,true);
      document.execCommand('foreColor',false,this.value);
      saveRange();
    });
    document.getElementById('hero-save-btn').onclick=()=>finishEditor(true);
    document.getElementById('hero-cancel-btn').onclick=()=>finishEditor(false);
    function makeEditable(el,key,label){
      if(!el)return;
      el.title='Double-clic pour modifier';
      el.style.cursor='pointer';
      el.classList.add('admin-editable-cue');
      el.setAttribute('data-admin-label',label);
      el.addEventListener('dblclick',function(){
        if(activeEditor&&activeEditor.el!==this) finishEditor(true);
        const prev=normalizeHeroHtml(this.innerHTML);
        activeEditor={el:this,key,prev};
        this.contentEditable='true';
        this.classList.add('admin-editing');
        this.focus();
        toolbar.style.display='flex';
        this.addEventListener('mouseup', saveRange);
        this.addEventListener('keyup', saveRange);
        saveRange();
        this.onkeydown=e=>{
          if(e.key==='Escape'){e.preventDefault();finishEditor(false);}
          if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();finishEditor(true);}
          if(e.key==='Enter'){e.preventDefault();document.execCommand('insertLineBreak');saveRange();}
        };
        this.addEventListener('focusout',function onfo(){
          setTimeout(function(){
            if(!activeEditor||activeEditor.el!==el)return;
            if(toolbar.contains(document.activeElement))return;
            finishEditor(true);
          },200);
          el.removeEventListener('focusout',onfo);
        });
      });
    }
    makeEditable(document.getElementById('hero-eyebrow'),'hero_eyebrow','modifiable');
    makeEditable(document.getElementById('hero-title'),'hero_title','titre');
    makeEditable(document.getElementById('hero-subtitle'),'hero_subtitle','texte');
    makeEditable(document.getElementById('hero-badge'),'hero_badge','badge');
    makeEditable(document.getElementById('site-tagline'),'site_tagline','citation');
    makeEditable(document.querySelector('#hero-cta-primary span'),'hero_cta_primary','bouton');
    makeEditable(document.querySelector('#hero-cta-secondary span'),'hero_cta_secondary','bouton');
    const heroImageBtn=document.createElement('button');
    heroImageBtn.type='button';
    heroImageBtn.setAttribute('style','position:absolute;top:1rem;right:1rem;z-index:55;display:inline-flex;align-items:center;gap:.45rem;padding:.55rem .8rem;border-radius:999px;background:rgba(10,18,30,.72);color:#fff;font-size:.75rem;font-weight:700;border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(10px)');
    heroImageBtn.innerHTML='<i class="ph ph-image"></i> Image héro';
    const heroFile=document.createElement('input');
    heroFile.type='file';
    heroFile.accept='image/*';
    heroFile.style.display='none';
    heroFile.onchange=async()=>{const file=heroFile.files&&heroFile.files[0];if(!file)return;const fd=new FormData();fd.append('image',file);toast('Upload image héro...','info');const res=await fetch('/api/settings/hero-image',{method:'POST',body:fd}).catch(()=>null);const data=await res?.json().catch(()=>null);if(!res?.ok||!data?.url){toast(data?.error||'Erreur upload','err');return;}bgEl.src=data.url;bgEl.style.display='block';toast('Image héro mise à jour !','ok');};
    heroImageBtn.onclick=()=>heroFile.click();
    document.getElementById('hero').appendChild(heroImageBtn);
    document.getElementById('hero').appendChild(heroFile);
  }
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
