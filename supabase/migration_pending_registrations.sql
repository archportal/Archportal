-- supabase/migration_pending_registrations.sql
--
-- Tabla temporal para guardar datos de registro mientras el usuario completa el pago en Stripe.
-- Reemplaza el anti-patrón de mandar password en plaintext por Stripe metadata.
--
-- Ejecutar en Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS pending_registrations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  password_hash text NOT NULL,            -- bcrypt hash, nunca plaintext
  nombre      text NOT NULL,
  despacho    text,
  ciudad      text,
  tel         text,
  plan        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,       -- típicamente created_at + 30 min
  consumed_at timestamptz                 -- marcamos cuando se crea el user real
);

-- Index para búsqueda por id (PK ya tiene index automático) y para limpieza
CREATE INDEX IF NOT EXISTS pending_reg_expires_idx ON pending_registrations (expires_at);
CREATE INDEX IF NOT EXISTS pending_reg_email_idx   ON pending_registrations (email);

-- RLS: nadie puede leer esta tabla excepto el service role
ALTER TABLE pending_registrations ENABLE ROW LEVEL SECURITY;

-- Política explícita que niega TODO acceso vía API anon/authenticated.
-- El service_role usado por supabaseAdmin sobrepasa RLS y puede leer/escribir.
CREATE POLICY "deny_all_to_anon" ON pending_registrations
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Función de limpieza para correr periódicamente (vía Supabase Cron o pg_cron)
CREATE OR REPLACE FUNCTION cleanup_expired_pending_registrations()
RETURNS void AS $$
BEGIN
  DELETE FROM pending_registrations
  WHERE expires_at < now()
     OR consumed_at IS NOT NULL AND consumed_at < (now() - interval '7 days');
END;
$$ LANGUAGE plpgsql;

-- Si tienes pg_cron habilitado, descomenta para limpiar cada hora:
-- SELECT cron.schedule('cleanup-pending-registrations', '0 * * * *', 'SELECT cleanup_expired_pending_registrations();');
