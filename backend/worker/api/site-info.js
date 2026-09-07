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
  // Une seule requete pour les trois chiffres : le pied de page est rendu sur
  // chaque page du site, autant limiter le cout.
  const row = await env.DB.prepare(`
    SELECT
      (SELECT COUNT(*) FROM articles WHERE status = 'published') AS nb_articles,
      (SELECT COUNT(*) FROM photos)                              AS nb_photos,
      (SELECT title      FROM articles WHERE status = 'published' ORDER BY updated_at DESC LIMIT 1) AS dernier_titre,
      (SELECT slug       FROM articles WHERE status = 'published' ORDER BY updated_at DESC LIMIT 1) AS dernier_slug,
      (SELECT updated_at FROM articles WHERE status = 'published' ORDER BY updated_at DESC LIMIT 1) AS dernier_maj
  `).first();

  const rep = json({
    version:    BUILD_INFO.version,
    commit:     BUILD_INFO.commit,
    commitDate: BUILD_INFO.commitDate,
    // builtAt est l instant du build, donc de la mise en ligne : c est la date
    // de deploiement du point de vue du visiteur.
    deployedAt: BUILD_INFO.builtAt,
    branch:     BUILD_INFO.branch,
    lastArticle: row?.dernier_slug
      ? { title: row.dernier_titre, slug: row.dernier_slug, updatedAt: row.dernier_maj }
      : null,
    articles: row?.nb_articles ?? 0,
    photos:   row?.nb_photos ?? 0,
  });

  // Cache court : l information change rarement (un deploiement, une edition),
  // et le pied de page est charge sur chaque page vue.
  rep.headers.set('Cache-Control', 'public, max-age=300');
  return rep;
}
