# Etapa 6 — manutenção preventiva

## Uso
Manutenção > Planos Preventivos: Admin/Analista cadastram planos individuais ou por categoria (tipo já salvo na frota), editam periodicidade, ativam/desativam e ajustam a antecedência. Intervalos por KM e/ou dias; o primeiro limite atingido vence. Itens sugeridos incluem óleo, filtros, pneus, correia, freios, revisão geral, licenciamento, extintor e tacógrafo; nomes personalizados são aceitos.

Cada plano/veículo mantém sua última execução e ciclo em maintenance_plan_vehicles. Na criação individual, informe KM e data base (até o KM atual e até hoje). Categoria usa o KM salvo de cada veículo e a data base informada; novos veículos recebem vínculo na próxima consulta ou rotina diária. Edite intervalos sem apagar execuções; para mudar veículo/categoria, crie outro plano. Planos sem histórico anterior usam uma base explícita, não uma execução fictícia de OS.

Próximo KM = última execução KM + intervalo; próxima data = última execução data + intervalo. O odômetro atual determina proximidade/vencimento, sem deslocar a meta a cada leitura. Nos planos individuais, os campos da tabela original também recebem a execução e recalculam as metas geradas. Em categoria, a base do plano é preservada e os valores por veículo são calculados no serviço do banco. A ficha usa os valores por veículo.

Fonte de odômetro: veiculos.km_atual, já persistido pelo cadastro de frota e pelas ações de abertura/chegada/saída de OS. O banco impede redução. Importações/abastecimentos locais não são promovidos a outra fonte de KM nesta etapa. Não foi necessário criar check-in novo.

## Alertas e OS
Vencida (vermelho) quando data ou KM atingir o limite, inclusive igualdade. Vence em breve (amarelo) quando alcançar a antecedência configurada; Em dia (verde) caso contrário. Padrão 7 dias/500 km. O antigo padrão de 1.000 km é convertido somente em configurações sem edição registrada; configurações personalizadas são preservadas. Filtros por veículo/categoria/item/situação e paginação de 20 linhas.

Gerar OS preventiva abre o formulário existente com veículo, tipo, descrição e KM preenchidos. Selecionar oficina e revisar dados antes de abrir. O servidor fixa tipo preventiva e valida o vínculo; veículo divergente é rejeitado. Cliques repetidos retornam a OS aberta existente, sem criar outra para o mesmo plano/veículo. A OS segue todo o fluxo anterior, inclusive orçamento e visitas. Somente ao encerrar são gravadas última execução KM/data e o próximo ciclo. Cancelar não executa o plano. Outros veículos da categoria não são alterados. Eventos e auditoria ficam preservados.

## Notificações e rotina
Supabase pg_cron nativo já existente. Job maintenance-preventive-daily em 0 9 * * * (09h UTC, 06h em Brasília), com timeout de 5 minutos, executa maintenance_private.process_preventive_alerts(). Sem HTTP/novas chaves/serviço externo e funciona com a plataforma fechada. Monitoramento em cron.job e cron.job_run_details. A rotina faz reconciliação dos vínculos e notifica membros ativos Analista/Operador das empresas ativas nas mudanças para breve ou vencida. Uma linha por plano/veículo/usuário; execuções repetidas preservam a leitura. Novo estado ou novo ciclo rearma o aviso; encerramento/inatividade resolve. Não há envio externo nesta etapa.

O painel e contador consultam estados atuais, independentemente do horário diário. Sino combina as notificações anteriores com preventivas; leitura individual validada pelo servidor. Menu mostra quantidade de itens/veículo próximos ou vencidos, não quantidade de usuários notificados. Ficha mostra selo e próximas metas. Atualização na abertura, ao voltar à janela e a cada 60 segundos visível.

## Segurança
RPC invoker pública chama comando privado com identidade Supabase e membership/empresa ativos verificados. Admin/Analista criam/editam/configuram; Supervisor/Operador consultam e geram OS. Motorista/Cliente negados. Sem autorização via user_metadata. Novas tabelas com RLS/empresa; notificações pertencem ao destinatário. Escrita direta de planos revogada; comandos auditados e versão otimista. Execução do processador indisponível a anon/authenticated.

## Arquivos antigos alterados
MaintenanceModule.jsx ativa submenu; Sidebar.jsx acrescenta contador; VehicleMaintenancePanel.jsx usa resumo preventivo real; OrdersPage.jsx aceita pré-preenchimento/vínculo; MaintenanceNotifications.jsx agrega avisos no sino; database.maintenance.ts amplia contratos. CI e configuração de testes incluem Etapa 6. Frota, viagens, combustível e comunicação por Evolution não foram alterados.

## Validação
Build, lint, typecheck, testes unitários, SQL com todas as etapas anteriores em ordem e Playwright. Testes de banco cobrem categorias independentes, primeiro vencimento, notificações idempotentes, privacidade, limites, criação/reuso de OS, encerramento pelo fluxo real, cancelamento e preservação das configurações anteriores. Cron nativo conferido separadamente no Supabase; PostgreSQL vanilla testa o processador sem simular extensão Cron.
