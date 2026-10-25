BEGIN;

CREATE OR REPLACE FUNCTION maintenance_private.can_view_profile(target_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT target_user = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.company_members AS viewer
      JOIN public.company_members AS subject
        ON subject.company_id = viewer.company_id
       AND subject.user_id = target_user
       AND subject.ativo
      JOIN public.companies AS company
        ON company.id = viewer.company_id
       AND company.ativo
      WHERE viewer.user_id = (SELECT auth.uid())
        AND viewer.ativo
    );
$$;

REVOKE ALL ON FUNCTION maintenance_private.can_view_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION maintenance_private.can_view_profile(uuid) TO authenticated;

DROP POLICY IF EXISTS "Usuários podem visualizar qualquer perfil autenticado" ON public.profiles;
DROP POLICY IF EXISTS profiles_company_select ON public.profiles;
CREATE POLICY profiles_company_select
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (maintenance_private.can_view_profile(id));

COMMIT;
