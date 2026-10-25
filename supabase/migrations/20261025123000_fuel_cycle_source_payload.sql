ALTER TABLE public.fuel_provision_cycles
  ADD COLUMN IF NOT EXISTS source_payload jsonb NOT NULL DEFAULT '{}'::jsonb;
