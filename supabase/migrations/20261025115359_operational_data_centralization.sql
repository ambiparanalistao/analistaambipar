-- Centraliza cadastros operacionais hoje armazenados em arrays estáticos/localStorage.
-- Este arquivo contém somente estrutura. Dados de produção nunca devem ser incluídos
-- em migrations versionadas no Git.
BEGIN;

DO $$ BEGIN
  IF to_regclass('public.companies') IS NULL OR to_regprocedure('maintenance_private.can_access_company(uuid,boolean)') IS NULL THEN
    RAISE EXCEPTION 'A base multiempresa deve existir antes desta migration.';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  source_key text,
  razao_social text NOT NULL DEFAULT '', nome_fantasia text NOT NULL DEFAULT '',
  cnpj text NOT NULL DEFAULT '', inscricao_estadual text NOT NULL DEFAULT '',
  segmento text NOT NULL DEFAULT '', contrato_polo text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT '', tier_sla text NOT NULL DEFAULT '', centro_custo text NOT NULL DEFAULT '',
  cep text NOT NULL DEFAULT '', logradouro text NOT NULL DEFAULT '', numero text NOT NULL DEFAULT '',
  bairro text NOT NULL DEFAULT '', cidade text NOT NULL DEFAULT '', uf text NOT NULL DEFAULT '',
  polo_logistico text NOT NULL DEFAULT '', contato_responsavel text NOT NULL DEFAULT '',
  telefone text NOT NULL DEFAULT '', email text NOT NULL DEFAULT '', tipo_carga text NOT NULL DEFAULT '',
  implemento_exigido text NOT NULL DEFAULT '', observacoes text NOT NULL DEFAULT '',
  rota_nome text NOT NULL DEFAULT '', origem text NOT NULL DEFAULT '', destino text NOT NULL DEFAULT '',
  tipo_operacao text NOT NULL DEFAULT '', frequencia text NOT NULL DEFAULT '',
  janela_atendimento text NOT NULL DEFAULT '', veiculo_preferencial text NOT NULL DEFAULT '',
  veiculo_alocado_placa text NOT NULL DEFAULT '', motorista_preferencial text NOT NULL DEFAULT '',
  distancia_km numeric(12,2), tempo_ciclo_horas numeric(12,2), volume_mensal_ton numeric(14,3),
  classes_residuos text NOT NULL DEFAULT '', codigo_ibama text NOT NULL DEFAULT '',
  mtr_obrigatorio boolean, licenca_ambiental_num text NOT NULL DEFAULT '', validade_licenca date,
  responsavel_nome text NOT NULL DEFAULT '', responsavel_cargo text NOT NULL DEFAULT '',
  version integer NOT NULL DEFAULT 1 CHECK(version > 0),
  created_by uuid REFERENCES auth.users(id), updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE(company_id, source_key),
  CHECK(cnpj = '' OR length(regexp_replace(cnpj, '\\D', '', 'g')) IN (11,14))
);
CREATE INDEX IF NOT EXISTS clientes_company_name_idx ON public.clientes(company_id, nome_fantasia) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS clientes_company_cnpj_idx ON public.clientes(company_id, cnpj) WHERE cnpj <> '' AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id),
  source_key text, codigo text NOT NULL DEFAULT '', nome text NOT NULL DEFAULT '', polo text NOT NULL DEFAULT '',
  tipo text NOT NULL DEFAULT '', distancia_km numeric(12,2), tempo_estimado_horas numeric(12,2),
  pedagios_previstos numeric(12,2), veiculo_padrao text NOT NULL DEFAULT '',
  placa_sugerida text NOT NULL DEFAULT '', motorista_sugerido text NOT NULL DEFAULT '',
  frequencia text NOT NULL DEFAULT '', pontos_parada jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL DEFAULT 1 CHECK(version > 0),
  created_by uuid REFERENCES auth.users(id), updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  UNIQUE(company_id, source_key), CHECK(jsonb_typeof(pontos_parada)='array')
);
CREATE INDEX IF NOT EXISTS routes_company_name_idx ON public.routes(company_id, nome) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.fleet_containers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id),
  source_key text, codigo text NOT NULL DEFAULT '', nome text NOT NULL DEFAULT '', tipo text NOT NULL DEFAULT '',
  base text NOT NULL DEFAULT '', aquisicao date, idade integer, norma text NOT NULL DEFAULT '',
  laudo_olhais text NOT NULL DEFAULT '', status text NOT NULL DEFAULT '', recomendacao text NOT NULL DEFAULT '',
  version integer NOT NULL DEFAULT 1 CHECK(version > 0),
  created_by uuid REFERENCES auth.users(id), updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  UNIQUE(company_id, source_key)
);
CREATE INDEX IF NOT EXISTS fleet_containers_company_code_idx ON public.fleet_containers(company_id, codigo) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.vehicle_infractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id),
  source_key text, vehicle_id uuid, placa text NOT NULL DEFAULT '', ait text NOT NULL DEFAULT '',
  data date, enquadramento text NOT NULL DEFAULT '', valor_original numeric(14,2),
  valor_com_desconto numeric(14,2), prazo_limite date, status_indicacao text NOT NULL DEFAULT '',
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1 CHECK(version > 0),
  created_by uuid REFERENCES auth.users(id), updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  UNIQUE(company_id, source_key),
  FOREIGN KEY(vehicle_id, company_id) REFERENCES public.veiculos(id, company_id) ON DELETE SET NULL (vehicle_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS vehicle_infractions_company_ait_idx ON public.vehicle_infractions(company_id, ait) WHERE ait <> '' AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS vehicle_infractions_due_idx ON public.vehicle_infractions(company_id, prazo_limite) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.fuel_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id),
  source_key text, vehicle_id uuid, placa_snapshot text NOT NULL DEFAULT '', driver_id uuid,
  occurred_at timestamptz, posto text NOT NULL DEFAULT '', cidade text NOT NULL DEFAULT '',
  combustivel text NOT NULL DEFAULT '', litros numeric(14,3), preco_unitario numeric(14,4),
  valor_total numeric(14,2), km_no_ato integer, arla_litros numeric(14,3), arla_preco_unitario numeric(14,4),
  nf_numero text NOT NULL DEFAULT '', comprovante_ref text NOT NULL DEFAULT '', source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id), created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, source_key),
  FOREIGN KEY(vehicle_id, company_id) REFERENCES public.veiculos(id, company_id) ON DELETE SET NULL,
  FOREIGN KEY(driver_id, company_id) REFERENCES public.motoristas(id, company_id) ON DELETE SET NULL,
  CHECK(litros IS NULL OR litros >= 0), CHECK(valor_total IS NULL OR valor_total >= 0), CHECK(km_no_ato IS NULL OR km_no_ato >= 0)
);
CREATE INDEX IF NOT EXISTS fuel_transactions_company_date_idx ON public.fuel_transactions(company_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS fuel_transactions_vehicle_date_idx ON public.fuel_transactions(company_id, vehicle_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS public.fuel_provision_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id),
  source_key text, nome text NOT NULL DEFAULT '', periodo_inicio date, periodo_fim date,
  data_corte timestamptz, data_envio timestamptz, status text NOT NULL DEFAULT '', status_label text NOT NULL DEFAULT '',
  valor_total_aporte_alvo numeric(14,2), margem_seguranca_pct numeric(7,4), motivo_geral text NOT NULL DEFAULT '',
  version integer NOT NULL DEFAULT 1 CHECK(version > 0),
  created_by uuid REFERENCES auth.users(id), updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, source_key), UNIQUE(id, company_id),
  CHECK(periodo_fim IS NULL OR periodo_inicio IS NULL OR periodo_fim >= periodo_inicio)
);
CREATE INDEX IF NOT EXISTS fuel_provision_cycles_company_period_idx ON public.fuel_provision_cycles(company_id, periodo_inicio DESC);

CREATE TABLE IF NOT EXISTS public.fuel_provision_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id),
  cycle_id uuid NOT NULL,
  source_key text, vehicle_id uuid, placa text NOT NULL DEFAULT '', snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, cycle_id, source_key), UNIQUE(id, company_id),
  FOREIGN KEY(cycle_id, company_id) REFERENCES public.fuel_provision_cycles(id, company_id) ON DELETE CASCADE,
  FOREIGN KEY(vehicle_id, company_id) REFERENCES public.veiculos(id, company_id) ON DELETE SET NULL (vehicle_id)
);
CREATE INDEX IF NOT EXISTS fuel_provision_vehicles_plate_idx ON public.fuel_provision_vehicles(company_id, cycle_id, placa);

CREATE TABLE IF NOT EXISTS public.fuel_provision_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id),
  source_key text, cycle_id uuid, numero_protocolo text NOT NULL DEFAULT '', data_fechamento date, data_solicitacao date,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1 CHECK(version > 0),
  created_by uuid REFERENCES auth.users(id), created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, source_key),
  FOREIGN KEY(cycle_id, company_id) REFERENCES public.fuel_provision_cycles(id, company_id) ON DELETE SET NULL (cycle_id)
);

CREATE TABLE IF NOT EXISTS public.fuel_provision_settings (
  company_id uuid PRIMARY KEY REFERENCES public.companies(id), settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES auth.users(id), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(jsonb_typeof(settings)='object')
);

-- A carga inicial fica isolada e pendente de revisão; não é visível às telas operacionais.
CREATE TABLE IF NOT EXISTS public.operational_data_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id),
  source_name text NOT NULL, source_checksum text NOT NULL CHECK(source_checksum ~ '^[a-f0-9]{64}$'),
  status text NOT NULL DEFAULT 'recebido' CHECK(status IN ('recebido','em_revisao','concluido','falhou')),
  counts jsonb NOT NULL DEFAULT '{}'::jsonb, error_count integer NOT NULL DEFAULT 0 CHECK(error_count >= 0),
  created_by uuid REFERENCES auth.users(id), created_at timestamptz NOT NULL DEFAULT now(), reviewed_by uuid REFERENCES auth.users(id), reviewed_at timestamptz,
  UNIQUE(company_id, source_name, source_checksum), CHECK(jsonb_typeof(counts)='object')
);
CREATE TABLE IF NOT EXISTS public.operational_data_import_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id),
  batch_id uuid NOT NULL, entity text NOT NULL CHECK(entity IN ('vehicle','driver','license','client','route','infraction','container','residue','fuel_vehicle','fuel_cycle','fuel_document','local_storage')),
  source_key text NOT NULL, payload jsonb NOT NULL, review_status text NOT NULL DEFAULT 'pendente'
    CHECK(review_status IN ('pendente','aprovado','rejeitado','importado')),
  target_id uuid, review_note text NOT NULL DEFAULT '', reviewed_by uuid REFERENCES auth.users(id), reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, batch_id, entity, source_key),
  FOREIGN KEY(batch_id) REFERENCES public.operational_data_import_batches(id) ON DELETE CASCADE,
  CHECK(jsonb_typeof(payload)='object')
);
CREATE INDEX IF NOT EXISTS operational_import_review_idx ON public.operational_data_import_rows(company_id, review_status, entity, created_at);

ALTER TABLE public.registros_residuos ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.registros_residuos ADD COLUMN IF NOT EXISTS source_key text;
ALTER TABLE public.registros_residuos ADD COLUMN IF NOT EXISTS numero_mtr text;
ALTER TABLE public.registros_residuos ADD COLUMN IF NOT EXISTS placa_veiculo text;
ALTER TABLE public.registros_residuos ADD COLUMN IF NOT EXISTS status_mtr text;
ALTER TABLE public.registros_residuos ADD COLUMN IF NOT EXISTS data_transporte date;
CREATE UNIQUE INDEX IF NOT EXISTS residuos_company_source_idx ON public.registros_residuos(company_id, source_key) WHERE source_key IS NOT NULL;

-- Todas as tabelas novas usam o mesmo isolamento multiempresa já existente.
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['clientes','routes','fleet_containers','vehicle_infractions','fuel_transactions','fuel_provision_cycles','fuel_provision_vehicles','fuel_provision_documents','fuel_provision_settings','operational_data_import_batches','operational_data_import_rows','registros_residuos'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname='central_company_scope') THEN
      EXECUTE format('CREATE POLICY central_company_scope ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (maintenance_private.can_access_company(company_id)) WITH CHECK (maintenance_private.can_access_company(company_id,true))', t);
      EXECUTE format('CREATE POLICY central_company_read ON public.%I FOR SELECT TO authenticated USING (maintenance_private.can_access_company(company_id))', t);
      EXECUTE format('CREATE POLICY central_company_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (maintenance_private.can_access_company(company_id,true))', t);
      EXECUTE format('CREATE POLICY central_company_update ON public.%I FOR UPDATE TO authenticated USING (maintenance_private.can_access_company(company_id,true)) WITH CHECK (maintenance_private.can_access_company(company_id,true))', t);
      EXECUTE format('CREATE POLICY central_company_delete ON public.%I FOR DELETE TO authenticated USING (maintenance_private.can_access_company(company_id,true))', t);
    END IF;
  END LOOP;
END $$;

COMMIT;
