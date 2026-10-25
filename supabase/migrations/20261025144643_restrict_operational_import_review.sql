-- Raw import payloads may contain personal data (for example CPF/CNH).
-- Restrict staging reads to company administrators and transport analysts.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='operational_data_import_rows' AND policyname='central_company_admin_read') THEN
    ALTER POLICY central_company_admin_read ON public.operational_data_import_rows USING (maintenance_private.can_access_company(company_id, true));
  ELSIF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='operational_data_import_rows' AND policyname='central_company_read') THEN
    ALTER POLICY central_company_read ON public.operational_data_import_rows USING (maintenance_private.can_access_company(company_id, true));
  ELSE
    CREATE POLICY central_company_admin_read ON public.operational_data_import_rows FOR SELECT TO authenticated USING (maintenance_private.can_access_company(company_id, true));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='operational_data_import_batches' AND policyname='central_company_admin_read') THEN
    ALTER POLICY central_company_admin_read ON public.operational_data_import_batches USING (maintenance_private.can_access_company(company_id, true));
  ELSIF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='operational_data_import_batches' AND policyname='central_company_read') THEN
    ALTER POLICY central_company_read ON public.operational_data_import_batches USING (maintenance_private.can_access_company(company_id, true));
  ELSE
    CREATE POLICY central_company_admin_read ON public.operational_data_import_batches FOR SELECT TO authenticated USING (maintenance_private.can_access_company(company_id, true));
  END IF;
END;
$$;

