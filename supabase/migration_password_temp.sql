-- supabase/migration_password_temp.sql
--
-- Añade columna password_temp a pending_registrations.
-- Plaintext temporal para crear user en Supabase Auth, se borra al consumir el pending.

ALTER TABLE pending_registrations
  ADD COLUMN IF NOT EXISTS password_temp text;

COMMENT ON COLUMN pending_registrations.password_temp IS 'Password en plaintext temporal — se borra al consumir el pending';
