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

/** HTML response helper. `extraHeaders` lets callers add e.g. Cache-Control. */
export function html(content, status = 200, extraHeaders = {}) {
  return new Response(content, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', ...extraHeaders },
  });
}

/** Redirect helper */
export function redirect(location, status = 302) {
  return new Response(null, { status, headers: { Location: location } });
}

// Zero-width/invisible characters copy-paste commonly smuggles into a
// pasted email address: NBSP (U+00A0), zero-width space/joiners
// (U+200B-200D), BOM (U+FEFF). They pass through .trim() (leading/trailing
// only) but land *inside* the address, silently failing the
// /^[^@\s]+@[^@\s]+\.[^@\s]+$/ check even though the address looks correct.
const INVISIBLE_CODEPOINTS = new Set([0x00A0, 0x200B, 0x200C, 0x200D, 0xFEFF]);

/** Trim + strip invisible characters commonly pasted into email fields. */
export function cleanEmailInput(value) {
  const s = String(value || '');
  let out = '';
  for (const ch of s) {
    if (!INVISIBLE_CODEPOINTS.has(ch.codePointAt(0))) out += ch;
  }
  return out.trim();
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
      // A malformed percent-escape (e.g. /voyage/%E0%A4) makes
      // decodeURIComponent throw a URIError; treat it as "no match" so the
      // router falls through to a clean 404 instead of an unhandled 500.
      try {
        params[patParts[i].slice(1)] = decodeURIComponent(urlParts[i]);
      } catch {
        return null;
      }
    } else if (patParts[i] !== urlParts[i]) {
      return null;
    }
  }
  return params;
}
