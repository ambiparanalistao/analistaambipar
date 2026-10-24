BEGIN;
DO $$ DECLARE def text;original text;BEGIN
 SELECT pg_get_functiondef('maintenance_private.order_dispatch_command(uuid,text,jsonb)'::regprocedure) INTO def;
 original:='UPDATE public.maintenance_orders SET partner_id=(b->>''partner_id'')::uuid WHERE id=o.id RETURNING * INTO o;';
 IF position(original in def)=0 THEN RAISE EXCEPTION 'Expected workshop choice statement not found';END IF;
 def:=replace(def,original,$new$UPDATE public.maintenance_orders SET partner_id=(b->>'partner_id')::uuid,prazo_entrega_dias=(SELECT CASE WHEN p.onboarding_profile->>'prazo_entrega_dias' ~ '^[0-9]{1,4}$' THEN CASE WHEN (p.onboarding_profile->>'prazo_entrega_dias')::integer BETWEEN 1 AND 3650 THEN (p.onboarding_profile->>'prazo_entrega_dias')::integer END END FROM public.maintenance_partners p WHERE p.id=(b->>'partner_id')::uuid AND p.company_id=c),previsao_entrega=NULL WHERE id=o.id RETURNING * INTO o;$new$);EXECUTE def;
END $$;
COMMIT;
