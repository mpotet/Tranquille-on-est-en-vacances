/**
 * TNR - Articles "jour par jour" (worker/helpers/days.js)
 *
 * Fonctions pures, aucune I/O. Le rendu de la page publique est couvert par
 * le smoke HTTP (03).
 *
 * Ce qui compte ici :
 *   - un recit unique (tous les articles existants) n'est JAMAIS pris pour un
 *     article jour par jour, et ressort intact de chaque fonction ;
 *   - le decoupage ne perd ni ne melange aucun jour ;
 *   - la notification dit quel jour est nouveau ou modifie, et ne se
 *     declenche pas sur une simple difference d'attributs d'editeur.
 */
import { isDaysContent, isMapEnabled, mapStops, parseDays, dayNumber, dayAnchor, dayLabel, fmtDayShort, diffDays, daysToHeadings } from '../worker/helpers/days.js';
import { phase, test, endPhase, ok, eq, match, noMatch } from './runner.js';

const sec = (date, title, html) => `<section class="trip-day" data-day="${date}" data-title="${title}">${html}</section>`;

export default async function run() {
  phase('Jour par jour › Detection');

  await test('un recit unique n est pas un article jour par jour', () => {
    ok(!isDaysContent('<p>Recit.</p><figure class="img-full"><img src="/r2/a.webp"></figure>'), 'recit HTML');
    ok(!isDaysContent('# Titre\n\nTexte markdown'), 'markdown legacy');
    ok(!isDaysContent(''), 'contenu vide');
    // Une <section> ordinaire (collee depuis une page web) ne suffit pas.
    ok(!isDaysContent('<section><p>x</p></section>'), 'section sans classe trip-day');
  });

  await test('un article jour par jour est reconnu', () => {
    ok(isDaysContent(sec('2026-09-01', '', '<p>a</p>')), 'premier bloc trip-day');
    ok(isDaysContent('  \n' + sec('2026-09-01', '', '')), 'espaces en tete toleres');
  });

  await test('les fonctions laissent un recit unique intact', () => {
    const recit = '<p>Recit.</p><h2>Etape</h2><p>Suite.</p>';
    eq(parseDays(recit).length, 0, 'parseDays');
    eq(daysToHeadings(recit, '2026-09-01'), recit, 'export PDF/Word inchange');
    const d = diffDays(recit, recit + '<p>ajout</p>');
    eq(d.added.length + d.modified.length, 0, 'pas de notification de jour pour un recit unique');
  });

  endPhase();
  phase('Jour par jour › Decoupage');

  await test('chaque jour garde sa date, son titre et son contenu', () => {
    const days = parseDays(sec('2026-09-01', 'Arriv&eacute;e', '<p>J1</p>') + sec('2026-09-02', 'Petra &quot;rose&quot;', '<p>J2</p><figure class="img-full"><img src="/r2/p.webp"></figure>'));
    eq(days.length, 2);
    eq(days[0].date, '2026-09-01');
    eq(days[1].title, 'Petra "rose"', 'titre decode');
    match(days[1].html, /\/r2\/p\.webp/, 'image du jour conservee');
  });

  await test('les jours sont remis dans l ordre chronologique', () => {
    const days = parseDays(sec('2026-09-03', '', 'c') + sec('2026-09-01', '', 'a') + sec('2026-09-02', '', 'b'));
    eq(days.map(d => d.html).join(''), 'abc');
  });

  await test('numero et ancre du jour', () => {
    eq(dayNumber('2026-09-01', '2026-09-01', 0), 1, 'jour de depart = Jour 1');
    eq(dayNumber('2026-09-04', '2026-09-01', 1), 4, 'un jour saute garde son vrai numero');
    eq(dayNumber('2026-08-30', '2026-09-01', 0), 1, 'avant le depart : jamais Jour 0 ou negatif');
    eq(dayNumber('', '2026-09-01', 2), 3, 'sans date : sa position');
    eq(dayAnchor('2026-09-04', 0), 'jour-2026-09-04');
    eq(fmtDayShort('2026-09-03'), 'jeu. 3 sept.');
    eq(dayLabel({ date: '2026-09-03', title: 'Wadi Rum' }, '2026-09-01', 0), 'Jour 3 · jeu. 3 sept. · Wadi Rum');
  });

  await test('export PDF/Word : un intertitre par jour, rien de perdu', () => {
    const out = daysToHeadings(sec('2026-09-01', 'Amman', '<p>J1</p>') + sec('2026-09-02', '', '<p>J2</p>'), '2026-09-01');
    match(out, /<h2>Jour 1 · mar\. 1 sept\. · Amman<\/h2>\s*<p>J1<\/p>/);
    match(out, /<h2>Jour 2 · mer\. 2 sept\.<\/h2>\s*<p>J2<\/p>/);
    noMatch(out, /trip-day/, 'plus aucun bloc section dans l export');
  });

  endPhase();
  phase('Jour par jour › Notifications');

  const v1 = sec('2026-09-01', 'Amman', '<p>Arrivee.</p>') + sec('2026-09-02', '', '<p>Petra.</p>');

  await test('un jour ajoute est annonce comme nouveau', () => {
    const d = diffDays(v1, v1 + sec('2026-09-03', 'Wadi Rum', '<p>Desert.</p>'));
    eq(d.added.length, 1);
    eq(d.added[0].date, '2026-09-03');
    eq(d.added[0].position, 2, 'position pour le numero et l ancre');
    eq(d.modified.length, 0, 'les autres jours ne sont pas "modifies"');
  });

  await test('un jour modifie est designe precisement', () => {
    const d = diffDays(v1, v1.replace('Petra.', 'Petra, enfin.'));
    eq(d.added.length, 0);
    eq(d.modified.map(x => x.date).join(), '2026-09-02');
  });

  await test('un jour ajoute mais encore vide ne notifie pas', () => {
    const d = diffDays(v1, v1 + sec('2026-09-03', '', '<p><br></p>'));
    eq(d.added.length, 0);
  });

  await test('les attributs de l editeur ne comptent pas comme une modification', () => {
    const avant = sec('2026-09-01', '', '<figure class="img-full"><img src="/r2/a.webp" alt=""></figure><p>Texte</p>');
    const apres = sec('2026-09-01', '', '<figure class="img-full" contenteditable="false"><img draggable="false" loading="lazy" decoding="async" src="/r2/a.webp" alt=""><button type="button" class="img-delete">×</button></figure><p>Texte</p>');
    const d = diffDays(avant, apres);
    eq(d.added.length + d.modified.length, 0, 'aucune notification parasite');
  });

  await test('une photo ajoutee a un jour compte comme une modification', () => {
    const d = diffDays(v1, v1.replace('<p>Petra.</p>', '<p>Petra.</p><figure class="img-full"><img src="/r2/n.webp"></figure>'));
    eq(d.modified.length, 1);
  });

  endPhase();
  phase('Jour par jour › Carte');

  const geo = (date, city, lat, lon, extra = '') =>
    `<section class="trip-day" data-day="${date}" data-title=""${city ? ` data-city="${city}"` : ''}${lat != null ? ` data-lat="${lat}" data-lon="${lon}"` : ''}${extra}><p>${date}</p></section>`;

  await test('la carte n est active que sur demande', () => {
    ok(!isMapEnabled(geo('2026-09-01', 'Rabat', 34.02, -6.83)), 'ville sans data-map : pas de carte');
    ok(isMapEnabled(geo('2026-09-01', 'Rabat', 34.02, -6.83, ' data-map="1"')), 'data-map="1"');
    ok(!isMapEnabled('<p>Recit <section class="trip-day" data-map="1"></section></p>'), 'recit unique : jamais de carte');
  });

  await test('ville et coordonnees relues, valeurs invalides ignorees', () => {
    const [a, b, c] = parseDays(geo('2026-09-01', 'Rabat', 34.02, -6.83) + geo('2026-09-02', 'Ailleurs', 'abc', 999) + geo('2026-09-03', '', null));
    eq(a.city, 'Rabat'); eq(a.lat, 34.02); eq(a.lon, -6.83);
    eq(b.city, 'Ailleurs', 'ville gardee meme sans coordonnees valides');
    eq(b.lat, null); eq(b.lon, null);
    eq(c.city, ''); eq(c.lat, null);
  });

  await test('etapes : jours consecutifs dans la meme ville regroupes, jours non places ignores', () => {
    const content = geo('2026-09-01', 'Rabat', 34.02, -6.83) + geo('2026-09-02', 'Rabat', 34.02, -6.83)
      + geo('2026-09-03', 'Inconnue', null) + geo('2026-09-04', 'Fes', 34.03, -5.0) + geo('2026-09-05', 'Rabat', 34.02, -6.83);
    const stops = mapStops(parseDays(content), '2026-09-01');
    eq(stops.length, 3, 'Rabat (J1-J3 ignore) / Fes / Rabat');
    eq(stops[0].days.map(d => d.num).join(','), '1,2');
    eq(stops[0].days[0].anchor, 'jour-2026-09-01');
    eq(stops[1].city, 'Fes'); eq(stops[1].days[0].num, 4);
    eq(stops[2].days[0].num, 5, 'retour a Rabat = nouvelle etape');
  });

  endPhase();
}
