-- Deduplicate analytics visits per browser session.
--
-- Until now every page load inserted a page_views row, so refreshing a page
-- 10× counted as 10 "visites". We now attach an opaque per-browser visitor id
-- (a random token stored in an HttpOnly cookie, never an IP) and count at most
-- one visit per (visitor_id, path) per calendar day. Older rows have a NULL
-- visitor_id and are simply left as-is (historical data).
--
-- Privacy unchanged: visitor_id is a random UUID with no link to identity or
-- IP — it only lets us tell "same browser, same day" apart from a new visit.
ALTER TABLE page_views ADD COLUMN visitor_id TEXT;

-- Enforce the "one visit per visitor+path+day" rule at the DB level so a race
-- between two concurrent loads can't slip a duplicate through. The day bucket
-- is derived from created_at via a generated-column-free expression index.
-- (SQLite can index an expression directly.)
CREATE UNIQUE INDEX IF NOT EXISTS idx_page_views_unique_daily
  ON page_views(visitor_id, path, date(created_at))
  WHERE visitor_id IS NOT NULL;
