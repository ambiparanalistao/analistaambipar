BEGIN;
ALTER TABLE public.maintenance_partners ADD COLUMN deleted_at timestamptz,ADD COLUMN deleted_by uuid REFERENCES auth.users(id);
CREATE INDEX partners_not_deleted ON public.maintenance_partners(company_id,deleted_at);
ALTER TABLE public.maintenance_orders ADD COLUMN quote_partner_types text[] NOT NULL DEFAULT '{}';
CREATE FUNCTION maintenance_private.quote_types_valid(selected text[]) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path='' AS $$ SELECT coalesce(cardinality(selected)<=11 AND selected<@ARRAY['oficina_mecanica','eletrica','funilaria_pintura','borracharia','concessionaria','auto_center','guincho_socorro','lavagem','tacografo_rastreador','pecas_acessorios','outros']::text[] AND array_position(selected,NULL) IS NULL,false);$$;
REVOKE ALL ON FUNCTION maintenance_private.quote_types_valid(text[]) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION maintenance_private.quote_types_valid(text[]) TO authenticated;
CREATE FUNCTION maintenance_private.quote_partner_matches(c uuid,partner uuid,selected text[]) RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.maintenance_partners p CROSS JOIN unnest(coalesce(selected,'{}')) chosen(code) JOIN (VALUES('oficina_mecanica','Oficina mecânica'),('eletrica','Auto elétrica'),('funilaria_pintura','Funilaria e pintura'),('borracharia','Borracharia'),('concessionaria','Concessionária'),('auto_center','Auto center'),('guincho_socorro','Guincho e socorro'),('lavagem','Lavagem'),('tacografo_rastreador','Tacógrafo e rastreador'),('pecas_acessorios','Peças e acessórios'),('outros','Outros')) types(code,label) ON types.code=chosen.code WHERE p.id=partner AND p.company_id=c AND p.status='ativo' AND p.deleted_at IS NULL AND jsonb_typeof(p.onboarding_profile->'tipos_oficina')='array' AND (p.onboarding_profile->'tipos_oficina') ? types.label);$$;
REVOKE ALL ON FUNCTION maintenance_private.quote_partner_matches(uuid,uuid,text[]) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION maintenance_private.quote_partner_matches(uuid,uuid,text[]) TO authenticated;
CREATE OR REPLACE FUNCTION maintenance_private.queue_order_dispatch() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE k text;p public.maintenance_partners;BEGIN
 IF TG_OP='INSERT' THEN k:='abertura';ELSIF NEW.orcamento_status='aprovado' AND NEW.aprovado_em IS DISTINCT FROM OLD.aprovado_em THEN k:='aprovacao';ELSIF NEW.quote_partner_types IS DISTINCT FROM OLD.quote_partner_types AND NEW.orcamento_status<>'aprovado' AND NEW.status NOT IN ('encerrada','cancelada') THEN k:='abertura';END IF;
 IF TG_OP='UPDATE' AND ROW(NEW.prazo_entrega_dias,NEW.previsao_entrega,NEW.prazo_base_aprovacao_em) IS DISTINCT FROM ROW(OLD.prazo_entrega_dias,OLD.previsao_entrega,OLD.prazo_base_aprovacao_em) THEN PERFORM maintenance_private.order_event(NEW.company_id,NEW.id,'comentario','Previsão após aprovação atualizada',jsonb_build_object('dias_corridos',NEW.prazo_entrega_dias,'aprovacao_em',NEW.prazo_base_aprovacao_em,'previsao_entrega',NEW.previsao_entrega));END IF;
 IF k IS NOT NULL AND auth.uid() IS NOT NULL THEN
 IF k='abertura' THEN
 UPDATE public.maintenance_order_dispatches SET status='obsolete',error_message='Oficina fora dos filtros selecionados.',updated_at=clock_timestamp() WHERE company_id=NEW.company_id AND order_id=NEW.id AND kind='abertura' AND status IN ('pending','failed','unavailable') AND NOT maintenance_private.quote_partner_matches(NEW.company_id,recipient_partner_id,NEW.quote_partner_types);
 FOR p IN SELECT * FROM public.maintenance_partners WHERE company_id=NEW.company_id AND maintenance_private.quote_partner_matches(NEW.company_id,id,NEW.quote_partner_types) ORDER BY id FOR SHARE LOOP
 INSERT INTO public.maintenance_order_dispatches(company_id,order_id,recipient_partner_id,kind,event_key,snapshot) VALUES(NEW.company_id,NEW.id,p.id,k,'abertura:'||p.id::text,maintenance_private.order_quote_snapshot(NEW.company_id,NEW.id,p.id)) ON CONFLICT(order_id,event_key) DO UPDATE SET status='pending',error_message=NULL,snapshot=excluded.snapshot,updated_at=clock_timestamp() WHERE public.maintenance_order_dispatches.status IN ('obsolete','failed','unavailable');
 END LOOP;
 ELSE
 UPDATE public.maintenance_order_dispatches SET status='obsolete',error_message='Orçamento já aprovado.',updated_at=clock_timestamp() WHERE company_id=NEW.company_id AND order_id=NEW.id AND kind='abertura' AND status IN ('pending','failed','unavailable');
 INSERT INTO public.maintenance_order_dispatches(company_id,order_id,recipient_partner_id,kind,event_key,approval_at,snapshot) VALUES(NEW.company_id,NEW.id,NEW.partner_id,k,'aprovacao:'||NEW.aprovado_em::text,NEW.aprovado_em,maintenance_private.order_document(NEW.company_id,NEW.id)) ON CONFLICT(order_id,event_key) DO NOTHING;
 END IF;END IF;RETURN NEW;END $$;
DO $$ DECLARE def text;BEGIN
 SELECT pg_get_functiondef('maintenance_private.prepare_order()'::regprocedure) INTO def;
 def:=replace(def,'BEGIN'||chr(10)||'  IF NOT maintenance_private.is_provisioner()', 'BEGIN'||chr(10)||' IF NOT maintenance_private.quote_types_valid(NEW.quote_partner_types) THEN RAISE EXCEPTION ''Filtros de oficinas inválidos.'';END IF;'||chr(10)||'  IF NOT maintenance_private.is_provisioner()');EXECUTE def;
 SELECT pg_get_functiondef('maintenance_private.order_command(uuid,text,jsonb)'::regprocedure) INTO def;
 def:=replace(def,'previsao_entrega,prazo_entrega_dias)','previsao_entrega,prazo_entrega_dias,quote_partner_types)');
 def:=replace(def,'coalesce(nullif(payload->>''prazo_entrega_dias'','''')::integer,nullif(partner.onboarding_profile->>''prazo_entrega_dias'','''')::integer))','coalesce(nullif(payload->>''prazo_entrega_dias'','''')::integer,nullif(partner.onboarding_profile->>''prazo_entrega_dias'','''')::integer),ARRAY(SELECT jsonb_array_elements_text(coalesce(payload->''quote_partner_types'',''[]''::jsonb))))');EXECUTE def;
 SELECT pg_get_functiondef('maintenance_private.order_dispatch_command(uuid,text,jsonb)'::regprocedure) INTO def;
 def:=replace(def,'IF action=''select_partner'' THEN',$action$
 IF action='select_quote_types' THEN
 IF NOT EXISTS(SELECT 1 FROM public.company_members m WHERE m.company_id=c AND m.user_id=actor AND m.ativo AND maintenance_private.module_role(m) IN ('admin_geral','admin_empresa','analista_transporte','supervisor','operador_logistico')) THEN RAISE EXCEPTION 'Sem permissão para definir o envio.' USING ERRCODE='42501';END IF;
 IF o.status IN ('encerrada','cancelada') THEN RAISE EXCEPTION 'Não é permitido alterar filtros após encerramento.';END IF;IF o.orcamento_status='aprovado' AND NOT maintenance_private.partner_access(c,true) THEN RAISE EXCEPTION 'Somente Admin/Analista altera filtros após aprovação.' USING ERRCODE='42501';END IF;
 IF o.version IS DISTINCT FROM (b->>'version')::integer THEN RAISE EXCEPTION 'Atualize a S.OR antes de alterar o filtro.' USING ERRCODE='40001';END IF;
 UPDATE public.maintenance_orders SET quote_partner_types=ARRAY(SELECT jsonb_array_elements_text(coalesce(b->'types','[]'::jsonb))) WHERE id=o.id RETURNING * INTO o;
 PERFORM maintenance_private.order_event(c,o.id,'comentario','Filtros de destinatários da cotação definidos',jsonb_build_object('tipos',o.quote_partner_types));RETURN to_jsonb(o);END IF;
 IF action='select_partner' THEN$action$);
 def:=replace(def,'IF action=''claim'' THEN',$guard$IF action='claim' THEN
 IF d.status<>'accepted' AND NOT maintenance_private.quote_partner_matches(c,d.recipient_partner_id,o.quote_partner_types) THEN UPDATE public.maintenance_order_dispatches SET status='obsolete',error_message='A oficina não tem o tipo marcado nos filtros selecionados.',updated_at=clock_timestamp() WHERE id=d.id;RETURN jsonb_build_object('status','obsolete','error','A oficina não corresponde aos filtros marcados. Nenhum envio realizado.');END IF;$guard$);
 def:=replace(def,'id=d.recipient_partner_id AND company_id=c AND status=''ativo''','id=d.recipient_partner_id AND company_id=c AND status=''ativo'' AND deleted_at IS NULL');EXECUTE def;
 SELECT pg_get_functiondef('maintenance_private.order_quote_snapshot(uuid,uuid,uuid)'::regprocedure) INTO def;
 def:=replace(def,'id=recipient AND company_id=c AND status=''ativo''','id=recipient AND company_id=c AND status=''ativo'' AND deleted_at IS NULL');EXECUTE def;
 SELECT pg_get_functiondef('maintenance_private.partner_prepare()'::regprocedure) INTO def;
 def:=replace(def,'IF TG_OP=''UPDATE'' THEN','IF TG_OP=''UPDATE'' THEN IF OLD.deleted_at IS NOT NULL THEN RAISE EXCEPTION ''Oficina excluída. O cadastro não pode ser reativado por uma edição comum.'';END IF;');
 def:=replace(def,'NEW.updated_at:=clock_timestamp();','IF NEW.deleted_at IS NOT NULL THEN NEW.status:=''inativo'';NEW.deleted_by:=auth.uid();END IF;NEW.updated_at:=clock_timestamp();');EXECUTE def;
 SELECT pg_get_functiondef('maintenance_private.registration_profile(jsonb,boolean)'::regprocedure) INTO def;def:=replace(def,'"Tacógrafo e rastreador","Outros"','"Tacógrafo e rastreador","Peças e acessórios","Outros"');EXECUTE def;
 SELECT pg_get_functiondef('public.maintenance_partner_cities(uuid)'::regprocedure) INTO def;def:=replace(def,'p.company_id=target_company AND','p.company_id=target_company AND p.deleted_at IS NULL AND');EXECUTE def;
END $$;
ALTER TABLE public.maintenance_partner_audit DROP CONSTRAINT maintenance_partner_audit_acao_check;
ALTER TABLE public.maintenance_partner_audit ADD CONSTRAINT maintenance_partner_audit_acao_check CHECK(acao IN ('criacao','edicao','bloqueio','desbloqueio','anexo_incluido','anexo_excluido','exclusao'));
DO $$ DECLARE def text;BEGIN
 SELECT pg_get_functiondef('maintenance_private.partner_audit_event()'::regprocedure) INTO def;
 def:=replace(def,'WHEN TG_OP=''INSERT'' THEN ''criacao'' WHEN','WHEN TG_OP=''INSERT'' THEN ''criacao'' WHEN NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN ''exclusao'' WHEN');EXECUTE def;
END $$;
CREATE FUNCTION maintenance_private.partner_delete(c uuid,target uuid,expected integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE p public.maintenance_partners;BEGIN
 IF auth.uid() IS NULL OR NOT maintenance_private.partner_access(c,true) THEN RAISE EXCEPTION 'Exclusão não autorizada.' USING ERRCODE='42501';END IF;
 SELECT * INTO p FROM public.maintenance_partners WHERE id=target AND company_id=c FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'Oficina não encontrada nesta empresa.' USING ERRCODE='42501';END IF;
 IF p.deleted_at IS NOT NULL THEN RETURN jsonb_build_object('deleted',true,'id',p.id);END IF;
 IF p.version IS DISTINCT FROM expected THEN RAISE EXCEPTION 'O cadastro foi alterado. Atualize antes de excluir.' USING ERRCODE='40001';END IF;
 UPDATE public.maintenance_partners SET deleted_at=clock_timestamp(),deleted_by=auth.uid(),status='inativo' WHERE id=p.id;
 UPDATE public.maintenance_order_dispatches SET status='obsolete',error_message='Oficina excluída do cadastro.',updated_at=clock_timestamp() WHERE company_id=c AND recipient_partner_id=p.id AND kind='abertura' AND status IN ('pending','failed','unavailable');
 RETURN jsonb_build_object('deleted',true,'id',p.id);
END $$;
REVOKE ALL ON FUNCTION maintenance_private.partner_delete(uuid,uuid,integer) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION maintenance_private.partner_delete(uuid,uuid,integer) TO authenticated;
CREATE FUNCTION public.maintenance_partner_delete(target_company uuid,target_partner uuid,expected_version integer) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT maintenance_private.partner_delete(target_company,target_partner,expected_version);$$;
REVOKE ALL ON FUNCTION public.maintenance_partner_delete(uuid,uuid,integer) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION public.maintenance_partner_delete(uuid,uuid,integer) TO authenticated;
UPDATE public.maintenance_order_dispatches d SET status='obsolete',error_message='Selecione os filtros de tipo antes de enviar.',updated_at=clock_timestamp() FROM public.maintenance_orders o WHERE o.id=d.order_id AND o.company_id=d.company_id AND d.kind='abertura' AND d.status IN ('pending','failed','unavailable') AND NOT maintenance_private.quote_partner_matches(d.company_id,d.recipient_partner_id,o.quote_partner_types);
COMMIT;
