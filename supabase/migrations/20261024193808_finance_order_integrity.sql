BEGIN;
CREATE FUNCTION maintenance_private.finance_order_integrity() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$ BEGIN
IF (NEW.status='cancelada' AND OLD.status<>'cancelada' OR NEW.partner_id IS DISTINCT FROM OLD.partner_id) AND EXISTS(SELECT 1 FROM public.maintenance_finance_invoices i WHERE i.order_id=OLD.id AND i.company_id=OLD.company_id AND i.status<>'cancelada') THEN RAISE EXCEPTION 'Esta S.OR possui notas fiscais ativas. Trate e cancele as notas no financeiro antes de cancelar a S.OR ou trocar a oficina.' USING ERRCODE='23514';END IF;RETURN NEW;END $$;
REVOKE ALL ON FUNCTION maintenance_private.finance_order_integrity() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER zz_finance_order_integrity BEFORE UPDATE OF status,partner_id ON public.maintenance_orders FOR EACH ROW EXECUTE FUNCTION maintenance_private.finance_order_integrity();
COMMIT;
