-- Restringe funções internas SECURITY DEFINER que não devem ser chamadas via RPC.
BEGIN;
ALTER FUNCTION public.handle_new_user() SET search_path = pg_catalog;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated, service_role;
ALTER FUNCTION public.rls_auto_enable() SET search_path = pg_catalog;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated, service_role;
COMMIT;
