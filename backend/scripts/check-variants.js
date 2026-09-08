/**
 * scripts/check-variants.js - Couverture reelle des variantes allegees.
 *
 * Interroge R2 (via /r2/) pour savoir si la variante existe VRAIMENT, plutot
 * que de lire le HTML : le worker ecrit toujours l'URL de la variante, qu'elle
 * existe ou non (le repli sur l'original s'en charge cote navigateur). Compter
 * depuis le HTML donne donc 100 % meme quand rien n'a ete genere - erreur
 * commise une premiere fois, d'ou ce script.
 *
 * LECTURE SEULE : uniquement des requetes HEAD sur le site public.
 *
 *   node scripts/check-variants.js                 # sondage rapide
 *   node scripts/check-variants.js --complet       # toutes les images
 */
const BASE = process.env.SITE_BASE || 'https://tranquille-vacances.esti-archi.workers.dev';
const COMPLET = process.argv.includes('--complet');

const arts = await (await fetch(BASE + '/api/articles')).json();
const articles = Array.isArray(arts) ? arts : (arts.articles || arts.results || []);

// Inventaire des originaux reellement referencies par les pages.
const cles = new Set();
for (const a of articles) {
  const h = await (await fetch(`${BASE}/voyage/${a.slug}`)).text();
  const m = h.match(/window\.photos\s*=\s*(\[[\s\S]*?\]);/);
  if (m) for (const p of JSON.parse(m[1])) if (p.url?.startsWith('/r2/')) cles.add(p.url);
  for (const t of h.match(/<img\b[^>]*>/gi) || []) {
    for (const attr of ['src', 'data-src', 'data-full']) {
      const u = (t.match(new RegExp(`\\b${attr}\\s*=\\s*["']([^"']+)["']`, 'i')) || [])[1];
      if (u && u.startsWith('/r2/') && !u.endsWith('.w600.webp') && !u.endsWith('.w1200.webp')) cles.add(u);
    }
  }
}
let liste = [...cles];
console.log(`originaux referencies : ${liste.length}`);
if (!COMPLET) {
  const pas = Math.max(1, Math.floor(liste.length / 200));
  liste = liste.filter((_, i) => i % pas === 0).slice(0, 200);
  console.log(`sondage sur ${liste.length} images (--complet pour tout verifier)\n`);
} else {
  console.log('');
}

const res = { w600: 0, w1200: 0, aucune: 0 };
const manquantes = { w600: [], w1200: [] };
const file = [...liste];
async function worker() {
  while (file.length) {
    const u = file.shift();
    const [a, b] = await Promise.all([
      fetch(BASE + u + '.w600.webp', { method: 'HEAD' }).catch(() => null),
      fetch(BASE + u + '.w1200.webp', { method: 'HEAD' }).catch(() => null),
    ]);
    if (a && a.ok) res.w600++; else manquantes.w600.push(u);
    if (b && b.ok) res.w1200++; else manquantes.w1200.push(u);
    if ((!a || !a.ok) && (!b || !b.ok)) res.aucune++;
  }
}
await Promise.all(Array.from({ length: 6 }, worker));

const pct = (n) => Math.round(n / liste.length * 100);
console.log(`vignette w600  (galerie) : ${res.w600}/${liste.length}  (${pct(res.w600)} %)`);
console.log(`variante w1200 (corps)   : ${res.w1200}/${liste.length}  (${pct(res.w1200)} %)`);
console.log(`aucune des deux          : ${res.aucune}  (servent l'original)`);
if (manquantes.w1200.length) {
  console.log('\nexemples sans w1200 :');
  manquantes.w1200.slice(0, 5).forEach(u => console.log('  ' + u));
}
