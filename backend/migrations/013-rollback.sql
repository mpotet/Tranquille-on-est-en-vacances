-- Retour arriere de 013 : supprime la table (les fichiers audio/ restent dans R2).
DROP INDEX IF EXISTS idx_recordings_recorded_at;
DROP TABLE IF EXISTS recordings;
