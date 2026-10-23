-- Stage 1: private file storage. Object keys start with <company_uuid>/.
BEGIN;
INSERT INTO storage.buckets(id,name,public) VALUES('maintenance','maintenance',false)
ON CONFLICT(id) DO NOTHING;
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM storage.buckets WHERE id='maintenance' AND public) THEN
    RAISE EXCEPTION 'Existing maintenance bucket is public. Review its contents and make it private before applying this migration.';
  END IF;
END $$;

CREATE FUNCTION maintenance_private.storage_access(object_name text, writing boolean DEFAULT false)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path=''
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.company_members m
    WHERE m.company_id::text=split_part(object_name,'/',1)
      AND m.user_id=(SELECT auth.uid()) AND m.ativo
      AND length(split_part(object_name,'/',2))>0
      AND (NOT writing OR m.role IN ('analista','gestor','administrador'))
  );
$$;
REVOKE ALL ON FUNCTION maintenance_private.storage_access(text,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION maintenance_private.storage_access(text,boolean) TO authenticated,service_role;

CREATE POLICY maintenance_storage_read ON storage.objects FOR SELECT TO authenticated
USING(bucket_id='maintenance' AND maintenance_private.storage_access(name));
CREATE POLICY maintenance_storage_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK(bucket_id='maintenance' AND maintenance_private.storage_access(name,true));
CREATE POLICY maintenance_storage_update ON storage.objects FOR UPDATE TO authenticated
USING(bucket_id='maintenance' AND maintenance_private.storage_access(name,true))
WITH CHECK(bucket_id='maintenance' AND maintenance_private.storage_access(name,true));
CREATE POLICY maintenance_storage_delete ON storage.objects FOR DELETE TO authenticated
USING(bucket_id='maintenance' AND maintenance_private.storage_access(name,true));

-- Restrictive guards also protect this bucket against unrelated broad Storage policies.
CREATE POLICY maintenance_storage_read_boundary ON storage.objects AS RESTRICTIVE FOR SELECT TO authenticated
USING(bucket_id<>'maintenance' OR maintenance_private.storage_access(name));
CREATE POLICY maintenance_storage_insert_boundary ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK(bucket_id<>'maintenance' OR maintenance_private.storage_access(name,true));
CREATE POLICY maintenance_storage_update_boundary ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
USING(bucket_id<>'maintenance' OR maintenance_private.storage_access(name,true))
WITH CHECK(bucket_id<>'maintenance' OR maintenance_private.storage_access(name,true));
CREATE POLICY maintenance_storage_delete_boundary ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
USING(bucket_id<>'maintenance' OR maintenance_private.storage_access(name,true));
CREATE POLICY maintenance_storage_no_anon ON storage.objects AS RESTRICTIVE FOR ALL TO anon
USING(bucket_id<>'maintenance') WITH CHECK(bucket_id<>'maintenance');
COMMIT;
