-- Add view_count column to articles table
ALTER TABLE articles ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;

-- Create index for popularity queries
CREATE INDEX IF NOT EXISTS idx_articles_views ON articles(view_count DESC);
