BEGIN;
-- Keep validation of supplied values; optional fields no longer block registration/approval.
DO $upgrade$ DECLARE def text;BEGIN
 SELECT pg_get_functiondef('maintenance_private.registration_profile(jsonb,boolean)'::regprocedure) INTO def;
 IF position('IF required THEN' in def)=0 THEN RAISE EXCEPTION 'Expected profile validation';END IF;
 EXECUTE replace(def,'IF required THEN','IF false THEN');
 SELECT pg_get_functiondef('maintenance_private.registration_base(jsonb)'::regprocedure) INTO def;
 def:=replace(def,'ARRAY[''razao_social'',''cnpj_cpf'',''contato_nome'',''telefone'',''email'',''cep'',''logradouro'',''numero'',''bairro'',''cidade'',''estado'']','ARRAY[''razao_social'',''cnpj_cpf'']');
 def:=replace(def,'IF b->>''telefone'' !~','IF coalesce(nullif(b->>''telefone'',''''),nullif(b->>''whatsapp'','''')) IS NULL THEN RAISE EXCEPTION ''Informe telefone ou WhatsApp.'';END IF; IF nullif(b->>''telefone'','''') IS NOT NULL AND b->>''telefone'' !~');
 def:=replace(def,'IF b->>''email'' !~','IF nullif(b->>''email'','''') IS NOT NULL AND b->>''email'' !~');
 def:=replace(def,'OR b->>''cep'' !~','OR nullif(b->>''cep'','''') IS NOT NULL AND b->>''cep'' !~');
 def:=replace(def,'OR b->>''estado'' !~','OR nullif(b->>''estado'','''') IS NOT NULL AND b->>''estado'' !~');
 def:=replace(def,'IF coalesce(jsonb_array_length(b->''tipos_veiculo_atendidos''),0)=0 THEN RAISE EXCEPTION ''Informe os veículos atendidos.'';END IF;','');
 EXECUTE def;
 SELECT pg_get_functiondef('maintenance_registration_private.external_registration(text,text,jsonb)'::regprocedure) INTO def;
 def:=replace(def,'IF profile->>''aceita_faturado''=''Sim'' AND (data_base->>''prazo_pagamento_dias'')::integer<=0 THEN RAISE EXCEPTION ''Informe o prazo para pagamento faturado.'';END IF;','');EXECUTE def;
END $upgrade$;
ALTER TABLE public.maintenance_partner_requests ADD COLUMN edit_token_hash text UNIQUE, ADD COLUMN edit_expires_at timestamptz, ADD COLUMN edit_version integer NOT NULL DEFAULT 1;
ALTER FUNCTION maintenance_registration_private.external_registration(text,text,jsonb) RENAME TO external_registration_initial;
CREATE FUNCTION maintenance_registration_private.external_registration(invite text,action text,b jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;secret text:=b->>'edit_token';req public.maintenance_partner_requests;hashed text;BEGIN
 IF secret IS NOT NULL AND secret !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'Chave de complemento inválida.';END IF;
 result:=maintenance_registration_private.external_registration_initial(invite,action,b-'edit_token');
 IF action='submit' AND secret IS NOT NULL THEN
 hashed:=encode(sha256(convert_to(secret,'UTF8')),'hex');
 SELECT r.* INTO req FROM public.maintenance_partner_requests r JOIN maintenance_private.partner_invites i ON i.company_id=r.company_id WHERE i.token=invite AND r.request_id=(b->>'request_id')::uuid FOR UPDATE OF r;
 IF req.edit_token_hash IS NOT NULL AND req.edit_token_hash<>hashed THEN RAISE EXCEPTION 'Envio já registrado. Use o link individual recebido.';END IF;
 UPDATE public.maintenance_partner_requests SET edit_token_hash=hashed,edit_expires_at=coalesce(edit_expires_at,clock_timestamp()+interval '30 days') WHERE id=req.id;
 result:=result||jsonb_build_object('can_complete',req.status='pendente');
 END IF;RETURN result;END $$;
REVOKE ALL ON FUNCTION maintenance_registration_private.external_registration(text,text,jsonb) FROM PUBLIC;GRANT EXECUTE ON FUNCTION maintenance_registration_private.external_registration(text,text,jsonb) TO anon,authenticated;
-- Rebind SQL wrapper after renaming its former dependency.
CREATE OR REPLACE FUNCTION public.maintenance_partner_registration(invite text,command text,body jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT maintenance_registration_private.external_registration(invite,command,body);$$;
CREATE FUNCTION maintenance_registration_private.complete_registration(secret text,action text,b jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE req public.maintenance_partner_requests;co public.companies;data_base jsonb;profile jsonb;BEGIN
 IF secret IS NULL OR secret !~ '^[0-9a-f]{64}$' OR octet_length(b::text)>90000 OR jsonb_typeof(b)<>'object' THEN RAISE EXCEPTION 'Link de complemento inválido.';END IF;
 SELECT * INTO req FROM public.maintenance_partner_requests WHERE edit_token_hash=encode(sha256(convert_to(secret,'UTF8')),'hex') AND edit_expires_at>clock_timestamp() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Link de complemento indisponível ou expirado. Contate o analista.';END IF;
 SELECT * INTO co FROM public.companies WHERE id=req.company_id AND ativo;
 IF NOT FOUND THEN RAISE EXCEPTION 'Cadastro indisponível.';END IF;
 IF req.status<>'pendente' THEN
 IF action='load' THEN RETURN jsonb_build_object('company',co.nome,'status',req.status,'editable',false,'protocol',req.protocol);END IF;
 RAISE EXCEPTION 'Solicitação já analisada. Peça ao analista para atualizar o cadastro.';END IF;
 IF action='load' THEN RETURN jsonb_build_object('company',co.nome,'status',req.status,'editable',true,'protocol',req.protocol,'version',req.edit_version,'base',req.payload->'base','profile',req.payload->'profile');END IF;
 IF action IS DISTINCT FROM 'save' OR EXISTS(SELECT 1 FROM jsonb_object_keys(b) k WHERE k NOT IN ('base','profile','version','consent','declaration','website_check')) OR coalesce(b->>'website_check','')<>'' OR b->'consent' IS DISTINCT FROM 'true'::jsonb OR b->'declaration' IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'Confirme a declaração e autorização de análise.';END IF;
 IF b->>'version' IS DISTINCT FROM req.edit_version::text THEN RAISE EXCEPTION 'O cadastro foi atualizado. Reabra seu link antes de salvar.';END IF;
 data_base:=maintenance_private.registration_base(b->'base');profile:=maintenance_private.registration_profile(b->'profile');
 IF data_base->>'cnpj_cpf' IS DISTINCT FROM req.cnpj THEN RAISE EXCEPTION 'Para alterar o CNPJ, contate o analista.';END IF;
 UPDATE public.maintenance_partner_requests SET payload=jsonb_build_object('base',data_base,'profile',profile),edit_version=edit_version+1 WHERE id=req.id;
 INSERT INTO public.maintenance_partner_request_audit(company_id,request_id,action,note) VALUES(req.company_id,req.id,'complementada','Informações complementadas pelo link individual.');
 RETURN jsonb_build_object('protocol',req.protocol,'status','recebida','can_complete',true);END $$;
REVOKE ALL ON FUNCTION maintenance_registration_private.complete_registration(text,text,jsonb) FROM PUBLIC;GRANT EXECUTE ON FUNCTION maintenance_registration_private.complete_registration(text,text,jsonb) TO anon,authenticated;
CREATE FUNCTION public.maintenance_partner_registration_edit(token text,command text,body jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT maintenance_registration_private.complete_registration(token,command,body);$$;
REVOKE ALL ON FUNCTION public.maintenance_partner_registration_edit(text,text,jsonb) FROM PUBLIC;GRANT EXECUTE ON FUNCTION public.maintenance_partner_registration_edit(text,text,jsonb) TO anon,authenticated;
COMMIT;
