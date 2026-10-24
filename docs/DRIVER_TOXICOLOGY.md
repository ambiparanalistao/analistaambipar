# Solicitação de exame toxicológico

Em Motoristas, o botão Solicitar toxicológico envia diretamente pelo servidor para a Evolution API configurada. O destinatário é sempre o telefone principal persistido do motorista na empresa selecionada. O navegador informa somente empresa, motorista e identificador da solicitação; não escolhe número, texto, instância nem credenciais.

A mensagem solicita apenas a data de validade do exame toxicológico. Não pede MOPP, NRs ou outros cursos. Não abre wa.me. O endpoint verifica sessão, empresa, origem e conexão da instância antes de chamar sendText. Não é necessário configurar webhook para este envio; respostas e atualização da data continuam sendo tratadas pelo analista.

O histórico fica em driver_toxicology_requests, protegido por RLS e sem escrita direta para usuários autenticados. Registra usuário, motorista, telefone, texto, tentativas, datas, resultado e identificador retornado pela API. A aceitação pela Evolution não equivale à leitura ou entrega ao motorista.

A mesma solicitação não é enviada duas vezes; um envio em andamento bloqueia concorrentes. Timeout ou resposta ambígua geram estado incerto, sem repetição automática. A nova tentativa depende de conferir o WhatsApp e confirmar explicitamente o risco de duplicação. Chaves da API permanecem no servidor, usando a configuração já existente em Automação.

Testes isolados verificam autorização, empresa, destinatário persistido, texto apenas toxicológico, rejeição de injeção de número/mensagem, idempotência, falhas e estados da tela. Nenhuma mensagem real é enviada pelos testes.
