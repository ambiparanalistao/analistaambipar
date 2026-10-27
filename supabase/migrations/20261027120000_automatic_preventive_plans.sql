BEGIN;

-- 1. Função para garantir que todas as empresas tenham os planos preventivos periódicos padrão
CREATE OR REPLACE FUNCTION maintenance_private.ensure_default_preventive_plans(c uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
  first_admin uuid;
BEGIN
  IF c IS NULL THEN RETURN; END IF;

  SELECT user_id INTO first_admin FROM public.company_members WHERE company_id=c AND ativo LIMIT 1;
  IF first_admin IS NULL THEN
    SELECT auth.uid() INTO first_admin;
  END IF;
  IF first_admin IS NULL THEN
    SELECT user_id INTO first_admin FROM public.veiculos WHERE company_id=c AND user_id IS NOT NULL LIMIT 1;
  END IF;
  IF first_admin IS NULL THEN
    SELECT id INTO first_admin FROM auth.users LIMIT 1;
  END IF;

  IF first_admin IS NULL THEN
    RETURN;
  END IF;

  -- 1. Troca de Óleo de Motor (a cada 10.000 km ou 180 dias)
  IF NOT EXISTS(SELECT 1 FROM public.maintenance_plans WHERE company_id=c AND (nome ILIKE '%óleo%' OR nome ILIKE '%oleo%') AND vehicle_id IS NULL) THEN
    INSERT INTO public.maintenance_plans(company_id,created_by,nome,categoria_veiculo,intervalo_km,intervalo_dias,ativo)
    VALUES(c,first_admin,'Troca de Óleo de Motor','TODOS',10000,180,true);
  END IF;

  -- 2. Filtros (Ar, Óleo e Combustível) (a cada 10.000 km ou 180 dias)
  IF NOT EXISTS(SELECT 1 FROM public.maintenance_plans WHERE company_id=c AND nome ILIKE '%filtro%' AND vehicle_id IS NULL) THEN
    INSERT INTO public.maintenance_plans(company_id,created_by,nome,categoria_veiculo,intervalo_km,intervalo_dias,ativo)
    VALUES(c,first_admin,'Filtros (Ar, Óleo e Combustível)','TODOS',10000,180,true);
  END IF;

  -- 3. Sistema de Freios (Pastilhas, Lonas e Discos) (a cada 20.000 km ou 365 dias)
  IF NOT EXISTS(SELECT 1 FROM public.maintenance_plans WHERE company_id=c AND nome ILIKE '%freio%' AND vehicle_id IS NULL) THEN
    INSERT INTO public.maintenance_plans(company_id,created_by,nome,categoria_veiculo,intervalo_km,intervalo_dias,ativo)
    VALUES(c,first_admin,'Sistema de Freios (Pastilhas, Lonas e Discos)','TODOS',20000,365,true);
  END IF;

  -- 4. Pneus (Rodízio e Alinhamento) (a cada 10.000 km ou 180 dias)
  IF NOT EXISTS(SELECT 1 FROM public.maintenance_plans WHERE company_id=c AND nome ILIKE '%pneu%' AND vehicle_id IS NULL) THEN
    INSERT INTO public.maintenance_plans(company_id,created_by,nome,categoria_veiculo,intervalo_km,intervalo_dias,ativo)
    VALUES(c,first_admin,'Pneus (Rodízio, Alinhamento e Geometria)','TODOS',10000,180,true);
  END IF;

  -- 5. Correias e Tensores (a cada 40.000 km ou 730 dias)
  IF NOT EXISTS(SELECT 1 FROM public.maintenance_plans WHERE company_id=c AND nome ILIKE '%correia%' AND vehicle_id IS NULL) THEN
    INSERT INTO public.maintenance_plans(company_id,created_by,nome,categoria_veiculo,intervalo_km,intervalo_dias,ativo)
    VALUES(c,first_admin,'Correias, Tensores e Transmissão','TODOS',40000,730,true);
  END IF;

  -- 6. Revisão Geral Periódica Preventiva (a cada 30.000 km ou 365 dias)
  IF NOT EXISTS(SELECT 1 FROM public.maintenance_plans WHERE company_id=c AND (nome ILIKE '%revisão geral%' OR nome ILIKE '%revisao geral%') AND vehicle_id IS NULL) THEN
    INSERT INTO public.maintenance_plans(company_id,created_by,nome,categoria_veiculo,intervalo_km,intervalo_dias,ativo)
    VALUES(c,first_admin,'Revisão Geral Preventiva Periódica','TODOS',30000,365,true);
  END IF;

  PERFORM maintenance_private.sync_plan_vehicles(c);
END;
$$;

-- 2. Sincronização de veículos com suporte a planos universais para toda a frota
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
  SET updated_at = clock_timestamp();
END;
$$;

-- 3. Visão e cálculo de alertas preventivos com suporte a planos universais
CREATE OR REPLACE FUNCTION maintenance_private.plan_alerts(c uuid)
RETURNS TABLE(id uuid,plan_id uuid,vehicle_id uuid,nome text,placa text,categoria text,km_atual integer,ultima_execucao_km integer,ultima_execucao_data date,proxima_km numeric,proxima_data date,estado text,cycle integer,order_id uuid)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 WITH due AS (
   SELECT x.*,p.nome,v.placa,v.tipo,v.km_atual,
     p.intervalo_km+x.ultima_execucao_km AS nk,
     p.intervalo_dias+x.ultima_execucao_data AS nd,
     coalesce(s.antecedencia_alerta_km,500) ak,
     coalesce(s.antecedencia_alerta_dias,7) ad
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

-- 4. Gatilho automático para garantir e sincronizar preventivas ao criar ou alterar KM de veículo
CREATE OR REPLACE FUNCTION maintenance_private.on_vehicle_km_preventive_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  BEGIN
    PERFORM maintenance_private.ensure_default_preventive_plans(NEW.company_id);
    PERFORM maintenance_private.sync_plan_vehicles(NEW.company_id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Aviso preventivas frota (empresa %): %', NEW.company_id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vehicle_km_preventive_sync ON public.veiculos;
CREATE TRIGGER trg_vehicle_km_preventive_sync
AFTER INSERT OR UPDATE OF km_atual, tipo ON public.veiculos
FOR EACH ROW EXECUTE FUNCTION maintenance_private.on_vehicle_km_preventive_sync();

COMMIT;
