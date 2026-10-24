BEGIN;
CREATE SCHEMA delivery_test;CREATE FUNCTION delivery_test.assert(ok boolean,msg text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'ASSERT: %',msg;END IF;END $$;CREATE FUNCTION delivery_test.denied(statement text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN BEGIN EXECUTE statement;EXCEPTION WHEN OTHERS THEN RETURN;END;RAISE EXCEPTION 'Expected rejection: %',statement;END $$;GRANT USAGE ON SCHEMA delivery_test TO anon,authenticated;GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA delivery_test TO anon,authenticated;
INSERT INTO auth.users(id,email) VALUES('2b000000-0000-4000-8000-000000000001','delivery@example.invalid');INSERT INTO public.companies(id,nome,created_by) VALUES('1b000000-0000-4000-8000-000000000001','Delivery fixture','2b000000-0000-4000-8000-000000000001'),('1b000000-0000-4000-8000-000000000002','Other fixture','2b000000-0000-4000-8000-000000000001');
INSERT INTO public.company_members(company_id,user_id,role,maintenance_role,created_by) VALUES('1b000000-0000-4000-8000-000000000001','2b000000-0000-4000-8000-000000000001','administrador','admin_empresa','2b000000-0000-4000-8000-000000000001');
INSERT INTO public.veiculos(id,company_id,placa,tipo,marca_modelo,km_atual,ano_fabricacao,ano_modelo,chassi,renavam) VALUES('3b000000-0000-4000-8000-000000000001','1b000000-0000-4000-8000-000000000001','EXL0001','caminhao','Volvo FH',1000,2022,2023,'9BWZZZ377VT004251','12345678901');
SELECT set_config('request.jwt.claim.sub','2b000000-0000-4000-8000-000000000001',true);
INSERT INTO public.maintenance_partners(id,company_id,razao_social,whatsapp,onboarding_profile) VALUES('4b000000-0000-4000-8000-000000000001','1b000000-0000-4000-8000-000000000001','Delivery workshop','11987654321','{"prazo_entrega_dias":3,"tipos_oficina":["Oficina mecânica"]}');

INSERT INTO public.maintenance_partners(id,company_id,razao_social,whatsapp,status) VALUES('4b000000-0000-4000-8000-000000000002','1b000000-0000-4000-8000-000000000001','Second workshop','21987654321','ativo'),('4b000000-0000-4000-8000-000000000003','1b000000-0000-4000-8000-000000000001','No contact',NULL,'ativo'),('4b000000-0000-4000-8000-000000000004','1b000000-0000-4000-8000-000000000001','Inactive workshop','31987654321','inativo'),('4b000000-0000-4000-8000-000000000005','1b000000-0000-4000-8000-000000000002','Other company','41987654321','ativo');

INSERT INTO public.motoristas(id,company_id,nome,cnh,validade_cnh,telefone,status) VALUES('6b000000-0000-4000-8000-000000000001','1b000000-0000-4000-8000-000000000001','Driver real fixture','12345678901','2030-01-01','11987654321','Disponível'),('6b000000-0000-4000-8000-000000000002','1b000000-0000-4000-8000-000000000002','Other company driver','12345678902','2030-01-01','21987654321','Disponível');

INSERT INTO maintenance_worker_private.config(key_hash) VALUES(driver_portal_private.hash(repeat('w',64)));
SET LOCAL ROLE authenticated;
SELECT set_config('delivery_test.os',public.maintenance_order_command('1b000000-0000-4000-8000-000000000001','create','{"vehicle_id":"3b000000-0000-4000-8000-000000000001","partner_id":"4b000000-0000-4000-8000-000000000001","tipo":"corretiva","prioridade":"media","descricao_problema":"Defeito para orçamento","km_abertura":1000,"quote_partner_types":["oficina_mecanica"]}')->>'id',true);
SELECT delivery_test.assert((SELECT count(*)=1 FROM public.maintenance_delivery_jobs),'new authorized dispatch enqueues worker job');
SELECT set_config('delivery_test.actor',current_setting('request.jwt.claim.sub'),true);
SET LOCAL ROLE anon;SELECT set_config('request.jwt.claim.sub','',true);
SELECT delivery_test.denied($q$SELECT public.maintenance_delivery_worker('wrong','claim')$q$);
SELECT set_config('delivery_test.claim',public.maintenance_delivery_worker(repeat('w',64),'claim')::text,true);
SELECT delivery_test.assert(current_setting('delivery_test.claim')::jsonb->>'status'='claimed','worker claims persisted dispatch');
SELECT delivery_test.assert(current_setting('request.jwt.claim.sub')='','worker restores actor context');
SELECT delivery_test.assert(public.maintenance_delivery_worker(repeat('w',64),'claim')->>'status'='idle','running job cannot be claimed twice');
SELECT public.maintenance_delivery_worker(repeat('w',64),'finish',current_setting('delivery_test.claim')::jsonb||'{"status":"accepted","message_id":"fixture-provider-id"}');
SELECT delivery_test.assert(public.maintenance_delivery_worker(repeat('w',64),'claim')->>'status'='idle','accepted dispatch never resent');
SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claim.sub',current_setting('delivery_test.actor'),true);
SELECT delivery_test.assert((SELECT status='accepted' FROM public.maintenance_delivery_jobs),'accepted result saved');
SELECT public.maintenance_schedule_message('1b000000-0000-4000-8000-000000000001',jsonb_build_object('order_id',current_setting('delivery_test.os'),'request_id',gen_random_uuid(),'conteudo','Informe andamento do veículo por favor.','scheduled_at',clock_timestamp()-interval '1 second'));
SET LOCAL ROLE anon;SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('delivery_test.claim',public.maintenance_delivery_worker(repeat('w',64),'claim')::text,true);
SELECT delivery_test.assert(current_setting('delivery_test.claim')::jsonb->>'job_kind'='message','explicit scheduled text claimed');
SELECT delivery_test.assert(current_setting('delivery_test.claim')::jsonb->>'text'='Informe andamento do veículo por favor.','worker uses persisted canonical text');
SELECT public.maintenance_delivery_worker(repeat('w',64),'finish',current_setting('delivery_test.claim')::jsonb||'{"status":"unknown"}');
SELECT delivery_test.assert(public.maintenance_delivery_worker(repeat('w',64),'claim')->>'status'='idle','ambiguous result never auto retries');
ROLLBACK;
