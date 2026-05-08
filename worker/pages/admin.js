/**
 * pages/admin.js — Admin interface HTML templates
 * Served only to authenticated users (checked in index.js before calling these).
 */

import { HEAD, TOAST } from './shell.js';
import { html } from '../utils.js';

// ── Admin shared nav bar ──────────────────────────────────────
const ADMIN_NAV = (subtitle = '') => `
<nav class="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-stone-900 to-stone-800 text-white shadow-lg">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
    <div class="flex items-center gap-4">
      <a href="/" class="flex items-center gap-2 group">
        <span class="text-xl">🌴</span>
        <span class="font-display font-bold text-sm text-white/90 group-hover:text-white transition-colors">Blog Potet</span>
      </a>
      <span class="text-stone-600">/</span>
      <span class="text-stone-300 text-sm font-medium">Admin ${subtitle ? '/ ' + subtitle : ''}</span>
    </div>
    <div class="flex items-center gap-3">
      <a href="/" class="text-stone-400 hover:text-white text-sm font-medium transition-colors hidden sm:block">Voir le blog →</a>
      <a href="/admin/dashboard" class="text-stone-400 hover:text-white text-sm font-medium transition-colors">Tableau de bord</a>
      <form method="POST" action="/admin/logout" class="inline">
        <button type="submit" class="bg-red-500/20 text-red-400 hover:bg-red-500/30 font-semibold px-3 py-1.5 rounded-xl text-xs transition-colors">Déconnexion</button>
      </form>
    </div>
  </div>
</nav>`;

// ── Login page ────────────────────────────────────────────────
export function loginPage(error = '') {
  return html(`<!DOCTYPE html>
<html lang="fr">
<head>${HEAD('Admin — Connexion')}</head>
<body class="bg-gradient-to-br from-sky-50 via-white to-orange-50 min-h-screen font-sans antialiased">
<div class="min-h-screen flex items-center justify-center px-4 py-12">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <a href="/" class="inline-block">
        <span class="text-6xl block mb-3">🔐</span>
      </a>
      <h1 class="font-display text-3xl font-bold text-stone-900">Espace Admin</h1>
      <p class="text-stone-500 mt-2 text-sm">Connexion réservée à la famille Potet</p>
    </div>
    <div class="bg-white rounded-3xl shadow-xl p-8 border border-stone-100">
      ${error ? `<div class="mb-5 bg-red-50 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium border border-red-100">❌ ${error}</div>` : ''}
      <form method="POST" action="/admin/login">
        <div class="mb-6">
          <label class="block text-sm font-bold text-stone-700 mb-2" for="password">Mot de passe</label>
          <input type="password" id="password" name="password" placeholder="••••••••" autofocus required
                 class="w-full border-2 border-stone-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-sky-400 transition-colors font-medium">
        </div>
        <button type="submit"
                class="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold py-3.5 rounded-2xl hover:shadow-lg hover:scale-[1.02] transition-all text-base">
          Se connecter ✨
        </button>
      </form>
    </div>
    <p class="text-center text-stone-400 text-sm mt-6">
      <a href="/" class="hover:text-sky-600 transition-colors">← Retour au blog</a>
    </p>
  </div>
</div>
</body>
</html>`);
}

// ── Admin dashboard ───────────────────────────────────────────
export function dashboardPage() {
  return html(`<!DOCTYPE html>
<html lang="fr">
<head>${HEAD('Admin — Tableau de bord')}</head>
<body class="bg-stone-50 font-sans text-stone-900 antialiased pt-14">
${ADMIN_NAV()}

<div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
  <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">

    <!-- Sidebar -->
    <aside class="lg:col-span-1 space-y-5">
      <div class="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div class="flex items-center justify-between px-4 py-3 bg-stone-50 border-b border-stone-100">
          <h2 class="font-bold text-stone-700 text-sm">📁 Dossiers</h2>
          <button onclick="openFolderModal(null)" class="text-sky-600 hover:text-sky-700 text-sm font-bold transition-colors">+ Nouveau</button>
        </div>
        <div id="folder-tree" class="p-2 max-h-80 overflow-y-auto">
          <div class="text-stone-400 text-sm p-3 animate-pulse">Chargement...</div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3" id="stats-grid">
        <div class="bg-emerald-50 rounded-2xl p-4 text-center border border-emerald-100">
          <div id="stat-pub" class="text-2xl font-black text-emerald-600">—</div>
          <div class="text-xs font-bold text-emerald-700 mt-1">Publiés</div>
        </div>
        <div class="bg-amber-50 rounded-2xl p-4 text-center border border-amber-100">
          <div id="stat-draft" class="text-2xl font-black text-amber-600">—</div>
          <div class="text-xs font-bold text-amber-700 mt-1">Brouillons</div>
        </div>
      </div>
    </aside>

    <!-- Articles list -->
    <main class="lg:col-span-3">
      <div class="flex items-center justify-between mb-6">
        <h2 class="font-display text-2xl font-bold text-stone-900">Tous les articles</h2>
        <a href="/admin/editor"
           class="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold px-5 py-2.5 rounded-2xl hover:shadow-lg hover:scale-105 transition-all text-sm">
          ✍️ Nouvel article
        </a>
      </div>
      <div id="articles-list" class="space-y-3">
        ${Array.from({length:4}).map(()=>`
          <div class="bg-white rounded-2xl border border-stone-100 p-4 flex items-center gap-4">
            <div class="w-20 h-20 rounded-xl bg-stone-200 animate-pulse flex-shrink-0"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-stone-200 rounded animate-pulse w-3/4"></div>
              <div class="h-3 bg-stone-200 rounded animate-pulse w-1/2"></div>
            </div>
          </div>`).join('')}
      </div>
    </main>
  </div>
</div>

<!-- Folder modal -->
<div id="folder-modal" class="hidden fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onclick="if(event.target===this)closeFolderModal()">
  <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
    <h3 class="font-display text-xl font-bold text-stone-900 mb-5">📁 Nouveau dossier</h3>
    <div class="space-y-4 mb-6">
      <div>
        <label class="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wide">Nom</label>
        <input type="text" id="fm-name" placeholder="Ex: Asie du Sud-Est" class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm font-medium">
      </div>
      <div>
        <label class="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wide">Emoji</label>
        <input type="text" id="fm-icon" placeholder="🌏" maxlength="2" class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm">
      </div>
    </div>
    <div class="flex gap-3">
      <button onclick="closeFolderModal()" class="flex-1 bg-stone-100 text-stone-700 font-bold py-2.5 rounded-xl hover:bg-stone-200 transition-colors text-sm">Annuler</button>
      <button onclick="submitFolder()" class="flex-1 bg-sky-500 text-white font-bold py-2.5 rounded-xl hover:bg-sky-600 transition-colors text-sm">Créer ✨</button>
    </div>
  </div>
</div>

${TOAST}
<script>
let _folderParentId = null;

function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function fmtDate(d){return new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}

// ── Load dashboard data ───────────────────────────────────────
async function init() {
  const [folders, artData] = await Promise.all([
    fetch('/api/folders').then(r=>r.json()).catch(()=>[]),
    fetch('/api/articles?limit=100').then(r=>r.json()).catch(()=>({articles:[]})),
  ]);

  renderFolderTree(folders, null);
  document.getElementById('stat-pub').textContent = artData.articles.filter(a=>a.status==='published').length;
  document.getElementById('stat-draft').textContent = artData.articles.filter(a=>a.status==='draft').length;
  renderArticles(artData.articles, folders);
}

function renderFolderTree(folders, parentId, depth=0) {
  const kids = folders.filter(f => f.parent_id === parentId);
  if (!kids.length) return depth===0 ? '<p class="text-stone-400 text-sm p-3">Aucun dossier</p>' : '';
  return kids.map(f => \`
    <div style="padding-left:\${depth*14}px">
      <div class="flex items-center justify-between px-3 py-2 rounded-xl group hover:bg-sky-50 transition-colors">
        <a href="/voyages?folder=\${f.slug}" class="flex items-center gap-2 flex-1 text-sm font-semibold text-stone-700 hover:text-sky-600 transition-colors">
          <span>\${f.icon}</span><span>\${esc(f.name)}</span>
        </a>
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          <button onclick="openFolderModal(\${f.id})" class="text-stone-400 hover:text-sky-600 p-1 text-xs font-bold" title="Sous-dossier">+</button>
          <button onclick="delFolder(\${f.id})" class="text-stone-400 hover:text-red-500 p-1 text-xs font-bold" title="Supprimer">×</button>
        </div>
      </div>
      \${renderFolderTree(folders, f.id, depth+1)}
    </div>\`).join('');
}

function renderArticles(arts, folders) {
  if (!arts.length) {
    document.getElementById('articles-list').innerHTML = '<div class="text-center text-stone-400 py-16">Aucun article pour l\\'instant.</div>';
    return;
  }
  document.getElementById('articles-list').innerHTML = arts.map(a => {
    const isPub = a.status === 'published';
    return \`
    <div class="bg-white rounded-2xl border border-stone-100 p-4 flex items-center gap-4 hover:shadow-md transition-shadow group">
      <img src="\${esc(a.cover_url||'')}" alt="\${esc(a.title)}" class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover flex-shrink-0" onerror="this.src='https://picsum.photos/seed/\${a.id}z/200/200'">
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2 mb-1">
          <h3 class="font-bold text-stone-900 text-sm sm:text-base truncate">\${esc(a.title)}</h3>
          <span class="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 \${isPub?'badge-published':'badge-draft'}">\${isPub?'✅ Publié':'📝 Brouillon'}</span>
        </div>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-400">
          <span>📅 \${fmtDate(a.date)}</span>
          <span>📍 \${esc(a.destination)}</span>
          \${a.folder_name ? \`<span>\${esc(a.folder_icon||'')} \${esc(a.folder_name)}</span>\` : ''}
        </div>
      </div>
      <div class="flex flex-col sm:flex-row items-center gap-1 flex-shrink-0">
        <button onclick="toggleStatus(\${a.id}, '\${a.status}')" title="\${isPub?'Dépublier':'Publier'}" class="p-2 rounded-xl text-stone-400 hover:text-\${isPub?'amber':'emerald'}-600 hover:bg-\${isPub?'amber':'emerald'}-50 transition-all text-base">\${isPub?'🔒':'🚀'}</button>
        <a href="/admin/editor/\${a.id}" class="p-2 rounded-xl text-stone-400 hover:text-sky-600 hover:bg-sky-50 transition-all text-base">✏️</a>
        <a href="/voyage/\${a.slug}" class="p-2 rounded-xl text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all text-base">👁️</a>
        <button onclick="delArticle(\${a.id})" class="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 text-base">🗑️</button>
      </div>
    </div>\`;
  }).join('');
}

async function toggleStatus(id, current) {
  const res = await fetch(\`/api/articles/\${id}/status\`, {method:'PATCH'});
  if (res.ok) { toast(current==='draft'?'🚀 Article publié !':'📝 Mis en brouillon','ok'); init(); }
  else toast('Erreur','err');
}

async function delArticle(id) {
  if(!confirm('Supprimer cet article définitivement ?')) return;
  const res = await fetch(\`/api/articles/\${id}\`,{method:'DELETE'});
  if (res.ok) { toast('Article supprimé','ok'); init(); }
  else toast('Erreur','err');
}

// Folder modal
function openFolderModal(parentId) {
  _folderParentId = parentId;
  document.getElementById('fm-name').value=''; document.getElementById('fm-icon').value='';
  document.getElementById('folder-modal').classList.remove('hidden');
  setTimeout(()=>document.getElementById('fm-name').focus(),50);
}
function closeFolderModal() { document.getElementById('folder-modal').classList.add('hidden'); }
async function submitFolder() {
  const name=document.getElementById('fm-name').value.trim();
  const icon=document.getElementById('fm-icon').value.trim()||'📁';
  if(!name){toast('Nom requis','err');return;}
  const res = await fetch('/api/folders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,icon,parent_id:_folderParentId})});
  if(res.ok){closeFolderModal();toast('Dossier créé !','ok');init();}
  else toast('Erreur','err');
}
async function delFolder(id) {
  if(!confirm('Supprimer ce dossier ?')) return;
  const res = await fetch('/api/folders/'+id,{method:'DELETE'});
  if(res.ok){toast('Dossier supprimé','ok');init();}else toast('Erreur','err');
}

// Update folder tree element after fetch
const origInit = init;
init = async function() {
  await origInit();
  // Re-render folder tree
  const folders = await fetch('/api/folders').then(r=>r.json()).catch(()=>[]);
  document.getElementById('folder-tree').innerHTML = renderFolderTree(folders, null);
};

init();
</script>
</body>
</html>`);
}

// ── Article Editor ────────────────────────────────────────────
export function editorPage(articleId = null) {
  const isEdit = articleId !== null;
  return html(`<!DOCTYPE html>
<html lang="fr">
<head>${HEAD(isEdit ? 'Admin — Modifier article' : 'Admin — Nouvel article')}</head>
<body class="bg-stone-50 font-sans text-stone-900 antialiased pt-14">
${ADMIN_NAV(isEdit ? 'Modifier article' : 'Nouvel article')}

<div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

    <!-- Editor main -->
    <div class="lg:col-span-2 space-y-5">

      <!-- Title -->
      <div>
        <label class="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide">Titre *</label>
        <input type="text" id="e-title" placeholder="Ex: Notre été à Santorin 🌊"
               class="w-full border-2 border-stone-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-sky-400 transition-colors font-bold text-lg text-stone-800">
      </div>

      <!-- Short description -->
      <div>
        <label class="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide">Description courte</label>
        <textarea id="e-desc" rows="2" placeholder="Un résumé accrocheur de 1-2 phrases..."
                  class="w-full border-2 border-stone-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-sky-400 transition-colors text-stone-800 resize-none text-sm"></textarea>
      </div>

      <!-- Markdown editor -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-xs font-bold text-stone-500 uppercase tracking-wide">Contenu (Markdown)</label>
          <div class="flex items-center gap-1 bg-stone-100 rounded-xl p-1">
            <button id="tab-write" onclick="edTab('write')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-white shadow-sm text-stone-800">✏️ Écrire</button>
            <button id="tab-prev" onclick="edTab('preview')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-stone-500 hover:text-stone-700">👁️ Aperçu</button>
          </div>
        </div>
        <div id="pane-write">
          <textarea id="e-content" rows="22" placeholder="# Titre\n\nÉcris ici en Markdown..."
                    class="w-full border-2 border-stone-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-sky-400 transition-colors text-stone-800 md-editor"></textarea>
          <div class="flex flex-wrap gap-1 mt-2">
            ${[['**Gras**','G'],['*Ital.*','I'],['# H1','H1'],['## H2','H2'],['> Citation','❝'],['- Item','—'],['[lien](url)','🔗']].map(([s,l])=>`
              <button type="button" onclick="insertMd('${s.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}','e-content')" class="text-xs bg-stone-100 hover:bg-sky-100 text-stone-600 hover:text-sky-700 px-2.5 py-1.5 rounded-lg font-mono transition-colors">${l}</button>`).join('')}
          </div>
        </div>
        <div id="pane-preview" class="hidden">
          <div id="preview-out" class="prose-vacation border-2 border-stone-200 rounded-2xl px-6 py-4 bg-white min-h-[400px] text-stone-800"></div>
        </div>
      </div>

      <!-- Photo upload -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-xs font-bold text-stone-500 uppercase tracking-wide">Photos</label>
          ${articleId !== null ? '<p class="text-xs text-sky-600 font-semibold">💡 Survolez une photo et cliquez <strong>📎 Insérer</strong> pour l\'ajouter dans le texte</p>' : '<p class="text-xs text-stone-400">Sauvegardez d\'abord, puis insérez les photos dans le texte</p>'}
        </div>
        <div id="dropzone"
             class="border-2 border-dashed border-stone-300 rounded-2xl p-8 text-center hover:border-sky-400 hover:bg-sky-50 transition-all cursor-pointer"
             onclick="document.getElementById('file-in').click()"
             ondragover="event.preventDefault();this.classList.add('border-sky-400','bg-sky-50')"
             ondragleave="this.classList.remove('border-sky-400','bg-sky-50')"
             ondrop="handleDrop(event)">
          <span class="text-4xl block mb-2">📸</span>
          <p class="text-stone-600 font-semibold text-sm">Glissez vos photos ici ou cliquez</p>
          <p class="text-stone-400 text-xs mt-1">JPG, PNG, WebP · Max 10 MB</p>
          <input type="file" id="file-in" accept="image/*" multiple class="hidden" onchange="handleFiles(this.files)">
        </div>
        <div id="photo-grid" class="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4"></div>
      </div>

      <!-- Save buttons (mobile) -->
      <div class="flex gap-3 lg:hidden">
        <button onclick="saveArticle(false)" class="flex-1 bg-stone-200 text-stone-800 font-bold py-3 rounded-2xl hover:bg-stone-300 transition-colors">💾 Brouillon</button>
        <button onclick="saveArticle(true)" class="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-3 rounded-2xl hover:shadow-lg transition-all">🚀 Publier</button>
      </div>
    </div>

    <!-- Sidebar -->
    <aside class="lg:col-span-1 space-y-5">

      <!-- Save buttons (desktop) -->
      <div class="hidden lg:flex flex-col gap-3">
        <button onclick="saveArticle(true)" class="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-3 rounded-2xl hover:shadow-lg hover:scale-[1.02] transition-all">🚀 Publier</button>
        <button onclick="saveArticle(false)" class="w-full bg-stone-200 text-stone-800 font-bold py-2.5 rounded-2xl hover:bg-stone-300 transition-colors text-sm">💾 Sauvegarder en brouillon</button>
      </div>

      <!-- Status -->
      <div class="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
        <h3 class="font-bold text-stone-700 mb-4 text-sm">📊 Statut</h3>
        <div class="space-y-2">
          <label class="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-stone-50 transition-colors">
            <input type="radio" name="pub-status" value="draft" checked class="w-4 h-4 accent-amber-500">
            <div><div class="font-semibold text-stone-700 text-sm">📝 Brouillon</div><div class="text-xs text-stone-400">Admin uniquement</div></div>
          </label>
          <label class="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-stone-50 transition-colors">
            <input type="radio" name="pub-status" value="published" class="w-4 h-4 accent-emerald-500">
            <div><div class="font-semibold text-stone-700 text-sm">✅ Publié</div><div class="text-xs text-stone-400">Visible par tous</div></div>
          </label>
        </div>
      </div>

      <!-- Meta -->
      <div class="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
        <h3 class="font-bold text-stone-700 mb-4 text-sm">📋 Informations</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-stone-500 mb-1.5">📅 Date du voyage</label>
            <input type="date" id="e-date" class="w-full border-2 border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-sky-400 transition-colors text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-stone-500 mb-1.5">📍 Destination</label>
            <input type="text" id="e-dest" placeholder="Ex: Paris, France" class="w-full border-2 border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-sky-400 transition-colors text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-stone-500 mb-1.5">📁 Dossier</label>
            <select id="e-folder" class="w-full border-2 border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-sky-400 transition-colors text-sm">
              <option value="">Aucun dossier</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Cover photo -->
      <div class="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
        <h3 class="font-bold text-stone-700 mb-3 text-sm">🖼️ Photo de couverture</h3>
        <input type="text" id="e-cover" placeholder="URL de la photo de couverture..."
               class="w-full border-2 border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-sky-400 transition-colors text-xs mb-3" oninput="previewCover(this.value)">
        <div id="cover-wrap" class="hidden"><img id="cover-img" src="" alt="" class="w-full h-32 object-cover rounded-xl"></div>
      </div>

      ${isEdit ? `
      <div class="bg-red-50 rounded-2xl border border-red-100 p-5">
        <h3 class="font-bold text-red-700 mb-3 text-sm">⚠️ Zone danger</h3>
        <button onclick="delArticle()" class="w-full bg-red-500 text-white font-bold py-2.5 rounded-xl hover:bg-red-600 transition-colors text-sm">🗑️ Supprimer l'article</button>
      </div>` : ''}
    </aside>
  </div>
</div>

${TOAST}
<script>
const ARTICLE_ID = ${JSON.stringify(articleId)};
let existingPhotos = [];  // photos already on the server
let newPhotos = [];       // FileReader previews for new uploads

function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

// ── Init ──────────────────────────────────────────────────────
async function init() {
  // Load folders for the selector
  const folders = await fetch('/api/folders').then(r=>r.json()).catch(()=>[]);
  populateFolderSelect(folders, null, 0);

  // Set default date
  document.getElementById('e-date').value = new Date().toISOString().slice(0,10);

  if (ARTICLE_ID) {
    const a = await fetch('/api/articles/' + ARTICLE_ID).then(r=>r.json()).catch(()=>null);
    if (a) {
      document.getElementById('e-title').value = a.title || '';
      document.getElementById('e-desc').value  = a.short_description || '';
      document.getElementById('e-content').value = a.content || '';
      document.getElementById('e-date').value  = a.date || '';
      document.getElementById('e-dest').value  = a.destination || '';
      document.getElementById('e-cover').value = a.cover_url || '';
      previewCover(a.cover_url);
      document.querySelector(\`input[name="pub-status"][value="\${a.status||'draft'}"]\`).checked = true;
      if (a.folder_id) {
        const opt = document.querySelector(\`#e-folder option[value="\${a.folder_id}"]\`);
        if (opt) opt.selected = true;
      }
      existingPhotos = a.photos || [];
      renderPhotoGrid();
    }
  }
}

function populateFolderSelect(folders, parentId, depth) {
  const kids = folders.filter(f => f.parent_id === parentId);
  kids.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f.id;
    opt.textContent = '\u3000'.repeat(depth) + f.icon + ' ' + f.name;
    document.getElementById('e-folder').appendChild(opt);
    populateFolderSelect(folders, f.id, depth+1);
  });
}

// ── Editor tabs ───────────────────────────────────────────────
function edTab(tab) {
  const wp=document.getElementById('pane-write'), pp=document.getElementById('pane-preview');
  const tw=document.getElementById('tab-write'), tp=document.getElementById('tab-prev');
  if(tab==='write'){
    wp.classList.remove('hidden');pp.classList.add('hidden');
    tw.className='px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-white shadow-sm text-stone-800';
    tp.className='px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-stone-500 hover:text-stone-700';
  } else {
    document.getElementById('preview-out').innerHTML=marked.parse(document.getElementById('e-content').value||'');
    wp.classList.add('hidden');pp.classList.remove('hidden');
    tp.className='px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-white shadow-sm text-stone-800';
    tw.className='px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-stone-500 hover:text-stone-700';
  }
}
function insertMd(syntax) {
  const ta=document.getElementById('e-content'); if(!ta) return;
  const s=ta.selectionStart, e=ta.selectionEnd;
  ta.value=ta.value.slice(0,s)+syntax+ta.value.slice(e);
  ta.focus(); ta.setSelectionRange(s+syntax.length, s+syntax.length);
}
function insertPhotoInText(url, caption) {
  edTab('write');
  const ta=document.getElementById('e-content'); if(!ta) return;
  const md=`\n![${caption}](${url})\n`;
  const s=ta.selectionStart;
  ta.value=ta.value.slice(0,s)+md+ta.value.slice(ta.selectionEnd);
  ta.focus(); ta.setSelectionRange(s+md.length, s+md.length);
  toast('📎 Photo insérée dans le texte','ok');
}

// ── Cover preview ─────────────────────────────────────────────
function previewCover(url) {
  const w=document.getElementById('cover-wrap'), img=document.getElementById('cover-img');
  if(url){w.classList.remove('hidden');img.src=url;}else w.classList.add('hidden');
}

// ── Photo handling ────────────────────────────────────────────
function renderPhotoGrid() {
  const g=document.getElementById('photo-grid');
  const existing = existingPhotos.map((p,i)=>\`
    <div class="relative aspect-square overflow-hidden rounded-xl group">
      <img src="\${esc(p.url)}" alt="\${esc(p.caption||'')}" class="w-full h-full object-cover">
      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/55 transition-all flex flex-col items-center justify-center gap-1.5 p-1">
        <button onclick="insertPhotoInText('\${esc(p.url)}','\${esc(p.caption||'photo')}')" class="bg-sky-500 text-white text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap">📎 Insérer</button>
        <button onclick="delExistingPhoto(\${p.id}, \${i})" class="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap">🗑️ Supprimer</button>
      </div>
    </div>\`).join('');
  const newPics = newPhotos.map((p,i)=>\`
    <div class="relative aspect-square overflow-hidden rounded-xl group">
      <img src="\${p.dataUrl}" alt="\${esc(p.name)}" class="w-full h-full object-cover">
      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/55 transition-all flex flex-col items-center justify-center gap-1.5 p-1">
        <span class="bg-stone-800/80 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-center leading-tight">Sauvegardez<br>pour insérer</span>
        <button onclick="rmNewPhoto(\${i})" class="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap">🗑️ Supprimer</button>
      </div>
      <div class="absolute bottom-1 right-1 bg-orange-500 text-white text-xs rounded-full px-1.5 font-bold">Nouveau</div>
    </div>\`).join('');
  g.innerHTML = existing + newPics;
}

function handleFiles(files) {
  if (ARTICLE_ID) {
    // Existing article: upload immediately so photos can be inserted in text right away
    toast('📤 Upload en cours...','ok');
    const fd = new FormData();
    Array.from(files).forEach(f => fd.append('photo', f));
    fetch('/api/articles/'+ARTICLE_ID+'/photos', {method:'POST', body:fd})
      .then(r=>r.json())
      .then(data=>{ existingPhotos.push(...(data.uploaded||[])); renderPhotoGrid(); toast('✅ Photos ajoutées ! Survolez pour insérer.','ok'); })
      .catch(()=>toast('Erreur upload','err'));
  } else {
    // New article: queue locally, will be uploaded after save
    Array.from(files).forEach(f => {
      const r=new FileReader();
      r.onload=e=>{ newPhotos.push({dataUrl:e.target.result, name:f.name, file:f}); renderPhotoGrid(); };
      r.readAsDataURL(f);
    });
  }
}
function handleDrop(e) {
  e.preventDefault(); document.getElementById('dropzone').classList.remove('border-sky-400','bg-sky-50');
  handleFiles(e.dataTransfer.files);
}
function rmNewPhoto(i) { newPhotos.splice(i,1); renderPhotoGrid(); }
async function delExistingPhoto(photoId, i) {
  if (!confirm('Supprimer cette photo ?')) return;
  const r = await fetch('/api/photos/'+photoId, {method:'DELETE'});
  if (r.ok) { existingPhotos.splice(i,1); renderPhotoGrid(); toast('Photo supprimée','ok'); }
  else toast('Erreur','err');
}

// ── Save article ──────────────────────────────────────────────
async function saveArticle(publish) {
  const title = document.getElementById('e-title').value.trim();
  if (!title) { toast('Le titre est obligatoire','err'); return; }

  const status = publish ? 'published' : (document.querySelector('input[name="pub-status"]:checked')?.value || 'draft');
  const payload = {
    title,
    destination:       document.getElementById('e-dest').value.trim(),
    date:              document.getElementById('e-date').value,
    short_description: document.getElementById('e-desc').value.trim(),
    content:           document.getElementById('e-content').value,
    status,
    folder_id:         parseInt(document.getElementById('e-folder').value) || null,
    cover_url:         document.getElementById('e-cover').value.trim() || null,
  };

  let savedId = ARTICLE_ID;
  let res;
  if (ARTICLE_ID) {
    res = await fetch('/api/articles/'+ARTICLE_ID, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
  } else {
    res = await fetch('/api/articles', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    if (res.ok) { const data=await res.json(); savedId=data.id; }
  }

  if (!res.ok) { toast('Erreur lors de la sauvegarde','err'); return; }

  // Upload new photos
  if (newPhotos.length && savedId) {
    const fd = new FormData();
    newPhotos.forEach(p => fd.append('photo', p.file));
    await fetch('/api/articles/'+savedId+'/photos', {method:'POST', body:fd});
  }

  toast((publish?'🚀 Publié !':'💾 Sauvegardé !'),'ok');
  // For new articles: redirect to editor so photos can be inserted in text
  if (!ARTICLE_ID && savedId) {
    setTimeout(()=>location.href='/admin/editor/'+savedId, 800);
  } else {
    setTimeout(()=>location.href='/admin/dashboard', 800);
  }
}

async function delArticle() {
  if (!confirm('Supprimer cet article définitivement ?')) return;
  const r = await fetch('/api/articles/'+ARTICLE_ID, {method:'DELETE'});
  if (r.ok) { location.href='/admin/dashboard'; }
  else toast('Erreur','err');
}

init();
</script>
</body>
</html>`);
}
