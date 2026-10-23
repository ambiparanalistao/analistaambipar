-- Stage 1: additive tenant foundation; apply manually after reviewing the preflight.
BEGIN;
DO $$
BEGIN
  IF to_regclass('public.veiculos') IS NULL OR to_regclass('public.motoristas') IS NULL THEN
    RAISE EXCEPTION 'Prerequisite missing: existing public.veiculos and public.motoristas must be provisioned first. See docs/MAINTENANCE_STAGE_1.md.';
  END IF;
END $$;
CREATE SCHEMA IF NOT EXISTS maintenance_private;
REVOKE ALL ON SCHEMA maintenance_private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA maintenance_private TO authenticated, service_role;

CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid GENERATED ALWAYS AS (id) STORED UNIQUE,
  nome text NOT NULL CHECK (btrim(nome) <> ''),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id)
);
CREATE TABLE public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  role text NOT NULL DEFAULT 'analista' CHECK (role IN ('analista','gestor','auditor','administrador')),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  UNIQUE (company_id, user_id)
);
CREATE INDEX company_members_user_idx ON public.company_members(user_id, company_id) WHERE ativo;
CREATE INDEX company_members_created_by_idx ON public.company_members(created_by);
CREATE INDEX companies_created_by_idx ON public.companies(created_by);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
-- Memberships are provisioned by the database administrator/service only.
CREATE POLICY company_members_self_read ON public.company_members FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));
CREATE POLICY companies_member_read ON public.companies FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.company_members m WHERE m.company_id = companies.id AND m.user_id = (SELECT auth.uid()) AND m.ativo));
REVOKE ALL ON public.companies, public.company_members FROM anon, authenticated;
GRANT SELECT ON public.companies, public.company_members TO authenticated;
GRANT ALL ON public.companies, public.company_members TO service_role;

CREATE FUNCTION maintenance_private.can_access_company(target uuid, writing boolean DEFAULT false)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members m
    WHERE m.company_id = target AND m.user_id = (SELECT auth.uid()) AND m.ativo
      AND (NOT writing OR m.role IN ('analista','gestor','administrador'))
  );
$$;
REVOKE ALL ON FUNCTION maintenance_private.can_access_company(uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION maintenance_private.can_access_company(uuid,boolean) TO authenticated, service_role;

CREATE FUNCTION maintenance_private.is_provisioner()
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$ SELECT coalesce(current_setting('role',true),'none') IN ('none','postgres','service_role'); $$;
REVOKE ALL ON FUNCTION maintenance_private.is_provisioner() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION maintenance_private.is_provisioner() TO authenticated, service_role;

CREATE FUNCTION maintenance_private.audit_row()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
BEGIN
  IF NOT maintenance_private.is_provisioner() AND NOT maintenance_private.can_access_company(NEW.company_id,true) THEN
    RAISE EXCEPTION 'No write membership for company' USING ERRCODE='42501';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.id IS DISTINCT FROM OLD.id OR NEW.company_id IS DISTINCT FROM OLD.company_id
       OR NEW.created_by IS DISTINCT FROM OLD.created_by OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Identity, tenant and creation audit fields are immutable' USING ERRCODE='23514';
    END IF;
  ELSE
    IF NOT maintenance_private.is_provisioner() THEN NEW.created_by := auth.uid(); END IF;
    NEW.created_at := clock_timestamp();
  END IF;
  NEW.updated_at := clock_timestamp();
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION maintenance_private.audit_row() FROM PUBLIC;

-- No backfill, no reassignment and no policy removal on the existing fleet.
ALTER TABLE public.veiculos ADD COLUMN company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.motoristas ADD COLUMN company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.veiculos ADD CONSTRAINT veiculos_id_company_unique UNIQUE(id,company_id);
ALTER TABLE public.motoristas ADD CONSTRAINT motoristas_id_company_unique UNIQUE(id,company_id);
CREATE INDEX veiculos_company_idx ON public.veiculos(company_id);
CREATE INDEX motoristas_company_idx ON public.motoristas(company_id);

CREATE FUNCTION maintenance_private.fleet_company_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE chosen uuid; memberships integer;
BEGIN
  IF maintenance_private.is_provisioner() THEN RETURN NEW; END IF;
  IF TG_OP='UPDATE' AND NEW.company_id IS DISTINCT FROM OLD.company_id THEN
    RAISE EXCEPTION 'Company reassignment requires administrative provisioning' USING ERRCODE='42501';
  END IF;
  IF TG_OP='INSERT' AND NEW.company_id IS NULL THEN
    SELECT count(*), (array_agg(m.company_id))[1] INTO memberships,chosen
    FROM public.company_members m WHERE m.user_id=auth.uid() AND m.ativo;
    IF memberships > 1 THEN RAISE EXCEPTION 'Specify company_id explicitly for users with multiple companies' USING ERRCODE='23514'; END IF;
    IF memberships=1 THEN NEW.company_id:=chosen; END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION maintenance_private.fleet_company_guard() FROM PUBLIC;
CREATE TRIGGER maintenance_company_guard BEFORE INSERT OR UPDATE ON public.veiculos
FOR EACH ROW EXECUTE FUNCTION maintenance_private.fleet_company_guard();
CREATE TRIGGER maintenance_company_guard BEFORE INSERT OR UPDATE ON public.motoristas
FOR EACH ROW EXECUTE FUNCTION maintenance_private.fleet_company_guard();

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['veiculos','motoristas'] LOOP
    EXECUTE format('CREATE POLICY maintenance_company_select ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated USING (company_id IS NULL OR maintenance_private.can_access_company(company_id))',t);
    EXECUTE format('CREATE POLICY maintenance_company_insert ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (company_id IS NULL OR maintenance_private.can_access_company(company_id,true))',t);
    EXECUTE format('CREATE POLICY maintenance_company_update ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated USING (company_id IS NULL OR maintenance_private.can_access_company(company_id,true)) WITH CHECK (company_id IS NULL OR maintenance_private.can_access_company(company_id,true))',t);
    -- Existing vehicle UPDATE policy has only WITH CHECK; add an explicit scoped USING.
    EXECUTE format('CREATE POLICY maintenance_company_update_allow ON public.%I FOR UPDATE TO authenticated USING (company_id IS NOT NULL AND maintenance_private.can_access_company(company_id,true)) WITH CHECK (company_id IS NOT NULL AND maintenance_private.can_access_company(company_id,true))',t);
    EXECUTE format('CREATE POLICY maintenance_company_delete ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated USING (company_id IS NULL OR maintenance_private.can_access_company(company_id,true))',t);
  END LOOP;
END $$;
COMMIT;
