-- Stage 1: maintenance data model. Additive, no production seed.
BEGIN;
CREATE TYPE public.partner_type AS ENUM ('oficina_mecanica','eletrica','funilaria_pintura','borracharia','concessionaria','auto_center','guincho_socorro','lavagem','tacografo_rastreador','outros');
CREATE TYPE public.partner_status AS ENUM ('ativo','inativo','bloqueado');
CREATE TYPE public.maintenance_type AS ENUM ('preventiva','corretiva','preditiva','sinistro','revisao','inspecao','pneus');
CREATE TYPE public.priority_level AS ENUM ('baixa','media','alta','critica');
CREATE TYPE public.order_status AS ENUM ('aberta','aguardando_orcamento','orcamento_aprovado','em_transito','na_oficina','em_execucao','aguardando_peca','concluido','veiculo_retirado','encerrada','cancelada');
CREATE TYPE public.occurrence_severity AS ENUM ('leve','moderada','grave','critica');

CREATE TABLE public.maintenance_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  UNIQUE(id,company_id),
  razao_social text NOT NULL CHECK(btrim(razao_social)<>''),
  nome_fantasia text,
  cnpj_cpf text,
  tipo public.partner_type NOT NULL DEFAULT 'oficina_mecanica',
  especialidades text[] NOT NULL DEFAULT '{}',
  tipos_veiculo_atendidos text[] NOT NULL DEFAULT '{}',
  contato_nome text, telefone text, whatsapp text, email text,
  cep text, logradouro text, numero text, complemento text, bairro text, cidade text, estado text, pais text NOT NULL DEFAULT 'BR',
  latitude numeric(10,7) CHECK(latitude BETWEEN -90 AND 90),
  longitude numeric(10,7) CHECK(longitude BETWEEN -180 AND 180),
  horario_funcionamento jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(horario_funcionamento)='object'),
  atende_24h boolean NOT NULL DEFAULT false,
  possui_guincho boolean NOT NULL DEFAULT false,
  valor_hora_mao_obra numeric(14,2) NOT NULL DEFAULT 0 CHECK(valor_hora_mao_obra>=0),
  prazo_pagamento_dias integer NOT NULL DEFAULT 0 CHECK(prazo_pagamento_dias>=0),
  desconto_percentual numeric(5,2) NOT NULL DEFAULT 0 CHECK(desconto_percentual BETWEEN 0 AND 100),
  status public.partner_status NOT NULL DEFAULT 'ativo',
  motivo_bloqueio text,
  avaliacao_interna smallint CHECK(avaliacao_interna BETWEEN 1 AND 5),
  sla_medio_dias numeric(12,2),
  CHECK(status<>'bloqueado' OR nullif(btrim(motivo_bloqueio),'') IS NOT NULL)
);
ALTER TABLE public.maintenance_partners ENABLE ROW LEVEL SECURITY;
CREATE INDEX maintenance_partners_company_idx ON public.maintenance_partners(company_id);
CREATE INDEX maintenance_partners_creator_idx ON public.maintenance_partners(created_by);
CREATE TRIGGER a_maintenance_audit BEFORE INSERT OR UPDATE ON public.maintenance_partners
FOR EACH ROW EXECUTE FUNCTION maintenance_private.audit_row();
CREATE POLICY maintenance_read ON public.maintenance_partners FOR SELECT TO authenticated
USING (maintenance_private.can_access_company(company_id));
CREATE POLICY maintenance_insert ON public.maintenance_partners FOR INSERT TO authenticated
WITH CHECK (maintenance_private.can_access_company(company_id,true));
CREATE POLICY maintenance_update ON public.maintenance_partners FOR UPDATE TO authenticated
USING (maintenance_private.can_access_company(company_id,true))
WITH CHECK (maintenance_private.can_access_company(company_id,true));
CREATE POLICY maintenance_delete ON public.maintenance_partners FOR DELETE TO authenticated
USING (maintenance_private.can_access_company(company_id,true));
REVOKE ALL ON public.maintenance_partners FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.maintenance_partners TO authenticated;
GRANT ALL ON public.maintenance_partners TO service_role;

CREATE TABLE public.maintenance_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  UNIQUE(id,company_id),
  numero text NOT NULL,
  vehicle_id uuid NOT NULL,
  partner_id uuid NOT NULL,
  driver_id uuid,
  tipo public.maintenance_type NOT NULL DEFAULT 'corretiva',
  prioridade public.priority_level NOT NULL DEFAULT 'media',
  status public.order_status NOT NULL DEFAULT 'aberta',
  descricao_problema text NOT NULL CHECK(btrim(descricao_problema)<>''),
  diagnostico text, servicos_executados text,
  km_entrada numeric(14,2) CHECK(km_entrada>=0),
  km_saida numeric(14,2) CHECK(km_saida>=0),
  horimetro numeric(14,2) CHECK(horimetro>=0),
  data_abertura timestamptz NOT NULL DEFAULT now(),
  previsao_entrega timestamptz,
  data_entrada_oficina timestamptz,
  data_saida_oficina timestamptz,
  encerrada_em timestamptz,
  orcamento_status text NOT NULL DEFAULT 'pendente' CHECK(orcamento_status IN ('pendente','aprovado','reprovado')),
  aprovado_por uuid REFERENCES auth.users(id),
  aprovado_em timestamptz,
  valor_pecas numeric(14,2) NOT NULL DEFAULT 0 CHECK(valor_pecas>=0),
  valor_mao_obra numeric(14,2) NOT NULL DEFAULT 0 CHECK(valor_mao_obra>=0),
  valor_total numeric(14,2) GENERATED ALWAYS AS (valor_pecas+valor_mao_obra) STORED,
  observacoes text,
  UNIQUE(company_id,numero),
  UNIQUE(id,company_id,vehicle_id),
  UNIQUE(id,company_id,vehicle_id,partner_id),
  FOREIGN KEY(vehicle_id,company_id) REFERENCES public.veiculos(id,company_id),
  FOREIGN KEY(partner_id,company_id) REFERENCES public.maintenance_partners(id,company_id),
  FOREIGN KEY(driver_id,company_id) REFERENCES public.motoristas(id,company_id),
  FOREIGN KEY(company_id,aprovado_por) REFERENCES public.company_members(company_id,user_id),
  CHECK(km_saida IS NULL OR km_entrada IS NULL OR km_saida>=km_entrada),
  CHECK(data_saida_oficina IS NULL OR (data_entrada_oficina IS NOT NULL AND data_saida_oficina>=data_entrada_oficina)),
  CHECK(data_entrada_oficina IS NULL OR data_entrada_oficina>=data_abertura),
  CHECK(previsao_entrega IS NULL OR previsao_entrega>=data_abertura),
  CHECK(encerrada_em IS NULL OR encerrada_em>=data_abertura),
  CHECK((orcamento_status='aprovado' AND aprovado_por IS NOT NULL AND aprovado_em IS NOT NULL) OR
        (orcamento_status<>'aprovado' AND aprovado_por IS NULL AND aprovado_em IS NULL))
);
ALTER TABLE public.maintenance_orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX maintenance_orders_company_idx ON public.maintenance_orders(company_id);
CREATE INDEX maintenance_orders_creator_idx ON public.maintenance_orders(created_by);
CREATE TRIGGER a_maintenance_audit BEFORE INSERT OR UPDATE ON public.maintenance_orders
FOR EACH ROW EXECUTE FUNCTION maintenance_private.audit_row();
CREATE POLICY maintenance_read ON public.maintenance_orders FOR SELECT TO authenticated
USING (maintenance_private.can_access_company(company_id));
CREATE POLICY maintenance_insert ON public.maintenance_orders FOR INSERT TO authenticated
WITH CHECK (maintenance_private.can_access_company(company_id,true));
CREATE POLICY maintenance_update ON public.maintenance_orders FOR UPDATE TO authenticated
USING (maintenance_private.can_access_company(company_id,true))
WITH CHECK (maintenance_private.can_access_company(company_id,true));
REVOKE ALL ON public.maintenance_orders FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE ON public.maintenance_orders TO authenticated;
GRANT ALL ON public.maintenance_orders TO service_role;
CREATE INDEX maintenance_orders_vehicle_id_idx ON public.maintenance_orders(company_id,vehicle_id);
CREATE INDEX maintenance_orders_partner_id_idx ON public.maintenance_orders(company_id,partner_id);
CREATE INDEX maintenance_orders_driver_id_idx ON public.maintenance_orders(company_id,driver_id);
CREATE INDEX maintenance_orders_aprovado_por_idx ON public.maintenance_orders(company_id,aprovado_por);

CREATE TABLE public.maintenance_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  UNIQUE(id,company_id),
  order_id uuid NOT NULL,
  tipo text NOT NULL CHECK(tipo IN ('peca','servico')),
  descricao text NOT NULL CHECK(btrim(descricao)<>''),
  quantidade numeric(14,3) NOT NULL CHECK(quantidade>0),
  valor_unitario numeric(14,2) NOT NULL CHECK(valor_unitario>=0),
  garantia_dias integer NOT NULL DEFAULT 0 CHECK(garantia_dias>=0),
  FOREIGN KEY(order_id,company_id) REFERENCES public.maintenance_orders(id,company_id)
);
ALTER TABLE public.maintenance_order_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX maintenance_order_items_company_idx ON public.maintenance_order_items(company_id);
CREATE INDEX maintenance_order_items_creator_idx ON public.maintenance_order_items(created_by);
CREATE TRIGGER a_maintenance_audit BEFORE INSERT OR UPDATE ON public.maintenance_order_items
FOR EACH ROW EXECUTE FUNCTION maintenance_private.audit_row();
CREATE POLICY maintenance_read ON public.maintenance_order_items FOR SELECT TO authenticated
USING (maintenance_private.can_access_company(company_id));
CREATE POLICY maintenance_insert ON public.maintenance_order_items FOR INSERT TO authenticated
WITH CHECK (maintenance_private.can_access_company(company_id,true));
CREATE POLICY maintenance_update ON public.maintenance_order_items FOR UPDATE TO authenticated
USING (maintenance_private.can_access_company(company_id,true))
WITH CHECK (maintenance_private.can_access_company(company_id,true));
CREATE POLICY maintenance_delete ON public.maintenance_order_items FOR DELETE TO authenticated
USING (maintenance_private.can_access_company(company_id,true));
REVOKE ALL ON public.maintenance_order_items FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.maintenance_order_items TO authenticated;
GRANT ALL ON public.maintenance_order_items TO service_role;
CREATE INDEX maintenance_order_items_order_id_idx ON public.maintenance_order_items(company_id,order_id);

CREATE TABLE public.maintenance_order_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  UNIQUE(id,company_id),
  order_id uuid NOT NULL,
  tipo_evento text NOT NULL CHECK(tipo_evento IN ('mudanca_status','mensagem','anexo','chegada','saida','aprovacao','comentario')),
  status_anterior public.order_status,
  status_novo public.order_status,
  descricao text NOT NULL,
  usuario_id uuid NOT NULL REFERENCES auth.users(id),
  FOREIGN KEY(order_id,company_id) REFERENCES public.maintenance_orders(id,company_id),
  FOREIGN KEY(company_id,usuario_id) REFERENCES public.company_members(company_id,user_id),
  CHECK(tipo_evento<>'mudanca_status' OR status_novo IS NOT NULL)
);
ALTER TABLE public.maintenance_order_timeline ENABLE ROW LEVEL SECURITY;
CREATE INDEX maintenance_order_timeline_company_idx ON public.maintenance_order_timeline(company_id);
CREATE INDEX maintenance_order_timeline_creator_idx ON public.maintenance_order_timeline(created_by);
CREATE TRIGGER a_maintenance_audit BEFORE INSERT OR UPDATE ON public.maintenance_order_timeline
FOR EACH ROW EXECUTE FUNCTION maintenance_private.audit_row();
CREATE POLICY maintenance_read ON public.maintenance_order_timeline FOR SELECT TO authenticated
USING (maintenance_private.can_access_company(company_id));
CREATE POLICY maintenance_insert ON public.maintenance_order_timeline FOR INSERT TO authenticated
WITH CHECK (maintenance_private.can_access_company(company_id,true));
REVOKE ALL ON public.maintenance_order_timeline FROM anon, authenticated;
GRANT SELECT,INSERT ON public.maintenance_order_timeline TO authenticated;
GRANT ALL ON public.maintenance_order_timeline TO service_role;
CREATE INDEX maintenance_order_timeline_order_id_idx ON public.maintenance_order_timeline(company_id,order_id);
CREATE INDEX maintenance_order_timeline_usuario_id_idx ON public.maintenance_order_timeline(company_id,usuario_id);

CREATE TABLE public.workshop_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  UNIQUE(id,company_id),
  vehicle_id uuid NOT NULL,
  order_id uuid NOT NULL,
  partner_id uuid NOT NULL,
  chegada_em timestamptz NOT NULL DEFAULT now(),
  saida_em timestamptz,
  km_chegada numeric(14,2) CHECK(km_chegada>=0),
  km_saida numeric(14,2) CHECK(km_saida>=0),
  foto_chegada_url text,
  foto_saida_url text,
  registrado_por uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  downtime_horas numeric(14,2) GENERATED ALWAYS AS (round((extract(epoch FROM (saida_em-chegada_em))/3600)::numeric,2)) STORED,
  FOREIGN KEY(order_id,company_id,vehicle_id,partner_id) REFERENCES public.maintenance_orders(id,company_id,vehicle_id,partner_id),
  FOREIGN KEY(vehicle_id,company_id) REFERENCES public.veiculos(id,company_id),
  FOREIGN KEY(partner_id,company_id) REFERENCES public.maintenance_partners(id,company_id),
  FOREIGN KEY(company_id,registrado_por) REFERENCES public.company_members(company_id,user_id),
  CHECK(saida_em IS NULL OR saida_em>=chegada_em),
  CHECK(km_saida IS NULL OR km_chegada IS NULL OR km_saida>=km_chegada),
  CHECK(foto_chegada_url IS NULL OR foto_chegada_url LIKE company_id::text||'/%'),
  CHECK(foto_saida_url IS NULL OR foto_saida_url LIKE company_id::text||'/%')
);
ALTER TABLE public.workshop_visits ENABLE ROW LEVEL SECURITY;
CREATE INDEX workshop_visits_company_idx ON public.workshop_visits(company_id);
CREATE INDEX workshop_visits_creator_idx ON public.workshop_visits(created_by);
CREATE TRIGGER a_maintenance_audit BEFORE INSERT OR UPDATE ON public.workshop_visits
FOR EACH ROW EXECUTE FUNCTION maintenance_private.audit_row();
CREATE POLICY maintenance_read ON public.workshop_visits FOR SELECT TO authenticated
USING (maintenance_private.can_access_company(company_id));
CREATE POLICY maintenance_insert ON public.workshop_visits FOR INSERT TO authenticated
WITH CHECK (maintenance_private.can_access_company(company_id,true));
CREATE POLICY maintenance_update ON public.workshop_visits FOR UPDATE TO authenticated
USING (maintenance_private.can_access_company(company_id,true))
WITH CHECK (maintenance_private.can_access_company(company_id,true));
CREATE POLICY maintenance_delete ON public.workshop_visits FOR DELETE TO authenticated
USING (maintenance_private.can_access_company(company_id,true));
REVOKE ALL ON public.workshop_visits FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.workshop_visits TO authenticated;
GRANT ALL ON public.workshop_visits TO service_role;
CREATE INDEX workshop_visits_vehicle_id_idx ON public.workshop_visits(company_id,vehicle_id);
CREATE INDEX workshop_visits_order_id_idx ON public.workshop_visits(company_id,order_id);
CREATE INDEX workshop_visits_partner_id_idx ON public.workshop_visits(company_id,partner_id);
CREATE INDEX workshop_visits_registrado_por_idx ON public.workshop_visits(company_id,registrado_por);

CREATE TABLE public.vehicle_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  UNIQUE(id,company_id),
  vehicle_id uuid NOT NULL,
  driver_id uuid,
  order_id uuid,
  tipo text NOT NULL CHECK(tipo IN ('quebra','acidente','pane_eletrica','pneu','sinistro','outros')),
  gravidade public.occurrence_severity NOT NULL DEFAULT 'leve',
  descricao text NOT NULL CHECK(btrim(descricao)<>''),
  local text,
  latitude numeric(10,7) CHECK(latitude BETWEEN -90 AND 90),
  longitude numeric(10,7) CHECK(longitude BETWEEN -180 AND 180),
  ocorreu_em timestamptz NOT NULL DEFAULT now(),
  fotos text[] NOT NULL DEFAULT '{}',
  FOREIGN KEY(vehicle_id,company_id) REFERENCES public.veiculos(id,company_id),
  FOREIGN KEY(driver_id,company_id) REFERENCES public.motoristas(id,company_id),
  FOREIGN KEY(order_id,company_id,vehicle_id) REFERENCES public.maintenance_orders(id,company_id,vehicle_id)
);
ALTER TABLE public.vehicle_occurrences ENABLE ROW LEVEL SECURITY;
CREATE INDEX vehicle_occurrences_company_idx ON public.vehicle_occurrences(company_id);
CREATE INDEX vehicle_occurrences_creator_idx ON public.vehicle_occurrences(created_by);
CREATE TRIGGER a_maintenance_audit BEFORE INSERT OR UPDATE ON public.vehicle_occurrences
FOR EACH ROW EXECUTE FUNCTION maintenance_private.audit_row();
CREATE POLICY maintenance_read ON public.vehicle_occurrences FOR SELECT TO authenticated
USING (maintenance_private.can_access_company(company_id));
CREATE POLICY maintenance_insert ON public.vehicle_occurrences FOR INSERT TO authenticated
WITH CHECK (maintenance_private.can_access_company(company_id,true));
CREATE POLICY maintenance_update ON public.vehicle_occurrences FOR UPDATE TO authenticated
USING (maintenance_private.can_access_company(company_id,true))
WITH CHECK (maintenance_private.can_access_company(company_id,true));
CREATE POLICY maintenance_delete ON public.vehicle_occurrences FOR DELETE TO authenticated
USING (maintenance_private.can_access_company(company_id,true));
REVOKE ALL ON public.vehicle_occurrences FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.vehicle_occurrences TO authenticated;
GRANT ALL ON public.vehicle_occurrences TO service_role;
CREATE INDEX vehicle_occurrences_vehicle_id_idx ON public.vehicle_occurrences(company_id,vehicle_id);
CREATE INDEX vehicle_occurrences_driver_id_idx ON public.vehicle_occurrences(company_id,driver_id);
CREATE INDEX vehicle_occurrences_order_id_idx ON public.vehicle_occurrences(company_id,order_id);

CREATE TABLE public.maintenance_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  UNIQUE(id,company_id),
  order_id uuid NOT NULL,
  partner_id uuid NOT NULL,
  direcao text NOT NULL CHECK(direcao IN ('enviada','recebida')),
  canal text NOT NULL CHECK(canal IN ('whatsapp','email','interno')),
  conteudo text NOT NULL CHECK(btrim(conteudo)<>''),
  enviado_por uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  FOREIGN KEY(order_id,company_id) REFERENCES public.maintenance_orders(id,company_id),
  FOREIGN KEY(partner_id,company_id) REFERENCES public.maintenance_partners(id,company_id),
  FOREIGN KEY(company_id,enviado_por) REFERENCES public.company_members(company_id,user_id)
);
ALTER TABLE public.maintenance_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX maintenance_messages_company_idx ON public.maintenance_messages(company_id);
CREATE INDEX maintenance_messages_creator_idx ON public.maintenance_messages(created_by);
CREATE TRIGGER a_maintenance_audit BEFORE INSERT OR UPDATE ON public.maintenance_messages
FOR EACH ROW EXECUTE FUNCTION maintenance_private.audit_row();
CREATE POLICY maintenance_read ON public.maintenance_messages FOR SELECT TO authenticated
USING (maintenance_private.can_access_company(company_id));
CREATE POLICY maintenance_insert ON public.maintenance_messages FOR INSERT TO authenticated
WITH CHECK (maintenance_private.can_access_company(company_id,true));
REVOKE ALL ON public.maintenance_messages FROM anon, authenticated;
GRANT SELECT,INSERT ON public.maintenance_messages TO authenticated;
GRANT ALL ON public.maintenance_messages TO service_role;
CREATE INDEX maintenance_messages_order_id_idx ON public.maintenance_messages(company_id,order_id);
CREATE INDEX maintenance_messages_partner_id_idx ON public.maintenance_messages(company_id,partner_id);
CREATE INDEX maintenance_messages_enviado_por_idx ON public.maintenance_messages(company_id,enviado_por);

CREATE TABLE public.maintenance_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  UNIQUE(id,company_id),
  vehicle_id uuid,
  categoria_veiculo text,
  nome text NOT NULL CHECK(btrim(nome)<>''),
  intervalo_km numeric(14,2) CHECK(intervalo_km>0),
  intervalo_dias integer CHECK(intervalo_dias>0),
  ultima_execucao_km numeric(14,2) CHECK(ultima_execucao_km>=0),
  ultima_execucao_data date,
  proxima_km numeric(14,2) GENERATED ALWAYS AS (ultima_execucao_km+intervalo_km) STORED,
  proxima_data date GENERATED ALWAYS AS (ultima_execucao_data+intervalo_dias) STORED,
  ativo boolean NOT NULL DEFAULT true,
  FOREIGN KEY(vehicle_id,company_id) REFERENCES public.veiculos(id,company_id),
  CHECK((vehicle_id IS NOT NULL)::integer+(nullif(btrim(categoria_veiculo),'') IS NOT NULL)::integer=1),
  CHECK(intervalo_km IS NOT NULL OR intervalo_dias IS NOT NULL)
);
ALTER TABLE public.maintenance_plans ENABLE ROW LEVEL SECURITY;
CREATE INDEX maintenance_plans_company_idx ON public.maintenance_plans(company_id);
CREATE INDEX maintenance_plans_creator_idx ON public.maintenance_plans(created_by);
CREATE TRIGGER a_maintenance_audit BEFORE INSERT OR UPDATE ON public.maintenance_plans
FOR EACH ROW EXECUTE FUNCTION maintenance_private.audit_row();
CREATE POLICY maintenance_read ON public.maintenance_plans FOR SELECT TO authenticated
USING (maintenance_private.can_access_company(company_id));
CREATE POLICY maintenance_insert ON public.maintenance_plans FOR INSERT TO authenticated
WITH CHECK (maintenance_private.can_access_company(company_id,true));
CREATE POLICY maintenance_update ON public.maintenance_plans FOR UPDATE TO authenticated
USING (maintenance_private.can_access_company(company_id,true))
WITH CHECK (maintenance_private.can_access_company(company_id,true));
CREATE POLICY maintenance_delete ON public.maintenance_plans FOR DELETE TO authenticated
USING (maintenance_private.can_access_company(company_id,true));
REVOKE ALL ON public.maintenance_plans FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.maintenance_plans TO authenticated;
GRANT ALL ON public.maintenance_plans TO service_role;
CREATE INDEX maintenance_plans_vehicle_id_idx ON public.maintenance_plans(company_id,vehicle_id);

CREATE TABLE public.maintenance_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  UNIQUE(id,company_id),
  order_id uuid NOT NULL,
  tipo text NOT NULL CHECK(tipo IN ('foto_antes','foto_depois','orcamento','nota_fiscal','outros')),
  url text NOT NULL CHECK(url LIKE company_id::text||'/%'),
  nome text NOT NULL CHECK(btrim(nome)<>''),
  enviado_por uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  FOREIGN KEY(order_id,company_id) REFERENCES public.maintenance_orders(id,company_id),
  FOREIGN KEY(company_id,enviado_por) REFERENCES public.company_members(company_id,user_id)
);
ALTER TABLE public.maintenance_attachments ENABLE ROW LEVEL SECURITY;
CREATE INDEX maintenance_attachments_company_idx ON public.maintenance_attachments(company_id);
CREATE INDEX maintenance_attachments_creator_idx ON public.maintenance_attachments(created_by);
CREATE TRIGGER a_maintenance_audit BEFORE INSERT OR UPDATE ON public.maintenance_attachments
FOR EACH ROW EXECUTE FUNCTION maintenance_private.audit_row();
CREATE POLICY maintenance_read ON public.maintenance_attachments FOR SELECT TO authenticated
USING (maintenance_private.can_access_company(company_id));
CREATE POLICY maintenance_insert ON public.maintenance_attachments FOR INSERT TO authenticated
WITH CHECK (maintenance_private.can_access_company(company_id,true));
CREATE POLICY maintenance_update ON public.maintenance_attachments FOR UPDATE TO authenticated
USING (maintenance_private.can_access_company(company_id,true))
WITH CHECK (maintenance_private.can_access_company(company_id,true));
CREATE POLICY maintenance_delete ON public.maintenance_attachments FOR DELETE TO authenticated
USING (maintenance_private.can_access_company(company_id,true));
REVOKE ALL ON public.maintenance_attachments FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.maintenance_attachments TO authenticated;
GRANT ALL ON public.maintenance_attachments TO service_role;
CREATE INDEX maintenance_attachments_order_id_idx ON public.maintenance_attachments(company_id,order_id);
CREATE INDEX maintenance_attachments_enviado_por_idx ON public.maintenance_attachments(company_id,enviado_por);

CREATE TABLE public.maintenance_message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  UNIQUE(id,company_id),
  nome text NOT NULL CHECK(btrim(nome)<>''),
  categoria text NOT NULL,
  conteudo text NOT NULL CHECK(btrim(conteudo)<>''),
  ativo boolean NOT NULL DEFAULT true,
  UNIQUE(company_id,nome)
);
ALTER TABLE public.maintenance_message_templates ENABLE ROW LEVEL SECURITY;
CREATE INDEX maintenance_message_templates_company_idx ON public.maintenance_message_templates(company_id);
CREATE INDEX maintenance_message_templates_creator_idx ON public.maintenance_message_templates(created_by);
CREATE TRIGGER a_maintenance_audit BEFORE INSERT OR UPDATE ON public.maintenance_message_templates
FOR EACH ROW EXECUTE FUNCTION maintenance_private.audit_row();
CREATE POLICY maintenance_read ON public.maintenance_message_templates FOR SELECT TO authenticated
USING (maintenance_private.can_access_company(company_id));
CREATE POLICY maintenance_insert ON public.maintenance_message_templates FOR INSERT TO authenticated
WITH CHECK (maintenance_private.can_access_company(company_id,true));
CREATE POLICY maintenance_update ON public.maintenance_message_templates FOR UPDATE TO authenticated
USING (maintenance_private.can_access_company(company_id,true))
WITH CHECK (maintenance_private.can_access_company(company_id,true));
CREATE POLICY maintenance_delete ON public.maintenance_message_templates FOR DELETE TO authenticated
USING (maintenance_private.can_access_company(company_id,true));
REVOKE ALL ON public.maintenance_message_templates FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.maintenance_message_templates TO authenticated;
GRANT ALL ON public.maintenance_message_templates TO service_role;

CREATE TABLE public.maintenance_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  UNIQUE(id,company_id),
  limite_aprovacao_supervisor numeric(14,2) NOT NULL DEFAULT 5000 CHECK(limite_aprovacao_supervisor>=0),
  antecedencia_alerta_dias integer NOT NULL DEFAULT 7 CHECK(antecedencia_alerta_dias>=0),
  antecedencia_alerta_km numeric(14,2) NOT NULL DEFAULT 1000 CHECK(antecedencia_alerta_km>=0),
  intervalo_cobranca_horas integer NOT NULL DEFAULT 24 CHECK(intervalo_cobranca_horas>0),
  UNIQUE(company_id)
);
ALTER TABLE public.maintenance_settings ENABLE ROW LEVEL SECURITY;
CREATE INDEX maintenance_settings_company_idx ON public.maintenance_settings(company_id);
CREATE INDEX maintenance_settings_creator_idx ON public.maintenance_settings(created_by);
CREATE TRIGGER a_maintenance_audit BEFORE INSERT OR UPDATE ON public.maintenance_settings
FOR EACH ROW EXECUTE FUNCTION maintenance_private.audit_row();
CREATE POLICY maintenance_read ON public.maintenance_settings FOR SELECT TO authenticated
USING (maintenance_private.can_access_company(company_id));
CREATE POLICY maintenance_insert ON public.maintenance_settings FOR INSERT TO authenticated
WITH CHECK (maintenance_private.can_access_company(company_id,true));
CREATE POLICY maintenance_update ON public.maintenance_settings FOR UPDATE TO authenticated
USING (maintenance_private.can_access_company(company_id,true))
WITH CHECK (maintenance_private.can_access_company(company_id,true));
CREATE POLICY maintenance_delete ON public.maintenance_settings FOR DELETE TO authenticated
USING (maintenance_private.can_access_company(company_id,true));
REVOKE ALL ON public.maintenance_settings FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.maintenance_settings TO authenticated;
GRANT ALL ON public.maintenance_settings TO service_role;

CREATE INDEX maintenance_orders_active_vehicle_idx ON public.maintenance_orders(company_id,vehicle_id)
WHERE status NOT IN ('encerrada','cancelada');
CREATE INDEX maintenance_orders_partner_closed_idx ON public.maintenance_orders(company_id,partner_id,encerrada_em)
WHERE status='encerrada';
CREATE INDEX maintenance_order_timeline_order_time_idx ON public.maintenance_order_timeline(company_id,order_id,created_at);
CREATE UNIQUE INDEX workshop_visits_one_open_per_vehicle ON public.workshop_visits(company_id,vehicle_id) WHERE saida_em IS NULL;
COMMIT;
