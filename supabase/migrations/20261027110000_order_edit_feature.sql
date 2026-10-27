BEGIN;

-- 1. Função privada com permissões elevadas para editar dados de S.D.O já gerada
CREATE OR REPLACE FUNCTION maintenance_private.order_edit(c uuid, target_id uuid, b jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
  actor uuid := auth.uid();
  o public.maintenance_orders;
  v public.veiculos;
  r text;
  full_access boolean;
  previous jsonb;
  new_km integer;
  new_desc text;
  new_prioridade text;
  new_tipo text;
  new_partner uuid;
  new_driver uuid;
BEGIN
  IF actor IS NULL OR NOT maintenance_private.partner_access(c) THEN
    RAISE EXCEPTION 'Sem acesso à empresa.' USING ERRCODE='42501';
  END IF;

  SELECT coalesce(m.maintenance_role, CASE m.role WHEN 'administrador' THEN 'admin_empresa' WHEN 'analista' THEN 'analista_transporte' WHEN 'gestor' THEN 'supervisor' ELSE 'operador_logistico' END)
  INTO r FROM public.company_members m WHERE m.company_id=c AND m.user_id=actor AND m.ativo FOR SHARE;

  full_access := r IN ('admin_geral','admin_empresa','analista_transporte');
  IF NOT (full_access OR r IN ('supervisor','operador_logistico')) THEN
    RAISE EXCEPTION 'Edição da SDO não autorizada para o seu perfil.' USING ERRCODE='42501';
  END IF;

  SELECT * INTO o FROM public.maintenance_orders WHERE id=target_id AND company_id=c FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'S.D.O não encontrada nesta empresa.' USING ERRCODE='42501';
  END IF;

  IF o.status IN ('encerrada','cancelada') THEN
    RAISE EXCEPTION 'S.D.O encerrada ou cancelada não pode ser alterada.';
  END IF;

  previous := to_jsonb(o);

  -- Atualizar KM se informado
  IF b ? 'km_abertura' AND nullif(b->>'km_abertura','') IS NOT NULL THEN
    new_km := (b->>'km_abertura')::integer;
    IF new_km IS NOT NULL AND new_km >= 0 THEN
      UPDATE public.maintenance_orders SET km_abertura = new_km WHERE id = o.id;
      UPDATE public.veiculos SET km_atual = greatest(coalesce(km_atual,0), new_km) WHERE id = o.vehicle_id AND company_id = c;
    END IF;
  END IF;

  -- Atualizar Descrição do problema / Defeitos informados
  IF b ? 'descricao_problema' AND length(btrim(coalesce(b->>'descricao_problema',''))) > 0 THEN
    new_desc := btrim(b->>'descricao_problema');
    UPDATE public.maintenance_orders SET descricao_problema = new_desc WHERE id = o.id;
  END IF;

  -- Atualizar Prioridade
  IF b ? 'prioridade' AND nullif(b->>'prioridade','') IS NOT NULL THEN
    new_prioridade := b->>'prioridade';
    IF new_prioridade IN ('baixa','media','alta','critica') THEN
      UPDATE public.maintenance_orders SET prioridade = new_prioridade::public.priority_level WHERE id = o.id;
    END IF;
  END IF;

  -- Atualizar Tipo principal
  IF b ? 'tipo' AND nullif(b->>'tipo','') IS NOT NULL THEN
    new_tipo := b->>'tipo';
    IF new_tipo IN ('preventiva','corretiva','preditiva','sinistro','revisao','inspecao','pneus') THEN
      UPDATE public.maintenance_orders SET tipo = new_tipo::public.maintenance_type WHERE id = o.id;
    END IF;
  END IF;

  -- Atualizar Oficina
  IF b ? 'partner_id' AND nullif(b->>'partner_id','') IS NOT NULL THEN
    new_partner := (b->>'partner_id')::uuid;
    IF EXISTS(SELECT 1 FROM public.maintenance_partners WHERE id = new_partner AND company_id = c AND status='ativo') THEN
      UPDATE public.maintenance_orders SET partner_id = new_partner WHERE id = o.id;
    END IF;
  END IF;

  -- Atualizar Motorista
  IF b ? 'driver_id' THEN
    IF nullif(b->>'driver_id','') IS NOT NULL THEN
      new_driver := (b->>'driver_id')::uuid;
      IF EXISTS(SELECT 1 FROM public.motoristas WHERE id = new_driver AND company_id = c) THEN
        UPDATE public.maintenance_orders SET driver_id = new_driver WHERE id = o.id;
      END IF;
    ELSE
      UPDATE public.maintenance_orders SET driver_id = NULL WHERE id = o.id;
    END IF;
  END IF;

  -- Atualizar Diagnóstico e Serviços Executados
  IF b ? 'diagnostico' THEN
    UPDATE public.maintenance_orders SET diagnostico = nullif(btrim(b->>'diagnostico'),'') WHERE id = o.id;
  END IF;

  IF b ? 'servicos_executados' THEN
    UPDATE public.maintenance_orders SET servicos_executados = nullif(btrim(b->>'servicos_executados'),'') WHERE id = o.id;
  END IF;

  -- Atualizar Código do Serviço (LC 116 / Municipal / CNAE)
  IF b ? 'codigo_servico' THEN
    UPDATE public.maintenance_orders SET codigo_servico = nullif(btrim(b->>'codigo_servico'),'') WHERE id = o.id;
  END IF;

  -- Atualizar Prazos
  IF b ? 'prazo_entrega_dias' THEN
    UPDATE public.maintenance_orders SET prazo_entrega_dias = nullif(b->>'prazo_entrega_dias','')::integer WHERE id = o.id;
  END IF;

  IF b ? 'previsao_entrega' THEN
    UPDATE public.maintenance_orders SET previsao_entrega = nullif(b->>'previsao_entrega','')::timestamptz WHERE id = o.id;
  END IF;

  UPDATE public.maintenance_orders SET updated_at = clock_timestamp() WHERE id = o.id RETURNING * INTO o;

  PERFORM maintenance_private.order_event(
    c,
    o.id,
    'comentario',
    coalesce(nullif(btrim(b->>'observacao_edicao'),''), 'S.D.O editada e atualizada com novas informações/ocorrências da oficina'),
    jsonb_build_object('antes', previous, 'depois', to_jsonb(o))
  );

  RETURN to_jsonb(o);
END;
$$;

REVOKE ALL ON FUNCTION maintenance_private.order_edit(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION maintenance_private.order_edit(uuid,uuid,jsonb) TO authenticated;

-- 2. Exposição via RPC pública autenticada
CREATE OR REPLACE FUNCTION public.maintenance_order_edit(target_company uuid, order_id uuid, body jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
  SELECT maintenance_private.order_edit(target_company, order_id, body);
$$;

REVOKE ALL ON FUNCTION public.maintenance_order_edit(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.maintenance_order_edit(uuid,uuid,jsonb) TO authenticated;

-- 3. Suporte a Código de Serviço na S.D.O e nos Itens de Orçamento
ALTER TABLE public.maintenance_orders ADD COLUMN IF NOT EXISTS codigo_servico text;
GRANT SELECT(codigo_servico), UPDATE(codigo_servico) ON public.maintenance_orders TO authenticated;

ALTER TABLE public.maintenance_order_items ADD COLUMN IF NOT EXISTS codigo_servico text;

CREATE OR REPLACE FUNCTION maintenance_private.normalize_item_ncm() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  NEW.ncm := nullif(regexp_replace(coalesce(NEW.ncm,''),'[.[:space:]]','','g'),'');
  IF NEW.tipo = 'servico' THEN
    NEW.ncm := NULL;
    NEW.codigo_servico := nullif(btrim(coalesce(NEW.codigo_servico, '')), '');
  ELSE
    NEW.codigo_servico := NULL;
  END IF;
  RETURN NEW;
END;
$$;

GRANT SELECT(codigo_servico) ON public.maintenance_order_items TO authenticated;

DO $$ DECLARE def text; BEGIN
  SELECT pg_get_functiondef('maintenance_private.order_document(uuid,uuid)'::regprocedure) INTO def;
  IF def NOT LIKE '%codigo_servico%' THEN
    def := replace(def, '''ncm'',i.ncm)', '''ncm'',i.ncm,''codigo_servico'',i.codigo_servico)');
    EXECUTE def;
  END IF;

  SELECT pg_get_functiondef('maintenance_private.order_command(uuid,text,jsonb)'::regprocedure) INTO def;
  IF def NOT LIKE '%codigo_servico%' THEN
    def := replace(def, 'maintenance_order_items(company_id,order_id,tipo,descricao,quantidade,valor_unitario,created_by,ncm)', 'maintenance_order_items(company_id,order_id,tipo,descricao,quantidade,valor_unitario,created_by,ncm,codigo_servico)');
    def := replace(def, 'nullif(payload->>''ncm'','''')) RETURNING * INTO item', 'nullif(payload->>''ncm'',''''),nullif(payload->>''codigo_servico'','''')) RETURNING * INTO item');
    def := replace(def, 'SET ncm=nullif(payload->>''ncm'',''''),tipo=payload->>''tipo'',descricao=', 'SET codigo_servico=nullif(payload->>''codigo_servico'',''''),ncm=nullif(payload->>''ncm'',''''),tipo=payload->>''tipo'',descricao=');
    EXECUTE def;
  END IF;
END $$;

COMMIT;

