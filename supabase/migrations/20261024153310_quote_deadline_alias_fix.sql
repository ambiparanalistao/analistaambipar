BEGIN;
DO $$ DECLARE def text;BEGIN
 SELECT pg_get_functiondef('maintenance_private.order_dispatch_command(uuid,text,jsonb)'::regprocedure) INTO def;
 def:=replace(def,'p.onboarding_profile','quote_partner.onboarding_profile');
 def:=replace(def,'FROM public.maintenance_partners p WHERE p.id=(b->>''partner_id'')::uuid AND p.company_id=c','FROM public.maintenance_partners quote_partner WHERE quote_partner.id=(b->>''partner_id'')::uuid AND quote_partner.company_id=c');
 EXECUTE def;
END $$;
COMMIT;
