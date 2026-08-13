-- 009 - Notify comment authors when someone replies to them.
--
-- Comments are guestbook-style with no accounts, so there was no way to reach
-- the person who wrote one. Both columns are optional and filled in only if the
-- reader chooses to be notified:
--   author_email  - address to email a reply to (never displayed publicly)
--   push_endpoint - the reader's Web Push endpoint, when they granted
--                   notification permission from the comment form (the PWA
--                   case); matches push_subscriptions.endpoint
ALTER TABLE comments ADD COLUMN author_email TEXT;
ALTER TABLE comments ADD COLUMN push_endpoint TEXT;

-- Looking up "who should be told about this reply" walks from a reply to its
-- parent, so the parent lookup is the hot path (idx_comments_parent already
-- covers it). This one supports the reverse cleanup: dropping a push endpoint
-- everywhere once the browser reports it as expired.
CREATE INDEX IF NOT EXISTS idx_comments_push_endpoint ON comments(push_endpoint);
