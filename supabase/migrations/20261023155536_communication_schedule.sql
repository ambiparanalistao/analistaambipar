-- Native Supabase Cron provisioning. Run after workshop_communication.
-- The disposable vanilla PostgreSQL fixture tests the processor separately; it has no pg_cron engine.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;
SELECT cron.schedule('maintenance-communication-hourly','0 * * * *','SET statement_timeout = ''5min''; SELECT maintenance_private.process_communication_reminders();');
COMMIT;
