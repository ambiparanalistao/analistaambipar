BEGIN;
DO $$ DECLARE def text; BEGIN
 SELECT pg_get_functiondef('maintenance_private.order_document(uuid,uuid)'::regprocedure) INTO def;
 IF position('''reporter''' in def)=0 THEN
  def:=replace(def,'''company'',jsonb_build_object','''reporter'',(SELECT jsonb_build_object(''nome'',d.nome,''telefone'',d.telefone) FROM public.motoristas d WHERE d.id=o.driver_id AND d.company_id=c),''company'',jsonb_build_object');
  EXECUTE def;
 END IF;
END $$;
COMMIT;
