/**
 * scripts/measure-gallery-weight.js - Mesure ce que pese vraiment une galerie.
 *
 * Telecharge ce qu'un lecteur telecharge en ouvrant un article : la vignette si
 * elle existe, l'original sinon. C'est le chiffre qui compte - pas la taille
 * des fichiers en base, mais les octets qui traversent la connexion.
 *
 * Sert a verifier le critere "gain mesure apres coup" de la DoD.
 *
 * LECTURE SEULE : uniquement des GET sur le site public.
 *
 *   node scripts/measure-gallery-weight.js --slug=jordanie-avril-2022
 *   node scripts/measure-gallery-weight.js --echantillon=80
 */
const B = process.env.SITE_BASE || 'https://tranquille-vacances.esti-archi.workers.dev';
const args = process.argv.slice(2);
const slug = (args.find(a => a.startsWith('--slug=')) || '').split('=')[1] || 'jordanie-avril-2022';
const ECH = Number((args.find(a => a.startsWith('--echantillon=')) || '').split('=')[1] || 60);

const h = await (await fetch(`${B}/voyage/${slug}`)).text();
const m = h.match(/window\.photos\s*=\s*(\[[\s\S]*?\]);/);
if (!m) { console.log('aucune galerie sur cet article'); process.exit(0); }
const photos = JSON.parse(m[1]);

// Echantillon reparti sur toute la galerie, pas seulement le debut.
const pas = Math.max(1, Math.floor(photos.length / ECH));
const ech = photos.filter((_, i) => i % pas === 0).slice(0, ECH);

let orig = 0, servi = 0, avecVignette = 0, n = 0;
const file = [...ech];
async function worker() {
  while (file.length) {
    const p = file.shift();
    const abs = /^https?:/.test(p.url) ? p.url : B + p.url;
    const ro = await fetch(abs).catch(() => null);
    if (!ro || !ro.ok) continue;
    const to = (await ro.arrayBuffer()).byteLength;

    // Ce que le lecteur telecharge reellement pour la vignette.
    let ts = to;
    if (p.url.startsWith('/r2/')) {
      const rv = await fetch(B + p.url + '.w600.webp').catch(() => null);
      if (rv && rv.ok) { ts = (await rv.arrayBuffer()).byteLength; avecVignette++; }
    }
    orig += to; servi += ts; n++;
  }
}
await Promise.all(Array.from({ length: 8 }, worker));

const mo = (x) => (x / 1048576).toFixed(1);
const N = photos.length;
console.log(`\narticle          : ${slug}`);
console.log(`photos           : ${N}  (echantillon ${n}, ${avecVignette} avec vignette)`);
console.log(`\nPAR PHOTO`);
console.log(`  original       : ${Math.round(orig / n / 1024)} Ko`);
console.log(`  servi          : ${Math.round(servi / n / 1024)} Ko`);
console.log(`\nGALERIE COMPLETE (${N} photos)`);
console.log(`  avant          : ${mo(orig / n * N)} Mo`);
console.log(`  maintenant     : ${mo(servi / n * N)} Mo`);
const gain = Math.round(100 - servi / orig * 100);
console.log(`  gain           : ${gain}%`);
console.log(`\n  en 3G (~1 Mo/s): ${Math.round(orig / n * N / 1048576)} s → ${Math.round(servi / n * N / 1048576)} s`);
console.log(`  data (5 EUR/Go): ${(orig / n * N / 1073741824 * 5).toFixed(2)} EUR → ${(servi / n * N / 1073741824 * 5).toFixed(2)} EUR`);
console.log(`\ncouverture vignettes : ${Math.round(avecVignette / n * 100)}% de l echantillon`);
