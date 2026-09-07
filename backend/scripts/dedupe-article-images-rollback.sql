-- Annule scripts/dedupe-article-images.js : restaure le HTML d'origine des
-- articles dont les <img> en double ont été retirés.
--
--   npx wrangler d1 execute tranquille-vacances-db --remote --file scripts/dedupe-article-images-rollback.sql
--
-- Fonctionne tant que la table articles_backup_dedupe existe. Les objets R2
-- n'ayant jamais été supprimés, les images restaurées s'affichent de nouveau.

UPDATE articles
SET content = (SELECT b.content FROM articles_backup_dedupe b WHERE b.id = articles.id),
    updated_at = CURRENT_TIMESTAMP
WHERE id IN (SELECT id FROM articles_backup_dedupe);

SELECT COUNT(*) AS articles_restaures FROM articles_backup_dedupe;
