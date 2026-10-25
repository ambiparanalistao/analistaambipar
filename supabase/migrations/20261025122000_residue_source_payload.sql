ALTER TABLE public.registros_residuos
  ADD COLUMN IF NOT EXISTS source_payload jsonb NOT NULL DEFAULT '{}'::jsonb;
