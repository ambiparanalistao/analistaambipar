-- OPTIONAL, fictitious demonstration data. Never run automatically.
-- Execute as database administrator ONLY after setting all three session parameters:
-- SELECT set_config('maintenance.seed_company_id','<existing-company-uuid>',false);
-- SELECT set_config('maintenance.seed_user_id','<existing-company-member-uuid>',false);
-- SELECT set_config('maintenance.seed_vehicle_id','<existing-id-from-veiculos-of-this-company>',false);
BEGIN;
DO $$
DECLARE c uuid; u uuid; v uuid; p1 uuid; p2 uuid; p3 uuid;
BEGIN
  IF NOT maintenance_private.is_provisioner() THEN RAISE EXCEPTION 'Seed requires administrative SQL access'; END IF;
  c:=nullif(current_setting('maintenance.seed_company_id',true),'')::uuid;
  u:=nullif(current_setting('maintenance.seed_user_id',true),'')::uuid;
  v:=nullif(current_setting('maintenance.seed_vehicle_id',true),'')::uuid;
  IF c IS NULL OR u IS NULL OR v IS NULL THEN RAISE EXCEPTION 'Set the three maintenance.seed_* parameters first'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.company_members WHERE company_id=c AND user_id=u AND ativo)
     OR NOT EXISTS(SELECT 1 FROM public.veiculos WHERE id=v AND company_id=c AND status<>'Em Viagem') THEN
    RAISE EXCEPTION 'Seed requires an active member and a vehicle belonging to the same company, without an active trip';
  END IF;
  IF EXISTS(SELECT 1 FROM public.maintenance_orders WHERE company_id=c AND observacoes='OPTIONAL_SEED_STAGE_1') THEN
    RAISE EXCEPTION 'This optional seed has already been applied for this company';
  END IF;
  INSERT INTO public.maintenance_partners(company_id,created_by,razao_social,nome_fantasia,tipo)
    VALUES(c,u,'DEMONSTRAÇÃO — Oficina Mecânica','Oficina fictícia 1','oficina_mecanica') RETURNING id INTO p1;
  INSERT INTO public.maintenance_partners(company_id,created_by,razao_social,nome_fantasia,tipo)
    VALUES(c,u,'DEMONSTRAÇÃO — Auto Elétrica','Oficina fictícia 2','eletrica') RETURNING id INTO p2;
  INSERT INTO public.maintenance_partners(company_id,created_by,razao_social,nome_fantasia,tipo)
    VALUES(c,u,'DEMONSTRAÇÃO — Borracharia','Oficina fictícia 3','borracharia') RETURNING id INTO p3;
  INSERT INTO public.maintenance_orders(company_id,created_by,vehicle_id,partner_id,descricao_problema,status,data_abertura,observacoes)
  VALUES
    (c,u,v,p1,'DEMO: revisão preventiva','aberta',now()-interval '1 day','OPTIONAL_SEED_STAGE_1'),
    (c,u,v,p2,'DEMO: diagnóstico elétrico','aguardando_orcamento',now()-interval '2 days','OPTIONAL_SEED_STAGE_1'),
    (c,u,v,p3,'DEMO: troca de pneus','em_execucao',now()-interval '3 days','OPTIONAL_SEED_STAGE_1'),
    (c,u,v,p1,'DEMO: serviço finalizado','encerrada',now()-interval '4 days','OPTIONAL_SEED_STAGE_1'),
    (c,u,v,p2,'DEMO: solicitação cancelada','cancelada',now()-interval '5 days','OPTIONAL_SEED_STAGE_1');
  INSERT INTO public.maintenance_plans(company_id,created_by,vehicle_id,nome,intervalo_km,ultima_execucao_km)
    VALUES(c,u,v,'DEMO: revisão a cada 10.000 km',10000,0);
  INSERT INTO public.maintenance_plans(company_id,created_by,vehicle_id,nome,intervalo_dias,ultima_execucao_data)
    VALUES(c,u,v,'DEMO: inspeção a cada 90 dias',90,current_date);
END $$;
COMMIT;
