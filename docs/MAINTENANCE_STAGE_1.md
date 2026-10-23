# Manutenção e Oficinas Parceiras — etapa 1 de 7

Somente banco de dados, tipos e testes. Nenhuma tela, chamada à Evolution, envio de mensagem
ou migration foi executada no Supabase de produção. Não aplicar automaticamente no deploy.

## Base analisada
React/Vite em JavaScript; supabase-js já existente; arquivos SQL em supabase/.
Veículos: public.veiculos; motoristas: public.motoristas; ambos UUID e user_id.
Status de veículo preservados: Disponível, Em Viagem, Manutenção, Bloqueado.
Viagens estão em localStorage (src/components/TripsModule.jsx); rotas são campos em clientes.
Não existem tabela de alocações, company_id, membros de empresas ou tipos de banco gerados na base.
profiles.role existe, mas o usuário pode editar o próprio perfil: ele NÃO é usado para conceder
autorização multiempresa ou aprovação de orçamento.
A migration inicial não cria veiculos/motoristas, embora schema.sql os descreva.

## Aplicação manual e pré-requisitos
1. Revise e rode apenas o arquivo de leitura supabase/maintenance_preflight.sql.
2. Confirme a existência real e os nomes/UUIDs de veiculos, motoristas e auth.users.
   As migrations interrompem se essas tabelas de frota estiverem ausentes. Não rode schema.sql
   indiscriminadamente em produção: ele contém políticas antigas e não é uma migration de atualização.
3. Verifique conflitos de nomes com empresas, membros, enums e tabelas. Esta entrega não tenta
   reaproveitar silenciosamente objetos homônimos. Em caso de conflito, revise antes de aplicar.
4. Faça backup pelo processo habitual e aplique, em ordem:
   - 20261023010000_tenant_foundation.sql
   - 20261023020000_maintenance_tables.sql
   - 20261023030000_maintenance_automation.sql
   - 20261023040000_maintenance_storage.sql
   Cada arquivo tem BEGIN/COMMIT. Uma falha reverte o arquivo, não os arquivos anteriores.
5. Provisione empresas e membros pelo SQL administrativo ou serviço confiável. Nenhum usuário
   do frontend pode criar sua própria associação, trocar seu papel ou definir empresa pelo JWT.
6. Associe explicitamente cada veículo/motorista existente à empresa correta. Não há backfill
   automático, empresa padrão nem associação baseada só no criador.
7. Só use veículos/motoristas vinculados à empresa nas novas OS. As FKs compostas rejeitam
   referências cruzadas e registros legados ainda sem company_id.
8. Não rode DROP/rollback destrutivo. Corrija eventuais problemas com uma migration adicional.

A CLI Supabase não está instalada neste ambiente. Arquivos SQL foram preparados e versionados
sem instalar dependências no aplicativo e sem executar deploy de banco. Os testes usam PostgreSQL
isolado no CI; não constituem auditoria do schema real de produção.

## Compatibilidade e limites da transição
Somente veiculos e motoristas recebem colunas/constraints/índices/triggers/policies adicionais.
Nenhum arquivo antigo de migration, schema.sql, componente, cliente Supabase ou package.json foi alterado.
As políticas antigas permanecem, mas políticas RESTRICTIVE impõem a fronteira nas linhas com company_id.
Linhas legadas com company_id NULL continuam com as regras anteriores; NÃO têm isolamento por empresa.
Esta etapa NÃO torna todo o sistema antigo multiempresa: clientes, combustível, perfis e dados de
localStorage precisam de migração e regras próprias nas próximas etapas.

Para não quebrar formulários atuais que omitem company_id, novos veículos/motoristas recebem
a única associação ativa do usuário, quando existir. Sem associação, continuam legados.
Se houver múltiplas associações, a gravação sem company_id é rejeitada: a etapa de aplicação deve
adicionar escolha explícita da empresa antes de liberar múltiplas empresas para esses usuários.
Reatribuição de veículos/motoristas exige operação administrativa e não pode invalidar FKs existentes.

## Modelo e autorização
companies e company_members são a fonte confiável. company_members.role usa os valores existentes:
analista e gestor escrevem dados operacionais; auditor apenas lê; administrador também configura
limites. Gestor corresponde ao supervisor para aprovação. O papel global de profiles não concede
acesso ao novo módulo. Provisionamento inicial fica com o administrador do banco/serviço.
company_id de companies é gerado a partir do próprio id (a empresa é a raiz do isolamento).

Todas as 11 tabelas têm UUID, company_id obrigatório, created_at, updated_at, created_by,
RLS por associação ativa e índices de empresa/FKs. Identidade, empresa e auditoria de criação
são imutáveis para a aplicação. UPDATE aplica USING e WITH CHECK. Sem acesso anon.
Funções auxiliares ficam em maintenance_private, fora da API; as funções SECURITY DEFINER
são apenas triggers, têm search_path vazio, execução pública revogada e checagem explícita de acesso.
O contador privado tem RLS sem policies para usuários e não é gravável pela API.

OS, timeline e mensagens preservam histórico: OS não é apagada pelo frontend;
timeline/mensagens são append-only. Demais exclusões respeitam FKs sem cascade de dados de negócio.
Mudança de status é registrada automaticamente, inclusive abertura; usuários não podem forjar
eventos do tipo mudanca_status. Comentários/anexos/mensagens podem originar eventos próprios.

## Cálculos e consistência
- Número OS-AAAA-0001: contador por empresa/ano (America/Sao_Paulo), UPSERT atômico.
  Passando de 9999, a numeração cresce sem truncar; número, veículo, parceiro e abertura da OS
  são imutáveis. Não é permitido renumerar pelo frontend.
- Uma OS ativa é qualquer status diferente de encerrada/cancelada. Inclusive concluido e
  veiculo_retirado mantêm a indisponibilidade até o encerramento explícito, conforme o pedido.
- Ao abrir/reabrir: veículo entra em Manutenção. Em Viagem exige finalizar a viagem primeiro.
  Bloqueado continua bloqueado. Ao encerrar/cancelar a última OS ativa, somente Manutenção
  volta a Disponível; nenhum bloqueio é removido.
- Lock na linha de veículo serializa abertura/encerramento e impede despacho concorrente.
  O banco rejeita Em Viagem e Disponível enquanto existir OS ativa.
- Como as viagens atuais ficam no navegador, a alocação em localStorage NÃO passa pelo banco.
  Nas próximas etapas validar também TripsModule.handleCreateTrip e os fluxos de alocação em
  ClientsModule. Um trigger SQL não consegue bloquear gravações em localStorage.
- valor_pecas e valor_mao_obra vêm exclusivamente de itens; arredondamento por item em centavos;
  valor_total é coluna gerada. Alterações em itens bloqueiam a OS, recalculam totais e invalidam
  orçamento aprovado. Não existe lançamento financeiro duplicado no cabeçalho.
- Aprovação/reprovação exige gestor/administrador da empresa. Limite de gestor vem de settings
  (padrão 5000 quando ainda não configurado). Administrador aprova sem esse teto.
  Alterar configurações exige administrador; não há autorização pelo user_metadata.
- Visita aberta: downtime_horas NULL. Após saída: (saída-chegada) em horas, duas casas.
  Datas e odômetros não podem regredir. Apenas uma visita aberta por veículo.
  É necessário registrar a saída antes de encerrar OS com visita aberta.
- SLA: média de dias corridos entre data_abertura e encerrada_em, somente OS encerradas.
  Atualiza ao alterar OS/reabrir. Sem OS encerradas: NULL (não zero fictício).
- Plano: veículo OU categoria, nunca nenhum/ambos; intervalo em km e/ou dias positivo.
  Próximas execuções calculadas a partir da última execução; NULL até existir base.

## Storage
Bucket maintenance privado. Objeto: <company_uuid>/<identificador-ou-pasta>/<arquivo>.
As colunas url/foto_*_url/fotos armazenam caminhos do bucket, não links públicos ou URLs assinadas
persistentes. A aplicação futura deve gerar links assinados de curta duração após autorizar o usuário.
Leitura/gravação/exclusão se limitam à empresa; auditor não grava. UPDATE valida caminho antigo e novo.
Guards RESTRICTIVE protegem o bucket mesmo se houver policies permissivas amplas de outros módulos.
Se um bucket maintenance já existir público, a migration falha para revisão, sem modificar arquivos.
Storage só garante a empresa nesta etapa, não permissões por OS. Não remover policies de outros buckets.

## Arquivos e tipos
- Quatro migrations novas, preflight somente leitura e seed separado/opt-in.
- src/types/database.maintenance.ts: snapshot tipado das 13 tabelas públicas novas e seis enums.
  Não é apresentado como dump gerado do banco real. Datas ISO; numeric como number no cliente.
  Tipos não convertem o projeto JS para TypeScript. Campos calculados não são graváveis;
  tabelas append-only não oferecem Update.
- tsconfig.maintenance.json e tests/maintenance.types.ts validam somente os tipos novos.
- .github/workflows/maintenance-stage1.yml: banco PostgreSQL 17 descartável, testes SQL,
  concorrência, build, lint, typecheck e regressão da Evolution. Nenhum segredo ou URL de produção.
  TypeScript 5.9.3 é ferramenta temporária do CI via npx; nenhuma dependência de produção foi adicionada.

## Seed opcional
supabase/seeds/maintenance_optional.sql não é executado por migrations ou pelo aplicativo.
Exige company_id/user_id/vehicle_id existentes, explicitamente informados em parâmetros de sessão
e acesso administrativo; só usa a empresa indicada. Cria 3 oficinas fictícias, 5 OS em estados
distintos e 2 planos. Recusa reaplicação e não cria empresa/usuário/veículo nem associa dados antigos.
Como há OS ativas no seed, o veículo de demonstração passa a Manutenção: use um veículo de teste.

## Como testar
O workflow usa postgres:17, cria auth/storage mínimos para testes, aplica o schema existente e as
quatro migrations somente nesse banco descartável. O SQL é validado pelo próprio PostgreSQL.
tests/maintenance/integration.sql testa RLS, associação cruzada, auditor/analista, Storage (inclusive
políticas amplas preexistentes), criação/fechamento de OS, timeline, totais, aprovação, plano, SLA
e downtime. A transação de fixtures é revertida no final.
tests/maintenance/concurrency.mjs cria dados em outro conjunto de IDs apenas no serviço Docker:
16 aberturas simultâneas, 16 encerramentos e 12 inclusões de itens verificam números e totais.

Com dependências disponíveis:
  npm ci
  npm run build
  npm run lint
  npx --yes --package typescript@5.9.3 tsc --project tsconfig.maintenance.json
  node --test tests/evolution.test.js

Para reproduzir os testes SQL, use exclusivamente PostgreSQL descartável e os comandos do workflow.
Não executar bootstrap.sql, integration.sql ou concurrency.mjs em produção.
Na aplicação futura, testar duas empresas com usuários distintos e conferir que nenhum registro,
referência, upload ou troca de company_id permita acesso cruzado.
