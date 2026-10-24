BEGIN;
CREATE SCHEMA delivery_test;CREATE FUNCTION delivery_test.assert(ok boolean,msg text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'ASSERT: %',msg;END IF;END $$;CREATE FUNCTION delivery_test.denied(statement text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN BEGIN EXECUTE statement;EXCEPTION WHEN OTHERS THEN RETURN;END;RAISE EXCEPTION 'Expected rejection: %',statement;END $$;GRANT USAGE ON SCHEMA delivery_test TO anon,authenticated;GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA delivery_test TO anon,authenticated;
INSERT INTO auth.users(id,email) VALUES('2b000000-0000-4000-8000-000000000001','delivery@example.invalid');INSERT INTO public.companies(id,nome,created_by) VALUES('1b000000-0000-4000-8000-000000000001','Delivery fixture','2b000000-0000-4000-8000-000000000001'),('1b000000-0000-4000-8000-000000000002','Other fixture','2b000000-0000-4000-8000-000000000001');
INSERT INTO public.company_members(company_id,user_id,role,maintenance_role,created_by) VALUES('1b000000-0000-4000-8000-000000000001','2b000000-0000-4000-8000-000000000001','administrador','admin_empresa','2b000000-0000-4000-8000-000000000001');
INSERT INTO public.veiculos(id,company_id,placa,tipo,marca_modelo,km_atual,ano_fabricacao,ano_modelo,chassi,renavam) VALUES('3b000000-0000-4000-8000-000000000001','1b000000-0000-4000-8000-000000000001','EXL0001','caminhao','Volvo FH',1000,2022,2023,'9BWZZZ377VT004251','12345678901');
SELECT set_config('request.jwt.claim.sub','2b000000-0000-4000-8000-000000000001',true);
INSERT INTO public.maintenance_partners(id,company_id,razao_social,whatsapp,onboarding_profile) VALUES('4b000000-0000-4000-8000-000000000001','1b000000-0000-4000-8000-000000000001','Delivery workshop','11987654321','{"prazo_entrega_dias":3,"tipos_oficina":["Oficina mecânica"]}');

INSERT INTO public.maintenance_partners(id,company_id,razao_social,whatsapp,status) VALUES('4b000000-0000-4000-8000-000000000002','1b000000-0000-4000-8000-000000000001','Second workshop','21987654321','ativo'),('4b000000-0000-4000-8000-000000000003','1b000000-0000-4000-8000-000000000001','No contact',NULL,'ativo'),('4b000000-0000-4000-8000-000000000004','1b000000-0000-4000-8000-000000000001','Inactive workshop','31987654321','inativo'),('4b000000-0000-4000-8000-000000000005','1b000000-0000-4000-8000-000000000002','Other company','41987654321','ativo');

INSERT INTO public.motoristas(id,company_id,nome,cnh,validade_cnh,telefone,status) VALUES('6b000000-0000-4000-8000-000000000001','1b000000-0000-4000-8000-000000000001','Driver real fixture','12345678901','2030-01-01','11987654321','Disponível'),('6b000000-0000-4000-8000-000000000002','1b000000-0000-4000-8000-000000000002','Other company driver','12345678902','2030-01-01','21987654321','Disponível');

SET LOCAL ROLE authenticated;
SELECT set_config('delivery_test.os',public.maintenance_order_command('1b000000-0000-4000-8000-000000000001','create','{"vehicle_id":"3b000000-0000-4000-8000-000000000001","partner_id":"4b000000-0000-4000-8000-000000000001","tipo":"corretiva","prioridade":"media","descricao_problema":"Defeito para orçamento","km_abertura":1000,"quote_partner_types":["oficina_mecanica"]}')->>'id',true);
SELECT set_config('delivery_test.token',split_part(public.maintenance_quote_admin('1b000000-0000-4000-8000-000000000001','links',jsonb_build_object('order_id',current_setting('delivery_test.os')))->0->>'url','#token=',2),true);
SELECT delivery_test.assert(length(current_setting('delivery_test.token'))=64,'256 bit individual token');
SET LOCAL ROLE anon;SELECT set_config('request.jwt.claim.sub','',true);
SELECT delivery_test.assert(public.maintenance_workshop_quote(current_setting('delivery_test.token'),'info')->'vehicle'->>'placa'='EXL0001','only linked vehicle exposed');
SELECT delivery_test.denied($q$SELECT public.maintenance_workshop_quote(repeat('x',64),'info')$q$);
SELECT public.maintenance_workshop_quote(current_setting('delivery_test.token'),'submit','{"version":1,"contact":"Workshop contact","delivery_days":4,"warranty_days":90,"payment_terms":"30 dias faturado","items":[{"tipo":"peca","descricao":"Peça","quantidade":2,"valor_unitario":"10.25","ncm":"0123.45.67"},{"tipo":"servico","descricao":"Mão de obra","quantidade":1,"valor_unitario":"19.50"}]}');
SELECT delivery_test.assert(public.maintenance_workshop_quote(current_setting('delivery_test.token'),'info')->'quote'->>'total'='40.00','server calculates exact total');
SELECT delivery_test.assert(public.maintenance_workshop_quote(current_setting('delivery_test.token'),'info')->'quote'->'items'->0->>'ncm'='01234567','NCM leading zero retained');
SELECT delivery_test.denied('SELECT * FROM public.maintenance_partner_quotes');
SELECT delivery_test.denied($q$SELECT public.maintenance_workshop_quote(current_setting('delivery_test.token'),'submit','{"version":1}')$q$);
SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claim.sub','2b000000-0000-4000-8000-000000000001',true);
SELECT public.maintenance_quote_admin('1b000000-0000-4000-8000-000000000001','select',jsonb_build_object('order_id',current_setting('delivery_test.os'),'quote_id',(SELECT id FROM public.maintenance_partner_quotes WHERE order_id=current_setting('delivery_test.os')::uuid),'version',2,'reason','Melhor prazo e condições comerciais'));
SELECT delivery_test.assert((SELECT count(*)=2 FROM public.maintenance_order_items WHERE order_id=current_setting('delivery_test.os')::uuid),'selection imports items');
SELECT delivery_test.assert((SELECT valor_total=40 AND prazo_entrega_dias=4 AND orcamento_status<>'aprovado' FROM public.maintenance_orders WHERE id=current_setting('delivery_test.os')::uuid),'selection does not authorize service');
SELECT delivery_test.assert((SELECT count(*)=1 FROM public.maintenance_order_timeline WHERE dados->>'origem'='portal_oficina'),'external source clearly audited');
SELECT delivery_test.denied($q$SELECT public.maintenance_quote_admin('1b000000-0000-4000-8000-000000000002','list',jsonb_build_object('order_id',current_setting('delivery_test.os')))$q$);
ROLLBACK;
