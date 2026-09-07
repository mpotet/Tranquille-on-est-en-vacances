/**
 * scripts/deploy.js - Deploiement en etapes, avec les TNR en barrage.
 *
 *   npm run deploy        → environnement par defaut
 *   npm run deploy:prod   → production
 *
 * Le principe : rien ne part en ligne tant que les TNR ne sont pas au vert.
 * Chaque etape est annoncee, numerotee et horodatee, et le resultat est visible
 * au fur et a mesure dans la console.
 *
 * Options :
 *   --prod           deploie sur l environnement production
 *   --skip-tests     NE PAS UTILISER en temps normal. Demande une confirmation
 *                    ecrite et laisse une trace bien visible dans la sortie.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline/promises';

const backend = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const isProd = args.includes('--prod');
const skipTests = args.includes('--skip-tests');

const tty = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code) => (s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const green = c('32'), red = c('31'), yellow = c('33'), blue = c('36'), grey = c('90'), bold = c('1');

const CIBLE = isProd ? 'PRODUCTION' : 'par defaut';
const etapes = [
  'Verification de la syntaxe du worker',
  'TNR — tests de non-regression',
  'Compilation des styles (Tailwind)',
  `Deploiement Cloudflare (${CIBLE})`,
];
let courante = 0;
const t0 = Date.now();

function entete() {
  process.stdout.write(`\n${bold(blue('═'.repeat(64)))}\n`);
  process.stdout.write(`${bold('  DEPLOIEMENT')}  ${isProd ? bold(red('→ PRODUCTION')) : grey('→ environnement par defaut')}\n`);
  process.stdout.write(grey(`  Tranquille, on est en vacances — ${new Date().toLocaleString('fr-FR')}\n`));
  process.stdout.write(`${bold(blue('═'.repeat(64)))}\n`);
  process.stdout.write(grey('\n  Etapes prevues :\n'));
  etapes.forEach((e, i) => process.stdout.write(grey(`    ${i + 1}. ${e}\n`)));
  process.stdout.write('\n');
}

function debutEtape(titre) {
  courante++;
  const secs = ((Date.now() - t0) / 1000).toFixed(0);
  process.stdout.write(`\n${bold(blue(`▶ ETAPE ${courante}/${etapes.length}`))} ${bold(titre)} ${grey(`(+${secs}s)`)}\n`);
  process.stdout.write(grey('  ' + '─'.repeat(60)) + '\n');
}

function etapeOk(detail) {
  process.stdout.write(`  ${green('✓')} ${green(detail)}\n`);
}

function echec(titre, detail) {
  process.stdout.write(`\n${red('═'.repeat(64))}\n`);
  process.stdout.write(`${bold(red('  ✗ DEPLOIEMENT INTERROMPU'))} — etape ${courante}/${etapes.length} : ${titre}\n`);
  if (detail) process.stdout.write(grey(`\n  ${detail}\n`));
  process.stdout.write(`\n${grey('  Rien n a ete mis en ligne. Corrige, puis relance.')}\n`);
  process.stdout.write(`${red('═'.repeat(64))}\n\n`);
  process.exit(1);
}

/**
 * Lance une commande en laissant sa sortie s afficher en direct.
 *
 * NODE_NO_WARNINGS : `shell: true` est indispensable sous Windows pour lancer
 * npx, mais Node emet alors un DeprecationWarning a chaque appel. Ce bruit
 * noierait le deroule des etapes, qui doit rester lisible d un coup d oeil.
 * Les arguments passes ici sont tous ecrits en dur dans ce fichier, jamais
 * construits a partir d une saisie exterieure.
 */
function run(cmd, cmdArgs) {
  return new Promise((resolve) => {
    const p = spawn(cmd, cmdArgs, {
      cwd: backend, shell: true, stdio: 'inherit',
      env: { ...process.env, NODE_NO_WARNINGS: '1' },
    });
    p.on('exit', (code) => resolve(code ?? 1));
    p.on('error', () => resolve(1));
  });
}

// ── Deroule ─────────────────────────────────────────────────────────────────
entete();

// Etape 1 — syntaxe. Un fichier worker casse rend TOUT le site indisponible :
// autant s en apercevoir en 2 secondes plutot qu apres la mise en ligne.
debutEtape(etapes[0]);
{
  const fichiers = [
    'worker/index.js', 'worker/helpers/render.js', 'worker/api/photos.js',
    'worker/api/articles.js', 'worker/api/comments.js', 'worker/pages/print.js',
    'worker/pages/admin.js', 'worker/pages/home.js', 'worker/pages/shell.js',
  ];
  for (const f of fichiers) {
    const code = await run('node', ['--check', f]);
    if (code !== 0) echec(etapes[0], `Erreur de syntaxe dans ${f}.`);
  }
  etapeOk(`${fichiers.length} fichiers worker valides`);
}

// Etape 2 — le barrage.
debutEtape(etapes[1]);
if (skipTests) {
  process.stdout.write(`  ${yellow(bold('⚠  TESTS IGNORES (--skip-tests)'))}\n`);
  process.stdout.write(grey('  Le filet de securite est desactive : une regression partirait en ligne\n'));
  process.stdout.write(grey('  sans etre detectee.\n\n'));
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const rep = await rl.question(`  Tape ${bold('OUI')} en majuscules pour deployer sans les TNR : `);
  rl.close();
  if (rep.trim() !== 'OUI') echec(etapes[1], 'Deploiement annule — et c est le bon reflexe.');
  process.stdout.write(`  ${yellow('⚠ Poursuite SANS filet de securite.')}\n`);
} else {
  process.stdout.write(grey('  Aucun test ne touche la production : tout tourne en local.\n'));
  const code = await run('node', ['--no-warnings', 'tests/tnr.js']);
  if (code !== 0) {
    echec(etapes[1],
      'Un ou plusieurs TNR ont echoue (detail juste au-dessus).\n' +
      '  C est exactement leur role : ils viennent d empecher une regression\n' +
      '  d atteindre le site.');
  }
  etapeOk('TNR au vert');
}

// Etape 3 — CSS.
debutEtape(etapes[2]);
{
  const code = await run('npx', ['tailwindcss', '-i', './src/tailwind-input.css',
    '-o', './public/tailwind.css', '--minify']);
  if (code !== 0) echec(etapes[2], 'La compilation Tailwind a echoue.');
  etapeOk('public/tailwind.css genere');
}

// Etape 4 — mise en ligne.
debutEtape(etapes[3]);
{
  const wrArgs = isProd ? ['wrangler', 'deploy', '--env', 'production'] : ['wrangler', 'deploy'];
  const code = await run('npx', wrArgs);
  if (code !== 0) echec(etapes[3], 'Le deploiement Cloudflare a echoue.');
  etapeOk(`Worker deploye (${CIBLE})`);
}

// ── Bilan ───────────────────────────────────────────────────────────────────
const total = ((Date.now() - t0) / 1000).toFixed(0);
process.stdout.write(`\n${green('═'.repeat(64))}\n`);
process.stdout.write(`${bold(green('  ✓ DEPLOIEMENT REUSSI'))}  ${grey(`— ${CIBLE}, ${total}s`)}\n`);
if (skipTests) {
  process.stdout.write(`  ${yellow('⚠ Deploye SANS les TNR — a verifier manuellement.')}\n`);
}
process.stdout.write(`${green('═'.repeat(64))}\n\n`);
