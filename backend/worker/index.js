/**
 * worker/index.js — Main Cloudflare Worker entry point
 *
 * Routing:
 *   Public HTML pages   →  /, /voyages, /voyage/:slug
 *   Admin HTML pages    →  /admin, /admin/dashboard, /admin/editor/:id?
 *   Auth endpoints      →  POST /admin/login, POST /admin/logout
 *   API (JSON)          →  /api/*
 *   R2 photo proxy      →  /r2/*
 */

import { isAuthenticated, createSession, clearSession } from './auth.js';
import { matchPath, json, notFound, unauthorized, redirect, html } from './utils.js';

// API handlers
import { listFolders, createFolder, updateFolder, deleteFolder } from './api/folders.js';
import { listArticles, getArticle, createArticle, updateArticle, patchArticleStatus, deleteArticle } from './api/articles.js';
import { uploadPhotos, deletePhoto, patchPhoto, uploadCover, serveR2Object } from './api/photos.js';
import { getSettings, updateSettings } from './api/settings.js';
import {
  getPushConfig, pushSubscribe, pushUnsubscribe,
  emailSubscribe, emailUnsubscribe,
} from './api/subscriptions.js';

// Page templates
import { homePage }     from './pages/home.js';
import { loginPage, dashboardPage, editorPage } from './pages/admin.js';

// ──────────────────────────────────────────────────────────────
// Simple voyages-list & voyage-detail pages (inline for brevity)
// ──────────────────────────────────────────────────────────────
import { HEAD, NAV, FOOTER, TOAST, LIGHTBOX } from './pages/shell.js';

function voyagesPage() {
  return html(`<!DOCTYPE html>
<html lang="fr">
<head>${HEAD('Voyages — Tranquille, on est en vacances')}</head>
<body class="font-sans antialiased" style="background:var(--cream)">
${NAV('voyages')}
<main class="pt-16">
  <!-- En-tête -->
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-4">
    <div class="eyebrow mb-5">Carnet de bord des Potet</div>
    <h1 class="font-display text-4xl sm:text-5xl font-bold mb-3" style="color:var(--ink)"><i class="ph ph-airplane-takeoff"></i> Tous nos voyages</h1>
    <p id="subtitle" class="text-lg" style="color:var(--ink-muted)">Chargement...</p>
  </div>
  <!-- Filtres -->
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div id="filters" class="flex flex-wrap gap-2" role="navigation" aria-label="Filtrer par destination"></div>
  </div>
  <!-- Grille -->
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
    <div id="grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      ${Array.from({length:6}).map(()=>`<div class="bg-white rounded-3xl overflow-hidden" style="border:1px solid var(--line);box-shadow:var(--card-shadow)"><div class="h-56 animate-pulse" style="background:var(--sand)"></div><div class="p-5 space-y-3"><div class="h-3 rounded-full animate-pulse w-1/2" style="background:var(--sand)"></div><div class="h-5 rounded-full animate-pulse w-4/5" style="background:var(--sand)"></div></div></div>`).join('')}
    </div>
  </div>
</main>
${FOOTER}
${TOAST}
<script>
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function fmtDate(d){return new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}
function fmtDateRange(a){
  const s=a.start_date||a.date, e=a.end_date||a.date;
  if(!s) return 'Dates non définies';
  return s===e ? fmtDate(s) : fmtDate(s)+' → '+fmtDate(e);
}
function card(a){return \`<article class="voyage-card cursor-pointer group" onclick="location.href='/voyage/\${a.slug}'" role="link" tabindex="0" onkeydown="if(event.key==='Enter')location.href='/voyage/\${a.slug}'" aria-label="\${esc('Lire : '+(a.title||''))}">
  <div class="relative overflow-hidden" style="height:15rem;border-radius:1.5rem 1.5rem 0 0">
    <img src="\${esc(a.cover_url||'')}" alt="\${esc(a.title)}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" onerror="this.src='https://picsum.photos/seed/\${a.id}x/800/600'">
    \${a.folder_name?'<div class="absolute top-3 left-3"><span class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm" style="background:rgba(255,253,249,.92);color:var(--palm);border:1px solid rgba(255,255,255,.6)">'+esc(a.folder_icon||'')+' '+esc(a.folder_name)+'</span></div>':''}
  </div>
  <div class="p-5">
    <div class="flex items-center gap-2 text-xs font-medium mb-2.5" style="color:var(--ink-light)"><span><i class="ph ph-calendar-blank"></i> \${fmtDateRange(a)}</span><span aria-hidden="true">·</span><span><i class="ph ph-map-pin"></i> \${esc(a.destination)}</span></div>
    <h3 class="font-display font-bold text-lg leading-snug mb-2 line-clamp-2" style="color:var(--ink)">\${esc(a.title)}</h3>
    <p class="text-sm leading-relaxed line-clamp-2 mb-4" style="color:var(--ink-muted)">\${esc(a.short_description)}</p>
    <span class="inline-flex items-center gap-1.5 text-sm font-semibold" style="color:var(--blue)">Lire la suite <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg></span>
  </div>
</article>\`;}

async function init(){
  const params=new URLSearchParams(location.search);
  const folder=params.get('folder');
  const [folders,artData]=await Promise.all([
    fetch('/api/folders').then(r=>r.json()).catch(()=>[]),
    fetch('/api/articles'+(folder?'?folder='+encodeURIComponent(folder):'')).then(r=>r.json()).catch(()=>({articles:[],total:0})),
  ]);
  const activeF=folder?folders.find(f=>f.slug===folder):null;
  const totalCount=(artData.total??artData.articles.length);
  const plural=totalCount!==1?'s':'';
  const destLabel=activeF?' — <strong style="color:var(--palm)">'+esc(activeF.icon||'')+' '+esc(activeF.name)+'</strong>':'';
  document.getElementById('subtitle').innerHTML='<strong style="color:var(--blue)">'+totalCount+'</strong> itinéraire'+plural+' documenté'+destLabel;

  const roots=folders.filter(f=>!f.parent_id);
  const kids=pid=>folders.filter(f=>f.parent_id===pid);
  const pill=(active,sub)=>{
    const base='inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm border-2 transition-all';
    if(active) return sub
      ? base+' border-palm text-white" style="background:var(--palm);border-color:var(--palm)'
      : base+' text-white" style="background:var(--blue);border-color:var(--blue)';
    return base+' bg-white" style="border-color:var(--line);color:var(--ink-muted)';
  };
  let btns='<a href="/voyages" class="'+pill(!folder,false)+'"><i class="ph ph-globe-hemisphere-west"></i> Tous</a>';
  roots.forEach(f=>{
    btns+='<a href="/voyages?folder='+f.slug+'" class="'+pill(folder===f.slug,false)+'">'+esc(f.icon)+' '+esc(f.name)+'</a>';
    kids(f.id).forEach(c=>{btns+='<a href="/voyages?folder='+c.slug+'" class="'+pill(folder===c.slug,true)+' text-xs pl-5">↳ '+esc(c.icon)+' '+esc(c.name)+'</a>';});
  });
  document.getElementById('filters').innerHTML=btns;
  document.getElementById('grid').innerHTML=artData.articles.length
    ?artData.articles.map(card).join('')
    :'<div class="col-span-3 text-center py-20" style="color:var(--ink-light)"><i class="ph ph-map-trifold" style="font-size:4rem;display:block;margin-bottom:1rem;color:var(--ink-light)"></i><p class="text-xl font-semibold mb-1" style="color:var(--ink)">Pas encore de voyage ici</p></div>';
}
init();
</script>
</body></html>`);
}

function voyagePage(slug) {
  return html(`<!DOCTYPE html>
<html lang="fr">
<head>${HEAD('Chargement... — Tranquille, on est en vacances')}</head>
<body class="font-sans antialiased" style="background:var(--cream)">
${NAV()}
<main id="main" class="pt-16">
  <div class="max-w-4xl mx-auto px-4 py-32 text-center">
    <i class="ph ph-airplane-takeoff animate-pulse mb-6" style="font-size:3rem;color:var(--blue);display:block"></i>
    <p class="font-medium" style="color:var(--ink-muted)">Chargement du voyage...</p>
  </div>
</main>
${FOOTER}
${TOAST}
${LIGHTBOX}
<script>
const SLUG = ${JSON.stringify(slug)};
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function fmtDate(d){return new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}
function fmtDateRange(a){
  const s=a.start_date||a.date, e=a.end_date||a.date;
  if(!s) return 'Dates non définies';
  return s===e ? fmtDate(s) : fmtDate(s)+' → '+fmtDate(e);
}

async function init(){
  const a=await fetch('/api/articles/'+SLUG).then(r=>r.json()).catch(()=>null);
  if(!a||a.error){
    document.getElementById('main').innerHTML=\`<div class="max-w-2xl mx-auto px-4 py-32 text-center"><i class="ph ph-map-trifold" style="font-size:4rem;display:block;margin-bottom:1.5rem;color:var(--ink-light)"></i><h1 class="font-display text-3xl font-bold mb-4" style="color:var(--ink)">Voyage introuvable</h1><p class="mb-8" style="color:var(--ink-muted)">Ce voyage n'existe pas ou n'est pas encore publié.</p><a href="/voyages" class="action-btn">← Retour aux voyages</a></div>\`;
    return;
  }
  document.title=esc(a.title)+' — Tranquille, on est en vacances';
  const photos=a.photos||[];
  const renderedContent=renderVoyageContent(a.content||'',photos);
  document.getElementById('main').innerHTML=\`
  <div class="hero-photo" style="height:clamp(44vh,62vw,70vh)">
    <img src="\${esc(a.cover_url||'')}" alt="\${esc(a.title)}" class="hero-photo-img" onerror="this.style.display='none'">
    <div class="hero-photo-overlay"></div>
    <div class="hero-photo-content absolute bottom-0 left-0 right-0 pb-10 px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto">
        \${a.folder_name?'<div class="mb-3"><span class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full text-white" style="background:rgba(255,255,255,.18);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,.30)">'+esc(a.folder_icon||'')+' '+esc(a.folder_name)+'</span></div>':''}
        <h1 class="font-display text-3xl sm:text-5xl font-bold text-white drop-shadow-lg leading-tight">\${esc(a.title)}</h1>
      </div>
    </div>
  </div>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
    <a href="/voyages" class="inline-flex items-center gap-2 font-semibold text-sm mb-8 hover:underline" style="color:var(--blue)">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>Retour aux voyages
    </a>
    <div class="panel rounded-[2rem] p-6 sm:p-8 mb-6">
      <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium" style="color:var(--ink-muted)">
        <span><i class="ph ph-calendar-blank"></i> \${fmtDateRange(a)}</span><span><i class="ph ph-map-pin"></i> \${esc(a.destination)}</span><span><i class="ph ph-camera"></i> \${photos.length} photo\${photos.length!==1?'s':''}</span>
      </div>
    </div>
    <div class="panel rounded-[2rem] p-6 sm:p-8 mb-10" style="border-left:4px solid rgba(var(--blue-rgb),.22)">
      <p class="text-base sm:text-lg leading-relaxed font-medium italic" style="color:var(--ink-muted)">"\${esc(a.short_description)}"</p>
    </div>
    <div class="prose-vacation text-base sm:text-lg leading-relaxed mb-12" style="color:var(--ink)">\${renderedContent}</div>
    \${renderWritingDays(a.writing_days||[])}
    \${photos.length ? renderGallery(photos) : ''}
    <div class="pt-8 flex items-center justify-between" style="border-top:1px solid var(--line)">
      <a href="/voyages" class="inline-flex items-center gap-2 font-semibold text-sm hover:underline" style="color:var(--blue)">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>Tous les voyages
      </a>
      <button onclick="share()" class="subtle-btn"><i class="ph ph-share-network"></i> Partager</button>
    </div>
  </div>\`;
  window.photos=photos;
}

function renderVoyageContent(content,photos){
  const wrapper=document.createElement('div');
  const trimmed=(content||'').trim();
  wrapper.innerHTML=trimmed.startsWith('<') ? trimmed : marked.parse(content||'');
  const photoIndexByUrl=new Map((photos||[]).map((p,i)=>[p.url,i]));

  // Multi-image paragraphs → grid
  wrapper.querySelectorAll('p').forEach(p=>{
    const imgs=[...p.querySelectorAll('img')];
    if(imgs.length<2) return;
    // Paragraph must contain only images and whitespace
    for(const c of p.childNodes){
      if(c.nodeType===3&&c.textContent.trim()) return;
      if(c.nodeType===1&&c.tagName!=='IMG') return;
    }
    const n=Math.min(imgs.length,3);
    const grid=document.createElement('div');
    grid.className=\`img-row img-row-\${n}\`;
    imgs.forEach(img=>{
      const cell=document.createElement('div');
      img.loading='lazy';
      const idx=photoIndexByUrl.get(img.getAttribute('src')||'');
      if(typeof idx==='number'){img.classList.add('cursor-zoom-in');img.setAttribute('onclick','openLightbox(window.photos,'+idx+')');}
      cell.appendChild(img);
      grid.appendChild(cell);
    });
    p.replaceWith(grid);
  });

  // Single images → figure
  wrapper.querySelectorAll('img').forEach(img=>{
    if(img.closest('.img-row')||img.closest('.img-pair')) return;
    img.className=\`\${img.className||''} rounded-2xl my-6 shadow-md\`.trim();
    img.loading='lazy';
    if(!img.closest('figure')){
      const figure=document.createElement('figure');
      img.replaceWith(figure);figure.appendChild(img);
      const alt=(img.getAttribute('alt')||'').trim();
      if(alt){const cap=document.createElement('figcaption');cap.textContent=alt;figure.appendChild(cap);}
    }
    const idx=photoIndexByUrl.get(img.getAttribute('src')||'');
    if(typeof idx==='number'){img.classList.add('cursor-zoom-in');img.setAttribute('onclick','openLightbox(window.photos,'+idx+')');}
  });
  return wrapper.innerHTML;
}

function renderGallery(photos){
  if(!photos.length) return '';
  const items=photos.map((p,i)=>\`
    <div class="break-inside-avoid mb-3">
      <img src="\${esc(p.url)}" alt="\${esc(p.caption||'')}" class="w-full rounded-2xl cursor-zoom-in shadow-sm hover:shadow-md transition-all" onclick="openLightbox(window.photos,\${i})" loading="lazy">
      \${p.caption?'<p class="text-xs mt-1.5 px-1" style="color:var(--ink-muted)">'+esc(p.caption)+'</p>':''}
    </div>\`).join('');
  return \`<section class="mb-12">
    <h2 class="font-display text-2xl sm:text-3xl font-bold mb-6" style="color:var(--ink)"><i class="ph ph-images"></i> Galerie du voyage</h2>
    <div class="columns-2 sm:columns-3 gap-3">\${items}</div>
  </section>\`;
}

function renderWritingDays(days){
  if(!Array.isArray(days)) return '';
  const items=days.filter(d=>d&&d.date&&d.summary).sort((a,b)=>a.date.localeCompare(b.date)).map(d=>\`
    <article class="bg-white rounded-2xl p-5" style="border:1px solid var(--line);box-shadow:var(--card-shadow)">
      <h3 class="font-bold text-sm mb-2" style="color:var(--blue)"><i class="ph ph-calendar-blank"></i> \${fmtDate(d.date)}</h3>
      <p class="text-sm sm:text-base leading-relaxed" style="color:var(--ink)">\${esc(d.summary)}</p>
    </article>\`).join('');
  if(!items) return '';
  return \`<section class="mb-12"><h2 class="font-display text-2xl sm:text-3xl font-bold mb-6" style="color:var(--ink)">Journal quotidien</h2><div class="grid gap-4">\${items}</div></section>\`;
}

function share(){if(navigator.share)navigator.share({title:document.title,url:location.href}).catch(()=>{});else navigator.clipboard.writeText(location.href).then(()=>toast('Lien copié !','ok'))}

init();
</script>
</body></html>`);
}

// ──────────────────────────────────────────────────────────────
// Main fetch handler
// ──────────────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url    = new URL(request.url);
    const path   = url.pathname;
    const method = request.method;

    // ── R2 photo proxy  (/r2/<key>) ───────────────────────────
    if (path.startsWith('/r2/')) {
      const key = path.slice(4); // strip leading '/r2/'
      return serveR2Object(env, key);
    }

    // ── Auth endpoints ────────────────────────────────────────
    if (path === '/admin/login' && method === 'POST') {
      const form = await request.formData().catch(() => null);
      const password = form?.get('password') || '';
      const cookie = await createSession(password, env.ADMIN_PASSWORD, env.SESSION_SECRET);
      if (!cookie) {
        return loginPage('Mot de passe incorrect. Réessayez.');
      }
      return new Response(null, {
        status: 302,
        headers: { Location: '/admin/dashboard', 'Set-Cookie': cookie },
      });
    }

    if (path === '/admin/logout' && method === 'POST') {
      return new Response(null, {
        status: 302,
        headers: { Location: '/', 'Set-Cookie': clearSession() },
      });
    }

    // ── Admin HTML pages (protected) ──────────────────────────
    if (path === '/admin' || path === '/admin/') {
      const authed = await isAuthenticated(request, env.SESSION_SECRET);
      return authed ? redirect('/admin/dashboard') : loginPage();
    }
    if (path.startsWith('/admin/')) {
      const authed = await isAuthenticated(request, env.SESSION_SECRET);
      if (!authed) {
        return new Response(null, { status: 302, headers: { Location: '/admin' } });
      }
      if (path === '/admin/dashboard') return dashboardPage();
      if (path === '/admin/editor')    return editorPage(null);
      const editorMatch = matchPath('/admin/editor/:id', path);
      if (editorMatch) return editorPage(parseInt(editorMatch.id));
    }

    // ── API routes ────────────────────────────────────────────
    if (path.startsWith('/api/')) {
      const authed = await isAuthenticated(request, env.SESSION_SECRET);

      // Settings
      if (path === '/api/settings') {
        if (method === 'GET') return getSettings(env);
        if (method === 'PUT') return authed ? updateSettings(request, env) : unauthorized();
      }

      // Folders
      if (path === '/api/folders') {
        if (method === 'GET')  return listFolders(env);
        if (method === 'POST') return authed ? createFolder(request, env) : unauthorized();
      }
      const folderMatch = matchPath('/api/folders/:id', path);
      if (folderMatch) {
        const id = parseInt(folderMatch.id);
        if (method === 'PUT')    return authed ? updateFolder(request, env, id) : unauthorized();
        if (method === 'DELETE') return authed ? deleteFolder(env, id)          : unauthorized();
      }

      // Push & email subscriptions (public)
      if (path === '/api/push/config') return getPushConfig(env);
      if (path === '/api/push/subscribe'   && method === 'POST') return pushSubscribe(request, env);
      if (path === '/api/push/unsubscribe' && method === 'POST') return pushUnsubscribe(request, env);
      if (path === '/api/email/subscribe'  && method === 'POST') return emailSubscribe(request, env);

      // Articles
      if (path === '/api/articles') {
        if (method === 'GET')  return listArticles(request, env, authed);
        if (method === 'POST') return authed ? createArticle(request, env, ctx) : unauthorized();
      }
      const articleSlugMatch = matchPath('/api/articles/:slug', path);
      if (articleSlugMatch && !articleSlugMatch.slug.match(/^\d+$/)) {
        if (method === 'GET') return getArticle(env, articleSlugMatch.slug, authed);
      }
      const articleIdMatch = matchPath('/api/articles/:id', path);
      if (articleIdMatch) {
        const id = parseInt(articleIdMatch.id);
        if (!isNaN(id)) {
          if (method === 'GET')    return getArticle(env, id, authed);
          if (method === 'PUT')    return authed ? updateArticle(request, env, id, ctx) : unauthorized();
          if (method === 'DELETE') return authed ? deleteArticle(env, id)               : unauthorized();
        } else {
          // slug-based GET
          if (method === 'GET') return getArticle(env, articleIdMatch.id, authed);
        }
      }
      const statusMatch = matchPath('/api/articles/:id/status', path);
      if (statusMatch && method === 'PATCH') {
        return authed ? patchArticleStatus(env, parseInt(statusMatch.id), ctx) : unauthorized();
      }
      const photoUploadMatch = matchPath('/api/articles/:id/photos', path);
      if (photoUploadMatch && method === 'POST') {
        return authed ? uploadPhotos(request, env, parseInt(photoUploadMatch.id)) : unauthorized();
      }
      const coverUploadMatch = matchPath('/api/articles/:id/cover', path);
      if (coverUploadMatch && method === 'POST') {
        return authed ? uploadCover(request, env, parseInt(coverUploadMatch.id)) : unauthorized();
      }

      // Photos
      const photoMatch = matchPath('/api/photos/:id', path);
      if (photoMatch) {
        const id = parseInt(photoMatch.id);
        if (method === 'DELETE') return authed ? deletePhoto(env, id)             : unauthorized();
        if (method === 'PATCH')  return authed ? patchPhoto(request, env, id)     : unauthorized();
      }

      return json({ error: 'Not found' }, 404);
    }

    // ── Email unsubscribe (public, renders HTML) ────────────────
    if (path === '/unsubscribe') return emailUnsubscribe(request, env);

    // ── Public HTML pages ─────────────────────────────────────
    if (path === '/' || path === '') return homePage();
    if (path === '/voyages')         return voyagesPage();
    const voyageMatch = matchPath('/voyage/:slug', path);
    if (voyageMatch) return voyagePage(voyageMatch.slug);

    // 404
    return html(`<!DOCTYPE html><html lang="fr"><head><title>404 — Page introuvable</title></head>
<body style="font-family:sans-serif;text-align:center;padding:4rem">
  <h1 style="font-size:3rem"><i class="ph ph-map-trifold"></i></h1>
  <h2>Page introuvable</h2>
  <p><a href="/">← Retour à l'accueil</a></p>
</body></html>`, 404);
  },
};
