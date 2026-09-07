/**
 * TNR - Pipeline de rendu serveur (worker/helpers/render.js)
 *
 * Fige le comportement CORRIGE (septembre 2026) apres le bug des doublons de
 * galerie sur "Jordanie" :
 *   - une photo re-collee dans l'editeur repartait en R2 sous une nouvelle cle,
 *     donc une nouvelle URL, et apparaissait deux fois dans la galerie ;
 *   - les alts issus d'un import Word ("word image 36") etaient affiches aux
 *     lecteurs, en legende sous chaque photo et dans la lightbox.
 *
 * Ces tests echouent si l'un ou l'autre revient. Ne pas les "reparer" en
 * relachant l'assertion : c'est le bug qui serait revenu.
 *
 * Aucun acces reseau, aucune base : fonctions pures uniquement.
 */
import {
  renderGallery, renderVoyageContent, dedupePhotos, extractInlineImages,
  toHtml, stripMdText, renderWritingDays, thumbUrl, wideUrl,
} from '../worker/helpers/render.js';
import { phase, test, endPhase, ok, eq, match, noMatch, count } from './runner.js';

export default async function run() {

  // ─────────────────────────────────────────────────────────────────────────
  phase('Rendu › Dedoublonnage de la galerie');

  await test('une photo re-collee (meme legende, URL differente) est fusionnee', () => {
    const photos = [
      { url: '/r2/photos/2026/9/aaa.webp', caption: 'word image 35' },
      { url: '/r2/photos/2026/9/bbb.webp', caption: 'word image 36' },
      { url: '/r2/photos/2026/9/ccc.webp', caption: 'word image 36' }, // le doublon
    ];
    const out = dedupePhotos(photos);
    eq(out.length, 2, 'le doublon aurait du etre retire');
    eq(out.map(p => p.url), ['/r2/photos/2026/9/aaa.webp', '/r2/photos/2026/9/bbb.webp'],
      'c est la premiere occurrence (celle referencee dans le texte) qui doit survivre');
  });

  await test('la casse et les espaces d un aller-retour Word sont ignores', () => {
    const out = dedupePhotos([
      { url: '/r2/a.webp', caption: 'word image 36' },
      { url: '/r2/b.webp', caption: '  Word   Image 36 ' },
    ]);
    eq(out.length, 1, '"Word Image 36" et "word image 36" sont la meme photo');
  });

  await test('deux photos SANS legende ne sont jamais confondues', () => {
    // Regression critique : une legende vide ne porte aucune identite. Si on
    // dedoublonnait dessus, une galerie entiere de photos non decrites se
    // reduirait a une seule vignette.
    const out = dedupePhotos([
      { url: '/r2/a.webp', caption: '' },
      { url: '/r2/b.webp', caption: '' },
      { url: '/r2/c.webp', caption: null },
      { url: '/r2/d.webp' },
    ]);
    eq(out.length, 4, 'aucune photo sans legende ne doit disparaitre');
  });

  await test('la meme URL vue deux fois est fusionnee', () => {
    const out = dedupePhotos([
      { url: '/r2/a.webp', caption: '' },
      { url: '/r2/a.webp', caption: '' },
    ]);
    eq(out.length, 1);
  });

  await test('les URL encodees differemment sont reconnues identiques', () => {
    const out = dedupePhotos([
      { url: '/r2/mon image.webp', caption: '' },
      { url: '/r2/mon%20image.webp', caption: '' },
    ]);
    eq(out.length, 1, 'espace brut et %20 designent le meme fichier');
  });

  await test('entree vide ou absente ne fait pas planter', () => {
    eq(dedupePhotos([]), []);
    eq(dedupePhotos(null), []);
    eq(dedupePhotos(undefined), []);
  });

  await test('l ordre des photos restantes est preserve', () => {
    const out = dedupePhotos([
      { url: '/r2/1.webp', caption: '' },
      { url: '/r2/2.webp', caption: 'x' },
      { url: '/r2/3.webp', caption: '' },
      { url: '/r2/4.webp', caption: 'x' }, // doublon de 2
      { url: '/r2/5.webp', caption: '' },
    ]);
    eq(out.map(p => p.url), ['/r2/1.webp', '/r2/2.webp', '/r2/3.webp', '/r2/5.webp'],
      'le dedoublonnage ne doit pas reordonner la galerie');
  });

  endPhase();

  // ─────────────────────────────────────────────────────────────────────────
  phase('Rendu › Absence de legendes parasites');

  await test('aucun "word image" dans la galerie', () => {
    const g = renderGallery([
      { url: '/r2/a.webp', caption: 'word image 35' },
      { url: '/r2/b.webp', caption: 'word image 36' },
    ]);
    noMatch(g, /word image/i, 'les legendes d import Word ne doivent jamais atteindre le lecteur');
  });

  await test('les vignettes de galerie ont un alt vide', () => {
    const g = renderGallery([{ url: '/r2/a.webp', caption: 'word image 35' }]);
    noMatch(g, /alt="[^"]+"/, 'aucun alt non vide ne doit subsister');
    match(g, /alt=""/, 'alt="" (vide, pas absent) = image decorative pour un lecteur d ecran');
  });

  await test('aucune legende <p> sous les vignettes', () => {
    const g = renderGallery([{ url: '/r2/a.webp', caption: 'word image 35' }]);
    noMatch(g, /<p[^>]*>word image/i);
  });

  await test('aucun "word image" ni figcaption dans le corps de l article', () => {
    const content = '<figure class="img-full"><img src="/r2/b.webp" alt="word image 36"></figure>'
      + '<p><img src="/r2/x1.webp" alt="word image 21"><img src="/r2/x2.webp" alt="word image 22"></p>'
      + '<img src="/r2/bare.webp" alt="word image 99">';
    const r = renderVoyageContent(content, []);
    noMatch(r, /word image/i, 'ni en alt, ni en legende visible');
    noMatch(r, /<figcaption/i, 'aucune legende ne doit etre derivee d un alt');
  });

  await test('la lightbox ne transporte plus la legende', () => {
    const r = renderVoyageContent('<img src="/r2/bare.webp" alt="word image 99">', []);
    noMatch(r, /data-photo-caption="[^"]+"/, '"word image 99" en plein ecran serait pire que rien');
    match(r, /data-photo-caption=""/, 'attribut conserve vide : le JS client lit dataset.photoCaption');
  });

  endPhase();

  // ─────────────────────────────────────────────────────────────────────────
  phase('Rendu › Vignettes legeres (economie de donnees)');
  // Une galerie servait l'original (~341 Ko) dans une case de 400 px, soit
  // ~102 Mo pour un article de 307 photos. Les vignettes WebP ramenent cela a
  // ~16 Mo. Ces tests garantissent que la galerie sert bien la vignette, et que
  // le plein ecran garde l'original.

  await test('la galerie sert la vignette, pas l original', () => {
    const g = renderGallery([{ url: '/r2/photos/2026/86/a.jpg', caption: '' }]);
    match(g, /src="\/r2\/photos\/2026\/86\/a\.jpg\.w600\.webp"/,
      'la vignette WebP doit etre servie dans la grille');
  });

  await test('l original reste accessible pour le plein ecran', () => {
    const g = renderGallery([{ url: '/r2/photos/2026/86/a.jpg', caption: '' }]);
    match(g, /data-full="\/r2\/photos\/2026\/86\/a\.jpg"/,
      'sans data-full, la visionneuse afficherait une image degradee');
  });

  await test('les images externes ne sont pas transformees', () => {
    // Nous n hebergeons pas les fichiers de l ancien blog : leur inventer une
    // URL de vignette produirait une image cassee.
    const ext = 'https://storage.canalblog.com/76/90/1250329/133189461_o.jpg';
    eq(thumbUrl(ext), ext);
    const g = renderGallery([{ url: ext, caption: '' }]);
    match(g, /src="https:\/\/storage\.canalblog\.com[^"]*_o\.jpg"/);
  });

  await test('une URL deja vignette n est pas suffixee deux fois', () => {
    eq(thumbUrl('/r2/a.jpg.w600.webp'), '/r2/a.jpg.w600.webp',
      'un double suffixe pointerait vers un fichier inexistant');
  });

  await test('le suffixe se derive par simple concatenation', () => {
    // Le suffixe s ajoute APRES l extension d origine, ce qui evite d avoir a
    // analyser le nom de fichier - et fonctionne quelle que soit l extension.
    eq(thumbUrl('/r2/imported/x.jpg'), '/r2/imported/x.jpg.w600.webp');
    eq(thumbUrl('/r2/photos/2026/1/y.png'), '/r2/photos/2026/1/y.png.w600.webp');
    eq(thumbUrl(''), '');
  });

  await test('les vignettes restent en chargement differe', () => {
    const g = renderGallery([{ url: '/r2/a.jpg', caption: '' }]);
    match(g, /loading="lazy"/, 'sans lazy, 300 vignettes se chargeraient d un coup');
    match(g, /decoding="async"/, 'le decodage ne doit pas bloquer l affichage');
  });

  await test('au-dela du pli, les vignettes n ont PAS de src', () => {
    // La galerie repliee est un simple max-height : sans cette precaution, le
    // navigateur telechargeait les photos masquees. Mesure avant correction :
    // 130 images chargees sur une galerie que personne n avait ouverte.
    const photos = Array.from({ length: 40 }, (_, i) => ({ url: `/r2/p${i}.jpg`, caption: '' }));
    const g = renderGallery(photos);
    const avecSrc = (g.match(/<img src=/g) || []).length;
    eq(avecSrc, 12, 'seules les 12 premieres vignettes doivent porter un src');
    const total = (g.match(/data-gallery-index=/g) || []).length;
    eq(total, 40, 'toutes les photos restent dans le DOM (lightbox + referencement)');
  });

  await test('les vignettes differees gardent data-src pour le clic', () => {
    const photos = Array.from({ length: 20 }, (_, i) => ({ url: `/r2/p${i}.jpg`, caption: '' }));
    const g = renderGallery(photos);
    // Sans data-src, le bouton "Afficher les N photos" n aurait aucune URL a
    // poser et la galerie resterait vide une fois depliee.
    eq((g.match(/data-src="/g) || []).length, 20);
  });

  await test('une petite galerie charge tout de suite', () => {
    // En dessous du seuil de repli il n y a pas de bouton : differer laisserait
    // des cases vides que rien ne viendrait remplir.
    const g = renderGallery([{ url: '/r2/a.jpg', caption: '' }, { url: '/r2/b.jpg', caption: '' }]);
    eq((g.match(/<img src=/g) || []).length, 2);
  });

  await test('les images du CORPS servent la variante 1200 px', () => {
    // Une image inline s affiche en pleine largeur de colonne : la vignette de
    // 600 px serait floue, l original de 2000 px inutilement lourd.
    const r = renderVoyageContent('<img src="/r2/photos/2026/1/a.jpg">', []);
    match(r, /src="\/r2\/photos\/2026\/1\/a\.jpg\.w1200\.webp"/);
    match(r, /data-full="\/r2\/photos\/2026\/1\/a\.jpg"/, 'l original doit rester joignable');
  });

  await test('une figure de l editeur sert aussi la variante 1200 px', () => {
    const r = renderVoyageContent(
      '<figure class="img-full"><img src="/r2/photos/2026/1/b.jpg" alt="x"></figure>', []);
    match(r, /src="\/r2\/photos\/2026\/1\/b\.jpg\.w1200\.webp"/);
    match(r, /data-full="\/r2\/photos\/2026\/1\/b\.jpg"/);
  });

  await test('une grille multi-images utilise la vignette 600', () => {
    // 2 a 3 images par ligne : ~350 px chacune a l ecran.
    const r = renderVoyageContent('<p><img src="/r2/1.jpg"><img src="/r2/2.jpg"></p>', []);
    match(r, /src="\/r2\/1\.jpg\.w600\.webp"/);
    match(r, /data-full="\/r2\/1\.jpg"/);
  });

  await test('wideUrl laisse les images externes intactes', () => {
    const ext = 'https://storage.canalblog.com/76/90/1250329/133189461_o.jpg';
    eq(wideUrl(ext), ext);
    eq(wideUrl('/r2/a.jpg.w1200.webp'), '/r2/a.jpg.w1200.webp', 'pas de double suffixe');
    eq(wideUrl('/r2/a.jpg.w600.webp'), '/r2/a.jpg.w600.webp', 'une derivee n est pas re-derivee');
    eq(wideUrl(''), '');
  });

  await test('les deux tailles ne se marchent pas dessus', () => {
    eq(thumbUrl('/r2/x.jpg'), '/r2/x.jpg.w600.webp');
    eq(wideUrl('/r2/x.jpg'), '/r2/x.jpg.w1200.webp');
  });

  endPhase();

  // ─────────────────────────────────────────────────────────────────────────
  phase('Rendu › Integrite du contenu (non-regression)');
  // Le nettoyage des alts touche le rendu de TOUS les articles. Ces tests
  // verifient qu on n a rien casse d autre au passage.

  await test('le texte de l article est preserve intact', () => {
    const r = renderVoyageContent('<p>Texte <b>gras</b> et <i>italique</i>.</p>', []);
    match(r, /Texte <b>gras<\/b> et <i>italique<\/i>\./);
  });

  await test('aucune image n est perdue', () => {
    const content = '<figure class="img-full"><img src="/r2/b.webp" alt="a"></figure>'
      + '<p><img src="/r2/x1.webp" alt="b"><img src="/r2/x2.webp" alt="c"></p>'
      + '<img src="/r2/bare.webp" alt="d">';
    const r = renderVoyageContent(content, []);
    count(r, /<img/g, 4, 'les 4 images doivent survivre au nettoyage des alts');
  });

  await test('chaque image reste cliquable (attribut lightbox present)', () => {
    const content = '<figure class="img-full"><img src="/r2/b.webp" alt="a"></figure>'
      + '<p><img src="/r2/x1.webp" alt="b"><img src="/r2/x2.webp" alt="c"></p>'
      + '<img src="/r2/bare.webp" alt="d">';
    const r = renderVoyageContent(content, []);
    count(r, /data-photo-(index|url)=/g, 4, 'une image sans attribut lightbox n ouvre plus le plein ecran');
  });

  await test('les indices de lightbox correspondent a la galerie dedoublonnee', () => {
    // Le piege du dedoublonnage : data-photo-index est une position dans la
    // liste. Si le corps et la galerie n utilisent pas la MEME liste, cliquer
    // une photo en ouvre une autre.
    const photos = dedupePhotos([
      { url: '/r2/a.webp', caption: 'dup' },
      { url: '/r2/b.webp', caption: 'dup' }, // fusionnee
      { url: '/r2/c.webp', caption: '' },
    ]);
    const r = renderVoyageContent('<img src="/r2/c.webp" alt="x">', photos);
    const g = renderGallery(photos);
    match(r, /data-photo-index="1"/, '/r2/c.webp est en position 1 apres dedoublonnage');
    count(g, /data-gallery-index=/g, 2, 'la galerie doit avoir exactement 2 vignettes');
    match(g, /data-gallery-index="1"[^>]*>/, 'les indices de galerie doivent rester contigus');
  });

  await test('une paragraphe multi-images devient une grille', () => {
    const r = renderVoyageContent('<p><img src="/r2/1.webp"><img src="/r2/2.webp"></p>', []);
    match(r, /img-row img-row-2/, 'deux images cote a cote = grille de 2');
  });

  await test('un figcaption ECRIT A LA MAIN est conserve', () => {
    // Nuance importante : on supprime les legendes DERIVEES d un alt, pas
    // celles qu un humain a redigees dans le HTML stocke.
    const r = renderVoyageContent(
      '<figure><img src="/r2/a.webp" alt="word image 1"><figcaption>Le Wadi Rum au couchant</figcaption></figure>', []);
    match(r, /Le Wadi Rum au couchant/, 'une legende authentique ne doit pas etre effacee');
    noMatch(r, /word image/i, 'mais l alt parasite doit partir');
  });

  await test('les images restent en chargement differe', () => {
    const r = renderVoyageContent('<img src="/r2/bare.webp" alt="x">', []);
    match(r, /loading="lazy"/, 'loading=lazy protege le forfait data en voyage');
  });

  endPhase();

  // ─────────────────────────────────────────────────────────────────────────
  phase('Rendu › Securite (anti-XSS)');
  // Le contenu d article est assaini AVANT le rendu serveur. Cette protection
  // est anterieure au correctif des doublons et ne doit jamais regresser.

  await test('les balises <script> sont supprimees', () => {
    const r = renderVoyageContent('<p>ok</p><script>alert(1)</script>', []);
    noMatch(r, /<script/i, 'un script injecte s executerait chez chaque visiteur');
  });

  await test('les gestionnaires onerror/onclick sont supprimes', () => {
    const r = renderVoyageContent('<img src="/r2/a.webp" onerror="alert(1)" alt="x">', []);
    noMatch(r, /onerror/i);
  });

  await test('les URL javascript: sont neutralisees', () => {
    const r = renderVoyageContent('<a href="javascript:alert(1)">clic</a>', []);
    noMatch(r, /javascript:/i);
  });

  await test('les <iframe> sont supprimees', () => {
    const r = renderVoyageContent('<iframe src="https://evil.example"></iframe>', []);
    noMatch(r, /<iframe/i);
  });

  endPhase();

  // ─────────────────────────────────────────────────────────────────────────
  phase('Rendu › Robustesse (contenus limites)');
  // Ces cas viennent du vrai corpus : imports CanalBlog, collages Word, et
  // articles rediges a la main. Un plantage ici = page blanche pour le lecteur.

  await test('contenu vide ou absent ne plante pas', () => {
    eq(renderVoyageContent('', []), '');
    eq(renderVoyageContent(null, []), '');
    eq(renderVoyageContent(undefined, null), '');
  });

  await test('galerie vide ne rend rien', () => {
    eq(renderGallery([]), '');
    eq(renderGallery(null), '');
  });

  await test('une balise <figure> non fermee ne corrompt pas la suite', () => {
    // Cas reel d authoring : un <figure> orphelin faisait re-encapsuler chaque
    // image suivante dans un figure imbrique, produisant du HTML invalide.
    const r = renderVoyageContent('<figure><img src="/r2/a.webp"><p>suite</p><img src="/r2/b.webp">', []);
    ok(typeof r === 'string' && r.length > 0, 'doit produire du HTML sans lever');
    match(r, /suite/, 'le texte suivant le tag orphelin ne doit pas disparaitre');
  });

  await test('le Markdown legacy est toujours rendu', () => {
    // Les vieux imports sont stockes en Markdown, pas en HTML.
    const r = renderVoyageContent('# Titre\n\nUn **paragraphe**.\n', []);
    match(r, /<h1>Titre<\/h1>/);
    match(r, /<strong>paragraphe<\/strong>/);
  });

  await test('une image Markdown est rendue sans legende parasite', () => {
    const r = renderVoyageContent('![word image 36](/r2/a.webp)', []);
    match(r, /<img/);
    noMatch(r, /word image/i);
  });

  await test('une URL contenant des parentheses n est pas tronquee', () => {
    // Le proxy d images CanalBlog produit des URL avec "filters:no_upscale()".
    const r = renderVoyageContent('![x](https://ex.com/filters:no_upscale()/img.jpg)', []);
    match(r, /filters:no_upscale\(\)\/img\.jpg/, 'URL tronquee = image cassee');
  });

  await test('un tres gros article reste traitable', () => {
    // Une galerie de voyage depasse couramment 100 photos.
    const big = Array.from({ length: 300 }, (_, i) => `<p><img src="/r2/p${i}.webp" alt="word image ${i}"></p>`).join('');
    const t0 = Date.now();
    const r = renderVoyageContent(big, []);
    const ms = Date.now() - t0;
    count(r, /<img/g, 300, 'aucune image perdue sur un gros volume');
    noMatch(r, /word image/i);
    ok(ms < 5000, `rendu trop lent (${ms}ms) : risque de timeout worker`);
  });

  await test('extractInlineImages retrouve toutes les images du corps', () => {
    const imgs = extractInlineImages('<img src="/r2/a.webp" alt="un"><img src="/r2/b.webp" alt="deux">');
    eq(imgs.map(i => i.url), ['/r2/a.webp', '/r2/b.webp']);
  });

  await test('toHtml et stripMdText restent coherents', () => {
    match(toHtml('<p>deja html</p>'), /deja html/);
    eq(stripMdText('**gras** et *italique*'), 'gras et italique');
    eq(stripMdText(''), '');
  });

  await test('renderWritingDays ignore les entrees incompletes', () => {
    const html = renderWritingDays([
      { date: '2026-08-01', summary: 'Arrivee a Amman' },
      { date: '2026-08-02' },              // pas de resume
      { summary: 'sans date' },
      null,
    ]);
    match(html, /Arrivee a Amman/);
    noMatch(html, /sans date/);
    eq(renderWritingDays([]), '');
    eq(renderWritingDays(null), '');
  });

  endPhase();
}
