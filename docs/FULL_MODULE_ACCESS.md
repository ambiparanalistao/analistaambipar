# Liberação de módulos e Central de Manutenção
## Política solicitada
Todos os membros de empresas recebem full_module_access=true, incluindo futuros vínculos criados pelo provisionador. O perfil de trabalho original (maintenance_role / profiles.role) é preservado. A interface e as autorizações operacionais usam acesso efetivo completo dentro da empresa. Não concede administração de usuários nem acesso a empresas sem vínculo.
A migration regulariza as contas existentes sem nenhum vínculo apenas quando há uma única empresa ativa. Contas anônimas, removidas, banidas ou com vínculo inativo não são reativadas. Não há adesão automática de futuros cadastros públicos: novos logins devem ser vinculados à empresa correta pelo provisionador, para então receber o acesso padrão completo.
A página pública de oficinas continua sem acesso ao painel.

## Implementação
Migration: 20261023202225_full_module_access.sql.
O novo helper maintenance_private.module_role centraliza a permissão efetiva. São atualizadas seis funções de autorização: partner_access, order_command, prepare_order, communication_command, storage_access_stage3 e vehicle_command; mais can_access_company e is_limited_actor. Permanecem as validações de empresa, vínculo ativo, auditoria, estados das OS, orçamento conciliado e bloqueio de alocação.
As rotinas agendadas mantêm seus públicos por perfil; todos os perfis liberados consultam os alertas pelo painel. A identidade do Motorista é preservada para vínculos e sua página própria, que passa a oferecer retorno ao painel completo.
Automação mantém a configuração existente e passa a permitir um usuário autenticado com vínculo ativo, empresa ativa e full_module_access, além dos administradores já configurados. Não altera o envio genérico legado da Evolution.

## Visual
MaintenanceWorkspace.css e o cabeçalho do módulo padronizam as sete áreas: navegação, ações rápidas, cards, tabelas, filtros, Kanban, formulários, timeline, relatórios e estados de vazio. Mantém temas claro/escuro, menus nativos coerentes e layout móvel. O formulário público neon possui estilo independente.

## Verificação
SQL cobre o reparo da conta órfã, os sete perfis, criação de parceiro e orçamento, contexto de todas as áreas, isolamento entre empresas, revogação por vínculo inativo e bloqueio de visitantes. Testes de navegador verificam a liberação de Supervisor/Operador/Motorista/Cliente e a regressão funcional do módulo. Não há alteração de dados reais de OS ou frota para teste.
