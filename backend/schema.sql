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
  -- Only 'published' articles are visible to the public.
  -- Real states used across the app: 'archived' (hidden), 'published' (public),
  -- 'publish_when_online' (queued draft that auto-publishes when back online).
  -- 'draft' is kept for backwards compatibility with legacy rows.
  status            TEXT     NOT NULL DEFAULT 'archived'
                    CHECK (status IN ('published', 'draft', 'archived', 'publish_when_online')),
  folder_id         INTEGER  REFERENCES folders(id) ON DELETE SET NULL,
  cover_r2_key      TEXT,    -- R2 object key for the cover photo
  cover_url         TEXT,    -- Public URL of the cover photo
  view_count        INTEGER  NOT NULL DEFAULT 0,            -- Total article views
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

-- Reader comments on articles (guestbook-style, no accounts).
-- A single site-wide "secret question" gate (stored in site_settings) is the
-- spam filter; comments are visible immediately once the answer is correct.
CREATE TABLE IF NOT EXISTS comments (
  id             INTEGER  PRIMARY KEY AUTOINCREMENT,
  article_id     INTEGER  NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  parent_id      INTEGER  REFERENCES comments(id) ON DELETE CASCADE,
  is_admin_reply INTEGER  NOT NULL DEFAULT 0,
  author_name    TEXT     NOT NULL,
  body           TEXT     NOT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comments_article ON comments(article_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_parent  ON comments(parent_id);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_articles_status     ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_folder     ON articles(folder_id);
CREATE INDEX IF NOT EXISTS idx_articles_date       ON articles(date DESC);
CREATE INDEX IF NOT EXISTS idx_articles_views      ON articles(view_count DESC);
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

-- ── Admin account (single-row credential store) ──────────────────────────────
-- There is only ever ONE admin, but this is a normal table (id, not hardcoded)
-- because it holds credential data that must stay separate from the generic
-- site_settings key/value store and must NEVER be exposed via the settings API.
--   password_hash    : NULL until first-run setup is completed. Composite string
--                       "salt:iterations:hash" (all base64url) produced by
--                       worker/password.js (PBKDF2-SHA256).
--   pending_email    : set while an email change awaits confirmation, cleared on
--                       confirm/cancel.
--   token / token_purpose / token_expires_at :
--                       one active one-time token at a time (setup | reset |
--                       email_change). A new request overwrites the previous one;
--                       a consumed token is cleared immediately (single use).
CREATE TABLE IF NOT EXISTS admin_account (
  id               INTEGER  PRIMARY KEY AUTOINCREMENT,
  email            TEXT     NOT NULL UNIQUE,
  password_hash    TEXT,                       -- NULL = no password set yet (first-run)
  pending_email    TEXT,                       -- awaiting email-change confirmation
  token            TEXT,                       -- current one-time token (or NULL)
  token_purpose    TEXT     CHECK (token_purpose IN ('setup', 'reset', 'email_change')),
  token_expires_at DATETIME,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Rate limiting (brute-force protection) ───────────────────────────────────
-- Tracks failed attempts per (scope, key) - e.g. scope='login', key=<client IP>,
-- or scope='comment_gate', key=<client IP>. A sliding window is enforced in
-- application code (worker/rate-limit.js) by counting rows newer than N
-- minutes; old rows are pruned opportunistically on each check.
CREATE TABLE IF NOT EXISTS rate_limit_attempts (
  id         INTEGER  PRIMARY KEY AUTOINCREMENT,
  scope      TEXT     NOT NULL,
  attempt_key TEXT    NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup ON rate_limit_attempts(scope, attempt_key, created_at);

-- ── Transactional email log ───────────────────────────────────────────────────
-- Every admin-account email (setup / reset / email-change / password-changed)
-- is recorded here with its actual outcome, so the admin dashboard can show a
-- real success/failure history instead of the previous silent fire-and-forget
-- (a failed send used to look identical to a successful one in the UI).
CREATE TABLE IF NOT EXISTS email_log (
  id          INTEGER  PRIMARY KEY AUTOINCREMENT,
  email_type  TEXT     NOT NULL,   -- 'setup' | 'reset' | 'email_change' | 'password_changed'
  recipient   TEXT     NOT NULL,
  ok          INTEGER  NOT NULL,   -- 1 = sent successfully, 0 = failed/skipped
  error       TEXT,                -- human-readable failure reason, if any
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_log_created ON email_log(created_at DESC);

-- Seed the single admin row in first-run state (no password, no token).
-- The setup email/token is generated at runtime by
-- `npm run admin:send-setup-email`, NOT here (that would send a real email).
INSERT OR IGNORE INTO admin_account (id, email, password_hash) VALUES
  (1, 'damien.potet@free.fr', NULL);

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
  ('site_tagline',    'Le voyage en famille enrichit les souvenirs et élargit le cœur.'),
  -- Comment gate (secret question). Answer compared case-insensitively, trimmed.
  ('comment_gate_question', 'Quel est le nom du chat roux de la famille Potet ?'),
  ('comment_gate_answer',   'wifi');

