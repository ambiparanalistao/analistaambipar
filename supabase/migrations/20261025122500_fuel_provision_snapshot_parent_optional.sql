ALTER TABLE public.fuel_provision_vehicles ALTER COLUMN cycle_id DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS fuel_provision_snapshot_source_idx
  ON public.fuel_provision_vehicles(company_id, source_key)
  WHERE cycle_id IS NULL AND source_key IS NOT NULL;
