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
-- interchangeable: snapshot and dedupe on caption FIRST, blank the captions
-- SECOND. Blanking before deleting would erase the only evidence of which rows
-- are duplicates.
--
-- REVERSIBLE. Nothing is destroyed: every removed row is copied into
-- photos_backup_011 first, and the original captions are kept there too. To
-- undo the whole migration, run migrations/011-rollback.sql.
--
-- Still take a full export before running this - it is the safety net that
-- covers mistakes this script cannot anticipate:
--   npx wrangler d1 export tranquille-vacances-db --remote --output backup.sql

-- ── Step 0: snapshot ─────────────────────────────────────────────────────────
-- Holds every photo row as it was BEFORE the migration, so both the deletion
-- and the caption wipe can be undone. Kept as a permanent table rather than a
-- temp one: the point is to still be able to recover next week, not just
-- during this session. Drop it manually once you are satisfied, with:
--   DROP TABLE photos_backup_011;
CREATE TABLE IF NOT EXISTS photos_backup_011 (
  id         INTEGER PRIMARY KEY,
  article_id INTEGER NOT NULL,
  r2_key     TEXT    NOT NULL,
  url        TEXT    NOT NULL,
  caption    TEXT    NOT NULL,
  sort_order INTEGER NOT NULL,
  was_deleted INTEGER NOT NULL DEFAULT 0  -- 1 = row removed as a duplicate
);

-- Snapshot every row that carries a caption (the only rows this migration
-- touches). INSERT OR IGNORE keeps the FIRST snapshot if the migration is run
-- twice, so a re-run cannot overwrite the original captions with blanked ones.
INSERT OR IGNORE INTO photos_backup_011 (id, article_id, r2_key, url, caption, sort_order, was_deleted)
SELECT id, article_id, r2_key, url, caption, sort_order, 0
FROM photos
WHERE caption <> '';

-- Mark which snapshotted rows are about to be deleted as duplicates.
UPDATE photos_backup_011 SET was_deleted = 1
WHERE was_deleted = 0
  AND id IN (
    SELECT id FROM photos
    WHERE caption <> ''
      AND id NOT IN (SELECT MIN(id) FROM photos GROUP BY article_id, caption)
  );

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
-- inline copy is then folded back into the kept photo by dedupePhotos() in
-- helpers/render.js, not by removing the file. Leaving the files also means
-- the rollback below fully restores working photos.
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

-- ── Report ───────────────────────────────────────────────────────────────────
-- Printed by `wrangler d1 execute`, so the deployment log shows exactly what
-- happened rather than a silent success.
SELECT
  (SELECT COUNT(*) FROM photos_backup_011 WHERE was_deleted = 1) AS doublons_supprimes,
  (SELECT COUNT(*) FROM photos_backup_011)                       AS legendes_sauvegardees,
  (SELECT COUNT(*) FROM photos)                                  AS photos_restantes,
  (SELECT COUNT(*) FROM photos WHERE caption <> '')              AS legendes_restantes;
