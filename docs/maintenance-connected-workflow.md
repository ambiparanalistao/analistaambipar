# Manutenção integrada

## Onde acessar
- Solicitações dos motoristas: gerar/acompanhar S.D.O mantém veículo, relator e defeitos originais. Cancelar S.D.O devolve relato a pendente; encerrar resolve.
- S.D.O → Propostas das oficinas: links individuais para oficinas explicitamente selecionadas, validade 30 dias. Peças, serviços, NCM opcional, garantia, pagamento e dias corridos após aprovação. Comparador importa proposta apenas em S.D.O inicial sem itens/visitas/notas; escolha exige motivo e não aprova execução.
- S.D.O → Comunicação: enviar/agendar pela Evolution. Agendamento explícito, até 90 dias. Rascunhos wa.me/mailto existentes continuam manuais.
- Controle da Frota: pneus, implementos, checklists, garantias/reincidências, fluxo de caixa, automação.
- Portal do motorista: checklist após validação WhatsApp; confirmar placa/KM antes dos itens. Defeito cria relato e dispara agradecimento pela Evolution.

## Regras e operação
RLS e RPCs verificam empresa, vínculo ativo e permissões existentes. Nenhum exemplo é criado na produção. Ativos descartados e históricos não são apagados. Pneus não ocupam duas vezes a mesma posição; KM não diminui. Custos de ativos são gerenciais, não lançam pagamento bancário nem nota automaticamente.
Garantia começa na saída registrada, ou encerramento quando não há saída. Dias vêm da proposta escolhida ou do item informado. Contagem de corretivas em 90 dias sinaliza investigação; não comprova repetição do mesmo defeito. Acionamentos de garantia exigem análise humana.
Fluxo de caixa agrega no SQL: previsto pelo vencimento da parcela, realizado pela data de pagamento menos estorno, preservando os movimentos mesmo se a nota for cancelada depois. Não é projeção de receitas nem saldo bancário.

## Processador
MAINTENANCE_WORKER_SECRET é somente servidor, sensível na Vercel; hash no schema privado e cópia cifrada no Vault. pg_cron chama maintenance_worker_private.tick a cada minuto. Tick só faz HTTP quando há trabalho devido. API processa até quatro itens por execução, com as mesmas travas das rotinas interativas. Jobs registram iniciador e execução automática; permissão do iniciador é revalidada. Não há importação de envios históricos.
Falhas confirmadas: até quatro tentativas com espera. Aceitas não repetem. Timeout/resposta incerta/lease expirada: unknown e conferência humana antes de repetir. Retomar S.D.O/relato pela ação existente após conferir WhatsApp. Jobs de mensagem unknown permanecem bloqueados; para nova mensagem, criar explicitamente novo agendamento após conferência.
O acesso de oficina usa token aleatório individual de 256 bits em fragmento, limitado ao seu próprio orçamento. Não publica agenda, contatos dos motoristas, preços de concorrentes ou financeiro. Sem upload anônimo.

## Validação
Testes SQL em transações com rollback para vínculos, isolamento, proposta/NCM, seleção sem aprovação, pneus/recapagem, checklists, worker/agendamento/resultado incerto. Testes Node do worker e regressões anteriores. Testes Playwright do portal e controles com API fictícia exclusivamente em teste, sem contaminar o banco.
