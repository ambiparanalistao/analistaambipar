# Auditoria, vencimentos e disponibilidade

## Uso
Em Auditoria e Vencimentos, selecione a empresa e use as abas de licenças, veículos ou motoristas. As licenças têm busca, filtros, cartões por documento, histórico e botão Editar e atualizar. Nova licença permite ampliar o cadastro.
Editar validades nos veículos/motoristas altera as colunas originais do cadastro. Frota, motoristas, prontuário, seletores e alertas consultam os mesmos registros. Salvar emite eventos de atualização; voltar o foco à janela também recarrega. O menu e o painel calculam alertas pelas datas, sem contagem fixa.
MOPP continua com validade indeterminada. Datas ausentes ficam explicitamente sem informação; não são calculadas a partir de ano de documento.

## Disponibilidade
Abrir, movimentar, cancelar ou encerrar S.OR não modifica automaticamente o status do veículo. O usuário altera disponibilidade nos cadastros ou na central. As verificações existentes de despacho, viagem ativa e S.OR aberta permanecem.
A mudança de status autenticada é auditada com valores anterior e novo e responsável. Edição de licença exige versão atual; edição de datas verifica o valor anterior para impedir sobrescrita concorrente.

## Migração de dados existentes
A empresa principal recebeu a relação de 21 placas e identificação da base auditada que já existia no repositório, antes exibida apenas como catálogo estático. Nenhum KM, chassi, ano ou dimensão foi criado por estimativa. Foram preservadas somente três datas de CIV explicitamente escritas nessa fonte. As nove licenças dessa mesma fonte foram cadastradas com suas datas explícitas. As listas operacionais consultam somente o banco; não retornam ao catálogo se o banco estiver vazio.
A migração de identificação e licenças é registrada no histórico. Os dados importados devem ser complementados nos cadastros conforme os documentos disponíveis.

## Validação
Testes SQL com rollback: isolamento entre empresas, recusa de acesso anônimo, renovação persistente, conflito de edição, campos autorizados, status manual e preservação da trava de despacho por S.OR ativa.
Playwright: renovação e recarregamento, validades no cadastro do veículo, disponibilidade manual, leitura do Supervisor e modo claro em celular. Regressões dos módulos existentes continuam na CI.

## Dossiê e dados confirmados
Dossiê Fiscalização mantém a impressão em tela inteira com todos os campos dos cadastros, licenças e referências documentais do inventário e infrações. Os dados operacionais vêm do banco; não há gravação de documentos em localStorage. Excel/PDF respeitam a seleção da central. O dashboard geral deixou de usar dados de exemplo como fallback e totais financeiros fixos; encaminha aos módulos para os indicadores detalhados.
