BEGIN;
DO $$ DECLARE def text;old_guard text;BEGIN
SELECT pg_get_functiondef('maintenance_private.order_dispatch_command(uuid,text,jsonb)'::regprocedure) INTO def;
old_guard:=$old$IF d.status<>'accepted' AND NOT maintenance_private.quote_partner_matches(c,d.recipient_partner_id,o.quote_partner_types) THEN UPDATE public.maintenance_order_dispatches SET status='obsolete',error_message='A oficina não tem o tipo marcado nos filtros selecionados.',updated_at=clock_timestamp() WHERE id=d.id;RETURN jsonb_build_object('status','obsolete','error','A oficina não corresponde aos filtros marcados. Nenhum envio realizado.');END IF;$old$;
IF position(old_guard in def)=0 THEN RAISE EXCEPTION 'Expected quote recipient guard not found';END IF;
def:=replace(def,old_guard,$new$IF d.status<>'accepted' AND NOT maintenance_private.quote_partner_matches(c,d.recipient_partner_id,o.quote_partner_types) THEN
IF d.status NOT IN ('unknown','sending') THEN UPDATE public.maintenance_order_dispatches SET status='obsolete',error_message='A oficina não tem o tipo marcado nos filtros selecionados.',updated_at=clock_timestamp() WHERE id=d.id;END IF;
RETURN jsonb_build_object('status',CASE WHEN d.status IN ('unknown','sending') THEN d.status ELSE 'obsolete' END,'error','A oficina não corresponde aos filtros marcados. Nenhum envio realizado.');END IF;$new$);EXECUTE def;
END $$;
COMMIT;
