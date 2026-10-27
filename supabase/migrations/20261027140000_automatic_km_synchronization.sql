BEGIN;

-- ==============================================================================
-- SINCRONIZAÇÃO AUTOMÁTICA DE ODÔMETRO (KM) E CONTROLE PREVENTIVO POR VEÍCULO
-- ==============================================================================
-- 1. Toda vez que um reparo for solicitado (Ordem de Serviço, Relato do Motorista,
--    Checklist Operacional ou Visita de Oficina), o odômetro do respectivo veículo
--    é atualizado no cadastro.
-- 2. Toda vez que relatórios/registros de combustíveis forem alimentados
--    (tabela fuel_transactions), o KM do respectivo veículo é atualizado.
-- 3. Isolamento absoluto por veículo (id e company_id): o KM de um veículo JAMAIS
--    se mistura com o de outro veículo e nunca diminui (greatest).
-- 4. Ao atualizar o KM do veículo, a área preventiva recalcula automaticamente
--    as metas e alertas daquele veículo.
-- ==============================================================================

-- 1. Sincronização de KM a partir de abastecimentos / combustíveis
CREATE OR REPLACE FUNCTION maintenance_private.on_fuel_transaction_km_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
  v_id uuid := NEW.vehicle_id;
  v_km integer := NEW.km_no_ato;
BEGIN
  -- Se o vehicle_id estiver nulo, tenta localizar o veículo estritamente pela placa na mesma empresa
  IF v_id IS NULL AND nullif(btrim(coalesce(NEW.placa_snapshot, '')), '') IS NOT NULL THEN
    SELECT id INTO v_id 
    FROM public.veiculos 
    WHERE company_id = NEW.company_id 
      AND upper(btrim(replace(placa, '-', ''))) = upper(btrim(replace(NEW.placa_snapshot, '-', '')))
    LIMIT 1;
    
    IF v_id IS NOT NULL THEN
      NEW.vehicle_id := v_id;
    END IF;
  END IF;

  -- Se identificamos o veículo e há um KM válido maior que zero
  IF v_id IS NOT NULL AND v_km IS NOT NULL AND v_km > 0 THEN
    -- Atualiza estritamente o veículo correspondente desta mesma empresa
    UPDATE public.veiculos 
    SET km_atual = greatest(coalesce(km_atual, 0), v_km)
    WHERE id = v_id 
      AND company_id = NEW.company_id 
      AND (km_atual IS NULL OR km_atual < v_km);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fuel_transaction_km_sync ON public.fuel_transactions;
CREATE TRIGGER trg_fuel_transaction_km_sync
BEFORE INSERT OR UPDATE OF km_no_ato, vehicle_id, placa_snapshot ON public.fuel_transactions
FOR EACH ROW EXECUTE FUNCTION maintenance_private.on_fuel_transaction_km_sync();


-- 2. Sincronização de KM a partir de Ordens de Serviço (S.D.O)
CREATE OR REPLACE FUNCTION maintenance_private.on_order_km_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
  highest_km integer;
BEGIN
  IF NEW.vehicle_id IS NOT NULL THEN
    highest_km := greatest(
      coalesce(NEW.km_saida::integer, 0),
      coalesce(NEW.km_entrada::integer, 0),
      coalesce(NEW.km_abertura::integer, 0)
    );

    IF highest_km > 0 THEN
      UPDATE public.veiculos
      SET km_atual = greatest(coalesce(km_atual, 0), highest_km)
      WHERE id = NEW.vehicle_id 
        AND company_id = NEW.company_id 
        AND (km_atual IS NULL OR km_atual < highest_km);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_km_sync ON public.maintenance_orders;
CREATE TRIGGER trg_order_km_sync
AFTER INSERT OR UPDATE OF km_abertura, km_entrada, km_saida, vehicle_id ON public.maintenance_orders
FOR EACH ROW EXECUTE FUNCTION maintenance_private.on_order_km_sync();


-- 3. Sincronização de KM a partir de Solicitações do Motorista (Portal / Link)
CREATE OR REPLACE FUNCTION maintenance_private.on_driver_report_km_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NEW.vehicle_id IS NOT NULL AND NEW.km IS NOT NULL AND NEW.km > 0 THEN
    UPDATE public.veiculos
    SET km_atual = greatest(coalesce(km_atual, 0), NEW.km)
    WHERE id = NEW.vehicle_id 
      AND company_id = NEW.company_id 
      AND (km_atual IS NULL OR km_atual < NEW.km);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_driver_report_km_sync ON public.maintenance_driver_reports;
CREATE TRIGGER trg_driver_report_km_sync
AFTER INSERT OR UPDATE OF km, vehicle_id ON public.maintenance_driver_reports
FOR EACH ROW EXECUTE FUNCTION maintenance_private.on_driver_report_km_sync();


-- 4. Sincronização de KM a partir de Checklists Operacionais
CREATE OR REPLACE FUNCTION maintenance_private.on_checklist_km_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NEW.vehicle_id IS NOT NULL AND NEW.km IS NOT NULL AND NEW.km > 0 THEN
    UPDATE public.veiculos
    SET km_atual = greatest(coalesce(km_atual, 0), NEW.km)
    WHERE id = NEW.vehicle_id 
      AND company_id = NEW.company_id 
      AND (km_atual IS NULL OR km_atual < NEW.km);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_checklist_km_sync ON public.maintenance_checklists;
CREATE TRIGGER trg_checklist_km_sync
AFTER INSERT OR UPDATE OF km, vehicle_id ON public.maintenance_checklists
FOR EACH ROW EXECUTE FUNCTION maintenance_private.on_checklist_km_sync();


-- 5. Sincronização de KM a partir de Visitas à Oficina (chegada / saída)
CREATE OR REPLACE FUNCTION maintenance_private.on_workshop_visit_km_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
  highest_km integer;
BEGIN
  IF NEW.vehicle_id IS NOT NULL THEN
    highest_km := greatest(
      coalesce(NEW.km_saida::integer, 0),
      coalesce(NEW.km_chegada::integer, 0)
    );

    IF highest_km > 0 THEN
      UPDATE public.veiculos
      SET km_atual = greatest(coalesce(km_atual, 0), highest_km)
      WHERE id = NEW.vehicle_id 
        AND company_id = NEW.company_id 
        AND (km_atual IS NULL OR km_atual < highest_km);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_workshop_visit_km_sync ON public.workshop_visits;
CREATE TRIGGER trg_workshop_visit_km_sync
AFTER INSERT OR UPDATE OF km_chegada, km_saida, vehicle_id ON public.workshop_visits
FOR EACH ROW EXECUTE FUNCTION maintenance_private.on_workshop_visit_km_sync();


-- 6. Sincronização Retroativa Imediata: atualiza veículos cujo KM nos abastecimentos ou ordens seja maior que o odômetro atual
DO $$
DECLARE
  rec RECORD;
BEGIN
  -- Atualiza a partir dos maiores KMs de combustível já registrados
  FOR rec IN (
    SELECT f.vehicle_id, f.company_id, max(f.km_no_ato) AS max_km
    FROM public.fuel_transactions f
    WHERE f.vehicle_id IS NOT NULL AND f.km_no_ato > 0
    GROUP BY f.vehicle_id, f.company_id
  ) LOOP
    UPDATE public.veiculos v
    SET km_atual = greatest(coalesce(v.km_atual, 0), rec.max_km)
    WHERE v.id = rec.vehicle_id 
      AND v.company_id = rec.company_id 
      AND (v.km_atual IS NULL OR v.km_atual < rec.max_km);
  END LOOP;

  -- Atualiza a partir dos maiores KMs de ordens de serviço já registradas
  FOR rec IN (
    SELECT o.vehicle_id, o.company_id, max(greatest(coalesce(o.km_saida::integer, 0), coalesce(o.km_entrada::integer, 0), coalesce(o.km_abertura::integer, 0))) AS max_km
    FROM public.maintenance_orders o
    WHERE o.vehicle_id IS NOT NULL
    GROUP BY o.vehicle_id, o.company_id
  ) LOOP
    IF rec.max_km > 0 THEN
      UPDATE public.veiculos v
      SET km_atual = greatest(coalesce(v.km_atual, 0), rec.max_km)
      WHERE v.id = rec.vehicle_id 
        AND v.company_id = rec.company_id 
        AND (v.km_atual IS NULL OR v.km_atual < rec.max_km);
    END IF;
  END LOOP;
END;
$$;

COMMIT;
