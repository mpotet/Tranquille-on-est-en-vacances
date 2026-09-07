/**
 * TNR - Smoke test HTTP (le worker demarre vraiment et sert les pages)
 *
 * Les tests 01/02 verifient des fonctions isolees. Celui-ci couvre le risque
 * qui compte pendant un voyage : "la page est blanche". Il demarre un vrai
 * worker, insere un article de test, et charge les pages publiques.
 *
 * ISOLATION DE LA PRODUCTION - garanties explicites :
 *   - `wrangler dev --local`   : tout s execute en simulation locale
 *   - `--persist-to .wrangler/state-tnr` : etat DEDIE aux tests, distinct de
 *     celui de `npm run dev`, donc les donnees de test ne polluent meme pas la
 *     base de developpement
 *   - aucun `--remote`, aucun `--env production`
 *   - port dedie (8799) pour ne pas entrer en conflit avec un dev en cours
 * La D1 et le R2 touches ici sont des fichiers SQLite locaux jetables. Aucune
 * requete ne part vers Cloudflare, aucun email n est envoye.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { rmSync, writeFileSync } from 'node:fs';
import { phase, test, skip, endPhase, ok, eq, match, noMatch, grey } from './runner.js';

const here = dirname(fileURLToPath(import.meta.url));
const backend = join(here, '..');
// Chemin RELATIF volontairement : le projet vit sous "Projets IT", et un chemin
// absolu contenant une espace est coupe en deux par `shell: true` sous Windows
// ("Unknown argument: IT\SaaS\..."). Toutes les commandes tournent avec
// cwd=backend, donc le relatif est sans ambiguite et sans espace.
const STATE_DIR = '.wrangler/state-tnr';
const STATE_DIR_ABS = join(backend, '.wrangler', 'state-tnr');
const PORT = 8799;
const BASE = `http://127.0.0.1:${PORT}`;

let server = null;

/**
 * Execute du SQL sur la base LOCALE de test.
 *
 * Passe par un fichier .sql temporaire plutot que par --command : avec
 * `shell: true` sous Windows, une requete contenant des espaces est eclatee en
 * arguments ("Unknown arguments: INTO, articles, ..."). Un fichier evite tout
 * probleme de citation, quelle que soit la plateforme.
 */
function d1(sql) {
  const tmpAbs = join(backend, '.wrangler', 'tnr-seed.sql');
  writeFileSync(tmpAbs, sql, 'utf8');
  try {
    return spawnSync('npx', ['wrangler', 'd1', 'execute', 'tranquille-vacances-db',
      '--local', '--persist-to', STATE_DIR, '--file', '.wrangler/tnr-seed.sql']);
  } finally {
    try { rmSync(tmpAbs, { force: true }); } catch { /* deja parti */ }
  }
}

import { spawnSync as _spawnSync } from 'node:child_process';
// NODE_NO_WARNINGS : `shell: true` (requis pour npx sous Windows) declenche un
// DeprecationWarning a chaque appel, qui polluerait la sortie des tests. Les
// arguments sont tous ecrits en dur ici.
const NO_WARN = { ...process.env, NODE_NO_WARNINGS: '1' };
function spawnSync(cmd, args) {
  return _spawnSync(cmd, args, { cwd: backend, shell: true, encoding: 'utf8', env: NO_WARN });
}

async function waitForServer(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(BASE + '/', { signal: AbortSignal.timeout(2000) });
      if (r.status > 0) return true;
    } catch { /* pas encore pret */ }
    await new Promise(r => setTimeout(r, 400));
  }
  return false;
}

export default async function run() {
  phase('Smoke HTTP › Demarrage du worker (100% local, prod intouchee)');

  // Etat de test repart de zero a chaque campagne : pas de residu d un run
  // precedent qui masquerait une regression.
  try { rmSync(STATE_DIR_ABS, { recursive: true, force: true }); } catch { /* absent */ }

  let started = false;
  await test('le schema se cree dans une base locale jetable', () => {
    const r = spawnSync('npx', ['wrangler', 'd1', 'execute', 'tranquille-vacances-db',
      '--local', '--persist-to', STATE_DIR, '--file=schema.sql']);
    ok(r.status === 0, `creation du schema echouee :\n${(r.stderr || r.stdout || '').slice(-1500)}`);
  });

  await test('le worker demarre et repond', async () => {
    server = spawn('npx', ['wrangler', 'dev', '--local', '--persist-to', STATE_DIR,
      '--port', String(PORT), '--ip', '127.0.0.1'], {
      cwd: backend, shell: true, stdio: ['ignore', 'pipe', 'pipe'], env: NO_WARN,
    });
    // Les sorties de wrangler sont capturees : en cas d echec, elles sont
    // affichees dans le message d erreur plutot que polluer le flux de test.
    let log = '';
    server.stdout.on('data', d => { log += d; });
    server.stderr.on('data', d => { log += d; });

    started = await waitForServer(60000);
    ok(started, `le worker n a pas repondu sur ${BASE} en 60s.\n${log.slice(-2000)}`);
  });

  if (!started) {
    skip('pages publiques', 'le worker n a pas demarre');
    endPhase();
    await stopServer();
    return;
  }

  // Un article de test avec exactement le defaut d origine : deux photos
  // portant la meme legende d import Word.
  await test('un article de test est insere en base locale', () => {
    // Le jeu de donnees reproduit le defaut d origine : tnr-a et tnr-b sont la
    // meme photo (meme legende d import Word), tnr-b etant la copie nee d un
    // couper-coller dans l editeur.
    const id = `(SELECT id FROM articles WHERE slug='jordanie-tnr')`;
    const r = d1(`
INSERT INTO articles (title, slug, content, status, start_date, short_description)
VALUES ('Jordanie TNR', 'jordanie-tnr',
  '<p>Recit de test.</p><figure class="img-full"><img src="/r2/tnr-a.webp" alt="word image 36"></figure>',
  'published', '2026-08-01', 'Un voyage de test');
INSERT INTO photos (article_id, r2_key, url, caption, sort_order) VALUES
  (${id}, 'tnr-a', '/r2/tnr-a.webp', 'word image 36', 0),
  (${id}, 'tnr-b', '/r2/tnr-b.webp', 'word image 36', 1),
  (${id}, 'tnr-c', '/r2/tnr-c.webp', '', 2);
`);
    ok(r.status === 0, `insertion du jeu de test echouee :\n${(r.stderr || r.stdout || '').slice(-1500)}`);
  });

  endPhase();
  phase('Smoke HTTP › Pages publiques');

  await test("l'accueil repond 200 et affiche le site", async () => {
    const r = await fetch(BASE + '/');
    eq(r.status, 200, "l'accueil doit repondre 200");
    const html = await r.text();
    match(html, /<\/html>/i, 'page tronquee = erreur de rendu serveur');
  });

  await test('la liste des voyages repond 200', async () => {
    const r = await fetch(BASE + '/voyages');
    eq(r.status, 200);
    match(await r.text(), /<\/html>/i);
  });

  await test("la page d'article repond 200 et est complete", async () => {
    const r = await fetch(BASE + '/voyage/jordanie-tnr');
    eq(r.status, 200, 'une page article en erreur = page blanche pour le lecteur');
    const html = await r.text();
    match(html, /Jordanie TNR/, "le titre de l'article doit apparaitre");
    match(html, /Recit de test\./, 'le corps doit etre rendu');
    match(html, /<\/html>/i, 'page tronquee = rendu interrompu en cours de route');
  });

  await test('AUCUN "word image" servi au lecteur', async () => {
    const html = await (await fetch(BASE + '/voyage/jordanie-tnr')).text();
    // Assertions separees : un echec doit dire OU la legende a fuite, pas
    // seulement qu elle est quelque part dans 120 Ko de HTML.
    noMatch(html, /alt="[^"]*word image/i, 'legende parasite dans un attribut alt');
    noMatch(html, /<figcaption[^>]*>[^<]*word image/i, 'legende parasite dans un figcaption');
    noMatch(html, /<p[^>]*>[^<]*word image/i, 'legende parasite sous une vignette de galerie');
    noMatch(html, /data-photo-caption="[^"]*word image/i, 'legende parasite dans un attribut lightbox');
    // C est ce cas precis qui a echappe au premier correctif : la liste
    // window.photos alimentant la visionneuse plein ecran transportait encore
    // les legendes, alors qu elles avaient disparu partout ailleurs.
    noMatch(html, /window\.photos\s*=\s*[^;]*word image/i,
      'legende parasite dans window.photos (elle reapparaitrait en plein ecran)');
    noMatch(html, /word image/i, 'legende parasite ailleurs dans la page servie');
  });

  await test('la photo re-collee n apparait pas deux fois dans la galerie', async () => {
    const html = await (await fetch(BASE + '/voyage/jordanie-tnr')).text();
    // 3 photos en base dont 2 doublons -> 2 vignettes attendues.
    const tiles = (html.match(/data-gallery-index=/g) || []).length;
    eq(tiles, 2, `la galerie doit contenir 2 vignettes (3 photos dont 1 doublon), obtenu ${tiles}`);
    ok(!html.includes('/r2/tnr-b.webp'), 'la copie re-uploadee ne doit pas etre affichee');
  });

  await test('la version imprimable repond', async () => {
    const r = await fetch(BASE + '/voyage/jordanie-tnr/print');
    ok([200, 404].includes(r.status), `statut inattendu ${r.status}`);
    if (r.status === 200) noMatch(await r.text(), /word image/i, 'meme regle a l impression');
  });

  await test('une page inexistante renvoie 404 proprement', async () => {
    const r = await fetch(BASE + '/voyage/ce-slug-n-existe-pas');
    eq(r.status, 404, 'un 500 ici masquerait une vraie erreur de rendu');
  });

  await test("l'admin est protege sans session", async () => {
    const r = await fetch(BASE + '/admin/dashboard', { redirect: 'manual' });
    ok([301, 302, 303, 307, 308, 401, 403].includes(r.status),
      `le tableau de bord doit exiger une authentification (statut ${r.status})`);
  });

  await test("l'API articles repond du JSON", async () => {
    const r = await fetch(BASE + '/api/articles');
    eq(r.status, 200);
    const body = await r.json();
    ok(body && typeof body === 'object', 'reponse JSON attendue');
  });

  await test("/api/site-info alimente l'infobulle du pied de page", async () => {
    const r = await fetch(BASE + '/api/site-info');
    eq(r.status, 200, 'sans cette route, le "i" du pied de page reste sur "Chargement…"');
    const d = await r.json();
    ok(typeof d.version === 'string' && d.version, 'version manquante');
    ok('deployedAt' in d, 'date de mise en ligne manquante');
    ok(typeof d.articles === 'number', 'nombre d articles manquant');
    ok(typeof d.photos === 'number', 'nombre de photos manquant');
    // La version affichee doit etre celle de package.json, pas un numero
    // fabrique : un "0.249.abc1234" ne veut rien dire pour un lecteur.
    match(d.version, /^\d+\.\d+\.\d+(\+local)?$/,
      `la version doit suivre package.json (obtenu ${JSON.stringify(d.version)})`);
    // Le compteur de photos doit inclure les <img> du corps des articles. Les
    // compter depuis la seule table `photos` affichait 39 au lieu de ~3800.
    const html = await (await fetch(BASE + '/voyage/jordanie-tnr')).text();
    const inline = (html.match(/data-gallery-index=/g) || []).length;
    ok(d.photos >= inline,
      `le compte de photos (${d.photos}) doit couvrir les images affichees (${inline} rien que sur l article de test)`);
    // L article de test est publie : il doit ressortir comme derniere modif.
    ok(d.lastArticle && d.lastArticle.slug === 'jordanie-tnr',
      `dernier article modifie attendu, obtenu ${JSON.stringify(d.lastArticle)}`);
  });

  await test('le pied de page expose la pastille "i"', async () => {
    const html = await (await fetch(BASE + '/')).text();
    match(html, /id="site-info"/, 'la pastille doit etre presente sur toutes les pages');
    match(html, /id="site-info-pop"/, 'le conteneur d infobulle doit exister');
    match(html, /\/api\/site-info/, 'le script de chargement doit etre injecte');
  });

  endPhase();
  await stopServer();
}

async function stopServer() {
  if (!server) return;
  process.stdout.write(grey('   (arret du worker de test)\n'));
  try {
    // Sur Windows, tuer le shell parent ne suffit pas : wrangler survit et
    // garde le port. taskkill /T descend l arbre de processus.
    if (process.platform === 'win32') {
      _spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { shell: true });
    } else {
      server.kill('SIGTERM');
    }
  } catch { /* deja mort */ }
  server = null;
  await new Promise(r => setTimeout(r, 500));
}

// Filet de securite : si la campagne s interrompt (Ctrl-C), on ne laisse pas un
// worker orphelin occuper le port.
process.on('exit', () => { if (server) { try { server.kill(); } catch {} } });
process.on('SIGINT', () => { stopServer().then(() => process.exit(130)); });
