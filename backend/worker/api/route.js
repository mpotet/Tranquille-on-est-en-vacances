/**
 * api/route.js - Trace routier entre deux etapes de la carte du voyage.
 *
 *   GET /api/route?from=lon,lat&to=lon,lat  →  { coords: [[lon, lat], ...] | null }
 *
 * Calcule par OSRM (serveur public du projet, donnees OpenStreetMap, sans
 * cle). `coords: null` = pas de route credible : la carte trace alors un arc
 * "a vol d'oiseau" pour ce trajet (vol, traversee en mer, desert sans piste).
 *
 * Le serveur OSRM public demande un usage modere : chaque trajet n'est donc
 * calcule qu'une fois, puis garde dans R2 (cache/routes/...). L'API Cache de
 * Cloudflare ne servirait a rien ici, elle est inactive sur *.workers.dev.
 * Une panne passagere d'OSRM n'est pas mise en cache, le trajet sera
 * retente au prochain affichage.
 */

const OSRM = 'https://router.project-osrm.org/route/v1/driving/';
const MAX_KM = 1500;   // au-dela, c'est un vol : pas de route a chercher
const DETOUR = 3;      // route > 3x le vol d'oiseau : ferry ou contournement absurde
const CACHE_PREFIX = 'cache/routes/v2/';
const TOLERANCE = 0.001; // degres (~100 m) : lisse au zoom d'une region, leger a stocker

function parsePoint(s) {
  const m = /^(-?\d{1,3}(?:\.\d{1,7})?),(-?\d{1,2}(?:\.\d{1,7})?)$/.exec(String(s || ''));
  if (!m) return null;
  const lon = Number(m[1]), lat = Number(m[2]);
  if (Math.abs(lon) > 180 || Math.abs(lat) > 90) return null;
  return [Number(lon.toFixed(5)), Number(lat.toFixed(5))];
}

function distanceKm(a, b) {
  const rad = (d) => d * Math.PI / 180;
  const dLat = rad(b[1] - a[1]), dLon = rad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// Douglas-Peucker : la geometrie complete d'OSRM compte des milliers de
// points ; "simplified" en garde trop peu (trace anguleux des qu'on zoome).
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop();
    const [ax, ay] = pts[i], [bx, by] = pts[j];
    const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
    let max = 0, at = -1;
    for (let k = i + 1; k < j; k++) {
      const [px, py] = pts[k];
      let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
      t = Math.max(0, Math.min(1, t));
      const ex = px - (ax + t * dx), ey = py - (ay + t * dy), d = ex * ex + ey * ey;
      if (d > max) { max = d; at = k; }
    }
    if (at !== -1 && max > tol * tol) { keep[at] = 1; stack.push([i, at], [at, j]); }
  }
  return pts.filter((_, k) => keep[k]);
}

function reply(body, cacheable) {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheable ? 'public, max-age=2592000' : 'no-store',
    },
  });
}

/** Interroge OSRM. Renvoie { coords } (coords null = pas de route), ou null si OSRM est injoignable. */
async function askOsrm(a, b) {
  let res;
  try {
    res = await fetch(OSRM + a.join(',') + ';' + b.join(',') + '?overview=full&geometries=geojson', {
      headers: { 'User-Agent': 'tranquille-vacances (blog de voyage familial)' },
      signal: AbortSignal.timeout(6000),
    });
  } catch { return null; }
  if (res.status === 429 || res.status >= 500) return null;
  const data = await res.json().catch(() => null);
  if (!data) return null;
  const route = data.code === 'Ok' && data.routes && data.routes[0];
  if (!route || !route.geometry || !Array.isArray(route.geometry.coordinates)) return { coords: null };
  if (route.distance / 1000 > distanceKm(a, b) * DETOUR + 20) return { coords: null };
  const pts = simplify(route.geometry.coordinates, TOLERANCE).map(p => [Number(p[0].toFixed(5)), Number(p[1].toFixed(5))]);
  // OSRM part de la route la plus proche : on raccroche le trace aux reperes.
  return { coords: [a, ...pts, b] };
}

export async function getRoute(request, env, ctx) {
  const url = new URL(request.url);
  const a = parsePoint(url.searchParams.get('from'));
  const b = parsePoint(url.searchParams.get('to'));
  if (!a || !b) return new Response(JSON.stringify({ error: 'from/to invalides' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  const km = distanceKm(a, b);
  if (km < 0.05 || km > MAX_KM) return reply({ coords: null }, true);

  const key = CACHE_PREFIX + a.join(',') + ';' + b.join(',') + '.json';
  const hit = await env.PHOTOS.get(key).catch(() => null);
  if (hit) return reply(await hit.json(), true);

  const result = await askOsrm(a, b);
  if (!result) return reply({ coords: null }, false);
  ctx.waitUntil(env.PHOTOS.put(key, JSON.stringify(result), { httpMetadata: { contentType: 'application/json' } }).catch(() => {}));
  return reply(result, true);
}
