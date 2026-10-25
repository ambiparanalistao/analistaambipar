BEGIN;

CREATE TABLE IF NOT EXISTS public.company_operational_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  collection text NOT NULL CHECK (collection IN (
    'fuel_audit_justifications',
    'monthly_fleet_costs',
    'freight_simulations'
  )),
  record_key text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, collection, record_key),
  CHECK (jsonb_typeof(payload) = 'object')
);

CREATE INDEX IF NOT EXISTS company_operational_records_collection_idx
  ON public.company_operational_records(company_id, collection, updated_at DESC);

ALTER TABLE public.company_operational_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.company_operational_records FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_operational_records TO authenticated;
GRANT ALL ON public.company_operational_records TO service_role;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'company_operational_records'
      AND policyname = 'central_company_scope'
  ) THEN
    CREATE POLICY central_company_scope
      ON public.company_operational_records AS RESTRICTIVE FOR ALL TO authenticated
      USING (maintenance_private.can_access_company(company_id))
      WITH CHECK (maintenance_private.can_access_company(company_id, true));
    CREATE POLICY central_company_read
      ON public.company_operational_records FOR SELECT TO authenticated
      USING (maintenance_private.can_access_company(company_id));
    CREATE POLICY central_company_insert
      ON public.company_operational_records FOR INSERT TO authenticated
      WITH CHECK (maintenance_private.can_access_company(company_id, true));
    CREATE POLICY central_company_update
      ON public.company_operational_records FOR UPDATE TO authenticated
      USING (maintenance_private.can_access_company(company_id, true))
      WITH CHECK (maintenance_private.can_access_company(company_id, true));
    CREATE POLICY central_company_delete
      ON public.company_operational_records FOR DELETE TO authenticated
      USING (maintenance_private.can_access_company(company_id, true));
  END IF;
END $$;

COMMIT;
