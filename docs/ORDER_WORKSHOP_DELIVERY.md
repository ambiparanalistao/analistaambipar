# Excel da S.OR e previsão após aprovação

O campo prazo_entrega_dias guarda a expectativa de conclusão em dias corridos, separada do SLA medido da oficina e do prazo financeiro de pagamento. O cadastro da oficina contém uma sugestão opcional desse prazo. A S.OR copia a sugestão, permite ajustá-la na abertura e exige um prazo inteiro entre 1 e 3650 na aprovação.

O banco calcula a previsão a partir do timestamp real da aprovação, preservando a hora no fuso America/Sao_Paulo. Abrir a S.OR não inicia essa contagem. Alterações que invalidam o orçamento removem a previsão calculada; nova aprovação inicia nova contagem. S.OR antigas com orçamento aprovado sem prazo não são impedidas de encerrar. Resumo e mensagens usam a previsão persistida, inclusive nos alertas já existentes.

Na criação e na aprovação, uma fila na mesma transação da S.OR registra o evento. A tela chama /api/order-dispatch para enviar Excel com mensagem na legenda ao WhatsApp cadastrado da oficina. Se o envio falha, a S.OR/aprovação continua salva e o detalhe permite repetir. Não há envio durante testes, polling de disparo ou reenvio automático de respostas ambíguas. Ao repetir um envio incerto, é necessário confirmar após conferir o WhatsApp. A API registra a aceitação do provedor, não comprova entrega/leitura no aparelho.

O Excel contém abas da S.OR, veículo, oficina e orçamento, com cores, títulos, filtros, valores numéricos e impressão configurada. Inclui placa, marca/modelo, ano de fabricação/modelo, chassi, capacidades, combustível e KM cadastrados; ausência aparece como Não informado. Dados vêm do banco da própria empresa; o cliente não fornece destinatário, arquivo ou texto ao endpoint de envio. Arquivo gerado no servidor, sem URL pública de documento; download manual disponível pelo mesmo contexto autorizado.

ExcelJS 4.4.0 foi adicionado e fixado para escrever estilos reais no XLSX; o pacote xlsx usado nos outros relatórios permanece. O módulo de Excel é carregado sob demanda na interface.

Envios têm claim com trava, token por tentativa, estado accepted/failed/unknown, controle de concorrência e snapshot dos dados. Histórico de comunicação e timeline registram os envios aceitos. Uma aprovação invalidada não pode ser enviada como válida. A fila não expõe snapshot ou token às consultas de tabela, apenas o estado; documento exige RPC com vínculo ativo na empresa.

Configuração externa: Evolution API URL/key e instância analistalogistica conectada, e WhatsApp válido no parceiro. Endpoint Evolution 2.3.7: message/sendMedia, mediatype document, fileName, mimetype XLSX e media base64. Testes usam provedor simulado; sem enviar mensagens reais a oficinas.

O motorista selecionado na S.OR é identificado como relator dos defeitos do veículo. Nome e telefone do relator constam no Excel, e o nome também segue na mensagem para a oficina. O vínculo usa driver_id da própria empresa; relator ausente é informado explicitamente, sem inventar dados.

Na abertura, o envio agora ocorre para todas as oficinas ativas da empresa, com registro individual. A aprovação segue somente à oficina escolhida. A solicitação pede NCM das peças quando aplicável e prazo estimado de entrega em dias corridos após aprovação. Veja docs/QUOTE_BROADCAST.md.
