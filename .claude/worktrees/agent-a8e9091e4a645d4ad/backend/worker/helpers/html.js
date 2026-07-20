/**
 * HTML escaping and safe rendering utilities
 * Prevents XSS and quote injection attacks
 */

export function safeAttr(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function safeText(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function safeUrl(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.startsWith('javascript:') || str.startsWith('data:')) return '';
  return safeAttr(str);
}
