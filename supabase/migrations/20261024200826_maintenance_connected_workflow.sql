BEGIN;
CREATE TABLE public.maintenance_report_orders(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),company_id uuid NOT NULL REFERENCES public.companies(id),
 report_id uuid NOT NULL,order_id uuid NOT NULL UNIQUE,active boolean NOT NULL DEFAULT true,
 created_by uuid NOT NULL REFERENCES auth.users(id),created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(report_id,company_id) REFERENCES public.maintenance_driver_reports(id,company_id),
 FOREIGN KEY(order_id,company_id) REFERENCES public.maintenance_orders(id,company_id));
CREATE UNIQUE INDEX maintenance_report_orders_active ON public.maintenance_report_orders(report_id) WHERE active;
CREATE INDEX maintenance_report_orders_company ON public.maintenance_report_orders(company_id);
CREATE INDEX maintenance_report_orders_actor ON public.maintenance_report_orders(created_by);
ALTER TABLE public.maintenance_report_orders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.maintenance_report_orders FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.maintenance_report_orders TO authenticated;
CREATE POLICY company_read ON public.maintenance_report_orders FOR SELECT TO authenticated USING(maintenance_private.partner_access(company_id));
CREATE FUNCTION maintenance_private.report_order(c uuid,action text,b jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.maintenance_driver_reports;v public.veiculos;o public.maintenance_orders;result jsonb;link public.maintenance_report_orders;
BEGIN
IF auth.uid() IS NULL OR NOT maintenance_private.partner_access(c) THEN RAISE EXCEPTION 'Acesso não autorizado.' USING ERRCODE='42501';END IF;
SELECT * INTO r FROM public.maintenance_driver_reports WHERE company_id=c AND id=(b->>'report_id')::uuid FOR UPDATE;
IF NOT FOUND THEN RAISE EXCEPTION 'Solicitação não encontrada.';END IF;
IF action='context' THEN RETURN jsonb_build_object('report',to_jsonb(r),'orders',coalesce((SELECT jsonb_agg(jsonb_build_object('id',m.order_id,'active',m.active,'numero',q.numero,'status',q.status,'previsao_entrega',q.previsao_entrega) ORDER BY m.created_at DESC) FROM public.maintenance_report_orders m JOIN public.maintenance_orders q ON q.id=m.order_id WHERE m.report_id=r.id AND m.company_id=c),'[]'::jsonb));END IF;
IF action<>'create' OR NOT maintenance_private.partner_access(c,true) THEN RAISE EXCEPTION 'Sem permissão para gerar S.OR.' USING ERRCODE='42501';END IF;
SELECT * INTO link FROM public.maintenance_report_orders WHERE report_id=r.id AND active;
IF FOUND THEN SELECT * INTO o FROM public.maintenance_orders WHERE id=link.order_id;RETURN to_jsonb(o);END IF;
IF r.status IN ('resolvida','cancelada') THEN RAISE EXCEPTION 'Reabra a solicitação antes de gerar outra S.OR.';END IF;
SELECT * INTO v FROM public.veiculos WHERE id=r.vehicle_id AND company_id=c FOR UPDATE;
IF NOT FOUND THEN RAISE EXCEPTION 'Veículo não está mais disponível no cadastro da empresa.';END IF;
IF (b->>'vehicle_id')::uuid IS DISTINCT FROM v.id THEN RAISE EXCEPTION 'O veículo deve ser o mesmo do relato.';END IF;
result:=maintenance_private.order_command(c,'create',b||jsonb_build_object('vehicle_id',v.id,'driver_id',r.driver_id,'km_abertura',greatest(v.km_atual,r.km,coalesce((b->>'km_abertura')::integer,0)),'descricao_problema',r.defects||CASE WHEN length(btrim(coalesce(b->>'complemento','')))>0 THEN E'\n\nComplemento da análise: '||left(b->>'complemento',5000) ELSE '' END));
INSERT INTO public.maintenance_report_orders(company_id,report_id,order_id,created_by) VALUES(c,r.id,(result->>'id')::uuid,auth.uid());
UPDATE public.maintenance_driver_reports SET status='analise',feedback='Solicitação encaminhada para análise e orçamento: '||(result->>'numero')||'.',version=version+1,updated_at=clock_timestamp(),updated_by=auth.uid() WHERE id=r.id;
INSERT INTO public.maintenance_driver_report_events(company_id,report_id,action,message,actor_id) VALUES(c,r.id,'sor_criada','S.OR vinculada: '||(result->>'numero'),auth.uid());
PERFORM maintenance_private.order_event(c,(result->>'id')::uuid,'comentario','Originada do relato '||r.protocol,jsonb_build_object('report_id',r.id));
RETURN result;
END $$;
REVOKE ALL ON FUNCTION maintenance_private.report_order(uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION maintenance_private.report_order(uuid,text,jsonb) TO authenticated;
CREATE FUNCTION public.maintenance_report_order(target_company uuid,command text,body jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT maintenance_private.report_order(target_company,command,body);$$;
REVOKE ALL ON FUNCTION public.maintenance_report_order(uuid,text,jsonb) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION public.maintenance_report_order(uuid,text,jsonb) TO authenticated;
CREATE FUNCTION maintenance_private.sync_report_order() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE link public.maintenance_report_orders;next_status text;
BEGIN
IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW;END IF;
SELECT * INTO link FROM public.maintenance_report_orders WHERE order_id=NEW.id AND company_id=NEW.company_id AND active FOR UPDATE;
IF NOT FOUND THEN RETURN NEW;END IF;
next_status:=CASE WHEN NEW.status='encerrada' THEN 'resolvida' WHEN NEW.status='cancelada' THEN 'pendente' ELSE 'analise' END;
IF NEW.status IN ('encerrada','cancelada') THEN UPDATE public.maintenance_report_orders SET active=false WHERE id=link.id;END IF;
UPDATE public.maintenance_driver_reports SET status=next_status,feedback=CASE WHEN next_status='resolvida' THEN 'Atendimento concluído na '||NEW.numero||'.' WHEN next_status='pendente' THEN 'A solicitação retornou para análise da equipe.' ELSE 'Sua solicitação está em acompanhamento na '||NEW.numero||'.' END,resolved_at=CASE WHEN next_status='resolvida' THEN clock_timestamp() ELSE NULL END,version=version+1,updated_at=clock_timestamp(),updated_by=auth.uid() WHERE id=link.report_id AND company_id=NEW.company_id;
INSERT INTO public.maintenance_driver_report_events(company_id,report_id,action,message,actor_id) VALUES(NEW.company_id,link.report_id,'sor_status','S.OR '||NEW.numero||': '||NEW.status,auth.uid());RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION maintenance_private.sync_report_order() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER sync_driver_report AFTER UPDATE OF status ON public.maintenance_orders FOR EACH ROW EXECUTE FUNCTION maintenance_private.sync_report_order();
CREATE FUNCTION maintenance_private.guard_linked_report() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
IF NEW.status IN ('resolvida','cancelada') AND EXISTS(SELECT 1 FROM public.maintenance_report_orders WHERE report_id=NEW.id AND company_id=NEW.company_id AND active) THEN RAISE EXCEPTION 'Conclua ou cancele a S.OR vinculada antes de encerrar este relato.';END IF;RETURN NEW;END $$;
REVOKE ALL ON FUNCTION maintenance_private.guard_linked_report() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_linked_report BEFORE UPDATE OF status ON public.maintenance_driver_reports FOR EACH ROW EXECUTE FUNCTION maintenance_private.guard_linked_report();
CREATE OR REPLACE FUNCTION driver_portal_private.report_public(r public.maintenance_driver_reports) RETURNS jsonb LANGUAGE sql STABLE SET search_path='' AS $$ SELECT jsonb_build_object('id',r.id,'protocol',r.protocol,'driver_name',r.driver_name,'vehicle_plate',r.vehicle_plate,'km',r.km,'defects',r.defects,'severity',r.severity,'status',r.status,'feedback',r.feedback,'created_at',r.created_at,'updated_at',r.updated_at,'ack_status',r.ack_status,'order',(SELECT jsonb_build_object('numero',o.numero,'status',o.status,'previsao_entrega',o.previsao_entrega) FROM public.maintenance_report_orders m JOIN public.maintenance_orders o ON o.id=m.order_id AND o.company_id=m.company_id WHERE m.report_id=r.id AND m.company_id=r.company_id ORDER BY m.created_at DESC LIMIT 1));$$;
COMMIT;
