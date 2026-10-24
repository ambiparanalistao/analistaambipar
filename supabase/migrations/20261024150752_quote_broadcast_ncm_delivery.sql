BEGIN;
ALTER TABLE public.maintenance_order_dispatches ADD COLUMN recipient_partner_id uuid;
UPDATE public.maintenance_order_dispatches d SET recipient_partner_id=o.partner_id FROM public.maintenance_orders o WHERE o.id=d.order_id AND o.company_id=d.company_id;
ALTER TABLE public.maintenance_order_dispatches ALTER COLUMN recipient_partner_id SET NOT NULL,ADD CONSTRAINT dispatch_recipient_company FOREIGN KEY(recipient_partner_id,company_id) REFERENCES public.maintenance_partners(id,company_id);
GRANT SELECT(recipient_partner_id) ON public.maintenance_order_dispatches TO authenticated;
CREATE INDEX dispatch_recipient ON public.maintenance_order_dispatches(company_id,recipient_partner_id);
ALTER TABLE public.maintenance_order_items ADD COLUMN ncm text CHECK(ncm IS NULL OR (tipo='peca' AND ncm ~ '^[0-9]{8}$'));
CREATE FUNCTION maintenance_private.normalize_item_ncm() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$ BEGIN NEW.ncm:=nullif(regexp_replace(coalesce(NEW.ncm,''),'[.[:space:]]','','g'),'');IF NEW.tipo='servico' THEN NEW.ncm:=NULL;END IF;RETURN NEW;END $$;
REVOKE ALL ON FUNCTION maintenance_private.normalize_item_ncm() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER a_item_ncm BEFORE INSERT OR UPDATE ON public.maintenance_order_items FOR EACH ROW EXECUTE FUNCTION maintenance_private.normalize_item_ncm();
CREATE FUNCTION maintenance_private.order_quote_snapshot(c uuid,target uuid,recipient uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE result jsonb;p public.maintenance_partners;BEGIN
 result:=maintenance_private.order_document(c,target);SELECT * INTO p FROM public.maintenance_partners WHERE id=recipient AND company_id=c AND status='ativo';IF NOT FOUND THEN RAISE EXCEPTION 'Oficina destinatária indisponível.';END IF;
 result:=jsonb_set(result,'{partner}',jsonb_build_object('nome',coalesce(p.nome_fantasia,p.razao_social),'cnpj_cpf',p.cnpj_cpf,'contato_nome',p.contato_nome,'telefone',p.telefone,'whatsapp',p.whatsapp,'email',p.email,'endereco',concat_ws(', ',p.logradouro,p.numero,p.bairro,p.cidade,p.estado,p.cep)));
 result:=result||jsonb_build_object('quote_request',true);result:=jsonb_set(result,'{items}','[]');result:=jsonb_set(result,'{order}',(result->'order')||jsonb_build_object('valor_total',0,'orcamento_status','solicitado','diagnostico',NULL,'aprovado_em',NULL,'previsao_entrega',NULL));RETURN result;
END $$;
REVOKE ALL ON FUNCTION maintenance_private.order_quote_snapshot(uuid,uuid,uuid) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION maintenance_private.order_quote_snapshot(uuid,uuid,uuid) TO authenticated;
CREATE OR REPLACE FUNCTION maintenance_private.queue_order_dispatch() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE k text;p public.maintenance_partners;BEGIN
 IF TG_OP='INSERT' THEN k:='abertura';ELSIF NEW.orcamento_status='aprovado' AND NEW.aprovado_em IS DISTINCT FROM OLD.aprovado_em THEN k:='aprovacao';END IF;
 IF TG_OP='UPDATE' AND ROW(NEW.prazo_entrega_dias,NEW.previsao_entrega,NEW.prazo_base_aprovacao_em) IS DISTINCT FROM ROW(OLD.prazo_entrega_dias,OLD.previsao_entrega,OLD.prazo_base_aprovacao_em) THEN PERFORM maintenance_private.order_event(NEW.company_id,NEW.id,'comentario','Previsão após aprovação atualizada',jsonb_build_object('dias_corridos',NEW.prazo_entrega_dias,'aprovacao_em',NEW.prazo_base_aprovacao_em,'previsao_entrega',NEW.previsao_entrega));END IF;
 IF k IS NOT NULL AND auth.uid() IS NOT NULL THEN
  IF k='abertura' THEN
   FOR p IN SELECT * FROM public.maintenance_partners WHERE company_id=NEW.company_id AND status='ativo' ORDER BY id FOR SHARE LOOP
    INSERT INTO public.maintenance_order_dispatches(company_id,order_id,recipient_partner_id,kind,event_key,snapshot) VALUES(NEW.company_id,NEW.id,p.id,k,'abertura:'||p.id::text,maintenance_private.order_quote_snapshot(NEW.company_id,NEW.id,p.id)) ON CONFLICT(order_id,event_key) DO NOTHING;
   END LOOP;
  ELSE
   UPDATE public.maintenance_order_dispatches SET status='obsolete',error_message='Orçamento já aprovado para a oficina escolhida.',updated_at=clock_timestamp() WHERE order_id=NEW.id AND company_id=NEW.company_id AND kind='abertura' AND status IN ('pending','failed','unavailable');
   INSERT INTO public.maintenance_order_dispatches(company_id,order_id,recipient_partner_id,kind,event_key,approval_at,snapshot) VALUES(NEW.company_id,NEW.id,NEW.partner_id,k,'aprovacao:'||NEW.aprovado_em::text,NEW.aprovado_em,maintenance_private.order_document(NEW.company_id,NEW.id)) ON CONFLICT(order_id,event_key) DO NOTHING;
  END IF;
 END IF;RETURN NEW;END $$;
DO $$ DECLARE def text; BEGIN
 SELECT pg_get_functiondef('maintenance_private.order_document(uuid,uuid)'::regprocedure) INTO def;
 def:=replace(def,'''valor_unitario'',i.valor_unitario)','''valor_unitario'',i.valor_unitario,''ncm'',i.ncm)');EXECUTE def;
 SELECT pg_get_functiondef('maintenance_private.order_command(uuid,text,jsonb)'::regprocedure) INTO def;
 def:=replace(def,'maintenance_order_items(company_id,order_id,tipo,descricao,quantidade,valor_unitario,created_by)','maintenance_order_items(company_id,order_id,tipo,descricao,quantidade,valor_unitario,created_by,ncm)');
 def:=replace(def,'(payload->>''valor_unitario'')::numeric,actor) RETURNING * INTO item','(payload->>''valor_unitario'')::numeric,actor,nullif(payload->>''ncm'','''')) RETURNING * INTO item');
 def:=replace(def,'SET tipo=payload->>''tipo'',descricao=','SET ncm=nullif(payload->>''ncm'',''''),tipo=payload->>''tipo'',descricao=');EXECUTE def;
 SELECT pg_get_functiondef('maintenance_private.prepare_order()'::regprocedure) INTO def;
 def:=replace(def,'ROW(NEW.numero,NEW.vehicle_id,NEW.partner_id,NEW.data_abertura) IS DISTINCT FROM ROW(OLD.numero,OLD.vehicle_id,OLD.partner_id,OLD.data_abertura)','ROW(NEW.numero,NEW.vehicle_id,NEW.data_abertura) IS DISTINCT FROM ROW(OLD.numero,OLD.vehicle_id,OLD.data_abertura)');
 def:=replace(def,'IF TG_OP=''UPDATE'' THEN','IF TG_OP=''UPDATE'' THEN
 IF NEW.partner_id IS DISTINCT FROM OLD.partner_id THEN
 IF OLD.orcamento_status=''aprovado'' OR OLD.status NOT IN (''aberta'',''aguardando_orcamento'') OR EXISTS(SELECT 1 FROM public.maintenance_order_items WHERE order_id=OLD.id AND company_id=OLD.company_id) OR EXISTS(SELECT 1 FROM public.workshop_visits WHERE order_id=OLD.id AND company_id=OLD.company_id) THEN RAISE EXCEPTION ''Escolha a oficina antes de lançar os itens, aprovar ou registrar a chegada.'';END IF;
 IF NOT maintenance_private.is_provisioner() AND NOT EXISTS(SELECT 1 FROM public.company_members m WHERE m.company_id=NEW.company_id AND m.user_id=auth.uid() AND m.ativo AND maintenance_private.module_role(m) IN (''admin_geral'',''admin_empresa'',''analista_transporte'')) THEN RAISE EXCEPTION ''Sem permissão para escolher a oficina.'' USING ERRCODE=''42501'';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.maintenance_partners WHERE id=NEW.partner_id AND company_id=NEW.company_id AND status=''ativo'') THEN RAISE EXCEPTION ''Escolha uma oficina ativa da empresa.'';END IF;END IF;');EXECUTE def;
END $$;
DO $$ DECLARE def text; BEGIN
 SELECT pg_get_functiondef('maintenance_private.order_dispatch_command(uuid,text,jsonb)'::regprocedure) INTO def;
 def:=replace(def,'FOR SHARE;IF NOT FOUND THEN RAISE EXCEPTION ''OS não encontrada.''','FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION ''OS não encontrada.''');
 def:=replace(def,'IF action NOT IN (''claim'',''finish'')', $insert$
 IF action='select_partner' THEN
 IF NOT EXISTS(SELECT 1 FROM public.company_members m WHERE m.company_id=c AND m.user_id=actor AND m.ativo AND maintenance_private.module_role(m) IN ('admin_geral','admin_empresa','analista_transporte')) THEN RAISE EXCEPTION 'Escolha de oficina não autorizada.' USING ERRCODE='42501';END IF;
 IF o.version IS DISTINCT FROM (b->>'version')::integer THEN RAISE EXCEPTION 'A S.OR foi alterada. Atualize antes de escolher a oficina.' USING ERRCODE='40001';END IF;
 UPDATE public.maintenance_orders SET partner_id=(b->>'partner_id')::uuid WHERE id=o.id RETURNING * INTO o;
 PERFORM maintenance_private.order_event(c,o.id,'comentario','Oficina escolhida para executar o orçamento',jsonb_build_object('partner_id',o.partner_id));RETURN to_jsonb(o);END IF;
 IF action='list' THEN RETURN jsonb_build_object('rows',coalesce((SELECT jsonb_agg(jsonb_build_object('id',x.id,'partner_id',x.recipient_partner_id,'status',x.status) ORDER BY x.created_at,x.id) FROM public.maintenance_order_dispatches x WHERE x.company_id=c AND x.order_id=o.id AND x.kind=b->>'kind'),'[]'));END IF;
 IF action NOT IN ('claim','finish')$insert$);
 def:=replace(def,'AND kind=b->>''kind'' ORDER BY created_at DESC,id DESC LIMIT 1 FOR UPDATE','AND kind=b->>''kind'' AND (action<>''finish'' OR claim_token=(b->>''token'')::uuid) AND (nullif(b->>''dispatch_id'','''') IS NULL OR id=(b->>''dispatch_id'')::uuid) ORDER BY CASE status WHEN ''pending'' THEN 0 WHEN ''failed'' THEN 1 WHEN ''unavailable'' THEN 2 ELSE 3 END,created_at DESC,id DESC LIMIT 1 FOR UPDATE');
 def:=replace(def,'IF o.status IN (''cancelada'',''encerrada'') OR','IF o.status IN (''cancelada'',''encerrada'') OR (d.kind=''abertura'' AND o.orcamento_status=''aprovado'') OR');
 def:=replace(def,'IF NOT FOUND THEN RAISE EXCEPTION ''Oficina indisponível.'';END IF;','IF NOT FOUND THEN UPDATE public.maintenance_order_dispatches SET status=''obsolete'',error_message=''Oficina inativa ou indisponível.'' WHERE id=d.id;RETURN jsonb_build_object(''status'',''obsolete'',''error'',''Oficina inativa ou indisponível.'');END IF;');
 def:=replace(def,'id=o.partner_id AND company_id=c AND status=''ativo''','id=d.recipient_partner_id AND company_id=c AND status=''ativo''');
 def:=replace(def,'snapshot=maintenance_private.order_document(c,o.id)','snapshot=CASE WHEN d.kind=''abertura'' THEN maintenance_private.order_quote_snapshot(c,o.id,d.recipient_partner_id) ELSE maintenance_private.order_document(c,o.id) END');
 def:=replace(def,'VALUES(c,o.id,o.partner_id,''enviada''','VALUES(c,o.id,d.recipient_partner_id,''enviada''');
 def:=replace(def,'''snapshot'',d.snapshot)', '''snapshot'',d.snapshot,''dispatch_id'',d.id)');def:=replace(def,'Excel da OS','Excel da S.OR');EXECUTE def;
END $$;
DO $$ DECLARE def text;old_guard text;BEGIN
 SELECT pg_get_functiondef('maintenance_private.actor_and_paths()'::regprocedure) INTO def;
 old_guard:=$old$IF NOT EXISTS (
      SELECT 1 FROM public.maintenance_orders o WHERE o.id=NEW.order_id AND o.company_id=NEW.company_id AND o.partner_id=NEW.partner_id
    ) THEN RAISE EXCEPTION 'Message partner must match the order partner' USING ERRCODE='23514'; END IF;$old$;
 IF position(old_guard in def)=0 THEN RAISE EXCEPTION 'Expected message partner guard not found';END IF;
 def:=replace(def,old_guard,$new$IF NOT EXISTS(SELECT 1 FROM public.maintenance_orders o WHERE o.id=NEW.order_id AND o.company_id=NEW.company_id AND o.partner_id=NEW.partner_id)
 AND NOT EXISTS(SELECT 1 FROM public.maintenance_order_dispatches d WHERE d.company_id=NEW.company_id AND d.order_id=NEW.order_id AND d.recipient_partner_id=NEW.partner_id AND d.id=NEW.request_id AND d.kind='abertura' AND d.status='accepted') THEN RAISE EXCEPTION 'Message partner must match the order or an accepted quote dispatch' USING ERRCODE='23514';END IF;$new$);EXECUTE def;
END $$;
COMMIT;
