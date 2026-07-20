/**
 * pages/admin-auth.js - Pre-auth HTML pages for the admin credential flows:
 *   - setup / reset  (choose-a-new-password landing, shared template)
 *   - confirm-email  (result page after clicking the confirmation link)
 *
 * These reuse the visual language of loginPage() in admin.js (stone/sky palette,
 * section-panel + majorelle-frame card). No inline event handlers.
 */

import { HEAD } from './shell.js';
import { html } from '../utils.js';
import { safeText, safeAttr } from '../helpers/html.js';

// ── Shared page chrome ────────────────────────────────────────────────────────
function authShell(titleTag, inner) {
  return html(`<!DOCTYPE html>
<html lang="fr">
<head>${HEAD(titleTag)}</head>
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
      ${inner}
    </div>
    <p class="text-center text-stone-400 text-sm mt-6">
      <a href="/" class="hover:text-sky-600 transition-colors">&lt; Retour au blog</a>
    </p>
  </div>
</div>
</body>
</html>`);
}

/**
 * Choose-a-new-password page (used by both /admin/setup and /admin/reset).
 * @param {'setup'|'reset'} mode
 * @param {string} token   - the raw token (embedded in the form, re-posted)
 * @param {boolean} valid  - whether the token is currently valid
 */
export function setPasswordPage(mode, token, valid) {
  const isSetup = mode === 'setup';
  const title = isSetup ? 'Initialiser le mot de passe' : 'Réinitialiser le mot de passe';

  if (!valid) {
    return authShell(`Admin - ${title}`, `
      <div class="mb-5 bg-red-50 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium border border-red-100">
        <i class="ph-fill ph-x-circle"></i> Ce lien est invalide ou a expiré (validité : 1 heure).
      </div>
      <p class="text-sm text-stone-600 mb-6">Demandez un nouveau lien depuis la page de connexion (« Mot de passe oublié ? »).</p>
      <a href="/admin" class="w-full action-btn justify-center text-base">Retour à la connexion <i class="ph ph-arrow-right"></i></a>`);
  }

  const heading = isSetup ? 'Choisissez votre mot de passe' : 'Choisissez un nouveau mot de passe';
  return authShell(`Admin - ${title}`, `
    <h2 class="font-bold text-stone-800 mb-1">${safeText(heading)}</h2>
    <p class="text-sm text-stone-500 mb-6">Minimum 8 caractères.</p>
    <div id="err" class="hidden mb-5 bg-red-50 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium border border-red-100"></div>
    <form id="pw-form">
      <input type="hidden" id="token" value="${safeAttr(token)}">
      <div class="mb-4">
        <label class="block text-sm font-bold text-stone-700 mb-2" for="pw">Mot de passe</label>
        <input type="password" id="pw" name="pw" autocomplete="new-password" minlength="8" required autofocus
               placeholder="••••••••" class="w-full border-2 border-stone-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-sky-400 transition-colors font-medium">
      </div>
      <div class="mb-6">
        <label class="block text-sm font-bold text-stone-700 mb-2" for="pw2">Confirmer le mot de passe</label>
        <input type="password" id="pw2" name="pw2" autocomplete="new-password" minlength="8" required
               placeholder="••••••••" class="w-full border-2 border-stone-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-sky-400 transition-colors font-medium">
      </div>
      <button type="submit" id="submit" class="w-full action-btn justify-center text-base">
        ${isSetup ? 'Activer mon compte' : 'Enregistrer'} <i class="ph ph-arrow-right"></i>
      </button>
    </form>
    <script>
    (function(){
      var form=document.getElementById('pw-form');
      var err=document.getElementById('err');
      function showErr(m){err.textContent=m;err.classList.remove('hidden');}
      form.addEventListener('submit', async function(e){
        e.preventDefault();
        err.classList.add('hidden');
        var pw=document.getElementById('pw').value;
        var pw2=document.getElementById('pw2').value;
        if(pw.length<8){showErr('Le mot de passe doit contenir au moins 8 caractères.');return;}
        if(pw!==pw2){showErr('Les deux mots de passe ne correspondent pas.');return;}
        var btn=document.getElementById('submit');
        btn.disabled=true;
        var res=await fetch('/admin/set-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:document.getElementById('token').value,password:pw})}).catch(function(){return null;});
        if(res&&res.redirected){location.href=res.url;return;}
        var data=res?await res.json().catch(function(){return null;}):null;
        if(res&&res.ok&&data&&data.redirect){location.href=data.redirect;return;}
        btn.disabled=false;
        showErr((data&&data.error)||'Une erreur est survenue. Le lien a peut-être expiré.');
      });
    })();
    </script>`);
}

/**
 * Result page for /admin/confirm-email.
 * @param {'ok'|'invalid'|'login'} state
 * @param {string} [newEmail]
 */
export function confirmEmailPage(state, newEmail = '') {
  if (state === 'login') {
    return authShell('Admin - Confirmation email', `
      <div class="mb-5 bg-amber-50 text-amber-800 px-4 py-3 rounded-2xl text-sm font-medium border border-amber-100">
        <i class="ph-fill ph-warning-circle"></i> Vous devez être connecté pour confirmer ce changement d'adresse.
      </div>
      <p class="text-sm text-stone-600 mb-6">Connectez-vous, puis cliquez à nouveau sur le lien reçu par email.</p>
      <a href="/admin" class="w-full action-btn justify-center text-base">Se connecter <i class="ph ph-arrow-right"></i></a>`);
  }
  if (state === 'invalid') {
    return authShell('Admin - Confirmation email', `
      <div class="mb-5 bg-red-50 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium border border-red-100">
        <i class="ph-fill ph-x-circle"></i> Ce lien de confirmation est invalide ou a expiré (validité : 1 heure).
      </div>
      <a href="/admin/dashboard#settings" class="w-full action-btn justify-center text-base">Retour au tableau de bord <i class="ph ph-arrow-right"></i></a>`);
  }
  return authShell('Admin - Confirmation email', `
    <div class="mb-5 bg-emerald-50 text-emerald-800 px-4 py-3 rounded-2xl text-sm font-medium border border-emerald-100">
      <i class="ph-fill ph-check-circle"></i> Adresse email mise à jour !
    </div>
    <p class="text-sm text-stone-600 mb-6">Votre compte administrateur utilise désormais l'adresse <strong>${safeText(newEmail)}</strong>.</p>
    <a href="/admin/dashboard#settings" class="w-full action-btn justify-center text-base">Retour au tableau de bord <i class="ph ph-arrow-right"></i></a>`);
}
