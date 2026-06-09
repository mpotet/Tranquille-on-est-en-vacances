#!/usr/bin/env node
/**
 * parse-canalblog.js - Properly parse UPDATE statements and convert to INSERT
 */

import { readFileSync, writeFileSync } from 'node:fs';

const VOYAGES = [
  { title: 'Maroc Octobre 2011',         destination: 'Maroc',      start_date: '2011-10-07', end_date: '2011-10-09', folder: 'maroc' },
  { title: 'Maroc Mai 2013 – Marrakech', destination: 'Maroc',      start_date: '2013-05-01', end_date: '2013-05-14', folder: 'maroc' },
  { title: 'Espagne 2013 – Sierra de Guara', destination: 'Espagne', start_date: '2013-07-01', end_date: '2013-07-14', folder: 'espagne' },
  { title: 'Maroc Mai 2014 – Fès',       destination: 'Maroc',      start_date: '2014-05-01', end_date: '2014-05-14', folder: 'maroc' },
  { title: 'Maroc Avril 2015',           destination: 'Maroc',      start_date: '2015-04-01', end_date: '2015-04-14', folder: 'maroc' },
  { title: 'Maroc Avril 2016',           destination: 'Maroc',      start_date: '2016-04-01', end_date: '2016-04-14', folder: 'maroc' },
  { title: 'Maroc Octobre 2016',         destination: 'Maroc',      start_date: '2016-10-07', end_date: '2016-10-16', folder: 'maroc' },
  { title: 'Oman Avril 2017',            destination: 'Oman',       start_date: '2017-04-01', end_date: '2017-04-14', folder: 'oman' },
  { title: 'Maroc Avril 2018',           destination: 'Maroc',      start_date: '2018-04-01', end_date: '2018-04-14', folder: 'maroc' },
  { title: 'Oman Mars 2019',             destination: 'Oman',       start_date: '2019-03-01', end_date: '2019-03-14', folder: 'oman' },
  { title: 'Maroc Octobre 2019',         destination: 'Maroc',      start_date: '2019-10-01', end_date: '2019-10-14', folder: 'maroc' },
  { title: 'Maroc Juillet 2020',         destination: 'Maroc',      start_date: '2020-07-01', end_date: '2020-07-14', folder: 'maroc' },
  { title: 'Maroc Septembre 2021',       destination: 'Maroc',      start_date: '2021-09-01', end_date: '2021-09-14', folder: 'maroc' },
  { title: 'Jordanie Avril 2022',        destination: 'Jordanie',   start_date: '2022-04-29', end_date: '2022-05-17', folder: 'jordanie' },
  { title: 'Maroc 2022',                 destination: 'Maroc',      start_date: '2022-09-18', end_date: '2022-10-02', folder: 'maroc' },
  { title: 'Maroc 2023',                 destination: 'Maroc',      start_date: '2023-04-01', end_date: '2023-04-14', folder: 'maroc' },
  { title: 'Egypte 2023',                destination: 'Egypte',     start_date: '2023-11-07', end_date: '2023-11-25', folder: 'egypte' },
  { title: 'Maroc 2024',                 destination: 'Maroc',      start_date: '2024-05-01', end_date: '2024-05-14', folder: 'maroc' },
  { title: 'Oman 2024',                  destination: 'Oman',       start_date: '2024-10-01', end_date: '2024-10-14', folder: 'oman' },
  { title: 'Oman 2024 – suite',          destination: 'Oman',       start_date: '2024-11-01', end_date: '2024-11-14', folder: 'oman' },
  { title: 'Tunisie 2025',               destination: 'Tunisie',    start_date: '2025-04-01', end_date: '2025-04-14', folder: 'tunisie' },
  { title: 'Maroc 2025',                 destination: 'Maroc',      start_date: '2025-09-01', end_date: '2025-09-14', folder: 'maroc' },
  { title: 'Mauritanie Février 2026',    destination: 'Mauritanie', start_date: '2026-02-01', end_date: '2026-02-14', folder: 'mauritanie' },
  { title: 'Maroc 2026',                 destination: 'Maroc',      start_date: '2026-03-01', end_date: '2026-03-14', folder: 'maroc' },
];

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function sq(str) {
  const s = (str || '').substring(0, 80_000);
  return s.replace(/'/g, "''");
}

const sql = readFileSync('./canalblog-import.sql', 'utf8');

// Parse UPDATE statements
const articles = {};
let currentTitle = null;
let buffer = '';

for (const line of sql.split('\n')) {
  if (line.startsWith('-- Article: ')) {
    currentTitle = line.substring(12).trim();
    buffer = '';
  } else if (currentTitle && line.startsWith('UPDATE articles SET')) {
    buffer += line + '\n';
  } else if (currentTitle && buffer) {
    buffer += line + '\n';
    if (line.includes('WHERE slug') && line.includes(';')) {
      // Parse the complete UPDATE statement
      // Greedy (no ?) needed: non-greedy *? stops prematurely at first '' (escaped quote)
      const contentMatch = buffer.match(/content = '((?:[^']|'')*)'/);
      const coverMatch = buffer.match(/cover_url = '([^']*)'/);

      if (contentMatch) {
        // Unescape: '' → '
        let content = contentMatch[1].replace(/''/g, "'");
        articles[currentTitle] = {
          content,
          cover: coverMatch ? coverMatch[1] : null,
        };
      }
      currentTitle = null;
    }
  }
}

console.log(`Parsed ${Object.keys(articles).length} articles`);

// Generate INSERT statements
const sqlOutput = [];
sqlOutput.push('-- =====================================================');
sqlOutput.push('-- Canalblog import - properly parsed');
sqlOutput.push(`-- Generated: ${new Date().toISOString()}`);
sqlOutput.push('-- =====================================================\n');

sqlOutput.push('-- Folders');
sqlOutput.push(`INSERT OR IGNORE INTO folders (name, slug, icon, sort_order) VALUES ('Maroc', 'maroc', '🇲🇦', 1);`);
sqlOutput.push(`INSERT OR IGNORE INTO folders (name, slug, icon, sort_order) VALUES ('Oman', 'oman', '🇴🇲', 2);`);
sqlOutput.push(`INSERT OR IGNORE INTO folders (name, slug, icon, sort_order) VALUES ('Jordanie', 'jordanie', '🇯🇴', 3);`);
sqlOutput.push(`INSERT OR IGNORE INTO folders (name, slug, icon, sort_order) VALUES ('Égypte', 'egypte', '🇪🇬', 4);`);
sqlOutput.push(`INSERT OR IGNORE INTO folders (name, slug, icon, sort_order) VALUES ('Tunisie', 'tunisie', '🇹🇳', 5);`);
sqlOutput.push(`INSERT OR IGNORE INTO folders (name, slug, icon, sort_order) VALUES ('Espagne', 'espagne', '🇪🇸', 6);`);
sqlOutput.push(`INSERT OR IGNORE INTO folders (name, slug, icon, sort_order) VALUES ('Mauritanie', 'mauritanie', '🇲🇷', 7);`);
sqlOutput.push('');

sqlOutput.push('-- Articles');
for (const voyage of VOYAGES) {
  const slug = slugify(voyage.title);
  const article = articles[voyage.title] || {};
  const content = sq(article.content || `[${voyage.title}]`);
  const shortDesc = content.substring(0, 200).trim();
  const cover = article.cover ? `'${sq(article.cover)}'` : 'NULL';

  sqlOutput.push(`DELETE FROM articles WHERE slug = '${slug}'; -- Clean up any existing data`);
  sqlOutput.push(`INSERT INTO articles (title, slug, destination, start_date, end_date, content, short_description, cover_url, folder_id, status) ` +
    `VALUES ('${sq(voyage.title)}', '${slug}', '${sq(voyage.destination)}', '${voyage.start_date}', '${voyage.end_date}', ` +
    `'${content}', '${sq(shortDesc)}', ${cover}, (SELECT id FROM folders WHERE slug = '${voyage.folder}'), 'published');`);
}

const newSql = sqlOutput.join('\n');
writeFileSync('./canalblog-import-v2.sql', newSql, 'utf8');
console.log(`✅ Generated: canalblog-import-v2.sql (${newSql.length} bytes)`);
