-- Track subscriber notification emails (new/updated article), separate from
-- email_log (which only covers admin-account emails: setup/reset/etc.).
--
-- One row per publish/update event, not one row per recipient - a single
-- article notification can go to dozens of subscribers, and the admin
-- dashboard wants "one line per send, expand to see who received it" rather
-- than a flat list that grows unbounded with the subscriber count. Recipients
-- are stored as a JSON array of {email, ok, error} so the row stays a single
-- write and the per-recipient detail is still available on demand.
CREATE TABLE IF NOT EXISTS subscriber_email_log (
  id            INTEGER  PRIMARY KEY AUTOINCREMENT,
  article_id    INTEGER  REFERENCES articles(id) ON DELETE SET NULL,
  article_title TEXT     NOT NULL,   -- snapshotted so the log stays readable even if the article is later deleted
  is_update     INTEGER  NOT NULL,   -- 0 = new article notification, 1 = update notification
  recipients    TEXT     NOT NULL,   -- JSON array: [{"email":"...","ok":true,"error":null}, ...]
  sent_count    INTEGER  NOT NULL,   -- successful sends, denormalised for a fast list view (avoids parsing JSON per row)
  failed_count  INTEGER  NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriber_email_log_created ON subscriber_email_log(created_at DESC);
