/**
 * tests/runner.js - Micro-framework de TNR maison.
 *
 * Pourquoi pas vitest/jest : le worker n'a aucune dependance de test, tourne en
 * ESM pur, et les TNR doivent pouvoir s'executer depuis n'importe ou (y compris
 * une connexion d'hotel) sans `npm install` prealable. Node seul suffit.
 *
 * Sortie orientee lecture humaine : chaque phase est annoncee, chaque test
 * affiche son nom et son verdict au moment ou il s'execute, et le total tombe a
 * la fin. C'est ce flux qui est lu pendant un deploiement.
 *
 * REGLE ABSOLUE : aucun test ne touche la production. Pas de --remote, pas de
 * vraie D1, pas de vrai R2, pas d'email. Voir tests/README.md.
 */

// ── Couleurs ANSI (desactivees si la sortie n'est pas un terminal) ───────────
const tty = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code) => (s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : String(s));
export const green = c('32');
export const red = c('31');
export const yellow = c('33');
export const blue = c('36');
export const grey = c('90');
export const bold = c('1');

// ── Etat global de la campagne ──────────────────────────────────────────────
const state = {
  phase: '',
  passed: 0,
  failed: 0,
  skipped: 0,
  failures: [],   // { phase, name, error }
  startedAt: Date.now(),
};

/** Ouvre une phase : un bandeau visible dans le flux de deploiement. */
export function phase(title) {
  state.phase = title;
  process.stdout.write(`\n${blue('┌─ ' + title)}\n`);
}

/**
 * Execute un test. Le nom est affiche AVANT l'execution, puis complete par le
 * verdict : pendant un test lent (demarrage de wrangler), on voit ou ca bloque
 * au lieu d'un ecran fige.
 */
export async function test(name, fn) {
  process.stdout.write(grey('│  … ') + name);
  const t0 = Date.now();
  try {
    await fn();
    const ms = Date.now() - t0;
    // \r + effacement de ligne : la ligne "…" est remplacee par le verdict.
    process.stdout.write(`\r\x1b[2K${grey('│  ')}${green('✓')} ${name} ${grey(`(${ms}ms)`)}\n`);
    state.passed++;
  } catch (err) {
    const ms = Date.now() - t0;
    process.stdout.write(`\r\x1b[2K${grey('│  ')}${red('✗')} ${bold(red(name))} ${grey(`(${ms}ms)`)}\n`);
    process.stdout.write(`${grey('│    ')}${red(String(err && err.message || err).split('\n').join('\n│    '))}\n`);
    state.failed++;
    state.failures.push({ phase: state.phase, name, error: err });
  }
}

/** Test volontairement non execute (dependance absente), signale sans echouer. */
export function skip(name, why) {
  process.stdout.write(`${grey('│  ')}${yellow('⊘')} ${name} ${grey('— ' + why)}\n`);
  state.skipped++;
}

/** Ferme la phase courante. */
export function endPhase() {
  process.stdout.write(grey('└─\n'));
}

// ── Assertions ──────────────────────────────────────────────────────────────
// Messages volontairement bavards : un TNR qui casse pendant un deploiement
// doit se diagnostiquer sans ouvrir le code du test.

export function ok(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion echouee');
}

export function eq(actual, expected, msg) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${msg || 'Valeurs differentes'}\n  attendu : ${e}\n  obtenu  : ${a}`);
  }
}

export function match(str, re, msg) {
  if (!re.test(String(str))) {
    throw new Error(`${msg || 'Motif absent'}\n  motif  : ${re}\n  dans   : ${truncate(String(str), 400)}`);
  }
}

export function noMatch(str, re, msg) {
  if (re.test(String(str))) {
    const hit = String(str).match(re);
    throw new Error(`${msg || 'Motif present alors qu il ne devrait pas'}\n  motif   : ${re}\n  trouve  : ${JSON.stringify(hit && hit[0])}\n  dans    : ${truncate(String(str), 400)}`);
  }
}

export function count(str, re, n, msg) {
  const got = (String(str).match(re) || []).length;
  if (got !== n) {
    throw new Error(`${msg || 'Nombre d occurrences incorrect'}\n  motif   : ${re}\n  attendu : ${n}\n  obtenu  : ${got}`);
  }
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n) + ` … (+${s.length - n} car.)` : s;
}

// ── Bilan final ─────────────────────────────────────────────────────────────
/** Affiche le recapitulatif et renvoie true si tout est vert. */
export function summary() {
  const secs = ((Date.now() - state.startedAt) / 1000).toFixed(1);
  const total = state.passed + state.failed;
  process.stdout.write('\n' + '═'.repeat(64) + '\n');

  if (state.failed === 0) {
    process.stdout.write(
      `${green(bold('  ✓ TNR OK'))}  ${state.passed}/${total} tests passes` +
      (state.skipped ? grey(`, ${state.skipped} ignore(s)`) : '') +
      grey(`  —  ${secs}s`) + '\n');
  } else {
    process.stdout.write(
      `${red(bold('  ✗ TNR EN ECHEC'))}  ${state.failed}/${total} test(s) en echec` +
      grey(`  —  ${secs}s`) + '\n\n');
    for (const f of state.failures) {
      process.stdout.write(`${red('  • ')}${grey(f.phase + ' › ')}${bold(f.name)}\n`);
      process.stdout.write(grey('    ' + String(f.error && f.error.message || f.error).split('\n').join('\n    ')) + '\n');
    }
  }
  process.stdout.write('═'.repeat(64) + '\n');
  return state.failed === 0;
}

export function failedCount() { return state.failed; }
