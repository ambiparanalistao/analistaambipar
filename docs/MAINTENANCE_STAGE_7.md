# Etapa 7 — dashboard, relatórios e filiais

## Escopo e acesso
Dashboard e Relatórios completam os sete submenus. Agregações são SQL no Supabase; componentes React apenas apresentam séries/resultados e paginam. Sem biblioteca nova: SVG/CSS, lucide e estilos de manutenção reaproveitam o padrão existente. Admin/Analista/Supervisor/Operador consultam dashboard e relatórios com valores financeiros, conforme decisão expressa do usuário. Só Admin/Analista gerenciam filiais e vinculam veículos. Motorista/Cliente não acessam analytics. Comandos consultam membership/empresa ativos; nenhuma autorização usa user_metadata.

## Filiais
Cadastre em Manutenção > Dashboard > Gerenciar filiais. Vincule em Gestão de Frotas > Novo/Editar veículo > Filial do veículo. Filiais têm empresa, estado ativo e versão otimista; nomes únicos por empresa. Desativar impede novos vínculos e preserva os existentes. Veículos antigos continuam sem filial até atribuição manual. Uma filial não pode ser usada em veículo de outra empresa. Escritas diretas nas filiais são revogadas; alterações têm auditoria em maintenance_analytics_audit.
A OS recebe a filial do veículo na abertura, por trigger do banco. Essa referência é imutável: trocar a filial do veículo não reescreve relatórios históricos. OS anteriores à migração ficam como Sem filial, sem backfill especulativo.

## Filtros e indicadores
Empresa vem do seletor existente; período, filial, veículo, oficina e tipo são compartilhados por dashboard/relatórios via URL. Datas são dias completos em America/Sao_Paulo, intervalo final exclusivo (dia seguinte); período máximo 3.660 dias. Aplicar valida o período. Cards operacionais e lista crítica são situação atual, independentes do período; oficina/tipo filtram as OS. Disponibilidade é da frota selecionada por filial/veículo: inclui veículos em viagem, exclui manutenção e bloqueados. Denominador zero aparece como Sem frota.
- Custos realizados: soma de OS encerradas por encerrada_em no período; abertas/canceladas não somam. Custo médio usa somente encerradas. Gráfico mensal preenche meses sem custo com zero.
- Preventiva × corretiva e quebras: abertura da OS no período, sem canceladas; quebras são corretivas. Outros tipos não entram na pizza comparativa.
- Custo/KM: custo realizado filtrado do veículo dividido pelo avanço entre leituras de OS/visitas no período (pelo menos dois instantes e delta positivo). Não divide pelo odômetro acumulado da vida do veículo, nem inventa KM quando faltam leituras. É KM observado, não cobertura integral de telemetria.
- Downtime: interseção das visitas com o período; visitas abertas terminam no instante da consulta. Range aggregation une sobreposições para não contar horas duas vezes.
- MTTR: primeiro evento em execução até último concluído da timeline, para conclusões no período. Inclui esperas entre esses marcos; sem marcos válidos não há amostra. Tempo médio na oficina é chegada até saída para visitas finalizadas no período.
- Ranking: SLA compara saída com previsão da OS, excluindo previsões ausentes do denominador; mostra amostras, prazo médio, custo médio e nota interna. Top 10 por custo/downtime/quebras; até 20 OS críticas ou atrasadas atuais, com acesso direto.

## Relatórios/exportações
Cinco relatórios: custos por veículo, oficina, tipo; histórico de OS; downtime. Histórico usa abertura no período, incluindo canceladas; valor realizado só para encerradas. Demais custos usam encerramento. Filial é histórica da OS; estado atual da frota usa filial atual. Exportações preservam filtros/empresa, incluem todas as páginas (lotes de 500) e detectam alteração de contagem durante a coleta, pedindo nova tentativa. Não há corte silencioso de registros. Excel mantém valores numéricos e protege texto interpretável como fórmula. PDF usa janela de impressão/Salvar como PDF, igual ao prontuário existente; HTML é escapado e cabeçalho de tabela repete na impressão. Navegador deve permitir a janela.

## Alterações em arquivos antigos
MaintenanceModule.jsx ativa Dashboard/Relatórios; VehiclesModule.jsx acrescenta somente campo de filial; fleetPersistence.js inclui branch_id na whitelist; database.maintenance.ts amplia contratos. Atualização do teste antigo que esperava Dashboard em breve, configuração Playwright e CI. Frota/OS existentes mantêm os serviços anteriores; triggers acrescentam validação da filial e snapshot na abertura, sem reescrever workflow ou campos operacionais anteriores.

## Verificação
Build, lint, typecheck, testes unitários/SQL/Playwright das sete etapas, exportação real de 501 linhas e conferência da impressão. Banco isolado testa isolamento entre empresas/perfis, histórico de filial, métricas, sobreposição/período, custo/KM ausente, paginação e auditoria. CI PostgreSQL 17 valida além do runtime isolado local. Produção usa testes transacionais com rollback, sem deixar veículos/filiais/OS fictícios.
