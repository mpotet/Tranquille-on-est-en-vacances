/**
 * helpers/days.js - Articles "jour par jour".
 *
 * Un article jour par jour n'a ni table ni colonne a lui : son `content` est
 * une suite de blocs
 *
 *   <section class="trip-day" data-day="2026-09-03" data-title="Arrivee a Atar">
 *     ...HTML de la journee, tel que l'editeur le produit...
 *   </section>
 *
 * Choix delibere : tout ce qui lit `content` (galerie, export PDF/Word,
 * recherche, temps de lecture, file hors ligne, brouillons) continue de
 * fonctionner tel quel, aucune migration n'est necessaire, et un article
 * "recit unique" - tous les articles existants - n'a simplement pas ces blocs.
 * Le mode se deduit du contenu, il ne peut donc pas se desynchroniser.
 */

const DAY_BLOCK_RE = /<section\b([^>]*\bclass="trip-day"[^>]*)>([\s\S]*?)<\/section>/gi;

function attr(attrs, name) {
  const m = attrs.match(new RegExp('\\b' + name + '="([^"]*)"', 'i'));
  return m ? decodeAttr(m[1]) : '';
}

function decodeAttr(s) {
  return String(s)
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

export function escAttr(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** true si le contenu est celui d'un article jour par jour. */
export function isDaysContent(content) {
  return /^\s*<section\b[^>]*\bclass="trip-day"/i.test(String(content || ''));
}

/**
 * Decoupe un contenu jour par jour en [{ date, title, html }], dans l'ordre
 * chronologique (tri stable : deux blocs du meme jour gardent leur ordre).
 * Un contenu "recit unique" renvoie [].
 */
export function parseDays(content) {
  const src = String(content || '');
  if (!isDaysContent(src)) return [];
  const days = [];
  let m;
  DAY_BLOCK_RE.lastIndex = 0;
  while ((m = DAY_BLOCK_RE.exec(src))) {
    days.push({ date: attr(m[1], 'data-day'), title: attr(m[1], 'data-title'), html: m[2] });
  }
  return days
    .map((d, i) => ({ d, i }))
    .sort((a, b) => (a.d.date || '9999').localeCompare(b.d.date || '9999') || a.i - b.i)
    .map(x => x.d);
}

/**
 * Numero du jour dans le voyage : Jour 1 = date de debut. Un jour sans date
 * ou anterieur au debut retombe sur sa position, pour ne jamais afficher
 * "Jour 0" ou "Jour -2".
 */
export function dayNumber(date, startDate, position) {
  const d = Date.parse(date + 'T00:00:00Z');
  const s = Date.parse(String(startDate || '') + 'T00:00:00Z');
  if (!isNaN(d) && !isNaN(s) && d >= s) return Math.round((d - s) / 86400000) + 1;
  return position + 1;
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

/** "mer. 3 sept." - court, pour la frise et les notifications. */
export function fmtDayShort(date) {
  const t = Date.parse(date + 'T00:00:00Z');
  if (isNaN(t)) return '';
  const d = new Date(t);
  return `${JOURS[d.getUTCDay()]} ${d.getUTCDate()} ${MOIS[d.getUTCMonth()]}`;
}

/** Ancre stable d'un jour dans la page publique. */
export function dayAnchor(date, position) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? 'jour-' + date : 'jour-n' + (position + 1);
}

/** Libelle complet : "Jour 3 · mer. 3 sept. · Arrivee a Atar". */
export function dayLabel(day, startDate, position) {
  return [`Jour ${dayNumber(day.date, startDate, position)}`, fmtDayShort(day.date), day.title]
    .filter(Boolean).join(' · ');
}

// Signature du contenu "visible" d'un jour : texte + images. Les attributs
// que l'editeur ajoute ou retire d'une ouverture a l'autre (draggable,
// loading, boutons de controle...) ne doivent pas faire croire a une
// modification et declencher une notification pour rien.
function daySignature(day) {
  const html = String(day.html || '')
    .replace(/<button\b[\s\S]*?<\/button>/gi, '')
    .replace(/<div\b[^>]*(?:data-editor-only="1"|class="[^"]*\bimg-alt-preview\b)[^>]*>[\s\S]*?<\/div>/gi, '');
  const imgs = [...html.matchAll(/<img\b[^>]*\bsrc="([^"]*)"/gi)].map(m => m[1]).join('|');
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  return (day.title || '').trim() + '\u0000' + text + '\u0000' + imgs;
}

/**
 * Compare deux versions d'un article jour par jour.
 * Renvoie { added: [jour...], modified: [jour...] }, chaque jour portant
 * aussi son `position` dans la nouvelle version (pour le numero et l'ancre).
 */
export function diffDays(oldContent, newContent) {
  const before = parseDays(oldContent);
  const after = parseDays(newContent);
  const byDate = new Map(before.map(d => [d.date, d]));
  const added = [], modified = [];
  after.forEach((d, position) => {
    const prev = byDate.get(d.date);
    if (!prev) { if (daySignature(d).replace(/\u0000/g, '')) added.push({ ...d, position }); }
    else if (daySignature(prev) !== daySignature(d)) modified.push({ ...d, position });
  });
  return { added, modified };
}

/**
 * Pour l'export PDF/Word : remplace chaque bloc par un intertitre suivi du
 * texte du jour. Un recit unique est renvoye tel quel.
 */
export function daysToHeadings(content, startDate) {
  const days = parseDays(content);
  if (!days.length) return content;
  return days.map((d, i) => `<h2>${escAttr(dayLabel(d, startDate, i))}</h2>\n${d.html}`).join('\n');
}
