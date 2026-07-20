-- Clear hero image from site settings
-- Run with: wrangler d1 execute tranquille-vacances-db --file=scripts/clear-hero-image.sql

UPDATE site_settings
SET value = ''
WHERE key IN ('hero_image_url', 'hero_image_r2_key');
