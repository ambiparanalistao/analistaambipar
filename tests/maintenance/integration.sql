-- Execute only in the disposable PostgreSQL fixture created by CI.
BEGIN;
CREATE SCHEMA maintenance_test;
CREATE FUNCTION maintenance_test.assert(ok boolean,msg text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'ASSERTION: %',msg; END IF; END $$;
CREATE FUNCTION maintenance_test.expect_error(command text, expected_state text) RETURNS void LANGUAGE plpgsql AS $$
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
GRANT USAGE ON SCHEMA maintenance_test TO authenticated,anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA maintenance_test TO authenticated,anon;

INSERT INTO auth.users(id,email) VALUES
('20000000-0000-0000-0000-000000000001','admin-a@example.invalid'),
('20000000-0000-0000-0000-000000000002','admin-b@example.invalid'),
('20000000-0000-0000-0000-000000000003','auditor@example.invalid'),
('20000000-0000-0000-0000-000000000004','gestor@example.invalid'),
('20000000-0000-0000-0000-000000000005','analista@example.invalid');
INSERT INTO public.companies(id,nome,created_by) VALUES
('10000000-0000-0000-0000-000000000001','Empresa A','20000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000002','Empresa B','20000000-0000-0000-0000-000000000002');
INSERT INTO public.company_members(company_id,user_id,role,created_by)
SELECT c,u,r,'20000000-0000-0000-0000-000000000001'::uuid FROM (VALUES
('10000000-0000-0000-0000-000000000001'::uuid,'20000000-0000-0000-0000-000000000001'::uuid,'administrador'),
('10000000-0000-0000-0000-000000000002'::uuid,'20000000-0000-0000-0000-000000000002'::uuid,'administrador'),
('10000000-0000-0000-0000-000000000001'::uuid,'20000000-0000-0000-0000-000000000003'::uuid,'auditor'),
('10000000-0000-0000-0000-000000000001'::uuid,'20000000-0000-0000-0000-000000000004'::uuid,'gestor'),
('10000000-0000-0000-0000-000000000001'::uuid,'20000000-0000-0000-0000-000000000005'::uuid,'analista')) AS x(c,u,r);
INSERT INTO public.veiculos(id,company_id,placa,tipo,marca_modelo) VALUES
('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','TESTA01','caminhao','Fixture A'),
('30000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','TESTB01','caminhao','Fixture B');
INSERT INTO public.maintenance_partners(id,company_id,created_by,razao_social) VALUES
('40000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Oficina A'),
('40000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','Oficina B');
INSERT INTO public.maintenance_orders(id,company_id,created_by,vehicle_id,partner_id,descricao_problema,data_abertura) VALUES
('50000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','Primeira A',now()-interval '2 days'),
('50000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000002','Primeira B',now()-interval '2 days');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000001',true);
SELECT maintenance_test.assert((SELECT count(*)=1 FROM public.maintenance_orders),'tenant isolation: SELECT');
SELECT maintenance_test.assert((SELECT count(*)=1 FROM public.veiculos WHERE company_id IS NOT NULL),'fleet restrictive RLS overrides old broad policies');
SELECT maintenance_test.assert((SELECT status='Manutenção' FROM public.veiculos WHERE id='30000000-0000-0000-0000-000000000001'),'opening order sets maintenance status');
SELECT maintenance_test.assert((SELECT numero ~ '^OS-[0-9]{4}-0001$' FROM public.maintenance_orders LIMIT 1),'number format and per-company counter');
SELECT maintenance_test.expect_error($cmd$INSERT INTO public.maintenance_partners(company_id,razao_social) VALUES('10000000-0000-0000-0000-000000000002','forbidden')$cmd$,'42501');
SELECT maintenance_test.expect_error($cmd$UPDATE public.maintenance_partners SET company_id='10000000-0000-0000-0000-000000000002' WHERE id='40000000-0000-0000-0000-000000000001'$cmd$,'23514');
SELECT maintenance_test.expect_error($cmd$INSERT INTO public.maintenance_orders(company_id,vehicle_id,partner_id,descricao_problema) VALUES('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000001','Cross-company vehicle')$cmd$,'23503');
SELECT maintenance_test.expect_error($cmd$INSERT INTO public.maintenance_order_items(company_id,order_id,tipo,descricao,quantidade,valor_unitario) VALUES('10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000002','peca','Cross-company order',1,10)$cmd$,'23503');
SELECT maintenance_test.expect_error($cmd$UPDATE public.veiculos SET status='Em Viagem' WHERE id='30000000-0000-0000-0000-000000000001'$cmd$,'23514');
SELECT maintenance_test.expect_error($cmd$UPDATE public.veiculos SET status='Disponível' WHERE id='30000000-0000-0000-0000-000000000001'$cmd$,'23514');
SELECT maintenance_test.expect_error($cmd$INSERT INTO public.maintenance_order_timeline(company_id,order_id,tipo_evento,status_novo,descricao,usuario_id) VALUES('10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','mudanca_status','encerrada','fake','20000000-0000-0000-0000-000000000001')$cmd$,'42501');

INSERT INTO public.maintenance_order_items(id,company_id,order_id,tipo,descricao,quantidade,valor_unitario) VALUES
('60000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','peca','Peça',2,150),
('60000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','servico','Serviço',3,100);
SELECT maintenance_test.assert((SELECT valor_pecas=300 AND valor_mao_obra=300 AND valor_total=600 FROM public.maintenance_orders WHERE id='50000000-0000-0000-0000-000000000001'),'item totals');
UPDATE public.maintenance_orders SET orcamento_status='aprovado',status='orcamento_aprovado' WHERE id='50000000-0000-0000-0000-000000000001';
SELECT maintenance_test.assert((SELECT aprovado_por=auth.uid() AND aprovado_em IS NOT NULL FROM public.maintenance_orders WHERE id='50000000-0000-0000-0000-000000000001'),'approval actor');
UPDATE public.maintenance_order_items SET valor_unitario=200 WHERE id='60000000-0000-0000-0000-000000000001';
SELECT maintenance_test.assert((SELECT valor_total=700 AND orcamento_status='pendente' AND aprovado_por IS NULL AND status='aguardando_orcamento' FROM public.maintenance_orders WHERE id='50000000-0000-0000-0000-000000000001'),'changed budget invalidates approval');
INSERT INTO public.workshop_visits(id,company_id,order_id,vehicle_id,partner_id,chegada_em) VALUES
('70000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001',now()-interval '6 hours');
SELECT maintenance_test.expect_error($cmd$UPDATE public.maintenance_orders SET status='encerrada' WHERE id='50000000-0000-0000-0000-000000000001'$cmd$,'23514');
UPDATE public.workshop_visits SET saida_em=chegada_em+interval '5 hours 30 minutes' WHERE id='70000000-0000-0000-0000-000000000001';
SELECT maintenance_test.assert((SELECT downtime_horas=5.50 FROM public.workshop_visits LIMIT 1),'downtime hours');

INSERT INTO public.maintenance_orders(id,company_id,vehicle_id,partner_id,descricao_problema) VALUES
('50000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','Second active order');
UPDATE public.maintenance_orders SET status='encerrada' WHERE id='50000000-0000-0000-0000-000000000001';
SELECT maintenance_test.assert((SELECT status='Manutenção' FROM public.veiculos WHERE id='30000000-0000-0000-0000-000000000001'),'another active order keeps vehicle unavailable');
SELECT maintenance_test.assert((SELECT sla_medio_dias BETWEEN 1.99 AND 2.01 FROM public.maintenance_partners WHERE id='40000000-0000-0000-0000-000000000001'),'partner SLA');
UPDATE public.maintenance_orders SET status='cancelada' WHERE id='50000000-0000-0000-0000-000000000003';
SELECT maintenance_test.assert((SELECT status='Disponível' FROM public.veiculos WHERE id='30000000-0000-0000-0000-000000000001'),'last terminal order releases vehicle');
SELECT maintenance_test.assert((SELECT count(*)>=4 FROM public.maintenance_order_timeline WHERE order_id='50000000-0000-0000-0000-000000000001' AND tipo_evento='mudanca_status'),'automatic timeline');
UPDATE public.veiculos SET status='Bloqueado' WHERE id='30000000-0000-0000-0000-000000000001';
UPDATE public.maintenance_orders SET status='aberta' WHERE id='50000000-0000-0000-0000-000000000003';
UPDATE public.maintenance_orders SET status='cancelada' WHERE id='50000000-0000-0000-0000-000000000003';
SELECT maintenance_test.assert((SELECT status='Bloqueado' FROM public.veiculos WHERE id='30000000-0000-0000-0000-000000000001'),'blocked vehicle never auto-released');
SELECT maintenance_test.expect_error($cmd$UPDATE public.maintenance_order_timeline SET descricao='forged'$cmd$,'42501');
SELECT maintenance_test.expect_error($cmd$DELETE FROM public.maintenance_orders WHERE id='50000000-0000-0000-0000-000000000001'$cmd$,'42501');

INSERT INTO public.maintenance_plans(company_id,vehicle_id,nome,intervalo_km,intervalo_dias,ultima_execucao_km,ultima_execucao_data)
VALUES('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','Plano',10000,30,50000,'2026-10-01');
SELECT maintenance_test.assert((SELECT proxima_km=60000 AND proxima_data='2026-10-31' FROM public.maintenance_plans LIMIT 1),'plan calculation');

INSERT INTO storage.objects(bucket_id,name) VALUES('maintenance','10000000-0000-0000-0000-000000000001/test.png');
SELECT maintenance_test.expect_error($cmd$INSERT INTO storage.objects(bucket_id,name) VALUES('maintenance','10000000-0000-0000-0000-000000000002/test.png')$cmd$,'42501');
SELECT maintenance_test.expect_error($cmd$UPDATE storage.objects SET name='10000000-0000-0000-0000-000000000002/move.png'$cmd$,'42501');
SELECT set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000002',true);
SELECT maintenance_test.assert((SELECT count(*)=0 FROM storage.objects WHERE bucket_id='maintenance'),'Storage SELECT isolation despite broad existing policy');

SELECT set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000003',true);
SELECT maintenance_test.assert((SELECT count(*)>=1 FROM public.maintenance_partners),'auditor can read');
SELECT maintenance_test.expect_error($cmd$INSERT INTO public.maintenance_partners(company_id,razao_social) VALUES('10000000-0000-0000-0000-000000000001','auditor-write')$cmd$,'42501');
SELECT maintenance_test.expect_error($cmd$INSERT INTO storage.objects(bucket_id,name) VALUES('maintenance','10000000-0000-0000-0000-000000000001/auditor.png')$cmd$,'42501');
SELECT set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000005',true);
SELECT maintenance_test.expect_error($cmd$UPDATE public.maintenance_orders SET orcamento_status='aprovado' WHERE id='50000000-0000-0000-0000-000000000003'$cmd$,'42501');
SELECT maintenance_test.expect_error($cmd$INSERT INTO public.maintenance_settings(company_id,limite_aprovacao_supervisor) VALUES('10000000-0000-0000-0000-000000000001',999999)$cmd$,'42501');
SELECT maintenance_test.expect_error($cmd$UPDATE public.company_members SET role='administrador' WHERE user_id=auth.uid()$cmd$,'42501');

RESET ROLE;
SET LOCAL ROLE anon;
SELECT maintenance_test.expect_error($cmd$SELECT * FROM public.maintenance_partners$cmd$,'42501');
SELECT maintenance_test.assert((SELECT count(*)=0 FROM storage.objects WHERE bucket_id='maintenance'),'anon cannot read maintenance bucket');
RESET ROLE;
SELECT maintenance_test.assert((SELECT count(*)=11 FROM pg_tables WHERE schemaname='public' AND (tablename LIKE 'maintenance_%' OR tablename IN('workshop_visits','vehicle_occurrences')) AND rowsecurity),'RLS enabled on all 11 maintenance tables');
SELECT maintenance_test.assert((SELECT NOT public FROM storage.buckets WHERE id='maintenance'),'bucket private');
SELECT 'Maintenance integration assertions passed' AS result;
ROLLBACK;
