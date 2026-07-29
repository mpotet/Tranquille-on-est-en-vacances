/**
 * pages/showcase.js - "Créer mon carnet" page (GET /creer-mon-carnet)
 *
 * Public, no DB dependency except the admin's contact_email setting - a
 * standalone marketing page that sells the blog engine itself (not a trip),
 * aimed at anyone who currently keeps travel memories on an old-school free
 * blog platform (ads, no offline reading, clunky admin) and might want this
 * instead. Static content by design: nothing here needs to be admin-editable,
 * unlike the home page's texts.
 */

import { HEAD, NAV, FOOTER, TOAST } from './shell.js';
import { html } from '../utils.js';

const SITE_URL = 'https://tranquille-vacances.esti-archi.workers.dev';

function feature(icon, title, text) {
  return `
    <div class="panel rounded-2xl p-5 sm:p-6">
      <div class="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style="background:var(--blue-light)">
        <i class="ph-bold ${icon}" style="font-size:1.3rem;color:var(--blue)"></i>
      </div>
      <h3 class="font-display text-base font-bold mb-1.5" style="color:var(--ink)">${title}</h3>
      <p class="text-sm leading-relaxed" style="color:var(--ink-muted)">${text}</p>
    </div>`;
}

function compareRow(text, good) {
  const tint = good ? 'var(--palm)' : 'var(--danger)';
  const bg = good ? 'rgba(var(--palm-rgb),.06)' : 'rgba(220,60,60,.05)';
  return `
    <li class="flex items-start gap-3 rounded-xl p-3" style="background:${bg}">
      <i class="ph-bold ${good ? 'ph-check-circle' : 'ph-x-circle'}" style="font-size:1.25rem;flex-shrink:0;margin-top:.05rem;color:${tint}"></i>
      <span class="text-sm leading-relaxed font-medium" style="color:var(--ink)">${text}</span>
    </li>`;
}

export function showcasePage(authed = false, contactEmail = 'tranquilleonestenvacances@free.fr') {
  const email = contactEmail || 'tranquilleonestenvacances@free.fr';
  return html(`<!DOCTYPE html>
<html lang="fr">
<head>${HEAD(
    'Créer mon carnet de voyage - Tranquille, on est en vacances',
    "Envie d'un carnet de voyage comme celui-ci, sans publicité, utilisable hors ligne, et facile à administrer depuis votre téléphone ? Découvrez comment.",
    { url: SITE_URL + '/creer-mon-carnet' }
  )}</head>
<body class="font-sans antialiased" style="background:var(--cream)">
${NAV('', authed)}
<main class="pt-16">

  <!-- ── Hero ─────────────────────────────────────────────────── -->
  <section class="relative overflow-hidden" style="background:linear-gradient(160deg,var(--blue) 0%,var(--blue-dark) 100%)">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center relative z-[1]">
      <div class="eyebrow mb-5 inline-flex" style="background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.3);color:#fff">Envie du même carnet ?</div>
      <h1 class="font-display text-3xl sm:text-5xl font-bold text-white leading-tight mb-5">Ce blog, vous pourriez l'avoir aussi.</h1>
      <p class="text-base sm:text-lg leading-relaxed mb-8" style="color:rgba(255,255,255,.88)">Sans publicité, lisible même sans réseau, et pensé pour qu'on puisse écrire et publier depuis son téléphone, en plein voyage. Voici tout ce qu'il y a sous le capot - et pourquoi ça change tout par rapport à un blog gratuit classique.</p>
      <a href="mailto:${email}?subject=${encodeURIComponent('Je veux un carnet comme le vôtre')}" class="inline-flex items-center gap-2 font-bold text-sm sm:text-base rounded-full px-7 py-3.5 transition-transform hover:-translate-y-0.5" style="background:#fff;color:var(--blue);box-shadow:0 10px 30px rgba(0,0,0,.2)">
        <i class="ph-bold ph-envelope-simple"></i> Contacter ${email}
      </a>
    </div>
  </section>

  <!-- ── Comparatif ───────────────────────────────────────────── -->
  <section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div class="text-center mb-10">
      <div class="eyebrow mb-4 inline-flex">Face à un blog gratuit classique</div>
      <h2 class="font-display text-2xl sm:text-3xl font-bold" style="color:var(--ink)">Le confort d'un vrai site, pas d'une plateforme des années 2000</h2>
    </div>
    <div class="grid sm:grid-cols-2 gap-5 sm:gap-6">
      <div class="panel rounded-[1.75rem] p-6 sm:p-7">
        <h3 class="font-display text-lg font-bold mb-4 flex items-center gap-2" style="color:var(--danger)"><i class="ph-bold ph-x-circle"></i> Un blog gratuit classique</h3>
        <ul class="space-y-2">
          ${compareRow('Publicités affichées sur vos photos et vos textes, hors de votre contrôle', false)}
          ${compareRow("Illisible sans réseau - une panne de 4G en voyage et la page ne charge plus", false)}
          ${compareRow('Interface d\'administration vieillissante, pensée pour un ordinateur de bureau', false)}
          ${compareRow('Aucune statistique fiable sur qui vous lit', false)}
          ${compareRow('Design figé, non personnalisable au-delà de quelques thèmes tout faits', false)}
          ${compareRow('Photos compressées agressivement par la plateforme, qualité imposée', false)}
          ${compareRow('Pas d\'alerte aux lecteurs à la publication d\'un nouveau récit', false)}
          ${compareRow('Le blog peut disparaître du jour au lendemain si la plateforme ferme', false)}
        </ul>
      </div>
      <div class="panel rounded-[1.75rem] p-6 sm:p-7" style="border-color:rgba(var(--palm-rgb),.35);box-shadow:0 8px 30px rgba(var(--palm-rgb),.10)">
        <h3 class="font-display text-lg font-bold mb-4 flex items-center gap-2" style="color:var(--palm)"><i class="ph-bold ph-check-circle"></i> Ce carnet-ci</h3>
        <ul class="space-y-2">
          ${compareRow('Zéro publicité, nulle part. Le site vous appartient entièrement.', true)}
          ${compareRow("Se lit hors ligne comme une vraie appli installée sur le téléphone - même en pleine montagne sans réseau", true)}
          ${compareRow('Rédaction et publication depuis le téléphone, en quelques taps, même en voyage', true)}
          ${compareRow('Tableau de bord de visites : qui vous lit, d\'où, quels récits marchent le mieux', true)}
          ${compareRow('Design entièrement sur-mesure, à votre image, modifiable texte par texte', true)}
          ${compareRow('Vos photos, compressées intelligemment mais gardées en belle qualité', true)}
          ${compareRow('Notifications automatiques (email + push) à vos proches à chaque publication', true)}
          ${compareRow('Le site est à vous - hébergé pour vous, personne ne peut le fermer sans votre accord', true)}
        </ul>
      </div>
    </div>
  </section>

  <!-- ── Fonctionnalités détaillées ──────────────────────────────── -->
  <section class="py-16" style="background:var(--sand)">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-10">
        <div class="eyebrow mb-4 inline-flex">Sous le capot</div>
        <h2 class="font-display text-2xl sm:text-3xl font-bold" style="color:var(--ink)">Tout ce que ce carnet sait faire</h2>
        <p class="mt-3 max-w-2xl mx-auto text-sm sm:text-base" style="color:var(--ink-muted)">La liste complète - rien n'est survendu, tout est déjà en marche sur ce site même.</p>
      </div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        ${feature('ph-airplane-in-flight', 'Écrire depuis son téléphone, en voyage', "Éditeur pensé mobile d'abord : on rédige, on ajoute des photos et on publie depuis son téléphone, où qu'on soit.")}
        ${feature('ph-wifi-slash', 'Publication même sans réseau', 'Pas de signal ? Le récit et les photos sont mis en attente automatiquement et s\'envoient tout seuls dès que la connexion revient - même si l\'appli est fermée entre-temps.')}
        ${feature('ph-image', 'Photos compressées intelligemment', 'Chaque photo est allégée automatiquement avant envoi pour économiser data et espace, sans sacrifier la qualité visuelle.')}
        ${feature('ph-device-mobile', 'Une vraie application', "Installable sur l'écran d'accueil du téléphone comme une appli classique, avec son icône - et elle reste lisible même hors ligne, articles déjà consultés inclus.")}
        ${feature('ph-chart-line-up', 'Statistiques de visites', 'Qui vous lit, depuis quel pays et quelle ville, quels récits sont les plus populaires, avec comparaison automatique à la période précédente.')}
        ${feature('ph-bell-ringing', 'Alertes automatiques aux lecteurs', 'Vos proches reçoivent une notification (email et/ou notification sur leur téléphone) dès qu\'un nouveau récit est publié - sans qu\'ils aient à revenir vérifier.')}
        ${feature('ph-chat-circle-dots', 'Commentaires modérés simplement', "Vos lecteurs peuvent réagir sous chaque récit. Vous répondez et modérez depuis une page pensée pour ça, avec une question anti-spam sur-mesure.")}
        ${feature('ph-palette', 'Design entièrement personnalisé', "Couleurs, textes de la page d'accueil, citation, photo de couverture : tout se modifie depuis l'administration, sans toucher une ligne de code.")}
        ${feature('ph-moon-stars', 'Thème clair et sombre', "Le site s'adapte automatiquement aux préférences de chaque visiteur, ou se force manuellement.")}
        ${feature('ph-folders', 'Rangement par destination', "Les récits se classent par pays et sous-régions dans une arborescence de dossiers que vous gérez vous-même, pour une navigation limpide.")}
        ${feature('ph-shield-check', 'Aucune publicité, aucun tracker publicitaire', "Le site n'affiche jamais de publicité et ne revend aucune donnée. Seule une géolocalisation approximative et anonyme (pays/ville) alimente vos statistiques - jamais d'adresse IP conservée.")}
        ${feature('ph-export', 'Export PDF et Word', "Chaque récit s'exporte en un clic en PDF ou Word - pratique pour en garder une trace imprimable ou l'envoyer à la famille qui n'est pas en ligne.")}
      </div>
    </div>
  </section>

  <!-- ── Autres usages ────────────────────────────────────────────── -->
  <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div class="text-center mb-10">
      <div class="eyebrow mb-4 inline-flex">Pas que pour les voyages</div>
      <h2 class="font-display text-2xl sm:text-3xl font-bold" style="color:var(--ink)">D'autres façons de s'en servir</h2>
      <p class="mt-3 max-w-2xl mx-auto text-sm sm:text-base" style="color:var(--ink-muted)">Le principe - un carnet en ligne, sans pub, facile à tenir à jour depuis son téléphone - s'adapte à bien d'autres usages qu'un simple blog de voyage.</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      ${feature('ph-heart', 'Journal de grossesse ou de bébé', "Racontez les étapes, publiez les photos au fil des mois, et laissez la famille éloignée suivre l'aventure sans avoir à demander des nouvelles.")}
      ${feature('ph-house-line', "Vie d'expatriation", "Documentez une installation à l'étranger pour vos proches restés au pays, avec des mises à jour régulières et sans souci de connexion locale.")}
      ${feature('ph-tent', 'Van life / tour du monde au long cours', "Idéal pour un road-trip de plusieurs mois : publication au fil de l'eau, même dans les zones les moins connectées.")}
      ${feature('ph-users-three', 'Association ou club sportif', "Comptes-rendus de sorties, de tournois ou d'événements, classés par saison ou par activité, avec notification des membres à chaque publication.")}
      ${feature('ph-book-open-text', 'Journal de rénovation ou de projet', "Suivez un chantier, une construction ou un projet créatif de A à Z, avec photos avant/après et une frise chronologique naturelle.")}
      ${feature('ph-tree', "Livre d'or familial", "Un espace privé (ou public) pour centraliser les souvenirs de plusieurs générations, sans dépendre d'un réseau social.")}
    </div>
  </section>

  <!-- ── CTA final ────────────────────────────────────────────────── -->
  <section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
    <div class="rounded-[2rem] p-8 sm:p-10 text-center" style="background:linear-gradient(160deg,var(--blue) 0%,var(--blue-dark) 100%);box-shadow:0 20px 50px rgba(var(--blue-rgb),.25)">
      <i class="ph-bold ph-paper-plane-tilt" style="font-size:2.25rem;color:#fff"></i>
      <h2 class="font-display text-2xl sm:text-3xl font-bold text-white mt-4 mb-3">Envie du vôtre ?</h2>
      <p class="text-sm sm:text-base leading-relaxed mb-7 max-w-xl mx-auto" style="color:rgba(255,255,255,.88)">Écrivez-nous en décrivant votre projet - voyage, vie de famille, association, ou tout autre carnet que vous aimeriez tenir. On vous explique comment avoir le vôtre.</p>
      <a href="mailto:${email}?subject=${encodeURIComponent('Je veux un carnet comme le vôtre')}" class="inline-flex items-center gap-2 font-bold text-sm sm:text-base rounded-full px-7 py-3.5 transition-transform hover:-translate-y-0.5" style="background:#fff;color:var(--blue);box-shadow:0 10px 30px rgba(0,0,0,.2)">
        <i class="ph-bold ph-envelope-simple"></i> ${email}
      </a>
    </div>
  </section>

</main>

${FOOTER}
${TOAST}
<script>
const IS_ADMIN=${JSON.stringify(authed)};
</script>
</body>
</html>`);
}
