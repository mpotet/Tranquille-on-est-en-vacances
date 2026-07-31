/**
 * worker/index.js - Main Cloudflare Worker entry point
 *
 * Routing:
 *   Public HTML pages   →  /, /voyages, /voyage/:slug
 *   Admin HTML pages    →  /admin, /admin/dashboard, /admin/editor/:id?
 *   Auth endpoints      →  POST /admin/login, POST /admin/logout
 *   API (JSON)          →  /api/*
 *   R2 photo proxy      →  /r2/*
 */

import { isAuthenticated, createSession, clearSession, issueSessionCookie } from './auth.js';
import { matchPath, json, notFound, unauthorized, redirect, html, badRequest, cleanEmailInput } from './utils.js';
import { safeAttr, safeText } from './helpers/html.js';
import { hashPassword, verifyPassword } from './password.js';
import {
  getAdminAccount, getAdminByEmail, issueToken, findByValidToken, clearToken,
} from './admin-account.js';
import {
  sendResetEmail, sendEmailChangeEmail, sendPasswordChangedEmail, isEmailConfigured,
} from './admin-email.js';
import { setPasswordPage, confirmEmailPage } from './pages/admin-auth.js';
import { checkRateLimit, recordFailedAttempt, clearAttempts, clientKey } from './rate-limit.js';
import {
  renderVoyageContent as ssrVoyageContent, renderGallery as ssrGallery,
  renderWritingDays as ssrWritingDays, extractInlineImages as ssrExtractImages,
  stripMdText as ssrStripMd,
} from './helpers/render.js';

// API handlers
import { listFolders, createFolder, updateFolder, deleteFolder } from './api/folders.js';
import { listArticles, getArticle, createArticle, updateArticle, patchArticleStatus, deleteArticle, recordView, logPageView, isBotUserAgent, ensureVisitorId } from './api/articles.js';
import { uploadPhotos, deletePhoto, patchPhoto, uploadCover, uploadHeroImage, deleteHeroImage, serveR2Object } from './api/photos.js';
import { getSettings, updateSettings } from './api/settings.js';
import { listComments, createComment, deleteComment, listRecentCommentsAdmin, replyToComment } from './api/comments.js';
import { getAnalytics } from './api/analytics.js';
import {
  listEmailLog, listSubscriberEmailLog, getEmailConfigStatus, saveEmailConfig, checkEmailSenderStatus, requestSenderVerification,
} from './api/email-admin.js';
import {
  getPushConfig, pushSubscribe, pushUnsubscribe,
  emailSubscribe, emailUnsubscribe, listEmailSubscribersAdmin, adminUnsubscribeById,
} from './api/subscriptions.js';

// Page templates
import { homePage }     from './pages/home.js';
import { showcasePage } from './pages/showcase.js';
import { loginPage, dashboardPage, editorPage } from './pages/admin.js';
import { printPage, exportWordDocx } from './pages/print.js';

// ──────────────────────────────────────────────────────────────
// Simple voyages-list & voyage-detail pages (inline for brevity)
// ──────────────────────────────────────────────────────────────
import { HEAD, NAV, FOOTER, TOAST, LIGHTBOX } from './pages/shell.js';

// Canonical production origin - used for canonical/og:url tags, sitemap.xml
// and the RSS feed (all need an absolute URL, and there's exactly one
// deployed origin for this site, so a fixed constant is simpler and more
// reliable than threading `request.url` through every page function).
const SITE_URL = 'https://tranquille-vacances.esti-archi.workers.dev';

// Matches skeletonCards() in pages/home.js - kept identical so the loading
// state reads the same whether you land here from the home grid or directly.
function skeletonVoyageCards(n) {
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

function voyagesPage(authed=false) {
  return html(`<!DOCTYPE html>
<html lang="fr">
<head>${HEAD('Voyages - Tranquille, on est en vacances', 'Tous nos récits de voyage en famille, classés par destination.', { url: SITE_URL + '/voyages' })}</head>
<body class="font-sans antialiased" style="background:var(--cream)">
${NAV('voyages', authed)}
<main class="pt-16">
  <!-- ── Mini-hero ───────────────────────────────────────────── -->
  <section class="hero-photo" style="min-height:clamp(15rem,30vh,21rem);display:flex;flex-direction:column;justify-content:flex-end">
    <div class="hero-photo-overlay"></div>
    <div class="hero-photo-content w-full pb-9 pt-16">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div id="breadcrumb" class="hidden mb-3"></div>
        <div id="hero-eyebrow-wrap" class="eyebrow mb-4 hero-anim" style="background:rgba(255,199,138,.22);border-color:rgba(255,199,138,.5);color:#fff;--d:0ms">Carnet de bord des Potet</div>
        <h1 id="voyages-title" class="font-display text-3xl sm:text-5xl font-bold mb-4 text-white drop-shadow-lg hero-anim" style="--d:80ms">Tous nos voyages</h1>
        <span id="subtitle" class="drame-badge hero-anim" style="border-color:rgba(255,255,255,.4);background:rgba(255,255,255,.14);color:#fff;display:inline-block;--d:160ms">Chargement…</span>
      </div>
    </div>
  </section>

  <!-- ── Dock filtres + tri (chevauche le hero) ─────────────────── -->
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8" style="margin-top:-1rem;position:relative;z-index:3">
    <div class="panel rounded-[1.75rem] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
      <div id="filters" class="flex flex-wrap gap-2" role="navigation" aria-label="Filtrer par destination"></div>
      <div id="sort-wrap" class="relative flex-shrink-0">
        <button type="button" id="sort-btn" onclick="const m=document.getElementById('sort-menu');const o=m.classList.toggle('hidden');this.setAttribute('aria-expanded',!o)" aria-haspopup="true" aria-expanded="false" class="subtle-btn text-sm" style="padding:.6rem 1.1rem">
          <i class="ph-bold ph-sort-ascending"></i> <span id="sort-label">Plus récents</span> <i class="ph-bold ph-caret-down" style="font-size:.7rem"></i>
        </button>
        <div id="sort-menu" class="hidden absolute right-0 mt-2 py-1.5 rounded-2xl shadow-xl" style="min-width:11rem;background:var(--cream);border:1px solid var(--line);z-index:60">
          <button type="button" data-sort="date_desc" class="sort-opt flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold w-full text-left transition-colors hover:bg-blue-50" style="color:var(--ink)">Plus récents</button>
          <button type="button" data-sort="date_asc" class="sort-opt flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold w-full text-left transition-colors hover:bg-blue-50" style="color:var(--ink)">Plus anciens</button>
          <button type="button" data-sort="views_desc" class="sort-opt flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold w-full text-left transition-colors hover:bg-blue-50" style="color:var(--ink)">Les plus lus</button>
          <button type="button" data-sort="title_asc" class="sort-opt flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold w-full text-left transition-colors hover:bg-blue-50" style="color:var(--ink)">Titre (A→Z)</button>
        </div>
      </div>
    </div>
  </div>

  <div class="luxe-divider max-w-6xl mx-auto mt-10 mb-2 opacity-60"></div>

  <!-- Grille -->
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
    <div id="grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      ${skeletonVoyageCards(6)}
    </div>
  </div>
</main>

<!-- Public folder-creation modal (admin only, styled like the dashboard modal) -->
<div id="pub-folder-modal" class="hidden fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onclick="if(event.target===this)closePublicFolderModal()">
  <div class="section-panel majorelle-frame rounded-3xl shadow-2xl w-full max-w-sm p-6" style="background:var(--cream);border:1px solid var(--line)">
    <h3 id="pfm-title" class="font-display text-xl font-bold mb-1" style="color:var(--ink)"><i class="ph-bold ph-folder-plus"></i> Nouveau sous-dossier</h3>
    <p id="pfm-sub" class="text-sm mb-5" style="color:var(--ink-muted)"></p>
    <div class="mb-6">
      <label class="block text-xs font-bold mb-1.5 uppercase tracking-wide" style="color:var(--ink-muted)" for="pfm-name">Nom du sous-dossier</label>
      <input type="text" id="pfm-name" placeholder="Ex: Côte Amalfitaine" class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-medium" style="border-color:rgba(var(--blue-rgb),.18)">
    </div>
    <div class="flex gap-3">
      <button type="button" onclick="closePublicFolderModal()" class="flex-1 font-bold py-2.5 rounded-xl text-sm" style="background:var(--sand);color:var(--ink)">Annuler</button>
      <button type="button" onclick="submitPublicFolder()" class="flex-1 action-btn-sm">Créer <i class="ph-bold ph-check"></i></button>
    </div>
  </div>
</div>

${FOOTER}
${TOAST}
<script>
const IS_ADMIN=${JSON.stringify(authed)};
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function flagImg(icon){if(!icon)return '';const cp=[...icon].map(c=>c.codePointAt(0));if(cp.length>=2&&cp[0]>=0x1F1E6&&cp[0]<=0x1F1FF&&cp[1]>=0x1F1E6&&cp[1]<=0x1F1FF){const code=[cp[0],cp[1]].map(c=>String.fromCodePoint(c-0x1F1E6+65)).join('').toLowerCase();return '<img src="https://flagcdn.com/w20/'+code+'.png" width="20" height="15" alt="'+code.toUpperCase()+'" style="vertical-align:middle;border-radius:2px;flex-shrink:0">';}return '<span>'+icon+'</span>';}
function fmtDate(d){return new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}
function fmtDateRange(a){
  const s=a.start_date||a.date, e=a.end_date||a.date;
  if(!s) return 'Dates non définies';
  return s===e ? fmtDate(s) : fmtDate(s)+' - '+fmtDate(e);
}
function escAttr(s){return esc(s).replace(/'/g,'&#39;')}
function safeAttr(s){return(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function safeText(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function fmtDateCard(a){const s=a.start_date||a.date,e=a.end_date||a.date;if(!s)return'';const opt={month:'short',year:'numeric'};const ms=new Date(s).toLocaleDateString('fr-FR',opt);const me=new Date(e).toLocaleDateString('fr-FR',opt);return ms===me?ms:ms+' - '+me;}
function stripMd(s){return(s||'').replace(/!\\[[^\\]]*\\]\\([^)]*\\)/g,'').replace(/\\*\\*([^*\\n]+)\\*\\*/g,'$1').replace(/\\*([^*\\n]+)\\*/g,'$1').replace(/^#{1,6}\\s+/gm,'').replace(/\\s+/g,' ').trim();}
// Ascending bars (signal-strength style), matching home.js/popularityBarsSSR -
// equal-sized dots read as carousel/pagination indicators, misleading here.
function renderPopularityBars(views, minViews, maxViews) {
  const range = maxViews - minViews || 1;
  const count = Math.max(1, Math.ceil((views - minViews) / range * 5));
  const heights = [5, 8, 11, 14, 17];
  let bars = '';
  for (let i = 0; i < 5; i++) {
    bars += '<span style="display:inline-block;width:3px;height:' + heights[i] + 'px;border-radius:1px;background:' + (i < count ? 'var(--blue)' : 'rgba(var(--ink-rgb),.12)') + '"></span>';
  }
  return '<div style="display:flex;align-items:center;gap:3px">' + bars + '<span style="font-size:.68rem;margin-left:4px;color:var(--ink-light);line-height:1">' + views + '</span></div>';
}
// Same status palette/icons as the admin dashboard (STATUS_META in admin.js)
// and the .badge-* classes in shell.js - kept in sync deliberately.
function statusMeta(status){
  if(status==='published') return {label:'Publié',icon:'ph-fill ph-check-circle',bg:'var(--palm)',color:'#fff'};
  if(status==='publish_when_online') return {label:'Dès connexion',icon:'ph-bold ph-wifi-high',bg:'var(--pending)',color:'#fff'};
  return {label:'Archivé',icon:'ph-bold ph-archive',bg:'rgba(90,106,122,.85)',color:'#fff'};
}
function card(a, minViews=0, maxViews=0){
  const slug = safeAttr(a.slug || '');
  const title = safeText(a.title || '');
  const cover = safeAttr(a.cover_url || '');
  const dest = safeText(a.destination || '');
  const desc = stripMd(a.short_description || '');
  const ariaLabel = safeText('Lire : ' + (a.title || ''));
  const popBars = renderPopularityBars(a.view_count || 0, minViews, maxViews);

  let eb='';
  if(IS_ADMIN){
    const editUrl = '/admin/editor/' + String(a.id);
    eb='<a href="' + safeAttr(editUrl) + '" onclick="event.stopPropagation()" style="position:absolute;top:.75rem;right:.75rem;z-index:5;display:inline-flex;align-items:center;gap:.35rem;padding:.3rem .75rem;border-radius:999px;font-size:.73rem;font-weight:700;background:rgba(0,87,184,.92);color:#fff;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,.25)"><i class="ph-bold ph-pencil-simple"></i> Modifier</a>';
  }

  let sb='';
  if(IS_ADMIN){
    const sm=statusMeta(a.status);
    sb='<span style="position:absolute;left:.75rem;bottom:.75rem;z-index:5;display:inline-flex;align-items:center;gap:.35rem;padding:.35rem .65rem;border-radius:999px;font-size:.72rem;font-weight:700;background:' + sm.bg + ';color:' + sm.color + ';box-shadow:0 2px 8px rgba(0,0,0,.22)"><i class="' + sm.icon + '"></i> ' + sm.label + '</span>';
  }

  let folder='';
  if(a.folder_name){
    const folderName = safeText(a.folder_name);
    folder='<div class="absolute top-3 left-3"><span class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm" style="background:rgba(255,253,249,.92);color:var(--palm);border:1px solid rgba(255,255,255,.6)">' + flagImg(a.folder_icon || '') + ' ' + folderName + '</span></div>';
  }

  return '<article class="voyage-card cursor-pointer group" style="position:relative;display:flex;flex-direction:column" data-slug="' + slug + '" role="link" tabindex="0" aria-label="' + ariaLabel + '">' +
    eb +
    '<div class="relative overflow-hidden" style="height:15rem;border-radius:1.5rem 1.5rem 0 0;flex-shrink:0">' +
      '<img src="' + cover + '" alt="' + title + '" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" data-fallback="https://picsum.photos/seed/' + a.id + 'x/800/600">' +
      folder +
      sb +
    '</div>' +
    '<div class="p-5" style="display:flex;flex-direction:column;flex:1">' +
      '<div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem">' +
        '<span style="display:inline-flex;align-items:center;gap:.25rem;padding:.2rem .6rem;border-radius:999px;font-size:.72rem;font-weight:600;background:var(--sand);color:var(--ink-light)"><i class="ph-bold ph-calendar-blank" style="color:var(--blue)"></i> ' + fmtDateCard(a) + '</span>' +
        (dest ? '<span style="display:inline-flex;align-items:center;gap:.25rem;padding:.2rem .6rem;border-radius:999px;font-size:.72rem;font-weight:600;background:var(--sand);color:var(--ink-light)"><i class="ph-bold ph-map-pin" style="color:var(--blue)"></i> ' + dest + '</span>' : '') +
      '</div>' +
      '<h3 class="font-display font-bold" style="font-size:1.05rem;line-height:1.35;margin-bottom:.5rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:var(--ink)">' + title + '</h3>' +
      '<p style="font-size:.875rem;line-height:1.55;flex:1;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:var(--ink-muted);margin-bottom:1rem">' + desc + '</p>' +
      '<div style="display:flex;justify-content:flex-end">' + popBars + '</div>' +
    '</div>' +
  '</article>';
}

function folderCard(f){
  const slug = safeAttr(f.slug || '');
  const name = safeText(f.name || '');
  // Folder tiles are visually distinct from article tiles: a persistent
  // "Destination" badge, a tinted card background, a dashed accent border and a
  // stacked-folder motif, so they read as sub-destinations at a glance.
  return '<article class="voyage-card folder-tile cursor-pointer group" style="position:relative;background:linear-gradient(160deg,rgba(0,87,184,.06),rgba(255,199,138,.10));border:1px solid rgba(0,87,184,.20);border-style:dashed" data-folder-slug="' + slug + '" role="link" tabindex="0" aria-label="Ouvrir la destination ' + name + '">' +
    '<div class="absolute top-3 left-3 z-10"><span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-[.12em] shadow-sm" style="background:var(--blue);color:#fff"><i class="ph-bold ph-folders"></i> Destination</span></div>' +
    '<div class="relative overflow-hidden flex items-center justify-center" style="height:15rem;border-radius:1.5rem 1.5rem 0 0;background:linear-gradient(135deg,rgba(0,87,184,.14),rgba(255,199,138,.20))">' +
      '<div class="text-center px-6">' +
        '<div class="mx-auto mb-4 flex items-center justify-center rounded-2xl" style="width:4.75rem;height:4.75rem;background:rgba(255,255,255,.82);box-shadow:0 8px 20px rgba(0,0,0,.10);font-size:1.75rem">' + flagImg(f.icon || '📁') + '</div>' +
        '<div class="text-xs font-black uppercase tracking-[.18em]" style="color:var(--blue)">Sous-dossier</div>' +
      '</div>' +
    '</div>' +
    '<div class="p-5">' +
      '<h3 class="font-display font-bold text-lg leading-snug mb-2" style="color:var(--ink)"><i class="ph-bold ph-folder-notch" style="color:var(--blue);font-size:.95em"></i> ' + name + '</h3>' +
      '<p class="text-sm leading-relaxed mb-4" style="color:var(--ink-muted)">Ouvrir cette destination et voir ses voyages.</p>' +
      '<span class="inline-flex items-center gap-1.5 text-sm font-semibold" style="color:var(--blue)">Ouvrir <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg></span>' +
    '</div>' +
  '</article>';
}

function renderAdminFolderActions(activeFolder){
  if(!IS_ADMIN||!activeFolder) return '';
  const parentHint=activeFolder.parent_id
    ? 'Ce sous-dossier recevra les nouveaux voyages et sous-dossiers.'
    : 'Créez directement un voyage ou un sous-dossier dans cette destination.';
  const folderName = safeText(activeFolder.name || '');
  const editorUrl = '/admin/editor?folder=' + encodeURIComponent(activeFolder.slug || '');

  return '<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">'+
    '<div class="rounded-[1.75rem] px-5 py-5 sm:px-7 sm:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5" style="background:rgba(0,87,184,.07);border:1px solid rgba(0,87,184,.16)">'+
      '<div class="flex items-center gap-4">'+
        '<div class="flex-shrink-0 flex items-center justify-center rounded-2xl" style="width:3rem;height:3rem;background:rgba(255,255,255,.75);font-size:1.35rem">'+flagImg(activeFolder.icon||'')+'</div>'+
        '<div>'+
          '<div class="text-xs font-black uppercase tracking-[.18em] mb-0.5" style="color:var(--blue)"><i class="ph-fill ph-shield-check"></i> Mode admin</div>'+
          '<div class="font-display text-xl font-bold" style="color:var(--ink)">'+folderName+'</div>'+
          '<p class="text-sm mt-0.5" style="color:var(--ink-muted)">'+parentHint+'</p>'+
        '</div>'+
      '</div>'+
      '<div class="flex flex-wrap gap-2.5 sm:flex-shrink-0">'+
        '<a href="' + safeAttr(editorUrl) + '" class="action-btn-sm"><i class="ph-bold ph-plus-circle"></i> Nouveau voyage</a>'+
        '<button type="button" class="subtle-btn" data-folder-id="' + activeFolder.id + '" data-folder-name="' + safeAttr(activeFolder.name || '') + '"><i class="ph-bold ph-folder-plus"></i> Nouveau sous-dossier</button>'+
      '</div>'+
    '</div>'+
  '</div>';
}

let _pubFolderParentId=null;
function openPublicFolderModal(parentId,parentName){
  _pubFolderParentId=parentId;
  const sub=document.getElementById('pfm-sub');
  if(sub) sub.textContent=parentName?('Dans « '+parentName+' »'):'';
  const input=document.getElementById('pfm-name');
  if(input) input.value='';
  document.getElementById('pub-folder-modal').classList.remove('hidden');
  setTimeout(()=>input&&input.focus(),50);
}
function closePublicFolderModal(){
  document.getElementById('pub-folder-modal').classList.add('hidden');
}
async function submitPublicFolder(){
  const input=document.getElementById('pfm-name');
  const trimmed=(input?.value||'').trim();
  if(!trimmed){toast('Nom requis','err');input&&input.focus();return;}
  const res=await fetch('/api/folders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:trimmed,icon:'📁',parent_id:_pubFolderParentId})}).catch(()=>null);
  const data=await res?.json().catch(()=>null);
  if(!res||!res.ok){toast((data&&data.error)||'Erreur de création','err');return;}
  closePublicFolderModal();
  toast('Sous-dossier créé !','ok');
  location.href='/voyages?folder='+encodeURIComponent(data.slug||'');
}

let _voyFetchFailed=false;
function _voyFetch(url,fallback){
  return fetch(url).then(r=>{if(!r.ok)throw new Error('http');return r.json();}).catch(()=>{_voyFetchFailed=true;return fallback;});
}
function showVoyErrorBanner(){
  if(document.getElementById('voy-error-banner'))return;
  const b=document.createElement('div');
  b.id='voy-error-banner';
  b.setAttribute('role','alert');
  b.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:1.25rem;z-index:120;display:flex;align-items:center;gap:.6rem;background:var(--cream);border:1px solid rgba(220,60,60,.35);color:#b91c1c;padding:.7rem 1.1rem;border-radius:999px;box-shadow:0 8px 28px rgba(26,43,60,.14);font-size:.85rem;font-weight:600';
  b.innerHTML='<i class="ph-fill ph-warning-circle" style="font-size:1.1rem"></i> Impossible de charger le contenu, réessayez.';
  document.body.appendChild(b);
}
const SORT_OPTIONS=['date_desc','date_asc','views_desc','title_asc'];
const SORT_LABELS={date_desc:'Plus récents',date_asc:'Plus anciens',views_desc:'Les plus lus',title_asc:'Titre (A→Z)'};
async function init(){
  const params=new URLSearchParams(location.search);
  const folder=params.get('folder');
  const sort=SORT_OPTIONS.includes(params.get('sort'))?params.get('sort'):'date_desc';
  const sortLbl=document.getElementById('sort-label');
  if(sortLbl) sortLbl.textContent=SORT_LABELS[sort];
  const qs=new URLSearchParams();
  if(folder) qs.set('folder',folder);
  if(sort!=='date_desc') qs.set('sort',sort);
  // The API defaults to 20 per page (its normal listing-endpoint cap) - this
  // page has no pagination UI and is meant to show the whole carnet de
  // voyage, so ask for the API's max (50) explicitly. A handful of trips a
  // year means the real count won't outgrow that for a very long time.
  qs.set('limit','50');
  const [folders,artData]=await Promise.all([
    _voyFetch('/api/folders',[]),
    _voyFetch('/api/articles'+(qs.toString()?'?'+qs.toString():''),{articles:[],total:0}),
  ]);
  const activeF=folder?folders.find(f=>f.slug===folder):null;
  // Walk the FULL ancestor chain (not just one level up) so folders nested
  // 3+ levels deep still get a correct breadcrumb/parent - a folder tree of
  // arbitrary depth can already be created via the admin UI.
  const ancestorsOf=(f)=>{
    const chain=[];
    let cur=f?.parent_id?folders.find(x=>x.id===f.parent_id):null;
    const seen=new Set();
    while(cur && !seen.has(cur.id)){
      chain.unshift(cur);
      seen.add(cur.id);
      cur=cur.parent_id?folders.find(x=>x.id===cur.parent_id):null;
    }
    return chain;
  };
  const ancestors=activeF?ancestorsOf(activeF):[];
  const parentF=ancestors.length?ancestors[ancestors.length-1]:null;
  const rootF=ancestors.length?ancestors[0]:activeF;
  const totalCount=(artData.total??artData.articles.length);
  const plural=totalCount!==1?'s':'';

  // Title reflects the active folder; badge is a short itinerary count only
  // (the destination is already named in the title + breadcrumb above it).
  const titleEl=document.getElementById('voyages-title');
  if(titleEl){
    titleEl.innerHTML=activeF
      ? flagImg(activeF.icon||'')+' '+safeText(activeF.name||'')
      : 'Tous nos voyages';
  }
  document.getElementById('subtitle').textContent=totalCount+' itinéraire'+plural+' documenté'+plural;

  // Fil d'ariane (dans le hero, palette blanche translucide)
  const bc=document.getElementById('breadcrumb');
  if(bc){
    if(activeF){
      const sep='<span class="mx-1" style="opacity:.5"><i class="ph-bold ph-caret-right"></i></span>';
      let crumbs='<a href="/voyages" style="color:rgba(255,255,255,.75);text-decoration:none;white-space:nowrap" class="hover:underline">Tous les voyages</a>';
      // Render one crumb per ancestor (root → immediate parent), then the
      // active folder as the non-clickable current crumb. Supports any
      // folder nesting depth, not just a single parent level.
      ancestors.forEach(f=>{
        const fSlug = safeAttr(f.slug || '');
        const fName = safeText(f.name || '');
        crumbs+=sep+'<a href="/voyages?folder=' + fSlug + '" style="color:rgba(255,255,255,.75);text-decoration:none;display:inline-flex;align-items:center;gap:.3rem;white-space:nowrap" class="hover:underline">'+flagImg(f.icon||'')+' '+fName+'</a>';
      });
      const activeName = safeText(activeF.name || '');
      crumbs+=sep+'<span style="color:#fff;font-weight:600;display:inline-flex;align-items:center;gap:.3rem;white-space:nowrap">'+flagImg(activeF.icon||'')+' '+activeName+'</span>';
      bc.innerHTML='<nav class="flex items-center flex-wrap gap-0.5 text-sm py-1" style="color:rgba(255,255,255,.75)">'+crumbs+'</nav>';
      bc.classList.remove('hidden');
    }else{
      bc.classList.add('hidden');
    }
  }
  const currentAdminBox=renderAdminFolderActions(activeF);
  if(currentAdminBox){
    const current=document.getElementById('folder-admin-box');
    if(current) current.remove();
    document.getElementById('filters').insertAdjacentHTML('beforebegin','<div id="folder-admin-box">'+currentAdminBox+'</div>');
  }

  const roots=folders.filter(f=>!f.parent_id);
  const kids=pid=>folders.filter(f=>f.parent_id===pid);
  const pill=(active,sub)=>{
    const base='inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm border-2 transition-all hover:-translate-y-0.5';
    if(active) return sub
      ? base+' text-white" style="background:var(--palm);border-color:var(--palm);box-shadow:0 6px 18px rgba(var(--palm-rgb),.30)'
      : base+' text-white" style="background:var(--blue);border-color:var(--blue);box-shadow:0 6px 18px rgba(var(--blue-rgb),.30)';
    return base+' bg-white" style="border-color:var(--line);color:var(--ink-muted)';
  };
  let btns='<a href="/voyages" class="'+pill(!folder,false)+'"><i class="ph-bold ph-globe-hemisphere-west"></i> Tous</a>';
  roots.forEach(f=>{
    // Highlight the root pill whenever the active folder is this root itself
    // or anywhere in its subtree (any nesting depth), not just a direct child.
    const isActive=folder===f.slug||(rootF&&rootF.id===f.id);
    const fSlug = safeAttr(f.slug || '');
    const fName = safeText(f.name || '');
    btns+='<a href="/voyages?folder='+fSlug+'" class="'+pill(isActive,false)+'">'+flagImg(f.icon)+' '+fName+'</a>';
  });
  document.getElementById('filters').innerHTML=btns;
  const allViews = artData.articles.map(a => a.view_count || 0);
  const minV = Math.min(...allViews, 0);
  const maxV = Math.max(...allViews, 0);
  const childFolders=activeF ? kids(activeF.id) : [];
  const gridItems=[...childFolders.map(folderCard),...artData.articles.map(a=>card(a,minV,maxV))];
  document.getElementById('grid').innerHTML=gridItems.length
    ?gridItems.join('')
    :'<div class="col\\-span-3 text-center py-16 px-6">'
      +'<div class="mx-auto mb-5 flex items-center justify-center rounded-full" style="width:5rem;height:5rem;background:var(--blue-light);font-size:2.1rem">'
        +(activeF?flagImg(activeF.icon||''):'<i class="ph-bold ph-map-trifold" style="color:var(--blue)"></i>')
      +'</div>'
      +'<p class="text-xl font-semibold mb-1.5" style="color:var(--ink)">Pas encore posé nos valises ici…</p>'
      +'<p class="text-sm" style="color:var(--ink-light)">Ce coin du monde attend son premier récit.</p>'
    +'</div>';
  if(_voyFetchFailed) showVoyErrorBanner();

  // Event delegation for card clicks
  document.getElementById('grid').addEventListener('click', (e) => {
    const card = e.target.closest('[data-slug]');
    if (card) {
      const slug = card.getAttribute('data-slug');
      location.href = '/voyage/' + slug;
      return;
    }
    const folderCard = e.target.closest('[data-folder-slug]');
    if (folderCard) {
      const slug = folderCard.getAttribute('data-folder-slug');
      location.href = '/voyages?folder=' + slug;
    }
  });

  // Image fallback handler
  document.getElementById('grid').addEventListener('error', (e) => {
    const img = e.target.closest('img[data-fallback]');
    if (img && img.src !== img.dataset.fallback) {
      img.src = img.dataset.fallback;
    }
  }, true);

  document.getElementById('grid').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const card = e.target.closest('[data-slug]');
    if (card) {
      const slug = card.getAttribute('data-slug');
      location.href = '/voyage/' + slug;
      return;
    }
    const folderCard = e.target.closest('[data-folder-slug]');
    if (folderCard) {
      const slug = folderCard.getAttribute('data-folder-slug');
      location.href = '/voyages?folder=' + slug;
    }
  });

  // Event delegation for folder modal button
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-folder-id][data-folder-name]');
    if (btn) {
      const parentId = btn.getAttribute('data-folder-id');
      const parentName = btn.getAttribute('data-folder-name');
      openPublicFolderModal(parentId, parentName);
    }
  });
  // Submit the folder modal on Enter, close on Escape
  const pfmInput = document.getElementById('pfm-name');
  if (pfmInput) pfmInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submitPublicFolder(); }
    if (e.key === 'Escape') { e.preventDefault(); closePublicFolderModal(); }
  });
  document.querySelectorAll('.sort-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = new URLSearchParams(location.search);
      const val = btn.dataset.sort;
      if (val === 'date_desc') p.delete('sort'); else p.set('sort', val);
      location.search = p.toString();
    });
  });
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('sort-menu'), btn = document.getElementById('sort-btn');
    if (!menu || menu.classList.contains('hidden')) return;
    if (!e.target.closest('#sort-wrap')) { menu.classList.add('hidden'); btn?.setAttribute('aria-expanded','false'); }
  });
}
init();
</script>
</body></html>`);
}

// ── Server-side helpers for the voyage page ───────────────────
function flagImgSSR(icon) {
  if (!icon) return '';
  const cp = [...icon].map(c => c.codePointAt(0));
  if (cp.length >= 2 && cp[0] >= 0x1F1E6 && cp[0] <= 0x1F1FF && cp[1] >= 0x1F1E6 && cp[1] <= 0x1F1FF) {
    const code = [cp[0], cp[1]].map(c => String.fromCodePoint(c - 0x1F1E6 + 65)).join('').toLowerCase();
    return '<img src="https://flagcdn.com/w20/' + code + '.png" width="20" height="15" alt="' + code.toUpperCase() + '" style="vertical-align:middle;border-radius:2px;flex-shrink:0">';
  }
  return '<span>' + safeText(icon) + '</span>';
}
function fmtDateSSR(d) {
  try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return String(d || ''); }
}
function fmtDateRangeSSR(a) {
  const s = a.start_date || a.date, e = a.end_date || a.date;
  if (!s) return 'Dates non définies';
  return s === e ? fmtDateSSR(s) : fmtDateSSR(s) + ' - ' + fmtDateSSR(e);
}
// Ascending bars (like a signal-strength icon), not equal-sized round dots -
// a row of same-size filled/unfilled circles reads visually as carousel/
// pagination indicators ("swipe for more"), which is misleading here since
// there's nothing to page through. Bars of increasing height read instead as
// an intensity/level meter, matching what this actually represents.
function popularityBarsSSR(views) {
  const v = views || 0;
  const count = v === 0 ? 0 : v < 20 ? 1 : v < 100 ? 2 : v < 300 ? 3 : v < 800 ? 4 : 5;
  const heights = [5, 8, 11, 14, 17];
  let bars = '';
  for (let i = 0; i < 5; i++) {
    bars += '<span style="display:inline-block;width:3px;height:' + heights[i] + 'px;border-radius:1px;background:' + (i < count ? 'var(--blue)' : 'rgba(var(--ink-rgb),.12)') + '"></span>';
  }
  return '<span style="display:inline-flex;align-items:flex-end;gap:2px" aria-hidden="true">' + bars + '</span>';
}
function fmtCommentDate(d) {
  try { return new Date((d || '').replace(' ', 'T') + 'Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return String(d || ''); }
}

/** Turn a flat, chronologically-sorted list into roots with a `replies` array. */
function nestCommentsSSR(flat) {
  const byId = new Map(flat.map(c => [c.id, { ...c, replies: [] }]));
  const roots = [];
  for (const c of byId.values()) {
    if (c.parent_id && byId.has(c.parent_id)) {
      byId.get(c.parent_id).replies.push(c);
    } else {
      roots.push(c);
    }
  }
  return roots;
}

/** Render the comments list (server-side, indexable). */
function renderCommentsList(comments, isAdmin) {
  if (!comments || !comments.length) {
    return '<p id="comments-empty" class="text-sm" style="color:var(--ink-light)">Aucun commentaire pour le moment. Soyez le premier à réagir !</p>';
  }
  return comments.map(c => renderCommentItem(c, isAdmin)).join('');
}
function renderCommentItem(c, isAdmin) {
  const del = isAdmin
    ? `<button type="button" data-del-comment="${c.id}" class="ghost-btn" style="padding:.3rem .6rem;font-size:.72rem;color:var(--danger)" title="Supprimer ce commentaire"><i class="ph-bold ph-trash"></i></button>`
    : '';
  const adminBadge = c.is_admin_reply
    ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[.65rem] font-bold uppercase tracking-wide" style="background:var(--blue-light);color:var(--blue)"><i class="ph-fill ph-star"></i> Réponse de l'auteur</span>`
    : '';
  const replies = (c.replies && c.replies.length)
    ? `<div class="mt-3 ml-4 sm:ml-8 space-y-3" style="border-left:2px solid var(--line);padding-left:1rem">${c.replies.map(r => renderCommentItem(r, isAdmin)).join('')}</div>`
    : '';
  return `<article class="comment-item card-line rounded-2xl p-4 sm:p-5" style="scroll-margin-top:5rem" id="comment-${c.id}" data-comment-id="${c.id}">
    <div class="flex items-start justify-between gap-3 mb-1.5">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="inline-flex items-center justify-center rounded-full" style="width:2rem;height:2rem;background:var(--blue-light);color:var(--blue);font-weight:700;font-size:.8rem">${safeText((c.author_name || '?').trim().charAt(0).toUpperCase())}</span>
        <span class="font-bold text-sm" style="color:var(--ink)">${safeText(c.author_name)}</span>
        ${adminBadge}
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs" style="color:var(--ink-light)">${safeText(fmtCommentDate(c.created_at))}</span>
        ${del}
      </div>
    </div>
    <p class="text-sm sm:text-base leading-relaxed mb-2" style="color:var(--ink);white-space:pre-wrap;word-break:break-word">${safeText(c.body)}</p>
    <button type="button" data-reply-to="${c.id}" data-reply-name="${safeAttr(c.author_name)}" class="ghost-btn" style="padding:.3rem .6rem;font-size:.72rem"><i class="ph-bold ph-arrow-bend-up-left"></i> Répondre</button>
    <div class="reply-form-slot"></div>
    ${replies}
  </article>`;
}

async function voyagePage(env, slug, authed = false, origin = '') {
  // ── Fetch the article server-side ──────────────────────────
  const isNumericId = /^\d+$/.test(String(slug));
  const article = await env.DB.prepare(`
    SELECT a.*, f.name AS folder_name, f.icon AS folder_icon, f.slug AS folder_slug
    FROM articles a LEFT JOIN folders f ON f.id = a.folder_id
    WHERE ${isNumericId ? 'a.id = ?' : 'a.slug = ?'}
  `).bind(isNumericId ? parseInt(slug) : slug).first();

  // 404 (real HTTP 404, server-rendered)
  if (!article || (article.status !== 'published' && !authed)) {
    return html(`<!DOCTYPE html>
<html lang="fr">
<head>${HEAD('Voyage introuvable - Tranquille, on est en vacances')}</head>
<body class="font-sans antialiased" style="background:var(--cream)">
${NAV('', authed)}
<main class="pt-16">
  <div class="max-w-2xl mx-auto px-4 py-32 text-center">
    <i class="ph-bold ph-map-trifold" style="font-size:4rem;display:block;margin-bottom:1.5rem;color:var(--ink-light)"></i>
    <h1 class="font-display text-3xl font-bold mb-4" style="color:var(--ink)">Voyage introuvable</h1>
    <p class="mb-8" style="color:var(--ink-muted)">Ce voyage n'existe pas ou n'est pas encore publié.</p>
    <a href="/voyages" class="action-btn"><i class="ph-bold ph-arrow-left"></i> Retour aux voyages</a>
  </div>
</main>
${FOOTER}
${TOAST}
</body></html>`, 404);
  }

  const writingDays = (() => {
    try { const v = JSON.parse(article.writing_days || '[]'); return Array.isArray(v) ? v : []; }
    catch { return []; }
  })();

  // Photos + prev/next in parallel
  // Ordered by start_date, not the legacy `date` column - `date` has drifted
  // out of sync with start_date on many existing rows (bulk-import artifact).
  const [photosRes, prevRow, nextRow] = await Promise.all([
    env.DB.prepare('SELECT * FROM photos WHERE article_id = ? ORDER BY sort_order, id').bind(article.id).all(),
    // Previous = older article (earlier date). Next = newer article.
    // Tie-break on id as a final fallback: bulk imports can insert several
    // rows in the same transaction with identical (start_date, created_at),
    // which would otherwise make every article in that tie group silently
    // lose its prev/next links (both '<' comparisons on an equal created_at
    // are false).
    env.DB.prepare(`SELECT slug, title FROM articles a WHERE a.status='published' AND (a.start_date < ? OR (a.start_date = ? AND a.created_at < ?) OR (a.start_date = ? AND a.created_at = ? AND a.id < ?)) ORDER BY a.start_date DESC, a.created_at DESC, a.id DESC LIMIT 1`)
      .bind(article.start_date, article.start_date, article.created_at, article.start_date, article.created_at, article.id).first(),
    env.DB.prepare(`SELECT slug, title FROM articles a WHERE a.status='published' AND (a.start_date > ? OR (a.start_date = ? AND a.created_at > ?) OR (a.start_date = ? AND a.created_at = ? AND a.id > ?)) ORDER BY a.start_date ASC, a.created_at ASC, a.id ASC LIMIT 1`)
      .bind(article.start_date, article.start_date, article.created_at, article.start_date, article.created_at, article.id).first(),
  ]);
  const photos = (photosRes.results || []).map(p => ({ ...p, url: p.url, caption: p.caption || '' }));

  // Comments
  const commentsRes = await env.DB
    .prepare('SELECT id, parent_id, is_admin_reply, author_name, body, created_at FROM comments WHERE article_id = ? ORDER BY created_at ASC, id ASC')
    .bind(article.id).all();
  const flatComments = commentsRes.results || [];
  const comments = nestCommentsSSR(flatComments);

  // Build the combined photo list (gallery photos + inline images not already listed).
  // Compare via a normalized (decoded) URL so a gallery photo and the same
  // image referenced inline with different percent-encoding (e.g. a raw space
  // vs "%20") are recognized as the same photo instead of appearing twice.
  const normalizeUrl = (u) => { try { return decodeURI(u); } catch { return u; } };
  const inlineImgs = ssrExtractImages(article.content || '');
  const photoUrlSet = new Set(photos.map(p => normalizeUrl(p.url)));
  const allPhotos = [...photos, ...inlineImgs.filter(img => !photoUrlSet.has(normalizeUrl(img.url)))];

  const renderedContent = ssrVoyageContent(article.content || '', allPhotos);
  const galleryHtml = allPhotos.length ? ssrGallery(allPhotos) : '';
  const writingDaysHtml = ssrWritingDays(writingDays);
  const shortDesc = ssrStripMd(article.short_description);

  const metaDescription = shortDesc || `Récit de voyage : ${article.title}`;
  const pageTitle = `${article.title} - Tranquille, on est en vacances`;

  const folderBadge = article.folder_name
    ? `<div class="mb-3"><span class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full text-white" style="background:rgba(255,255,255,.18);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,.30)">${flagImgSSR(article.folder_icon || '')} ${safeText(article.folder_name)}</span></div>`
    : '';

  const prevNext = (prevRow || nextRow) ? `
    <nav class="pt-8 grid gap-3 sm:grid-cols-2" aria-label="Navigation entre voyages" style="border-top:1px solid var(--line);margin-top:1rem">
      ${prevRow ? `<a href="/voyage/${safeAttr(prevRow.slug)}" class="group card-line flex items-center gap-3 rounded-2xl p-4 bg-white transition-all hover:-translate-y-0.5">
        <i class="ph-bold ph-arrow-left flex-shrink-0" style="color:var(--blue);font-size:1.25rem"></i>
        <span class="min-w-0"><span class="block text-xs uppercase tracking-[.16em]" style="color:var(--ink-light)">Voyage précédent</span><span class="block font-semibold text-sm truncate" style="color:var(--ink)">${safeText(prevRow.title)}</span></span>
      </a>` : '<span></span>'}
      ${nextRow ? `<a href="/voyage/${safeAttr(nextRow.slug)}" class="group card-line flex items-center gap-3 rounded-2xl p-4 bg-white transition-all hover:-translate-y-0.5 sm:text-right sm:justify-end">
        <span class="min-w-0 sm:order-1"><span class="block text-xs uppercase tracking-[.16em]" style="color:var(--ink-light)">Voyage suivant</span><span class="block font-semibold text-sm truncate" style="color:var(--ink)">${safeText(nextRow.title)}</span></span>
        <i class="ph-bold ph-arrow-right flex-shrink-0 sm:order-2" style="color:var(--blue);font-size:1.25rem"></i>
      </a>` : '<span></span>'}
    </nav>` : '';

  // Comment gate question (public; answer is validated server-side only)
  const gateRow = await env.DB.prepare("SELECT value FROM site_settings WHERE key = 'comment_gate_question'").first();
  const gateQuestion = gateRow?.value || 'Quel est le nom du chat roux de la famille Potet ?';

  const commentsSection = `
    <section id="comments" class="mb-12" style="scroll-margin-top:5rem">
      <h2 class="font-display text-2xl sm:text-3xl font-bold mb-6" style="color:var(--ink)"><i class="ph-bold ph-chats-circle"></i> Commentaires <span id="comments-count" style="color:var(--ink-light);font-weight:400">(${flatComments.length})</span></h2>
      <div id="comments-list" class="space-y-3 mb-8">${renderCommentsList(comments, authed)}</div>
      <div class="panel rounded-[2rem] p-6 sm:p-8">
        <h3 class="font-bold text-base mb-4" style="color:var(--ink)"><i class="ph-bold ph-pencil-simple" style="color:var(--blue)"></i> Laisser un commentaire</h3>
        <form id="comment-form" class="space-y-4">
          <div>
            <label class="block text-xs font-bold mb-1.5 uppercase tracking-wide" style="color:var(--ink-muted)" for="c-name">Votre prénom / nom</label>
            <input type="text" id="c-name" name="author_name" maxlength="80" required placeholder="Ex: Camille" class="w-full border-2 rounded-xl px-4 py-2.5 text-sm" style="border-color:rgba(var(--blue-rgb),.18)">
          </div>
          <div>
            <label class="block text-xs font-bold mb-1.5 uppercase tracking-wide" style="color:var(--ink-muted)" for="c-body">Votre commentaire</label>
            <textarea id="c-body" name="body" rows="3" maxlength="2000" required placeholder="Partagez votre réaction, un souvenir, une question..." class="w-full border-2 rounded-xl px-4 py-2.5 text-sm resize-none" style="border-color:rgba(var(--blue-rgb),.18)"></textarea>
          </div>
          <div>
            <label class="block text-xs font-bold mb-1.5 uppercase tracking-wide" style="color:var(--ink-muted)" for="c-gate"><i class="ph-bold ph-shield-check" style="color:var(--palm)"></i> ${safeText(gateQuestion)}</label>
            <input type="text" id="c-gate" name="gate_answer" required autocomplete="off" placeholder="Votre réponse" class="w-full border-2 rounded-xl px-4 py-2.5 text-sm" style="border-color:rgba(var(--blue-rgb),.18)">
            <p class="text-xs mt-1" style="color:var(--ink-light)">Une petite question anti-spam pour vérifier que vous connaissez la famille.</p>
          </div>
          <p id="comment-error" class="hidden text-sm font-semibold" style="color:var(--danger)"></p>
          <div class="flex justify-end">
            <button type="submit" id="comment-submit" class="action-btn-sm"><i class="ph-bold ph-paper-plane-tilt"></i> Publier</button>
          </div>
        </form>
      </div>
    </section>`;

  const adminFabs = authed ? `
  <a href="/admin/editor/${article.id}" style="position:fixed;bottom:5rem;right:1.5rem;z-index:50;display:inline-flex;align-items:center;gap:.5rem;padding:.65rem 1.25rem;border-radius:999px;background:var(--blue);color:#fff;font-weight:700;font-size:.85rem;text-decoration:none;box-shadow:0 4px 18px rgba(var(--blue-rgb),.4)"><i class="ph-bold ph-pencil-simple" style="font-size:1.1rem"></i> Modifier</a>
  <a href="/admin/articles/${article.id}/print" target="_blank" style="position:fixed;bottom:5rem;right:calc(1.5rem + 130px + .75rem);z-index:50;display:inline-flex;align-items:center;gap:.5rem;padding:.65rem 1.25rem;border-radius:999px;background:rgba(var(--ink-rgb),.82);color:#fff;font-weight:700;font-size:.85rem;text-decoration:none;box-shadow:0 4px 18px rgba(0,0,0,.25);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.15)"><i class="ph-bold ph-export" style="font-size:1.1rem"></i> Exporter</a>` : '';

  // Recherche d'un mot-clé dans le texte de l'article (long récit de voyage) :
  // le bouton rond se transforme (morph animé) en barre de recherche au lieu
  // de faire apparaître un second élément superposé au premier - plus clair
  // visuellement que deux éléments indépendants qui se chevauchent.
  const inPageSearchWidget = `
  <style>
    #ipsearch-fields button:hover { background:var(--sand)!important; color:var(--ink)!important; }
    #ipsearch-input:focus { box-shadow:none!important; border-color:transparent!important; }
  </style>
  <div id="ipsearch-wrap" style="position:fixed;bottom:1.25rem;right:1.5rem;z-index:50;display:flex;justify-content:flex-end;max-width:calc(100vw - 2rem)">
    <div id="ipsearch-shell" class="panel" style="display:flex;align-items:center;width:3.1rem;height:3.1rem;border-radius:999px;box-shadow:0 4px 18px rgba(0,0,0,.15);max-width:calc(100vw - 2rem);overflow:hidden;transition:width .28s cubic-bezier(.4,0,.2,1),box-shadow .28s ease">
      <button type="button" id="ipsearch-toggle" aria-label="Rechercher dans le texte" title="Rechercher dans le texte" style="flex:none;display:inline-flex;align-items:center;justify-content:center;width:3.1rem;height:3.1rem;border-radius:999px;background:transparent;color:var(--blue);border:none;font-size:1.2rem;cursor:pointer;transition:opacity .15s ease,transform .15s ease,width .28s cubic-bezier(.4,0,.2,1)">
        <i class="ph-bold ph-magnifying-glass"></i>
      </button>
      <div id="ipsearch-fields" style="display:flex;align-items:center;gap:.15rem;flex:1;min-width:0;padding:0 .35rem 0 0;opacity:0;transform:translateX(6px);transition:opacity .15s ease,transform .15s ease">
        <input id="ipsearch-input" type="text" placeholder="Rechercher un mot..." autocomplete="off" style="border:none;outline:none;box-shadow:none;background:transparent;flex:1;min-width:0;width:min(46vw,12rem);font-size:.9rem;color:var(--ink);padding:0 0 0 .2rem">
        <span id="ipsearch-count" style="font-size:.78rem;color:var(--ink-muted);white-space:nowrap;padding:0 .3rem;flex:none">0/0</span>
        <span style="width:1px;height:1.3rem;background:var(--line);flex:none;margin:0 .1rem"></span>
        <button type="button" id="ipsearch-prev" aria-label="Occurrence précédente" style="flex:none;display:inline-flex;align-items:center;justify-content:center;width:1.9rem;height:1.9rem;border-radius:50%;background:transparent;border:none;color:var(--ink-muted);cursor:pointer;font-size:.9rem"><i class="ph-bold ph-caret-up"></i></button>
        <button type="button" id="ipsearch-next" aria-label="Occurrence suivante" style="flex:none;display:inline-flex;align-items:center;justify-content:center;width:1.9rem;height:1.9rem;border-radius:50%;background:transparent;border:none;color:var(--ink-muted);cursor:pointer;font-size:.9rem"><i class="ph-bold ph-caret-down"></i></button>
        <button type="button" id="ipsearch-close" aria-label="Fermer la recherche" style="flex:none;display:inline-flex;align-items:center;justify-content:center;width:1.9rem;height:1.9rem;border-radius:50%;background:transparent;border:none;color:var(--ink-muted);cursor:pointer;font-size:.9rem"><i class="ph-bold ph-x"></i></button>
      </div>
    </div>
  </div>`;

  const coverUrl = safeAttr(article.cover_url || '');
  // og:image/og:url must be absolute (social crawlers don't resolve relative
  // URLs). cover_url is stored root-relative (/r2/…); prefix the request
  // origin, or fall back to PUBLIC_URL for the rare caller with no origin.
  const base = (origin || env.PUBLIC_URL || '').replace(/\/$/, '');
  const rawCover = article.cover_url || '';
  const ogImage = rawCover
    ? safeAttr(/^https?:\/\//i.test(rawCover) ? rawCover : base + rawCover)
    : '';
  const canonicalUrl = base + '/voyage/' + article.slug;

  // schema.org BlogPosting - powers rich results (article card, date,
  // author) in Google search rather than a bare blue link.
  // Escape '<' so a title/description containing "</script>" can't break out
  // of the JSON-LD script tag (same class of issue as unescaped user content
  // in inline <script> anywhere else - JSON.stringify alone doesn't protect
  // against this since '<' is valid inside a JSON string).
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: metaDescription,
    image: ogImage || undefined,
    datePublished: article.start_date || article.created_at,
    dateModified: article.updated_at || article.start_date,
    author: { '@type': 'Organization', name: 'Famille Potet' },
    publisher: { '@type': 'Organization', name: 'Tranquille, on est en vacances' },
    mainEntityOfPage: canonicalUrl,
  }).replace(/</g, '\\u003c');

  return html(`<!DOCTYPE html>
<html lang="fr">
<head>${HEAD(pageTitle, metaDescription, { image: ogImage, url: canonicalUrl, type: 'article' })}
<script type="application/ld+json">${jsonLd}</script>
</head>
<body class="font-sans antialiased" style="background:var(--cream)">
${NAV('', authed)}
<main id="main" class="pt-16">
  <div class="hero-photo relative overflow-hidden" style="min-height:clamp(50vh,60vw,72vh);max-height:88vh">
    <img src="${coverUrl}" alt="${safeAttr(article.title)}" class="hero-photo-img" onerror="this.style.display='none'">
    <div class="hero-photo-overlay"></div>
    <div class="absolute bottom-0 left-0 right-0 pb-10 px-4 sm:px-6 lg:px-8" style="z-index:2">
      <div class="max-w-4xl mx-auto hero-anim" style="--d:0ms">
        ${folderBadge}
        <h1 class="font-display text-3xl sm:text-5xl font-bold text-white drop-shadow-lg leading-tight hero-anim" style="--d:80ms">${safeText(article.title)}</h1>
      </div>
    </div>
  </div>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
    <a href="/voyages" class="inline-flex items-center gap-2 font-semibold text-sm mb-8 hover:underline" style="color:var(--blue)">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>Retour aux voyages
    </a>
    <div class="panel rounded-[2rem] p-6 sm:p-8 mb-6">
      <div class="flex flex-wrap gap-2">
        <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style="background:var(--sand);color:var(--ink)"><i class="ph-bold ph-calendar-blank" style="color:var(--blue);flex-shrink:0"></i>${safeText(fmtDateRangeSSR(article))}</span>
        <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style="background:var(--sand);color:var(--ink)"><i class="ph-bold ph-map-pin" style="color:var(--blue);flex-shrink:0"></i>${safeText(article.destination)}</span>
        <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style="background:var(--sand);color:var(--ink)"><i class="ph-bold ph-camera" style="color:var(--blue);flex-shrink:0"></i>${allPhotos.length} photo${allPhotos.length !== 1 ? 's' : ''}</span>
        <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style="background:var(--sand);color:var(--ink)"><i class="ph-bold ph-eye" style="color:var(--blue);flex-shrink:0"></i>${article.view_count || 0} lecture${(article.view_count || 0) !== 1 ? 's' : ''}&ensp;${popularityBarsSSR(article.view_count || 0)}</span>
        <a href="#comments" data-scroll-comments class="subtle-btn text-sm" style="padding:.35rem .85rem"><i class="ph-bold ph-chat-circle-text"></i> Commenter${flatComments.length ? ` (${flatComments.length})` : ''}</a>
        <button data-share-btn class="subtle-btn text-sm" style="padding:.35rem .85rem"><i class="ph-bold ph-share-network"></i> Partager</button>
      </div>
    </div>
    <div class="panel rounded-[2rem] p-6 sm:p-8 mb-10" style="border-left:4px solid rgba(var(--blue-rgb),.22)">
      <p class="text-base sm:text-lg leading-relaxed font-medium italic" style="color:var(--ink-muted)">"${safeText(shortDesc)}"</p>
    </div>
    <div class="prose-vacation text-base sm:text-lg leading-relaxed mb-12" style="color:var(--ink)">${renderedContent}</div>
    ${writingDaysHtml}
    ${galleryHtml}
    ${commentsSection}
    <div class="pt-8 flex items-center justify-between" style="border-top:1px solid var(--line)">
      <a href="/voyages" class="inline-flex items-center gap-2 font-semibold text-sm hover:underline" style="color:var(--blue)">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>Tous les voyages
      </a>
      <button data-share-btn class="subtle-btn"><i class="ph-bold ph-share-network"></i> Partager</button>
    </div>
    ${prevNext}
  </div>
</main>
${adminFabs}
${inPageSearchWidget}
${FOOTER}
${TOAST}
${LIGHTBOX}
<script>
const ARTICLE_ID = ${JSON.stringify(article.id)};
const IS_ADMIN = ${JSON.stringify(authed)};
const GATE_QUESTION = ${JSON.stringify(gateQuestion)};
// Photo list for the lightbox (matches server-rendered data-photo-index order).
window.photos = ${JSON.stringify(allPhotos.map(p => ({ url: p.url, caption: p.caption || '' })))};

function share(){if(navigator.share)navigator.share({title:document.title,url:location.href}).catch(()=>{});else navigator.clipboard.writeText(location.href).then(()=>toast('Lien copié !','ok'))}

// ── View-count ping (once per session) ────────────────────────
(function(){
  const vk='viewed_'+ARTICLE_ID;
  if(!sessionStorage.getItem(vk)){
    sessionStorage.setItem(vk,'1');
    fetch('/api/articles/'+ARTICLE_ID+'/view',{method:'POST'}).catch(()=>{});
  }
})();

// ── Lightbox wiring (delegation over server-rendered images) ──
document.getElementById('main').addEventListener('click',(e)=>{
  const img=e.target.closest('img[data-gallery-index], img[data-photo-index], img[data-photo-url]');
  if(!img) return;
  if(img.dataset.galleryIndex!==undefined) openLightbox(window.photos, parseInt(img.dataset.galleryIndex));
  else if(img.dataset.photoIndex!==undefined) openLightbox(window.photos, parseInt(img.dataset.photoIndex));
  else if(img.dataset.photoUrl) openLightbox([{url:img.dataset.photoUrl, caption:img.dataset.photoCaption||''}],0);
});
document.querySelectorAll('button[data-share-btn]').forEach(b=>b.addEventListener('click',share));

// ── Recherche de mot-clé dans le texte de l'article ────────────
// Surligne les occurrences dans .prose-vacation (le récit peut être très
// long) et permet de naviguer entre elles sans dépendre du Ctrl+F natif
// du navigateur, qui n'est pas toujours disponible (PWA, in-app browsers).
(function(){
  const shell=document.getElementById('ipsearch-shell');
  const toggleBtn=document.getElementById('ipsearch-toggle');
  const fields=document.getElementById('ipsearch-fields');
  const input=document.getElementById('ipsearch-input');
  const countEl=document.getElementById('ipsearch-count');
  const prevBtn=document.getElementById('ipsearch-prev');
  const nextBtn=document.getElementById('ipsearch-next');
  const closeBtn=document.getElementById('ipsearch-close');
  const content=document.querySelector('.prose-vacation');
  if(!shell||!toggleBtn||!fields||!content) return;

  let marks=[];
  let current=-1;

  function clearMarks(){
    content.querySelectorAll('mark[data-ipsearch]').forEach(m=>{
      const parent=m.parentNode;
      parent.replaceChild(document.createTextNode(m.textContent),m);
      parent.normalize();
    });
    marks=[];
    current=-1;
  }

  function escRe(s){return s.replace(/[.*+?^\${}()|[\\]\\\\]/g,'\\\\\$&');}

  function runSearch(term){
    clearMarks();
    if(!term){ countEl.textContent='0/0'; return; }
    const re=new RegExp(escRe(term),'gi');
    const walker=document.createTreeWalker(content, NodeFilter.SHOW_TEXT, {
      acceptNode(node){
        if(!node.nodeValue||!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const tag=node.parentNode&&node.parentNode.nodeName;
        if(tag==='SCRIPT'||tag==='STYLE') return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const textNodes=[];
    let n; while((n=walker.nextNode())) textNodes.push(n);
    textNodes.forEach(node=>{
      const text=node.nodeValue;
      re.lastIndex=0;
      if(!re.test(text)) return;
      re.lastIndex=0;
      const frag=document.createDocumentFragment();
      let lastIndex=0, m;
      while((m=re.exec(text))){
        if(m.index>lastIndex) frag.appendChild(document.createTextNode(text.slice(lastIndex,m.index)));
        const mark=document.createElement('mark');
        mark.setAttribute('data-ipsearch','1');
        mark.style.cssText='background:rgba(255,199,138,.55);color:inherit;border-radius:.2em;padding:0 .05em';
        mark.textContent=m[0];
        frag.appendChild(mark);
        lastIndex=m.index+m[0].length;
        if(m.index===re.lastIndex) re.lastIndex++;
      }
      if(lastIndex<text.length) frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      node.parentNode.replaceChild(frag,node);
    });
    marks=Array.from(content.querySelectorAll('mark[data-ipsearch]'));
    current=marks.length?0:-1;
    updateCount();
    if(current>=0) focusCurrent();
  }

  function updateCount(){
    countEl.textContent=(marks.length?current+1:0)+'/'+marks.length;
  }

  function focusCurrent(){
    marks.forEach((m,i)=>{ m.style.background = i===current ? 'rgba(255,199,138,1)' : 'rgba(255,199,138,.55)'; });
    const m=marks[current];
    if(m) m.scrollIntoView({block:'center', behavior:'smooth'});
  }

  function goTo(delta){
    if(!marks.length) return;
    current=(current+delta+marks.length)%marks.length;
    updateCount();
    focusCurrent();
  }

  const CLOSED_WIDTH_PX=3.1*16;
  let isOpen=false;
  function openBar(){
    if(isOpen) return;
    isOpen=true;
    // Largeur cible du "shell" une fois ouvert : celle du bouton rond (déjà
    // appliquée) + la largeur naturelle du bloc de champs. "fields" est un
    // enfant flex (flex:1;min-width:0) dont la largeur en place dépend de
    // celle, encore contrainte, du parent - on la mesure donc hors flux
    // (position:absolute, flex/min-width neutralisés) pour obtenir sa vraie
    // largeur de contenu avant de lancer la transition.
    fields.style.position='absolute';
    fields.style.visibility='hidden';
    fields.style.flex='none';
    fields.style.minWidth='0';
    fields.style.width='auto';
    const fieldsWidth=fields.scrollWidth;
    fields.style.position='';
    fields.style.visibility='';
    fields.style.flex='';
    fields.style.minWidth='';
    fields.style.width='';
    shell.style.width=(CLOSED_WIDTH_PX + fieldsWidth)+'px';
    toggleBtn.style.pointerEvents='none';
    fields.style.opacity='1';
    fields.style.transform='translateX(0)';
    setTimeout(()=>input.focus(),280);
  }
  function closeBar(){
    if(!isOpen) return;
    isOpen=false;
    // Revenir explicitement à la largeur du bouton rond fermé : un simple
    // style.width='' retombe sur "auto" (rien ne fixe plus 3.1rem une fois
    // l'inline style posé par openBar() effacé), donc le panneau ne se
    // repliait jamais visuellement.
    shell.style.width=CLOSED_WIDTH_PX+'px';
    toggleBtn.style.pointerEvents='';
    fields.style.opacity='0';
    fields.style.transform='translateX(6px)';
    clearMarks();
    countEl.textContent='0/0';
    input.value='';
    toggleBtn.focus();
  }

  toggleBtn.addEventListener('click',openBar);
  closeBtn.addEventListener('click',closeBar);
  input.addEventListener('input',()=>runSearch(input.value.trim()));
  input.addEventListener('keydown',(e)=>{
    if(e.key==='Enter'){ e.preventDefault(); goTo(e.shiftKey?-1:1); }
    else if(e.key==='Escape'){ closeBar(); }
  });
  prevBtn.addEventListener('click',()=>goTo(-1));
  nextBtn.addEventListener('click',()=>goTo(1));
})();

// ── Comment form (progressive enhancement) ────────────────────
function _escC(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function fmtCDate(d){try{return new Date((d||'').replace(' ','T')+'Z').toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}catch(e){return d||''}}
function buildCommentEl(c){
  const wrap=document.createElement('article');
  wrap.className='comment-item card-line rounded-2xl p-4 sm:p-5';
  wrap.style.cssText='scroll-margin-top:5rem';
  wrap.id='comment-'+c.id;
  wrap.setAttribute('data-comment-id', c.id);
  const initial=((c.author_name||'?').trim().charAt(0)||'?').toUpperCase();
  const del=IS_ADMIN?'<button type="button" data-del-comment="'+c.id+'" class="ghost-btn" style="padding:.3rem .6rem;font-size:.72rem;color:var(--danger)" title="Supprimer ce commentaire"><i class="ph-bold ph-trash"></i></button>':'';
  const badge=c.is_admin_reply?'<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[.65rem] font-bold uppercase tracking-wide" style="background:var(--blue-light);color:var(--blue)"><i class="ph-fill ph-star"></i> Réponse de l\\'auteur</span>':'';
  wrap.innerHTML='<div class="flex items-start justify-between gap-3 mb-1.5">'+
    '<div class="flex items-center gap-2 flex-wrap"><span class="inline-flex items-center justify-center rounded-full" style="width:2rem;height:2rem;background:var(--blue-light);color:var(--blue);font-weight:700;font-size:.8rem">'+_escC(initial)+'</span>'+
    '<span class="font-bold text-sm" style="color:var(--ink)">'+_escC(c.author_name)+'</span>'+badge+'</div>'+
    '<div class="flex items-center gap-2"><span class="text-xs" style="color:var(--ink-light)">'+_escC(fmtCDate(c.created_at))+'</span>'+del+'</div></div>'+
    '<p class="text-sm sm:text-base leading-relaxed mb-2" style="color:var(--ink);white-space:pre-wrap;word-break:break-word">'+_escC(c.body)+'</p>'+
    '<button type="button" data-reply-to="'+c.id+'" data-reply-name="'+_escC(c.author_name)+'" class="ghost-btn" style="padding:.3rem .6rem;font-size:.72rem"><i class="ph-bold ph-arrow-bend-up-left"></i> Répondre</button>'+
    '<div class="reply-form-slot"></div>';
  return wrap;
}
function buildReplyForm(parentId, parentName){
  const div=document.createElement('div');
  div.className='reply-form mt-3 p-4 rounded-xl';
  div.style.cssText='background:var(--sand-light,rgba(0,0,0,.02));border:1px solid var(--line)';
  div.innerHTML=
    '<p class="text-xs font-semibold mb-2" style="color:var(--ink-muted)">Répondre à '+_escC(parentName)+'</p>'+
    '<input type="text" class="reply-name w-full border-2 rounded-xl px-3 py-2 text-sm mb-2" placeholder="Votre prénom / nom" style="border-color:rgba(var(--blue-rgb),.18)">'+
    '<textarea class="reply-body w-full border-2 rounded-xl px-3 py-2 text-sm resize-none mb-2" rows="2" placeholder="Votre réponse..." style="border-color:rgba(var(--blue-rgb),.18)"></textarea>'+
    '<input type="text" class="reply-gate w-full border-2 rounded-xl px-3 py-2 text-sm mb-2" autocomplete="off" placeholder="'+_escC(GATE_QUESTION)+'" style="border-color:rgba(var(--blue-rgb),.18)">'+
    '<p class="reply-error hidden text-xs font-semibold mb-2" style="color:var(--danger)"></p>'+
    '<div class="flex justify-end gap-2">'+
    '<button type="button" class="reply-cancel ghost-btn" style="padding:.4rem .8rem;font-size:.75rem">Annuler</button>'+
    '<button type="button" class="reply-submit action-btn-sm" style="padding:.4rem .9rem;font-size:.75rem" data-parent-id="'+parentId+'"><i class="ph-bold ph-paper-plane-tilt"></i> Répondre</button>'+
    '</div>';
  return div;
}
async function submitComment({author_name, body, gate_answer, parent_id}){
  const payload={author_name, body, gate_answer};
  if(parent_id!=null) payload.parent_id=parent_id;
  const res=await fetch('/api/articles/'+ARTICLE_ID+'/comments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).catch(()=>null);
  const data=await res?.json().catch(()=>null);
  return {ok: !!(res&&res.ok), data};
}
const _cform=document.getElementById('comment-form');
if(_cform){
  _cform.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const errEl=document.getElementById('comment-error');
    const btn=document.getElementById('comment-submit');
    errEl.classList.add('hidden');
    const author_name=document.getElementById('c-name').value.trim();
    const body=document.getElementById('c-body').value.trim();
    const gate_answer=document.getElementById('c-gate').value.trim();
    if(!author_name||!body||!gate_answer){
      errEl.textContent='Merci de remplir tous les champs.'; errEl.classList.remove('hidden'); return;
    }
    btn.disabled=true;
    const {ok, data}=await submitComment({author_name, body, gate_answer});
    btn.disabled=false;
    if(!ok){
      errEl.textContent=(data&&data.error)||'Impossible de publier le commentaire.'; errEl.classList.remove('hidden'); return;
    }
    // Success: append the new comment, reset form
    const list=document.getElementById('comments-list');
    const empty=document.getElementById('comments-empty');
    if(empty) empty.remove();
    list.appendChild(buildCommentEl(data.comment));
    const cnt=document.getElementById('comments-count');
    if(cnt) cnt.textContent='('+list.querySelectorAll('.comment-item').length+')';
    document.getElementById('c-body').value='';
    document.getElementById('c-gate').value='';
    toast('Commentaire publié !','ok');
  });
}
// Reply / delete (delegation, works for both root comments and nested replies)
document.getElementById('comments')?.addEventListener('click', async (e)=>{
  const delBtn=e.target.closest('[data-del-comment]');
  if(delBtn){
    if(!confirm('Supprimer ce commentaire ?')) return;
    const id=delBtn.getAttribute('data-del-comment');
    const res=await fetch('/api/comments/'+id,{method:'DELETE'}).catch(()=>null);
    if(res&&res.ok){
      const item=delBtn.closest('.comment-item');
      item.remove(); // also removes nested reply elements (children of this node)
      const list=document.getElementById('comments-list');
      const cnt=document.getElementById('comments-count');
      if(cnt) cnt.textContent='('+list.querySelectorAll('.comment-item').length+')';
      if(!list.querySelector('.comment-item')) list.innerHTML='<p id="comments-empty" class="text-sm" style="color:var(--ink-light)">Aucun commentaire pour le moment. Soyez le premier à réagir !</p>';
      toast('Commentaire supprimé','ok');
    } else toast('Erreur','err');
    return;
  }

  const replyBtn=e.target.closest('[data-reply-to]');
  if(replyBtn){
    const item=replyBtn.closest('.comment-item');
    const slot=item.querySelector(':scope > .reply-form-slot');
    if(slot.querySelector('.reply-form')){ slot.innerHTML=''; return; } // toggle off
    slot.innerHTML='';
    slot.appendChild(buildReplyForm(replyBtn.dataset.replyTo, replyBtn.dataset.replyName));
    slot.querySelector('.reply-name')?.focus();
    return;
  }

  const cancelBtn=e.target.closest('.reply-cancel');
  if(cancelBtn){ cancelBtn.closest('.reply-form-slot').innerHTML=''; return; }

  const submitBtn=e.target.closest('.reply-submit');
  if(submitBtn){
    const formEl=submitBtn.closest('.reply-form');
    const errEl=formEl.querySelector('.reply-error');
    const author_name=formEl.querySelector('.reply-name').value.trim();
    const body=formEl.querySelector('.reply-body').value.trim();
    const gate_answer=formEl.querySelector('.reply-gate').value.trim();
    errEl.classList.add('hidden');
    if(!author_name||!body||!gate_answer){
      errEl.textContent='Merci de remplir tous les champs.'; errEl.classList.remove('hidden'); return;
    }
    submitBtn.disabled=true;
    const {ok, data}=await submitComment({author_name, body, gate_answer, parent_id:submitBtn.dataset.parentId});
    submitBtn.disabled=false;
    if(!ok){
      errEl.textContent=(data&&data.error)||'Impossible de publier la réponse.'; errEl.classList.remove('hidden'); return;
    }
    // Nest visually under the thread ROOT (matches server-side flattening).
    const rootId=data.comment.parent_id||data.comment.id;
    const rootItem=document.getElementById('comment-'+rootId);
    let repliesWrap=rootItem?.querySelector(':scope > .replies-wrap');
    if(rootItem && !repliesWrap){
      repliesWrap=document.createElement('div');
      repliesWrap.className='replies-wrap mt-3 ml-4 sm:ml-8 space-y-3';
      repliesWrap.style.cssText='border-left:2px solid var(--line);padding-left:1rem';
      rootItem.appendChild(repliesWrap);
    }
    repliesWrap?.appendChild(buildCommentEl(data.comment));
    formEl.closest('.reply-form-slot').innerHTML='';
    const cnt=document.getElementById('comments-count');
    const list=document.getElementById('comments-list');
    if(cnt) cnt.textContent='('+list.querySelectorAll('.comment-item').length+')';
    toast('Réponse publiée !','ok');
  }
});
// "Commenter" button: lazy-loaded images above the comments section have zero
// height until scrolled into view, so a plain #comments anchor jumps short and
// lands mid-article. Force every image to load, wait for them (with a cap),
// then scroll - re-scrolling once heights settle so we land on the section.
document.querySelector('[data-scroll-comments]')?.addEventListener('click', (e)=>{
  e.preventDefault();
  const target=document.getElementById('comments');
  if(!target) return;
  const imgs=[...document.querySelectorAll('#article-body img, main img')].filter(im=>!im.complete);
  imgs.forEach(im=>{ im.loading='eager'; if(im.dataset.src && !im.src) im.src=im.dataset.src; });
  const doScroll=()=>target.scrollIntoView({behavior:'smooth', block:'start'});
  doScroll();
  if(imgs.length){
    let done=0; const finish=()=>{ if(++done>=imgs.length) setTimeout(doScroll,80); };
    imgs.forEach(im=>{ im.addEventListener('load',finish,{once:true}); im.addEventListener('error',finish,{once:true}); });
    setTimeout(doScroll, 1200); // hard fallback if some image never loads
  }
});
// Deep-link: /voyage/slug#comment-123 highlights and scrolls to that comment
(function(){
  const hash=location.hash;
  if(hash && hash.indexOf('#comment-')===0){
    const target=document.querySelector(hash);
    if(target){
      setTimeout(()=>{
        target.scrollIntoView({behavior:'smooth', block:'center'});
        target.style.transition='background-color .3s ease';
        target.style.backgroundColor='var(--blue-light)';
        setTimeout(()=>{ target.style.backgroundColor=''; }, 2200);
      }, 100);
    }
  }
})();
</script>
</body></html>`);
}

// ──────────────────────────────────────────────────────────────
// SEO: robots.txt, sitemap.xml, RSS feed
// ──────────────────────────────────────────────────────────────
function robotsTxt() {
  const body = `User-agent: *
Allow: /
Disallow: /admin/

Sitemap: ${SITE_URL}/sitemap.xml
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}

// XML doesn't have HTML's entity set (no &nbsp;, &eacute;, ...) - only these
// five characters are special and must be escaped in element text/attributes.
function xmlEsc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

async function sitemapXml(env) {
  const { results } = await env.DB
    .prepare("SELECT slug, updated_at, start_date FROM articles WHERE status = 'published' ORDER BY start_date DESC")
    .all();

  const staticUrls = [
    { loc: '/', priority: '1.0' },
    { loc: '/voyages', priority: '0.8' },
    { loc: '/creer-mon-carnet', priority: '0.5' },
  ];
  const articleUrls = (results || []).map(a => ({
    loc: '/voyage/' + a.slug,
    lastmod: (a.updated_at || a.start_date || '').slice(0, 10),
    priority: '0.6',
  }));

  const entries = [...staticUrls, ...articleUrls].map(u => `  <url>
    <loc>${xmlEsc(SITE_URL + u.loc)}</loc>
    ${u.lastmod ? `<lastmod>${xmlEsc(u.lastmod)}</lastmod>` : ''}
    <priority>${u.priority}</priority>
  </url>`).join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}

async function rssFeed(env) {
  const { results } = await env.DB
    .prepare("SELECT title, slug, short_description, cover_url, start_date, updated_at FROM articles WHERE status = 'published' ORDER BY start_date DESC LIMIT 30")
    .all();

  const items = (results || []).map(a => {
    const link = SITE_URL + '/voyage/' + a.slug;
    const pubDate = a.start_date ? new Date(a.start_date + 'T12:00:00Z').toUTCString() : '';
    return `  <item>
    <title>${xmlEsc(a.title)}</title>
    <link>${xmlEsc(link)}</link>
    <guid isPermaLink="true">${xmlEsc(link)}</guid>
    ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ''}
    <description>${xmlEsc(a.short_description || '')}</description>
  </item>`;
  }).join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Tranquille, on est en vacances</title>
  <link>${xmlEsc(SITE_URL)}</link>
  <description>Le carnet de bord des voyages de la famille Potet</description>
  <language>fr-fr</language>
  <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${xmlEsc(SITE_URL + '/feed.xml')}" rel="self" type="application/rss+xml"/>
${items}
</channel>
</rss>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}

// ──────────────────────────────────────────────────────────────
// Main fetch handler
// ──────────────────────────────────────────────────────────────
// Styled 500 page - served when any SSR route throws (a DB timeout, a bad
// migration, an unhandled edge case) so a visitor gets a branded, navigable
// page instead of a raw Cloudflare stack trace. Never leaks the error detail.
function errorPage() {
  return html(`<!DOCTYPE html>
<html lang="fr">
<head>${HEAD('Une erreur est survenue - Tranquille, on est en vacances')}</head>
<body class="font-sans antialiased" style="background:var(--cream)">
${NAV('', false)}
<main class="pt-16">
  <div class="max-w-2xl mx-auto px-4 py-32 text-center">
    <i class="ph-bold ph-warning-circle" style="font-size:4rem;display:block;margin-bottom:1.5rem;color:var(--ink-light)"></i>
    <h1 class="font-display text-3xl font-bold mb-4" style="color:var(--ink)">Oups, une erreur est survenue</h1>
    <p class="mb-8" style="color:var(--ink-muted)">Quelque chose n'a pas fonctionné de notre côté. Réessayez dans un instant.</p>
    <a href="/" class="action-btn"><i class="ph-bold ph-house"></i> Retour à l'accueil</a>
  </div>
</main>
${FOOTER}
</body></html>`, 500);
}

export default {
  async fetch(request, env, ctx) {
    try {
      return await this.handle(request, env, ctx);
    } catch (err) {
      console.error('[fetch] unhandled error:', err && err.stack || err);
      // API requests get JSON; everything else gets the styled HTML page.
      const p = new URL(request.url).pathname;
      if (p.startsWith('/api/')) return json({ error: 'Erreur interne du serveur.' }, 500);
      return errorPage();
    }
  },

  async handle(request, env, ctx) {
    const url    = new URL(request.url);
    const path   = url.pathname;
    const method = request.method;

    // ── R2 photo proxy  (/r2/<key>) ───────────────────────────
    if (path.startsWith('/r2/')) {
      const key = path.slice(4); // strip leading '/r2/'
      return serveR2Object(env, key);
    }

    // ── SEO: robots.txt, sitemap.xml, RSS feed ─────────────────
    if (path === '/robots.txt') return robotsTxt();
    if (path === '/sitemap.xml') return sitemapXml(env);
    if (path === '/feed.xml' || path === '/rss.xml') return rssFeed(env);

    // ── Auth endpoints ────────────────────────────────────────
    if (path === '/admin/login' && method === 'POST') {
      const ip = clientKey(request);
      // 8 attempts per 15 minutes per IP - generous for a real admin who
      // mistypes a password, but stops an automated brute force from making
      // more than a handful of guesses before being locked out.
      const limit = await checkRateLimit(env.DB, 'login', ip, { max: 8, windowMinutes: 15 });
      if (limit.blocked) {
        return loginPage(`Trop de tentatives. Réessayez dans ${Math.ceil(limit.retryAfterSeconds / 60)} min.`);
      }

      const form = await request.formData().catch(() => null);
      const password = form?.get('password') || '';
      const account = await getAdminAccount(env.DB);

      // First-run: no password set yet → nothing to compare against.
      if (!account || !account.password_hash) {
        return loginPage('', true /* noPassword */);
      }
      const ok = await verifyPassword(password, account.password_hash);
      if (!ok) {
        await recordFailedAttempt(env.DB, 'login', ip);
        return loginPage('Mot de passe incorrect. Réessayez.');
      }
      await clearAttempts(env.DB, 'login', ip);
      const cookie = await issueSessionCookie(env.SESSION_SECRET);
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

    // ── Forgot password (public; body { email }) ──────────────
    if (path === '/admin/forgot-password' && method === 'POST') {
      // Throttle regardless of outcome so this can't be used to spam the
      // admin's inbox with reset emails, or (combined with response timing)
      // to probe for account existence at high volume.
      const ip = clientKey(request);
      const limit = await checkRateLimit(env.DB, 'forgot_password', ip, { max: 5, windowMinutes: 15 });
      if (limit.blocked) return json({ ok: true }); // same generic response either way

      const body = await request.json().catch(() => ({}));
      const email = cleanEmailInput(body.email);
      // Generic response regardless of match (don't leak account existence).
      if (email) {
        await recordFailedAttempt(env.DB, 'forgot_password', ip);
        const account = await getAdminByEmail(env.DB, email);
        if (account) {
          const result = await issueToken(env.DB, 'reset');
          // A still-valid token for a different purpose (e.g. a pending email
          // change) is left alone rather than silently invalidated - the
          // generic { ok: true } response is kept either way so this endpoint
          // still never reveals account existence or token state.
          if (!result.conflict) ctx.waitUntil(sendResetEmail(env, account.email, result.token));
        }
      }
      return json({ ok: true });
    }

    // ── Setup / Reset landing pages (choose new password) ─────
    if ((path === '/admin/setup' || path === '/admin/reset') && method === 'GET') {
      const mode = path === '/admin/setup' ? 'setup' : 'reset';
      const token = url.searchParams.get('token') || '';
      const row = await findByValidToken(env.DB, token, mode);
      return setPasswordPage(mode, token, !!row);
    }

    // ── Consume setup/reset token → set password → log in ─────
    if (path === '/admin/set-password' && method === 'POST') {
      // Same defense-in-depth as /admin/login: without this, the token could
      // be brute-forced by an automated client with no throttle at all.
      const ip = clientKey(request);
      const spLimit = await checkRateLimit(env.DB, 'set_password', ip, { max: 10, windowMinutes: 15 });
      if (spLimit.blocked) {
        return badRequest(`Trop de tentatives. Réessayez dans ${Math.ceil(spLimit.retryAfterSeconds / 60)} min.`);
      }

      const body = await request.json().catch(() => ({}));
      const token = String(body.token || '');
      const password = String(body.password || '');
      if (password.length < 8) {
        return badRequest('Le mot de passe doit contenir au moins 8 caractères.');
      }
      // A single token may be either 'setup' or 'reset'; accept whichever matches.
      const row =
        (await findByValidToken(env.DB, token, 'setup')) ||
        (await findByValidToken(env.DB, token, 'reset'));
      if (!row) {
        await recordFailedAttempt(env.DB, 'set_password', ip);
        return badRequest('Lien invalide ou expiré.');
      }
      const hash = await hashPassword(password);
      await env.DB
        .prepare(
          `UPDATE admin_account
           SET password_hash = ?, token = NULL, token_purpose = NULL,
               token_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
        )
        .bind(hash, row.id)
        .run();
      const cookie = await issueSessionCookie(env.SESSION_SECRET);
      return new Response(JSON.stringify({ ok: true, redirect: '/admin/dashboard' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Set-Cookie': cookie },
      });
    }

    // ── Confirm email change (requires an active admin session) ─
    if (path === '/admin/confirm-email' && method === 'GET') {
      const authed = await isAuthenticated(request, env.SESSION_SECRET);
      const token = url.searchParams.get('token') || '';
      if (!authed) {
        // The confirmation link proves inbox ownership, but we also require the
        // clicker to be logged in as admin. Send them to log in, then re-click.
        return confirmEmailPage('login');
      }
      const row = await findByValidToken(env.DB, token, 'email_change');
      if (!row || !row.pending_email) {
        return confirmEmailPage('invalid');
      }
      const newEmail = row.pending_email;
      await env.DB
        .prepare(
          `UPDATE admin_account
           SET email = ?, pending_email = NULL, token = NULL, token_purpose = NULL,
               token_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
        )
        .bind(newEmail, row.id)
        .run();
      return confirmEmailPage('ok', newEmail);
    }

    // ── Admin HTML pages (protected) ──────────────────────────
    if (path === '/admin' || path === '/admin/') {
      const authed = await isAuthenticated(request, env.SESSION_SECRET);
      if (authed) return redirect('/admin/dashboard');
      const account = await getAdminAccount(env.DB);
      const noPassword = !account || !account.password_hash;
      const resp = loginPage('', noPassword);
      try { resp.headers.set('Cache-Control', 'no-store, must-revalidate'); } catch {}
      return resp;
    }
    if (path.startsWith('/admin/')) {
      const authed = await isAuthenticated(request, env.SESSION_SECRET);
      if (!authed) {
        return new Response(null, { status: 302, headers: { Location: '/admin' } });
      }
      // Admin pages carry authenticated, user-specific state and must never be
      // served from any cache (browser back/forward, or a proxy). Tag every
      // HTML page response below with no-store.
      const noStore = (resp) => {
        try { resp.headers.set('Cache-Control', 'no-store, must-revalidate'); } catch {}
        return resp;
      };
      if (path === '/admin/dashboard') return noStore(dashboardPage());
      if (path === '/admin/editor')    return noStore(editorPage(null));
      const editorMatch = matchPath('/admin/editor/:id', path);
      if (editorMatch) return noStore(editorPage(parseInt(editorMatch.id)));
      const printMatch = matchPath('/admin/articles/:id/print', path);
      if (printMatch) {
        const art = await env.DB.prepare(
          'SELECT * FROM articles WHERE id = ?'
        ).bind(parseInt(printMatch.id)).first();
        if (!art) return notFound();
        art.publicUrl = env.PUBLIC_URL || '';
        return noStore(printPage(art));
      }
      const wordMatch = matchPath('/admin/articles/:id/export-word', path);
      if (wordMatch) {
        const art = await env.DB.prepare(
          'SELECT * FROM articles WHERE id = ?'
        ).bind(parseInt(wordMatch.id)).first();
        if (!art) return notFound();
        const docBuffer = await exportWordDocx(art, env);
        // Build a readable, filesystem-safe filename that keeps accents via
        // the RFC 5987 filename* form, with an ASCII fallback for old clients.
        const safeName = (art.title || 'export')
          .replace(/[\\/:*?"<>|]/g, '')   // strip characters illegal in filenames
          .replace(/\s+/g, ' ').trim().substring(0, 80);
        const asciiName = safeName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7e]/g, '') || 'export';
        return new Response(docBuffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${asciiName}.docx"; filename*=UTF-8''${encodeURIComponent(safeName)}.docx`,
          }
        });
      }
    }

    // ── API routes ────────────────────────────────────────────
    if (path.startsWith('/api/')) {
      const authed = await isAuthenticated(request, env.SESSION_SECRET);

      // Settings
      if (path === '/api/settings') {
        if (method === 'GET') return getSettings(env, authed);
        if (method === 'PUT') return authed ? updateSettings(request, env) : unauthorized();
      }
      if (path === '/api/settings/hero-image' && method === 'POST') {
        return authed ? uploadHeroImage(request, env) : unauthorized();
      }
      if (path === '/api/settings/hero-image' && method === 'DELETE') {
        return authed ? deleteHeroImage(env) : unauthorized();
      }

      // ── Admin account (all admin-only) ──────────────────────
      if (path === '/api/admin/account' && method === 'GET') {
        if (!authed) return unauthorized();
        const acc = await getAdminAccount(env.DB);
        // Only expose non-sensitive fields - never password_hash/token.
        return json({ email: acc?.email || '', pending_email: acc?.pending_email || null });
      }

      if (path === '/api/admin/change-password' && method === 'POST') {
        if (!authed) return unauthorized();
        // Defense in depth: a stolen session cookie shouldn't let an attacker
        // brute-force current_password with unlimited attempts.
        const cpIp = clientKey(request);
        const cpLimit = await checkRateLimit(env.DB, 'change_password', cpIp, { max: 8, windowMinutes: 15 });
        if (cpLimit.blocked) {
          return json({ error: `Trop de tentatives. Réessayez dans ${Math.ceil(cpLimit.retryAfterSeconds / 60)} min.` }, 429);
        }
        const body = await request.json().catch(() => ({}));
        const currentPassword = String(body.current_password || '');
        const newPassword = String(body.new_password || '');
        if (newPassword.length < 8) {
          return badRequest('Le nouveau mot de passe doit contenir au moins 8 caractères.');
        }
        const acc = await getAdminAccount(env.DB);
        // Re-auth: verify the current password even though a session exists.
        const ok = await verifyPassword(currentPassword, acc?.password_hash);
        if (!ok) {
          await recordFailedAttempt(env.DB, 'change_password', cpIp);
          return json({ error: 'Mot de passe actuel incorrect.' }, 403);
        }
        const hash = await hashPassword(newPassword);
        await env.DB
          .prepare('UPDATE admin_account SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .bind(hash, acc.id).run();
        // Courtesy notification to the account email (fire-and-forget).
        if (acc.email) ctx.waitUntil(sendPasswordChangedEmail(env, acc.email));
        return json({ ok: true });
      }

      if (path === '/api/admin/request-email-change' && method === 'POST') {
        if (!authed) return unauthorized();
        // Without a configured email provider, the confirmation link can
        // never be sent - starting the change anyway would leave
        // pending_email set with no way for the admin to ever confirm it.
        if (!(await isEmailConfigured(env))) {
          return badRequest("L'envoi d'emails n'est pas configuré. Configurez Mailjet dans l'onglet Emails avant de changer d'adresse.");
        }
        const body = await request.json().catch(() => ({}));
        const newEmail = cleanEmailInput(body.new_email);
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail)) {
          return badRequest('Adresse email invalide.');
        }
        const acc = await getAdminAccount(env.DB);
        const tokenResult = await issueToken(env.DB, 'email_change');
        if (tokenResult.conflict) {
          // A 'setup'/'reset' link is still live - issuing a new token here
          // would silently kill that pending request. Tell the admin plainly
          // instead of quietly discarding it (this used to happen with no
          // explanation beyond a later "invalid or expired link").
          const conflictLabel = { setup: 'de configuration initiale', reset: 'de réinitialisation de mot de passe' }[tokenResult.conflict] || tokenResult.conflict;
          return badRequest(`Une demande ${conflictLabel} est déjà en cours (lien envoyé il y a moins d'1h). Attendez son expiration ou utilisez-la d'abord avant de changer d'adresse.`);
        }
        await env.DB
          .prepare('UPDATE admin_account SET pending_email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .bind(newEmail, acc.id).run();
        // Awaited (not ctx.waitUntil) so the client learns immediately whether
        // the email actually went out, instead of a silent { ok: true } that
        // looked identical whether Resend accepted or rejected the send.
        const result = await sendEmailChangeEmail(env, newEmail, tokenResult.token);
        if (!result.ok) {
          return json({ ok: true, email_sent: false, email_error: result.error || 'Échec envoi email.' });
        }
        return json({ ok: true, email_sent: true });
      }

      // ── Emails tab: send history + Mailjet sender setup ──────
      if (path === '/api/admin/email-log' && method === 'GET') {
        if (!authed) return unauthorized();
        return listEmailLog(env);
      }
      if (path === '/api/admin/subscriber-email-log' && method === 'GET') {
        if (!authed) return unauthorized();
        return listSubscriberEmailLog(env);
      }
      if (path === '/api/admin/email-config') {
        if (!authed) return unauthorized();
        if (method === 'GET')  return getEmailConfigStatus(env);
        if (method === 'POST') return saveEmailConfig(request, env);
      }
      if (path === '/api/admin/email-config/check' && method === 'POST') {
        if (!authed) return unauthorized();
        return checkEmailSenderStatus(env);
      }
      if (path === '/api/admin/email-config/verify' && method === 'POST') {
        if (!authed) return unauthorized();
        return requestSenderVerification(env);
      }

      // Admin: list email subscribers / unsubscribe
      if (path === '/api/admin/email-subscribers' && method === 'GET') {
        if (!authed) return unauthorized();
        return listEmailSubscribersAdmin(env);
      }
      const subsMatch = matchPath('/api/admin/email-subscribers/:id', path);
      if (subsMatch && method === 'DELETE') {
        if (!authed) return unauthorized();
        return adminUnsubscribeById(request, env, parseInt(subsMatch.id));
      }

      // Admin: visits analytics dashboard
      if (path === '/api/admin/analytics' && method === 'GET') {
        if (!authed) return unauthorized();
        return getAnalytics(request, env);
      }

      // Admin: recent comments across site and reply
      if (path === '/api/admin/comments/recent' && method === 'GET') {
        if (!authed) return unauthorized();
        return listRecentCommentsAdmin(env);
      }
      const replyMatch = matchPath('/api/admin/comments/:id/reply', path);
      if (replyMatch && method === 'POST') {
        if (!authed) return unauthorized();
        return replyToComment(request, env, parseInt(replyMatch.id));
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

      // Comments on an article (accepts slug or numeric id)
      const commentsMatch = matchPath('/api/articles/:slug/comments', path);
      if (commentsMatch) {
        if (method === 'GET')  return listComments(env, commentsMatch.slug, authed);
        if (method === 'POST') return createComment(request, env, commentsMatch.slug, authed);
      }
      // Delete a single comment (admin only)
      const commentIdMatch = matchPath('/api/comments/:id', path);
      if (commentIdMatch && method === 'DELETE') {
        const cid = parseInt(commentIdMatch.id);
        return authed ? deleteComment(env, cid) : unauthorized();
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
      const viewMatch = matchPath('/api/articles/:id/view', path);
      if (viewMatch && method === 'POST') {
        const id = parseInt(viewMatch.id);
        return !isNaN(id) ? recordView(env, id, request, authed) : recordView(env, viewMatch.id, request, authed);
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
    const publicAuthed = await isAuthenticated(request, env.SESSION_SECRET);
    // Log page views for the analytics dashboard - skip the admin's own
    // browsing (publicAuthed) and bots, same filter as recordView() for
    // article pages. Fire-and-forget via waitUntil so it never delays the
    // response the visitor is waiting for. A per-browser visitor cookie lets
    // logPageView collapse repeat loads into one daily visit; set it on the
    // response so the next load carries it.
    let visitorSetCookie = null;
    if (!publicAuthed && !isBotUserAgent(request) && (path === '/' || path === '' || path === '/voyages')) {
      const visitor = ensureVisitorId(request);
      visitorSetCookie = visitor.setCookie;
      ctx.waitUntil(logPageView(env, request, { path: path || '/', visitorId: visitor.id }));
    }
    const withVisitorCookie = (resp) => {
      if (visitorSetCookie) resp.headers.append('Set-Cookie', visitorSetCookie);
      return resp;
    };
    if (path === '/' || path === '') return withVisitorCookie(homePage(publicAuthed));
    if (path === '/voyages')         return withVisitorCookie(voyagesPage(publicAuthed));
    const voyageMatch = matchPath('/voyage/:slug', path);
    if (voyageMatch) return voyagePage(env, voyageMatch.slug, publicAuthed, new URL(request.url).origin);
    if (path === '/creer-mon-carnet') {
      const contactRow = await env.DB.prepare("SELECT value FROM site_settings WHERE key = 'contact_email'").first();
      return showcasePage(publicAuthed, contactRow?.value);
    }

    // 404
    return html(`<!DOCTYPE html><html lang="fr"><head><title>404 - Page introuvable</title></head>
<body style="font-family:sans-serif;text-align:center;padding:4rem">
  <h1 style="font-size:3rem"><i class="ph-bold ph-map-trifold"></i></h1>
  <h2>Page introuvable</h2>
  <p><a href="/">< Retour à l'accueil</a></p>
</body></html>`, 404);
  },
};
