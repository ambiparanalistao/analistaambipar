BEGIN;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM pg_available_extensions WHERE name='pg_net') THEN CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;END IF;END $$;
CREATE FUNCTION maintenance_worker_private.tick() RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE credential text;request bigint;BEGIN
IF NOT EXISTS(SELECT 1 FROM public.maintenance_delivery_jobs WHERE status IN ('pending','failed') AND attempts<4 AND next_attempt_at<=clock_timestamp() OR status='running' AND lease_until<clock_timestamp()) THEN RETURN NULL;END IF;
SELECT decrypted_secret INTO credential FROM vault.decrypted_secrets WHERE name='maintenance_worker_secret';IF credential IS NULL THEN RETURN NULL;END IF;
SELECT net.http_post(url:='https://analistaambipar-kappa.vercel.app/api/maintenance-worker',headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||credential),body:='{}'::jsonb,timeout_milliseconds:=240000) INTO request;RETURN request;
END $$;
REVOKE ALL ON FUNCTION maintenance_worker_private.tick() FROM PUBLIC,anon,authenticated;
-- Ativação operacional após confirmar o deployment: cron.schedule('maintenance-delivery-minute','* * * * *','SELECT maintenance_worker_private.tick();').
-- A credencial fica no Vault e na variável sensível da Vercel; nunca no repositório.
COMMIT;
