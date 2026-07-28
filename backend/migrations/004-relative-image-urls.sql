-- Normalize stored image URLs to root-relative form (/r2/<key>) so they no
-- longer bake in the site's domain. New uploads already store relative URLs
-- (see api/photos.js); this fixes the rows written before that change.
-- Strips any scheme+host prefix up to and including the first "/r2/".
UPDATE photos
SET url = '/r2/' || substr(url, instr(url, '/r2/') + 4)
WHERE url LIKE 'http%/r2/%';

UPDATE articles
SET cover_url = '/r2/' || substr(cover_url, instr(cover_url, '/r2/') + 4)
WHERE cover_url LIKE 'http%/r2/%';

UPDATE site_settings
SET value = '/r2/' || substr(value, instr(value, '/r2/') + 4)
WHERE key = 'hero_image_url' AND value LIKE 'http%/r2/%';
