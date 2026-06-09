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

import { isAuthenticated, createSession, clearSession } from './auth.js';
import { matchPath, json, notFound, unauthorized, redirect, html } from './utils.js';
import { safeAttr, safeText } from './helpers/html.js';

// API handlers
import { listFolders, createFolder, updateFolder, deleteFolder } from './api/folders.js';
import { listArticles, getArticle, createArticle, updateArticle, patchArticleStatus, deleteArticle, recordView } from './api/articles.js';
import { uploadPhotos, deletePhoto, patchPhoto, uploadCover, uploadHeroImage, deleteHeroImage, serveR2Object } from './api/photos.js';
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

function voyagesPage(authed=false) {
  return html(`<!DOCTYPE html>
<html lang="fr">
<head>${HEAD('Voyages - Tranquille, on est en vacances')}</head>
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
  <!-- Fil d'ariane -->
  <div id="breadcrumb" class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-2 hidden"></div>
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
const IS_ADMIN=${JSON.stringify(authed)};
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function flagImg(icon){if(!icon)return '';const cp=[...icon].map(c=>c.codePointAt(0));if(cp.length>=2&&cp[0]>=0x1F1E6&&cp[0]<=0x1F1FF&&cp[1]>=0x1F1E6&&cp[1]<=0x1F1FF){const code=[cp[0],cp[1]].map(c=>String.fromCodePoint(c-0x1F1E6+65)).join('').toLowerCase();return '<img src="https://flagcdn.com/w20/'+code+'.png" width="20" height="15" alt="'+code.toUpperCase()+'" style="vertical-align:middle;border-radius:2px;flex-shrink:0">';}return '<span>'+icon+'</span>';}
function fmtDate(d){return new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}
function fmtDateRange(a){
  const s=a.start_date||a.date, e=a.end_date||a.date;
  if(!s) return 'Dates non définies';
  return s===e ? fmtDate(s) : fmtDate(s)+' – '+fmtDate(e);
}
function escAttr(s){return esc(s).replace(/'/g,'&#39;')}
function safeAttr(s){return(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function safeText(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function renderPopularityBars(views, minViews, maxViews) {
  const range = maxViews - minViews || 1;
  const count = Math.max(1, Math.ceil((views - minViews) / range * 5));
  let dots = '';
  for (let i = 0; i < 5; i++) {
    dots += '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:' + (i < count ? 'var(--blue)' : 'rgba(0,0,0,.10)') + '"></span>';
  }
  return '<div style="display:flex;align-items:center;gap:3px">' + dots + '<span style="font-size:.68rem;margin-left:4px;color:var(--ink-light);line-height:1">' + views + '</span></div>';
}
function statusMeta(status){
  if(status==='published') return {label:'Publie',icon:'ph-fill ph-check-circle',bg:'rgba(18,145,102,.92)',color:'#fff'};
  if(status==='publish_when_online') return {label:'En attente',icon:'ph ph-clock-countdown',bg:'rgba(217,119,6,.92)',color:'#fff'};
  return {label:'Archive',icon:'ph ph-archive',bg:'rgba(87,83,78,.9)',color:'#fff'};
}
function card(a, minViews=0, maxViews=0){
  const slug = safeAttr(a.slug || '');
  const title = safeText(a.title || '');
  const cover = safeAttr(a.cover_url || '');
  const dest = safeText(a.destination || '');
  const desc = safeText(a.short_description || '');
  const ariaLabel = safeText('Lire : ' + (a.title || ''));
  const popBars = renderPopularityBars(a.view_count || 0, minViews, maxViews);

  let eb='';
  if(IS_ADMIN){
    const editUrl = '/admin/editor/' + String(a.id);
    eb='<a href="' + safeAttr(editUrl) + '" onclick="event.stopPropagation()" style="position:absolute;top:.75rem;right:.75rem;z-index:5;display:inline-flex;align-items:center;gap:.35rem;padding:.3rem .75rem;border-radius:999px;font-size:.73rem;font-weight:700;background:rgba(0,87,184,.92);color:#fff;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,.25)"><i class="ph ph-pencil-simple"></i> Modifier</a>';
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

  return '<article class="voyage-card cursor-pointer group" style="position:relative" data-slug="' + slug + '" role="link" tabindex="0" aria-label="' + ariaLabel + '">' +
    eb +
    '<div class="relative overflow-hidden" style="height:15rem;border-radius:1.5rem 1.5rem 0 0">' +
      '<img src="' + cover + '" alt="' + title + '" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" data-fallback="https://picsum.photos/seed/' + a.id + 'x/800/600">' +
      folder +
      sb +
    '</div>' +
    '<div class="p-5">' +
      '<div class="flex flex-col gap-1 text-xs font-medium mb-2.5" style="color:var(--ink-light)"><span><i class="ph ph-calendar-blank"></i> ' + fmtDateRange(a) + '</span><span><i class="ph ph-map-pin"></i> ' + dest + '</span></div>' +
      '<h3 class="font-display font-bold text-lg leading-snug mb-2 line-clamp-2" style="color:var(--ink)">' + title + '</h3>' +
      '<p class="text-sm leading-relaxed line-clamp-2 mb-4" style="color:var(--ink-muted)">' + desc + '</p>' +
      '<div class="flex items-center justify-between">' +
        '<span class="inline-flex items-center gap-1.5 text-sm font-semibold" style="color:var(--blue)">Lire la suite <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg></span>' +
        popBars +
      '</div>' +
    '</div>' +
  '</article>';
}

function folderCard(f){
  const slug = safeAttr(f.slug || '');
  const name = safeText(f.name || '');
  return '<article class="voyage-card cursor-pointer group" data-folder-slug="' + slug + '" role="link" tabindex="0">' +
    '<div class="relative overflow-hidden flex items-center justify-center" style="height:15rem;border-radius:1.5rem 1.5rem 0 0;background:linear-gradient(135deg,rgba(0,87,184,.12),rgba(255,199,138,.18))">' +
      '<div class="text-center px-6">' +
        '<div class="mx-auto mb-4 flex items-center justify-center rounded-full" style="width:4.75rem;height:4.75rem;background:rgba(255,255,255,.72);box-shadow:0 8px 20px rgba(0,0,0,.08)">' + flagImg(f.icon || '📁') + '</div>' +
        '<div class="text-xs font-black uppercase tracking-[.18em]" style="color:var(--blue)">Sous-dossier</div>' +
      '</div>' +
    '</div>' +
    '<div class="p-5">' +
      '<h3 class="font-display font-bold text-lg leading-snug mb-2" style="color:var(--ink)">' + name + '</h3>' +
      '<p class="text-sm leading-relaxed mb-4" style="color:var(--ink-muted)">Ouvrir ce sous-dossier et voir ses voyages.</p>' +
      '<span class="inline-flex items-center gap-1.5 text-sm font-semibold" style="color:var(--blue)">Ouvrir le sous-dossier <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg></span>' +
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

  return '<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-2">'+
    '<div class="rounded-[1.6rem] px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style="background:rgba(0,87,184,.08);border:1px solid rgba(0,87,184,.16)">'+
      '<div>'+
        '<div class="text-xs font-black uppercase tracking-[.18em]" style="color:var(--blue)">Mode admin</div>'+
        '<div class="font-display text-xl font-bold mt-1" style="color:var(--ink)">'+flagImg(activeFolder.icon||'')+' '+folderName+'</div>'+
        '<p class="text-sm mt-1" style="color:var(--ink-muted)">'+parentHint+'</p>'+
      '</div>'+
      '<div class="flex flex-wrap gap-2">'+
        '<a href="' + safeAttr(editorUrl) + '" class="action-btn-sm"><i class="ph ph-pencil-line"></i> Nouveau voyage</a>'+
        '<button type="button" class="subtle-btn" data-folder-id="' + activeFolder.id + '" data-folder-name="' + safeAttr(activeFolder.name || '') + '"><i class="ph ph-folder-plus"></i> Nouveau sous-dossier</button>'+
      '</div>'+
    '</div>'+
  '</div>';
}

async function openPublicFolderModal(parentId,parentName){
  const name=window.prompt('Nom du sous-dossier dans '+parentName+' :');
  if(name===null) return;
  const trimmed=name.trim();
  if(!trimmed){toast('Nom requis','err');return;}
  const res=await fetch('/api/folders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:trimmed,icon:'📁',parent_id:parentId})});
  const data=await res.json().catch(()=>null);
  if(!res.ok){toast(data?.error||'Erreur de création','err');return;}
  toast('Sous-dossier créé !','ok');
  location.href='/voyages?folder='+encodeURIComponent(data.slug||'');
}

async function init(){
  const params=new URLSearchParams(location.search);
  const folder=params.get('folder');
  const [folders,artData]=await Promise.all([
    fetch('/api/folders').then(r=>r.json()).catch(()=>[]),
    fetch('/api/articles'+(folder?'?folder='+encodeURIComponent(folder):'')).then(r=>r.json()).catch(()=>({articles:[],total:0})),
  ]);
  const activeF=folder?folders.find(f=>f.slug===folder):null;
  const parentF=activeF?.parent_id?folders.find(f=>f.id===activeF.parent_id):null;
  const totalCount=(artData.total??artData.articles.length);
  const plural=totalCount!==1?'s':'';
  const rootF=parentF||activeF;
  let destLabel='';
  if(rootF){
    const rootName = safeText(rootF.name || '');
    destLabel=' - <strong style="color:var(--palm)">'+flagImg(rootF.icon||'')+' '+rootName;
    if(parentF){
      const activeName = safeText(activeF.name || '');
      destLabel+=' / '+flagImg(activeF.icon||'')+' '+activeName;
    }
    destLabel+='</strong>';
  }
  document.getElementById('subtitle').innerHTML='<strong style="color:var(--blue)">'+totalCount+'</strong> itinéraire'+plural+' documenté'+destLabel;
  // Fil d'ariane
  const bc=document.getElementById('breadcrumb');
  if(bc){
    if(activeF){
      const sep='<span class="mx-1 opacity-40"><i class="ph ph-caret-right"></i></span>';
      let crumbs='<a href="/voyages" style="color:var(--ink-muted);text-decoration:none;white-space:nowrap" class="hover:underline">Tous les voyages</a>';
      if(parentF){
        const parentSlug = safeAttr(parentF.slug || '');
        const parentName = safeText(parentF.name || '');
        const activeSlug = safeAttr(activeF.slug || '');
        const activeName = safeText(activeF.name || '');
        crumbs+=sep+'<a href="/voyages?folder=' + parentSlug + '" style="color:var(--ink-muted);text-decoration:none;display:inline-flex;align-items:center;gap:.3rem;white-space:nowrap" class="hover:underline">'+flagImg(parentF.icon||'')+' '+parentName+'</a>';
        crumbs+=sep+'<span style="color:var(--ink);font-weight:600;display:inline-flex;align-items:center;gap:.3rem;white-space:nowrap">'+flagImg(activeF.icon||'')+' '+activeName+'</span>';
      }else{
        const activeSlug = safeAttr(activeF.slug || '');
        const activeName = safeText(activeF.name || '');
        crumbs+=sep+'<span style="color:var(--ink);font-weight:600;display:inline-flex;align-items:center;gap:.3rem;white-space:nowrap">'+flagImg(activeF.icon||'')+' '+activeName+'</span>';
      }
      bc.innerHTML='<nav class="flex items-center flex-wrap gap-0.5 text-sm py-1" style="color:var(--ink-muted)">'+crumbs+'</nav>';
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
    const base='inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm border-2 transition-all';
    if(active) return sub
      ? base+' border-palm text-white" style="background:var(--palm);border-color:var(--palm)'
      : base+' text-white" style="background:var(--blue);border-color:var(--blue)';
    return base+' bg-white" style="border-color:var(--line);color:var(--ink-muted)';
  };
  let btns='<a href="/voyages" class="'+pill(!folder,false)+'"><i class="ph ph-globe-hemisphere-west"></i> Tous</a>';
  roots.forEach(f=>{
    const isActive=folder===f.slug||(parentF&&parentF.id===f.id);
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
    :'<div class="col\\-span-3 text-center py-20" style="color:var(--ink-light)"><i class="ph ph-map-trifold" style="font-size:4rem;display:block;margin-bottom:1rem;color:var(--ink-light)"></i><p class="text-xl font-semibold mb-1" style="color:var(--ink)">Pas encore de voyage ici</p></div>';

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
}
init();
</script>
</body></html>`);
}

function voyagePage(slug, authed=false) {
  return html(`<!DOCTYPE html>
<html lang="fr">
<head>${HEAD('Chargement... - Tranquille, on est en vacances')}</head>
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
const IS_ADMIN = ${JSON.stringify(authed)};
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function flagImg(icon){if(!icon)return '';const cp=[...icon].map(c=>c.codePointAt(0));if(cp.length>=2&&cp[0]>=0x1F1E6&&cp[0]<=0x1F1FF&&cp[1]>=0x1F1E6&&cp[1]<=0x1F1FF){const code=[cp[0],cp[1]].map(c=>String.fromCodePoint(c-0x1F1E6+65)).join('').toLowerCase();return '<img src="https://flagcdn.com/w20/'+code+'.png" width="20" height="15" alt="'+code.toUpperCase()+'" style="vertical-align:middle;border-radius:2px;flex-shrink:0">';}return '<span>'+icon+'</span>';}
function fmtDate(d){return new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}
function fmtDateRange(a){
  const s=a.start_date||a.date, e=a.end_date||a.date;
  if(!s) return 'Dates non définies';
  return s===e ? fmtDate(s) : fmtDate(s)+' – '+fmtDate(e);
}
function safeAttr(s){return(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function safeText(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

function popularityBars(views) {
  const v = views || 0;
  const count = v === 0 ? 0 : v < 20 ? 1 : v < 100 ? 2 : v < 300 ? 3 : v < 800 ? 4 : 5;
  let dots = '';
  for (let i = 0; i < 5; i++) {
    dots += '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:' + (i < count ? 'var(--blue)' : 'rgba(0,0,0,.10)') + '"></span>';
  }
  return '<span style="display:inline-flex;align-items:center;gap:3px">' + dots + '</span>';
}

function fixMd(s){return(s||'').replace(/\\*\\* +/g,'**').replace(/ +\\*\\*/g,'**').replace(/!\\[\\]\\(\\s*\\)/g,'').replace(/!\\[\\]\\s*$/gm,'').trim();}
function stripMdText(s){if(!s)return'';const d=document.createElement('div');d.innerHTML=marked.parse(fixMd(s));return d.textContent.replace(/\\s+/g,' ').trim();}
function extractInlineImages(content){
  const d=document.createElement('div');
  const t=(content||'').trim();
  d.innerHTML=t.startsWith('<')?t:marked.parse(fixMd(content));
  return[...d.querySelectorAll('img')].map(img=>({url:img.getAttribute('src')||'',caption:(img.getAttribute('alt')||'').trim()})).filter(p=>p.url);
}

async function init(){
  const a=await fetch('/api/articles/'+SLUG).then(r=>r.json()).catch(()=>null);
  if(!a||a.error){
    document.getElementById('main').innerHTML=\`<div class="max-w-2xl mx-auto px-4 py-32 text-center"><i class="ph ph-map-trifold" style="font-size:4rem;display:block;margin-bottom:1.5rem;color:var(--ink-light)"></i><h1 class="font-display text-3xl font-bold mb-4" style="color:var(--ink)">Voyage introuvable</h1><p class="mb-8" style="color:var(--ink-muted)">Ce voyage n'existe pas ou n'est pas encore publié.</p><a href="/voyages" class="action-btn">← Retour aux voyages</a></div>\`;
    return;
  }
  const _vk = 'viewed_' + a.id;
  if (!sessionStorage.getItem(_vk)) {
    sessionStorage.setItem(_vk, '1');
    fetch('/api/articles/'+a.id+'/view',{method:'POST'}).catch(()=>{});
  }
  document.title=esc(a.title)+' - Tranquille, on est en vacances';
  const photos=a.photos||[];
  const inlineImgs=extractInlineImages(a.content||'');
  const photoUrlSet=new Set(photos.map(p=>p.url));
  const allPhotos=[...photos,...inlineImgs.filter(img=>!photoUrlSet.has(img.url))];
  window.photos=allPhotos;
  const renderedContent=renderVoyageContent(a.content||'',allPhotos);
  document.getElementById('main').innerHTML=\`
  <div class="hero-photo relative overflow-hidden" style="background:#0a121e;min-height:clamp(40vh,55vw,80vh);max-height:90vh">
    <img src="\${esc(a.cover_url||'')}" alt="" aria-hidden="true" class="hero-photo-img" style="filter:blur(28px);transform:scale(1.12);opacity:.45" onerror="this.style.display='none'">
    <img src="\${esc(a.cover_url||'')}" alt="\${esc(a.title)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain" onerror="this.style.display='none'">
    <div class="absolute bottom-0 left-0 right-0 pb-10 px-4 sm:px-6 lg:px-8" style="background:linear-gradient(to top,rgba(10,18,30,.75) 0%,transparent 100%)">
      <div class="max-w-4xl mx-auto">
        \${a.folder_name?'<div class="mb-3"><span class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full text-white" style="background:rgba(255,255,255,.18);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,.30)">'+flagImg(a.folder_icon||'')+' '+esc(a.folder_name)+'</span></div>':''}
        <h1 class="font-display text-3xl sm:text-5xl font-bold text-white drop-shadow-lg leading-tight">\${esc(a.title)}</h1>
      </div>
    </div>
  </div>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
    <a href="/voyages" class="inline-flex items-center gap-2 font-semibold text-sm mb-8 hover:underline" style="color:var(--blue)">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>Retour aux voyages
    </a>
    <div class="panel rounded-[2rem] p-6 sm:p-8 mb-6">
      <div class="flex flex-wrap gap-2">
        <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style="background:var(--sand);color:var(--ink)"><i class="ph ph-calendar-blank" style="color:var(--blue);flex-shrink:0"></i>\${fmtDateRange(a)}</span>
        <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style="background:var(--sand);color:var(--ink)"><i class="ph ph-map-pin" style="color:var(--blue);flex-shrink:0"></i>\${esc(a.destination)}</span>
        <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style="background:var(--sand);color:var(--ink)"><i class="ph ph-camera" style="color:var(--blue);flex-shrink:0"></i>\${allPhotos.length} photo\${allPhotos.length!==1?'s':''}</span>
        <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style="background:var(--sand);color:var(--ink)"><i class="ph ph-eye" style="color:var(--blue);flex-shrink:0"></i>\${a.view_count||0} lecture\${(a.view_count||0)!==1?'s':''}&ensp;\${popularityBars(a.view_count||0)}</span>
      </div>
    </div>
    <div class="panel rounded-[2rem] p-6 sm:p-8 mb-10" style="border-left:4px solid rgba(var(--blue-rgb),.22)">
      <p class="text-base sm:text-lg leading-relaxed font-medium italic" style="color:var(--ink-muted)">"\${stripMdText(a.short_description)}"</p>
    </div>
    <div class="prose-vacation text-base sm:text-lg leading-relaxed mb-12" style="color:var(--ink)">\${renderedContent}</div>
    \${renderWritingDays(a.writing_days||[])}
    \${allPhotos.length ? renderGallery(allPhotos) : ''}
    <div class="pt-8 flex items-center justify-between" style="border-top:1px solid var(--line)">
      <a href="/voyages" class="inline-flex items-center gap-2 font-semibold text-sm hover:underline" style="color:var(--blue)">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>Tous les voyages
      </a>
      <button data-share-btn class="subtle-btn"><i class="ph ph-share-network"></i> Partager</button>
    </div>
  </div>\`;
  if(IS_ADMIN){const fab=document.createElement('a');fab.href='/admin/editor/'+a.id;fab.setAttribute('style','position:fixed;bottom:5rem;right:1.5rem;z-index:50;display:inline-flex;align-items:center;gap:.5rem;padding:.65rem 1.25rem;border-radius:999px;background:#0057B8;color:#fff;font-weight:700;font-size:.85rem;text-decoration:none;box-shadow:0 4px 18px rgba(0,87,184,.4)');fab.innerHTML='<i class="ph ph-pencil-simple" style="font-size:1.1rem"></i> Modifier';document.body.appendChild(fab);}

  // Event delegation for all clickable images and share button
  setTimeout(()=>{
    document.getElementById('main').addEventListener('click',(e)=>{
      const img = e.target.closest('img[data-gallery-index], img[data-photo-index], img[data-photo-url]');
      if (img) {
        if (img.dataset.galleryIndex !== undefined) {
          openLightbox(window.photos, parseInt(img.dataset.galleryIndex));
        } else if (img.dataset.photoIndex !== undefined) {
          openLightbox(window.photos, parseInt(img.dataset.photoIndex));
        } else if (img.dataset.photoUrl) {
          openLightbox([{url: img.dataset.photoUrl, caption: img.dataset.photoCaption||''}], 0);
        }
        return;
      }
    });
    const shareBtn=document.querySelector('button[data-share-btn]');
    if(shareBtn) shareBtn.addEventListener('click',share);
  },0);
}

function renderVoyageContent(content,photos){
  const wrapper=document.createElement('div');
  const trimmed=(content||'').trim();
  wrapper.innerHTML=trimmed.startsWith('<') ? trimmed : marked.parse(fixMd(content));
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
    grid.className='img-row img-row-'+n;
    imgs.forEach(img=>{
      const cell=document.createElement('div');
      img.loading='lazy';
      const src=img.getAttribute('src')||'';
      const idx=photoIndexByUrl.get(src);
      if(typeof idx==='number'){
        img.classList.add('cursor-zoom-in');
        img.dataset.photoIndex = idx;
      } else {
        img.classList.add('cursor-zoom-in');
        img.dataset.photoUrl = src;
        img.dataset.photoCaption = img.getAttribute('alt') || '';
      }
      cell.appendChild(img);
      grid.appendChild(cell);
    });
    p.replaceWith(grid);
  });

  // Single images → figure
  wrapper.querySelectorAll('img').forEach(img=>{
    if(img.closest('.img-row')||img.closest('.img-pair')) return;
    img.className=(img.className||'')+' rounded-2xl my-6 shadow-md';
    img.loading='lazy';
    if(!img.closest('figure')){
      const figure=document.createElement('figure');
      img.replaceWith(figure);figure.appendChild(img);
      const alt=(img.getAttribute('alt')||'').trim();
      if(alt){const cap=document.createElement('figcaption');cap.textContent=alt;figure.appendChild(cap);}
    }
    const src=img.getAttribute('src')||'';
    const idx=photoIndexByUrl.get(src);
    if(typeof idx==='number'){
      img.classList.add('cursor-zoom-in');
      img.dataset.photoIndex = idx;
    } else {
      img.classList.add('cursor-zoom-in');
      img.dataset.photoUrl = src;
      img.dataset.photoCaption = img.getAttribute('alt') || '';
    }
  });

  // Event delegation added in init() setTimeout below
  return wrapper.innerHTML;
}

function renderGallery(photos){
  if(!photos.length) return '';
  const items=photos.map((p,i)=>{
    const pUrl = safeAttr(p.url || '');
    const pCaption = safeAttr(p.caption || '');
    return '<div class="break-inside-avoid mb-3">' +
      '<img src="' + pUrl + '" alt="' + pCaption + '" class="w-full rounded-2xl cursor-zoom-in shadow-sm hover:shadow-md transition-all" data-gallery-index="' + i + '" loading="lazy">' +
      (p.caption ? '<p class="text-xs mt-1.5 px-1" style="color:var(--ink-muted)">' + safeText(p.caption) + '</p>' : '') +
    '</div>';
  }).join('');
  return '<section class="mb-12">' +
    '<h2 class="font-display text-2xl sm:text-3xl font-bold mb-6" style="color:var(--ink)"><i class="ph ph-images"></i> Galerie du voyage</h2>' +
    '<div class="columns-2 sm:columns-3 gap-3">' + items + '</div>' +
  '</section>';
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
      if (path === '/api/settings/hero-image' && method === 'POST') {
        return authed ? uploadHeroImage(request, env) : unauthorized();
      }
      if (path === '/api/settings/hero-image' && method === 'DELETE') {
        return authed ? deleteHeroImage(env) : unauthorized();
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
      const viewMatch = matchPath('/api/articles/:id/view', path);
      if (viewMatch && method === 'POST') {
        const id = parseInt(viewMatch.id);
        return !isNaN(id) ? recordView(env, id) : recordView(env, viewMatch.id);
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
    if (path === '/' || path === '') return homePage(publicAuthed);
    if (path === '/voyages')         return voyagesPage(publicAuthed);
    const voyageMatch = matchPath('/voyage/:slug', path);
    if (voyageMatch) return voyagePage(voyageMatch.slug, publicAuthed);

    // 404
    return html(`<!DOCTYPE html><html lang="fr"><head><title>404 - Page introuvable</title></head>
<body style="font-family:sans-serif;text-align:center;padding:4rem">
  <h1 style="font-size:3rem"><i class="ph ph-map-trifold"></i></h1>
  <h2>Page introuvable</h2>
  <p><a href="/">← Retour à l'accueil</a></p>
</body></html>`, 404);
  },
};
