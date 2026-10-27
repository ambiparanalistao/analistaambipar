BEGIN;

-- ==============================================================================
-- Migration: 20261027160000_order_delete_feature.sql
-- Objetivo: Suporte a exclusão de S.D.O e limpeza de dependências vinculadas
-- ==============================================================================

-- 1. Função privada com permissões elevadas para excluir S.D.O e suas dependências
CREATE OR REPLACE FUNCTION maintenance_private.order_delete(c uuid, target_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
  actor uuid := auth.uid();
  o public.maintenance_orders;
  r text;
  full_access boolean;
  veh_id uuid;
BEGIN
  IF actor IS NULL OR NOT maintenance_private.partner_access(c) THEN
    RAISE EXCEPTION 'Sem acesso à empresa.' USING ERRCODE='42501';
  END IF;

  SELECT coalesce(m.maintenance_role, CASE m.role WHEN 'administrador' THEN 'admin_empresa' WHEN 'analista' THEN 'analista_transporte' WHEN 'gestor' THEN 'supervisor' ELSE 'operador_logistico' END)
  INTO r FROM public.company_members m WHERE m.company_id=c AND m.user_id=actor AND m.ativo FOR SHARE;

  full_access := r IN ('admin_geral','admin_empresa','analista_transporte');
  IF NOT (full_access OR r = 'supervisor') THEN
    RAISE EXCEPTION 'Exclusão da S.D.O não autorizada para o seu perfil.' USING ERRCODE='42501';
  END IF;

  SELECT * INTO o FROM public.maintenance_orders WHERE id=target_id AND company_id=c FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'S.D.O não encontrada nesta empresa.' USING ERRCODE='42501';
  END IF;

  veh_id := o.vehicle_id;

  -- 1. Remove dependências vinculadas à S.D.O
  DELETE FROM public.maintenance_partner_quotes WHERE order_id = o.id AND company_id = c;
  DELETE FROM public.maintenance_order_dispatches WHERE order_id = o.id AND company_id = c;
  DELETE FROM public.maintenance_order_timeline WHERE order_id = o.id AND company_id = c;
  DELETE FROM public.maintenance_order_items WHERE order_id = o.id AND company_id = c;
  DELETE FROM public.workshop_visits WHERE order_id = o.id AND company_id = c;
  DELETE FROM public.maintenance_messages WHERE order_id = o.id AND company_id = c;
  DELETE FROM public.maintenance_plan_orders WHERE order_id = o.id AND company_id = c;
  DELETE FROM public.maintenance_attachments WHERE order_id = o.id AND company_id = c;
  DELETE FROM public.maintenance_invoice_requests WHERE order_id = o.id AND company_id = c;

  -- Desvincula de relatórios de motoristas caso existam
  UPDATE public.maintenance_driver_reports SET order_id = NULL WHERE order_id = o.id AND company_id = c;

  -- 2. Exclui a ordem de serviço
  DELETE FROM public.maintenance_orders WHERE id = o.id AND company_id = c;

  -- 3. Se o veículo não tem outras ordens ativas e estava em manutenção, libera o veículo
  IF veh_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.maintenance_orders 
      WHERE company_id = c AND vehicle_id = veh_id AND status NOT IN ('encerrada','cancelada')
    ) THEN
      UPDATE public.veiculos SET status = 'Disponível' WHERE id = veh_id AND company_id = c AND status = 'Manutenção';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_id', o.id,
    'numero', o.numero
  );
END;
$$;

REVOKE ALL ON FUNCTION maintenance_private.order_delete(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION maintenance_private.order_delete(uuid,uuid) TO authenticated;

-- 2. Exposição via RPC pública autenticada
CREATE OR REPLACE FUNCTION public.maintenance_order_delete(target_company uuid, order_id uuid)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
  SELECT maintenance_private.order_delete(target_company, order_id);
$$;

REVOKE ALL ON FUNCTION public.maintenance_order_delete(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.maintenance_order_delete(uuid,uuid) TO authenticated;

-- 3. Concede DELETE explícito aos usuários autenticados para permitir exclusão direta caso a política RLS exija
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'maintenance_orders' AND policyname = 'maintenance_delete'
  ) THEN
    CREATE POLICY maintenance_delete ON public.maintenance_orders FOR DELETE TO authenticated
    USING (
      company_id IN (
        SELECT company_id FROM public.company_members 
        WHERE user_id = auth.uid() AND ativo AND role IN ('administrador','analista')
      )
    );
  END IF;
END $$;

GRANT DELETE ON public.maintenance_orders TO authenticated;
GRANT DELETE ON public.maintenance_order_items TO authenticated;
GRANT DELETE ON public.maintenance_order_timeline TO authenticated;
GRANT DELETE ON public.maintenance_attachments TO authenticated;
GRANT DELETE ON public.workshop_visits TO authenticated;

COMMIT;
