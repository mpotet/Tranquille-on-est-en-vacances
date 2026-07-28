-- The legacy `date` column was meant to mirror start_date (see schema.sql
-- comment) but drifted out of sync on many rows, apparently from a bulk
-- import/update that stamped every row with the import date instead of the
-- trip's actual start date. This broke "most recent trip first" sorting and
-- prev/next navigation everywhere that read `date`. Application code has been
-- updated to sort by start_date directly; this just re-syncs the legacy
-- column so any remaining reader of `date` also sees the correct value.
UPDATE articles SET date = start_date WHERE date != start_date;
