/**
 * run-import.js — Execute canalblog-import.sql statement by statement
 * Bypasses SQLITE_TOOBIG by splitting on article boundaries.
 *
 * Run: node scripts/run-import.js
 */

import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const sqlFile = fileURLToPath(new URL('./canalblog-import.sql', import.meta.url));
const sql = readFileSync(sqlFile, 'utf8');

/**
 * Split SQL into individual statements, correctly handling single-quoted
 * string literals (which may contain semicolons and newlines).
 */
function splitSql(input) {
  const stmts = [];
  let current = '';
  let inString = false;
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (inString) {
      current += ch;
      if (ch === "'") {
        // SQL escaped quote '' → stay in string
        if (input[i + 1] === "'") {
          current += "'";
          i += 2;
          continue;
        }
        inString = false;
      }
    } else {
      if (ch === "'") {
        inString = true;
        current += ch;
      } else if (ch === ';') {
        const trimmed = current.trim();
        if (trimmed) stmts.push(trimmed);
        current = '';
      } else if (ch === '-' && input[i + 1] === '-') {
        // Skip line comment
        while (i < input.length && input[i] !== '\n') i++;
        i++;
        continue;
      } else {
        current += ch;
      }
    }
    i++;
  }
  const trimmed = current.trim();
  if (trimmed) stmts.push(trimmed);
  return stmts.filter(s => s.length > 0);
}

const statements = splitSql(sql);

console.log(`📦 ${statements.length} statements to execute\n`);

let ok = 0;
let fail = 0;

for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i];
  if (!stmt) continue;

  const tmpFile = join(tmpdir(), `d1-stmt-${i}.sql`);
  writeFileSync(tmpFile, stmt + ';', 'utf8');

  try {
    execSync(
      `npx wrangler d1 execute tranquille-vacances-db --local --file="${tmpFile}"`,
      { cwd: fileURLToPath(new URL('..', import.meta.url)), stdio: 'pipe' }
    );
    // Show a brief label
    const label = stmt.substring(0, 80).replace(/\n/g, ' ');
    console.log(`  ✓ [${i + 1}/${statements.length}] ${label}…`);
    ok++;
  } catch (err) {
    const label = stmt.substring(0, 80).replace(/\n/g, ' ');
    console.error(`  ✗ [${i + 1}/${statements.length}] FAILED: ${label}…`);
    console.error(`    ${err.stderr?.toString().trim() || err.message}`);
    fail++;
  } finally {
    unlinkSync(tmpFile);
  }
}

console.log(`\n✅ Done — ${ok} succeeded, ${fail} failed`);
