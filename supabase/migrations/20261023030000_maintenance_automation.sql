-- Stage 1: trusted triggers, accounting, numbering and vehicle lifecycle.
BEGIN;
CREATE TABLE maintenance_private.order_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  ano integer NOT NULL,
  ultimo bigint NOT NULL CHECK(ultimo>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  UNIQUE(company_id,ano)
);
CREATE INDEX order_counters_creator_idx ON maintenance_private.order_counters(created_by);
ALTER TABLE maintenance_private.order_counters ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON maintenance_private.order_counters FROM PUBLIC,anon,authenticated;

CREATE FUNCTION maintenance_private.prepare_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE fleet_status text; workshop_status public.partner_status; year_number integer; serial_number bigint;
        reviewer_role text; approval_limit numeric; parts numeric; labour numeric;
BEGIN
  IF NOT maintenance_private.is_provisioner() AND
     (auth.uid() IS NULL OR NOT maintenance_private.can_access_company(NEW.company_id,true)) THEN
    RAISE EXCEPTION 'No write membership for company' USING ERRCODE='42501';
  END IF;
  IF TG_OP='UPDATE' THEN
    IF ROW(NEW.numero,NEW.vehicle_id,NEW.partner_id,NEW.data_abertura) IS DISTINCT FROM ROW(OLD.numero,OLD.vehicle_id,OLD.partner_id,OLD.data_abertura) THEN
      RAISE EXCEPTION 'Order number, vehicle, partner and opening date are immutable' USING ERRCODE='23514';
    END IF;
  END IF;
  -- Serialize orders on a vehicle; fleet status changes acquire this same row lock.
  SELECT v.status INTO fleet_status FROM public.veiculos v
  WHERE v.id=NEW.vehicle_id AND v.company_id=NEW.company_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Vehicle must belong to the order company' USING ERRCODE='23503'; END IF;
  SELECT p.status INTO workshop_status FROM public.maintenance_partners p
  WHERE p.id=NEW.partner_id AND p.company_id=NEW.company_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Partner must belong to the order company' USING ERRCODE='23503'; END IF;
  IF NEW.status NOT IN ('encerrada','cancelada') AND fleet_status='Em Viagem' THEN
    RAISE EXCEPTION 'Finish the current trip before opening maintenance' USING ERRCODE='23514';
  END IF;
  IF TG_OP='INSERT' AND workshop_status<>'ativo' THEN
    RAISE EXCEPTION 'New orders require an active partner' USING ERRCODE='23514';
  END IF;
  IF TG_OP='INSERT' THEN
    year_number:=extract(year FROM NEW.data_abertura AT TIME ZONE 'America/Sao_Paulo')::integer;
    INSERT INTO maintenance_private.order_counters(company_id,ano,ultimo,created_by)
    VALUES(NEW.company_id,year_number,1,NEW.created_by)
    ON CONFLICT(company_id,ano) DO UPDATE
      SET ultimo=maintenance_private.order_counters.ultimo+1,updated_at=clock_timestamp()
    RETURNING ultimo INTO serial_number;
    NEW.numero:='OS-'||year_number::text||'-'||lpad(serial_number::text,greatest(4,length(serial_number::text)),'0');
  END IF;
  SELECT coalesce(sum(round(i.quantidade*i.valor_unitario,2)) FILTER(WHERE i.tipo='peca'),0),
         coalesce(sum(round(i.quantidade*i.valor_unitario,2)) FILTER(WHERE i.tipo='servico'),0)
  INTO parts,labour FROM public.maintenance_order_items i WHERE i.order_id=NEW.id AND i.company_id=NEW.company_id;
  NEW.valor_pecas:=parts; NEW.valor_mao_obra:=labour;
  IF NEW.orcamento_status IN ('aprovado','reprovado') AND
     (TG_OP='INSERT' OR NEW.orcamento_status IS DISTINCT FROM OLD.orcamento_status
      OR NEW.aprovado_por IS DISTINCT FROM OLD.aprovado_por OR NEW.aprovado_em IS DISTINCT FROM OLD.aprovado_em) THEN
    IF NOT maintenance_private.is_provisioner() THEN
      SELECT m.role INTO reviewer_role FROM public.company_members m
      WHERE m.company_id=NEW.company_id AND m.user_id=auth.uid() AND m.ativo;
      IF reviewer_role NOT IN ('gestor','administrador') OR reviewer_role IS NULL THEN
        RAISE EXCEPTION 'Budget decisions require gestor or administrador membership' USING ERRCODE='42501';
      END IF;
      SELECT s.limite_aprovacao_supervisor INTO approval_limit FROM public.maintenance_settings s WHERE s.company_id=NEW.company_id;
      IF NEW.orcamento_status='aprovado' AND reviewer_role='gestor' AND parts+labour>coalesce(approval_limit,5000) THEN
        RAISE EXCEPTION 'Budget exceeds supervisor approval limit' USING ERRCODE='42501';
      END IF;
      IF NEW.orcamento_status='aprovado' THEN NEW.aprovado_por:=auth.uid(); NEW.aprovado_em:=clock_timestamp(); END IF;
    END IF;
  END IF;
  IF NEW.orcamento_status<>'aprovado' THEN NEW.aprovado_por:=NULL; NEW.aprovado_em:=NULL; END IF;
  IF NEW.status='orcamento_aprovado' AND NEW.orcamento_status<>'aprovado' THEN
    RAISE EXCEPTION 'Order status requires an approved budget' USING ERRCODE='23514';
  END IF;
  IF NEW.status='encerrada' THEN
    IF EXISTS(SELECT 1 FROM public.workshop_visits v WHERE v.order_id=NEW.id AND v.company_id=NEW.company_id AND v.saida_em IS NULL) THEN
      RAISE EXCEPTION 'Record workshop departure before closing the order' USING ERRCODE='23514';
    END IF;
    IF TG_OP='INSERT' OR OLD.status<>'encerrada' THEN NEW.encerrada_em:=clock_timestamp(); ELSE NEW.encerrada_em:=OLD.encerrada_em; END IF;
  ELSE NEW.encerrada_em:=NULL;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION maintenance_private.prepare_order() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER b_maintenance_prepare BEFORE INSERT OR UPDATE ON public.maintenance_orders
FOR EACH ROW EXECUTE FUNCTION maintenance_private.prepare_order();

CREATE FUNCTION maintenance_private.partner_sla()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $$
BEGIN
  SELECT round(avg(extract(epoch FROM(o.encerrada_em-o.data_abertura))/86400)::numeric,2)
  INTO NEW.sla_medio_dias FROM public.maintenance_orders o
  WHERE o.company_id=NEW.company_id AND o.partner_id=NEW.id AND o.status='encerrada';
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION maintenance_private.partner_sla() FROM PUBLIC;
CREATE TRIGGER b_maintenance_sla BEFORE INSERT OR UPDATE ON public.maintenance_partners
FOR EACH ROW EXECUTE FUNCTION maintenance_private.partner_sla();

CREATE FUNCTION maintenance_private.timeline_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $$
BEGIN
  IF NEW.tipo_evento='mudanca_status' AND current_user NOT IN ('postgres','service_role') THEN
    RAISE EXCEPTION 'Status events are created only by the order trigger' USING ERRCODE='42501';
  END IF;
  IF NEW.tipo_evento<>'mudanca_status' AND (NEW.status_anterior IS NOT NULL OR NEW.status_novo IS NOT NULL) THEN
    RAISE EXCEPTION 'Only automatic status events may contain status fields' USING ERRCODE='23514';
  END IF;
  IF current_user NOT IN ('postgres','service_role') THEN NEW.usuario_id:=auth.uid(); END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION maintenance_private.timeline_guard() FROM PUBLIC;
CREATE TRIGGER b_maintenance_timeline BEFORE INSERT ON public.maintenance_order_timeline
FOR EACH ROW EXECUTE FUNCTION maintenance_private.timeline_guard();

CREATE FUNCTION maintenance_private.order_effects()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
BEGIN
  IF NOT maintenance_private.is_provisioner() AND
     (auth.uid() IS NULL OR NOT maintenance_private.can_access_company(NEW.company_id,true)) THEN
    RAISE EXCEPTION 'No write membership for company' USING ERRCODE='42501';
  END IF;
  IF TG_OP='INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.maintenance_order_timeline(company_id,order_id,tipo_evento,status_anterior,status_novo,descricao,usuario_id,created_by)
    VALUES(NEW.company_id,NEW.id,'mudanca_status',CASE WHEN TG_OP='UPDATE' THEN OLD.status END,NEW.status,
      CASE WHEN TG_OP='INSERT' THEN 'OS aberta: ' ELSE 'Status alterado: ' END||NEW.status::text,
      coalesce(auth.uid(),NEW.created_by),coalesce(auth.uid(),NEW.created_by));
  END IF;
  IF TG_OP='UPDATE' AND NEW.orcamento_status IS DISTINCT FROM OLD.orcamento_status THEN
    INSERT INTO public.maintenance_order_timeline(company_id,order_id,tipo_evento,descricao,usuario_id,created_by)
    VALUES(NEW.company_id,NEW.id,'aprovacao','Orçamento: '||NEW.orcamento_status,coalesce(auth.uid(),NEW.created_by),coalesce(auth.uid(),NEW.created_by));
  END IF;
  IF EXISTS(SELECT 1 FROM public.maintenance_orders o WHERE o.company_id=NEW.company_id AND o.vehicle_id=NEW.vehicle_id AND o.status NOT IN ('encerrada','cancelada')) THEN
    UPDATE public.veiculos SET status='Manutenção'
    WHERE id=NEW.vehicle_id AND company_id=NEW.company_id AND status<>'Bloqueado' AND status<>'Manutenção';
  ELSE
    UPDATE public.veiculos SET status='Disponível'
    WHERE id=NEW.vehicle_id AND company_id=NEW.company_id AND status='Manutenção';
  END IF;
  -- prepare_order has already locked this partner, so concurrent closures serialize.
  UPDATE public.maintenance_partners SET updated_at=clock_timestamp() WHERE id=NEW.partner_id AND company_id=NEW.company_id;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION maintenance_private.order_effects() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER c_maintenance_effects AFTER INSERT OR UPDATE ON public.maintenance_orders
FOR EACH ROW EXECUTE FUNCTION maintenance_private.order_effects();

CREATE FUNCTION maintenance_private.prevent_dispatch()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $$
BEGIN
  IF NEW.status IN ('Disponível','Em Viagem') AND EXISTS(
    SELECT 1 FROM public.maintenance_orders o WHERE o.company_id=NEW.company_id AND o.vehicle_id=NEW.id AND o.status NOT IN ('encerrada','cancelada')
  ) THEN RAISE EXCEPTION 'Vehicle has an active maintenance order and cannot be released or dispatched' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION maintenance_private.prevent_dispatch() FROM PUBLIC;
CREATE TRIGGER maintenance_prevent_dispatch BEFORE UPDATE OF status ON public.veiculos
FOR EACH ROW EXECUTE FUNCTION maintenance_private.prevent_dispatch();

CREATE FUNCTION maintenance_private.items_lock()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $$
DECLARE target_company uuid; target_order uuid; parent_status public.order_status;
BEGIN
  IF TG_OP='DELETE' THEN target_company:=OLD.company_id; target_order:=OLD.order_id;
  ELSE target_company:=NEW.company_id; target_order:=NEW.order_id;
  END IF;
  IF TG_OP='UPDATE' AND NEW.order_id IS DISTINCT FROM OLD.order_id THEN
    RAISE EXCEPTION 'Items cannot move to another order' USING ERRCODE='23514';
  END IF;
  SELECT o.status INTO parent_status FROM public.maintenance_orders o WHERE o.company_id=target_company AND o.id=target_order FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order unavailable in this company' USING ERRCODE='23503'; END IF;
  IF parent_status IN ('encerrada','cancelada') THEN RAISE EXCEPTION 'Closed orders cannot change items' USING ERRCODE='23514'; END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION maintenance_private.items_lock() FROM PUBLIC;
CREATE TRIGGER b_maintenance_items_lock BEFORE INSERT OR UPDATE OR DELETE ON public.maintenance_order_items
FOR EACH ROW EXECUTE FUNCTION maintenance_private.items_lock();

CREATE FUNCTION maintenance_private.items_totals()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $$
DECLARE target_company uuid; target_order uuid;
BEGIN
  IF TG_OP='DELETE' THEN target_company:=OLD.company_id; target_order:=OLD.order_id;
  ELSE target_company:=NEW.company_id; target_order:=NEW.order_id;
  END IF;
  UPDATE public.maintenance_orders SET
    orcamento_status='pendente',aprovado_por=NULL,aprovado_em=NULL,
    status=CASE WHEN status='orcamento_aprovado' THEN 'aguardando_orcamento'::public.order_status ELSE status END,
    updated_at=clock_timestamp()
  WHERE company_id=target_company AND id=target_order;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION maintenance_private.items_totals() FROM PUBLIC;
CREATE TRIGGER c_maintenance_items_totals AFTER INSERT OR UPDATE OR DELETE ON public.maintenance_order_items
FOR EACH ROW EXECUTE FUNCTION maintenance_private.items_totals();

CREATE FUNCTION maintenance_private.actor_and_paths()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $$
DECLARE photo text;
BEGIN
  IF TG_TABLE_NAME='workshop_visits' THEN
    PERFORM 1 FROM public.maintenance_orders o
    WHERE o.id=NEW.order_id AND o.company_id=NEW.company_id AND o.status NOT IN ('encerrada','cancelada') FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Workshop visits require an active order' USING ERRCODE='23514'; END IF;
    IF NOT maintenance_private.is_provisioner() THEN NEW.registrado_por:=auth.uid(); END IF;
  ELSIF TG_TABLE_NAME IN ('maintenance_messages','maintenance_attachments') THEN
    IF NOT maintenance_private.is_provisioner() THEN NEW.enviado_por:=auth.uid(); END IF;
    IF TG_TABLE_NAME='maintenance_messages' AND NOT EXISTS (
      SELECT 1 FROM public.maintenance_orders o WHERE o.id=NEW.order_id AND o.company_id=NEW.company_id AND o.partner_id=NEW.partner_id
    ) THEN RAISE EXCEPTION 'Message partner must match the order partner' USING ERRCODE='23514'; END IF;
  ELSIF TG_TABLE_NAME='vehicle_occurrences' THEN
    FOREACH photo IN ARRAY NEW.fotos LOOP
      IF photo IS NULL OR photo NOT LIKE NEW.company_id::text||'/%' THEN
        RAISE EXCEPTION 'Photos must use a company-scoped private Storage path' USING ERRCODE='23514';
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME='maintenance_settings' THEN
    IF NOT maintenance_private.is_provisioner() AND NOT EXISTS(
      SELECT 1 FROM public.company_members m WHERE m.company_id=NEW.company_id AND m.user_id=auth.uid() AND m.ativo AND m.role='administrador'
    ) THEN RAISE EXCEPTION 'Only a company administrator can change maintenance settings' USING ERRCODE='42501'; END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION maintenance_private.actor_and_paths() FROM PUBLIC;
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['workshop_visits','maintenance_messages','maintenance_attachments','vehicle_occurrences','maintenance_settings'] LOOP
    EXECUTE format('CREATE TRIGGER b_maintenance_actor BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION maintenance_private.actor_and_paths()',t);
  END LOOP;
END $$;
-- Settings deletion would otherwise restore the default approval limit.
CREATE POLICY maintenance_settings_admin_delete ON public.maintenance_settings AS RESTRICTIVE FOR DELETE TO authenticated
USING (EXISTS(SELECT 1 FROM public.company_members m WHERE m.company_id=maintenance_settings.company_id AND m.user_id=(SELECT auth.uid()) AND m.ativo AND m.role='administrador'));
COMMIT;
