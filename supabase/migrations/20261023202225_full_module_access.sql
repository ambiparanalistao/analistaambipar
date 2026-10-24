BEGIN;
-- Preserve job profiles; explicitly grant all module actions to company members.
ALTER TABLE public.company_members ADD COLUMN full_module_access boolean NOT NULL DEFAULT true;
COMMENT ON COLUMN public.company_members.full_module_access IS 'Full operational module access within this membership company; does not grant user provisioning or cross-company access.';
CREATE FUNCTION maintenance_private.module_role(member public.company_members) RETURNS text LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT CASE WHEN member.full_module_access THEN 'admin_empresa' ELSE coalesce(member.maintenance_role,CASE member.role WHEN 'administrador' THEN 'admin_empresa' WHEN 'analista' THEN 'analista_transporte' WHEN 'gestor' THEN 'supervisor' ELSE 'operador_logistico' END) END;
$$;
REVOKE ALL ON FUNCTION maintenance_private.module_role(public.company_members) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION maintenance_private.module_role(public.company_members) TO authenticated,service_role;
-- Update only module authorization expressions, leaving identity-based driver bindings intact.
DO $upgrade$
DECLARE f record;definition text;updated text;expression text:='coalesce\(([a-z_]+)\.maintenance_role,[[:space:]]*CASE[^()]*END\)';
BEGIN
 FOR f IN SELECT p.oid,p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='maintenance_private' AND p.proname IN ('partner_access','order_command','prepare_order','communication_command','storage_access_stage3','vehicle_command') LOOP
 definition:=pg_get_functiondef(f.oid);
 updated:=regexp_replace(definition,expression,'maintenance_private.module_role(\1)','gi');
 IF updated=definition THEN RAISE EXCEPTION 'Expected module role expression in %',f.proname;END IF;
 IF f.proname='vehicle_command' THEN
 updated:=replace(updated,'IF action=''driver'' THEN','IF action=''driver'' AND member.maintenance_role=''motorista'' THEN r:=''motorista'';END IF; IF action=''driver'' THEN');
 END IF;
 EXECUTE updated;
 END LOOP;
END $upgrade$;
CREATE OR REPLACE FUNCTION maintenance_private.can_access_company(target uuid,writing boolean DEFAULT false) RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.company_members m JOIN public.companies c ON c.id=m.company_id AND c.ativo WHERE m.company_id=target AND m.user_id=(SELECT auth.uid()) AND m.ativo AND (NOT writing OR m.full_module_access OR m.role IN ('analista','gestor','administrador')));
$$;
CREATE OR REPLACE FUNCTION maintenance_private.is_limited_actor() RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.company_members WHERE user_id=auth.uid() AND ativo AND maintenance_role IN ('motorista','cliente'))
 AND NOT EXISTS(SELECT 1 FROM public.company_members m WHERE m.user_id=auth.uid() AND m.ativo AND maintenance_private.module_role(m) IN ('admin_geral','admin_empresa','analista_transporte','supervisor','operador_logistico'));
$$;
-- Repair pre-existing accounts with no company ONLY when the project has one active company.
-- No inactive membership is reactivated; no automatic enrollment for future public signups.
DO $repair$ DECLARE sole public.companies;BEGIN
 IF (SELECT count(*) FROM public.companies WHERE ativo)=1 THEN
 SELECT * INTO sole FROM public.companies WHERE ativo;
 INSERT INTO public.company_members(company_id,user_id,role,maintenance_role,full_module_access,created_by)
 SELECT sole.id,u.id,'analista',CASE WHEN p.role IN ('motorista','cliente') THEN p.role ELSE 'analista_transporte' END,true,sole.created_by
 FROM auth.users u LEFT JOIN public.profiles p ON p.id=u.id
 WHERE NOT coalesce((to_jsonb(u)->>'is_anonymous')::boolean,false)
 AND to_jsonb(u)->>'deleted_at' IS NULL
 AND (nullif(to_jsonb(u)->>'banned_until','')::timestamptz IS NULL OR (to_jsonb(u)->>'banned_until')::timestamptz<now())
 AND NOT EXISTS(SELECT 1 FROM public.company_members m WHERE m.user_id=u.id)
 ON CONFLICT(company_id,user_id) DO NOTHING;
 END IF;
END $repair$;
INSERT INTO public.maintenance_analytics_audit(company_id,actor_id,action,snapshot)
 SELECT c.id,c.created_by,'module_access_released',jsonb_build_object('scope','all_operational_modules','active_members',(SELECT count(*) FROM public.company_members m WHERE m.company_id=c.id AND m.ativo AND m.full_module_access)) FROM public.companies c WHERE c.ativo;
COMMIT;
