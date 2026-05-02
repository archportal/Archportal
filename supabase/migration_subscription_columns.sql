-- supabase/migration_subscription_columns.sql
--
-- Añade columnas a `users` para trackear el estado de la suscripción de Stripe.
-- Idempotente: usa IF NOT EXISTS por si ya creaste alguna manualmente.
--
-- Ejecutar en Supabase Dashboard → SQL Editor → New query → Run.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_status text,
  ADD COLUMN IF NOT EXISTS trial_end timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_payment_at timestamptz;

-- Índice para que el webhook encuentre rápido al user por su stripe_customer_id
CREATE INDEX IF NOT EXISTS users_stripe_customer_idx ON users (stripe_customer_id);

-- Índice para consultas tipo "cuántos users están en trial" o "cuántos past_due"
CREATE INDEX IF NOT EXISTS users_subscription_status_idx ON users (subscription_status);

-- Comentarios para documentación interna en la DB
COMMENT ON COLUMN users.subscription_status IS 'Status reportado por Stripe: trialing, active, past_due, canceled, unpaid, incomplete';
COMMENT ON COLUMN users.trial_end IS 'Fecha en que termina el trial (Stripe cobra al día siguiente)';
COMMENT ON COLUMN users.current_period_end IS 'Fecha en que termina el ciclo actual de cobro';
COMMENT ON COLUMN users.cancel_at_period_end IS 'true si el user pidió cancelar al final del ciclo';
COMMENT ON COLUMN users.last_payment_at IS 'Última vez que Stripe cobró exitosamente';
