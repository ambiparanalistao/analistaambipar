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
SELECT set_config('delivery_test.license',public.compliance_command('1b000000-0000-4000-8000-000000000001','license_save','{"orgao":"Órgão de teste","documento":"Licença de teste","emissao":"2025-01-01","vencimento":"2026-01-01"}')->>'id',true);
SELECT public.compliance_command('1b000000-0000-4000-8000-000000000001','license_save',jsonb_build_object('id',current_setting('delivery_test.license'),'version',1,'orgao','Órgão de teste','documento','Licença de teste','emissao','2025-01-01','vencimento','2028-01-01'));
SELECT delivery_test.assert(public.compliance_command('1b000000-0000-4000-8000-000000000001','list')->0->>'vencimento'='2028-01-01','saved renewal read from canonical table');
SELECT delivery_test.denied($q$SELECT public.compliance_command('1b000000-0000-4000-8000-000000000001','license_save',jsonb_build_object('id',current_setting('delivery_test.license'),'version',1,'orgao','Órgão','documento','Licença'))$q$);
SELECT delivery_test.denied($q$SELECT public.compliance_command('1b000000-0000-4000-8000-000000000002','list')$q$);
SELECT public.compliance_command('1b000000-0000-4000-8000-000000000001','vehicle_dates','{"id":"3b000000-0000-4000-8000-000000000001","before":{"validade_civ":null},"dates":{"validade_civ":"2028-09-10"}}');
SELECT delivery_test.assert((SELECT validade_civ='2028-09-10' FROM public.veiculos WHERE id='3b000000-0000-4000-8000-000000000001'),'vehicle dates update actual registry');
SELECT delivery_test.denied($q$SELECT public.compliance_command('1b000000-0000-4000-8000-000000000001','vehicle_dates','{"id":"3b000000-0000-4000-8000-000000000001","before":{"validade_civ":null},"dates":{"validade_civ":"2029-09-10"}}')$q$);
SELECT delivery_test.denied($q$SELECT public.compliance_command('1b000000-0000-4000-8000-000000000001','vehicle_dates','{"id":"3b000000-0000-4000-8000-000000000001","dates":{"company_id":"2029-09-10"}}')$q$);
SELECT public.compliance_command('1b000000-0000-4000-8000-000000000001','driver_dates','{"id":"6b000000-0000-4000-8000-000000000001","before":{"validade_toxicologico":null},"dates":{"validade_toxicologico":"2028-02-15"}}');
SELECT delivery_test.assert((SELECT validade_toxicologico='2028-02-15' FROM public.motoristas WHERE id='6b000000-0000-4000-8000-000000000001'),'driver validity updates canonical registry');
SELECT set_config('delivery_test.os',public.maintenance_order_command('1b000000-0000-4000-8000-000000000001','create','{"vehicle_id":"3b000000-0000-4000-8000-000000000001","partner_id":"4b000000-0000-4000-8000-000000000001","tipo":"corretiva","prioridade":"media","descricao_problema":"Defeito para análise","km_abertura":1000}')->>'id',true);
SELECT delivery_test.assert((SELECT status='Disponível' FROM public.veiculos WHERE id='3b000000-0000-4000-8000-000000000001'),'opening SOR preserves manual availability');
UPDATE public.veiculos SET status='Manutenção' WHERE id='3b000000-0000-4000-8000-000000000001';
SELECT delivery_test.denied($q$UPDATE public.veiculos SET status='Em Viagem' WHERE id='3b000000-0000-4000-8000-000000000001'$q$);
SELECT public.maintenance_order_command('1b000000-0000-4000-8000-000000000001','transition',jsonb_build_object('id',current_setting('delivery_test.os'),'version',(SELECT version FROM public.maintenance_orders WHERE id=current_setting('delivery_test.os')::uuid),'status','cancelada','observacao','Cancelamento de teste'));
SELECT delivery_test.assert((SELECT status='Manutenção' FROM public.veiculos WHERE id='3b000000-0000-4000-8000-000000000001'),'cancelling SOR never auto releases vehicle');

UPDATE public.veiculos SET status='Disponível' WHERE id='3b000000-0000-4000-8000-000000000001';
SELECT delivery_test.assert((SELECT count(*)=2 FROM public.compliance_change_log WHERE action='status_manual'),'manual availability audited');
SET LOCAL ROLE anon;SELECT delivery_test.denied('SELECT * FROM public.compliance_licenses');SELECT delivery_test.denied($q$SELECT public.compliance_command('1b000000-0000-4000-8000-000000000001','list')$q$);
ROLLBACK;
