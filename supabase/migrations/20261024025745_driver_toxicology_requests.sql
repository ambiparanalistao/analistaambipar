BEGIN;
CREATE TABLE public.driver_toxicology_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),company_id uuid NOT NULL REFERENCES public.companies(id),driver_id uuid NOT NULL REFERENCES public.motoristas(id),request_id uuid NOT NULL,actor_id uuid NOT NULL REFERENCES auth.users(id),phone text NOT NULL,content text NOT NULL,status text NOT NULL CHECK(status IN ('sending','accepted','failed','unknown')),claim_token uuid,claimed_at timestamptz NOT NULL DEFAULT clock_timestamp(),attempts integer NOT NULL DEFAULT 1,provider_message_id text,error_message text,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),UNIQUE(company_id,request_id)
);
CREATE INDEX driver_toxicology_recent ON public.driver_toxicology_requests(company_id,driver_id,created_at DESC);
ALTER TABLE public.driver_toxicology_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.driver_toxicology_requests FROM anon,authenticated;
GRANT SELECT ON public.driver_toxicology_requests TO authenticated;
CREATE POLICY driver_toxicology_read ON public.driver_toxicology_requests TO authenticated USING(maintenance_private.partner_access(company_id));
CREATE FUNCTION maintenance_private.driver_toxicology_command(c uuid,action text,b jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid();d public.motoristas;r public.driver_toxicology_requests;recent public.driver_toxicology_requests;phone text;outcome text;message_id text;request uuid:=(b->>'request_id')::uuid;
BEGIN
 IF actor IS NULL OR NOT maintenance_private.partner_access(c) THEN RAISE EXCEPTION 'Sem acesso à empresa.' USING ERRCODE='42501';END IF;
 IF request IS NULL OR action NOT IN ('claim','finish') THEN RAISE EXCEPTION 'Solicitação inválida.';END IF;
 SELECT * INTO d FROM public.motoristas WHERE company_id=c AND id=(b->>'id')::uuid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Motorista não encontrado nesta empresa.' USING ERRCODE='42501';END IF;
 SELECT * INTO r FROM public.driver_toxicology_requests WHERE company_id=c AND request_id=request FOR UPDATE;
 IF FOUND AND r.driver_id<>d.id THEN RAISE EXCEPTION 'Solicitação pertence a outro motorista.' USING ERRCODE='42501';END IF;
 IF action='claim' THEN
  IF r.status='accepted' THEN RETURN jsonb_build_object('status','accepted');END IF;
  IF r.status='sending' AND r.claimed_at>clock_timestamp()-interval '5 minutes' THEN RETURN jsonb_build_object('status','sending');END IF;
  IF r.status IN ('unknown','sending') AND b->'confirm_uncertain' IS DISTINCT FROM 'true'::jsonb THEN RETURN jsonb_build_object('status','unknown','error','Confira o WhatsApp antes de repetir: o envio pode ter sido recebido.');END IF;
  SELECT * INTO recent FROM public.driver_toxicology_requests WHERE company_id=c AND driver_id=d.id AND request_id<>request AND status IN ('sending','unknown') ORDER BY created_at DESC LIMIT 1;
  IF recent.status='sending' AND recent.claimed_at>clock_timestamp()-interval '5 minutes' THEN RETURN jsonb_build_object('status','sending');END IF;
  IF recent.status IN ('unknown','sending') AND b->'confirm_uncertain' IS DISTINCT FROM 'true'::jsonb THEN RETURN jsonb_build_object('status','unknown','error','Há um envio anterior incerto. Confira o WhatsApp antes de repetir.');END IF;
  IF left(trim(coalesce(d.telefone,'')),1)='+' AND regexp_replace(d.telefone,'[^0-9]','','g') NOT LIKE '55%' THEN RAISE EXCEPTION 'Cadastre um telefone brasileiro válido.';END IF;
  phone:=regexp_replace(coalesce(d.telefone,''),'[^0-9]','','g');IF length(phone) IN (10,11) THEN phone:='55'||phone;END IF;
  IF phone !~ '^55[1-9][0-9][2-9][0-9]{7,8}$' THEN RAISE EXCEPTION 'Cadastre um telefone / WhatsApp válido para o motorista.';END IF;
  INSERT INTO public.driver_toxicology_requests(company_id,driver_id,request_id,actor_id,phone,content,status,claim_token) VALUES(c,d.id,request,actor,phone,format(E'Olá, %s!\nPara atualizar seu cadastro de motorista, por favor informe a data de validade do seu exame toxicológico (dia/mês/ano).\nObrigado!',d.nome),'sending',gen_random_uuid()) ON CONFLICT(company_id,request_id) DO UPDATE SET actor_id=actor,phone=excluded.phone,content=excluded.content,status='sending',claim_token=gen_random_uuid(),claimed_at=clock_timestamp(),attempts=public.driver_toxicology_requests.attempts+1,updated_at=clock_timestamp(),error_message=NULL RETURNING * INTO r;
  RETURN jsonb_build_object('status','claimed','token',r.claim_token,'phone',r.phone,'text',r.content);
 END IF;
 IF r.id IS NULL OR r.status<>'sending' OR r.actor_id<>actor OR r.claim_token IS DISTINCT FROM (b->>'token')::uuid THEN RAISE EXCEPTION 'Tentativa expirada.' USING ERRCODE='40001';END IF;
 outcome:=b->>'status';message_id:=nullif(b->>'message_id','');IF outcome IS NULL OR outcome NOT IN ('accepted','failed','unknown') OR length(message_id)>200 OR (outcome='accepted' AND message_id IS NULL) THEN RAISE EXCEPTION 'Resultado inválido.';END IF;
 UPDATE public.driver_toxicology_requests SET status=outcome,provider_message_id=message_id,claim_token=NULL,error_message=CASE outcome WHEN 'accepted' THEN NULL WHEN 'failed' THEN 'Não foi possível enviar. Confira a conexão da Evolution API e o telefone do motorista.' ELSE 'Envio incerto. Confira o WhatsApp antes de repetir.' END,updated_at=clock_timestamp() WHERE id=r.id RETURNING * INTO r;
 RETURN jsonb_build_object('status',r.status,'error',r.error_message);
END $$;
REVOKE ALL ON FUNCTION maintenance_private.driver_toxicology_command(uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION maintenance_private.driver_toxicology_command(uuid,text,jsonb) TO authenticated;
CREATE FUNCTION public.driver_toxicology_request(target_company uuid,command text,body jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT maintenance_private.driver_toxicology_command(target_company,command,body);$$;
REVOKE ALL ON FUNCTION public.driver_toxicology_request(uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.driver_toxicology_request(uuid,text,jsonb) TO authenticated;
COMMIT;
