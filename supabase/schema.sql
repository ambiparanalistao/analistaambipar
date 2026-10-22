-- ==============================================================================
-- ANALISTA AMBIPAR - SCHEMA INICIAL & POLÍTICAS RLS (SUPABASE)
-- Execute este script no SQL Editor do seu painel Supabase (Dashboard -> SQL Editor)
-- ==============================================================================

-- 1. Habilitar extensão para geração de UUIDs (caso ainda não esteja ativa)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABELA DE PERFIS DE USUÁRIOS (vinculada ao Supabase Auth)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'analista' CHECK (role IN ('analista', 'gestor', 'auditor', 'administrador')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Ativar Row Level Security (RLS) para profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para profiles:
DROP POLICY IF EXISTS "Usuários podem visualizar qualquer perfil autenticado" ON public.profiles;
CREATE POLICY "Usuários podem visualizar qualquer perfil autenticado"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- ==============================================================================
-- 3. TRIGGER AUTOMÁTICO: Cria o perfil público ao registrar no Supabase Auth
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        'analista'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador no evento de criação de novo usuário no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 4. TABELA DE LAUDOS E LICENÇAS AMBIENTAIS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.laudos_ambientais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('Licença de Operação', 'MTR', 'Relatório Técnico', 'Certificado de Destinação', 'Auditoria ESG')),
    status TEXT DEFAULT 'Em Análise' CHECK (status IN ('Pendente', 'Em Análise', 'Aprovado', 'Reprovado', 'Concluído')),
    codigo_documento TEXT,
    orgao_emissor TEXT DEFAULT 'IBAMA / Órgão Estadual',
    data_emissao DATE DEFAULT CURRENT_DATE,
    data_validade DATE,
    arquivo_url TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

ALTER TABLE public.laudos_ambientais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários autenticados podem visualizar laudos" ON public.laudos_ambientais;
CREATE POLICY "Usuários autenticados podem visualizar laudos"
    ON public.laudos_ambientais FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem cadastrar laudos" ON public.laudos_ambientais;
CREATE POLICY "Usuários autenticados podem cadastrar laudos"
    ON public.laudos_ambientais FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus laudos" ON public.laudos_ambientais;
CREATE POLICY "Usuários podem atualizar seus laudos"
    ON public.laudos_ambientais FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- ==============================================================================
-- 5. TABELA DE REGISTROS DE RESÍDUOS E DESTINAÇÃO (MTR)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.registros_residuos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    empresa_origem TEXT NOT NULL,
    tipo_residuo TEXT NOT NULL,
    classe TEXT CHECK (classe IN ('Classe I - Perigosos', 'Classe II A - Não Inertes', 'Classe II B - Inertes')),
    quantidade_kg NUMERIC(12, 2) NOT NULL,
    destinacao_final TEXT NOT NULL,
    transportador TEXT,
    data_descarte DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

ALTER TABLE public.registros_residuos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários autenticados podem visualizar resíduos" ON public.registros_residuos;
CREATE POLICY "Usuários autenticados podem visualizar resíduos"
    ON public.registros_residuos FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem inserir resíduos" ON public.registros_residuos;
CREATE POLICY "Usuários autenticados podem inserir resíduos"
    ON public.registros_residuos FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 6. TABELA DE INDICADORES ESG E CRÉDITOS DE CARBONO
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.indicadores_esg (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ano INT NOT NULL,
    mes INT NOT NULL CHECK (mes BETWEEN 1 AND 12),
    emissoes_co2_ton NUMERIC(10, 2) DEFAULT 0,
    energia_kwh NUMERIC(12, 2) DEFAULT 0,
    agua_consumo_m3 NUMERIC(10, 2) DEFAULT 0,
    taxa_reciclagem_pct NUMERIC(5, 2) DEFAULT 0,
    compensacao_carbono_ton NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    UNIQUE (ano, mes)
);

ALTER TABLE public.indicadores_esg ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários autenticados podem visualizar indicadores ESG" ON public.indicadores_esg;
CREATE POLICY "Usuários autenticados podem visualizar indicadores ESG"
    ON public.indicadores_esg FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem inserir ou editar indicadores ESG" ON public.indicadores_esg;
CREATE POLICY "Usuários autenticados podem inserir ou editar indicadores ESG"
    ON public.indicadores_esg FOR ALL
    TO authenticated
    USING (true);

-- ==============================================================================
-- 7. ÍNDICES DE PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_laudos_status ON public.laudos_ambientais(status);
CREATE INDEX IF NOT EXISTS idx_laudos_user ON public.laudos_ambientais(user_id);
CREATE INDEX IF NOT EXISTS idx_residuos_data ON public.registros_residuos(data_descarte);
CREATE INDEX IF NOT EXISTS idx_esg_ano_mes ON public.indicadores_esg(ano, mes);

-- ==============================================================================
-- 8. TABELA DE MOTORISTAS & CERTIFICAÇÃO MOPP
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.motoristas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    cpf TEXT,
    cnh TEXT NOT NULL,
    categoria_cnh TEXT DEFAULT 'E',
    validade_cnh DATE NOT NULL,
    mopp_numero TEXT,
    validade_mopp DATE,
    validade_toxicologico DATE,
    nr20 BOOLEAN DEFAULT true,
    nr35 BOOLEAN DEFAULT true,
    telefone TEXT,
    status TEXT DEFAULT 'Disponível' CHECK (status IN ('Disponível', 'Em Viagem', 'Folga', 'Bloqueado')),
    veiculo_vinculado TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

ALTER TABLE public.motoristas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários autenticados podem visualizar motoristas" ON public.motoristas;
CREATE POLICY "Usuários autenticados podem visualizar motoristas"
    ON public.motoristas FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem inserir motoristas" ON public.motoristas;
CREATE POLICY "Usuários autenticados podem inserir motoristas"
    ON public.motoristas FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar motoristas" ON public.motoristas;
CREATE POLICY "Usuários autenticados podem atualizar motoristas"
    ON public.motoristas FOR UPDATE
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem deletar motoristas" ON public.motoristas;
CREATE POLICY "Usuários autenticados podem deletar motoristas"
    ON public.motoristas FOR DELETE
    TO authenticated
    USING (true);

CREATE INDEX IF NOT EXISTS idx_motoristas_status ON public.motoristas(status);
CREATE INDEX IF NOT EXISTS idx_motoristas_cnh ON public.motoristas(cnh);

-- ==============================================================================
-- 7. TABELA DE VEÍCULOS E FROTAS (FROTA PRÓPRIA & AGREGADA AMBIPAR)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.veiculos (
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

DROP POLICY IF EXISTS "Usuários autenticados podem visualizar veículos" ON public.veiculos;
CREATE POLICY "Usuários autenticados podem visualizar veículos"
    ON public.veiculos FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem inserir veículos" ON public.veiculos;
CREATE POLICY "Usuários autenticados podem inserir veículos"
    ON public.veiculos FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar veículos" ON public.veiculos;
CREATE POLICY "Usuários autenticados podem atualizar veículos"
    ON public.veiculos FOR UPDATE
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários autenticados podem deletar veículos" ON public.veiculos;
CREATE POLICY "Usuários autenticados podem deletar veículos"
    ON public.veiculos FOR DELETE
    TO authenticated
    USING (true);

CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON public.veiculos(placa);
CREATE INDEX IF NOT EXISTS idx_veiculos_status ON public.veiculos(status);
CREATE INDEX IF NOT EXISTS idx_veiculos_tipo ON public.veiculos(tipo);


