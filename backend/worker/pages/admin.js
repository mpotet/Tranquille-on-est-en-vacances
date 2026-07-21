/**
 * pages/admin.js - Admin interface HTML templates
 * Served only to authenticated users (checked in index.js before calling these).
 */

import { HEAD, TOAST } from './shell.js';
import { html } from '../utils.js';
import { safeText, safeAttr } from '../helpers/html.js';

// ── Admin shared nav bar ──────────────────────────────────────
const ADMIN_NAV = (subtitle = '') => `
<nav id="navbar" class="fixed top-0 left-0 right-0 z-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <div class="flex items-center gap-3">
        <a href="/" class="flex items-center gap-3 group" aria-label="Accueil">
          <img src="/icon-192.png" width="38" height="38" alt="" aria-hidden="true" style="border-radius:.75rem;flex-shrink:0;box-shadow:0 2px 8px rgba(0,87,184,.20)">
          <div class="leading-none">
            <span class="brand-title font-display font-bold text-base block">Tranquille,</span>
            <span class="brand-subtitle text-[0.68rem] font-semibold tracking-[0.20em] uppercase block mt-0.5">on est en vacances</span>
          </div>
        </a>
        <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[0.65rem] font-black uppercase tracking-wide" style="background:rgba(var(--blue-rgb),.10);color:var(--blue);border:1px solid rgba(var(--blue-rgb),.20)">Admin</span>
        ${subtitle ? `<span class="hidden sm:flex items-center gap-1.5 text-sm font-medium" style="color:var(--ink-muted)"><i class="ph ph-caret-right" style="color:var(--ink-light);font-size:.8rem"></i>${subtitle}</span>` : ''}
      </div>
      <div class="flex items-center gap-2">
        <a href="/" class="nav-link hidden sm:inline-flex"><i class="ph ph-house"></i> Blog</a>
        <a href="/admin/dashboard" class="nav-link"><i class="ph ph-squares-four"></i> <span class="hidden sm:inline">Dashboard</span></a>
        <form method="POST" action="/admin/logout" class="inline">
          <button type="submit" class="subtle-btn !px-3 !py-2 !text-xs"><i class="ph ph-sign-out"></i> <span class="hidden sm:inline">Déconnexion</span></button>
        </form>
      </div>
    </div>
  </div>
</nav>
<!-- Barre état connexion (masquée par défaut, affichée par JS) -->
<div id="offline-bar" class="hidden fixed top-14 inset-x-0 z-40 items-center justify-center gap-2 py-2 px-4 text-sm font-semibold shadow-md pointer-events-none" aria-live="polite"></div>
<script>
(function(){
  const bar = document.getElementById('offline-bar');
  function update() {
    if (!bar) return;
    if (!navigator.onLine) {
      bar.className = 'flex fixed top-14 inset-x-0 z-40 items-center justify-center gap-2 py-2 px-4 text-sm font-semibold shadow-md bg-amber-400 text-amber-950';
      bar.innerHTML = '<i class="ph ph-wifi-x"></i><span>Hors connexion - les sauvegardes restent sur cet appareil</span>';
    } else {
      bar.className = 'hidden fixed top-14 inset-x-0 z-40 items-center justify-center gap-2 py-2 px-4 text-sm font-semibold shadow-md';
      bar.innerHTML = '';
    }
  }
  window.addEventListener('offline', update);
  window.addEventListener('online',  update);
  update();
})();
</script>`;

// ── Login page ────────────────────────────────────────────────
// `error`      : optional error banner text (wrong password, etc.)
// `noPassword` : true when the admin account has no password set yet (first-run);
//                shows a "compte non initialisé" notice instead of the form.
export function loginPage(error = '', noPassword = false) {
  const safeErr = safeText(error);
  const notInitialised = `
      <div class="mb-5 bg-amber-50 text-amber-800 px-4 py-3 rounded-2xl text-sm font-medium border border-amber-100">
        <i class="ph-fill ph-envelope-simple"></i> Compte non initialisé — vérifiez vos emails pour définir votre mot de passe.
      </div>
      <p class="text-sm text-stone-500">Un lien d'initialisation a été (ou sera) envoyé à l'adresse administrateur. Il est valable 1 heure.</p>`;

  const loginForm = `
      ${error ? `<div class="mb-5 bg-red-50 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium border border-red-100"><i class="ph-fill ph-x-circle"></i> ${safeErr}</div>` : ''}
      <form method="POST" action="/admin/login" id="login-form">
        <div class="mb-6">
          <label class="block text-sm font-bold text-stone-700 mb-2" for="password">Mot de passe</label>
          <input type="password" id="password" name="password" placeholder="••••••••" autofocus required
                 class="w-full border-2 border-stone-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-sky-400 transition-colors font-medium">
        </div>
        <button type="submit" class="w-full action-btn justify-center text-base">
          Se connecter <i class="ph ph-arrow-right"></i>
        </button>
      </form>
      <div class="mt-4 text-center">
        <button type="button" id="forgot-link" class="text-sm text-stone-500 hover:text-sky-600 transition-colors underline">Mot de passe oublié ?</button>
      </div>

      <!-- Forgot-password panel (hidden until toggled) -->
      <div id="forgot-panel" class="hidden mt-5 pt-5 border-t border-stone-100">
        <div id="forgot-done" class="hidden bg-emerald-50 text-emerald-800 px-4 py-3 rounded-2xl text-sm font-medium border border-emerald-100">
          <i class="ph-fill ph-check-circle"></i> Si cette adresse est reconnue, un email a été envoyé.
        </div>
        <form id="forgot-form">
          <label class="block text-sm font-bold text-stone-700 mb-2" for="forgot-email">Votre adresse email</label>
          <input type="email" id="forgot-email" name="email" required placeholder="vous@exemple.fr"
                 class="w-full border-2 border-stone-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-sky-400 transition-colors font-medium mb-3">
          <button type="submit" id="forgot-submit" class="w-full action-btn-sm justify-center">Envoyer le lien de réinitialisation</button>
        </form>
      </div>

      <script>
      (function(){
        var link=document.getElementById('forgot-link');
        var panel=document.getElementById('forgot-panel');
        var form=document.getElementById('forgot-form');
        var done=document.getElementById('forgot-done');
        if(link) link.addEventListener('click',function(){
          panel.classList.toggle('hidden');
          if(!panel.classList.contains('hidden')) document.getElementById('forgot-email').focus();
        });
        if(form) form.addEventListener('submit', async function(e){
          e.preventDefault();
          var btn=document.getElementById('forgot-submit');
          btn.disabled=true;
          await fetch('/admin/forgot-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:document.getElementById('forgot-email').value.trim()})}).catch(function(){});
          form.classList.add('hidden');
          done.classList.remove('hidden');
        });
      })();
      </script>`;

  return html(`<!DOCTYPE html>
<html lang="fr">
<head>${HEAD('Admin - Connexion')}</head>
<body class="bg-stone-50 min-h-screen font-sans antialiased">
<div class="min-h-screen flex items-center justify-center px-4 py-12">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <a href="/" class="inline-block">
        <span class="block mb-3" style="font-size:3.5rem;color:var(--blue)"><i class="ph ph-lock-key"></i></span>
      </a>
      <h1 class="font-display text-3xl font-bold text-stone-900">Espace Admin</h1>
      <p class="text-stone-500 mt-2 text-sm">Connexion réservée à la famille Potet</p>
    </div>
    <div class="section-panel majorelle-frame rounded-3xl shadow-xl p-8 border border-stone-100">
      ${noPassword ? notInitialised : loginForm}
    </div>
    <p class="text-center text-stone-400 text-sm mt-6">
      <a href="/" class="hover:text-sky-600 transition-colors">< Retour au blog</a>
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
<head>${HEAD('Admin - Tableau de bord')}</head>
<body class="bg-stone-50 font-sans text-stone-900 antialiased pt-16">
${ADMIN_NAV()}

<!-- Tab bar -->
<div class="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
  <div id="admin-tabs" role="tablist" aria-label="Sections de l'administration" class="flex flex-wrap gap-1.5 border-b border-stone-200 pb-0 mb-2">
    <button type="button" id="admintab-articles" role="tab" data-tab="articles" class="admin-tab" aria-selected="true" aria-controls="tab-articles"><i class="ph ph-notebook"></i> Articles</button>
    <button type="button" id="admintab-settings" role="tab" data-tab="settings" class="admin-tab" aria-selected="false" aria-controls="tab-settings" tabindex="-1"><i class="ph ph-gear"></i> Paramètres du site</button>
    <button type="button" id="admintab-account" role="tab" data-tab="account" class="admin-tab" aria-selected="false" aria-controls="tab-account" tabindex="-1"><i class="ph ph-user-circle"></i> Compte</button>
    <button type="button" id="admintab-emails" role="tab" data-tab="emails" class="admin-tab" aria-selected="false" aria-controls="tab-emails" tabindex="-1"><i class="ph ph-envelope"></i> Emails</button>
    <button type="button" id="admintab-subscribers" role="tab" data-tab="subscribers" class="admin-tab" aria-selected="false" aria-controls="tab-subscribers" tabindex="-1"><i class="ph ph-users-three"></i> Abonnés</button>
    <button type="button" id="admintab-moderation" role="tab" data-tab="moderation" class="admin-tab" aria-selected="false" aria-controls="tab-moderation" tabindex="-1"><i class="ph ph-shield-check"></i> Modération</button>
  </div>
</div>
<style>
.admin-tab{display:inline-flex;align-items:center;gap:.4rem;padding:.6rem 1rem;font-size:.85rem;font-weight:700;color:#78716c;border-bottom:2.5px solid transparent;margin-bottom:-1px;cursor:pointer;background:none;border-left:none;border-right:none;border-top:none;transition:color .12s,border-color .12s;min-height:2.75rem}
.admin-tab:hover{color:#1c1917}
.admin-tab[aria-selected="true"]{color:#0057B8;border-bottom-color:#0057B8}
.admin-tab-panel{display:none}
.admin-tab-panel.active{display:block}
</style>

<div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">

  <!-- Tab: Articles -->
  <div id="tab-articles" class="admin-tab-panel active" role="tabpanel" aria-labelledby="admintab-articles">
  <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">

    <!-- Sidebar -->
    <aside class="lg:col-span-1 space-y-5">
      <div class="section-panel majorelle-frame rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div class="flex items-center justify-between px-4 py-3 bg-stone-50 border-b border-stone-100">
          <h2 class="font-bold text-stone-700 text-sm"><i class="ph ph-folder"></i> Dossiers</h2>
          <button onclick="openFolderModal(null)" class="text-sky-600 hover:text-sky-700 text-sm font-bold transition-colors">+ Nouveau</button>
        </div>
        <div id="folder-tree" class="p-2 max-h-80 overflow-y-auto">
          <div class="text-stone-400 text-sm p-3 animate-pulse">Chargement...</div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3" id="stats-grid">
        <div class="bg-white rounded-2xl p-4 text-center border border-stone-100">
          <div id="stat-total" class="text-2xl font-black text-stone-800">-</div>
          <div class="text-xs font-bold text-stone-500 mt-1">Articles</div>
        </div>
        <div class="bg-sky-50 rounded-2xl p-4 text-center border border-sky-100">
          <div id="stat-views" class="text-2xl font-black text-sky-600">-</div>
          <div class="text-xs font-bold text-sky-700 mt-1">Vues</div>
        </div>
        <div class="bg-emerald-50 rounded-2xl p-4 text-center border border-emerald-100">
          <div id="stat-pub" class="text-2xl font-black text-emerald-600">-</div>
          <div class="text-xs font-bold text-emerald-700 mt-1">Publiés</div>
        </div>
        <div class="bg-amber-50 rounded-2xl p-4 text-center border border-amber-100">
          <div id="stat-draft" class="text-2xl font-black text-amber-600">-</div>
          <div class="text-xs font-bold text-amber-700 mt-1">Archivés</div>
        </div>
      </div>
    </aside>

    <!-- Articles list -->
    <main class="lg:col-span-3">
      <div class="flex items-center justify-between mb-6">
        <h2 class="font-display text-2xl font-bold text-stone-900">Tous les articles</h2>
         <a href="/admin/editor"
            class="action-btn-sm">
          <i class="ph ph-pencil-line"></i> Nouvel article
        </a>
      </div>
      <div id="articles-list" class="space-y-3">
        ${Array.from({length:4}).map(()=>`
          <div class="section-panel rounded-2xl border border-stone-100 p-4 flex items-center gap-4">
            <div class="w-20 h-20 rounded-xl bg-stone-200 animate-pulse flex-shrink-0"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-stone-200 rounded animate-pulse w-3/4"></div>
              <div class="h-3 bg-stone-200 rounded animate-pulse w-1/2"></div>
            </div>
          </div>`).join('')}
      </div>
    </main>
  </div>
  <!-- Tab: Subscribers -->
  <div id="tab-subscribers" class="admin-tab-panel" role="tabpanel" aria-labelledby="admintab-subscribers">
    <div class="section-panel majorelle-frame rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      <div class="px-6 py-5 border-b border-stone-100">
        <h2 class="font-bold text-stone-800 text-base"><i class="ph ph-users-three" style="color:var(--blue)"></i> Abonnés email</h2>
        <p class="text-xs text-stone-400 mt-0.5">Liste des abonnés à la newsletter; possibilité de désabonner manuellement.</p>
      </div>
      <div class="px-6 pb-6 pt-4">
        <div id="subscribers-list" class="divide-y divide-stone-100 text-sm text-stone-700">
          <div class="text-stone-400 p-6 text-center">Chargement…</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Tab: Moderation -->
  <div id="tab-moderation" class="admin-tab-panel" role="tabpanel" aria-labelledby="admintab-moderation">
    <div class="section-panel majorelle-frame rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      <div class="px-6 py-5 border-b border-stone-100">
        <h2 class="font-bold text-stone-800 text-base"><i class="ph ph-shield-check" style="color:var(--blue)"></i> Modération &amp; Commentaires</h2>
        <p class="text-xs text-stone-400 mt-0.5">Derniers commentaires publiés; supprimer ou répondre en tant qu'admin (nom configurable).</p>
      </div>
      <div class="px-6 pb-6 pt-4">
        <div id="recent-comments-list" class="divide-y divide-stone-100 text-sm text-stone-700">
          <div class="text-stone-400 p-6 text-center">Chargement…</div>
        </div>
      </div>
    </div>
  </div>
  </div>

  <!-- Tab: Site settings -->
  <div id="tab-settings" class="admin-tab-panel" role="tabpanel" aria-labelledby="admintab-settings">
  <div class="section-panel majorelle-frame rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
    <div class="px-6 py-5 border-b border-stone-100">
      <h2 class="font-bold text-stone-800 text-base"><i class="ph ph-gear" style="color:var(--blue)"></i> Contenu &amp; paramètres du site</h2>
      <p class="text-xs text-stone-400 mt-0.5">Héro (image + textes), accroche, commentaires</p>
    </div>
    <div class="px-6 pb-6 pt-2">

      <!-- Hero image -->
      <div class="mt-5">
        <label class="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide"><i class="ph ph-image"></i> Image héro (page d'accueil)</label>
        <div class="rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 p-4">
          <div class="flex flex-col sm:flex-row sm:items-center gap-3">
            <input type="file" id="s-hero-img-file" accept="image/*" class="hidden" onchange="uploadHeroImageFromSettings(this.files)">
            <button type="button" onclick="document.getElementById('s-hero-img-file').click()" class="action-btn-sm"><i class="ph ph-upload-simple"></i> Importer une image</button>
            <button type="button" id="s-hero-img-delete-btn" onclick="deleteHeroImageFromSettings()" class="action-btn-sm" style="background:rgba(220,60,60,.92)!important;border-color:rgba(220,60,60,.92)!important;display:none"><i class="ph ph-trash"></i> Supprimer</button>
            <p class="text-xs text-stone-500 font-medium">L'image est stockée dans le bucket photos puis utilisée sur la page d'accueil.</p>
          </div>
          <input type="hidden" id="s-hero-img">
        </div>
        <div id="s-hero-img-preview" class="hidden mt-2">
          <img id="s-hero-img-el" src="" alt="" class="w-full h-28 object-cover rounded-xl">
        </div>
      </div>

      <!-- Hero texts -->
      <p class="text-xs font-black text-stone-400 uppercase tracking-wider mt-6 mb-3">Textes de la page d'accueil</p>
      <div class="grid sm:grid-cols-2 gap-5">
        <div>
          <label class="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide"><i class="ph ph-tag"></i> Sur-titre (eyebrow)</label>
          <input type="text" id="s-hero-eyebrow" placeholder="Carnet de bord de la famille Potet" class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm">
        </div>
        <div>
          <label class="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide"><i class="ph ph-seal-warning"></i> Badge (citation drame)</label>
          <input type="text" id="s-hero-badge" placeholder="&quot;Mais ça c'était bien avant le drame...&quot;" class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm">
        </div>
        <div class="sm:col-span-2">
          <label class="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide"><i class="ph ph-text-t"></i> Titre héro <span class="font-normal normal-case text-stone-400">(HTML autorisé : &lt;em&gt;, &lt;br&gt;)</span></label>
          <input type="text" id="s-hero-title" placeholder="Nos voyages en famille…" class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm">
        </div>
        <div class="sm:col-span-2">
          <label class="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide"><i class="ph ph-chat-text"></i> Sous-titre héro</label>
          <textarea id="s-hero-subtitle" rows="2" placeholder="Chaque article raconte un voyage vécu…" class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm resize-none"></textarea>
        </div>
        <div>
          <label class="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide"><i class="ph ph-cursor-click"></i> Bouton principal</label>
          <input type="text" id="s-hero-cta-primary" placeholder="Explorer nos voyages" class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm">
        </div>
        <div>
          <label class="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide"><i class="ph ph-cursor"></i> Bouton secondaire <span class="font-normal normal-case text-stone-400">(non affiché)</span></label>
          <input type="text" id="s-hero-cta-secondary" placeholder="Parcourir le carnet" class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm">
        </div>
        <div class="sm:col-span-2">
          <label class="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide"><i class="ph ph-quotes"></i> Accroche du site (citation en bas de page)</label>
          <input type="text" id="s-tagline" placeholder="Le voyage en famille enrichit…" class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm">
        </div>
      </div>

      <!-- Comment gate -->
      <p class="text-xs font-black text-stone-400 uppercase tracking-wider mt-6 mb-3">Commentaires — question anti-spam</p>
      <div class="grid sm:grid-cols-2 gap-5">
        <div class="sm:col-span-2">
          <label class="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide"><i class="ph ph-shield-check"></i> Question secrète</label>
          <input type="text" id="s-gate-question" placeholder="Quel est le nom du chat roux de la famille Potet ?" class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm">
        </div>
        <div>
          <label class="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide"><i class="ph ph-key"></i> Réponse attendue</label>
          <input type="text" id="s-gate-answer" placeholder="wifi" autocomplete="off" class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm">
          <p class="text-xs text-stone-400 mt-1">Comparaison insensible à la casse et aux espaces.</p>
        </div>
      </div>

      <!-- Admin display name -->
      <div class="mt-4">
        <label class="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide"><i class="ph ph-user-circle-gear"></i> Nom affiché par l'admin (réponses aux commentaires)</label>
        <input type="text" id="s-admin-display-name" placeholder="Damien Potet" class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm">
        <p class="text-xs text-stone-400 mt-1">Nom utilisé lors des réponses aux commentaires.</p>
      </div>

      <div class="mt-6 flex justify-end">
        <button onclick="saveSettings()" class="action-btn-sm"><i class="ph ph-floppy-disk"></i> Sauvegarder les paramètres</button>
      </div>
    </div>
  </div>
  </div>




  <!-- Tab: Account -->
  <div id="tab-account" class="admin-tab-panel" role="tabpanel" aria-labelledby="admintab-account">
  <div class="section-panel majorelle-frame rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
    <div class="px-6 py-5 border-b border-stone-100">
      <h2 class="font-bold text-stone-800 text-base"><i class="ph ph-user-circle" style="color:var(--blue)"></i> Compte administrateur</h2>
      <p class="text-xs text-stone-400 mt-0.5">Adresse email &amp; mot de passe</p>
    </div>
    <div class="px-6 pb-6 pt-2">

      <!-- Email -->
      <p class="text-xs font-black text-stone-400 uppercase tracking-wider mt-5 mb-3">Adresse email</p>
      <div class="rounded-2xl border border-stone-100 bg-stone-50 p-4">
        <p class="text-sm text-stone-600 mb-1">Adresse actuelle : <strong id="acc-current-email" class="text-stone-800">…</strong></p>
        <p id="acc-pending" class="hidden text-xs text-amber-700 mb-3"><i class="ph-fill ph-clock"></i> Confirmation en attente à <strong id="acc-pending-email"></strong></p>
        <div class="grid sm:grid-cols-[1fr_auto] gap-3 mt-3">
          <input type="email" id="acc-new-email" placeholder="nouvelle@adresse.fr" autocomplete="off"
                 class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm">
          <button onclick="requestEmailChange()" class="action-btn-sm whitespace-nowrap"><i class="ph ph-paper-plane-tilt"></i> Demander le changement</button>
        </div>
        <p class="text-xs text-stone-400 mt-2">Un email de confirmation sera envoyé à la nouvelle adresse. Le changement ne prend effet qu'après confirmation.</p>
      </div>

      <!-- Password -->
      <p class="text-xs font-black text-stone-400 uppercase tracking-wider mt-6 mb-3">Mot de passe</p>
      <div class="rounded-2xl border border-stone-100 bg-stone-50 p-4">
        <div class="grid sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wide" for="acc-cur-pw">Actuel</label>
            <input type="password" id="acc-cur-pw" autocomplete="current-password" placeholder="••••••••" class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wide" for="acc-new-pw">Nouveau</label>
            <input type="password" id="acc-new-pw" autocomplete="new-password" placeholder="8 caractères min." class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wide" for="acc-new-pw2">Confirmer</label>
            <input type="password" id="acc-new-pw2" autocomplete="new-password" placeholder="••••••••" class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm">
          </div>
        </div>
        <div class="mt-4 flex justify-end">
          <button onclick="changePassword()" class="action-btn-sm"><i class="ph ph-key"></i> Modifier le mot de passe</button>
        </div>
      </div>

    </div>
  </div>
  </div>

  <!-- Tab: Emails -->
  <div id="tab-emails" class="admin-tab-panel" role="tabpanel" aria-labelledby="admintab-emails">
  <div class="space-y-5">

    <!-- Mailjet sender setup -->
    <div class="section-panel majorelle-frame rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      <div class="px-6 py-5 border-b border-stone-100">
        <h2 class="font-bold text-stone-800 text-base"><i class="ph ph-paper-plane-tilt" style="color:var(--blue)"></i> Envoi des emails (Mailjet)</h2>
        <p class="text-xs text-stone-400 mt-0.5">Aucun nom de domaine requis : il suffit de vérifier votre propre adresse email (même @free.fr, @gmail.com...) pour pouvoir envoyer vers n'importe quelle boîte mail.</p>
      </div>
      <div class="px-6 pb-6 pt-4">
        <div id="email-config-status" class="text-sm text-stone-500 mb-5">Chargement…</div>

        <details class="rounded-xl border border-stone-100 bg-stone-50 mb-5">
          <summary class="px-4 py-3 cursor-pointer list-none select-none text-sm font-bold text-stone-700 flex items-center gap-2"><i class="ph ph-lightbulb" style="color:var(--blue)"></i> Comment configurer Mailjet (5 minutes) <span class="text-stone-400 font-normal ml-auto text-xs">Cliquer pour ouvrir ▾</span></summary>
          <ol class="px-4 pb-4 text-sm text-stone-600 space-y-2 list-decimal list-inside">
            <li>Créez un compte gratuit sur <strong>mailjet.com</strong> (bouton "S'inscrire", gratuit jusqu'à 6000 emails/mois - 200/jour, aucune carte bancaire requise).</li>
            <li>Une fois connecté, allez dans <strong>Compte → Clés API REST</strong> (ou "API Key Management") pour récupérer votre <strong>API Key</strong> et votre <strong>Secret Key</strong>.</li>
            <li>Renseignez ci-dessous ces deux clés, l'adresse email à utiliser pour l'envoi (ex: votre adresse @free.fr) et le nom affiché, puis cliquez sur <strong>Enregistrer</strong>.</li>
            <li>Cliquez ensuite sur <strong>Envoyer l'email de vérification</strong> ci-dessous — Mailjet envoie un lien de confirmation à cette adresse.</li>
            <li>Ouvrez votre boîte mail et cliquez sur le lien reçu (page "Domaines et expéditeurs" chez Mailjet).</li>
            <li>Revenez ici et cliquez sur <strong>Vérifier le statut</strong> pour confirmer que tout est actif.</li>
          </ol>
        </details>

        <div class="grid gap-4">
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wide">Clé API (API Key)</label>
              <input type="password" id="ec-api-key" placeholder="Clé API Mailjet" autocomplete="off" class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm font-mono">
              <p id="ec-api-key-current" class="text-xs text-stone-400 mt-1"></p>
            </div>
            <div>
              <label class="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wide">Clé secrète (Secret Key)</label>
              <input type="password" id="ec-api-secret" placeholder="Clé secrète Mailjet" autocomplete="off" class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm font-mono">
              <p id="ec-api-secret-current" class="text-xs text-stone-400 mt-1"></p>
            </div>
          </div>
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wide">Adresse expéditrice</label>
              <input type="email" id="ec-from-address" placeholder="votreadresse@exemple.fr" autocomplete="off" class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm">
            </div>
            <div>
              <label class="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wide">Nom affiché</label>
              <input type="text" id="ec-from-name" placeholder="Tranquille, on est en vacances" autocomplete="off" class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm">
            </div>
          </div>
        </div>
        <div class="mt-4 flex flex-wrap gap-2 justify-end">
          <button onclick="requestSenderVerification()" class="subtle-btn text-sm"><i class="ph ph-paper-plane-tilt"></i> Envoyer l'email de vérification</button>
          <button onclick="checkSenderStatus()" class="subtle-btn text-sm"><i class="ph ph-arrow-clockwise"></i> Vérifier le statut</button>
          <button onclick="saveEmailConfig()" class="action-btn-sm"><i class="ph ph-floppy-disk"></i> Enregistrer</button>
        </div>
      </div>
    </div>

    <!-- Send history -->
    <div class="section-panel majorelle-frame rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      <div class="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
        <div>
          <h2 class="font-bold text-stone-800 text-base"><i class="ph ph-clock-counter-clockwise" style="color:var(--blue)"></i> Historique des envois</h2>
          <p class="text-xs text-stone-400 mt-0.5">Les 50 derniers emails administrateur (setup, réinitialisation, changement d'adresse...)</p>
        </div>
        <button onclick="loadEmailLog()" class="text-sky-600 hover:text-sky-700 text-sm font-bold transition-colors"><i class="ph ph-arrow-clockwise"></i></button>
      </div>
      <div id="email-log-list" class="divide-y divide-stone-100">
        <div class="text-stone-400 text-sm p-6 animate-pulse text-center">Chargement…</div>
      </div>
    </div>

  </div>
  </div>

</div>

<!-- Folder modal -->
<div id="folder-modal" class="hidden fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onclick="if(event.target===this)closeFolderModal()">
  <div class="section-panel majorelle-frame rounded-3xl shadow-2xl w-full max-w-sm p-6">
    <h3 class="font-display text-xl font-bold text-stone-900 mb-5"><i class="ph ph-folder-plus"></i> Nouveau dossier</h3>
    <div class="space-y-4 mb-6">
      <div>
        <label class="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wide">Nom</label>
        <input type="text" id="fm-name" placeholder="Ex: Asie du Sud-Est" class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm font-medium">
      </div>
      <div>
        <label class="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wide">Pays / Icône</label>
        <select id="fm-icon" class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm bg-white">
          <option value="📁">📁 Dossier générique</option>
          <option value="🌏">🌏 Monde</option>
          <option value="🇫🇷">🇫🇷 France</option>
          <option value="🇪🇸">🇪🇸 Espagne</option>
          <option value="🇮🇹">🇮🇹 Italie</option>
          <option value="🇵🇹">🇵🇹 Portugal</option>
          <option value="🇬🇷">🇬🇷 Grèce</option>
          <option value="🇹🇷">🇹🇷 Turquie</option>
          <option value="🇲🇦">🇲🇦 Maroc</option>
          <option value="🇹🇳">🇹🇳 Tunisie</option>
          <option value="🇩🇿">🇩🇿 Algérie</option>
          <option value="🇲🇷">🇲🇷 Mauritanie</option>
          <option value="🇸🇳">🇸🇳 Sénégal</option>
          <option value="🇪🇬">🇪🇬 Égypte</option>
          <option value="🇯🇴">🇯🇴 Jordanie</option>
          <option value="🇸🇦">🇸🇦 Arabie saoudite</option>
          <option value="🇦🇪">🇦🇪 Émirats arabes unis</option>
          <option value="🇴🇲">🇴🇲 Oman</option>
          <option value="🇮🇳">🇮🇳 Inde</option>
          <option value="🇹🇭">🇹🇭 Thaïlande</option>
          <option value="🇻🇳">🇻🇳 Vietnam</option>
          <option value="🇮🇩">🇮🇩 Indonésie</option>
          <option value="🇯🇵">🇯🇵 Japon</option>
          <option value="🇨🇳">🇨🇳 Chine</option>
          <option value="🇲🇻">🇲🇻 Maldives</option>
          <option value="🇿🇦">🇿🇦 Afrique du Sud</option>
          <option value="🇰🇪">🇰🇪 Kenya</option>
          <option value="🇺🇸">🇺🇸 États-Unis</option>
          <option value="🇨🇦">🇨🇦 Canada</option>
          <option value="🇲🇽">🇲🇽 Mexique</option>
          <option value="🇧🇷">🇧🇷 Brésil</option>
          <option value="🇦🇷">🇦🇷 Argentine</option>
          <option value="🇦🇺">🇦🇺 Australie</option>
          <option value="🇳🇿">🇳🇿 Nouvelle-Zélande</option>
          <option value="🇮🇸">🇮🇸 Islande</option>
          <option value="🇳🇴">🇳🇴 Norvège</option>
          <option value="🇩🇪">🇩🇪 Allemagne</option>
          <option value="🇨🇭">🇨🇭 Suisse</option>
          <option value="🇧🇪">🇧🇪 Belgique</option>
          <option value="🇳🇱">🇳🇱 Pays-Bas</option>
        </select>
      </div>
    </div>
    <div class="flex gap-3">
      <button onclick="closeFolderModal()" class="flex-1 bg-stone-100 text-stone-700 font-bold py-2.5 rounded-xl hover:bg-stone-200 transition-colors text-sm">Annuler</button>
      <button onclick="submitFolder()" class="flex-1 action-btn-sm">Créer <i class="ph ph-check"></i></button>
    </div>
  </div>
</div>

${TOAST}
<script>
let _folderParentId = null;

function toast(msg,type='ok'){const i=document.getElementById('toast-icon'),m=document.getElementById('toast-msg'),el=document.getElementById('toast');i.innerHTML=type==='ok'?'<i class="ph-fill ph-check-circle" style="color:var(--palm);font-size:1.25rem"></i>':type==='err'?'<i class="ph-fill ph-x-circle" style="color:#dc3c3c;font-size:1.25rem"></i>':'<i class="ph-fill ph-info" style="color:var(--blue);font-size:1.25rem"></i>';m.textContent=msg;el.classList.remove('hidden');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.add('hidden'),3000)}
function esc(s){return (s==null? '': String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function stripDataUris(html){return(html||'').replace(/\bsrc="data:[^"]*"/g,'src=""').replace(/\bsrc='data:[^']*'/g,"src=''");}
function flagImg(icon){if(!icon)return '';const cp=[...icon].map(c=>c.codePointAt(0));if(cp.length>=2&&cp[0]>=0x1F1E6&&cp[0]<=0x1F1FF&&cp[1]>=0x1F1E6&&cp[1]<=0x1F1FF){const code=[cp[0],cp[1]].map(c=>String.fromCodePoint(c-0x1F1E6+65)).join('').toLowerCase();return '<img src="https://flagcdn.com/w20/'+code+'.png" width="20" height="15" alt="'+code.toUpperCase()+'" style="vertical-align:middle;border-radius:2px;flex-shrink:0">';}return '<span>'+icon+'</span>';}
function fmtDate(d){return new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}
function fmtDateRange(a){
  const start = a.start_date || a.date;
  const end = a.end_date || a.date;
  if (!start) return 'Dates non définies';
  return start === end ? fmtDate(start) : fmtDate(start) + ' - ' + fmtDate(end);
}

// ── Load dashboard data ───────────────────────────────────────
async function init() {
  const [folders, artData] = await Promise.all([
    fetch('/api/folders').then(r=>r.json()).catch(()=>[]),
    fetch('/api/articles?limit=100').then(r=>r.json()).catch(()=>({articles:[]})),
  ]);

  document.getElementById('folder-tree').innerHTML = renderFolderTree(folders, null);
  document.getElementById('stat-total').textContent = artData.articles.length;
  document.getElementById('stat-pub').textContent = artData.articles.filter(a=>a.status==='published').length;
  document.getElementById('stat-draft').textContent = artData.articles.filter(a=>a.status==='draft'||a.status==='archived').length;
  document.getElementById('stat-views').textContent = artData.articles.reduce((s,a)=>s+(a.view_count||0),0);
  renderArticles(artData.articles, folders);

  // Pré-chargement en cache de l'éditeur pour tous les articles < 1 an (édition hors-ligne)
  if (navigator.onLine) {
    // Cache le shell de création d'article (nouvel article hors-ligne)
    fetch('/admin/editor').catch(() => {});
    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    artData.articles
      .filter(a => { const d = new Date(a.end_date || a.start_date || a.date).getTime(); return !isNaN(d) && d > oneYearAgo; })
      .forEach((a, i) => {
        setTimeout(() => {
          fetch('/admin/editor/' + a.id).catch(() => {});
          fetch('/api/articles/' + a.id).catch(() => {});
        }, i * 400);
      });
  }
}

function renderFolderTree(folders, parentId, depth=0) {
  const kids = folders.filter(f => f.parent_id === parentId);
  if (!kids.length) return depth===0
    ? '<div class="text-center py-8 px-3"><i class="ph ph-folder-dashed" style="font-size:2rem;display:block;margin-bottom:.4rem;color:var(--ink-light)"></i><p class="text-sm font-semibold" style="color:var(--ink)">Aucun dossier</p><p class="text-xs text-stone-400">Créez-en un avec « + Nouveau ».</p></div>'
    : '';
  return kids.map(f => \`
    <div style="padding-left:\${depth*14}px">
      <div class="flex items-center justify-between px-3 py-2 rounded-xl group hover:bg-sky-50 transition-colors">
        <a href="/voyages?folder=\${f.slug}" class="flex items-center gap-2 flex-1 text-sm font-semibold text-stone-700 hover:text-sky-600 transition-colors">
          <span class="flex-shrink-0">\${flagImg(f.icon)}</span><span>\${esc(f.name)}</span>
        </a>
        <div class="flex items-center gap-1 ml-2">
          <button data-action="open-folder-modal" data-id="\${f.id}" class="text-stone-400 hover:text-sky-600 active:text-sky-700 p-2.5 text-base touch-manipulation rounded-lg min-w-[2.75rem] min-h-[2.75rem] flex items-center justify-center hover:bg-sky-50 transition-colors" title="Ajouter un sous-dossier"><i class="ph ph-folder-plus"></i></button>
          <button data-action="del-folder" data-id="\${f.id}" class="text-stone-400 hover:text-red-500 active:text-red-600 p-2.5 text-base touch-manipulation rounded-lg min-w-[2.75rem] min-h-[2.75rem] flex items-center justify-center hover:bg-red-50 transition-colors" title="Supprimer ce dossier"><i class="ph ph-trash"></i></button>
        </div>
      </div>
      \${renderFolderTree(folders, f.id, depth+1)}
    </div>\`).join('');
}

function renderArticles(arts, folders) {
  if (!arts.length) {
    document.getElementById('articles-list').innerHTML =
      '<div class="section-panel rounded-2xl border border-stone-100 text-center py-16 px-6">' +
      '<i class="ph ph-notebook" style="font-size:3rem;display:block;margin-bottom:.75rem;color:var(--ink-light)"></i>' +
      '<p class="text-base font-semibold mb-1" style="color:var(--ink)">Aucun article pour l’instant</p>' +
      '<p class="text-sm text-stone-400 mb-4">Commencez par écrire votre premier récit de voyage.</p>' +
      '<a href="/admin/editor" class="action-btn-sm"><i class="ph ph-pencil-line"></i> Nouvel article</a>' +
      '</div>';
    return;
  }
  const STATUS_META = {
    published:           { label: 'Publié',                badge: 'badge-published' },
    archived:             { label: 'Archivé',                badge: 'badge-draft' },
    draft:                { label: 'Brouillon',              badge: 'badge-draft' },
    publish_when_online:  { label: '⏳ Publier dès connexion', badge: 'badge-pending' },
  };
  document.getElementById('articles-list').innerHTML = arts.map(a => {
    const isPub = a.status === 'published';
    // The quick toggle only ever flips between published <-> archived (see
    // patchArticleStatus server-side) — draft / publish_when_online articles
    // must be changed via the editor's status selector instead, so the
    // button reflects that rather than offering a misleading force-publish.
    const canToggle = a.status === 'published' || a.status === 'archived';
    const toggleLabel = isPub ? '<i class="ph ph-lock-simple"></i> Archiver' : '<i class="ph ph-rocket-launch"></i> Publier';
    const toggleCls = isPub ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50';
    const meta = STATUS_META[a.status] || STATUS_META.archived;
    return \`
    <div class="bg-white rounded-2xl border border-stone-100 overflow-hidden hover:shadow-md transition-shadow">
      <div class="flex gap-4 p-4">
        <img src="\${esc(a.cover_url||'')}" alt="\${esc(a.title)}" class="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover flex-shrink-0" data-fallback="https://picsum.photos/seed/\${a.id}z/200/200">
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2 mb-1.5">
            <h3 class="font-bold text-stone-900 text-sm sm:text-base leading-snug">\${esc(a.title)}</h3>
            <span class="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 \${meta.badge}">\${meta.label}</span>
          </div>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-400">
            <span><i class="ph ph-calendar-blank"></i> \${fmtDateRange(a)}</span>
            \${a.destination ? \`<span><i class="ph ph-map-pin"></i> \${esc(a.destination)}</span>\` : ''}
            \${a.folder_name ? \`<span>\${esc(a.folder_icon||'')} \${esc(a.folder_name)}</span>\` : ''}
            \${a.view_count ? \`<span><i class="ph ph-eye"></i> \${a.view_count} vue\${a.view_count>1?'s':''}</span>\` : ''}
          </div>
        </div>
      </div>
      <div class="border-t border-stone-50 flex items-center gap-1 px-3 py-2">
        \${canToggle ? \`<button data-action="toggle-status" data-id="\${a.id}" data-status="\${a.status}" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors \${toggleCls}">\${toggleLabel}</button>\` : ''}
        <a href="/admin/editor/\${a.id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"><i class="ph ph-pencil"></i> Modifier</a>
        <a href="/voyage/\${a.slug}" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-400 hover:bg-stone-50 rounded-lg transition-colors"><i class="ph ph-eye"></i> Voir</a>
        <button data-action="del-article" data-id="\${a.id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-50 rounded-lg transition-colors ml-auto touch-manipulation"><i class="ph ph-trash"></i></button>
      </div>
    </div>\`;
  }).join('');
}

async function toggleStatus(id, current) {
  const res = await fetch(\`/api/articles/\${id}/status\`, {method:'PATCH'});
  if (res.ok) { toast(current==='published'?'Archivé':'Article publié !','ok'); await init(); }
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
  const h=document.querySelector('#folder-modal h3');
  if(h) h.innerHTML=(parentId?'<i class="ph ph-folder-plus"></i> Nouveau sous-dossier':'<i class="ph ph-folder-plus"></i> Nouveau dossier');
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

// ── Site settings ─────────────────────────────────────────────
async function loadSettings() {
  const s = await fetch('/api/settings').then(r=>r.json()).catch(()=>({}));
  document.getElementById('s-hero-img').value       = s.hero_image_url    || '';
  document.getElementById('s-hero-eyebrow').value   = s.hero_eyebrow      || '';
  document.getElementById('s-hero-badge').value     = s.hero_badge        || '';
  document.getElementById('s-hero-title').value     = s.hero_title        || '';
  document.getElementById('s-hero-subtitle').value  = s.hero_subtitle     || '';
  document.getElementById('s-hero-cta-primary').value   = s.hero_cta_primary   || '';
  document.getElementById('s-hero-cta-secondary').value = s.hero_cta_secondary || '';
  document.getElementById('s-tagline').value        = s.site_tagline      || '';
  document.getElementById('s-gate-question').value  = s.comment_gate_question || '';
  document.getElementById('s-gate-answer').value    = s.comment_gate_answer   || '';
  document.getElementById('s-admin-display-name').value = s.admin_display_name || 'Damien Potet';
  previewHeroImg(s.hero_image_url || '');
}
function previewHeroImg(url) {
  const wrap = document.getElementById('s-hero-img-preview');
  const img  = document.getElementById('s-hero-img-el');
  const btn  = document.getElementById('s-hero-img-delete-btn');
  if (url) {
    wrap.classList.remove('hidden');
    img.src = url;
    btn.style.display = '';
  } else {
    wrap.classList.add('hidden');
    btn.style.display = 'none';
  }
}
async function uploadHeroImageFromSettings(files) {
  const file = files && files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('image', file);
  toast("Upload de l'image héro...", 'info');
  const res = await fetch('/api/settings/hero-image', { method:'POST', body: fd }).catch(()=>null);
  const data = await res?.json().catch(()=>null);
  if (!res?.ok || !data?.url) {
    toast(data?.error || 'Erreur upload image héro', 'err');
    return;
  }
  document.getElementById('s-hero-img').value = data.url;
  previewHeroImg(data.url);
  toast('Image héro importée !', 'ok');
}
async function deleteHeroImageFromSettings() {
  if (!confirm("Êtes-vous sûr de vouloir supprimer l'image héro ?")) return;
  toast("Suppression de l'image héro...", 'info');
  const res = await fetch('/api/settings/hero-image', { method:'DELETE' }).catch(()=>null);
  const data = await res?.json().catch(()=>null);
  if (!res?.ok || !data?.success) {
    toast(data?.error || 'Erreur suppression', 'err');
    return;
  }
  document.getElementById('s-hero-img').value = '';
  previewHeroImg('');
  toast('Image héro supprimée !', 'ok');
}
async function saveSettings() {
  const body = {
    hero_image_url:      document.getElementById('s-hero-img').value.trim(),
    hero_eyebrow:        document.getElementById('s-hero-eyebrow').value.trim(),
    hero_badge:          document.getElementById('s-hero-badge').value.trim(),
    hero_title:          document.getElementById('s-hero-title').value.trim(),
    hero_subtitle:       document.getElementById('s-hero-subtitle').value.trim(),
    hero_cta_primary:    document.getElementById('s-hero-cta-primary').value.trim(),
    hero_cta_secondary:  document.getElementById('s-hero-cta-secondary').value.trim(),
    site_tagline:        document.getElementById('s-tagline').value.trim(),
    comment_gate_question: document.getElementById('s-gate-question').value.trim(),
    comment_gate_answer:   document.getElementById('s-gate-answer').value.trim(),
    admin_display_name:    document.getElementById('s-admin-display-name').value.trim(),
  };
  const res = await fetch('/api/settings', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
  if (res.ok) toast('Paramètres sauvegardés !','ok');
  else        toast('Erreur','err');
}

// ── Account (credentials) ─────────────────────────────────────
async function loadAccount() {
  const a = await fetch('/api/admin/account').then(r=>r.json()).catch(()=>null);
  if (!a) return;
  const cur = document.getElementById('acc-current-email');
  if (cur) cur.textContent = a.email || '—';
  const pend = document.getElementById('acc-pending');
  const pendEmail = document.getElementById('acc-pending-email');
  if (a.pending_email) {
    if (pendEmail) pendEmail.textContent = a.pending_email;
    if (pend) pend.classList.remove('hidden');
  } else if (pend) {
    pend.classList.add('hidden');
  }
}
async function requestEmailChange() {
  const input = document.getElementById('acc-new-email');
  const email = (input?.value || '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast('Adresse email invalide','err'); return; }
  const res = await fetch('/api/admin/request-email-change', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({new_email:email})}).catch(()=>null);
  const data = await res?.json().catch(()=>null);
  if (res && res.ok && data?.email_sent) {
    toast('Email de confirmation envoyé à '+email,'ok');
    input.value='';
    loadAccount();
  } else if (res && res.ok) {
    // The pending_email row was saved, but the actual send failed (e.g. no
    // verified domain) - say so instead of a false "email sent" toast.
    toast("Changement enregistré mais l'email n'a pas pu être envoyé : "+(data?.email_error||'erreur inconnue')+'. Voir l’onglet Emails.','err');
    input.value='';
    loadAccount();
  } else {
    toast((data&&data.error)||'Erreur','err');
  }
}
async function changePassword() {
  const cur = document.getElementById('acc-cur-pw');
  const pw = document.getElementById('acc-new-pw');
  const pw2 = document.getElementById('acc-new-pw2');
  const current_password = cur.value;
  const new_password = pw.value;
  if (!current_password) { toast('Saisissez votre mot de passe actuel','err'); return; }
  if (new_password.length < 8) { toast('Le nouveau mot de passe doit contenir au moins 8 caractères','err'); return; }
  if (new_password !== pw2.value) { toast('Les deux mots de passe ne correspondent pas','err'); return; }
  const res = await fetch('/api/admin/change-password', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({current_password,new_password})}).catch(()=>null);
  const data = await res?.json().catch(()=>null);
  if (res && res.ok) {
    toast('Mot de passe modifié !','ok');
    cur.value=''; pw.value=''; pw2.value='';
  } else {
    toast((data&&data.error)||'Erreur','err');
  }
}

// ── Emails tab: Mailjet sender setup + send history ─────────────
function senderStatusBadge(verified) {
  if (verified === true)  return '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style="background:#f0fdf4;color:var(--palm)"><i class="ph ph-check-circle"></i> Vérifié</span>';
  if (verified === false) return '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style="background:#fef2f2;color:#dc3c3c"><i class="ph ph-x-circle"></i> Non vérifié</span>';
  return '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style="background:#f5f5f4;color:#78716c"><i class="ph ph-circle-dashed"></i> Inconnu</span>';
}
async function loadEmailConfigStatus() {
  const box = document.getElementById('email-config-status');
  const data = await fetch('/api/admin/email-config').then(r=>r.json()).catch(()=>null);
  if (!data) { box.innerHTML = '<p class="text-red-500 text-sm">Erreur de chargement.</p>'; return; }
  document.getElementById('ec-from-address').value = data.from_address || '';
  document.getElementById('ec-from-name').value = data.from_name || '';
  document.getElementById('ec-api-key-current').textContent = data.api_key_masked
    ? 'Clé actuellement enregistrée : ' + data.api_key_masked + ' (laissez le champ vide pour la conserver)'
    : 'Aucune clé enregistrée pour le moment.';
  document.getElementById('ec-api-secret-current').textContent = data.api_secret_masked
    ? 'Clé actuellement enregistrée : ' + data.api_secret_masked + ' (laissez le champ vide pour la conserver)'
    : 'Aucune clé enregistrée pour le moment.';
  if (!data.api_key_configured || !data.from_address) {
    box.innerHTML = '<p class="text-sm text-stone-500"><i class="ph ph-info"></i> Configuration incomplète — aucun email ne peut être envoyé tant que les clés API et l\\'adresse expéditrice ne sont pas enregistrées ci-dessous.</p>';
    return;
  }
  box.innerHTML = '<div class="flex items-center gap-2 flex-wrap"><strong class="text-stone-800">'+esc(data.from_address)+'</strong> '+senderStatusBadge(data.sender_verified)+'</div>' +
    (data.sender_verified===false ? '<p class="text-xs text-amber-700 mt-2"><i class="ph ph-warning"></i> Cette adresse n\\'est pas encore vérifiée sur Mailjet. Cliquez sur « Envoyer l\\'email de vérification » puis suivez le lien reçu.</p>' : '');
}
async function saveEmailConfig() {
  const apiKey = (document.getElementById('ec-api-key')?.value||'').trim();
  const apiSecret = (document.getElementById('ec-api-secret')?.value||'').trim();
  const fromAddress = (document.getElementById('ec-from-address')?.value||'').trim();
  const fromName = (document.getElementById('ec-from-name')?.value||'').trim();
  if (fromAddress && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fromAddress)) { toast('Adresse email invalide','err'); return; }
  const res = await fetch('/api/admin/email-config', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({api_key:apiKey,api_secret:apiSecret,from_address:fromAddress,from_name:fromName})}).catch(()=>null);
  const data = await res?.json().catch(()=>null);
  if (res && res.ok) {
    toast('Configuration enregistrée !','ok');
    document.getElementById('ec-api-key').value = '';
    document.getElementById('ec-api-secret').value = '';
    loadEmailConfigStatus();
  } else toast((data&&data.error)||'Erreur','err');
}
async function requestSenderVerification() {
  toast('Envoi de l\\'email de vérification...','info');
  const res = await fetch('/api/admin/email-config/verify', {method:'POST'}).catch(()=>null);
  const data = await res?.json().catch(()=>null);
  if (res && res.ok) toast(data.message || 'Email de vérification envoyé !','ok');
  else toast((data&&data.error)||'Erreur','err');
}
async function checkSenderStatus() {
  toast('Vérification en cours...','info');
  const res = await fetch('/api/admin/email-config/check', {method:'POST'}).catch(()=>null);
  const data = await res?.json().catch(()=>null);
  if (res && res.ok) {
    toast(data.sender_verified ? 'Adresse vérifiée !' : (data.found ? 'Toujours non vérifiée — cliquez le lien reçu par email.' : 'Adresse pas encore soumise — cliquez « Envoyer l\\'email de vérification » d\\'abord.'), data.sender_verified?'ok':'info');
    loadEmailConfigStatus();
  } else toast((data&&data.error)||'Erreur','err');
}
const EMAIL_TYPE_LABEL = { setup: 'Configuration initiale', reset: 'Réinitialisation mot de passe', email_change: 'Changement d\\'adresse', password_changed: 'Mot de passe modifié (notification)' };
function fmtLogDate(d){try{return new Date((d||'').replace(' ','T')+'Z').toLocaleString('fr-FR',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}catch(e){return d||''}}
async function loadEmailLog() {
  const box = document.getElementById('email-log-list');
  box.innerHTML = '<div class="text-stone-400 text-sm p-6 animate-pulse text-center">Chargement…</div>';
  const data = await fetch('/api/admin/email-log').then(r=>r.json()).catch(()=>null);
  const entries = data?.entries || [];
  if (!entries.length) { box.innerHTML = '<div class="text-stone-400 text-sm p-6 text-center">Aucun email envoyé pour le moment.</div>'; return; }
  box.innerHTML = entries.map(e => {
    const ok = !!e.ok;
    return '<div class="flex items-start gap-3 px-6 py-3.5">' +
      '<i class="ph-fill '+(ok?'ph-check-circle':'ph-x-circle')+'" style="font-size:1.15rem;color:'+(ok?'var(--palm)':'#dc3c3c')+';margin-top:.1rem;flex-shrink:0"></i>' +
      '<div class="flex-1 min-w-0"><div class="flex items-center justify-between gap-2"><span class="text-sm font-semibold text-stone-800">'+esc(EMAIL_TYPE_LABEL[e.email_type]||e.email_type)+'</span><span class="text-xs text-stone-400 whitespace-nowrap">'+fmtLogDate(e.created_at)+'</span></div>' +
      '<p class="text-xs text-stone-500 mt-0.5">Vers '+esc(e.recipient)+'</p>' +
      (!ok && e.error ? '<p class="text-xs text-red-500 mt-1">'+esc(e.error)+'</p>' : '') +
      '</div></div>';
  }).join('');
}

// ── Subscribers (admin) ───────────────────────────────────────
async function loadSubscribers() {
  const box = document.getElementById('subscribers-list');
  if (!box) return;
  box.innerHTML = '<div class="text-stone-400 p-6 text-center">Chargement…</div>';
  const data = await fetch('/api/admin/email-subscribers').then(r=>r.json()).catch(()=>null);
  const subs = data?.subscribers || [];
  if (!subs.length) { box.innerHTML = '<div class="text-stone-400 p-6 text-center">Aucun abonné pour le moment.</div>'; return; }
  box.innerHTML = subs.map(s => {
    return '<div class="flex items-center justify-between px-6 py-3.5">'
      + '<div><div class="text-sm font-semibold text-stone-800">' + esc(s.email) + '</div>'
      + '<div class="text-xs text-stone-500">Abonné le ' + fmtDate(s.created_at) + '</div></div>'
      + '<div><button data-id="' + s.id + '" class="subtle-btn" data-action="admin-unsubscribe">Désabonner</button></div></div>';
  }).join('');
}

document.addEventListener('click', async (e) => {
  const u = e.target.closest('[data-action="admin-unsubscribe"]');
  if (u) {
    const id = parseInt(u.dataset.id);
    if (!confirm('Désabonner cet utilisateur ?')) return;
    const res = await fetch('/api/admin/email-subscribers/'+id, { method: 'DELETE' });
    if (res.ok) { toast('Abonné désabonné','ok'); loadSubscribers(); } else toast('Erreur','err');
  }
});

// ── Moderation / comments (admin) ─────────────────────────────
async function loadRecentComments() {
  const box = document.getElementById('recent-comments-list');
  if (!box) return;
  box.innerHTML = '<div class="text-stone-400 p-6 text-center">Chargement…</div>';
  const data = await fetch('/api/admin/comments/recent').then(r=>r.json()).catch(()=>null);
  const comments = data?.comments || [];
  if (!comments.length) { box.innerHTML = '<div class="text-stone-400 p-6 text-center">Aucun commentaire récent.</div>'; return; }
  box.innerHTML = comments.map(c => {
    const preview = (esc(c.body) || '').replaceAll('\\n',' ');
    return '<div class="px-6 py-3.5">'
      + '<div class="flex items-start justify-between gap-4">'
      + '<div class="flex-1 min-w-0">'
      + '<div class="text-sm font-semibold text-stone-800">' + esc(c.author_name) + ' <span class="text-xs text-stone-400">sur <a href="/voyage/' + esc(c.article_id) + '" class="text-sky-600 hover:underline">' + esc(c.article_title) + '</a></span></div>'
      + '<p class="text-sm text-stone-700 mt-1">' + preview + '</p>'
      + '<div class="text-xs text-stone-400 mt-2">' + fmtDate(c.created_at) + '</div>'
      + '</div>'
      + '<div class="flex flex-col gap-2 items-end">'
      + '<button data-id="' + c.id + '" class="subtle-btn" data-action="admin-reply">Répondre</button>'
      + '<button data-id="' + c.id + '" class="subtle-btn" data-action="admin-delete-comment" style="background:rgba(220,60,60,.08);border-color:rgba(220,60,60,.12);">Supprimer</button>'
      + '</div></div></div>';
  }).join('');
}

document.addEventListener('click', async (e) => {
  const replyBtn = e.target.closest('[data-action="admin-reply"]');
  if (replyBtn) {
    const id = parseInt(replyBtn.dataset.id);
    const reply = prompt('Votre réponse (sera publiée comme admin)');
    if (!reply) return; // cancelled or empty
    const res = await fetch('/api/admin/comments/'+id+'/reply', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ body: reply }) });
    if (res.ok) { toast('Réponse publiée','ok'); loadRecentComments(); } else { const d = await res.json().catch(()=>null); toast((d&&d.error)||'Erreur','err'); }
  }
  const delBtn = e.target.closest('[data-action="admin-delete-comment"]');
  if (delBtn) {
    const id = parseInt(delBtn.dataset.id);
    if (!confirm('Supprimer ce commentaire ?')) return;
    const res = await fetch('/api/comments/'+id, { method: 'DELETE' });
    if (res.ok) { toast('Commentaire supprimé','ok'); loadRecentComments(); } else toast('Erreur','err');
  }
});

// ── Tab switching ───────────────────────────────────────────────
const TAB_LOADERS = {
  emails: () => { loadEmailConfigStatus(); loadEmailLog(); },
  subscribers: () => { loadSubscribers(); },
  moderation: () => { loadRecentComments(); },
};
const _loadedTabs = new Set(['articles']);
const TAB_NAMES = ['articles','settings','account','emails','subscribers','moderation'];
function switchTab(name, focusTab) {
  document.querySelectorAll('.admin-tab').forEach(b => {
    const selected = b.dataset.tab === name;
    b.setAttribute('aria-selected', String(selected));
    // Roving tabindex (ARIA APG "tabs" pattern): only the active tab is a
    // Tab-stop, arrow keys move focus between the others.
    b.tabIndex = selected ? 0 : -1;
    if (selected && focusTab) b.focus();
  });
  document.querySelectorAll('.admin-tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-'+name));
  if (!_loadedTabs.has(name) && TAB_LOADERS[name]) { _loadedTabs.add(name); TAB_LOADERS[name](); }
  if (history.replaceState) history.replaceState(null, '', name === 'articles' ? location.pathname : location.pathname + '#' + name);
}
document.getElementById('admin-tabs').addEventListener('click', e => {
  const btn = e.target.closest('.admin-tab');
  if (btn) switchTab(btn.dataset.tab);
});
// Arrow-key navigation between tabs (ARIA APG pattern) once a tab is focused.
document.getElementById('admin-tabs').addEventListener('keydown', e => {
  if (!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
  const current = e.target.closest('.admin-tab');
  if (!current) return;
  e.preventDefault();
  const i = TAB_NAMES.indexOf(current.dataset.tab);
  let next;
  if (e.key === 'Home') next = TAB_NAMES[0];
  else if (e.key === 'End') next = TAB_NAMES[TAB_NAMES.length - 1];
  else if (e.key === 'ArrowLeft') next = TAB_NAMES[(i - 1 + TAB_NAMES.length) % TAB_NAMES.length];
  else next = TAB_NAMES[(i + 1) % TAB_NAMES.length];
  switchTab(next, true);
});

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id = parseInt(btn.dataset.id);
  switch (btn.dataset.action) {
    case 'open-folder-modal': openFolderModal(id); break;
    case 'del-folder': delFolder(id); break;
    case 'toggle-status': toggleStatus(id, btn.dataset.status); break;
    case 'del-article': delArticle(id); break;
  }
});
document.addEventListener('error', e => {
  const img = e.target;
  if (img.tagName === 'IMG' && img.dataset.fallback) {
    const fb = img.dataset.fallback;
    img.removeAttribute('data-fallback');
    img.src = fb;
  }
}, true);
init();
loadSettings();
loadAccount();
// Deep-link support: /admin/dashboard#settings, #account, #emails, #subscribers, #moderation
const _initialTab = (location.hash || '').replace('#','');
if (['settings','account','emails','subscribers','moderation'].includes(_initialTab)) switchTab(_initialTab);
</script>
</body>
</html>`);
}

// ── Article Editor ────────────────────────────────────────────
export function editorPage(articleId = null) {
  const isEdit = articleId !== null;
  return html(`<!DOCTYPE html>
<html lang="fr">
<head>${HEAD(isEdit ? 'Admin - Modifier article' : 'Admin - Nouvel article')}<style>
#e-content .img-pair{outline:2px dashed rgba(99,179,237,.35);outline-offset:3px;border-radius:.75rem}
#e-content .img-pair figure{max-width:49%;min-width:0}
#e-content figure{position:relative}
#e-content .img-delete,#e-content .img-split,#e-content .img-expand{position:absolute;top:6px;width:26px;height:26px;border-radius:50%;background:rgba(0,0,0,.65);color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1rem;line-height:1;font-weight:700;opacity:0;transition:opacity .15s;z-index:10;padding:0}
#e-content .img-delete{right:6px}
#e-content .img-split{right:38px;font-size:.7rem}
#e-content .img-expand{left:6px;font-size:.7rem}
#e-content figure:hover .img-delete,#e-content figure:hover .img-split,#e-content figure:hover .img-expand{opacity:1}
/* Touch devices have no :hover state, so opacity:0-until-hover would leave
   these buttons effectively untappable — an admin on a phone could never
   discover or reliably hit a 26px invisible button. Make them always visible
   and bump them to the ~44px minimum touch target size instead. */
@media (pointer: coarse) {
  #e-content .img-delete,#e-content .img-split,#e-content .img-expand{opacity:1;width:40px;height:40px;font-size:1.1rem}
  #e-content .img-split{right:46px;font-size:.85rem}
  #e-content .img-expand{font-size:.85rem}
}
#e-content .img-pair-add{flex:1;min-width:0;max-width:49%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.4rem;border:2px dashed rgba(99,179,237,.5);border-radius:.75rem;cursor:pointer;color:rgba(56,139,202,.8);font-size:.8rem;font-weight:600;padding:1.5rem .5rem;transition:all .15s;background:rgba(99,179,237,.04)}
#e-content .img-pair-add:hover{border-color:#63b3ed;background:rgba(99,179,237,.12);color:#2b6cb0}
#e-content .img-pair-add i{font-size:1.6rem}
</style></head>
<body class="bg-stone-50 font-sans text-stone-900 antialiased pt-14 pb-20 lg:pb-0">
${ADMIN_NAV(isEdit ? 'Modifier article' : 'Nouvel article')}

<div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
  <div class="flex flex-col lg:grid lg:grid-cols-3 lg:items-start gap-5 lg:gap-8">

    <!-- Editor main: second on mobile (after sidebar), cols 1-2 on desktop -->
    <div class="order-2 lg:col-start-1 lg:col-span-2 lg:row-start-1 space-y-5">

      <!-- Title -->
      <div>
        <label class="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide">Titre *</label>
        <input type="text" id="e-title" placeholder="Ex: Notre été à Santorin"
               class="w-full border-2 border-stone-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-sky-400 transition-colors font-bold text-lg text-stone-800">
      </div>

      <!-- Short description -->
      <div>
        <label class="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide">Description courte</label>
        <textarea id="e-desc" rows="2" placeholder="Un résumé accrocheur de 1-2 phrases..."
                  class="w-full border-2 border-stone-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-sky-400 transition-colors text-stone-800 resize-none text-sm"></textarea>
      </div>

      <!-- Rich text editor -->
      <div>
        <div class="mb-2">
          <label class="text-xs font-bold text-stone-500 uppercase tracking-wide">Contenu</label>
        </div>
        <div class="rounded-2xl border-2 border-stone-200 focus-within:border-sky-400 transition-colors overflow-hidden">
          <div id="editor-toolbar" class="flex flex-wrap items-center gap-0.5 p-1.5 bg-stone-50 border-b border-stone-200">
            <button type="button" class="toolbar-btn" onclick="fmt('bold')" title="Gras"><i class="ph-fill ph-text-b"></i></button>
            <button type="button" class="toolbar-btn" onclick="fmt('italic')" title="Italique"><i class="ph ph-text-italic"></i></button>
            <button type="button" class="toolbar-btn" onclick="fmt('underline')" title="Souligné"><i class="ph ph-text-underline"></i></button>
            <span class="toolbar-sep"></span>
            <button type="button" class="toolbar-btn" onclick="fmtBlock('H2')" title="Titre"><i class="ph ph-text-h-two"></i></button>
            <button type="button" class="toolbar-btn" onclick="fmtBlock('H3')" title="Sous-titre"><i class="ph ph-text-h-three"></i></button>
            <button type="button" class="toolbar-btn" onclick="fmtBlock('P')" title="Texte normal"><i class="ph ph-paragraph"></i></button>
            <span class="toolbar-sep"></span>
            <button type="button" class="toolbar-btn" onclick="fmt('insertUnorderedList')" title="Liste à puces"><i class="ph ph-list-bullets"></i></button>
            <button type="button" class="toolbar-btn" onclick="fmtBlock('BLOCKQUOTE')" title="Citation"><i class="ph ph-quotes"></i></button>
            <span class="toolbar-sep"></span>
            <button type="button" class="toolbar-btn" style="color:var(--blue)" onclick="openInsertImg()" title="Insérer une image"><i class="ph ph-image"></i></button>
          </div>
          <div id="e-content" contenteditable="true" spellcheck="true"
               class="prose-vacation min-h-[360px] max-w-none p-5 focus:outline-none"
               data-placeholder="Commencez à écrire votre récit..."
               style="color:var(--ink)"></div>
        </div>
      </div>

    </div>

    <!-- Sidebar: first on mobile, col-3 on desktop -->
    <aside class="order-1 lg:col-start-3 lg:row-start-1 space-y-4">

      <!-- Save button (desktop only - mobile uses sticky bottom bar) -->
      <div class="hidden lg:block space-y-2">
        <button onclick="saveArticle()" class="w-full action-btn text-white font-bold py-3 rounded-2xl transition-all"><i class="ph ph-floppy-disk"></i> Sauvegarder</button>
        ${isEdit ? `<a id="export-btn" href="/admin/articles/${articleId}/print" target="_blank" class="w-full flex items-center justify-center gap-2 border border-stone-200 rounded-2xl py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors" style="text-decoration:none"><i class="ph ph-export"></i> Exporter (PDF / Word)</a>` : ''}
      </div>

      <!-- Status -->
      <div class="section-panel majorelle-frame rounded-2xl border border-stone-100 p-5 shadow-sm">
        <h3 class="font-bold text-stone-700 mb-3 text-sm"><i class="ph ph-toggle-right"></i> Statut</h3>
        <div class="flex flex-col gap-2">
          <button type="button" id="btn-archived" onclick="setStatus('archived')"
            class="flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left w-full" style="border-color:#e7e5e4;background:#fff">
            <i class="ph ph-archive text-xl flex-shrink-0" style="color:#a8a29e"></i>
            <div class="flex-1">
              <div class="font-semibold text-sm status-btn-title" style="color:#57534e">Archivé</div>
              <div class="text-xs text-stone-400">Non visible par les lecteurs</div>
            </div>
            <i class="ph-fill ph-check-circle status-check flex-shrink-0" style="font-size:1.1rem;display:none"></i>
          </button>
          <button type="button" id="btn-published" onclick="setStatus('published')"
            class="flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left w-full" style="border-color:#e7e5e4;background:#fff">
            <i class="ph-fill ph-check-circle text-xl flex-shrink-0" style="color:#a8a29e"></i>
            <div class="flex-1">
              <div class="font-semibold text-sm status-btn-title" style="color:#57534e">Publié</div>
              <div class="text-xs text-stone-400">Visible par tous</div>
            </div>
            <i class="ph-fill ph-check-circle status-check flex-shrink-0" style="font-size:1.1rem;display:none"></i>
          </button>
          <button type="button" id="btn-publish_when_online" onclick="setStatus('publish_when_online')"
            class="flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left w-full" style="border-color:#e7e5e4;background:#fff">
            <i class="ph ph-wifi-high text-xl flex-shrink-0" style="color:#a8a29e"></i>
            <div class="flex-1">
              <div class="font-semibold text-sm status-btn-title" style="color:#57534e">Publier dès connexion</div>
              <div class="text-xs text-stone-400">Publie auto quand internet rétabli</div>
            </div>
            <i class="ph-fill ph-check-circle status-check flex-shrink-0" style="font-size:1.1rem;display:none"></i>
          </button>
        </div>
        <input type="hidden" id="pub-status" value="archived">
        <div id="sync-info" class="mt-3 pt-3 border-t border-stone-100 space-y-1 text-xs" style="color:var(--ink-muted)">
          <div class="flex items-center gap-1.5"><span id="sync-dot" style="width:7px;height:7px;border-radius:50%;background:#a3e635;flex-shrink:0;display:inline-block"></span><span id="sync-online-lbl">En ligne</span></div>
          <div id="sync-saved-row" class="hidden flex items-center gap-1.5"><i class="ph ph-floppy-disk"></i> <span id="sync-saved-lbl"></span></div>
          <div id="sync-pub-row" class="hidden flex items-center gap-1.5"><i class="ph ph-check-circle" style="color:var(--palm)"></i> <span id="sync-pub-lbl"></span></div>
        </div>
      </div>

      <!-- Notify subscribers (shown only when status = published) -->
      <div id="notify-section" class="hidden section-panel rounded-2xl border p-4 shadow-sm" style="background:rgba(var(--palm-rgb),.06);border-color:rgba(var(--palm-rgb),.22)">
        <label class="flex items-start gap-3 cursor-pointer select-none">
          <input type="checkbox" id="e-notify" checked class="w-5 h-5 mt-0.5 flex-shrink-0 accent-emerald-600">
          <div>
            <div class="font-bold text-sm" style="color:var(--palm)"><i class="ph ph-bell-ringing"></i> Prévenir les abonnés</div>
            <div class="text-xs mt-0.5" style="color:var(--ink-muted)">Envoie une notification push et un email à tous les abonnés.</div>
          </div>
        </label>
      </div>

      <!-- Meta -->
       <div class="section-panel majorelle-frame rounded-2xl border border-stone-100 p-5 shadow-sm">
        <h3 class="font-bold text-stone-700 mb-4 text-sm"><i class="ph ph-info"></i> Informations</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-stone-500 mb-1.5"><i class="ph ph-calendar-blank"></i> Début du voyage *</label>
            <input type="date" id="e-start-date" class="w-full border-2 border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-sky-400 transition-colors text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-stone-500 mb-1.5"><i class="ph ph-calendar-check"></i> Fin du voyage *</label>
            <input type="date" id="e-end-date" class="w-full border-2 border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-sky-400 transition-colors text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-stone-500 mb-1.5"><i class="ph ph-map-pin"></i> Destination</label>
            <input type="text" id="e-dest" placeholder="Ex: Paris, France" class="w-full border-2 border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-sky-400 transition-colors text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-stone-500 mb-1.5"><i class="ph ph-folder"></i> Dossier</label>
            <select id="e-folder" class="w-full border-2 border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-sky-400 transition-colors text-sm">
              <option value="">Aucun dossier</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Cover photo -->
       <div class="section-panel majorelle-frame rounded-2xl border border-stone-100 p-5 shadow-sm">
        <h3 class="font-bold text-stone-700 mb-3 text-sm"><i class="ph ph-image"></i> Photo de couverture</h3>
        <input type="hidden" id="e-cover" value="">
        <div id="cover-wrap" class="hidden relative mb-2 group cursor-pointer" onclick="document.getElementById('cover-file-in').click()">
          <img id="cover-img" src="" alt="" class="w-full h-32 object-cover rounded-xl">
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all rounded-xl flex items-center justify-center pointer-events-none">
            <span class="text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-3 py-1.5 rounded-full"><i class="ph ph-camera"></i> Changer</span>
          </div>
        </div>
        <div id="cover-dz" class="border-2 border-dashed border-stone-300 rounded-xl p-5 text-center hover:border-sky-400 hover:bg-sky-50 transition-all cursor-pointer"
             onclick="document.getElementById('cover-file-in').click()"
             ondragover="event.preventDefault();this.classList.add('border-sky-400','bg-sky-50')"
             ondragleave="this.classList.remove('border-sky-400','bg-sky-50')"
             ondrop="handleCoverDrop(event)">
          <i class="ph ph-image-square" style="font-size:2rem;display:block;margin-bottom:.35rem;color:var(--blue)"></i>
          <p class="text-stone-600 font-semibold text-xs">Choisir une photo</p>
          <p class="text-stone-400 text-xs mt-0.5">JPG, PNG, WebP</p>
        </div>
        <input type="file" id="cover-file-in" accept="image/*" class="hidden" onchange="handleCoverFile(this.files[0]);this.value=''">
      </div>

      <!-- Photo upload -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-xs font-bold text-stone-500 uppercase tracking-wide">Images dans le récit</label>
          <p class="text-xs text-sky-600 font-semibold"><i class="ph ph-image"></i> Les photos s'insèrent automatiquement dans le texte</p>
        </div>
        <div id="dropzone"
             class="border-2 border-dashed border-stone-300 rounded-2xl p-8 text-center hover:border-sky-400 hover:bg-sky-50 transition-all cursor-pointer"
             onclick="document.getElementById('file-in').click()"
             ondragover="event.preventDefault();this.classList.add('border-sky-400','bg-sky-50')"
             ondragleave="this.classList.remove('border-sky-400','bg-sky-50')"
             ondrop="handleDrop(event)">
          <i class="ph ph-camera" style="font-size:2.5rem;display:block;margin-bottom:.5rem;color:var(--blue)"></i>
          <p class="text-stone-600 font-semibold text-sm">Appuyez pour choisir des photos</p>
          <p class="text-stone-400 text-xs mt-1">JPG, PNG, WebP · Max 10 MB</p>
          <input type="file" id="file-in" accept="image/*" multiple class="hidden" onchange="handleFiles(this.files)">
        </div>
        <div id="photo-grid" class="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4"></div>
      </div>

      ${isEdit ? `
      <div class="bg-red-50 rounded-2xl border border-red-100 p-5">
        <h3 class="font-bold text-red-700 mb-3 text-sm"><i class="ph ph-warning"></i> Zone danger</h3>
        <button onclick="delArticle()" class="w-full bg-red-500 text-white font-bold py-2.5 rounded-xl hover:bg-red-600 transition-colors text-sm"><i class="ph ph-trash"></i> Supprimer l'article</button>
      </div>` : ''}
    </aside>
  </div>
</div>

<!-- Sticky save bar (mobile only) -->
<div class="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 backdrop-blur-sm border-t border-stone-200 px-4 py-3 flex items-center gap-3 shadow-xl" style="padding-bottom:max(12px,env(safe-area-inset-bottom))">
  <span id="sticky-status-lbl" class="flex-1 text-sm font-semibold text-stone-600 truncate">Archivé</span>
  <button onclick="saveArticle()" class="action-btn py-2.5 px-5 text-sm font-bold flex-shrink-0 whitespace-nowrap touch-manipulation">
    <i class="ph ph-floppy-disk"></i> Sauvegarder
  </button>
</div>

<!-- Insert image modal -->
<div id="insert-img-modal" class="hidden fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onclick="if(event.target===this)closeInsertImg()">
  <div class="section-panel majorelle-frame rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[85vh] flex flex-col">
    <div class="flex items-center justify-between p-5 border-b border-stone-100">
      <h3 class="font-display text-lg font-bold text-stone-900"><i class="ph ph-image"></i> Insérer une image</h3>
      <button onclick="closeInsertImg()" class="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"><i class="ph ph-x text-lg"></i></button>
    </div>
    <div class="px-5 pt-4 pb-2">
      <div class="flex gap-2">
        <button type="button" id="iim-btn-full" onclick="setImgSize('full')" class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-sky-400 bg-sky-50 text-sky-700 text-sm font-bold transition-all"><i class="ph ph-arrows-horizontal"></i> Pleine largeur</button>
        <button type="button" id="iim-btn-half" onclick="setImgSize('half')" class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-stone-200 bg-white text-stone-600 text-sm font-bold transition-all"><i class="ph ph-square-half"></i> Demi-largeur</button>
      </div>
      <input type="hidden" id="iim-size" value="full">
      <div class="mt-3">
        <label class="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1.5" for="iim-caption"><i class="ph ph-text-aa"></i> Légende / texte alternatif <span class="font-normal normal-case text-stone-400">(optionnel)</span></label>
        <input type="text" id="iim-caption" placeholder="Ex: Vue sur la baie au coucher du soleil" class="w-full border-2 border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-sky-400 transition-colors text-sm">
        <p class="text-xs text-stone-400 mt-1">Affichée sous l'image et utilisée comme texte alternatif.</p>
      </div>
    </div>
    <div class="flex-1 overflow-y-auto px-5 pb-5">
      <p class="text-xs font-bold text-stone-500 uppercase tracking-wide mb-3 mt-2">Photos disponibles</p>
      <div id="iim-gallery" class="grid grid-cols-3 gap-2"></div>
      <p id="iim-empty" class="hidden text-stone-400 text-sm text-center py-6">Aucune photo dans la galerie.</p>
      <div class="mt-4 pt-4 border-t border-stone-100">
        <p class="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Importer une nouvelle photo</p>
        <div class="border-2 border-dashed border-stone-300 rounded-xl p-4 text-center hover:border-sky-400 hover:bg-sky-50 transition-all cursor-pointer"
             onclick="document.getElementById('iim-file-in').click()"
             ondragover="event.preventDefault();this.classList.add('border-sky-400','bg-sky-50')"
             ondragleave="this.classList.remove('border-sky-400','bg-sky-50')"
             ondrop="_iimDrop(event)">
          <i class="ph ph-upload-simple text-xl mb-1 block" style="color:var(--blue)"></i>
          <span class="text-stone-600 font-semibold text-sm">Choisir ou déposer une photo</span>
          <input type="file" id="iim-file-in" accept="image/*" class="hidden" onchange="_iimUpload(this.files);this.value=''">
        </div>
      </div>
    </div>
  </div>
</div>

${TOAST}
<script>
let ARTICLE_ID = ${JSON.stringify(articleId)};
let existingPhotos = [];
let newPhotos = [];
let newCoverFile = null;
let _lastSaved = null;
let _lastPublished = null;

function toast(msg,type='ok'){const i=document.getElementById('toast-icon'),m=document.getElementById('toast-msg'),el=document.getElementById('toast');i.innerHTML=type==='ok'?'<i class="ph-fill ph-check-circle" style="color:var(--palm);font-size:1.25rem"></i>':type==='err'?'<i class="ph-fill ph-x-circle" style="color:#dc3c3c;font-size:1.25rem"></i>':'<i class="ph-fill ph-info" style="color:var(--blue);font-size:1.25rem"></i>';m.textContent=msg;el.classList.remove('hidden');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.add('hidden'),3000)}
function esc(s){return (s==null? '': String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function stripDataUris(html){return(html||'').replace(/\bsrc="data:[^"]*"/g,'src=""').replace(/\bsrc='data:[^']*'/g,"src=''");}
function dataUrlToFile(dataUrl,name){const arr=dataUrl.split(','),mime=arr[0].match(/:(.*?);/)[1],bstr=atob(arr[1]);let n=bstr.length;const u8=new Uint8Array(n);while(n--)u8[n]=bstr.charCodeAt(n);return new File([u8],name||'photo.jpg',{type:mime});}

// ── Offline draft management ───────────────────────────────────
let DRAFT_KEY = 'admin_draft_' + (ARTICLE_ID != null ? ARTICLE_ID : 'new');

function _draftPayload() {
  return {
    title:             document.getElementById('e-title')?.value.trim() || '',
    destination:       document.getElementById('e-dest')?.value.trim() || '',
    start_date:        document.getElementById('e-start-date')?.value || '',
    end_date:          document.getElementById('e-end-date')?.value || '',
    short_description: document.getElementById('e-desc')?.value.trim() || '',
    content:           navigator.onLine ? stripDataUris(document.getElementById('e-content')?.innerHTML || '') : (document.getElementById('e-content')?.innerHTML || ''),
    status:            document.getElementById('pub-status')?.value || 'archived',
    folder_id:         parseInt(document.getElementById('e-folder')?.value) || null,
    cover_url:         document.getElementById('e-cover')?.value.trim() || null,
  };
}
function saveDraftLocal() {
  const p = _draftPayload();
  if (!p.title) return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...p, _ts: Date.now() }));
  } catch(e) {
    // Storage quota (likely large inline images): strip them and retry
    try { const p2 = _draftPayload(); p2.content = stripDataUris(p2.content); localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...p2, _ts: Date.now() })); } catch(e2) {}
  }
  updateSyncInfo();
}
function loadDraftLocal() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch { return null; }
}
function clearDraftLocal() { localStorage.removeItem(DRAFT_KEY); }

function fillFromDraft(d) {
  if (d.title)             document.getElementById('e-title').value = d.title;
  if (d.short_description) document.getElementById('e-desc').value = d.short_description;
  if (d.content !== undefined) document.getElementById('e-content').innerHTML = d.content;
  if (d.start_date)        document.getElementById('e-start-date').value = d.start_date;
  if (d.end_date)          document.getElementById('e-end-date').value = d.end_date;
  if (d.destination)       document.getElementById('e-dest').value = d.destination;
  if (d.cover_url)         { document.getElementById('e-cover').value = d.cover_url; previewCover(d.cover_url); }
  setStatus(d.status || 'archived');
}

// ── Autosave (debounce 8s) ─────────────────────────────────────
let _autoSaveTimer;
function _scheduleAutoSave() {
  clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(saveDraftLocal, 8000);
}
function _attachAutoSave() {
  ['e-title','e-desc','e-content','e-start-date','e-end-date','e-dest'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', _scheduleAutoSave);
  });
}

// ── Draft restore notification bar ────────────────────────────
let _pendingDraft = null;
function _showDraftBar(draft) {
  if (document.getElementById('draft-bar')) return;
  const d = new Date(draft._ts).toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  const bar = document.createElement('div');
  bar.id = 'draft-bar';
  bar.style.cssText = 'position:fixed;top:56px;left:0;right:0;z-index:39;display:flex;align-items:center;gap:.75rem;background:#EFF6FF;border-bottom:1px solid #BFDBFE;padding:.6rem 1rem;font-size:.85rem;font-weight:500;color:#1E40AF;box-shadow:0 1px 4px rgba(0,0,0,.06)';
  bar.innerHTML = \`<i class="ph ph-cloud-slash" style="font-size:1.1rem;flex-shrink:0"></i>
    <span style="flex:1">Brouillon local du \${d} non synchronisé</span>
    <button onclick="_applyDraft()" style="background:#3B82F6;color:#fff;border:none;padding:.3rem .8rem;border-radius:.5rem;font-weight:700;font-size:.78rem;cursor:pointer">Restaurer</button>
    <button onclick="_dismissDraft()" style="color:#3B82F6;border:none;background:none;padding:.3rem .5rem;font-size:.78rem;cursor:pointer;font-weight:600">Ignorer</button>\`;
  document.body.appendChild(bar);
}
function _applyDraft() {
  if (_pendingDraft) { fillFromDraft(_pendingDraft); _pendingDraft = null; }
  document.getElementById('draft-bar')?.remove();
  toast('Brouillon restauré ✓', 'ok');
}
function _dismissDraft() {
  clearDraftLocal();
  _pendingDraft = null;
  document.getElementById('draft-bar')?.remove();
}

// ── Auto-create draft if article has no ID yet ────────────────
async function ensureArticleId() {
  if (ARTICLE_ID) return true;
  const title = document.getElementById('e-title')?.value.trim();
  if (!title) { toast("Ajoutez d'abord un titre à l'article", 'err'); return false; }
  const res = await fetch('/api/articles', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      title, status: 'archived',
      start_date: document.getElementById('e-start-date')?.value || new Date().toISOString().slice(0,10),
      end_date: document.getElementById('e-end-date')?.value || new Date().toISOString().slice(0,10),
      content: stripDataUris(document.getElementById('e-content')?.innerHTML || ''),
    })
  }).catch(() => null);
  if (!res?.ok) { toast('Erreur lors de la création du brouillon', 'err'); return false; }
  const data = await res.json();
  ARTICLE_ID = data.id;
  DRAFT_KEY = 'admin_draft_' + ARTICLE_ID;
  history.replaceState(null, '', '/admin/editor/' + ARTICLE_ID);
  toast('Brouillon créé automatiquement', 'ok');
  return true;
}

// ── Sync status display ───────────────────────────────────────
function updateSyncInfo() {
  const online = navigator.onLine;
  const dot = document.getElementById('sync-dot');
  const lbl = document.getElementById('sync-online-lbl');
  const hasPending = !!document.getElementById('e-content')?.querySelector('img[src^="data:"]');
  if (dot) dot.style.background = online ? (hasPending ? '#fbbf24' : '#a3e635') : '#f87171';
  if (lbl) lbl.textContent = online ? (hasPending ? 'En ligne \u00b7 images en attente' : 'En ligne') : 'Hors ligne';
  if (_lastSaved) {
    const row = document.getElementById('sync-saved-row');
    const sl = document.getElementById('sync-saved-lbl');
    if (row) row.classList.remove('hidden');
    if (sl) sl.textContent = 'Sauvegardé ' + _fmtRelTime(_lastSaved);
  }
  if (_lastPublished) {
    const row = document.getElementById('sync-pub-row');
    const pl = document.getElementById('sync-pub-lbl');
    if (row) row.classList.remove('hidden');
    if (pl) pl.textContent = 'Publié ' + _fmtRelTime(_lastPublished);
  }
}
function _fmtRelTime(ts) {
  const d = Date.now() - ts;
  if (d < 60000) return "à l'instant";
  if (d < 3600000) return 'il y a ' + Math.round(d / 60000) + ' min';
  return new Date(ts).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
}

// ── Shared single-photo upload with timeout + one retry ───────
// On a weak travel connection a bare fetch() can hang indefinitely (no
// default timeout) leaving the admin staring at a toast that vanishes after
// 3s with no idea whether the upload is still in flight, succeeded, or died.
// This wraps the upload with an explicit ceiling and a single automatic
// retry on timeout/network failure before giving up and telling the admin.
async function uploadPhotoFile(articleId, file, { onProgress } = {}) {
  const UPLOAD_TIMEOUT_MS = 30000;
  for (let attempt = 0; attempt < 2; attempt++) {
    const fd = new FormData(); fd.append('photo', file);
    try {
      if (onProgress) onProgress(attempt === 0 ? 'uploading' : 'retrying');
      const res = await fetch('/api/articles/' + articleId + '/photos', {
        method: 'POST', body: fd, signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
      });
      if (!res.ok) { if (attempt === 1) return { error: 'http' }; continue; }
      const data = await res.json().catch(() => ({}));
      if (data.rejected && data.rejected.length) return { error: 'rejected', filename: data.rejected[0] };
      const p = data.uploaded?.[0];
      if (!p) return { error: 'empty' };
      return { photo: p };
    } catch (err) {
      if (attempt === 1) return { error: err?.name === 'TimeoutError' ? 'timeout' : 'network' };
      // fall through to retry once
    }
  }
  return { error: 'unknown' };
}
function uploadErrorMessage(error) {
  if (error === 'rejected') return 'Format de photo non pris en charge (essayez JPEG, PNG, WebP)';
  if (error === 'timeout') return 'Upload trop lent, connexion instable — réessayez';
  if (error === 'network') return 'Connexion perdue pendant l’upload — réessayez';
  return 'Erreur upload';
}

// ── Upload data: URI images queued while offline ──────────────
async function _processOfflineImgs() {
  const editor = document.getElementById('e-content');
  if (!editor) return;
  const pending = [...editor.querySelectorAll('img[src^="data:"]')];
  if (!pending.length) return;
  const ok = await ensureArticleId();
  if (!ok) return;
  toast('Synchronisation des images...', 'info');
  let failed = 0;
  for (const img of pending) {
    const dataUrl = img.getAttribute('src');
    const file = dataUrlToFile(dataUrl, 'photo.jpg');
    const result = await uploadPhotoFile(ARTICLE_ID, file);
    if (result.photo) { img.src = result.photo.url; existingPhotos.push(result.photo); }
    else failed++;
  }
  renderPhotoGrid();
  updateSyncInfo();
  if (!failed) toast('Images synchronisées !', 'ok');
  else toast(failed + ' image(s) non synchronisée(s)', 'err');
}

// ── Online/offline handlers (éditeur) ─────────────────────────
window.addEventListener('offline', () => {
  enforceOfflineStatus();
  updateSyncInfo();
});
window.addEventListener('online', async () => {
  enforceOfflineStatus();
  updateSyncInfo();
  // Upload any data: URI images added while offline
  await _processOfflineImgs();
  if (getStatus() === 'publish_when_online') {
    setStatus('published');
    await saveArticle();
    return;
  }
  const draft = loadDraftLocal();
  if (draft && draft.title && draft._ts > (Date.now() - 3600000)) {
    toast('Connexion rétablie - pensez à sauvegarder', 'info');
  }
});

// ── Init ──────────────────────────────────────────────────────
async function init() {
  // Load folders for the selector
  const folders = await fetch('/api/folders').then(r=>r.json()).catch(()=>[]);
  populateFolderSelect(folders, null, 0);

  const createParams = new URLSearchParams(location.search);
  const requestedFolder = createParams.get('folder');
  if (!ARTICLE_ID && requestedFolder) {
    const match = folders.find(f => String(f.id) === requestedFolder || f.slug === requestedFolder);
    if (match) {
      const opt = document.querySelector('#e-folder option[value="' + match.id + '"]');
      if (opt) opt.selected = true;
    }
  }

  // Set default dates
  const today = new Date().toISOString().slice(0,10);
  document.getElementById('e-start-date').value = today;
  document.getElementById('e-end-date').value = today;
  setStatus('archived'); // initialise le sélecteur visuel

  if (ARTICLE_ID) {
    const a = await fetch('/api/articles/' + ARTICLE_ID).then(r=>r.json()).catch(()=>null);
    if (a && a.title) {
      document.getElementById('e-title').value = a.title || '';
      document.getElementById('e-desc').value  = a.short_description || '';
      const rawContent = a.content || '';
      document.getElementById('e-content').innerHTML = rawContent.trim().startsWith('<') ? rawContent : (rawContent ? (typeof marked !== 'undefined' ? marked.parse(rawContent) : '<p>' + rawContent.replace(/\\n\\n/g,'</p><p>').replace(/\\n/g,'<br>') + '</p>') : '');
      document.getElementById('e-start-date').value  = a.start_date || a.date || today;
      document.getElementById('e-end-date').value  = a.end_date || a.date || today;
      document.getElementById('e-dest').value  = a.destination || '';
      document.getElementById('e-cover').value = a.cover_url || '';
      previewCover(a.cover_url);
      setStatus(a.status || 'archived');
      if (a.folder_id) {
        const opt = document.querySelector(\`#e-folder option[value="\${a.folder_id}"]\`);
        if (opt) opt.selected = true;
      }
      existingPhotos = a.photos || [];
      renderPhotoGrid();
    } else if (a && !a.title) {
      toast('Impossible de charger l’article','err');
    }
  }

  _attachAutoSave();
  enforceOfflineStatus();
  // Vérifier si un brouillon hors-ligne est en attente
  const draft = loadDraftLocal();
  if (draft && draft.title) {
    if (!ARTICLE_ID) {
      fillFromDraft(draft); // Nouvel article : restauration silencieuse
    } else {
      _pendingDraft = draft;
      _showDraftBar(draft); // Article existant : proposer la restauration
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

// ── WYSIWYG rich text editor ──────────────────────────────────
let _savedRange = null;
function saveSelection() {
  const sel = window.getSelection();
  if (sel && sel.rangeCount) _savedRange = sel.getRangeAt(0).cloneRange();
}
function restoreSelection() {
  if (!_savedRange) return;
  const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(_savedRange);
}
function fmt(cmd) {
  const ed = document.getElementById('e-content');
  ed.focus();
  restoreSelection();
  document.execCommand(cmd, false, null);
}
function fmtBlock(tag) {
  const ed = document.getElementById('e-content');
  ed.focus();
  restoreSelection();
  document.execCommand('formatBlock', false, '<' + tag + '>');
}
function insertPhotoInText(url, caption, showToast=true, size='full') {
  const figure = _makeImgFigure(url, caption, size);
  const editor = document.getElementById('e-content');
  if (size === 'half') {
    // Look for an incomplete img-pair near the cursor first, then at end
    let row = null;
    if (_savedRange && editor.contains(_savedRange.commonAncestorContainer)) {
      let anchor = _savedRange.commonAncestorContainer;
      if (anchor.nodeType === Node.TEXT_NODE) anchor = anchor.parentNode;
      while (anchor && anchor.parentNode !== editor) anchor = anchor.parentNode;
      if (anchor?.classList?.contains('img-pair') && anchor.querySelectorAll('figure').length < 2) row = anchor;
    }
    if (!row) {
      const last = editor.lastElementChild;
      if (last && last.classList.contains('img-pair') && last.querySelectorAll('figure').length < 2) row = last;
    }
    if (row) {
      row.querySelectorAll('.img-pair-add').forEach(el => el.remove());
      row.appendChild(figure);
      _refreshImgPairSlot(row);
    } else {
      row = document.createElement('div'); row.className = 'img-pair';
      row.appendChild(figure);
      _insertBlockAtCursor(row, editor);
      _refreshImgPairSlot(row);
    }
  } else {
    _insertBlockAtCursor(figure, editor);
    const p = document.createElement('p'); p.innerHTML = '<br>';
    figure.after(p);
  }
  if (showToast) toast('Photo insérée !','ok');
}

// ── Insert at cursor range (drag / paste) ─────────────────────
function insertPhotoAtRange(url, caption, range) {
  const figure = _makeImgFigure(url, caption, 'full');
  const editor = document.getElementById('e-content');
  if (range && range.commonAncestorContainer && editor.contains(range.commonAncestorContainer)) {
    range.deleteContents();
    range.insertNode(figure);
    const sel = window.getSelection(); sel.removeAllRanges();
    const r2 = document.createRange(); r2.setStartAfter(figure); r2.collapse(true);
    sel.addRange(r2);
  } else {
    editor.appendChild(figure);
    const p = document.createElement('p'); p.innerHTML = '<br>'; editor.appendChild(p);
  }
}

// ── Image figure helpers ──────────────────────────────────────
function _makeImgFigure(url, caption, size) {
  const figure = document.createElement('figure');
  figure.className = 'img-' + size;
  figure.setAttribute('contenteditable', 'false');
  const img = document.createElement('img'); img.src = url; img.alt = caption || '';
  figure.appendChild(img);
  // Never render caption/filename in the editor
  const del = document.createElement('button');
  del.type = 'button'; del.className = 'img-delete'; del.title = 'Supprimer'; del.textContent = '\u00d7';
  del.onclick = function(e) { e.stopPropagation(); _deleteImgFigure(figure); };
  figure.appendChild(del);
  if (size === 'full') {
    const split = document.createElement('button');
    split.type = 'button'; split.className = 'img-split'; split.title = 'Mettre en demi-largeur';
    split.innerHTML = '<i class="ph ph-columns"></i>';
    split.onclick = function(e) { e.stopPropagation(); _splitToHalf(figure); };
    figure.appendChild(split);
  }
  return figure;
}
function _splitToHalf(figure) {
  const editor = document.getElementById('e-content');
  const parent = figure.parentElement;
  if (parent !== editor) return; // only split top-level full figures
  figure.className = 'img-half';
  figure.querySelectorAll('.img-split').forEach(b => b.remove());
  const row = document.createElement('div'); row.className = 'img-pair';
  parent.insertBefore(row, figure);
  row.appendChild(figure);
  _refreshImgPairSlot(row);
}
function _deleteImgFigure(figure) {
  const row = figure.parentElement;
  figure.remove();
  if (row && row.classList.contains('img-pair')) {
    if (!row.querySelector('figure')) { row.remove(); }
    else { _refreshImgPairSlot(row); }
  }
}
function _refreshImgPairSlot(row) {
  row.querySelectorAll('.img-pair-add').forEach(el => el.remove());
  row.querySelectorAll('.img-expand').forEach(b => b.remove());
  const figures = row.querySelectorAll('figure');
  if (figures.length < 2) {
    const slot = document.createElement('div');
    slot.className = 'img-pair-add';
    slot.setAttribute('contenteditable', 'false');
    slot.innerHTML = '<i class="ph ph-plus-circle"></i><span>Ajouter</span>';
    slot.onclick = function() { openInsertImg(row); };
    row.appendChild(slot);
    // Expand-to-full button on the lone figure
    figures.forEach(fig => {
      const exp = document.createElement('button');
      exp.type = 'button'; exp.className = 'img-expand'; exp.title = 'Repasser en pleine largeur';
      exp.innerHTML = '<i class="ph ph-arrows-out-simple"></i>';
      exp.onclick = function(e) { e.stopPropagation(); _expandToFull(fig); };
      fig.appendChild(exp);
    });
  }
}
function _expandToFull(figure) {
  const row = figure.parentElement;
  if (!row || !row.classList.contains('img-pair')) return;
  figure.className = 'img-full';
  figure.querySelectorAll('.img-expand').forEach(b => b.remove());
  // Restore the split button for full-width figures
  const split = document.createElement('button');
  split.type = 'button'; split.className = 'img-split'; split.title = 'Mettre en demi-largeur';
  split.innerHTML = '<i class="ph ph-columns"></i>';
  split.onclick = function(e) { e.stopPropagation(); _splitToHalf(figure); };
  figure.appendChild(split);
  row.parentNode.insertBefore(figure, row);
  row.remove();
}
function _insertBlockAtCursor(node, editor) {
  if (_savedRange && editor.contains(_savedRange.commonAncestorContainer)) {
    let anchor = _savedRange.commonAncestorContainer;
    if (anchor.nodeType === Node.TEXT_NODE) anchor = anchor.parentNode;
    while (anchor && anchor.parentNode && anchor.parentNode !== editor) anchor = anchor.parentNode;
    if (anchor && anchor.parentNode === editor) { anchor.after(node); return; }
  }
  editor.appendChild(node);
}
async function uploadAndInsertAtRange(file, range) {
  if (!navigator.onLine) {
    // Offline: insert data: URI preview - will sync automatically on reconnect
    const reader = new FileReader();
    reader.onload = ev => {
      insertPhotoAtRange(ev.target.result, '', range);
      saveDraftLocal();
      updateSyncInfo();
      toast('Image insérée (sync quand connecté)', 'info');
    };
    reader.readAsDataURL(file);
    return;
  }
  toast('Upload...', 'info');
  const ok = await ensureArticleId();
  if (!ok) return;
  const result = await uploadPhotoFile(ARTICLE_ID, file);
  if (result.photo) {
    const p = result.photo;
    existingPhotos.push(p); renderPhotoGrid(); insertPhotoAtRange(p.url, p.caption || '', range); toast('Image insérée !', 'ok');
  } else {
    toast(uploadErrorMessage(result.error), 'err');
  }
}
let _pairAddTarget = null;
function openInsertImg(pairRow) {
  _pairAddTarget = pairRow || null;
  const gallery = document.getElementById('iim-gallery');
  const empty = document.getElementById('iim-empty');
  const allPhotos = [
    ...existingPhotos.map(p => ({url: p.url, caption: p.caption || ''})),
    ...newPhotos.map(p => ({url: p.dataUrl, caption: p.name || ''})),
  ];
  if (!allPhotos.length) {
    gallery.innerHTML = ''; empty.classList.remove('hidden');
  } else {
    empty.classList.add('hidden');
    gallery.innerHTML = allPhotos.map(p =>
      \`<div class="aspect-square overflow-hidden rounded-xl cursor-pointer ring-2 ring-transparent hover:ring-sky-400 transition-all" data-url="\${esc(p.url)}" data-caption="\${esc(p.caption)}"><img src="\${esc(p.url)}" alt="\${esc(p.caption)}" class="w-full h-full object-cover"></div>\`
    ).join('');
  }
  setImgSize(_pairAddTarget ? 'half' : 'full');
  const capIn = document.getElementById('iim-caption');
  if (capIn) capIn.value = '';
  document.getElementById('insert-img-modal').classList.remove('hidden');
}
function closeInsertImg() { document.getElementById('insert-img-modal').classList.add('hidden'); }
function setImgSize(size) {
  document.getElementById('iim-size').value = size;
  const on = 'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-sky-400 bg-sky-50 text-sky-700 text-sm font-bold transition-all';
  const off = 'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-stone-200 bg-white text-stone-600 text-sm font-bold transition-all';
  document.getElementById('iim-btn-full').className = size === 'full' ? on : off;
  document.getElementById('iim-btn-half').className = size === 'half' ? on : off;
}
function pickImg(url, caption) {
  const size = document.getElementById('iim-size').value || 'full';
  // Admin-typed caption overrides the photo's stored caption when provided.
  const typed = (document.getElementById('iim-caption')?.value || '').trim();
  if (typed) caption = typed;
  const targetRow = _pairAddTarget;
  closeInsertImg();
  _pairAddTarget = null;
  if (targetRow && targetRow.isConnected) {
    const figure = _makeImgFigure(url, caption, 'half');
    targetRow.querySelectorAll('.img-pair-add').forEach(el => el.remove());
    targetRow.appendChild(figure);
    _refreshImgPairSlot(targetRow);
  } else {
    insertPhotoInText(url, caption, false, size);
  }
}
function _iimDrop(e) {
  e.preventDefault(); e.currentTarget.classList.remove('border-sky-400','bg-sky-50');
  _iimUpload(e.dataTransfer.files);
}
async function _iimUpload(files) {
  if (!files?.length) return;
  const size = document.getElementById('iim-size').value || 'full';
  const caption = (document.getElementById('iim-caption')?.value || '').trim();
  const targetRow = _pairAddTarget;
  closeInsertImg();
  _pairAddTarget = null;
  for (const file of Array.from(files)) {
    await _uploadAndInsertIim(file, size, targetRow, caption);
  }
}
async function _uploadAndInsertIim(file, size, targetRow, caption) {
  caption = caption || '';
  if (!navigator.onLine) {
    const reader = new FileReader();
    reader.onload = ev => {
      const url = ev.target.result;
      if (targetRow && targetRow.isConnected) {
        const figure = _makeImgFigure(url, caption, 'half');
        targetRow.querySelectorAll('.img-pair-add').forEach(el => el.remove());
        targetRow.appendChild(figure); _refreshImgPairSlot(targetRow);
      } else { insertPhotoInText(url, caption, false, size); }
      saveDraftLocal(); updateSyncInfo();
      toast('Image insérée (sync quand connecté)', 'info');
    };
    reader.readAsDataURL(file); return;
  }
  toast('Upload...', 'info');
  const ok = await ensureArticleId(); if (!ok) return;
  const result = await uploadPhotoFile(ARTICLE_ID, file);
  if (result.photo) {
    const p = result.photo;
    // Prefer the admin-typed caption; fall back to the server-provided one.
    const finalCaption = caption || p.caption || '';
    existingPhotos.push(p); renderPhotoGrid();
    if (targetRow && targetRow.isConnected) {
      const figure = _makeImgFigure(p.url, finalCaption, 'half');
      targetRow.querySelectorAll('.img-pair-add').forEach(el => el.remove());
      targetRow.appendChild(figure); _refreshImgPairSlot(targetRow);
    } else { insertPhotoInText(p.url, finalCaption, false, size); }
    toast('Image insérée !', 'ok');
  } else {
    toast(uploadErrorMessage(result.error), 'err');
  }
}

// ── Cover preview ─────────────────────────────────────────────
function previewCover(url) {
  const w=document.getElementById('cover-wrap'), img=document.getElementById('cover-img');
  const dz=document.getElementById('cover-dz');
  if(url){w.classList.remove('hidden');img.src=url;if(dz)dz.classList.add('hidden');}
  else{w.classList.add('hidden');if(dz)dz.classList.remove('hidden');}
}
function handleCoverDrop(e) {
  e.preventDefault(); document.getElementById('cover-dz').classList.remove('border-sky-400','bg-sky-50');
  const f=e.dataTransfer.files[0]; if(f) handleCoverFile(f);
}
async function handleCoverFile(file) {
  if(!file) return;
  const reader=new FileReader();
  reader.onload=ev=>{ previewCover(ev.target.result); };
  reader.readAsDataURL(file);
  if(ARTICLE_ID) {
    const fd=new FormData(); fd.append('cover',file);
    const res=await fetch('/api/articles/'+ARTICLE_ID+'/cover',{method:'POST',body:fd}).catch(()=>null);
    if(res?.ok){
      const data=await res.json();
      document.getElementById('e-cover').value=data.url;
      previewCover(data.url);
      toast('Couverture mise à jour !','ok');
    } else toast('Erreur upload couverture','err');
  } else {
    newCoverFile=file;
  }
}

// ── Photo handling ────────────────────────────────────────────
function renderPhotoGrid() {
  const g=document.getElementById('photo-grid');
  const existing = existingPhotos.map((p,i)=>\`
    <div class="relative aspect-square overflow-hidden rounded-xl group">
      <img src="\${esc(p.url)}" alt="\${esc(p.caption||'')}" class="w-full h-full object-cover">
      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/55 transition-all flex flex-col items-center justify-center gap-1.5 p-1">
        <button data-action="insert-photo" data-url="\${esc(p.url)}" data-caption="\${esc(p.caption||'photo')}" class="bg-sky-500 text-white text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap"><i class="ph ph-text-align-center"></i> Ré-insérer</button>
        <button data-action="del-existing-photo" data-id="\${p.id}" data-index="\${i}" class="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap"><i class="ph ph-trash"></i> Supprimer</button>
      </div>
    </div>\`).join('');
  const newPics = newPhotos.map((p,i)=>\`
    <div class="relative aspect-square overflow-hidden rounded-xl group">
      <img src="\${p.dataUrl}" alt="\${esc(p.name)}" class="w-full h-full object-cover">
      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/55 transition-all flex flex-col items-center justify-center gap-1.5 p-1">
        <span class="bg-stone-800/80 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-center leading-tight">Insérée après<br>sauvegarde</span>
        <button data-action="rm-new-photo" data-index="\${i}" class="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap"><i class="ph ph-trash"></i> Supprimer</button>
      </div>
      <div class="absolute bottom-1 right-1 bg-orange-500 text-white text-xs rounded-full px-1.5 font-bold">Nouveau</div>
    </div>\`).join('');
  g.innerHTML = existing + newPics;
}

function handleFiles(files) {
  if (!navigator.onLine) {
    // Offline: insert data: URI previews - will sync automatically on reconnect
    Array.from(files).forEach(f => {
      const r = new FileReader();
      r.onload = e => { insertPhotoInText(e.target.result, f.name || '', false); };
      r.readAsDataURL(f);
    });
    setTimeout(() => { saveDraftLocal(); updateSyncInfo(); }, 300);
    toast('Photos en attente (sync quand connecté)', 'info');
    return;
  }
  // Online: upload immediately (auto-create draft if needed)
  (async () => {
    const ok = await ensureArticleId();
    if (!ok) return;
    toast('Upload en cours...', 'ok');
    const fd = new FormData();
    Array.from(files).forEach(f => fd.append('photo', f));
    fetch('/api/articles/'+ARTICLE_ID+'/photos', {method:'POST', body:fd, signal: AbortSignal.timeout(30000)})
      .then(r=>r.json())
      .then(data=>{
        const uploaded = data.uploaded || [];
        const rejected = data.rejected || [];
        existingPhotos.push(...uploaded);
        renderPhotoGrid();
        uploaded.forEach(p => insertPhotoInText(p.url, p.caption || 'photo', false));
        if (uploaded.length) {
          toast(uploaded.length === 1 ? 'Photo insérée !' : uploaded.length + ' photos insérées !','ok');
        }
        // Every file failed magic-byte validation (e.g. HEIC/HEIF or another
        // unsupported format) — don't show a false "success" toast for 0 photos.
        if (rejected.length) {
          toast(rejected.length + ' photo(s) au format non pris en charge (essayez JPEG, PNG, WebP)', 'err');
        }
      })
      .catch(err=>toast(err?.name === 'TimeoutError' ? 'Upload trop lent, connexion instable' : 'Erreur upload','err'));
  })();
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

// ── Status selector ───────────────────────────────────────────
function setStatus(val) {
  document.getElementById('pub-status').value = val;
  const styles = {
    archived:            { border:'#d6d3d1', bg:'#fafaf9', icon:'#a8a29e', text:'#57534e' },
    published:           { border:'#6ee7b7', bg:'#f0fdf4', icon:'var(--palm)', text:'var(--palm)' },
    publish_when_online: { border:'#fcd34d', bg:'#fffbeb', icon:'#d97706', text:'#b45309' },
  };
  ['archived','published','publish_when_online'].forEach(s => {
    const btn = document.getElementById('btn-' + s);
    if (!btn) return;
    const active = s === val;
    const c = styles[s];
    btn.style.borderColor = active ? c.border : '#e7e5e4';
    btn.style.backgroundColor = active ? c.bg : '#fff';
    const icon = btn.querySelector('i');
    const title = btn.querySelector('.status-btn-title');
    if (icon) icon.style.color = active ? c.icon : '#a8a29e';
    if (title) title.style.color = active ? c.text : '#57534e';
    const check = btn.querySelector('.status-check');
    if (check) { check.style.display = active ? 'block' : 'none'; check.style.color = active ? c.icon : '#a8a29e'; }
  });
  const notifySection = document.getElementById('notify-section');
  if (notifySection) notifySection.classList.toggle('hidden', val !== 'published' && val !== 'publish_when_online');
  const lbl = document.getElementById('sticky-status-lbl');
  if (lbl) {
    const labels = { archived:'Archivé', published:'✓ Publié', publish_when_online:'⏳ Publier dès connexion' };
    lbl.textContent = labels[val] || val;
  }
}
function getStatus() {
  return document.getElementById('pub-status')?.value || 'archived';
}
function enforceOfflineStatus() {
  const online = navigator.onLine;
  const pubBtn = document.getElementById('btn-published');
  if (pubBtn) {
    pubBtn.disabled = !online;
    pubBtn.style.opacity = online ? '1' : '0.4';
    pubBtn.style.cursor = online ? '' : 'not-allowed';
    pubBtn.title = online ? '' : 'Impossible de publier hors connexion';
  }
  const pendingBtn = document.getElementById('btn-publish_when_online');
  if (pendingBtn) {
    pendingBtn.disabled = online;
    pendingBtn.style.opacity = online ? '0.4' : '1';
    pendingBtn.style.cursor = online ? 'not-allowed' : '';
    pendingBtn.title = online ? 'Vous êtes en ligne - publiez directement' : '';
  }
  if (!online && getStatus() === 'published') setStatus('archived');
  updateSyncInfo();
}

// ── Save article ──────────────────────────────────────────────
async function saveArticle() {
  // ── Offline : sauvegarde locale ───────────────────────────
  if (!navigator.onLine) {
    saveDraftLocal();
    updateSyncInfo();
    toast('Sauvegardé sur l’appareil 📴', 'ok');
    const lbl = document.getElementById('sticky-status-lbl');
    if (lbl) lbl.textContent = '📴 Sauvegardé';
    return;
  }

  const title = document.getElementById('e-title').value.trim();
  if (!title) { toast('Le titre est obligatoire','err'); return; }
  const startDate = document.getElementById('e-start-date').value;
  const endDate = document.getElementById('e-end-date').value;
  if (!startDate || !endDate) { toast('Le voyage doit avoir un début et une fin','err'); return; }
  if (endDate < startDate) { toast('La fin doit être après le début','err'); return; }

  const status = getStatus();
  // Send the status honestly to the server — it used to be silently rewritten
  // to 'published' here, which meant choosing "publier dès connexion" while
  // actually online force-published the article immediately regardless of
  // the admin's intent. The server now stores publish_when_online as its own
  // real status; enforceOfflineStatus() already prevents selecting it while
  // online is possible in a confusing way (see below for the online case).
  const apiStatus = status;

  // Notify flag: true by default when publishing; admin can uncheck
  const notifyCheckbox = document.getElementById('e-notify');
  const notify = apiStatus === 'published'
    ? (notifyCheckbox ? notifyCheckbox.checked : true)
    : false;

  const payload = {
    title,
    destination:       document.getElementById('e-dest').value.trim(),
    start_date:        startDate,
    end_date:          endDate,
    short_description: document.getElementById('e-desc').value.trim(),
    content:           stripDataUris(document.getElementById('e-content').innerHTML),
    status:            apiStatus,
    notify,
    folder_id:         parseInt(document.getElementById('e-folder').value) || null,
    cover_url:         document.getElementById('e-cover').value.trim() || null,
  };

  const wasNew = !ARTICLE_ID;
  let savedId = ARTICLE_ID;
  let savedSlug = null;
  let res;
  if (ARTICLE_ID) {
    res = await fetch('/api/articles/'+ARTICLE_ID, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    if (res.ok) { const data=await res.json().catch(()=>({})); savedSlug=data.slug||null; }
  } else {
    res = await fetch('/api/articles', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    if (res.ok) { const data=await res.json(); savedId=data.id; ARTICLE_ID=savedId; DRAFT_KEY='admin_draft_'+ARTICLE_ID; savedSlug=data.slug||null; }
  }

  if (!res.ok) { toast('Erreur lors de la sauvegarde','err'); return; }

  // Upload new photos and append them to the editor content
  if (newPhotos.length && savedId) {
    const fd = new FormData();
    newPhotos.forEach(p => fd.append('photo', p.file));
    const uploadRes = await fetch('/api/articles/'+savedId+'/photos', {method:'POST', body:fd, signal: AbortSignal.timeout(30000)}).catch(()=>null);
    if (uploadRes?.ok) {
      const uploadData = await uploadRes.json();
      const uploaded = uploadData.uploaded || [];
      if (uploadData.rejected && uploadData.rejected.length) {
        toast(uploadData.rejected.length + ' photo(s) au format non pris en charge (essayez JPEG, PNG, WebP)', 'err');
      }
      if (uploaded.length) {
        const editor = document.getElementById('e-content');
        // Match each uploaded photo back to its source File by original
        // filename rather than by array index — if any file was rejected
        // (e.g. HEIC), 'uploaded' is shorter than 'newPhotos' and a
        // positional match would silently pair the wrong caption/dataUrl
        // with the wrong uploaded photo.
        const usedIdx = new Set();
        const matchSource = (uploadedPhoto, idx) => {
          const i = newPhotos.findIndex((np, j) => !usedIdx.has(j) && np.file && np.file.name === uploadedPhoto.source_name);
          if (i !== -1) { usedIdx.add(i); return newPhotos[i]; }
          return newPhotos[idx];
        };
        uploaded.forEach((p, i) => {
          const src = matchSource(p, i)?.dataUrl;
          if (matchSource(p, i)?.inline && src) {
            // Replace the data-URL placeholder already in the text with the real R2 URL
            editor.querySelectorAll('img').forEach(img => {
              if (img.getAttribute('src') === src) img.src = p.url;
            });
          } else {
            const fig = document.createElement('figure'); fig.className = 'img-full';
            const im = document.createElement('img'); im.src = p.url; im.alt = p.caption || '';
            fig.appendChild(im);
            if (p.caption && p.caption !== 'photo') { const c = document.createElement('figcaption'); c.textContent = p.caption; fig.appendChild(c); }
            editor.appendChild(fig);
          }
        });
        await fetch('/api/articles/'+savedId, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ content: editor.innerHTML, notify: false })
        }).catch(()=>{});
      }
    }
  }

  // Upload cover photo (new article)
  if(newCoverFile && savedId) {
    const fd=new FormData(); fd.append('cover',newCoverFile);
    const cr=await fetch('/api/articles/'+savedId+'/cover',{method:'POST',body:fd}).catch(()=>null);
    if(cr?.ok) newCoverFile=null;
  }
  _lastSaved = Date.now();
  _lastSaved = Date.now();
  if (apiStatus === 'published') _lastPublished = Date.now();
  updateSyncInfo();
  toast('Sauvegardé !','ok');
  clearDraftLocal(); // effacer le brouillon local après synchro serveur
  if (apiStatus === 'published' && savedSlug) {
    // Publié → afficher l'article pour confirmer
    setTimeout(()=>location.href='/voyage/'+savedSlug, 1000);
  } else if (wasNew && savedId) {
    // Nouvel article archivé → éditeur avec ID (si pas déjà redirigé via ensureArticleId)
    history.replaceState(null, '', '/admin/editor/' + savedId);
  }
  // Sinon (mise à jour) : on reste dans l'éditeur
}

async function delArticle() {
  if (!confirm('Supprimer cet article définitivement ?')) return;
  const r = await fetch('/api/articles/'+ARTICLE_ID, {method:'DELETE'});
  if (r.ok) { location.href='/admin/dashboard'; }
  else toast('Erreur','err');
}

// Save cursor position when editor loses focus (for insert-at-cursor)
document.getElementById('e-content')?.addEventListener('blur', saveSelection);

// Drag image files directly into the editor
document.getElementById('e-content')?.addEventListener('dragover', e => {
  if ([...e.dataTransfer.types].includes('Files')) e.preventDefault();
});
document.getElementById('e-content')?.addEventListener('drop', async e => {
  const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
  if (!files.length) return;
  e.preventDefault();
  let range = null;
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(e.clientX, e.clientY);
  } else if (document.caretPositionFromPoint) {
    const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
    if (pos) { range = document.createRange(); range.setStart(pos.offsetNode, pos.offset); range.collapse(true); }
  }
  for (const file of files) { await uploadAndInsertAtRange(file, range); range = null; }
});
// Paste image from clipboard into the editor
document.getElementById('e-content')?.addEventListener('paste', async e => {
  const items = [...e.clipboardData.items].filter(i => i.type.startsWith('image/'));
  if (!items.length) return;
  e.preventDefault();
  let range = null;
  const sel = window.getSelection();
  if (sel && sel.rangeCount) range = sel.getRangeAt(0).cloneRange();
  for (const item of items) { const file = item.getAsFile(); if (file) await uploadAndInsertAtRange(file, range); }
});

// ── Float toolbar above mobile keyboard ───────────────────────
(function() {
  const vv = window.visualViewport;
  if (!vv) return;
  const toolbar = document.getElementById('editor-toolbar');
  if (!toolbar) return;
  function updateToolbar() {
    const isMobile = window.innerWidth < 1024;
    const keyboardH = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    if (isMobile && keyboardH > 150) {
      toolbar.style.cssText = 'position:fixed;bottom:'+keyboardH+'px;left:0;right:0;z-index:50;border-radius:0;border-top:1px solid #e7e5e4;border-bottom:none;box-shadow:0 -2px 8px rgba(0,0,0,.08);background:#fafaf9;padding:.35rem .75rem';
    } else {
      toolbar.style.cssText = '';
    }
  }
  vv.addEventListener('resize', updateToolbar);
  vv.addEventListener('scroll', updateToolbar);
})();

document.addEventListener('click', e => {
  const imgDiv = e.target.closest('#iim-gallery [data-url]');
  if (imgDiv) { pickImg(imgDiv.dataset.url, imgDiv.dataset.caption); return; }
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  switch (btn.dataset.action) {
    case 'insert-photo': insertPhotoInText(btn.dataset.url, btn.dataset.caption); break;
    case 'del-existing-photo': delExistingPhoto(parseInt(btn.dataset.id), parseInt(btn.dataset.index)); break;
    case 'rm-new-photo': rmNewPhoto(parseInt(btn.dataset.index)); break;
  }
});
document.addEventListener('error', e => {
  const img = e.target;
  if (img.tagName === 'IMG' && img.dataset.fallback) {
    const fb = img.dataset.fallback;
    img.removeAttribute('data-fallback');
    img.src = fb;
  }
}, true);
init().catch(err => console.error('[editor] init() failed:', err));
</script>
</body>
</html>`);
}
