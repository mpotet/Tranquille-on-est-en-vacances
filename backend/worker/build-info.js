/**
 * worker/build-info.js - Informations de version du site.
 *
 * GENERE AUTOMATIQUEMENT par scripts/gen-build-info.js a chaque deploiement.
 * Ne pas editer a la main : le fichier est reecrit et toute modification serait
 * perdue au prochain `npm run deploy`.
 *
 * Pourquoi un fichier plutot qu une lecture de git a l execution : le worker
 * tourne chez Cloudflare, sans depot git ni acces au systeme de fichiers. La
 * seule facon de connaitre le commit deploye est de figer l information au
 * moment du build.
 */
export const BUILD_INFO = {
  "version": "1.0.0+local",
  "build": "250",
  "commit": "fdf6293",
  "commitDate": "2026-09-07T15:20:03+02:00",
  "builtAt": "2026-09-07T13:25:24.819Z",
  "branch": "main"
};
