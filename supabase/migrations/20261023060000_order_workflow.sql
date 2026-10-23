BEGIN;
CREATE OR REPLACE FUNCTION maintenance_private.prepare_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE fleet_status text; workshop_status public.partner_status; year_number integer; serial_number bigint;
        reviewer_role text; approval_limit numeric; parts numeric; labour numeric;
BEGIN
  IF NOT maintenance_private.is_provisioner() AND
     (auth.uid() IS NULL OR NOT maintenance_private.partner_access(NEW.company_id)) THEN
    RAISE EXCEPTION 'No write membership for company' USING ERRCODE='42501';
  END IF;
  IF TG_OP='UPDATE' THEN
    IF ROW(NEW.numero,NEW.vehicle_id,NEW.partner_id,NEW.data_abertura) IS DISTINCT FROM ROW(OLD.numero,OLD.vehicle_id,OLD.partner_id,OLD.data_abertura) THEN
      RAISE EXCEPTION 'Order number, vehicle, partner and opening date are immutable' USING ERRCODE='23514';
    END IF;
  END IF;
  -- Serialize orders on a vehicle; fleet status changes acquire this same row lock.
  SELECT v.status INTO fleet_status FROM public.veiculos v
  WHERE v.id=NEW.vehicle_id AND v.company_id=NEW.company_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Vehicle must belong to the order company' USING ERRCODE='23503'; END IF;
  SELECT p.status INTO workshop_status FROM public.maintenance_partners p
  WHERE p.id=NEW.partner_id AND p.company_id=NEW.company_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Partner must belong to the order company' USING ERRCODE='23503'; END IF;
  IF NEW.status NOT IN ('encerrada','cancelada') AND fleet_status='Em Viagem' THEN
    RAISE EXCEPTION 'Finish the current trip before opening maintenance' USING ERRCODE='23514';
  END IF;
  IF TG_OP='INSERT' AND workshop_status<>'ativo' THEN
    RAISE EXCEPTION 'New orders require an active partner' USING ERRCODE='23514';
  END IF;
  IF TG_OP='INSERT' THEN
    year_number:=extract(year FROM NEW.data_abertura AT TIME ZONE 'America/Sao_Paulo')::integer;
    INSERT INTO maintenance_private.order_counters(company_id,ano,ultimo,created_by)
    VALUES(NEW.company_id,year_number,1,NEW.created_by)
    ON CONFLICT(company_id,ano) DO UPDATE
      SET ultimo=maintenance_private.order_counters.ultimo+1,updated_at=clock_timestamp()
    RETURNING ultimo INTO serial_number;
    NEW.numero:='OS-'||year_number::text||'-'||lpad(serial_number::text,greatest(4,length(serial_number::text)),'0');
  END IF;
  SELECT coalesce(sum(round(i.quantidade*i.valor_unitario,2)) FILTER(WHERE i.tipo='peca'),0),
         coalesce(sum(round(i.quantidade*i.valor_unitario,2)) FILTER(WHERE i.tipo='servico'),0)
  INTO parts,labour FROM public.maintenance_order_items i WHERE i.order_id=NEW.id AND i.company_id=NEW.company_id;
  NEW.valor_pecas:=parts; NEW.valor_mao_obra:=labour;
  IF NEW.orcamento_status IN ('aprovado','reprovado') AND
     (TG_OP='INSERT' OR NEW.orcamento_status IS DISTINCT FROM OLD.orcamento_status
      OR NEW.aprovado_por IS DISTINCT FROM OLD.aprovado_por OR NEW.aprovado_em IS DISTINCT FROM OLD.aprovado_em) THEN
    IF NOT maintenance_private.is_provisioner() THEN
      SELECT coalesce(m.maintenance_role,CASE m.role WHEN 'administrador' THEN 'admin_empresa' WHEN 'analista' THEN 'analista_transporte' WHEN 'gestor' THEN 'supervisor' ELSE 'operador_logistico' END) INTO reviewer_role FROM public.company_members m
      WHERE m.company_id=NEW.company_id AND m.user_id=auth.uid() AND m.ativo;
      IF reviewer_role NOT IN ('admin_geral','admin_empresa','analista_transporte','supervisor') OR reviewer_role IS NULL THEN
        RAISE EXCEPTION 'Budget decisions require gestor or administrador membership' USING ERRCODE='42501';
      END IF;
      SELECT s.limite_aprovacao_supervisor INTO approval_limit FROM public.maintenance_settings s WHERE s.company_id=NEW.company_id;
      IF NEW.orcamento_status='aprovado' AND reviewer_role='supervisor' AND parts+labour>coalesce(approval_limit,5000) THEN
        RAISE EXCEPTION 'Budget exceeds supervisor approval limit' USING ERRCODE='42501';
      END IF;
      IF NEW.orcamento_status='aprovado' THEN NEW.aprovado_por:=auth.uid(); NEW.aprovado_em:=clock_timestamp(); END IF;
    END IF;
  END IF;
  IF NEW.orcamento_status<>'aprovado' THEN NEW.aprovado_por:=NULL; NEW.aprovado_em:=NULL; END IF;
  IF NEW.status='orcamento_aprovado' AND NEW.orcamento_status<>'aprovado' THEN
    RAISE EXCEPTION 'Order status requires an approved budget' USING ERRCODE='23514';
  END IF;
  IF NEW.status='encerrada' THEN
    IF EXISTS(SELECT 1 FROM public.workshop_visits v WHERE v.order_id=NEW.id AND v.company_id=NEW.company_id AND v.saida_em IS NULL) THEN
      RAISE EXCEPTION 'Record workshop departure before closing the order' USING ERRCODE='23514';
    END IF;
    IF TG_OP='INSERT' OR OLD.status<>'encerrada' THEN NEW.encerrada_em:=clock_timestamp(); ELSE NEW.encerrada_em:=OLD.encerrada_em; END IF;
  ELSE NEW.encerrada_em:=NULL;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION maintenance_private.prepare_order() FROM PUBLIC,anon,authenticated;



CREATE OR REPLACE FUNCTION maintenance_private.order_effects()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
BEGIN
  IF NOT maintenance_private.is_provisioner() AND
     (auth.uid() IS NULL OR NOT maintenance_private.partner_access(NEW.company_id)) THEN
    RAISE EXCEPTION 'No write membership for company' USING ERRCODE='42501';
  END IF;
  IF TG_OP='INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.maintenance_order_timeline(company_id,order_id,tipo_evento,status_anterior,status_novo,descricao,usuario_id,created_by)
    VALUES(NEW.company_id,NEW.id,'mudanca_status',CASE WHEN TG_OP='UPDATE' THEN OLD.status END,NEW.status,
      CASE WHEN TG_OP='INSERT' THEN 'OS aberta: ' ELSE 'Status alterado: ' END||NEW.status::text,
      coalesce(auth.uid(),NEW.created_by),coalesce(auth.uid(),NEW.created_by));
  END IF;
  IF TG_OP='UPDATE' AND NEW.orcamento_status IS DISTINCT FROM OLD.orcamento_status THEN
    INSERT INTO public.maintenance_order_timeline(company_id,order_id,tipo_evento,descricao,usuario_id,created_by)
    VALUES(NEW.company_id,NEW.id,'aprovacao','Orçamento: '||NEW.orcamento_status,coalesce(auth.uid(),NEW.created_by),coalesce(auth.uid(),NEW.created_by));
  END IF;
  IF EXISTS(SELECT 1 FROM public.maintenance_orders o WHERE o.company_id=NEW.company_id AND o.vehicle_id=NEW.vehicle_id AND o.status NOT IN ('encerrada','cancelada')) THEN
    UPDATE public.veiculos SET status='Manutenção'
    WHERE id=NEW.vehicle_id AND company_id=NEW.company_id AND status<>'Bloqueado' AND status<>'Manutenção';
  ELSE
    UPDATE public.veiculos SET status='Disponível'
    WHERE id=NEW.vehicle_id AND company_id=NEW.company_id AND status='Manutenção';
  END IF;
  -- prepare_order has already locked this partner, so concurrent closures serialize.
  IF NEW.status='encerrada' THEN UPDATE public.maintenance_partners SET updated_at=clock_timestamp() WHERE id=NEW.partner_id AND company_id=NEW.company_id; END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION maintenance_private.order_effects() FROM PUBLIC,anon,authenticated;




ALTER TABLE public.maintenance_orders ADD COLUMN version integer NOT NULL DEFAULT 1,
 ADD COLUMN km_abertura integer CHECK(km_abertura>=0),
 ADD COLUMN decisao_por uuid REFERENCES auth.users(id),ADD COLUMN decisao_em timestamptz;
CREATE INDEX orders_decision_actor_idx ON public.maintenance_orders(decisao_por);
CREATE INDEX orders_due_idx ON public.maintenance_orders(company_id,previsao_entrega) WHERE status NOT IN ('encerrada','cancelada');
ALTER TABLE public.maintenance_order_timeline ADD COLUMN dados jsonb;
ALTER TABLE public.maintenance_attachments ADD COLUMN content_type text,
 ADD COLUMN tamanho_bytes bigint CHECK(tamanho_bytes BETWEEN 1 AND 20971520);
-- Only validated commands may mutate OS, items, visits, attachments or append timeline events.
REVOKE INSERT,UPDATE,DELETE ON public.maintenance_orders,public.maintenance_order_items,public.maintenance_order_timeline,public.maintenance_attachments,public.workshop_visits FROM authenticated;
CREATE FUNCTION maintenance_private.order_stamp() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF current_user NOT IN ('postgres','service_role','supabase_admin') OR (auth.uid() IS NOT NULL AND NOT maintenance_private.partner_access(NEW.company_id)) THEN RAISE EXCEPTION 'Use as ações autorizadas da OS.' USING ERRCODE='42501';END IF;
 IF TG_OP='UPDATE' THEN
  IF ROW(NEW.id,NEW.company_id,NEW.created_at,NEW.created_by) IS DISTINCT FROM ROW(OLD.id,OLD.company_id,OLD.created_at,OLD.created_by) THEN RAISE EXCEPTION 'Identidade imutável';END IF;
  IF TG_TABLE_NAME='maintenance_orders' THEN NEW.version:=OLD.version+1;END IF;
 ELSE NEW.created_at:=clock_timestamp();NEW.created_by:=coalesce(auth.uid(),NEW.created_by);END IF;
 NEW.updated_at:=clock_timestamp();RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION maintenance_private.order_stamp() FROM PUBLIC,anon,authenticated;
DO $$DECLARE t text;BEGIN FOREACH t IN ARRAY ARRAY['maintenance_orders','maintenance_order_items','maintenance_order_timeline','maintenance_attachments','workshop_visits'] LOOP
 EXECUTE format('DROP TRIGGER a_maintenance_audit ON public.%I',t);
 EXECUTE format('CREATE TRIGGER a_maintenance_audit BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION maintenance_private.order_stamp()',t);
END LOOP;END $$;
CREATE FUNCTION maintenance_private.order_event(c uuid,o uuid,event text,note text,detail jsonb DEFAULT NULL)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 INSERT INTO public.maintenance_order_timeline(company_id,order_id,tipo_evento,descricao,usuario_id,created_by,dados)
 VALUES(c,o,event,note,auth.uid(),auth.uid(),detail);
$$;
REVOKE ALL ON FUNCTION maintenance_private.order_event(uuid,uuid,text,text,jsonb) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION maintenance_private.order_command(c uuid,action text,payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid();r text;o public.maintenance_orders;v public.veiculos;partner public.maintenance_partners;
 target uuid;visit public.workshop_visits;item public.maintenance_order_items;file public.maintenance_attachments;
 destination public.order_status;note text:=btrim(coalesce(payload->>'observacao',''));
 amount numeric;km integer;limit_value numeric;full_access boolean;expected integer;previous jsonb;total numeric;kind text;object_name text;
BEGIN
 IF actor IS NULL OR NOT maintenance_private.partner_access(c) THEN RAISE EXCEPTION 'Sem acesso à empresa.' USING ERRCODE='42501';END IF;
 SELECT coalesce(m.maintenance_role,CASE m.role WHEN 'administrador' THEN 'admin_empresa' WHEN 'analista' THEN 'analista_transporte' WHEN 'gestor' THEN 'supervisor' ELSE 'operador_logistico' END)
 INTO r FROM public.company_members m WHERE m.company_id=c AND m.user_id=actor AND m.ativo FOR SHARE;
 full_access:=r IN ('admin_geral','admin_empresa','analista_transporte');
 IF action='create' THEN
  IF NOT(full_access OR r IN ('supervisor','operador_logistico')) THEN RAISE EXCEPTION 'Abertura não autorizada.' USING ERRCODE='42501';END IF;
  SELECT * INTO v FROM public.veiculos WHERE id=(payload->>'vehicle_id')::uuid AND company_id=c FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Selecione um veículo salvo nesta empresa.';END IF;
  IF v.status IN ('Em Viagem','Bloqueado') THEN RAISE EXCEPTION 'Veículo em viagem ou bloqueado não pode abrir OS.';END IF;
  SELECT * INTO partner FROM public.maintenance_partners WHERE id=(payload->>'partner_id')::uuid AND company_id=c;
  IF NOT FOUND OR partner.status<>'ativo' THEN RAISE EXCEPTION 'Selecione uma oficina ativa desta empresa.';END IF;
  IF nullif(payload->>'driver_id','') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.motoristas WHERE id=(payload->>'driver_id')::uuid AND company_id=c) THEN RAISE EXCEPTION 'Motorista não pertence à empresa.';END IF;
  km:=(payload->>'km_abertura')::integer;
  IF km IS NULL OR km<coalesce(v.km_atual,0) THEN RAISE EXCEPTION 'KM atual deve ser igual ou superior ao odômetro do veículo.';END IF;
  IF nullif(btrim(payload->>'descricao_problema'),'') IS NULL THEN RAISE EXCEPTION 'Descreva o problema.';END IF;
  IF nullif(payload->>'previsao_entrega','')::timestamptz<clock_timestamp() THEN RAISE EXCEPTION 'Previsão deve ser futura.';END IF;
  INSERT INTO public.maintenance_orders(company_id,created_by,vehicle_id,partner_id,driver_id,tipo,prioridade,descricao_problema,km_abertura,previsao_entrega)
  VALUES(c,actor,v.id,partner.id,nullif(payload->>'driver_id','')::uuid,(payload->>'tipo')::public.maintenance_type,(payload->>'prioridade')::public.priority_level,btrim(payload->>'descricao_problema'),km,nullif(payload->>'previsao_entrega','')::timestamptz)
  RETURNING * INTO o;
  UPDATE public.veiculos SET km_atual=greatest(coalesce(km_atual,0),km) WHERE id=v.id;
  RETURN to_jsonb(o);
 END IF;
 target:=(payload->>'id')::uuid;
 SELECT * INTO o FROM public.maintenance_orders WHERE id=target AND company_id=c FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'OS não encontrada nesta empresa.' USING ERRCODE='42501';END IF;
 expected:=(payload->>'version')::integer;
 IF expected IS NULL OR expected<>o.version THEN RAISE EXCEPTION 'OS alterada por outro usuário. Atualize antes de continuar.' USING ERRCODE='40001';END IF;
 IF o.status IN ('encerrada','cancelada') THEN RAISE EXCEPTION 'OS encerrada ou cancelada não pode ser alterada.';END IF;
 SELECT * INTO v FROM public.veiculos WHERE id=o.vehicle_id AND company_id=c FOR UPDATE;
 IF action IN ('transition','summary','item_save','item_delete','attachment_delete') AND NOT full_access THEN RAISE EXCEPTION 'Ação reservada ao administrador ou analista.' USING ERRCODE='42501';END IF;
 IF action IN ('transition','arrival','departure','budget') AND length(note)=0 THEN RAISE EXCEPTION 'Informe uma observação.';END IF;
 IF action IN ('budget','item_save','item_delete') AND o.status IN ('concluido','veiculo_retirado') THEN RAISE EXCEPTION 'Orçamento finalizado; valores não podem ser alterados.';END IF;
 previous:=to_jsonb(o);
 IF action='summary' THEN
  IF o.status IN ('concluido','veiculo_retirado') AND nullif(btrim(payload->>'servicos_executados'),'') IS NULL THEN RAISE EXCEPTION 'Serviços executados são obrigatórios após conclusão.';END IF;
  UPDATE public.maintenance_orders SET diagnostico=nullif(btrim(payload->>'diagnostico'),''),servicos_executados=nullif(btrim(payload->>'servicos_executados'),''),previsao_entrega=nullif(payload->>'previsao_entrega','')::timestamptz WHERE id=o.id;
  PERFORM maintenance_private.order_event(c,o.id,'comentario','Resumo atualizado',jsonb_build_object('antes',previous,'depois',(SELECT to_jsonb(x) FROM public.maintenance_orders x WHERE id=o.id)));
 ELSIF action='budget' THEN
  IF NOT(full_access OR r='supervisor') THEN RAISE EXCEPTION 'Decisão de orçamento não autorizada.' USING ERRCODE='42501';END IF;
  IF payload->>'decisao' NOT IN ('aprovado','reprovado') THEN RAISE EXCEPTION 'Decisão inválida.';END IF;
  IF NOT EXISTS(SELECT 1 FROM public.maintenance_order_items WHERE order_id=o.id AND company_id=c) THEN RAISE EXCEPTION 'Inclua os itens do orçamento.';END IF;
  SELECT limite_aprovacao_supervisor INTO limit_value FROM public.maintenance_settings WHERE company_id=c;
  IF r='supervisor' AND payload->>'decisao'='aprovado' AND o.valor_total>coalesce(limit_value,5000) THEN RAISE EXCEPTION 'Orçamento acima do limite do Supervisor.' USING ERRCODE='42501';END IF;
  UPDATE public.maintenance_orders SET orcamento_status=payload->>'decisao',decisao_por=actor,decisao_em=clock_timestamp(),
   aprovado_por=CASE WHEN payload->>'decisao'='aprovado' THEN actor END,aprovado_em=CASE WHEN payload->>'decisao'='aprovado' THEN clock_timestamp() END,
   status=CASE WHEN o.status IN ('aberta','aguardando_orcamento','orcamento_aprovado') THEN CASE WHEN payload->>'decisao'='aprovado' THEN 'orcamento_aprovado'::public.order_status ELSE 'aguardando_orcamento'::public.order_status END ELSE o.status END WHERE id=o.id;
  PERFORM maintenance_private.order_event(c,o.id,'aprovacao',note,jsonb_build_object('decisao',payload->>'decisao','valor',o.valor_total,'responsavel',actor,'limite',coalesce(limit_value,5000)));
 ELSIF action IN ('item_save','item_delete') THEN
  IF action='item_delete' THEN
   DELETE FROM public.maintenance_order_items WHERE id=(payload->>'item_id')::uuid AND order_id=o.id AND company_id=c RETURNING * INTO item;
   IF NOT FOUND THEN RAISE EXCEPTION 'Item não encontrado.';END IF;
  ELSE
   IF payload->>'tipo' NOT IN ('peca','servico') OR nullif(btrim(payload->>'descricao'),'') IS NULL OR (payload->>'quantidade')::numeric<=0 OR (payload->>'valor_unitario')::numeric<0 OR (payload->>'quantidade')::numeric::text='NaN' OR (payload->>'valor_unitario')::numeric::text='NaN' THEN RAISE EXCEPTION 'Revise descrição, quantidade e valor do item.';END IF;
   IF nullif(payload->>'item_id','') IS NULL THEN
    INSERT INTO public.maintenance_order_items(company_id,order_id,tipo,descricao,quantidade,valor_unitario,created_by)
    VALUES(c,o.id,payload->>'tipo',btrim(payload->>'descricao'),(payload->>'quantidade')::numeric,(payload->>'valor_unitario')::numeric,actor) RETURNING * INTO item;
   ELSE
    UPDATE public.maintenance_order_items SET tipo=payload->>'tipo',descricao=btrim(payload->>'descricao'),quantidade=(payload->>'quantidade')::numeric,valor_unitario=(payload->>'valor_unitario')::numeric WHERE id=(payload->>'item_id')::uuid AND company_id=c AND order_id=o.id RETURNING * INTO item;
    IF NOT FOUND THEN RAISE EXCEPTION 'Item não encontrado.';END IF;
   END IF;
  END IF;
  UPDATE public.maintenance_orders SET decisao_por=NULL,decisao_em=NULL WHERE id=o.id;
  PERFORM maintenance_private.order_event(c,o.id,'comentario',CASE WHEN action='item_delete' THEN 'Item excluído' ELSE 'Item de orçamento salvo' END,jsonb_build_object('item',to_jsonb(item),'orcamento_anterior',previous));
 ELSIF action IN ('arrival','departure') OR (action='transition' AND payload->>'status' IN ('na_oficina','veiculo_retirado')) THEN
  IF NOT(full_access OR r='operador_logistico') THEN RAISE EXCEPTION 'Registro de visita não autorizado.' USING ERRCODE='42501';END IF;
  km:=(payload->>'km')::integer;
  IF km IS NULL OR km<greatest(coalesce(v.km_atual,0),coalesce(o.km_abertura,0),coalesce(o.km_entrada,0)) THEN RAISE EXCEPTION 'KM não pode ser menor que a última leitura conhecida.';END IF;
  object_name:=nullif(payload->>'foto','');
  IF object_name IS NOT NULL AND (object_name NOT LIKE c::text||'/orders/'||o.id::text||'/%' OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='maintenance' AND name=object_name)) THEN RAISE EXCEPTION 'Foto inválida ou não enviada.';END IF;
  IF action='arrival' OR payload->>'status'='na_oficina' THEN
   IF o.status NOT IN ('aberta','aguardando_orcamento','orcamento_aprovado','em_transito') THEN RAISE EXCEPTION 'OS não está aguardando chegada.';END IF;
   INSERT INTO public.workshop_visits(company_id,vehicle_id,order_id,partner_id,km_chegada,foto_chegada_url,created_by,registrado_por)
   VALUES(c,v.id,o.id,o.partner_id,km,object_name,actor,actor) RETURNING * INTO visit;
   UPDATE public.maintenance_orders SET status='na_oficina',km_entrada=km,data_entrada_oficina=visit.chegada_em WHERE id=o.id;
   PERFORM maintenance_private.order_event(c,o.id,'chegada',note,to_jsonb(visit));
  ELSE
   IF o.status<>'concluido' THEN RAISE EXCEPTION 'Conclua os serviços antes de registrar a saída.';END IF;
   UPDATE public.workshop_visits SET saida_em=clock_timestamp(),km_saida=km,foto_saida_url=object_name
   WHERE order_id=o.id AND company_id=c AND saida_em IS NULL RETURNING * INTO visit;
   IF NOT FOUND THEN RAISE EXCEPTION 'Registre a chegada antes da saída.';END IF;
   UPDATE public.maintenance_orders SET status='veiculo_retirado',km_saida=km,data_saida_oficina=visit.saida_em WHERE id=o.id;
   PERFORM maintenance_private.order_event(c,o.id,'saida',note,to_jsonb(visit));
  END IF;
  UPDATE public.veiculos SET km_atual=greatest(coalesce(km_atual,0),km) WHERE id=v.id;
 ELSIF action='transition' THEN
  destination:=(payload->>'status')::public.order_status;
  IF NOT(
   (destination='cancelada' AND o.status NOT IN ('veiculo_retirado','encerrada')) OR
   (o.status='aberta' AND destination='aguardando_orcamento') OR
   (o.status='aguardando_orcamento' AND destination='orcamento_aprovado' AND o.orcamento_status='aprovado') OR
   (o.status='orcamento_aprovado' AND destination='em_transito') OR
   (o.status='na_oficina' AND destination='em_execucao') OR
   (o.status='em_execucao' AND destination IN ('aguardando_peca','concluido')) OR
   (o.status='aguardando_peca' AND destination='em_execucao') OR
   (o.status='veiculo_retirado' AND destination='encerrada')
  ) THEN RAISE EXCEPTION 'Transição não permitida para o status atual.';END IF;
  IF destination='cancelada' AND EXISTS(SELECT 1 FROM public.workshop_visits WHERE order_id=o.id AND saida_em IS NULL) THEN RAISE EXCEPTION 'Registre a saída da oficina antes de cancelar.';END IF;
  IF destination='concluido' THEN
   IF nullif(btrim(payload->>'servicos_executados'),'') IS NULL THEN RAISE EXCEPTION 'Informe os serviços executados.';END IF;
   amount:=(payload->>'valor_final')::numeric;
   IF amount IS NULL OR amount<0 OR amount<>o.valor_total THEN RAISE EXCEPTION 'Valor final deve conferir com o total dos itens. Ajuste o orçamento antes de concluir.';END IF;
   IF o.orcamento_status<>'aprovado' THEN RAISE EXCEPTION 'Aprove o orçamento atualizado antes de concluir.';END IF;
  END IF;
  UPDATE public.maintenance_orders SET status=destination,servicos_executados=CASE WHEN destination='concluido' THEN btrim(payload->>'servicos_executados') ELSE servicos_executados END WHERE id=o.id;
  PERFORM maintenance_private.order_event(c,o.id,'comentario',note,jsonb_build_object('status_anterior',o.status,'status_novo',destination));
 ELSIF action IN ('attachment_add','attachment_delete') THEN
  IF NOT full_access THEN RAISE EXCEPTION 'Anexos de OS exigem administrador ou analista.' USING ERRCODE='42501';END IF;
  IF action='attachment_add' THEN
   object_name:=payload->>'url';kind:=payload->>'tipo';
   IF kind NOT IN ('foto_antes','foto_depois','orcamento','nota_fiscal','outros') OR object_name NOT LIKE c::text||'/orders/'||o.id::text||'/%'
    OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='maintenance' AND name=object_name) THEN RAISE EXCEPTION 'Anexo inválido.';END IF;
   IF kind='orcamento' AND payload->>'content_type'<>'application/pdf' THEN RAISE EXCEPTION 'Orçamento deve ser PDF.';END IF;
   IF kind IN ('foto_antes','foto_depois') AND payload->>'content_type' NOT IN ('image/jpeg','image/png','image/webp') THEN RAISE EXCEPTION 'Selecione uma imagem.';END IF;
   INSERT INTO public.maintenance_attachments(company_id,order_id,tipo,url,nome,enviado_por,created_by,content_type,tamanho_bytes)
   VALUES(c,o.id,kind,object_name,payload->>'nome',actor,actor,payload->>'content_type',(payload->>'tamanho_bytes')::bigint) RETURNING * INTO file;
  ELSE
   DELETE FROM public.maintenance_attachments WHERE id=(payload->>'attachment_id')::uuid AND company_id=c AND order_id=o.id RETURNING * INTO file;
   IF NOT FOUND THEN RAISE EXCEPTION 'Anexo não encontrado.';END IF;
  END IF;
  UPDATE public.maintenance_orders SET updated_at=clock_timestamp() WHERE id=o.id;
  PERFORM maintenance_private.order_event(c,o.id,'anexo',CASE WHEN action='attachment_add' THEN 'Anexo incluído: ' ELSE 'Anexo removido: ' END||file.nome,to_jsonb(file));
 ELSE RAISE EXCEPTION 'Ação desconhecida.';END IF;
 SELECT * INTO o FROM public.maintenance_orders WHERE id=target AND company_id=c;
 RETURN to_jsonb(o);
END $$;
REVOKE ALL ON FUNCTION maintenance_private.order_command(uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION maintenance_private.order_command(uuid,text,jsonb) TO authenticated;
CREATE FUNCTION public.maintenance_order_command(target_company uuid,command text,body jsonb)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT maintenance_private.order_command(target_company,command,body);
$$;
REVOKE ALL ON FUNCTION public.maintenance_order_command(uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.maintenance_order_command(uuid,text,jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION maintenance_private.storage_access(object_name text,writing boolean DEFAULT false)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.company_members m
 WHERE m.company_id::text=split_part(object_name,'/',1) AND m.user_id=(SELECT auth.uid()) AND m.ativo AND length(split_part(object_name,'/',2))>0
 AND CASE WHEN split_part(object_name,'/',2)='partners' THEN
 maintenance_private.partner_access(m.company_id,writing)
 AND EXISTS(SELECT 1 FROM public.maintenance_partners p WHERE p.company_id=m.company_id AND p.id::text=split_part(object_name,'/',3))
 AND length(split_part(object_name,'/',4))>0
 WHEN split_part(object_name,'/',2)='orders' THEN
 maintenance_private.partner_access(m.company_id) AND EXISTS(SELECT 1 FROM public.maintenance_orders o WHERE o.company_id=m.company_id AND o.id::text=split_part(object_name,'/',3) AND (NOT writing OR o.status NOT IN ('encerrada','cancelada')))
 AND (NOT writing OR maintenance_private.partner_access(m.company_id,true) OR (split_part(object_name,'/',4)='visits' AND split_part(object_name,'/',5)<>'' AND coalesce(m.maintenance_role,CASE WHEN m.role='auditor' THEN 'operador_logistico' END)='operador_logistico'))
 ELSE maintenance_private.partner_access(m.company_id,writing) END);
$$;

CREATE FUNCTION maintenance_private.odometer_guard() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN IF OLD.company_id IS NOT NULL AND OLD.km_atual IS NOT NULL AND (NEW.km_atual IS NULL OR NEW.km_atual<OLD.km_atual) THEN RAISE EXCEPTION 'Odômetro não pode diminuir.' USING ERRCODE='23514';END IF;RETURN NEW;END $$;
REVOKE ALL ON FUNCTION maintenance_private.odometer_guard() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER maintenance_odometer_guard BEFORE UPDATE OF km_atual ON public.veiculos FOR EACH ROW EXECUTE FUNCTION maintenance_private.odometer_guard();
CREATE POLICY os_files_immutable ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
USING(bucket_id<>'maintenance' OR split_part(name,'/',2)<>'orders')
WITH CHECK(bucket_id<>'maintenance' OR split_part(name,'/',2)<>'orders');
CREATE POLICY os_files_protect_references ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
USING(bucket_id<>'maintenance' OR split_part(name,'/',2)<>'orders' OR (
 NOT EXISTS(SELECT 1 FROM public.maintenance_attachments a WHERE a.url=storage.objects.name)
 AND NOT EXISTS(SELECT 1 FROM public.workshop_visits v WHERE v.foto_chegada_url=storage.objects.name OR v.foto_saida_url=storage.objects.name)));
CREATE OR REPLACE FUNCTION maintenance_private.actor_and_paths()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $$
DECLARE photo text;
BEGIN
  IF TG_TABLE_NAME='workshop_visits' THEN
    PERFORM 1 FROM public.maintenance_orders o
    WHERE o.id=NEW.order_id AND o.company_id=NEW.company_id AND o.status NOT IN ('encerrada','cancelada') FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Workshop visits require an active order' USING ERRCODE='23514'; END IF;
    IF NOT maintenance_private.is_provisioner() THEN NEW.registrado_por:=auth.uid(); END IF;
  ELSIF TG_TABLE_NAME IN ('maintenance_messages','maintenance_attachments') THEN
    IF NOT maintenance_private.is_provisioner() THEN NEW.enviado_por:=auth.uid(); END IF;
    IF TG_TABLE_NAME='maintenance_messages' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.maintenance_orders o WHERE o.id=NEW.order_id AND o.company_id=NEW.company_id AND o.partner_id=NEW.partner_id
    ) THEN RAISE EXCEPTION 'Message partner must match the order partner' USING ERRCODE='23514'; END IF;
    END IF;
  ELSIF TG_TABLE_NAME='vehicle_occurrences' THEN
    FOREACH photo IN ARRAY NEW.fotos LOOP
      IF photo IS NULL OR photo NOT LIKE NEW.company_id::text||'/%' THEN
        RAISE EXCEPTION 'Photos must use a company-scoped private Storage path' USING ERRCODE='23514';
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME='maintenance_settings' THEN
    IF NOT maintenance_private.is_provisioner() AND NOT EXISTS(
      SELECT 1 FROM public.company_members m WHERE m.company_id=NEW.company_id AND m.user_id=auth.uid() AND m.ativo AND m.role='administrador'
    ) THEN RAISE EXCEPTION 'Only a company administrator can change maintenance settings' USING ERRCODE='42501'; END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION maintenance_private.actor_and_paths() FROM PUBLIC;

COMMIT;
