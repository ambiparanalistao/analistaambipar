BEGIN;

-- ==============================================================================
-- Migration: 20261027170000_vehicle_delete_feature.sql
-- Objetivo: Suporte robusto à exclusão de veículos com desvinculação em cascata
--           de planos preventivos automáticos, histórico, dossiê e checklists
-- ==============================================================================

-- 1. Função privada com SECURITY DEFINER para exclusão do veículo e desvinculação limpa
CREATE OR REPLACE FUNCTION maintenance_private.vehicle_delete(c uuid, target_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
  actor uuid := auth.uid();
  v public.veiculos;
  r text;
  full_access boolean;
BEGIN
  IF actor IS NULL OR NOT maintenance_private.partner_access(c) THEN
    RAISE EXCEPTION 'Sem acesso à empresa.' USING ERRCODE='42501';
  END IF;

  SELECT coalesce(m.maintenance_role, CASE m.role WHEN 'administrador' THEN 'admin_empresa' WHEN 'analista' THEN 'analista_transporte' WHEN 'gestor' THEN 'supervisor' ELSE 'operador_logistico' END)
  INTO r FROM public.company_members m WHERE m.company_id=c AND m.user_id=actor AND m.ativo FOR SHARE;

  full_access := r IN ('admin_geral','admin_empresa','analista_transporte');
  IF NOT (full_access OR r = 'supervisor') THEN
    RAISE EXCEPTION 'Exclusão de veículos não autorizada para o seu perfil.' USING ERRCODE='42501';
  END IF;

  SELECT * INTO v FROM public.veiculos WHERE id=target_id AND company_id=c FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Veículo não encontrado nesta empresa.' USING ERRCODE='42501';
  END IF;

  -- 1. Configurações de preventivas personalizadas
  IF to_regclass('public.vehicle_preventive_settings') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.vehicle_preventive_settings WHERE vehicle_id = $1 AND company_id = $2'
    USING v.id, c;
  END IF;

  -- 2. Ordens de planos preventivos associadas aos planos deste veículo
  IF to_regclass('public.maintenance_plan_orders') IS NOT NULL AND to_regclass('public.maintenance_plan_vehicles') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.maintenance_plan_orders WHERE plan_vehicle_id IN (SELECT id FROM public.maintenance_plan_vehicles WHERE vehicle_id = $1 AND company_id = $2)'
    USING v.id, c;
  END IF;

  -- 3. Vínculos do veículo com planos de manutenção
  IF to_regclass('public.maintenance_plan_vehicles') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.maintenance_plan_vehicles WHERE vehicle_id = $1 AND company_id = $2'
    USING v.id, c;
  END IF;

  -- 4. Planos de manutenção vinculados exclusivamente a este veículo
  IF to_regclass('public.maintenance_plans') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.maintenance_plans WHERE vehicle_id = $1 AND company_id = $2'
    USING v.id, c;
  END IF;

  -- 5. Tabelas do Dossiê do Veículo
  IF to_regclass('public.maintenance_vehicle_preferences') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.maintenance_vehicle_preferences WHERE vehicle_id = $1 AND company_id = $2'
    USING v.id, c;
  END IF;

  IF to_regclass('public.maintenance_driver_bindings') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.maintenance_driver_bindings WHERE vehicle_id = $1 AND company_id = $2'
    USING v.id, c;
  END IF;

  IF to_regclass('public.maintenance_vehicle_events') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.maintenance_vehicle_events WHERE vehicle_id = $1 AND company_id = $2'
    USING v.id, c;
  END IF;

  IF to_regclass('public.maintenance_allocations') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.maintenance_allocations WHERE vehicle_id = $1 AND company_id = $2'
    USING v.id, c;
  END IF;

  -- 6. Ocorrências do veículo
  IF to_regclass('public.vehicle_occurrences') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.vehicle_occurrences WHERE vehicle_id = $1 AND company_id = $2'
    USING v.id, c;
  END IF;

  -- 7. Checklists do veículo
  IF to_regclass('public.maintenance_checklists') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.maintenance_checklists WHERE vehicle_id = $1 AND company_id = $2'
    USING v.id, c;
  END IF;

  -- 8. Ativos (Pneus / Implementos) instalados no veículo: desvincula e retorna ao estoque
  IF to_regclass('public.maintenance_asset_events') IS NOT NULL THEN
    EXECUTE 'UPDATE public.maintenance_asset_events SET vehicle_id = NULL, position = NULL WHERE vehicle_id = $1 AND company_id = $2'
    USING v.id, c;
  END IF;

  IF to_regclass('public.maintenance_assets') IS NOT NULL THEN
    EXECUTE 'UPDATE public.maintenance_assets SET vehicle_id = NULL, status = ''estoque'', position = NULL WHERE vehicle_id = $1 AND company_id = $2'
    USING v.id, c;
  END IF;

  -- 9. Relatórios de motoristas (desvincula FK vehicle_id preservando o chamado histórico)
  IF to_regclass('public.maintenance_driver_reports') IS NOT NULL THEN
    EXECUTE 'UPDATE public.maintenance_driver_reports SET vehicle_id = NULL WHERE vehicle_id = $1 AND company_id = $2'
    USING v.id, c;
  END IF;

  -- 10. Visitas de oficina (desvincula FK vehicle_id)
  IF to_regclass('public.workshop_visits') IS NOT NULL THEN
    EXECUTE 'UPDATE public.workshop_visits SET vehicle_id = NULL WHERE vehicle_id = $1 AND company_id = $2'
    USING v.id, c;
  END IF;

  -- 11. Ordens de serviço (desvincula FK vehicle_id preservando faturamento e histórico)
  IF to_regclass('public.maintenance_orders') IS NOT NULL THEN
    EXECUTE 'UPDATE public.maintenance_orders SET vehicle_id = NULL WHERE vehicle_id = $1 AND company_id = $2'
    USING v.id, c;
  END IF;

  -- 12. Infrações e transações de combustível
  IF to_regclass('public.vehicle_infractions') IS NOT NULL THEN
    EXECUTE 'UPDATE public.vehicle_infractions SET vehicle_id = NULL WHERE vehicle_id = $1 AND company_id = $2'
    USING v.id, c;
  END IF;

  IF to_regclass('public.fuel_transactions') IS NOT NULL THEN
    EXECUTE 'UPDATE public.fuel_transactions SET vehicle_id = NULL WHERE vehicle_id = $1 AND company_id = $2'
    USING v.id, c;
  END IF;

  IF to_regclass('public.fuel_provision_vehicles') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.fuel_provision_vehicles WHERE vehicle_id = $1 AND company_id = $2'
    USING v.id, c;
  END IF;

  -- 13. Desvincula condutor associado
  UPDATE public.motoristas 
  SET veiculo_vinculado = NULL 
  WHERE company_id = c 
    AND (veiculo_vinculado = v.placa OR veiculo_vinculado ILIKE (v.placa || '%'));

  -- 14. Exclui o veículo definitivamente
  DELETE FROM public.veiculos WHERE id = v.id AND company_id = c;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_id', v.id,
    'placa', v.placa
  );
END;
$$;

REVOKE ALL ON FUNCTION maintenance_private.vehicle_delete(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION maintenance_private.vehicle_delete(uuid,uuid) TO authenticated;

-- 2. Exposição via RPC pública autenticada
CREATE OR REPLACE FUNCTION public.maintenance_vehicle_delete(target_company uuid, vehicle_id uuid)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
  SELECT maintenance_private.vehicle_delete(target_company, vehicle_id);
$$;

REVOKE ALL ON FUNCTION public.maintenance_vehicle_delete(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.maintenance_vehicle_delete(uuid,uuid) TO authenticated;

-- 3. Concede política permissiva de DELETE em public.veiculos caso RLS esteja ativo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'veiculos' AND policyname = 'veiculos_delete_company_allow'
  ) THEN
    CREATE POLICY veiculos_delete_company_allow ON public.veiculos FOR DELETE TO authenticated
    USING (
      company_id IN (
        SELECT company_id FROM public.company_members 
        WHERE user_id = auth.uid() AND ativo AND role IN ('administrador','analista','gestor')
      )
    );
  END IF;
END $$;

GRANT DELETE ON public.veiculos TO authenticated;

-- 4. Corrige a constraint de chave estrangeira em fuel_transactions para anular apenas vehicle_id
DO $$
DECLARE
  c_name text;
BEGIN
  IF to_regclass('public.fuel_transactions') IS NOT NULL THEN
    FOR c_name IN (
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'public.fuel_transactions'::regclass 
        AND confrelid = 'public.veiculos'::regclass
    ) LOOP
      EXECUTE format('ALTER TABLE public.fuel_transactions DROP CONSTRAINT %I', c_name);
    END LOOP;

    ALTER TABLE public.fuel_transactions
      ADD CONSTRAINT fuel_transactions_vehicle_fk 
      FOREIGN KEY(vehicle_id, company_id) 
      REFERENCES public.veiculos(id, company_id) 
      ON DELETE SET NULL (vehicle_id);
  END IF;
END $$;

COMMIT;
