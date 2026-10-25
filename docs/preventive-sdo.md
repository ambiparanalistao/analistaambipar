# Solicitação preventiva

A tela Manutenção Preventiva usa os veículos e odômetros persistidos da empresa. Não lê nem grava os antigos exemplos e ciclos de localStorage. Valores de KM ausentes ficam não informados.

Gerar SDO preventiva abre o formulário existente de solicitações, com o veículo selecionado, o KM conhecido, todos os itens do roteiro preventivo e os nomes dos planos ativos do veículo. A descrição é editável para retirar itens não aplicáveis ou acrescentar serviços. O grau de urgência é salvo no campo de prioridade existente e aparece no acompanhamento.

A solicitação utiliza maintenance_order_command, a tabela maintenance_orders, a timeline, os filtros de oficinas, o Excel e o envio Evolution já existentes. A numeração histórica do banco é preservada; não é criada uma segunda tabela de pedidos. Sem filtro de oficinas selecionado, salva sem disparo, conforme a regra atual. Gerar ou cancelar a solicitação não executa preventiva e não reinicia ciclo/odômetro. A criação só registra uma leitura real de KM confirmada pelo usuário, respeitando a validação de não regressão.

A tela Planos Preventivos mantém seu vínculo entre plano e solicitação: a execução do ciclo continua sendo atualizada somente no encerramento pelo fluxo existente. O roteiro de orçamento na tela geral não inventa execuções, datas ou intervalos periódicos para veículos sem plano cadastrado. Para configurar a periodicidade, use Planos Preventivos.

Os dados antigos locais não são migrados automaticamente. O cadastro da frota continua disponível pelo botão Ver cadastro / atualizar KM. O histórico da tela mostra as vinte solicitações preventivas mais recentes do banco e permite abrir seu acompanhamento.

Teste: abrir /manutencao-preventiva, selecionar Gerar SDO preventiva, conferir o KM, adicionar um serviço ao texto, selecionar a urgência e oficina, salvar. Reabrir a tela e verificar a solicitação no histórico e o KM preservado. Testes de navegador também validam KM ausente, modo claro e celular; as regressões dos planos e solicitações permanecem na CI.
