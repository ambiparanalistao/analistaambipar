BEGIN;

-- ==============================================================================
-- 1. ANTECEDÊNCIA DE ALERTAS PREVENTIVOS PARA 1.500 KM EM TODAS AS EMPRESAS
-- ==============================================================================

-- Atualiza a coluna antecedencia_alerta_km na tabela maintenance_settings para padrão 1500
ALTER TABLE public.maintenance_settings 
  ALTER COLUMN antecedencia_alerta_km SET DEFAULT 1500;

-- Alinha todas as configurações existentes para 1.500 km de antecedência
UPDATE public.maintenance_settings 
SET antecedencia_alerta_km = 1500 
WHERE antecedencia_alerta_km IS NULL OR antecedencia_alerta_km = 500;


-- ==============================================================================
-- 2. ATUALIZAR FUNÇÃO plan_alerts COM ANTECEDÊNCIA PADRÃO DE 1.500 KM
-- ==============================================================================

CREATE OR REPLACE FUNCTION maintenance_private.plan_alerts(c uuid)
RETURNS TABLE(id uuid,plan_id uuid,vehicle_id uuid,nome text,placa text,categoria text,km_atual integer,ultima_execucao_km integer,ultima_execucao_data date,proxima_km numeric,proxima_data date,estado text,cycle integer,order_id uuid)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 WITH due AS (
   SELECT x.*,p.nome,v.placa,v.tipo,v.km_atual,
     p.intervalo_km+x.ultima_execucao_km AS nk,
     p.intervalo_dias+x.ultima_execucao_data AS nd,
     coalesce(s.antecedencia_alerta_km, 1500) ak,
     coalesce(s.antecedencia_alerta_dias, 7) ad
   FROM public.maintenance_plan_vehicles x
   JOIN public.maintenance_plans p ON p.id=x.plan_id AND p.ativo
   JOIN public.veiculos v ON v.id=x.vehicle_id AND v.company_id=x.company_id
   LEFT JOIN public.maintenance_settings s ON s.company_id=x.company_id
   WHERE x.company_id=c AND (
     p.vehicle_id=v.id 
     OR (p.vehicle_id IS NULL AND (p.categoria_veiculo IS NULL OR p.categoria_veiculo='' OR p.categoria_veiculo='TODOS' OR p.categoria_veiculo=v.tipo))
   )
 )
 SELECT d.id,d.plan_id,d.vehicle_id,d.nome,d.placa,d.tipo,d.km_atual,d.ultima_execucao_km,d.ultima_execucao_data,d.nk,d.nd,
 CASE 
   WHEN d.km_atual>=d.nk OR (clock_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date>=d.nd THEN 'vencida'
   WHEN d.km_atual+d.ak>=d.nk OR (clock_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date+d.ad>=d.nd THEN 'breve'
   ELSE 'dia'
 END,
 d.cycle,
 (SELECT o.id FROM public.maintenance_plan_orders l JOIN public.maintenance_orders o ON o.id=l.order_id WHERE l.plan_vehicle_id=d.id AND o.status NOT IN ('encerrada','cancelada') ORDER BY o.created_at DESC LIMIT 1)
 FROM due d;
$$;


-- ==============================================================================
-- 3. SINCRONIZAÇÃO DE VEÍCULOS AO EDITAR INTERVALO DO PLANO
-- ==============================================================================

CREATE OR REPLACE FUNCTION maintenance_private.sync_plan_vehicles(c uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF c IS NULL THEN RETURN; END IF;

  INSERT INTO public.maintenance_plan_vehicles(company_id,plan_id,vehicle_id,ultima_execucao_km,ultima_execucao_data)
  SELECT p.company_id,p.id,v.id,
    coalesce(p.ultima_execucao_km, (floor(coalesce(v.km_atual,0)::numeric / greatest(coalesce(p.intervalo_km,10000),1)) * greatest(coalesce(p.intervalo_km,10000),1))::integer, 0),
    coalesce(p.ultima_execucao_data,(clock_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date)
  FROM public.maintenance_plans p
  JOIN public.veiculos v ON v.company_id=p.company_id AND (
    v.id=p.vehicle_id 
    OR (p.vehicle_id IS NULL AND (p.categoria_veiculo IS NULL OR p.categoria_veiculo='' OR p.categoria_veiculo='TODOS' OR v.tipo=p.categoria_veiculo))
  )
  WHERE p.company_id=c AND p.ativo
  ON CONFLICT(plan_id,vehicle_id) DO UPDATE
  SET ultima_execucao_km = CASE 
        -- Se ainda não houve ordem encerrada vinculada executada, recalcula a base pelo odômetro e novo intervalo
        WHEN NOT EXISTS (SELECT 1 FROM public.maintenance_plan_orders l WHERE l.plan_vehicle_id = maintenance_plan_vehicles.id AND l.executed_at IS NOT NULL)
        THEN (floor(coalesce((SELECT v2.km_atual FROM public.veiculos v2 WHERE v2.id = maintenance_plan_vehicles.vehicle_id),0)::numeric / greatest(coalesce((SELECT p2.intervalo_km FROM public.maintenance_plans p2 WHERE p2.id = maintenance_plan_vehicles.plan_id),10000),1)) * greatest(coalesce((SELECT p2.intervalo_km FROM public.maintenance_plans p2 WHERE p2.id = maintenance_plan_vehicles.plan_id),10000),1))::integer
        ELSE maintenance_plan_vehicles.ultima_execucao_km
      END,
      updated_at = clock_timestamp();
END;
$$;


-- ==============================================================================
-- 4. ATUALIZAR plan_command PARA PERMITIR EDIÇÃO DOS KMS PROGRAMADOS (UNIVERSAIS E INDIVIDUAIS)
-- ==============================================================================

CREATE OR REPLACE FUNCTION maintenance_private.plan_command(c uuid,action text,b jsonb) 
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE 
  actor uuid:=auth.uid();
  p public.maintenance_plans;
  x public.maintenance_plan_vehicles;
  v public.veiculos;
  result jsonb;
  old_data jsonb;
  full_access boolean;
  pid uuid;
  begin_km integer;
  begin_date date;
  settings public.maintenance_settings;
  v_categoria text;
BEGIN
  IF actor IS NULL OR NOT maintenance_private.partner_access(c) THEN 
    RAISE EXCEPTION 'Sem acesso à empresa.' USING ERRCODE='42501';
  END IF;
  
  PERFORM 1 FROM public.company_members WHERE company_id=c AND user_id=actor AND ativo FOR SHARE;
  PERFORM 1 FROM public.companies WHERE id=c AND ativo FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Empresa inativa.'; END IF;
  
  IF NOT maintenance_private.partner_access(c) THEN 
    RAISE EXCEPTION 'Perfil sem acesso.' USING ERRCODE='42501';
  END IF;
  
  full_access:=maintenance_private.partner_access(c,true);
  IF action IN ('save','settings') AND NOT full_access THEN 
    RAISE EXCEPTION 'Somente Admin/Analista configuram preventivas.' USING ERRCODE='42501';
  END IF;

  IF action='save' THEN
    IF length(btrim(coalesce(b->>'nome',''))) NOT BETWEEN 1 AND 100 THEN 
      RAISE EXCEPTION 'Informe o item (até 100 caracteres).';
    END IF;
    
    IF nullif(b->>'intervalo_km','') IS NULL AND nullif(b->>'intervalo_dias','') IS NULL THEN 
      RAISE EXCEPTION 'Informe intervalo por KM ou dias.';
    END IF;
    
    IF nullif(b->>'intervalo_km','') IS NOT NULL AND ((b->>'intervalo_km')::numeric NOT BETWEEN 1 AND 2147483647 OR (b->>'intervalo_km')::numeric<>trunc((b->>'intervalo_km')::numeric)) THEN 
      RAISE EXCEPTION 'Intervalo KM inválido.';
    END IF;
    
    IF nullif(b->>'intervalo_dias','') IS NOT NULL AND (b->>'intervalo_dias')::integer NOT BETWEEN 1 AND 36500 THEN 
      RAISE EXCEPTION 'Intervalo de dias inválido.';
    END IF;

    v_categoria := nullif(b->>'categoria_veiculo','');
    IF v_categoria IS NULL AND nullif(b->>'vehicle_id','') IS NULL THEN
      -- Se não especificou nem veículo nem categoria, assume plano universal para toda a frota
      v_categoria := 'TODOS';
    END IF;

    IF nullif(b->>'vehicle_id','') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.veiculos WHERE id=(b->>'vehicle_id')::uuid AND company_id=c) THEN 
      RAISE EXCEPTION 'Veículo inválido.';
    END IF;
    
    IF v_categoria IS NOT NULL AND v_categoria<>'TODOS' AND NOT EXISTS(SELECT 1 FROM public.veiculos WHERE company_id=c AND tipo=v_categoria) THEN 
      RAISE EXCEPTION 'Categoria inválida.';
    END IF;

    begin_km:=nullif(b->>'ultima_execucao_km','')::integer;
    begin_date:=nullif(b->>'ultima_execucao_data','')::date;
    IF begin_date>(clock_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date OR (begin_km IS NOT NULL AND begin_km<0) THEN 
      RAISE EXCEPTION 'Revise a base de execução.';
    END IF;

    IF nullif(b->>'id','') IS NULL THEN
      IF begin_date IS NULL OR (nullif(b->>'vehicle_id','') IS NOT NULL AND begin_km IS NULL) THEN 
        RAISE EXCEPTION 'Informe data base e KM base do veículo.';
      END IF;
      IF nullif(b->>'vehicle_id','') IS NOT NULL AND begin_km>(SELECT km_atual FROM public.veiculos WHERE id=(b->>'vehicle_id')::uuid) THEN 
        RAISE EXCEPTION 'KM base excede o odômetro atual.';
      END IF;

      INSERT INTO public.maintenance_plans(company_id,created_by,nome,vehicle_id,categoria_veiculo,intervalo_km,intervalo_dias,ultima_execucao_km,ultima_execucao_data,ativo)
      VALUES(c,actor,btrim(b->>'nome'),nullif(b->>'vehicle_id','')::uuid,v_categoria,nullif(b->>'intervalo_km','')::numeric,nullif(b->>'intervalo_dias','')::integer,CASE WHEN nullif(b->>'vehicle_id','') IS NOT NULL THEN begin_km END,begin_date,coalesce((b->>'ativo')::boolean,true)) 
      RETURNING * INTO p;
    ELSE
      SELECT * INTO p FROM public.maintenance_plans WHERE id=(b->>'id')::uuid AND company_id=c FOR UPDATE;
      IF NOT FOUND THEN 
        RAISE EXCEPTION 'Plano não encontrado.' USING ERRCODE='40001';
      END IF;
      old_data:=to_jsonb(p);
      
      UPDATE public.maintenance_plans 
      SET nome=btrim(coalesce(b->>'nome', p.nome)),
          intervalo_km=nullif(b->>'intervalo_km','')::numeric,
          intervalo_dias=nullif(b->>'intervalo_dias','')::integer,
          ativo=coalesce((b->>'ativo')::boolean, p.ativo),
          version=version+1 
      WHERE id=p.id 
      RETURNING * INTO p;
    END IF;

    PERFORM maintenance_private.sync_plan_vehicles(c);
    INSERT INTO public.maintenance_plan_audit(company_id,entity_id,actor_id,action,snapshot) 
    VALUES(c,p.id,actor,'plano_salvo',jsonb_build_object('antes',old_data,'depois',to_jsonb(p)));
    
    RETURN to_jsonb(p);

  ELSIF action='settings' THEN
    IF (b->>'dias')::integer NOT BETWEEN 0 AND 365 OR (b->>'km')::numeric NOT BETWEEN 0 AND 1000000 OR b->>'dias' IS NULL OR b->>'km' IS NULL THEN 
      RAISE EXCEPTION 'Limites inválidos.';
    END IF;
    UPDATE public.maintenance_settings 
    SET antecedencia_alerta_dias=(b->>'dias')::integer,
        antecedencia_alerta_km=(b->>'km')::numeric 
    WHERE company_id=c AND (version=(b->>'version')::integer OR b->>'version' IS NULL) 
    RETURNING * INTO settings;
    
    IF NOT FOUND THEN 
      RAISE EXCEPTION 'Configuração alterada. Atualize.' USING ERRCODE='40001';
    END IF;
    RETURN to_jsonb(settings);

  ELSIF action='notification_read' THEN
    UPDATE public.maintenance_preventive_notifications 
    SET read_at=clock_timestamp() 
    WHERE id=(b->>'id')::uuid AND company_id=c AND user_id=actor;
    RETURN '{}';

  ELSIF action='create_order' THEN
    SELECT * INTO v FROM public.veiculos WHERE id=(b->>'vehicle_id')::uuid AND company_id=c FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Veículo inválido.'; END IF;
    
    SELECT * INTO x FROM public.maintenance_plan_vehicles WHERE id=(b->>'plan_vehicle_id')::uuid AND vehicle_id=v.id AND company_id=c FOR UPDATE;
    IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM maintenance_private.plan_alerts(c) a WHERE a.id=x.id) THEN 
      RAISE EXCEPTION 'Plano não está ativo para este veículo.';
    END IF;
    
    SELECT to_jsonb(o) INTO result 
    FROM public.maintenance_plan_orders l 
    JOIN public.maintenance_orders o ON o.id=l.order_id 
    WHERE l.plan_vehicle_id=x.id AND o.status NOT IN ('encerrada','cancelada') 
    LIMIT 1;
    
    IF result IS NOT NULL THEN RETURN result; END IF;
    
    result:=maintenance_private.order_command(c,'create',b||jsonb_build_object('tipo','preventiva'));
    INSERT INTO public.maintenance_plan_orders(company_id,plan_vehicle_id,order_id) 
    VALUES(c,x.id,(result->>'id')::uuid);
    
    PERFORM maintenance_private.order_event(c,(result->>'id')::uuid,'comentario','OS vinculada ao plano preventivo',jsonb_build_object('plan_id',x.plan_id));
    RETURN result;
  END IF;

  PERFORM maintenance_private.sync_plan_vehicles(c);

  IF action='notifications' THEN 
    RETURN jsonb_build_object(
      'rows',coalesce((SELECT jsonb_agg(to_jsonb(n)) FROM public.maintenance_preventive_notifications n WHERE n.company_id=c AND n.user_id=actor AND n.resolved_at IS NULL),'[]'::jsonb),
      'unread',(SELECT count(*) FROM public.maintenance_preventive_notifications n WHERE n.company_id=c AND n.user_id=actor AND n.resolved_at IS NULL AND n.read_at IS NULL)
    );
  END IF;

  IF action='context' THEN 
    RETURN jsonb_build_object(
      'plans',coalesce((SELECT jsonb_agg(to_jsonb(plan_row) ORDER BY plan_row.nome) FROM public.maintenance_plans plan_row WHERE plan_row.company_id=c),'[]'::jsonb),
      'vehicles',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'placa',placa,'tipo',tipo,'km_atual',km_atual) ORDER BY placa) FROM public.veiculos WHERE company_id=c),'[]'::jsonb),
      'settings',(SELECT to_jsonb(s) FROM public.maintenance_settings s WHERE company_id=c)
    );
  END IF;

  IF action='alerts' THEN 
    RETURN jsonb_build_object(
      'rows',coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY CASE a.estado WHEN 'vencida' THEN 0 WHEN 'breve' THEN 1 ELSE 2 END,a.placa,a.nome) FROM maintenance_private.plan_alerts(c) a WHERE nullif(b->>'vehicle_id','') IS NULL OR a.vehicle_id=(b->>'vehicle_id')::uuid),'[]'::jsonb)
    );
  END IF;

  IF action='count' THEN 
    RETURN jsonb_build_object('count',(SELECT count(*) FROM maintenance_private.plan_alerts(c) WHERE estado<>'dia'));
  END IF;

  RAISE EXCEPTION 'Ação inválida.';
END;
$$;

COMMIT;
