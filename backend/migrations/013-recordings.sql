-- 013 - Bibliotheque d'enregistrements audio (messages vocaux de l'admin).
--
-- Un enregistrement est cree sur le telephone, souvent hors ligne : son id
-- (uuid) est donc genere par l'appareil, et l'envoi est idempotent (le meme
-- id renvoye apres une coupure ne cree pas de doublon). Le fichier vit dans
-- R2 sous r2_key (audio/<id>.<ext>) ; un article y fait reference par
-- <div class="audio-note" data-audio-id="<id>" ...> dans son contenu.
--
-- Ordre de mise en production : appliquer cette migration AVANT de deployer.
-- Sans la table, les enregistrements restent en attente sur l'appareil (rien
-- n'est perdu) et partent des que la table existe.
--
-- Retour arriere : migrations/013-rollback.sql
CREATE TABLE IF NOT EXISTS recordings (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL DEFAULT '',
  r2_key      TEXT NOT NULL,
  mime        TEXT NOT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  size        INTEGER NOT NULL DEFAULT 0,
  recorded_at TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_recordings_recorded_at ON recordings(recorded_at);
