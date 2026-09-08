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
  "version": "1.1.0",
  "build": "259",
  "commit": "c9213be",
  "commitDate": "2026-09-08T13:25:18+02:00",
  "builtAt": "2026-09-08T11:26:05.392Z",
  "branch": "main"
};
