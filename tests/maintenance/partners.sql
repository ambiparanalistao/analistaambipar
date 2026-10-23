-- Execute only in the disposable PostgreSQL fixture created by CI.
BEGIN;
CREATE SCHEMA partner_test;
CREATE FUNCTION partner_test.assert(ok boolean,msg text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'ASSERTION: %',msg; END IF; END $$;
CREATE FUNCTION partner_test.expect_error(command text, expected_state text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE actual text;
BEGIN
  BEGIN EXECUTE command;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS actual=RETURNED_SQLSTATE;
    IF actual<>expected_state THEN RAISE EXCEPTION 'Expected %, got % for %',expected_state,actual,command; END IF;
    RETURN;
  END;
  RAISE EXCEPTION 'Expected error % but command succeeded: %',expected_state,command;
END $$;
GRANT USAGE ON SCHEMA partner_test TO authenticated,anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA partner_test TO authenticated,anon;

INSERT INTO auth.users(id,email)
SELECT ('22000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'partner-'||n||'@example.invalid' FROM generate_series(1,7)n;
INSERT INTO public.companies(id,nome,created_by) VALUES('12000000-0000-4000-8000-000000000001','Partner fixture','22000000-0000-4000-8000-000000000001'),('12000000-0000-4000-8000-000000000002','Other fixture','22000000-0000-4000-8000-000000000001');
INSERT INTO public.company_members(company_id,user_id,role,maintenance_role,created_by)
SELECT '12000000-0000-4000-8000-000000000001',('22000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,CASE WHEN n=1 THEN 'auditor' ELSE 'administrador' END,
(ARRAY['admin_geral','admin_empresa','analista_transporte','supervisor','operador_logistico','motorista','cliente'])[n],'22000000-0000-4000-8000-000000000001' FROM generate_series(1,7)n;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000001',true);
INSERT INTO public.maintenance_partners(id,company_id,razao_social,cnpj_cpf) VALUES('42000000-0000-4000-8000-000000000001','12000000-0000-4000-8000-000000000001','Parceiro teste','11222333000181');
SELECT partner_test.assert((SELECT version=1 FROM public.maintenance_partners),'version initialized');
SELECT partner_test.assert((SELECT count(*)=1 FROM public.maintenance_partner_audit WHERE acao='criacao'),'create audit');
UPDATE public.maintenance_partners SET status='bloqueado',motivo_bloqueio='Contrato suspenso' WHERE id='42000000-0000-4000-8000-000000000001' AND version=1;
SELECT partner_test.assert((SELECT version=2 FROM public.maintenance_partners),'optimistic update version');
SELECT partner_test.assert((SELECT count(*)=1 FROM public.maintenance_partner_audit WHERE acao='bloqueio'),'block audit');
WITH stale AS(UPDATE public.maintenance_partners SET nome_fantasia='stale' WHERE id='42000000-0000-4000-8000-000000000001' AND version=1 RETURNING id) SELECT partner_test.assert((SELECT count(*)=0 FROM stale),'stale update rejected');
SELECT partner_test.expect_error($cmd$INSERT INTO public.maintenance_partners(company_id,razao_social,cnpj_cpf) VALUES('12000000-0000-4000-8000-000000000001','duplicado','11.222.333/0001-81')$cmd$,'23505');
SELECT partner_test.expect_error($cmd$INSERT INTO public.maintenance_partners(company_id,razao_social) VALUES('12000000-0000-4000-8000-000000000002','outra empresa')$cmd$,'42501');
SELECT partner_test.expect_error($cmd$INSERT INTO public.maintenance_partner_audit(company_id,partner_id,acao,created_by) VALUES('12000000-0000-4000-8000-000000000001','42000000-0000-4000-8000-000000000001','edicao','22000000-0000-4000-8000-000000000001')$cmd$,'42501');
INSERT INTO storage.objects(bucket_id,name) VALUES('maintenance','12000000-0000-4000-8000-000000000001/partners/42000000-0000-4000-8000-000000000001/a.pdf');
INSERT INTO public.maintenance_partner_attachments(company_id,partner_id,categoria,nome,object_path,content_type,tamanho_bytes)
VALUES('12000000-0000-4000-8000-000000000001','42000000-0000-4000-8000-000000000001','contrato','a.pdf','12000000-0000-4000-8000-000000000001/partners/42000000-0000-4000-8000-000000000001/a.pdf','application/pdf',100);
SELECT partner_test.assert((SELECT count(*)=1 FROM public.maintenance_partner_audit WHERE acao='anexo_incluido'),'file audit');
SELECT partner_test.assert((SELECT total_os=0 AND custo_medio IS NULL FROM public.maintenance_partner_metrics('12000000-0000-4000-8000-000000000001','42000000-0000-4000-8000-000000000001')),'empty metrics honest');
SELECT set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000002',true);
UPDATE public.maintenance_partners SET nome_fantasia='Admin empresa' WHERE id='42000000-0000-4000-8000-000000000001';
SELECT partner_test.assert((SELECT nome_fantasia='Admin empresa' FROM public.maintenance_partners),'company admin writes');
SELECT set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000003',true);
UPDATE public.maintenance_partners SET nome_fantasia='Analista' WHERE id='42000000-0000-4000-8000-000000000001';
SELECT partner_test.assert((SELECT nome_fantasia='Analista' FROM public.maintenance_partners),'analyst writes');
SELECT set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000004',true);
SELECT partner_test.assert((SELECT count(*)=1 FROM public.maintenance_partners),'supervisor reads');
WITH denied AS(UPDATE public.maintenance_partners SET nome_fantasia='forbidden' RETURNING id) SELECT partner_test.assert((SELECT count(*)=0 FROM denied),'supervisor cannot update despite legacy admin');
SELECT partner_test.expect_error($cmd$INSERT INTO public.maintenance_partners(company_id,razao_social) VALUES('12000000-0000-4000-8000-000000000001','forbidden')$cmd$,'42501');
SELECT partner_test.expect_error($cmd$INSERT INTO storage.objects(bucket_id,name) VALUES('maintenance','12000000-0000-4000-8000-000000000001/partners/42000000-0000-4000-8000-000000000001/denied.pdf')$cmd$,'42501');
SELECT set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000005',true);
SELECT partner_test.assert((SELECT count(*)=1 FROM public.maintenance_partners),'operator reads');
WITH denied AS(UPDATE public.maintenance_partners SET nome_fantasia='forbidden' RETURNING id) SELECT partner_test.assert((SELECT count(*)=0 FROM denied),'operator cannot update');
SELECT set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000006',true);
SELECT partner_test.assert((SELECT count(*)=0 FROM public.maintenance_partners),'driver denied');
SELECT partner_test.assert((SELECT count(*)=0 FROM public.maintenance_partner_attachments),'driver files denied');
SELECT partner_test.assert((SELECT count(*)=0 FROM storage.objects WHERE bucket_id='maintenance'),'driver storage denied');
SELECT set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000007',true);
SELECT partner_test.assert((SELECT count(*)=0 FROM public.maintenance_partners),'client denied');
SELECT partner_test.assert((SELECT count(*)=0 FROM public.maintenance_partner_audit),'client audit denied');
ROLLBACK;
