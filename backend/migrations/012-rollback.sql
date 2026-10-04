-- Retour arriere de 012-comment-day.sql.
--
-- Aucun commentaire n'est supprime : seule l'information "sur quel jour" est
-- perdue, et ces commentaires reapparaissent dans la section generale de leur
-- article. A executer APRES avoir redeploye un worker qui ne lit plus la
-- colonne (le worker actuel s'en passe tres bien : il la detecte).
ALTER TABLE comments DROP COLUMN day;
