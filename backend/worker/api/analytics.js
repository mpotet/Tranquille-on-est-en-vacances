/**
 * api/analytics.js - Admin visits dashboard (GET /api/admin/analytics)
 *
 * Aggregates the page_views table (see migrations/006-add-page-views.sql)
 * into everything the admin analytics tab needs in one response: totals +
 * trend vs the previous period, a daily series for the bar chart, a country
 * breakdown, and the most-viewed articles in the period. All in one query
 * pass over a small table (D1/SQLite has no per-request cost concern here at
 * this site's scale) rather than N round trips from the client.
 */

import { json, badRequest } from '../utils.js';

const PERIOD_DAYS = { '7': 7, '30': 30, '90': 90 };

export async function getAnalytics(request, env) {
  const url = new URL(request.url);
  const periodParam = url.searchParams.get('period') || '30';
  const isToday = periodParam === 'today';
  const days = isToday ? null : (PERIOD_DAYS[periodParam] ?? null); // null = 'all' (or 'today', handled separately)

  // SQLite datetime('now') is UTC; page_views.created_at is also UTC
  // (CURRENT_TIMESTAMP default), so comparing them directly is consistent.
  // 'today' compares against the last 24h (rolling), not local calendar
  // midnight — the server has no notion of the visitor's timezone.
  const sinceExpr = isToday ? `datetime('now', '-1 day')` : (days ? `datetime('now', '-${days} days')` : null);
  const prevSinceExpr = isToday ? `datetime('now', '-2 days')` : (days ? `datetime('now', '-${days * 2} days')` : null);

  const whereCurrent = sinceExpr ? `WHERE created_at >= ${sinceExpr}` : '';
  const wherePrev = sinceExpr ? `WHERE created_at >= ${prevSinceExpr} AND created_at < ${sinceExpr}` : null;

  // 'today' groups by hour (one bar per hour of the rolling last 24h) since a
  // single day has nothing to show grouped by day; every other period groups
  // by calendar day as before.
  const bucketExpr = isToday ? `strftime('%Y-%m-%dT%H:00:00', created_at)` : `date(created_at)`;

  const [totalRow, prevTotalRow, countryRows, dailyRows, topArticles] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) AS n FROM page_views ${whereCurrent}`).first(),
    wherePrev ? env.DB.prepare(`SELECT COUNT(*) AS n FROM page_views ${wherePrev}`).first() : Promise.resolve(null),
    env.DB.prepare(`
      SELECT COALESCE(country_code, '??') AS country_code, COUNT(*) AS n
      FROM page_views ${whereCurrent}
      GROUP BY country_code
      ORDER BY n DESC
    `).all(),
    env.DB.prepare(`
      SELECT ${bucketExpr} AS bucket, COUNT(*) AS n
      FROM page_views ${whereCurrent}
      GROUP BY bucket
      ORDER BY bucket ASC
    `).all(),
    env.DB.prepare(`
      SELECT a.id, a.title, a.slug, COUNT(pv.id) AS period_views
      FROM page_views pv
      JOIN articles a ON a.id = pv.article_id
      WHERE pv.article_id IS NOT NULL ${sinceExpr ? `AND pv.created_at >= ${sinceExpr}` : ''}
      GROUP BY a.id
      ORDER BY period_views DESC
      LIMIT 5
    `).all(),
  ]);

  const total = totalRow?.n ?? 0;
  const prevTotal = prevTotalRow?.n ?? null;
  const trendPct = (prevTotal !== null && prevTotal > 0)
    ? Math.round(((total - prevTotal) / prevTotal) * 100)
    : null;

  const countries = (countryRows.results || []).map(r => ({ code: r.country_code, count: r.n }));

  return json({
    period: periodParam,
    granularity: isToday ? 'hour' : 'day',
    total,
    trend_pct: trendPct,
    countries_distinct: countries.filter(c => c.code !== '??').length,
    daily: (dailyRows.results || []).map(r => ({ day: r.bucket, count: r.n })),
    countries,
    top_articles: (topArticles.results || []).map(r => ({ id: r.id, title: r.title, slug: r.slug, views: r.period_views })),
  });
}
