-- Stage 2: partner registry, explicit module roles, private attachments and audit.
BEGIN;
ALTER TABLE public.company_members ADD COLUMN maintenance_role text
CHECK(maintenance_role IN ('admin_geral','admin_empresa','analista_transporte','supervisor','operador_logistico','motorista','cliente'));
CREATE FUNCTION maintenance_private.partner_access(target uuid,writing boolean DEFAULT false)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path=''
AS $$
 SELECT EXISTS(SELECT 1 FROM public.company_members m JOIN public.companies c ON c.id=m.company_id AND c.ativo
 WHERE m.company_id=target AND m.user_id=(SELECT auth.uid()) AND m.ativo
 AND coalesce(m.maintenance_role,CASE m.role WHEN 'administrador' THEN 'admin_empresa' WHEN 'analista' THEN 'analista_transporte' WHEN 'gestor' THEN 'supervisor' ELSE 'operador_logistico' END)
 =ANY(CASE WHEN writing THEN ARRAY['admin_geral','admin_empresa','analista_transporte'] ELSE ARRAY['admin_geral','admin_empresa','analista_transporte','supervisor','operador_logistico'] END));
$$;
REVOKE ALL ON FUNCTION maintenance_private.partner_access(uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION maintenance_private.partner_access(uuid,boolean) TO authenticated,service_role;
DO $$ DECLARE t text; BEGIN
FOREACH t IN ARRAY ARRAY['maintenance_partners','maintenance_orders','maintenance_order_items','maintenance_attachments','maintenance_order_timeline','workshop_visits','vehicle_occurrences','maintenance_messages','maintenance_plans','maintenance_message_templates','maintenance_settings']
LOOP
 IF to_regclass('public.'||t) IS NOT NULL THEN
 EXECUTE format('CREATE POLICY module_read_guard ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated USING(maintenance_private.partner_access(company_id))',t);
 EXECUTE format('CREATE POLICY module_insert_guard ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(maintenance_private.partner_access(company_id,true))',t);
 EXECUTE format('CREATE POLICY module_update_guard ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated USING(maintenance_private.partner_access(company_id,true)) WITH CHECK(maintenance_private.partner_access(company_id,true))',t);
 EXECUTE format('CREATE POLICY module_delete_guard ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated USING(maintenance_private.partner_access(company_id,true))',t);
 END IF;
END LOOP; END $$;
ALTER TABLE public.maintenance_partners ADD COLUMN version integer NOT NULL DEFAULT 1;
CREATE UNIQUE INDEX maintenance_partner_document_unique ON public.maintenance_partners(company_id,upper(regexp_replace(cnpj_cpf,'[^A-Za-z0-9]','','g'))) WHERE nullif(cnpj_cpf,'') IS NOT NULL;
CREATE POLICY partner_module_insert ON public.maintenance_partners FOR INSERT TO authenticated WITH CHECK(maintenance_private.partner_access(company_id,true));
CREATE POLICY partner_module_update ON public.maintenance_partners FOR UPDATE TO authenticated USING(maintenance_private.partner_access(company_id,true)) WITH CHECK(maintenance_private.partner_access(company_id,true));
CREATE TABLE public.maintenance_partner_attachments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),company_id uuid NOT NULL REFERENCES public.companies(id),
 partner_id uuid NOT NULL,categoria text NOT NULL CHECK(categoria IN ('contrato','certidao','tabela_precos')),
 nome text NOT NULL CHECK(btrim(nome)<>''),object_path text NOT NULL UNIQUE,content_type text NOT NULL,
 tamanho_bytes bigint NOT NULL CHECK(tamanho_bytes BETWEEN 1 AND 20971520),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
 FOREIGN KEY(partner_id,company_id) REFERENCES public.maintenance_partners(id,company_id),
 CHECK(object_path LIKE company_id::text||'/partners/'||partner_id::text||'/%'),
 CHECK(content_type IN ('application/pdf','image/png','image/jpeg','image/webp','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'))
);
CREATE INDEX maintenance_partner_files_partner_idx ON public.maintenance_partner_attachments(company_id,partner_id);
CREATE INDEX maintenance_partner_files_creator_idx ON public.maintenance_partner_attachments(created_by);
CREATE TABLE public.maintenance_partner_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),company_id uuid NOT NULL REFERENCES public.companies(id),partner_id uuid NOT NULL,
 acao text NOT NULL CHECK(acao IN ('criacao','edicao','bloqueio','desbloqueio','anexo_incluido','anexo_excluido')),
 antes jsonb,depois jsonb,created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL REFERENCES auth.users(id),
 FOREIGN KEY(partner_id,company_id) REFERENCES public.maintenance_partners(id,company_id)
);
CREATE INDEX maintenance_partner_audit_partner_idx ON public.maintenance_partner_audit(company_id,partner_id,created_at DESC);
CREATE INDEX maintenance_partner_audit_creator_idx ON public.maintenance_partner_audit(created_by);
ALTER TABLE public.maintenance_partner_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_partner_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY partner_files_read ON public.maintenance_partner_attachments FOR SELECT TO authenticated USING(maintenance_private.partner_access(company_id));
CREATE POLICY partner_files_insert ON public.maintenance_partner_attachments FOR INSERT TO authenticated WITH CHECK(maintenance_private.partner_access(company_id,true));
CREATE POLICY partner_files_delete ON public.maintenance_partner_attachments FOR DELETE TO authenticated USING(maintenance_private.partner_access(company_id,true));
CREATE POLICY partner_audit_read ON public.maintenance_partner_audit FOR SELECT TO authenticated USING(maintenance_private.partner_access(company_id));
REVOKE ALL ON public.maintenance_partner_attachments,public.maintenance_partner_audit FROM anon,authenticated;
GRANT SELECT,INSERT,DELETE ON public.maintenance_partner_attachments TO authenticated;
GRANT SELECT ON public.maintenance_partner_audit TO authenticated;
GRANT ALL ON public.maintenance_partner_attachments,public.maintenance_partner_audit TO service_role;
CREATE FUNCTION maintenance_private.partner_prepare() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF NOT maintenance_private.is_provisioner() AND NOT maintenance_private.partner_access(NEW.company_id,true) THEN RAISE EXCEPTION 'Partner write denied' USING ERRCODE='42501'; END IF;
 IF TG_OP='UPDATE' THEN
 IF NEW.id IS DISTINCT FROM OLD.id OR NEW.company_id IS DISTINCT FROM OLD.company_id OR NEW.created_by IS DISTINCT FROM OLD.created_by OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN RAISE EXCEPTION 'Immutable identity' USING ERRCODE='23514'; END IF;
 NEW.version:=OLD.version+1;
 ELSE
 NEW.version:=1;
 IF NOT maintenance_private.is_provisioner() THEN NEW.created_by:=auth.uid(); END IF;
 NEW.created_at:=clock_timestamp();
 END IF;
 NEW.updated_at:=clock_timestamp(); RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION maintenance_private.partner_prepare() FROM PUBLIC;
DROP TRIGGER a_maintenance_audit ON public.maintenance_partners;
CREATE TRIGGER a_maintenance_audit BEFORE INSERT OR UPDATE ON public.maintenance_partners FOR EACH ROW EXECUTE FUNCTION maintenance_private.partner_prepare();
CREATE FUNCTION maintenance_private.partner_file_prepare() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF NOT maintenance_private.is_provisioner() AND NOT maintenance_private.partner_access(NEW.company_id,true) THEN RAISE EXCEPTION 'Attachment write denied' USING ERRCODE='42501'; END IF;
 IF NOT maintenance_private.is_provisioner() THEN NEW.created_by:=auth.uid(); END IF;
 NEW.created_at:=clock_timestamp();NEW.updated_at:=NEW.created_at;RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION maintenance_private.partner_file_prepare() FROM PUBLIC;
CREATE TRIGGER partner_file_stamp BEFORE INSERT ON public.maintenance_partner_attachments FOR EACH ROW EXECUTE FUNCTION maintenance_private.partner_file_prepare();
-- Definer is confined to a private trigger with a fresh membership check. Clients have no write grant on audit.
CREATE FUNCTION maintenance_private.partner_audit_event() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c uuid;p uuid;action text;before_value jsonb;after_value jsonb;actor uuid;
BEGIN
 IF TG_OP='DELETE' THEN c:=OLD.company_id;p:=OLD.partner_id;before_value:=to_jsonb(OLD);
 ELSE c:=NEW.company_id;after_value:=to_jsonb(NEW);IF TG_TABLE_NAME='maintenance_partners' THEN p:=NEW.id;ELSE p:=NEW.partner_id;END IF; END IF;
 IF TG_OP='UPDATE' THEN before_value:=to_jsonb(OLD);END IF;
 actor:=auth.uid();IF actor IS NULL THEN IF TG_OP='DELETE' THEN actor:=OLD.created_by;ELSE actor:=NEW.created_by;END IF;END IF;
 IF NOT maintenance_private.is_provisioner() AND NOT maintenance_private.partner_access(c,true) THEN RAISE EXCEPTION 'Audit membership denied' USING ERRCODE='42501'; END IF;
 IF TG_TABLE_NAME='maintenance_partners' THEN
 action:=CASE WHEN TG_OP='INSERT' THEN 'criacao' WHEN NEW.status='bloqueado' AND OLD.status<>'bloqueado' THEN 'bloqueio' WHEN NEW.status<>'bloqueado' AND OLD.status='bloqueado' THEN 'desbloqueio' ELSE 'edicao' END;
 ELSE action:=CASE WHEN TG_OP='DELETE' THEN 'anexo_excluido' ELSE 'anexo_incluido' END;END IF;
 INSERT INTO public.maintenance_partner_audit(company_id,partner_id,acao,antes,depois,created_by) VALUES(c,p,action,before_value,after_value,actor);
 RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION maintenance_private.partner_audit_event() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER partner_audit_event AFTER INSERT OR UPDATE ON public.maintenance_partners FOR EACH ROW EXECUTE FUNCTION maintenance_private.partner_audit_event();
CREATE TRIGGER partner_file_audit AFTER INSERT OR DELETE ON public.maintenance_partner_attachments FOR EACH ROW EXECUTE FUNCTION maintenance_private.partner_audit_event();
CREATE OR REPLACE FUNCTION maintenance_private.storage_access(object_name text,writing boolean DEFAULT false)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.company_members m
 WHERE m.company_id::text=split_part(object_name,'/',1) AND m.user_id=(SELECT auth.uid()) AND m.ativo AND length(split_part(object_name,'/',2))>0
 AND CASE WHEN split_part(object_name,'/',2)='partners' THEN
 maintenance_private.partner_access(m.company_id,writing)
 AND EXISTS(SELECT 1 FROM public.maintenance_partners p WHERE p.company_id=m.company_id AND p.id::text=split_part(object_name,'/',3))
 AND length(split_part(object_name,'/',4))>0
 ELSE maintenance_private.partner_access(m.company_id,writing) END);
$$;
CREATE FUNCTION public.maintenance_partner_metrics(target_company uuid,target_partner uuid)
RETURNS TABLE(total_os bigint,custo_medio numeric) LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT count(*),round(avg(o.valor_total) FILTER(WHERE o.status='encerrada'),2)
 FROM public.maintenance_orders o WHERE o.company_id=target_company AND o.partner_id=target_partner AND maintenance_private.partner_access(target_company);
$$;
CREATE FUNCTION public.maintenance_partner_cities(target_company uuid) RETURNS TABLE(cidade text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT DISTINCT p.cidade FROM public.maintenance_partners p WHERE p.company_id=target_company AND nullif(p.cidade,'') IS NOT NULL AND maintenance_private.partner_access(target_company) ORDER BY p.cidade;
$$;
REVOKE ALL ON FUNCTION public.maintenance_partner_metrics(uuid,uuid),public.maintenance_partner_cities(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.maintenance_partner_metrics(uuid,uuid),public.maintenance_partner_cities(uuid) TO authenticated,service_role;
UPDATE storage.buckets SET file_size_limit=20971520,allowed_mime_types=ARRAY['application/pdf','image/png','image/jpeg','image/webp','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] WHERE id='maintenance';
COMMIT;
