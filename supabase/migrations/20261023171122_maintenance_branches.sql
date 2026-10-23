BEGIN;
CREATE TABLE public.maintenance_branches(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),company_id uuid NOT NULL REFERENCES public.companies(id),nome text NOT NULL CHECK(length(btrim(nome)) BETWEEN 1 AND 100),ativo boolean NOT NULL DEFAULT true,version integer NOT NULL DEFAULT 1,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL REFERENCES auth.users(id),UNIQUE(id,company_id));
CREATE UNIQUE INDEX branch_name_company ON public.maintenance_branches(company_id,lower(btrim(nome)));
ALTER TABLE public.maintenance_branches ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.maintenance_branches FROM PUBLIC,anon,authenticated;GRANT SELECT ON public.maintenance_branches TO authenticated;GRANT ALL ON public.maintenance_branches TO service_role;
CREATE POLICY branch_read ON public.maintenance_branches FOR SELECT TO authenticated USING(maintenance_private.partner_access(company_id));
CREATE TABLE public.maintenance_analytics_audit(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),company_id uuid NOT NULL REFERENCES public.companies(id),actor_id uuid NOT NULL REFERENCES auth.users(id),action text NOT NULL,entity_id uuid,occurred_at timestamptz NOT NULL DEFAULT now(),snapshot jsonb NOT NULL);
ALTER TABLE public.maintenance_analytics_audit ENABLE ROW LEVEL SECURITY;
CREATE INDEX analytics_audit_company ON public.maintenance_analytics_audit(company_id,occurred_at);CREATE INDEX analytics_audit_actor ON public.maintenance_analytics_audit(actor_id);
REVOKE ALL ON public.maintenance_analytics_audit FROM PUBLIC,anon,authenticated;GRANT SELECT ON public.maintenance_analytics_audit TO authenticated;GRANT ALL ON public.maintenance_analytics_audit TO service_role;
CREATE POLICY analytics_audit_read ON public.maintenance_analytics_audit FOR SELECT TO authenticated USING(maintenance_private.partner_access(company_id,true));
ALTER TABLE public.veiculos ADD COLUMN branch_id uuid,ADD FOREIGN KEY(branch_id,company_id) REFERENCES public.maintenance_branches(id,company_id);
CREATE INDEX vehicle_branch_company ON public.veiculos(company_id,branch_id);
ALTER TABLE public.maintenance_orders ADD COLUMN branch_id uuid,ADD FOREIGN KEY(branch_id,company_id) REFERENCES public.maintenance_branches(id,company_id);
CREATE INDEX order_branch_company ON public.maintenance_orders(company_id,branch_id);
CREATE FUNCTION maintenance_private.branch_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF TG_TABLE_NAME='maintenance_orders' THEN
 IF TG_OP='INSERT' THEN NEW.branch_id:=(SELECT branch_id FROM public.veiculos WHERE id=NEW.vehicle_id AND company_id=NEW.company_id);ELSIF NEW.branch_id IS DISTINCT FROM OLD.branch_id THEN RAISE EXCEPTION 'Filial histórica da OS é imutável.';END IF;
 ELSE
 IF NEW.company_id IS NULL AND NEW.branch_id IS NULL THEN RETURN NEW;END IF;
 IF TG_OP='UPDATE' AND NEW.branch_id IS NOT DISTINCT FROM OLD.branch_id THEN RETURN NEW;END IF;
 IF NEW.branch_id IS NOT NULL THEN
 IF auth.uid() IS NULL OR NOT maintenance_private.partner_access(NEW.company_id,true) THEN RAISE EXCEPTION 'Somente Admin/Analista vinculam filiais.' USING ERRCODE='42501';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.maintenance_branches WHERE id=NEW.branch_id AND company_id=NEW.company_id AND ativo) THEN RAISE EXCEPTION 'Selecione uma filial ativa da empresa.';END IF;
 ELSIF TG_OP='UPDATE' AND auth.uid() IS NOT NULL AND NOT maintenance_private.partner_access(NEW.company_id,true) THEN RAISE EXCEPTION 'Sem permissão para alterar filial.' USING ERRCODE='42501';END IF;
 IF auth.uid() IS NOT NULL THEN INSERT INTO public.maintenance_analytics_audit(company_id,actor_id,action,entity_id,snapshot) VALUES(NEW.company_id,auth.uid(),'veiculo_filial',NEW.id,jsonb_build_object('branch_id',NEW.branch_id));END IF;
 END IF;RETURN NEW;END $$;
CREATE TRIGGER z_branch_guard BEFORE INSERT OR UPDATE OF branch_id ON public.veiculos FOR EACH ROW EXECUTE FUNCTION maintenance_private.branch_guard();
CREATE TRIGGER z_branch_guard BEFORE INSERT OR UPDATE OF branch_id ON public.maintenance_orders FOR EACH ROW EXECUTE FUNCTION maintenance_private.branch_guard();
CREATE FUNCTION maintenance_private.branch_command(c uuid,action text,b jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid();row_branch public.maintenance_branches;BEGIN
 IF actor IS NULL OR NOT maintenance_private.partner_access(c) THEN RAISE EXCEPTION 'Sem acesso à empresa.' USING ERRCODE='42501';END IF;
 PERFORM 1 FROM public.company_members WHERE company_id=c AND user_id=actor AND ativo FOR SHARE;PERFORM 1 FROM public.companies WHERE id=c AND ativo FOR SHARE;
 IF NOT FOUND OR NOT maintenance_private.partner_access(c) THEN RAISE EXCEPTION 'Acesso revogado.' USING ERRCODE='42501';END IF;
 IF action='list' THEN RETURN jsonb_build_object('rows',coalesce((SELECT jsonb_agg(to_jsonb(br) ORDER BY br.nome) FROM public.maintenance_branches br WHERE br.company_id=c),'[]'::jsonb));END IF;
 IF action<>'save' OR NOT maintenance_private.partner_access(c,true) THEN RAISE EXCEPTION 'Somente Admin/Analista gerenciam filiais.' USING ERRCODE='42501';END IF;
 IF length(btrim(coalesce(b->>'nome',''))) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Informe nome de filial até 100 caracteres.';END IF;
 IF nullif(b->>'id','') IS NULL THEN INSERT INTO public.maintenance_branches(company_id,nome,ativo,created_by) VALUES(c,btrim(b->>'nome'),coalesce((b->>'ativo')::boolean,true),actor) RETURNING * INTO row_branch;
 ELSE UPDATE public.maintenance_branches SET nome=btrim(b->>'nome'),ativo=coalesce((b->>'ativo')::boolean,true),updated_at=clock_timestamp(),version=version+1 WHERE company_id=c AND id=(b->>'id')::uuid AND version=(b->>'version')::integer RETURNING * INTO row_branch;IF NOT FOUND THEN RAISE EXCEPTION 'Filial alterada. Atualize a página.' USING ERRCODE='40001';END IF;END IF;
 INSERT INTO public.maintenance_analytics_audit(company_id,actor_id,action,entity_id,snapshot) VALUES(c,actor,'filial_salva',row_branch.id,to_jsonb(row_branch));RETURN to_jsonb(row_branch);
 END $$;
CREATE FUNCTION public.maintenance_branch_command(target_company uuid,command text,body jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT maintenance_private.branch_command(target_company,command,body);$$;
REVOKE ALL ON FUNCTION maintenance_private.branch_guard() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION maintenance_private.branch_command(uuid,text,jsonb),public.maintenance_branch_command(uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION maintenance_private.branch_command(uuid,text,jsonb),public.maintenance_branch_command(uuid,text,jsonb) TO authenticated;
COMMIT;
