/**
 * tests/tnr.js - Point d entree des TNR (tests de non-regression).
 *
 *   npm run tnr           campagne complete (rendu + migration + smoke HTTP)
 *   npm run tnr:rapide    sans le smoke HTTP (quelques secondes, pas de wrangler)
 *
 * Code de sortie 0 si tout passe, 1 sinon : c est ce qui bloque le deploiement
 * (voir scripts/deploy.js).
 *
 * AUCUN de ces tests ne touche la production. Detail des garanties dans
 * tests/README.md.
 */
import { summary, failedCount, bold, blue, grey, green } from './runner.js';

const rapide = process.argv.includes('--rapide') || process.argv.includes('--fast');

const banner = `
${bold(blue('  T N R  —  Tranquille, on est en vacances'))}
${grey('  Tests de non-regression')}${rapide ? grey('  [mode rapide : smoke HTTP ignore]') : ''}
${grey('  Cible : LOCAL uniquement — la production n est jamais contactee')}
`;
process.stdout.write(banner);

let erreurFatale = null;
try {
  const rendu = (await import('./01-rendu.test.js')).default;
  await rendu();

  const migration = (await import('./02-migration.test.js')).default;
  await migration();

  const jours = (await import('./04-jours.test.js')).default;
  await jours();

  if (!rapide) {
    const smoke = (await import('./03-smoke-http.test.js')).default;
    await smoke();
  } else {
    process.stdout.write(grey('\n  (smoke HTTP ignore en mode rapide — a lancer avant toute mise en prod)\n'));
  }
} catch (err) {
  // Un plantage du harnais lui-meme (import casse, fichier manquant) ne doit
  // jamais etre confondu avec "tests passes".
  erreurFatale = err;
  process.stdout.write(`\n${bold('ERREUR FATALE DU HARNAIS DE TEST')}\n${err && err.stack || err}\n`);
}

const vert = summary() && !erreurFatale;

if (vert) {
  process.stdout.write(green('\n  Les TNR sont au vert — le deploiement peut continuer.\n\n'));
} else {
  process.stdout.write(`\n  ${bold('Deploiement a proscrire tant que les TNR ne sont pas au vert.')}\n\n`);
}

process.exit(vert ? 0 : 1);
