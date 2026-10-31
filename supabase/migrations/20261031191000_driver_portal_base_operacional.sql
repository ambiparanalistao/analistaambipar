BEGIN;

-- ==============================================================================
-- Migration: 20261031191000_driver_portal_base_operacional.sql
-- Objetivo: Incluir base_operacional na listagem de veículos do Portal do Motorista
--           e registrar base_operacional no snapshot das solicitações de manutenção.
-- ==============================================================================

DO $migration$
DECLARE
  def text;
BEGIN
  SELECT pg_get_functiondef('driver_portal_private.gateway(text,text,jsonb)'::regprocedure) INTO def;

  -- 1. Inclui base_operacional na consulta de veículos (action = 'home')
  IF position('''km_atual'',km_atual' in def) > 0 AND position('''base_operacional''' in def) = 0 THEN
    def := replace(
      def,
      '''km_atual'',km_atual',
      '''km_atual'',km_atual,''base_operacional'',coalesce(base_operacional,''Base Vale'')'
    );
  END IF;

  -- 2. Inclui base_operacional no snapshot do veículo salvo na criação de solicitações (action = 'submit')
  IF position('''tipo'',v.tipo' in def) > 0 AND position('''base_operacional'',coalesce(v.base_operacional' in def) = 0 THEN
    def := replace(
      def,
      '''tipo'',v.tipo',
      '''tipo'',v.tipo,''base_operacional'',coalesce(v.base_operacional,''Base Vale'')'
    );
  END IF;

  EXECUTE def;
END $migration$;

COMMIT;
