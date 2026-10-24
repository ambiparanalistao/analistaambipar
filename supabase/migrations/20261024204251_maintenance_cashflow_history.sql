BEGIN;
DO $$ DECLARE def text;BEGIN SELECT pg_get_functiondef('maintenance_private.cashflow(uuid,jsonb)'::regprocedure) INTO def;
IF position('i.status<>''cancelada''' in def)=0 THEN RAISE EXCEPTION 'Contrato do fluxo de caixa não encontrado';END IF;
def:=replace(def,' AND i.status<>''cancelada''','');
def:=replace(def,'s.vencimento BETWEEN start_date AND end_date','s.vencimento BETWEEN start_date AND end_date AND i.status<>''cancelada''');EXECUTE def;END $$;
COMMIT;
