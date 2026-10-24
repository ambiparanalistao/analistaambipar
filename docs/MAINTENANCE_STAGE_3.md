# Etapa 3 — Ordens de serviço
Acesse /manutencao/ordens-de-servico. Cadastre e salve o veículo na Gestão de Frotas e uma oficina ativa em Oficinas Parceiras antes de abrir a OS. Somente UUIDs persistidos e vinculados à empresa são aceitos; dados locais/demonstrativos não são utilizados como cadastros de OS.

## Fluxo
1. Nova OS: placa, oficina, tipo, prioridade, problema, KM e previsão opcional. Número automático por empresa/ano. Motorista opcional.
2. Cadastre peças/serviços na aba Orçamento. Totais calculados no banco. Alterar itens invalida aprovação e registra histórico.
3. Aprove/reprove com observação. Supervisor aprova até maintenance_settings.limite_aprovacao_supervisor (padrão 5000 quando não configurado); Admin/Analista podem decidir acima do limite.
4. Mova pelo Kanban ou seletor Mover para; confirme os campos solicitados. Cancelar o modal mantém o status original.
5. Registrar chegada exige KM; data/hora são do servidor, foto é opcional. Concluir exige serviços executados e valor conciliado com os itens aprovados.
6. Registre saída com KM; depois encerre. O veículo só fica disponível quando não há outra OS ativa e não está Bloqueado.
7. Anexos privados de até 20 MB; orçamento em PDF, fotos JPEG/PNG/WebP. Links de download duram 60 segundos. Timeline mostra operações e responsáveis em ordem cronológica.

## Permissões
Admin Geral/Empresa e Analista: gestão completa. Supervisor: abre OS e decide orçamento dentro do limite de aprovação; Operador Logístico: abre OS e registra chegada/saída. Ambos consultam dados e documentos. Motorista/Cliente sem acesso. As regras de edição de Oficinas Parceiras da etapa 2 permanecem.

## Integridade e validação
RPC pública invoker chama comando privado definer com verificação fresca de associação/ação. Escrita direta nas cinco tabelas de OS foi revogada dos clientes, incluindo timeline. Cada comando bloqueia a OS e o veículo, confere versão e grava alterações + eventos na mesma transação. Campos de auditoria não vêm do navegador.
O odômetro de veículos vinculados à empresa não pode diminuir. A frota espera confirmação do banco antes de indicar sucesso na gravação, mudança de status ou exclusão.
Teste automatizado isolado: etapas 1 e 2, fluxo/perfis de OS, unidades, build, lint, schema typecheck, regressão Evolution e navegador com API fictícia. Não é criado seed de demonstração em produção.
