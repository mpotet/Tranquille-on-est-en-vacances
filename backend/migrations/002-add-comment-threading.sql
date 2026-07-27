-- Add threaded replies to comments
ALTER TABLE comments ADD COLUMN parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE;
ALTER TABLE comments ADD COLUMN is_admin_reply INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
