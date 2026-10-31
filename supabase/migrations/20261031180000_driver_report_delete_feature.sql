BEGIN;

-- ==============================================================================
-- Migration: 20261031180000_driver_report_delete_feature.sql
-- Objetivo: Suporte a exclusão de solicitações dos motoristas e limpeza de vínculos
-- ==============================================================================

-- 1. Atualiza driver_portal_private.admin_command para suportar action = 'delete'
CREATE OR REPLACE FUNCTION driver_portal_private.admin_command(c uuid,action text,b jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.maintenance_driver_reports;dispatch public.maintenance_driver_report_dispatches;recipient public.maintenance_partners;inv driver_portal_private.invites;page_number integer:=greatest(1,least(coalesce((b->>'page')::integer,1),100000));selected text[];amount integer;phone text;view_status text:=coalesce(b->>'status','');term text:=left(coalesce(b->>'search',''),100);
BEGIN
IF auth.uid() IS NULL OR NOT maintenance_private.partner_access(c) THEN RAISE EXCEPTION 'Acesso não autorizado à empresa.' USING ERRCODE='42501';END IF;
IF action IN ('link','rotate','revoke','status','prepare_dispatch','dispatch_claim','dispatch_finish','delete') AND NOT maintenance_private.partner_access(c,true) THEN RAISE EXCEPTION 'Seu perfil não pode gerenciar estas solicitações.' USING ERRCODE='42501';END IF;
IF action IN ('link','rotate','revoke') THEN
IF action='revoke' THEN UPDATE driver_portal_private.invites SET active=false,updated_by=auth.uid(),updated_at=clock_timestamp() WHERE company_id=c;RETURN jsonb_build_object('active',false);END IF;
INSERT INTO driver_portal_private.invites(company_id,token,updated_by) VALUES(c,replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-',''),auth.uid()) ON CONFLICT(company_id) DO NOTHING;
IF action='rotate' THEN UPDATE driver_portal_private.invites SET token=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-',''),active=true,updated_by=auth.uid(),updated_at=clock_timestamp() WHERE company_id=c;END IF;
SELECT * INTO inv FROM driver_portal_private.invites WHERE company_id=c;RETURN jsonb_build_object('invite',inv.token,'active',inv.active);END IF;
IF action='list' THEN RETURN jsonb_build_object('rows',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC,x.id) FROM (SELECT id,protocol,driver_name,vehicle_plate,km,defects,severity,status,feedback,version,created_at,updated_at,ack_status FROM public.maintenance_driver_reports WHERE company_id=c AND (coalesce(b->>'severity','')='' OR severity=b->>'severity') AND (view_status='' OR status=view_status OR (view_status='atuais' AND status IN ('nova','analise','pendente'))) AND (term='' OR driver_name ILIKE '%'||term||'%' OR vehicle_plate ILIKE '%'||term||'%' OR protocol ILIKE '%'||term||'%') ORDER BY created_at DESC,id OFFSET (page_number-1)*20 LIMIT 20) x),'[]'::jsonb),'count',(SELECT count(*) FROM public.maintenance_driver_reports WHERE company_id=c AND (coalesce(b->>'severity','')='' OR severity=b->>'severity') AND (view_status='' OR status=view_status OR (view_status='atuais' AND status IN ('nova','analise','pendente'))) AND (term='' OR driver_name ILIKE '%'||term||'%' OR vehicle_plate ILIKE '%'||term||'%' OR protocol ILIKE '%'||term||'%')),'counts',jsonb_build_object('atuais',(SELECT count(*) FROM public.maintenance_driver_reports WHERE company_id=c AND status IN ('nova','analise','pendente')),'pendentes',(SELECT count(*) FROM public.maintenance_driver_reports WHERE company_id=c AND status='pendente'),'resolvidas',(SELECT count(*) FROM public.maintenance_driver_reports WHERE company_id=c AND status='resolvida'),'urgentes',(SELECT count(*) FROM public.maintenance_driver_reports WHERE company_id=c AND severity='urgente' AND status IN ('nova','analise','pendente'))));END IF;
SELECT * INTO r FROM public.maintenance_driver_reports WHERE id=(b->>'id')::uuid AND company_id=c FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'Solicitação não encontrada nesta empresa.' USING ERRCODE='42501';END IF;

-- Exclusão da solicitação do motorista
IF action='delete' THEN
  -- 1. Remove eventos da linha do tempo
  DELETE FROM public.maintenance_driver_report_events WHERE company_id=c AND report_id=r.id;
  -- 2. Remove despachos para oficinas
  DELETE FROM public.maintenance_driver_report_dispatches WHERE company_id=c AND report_id=r.id;
  -- 3. Desvincula de ordens de serviço caso haja vínculo
  IF to_regclass('public.maintenance_report_orders') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.maintenance_report_orders WHERE company_id = $1 AND report_id = $2' USING c, r.id;
  END IF;
  -- 4. Desvincula checklists caso haja referência
  IF to_regclass('public.maintenance_checklists') IS NOT NULL THEN
    EXECUTE 'UPDATE public.maintenance_checklists SET report_id = NULL WHERE company_id = $1 AND report_id = $2' USING c, r.id;
  END IF;
  -- 5. Exclui a solicitação principal
  DELETE FROM public.maintenance_driver_reports WHERE company_id=c AND id=r.id;
  RETURN jsonb_build_object('success', true, 'deleted_id', r.id, 'protocol', r.protocol);
END IF;

IF action='detail' THEN RETURN jsonb_build_object('report',to_jsonb(r)-'ack_token','events',coalesce((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.created_at,e.id) FROM public.maintenance_driver_report_events e WHERE report_id=r.id AND company_id=c),'[]'::jsonb),'dispatches',coalesce((SELECT jsonb_agg(jsonb_build_object('id',x.id,'partner',coalesce(p.nome_fantasia,p.razao_social),'status',x.status,'attempts',x.attempts,'error',x.error_message,'updated_at',x.updated_at)) FROM public.maintenance_driver_report_dispatches x JOIN public.maintenance_partners p ON p.id=x.partner_id WHERE x.report_id=r.id AND x.company_id=c),'[]'::jsonb));END IF;
IF action IN ('status','prepare_dispatch') AND r.version IS DISTINCT FROM (b->>'version')::integer THEN RAISE EXCEPTION 'Solicitação alterada. Atualize a página antes de continuar.' USING ERRCODE='40001';END IF;
IF action='status' THEN
IF b->>'status' NOT IN ('nova','analise','pendente','resolvida','cancelada') OR b->>'status' IS NULL THEN RAISE EXCEPTION 'Situação inválida.';END IF;
IF length(coalesce(b->>'feedback',''))>2000 OR (b->>'status' IN ('pendente','resolvida','cancelada') AND length(btrim(coalesce(b->>'feedback','')))<3) THEN RAISE EXCEPTION 'Informe uma resposta para o motorista (até 2000 caracteres).';END IF;
UPDATE public.maintenance_driver_reports SET status=b->>'status',feedback=btrim(coalesce(b->>'feedback','')),resolved_at=CASE WHEN b->>'status'='resolvida' THEN clock_timestamp() ELSE NULL END,version=version+1,updated_at=clock_timestamp(),updated_by=auth.uid() WHERE id=r.id RETURNING * INTO r;
INSERT INTO public.maintenance_driver_report_events(company_id,report_id,actor_id,action,message) VALUES(c,r.id,auth.uid(),'situacao','Situação: '||r.status||'. '||r.feedback);RETURN to_jsonb(r)-'ack_token';END IF;
IF action='prepare_dispatch' THEN
IF r.status IN ('resolvida','cancelada') THEN RAISE EXCEPTION 'Reabra a solicitação antes de encaminhar.';END IF;
selected:=ARRAY(SELECT jsonb_array_elements_text(coalesce(b->'types','[]'::jsonb)));IF NOT maintenance_private.quote_types_valid(selected) OR cardinality(selected)=0 THEN RAISE EXCEPTION 'Selecione os tipos de oficinas. Sem seleção, nenhum envio.';END IF;
UPDATE public.maintenance_driver_reports SET partner_types=selected,status='analise',updated_at=clock_timestamp(),updated_by=auth.uid(),version=version+1 WHERE id=r.id RETURNING * INTO r;
UPDATE public.maintenance_driver_report_dispatches SET status='obsolete',error_message='Oficina fora dos filtros.' WHERE report_id=r.id AND status IN ('pending','failed','unavailable') AND NOT maintenance_private.quote_partner_matches(c,partner_id,selected);
INSERT INTO public.maintenance_driver_report_dispatches(company_id,report_id,partner_id) SELECT c,r.id,p.id FROM public.maintenance_partners p WHERE p.company_id=c AND maintenance_private.quote_partner_matches(c,p.id,selected) ON CONFLICT(report_id,partner_id) DO UPDATE SET status='pending',error_message=NULL WHERE public.maintenance_driver_report_dispatches.status IN ('obsolete','failed','unavailable');
GET DIAGNOSTICS amount=ROW_COUNT;
INSERT INTO public.maintenance_driver_report_events(company_id,report_id,actor_id,action,message) VALUES(c,r.id,auth.uid(),'encaminhamento','Envio preparado com tipos selecionados: '||array_to_string(selected,', '));RETURN jsonb_build_object('prepared',amount,'id',r.id);END IF;
IF action='dispatch_list' THEN RETURN jsonb_build_object('rows',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'status',status)) FROM public.maintenance_driver_report_dispatches WHERE report_id=r.id AND company_id=c),'[]'::jsonb));END IF;
SELECT * INTO dispatch FROM public.maintenance_driver_report_dispatches WHERE id=(b->>'dispatch_id')::uuid AND report_id=r.id AND company_id=c FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'Envio não encontrado.';END IF;
IF action='dispatch_claim' THEN
IF dispatch.status='sending' AND dispatch.started_at<clock_timestamp()-interval '2 minutes' THEN UPDATE public.maintenance_driver_report_dispatches SET status='unknown' WHERE id=dispatch.id;dispatch.status:='unknown';END IF;
IF dispatch.status='accepted' OR dispatch.status='sending' OR (dispatch.status='unknown' AND NOT coalesce((b->>'confirm_uncertain')::boolean,false)) THEN RETURN jsonb_build_object('status',dispatch.status);END IF;
IF r.status IN ('resolvida','cancelada') OR NOT maintenance_private.quote_partner_matches(c,dispatch.partner_id,r.partner_types) THEN IF dispatch.status NOT IN ('unknown','sending') THEN UPDATE public.maintenance_driver_report_dispatches SET status='obsolete' WHERE id=dispatch.id;END IF;RETURN jsonb_build_object('status','obsolete','error','Oficina fora dos filtros ou solicitação encerrada.');END IF;
SELECT * INTO recipient FROM public.maintenance_partners WHERE id=dispatch.partner_id AND company_id=c FOR SHARE;phone:=driver_portal_private.phone(coalesce(nullif(recipient.whatsapp,''),recipient.telefone));
IF phone IS NULL THEN UPDATE public.maintenance_driver_report_dispatches SET status='unavailable',error_message='Contato inválido.' WHERE id=dispatch.id;RETURN jsonb_build_object('status','unavailable');END IF;
UPDATE public.maintenance_driver_report_dispatches SET status='sending',claim_token=gen_random_uuid(),started_at=clock_timestamp(),attempts=attempts+1,updated_at=clock_timestamp(),error_message=NULL WHERE id=dispatch.id RETURNING * INTO dispatch;
RETURN jsonb_build_object('status','claimed','token',dispatch.claim_token,'phone',phone,'snapshot',jsonb_build_object('report',driver_portal_private.report_public(r),'vehicle',r.vehicle_snapshot,'company',(SELECT nome FROM public.companies WHERE id=c),'partner',coalesce(recipient.nome_fantasia,recipient.razao_social)));END IF;
IF action='dispatch_finish' THEN
IF dispatch.claim_token IS DISTINCT FROM (b->>'token')::uuid OR dispatch.status<>'sending' THEN RETURN jsonb_build_object('status',dispatch.status);END IF;
IF b->>'status' NOT IN ('accepted','failed','unknown') OR b->>'status' IS NULL THEN RAISE EXCEPTION 'Resultado inválido.';END IF;
UPDATE public.maintenance_driver_report_dispatches SET status=b->>'status',message_id=left(b->>'message_id',200),updated_at=clock_timestamp(),error_message=CASE b->>'status' WHEN 'failed' THEN 'Falha no envio. Verifique a instância e tente novamente.' WHEN 'unknown' THEN 'Resultado incerto. Confira o WhatsApp antes de repetir.' ELSE NULL END WHERE id=dispatch.id;
INSERT INTO public.maintenance_driver_report_events(company_id,report_id,actor_id,action,message) VALUES(c,r.id,auth.uid(),'envio_oficina','Envio à oficina '||(SELECT coalesce(nome_fantasia,razao_social) FROM public.maintenance_partners WHERE id=dispatch.partner_id)||': '||(b->>'status'));RETURN jsonb_build_object('status',b->>'status');END IF;
RAISE EXCEPTION 'Ação inválida.';
END $$;

-- 2. Cria RPC dedicada public.maintenance_driver_report_delete
CREATE OR REPLACE FUNCTION public.maintenance_driver_report_delete(target_company uuid, report_id uuid)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
  SELECT driver_portal_private.admin_command(target_company, 'delete', jsonb_build_object('id', report_id));
$$;

REVOKE ALL ON FUNCTION public.maintenance_driver_report_delete(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.maintenance_driver_report_delete(uuid, uuid) TO authenticated;

-- 3. Atualiza políticas de DELETE caso necessárias
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'maintenance_driver_reports' AND policyname = 'company_delete'
  ) THEN
    CREATE POLICY company_delete ON public.maintenance_driver_reports
      FOR DELETE TO authenticated
      USING (maintenance_private.partner_access(company_id, true));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'maintenance_driver_report_events' AND policyname = 'company_delete'
  ) THEN
    CREATE POLICY company_delete ON public.maintenance_driver_report_events
      FOR DELETE TO authenticated
      USING (maintenance_private.partner_access(company_id, true));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'maintenance_driver_report_dispatches' AND policyname = 'company_delete'
  ) THEN
    CREATE POLICY company_delete ON public.maintenance_driver_report_dispatches
      FOR DELETE TO authenticated
      USING (maintenance_private.partner_access(company_id, true));
  END IF;
END $$;

COMMIT;
