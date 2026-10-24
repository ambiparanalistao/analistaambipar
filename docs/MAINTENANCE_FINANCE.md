# Financeiro de manutenção

Acesso em /manutencao/financeiro e pela aba Financeiro de cada S.OR. Nenhuma conta, nota ou pagamento fictício é criado pela migração. Os valores financeiros existentes das S.OR continuam disponíveis conforme as permissões atuais; os custos operacionais dos dashboards antigos não são substituídos por pagamentos.

## Fluxo

1. Vincular a nota fiscal a uma S.OR real. A oficina e o veículo vêm desse vínculo. Informar número, série opcional, emissão, valor total, chave opcional e observação. Uma nota pertence a uma S.OR; rateio de uma única nota entre várias S.OR não faz parte desta versão.
2. Gerar ou editar parcelas com valores e vencimentos. A distribuição usa centavos inteiros e a soma deve ser exatamente igual ao total. Os intervalos automáticos são dias corridos, explicitados no formulário. O primeiro vencimento é sugerido pelo prazo cadastrado da oficina, podendo ser alterado.
3. Conferir orçamento aprovado, oficina, documento e total faturado da S.OR. Liberação acima do orçamento exige justificativa. A conferência captura o orçamento, a aprovação e o total de notas ativas daquele momento. Se qualquer um desses dados mudar, novas baixas ficam bloqueadas até reconferir. Isso também vale quando uma segunda nota é lançada na mesma S.OR.
4. Registrar os pagamentos efetivamente realizados, integrais ou parciais, com método, data e referência. É baixa manual: não há integração bancária, emissão de boleto, transferência ou execução de Pix. O saldo é calculado pelo banco e não pode ser ultrapassado. Pagamentos futuros e valores com frações de centavo são recusados.
5. Corrigir uma baixa por estorno integral daquele lançamento, com motivo obrigatório. O registro original permanece; cada pagamento só pode ser estornado uma vez. Para corrigir parcialmente, estorne o lançamento e registre o valor correto. Depois de qualquer histórico de pagamento, a nota não pode ser editada: estornar, cancelar e cadastrar a correção preserva a rastreabilidade.
6. Cancelar a nota somente após zerar pagamentos líquidos e informar motivo. Notas canceladas saem dos totais ativos, sem apagar parcelas, movimentos ou documentos.

Número e série são únicos por oficina/empresa entre notas ativas, e a chave de acesso informada também não pode se repetir na empresa. A aplicação registra dados e documentos para conferência interna; não emite nem valida documentos fiscais em serviços externos.

## Indicadores e relatórios

Há programado, pago líquido de estornos, saldo em aberto, vencido, vencendo em até sete dias e aguardando conferência. Filtros por vencimento, situação, veículo, oficina, S.OR e busca são aplicados no banco. O período considera o vencimento das parcelas; não representa um fluxo de caixa por data do pagamento. A data operacional usa America/Sao_Paulo.

Uma linha de relatório corresponde a uma parcela. Orçamento da S.OR e faturamento total da S.OR são referências repetidas; não devem ser somados por linha. Excel mantém valores numéricos e inclui os filtros. PDF usa a impressão do navegador, seguindo o padrão existente. As exportações percorrem todas as páginas filtradas, não somente a página visível.

## Documentos e auditoria

Notas, comprovantes e outros documentos podem ser anexados após salvar. PDF/JPEG/PNG/WebP, até 20 MB, no bucket privado maintenance, caminho empresa/finance/nota/arquivo. Comprovante pode ser associado a um pagamento específico. URLs de download são assinadas e temporárias; não são persistidas como links públicos. Documentos vinculados não podem ser sobrescritos ou apagados pela interface. Falha ao registrar metadados tenta remover somente o arquivo órfão recém-enviado.

Criação, edição, conferência, reabertura, pagamento, estorno, cancelamento e anexos são auditados com usuário e data. As telas apresentam dados da operação em linguagem legível. Os identificadores e snapshots completos ficam no banco para rastreabilidade.

## Integridade e permissões

Todas as tabelas têm RLS e acesso de leitura por empresa. Cliente anônimo não tem acesso. Escritas diretas são revogadas; uma RPC pública SECURITY INVOKER chama implementação privada com validação de usuário e perfil. A liberação geral de módulos já existente continua sendo respeitada. Admin/Analista gerenciam; Supervisor/Operador sem liberação geral consultam os valores existentes, conforme decisão anterior do projeto. O portal público dos motoristas não recebe acesso a este financeiro.

A view de saldos é SECURITY INVOKER, mantendo RLS também no acesso direto. Índices cobrem chaves e buscas. Operações financeiras travam a S.OR e a nota, serializando conferências, pagamentos e cancelamentos. Versão otimista evita gravações desatualizadas. Identificadores idempotentes protegem criação de notas, pagamentos e estornos contra repetição após perda de resposta. Não há alteração no valor do orçamento pela rotina financeira. Um trigger adicional impede cancelar a S.OR ou trocar sua oficina enquanto houver notas financeiras ativas. O encerramento operacional permanece permitido e as parcelas continuam acompanhadas no financeiro.

## Verificação

Contratos SQL cobrem soma exata de parcelas, divergência, liberação, baixa parcial, excesso, estorno único, cancelamento, histórico, anexos imutáveis, RLS, perfil somente leitura e reconferência após mudança de orçamento/aprovação ou nova nota. Testes JavaScript cobrem moeda brasileira, centavos, datas, validação e exportação segura. Playwright cobre o ciclo de uso, documentos, modo claro/mobile, recuperação de erro, Excel com 1001 parcelas, PDF e acesso pela aba da S.OR. Testes usam dados isolados e não movimentam dinheiro nem criam lançamentos reais em produção.
