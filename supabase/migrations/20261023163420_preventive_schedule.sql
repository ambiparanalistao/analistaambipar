BEGIN;
SELECT cron.schedule('maintenance-preventive-daily','0 9 * * *','SET statement_timeout = ''5min''; SELECT maintenance_private.process_preventive_alerts();');
COMMIT;
