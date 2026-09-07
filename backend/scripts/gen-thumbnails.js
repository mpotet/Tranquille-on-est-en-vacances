/**
 * scripts/gen-thumbnails.js - Genere les vignettes WebP des photos du blog.
 *
 * LE PROBLEME
 * Une galerie de voyage charge la photo en pleine resolution pour afficher une
 * vignette de 400 px de large. Mesure sur 41 photos reelles : 341 Ko en moyenne,
 * soit ~102 Mo pour consulter un article de 307 photos. Sur une connexion de
 * voyage, c'est plusieurs minutes d'attente et ~0,50 EUR de donnees par article.
 *
 * CE QUE FAIT CE SCRIPT
 * Pour chaque photo, il ecrit A COTE de l'original une vignette WebP de 600 px :
 *   photos/2026/86/abc.jpg          <- original, JAMAIS modifie ni supprime
 *   photos/2026/86/abc.jpg.w600.webp <- vignette, nouveau fichier
 * Gain mesure : -84 % (341 Ko -> 54 Ko).
 *
 * POURQUOI C'EST SANS RISQUE
 * Aucune ecriture destructive : une vignette est un fichier EN PLUS. Les
 * originaux restent intacts et continuent d'etre servis en plein ecran. Si un
 * probleme apparait, il suffit de cesser de servir les vignettes (un drapeau
 * cote worker) pour revenir a l'etat anterieur - sans rien restaurer.
 *
 * Le suffixe est ajoute APRES l'extension d'origine (".jpg.w600.webp" et non
 * ".w600.webp") pour que la cle de la vignette se derive de celle de l'original
 * par simple concatenation, sans avoir a analyser l'extension cote worker.
 *
 * Usage :
 *   node scripts/gen-thumbnails.js                 # simulation, ne generedéjà rien
 *   node scripts/gen-thumbnails.js --apply         # genere et televerse
 *   node scripts/gen-thumbnails.js --apply --limit=50
 *   node scripts/gen-thumbnails.js --apply --force # regenere meme si existante
 */
import sharp from 'sharp';
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const backend = dirname(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const FORCE = args.includes('--force');
const LIMIT = Number((args.find(a => a.startsWith('--limit=')) || '').split('=')[1] || 0);
const BUCKET = 'tranquille-vacances-photos';
const BASE = process.env.SITE_BASE || 'https://tranquille-vacances.esti-archi.workers.dev';

/**
 * Formats derives. Reglages issus de la mesure sur 41 photos reelles.
 *
 * - w600 : vignette de galerie. Une case fait ~400 px a l'ecran ; 600 px couvre
 *   aussi les ecrans a haute densite. Mesure : -84 %.
 * - w1200 : image du corps de l'article, affichee sur toute la largeur de la
 *   colonne de texte (~700 px max). 1200 px couvre le Retina sans exces.
 *
 * Ajouter un format ici suffit a le rendre generable : le script prend
 * `--format=<cle>`. Cote worker, la fonction thumbUrl() de helpers/render.js
 * derive l'URL par simple concatenation du suffixe.
 */
export const FORMATS = {
  w600:  { width: 600,  quality: 72, suffix: '.w600.webp' },
  w1200: { width: 1200, quality: 78, suffix: '.w1200.webp' },
};

const FORMAT_CLE = (args.find(a => a.startsWith('--format=')) || '').split('=')[1] || 'w600';
const FMT = FORMATS[FORMAT_CLE];
if (!FMT) {
  console.error(`Format inconnu : ${FORMAT_CLE}. Disponibles : ${Object.keys(FORMATS).join(', ')}`);
  process.exit(2);
}
const THUMB_WIDTH = FMT.width;
const THUMB_QUALITY = FMT.quality;
const THUMB_SUFFIX = FMT.suffix;

// Photos traitees de front. Chaque travailleur ecrit dans SON fichier
// temporaire : un nom partage ferait televerser a l'un l'image d'un autre.
//
// 6 travailleurs saturaient la connexion : 2316 echecs "fetch failed" sur un
// lot de 4189. 3 est le reglage retenu - le lot reste rapide sans que les
// telechargements ne s'etranglent mutuellement.
const CONCURRENCE = Number((args.find(a => a.startsWith('--concurrence=')) || '').split('=')[1] || 3);

const tty = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (n) => (s) => (tty ? `\x1b[${n}m${s}\x1b[0m` : String(s));
const green = c('32'), red = c('31'), yellow = c('33'), blue = c('36'), grey = c('90'), bold = c('1');

const tmp = join(backend, '.wrangler', 'thumbs');
if (!existsSync(tmp)) mkdirSync(tmp, { recursive: true });

const ETAT = join(tmp, 'avancement.txt');
const journal = [];
function dire(l = '') {
  journal.push(l);
  process.stdout.write(l + '\n');
  try { writeFileSync(ETAT, journal.join('\n') + '\n', 'utf8'); } catch { /* best effort */ }
}

/**
 * Televerse un fichier local dans R2, en asynchrone.
 *
 * Chaque appel demarre un `npx wrangler` (~4 s d'amorcage). En sequentiel, les
 * 4189 photos demandaient plus de 4 heures ; plusieurs envois sont donc menes
 * de front (voir CONCURRENCE), ce qui ramene le lot a une vingtaine de minutes.
 *
 * Le chemin du fichier est passe en RELATIF (depuis backend/) : le projet vit
 * sous "Projets IT", et `shell: true` - indispensable pour lancer npx sous
 * Windows - coupe un chemin absolu sur l'espace, ce qui faisait echouer chaque
 * envoi avec une erreur d'arguments wrangler illisible.
 */
function r2Put(cle, cheminRelatif, contentType) {
  return new Promise((resolve, reject) => {
    const p = spawn('npx', ['wrangler', 'r2', 'object', 'put', `"${BUCKET}/${cle}"`,
      '--file', cheminRelatif, '--content-type', contentType, '--remote'], {
      cwd: backend, shell: true,
      env: { ...process.env, NODE_NO_WARNINGS: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    p.stdout.on('data', d => { out += d; });
    p.stderr.on('data', d => { out += d; });
    p.on('close', () => {
      if (/Upload complete|stored/i.test(out)) resolve();
      else reject(new Error(out.slice(-400)));
    });
    p.on('error', reject);
  });
}

const t0 = Date.now();
const hhmmss = (ms) => {
  const s = Math.round(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}m${String(s % 60).padStart(2, '0')}s`;
};

dire(`\n${bold(blue('Generation des vignettes WebP'))}`);
dire(grey(`  mode      : ${APPLY ? 'ECRITURE' : 'simulation (aucune ecriture)'}`));
dire(grey(`  format    : ${FORMAT_CLE} — ${THUMB_WIDTH} px, qualite ${THUMB_QUALITY}, suffixe ${THUMB_SUFFIX}`));
dire(grey(`  parallele : ${CONCURRENCE}`));
dire(grey('  les originaux ne sont NI modifies NI supprimes\n'));

// ── Inventaire : toutes les URL /r2/ reellement affichees ───────────────────
dire(grey('inventaire des photos affichees…'));
const arts = await (await fetch(BASE + '/api/articles')).json();
const articles = Array.isArray(arts) ? arts : (arts.articles || arts.results || []);

const cles = new Set();
const estDerivee = (u) => Object.values(FORMATS).some(f => u.endsWith(f.suffix));

for (const a of articles) {
  const h = await (await fetch(`${BASE}/voyage/${a.slug}`)).text();

  // Deux sources d'images sur une page : la galerie (window.photos) et le corps
  // de l'article (<img> inline). Les deux meritent une version allegee - les
  // images du corps representent la moitie du poids d'une page.
  const urls = [];
  const m = h.match(/window\.photos\s*=\s*(\[[\s\S]*?\]);/);
  if (m) for (const p of JSON.parse(m[1])) if (p.url) urls.push(p.url);
  for (const t of h.match(/<img\b[^>]*>/gi) || []) {
    const src = (t.match(/\bsrc\s*=\s*["']([^"']+)["']/i) || [])[1];
    if (src) urls.push(src);
  }

  for (const u of urls) {
    // Seules les images hebergees chez nous sont traitables ; celles pointant
    // encore vers l'ancien blog ne nous appartiennent pas.
    if (u.startsWith('/r2/') && !estDerivee(u)) cles.add(u.slice('/r2/'.length));
  }
}
let liste = [...cles];
if (LIMIT) liste = liste.slice(0, LIMIT);
dire(`${liste.length} photo(s) a traiter\n`);

let faits = 0, generes = 0, ignores = 0, echecs = 0;
let poidsAvant = 0, poidsApres = 0;
let dernierPoint = Date.now();

function point(forcer = false) {
  if (!forcer && Date.now() - dernierPoint < 30000) return;
  dernierPoint = Date.now();
  const pct = liste.length ? Math.round(faits / liste.length * 100) : 100;
  const reste = liste.length - faits;
  const eta = faits > 0 ? hhmmss((Date.now() - t0) / faits * reste) : '—';
  dire(`${blue('  ⏱')} ${bold(String(pct).padStart(3) + '%')} traite ${faits}/${liste.length} · ` +
       `reste ${reste} · generees ${generes} · ecoule ${hhmmss(Date.now() - t0)} · reste ~${eta}`);
}

const file = [...liste];

/**
 * Telecharge avec reessais.
 *
 * Un "fetch failed" est presque toujours passager (connexion saturee, coupure
 * breve). Abandonner a la premiere tentative gaspillait le travail : on
 * reessaie en espacant, plutot que de compter la photo comme perdue.
 */
async function fetchRetry(url, essais = 3) {
  let derniere;
  for (let i = 0; i < essais; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return r;
      // 404 : l'objet n'existe pas, inutile d'insister.
      if (r.status === 404) return r;
      derniere = new Error(`HTTP ${r.status}`);
    } catch (e) { derniere = e; }
    await new Promise(r => setTimeout(r, 800 * (i + 1)));
  }
  throw derniere || new Error('echec');
}

async function travailleur(no) {
  const localRel = `.wrangler/thumbs/v${no}.webp`;
  const localAbs = join(tmp, `v${no}.webp`);
  while (file.length) {
    const cle = file.shift();
    const cleVignette = cle + THUMB_SUFFIX;
    try {
      // Deja generee ? On ne refait pas le travail (le script est relancable).
      // En cas d'echec reseau sur ce test, on regenere : refaire une vignette
      // deja presente est sans consequence, la sauter a tort laisserait une
      // photo lourde en ligne.
      if (!FORCE) {
        const dejaLa = await fetch(`${BASE}/r2/${cleVignette}`, { method: 'HEAD' }).catch(() => null);
        if (dejaLa && dejaLa.ok) { ignores++; faits++; point(); continue; }
      }

      const r = await fetchRetry(`${BASE}/r2/${cle}`);
      if (!r.ok) { echecs++; faits++; dire(`  ${yellow('⊘')} ${cle} — original introuvable (${r.status})`); point(); continue; }
      const src = Buffer.from(await r.arrayBuffer());

      const vignette = await sharp(src)
        .rotate()                     // applique l'orientation EXIF avant de redimensionner
        .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
        .webp({ quality: THUMB_QUALITY })
        .toBuffer();

      poidsAvant += src.length;
      poidsApres += vignette.length;

      if (APPLY) {
        writeFileSync(localAbs, vignette);
        await r2Put(cleVignette, localRel, 'image/webp');
      }
      generes++;
    } catch (e) {
      echecs++;
      dire(`  ${red('✗')} ${cle} — ${String(e.message || e).slice(0, 120)}`);
    }
    faits++;
    point();
  }
}

await Promise.all(Array.from({ length: CONCURRENCE }, (_, i) => travailleur(i)));
point(true);

// ── Bilan ───────────────────────────────────────────────────────────────────
const mo = (x) => (x / 1048576).toFixed(1);
dire('\n' + '═'.repeat(64));
dire(`${bold(APPLY ? green('  ✓ VIGNETTES GENEREES') : yellow('  SIMULATION'))}` +
     grey(`  —  ${hhmmss(Date.now() - t0)}`));
dire(`  generees ${generes} · deja presentes ${ignores} · echecs ${echecs}`);
if (generes) {
  dire(`  poids traite : ${mo(poidsAvant)} Mo → ${mo(poidsApres)} Mo ` +
       bold(`(-${Math.round(100 - poidsApres / poidsAvant * 100)}%)`));
}
if (!APPLY) dire(grey('\n  Relance avec --apply pour televerser.'));
dire('═'.repeat(64) + '\n');

process.exit(echecs > liste.length / 2 ? 1 : 0);
