/**
 * TNR - Migration 011 (dedoublonnage + effacement des legendes)
 *
 * La migration est DESTRUCTIVE et irreversible. Ces tests la rejouent sur une
 * base SQLite EN MEMOIRE, reconstruite a chaque test a partir de schema.sql.
 * A aucun moment la base de production n est ouverte, lue ou modifiee.
 *
 * Le point sensible verifie ici : l ordre des deux etapes. Le DELETE identifie
 * les doublons PAR LA LEGENDE ; si l UPDATE qui vide les legendes passait en
 * premier, la seule preuve qu une photo est un doublon serait detruite et le
 * dedoublonnage ne trouverait plus rien.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { phase, test, skip, endPhase, ok, eq } from './runner.js';

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATION = join(here, '..', 'migrations', '011-dedupe-photos-and-clear-captions.sql');
const ROLLBACK = join(here, '..', 'migrations', '011-rollback.sql');

// node:sqlite existe depuis Node 22 ; sur une version plus ancienne on saute
// cette phase plutot que de faire echouer un deploiement pour une raison qui
// n a rien a voir avec le code.
let DatabaseSync = null;
try { ({ DatabaseSync } = await import('node:sqlite')); } catch { /* indisponible */ }

/** Base neuve + jeu de lignes, isolee pour chaque test. */
function freshDb(rows) {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    r2_key TEXT NOT NULL,
    url TEXT NOT NULL,
    caption TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
  );`);
  const ins = db.prepare('INSERT INTO photos (article_id,r2_key,url,caption,sort_order) VALUES (?,?,?,?,?)');
  rows.forEach((r, i) => ins.run(r.article_id, r.r2_key, r.url ?? ('/r2/' + r.r2_key), r.caption, r.sort_order ?? i));
  return db;
}

function applyMigration(db) {
  db.exec(readFileSync(MIGRATION, 'utf8'));
}

function applyRollback(db) {
  db.exec(readFileSync(ROLLBACK, 'utf8'));
}

/** Etat complet de la table, pour comparer avant / apres rollback. */
function snapshot(db) {
  return db.prepare('SELECT id, article_id, r2_key, url, caption, sort_order FROM photos ORDER BY id').all();
}

function allRows(db) {
  return db.prepare('SELECT id, article_id, r2_key, caption FROM photos ORDER BY id').all();
}

export default async function run() {
  phase('Migration 011 › Dedoublonnage en base');

  if (!DatabaseSync) {
    skip('tests de migration', `node:sqlite indisponible (Node ${process.version}, il faut >= 22)`);
    endPhase();
    return;
  }

  await test('le fichier de migration est present et lisible', () => {
    const sql = readFileSync(MIGRATION, 'utf8');
    ok(sql.includes('DELETE FROM photos'), 'l etape de dedoublonnage a disparu');
    ok(sql.includes('UPDATE photos SET caption'), 'l etape d effacement des legendes a disparu');
    ok(sql.indexOf('DELETE FROM photos') < sql.indexOf('UPDATE photos SET caption'),
      'ORDRE CRITIQUE : le DELETE doit preceder l UPDATE, sinon les doublons deviennent introuvables');
  });

  await test('une photo re-collee est supprimee, l originale conservee', () => {
    const db = freshDb([
      { article_id: 1, r2_key: 'k1', caption: 'word image 35' },
      { article_id: 1, r2_key: 'k2', caption: 'word image 36' },
      { article_id: 1, r2_key: 'k3', caption: 'word image 36' }, // doublon
    ]);
    applyMigration(db);
    const rows = allRows(db);
    eq(rows.length, 2, 'exactement une ligne doit disparaitre');
    ok(rows.some(r => r.r2_key === 'k2'), 'l originale (id le plus bas) doit survivre');
    ok(!rows.some(r => r.r2_key === 'k3'), 'la copie re-uploadee doit partir');
  });

  await test('les photos SANS legende sont toutes conservees', () => {
    // Garde-fou majeur : sans le filtre "caption <> ''", toutes les photos non
    // decrites d un article se reduiraient a une seule.
    const db = freshDb([
      { article_id: 1, r2_key: 'k1', caption: '' },
      { article_id: 1, r2_key: 'k2', caption: '' },
      { article_id: 1, r2_key: 'k3', caption: '' },
    ]);
    applyMigration(db);
    eq(allRows(db).length, 3, 'AUCUNE photo sans legende ne doit etre supprimee');
  });

  await test('deux articles partageant une legende ne se contaminent pas', () => {
    // "word image 36" est un compteur d import qui repart a zero : la meme
    // legende dans deux voyages designe deux photos differentes.
    const db = freshDb([
      { article_id: 1, r2_key: 'jordanie', caption: 'word image 36' },
      { article_id: 2, r2_key: 'perou',    caption: 'word image 36' },
    ]);
    applyMigration(db);
    const rows = allRows(db);
    eq(rows.length, 2, 'le dedoublonnage doit rester limite a un article');
    ok(rows.some(r => r.r2_key === 'jordanie') && rows.some(r => r.r2_key === 'perou'));
  });

  await test('toutes les legendes sont vides apres migration', () => {
    const db = freshDb([
      { article_id: 1, r2_key: 'k1', caption: 'word image 35' },
      { article_id: 1, r2_key: 'k2', caption: 'Une vraie legende ecrite a la main' },
      { article_id: 2, r2_key: 'k3', caption: '' },
    ]);
    applyMigration(db);
    ok(allRows(db).every(r => r.caption === ''), 'plus aucune legende ne doit subsister');
  });

  await test('trois copies de la meme photo se reduisent a une', () => {
    const db = freshDb([
      { article_id: 1, r2_key: 'k1', caption: 'word image 36' },
      { article_id: 1, r2_key: 'k2', caption: 'word image 36' },
      { article_id: 1, r2_key: 'k3', caption: 'word image 36' },
    ]);
    applyMigration(db);
    const rows = allRows(db);
    eq(rows.length, 1);
    eq(rows[0].r2_key, 'k1', 'la plus ancienne est gardee');
  });

  await test('la migration est idempotente (rejouable sans degat)', () => {
    // Un deploiement interrompu peut la relancer : elle ne doit pas continuer
    // a supprimer des lignes au deuxieme passage.
    const db = freshDb([
      { article_id: 1, r2_key: 'k1', caption: 'word image 36' },
      { article_id: 1, r2_key: 'k2', caption: 'word image 36' },
      { article_id: 1, r2_key: 'k3', caption: '' },
    ]);
    applyMigration(db);
    const apres1 = allRows(db);
    applyMigration(db);
    const apres2 = allRows(db);
    eq(apres2, apres1, 'un second passage ne doit rien changer');
  });

  await test('une base sans doublon n est pas modifiee (hors legendes)', () => {
    const db = freshDb([
      { article_id: 1, r2_key: 'k1', caption: 'legende a' },
      { article_id: 1, r2_key: 'k2', caption: 'legende b' },
    ]);
    applyMigration(db);
    eq(allRows(db).map(r => r.r2_key), ['k1', 'k2'], 'aucune suppression injustifiee');
  });

  await test('une table vide ne fait pas echouer la migration', () => {
    const db = freshDb([]);
    applyMigration(db);
    eq(allRows(db).length, 0);
  });

  await test('le scenario Jordanie complet donne le resultat attendu', () => {
    // Reproduction du cas signale : parmi les photos, "word image 36"
    // (Severine endormie dans l avion) apparaissait deux fois.
    const db = freshDb([
      { article_id: 7, r2_key: 'a', caption: 'word image 21' },
      { article_id: 7, r2_key: 'b', caption: 'word image 22' },
      { article_id: 7, r2_key: 'c', caption: 'word image 35' },
      { article_id: 7, r2_key: 'd', caption: 'word image 36' },
      { article_id: 7, r2_key: 'e', caption: 'word image 36' }, // le doublon visible
      { article_id: 7, r2_key: 'f', caption: '' },
      { article_id: 7, r2_key: 'g', caption: '' },
    ]);
    applyMigration(db);
    const rows = allRows(db);
    eq(rows.length, 6, 'une seule ligne en trop doit disparaitre');
    ok(!rows.some(r => r.r2_key === 'e'));
    ok(rows.every(r => r.caption === ''));
  });

  endPhase();

  // ─────────────────────────────────────────────────────────────────────────
  phase('Migration 011 › Reversibilite (rollback)');
  // La migration supprime des lignes. Elle n est acceptable que si elle est
  // annulable : ces tests le prouvent sur des donnees, pas sur une promesse.

  await test('le fichier de rollback est present', () => {
    const sql = readFileSync(ROLLBACK, 'utf8');
    ok(sql.includes('INSERT OR IGNORE INTO photos'), 'la restauration des lignes a disparu');
    ok(sql.includes('UPDATE photos'), 'la restauration des legendes a disparu');
  });

  await test('la migration sauvegarde les lignes avant de les supprimer', () => {
    const db = freshDb([
      { article_id: 1, r2_key: 'k1', caption: 'word image 36' },
      { article_id: 1, r2_key: 'k2', caption: 'word image 36' },
    ]);
    applyMigration(db);
    const bak = db.prepare('SELECT id, r2_key, caption, was_deleted FROM photos_backup_011 ORDER BY id').all();
    eq(bak.length, 2, 'les deux lignes portant une legende doivent etre sauvegardees');
    eq(bak.filter(r => r.was_deleted === 1).length, 1, 'une seule est marquee supprimee');
    ok(bak.every(r => r.caption === 'word image 36'), 'les legendes d origine sont conservees dans l instantane');
  });

  await test('ROLLBACK : l etat d origine est restaure a l identique', () => {
    const rows = [
      { article_id: 1, r2_key: 'k1', caption: 'word image 35' },
      { article_id: 1, r2_key: 'k2', caption: 'word image 36' },
      { article_id: 1, r2_key: 'k3', caption: 'word image 36' }, // doublon supprime
      { article_id: 1, r2_key: 'k4', caption: '' },
      { article_id: 2, r2_key: 'k5', caption: 'word image 36' },
    ];
    const db = freshDb(rows);
    const avant = snapshot(db);

    applyMigration(db);
    const pendant = snapshot(db);
    eq(pendant.length, 4, 'la migration doit bien avoir supprime le doublon');
    ok(pendant.every(r => r.caption === ''), 'et vide les legendes');

    applyRollback(db);
    const apres = snapshot(db);
    eq(apres, avant, 'apres rollback, la table doit etre STRICTEMENT identique a l origine');
  });

  await test('ROLLBACK : les photos restaurees gardent leur URL (image affichable)', () => {
    const db = freshDb([
      { article_id: 1, r2_key: 'k1', url: '/r2/photos/2026/9/aaa.webp', caption: 'word image 36' },
      { article_id: 1, r2_key: 'k2', url: '/r2/photos/2026/9/bbb.webp', caption: 'word image 36' },
    ]);
    applyMigration(db);
    applyRollback(db);
    const rows = db.prepare("SELECT url FROM photos WHERE r2_key='k2'").all();
    eq(rows.length, 1, 'la ligne supprimee doit revenir');
    eq(rows[0].url, '/r2/photos/2026/9/bbb.webp',
      'URL restauree : les objets R2 n ayant jamais ete effaces, la photo se reaffiche');
  });

  await test('rejouer la migration n ecrase pas les legendes sauvegardees', () => {
    // Piege reel : au second passage, les legendes en base valent ''. Sans le
    // INSERT OR IGNORE, l instantane serait ecrase par des valeurs vides et le
    // rollback ne restaurerait plus rien.
    const db = freshDb([
      { article_id: 1, r2_key: 'k1', caption: 'word image 36' },
      { article_id: 1, r2_key: 'k2', caption: 'word image 36' },
    ]);
    applyMigration(db);
    applyMigration(db); // second passage
    const bak = db.prepare('SELECT caption FROM photos_backup_011').all();
    ok(bak.every(r => r.caption === 'word image 36'),
      'les legendes d origine doivent survivre a une migration rejouee');
    applyRollback(db);
    const rows = db.prepare('SELECT caption FROM photos ORDER BY id').all();
    ok(rows.every(r => r.caption === 'word image 36'), 'le rollback reste fiable apres un double passage');
  });

  endPhase();
}
