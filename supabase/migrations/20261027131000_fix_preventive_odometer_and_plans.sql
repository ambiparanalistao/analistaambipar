BEGIN;

-- ==============================================================================
-- CORREÇÃO DEFINITIVA DO ODÔMETRO E DOS PLANOS PREVENTIVOS AUTOMÁTICOS DA FROTA
-- ==============================================================================

-- 1. Ajustar a restrição CHECK da tabela maintenance_plans para permitir planos universais da frota.
-- A restrição antiga (maintenance_plans_check) exigia que exatamente um entre vehicle_id e categoria_veiculo
-- estivesse preenchido. A nova restrição permite planos universais para toda a frota (categoria 'TODOS' ou nula),
-- validando que não se defina concorrentemente um veículo específico e uma categoria ao mesmo tempo.
ALTER TABLE public.maintenance_plans DROP CONSTRAINT IF EXISTS maintenance_plans_check;

ALTER TABLE public.maintenance_plans 
  ADD CONSTRAINT maintenance_plans_check 
  CHECK (NOT (vehicle_id IS NOT NULL AND nullif(btrim(categoria_veiculo),'') IS NOT NULL));

-- 2. Atualizar a função ensure_default_preventive_plans:
-- Utiliza 'TODOS' como categoria e seleciona um usuário válido do auth.users para created_by.
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

  -- Se não encontrar nenhum usuário para associar como criador, aborta sem lançar erro
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

-- 3. Sincronização dos planos com os veículos da frota (SECURITY DEFINER para não barrar usuários comuns)
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

-- 4. Função e gatilho com tratamento defensivo de exceção:
-- A atualização do KM de veículos no cadastro NUNCA pode ser bloqueada por erros em funções secundárias
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

-- 5. Executar imediatamente para gerar e sincronizar os planos preventivos em todas as empresas ativas
DO $$
DECLARE
  comp RECORD;
BEGIN
  FOR comp IN SELECT id FROM public.companies WHERE ativo LOOP
    BEGIN
      PERFORM maintenance_private.ensure_default_preventive_plans(comp.id);
      PERFORM maintenance_private.sync_plan_vehicles(comp.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Ignorando empresa % no sync inicial: %', comp.id, SQLERRM;
    END;
  END LOOP;
END;
$$;

COMMIT;
