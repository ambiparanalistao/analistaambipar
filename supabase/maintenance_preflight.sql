-- READ-ONLY: inspect before applying the stage 1 migrations.
SELECT table_name,column_name,data_type,is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name IN ('veiculos','motoristas','profiles','companies','company_members')
ORDER BY table_name,ordinal_position;
SELECT schemaname,tablename,policyname,roles,cmd,qual,with_check
FROM pg_policies WHERE schemaname IN ('public','storage') ORDER BY schemaname,tablename,policyname;
SELECT n.nspname AS schema_name,t.typname,e.enumlabel
FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace JOIN pg_enum e ON e.enumtypid=t.oid
WHERE n.nspname='public' AND t.typname IN ('partner_type','partner_status','maintenance_type','priority_level','order_status','occurrence_severity')
ORDER BY t.typname,e.enumsortorder;
SELECT 'veiculos' AS tabela,count(*) AS registros FROM public.veiculos
UNION ALL SELECT 'motoristas',count(*) FROM public.motoristas;
SELECT id,name,public FROM storage.buckets WHERE id='maintenance';
