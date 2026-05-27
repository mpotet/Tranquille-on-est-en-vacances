-- =========================================================
-- Tranquille, on est en vacances - Cloudflare D1 Schema
-- Run with: wrangler d1 execute tranquille-vacances-db --file=schema.sql
-- =========================================================

-- Hierarchical folder structure for organising trips
CREATE TABLE IF NOT EXISTS folders (
  id         INTEGER  PRIMARY KEY AUTOINCREMENT,
  name       TEXT     NOT NULL,
  slug       TEXT     NOT NULL UNIQUE,
  icon       TEXT     NOT NULL DEFAULT '📁',
  parent_id  INTEGER  REFERENCES folders(id) ON DELETE SET NULL,
  sort_order INTEGER  NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Travel articles (trips / blog posts)
CREATE TABLE IF NOT EXISTS articles (
  id                INTEGER  PRIMARY KEY AUTOINCREMENT,
  title             TEXT     NOT NULL,
  slug              TEXT     NOT NULL UNIQUE,
  destination       TEXT     NOT NULL DEFAULT '',
  date              DATE     NOT NULL DEFAULT (date('now')), -- legacy alias for start_date
  start_date        DATE     NOT NULL DEFAULT (date('now')),
  end_date          DATE     NOT NULL DEFAULT (date('now')),
  writing_days      TEXT     NOT NULL DEFAULT '[]',          -- JSON [{date, summary}]
  short_description TEXT     NOT NULL DEFAULT '',
  content           TEXT     NOT NULL DEFAULT '',
  -- Only 'published' articles are visible to the public
  status            TEXT     NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('published', 'draft')),
  folder_id         INTEGER  REFERENCES folders(id) ON DELETE SET NULL,
  cover_r2_key      TEXT,    -- R2 object key for the cover photo
  cover_url         TEXT,    -- Public URL of the cover photo
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Photos attached to articles (stored in Cloudflare R2)
CREATE TABLE IF NOT EXISTS photos (
  id         INTEGER  PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER  NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  r2_key     TEXT     NOT NULL,       -- R2 object key  (e.g. photos/2024/abc.webp)
  url        TEXT     NOT NULL,       -- Public CDN URL
  caption    TEXT     NOT NULL DEFAULT '',
  sort_order INTEGER  NOT NULL DEFAULT 0,
  width      INTEGER,
  height     INTEGER,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Editable site-wide settings (hero image, texts, etc.)
CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT     PRIMARY KEY,
  value      TEXT     NOT NULL DEFAULT '',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_articles_status     ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_folder     ON articles(folder_id);
CREATE INDEX IF NOT EXISTS idx_articles_date       ON articles(date DESC);
CREATE INDEX IF NOT EXISTS idx_photos_article      ON photos(article_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_folders_parent      ON folders(parent_id);

-- ── Push notification subscriptions (Web Push API) ──────────────────────────
-- Endpoint + ECDH keys sent by the browser when user accepts notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          INTEGER  PRIMARY KEY AUTOINCREMENT,
  endpoint    TEXT     NOT NULL UNIQUE,
  p256dh      TEXT     NOT NULL,   -- browser public key (base64url)
  auth        TEXT     NOT NULL,   -- auth secret (base64url)
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_push_endpoint ON push_subscriptions(endpoint);

-- ── Email newsletter subscriptions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_subscriptions (
  id          INTEGER  PRIMARY KEY AUTOINCREMENT,
  email       TEXT     NOT NULL UNIQUE,
  token       TEXT     NOT NULL UNIQUE,  -- random token used in unsubscribe link
  active      INTEGER  NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_active ON email_subscriptions(active);

-- =========================================================
-- Seed data - remove or adapt before deploying to production
-- =========================================================

INSERT OR IGNORE INTO folders (id, name, slug, icon, parent_id) VALUES
  (1, 'Europe',    'europe',    '🇪🇺', NULL),
  (2, 'France',    'france',    '🇫🇷', 1),
  (3, 'Italie',    'italie',    '🇮🇹', 1),
  (4, 'Grèce',     'grece',     '🇬🇷', 1),
  (5, 'Amériques', 'ameriques', '🌎',  NULL),
  (6, 'Canada',    'canada',    '🇨🇦', 5),
  (7, 'Mexique',   'mexique',   '🇲🇽', 5),
  (8, 'Asie',      'asie',      '🌏',  NULL),
  (9, 'Japon',     'japon',     '🇯🇵', 8);

-- Default site settings
INSERT OR IGNORE INTO site_settings (key, value) VALUES
  ('hero_image_url',  ''),
  ('hero_title',      ''),
  ('hero_subtitle',   ''),
  ('site_tagline',    'Le voyage en famille enrichit les souvenirs et élargit le cœur.');

