-- 011 - Remove duplicate gallery photos, then clear every photo caption / alt.
--
-- THE BUG
-- The trip gallery (see worker/index.js, "Build the combined photo list") is
-- `photos` rows + inline <img> from the article body that aren't already in
-- `photos`, deduplicated BY URL. Cutting an image out of the editor and
-- re-pasting it re-uploads the file: same picture, brand-new UUID R2 key, so a
-- brand-new URL. URL matching cannot see that they are the same photo, and the
-- gallery shows it twice (reported on "Jordanie": Séverine asleep on the plane,
-- alt "word image 36", appearing twice).
--
-- The only surviving signal that two rows are the same picture is the caption:
-- both copies carry the alt the Word import gave them ("word image 36"), since
-- it is copied along with the image. So the order below matters and is NOT
-- interchangeable: dedupe on caption FIRST, blank the captions SECOND. Running
-- the UPDATE before the DELETE would erase the only evidence of which rows are
-- duplicates, permanently.
--
-- Not reversible. Take a D1 export first:
--   npx wrangler d1 export tranquille-vacances-db --remote --output backup.sql

-- ── Step 1: drop duplicate photo rows ────────────────────────────────────────
-- Within one article, rows sharing a non-empty caption are the same picture
-- re-uploaded. Keep the lowest id (the original, which holds the earliest
-- sort_order and is the one the article body's <img src> still points at) and
-- delete the later copies.
--
-- Scoped to article_id: the same caption under two different trips is two
-- different photos, and "word image 36" is a per-import counter that restarts,
-- so it collides across articles by design.
--
-- Empty captions are excluded: a blank caption carries no identity, and every
-- undescribed photo in an article would otherwise collapse into a single row.
--
-- The R2 objects for the deleted rows are deliberately left in place. They are
-- orphaned but harmless, and an article body may still reference a duplicate's
-- URL inline; deleting the object would break that <img> in the text. The
-- inline copy is then folded back into the kept photo by step 2 in
-- helpers/render.js, not by removing the file.
DELETE FROM photos
WHERE id NOT IN (
  SELECT MIN(id) FROM photos GROUP BY article_id, caption
)
AND caption <> '';

-- ── Step 2: clear every caption ──────────────────────────────────────────────
-- The captions are machine-generated import noise ("word image 21", "word
-- image 36"), and they are rendered to readers twice over: as the <img alt>
-- and as the <p> under each gallery tile, plus as a <figcaption> under inline
-- images (helpers/render.js). No caption at all is wanted, so the column is
-- blanked rather than the render suppressed - that keeps the caption feature
-- working for any description typed from now on.
UPDATE photos SET caption = '' WHERE caption <> '';
