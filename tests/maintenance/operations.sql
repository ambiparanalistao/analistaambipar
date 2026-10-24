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
SELECT set_config('delivery_test.asset',public.maintenance_operations('1b000000-0000-4000-8000-000000000001','asset_create','{"kind":"pneu","code":"FOGO-001","description":"Pneu direcional","acquisition_cost":"0"}')->>'id',true);
SELECT public.maintenance_operations('1b000000-0000-4000-8000-000000000001','asset_event',jsonb_build_object('id',current_setting('delivery_test.asset'),'version',1,'event','instalar','vehicle_id','3b000000-0000-4000-8000-000000000001','position','Dianteiro esquerdo','km',1000,'cost','0','description','Instalação de teste'));
SELECT delivery_test.denied($q$SELECT public.maintenance_operations('1b000000-0000-4000-8000-000000000001','asset_event',jsonb_build_object('id',current_setting('delivery_test.asset'),'version',1,'event','leitura','km',1200,'description','Versão antiga'))$q$);
SELECT delivery_test.denied($q$SELECT public.maintenance_operations('1b000000-0000-4000-8000-000000000001','asset_event',jsonb_build_object('id',current_setting('delivery_test.asset'),'version',2,'event','remover','km',999,'description','Odômetro menor'))$q$);
SELECT public.maintenance_operations('1b000000-0000-4000-8000-000000000001','asset_event',jsonb_build_object('id',current_setting('delivery_test.asset'),'version',2,'event','remover','km',1100,'cost','5.50','description','Retirada para recapagem'));
SELECT public.maintenance_operations('1b000000-0000-4000-8000-000000000001','asset_event',jsonb_build_object('id',current_setting('delivery_test.asset'),'version',3,'event','recapagem','cost','0','description','Envio para recapagem'));
SELECT public.maintenance_operations('1b000000-0000-4000-8000-000000000001','asset_event',jsonb_build_object('id',current_setting('delivery_test.asset'),'version',4,'event','retorno_recapagem','cost','100','description','Recapagem concluída'));
SELECT delivery_test.assert((SELECT retreads=1 AND status='estoque' FROM public.maintenance_assets WHERE id=current_setting('delivery_test.asset')::uuid),'retread tracked');
SELECT delivery_test.assert(public.maintenance_operations('1b000000-0000-4000-8000-000000000001','list_assets','{"kind":"pneu"}')->0->>'custo_acumulado'='105.50','exact accumulated actual costs');
SELECT delivery_test.denied($q$SELECT public.maintenance_operations('1b000000-0000-4000-8000-000000000002','list_assets','{"kind":"pneu"}')$q$);
SELECT public.maintenance_operations('1b000000-0000-4000-8000-000000000001','checklist_create','{"request_id":"8b000000-0000-4000-8000-000000000001","vehicle_id":"3b000000-0000-4000-8000-000000000001","driver_id":"6b000000-0000-4000-8000-000000000001","kind":"retorno","km":1200,"items":{"pneus":"ok","freios":"defeito","iluminacao":"ok","fluidos":"ok","direcao":"ok","documentos":"ok","equipamentos":"ok"},"notes":"Ruído no freio de serviço","severity":"urgente"}');
SELECT delivery_test.assert((SELECT count(*)=1 FROM public.maintenance_driver_reports),'defective checklist creates report');
SELECT delivery_test.assert((SELECT km_atual=1200 FROM public.veiculos WHERE id='3b000000-0000-4000-8000-000000000001'),'checklist updates canonical odometer');
SELECT public.maintenance_operations('1b000000-0000-4000-8000-000000000001','checklist_create','{"request_id":"8b000000-0000-4000-8000-000000000001"}');
SELECT delivery_test.assert((SELECT count(*)=1 FROM public.maintenance_checklists),'checklist retry idempotent');
SELECT delivery_test.assert(jsonb_array_length(public.maintenance_cashflow('1b000000-0000-4000-8000-000000000001','{"start":"2026-01-01","end":"2026-12-31"}'))=12,'monthly cashflow fills missing periods with zero');
SELECT delivery_test.assert((SELECT count(*)>=6 FROM public.maintenance_operations_audit),'changes audited');
SET LOCAL ROLE anon;SELECT delivery_test.denied('SELECT * FROM public.maintenance_assets');SELECT delivery_test.denied('SELECT * FROM public.maintenance_checklists');

RESET ROLE;
INSERT INTO driver_portal_private.config(key_hash) VALUES(driver_portal_private.hash(repeat('s',64)));
INSERT INTO driver_portal_private.invites(company_id,token,updated_by) VALUES('1b000000-0000-4000-8000-000000000001',repeat('a',64),'2b000000-0000-4000-8000-000000000001');
INSERT INTO driver_portal_private.sessions(token_hash,company_id,driver_id,invite_token) VALUES(driver_portal_private.hash(repeat('t',64)),'1b000000-0000-4000-8000-000000000001','6b000000-0000-4000-8000-000000000001',repeat('a',64));
SELECT set_config('delivery_test.sessionhash',driver_portal_private.hash(repeat('t',64)),true);
SET LOCAL ROLE anon;SELECT set_config('request.jwt.claim.sub','',true);
SELECT public.driver_maintenance_gateway(repeat('s',64),'checklist',jsonb_build_object('invite',repeat('a',64),'session_hash',current_setting('delivery_test.sessionhash'),'request_id','8b000000-0000-4000-8000-000000000002','vehicle_id','3b000000-0000-4000-8000-000000000001','kind','saida','km',1300,'items','{"pneus":"ok","freios":"ok","iluminacao":"ok","fluidos":"ok","direcao":"ok","documentos":"ok","equipamentos":"ok"}'::jsonb));
RESET ROLE;
SELECT delivery_test.assert((SELECT count(*)=2 FROM public.maintenance_checklists),'verified driver can submit checklist');
SELECT delivery_test.assert((SELECT verified_driver AND created_by IS NULL FROM public.maintenance_checklists WHERE request_id='8b000000-0000-4000-8000-000000000002'),'driver checklist does not impersonate staff');
ROLLBACK;

