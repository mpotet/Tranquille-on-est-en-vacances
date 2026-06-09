#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const sql = readFileSync('./canalblog-import.sql', 'utf8');

// Extract first article's UPDATE statement to understand its format
const lines = sql.split('\n');
let inArticle = false;
let articleLines = [];

for (const line of lines) {
  if (line.startsWith('-- Article: Maroc Octobre 2011')) {
    inArticle = true;
  }
  if (inArticle) {
    articleLines.push(line);
    if (line.includes('WHERE slug') && line.includes(';')) {
      break;
    }
  }
}

console.log('First UPDATE statement:');
console.log(articleLines.slice(0, 10).join('\n'));
console.log('...\n[total ' + articleLines.length + ' lines]\n');

// Check if the UPDATE has complete content
const fullUpdate = articleLines.join('\n');
console.log('Total length:', fullUpdate.length);
console.log('Starts with:', fullUpdate.substring(0, 100));
console.log('Ends with:', fullUpdate.substring(fullUpdate.length - 100));
