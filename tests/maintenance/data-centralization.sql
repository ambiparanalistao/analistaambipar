DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'clientes','routes','fleet_containers','vehicle_infractions','fuel_transactions',
    'fuel_provision_cycles','fuel_provision_vehicles','fuel_provision_documents',
    'fuel_provision_settings','operational_data_import_batches','operational_data_import_rows'
  ] LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      RAISE EXCEPTION 'Tabela ausente: %', t;
    END IF;
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid=to_regclass('public.' || t)) THEN
      RAISE EXCEPTION 'RLS desabilitada: %', t;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename=t AND policyname='central_company_scope' AND permissive='RESTRICTIVE'
    ) THEN
      RAISE EXCEPTION 'Isolamento restritivo por empresa ausente: %', t;
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='registros_residuos' AND column_name='company_id'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='registros_residuos' AND policyname='central_company_scope' AND permissive='RESTRICTIVE'
  ) THEN
    RAISE EXCEPTION 'Registro de resíduos não está isolado por empresa.';
  END IF;

  IF (SELECT count(*) FROM public.operational_data_import_rows) <> 0
     OR (SELECT count(*) FROM public.operational_data_import_batches) <> 0 THEN
    RAISE EXCEPTION 'A migration de estrutura não pode inserir conteúdo operacional.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='registros_residuos' AND column_name='source_payload'
  ) THEN
    RAISE EXCEPTION 'O snapshot de origem dos resíduos não foi preservado.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='fuel_provision_vehicles'
      AND column_name='cycle_id' AND is_nullable <> 'YES'
  ) THEN
    RAISE EXCEPTION 'Snapshots de aporte sem ciclo devem ser preservados sem inventar ciclo.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='fuel_provision_cycles' AND column_name='source_payload'
  ) THEN
    RAISE EXCEPTION 'O snapshot integral do ciclo de aporte não foi preservado.';
  END IF;
END $$;

BEGIN;
INSERT INTO auth.users(id,email) VALUES
  ('8c000000-0000-4000-8000-000000000001','data-migration-a@example.invalid'),
  ('8c000000-0000-4000-8000-000000000002','data-migration-b@example.invalid');
INSERT INTO public.companies(id,nome,created_by) VALUES
  ('8d000000-0000-4000-8000-000000000001','Migration tenant A','8c000000-0000-4000-8000-000000000001'),
  ('8d000000-0000-4000-8000-000000000002','Migration tenant B','8c000000-0000-4000-8000-000000000002');
INSERT INTO public.company_members(company_id,user_id,role,maintenance_role,created_by) VALUES
  ('8d000000-0000-4000-8000-000000000001','8c000000-0000-4000-8000-000000000001','administrador','admin_empresa','8c000000-0000-4000-8000-000000000001'),
  ('8d000000-0000-4000-8000-000000000002','8c000000-0000-4000-8000-000000000002','administrador','admin_empresa','8c000000-0000-4000-8000-000000000002');
INSERT INTO public.clientes(company_id,source_key,razao_social) VALUES
  ('8d000000-0000-4000-8000-000000000001','tenant-a','Tenant A'),
  ('8d000000-0000-4000-8000-000000000002','tenant-b','Tenant B');
INSERT INTO public.registros_residuos(id,company_id,user_id,empresa_origem,tipo_residuo,quantidade_kg,destinacao_final)
VALUES ('8e000000-0000-4000-8000-000000000001','8d000000-0000-4000-8000-000000000002','8c000000-0000-4000-8000-000000000002','B','resíduo','1','destino');

SELECT set_config('request.jwt.claim.sub','8c000000-0000-4000-8000-000000000001',true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF (SELECT count(*) FROM public.clientes) <> 1 OR (SELECT min(razao_social) FROM public.clientes) <> 'Tenant A' THEN
    RAISE EXCEPTION 'RLS não isolou os cadastros entre empresas.';
  END IF;
  IF (SELECT count(*) FROM public.registros_residuos) <> 0 THEN
    RAISE EXCEPTION 'Uma política antiga permitiu ler registro MTR de outra empresa.';
  END IF;
  BEGIN
    INSERT INTO public.clientes(company_id,source_key,razao_social)
    VALUES ('8d000000-0000-4000-8000-000000000002','cross-tenant','Must be denied');
    RAISE EXCEPTION 'RLS aceitou escrita para outra empresa.';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END $$;
RESET ROLE;
ROLLBACK;
