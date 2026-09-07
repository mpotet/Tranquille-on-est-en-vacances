/**
 * scripts/dedupe-article-images.js
 *
 * Supprime, dans le HTML STOCKE des articles, les <img> qui pointent vers une
 * image deja presente plus haut dans le meme article - meme fichier, octet pour
 * octet, servi sous une URL differente.
 *
 * POURQUOI CE SCRIPT EXISTE
 * La migration 011 a nettoye la table `photos`, mais la galerie d un voyage est
 * construite a partir de la table ET des <img> inline du corps de l article
 * (voir worker/index.js). Sur "Jordanie", le meme document Word a ete importe 9
 * fois : le corps contient 308 <img>, tous avec des UUID R2 distincts, dont 37
 * doublons visuels. Le dedoublonnage au rendu (dedupePhotos) compare l URL et la
 * legende - il ne peut rien voir ici, puisque les URL different et que les
 * legendes sont desormais vides.
 *
 * Seul le CONTENU du fichier fait foi. Le hacher a chaque affichage couterait
 * 344 telechargements par page : c est donc fait une fois, hors ligne, ici.
 *
 * SANS DANGER PAR DEFAUT : le script tourne en simulation et n ecrit rien tant
 * que --apply n est pas passe. Avec --apply, le contenu d origine de chaque
 * article modifie est sauvegarde dans la table articles_backup_dedupe avant
 * ecriture, et scripts/dedupe-article-images-rollback.sql annule le tout.
 *
 * Usage :
 *   node scripts/dedupe-article-images.js               # simulation
 *   node scripts/dedupe-article-images.js --apply       # ecriture
 *   node scripts/dedupe-article-images.js --article 86  # cibler un article
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const backend = dirname(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
// Accepte "--article 86" et "--article=86". Une valeur absente ou non numerique
// est refusee tout de suite : sans ce garde-fou, Number(undefined) partait dans
// le SQL et produisait un "no such column: undefined".
const seulArticle = (() => {
  const eq = args.find(a => a.startsWith('--article='));
  const val = eq ? eq.slice('--article='.length)
    : (args.includes('--article') ? args[args.indexOf('--article') + 1] : null);
  if (val == null) return null;
  if (!/^\d+$/.test(String(val))) {
    console.error(`--article attend un identifiant numerique (recu : ${JSON.stringify(val)})`);
    process.exit(2);
  }
  return Number(val);
})();
const BASE = process.env.SITE_BASE || 'https://tranquille-vacances.esti-archi.workers.dev';
const DB = 'tranquille-vacances-db';

const tty = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (n) => (s) => (tty ? `\x1b[${n}m${s}\x1b[0m` : String(s));
const green = c('32'), red = c('31'), yellow = c('33'), blue = c('36'), grey = c('90'), bold = c('1');

/** Extrait le tableau JSON de resultats de la sortie de wrangler. */
function parseD1(sortie) {
  // wrangler prefixe sa sortie de lignes de progression : on repart du DERNIER
  // "[\n  {" (debut du tableau de resultats), pas du premier "[" rencontre.
  const i = sortie.lastIndexOf('[\n  {');
  if (i < 0) throw new Error('Reponse D1 illisible :\n' + sortie.slice(-1500));
  const parsed = JSON.parse(sortie.slice(i));
  return (Array.isArray(parsed) ? parsed : [parsed]).flatMap(x => x.results || []);
}

/**
 * LECTURE : via --command, seul mode qui renvoie reellement les lignes.
 * Avec --file, wrangler ne retourne que des statistiques d execution
 * ("Total queries executed"), jamais les donnees - piege verifie ici.
 * A reserver aux requetes courtes, sans contenu d article.
 */
function d1Read(sql) {
  const r = spawnSync('npx', ['wrangler', 'd1', 'execute', DB, '--remote', '--json', '--command', `"${sql.replace(/"/g, '\\"')}"`], {
    cwd: backend, shell: true, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024,
    env: { ...process.env, NODE_NO_WARNINGS: '1' },
  });
  return parseD1((r.stdout || '') + (r.stderr || ''));
}

/**
 * ECRITURE : via un fichier .sql. Le contenu d un article fait 200 Ko et
 * contient guillemets et retours a la ligne, ce qu une ligne de commande ne
 * peut pas transporter de maniere fiable sous Windows.
 */
function d1Write(sql) {
  const tmp = join(backend, '.wrangler', 'dedupe-tmp.sql');
  writeFileSync(tmp, sql, 'utf8');
  try {
    const r = spawnSync('npx', ['wrangler', 'd1', 'execute', DB, '--remote', '--json',
      '--file', '.wrangler/dedupe-tmp.sql'], {
      cwd: backend, shell: true, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024,
      env: { ...process.env, NODE_NO_WARNINGS: '1' },
    });
    const sortie = (r.stdout || '') + (r.stderr || '');
    if (!/"success":\s*true/.test(sortie)) {
      throw new Error('Ecriture D1 echouee :\n' + sortie.slice(-1500));
    }
    return sortie;
  } finally {
    try { rmSync(tmp, { force: true }); } catch { /* deja parti */ }
  }
}

const sqlStr = (s) => "'" + String(s).replace(/'/g, "''") + "'";

console.log(`\n${bold(blue('Dedoublonnage des images dans le HTML des articles'))}`);
console.log(grey(`  mode : ${APPLY ? 'ECRITURE (--apply)' : 'simulation (aucune ecriture)'}`));
console.log(grey(`  site : ${BASE}\n`));

// ── 1. Articles a traiter ───────────────────────────────────────────────────
const where = seulArticle ? `WHERE id = ${seulArticle}` : '';
const articles = d1Read(`SELECT id, slug, title, LENGTH(content) AS taille FROM articles ${where} ORDER BY id`);
console.log(`${articles.length} article(s) a examiner\n`);

// ── 2. Hash de chaque URL rencontree (mis en cache entre articles) ──────────
const hashCache = new Map();
async function hashOf(url) {
  if (hashCache.has(url)) return hashCache.get(url);
  let h = null;
  try {
    const r = await fetch(BASE + url);
    if (r.ok) h = createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex');
  } catch { /* reseau : traite comme inconnu */ }
  hashCache.set(url, h);
  return h;
}

let totalSupprimes = 0;
const modifs = [];

/**
 * Lit un article via l API publique plutot que par SQL.
 *
 * Un contenu fait jusqu a 220 Ko de HTML : le faire transiter par la ligne de
 * commande de wrangler est impossible (et le lire par tranches SUBSTR casse des
 * qu un morceau contient des caracteres que le shell interprete). L API renvoie
 * le meme enregistrement, contenu ET photos, en une requete HTTP fiable.
 */
async function lireArticle(id) {
  const r = await fetch(`${BASE}/api/articles/${id}`);
  if (!r.ok) return null;   // article archive / non expose : ignore, pas fatal
  return r.json();
}

for (const a of articles) {
  const art = await lireArticle(a.id);
  if (!art) {
    // Un article non publie n est pas servi par l API. Il n a donc aucune
    // galerie visible a nettoyer : on le signale et on continue, plutot que
    // d interrompre le traitement des articles suivants.
    console.log(`${grey('·')} ${String(a.id).padStart(3)} ${String(a.slug).padEnd(28)} ${grey('non expose par l API — ignore')}`);
    continue;
  }
  const content = art.content || '';
  const tags = content.match(/<img\b[^>]*>/gi) || [];
  if (tags.length < 2) {
    console.log(`${grey('·')} ${String(a.id).padStart(3)} ${a.slug.padEnd(28)} ${grey(`${tags.length} img — rien a faire`)}`);
    continue;
  }

  // Photos de la table pour cet article. La galerie affichee = ces lignes PLUS
  // les <img> du corps absents de la table (voir worker/index.js). Sur les
  // imports Word, les deux jeux contiennent les MEMES images sous des URL
  // differentes (/r2/photos/... cote table, /r2/imported/... cote corps) :
  // c est la seule forme de doublon qui subsiste apres la migration 011, et
  // elle est invisible pour un dedoublonnage limite au corps.
  const enBase = (art.photos || []).map(p => ({ id: p.id, url: p.url }));

  // Hash de tout ce qui est affichable, en parallele limite.
  const urls = tags.map(t => (t.match(/\bsrc\s*=\s*["']([^"']+)["']/i) || [])[1] || '');
  const uniques = [...new Set([...urls, ...enBase.map(p => p.url)].filter(u => u && u.startsWith('/r2/')))];
  const queue = [...uniques];
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (queue.length) await hashOf(queue.pop());
  }));

  // Le CORPS fait autorite : c est le texte redige, et ses <img> sont a leur
  // place dans le recit. On retire donc les lignes `photos` dont l image est
  // deja presente dans le corps, plutot que de modifier le HTML.
  const hashCorps = new Set(urls.map(u => hashCache.get(u)).filter(Boolean));
  const photosRedondantes = enBase.filter(p => {
    const h = hashCache.get(p.url);
    return h && hashCorps.has(h);
  });

  // On garde la PREMIERE occurrence de chaque contenu, on retire les suivantes.
  // Les balises a retirer sont collectees telles quelles : l ecriture se fera
  // par REPLACE cible (voir plus bas), et non en renvoyant le contenu entier -
  // un UPDATE portant 250 Ko de HTML est refuse par D1 (SQLITE_TOOBIG).
  const vus = new Set();
  const tagsARetirer = [];
  let supprimes = 0;
  let i = -1;
  const nouveau = content.replace(/<img\b[^>]*>/gi, (tag) => {
    i++;
    const u = urls[i];
    const h = u ? hashCache.get(u) : null;
    if (!h) return tag;              // hash inconnu : on ne touche a rien
    if (vus.has(h)) { supprimes++; tagsARetirer.push(tag); return ''; }
    vus.add(h);
    return tag;
  });

  const nPhotos = photosRedondantes.length;
  const total = supprimes + nPhotos;
  const details = [
    supprimes ? `${supprimes} <img> en double dans le corps` : null,
    nPhotos ? `${nPhotos} ligne(s) photos deja dans le corps` : null,
  ].filter(Boolean).join(', ');

  const etat = total
    ? yellow(`${tags.length} img + ${enBase.length} en base → ${total} doublon(s) : ${details}`)
    : green(`${tags.length} img + ${enBase.length} en base — propre`);
  console.log(`${total ? yellow('~') : green('✓')} ${String(a.id).padStart(3)} ${a.slug.padEnd(28)} ${etat}`);

  if (total) {
    totalSupprimes += total;
    modifs.push({
      id: a.id, slug: a.slug, supprimes, nPhotos,
      avant: content, apres: nouveau, tagsARetirer,
      photoIds: photosRedondantes.map(p => p.id),
      contenuChange: supprimes > 0,
    });
  }
}

// ── 3. Bilan / ecriture ─────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
console.log(`images en double retirees : ${bold(String(totalSupprimes))} sur ${modifs.length} article(s)`);

if (!modifs.length) { console.log(green('\nRien a modifier.\n')); process.exit(0); }

if (!APPLY) {
  console.log(yellow('\nSIMULATION : aucune ecriture effectuee.'));
  console.log(grey('Relance avec --apply pour appliquer.\n'));
  process.exit(0);
}

// Sauvegarde AVANT ecriture, pour pouvoir revenir en arriere.
console.log(grey('\nsauvegarde du contenu d origine…'));
d1Write(`CREATE TABLE IF NOT EXISTS articles_backup_dedupe (
  id INTEGER PRIMARY KEY, slug TEXT NOT NULL, content TEXT NOT NULL,
  sauve_le DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);`);

// Les lignes `photos` retirees sont archivees dans la meme table que la
// migration 011, avec was_deleted=1 : le rollback 011 les restaure donc aussi.
d1Write(`CREATE TABLE IF NOT EXISTS photos_backup_011 (
  id INTEGER PRIMARY KEY, article_id INTEGER NOT NULL, r2_key TEXT NOT NULL,
  url TEXT NOT NULL, caption TEXT NOT NULL, sort_order INTEGER NOT NULL,
  was_deleted INTEGER NOT NULL DEFAULT 0);`);

for (const m of modifs) {
  const parts = [];

  // Sauvegarde puis modification dans le MEME fichier .sql, donc la meme
  // transaction : impossible d ecraser une donnee sans l avoir archivee.
  // INSERT OR IGNORE : une seconde execution ne doit pas remplacer la
  // sauvegarde d origine par une version deja nettoyee.
  if (m.contenuChange) {
    // Sauvegarde par copie COTE SERVEUR : le contenu ne transite pas par le
    // fichier SQL, qui serait alors trop gros.
    parts.push(
      `INSERT OR IGNORE INTO articles_backup_dedupe (id, slug, content)`,
      `SELECT id, slug, content FROM articles WHERE id = ${m.id};`);
    // Le contenu nettoye est reecrit PAR TRANCHES : un UPDATE portant 250 Ko de
    // HTML est refuse par D1 (SQLITE_TOOBIG), et un REPLACE cible ne convient
    // pas ici - certaines balises sont strictement identiques et repetees
    // (verifie sur oman-2024 et jordanie), or REPLACE frappe TOUTES les
    // occurrences et supprimerait aussi celle a conserver.
    //
    // On vide donc le champ, puis on le reconstitue par concatenations
    // successives de 48 Ko, dans l ordre : la position de chaque photo dans le
    // recit est preservee a l identique.
    const PAS = 48000;
    parts.push(`UPDATE articles SET content = '' WHERE id = ${m.id};`);
    for (let off = 0; off < m.apres.length; off += PAS) {
      const bout = m.apres.slice(off, off + PAS);
      parts.push(`UPDATE articles SET content = content || ${sqlStr(bout)} WHERE id = ${m.id};`);
    }
    parts.push(`UPDATE articles SET updated_at = CURRENT_TIMESTAMP WHERE id = ${m.id};`);
  }
  if (m.photoIds.length) {
    const ids = m.photoIds.join(',');
    parts.push(
      `INSERT OR IGNORE INTO photos_backup_011 (id, article_id, r2_key, url, caption, sort_order, was_deleted)`,
      `SELECT id, article_id, r2_key, url, caption, sort_order, 1 FROM photos WHERE id IN (${ids});`,
      `UPDATE photos_backup_011 SET was_deleted = 1 WHERE id IN (${ids});`,
      `DELETE FROM photos WHERE id IN (${ids});`);
  }

  // Envoi par lots : chaque fichier .sql reste petit, donc chaque instruction
  // passe sous la limite de taille de D1. Les lots partent dans l ordre, et la
  // sauvegarde (premier lot) precede toujours la moindre modification.
  const LOT = 20;
  for (let k = 0; k < parts.length; k += LOT) {
    d1Write(parts.slice(k, k + LOT).join('\n'));
  }
  const quoi = [
    m.contenuChange ? `${m.supprimes} <img>` : null,
    m.photoIds.length ? `${m.photoIds.length} ligne(s) photos` : null,
  ].filter(Boolean).join(' + ');
  console.log(`  ${green('✓')} article ${m.id} (${m.slug}) — ${quoi} retire(s)`);
}

console.log(green(`\n✓ ${totalSupprimes} images en double retirees.`));
console.log(grey('  Contenu d origine conserve dans articles_backup_dedupe.'));
console.log(grey('  Annulation : scripts/dedupe-article-images-rollback.sql\n'));
