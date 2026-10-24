BEGIN;
CREATE INDEX partner_quotes_order_fk ON public.maintenance_partner_quotes(order_id,company_id);
CREATE INDEX report_orders_order_fk ON public.maintenance_report_orders(order_id,company_id);
CREATE INDEX report_orders_report_fk ON public.maintenance_report_orders(report_id,company_id);
CREATE UNIQUE INDEX maintenance_asset_identification ON public.maintenance_assets(company_id,kind,lower(btrim(code)));
ALTER TABLE public.maintenance_assets ADD CONSTRAINT maintenance_asset_service_reading CHECK(last_service_km IS NULL OR last_service_km>=0);
COMMIT;
