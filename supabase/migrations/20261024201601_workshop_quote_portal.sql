BEGIN;
CREATE SCHEMA workshop_portal_private;REVOKE ALL ON SCHEMA workshop_portal_private FROM PUBLIC;GRANT USAGE ON SCHEMA workshop_portal_private TO anon,authenticated;
ALTER TABLE public.maintenance_order_timeline ALTER COLUMN usuario_id DROP NOT NULL,ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.maintenance_order_timeline ADD CONSTRAINT timeline_actor_or_workshop CHECK((usuario_id IS NOT NULL AND created_by IS NOT NULL) OR (usuario_id IS NULL AND dados->>'origem'='portal_oficina' AND dados->>'quote_id' IS NOT NULL));
CREATE TABLE public.maintenance_partner_quotes(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),company_id uuid NOT NULL REFERENCES public.companies(id),order_id uuid NOT NULL,partner_id uuid NOT NULL,version integer NOT NULL DEFAULT 1,items jsonb NOT NULL DEFAULT '[]',total numeric(14,2) NOT NULL DEFAULT 0,delivery_days integer CHECK(delivery_days BETWEEN 1 AND 3650),warranty_days integer CHECK(warranty_days BETWEEN 0 AND 3650),payment_terms text NOT NULL DEFAULT '',notes text NOT NULL DEFAULT '',contact text NOT NULL DEFAULT '',submitted_at timestamptz,selected_by uuid REFERENCES auth.users(id),selected_at timestamptz,selection_reason text,UNIQUE(order_id,partner_id),UNIQUE(id,company_id),FOREIGN KEY(order_id,company_id) REFERENCES public.maintenance_orders(id,company_id),FOREIGN KEY(partner_id,company_id) REFERENCES public.maintenance_partners(id,company_id));
CREATE INDEX partner_quotes_company ON public.maintenance_partner_quotes(company_id);CREATE INDEX partner_quotes_partner ON public.maintenance_partner_quotes(partner_id,company_id);CREATE INDEX partner_quotes_selector ON public.maintenance_partner_quotes(selected_by);
ALTER TABLE public.maintenance_partner_quotes ENABLE ROW LEVEL SECURITY;REVOKE ALL ON public.maintenance_partner_quotes FROM PUBLIC,anon,authenticated;GRANT SELECT ON public.maintenance_partner_quotes TO authenticated;CREATE POLICY company_read ON public.maintenance_partner_quotes FOR SELECT TO authenticated USING(maintenance_private.partner_access(company_id));
CREATE TABLE maintenance_private.quote_links(quote_id uuid PRIMARY KEY REFERENCES public.maintenance_partner_quotes(id),token text UNIQUE NOT NULL DEFAULT replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-',''),expires_at timestamptz NOT NULL DEFAULT clock_timestamp()+interval '30 days',submissions integer NOT NULL DEFAULT 0);
ALTER TABLE maintenance_private.quote_links ENABLE ROW LEVEL SECURITY;REVOKE ALL ON maintenance_private.quote_links FROM PUBLIC,anon,authenticated;CREATE POLICY deny_client ON maintenance_private.quote_links TO anon,authenticated USING(false) WITH CHECK(false);
CREATE FUNCTION maintenance_private.quote_link(c uuid,target uuid,recipient uuid) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE q uuid;t text;BEGIN
IF NOT maintenance_private.quote_partner_matches(c,recipient,(SELECT quote_partner_types FROM public.maintenance_orders WHERE id=target AND company_id=c)) THEN RAISE EXCEPTION 'Oficina fora dos filtros selecionados.';END IF;
INSERT INTO public.maintenance_partner_quotes(company_id,order_id,partner_id) VALUES(c,target,recipient) ON CONFLICT(order_id,partner_id) DO NOTHING;
SELECT id INTO q FROM public.maintenance_partner_quotes WHERE company_id=c AND order_id=target AND partner_id=recipient;
INSERT INTO maintenance_private.quote_links(quote_id) VALUES(q) ON CONFLICT DO NOTHING;SELECT token INTO t FROM maintenance_private.quote_links WHERE quote_id=q;
RETURN 'https://analistaambipar-kappa.vercel.app/oficina/orcamento#token='||t;END $$;
REVOKE ALL ON FUNCTION maintenance_private.quote_link(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
DO $$ DECLARE def text;BEGIN SELECT pg_get_functiondef('maintenance_private.order_quote_snapshot(uuid,uuid,uuid)'::regprocedure) INTO def;
IF position('RETURN result;' in def)=0 THEN RAISE EXCEPTION 'Contrato do documento não encontrado';END IF;
def:=replace(def,'RETURN result;',$patch$result:=result||jsonb_build_object('portal_url',maintenance_private.quote_link(c,target,recipient));RETURN result;$patch$);EXECUTE def;END $$;
CREATE FUNCTION workshop_portal_private.workshop_quote(t text,action text,b jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE l maintenance_private.quote_links;q public.maintenance_partner_quotes;o public.maintenance_orders;p public.maintenance_partners;v public.veiculos;i jsonb;amount numeric:=0;quantity numeric;price numeric;normalized jsonb:='[]';ncm text;
BEGIN
IF t IS NULL OR t!~'^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'Link inválido.';END IF;
SELECT * INTO l FROM maintenance_private.quote_links WHERE token=t FOR UPDATE;
IF NOT FOUND OR l.expires_at<clock_timestamp() THEN RAISE EXCEPTION 'Link expirado ou indisponível. Contate o analista.';END IF;
SELECT * INTO q FROM public.maintenance_partner_quotes WHERE id=l.quote_id FOR UPDATE;SELECT * INTO o FROM public.maintenance_orders WHERE id=q.order_id AND company_id=q.company_id FOR UPDATE;
SELECT * INTO p FROM public.maintenance_partners WHERE id=q.partner_id AND company_id=q.company_id AND status='ativo' AND deleted_at IS NULL;
IF NOT FOUND OR NOT maintenance_private.quote_partner_matches(q.company_id,q.partner_id,o.quote_partner_types) THEN RAISE EXCEPTION 'Oficina indisponível para esta solicitação.';END IF;
SELECT * INTO v FROM public.veiculos WHERE id=o.vehicle_id AND company_id=o.company_id;
IF action='submit' THEN
IF o.status IN ('cancelada','encerrada','concluido','veiculo_retirado') OR o.orcamento_status='aprovado' OR q.selected_at IS NOT NULL THEN RAISE EXCEPTION 'O orçamento não está mais aberto para edição.';END IF;
IF l.submissions>=30 THEN RAISE EXCEPTION 'Limite de atualizações atingido. Contate o analista.';END IF;
IF q.version IS DISTINCT FROM (b->>'version')::integer THEN RAISE EXCEPTION 'Orçamento alterado. Recarregue a página.';END IF;
IF jsonb_typeof(b->'items') IS DISTINCT FROM 'array' OR jsonb_array_length(b->'items') NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Informe entre 1 e 100 itens.';END IF;
IF coalesce(b->>'contact','')='' OR length(b->>'contact')>120 OR length(coalesce(b->>'payment_terms','')) NOT BETWEEN 1 AND 1000 OR length(coalesce(b->>'notes',''))>4000 THEN RAISE EXCEPTION 'Informe contato e condição de pagamento.';END IF;
IF coalesce(b->>'delivery_days','')!~'^[0-9]{1,4}$' OR (b->>'delivery_days')::integer NOT BETWEEN 1 AND 3650 OR coalesce(b->>'warranty_days','')!~'^[0-9]{1,4}$' OR (b->>'warranty_days')::integer NOT BETWEEN 0 AND 3650 THEN RAISE EXCEPTION 'Revise prazo e garantia em dias corridos.';END IF;
FOR i IN SELECT value FROM jsonb_array_elements(b->'items') LOOP
IF coalesce(i->>'tipo','') NOT IN ('peca','servico') OR length(btrim(coalesce(i->>'descricao',''))) NOT BETWEEN 1 AND 500 OR coalesce(i->>'quantidade','')!~'^[0-9]{1,7}(\.[0-9]{1,3})?$' OR coalesce(i->>'valor_unitario','')!~'^[0-9]{1,9}(\.[0-9]{1,2})?$' THEN RAISE EXCEPTION 'Revise os itens de peças e serviços.';END IF;
quantity:=(i->>'quantidade')::numeric;price:=(i->>'valor_unitario')::numeric;IF quantity<=0 THEN RAISE EXCEPTION 'Quantidade deve ser positiva.';END IF;
ncm:=regexp_replace(coalesce(i->>'ncm',''),'[. ]','','g');IF i->>'tipo'='servico' THEN ncm:='';END IF;IF ncm<>'' AND ncm!~'^[0-9]{8}$' THEN RAISE EXCEPTION 'NCM deve ter oito dígitos, quando aplicável.';END IF;
amount:=amount+round(quantity*price,2);normalized:=normalized||jsonb_build_array(jsonb_build_object('tipo',i->>'tipo','descricao',btrim(i->>'descricao'),'quantidade',quantity,'valor_unitario',price,'ncm',nullif(ncm,'')));
END LOOP;
IF amount<=0 OR amount>999999999999.99 THEN RAISE EXCEPTION 'Total do orçamento inválido.';END IF;
UPDATE public.maintenance_partner_quotes SET items=normalized,total=amount,delivery_days=(b->>'delivery_days')::integer,warranty_days=(b->>'warranty_days')::integer,payment_terms=btrim(b->>'payment_terms'),notes=btrim(coalesce(b->>'notes','')),contact=btrim(b->>'contact'),submitted_at=clock_timestamp(),version=version+1 WHERE id=q.id RETURNING * INTO q;
UPDATE maintenance_private.quote_links SET submissions=submissions+1 WHERE quote_id=q.id;
INSERT INTO public.maintenance_order_timeline(company_id,order_id,tipo_evento,descricao,dados,created_by) VALUES(q.company_id,q.order_id,'comentario','Proposta recebida da oficina '||coalesce(p.nome_fantasia,p.razao_social),jsonb_build_object('quote_id',q.id,'version',q.version,'total',q.total,'origem','portal_oficina'),NULL);
ELSIF action<>'info' THEN RAISE EXCEPTION 'Ação inválida.';END IF;
RETURN jsonb_build_object('quote',to_jsonb(q)-'company_id'-'selected_by'-'selection_reason','order',jsonb_build_object('numero',o.numero,'descricao_problema',o.descricao_problema,'prazo_entrega_dias',o.prazo_entrega_dias),'vehicle',jsonb_build_object('placa',v.placa,'marca_modelo',v.marca_modelo,'ano_fabricacao',v.ano_fabricacao,'ano_modelo',v.ano_modelo,'chassi',v.chassi),'partner',coalesce(p.nome_fantasia,p.razao_social),'editable',o.status NOT IN ('cancelada','encerrada','concluido','veiculo_retirado') AND o.orcamento_status<>'aprovado' AND q.selected_at IS NULL,'expires_at',l.expires_at);
END $$;
REVOKE ALL ON FUNCTION workshop_portal_private.workshop_quote(text,text,jsonb) FROM PUBLIC;GRANT EXECUTE ON FUNCTION workshop_portal_private.workshop_quote(text,text,jsonb) TO anon,authenticated;
CREATE FUNCTION public.maintenance_workshop_quote(token text,command text,body jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT workshop_portal_private.workshop_quote(token,command,body);$$;
REVOKE ALL ON FUNCTION public.maintenance_workshop_quote(text,text,jsonb) FROM PUBLIC;GRANT EXECUTE ON FUNCTION public.maintenance_workshop_quote(text,text,jsonb) TO anon,authenticated;
CREATE FUNCTION maintenance_private.quote_admin(c uuid,action text,b jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE o public.maintenance_orders;q public.maintenance_partner_quotes;i jsonb;result jsonb;BEGIN
IF auth.uid() IS NULL OR NOT maintenance_private.partner_access(c) THEN RAISE EXCEPTION 'Acesso não autorizado.' USING ERRCODE='42501';END IF;
SELECT * INTO o FROM public.maintenance_orders WHERE id=(b->>'order_id')::uuid AND company_id=c FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'S.OR indisponível.';END IF;
IF action='list' THEN RETURN coalesce((SELECT jsonb_agg(to_jsonb(x)||jsonb_build_object('partner',coalesce(p.nome_fantasia,p.razao_social)) ORDER BY x.total,x.submitted_at) FROM public.maintenance_partner_quotes x JOIN public.maintenance_partners p ON p.id=x.partner_id AND p.company_id=x.company_id WHERE x.order_id=o.id AND x.company_id=c),'[]');END IF;
IF NOT maintenance_private.partner_access(c,true) THEN RAISE EXCEPTION 'Sem permissão para escolher propostas.' USING ERRCODE='42501';END IF;
IF action='links' THEN RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('partner',coalesce(p.nome_fantasia,p.razao_social),'url',maintenance_private.quote_link(c,o.id,p.id))) FROM public.maintenance_partners p WHERE p.company_id=c AND maintenance_private.quote_partner_matches(c,p.id,o.quote_partner_types)),'[]');END IF;
IF action<>'select' OR length(btrim(coalesce(b->>'reason',''))) NOT BETWEEN 5 AND 2000 THEN RAISE EXCEPTION 'Informe o motivo da escolha (5 a 2000 caracteres).';END IF;
SELECT * INTO q FROM public.maintenance_partner_quotes WHERE id=(b->>'quote_id')::uuid AND order_id=o.id AND company_id=c FOR UPDATE;
IF NOT FOUND OR q.submitted_at IS NULL OR q.version IS DISTINCT FROM (b->>'version')::integer THEN RAISE EXCEPTION 'Proposta indisponível ou alterada. Atualize.';END IF;
IF q.selected_at IS NOT NULL THEN RETURN to_jsonb(o);END IF;
IF o.orcamento_status='aprovado' OR o.status NOT IN ('aberta','aguardando_orcamento') OR EXISTS(SELECT 1 FROM public.maintenance_order_items WHERE order_id=o.id) OR EXISTS(SELECT 1 FROM public.workshop_visits WHERE order_id=o.id) OR EXISTS(SELECT 1 FROM public.maintenance_finance_invoices WHERE order_id=o.id AND status<>'cancelada') THEN RAISE EXCEPTION 'A escolha exige S.OR sem itens, aprovação, visitas ou notas ativas. Revise o orçamento atual antes.';END IF;
PERFORM maintenance_private.order_dispatch_command(c,'select_partner',jsonb_build_object('id',o.id,'version',o.version,'partner_id',q.partner_id));
FOR i IN SELECT value FROM jsonb_array_elements(q.items) LOOP
SELECT * INTO o FROM public.maintenance_orders WHERE id=o.id;
PERFORM maintenance_private.order_command(c,'item_save',i||jsonb_build_object('id',o.id,'version',o.version));
END LOOP;
UPDATE public.maintenance_orders SET prazo_entrega_dias=q.delivery_days WHERE id=q.order_id AND company_id=c RETURNING * INTO o;
UPDATE public.maintenance_partner_quotes SET selected_at=clock_timestamp(),selected_by=auth.uid(),selection_reason=btrim(b->>'reason') WHERE id=q.id;
PERFORM maintenance_private.order_event(c,o.id,'comentario','Proposta escolhida; orçamento ainda depende de aprovação',jsonb_build_object('quote_id',q.id,'motivo',btrim(b->>'reason'),'total',q.total,'dias',q.delivery_days,'garantia_dias',q.warranty_days));RETURN to_jsonb(o);
END $$;
REVOKE ALL ON FUNCTION maintenance_private.quote_admin(uuid,text,jsonb) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION maintenance_private.quote_admin(uuid,text,jsonb) TO authenticated;
CREATE FUNCTION public.maintenance_quote_admin(target_company uuid,command text,body jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT maintenance_private.quote_admin(target_company,command,body);$$;
REVOKE ALL ON FUNCTION public.maintenance_quote_admin(uuid,text,jsonb) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION public.maintenance_quote_admin(uuid,text,jsonb) TO authenticated;
COMMIT;
