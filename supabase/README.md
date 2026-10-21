# 🐘 Supabase Database - Analista Ambipar

Este diretório contém os scripts SQL e migrações para inicializar e manter o banco de dados PostgreSQL do projeto no **Supabase**.

---

## 🚀 Como Executar o Script SQL no Supabase:

1. Acesse o seu painel do Supabase: **[https://supabase.com/dashboard](https://supabase.com/dashboard)**
2. Selecione o seu projeto.
3. No menu lateral esquerdo, clique no ícone **SQL Editor** (ícone `>_`).
4. Clique em **+ New query**.
5. Abra o arquivo local [`supabase/schema.sql`](./schema.sql) (ou [`migrations/20261021000000_initial_schema.sql`](./migrations/20261021000000_initial_schema.sql)), copie todo o conteúdo e cole no editor.
6. Clique no botão verde **Run** (ou pressione `Ctrl + Enter`).

---

## 🗃️ O que é criado pelo script:

1. **`public.profiles`**:
   * Armazena os dados adicionais do usuário (nome, cargo, avatar).
   * Vinculado diretamente à tabela interna `auth.users` via chave estrangeira `ON DELETE CASCADE`.

2. **Trigger Automático (`on_auth_user_created`)**:
   * Toda vez que um novo analista cria uma conta pela tela de cadastro (`auth.signUp`), um registro correspondente é criado automaticamente na tabela `public.profiles`.

3. **`public.laudos_ambientais`**:
   * Registro e acompanhamento de licenças ambientais, relatórios técnicos, MTRs e auditorias com status de aprovação.

4. **`public.registros_residuos`**:
   * Gestão de descarte, transporte e destinação final de resíduos industriais (Classes I, II A e II B).

5. **`public.indicadores_esg`**:
   * Métricas de sustentabilidade: emissões de CO2, consumo de energia, água e compensação de carbono.

6. **Políticas de Segurança (Row Level Security - RLS)**:
   * Cada tabela já conta com regras estritas garantindo que apenas usuários autenticados com token JWT válido acessem e alterem os registros.
