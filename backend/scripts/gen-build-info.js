/**
 * scripts/gen-build-info.js - Fige les informations de version avant deploiement.
 *
 * Ecrit worker/build-info.js a partir de l etat git courant. Appele par
 * scripts/deploy.js juste avant `wrangler deploy`, pour que la page publique
 * puisse afficher quel commit est reellement en ligne.
 *
 * Le worker tourne chez Cloudflare, sans depot git : l information ne peut pas
 * etre lue a l execution, elle doit etre figee ici.
 *
 * Le numero de version est derive du nombre de commits (0.<total>.<court>), ce
 * qui donne un identifiant qui croit a chaque livraison sans avoir a maintenir
 * un numero a la main.
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const backend = dirname(dirname(fileURLToPath(import.meta.url)));
const racine = dirname(backend);

function git(args, secours = '') {
  const r = spawnSync('git', args, {
    cwd: backend, shell: true, encoding: 'utf8',
    env: { ...process.env, NODE_NO_WARNINGS: '1' },
  });
  return r.status === 0 ? (r.stdout || '').trim() : secours;
}

const commit = git(['rev-parse', '--short', 'HEAD'], 'inconnu');
const commitDate = git(['log', '-1', '--format=%cI'], '') || null;
const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], 'inconnu');
const nb = git(['rev-list', '--count', 'HEAD'], '0');
// Un depot avec des modifications non commitees produit un build qui ne
// correspond a aucun commit : on le signale plutot que d afficher une version
// faussement precise.
const sale = git(['status', '--porcelain'], '') !== '';

// La version du site est celle declaree dans package.json a la racine - la
// seule que le projet maintienne reellement. Un numero fabrique a partir du
// nombre de commits ne correspondait a rien pour qui regarde le site.
let versionPkg = '0.0.0';
try {
  versionPkg = JSON.parse(readFileSync(join(racine, 'package.json'), 'utf8')).version || versionPkg;
} catch { /* package.json illisible : on garde la valeur par defaut */ }

const version = `${versionPkg}${sale ? '+local' : ''}`;
// Le rang du commit reste utile pour distinguer deux livraisons portant la
// meme version de package.json ; il est expose a part, pas mele au numero.
const build = nb;

const contenu = `/**
 * worker/build-info.js - Informations de version du site.
 *
 * GENERE AUTOMATIQUEMENT par scripts/gen-build-info.js a chaque deploiement.
 * Ne pas editer a la main : le fichier est reecrit et toute modification serait
 * perdue au prochain \`npm run deploy\`.
 *
 * Pourquoi un fichier plutot qu une lecture de git a l execution : le worker
 * tourne chez Cloudflare, sans depot git ni acces au systeme de fichiers. La
 * seule facon de connaitre le commit deploye est de figer l information au
 * moment du build.
 */
export const BUILD_INFO = ${JSON.stringify({
  version,
  build,
  commit,
  commitDate,
  builtAt: new Date().toISOString(),
  branch,
}, null, 2)};
`;

writeFileSync(join(backend, 'worker', 'build-info.js'), contenu, 'utf8');
console.log(`  version ${version} (build ${build}, ${commit})${sale ? '  — depot modifie non commite' : ''}`);
