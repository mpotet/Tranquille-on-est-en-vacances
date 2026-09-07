/**
 * scripts/verify-galleries.js - Controle complet des galeries en ligne.
 *
 * Pour CHAQUE article publie : la page repond-elle, est-elle complete, reste-t-il
 * une legende d import ("word image"), et surtout reste-t-il des doublons
 * VISUELS - deux vignettes montrant la meme image sous des URL differentes ?
 *
 * Le seul test fiable du doublon est le contenu du fichier, pas son URL : les
 * imports Word ont produit la meme photo sous /r2/photos/... et /r2/imported/...
 * On telecharge donc chaque image et on la hache (SHA-256). C est long - environ
 * 4000 fichiers - d ou la progression detaillee ci-dessous.
 *
 * LECTURE SEULE : uniquement des GET sur le site public. Aucune ecriture, ni en
 * base, ni en R2. Peut tourner pendant que le site est utilise.
 *
 * Usage :
 *   node scripts/verify-galleries.js              # tous les articles publies
 *   node scripts/verify-galleries.js --slug=jordanie-avril-2022
 *   node scripts/verify-galleries.js --interval=30   # point d etape (secondes)
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const BASE = process.env.SITE_BASE || 'https://tranquille-vacances.esti-archi.workers.dev';
const seulSlug = (args.find(a => a.startsWith('--slug=')) || '').split('=')[1] || null;
const INTERVAL = Number((args.find(a => a.startsWith('--interval=')) || '').split('=')[1] || 60) * 1000;
const ETAT = process.env.TEMP + '/verif-galeries-etat.txt';

const tty = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (n) => (s) => (tty ? `\x1b[${n}m${s}\x1b[0m` : String(s));
const green = c('32'), red = c('31'), yellow = c('33'), blue = c('36'), grey = c('90'), bold = c('1');

/**
 * Ecrit une ligne a la fois sur la console ET dans un fichier d etat.
 *
 * Quand le script tourne en arriere-plan, la sortie console est mise en tampon
 * et reste invisible jusqu a la fin - inutilisable pour suivre une operation de
 * plusieurs minutes. Le fichier, lui, est ecrit immediatement et peut etre lu a
 * tout moment.
 */
const journal = [];
function dire(ligne = '') {
  journal.push(ligne);
  process.stdout.write(ligne + '\n');
  try { writeFileSync(ETAT, journal.join('\n') + '\n', 'utf8'); } catch { /* best effort */ }
}

const t0 = Date.now();
const hhmmss = (ms) => {
  const s = Math.round(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}m${String(s % 60).padStart(2, '0')}s`;
};

dire(`\n${bold(blue('Verification des galeries en ligne'))}`);
dire(grey(`  site  : ${BASE}`));
dire(grey(`  etat  : ${ETAT}`));
dire(grey(`  point d etape toutes les ${INTERVAL / 1000}s  —  lecture seule\n`));

// ── Inventaire ──────────────────────────────────────────────────────────────
const rep = await fetch(BASE + '/api/articles');
if (!rep.ok) { dire(red(`GET /api/articles → ${rep.status}`)); process.exit(1); }
const brut = await rep.json();
let articles = Array.isArray(brut) ? brut : (brut.articles || brut.results || []);
if (seulSlug) articles = articles.filter(a => a.slug === seulSlug);

// Premier passage : compter les photos, pour connaitre le total AVANT de hacher
// (sans total, un pourcentage n a aucun sens).
dire(grey('inventaire des photos…'));
const plan = [];
for (const a of articles) {
  const r = await fetch(`${BASE}/voyage/${a.slug}`);
  const html = await r.text();
  const m = html.match(/window\.photos\s*=\s*(\[[\s\S]*?\]);/);
  const photos = m ? JSON.parse(m[1]) : [];
  plan.push({
    slug: a.slug, statut: r.status, complete: /<\/html>/i.test(html),
    wordImage: (html.match(/word image/gi) || []).length, photos,
  });
}
const TOTAL = plan.reduce((n, p) => n + p.photos.length, 0);
dire(`${articles.length} article(s), ${bold(String(TOTAL))} photo(s) a verifier\n`);

// ── Verification ────────────────────────────────────────────────────────────
let faits = 0, erreurs = 0;
let dernierPoint = Date.now();

function pointEtape(forcer = false) {
  if (!forcer && Date.now() - dernierPoint < INTERVAL) return;
  dernierPoint = Date.now();
  const pct = TOTAL ? Math.round((faits / TOTAL) * 100) : 100;
  const reste = TOTAL - faits;
  const ecoule = Date.now() - t0;
  // Estimation du temps restant a partir du debit observe.
  const eta = faits > 0 ? hhmmss((ecoule / faits) * reste) : '—';
  const barre = '█'.repeat(Math.round(pct / 4)).padEnd(25, '·');
  dire(`${blue('  ⏱')} ${bold(String(pct).padStart(3) + '%')} ${grey(barre)} ` +
       `traite ${bold(String(faits))}/${TOTAL} · reste ${bold(String(reste))} · ` +
       `ecoule ${hhmmss(ecoule)} · reste ~${eta}`);
}

const resultats = [];
for (const p of plan) {
  const vus = new Map();
  const queue = [...p.photos];
  const CONC = 8;
  await Promise.all(Array.from({ length: CONC }, async () => {
    while (queue.length) {
      const ph = queue.pop();
      // Les imports anciens peuvent porter une URL absolue : ne prefixer que
      // les chemins relatifs, sinon on fabrique un hote inexistant.
      const u = /^https?:\/\//i.test(ph.url) ? ph.url : BASE + ph.url;
      try {
        const r = await fetch(u);
        if (r.ok) {
          const h = createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex');
          vus.set(h, (vus.get(h) || 0) + 1);
        } else erreurs++;
      } catch { erreurs++; }
      faits++;
      pointEtape();
    }
  }));

  const doublons = [...vus.values()].reduce((n, k) => n + k - 1, 0);
  const souci = p.statut !== 200 || !p.complete || p.wordImage > 0 || doublons > 0;
  resultats.push({ ...p, doublons, distinctes: vus.size, souci });
  dire(`${souci ? yellow('~') : green('✓')} ${p.slug.padEnd(30)} ${p.statut} ` +
       `photos=${String(p.photos.length).padStart(3)} distinctes=${String(vus.size).padStart(3)} ` +
       `doublons=${doublons} "word image"=${p.wordImage} ${p.complete ? '' : red('PAGE INCOMPLETE')}`);
}

pointEtape(true);

// ── Bilan ───────────────────────────────────────────────────────────────────
const totalDoublons = resultats.reduce((n, r) => n + r.doublons, 0);
const totalWI = resultats.reduce((n, r) => n + r.wordImage, 0);
const ko = resultats.filter(r => r.souci);

dire('\n' + '═'.repeat(64));
if (!ko.length) {
  dire(`${green(bold('  ✓ TOUT EST PROPRE'))}  ${articles.length} articles, ${TOTAL} photos verifiees` +
       grey(`  —  ${hhmmss(Date.now() - t0)}`));
} else {
  dire(`${yellow(bold('  ⚠ POINTS A REGARDER'))}  ${ko.length} article(s) sur ${articles.length}` +
       grey(`  —  ${hhmmss(Date.now() - t0)}`));
  for (const r of ko) {
    dire(`    • ${r.slug} : ${r.doublons} doublon(s), ${r.wordImage} "word image"` +
         (r.complete ? '' : ', PAGE INCOMPLETE') + (r.statut !== 200 ? `, statut ${r.statut}` : ''));
  }
}
dire(grey(`  doublons visuels : ${totalDoublons} · legendes d import : ${totalWI}` +
     (erreurs ? ` · ${erreurs} image(s) inaccessible(s)` : '')));
dire('═'.repeat(64) + '\n');

process.exit(ko.length ? 1 : 0);
