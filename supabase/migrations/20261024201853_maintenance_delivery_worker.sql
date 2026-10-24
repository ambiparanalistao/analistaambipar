BEGIN;
CREATE SCHEMA maintenance_worker_private;REVOKE ALL ON SCHEMA maintenance_worker_private FROM PUBLIC;GRANT USAGE ON SCHEMA maintenance_worker_private TO anon,authenticated;
CREATE TABLE maintenance_worker_private.config(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),key_hash text NOT NULL CHECK(key_hash~'^[0-9a-f]{64}$'));
ALTER TABLE maintenance_worker_private.config ENABLE ROW LEVEL SECURITY;REVOKE ALL ON maintenance_worker_private.config FROM PUBLIC,anon,authenticated;CREATE POLICY deny_client ON maintenance_worker_private.config TO anon,authenticated USING(false) WITH CHECK(false);
CREATE TABLE public.maintenance_delivery_jobs(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),company_id uuid NOT NULL REFERENCES public.companies(id),kind text NOT NULL CHECK(kind IN ('order','report')),dispatch_id uuid NOT NULL,actor_id uuid NOT NULL REFERENCES auth.users(id),status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','running','accepted','failed','unknown','obsolete')),attempts integer NOT NULL DEFAULT 0,next_attempt_at timestamptz NOT NULL DEFAULT now(),lease_until timestamptz,claim_token uuid,error text,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),UNIQUE(kind,dispatch_id));
CREATE INDEX maintenance_delivery_company ON public.maintenance_delivery_jobs(company_id);CREATE INDEX maintenance_delivery_actor ON public.maintenance_delivery_jobs(actor_id);CREATE INDEX maintenance_delivery_due ON public.maintenance_delivery_jobs(next_attempt_at) WHERE status IN ('pending','failed');
ALTER TABLE public.maintenance_delivery_jobs ENABLE ROW LEVEL SECURITY;REVOKE ALL ON public.maintenance_delivery_jobs FROM PUBLIC,anon,authenticated;GRANT SELECT ON public.maintenance_delivery_jobs TO authenticated;CREATE POLICY company_read ON public.maintenance_delivery_jobs FOR SELECT TO authenticated USING(maintenance_private.partner_access(company_id));
CREATE FUNCTION maintenance_worker_private.enqueue() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
IF NEW.status='pending' AND auth.uid() IS NOT NULL THEN INSERT INTO public.maintenance_delivery_jobs(company_id,kind,dispatch_id,actor_id) VALUES(NEW.company_id,CASE WHEN TG_TABLE_NAME='maintenance_order_dispatches' THEN 'order' ELSE 'report' END,NEW.id,auth.uid()) ON CONFLICT DO NOTHING;END IF;RETURN NEW;END $$;
REVOKE ALL ON FUNCTION maintenance_worker_private.enqueue() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER enqueue_background AFTER INSERT ON public.maintenance_order_dispatches FOR EACH ROW EXECUTE FUNCTION maintenance_worker_private.enqueue();
CREATE TRIGGER enqueue_background AFTER INSERT ON public.maintenance_driver_report_dispatches FOR EACH ROW EXECUTE FUNCTION maintenance_worker_private.enqueue();
CREATE FUNCTION maintenance_worker_private.gateway(k text,action text,b jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.maintenance_delivery_jobs;result jsonb;target uuid;dispatch_kind text;previous_actor text:=current_setting('request.jwt.claim.sub',true);next_status text;
BEGIN
IF k IS NULL OR length(k)<40 OR NOT EXISTS(SELECT 1 FROM maintenance_worker_private.config WHERE key_hash=driver_portal_private.hash(k)) THEN RAISE EXCEPTION 'Worker não autorizado.' USING ERRCODE='42501';END IF;
IF action='claim' THEN
UPDATE public.maintenance_delivery_jobs SET status='unknown',error='Execução interrompida: conferir envio antes de repetir.',updated_at=clock_timestamp() WHERE status='running' AND lease_until<clock_timestamp();
SELECT * INTO j FROM public.maintenance_delivery_jobs WHERE status IN ('pending','failed') AND attempts<4 AND next_attempt_at<=clock_timestamp() ORDER BY next_attempt_at,created_at LIMIT 1 FOR UPDATE SKIP LOCKED;
IF NOT FOUND THEN RETURN jsonb_build_object('status','idle');END IF;
ELSIF action='finish' THEN SELECT * INTO j FROM public.maintenance_delivery_jobs WHERE id=(b->>'job_id')::uuid AND status='running' AND claim_token=(b->>'job_token')::uuid FOR UPDATE;IF NOT FOUND THEN RETURN jsonb_build_object('status','obsolete');END IF;
ELSE RAISE EXCEPTION 'Ação inválida.';END IF;
PERFORM set_config('request.jwt.claim.sub',j.actor_id::text,true);
IF NOT maintenance_private.partner_access(j.company_id,true) THEN UPDATE public.maintenance_delivery_jobs SET status='obsolete',error='Responsável sem permissão ativa.',updated_at=clock_timestamp() WHERE id=j.id;PERFORM set_config('request.jwt.claim.sub',coalesce(previous_actor,''),true);RETURN jsonb_build_object('status','obsolete');END IF;
IF j.kind='order' THEN SELECT order_id,kind INTO target,dispatch_kind FROM public.maintenance_order_dispatches WHERE id=j.dispatch_id AND company_id=j.company_id;
result:=maintenance_private.order_dispatch_command(j.company_id,action,jsonb_build_object('id',target,'kind',dispatch_kind,'dispatch_id',j.dispatch_id)||CASE WHEN action='finish' THEN jsonb_build_object('token',b->>'token','status',b->>'status','message_id',b->>'message_id') ELSE '{}'::jsonb END);
ELSE SELECT report_id INTO target FROM public.maintenance_driver_report_dispatches WHERE id=j.dispatch_id AND company_id=j.company_id;
result:=driver_portal_private.admin_command(j.company_id,'dispatch_'||action,jsonb_build_object('id',target,'dispatch_id',j.dispatch_id)||CASE WHEN action='finish' THEN jsonb_build_object('token',b->>'token','status',b->>'status','message_id',b->>'message_id') ELSE '{}'::jsonb END);END IF;
IF action='claim' AND result->>'status'='claimed' THEN
UPDATE public.maintenance_delivery_jobs SET status='running',attempts=attempts+1,lease_until=clock_timestamp()+interval '5 minutes',claim_token=gen_random_uuid(),updated_at=clock_timestamp() WHERE id=j.id RETURNING * INTO j;
result:=result||jsonb_build_object('job_id',j.id,'job_token',j.claim_token,'job_kind',j.kind,'dispatch_kind',dispatch_kind);
ELSE next_status:=CASE WHEN result->>'status' IN ('accepted','failed','unknown','obsolete') THEN result->>'status' WHEN result->>'status' IN ('pending','unavailable') THEN 'failed' ELSE 'unknown' END;
UPDATE public.maintenance_delivery_jobs SET status=next_status,attempts=attempts+CASE WHEN action='claim' THEN 1 ELSE 0 END,next_attempt_at=clock_timestamp()+make_interval(mins=>greatest(2,attempts*5)),error=CASE WHEN next_status='failed' THEN 'Envio não realizado; nova tentativa agendada.' WHEN next_status='unknown' THEN 'Conferir WhatsApp antes de repetir.' ELSE NULL END,updated_at=clock_timestamp() WHERE id=j.id;
END IF;
PERFORM set_config('request.jwt.claim.sub',coalesce(previous_actor,''),true);RETURN result;
END $$;
REVOKE ALL ON FUNCTION maintenance_worker_private.gateway(text,text,jsonb) FROM PUBLIC;GRANT EXECUTE ON FUNCTION maintenance_worker_private.gateway(text,text,jsonb) TO anon,authenticated;
CREATE FUNCTION public.maintenance_delivery_worker(server_key text,command text,body jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT maintenance_worker_private.gateway(server_key,command,body);$$;
REVOKE ALL ON FUNCTION public.maintenance_delivery_worker(text,text,jsonb) FROM PUBLIC;GRANT EXECUTE ON FUNCTION public.maintenance_delivery_worker(text,text,jsonb) TO anon,authenticated;

ALTER TABLE public.maintenance_delivery_jobs DROP CONSTRAINT maintenance_delivery_jobs_kind_check;
ALTER TABLE public.maintenance_delivery_jobs ADD CONSTRAINT maintenance_delivery_jobs_kind_check CHECK(kind IN ('order','report','message'));
ALTER TABLE public.maintenance_delivery_jobs ADD COLUMN provider_message_id text;
CREATE FUNCTION maintenance_private.schedule_message(c uuid,b jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE m jsonb;j public.maintenance_delivery_jobs;due_at timestamptz:=coalesce(nullif(b->>'scheduled_at','')::timestamptz,clock_timestamp());BEGIN
IF auth.uid() IS NULL OR NOT maintenance_private.partner_access(c,true) THEN RAISE EXCEPTION 'Acesso não autorizado.' USING ERRCODE='42501';END IF;
IF due_at<clock_timestamp()-interval '5 minutes' OR due_at>clock_timestamp()+interval '90 days' THEN RAISE EXCEPTION 'Agende até 90 dias no futuro.';END IF;
m:=maintenance_private.communication_command(c,'prepare',b||jsonb_build_object('canal','whatsapp','direcao','enviada'));
INSERT INTO public.maintenance_delivery_jobs(company_id,kind,dispatch_id,actor_id,next_attempt_at) VALUES(c,'message',(m->>'id')::uuid,auth.uid(),due_at) ON CONFLICT(kind,dispatch_id) DO NOTHING;
SELECT * INTO j FROM public.maintenance_delivery_jobs WHERE company_id=c AND kind='message' AND dispatch_id=(m->>'id')::uuid;RETURN to_jsonb(j)-'claim_token';END $$;
REVOKE ALL ON FUNCTION maintenance_private.schedule_message(uuid,jsonb) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION maintenance_private.schedule_message(uuid,jsonb) TO authenticated;
CREATE FUNCTION public.maintenance_schedule_message(target_company uuid,body jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT maintenance_private.schedule_message(target_company,body);$$;
REVOKE ALL ON FUNCTION public.maintenance_schedule_message(uuid,jsonb) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION public.maintenance_schedule_message(uuid,jsonb) TO authenticated;
CREATE FUNCTION maintenance_worker_private.message_job(j public.maintenance_delivery_jobs,action text,b jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE m public.maintenance_messages;o public.maintenance_orders;p public.maintenance_partners;phone text;BEGIN
SELECT * INTO m FROM public.maintenance_messages WHERE id=j.dispatch_id AND company_id=j.company_id FOR UPDATE;
IF NOT FOUND OR m.enviado_por<>j.actor_id OR m.canal<>'whatsapp' THEN RETURN jsonb_build_object('status','obsolete');END IF;
IF m.situacao='confirmada' THEN RETURN jsonb_build_object('status','accepted');END IF;
SELECT * INTO o FROM public.maintenance_orders WHERE id=m.order_id AND company_id=j.company_id FOR UPDATE;SELECT * INTO p FROM public.maintenance_partners WHERE id=o.partner_id AND company_id=j.company_id;
IF o.status IN ('cancelada','encerrada') OR p.status<>'ativo' OR p.deleted_at IS NOT NULL OR p.id IS DISTINCT FROM m.partner_id THEN RETURN jsonb_build_object('status','obsolete');END IF;
IF action='claim' THEN
phone:=driver_portal_private.phone(coalesce(nullif(p.whatsapp,''),p.telefone));IF phone IS NULL THEN RETURN jsonb_build_object('status','failed');END IF;
RETURN jsonb_build_object('status','claimed','phone',phone,'text',m.conteudo,'token',j.id);
END IF;
IF b->>'status'='accepted' THEN
PERFORM maintenance_private.communication_command(j.company_id,'confirm',jsonb_build_object('id',m.id,'order_id',o.id));
UPDATE public.maintenance_delivery_jobs SET provider_message_id=left(b->>'message_id',200) WHERE id=j.id;
PERFORM maintenance_private.order_event(j.company_id,o.id,'comentario','Mensagem aceita pela Evolution em envio agendado',jsonb_build_object('message_id',m.id,'origem','automacao','job_id',j.id));END IF;
RETURN jsonb_build_object('status',CASE WHEN b->>'status' IN ('accepted','failed','unknown') THEN b->>'status' ELSE 'unknown' END);END $$;
REVOKE ALL ON FUNCTION maintenance_worker_private.message_job(public.maintenance_delivery_jobs,text,jsonb) FROM PUBLIC,anon,authenticated;
DO $$ DECLARE def text;BEGIN SELECT pg_get_functiondef('maintenance_worker_private.gateway(text,text,jsonb)'::regprocedure) INTO def;
def:=replace(def,'IF j.kind=''order'' THEN SELECT',$patch$IF j.kind='message' THEN result:=maintenance_worker_private.message_job(j,action,b);
ELSIF j.kind='order' THEN SELECT$patch$);EXECUTE def;END $$;

CREATE FUNCTION maintenance_worker_private.sync_delivery() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
IF NEW.status IN ('accepted','unknown','obsolete') THEN UPDATE public.maintenance_delivery_jobs SET status=NEW.status,updated_at=clock_timestamp() WHERE dispatch_id=NEW.id AND kind=CASE WHEN TG_TABLE_NAME='maintenance_order_dispatches' THEN 'order' ELSE 'report' END AND company_id=NEW.company_id;END IF;RETURN NEW;END $$;
REVOKE ALL ON FUNCTION maintenance_worker_private.sync_delivery() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER sync_delivery_worker AFTER UPDATE OF status ON public.maintenance_order_dispatches FOR EACH ROW EXECUTE FUNCTION maintenance_worker_private.sync_delivery();
CREATE TRIGGER sync_delivery_worker AFTER UPDATE OF status ON public.maintenance_driver_report_dispatches FOR EACH ROW EXECUTE FUNCTION maintenance_worker_private.sync_delivery();
COMMIT;
