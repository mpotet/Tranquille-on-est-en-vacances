-- 011-rollback - Annule intégralement la migration 011.
--
-- Restaure les photos supprimées comme doublons ET les légendes effacées, à
-- partir de l'instantané photos_backup_011 pris avant la migration.
--
--   npx wrangler d1 execute tranquille-vacances-db --remote --file migrations/011-rollback.sql
--
-- Fonctionne tant que photos_backup_011 existe. Les objets R2 n'ayant jamais
-- été supprimés, les photos restaurées réaffichent bien leur image.
--
-- Après ce rollback, les doublons et les légendes "word image" réapparaissent
-- en base, mais PAS à l'écran : dedupePhotos() et le nettoyage des alts dans
-- helpers/render.js continuent de les masquer côté rendu.

-- ── Étape 1 : remettre les lignes supprimées ────────────────────────────────
-- Les id d'origine sont réutilisés pour que les tris et les références
-- éventuelles retrouvent exactement l'état antérieur.
INSERT OR IGNORE INTO photos (id, article_id, r2_key, url, caption, sort_order)
SELECT id, article_id, r2_key, url, caption, sort_order
FROM photos_backup_011
WHERE was_deleted = 1;

-- ── Étape 2 : restaurer les légendes d'origine ─────────────────────────────
UPDATE photos
SET caption = (SELECT b.caption FROM photos_backup_011 b WHERE b.id = photos.id)
WHERE id IN (SELECT id FROM photos_backup_011);

-- ── Contrôle ────────────────────────────────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM photos_backup_011 WHERE was_deleted = 1) AS lignes_a_restaurer,
  (SELECT COUNT(*) FROM photos)                                  AS photos_totales,
  (SELECT COUNT(*) FROM photos WHERE caption <> '')              AS legendes_restaurees;
