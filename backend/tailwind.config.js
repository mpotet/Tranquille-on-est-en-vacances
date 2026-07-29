/**
 * tailwind.config.js — replaces the cdn.tailwindcss.com <script> (JIT-compiled
 * in every visitor's browser on every page load, no purge, no minification)
 * with a build-time static stylesheet. Same config Tailwind CDN was given
 * inline in shell.js's <head> (fontFamily extend) — kept identical so no
 * class resolves differently.
 *
 * `content` must cover every file whose template-literal strings contain
 * Tailwind class names, since Tailwind only keeps classes it can find as
 * literal text in these files — dynamically *constructed* class strings
 * (e.g. `'bg-' + color + '-500'`) would NOT be detected; the codebase doesn't
 * do that (verified: classes are written as whole literal strings, even
 * inside JS ternaries), so a plain content scan is safe here.
 */
export default {
  content: [
    './worker/**/*.js',
    './public/**/*.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
    },
  },
  // The design system's own CSS (in shell.js's <style>) already reassigns
  // color/background utilities to design tokens via !important overrides —
  // safelist keeps those base utility classes generated even if Tailwind's
  // scanner doesn't find every one as a literal string in some edge case.
  safelist: [
    { pattern: /^(bg|text|border)-(stone|red|amber|emerald|sky|blue|green|orange)-(50|100|400|500|600|700|800|900)$/ },
  ],
  plugins: [],
};
