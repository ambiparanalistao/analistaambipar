BEGIN;
DO $outer$ BEGIN IF to_regclass('public.veiculos') IS NULL THEN EXECUTE $ddl$CREATE TABLE public.veiculos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    placa TEXT NOT NULL UNIQUE,
    tipo TEXT NOT NULL,
    marca_modelo TEXT NOT NULL,
    ano_fabricacao INTEGER,
    ano_modelo INTEGER,
    chassi TEXT,
    renavam TEXT,
    capacidade_peso_ton NUMERIC(8, 2),
    capacidade_volume_m3 NUMERIC(8, 2),
    tipo_carga TEXT DEFAULT 'Produtos Químicos / Hazmat',
    combustivel TEXT DEFAULT 'Diesel S10',
    meta_consumo_kml NUMERIC(4, 2) DEFAULT 2.40,
    km_atual INTEGER DEFAULT 0,
    proxima_revisao_km INTEGER,
    validade_crlv DATE,
    validade_cronotacografo DATE,
    validade_cipp DATE,
    validade_civ DATE,
    validade_fumaca_opacidade DATE,
    validade_seguro_ambiental DATE,
    motorista_vinculado TEXT,
    status TEXT DEFAULT 'Disponível' CHECK (status IN ('Disponível', 'Em Viagem', 'Manutenção', 'Bloqueado')),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Usuários autenticados podem visualizar veículos"
    ON public.veiculos FOR SELECT
    TO authenticated
    USING (true);


CREATE POLICY "Usuários autenticados podem inserir veículos"
    ON public.veiculos FOR INSERT
    TO authenticated
    WITH CHECK (true);


CREATE POLICY "Usuários autenticados podem atualizar veículos"
    ON public.veiculos FOR UPDATE
    TO authenticated
    WITH CHECK (true);


CREATE POLICY "Usuários autenticados podem deletar veículos"
    ON public.veiculos FOR DELETE
    TO authenticated
    USING (true);

CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON public.veiculos(placa);
CREATE INDEX IF NOT EXISTS idx_veiculos_status ON public.veiculos(status);
CREATE INDEX IF NOT EXISTS idx_veiculos_tipo ON public.veiculos(tipo);


$ddl$; GRANT SELECT,INSERT,UPDATE,DELETE ON public.veiculos TO authenticated; GRANT ALL ON public.veiculos TO service_role; END IF; END $outer$;
COMMIT;
