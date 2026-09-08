/**
 * scripts/measure-real-page.js - Ce qu'un lecteur telecharge VRAIMENT.
 *
 * Les mesures "poids de la galerie" additionnent tous les fichiers, mais un
 * navigateur ne telecharge que ce qui entre a l'ecran (loading="lazy"). Ce
 * script pilote un vrai navigateur et compte les octets reellement transferes,
 * a l'ouverture puis apres avoir fait defiler toute la page.
 *
 * C'est le seul chiffre qui reflete l'experience de quelqu'un en voyage.
 *
 * LECTURE SEULE : uniquement de la navigation sur le site public.
 *
 *   node scripts/measure-real-page.js --slug=maroc-2026
 *   node scripts/measure-real-page.js --slug=maroc-2026 --eco
 */
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const slug = (args.find(a => a.startsWith('--slug=')) || '').split('=')[1] || 'maroc-2026';
const ECO = args.includes('--eco');
const BASE = process.env.SITE_BASE || 'https://tranquille-vacances.esti-archi.workers.dev';
const URL = `${BASE}/voyage/${slug}`;

const nav = await chromium.launch();
const ctx = await nav.newContext();
if (ECO) await ctx.addInitScript(() => { try { localStorage.setItem('dataSaver', '1'); } catch (e) {} });
const page = await ctx.newPage();

let images = 0, octetsImages = 0, octetsTotal = 0;
page.on('response', async (r) => {
  try {
    // Ne compter QUE ce qui a reellement traverse le reseau. Le service worker
    // relaie chaque requete, si bien que Playwright voit deux reponses par
    // ressource : celle de la page et celle du SW. Les additionner doublait
    // toutes les mesures - verifie : 0 image reellement telechargee deux fois.
    if (r.fromServiceWorker()) return;
    const b = await r.body();
    octetsTotal += b.length;
    if ((r.headers()['content-type'] || '').startsWith('image/')) { images++; octetsImages += b.length; }
  } catch { /* reponse deja consommee ou redirigee */ }
});

// 'load' plutot que 'networkidle' : le service worker garde des connexions
// ouvertes, le reseau n'est donc jamais "au repos".
await page.goto(URL, { waitUntil: 'load', timeout: 90000 });
await page.waitForTimeout(2000);
const ouverture = { images, octetsImages, octetsTotal };

// Defilement complet : c'est la que loading="lazy" declenche les chargements.
// Le defilement est pilote depuis Node, pas dans un evaluate() unique : le
// service worker peut provoquer une navigation en cours de route, ce qui
// detruirait le contexte d'execution et interromprait la mesure.
try {
  const hauteur = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < hauteur; y += 700) {
    await page.evaluate((v) => window.scrollTo(0, v), y).catch(() => {});
    await page.waitForTimeout(70);
  }
} catch { /* navigation en cours : on garde ce qui a ete mesure */ }
await page.waitForTimeout(3000);

const mo = (x) => (x / 1048576).toFixed(1);
console.log(`\narticle : ${slug}${ECO ? '   [mode economie]' : ''}`);
console.log(`\nA L'OUVERTURE (ce que le lecteur paie tout de suite)`);
console.log(`  images    : ${ouverture.images}  —  ${mo(ouverture.octetsImages)} Mo`);
console.log(`  page      : ${mo(ouverture.octetsTotal)} Mo`);
console.log(`\nAPRES AVOIR TOUT FAIT DEFILER`);
console.log(`  images    : ${images}  —  ${mo(octetsImages)} Mo`);
console.log(`  page      : ${mo(octetsTotal)} Mo`);
console.log(`\n  en 3G (~1 Mo/s) : ${Math.round(octetsTotal / 1048576)} s pour tout voir`);
console.log(`  data (5 EUR/Go) : ${(octetsTotal / 1073741824 * 5).toFixed(2)} EUR`);

await nav.close();
