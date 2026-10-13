/**
 * api/recordings.js - Bibliotheque d'enregistrements audio (admin).
 *
 *   GET    /api/admin/recordings        liste (+ articles qui utilisent chacun)
 *   PUT    /api/admin/recordings/:id    envoi du fichier (corps = audio brut)
 *   PATCH  /api/admin/recordings/:id    { title }
 *   DELETE /api/admin/recordings/:id
 *
 * L'id est un uuid genere par le telephone au moment d'enregistrer, souvent
 * hors ligne. Le PUT est donc idempotent : un envoi rejoue apres une coupure
 * reecrit le meme objet au lieu d'en creer un second. Le fichier est servi
 * par /r2/audio/<id>.<ext> (avec lecture par plages, indispensable a Safari).
 */
import { json, notFound, badRequest } from '../utils.js';

const ID_RE = /^[a-z0-9-]{8,64}$/;
const MAX_BYTES = 60 * 1024 * 1024;   // ~1 h a 128 kbit/s : largement assez pour un message

// Format reel d'apres les premiers octets, jamais d'apres l'en-tete du client.
function sniff(bytes) {
  const b = (i) => bytes[i];
  const ascii = (from, to) => String.fromCharCode(...bytes.slice(from, to));
  if (bytes.length >= 12 && ascii(4, 8) === 'ftyp') return { ext: 'm4a', mime: 'audio/mp4' };
  if (b(0) === 0x1a && b(1) === 0x45 && b(2) === 0xdf && b(3) === 0xa3) return { ext: 'webm', mime: 'audio/webm' };
  if (ascii(0, 4) === 'OggS') return { ext: 'ogg', mime: 'audio/ogg' };
  if (ascii(0, 3) === 'ID3' || (b(0) === 0xff && (b(1) & 0xe0) === 0xe0)) return { ext: 'mp3', mime: 'audio/mpeg' };
  return null;
}

function cleanTitle(t) {
  return String(t || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 120);
}

function toClient(row, usedIn) {
  return {
    id: row.id,
    title: row.title,
    url: '/r2/' + row.r2_key,
    mime: row.mime,
    duration_ms: row.duration_ms,
    size: row.size,
    recorded_at: row.recorded_at,
    used_in: usedIn || [],
  };
}

export async function listRecordings(env) {
  const { results } = await env.DB.prepare('SELECT * FROM recordings ORDER BY recorded_at DESC').all();
  // Ou chaque enregistrement est utilise : une seule requete sur les articles
  // qui contiennent au moins un message vocal.
  const { results: arts } = await env.DB
    .prepare("SELECT id, title, content FROM articles WHERE content LIKE '%audio-note%'").all();
  const usage = new Map();
  for (const a of arts) {
    for (const m of String(a.content || '').matchAll(/data-audio-id="([a-z0-9-]+)"/g)) {
      const list = usage.get(m[1]) || [];
      if (!list.some(x => x.id === a.id)) list.push({ id: a.id, title: a.title });
      usage.set(m[1], list);
    }
  }
  return json({ recordings: results.map(r => toClient(r, usage.get(r.id))) });
}

export async function putRecording(request, env, id) {
  if (!ID_RE.test(id)) return badRequest('id invalide');
  const url = new URL(request.url);
  const buf = new Uint8Array(await request.arrayBuffer());
  if (!buf.length) return badRequest('fichier vide');
  if (buf.length > MAX_BYTES) return badRequest('fichier trop gros');
  const type = sniff(buf);
  if (!type) return badRequest('format audio non reconnu');

  const title = cleanTitle(url.searchParams.get('title'));
  const duration = Math.max(0, Math.min(24 * 3600 * 1000, parseInt(url.searchParams.get('duration_ms'), 10) || 0));
  const recordedAt = /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(url.searchParams.get('recorded_at') || '')
    ? url.searchParams.get('recorded_at') : new Date().toISOString();
  const key = 'audio/' + id + '.' + type.ext;

  await env.PHOTOS.put(key, buf, { httpMetadata: { contentType: type.mime, cacheControl: 'public, max-age=31536000, immutable' } });
  // Rejoue : le titre deja present cote serveur (renomme depuis un autre
  // appareil) l'emporte sur celui, plus ancien, de l'envoi en attente.
  await env.DB.prepare(`
    INSERT INTO recordings (id, title, r2_key, mime, duration_ms, size, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET r2_key = excluded.r2_key, mime = excluded.mime,
      duration_ms = excluded.duration_ms, size = excluded.size
  `).bind(id, title, key, type.mime, duration, buf.length, recordedAt).run();

  const row = await env.DB.prepare('SELECT * FROM recordings WHERE id = ?').bind(id).first();
  return json({ recording: toClient(row) });
}

export async function patchRecording(request, env, id) {
  if (!ID_RE.test(id)) return badRequest('id invalide');
  const body = await request.json().catch(() => null);
  if (!body || typeof body.title !== 'string') return badRequest('title manquant');
  const res = await env.DB.prepare('UPDATE recordings SET title = ? WHERE id = ?').bind(cleanTitle(body.title), id).run();
  if (!res.meta.changes) return notFound('enregistrement introuvable');
  return json({ ok: true });
}

export async function deleteRecording(env, id) {
  if (!ID_RE.test(id)) return badRequest('id invalide');
  const row = await env.DB.prepare('SELECT r2_key FROM recordings WHERE id = ?').bind(id).first();
  if (!row) return json({ ok: true });   // deja supprime : idempotent
  await env.PHOTOS.delete(row.r2_key).catch(() => {});
  await env.DB.prepare('DELETE FROM recordings WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
