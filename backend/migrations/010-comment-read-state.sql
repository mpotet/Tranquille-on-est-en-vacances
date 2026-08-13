-- 010 - Track which comments the admin has already seen.
--
-- The "Modération" (renamed "Commentaires") tab listed every comment with no
-- way to tell which ones were new since the last visit - checking meant
-- re-reading the whole list every time. is_read defaults to 0 so anything
-- already in the table before this migration counts as unread on first load
-- (harmless: it just shows the current backlog once, then clears as it's read).
ALTER TABLE comments ADD COLUMN is_read INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_comments_is_read ON comments(is_read);
