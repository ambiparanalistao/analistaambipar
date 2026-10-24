BEGIN;
DO $$ DECLARE def text; BEGIN
 SELECT pg_get_functiondef('maintenance_private.vehicle_command(uuid,text,jsonb)'::regprocedure) INTO def;
 def:=replace(def,'''id'',id,''placa'',placa,''status'',status) ORDER BY placa','''id'',id,''placa'',placa,''status'',status,''motorista_vinculado'',motorista_vinculado,''marca_modelo'',marca_modelo,''ano_fabricacao'',ano_fabricacao,''ano_modelo'',ano_modelo,''chassi'',chassi,''km_atual'',km_atual) ORDER BY placa');
 def:=replace(def,'''id'',id,''nome'',nome) ORDER BY nome','''id'',id,''nome'',nome,''veiculo_vinculado'',veiculo_vinculado,''telefone'',telefone,''cnh'',cnh,''categoria_cnh'',categoria_cnh) ORDER BY nome');
 EXECUTE def;
END $$;
COMMIT;
