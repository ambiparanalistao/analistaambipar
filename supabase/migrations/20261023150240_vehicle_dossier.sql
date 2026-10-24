BEGIN;
CREATE TABLE public.maintenance_vehicle_preferences (
 company_id uuid NOT NULL REFERENCES public.companies(id), vehicle_id uuid NOT NULL, default_partner_id uuid,
 preferred_partner_ids uuid[] NOT NULL DEFAULT '{}', updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid NOT NULL REFERENCES auth.users(id),
 PRIMARY KEY(company_id,vehicle_id), FOREIGN KEY(vehicle_id,company_id) REFERENCES public.veiculos(id,company_id),
 FOREIGN KEY(default_partner_id,company_id) REFERENCES public.maintenance_partners(id,company_id));
CREATE TABLE public.maintenance_driver_bindings (
 company_id uuid NOT NULL REFERENCES public.companies(id), user_id uuid NOT NULL REFERENCES auth.users(id), driver_id uuid NOT NULL, vehicle_id uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid NOT NULL REFERENCES auth.users(id),
 PRIMARY KEY(company_id,user_id), UNIQUE(company_id,driver_id), UNIQUE(company_id,vehicle_id),
 FOREIGN KEY(driver_id,company_id) REFERENCES public.motoristas(id,company_id), FOREIGN KEY(vehicle_id,company_id) REFERENCES public.veiculos(id,company_id));
CREATE TABLE public.maintenance_vehicle_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id), vehicle_id uuid NOT NULL,
 occurred_at timestamptz NOT NULL, recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(), actor_id uuid REFERENCES auth.users(id),
 kind text NOT NULL, description text NOT NULL, snapshot jsonb NOT NULL, source_key text NOT NULL UNIQUE,
 FOREIGN KEY(vehicle_id,company_id) REFERENCES public.veiculos(id,company_id));
CREATE INDEX vehicle_events_lookup ON public.maintenance_vehicle_events(company_id,vehicle_id,occurred_at DESC,id);
CREATE INDEX occurrence_vehicle_time ON public.vehicle_occurrences(company_id,vehicle_id,ocorreu_em DESC,id);
CREATE TABLE public.maintenance_allocations (
 company_id uuid NOT NULL REFERENCES public.companies(id), kind text NOT NULL CHECK(kind IN ('trip','client')), reference text NOT NULL CHECK(length(reference) BETWEEN 1 AND 100),
 vehicle_id uuid NOT NULL, active boolean NOT NULL DEFAULT true, updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid NOT NULL REFERENCES auth.users(id),
 PRIMARY KEY(company_id,kind,reference), FOREIGN KEY(vehicle_id,company_id) REFERENCES public.veiculos(id,company_id));
CREATE INDEX maintenance_allocations_vehicle ON public.maintenance_allocations(company_id,vehicle_id) WHERE active;
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['maintenance_vehicle_preferences','maintenance_driver_bindings','maintenance_vehicle_events','maintenance_allocations'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON public.%I FROM anon,authenticated',t);
 EXECUTE format('GRANT SELECT ON public.%I TO authenticated',t);
 EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
 EXECUTE format('CREATE POLICY maintenance_read ON public.%I FOR SELECT TO authenticated USING(maintenance_private.partner_access(company_id))',t);
 END LOOP; END $$;
REVOKE INSERT,UPDATE,DELETE ON public.vehicle_occurrences FROM authenticated;
CREATE FUNCTION maintenance_private.vehicle_event_capture() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v uuid; c uuid; a uuid; event_time timestamptz; category text; details jsonb; message text; key text;
BEGIN
 IF TG_TABLE_NAME='maintenance_order_timeline' THEN
  SELECT vehicle_id,company_id INTO v,c FROM public.maintenance_orders WHERE id=NEW.order_id;
  a:=NEW.usuario_id;event_time:=NEW.created_at;category:=NEW.tipo_evento;message:=NEW.descricao;
  SELECT to_jsonb(NEW)||jsonb_build_object('os',o.numero,'oficina',coalesce(p.nome_fantasia,p.razao_social),'vehicle_id',v,'ordem',to_jsonb(o)) INTO details FROM public.maintenance_orders o JOIN public.maintenance_partners p ON p.id=o.partner_id WHERE o.id=NEW.order_id;
  key:='timeline/'||NEW.id;
 ELSIF TG_TABLE_NAME='vehicle_occurrences' THEN
  v:=NEW.vehicle_id;c:=NEW.company_id;a:=auth.uid();event_time:=CASE WHEN TG_OP='INSERT' THEN NEW.ocorreu_em ELSE clock_timestamp() END;category:='ocorrencia';
  message:=CASE WHEN TG_OP='INSERT' THEN 'Ocorrência reportada: ' ELSE 'Ocorrência atualizada: ' END||NEW.tipo;details:=to_jsonb(NEW);key:='occurrence/'||NEW.id||'/'||gen_random_uuid();
 ELSE
  v:=NEW.vehicle_id;c:=NEW.company_id;a:=auth.uid();event_time:=clock_timestamp();category:=CASE WHEN TG_TABLE_NAME='maintenance_vehicle_preferences' THEN 'preferencias' WHEN TG_TABLE_NAME='maintenance_driver_bindings' THEN 'vinculo_motorista' ELSE 'alocacao' END;
  message:=CASE category WHEN 'preferencias' THEN 'Oficinas preferidas atualizadas' WHEN 'vinculo_motorista' THEN 'Vínculo de acesso do motorista atualizado' ELSE 'Alocação registrada/atualizada' END;details:=jsonb_build_object('depois',to_jsonb(NEW),'antes',CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) ELSE NULL END);key:=category||'/'||gen_random_uuid();
 END IF;
 INSERT INTO public.maintenance_vehicle_events(company_id,vehicle_id,occurred_at,actor_id,kind,description,snapshot,source_key) VALUES(c,v,event_time,a,category,message,details,key);
 IF TG_TABLE_NAME='maintenance_driver_bindings' AND TG_OP='UPDATE' THEN
 IF OLD.vehicle_id IS DISTINCT FROM NEW.vehicle_id THEN INSERT INTO public.maintenance_vehicle_events(company_id,vehicle_id,occurred_at,actor_id,kind,description,snapshot,source_key) VALUES(OLD.company_id,OLD.vehicle_id,event_time,a,'vinculo_motorista','Vínculo do motorista transferido para outro veículo',details,'transfer/'||gen_random_uuid());END IF;END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION maintenance_private.vehicle_event_capture() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER vehicle_event_timeline AFTER INSERT ON public.maintenance_order_timeline FOR EACH ROW EXECUTE FUNCTION maintenance_private.vehicle_event_capture();
CREATE TRIGGER vehicle_event_occurrence AFTER INSERT OR UPDATE ON public.vehicle_occurrences FOR EACH ROW EXECUTE FUNCTION maintenance_private.vehicle_event_capture();
CREATE TRIGGER vehicle_event_preferences AFTER INSERT OR UPDATE ON public.maintenance_vehicle_preferences FOR EACH ROW EXECUTE FUNCTION maintenance_private.vehicle_event_capture();
CREATE TRIGGER vehicle_event_binding AFTER INSERT OR UPDATE ON public.maintenance_driver_bindings FOR EACH ROW EXECUTE FUNCTION maintenance_private.vehicle_event_capture();
CREATE TRIGGER vehicle_event_allocation AFTER INSERT OR UPDATE ON public.maintenance_allocations FOR EACH ROW EXECUTE FUNCTION maintenance_private.vehicle_event_capture();
INSERT INTO public.maintenance_vehicle_events(company_id,vehicle_id,occurred_at,actor_id,kind,description,snapshot,source_key)
 SELECT t.company_id,o.vehicle_id,t.created_at,t.usuario_id,t.tipo_evento,t.descricao,to_jsonb(t)||jsonb_build_object('os',o.numero,'oficina',coalesce(p.nome_fantasia,p.razao_social),'ordem',to_jsonb(o)),'timeline/'||t.id
 FROM public.maintenance_order_timeline t JOIN public.maintenance_orders o ON o.id=t.order_id JOIN public.maintenance_partners p ON p.id=o.partner_id;
INSERT INTO public.maintenance_vehicle_events(company_id,vehicle_id,occurred_at,actor_id,kind,description,snapshot,source_key)
 SELECT company_id,vehicle_id,ocorreu_em,created_by,'ocorrencia','Ocorrência reportada: '||tipo,to_jsonb(o),'occurrence/backfill/'||id FROM public.vehicle_occurrences o;
CREATE FUNCTION maintenance_private.vehicle_command(c uuid, action text, payload jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); member public.company_members; r text; v public.veiculos; occurrence public.vehicle_occurrences; binding public.maintenance_driver_bindings;
 data jsonb; partners uuid[]; chosen uuid; photo text; draft jsonb; created public.maintenance_orders; page_number integer; allocation_kind text; ref text;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'Autenticação necessária.' USING ERRCODE='42501'; END IF;
 SELECT m.* INTO member FROM public.company_members m JOIN public.companies co ON co.id=m.company_id AND co.ativo WHERE m.company_id=c AND m.user_id=actor AND m.ativo FOR SHARE OF m;
 IF NOT FOUND THEN RAISE EXCEPTION 'Empresa não autorizada.' USING ERRCODE='42501'; END IF;
 r:=coalesce(member.maintenance_role,CASE member.role WHEN 'administrador' THEN 'admin_empresa' WHEN 'analista' THEN 'analista_transporte' WHEN 'gestor' THEN 'supervisor' ELSE 'operador_logistico' END);
 IF r NOT IN ('admin_geral','admin_empresa','analista_transporte','supervisor','operador_logistico','motorista') THEN RAISE EXCEPTION 'Perfil sem acesso.' USING ERRCODE='42501'; END IF;
 SELECT * INTO binding FROM public.maintenance_driver_bindings WHERE company_id=c AND user_id=actor FOR SHARE;
 IF r='motorista' AND action NOT IN ('driver','report','photo_add') THEN RAISE EXCEPTION 'Acesso restrito ao próprio veículo.' USING ERRCODE='42501'; END IF;
 IF action='driver' THEN
  IF r<>'motorista' THEN RAISE EXCEPTION 'Área exclusiva do motorista.';END IF;
  IF binding.vehicle_id IS NULL THEN RETURN jsonb_build_object('vehicle',null); END IF;
  SELECT * INTO v FROM public.veiculos WHERE id=binding.vehicle_id AND company_id=c;
  RETURN jsonb_build_object('vehicle',jsonb_build_object('id',v.id,'placa',v.placa,'status',v.status,'km_atual',v.km_atual),'workshop',(SELECT jsonb_build_object('nome',coalesce(p.nome_fantasia,p.razao_social),'desde',w.chegada_em) FROM public.workshop_visits w JOIN public.maintenance_partners p ON p.id=w.partner_id WHERE w.company_id=c AND w.vehicle_id=v.id AND w.saida_em IS NULL LIMIT 1));
 END IF;
 IF action='options' THEN
  RETURN jsonb_build_object('vehicles',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'placa',placa,'status',status) ORDER BY placa) FROM public.veiculos WHERE company_id=c),'[]'::jsonb),'drivers',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'nome',nome) ORDER BY nome) FROM public.motoristas WHERE company_id=c),'[]'::jsonb),'partners',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'nome',coalesce(nome_fantasia,razao_social),'status',status)) FROM public.maintenance_partners WHERE company_id=c),'[]'::jsonb));
 END IF;
 IF action='binding_options' THEN
  IF r NOT IN ('admin_geral','admin_empresa') THEN RAISE EXCEPTION 'Somente administrador vincula logins.' USING ERRCODE='42501';END IF;
  RETURN jsonb_build_object('users',coalesce((SELECT jsonb_agg(jsonb_build_object('id',m.user_id,'email',u.email)) FROM public.company_members m JOIN auth.users u ON u.id=m.user_id WHERE m.company_id=c AND m.ativo AND m.maintenance_role='motorista'),'[]'::jsonb),'bindings',coalesce((SELECT jsonb_agg(to_jsonb(b)) FROM public.maintenance_driver_bindings b WHERE b.company_id=c),'[]'::jsonb));
 END IF;
 IF action='available' THEN RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id',f.id,'placa',f.placa) ORDER BY f.placa) FROM public.veiculos f WHERE f.company_id=c AND f.status='Disponível' AND NOT EXISTS(SELECT 1 FROM public.maintenance_orders o WHERE o.vehicle_id=f.id AND o.company_id=c AND o.status NOT IN ('encerrada','cancelada')) AND NOT EXISTS(SELECT 1 FROM public.maintenance_allocations a WHERE a.company_id=c AND a.vehicle_id=f.id AND a.kind='trip' AND a.active)),'[]'::jsonb);END IF;
 IF action='occurrences' THEN
  page_number:=greatest(1,coalesce((payload->>'page')::integer,1));
  SELECT jsonb_build_object('rows',coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb),'count',(SELECT count(*) FROM public.vehicle_occurrences o WHERE o.company_id=c AND (coalesce(payload->>'vehicle_id','')='' OR o.vehicle_id=(payload->>'vehicle_id')::uuid) AND (coalesce(payload->>'gravidade','')='' OR o.gravidade::text=payload->>'gravidade'))) INTO data FROM (
   SELECT o.*,v.placa FROM public.vehicle_occurrences o JOIN public.veiculos v ON v.id=o.vehicle_id WHERE o.company_id=c AND (coalesce(payload->>'vehicle_id','')='' OR o.vehicle_id=(payload->>'vehicle_id')::uuid) AND (coalesce(payload->>'gravidade','')='' OR o.gravidade::text=payload->>'gravidade') ORDER BY o.ocorreu_em DESC,o.id OFFSET (page_number-1)*20 LIMIT 20) t;
  RETURN data;
 END IF;
 IF action IN ('photo_add','from_occurrence','occurrence') THEN
  SELECT * INTO occurrence FROM public.vehicle_occurrences WHERE company_id=c AND id=(payload->>'id')::uuid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ocorrência não encontrada.';END IF;
  chosen:=occurrence.vehicle_id;
 ELSE chosen:=CASE WHEN r='motorista' THEN binding.vehicle_id ELSE nullif(payload->>'vehicle_id','')::uuid END; END IF;
 IF chosen IS NULL THEN RAISE EXCEPTION 'Vincule um veículo válido à empresa.';END IF;
 SELECT * INTO v FROM public.veiculos WHERE company_id=c AND id=chosen;
 IF action NOT IN ('dossier','events','occurrence') THEN SELECT * INTO v FROM public.veiculos WHERE company_id=c AND id=chosen FOR UPDATE;END IF;
 IF NOT FOUND OR (r='motorista' AND (binding.vehicle_id IS DISTINCT FROM v.id OR (action='photo_add' AND occurrence.created_by<>actor))) THEN RAISE EXCEPTION 'Veículo não autorizado.' USING ERRCODE='42501';END IF;
 IF action='occurrence' THEN RETURN to_jsonb(occurrence); END IF;
 IF action='dossier' THEN
  RETURN jsonb_build_object('vehicle',to_jsonb(v),'preferences',(SELECT to_jsonb(p) FROM public.maintenance_vehicle_preferences p WHERE p.company_id=c AND p.vehicle_id=v.id),
  'summary',(SELECT jsonb_build_object('total_os',count(*),'custo_acumulado',coalesce(sum(CASE WHEN status IN ('concluido','veiculo_retirado','encerrada') THEN valor_total ELSE 0 END),0),'ultima_manutencao',max(coalesce(data_saida_oficina,encerrada_em,updated_at)) FILTER(WHERE status IN ('concluido','veiculo_retirado','encerrada'))) FROM public.maintenance_orders WHERE company_id=c AND vehicle_id=v.id),
  'downtime_horas',(SELECT coalesce(sum(extract(epoch FROM(coalesce(saida_em,clock_timestamp())-chegada_em))/3600),0) FROM public.workshop_visits WHERE company_id=c AND vehicle_id=v.id),
  'workshop',(SELECT jsonb_build_object('nome',coalesce(p.nome_fantasia,p.razao_social),'desde',w.chegada_em) FROM public.workshop_visits w JOIN public.maintenance_partners p ON p.id=w.partner_id WHERE w.company_id=c AND w.vehicle_id=v.id AND w.saida_em IS NULL LIMIT 1),
  'next',(SELECT jsonb_build_object('data',min(proxima_data),'km',min(proxima_km)) FROM public.maintenance_plans WHERE company_id=c AND vehicle_id=v.id AND ativo),'attachments',coalesce((SELECT jsonb_agg(to_jsonb(a)) FROM public.maintenance_attachments a JOIN public.maintenance_orders o ON o.id=a.order_id WHERE o.company_id=c AND o.vehicle_id=v.id),'[]'::jsonb));
 END IF;
 IF action='events' THEN
  page_number:=greatest(1,coalesce((payload->>'page')::integer,1));
  RETURN coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM (SELECT e.*,coalesce(pr.full_name,pr.email,e.actor_id::text,'Sistema') AS actor_name FROM public.maintenance_vehicle_events e LEFT JOIN public.profiles pr ON pr.id=e.actor_id WHERE e.company_id=c AND e.vehicle_id=v.id AND (coalesce(payload->>'kind','')='' OR e.kind=payload->>'kind') AND (nullif(payload->>'start','') IS NULL OR e.occurred_at>=((payload->>'start')::date::timestamp AT TIME ZONE 'America/Sao_Paulo')) AND (nullif(payload->>'end','') IS NULL OR e.occurred_at<(((payload->>'end')::date+1)::timestamp AT TIME ZONE 'America/Sao_Paulo')) ORDER BY e.occurred_at DESC,e.id OFFSET (page_number-1)*100 LIMIT 100) t),'[]'::jsonb);
 END IF;
 IF action='report' THEN
  IF length(btrim(coalesce(payload->>'descricao','')))<5 OR length(payload->>'descricao')>5000 THEN RAISE EXCEPTION 'Descrição deve ter entre 5 e 5000 caracteres.';END IF;
  IF r='motorista' AND binding.vehicle_id IS NULL THEN RAISE EXCEPTION 'Motorista deve usar o vínculo autorizado.' USING ERRCODE='42501';END IF;
  IF (nullif(payload->>'latitude','') IS NULL) IS DISTINCT FROM (nullif(payload->>'longitude','') IS NULL) THEN RAISE EXCEPTION 'Informe latitude e longitude juntas.';END IF;
  INSERT INTO public.vehicle_occurrences(company_id,vehicle_id,driver_id,tipo,gravidade,descricao,local,latitude,longitude,created_by)
   VALUES(c,v.id,CASE WHEN r='motorista' THEN binding.driver_id ELSE nullif(payload->>'driver_id','')::uuid END,payload->>'tipo',(payload->>'gravidade')::public.occurrence_severity,btrim(payload->>'descricao'),left(payload->>'local',500),nullif(payload->>'latitude','')::numeric,nullif(payload->>'longitude','')::numeric,actor) RETURNING * INTO occurrence;
  RETURN to_jsonb(occurrence);
 END IF;
 IF action='photo_add' THEN
  IF cardinality(occurrence.fotos)>=10 THEN RAISE EXCEPTION 'Limite de dez fotos.';END IF;
  photo:=payload->>'path';IF photo NOT LIKE c::text||'/occurrences/'||occurrence.id||'/%' OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='maintenance' AND name=photo AND coalesce(metadata->>'mimetype','') IN ('image/jpeg','image/png','image/webp')) THEN RAISE EXCEPTION 'Foto inválida ou não enviada.';END IF;
  UPDATE public.vehicle_occurrences SET fotos=array_append(fotos,photo) WHERE id=occurrence.id AND NOT photo=ANY(fotos) RETURNING * INTO occurrence;
  RETURN to_jsonb(occurrence);
 END IF;
 IF action='from_occurrence' THEN
  IF r NOT IN ('admin_geral','admin_empresa','analista_transporte') THEN RAISE EXCEPTION 'Somente Admin/Analista gera OS pela ocorrência.' USING ERRCODE='42501';END IF;
  IF occurrence.order_id IS NOT NULL THEN RAISE EXCEPTION 'Esta ocorrência já possui uma OS.';END IF;
  draft:=payload->'order';draft:=draft||jsonb_build_object('vehicle_id',v.id,'driver_id',occurrence.driver_id);
  data:=maintenance_private.order_command(c,'create',draft);
  UPDATE public.vehicle_occurrences SET order_id=(data->>'id')::uuid WHERE id=occurrence.id;
  RETURN data;
 END IF;
 IF action='check' THEN IF v.status<>'Disponível' OR EXISTS(SELECT 1 FROM public.maintenance_orders o WHERE o.vehicle_id=v.id AND o.company_id=c AND o.status NOT IN ('encerrada','cancelada')) THEN RAISE EXCEPTION 'Veículo indisponível para escala.';END IF; RETURN to_jsonb(v);END IF;
 IF action='allocate' THEN
  allocation_kind:=payload->>'kind';ref:=payload->>'reference';
  IF v.status<>'Disponível' OR EXISTS(SELECT 1 FROM public.maintenance_orders o WHERE o.vehicle_id=v.id AND o.company_id=c AND o.status NOT IN ('encerrada','cancelada')) OR EXISTS(SELECT 1 FROM public.maintenance_allocations a WHERE a.company_id=c AND a.vehicle_id=v.id AND a.kind='trip' AND a.active AND (a.reference<>ref OR allocation_kind<>'trip')) THEN RAISE EXCEPTION 'Veículo indisponível: manutenção, bloqueio ou viagem ativa.';END IF;
  INSERT INTO public.maintenance_allocations(company_id,kind,reference,vehicle_id,updated_by) VALUES(c,allocation_kind,ref,v.id,actor) ON CONFLICT(company_id,kind,reference) DO UPDATE SET vehicle_id=excluded.vehicle_id,active=true,updated_at=clock_timestamp(),updated_by=actor;
  RETURN to_jsonb(v);
 END IF;
 IF action='release' THEN UPDATE public.maintenance_allocations al SET active=false,updated_by=actor,updated_at=clock_timestamp() WHERE al.company_id=c AND al.kind=payload->>'kind' AND reference=payload->>'reference' AND vehicle_id=v.id;RETURN '{}'::jsonb;END IF;
 IF action='preferences' THEN
  IF r NOT IN ('admin_geral','admin_empresa','analista_transporte') THEN RAISE EXCEPTION 'Seu perfil permite somente consulta.' USING ERRCODE='42501';END IF;
  SELECT coalesce(array_agg(value::uuid),'{}') INTO partners FROM jsonb_array_elements_text(coalesce(payload->'preferred_partner_ids','[]'));
  chosen:=nullif(payload->>'default_partner_id','')::uuid;
  IF EXISTS(SELECT 1 FROM unnest(partners||coalesce(ARRAY[chosen],'{}')) x WHERE x IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.maintenance_partners WHERE id=x AND company_id=c AND status='ativo')) THEN RAISE EXCEPTION 'Selecione oficinas ativas da empresa.';END IF;
  INSERT INTO public.maintenance_vehicle_preferences(company_id,vehicle_id,default_partner_id,preferred_partner_ids,updated_by) VALUES(c,v.id,chosen,partners,actor) ON CONFLICT(company_id,vehicle_id) DO UPDATE SET default_partner_id=excluded.default_partner_id,preferred_partner_ids=excluded.preferred_partner_ids,updated_by=actor,updated_at=clock_timestamp();RETURN '{}'::jsonb;
 END IF;
 IF action='unbind' THEN
  IF r NOT IN ('admin_geral','admin_empresa') THEN RAISE EXCEPTION 'Somente administrador desvincula logins.' USING ERRCODE='42501';END IF;
  DELETE FROM public.maintenance_driver_bindings b WHERE b.company_id=c AND b.vehicle_id=v.id AND b.user_id=(payload->>'user_id')::uuid RETURNING to_jsonb(b) INTO data;
  IF data IS NULL THEN RAISE EXCEPTION 'Vínculo não encontrado ou alterado. Atualize os cadastros.';END IF;
  INSERT INTO public.maintenance_vehicle_events(company_id,vehicle_id,occurred_at,actor_id,kind,description,snapshot,source_key) VALUES(c,v.id,clock_timestamp(),actor,'vinculo_motorista','Acesso do motorista desvinculado',data,'unbind/'||gen_random_uuid());RETURN '{}'::jsonb;
 END IF;
 IF action='bind' THEN
  IF r NOT IN ('admin_geral','admin_empresa') OR NOT EXISTS(SELECT 1 FROM public.company_members WHERE company_id=c AND user_id=(payload->>'user_id')::uuid AND ativo AND maintenance_role='motorista') THEN RAISE EXCEPTION 'Administrador e login de motorista da empresa são necessários.' USING ERRCODE='42501';END IF;
  INSERT INTO public.maintenance_driver_bindings(company_id,user_id,driver_id,vehicle_id,updated_by) VALUES(c,(payload->>'user_id')::uuid,(payload->>'driver_id')::uuid,v.id,actor) ON CONFLICT(company_id,user_id) DO UPDATE SET driver_id=excluded.driver_id,vehicle_id=excluded.vehicle_id,updated_at=clock_timestamp(),updated_by=actor;
  RETURN '{}'::jsonb;
 END IF;
 RAISE EXCEPTION 'Ação desconhecida.';
END $$;
REVOKE ALL ON FUNCTION maintenance_private.vehicle_command(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.maintenance_vehicle_command(target_company uuid,command text,body jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT maintenance_private.vehicle_command(target_company,command,body) $$;
REVOKE ALL ON FUNCTION public.maintenance_vehicle_command(uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.maintenance_vehicle_command(uuid,text,jsonb),maintenance_private.vehicle_command(uuid,text,jsonb) TO authenticated,service_role;
-- Occurrences are writable only through the checked command, including operators/drivers.
DROP TRIGGER a_maintenance_audit ON public.vehicle_occurrences;
CREATE FUNCTION maintenance_private.occurrence_stamp() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF TG_OP='INSERT' THEN NEW.created_by:=coalesce(auth.uid(),NEW.created_by);NEW.created_at:=clock_timestamp();
 ELSE IF ROW(NEW.company_id,NEW.vehicle_id,NEW.driver_id,NEW.created_by,NEW.created_at,NEW.ocorreu_em,NEW.tipo,NEW.gravidade,NEW.descricao) IS DISTINCT FROM ROW(OLD.company_id,OLD.vehicle_id,OLD.driver_id,OLD.created_by,OLD.created_at,OLD.ocorreu_em,OLD.tipo,OLD.gravidade,OLD.descricao) THEN RAISE EXCEPTION 'Ocorrência é um registro permanente.';END IF;END IF;
 NEW.updated_at:=clock_timestamp(); RETURN NEW; END $$;
REVOKE ALL ON FUNCTION maintenance_private.occurrence_stamp() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER a_maintenance_audit BEFORE INSERT OR UPDATE ON public.vehicle_occurrences FOR EACH ROW EXECUTE FUNCTION maintenance_private.occurrence_stamp();
ALTER FUNCTION maintenance_private.storage_access(text,boolean) RENAME TO storage_access_stage3;
CREATE FUNCTION maintenance_private.storage_access(object_name text,writing boolean DEFAULT false) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE c uuid;o public.vehicle_occurrences;BEGIN
 IF split_part(object_name,'/',2)<>'occurrences' THEN RETURN maintenance_private.storage_access_stage3(object_name,writing);END IF;
 IF auth.uid() IS NULL OR split_part(object_name,'/',4)='' OR split_part(object_name,'/',5)<>'' THEN RETURN false;END IF;
 BEGIN c:=split_part(object_name,'/',1)::uuid;EXCEPTION WHEN invalid_text_representation THEN RETURN false;END;
 SELECT * INTO o FROM public.vehicle_occurrences WHERE company_id=c AND id::text=split_part(object_name,'/',3);
 IF NOT FOUND THEN RETURN false;END IF;
 IF maintenance_private.partner_access(c) THEN RETURN true;END IF;
 RETURN EXISTS(SELECT 1 FROM public.maintenance_driver_bindings b JOIN public.company_members m ON m.company_id=b.company_id AND m.user_id=b.user_id JOIN public.companies co ON co.id=b.company_id AND co.ativo WHERE b.company_id=c AND b.user_id=auth.uid() AND b.vehicle_id=o.vehicle_id AND m.ativo AND m.maintenance_role='motorista' AND o.created_by=auth.uid());
END $$;
REVOKE ALL ON FUNCTION maintenance_private.storage_access(text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION maintenance_private.storage_access(text,boolean) TO authenticated,service_role;
-- Existing policies remain bound to the original function OID: replace their expressions.
ALTER POLICY maintenance_storage_read ON storage.objects USING(bucket_id='maintenance' AND maintenance_private.storage_access(name));
ALTER POLICY maintenance_storage_insert ON storage.objects WITH CHECK(bucket_id='maintenance' AND maintenance_private.storage_access(name,true));
ALTER POLICY maintenance_storage_update ON storage.objects USING(bucket_id='maintenance' AND maintenance_private.storage_access(name,true)) WITH CHECK(bucket_id='maintenance' AND maintenance_private.storage_access(name,true));
ALTER POLICY maintenance_storage_delete ON storage.objects USING(bucket_id='maintenance' AND maintenance_private.storage_access(name,true));
ALTER POLICY maintenance_storage_read_boundary ON storage.objects USING(bucket_id<>'maintenance' OR maintenance_private.storage_access(name));
ALTER POLICY maintenance_storage_insert_boundary ON storage.objects WITH CHECK(bucket_id<>'maintenance' OR maintenance_private.storage_access(name,true));
ALTER POLICY maintenance_storage_update_boundary ON storage.objects USING(bucket_id<>'maintenance' OR maintenance_private.storage_access(name,true)) WITH CHECK(bucket_id<>'maintenance' OR maintenance_private.storage_access(name,true));
ALTER POLICY maintenance_storage_delete_boundary ON storage.objects USING(bucket_id<>'maintenance' OR maintenance_private.storage_access(name,true));
CREATE POLICY occurrence_files_immutable ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated USING(bucket_id<>'maintenance' OR split_part(name,'/',2)<>'occurrences') WITH CHECK(bucket_id<>'maintenance' OR split_part(name,'/',2)<>'occurrences');
CREATE POLICY occurrence_files_permanent ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated USING(bucket_id<>'maintenance' OR split_part(name,'/',2)<>'occurrences');
CREATE FUNCTION maintenance_private.trip_blocks_order() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.maintenance_allocations a WHERE a.company_id=NEW.company_id AND a.vehicle_id=NEW.vehicle_id AND a.kind='trip' AND a.active) THEN RAISE EXCEPTION 'Conclua a viagem ativa antes de abrir manutenção.';END IF; RETURN NEW;END $$;
REVOKE ALL ON FUNCTION maintenance_private.trip_blocks_order() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER b_trip_blocks_order BEFORE INSERT ON public.maintenance_orders FOR EACH ROW EXECUTE FUNCTION maintenance_private.trip_blocks_order();

-- Full legacy fleet tables are not a driver API; restricted drivers use the minimal checked projection.
CREATE FUNCTION maintenance_private.is_limited_actor() RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.company_members WHERE user_id=auth.uid() AND ativo AND maintenance_role IN ('motorista','cliente')) AND NOT EXISTS(SELECT 1 FROM public.company_members WHERE user_id=auth.uid() AND ativo AND coalesce(maintenance_role,CASE role WHEN 'administrador' THEN 'admin_empresa' WHEN 'analista' THEN 'analista_transporte' WHEN 'gestor' THEN 'supervisor' ELSE 'operador_logistico' END) IN ('admin_geral','admin_empresa','analista_transporte','supervisor','operador_logistico'))
$$;
REVOKE ALL ON FUNCTION maintenance_private.is_limited_actor() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION maintenance_private.is_limited_actor() TO authenticated,service_role;
CREATE POLICY driver_fleet_boundary ON public.veiculos AS RESTRICTIVE FOR ALL TO authenticated USING(NOT maintenance_private.is_limited_actor() AND (company_id IS NULL OR maintenance_private.partner_access(company_id))) WITH CHECK(NOT maintenance_private.is_limited_actor() AND (company_id IS NULL OR maintenance_private.partner_access(company_id)));
CREATE POLICY driver_registry_boundary ON public.motoristas AS RESTRICTIVE FOR ALL TO authenticated USING(NOT maintenance_private.is_limited_actor()) WITH CHECK(NOT maintenance_private.is_limited_actor());
COMMIT;
