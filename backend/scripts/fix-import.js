#!/usr/bin/env node
/**
 * fix-import.js - Generate proper INSERT statements from the corrupted import file
 * The original import-canalblog.js generated UPDATE statements with no WHERE clause
 * This script reads the article content and generates proper INSERT statements
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

function getFolderIdBySql(slug) {
  return `(SELECT id FROM folders WHERE slug = '${slug}')`;
}

const oldSql = readFileSync('./canalblog-import.sql', 'utf8');
const lines = oldSql.split('\n');

const sqlOutput = [];
sqlOutput.push('-- =====================================================');
sqlOutput.push('-- Canalblog import - FIXED with proper INSERT statements');
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

// Extract article content by title
const articlesByTitle = {};
let currentTitle = null;

for (const line of lines) {
  if (line.startsWith('-- Article: ')) {
    currentTitle = line.substring(12).trim();
    articlesByTitle[currentTitle] = {
      content: '',
      cover: null,
    };
  } else if (currentTitle && line.startsWith(`UPDATE articles SET content = '`)) {
    // Extract content from UPDATE statement
    const contentMatch = line.match(/content = '(.+?)(?:',\s*short_description|$)/s);
    if (contentMatch) {
      articlesByTitle[currentTitle].content = contentMatch[1];
    }

    const coverMatch = line.match(/cover_url = '(.+?)'/);
    if (coverMatch) {
      articlesByTitle[currentTitle].cover = coverMatch[1];
    }
  }
}

// Generate INSERT statements
sqlOutput.push('-- Articles');
for (const voyage of VOYAGES) {
  const slug = slugify(voyage.title);
  const article = articlesByTitle[voyage.title] || {};
  const content = sq(article.content || '');
  const shortDesc = content.substring(0, 200).trim();
  const cover = article.cover ? `'${sq(article.cover)}'` : 'NULL';
  const folderId = getFolderIdBySql(voyage.folder);

  sqlOutput.push(`INSERT INTO articles (title, slug, destination, start_date, end_date, content, short_description, cover_url, folder_id, status) ` +
    `VALUES ('${sq(voyage.title)}', '${slug}', '${sq(voyage.destination)}', '${voyage.start_date}', '${voyage.end_date}', ` +
    `'${content}', '${sq(shortDesc)}', ${cover}, ${folderId}, 'published');`);
}

const newSql = sqlOutput.join('\n');
writeFileSync('./canalblog-import-fixed.sql', newSql, 'utf8');
console.log('✅ Generated: canalblog-import-fixed.sql');
console.log('\nNext: npx wrangler d1 execute tranquille-vacances-db --local --file=scripts/canalblog-import-fixed.sql');
