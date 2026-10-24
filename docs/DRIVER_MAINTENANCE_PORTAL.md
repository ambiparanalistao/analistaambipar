# Portal de manutenção dos motoristas

O analista gera o link em Manutenção > Solicitações dos motoristas. A rota pública é /motoristas/solicitar-manutencao#convite=TOKEN. O fragmento não é transmitido no acesso inicial nem em Referer. Apenas um convite ativo e não adivinhável permite consultar os nomes da empresa; não são expostos CPF, CNH, telefone ou dados financeiros. Renovar/desativar o convite invalida os acessos anteriores.

O motorista escolhe seu nome e confirma um código de seis números no WhatsApp cadastrado, via Evolution. Não existe login baseado apenas no nome. O código dura cinco minutos, aceita no máximo cinco tentativas, não pode ser reutilizado, e há limites de solicitação por motorista, IP e empresa. O banco armazena hash HMAC do código, nunca o código. O telefone não pode ser fornecido pelo navegador. Cadastros bloqueados, removidos ou sem WhatsApp válido não podem entrar. A sessão opaca dura doze horas e fica no sessionStorage deste navegador. O motorista vê apenas os próprios pedidos e placas da sua empresa.

Ao selecionar a placa, o KM deve ser digitado e confirmado antes de abrir os campos de defeitos e prioridade (leve, média, urgente). O banco valida que o KM não regride, atualiza o odômetro canônico e registra o relato no prontuário. A solicitação não altera a disponibilidade do veículo nem abre uma S.OR automaticamente. O texto e os dados reais do veículo são preservados como snapshot, inclusive ano e chassi, sem RENAVAM.

A gravação é idempotente pelo identificador da solicitação. Depois de gravar, uma mensagem de agradecimento e encaminhamento para análise é enviada via Evolution ao contato cadastrado do motorista. Uma falha no WhatsApp não apaga o pedido. Resultados incertos exigem conferência antes de repetir; aceitos nunca são repetidos automaticamente.

O painel separa atuais, novas, em análise, pendentes, resolvidas e todas, com busca, paginação, prioridade e contadores. Pendência, resolução e cancelamento exigem resposta ao motorista. Toda mudança e envio fica no histórico com o usuário responsável. A resposta é consultada pelo motorista no próprio portal. Ela não é enviada automaticamente pelo WhatsApp.

O encaminhamento direto às oficinas envia mensagem e Excel com o relatório completo, identificação do veículo e prioridade, solicitando avaliação, NCM de peças quando aplicável e prazo estimado em dias corridos após aprovação. Só oficinas ativas, não excluídas, da mesma empresa e com ao menos um dos tipos selecionados explicitamente marcado recebem. Sem seleção ou correspondência não há envio. O envio não autoriza um serviço nem cria uma S.OR; uma S.OR pode ser aberta pelo fluxo existente após análise. Filas persistem por destinatário, com tentativas e recibos. Os lotes são processados enquanto a plataforma está aberta; se a página fechar, os pendentes podem ser retomados no detalhe. Não existe trabalhador independente de fila.

## Configuração

DRIVER_PORTAL_SECRET é uma credencial aleatória de servidor, sem prefixo VITE_. Seu hash SHA-256 fica apenas em driver_portal_private.config; o segredo fica nas variáveis sensíveis da Vercel. A API usa esse segredo como capacidade restrita para funções do portal, sem expor service_role nem criar usuários fictícios. Não registrar o segredo, códigos ou sessões em logs. Também requer as variáveis Supabase e Evolution já usadas pelo projeto. A instância deve estar conectada para enviar códigos e confirmações. Um contato inválido deve ser corrigido no cadastro real do motorista.

Todas as tabelas têm RLS. Tabelas privadas não têm acesso direto de anon/authenticated. A função pública gateway é SECURITY INVOKER e chama implementação privada que valida a credencial de servidor e o convite; ações de motorista exigem a sessão vinculada ao motorista e à empresa. O gerenciamento administrativo exige Supabase Auth e as permissões existentes de manutenção; respeita também a liberação de módulos já configurada. A chave de servidor não tem acesso administrativo aos demais módulos.

## Verificação

Contratos SQL: isolamento entre empresas, nomes sem documentos, OTP, cooldown, código usado, sessão, KM, idempotência, agradecimento, filtros, recibos, resolução e revogação. Testes das APIs usam Evolution simulada e não enviam mensagens reais. Playwright cobre login, bloqueio por KM, prioridade, envio, consulta de resposta, painel, filtros e mobile claro/escuro. Build, lint e typecheck permanecem na CI.
