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
  // midnight - the server has no notion of the visitor's timezone.
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
    // Grouped by city (not just country) so the dashboard can show "Paris,
    // France" rather than just "France" - city/region/country all come from
    // Cloudflare's edge geolocation (see page_views schema comment), no IP
    // ever stored. Two visitors from different cities in the same country
    // must stay distinct rows here; country-level totals are derived by
    // summing these rows client-side in countries_distinct below.
    env.DB.prepare(`
      SELECT COALESCE(country_code, '??') AS country_code, city, COUNT(*) AS n
      FROM page_views ${whereCurrent}
      GROUP BY country_code, city
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

  // One row per (city, country) pair - the client renders "Paris, France".
  // Rows with no city (older data predating city tracking, or a request
  // Cloudflare couldn't resolve) fall back to just the country/"Inconnu".
  const locations = (countryRows.results || []).map(r => ({ code: r.country_code, city: r.city || null, count: r.n }));
  const countriesDistinct = new Set(locations.filter(l => l.code !== '??').map(l => l.code)).size;

  // The GROUP BY above only emits a bucket when it has at least one visit, so
  // e.g. hours 19:00 and 21:00 could sit right next to each other in the array
  // with no trace of the empty 20:00 between them - the chart then draws them
  // as adjacent bars, misleadingly implying they're consecutive. Fill in every
  // expected bucket (all 24 hours for "today", every calendar day for a fixed
  // period, every day from the first-ever visit to today for "all") with 0
  // where there's no data, so gaps render as visible empty bars instead of
  // being silently skipped.
  const dailyMap = new Map((dailyRows.results || []).map(r => [r.bucket, r.n]));
  let daily;
  if (isToday) {
    // 24 rolling hourly buckets ending at the current UTC hour.
    const now = new Date();
    now.setUTCMinutes(0, 0, 0);
    daily = [];
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600_000);
      const bucket = d.toISOString().slice(0, 13) + ':00:00';
      daily.push({ day: bucket, count: dailyMap.get(bucket) || 0 });
    }
  } else {
    // Fixed period: exactly `days` calendar days ending today. "all": span
    // from the earliest recorded visit to today (falls back to just today if
    // there's no data yet at all).
    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);
    let spanDays = days;
    if (!spanDays) {
      const firstBucket = (dailyRows.results || [])[0]?.bucket;
      spanDays = firstBucket
        ? Math.floor((todayUTC - new Date(firstBucket + 'T00:00:00Z')) / 86_400_000) + 1
        : 1;
    }
    daily = [];
    for (let i = spanDays - 1; i >= 0; i--) {
      const d = new Date(todayUTC.getTime() - i * 86_400_000);
      const bucket = d.toISOString().slice(0, 10);
      daily.push({ day: bucket, count: dailyMap.get(bucket) || 0 });
    }
  }

  return json({
    period: periodParam,
    granularity: isToday ? 'hour' : 'day',
    total,
    trend_pct: trendPct,
    countries_distinct: countriesDistinct,
    daily,
    locations,
    top_articles: (topArticles.results || []).map(r => ({ id: r.id, title: r.title, slug: r.slug, views: r.period_views })),
  });
}
