BEGIN;
ALTER TABLE public.maintenance_orders ADD COLUMN responsavel_id uuid;
ALTER TABLE public.maintenance_orders ADD CONSTRAINT maintenance_orders_responsavel_fk FOREIGN KEY(company_id,responsavel_id) REFERENCES public.company_members(company_id,user_id);
CREATE INDEX maintenance_orders_responsavel_idx ON public.maintenance_orders(company_id,responsavel_id);
ALTER TABLE public.maintenance_messages ADD COLUMN situacao text NOT NULL DEFAULT 'registrada' CHECK(situacao IN ('preparada','confirmada','registrada')),
 ADD COLUMN assunto text CHECK(length(assunto)<=200), ADD COLUMN destinatario text CHECK(length(destinatario)<=320),
 ADD COLUMN efetivada_em timestamptz, ADD COLUMN request_id uuid;
ALTER TABLE public.maintenance_messages ADD CONSTRAINT message_preparation_direction CHECK(situacao<>'preparada' OR (direcao='enviada' AND canal IN ('whatsapp','email')));
CREATE UNIQUE INDEX maintenance_message_request_unique ON public.maintenance_messages(company_id,request_id) WHERE request_id IS NOT NULL;
CREATE INDEX maintenance_messages_contact_idx ON public.maintenance_messages(company_id,order_id,efetivada_em DESC) WHERE situacao<>'preparada';
ALTER TABLE public.maintenance_message_templates ADD COLUMN version integer NOT NULL DEFAULT 1;
ALTER TABLE public.maintenance_settings ADD COLUMN cobranca_ativa boolean NOT NULL DEFAULT true,
 ADD COLUMN cobranca_statuses public.order_status[] NOT NULL DEFAULT ARRAY['em_execucao','aguardando_peca']::public.order_status[],
 ADD COLUMN version integer NOT NULL DEFAULT 1;
ALTER TABLE public.maintenance_settings ADD CONSTRAINT communication_statuses_active CHECK(cardinality(cobranca_statuses) BETWEEN 1 AND 9 AND NOT cobranca_statuses&&ARRAY['encerrada','cancelada']::public.order_status[]);
CREATE TABLE public.maintenance_notifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),company_id uuid NOT NULL REFERENCES public.companies(id),order_id uuid NOT NULL,user_id uuid NOT NULL,
 titulo text NOT NULL,baseline_em timestamptz NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 read_at timestamptz,resolved_at timestamptz,next_reminder_at timestamptz NOT NULL,reminder_count integer NOT NULL DEFAULT 1,
 FOREIGN KEY(order_id,company_id) REFERENCES public.maintenance_orders(id,company_id),FOREIGN KEY(company_id,user_id) REFERENCES public.company_members(company_id,user_id));
CREATE UNIQUE INDEX maintenance_notification_pending ON public.maintenance_notifications(company_id,order_id,user_id) WHERE resolved_at IS NULL;
CREATE INDEX maintenance_notification_order_idx ON public.maintenance_notifications(company_id,order_id);
CREATE INDEX maintenance_notification_recipient_idx ON public.maintenance_notifications(company_id,user_id);
CREATE INDEX maintenance_notification_inbox ON public.maintenance_notifications(company_id,user_id,updated_at DESC) WHERE resolved_at IS NULL;
CREATE TABLE public.maintenance_communication_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),company_id uuid NOT NULL REFERENCES public.companies(id),entity text NOT NULL,entity_id uuid NOT NULL,
 action text NOT NULL,actor_id uuid NOT NULL REFERENCES auth.users(id),occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),before_data jsonb,after_data jsonb);
CREATE INDEX communication_audit_actor_idx ON public.maintenance_communication_audit(actor_id);
CREATE INDEX communication_audit_company ON public.maintenance_communication_audit(company_id,occurred_at DESC);
ALTER TABLE public.maintenance_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_communication_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.maintenance_notifications,public.maintenance_communication_audit FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.maintenance_notifications,public.maintenance_communication_audit TO authenticated;
GRANT ALL ON public.maintenance_notifications,public.maintenance_communication_audit TO service_role;
CREATE POLICY notification_self ON public.maintenance_notifications FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()) AND maintenance_private.partner_access(company_id));
CREATE POLICY communication_audit_read ON public.maintenance_communication_audit FOR SELECT TO authenticated USING(maintenance_private.partner_access(company_id,true));
REVOKE INSERT,UPDATE,DELETE ON public.maintenance_messages,public.maintenance_message_templates,public.maintenance_settings FROM authenticated;
CREATE FUNCTION maintenance_private.communication_stamp() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$ BEGIN
 IF current_user NOT IN ('postgres','service_role','supabase_admin') THEN RAISE EXCEPTION 'Use as ações autorizadas de comunicação.' USING ERRCODE='42501';END IF;
 IF TG_OP='UPDATE' THEN
 IF ROW(NEW.id,NEW.company_id,NEW.created_at,NEW.created_by) IS DISTINCT FROM ROW(OLD.id,OLD.company_id,OLD.created_at,OLD.created_by) THEN RAISE EXCEPTION 'Identidade imutável.';END IF;
 IF TG_TABLE_NAME<>'maintenance_messages' THEN NEW.version:=OLD.version+1;END IF;
 ELSE NEW.created_at:=clock_timestamp();NEW.created_by:=coalesce(auth.uid(),NEW.created_by);END IF;
 NEW.updated_at:=clock_timestamp();RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION maintenance_private.communication_stamp() FROM PUBLIC,anon,authenticated;
DO $$DECLARE t text;BEGIN FOREACH t IN ARRAY ARRAY['maintenance_messages','maintenance_message_templates','maintenance_settings'] LOOP
 EXECUTE format('DROP TRIGGER a_maintenance_audit ON public.%I',t);
 EXECUTE format('CREATE TRIGGER a_maintenance_audit BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION maintenance_private.communication_stamp()',t);
END LOOP;END $$;
DROP TRIGGER b_maintenance_actor ON public.maintenance_settings;
CREATE FUNCTION maintenance_private.communication_changed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF TG_TABLE_NAME='maintenance_messages' THEN
  IF NEW.situacao<>'preparada' AND NEW.canal<>'interno' THEN UPDATE public.maintenance_notifications SET resolved_at=clock_timestamp(),updated_at=clock_timestamp() WHERE company_id=NEW.company_id AND order_id=NEW.order_id AND resolved_at IS NULL;END IF;
  INSERT INTO public.maintenance_order_timeline(company_id,order_id,tipo_evento,descricao,usuario_id,created_by,dados)
  VALUES(NEW.company_id,NEW.order_id,'mensagem',CASE WHEN NEW.canal='interno' THEN 'Anotação interna registrada' WHEN NEW.situacao='preparada' THEN 'Mensagem preparada; envio não confirmado' WHEN NEW.direcao='recebida' THEN 'Resposta da oficina registrada' ELSE 'Envio confirmado pelo usuário' END||' · '||NEW.canal,
   coalesce(auth.uid(),NEW.enviado_por),coalesce(auth.uid(),NEW.created_by),to_jsonb(NEW));
 ELSIF auth.uid() IS NOT NULL THEN
  INSERT INTO public.maintenance_communication_audit(company_id,entity,entity_id,action,actor_id,before_data,after_data)
  VALUES(NEW.company_id,TG_TABLE_NAME,NEW.id,TG_OP,auth.uid(),CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) END,to_jsonb(NEW));
 END IF; RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION maintenance_private.communication_changed() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER communication_message_event AFTER INSERT OR UPDATE ON public.maintenance_messages FOR EACH ROW EXECUTE FUNCTION maintenance_private.communication_changed();
CREATE TRIGGER communication_template_audit AFTER INSERT OR UPDATE ON public.maintenance_message_templates FOR EACH ROW EXECUTE FUNCTION maintenance_private.communication_changed();
CREATE TRIGGER communication_settings_audit AFTER INSERT OR UPDATE ON public.maintenance_settings FOR EACH ROW EXECUTE FUNCTION maintenance_private.communication_changed();
CREATE FUNCTION maintenance_private.seed_communication(c uuid,creator uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 INSERT INTO public.maintenance_settings(company_id,created_by) VALUES(c,creator) ON CONFLICT(company_id) DO NOTHING;
 INSERT INTO public.maintenance_message_templates(company_id,created_by,nome,categoria,conteudo)
 SELECT c,creator,nome,categoria,conteudo FROM (VALUES
 ('Cobrar andamento','andamento','Olá, {nome_parceiro}! Tudo bem? Poderia nos informar o andamento da OS {numero_os} do veículo {placa}? Qual a previsão de entrega?'),
 ('Solicitar orçamento','orcamento','Olá, {nome_parceiro}! Poderia enviar o orçamento da OS {numero_os}, veículo {placa} ({modelo})?'),
 ('Confirmar chegada do veículo','chegada','Olá, {nome_parceiro}! Confirmamos a chegada do veículo {placa} para a OS {numero_os}. Previsão de entrega: {previsao_entrega}.'),
 ('Avisar retirada','retirada','Olá, {nome_parceiro}! Vamos programar a retirada do veículo {placa}, OS {numero_os}. Poderia confirmar a liberação?'),
 ('Solicitar nota fiscal','nota_fiscal','Olá, {nome_parceiro}! Por favor, envie a nota fiscal dos serviços da OS {numero_os}, veículo {placa}.')) t(nome,categoria,conteudo)
 ON CONFLICT(company_id,nome) DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION maintenance_private.seed_communication(uuid,uuid) FROM PUBLIC,anon,authenticated;
DO $$DECLARE c record;BEGIN FOR c IN SELECT id,created_by FROM public.companies LOOP PERFORM maintenance_private.seed_communication(c.id,c.created_by);END LOOP;END $$;
-- Trigger seeds future companies without granting membership or touching existing templates.
CREATE FUNCTION maintenance_private.seed_company_communication() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN PERFORM maintenance_private.seed_communication(NEW.id,NEW.created_by);RETURN NEW;END $$;
REVOKE ALL ON FUNCTION maintenance_private.seed_company_communication() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER maintenance_seed_communication AFTER INSERT ON public.companies FOR EACH ROW EXECUTE FUNCTION maintenance_private.seed_company_communication();
CREATE FUNCTION maintenance_private.communication_contact(c uuid,target_order uuid) RETURNS timestamptz LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT max(coalesce(efetivada_em,created_at)) FROM public.maintenance_messages WHERE company_id=c AND order_id=target_order AND situacao<>'preparada' AND canal<>'interno'
$$;
REVOKE ALL ON FUNCTION maintenance_private.communication_contact(uuid,uuid) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION maintenance_private.process_communication_reminders() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE affected integer;cleared integer;BEGIN
 IF NOT pg_try_advisory_xact_lock(187261,5) THEN RETURN jsonb_build_object('skipped','already_running');END IF;
 PERFORM o.id FROM public.maintenance_orders o WHERE o.status NOT IN ('encerrada','cancelada') OR EXISTS(SELECT 1 FROM public.maintenance_notifications n WHERE n.order_id=o.id AND n.resolved_at IS NULL) ORDER BY o.id FOR UPDATE;
 UPDATE public.maintenance_notifications n SET resolved_at=clock_timestamp(),updated_at=clock_timestamp()
 WHERE n.resolved_at IS NULL AND NOT EXISTS(
 SELECT 1 FROM public.maintenance_orders o JOIN public.companies c ON c.id=o.company_id AND c.ativo JOIN public.maintenance_settings s ON s.company_id=o.company_id AND s.cobranca_ativa
 JOIN public.company_members m ON m.company_id=o.company_id AND m.user_id=coalesce(o.responsavel_id,o.created_by) AND m.ativo
 WHERE o.id=n.order_id AND o.company_id=n.company_id AND o.status=ANY(s.cobranca_statuses) AND m.user_id=n.user_id
 AND coalesce(m.maintenance_role,CASE m.role WHEN 'administrador' THEN 'admin_empresa' WHEN 'analista' THEN 'analista_transporte' WHEN 'gestor' THEN 'supervisor' ELSE 'operador_logistico' END) IN ('admin_geral','admin_empresa','analista_transporte','supervisor','operador_logistico')
 AND greatest(o.data_abertura,coalesce(maintenance_private.communication_contact(o.company_id,o.id),o.data_abertura))=n.baseline_em);
 GET DIAGNOSTICS cleared=ROW_COUNT;
 INSERT INTO public.maintenance_notifications(company_id,order_id,user_id,titulo,baseline_em,next_reminder_at)
 SELECT o.company_id,o.id,coalesce(o.responsavel_id,o.created_by),'Cobrar andamento da OS '||o.numero,
 greatest(o.data_abertura,coalesce(maintenance_private.communication_contact(o.company_id,o.id),o.data_abertura)),clock_timestamp()+make_interval(hours=>s.intervalo_cobranca_horas)
 FROM public.maintenance_orders o JOIN public.companies c ON c.id=o.company_id AND c.ativo
 JOIN public.maintenance_settings s ON s.company_id=o.company_id AND s.cobranca_ativa
 JOIN public.company_members m ON m.company_id=o.company_id AND m.user_id=coalesce(o.responsavel_id,o.created_by) AND m.ativo
 WHERE o.status=ANY(s.cobranca_statuses)
 AND coalesce(m.maintenance_role,CASE m.role WHEN 'administrador' THEN 'admin_empresa' WHEN 'analista' THEN 'analista_transporte' WHEN 'gestor' THEN 'supervisor' ELSE 'operador_logistico' END) IN ('admin_geral','admin_empresa','analista_transporte','supervisor','operador_logistico')
 AND greatest(o.data_abertura,coalesce(maintenance_private.communication_contact(o.company_id,o.id),o.data_abertura))+make_interval(hours=>s.intervalo_cobranca_horas)<=clock_timestamp()
 ON CONFLICT(company_id,order_id,user_id) WHERE resolved_at IS NULL DO UPDATE SET updated_at=clock_timestamp(),read_at=NULL,next_reminder_at=excluded.next_reminder_at,reminder_count=public.maintenance_notifications.reminder_count+1
 WHERE public.maintenance_notifications.next_reminder_at<=clock_timestamp();
 GET DIAGNOSTICS affected=ROW_COUNT;RETURN jsonb_build_object('notified',affected,'resolved',cleared);
END $$;
REVOKE ALL ON FUNCTION maintenance_private.process_communication_reminders() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION maintenance_private.process_communication_reminders() TO service_role;
CREATE FUNCTION maintenance_private.communication_command(c uuid,action text,payload jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid();r text;full_access boolean; o public.maintenance_orders;m public.maintenance_messages;t public.maintenance_message_templates;s public.maintenance_settings;p public.maintenance_partners;
 result jsonb;recipient text;content text;subject text;page_number integer;target uuid;states public.order_status[];scheduler jsonb:=jsonb_build_object('active',false);
BEGIN
 IF actor IS NULL OR NOT maintenance_private.partner_access(c) THEN RAISE EXCEPTION 'Sem acesso à comunicação desta empresa.' USING ERRCODE='42501';END IF;
 SELECT coalesce(cm.maintenance_role,CASE cm.role WHEN 'administrador' THEN 'admin_empresa' WHEN 'analista' THEN 'analista_transporte' WHEN 'gestor' THEN 'supervisor' ELSE 'operador_logistico' END)
 INTO r FROM public.company_members cm WHERE cm.company_id=c AND cm.user_id=actor AND cm.ativo FOR SHARE;
 IF NOT FOUND OR r NOT IN ('admin_geral','admin_empresa','analista_transporte','supervisor','operador_logistico') THEN RAISE EXCEPTION 'Perfil sem acesso à comunicação.' USING ERRCODE='42501';END IF;
 PERFORM 1 FROM public.companies WHERE id=c AND ativo FOR SHARE;IF NOT FOUND THEN RAISE EXCEPTION 'Empresa inativa.' USING ERRCODE='42501';END IF;
 full_access:=r IN ('admin_geral','admin_empresa','analista_transporte');
 SELECT * INTO s FROM public.maintenance_settings WHERE company_id=c;
 IF action IN ('config','template_save','settings_save') AND NOT full_access THEN RAISE EXCEPTION 'Somente Admin/Analista configura a comunicação.' USING ERRCODE='42501';END IF;
 IF action='config' THEN
  IF to_regclass('cron.job') IS NOT NULL THEN EXECUTE 'SELECT jsonb_build_object(''active'',coalesce(bool_or(active),false),''schedule'',max(schedule)) FROM cron.job WHERE jobname=''maintenance-communication-hourly''' INTO scheduler;END IF;
  RETURN jsonb_build_object('settings',to_jsonb(s),'templates',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.nome) FROM public.maintenance_message_templates x WHERE company_id=c),'[]'::jsonb),'scheduler',scheduler);
 END IF;
 IF action='template_save' THEN
  content:=btrim(payload->>'conteudo');
  IF coalesce(length(btrim(payload->>'nome')),0) NOT BETWEEN 1 AND 100 OR coalesce(length(content),0) NOT BETWEEN 1 AND 4000 OR coalesce(length(btrim(payload->>'categoria')),0) NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Informe nome, categoria e conteúdo (até 4000 caracteres).';END IF;
  IF regexp_replace(content,'[{](nome_parceiro|numero_os|placa|modelo|previsao_entrega)[}]','','g')~'[{}]' THEN RAISE EXCEPTION 'Template contém uma variável inválida ou chaves incompletas.';END IF;
  IF nullif(payload->>'id','') IS NOT NULL THEN
   SELECT * INTO t FROM public.maintenance_message_templates WHERE company_id=c AND id=(payload->>'id')::uuid FOR UPDATE;
   IF NOT FOUND OR t.version IS DISTINCT FROM (payload->>'version')::integer THEN RAISE EXCEPTION 'Template alterado por outro usuário. Atualize e tente novamente.';END IF;
   UPDATE public.maintenance_message_templates SET nome=btrim(payload->>'nome'),categoria=btrim(payload->>'categoria'),conteudo=content,ativo=coalesce((payload->>'ativo')::boolean,true) WHERE id=t.id RETURNING * INTO t;
  ELSE INSERT INTO public.maintenance_message_templates(company_id,nome,categoria,conteudo,ativo,created_by) VALUES(c,btrim(payload->>'nome'),btrim(payload->>'categoria'),content,coalesce((payload->>'ativo')::boolean,true),actor) RETURNING * INTO t;END IF;
  RETURN to_jsonb(t);
 END IF;
 IF action='settings_save' THEN
  SELECT * INTO s FROM public.maintenance_settings WHERE company_id=c FOR UPDATE;
  IF NOT FOUND OR s.version IS DISTINCT FROM (payload->>'version')::integer THEN RAISE EXCEPTION 'Configuração alterada. Atualize a página.';END IF;
  IF coalesce((payload->>'intervalo_cobranca_horas')::integer,0) NOT BETWEEN 1 AND 720 THEN RAISE EXCEPTION 'Intervalo deve ser de 1 a 720 horas.';END IF;
  SELECT coalesce(array_agg(value::public.order_status),'{}') INTO states FROM jsonb_array_elements_text(payload->'cobranca_statuses');
  UPDATE public.maintenance_settings SET intervalo_cobranca_horas=(payload->>'intervalo_cobranca_horas')::integer,cobranca_ativa=coalesce((payload->>'cobranca_ativa')::boolean,false),cobranca_statuses=states WHERE company_id=c RETURNING * INTO s;
  UPDATE public.maintenance_notifications SET resolved_at=clock_timestamp(),updated_at=clock_timestamp() WHERE company_id=c AND resolved_at IS NULL;
  RETURN to_jsonb(s);
 END IF;
 IF action='notifications' THEN
  RETURN jsonb_build_object('unread',(SELECT count(*) FROM public.maintenance_notifications WHERE company_id=c AND user_id=actor AND resolved_at IS NULL AND read_at IS NULL),'rows',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM (SELECT * FROM public.maintenance_notifications WHERE company_id=c AND user_id=actor AND resolved_at IS NULL ORDER BY (read_at IS NULL) DESC,updated_at DESC,id LIMIT 20)x),'[]'::jsonb));
 END IF;
 IF action='notification_read' THEN UPDATE public.maintenance_notifications SET read_at=coalesce(read_at,clock_timestamp()) WHERE company_id=c AND user_id=actor AND id=(payload->>'id')::uuid;RETURN '{}'::jsonb;END IF;
 IF action='overview' THEN
  page_number:=greatest(1,coalesce((payload->>'page')::integer,1));
  IF coalesce((payload->>'hours')::integer,24) NOT BETWEEN 1 AND 720 THEN RAISE EXCEPTION 'Filtro deve ser de 1 a 720 horas.';END IF;
  WITH contact AS (
   SELECT order_id,max(coalesce(efetivada_em,created_at)) FILTER(WHERE direcao='enviada') sent,max(coalesce(efetivada_em,created_at)) FILTER(WHERE direcao='recebida') received
   FROM public.maintenance_messages WHERE company_id=c AND situacao<>'preparada' AND canal<>'interno' GROUP BY order_id),
  pending AS (
   SELECT ord.id,ord.numero,ord.status,ord.previsao_entrega,v.placa,coalesce(partner.nome_fantasia,partner.razao_social) oficina,
    coalesce(ord.responsavel_id,ord.created_by) responsavel_id,contact.sent,contact.received,
    CASE WHEN contact.sent IS NULL THEN 'sem_contato' ELSE 'aguardando_resposta' END situacao,
    extract(epoch FROM(clock_timestamp()-coalesce(contact.sent,ord.data_abertura)))/3600 horas
   FROM public.maintenance_orders ord JOIN public.veiculos v ON v.id=ord.vehicle_id JOIN public.maintenance_partners partner ON partner.id=ord.partner_id LEFT JOIN contact ON contact.order_id=ord.id
   WHERE ord.company_id=c AND ord.status NOT IN ('encerrada','cancelada') AND
   ((contact.sent IS NULL AND contact.received IS NULL) OR contact.sent>coalesce(contact.received,'-infinity'::timestamptz))
   AND coalesce(contact.sent,ord.data_abertura)+make_interval(hours=>coalesce((payload->>'hours')::integer,s.intervalo_cobranca_horas,24))<=clock_timestamp())
  SELECT jsonb_build_object('count',(SELECT count(*) FROM pending),'rows',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM (SELECT * FROM pending ORDER BY horas DESC,id OFFSET (page_number-1)*20 LIMIT 20)x),'[]'::jsonb)) INTO result;
  RETURN result;
 END IF;
 SELECT * INTO o FROM public.maintenance_orders WHERE company_id=c AND id=(payload->>'order_id')::uuid;
 IF NOT FOUND THEN RAISE EXCEPTION 'OS não encontrada nesta empresa.';END IF;
 IF action='context' THEN
  RETURN jsonb_build_object('actor_id',actor,'can_manage',full_access,'order',to_jsonb(o),'partner',(SELECT jsonb_build_object('id',id,'nome',coalesce(nome_fantasia,razao_social),'whatsapp',coalesce(whatsapp,telefone),'email',email) FROM public.maintenance_partners WHERE company_id=c AND id=o.partner_id),
  'vehicle',(SELECT jsonb_build_object('placa',placa,'modelo',marca_modelo) FROM public.veiculos WHERE company_id=c AND id=o.vehicle_id),
  'templates',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY nome) FROM public.maintenance_message_templates x WHERE company_id=c AND ativo),'[]'::jsonb),
  'members',CASE WHEN full_access THEN coalesce((SELECT jsonb_agg(jsonb_build_object('id',cm.user_id,'nome',coalesce(pr.full_name,pr.email,cm.user_id::text))) FROM public.company_members cm LEFT JOIN public.profiles pr ON pr.id=cm.user_id WHERE cm.company_id=c AND cm.ativo AND coalesce(cm.maintenance_role,CASE cm.role WHEN 'administrador' THEN 'admin_empresa' WHEN 'analista' THEN 'analista_transporte' WHEN 'gestor' THEN 'supervisor' ELSE 'operador_logistico' END) IN ('admin_geral','admin_empresa','analista_transporte','supervisor','operador_logistico')),'[]'::jsonb) ELSE '[]'::jsonb END,
  'responsavel_nome',(SELECT coalesce(pr.full_name,pr.email,cm.user_id::text) FROM public.company_members cm LEFT JOIN public.profiles pr ON pr.id=cm.user_id WHERE cm.company_id=c AND cm.user_id=coalesce(o.responsavel_id,o.created_by) AND cm.ativo AND coalesce(cm.maintenance_role,CASE cm.role WHEN 'administrador' THEN 'admin_empresa' WHEN 'analista' THEN 'analista_transporte' WHEN 'gestor' THEN 'supervisor' ELSE 'operador_logistico' END) IN ('admin_geral','admin_empresa','analista_transporte','supervisor','operador_logistico')),
  'interval',coalesce(s.intervalo_cobranca_horas,24));
 END IF;
 IF action='history' THEN
  page_number:=greatest(1,coalesce((payload->>'page')::integer,1));
  RETURN jsonb_build_object('count',(SELECT count(*) FROM public.maintenance_messages WHERE company_id=c AND order_id=o.id),
  'rows',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM (SELECT msg.*,coalesce(pr.full_name,pr.email,msg.enviado_por::text) actor_name FROM public.maintenance_messages msg LEFT JOIN public.profiles pr ON pr.id=msg.enviado_por WHERE msg.company_id=c AND msg.order_id=o.id ORDER BY msg.created_at DESC,msg.id OFFSET (page_number-1)*20 LIMIT 20)x),'[]'::jsonb));
 END IF;
 SELECT * INTO o FROM public.maintenance_orders WHERE company_id=c AND id=o.id FOR UPDATE;
 IF action='assign' THEN
  IF NOT full_access THEN RAISE EXCEPTION 'Somente Admin/Analista altera o responsável.' USING ERRCODE='42501';END IF;
  target:=(payload->>'user_id')::uuid;
  PERFORM 1 FROM public.company_members cm WHERE cm.company_id=c AND cm.user_id=target AND cm.ativo AND coalesce(cm.maintenance_role,CASE cm.role WHEN 'administrador' THEN 'admin_empresa' WHEN 'analista' THEN 'analista_transporte' WHEN 'gestor' THEN 'supervisor' ELSE 'operador_logistico' END) IN ('admin_geral','admin_empresa','analista_transporte','supervisor','operador_logistico') FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Selecione um responsável ativo e autorizado nesta empresa.';END IF;
  IF o.version IS DISTINCT FROM (payload->>'version')::integer THEN RAISE EXCEPTION 'OS alterada. Atualize antes de atribuir o responsável.';END IF;
  UPDATE public.maintenance_orders SET responsavel_id=target WHERE id=o.id;
  UPDATE public.maintenance_notifications SET resolved_at=clock_timestamp(),updated_at=clock_timestamp() WHERE company_id=c AND order_id=o.id AND resolved_at IS NULL;
  PERFORM maintenance_private.order_event(c,o.id,'comentario','Responsável da comunicação atualizado',jsonb_build_object('responsavel_anterior',coalesce(o.responsavel_id,o.created_by),'responsavel_novo',target));RETURN '{}'::jsonb;
 END IF;
 IF action='confirm' THEN
  SELECT * INTO m FROM public.maintenance_messages WHERE company_id=c AND order_id=o.id AND id=(payload->>'id')::uuid FOR UPDATE;
  IF NOT FOUND OR m.enviado_por<>actor OR m.direcao<>'enviada' THEN RAISE EXCEPTION 'Você só pode confirmar sua própria preparação de envio.' USING ERRCODE='42501';END IF;
  IF m.situacao='preparada' THEN UPDATE public.maintenance_messages SET situacao='confirmada',efetivada_em=clock_timestamp() WHERE id=m.id RETURNING * INTO m;END IF;RETURN to_jsonb(m);
 END IF;
 IF action NOT IN ('prepare','record') THEN RAISE EXCEPTION 'Ação desconhecida.';END IF;
 content:=btrim(payload->>'conteudo');subject:=coalesce(nullif(btrim(payload->>'assunto'),''),'OS '||o.numero);
 IF coalesce(length(content),0) NOT BETWEEN 1 AND 4000 OR length(subject)>200 OR subject~'[[:cntrl:]]' THEN RAISE EXCEPTION 'Informe mensagem de 1 a 4000 caracteres e assunto de até 200 caracteres.';END IF;
 IF nullif(payload->>'request_id','') IS NULL THEN RAISE EXCEPTION 'Identificador de operação ausente. Atualize a tela.';END IF;
 SELECT * INTO m FROM public.maintenance_messages WHERE company_id=c AND request_id=(payload->>'request_id')::uuid;
 IF FOUND THEN
  IF m.order_id<>o.id OR m.enviado_por<>actor OR m.conteudo<>content OR m.assunto IS DISTINCT FROM subject OR m.canal<>payload->>'canal' OR m.direcao<>coalesce(payload->>'direcao','enviada') THEN RAISE EXCEPTION 'Identificador já utilizado por outra mensagem.';END IF;
  RETURN to_jsonb(m);
 END IF;
 SELECT * INTO p FROM public.maintenance_partners WHERE company_id=c AND id=o.partner_id;
 IF action='prepare' THEN
  IF payload->>'canal'='whatsapp' THEN recipient:=regexp_replace(coalesce(p.whatsapp,p.telefone,''),'[^0-9]','','g');IF length(recipient) IN (10,11) THEN recipient:='55'||recipient;END IF;
   IF length(recipient) NOT BETWEEN 10 AND 15 THEN RAISE EXCEPTION 'Cadastre um WhatsApp/telefone válido na oficina.';END IF;
  ELSIF payload->>'canal'='email' THEN recipient:=btrim(p.email);IF recipient IS NULL OR recipient!~'^[^[:space:]@,;<>]+@[^[:space:]@,;<>]+[.][A-Za-z]{2,}$' THEN RAISE EXCEPTION 'Cadastre um e-mail válido na oficina.';END IF;
  ELSE RAISE EXCEPTION 'Preparação disponível para WhatsApp ou e-mail.';END IF;
 END IF;
 INSERT INTO public.maintenance_messages(company_id,order_id,partner_id,direcao,canal,conteudo,assunto,destinatario,enviado_por,created_by,situacao,efetivada_em,request_id)
 VALUES(c,o.id,o.partner_id,CASE WHEN action='prepare' THEN 'enviada' ELSE payload->>'direcao' END,payload->>'canal',content,subject,recipient,actor,actor,CASE WHEN action='prepare' THEN 'preparada' ELSE 'registrada' END,CASE WHEN action='record' THEN clock_timestamp() END,(payload->>'request_id')::uuid) RETURNING * INTO m;
 RETURN to_jsonb(m);
END $$;
REVOKE ALL ON FUNCTION maintenance_private.communication_command(uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION maintenance_private.communication_command(uuid,text,jsonb) TO authenticated,service_role;
CREATE FUNCTION public.maintenance_communication_command(target_company uuid,command text,body jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT maintenance_private.communication_command(target_company,command,body) $$;
REVOKE ALL ON FUNCTION public.maintenance_communication_command(uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.maintenance_communication_command(uuid,text,jsonb) TO authenticated,service_role;
CREATE FUNCTION maintenance_private.communication_order_changed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 UPDATE public.maintenance_notifications SET resolved_at=clock_timestamp(),updated_at=clock_timestamp()
 WHERE company_id=NEW.company_id AND order_id=NEW.id AND resolved_at IS NULL AND
 (coalesce(NEW.responsavel_id,NEW.created_by) IS DISTINCT FROM coalesce(OLD.responsavel_id,OLD.created_by)
 OR NOT EXISTS(SELECT 1 FROM public.maintenance_settings s WHERE s.company_id=NEW.company_id AND s.cobranca_ativa AND NEW.status=ANY(s.cobranca_statuses)));
 RETURN NEW;END $$;
REVOKE ALL ON FUNCTION maintenance_private.communication_order_changed() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER communication_order_resolution AFTER UPDATE OF status,responsavel_id ON public.maintenance_orders FOR EACH ROW EXECUTE FUNCTION maintenance_private.communication_order_changed();
COMMIT;
