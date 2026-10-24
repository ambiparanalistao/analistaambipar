# Solicitação automática de orçamento para oficinas

Na abertura de uma S.OR pela plataforma, o banco cria um registro de envio por oficina ativa da mesma empresa. A plataforma inicia automaticamente os envios pela Evolution API, em lotes limitados, com até dois envios simultâneos. Oficinas inativas ou bloqueadas não entram na nova fila. Contato ausente ou inválido fica registrado como indisponível, sem inventar destinatário. O envio pode ser acompanhado e retomado individualmente no detalhe.

Cada destinatário recebe o Excel e a mensagem solicitando orçamento de peças e serviços, NCM de cada peça quando aplicável e prazo estimado de entrega em dias corridos contado após a aprovação. O NCM é informado pela oficina/analista; não é calculado ou presumido. O código é salvo como texto e preserva zeros iniciais.

A cotação enviada a uma oficina não contém itens ou preços de orçamento já lançado para outra. O Excel possui campos para a oficina informar valores e prazo. Os dados do veículo e do relator continuam vindo dos cadastros reais.

A oficina de referência pode ser trocada pelo Admin/Analista antes dos itens, aprovação ou chegada. Após receber os orçamentos, o analista escolhe a oficina executante, registra itens/NCM e confirma o prazo informado por ela. Somente essa oficina recebe a aprovação. A previsão de entrega é calculada a partir da data/hora da aprovação mais os dias corridos acordados, em São Paulo; não há média inventada nem garantia de data antes da aprovação.

Cada envio tem destinatário, tentativas, identificador do provedor, status e auditoria por empresa. Envios aceitos não são repetidos. Falhas e resultados incertos não são repetidos automaticamente; a repetição incerta exige conferir o WhatsApp. Ao aprovar, as cotações ainda pendentes tornam-se desatualizadas. Mensagens que já estiverem em trânsito no provedor podem concluir.

A fila é persistida e os lotes são iniciados pela plataforma após salvar a S.OR; se a sessão ou a página forem encerradas antes de processar todos os lotes, os restantes permanecem pendentes para retomar no detalhe. Não há robô de resposta: o orçamento recebido e o prazo da oficina são registrados pelo analista. A migração não dispara mensagens históricas nem cria envios retroativos.
