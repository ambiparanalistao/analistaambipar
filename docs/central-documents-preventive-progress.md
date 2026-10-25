# Central de Gestão de Frota e Logística

## Nome
O nome aparece na marca da navegação, no painel e no título da página. Rótulos e documentos gerados usam Central de Gestão, Analista de Transporte e Resumo da Solicitação conforme o contexto. Identificadores internos, chaves de configuração, e-mails, dados de autenticação e históricos já gravados não são renomeados.

## Edição de documentos
Auditoria e Vencimentos abre a licença ou as validades do veículo/motorista em um diálogo nativo centralizado, com foco contido, retorno do foco, Escape e botão de fechar. Durante o salvamento o fechamento é bloqueado. Falhas mantêm os dados digitados. Cancelar não grava. A persistência continua em compliance_command, com RLS, auditoria e controle de concorrência existentes, atualizando as mesmas tabelas usadas pelas demais telas.

## Próximas preventivas
A tela de Manutenção Preventiva exibe nome, próximo KM/data, distância/tempo restantes, referência e barra para cada plano salvo. A cor vem do estado calculado no banco com os limites da empresa; a porcentagem usa o maior consumo entre KM e tempo e fica limitada entre 0 e 100%. Dados ausentes não são tratados como zero.

Atualizar KM altera somente km_atual no cadastro original, por persistFleetVehicle e RLS. O banco já impede regressão do odômetro. O evento de atualização recarrega a frota e os planos, incluindo indicadores e outras áreas que usam o hook.

Os quatro itens do roteiro sem plano têm Definir referência. O usuário confirma o intervalo e informa KM/data de referência. Também pode marcar explicitamente início de acompanhamento no KM atual: isso cria uma base de acompanhamento, sem registrar serviço executado ou gerar baixa. O plano é salvo por maintenance_plan_command com auditoria. Nenhuma referência ou periodicidade é criada automaticamente em produção. Os intervalos sugeridos devem ser confirmados para o veículo.

A abertura de SDO permanece independente da execução da revisão e não reinicia o odômetro. Planos existentes continuam no fluxo de encerramento já implementado.

## Testar
Editar e salvar uma licença no pop-up; reabrir e conferir a data e o histórico. Cancelar e verificar que nada foi alterado. Em preventiva, informar KM, definir referência para um item e conferir próximo KM e barra. Atualizar a leitura até a proximidade e além do limite; verificar amarelo/vermelho e recarregar para confirmar persistência. Testes cobrem foco, centralização, falha de gravação, início de acompanhamento, campos ausentes, porcentagem e salvamento compartilhado.
