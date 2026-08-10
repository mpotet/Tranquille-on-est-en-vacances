/**
 * pages/admin.js - Admin interface HTML templates
 * Served only to authenticated users (checked in index.js before calling these).
 */

import { HEAD, TOAST, NAV } from './shell.js';
import { html } from '../utils.js';
import { safeText, safeAttr } from '../helpers/html.js';

// ── Admin nav ─────────────────────────────────────────────────
// Reuse the SAME public nav bar (in its authenticated form, with the grouped
// admin dropdown) so the site header is identical everywhere - public pages
// and admin pages alike. The only admin-specific addition is the offline
// status bar below it. `active` marks which top-level tab is current.
const ADMIN_NAV = (active = '') => `
${NAV(active, true)}
<!-- Pastille état connexion : discrète, coin bas-gauche, masquée par défaut -->
<div id="offline-bar" class="hidden fixed z-40 items-center gap-1.5 text-xs font-bold" style="bottom:1rem;left:1rem;padding:.4rem .75rem;border-radius:999px;background:var(--cream);border:1px solid rgba(var(--apricot-rgb),.5);box-shadow:var(--card-shadow);color:var(--pending)" role="status" aria-live="polite"></div>
<script>
(function(){
  const bar = document.getElementById('offline-bar');
  function update() {
    if (!bar) return;
    if (!navigator.onLine) {
      bar.className = 'flex fixed z-40 items-center gap-1.5 text-xs font-bold';
      bar.style.cssText = 'bottom:1rem;left:1rem;padding:.4rem .75rem;border-radius:999px;background:var(--cream);border:1px solid rgba(var(--apricot-rgb),.5);box-shadow:var(--card-shadow);color:var(--pending)';
      bar.innerHTML = '<i class="ph-bold ph-wifi-x"></i> Hors connexion';
    } else {
      bar.className = 'hidden';
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
      <div class="mb-5 bg-amber-50 px-4 py-3 rounded-2xl text-sm font-medium border border-amber-100" style="color:var(--pending)">
        <i class="ph-fill ph-envelope-simple"></i> Compte non initialisé - vérifiez vos emails pour définir votre mot de passe.
      </div>
      <p class="text-sm text-stone-500">Un lien d'initialisation a été (ou sera) envoyé à l'adresse administrateur. Il est valable 1 heure.</p>`;

  const loginForm = `
      ${error ? `<div class="mb-5 bg-red-50 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium border border-red-100"><i class="ph-fill ph-x-circle"></i> ${safeErr}</div>` : ''}
      <form method="POST" action="/admin/login" id="login-form">
        <div class="mb-6">
          <label class="block text-sm font-bold mb-2" style="color:var(--ink)" for="password">Mot de passe</label>
          <input type="password" id="password" name="password" placeholder="••••••••" autofocus required
                 class="w-full border-2 border-stone-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-sky-400 transition-colors font-medium">
        </div>
        <button type="submit" class="w-full action-btn justify-center text-base">
          Se connecter <i class="ph-bold ph-arrow-right"></i>
        </button>
      </form>
      <div class="mt-4 text-center">
        <button type="button" id="forgot-link" class="text-sm hover:underline transition-colors" style="color:var(--ink-light)">Mot de passe oublié ?</button>
      </div>

      <!-- Forgot-password panel (hidden until toggled) -->
      <div id="forgot-panel" class="hidden mt-5 pt-5 border-t border-stone-100">
        <div id="forgot-done" class="hidden bg-emerald-50 px-4 py-3 rounded-2xl text-sm font-medium border border-emerald-100" style="color:var(--palm)">
          <i class="ph-fill ph-check-circle"></i> Si cette adresse est reconnue, un email a été envoyé.
        </div>
        <form id="forgot-form">
          <label class="block text-sm font-bold mb-2" style="color:var(--ink)" for="forgot-email">Votre adresse email</label>
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
<body class="min-h-screen font-sans antialiased" style="background:radial-gradient(120% 100% at 50% 0%, var(--blue-light) 0%, var(--cream) 55%)">
<div class="min-h-screen flex items-center justify-center px-4 py-12">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <a href="/" class="inline-block">
        <span class="inline-flex items-center justify-center mb-3" style="width:4.5rem;height:4.5rem;border-radius:999px;background:var(--blue-light);border:2px solid rgba(var(--blue-rgb),.14)"><i class="ph-bold ph-lock-key" style="font-size:2rem;color:var(--blue)"></i></span>
      </a>
      <h1 class="font-display text-3xl font-bold" style="color:var(--ink)">Espace Admin</h1>
      <p class="mt-2 text-sm" style="color:var(--ink-muted)">Connexion réservée à la famille Potet</p>
    </div>
    <div class="panel rounded-[2rem] p-8">
      ${noPassword ? notInitialised : loginForm}
    </div>
    <p class="text-center text-sm mt-6" style="color:var(--ink-light)">
      <a href="/" style="color:var(--ink-light)" class="hover:underline">← Retour au blog</a>
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
    <button type="button" id="admintab-articles" role="tab" data-tab="articles" class="admin-tab" aria-selected="true" aria-controls="tab-articles"><i class="ph-bold ph-notebook"></i> Articles</button>
    <button type="button" id="admintab-analytics" role="tab" data-tab="analytics" class="admin-tab" aria-selected="false" aria-controls="tab-analytics" tabindex="-1"><i class="ph-bold ph-chart-line"></i> Visites</button>
    <button type="button" id="admintab-settings" role="tab" data-tab="settings" class="admin-tab" aria-selected="false" aria-controls="tab-settings" tabindex="-1"><i class="ph-bold ph-gear"></i> Paramètres du site</button>
    <button type="button" id="admintab-account" role="tab" data-tab="account" class="admin-tab" aria-selected="false" aria-controls="tab-account" tabindex="-1"><i class="ph-bold ph-user-circle"></i> Compte</button>
    <button type="button" id="admintab-emails" role="tab" data-tab="emails" class="admin-tab" aria-selected="false" aria-controls="tab-emails" tabindex="-1"><i class="ph-bold ph-envelope"></i> Emails</button>
    <button type="button" id="admintab-subscribers" role="tab" data-tab="subscribers" class="admin-tab" aria-selected="false" aria-controls="tab-subscribers" tabindex="-1"><i class="ph-bold ph-users-three"></i> Abonnés</button>
    <button type="button" id="admintab-moderation" role="tab" data-tab="moderation" class="admin-tab" aria-selected="false" aria-controls="tab-moderation" tabindex="-1"><i class="ph-bold ph-shield-check"></i> Modération</button>
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

        <!-- Tab Articles -->
      <div id="tab-articles" class="admin-tab-panel active" role="tabpanel" aria-labelledby="admintab-articles">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h2 class="font-display text-2xl font-bold" style="color:var(--ink)">Vos récits</h2>
            <p class="text-sm mt-0.5" style="color:var(--ink-muted)">Tous vos voyages, publiés ou en préparation, au même endroit.</p>
          </div>
          <a href="/admin/editor" class="action-btn-sm"><i class="ph-bold ph-plus-circle"></i> Nouvel article</a>
        </div>

        <!-- Stat tiles -->
        <div class="grid grid-cols-4 gap-2 sm:gap-3 mb-6">
          <div class="rounded-2xl p-2.5 sm:p-4 text-center" style="background:var(--cream);border:1px solid var(--line)">
            <div id="stat-total" class="text-lg sm:text-2xl font-black" style="color:var(--ink)">-</div>
            <div class="text-[.65rem] sm:text-xs font-bold mt-1 leading-tight" style="color:var(--ink-muted)">Articles</div>
          </div>
          <div class="rounded-2xl p-2.5 sm:p-4 text-center" style="background:var(--blue-light);border:1px solid rgba(var(--blue-rgb),.16)">
            <div id="stat-views" class="text-lg sm:text-2xl font-black" style="color:var(--blue)">-</div>
            <div class="text-[.65rem] sm:text-xs font-bold mt-1 leading-tight" style="color:var(--blue-dark)">Vues</div>
          </div>
          <div class="rounded-2xl p-2.5 sm:p-4 text-center" style="background:var(--palm-light);border:1px solid rgba(var(--palm-rgb),.16)">
            <div id="stat-pub" class="text-lg sm:text-2xl font-black" style="color:var(--palm)">-</div>
            <div class="text-[.65rem] sm:text-xs font-bold mt-1 leading-tight" style="color:var(--palm)">Publiés</div>
          </div>
          <div class="rounded-2xl p-2.5 sm:p-4 text-center" style="background:rgba(var(--apricot-rgb),.18);border:1px solid rgba(var(--apricot-rgb),.4)">
            <div id="stat-draft" class="text-lg sm:text-2xl font-black" style="color:var(--pending)">-</div>
            <div class="text-[.65rem] sm:text-xs font-bold mt-1 leading-tight" style="color:var(--pending)">Archivés</div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">

          <!-- Sidebar : dossiers -->
          <aside class="lg:col-span-1">
            <div class="section-panel majorelle-frame rounded-2xl overflow-hidden" style="box-shadow:var(--card-shadow);border:1px solid var(--line)">
              <div class="px-5 py-4 flex items-center justify-between gap-3" style="border-bottom:1px solid var(--line)">
                <h3 class="font-bold text-sm" style="color:var(--ink)"><i class="ph-bold ph-folder" style="color:var(--blue)"></i> Dossiers</h3>
                <button type="button" onclick="openFolderModal(null)" class="ghost-btn" style="padding:.3rem .7rem;font-size:.75rem"><i class="ph-bold ph-plus"></i> Nouveau</button>
              </div>
              <div id="folder-tree" class="p-2 max-h-96 overflow-y-auto">
                <div class="text-sm text-center py-6" style="color:var(--ink-light)">Chargement…</div>
              </div>
            </div>
          </aside>

          <!-- Articles list -->
          <main class="lg:col-span-3">
            <div class="flex justify-end mb-4">
              <select id="admin-sort-select" class="rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none" style="border:2px solid var(--line);background:var(--cream);color:var(--ink)">
                <option value="date_desc">Plus récents</option>
                <option value="date_asc">Plus anciens</option>
                <option value="views_desc">Les plus lus</option>
                <option value="title_asc">Titre (A→Z)</option>
              </select>
            </div>

            <div id="articles-list" class="grid sm:grid-cols-2 gap-4">
              ${Array.from({length:4}).map(() => `
                <div class="section-panel rounded-2xl p-4 flex items-center gap-4" style="border:1px solid var(--line)">
                  <div class="w-16 h-16 rounded-xl animate-pulse flex-shrink-0" style="background:var(--sand)"></div>
                  <div class="flex-1 space-y-2">
                    <div class="h-4 rounded-full animate-pulse w-3/4" style="background:var(--sand)"></div>
                    <div class="h-3 rounded-full animate-pulse w-1/2" style="background:var(--sand)"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </main>

        </div>
      </div>

      <!-- Tab Analytics -->
      <div id="tab-analytics" class="admin-tab-panel" role="tabpanel" aria-labelledby="admintab-analytics">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 class="font-display text-2xl font-bold" style="color:var(--ink)">Qui lit le carnet ?</h2>
            <p class="text-sm mt-0.5" style="color:var(--ink-muted)">Aucune IP n'est jamais enregistrée - juste le pays/ville fourni par le réseau, pour voir d'où viennent les lecteurs.</p>
          </div>
          <div class="flex gap-1.5 flex-wrap" role="group" aria-label="Période">
            <button type="button" class="period-pill" data-period="today">Aujourd'hui</button>
            <button type="button" class="period-pill" data-period="7">7 jours</button>
            <button type="button" class="period-pill is-active" data-period="30">30 jours</button>
            <button type="button" class="period-pill" data-period="90">90 jours</button>
            <button type="button" class="period-pill" data-period="all">Tout</button>
          </div>
        </div>

        <div id="analytics-content">
          <div class="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
            <div class="rounded-2xl p-2.5 sm:p-4 text-center" style="background:var(--blue-light);border:1px solid rgba(var(--blue-rgb),.16)">
              <div id="an-total" class="text-lg sm:text-2xl font-black" style="color:var(--blue)">-</div>
              <div class="text-[.65rem] sm:text-xs font-bold mt-1 leading-tight" style="color:var(--blue-dark)">Visites</div>
            </div>
            <div class="rounded-2xl p-2.5 sm:p-4 text-center" style="background:var(--palm-light);border:1px solid rgba(var(--palm-rgb),.16)">
              <div id="an-trend" class="text-lg sm:text-2xl font-black" style="color:var(--palm)">-</div>
              <div class="text-[.65rem] sm:text-xs font-bold mt-1 leading-tight" style="color:var(--palm)">vs période préc.</div>
            </div>
            <div class="rounded-2xl p-2.5 sm:p-4 text-center" style="background:var(--cream);border:1px solid var(--line)">
              <div id="an-countries" class="text-lg sm:text-2xl font-black" style="color:var(--ink)">-</div>
              <div class="text-[.65rem] sm:text-xs font-bold mt-1 leading-tight" style="color:var(--ink-muted)">Pays distincts</div>
            </div>
          </div>

          <div class="section-panel majorelle-frame rounded-2xl p-5 mb-6" style="box-shadow:var(--card-shadow);border:1px solid var(--line)">
            <div class="flex flex-wrap items-baseline justify-between gap-2 mb-4">
              <h3 id="an-daily-title" class="font-bold text-sm" style="color:var(--ink)"><i class="ph-bold ph-chart-bar"></i> Visites par jour</h3>
              <span id="an-daily-summary" class="text-xs font-semibold" style="color:var(--ink-muted)"></span>
            </div>
            <div style="position:relative">
              <div id="an-tooltip" class="hidden" style="position:fixed;z-index:80;pointer-events:none;background:var(--ink);color:#fff;font-size:.72rem;font-weight:700;padding:.35rem .6rem;border-radius:.5rem;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,.25);transform:translate(-50%,-100%)"></div>
              <div id="an-daily-chart" style="display:flex;align-items:flex-end;gap:2px;height:90px"></div>
            </div>
            <div id="an-daily-labels" class="flex justify-between text-xs mt-2" style="color:var(--ink-light)"></div>
          </div>

          <div class="grid lg:grid-cols-2 gap-6">
            <div class="section-panel majorelle-frame rounded-2xl p-5" style="box-shadow:var(--card-shadow);border:1px solid var(--line)">
              <h3 class="font-bold text-sm mb-4" style="color:var(--ink)"><i class="ph-bold ph-globe-hemisphere-west"></i> D'où viennent les lecteurs</h3>
              <div id="an-countries-list" class="space-y-2.5"><div class="text-sm text-center py-6" style="color:var(--ink-light)">Chargement…</div></div>
            </div>
            <div class="section-panel majorelle-frame rounded-2xl p-5" style="box-shadow:var(--card-shadow);border:1px solid var(--line)">
              <h3 class="font-bold text-sm mb-4" style="color:var(--ink)"><i class="ph-bold ph-fire"></i> Les plus lus sur la période</h3>
              <div id="an-top-articles" class="space-y-2.5"><div class="text-sm text-center py-6" style="color:var(--ink-light)">Chargement…</div></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Subscribers -->
      <div id="tab-subscribers" class="admin-tab-panel" role="tabpanel" aria-labelledby="admintab-subscribers">
        <div class="section-panel majorelle-frame rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div class="px-6 py-5 border-b border-stone-100">
            <h2 class="font-bold text-stone-800 text-base"><i class="ph-bold ph-users-three" style="color:var(--blue)"></i> Abonnés email</h2>
            <p class="text-xs text-stone-400 mt-0.5">Liste des abonnés à la newsletter; possibilité de désabonner manuellement.</p>
          </div>
          <div class="px-6 pb-6 pt-4">
            <div id="subscribers-list" class="divide-y divide-stone-100 text-sm text-stone-700">
              <div class="text-stone-400 p-6 text-center">Chargement...</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Moderation -->
      <div id="tab-moderation" class="admin-tab-panel" role="tabpanel" aria-labelledby="admintab-moderation">
        <!-- Stat tiles -->
        <div class="grid grid-cols-3 gap-3 mb-5">
          <div class="rounded-2xl p-4 text-center" style="background:var(--cream);border:1px solid var(--line)">
            <div id="mod-stat-total" class="text-2xl font-black" style="color:var(--ink)">-</div>
            <div class="text-xs font-bold mt-1" style="color:var(--ink-muted)">Commentaires</div>
          </div>
          <div class="rounded-2xl p-4 text-center" style="background:var(--cream);border:1px solid var(--line)">
            <div id="mod-stat-week" class="text-2xl font-black" style="color:var(--blue)">-</div>
            <div class="text-xs font-bold mt-1" style="color:var(--ink-muted)">Cette semaine</div>
          </div>
          <div class="rounded-2xl p-4 text-center" style="background:var(--cream);border:1px solid var(--line)">
            <div id="mod-stat-replies" class="text-2xl font-black" style="color:var(--palm)">-</div>
            <div class="text-xs font-bold mt-1" style="color:var(--ink-muted)">Vos réponses</div>
          </div>
        </div>

        <div class="section-panel majorelle-frame rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div class="px-6 py-5 border-b border-stone-100 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 class="font-bold text-stone-800 text-base"><i class="ph-bold ph-chats-circle" style="color:var(--blue)"></i> Commentaires récents</h2>
              <p class="text-xs text-stone-400 mt-0.5">Les 20 derniers, tous voyages confondus. Répondez en tant qu'admin ou supprimez un message inapproprié.</p>
            </div>
            <button type="button" onclick="loadRecentComments()" class="ghost-btn" style="padding:.4rem .8rem;font-size:.78rem" title="Actualiser"><i class="ph-bold ph-arrow-clockwise"></i> Actualiser</button>
          </div>
          <div class="px-4 sm:px-6 pb-6 pt-4">
            <div id="recent-comments-list" class="space-y-3">
              <div class="text-stone-400 p-6 text-center">Chargement...</div>
            </div>
          </div>
        </div>
      </div>

  <!-- Tab: Site settings -->
  <div id="tab-settings" class="admin-tab-panel" role="tabpanel" aria-labelledby="admintab-settings">
  <div class="section-panel majorelle-frame rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
    <div class="px-6 py-5 border-b border-stone-100">
      <h2 class="font-bold text-stone-800 text-base"><i class="ph-bold ph-gear" style="color:var(--blue)"></i> Contenu &amp; paramètres du site</h2>
      <p class="text-xs text-stone-400 mt-0.5">Héro (image + textes), accroche, commentaires</p>
    </div>
    <div class="px-6 pb-6 pt-2">

      <!-- Hero image -->
      <div class="mt-5">
        <label class="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide"><i class="ph-bold ph-image"></i> Image héro (page d'accueil)</label>
        <div class="rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 p-4">
          <div class="flex flex-col sm:flex-row sm:items-center gap-3">
            <input type="file" id="s-hero-img-file" accept="image/*" class="hidden" onchange="uploadHeroImageFromSettings(this.files)">
            <button type="button" onclick="document.getElementById('s-hero-img-file').click()" class="action-btn-sm"><i class="ph-bold ph-upload-simple"></i> Importer une image</button>
            <button type="button" id="s-hero-img-delete-btn" onclick="deleteHeroImageFromSettings()" class="action-btn-sm" style="background:rgba(220,60,60,.92)!important;border-color:rgba(220,60,60,.92)!important;display:none"><i class="ph-bold ph-trash"></i> Supprimer</button>
            <p class="text-xs text-stone-500 font-medium">L'image est stockée dans le bucket photos puis utilisée sur la page d'accueil.</p>
          </div>
          <input type="hidden" id="s-hero-img">
        </div>
        <div id="s-hero-img-preview" class="hidden mt-2">
          <img id="s-hero-img-el" src="" alt="" class="w-full h-28 object-cover rounded-xl">
        </div>
      </div>

      <!-- Home texts : every text on the public home page -->
      <p class="text-xs font-black uppercase tracking-wider mt-6 mb-1" style="color:var(--blue)"><i class="ph-bold ph-house"></i> Textes de la page d'accueil</p>
      <p class="text-xs mb-3" style="color:var(--ink-light)">Tous les textes de la page d'accueil sont modifiables ici. Laissez un champ vide pour garder le texte par défaut.</p>

      <!-- Section hero -->
      <p class="text-[.7rem] font-bold uppercase tracking-wider mt-4 mb-2" style="color:var(--ink-muted)">En-tête (héro)</p>
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold mb-1.5 uppercase tracking-wide" style="color:var(--ink-muted)"><i class="ph-bold ph-tag"></i> Sur-titre (eyebrow)</label>
          <input type="text" id="s-hero-eyebrow" placeholder="Le carnet des Potet" class="w-full rounded-xl px-4 py-2.5 focus:outline-none transition-colors text-sm" style="border:2px solid var(--line)">
        </div>
        <div>
          <label class="block text-xs font-bold mb-1.5 uppercase tracking-wide" style="color:var(--ink-muted)"><i class="ph-bold ph-seal-warning"></i> Badge (citation)</label>
          <input type="text" id="s-hero-badge" placeholder="&quot;Mais ça c'était bien avant le drame...&quot;" class="w-full rounded-xl px-4 py-2.5 focus:outline-none transition-colors text-sm" style="border:2px solid var(--line)">
        </div>
        <div class="sm:col-span-2">
          <label class="block text-xs font-bold mb-1.5 uppercase tracking-wide" style="color:var(--ink-muted)"><i class="ph-bold ph-text-t"></i> Titre héro <span class="font-normal normal-case" style="color:var(--ink-light)">(HTML : &lt;em&gt;, &lt;br&gt;)</span></label>
          <input type="text" id="s-hero-title" placeholder="Entrez, on allait justement…" class="w-full rounded-xl px-4 py-2.5 focus:outline-none transition-colors text-sm" style="border:2px solid var(--line)">
        </div>
        <div class="sm:col-span-2">
          <label class="block text-xs font-bold mb-1.5 uppercase tracking-wide" style="color:var(--ink-muted)"><i class="ph-bold ph-chat-text"></i> Sous-titre héro</label>
          <textarea id="s-hero-subtitle" rows="2" placeholder="Depuis 2011, on part quelque part…" class="w-full rounded-xl px-4 py-2.5 focus:outline-none transition-colors text-sm resize-none" style="border:2px solid var(--line)"></textarea>
        </div>
        <div>
          <label class="block text-xs font-bold mb-1.5 uppercase tracking-wide" style="color:var(--ink-muted)"><i class="ph-bold ph-cursor-click"></i> Bouton principal</label>
          <input type="text" id="s-hero-cta-primary" placeholder="Lire nos aventures" class="w-full rounded-xl px-4 py-2.5 focus:outline-none transition-colors text-sm" style="border:2px solid var(--line)">
        </div>
        <div>
          <label class="block text-xs font-bold mb-1.5 uppercase tracking-wide" style="color:var(--ink-muted)"><i class="ph-bold ph-cursor"></i> Bouton secondaire</label>
          <input type="text" id="s-hero-cta-secondary" placeholder="Nos coins du monde" class="w-full rounded-xl px-4 py-2.5 focus:outline-none transition-colors text-sm" style="border:2px solid var(--line)">
        </div>
      </div>

      <!-- Section stats -->
      <p class="text-[.7rem] font-bold uppercase tracking-wider mt-5 mb-2" style="color:var(--ink-muted)">Compteurs (libellés sous les chiffres)</p>
      <div class="grid sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs font-bold mb-1.5 uppercase tracking-wide" style="color:var(--ink-muted)">Compteur 1 - voyages</label>
          <input type="text" id="s-stat-voyages" placeholder="aventures depuis 2011" class="w-full rounded-xl px-4 py-2.5 focus:outline-none transition-colors text-sm" style="border:2px solid var(--line)">
        </div>
        <div>
          <label class="block text-xs font-bold mb-1.5 uppercase tracking-wide" style="color:var(--ink-muted)">Compteur 2 - pays</label>
          <input type="text" id="s-stat-dest" placeholder="pays, une seule Dacia" class="w-full rounded-xl px-4 py-2.5 focus:outline-none transition-colors text-sm" style="border:2px solid var(--line)">
        </div>
        <div>
          <label class="block text-xs font-bold mb-1.5 uppercase tracking-wide" style="color:var(--ink-muted)">Compteur 3 - Maroc</label>
          <input type="text" id="s-stat-maroc" placeholder="séjours au Maroc" class="w-full rounded-xl px-4 py-2.5 focus:outline-none transition-colors text-sm" style="border:2px solid var(--line)">
        </div>
      </div>

      <!-- Section "Nos derniers voyages" -->
      <p class="text-[.7rem] font-bold uppercase tracking-wider mt-5 mb-2" style="color:var(--ink-muted)">Section « Nos derniers voyages »</p>
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold mb-1.5 uppercase tracking-wide" style="color:var(--ink-muted)">Sur-titre</label>
          <input type="text" id="s-recent-eyebrow" placeholder="Sélection maison" class="w-full rounded-xl px-4 py-2.5 focus:outline-none transition-colors text-sm" style="border:2px solid var(--line)">
        </div>
        <div>
          <label class="block text-xs font-bold mb-1.5 uppercase tracking-wide" style="color:var(--ink-muted)">Titre</label>
          <input type="text" id="s-recent-title" placeholder="Nos derniers voyages" class="w-full rounded-xl px-4 py-2.5 focus:outline-none transition-colors text-sm" style="border:2px solid var(--line)">
        </div>
        <div class="sm:col-span-2">
          <label class="block text-xs font-bold mb-1.5 uppercase tracking-wide" style="color:var(--ink-muted)">Sous-titre</label>
          <textarea id="s-recent-subtitle" rows="2" placeholder="Les récits les plus récents…" class="w-full rounded-xl px-4 py-2.5 focus:outline-none transition-colors text-sm resize-none" style="border:2px solid var(--line)"></textarea>
        </div>
      </div>

      <!-- Section "Le mot des Potet" -->
      <p class="text-[.7rem] font-bold uppercase tracking-wider mt-5 mb-2" style="color:var(--ink-muted)">Section « Le mot des Potet »</p>
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold mb-1.5 uppercase tracking-wide" style="color:var(--ink-muted)">Sur-titre</label>
          <input type="text" id="s-about-eyebrow" placeholder="Salut, c'est nous" class="w-full rounded-xl px-4 py-2.5 focus:outline-none transition-colors text-sm" style="border:2px solid var(--line)">
        </div>
        <div class="sm:col-span-2">
          <label class="block text-xs font-bold mb-1.5 uppercase tracking-wide" style="color:var(--ink-muted)">Présentation de la famille</label>
          <textarea id="s-about-text" rows="4" placeholder="Nous, c'est la famille Potet…" class="w-full rounded-xl px-4 py-2.5 focus:outline-none transition-colors text-sm resize-none" style="border:2px solid var(--line)"></textarea>
        </div>
      </div>

      <!-- Section "Nos coins du monde" -->
      <p class="text-[.7rem] font-bold uppercase tracking-wider mt-5 mb-2" style="color:var(--ink-muted)">Section « Nos coins du monde »</p>
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold mb-1.5 uppercase tracking-wide" style="color:var(--ink-muted)">Sur-titre</label>
          <input type="text" id="s-dest-eyebrow" placeholder="Où on a traîné nos valises" class="w-full rounded-xl px-4 py-2.5 focus:outline-none transition-colors text-sm" style="border:2px solid var(--line)">
        </div>
        <div>
          <label class="block text-xs font-bold mb-1.5 uppercase tracking-wide" style="color:var(--ink-muted)">Titre</label>
          <input type="text" id="s-dest-title" placeholder="Nos coins du monde" class="w-full rounded-xl px-4 py-2.5 focus:outline-none transition-colors text-sm" style="border:2px solid var(--line)">
        </div>
        <div class="sm:col-span-2">
          <label class="block text-xs font-bold mb-1.5 uppercase tracking-wide" style="color:var(--ink-muted)">Sous-titre</label>
          <textarea id="s-dest-subtitle" rows="2" placeholder="Choisissez un pays…" class="w-full rounded-xl px-4 py-2.5 focus:outline-none transition-colors text-sm resize-none" style="border:2px solid var(--line)"></textarea>
        </div>
      </div>

      <!-- Section abonnement + install -->
      <p class="text-[.7rem] font-bold uppercase tracking-wider mt-5 mb-2" style="color:var(--ink-muted)">Section abonnement &amp; installation de l'app</p>
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold mb-1.5 uppercase tracking-wide" style="color:var(--ink-muted)">Abonnement - titre</label>
          <input type="text" id="s-sub-title" placeholder="On repart bientôt." class="w-full rounded-xl px-4 py-2.5 focus:outline-none transition-colors text-sm" style="border:2px solid var(--line)">
        </div>
        <div>
          <label class="block text-xs font-bold mb-1.5 uppercase tracking-wide" style="color:var(--ink-muted)">Abonnement - sous-titre</label>
          <input type="text" id="s-sub-subtitle" placeholder="Laissez votre email…" class="w-full rounded-xl px-4 py-2.5 focus:outline-none transition-colors text-sm" style="border:2px solid var(--line)">
        </div>
        <div>
          <label class="block text-xs font-bold mb-1.5 uppercase tracking-wide" style="color:var(--ink-muted)">Install app - titre</label>
          <input type="text" id="s-install-title" placeholder="Gardez le carnet sur vous" class="w-full rounded-xl px-4 py-2.5 focus:outline-none transition-colors text-sm" style="border:2px solid var(--line)">
        </div>
        <div>
          <label class="block text-xs font-bold mb-1.5 uppercase tracking-wide" style="color:var(--ink-muted)">Install app - texte</label>
          <input type="text" id="s-install-text" placeholder="Installez l'app sur votre téléphone…" class="w-full rounded-xl px-4 py-2.5 focus:outline-none transition-colors text-sm" style="border:2px solid var(--line)">
        </div>
      </div>

      <!-- Citation de bas de page -->
      <p class="text-[.7rem] font-bold uppercase tracking-wider mt-5 mb-2" style="color:var(--ink-muted)">Citation de bas de page</p>
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold mb-1.5 uppercase tracking-wide" style="color:var(--ink-muted)"><i class="ph-bold ph-quotes"></i> Citation</label>
          <input type="text" id="s-tagline" placeholder="&quot;Mais ça c'était bien avant le drame...&quot;" class="w-full rounded-xl px-4 py-2.5 focus:outline-none transition-colors text-sm" style="border:2px solid var(--line)">
        </div>
        <div>
          <label class="block text-xs font-bold mb-1.5 uppercase tracking-wide" style="color:var(--ink-muted)">Attribution</label>
          <input type="text" id="s-tagline-author" placeholder="Devise de la famille Potet" class="w-full rounded-xl px-4 py-2.5 focus:outline-none transition-colors text-sm" style="border:2px solid var(--line)">
        </div>
      </div>

      <!-- Comment gate -->
      <p class="text-xs font-black text-stone-400 uppercase tracking-wider mt-6 mb-3">Commentaires - question anti-spam</p>
      <div class="grid sm:grid-cols-2 gap-5">
        <div class="sm:col-span-2">
          <label class="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide"><i class="ph-bold ph-shield-check"></i> Question secrète</label>
          <input type="text" id="s-gate-question" placeholder="Quel est le nom du chat roux de la famille Potet ?" class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm">
        </div>
        <div>
          <label class="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide"><i class="ph-bold ph-key"></i> Réponse attendue</label>
          <input type="text" id="s-gate-answer" placeholder="wifi" autocomplete="off" class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm">
          <p class="text-xs text-stone-400 mt-1">Comparaison insensible à la casse et aux espaces.</p>
        </div>
      </div>

      <!-- Admin display name -->
      <div class="mt-4">
        <label class="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide"><i class="ph-bold ph-user-circle-gear"></i> Nom affiché par l'admin (réponses aux commentaires)</label>
        <input type="text" id="s-admin-display-name" placeholder="Damien Potet" class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm">
        <p class="text-xs text-stone-400 mt-1">Nom utilisé lors des réponses aux commentaires.</p>
      </div>

      <!-- Contact -->
      <p class="text-xs font-black text-stone-400 uppercase tracking-wider mt-6 mb-3">Contact</p>
      <div class="mt-1">
        <label class="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide"><i class="ph-bold ph-envelope-simple"></i> Adresse email de contact</label>
        <input type="email" id="s-contact-email" placeholder="tranquilleonestenvacances@free.fr" autocomplete="off" class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm">
        <p class="text-xs text-stone-400 mt-1">Affichée dans le pied de page du site et sur la page "Créer mon carnet" pour que les visiteurs puissent vous contacter.</p>
      </div>

      <!-- Easter egg -->
      <p class="text-xs font-black text-stone-400 uppercase tracking-wider mt-6 mb-3">Easter egg - dromadaire 🐪</p>
      <div class="mt-1">
        <label class="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide"><i class="ph-bold ph-keyboard"></i> Mot déclencheur</label>
        <input type="text" id="s-easter-egg-word" placeholder="maroc" autocomplete="off" class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm">
        <p class="text-xs text-stone-400 mt-1">Tapez ce mot sur le site (en dehors d'un champ de saisie) pour faire apparaître le dromadaire. "maroc" par défaut.</p>
      </div>

      <div class="mt-6 flex justify-end">
        <button onclick="saveSettings()" class="action-btn-sm"><i class="ph-bold ph-floppy-disk"></i> Sauvegarder les paramètres</button>
      </div>
    </div>
  </div>
  </div>




  <!-- Tab: Account -->
  <div id="tab-account" class="admin-tab-panel" role="tabpanel" aria-labelledby="admintab-account">
  <div class="section-panel majorelle-frame rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
    <div class="px-6 py-5 border-b border-stone-100">
      <h2 class="font-bold text-stone-800 text-base"><i class="ph-bold ph-user-circle" style="color:var(--blue)"></i> Compte administrateur</h2>
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
          <button onclick="requestEmailChange()" class="action-btn-sm whitespace-nowrap"><i class="ph-bold ph-paper-plane-tilt"></i> Demander le changement</button>
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
          <button onclick="changePassword()" class="action-btn-sm"><i class="ph-bold ph-key"></i> Modifier le mot de passe</button>
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
        <h2 class="font-bold text-stone-800 text-base"><i class="ph-bold ph-paper-plane-tilt" style="color:var(--blue)"></i> Envoi des emails</h2>
        <p class="text-xs text-stone-400 mt-0.5">Aucun nom de domaine requis : il suffit de vérifier votre propre adresse email (même @free.fr, @gmail.com...) pour pouvoir envoyer vers n'importe quelle boîte mail.</p>
      </div>
      <div class="px-6 pb-6 pt-4">
        <div id="email-config-status" class="text-sm text-stone-500 mb-5">Chargement…</div>

        <details class="rounded-xl border border-stone-100 bg-stone-50 mb-5">
          <summary class="px-4 py-3 cursor-pointer list-none select-none text-sm font-bold text-stone-700 flex items-center gap-2"><i class="ph-bold ph-lightbulb" style="color:var(--blue)"></i> Comment configurer Mailjet (5 minutes) <span class="text-stone-400 font-normal ml-auto text-xs">Cliquer pour ouvrir ▾</span></summary>
          <ol class="px-4 pb-4 text-sm text-stone-600 space-y-2 list-decimal list-inside">
            <li>Créez un compte gratuit sur <strong>mailjet.com</strong> (bouton "S'inscrire", gratuit jusqu'à 6000 emails/mois - 200/jour, aucune carte bancaire requise).</li>
            <li>Une fois connecté, allez dans <strong>Compte → Clés API REST</strong> (ou "API Key Management") pour récupérer votre <strong>API Key</strong> et votre <strong>Secret Key</strong>.</li>
            <li>Renseignez ci-dessous ces deux clés, l'adresse email à utiliser pour l'envoi (ex: votre adresse @free.fr) et le nom affiché, puis cliquez sur <strong>Enregistrer</strong>.</li>
            <li>Cliquez ensuite sur <strong>Envoyer l'email de vérification</strong> ci-dessous - Mailjet envoie un lien de confirmation à cette adresse.</li>
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
        <div class="mt-4 flex flex-col sm:flex-row flex-wrap gap-2 sm:justify-end">
          <button onclick="requestSenderVerification()" class="subtle-btn text-sm justify-center whitespace-nowrap"><i class="ph-bold ph-paper-plane-tilt"></i> Envoyer l'email de vérification</button>
          <button onclick="checkSenderStatus()" class="subtle-btn text-sm justify-center whitespace-nowrap"><i class="ph-bold ph-arrow-clockwise"></i> Vérifier le statut</button>
          <button onclick="saveEmailConfig()" class="action-btn-sm justify-center whitespace-nowrap"><i class="ph-bold ph-floppy-disk"></i> Enregistrer</button>
        </div>
      </div>
    </div>

    <!-- Send history: subscriber notifications + admin-account emails, side by side -->
    <div class="grid lg:grid-cols-2 gap-6">

      <!-- Subscriber notification history -->
      <div class="section-panel majorelle-frame rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h2 class="font-bold text-stone-800 text-base"><i class="ph-bold ph-users-three" style="color:var(--blue)"></i> Notifications envoyées aux lecteurs</h2>
            <p class="text-xs text-stone-400 mt-0.5">Les 50 derniers envois (nouveau récit / mise à jour). Cliquez une ligne pour voir qui l'a reçue.</p>
          </div>
          <button onclick="loadSubscriberEmailLog()" class="text-sky-600 hover:text-sky-700 text-sm font-bold transition-colors"><i class="ph-bold ph-arrow-clockwise"></i></button>
        </div>
        <div id="subscriber-email-log-list" class="divide-y divide-stone-100">
          <div class="text-stone-400 text-sm p-6 animate-pulse text-center">Chargement…</div>
        </div>
      </div>

      <!-- Admin-account email history -->
      <div class="section-panel majorelle-frame rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h2 class="font-bold text-stone-800 text-base"><i class="ph-bold ph-clock-counter-clockwise" style="color:var(--blue)"></i> Emails envoyés par le site</h2>
            <p class="text-xs text-stone-400 mt-0.5">Les 50 derniers emails techniques (configuration, réinitialisation, changement d'adresse...)</p>
          </div>
          <button onclick="loadEmailLog()" class="text-sky-600 hover:text-sky-700 text-sm font-bold transition-colors"><i class="ph-bold ph-arrow-clockwise"></i></button>
        </div>
        <div id="email-log-list" class="divide-y divide-stone-100">
          <div class="text-stone-400 text-sm p-6 animate-pulse text-center">Chargement…</div>
        </div>
      </div>

    </div>

  </div>
  </div>

</div>

<!-- Folder modal -->
<div id="folder-modal" class="hidden fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onclick="if(event.target===this)closeFolderModal()">
  <div class="section-panel majorelle-frame rounded-3xl shadow-2xl w-full max-w-sm p-6">
    <h3 class="font-display text-xl font-bold text-stone-900 mb-5"><i class="ph-bold ph-folder-plus"></i> Nouveau dossier</h3>
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
      <button id="fm-submit-btn" onclick="submitFolder()" class="flex-1 action-btn-sm">Créer <i class="ph-bold ph-check"></i></button>
    </div>
  </div>
</div>

<!-- Reply-to-comment modal (replaces prompt()) -->
<div id="reply-modal" class="hidden fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onclick="if(event.target===this)closeReplyModal()">
  <div class="section-panel majorelle-frame rounded-3xl shadow-2xl w-full max-w-md p-6">
    <h3 class="font-display text-xl font-bold text-stone-900 mb-1"><i class="ph-bold ph-arrow-bend-up-left"></i> Répondre au commentaire</h3>
    <div id="reply-context" class="rounded-xl p-3 mb-4 text-sm" style="background:var(--sand);color:var(--ink-muted)"></div>
    <textarea id="reply-body" rows="4" placeholder="Votre réponse (publiée sous votre nom d'admin)…" class="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-400 transition-colors text-sm resize-none mb-5"></textarea>
    <div class="flex gap-3">
      <button onclick="closeReplyModal()" class="flex-1 bg-stone-100 text-stone-700 font-bold py-2.5 rounded-xl hover:bg-stone-200 transition-colors text-sm">Annuler</button>
      <button id="reply-submit-btn" onclick="submitReply()" class="flex-1 action-btn-sm">Publier <i class="ph-bold ph-paper-plane-tilt"></i></button>
    </div>
  </div>
</div>

${TOAST}
<script>
let _folderParentId = null;
let _folderEditId = null;   // non-null when the folder modal is in "rename" mode

function toast(msg,type='ok',persist=false){const i=document.getElementById('toast-icon'),m=document.getElementById('toast-msg'),el=document.getElementById('toast');i.innerHTML=type==='ok'?'<i class="ph-fill ph-check-circle" style="color:var(--palm);font-size:1.25rem"></i>':type==='err'?'<i class="ph-fill ph-x-circle" style="color:var(--danger);font-size:1.25rem"></i>':'<i class="ph-fill ph-info" style="color:var(--blue);font-size:1.25rem"></i>';m.textContent=msg;el.classList.remove('hidden');clearTimeout(el._t);el.onclick=persist?(()=>el.classList.add('hidden')):null;el.style.cursor=persist?'pointer':'';if(!persist)el._t=setTimeout(()=>el.classList.add('hidden'),3000)}
// Surfaced here too (not just in the editor) so the warning still reaches the
// admin if the dashboard tab is the one open when a queued offline save/photo
// fails to sync due to an expired session - see the matching listener in
// editorPage() for why the item itself is never lost.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'auth-expired') {
      toast('Session expirée - reconnectez-vous pour envoyer ce qui est en attente (rien n\\'est perdu)', 'err', true);
    }
  });
}
function esc(s){return (s==null? '': String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function stripDataUris(html){return(html||'').replace(/\bsrc="data:[^"]*"/g,'src=""').replace(/\bsrc='data:[^']*'/g,"src=''");}
function flagImg(icon){if(!icon)return '';const cp=[...icon].map(c=>c.codePointAt(0));if(cp.length>=2&&cp[0]>=0x1F1E6&&cp[0]<=0x1F1FF&&cp[1]>=0x1F1E6&&cp[1]<=0x1F1FF){const code=[cp[0],cp[1]].map(c=>String.fromCodePoint(c-0x1F1E6+65)).join('').toLowerCase();return '<img src="https://flagcdn.com/w20/'+code+'.png" width="20" height="15" alt="'+code.toUpperCase()+'" style="vertical-align:middle;border-radius:2px;flex-shrink:0">';}return '<span>'+icon+'</span>';}
// analytics: country_code from Cloudflare (request.cf.country) is already a
// 2-letter ISO code, so this skips flagImg's emoji-decoding step entirely.
function countryFlagImg(code){if(!code||code==='??')return '<span style="font-size:1.1rem">🌍</span>';return '<img src="https://flagcdn.com/w20/'+code.toLowerCase()+'.png" width="20" height="15" alt="'+code+'" style="vertical-align:middle;border-radius:2px;flex-shrink:0">';}
const COUNTRY_NAMES={FR:'France',BE:'Belgique',CH:'Suisse',CA:'Canada',DE:'Allemagne',ES:'Espagne',IT:'Italie',GB:'Royaume-Uni',US:'États-Unis',MA:'Maroc',TN:'Tunisie',DZ:'Algérie',PT:'Portugal',NL:'Pays-Bas',LU:'Luxembourg',SN:'Sénégal',CI:"Côte d'Ivoire",OM:'Oman',JO:'Jordanie',EG:'Égypte',MR:'Mauritanie'};
function countryName(code){if(!code||code==='??')return 'Inconnu';return COUNTRY_NAMES[code]||code;}
function fmtDate(d){return new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}
function fmtDateRange(a){
  const start = a.start_date || a.date;
  const end = a.end_date || a.date;
  if (!start) return 'Dates non définies';
  return start === end ? fmtDate(start) : fmtDate(start) + ' - ' + fmtDate(end);
}

// ── Load dashboard data ───────────────────────────────────────
// Sort options mirror the public API's whitelist (api/articles.js SORT_OPTIONS),
// applied client-side here since the dashboard already fetches the full list.
const ADMIN_SORTERS = {
  date_desc:  (a,b) => new Date(b.date||b.start_date||0) - new Date(a.date||a.start_date||0),
  date_asc:   (a,b) => new Date(a.date||a.start_date||0) - new Date(b.date||b.start_date||0),
  views_desc: (a,b) => (b.view_count||0) - (a.view_count||0),
  title_asc:  (a,b) => (a.title||'').localeCompare(b.title||'', 'fr', {sensitivity:'base'}),
};
let _allArticles = [];
let _allFolders = [];
function applyArticleSort() {
  const key = document.getElementById('admin-sort-select')?.value || 'date_desc';
  const sorted = [..._allArticles].sort(ADMIN_SORTERS[key] || ADMIN_SORTERS.date_desc);
  renderArticles(sorted, _allFolders);
}

async function init() {
  const [folders, artData] = await Promise.all([
    fetch('/api/folders', {cache:'no-store', headers:{'Cache-Control':'no-cache'}}).then(r=>r.json()).catch(()=>[]),
    fetch('/api/articles?limit=100', {cache:'no-store', headers:{'Cache-Control':'no-cache'}}).then(r=>r.json()).catch(()=>({articles:[]})),
  ]);
  _allArticles = artData.articles;
  _allFolders = folders;

  document.getElementById('folder-tree').innerHTML = renderFolderTree(folders, null);
  document.getElementById('stat-total').textContent = artData.articles.length;
  document.getElementById('stat-pub').textContent = artData.articles.filter(a=>a.status==='published').length;
  document.getElementById('stat-draft').textContent = artData.articles.filter(a=>a.status==='draft'||a.status==='archived').length;
  document.getElementById('stat-views').textContent = artData.articles.reduce((s,a)=>s+(a.view_count||0),0);
  applyArticleSort();
  document.getElementById('admin-sort-select')?.addEventListener('change', applyArticleSort);

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
    ? '<div class="text-center py-8 px-3"><i class="ph-bold ph-folder-dashed" style="font-size:2rem;display:block;margin-bottom:.4rem;color:var(--ink-light)"></i><p class="text-sm font-semibold" style="color:var(--ink)">Aucun dossier</p><p class="text-xs mt-0.5" style="color:var(--ink-light)">Créez-en un avec « + Nouveau ».</p></div>'
    : '';
  return kids.map(f => \`
    <div style="padding-left:\${depth*14}px">
      <div class="flex items-center justify-between px-3 py-2 rounded-xl group transition-colors" style="--hov:var(--blue-light)" onmouseover="this.style.background='var(--blue-light)'" onmouseout="this.style.background=''">
        <a href="/voyages?folder=\${f.slug}" class="flex items-center gap-2 flex-1 text-sm font-semibold transition-colors" style="color:var(--ink)">
          <span class="flex-shrink-0">\${flagImg(f.icon)}</span><span>\${esc(f.name)}</span>
        </a>
        <div class="flex items-center gap-1 ml-2">
          <button data-action="edit-folder" data-id="\${f.id}" data-name="\${esc(f.name)}" data-icon="\${esc(f.icon)}" class="p-2.5 text-base touch-manipulation rounded-lg min-w-[2.75rem] min-h-[2.75rem] flex items-center justify-center transition-colors" style="color:var(--ink-light)" onmouseover="this.style.color='var(--blue)';this.style.background='rgba(var(--blue-rgb),.08)'" onmouseout="this.style.color='var(--ink-light)';this.style.background=''" title="Renommer ce dossier"><i class="ph-bold ph-pencil-simple"></i></button>
          <button data-action="open-folder-modal" data-id="\${f.id}" class="p-2.5 text-base touch-manipulation rounded-lg min-w-[2.75rem] min-h-[2.75rem] flex items-center justify-center transition-colors" style="color:var(--ink-light)" onmouseover="this.style.color='var(--blue)';this.style.background='rgba(var(--blue-rgb),.08)'" onmouseout="this.style.color='var(--ink-light)';this.style.background=''" title="Ajouter un sous-dossier"><i class="ph-bold ph-folder-plus"></i></button>
          <button data-action="del-folder" data-id="\${f.id}" class="p-2.5 text-base touch-manipulation rounded-lg min-w-[2.75rem] min-h-[2.75rem] flex items-center justify-center transition-colors" style="color:var(--ink-light)" onmouseover="this.style.color='var(--danger)';this.style.background='rgba(220,60,60,.08)'" onmouseout="this.style.color='var(--ink-light)';this.style.background=''" title="Supprimer ce dossier"><i class="ph-bold ph-trash"></i></button>
        </div>
      </div>
      \${renderFolderTree(folders, f.id, depth+1)}
    </div>\`).join('');
}

function renderArticles(arts, folders) {
  if (!arts.length) {
    document.getElementById('articles-list').innerHTML =
      '<div class="sm:col-span-2 section-panel majorelle-frame rounded-2xl text-center py-16 px-6" style="border:1px solid var(--line)">' +
      '<i class="ph-bold ph-notebook" style="font-size:3rem;display:block;margin-bottom:.75rem;color:var(--ink-light)"></i>' +
      '<p class="text-base font-semibold mb-1" style="color:var(--ink)">Aucun article pour l’instant</p>' +
      '<p class="text-sm mb-4" style="color:var(--ink-muted)">Commencez par écrire votre premier récit de voyage.</p>' +
      '<a href="/admin/editor" class="action-btn-sm"><i class="ph-bold ph-plus-circle"></i> Nouvel article</a>' +
      '</div>';
    return;
  }
  const STATUS_META = {
    published:           { label: 'Publié',                            badge: 'badge-published' },
    archived:             { label: 'Archivé',                           badge: 'badge-archived' },
    draft:                { label: 'Brouillon',                         badge: 'badge-draft' },
    publish_when_online:  { label: '<i class="ph-bold ph-wifi-high"></i> Dès connexion', badge: 'badge-pending' },
  };
  document.getElementById('articles-list').innerHTML = arts.map(a => {
    const isPub = a.status === 'published';
    // The quick toggle only ever flips between published <-> archived (see
    // patchArticleStatus server-side) - draft / publish_when_online articles
    // must be changed via the editor's status selector instead, so the
    // button reflects that rather than offering a misleading force-publish.
    const canToggle = a.status === 'published' || a.status === 'archived';
    const toggleLabel = isPub ? '<i class="ph-bold ph-archive"></i> Archiver' : '<i class="ph-bold ph-check-circle"></i> Publier';
    const toggleColor = isPub ? 'var(--pending)' : 'var(--palm)';
    const meta = STATUS_META[a.status] || STATUS_META.archived;
    return \`
    <article class="card-line rounded-2xl overflow-hidden transition-shadow hover:shadow-md">
      <div class="flex gap-4 p-4">
        <img src="\${esc(a.cover_url||'')}" alt="\${esc(a.title)}" class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover flex-shrink-0" style="border:1px solid var(--line)" data-fallback="https://picsum.photos/seed/\${a.id}z/200/200">
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2 mb-1.5">
            <h3 class="font-bold text-sm sm:text-base leading-snug" style="color:var(--ink)">\${esc(a.title)}</h3>
            <span class="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 \${meta.badge}">\${meta.label}</span>
          </div>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs" style="color:var(--ink-light)">
            <span><i class="ph-bold ph-calendar-blank"></i> \${fmtDateRange(a)}</span>
            \${a.destination ? \`<span><i class="ph-bold ph-map-pin"></i> \${esc(a.destination)}</span>\` : ''}
            \${a.folder_name ? \`<span class="inline-flex items-center gap-1">\${flagImg(a.folder_icon||'')} \${esc(a.folder_name)}</span>\` : ''}
            \${a.view_count ? \`<span><i class="ph-bold ph-eye"></i> \${a.view_count} vue\${a.view_count>1?'s':''}</span>\` : ''}
          </div>
        </div>
      </div>
      <div class="flex items-center gap-1.5 px-3 py-2.5 flex-wrap" style="border-top:1px solid var(--line)">
        \${canToggle ? \`<button data-action="toggle-status" data-id="\${a.id}" data-status="\${a.status}" class="ghost-btn" style="padding:.35rem .75rem;font-size:.75rem;color:\${toggleColor}">\${toggleLabel}</button>\` : ''}
        <a href="/admin/editor/\${a.id}" class="ghost-btn" style="padding:.35rem .75rem;font-size:.75rem"><i class="ph-bold ph-pencil-simple"></i> Modifier</a>
        <a href="/voyage/\${a.slug}" class="ghost-btn" style="padding:.35rem .75rem;font-size:.75rem"><i class="ph-bold ph-eye"></i> Voir</a>
        <button data-action="del-article" data-id="\${a.id}" class="ghost-btn ml-auto touch-manipulation" style="padding:.35rem .75rem;font-size:.75rem;color:var(--danger)"><i class="ph-bold ph-trash"></i></button>
      </div>
    </article>\`;
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
  _folderEditId = null;
  document.getElementById('fm-name').value=''; document.getElementById('fm-icon').value='📁';
  const h=document.querySelector('#folder-modal h3');
  if(h) h.innerHTML=(parentId?'<i class="ph-bold ph-folder-plus"></i> Nouveau sous-dossier':'<i class="ph-bold ph-folder-plus"></i> Nouveau dossier');
  const b=document.getElementById('fm-submit-btn');
  if(b) b.innerHTML='Créer <i class="ph-bold ph-check"></i>';
  document.getElementById('folder-modal').classList.remove('hidden');
  setTimeout(()=>document.getElementById('fm-name').focus(),50);
}
function openFolderEdit(id, name, icon) {
  _folderEditId = id;
  _folderParentId = null;
  document.getElementById('fm-name').value = name || '';
  document.getElementById('fm-icon').value = icon || '📁';
  const h=document.querySelector('#folder-modal h3');
  if(h) h.innerHTML='<i class="ph-bold ph-pencil-simple"></i> Renommer le dossier';
  const b=document.getElementById('fm-submit-btn');
  if(b) b.innerHTML='Enregistrer <i class="ph-bold ph-check"></i>';
  document.getElementById('folder-modal').classList.remove('hidden');
  setTimeout(()=>document.getElementById('fm-name').focus(),50);
}
function closeFolderModal() { document.getElementById('folder-modal').classList.add('hidden'); }
async function submitFolder() {
  const name=document.getElementById('fm-name').value.trim();
  const icon=document.getElementById('fm-icon').value.trim()||'📁';
  if(!name){toast('Nom requis','err');return;}
  let res;
  if(_folderEditId != null){
    res = await fetch('/api/folders/'+_folderEditId,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,icon})});
  } else {
    res = await fetch('/api/folders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,icon,parent_id:_folderParentId})});
  }
  if(res.ok){closeFolderModal();toast(_folderEditId!=null?'Dossier renommé !':'Dossier créé !','ok');init();}
  else { const d=await res.json().catch(()=>null); toast((d&&d.error)||'Erreur','err'); }
}
async function delFolder(id) {
  if(!confirm('Supprimer ce dossier ?\\n\\nSes sous-dossiers remonteront d\\'un niveau et ses articles seront détachés (non supprimés).')) return;
  const res = await fetch('/api/folders/'+id,{method:'DELETE'});
  if(res.ok){
    const d = await res.json().catch(()=>({}));
    var parts = [];
    if(d.moved_children) parts.push(d.moved_children+' sous-dossier'+(d.moved_children>1?'s déplacés':' déplacé'));
    if(d.detached_articles) parts.push(d.detached_articles+' article'+(d.detached_articles>1?'s détachés':' détaché'));
    toast('Dossier supprimé'+(parts.length?' ('+parts.join(', ')+')':''),'ok');
    init();
  } else toast('Erreur','err');
}

// ── Site settings ─────────────────────────────────────────────
// The real text shown on the public site when a setting has never been
// customized - not placeholder hints, the actual live copy (see home.js).
// Pre-filling the fields with this (rather than leaving them empty behind a
// greyed-out placeholder) means what the admin sees IS what's published, and
// editing it "starts from" the real text instead of a blank field.
const SETTINGS_DEFAULTS = {
  hero_eyebrow: 'Le carnet des Potet',
  hero_title: 'Entrez, on allait justement <em>raconter le voyage</em>.',
  hero_subtitle: "Depuis 2011, on part quelque part, on revient avec des histoires - et on les note ici pour ne pas les oublier (et pour vous).",
  hero_badge: '"Mais ça c\\'était bien avant le drame..."',
  hero_cta_primary: 'Lire nos aventures',
  hero_cta_secondary: 'Nos coins du monde',
  stat_voyages_label: 'aventures depuis 2011',
  stat_dest_label: 'pays, une seule Dacia',
  stat_maroc_label: 'séjours au Maroc',
  recent_eyebrow: 'Sélection maison',
  recent_title: 'Nos derniers voyages',
  recent_subtitle: 'Les récits les plus récents de nos vacances, avec nos coups de cœur, nos galères et nos meilleures trouvailles.',
  about_eyebrow: "Salut, c'est nous",
  about_text: "Nous, c'est la famille Potet. Tout a commencé sans le vouloir en 2011, avec un voyage à Marrakech - un tajine à 5 euros et un nom de blog plus tard, on ne s'est plus arrêtés. Une Dacia traumatisée et pas mal de galères après, on continue de tout noter ici. Bienvenue à la maison.",
  dest_eyebrow: 'Où on a traîné nos valises',
  dest_title: 'Nos coins du monde',
  dest_subtitle: "Choisissez un pays, on vous ressort les photos, les histoires et ce qu'on referait (ou pas).",
  sub_title: 'On repart bientôt.',
  sub_subtitle: 'Laissez votre email, on vous fait signe au prochain récit. Pas de spam, juste nous.',
  install_title: 'Gardez le carnet sur vous',
  install_text: "Installez l'app sur votre téléphone : elle s'ouvre d'une icône, même sans réseau en voyage.",
  site_tagline: '"Mais ça c\\'était bien avant le drame..."',
  tagline_author: 'Devise de la famille Potet',
  admin_display_name: 'Damien Potet',
  easter_egg_word: 'maroc',
  contact_email: 'tranquilleonestenvacances@free.fr',
};
async function loadSettings() {
  const s = await fetch('/api/settings').then(r=>r.json()).catch(()=>({}));
  const val = (key) => (s[key] != null && s[key] !== '') ? s[key] : (SETTINGS_DEFAULTS[key] || '');
  document.getElementById('s-hero-img').value       = s.hero_image_url    || '';
  document.getElementById('s-hero-eyebrow').value   = val('hero_eyebrow');
  document.getElementById('s-hero-badge').value     = val('hero_badge');
  document.getElementById('s-hero-title').value     = val('hero_title');
  document.getElementById('s-hero-subtitle').value  = val('hero_subtitle');
  document.getElementById('s-hero-cta-primary').value   = val('hero_cta_primary');
  document.getElementById('s-hero-cta-secondary').value = val('hero_cta_secondary');
  // Stats
  document.getElementById('s-stat-voyages').value = val('stat_voyages_label');
  document.getElementById('s-stat-dest').value    = val('stat_dest_label');
  document.getElementById('s-stat-maroc').value   = val('stat_maroc_label');
  // Section "Nos derniers voyages"
  document.getElementById('s-recent-eyebrow').value  = val('recent_eyebrow');
  document.getElementById('s-recent-title').value    = val('recent_title');
  document.getElementById('s-recent-subtitle').value = val('recent_subtitle');
  // Section "Le mot des Potet"
  document.getElementById('s-about-eyebrow').value = val('about_eyebrow');
  document.getElementById('s-about-text').value    = val('about_text');
  // Section "Nos coins du monde"
  document.getElementById('s-dest-eyebrow').value  = val('dest_eyebrow');
  document.getElementById('s-dest-title').value    = val('dest_title');
  document.getElementById('s-dest-subtitle').value = val('dest_subtitle');
  // Abonnement + install
  document.getElementById('s-sub-title').value     = val('sub_title');
  document.getElementById('s-sub-subtitle').value  = val('sub_subtitle');
  document.getElementById('s-install-title').value = val('install_title');
  document.getElementById('s-install-text').value  = val('install_text');
  // Citation
  document.getElementById('s-tagline').value        = val('site_tagline');
  document.getElementById('s-tagline-author').value = val('tagline_author');
  document.getElementById('s-gate-question').value  = s.comment_gate_question || '';
  document.getElementById('s-gate-answer').value    = s.comment_gate_answer   || '';
  document.getElementById('s-admin-display-name').value = val('admin_display_name');
  document.getElementById('s-easter-egg-word').value = val('easter_egg_word');
  document.getElementById('s-contact-email').value = val('contact_email');
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
    stat_voyages_label:  document.getElementById('s-stat-voyages').value.trim(),
    stat_dest_label:     document.getElementById('s-stat-dest').value.trim(),
    stat_maroc_label:    document.getElementById('s-stat-maroc').value.trim(),
    recent_eyebrow:      document.getElementById('s-recent-eyebrow').value.trim(),
    recent_title:        document.getElementById('s-recent-title').value.trim(),
    recent_subtitle:     document.getElementById('s-recent-subtitle').value.trim(),
    about_eyebrow:       document.getElementById('s-about-eyebrow').value.trim(),
    about_text:          document.getElementById('s-about-text').value.trim(),
    dest_eyebrow:        document.getElementById('s-dest-eyebrow').value.trim(),
    dest_title:          document.getElementById('s-dest-title').value.trim(),
    dest_subtitle:       document.getElementById('s-dest-subtitle').value.trim(),
    sub_title:           document.getElementById('s-sub-title').value.trim(),
    sub_subtitle:        document.getElementById('s-sub-subtitle').value.trim(),
    install_title:       document.getElementById('s-install-title').value.trim(),
    install_text:        document.getElementById('s-install-text').value.trim(),
    site_tagline:        document.getElementById('s-tagline').value.trim(),
    tagline_author:      document.getElementById('s-tagline-author').value.trim(),
    comment_gate_question: document.getElementById('s-gate-question').value.trim(),
    comment_gate_answer:   document.getElementById('s-gate-answer').value.trim(),
    admin_display_name:    document.getElementById('s-admin-display-name').value.trim(),
    easter_egg_word:       document.getElementById('s-easter-egg-word').value.trim().toLowerCase(),
    contact_email:         document.getElementById('s-contact-email').value.trim(),
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
  if (cur) cur.textContent = a.email || '-';
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
  const email = cleanEmailInput(input?.value);
  if (!email) { toast('Adresse email requise','err'); return; }
  // Format validation left to the server (index.js: /api/admin/request-email-change) -
  // see saveEmailConfig() above for why the client-side regex check was removed.
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
  if (verified === true)  return '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style="background:rgba(var(--palm-rgb),.12);color:var(--palm)"><i class="ph-bold ph-check-circle"></i> Vérifié</span>';
  if (verified === false) return '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style="background:rgba(var(--danger-rgb),.10);color:var(--danger)"><i class="ph-bold ph-x-circle"></i> Non vérifié</span>';
  return '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style="background:var(--sand);color:var(--ink-muted)"><i class="ph-bold ph-circle-dashed"></i> Inconnu</span>';
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
    box.innerHTML = '<p class="text-sm text-stone-500"><i class="ph-bold ph-info"></i> Configuration incomplète - aucun email ne peut être envoyé tant que les clés API et l\\'adresse expéditrice ne sont pas enregistrées ci-dessous.</p>';
    return;
  }
  box.innerHTML = '<div class="flex items-center gap-2 flex-wrap"><strong class="text-stone-800">'+esc(data.from_address)+'</strong> '+senderStatusBadge(data.sender_verified)+'</div>' +
    (data.sender_verified===false ? '<p class="text-xs text-amber-700 mt-2"><i class="ph-bold ph-warning"></i> Cette adresse n\\'est pas encore vérifiée sur Mailjet. Cliquez sur « Envoyer l\\'email de vérification » puis suivez le lien reçu.</p>' : '');
}
// Strips characters copy-paste commonly smuggles into an email field that
// look blank but aren't ASCII space: NBSP (U+00A0), zero-width space/joiners
// (U+200B-200D, U+FEFF). These pass through .trim() (which only trims
// leading/trailing whitespace) but land *inside* the address and silently
// fail the [^@\s]+ regex, which reads as "the address is invalid" even
// though it looks correct on screen.
var INVISIBLE_CODEPOINTS = [0x00A0, 0x200B, 0x200C, 0x200D, 0xFEFF];
function cleanEmailInput(s) {
  s = s || "";
  var out = "";
  for (var i = 0; i < s.length; i++) {
    if (INVISIBLE_CODEPOINTS.indexOf(s.charCodeAt(i)) === -1) out += s[i];
  }
  return out.trim();
}
async function saveEmailConfig() {
  const apiKey = (document.getElementById('ec-api-key')?.value||'').trim();
  const apiSecret = (document.getElementById('ec-api-secret')?.value||'').trim();
  const fromAddress = cleanEmailInput(document.getElementById('ec-from-address')?.value);
  const fromName = (document.getElementById('ec-from-name')?.value||'').trim();
  // Client-side format check removed: the server (email-admin.js:saveEmailConfig)
  // already validates and returns a clear error via badRequest(), and duplicating
  // the check here only doubled the ways it could silently diverge from the
  // server's rule and block a legitimately valid address before it's even sent.
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
    toast(data.sender_verified ? 'Adresse vérifiée !' : (data.found ? 'Toujours non vérifiée - cliquez le lien reçu par email.' : 'Adresse pas encore soumise - cliquez « Envoyer l\\'email de vérification » d\\'abord.'), data.sender_verified?'ok':'info');
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
      '<i class="ph-fill '+(ok?'ph-check-circle':'ph-x-circle')+'" style="font-size:1.15rem;color:'+(ok?'var(--palm)':'var(--danger)')+';margin-top:.1rem;flex-shrink:0"></i>' +
      '<div class="flex-1 min-w-0"><div class="flex items-center justify-between gap-2"><span class="text-sm font-semibold text-stone-800">'+esc(EMAIL_TYPE_LABEL[e.email_type]||e.email_type)+'</span><span class="text-xs text-stone-400 whitespace-nowrap">'+fmtLogDate(e.created_at)+'</span></div>' +
      '<p class="text-xs text-stone-500 mt-0.5">Vers '+esc(e.recipient)+'</p>' +
      (!ok && e.error ? '<p class="text-xs text-red-500 mt-1">'+esc(e.error)+'</p>' : '') +
      '</div></div>';
  }).join('');
}

// ── Subscriber notification history (new/updated article emails) ──────
async function loadSubscriberEmailLog() {
  const box = document.getElementById('subscriber-email-log-list');
  if (!box) return;
  box.innerHTML = '<div class="text-stone-400 text-sm p-6 animate-pulse text-center">Chargement…</div>';
  const data = await fetch('/api/admin/subscriber-email-log').then(r=>r.json()).catch(()=>null);
  const entries = data?.entries || [];
  if (!entries.length) { box.innerHTML = '<div class="text-stone-400 text-sm p-6 text-center">Aucun envoi aux abonnés pour le moment.</div>'; return; }
  box.innerHTML = entries.map((e, i) => {
    const allOk = e.failed_count === 0;
    const kindLabel = e.is_update ? 'Mise à jour' : 'Nouveau récit';
    const countLabel = e.sent_count + ' envoyé' + (e.sent_count > 1 ? 's' : '') + (e.failed_count ? ', ' + e.failed_count + ' échoué' + (e.failed_count > 1 ? 's' : '') : '');
    const recipientsHtml = e.recipients.map(r =>
      '<div class="flex items-center gap-2 py-1.5">' +
        '<i class="ph-fill '+(r.ok?'ph-check-circle':'ph-x-circle')+'" style="font-size:1rem;color:'+(r.ok?'var(--palm)':'var(--danger)')+';flex-shrink:0"></i>' +
        '<span class="text-xs font-medium text-stone-700">'+esc(r.email)+'</span>' +
        (!r.ok && r.error ? '<span class="text-xs text-red-500 ml-auto truncate max-w-[45%]" title="'+esc(r.error)+'">'+esc(r.error)+'</span>' : '') +
      '</div>'
    ).join('');
    return '<div class="px-6 py-3.5">' +
      '<button type="button" class="w-full flex items-start gap-3 text-left" data-action="toggle-sub-email-row" data-row="sel-'+i+'">' +
        '<i class="ph-fill '+(allOk?'ph-check-circle':'ph-warning-circle')+'" style="font-size:1.15rem;color:'+(allOk?'var(--palm)':'var(--danger)')+';margin-top:.1rem;flex-shrink:0"></i>' +
        '<div class="flex-1 min-w-0">' +
          '<div class="flex items-center justify-between gap-2">' +
            '<span class="text-sm font-semibold text-stone-800">'+esc(kindLabel)+' - '+esc(e.article_title)+'</span>' +
            '<span class="text-xs text-stone-400 whitespace-nowrap">'+fmtLogDate(e.created_at)+'</span>' +
          '</div>' +
          '<p class="text-xs text-stone-500 mt-0.5">'+countLabel+'</p>' +
        '</div>' +
        '<i class="ph-bold ph-caret-down text-stone-400 flex-shrink-0 mt-1" style="font-size:.8rem;transition:transform .15s" id="sel-'+i+'-caret"></i>' +
      '</button>' +
      '<div id="sel-'+i+'" class="hidden mt-2 ml-8 pl-3 border-l-2" style="border-color:var(--line)">'+recipientsHtml+'</div>' +
    '</div>';
  }).join('');
}
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action="toggle-sub-email-row"]');
  if (!btn) return;
  const row = document.getElementById(btn.dataset.row);
  const caret = document.getElementById(btn.dataset.row + '-caret');
  if (!row) return;
  const opening = row.classList.contains('hidden');
  row.classList.toggle('hidden');
  if (caret) caret.style.transform = opening ? 'rotate(180deg)' : '';
});

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

// ── Analytics / visits dashboard (admin) ────────────────────────
let _analyticsPeriod = '30';
async function loadAnalytics() {
  const data = await fetch('/api/admin/analytics?period=' + encodeURIComponent(_analyticsPeriod), {cache:'no-store'}).then(r=>r.json()).catch(()=>null);
  if (!data) {
    document.getElementById('analytics-content').innerHTML = '<p class="text-sm text-center py-10" style="color:var(--ink-light)">Impossible de charger les statistiques.</p>';
    return;
  }

  document.getElementById('an-total').textContent = data.total;
  const trendEl = document.getElementById('an-trend');
  if (data.trend_pct === null) {
    trendEl.textContent = '-';
    trendEl.style.color = 'var(--ink-light)';
  } else {
    const up = data.trend_pct >= 0;
    trendEl.innerHTML = '<i class="ph-bold ph-arrow-' + (up?'up':'down') + '-right"></i> ' + (up?'+':'') + data.trend_pct + '%';
    trendEl.style.color = up ? 'var(--palm)' : 'var(--ink-muted)';
  }
  document.getElementById('an-countries').textContent = data.countries_distinct;

  // Daily/hourly bar chart - bars proportional to the bucket's max. Only the
  // peak bucket gets a permanent number above its bar (keeps the chart
  // readable at any period length); every bar shows its exact label + count
  // via a real JS tooltip that follows the pointer (see an-tooltip below),
  // not the native title attribute (slow to appear, invisible on touch).
  const daily = data.daily || [];
  const isHourly = data.granularity === 'hour';
  const bucketLabel = b => isHourly
    ? new Date(b).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})
    : new Date(b+'T00:00:00').toLocaleDateString('fr-FR', {day:'numeric', month:'short'});
  const unitWord = isHourly ? 'heure' : 'jour';
  const titleEl = document.getElementById('an-daily-title');
  if (titleEl) titleEl.innerHTML = '<i class="ph-bold ph-chart-bar"></i> Visites par ' + unitWord;
  const maxN = Math.max(1, ...daily.map(d=>d.count));
  const chart = document.getElementById('an-daily-chart');
  chart.innerHTML = daily.length
    ? daily.map(d => {
        // A true zero must read as "no visits", not as a small blue bar - at
        // minimum height + brand color it was visually indistinguishable from
        // a bucket that actually had 1-2 visits. Empty buckets get a flat,
        // neutral sliver instead so the eye reads them as "nothing happened"
        // rather than "a little happened".
        const isEmpty = d.count === 0;
        const pct = isEmpty ? 2 : Math.max(4, Math.round(d.count/maxN*100));
        const label = bucketLabel(d.day);
        const isPeak = d.count === maxN && maxN > 0;
        const numberEl = isPeak
          ? '<span style="font-size:.68rem;font-weight:700;color:var(--blue);margin-bottom:.25rem;white-space:nowrap">'+d.count+'</span>'
          : '';
        return '<div class="an-bar-wrap" data-label="'+label+'" data-count="'+d.count+'" style="flex:1;min-width:3px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;cursor:default">'
          +numberEl
          +'<div style="width:100%;height:'+pct+'%;background:'+(isEmpty ? 'var(--line)' : 'var(--blue)')+';border-radius:2px 2px 0 0;min-height:2px;transition:background .1s"></div>'
        +'</div>';
      }).join('')
    : '<p class="text-sm w-full text-center self-center" style="color:var(--ink-light)">Pas encore de données pour cette période.</p>';
  const labelsEl = document.getElementById('an-daily-labels');
  if (daily.length >= 2) {
    labelsEl.innerHTML = '<span>'+bucketLabel(daily[0].day)+'</span><span>'+bucketLabel(daily[daily.length-1].day)+'</span>';
  } else {
    labelsEl.innerHTML = '';
  }
  // Summary line: always visible regardless of period length, so the key
  // numbers never depend on hovering a tiny bar.
  const summaryEl = document.getElementById('an-daily-summary');
  if (summaryEl) {
    if (daily.length) {
      const avg = Math.round(daily.reduce((s,d)=>s+d.count,0) / daily.length * 10) / 10;
      const peak = daily.reduce((best,d)=> d.count > best.count ? d : best, daily[0]);
      summaryEl.textContent = 'Moyenne : ' + avg + ' visite' + (avg>1?'s':'') + '/' + unitWord + ' · Pic : ' + peak.count + ' à ' + bucketLabel(peak.day);
    } else {
      summaryEl.textContent = '';
    }
  }

  // Locations - top 6 cities (grouped by city+country, not country alone) +
  // "Autres" bucket, proportional bars. Shows "Paris, France" rather than
  // just "France" since city is what's actually useful to a curious reader.
  const locations = data.locations || [];
  const totalViews = locations.reduce((s,c)=>s+c.count, 0) || 1;
  const top = locations.slice(0,6);
  const rest = locations.slice(6);
  const restCount = rest.reduce((s,c)=>s+c.count, 0);
  const rows = [...top];
  if (rest.length) rows.push({code:null, city:null, count:restCount, isOther:true, otherN:rest.length});
  document.getElementById('an-countries-list').innerHTML = locations.length
    ? rows.map(c => {
        const pct = Math.round(c.count/totalViews*100);
        let name;
        if (c.isOther) name = 'Autres ('+c.otherN+' lieux)';
        else if (c.city) name = c.city + ', ' + countryName(c.code);
        else name = countryName(c.code);
        const flag = c.isOther ? '<span style="font-size:1.1rem">🌍</span>' : countryFlagImg(c.code);
        return '<div style="display:flex;align-items:center;gap:.75rem">'
          +'<span style="width:1.25rem;flex-shrink:0">'+flag+'</span>'
          +'<span style="width:9rem;flex-shrink:0;font-size:.85rem;font-weight:600;color:var(--ink);cursor:help" class="truncate" title="'+esc(name)+'">'+esc(name)+'</span>'
          +'<span style="flex:1;height:8px;border-radius:999px;background:var(--sand)"><span style="display:block;height:100%;border-radius:999px;background:var(--blue);width:'+pct+'%"></span></span>'
          +'<span style="width:3.5rem;flex-shrink:0;text-align:right;font-size:.78rem;font-weight:700;color:var(--ink-muted)">'+pct+'% <span style="color:var(--ink-light);font-weight:400">('+c.count+')</span></span>'
        +'</div>';
      }).join('')
    : '<p class="text-sm text-center py-6" style="color:var(--ink-light)">Aucune visite sur cette période.</p>';

  // Top articles - reuse the same ascending-bars popularity pattern as the
  // public site (renderPopularityBars in home.js/index.js), scoped to this
  // period's view count rather than the article's lifetime total.
  const topArts = data.top_articles || [];
  const maxV = Math.max(1, ...topArts.map(a=>a.views));
  document.getElementById('an-top-articles').innerHTML = topArts.length
    ? topArts.map((a,i) => {
        const pct = Math.round(a.views/maxV*100);
        return '<a href="/voyage/'+esc(a.slug)+'" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:.75rem;text-decoration:none">'
          +'<span style="width:1.25rem;flex-shrink:0;font-size:.78rem;font-weight:700;color:var(--ink-light)">'+(i+1)+'</span>'
          +'<span style="flex:1;min-width:0;font-size:.85rem;font-weight:600;color:var(--ink)" class="truncate" title="'+esc(a.title)+'">'+esc(a.title)+'</span>'
          +'<span style="width:4rem;flex-shrink:0;height:6px;border-radius:999px;background:var(--sand)"><span style="display:block;height:100%;border-radius:999px;background:var(--apricot);width:'+pct+'%"></span></span>'
          +'<span style="width:2.5rem;flex-shrink:0;text-align:right;font-size:.78rem;font-weight:700;color:var(--ink-muted)">'+a.views+'</span>'
        +'</a>';
      }).join('')
    : '<p class="text-sm text-center py-6" style="color:var(--ink-light)">Aucune vue d\\'article sur cette période.</p>';
}
document.querySelectorAll('.period-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.period-pill').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    _analyticsPeriod = btn.dataset.period;
    loadAnalytics();
  });
});
// Real-time tooltip for the daily/hourly chart: follows the pointer while
// hovering a bar, shown/positioned via mousemove so it tracks in real time
// rather than appearing at a fixed spot. Delegated on the chart container
// (stable across loadAnalytics() re-renders) so it works for every bar
// without re-attaching listeners each time the chart's innerHTML changes.
(function(){
  const chartEl = document.getElementById('an-daily-chart');
  const tip = document.getElementById('an-tooltip');
  if (!chartEl || !tip) return;
  chartEl.addEventListener('mousemove', e => {
    const bar = e.target.closest('.an-bar-wrap');
    if (!bar) { tip.classList.add('hidden'); return; }
    tip.textContent = bar.dataset.label + ' : ' + bar.dataset.count + ' visite' + (bar.dataset.count>1?'s':'');
    tip.style.left = e.clientX + 'px';
    tip.style.top = (e.clientY - 10) + 'px';
    tip.classList.remove('hidden');
  });
  chartEl.addEventListener('mouseleave', () => tip.classList.add('hidden'));
})();

// ── Moderation / comments (admin) ─────────────────────────────
// Renders a comment the same visual language as the public thread (avatar
// initial, admin-reply badge) so moderation reads as "the same comments",
// not a disconnected raw log - plus the actions an admin actually needs:
// jump to it in context, reply as the site's voice, or remove it.
function renderModComment(c) {
  const initial = esc((c.author_name || '?').trim().charAt(0).toUpperCase());
  const replyBadge = c.is_admin_reply
    ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[.65rem] font-bold uppercase tracking-wide" style="background:var(--blue-light);color:var(--blue)"><i class="ph-fill ph-star"></i> Réponse admin</span>'
    : '';
  const commentUrl = '/voyage/' + esc(c.article_slug || c.article_id) + '#comment-' + c.id;
  const preview = esc(c.body || '');
  return '<article class="card-line rounded-2xl p-4" data-comment-row="' + c.id + '">'
    + '<div class="flex items-start justify-between gap-3 mb-1.5 flex-wrap">'
      + '<div class="flex items-center gap-2 flex-wrap">'
        + '<span class="inline-flex items-center justify-center rounded-full flex-shrink-0" style="width:1.75rem;height:1.75rem;background:var(--blue-light);color:var(--blue);font-weight:700;font-size:.72rem">' + initial + '</span>'
        + '<span class="font-bold text-sm" style="color:var(--ink)">' + esc(c.author_name) + '</span>'
        + replyBadge
      + '</div>'
      + '<span class="text-xs" style="color:var(--ink-light)">' + esc(fmtDate(c.created_at)) + '</span>'
    + '</div>'
    + '<p class="text-sm leading-relaxed mb-1" style="color:var(--ink);white-space:pre-wrap;word-break:break-word">' + preview + '</p>'
    + '<p class="text-xs mb-3" style="color:var(--ink-light)">sur <a href="' + commentUrl + '" target="_blank" rel="noopener" class="hover:underline" style="color:var(--blue)">' + esc(c.article_title) + '</a></p>'
    + '<div class="flex items-center gap-2 flex-wrap">'
      + '<a href="' + commentUrl + '" target="_blank" rel="noopener" class="ghost-btn" style="padding:.35rem .75rem;font-size:.75rem"><i class="ph-bold ph-arrow-square-out"></i> Voir en contexte</a>'
      + (c.is_admin_reply ? '' : '<button data-id="' + c.id + '" data-name="' + esc(c.author_name) + '" class="ghost-btn" style="padding:.35rem .75rem;font-size:.75rem" data-action="admin-reply"><i class="ph-bold ph-arrow-bend-up-left"></i> Répondre</button>')
      + '<button data-id="' + c.id + '" class="ghost-btn" style="padding:.35rem .75rem;font-size:.75rem;color:var(--danger)" data-action="admin-delete-comment"><i class="ph-bold ph-trash"></i> Supprimer</button>'
    + '</div>'
  + '</article>';
}
async function loadRecentComments() {
  const box = document.getElementById('recent-comments-list');
  if (!box) return;
  box.innerHTML = '<div class="text-stone-400 p-6 text-center">Chargement…</div>';
  const data = await fetch('/api/admin/comments/recent').then(r=>r.json()).catch(()=>null);
  const comments = data?.comments || [];

  document.getElementById('mod-stat-total').textContent = comments.length;
  const weekAgo = Date.now() - 7 * 86400000;
  document.getElementById('mod-stat-week').textContent = comments.filter(c => new Date((c.created_at||'').replace(' ','T')+'Z').getTime() > weekAgo).length;
  document.getElementById('mod-stat-replies').textContent = comments.filter(c => c.is_admin_reply).length;

  if (!comments.length) {
    box.innerHTML = '<div class="text-center py-12" style="color:var(--ink-light)">'
      + '<i class="ph-bold ph-chats-circle" style="font-size:3rem;display:block;margin-bottom:.75rem;color:var(--ink-light)"></i>'
      + '<p class="text-sm font-semibold mb-1" style="color:var(--ink)">Aucun commentaire pour l\\'instant</p>'
      + '<p class="text-sm">Les réactions des lecteurs apparaîtront ici.</p>'
    + '</div>';
    return;
  }
  box.innerHTML = comments.map(renderModComment).join('');
}

// ── Reply modal (replaces prompt()) ────────────────────────────
let _replyTargetId = null;
function openReplyModal(id, authorName) {
  _replyTargetId = id;
  document.getElementById('reply-context').innerHTML = 'En réponse à <strong>' + esc(authorName) + '</strong>';
  document.getElementById('reply-body').value = '';
  document.getElementById('reply-modal').classList.remove('hidden');
  setTimeout(() => document.getElementById('reply-body').focus(), 50);
}
function closeReplyModal() { document.getElementById('reply-modal').classList.add('hidden'); _replyTargetId = null; }
async function submitReply() {
  const body = document.getElementById('reply-body').value.trim();
  if (!body) { toast('Écrivez une réponse', 'err'); return; }
  const id = _replyTargetId;
  const res = await fetch('/api/admin/comments/'+id+'/reply', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ body }) });
  if (res.ok) { closeReplyModal(); toast('Réponse publiée', 'ok'); loadRecentComments(); }
  else { const d = await res.json().catch(()=>null); toast((d&&d.error)||'Erreur', 'err'); }
}

document.addEventListener('click', async (e) => {
  const replyBtn = e.target.closest('[data-action="admin-reply"]');
  if (replyBtn) { openReplyModal(parseInt(replyBtn.dataset.id), replyBtn.dataset.name || ''); return; }
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
  analytics: () => { loadAnalytics(); },
  emails: () => { loadEmailConfigStatus(); loadSubscriberEmailLog(); loadEmailLog(); },
  subscribers: () => { loadSubscribers(); },
  moderation: () => { loadRecentComments(); },
};
const _loadedTabs = new Set(['articles']);
const TAB_NAMES = ['articles','analytics','settings','account','emails','subscribers','moderation'];
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
    case 'edit-folder': openFolderEdit(id, btn.dataset.name, btn.dataset.icon); break;
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
// The dashboard is the page landed on right after logging back in, so nudge
// the SW to retry anything still queued from before the session expired.
navigator.serviceWorker?.controller?.postMessage('sync-now');
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
#e-content .img-pair{outline:2px dashed rgba(var(--blue-rgb),.35);outline-offset:3px;border-radius:.75rem}
#e-content .img-pair figure{max-width:49%;min-width:0}
#e-content figure{position:relative}
#e-content .img-delete,#e-content .img-split,#e-content .img-expand{position:absolute;top:6px;width:26px;height:26px;border-radius:50%;background:rgba(0,0,0,.65);color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1rem;line-height:1;font-weight:700;opacity:0;transition:opacity .15s;z-index:10;padding:0}
#e-content .img-delete{right:6px}
#e-content .img-split{right:38px;font-size:.7rem}
#e-content .img-expand{left:6px;font-size:.7rem}
#e-content figure:hover .img-delete,#e-content figure:hover .img-split,#e-content figure:hover .img-expand{opacity:1}
/* Touch devices have no :hover state, so opacity:0-until-hover would leave
   these buttons effectively untappable - an admin on a phone could never
   discover or reliably hit a 26px invisible button. Make them always visible
   and bump them to the ~44px minimum touch target size instead. */
@media (pointer: coarse) {
  #e-content .img-delete,#e-content .img-split,#e-content .img-expand{opacity:1;width:40px;height:40px;font-size:1.1rem}
  #e-content .img-split{right:46px;font-size:.85rem}
  #e-content .img-expand{font-size:.85rem}
}
#e-content .img-pair-add{flex:1;min-width:0;max-width:49%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.4rem;border:2px dashed rgba(var(--blue-rgb),.5);border-radius:.75rem;cursor:pointer;color:rgba(var(--blue-rgb),.8);font-size:.8rem;font-weight:600;padding:1.5rem .5rem;transition:all .15s;background:rgba(var(--blue-rgb),.04)}
#e-content .img-pair-add:hover{border-color:var(--blue);background:rgba(var(--blue-rgb),.12);color:var(--blue-dark)}
#e-content .img-pair-add i{font-size:1.6rem}
/* A collapsed text-cursor next to an inline image has no visible caret at
   all on most mobile browsers (nothing to blink next to a photo) - the
   selectionchange listener elsewhere on this page tags the figure the
   cursor actually landed next to with this class, so tapping a photo gives
   a clear "the cursor is here, before/after this image" signal instead of
   an invisible one. The 3px offset outline (not a border) doesn't shift
   layout or crop into the image itself. */
#e-content figure.img-caret-adjacent,
#e-content .img-pair.img-caret-adjacent { outline:3px solid var(--blue); outline-offset:3px; border-radius:.75rem; }
/* The default browser caret color is easy to lose against a photo or a
   dashed image-pair outline - pick the brand blue explicitly instead of
   inheriting an implicit black/text-color one. */
#e-content{caret-color:var(--blue);}
/* Mobile "Options" drawer: on lg+ this rule never applies (the media query
   itself is scoped to below the lg breakpoint), so the sidebar keeps its
   normal in-flow desktop layout untouched. On mobile, toggling
   .mobile-opts-open on <body> turns the SAME #editor-sidebar element (no
   duplicated markup / ids) into a real modal sheet - a dimmed/blurred
   backdrop behind it (#mobile-opts-backdrop, matching the notif/email
   modals' rgba(0,0,0,.55)+blur elsewhere on this site) plus a solid,
   shadowed panel that's visibly inset from the screen edges - so it reads
   as a window that opened on top, not a flat background swap that lets the
   article text show through underneath it. */
@media (max-width: 1023px) {
  /* Everything in #editor-sidebar (Statut, Informations, photo de
     couverture, Supprimer...) is now reachable from the "⋮ Options" drawer
     below no matter where you've scrolled to - showing it a second time
     inline above the article text was pure duplication (and confusing:
     "Fermer"/Statut sitting there with nothing to close). Hidden by default
     on mobile; the drawer rule below re-shows this exact element (no
     duplicated markup) as the fixed overlay when opened. */
  #editor-sidebar { display: none; }
  body.mobile-opts-open { overflow: hidden; }
  #mobile-opts-backdrop {
    display: none; position: fixed; inset: 0; z-index: 69;
    /* Opaque solid (rgb(), not backdrop-filter:blur()+rgba()): a forced-dark
       mode some mobile browsers apply (Samsung Internet's "Dark mode
       websites", separate from this app's own light/dark theme) repaints
       page colors as a post-process and can turn a blurred translucent
       overlay into a near-transparent mess, letting the article text
       underneath show through the "closed window". Still theme-aware (uses
       --ink-rgb, which is dark in light mode and light in dark mode - i.e.
       the opposite of the page background, same intent as the previous
       dark tint) but with no transparency for a repaint pass to mangle. */
    background: rgb(var(--ink-rgb));
  }
  body.mobile-opts-open #mobile-opts-backdrop { display: block; }
  body.mobile-opts-open #editor-sidebar {
    display: block; position: fixed; z-index: 70; margin: 0;
    top: 5vh; left: 3vw; right: 3vw; bottom: 5vh;
    /* Same reasoning: rgb(var(--cream-rgb)) is still theme-aware but always
       fully opaque, unlike a bare var(--cream) reference some engines can
       resolve inconsistently mid-repaint. */
    background: rgb(var(--cream-rgb));
    overflow-y: auto;
    border-radius: 1.5rem; box-shadow: 0 20px 60px rgba(0,0,0,.35);
    padding: 1rem 1rem calc(1.5rem + env(safe-area-inset-bottom));
  }

  /* Exactly one of the two mobile bottom bars, switched by a single class on
     <body> - see the focusin/focusout handler near the bottom of the page's
     script. Default (not editing): Sauvegarder bar shown, formatting bar
     hidden. While #e-content has focus: the reverse. Plain display swaps,
     no transition - nothing to land mid-animation or get clipped. */
  #mobile-save-bar { display: flex; }
  #mobile-format-bar { display: none; }
  body.editor-editing #mobile-save-bar { display: none; }
  body.editor-editing #mobile-format-bar { display: flex; }
}
</style></head>
<body class="font-sans antialiased pt-14 pb-20 lg:pb-0" style="background:var(--cream);color:var(--ink)">
${ADMIN_NAV()}

<div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
  <div class="flex flex-col lg:grid lg:grid-cols-3 lg:items-start gap-5 lg:gap-8">

    <!-- Editor main: second on mobile (after sidebar), cols 1-2 on desktop -->
    <div class="order-2 lg:col-start-1 lg:col-span-2 lg:row-start-1 space-y-5">

      <!-- Title -->
      <div>
        <label class="block text-xs font-bold mb-2 uppercase tracking-wide" style="color:var(--ink-muted)">Titre *</label>
        <input type="text" id="e-title" placeholder="Ex: Notre été à Santorin"
               class="w-full rounded-2xl px-4 py-3 focus:outline-none transition-colors font-bold text-lg" style="border:2px solid var(--line);color:var(--ink)">
      </div>

      <!-- Short description -->
      <div>
        <label class="block text-xs font-bold mb-2 uppercase tracking-wide" style="color:var(--ink-muted)">Description courte</label>
        <textarea id="e-desc" rows="2" placeholder="Un résumé accrocheur de 1-2 phrases..."
                  class="w-full rounded-2xl px-4 py-3 focus:outline-none transition-colors resize-none text-sm" style="border:2px solid var(--line);color:var(--ink)"></textarea>
      </div>

      <!-- Rich text editor -->
      <div>
        <div class="mb-2">
          <label class="text-xs font-bold uppercase tracking-wide" style="color:var(--ink-muted)">Contenu</label>
        </div>
        <!-- overflow-hidden removed (was only there to clip the toolbar's
             own corners to match the container's rounded-2xl) - it also
             breaks position:sticky on any descendant (an ancestor with
             non-visible overflow becomes sticky's containing block, and the
             editor box's own scroll never actually moves, so the toolbar
             would silently stop sticking and just scroll away with the
             text - the same failure mode found earlier with html/body's
             overflow-x:hidden breaking the sidebar's sticky). The toolbar
             now carries its own top corner radius (rounded-t-2xl) instead,
             so it still looks seamless without needing the parent to clip. -->
        <div class="rounded-2xl focus-within:border-sky-400 transition-colors" style="border:2px solid var(--line)">
          <!-- Desktop only: mobile uses #mobile-format-bar (fixed bottom bar,
               swapped with #mobile-save-bar - see the CSS/JS near the bottom
               of this page) instead of this one scrolling with the article. -->
          <div id="editor-toolbar" class="hidden lg:flex flex-wrap items-center gap-0.5 p-1.5 rounded-t-2xl sticky" style="background:var(--cream);border-bottom:1px solid var(--line);top:4rem;z-index:20">
            <button type="button" class="toolbar-btn" onclick="fmt('bold')" title="Gras"><i class="ph-bold ph-text-b"></i></button>
            <button type="button" class="toolbar-btn" onclick="fmt('italic')" title="Italique"><i class="ph-bold ph-text-italic"></i></button>
            <button type="button" class="toolbar-btn" onclick="fmt('underline')" title="Souligné"><i class="ph-bold ph-text-underline"></i></button>
            <span class="toolbar-sep"></span>
            <button type="button" class="toolbar-btn" onclick="fmtBlock('H2')" title="Titre"><i class="ph-bold ph-text-h-two"></i></button>
            <button type="button" class="toolbar-btn" onclick="fmtBlock('H3')" title="Sous-titre"><i class="ph-bold ph-text-h-three"></i></button>
            <button type="button" class="toolbar-btn" onclick="fmtBlock('P')" title="Texte normal"><i class="ph-bold ph-paragraph"></i></button>
            <span class="toolbar-sep"></span>
            <button type="button" class="toolbar-btn" onclick="fmt('insertUnorderedList')" title="Liste à puces"><i class="ph-bold ph-list-bullets"></i></button>
            <button type="button" class="toolbar-btn" onclick="fmtBlock('BLOCKQUOTE')" title="Citation"><i class="ph-bold ph-quotes"></i></button>
            <span class="toolbar-sep"></span>
            <button type="button" class="toolbar-btn" style="color:var(--blue)" onclick="openInsertImg()" title="Insérer une image"><i class="ph-bold ph-image"></i></button>
          </div>
          <div style="position:relative">
            <div id="e-content" contenteditable="true" spellcheck="true"
                 class="prose-vacation min-h-[360px] max-w-none p-5 rounded-b-2xl focus:outline-none"
                 data-placeholder="Commencez à écrire votre récit..."
                 style="color:var(--ink)"></div>
            <!-- Shown only while an existing article's images are still
                 preloading, BEFORE any of the article's HTML/images ever
                 touch #e-content - a fixed-size box with nothing else on
                 the page moving, instead of revealing the editor content
                 progressively while it grows/reflows/scrolls underneath
                 the user (the previous approach: images loaded straight
                 into the visible editor while a percentage was merely
                 decorative on top of it, so the page still jumped around
                 during loading and the editor sat blank/broken-looking
                 until everything settled). -->
            <div id="e-loading-overlay" class="hidden" style="position:absolute;inset:0;z-index:30;min-height:360px;border-radius:0 0 1rem 1rem;background:var(--cream);flex-direction:column;align-items:center;justify-content:center;gap:.75rem">
              <div style="width:min(220px,70%);height:8px;border-radius:999px;background:var(--line);overflow:hidden">
                <div id="e-loading-bar" style="height:100%;width:0%;border-radius:999px;background:var(--blue);transition:width .2s ease"></div>
              </div>
              <div id="e-loading-pct" class="text-sm font-bold" style="color:var(--ink)">Chargement des images… 0%</div>
              <!-- Hidden until a few seconds have passed with no sign of
                   finishing (see _loadContentWithProgress) - a slow/flaky
                   connection in voyage shouldn't force waiting out the full
                   safety timeout just to start typing. Skips straight to
                   the text with placeholder boxes standing in for the
                   images that haven't loaded yet, instead of the real
                   photos. -->
              <button type="button" id="e-loading-skip" onclick="_skipImagePreload()" class="hidden text-xs font-bold underline" style="color:var(--ink-muted)">Continuer sans attendre les images</button>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Sidebar: first on mobile, col-3 on desktop.
         Desktop: sticky + its own scroll. Sauvegarder/Annuler/Exporter and
         the rest (Statut, Informations, photo de couverture, Supprimer...)
         all stay reachable together while scrolling a long article, instead
         of scrolling away with the sidebar's natural position (previously)
         or a save-bar sticky div popping out of the sidebar's own bottom
         once the sidebar's content was shorter than the article (the
         in-between attempt). If the sidebar itself is taller than the
         available viewport height, it scrolls internally rather than
         getting clipped - so "Supprimer l'article" at the very bottom is
         still reachable via a small scroll inside the sidebar, not lost.
         Mobile: same markup (one set of #e-start-date/#e-folder/etc ids,
         no duplication), but normally lives inline above the article text
         (order-1) - reachable only by scrolling back to the top. #mobile-opts-drawer
         toggles it into a full-screen overlay instead, opened from the
         "Options" button in the sticky bottom bar, so Statut/Infos/photo de
         couverture/Supprimer are reachable from anywhere in a long article
         without losing your place in the text. -->
    <div id="mobile-opts-backdrop" onclick="closeMobileOptsDrawer()"></div>
    <aside id="editor-sidebar" class="order-1 lg:col-start-3 lg:row-start-1 space-y-4 lg:sticky lg:overflow-y-auto" style="top:4rem;max-height:calc(100vh - 5rem)">

      <!-- Close bar - only rendered visible by the mobile-opts-open CSS
           above (position:fixed inside the drawer); a plain block in normal
           desktop/inline-mobile layout so it costs nothing there. -->
      <button type="button" onclick="closeMobileOptsDrawer()" class="lg:hidden w-full flex items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-semibold" style="border:1px solid var(--line);color:var(--ink-muted);background:var(--cream)"><i class="ph-bold ph-x"></i> Fermer</button>

      <!-- Save button (desktop only - mobile uses sticky bottom bar below).
           The whole <aside> is sticky now, so this is just its first child -
           it stays at the top of the (already-pinned) sidebar automatically. -->
      <div class="hidden lg:block space-y-2">
        <button onclick="saveArticle()" class="w-full action-btn text-white font-bold py-3 rounded-2xl transition-all"><i class="ph-bold ph-floppy-disk"></i> Sauvegarder</button>
        <a href="/admin/dashboard" class="w-full flex items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-semibold transition-colors" style="border:1px solid var(--line);color:var(--ink-muted);text-decoration:none;background:var(--cream)"><i class="ph-bold ph-x"></i> Annuler</a>
        ${isEdit ? `<a id="export-btn" href="/admin/articles/${articleId}/print" target="_blank" class="w-full flex items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-semibold transition-colors" style="border:1px solid var(--line);color:var(--ink-muted);text-decoration:none;background:var(--cream)"><i class="ph-bold ph-export"></i> Exporter (PDF / Word)</a>` : ''}
      </div>

      <!-- Status -->
      <div class="section-panel majorelle-frame rounded-2xl p-5" style="border:1px solid var(--line);box-shadow:var(--card-shadow)">
        <h3 class="font-bold mb-3 text-sm" style="color:var(--ink)"><i class="ph-bold ph-toggle-right"></i> Statut</h3>
        <div class="flex flex-col gap-2">
          <button type="button" id="btn-archived" data-status="archived" onclick="setStatus('archived')"
            class="status-option flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left w-full">
            <i class="ph-bold ph-archive status-option-icon text-xl flex-shrink-0"></i>
            <div class="flex-1">
              <div class="font-semibold text-sm status-btn-title">Archivé</div>
              <div class="text-xs" style="color:var(--ink-light)">Non visible par les lecteurs</div>
            </div>
            <i class="ph-fill ph-check-circle status-check flex-shrink-0" style="font-size:1.1rem"></i>
          </button>
          <button type="button" id="btn-published" data-status="published" onclick="setStatus('published')"
            class="status-option flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left w-full">
            <i class="ph-bold ph-check-circle status-option-icon text-xl flex-shrink-0"></i>
            <div class="flex-1">
              <div class="font-semibold text-sm status-btn-title">Publié</div>
              <div class="text-xs" style="color:var(--ink-light)">Visible par tous</div>
            </div>
            <i class="ph-fill ph-check-circle status-check flex-shrink-0" style="font-size:1.1rem"></i>
          </button>
          <button type="button" id="btn-publish_when_online" data-status="publish_when_online" onclick="setStatus('publish_when_online')"
            class="status-option flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left w-full">
            <i class="ph-bold ph-wifi-high status-option-icon text-xl flex-shrink-0"></i>
            <div class="flex-1">
              <div class="font-semibold text-sm status-btn-title">Publier dès connexion</div>
              <div class="text-xs" style="color:var(--ink-light)">Publié auto quand internet rétabli</div>
            </div>
            <i class="ph-fill ph-check-circle status-check flex-shrink-0" style="font-size:1.1rem"></i>
          </button>
        </div>
        <input type="hidden" id="pub-status" value="archived">
        <div id="sync-info" class="mt-3 pt-3 space-y-1 text-xs" style="border-top:1px solid var(--line);color:var(--ink-muted)">
          <div class="flex items-center gap-1.5"><span id="sync-dot" style="width:7px;height:7px;border-radius:50%;background:var(--palm);flex-shrink:0;display:inline-block"></span><span id="sync-online-lbl">En ligne</span></div>
          <div id="sync-saved-row" class="hidden flex items-center gap-1.5"><i class="ph-bold ph-floppy-disk"></i> <span id="sync-saved-lbl"></span></div>
          <div id="sync-pub-row" class="hidden flex items-center gap-1.5"><i class="ph-bold ph-check-circle" style="color:var(--palm)"></i> <span id="sync-pub-lbl"></span></div>
        </div>
      </div>

      <!-- Notify subscribers (shown only when status = published) -->
      <div id="notify-section" class="hidden section-panel rounded-2xl p-4" style="background:rgba(var(--palm-rgb),.06);border:1px solid rgba(var(--palm-rgb),.22);box-shadow:var(--card-shadow)">
        <label class="flex items-start gap-3 cursor-pointer select-none">
          <input type="checkbox" id="e-notify" checked class="w-5 h-5 mt-0.5 flex-shrink-0" style="accent-color:var(--palm)">
          <div>
            <div class="font-bold text-sm" style="color:var(--palm)"><i class="ph-bold ph-bell-ringing"></i> Prévenir les abonnés</div>
            <div class="text-xs mt-0.5" style="color:var(--ink-muted)">Envoie une notification push et un email à tous les abonnés.</div>
          </div>
        </label>
      </div>

      <!-- Meta -->
       <div class="section-panel majorelle-frame rounded-2xl p-5" style="border:1px solid var(--line);box-shadow:var(--card-shadow)">
        <h3 class="font-bold mb-4 text-sm" style="color:var(--ink)"><i class="ph-bold ph-info"></i> Informations</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold mb-1.5" style="color:var(--ink-muted)"><i class="ph-bold ph-calendar-blank"></i> Début du voyage *</label>
            <input type="date" id="e-start-date" class="w-full rounded-xl px-3 py-2 focus:outline-none transition-colors text-sm" style="border:2px solid var(--line);color:var(--ink)">
          </div>
          <div>
            <label class="block text-xs font-bold mb-1.5" style="color:var(--ink-muted)"><i class="ph-bold ph-calendar-check"></i> Fin du voyage *</label>
            <input type="date" id="e-end-date" class="w-full rounded-xl px-3 py-2 focus:outline-none transition-colors text-sm" style="border:2px solid var(--line);color:var(--ink)">
          </div>
          <div>
            <label class="block text-xs font-bold mb-1.5" style="color:var(--ink-muted)"><i class="ph-bold ph-map-pin"></i> Destination</label>
            <input type="text" id="e-dest" placeholder="Ex: Paris, France" class="w-full rounded-xl px-3 py-2 focus:outline-none transition-colors text-sm" style="border:2px solid var(--line);color:var(--ink)">
          </div>
          <div>
            <label class="block text-xs font-bold mb-1.5" style="color:var(--ink-muted)"><i class="ph-bold ph-folder"></i> Dossier</label>
            <select id="e-folder" class="w-full rounded-xl px-3 py-2 focus:outline-none transition-colors text-sm" style="border:2px solid var(--line);color:var(--ink)">
              <option value="">Aucun dossier</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Cover photo -->
       <div class="section-panel majorelle-frame rounded-2xl p-5" style="border:1px solid var(--line);box-shadow:var(--card-shadow)">
        <h3 class="font-bold mb-3 text-sm" style="color:var(--ink)"><i class="ph-bold ph-image"></i> Photo de couverture</h3>
        <input type="hidden" id="e-cover" value="">
        <div id="cover-wrap" class="hidden relative mb-2 group cursor-pointer" onclick="document.getElementById('cover-file-in').click()">
          <img id="cover-img" src="" alt="" class="w-full h-32 object-cover rounded-xl">
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all rounded-xl flex items-center justify-center pointer-events-none">
            <span class="text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-3 py-1.5 rounded-full"><i class="ph-bold ph-camera"></i> Changer</span>
          </div>
        </div>
        <div id="cover-dz" class="border-2 border-dashed rounded-xl p-5 text-center hover:border-sky-400 hover:bg-sky-50 transition-all cursor-pointer" style="border-color:var(--line)"
             onclick="document.getElementById('cover-file-in').click()"
             ondragover="event.preventDefault();this.classList.add('border-sky-400','bg-sky-50')"
             ondragleave="this.classList.remove('border-sky-400','bg-sky-50')"
             ondrop="handleCoverDrop(event)">
          <i class="ph-bold ph-image-square" style="font-size:2rem;display:block;margin-bottom:.35rem;color:var(--blue)"></i>
          <p class="font-semibold text-xs" style="color:var(--ink-muted)">Choisir une photo</p>
          <p class="text-xs mt-0.5" style="color:var(--ink-light)">JPG, PNG, WebP</p>
        </div>
        <input type="file" id="cover-file-in" accept="image/*" class="hidden" onchange="handleCoverFile(this.files[0]);this.value=''">
      </div>

      <!-- Photo upload -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-xs font-bold uppercase tracking-wide" style="color:var(--ink-muted)">Images dans le récit</label>
          <p class="text-xs font-semibold" style="color:var(--blue)"><i class="ph-bold ph-image"></i> Les photos s'insèrent automatiquement dans le texte</p>
        </div>
        <div id="dropzone"
             class="border-2 border-dashed rounded-2xl p-8 text-center hover:border-sky-400 hover:bg-sky-50 transition-all cursor-pointer" style="border-color:var(--line)"
             onclick="document.getElementById('file-in').click()"
             ondragover="event.preventDefault();this.classList.add('border-sky-400','bg-sky-50')"
             ondragleave="this.classList.remove('border-sky-400','bg-sky-50')"
             ondrop="handleDrop(event)">
          <i class="ph-bold ph-camera" style="font-size:2.5rem;display:block;margin-bottom:.5rem;color:var(--blue)"></i>
          <p class="font-semibold text-sm" style="color:var(--ink-muted)">Appuyez pour choisir des photos</p>
          <p class="text-xs mt-1" style="color:var(--ink-light)">JPG, PNG, WebP · Max 10 MB</p>
          <input type="file" id="file-in" accept="image/*" multiple class="hidden" onchange="handleFiles(this.files)">
        </div>
        <div id="photo-grid" class="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4"></div>
      </div>

      ${isEdit ? `
      <div class="rounded-2xl p-5" style="background:rgba(var(--danger-rgb),.06);border:1px solid rgba(var(--danger-rgb),.16)">
        <button onclick="delArticle()" class="w-full text-white font-bold py-2.5 rounded-xl transition-colors text-sm" style="background:var(--danger)"><i class="ph-bold ph-trash"></i> Supprimer l'article</button>
        <p class="text-xs mt-2 text-center" style="color:var(--ink-muted)">Cette action est définitive.</p>
      </div>` : ''}
    </aside>
  </div>
</div>

<!-- Mobile bottom bar: exactly ONE of these two is ever visible, toggled by
     the single "editor-editing" class on <body> (set on focusin/focusout of
     #e-content - see the script near the bottom of this page). No height
     math, no animation, no visualViewport tracking: both bars simply sit at
     fixed bottom:0 and let the OS/browser's native "push fixed content above
     the keyboard" behaviour handle the rest, same as any ordinary fixed
     bottom bar over a focused input - that's what was actually unreliable
     before (computing the keyboard's height by hand raced the keyboard's own
     open/close animation and got it wrong, or ran stale, on some devices/
     keyboards). display:none/flex is instant, so there's nothing to visibly
     glitch or land mid-transition either. -->
<div id="mobile-save-bar" class="fixed bottom-0 inset-x-0 z-40 lg:hidden backdrop-blur-sm px-4 py-3 items-center gap-3 shadow-xl" style="padding-bottom:max(12px,env(safe-area-inset-bottom));background:rgba(255,255,255,.95);border-top:1px solid var(--line)">
  <span id="sticky-status-lbl" class="flex-1 text-sm font-semibold truncate" style="color:var(--ink-muted)">Archivé</span>
  <button onclick="openMobileOptsDrawer()" title="Statut, informations, photos, supprimer..." class="flex-shrink-0 flex items-center justify-center touch-manipulation" style="width:2.6rem;height:2.6rem;border-radius:999px;border:1px solid var(--line);color:var(--ink-muted);background:var(--cream)">
    <i class="ph-bold ph-dots-three-vertical" style="font-size:1.2rem"></i>
  </button>
  <button onclick="saveArticle()" class="action-btn py-2.5 px-5 text-sm font-bold flex-shrink-0 whitespace-nowrap touch-manipulation">
    <i class="ph-bold ph-floppy-disk"></i> Sauvegarder
  </button>
</div>

<!-- Formatting bar, mobile only - same buttons/onclick handlers as the
     desktop toolbar inside the editor box (fmt()/fmtBlock()/openInsertImg()
     are the same global functions either way), just laid out as its own
     fixed bottom bar instead of scrolling with the article text. -->
<div id="mobile-format-bar" class="fixed bottom-0 inset-x-0 z-40 lg:hidden px-2 items-center gap-0.5 shadow-xl overflow-x-auto" style="padding-top:.35rem;padding-bottom:max(.35rem,env(safe-area-inset-bottom));background:var(--cream);border-top:1px solid var(--line)">
  <button type="button" class="toolbar-btn" onclick="fmt('bold')" title="Gras"><i class="ph-bold ph-text-b"></i></button>
  <button type="button" class="toolbar-btn" onclick="fmt('italic')" title="Italique"><i class="ph-bold ph-text-italic"></i></button>
  <button type="button" class="toolbar-btn" onclick="fmt('underline')" title="Souligné"><i class="ph-bold ph-text-underline"></i></button>
  <span class="toolbar-sep"></span>
  <button type="button" class="toolbar-btn" onclick="fmtBlock('H2')" title="Titre"><i class="ph-bold ph-text-h-two"></i></button>
  <button type="button" class="toolbar-btn" onclick="fmtBlock('H3')" title="Sous-titre"><i class="ph-bold ph-text-h-three"></i></button>
  <button type="button" class="toolbar-btn" onclick="fmtBlock('P')" title="Texte normal"><i class="ph-bold ph-paragraph"></i></button>
  <span class="toolbar-sep"></span>
  <button type="button" class="toolbar-btn" onclick="fmt('insertUnorderedList')" title="Liste à puces"><i class="ph-bold ph-list-bullets"></i></button>
  <button type="button" class="toolbar-btn" onclick="fmtBlock('BLOCKQUOTE')" title="Citation"><i class="ph-bold ph-quotes"></i></button>
  <span class="toolbar-sep"></span>
  <button type="button" class="toolbar-btn" style="color:var(--blue)" onclick="openInsertImg()" title="Insérer une image"><i class="ph-bold ph-image"></i></button>
</div>

<!-- Insert image modal -->
<div id="insert-img-modal" class="hidden fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onclick="if(event.target===this)closeInsertImg()">
  <div class="section-panel majorelle-frame rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[85vh] flex flex-col">
    <div class="flex items-center justify-between p-5" style="border-bottom:1px solid var(--line)">
      <h3 class="font-display text-lg font-bold" style="color:var(--ink)"><i class="ph-bold ph-image"></i> Insérer une image</h3>
      <button onclick="closeInsertImg()" class="p-1.5 rounded-lg transition-colors hover:opacity-70" style="color:var(--ink-light)"><i class="ph-bold ph-x text-lg"></i></button>
    </div>
    <div class="px-5 pt-4 pb-2">
      <div class="flex gap-2">
        <button type="button" id="iim-btn-full" onclick="setImgSize('full')" class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-sky-400 bg-sky-50 text-sky-700 text-sm font-bold transition-all"><i class="ph-bold ph-arrows-horizontal"></i> Pleine largeur</button>
        <button type="button" id="iim-btn-half" onclick="setImgSize('half')" class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-stone-200 bg-white text-stone-600 text-sm font-bold transition-all"><i class="ph-bold ph-square-half"></i> Demi-largeur</button>
      </div>
      <input type="hidden" id="iim-size" value="full">
      <div class="mt-3">
        <label class="block text-xs font-bold uppercase tracking-wide mb-1.5" style="color:var(--ink-muted)" for="iim-caption"><i class="ph-bold ph-text-aa"></i> Légende / texte alternatif <span class="font-normal normal-case" style="color:var(--ink-light)">(optionnel)</span></label>
        <input type="text" id="iim-caption" placeholder="Ex: Vue sur la baie au coucher du soleil" class="w-full rounded-xl px-3 py-2 focus:outline-none transition-colors text-sm" style="border:2px solid var(--line);color:var(--ink)">
        <p class="text-xs mt-1" style="color:var(--ink-light)">Affichée sous l'image et utilisée comme texte alternatif.</p>
      </div>
    </div>
    <div class="flex-1 overflow-y-auto px-5 pb-5">
      <p class="text-xs font-bold uppercase tracking-wide mb-3 mt-2" style="color:var(--ink-muted)">Photos disponibles</p>
      <div id="iim-gallery" class="grid grid-cols-3 gap-2"></div>
      <p id="iim-empty" class="hidden text-sm text-center py-6" style="color:var(--ink-light)">Aucune photo dans la galerie.</p>
      <div class="mt-4 pt-4" style="border-top:1px solid var(--line)">
        <p class="text-xs font-bold uppercase tracking-wide mb-2" style="color:var(--ink-muted)">Importer une nouvelle photo</p>
        <div class="border-2 border-dashed rounded-xl p-4 text-center hover:border-sky-400 hover:bg-sky-50 transition-all cursor-pointer" style="border-color:var(--line)"
             onclick="document.getElementById('iim-file-in').click()"
             ondragover="event.preventDefault();this.classList.add('border-sky-400','bg-sky-50')"
             ondragleave="this.classList.remove('border-sky-400','bg-sky-50')"
             ondrop="_iimDrop(event)">
          <i class="ph-bold ph-upload-simple text-xl mb-1 block" style="color:var(--blue)"></i>
          <span class="font-semibold text-sm" style="color:var(--ink-muted)">Choisir ou déposer une photo</span>
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
let _pendingPhotoCount = 0;
// Refreshes the "N photos en attente" count from IndexedDB - called on load
// and after every sync attempt, since the SW (which actually replays the
// queue) has no way to call back into this page's in-memory state directly.
async function _refreshPendingPhotoCount() {
  try {
    if (!('indexedDB' in window)) return;
    const db = await _openOfflineDB();
    const all = await new Promise((resolve, reject) => {
      const tx = db.transaction('pending-photos', 'readonly');
      const req = tx.objectStore('pending-photos').getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    _pendingPhotoCount = ARTICLE_ID ? all.filter(p => String(p.articleId) === String(ARTICLE_ID)).length : all.length;
  } catch { _pendingPhotoCount = 0; }
  updateSyncInfo();
}

// ── Compression photo côté client ──────────────────────────────
// The admin publishes from the road on patchy mobile networks - an 8-12MB
// phone-camera JPEG can time out or fail outright on 3G/hotel wifi. Every
// photo is downscaled (max 1920px on the long edge, plenty for the blog's
// display sizes) and re-encoded as JPEG before it ever touches the network
// or IndexedDB, whether uploaded immediately or queued offline. This cuts
// typical file size by 5-10x with no visible quality loss on screen.
const PHOTO_MAX_DIM = 1920;
const PHOTO_QUALITY = 0.82;
function compressImage(file) {
  // Skip compression we can't safely redo: GIFs would lose animation, and
  // anything already tiny isn't worth the CPU/battery cost on a phone.
  if (!file.type || !file.type.startsWith('image/') || file.type === 'image/gif' || file.size < 300 * 1024) {
    return Promise.resolve(file);
  }
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(url);
    img.onload = () => {
      let { width, height } = img;
      if (width > PHOTO_MAX_DIM || height > PHOTO_MAX_DIM) {
        const scale = PHOTO_MAX_DIM / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        cleanup();
        if (!blob || blob.size >= file.size) { resolve(file); return; } // compression didn't help, keep original
        resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg', lastModified: file.lastModified || Date.now() }));
      }, 'image/jpeg', PHOTO_QUALITY);
    };
    img.onerror = () => { cleanup(); resolve(file); }; // unreadable image - let the server's own validation reject it
    img.src = url;
  });
}
async function compressFiles(fileList) {
  return Promise.all(Array.from(fileList).map(compressImage));
}
let newCoverFile = null;
let _lastSaved = null;
let _lastPublished = null;

function toast(msg,type='ok',persist=false){const i=document.getElementById('toast-icon'),m=document.getElementById('toast-msg'),el=document.getElementById('toast');i.innerHTML=type==='ok'?'<i class="ph-fill ph-check-circle" style="color:var(--palm);font-size:1.25rem"></i>':type==='err'?'<i class="ph-fill ph-x-circle" style="color:var(--danger);font-size:1.25rem"></i>':'<i class="ph-fill ph-info" style="color:var(--blue);font-size:1.25rem"></i>';m.textContent=msg;el.classList.remove('hidden');clearTimeout(el._t);el.onclick=persist?(()=>el.classList.add('hidden')):null;el.style.cursor=persist?'pointer':'';if(!persist)el._t=setTimeout(()=>el.classList.add('hidden'),3000)}
function esc(s){return (s==null? '': String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
// Images sautées via "Continuer sans attendre les images" (voir
// _skipImagePreload) portent un placeholder en src et l'URL réelle dans
// data-original-src - la restaurer avant toute sauvegarde/brouillon est
// impératif : sinon stripDataUris() blanchirait le src placeholder
// (c'est une data: URI) et l'article perdrait la photo pour de bon.
function restorePlaceholderSrcs(html){return(html||'').replace(/<img([^>]*) data-original-src=["']([^"']+)["']([^>]*) src=["'][^"']*["']/gi,'<img$1$3 src="$2"').replace(/<img([^>]*) src=["'][^"']*["']([^>]*) data-original-src=["']([^"']+)["']/gi,'<img$1$2 src="$3"');}
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
    content:           navigator.onLine ? stripDataUris(restorePlaceholderSrcs(document.getElementById('e-content')?.innerHTML || '')) : (document.getElementById('e-content')?.innerHTML || ''),
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

// ── Offline sync queue (IndexedDB) ──────────────────────────────
// localStorage isn't reachable from the Service Worker, so a save made while
// offline is *also* written here - the SW reads this store and replays each
// entry (POST/PUT) via Background Sync once the network is back, even if
// nobody has the app open at that moment. See public/sw.js for the replay side.
// navigator.serviceWorker.ready never resolves if the SW hasn't taken control
// of this page yet (e.g. the very first load right after registration, or a
// test/incognito context) - it has no built-in timeout, so an unguarded
// await here would leave the offline queue call hanging forever. A failed
// Background Sync registration is fine either way: the 'online' event
// listener in sw.js is the fallback path that covers exactly this case.
function _swReadyWithTimeout(ms) {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, reject) => setTimeout(() => reject(new Error('sw not ready')), ms)),
  ]);
}
function _openOfflineDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) { reject(new Error('no indexedDB')); return; }
    // v2 adds 'pending-photos' (stores the compressed File/Blob directly -
    // IndexedDB supports binary values natively, no base64 round-trip needed).
    // onupgradeneeded fires for both a brand-new DB and an existing v1 one,
    // so the 'if not exists' guards make it safe either way.
    const req = indexedDB.open('tranquille-offline', 2);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains('pending-articles')) {
        req.result.createObjectStore('pending-articles', { keyPath: 'localId' });
      }
      if (!req.result.objectStoreNames.contains('pending-photos')) {
        req.result.createObjectStore('pending-photos', { keyPath: 'localId' });
      }
    };
    // The upgrade can hang forever if another tab/the Service Worker still
    // holds an older-version connection open (IndexedDB has no forced-close
    // API) - never let a queued photo save wedge the editor UI on this.
    req.onblocked = () => reject(new Error('IndexedDB upgrade blocked by another open tab'));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function queueOfflinePhoto(articleId, file, opts) {
  const db = await _openOfflineDB();
  const localId = 'photo-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  await new Promise((resolve, reject) => {
    const tx = db.transaction('pending-photos', 'readwrite');
    tx.objectStore('pending-photos').put({
      localId, articleId, file, isCover: !!(opts && opts.isCover),
      fileName: file.name, queuedAt: Date.now(),
    });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const reg = await _swReadyWithTimeout(3000);
      await reg.sync.register('tranquille-sync-photos');
    } catch { /* Background Sync unsupported/denied/not-ready-yet - the 'online' fallback in sw.js still covers it */ }
  }
  return localId;
}
async function queueOfflineArticleSave(method, url, payload) {
  const db = await _openOfflineDB();
  const localId = 'draft-' + (ARTICLE_ID || 'new') + '-' + Date.now();
  await new Promise((resolve, reject) => {
    const tx = db.transaction('pending-articles', 'readwrite');
    tx.objectStore('pending-articles').put({ localId, method, url, payload, queuedAt: Date.now() });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const reg = await _swReadyWithTimeout(3000);
      await reg.sync.register('tranquille-sync-articles');
    } catch { /* Background Sync unsupported/denied/not-ready-yet - the 'online' event fallback in sw.js still covers it */ }
  }
}
// The SW tells every open page when a queued save actually goes through, so
// the sticky status label doesn't keep saying "waiting" once it has synced.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'article-synced' && event.data.ok) {
      const lbl = document.getElementById('sticky-status-lbl');
      if (lbl) lbl.textContent = '✓ Synchronisé';
      toast('Article envoyé automatiquement 🌴', 'ok');
    }
    // A queued photo just uploaded in the background - possibly while this
    // tab was closed or the article page wasn't even open. Only touch the
    // gallery/editor if we're looking at the same article it belongs to.
    if (event.data && event.data.type === 'photo-synced' && event.data.ok) {
      const d = event.data.data || {};
      if (String(event.data.articleId) === String(ARTICLE_ID)) {
        if (event.data.isCover && d.url) {
          document.getElementById('e-cover').value = d.url;
          previewCover(d.url);
        } else if (d.url) {
          existingPhotos.push(d);
          renderPhotoGrid();
        }
      }
      _refreshPendingPhotoCount();
      toast('Photo envoyée automatiquement 🌴', 'ok');
    }
    // Session expired while a save/photo was queued offline - the item is
    // kept in the queue (not lost), but nothing will sync until the admin
    // logs back in. A persistent toast (not the usual 3s one) since missing
    // this would mean silently losing work.
    if (event.data && event.data.type === 'auth-expired') {
      toast('Session expirée - reconnectez-vous pour envoyer ce qui est en attente (rien n\\'est perdu)', 'err', true);
    }
  });
}
// Fallback ping for browsers without Background Sync (notably iOS Safari):
// ask the SW to retry as soon as this page itself observes the network
// coming back, in case it's the only chance the sync gets before the app
// closes again.
window.addEventListener('online', () => {
  navigator.serviceWorker?.controller?.postMessage('sync-now');
});

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
  bar.style.cssText = 'position:fixed;top:4rem;left:0;right:0;z-index:39;display:flex;align-items:center;gap:.75rem;background:var(--blue-light);border-bottom:1px solid rgba(var(--blue-rgb),.3);padding:.6rem 1rem;font-size:.85rem;font-weight:500;color:var(--blue-dark);box-shadow:0 1px 4px rgba(0,0,0,.06)';
  bar.innerHTML = \`<i class="ph-bold ph-cloud-slash" style="font-size:1.1rem;flex-shrink:0"></i>
    <span style="flex:1">Brouillon local du \${d} non synchronisé</span>
    <button onclick="_applyDraft()" style="background:var(--blue);color:#fff;border:none;padding:.3rem .8rem;border-radius:.5rem;font-weight:700;font-size:.78rem;cursor:pointer">Restaurer</button>
    <button onclick="_dismissDraft()" style="color:var(--blue);border:none;background:none;padding:.3rem .5rem;font-size:.78rem;cursor:pointer;font-weight:600">Ignorer</button>\`;
  document.body.appendChild(bar);
  // Being position:fixed, this bar floats OVER the page instead of taking
  // up space in it - since it spans the full width, it was covering the
  // top of the sticky sidebar (Sauvegarder button included) whenever that
  // sidebar's sticky position put it near the top of the viewport
  // (reported: "ça passe par-dessus le bouton sauvegarder"). Push the
  // whole page's content down by the bar's real height instead, same
  // pattern already used for the PWA "update available" banner in
  // shell.js - nothing underneath ever ends up hidden behind it.
  const h = bar.offsetHeight;
  const container = document.querySelector('body > div.max-w-7xl');
  if (container) container.style.marginTop = h + 'px';
}
function _applyDraft() {
  if (_pendingDraft) { fillFromDraft(_pendingDraft); _pendingDraft = null; }
  document.getElementById('draft-bar')?.remove();
  const container = document.querySelector('body > div.max-w-7xl');
  if (container) container.style.marginTop = '';
  toast('Brouillon restauré ✓', 'ok');
}
function _dismissDraft() {
  clearDraftLocal();
  _pendingDraft = null;
  document.getElementById('draft-bar')?.remove();
  const container = document.querySelector('body > div.max-w-7xl');
  if (container) container.style.marginTop = '';
}

// ── Auto-create draft if article has no ID yet ────────────────
async function ensureArticleId() {
  if (ARTICLE_ID) return true;
  const title = document.getElementById('e-title')?.value.trim();
  if (!title) { toast("Ajoutez d'abord un titre à l'article", 'err'); return false; }
  // A brand-new, never-saved article has no id yet, and photo queueing needs
  // a real articleId to attach to - so unlike editing an existing article
  // (which the offline photo queue handles fine), a first save must succeed
  // online. Fail with a clear, specific message rather than the generic one
  // below, which reads like a server error when it's really "no signal yet".
  if (!navigator.onLine) {
    toast('Pas de connexion : enregistrez une première fois une fois en ligne pour pouvoir ajouter des photos', 'err');
    return false;
  }
  const res = await fetch('/api/articles', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      title, status: 'archived',
      start_date: document.getElementById('e-start-date')?.value || new Date().toISOString().slice(0,10),
      end_date: document.getElementById('e-end-date')?.value || new Date().toISOString().slice(0,10),
      content: stripDataUris(restorePlaceholderSrcs(document.getElementById('e-content')?.innerHTML || '')),
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
  const hasPending = !!document.getElementById('e-content')?.querySelector('img[src^="data:"]') || _pendingPhotoCount > 0;
  if (dot) dot.style.background = online ? (hasPending ? 'var(--apricot)' : 'var(--palm)') : 'var(--danger)';
  const photoWord = _pendingPhotoCount === 1 ? 'photo en attente' : 'photos en attente';
  const pendingLabel = _pendingPhotoCount > 0 ? (_pendingPhotoCount + ' ' + photoWord) : 'images en attente';
  if (lbl) lbl.textContent = online ? (hasPending ? ('En ligne \u00b7 ' + pendingLabel) : 'En ligne') : 'Hors ligne';
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
  if (error === 'timeout') return 'Upload trop lent, connexion instable - réessayez';
  if (error === 'network') return 'Connexion perdue pendant l’upload - réessayez';
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
  const folders = await fetch('/api/folders', {cache:'no-store', headers:{'Cache-Control':'no-cache'}}).then(r=>r.json()).catch(()=>[]);
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
    const a = await fetch('/api/articles/' + ARTICLE_ID, {cache:'no-store', headers:{'Cache-Control':'no-cache'}}).then(r=>r.json()).catch(()=>null);
    if (a && a.title) {
      document.getElementById('e-title').value = a.title || '';
      document.getElementById('e-desc').value  = a.short_description || '';
      const rawContent = a.content || '';
      const html = rawContent.trim().startsWith('<') ? rawContent : (rawContent ? (typeof marked !== 'undefined' ? marked.parse(rawContent) : '<p>' + rawContent.replace(/\\n\\n/g,'</p><p>').replace(/\\n/g,'<br>') + '</p>') : '');
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
      // Un article avec beaucoup d'images stockées pouvait bloquer la page
      // 1-2 min avant de pouvoir écrire, et pendant ce temps l'éditeur
      // affichait le contenu en train de grossir/reflow au fur et à mesure
      // (page qui saute dans tous les sens). On précharge donc toutes les
      // images du HTML EN DEHORS du DOM (juste des objets Image() en
      // mémoire, jamais insérés) derrière un overlay fixe avec un %, et on
      // n'injecte le HTML dans #e-content qu'une fois tout prêt (ou après
      // un délai de sécurité) - l'éditeur reste soit complètement vide/masqué,
      // soit complètement rempli, jamais entre les deux.
      _loadContentWithProgress(html);
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

// Place le curseur à la toute fin du contenu de l'éditeur et scrolle
// jusqu'à lui, SANS animation - utilisé à l'ouverture d'un article existant
// pour permettre d'ajouter tout de suite les notes du jour sans avoir à
// chercher la fin. { behavior: 'instant' } évite l'effet "ascenseur" d'un
// scroll fluide sur un article de plusieurs dizaines de milliers de pixels
// de haut ; appelé pendant que l'overlay de chargement couvre encore
// l'écran (voir _loadContentWithProgress), l'utilisateur ne voit donc même
// pas ce saut - juste l'endroit final, direct.
function _focusEditorAtEnd() {
  const ed = document.getElementById('e-content');
  if (!ed) return;
  ed.focus();
  const range = document.createRange();
  range.selectNodeContents(ed);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  saveSelection();
  const doScroll = () => {
    const target = ed.lastElementChild || ed;
    target.scrollIntoView({ block: 'end', behavior: 'instant' });
    // Sur mobile, une barre fixe (#mobile-save-bar par défaut, ou
    // #mobile-format-bar une fois le clavier ouvert) est collée en bas de
    // l'écran par-dessus le contenu - scrollIntoView ne le sait pas et
    // aligne le bas de l'élément avec le bas RÉEL du viewport, donc les
    // 2-3 dernières lignes du texte finissent cachées derrière cette barre
    // (signalé : "le curseur est bien en bas mais ça ne scrolle pas
    // vraiment tout en bas"). On corrige d'un scroll supplémentaire égal à
    // la hauteur de la barre actuellement visible.
    const visibleBar = [document.getElementById('mobile-save-bar'), document.getElementById('mobile-format-bar')]
      .find(bar => bar && getComputedStyle(bar).display !== 'none');
    if (visibleBar) {
      const barHeight = visibleBar.getBoundingClientRect().height;
      const rect = target.getBoundingClientRect();
      const overlap = barHeight - (window.innerHeight - rect.bottom);
      if (overlap > 0) window.scrollBy({ top: overlap, behavior: 'instant' });
    }
  };
  // Sur un très gros article (des centaines d'images), le navigateur n'a
  // pas forcément fini de mettre en page tout le contenu qu'on vient
  // d'injecter au moment où ce scroll s'exécute (même juste après
  // l'assignation à innerHTML, en synchrone) - la hauteur réelle du
  // dernier élément n'est donc pas encore stable, et scrollIntoView('end')
  // atterrit trop court (signalé : "10 lignes du bas en scroll" alors que
  // le curseur DOM, lui, est bien en toute fin). Deux
  // requestAnimationFrame d'affilée garantissent qu'un cycle de mise en
  // page complet a eu lieu avant de mesurer/scroller.
  requestAnimationFrame(() => requestAnimationFrame(doScroll));
}

// data: URI SVG placeholder shown in place of an image the user chose not
// to wait for (see _skipImagePreload) - a plain grey box with a picture
// icon, so the layout still reads as "there's a photo here" without
// costing a single byte of network.
const _PLACEHOLDER_IMG_SRC = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
  '<rect width="400" height="300" fill="#e7e5e4"/>' +
  '<path d="M150 190 L180 150 L210 180 L240 140 L270 190 Z" fill="#a8a29e"/>' +
  '<circle cx="160" cy="120" r="16" fill="#a8a29e"/>' +
  '</svg>'
);

let _skipCurrentPreload = null;

// Appelé par le bouton "Continuer sans attendre les images" de l'overlay.
// Remplace chaque src d'image PAS ENCORE chargée par un placeholder (en
// gardant l'URL réelle dans data-original-src, pour ne jamais la perdre :
// _restorePlaceholderImgs la restaure avant sauvegarde/export) et révèle
// l'éditeur immédiatement, sans attendre le reste.
function _skipImagePreload() {
  if (_skipCurrentPreload) _skipCurrentPreload();
}

// Précharge toutes les images d'un article AVANT de toucher à l'éditeur
// visible, derrière un overlay fixe avec un %. Rien ne bouge tant que ce
// n'est pas prêt : ni #e-content (reste vide), ni la fenêtre (aucun scroll
// avant la toute fin) - contrairement à l'ancienne approche qui injectait
// le HTML directement dans l'éditeur visible et laissait la page grandir/
// sauter pendant que les images arrivaient une à une.
function _loadContentWithProgress(html) {
  const ed = document.getElementById('e-content');
  const overlay = document.getElementById('e-loading-overlay');
  const bar = document.getElementById('e-loading-bar');
  const pctLabel = document.getElementById('e-loading-pct');
  const skipBtn = document.getElementById('e-loading-skip');
  if (!ed) return;

  const reveal = (finalHtml) => {
    // Les images sont déjà chargées (préchauffées dans le cache HTTP du
    // navigateur ci-dessous), donc loading="lazy" ici ne retarde rien de
    // visible - il évite juste au navigateur de décoder/mettre en page les
    // 200+ <img> hors écran d'un coup au moment de l'injection.
    ed.innerHTML = finalHtml.replace(/<img /gi, '<img loading="lazy" decoding="async" ');
    // Les articles importés/anciens stockent leurs images en <img> nu (un
    // par <p>), sans le wrapper <figure> (bouton croix pour supprimer,
    // bouton pour passer en demi-largeur) que produit désormais toute
    // insertion d'image - d'où ces images sans aucun contrôle visible
    // signalé par l'utilisateur. On les met à niveau une fois pour toutes
    // à l'ouverture, silencieusement (le HTML sauvegardé ensuite aura la
    // même structure <figure> que les images insérées depuis toujours).
    _wrapBareImages(ed);
    // Placer le curseur + scroller AVANT de retirer l'overlay : l'écran est
    // encore couvert par le fond plein de l'overlay à ce moment-là, donc
    // l'utilisateur ne voit jamais le saut vers la fin de l'article - juste
    // l'overlay qui disparaît directement sur la position finale.
    _focusEditorAtEnd();
    if (overlay) {
      // .style.display was set to 'flex' below to show the overlay - an
      // inline style always beats a class for the same property, so the
      // hidden class's display:none could never win back without also
      // clearing the inline value here (found by inspecting a real
      // reveal: classList said "hidden" but computed display stayed
      // "flex", leaving the overlay's opaque background covering the
      // freshly-populated editor).
      overlay.classList.add('hidden');
      overlay.style.display = '';
    }
    if (skipBtn) skipBtn.classList.add('hidden');
    _skipCurrentPreload = null;
  };

  const urls = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map(m => m[1]);
  if (!urls.length || !overlay) { reveal(html); return; }

  overlay.classList.remove('hidden');
  overlay.style.display = 'flex';
  let done = 0;
  const total = urls.length;
  const loadedUrls = new Set();
  let finished = false;
  const updatePct = () => {
    const pct = Math.max(0, Math.min(100, Math.round((done / total) * 100)));
    if (bar) bar.style.width = pct + '%';
    if (pctLabel) pctLabel.textContent = 'Chargement des images… ' + pct + '%';
  };
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(safety);
    clearTimeout(skipDelay);
    reveal(html);
  };
  // Remplace par un placeholder chaque <img> dont l'URL n'a pas fini de
  // charger au moment du clic sur "Continuer sans attendre" - l'original
  // reste récupérable via data-original-src (voir _restorePlaceholderImgs).
  const skipNow = () => {
    if (finished) return;
    finished = true;
    clearTimeout(safety);
    clearTimeout(skipDelay);
    const withPlaceholders = html.replace(/<img([^>]*) src=["']([^"']+)["']/gi, (match, attrs, src) => {
      if (loadedUrls.has(src)) return match;
      return '<img' + attrs + ' data-original-src="' + src + '" src="' + _PLACEHOLDER_IMG_SRC + '"';
    });
    reveal(withPlaceholders);
  };
  _skipCurrentPreload = skipNow;
  updatePct();
  urls.forEach(src => {
    const probe = new Image();
    const onOneDone = () => { done++; loadedUrls.add(src); updatePct(); if (done >= total) finish(); };
    probe.addEventListener('load', onOneDone, { once: true });
    probe.addEventListener('error', onOneDone, { once: true });
    probe.src = src;
  });
  // Filet de sécurité : une connexion très lente en voyage, ou une image
  // dont l'URL a disparu (jamais de load/error), ne doit jamais empêcher
  // indéfiniment d'accéder à l'éditeur - on révèle le contenu tel quel
  // après quelques secondes, les images restantes finiront de charger
  // normalement (avec loading="lazy" posé juste en dessous) une fois
  // affichées.
  const safety = setTimeout(finish, 8000);
  // Le bouton "Continuer sans attendre" n'apparaît qu'après un délai -
  // inutile sur un chargement normal de quelques centaines de ms à 1-2s,
  // il ne doit se montrer que si ça traîne vraiment (connexion de voyage
  // capricieuse).
  const skipDelay = setTimeout(() => { if (!finished && skipBtn) skipBtn.classList.remove('hidden'); }, 3000);
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

// ── Undo/redo history ──────────────────────────────────────────
// Ctrl+Z never worked in this editor: the browser's own contenteditable
// undo stack only tracks changes it made itself via execCommand, and most
// of what actually mutates #e-content here (paste handling, image
// insert/delete, drag&drop, the format buttons) manipulates the DOM
// directly instead - none of that ever registers as an undoable step, so
// native Ctrl+Z had nothing to undo. This replaces it with our own
// snapshot-based history: every meaningful change pushes a copy of the
// HTML + a serializable caret position, and Ctrl+Z/Ctrl+Shift+Z (or
// Ctrl+Y) step through that stack ourselves instead of relying on the
// browser's.
const _UNDO_MAX = 100;
let _undoStack = [];
let _redoStack = [];
let _undoRestoring = false; // guards against our own restore re-triggering a snapshot
let _undoDebounce = null;
// The state to go BACK to if undo is pressed right now - captured before
// a change happens, not after. A stack entry only means "what things
// looked like right before this edit started"; the current live DOM is
// never itself stored in the stack. Typing keeps reusing the same
// baseline for the whole debounced burst (so 20 keystrokes = 1 undo
// step); the first structural mutation (paste, image insert/delete...)
// captures a fresh baseline of its own.
let _undoBaseline = null;

// A live Range can't survive a full innerHTML swap, so the caret is
// captured as (container element's position among its siblings at each
// level, text offset) instead - reconstructible after the DOM is rebuilt
// as long as the structure at that point is unchanged, which it always is
// immediately after a snapshot of that same structure.
function _caretPath() {
  const ed = document.getElementById('e-content');
  const sel = window.getSelection();
  if (!ed || !sel || !sel.rangeCount || !ed.contains(sel.anchorNode)) return null;
  const path = [];
  let node = sel.anchorNode;
  while (node && node !== ed) {
    const parent = node.parentNode;
    if (!parent) return null;
    path.unshift(Array.prototype.indexOf.call(parent.childNodes, node));
    node = parent;
  }
  return { path, offset: sel.anchorOffset };
}
function _restoreCaretPath(caret) {
  const ed = document.getElementById('e-content');
  if (!ed || !caret) { ed?.focus(); return; }
  let node = ed;
  for (const i of caret.path) {
    if (!node.childNodes[i]) { ed.focus(); return; }
    node = node.childNodes[i];
  }
  try {
    const range = document.createRange();
    const maxOffset = node.nodeType === Node.TEXT_NODE ? node.length : node.childNodes.length;
    range.setStart(node, Math.min(caret.offset, maxOffset));
    range.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  } catch (err) { /* structure shifted unexpectedly - just leave focus on the editor */ }
  ed.focus();
}
function _captureState() {
  const ed = document.getElementById('e-content');
  return ed ? { html: ed.innerHTML, caret: _caretPath() } : null;
}
// Finalizes the current baseline (the state from right before whatever
// change is now ending) into a real undo step, then clears it - the next
// change, whenever it happens, will capture its own fresh baseline first.
function _commitUndoBaseline() {
  clearTimeout(_undoDebounce);
  if (!_undoBaseline) return;
  const ed = document.getElementById('e-content');
  if (ed && ed.innerHTML !== _undoBaseline.html) {
    _undoStack.push(_undoBaseline);
    if (_undoStack.length > _UNDO_MAX) _undoStack.shift();
    _redoStack = []; // a real change invalidates whatever redo history existed
  }
  _undoBaseline = null;
}
// Call BEFORE a mutation happens (the first keystroke of a typing burst)
// to remember what to undo back to. Safe to call repeatedly mid-burst -
// only the first call in a row actually captures anything, exactly like a
// debounce's leading edge.
function _pushUndoSnapshot() {
  if (_undoRestoring || _undoBaseline) return;
  _undoBaseline = _captureState();
}
// Call BEFORE a discrete, non-typing mutation (paste, image insert/
// delete, split...) - unlike _pushUndoSnapshot, this always closes out
// whatever came before as its OWN undo step first (e.g. a typing burst
// still pending its debounce when the user clicks "insert image"), so
// that action doesn't silently get merged into the next one. It also
// commits ITSELF on the next tick, right after the caller's own
// synchronous DOM mutation has run - these actions are one-shot, not a
// burst like typing, so nothing else should ever get folded into the
// same step (found by testing type -> insert image -> type again: the
// image insert's baseline was left open, so the second typing burst
// silently merged into the image-insert's undo step instead of getting
// its own).
function _pushUndoSnapshotForAction() {
  _commitUndoBaseline();
  _undoBaseline = _captureState();
  setTimeout(_commitUndoBaseline, 0);
}
// Typing fires this on every keystroke: captures the pre-burst baseline
// on the first keystroke (via _pushUndoSnapshot's own guard), then
// commits it into a real undo step once the user pauses - one undo step
// per burst of typing instead of one per character, matching how every
// other text editor's undo granularity works.
function _scheduleUndoSnapshot() {
  _pushUndoSnapshot();
  clearTimeout(_undoDebounce);
  _undoDebounce = setTimeout(_commitUndoBaseline, 400);
}
function _doUndo() {
  _commitUndoBaseline();
  const ed = document.getElementById('e-content');
  if (!ed || !_undoStack.length) return;
  // The current state becomes the redo target.
  _redoStack.push(_captureState());
  const prev = _undoStack.pop();
  _undoRestoring = true;
  ed.innerHTML = prev.html;
  _restoreCaretPath(prev.caret);
  _undoRestoring = false;
}
function _doRedo() {
  _commitUndoBaseline();
  const ed = document.getElementById('e-content');
  if (!ed || !_redoStack.length) return;
  _undoStack.push(_captureState());
  const next = _redoStack.pop();
  _undoRestoring = true;
  ed.innerHTML = next.html;
  _restoreCaretPath(next.caret);
  _undoRestoring = false;
}
(function() {
  const editor = document.getElementById('e-content');
  if (!editor) return;
  editor.addEventListener('input', _scheduleUndoSnapshot);
  editor.addEventListener('keydown', e => {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod || e.key.toLowerCase() !== 'z') return;
    e.preventDefault();
    if (e.shiftKey) _doRedo(); else _doUndo();
  });
  editor.addEventListener('keydown', e => {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod || e.key.toLowerCase() !== 'y') return;
    e.preventDefault();
    _doRedo();
  });
  // Losing focus (clicking Sauvegarder, switching fields...) ends the
  // current typing burst - commit it now instead of leaving it to the
  // 400ms debounce, so a quick click-away-then-Ctrl+Z-elsewhere doesn't
  // find a half-finished pending step.
  editor.addEventListener('blur', _commitUndoBaseline);
})();

// Tapping an image in a contenteditable places the text cursor immediately
// before or after it (standard browser behaviour) rather than "selecting"
// the image the way a native image picker would - on mobile in particular
// there's no visible caret next to an image at all, so nothing shows where
// that cursor actually landed. Mirrors that invisible caret position onto
// the adjacent figure/img with a visible outline instead, updated on every
// selectionchange, so tapping a photo gives an unambiguous "the cursor is
// right here, before/after this image" signal instead of nothing.
(function() {
  const editor = document.getElementById('e-content');
  if (!editor) return;
  let _highlighted = null;
  function clearHighlight() {
    if (_highlighted) { _highlighted.classList.remove('img-caret-adjacent'); _highlighted = null; }
  }
  // Walk outward from a text position to the nearest FIGURE ancestor/sibling
  // - the DOM node the caret is "at" (its container) is usually the shared
  // parent of the image and surrounding text, not the figure itself.
  function figureNear(node, offset) {
    if (!node) return null;
    // Collapsed range sitting inside or right next to a figure: check the
    // child at/adjacent to the offset for an element range (text nodes have
    // no children - only relevant when node is the contenteditable/a block,
    // i.e. the caret is between block-level children, not inside text).
    if (node.nodeType === Node.ELEMENT_NODE) {
      const before = node.childNodes[offset - 1];
      const after = node.childNodes[offset];
      for (const cand of [after, before]) {
        if (!cand) continue;
        if (cand.nodeType === Node.ELEMENT_NODE) {
          const fig = cand.matches?.('figure, .img-pair') ? cand : cand.querySelector?.('figure');
          if (fig) return fig.tagName === 'FIGURE' ? fig : cand;
        }
      }
    }
    // Caret inside a text node right next to a figure sibling.
    let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    const prev = el?.previousElementSibling, next = el?.nextElementSibling;
    if (prev?.matches?.('figure, .img-pair')) return prev;
    if (next?.matches?.('figure, .img-pair')) return next;
    return null;
  }
  // Tapping directly on an <img> lets the browser select the image itself
  // as an "element selection" (not a text caret) - on mobile this also
  // triggers the browser's native "scroll the selected element into view"
  // behaviour, which visibly jumps the page (reported: "ça scrolle en bas
  // du input" from a single tap on a photo already fully on screen).
  // Placing a plain collapsed text-cursor right after the image ourselves
  // instead - same as clicking just past it - sidesteps both problems at
  // once: no native element-selection to scroll into view, and a normal
  // collapsed caret the selectionchange handler below already knows how to
  // highlight via figureNear().
  editor.addEventListener('click', e => {
    const img = e.target.closest('img');
    if (!img || !editor.contains(img)) return;
    e.preventDefault();
    const range = document.createRange();
    range.setStartAfter(img);
    range.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    editor.focus();
  });

  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !editor.contains(sel.anchorNode)) { clearHighlight(); return; }
    let fig = null;
    if (!sel.isCollapsed) {
      // Tapping an image directly (rather than the text right next to it)
      // gives the browser's own non-collapsed "this one element is
      // selected" range - covered by figureNear's collapsed-caret path,
      // check the range's actual selected content for a figure instead.
      const range = sel.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const root = container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement;
      fig = root?.closest?.('figure, .img-pair') || root?.querySelector?.('figure, .img-pair');
    } else {
      fig = figureNear(sel.anchorNode, sel.anchorOffset);
    }
    if (fig === _highlighted) return;
    clearHighlight();
    if (fig) { fig.classList.add('img-caret-adjacent'); _highlighted = fig; }
  });
})();
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
  _pushUndoSnapshotForAction();
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
  _pushUndoSnapshotForAction();
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

// Upgrades every bare <img> (not already inside a <figure>) found in the
// editor to the same <figure> structure every image insertion path
// produces (delete button, split-to-half button) - imported/older
// articles stored images as plain <img> tags with none of that, so they
// had no visible controls at all. Each bare image sits alone in its own
// <p> in every article seen so far (confirmed against a real 272-image
// article) - that <p> gets replaced by the figure directly, same
// placement, same "full width" sizing as a freshly inserted photo.
function _wrapBareImages(editor) {
  const bareImgs = Array.from(editor.querySelectorAll('img')).filter(img => !img.closest('figure'));
  bareImgs.forEach(img => {
    // Both captured BEFORE _makeImgFigure, which reparents img into the
    // new figure via appendChild - by the time that returns, img sits
    // inside the figure with no next sibling of its own, so reading
    // either of these afterward silently breaks insertBefore below
    // (confirmed live: threw "node before which... is not a child of
    // this node" partway through a 272-image article, leaving the
    // preload overlay stuck since the exception aborted reveal() midway).
    const parent = img.parentElement;
    const nextSibling = img.nextSibling;
    const wasOnlyChild = parent && parent.tagName === 'P' && parent.childNodes.length === 1 && parent.firstChild === img;
    const figure = _makeImgFigure(img, img.alt, 'full');
    if (wasOnlyChild) {
      parent.replaceWith(figure);
    } else if (parent) {
      parent.insertBefore(figure, nextSibling);
    }
  });
}

// ── Image figure helpers ──────────────────────────────────────
// Accepts either a URL (creates a fresh <img>, the normal insert path) or
// an existing <img> element (reused in place - see _wrapBareImages, which
// upgrades bare <img> tags from older/imported article content that
// predates this figure-wrapper structure, so they get the same delete/
// split controls as every image inserted since).
function _makeImgFigure(urlOrImg, caption, size) {
  const figure = document.createElement('figure');
  figure.className = 'img-' + size;
  figure.setAttribute('contenteditable', 'false');
  let img;
  if (urlOrImg instanceof Element) {
    img = urlOrImg;
    if (caption != null) img.alt = caption;
  } else {
    img = document.createElement('img'); img.src = urlOrImg; img.alt = caption || '';
  }
  figure.appendChild(img);
  // Never render caption/filename in the editor
  const del = document.createElement('button');
  del.type = 'button'; del.className = 'img-delete'; del.title = 'Supprimer'; del.textContent = '\u00d7';
  del.onclick = function(e) { e.stopPropagation(); _deleteImgFigure(figure); };
  figure.appendChild(del);
  if (size === 'full') {
    const split = document.createElement('button');
    split.type = 'button'; split.className = 'img-split'; split.title = 'Mettre en demi-largeur';
    split.innerHTML = '<i class="ph-bold ph-columns"></i>';
    split.onclick = function(e) { e.stopPropagation(); _splitToHalf(figure); };
    figure.appendChild(split);
  }
  return figure;
}
function _splitToHalf(figure) {
  const editor = document.getElementById('e-content');
  const parent = figure.parentElement;
  if (parent !== editor) return; // only split top-level full figures
  _pushUndoSnapshotForAction();
  figure.className = 'img-half';
  figure.querySelectorAll('.img-split').forEach(b => b.remove());
  const row = document.createElement('div'); row.className = 'img-pair';
  parent.insertBefore(row, figure);
  row.appendChild(figure);
  _refreshImgPairSlot(row);
}
function _deleteImgFigure(figure) {
  _pushUndoSnapshotForAction();
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
    slot.innerHTML = '<i class="ph-bold ph-plus-circle"></i><span>Ajouter</span>';
    slot.onclick = function() { openInsertImg(row); };
    row.appendChild(slot);
    // Expand-to-full button on the lone figure
    figures.forEach(fig => {
      const exp = document.createElement('button');
      exp.type = 'button'; exp.className = 'img-expand'; exp.title = 'Repasser en pleine largeur';
      exp.innerHTML = '<i class="ph-bold ph-arrows-out-simple"></i>';
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
  split.innerHTML = '<i class="ph-bold ph-columns"></i>';
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
      \`<div class="aspect-square overflow-hidden rounded-xl cursor-pointer ring-2 ring-transparent hover:ring-[var(--blue)] transition-all" data-url="\${esc(p.url)}" data-caption="\${esc(p.caption)}"><img src="\${esc(p.url)}" alt="\${esc(p.caption)}" class="w-full h-full object-cover"></div>\`
    ).join('');
  }
  setImgSize(_pairAddTarget ? 'half' : 'full');
  const capIn = document.getElementById('iim-caption');
  if (capIn) capIn.value = '';
  document.getElementById('insert-img-modal').classList.remove('hidden');
  // PWA back button (see shell.js's back-stack) dismisses this dialog
  // instead of falling through to real page navigation / exiting the app.
  //
  // This dialog is very often opened via a click on the mobile formatting
  // bar's image button, which fires #e-content's blur just before this
  // handler runs - the editor-editing IIFE's own back-stack bookkeeping for
  // that blur is deferred one tick, so its "keyboard is open" entry is still
  // on the stack right now. Swap it in place (replaceTopBackHandler) rather
  // than stacking a second entry on top: opening the keyboard then tapping
  // its own toolbar to open this dialog is one continuous user action, not
  // two independently-dismissable layers - a single back tap should return
  // straight to the editor, not first close an empty "nothing to show for
  // it" keyboard-closed state.
  if (window._tvEditingBackHandler) {
    window._tvEditingBackHandler = false;
    replaceTopBackHandler(closeInsertImg);
  } else {
    pushBackHandler(closeInsertImg);
  }
}
function closeInsertImg() {
  document.getElementById('insert-img-modal').classList.add('hidden');
  popBackHandler();
}

// ── Mobile "Options" drawer (Statut/Infos/photo de couverture/Supprimer) ──
// Below lg, #editor-sidebar normally sits inline above the article text and
// is only reachable by scrolling back to the top. Toggling this class turns
// it into a full-screen overlay (CSS in the page <style>) instead - opened
// from the "⋮" button next to Sauvegarder in the sticky bottom bar, so those
// settings stay reachable no matter how far down the article you've scrolled.
function openMobileOptsDrawer() {
  document.body.classList.add('mobile-opts-open');
  pushBackHandler(closeMobileOptsDrawer);
}
function closeMobileOptsDrawer() {
  document.body.classList.remove('mobile-opts-open');
  popBackHandler();
}
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
  file = await compressImage(file);
  const reader=new FileReader();
  reader.onload=ev=>{ previewCover(ev.target.result); };
  reader.readAsDataURL(file);
  if(ARTICLE_ID) {
    const fd=new FormData(); fd.append('cover',file);
    const res=await fetch('/api/articles/'+ARTICLE_ID+'/cover',{method:'POST',body:fd, signal: AbortSignal.timeout(30000)}).catch(()=>null);
    if(res?.ok){
      const data=await res.json();
      document.getElementById('e-cover').value=data.url;
      previewCover(data.url);
      toast('Couverture mise à jour !','ok');
    } else {
      // Network flaky/offline mid-trip: queue it instead of just failing -
      // it'll upload itself as soon as the connection allows.
      await queueOfflinePhoto(ARTICLE_ID, file, { isCover: true });
      await _refreshPendingPhotoCount();
      toast('Couverture en attente (envoi dès que connecté)', 'info');
    }
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
        <button data-action="insert-photo" data-url="\${esc(p.url)}" data-caption="\${esc(p.caption||'photo')}" class="text-white text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap" style="background:var(--blue)"><i class="ph-bold ph-text-align-center"></i> Ré-insérer</button>
        <button data-action="del-existing-photo" data-id="\${p.id}" data-index="\${i}" class="text-white text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap" style="background:var(--danger)"><i class="ph-bold ph-trash"></i> Supprimer</button>
      </div>
    </div>\`).join('');
  const newPics = newPhotos.map((p,i)=>\`
    <div class="relative aspect-square overflow-hidden rounded-xl group">
      <img src="\${p.dataUrl}" alt="\${esc(p.name)}" class="w-full h-full object-cover">
      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/55 transition-all flex flex-col items-center justify-center gap-1.5 p-1">
        <span class="text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-center leading-tight" style="background:rgba(var(--ink-rgb),.8)">Insérée après<br>sauvegarde</span>
        <button data-action="rm-new-photo" data-index="\${i}" class="text-white text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap" style="background:var(--danger)"><i class="ph-bold ph-trash"></i> Supprimer</button>
      </div>
      <div class="absolute bottom-1 right-1 text-xs rounded-full px-1.5 font-bold" style="background:var(--apricot);color:var(--pending)">Nouveau</div>
    </div>\`).join('');
  g.innerHTML = existing + newPics;
}

function handleFiles(files) {
  (async () => {
    const ok = await ensureArticleId();
    if (!ok) return;
    const compressed = await compressFiles(files);

    // Fully offline: don't even attempt the request, straight to the queue.
    // Otherwise: try uploading now, and only fall back to the queue if the
    // request actually fails (timeout, dropped connection mid-upload) -
    // patchy hotel/roaming wifi is the normal case in the field, not a clean
    // "offline" state, so this must not depend on navigator.onLine alone.
    if (!navigator.onLine) { await queueAllPhotos(compressed); return; }

    toast('Upload en cours...', 'ok');
    const fd = new FormData();
    compressed.forEach(f => fd.append('photo', f));
    try {
      const res = await fetch('/api/articles/'+ARTICLE_ID+'/photos', {method:'POST', body:fd, signal: AbortSignal.timeout(30000)});
      const data = await res.json();
      const uploaded = data.uploaded || [];
      const rejected = data.rejected || [];
      existingPhotos.push(...uploaded);
      renderPhotoGrid();
      uploaded.forEach(p => insertPhotoInText(p.url, p.caption || 'photo', false));
      if (uploaded.length) {
        toast(uploaded.length === 1 ? 'Photo insérée !' : uploaded.length + ' photos insérées !','ok');
      }
      // Every file failed magic-byte validation (e.g. HEIC/HEIF or another
      // unsupported format) - don't show a false "success" toast for 0 photos.
      if (rejected.length) {
        toast(rejected.length + ' photo(s) au format non pris en charge (essayez JPEG, PNG, WebP)', 'err');
      }
    } catch (err) {
      // Network failure mid-upload (timeout, connection dropped) - queue for
      // background retry instead of just losing the photos.
      await queueAllPhotos(compressed);
    }
  })();
}
async function queueAllPhotos(files) {
  for (const f of files) await queueOfflinePhoto(ARTICLE_ID, f, { isCover: false });
  renderPhotoGrid();
  await _refreshPendingPhotoCount();
  toast(files.length === 1 ? 'Photo en attente (envoi dès que connecté)' : files.length + ' photos en attente (envoi dès que connecté)', 'info');
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
  ['archived','published','publish_when_online'].forEach(s => {
    const btn = document.getElementById('btn-' + s);
    if (btn) btn.classList.toggle('is-active', s === val);
  });
  const notifySection = document.getElementById('notify-section');
  if (notifySection) notifySection.classList.toggle('hidden', val !== 'published' && val !== 'publish_when_online');
  const lbl = document.getElementById('sticky-status-lbl');
  if (lbl) {
    const labels = { archived:'Archivé', published:'Publié', publish_when_online:'Dès connexion' };
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
  // ── Offline : sauvegarde locale + file d'attente de synchro ───
  if (!navigator.onLine) {
    saveDraftLocal();
    const title = document.getElementById('e-title')?.value.trim();
    if (title) {
      const payload = _draftPayload();
      payload.notify = false; // never auto-notify subscribers for a sync that happens unattended
      try {
        await queueOfflineArticleSave(ARTICLE_ID ? 'PUT' : 'POST', ARTICLE_ID ? ('/api/articles/'+ARTICLE_ID) : '/api/articles', payload);
      } catch (e) { /* IndexedDB unavailable - the local draft above is still the fallback */ }
    }
    updateSyncInfo();
    toast('Sauvegardé - sera envoyé dès que possible 📴', 'ok');
    const lbl = document.getElementById('sticky-status-lbl');
    if (lbl) lbl.textContent = '📴 En attente de connexion';
    return;
  }

  const title = document.getElementById('e-title').value.trim();
  if (!title) { toast('Le titre est obligatoire','err'); return; }
  const startDate = document.getElementById('e-start-date').value;
  const endDate = document.getElementById('e-end-date').value;
  if (!startDate || !endDate) { toast('Le voyage doit avoir un début et une fin','err'); return; }
  if (endDate < startDate) { toast('La fin doit être après le début','err'); return; }

  const status = getStatus();
  // Send the status honestly to the server - it used to be silently rewritten
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
    content:           stripDataUris(restorePlaceholderSrcs(document.getElementById('e-content').innerHTML)),
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
        // filename rather than by array index - if any file was rejected
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
// Paste image(s) + text from clipboard into the editor. A single paste can
// carry both at once (e.g. sharing a phone gallery selection with a caption,
// or a chat app message with attached photos) - clipboardData exposes each
// as separate items, so both must be handled here, not just whichever is
// found first (an earlier version returned right after handling images,
// silently dropping any text that came in the same paste).
document.getElementById('e-content')?.addEventListener('paste', async e => {
  e.preventDefault();
  const items = [...e.clipboardData.items].filter(i => i.type.startsWith('image/'));
  // Word (and Word Online/Outlook) doesn't expose pasted images as a plain
  // image/* clipboard item - it only puts them inline as base64 data: URIs
  // inside the text/html flavor. Without this, the items list above stays
  // empty for a Word paste and the images were silently dropped, keeping
  // only the text. Extract every data:image src from the HTML flavor (if
  // any) and treat each one as an image to upload, same as a direct paste.
  const html = e.clipboardData.getData('text/html');
  const allImgSrcs = html ? [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map(m => m[1]) : [];
  // Word/Word Online/Outlook only puts pasted images inline as base64
  // data: URIs inside the text/html flavor, never as a plain image/* item.
  const dataImageUrls = allImgSrcs.filter(src => src.indexOf('data:image/') === 0);
  // Copying an <img> that's already IN this editor (duplicating a photo,
  // or copy/pasting between two articles) puts a real http(s):// src in
  // the HTML flavor instead of a data: URI or an image/* clipboard item -
  // it's already hosted on our own storage, so it just needs inserting
  // again, no upload/re-encode needed.
  const hostedImageUrls = allImgSrcs.filter(src => /^(https?:)?[/][/]/i.test(src) || src.indexOf('/r2/') === 0);
  // Force plain-text for the text part in all cases. Sources like Samsung
  // Notes or a copy from the site's own rendered preview carry inline
  // style="--tw-..." (Tailwind) attributes on every element - left alone,
  // the browser's default rich-paste drags all of that markup into the
  // article content, which previously corrupted an article's storage
  // (dozens of KB of dead CSS text wedged between paragraphs). Plain text
  // still preserves line breaks, just strips all markup/styling.
  const text = e.clipboardData.getData('text/plain');
  // Images go in BEFORE the text, not after: insertPhotoAtRange/
  // uploadAndInsertAtRange move the live selection to right after each
  // inserted figure, so chaining them one after another naturally keeps
  // insertion order - but a range captured once and reused for every
  // insertion goes stale after the first one moves the selection. Doing
  // the text insertion (execCommand('insertText'), which always targets
  // the CURRENT selection) first used to run before this loop and left
  // every image re-targeting that same now-stale post-text position,
  // which silently reordered "image then caption" pastes into "caption
  // then image" (reported bug). Re-reading the selection right before
  // each step instead keeps them in the order the user actually pasted.
  if (items.length || dataImageUrls.length || hostedImageUrls.length) {
    const getRange = () => {
      const sel = window.getSelection();
      return sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    };
    for (const item of items) { const file = item.getAsFile(); if (file) await uploadAndInsertAtRange(file, getRange()); }
    for (let i = 0; i < dataImageUrls.length; i++) { await uploadAndInsertAtRange(dataUrlToFile(dataImageUrls[i], 'image-' + (i + 1) + '.png'), getRange()); }
    for (const src of hostedImageUrls) { insertPhotoAtRange(src, '', getRange()); }
    // execCommand('insertText', ...) silently no-ops (returns false, does
    // nothing) once called after an await on a real network request - it
    // needs to run synchronously within the trusted user-gesture call
    // stack the paste event started in, which the image upload(s) above
    // already left behind. Insert the text as plain DOM nodes at the
    // current selection instead, which has no such restriction (found by
    // instrumenting execCommand directly: it returned false here, and the
    // pasted caption silently vanished even though the image landed fine).
    if (text) {
      const range = getRange();
      if (range) {
        range.deleteContents();
        const lines = text.split('\\n');
        const frag = document.createDocumentFragment();
        lines.forEach((line, i) => {
          if (i > 0) frag.appendChild(document.createElement('br'));
          frag.appendChild(document.createTextNode(line));
        });
        const lastNode = frag.lastChild;
        range.insertNode(frag);
        if (lastNode) {
          const sel = window.getSelection();
          sel.removeAllRanges();
          const r2 = document.createRange();
          r2.setStartAfter(lastNode);
          r2.collapse(true);
          sel.addRange(r2);
        }
      }
    }
  } else if (text) {
    document.execCommand('insertText', false, text);
  }
});

// ── Mobile bottom bar swap: Sauvegarder vs formatting, never both ─────────
// The Sauvegarder bar must be the default state at all times, and only ever
// give way to the formatting bar while an on-screen keyboard is actually
// covering the screen - DOM focus on #e-content is NOT the same thing:
// - focus can persist with no keyboard visible (tapping the keyboard's own
//   "back"/dismiss key/gesture only hides the keyboard, it doesn't blur the
//   field), which left the formatting bar shown with nothing to justify it.
// - a click that starts inside #e-content but is really aimed at a button
//   OUTSIDE it (Sauvegarder, a toolbar button, "Fermer"...) can transiently
//   blur with no refocus at all in some browsers, which could leave BOTH
//   bars hidden for a frame - a real bug the previous focus-only version hit.
// visualViewport height shrinking relative to the layout viewport is the
// actual, engine-reported signal for "a keyboard is on screen" and is true
// or false regardless of how the keyboard got dismissed. body.editor-editing
// still exists as the single CSS switch (unchanged), just driven by this
// instead of focus/blur.
(function() {
  const editor = document.getElementById('e-content');
  const vv = window.visualViewport;
  if (!editor) return;

  // interactive-widget=resizes-content (viewport meta, see shell.js) makes
  // the on-screen keyboard shrink window.innerHeight itself, not just
  // visualViewport - comparing the two against EACH OTHER (the previous
  // approach) no longer isolates the keyboard's height, since both shrink
  // together. Track the tallest innerHeight ever seen instead, as a stable
  // "no keyboard" baseline (screen rotation/URL-bar-collapse only ever grow
  // it back toward that same max, never past it) - a real keyboard is the
  // one thing that pushes innerHeight measurably BELOW its own recent
  // maximum while the page itself hasn't navigated or resized the window.
  let _maxHeight = window.innerHeight;
  function keyboardLikelyOpen() {
    if (window.innerHeight > _maxHeight) _maxHeight = window.innerHeight;
    // 0.75 leaves headroom for browser chrome (URL bar collapsing/
    // expanding) never being mistaken for a keyboard, while still catching
    // every real on-screen keyboard (typically 35-50% of screen height).
    return window.innerHeight < _maxHeight * 0.75;
  }

  // While the keyboard is open, PWA back should dismiss it (blur the
  // editor) instead of navigating away or exiting the app - same
  // pushBackHandler/popBackHandler mechanism as the modals in shell.js.
  // window._tvEditingBackHandler tracks whether WE currently hold an entry
  // (exposed on window, not a closure-local, so openInsertImg() below can
  // synchronously hand off to it - see the comment there for why that
  // matters) so toggling editor-editing on/off only pushes/pops once per
  // open/close instead of once per update() call (update() re-runs on every
  // scroll/resize event while the keyboard is up).
  window._tvEditingBackHandler = false;
  function update() {
    const open = document.activeElement === editor && keyboardLikelyOpen();
    document.body.classList.toggle('editor-editing', open);
    if (open && !window._tvEditingBackHandler) {
      window._tvEditingBackHandler = true;
      pushBackHandler(() => { window._tvEditingBackHandler = false; editor.blur(); });
    } else if (!open && window._tvEditingBackHandler) {
      window._tvEditingBackHandler = false;
      popBackHandler();
    }
  }

  editor.addEventListener('focus', update);
  // A tap on one of the formatting buttons blurs #e-content (focus moving to
  // the button) BEFORE that button's own click handler runs and calls
  // editor.focus() again (fmt()/fmtBlock() both do) - reading
  // activeElement synchronously on blur sees the button, not the editor,
  // and would wrongly drop back to the Sauvegarder bar mid-keystroke. Defer
  // one tick so the click's refocus lands first; only actual navigation away
  // (tapping the title field, closing the drawer, etc.) leaves the editor
  // un-focused by the time this runs.
  editor.addEventListener('blur', () => setTimeout(update, 0));
  if (vv) {
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
  }
  // Also catch the keyboard's own dismiss gesture on browsers that fire a
  // plain window resize instead of (or in addition to) visualViewport events.
  window.addEventListener('resize', update);
  update();
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
_refreshPendingPhotoCount();
// A fresh page load is also exactly what happens right after logging back in
// (session was expired -> login form -> back to the editor), so nudge the SW
// to retry anything still queued from before the session lapsed - otherwise
// it would sit untouched until the next 'online' event or Background Sync tick.
navigator.serviceWorker?.controller?.postMessage('sync-now');
</script>
</body>
</html>`);
}
