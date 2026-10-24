BEGIN;
ALTER TABLE public.motoristas ADD COLUMN IF NOT EXISTS telefone_emergencia text,ADD COLUMN IF NOT EXISTS observacoes text,ADD COLUMN IF NOT EXISTS validade_nr20 date,ADD COLUMN IF NOT EXISTS validade_nr35 date,ADD COLUMN IF NOT EXISTS validade_nr33 date,ADD COLUMN IF NOT EXISTS validade_direcao_defensiva date,ADD COLUMN IF NOT EXISTS validade_cargas_especiais date,ADD COLUMN IF NOT EXISTS validade_hazmat_pae date;
ALTER TABLE public.motoristas ALTER COLUMN nr20 DROP DEFAULT,ALTER COLUMN nr35 DROP DEFAULT;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS prefixo text,ADD COLUMN IF NOT EXISTS motorista_telefone text;
DO $$ DECLARE def text;BEGIN SELECT pg_get_functiondef('maintenance_private.order_document(uuid,uuid)'::regprocedure) INTO def;def:=replace(def,'''renavam'', v.renavam,','');def:=replace(def,',''renavam'',v.renavam','');EXECUTE def;END $$;
COMMIT;
