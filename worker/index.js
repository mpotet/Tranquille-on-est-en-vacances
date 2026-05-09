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
import { uploadPhotos, deletePhoto, patchPhoto, serveR2Object } from './api/photos.js';

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
<head>${HEAD('Voyages — Tranquille, on est en vacances 🌴')}</head>
<body class="bg-stone-50 font-sans text-stone-900 antialiased">
${NAV('voyages')}
<main class="pt-16">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="section-panel rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10 overflow-hidden relative">
      <div class="eyebrow mb-5">Collection Majorelle</div>
      <h1 class="font-display text-4xl sm:text-5xl font-bold mb-3 text-stone-900">✈️ Tous nos voyages</h1>
      <p id="subtitle" class="text-stone-600 text-lg">Chargement...</p>
    </div>
  </div>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div id="filters" class="mb-8 flex flex-wrap gap-2"></div>
    <div id="grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      ${Array.from({length:6}).map(()=>`<div class="bg-white rounded-3xl overflow-hidden shadow-md"><div class="h-52 bg-stone-200 animate-pulse"></div><div class="p-5 space-y-3"><div class="h-3 bg-stone-200 rounded animate-pulse w-1/2"></div><div class="h-5 bg-stone-200 rounded animate-pulse w-4/5"></div></div></div>`).join('')}
    </div>
  </div>
</main>
${FOOTER}
${TOAST}
<script>
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function fmtDate(d){return new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}
function fmtDateRange(a){
  const s = a.start_date || a.date;
  const e = a.end_date || a.date;
  if (!s) return 'Dates non définies';
  return s === e ? fmtDate(s) : fmtDate(s)+' → '+fmtDate(e);
}
function card(a){return \`<article class="voyage-card bg-white rounded-3xl overflow-hidden shadow-md cursor-pointer" onclick="location.href='/voyage/\${a.slug}'">
  <div class="relative h-52 overflow-hidden"><img src="\${esc(a.cover_url||'')}" alt="\${esc(a.title)}" class="w-full h-full object-cover transition-transform duration-500 hover:scale-110" loading="lazy" onerror="this.src='https://picsum.photos/seed/\${a.id}x/800/600'">
  </div>
  <div class="p-5"><div class="text-stone-400 text-xs mb-2">📅 \${fmtDateRange(a)} · 📍 \${esc(a.destination)}</div>
  <h3 class="font-display font-bold text-lg text-stone-900 mb-2 line-clamp-2 leading-snug">\${esc(a.title)}</h3>
  <p class="text-stone-500 text-sm leading-relaxed line-clamp-2 mb-4">\${esc(a.short_description)}</p>
  \${a.folder_name?'<div class="mb-4"><span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-white border border-stone-200 text-stone-700">'+esc(a.folder_icon||'')+' '+esc(a.folder_name)+'</span></div>':''}
  <span class="text-sky-600 text-sm font-bold">Lire la suite →</span></div></article>\`;}

async function init(){
  const params = new URLSearchParams(location.search);
  const folder = params.get('folder');
  const [folders, artData] = await Promise.all([
    fetch('/api/folders').then(r=>r.json()).catch(()=>[]),
    fetch('/api/articles'+(folder?'?folder='+encodeURIComponent(folder):'')).then(r=>r.json()).catch(()=>({articles:[],total:0})),
  ]);
  const activeF = folder ? folders.find(f=>f.slug===folder) : null;
  const totalCount = (artData.total ?? artData.articles.length);
  const pluralSuffix = totalCount !== 1 ? 's' : '';
  const activeFolderLabel = activeF
    ? ' — focus <strong class="text-orange-500">'+esc(activeF.icon||'')+' '+esc(activeF.name)+'</strong>'
    : '';
  document.getElementById('subtitle').innerHTML =
    '<strong class="text-sky-700">'+totalCount+'</strong> itinéraire'+pluralSuffix+' documenté'+activeFolderLabel;
  const roots = folders.filter(f=>!f.parent_id);
  const children = pid => folders.filter(f=>f.parent_id===pid);
  let btns='<a href="/voyages" class="px-4 py-2 rounded-full font-bold text-sm border-2 transition-all '+((!folder)?'bg-sky-500 text-white border-sky-500 shadow-md':'bg-white text-stone-600 border-stone-200 hover:border-sky-300 hover:text-sky-600')+'">🌍 Tous</a>';
  roots.forEach(f=>{
    btns+='<a href="/voyages?folder='+f.slug+'" class="px-4 py-2 rounded-full font-bold text-sm border-2 transition-all '+(folder===f.slug?'bg-sky-500 text-white border-sky-500 shadow-md':'bg-white text-stone-600 border-stone-200 hover:border-sky-300 hover:text-sky-600')+'">'+esc(f.icon)+' '+esc(f.name)+'</a>';
    children(f.id).forEach(c=>{btns+='<a href="/voyages?folder='+c.slug+'" class="pl-5 pr-4 py-2 rounded-full font-semibold text-xs border-2 transition-all '+(folder===c.slug?'bg-orange-500 text-white border-orange-500 shadow-md':'bg-white text-stone-500 border-stone-200 hover:border-orange-300 hover:text-orange-600')+'">↳ '+esc(c.icon)+' '+esc(c.name)+'</a>';});
  });
  document.getElementById('filters').innerHTML=btns;
  document.getElementById('grid').innerHTML = artData.articles.length ? artData.articles.map(card).join('') : '<div class="col-span-3 text-center py-20 text-stone-400"><span class="text-6xl block mb-4">🗺️</span><p class="text-xl font-semibold mb-1">Pas encore de voyage ici</p></div>';
}
init();
</script>
</body></html>`);
}

function voyagePage(slug) {
  return html(`<!DOCTYPE html>
<html lang="fr">
<head>${HEAD('Chargement... — Tranquille, on est en vacances')}</head>
<body class="bg-stone-50 font-sans text-stone-900 antialiased">
${NAV()}
<main id="main" class="pt-16">
  <div class="max-w-4xl mx-auto px-4 py-32 text-center">
    <div class="text-5xl animate-pulse mb-6">✈️</div>
    <p class="text-stone-400 font-medium">Chargement du voyage...</p>
  </div>
</main>
${FOOTER}
${TOAST}
${LIGHTBOX}
<script>
const SLUG = ${JSON.stringify(slug)};
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function fmtDate(d){return new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}

async function init(){
  const a = await fetch('/api/articles/'+SLUG).then(r=>r.json()).catch(()=>null);
  if (!a || a.error) {
    document.getElementById('main').innerHTML = \`<div class="max-w-2xl mx-auto px-4 py-32 text-center"><span class="text-6xl block mb-6">🗺️</span><h1 class="font-display text-3xl font-bold text-stone-900 mb-4">Voyage introuvable</h1><p class="text-stone-500 mb-8">Ce voyage n'existe pas ou n'est pas encore publié.</p><a href="/voyages" class="action-btn">← Retour aux voyages</a></div>\`;
    return;
  }
  document.title = esc(a.title) + ' — Tranquille, on est en vacances 🌴';
  const photos = a.photos || [];
  const renderedContent = renderVoyageContent(a.content || '', photos);
  document.getElementById('main').innerHTML = \`
  <div class="h-[52vh] sm:h-[68vh] overflow-hidden">
    <img src="\${esc(a.cover_url||'')}" alt="\${esc(a.title)}" class="w-full h-full object-cover" onerror="this.style.background='#6050DC'">
  </div>
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <a href="/voyages" class="inline-flex items-center gap-2 text-stone-500 hover:text-sky-600 font-semibold transition-colors text-sm mb-5">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>Retour aux voyages
      </a>
      <div class="section-panel rounded-[2rem] p-5 sm:p-6 mb-6">
        \${a.folder_name?'<div class="mb-3"><span class="inline-flex items-center gap-1.5 bg-white text-stone-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-stone-200">'+esc(a.folder_icon||'')+' '+esc(a.folder_name)+'</span></div>':''}
        <h1 class="font-display text-3xl sm:text-5xl font-bold text-stone-900 mb-3 leading-tight">\${esc(a.title)}</h1>
        <div class="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-stone-500 text-sm font-medium">
          <span>📅 \${fmtDateRange(a)}</span><span>📍 \${esc(a.destination)}</span><span>📷 \${photos.length} photos</span>
        </div>
      </div>
      <div class="section-panel rounded-[2rem] p-5 sm:p-6 mb-10">
        <p class="text-stone-700 text-base sm:text-lg leading-relaxed font-medium italic">"\${esc(a.short_description)}"</p>
      </div>
    <div class="prose-vacation text-stone-700 text-base sm:text-lg leading-relaxed mb-12">\${renderedContent}</div>
    \${renderWritingDays(a.writing_days || [])}
      <div class="border-t border-stone-200 pt-8 flex items-center justify-between">
        <a href="/voyages" class="flex items-center gap-2 text-stone-500 hover:text-sky-600 font-semibold transition-colors text-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>Tous les voyages
        </a>
        <button onclick="share()" class="subtle-btn">📤 Partager</button>
      </div>
  </div>\`;
  // expose photos array to lightbox
  window.photos = photos;
}

function renderVoyageContent(content, photos){
  const wrapper = document.createElement('div');
  wrapper.innerHTML = marked.parse(content || '');
  const photoIndexByUrl = new Map((photos || []).map((p, i) => [p.url, i]));

  wrapper.querySelectorAll('img').forEach(img => {
    img.className = `${img.className || ''} rounded-2xl my-6 shadow-md`.trim();
    img.loading = 'lazy';
    if (!img.closest('figure')) {
      const figure = document.createElement('figure');
      img.replaceWith(figure);
      figure.appendChild(img);
      const alt = (img.getAttribute('alt') || '').trim();
      if (alt) {
        const cap = document.createElement('figcaption');
        cap.textContent = alt;
        figure.appendChild(cap);
      }
    }
    const idx = photoIndexByUrl.get(img.getAttribute('src') || '');
    if (typeof idx === 'number') {
      img.classList.add('cursor-zoom-in');
      img.setAttribute('onclick', 'openLightbox(window.photos,'+idx+')');
    }
  });

  return wrapper.innerHTML;
}

function renderWritingDays(days){
  if (!Array.isArray(days)) return '';
  const items = days
    .filter(d => d && d.date && d.summary)
    .sort((a,b)=>a.date.localeCompare(b.date))
    .map(d => \`
      <article class="bg-white border border-stone-200 rounded-2xl p-5">
        <h3 class="font-bold text-sky-800 text-sm mb-2">🗓️ \${fmtDate(d.date)}</h3>
        <p class="text-stone-700 text-sm sm:text-base leading-relaxed">\${esc(d.summary)}</p>
      </article>\`)
    .join('');
  if (!items) return '';
  return \`
    <section class="mb-12">
      <h2 class="font-display text-2xl sm:text-3xl font-bold text-stone-900 mb-4">Journal quotidien</h2>
      <div class="grid gap-3">\${items}</div>
    </section>\`;
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

      // Articles
      if (path === '/api/articles') {
        if (method === 'GET')  return listArticles(request, env, authed);
        if (method === 'POST') return authed ? createArticle(request, env)        : unauthorized();
      }
      const articleSlugMatch = matchPath('/api/articles/:slug', path);
      if (articleSlugMatch && !articleSlugMatch.slug.match(/^\d+$/)) {
        if (method === 'GET') return getArticle(env, articleSlugMatch.slug, authed);
      }
      const articleIdMatch = matchPath('/api/articles/:id', path);
      if (articleIdMatch) {
        const id = parseInt(articleIdMatch.id);
        if (!isNaN(id)) {
          if (method === 'PUT')    return authed ? updateArticle(request, env, id)   : unauthorized();
          if (method === 'DELETE') return authed ? deleteArticle(env, id)             : unauthorized();
        } else {
          // slug-based GET
          if (method === 'GET') return getArticle(env, articleIdMatch.id, authed);
        }
      }
      const statusMatch = matchPath('/api/articles/:id/status', path);
      if (statusMatch && method === 'PATCH') {
        return authed ? patchArticleStatus(env, parseInt(statusMatch.id)) : unauthorized();
      }
      const photoUploadMatch = matchPath('/api/articles/:id/photos', path);
      if (photoUploadMatch && method === 'POST') {
        return authed ? uploadPhotos(request, env, parseInt(photoUploadMatch.id)) : unauthorized();
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

    // ── Public HTML pages ─────────────────────────────────────
    if (path === '/' || path === '') return homePage();
    if (path === '/voyages')         return voyagesPage();
    const voyageMatch = matchPath('/voyage/:slug', path);
    if (voyageMatch) return voyagePage(voyageMatch.slug);

    // 404
    return html(`<!DOCTYPE html><html lang="fr"><head><title>404 — Page introuvable</title></head>
<body style="font-family:sans-serif;text-align:center;padding:4rem">
  <h1 style="font-size:3rem">🗺️</h1>
  <h2>Page introuvable</h2>
  <p><a href="/">← Retour à l'accueil</a></p>
</body></html>`, 404);
  },
};
