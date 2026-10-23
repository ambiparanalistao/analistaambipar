-- Execute only in the disposable PostgreSQL fixture created by CI.
BEGIN;
CREATE SCHEMA order_test;
CREATE FUNCTION order_test.assert(ok boolean,msg text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'ASSERTION: %',msg; END IF; END $$;
CREATE FUNCTION order_test.expect_error(command text, expected_state text) RETURNS void LANGUAGE plpgsql AS $$
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
GRANT USAGE ON SCHEMA order_test TO authenticated,anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA order_test TO authenticated,anon;

INSERT INTO auth.users(id,email)
SELECT ('22000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'partner-'||n||'@example.invalid' FROM generate_series(1,7)n;
INSERT INTO public.companies(id,nome,created_by) VALUES('12000000-0000-4000-8000-000000000001','Partner fixture','22000000-0000-4000-8000-000000000001'),('12000000-0000-4000-8000-000000000002','Other fixture','22000000-0000-4000-8000-000000000001');
INSERT INTO public.company_members(company_id,user_id,role,maintenance_role,created_by)
SELECT '12000000-0000-4000-8000-000000000001',('22000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,CASE WHEN n=1 THEN 'auditor' ELSE 'administrador' END,
(ARRAY['admin_geral','admin_empresa','analista_transporte','supervisor','operador_logistico','motorista','cliente'])[n],'22000000-0000-4000-8000-000000000001' FROM generate_series(1,7)n;

INSERT INTO public.veiculos(id,company_id,placa,tipo,marca_modelo,km_atual) VALUES('33000000-0000-4000-8000-000000000001','12000000-0000-4000-8000-000000000001','OSFX001','caminhao','Fixture',1000);
INSERT INTO public.maintenance_partners(id,company_id,razao_social,created_by) VALUES('43000000-0000-4000-8000-000000000001','12000000-0000-4000-8000-000000000001','Oficina OS','22000000-0000-4000-8000-000000000001');
INSERT INTO public.maintenance_settings(company_id,created_by,limite_aprovacao_supervisor) VALUES('12000000-0000-4000-8000-000000000001','22000000-0000-4000-8000-000000000001',1000);
CREATE FUNCTION order_test.act(action text,payload jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE sql SECURITY INVOKER AS $$
 SELECT public.maintenance_order_command('12000000-0000-4000-8000-000000000001',action,
 jsonb_build_object('id',current_setting('order_test.id'),'version',(SELECT version FROM public.maintenance_orders WHERE id=current_setting('order_test.id')::uuid))||payload);
$$;
GRANT EXECUTE ON FUNCTION order_test.act(text,jsonb) TO authenticated;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000001',true);
SELECT set_config('order_test.id',(public.maintenance_order_command('12000000-0000-4000-8000-000000000001','create',
'{"vehicle_id":"33000000-0000-4000-8000-000000000001","partner_id":"43000000-0000-4000-8000-000000000001","tipo":"corretiva","prioridade":"alta","descricao_problema":"Freio","km_abertura":1000}')->>'id'),true);
SELECT order_test.assert((SELECT numero LIKE 'OS-%-0001' AND version=1 FROM public.maintenance_orders WHERE id=current_setting('order_test.id')::uuid),'automatic number');
SELECT order_test.assert((SELECT status='Manutenção' FROM public.veiculos WHERE placa='OSFX001'),'opening marks maintenance');
SELECT order_test.expect_error($cmd$UPDATE public.maintenance_orders SET status='encerrada'$cmd$,'42501');
SELECT order_test.expect_error($cmd$SELECT public.maintenance_order_command('12000000-0000-4000-8000-000000000002','create','{}')$cmd$,'42501');
SELECT order_test.act('item_save','{"tipo":"peca","descricao":"Freio","quantidade":2,"valor_unitario":100}');
SELECT order_test.assert((SELECT valor_total=200 FROM public.maintenance_orders WHERE id=current_setting('order_test.id')::uuid),'totals are calculated');
SELECT order_test.expect_error($cmd$SELECT order_test.act('summary','{"version":1}')$cmd$,'40001');
SELECT set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000004',true);
SELECT order_test.act('budget','{"decisao":"aprovado","observacao":"Dentro do limite"}');
SELECT order_test.assert((SELECT decisao_por=auth.uid() AND decisao_em IS NOT NULL AND aprovado_por=auth.uid() FROM public.maintenance_orders WHERE id=current_setting('order_test.id')::uuid),'supervisor decision stamped');
SELECT order_test.expect_error($cmd$SELECT order_test.act('item_save','{"tipo":"peca","descricao":"Hack","quantidade":1,"valor_unitario":1}')$cmd$,'42501');
SELECT set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000003',true);
SELECT order_test.act('item_save','{"tipo":"servico","descricao":"Mão de obra","quantidade":1,"valor_unitario":1500}');
SELECT order_test.assert((SELECT orcamento_status='pendente' AND decisao_por IS NULL FROM public.maintenance_orders WHERE id=current_setting('order_test.id')::uuid),'changing values resets approval');
SELECT set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000004',true);
SELECT order_test.expect_error($cmd$SELECT order_test.act('budget','{"decisao":"aprovado","observacao":"Acima do limite"}')$cmd$,'42501');
SELECT order_test.act('budget','{"decisao":"reprovado","observacao":"Excede o limite"}');
SELECT order_test.assert((SELECT decisao_por=auth.uid() AND decisao_em IS NOT NULL AND orcamento_status='reprovado' FROM public.maintenance_orders WHERE id=current_setting('order_test.id')::uuid),'rejection actor and time retained');
SELECT set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000003',true);
SELECT order_test.act('budget','{"decisao":"aprovado","observacao":"Analista aprovou"}');
INSERT INTO storage.objects(bucket_id,name) VALUES('maintenance','12000000-0000-4000-8000-000000000001/orders/'||current_setting('order_test.id')||'/files/orcamento.pdf');
SELECT order_test.act('attachment_add',jsonb_build_object('tipo','orcamento','url','12000000-0000-4000-8000-000000000001/orders/'||current_setting('order_test.id')||'/files/orcamento.pdf','nome','orcamento.pdf','content_type','application/pdf','tamanho_bytes',120));
SELECT order_test.assert((SELECT count(*)=1 FROM public.maintenance_attachments WHERE order_id=current_setting('order_test.id')::uuid),'private attachment registered');
SELECT order_test.act('transition','{"status":"em_transito","observacao":"Encaminhado"}');
SELECT set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000005',true);
SELECT set_config('order_test.second',(public.maintenance_order_command('12000000-0000-4000-8000-000000000001','create',
'{"vehicle_id":"33000000-0000-4000-8000-000000000001","partner_id":"43000000-0000-4000-8000-000000000001","tipo":"preventiva","prioridade":"baixa","descricao_problema":"Revisão","km_abertura":1000}')->>'id'),true);
SELECT order_test.expect_error($cmd$SELECT order_test.act('arrival','{"km":999,"observacao":"Regressivo"}')$cmd$,'P0001');
INSERT INTO storage.objects(bucket_id,name) VALUES('maintenance','12000000-0000-4000-8000-000000000001/orders/'||current_setting('order_test.id')||'/visits/chegada.jpg');
SELECT order_test.act('arrival',jsonb_build_object('km',1010,'observacao','Chegada registrada','foto','12000000-0000-4000-8000-000000000001/orders/'||current_setting('order_test.id')||'/visits/chegada.jpg'));
WITH removed AS(DELETE FROM storage.objects WHERE name='12000000-0000-4000-8000-000000000001/orders/'||current_setting('order_test.id')||'/visits/chegada.jpg' RETURNING id) SELECT order_test.assert((SELECT count(*)=0 FROM removed),'linked visit photos cannot be deleted directly');

SELECT order_test.assert((SELECT count(*)=1 FROM public.workshop_visits WHERE order_id=current_setting('order_test.id')::uuid AND km_chegada=1010),'operator arrival');
SELECT order_test.expect_error($cmd$SELECT order_test.act('transition','{"status":"cancelada","observacao":"Hack"}')$cmd$,'42501');
SELECT order_test.expect_error($cmd$SELECT order_test.act('departure','{"km":1015,"observacao":"Cedo"}')$cmd$,'P0001');
SELECT set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000003',true);
SELECT order_test.act('transition','{"status":"em_execucao","observacao":"Início"}');
SELECT order_test.expect_error($cmd$SELECT order_test.act('transition','{"status":"concluido","observacao":"Sem dados"}')$cmd$,'P0001');
SELECT order_test.act('transition','{"status":"concluido","observacao":"Pronto","servicos_executados":"Troca de freios","valor_final":1700}');
SELECT set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000005',true);
SELECT order_test.act('departure','{"km":1015,"observacao":"Retirado"}');
SELECT order_test.assert((SELECT km_atual=1015 FROM public.veiculos WHERE placa='OSFX001'),'odometer updated monotonically');
SELECT set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000003',true);
SELECT order_test.act('transition','{"status":"encerrada","observacao":"Encerramento"}');
SELECT order_test.assert((SELECT status='Manutenção' FROM public.veiculos WHERE placa='OSFX001'),'other active order prevents release');
SELECT order_test.assert((SELECT count(*)>10 FROM public.maintenance_order_timeline WHERE order_id=current_setting('order_test.id')::uuid),'timeline records operations');
SELECT order_test.expect_error($cmd$SELECT order_test.act('summary','{"diagnostico":"Fechada"}')$cmd$,'P0001');
SELECT set_config('order_test.id',current_setting('order_test.second'),true);
SELECT order_test.act('transition','{"status":"cancelada","observacao":"Cancelamento autorizado"}');
SELECT order_test.assert((SELECT status='Disponível' FROM public.veiculos WHERE placa='OSFX001'),'last cancellation releases vehicle');
SELECT set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000006',true);
SELECT order_test.assert((SELECT count(*)=0 FROM public.maintenance_orders),'driver cannot read');
SELECT order_test.expect_error($cmd$SELECT order_test.act('summary','{}')$cmd$,'42501');
SELECT set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000007',true);
SELECT order_test.assert((SELECT count(*)=0 FROM public.maintenance_orders),'client cannot read');
ROLLBACK;
