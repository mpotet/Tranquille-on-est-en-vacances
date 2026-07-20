/**
 * utils.js - Shared response helpers for the Cloudflare Worker
 */

/** JSON response helper */
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export function notFound(msg = 'Not found') {
  return json({ error: msg }, 404);
}

export function badRequest(msg = 'Bad request') {
  return json({ error: msg }, 400);
}

export function unauthorized(msg = 'Unauthorized') {
  return json({ error: msg }, 401);
}

export function forbidden(msg = 'Forbidden') {
  return json({ error: msg }, 403);
}

/** HTML response helper */
export function html(content, status = 200) {
  return new Response(content, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

/** Redirect helper */
export function redirect(location, status = 302) {
  return new Response(null, { status, headers: { Location: location } });
}

/**
 * Parse route parameters from a URL pattern.
 *
 * @example
 *   matchPath('/api/articles/:slug', '/api/articles/my-trip')
 *   // → { slug: 'my-trip' }
 *
 * @param {string} pattern   - Route pattern with :param segments
 * @param {string} pathname  - Actual URL pathname
 * @returns {Record<string,string>|null}
 */
export function matchPath(pattern, pathname) {
  const patParts = pattern.split('/');
  const urlParts = pathname.split('/');
  if (patParts.length !== urlParts.length) return null;

  const params = {};
  for (let i = 0; i < patParts.length; i++) {
    if (patParts[i].startsWith(':')) {
      params[patParts[i].slice(1)] = decodeURIComponent(urlParts[i]);
    } else if (patParts[i] !== urlParts[i]) {
      return null;
    }
  }
  return params;
}
