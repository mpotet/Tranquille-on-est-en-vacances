-- The articles.status CHECK constraint in production only allows
-- ('published', 'draft'), but the application has used 'archived' and
-- 'publish_when_online' as real statuses for a while (see worker/api/articles.js).
-- Any PUT/POST that sets status to one of those two values hits
-- SQLITE_CONSTRAINT_CHECK and returns a 500. SQLite can't ALTER a CHECK
-- constraint in place, so the table must be rebuilt.
PRAGMA foreign_keys=OFF;

CREATE TABLE articles_new (
  id                INTEGER  PRIMARY KEY AUTOINCREMENT,
  title             TEXT     NOT NULL,
  slug              TEXT     NOT NULL UNIQUE,
  destination       TEXT     NOT NULL DEFAULT '',
  date              DATE     NOT NULL DEFAULT (date('now')),
  start_date        DATE     NOT NULL DEFAULT (date('now')),
  end_date          DATE     NOT NULL DEFAULT (date('now')),
  writing_days      TEXT     NOT NULL DEFAULT '[]',
  short_description TEXT     NOT NULL DEFAULT '',
  content           TEXT     NOT NULL DEFAULT '',
  status            TEXT     NOT NULL DEFAULT 'archived'
                    CHECK (status IN ('published', 'draft', 'archived', 'publish_when_online')),
  folder_id         INTEGER  REFERENCES folders(id) ON DELETE SET NULL,
  cover_r2_key      TEXT,
  cover_url         TEXT,
  view_count        INTEGER  NOT NULL DEFAULT 0,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO articles_new SELECT * FROM articles;

DROP TABLE articles;
ALTER TABLE articles_new RENAME TO articles;

CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_folder ON articles(folder_id);
CREATE INDEX IF NOT EXISTS idx_articles_date   ON articles(date DESC);
CREATE INDEX IF NOT EXISTS idx_articles_views  ON articles(view_count DESC);

PRAGMA foreign_keys=ON;
