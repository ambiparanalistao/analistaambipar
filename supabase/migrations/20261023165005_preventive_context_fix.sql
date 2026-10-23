BEGIN;
CREATE OR REPLACE FUNCTION maintenance_private.plan_command(c uuid,action text,b jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
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
 IF action='context' THEN RETURN jsonb_build_object('plans',coalesce((SELECT jsonb_agg(to_jsonb(plan_row) ORDER BY plan_row.nome) FROM public.maintenance_plans plan_row WHERE plan_row.company_id=c),'[]'::jsonb),'vehicles',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'placa',placa,'tipo',tipo,'km_atual',km_atual) ORDER BY placa) FROM public.veiculos WHERE company_id=c),'[]'::jsonb),'settings',(SELECT to_jsonb(s) FROM public.maintenance_settings s WHERE company_id=c));END IF;
 IF action='alerts' THEN RETURN jsonb_build_object('rows',coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY CASE a.estado WHEN 'vencida' THEN 0 WHEN 'breve' THEN 1 ELSE 2 END,a.placa,a.nome) FROM maintenance_private.plan_alerts(c) a WHERE nullif(b->>'vehicle_id','') IS NULL OR a.vehicle_id=(b->>'vehicle_id')::uuid),'[]'::jsonb));END IF;
 IF action='count' THEN RETURN jsonb_build_object('count',(SELECT count(*) FROM maintenance_private.plan_alerts(c) WHERE estado<>'dia'));END IF;
 RAISE EXCEPTION 'Ação inválida.';END $$;
COMMIT;
