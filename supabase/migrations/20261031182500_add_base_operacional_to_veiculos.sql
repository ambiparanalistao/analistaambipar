BEGIN;

-- ==============================================================================
-- Migration: 20261031182500_add_base_operacional_to_veiculos.sql
-- Objetivo: Suporte à separação de veículos por Base Operacional (Base Vale e Base DCX)
-- ==============================================================================

-- 1. Adiciona a coluna base_operacional na tabela veiculos
ALTER TABLE public.veiculos 
  ADD COLUMN IF NOT EXISTS base_operacional text DEFAULT 'Base Vale';

-- 2. Atualiza todos os veículos existentes sem base ou nulos para 'Base Vale'
UPDATE public.veiculos 
  SET base_operacional = 'Base Vale' 
  WHERE base_operacional IS NULL OR btrim(base_operacional) = '';

-- 3. Adiciona constraint CHECK para garantir consistência de dados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_veiculos_base_operacional'
  ) THEN
    ALTER TABLE public.veiculos 
      ADD CONSTRAINT check_veiculos_base_operacional 
      CHECK (base_operacional IN ('Base Vale', 'Base DCX'));
  END IF;
END $$;

-- 4. Cria índice para agilizar consultas filtradas por empresa e base
CREATE INDEX IF NOT EXISTS idx_veiculos_company_base 
  ON public.veiculos (company_id, base_operacional);

COMMIT;
