# Cadastros reais da frota

Motoristas e veículos operacionais são consultados no Supabase, com company_id explícito e RLS. Listas vazias permanecem vazias. Não há criação automática de motoristas por nome nem certificações presumidas.

O formulário de OS carrega os cadastros completos e sugere o motorista associado à placa, quando a associação é única. A seleção manual continua disponível. Viagens, ocorrências e abastecimentos usam a mesma fonte de veículos e motoristas.

Salvar, alterar status e excluir aguardam confirmação do banco. Erros de vínculo preservam o cadastro e são exibidos. Exclusão de cliente também aguarda confirmação remota e respeita a empresa.

Dados antigos do navegador não entram nas listas operacionais. O aviso e os botões de recuperação local foram removidos das telas de Motoristas e Frotas.

A migração adiciona os campos reais de contato, vencimentos e prefixo usados nas telas. Não apaga registros existentes. Remove os padrões true de NR20/NR35 e retira RENAVAM do snapshot de envio. O Excel de OS não inclui RENAVAM; o campo real continua no cadastro da frota.

ESG sem medições, custos mensais sem lançamentos e auditoria de abastecimento sem anomalias reais mostram estado vazio. O atalho de sessão demonstrativa foi removido. Exemplos em testes isolados não são enviados ao banco de produção.

Verificação: testes de matching, SQL de persistência/isolaçao/exclusão/documento e navegador (exclusão com recarregamento, falha por vínculo, preenchimento da OS). Os testes não enviam mensagens reais.

Configuração operacional: MOPP é exibido com validade indeterminada em cards, tabela e formulário. Datas históricas permanecem no banco, mas não são exigidas, alteradas pelo formulário nem usadas em alertas. A solicitação pelo WhatsApp usa a Evolution API e pede somente a validade do exame toxicológico. Isso não presume a existência do certificado: o número cadastrado é preservado e a ausência é indicada.
