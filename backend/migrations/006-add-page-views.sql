-- Detailed, timestamped visit log to power an admin analytics dashboard
-- (period breakdowns, per-country/city charts) — the existing `view_count`
-- column on articles stays as-is (fast running total, used for "most read"
-- sorting); this table adds the historical detail it never had.
--
-- Privacy: no IP address is ever stored. city/region/country come straight
-- from Cloudflare's edge geolocation (request.cf.*), resolved server-side
-- from the connecting IP without that IP ever touching the database.
CREATE TABLE IF NOT EXISTS page_views (
  id             INTEGER  PRIMARY KEY AUTOINCREMENT,
  article_id     INTEGER  REFERENCES articles(id) ON DELETE SET NULL,
  path           TEXT     NOT NULL,
  country_code   TEXT,               -- ISO 3166-1 alpha-2, e.g. 'FR'
  region         TEXT,               -- e.g. 'Île-de-France'
  city           TEXT,               -- e.g. 'Paris'
  referrer_host  TEXT,               -- bare hostname only (e.g. 'google.com'), never the full URL
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_article  ON page_views(article_id, created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_country  ON page_views(country_code);
