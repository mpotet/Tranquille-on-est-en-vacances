/**
 * pages/recordings.js - Dictaphone : bibliotheque d'enregistrements audio.
 *
 * Pense pour le telephone, en voyage, souvent sans reseau :
 *   - tout enregistrement est d'abord ecrit sur l'appareil (IndexedDB
 *     "tranquille-recordings"), morceau par morceau pendant la prise : une
 *     application fermee ou un telephone qui s'eteint en plein enregistrement
 *     ne perd que la derniere seconde, l'enregistrement est recupere au
 *     prochain lancement ;
 *   - l'envoi au serveur se fait tout seul des que le reseau est la (au
 *     chargement, au retour du reseau, apres chaque prise), et il est
 *     idempotent cote serveur (voir api/recordings.js) ;
 *   - la page se charge hors ligne (cache du service worker) et n'attend
 *     jamais le reseau pour s'afficher : la derniere liste connue du serveur
 *     est gardee localement.
 *
 * REC_CORE_JS (logique) et REC_CSS (styles) servent aussi a l'editeur
 * d'article, pour inserer un enregistrement dans le texte.
 * Attention : ce fichier est fait de template literals ; pas de backtick ni
 * de "dollar-accolade" dans le code client ci-dessous.
 */

import { HEAD, TOAST, NAV } from './shell.js';
import { html } from '../utils.js';

// Icones en SVG inline : elles s'affichent meme hors ligne, quand la police
// d'icones (CDN) n'est pas en cache.
const ICONS = {
  mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2.5" width="6" height="12" rx="3" fill="currentColor"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21m-3.5 0h7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  stop: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.3" fill="currentColor"/><rect x="13.5" y="5" width="4" height="14" rx="1.3" fill="currentColor"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.6v12.8a1 1 0 0 0 1.5.86l10.2-6.4a1 1 0 0 0 0-1.72L9.5 4.74A1 1 0 0 0 8 5.6z" fill="currentColor"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="8.5" width="11" height="11" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  pen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 7h15M10 11v6m4-6v6M6.5 7l1 12.5h9l1-12.5M9.5 7V4.5h5V7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18.5a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 9.5a4.5 4.5 0 0 1-.5 9H7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 16v-5m-2.2 2.2L12 11l2.2 2.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
export { ICONS as REC_ICONS };

export const REC_CSS = `
.rec-ico svg, .rec-btn svg, .rec-item svg, .an-ed svg { width: 1em; height: 1em; display: block; }
/* ── Enregistreur ── */
.recorder { display: flex; flex-direction: column; align-items: center; gap: .9rem; padding: 1.4rem 1rem 1.2rem;
  border-radius: 1.75rem; background: var(--cream); border: 1px solid var(--line); box-shadow: var(--card-shadow); }
.recorder-wave { width: 100%; height: 64px; display: block; }
.recorder-time { font-variant-numeric: tabular-nums; font-size: 2.6rem; font-weight: 800; letter-spacing: .02em; color: var(--ink); line-height: 1; }
.recorder-hint { min-height: 1.1rem; font-size: .8rem; font-weight: 600; color: var(--ink-muted); text-align: center; }
.recorder-hint.is-err { color: var(--danger); }
.recorder-row { display: flex; align-items: center; justify-content: center; gap: 1.6rem; }
.rec-btn { flex: none; display: inline-flex; align-items: center; justify-content: center; border: none; cursor: pointer;
  border-radius: 999px; -webkit-tap-highlight-color: transparent; transition: transform .12s ease, background .2s, box-shadow .2s; }
.rec-btn:active { transform: scale(.94); }
.rec-btn:focus-visible { outline: 3px solid var(--blue); outline-offset: 3px; }
.rec-btn[hidden] { display: none; }
.rec-main { width: 86px; height: 86px; font-size: 2.3rem; color: #fff; background: #E5484D;
  box-shadow: 0 0 0 7px rgba(229,72,77,.16), 0 8px 22px rgba(229,72,77,.35); }
.recorder.is-recording .rec-main { animation: rec-breathe 1.8s ease-in-out infinite; }
.recorder.is-paused .rec-main { background: #F2994A; box-shadow: 0 0 0 7px rgba(242,153,74,.18), 0 8px 22px rgba(242,153,74,.35); }
@keyframes rec-breathe { 0%,100% { box-shadow: 0 0 0 7px rgba(229,72,77,.16), 0 8px 22px rgba(229,72,77,.35); }
  50% { box-shadow: 0 0 0 15px rgba(229,72,77,.08), 0 8px 22px rgba(229,72,77,.35); } }
.rec-side { width: 54px; height: 54px; font-size: 1.35rem; color: var(--ink); background: var(--sand); }
.rec-side:hover { background: var(--sand-deep); }
.rec-label { font-size: .7rem; font-weight: 700; color: var(--ink-muted); text-align: center; margin-top: .3rem; }
.rec-col { display: flex; flex-direction: column; align-items: center; }
.rec-col[hidden] { display: none; }
@media (prefers-reduced-motion: reduce) { .recorder.is-recording .rec-main { animation: none; } }
/* ── Liste ── */
.rec-group { font-size: .72rem; font-weight: 800; text-transform: uppercase; letter-spacing: .14em; color: var(--ink-light); margin: 1.4rem .25rem .5rem; }
.rec-item { border-radius: 1.1rem; background: var(--cream); border: 1px solid var(--line); margin-bottom: .5rem; overflow: hidden; }
.rec-item.is-open { box-shadow: var(--card-shadow); }
.rec-row { display: flex; align-items: center; gap: .8rem; padding: .7rem .8rem; cursor: pointer; }
.rec-play { width: 44px; height: 44px; font-size: 1.05rem; color: #fff; background: var(--blue); }
.rec-play.is-playing { background: var(--ink); }
.rec-info { flex: 1; min-width: 0; }
.rec-title { font-weight: 700; font-size: .95rem; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rec-meta { font-size: .76rem; color: var(--ink-muted); display: flex; align-items: center; gap: .4rem; flex-wrap: wrap; margin-top: .1rem; }
.rec-state { display: inline-flex; align-items: center; gap: .25rem; font-weight: 700; }
.rec-state.is-pending { color: var(--pending); }
.rec-state.is-sent { color: var(--palm); }
.rec-used { font-weight: 700; color: var(--blue); }
.rec-more { padding: 0 .8rem .8rem; }
.rec-more[hidden] { display: none; }
.rec-track { position: relative; height: 6px; border-radius: 999px; background: var(--sand); cursor: pointer; margin: .2rem 0 .35rem; }
.rec-track > span { position: absolute; left: 0; top: 0; bottom: 0; width: 0; border-radius: 999px; background: var(--blue); }
.rec-times { display: flex; justify-content: space-between; font-size: .72rem; font-variant-numeric: tabular-nums; color: var(--ink-muted); }
.rec-actions { display: flex; gap: .5rem; margin-top: .7rem; flex-wrap: wrap; }
.rec-act { display: inline-flex; align-items: center; gap: .4rem; padding: .5rem .85rem; border-radius: 999px; border: 1px solid var(--line);
  background: var(--cream); color: var(--ink); font: inherit; font-size: .8rem; font-weight: 700; cursor: pointer; }
.rec-act:hover { background: var(--blue-light); }
.rec-act.is-danger { color: var(--danger); }
.rec-act.is-primary { background: var(--blue); border-color: var(--blue); color: #fff; }
.rec-rename { width: 100%; font: inherit; font-weight: 700; font-size: .95rem; color: var(--ink); background: var(--cream);
  border: 2px solid var(--blue); border-radius: .6rem; padding: .25rem .5rem; }
.rec-empty { text-align: center; color: var(--ink-muted); padding: 2.2rem 1rem; font-size: .9rem; }
.rec-empty b { display: block; color: var(--ink); font-size: 1rem; margin-bottom: .25rem; }
`;

/* Logique cliente partagee (bibliotheque + editeur). Expose window.Rec. */
export const REC_CORE_JS = `
(function(){
  if (window.Rec) return;
  var ICON = ${JSON.stringify(ICONS)};
  var DB_NAME = 'tranquille-recordings', CACHE_KEY = 'tv_recordings_cache_v1', KEEP_BLOBS = 40;
  var _db = null;
  function db() {
    if (_db) return _db;
    _db = new Promise(function (resolve, reject) {
      if (!('indexedDB' in window)) { reject(new Error('no indexedDB')); return; }
      var req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () {
        var d = req.result;
        if (!d.objectStoreNames.contains('recs')) d.createObjectStore('recs', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('chunks')) d.createObjectStore('chunks', { autoIncrement: true }).createIndex('rec', 'rec');
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
    _db.catch(function () { _db = null; });
    return _db;
  }
  function tx(store, mode, fn) {
    return db().then(function (d) {
      return new Promise(function (resolve, reject) {
        var t = d.transaction(store, mode), out;
        out = fn(t.objectStore(store));
        t.oncomplete = function () { resolve(out && 'result' in out ? out.result : undefined); };
        t.onerror = function () { reject(t.error); };
        t.onabort = function () { reject(t.error); };
      });
    });
  }
  var local = {
    all: function () { return tx('recs', 'readonly', function (s) { return s.getAll(); }).then(function (r) { return r || []; }).catch(function () { return []; }); },
    get: function (id) { return tx('recs', 'readonly', function (s) { return s.get(id); }).catch(function () { return null; }); },
    put: function (rec) { return tx('recs', 'readwrite', function (s) { s.put(rec); }); },
    del: function (id) { return tx('recs', 'readwrite', function (s) { s.delete(id); }).catch(function () {}); },
    addChunk: function (id, blob) { return tx('chunks', 'readwrite', function (s) { s.add({ rec: id, blob: blob }); }).catch(function () {}); },
    chunks: function (id) { return tx('chunks', 'readonly', function (s) { return s.index('rec').getAll(id); }).then(function (r) { return (r || []).map(function (c) { return c.blob; }); }).catch(function () { return []; }); },
    clearChunks: function (id) {
      return tx('chunks', 'readwrite', function (s) {
        var c = s.index('rec').openKeyCursor(IDBKeyRange.only(id));
        c.onsuccess = function () { var cur = c.result; if (cur) { s.delete(cur.primaryKey); cur.continue(); } };
      }).catch(function () {});
    },
  };

  // ── Formats ──
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmt(ms) { var s = Math.max(0, Math.round((ms || 0) / 1000)); return Math.floor(s / 60) + ':' + pad(s % 60); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function defaultTitle(d) {
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + pad(d.getHours()) + 'h' + pad(d.getMinutes());
  }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16); crypto.getRandomValues(b); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var h = Array.prototype.map.call(b, function (x) { return (x + 256).toString(16).slice(1); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }
  function extFor(mime) {
    mime = String(mime || '');
    if (mime.indexOf('mp4') !== -1 || mime.indexOf('aac') !== -1) return 'm4a';
    if (mime.indexOf('webm') !== -1) return 'webm';
    if (mime.indexOf('ogg') !== -1) return 'ogg';
    return 'm4a';
  }
  function emit() { try { window.dispatchEvent(new CustomEvent('rec:change')); } catch (e) {} }

  // ── Liste fusionnee : serveur (derniere copie connue) + appareil ──
  function cached() { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]'); } catch (e) { return []; } }
  function setCached(list) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch (e) {} }
  function list() {
    return local.all().then(function (locals) {
      var byId = {};
      cached().forEach(function (r) { byId[r.id] = { id: r.id, title: r.title, duration_ms: r.duration_ms, recorded_at: r.recorded_at,
        url: r.url, ext: (r.url || '').split('.').pop(), status: 'sent', hasBlob: false, used_in: r.used_in || [] }; });
      locals.forEach(function (l) {
        if (l.status === 'recording') return;
        var e = byId[l.id] || { id: l.id, used_in: [] };
        e.title = l.title; e.duration_ms = l.duration_ms || e.duration_ms; e.recorded_at = l.recorded_at;
        e.ext = l.ext; e.url = '/r2/audio/' + l.id + '.' + l.ext;
        e.hasBlob = !!l.blob; e.status = l.status === 'sent' ? 'sent' : 'pending';
        byId[l.id] = e;
      });
      return Object.keys(byId).map(function (k) { return byId[k]; })
        .sort(function (a, b) { return String(b.recorded_at).localeCompare(String(a.recorded_at)); });
    });
  }
  function fetchJson(url, opts, ms) {
    var ctl = window.AbortController ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, ms || 8000);
    opts = opts || {}; if (ctl) opts.signal = ctl.signal;
    return fetch(url, opts).then(function (r) { clearTimeout(t); return r; }, function (e) { clearTimeout(t); throw e; });
  }
  function refresh() {
    if (!navigator.onLine) return Promise.resolve(false);
    return fetchJson('/api/admin/recordings', { cache: 'no-store' }, 8000)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.recordings) return false;
        setCached(j.recordings);
        // Envoye puis supprime depuis un autre appareil : la copie locale part aussi.
        var ids = {}; j.recordings.forEach(function (r) { ids[r.id] = 1; });
        return local.all().then(function (locals) {
          return Promise.all(locals.filter(function (l) { return l.status === 'sent' && !ids[l.id]; }).map(function (l) { return local.del(l.id); }));
        }).then(function () { emit(); return true; });
      })
      .catch(function () { return false; });
  }

  // ── Envoi des enregistrements en attente ──
  var _syncing = null;
  function sync() {
    if (_syncing) return _syncing;
    if (!navigator.onLine) return Promise.resolve();
    setTimeout(emit, 0);   // "Envoi..." s'affiche pendant la tentative
    _syncing = local.all().then(function (locals) {
      var todo = locals.filter(function (l) { return (l.status === 'pending' && l.blob) || (l.status === 'sent' && l.titleDirty); });
      return todo.reduce(function (p, l) {
        return p.then(function () {
          if (l.status === 'pending') {
            var q = '?title=' + encodeURIComponent(l.title || '') + '&duration_ms=' + (l.duration_ms || 0) + '&recorded_at=' + encodeURIComponent(l.recorded_at);
            return fetchJson('/api/admin/recordings/' + l.id + q, { method: 'PUT', body: l.blob, headers: { 'Content-Type': l.mime || 'application/octet-stream' } }, 120000)
              .then(function (r) {
                if (r.ok) { l.status = 'sent'; l.sentAt = Date.now(); return local.put(l).then(emit); }
                if (r.status === 401) { window.dispatchEvent(new CustomEvent('rec:auth')); throw new Error('auth'); }
              }).catch(function (e) { if (e && e.message === 'auth') throw e; });
          }
          return fetchJson('/api/admin/recordings/' + l.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: l.title }) }, 8000)
            .then(function (r) { if (r.ok || r.status === 404) { delete l.titleDirty; return local.put(l); } }).catch(function () {});
        });
      }, Promise.resolve());
    }).then(prune).then(refresh).catch(function () {}).then(function () { _syncing = null; emit(); });
    return _syncing;
  }
  // Les fichiers deja envoyes restent sur l'appareil (ecoute hors ligne),
  // sauf au-dela des KEEP_BLOBS plus recents.
  function prune() {
    return local.all().then(function (locals) {
      var sent = locals.filter(function (l) { return l.status === 'sent' && l.blob; })
        .sort(function (a, b) { return String(b.recorded_at).localeCompare(String(a.recorded_at)); });
      return Promise.all(sent.slice(KEEP_BLOBS).map(function (l) { delete l.blob; return local.put(l); }));
    });
  }

  // Enregistrement interrompu (application fermee, telephone eteint) :
  // reconstitue a partir des morceaux deja ecrits.
  function recover(exceptId) {
    return local.all().then(function (locals) {
      return Promise.all(locals.filter(function (l) { return l.status === 'recording' && l.id !== exceptId; }).map(function (l) {
        return local.chunks(l.id).then(function (parts) {
          if (!parts.length) return local.del(l.id);
          l.blob = new Blob(parts, { type: l.mime }); l.size = l.blob.size; l.status = 'pending';
          l.title = (l.title || defaultTitle(new Date(l.recorded_at))) + ' (récupéré)';
          return local.put(l).then(function () { return local.clearChunks(l.id); }).then(function () { return l; });
        });
      }));
    }).then(function (r) { var n = (r || []).filter(Boolean).length; if (n) emit(); return n; });
  }

  // ── Actions ──
  function rename(id, title) {
    title = String(title || '').trim().slice(0, 120);
    if (!title) return Promise.resolve(false);
    return local.get(id).then(function (l) {
      var c = cached(), hit = c.filter(function (r) { return r.id === id; })[0];
      if (hit) { hit.title = title; setCached(c); }
      if (l) { l.title = title; if (l.status === 'sent') l.titleDirty = true; return local.put(l); }
      if (!navigator.onLine) throw new Error('offline');
      return fetchJson('/api/admin/recordings/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: title }) }, 8000)
        .then(function (r) { if (!r.ok) throw new Error('server'); });
    }).then(function () { emit(); sync(); return true; });
  }
  function remove(entry) {
    var onServer = entry.status === 'sent';
    if (onServer && !navigator.onLine) return Promise.reject(new Error('offline'));
    var p = onServer ? fetchJson('/api/admin/recordings/' + entry.id, { method: 'DELETE' }, 10000).then(function (r) { if (!r.ok) throw new Error('server'); }) : Promise.resolve();
    return p.then(function () {
      setCached(cached().filter(function (r) { return r.id !== entry.id; }));
      return local.del(entry.id);
    }).then(function () { return local.clearChunks(entry.id); }).then(emit);
  }

  // ── Lecture (un seul son a la fois sur la page) ──
  var audio = new Audio(), current = null, urls = {};
  audio.preload = 'metadata';
  function srcFor(entry) {
    return local.get(entry.id).then(function (l) {
      if (l && l.blob) { if (!urls[entry.id]) urls[entry.id] = URL.createObjectURL(l.blob); return urls[entry.id]; }
      if (!navigator.onLine) return null;
      return entry.url;
    });
  }
  var player = {
    audio: audio,
    current: function () { return current; },
    toggle: function (entry) {
      if (current && current.id === entry.id) {
        if (audio.paused) audio.play().catch(function () {}); else audio.pause();
        return Promise.resolve(true);
      }
      return srcFor(entry).then(function (src) {
        if (!src) return false;
        audio.pause(); current = entry; audio.src = src; audio.currentTime = 0;
        return audio.play().then(function () { return true; }, function () { return false; });
      });
    },
    seek: function (ratio) { if (audio.duration && isFinite(audio.duration)) audio.currentTime = ratio * audio.duration; },
    stop: function () { audio.pause(); current = null; },
  };
  ['play', 'pause', 'ended', 'timeupdate', 'loadedmetadata'].forEach(function (ev) {
    audio.addEventListener(ev, function () { try { window.dispatchEvent(new CustomEvent('rec:player', { detail: { type: ev, id: current && current.id } })); } catch (e) {} });
  });

  // ── Bloc a coller dans un article ──
  function noteHtml(entry) {
    return '<div class="audio-note" contenteditable="false" data-audio-id="' + esc(entry.id) + '" data-src="' + esc(entry.url) +
      '" data-title="' + esc(entry.title || '') + '" data-duration="' + Math.round((entry.duration_ms || 0) / 1000) + '"></div>';
  }
  // Copie : HTML (colle comme un vrai lecteur dans l'editeur) + texte simple.
  function copy(entry) {
    var h = noteHtml(entry), t = '🎙 ' + (entry.title || 'Enregistrement') + ' (' + fmt(entry.duration_ms) + ')';
    if (navigator.clipboard && window.ClipboardItem) {
      try {
        return navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([h], { type: 'text/html' }), 'text/plain': new Blob([t], { type: 'text/plain' }) })])
          .then(function () { return true; }, function () { return legacyCopy(h, t); });
      } catch (e) {}
    }
    return Promise.resolve(legacyCopy(h, t));
  }
  function legacyCopy(h, t) {
    var ok = false;
    function onCopy(e) { e.preventDefault(); e.clipboardData.setData('text/html', h); e.clipboardData.setData('text/plain', t); ok = true; }
    document.addEventListener('copy', onCopy);
    try { document.execCommand('copy'); } catch (e) {}
    document.removeEventListener('copy', onCopy);
    return ok;
  }

  // ── Enregistreur ──
  function pickMime() {
    if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return '';
    var c = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
    for (var i = 0; i < c.length; i++) if (MediaRecorder.isTypeSupported(c[i])) return c[i];
    return '';
  }
  function createRecorder(root, opts) {
    opts = opts || {};
    root.classList.add('recorder');
    root.innerHTML =
      '<canvas class="recorder-wave" aria-hidden="true"></canvas>' +
      '<div class="recorder-time" aria-live="off">0:00</div>' +
      '<div class="recorder-hint" role="status"></div>' +
      '<div class="recorder-row">' +
        '<div class="rec-col" data-r="cancel-col" hidden><button type="button" class="rec-btn rec-side" data-r="cancel" aria-label="Annuler l\\'enregistrement">' + ICON.x + '</button><span class="rec-label">Annuler</span></div>' +
        '<div class="rec-col"><button type="button" class="rec-btn rec-main" data-r="main" aria-label="Enregistrer">' + ICON.mic + '</button><span class="rec-label" data-r="main-label">Enregistrer</span></div>' +
        '<div class="rec-col" data-r="stop-col" hidden><button type="button" class="rec-btn rec-side" data-r="stop" aria-label="Terminer et garder">' + ICON.check + '</button><span class="rec-label">Terminer</span></div>' +
      '</div>';
    var q = function (k) { return root.querySelector('[data-r="' + k + '"]'); };
    var canvas = root.querySelector('canvas'), timeEl = root.querySelector('.recorder-time'), hint = root.querySelector('.recorder-hint');
    var state = 'idle', mr = null, stream = null, chunks = [], rec = null, ctx = null, analyser = null, raf = 0;
    var elapsed = 0, since = 0, lock = null, levels = [], lastMeta = 0, tick = 0;
    function say(t, err) { hint.textContent = t || ''; hint.classList.toggle('is-err', !!err); }
    function now() { return state === 'recording' ? elapsed + (performance.now() - since) : elapsed; }
    function setUi() {
      root.classList.toggle('is-recording', state === 'recording');
      root.classList.toggle('is-paused', state === 'paused');
      var busy = state === 'recording' || state === 'paused';
      q('cancel-col').hidden = !busy; q('stop-col').hidden = !busy;
      var main = q('main');
      main.innerHTML = state === 'recording' ? ICON.pause : ICON.mic;
      main.setAttribute('aria-label', state === 'recording' ? 'Mettre en pause' : state === 'paused' ? 'Reprendre' : 'Enregistrer');
      q('main-label').textContent = state === 'recording' ? 'Pause' : state === 'paused' ? 'Reprendre' : 'Enregistrer';
      main.disabled = state === 'saving';
    }
    function draw() {
      raf = requestAnimationFrame(draw);
      var w = canvas.clientWidth, h = canvas.clientHeight, dpr = window.devicePixelRatio || 1;
      if (canvas.width !== w * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
      var g = canvas.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
      if (analyser && state === 'recording') {
        var buf = new Uint8Array(analyser.fftSize); analyser.getByteTimeDomainData(buf);
        var sum = 0; for (var i = 0; i < buf.length; i++) { var v = (buf[i] - 128) / 128; sum += v * v; }
        if (++tick % 2 === 0) levels.push(Math.min(1, Math.sqrt(sum / buf.length) * 3.2));
      }
      var bar = 4, gap = 3, n = Math.floor(w / (bar + gap));
      while (levels.length > n) levels.shift();
      var color = state === 'idle' ? 'rgba(138,155,172,.35)' : (state === 'paused' ? '#F2994A' : '#E5484D');
      g.fillStyle = color;
      for (var k = 0; k < n; k++) {
        var lv = levels[levels.length - n + k]; if (lv == null) lv = 0;
        var bh = Math.max(3, lv * (h - 6)), x = k * (bar + gap), y = (h - bh) / 2;
        g.beginPath(); if (g.roundRect) g.roundRect(x, y, bar, bh, 2); else g.rect(x, y, bar, bh); g.fill();
      }
      timeEl.textContent = fmt(now());
      if (state === 'recording' && rec && performance.now() - lastMeta > 4000) {
        lastMeta = performance.now(); rec.duration_ms = Math.round(now()); local.put(rec).catch(function () {});
      }
    }
    function wake() {
      if (!('wakeLock' in navigator)) { say('Gardez l\\'écran allumé pendant l\\'enregistrement'); return; }
      navigator.wakeLock.request('screen').then(function (l) { lock = l; }, function () {});
    }
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && (state === 'recording' || state === 'paused') && !lock) wake();
    });
    function cleanup() {
      try { if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
      try { if (ctx) ctx.close(); } catch (e) {}
      try { if (lock) lock.release(); } catch (e) {}
      stream = null; ctx = null; analyser = null; lock = null; mr = null;
    }
    function start() {
      if (!window.isSecureContext) { say('Le micro nécessite une connexion sécurisée (https).', true); return; }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) { say('Ce navigateur ne sait pas enregistrer le son.', true); return; }
      say('');
      navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }).then(function (s) {
        stream = s;
        var mime = pickMime();
        try { mr = mime ? new MediaRecorder(s, { mimeType: mime, audioBitsPerSecond: 64000 }) : new MediaRecorder(s); }
        catch (e) { mr = new MediaRecorder(s); }
        var real = (mr.mimeType || mime || 'audio/mp4').split(';')[0];
        var d = new Date();
        rec = { id: uuid(), title: defaultTitle(d), mime: real, ext: extFor(real), duration_ms: 0, recorded_at: d.toISOString(), status: 'recording' };
        chunks = []; elapsed = 0; levels = [];
        local.put(rec).catch(function () {});
        mr.ondataavailable = function (e) { if (e.data && e.data.size) { chunks.push(e.data); local.addChunk(rec.id, e.data); } };
        mr.onstop = finish;
        try {
          var AC = window.AudioContext || window.webkitAudioContext;
          if (AC) { ctx = new AC(); analyser = ctx.createAnalyser(); analyser.fftSize = 1024; ctx.createMediaStreamSource(s).connect(analyser); }
        } catch (e) {}
        mr.start(1000);
        state = 'recording'; since = performance.now(); setUi(); wake();
        if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
        if (opts.onStart) opts.onStart();
      }, function (err) {
        say(err && err.name === 'NotAllowedError' ? 'Micro refusé : autorisez-le dans les réglages du navigateur.' : 'Impossible d\\'accéder au micro.', true);
      });
    }
    function pause() { if (mr && state === 'recording') { mr.pause(); elapsed = now(); state = 'paused'; setUi(); } }
    function resume() { if (mr && state === 'paused') { mr.resume(); since = performance.now(); state = 'recording'; setUi(); } }
    var discard = false;
    function stop(cancel) {
      if (!mr || (state !== 'recording' && state !== 'paused')) return;
      elapsed = now(); discard = !!cancel; state = 'saving'; setUi();
      try { mr.requestData(); } catch (e) {}
      mr.stop();
    }
    function finish() {
      var r = rec; cleanup();
      if (discard || !chunks.length) {
        local.del(r.id); local.clearChunks(r.id); chunks = []; rec = null; elapsed = 0; levels = [];
        state = 'idle'; setUi(); if (!discard) say('Rien n\\'a été enregistré.', true); if (opts.onIdle) opts.onIdle(); return;
      }
      r.blob = new Blob(chunks, { type: r.mime }); r.size = r.blob.size; r.duration_ms = Math.round(elapsed); r.status = 'pending';
      chunks = [];
      local.put(r).then(function () { return local.clearChunks(r.id); }).then(function () {
        rec = null; elapsed = 0; levels = []; state = 'idle'; setUi();
        say(navigator.onLine ? 'Enregistré ✓' : 'Enregistré sur le téléphone ✓ (envoi au retour du réseau)');
        emit();
        if (opts.onSaved) opts.onSaved({ id: r.id, title: r.title, duration_ms: r.duration_ms, recorded_at: r.recorded_at,
          ext: r.ext, url: '/r2/audio/' + r.id + '.' + r.ext, status: 'pending', hasBlob: true, used_in: [] });
        sync();
      }, function () { state = 'idle'; setUi(); say('Impossible d\\'enregistrer sur le téléphone (stockage plein ?)', true); });
    }
    q('main').addEventListener('click', function () {
      if (state === 'idle') start(); else if (state === 'recording') pause(); else if (state === 'paused') resume();
    });
    q('stop').addEventListener('click', function () { stop(false); });
    q('cancel').addEventListener('click', function () {
      if (now() > 5000 && !confirm('Jeter cet enregistrement ?')) return;
      stop(true);
    });
    window.addEventListener('beforeunload', function (e) { if (state === 'recording' || state === 'paused') { e.preventDefault(); e.returnValue = ''; } });
    setUi(); draw();
    return { busy: function () { return state !== 'idle'; }, currentId: function () { return rec && rec.id; }, start: start };
  }

  window.Rec = { ICON: ICON, local: local, list: list, refresh: refresh, sync: sync, recover: recover, rename: rename, remove: remove,
    syncing: function () { return !!_syncing; },
    player: player, noteHtml: noteHtml, copy: copy, createRecorder: createRecorder, fmt: fmt, esc: esc };
  window.addEventListener('online', function () { sync(); });
})();
`;

const PAGE_CSS = `
.rec-app { max-width: 36rem; margin: 0 auto; padding: 1.25rem 1rem 6rem; }
.rec-top { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .5rem .75rem; margin-bottom: 1rem; }
.rec-top h1 { font-family: "Playfair Display", Georgia, serif; font-size: 1.7rem; font-weight: 700; color: var(--ink); line-height: 1.1; }
.rec-pill { flex: none; display: inline-flex; align-items: center; gap: .35rem; padding: .3rem .7rem; border-radius: 999px;
  font-size: .74rem; font-weight: 700; background: var(--palm-light); color: var(--palm); }
.rec-pill.is-off { background: rgba(var(--apricot-rgb), .25); color: var(--pending); }
.rec-pill .rec-ico { font-size: .95rem; }
`;

export function recordingsPage() {
  return html(`<!DOCTYPE html>
<html lang="fr">
<head>${HEAD('Enregistrements - Tranquille, on est en vacances')}
<style>${REC_CSS}${PAGE_CSS}</style>
</head>
<body class="font-sans antialiased pt-16" style="background:var(--cream)">
${NAV('', true)}
<main class="rec-app">
  <div class="rec-top">
    <h1>Enregistrements</h1>
    <span id="rec-pill" class="rec-pill" role="status"></span>
  </div>
  <div id="recorder"></div>
  <div id="rec-list" aria-live="polite"></div>
</main>
${TOAST}
<script>${REC_CORE_JS}</script>
<script>
// Les pages admin n'ont pas le pied de page qui enregistre le service worker
// (il l'est normalement par l'accueil, point d'entree de l'application).
// Ouvert directement (favori, raccourci), le dictaphone s'en charge : sans
// lui, la page ne se rouvrirait pas hors ligne.
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () {});
</script>
<script>
(function(){
  var R = window.Rec, I = R.ICON, open = null, renaming = null;
  var listEl = document.getElementById('rec-list'), pill = document.getElementById('rec-pill');
  var recorder = R.createRecorder(document.getElementById('recorder'), {
    onSaved: function (e) { open = e.id; render(); },
  });
  function say(t, kind) { if (typeof toast === 'function') toast(t, kind || 'ok'); }
  function dayLabel(iso) {
    var d = new Date(iso), t = new Date(); t.setHours(0, 0, 0, 0);
    var diff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - t) / 86400000);
    if (diff === 0) return "Aujourd'hui";
    if (diff === -1) return 'Hier';
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: d.getFullYear() === t.getFullYear() ? undefined : 'numeric' });
  }
  function hour(iso) { var d = new Date(iso); return String(d.getHours()).padStart(2, '0') + 'h' + String(d.getMinutes()).padStart(2, '0'); }
  var items = [];
  function updatePill() {
    var pending = items.filter(function (e) { return e.status === 'pending'; }).length;
    pill.className = 'rec-pill' + (navigator.onLine && !pending ? '' : ' is-off');
    pill.innerHTML = navigator.onLine
      ? (pending ? '<span class="rec-ico">' + I.cloud + '</span> ' + (R.syncing() ? 'Envoi…' : pending + ' en attente') : '<span class="rec-ico">' + I.check + '</span> Tout est envoyé')
      : '<span class="rec-ico">' + I.cloud + '</span> Hors ligne' + (pending ? ' · ' + pending + ' en attente' : '');
  }
  function row(e) {
    var cur = R.player.current(), playing = cur && cur.id === e.id && !R.player.audio.paused;
    var isOpen = open === e.id;
    var state = e.status === 'pending'
      ? '<span class="rec-state is-pending"><span class="rec-ico">' + I.cloud + '</span>' + (navigator.onLine && R.syncing() ? 'Envoi…' : 'En attente d’envoi') + '</span>'
      : '';
    var used = e.used_in && e.used_in.length ? '<span class="rec-used">· dans ' + (e.used_in.length === 1 ? '« ' + R.esc(e.used_in[0].title) + ' »' : e.used_in.length + ' articles') + '</span>' : '';
    var title = renaming === e.id
      ? '<input class="rec-rename" data-rename="' + e.id + '" value="' + R.esc(e.title) + '" maxlength="120" aria-label="Nom de l\\'enregistrement">'
      : '<div class="rec-title">' + R.esc(e.title || 'Enregistrement') + '</div>';
    return '<div class="rec-item' + (isOpen ? ' is-open' : '') + '" data-id="' + e.id + '">' +
      '<div class="rec-row" data-act="toggle">' +
        '<button type="button" class="rec-btn rec-play' + (playing ? ' is-playing' : '') + '" data-act="play" aria-label="' + (playing ? 'Pause' : 'Écouter') + '">' + (playing ? I.pause : I.play) + '</button>' +
        '<div class="rec-info">' + title + '<div class="rec-meta">' + ((e.title || '').indexOf(hour(e.recorded_at)) === -1 ? '<span>' + hour(e.recorded_at) + '</span><span>·</span>' : '') + '<span>' + R.fmt(e.duration_ms) + '</span>' + state + used + '</div></div>' +
      '</div>' +
      '<div class="rec-more"' + (isOpen ? '' : ' hidden') + '>' +
        '<div class="rec-track" data-act="seek"><span></span></div><div class="rec-times"><span data-cur>0:00</span><span>' + R.fmt(e.duration_ms) + '</span></div>' +
        '<div class="rec-actions">' +
          '<button type="button" class="rec-act" data-act="copy"><span class="rec-ico">' + I.copy + '</span> Copier pour un article</button>' +
          '<button type="button" class="rec-act" data-act="rename"><span class="rec-ico">' + I.pen + '</span> Renommer</button>' +
          '<button type="button" class="rec-act is-danger" data-act="delete"><span class="rec-ico">' + I.trash + '</span> Supprimer</button>' +
        '</div>' +
      '</div></div>';
  }
  function render() {
    return R.list().then(function (list) {
      items = list; updatePill();
      if (!list.length) { listEl.innerHTML = '<div class="rec-empty"><b>Aucun enregistrement pour l\\'instant</b>Appuyez sur le micro pour raconter votre journée. Ça marche aussi sans réseau.</div>'; return; }
      var out = '', last = '';
      list.forEach(function (e) {
        var g = dayLabel(e.recorded_at);
        if (g !== last) { out += '<div class="rec-group">' + R.esc(g) + '</div>'; last = g; }
        out += row(e);
      });
      listEl.innerHTML = out;
      var inp = listEl.querySelector('.rec-rename');
      if (inp) { inp.focus(); inp.select(); }
      progress();
    });
  }
  function entry(id) { return items.filter(function (e) { return e.id === id; })[0]; }
  function progress() {
    var cur = R.player.current(), a = R.player.audio;
    if (!cur) return;
    var it = listEl.querySelector('.rec-item[data-id="' + cur.id + '"]');
    if (!it) return;
    var d = a.duration && isFinite(a.duration) ? a.duration : (cur.duration_ms || 0) / 1000;
    var bar = it.querySelector('.rec-track > span'), c = it.querySelector('[data-cur]');
    if (bar) bar.style.width = (d ? Math.min(100, a.currentTime / d * 100) : 0) + '%';
    if (c) c.textContent = R.fmt(a.currentTime * 1000);
  }
  function commitRename(input) {
    var id = input.getAttribute('data-rename'), v = input.value.trim();
    renaming = null;
    var e = entry(id);
    if (!v || !e || v === e.title) { render(); return; }
    R.rename(id, v).then(render, function (err) {
      say(err && err.message === 'offline' ? 'Connexion nécessaire pour renommer un enregistrement d\\'un autre appareil' : 'Impossible de renommer', 'err');
      render();
    });
  }
  listEl.addEventListener('click', function (ev) {
    var it = ev.target.closest('.rec-item'); if (!it) return;
    var id = it.getAttribute('data-id'), e = entry(id);
    var act = ev.target.closest('[data-act]'); act = act && act.getAttribute('data-act');
    if (!e || ev.target.closest('.rec-rename')) return;
    if (act === 'play') {
      ev.stopPropagation();
      R.player.toggle(e).then(function (ok) {
        if (!ok) say(navigator.onLine ? 'Lecture impossible' : 'Pas disponible hors ligne sur ce téléphone', 'err');
        open = id; render();
      });
    } else if (act === 'seek') {
      var r = ev.target.closest('.rec-track').getBoundingClientRect();
      var cur = R.player.current();
      if (cur && cur.id === id) R.player.seek(Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)));
    } else if (act === 'copy') {
      R.copy(e).then(function (ok) { say(ok ? 'Copié : collez-le dans un article' : 'Copie impossible sur ce navigateur', ok ? 'ok' : 'err'); });
    } else if (act === 'rename') {
      renaming = id; render();
    } else if (act === 'delete') {
      var used = e.used_in && e.used_in.length ? '\\n\\nIl est utilisé dans : ' + e.used_in.map(function (a) { return a.title; }).join(', ') + '. Il disparaîtra de ces articles.' : '';
      if (!confirm('Supprimer « ' + (e.title || 'cet enregistrement') + ' » ?' + used)) return;
      if (R.player.current() && R.player.current().id === id) R.player.stop();
      R.remove(e).then(function () { say('Supprimé'); render(); }, function (err) {
        say(err && err.message === 'offline' ? 'Connexion nécessaire pour supprimer un enregistrement déjà envoyé' : 'Suppression impossible', 'err');
      });
    } else if (act === 'toggle') {
      open = open === id ? null : id; render();
    }
  });
  listEl.addEventListener('keydown', function (ev) {
    if (!ev.target.classList.contains('rec-rename')) return;
    if (ev.key === 'Enter') { ev.preventDefault(); commitRename(ev.target); }
    else if (ev.key === 'Escape') { renaming = null; render(); }
  });
  listEl.addEventListener('focusout', function (ev) { if (ev.target.classList.contains('rec-rename') && renaming) commitRename(ev.target); });
  window.addEventListener('rec:change', function () { if (!renaming) render(); });
  window.addEventListener('rec:player', function (ev) {
    var t = ev.detail.type;
    if (t === 'timeupdate') progress(); else if (!renaming) render();
  });
  window.addEventListener('rec:auth', function () { say('Session expirée : reconnectez-vous pour envoyer les enregistrements (rien n\\'est perdu)', 'err'); });
  window.addEventListener('online', updatePill);
  window.addEventListener('offline', function () { updatePill(); render(); });
  // Affichage immediat depuis l'appareil, puis rattrapage reseau.
  R.recover(recorder.currentId()).then(function (n) {
    if (n) say(n === 1 ? 'Un enregistrement interrompu a été récupéré' : n + ' enregistrements interrompus ont été récupérés');
    return render();
  }).then(function () { return R.sync(); });
  if (location.hash === '#enregistrer') setTimeout(function () { document.querySelector('[data-r="main"]').focus(); }, 300);
})();
</script>
</body>
</html>`);
}
