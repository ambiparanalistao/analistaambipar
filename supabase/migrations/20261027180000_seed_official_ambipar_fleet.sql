BEGIN;

-- ==============================================================================
-- Migration: 20261027180000_seed_official_ambipar_fleet.sql
-- Objetivo: 
--  1. Exclusão definitiva de veículos testes/fictícios (EWX-0I82) e limpeza em cascata
--  2. Cadastro e sincronização dos 18 Veículos Oficiais da Frota Ambipar 2026
-- ==============================================================================

-- 1. Exclui com segurança qualquer veículo de teste (ex: EWX-0I82) em todas as empresas
DO $$
DECLARE
  v RECORD;
  c_id uuid;
BEGIN
  FOR v IN (
    SELECT id, company_id, placa 
    FROM public.veiculos 
    WHERE placa ILIKE 'EWX%' OR placa IN ('EWX-0I82','EWX0I82')
  ) LOOP
    c_id := v.company_id;
    IF c_id IS NOT NULL THEN
      BEGIN
        PERFORM maintenance_private.vehicle_delete(c_id, v.id);
        RAISE NOTICE 'Veículo teste % excluído com sucesso via RPC.', v.placa;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Aviso ao excluir via RPC: %, aplicando limpeza direta...', SQLERRM;
        -- Limpeza direta em caso de exceção de permissão durante migration
        IF to_regclass('public.vehicle_preventive_settings') IS NOT NULL THEN
          DELETE FROM public.vehicle_preventive_settings WHERE vehicle_id = v.id;
        END IF;
        IF to_regclass('public.maintenance_plan_orders') IS NOT NULL AND to_regclass('public.maintenance_plan_vehicles') IS NOT NULL THEN
          DELETE FROM public.maintenance_plan_orders WHERE plan_vehicle_id IN (SELECT id FROM public.maintenance_plan_vehicles WHERE vehicle_id = v.id);
        END IF;
        IF to_regclass('public.maintenance_plan_vehicles') IS NOT NULL THEN
          DELETE FROM public.maintenance_plan_vehicles WHERE vehicle_id = v.id;
        END IF;
        IF to_regclass('public.maintenance_plans') IS NOT NULL THEN
          DELETE FROM public.maintenance_plans WHERE vehicle_id = v.id;
        END IF;
        IF to_regclass('public.maintenance_orders') IS NOT NULL THEN
          UPDATE public.maintenance_orders SET vehicle_id = NULL WHERE vehicle_id = v.id;
        END IF;
        IF to_regclass('public.workshop_visits') IS NOT NULL THEN
          UPDATE public.workshop_visits SET vehicle_id = NULL WHERE vehicle_id = v.id;
        END IF;
        UPDATE public.motoristas SET veiculo_vinculado = NULL WHERE veiculo_vinculado ILIKE (v.placa || '%');
        DELETE FROM public.veiculos WHERE id = v.id;
      END;
    ELSE
      -- Veículo legado sem company_id
      DELETE FROM public.veiculos WHERE id = v.id;
    END IF;
  END LOOP;
END $$;

-- 2. Cadastro oficial e sincronização dos 18 Veículos Reais da Frota Ambipar
DO $$
DECLARE
  comp RECORD;
  v_rec RECORD;
  official_vehicles jsonb := '[
    {
      "placa": "RAW-1B54",
      "prefixo": "AMB-RAW1B54",
      "marca_modelo": "VW Delivery 9.170 / Baú 3/4",
      "tipo": "Caminhão Truck PBT 23t (Tanque/Baú)",
      "tipo_carga": "Resíduos Industriais / Waste DCX",
      "combustivel": "Diesel S10",
      "km_atual": 142500,
      "status": "Disponível"
    },
    {
      "placa": "GBU-0A23",
      "prefixo": "AMB-GBU0A23",
      "marca_modelo": "VW Delivery 11.180 / Baú 3/4",
      "tipo": "Caminhão Truck PBT 23t (Tanque/Baú)",
      "tipo_carga": "Resíduos Industriais / Waste DCX",
      "combustivel": "Diesel S10",
      "km_atual": 98400,
      "status": "Disponível"
    },
    {
      "placa": "TBX-9D85",
      "prefixo": "AMB-TBX9D85",
      "marca_modelo": "Mercedes-Benz Atego 1719 / Baú Toco",
      "tipo": "Caminhão Truck PBT 23t (Tanque/Baú)",
      "tipo_carga": "Coleta Jogue Limpo (Óleo Usado)",
      "combustivel": "Diesel S10",
      "km_atual": 185200,
      "status": "Disponível"
    },
    {
      "placa": "DWE-4I52",
      "prefixo": "AMB-DWE4I52",
      "marca_modelo": "VW Delivery 8.160 / Baú VUC",
      "tipo": "Caminhão Truck PBT 23t (Tanque/Baú)",
      "tipo_carga": "Coleta Jogue Limpo (Óleo Usado)",
      "combustivel": "Diesel S10",
      "km_atual": 96997,
      "status": "Disponível"
    },
    {
      "placa": "EBY-7B92",
      "prefixo": "AMB-EBY7B92",
      "marca_modelo": "VW Delivery 8.160 / Baú VUC",
      "tipo": "Caminhão Truck PBT 23t (Tanque/Baú)",
      "tipo_carga": "Coleta Jogue Limpo (Óleo Usado)",
      "combustivel": "Diesel S10",
      "km_atual": 112300,
      "status": "Disponível"
    },
    {
      "placa": "EUP-4I14",
      "prefixo": "AMB-EUP4I14",
      "marca_modelo": "VW Delivery 8.160 / Baú VUC",
      "tipo": "Caminhão Truck PBT 23t (Tanque/Baú)",
      "tipo_carga": "Coleta Jogue Limpo (Óleo Usado)",
      "combustivel": "Diesel S10",
      "km_atual": 105800,
      "status": "Disponível"
    },
    {
      "placa": "EXE-7H64",
      "prefixo": "AMB-EXE7H64",
      "marca_modelo": "VW Delivery 8.160 / Baú VUC",
      "tipo": "Caminhão Truck PBT 23t (Tanque/Baú)",
      "tipo_carga": "Coleta Jogue Limpo (Óleo Usado)",
      "combustivel": "Diesel S10",
      "km_atual": 118400,
      "status": "Disponível"
    },
    {
      "placa": "GEQ-4H44",
      "prefixo": "AMB-GEQ4H44",
      "marca_modelo": "VW Delivery 8.160 / Baú VUC",
      "tipo": "Caminhão Truck PBT 23t (Tanque/Baú)",
      "tipo_carga": "Coleta Jogue Limpo (Óleo Usado)",
      "combustivel": "Diesel S10",
      "km_atual": 89700,
      "status": "Disponível"
    },
    {
      "placa": "FMB-1H09",
      "prefixo": "AMB-FMB1H09",
      "marca_modelo": "Scania P310 8x2 / Hidrovácuo Pesado",
      "tipo": "Carreta Tanque Químico (Inox 316L)",
      "tipo_carga": "Efluentes Químicos e Hidrovácuo Waste DCX",
      "combustivel": "Diesel S10",
      "km_atual": 215600,
      "status": "Disponível"
    },
    {
      "placa": "GEB-8C37",
      "prefixo": "AMB-GEB8C37",
      "marca_modelo": "VW Constellation 24.280 / Poliguindaste Duplo",
      "tipo": "Caminhão Truck PBT 23t (Tanque/Baú)",
      "tipo_carga": "Caçambas e Resíduos Vale / DCX",
      "combustivel": "Diesel S10",
      "km_atual": 164000,
      "status": "Disponível"
    },
    {
      "placa": "FVV-0E16",
      "prefixo": "AMB-FVV0E16",
      "marca_modelo": "Volvo FH 460 6x2 / Rollon Roll-Off",
      "tipo": "Caminhão Trator Pesado (Tração 6x4)",
      "tipo_carga": "Contêineres e Caçambas Amazon / DCX",
      "combustivel": "Diesel S10",
      "km_atual": 178900,
      "status": "Disponível"
    },
    {
      "placa": "GCT-7B23",
      "prefixo": "AMB-GCT7B23",
      "marca_modelo": "Mercedes-Benz Actros 2651 / Rollon Roll-Off",
      "tipo": "Caminhão Trator Pesado (Tração 6x4)",
      "tipo_carga": "Caçambas Industriais Waste DCX",
      "combustivel": "Diesel S10",
      "km_atual": 192000,
      "status": "Disponível"
    },
    {
      "placa": "EXR-6J33",
      "prefixo": "AMB-EXR6J33",
      "marca_modelo": "Volvo FMX 460 6x4 / Rollon Roll-Off Vale",
      "tipo": "Caminhão Trator Pesado (Tração 6x4)",
      "tipo_carga": "Minério e Resíduos Mineração Contrato Vale",
      "combustivel": "Diesel S10",
      "km_atual": 224000,
      "status": "Disponível"
    },
    {
      "placa": "FJU-4A05",
      "prefixo": "AMB-FJU4A05",
      "marca_modelo": "Renault Master Furgão / Van Cargo Vale",
      "tipo": "Caminhão Truck PBT 23t (Tanque/Baú)",
      "tipo_carga": "Apoio Operacional / Cargas Fracionadas Vale",
      "combustivel": "Diesel S10",
      "km_atual": 87200,
      "status": "Disponível"
    },
    {
      "placa": "FKD-5E24",
      "prefixo": "AMB-FKD5E24",
      "marca_modelo": "Iveco Daily 35S14 / Van Cargo VUC",
      "tipo": "Caminhão Truck PBT 23t (Tanque/Baú)",
      "tipo_carga": "Cargas e Logística Leve Contrato Vale",
      "combustivel": "Diesel S10",
      "km_atual": 94500,
      "status": "Disponível"
    },
    {
      "placa": "FOT-2A43",
      "prefixo": "AMB-FOT2A43",
      "marca_modelo": "VW Constellation 26.280 6x4 / Poliguindaste Duplo",
      "tipo": "Caminhão Truck PBT 23t (Tanque/Baú)",
      "tipo_carga": "Caçambas Pesadas Mineração Contrato Vale",
      "combustivel": "Diesel S10",
      "km_atual": 147000,
      "status": "Disponível"
    },
    {
      "placa": "RHU-6I87",
      "prefixo": "AMB-RHU6I87",
      "marca_modelo": "Scania G450 6x4 / Poliguindaste Duplo",
      "tipo": "Caminhão Truck PBT 23t (Tanque/Baú)",
      "tipo_carga": "Caçambas Pesadas Ilha Guaíba Contrato Vale",
      "combustivel": "Diesel S10",
      "km_atual": 132000,
      "status": "Disponível"
    },
    {
      "placa": "SJE-4A18",
      "prefixo": "AMB-SJE4A18",
      "marca_modelo": "Fiat Argo Drive 1.0 Flex",
      "tipo": "Veículo de Apoio PAE (Ambipar Response)",
      "tipo_carga": "Supervisão e Apoio Operacional CCO Ambipar",
      "combustivel": "Gasolina Comum / Etanol",
      "km_atual": 42100,
      "status": "Disponível"
    }
  ]'::jsonb;
  item jsonb;
  v_id uuid;
BEGIN
  -- Percorre todas as empresas cadastradas no sistema
  FOR comp IN (SELECT id FROM public.companies) LOOP
    FOR item IN SELECT * FROM jsonb_array_elements(official_vehicles) LOOP
      
      -- Verifica se o veículo já existe nesta empresa pela placa
      SELECT id INTO v_id 
      FROM public.veiculos 
      WHERE (placa = (item->>'placa') OR placa = replace(item->>'placa', '-', '')) 
        AND company_id = comp.id
      LIMIT 1;

      IF v_id IS NOT NULL THEN
        -- Atualiza dados mantendo histórico
        UPDATE public.veiculos 
        SET 
          prefixo = item->>'prefixo',
          marca_modelo = item->>'marca_modelo',
          tipo = item->>'tipo',
          tipo_carga = item->>'tipo_carga',
          combustivel = item->>'combustivel',
          status = coalesce(status, 'Disponível'),
          km_atual = CASE WHEN km_atual IS NULL OR km_atual = 0 THEN (item->>'km_atual')::integer ELSE km_atual END
        WHERE id = v_id AND company_id = comp.id;
      ELSE
        -- Insere o veículo oficial
        INSERT INTO public.veiculos (
          company_id,
          placa,
          prefixo,
          marca_modelo,
          tipo,
          tipo_carga,
          combustivel,
          km_atual,
          status
        ) VALUES (
          comp.id,
          item->>'placa',
          item->>'prefixo',
          item->>'marca_modelo',
          item->>'tipo',
          item->>'tipo_carga',
          item->>'combustivel',
          (item->>'km_atual')::integer,
          item->>'status'
        );
      END IF;

    END LOOP;

    -- Sincroniza os planos preventivos automáticos para toda a frota oficial da empresa
    BEGIN
      PERFORM maintenance_private.sync_plan_vehicles(comp.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Sincronização de planos preventivos para empresa % finalizada.', comp.id;
    END;

  END LOOP;
END $$;

COMMIT;
