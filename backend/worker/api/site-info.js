/**
 * api/site-info.js - Informations techniques affichees en pied de page.
 *
 * GET /api/site-info  (public)
 *   { version, commit, commitDate, deployedAt, branch,
 *     lastArticle: { title, slug, updatedAt }, articles, photos }
 *
 * Alimente l infobulle du "i" du pied de page : quelle version est en ligne,
 * quand elle a ete deployee, et quand un article a ete modifie pour la derniere
 * fois.
 *
 * Volontairement public : ce sont des metadonnees de publication, pas des
 * secrets. Rien n est expose sur l infrastructure, les identifiants ou les
 * brouillons - seuls les articles publies sont comptes.
 */
import { json } from '../utils.js';
import { BUILD_INFO } from '../build-info.js';

export async function getSiteInfo(env) {
  // Une seule requete pour tous les chiffres : le pied de page est rendu sur
  // chaque page du site, autant limiter le cout.
  //
  // Le comptage des photos ne peut PAS se limiter a la table `photos`. Depuis
  // les imports Word, la quasi-totalite des images vit dans le HTML des
  // articles (<img> inline) et non dans cette table : 39 lignes en base pour
  // ~3800 images reellement affichees. Compter la table seule affichait donc un
  // chiffre absurde. Les <img> du contenu sont denombres en comptant les
  // occurrences de la chaine "<img" - la longueur du texte moins celle du meme
  // texte prive du motif, divisee par la longueur du motif.
  //
  // Les articles sans photo (lexique, prix, vocabulaire) sont exclus du compte
  // des voyages : ce sont des pages d information, pas des recits de voyage.
  const row = await env.DB.prepare(`
    SELECT
      (SELECT COUNT(*) FROM articles
        WHERE status = 'published' AND INSTR(content, '<img') > 0)      AS nb_voyages,
      (SELECT COUNT(*) FROM articles WHERE status = 'published')        AS nb_pages,
      (SELECT COUNT(*) FROM photos)                                     AS nb_photos_table,
      (SELECT COALESCE(SUM((LENGTH(content) - LENGTH(REPLACE(content, '<img', ''))) / 4), 0)
         FROM articles WHERE status = 'published')                      AS nb_photos_inline,
      (SELECT title      FROM articles WHERE status = 'published' ORDER BY updated_at DESC LIMIT 1) AS dernier_titre,
      (SELECT slug       FROM articles WHERE status = 'published' ORDER BY updated_at DESC LIMIT 1) AS dernier_slug,
      (SELECT updated_at FROM articles WHERE status = 'published' ORDER BY updated_at DESC LIMIT 1) AS dernier_maj
  `).first();

  // Total affiche = images du corps + photos de la table qui ne sont pas deja
  // dans un corps d article. C est une approximation : les doublons entre les
  // deux sources ont ete retires (voir scripts/dedupe-article-images.js), donc
  // la somme reflete bien ce qu un lecteur voit.
  const nbPhotos = (row?.nb_photos_inline ?? 0) + (row?.nb_photos_table ?? 0);

  const rep = json({
    version:    BUILD_INFO.version,
    build:      BUILD_INFO.build,
    commit:     BUILD_INFO.commit,
    commitDate: BUILD_INFO.commitDate,
    // builtAt est l instant du build, donc de la mise en ligne : c est la date
    // de deploiement du point de vue du visiteur.
    deployedAt: BUILD_INFO.builtAt,
    branch:     BUILD_INFO.branch,
    lastArticle: row?.dernier_slug
      ? { title: row.dernier_titre, slug: row.dernier_slug, updatedAt: row.dernier_maj }
      : null,
    articles: row?.nb_voyages ?? 0,
    pages:    row?.nb_pages ?? 0,
    photos:   nbPhotos,
  });

  // Cache court : l information change rarement (un deploiement, une edition),
  // et le pied de page est charge sur chaque page vue.
  rep.headers.set('Cache-Control', 'public, max-age=300');
  return rep;
}
