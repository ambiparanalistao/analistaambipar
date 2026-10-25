BEGIN;

DO $$ BEGIN
  IF to_regclass('public.companies') IS NULL
     OR to_regprocedure('maintenance_private.can_access_company(uuid,boolean)') IS NULL THEN
    RAISE EXCEPTION 'A base multiempresa deve existir antes desta migration.';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.operational_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  source_key text NOT NULL,
  scheduled_for date,
  status text NOT NULL DEFAULT '',
  vehicle_id uuid,
  driver_id uuid,
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, source_key),
  CHECK (jsonb_typeof(source_payload)='object')
);
CREATE INDEX IF NOT EXISTS operational_schedules_company_date_idx
  ON public.operational_schedules(company_id, scheduled_for DESC);

CREATE TABLE IF NOT EXISTS public.transport_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  source_key text NOT NULL,
  status text NOT NULL DEFAULT '',
  vehicle_id uuid,
  driver_id uuid,
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, source_key),
  CHECK (jsonb_typeof(source_payload)='object')
);
CREATE INDEX IF NOT EXISTS transport_trips_company_status_idx
  ON public.transport_trips(company_id, status, created_at DESC);

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['operational_schedules','transport_trips'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon',t);
    EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO authenticated',t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname='central_company_scope') THEN
      EXECUTE format('CREATE POLICY central_company_scope ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (maintenance_private.can_access_company(company_id)) WITH CHECK (maintenance_private.can_access_company(company_id,true))',t);
      EXECUTE format('CREATE POLICY central_company_read ON public.%I FOR SELECT TO authenticated USING (maintenance_private.can_access_company(company_id))',t);
      EXECUTE format('CREATE POLICY central_company_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (maintenance_private.can_access_company(company_id,true))',t);
      EXECUTE format('CREATE POLICY central_company_update ON public.%I FOR UPDATE TO authenticated USING (maintenance_private.can_access_company(company_id,true)) WITH CHECK (maintenance_private.can_access_company(company_id,true))',t);
      EXECUTE format('CREATE POLICY central_company_delete ON public.%I FOR DELETE TO authenticated USING (maintenance_private.can_access_company(company_id,true))',t);
    END IF;
  END LOOP;
END $$;

COMMIT;
