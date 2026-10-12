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
  "version": "1.3.0+local",
  "build": "268",
  "commit": "c5f46d8",
  "commitDate": "2026-10-12T23:23:48+02:00",
  "builtAt": "2026-10-12T21:24:24.072Z",
  "branch": "main"
};
