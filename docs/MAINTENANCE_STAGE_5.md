# Etapa 5 — comunicação e acompanhamento de oficinas

## Fluxos
- Manutenção > Comunicação lista OS ativas sem contato registrado ou sem resposta à última mensagem confirmada. Filtro de 1 a 720 horas e paginação. Cobrar andamento abre a aba Comunicação da OS com o template da categoria andamento.
- Aba Comunicação da OS: Perguntar andamento, escolher template, revisar texto/assunto/canal, Preparar envio, abrir WhatsApp/e-mail e Confirmar que enviei. Abertura/preparação não afirma envio nem entrega. Toda preparação, confirmação e resposta registrada aparece na timeline e no prontuário permanente do veículo.
- Respostas de oficinas e mensagens já enviadas são registradas manualmente. Esta versão não recebe webhook, não faz leitura automática do WhatsApp/e-mail e não envia mensagens por API. Anotações internas são auditadas, mas não contam como contato externo para os lembretes.
- E-mail usa mailto e depende do aplicativo configurado no dispositivo. O transporte communicationTransport.prepare(message) retorna href/label/requiresConfirmation, separando telas do meio de envio. Uma integração futura com API oficial deve retornar resultado confirmado pelo provedor, nunca inferir entrega da abertura de link.
- Admin/Analista podem atribuir responsável ativo da mesma empresa na OS; se não atribuído, o responsável é seu criador. Sem responsável autorizado ativo, a OS permanece visível no acompanhamento, mas a rotina não notifica outro usuário por adivinhação.

## Templates/configurações
Cinco templates iniciais são inseridos por empresa, sem sobrescrever nomes existentes: Cobrar andamento, Solicitar orçamento, Confirmar chegada do veículo, Avisar retirada e Solicitar nota fiscal. Novas empresas recebem os mesmos padrões.
Variáveis permitidas: {nome_parceiro}, {numero_os}, {placa}, {modelo}, {previsao_entrega}. Todas são texto; variáveis desconhecidas/chaves incompletas são rejeitadas. Previsão ausente é exibida como não informada.
Admin/Analista criam/editam/desativam templates e ajustam intervalo/ativação/status dos lembretes. Versão otimista evita sobrescrita concorrente. Alterações em templates e configurações têm auditoria. Limites de aprovação de orçamento e demais parâmetros anteriores são preservados.

## Rotina agendada
Duas migrações separadas: workshop_communication cria tabelas/comandos e o processador; communication_schedule instala/ativa pg_cron nativo do Supabase e agenda maintenance-communication-hourly em 0 * * * *.
O job executa maintenance_private.process_communication_reminders() no banco, com timeout de cinco minutos, sem HTTP, credenciais no navegador, serviço externo ou dependência da plataforma estar aberta. Monitorar no Supabase Integrations > Cron, tabelas cron.job e cron.job_run_details.
O processador usa lock transacional para evitar execuções sobrepostas e serializa com gravações de mensagens/OS. Cada empresa tem intervalo próprio (padrão 24h) e status escolhidos (padrão em execução/aguardando peça). Último contato confirmado externo, recebido ou enviado, reinicia o prazo; sem contatos, usa a abertura da OS. Preparação de link e anotação interna não reiniciam o prazo.
Há no máximo uma notificação pendente por OS/responsável. Execução repetida dentro do intervalo não duplica nem torna novamente não lida. Ao vencer outro intervalo sem contato, a mesma notificação é atualizada e volta a não lida. Contato confirmado, alteração de responsável, desativação da cobrança ou saída dos status monitorados resolve o lembrete. Company/membership ativos são obrigatórios.
O sino mostra notificações do próprio usuário/empresa, consulta ao carregar, voltar à janela e a cada 60 segundos enquanto visível. Ler não equivale a registrar contato; o usuário pode marcar como lida ou abrir diretamente a cobrança da OS.

## Segurança e alterações mínimas
RPC pública invoker delega para implementação privada com identidade do Supabase, membership ativo, perfil autorizado e empresa ativa verificados e bloqueados na transação. Admin/Analista configuram/atribuem; Supervisor/Operador usam templates e registram/preparam mensagens; Motorista/Cliente não acessam esta área.
DML direto nas mensagens/templates/settings é revogado; tabelas novas têm RLS, notificações são individuais e auditoria é somente leitura para Admin/Analista. Autor, oficina, empresa, destinatário e datas são derivados no servidor. Preparação/registro usam request_id para evitar duplicação em retries; somente o autor pode confirmar sua preparação. Conteúdo é exibido como texto e links são codificados.
Arquivos existentes alterados: App.jsx (indicador de notificações), MaintenanceModule.jsx (ativar Comunicação), OrderDetail.jsx (aba), OrdersPage.jsx (link direto e atualização da timeline), VehicleTimeline.jsx (rótulo do evento mensagem), database.maintenance.ts, configuração de testes/CI. Demais módulos operacionais preservados.

## Portal do parceiro — fase 2
Somente contrato de tipos FuturePartnerPortalGrant preparado. Não há rota pública, tabela de tokens, link emitido, upload público nem concessão de acesso nesta entrega. Implementação futura deverá emitir token aleatório de alta entropia, armazenar apenas hash, vincular empresa/OS/oficina e capacidades mínimas, impor expiração/revogação e registrar auditoria; nunca expor service_role. Status e anexos continuarão passando pelas validações de negócio.

## Verificação
Build, lint, typecheck, testes unitários do transporte/variáveis/validação, PostgreSQL isolado com perfis reais e Playwright dos fluxos novos e anteriores. CI aplica/testa cada etapa na ordem antes da nova migração. O PostgreSQL vanilla da CI testa o processador sem simular um pg_cron instalado; a migração de agendamento é validada no Supabase real. Testes reais usam transações com rollback e não abrem aplicativos nem enviam mensagens a terceiros.
