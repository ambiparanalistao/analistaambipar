BEGIN;
ALTER TABLE public.maintenance_plans ADD COLUMN version integer NOT NULL DEFAULT 1;
DROP TRIGGER a_maintenance_audit ON public.maintenance_plans;
CREATE TRIGGER a_maintenance_audit BEFORE INSERT OR UPDATE ON public.maintenance_plans FOR EACH ROW EXECUTE FUNCTION maintenance_private.communication_stamp();
ALTER TABLE public.maintenance_settings ALTER COLUMN antecedencia_alerta_km SET DEFAULT 500;
UPDATE public.maintenance_settings s SET antecedencia_alerta_km=500 WHERE antecedencia_alerta_km=1000 AND NOT EXISTS(SELECT 1 FROM public.maintenance_communication_audit a WHERE a.company_id=s.company_id AND a.entity='maintenance_settings');
CREATE TABLE public.maintenance_plan_vehicles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),company_id uuid NOT NULL REFERENCES public.companies(id),plan_id uuid NOT NULL,vehicle_id uuid NOT NULL,
 ultima_execucao_km integer NOT NULL CHECK(ultima_execucao_km>=0),ultima_execucao_data date NOT NULL,
 cycle integer NOT NULL DEFAULT 1,updated_at timestamptz NOT NULL DEFAULT now(),UNIQUE(plan_id,vehicle_id),UNIQUE(id,company_id),
 FOREIGN KEY(plan_id,company_id) REFERENCES public.maintenance_plans(id,company_id),FOREIGN KEY(vehicle_id,company_id) REFERENCES public.veiculos(id,company_id));
CREATE INDEX plan_vehicle_company ON public.maintenance_plan_vehicles(company_id,vehicle_id);
CREATE TABLE public.maintenance_plan_orders (
 company_id uuid NOT NULL,plan_vehicle_id uuid NOT NULL,order_id uuid PRIMARY KEY,executed_at timestamptz,
 FOREIGN KEY(plan_vehicle_id,company_id) REFERENCES public.maintenance_plan_vehicles(id,company_id),FOREIGN KEY(order_id,company_id) REFERENCES public.maintenance_orders(id,company_id));
CREATE INDEX plan_order_vehicle ON public.maintenance_plan_orders(plan_vehicle_id);
CREATE INDEX plan_order_company ON public.maintenance_plan_orders(company_id);
CREATE TABLE public.maintenance_preventive_notifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),company_id uuid NOT NULL,user_id uuid NOT NULL,plan_vehicle_id uuid NOT NULL,
 estado text NOT NULL CHECK(estado IN ('breve','vencida')),cycle integer NOT NULL,titulo text NOT NULL,
 read_at timestamptz,resolved_at timestamptz,updated_at timestamptz NOT NULL DEFAULT now(),UNIQUE(plan_vehicle_id,user_id),
 FOREIGN KEY(plan_vehicle_id,company_id) REFERENCES public.maintenance_plan_vehicles(id,company_id),FOREIGN KEY(company_id,user_id) REFERENCES public.company_members(company_id,user_id));
CREATE INDEX preventive_notification_inbox ON public.maintenance_preventive_notifications(company_id,user_id);
CREATE TABLE public.maintenance_plan_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),company_id uuid NOT NULL REFERENCES public.companies(id),entity_id uuid NOT NULL,actor_id uuid REFERENCES auth.users(id),action text NOT NULL,occurred_at timestamptz NOT NULL DEFAULT now(),snapshot jsonb NOT NULL);
CREATE INDEX plan_audit_company ON public.maintenance_plan_audit(company_id,occurred_at);
CREATE INDEX plan_audit_actor ON public.maintenance_plan_audit(actor_id);
DO $$ DECLARE t text;BEGIN FOREACH t IN ARRAY ARRAY['maintenance_plan_vehicles','maintenance_plan_orders','maintenance_preventive_notifications','maintenance_plan_audit'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
 EXECUTE format('GRANT SELECT ON public.%I TO authenticated',t);
 EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
 EXECUTE format('CREATE POLICY preventive_read ON public.%I FOR SELECT TO authenticated USING(maintenance_private.partner_access(company_id))',t);
 END LOOP;END $$;
DROP POLICY preventive_read ON public.maintenance_preventive_notifications;
CREATE POLICY preventive_self ON public.maintenance_preventive_notifications FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()) AND maintenance_private.partner_access(company_id));
REVOKE INSERT,UPDATE,DELETE ON public.maintenance_plans FROM authenticated;
CREATE FUNCTION maintenance_private.sync_plan_vehicles(c uuid) RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 INSERT INTO public.maintenance_plan_vehicles(company_id,plan_id,vehicle_id,ultima_execucao_km,ultima_execucao_data)
 SELECT p.company_id,p.id,v.id,coalesce(p.ultima_execucao_km,v.km_atual,0)::integer,coalesce(p.ultima_execucao_data,(clock_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date)
 FROM public.maintenance_plans p JOIN public.veiculos v ON v.company_id=p.company_id AND (v.id=p.vehicle_id OR p.vehicle_id IS NULL AND v.tipo=p.categoria_veiculo)
 WHERE p.company_id=c AND p.ativo ON CONFLICT(plan_id,vehicle_id) DO NOTHING;
$$;
CREATE FUNCTION maintenance_private.plan_alerts(c uuid) RETURNS TABLE(id uuid,plan_id uuid,vehicle_id uuid,nome text,placa text,categoria text,km_atual integer,ultima_execucao_km integer,ultima_execucao_data date,proxima_km numeric,proxima_data date,estado text,cycle integer,order_id uuid)
 LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 WITH due AS (SELECT x.*,p.nome,v.placa,v.tipo,v.km_atual,p.intervalo_km+x.ultima_execucao_km AS nk,p.intervalo_dias+x.ultima_execucao_data AS nd,coalesce(s.antecedencia_alerta_km,500) ak,coalesce(s.antecedencia_alerta_dias,7) ad
 FROM public.maintenance_plan_vehicles x JOIN public.maintenance_plans p ON p.id=x.plan_id AND p.ativo JOIN public.veiculos v ON v.id=x.vehicle_id AND v.company_id=x.company_id
 LEFT JOIN public.maintenance_settings s ON s.company_id=x.company_id
 WHERE x.company_id=c AND (p.vehicle_id=v.id OR p.vehicle_id IS NULL AND p.categoria_veiculo=v.tipo))
 SELECT d.id,d.plan_id,d.vehicle_id,d.nome,d.placa,d.tipo,d.km_atual,d.ultima_execucao_km,d.ultima_execucao_data,d.nk,d.nd,
 CASE WHEN d.km_atual>=d.nk OR (clock_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date>=d.nd THEN 'vencida'
 WHEN d.km_atual+d.ak>=d.nk OR (clock_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date+d.ad>=d.nd THEN 'breve' ELSE 'dia' END,d.cycle,
 (SELECT o.id FROM public.maintenance_plan_orders l JOIN public.maintenance_orders o ON o.id=l.order_id WHERE l.plan_vehicle_id=d.id AND o.status NOT IN ('encerrada','cancelada') ORDER BY o.created_at DESC LIMIT 1)
 FROM due d;
$$;
CREATE FUNCTION maintenance_private.preventive_order_closed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE link public.maintenance_plan_orders;x public.maintenance_plan_vehicles;km integer;BEGIN
 IF NEW.status='encerrada' AND OLD.status IS DISTINCT FROM NEW.status THEN
 SELECT * INTO link FROM public.maintenance_plan_orders WHERE order_id=NEW.id AND executed_at IS NULL FOR UPDATE;
 IF FOUND THEN
 SELECT * INTO x FROM public.maintenance_plan_vehicles WHERE id=link.plan_vehicle_id FOR UPDATE;
 km:=greatest(coalesce(NEW.km_saida,NEW.km_entrada,NEW.km_abertura),x.ultima_execucao_km);
 UPDATE public.maintenance_plan_vehicles SET ultima_execucao_km=km,ultima_execucao_data=(clock_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date,cycle=cycle+1,updated_at=clock_timestamp() WHERE id=x.id;
 UPDATE public.maintenance_plans SET ultima_execucao_km=km,ultima_execucao_data=(clock_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date WHERE id=x.plan_id AND vehicle_id=x.vehicle_id;
 UPDATE public.maintenance_plan_orders SET executed_at=clock_timestamp() WHERE order_id=NEW.id;
 UPDATE public.maintenance_preventive_notifications SET resolved_at=clock_timestamp() WHERE plan_vehicle_id=x.id;
 INSERT INTO public.maintenance_plan_audit(company_id,entity_id,actor_id,action,snapshot) VALUES(NEW.company_id,x.id,auth.uid(),'execucao_os',to_jsonb(NEW));
 PERFORM maintenance_private.order_event(NEW.company_id,NEW.id,'comentario','Plano preventivo executado; próximas datas e KM recalculados',jsonb_build_object('plan_id',x.plan_id,'km',km));
 END IF;END IF;RETURN NEW;END $$;
CREATE TRIGGER preventive_order_closed AFTER UPDATE OF status ON public.maintenance_orders FOR EACH ROW EXECUTE FUNCTION maintenance_private.preventive_order_closed();
CREATE FUNCTION maintenance_private.process_preventive_alerts() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c uuid;affected integer;BEGIN
 IF NOT pg_try_advisory_xact_lock(hashtext('maintenance-preventive-daily')) THEN RETURN '{"busy":true}';END IF;
 FOR c IN SELECT id FROM public.companies WHERE ativo LOOP PERFORM maintenance_private.sync_plan_vehicles(c);END LOOP;
 UPDATE public.maintenance_preventive_notifications n SET resolved_at=clock_timestamp() WHERE resolved_at IS NULL AND NOT EXISTS(
 SELECT 1 FROM maintenance_private.plan_alerts(n.company_id) a JOIN public.companies co ON co.id=n.company_id AND co.ativo JOIN public.company_members m ON m.company_id=n.company_id AND m.user_id=n.user_id AND m.ativo
 WHERE a.id=n.plan_vehicle_id AND a.estado=n.estado AND a.cycle=n.cycle AND coalesce(m.maintenance_role,CASE m.role WHEN 'analista' THEN 'analista_transporte' WHEN 'auditor' THEN 'operador_logistico' END) IN ('analista_transporte','operador_logistico'));
 INSERT INTO public.maintenance_preventive_notifications(company_id,user_id,plan_vehicle_id,estado,cycle,titulo)
 SELECT co.id,m.user_id,a.id,a.estado,a.cycle,CASE WHEN a.estado='vencida' THEN 'Preventiva vencida: ' ELSE 'Preventiva vence em breve: ' END||a.placa||' · '||a.nome
 FROM public.companies co CROSS JOIN LATERAL maintenance_private.plan_alerts(co.id) a JOIN public.company_members m ON m.company_id=co.id AND m.ativo
 WHERE co.ativo AND a.estado IN ('breve','vencida') AND coalesce(m.maintenance_role,CASE m.role WHEN 'analista' THEN 'analista_transporte' WHEN 'auditor' THEN 'operador_logistico' END) IN ('analista_transporte','operador_logistico')
 ON CONFLICT(plan_vehicle_id,user_id) DO UPDATE SET estado=excluded.estado,cycle=excluded.cycle,titulo=excluded.titulo,read_at=NULL,resolved_at=NULL,updated_at=clock_timestamp()
 WHERE public.maintenance_preventive_notifications.estado IS DISTINCT FROM excluded.estado OR public.maintenance_preventive_notifications.cycle<>excluded.cycle OR public.maintenance_preventive_notifications.resolved_at IS NOT NULL;
 GET DIAGNOSTICS affected=ROW_COUNT;RETURN jsonb_build_object('notified',affected);END $$;
CREATE FUNCTION maintenance_private.plan_command(c uuid,action text,b jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid();p public.maintenance_plans;x public.maintenance_plan_vehicles;v public.veiculos;result jsonb;old_data jsonb;full_access boolean;pid uuid;begin_km integer;begin_date date;settings public.maintenance_settings;BEGIN
 IF actor IS NULL OR NOT maintenance_private.partner_access(c) THEN RAISE EXCEPTION 'Sem acesso à empresa.' USING ERRCODE='42501';END IF;
 PERFORM 1 FROM public.company_members WHERE company_id=c AND user_id=actor AND ativo FOR SHARE;
 PERFORM 1 FROM public.companies WHERE id=c AND ativo FOR SHARE;IF NOT FOUND THEN RAISE EXCEPTION 'Empresa inativa.';END IF;
 IF NOT maintenance_private.partner_access(c) THEN RAISE EXCEPTION 'Perfil sem acesso.' USING ERRCODE='42501';END IF;
 full_access:=maintenance_private.partner_access(c,true);
 IF action IN ('save','settings') AND NOT full_access THEN RAISE EXCEPTION 'Somente Admin/Analista configuram preventivas.' USING ERRCODE='42501';END IF;
 IF action='save' THEN
 IF length(btrim(coalesce(b->>'nome',''))) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Informe o item (até 100 caracteres).';END IF;
 IF nullif(b->>'intervalo_km','') IS NULL AND nullif(b->>'intervalo_dias','') IS NULL THEN RAISE EXCEPTION 'Informe intervalo por KM ou dias.';END IF;
 IF nullif(b->>'intervalo_km','') IS NOT NULL AND ((b->>'intervalo_km')::numeric NOT BETWEEN 1 AND 2147483647 OR (b->>'intervalo_km')::numeric<>trunc((b->>'intervalo_km')::numeric)) THEN RAISE EXCEPTION 'Intervalo KM inválido.';END IF;
 IF nullif(b->>'intervalo_dias','') IS NOT NULL AND (b->>'intervalo_dias')::integer NOT BETWEEN 1 AND 36500 THEN RAISE EXCEPTION 'Intervalo de dias inválido.';END IF;
 IF (nullif(b->>'vehicle_id','') IS NULL)=(nullif(b->>'categoria_veiculo','') IS NULL) THEN RAISE EXCEPTION 'Selecione veículo ou categoria.';END IF;
 IF nullif(b->>'vehicle_id','') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.veiculos WHERE id=(b->>'vehicle_id')::uuid AND company_id=c) THEN RAISE EXCEPTION 'Veículo inválido.';END IF;
 IF nullif(b->>'categoria_veiculo','') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.veiculos WHERE company_id=c AND tipo=b->>'categoria_veiculo') THEN RAISE EXCEPTION 'Categoria inválida.';END IF;
 begin_km:=nullif(b->>'ultima_execucao_km','')::integer;begin_date:=nullif(b->>'ultima_execucao_data','')::date;
 IF begin_date>(clock_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date OR begin_km<0 THEN RAISE EXCEPTION 'Revise a base de execução.';END IF;
 IF nullif(b->>'id','') IS NULL THEN
 IF begin_date IS NULL OR (nullif(b->>'vehicle_id','') IS NOT NULL AND begin_km IS NULL) THEN RAISE EXCEPTION 'Informe data base e KM base do veículo.';END IF;
 IF nullif(b->>'vehicle_id','') IS NOT NULL AND begin_km>(SELECT km_atual FROM public.veiculos WHERE id=(b->>'vehicle_id')::uuid) THEN RAISE EXCEPTION 'KM base excede o odômetro atual.';END IF;
 INSERT INTO public.maintenance_plans(company_id,created_by,nome,vehicle_id,categoria_veiculo,intervalo_km,intervalo_dias,ultima_execucao_km,ultima_execucao_data,ativo)
 VALUES(c,actor,btrim(b->>'nome'),nullif(b->>'vehicle_id','')::uuid,nullif(b->>'categoria_veiculo',''),nullif(b->>'intervalo_km','')::numeric,nullif(b->>'intervalo_dias','')::integer,CASE WHEN nullif(b->>'vehicle_id','') IS NOT NULL THEN begin_km END,begin_date,coalesce((b->>'ativo')::boolean,true)) RETURNING * INTO p;
 ELSE
 SELECT * INTO p FROM public.maintenance_plans WHERE id=(b->>'id')::uuid AND company_id=c FOR UPDATE;
 IF NOT FOUND OR p.version IS DISTINCT FROM (b->>'version')::integer THEN RAISE EXCEPTION 'Plano alterado. Atualize a página.' USING ERRCODE='40001';END IF;
 IF p.vehicle_id IS DISTINCT FROM nullif(b->>'vehicle_id','')::uuid OR p.categoria_veiculo IS DISTINCT FROM nullif(b->>'categoria_veiculo','') THEN RAISE EXCEPTION 'Não altere o vínculo; crie outro plano.';END IF;
 old_data:=to_jsonb(p);
 UPDATE public.maintenance_plans SET nome=btrim(b->>'nome'),intervalo_km=nullif(b->>'intervalo_km','')::numeric,intervalo_dias=nullif(b->>'intervalo_dias','')::integer,ativo=(b->>'ativo')::boolean,version=version+1 WHERE id=p.id RETURNING * INTO p;
 END IF;
 PERFORM maintenance_private.sync_plan_vehicles(c);
 INSERT INTO public.maintenance_plan_audit(company_id,entity_id,actor_id,action,snapshot) VALUES(c,p.id,actor,'plano_salvo',jsonb_build_object('antes',old_data,'depois',to_jsonb(p)));RETURN to_jsonb(p);
 ELSIF action='settings' THEN
 IF (b->>'dias')::integer NOT BETWEEN 0 AND 365 OR (b->>'km')::numeric NOT BETWEEN 0 AND 1000000 OR b->>'dias' IS NULL OR b->>'km' IS NULL THEN RAISE EXCEPTION 'Limites inválidos.';END IF;
 UPDATE public.maintenance_settings SET antecedencia_alerta_dias=(b->>'dias')::integer,antecedencia_alerta_km=(b->>'km')::numeric WHERE company_id=c AND version=(b->>'version')::integer RETURNING * INTO settings;
 IF NOT FOUND THEN RAISE EXCEPTION 'Configuração alterada. Atualize.' USING ERRCODE='40001';END IF;RETURN to_jsonb(settings);
 ELSIF action='notification_read' THEN
 UPDATE public.maintenance_preventive_notifications SET read_at=clock_timestamp() WHERE id=(b->>'id')::uuid AND company_id=c AND user_id=actor;RETURN '{}';
 ELSIF action='create_order' THEN
 SELECT * INTO v FROM public.veiculos WHERE id=(b->>'vehicle_id')::uuid AND company_id=c FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'Veículo inválido.';END IF;
 SELECT * INTO x FROM public.maintenance_plan_vehicles WHERE id=(b->>'plan_vehicle_id')::uuid AND vehicle_id=v.id AND company_id=c FOR UPDATE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM maintenance_private.plan_alerts(c) a WHERE a.id=x.id) THEN RAISE EXCEPTION 'Plano não está ativo para este veículo.';END IF;
 SELECT to_jsonb(o) INTO result FROM public.maintenance_plan_orders l JOIN public.maintenance_orders o ON o.id=l.order_id WHERE l.plan_vehicle_id=x.id AND o.status NOT IN ('encerrada','cancelada') LIMIT 1;
 IF result IS NOT NULL THEN RETURN result;END IF;
 result:=maintenance_private.order_command(c,'create',b||jsonb_build_object('tipo','preventiva'));
 INSERT INTO public.maintenance_plan_orders(company_id,plan_vehicle_id,order_id) VALUES(c,x.id,(result->>'id')::uuid);
 PERFORM maintenance_private.order_event(c,(result->>'id')::uuid,'comentario','OS vinculada ao plano preventivo',jsonb_build_object('plan_id',x.plan_id));RETURN result;
 END IF;
 PERFORM maintenance_private.sync_plan_vehicles(c);
 IF action='notifications' THEN RETURN jsonb_build_object('rows',coalesce((SELECT jsonb_agg(to_jsonb(n)) FROM public.maintenance_preventive_notifications n WHERE n.company_id=c AND n.user_id=actor AND n.resolved_at IS NULL),'[]'::jsonb),'unread',(SELECT count(*) FROM public.maintenance_preventive_notifications n WHERE n.company_id=c AND n.user_id=actor AND n.resolved_at IS NULL AND n.read_at IS NULL));END IF;
 IF action='context' THEN RETURN jsonb_build_object('plans',coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.nome) FROM public.maintenance_plans p WHERE company_id=c),'[]'::jsonb),'vehicles',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'placa',placa,'tipo',tipo,'km_atual',km_atual) ORDER BY placa) FROM public.veiculos WHERE company_id=c),'[]'::jsonb),'settings',(SELECT to_jsonb(s) FROM public.maintenance_settings s WHERE company_id=c));END IF;
 IF action='alerts' THEN RETURN jsonb_build_object('rows',coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY CASE a.estado WHEN 'vencida' THEN 0 WHEN 'breve' THEN 1 ELSE 2 END,a.placa,a.nome) FROM maintenance_private.plan_alerts(c) a WHERE nullif(b->>'vehicle_id','') IS NULL OR a.vehicle_id=(b->>'vehicle_id')::uuid),'[]'::jsonb));END IF;
 IF action='count' THEN RETURN jsonb_build_object('count',(SELECT count(*) FROM maintenance_private.plan_alerts(c) WHERE estado<>'dia'));END IF;
 RAISE EXCEPTION 'Ação inválida.';END $$;
CREATE FUNCTION public.maintenance_plan_command(target_company uuid,command text,body jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT maintenance_private.plan_command(target_company,command,body);$$;
REVOKE ALL ON FUNCTION public.maintenance_plan_command(uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.maintenance_plan_command(uuid,text,jsonb) TO authenticated;
REVOKE ALL ON FUNCTION maintenance_private.plan_command(uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION maintenance_private.plan_command(uuid,text,jsonb) TO authenticated;
REVOKE ALL ON FUNCTION maintenance_private.sync_plan_vehicles(uuid),maintenance_private.plan_alerts(uuid),maintenance_private.preventive_order_closed(),maintenance_private.process_preventive_alerts() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION maintenance_private.process_preventive_alerts() TO service_role;
COMMIT;
