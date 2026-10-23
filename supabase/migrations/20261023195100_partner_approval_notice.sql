BEGIN;
CREATE TABLE public.maintenance_partner_approval_notices (
 request_id uuid PRIMARY KEY,company_id uuid NOT NULL,partner_id uuid NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','accepted','failed','unknown','unavailable')),
 phone text,body text NOT NULL,attempts integer NOT NULL DEFAULT 0,claim_token uuid,claimed_at timestamptz,
 provider_message_id text,error_message text,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),accepted_at timestamptz,
 FOREIGN KEY(request_id,company_id) REFERENCES public.maintenance_partner_requests(id,company_id),
 FOREIGN KEY(partner_id,company_id) REFERENCES public.maintenance_partners(id,company_id)
);
CREATE INDEX approval_notice_company ON public.maintenance_partner_approval_notices(company_id,partner_id);
ALTER TABLE public.maintenance_partner_approval_notices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.maintenance_partner_approval_notices FROM PUBLIC,anon,authenticated;
GRANT SELECT(request_id,company_id,partner_id,status,phone,body,attempts,claimed_at,provider_message_id,error_message,created_at,updated_at,accepted_at) ON public.maintenance_partner_approval_notices TO authenticated;
GRANT ALL ON public.maintenance_partner_approval_notices TO service_role;
CREATE POLICY approval_notice_read ON public.maintenance_partner_approval_notices FOR SELECT TO authenticated USING(maintenance_private.partner_access(company_id));
CREATE FUNCTION maintenance_private.queue_partner_approval_notice() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE company_name text;partner_name text;BEGIN
 IF NEW.status='aprovada' AND OLD.status IS DISTINCT FROM 'aprovada' THEN
 SELECT nome INTO company_name FROM public.companies WHERE id=NEW.company_id;
 partner_name:=coalesce(nullif(NEW.payload->'base'->>'nome_fantasia',''),NEW.payload->'base'->>'razao_social');
 INSERT INTO public.maintenance_partner_approval_notices(request_id,company_id,partner_id,body)
 VALUES(NEW.id,NEW.company_id,NEW.partner_id,
 format(E'Parabéns, %s! 🎉

Sua oficina foi aprovada como parceira de %s e poderá continuar prestando serviços à nossa operação, conforme as condições acordadas e a aprovação de cada ordem de serviço.

Agradecemos pela parceria e pela confiança!
Equipe de Transporte e Logística 🤝',partner_name,company_name))
 ON CONFLICT(request_id) DO NOTHING;
 END IF;RETURN NEW;END $$;
REVOKE ALL ON FUNCTION maintenance_private.queue_partner_approval_notice() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER queue_partner_approval_notice AFTER UPDATE OF status ON public.maintenance_partner_requests FOR EACH ROW EXECUTE FUNCTION maintenance_private.queue_partner_approval_notice();
CREATE FUNCTION maintenance_private.partner_approval_notice_command(c uuid,action text,b jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid();n public.maintenance_partner_approval_notices;p public.maintenance_partners;raw_phone text;result_status text;message_id text;BEGIN
 IF actor IS NULL OR NOT maintenance_private.partner_access(c,true) THEN RAISE EXCEPTION 'Somente Admin/Analista podem enviar a aprovação.' USING ERRCODE='42501';END IF;
 PERFORM 1 FROM public.company_members WHERE company_id=c AND user_id=actor AND ativo FOR SHARE;
 PERFORM 1 FROM public.companies WHERE id=c AND ativo FOR SHARE;
 IF NOT FOUND OR NOT maintenance_private.partner_access(c,true) THEN RAISE EXCEPTION 'Acesso revogado.' USING ERRCODE='42501';END IF;
 IF action IS NULL OR action NOT IN ('claim','finish') THEN RAISE EXCEPTION 'Ação inválida.';END IF;
 SELECT * INTO n FROM public.maintenance_partner_approval_notices WHERE company_id=c AND request_id=(b->>'id')::uuid FOR UPDATE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.maintenance_partner_requests WHERE company_id=c AND id=n.request_id AND status='aprovada') THEN RAISE EXCEPTION 'Não há aprovação com mensagem nesta empresa.' USING ERRCODE='42501';END IF;
 IF action='claim' THEN
 IF n.status='accepted' THEN RETURN jsonb_build_object('status','accepted');END IF;
 IF n.status='sending' AND n.claimed_at>clock_timestamp()-interval '5 minutes' THEN RETURN jsonb_build_object('status','sending');END IF;
 IF n.status IN ('unknown','sending') AND b->'confirm_uncertain' IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'Confira o WhatsApp antes de repetir: o envio anterior pode ter sido recebido.';END IF;
 SELECT * INTO p FROM public.maintenance_partners WHERE id=n.partner_id AND company_id=c AND status='ativo' FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'O parceiro deve estar ativo para receber a mensagem.';END IF;
 raw_phone:=regexp_replace(coalesce(nullif(p.whatsapp,''),p.telefone,''),'[^0-9]','','g');
 IF raw_phone ~ '^[1-9][0-9][2-9][0-9]{7,8}$' THEN raw_phone:='55'||raw_phone;END IF;
 IF raw_phone !~ '^55[1-9][0-9][2-9][0-9]{7,8}$' THEN
 UPDATE public.maintenance_partner_approval_notices SET status='unavailable',error_message='Cadastre um WhatsApp válido no parceiro para enviar a mensagem.',updated_at=clock_timestamp() WHERE request_id=n.request_id;
 RETURN jsonb_build_object('status','unavailable','error','Cadastre um WhatsApp válido no parceiro para enviar a mensagem.');END IF;
 UPDATE public.maintenance_partner_approval_notices SET phone=raw_phone,status='sending',attempts=attempts+1,claim_token=gen_random_uuid(),claimed_at=clock_timestamp(),updated_at=clock_timestamp(),error_message=NULL WHERE request_id=n.request_id RETURNING * INTO n;
 INSERT INTO public.maintenance_partner_request_audit(company_id,request_id,actor_id,action,note) VALUES(c,n.request_id,actor,'mensagem_iniciada','Mensagem de aprovação: tentativa '||n.attempts);
 RETURN jsonb_build_object('status','claimed','token',n.claim_token,'phone',n.phone,'text',n.body);
 END IF;
 IF n.status<>'sending' OR n.claim_token IS DISTINCT FROM (b->>'token')::uuid THEN RAISE EXCEPTION 'Tentativa expirada ou já finalizada.' USING ERRCODE='40001';END IF;
 result_status:=b->>'status';IF result_status IS NULL OR result_status NOT IN ('accepted','failed','unknown') THEN RAISE EXCEPTION 'Resultado inválido.';END IF;
 message_id:=nullif(b->>'message_id','');IF length(message_id)>200 OR (result_status='accepted' AND message_id IS NULL) THEN RAISE EXCEPTION 'Identificador do envio inválido.';END IF;
 UPDATE public.maintenance_partner_approval_notices SET status=result_status,provider_message_id=message_id,error_message=CASE result_status WHEN 'accepted' THEN NULL WHEN 'failed' THEN 'Não foi possível enviar. Confira o contato, a configuração e a conexão da Evolution API.' ELSE 'Resultado incerto. Confira o WhatsApp antes de tentar novamente.' END,accepted_at=CASE WHEN result_status='accepted' THEN clock_timestamp() ELSE NULL END,updated_at=clock_timestamp(),claim_token=NULL WHERE request_id=n.request_id RETURNING * INTO n;
 INSERT INTO public.maintenance_partner_request_audit(company_id,request_id,actor_id,action,note) VALUES(c,n.request_id,actor,'mensagem_'||result_status,coalesce('Evolution ID: '||message_id,n.error_message));
 RETURN jsonb_build_object('status',n.status,'error',n.error_message);
END $$;
CREATE FUNCTION public.maintenance_partner_approval_notice(target_company uuid,command text,body jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT maintenance_private.partner_approval_notice_command(target_company,command,body);$$;
REVOKE ALL ON FUNCTION maintenance_private.partner_approval_notice_command(uuid,text,jsonb),public.maintenance_partner_approval_notice(uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION maintenance_private.partner_approval_notice_command(uuid,text,jsonb),public.maintenance_partner_approval_notice(uuid,text,jsonb) TO authenticated;
COMMIT;
